"use client";

import React, { useEffect, useState } from "react";
import { StudioShell } from "@/components/StudioShell";
import {
  ShieldAlert,
  KeyRound,
  Users,
  Cpu,
  Download,
  RefreshCw,
  Ban,
  CheckCircle2,
  Copy,
} from "lucide-react";

export default function SettingsGovernancePage() {
  const [activeTab, setActiveTab] = useState<
    "invitations" | "users" | "ai" | "audit"
  >("invitations");

  // Invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">(
    "EDITOR"
  );
  const [issuedTokenUrl, setIssuedTokenUrl] = useState<string | null>(null);
  const [issuedRawToken, setIssuedRawToken] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<any[]>([]);

  // AI Status state
  const [aiStatus, setAiStatus] = useState<any>(null);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditCategory, setAuditCategory] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);

  async function loadAll() {
    const [invRes, usrRes, aiRes, audRes] = await Promise.all([
      fetch("/api/invitations"),
      fetch("/api/admin/users"),
      fetch("/api/ai/status"),
      fetch(
        `/api/admin/audit-logs?${new URLSearchParams({
          ...(auditCategory ? { category: auditCategory } : {}),
          ...(criticalOnly ? { criticalOnly: "true" } : {}),
        }).toString()}`
      ),
    ]);
    if (invRes.ok) {
      const d = await invRes.json();
      setInvitations(d.invitations || []);
    }
    if (usrRes.ok) {
      const d = await usrRes.json();
      setUsers(d.users || []);
    }
    if (aiRes.ok) {
      setAiStatus(await aiRes.json());
    }
    if (audRes.ok) {
      const d = await audRes.json();
      setAuditLogs(d.logs || []);
    }
  }

  useEffect(() => {
    loadAll();
  }, [auditCategory, criticalOnly]);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        role: inviteRole,
        expiresInHours: 72,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setIssuedTokenUrl(data.inviteUrl);
      setIssuedRawToken(data.rawToken);
      setInviteEmail("");
      await loadAll();
    }
  }

  async function handleRotateInvite(id: string) {
    const res = await fetch(`/api/invitations/${id}/rotate`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      setIssuedTokenUrl(data.inviteUrl);
      setIssuedRawToken(data.rawToken);
      await loadAll();
    }
  }

  async function handleRevokeInvite(id: string) {
    await fetch(`/api/invitations/${id}/revoke`, { method: "POST" });
    await loadAll();
  }

  async function handleUserAction(
    userId: string,
    payload: { action: "changeRole" | "revoke" | "restore"; role?: string }
  ) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadAll();
  }

  async function handleSwitchAiProvider(provider: string) {
    const res = await fetch("/api/ai/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    if (res.ok) {
      setAiStatus(await res.json());
      await loadAll();
    }
  }

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Organization Settings & Enterprise Governance
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
            Invite-Only Admission, RBAC, Pluggable AI & Audit Logs
          </h1>
          <p className="text-sm text-[#5E5D59]">
            Manage single-use SHA-256 invitations, role assignments, immediate session revocation, AI provider switching, and security-critical audit trails.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#E6E4DD] pb-2">
          <button
            type="button"
            data-testid="settings-tab-invitations"
            onClick={() => setActiveTab("invitations")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
              activeTab === "invitations"
                ? "bg-[#141413] text-[#FAF9F5]"
                : "bg-white border border-[#E6E4DD] text-[#5E5D59]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Single-Use Invitations</span>
          </button>
          <button
            type="button"
            data-testid="settings-tab-users"
            onClick={() => setActiveTab("users")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
              activeTab === "users"
                ? "bg-[#141413] text-[#FAF9F5]"
                : "bg-white border border-[#E6E4DD] text-[#5E5D59]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users, Roles & Revocation</span>
          </button>
          <button
            type="button"
            data-testid="settings-tab-ai"
            onClick={() => setActiveTab("ai")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
              activeTab === "ai"
                ? "bg-[#141413] text-[#FAF9F5]"
                : "bg-white border border-[#E6E4DD] text-[#5E5D59]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Pluggable AI Engine (Copilot SDK / Azure OpenAI)</span>
          </button>
          <button
            type="button"
            data-testid="settings-tab-audit"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
              activeTab === "audit"
                ? "bg-[#141413] text-[#FAF9F5]"
                : "bg-white border border-[#E6E4DD] text-[#5E5D59]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security Audit Logs</span>
          </button>
        </div>

        {/* TAB 1: INVITATIONS */}
        {activeTab === "invitations" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateInvite}
              className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-4"
            >
              <h2 className="font-semibold text-base">
                Issue Single-Use Expiring Invitation (`user.invite`)
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  required
                  data-testid="invite-email-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="new.member@company.com"
                  className="px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
                />
                <select
                  data-testid="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs"
                >
                  <option value="ADMIN">ADMIN (Full Governance)</option>
                  <option value="EDITOR">EDITOR (Build Apps, DB & Workflows)</option>
                  <option value="VIEWER">VIEWER (Read-Only Runner)</option>
                </select>
                <button
                  type="submit"
                  data-testid="issue-invite-btn"
                  className="px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-semibold"
                >
                  Generate Single-Use Invite Token
                </button>
              </div>

              {issuedTokenUrl && (
                <div
                  data-testid="issued-invite-banner"
                  className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5"
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    <span>
                      Single-Use Token Generated (Plaintext shown once; SHA-256 hash stored in DB):
                    </span>
                  </div>
                  <div className="font-mono text-[11px] break-all bg-white p-2 rounded border border-emerald-200">
                    Token: <span data-testid="issued-raw-token">{issuedRawToken}</span>
                    <br />
                    URL: <span data-testid="issued-invite-url">{issuedTokenUrl}</span>
                  </div>
                </div>
              )}
            </form>

            <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                    <th className="p-3.5">Invited Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Expires At</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  {invitations.map((inv) => (
                    <tr key={inv.id} data-testid={`invite-row-${inv.email}`}>
                      <td className="p-3.5 font-medium">{inv.email}</td>
                      <td className="p-3.5 font-mono">{inv.role}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            inv.status === "PENDING"
                              ? "bg-blue-50 text-blue-700"
                              : inv.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#5E5D59]">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {inv.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              data-testid={`rotate-invite-${inv.email}`}
                              onClick={() => handleRotateInvite(inv.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#D4D2C8] hover:bg-[#F3F1EC]"
                            >
                              <RefreshCw className="w-3 h-3" /> Rotate
                            </button>
                            <button
                              type="button"
                              data-testid={`revoke-invite-${inv.email}`}
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Ban className="w-3 h-3" /> Revoke
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: USERS, RBAC & IMMEDIATE REVOCATION */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                  <th className="p-3.5">Member</th>
                  <th className="p-3.5">Role (`ADMIN` / `EDITOR` / `VIEWER`)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Origin</th>
                  <th className="p-3.5">Session Version</th>
                  <th className="p-3.5 text-right">Revocation & Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {users.map((u) => (
                  <tr key={u.id} data-testid={`user-row-${u.email}`}>
                    <td className="p-3.5">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[#5E5D59]">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <select
                        data-testid={`role-select-${u.email}`}
                        value={u.role}
                        onChange={(e) =>
                          handleUserAction(u.id, {
                            action: "changeRole",
                            role: e.target.value,
                          })
                        }
                        className="px-2.5 py-1 rounded border border-[#D4D2C8] bg-[#FAF9F5] font-mono text-xs"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <span
                        data-testid={`user-status-${u.email}`}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#5E5D59]">
                      {u.createdByAdminBootstrap
                        ? "CLI Bootstrap (`bootstrap:admin`)"
                        : "Single-Use Invite"}
                    </td>
                    <td className="p-3.5 font-mono">v{u.sessionVersion}</td>
                    <td className="p-3.5 text-right">
                      {u.status === "ACTIVE" ? (
                        <button
                          type="button"
                          data-testid={`revoke-user-${u.email}`}
                          onClick={() =>
                            handleUserAction(u.id, { action: "revoke" })
                          }
                          className="px-3 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-testid={`restore-user-${u.email}`}
                          onClick={() =>
                            handleUserAction(u.id, { action: "restore" })
                          }
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                        >
                          Restore Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: PLUGGABLE AI PROVIDER */}
        {activeTab === "ai" && aiStatus && (
          <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-base">
                  Pluggable AI Engine Architecture
                </h2>
                <p className="text-xs text-[#5E5D59]">
                  Default provider uses `@github/copilot-sdk` and seamlessly switches to `azure-openai` or `deterministic` fallback without modifying any UI or API consumers.
                </p>
              </div>
              <span
                data-testid="settings-active-ai-provider"
                className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold"
              >
                Active Provider: {aiStatus.activeProvider}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {(["copilot-sdk", "azure-openai", "deterministic"] as const).map(
                (prov) => (
                  <div
                    key={prov}
                    className={`rounded-xl border p-5 space-y-3 ${
                      aiStatus.activeProvider === prov
                        ? "border-[#141413] bg-[#FAF9F5] ring-2 ring-[#141413]/10"
                        : "border-[#E6E4DD]"
                    }`}
                  >
                    <div className="font-semibold text-sm font-mono">{prov}</div>
                    <p className="text-xs text-[#5E5D59]">
                      {prov === "copilot-sdk"
                        ? "Uses @github/copilot-sdk CopilotClient JSON-RPC session with automatic fallback."
                        : prov === "azure-openai"
                        ? "Uses Azure OpenAI Chat Completions REST API (AZURE_OPENAI_ENDPOINT + DEPLOYMENT)."
                        : "Deterministic Zite.js Monorepo & SQL Synthesizer for offline/CI verification."}
                    </p>
                    <button
                      type="button"
                      data-testid={`switch-ai-${prov}`}
                      onClick={() => handleSwitchAiProvider(prov)}
                      className="w-full py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
                    >
                      {aiStatus.activeProvider === prov
                        ? "Currently Active"
                        : `Switch to ${prov}`}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY-CRITICAL AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  data-testid="audit-category-filter"
                  value={auditCategory}
                  onChange={(e) => setAuditCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs"
                >
                  <option value="">All Categories</option>
                  <option value="Authentication">Authentication</option>
                  <option value="User Management">User Management</option>
                  <option value="Database">Database</option>
                  <option value="Workflows">Workflows</option>
                  <option value="Organization">Organization</option>
                </select>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="audit-critical-checkbox"
                    checked={criticalOnly}
                    onChange={(e) => setCriticalOnly(e.target.checked)}
                  />
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Security-Critical Shield Only</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/admin/audit-logs?format=csv"
                  data-testid="export-audit-csv"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D2C8] bg-white text-xs font-medium hover:bg-[#F3F1EC]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6E4DD] bg-white overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E4DD] bg-[#F3F1EC]">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Target / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DD]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} data-testid={`audit-row-${log.eventType}`}>
                      <td className="p-3.5 font-mono text-[11px] text-[#5E5D59] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {log.securityCritical && (
                            <span title="Security-Critical Event">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            </span>
                          )}
                          <span>{log.eventType}</span>
                        </div>
                      </td>
                      <td className="p-3.5">{log.category}</td>
                      <td className="p-3.5">
                        {log.actorEmail || "system"}
                        {log.actorRole ? ` (${log.actorRole})` : ""}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#5E5D59] max-w-md truncate">
                        {log.targetEmail ? `target=${log.targetEmail} ` : ""}
                        {log.metadataJson}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StudioShell>
  );
}
