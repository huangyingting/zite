"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ZITE_TEMPLATES } from "@/lib/zite-catalog";
import { Search, Sparkles } from "lucide-react";

const CATEGORIES = [
  "All",
  "Sales",
  "HR",
  "Portals",
  "Operations",
  "IT",
  "Finance",
  "Marketing",
  "Product",
  "Real Estate",
];

export default function MarketplacePage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ZITE_TEMPLATES.filter((t) => {
    const matchCat = category === "All" || t.category === category;
    const matchSearch =
      !search.trim() ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F1EC] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Zite Template Marketplace</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Build software fast.
          </h1>
          <p className="text-sm sm:text-base text-[#5E5D59]">
            Every template includes a pre-configured Zite Database schema, sample records, typed backend workflows, and responsive UI screens.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="w-4 h-4 text-[#5E5D59] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="marketplace-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates (CRM, ATS, Customer Portal, Inventory...)"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D4D2C8] bg-white text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                data-testid={`marketplace-cat-${c.toLowerCase()}`}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  category === c
                    ? "bg-[#141413] text-[#FAF9F5]"
                    : "bg-white border border-[#E6E4DD] text-[#141413]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tpl) => (
            <Link
              key={tpl.slug}
              href={`/marketplace/${tpl.slug}`}
              data-testid={`template-card-${tpl.slug}`}
              className="group rounded-xl border border-[#E6E4DD] bg-white p-6 hover:border-[#141413] transition flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F1EC]">
                    {tpl.category}
                  </span>
                  <span className="text-xs text-[#5E5D59] font-mono">
                    {tpl.tables.length} tables · {tpl.workflows.length} workflows
                  </span>
                </div>
                <h2 className="font-semibold text-lg group-hover:text-[#2563EB] transition">
                  {tpl.name}
                </h2>
                <p className="text-xs text-[#5E5D59] leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E6E4DD] flex items-center justify-between text-xs font-medium">
                <span className="text-[#5E5D59]">
                  {tpl.tables.slice(0, 3).join(" · ")}
                </span>
                <span className="text-[#141413]">Inspect & Use →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
