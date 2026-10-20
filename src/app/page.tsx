"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { ZITE_TEMPLATES, ZITE_INTEGRATIONS } from "@/lib/zite-catalog";
import {
  ArrowRight,
  Sparkles,
  Database,
  Workflow,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Play,
} from "lucide-react";

const PILLARS = [
  {
    id: "apps",
    title: "Apps & Portals",
    headline: "Build internal tools and external portals that run your business",
    description:
      "Generate full-stack React + TypeScript apps in seconds using Auto, Build, Plan, or Chat agent modes. Customize with Selective Edits, Brand Kits, or full monorepo code.",
    href: "/apps",
    metrics: ["4 Agent Modes (Shift+Tab)", "Selective Visual Edits", "Full Zite.js Code & Rollback"],
  },
  {
    id: "database",
    title: "Zite Database",
    headline: "Your business data, under one roof",
    description:
      "Every workspace includes a relational PostgreSQL database with 21+ field types, Formula fields, AI Fields that auto-enrich rows, saved Views, and read-only zite.sql().",
    href: "/database",
    metrics: ["21+ Typed Fields + AI Fields", "Grid, Kanban & Summary Views", "Read-only zite.sql() Analytics"],
  },
  {
    id: "workflows",
    title: "Backend Workflows",
    headline: "Automate the work behind your apps",
    description:
      "Write or generate typed server-side endpoints (createEndpoint) triggered on a schedule, inbound webhook, app button click, or on demand—with PDF generation built in.",
    href: "/workflows",
    metrics: ["4 Trigger Modes", "Visual Preview + TypeScript Code", "ZitePdf.renderHtml Invoices"],
  },
  {
    id: "integrations",
    title: "30+ Integrations",
    headline: "Connect your entire software stack",
    description:
      "Two-way sync with Airtable, Salesforce, Google Sheets, HubSpot, Stripe, Slack, Linear, GitHub, OpenAI, and Anthropic with encrypted Workspace Secrets.",
    href: "/integrations",
    metrics: ["OAuth 2.0 & Secret Vault", "Typed zitejs/integrations SDK", "Hosted MCP Server"],
  },
];

const FAQS = [
  {
    q: "How is Zite different from prototype builders like Lovable, Bolt, or v0?",
    a: "Zite is built specifically for production business operations. Every workspace comes with one unified relational database, typed backend workflows (createEndpoint), built-in authentication, row-level access rules, and enterprise audit logs.",
  },
  {
    q: "Can I view and edit the underlying TypeScript code?",
    a: "Yes. Every Zite workspace is a real Zite.js TypeScript monorepo (apps/<app>/src/App.tsx, src/api/*.ts, zite.schema.json) with full version history diffing and one-click rollback.",
  },
  {
    q: "How does Zite handle security, invitations, and permissions?",
    a: "Zite enforces invite-only admission with single-use SHA-256 hashed invitation links, role-based access control (Admin, Editor, Viewer), instant session revocation, and security-critical audit logs.",
  },
  {
    q: "Which AI models power Zite?",
    a: "Zite supports 4 model tiers (Zite Mini, Zite Pro, Zite Max, and Zite Max Fast) over a pluggable AI engine supporting GitHub Copilot SDK (@github/copilot-sdk) and Azure OpenAI.",
  },
];

