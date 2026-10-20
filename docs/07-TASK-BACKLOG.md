# 07 — Prioritized Task Backlog (`07-TASK-BACKLOG.md`)

| ID | Epic | Task Title | Priority | Pts | Dependencies | Status |
|---|---|---|---|---|---|---|
| **E1-T1** | Exploration | Explore `www.zite.com`, `developers.zite.com`, and `www.zite.com/help` across Desktop/Tablet/Mobile viewports | P0 | 5 | None | Done |
| **E1-T2** | Exploration | Explore `app.zite.com` auth/edge/studio routes and `zite-demo-rnc1vjxbjr.zite.so` live CRM app | P0 | 5 | E1-T1 | Done |
| **E2-T1** | Documentation | Author `01-EXPLORATION-COVERAGE.md` through `09-FEATURE-PARITY-MATRIX.md` | P0 | 8 | E1-T2 | In Progress |
| **E3-T1** | Data & ORM | Configure Next.js 16 + Prisma 7 dual-database setup (`schema.prisma` SQLite + `schema.postgres.prisma` PostgreSQL) | P0 | 5 | E2-T1 | Pending |
| **E3-T2** | Data & ORM | Create SQLite migration and rich idempotent `prisma/seed.ts` (Ashgrove CRM, TalentFlow ATS, ClientHub Portal) | P0 | 5 | E3-T1 | Pending |
| **E4-T1** | Auth & Security | Implement `scrypt` password hashing, `sha256` invite token hashing, and CLI-only `scripts/bootstrap-admin.ts` | P0 | 5 | E3-T1 | Pending |
| **E4-T2** | Auth & Security | Implement NextAuth v4 JWT/session callbacks with `sessionVersion` immediate revocation and `Admin`/`Editor`/`Viewer` RBAC | P0 | 5 | E4-T1 | Pending |
| **E4-T3** | Auth & Security | Implement Invitation lifecycle APIs (create, validate, accept, rotate, revoke) and immutable `AuditLog` APIs + CSV/JSON export | P0 | 5 | E4-T2 | Pending |
| **E5-T1** | Pluggable AI | Implement `AIProvider` interface with `@github/copilot-sdk`, Azure OpenAI, and Deterministic fallback adapters | P0 | 8 | E3-T1 | Pending |
| **E5-T2** | Pluggable AI | Implement 4 Agent Modes (`Auto`, `Build`, `Plan`, `Chat`), 4 Model Tiers (`Mini`, `Pro`, `Max`, `Max Fast`), AI Fields, and Improve My App | P0 | 5 | E5-T1 | Pending |
| **E6-T1** | Public Pages | Implement `/`, `/apps`, `/database`, `/workflows`, `/integrations`, `/marketplace`, `/marketplace/[slug]`, `/pricing`, `/enterprise`, `/customers`, `/spreadsheet-to-app`, `/ai-app-builder-comparison`, `/developers`, `/help` | P0 | 8 | E3-T2 | Pending |
| **E6-T2** | Auth & Edge UI | Implement `/login`, `/signup`, `/invite/signup`, `/sso`, `/reset-password`, `/expired`, `/disabled`, and `/404` | P0 | 5 | E4-T3 | Pending |
| **E7-T1** | Studio Core | Implement `/home`, `/workspace/[workspaceId]`, `/migrate`, `/billing/plan-builder`, `/home/integrations`, and `/editor/design-system` | P0 | 8 | E4-T3, E5-T2 | Pending |
| **E7-T2** | Zite Database | Implement `/database/[workspaceId]` (21+ field types, Formula fields, AI fields, Views, Filter/Sort/Group, CSV import/export, `zite.sql()`) | P0 | 8 | E7-T1 | Pending |
| **E7-T3** | Zite App Editor | Implement `/editor/[appId]` (Multi-chat, Modes/Models, Selective Edits, Improve App, Workflows Preview/Code/History/Replay/PDF, Monorepo Code & Version Rollback) | P0 | 13 | E7-T2 | Pending |
| **E7-T4** | Admin Settings | Implement `/home/settings` (Invite-Only Admission Console, User Role & Revocation Manager, AI Provider Config, Security Audit Logs) | P0 | 5 | E4-T3 | Pending |
| **E8-T1** | Live App Runner | Implement `/published/[appSlug]` matching `zite-demo-rnc1vjxbjr.zite.so` (`Home`, `Leads`, `Deals`, `Companies`, `Contacts`, `Tasks`, `Outreach`, `Reports`, `Ctrl+K`, Kanban, PDF/CSV export) | P0 | 8 | E7-T3 | Pending |
| **E9-T1** | Verification | Run `bootstrap:admin` CLI check, `vitest` unit/API suite, and full Playwright E2E verification across all routes, roles, and viewports | P0 | 8 | E8-T1 | Pending |
