"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Home,
  Database,
  Layers,
  Palette,
  Plug,
  Settings,
  ArrowRightLeft,
  CreditCard,
  ExternalLink,
  LogOut,
  Shield,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

export interface StudioShellUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  aiCreditLimit: number;
  aiCreditsUsed: number;
}

export interface StudioShellWorkspace {
  id: string;
  publicId: string;
  name: string;
  color: string;
  apps?: Array<{ id: string; name: string; slug: string }>;
}

export function StudioShell({
  user: propUser,
  workspaces = [
    {
      id: "ws_ashgrove_crm",
      publicId: "ws_ashgrove_crm",
      name: "Ashgrove Software — Revenue OS",
      color: "#2563EB",
      apps: [{ id: "app_ashgrove_crm", name: "Ashgrove CRM", slug: "ashgrove-crm" }],
    },
  ],
  activeProvider = "copilot-sdk",
  children,
}: {
  user?: StudioShellUser;
  workspaces?: StudioShellWorkspace[];
  activeProvider?: string;
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const sUser = session?.user as Partial<StudioShellUser> | undefined;
  const user: StudioShellUser = propUser || {
    id: sUser?.id || "usr_admin",
    email: sUser?.email || "admin@zite.com",
    name: sUser?.name || "Dominic Olsen",
    role: (sUser?.role as "ADMIN" | "EDITOR" | "VIEWER") || "ADMIN",
    aiCreditLimit: 1200,
    aiCreditsUsed: 142,
  };
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const primaryWs = workspaces[0];
  const primaryApp = primaryWs?.apps?.[0];

  const navItems = [
    { href: "/home", label: "Workspaces Home", icon: Home },
    ...(primaryWs
      ? [
          {
            href: `/workspace/${primaryWs.publicId}`,
            label: "Active Workspace",
            icon: Layers,
          },
          {
            href: `/database/${primaryWs.publicId}`,
            label: "Zite Database",
            icon: Database,
          },
        ]
      : []),
    ...(primaryApp
      ? [
          {
            href: `/editor/${primaryApp.slug}`,
            label: "AI App Studio",
            icon: Sparkles,
          },
        ]
      : []),
    { href: "/editor/design-system", label: "Brand Kit & Theme", icon: Palette },
    { href: "/home/integrations", label: "Integrations & Secrets", icon: Plug },
    { href: "/migrate", label: "Migrate to Zite", icon: ArrowRightLeft },
    { href: "/billing/plan-builder", label: "Plan & Credits", icon: CreditCard },
    { href: "/home/settings", label: "Settings & Governance", icon: Settings },
  ];

  const creditPercent = Math.min(
    100,
    Math.round((user.aiCreditsUsed / Math.max(1, user.aiCreditLimit)) * 100)
  );

  return (
    <div className="min-h-screen flex bg-[#FAF9F5] text-[#141413]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Studio Sidebar */}
      <aside
        data-testid="studio-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-[#E6E4DD] bg-[#F3F1EC] flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-md bg-[#141413] text-[#FAF9F5] flex items-center justify-center font-serif font-bold text-sm">
                AS
              </span>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  Ashgrove Software
                </div>
                <div className="text-[11px] text-[#5E5D59]">
                  Zite Business Plan
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-[#5E5D59]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/home" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    active
                      ? "bg-[#141413] text-[#FAF9F5]"
                      : "text-[#141413] hover:bg-[#E6E4DD]/70"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Workspaces List */}
          {workspaces.length > 0 && (
            <div className="pt-3 border-t border-[#E6E4DD]">
              <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#5E5D59]">
                Workspaces ({workspaces.length})
              </div>
              <div className="space-y-1">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.publicId}`}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs hover:bg-[#E6E4DD]/60 transition"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ws.color || "#2563EB" }}
                      />
                      <span className="truncate font-medium">{ws.name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Live Published App Shortcuts */}
          <div className="pt-3 border-t border-[#E6E4DD]">
            <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#5E5D59]">
              Live Hosted Apps (.zite.so)
            </div>
            <div className="space-y-1 text-xs">
              <Link
                href="/published/ashgrove-crm"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#E6E4DD]/60 text-[#2563EB] font-medium"
              >
                <span>Ashgrove CRM</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/published/talentflow-ats"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#E6E4DD]/60 text-[#059669] font-medium"
              >
                <span>TalentFlow ATS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/published/clienthub-portal"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-[#E6E4DD]/60 text-[#7C3AED] font-medium"
              >
                <span>ClientHub Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Credits, Pluggable AI Status, & User Card */}
        <div className="p-4 border-t border-[#E6E4DD] space-y-3 bg-[#EFECE4]/60">
          <div className="rounded-lg border border-[#E6E4DD] bg-white p-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#141413]">AI Credits</span>
              <span className="font-mono text-[11px] text-[#5E5D59]">
                {user.aiCreditsUsed} / {user.aiCreditLimit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E6E4DD] overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all"
                style={{ width: `${creditPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#5E5D59]">
              <span data-testid="active-ai-provider-badge">
                AI: {activeProvider}
              </span>
              <Link
                href="/billing/plan-builder"
                className="text-[#2563EB] hover:underline font-medium"
              >
                Upgrade
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold truncate">
                  {user.name}
                </span>
                <span
                  data-testid="studio-user-role-badge"
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    user.role === "ADMIN"
                      ? "bg-blue-100 text-blue-800"
                      : user.role === "EDITOR"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {user.role}
                </span>
              </div>
              <div className="text-[11px] text-[#5E5D59] truncate">
                {user.email}
              </div>
            </div>
            <button
              type="button"
              data-testid="studio-signout-button"
              title="Sign out"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-md border border-[#D4D2C8] bg-white hover:bg-neutral-100 text-[#141413]"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#E6E4DD] bg-white/80 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="studio-mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md border border-[#E6E4DD]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-[#5E5D59] flex items-center gap-2">
              <Link href="/" className="hover:text-[#141413]">
                zite.com
              </Link>
              <span>/</span>
              <span className="font-medium text-[#141413]">{pathname}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href="/marketplace"
              className="px-2.5 py-1.5 rounded-md border border-[#E6E4DD] bg-[#FAF9F5] hover:bg-[#EFECE4] font-medium"
            >
              Templates
            </Link>
            <Link
              href="/developers"
              className="hidden sm:inline-block px-2.5 py-1.5 rounded-md border border-[#E6E4DD] bg-[#FAF9F5] hover:bg-[#EFECE4] font-medium"
            >
              Zite.js Docs
            </Link>
            <Link
              href="/published/ashgrove-crm"
              className="px-3 py-1.5 rounded-md bg-[#141413] text-[#FAF9F5] font-medium hover:bg-neutral-800"
            >
              Open Live CRM →
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
