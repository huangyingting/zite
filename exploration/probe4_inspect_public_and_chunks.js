const fs = require('fs');
const path = require('path');
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

async function extractTelemetry(page, label) {
  const url = page.url();
  const title = await page.title().catch(() => '');
  const info = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
      .map((el) => ({ tag: el.tagName, text: (el.innerText || '').trim().slice(0, 200) }))
      .filter((h) => h.text);
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      .map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 100))
      .filter(Boolean);
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map((el) => ({
        text: (el.innerText || '').trim().slice(0, 80),
        href: el.getAttribute('href'),
      }))
      .slice(0, 80);
    const bodyText = (document.body?.innerText || '').slice(0, 6000);
    return { headings, buttons, links, bodyText };
  }).catch((e) => ({ error: e.message }));
  return { label, url, title, ...info };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies(loadCookies());
  const page = await context.newPage();

  const publicRoutes = [
    { label: '05_www_apps', url: 'https://www.zite.com/apps' },
    { label: '06_www_database', url: 'https://www.zite.com/database' },
    { label: '07_www_workflows', url: 'https://www.zite.com/workflows' },
    { label: '08_www_integrations', url: 'https://www.zite.com/integrations' },
    { label: '09_www_marketplace', url: 'https://www.zite.com/marketplace' },
    { label: '10_www_marketplace_crm', url: 'https://www.zite.com/marketplace/customer-relationship-management' },
    { label: '11_www_pricing', url: 'https://www.zite.com/pricing' },
    { label: '12_www_enterprise', url: 'https://www.zite.com/enterprise' },
    { label: '13_www_customers', url: 'https://www.zite.com/customers' },
    { label: '14_www_spreadsheet_to_app', url: 'https://www.zite.com/spreadsheet-to-app' },
    { label: '15_www_ai_comparison', url: 'https://www.zite.com/ai-app-builder-comparison' },
    { label: '16_developers_zite', url: 'https://developers.zite.com/' },
    { label: '17_help_zite', url: 'https://www.zite.com/help' },
  ];

  const results = [];
  for (const r of publicRoutes) {
    console.log(`Visiting ${r.label}: ${r.url}`);
    try {
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2500);
      await page.screenshot({
        path: `/home/azadmin/zite/screenshots/exploration/${r.label}.png`,
        fullPage: false,
      });
      results.push(await extractTelemetry(page, r.label));
    } catch (err) {
      console.error(`Error on ${r.url}:`, err.message);
      results.push({ label: r.label, url: r.url, error: err.message });
    }
  }

  // Also inspect scripts loaded on https://app.zite.com/login to get main & _app chunks
  await page.goto('https://app.zite.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const scriptSrcs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map((s) => s.src)
  );

  fs.writeFileSync(
    '/home/azadmin/zite/exploration/probe4_public_routes.json',
    JSON.stringify({ results, appScriptSrcs: scriptSrcs }, null, 2)
  );
  console.log('Done probe4! Visited', results.length, 'routes.');
  await browser.close();
})();
