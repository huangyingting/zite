import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

const STORIES = [
  {
    company: "Signal Advisors",
    metric: "$105,000 / yr saved",
    headline: "Signal Advisors replaced 14 disconnected SaaS tools with one unified Zite workspace",
    quote:
      "With Zite Database and typed createEndpoint workflows, our ops engineers ship advisor portals and compliance trackers in hours instead of quarters.",
    author: "Patrick Kelly, Co-Founder & CTO",
  },
  {
    company: "Morning Brew",
    metric: "10x faster ad-ops turnaround",
    headline: "Morning Brew automated sponsor campaign tracking and invoice PDF generation",
    quote:
      "Our account managers use Zite AI Fields and ZitePdf workflows every day. Because Zite charges per workspace instead of per seat, our entire team is onboard.",
    author: "Jordan Hayes, Head of Ad Systems",
  },
  {
    company: "South Carolina Dept. of Education",
    metric: "42,000+ portal users",
    headline: "Statewide grant & certification portal built with row-level access rules",
    quote:
      "Granular role permissions and security-critical audit logs gave our security officers complete confidence from day one.",
    author: "Director of Digital Services",
  },
];

export default function CustomersPage() {
  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <div className="max-w-2xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Customer Stories
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Built for teams that run real operations.
          </h1>
          <p className="text-base text-[#5E5D59]">
            See how high-velocity startups and global enterprises consolidate their software stack on Zite.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STORIES.map((s) => (
            <div
              key={s.company}
              className="rounded-xl border border-[#E6E4DD] bg-white p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{s.company}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    {s.metric}
                  </span>
                </div>
                <h2 className="font-editorial text-xl">{s.headline}</h2>
                <p className="text-xs text-[#5E5D59] italic leading-relaxed">
                  “{s.quote}”
                </p>
              </div>
              <div className="pt-3 border-t border-[#E6E4DD] text-xs font-medium text-[#141413]">
                {s.author}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#E6E4DD] bg-[#F3F1EC] p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl">
              Explore the live Ashgrove Software CRM workspace
            </h2>
            <p className="text-sm text-[#5E5D59]">
              Interact with the live CRM app, inspect its 6 database tables, and run its PDF order form workflow.
            </p>
          </div>
          <Link
            href="/published/ashgrove-crm"
            className="px-5 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium shrink-0"
          >
            Launch Live CRM →
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
