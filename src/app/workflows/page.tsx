import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Clock, Webhook, MousePointerClick, Play, FileText, Code2, ArrowRight } from "lucide-react";

export default function WorkflowsProductPage() {
  const triggers = [
    {
      icon: Clock,
      title: "On a schedule",
      desc: "Run cron cadences (hourly, daily at 08:00 UTC, or weekdays) for stalled pipeline digests and inventory checks.",
    },
    {
      icon: Webhook,
      title: "On a webhook",
      desc: "Receive inbound POST webhooks from Stripe, HubSpot, GitHub, or Shopify at /public/{flowId}/api/{name}.",
    },
    {
      icon: MousePointerClick,
      title: "On a click in your app",
      desc: "Bind any button in your Zite app directly to a typed workflow caller imported from 'zitejs/api'.",
    },
    {
      icon: Play,
      title: "On demand",
      desc: "Execute or replay runs manually from the Workflow Studio with custom JSON test payloads.",
    },
  ];

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Zite Workflows
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Automate the work behind your apps.
          </h1>
          <p className="text-base sm:text-lg text-[#5E5D59]">
            Every Zite workflow is both a visual step diagram and a real TypeScript file exporting `createEndpoint` from `zitejs/backend` — complete with Zod input validation, execution history, replay, and PDF rendering.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/editor/ashgrove-crm?tab=workflows"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              <span>Open Workflow Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {triggers.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-2.5"
              >
                <Icon className="w-5 h-5 text-[#7C3AED]" />
                <h2 className="font-semibold text-base">{t.title}</h2>
                <p className="text-xs text-[#5E5D59] leading-relaxed">{t.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <Code2 className="w-5 h-5 text-[#2563EB]" />
              <span>Preview, Code & Execution History Tabs</span>
            </div>
            <p className="text-sm text-[#5E5D59]">
              Inspect visual workflow steps in Preview, edit TypeScript directly in Code, and inspect every historical run’s step-by-step inputs, outputs, and duration in History — with one-click Replay Run.
            </p>
          </div>

          <div className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="w-5 h-5 text-[#059669]" />
              <span>Built-in PDF Generation (`ZitePdf.renderHtml`)</span>
            </div>
            <p className="text-sm text-[#5E5D59]">
              Generate pixel-perfect invoices, order forms, quotes, and compliance reports inside any workflow and attach them directly to Zite Database records.
            </p>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
