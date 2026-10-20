-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "aiCreditLimit" INTEGER NOT NULL DEFAULT 400,
    "aiCreditsUsed" INTEGER NOT NULL DEFAULT 45,
    "createdByAdminBootstrap" BOOLEAN NOT NULL DEFAULT false,
    "invitedById" TEXT,
    "lastLoginAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "tokenHash" TEXT NOT NULL,
    "tokenPreview" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "acceptedByUserId" TEXT,
    "acceptedAt" DATETIME,
    "revokedAt" DATETIME,
    "rotatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AccountInvitation_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "membersJson" TEXT NOT NULL DEFAULT '[]',
    "permissionsJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'org',
    "securityCritical" BOOLEAN NOT NULL DEFAULT false,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'SUCCESS',
    "ipAddress" TEXT,
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'Briefcase',
    "color" TEXT NOT NULL DEFAULT '#2563EB',
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoText" TEXT NOT NULL DEFAULT 'AS',
    "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "accentColor" TEXT NOT NULL DEFAULT '#059669',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FAF9F5',
    "surfaceColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#141413',
    "headingFont" TEXT NOT NULL DEFAULT 'Georgia',
    "bodyFont" TEXT NOT NULL DEFAULT 'Inter',
    "borderRadius" TEXT NOT NULL DEFAULT '8px',
    "toneOfVoice" TEXT NOT NULL DEFAULT 'Crisp, operational, and executive-ready',
    "sourceWebsiteUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandKit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatabaseTable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sdkName" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Table',
    "description" TEXT NOT NULL DEFAULT '',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "fieldsJson" TEXT NOT NULL DEFAULT '[]',
    "viewsJson" TEXT NOT NULL DEFAULT '[]',
    "accessRulesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatabaseTable_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatabaseRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "valuesJson" TEXT NOT NULL DEFAULT '{}',
    "sourceJson" TEXT NOT NULL DEFAULT '{"type":"manual"}',
    "createdByEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatabaseRecord_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DatabaseTable" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DatabaseRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ZiteApp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'Layout',
    "color" TEXT NOT NULL DEFAULT '#2563EB',
    "templateCategory" TEXT NOT NULL DEFAULT 'Sales',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "accessMode" TEXT NOT NULL DEFAULT 'INTERNAL',
    "loginMethodsJson" TEXT NOT NULL DEFAULT '["google","microsoft","email_otp","password","sso"]',
    "accessRulesJson" TEXT NOT NULL DEFAULT '[]',
    "navigationJson" TEXT NOT NULL DEFAULT '[]',
    "styleOverridesJson" TEXT NOT NULL DEFAULT '{}',
    "monorepoFilesJson" TEXT NOT NULL DEFAULT '{}',
    "auditReportJson" TEXT NOT NULL DEFAULT '{}',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ZiteApp_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "diffSummary" TEXT NOT NULL DEFAULT '',
    "snapshotJson" TEXT NOT NULL DEFAULT '{}',
    "createdByEmail" TEXT NOT NULL DEFAULT 'dominic@ashgrovesoftware.com',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppVersion_appId_fkey" FOREIGN KEY ("appId") REFERENCES "ZiteApp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiChatThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'auto',
    "modelTier" TEXT NOT NULL DEFAULT 'zite-pro',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "messagesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiChatThread_appId_fkey" FOREIGN KEY ("appId") REFERENCES "ZiteApp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ZiteWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "appId" TEXT,
    "name" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "triggerType" TEXT NOT NULL DEFAULT 'on_demand',
    "triggerConfigJson" TEXT NOT NULL DEFAULT '{}',
    "stepsJson" TEXT NOT NULL DEFAULT '[]',
    "code" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ZiteWorkflow_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ZiteWorkflow_appId_fkey" FOREIGN KEY ("appId") REFERENCES "ZiteApp" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "triggerSource" TEXT NOT NULL DEFAULT 'on_demand',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "durationMs" INTEGER NOT NULL DEFAULT 142,
    "inputJson" TEXT NOT NULL DEFAULT '{}',
    "outputJson" TEXT NOT NULL DEFAULT '{}',
    "stepsLogJson" TEXT NOT NULL DEFAULT '[]',
    "pdfArtifactHtml" TEXT,
    "triggeredByEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ZiteWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'CRM',
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "secretMasked" TEXT NOT NULL DEFAULT '••••••••••••••••',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceIntegration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrgSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "valueJson" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_userId_key" ON "PasswordCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_tokenHash_key" ON "AccountInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountInvitation_email_idx" ON "AccountInvitation"("email");

-- CreateIndex
CREATE INDEX "AccountInvitation_status_expiresAt_idx" ON "AccountInvitation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_createdAt_idx" ON "AuditLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_category_createdAt_idx" ON "AuditLog"("category", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_publicId_key" ON "Workspace"("publicId");

-- CreateIndex
CREATE INDEX "DatabaseTable_workspaceId_orderIndex_idx" ON "DatabaseTable"("workspaceId", "orderIndex");

-- CreateIndex
CREATE INDEX "DatabaseRecord_tableId_idx" ON "DatabaseRecord"("tableId");

-- CreateIndex
CREATE INDEX "DatabaseRecord_workspaceId_idx" ON "DatabaseRecord"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ZiteApp_publicId_key" ON "ZiteApp"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "ZiteApp_slug_key" ON "ZiteApp"("slug");

-- CreateIndex
CREATE INDEX "AppVersion_appId_versionNumber_idx" ON "AppVersion"("appId", "versionNumber");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_createdAt_idx" ON "WorkflowRun"("workflowId", "createdAt");
