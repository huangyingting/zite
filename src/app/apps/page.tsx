import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Layers, Sparkles, Palette, Code2, Shield, Globe, ArrowRight } from "lucide-react";

export default function AppsProductPage() {
  const features = [
    {
      icon: Sparkles,
      title: "4 Agent Modes & 4 AI Model Tiers",
      desc: "Switch seamlessly between Auto, Build, Plan, and Chat modes (Shift+Tab) powered by Zite Mini, Zite Pro, Zite Max, and Zite Max Fast.",
    },
    {
      icon: Palette,
      title: "Selective Edits & Brand Kits",
      desc: "Click any component in your app preview to adjust typography, colors, spacing, or extract a complete Brand Kit from your company website URL.",
    },
    {
      icon: Code2,
      title: "Full Zite.js TypeScript Monorepo",
      desc: "Inspect and edit apps/<app>/src/App.tsx, zite.schema.json, and .zite/db.ts directly in the browser with Git version history and one-click rollback.",
    },
    {
      icon: Shield,
      title: "Internal Tools & External Portals",
      desc: "Enforce SSO, Google/Microsoft OAuth, User Groups, and row-level access rules so every employee or customer only sees authorized records.",
    },
    {
      icon: Globe,
      title: "Custom Domains & Responsive Layouts",
      desc: "Publish with one click to *.zite.so or your own custom domain with desktop, tablet, and mobile responsive layouts.",
    },
    {
      icon: Layers,
      title: "Improve My App Automated Audits",
      desc: "Run one-click Review, Design, and Accessibility passes to harden your app before rolling it out to your organization.",
    },
  ];

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Zite Apps
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Build apps that run your business.
          </h1>
          <p className="text-base sm:text-lg text-[#5E5D59]">
            From internal CRMs and admin consoles to customer-facing portals and booking platforms — built with AI over your unified workspace database.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/home"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              <span>Open AI App Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/published/ashgrove-crm"
              className="px-4 py-2.5 rounded-lg border border-[#D4D2C8] bg-white text-sm font-medium"
            >
              Explore Live Ashgrove CRM →
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F3F1EC] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#2563EB]" />
                </div>
                <h2 className="font-semibold text-base">{f.title}</h2>
                <p className="text-sm text-[#5E5D59] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
