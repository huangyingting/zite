import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center px-4 text-center space-y-4">
      <div className="text-xs font-mono uppercase tracking-widest text-[#5E5D59]">
        404 · Route Not Found
      </div>
      <h1 className="font-editorial text-4xl text-[#141413]">
        We couldn’t find that Zite page or resource.
      </h1>
      <p className="text-sm text-[#5E5D59] max-w-md">
        The workspace, app, or route you requested may have been moved or requires elevated workspace permissions.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href="/home"
          className="px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
        >
          Open Workspace Studio
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-[#D4D2C8] bg-white text-xs font-medium"
        >
          Back to Zite.com
        </Link>
      </div>
    </div>
  );
}
