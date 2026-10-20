"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Menu,
  X,
  ArrowRight,
  Layers,
  Database,
  Workflow,
  Plug,
  Sparkles,
  ShieldCheck,
  BookOpen,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/apps", label: "Apps", icon: Layers },
  { href: "/database", label: "Database", icon: Database },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/marketplace", label: "Templates", icon: Sparkles },
  { href: "/enterprise", label: "Enterprise", icon: ShieldCheck },
  { href: "/pricing", label: "Pricing" },
  { href: "/customers", label: "Customers" },
  { href: "/developers", label: "Developers", icon: BookOpen },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#141413]">
      <header className="sticky top-0 z-40 border-b border-[#E6E4DD] bg-[#FAF9F5]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold text-lg tracking-tight"
            >
              <span className="w-7 h-7 rounded-md bg-[#141413] text-[#FAF9F5] flex items-center justify-center font-serif font-bold text-base">
                Z
              </span>
              <span>Zite</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#141413] text-[#FAF9F5]"
                        : "text-[#5E5D59] hover:text-[#141413] hover:bg-[#EFECE4]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/help"
              className="text-sm font-medium text-[#5E5D59] hover:text-[#141413] px-2.5 py-1.5"
            >
              Help
            </Link>
            {isLoggedIn ? (
              <Link
                href="/home"
                data-testid="nav-dashboard-cta"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium hover:bg-neutral-800 transition"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#141413] hover:bg-[#EFECE4] transition"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium hover:bg-neutral-800 transition"
                >
                  <span>Start for free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle mobile menu"
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md border border-[#E6E4DD] text-[#141413]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div
            data-testid="mobile-nav-drawer"
            className="lg:hidden border-t border-[#E6E4DD] bg-[#FAF9F5] px-4 py-4 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-[#F3F1EC] text-[#141413]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/spreadsheet-to-app"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-[#F3F1EC] text-[#141413]"
              >
                Spreadsheet to App
              </Link>
              <Link
                href="/ai-app-builder-comparison"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-[#F3F1EC] text-[#141413]"
              >
                Compare Builders
              </Link>
            </div>
            <div className="pt-3 border-t border-[#E6E4DD] flex items-center gap-2">
              {isLoggedIn ? (
                <Link
                  href="/home"
                  className="w-full text-center py-2.5 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
                >
                  Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2 rounded-lg border border-[#D4D2C8] text-sm font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2 rounded-lg bg-[#141413] text-[#FAF9F5] text-sm font-medium"
                  >
                    Start for free →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#E6E4DD] bg-[#F3F1EC] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-semibold text-base mb-3">
                <span className="w-6 h-6 rounded bg-[#141413] text-[#FAF9F5] flex items-center justify-center font-serif text-sm">
                  Z
                </span>
                <span>Zite</span>
              </div>
              <p className="text-[#5E5D59] text-xs leading-relaxed">
                The AI builder that means business. Build internal tools, customer
                portals, databases, and backend workflows over one unified workspace.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#141413] mb-3">Platform</h3>
              <ul className="space-y-2 text-[#5E5D59]">
                <li><Link href="/apps" className="hover:text-[#141413]">Apps & Portals</Link></li>
                <li><Link href="/database" className="hover:text-[#141413]">Zite Database</Link></li>
                <li><Link href="/workflows" className="hover:text-[#141413]">Backend Workflows</Link></li>
                <li><Link href="/integrations" className="hover:text-[#141413]">Integrations</Link></li>
                <li><Link href="/spreadsheet-to-app" className="hover:text-[#141413]">Spreadsheet to App</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#141413] mb-3">Resources</h3>
              <ul className="space-y-2 text-[#5E5D59]">
                <li><Link href="/marketplace" className="hover:text-[#141413]">Template Marketplace</Link></li>
                <li><Link href="/developers" className="hover:text-[#141413]">Developers (Zite.js & MCP)</Link></li>
                <li><Link href="/help" className="hover:text-[#141413]">Help Center & Docs</Link></li>
                <li><Link href="/ai-app-builder-comparison" className="hover:text-[#141413]">AI Builder Comparison</Link></li>
                <li><Link href="/migrate" className="hover:text-[#141413]">Migrate to Zite</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#141413] mb-3">Enterprise</h3>
              <ul className="space-y-2 text-[#5E5D59]">
                <li><Link href="/enterprise" className="hover:text-[#141413]">Enterprise Overview</Link></li>
                <li><Link href="/customers" className="hover:text-[#141413]">Customer Stories</Link></li>
                <li><Link href="/pricing" className="hover:text-[#141413]">Pricing & Credits</Link></li>
                <li><Link href="/sso" className="hover:text-[#141413]">SAML & OIDC SSO</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#141413] mb-3">Live Apps</h3>
              <ul className="space-y-2 text-[#5E5D59]">
                <li><Link href="/published/ashgrove-crm" className="hover:text-[#141413]">Ashgrove CRM Live App</Link></li>
                <li><Link href="/published/talentflow-ats" className="hover:text-[#141413]">TalentFlow ATS Live App</Link></li>
                <li><Link href="/published/clienthub-portal" className="hover:text-[#141413]">ClientHub Billing Portal</Link></li>
                <li><Link href="/home" className="hover:text-[#141413]">Zite Studio Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E6E4DD] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5E5D59] gap-4">
            <p>© 2026 Zite (Restly, Inc.). SOC 2 Type II · GDPR · HIPAA Compliant.</p>
            <div className="flex items-center gap-4">
              <span>Invite-Only Governance Enabled</span>
              <span>·</span>
              <span>Pluggable Copilot SDK & Azure OpenAI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
