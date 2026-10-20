import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ZITE_FIELD_TYPES } from "@/lib/zite-catalog";
import { Database, Sparkles, Terminal, ArrowRight } from "lucide-react";

export default function DatabaseProductPage() {
  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
            Zite Database
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Your business data, under one roof.
          </h1>
          <p className="text-base sm:text-lg text-[#5E5D59]">
            Every Zite workspace includes a built-in relational database with spreadsheet ergonomics, 21+ typed columns, Formula fields, AI Fields, saved Views, and read-only SQL (`zite.sql()`).
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/database/ws_ashgrove_crm"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              <span>Open Live Database Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/spreadsheet-to-app"
              className="px-4 py-2.5 rounded-lg border border-[#D4D2C8] bg-white text-sm font-medium"
            >
              Import Spreadsheet / CSV
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-2">
            <Database className="w-5 h-5 text-[#059669]" />
            <h2 className="font-semibold">One Unified Database per Workspace</h2>
            <p className="text-sm text-[#5E5D59]">
              Define tables once. Every internal tool, customer portal, and workflow in your workspace shares the same typed `zitejs/db` client.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="font-semibold">AI Fields & Formula Columns</h2>
            <p className="text-sm text-[#5E5D59]">
              Reference `{`{Column}`}` values in AI Field prompts to automatically enrich leads, score resumes, or summarize deal risk.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-2">
            <Terminal className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="font-semibold">Read-Only SQL (`zite.sql()`)</h2>
            <p className="text-sm text-[#5E5D59]">
              Run parameterized `SELECT`, `COUNT(*)`, and `GROUP BY` queries directly against your workspace tables with a 2,000-row safety cap.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 sm:p-8">
          <h2 className="font-editorial text-2xl mb-4">
            Complete Field Type Reference ({ZITE_FIELD_TYPES.length} Types)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6E4DD] text-[#5E5D59]">
                  <th className="py-2.5 pr-4">Field Label</th>
                  <th className="py-2.5 pr-4">API Type</th>
                  <th className="py-2.5 pr-4">Category</th>
                  <th className="py-2.5 pr-4">Value Shape</th>
                  <th className="py-2.5">Default Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {ZITE_FIELD_TYPES.map((f) => (
                  <tr key={f.type}>
                    <td className="py-2.5 pr-4 font-semibold">{f.label}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-[#2563EB]">
                      {f.type}
                    </td>
                    <td className="py-2.5 pr-4">{f.category}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{f.valueShape}</td>
                    <td className="py-2.5 text-[#5E5D59]">{f.defaultSettings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
