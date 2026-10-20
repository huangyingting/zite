"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { ZITE_TEMPLATES } from "@/lib/zite-catalog";
import { ArrowLeft, Database, Workflow, ExternalLink, Sparkles } from "lucide-react";

export default function MarketplaceTemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [cloning, setCloning] = useState(false);

  const template =
    ZITE_TEMPLATES.find((t) => t.slug === slug) || ZITE_TEMPLATES[0];

  async function handleUseTemplate() {
    setCloning(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clone_template",
          templateSlug: template.slug,
        }),
      });
      if (res.status === 401) {
        router.push(`/login?redirectPath=/marketplace/${template.slug}`);
        return;
      }
      const data = await res.json();
      if (data.app?.slug) {
        router.push(`/editor/${data.app.slug}`);
      } else {
        router.push("/home");
      }
    } finally {
      setCloning(false);
    }
  }

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E5D59] hover:text-[#141413]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Template Marketplace</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E6E4DD]">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3F1EC] text-xs font-medium">
                {template.category}
              </span>
              <span className="text-xs text-[#5E5D59]">
                Full-Stack Zite.js Template
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
              {template.name}
            </h1>
            <p className="text-sm sm:text-base text-[#5E5D59]">
              {template.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href={`/published/${template.liveDemoSlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#D4D2C8] bg-white text-sm font-medium hover:bg-[#F3F1EC]"
            >
              <span>Open Live App</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              type="button"
              data-testid="use-template-btn"
              disabled={cloning}
              onClick={handleUseTemplate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{cloning ? "Cloning into Workspace…" : "Use Template"}</span>
            </button>
          </div>
        </div>

        {/* Included Database Tables & Backend Workflows */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Database className="w-4 h-4 text-[#059669]" />
              <span>Included Zite Database Tables ({template.tables.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {template.tables.map((tbl) => (
                <span
                  key={tbl}
                  className="px-3 py-1 rounded-md bg-[#FAF9F5] border border-[#E6E4DD] text-xs font-mono"
                >
                  zite.{tbl.charAt(0).toLowerCase() + tbl.slice(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Workflow className="w-4 h-4 text-[#7C3AED]" />
              <span>Included Backend Workflows ({template.workflows.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {template.workflows.map((wf) => (
                <span
                  key={wf}
                  className="px-3 py-1 rounded-md bg-[#FAF9F5] border border-[#E6E4DD] text-xs font-mono"
                >
                  src/api/{wf}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Embedded Interactive Live Preview */}
        <div className="rounded-2xl border border-[#D4D2C8] bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-[#F3F1EC] border-b border-[#E6E4DD] flex items-center justify-between text-xs">
            <span className="font-mono text-[#5E5D59]">
              https://zite-demo-{template.liveDemoSlug}.zite.so/
            </span>
            <span className="font-medium text-[#059669]">
              Interactive Live Preview
            </span>
          </div>
          <iframe
            title={`Live preview of ${template.name}`}
            src={`/published/${template.liveDemoSlug}`}
            className="w-full h-[640px] border-0"
          />
        </div>
      </div>
    </PublicShell>
  );
}
