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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies(loadCookies());
  const page = await context.newPage();

  // 1. Fetch llms.txt from help and developers
  for (const [name, url] of [
    ['help_llms.txt', 'https://www.zite.com/help/llms.txt'],
    ['dev_llms.txt', 'https://developers.zite.com/llms.txt'],
  ]) {
    try {
      const res = await page.request.get(url);
      fs.writeFileSync(`/home/azadmin/zite/exploration/${name}`, await res.text());
      console.log(`Saved ${name}`);
    } catch (e) {
      console.error(`Failed ${name}:`, e.message);
    }
  }

  // 2. Visit app.zite.com auth & edge routes + live demo app + help UI pages
  const routes = [
    { label: '18_app_login', url: 'https://app.zite.com/login' },
    { label: '19_app_signup', url: 'https://app.zite.com/signup' },
    { label: '20_app_sso', url: 'https://app.zite.com/sso' },
    { label: '21_app_reset_password', url: 'https://app.zite.com/reset-password' },
    { label: '22_app_invite_signup', url: 'https://app.zite.com/invite/signup' },
    { label: '23_app_expired', url: 'https://app.zite.com/expired' },
    { label: '24_app_disabled', url: 'https://app.zite.com/disabled' },
    { label: '25_app_404', url: 'https://app.zite.com/404' },
    { label: '26_zite_live_demo_crm', url: 'https://zite-demo-rnc1vjxbjr.zite.so/' },
    { label: '27_help_workspaces', url: 'https://www.zite.com/help/platform/workspaces/overview' },
    { label: '28_help_create_app', url: 'https://www.zite.com/help/platform/how-to-build/creating-an-app' },
    { label: '29_help_agent_modes', url: 'https://www.zite.com/help/platform/how-to-build/agent-modes' },
    { label: '30_help_design_tools', url: 'https://www.zite.com/help/platform/how-to-build/design-tools' },
    { label: '31_help_brand_kit', url: 'https://www.zite.com/help/platform/how-to-build/brand-kit' },
    { label: '32_help_workflows', url: 'https://www.zite.com/help/platform/workflows/overview' },
    { label: '33_help_code_editing', url: 'https://www.zite.com/help/platform/how-to-build/code-viewing-editing' },
    { label: '34_help_access_control', url: 'https://www.zite.com/help/platform/access/overview' },
    { label: '35_help_audit_logs', url: 'https://www.zite.com/help/platform/account/audit-logs' },
    { label: '36_help_database', url: 'https://www.zite.com/help/database/overview' },
  ];

  const telemetry = [];
  for (const r of routes) {
    console.log(`Visiting ${r.label}: ${r.url}`);
    try {
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: `/home/azadmin/zite/screenshots/exploration/${r.label}.png`,
        fullPage: false,
      });
      const data = await page.evaluate(() => ({
        title: document.title,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map((h) => h.innerText.trim()).filter(Boolean),
        buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean).slice(0, 40),
        inputs: Array.from(document.querySelectorAll('input, textarea, select')).map((i) => ({
          type: i.getAttribute('type') || i.tagName,
          placeholder: i.getAttribute('placeholder') || '',
          name: i.getAttribute('name') || '',
        })),
        bodyText: (document.body?.innerText || '').slice(0, 4500),
      }));
      telemetry.push({ label: r.label, requestedUrl: r.url, finalUrl: page.url(), ...data });
    } catch (e) {
      console.error(`Error on ${r.label}:`, e.message);
      telemetry.push({ label: r.label, requestedUrl: r.url, error: e.message });
    }
  }

  fs.writeFileSync('/home/azadmin/zite/exploration/probe5_telemetry.json', JSON.stringify(telemetry, null, 2));
  await browser.close();
})();
