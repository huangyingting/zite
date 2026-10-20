"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StudioShell } from "@/components/StudioShell";
import { FileSpreadsheet, Upload, CheckCircle2, ArrowRight } from "lucide-react";

const SAMPLE_CSV = `vendorName,category,annualSpend,status,ownerEmail
 Snowflake,Cloud Data Warehouse,84000,Active,dominic@ashgrovesoftware.com
 Datadog,Observability,46000,Renewal Due,marcus@ashgrovesoftware.com
 Figma,Design Platform,18500,Active,elena@ashgrovesoftware.com`;

export default function MigratePage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState("CSV / Spreadsheet");
  const [tableName, setTableName] = useState("VendorContracts");
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [importing, setImporting] = useState(false);
  const [importedTable, setImportedTable] = useState<any>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    try {
      const lines = csvText
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim());
      const fields = headers.map((h) => ({
        name: h,
        slug: h,
        type: h.toLowerCase().includes("spend")
          ? "Currency"
          : h.toLowerCase().includes("email")
          ? "Email"
          : h.toLowerCase().includes("status")
          ? "Select"
          : "SingleLineText",
      }));

      // Create the table in ws_ashgrove_crm
      const createRes = await fetch("/api/workspaces/ws_ashgrove_crm/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTable",
          name: tableName,
          icon: "📑",
          description: `Imported from ${sourceType}`,
          fields,
        }),
      });
      const createData = await createRes.json();
      if (createRes.ok && createData.table) {
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          const rowObj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            const val = cols[idx] ?? "";
            rowObj[h] = h.toLowerCase().includes("spend") ? Number(val) || 0 : val;
          });
          await fetch("/api/workspaces/ws_ashgrove_crm/database", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "createRecord",
              tableId: createData.table.id,
              data: rowObj,
            }),
          });
        }
        setImportedTable(createData.table);
      }
    } finally {
      setImporting(false);
    }
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
            Migration Hub · Spreadsheet-to-App
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
            Import from CSV, Google Sheets, or Airtable
          </h1>
          <p className="text-sm text-[#5E5D59]">
            Paste CSV data or connect an external base to automatically create typed Zite Database tables and seed records.
          </p>
        </div>

        <form
          onSubmit={handleImport}
          className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Migration Source</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
              >
                <option>CSV / Spreadsheet</option>
                <option>Airtable Base Import</option>
                <option>Google Sheets Sync</option>
                <option>Notion Database Export</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Table Name</label>
              <input
                type="text"
                required
                data-testid="migrate-table-name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              CSV / Tabular Payload (First row headers auto-infer field types)
            </label>
            <textarea
              rows={5}
              data-testid="migrate-csv-textarea"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#D4D2C8] font-mono text-xs bg-[#FAF9F5]"
            />
          </div>

          <button
            type="submit"
            disabled={importing}
            data-testid="migrate-submit-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              {importing
                ? "Creating Table & Importing Rows..."
                : "Import into Zite Database"}
            </span>
          </button>
        </form>

        {importedTable && (
          <div
            data-testid="migrate-success-banner"
            className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>
                  Table &ldquo;{importedTable.name}&rdquo; created with inferred schema & rows!
                </span>
              </div>
              <p>Recorded `db.table.create` in Organization Audit Logs.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/database/ws_ashgrove_crm")}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] font-medium"
            >
              <span>Inspect in Database Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </StudioShell>
  );
}
