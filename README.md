# Zite — Full-Stack AI Business App, Database & Workflow Platform

An enterprise-grade AI software builder and runtime engineered from systematic Playwright exploration of `https://www.zite.com`, `https://developers.zite.com`, `https://app.zite.com`, and live published Zite apps (`zite-demo-rnc1vjxbjr.zite.so`).

---

## Architecture & Core Capabilities

1. **Public Marketing & Developer Platform (`/`, `/apps`, `/database`, `/workflows`, `/integrations`, `/marketplace`, `/pricing`, `/enterprise`, `/customers`, `/spreadsheet-to-app`, `/ai-app-builder-comparison`, `/developers`, `/help`)**
   - Warm editorial aesthetic (`#FAF9F5` canvas, `#141413` ink, Newsreader + Plus Jakarta Sans + JetBrains Mono typography).
   - Interactive Category Switcher across 9 template verticals, 3,000+ integration directory search, pricing plan estimator, comparison matrix, and security-critical audit event reference.

2. **Invite-Only Admission, Granular RBAC & Immediate Session Revocation (`../Arcade` Security Pattern)**
   - **No public self-signup & no HTTP bootstrap endpoint**: Initial admin accounts are provisioned exclusively via server CLI (`npm run bootstrap:admin`).
   - **Single-use SHA-256 hashed invitations**: 32-byte CSPRNG tokens (`zite_inv_...`) stored as SHA-256 digests (`tokenHash`) with configurable expiration, 1-click rotation (`/api/invitations/[id]/rotate`), and revocation (`/api/invitations/[id]/revoke`).
   - **Roles (`ADMIN`, `EDITOR`, `VIEWER`) & Immediate Revocation**: Changing a user's role or revoking access increments `sessionVersion` and sets `status = "REVOKED"`, invalidating active JWT sessions immediately on the next request.
   - **Immutable Audit Logs**: 35+ event types across Authentication, User Management, Database, Workflows, and Organization with Security-Critical Shield filtering and CSV/JSON export.

3. **Pluggable AI Engine (`src/lib/ai/provider.ts`)**
   - **`copilot-sdk` (Default)**: Integrates `@github/copilot-sdk` (`CopilotClient`) for live agentic completions with graceful fallback.
   - **`azure-openai`**: Drop-in Azure OpenAI Chat Completions provider (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`).
   - **`deterministic`**: Zero-latency Zite.js monorepo, SQL, and AI Field synthesizer.
   - **4 Agent Modes (`Auto`, `Build`, `Plan`, `Chat`) & 4 Model Tiers (`Zite Mini`, `Zite Pro`, `Zite Max`, `Zite Max Fast`)**: Automatically elevates `Plan` and `Chat` modes to `Zite Max` (`resolveEffectiveModelTier`).

4. **Workspaces 2.0, Zite Database (`zitejs/db`), Workflows (`zitejs/backend` + `ZitePdf`), & Live Published CRM Runner**
   - **Zite Database Studio (`/database/[workspaceId]`)**: 21+ field types, Formula fields, AI Fields (`{Column}` prompt evaluation), Grid & Kanban views, CSV import/export, and read-only `zite.sql()` SQL runner.
   - **Zite AI App Studio (`/editor/[appId]`)**: Multi-chat threads, `Shift+Tab` mode cycling, Selective Edits visual element inspector, "Improve My App" (UI Review, Bug Finder, Security Audit), Workflows (`Preview`, `Code`, `History`, `Test Run`, Replay, `ZitePdf.renderHtml` PDF generator), and Monorepo Code & Version Rollback.
   - **Published Business App Runner (`/published/ashgrove-crm`)**: Full 8-module Ashgrove Software CRM (`Home`, `Leads`, `Deals` Kanban/Grid, `Companies`, `Contacts`, `Tasks`, `Outreach` Sequences, `Reports`, `⌘K` global search, `+ New Deal` modal, and 1-click Order Form PDF generation).

---

## Documentation Suite (`docs/`)

- [`docs/01-EXPLORATION-COVERAGE.md`](docs/01-EXPLORATION-COVERAGE.md) — Route & feature exploration telemetry + 50 Playwright screenshots (`screenshots/exploration/`)
- [`docs/02-ADR.md`](docs/02-ADR.md) — 10 Architecture Decision Records
- [`docs/03-PRD.md`](docs/03-PRD.md) — Product Requirements Document
- [`docs/04-TECHNICAL-SPEC.md`](docs/04-TECHNICAL-SPEC.md) — Full-stack technical specification
- [`docs/05-ARCHITECTURE-AND-DATA-MODEL.md`](docs/05-ARCHITECTURE-AND-DATA-MODEL.md) — Dual SQLite/PostgreSQL Prisma 7 data model
- [`docs/06-IMPLEMENTATION-PLAN.md`](docs/06-IMPLEMENTATION-PLAN.md) — Phased implementation plan
- [`docs/07-TASK-BACKLOG.md`](docs/07-TASK-BACKLOG.md) — Engineering task backlog
- [`docs/08-ACCEPTANCE-CRITERIA.md`](docs/08-ACCEPTANCE-CRITERIA.md) — Testable acceptance criteria
- [`docs/09-FEATURE-PARITY-MATRIX.md`](docs/09-FEATURE-PARITY-MATRIX.md) — Feature parity matrix

---

## Quick Start

```bash
# Install dependencies
npm install

# Validate both SQLite (local dev) and PostgreSQL (production) Prisma schemas
npm run db:validate:all

# Run database migrations & seed demo workspaces, CRM tables, and accounts
npx prisma migrate deploy
npm run db:seed

# Provision or update a bootstrap administrator via CLI
npm run bootstrap:admin -- --email admin@zite.com --password "Password123!" --name "Dominic Olsen"

# Start development server
npm run dev
```
