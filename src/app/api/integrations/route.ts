import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import {
  encryptWorkspaceSecret,
  getMaskedSecretPreview,
} from "@/lib/secrets";

export async function GET() {
  const integrations = await prisma.workspaceIntegration.findMany({
    orderBy: { createdAt: "asc" },
  });

  const connections = integrations
    .filter((i) => i.category !== "Secret" && !i.providerId.startsWith("secret:"))
    .map((i) => ({
      ...i,
      secretMasked: getMaskedSecretPreview(i.secretMasked),
      providerSlug: i.providerId,
    }));

  const secrets = integrations
    .filter((i) => i.category === "Secret" || i.providerId.startsWith("secret:") || Boolean(i.secretMasked))
    .map((i) => ({
      id: i.id,
      name: i.providerId.startsWith("secret:") ? i.name : `${i.providerId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_SECRET`,
      maskedPreview: getMaskedSecretPreview(i.secretMasked),
      encryptedAtRest: Boolean(i.secretMasked?.startsWith("enc:v1:")),
      updatedAt: i.updatedAt,
    }));

  return NextResponse.json({
    integrations: integrations.map((i) => ({
      ...i,
      secretMasked: getMaskedSecretPreview(i.secretMasked),
    })),
    connections,
    secrets,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role cannot modify workspace integrations or secrets" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    action?: "upsertSecret" | "toggleConnection";
    workspaceId?: string;
    providerId?: string;
    name?: string;
    value?: string;
    category?: string;
    secretValue?: string;
    status?: "CONNECTED" | "DISCONNECTED";
  };

  const ws =
    (body.workspaceId
      ? await prisma.workspace.findFirst({
          where: {
            OR: [{ id: body.workspaceId }, { publicId: body.workspaceId }],
          },
        })
      : null) || (await prisma.workspace.findFirst());
  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (body.action === "upsertSecret" && body.name) {
    const cleanName = body.name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const rawVal = body.value || body.secretValue || "sec_val";
    const { storedValue, maskedPreview } = encryptWorkspaceSecret(rawVal);
    const providerKey = `secret:${cleanName}`;

    const existingSecret = await prisma.workspaceIntegration.findFirst({
      where: { workspaceId: ws.id, providerId: providerKey },
    });

    const saved = existingSecret
      ? await prisma.workspaceIntegration.update({
          where: { id: existingSecret.id },
          data: { name: cleanName, secretMasked: storedValue, status: "CONNECTED" },
        })
      : await prisma.workspaceIntegration.create({
          data: {
            workspaceId: ws.id,
            providerId: providerKey,
            name: cleanName,
            category: "Secret",
            status: "CONNECTED",
            secretMasked: storedValue,
          },
        });

    await recordAuditLog({
      eventType: "secret.upsert",
      category: "org",
      securityCritical: true,
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "secret",
      targetId: saved.id,
      targetName: cleanName,
      payload: {
        workspaceId: ws.publicId,
        secretName: cleanName,
        cipher: "AES-256-GCM",
      },
    });

    return NextResponse.json(
      {
        secret: {
          id: saved.id,
          name: saved.name,
          maskedPreview,
          encryptedAtRest: true,
        },
        integration: { ...saved, secretMasked: maskedPreview },
      },
      { status: 201 }
    );
  }

  const providerId = body.providerId || (body.name || "custom").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const existing = await prisma.workspaceIntegration.findFirst({
    where: { workspaceId: ws.id, providerId },
  });

  const masked = body.secretValue
    ? `${body.secretValue.slice(0, 6)}••••••••••••`
    : existing?.secretMasked || "zite_sec_••••••••••••";

  if (existing) {
    const nextStatus = body.status || (existing.status === "CONNECTED" ? "DISCONNECTED" : "CONNECTED");
    const updated = await prisma.workspaceIntegration.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        secretMasked: masked,
      },
    });

    await recordAuditLog({
      eventType: nextStatus === "CONNECTED" ? "integration.connect" : "integration.disconnect",
      category: "org",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "integration",
      targetId: updated.id,
      targetName: updated.name,
      payload: { providerId, status: nextStatus },
    });

    return NextResponse.json({
      integration: { ...updated, providerSlug: updated.providerId },
    });
  }

  const created = await prisma.workspaceIntegration.create({
    data: {
      workspaceId: ws.id,
      providerId,
      name: body.name || providerId,
      category: body.category || "Integration",
      status: "CONNECTED",
      secretMasked: masked,
    },
  });

  await recordAuditLog({
    eventType: "integration.connect",
    category: "org",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "integration",
    targetId: created.id,
    targetName: created.name,
    payload: { providerId, status: "CONNECTED" },
  });

  return NextResponse.json(
    { integration: { ...created, providerSlug: created.providerId } },
    { status: 201 }
  );
}
