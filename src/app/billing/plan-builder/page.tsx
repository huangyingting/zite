"use client";

import React, { useState } from "react";
import { StudioShell } from "@/components/StudioShell";
import { CreditCard, CheckCircle2, Sparkles } from "lucide-react";

export default function PlanBuilderPage() {
  const [tier, setTier] = useState<"Starter" | "Business" | "Enterprise">("Business");
  const [credits, setCredits] = useState(800);
  const [annual, setAnnual] = useState(true);
  const [saved, setSaved] = useState(false);

  const [saving, setSaving] = useState(false);

  const basePrice = tier === "Starter" ? 20 : tier === "Business" ? 99 : 450;
  const creditAddon = Math.max(0, (credits - 400) * 0.08);
  const monthlyTotal = Math.round(
    (basePrice + creditAddon) * (annual ? 0.85 : 1)
  );

  async function handleSavePlan() {
    setSaving(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_plan",
          tier,
          credits,
          annual,
        }),
      });
      if (res.ok) {
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Billing & AI Credit Plan Builder
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
            Configure your Workspace Plan & Credit Pool
          </h1>
          <p className="text-sm text-[#5E5D59]">
            All Zite plans include unlimited end-users. Customize your monthly AI build credits and workflow run capacity.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            {(["Starter", "Business", "Enterprise"] as const).map((t) => (
              <button
                key={t}
                type="button"
                data-testid={`plan-tier-${t.toLowerCase()}`}
                onClick={() => {
                  setTier(t);
                  setSaved(false);
                }}
                className={`p-4 rounded-xl border text-left space-y-1 transition ${
                  tier === t
                    ? "border-[#141413] bg-[#FAF9F5] ring-2 ring-[#141413]/10"
                    : "border-[#E6E4DD]"
                }`}
              >
                <div className="font-semibold text-sm">{t}</div>
                <div className="text-xs text-[#5E5D59]">
                  {t === "Starter"
                    ? "10k DB rows · Custom domains"
                    : t === "Business"
                    ? "Unlimited DB rows · RBAC Groups"
                    : "SAML SSO · Audit Logs · SLA"}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Monthly AI Build & Workflow Credits</span>
              <span className="font-bold text-[#2563EB]">{credits} credits / month</span>
            </div>
            <input
              type="range"
              min={200}
              max={5000}
              step={100}
              data-testid="plan-credits-slider"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full accent-[#141413]"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E6E4DD]">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={annual}
                onChange={(e) => setAnnual(e.target.checked)}
              />
              <span>Annual Billing (Save 15%)</span>
            </label>

            <div className="text-right">
              <div className="font-editorial text-3xl text-[#141413]">
                ${monthlyTotal}
                <span className="text-xs font-sans text-[#5E5D59]"> / month</span>
              </div>
              <div className="text-[11px] text-[#059669] font-medium">
                Unlimited end-users included
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            data-testid="save-plan-btn"
            onClick={handleSavePlan}
            className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold disabled:opacity-50"
          >
            {saving ? "Updating Subscription Plan..." : "Update Workspace Subscription Plan"}
          </button>

          {saved && (
            <div
              data-testid="plan-saved-banner"
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>
                Subscription updated to <strong>{tier}</strong> with{" "}
                <strong>{credits} monthly AI credits</strong>.
              </span>
            </div>
          )}
        </div>
      </div>
    </StudioShell>
  );
}
