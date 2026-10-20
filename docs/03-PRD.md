# 03 — Product Requirements Document (PRD): Zite AI Business App, Database & Workflow Platform

## 1. Product Vision & Overview

**Zite** (*"The AI builder that means business"*) is an enterprise-ready, AI-native platform for building, running, and governing full-stack business software—including CRMs, Applicant Tracking Systems, Customer Portals, Inventory Trackers, Support Helpdesks, and Executive Dashboards.

Unlike prototype-only AI code generators, every Zite **Workspace** combines:
1. **One Unified Zite Database** (spreadsheet-ergonomic relational tables, 21+ field types, Formula fields, AI auto-fill fields, saved Views, CSV/Spreadsheet import/export, and read-only `zite.sql()`).
2. **Multiple Full-Stack Business Apps** (built conversationally with 4 Agent Modes—`Auto`, `Build`, `Plan`, `Chat`—and 4 Model Tiers—`Zite Mini`, `Zite Pro`, `Zite Max`, `Zite Max Fast`—plus visual Selective Edits, Brand Kits, full TypeScript `zitejs` monorepo code view, Version Rollback, and one-click publishing).
3. **Backend Workflows** (`createEndpoint` automations triggered on a schedule, webhook, app button click, or on demand, with visual step preview, TypeScript code editor, execution history, replay, and PDF document generation).
4. **Enterprise Governance & Invite-Only Admission** (single-use/expiring/rotatable invitation codes, CLI-only admin bootstrap, `Admin`/`Editor`/`Viewer` RBAC, immediate session revocation, user groups, custom access rules, and security-critical audit logs).

---

## 2. Target Personas

1. **Organization Admin (`ADMIN`)**: Deploys Zite via `npm run bootstrap:admin`, configures AI providers (`@github/copilot-sdk` or Azure OpenAI) and credit limits, issues/rotates/revokes single-use invitation links, assigns `Admin`/`Editor`/`Viewer` roles, revokes compromised users with instant session termination, and exports security audit logs.
2. **Business Builder / Operations Lead (`EDITOR`)**: Creates workspaces, imports spreadsheets/CSVs or clones Marketplace templates, defines database schemas and AI/Formula fields, builds internal tools and portals using AI Agent Modes (`Auto`, `Build`, `Plan`, `Chat`), customizes Brand Kits, authors backend workflows, and publishes apps.
3. **Internal Team Member / Portal User (`VIEWER`)**: Uses published Zite apps (e.g., Ashgrove CRM, Applicant Tracking System, Customer Portal), filters/searches database views, triggers allowed app actions, and views reports without modifying underlying schemas or organization settings.

---

## 3. Functional Requirements

### FR-1: Public Marketing, Product Showcases, Template Marketplace & Docs
- **FR-1.1**: Responsive landing page (`/`) featuring interactive AI prompt launcher, 4 core product pillar tabs (`Apps`, `Database`, `Workflows`, `Integrations`), customer social proof, and FAQ accordion.
- **FR-1.2**: Dedicated product deep-dive pages (`/apps`, `/database`, `/workflows`, `/integrations`, `/pricing`, `/enterprise`, `/customers`, `/spreadsheet-to-app`, `/ai-app-builder-comparison`, `/developers`, `/help`).
- **FR-1.3**: Interactive Template Marketplace (`/marketplace` and `/marketplace/[slug]`) with category filtering, search, live interactive template preview, and **"Use Template"** one-click workspace cloning.
- **FR-1.4**: Auth-aware navigation header switching between `Log in` / `Start for free` (unauthenticated) and `Dashboard ->` (`/home` when authenticated).

### FR-2: Invite-Only Authentication, RBAC, Revocation & Audit Logging
- **FR-2.1**: Credentials login (`/login`), SSO login flow (`/sso`), password reset flow (`/reset-password`), and invite-only registration (`/invite/signup?token=...` and `/signup`).
- **FR-2.2**: Uninvited `/signup` attempts are rejected with a clear invite-only policy explanation; valid single-use, unexpired tokens display the pre-bound email and role and atomically create the user account.
- **FR-2.3**: CLI-only bootstrap admin script (`npm run bootstrap:admin -- --email <email> --password-stdin`). No HTTP bootstrap endpoint exists.
- **FR-2.4**: Admin User & Invitation Console (`/home/settings`) supporting invitation creation (with configurable role & expiration hours), token rotation, invitation revocation, user role changes (`ADMIN`, `EDITOR`, `VIEWER`), user suspension/revocation (`sessionVersion` increment), and reactivation.
- **FR-2.5**: Immutable Audit Log viewer (`/home/settings` Audit Logs tab) with filter by event category, security-critical shield filter, search, detail JSON drawer, and CSV/JSON export.

