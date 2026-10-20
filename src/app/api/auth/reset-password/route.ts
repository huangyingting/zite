import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateInvitationToken,
  hashInvitationToken,
  normalizeEmail,
} from "@/lib/account-admission/token";
import { hashPassword } from "@/lib/account-admission/password";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "request" | "complete";
    email?: string;
    token?: string;
    newPassword?: string;
  };

  if (body.action === "complete" && body.token && body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const tokenHash = hashInvitationToken(body.token);
    const resetEntry = await prisma.orgSetting.findUnique({
      where: { key: `pwd_reset:${tokenHash}` },
    });

    if (!resetEntry) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token." },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(resetEntry.valueJson) as {
      userId: string;
      email: string;
      expiresAt: string;
      used?: boolean;
    };

    if (parsed.used || new Date(parsed.expiresAt).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "This password reset token has expired or already been used." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(body.newPassword);

    await prisma.$transaction([
      prisma.passwordCredential.upsert({
        where: { userId: parsed.userId },
        create: { userId: parsed.userId, passwordHash },
        update: { passwordHash },
      }),
      prisma.user.update({
        where: { id: parsed.userId },
        data: { sessionVersion: { increment: 1 } },
      }),
      prisma.orgSetting.update({
        where: { key: `pwd_reset:${tokenHash}` },
        data: { valueJson: JSON.stringify({ ...parsed, used: true }) },
      }),
    ]);

    await recordAuditLog({
      eventType: "auth.passwordReset.complete",
      category: "auth",
      securityCritical: true,
      actorUserId: parsed.userId,
      actorEmail: parsed.email,
      targetType: "user",
      targetId: parsed.userId,
      targetName: parsed.email,
      payload: { sessionVersionIncremented: true },
    });

    return NextResponse.json({ ok: true });
  }

  // Default action: request password reset
  const email = normalizeEmail(body.email || "");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  let demoResetToken: string | undefined;

  if (user && user.status === "ACTIVE") {
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await prisma.orgSetting.upsert({
      where: { key: `pwd_reset:${tokenHash}` },
      create: {
        key: `pwd_reset:${tokenHash}`,
        valueJson: JSON.stringify({
          userId: user.id,
          email: user.email,
          expiresAt,
          used: false,
        }),
      },
      update: {
        valueJson: JSON.stringify({
          userId: user.id,
          email: user.email,
          expiresAt,
          used: false,
        }),
      },
    });

    demoResetToken = rawToken;
  }

  await recordAuditLog({
    eventType: "auth.passwordReset.request",
    category: "auth",
    securityCritical: true,
    actorUserId: user?.id ?? null,
    actorEmail: email,
    targetType: "user",
    targetId: user?.id ?? email,
    targetName: email,
    payload: { accountFoundAndActive: Boolean(user && user.status === "ACTIVE") },
  });

  return NextResponse.json({
    ok: true,
    message:
      "If that email belongs to an active workspace member, a single-use reset token has been issued.",
    ...(process.env.NODE_ENV !== "production" && demoResetToken
      ? { resetToken: demoResetToken }
      : {}),
  });
}
