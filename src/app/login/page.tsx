"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, KeyRound, ShieldCheck, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

  const [email, setEmail] = useState("admin@zite.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);

    if (res?.error) {
      if (res.error.includes("REVOKED")) {
        router.push("/disabled");
        return;
      }
      setError("Invalid email/password or account access has been revoked.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E6E4DD] bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg">
            <span className="w-7 h-7 rounded-md bg-[#141413] text-[#FAF9F5] flex items-center justify-center font-serif">
              Z
            </span>
            <span>Zite</span>
          </Link>
          <h1 className="font-editorial text-3xl text-[#141413]">Sign in to Zite</h1>
          <p className="text-xs text-[#5E5D59]">
            Invite-only workspace authentication with role-based access control
          </p>
        </div>

        {error && (
          <div
            data-testid="login-error"
            className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#141413] mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              data-testid="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#141413]">
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-[#2563EB] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              data-testid="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="space-y-2 pt-2 border-t border-[#E6E4DD]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5E5D59]">
            Quick Demo Role Switcher (Password: Password123!)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("admin@zite.com")}
              className="px-2.5 py-1.5 rounded border border-[#E6E4DD] bg-[#FAF9F5] hover:bg-[#F3F1EC] text-[11px] font-medium"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo("editor@zite.com")}
              className="px-2.5 py-1.5 rounded border border-[#E6E4DD] bg-[#FAF9F5] hover:bg-[#F3F1EC] text-[11px] font-medium"
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => fillDemo("viewer@zite.com")}
              className="px-2.5 py-1.5 rounded border border-[#E6E4DD] bg-[#FAF9F5] hover:bg-[#F3F1EC] text-[11px] font-medium"
            >
              Viewer
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#E6E4DD] text-xs text-center">
          <Link
            href="/sso"
            className="w-full py-2 rounded-lg border border-[#D4D2C8] font-medium text-[#141413] hover:bg-[#F3F1EC] flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Continue with SAML / Enterprise SSO</span>
          </Link>
          <div className="flex items-center justify-center gap-4 pt-2 text-[#5E5D59]">
            <Link href="/signup" className="hover:text-[#141413] underline">
              Have an invite token?
            </Link>
            <span>·</span>
            <Link href="/invite/signup?token=zite_inv_demo_pending_token_2026" className="text-[#2563EB] hover:underline flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Demo Invite Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
