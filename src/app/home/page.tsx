"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudioShell } from "@/components/StudioShell";
import {
  Sparkles,
  Database,
  Workflow,
  Palette,
  Plug,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  Plus,
  Cpu,
} from "lucide-react";

export default function StudioHomePage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState(
    "Add a weighted pipeline forecast card and a one-click PDF quote button to Deals"
  );
  const [agentMode, setAgentMode] = useState<"auto" | "build" | "plan" | "chat">("auto");
  const [modelTier, setModelTier] = useState<
    "zite-mini" | "zite-pro" | "zite-max" | "zite-max-fast"
  >("zite-pro");
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [aiReply, setAiReply] = useState<any>(null);
  const [runningAi, setRunningAi] = useState(false);

  const [newWsName, setNewWsName] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/workspaces").then((r) => r.json()),
      fetch("/api/ai/status").then((r) => r.json()),
    ])
      .then(([wsData, statusData]) => {
        setWorkspaces(wsData.workspaces || []);
        setAiStatus(statusData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Shift+Tab cycles agent modes just like app.zite.com
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        const order: Array<"auto" | "build" | "plan" | "chat"> = [
          "auto",
          "build",
          "plan",
          "chat",
        ];
        setAgentMode((prev) => order[(order.indexOf(prev) + 1) % order.length]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const effectiveTier =
    (agentMode === "plan" || agentMode === "chat") &&
    modelTier !== "zite-max-fast"
      ? "zite-max"
      : modelTier;

  async function handleRunBuilder(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setRunningAi(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: "app_ashgrove_crm",
          prompt,
          mode: agentMode,
          modelTier,
        }),
      });
      const data = await res.json();
      setAiReply(data.response);
    } finally {
      setRunningAi(false);
    }
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWsName,
          description: "Custom workspace with Zite Database and published app",
        }),
      });
      const data = await res.json();
      if (res.ok && data.workspace) {
        setWorkspaces((prev) => [data.workspace, ...prev]);
        setNewWsName("");
      }
    } finally {
      setCreatingWs(false);
    }
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
        {/* Hero AI App Builder Bar */}
        <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                What business software will you build today?
              </h1>
              <p className="text-xs sm:text-sm text-[#5E5D59] mt-1">
                Describe an internal tool, CRM, or customer portal — Zite builds the database, backend workflows, and React UI.
              </p>
            </div>
            {aiStatus && (
              <div
                data-testid="ai-provider-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F5] border border-[#E6E4DD] text-xs"
              >
                <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>
                  AI Engine: <strong>{aiStatus.activeProvider}</strong>
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleRunBuilder} className="space-y-3">
            <textarea
              rows={3}
              data-testid="home-ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-[#D4D2C8] bg-[#FAF9F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Describe the app, database schema, or workflow you want to build..."
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Agent Mode Selector */}
                <div className="inline-flex items-center rounded-lg border border-[#E6E4DD] bg-[#FAF9F5] p-0.5 text-xs">
                  {(["auto", "build", "plan", "chat"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-testid={`mode-btn-${m}`}
                      onClick={() => setAgentMode(m)}
                      className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${
                        agentMode === m
                          ? "bg-[#141413] text-[#FAF9F5]"
                          : "text-[#5E5D59] hover:text-[#141413]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Model Tier Selector */}
                <select
                  aria-label="Select AI Model Tier"
                  data-testid="home-model-select"
                  value={modelTier}
                  onChange={(e) => setModelTier(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-[#E6E4DD] bg-[#FAF9F5] text-xs font-medium"
                >
                  <option value="zite-mini">Zite Mini (Fast · Low Cost)</option>
                  <option value="zite-pro">Zite Pro (Default Builder)</option>
                  <option value="zite-max">Zite Max (Deep Reasoning)</option>
                  <option value="zite-max-fast">Zite Max Fast (Priority)</option>
                </select>

                <span
                  data-testid="effective-model-indicator"
                  className="text-[11px] text-[#5E5D59]"
                >
                  Effective: <strong className="text-[#141413]">{effectiveTier}</strong>{" "}
                  (Shift+Tab cycles mode)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={runningAi}
                  data-testid="home-ai-submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{runningAi ? "Generating..." : "Run Zite Agent"}</span>
                </button>
                <Link
                  href="/editor/app_ashgrove_crm"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-[#D4D2C8] text-xs font-medium hover:bg-[#F3F1EC]"
                >
                  <span>Open Full Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </form>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E6E4DD]">
            <Link
              href="/migrate"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-xs font-medium hover:bg-[#F3F1EC]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
              <span>Import Data (CSV / Sheets / Airtable)</span>
            </Link>
            <Link
              href="/editor/design-system"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-xs font-medium hover:bg-[#F3F1EC]"
            >
              <Palette className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Match Brand From URL</span>
            </Link>
            <Link
              href="/home/integrations"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-xs font-medium hover:bg-[#F3F1EC]"
            >
              <Plug className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Connect Integrations & Secrets</span>
            </Link>
          </div>

          {aiReply && (
            <div
              data-testid="home-ai-reply"
              className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-[#141413]">
                <span>
                  Agent Output ({aiReply.providerUsed} · mode: {aiReply.mode} · tier:{" "}
                  {aiReply.effectiveTier})
                </span>
                <span className="text-[#059669]">{aiReply.creditsUsed} credits</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-[#5E5D59] leading-relaxed">
                {aiReply.reply}
              </pre>
            </div>
          )}
        </div>

        {/* Workspaces & Apps Grid */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-editorial text-2xl text-[#141413]">
                Workspaces 2.0 (Apps, Databases & Workflows)
              </h2>
              <p className="text-xs text-[#5E5D59]">
                Apps inside a workspace share the same Zite Database tables, User Groups, and Backend Workflows.
              </p>
            </div>

            <form onSubmit={handleCreateWorkspace} className="flex items-center gap-2">
              <input
                type="text"
                data-testid="new-workspace-input"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="New workspace name..."
                className="px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs"
              />
              <button
                type="submit"
                disabled={creatingWs}
                data-testid="create-workspace-btn"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </form>
          </div>

          {loading ? (
            <div className="text-xs text-[#5E5D59]">Loading workspaces...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {workspaces.map((ws) => {
                const primaryApp = ws.apps?.[0];
                return (
                  <div
                    key={ws.id}
                    data-testid={`workspace-card-${ws.slug}`}
                    className="rounded-2xl border border-[#E6E4DD] bg-white p-6 flex flex-col justify-between space-y-5 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{ws.icon || "⚡"}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F3F1EC] text-[11px] font-medium">
                          {ws.tables?.length || 0} Tables · {ws.workflows?.length || 0}{" "}
                          Workflows
                        </span>
                      </div>
                      <h3 className="font-semibold text-base text-[#141413]">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-[#5E5D59] leading-relaxed">
                        {ws.description}
                      </p>

                      {ws.tables?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {ws.tables.slice(0, 6).map((t: any) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px]"
                            >
                              {t.icon} {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#E6E4DD] flex flex-wrap gap-2">
                      {primaryApp && (
                        <Link
                          href={`/editor/${primaryApp.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
                        >
                          Edit in AI Studio
                        </Link>
                      )}
                      <Link
                        href={`/database/${ws.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] text-xs font-medium hover:bg-[#F3F1EC]"
                      >
                        <Database className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Database</span>
                      </Link>
                      {primaryApp && (
                        <Link
                          href={`/published/${primaryApp.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] text-xs font-medium text-[#2563EB] hover:bg-blue-50"
                        >
                          <span>Live App</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StudioShell>
  );
}
