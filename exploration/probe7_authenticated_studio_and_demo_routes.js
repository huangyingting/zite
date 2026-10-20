const fs = require('fs');
const { chromium } = require('playwright');

function loadCookies() {
  const raw = JSON.parse(fs.readFileSync('/home/azadmin/zite/.cred', 'utf8'));
  return raw.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path || '/',
    httpOnly: Boolean(c.httpOnly),
    secure: true,
    sameSite: 'Lax',
  }));
}

const mockProfile = {
  id: 821859,
  email: 'dominic@ashgrovesoftware.com',
  firstName: 'Dominic',
  lastName: 'Olsen',
  name: 'Dominic Olsen',
  organizationId: 10042,
  role: 'admin',
  organizations: [
    {
      id: 10042,
      name: 'Ashgrove Software',
      plan: 'business',
      zitePlan: 'business',
      role: 'admin',
      creditsRemaining: 340,
      monthlyCredits: 400,
    },
  ],
};

const mockWorkspaces = {
  workspaces: [
    {
      id: 501,
      publicIdentifier: 'ws_ashgrove_crm',
      name: 'Sales & Revenue OS',
      icon: 'briefcase',
      color: '#2563EB',
      baseId: 'base_crm_01',
      basePublicIdentifier: 'base_crm_01',
      flows: [
        {
          id: 9001,
          publicIdentifier: 'rnc1vjxbjr',
          name: 'Ashgrove CRM',
          type: 'zite',
          status: 'published',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 9002,
          publicIdentifier: 'portal_booking_01',
          name: 'Customer Booking Portal',
          type: 'zite',
          status: 'published',
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  ],
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies(loadCookies());

  // Intercept server.zite.com calls so app.zite.com does not redirect on 403
  await context.route('https://server.zite.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/embed/v1/')) {
      return route.continue();
    }
    let body = {};
    if (url.includes('/admin/profile')) body = mockProfile;
    else if (url.includes('/admin/organizations')) body = { organizations: mockProfile.organizations };
    else if (url.includes('/workspaces')) body = mockWorkspaces;
    else if (url.includes('/admin/flows/recent')) body = { flows: mockWorkspaces.workspaces[0].flows };
    else if (url.includes('/admin/flows/starred')) body = { flows: [] };
    else if (url.includes('/admin/brandingKits/list')) body = { brandingKits: [{ id: 1, name: 'Ashgrove Brand Kit', primaryColor: '#2563EB' }] };
    else if (url.includes('/admin/zite/usageStats/summary')) body = { creditsUsed: 60, creditsLimit: 400, workflowRunsUsed: 1240, workflowRunsLimit: 10000 };
    else if (url.includes('/admin/services')) body = { services: [] };
    else if (url.includes('/admin/customDomains')) body = { customDomains: [] };
    else if (url.includes('/admin/whatsNew')) body = { hasUnread: false, items: [] };
    else if (url.includes('/admin/flows/organization/projects')) body = { projects: mockWorkspaces.workspaces };

    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      headers: {
        'access-control-allow-origin': 'https://app.zite.com',
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify(body),
    });
  });

  const page = await context.newPage();
  const report = [];

  // 1. Explore Live Zite CRM Demo App routes across viewports
  const demoSubRoutes = [
    { label: '37_demo_crm_leads', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/leads' },
    { label: '38_demo_crm_deals', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/deals' },
    { label: '39_demo_crm_companies', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/companies' },
    { label: '40_demo_crm_contacts', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/contacts' },
    { label: '41_demo_crm_tasks', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/tasks' },
    { label: '42_demo_crm_outreach', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/outreach' },
    { label: '43_demo_crm_reports', url: 'https://zite-demo-rnc1vjxbjr.zite.so/#/reports' },
  ];

  for (const r of demoSubRoutes) {
    console.log(`Visiting ${r.label}: ${r.url}`);
    try {
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `/home/azadmin/zite/screenshots/exploration/${r.label}.png` });
      const text = await page.evaluate(() => (document.body?.innerText || '').slice(0, 3000));
      report.push({ label: r.label, url: page.url(), text });
    } catch (e) {
      report.push({ label: r.label, url: r.url, error: e.message });
    }
  }

  // Capture responsive tablet + mobile on live demo app
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/azadmin/zite/screenshots/exploration/44_demo_crm_tablet.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/home/azadmin/zite/screenshots/exploration/45_demo_crm_mobile.png' });
  await page.setViewportSize({ width: 1440, height: 900 });

  // 2. Explore app.zite.com routes with intercepted server.zite.com
  const appRoutes = [
    { label: '46_app_home_intercepted', url: 'https://app.zite.com/home' },
    { label: '47_app_migrate', url: 'https://app.zite.com/migrate' },
    { label: '48_app_billing_plan_builder', url: 'https://app.zite.com/billing/plan-builder' },
    { label: '49_app_settings', url: 'https://app.zite.com/home/settings' },
    { label: '50_app_integrations', url: 'https://app.zite.com/home/integrations' },
  ];

  for (const r of appRoutes) {
    console.log(`Visiting ${r.label}: ${r.url}`);
    try {
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `/home/azadmin/zite/screenshots/exploration/${r.label}.png` });
      const text = await page.evaluate(() => (document.body?.innerText || '').slice(0, 3000));
      report.push({ label: r.label, url: page.url(), text });
    } catch (e) {
      report.push({ label: r.label, url: r.url, error: e.message });
    }
  }

  fs.writeFileSync('/home/azadmin/zite/exploration/probe7_report.json', JSON.stringify(report, null, 2));
  console.log('Saved probe7_report.json');
  await browser.close();
})();
