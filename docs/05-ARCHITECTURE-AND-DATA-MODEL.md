# 05 — System Architecture & Data Model (`05-ARCHITECTURE-AND-DATA-MODEL.md`)

## 1. High-Level System Architecture

```text
+---------------------------------------------------------------------------------------------------+
|                                   ZITE FULL-STACK PLATFORM (Next.js 16)                           |
|                                                                                                   |
|  +---------------------------+  +----------------------------------+  +------------------------+  |
|  | Public & Marketing UI     |  | Authenticated Zite Studio UI     |  | Live App Runner        |  |
|  | - / (Hero, Pillars, FAQ)  |  | - /home (Workspaces & AI Bar)    |  | - /published/[appSlug] |  |
|  | - /apps, /database        |  | - /database/[id] (21 Fields+SQL) |  | - Ashgrove CRM, ATS,   |  |
|  | - /workflows, /pricing    |  | - /editor/[appId] (Modes/Models, |  |   Customer Portal      |  |
|  | - /marketplace/[slug]     |  |   Code Monorepo, Diff Rollback)  |  | - Kanban, Reports,     |  |
|  | - /developers, /help      |  | - /home/settings (Invites/Audit) |  |   Outreach, PDF/CSV    |  |
|  +-------------+-------------+  +-----------------+----------------+  +-----------+------------+  |
|                |                                  |                               |               |
|                +----------------------------------+-------------------------------+               |
|                                                   |                                               |
|                                                   v                                               |
|  +---------------------------------------------------------------------------------------------+  |
|  |                     API Route Layer + NextAuth v4 + RBAC + Session Guard                    |  |
|  |  - requireAuth() / requireRole(['ADMIN','EDITOR','VIEWER']) + sessionVersion verification   |  |
|  |  - Account Admission Service (SHA-256 single-use invites, rotation, revocation)             |  |
|  |  - Zite Database Engine (21 field types, Formula calculator, AI Field runner, zite.sql())   |  |
|  |  - Zite Workflow Engine (createEndpoint runner, step logs, replay, ZitePdf.renderHtml)      |  |
|  |  - Immutable Audit Logger (db.*, auth.*, user.*, app.*, workflow.*, ai.*)                   |  |
|  +---------------------------------+-------------------------------------------+---------------+  |
|                                    |                                           |                  |
|                                    v                                           v                  |
|  +--------------------------------------------------+   +--------------------------------------+  |
|  | Prisma 7 Dual-Database Persistence Layer         |   | Pluggable AI Engine (src/lib/ai)     |  |
|  | - Dev/Test: SQLite (@prisma/adapter-better-sqlite3)|  | 1. @github/copilot-sdk (Default)    |  |
|  | - Prod: PostgreSQL (prisma/schema.postgres.prisma)|   | 2. Azure OpenAI Adapter             |  |
|  +--------------------------------------------------+   | 3. Deterministic Zite Synthesizer    |  |
|                                                         +--------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Pluggable AI Engine Architecture

To satisfy the requirement *"If need ai capability, use copilot sdk and call copilot model, we will switch to azure openai later, so make the ai capability plugable"*, all AI operations flow through `src/lib/ai/provider.ts`:

```typescript
export type AIProviderId = 'copilot-sdk' | 'azure-openai' | 'deterministic';
export type ZiteAgentMode = 'auto' | 'build' | 'plan' | 'chat';
export type ZiteModelTier = 'zite-mini' | 'zite-pro' | 'zite-max' | 'zite-max-fast';
```

1. **Model Tier Resolution (`resolveEffectiveModelTier`)**:
   - Matches Zite's documented behavior (`www.zite.com/help/platform/basics/model-selection`):
   - `build` and `auto` modes use the user's selected tier (`zite-mini`, `zite-pro`, `zite-max`, or `zite-max-fast`).
   - `plan` and `chat` modes automatically elevate `zite-mini` and `zite-pro` to **`zite-max`** (while preserving `zite-max-fast` if already selected).
2. **Provider Selection**:
   - Reads `AI_PROVIDER` environment variable or organization runtime setting (`copilot-sdk` by default).
   - `CopilotSdkProvider` dynamically loads `@github/copilot-sdk`, starts a session with the mapped Copilot model, and executes the structured prompt.
   - `AzureOpenAIProvider` calls `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`.
   - If the active cloud provider is unreachable in an offline/CI environment, the orchestrator gracefully falls back to `DeterministicZiteProvider` and records the provider metadata in the response and `AuditLog`.

---

## 3. Complete Entity-Relationship & Prisma Data Model

### 3.1 Identity, Invite-Only Admission & Governance Models
- **`User`**:
  - `id` (CUID), `email` (unique, normalized lowercase), `name`, `role` (`ADMIN` | `EDITOR` | `VIEWER`), `status` (`ACTIVE` | `REVOKED` | `DISABLED`), `sessionVersion` (Int, default `1`), `aiCreditLimit` (Int, default `400`), `aiCreditsUsed` (Int, default `0`), `createdByAdminBootstrap` (Boolean), `invitedById` (nullable FK), `lastLoginAt`, `revokedAt`, `createdAt`, `updatedAt`.
- **`PasswordCredential`**:
  - `id`, `userId` (unique FK -> `User`), `passwordHash` (`scrypt$<salt>$<hash>`), `passwordUpdatedAt`.
- **`AccountInvitation`**:
  - `id`, `email` (indexed), `role` (`ADMIN` | `EDITOR` | `VIEWER`), `tokenHash` (unique SHA-256 hex digest), `tokenPreview` (first 6 chars for admin display), `status` (`PENDING` | `ACCEPTED` | `REVOKED` | `EXPIRED`), `expiresAt`, `invitedByUserId` (FK -> `User`), `acceptedByUserId` (nullable FK -> `User`), `acceptedAt`, `revokedAt`, `rotatedAt`, `createdAt`, `updatedAt`.
- **`UserGroup`**:
  - `id`, `name`, `description`, `membersJson` (JSON array of user emails/IDs), `permissionsJson` (table/app access rules), `createdAt`.
- **`AuditLog`**:
  - `id`, `eventType` (e.g. `auth.login.success`, `user.invite`, `user.roleChange`, `user.disable`, `db.table.create`, `workflow.execute`), `category` (`auth`, `user`, `db`, `app`, `workflow`, `ai`, `org`), `securityCritical` (Boolean), `actorUserId`, `actorEmail`, `targetType`, `targetId`, `targetName`, `outcome` (`SUCCESS` | `FAILURE`), `payloadJson`, `createdAt`.

### 3.2 Workspace, Unified Database, Apps, Workflows & Brand Kit Models
- **`Workspace`**:
  - `id`, `publicId` (unique, e.g., `ws_ashgrove_crm`), `name`, `description`, `icon`, `color`, `ownerId`, `brandKitId`, `createdAt`, `updatedAt`.
- **`BrandKit`**:
  - `id`, `workspaceId`, `name`, `logoUrl`, `primaryColor`, `accentColor`, `backgroundColor`, `textColor`, `headingFont`, `bodyFont`, `borderRadius`, `toneOfVoice`, `sourceWebsiteUrl`, `updatedAt`.
- **`DatabaseTable`**:
  - `id`, `workspaceId` (FK -> `Workspace`), `name` (display label, e.g. `Deals`), `sdkName` (camelCase/PascalCase SDK identifier, e.g. `deals` / `Deals`), `icon`, `description`, `orderIndex`, `fieldsJson` (array of `ZiteFieldDefinition` covering all 21 types + `formula` + `ai_field`), `viewsJson` (array of `ZiteViewDefinition` for Grid/Kanban/Gallery views), `accessRulesJson`, `createdAt`, `updatedAt`.
- **`DatabaseRecord`**:
  - `id` (e.g., `rec_...`), `tableId` (FK -> `DatabaseTable`), `workspaceId`, `valuesJson` (JSON object keyed by field `sdkName`), `sourceJson` (`{ type: 'manual' | 'workflow' | 'import' | 'public_api' }`), `createdByEmail`, `createdAt`, `updatedAt`.
- **`ZiteApp`**:
  - `id`, `publicId` (unique, e.g., `rnc1vjxbjr`), `slug` (unique, e.g., `ashgrove-crm`), `workspaceId` (FK -> `Workspace`), `name`, `description`, `templateCategory`, `status` (`DRAFT` | `PUBLISHED` | `DISABLED`), `accessMode` (`PRIVATE` | `INTERNAL` | `EXTERNAL_PORTAL` | `PUBLIC`), `loginMethodsJson`, `navigationJson`, `styleOverridesJson`, `monorepoFilesJson` (`zite.config.json`, `zite.schema.json`, `.zite/db.ts`, `src/App.tsx`, `src/api/*.ts`), `currentVersion` (Int), `publishedAt`, `createdAt`, `updatedAt`.
- **`AppVersion`**:
  - `id`, `appId` (FK -> `ZiteApp`), `versionNumber` (Int), `label`, `summary`, `diffSummary`, `snapshotJson`, `createdByEmail`, `createdAt`.
- **`AiChatThread` & `AiChatMessage`**:
  - `id`, `appId` (FK -> `ZiteApp`), `title`, `mode` (`auto` | `build` | `plan` | `chat`), `modelTier` (`zite-mini` | `zite-pro` | `zite-max` | `zite-max-fast`), `messagesJson`, `updatedAt`.
- **`ZiteWorkflow`**:
  - `id`, `workspaceId` (FK -> `Workspace`), `appId` (nullable FK -> `ZiteApp`), `name`, `filename` (e.g. `createLeadFollowup.ts`), `description`, `triggerType` (`schedule` | `webhook` | `app_click` | `on_demand`), `triggerConfigJson` (cron expression, webhook path, or button binding), `stepsJson` (visual flow steps), `code` (TypeScript `createEndpoint` source), `enabled` (Boolean), `createdAt`, `updatedAt`.
- **`WorkflowRun`**:
  - `id`, `workflowId` (FK -> `ZiteWorkflow`), `workspaceId`, `triggerSource`, `status` (`SUCCESS` | `ERROR` | `RUNNING`), `durationMs`, `inputJson`, `outputJson`, `stepsLogJson`, `pdfArtifactHtml`, `triggeredByEmail`, `createdAt`.
- **`WorkspaceIntegration`**:
  - `id`, `workspaceId`, `providerId` (e.g. `slack`, `stripe`, `airtable`, `hubspot`, `openai`, `resend`), `name`, `category`, `status` (`CONNECTED` | `DISCONNECTED`), `configJson`, `secretMasked`, `updatedAt`.
