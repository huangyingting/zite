# 02 — Architecture Decision Records (ADR)

## ADR-001: Next.js 16 App Router Full-Stack Architecture
- **Status**: Accepted
- **Context**: Zite spans three distinct user surfaces in production (`www.zite.com` public marketing & template marketplace, `app.zite.com` authenticated workspace/database/AI studio, and `*.zite.so` live published business applications), backed by REST APIs (`server.zite.com`). For our self-contained, deployable implementation, we need a unified full-stack runtime that serves all three surfaces seamlessly with zero CORS friction, shared TypeScript types, and server/client rendering.
- **Decision**: Use **Next.js 16 (App Router)** with React 19 and TypeScript (`strict: true`). Route groups separate Public Marketing (`/`, `/apps`, `/database`, `/workflows`, `/integrations`, `/marketplace`, `/pricing`, `/enterprise`, `/customers`, `/spreadsheet-to-app`, `/ai-app-builder-comparison`, `/developers`, `/help`), Auth & Edge pages (`/login`, `/signup`, `/invite/signup`, `/sso`, `/reset-password`, `/expired`, `/disabled`), Authenticated Studio (`/home`, `/workspace/[workspaceId]`, `/database/[workspaceId]`, `/editor/[appId]`, `/migrate`, `/billing/plan-builder`, `/home/settings`, `/home/integrations`), and Live Published App Runner (`/published/[appSlug]`).
- **Consequences**: Single build artifact (`npm run build`), shared Prisma & NextAuth session context across UI and `/api/*` routes, and deterministic Playwright E2E testing against one server port.

---

## ADR-002: Dual-Database Prisma 7 ORM (SQLite Local Dev + PostgreSQL Production)
- **Status**: Accepted
- **Context**: The user requested Prisma with SQLite for local development and PostgreSQL for production, matching the `../Arcade` reference pattern.
- **Decision**: Use **Prisma 7** (`@prisma/client` + `@prisma/adapter-better-sqlite3` for SQLite in local/dev/test, and `prisma/schema.postgres.prisma` for PostgreSQL production deployments). `src/lib/prisma.ts` initializes `PrismaBetterSqlite3` against `process.env.DATABASE_URL ?? "file:./dev.db"` when using SQLite, while supporting standard PostgreSQL connection URLs in production.
- **Consequences**: Zero-dependency local development and fast Playwright E2E tests on SQLite, with a drop-in production PostgreSQL schema and migration workflow (`prisma:validate:postgres`, `prisma:migrate:deploy:postgres`).

---

## ADR-003: Invite-Only Account Admission, SHA-256 Token Hashing & CLI-Only Bootstrap Admin
- **Status**: Accepted
- **Context**: Based on the user's requirements and `../Arcade/docs/NEXTAUTH_INVITE_ONLY_SPEC.md`, public self-serve account creation must be blocked unless the user presents a valid, single-use, unexpired invitation token issued by an `Admin` (or is provisioned via the deployment CLI script). Furthermore, no HTTP bootstrap admin endpoint may ever be exposed.
- **Decision**:
  1. Store invitations in `AccountInvitation` with `tokenHash = sha256(rawToken)` (never storing raw tokens in the database), `email` (normalized lowercase), `role`, `status` (`PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`), `expiresAt`, `invitedByUserId`, `acceptedAt`, and `revokedAt`.
  2. Support invitation lifecycle operations: **Create** (`201` returning raw token/invite URL once), **Rotate** (generates a fresh token & extended expiry, invalidating the old hash), **Revoke** (`status = REVOKED`), and **Redeem** (`/invite/signup?token=...` or `/signup?invite=...` atomic transaction creating `User` + `PasswordCredential` and marking invitation `ACCEPTED`).
  3. Provide **only** the CLI script `scripts/bootstrap-admin.ts` (`npm run bootstrap:admin -- --email <email> --password-stdin`) to create or promote the bootstrap `Admin` account.
- **Consequences**: Cryptographically safe invitation tokens, zero exposure of bootstrap admin over HTTP, and complete auditability of every admission event.

---

## ADR-004: Role-Based Access Control (`Admin`, `Editor`, `Viewer`) & Immediate Session Revocation
- **Status**: Accepted
- **Context**: Zite organizations require granular access control and immediate session termination when an admin revokes or disables a user or changes their role.
- **Decision**:
  1. Enforce three primary RBAC roles on `User.role` (and workspace-level overrides):
     - **`ADMIN`**: Full access to workspaces, databases, apps, workflows, integrations, organization settings, invitation management, user role changes, user revocation/reactivation, and audit logs.
     - **`EDITOR`**: Can create/edit workspaces, database tables/fields/records/views, AI apps, brand kits, and workflows; cannot manage organization invitations, revoke users, or modify org-level security settings.
     - **`VIEWER`**: Read-only access to workspace dashboards, database views, and published apps (can interact with published app views and run read-only filters, cannot mutate schema, apps, workflows, or admin settings).
  2. Include `sessionVersion` and `status` (`ACTIVE` | `REVOKED` | `DISABLED`) on `User`. NextAuth's `jwt` callback re-reads `User` from Prisma on every request and invalidates the session immediately if `status !== 'ACTIVE'` or `user.sessionVersion !== token.sessionVersion`.
