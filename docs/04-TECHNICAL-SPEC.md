# 04 — Technical Specification (`04-TECHNICAL-SPEC.md`)

## 1. Technology Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5 (`strict: true`)
- **Authentication**: Auth.js / NextAuth v4 (`next-auth`) with Credentials provider, JWT strategy, database-backed `sessionVersion` and `status` validation on every request
- **ORM & Databases**:
  - Local Development & Automated Testing: **Prisma 7** (`@prisma/client` + `@prisma/adapter-better-sqlite3` + `better-sqlite3`) against `prisma/schema.prisma` (`sqlite`)
  - Production Deployment: **Prisma 7** against `prisma/schema.postgres.prisma` (`postgresql`)
- **AI Engine**: Pluggable provider architecture (`src/lib/ai/provider.ts`):
  - **Primary**: `@github/copilot-sdk` (`CopilotClient`)
  - **Secondary**: Azure OpenAI (`openai` / REST chat completions against `AZURE_OPENAI_ENDPOINT`)
  - **Resilient Fallback**: Deterministic Zite Schema/Code/Workflow/SQL/Field Synthesizer
- **Styling & Icons**: Tailwind CSS v4 + Lucide React (`lucide-react`)
- **Validation & Security**: `zod` schema validation, Node `crypto.scrypt` password hashing, `crypto.createHash('sha256')` invitation token hashing

---

## 2. Application Route Map

### 2.1 Public & Marketing Routes
| Route | Description | Auth Required |
|---|---|---|
| `/` | Zite Marketing Home (Hero prompt launcher, 4 product pillars, customer stories, FAQ) | No |
| `/apps` | Zite Apps product page (Internal tools & customer portals) | No |
| `/database` | Zite Database product page (Unified relational DB, 21+ field types, AI fields) | No |
| `/workflows` | Zite Workflows product page (`createEndpoint`, 4 triggers, history, PDF generation) | No |
| `/integrations` | Searchable 30+ Integrations directory across 15 categories | No |
| `/marketplace` | Template Marketplace directory with category filters & search | No |
| `/marketplace/[slug]` | Template detail page with live embedded app preview & "Use Template" clone button | No |
| `/pricing` | 4-tier pricing page (`Free`, `Starter`, `Business`, `Enterprise`) & interactive credit calculator | No |
| `/enterprise` | Enterprise security, SSO/SAML, SOC 2 Type II, HIPAA, Audit Logs showcase | No |
| `/customers` | Customer case studies & ROI metrics | No |
| `/spreadsheet-to-app` | Spreadsheet/Airtable/CSV-to-App interactive converter showcase | No |
| `/ai-app-builder-comparison` | Feature comparison matrix (Zite vs Lovable, Bolt, Base44, Replit, Cursor, v0) | No |
| `/developers` | Zite.js framework (`zitejs/db`, `zitejs/backend`), MCP, and REST API documentation | No |
| `/help` | Searchable Zite Help Center & Audit Log Event Types reference | No |

### 2.2 Authentication & Edge State Routes
| Route | Description | Auth Required |
|---|---|---|
| `/login` | Split-screen Sign In (Email/Password, Google/Microsoft OAuth UI, SSO link, reauth banner) | No |
| `/signup` | Invite-only gate; accepts invite code or redirects to `/invite/signup` | No |
| `/invite/signup` | Single-use invitation redemption (`?token=<rawToken>`); shows error state if invalid/expired/revoked | No |
| `/sso` | Enterprise SAML/OIDC work email discovery flow | No |
| `/reset-password` | Password reset request & confirmation flow | No |
| `/expired` | Expired link edge-state screen | No |
| `/disabled` | Disabled Zite app edge-state screen | No |

### 2.3 Authenticated Studio & Live App Routes
| Route | Description | Allowed Roles |
|---|---|---|
| `/home` | Workspace Dashboard, AI App Prompt Composer, Recent Apps, Databases, Credit Usage | `ADMIN`, `EDITOR`, `VIEWER` |
| `/workspace/[workspaceId]` | Workspace 2.0 overview (Apps, Unified Database, Workflows, Users & Access, Settings) | `ADMIN`, `EDITOR`, `VIEWER` |
| `/database/[workspaceId]` | Zite Database Studio (Tables, 21+ Field Types, AI Fields, Formulas, Views, CSV Import/Export, `zite.sql()`) | `ADMIN`, `EDITOR`, `VIEWER` (read-only) |
| `/editor/[appId]` | Full Zite AI App Editor (Multi-chat, 4 Agent Modes, 4 Model Tiers, Preview, Selective Edits, Improve App, Workflows, Database, Access, Monorepo Code & Version Rollback) | `ADMIN`, `EDITOR`, `VIEWER` (read-only) |
| `/editor/design-system` | Brand Kit & Design System Studio (Colors, Fonts, Logos, Tone, Website URL Brand Extractor) | `ADMIN`, `EDITOR`, `VIEWER` |
| `/migrate` | Migration Hub (CSV/Spreadsheet upload, Airtable/Sheets/Notion/Retool importers) | `ADMIN`, `EDITOR`, `VIEWER` |
| `/billing/plan-builder` | Interactive Subscription & AI Credit Plan Builder | `ADMIN`, `EDITOR`, `VIEWER` |
| `/home/integrations` | Organization Connected Integrations & Encrypted Workspace Secrets manager | `ADMIN`, `EDITOR`, `VIEWER` |
| `/home/settings` | Organization Settings, Invite-Only Admission Console, RBAC User Management, AI Provider Config, & Security Audit Logs | `ADMIN` (full), `EDITOR`/`VIEWER` (profile/read) |
| `/published/[appSlug]` | Live Published Zite Business App Runner (CRM / ATS / Portal with multi-view navigation, `Ctrl+K`, Kanban, Reports, Workflows, PDF & CSV export) | Public or Auth per App `accessMode` |

