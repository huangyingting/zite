"use client";

import React, { useEffect, useState } from "react";
import { StudioShell } from "@/components/StudioShell";
import { Plug, KeyRound, Plus, CheckCircle2 } from "lucide-react";

export default function StudioIntegrationsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d) => {
        setConnections(d.connections || []);
        setSecrets(d.secrets || []);
      });
  }, []);

  async function handleSaveSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!secretName.trim() || !secretValue.trim()) return;
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upsertSecret",
        workspaceId: "ws_ashgrove_crm",
        name: secretName.trim(),
        value: secretValue.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok && data.secret) {
      setSecrets((prev) => [
        data.secret,
        ...prev.filter((s) => s.id !== data.secret.id),
      ]);
      setSecretName("");
      setSecretValue("");
    }
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Workspace Integrations & Encrypted Secrets
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
            OAuth Connections & `context.secrets`
          </h1>
          <p className="text-sm text-[#5E5D59]">
            Connect third-party APIs or store encrypted secrets injected into backend `createEndpoint` workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Plug className="w-4 h-4 text-[#2563EB]" />
              <span>Connected OAuth & Webhook Providers</span>
            </h2>
            <div className="space-y-2.5">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-[#5E5D59] text-[11px]">
                      {c.category} · {c.providerSlug}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#D97706]" />
              <span>Encrypted Workspace Secrets (`context.secrets`)</span>
            </h2>

            <form onSubmit={handleSaveSecret} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  data-testid="secret-name-input"
                  value={secretName}
                  onChange={(e) => setSecretName(e.target.value)}
                  placeholder="STRIPE_WEBHOOK_SECRET"
                  className="px-3 py-1.5 rounded-lg border border-[#D4D2C8] text-xs font-mono"
                />
                <input
                  type="password"
                  required
                  data-testid="secret-value-input"
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  placeholder="Secret value..."
                  className="px-3 py-1.5 rounded-lg border border-[#D4D2C8] text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                data-testid="add-secret-btn"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Encrypted Secret</span>
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {secrets.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] flex items-center justify-between text-xs font-mono"
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[#5E5D59]">{s.maskedPreview}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}
