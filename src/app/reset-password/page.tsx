"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E6E4DD] bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 rounded-full bg-[#F3F1EC] text-[#141413] flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="font-editorial text-3xl text-[#141413]">Reset Password</h1>
          <p className="text-xs text-[#5E5D59]">
            We’ll send a password reset link if your account is active in an invited workspace.
          </p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Reset instructions queued</span>
            </div>
            <p>
              If <strong>{email}</strong> belongs to an active workspace member, a single-use reset link has been recorded.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="text-center text-xs text-[#5E5D59]">
          <Link href="/login" className="text-[#2563EB] hover:underline">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
