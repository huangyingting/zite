import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const { id } = await context.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    action?: "changeRole" | "revoke" | "restore";
    role?: "ADMIN" | "EDITOR" | "VIEWER";
    status?: "ACTIVE" | "REVOKED" | "DISABLED";
    aiCreditLimit?: number;
  };

  if (body.action === "revoke") {
    body.status = "REVOKED";
  } else if (body.action === "restore") {
    body.status = "ACTIVE";
  }

  const data: Record<string, unknown> = {};
  let incrementSession = false;

  if (body.role && ["ADMIN", "EDITOR", "VIEWER"].includes(body.role) && body.role !== target.role) {
    data.role = body.role;
    incrementSession = true;
    await recordAuditLog({
      eventType: "user.roleChange",
      category: "user",
      securityCritical: true,
      actorUserId: actor.id,
      actorEmail: actor.email,
      targetType: "user",
      targetId: target.id,
      targetName: target.email,
      payload: { email: target.email, from: target.role, to: body.role },
    });
  }

  if (
    body.status &&
    ["ACTIVE", "REVOKED", "DISABLED"].includes(body.status) &&
    body.status !== target.status
  ) {
    data.status = body.status;
    data.revokedAt = body.status === "ACTIVE" ? null : new Date();
    incrementSession = true;
    await recordAuditLog({
      eventType: body.status === "ACTIVE" ? "user.accessChange" : "user.disable",
      category: "user",
      securityCritical: true,
      actorUserId: actor.id,
      actorEmail: actor.email,
      targetType: "user",
      targetId: target.id,
      targetName: target.email,
      payload: {
        email: target.email,
        from: target.status,
        to: body.status,
        sessionInvalidated: true,
      },
    });
  }

  if (typeof body.aiCreditLimit === "number" && body.aiCreditLimit !== target.aiCreditLimit) {
    data.aiCreditLimit = Math.max(0, body.aiCreditLimit);
    await recordAuditLog({
      eventType: "user.creditLimitChange",
      category: "user",
      securityCritical: true,
      actorUserId: actor.id,
      actorEmail: actor.email,
      targetType: "user",
      targetId: target.id,
      targetName: target.email,
      payload: {
        email: target.email,
        from: target.aiCreditLimit,
        to: body.aiCreditLimit,
      },
    });
  }

  if (incrementSession) {
    data.sessionVersion = { increment: 1 };
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      sessionVersion: true,
      aiCreditLimit: true,
      aiCreditsUsed: true,
      revokedAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}
