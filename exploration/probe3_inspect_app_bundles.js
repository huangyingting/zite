const fs = require('fs');
const { chromium } = require('playwright');

function loadCookiesMultiDomain() {
  const raw = JSON.parse(fs.readFileSync('/home/azadmin/zite/.cred', 'utf8'));
  const out = [];
  for (const c of raw) {
    const domains = [c.domain, '.zite.com', 'app.zite.com', 'server.zite.com', '.fillout.com'];
    for (const d of new Set(domains)) {
      out.push({
        name: c.name,
        value: c.value,
        domain: d,
        path: c.path || '/',
        httpOnly: Boolean(c.httpOnly),
        secure: true,
        sameSite: 'None',
      });
    }
  }
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(loadCookiesMultiDomain());
  const page = await context.newPage();

  const calls = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (u.includes('server.zite.com')) {
      let body = '';
      try { body = await res.text(); } catch {}
      calls.push({ url: u, status: res.status(), body: body.slice(0, 500) });
    }
  });

  await page.goto('https://app.zite.com/home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  console.log('Current URL:', page.url());
  console.log('server.zite.com calls:', JSON.stringify(calls, null, 2));

  // Fetch full _buildManifest.js
  const manifestRes = await page.request.get('https://assets.zite.com/_next/static/OZWKvJlRPkhPDzcDqez3b/_buildManifest.js');
  const manifestText = await manifestRes.text();
  fs.writeFileSync('/home/azadmin/zite/exploration/app_build_manifest.js', manifestText);

  await browser.close();
})();
