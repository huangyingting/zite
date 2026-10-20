"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Check, Sparkles } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For individuals exploring full-stack AI app building.",
    credits: "30 AI credits / mo",
    features: [
      "Unlimited app end-users",
      "Up to 25 Zite Database tables",
      "1,000 backend workflow runs / mo",
      "Zite Mini & Zite Pro models",
      "Hosted on *.zite.so",
    ],
  },
  {
    name: "Starter",
    price: "$20",
    period: "/ month",
    desc: "For makers and small teams launching internal tools.",
    credits: "120 AI credits / mo",
    features: [
      "Unlimited app end-users",
      "10,000 Zite Database records",
      "5,000 backend workflow runs / mo",
      "Custom domains & Brand Kits",
      "Zite Max model unlocked",
    ],
  },
  {
    name: "Business",
    price: "$99",
    period: "/ month",
    desc: "For scaling companies running operations on Zite.",
    credits: "400 AI credits / mo",
    popular: true,
    features: [
      "Unlimited Zite Database records",
      "25,000 backend workflow runs / mo",
      "Zite Max & Zite Max Fast models",
      "User Groups & Custom Access Rules",
      "Full Zite.js Code Editing & Rollback",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual",
    desc: "For organizations requiring SSO, compliance, and isolated DBs.",
    credits: "Custom AI credit pool",
    features: [
      "SAML / OIDC Single Sign-On (Okta, Entra)",
      "Security-Critical Audit Logs & CSV Export",
      "Isolated PostgreSQL Database Architecture",
      "SOC 2 Type II · HIPAA BAA · 99.99% SLA",
      "Dedicated Pluggable Azure OpenAI / Copilot SDK",
    ],
  },
];

export default function PricingPage() {
  const [creditMultiplier, setCreditMultiplier] = useState(1);

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F1EC] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Unlimited End-Users on Every Plan</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Pay for what you build, not per seat.
          </h1>
          <p className="text-sm sm:text-base text-[#5E5D59]">
            Invite your entire team or thousands of portal customers without per-seat fees.
          </p>
        </div>

        <div className="max-w-md mx-auto rounded-xl border border-[#E6E4DD] bg-white p-4 text-center space-y-2">
          <div className="text-xs font-semibold text-[#5E5D59] uppercase">
            Monthly AI Credit Pool Scale: {creditMultiplier * 400} credits / mo
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={creditMultiplier}
            onChange={(e) => setCreditMultiplier(Number(e.target.value))}
            className="w-full accent-[#141413]"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col justify-between bg-white ${
                plan.popular
                  ? "border-[#141413] ring-2 ring-[#141413]/10"
                  : "border-[#E6E4DD]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{plan.name}</h2>
                  {plan.popular && (
                    <span className="px-2 py-0.5 rounded bg-[#141413] text-[#FAF9F5] text-[10px] font-semibold uppercase">
                      Most Popular
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-editorial text-4xl">{plan.price}</span>
                  <span className="text-xs text-[#5E5D59] ml-1">{plan.period}</span>
                </div>
                <p className="text-xs text-[#5E5D59]">{plan.desc}</p>
                <div className="px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-xs font-medium">
                  {plan.credits}
                </div>
                <ul className="space-y-2 pt-2 text-xs">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/billing/plan-builder"
                  className={`block w-full text-center py-2.5 rounded-lg text-xs font-semibold transition ${
                    plan.popular
                      ? "bg-[#141413] text-[#FAF9F5] hover:bg-neutral-800"
                      : "border border-[#D4D2C8] hover:bg-[#F3F1EC]"
                  }`}
                >
                  Choose {plan.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