export default function MarketingHomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState(
    "Build an enterprise CRM with leads, deals Kanban, outreach sequences, and PDF quote workflows"
  );
  const [activePillar, setActivePillar] = useState("apps");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const selectedPillar =
    PILLARS.find((p) => p.id === activePillar) || PILLARS[0];

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4D2C8] bg-[#F3F1EC] text-xs font-medium text-[#141413]">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Workspace 2.0 · Zite.js Framework · Pluggable Copilot SDK & Azure OpenAI</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-6xl font-normal tracking-tight leading-[1.08] text-[#141413]">
            The AI builder that means business.
          </h1>

          <p className="text-base sm:text-lg text-[#5E5D59] max-w-2xl mx-auto leading-relaxed">
            Create internal tools, customer portals, CRMs, relational databases, and
            backend workflows with AI — all connected over one unified workspace.
          </p>

          {/* Interactive AI Prompt Composer */}
          <div className="mt-8 rounded-2xl border border-[#D4D2C8] bg-white shadow-sm p-3 sm:p-4 text-left">
            <label htmlFor="hero-prompt-input" className="sr-only">
              Describe the business app you want to build
            </label>
            <textarea
              id="hero-prompt-input"
              data-testid="hero-prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full resize-none border-0 bg-transparent text-sm sm:text-base text-[#141413] placeholder-[#5E5D59] focus:outline-none"
              placeholder="Describe the internal tool, CRM, or portal you want to build..."
            />
            <div className="mt-3 pt-3 border-t border-[#E6E4DD] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setPrompt("Build an applicant tracking system with interview scorecards and AI resume summaries")
                  }
                  className="px-2.5 py-1 rounded-md bg-[#F3F1EC] hover:bg-[#E6E4DD] text-[#141413] font-medium"
                >
                  Applicant Tracking System
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPrompt("Create a customer billing portal with row-level permissions and PDF invoice downloads")
                  }
                  className="px-2.5 py-1 rounded-md bg-[#F3F1EC] hover:bg-[#E6E4DD] text-[#141413] font-medium"
                >
                  Customer Portal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPrompt("Build a multi-warehouse inventory and purchase order approval tracker")
                  }
                  className="px-2.5 py-1 rounded-md bg-[#F3F1EC] hover:bg-[#E6E4DD] text-[#141413] font-medium"
                >
                  Inventory Tracker
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/published/ashgrove-crm"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4D2C8] bg-[#FAF9F5] text-xs font-medium hover:bg-[#EFECE4]"
                >
                  <Play className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Live CRM Demo</span>
                </Link>
                <button
                  type="button"
                  data-testid="hero-start-building-btn"
                  onClick={() =>
                    router.push(`/home?prompt=${encodeURIComponent(prompt)}`)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs sm:text-sm font-medium hover:bg-neutral-800 transition"
                >
                  <span>Build with AI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Customer Social Proof */}
          <div className="pt-6">
            <p className="text-xs uppercase tracking-widest text-[#5E5D59] mb-4">
              Trusted by operations & engineering teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-semibold text-[#5E5D59]">
              <span>NETFLIX</span>
              <span>STRIPE</span>
              <span>KPMG</span>
              <span>MERCURY</span>
              <span>MORNING BREW</span>
              <span>SIGNAL ADVISORS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Four Product Pillars Interactive Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {PILLARS.map((p) => (
            <button
              key={p.id}
              type="button"
              data-testid={`pillar-tab-${p.id}`}
              onClick={() => setActivePillar(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                activePillar === p.id
                  ? "bg-[#141413] text-[#FAF9F5] border-[#141413]"
                  : "bg-white text-[#141413] border-[#E6E4DD] hover:bg-[#F3F1EC]"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              {selectedPillar.title}
            </div>
            <h2 className="font-editorial text-2xl sm:text-4xl text-[#141413]">
              {selectedPillar.headline}
            </h2>
            <p className="text-sm sm:text-base text-[#5E5D59] leading-relaxed">
              {selectedPillar.description}
            </p>
            <ul className="space-y-2 pt-2">
              {selectedPillar.metrics.map((m) => (
                <li key={m} className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 flex items-center gap-3">
              <Link
                href={selectedPillar.href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
              >
                <span>Explore {selectedPillar.title}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/published/ashgrove-crm"
                className="px-4 py-2 rounded-lg border border-[#D4D2C8] text-sm font-medium hover:bg-[#F3F1EC]"
              >
                Try Live App
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-[#E6E4DD] bg-[#FAF9F5] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E4DD] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-[#5E5D59]">
                  ws_ashgrove_crm · Ashgrove Software
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold">
                Live Workspace
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#E6E4DD] bg-white p-3">
                <div className="text-[11px] text-[#5E5D59] uppercase">Open Pipeline</div>
                <div className="text-lg font-bold mt-0.5">$1.61M</div>
                <div className="text-[11px] text-[#059669]">6 active enterprise deals</div>
              </div>
              <div className="rounded-lg border border-[#E6E4DD] bg-white p-3">
                <div className="text-[11px] text-[#5E5D59] uppercase">Weighted Forecast</div>
                <div className="text-lg font-bold mt-0.5">$588.8K</div>
                <div className="text-[11px] text-[#5E5D59]">Formula field auto-calc</div>
              </div>
              <div className="rounded-lg border border-[#E6E4DD] bg-white p-3">
                <div className="text-[11px] text-[#5E5D59] uppercase">Workflow Runs</div>
                <div className="text-lg font-bold mt-0.5">1,240</div>
                <div className="text-[11px] text-[#2563EB]">99.98% success rate</div>
              </div>
            </div>

            <div className="rounded-lg border border-[#E6E4DD] bg-white p-3 font-mono text-xs text-[#141413] overflow-x-auto">
              <div className="text-[#5E5D59] mb-1">
                // apps/ashgrove-crm/src/api/createLeadFollowup.ts
              </div>
              <div>{"import { createEndpoint } from 'zitejs/backend';"}</div>
              <div>{"import { zite } from 'zitejs/db';"}</div>
              <div className="text-[#2563EB] mt-1">
                {"export default createEndpoint({ authenticated: true, execute: async () => zite.deals.findAll() });"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Marketplace Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-editorial text-3xl text-[#141413]">
              Start from a battle-tested business template
            </h2>
            <p className="text-sm text-[#5E5D59] mt-1">
              Clone any template into your workspace and customize every table, screen, and workflow with AI.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline"
          >
            <span>Browse all 60+ templates</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ZITE_TEMPLATES.slice(0, 6).map((tpl) => (
            <Link
              key={tpl.slug}
              href={`/marketplace/${tpl.slug}`}
              className="group rounded-xl border border-[#E6E4DD] bg-white p-5 hover:border-[#141413] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F1EC] text-[#141413]">
                    {tpl.category}
                  </span>
                  <span className="text-xs font-mono text-[#5E5D59]">
                    {tpl.tables.length} tables
                  </span>
                </div>
                <h3 className="font-semibold text-base group-hover:text-[#2563EB] transition">
                  {tpl.name}
                </h3>
                <p className="text-xs text-[#5E5D59] mt-1.5 leading-relaxed">
                  {tpl.tagline}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E6E4DD] flex items-center justify-between text-xs font-medium">
                <span className="text-[#5E5D59]">
                  Tables: {tpl.tables.slice(0, 3).join(", ")}
                </span>
                <span className="text-[#141413] group-hover:translate-x-0.5 transition">
                  Preview →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Integrations Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-[#E6E4DD] bg-[#F3F1EC] p-6 sm:p-10">
          <div className="max-w-2xl mb-6">
            <h2 className="font-editorial text-2xl sm:text-3xl">
              Connects to 30+ tools out of the box
            </h2>
            <p className="text-sm text-[#5E5D59] mt-1">
              Import from Airtable, Google Sheets, or CSV in one click — or call Slack, Stripe, HubSpot, and Salesforce from typed workflows.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {ZITE_INTEGRATIONS.slice(0, 14).map((intg) => (
              <Link
                key={intg.id}
                href="/integrations"
                className="rounded-lg border border-[#E6E4DD] bg-white p-3 hover:border-[#141413] transition"
              >
                <div className="text-xs font-semibold">{intg.name}</div>
                <div className="text-[11px] text-[#5E5D59] mt-0.5">
                  {intg.category}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-editorial text-3xl text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-[#E6E4DD] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-medium text-sm sm:text-base"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-[#5E5D59] leading-relaxed border-t border-[#E6E4DD] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
