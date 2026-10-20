"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StudioShell } from "@/components/StudioShell";
import {
  Sparkles,
  Play,
  RotateCcw,
  FileText,
  Database,
  Workflow,
  Users,
  Code2,
  Eye,
  Crosshair,
  ShieldCheck,
  Bug,
  Zap,
  Plus,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function AppEditorStudioPage() {
  const params = useParams<{ appId: string }>();
  const appId = params.appId || "app_ashgrove_crm";

  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Left Chat / Agent State
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [agentMode, setAgentMode] = useState<"auto" | "build" | "plan" | "chat">(
    "auto"
  );
  const [modelTier, setModelTier] = useState<
    "zite-mini" | "zite-pro" | "zite-max" | "zite-max-fast"
  >("zite-pro");
  const [selectiveEditActive, setSelectiveEditActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);

  // Right Canvas Tabs
  const [rightTab, setRightTab] = useState<
    "preview" | "database" | "workflows" | "access" | "code"
  >("preview");

  // Workflows Sub-State
  const [workflowSubTab, setWorkflowSubTab] = useState<
    "preview" | "code" | "history" | "test"
  >("preview");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [testInputJson, setTestInputJson] = useState(
    '{\n  "dealName": "Kestrel Aerospace — Enterprise Seat Expansion",\n  "company": "Kestrel Aerospace",\n  "amount": 185000\n}'
  );
  const [workflowExecResult, setWorkflowExecResult] = useState<any>(null);

  // Code Sub-State
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    "apps/ashgrove-crm/src/App.tsx"
  );
  const [publishBanner, setPublishBanner] = useState<string | null>(null);

  async function loadApp() {
    setLoading(true);
    const res = await fetch(`/api/apps/${appId}`);
    const data = await res.json();
    if (data.app) {
      setAppData(data.app);
      if (data.app.chatThreads?.[0] && !activeThreadId) {
        setActiveThreadId(data.app.chatThreads[0].id);
      }
      if (data.app.workspace?.workflows?.[0] && !selectedWorkflowId) {
        setSelectedWorkflowId(data.app.workspace.workflows[0].id);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadApp();
  }, [appId]);

  // Shift+Tab cycles Agent Mode
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        const modes: Array<"auto" | "build" | "plan" | "chat"> = [
          "auto",
          "build",
          "plan",
          "chat",
        ];
        setAgentMode((prev) => modes[(modes.indexOf(prev) + 1) % modes.length]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const effectiveTier =
    (agentMode === "plan" || agentMode === "chat") &&
    modelTier !== "zite-max-fast"
      ? "zite-max"
      : modelTier;

  const activeThread =
    appData?.chatThreads?.find((t: any) => t.id === activeThreadId) ||
    appData?.chatThreads?.[0];

  const activeWorkflow =
    appData?.workspace?.workflows?.find(
      (w: any) => w.id === selectedWorkflowId
    ) || appData?.workspace?.workflows?.[0];

  async function handleSendPrompt(
    e: React.FormEvent,
    overridePrompt?: string,
    improveTask?: "ui-review" | "bug-finder" | "security-audit" | "performance"
  ) {
    e.preventDefault();
    const textToSend = overridePrompt || prompt;
    if (!textToSend.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appData?.id || "app_ashgrove_crm",
          threadId: activeThread?.id,
          prompt: textToSend,
          mode: agentMode,
          modelTier,
          selectedElement: selectedElement || undefined,
          improveTask,
        }),
      });
      if (res.ok) {
        setPrompt("");
        await loadApp();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleNewThread() {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: appData?.id || "app_ashgrove_crm",
        prompt: "Start a new parallel feature thread for Ashgrove CRM",
        mode: agentMode,
        modelTier,
      }),
    });
    const data = await res.json();
    if (res.ok && data.threadId) {
      await loadApp();
      setActiveThreadId(data.threadId);
    }
  }

  async function handlePublishVersion() {
    const res = await fetch(`/api/apps/${appData.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish",
        title: "Published via AI Studio with updated schema & workflows",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPublishBanner(
        `Published v${data.version.versionNumber} live to ${appData.publishedUrl}`
      );
      await loadApp();
    }
  }

  async function handleRollback(versionId: string) {
    const res = await fetch(`/api/apps/${appData.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "rollback",
        versionId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setPublishBanner(
        `Rolled back to snapshot -> Published v${data.version.versionNumber}`
      );
      await loadApp();
    }
  }

  async function handleExecuteWorkflow(generatePdf = false) {
    if (!activeWorkflow) return;
    let parsed = {};
    try {
      parsed = JSON.parse(testInputJson);
    } catch {
      parsed = { raw: testInputJson };
    }
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute",
        workflowId: activeWorkflow.id,
        input: parsed,
        generatePdf,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setWorkflowExecResult(data);
      await loadApp();
    }
  }

  async function handleReplayRun(runId: string) {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "replay",
        runId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setWorkflowExecResult(data);
      await loadApp();
    }
  }

  const latestVersion = appData?.versions?.[0];
  let filesMap: Record<string, string> = {};
  try {
    filesMap = JSON.parse(latestVersion?.filesJson || "{}");
  } catch {
    filesMap = {};
  }
  const filePaths = Object.keys(filesMap);

  return (
    <StudioShell>
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
        {/* Top Editor Header */}
        <header className="h-14 border-b border-[#E6E4DD] bg-white px-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">{appData?.icon || "📈"}</span>
            <div>
              <div className="font-semibold text-sm leading-tight">
                {appData?.name || "Ashgrove CRM"}
              </div>
              <div className="text-[11px] text-[#5E5D59] font-mono">
                {appData?.publishedUrl || "https://zite-demo-rnc1vjxbjr.zite.so"}
              </div>
            </div>
          </div>

          {/* 5 Studio Canvas Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-lg border border-[#E6E4DD] overflow-x-auto">
            <button
              type="button"
              data-testid="studio-tab-preview"
              onClick={() => setRightTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                rightTab === "preview"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "text-[#5E5D59] hover:text-[#141413]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>App Preview</span>
            </button>
            <button
              type="button"
              data-testid="studio-tab-database"
              onClick={() => setRightTab("database")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                rightTab === "database"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "text-[#5E5D59] hover:text-[#141413]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database</span>
            </button>
            <button
              type="button"
              data-testid="studio-tab-workflows"
              onClick={() => setRightTab("workflows")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                rightTab === "workflows"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "text-[#5E5D59] hover:text-[#141413]"
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Workflows</span>
            </button>
            <button
              type="button"
              data-testid="studio-tab-access"
              onClick={() => setRightTab("access")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                rightTab === "access"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "text-[#5E5D59] hover:text-[#141413]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & Access</span>
            </button>
            <button
              type="button"
              data-testid="studio-tab-code"
              onClick={() => setRightTab("code")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                rightTab === "code"
                  ? "bg-[#141413] text-[#FAF9F5]"
                  : "text-[#5E5D59] hover:text-[#141413]"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code & Versions</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="publish-version-btn"
              onClick={handlePublishVersion}
              className="px-3.5 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-semibold hover:bg-emerald-700"
            >
              Publish Live
            </button>
            <Link
              href={`/published/${appData?.slug || "ashgrove-crm"}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] text-xs font-medium hover:bg-[#F3F1EC]"
            >
              <span>Open Live</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {publishBanner && (
          <div
            data-testid="publish-success-banner"
            className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              {publishBanner}
            </span>
            <button
              type="button"
              onClick={() => setPublishBanner(null)}
              className="underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Split Pane: Left Multi-Chat AI Sidebar + Right Interactive Canvas */}
        <div className="flex-1 grid lg:grid-cols-12 overflow-hidden">
          {/* LEFT PANE: Multi-Chat AI Builder */}
          <div className="lg:col-span-4 border-r border-[#E6E4DD] bg-white flex flex-col overflow-hidden">
            {/* Multi-Chat Thread Switcher */}
            <div className="p-3 border-b border-[#E6E4DD] flex items-center justify-between gap-2 bg-[#FAF9F5]">
              <select
                aria-label="Active Chat Thread"
                data-testid="thread-switcher-select"
                value={activeThread?.id || ""}
                onChange={(e) => setActiveThreadId(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded border border-[#D4D2C8] bg-white text-xs font-medium truncate"
              >
                {(appData?.chatThreads || []).map((th: any) => (
                  <option key={th.id} value={th.id}>
                    💬 {th.title} ({th.mode} · {th.modelTier})
                  </option>
                ))}
              </select>
              <button
                type="button"
                data-testid="new-chat-thread-btn"
                onClick={handleNewThread}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#141413] text-[#FAF9F5] text-xs font-medium shrink-0"
              >
                <Plus className="w-3 h-3" /> New Chat
              </button>
            </div>

            {/* Improve My App Bar */}
            <div className="px-3 py-2 border-b border-[#E6E4DD] flex items-center gap-1.5 overflow-x-auto bg-white">
              <span className="text-[10px] font-semibold uppercase text-[#5E5D59] shrink-0">
                Improve App:
              </span>
              <button
                type="button"
                data-testid="improve-ui-btn"
                onClick={(e) =>
                  handleSendPrompt(
                    e,
                    "Run UI & accessibility review across all CRM screens",
                    "ui-review"
                  )
                }
                className="px-2 py-1 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] hover:bg-[#F3F1EC] whitespace-nowrap"
              >
                ✨ UI Review
              </button>
              <button
                type="button"
                data-testid="improve-bugs-btn"
                onClick={(e) =>
                  handleSendPrompt(
                    e,
                    "Scan for null handling and pagination bugs",
                    "bug-finder"
                  )
                }
                className="px-2 py-1 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] hover:bg-[#F3F1EC] whitespace-nowrap flex items-center gap-1"
              >
                <Bug className="w-3 h-3 text-amber-600" /> Bug Finder
              </button>
              <button
                type="button"
                data-testid="improve-security-btn"
                onClick={(e) =>
                  handleSendPrompt(
                    e,
                    "Run security & RBAC access rule audit",
                    "security-audit"
                  )
                }
                className="px-2 py-1 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] hover:bg-[#F3F1EC] whitespace-nowrap flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Security
              </button>
            </div>

            {/* Messages History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F5]/50">
              {(activeThread?.messages || []).map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl text-xs space-y-1.5 ${
                    msg.role === "user"
                      ? "bg-[#141413] text-[#FAF9F5] ml-6"
                      : "bg-white border border-[#E6E4DD] text-[#141413] mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-75">
                    <span className="uppercase font-semibold">{msg.role}</span>
                    {msg.providerUsed && (
                      <span>
                        {msg.providerUsed} · {msg.creditsUsed} cr
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Prompt Composer + Mode/Model Selector + Selective Edits */}
            <form
              onSubmit={(e) => handleSendPrompt(e)}
              className="p-3 border-t border-[#E6E4DD] bg-white space-y-2.5"
            >
              {selectedElement && (
                <div className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-[11px] text-[#2563EB] flex items-center justify-between">
                  <span>🎯 Selective Edit Target: {selectedElement}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedElement(null)}
                    className="underline"
                  >
                    Clear
                  </button>
                </div>
              )}

              <textarea
                rows={2}
                data-testid="studio-chat-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Zite Agent (Shift+Tab cycles Auto/Build/Plan/Chat)..."
                className="w-full p-2.5 rounded-lg border border-[#D4D2C8] text-xs bg-[#FAF9F5]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(["auto", "build", "plan", "chat"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-testid={`studio-mode-${m}`}
                      onClick={() => setAgentMode(m)}
                      className={`px-2 py-1 rounded text-[11px] font-medium capitalize ${
                        agentMode === m
                          ? "bg-[#141413] text-[#FAF9F5]"
                          : "bg-[#FAF9F5] text-[#5E5D59]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-testid="selective-edits-btn"
                    onClick={() => {
                      setSelectiveEditActive(!selectiveEditActive);
                      if (!selectedElement) {
                        setSelectedElement("<DealForecastCard />");
                      }
                    }}
                    className={`p-1.5 rounded border text-[11px] ${
                      selectiveEditActive
                        ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                        : "border-[#E6E4DD] text-[#5E5D59]"
                    }`}
                    title="Selective Visual Element Inspector"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    aria-label="Studio Model Tier"
                    data-testid="studio-model-select"
                    value={modelTier}
                    onChange={(e) => setModelTier(e.target.value as any)}
                    className="px-2 py-1 rounded border border-[#D4D2C8] text-[11px]"
                  >
                    <option value="zite-mini">Zite Mini</option>
                    <option value="zite-pro">Zite Pro</option>
                    <option value="zite-max">Zite Max</option>
                    <option value="zite-max-fast">Zite Max Fast</option>
                  </select>
                  <button
                    type="submit"
                    disabled={sending}
                    data-testid="studio-send-btn"
                    className="px-3 py-1 rounded bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
              <div
                data-testid="studio-effective-tier"
                className="text-[10px] text-[#5E5D59]"
              >
                Effective Tier: <strong>{effectiveTier}</strong>
              </div>
            </form>
          </div>

          {/* RIGHT PANE: Interactive Canvas */}
          <div className="lg:col-span-8 bg-[#FAF9F5] overflow-y-auto p-6">
            {loading ? (
              <div className="text-xs text-[#5E5D59]">Loading Studio Canvas...</div>
            ) : rightTab === "preview" ? (
              /* TAB 1: LIVE PREVIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-[#5E5D59]">
                    Interactive Preview Canvas · Click any card with Selective Edits enabled to target it
                  </div>
                  <Link
                    href={`/published/${appData?.slug || "ashgrove-crm"}`}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Open Full-Screen Published App →
                  </Link>
                </div>

                <div
                  onClick={() => {
                    if (selectiveEditActive) {
                      setSelectedElement("<RevenuePipelineHeader />");
                    }
                  }}
                  className={`rounded-2xl border bg-white p-6 space-y-6 shadow-sm ${
                    selectiveEditActive
                      ? "border-[#2563EB] ring-2 ring-blue-200 cursor-crosshair"
                      : "border-[#E6E4DD]"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#E6E4DD] pb-4">
                    <div>
                      <h2 className="font-editorial text-2xl">
                        {appData?.name} — Live Workspace Preview
                      </h2>
                      <p className="text-xs text-[#5E5D59]">
                        Connected to {appData?.workspace?.tables?.length || 6} Zite Database Tables & {appData?.workspace?.workflows?.length || 4} Workflows
                      </p>
                    </div>
                    <Link
                      href={`/published/${appData?.slug || "ashgrove-crm"}`}
                      className="px-3.5 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
                    >
                      Interact with Full CRM Modules →
                    </Link>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {(appData?.workspace?.tables || []).slice(0, 6).map((t: any) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] space-y-1"
                      >
                        <div className="text-base font-semibold">
                          {t.icon} {t.name}
                        </div>
                        <div className="text-xs text-[#5E5D59]">
                          {t.records?.length || 0} rows · {t.fields?.length || 0}{" "}
                          typed columns
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : rightTab === "database" ? (
              /* TAB 2: EMBEDDED DATABASE SUMMARY */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl">
                    Workspace Database Tables
                  </h2>
                  <Link
                    href={`/database/${appData?.workspaceId || "ws_ashgrove_crm"}`}
                    className="px-3.5 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
                  >
                    Open Full Database & SQL Studio →
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(appData?.workspace?.tables || []).map((t: any) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-[#E6E4DD] bg-white p-4 space-y-2"
                    >
                      <div className="font-semibold text-sm">
                        {t.icon} {t.name} ({t.records?.length || 0} records)
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(t.fields || []).map((f: any) => (
                          <span
                            key={f.id}
                            className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-[10px] font-mono"
                          >
                            {f.name}:{f.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : rightTab === "workflows" ? (
              /* TAB 3: WORKFLOWS STUDIO (Preview, Code, History, Test Run + PDF) */
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <select
                    data-testid="workflow-select"
                    value={activeWorkflow?.id || ""}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D4D2C8] bg-white text-xs font-semibold"
                  >
                    {(appData?.workspace?.workflows || []).map((w: any) => (
                      <option key={w.id} value={w.id}>
                        ⚡ {w.name} ({w.triggerType})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E6E4DD]">
                    {(["preview", "code", "history", "test"] as const).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          data-testid={`wf-subtab-${st}`}
                          onClick={() => setWorkflowSubTab(st)}
                          className={`px-3 py-1 rounded text-xs font-medium capitalize ${
                            workflowSubTab === st
                              ? "bg-[#141413] text-[#FAF9F5]"
                              : "text-[#5E5D59]"
                          }`}
                        >
                          {st === "test" ? "Test Run & PDF" : st}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {activeWorkflow && workflowSubTab === "preview" && (
                  <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
                    <div className="text-xs font-semibold uppercase text-[#7C3AED]">
                      Trigger: {activeWorkflow.triggerType} ({activeWorkflow.triggerConfig})
                    </div>
                    <h3 className="font-editorial text-2xl">
                      {activeWorkflow.name}
                    </h3>
                    <p className="text-xs text-[#5E5D59]">
                      {activeWorkflow.description}
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] text-xs">
                        <div className="font-semibold">1. Input Validation</div>
                        <div className="text-[#5E5D59] text-[11px]">
                          Zod `inputSchema` & `context.user` check
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] text-xs">
                        <div className="font-semibold">2. Database & AI Step</div>
                        <div className="text-[#5E5D59] text-[11px]">
                          `zite.deals` / `ZitePdf.renderHtml`
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] text-xs">
                        <div className="font-semibold">3. Output & Audit Log</div>
                        <div className="text-[#5E5D59] text-[11px]">
                          Records `workflow.execute` telemetry
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeWorkflow && workflowSubTab === "code" && (
                  <div className="rounded-2xl border border-[#E6E4DD] bg-[#141413] text-[#FAF9F5] p-5 font-mono text-xs overflow-x-auto">
                    <pre>{activeWorkflow.code}</pre>
                  </div>
                )}

                {activeWorkflow && workflowSubTab === "history" && (
                  <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                          <th className="p-3">Status</th>
                          <th className="p-3">Trigger</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Logs</th>
                          <th className="p-3 text-right">Replay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E4DD]">
                        {(activeWorkflow.runs || []).map((run: any) => (
                          <tr key={run.id}>
                            <td className="p-3 font-semibold text-[#059669]">
                              {run.status}
                            </td>
                            <td className="p-3">{run.triggeredBy}</td>
                            <td className="p-3 font-mono">{run.durationMs}ms</td>
                            <td className="p-3 font-mono text-[11px] text-[#5E5D59] max-w-xs truncate">
                              {run.logsText}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                data-testid={`replay-run-${run.id}`}
                                onClick={() => handleReplayRun(run.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#D4D2C8] hover:bg-[#F3F1EC]"
                              >
                                <RotateCcw className="w-3 h-3" /> Replay
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeWorkflow && workflowSubTab === "test" && (
                  <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
                    <h3 className="font-semibold text-sm">
                      Execute Test Run or Render PDF Document (`ZitePdf.renderHtml`)
                    </h3>
                    <textarea
                      rows={4}
                      data-testid="wf-test-input"
                      value={testInputJson}
                      onChange={(e) => setTestInputJson(e.target.value)}
                      className="w-full p-3 rounded-lg border border-[#D4D2C8] font-mono text-xs bg-[#FAF9F5]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="wf-execute-btn"
                        onClick={() => handleExecuteWorkflow(false)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Execute Endpoint</span>
                      </button>
                      <button
                        type="button"
                        data-testid="wf-generate-pdf-btn"
                        onClick={() => handleExecuteWorkflow(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Render PDF via ZitePdf.renderHtml</span>
                      </button>
                    </div>

                    {workflowExecResult && (
                      <div
                        data-testid="wf-exec-result"
                        className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2"
                      >
                        <div className="font-semibold text-emerald-900">
                          Execution Succeeded ({workflowExecResult.run?.durationMs}ms)
                        </div>
                        <pre className="font-mono text-[11px] overflow-x-auto">
                          {workflowExecResult.run?.outputJson}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : rightTab === "access" ? (
              /* TAB 4: USERS, GROUPS & GRANULAR ACCESS RULES */
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
                  <h2 className="font-editorial text-2xl">
                    End-User Authentication & Row-Level Access Rules
                  </h2>
                  <p className="text-xs text-[#5E5D59]">
                    Configure how users sign in to this published app and enforce row-level security across Zite Database tables.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    {[
                      "Email Magic Link / OTP",
                      "Google & Microsoft OAuth",
                      "Enterprise SAML 2.0 SSO",
                    ].map((method) => (
                      <div
                        key={method}
                        className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] flex items-center justify-between font-medium"
                      >
                        <span>{method}</span>
                        <span className="text-[#059669] font-semibold">Enabled</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-3">
                  <h3 className="font-semibold text-sm">
                    Active Row-Level Access Rules
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] flex justify-between">
                      <span>
                        <strong>Deals Table:</strong> Account Executives can edit rows where `Deal.ownerEmail == context.user.email`
                      </span>
                      <span className="text-[#059669] font-mono">ACTIVE</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] flex justify-between">
                      <span>
                        <strong>All Tables:</strong> Admins have full read/write/schema access
                      </span>
                      <span className="text-[#059669] font-mono">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 5: FULL TYPESCRIPT MONOREPO CODE & VERSION ROLLBACK */
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#E6E4DD] bg-white p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm">
                      Zite.js TypeScript Monorepo Inspector
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {filePaths.map((fp) => (
                        <button
                          key={fp}
                          type="button"
                          onClick={() => setSelectedFilePath(fp)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono ${
                            selectedFilePath === fp
                              ? "bg-[#141413] text-[#FAF9F5]"
                              : "bg-[#FAF9F5] border border-[#E6E4DD]"
                          }`}
                        >
                          {fp}
                        </button>
                      ))}
                    </div>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#141413] text-[#FAF9F5] font-mono text-xs overflow-x-auto">
                    {filesMap[selectedFilePath] ||
                      filesMap[filePaths[0]] ||
                      "// Select a file above"}
                  </pre>
                </div>

                <div className="rounded-2xl border border-[#E6E4DD] bg-white p-5 space-y-3">
                  <h3 className="font-semibold text-sm">
                    Immutable Version History & Instant Rollback
                  </h3>
                  <div className="space-y-2">
                    {(appData?.versions || []).map((ver: any) => (
                      <div
                        key={ver.id}
                        data-testid={`version-row-v${ver.versionNumber}`}
                        className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E6E4DD] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold">
                            v{ver.versionNumber} — {ver.title}
                          </div>
                          <div className="text-[11px] text-[#5E5D59]">
                            {ver.changelog} · by {ver.createdByEmail}
                          </div>
                        </div>
                        <button
                          type="button"
                          data-testid={`rollback-btn-v${ver.versionNumber}`}
                          onClick={() => handleRollback(ver.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white hover:bg-[#F3F1EC] font-medium"
                        >
                          <RotateCcw className="w-3 h-3" /> Rollback to v{ver.versionNumber}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StudioShell>
  );
}
