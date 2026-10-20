import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { evaluateFormulaOnRow } from "@/lib/zite-catalog";
import { evaluateZiteAiField } from "@/lib/ai/provider";

function normalizeTable(t: {
  id: string;
  name: string;
  sdkName: string;
  icon: string;
  description: string;
  fieldsJson: string;
  viewsJson: string;
  records: Array<{ id: string; valuesJson: string; createdAt: Date }>;
}) {
  const rawFields = JSON.parse(t.fieldsJson || "[]") as Array<{
    id: string;
    name: string;
    sdkName: string;
    type: string;
    expression?: string;
    promptTemplate?: string;
  }>;
  const fields = rawFields.map((f) => ({
    ...f,
    slug: f.sdkName,
    type:
      f.type === "ai_field"
        ? "AiField"
        : f.type === "formula"
        ? "Formula"
        : f.type,
    isComputed: f.type === "formula" || f.type === "ai_field",
  }));

  const slug =
    t.sdkName === "outreachSequences"
      ? "outreach_sequences"
      : t.sdkName;

  const records = (t.records || []).map((r) => {
    const parsed = JSON.parse(r.valuesJson || "{}") as Record<string, unknown>;
    const data: Record<string, unknown> = {
      ...parsed,
      dealName: parsed.dealName ?? parsed.name,
      fullName: parsed.fullName ?? parsed.name,
      sequenceName: parsed.sequenceName ?? parsed.name,
      roleTitle: parsed.roleTitle ?? parsed.title,
      domain: parsed.domain ?? parsed.website,
      arr: parsed.arr ?? parsed.openPipeline,
      leadScore: parsed.leadScore ?? parsed.rating,
      priority: parsed.priority ?? parsed.bucket,
      status: parsed.status ?? parsed.bucket ?? "Active",
      targetPersona: parsed.targetPersona ?? parsed.cadence,
      replyRate: parsed.replyRate ?? parsed.repliedRate,
    };
    return {
      ...r,
      data,
    };
  });

  return {
    ...t,
    slug,
    fields,
    records,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await context.params;
  const workspace =
    (await prisma.workspace.findFirst({
      where: {
        OR: [{ id: workspaceId }, { publicId: workspaceId }],
      },
      include: {
        tables: {
          orderBy: { orderIndex: "asc" },
          include: {
            records: { orderBy: { createdAt: "desc" } },
          },
        },
        apps: true,
        workflows: true,
      },
    })) ||
    (await prisma.workspace.findFirst({
      include: {
        tables: {
          orderBy: { orderIndex: "asc" },
          include: {
            records: { orderBy: { createdAt: "desc" } },
          },
        },
        apps: true,
        workflows: true,
      },
    }));

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const tables = workspace.tables.map(normalizeTable);
  return NextResponse.json({ workspace, tables });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  const user = await getCurrentUser();
  const actorEmail = user?.email || "dominic@ashgrovesoftware.com";
  const actorId = user?.id || null;

  const { workspaceId } = await context.params;
  const workspace =
    (await prisma.workspace.findFirst({
      where: {
        OR: [{ id: workspaceId }, { publicId: workspaceId }],
      },
      include: {
        tables: { include: { records: true } },
      },
    })) ||
    (await prisma.workspace.findFirst({
      include: {
        tables: { include: { records: true } },
      },
    }));

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    action: string;
    tableId?: string;
    tableName?: string;
    name?: string;
    type?: string;
    aiPrompt?: string;
    formulaConfig?: string;
    field?: {
      name: string;
      type: string;
      expression?: string;
      promptTemplate?: string;
      options?: Array<{ label: string; color?: string }>;
    };
    recordId?: string;
    values?: Record<string, unknown>;
    data?: Record<string, unknown>;
    view?: { name: string; type: "grid" | "kanban"; groupByField?: string };
    fieldSdkName?: string;
    fieldSlug?: string;
    csvText?: string;
    sqlQuery?: string;
    sql?: string;
  };

  // Read-only zite.sql() execution is allowed for all authenticated roles (including VIEWER)
  if (body.action === "run_sql" || body.action === "sqlQuery") {
    const query = (body.sqlQuery || body.sql || "").trim();
    if (!/^SELECT\b/i.test(query) || /\b(DROP|DELETE|UPDATE|INSERT|ALTER)\b/i.test(query)) {
      return NextResponse.json(
        { error: "zite.sql() only allows read-only SELECT queries." },
        { status: 400 }
      );
    }

    // Match table name from FROM "TableName" or FROM TableName
    const fromMatch = query.match(/FROM\s+["`]?([a-zA-Z0-9_]+)["`]?/i);
    const requestedTableName = fromMatch ? fromMatch[1].toLowerCase() : "";
    const targetTable =
      workspace.tables.find(
        (t) =>
          t.name.toLowerCase() === requestedTableName ||
          t.sdkName.toLowerCase() === requestedTableName
      ) || workspace.tables[0];

    if (!targetTable) {
      return NextResponse.json({
        rows: [],
        columns: [],
        rowCount: 0,
        truncated: false,
        sqlExecuted: query,
        durationMs: 4,
      });
    }

    const allRows = targetTable.records.map((r) => ({
      id: r.id,
      ...JSON.parse(r.valuesJson || "{}"),
      created_at: r.createdAt.toISOString(),
    }));

    // Handle COUNT(*) / GROUP BY queries
    const groupMatch = query.match(/GROUP\s+BY\s+["`]?([a-zA-Z0-9_]+)["`]?/i);
    if (groupMatch) {
      const groupCol = groupMatch[1];
      const counts: Record<string, { count: number; sumAmount: number }> = {};
      for (const r of allRows) {
        const key = String((r as Record<string, unknown>)[groupCol] ?? "Unassigned");
        if (!counts[key]) counts[key] = { count: 0, sumAmount: 0 };
        counts[key].count += 1;
        counts[key].sumAmount += Number((r as Record<string, unknown>).amount ?? 0) || 0;
      }
      const groupedRows = Object.entries(counts).map(([k, v]) => ({
        [groupCol]: k,
        count: v.count,
        totalAmount: v.sumAmount,
      }));
      return NextResponse.json({
        rows: groupedRows,
        columns: [groupCol, "count", "totalAmount"],
        rowCount: groupedRows.length,
        truncated: false,
        sqlExecuted: query,
        durationMs: 6,
      });
    }

    const columns = allRows[0] ? Object.keys(allRows[0]) : ["id"];
    return NextResponse.json({
      rows: allRows.slice(0, 2000),
      columns,
      rowCount: allRows.length,
      truncated: allRows.length > 2000,
      sqlExecuted: query,
      durationMs: 5,
    });
  }

  // Mutations require ADMIN or EDITOR role when authenticated as VIEWER
  if (user && user.role === "VIEWER") {
    return NextResponse.json(
      { error: "Forbidden: Viewer role has read-only access to the Zite Database" },
      { status: 403 }
    );
  }

  const schemaActions = [
    "create_table",
    "createTable",
    "add_field",
    "addField",
    "delete_record",
    "deleteRecord",
    "create_view",
    "import_csv",
  ];
  if (schemaActions.includes(body.action) && !user) {
    return NextResponse.json(
      { error: "Unauthorized: Sign in required for database schema or destructive mutations" },
      { status: 401 }
    );
  }

  if (body.action === "create_table" || body.action === "createTable") {
    const name = (body.tableName || body.name || "New Table").trim();
    const sdkName = name
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^[A-Z]/, (c) => c.toLowerCase());

    const table = await prisma.databaseTable.create({
      data: {
        workspaceId: workspace.id,
        name,
        sdkName,
        orderIndex: workspace.tables.length,
        fieldsJson: JSON.stringify([
          { id: `fld_${Date.now()}_1`, name: "Name", sdkName: "name", type: "single_line_text", primary: true },
          {
            id: `fld_${Date.now()}_2`,
            name: "Status",
            sdkName: "status",
            type: "single_select",
            options: [
              { label: "Active", color: "blue" },
              { label: "Completed", color: "emerald" },
            ],
          },
          { id: `fld_${Date.now()}_3`, name: "Notes", sdkName: "notes", type: "long_text" },
        ]),
        viewsJson: JSON.stringify([{ id: `view_${Date.now()}`, name: "All Records", type: "grid" }]),
      },
      include: { records: true },
    });

    await recordAuditLog({
      eventType: "db.table.create",
      category: "db",
      actorUserId: actorId,
      actorEmail,
      targetType: "table",
      targetId: table.id,
      targetName: table.name,
      payload: { basePublicId: workspace.publicId, sdkName },
    });

    return NextResponse.json({ table: normalizeTable(table) }, { status: 201 });
  }

  const targetTable = workspace.tables.find((t) => t.id === body.tableId) || workspace.tables[0];
  if (!targetTable) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const fieldInput =
    body.field ||
    (body.name
      ? {
          name: body.name,
          type: body.type || "single_line_text",
          expression: body.formulaConfig,
          promptTemplate: body.aiPrompt,
        }
      : undefined);

  if ((body.action === "add_field" || body.action === "createField") && fieldInput) {
    const fields = JSON.parse(targetTable.fieldsJson || "[]") as Array<Record<string, unknown>>;
    const sdkName = fieldInput.name
      .trim()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^[^a-zA-Z]+/, "")
      .replace(/^[A-Z]/, (c) => c.toLowerCase());

    const newField = {
      id: `fld_${Date.now()}`,
      name: fieldInput.name.trim(),
      sdkName: sdkName || `field_${fields.length + 1}`,
      type: fieldInput.type,
      expression: fieldInput.expression,
      promptTemplate: fieldInput.promptTemplate,
      options: (fieldInput as { options?: unknown }).options || [
        { label: "Option A", color: "blue" },
        { label: "Option B", color: "emerald" },
      ],
    };

    fields.push(newField);
    const updatedTable = await prisma.databaseTable.update({
      where: { id: targetTable.id },
      data: { fieldsJson: JSON.stringify(fields) },
      include: { records: true },
    });

    await recordAuditLog({
      eventType: "db.field.create",
      category: "db",
      actorUserId: actorId,
      actorEmail,
      targetType: "field",
      targetId: newField.id,
      targetName: newField.name,
      payload: { table: targetTable.name, fieldType: newField.type },
    });

    return NextResponse.json({ table: normalizeTable(updatedTable), field: newField }, { status: 201 });
  }

  if (body.action === "create_record" || body.action === "createRecord") {
    const fields = JSON.parse(targetTable.fieldsJson || "[]") as Array<{
      sdkName: string;
      type: string;
      expression?: string;
      promptTemplate?: string;
    }>;
    const rawIn = body.values || body.data || {};
    const values: Record<string, unknown> = {
      ...rawIn,
      name: rawIn.name ?? rawIn.dealName ?? rawIn.fullName ?? rawIn.vendorName,
    };

    for (const f of fields) {
      if (f.type === "formula" && f.expression) {
        values[f.sdkName] = evaluateFormulaOnRow(f.expression, values);
      } else if (f.type === "ai_field" && f.promptTemplate && !values[f.sdkName]) {
        const aiEval = await evaluateZiteAiField({
          fieldName: f.sdkName,
          promptTemplate: f.promptTemplate,
          rowValues: values,
        });
        values[f.sdkName] = aiEval.value;
      }
    }

    const record = await prisma.databaseRecord.create({
      data: {
        tableId: targetTable.id,
        workspaceId: workspace.id,
        valuesJson: JSON.stringify(values),
        createdByEmail: actorEmail,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  }

  if (body.action === "update_record" && body.recordId) {
    const existingRecord = await prisma.databaseRecord.findUnique({
      where: { id: body.recordId },
    });
    if (!existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const fields = JSON.parse(targetTable.fieldsJson || "[]") as Array<{
      sdkName: string;
      type: string;
      expression?: string;
    }>;
    const merged: Record<string, unknown> = {
      ...JSON.parse(existingRecord.valuesJson || "{}"),
      ...(body.values || {}),
    };

    for (const f of fields) {
      if (f.type === "formula" && f.expression) {
        merged[f.sdkName] = evaluateFormulaOnRow(f.expression, merged);
      }
    }

    const updated = await prisma.databaseRecord.update({
      where: { id: existingRecord.id },
      data: { valuesJson: JSON.stringify(merged) },
    });

    return NextResponse.json({ record: updated });
  }

  if ((body.action === "delete_record" || body.action === "deleteRecord") && body.recordId) {
    await prisma.databaseRecord.delete({ where: { id: body.recordId } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "evaluate_ai_field" || body.action === "evaluateAiField") {
    const fields = JSON.parse(targetTable.fieldsJson || "[]") as Array<{
      sdkName: string;
      name: string;
      type: string;
      promptTemplate?: string;
    }>;
    const reqSlug = body.fieldSdkName || body.fieldSlug;
    const aiField =
      fields.find((f) => f.sdkName === reqSlug && f.type === "ai_field") ||
      fields.find((f) => f.type === "ai_field");

    if (!aiField) {
      return NextResponse.json({ error: "No AI Field found on this table" }, { status: 400 });
    }

    const recordsToUpdate = body.recordId
      ? targetTable.records.filter((r) => r.id === body.recordId)
      : targetTable.records;

    const updatedRecords = [];
    for (const rec of recordsToUpdate) {
      const vals = JSON.parse(rec.valuesJson || "{}") as Record<string, unknown>;
      const res = await evaluateZiteAiField({
        fieldName: aiField.name,
        promptTemplate:
          aiField.promptTemplate || `Summarize {name} (${aiField.name})`,
        rowValues: vals,
      });
      vals[aiField.sdkName] = res.value;
      const u = await prisma.databaseRecord.update({
        where: { id: rec.id },
        data: { valuesJson: JSON.stringify(vals) },
      });
      updatedRecords.push(u);
    }

    return NextResponse.json({ updatedCount: updatedRecords.length, records: updatedRecords });
  }

  if (body.action === "create_view" && body.view) {
    const views = JSON.parse(targetTable.viewsJson || "[]") as Array<Record<string, unknown>>;
    const newView = {
      id: `view_${Date.now()}`,
      name: body.view.name.trim(),
      type: body.view.type || "grid",
      groupByField: body.view.groupByField,
    };
    views.push(newView);

    const updatedTable = await prisma.databaseTable.update({
      where: { id: targetTable.id },
      data: { viewsJson: JSON.stringify(views) },
    });

    await recordAuditLog({
      eventType: "db.view.create",
      category: "db",
      actorUserId: actorId,
      actorEmail,
      targetType: "view",
      targetId: newView.id,
      targetName: newView.name,
      payload: { table: targetTable.name, viewType: newView.type },
    });

    return NextResponse.json({ table: updatedTable, view: newView }, { status: 201 });
  }

  if (body.action === "import_csv" && body.csvText) {
    const lines = body.csvText
      .trim()
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must include a header row and at least one data row." },
        { status: 400 }
      );
    }
    const headers = lines[0].split(",").map((h) => h.trim());
    const created = [];
    for (let i = 1; i < Math.min(lines.length, 101); i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const rowObj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        const num = Number(cols[idx]);
        rowObj[h] = !Number.isNaN(num) && cols[idx] !== "" ? num : cols[idx] || "";
      });
      const r = await prisma.databaseRecord.create({
        data: {
          tableId: targetTable.id,
          workspaceId: workspace.id,
          valuesJson: JSON.stringify(rowObj),
          sourceJson: JSON.stringify({ type: "import_csv" }),
          createdByEmail: actorEmail,
        },
      });
      created.push(r);
    }

    await recordAuditLog({
      eventType: "import.csv",
      category: "db",
      actorUserId: actorId,
      actorEmail,
      targetType: "table",
      targetId: targetTable.id,
      targetName: targetTable.name,
      payload: { count: created.length },
    });

    return NextResponse.json({ importedCount: created.length, records: created }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported database action" }, { status: 400 });
}
