// Lists every sprite the page asks for, across all passes and clips, as the "files" map for publishing. node used.cjs > used.json
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const root = path.resolve(__dirname, '..'), used = new Set();
  const srv = require('http').createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); if (u.startsWith('/sprites/')) used.add(u.slice(1)); fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': u.endsWith('png') ? 'image/png' : 'text/html' }); r.end(d); }); });
  await new Promise(ok => srv.listen(0, ok));
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://localhost:' + srv.address().port + '/index.html?bare&still');
  const max = await page.evaluate(() => AK.maxPass);
  for (let P = 1; P <= max; P++) { await page.evaluate(async P => { AK.P = P; for (const c of clipsAt(P)) { build(c.id); await new Promise(r => setTimeout(r, 15)); } }, P); await page.waitForLoadState('networkidle'); }
  await b.close(); srv.close();
  const map = {}; for (const u of [...used].sort()) map[u] = 'plans/animation-redesign/' + u;
  console.log(JSON.stringify(map));
})();
