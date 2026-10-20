import React from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { ShieldCheck, Lock, FileSpreadsheet, Server, KeyRound, ArrowRight } from "lucide-react";

export default function EnterprisePage() {
  const pillars = [
    {
      icon: KeyRound,
      title: "Invite-Only Admission & SAML/OIDC SSO",
      desc: "Enforce single-use SHA-256 hashed invitation links, CLI-only bootstrap admin provisioning, and Okta/Entra ID Single Sign-On.",
    },
    {
      icon: ShieldCheck,
      title: "Security-Critical Audit Logs",
      desc: "Track every auth.*, user.*, db.*, workflow.*, and org.* event with actor identity, payload diffs, and one-click CSV/JSON SIEM export.",
    },
    {
      icon: Lock,
      title: "Granular RBAC & Instant Revocation",
      desc: "Assign Admin, Editor, and Viewer roles, define row-level access rules, and revoke sessions immediately via sessionVersion invalidation.",
    },
    {
      icon: Server,
      title: "Isolated PostgreSQL & Pluggable AI",
      desc: "Deploy with dedicated PostgreSQL databases and switch seamlessly between GitHub Copilot SDK and Azure OpenAI.",
    },
  ];

  return (
    <PublicShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Zite Enterprise
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Enterprise-grade AI app building.
          </h1>
          <p className="text-base sm:text-lg text-[#5E5D59]">
            SOC 2 Type II, GDPR, and HIPAA compliant infrastructure with invite-only governance, granular permissions, and complete auditability.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/home/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              <span>Inspect Governance & Audit Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sso"
              className="px-4 py-2.5 rounded-lg border border-[#D4D2C8] bg-white text-sm font-medium"
            >
              Test Enterprise SSO Flow
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-xl border border-[#E6E4DD] bg-white p-6 space-y-3"
              >
                <Icon className="w-6 h-6 text-[#2563EB]" />
                <h2 className="font-semibold text-lg">{p.title}</h2>
                <p className="text-sm text-[#5E5D59] leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}
