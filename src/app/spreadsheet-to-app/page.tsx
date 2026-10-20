import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { FileSpreadsheet, ArrowRight, Database, Sparkles, Shield } from "lucide-react";

export default function SpreadsheetToAppPage() {
  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F1EC] text-xs font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
            <span>Excel · Google Sheets · CSV · Airtable</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Turn spreadsheets into full-stack apps.
          </h1>
          <p className="text-base sm:text-lg text-[#5E5D59]">
            Upload any CSV or connect Google Sheets / Airtable. Zite automatically infers typed database columns, links relational records, and generates a role-governed web app in seconds.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/migrate"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              <span>Import CSV or Spreadsheet Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/database/ws_ashgrove_crm"
              className="px-4 py-2.5 rounded-lg border border-[#D4D2C8] bg-white text-sm font-medium"
            >
              Open Zite Database Studio
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-2">
            <Database className="w-5 h-5 text-[#059669]" />
            <h2 className="font-semibold">1. Automatic Schema Inference</h2>
            <p className="text-sm text-[#5E5D59]">
              Dates, currencies, select options, emails, and formulas are mapped cleanly to Zite’s 21+ native field types.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="font-semibold">2. Instant App & Kanban Views</h2>
            <p className="text-sm text-[#5E5D59]">
              Zite AI generates interactive dashboards, search filters, Kanban boards, and detail drawers over your imported tables.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-2">
            <Shield className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="font-semibold">3. Row-Level Permissions</h2>
            <p className="text-sm text-[#5E5D59]">
              Stop sharing fragile spreadsheet links. Enforce Admin, Editor, and Viewer permissions with full audit history.
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
