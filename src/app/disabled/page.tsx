import React from "react";
import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function DisabledAccountPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto">
          <ShieldOff className="w-6 h-6" />
        </div>
        <h1 className="font-editorial text-3xl text-[#141413]">
          Account Access Revoked
        </h1>
        <p className="text-xs text-[#5E5D59] leading-relaxed">
          Your workspace account has been disabled or revoked by an Organization Administrator (`user.disable`). Active sessions have been invalidated immediately via `sessionVersion` enforcement.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
          >
            Switch Account
          </Link>
          <Link
            href="/help"
            className="px-4 py-2 rounded-lg border border-[#D4D2C8] text-xs font-medium"
          >
            Contact Org Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