### FR-3: Workspace Dashboard & Migration Hub
- **FR-3.1**: Authenticated Workspace Hub (`/home`) with sidebar navigation (Workspaces, Shared with me, Templates, Migrate, Integrations, Brand Kit, Settings, AI Credits meter), top AI app prompt bar with Mode (`Auto`/`Build`/`Plan`/`Chat`), Model (`Zite Mini`/`Zite Pro`/`Zite Max`/`Zite Max Fast`), `Import Data`, `Match Brand`, and `Integrate` controls.
- **FR-3.2**: Migration Hub (`/migrate`) supporting one-click CSV/JSON/Spreadsheet table import and guided migration from Airtable, Google Sheets, Excel, Notion, Retool, and Zapier.

### FR-4: Unified Zite Database Studio (`/database/[workspaceId]`)
- **FR-4.1**: Multi-table tabs with create, rename, duplicate, and delete table operations.
- **FR-4.2**: Rich field engine supporting Zite's 21 field types (`single_line_text`, `long_text`, `email`, `url`, `phone_number`, `number`, `currency`, `percent`, `rating`, `duration`, `single_select`, `multiple_select`, `checkbox`, `date`, `datetime`, `attachments`, `linked_record`, `lookup`, `formula`, `autonumber`, `source`) plus **AI Fields** (`ai_field` with prompt template referencing `{Field}` columns and per-row/column AI evaluation).
- **FR-4.3**: Saved Views (`Grid`, `Kanban`, `Summary`) with real-time Filter builder, Sort rules, Group By, Column Hide/Show, inline cell editing, row creation/deletion, CSV import, and CSV/JSON export.
- **FR-4.4**: Built-in Read-Only SQL Runner (`zite.sql()`) allowing parameterized `SELECT` queries and aggregations over workspace tables.

### FR-5: AI App Builder Studio, Multi-Chat, Brand Kit & Monorepo Code Editor (`/editor/[appId]`)
- **FR-5.1**: Multi-Chat AI Sidebar with `New chat`, thread switching, **4 Agent Modes** (`Auto`, `Build`, `Plan`, `Chat` with `Shift+Tab` shortcut), and **4 Model Tiers** (`Zite Mini`, `Zite Pro`, `Zite Max`, `Zite Max Fast` with mode-based elevation to `Zite Max` for `Plan`/`Chat`).
- **FR-5.2**: Pluggable AI Engine Indicator & Switcher showing active provider (`GitHub Copilot SDK`, `Azure OpenAI`, or `Deterministic Engine`) and model telemetry.
- **FR-5.3**: 5 Primary Studio Tabs inside the App Editor:
  1. **Preview**: Live interactive app canvas (CRM / ATS / Portal / Custom App) + **Selective Edits** visual style inspector + **Improve My App** (`Review`, `Design`, `Accessibility` automated audits).
  2. **Workflows**: Linked backend workflows (`createEndpoint`) with visual `Preview` step diagram, `Code` TypeScript editor, `History` execution logs, `Test Run` / `Replay Run`, and **PDF Invoice/Report Generator**.
  3. **Database**: Embedded workspace database grid & schema editor.
  4. **Users & Access**: App visibility (`Private`, `Internal Workspace Members`, `External Portal Users`, `Public`), User Groups, and Custom Access Rules.
  5. **Code & Versions**: Full `zitejs` monorepo file browser (`zite.config.json`, `zite.schema.json`, `.zite/db.ts`, `apps/<slug>/src/App.tsx`, `apps/<slug>/src/api/*.ts`), editable code buffer, and **Version History** with diff inspection and one-click **Rollback**.
- **FR-5.4**: Brand Kit & Design System Studio (`/editor/design-system`) with Primary/Accent/Background/Text color pickers, Heading/Body typography, Tone of voice, Dark/Light preview, and **"Import Brand from Website URL"**.

### FR-6: Live Published Application Runner (`/published/[appSlug]`)
- **FR-6.1**: Dedicated live application runtime resembling `https://zite-demo-rnc1vjxbjr.zite.so/` with full navigation (`Home`, `Leads`, `Deals`, `Companies`, `Contacts`, `Tasks`, `Outreach`, `Reports` or app-specific views), `Ctrl+K` command search, live database record creation/editing, Kanban stage transitions, workflow action triggers, PDF report/invoice export, and CSV export.
