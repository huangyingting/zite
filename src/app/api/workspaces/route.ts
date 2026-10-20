import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { ZITE_TEMPLATES } from "@/lib/zite-catalog";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tables: {
        orderBy: { orderIndex: "asc" },
        include: { _count: { select: { records: true } } },
      },
      apps: { orderBy: { updatedAt: "desc" } },
      workflows: {
        orderBy: { updatedAt: "desc" },
        include: { runs: { take: 3, orderBy: { createdAt: "desc" } } },
      },
      brandKits: true,
      integrations: true,
    },
  });

  return NextResponse.json({ workspaces, user });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role cannot create workspaces or apps" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    action?: "create_workspace" | "create_app_from_prompt" | "clone_template" | "migrate_import";
    name?: string;
    description?: string;
    prompt?: string;
    mode?: string;
    modelTier?: string;
    workspaceId?: string;
    templateSlug?: string;
    sourceTool?: string;
    csvData?: string;
  };

  // Clone template from Marketplace
  if (body.action === "clone_template" && body.templateSlug) {
    const tpl =
      ZITE_TEMPLATES.find((t) => t.slug === body.templateSlug) ||
      ZITE_TEMPLATES[0];
    const ws =
      (body.workspaceId
        ? await prisma.workspace.findUnique({ where: { id: body.workspaceId } })
        : null) || (await prisma.workspace.findFirst());

    if (!ws) {
      return NextResponse.json({ error: "No workspace available" }, { status: 400 });
    }

    const slug = `${tpl.slug}-${Math.random().toString(36).slice(2, 6)}`;
    const publicId = `zt_${Math.random().toString(36).slice(2, 10)}`;

    const app = await prisma.ziteApp.create({
      data: {
        publicId,
        slug,
        workspaceId: ws.id,
        name: tpl.name,
        description: tpl.description,
        templateCategory: tpl.category,
        color: tpl.accentColor,
        status: "PUBLISHED",
        accessMode: "INTERNAL",
        navigationJson: JSON.stringify([
          { id: "home", label: "Home" },
          { id: "leads", label: tpl.tables[0] || "Records", badge: "9" },
          { id: "deals", label: tpl.tables[1] || "Pipeline" },
          { id: "tasks", label: "Tasks" },
          { id: "reports", label: "Reports" },
        ]),
        monorepoFilesJson: JSON.stringify({
          "zite.config.json": JSON.stringify(
            { project: { name: ws.name, basePublicIdentifier: ws.publicId }, app: { name: tpl.name, slug } },
            null,
            2
          ),
          [`apps/${slug}/src/App.tsx`]: `// Cloned from Zite Marketplace Template: ${tpl.name}\nexport default function App() { return <div>${tpl.name}</div>; }`,
        }),
        currentVersion: 1,
      },
    });

    await prisma.appVersion.create({
      data: {
        appId: app.id,
        versionNumber: 1,
        label: `v1 — Cloned from ${tpl.name}`,
        summary: tpl.tagline,
        diffSummary: `+ Initialized ${tpl.tables.join(", ")} views`,
        snapshotJson: JSON.stringify({ navigation: JSON.parse(app.navigationJson) }),
        createdByEmail: user.email,
      },
    });

    await recordAuditLog({
      eventType: "app.create",
      category: "app",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "app",
      targetId: app.id,
      targetName: app.name,
      payload: { templateSlug: tpl.slug, workspaceId: ws.id },
    });

    return NextResponse.json({ app, workspaceId: ws.id }, { status: 201 });
  }

  // Create app from natural language prompt on /home
  if (body.action === "create_app_from_prompt") {
    const prompt = (body.prompt || "Business Operations App").trim();
    const ws =
      (body.workspaceId
        ? await prisma.workspace.findUnique({ where: { id: body.workspaceId } })
        : null) || (await prisma.workspace.findFirst());

    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const appName =
      body.name?.trim() ||
      prompt
        .replace(/^(build|create|make)\s+(a|an|the)?\s*/i, "")
        .slice(0, 36)
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      "Custom Zite App";
    const slug = `${appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 5)}`;
    const publicId = `fl_${Math.random().toString(36).slice(2, 10)}`;

    const app = await prisma.ziteApp.create({
      data: {
        publicId,
        slug,
        workspaceId: ws.id,
        name: appName,
        description: prompt,
        templateCategory: "Operations",
        color: "#2563EB",
        status: "PUBLISHED",
        accessMode: "INTERNAL",
        navigationJson: JSON.stringify([
          { id: "home", label: "Home" },
          { id: "leads", label: "Leads", badge: "9" },
          { id: "deals", label: "Deals" },
          { id: "tasks", label: "Tasks" },
          { id: "reports", label: "Reports" },
        ]),
        monorepoFilesJson: JSON.stringify({
          "zite.config.json": JSON.stringify(
            { project: { name: ws.name, basePublicIdentifier: ws.publicId }, app: { name: appName, slug } },
            null,
            2
          ),
          [`apps/${slug}/src/App.tsx`]: `// Generated by Zite AI Builder from prompt: ${prompt}\nexport default function GeneratedApp() { return <div>${appName}</div>; }`,
        }),
        currentVersion: 1,
      },
    });

    await prisma.appVersion.create({
      data: {
        appId: app.id,
        versionNumber: 1,
        label: "v1 — Initial AI Generation",
        summary: prompt,
        diffSummary: `+ Generated ${appName} over workspace ${ws.publicId}`,
        snapshotJson: JSON.stringify({ navigation: JSON.parse(app.navigationJson) }),
        createdByEmail: user.email,
      },
    });

    await prisma.aiChatThread.create({
      data: {
        appId: app.id,
        title: prompt.slice(0, 48),
        mode: body.mode || "auto",
        modelTier: body.modelTier || "zite-pro",
        messagesJson: JSON.stringify([
          {
            id: `msg_${Date.now()}_1`,
            role: "user",
            mode: body.mode || "auto",
            modelTier: body.modelTier || "zite-pro",
            content: prompt,
            createdAt: new Date().toISOString(),
          },
          {
            id: `msg_${Date.now()}_2`,
            role: "assistant",
            mode: body.mode || "auto",
            modelTier: body.modelTier || "zite-pro",
            provider: "copilot-sdk",
            content: `Scaffolded **${appName}** connected to your workspace database (\`${ws.publicId}\`). Ready for preview, selective edits, or workflow automation.`,
            createdAt: new Date().toISOString(),
          },
        ]),
      },
    });

    await recordAuditLog({
      eventType: "app.create",
      category: "app",
      actorUserId: user.id,
      actorEmail: user.email,
      targetType: "app",
      targetId: app.id,
      targetName: app.name,
      payload: { prompt, mode: body.mode || "auto", modelTier: body.modelTier || "zite-pro" },
    });

    return NextResponse.json({ app }, { status: 201 });
  }

  // Create new workspace
  const name = (body.name || "New Business Workspace").trim();
  const publicId = `ws_${name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 14)}_${Math.random()
    .toString(36)
    .slice(2, 5)}`;

  const workspace = await prisma.workspace.create({
    data: {
      publicId,
      name,
      description: body.description || "Unified Zite Database, Apps, and Workflows.",
      icon: "Briefcase",
      color: "#2563EB",
      ownerId: user.id,
      tables: {
        create: {
          name: "Records",
          sdkName: "records",
          description: "Primary table for workspace records",
          fieldsJson: JSON.stringify([
            { id: "fld_1", name: "Title", sdkName: "title", type: "single_line_text", primary: true },
            { id: "fld_2", name: "Status", sdkName: "status", type: "single_select", options: [{ label: "Open", color: "blue" }, { label: "Done", color: "green" }] },
            { id: "fld_3", name: "Owner", sdkName: "owner", type: "email" },
          ]),
          viewsJson: JSON.stringify([{ id: "v_1", name: "All Records", type: "grid" }]),
        },
      },
    },
    include: { tables: true, apps: true },
  });

  await recordAuditLog({
    eventType: "db.base.create",
    category: "db",
    actorUserId: user.id,
    actorEmail: user.email,
    targetType: "workspace",
    targetId: workspace.id,
    targetName: workspace.name,
    payload: { basePublicId: workspace.publicId },
  });

  return NextResponse.json({ workspace }, { status: 201 });
}
