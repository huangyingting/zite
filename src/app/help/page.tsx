import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ShieldAlert, Sparkles, Database, Workflow, Users } from "lucide-react";

const AUDIT_EVENTS = [
  { event: "auth.login.success", cat: "Authentication", critical: true, desc: "User logged in successfully (password, google, microsoft, sso)." },
  { event: "auth.login.failure", cat: "Authentication", critical: true, desc: "Login attempt failed; payload includes email and failure reason." },
  { event: "user.invite", cat: "User Management", critical: false, desc: "Single-use SHA-256 hashed invitation issued to email with role." },
  { event: "user.invite.revoke", cat: "User Management", critical: false, desc: "Pending invitation revoked by administrator." },
  { event: "user.roleChange", cat: "User Management", critical: true, desc: "User role changed between ADMIN, EDITOR, and VIEWER." },
  { event: "user.disable", cat: "User Management", critical: true, desc: "User account revoked and sessionVersion incremented immediately." },
  { event: "db.table.create", cat: "Database", critical: false, desc: "New table created in workspace database." },
  { event: "db.field.create", cat: "Database", critical: false, desc: "New typed, formula, or AI field added to a table." },
  { event: "workflow.execute", cat: "Workflows", critical: false, desc: "Backend createEndpoint workflow executed or replayed." },
  { event: "org.creditLimitDefaultChange", cat: "Organization", critical: true, desc: "Organization default AI credit limit updated." },
];

export default function HelpCenterPage() {
  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Zite Help Center & Reference
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Platform Documentation & Audit Reference
          </h1>
          <p className="text-sm sm:text-base text-[#5E5D59]">
            Guides for Workspaces, Agent Modes (`Auto`, `Build`, `Plan`, `Chat`), Model Selection (`Mini`, `Pro`, `Max`, `Max Fast`), Database Fields, Workflows, and Security Audit Logs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-2">
            <Sparkles className="w-5 h-5 text-[#2563EB]" />
            <h2 className="font-semibold text-sm">Agent Modes & Models</h2>
            <p className="text-xs text-[#5E5D59]">
              Press `Shift + Tab` to cycle Auto, Build, Plan, and Chat modes. Plan & Chat automatically elevate to Zite Max.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-2">
            <Database className="w-5 h-5 text-[#059669]" />
            <h2 className="font-semibold text-sm">Zite Database & AI Fields</h2>
            <p className="text-xs text-[#5E5D59]">
              Configure 21+ field types, Formula expressions, AI Fields referencing `{`{Column}`}`, and read-only `zite.sql()`.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-2">
            <Workflow className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="font-semibold text-sm">Workflows & PDF Rendering</h2>
            <p className="text-xs text-[#5E5D59]">
              Trigger backend endpoints on a schedule, webhook, app click, or on demand with `ZitePdf.renderHtml`.
            </p>
          </div>
          <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-2">
            <Users className="w-5 h-5 text-[#D97706]" />
            <h2 className="font-semibold text-sm">Access, RBAC & Invitations</h2>
            <p className="text-xs text-[#5E5D59]">
              Single-use expiring invitations, Admin/Editor/Viewer roles, User Groups, and instant session revocation.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E6E4DD] bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl">
              Security & Operational Audit Log Event Types
            </h2>
            <Link
              href="/home/settings"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Open Live Audit Log Console →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E6E4DD] text-[#5E5D59]">
                  <th className="py-2.5 pr-4">Event Type</th>
                  <th className="py-2.5 pr-4">Category</th>
                  <th className="py-2.5 pr-4">Security Shield</th>
                  <th className="py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {AUDIT_EVENTS.map((e) => (
                  <tr key={e.event}>
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold">
                      {e.event}
                    </td>
                    <td className="py-2.5 pr-4">{e.cat}</td>
                    <td className="py-2.5 pr-4">
                      {e.critical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 text-[11px] font-medium">
                          <ShieldAlert className="w-3 h-3" /> Security-Critical
                        </span>
                      ) : (
                        <span className="text-xs text-[#5E5D59]">Standard</span>
                      )}
                    </td>
                    <td className="py-2.5 text-[#5E5D59]">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