---

## 3. REST API Specification

### 3.1 Authentication & Invite-Only Admission APIs
- `POST /api/auth/[...nextauth]` — NextAuth credentials authentication & JWT session endpoint.
- `GET /api/invitations` (`ADMIN`) — Lists all `AccountInvitation` records with inviter metadata and computed expiration status.
- `POST /api/invitations` (`ADMIN`) — Creates a single-use invitation (`{ email, role, expiresInHours }`), stores `tokenHash = sha256(rawToken)`, writes `user.invite` audit log, and returns `{ invitation, rawToken, inviteUrl }` (`HTTP 201`).
- `GET /api/invitations/validate?token=<rawToken>` (Public) — Validates a raw invitation token and returns `{ valid, email, role, expiresAt, reason? }`.
- `POST /api/invitations/accept` (Public) — Redeems `{ token, name, password }`, verifies token is `PENDING` and unexpired, atomically creates `User` + `PasswordCredential`, updates invitation to `ACCEPTED`, and writes `user.invite.accept` audit log (`HTTP 201`).
- `POST /api/invitations/[id]/rotate` (`ADMIN`) — Generates a new `rawToken` and `tokenHash`, extends `expiresAt`, and logs `user.invite.rotate`.
- `POST /api/invitations/[id]/revoke` (`ADMIN`) — Marks a pending invitation `REVOKED` and logs `user.invite.revoke`.

### 3.2 User Management, RBAC & Audit Log APIs
- `GET /api/admin/users` (`ADMIN`) — Lists all organization users, roles, status (`ACTIVE`/`REVOKED`), `sessionVersion`, AI credit limits, and last login.
- `PATCH /api/admin/users/[id]` (`ADMIN`) — Updates a user's `role` (`ADMIN`/`EDITOR`/`VIEWER`), `status` (`ACTIVE`/`REVOKED`), or `aiCreditLimit`. Any revocation or role change increments `sessionVersion` to immediately invalidate active JWT sessions and records `user.roleChange` / `user.disable` / `user.reactivate` in `AuditLog`.
- `GET /api/admin/audit-logs` (`ADMIN`) — Queries `AuditLog` with filters (`category`, `securityCritical`, `search`, `format=json|csv`).

### 3.3 Workspaces, Unified Database & `zite.sql()` APIs
- `GET /api/workspaces` / `POST /api/workspaces` — Lists or creates a workspace (with default unified database, tables, brand kit, and starter app or cloned template).
- `GET /api/workspaces/[workspaceId]/database` — Returns all tables, fields, views, and records for a workspace's unified database.
- `POST /api/workspaces/[workspaceId]/database/tables` (`ADMIN`, `EDITOR`) — Creates, renames, duplicates, or deletes a table.
- `POST /api/workspaces/[workspaceId]/database/fields` (`ADMIN`, `EDITOR`) — Adds or updates a column (21 Zite field types + `formula` + `ai_field`).
- `POST /api/workspaces/[workspaceId]/database/records` (`ADMIN`, `EDITOR`, or published app runner) — Creates, updates, bulk-imports (CSV/JSON), or deletes records; automatically evaluates `formula` fields and triggers `ai_field` synthesis when requested.
- `POST /api/workspaces/[workspaceId]/database/views` (`ADMIN`, `EDITOR`) — Creates or updates saved views (`grid`, `kanban`, `gallery`) with filter/sort/group configurations.
- `POST /api/workspaces/[workspaceId]/database/sql` — Executes safe, read-only `zite.sql()` queries and aggregations over workspace tables.

### 3.4 Apps, Multi-Chat AI Studio, Workflows & Brand Kit APIs
- `GET /api/apps/[appId]` / `PATCH /api/apps/[appId]` — Reads or updates app configuration, selective visual overrides, access control rules, or publishes a new `AppVersion` snapshot.
- `POST /api/apps/[appId]/rollback` (`ADMIN`, `EDITOR`) — Rolls back the app to a selected historical `AppVersion` and logs `app.rollback`.
- `POST /api/ai/chat` (`ADMIN`, `EDITOR`) — Executes an AI Studio turn in `Auto`, `Build`, `Plan`, or `Chat` mode using the selected model tier (`Zite Mini`, `Zite Pro`, `Zite Max`, `Zite Max Fast`) via the active pluggable provider (`copilot-sdk`, `azure-openai`, or `deterministic`). Updates app screens/monorepo files in `Auto`/`Build` mode or produces structured architecture plans in `Plan`/`Chat` mode.
- `POST /api/ai/field-evaluate` (`ADMIN`, `EDITOR`) — Evaluates an `ai_field` prompt across one or all rows in a table.
- `POST /api/ai/improve-app` (`ADMIN`, `EDITOR`) — Runs automated `Review`, `Design`, or `Accessibility` audits and applies improvements.
- `POST /api/workflows` / `POST /api/workflows/[workflowId]/run` — Creates, edits, executes, or replays a backend workflow (`createEndpoint`), persists a `WorkflowRun` with step-level input/output logs, and optionally generates an HTML/PDF document via `ZitePdf.renderHtml`.
- `GET /api/brand-kits` / `POST /api/brand-kits` — Manages workspace Brand Kits and extracts brand palettes/typography from any website URL.
