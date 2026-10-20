"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";

function InviteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [validState, setValidState] = useState<{
    valid: boolean;
    reason?: string;
    invitation?: { email: string; role: string; expiresAt: string };
  } | null>(null);

  const [name, setName] = useState("Aisha Karim");
  const [password, setPassword] = useState("Password123!");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!token) {
        setValidState({ valid: false, reason: "MISSING_TOKEN" });
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/invitations/validate?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();
        setValidState(data);
      } catch {
        setValidState({ valid: false, reason: "NETWORK_ERROR" });
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to accept invitation");
        setSubmitting(false);
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email: data.user.email,
        password,
      });
      router.push("/home");
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E6E4DD] bg-white p-8 shadow-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center mx-auto">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-editorial text-3xl text-[#141413]">
            Accept Workspace Invitation
          </h1>
        </div>

        {checking ? (
          <div className="py-8 text-center text-xs text-[#5E5D59]">
            Verifying SHA-256 invitation token...
          </div>
        ) : !validState?.valid ? (
          <div
            data-testid="invite-invalid-box"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-3"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Invitation Unavailable ({validState?.reason})</span>
            </div>
            <p>
              This single-use invitation link is either expired, revoked, or has already been redeemed. Ask a Workspace Administrator to rotate or issue a new invitation.
            </p>
            <div className="pt-2 flex gap-2">
              <Link
                href="/expired"
                className="px-3 py-1.5 rounded bg-red-700 text-white font-medium"
              >
                View Expired Policy
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded border border-red-300 bg-white text-red-800 font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAccept} className="space-y-4">
            <div
              data-testid="invite-valid-banner"
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1"
            >
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>Valid Single-Use Invitation</span>
              </div>
              <div>
                Email: <strong>{validState.invitation?.email}</strong> · Assigned Role:{" "}
                <strong className="uppercase">{validState.invitation?.role}</strong>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                data-testid="invite-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#141413] mb-1">
                Create Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                data-testid="invite-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D4D2C8] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              data-testid="invite-accept-submit"
              className="w-full py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? "Activating Account..." : "Complete Registration & Join Workspace"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InviteSignupPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Loading...</div>}>
      <InviteSignupContent />
    </Suspense>
  );
}
