"use client";

import React, { useEffect, useState } from "react";
import { StudioShell } from "@/components/StudioShell";
import { Palette, Globe, Sparkles, Check } from "lucide-react";

export default function DesignSystemPage() {
  const [kits, setKits] = useState<any[]>([]);
  const [name, setName] = useState("Stripe Editorial Clean");
  const [sourceUrl, setSourceUrl] = useState("https://stripe.com");
  const [primaryColor, setPrimaryColor] = useState("#635BFF");
  const [backgroundColor, setBackgroundColor] = useState("#F6F9FC");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/brand-kits")
      .then((r) => r.json())
      .then((d) => setKits(d.kits || []));
  }, []);

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/brand-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: "ws_ashgrove_crm",
          name,
          sourceUrl,
          primaryColor,
          backgroundColor,
          headingFont: "Newsreader",
          bodyFont: "Plus Jakarta Sans",
          borderRadius: "10px",
        }),
      });
      const data = await res.json();
      if (res.ok && data.kit) {
        setKits((prev) => [data.kit, ...prev]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Brand Kits & Design System Studio
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
            Match your brand from any website URL
          </h1>
          <p className="text-sm text-[#5E5D59]">
            Extract typography, color palettes, surface radii, and component tokens so every generated Zite app matches your company design system.
          </p>
        </div>

        <form
          onSubmit={handleExtract}
          className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Brand Kit Name</label>
              <input
                type="text"
                required
                data-testid="brandkit-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Extract From Website URL
              </label>
              <input
                type="url"
                required
                data-testid="brandkit-url-input"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Primary Accent</label>
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Surface Background</label>
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            data-testid="brandkit-save-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{saving ? "Extracting Tokens..." : "Extract & Save Brand Kit"}</span>
          </button>
        </form>

        <div className="grid md:grid-cols-2 gap-6">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">{kit.name}</h2>
                  <p className="text-xs text-[#5E5D59] flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {kit.sourceUrl || "Custom Preset"}
                  </p>
                </div>
                {kit.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                    <Check className="w-3 h-3" /> Active Default
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded border border-black/10"
                    style={{ backgroundColor: kit.primaryColor }}
                  />
                  <span className="font-mono">{kit.primaryColor}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded border border-black/10"
                    style={{ backgroundColor: kit.backgroundColor }}
                  />
                  <span className="font-mono">{kit.backgroundColor}</span>
                </div>
                <span className="text-[#5E5D59]">
                  Fonts: {kit.headingFont} / {kit.bodyFont}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudioShell>
  );
}
