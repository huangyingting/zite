"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StudioShell } from "@/components/StudioShell";
import { Database, Workflow, ExternalLink, Sparkles, Palette } from "lucide-react";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.workspaces || []).find(
          (w: any) => w.id === workspaceId || w.slug === workspaceId
        );
        setWorkspace(found || d.workspaces?.[0]);
      });
  }, [workspaceId]);

  return (
    <StudioShell>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
        {!workspace ? (
          <div className="text-xs text-[#5E5D59]">Loading workspace...</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
                  Workspace 2.0 Container
                </div>
                <h1 className="font-editorial text-3xl sm:text-4xl text-[#141413]">
                  {workspace.icon} {workspace.name}
                </h1>
                <p className="text-sm text-[#5E5D59]">{workspace.description}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/database/${workspace.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-xs font-medium"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Open Zite Database</span>
                </Link>
                {workspace.apps?.[0] && (
                  <Link
                    href={`/published/${workspace.apps[0].slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D4D2C8] bg-white text-xs font-medium"
                  >
                    <span>Launch Live App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Workspace Apps ({workspace.apps?.length || 0})</span>
                </div>
                {workspace.apps?.map((app: any) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E6E4DD] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold">{app.name}</div>
                      <div className="text-[#5E5D59] font-mono text-[11px]">
                        {app.publishedUrl}
                      </div>
                    </div>
                    <Link
                      href={`/editor/${app.id}`}
                      className="px-2.5 py-1 rounded bg-[#141413] text-[#FAF9F5] font-medium"
                    >
                      Studio
                    </Link>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Database className="w-4 h-4 text-[#059669]" />
                  <span>Shared Tables ({workspace.tables?.length || 0})</span>
                </div>
                <div className="space-y-1.5">
                  {workspace.tables?.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/database/${workspace.id}`}
                      className="block p-2 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-xs hover:bg-[#F3F1EC]"
                    >
                      {t.icon} <strong>{t.name}</strong> ({t.slug})
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6E4DD] bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Workflow className="w-4 h-4 text-[#7C3AED]" />
                  <span>Backend Workflows ({workspace.workflows?.length || 0})</span>
                </div>
                <div className="space-y-1.5">
                  {workspace.workflows?.map((wf: any) => (
                    <div
                      key={wf.id}
                      className="p-2 rounded bg-[#FAF9F5] border border-[#E6E4DD] text-xs"
                    >
                      <div className="font-semibold">{wf.name}</div>
                      <div className="text-[11px] text-[#5E5D59]">
                        Trigger: {wf.triggerType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StudioShell>
  );
}
