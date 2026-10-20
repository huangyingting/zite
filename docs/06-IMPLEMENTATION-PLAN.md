# 06 — Implementation Plan (`06-IMPLEMENTATION-PLAN.md`)

## 1. Phased Delivery Roadmap

### Phase 1: Foundation, Dual-Database Prisma 7 & Seed Architecture
1. Initialize Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 project structure in `/home/azadmin/zite`.
2. Configure Prisma 7 (`prisma.config.ts`, `prisma/schema.prisma` for SQLite local dev/CI, and `prisma/schema.postgres.prisma` for PostgreSQL production).
3. Run initial SQLite migration (`prisma/migrations/0001_init/migration.sql`) and generate Prisma Client.
4. Build idempotent seed script (`prisma/seed.ts`) populating:
   - Default accounts (`admin@zite.com`, `editor@zite.com`, `viewer@zite.com`, `revoked@zite.com`) and sample invitations (pending, expired, revoked).
   - **Ashgrove Software — Sales & Revenue OS** workspace (`ws_ashgrove_crm`) with unified Zite Database (`Leads`, `Deals`, `Companies`, `Contacts`, `Tasks`, `OutreachSequences`), all 21+ field types + `formula` (`weightedValue`) + `ai_field` (`aiDealBrief`), saved views (`Grid`, `Kanban`), Brand Kit, 4 backend workflows (`createEndpoint`), and published **Ashgrove CRM** app (`ashgrove-crm`).
   - **TalentFlow — Applicant Tracking System** workspace (`ws_talent_ats`) with `Applicants`, `JobPositions`, `Interviews` tables, AI candidate scoring field, and published **TalentFlow ATS** app.
   - **ClientHub — Customer Booking & Invoice Portal** workspace (`ws_client_portal`) with `Bookings`, `Invoices`, PDF invoice generation workflow, and external portal access rules.

### Phase 2: Invite-Only Account Admission, NextAuth v4, RBAC & Audit Logging
1. Implement `src/lib/account-admission/password.ts` (`scrypt` hashing & verification) and `token.ts` (`sha256` token hashing & URL-safe random token generation).
2. Implement `src/lib/audit.ts` recording Zite audit log events (`auth.*`, `user.*`, `db.*`, `app.*`, `workflow.*`, `ai.*`, `org.*`).
3. Implement `src/lib/auth.ts` with NextAuth Credentials provider, live `sessionVersion` and `status === 'ACTIVE'` checks on every JWT/session evaluation, and role helpers (`requireAuth`, `requireRole`).
4. Implement CLI-only admin bootstrap script `scripts/bootstrap-admin.ts` (`npm run bootstrap:admin -- --email <email> --password-stdin`).
5. Implement REST APIs for `/api/invitations`, `/api/invitations/validate`, `/api/invitations/accept`, `/api/invitations/[id]/rotate`, `/api/invitations/[id]/revoke`, `/api/admin/users`, `/api/admin/users/[id]`, and `/api/admin/audit-logs`.

### Phase 3: Pluggable AI Engine (`@github/copilot-sdk` + Azure OpenAI + Deterministic Fallback)
1. Implement `src/lib/ai/provider.ts` with:
   - `CopilotSdkProvider` using `@github/copilot-sdk` (`CopilotClient`).
   - `AzureOpenAIProvider` using Azure OpenAI Chat Completions REST API.
   - `DeterministicZiteProvider` providing instant, high-precision Zite app/schema/workflow/SQL/AI-field synthesis.
2. Implement Zite's 4 Agent Modes (`Auto`, `Build`, `Plan`, `Chat`) and 4 Model Tiers (`Zite Mini`, `Zite Pro`, `Zite Max`, `Zite Max Fast`) with automatic elevation to `Zite Max` in `Plan` and `Chat` modes.
3. Expose `/api/ai/chat`, `/api/ai/field-evaluate`, `/api/ai/improve-app`, `/api/ai/sql`, and `/api/ai/status`.

### Phase 4: Public Marketing, Product Pillars, Marketplace & Auth/Edge UI
1. Build shared responsive navigation & footer (`PublicNavbar`, `PublicFooter`) with auth state detection (`Dashboard ->` when signed in).
2. Implement `/`, `/apps`, `/database`, `/workflows`, `/integrations`, `/marketplace`, `/marketplace/[slug]`, `/pricing`, `/enterprise`, `/customers`, `/spreadsheet-to-app`, `/ai-app-builder-comparison`, `/developers`, and `/help`.
3. Implement `/login`, `/signup`, `/invite/signup`, `/sso`, `/reset-password`, `/expired`, `/disabled`, and `not-found.tsx`.

### Phase 5: Authenticated Studio (`app.zite.com` Parity) & Live App Runner (`zite.so` Parity)
1. Implement `/home` (Workspace Dashboard, AI App Builder prompt bar with Mode/Model selectors, Import Data, Match Brand, Integrate, Recent Apps, Databases, Credit usage meter).
2. Implement `/workspace/[workspaceId]` (Workspace 2.0 overview across Apps, Database, Workflows, Users, and Settings).
3. Implement `/database/[workspaceId]` (Zite Database Studio: Table tabs, 21+ field types, Formula & AI Field columns, Views, Filter/Sort/Group/Hide toolbar, inline cell editing, CSV import/export, and `zite.sql()` console).
4. Implement `/editor/[appId]` (Multi-chat threads, Mode/Model pickers, Live App Preview, Selective Edits visual style inspector, Improve My App audit passes, Workflows tab with Preview/Code/History/Test Run/Replay/PDF Generator, Database tab, Users & Access tab, Monorepo Code & Version Rollback tab).
5. Implement `/editor/design-system` (Brand Kit Studio & Website URL Brand Importer), `/migrate` (Migration Hub & CSV/Airtable/Sheets importer), `/billing/plan-builder`, `/home/integrations`, and `/home/settings` (Invite-only console, RBAC manager, AI provider switcher, Audit Log viewer & CSV/JSON exporter).
6. Implement `/published/[appSlug]` (Live Zite CRM / ATS / Portal runtime matching `zite-demo-rnc1vjxbjr.zite.so` with `#/home`, `#/leads`, `#/deals`, `#/companies`, `#/contacts`, `#/tasks`, `#/outreach`, `#/reports`, `Ctrl+K` search, Kanban board, record modals, workflow triggers, and PDF/CSV export).

### Phase 6: Verification, Automated Tests & Deployment Configuration
1. Run `npm run build` and unit/API tests (`vitest`).
2. Run comprehensive Playwright E2E suite (`tests/e2e/zite-full-suite.spec.ts`) testing all public routes, invite-only admission flows, RBAC role enforcement (`Admin`, `Editor`, `Viewer`), user revocation (`sessionVersion`), database operations, AI modes/models, workflow runs + PDF generation, code rollback, live published CRM app, and responsive viewports.
3. Provide `Dockerfile`, `docker-compose.yml` (PostgreSQL production setup), and `.env.example`.
