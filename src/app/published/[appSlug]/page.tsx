"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  Contact,
  CheckSquare,
  Send,
  BarChart3,
  Search,
  Plus,
  FileText,
  ArrowLeft,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

type ModuleKey =
  | "home"
  | "leads"
  | "deals"
  | "companies"
  | "contacts"
  | "tasks"
  | "outreach"
  | "reports";

const MODULES: Array<{ key: ModuleKey; label: string; icon: any }> = [
  { key: "home", label: "Home", icon: LayoutDashboard },
  { key: "leads", label: "Leads", icon: Users },
  { key: "deals", label: "Deals", icon: Briefcase },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "contacts", label: "Contacts", icon: Contact },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "outreach", label: "Outreach", icon: Send },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

export default function PublishedAppRunnerPage() {
  const params = useParams<{ appSlug: string }>();
  const appSlug = params.appSlug || "ashgrove-crm";

  const [tables, setTables] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState<ModuleKey>("home");
  const [dealsView, setDealsView] = useState<"kanban" | "grid">("kanban");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Global Search Modal (Ctrl+K)
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // + New Deal Modal
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealName, setNewDealName] = useState("");
  const [newDealCompany, setNewDealCompany] = useState("Kestrel Aerospace");
  const [newDealAmount, setNewDealAmount] = useState(125000);
  const [newDealStage, setNewDealStage] = useState("Proposal");

  // PDF Quote Banner
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const workspaceId =
    appSlug === "talentflow-ats"
      ? "ws_talent_ats"
      : appSlug === "clienthub-portal"
      ? "ws_client_portal"
      : "ws_ashgrove_crm";

  async function loadData() {
    const res = await fetch(`/api/workspaces/${workspaceId}/database`);
    const data = await res.json();
    setTables(data.tables || []);
  }

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function getRecords(slug: string) {
    const found = tables.find((t) => t.slug === slug);
    return found?.records || [];
  }

  const deals = getRecords("deals");
  const leads = getRecords("leads");
  const companies = getRecords("companies");
  const contacts = getRecords("contacts");
  const tasks = getRecords("tasks");
  const sequences = getRecords("outreach_sequences");

  const totalPipeline = deals.reduce(
    (acc: number, r: any) => acc + (Number(r.data.amount) || 0),
    0
  );
  const weightedForecast = deals.reduce(
    (acc: number, r: any) =>
      acc +
      (Number(r.data.weightedValue) ||
        Math.round(
          ((Number(r.data.amount) || 0) * (Number(r.data.probability) || 50)) /
            100
        )),
    0
  );

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    const dealsTable = tables.find((t) => t.slug === "deals") || tables[0];
    if (!dealsTable || !newDealName.trim()) return;
    await fetch(`/api/workspaces/${workspaceId}/database`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createRecord",
        tableId: dealsTable.id,
        data: {
          dealName: newDealName.trim(),
          company: newDealCompany,
          stage: newDealStage,
          amount: Number(newDealAmount),
          probability: 65,
          weightedValue: Math.round(Number(newDealAmount) * 0.65),
          closeDate: "2026-06-30",
          ownerEmail: "dominic@ashgrovesoftware.com",
          aiDealBrief:
            "AI Deal Brief: Newly created opportunity ready for technical qualification.",
        },
      }),
    });
    setNewDealName("");
    setNewDealOpen(false);
    await loadData();
  }

  async function handleGeneratePdfQuote(deal: any) {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "execute",
        workflowId: "wf_generate_quote_pdf",
        input: {
          dealName: deal.data.dealName,
          company: deal.data.company,
          amount: deal.data.amount,
        },
        generatePdf: true,
      }),
    });
    if (res.ok) {
      setPdfNotice(
        `Generated PDF Order Form via ZitePdf.renderHtml for "${deal.data.dealName}" ($${Number(
          deal.data.amount || 0
        ).toLocaleString()})`
      );
    }
  }

  const allSearchable = tables.flatMap((t) =>
    (t.records || []).map((r: any) => ({
      tableName: t.name,
      id: r.id,
      label:
        r.data.dealName ||
        r.data.fullName ||
        r.data.name ||
        r.data.title ||
        r.data.candidateName ||
        r.data.invoiceNumber ||
        r.id,
      sub: JSON.stringify(r.data),
    }))
  );

  const searchHits = allSearchable.filter(
    (item) =>
      !searchQuery.trim() ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sub.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#141413] flex">
      {/* Sidebar matching zite-demo-rnc1vjxbjr.zite.so */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-[#E6E4DD] bg-white justify-between p-4 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#141413] text-[#FAF9F5] flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div>
                <div className="font-semibold text-sm leading-tight">
                  Ashgrove Software
                </div>
                <div className="text-[11px] text-[#5E5D59]">
                  zite-demo-rnc1vjxbjr.zite.so
                </div>
              </div>
            </div>
          </div>

          {/* Search & + New Bar */}
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="crm-global-search-btn"
              onClick={() => setSearchOpen(true)}
              className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg border border-[#E6E4DD] bg-[#FAF9F5] text-xs text-[#5E5D59]"
            >
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Search
              </span>
              <kbd className="text-[10px] font-mono">⌘K</kbd>
            </button>
            <button
              type="button"
              data-testid="crm-new-deal-btn"
              onClick={() => setNewDealOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <nav className="space-y-1">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const active = activeModule === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  data-testid={`crm-nav-${m.key}`}
                  onClick={() => setActiveModule(m.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    active
                      ? "bg-[#141413] text-[#FAF9F5]"
                      : "text-[#5E5D59] hover:bg-[#F3F1EC] hover:text-[#141413]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E6E4DD] space-y-2">
          <div className="px-2 py-1.5 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-[11px]">
            <div className="font-semibold">Dominic Olsen</div>
            <div className="text-[#5E5D59]">dominic@ashgrovesoftware.com</div>
          </div>
          <Link
            href="/editor/app_ashgrove_crm"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-[#D4D2C8] text-xs font-medium hover:bg-[#F3F1EC]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Made with Zite · Edit in Studio</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-[#E6E4DD] bg-white px-4 flex items-center justify-between">
          <div className="font-semibold text-sm">Ashgrove Software CRM</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNewDealOpen(true)}
              className="px-2.5 py-1 rounded bg-[#141413] text-[#FAF9F5] text-xs"
            >
              + New
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <div className="lg:hidden border-b border-[#E6E4DD] bg-white p-3 flex flex-wrap gap-1.5">
            {MODULES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setActiveModule(m.key);
                  setMobileNavOpen(false);
                }}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  activeModule === m.key
                    ? "bg-[#141413] text-[#FAF9F5]"
                    : "bg-[#FAF9F5]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {pdfNotice && (
          <div
            data-testid="crm-pdf-banner"
            className="bg-purple-50 border-b border-purple-200 px-6 py-2.5 text-xs text-purple-950 flex items-center justify-between"
          >
            <span className="font-medium">📄 {pdfNotice}</span>
            <button
              type="button"
              onClick={() => setPdfNotice(null)}
              className="underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* MODULE 1: HOME DASHBOARD */}
          {activeModule === "home" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-editorial text-3xl text-[#141413]">
                    Good morning, Dominic
                  </h1>
                  <p className="text-xs text-[#5E5D59]">
                    Ashgrove Software Revenue OS · Real-time Zite Database telemetry
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewDealOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
                >
                  + New Deal
                </button>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-1">
                  <div className="text-xs text-[#5E5D59]">Open Pipeline</div>
                  <div
                    data-testid="crm-kpi-pipeline"
                    className="font-editorial text-3xl text-[#141413]"
                  >
                    ${totalPipeline.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#059669]">
                    {deals.length} active opportunities
                  </div>
                </div>
                <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-1">
                  <div className="text-xs text-[#5E5D59]">
                    Weighted Forecast (Formula)
                  </div>
                  <div className="font-editorial text-3xl text-[#2563EB]">
                    ${weightedForecast.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#5E5D59]">
                    Auto-calculated via `ROUND(amount * prob)`
                  </div>
                </div>
                <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-1">
                  <div className="text-xs text-[#5E5D59]">Active Leads</div>
                  <div className="font-editorial text-3xl text-[#141413]">
                    {leads.length}
                  </div>
                  <div className="text-[11px] text-[#5E5D59]">
                    Inbound & Partner referrals
                  </div>
                </div>
                <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-1">
                  <div className="text-xs text-[#5E5D59]">Account Companies</div>
                  <div className="font-editorial text-3xl text-[#141413]">
                    {companies.length}
                  </div>
                  <div className="text-[11px] text-[#5E5D59]">
                    Enterprise & Mid-Market
                  </div>
                </div>
              </div>

              {/* Deals Table Preview with AI Deal Brief & 1-Click PDF Quote */}
              <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base">
                    Priority Revenue Deals (with AI Deal Briefs & PDF Order Forms)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModule("deals")}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    Open Kanban Board →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E4DD] text-[#5E5D59]">
                        <th className="py-2.5 pr-4">Deal Name</th>
                        <th className="py-2.5 pr-4">Company</th>
                        <th className="py-2.5 pr-4">Stage</th>
                        <th className="py-2.5 pr-4">Amount</th>
                        <th className="py-2.5 pr-4">AI Deal Brief (`AiField`)</th>
                        <th className="py-2.5 text-right">Order Form PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E4DD]">
                      {deals.map((d: any) => (
                        <tr key={d.id}>
                          <td className="py-3 pr-4 font-semibold">
                            {d.data.dealName}
                          </td>
                          <td className="py-3 pr-4">{d.data.company}</td>
                          <td className="py-3 pr-4">
                            <span className="px-2 py-0.5 rounded-full bg-[#F3F1EC] font-medium">
                              {d.data.stage}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-mono font-semibold text-[#059669]">
                            ${Number(d.data.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-[#5E5D59] max-w-xs truncate">
                            {d.data.aiDealBrief}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              data-testid={`generate-quote-${d.id}`}
                              onClick={() => handleGeneratePdfQuote(d)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#D4D2C8] hover:bg-[#F3F1EC] font-medium"
                            >
                              <FileText className="w-3 h-3 text-[#7C3AED]" /> Quote PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: DEALS KANBAN & GRID */}
          {activeModule === "deals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-editorial text-3xl">Deals Pipeline</h1>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDealsView("kanban")}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      dealsView === "kanban"
                        ? "bg-[#141413] text-[#FAF9F5]"
                        : "bg-white border border-[#E6E4DD]"
                    }`}
                  >
                    Kanban Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setDealsView("grid")}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${
                      dealsView === "grid"
                        ? "bg-[#141413] text-[#FAF9F5]"
                        : "bg-white border border-[#E6E4DD]"
                    }`}
                  >
                    Table Grid
                  </button>
                </div>
              </div>

              {dealsView === "kanban" ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    "Discovery",
                    "Qualified",
                    "Proposal",
                    "Negotiation",
                    "Closed Won",
                  ].map((stage) => {
                    const stageDeals = deals.filter(
                      (d: any) => d.data.stage === stage
                    );
                    return (
                      <div
                        key={stage}
                        className="rounded-xl border border-[#E6E4DD] bg-white p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{stage}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#F3F1EC]">
                            {stageDeals.length}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {stageDeals.map((d: any) => (
                            <div
                              key={d.id}
                              className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-xs space-y-1.5"
                            >
                              <div className="font-semibold">{d.data.dealName}</div>
                              <div className="text-[#5E5D59]">{d.data.company}</div>
                              <div className="font-mono font-semibold text-[#059669]">
                                ${Number(d.data.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E6E4DD] bg-white p-4">
                  {deals.map((d: any) => (
                    <div
                      key={d.id}
                      className="py-2.5 border-b last:border-b-0 border-[#E6E4DD] flex justify-between text-xs"
                    >
                      <span className="font-semibold">{d.data.dealName}</span>
                      <span className="font-mono">
                        ${Number(d.data.amount || 0).toLocaleString()} ({d.data.stage})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODULE 3: LEADS */}
          {activeModule === "leads" && (
            <div className="space-y-4">
              <h1 className="font-editorial text-3xl">Inbound & Outbound Leads</h1>
              <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                      <th className="p-3.5">Full Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Lead Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E4DD]">
                    {leads.map((l: any) => (
                      <tr key={l.id}>
                        <td className="p-3.5 font-semibold">{l.data.fullName}</td>
                        <td className="p-3.5 text-[#5E5D59]">{l.data.email}</td>
                        <td className="p-3.5">{l.data.company}</td>
                        <td className="p-3.5">{l.data.status}</td>
                        <td className="p-3.5 font-mono font-semibold text-[#059669]">
                          {l.data.leadScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 4: COMPANIES */}
          {activeModule === "companies" && (
            <div className="space-y-4">
              <h1 className="font-editorial text-3xl">Accounts & Companies</h1>
              <div className="grid sm:grid-cols-2 gap-4">
                {companies.map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-1 text-xs"
                  >
                    <div className="font-semibold text-base">{c.data.name}</div>
                    <div className="text-[#5E5D59]">
                      {c.data.domain} · {c.data.industry}
                    </div>
                    <div className="font-mono text-[#059669] pt-1">
                      ARR: ${Number(c.data.arr || 0).toLocaleString()} ·{" "}
                      {c.data.employees} employees
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 5: CONTACTS */}
          {activeModule === "contacts" && (
            <div className="space-y-4">
              <h1 className="font-editorial text-3xl">Executive Contacts</h1>
              <div className="grid sm:grid-cols-3 gap-4">
                {contacts.map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-1 text-xs"
                  >
                    <div className="font-semibold text-sm">{c.data.fullName}</div>
                    <div className="text-[#2563EB]">{c.data.roleTitle}</div>
                    <div className="text-[#5E5D59]">
                      {c.data.company} · {c.data.email}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 6: TASKS */}
          {activeModule === "tasks" && (
            <div className="space-y-4">
              <h1 className="font-editorial text-3xl">Follow-up Tasks</h1>
              <div className="space-y-2">
                {tasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-[#E6E4DD] bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold">{t.data.title}</div>
                      <div className="text-[#5E5D59]">
                        Priority: {t.data.priority} · Due: {t.data.dueDate}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#F3F1EC] font-medium">
                      {t.data.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 7: OUTREACH SEQUENCES */}
          {activeModule === "outreach" && (
            <div className="space-y-4">
              <h1 className="font-editorial text-3xl">
                Automated Outreach Sequences
              </h1>
              <div className="grid sm:grid-cols-3 gap-4">
                {sequences.map((s: any) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-2 text-xs"
                  >
                    <div className="font-semibold text-sm">
                      {s.data.sequenceName}
                    </div>
                    <div className="text-[#5E5D59]">
                      Audience: {s.data.targetPersona}
                    </div>
                    <div className="font-mono text-[#059669]">
                      Reply Rate: {s.data.replyRate}% ({s.data.status})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 8: REPORTS */}
          {activeModule === "reports" && (
            <div className="space-y-4">
              <h1 className="font-editorial text-3xl">
                Executive Pipeline Analytics & Reports
              </h1>
              <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4">
                <div className="text-sm font-semibold">
                  Stage-by-Stage Revenue Breakdown
                </div>
                {[
                  "Discovery",
                  "Qualified",
                  "Proposal",
                  "Negotiation",
                  "Closed Won",
                ].map((stage) => {
                  const sum = deals
                    .filter((d: any) => d.data.stage === stage)
                    .reduce(
                      (a: number, b: any) => a + (Number(b.data.amount) || 0),
                      0
                    );
                  const pct = Math.min(
                    100,
                    Math.round((sum / Math.max(1, totalPipeline)) * 100)
                  );
                  return (
                    <div key={stage} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span>{stage}</span>
                        <span className="font-mono">
                          ${sum.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#F3F1EC] overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB]"
                          style={{ width: `${Math.max(6, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E6E4DD] bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase text-[#5E5D59]">
                Global Workspace Search (`zitejs/db`)
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs text-[#5E5D59]"
              >
                ESC
              </button>
            </div>
            <input
              type="text"
              autoFocus
              data-testid="crm-search-modal-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, leads, companies, contacts..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#D4D2C8] text-sm"
            />
            <div className="max-h-64 overflow-y-auto divide-y divide-[#E6E4DD] text-xs">
              {searchHits.slice(0, 10).map((hit) => (
                <div key={hit.id} className="py-2.5 flex justify-between">
                  <span className="font-semibold">{hit.label}</span>
                  <span className="text-[#5E5D59]">{hit.tableName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* + New Deal Modal */}
      {newDealOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <form
            onSubmit={handleCreateDeal}
            className="w-full max-w-md rounded-2xl border border-[#E6E4DD] bg-white p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-2xl">Create New Deal</h2>
              <button
                type="button"
                onClick={() => setNewDealOpen(false)}
                className="text-xs text-[#5E5D59]"
              >
                Close
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Deal Name</label>
              <input
                type="text"
                required
                data-testid="crm-new-deal-name"
                value={newDealName}
                onChange={(e) => setNewDealName(e.target.value)}
                placeholder="Vanguard Logistics — Global Portal"
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Company</label>
                <input
                  type="text"
                  value={newDealCompany}
                  onChange={(e) => setNewDealCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  data-testid="crm-new-deal-amount"
                  value={newDealAmount}
                  onChange={(e) => setNewDealAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              data-testid="crm-new-deal-submit"
              className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
            >
              Save Deal to Zite Database
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
