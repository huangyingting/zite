"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StudioShell } from "@/components/StudioShell";
import { ZITE_FIELD_TYPES } from "@/lib/zite-catalog";
import {
  Database,
  Plus,
  Sparkles,
  Terminal,
  Download,
  Search,
  Columns,
  LayoutGrid,
  Trash2,
} from "lucide-react";

export default function DatabaseStudioPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId || "ws_ashgrove_crm";

  const [tables, setTables] = useState<any[]>([]);
  const [activeTableId, setActiveTableId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "kanban" | "sql">("grid");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add Field state
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("SingleLineText");
  const [newFieldPrompt, setNewFieldPrompt] = useState("");

  // Add Record state
  const [showAddRow, setShowAddRow] = useState(false);
  const [draftRow, setDraftRow] = useState<Record<string, any>>({});

  // SQL Runner state
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT dealName, stage, amount, probability, weightedValue, ownerEmail FROM "Deals" ORDER BY amount DESC'
  );
  const [sqlResult, setSqlResult] = useState<{
    rows: any[];
    sqlExecuted: string;
    durationMs: number;
  } | null>(null);

  async function loadDatabase() {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/database`);
    const data = await res.json();
    const list = data.tables || [];
    setTables(list);
    if (list.length > 0 && !activeTableId) {
      setActiveTableId(list[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDatabase();
  }, [workspaceId]);

  const activeTable =
    tables.find((t) => t.id === activeTableId) || tables[0] || null;

  const filteredRecords = (activeTable?.records || []).filter((r: any) => {
    if (!search.trim()) return true;
    return JSON.stringify(r.data)
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTable || !newFieldName.trim()) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/database`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createField",
        tableId: activeTable.id,
        name: newFieldName.trim(),
        type: newFieldType,
        aiPrompt: newFieldType === "AiField" ? newFieldPrompt : undefined,
        formulaConfig:
          newFieldType === "Formula" ? "ROUND(amount * 0.1, 2)" : undefined,
      }),
    });
    if (res.ok) {
      setNewFieldName("");
      setNewFieldPrompt("");
      await loadDatabase();
    }
  }

  async function handleCreateRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTable) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/database`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createRecord",
        tableId: activeTable.id,
        data: draftRow,
      }),
    });
    if (res.ok) {
      setDraftRow({});
      setShowAddRow(false);
      await loadDatabase();
    }
  }

  async function handleDeleteRecord(recordId: string) {
    await fetch(`/api/workspaces/${workspaceId}/database`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteRecord",
        recordId,
      }),
    });
    await loadDatabase();
  }

  async function handleEvaluateAiField(recordId: string, fieldSlug: string) {
    await fetch(`/api/workspaces/${workspaceId}/database`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "evaluateAiField",
        recordId,
        fieldSlug,
        promptTemplate:
          "Generate a concise executive deal summary and next action for {dealName} ({stage}, ${amount}).",
      }),
    });
    await loadDatabase();
  }

  async function handleRunSql(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/workspaces/${workspaceId}/database`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sqlQuery",
        sql: sqlQuery,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSqlResult(data);
    }
  }

  function exportCsv() {
    if (!activeTable) return;
    const cols = activeTable.fields.map((f: any) => f.slug);
    const header = cols.join(",");
    const rows = filteredRecords.map((r: any) =>
      cols
        .map((c: string) => `"${String(r.data[c] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTable.slug}-export.csv`;
    a.click();
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
              Zite Database (`zitejs/db`) · Workspace: {workspaceId}
            </div>
            <h1 className="font-editorial text-3xl text-[#141413]">
              Relational Tables, AI Fields & `zite.sql()` Studio
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="db-view-grid"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                viewMode === "grid"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "border border-[#D4D2C8] bg-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              data-testid="db-view-kanban"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                viewMode === "kanban"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "border border-[#D4D2C8] bg-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              data-testid="db-view-sql"
              onClick={() => setViewMode("sql")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                viewMode === "sql"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "border border-[#D4D2C8] bg-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>zite.sql() Runner</span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs font-medium hover:bg-[#F3F1EC]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E6E4DD]">
          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`db-table-tab-${t.slug}`}
              onClick={() => setActiveTableId(t.id)}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-medium whitespace-nowrap transition ${
                activeTable?.id === t.id
                  ? "bg-white border border-b-0 border-[#E6E4DD] text-[#141413] font-semibold"
                  : "text-[#5E5D59] hover:text-[#141413]"
              }`}
            >
              {t.icon} {t.name}{" "}
              <span className="ml-1 text-[10px] text-[#5E5D59]">
                ({t.records?.length || 0})
              </span>
            </button>
          ))}
        </div>

        {loading || !activeTable ? (
          <div className="text-xs text-[#5E5D59]">Loading Zite Database...</div>
        ) : viewMode === "sql" ? (
          /* SQL Runner View */
          <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#059669]" />
                <span>Parameterized Read-Only SQL (`zite.sql`)</span>
              </h2>
              <span className="text-xs text-[#5E5D59]">
                Supports SELECT, JOIN, GROUP BY, CTEs (up to 1,000 rows)
              </span>
            </div>
            <form onSubmit={handleRunSql} className="space-y-3">
              <textarea
                rows={3}
                data-testid="sql-runner-textarea"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#D4D2C8] font-mono text-xs bg-[#FAF9F5]"
              />
              <button
                type="submit"
                data-testid="sql-runner-execute"
                className="px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
              >
                Execute `zite.sql` Query
              </button>
            </form>

            {sqlResult && (
              <div
                data-testid="sql-runner-results"
                className="space-y-2 pt-3 border-t border-[#E6E4DD]"
              >
                <div className="text-xs text-[#059669] font-medium">
                  Returned {sqlResult.rows.length} rows in {sqlResult.durationMs}ms
                </div>
                <pre className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(sqlResult.rows, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : viewMode === "kanban" ? (
          /* Kanban View */
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Discovery", "Qualified", "Proposal", "Negotiation", "Closed Won"].map(
              (stage) => {
                const items = filteredRecords.filter(
                  (r: any) =>
                    (r.data.stage || r.data.status || "Discovery") === stage
                );
                return (
                  <div
                    key={stage}
                    className="rounded-xl border border-[#E6E4DD] bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{stage}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F3F1EC]">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-xs space-y-1"
                        >
                          <div className="font-semibold">
                            {item.data.dealName ||
                              item.data.fullName ||
                              item.data.name ||
                              item.data.title ||
                              item.id}
                          </div>
                          {item.data.amount && (
                            <div className="text-[#059669] font-mono">
                              ${Number(item.data.amount).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          /* Grid View + Add Field + Add Record */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5E5D59] absolute left-3 top-2.5" />
                <input
                  type="text"
                  data-testid="db-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTable.name}...`}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <form onSubmit={handleAddField} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    data-testid="new-field-name-input"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="New column name..."
                    className="px-2.5 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs"
                  />
                  <select
                    data-testid="new-field-type-select"
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs"
                  >
                    {ZITE_FIELD_TYPES.map((ft) => (
                      <option key={ft.type} value={ft.type}>
                        {ft.label} ({ft.category})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    data-testid="add-field-btn"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white hover:bg-[#F3F1EC] text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Column</span>
                  </button>
                </form>

                <button
                  type="button"
                  data-testid="toggle-add-record-btn"
                  onClick={() => setShowAddRow(!showAddRow)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Record</span>
                </button>
              </div>
            </div>

            {showAddRow && (
              <form
                onSubmit={handleCreateRecord}
                className="rounded-xl border border-[#E6E4DD] bg-white p-4 space-y-3"
              >
                <div className="text-xs font-semibold">
                  Create Record in {activeTable.name}
                </div>
                <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {activeTable.fields
                    .filter((f: any) => !f.isComputed)
                    .map((f: any) => (
                      <div key={f.id}>
                        <label className="block text-[11px] text-[#5E5D59] mb-1">
                          {f.name} ({f.type})
                        </label>
                        <input
                          type="text"
                          data-testid={`new-record-input-${f.slug}`}
                          value={draftRow[f.slug] || ""}
                          onChange={(e) =>
                            setDraftRow((prev) => ({
                              ...prev,
                              [f.slug]: e.target.value,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded border border-[#D4D2C8] text-xs"
                        />
                      </div>
                    ))}
                </div>
                <button
                  type="submit"
                  data-testid="submit-new-record-btn"
                  className="px-4 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-semibold"
                >
                  Save Record
                </button>
              </form>
            )}

            <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                    {activeTable.fields.map((f: any) => (
                      <th key={f.id} className="p-3 font-semibold whitespace-nowrap">
                        <div>{f.name}</div>
                        <div className="text-[10px] font-mono text-[#5E5D59] font-normal">
                          {f.type}
                          {f.type === "AiField" ? " ✨" : ""}
                          {f.type === "Formula" ? " ƒx" : ""}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  {filteredRecords.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-[#FAF9F5]">
                      {activeTable.fields.map((f: any) => {
                        const val = rec.data?.[f.slug];
                        return (
                          <td key={f.id} className="p-3 align-top max-w-xs">
                            <div className="truncate">
                              {val === undefined || val === null
                                ? "—"
                                : typeof val === "object"
                                ? JSON.stringify(val)
                                : String(val)}
                            </div>
                            {f.type === "AiField" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEvaluateAiField(rec.id, f.slug)
                                }
                                className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[10px] font-medium"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> Re-evaluate AI Field
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-[#5E5D59] hover:text-red-600"
                          title="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StudioShell>
  );
}
