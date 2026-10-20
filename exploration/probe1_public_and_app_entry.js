const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function loadCookies() {
  const raw = JSON.parse(fs.readFileSync('/home/azadmin/zite/.cred', 'utf8'));
  const cookies = [];
  for (const c of raw) {
    let sameSite = 'Lax';
    if (typeof c.sameSite === 'string') {
      const lower = c.sameSite.toLowerCase();
      if (lower === 'strict') sameSite = 'Strict';
      else if (lower === 'none' || lower === 'no_restriction') sameSite = 'None';
      else sameSite = 'Lax';
    }
    const baseCookie = {
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || '/',
      httpOnly: Boolean(c.httpOnly),
      secure: Boolean(c.secure),
      sameSite,
    };
    if (c.expirationDate && !c.session) {
      baseCookie.expires = Math.floor(Number(c.expirationDate));
    }
    cookies.push(baseCookie);
    // Also mirror .zite.com cookies to app.zite.com and www.zite.com if needed
  }
  return cookies;
}

async function extractPageTelemetry(page, label) {
  const url = page.url();
  const title = await page.title().catch(() => '');
  const data = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map((el) => ({
      tag: el.tagName,
      text: (el.innerText || '').trim().slice(0, 200),
    })).filter((h) => h.text);

    const links = Array.from(document.querySelectorAll('a[href]')).map((el) => ({
      text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 120),
      href: el.getAttribute('href'),
    }));

    const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map((el) => ({
      text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 120),
      disabled: el.hasAttribute('disabled'),
    })).filter((b) => b.text);

    const inputs = Array.from(document.querySelectorAll('input, textarea, select, [contenteditable="true"]')).map((el) => ({
      tag: el.tagName,
      type: el.getAttribute('type') || '',
      placeholder: el.getAttribute('placeholder') || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      name: el.getAttribute('name') || '',
    }));

    const bodyText = (document.body?.innerText || '').slice(0, 5000);
    return { headings, links, buttons, inputs, bodyText };
  }).catch((e) => ({ error: e.message }));

  return { label, url, title, ...data };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });

  const cookies = loadCookies();
  await context.addCookies(cookies);

  const apiCalls = [];
  context.on('response', async (res) => {
    const reqUrl = res.url();
    if (
      (reqUrl.includes('zite.com') || reqUrl.includes('fillout.com')) &&
      !reqUrl.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ico|webp)(\?|$)/i)
    ) {
      const ct = res.headers()['content-type'] || '';
      let bodyPreview = null;
      if (ct.includes('application/json')) {
        try {
          const text = await res.text();
          bodyPreview = text.slice(0, 1500);
        } catch {}
      }
      apiCalls.push({
        method: res.request().method(),
        url: reqUrl,
        status: res.status(),
        contentType: ct,
        bodyPreview,
      });
    }
  });

  const page = await context.newPage();
  const report = { timestamp: new Date().toISOString(), pages: [], apiCalls };

  console.log('1. Visiting https://www.zite.com ...');
  await page.goto('https://www.zite.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/home/azadmin/zite/screenshots/exploration/01_www_zite_desktop.png', fullPage: true });
  report.pages.push(await extractPageTelemetry(page, 'www_zite_home_desktop'));

  // Responsive checks on www.zite.com
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/azadmin/zite/screenshots/exploration/02_www_zite_tablet.png', fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/azadmin/zite/screenshots/exploration/03_www_zite_mobile.png', fullPage: false });

  // Reset to desktop
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('2. Visiting https://app.zite.com ...');
  await page.goto('https://app.zite.com', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '/home/azadmin/zite/screenshots/exploration/04_app_zite_entry.png', fullPage: true });
  report.pages.push(await extractPageTelemetry(page, 'app_zite_entry'));

  fs.writeFileSync('/home/azadmin/zite/exploration/probe1_report.json', JSON.stringify(report, null, 2));
  console.log('Saved probe1_report.json. Visited URLs:', report.pages.map((p) => `${p.label}: ${p.url}`));
  await browser.close();
})();
