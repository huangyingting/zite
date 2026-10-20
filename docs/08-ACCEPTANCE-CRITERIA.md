# 08 — Acceptance Criteria (`08-ACCEPTANCE-CRITERIA.md`)

## AC-1: Invite-Only Account Admission & CLI Bootstrap Admin
- **AC-1.1 (No Public Self-Signup)**:
  - **Given** an unauthenticated visitor without an invitation token,
  - **When** they visit `/signup` or `POST /api/invitations/accept` without a valid token,
  - **Then** account creation is rejected with `400/403` and the UI explains that registration is invite-only.
- **AC-1.2 (CLI-Only Bootstrap Admin)**:
  - **Given** a deployment operator with shell access,
  - **When** they run `echo "StrongPass!234" | npm run bootstrap:admin -- --email bootstrap@zite.com --password-stdin`,
  - **Then** the user `bootstrap@zite.com` is created (or promoted) as an `ACTIVE` `ADMIN` with `createdByAdminBootstrap = true`, and no `/api/admin/bootstrap` HTTP route exists (`404`).
- **AC-1.3 (Single-Use & Expiring Invitation Lifecycle)**:
  - **Given** an authenticated `ADMIN` on `/home/settings`,
  - **When** they create an invitation for `newbuilder@zite.com` with role `EDITOR` and 72h expiry,
  - **Then** `POST /api/invitations` stores only `tokenHash = sha256(rawToken)`, logs `user.invite` in `AuditLog`, and returns the single-use `/invite/signup?token=<rawToken>` link once.
  - **When** `newbuilder@zite.com` opens `/invite/signup?token=<rawToken>` and submits their name and password,
  - **Then** their account is created with role `EDITOR`, the invitation status transitions to `ACCEPTED`, and any subsequent attempt to reuse `<rawToken>` fails with `"Invitation has already been used"`.
- **AC-1.4 (Invitation Rotation & Revocation)**:
  - **Given** a `PENDING` invitation,
  - **When** an `ADMIN` clicks **Rotate**, a new token is issued and the old token is immediately rejected; **When** an `ADMIN` clicks **Revoke**, the invitation transitions to `REVOKED` and cannot be redeemed.

---

## AC-2: Role-Based Access Control (`Admin`, `Editor`, `Viewer`) & Immediate Revocation
- **AC-2.1 (`ADMIN` Permissions)**:
  - `ADMIN` can access all workspaces, databases, apps, workflows, integrations, `/home/settings` (Invitations, Users, AI Provider Config, Security Audit Logs), and can change user roles or revoke users.
- **AC-2.2 (`EDITOR` Permissions)**:
  - `EDITOR` can create/edit workspaces, database tables/fields/records/views, AI apps, brand kits, and workflows, and publish/rollback apps, but receives `403 Forbidden` on `/api/invitations`, `/api/admin/users`, and `/api/admin/audit-logs`.
- **AC-2.3 (`VIEWER` Permissions)**:
  - `VIEWER` can view workspaces, inspect database tables/views, run read-only `zite.sql()` queries, and use published apps, but receives `403 Forbidden` when attempting to create/mutate database tables, edit app code, or manage invitations/users.
- **AC-2.4 (Immediate Session Revocation via `sessionVersion`)**:
  - **Given** a signed-in user whose status is changed to `REVOKED` (or role is changed) by an `ADMIN`,
  - **When** that user makes their next request,
  - **Then** `sessionVersion` mismatch or `status !== 'ACTIVE'` immediately invalidates their session and redirects them to `/login` or `/disabled`.

---

## AC-3: Pluggable AI Capability (`@github/copilot-sdk` + Azure OpenAI + Fallback)
- **AC-3.1 (Provider Pluggability)**:
  - **Given** the AI engine in `src/lib/ai/provider.ts`,
  - **When** `AI_PROVIDER=copilot-sdk` (default) or `AI_PROVIDER=azure-openai` is configured (or switched in Studio Settings),
  - **Then** the Studio displays the active provider badge, routes requests through the selected adapter, and falls back deterministically if external credentials are offline.
- **AC-3.2 (Agent Modes & Model Tier Elevation)**:
  - **Given** the App Editor (`/editor/[appId]`),
  - **When** the user switches between `Auto`, `Build`, `Plan`, and `Chat` modes (via dropdown or `Shift+Tab`) and selects `Zite Mini`, `Zite Pro`, `Zite Max`, or `Zite Max Fast`,
  - **Then** `Plan` and `Chat` modes automatically elevate `Zite Mini`/`Zite Pro` to `Zite Max`, `Plan`/`Chat` return architectural plans without mutating app files, and `Auto`/`Build` update the app schema/components and create a new `AppVersion`.

---

## AC-4: Unified Zite Database, Workflows, Code Rollback & Live Published Apps
- **AC-4.1 (Zite Database Studio)**:
  - Supports creating tables, adding fields across Zite's 21 field types + `formula` + `ai_field`, inline editing records, evaluating AI fields per row or across all rows, filtering/sorting/grouping views, importing CSV data, exporting CSV/JSON, and running read-only `SELECT` queries via `zite.sql()`.
- **AC-4.2 (Zite Workflows & PDF Generation)**:
  - Supports 4 trigger types (`schedule`, `webhook`, `app_click`, `on_demand`), visual `Preview` step diagram, TypeScript `createEndpoint` `Code` editor, `Test Run` & `Replay Run` execution in `History` with per-step I/O inspection, and `ZitePdf.renderHtml` invoice/report generation.
- **AC-4.3 (Monorepo Code Viewer & Version Rollback)**:
  - Displays the workspace `zitejs` monorepo files (`zite.config.json`, `zite.schema.json`, `.zite/db.ts`, `apps/<slug>/src/App.tsx`, `apps/<slug>/src/api/*.ts`), supports editing files, viewing version diffs, and rolling back to any prior `AppVersion`.
- **AC-4.4 (Live Published App Runner & Responsive Layouts)**:
  - `/published/ashgrove-crm` renders all 8 CRM modules (`Home`, `Leads`, `Deals`, `Companies`, `Contacts`, `Tasks`, `Outreach`, `Reports`), `Ctrl+K` global search, `+ New` record creation, Kanban stage transitions, and responsive layouts verified at `1440×900`, `768×1024`, and `390×844`.
