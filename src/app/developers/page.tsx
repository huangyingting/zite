import React from "react";
import { PublicShell } from "@/components/PublicShell";
import { BookOpen, Terminal, Cpu, Database } from "lucide-react";

export default function DevelopersDocsPage() {
  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F1EC] text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>developers.zite.com · Zite.js · MCP · REST API</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Zite Developer Platform & Zite.js SDK
          </h1>
          <p className="text-sm sm:text-base text-[#5E5D59]">
            Every Zite workspace is a real TypeScript monorepo powered by `zitejs/db`, `zitejs/backend`, `zitejs/api`, `zitejs/auth`, and `zitejs/pdf`.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3">
            <Database className="w-5 h-5 text-[#059669]" />
            <h2 className="font-semibold">Typed Database Client (`zitejs/db`)</h2>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Query tables using `findAll`, `findOne`, `create`, `update`, `delete`, `bulkCreate` (up to 100 rows), or run parameterized `SELECT` queries via `zite.sql()`.
            </p>
            <pre className="p-3 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] font-mono overflow-x-auto">
{`import { zite } from 'zitejs/db';
const { records } = await zite.deals.findAll({
  filters: { stage: 'Proposal' },
  limit: 100,
});`}
            </pre>
          </div>

          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3">
            <Terminal className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="font-semibold">Backend Workflows (`zitejs/backend`)</h2>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Each file in `apps/&lt;app&gt;/src/api/*.ts` default-exports `createEndpoint` with Zod `inputSchema`, `authenticated: true`, and `ZiteError` status mapping.
            </p>
            <pre className="p-3 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] font-mono overflow-x-auto">
{`import { createEndpoint, ZiteError } from 'zitejs/backend';
export default createEndpoint({
  authenticated: true,
  execute: async ({ input, context }) => {
    return { user: context.user?.email };
  },
});`}
            </pre>
          </div>

          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3">
            <Cpu className="w-5 h-5 text-[#2563EB]" />
            <h2 className="font-semibold">Zite MCP & Pluggable AI SDK</h2>
            <p className="text-xs text-[#5E5D59] leading-relaxed">
              Connect external agents via `https://mcp.zite.com/mcp` or configure `@github/copilot-sdk` and Azure OpenAI directly inside Organization Settings.
            </p>
            <pre className="p-3 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "zite": { "url": "https://mcp.zite.com/mcp" }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
