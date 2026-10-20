"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldAlert, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [token, setToken] = useState("zite_inv_demo_pending_token_2026");

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    router.push(`/invite/signup?token=${encodeURIComponent(token.trim())}`);
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E6E4DD] bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-editorial text-3xl text-[#141413]">
            Invite-Only Workspace Registration
          </h1>
          <p className="text-xs text-[#5E5D59] leading-relaxed">
            Public self-signup is disabled by organization security policy. Enter a valid single-use invitation code issued by a Workspace Admin, or provision a bootstrap administrator via CLI (`npm run bootstrap:admin`).
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Single-Use Invitation Token
            </label>
            <input
              type="text"
              required
              data-testid="signup-invite-token-input"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="zite_inv_..."
              className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <button
            type="submit"
            data-testid="signup-continue-btn"
            className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium hover:bg-neutral-800 flex items-center justify-center gap-1.5"
          >
            <span>Verify Invitation Token</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] text-[11px] text-[#5E5D59] space-y-1">
          <div className="font-semibold text-[#141413] flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
            <span>CLI Bootstrap Admin Provisioning</span>
          </div>
          <p>
            No public `/api/bootstrap` endpoint is exposed. Operators with server shell access can create the initial admin with:
          </p>
          <code className="block p-1.5 rounded bg-white border border-[#E6E4DD] font-mono text-[10px]">
            npm run bootstrap:admin -- --email admin@zite.com --password &quot;...&quot;
          </code>
        </div>

        <div className="text-center text-xs text-[#5E5D59]">
          Already have an active account?{" "}
          <Link href="/login" className="text-[#2563EB] font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
