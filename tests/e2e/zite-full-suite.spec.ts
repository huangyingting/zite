import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const VERIFY_DIR = path.join(process.cwd(), "screenshots", "verification");
fs.mkdirSync(VERIFY_DIR, { recursive: true });

test.describe("Zite Full-Stack Platform — E2E Verification Suite", () => {
  test("1. Public Marketing, Category Switcher, Marketplace, Comparison, Developers & Help Center", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /The AI builder that means business/i })
    ).toBeVisible();

    // Test interactive pillar switcher on landing page
    await page.getByTestId("pillar-tab-database").click();
    await page.getByTestId("pillar-tab-workflows").click();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "01_landing_page_desktop.png"),
    });

    // Visit Apps, Database, Workflows, Integrations, Marketplace, Pricing, Enterprise, Customers, Spreadsheet-to-App, Comparison, Developers, Help
    const publicRoutes = [
      { url: "/apps", text: "Zite Apps" },
      { url: "/database", text: "Zite Database" },
      { url: "/workflows", text: "Zite Workflows" },
      { url: "/integrations", text: "Connect Zite to your entire stack" },
      { url: "/marketplace", text: "Marketplace" },
      { url: "/marketplace/customer-relationship-management", text: "Customer Relationship Management" },
      { url: "/pricing", text: "Pay for what you build" },
      { url: "/enterprise", text: "Zite Enterprise" },
      { url: "/customers", text: "Customer Stories" },
      { url: "/spreadsheet-to-app", text: "Turn spreadsheets into full-stack apps" },
      { url: "/ai-app-builder-comparison", text: "How Zite compares" },
      { url: "/developers", text: "Zite Developer Platform" },
      { url: "/help", text: "Security & Operational Audit Log Event Types" },
    ];

    for (const r of publicRoutes) {
      await page.goto(r.url);
      await expect(page.locator("body")).toContainText(r.text);
    }

    await page.screenshot({
      path: path.join(VERIFY_DIR, "02_help_audit_reference.png"),
    });
  });

  test("2. Auth Edge States, Invite-Only Enforcement & Single-Use Invitation Lifecycle", async ({
    page,
  }) => {
    // Visit edge state routes
    await page.goto("/expired");
    await expect(page.locator("body")).toContainText("Expired");

    await page.goto("/disabled");
    await expect(page.locator("body")).toContainText("Revoked");

    await page.goto("/sso");
    await expect(page.locator("body")).toContainText("Single Sign-On");

    await page.goto("/reset-password");
    await expect(page.locator("body")).toContainText("Reset Password");

    // Verify expired invite token is rejected on /invite/signup
    await page.goto(
      "/invite/signup?token=zite_inv_demo_expired_token_2026"
    );
    await expect(page.getByTestId("invite-invalid-box")).toBeVisible();

    // Verify seeded pending single-use invite token is valid on /invite/signup
    await page.goto("/signup");
    await page.getByTestId("signup-continue-btn").click();
    await expect(page.getByTestId("invite-valid-banner")).toBeVisible();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "03_invite_signup_valid.png"),
    });
  });

  test("3. Admin Login, Pluggable AI Modes/Models, Invitations Rotation/Revocation, RBAC & Audit Logs", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@zite.com");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();

    await page.waitForURL("**/home");
    await expect(page.getByTestId("ai-provider-badge")).toBeVisible();

    // Verify mode-based model elevation on /home: Plan mode elevates zite-pro -> zite-max
    await page.getByTestId("mode-btn-plan").click();
    await expect(page.getByTestId("effective-model-indicator")).toContainText(
      "zite-max"
    );

    // Run Zite AI Agent from Home
    await page.getByTestId("home-ai-submit").click();
    await expect(page.getByTestId("home-ai-reply")).toBeVisible();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "04_studio_home_ai_agent.png"),
    });

    // Navigate to Organization Settings & Governance
    await page.goto("/home/settings");

    // Issue a new single-use invitation
    const uniqueEmail = `qa.${Date.now()}@ashgrovesoftware.com`;
    await page.getByTestId("invite-email-input").fill(uniqueEmail);
    await page.getByTestId("invite-role-select").selectOption("EDITOR");
    await page.getByTestId("issue-invite-btn").click();
    await expect(page.getByTestId("issued-invite-banner")).toBeVisible();

    // Rotate the newly created invitation token
    await page.getByTestId(`rotate-invite-${uniqueEmail}`).click();
    await expect(page.getByTestId("issued-invite-banner")).toBeVisible();

    // Revoke the invitation token
    await page.getByTestId(`revoke-invite-${uniqueEmail}`).click();
    await expect(page.getByTestId(`invite-row-${uniqueEmail}`)).toContainText(
      "REVOKED"
    );

    // Switch to Users, Roles & Revocation tab
    await page.getByTestId("settings-tab-users").click();
    await expect(
      page.getByTestId("user-row-viewer@zite.com")
    ).toBeVisible();

    // Revoke viewer@zite.com and verify status becomes REVOKED, then restore
    await page.getByTestId("revoke-user-viewer@zite.com").click();
    await expect(page.getByTestId("user-status-viewer@zite.com")).toContainText(
      "REVOKED"
    );
    await page.getByTestId("restore-user-viewer@zite.com").click();
    await expect(page.getByTestId("user-status-viewer@zite.com")).toContainText(
      "ACTIVE"
    );

    // Switch to Pluggable AI Engine tab and test switching providers
    await page.getByTestId("settings-tab-ai").click();
    await page.getByTestId("switch-ai-azure-openai").click();
    await expect(
      page.getByTestId("settings-active-ai-provider")
    ).toContainText("azure-openai");
    await page.getByTestId("switch-ai-copilot-sdk").click();
    await expect(
      page.getByTestId("settings-active-ai-provider")
    ).toContainText("copilot-sdk");

    // Switch to Security Audit Logs tab and filter by Security-Critical Shield
    await page.getByTestId("settings-tab-audit").click();
    await page.getByTestId("audit-critical-checkbox").check();
    await expect(page.getByTestId("export-audit-csv")).toBeVisible();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "05_governance_audit_logs.png"),
    });
  });

  test("4. Zite Database Studio (Tables, Columns, Kanban, and zite.sql() Runner) & Migration Hub", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@zite.com");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/home");

    await page.goto("/database/ws_ashgrove_crm");
    await expect(page.getByTestId("db-table-tab-deals")).toBeVisible();

    // Switch to Kanban view
    await page.getByTestId("db-view-kanban").click();
    await expect(page.locator("body")).toContainText("Proposal");

    // Switch to zite.sql() Runner view and execute parameterized SELECT query
    await page.getByTestId("db-view-sql").click();
    await page.getByTestId("sql-runner-execute").click();
    await expect(page.getByTestId("sql-runner-results")).toBeVisible();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "06_database_sql_runner.png"),
    });

    // Test CSV Migration Hub
    await page.goto("/migrate");
    await page.getByTestId("migrate-table-name").fill(`Imported_${Date.now()}`);
    await page.getByTestId("migrate-submit-btn").click();
    await expect(page.getByTestId("migrate-success-banner")).toBeVisible();
  });

  test("5. Zite AI App Studio (Multi-Chat, Selective Edits, Improve App, Workflows, PDF Rendering & Rollback)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@zite.com");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/home");

    await page.goto("/editor/app_ashgrove_crm");
    await expect(page.getByTestId("studio-tab-preview")).toBeVisible();

    // Test Selective Edits + Improve App UI Review
    await page.getByTestId("selective-edits-btn").click();
    await page.getByTestId("improve-ui-btn").click();

    // Test Workflows tab: Preview -> Code -> History -> Test Run & PDF Generation
    await page.getByTestId("studio-tab-workflows").click();
    await page.getByTestId("wf-subtab-code").click();
    await expect(page.locator("body")).toContainText("createEndpoint");

    await page.getByTestId("wf-subtab-test").click();
    await page.getByTestId("wf-generate-pdf-btn").click();
    await expect(page.getByTestId("wf-exec-result")).toBeVisible();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "07_studio_workflow_pdf.png"),
    });

    // Test Code & Versions tab + Version Rollback
    await page.getByTestId("studio-tab-code").click();
    await page.getByTestId("rollback-btn-v1").click();
    await expect(page.getByTestId("publish-success-banner")).toBeVisible();
  });

  test("6. Live Published Ashgrove CRM App (All 8 Modules, Global Search, + New Deal, PDF Quote & Responsive Viewports)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/published/ashgrove-crm");
    await expect(page.getByTestId("crm-kpi-pipeline")).toBeVisible();
    await page.screenshot({
      path: path.join(VERIFY_DIR, "08_published_crm_home_desktop.png"),
    });

    // Generate PDF Quote from Home Deals table
    await page.locator('[data-testid^="generate-quote-"]').first().click();
    await expect(page.getByTestId("crm-pdf-banner")).toBeVisible();

    // Visit all 8 CRM modules
    const modules = [
      "leads",
      "deals",
      "companies",
      "contacts",
      "tasks",
      "outreach",
      "reports",
      "home",
    ] as const;
    for (const mod of modules) {
      await page.getByTestId(`crm-nav-${mod}`).click();
    }

    // Create a new Deal via + New modal
    await page.getByTestId("crm-new-deal-btn").click();
    await page
      .getByTestId("crm-new-deal-name")
      .fill("Hyperion Robotics — Global Ops Suite");
    await page.getByTestId("crm-new-deal-submit").click();
    await expect(page.locator("body")).toContainText(
      "Hyperion Robotics — Global Ops Suite"
    );

    // Responsive Tablet (768x1024) and Mobile (390x844) checks
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(VERIFY_DIR, "09_published_crm_tablet.png"),
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(VERIFY_DIR, "10_published_crm_mobile.png"),
    });
  });

  test("7. Production Readiness: /api/health, Auth Proxy Protection, Brand Kit Extraction, Encrypted Secrets & Billing Persistence", async ({
    page,
    request,
  }) => {
    // 1. Verify /api/health endpoint
    const healthRes = await request.get("/api/health");
    expect(healthRes.status()).toBe(200);
    const healthJson = await healthRes.json();
    expect(healthJson.status).toBe("healthy");
    expect(healthJson.database.status).toBe("connected");

    // 2. Verify unauthenticated request to /home redirects to /login via src/proxy.ts
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?redirectPath=%2Fhome/);

    // 3. Log in as Admin
    await page.getByTestId("login-email").fill("admin@zite.com");
    await page.getByTestId("login-password").fill("Password123!");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/home");

    // 4. Verify Workspace 2.0 Container view (/workspace/ws_ashgrove_crm)
    await page.goto("/workspace/ws_ashgrove_crm");
    await expect(page.locator("body")).toContainText("Workspace 2.0 Container");
    await expect(page.locator("body")).toContainText("Ashgrove Software");

    // 5. Verify Brand Kit extraction & persistence (/editor/design-system)
    await page.goto("/editor/design-system");
    await page.getByTestId("brandkit-name-input").fill("Linear Dark Precision");
    await page.getByTestId("brandkit-url-input").fill("https://linear.app");
    await page.getByTestId("brandkit-save-btn").click();
    await expect(page.locator("body")).toContainText("Linear Dark Precision");

    // 6. Verify Encrypted Workspace Secret persistence (/home/integrations)
    await page.goto("/home/integrations");
    await page.getByTestId("secret-name-input").fill("STRIPE_WEBHOOK_SECRET");
    await page.getByTestId("secret-value-input").fill("whsec_live_987654321");
    await page.getByTestId("add-secret-btn").click();
    await expect(page.locator("body")).toContainText("STRIPE_WEBHOOK_SECRET");

    // 7. Verify Billing Plan & AI Credit Pool persistence (/billing/plan-builder)
    await page.goto("/billing/plan-builder");
    await page.getByTestId("plan-tier-enterprise").click();
    await page.getByTestId("save-plan-btn").click();
    await expect(page.getByTestId("plan-saved-banner")).toBeVisible();
  });
});
