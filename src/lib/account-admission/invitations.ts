import { prisma } from "@/lib/prisma";
import { hashPassword } from "./password";
import { generateInvitationToken, hashInvitationToken, normalizeEmail } from "./token";
import { recordAuditLog } from "@/lib/audit";

export type ZiteRole = "ADMIN" | "EDITOR" | "VIEWER";

export interface CreateInvitationInput {
  email: string;
  role: ZiteRole;
  expiresInHours?: number;
  invitedByUserId: string;
  invitedByEmail: string;
}

export async function createInvitation(input: CreateInvitationInput) {
  const email = normalizeEmail(input.email);
  const role: ZiteRole = ["ADMIN", "EDITOR", "VIEWER"].includes(input.role)
    ? input.role
    : "VIEWER";
  const expiresInHours = Math.max(1, Math.min(720, input.expiresInHours ?? 72));
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const existingActiveUser = await prisma.user.findUnique({ where: { email } });
  if (existingActiveUser && existingActiveUser.status === "ACTIVE") {
    throw new Error(`An active user with email ${email} already exists.`);
  }

  // Revoke any previous pending invitations for the same email
  await prisma.accountInvitation.updateMany({
    where: { email, status: "PENDING" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  const rawToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(rawToken);
  const tokenPreview = rawToken.slice(0, 14) + "…";

  const invitation = await prisma.accountInvitation.create({
    data: {
      email,
      role,
      tokenHash,
      tokenPreview,
      status: "PENDING",
      expiresAt,
      invitedByUserId: input.invitedByUserId,
    },
    include: {
      invitedBy: { select: { id: true, email: true, name: true } },
    },
  });

  await recordAuditLog({
    eventType: "user.invite",
    category: "user",
    actorUserId: input.invitedByUserId,
    actorEmail: input.invitedByEmail,
    targetType: "invitation",
    targetId: invitation.id,
    targetName: email,
    payload: { email, role, expiresAt: expiresAt.toISOString() },
  });

  return {
    invitation,
    rawToken,
    inviteUrl: `/invite/signup?token=${encodeURIComponent(rawToken)}`,
  };
}

export async function validateInvitationToken(rawToken: string) {
  if (!rawToken || !rawToken.trim()) {
    return { valid: false, reason: "Missing invitation token." };
  }

  const tokenHash = hashInvitationToken(rawToken);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    include: {
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return { valid: false, reason: "Could not find invite. Try pasting the full link you got in your email." };
  }

  if (invitation.status === "ACCEPTED") {
    return { valid: false, reason: "This invitation has already been used.", status: "ACCEPTED" };
  }

  if (invitation.status === "REVOKED") {
    return { valid: false, reason: "This invitation has been revoked by an administrator.", status: "REVOKED" };
  }

  if (invitation.status === "EXPIRED" || invitation.expiresAt.getTime() <= Date.now()) {
    if (invitation.status === "PENDING") {
      await prisma.accountInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    }
    return { valid: false, reason: "Sorry, this invitation link has expired!", status: "EXPIRED" };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as ZiteRole,
      expiresAt: invitation.expiresAt.toISOString(),
      invitedByName: invitation.invitedBy?.name || invitation.invitedBy?.email || "Zite Admin",
    },
  };
}

export async function acceptInvitation(params: {
  rawToken: string;
  name: string;
  password: string;
}) {
  const validation = await validateInvitationToken(params.rawToken);
  if (!validation.valid || !validation.invitation) {
    throw new Error(validation.reason || "Invalid invitation token.");
  }

  if (!params.password || params.password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const tokenHash = hashInvitationToken(params.rawToken);
  const passwordHash = await hashPassword(params.password);
  const now = new Date();

  const user = await prisma.$transaction(async (tx) => {
    const invite = await tx.accountInvitation.findUnique({
      where: { tokenHash },
    });
    if (!invite || invite.status !== "PENDING" || invite.expiresAt.getTime() <= Date.now()) {
      throw new Error("Invitation is no longer valid.");
    }

    const existing = await tx.user.findUnique({ where: { email: invite.email } });
    let targetUser;

    if (existing) {
      targetUser = await tx.user.update({
        where: { id: existing.id },
        data: {
          name: params.name.trim() || existing.name || invite.email.split("@")[0],
          role: invite.role,
          status: "ACTIVE",
          revokedAt: null,
          invitedById: invite.invitedByUserId,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.passwordCredential.upsert({
        where: { userId: existing.id },
        create: { userId: existing.id, passwordHash, passwordUpdatedAt: now },
        update: { passwordHash, passwordUpdatedAt: now },
      });
    } else {
      targetUser = await tx.user.create({
        data: {
          email: invite.email,
          name: params.name.trim() || invite.email.split("@")[0],
          role: invite.role,
          status: "ACTIVE",
          invitedById: invite.invitedByUserId,
          passwordCredential: {
            create: {
              passwordHash,
              passwordUpdatedAt: now,
            },
          },
        },
      });
    }

    await tx.accountInvitation.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        acceptedByUserId: targetUser.id,
        acceptedAt: now,
      },
    });

    return targetUser;
  });

  await recordAuditLog({
    eventType: "user.invite.accept",
    category: "user",
    securityCritical: true,
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "user",
    targetId: user.id,
    targetName: user.email,
    payload: { email: user.email, role: user.role },
  });

  return user;
}

export async function rotateInvitation(params: {
  invitationId: string;
  actorUserId: string;
  actorEmail: string;
  expiresInHours?: number;
}) {
  const existing = await prisma.accountInvitation.findUnique({
    where: { id: params.invitationId },
  });
  if (!existing) {
    throw new Error("Invitation not found.");
  }
  if (existing.status === "ACCEPTED") {
    throw new Error("Cannot rotate an already accepted invitation.");
  }

  const rawToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(rawToken);
  const tokenPreview = rawToken.slice(0, 14) + "…";
  const expiresAt = new Date(Date.now() + (params.expiresInHours ?? 72) * 60 * 60 * 1000);

  const updated = await prisma.accountInvitation.update({
    where: { id: existing.id },
    data: {
      tokenHash,
      tokenPreview,
      status: "PENDING",
      expiresAt,
      rotatedAt: new Date(),
      revokedAt: null,
    },
  });

  await recordAuditLog({
    eventType: "user.invite.resend",
    category: "user",
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    targetType: "invitation",
    targetId: updated.id,
    targetName: updated.email,
    payload: { email: updated.email, rotated: true, expiresAt: expiresAt.toISOString() },
  });

  return {
    invitation: updated,
    rawToken,
    inviteUrl: `/invite/signup?token=${encodeURIComponent(rawToken)}`,
  };
}

export async function revokeInvitation(params: {
  invitationId: string;
  actorUserId: string;
  actorEmail: string;
}) {
  const existing = await prisma.accountInvitation.findUnique({
    where: { id: params.invitationId },
  });
  if (!existing) {
    throw new Error("Invitation not found.");
  }

  const updated = await prisma.accountInvitation.update({
    where: { id: existing.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  await recordAuditLog({
    eventType: "user.invite.revoke",
    category: "user",
    actorUserId: params.actorUserId,
    actorEmail: params.actorEmail,
    targetType: "invitation",
    targetId: updated.id,
    targetName: updated.email,
    payload: { email: updated.email },
  });

  return updated;
}
