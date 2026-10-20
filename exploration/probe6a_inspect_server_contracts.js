const fs = require('fs');
const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
  const chunkUrls = [
    'https://assets.zite.com/_next/static/chunks/3iv-g4bns40qb.js', // /home/[[...slug]]
    'https://assets.zite.com/_next/static/chunks/0d6xyzrx8jipv.js', // /editor/zite/[flowPublicIdentifier]/[[...slug]]
    'https://assets.zite.com/_next/static/chunks/0qej5j-a1uvdi.js', // /editor/zite/design-system
    'https://assets.zite.com/_next/static/chunks/12cdf55cps110.js', // /editor/zite/workspace/[basePublicIdentifier]/code
    'https://assets.zite.com/_next/static/chunks/00fp46rvrhgn-.js', // /database/[baseId]/[[...slug]]
    'https://assets.zite.com/_next/static/chunks/2l-9-a-35lyd9.js', // /workspace/[baseId]/[[...slug]]
    'https://assets.zite.com/_next/static/chunks/16zwnwii3wn7d.js', // /home/settings/[[...slug]]
    'https://assets.zite.com/_next/static/chunks/2atwcm3a6g6eg.js', // /home/integrations/[[...slug]]
    'https://assets.zite.com/_next/static/chunks/2x42ml9fg39bd.js', // /billing/plan-builder
    'https://assets.zite.com/_next/static/chunks/0abi-qod9lmdn.js', // /migrate
  ];

  const report = {};
  for (const url of chunkUrls) {
    const name = url.split('/').pop();
    const text = await fetchText(url);
    const endpoints = Array.from(
      new Set(
        (text.match(/["'`]\/(admin|workspaces|v1|zite|public|databases|flows|organizations)[a-zA-Z0-9_/\-?=&.${}]*["'`]/g) || [])
          .map((s) => s.slice(1, -1))
      )
    );
    report[name] = { length: text.length, endpoints: endpoints.slice(0, 60) };
  }

  // Also fetch key developer/help markdown files
  const mdUrls = {
    'framework_overview.md': 'https://developers.zite.com/framework/overview.md',
    'project_structure.md': 'https://developers.zite.com/framework/project-structure.md',
    'database_client.md': 'https://developers.zite.com/framework/database-client.md',
    'workflows_spec.md': 'https://developers.zite.com/framework/workflows.md',
    'field_types.md': 'https://developers.zite.com/api/field-types.md',
    'audit_event_types.md': 'https://www.zite.com/help/platform/audit-logs/event-types.md',
    'model_selection.md': 'https://www.zite.com/help/platform/basics/model-selection.md',
  };

  for (const [fname, url] of Object.entries(mdUrls)) {
    try {
      const md = await fetchText(url);
      fs.writeFileSync(`/home/azadmin/zite/exploration/${fname}`, md);
      console.log(`Saved ${fname} (${md.length} chars)`);
    } catch (e) {
      console.error(`Error fetching ${fname}:`, e.message);
    }
  }

  fs.writeFileSync('/home/azadmin/zite/exploration/chunk_endpoints.json', JSON.stringify(report, null, 2));
  console.log('Saved chunk_endpoints.json');
})();