- **Consequences**: Instant revocation without waiting for JWT expiration, enforced uniformly across server components and `/api/*` handlers via `requireAuth()` and `requireRole()`.

---

## ADR-005: Pluggable AI Capability Engine (`@github/copilot-sdk` + Azure OpenAI + Deterministic Fallback)
- **Status**: Accepted
- **Context**: The user specified: *"If need ai capability, use copilot sdk and call copilot model, we will switch to azure openai later, so make the ai capability plugable."* Zite uses AI across four core workflows:
  1. **AI App Builder Multi-Chat & Agent Modes** (`Auto`, `Build`, `Plan`, `Chat`) across 4 Model Tiers (`Zite Mini`, `Zite Pro`, `Zite Max`, `Zite Max Fast`)
  2. **AI Database Fields** (auto-enriching/summarizing/classifying rows based on row context)
  3. **AI Workflow & SQL Generation** (`createEndpoint` TypeScript generator & natural-language-to-SQL)
  4. **Improve My App & Brand Kit Extraction** (Review, Design, Accessibility passes & URL-to-Brand-Kit extraction)
- **Decision**: Implement `src/lib/ai/provider.ts` with a clean `AIProvider` interface (`generateAppUpdate`, `evaluateAiField`, `generateWorkflowCode`, `generateSqlQuery`, `improveAppAudit`) and three concrete adapters:
  1. `CopilotSdkProvider` (Default: uses `@github/copilot-sdk` `CopilotClient` to invoke Copilot models mapped to `Zite Mini` / `Zite Pro` / `Zite Max` / `Zite Max Fast`).
  2. `AzureOpenAIProvider` (Secondary: configured via `AI_PROVIDER=azure-openai`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`).
  3. `DeterministicZiteProvider` (Automatic resilient fallback when external AI credentials/daemon are unavailable in local CI/test, generating rich, domain-aware Zite schemas, React/TypeScript monorepo files, workflow code, SQL queries, and AI field values).
- **Consequences**: Seamless switching between `@github/copilot-sdk` and Azure OpenAI via environment variables (`AI_PROVIDER=copilot-sdk | azure-openai | deterministic`) or runtime Studio settings, with 100% reliability in automated E2E tests.

---

## ADR-006: Workspace-Centric Unified Database, App Monorepo & Workflow Execution Model
- **Status**: Accepted
- **Context**: In Zite's architecture (`developers.zite.com`), each **Workspace** owns one unified relational database (`ZiteDatabase`), multiple internal/external **Apps** (`ZiteApp`), shared **Brand Kits** (`BrandKit`), and backend **Workflows** (`ZiteWorkflow`).
- **Decision**: Model `Workspace` as the primary container holding:
  - `DatabaseTable`, `DatabaseField` (supporting all 21 Zite field types + `ai_field` + `formula`), `DatabaseRecord` (JSON field values + metadata), and `DatabaseView` (Grid, Kanban, Gallery views with saved filters, sorts, hidden fields, and group-by).
  - `ZiteApp` with multi-chat threads (`AiChatThread`, `AiChatMessage`), virtual monorepo files (`zite.config.json`, `zite.schema.json`, `.zite/db.ts`, `apps/<slug>/src/App.tsx`, `apps/<slug>/src/api/*.ts`), version history snapshots (`AppVersion` with git-style diff and one-click rollback), selective visual style overrides, and live published configuration.
  - `ZiteWorkflow` with 4 trigger types (`schedule`, `webhook`, `app_click`, `on_demand`), visual step definitions, TypeScript `createEndpoint` code, real server-side execution engine (`WorkflowRun` with step-by-step logs, duration, status, replay, and HTML/PDF invoice/report artifact generation).
- **Consequences**: Authentic end-to-end fidelity to Zite's Workspace 2.0 architecture where edits to the workspace database immediately reflect in apps, workflows, and published portals.

---

## ADR-007: Immutable Security & Operational Audit Logging
- **Status**: Accepted
- **Context**: Both `www.zite.com/help/platform/audit-logs/event-types` and the user prompt require comprehensive audit logging across authentication, invitations, roles, revocation, database mutations, app publishing, workflow runs, and AI usage.
- **Decision**: Persist every security and operational event in `AuditLog` with `eventType` (matching Zite's dot-notation taxonomy: `auth.login.success`, `auth.login.failure`, `user.invite`, `user.invite.rotate`, `user.invite.revoke`, `user.invite.accept`, `user.roleChange`, `user.disable`, `user.reactivate`, `db.table.create`, `db.field.create`, `db.record.mutate`, `app.create`, `app.publish`, `app.rollback`, `workflow.execute`, `ai.prompt.execute`), `securityCritical` boolean flag, `actorUserId`, `actorEmail`, `targetType`, `targetId`, `outcome`, `ipAddress`, and `payloadJson`. Expose filterable viewing and CSV/JSON export to `ADMIN` users.
- **Consequences**: Complete forensic traceability and enterprise compliance parity.
