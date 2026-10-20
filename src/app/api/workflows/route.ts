import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { decryptWorkspaceSecret } from "@/lib/secrets";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user && user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role cannot mutate or execute backend workflows" },
      { status: 403 }
    );
  }
  const actorEmail = user?.email || "dominic@ashgrovesoftware.com";
  const actorId = user?.id || null;

  const body = (await request.json()) as {
    action: "create" | "update_code" | "run" | "execute" | "replay";
    workflowId?: string;
    workspaceId?: string;
    appId?: string;
    name?: string;
    filename?: string;
    triggerType?: "schedule" | "webhook" | "app_click" | "on_demand";
    description?: string;
    code?: string;
    inputPayload?: Record<string, unknown>;
    input?: Record<string, unknown>;
    replayRunId?: string;
    runId?: string;
    generatePdf?: boolean;
  };

  if (body.action === "create" || body.action === "update_code") {
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in required to create or edit workflow code" },
        { status: 401 }
      );
    }
  }

  if (body.action === "create") {
    const ws =
      (body.workspaceId
        ? await prisma.workspace.findUnique({ where: { id: body.workspaceId } })
        : null) || (await prisma.workspace.findFirst());
    if (!ws) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const name = (body.name || "New Backend Workflow").trim();
    const filename =
      body.filename?.trim() ||
      `${name
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase())}.ts`;

    const workflow = await prisma.ziteWorkflow.create({
      data: {
        workspaceId: ws.id,
        appId: body.appId ?? null,
        name,
        filename,
        description: body.description || "Typed backend workflow endpoint using zitejs/backend",
        triggerType: body.triggerType || "on_demand",
        triggerConfigJson: JSON.stringify({ authenticated: true }),
        stepsJson: JSON.stringify([
          { id: "s1", title: "Validate Zod Input Schema", kind: "trigger", detail: filename },
          { id: "s2", title: "Execute Zite Database Query", kind: "database", detail: "zite.deals.findAll()" },
          { id: "s3", title: "Return Typed Output", kind: "code", detail: "200 OK JSON" },
        ]),
        code:
          body.code ||
          `import { z } from 'zod';\nimport { createEndpoint } from 'zitejs/backend';\nimport { zite } from 'zitejs/db';\n\nexport default createEndpoint({\n  description: ${JSON.stringify(
            name
          )},\n  authenticated: true,\n  inputSchema: z.object({ recordId: z.string().optional() }),\n  execute: async ({ input, context }) => {\n    const { records } = await zite.deals.findAll({ limit: 25 });\n    return { ok: true, count: records.length, operator: context.user?.email };\n  },\n});\n`,
      },
      include: { runs: true },
    });

    return NextResponse.json({ workflow }, { status: 201 });
  }

  const workflow =
    (body.workflowId
      ? await prisma.ziteWorkflow.findFirst({
          where: {
            OR: [
              { id: body.workflowId },
              { filename: { contains: "Pdf" } },
            ],
          },
        })
      : null) || (await prisma.ziteWorkflow.findFirst());
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  if (body.action === "update_code" && body.code !== undefined) {
    const updated = await prisma.ziteWorkflow.update({
      where: { id: workflow.id },
      data: {
        code: body.code,
        ...(body.triggerType ? { triggerType: body.triggerType } : {}),
      },
      include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    return NextResponse.json({ workflow: updated });
  }

  // Run or Replay workflow
  let inputPayload = body.inputPayload ||
    body.input || {
      dealName: "Signal Advisors — Enterprise Wealth OS",
      company: "Signal Advisors",
      amount: 245400,
    };

  const replayTargetId = body.replayRunId || body.runId;
  if (body.action === "replay" && replayTargetId) {
    const prior = await prisma.workflowRun.findUnique({
      where: { id: replayTargetId },
    });
    if (prior) {
      inputPayload = JSON.parse(prior.inputJson || "{}");
    }
  }

  const [workspaceTables, workspaceIntegrations] = await Promise.all([
    prisma.databaseTable.findMany({
      where: { workspaceId: workflow.workspaceId },
      include: { _count: { select: { records: true } } },
    }),
    prisma.workspaceIntegration.findMany({
      where: { workspaceId: workflow.workspaceId },
    }),
  ]);

  const decryptedSecretNames: string[] = [];
  for (const integ of workspaceIntegrations) {
    if (integ.providerId.startsWith("secret:") && integ.secretMasked) {
      const dec = decryptWorkspaceSecret(integ.secretMasked);
      if (dec) {
        decryptedSecretNames.push(integ.name);
      }
    }
  }

  const totalDbRecords = workspaceTables.reduce(
    (sum, t) => sum + t._count.records,
    0
  );

  const steps = JSON.parse(workflow.stepsJson || "[]") as Array<{
    title: string;
    detail?: string;
  }>;
  const stepsLog = steps.map((s, idx) => ({
    step: s.title,
    status: "SUCCESS",
    durationMs: 25 + idx * 34,
    output:
      idx === 1
        ? `Queried ${workspaceTables.length} workspace tables (${totalDbRecords} live rows) · context.secrets: [${decryptedSecretNames.join(
            ", "
          ) || "default"}]`
        : s.detail || "Completed step",
  }));

  const isPdfWorkflow =
    body.generatePdf ||
    workflow.filename.toLowerCase().includes("pdf") ||
    workflow.code.includes("ZitePdf");

  const pdfArtifactHtml = isPdfWorkflow
    ? `<div style="font-family: Georgia, serif; padding: 28px; color: #141413; background: #FAF9F5; border: 1px solid #E6E4DD; border-radius: 8px;">
  <h2 style="margin:0 0 6px; font-size: 20px;">ZITE WORKFLOW PDF ARTIFACT — ${String(
    inputPayload.company || "Ashgrove Client"
  ).toUpperCase()}</h2>
  <p style="margin:0 0 16px; font-family: Inter, sans-serif; font-size: 12px; color: #5E5D59;">Rendered by ZitePdf.renderHtml · Workflow: ${
    workflow.filename
  } · Actor: ${actorEmail}</p>
  <div style="font-family: Inter, sans-serif; font-size: 13px; border-top: 1px solid #D4D2C8; padding-top: 12px;">
    <p><strong>Deal / Subject:</strong> ${String(
      inputPayload.dealName || inputPayload.leadName || "Enterprise Agreement"
    )}</p>
    <p><strong>Contract Value:</strong> $${Number(
      inputPayload.amount || 245400
    ).toLocaleString()}</p>
    <p><strong>Workspace DB Context:</strong> ${workspaceTables.length} tables · ${totalDbRecords} records</p>
    <p><strong>Status:</strong> Approved & Signed Ready</p>
  </div>
</div>`
    : null;

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      workspaceId: workflow.workspaceId,
      triggerSource: body.action === "replay" ? "replay" : workflow.triggerType,
      status: "SUCCESS",
      durationMs: stepsLog.reduce((acc, s) => acc + s.durationMs, 18),
      inputJson: JSON.stringify(inputPayload),
      outputJson: JSON.stringify({
        ok: true,
        workflow: workflow.filename,
        executedAt: new Date().toISOString(),
        pdfGenerated: Boolean(pdfArtifactHtml),
        workspaceTablesQueried: workspaceTables.length,
        workspaceRecordsCount: totalDbRecords,
        injectedSecretKeys: decryptedSecretNames,
      }),
      stepsLogJson: JSON.stringify(stepsLog),
      pdfArtifactHtml,
      triggeredByEmail: actorEmail,
    },
  });

  await recordAuditLog({
    eventType: "workflow.execute",
    category: "workflow",
    actorUserId: actorId,
    actorEmail,
    targetType: "workflow",
    targetId: workflow.id,
    targetName: workflow.name,
    payload: {
      runId: run.id,
      triggerSource: run.triggerSource,
      pdfGenerated: Boolean(pdfArtifactHtml),
    },
  });

  return NextResponse.json({ run }, { status: 201 });
}
