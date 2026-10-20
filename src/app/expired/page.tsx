import React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-[#E6E4DD] bg-white p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="font-editorial text-3xl text-[#141413]">
          Invitation or Verification Link Expired
        </h1>
        <p className="text-xs text-[#5E5D59] leading-relaxed">
          For security, Zite single-use invitation links expire automatically or when rotated/revoked by a Workspace Administrator. Ask your administrator to rotate the token in Organization Settings.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
          >
            Go to Sign In
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-[#D4D2C8] text-xs font-medium"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
