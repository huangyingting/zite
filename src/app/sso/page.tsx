"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export default function SsoPage() {
  const [domain, setDomain] = useState("ashgrovesoftware.com");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E6E4DD] bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-editorial text-3xl text-[#141413]">
            Enterprise Single Sign-On
          </h1>
          <p className="text-xs text-[#5E5D59]">
            Sign in with Okta, Microsoft Entra ID, or Google Workspace SAML 2.0 / OIDC
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>IdP Discovery Verified for {domain}</span>
            </div>
            <p>
              Your organization’s SAML 2.0 Identity Provider is configured. Proceed to authenticated workspace session.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-3 py-1.5 rounded bg-[#141413] text-[#FAF9F5] font-medium"
            >
              Continue to Workspace Login →
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Company Domain or Work Email
              </label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              Continue with SAML SSO
            </button>
          </form>
        )}

        <div className="text-center text-xs text-[#5E5D59]">
          <Link href="/login" className="text-[#2563EB] hover:underline">
            ← Back to standard sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
