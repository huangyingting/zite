import React from "react";
import { PublicShell } from "@/components/PublicShell";

const ROWS = [
  { feature: "Built-in Relational Database (21+ Field Types + AI Fields)", zite: "✅ Included", lovable: "External Supabase", bolt: "External DB", replit: "Manual Setup", v0: "UI Only" },
  { feature: "Typed Backend Workflows (createEndpoint + Cron + Webhooks)", zite: "✅ Included", lovable: "Edge Functions", bolt: "Manual", replit: "Manual", v0: "❌ No" },
  { feature: "Built-in PDF Generation (ZitePdf.renderHtml)", zite: "✅ Included", lovable: "❌ No", bolt: "❌ No", replit: "Manual Library", v0: "❌ No" },
  { feature: "4 Agent Modes (Auto, Build, Plan, Chat) & 4 Model Tiers", zite: "✅ Included", lovable: "2 Modes", bolt: "1 Mode", replit: "2 Modes", v0: "1 Mode" },
  { feature: "Full TypeScript Monorepo Code + Git Diff Rollback", zite: "✅ Included", lovable: "Partial", bolt: "✅ Yes", replit: "✅ Yes", v0: "Component Code" },
  { feature: "Invite-Only Governance, SAML SSO, & Security Audit Logs", zite: "✅ Included", lovable: "❌ No", bolt: "❌ No", replit: "Enterprise Only", v0: "❌ No" },
  { feature: "Pricing Model", zite: "Unlimited Users (Workspace Plans)", lovable: "Per Credit", bolt: "Token Based", replit: "Compute + Seats", v0: "Per Seat" },
];

export default function ComparisonPage() {
  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            AI App Builder Comparison
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            How Zite compares to other AI builders.
          </h1>
          <p className="text-sm sm:text-base text-[#5E5D59]">
            Compare Zite against Lovable, Bolt, Replit, and v0 across database architecture, backend workflows, enterprise permissions, and pricing.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                <th className="p-4 font-semibold">Capability</th>
                <th className="p-4 font-bold text-[#2563EB]">Zite</th>
                <th className="p-4 font-semibold text-[#5E5D59]">Lovable</th>
                <th className="p-4 font-semibold text-[#5E5D59]">Bolt</th>
                <th className="p-4 font-semibold text-[#5E5D59]">Replit</th>
                <th className="p-4 font-semibold text-[#5E5D59]">v0</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E4DD]">
              {ROWS.map((r) => (
                <tr key={r.feature}>
                  <td className="p-4 font-medium">{r.feature}</td>
                  <td className="p-4 font-semibold text-[#059669] bg-emerald-50/40">
                    {r.zite}
                  </td>
                  <td className="p-4 text-[#5E5D59]">{r.lovable}</td>
                  <td className="p-4 text-[#5E5D59]">{r.bolt}</td>
                  <td className="p-4 text-[#5E5D59]">{r.replit}</td>
                  <td className="p-4 text-[#5E5D59]">{r.v0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PublicShell>
  );
}
