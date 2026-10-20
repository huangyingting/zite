"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ZITE_INTEGRATIONS } from "@/lib/zite-catalog";
import { Search, Plug, ArrowRight } from "lucide-react";

export default function IntegrationsDirectoryPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    "All",
    ...Array.from(new Set(ZITE_INTEGRATIONS.map((i) => i.category))),
  ];

  const filtered = ZITE_INTEGRATIONS.filter((i) => {
    const matchesCat =
      selectedCategory === "All" || i.category === selectedCategory;
    const matchesSearch =
      !search.trim() ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
              Integrations & Workspace Secrets
            </div>
            <h1 className="font-editorial text-4xl text-[#141413]">
              Connect Zite to your entire stack.
            </h1>
            <p className="text-sm sm:text-base text-[#5E5D59]">
              Use first-party OAuth integrations (`zitejs/integrations`) or store encrypted Workspace Secrets (`process.env.*`) for any REST or GraphQL API.
            </p>
          </div>
          <Link
            href="/home/integrations"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium shrink-0"
          >
            <span>Manage Workspace Connections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5E5D59] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="integrations-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations (Slack, Stripe, Airtable, OpenAI...)"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D4D2C8] bg-white text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  selectedCategory === cat
                    ? "bg-[#141413] text-[#FAF9F5]"
                    : "bg-white border border-[#E6E4DD] text-[#141413]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#E6E4DD] bg-white p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base flex items-center gap-2">
                    <Plug className="w-4 h-4 text-[#2563EB]" />
                    {item.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F3F1EC] text-[11px] font-medium">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-[#5E5D59] leading-relaxed">
                  {item.description}
                </p>
              </div>
              <div className="pt-3 border-t border-[#E6E4DD] space-y-1.5">
                <div className="text-[11px] text-[#5E5D59]">
                  Auth: <strong className="text-[#141413]">{item.authType}</strong>
                </div>
                <div className="font-mono text-[11px] bg-[#FAF9F5] p-1.5 rounded border border-[#E6E4DD] truncate">
                  {item.sdkImport}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
