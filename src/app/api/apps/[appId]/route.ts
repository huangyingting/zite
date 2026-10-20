import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ appId: string }> }
) {
  const { appId } = await context.params;
  const app =
    (await prisma.ziteApp.findFirst({
      where: {
        OR: [
          { id: appId },
          { publicId: appId },
          { slug: appId },
          ...(appId === "app_ashgrove_crm" ? [{ slug: "ashgrove-crm" }] : []),
        ],
      },
      include: {
        workspace: {
          include: {
            tables: {
              orderBy: { orderIndex: "asc" },
              include: { records: { orderBy: { createdAt: "desc" } } },
            },
            workflows: {
              orderBy: { updatedAt: "desc" },
              include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
            },
            brandKits: true,
            integrations: true,
          },
        },
        versions: { orderBy: { versionNumber: "desc" } },
        chatThreads: { orderBy: { updatedAt: "desc" } },
        workflows: {
          orderBy: { updatedAt: "desc" },
          include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
        },
      },
    })) ||
    (await prisma.ziteApp.findFirst({
      include: {
        workspace: {
          include: {
            tables: {
              orderBy: { orderIndex: "asc" },
              include: { records: { orderBy: { createdAt: "desc" } } },
            },
            workflows: {
              orderBy: { updatedAt: "desc" },
              include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
            },
            brandKits: true,
            integrations: true,
          },
        },
        versions: { orderBy: { versionNumber: "desc" } },
        chatThreads: { orderBy: { updatedAt: "desc" } },
        workflows: {
          orderBy: { updatedAt: "desc" },
          include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
        },
      },
    }));

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const normalizedApp = {
    ...app,
    publishedUrl: `https://zite-demo-${app.publicId}.zite.so`,
    chatThreads: app.chatThreads.map((th) => ({
      ...th,
      messages: JSON.parse(th.messagesJson || "[]"),
    })),
    versions: app.versions.map((v) => ({
      ...v,
      title: v.label,
      changelog: v.summary,
      filesJson: app.monorepoFilesJson,
    })),
    workspace: {
      ...app.workspace,
      tables: app.workspace.tables.map((t) => ({
        ...t,
        slug: t.sdkName,
        fields: JSON.parse(t.fieldsJson || "[]"),
      })),
      workflows: (app.workspace.workflows?.length
        ? app.workspace.workflows
        : app.workflows
      ).map((w) => ({
        ...w,
        triggerConfig: w.triggerConfigJson,
        runs: (w.runs || []).map((r) => ({
          ...r,
          triggeredBy: r.triggeredByEmail,
          logsText: r.stepsLogJson,
        })),
      })),
    },
  };

  return NextResponse.json({ app: normalizedApp });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ appId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role cannot modify app configuration or code" },
      { status: 403 }
    );
  }

  const { appId } = await context.params;
  const app =
    (await prisma.ziteApp.findFirst({
      where: {
        OR: [
          { id: appId },
          { publicId: appId },
          { slug: appId },
          ...(appId === "app_ashgrove_crm" ? [{ slug: "ashgrove-crm" }] : []),
        ],
      },
    })) || (await prisma.ziteApp.findFirst());

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    action?: "update_styles" | "update_code" | "update_access" | "publish" | "rollback";
    styleOverrides?: Record<string, unknown>;
    filePath?: string;
    fileContent?: string;
    accessMode?: string;
    status?: string;
    loginMethods?: string[];
    accessRules?: Array<{ group: string; rule: string }>;
    targetVersionId?: string;
    versionId?: string;
    publishNote?: string;
    title?: string;
  };

  const targetVerId = body.targetVersionId || body.versionId;

  if (body.action === "rollback" && targetVerId) {
    const targetVersion = await prisma.appVersion.findUnique({
      where: { id: targetVerId },
    });
    if (!targetVersion || targetVersion.appId !== app.id) {
      return NextResponse.json({ error: "Target version not found" }, { status: 404 });
    }

    const snap = JSON.parse(targetVersion.snapshotJson || "{}");
    const updated = await prisma.ziteApp.update({
      where: { id: app.id },
      data: {
        navigationJson: snap.navigation
          ? JSON.stringify(snap.navigation)
          : app.navigationJson,
        styleOverridesJson: snap.styleOverrides
          ? JSON.stringify(snap.styleOverrides)
          : app.styleOverridesJson,
        currentVersion: targetVersion.versionNumber,
      },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });

    await recordAuditLog({
      eventType: "app.rollback",
      category: "app",
      securityCritical: true,
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "app",
      targetId: app.id,
      targetName: app.name,
      payload: {
        rolledBackToVersion: targetVersion.versionNumber,
        label: targetVersion.label,
      },
    });

    return NextResponse.json({
      app: updated,
      rolledBackTo: targetVersion,
      version: targetVersion,
    });
  }

  if (body.action === "update_styles" && body.styleOverrides) {
    const currentStyles = JSON.parse(app.styleOverridesJson || "{}");
    const mergedStyles = { ...currentStyles, ...body.styleOverrides };
    const updated = await prisma.ziteApp.update({
      where: { id: app.id },
      data: { styleOverridesJson: JSON.stringify(mergedStyles) },
    });
    return NextResponse.json({ app: updated });
  }

  if (body.action === "update_code" && body.filePath && body.fileContent !== undefined) {
    const files = JSON.parse(app.monorepoFilesJson || "{}") as Record<string, string>;
    files[body.filePath] = body.fileContent;
    const nextVersion = app.currentVersion + 1;

    const updated = await prisma.ziteApp.update({
      where: { id: app.id },
      data: {
        monorepoFilesJson: JSON.stringify(files),
        currentVersion: nextVersion,
      },
    });

    await prisma.appVersion.create({
      data: {
        appId: app.id,
        versionNumber: nextVersion,
        label: `v${nextVersion} — Edited ${body.filePath.split("/").pop()}`,
        summary: `Updated ${body.filePath} in Zite.js Monorepo Editor`,
        diffSummary: `M ${body.filePath} (${body.fileContent.length} bytes)`,
        snapshotJson: JSON.stringify({
          navigation: JSON.parse(app.navigationJson || "[]"),
          styleOverrides: JSON.parse(app.styleOverridesJson || "{}"),
        }),
        createdByEmail: user.email,
      },
    });

    return NextResponse.json({ app: updated });
  }

  if (body.action === "update_access") {
    const updated = await prisma.ziteApp.update({
      where: { id: app.id },
      data: {
        ...(body.accessMode ? { accessMode: body.accessMode } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.loginMethods
          ? { loginMethodsJson: JSON.stringify(body.loginMethods) }
          : {}),
        ...(body.accessRules
          ? { accessRulesJson: JSON.stringify(body.accessRules) }
          : {}),
      },
    });

    await recordAuditLog({
      eventType: "user.accessChange",
      category: "app",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "app",
      targetId: app.id,
      targetName: app.name,
      payload: {
        accessMode: updated.accessMode,
        status: updated.status,
      },
    });

    return NextResponse.json({ app: updated });
  }

  if (body.action === "publish") {
    const nextVersion = app.currentVersion + 1;
    const updated = await prisma.ziteApp.update({
      where: { id: app.id },
      data: {
        status: "PUBLISHED",
        currentVersion: nextVersion,
        publishedAt: new Date(),
      },
    });

    const ver = await prisma.appVersion.create({
      data: {
        appId: app.id,
        versionNumber: nextVersion,
        label: `v${nextVersion} — Published Release`,
        summary: body.publishNote || "Published live release to production URL",
        diffSummary: `Published ${app.slug}.zite.so`,
        snapshotJson: JSON.stringify({
          navigation: JSON.parse(app.navigationJson || "[]"),
          styleOverrides: JSON.parse(app.styleOverridesJson || "{}"),
        }),
        createdByEmail: user.email,
      },
    });

    await recordAuditLog({
      eventType: "app.publish",
      category: "app",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "app",
      targetId: app.id,
      targetName: app.name,
      payload: { version: nextVersion, slug: app.slug },
    });

    return NextResponse.json({ app: updated, version: ver });
  }

  return NextResponse.json({ app });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ appId: string }> }
) {
  return PATCH(request, context);
}
