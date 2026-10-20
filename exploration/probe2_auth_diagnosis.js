const fs = require('fs');
const { chromium } = require('playwright');

function loadCookies() {
  const raw = JSON.parse(fs.readFileSync('/home/azadmin/zite/.cred', 'utf8'));
  const out = [];
  for (const c of raw) {
    for (const sameSite of ['None']) {
      const cookie = {
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        httpOnly: Boolean(c.httpOnly),
        secure: true,
        sameSite,
      };
      if (c.expirationDate && !c.session) {
        cookie.expires = Math.floor(Number(c.expirationDate));
      }
      out.push(cookie);
    }
  }
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(loadCookies());
  const page = await context.newPage();

  const serverResponses = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('server.zite.com') || url.includes('_buildManifest.js')) {
      let text = '';
      try {
        text = await res.text();
      } catch {}
      const reqHeaders = Object.keys(res.request().headers());
      serverResponses.push({
        url,
        status: res.status(),
        reqHeaderKeys: reqHeaders,
        body: text.slice(0, 3000),
      });
    }
  });

  await page.goto('https://app.zite.com/home', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  const appManifest = await page.evaluate(async () => {
    return window.__BUILD_MANIFEST ? Object.keys(window.__BUILD_MANIFEST) : [];
  }).catch(() => []);

  await page.goto('https://www.zite.com/', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  const wwwManifest = await page.evaluate(async () => {
    return window.__BUILD_MANIFEST ? Object.keys(window.__BUILD_MANIFEST) : [];
  }).catch(() => []);

  fs.writeFileSync(
    '/home/azadmin/zite/exploration/probe2_diagnosis.json',
    JSON.stringify({ appManifest, wwwManifest, serverResponses }, null, 2)
  );
  console.log('App routes count:', appManifest.length);
  console.log('WWW routes count:', wwwManifest.length);
  await browser.close();
})();
