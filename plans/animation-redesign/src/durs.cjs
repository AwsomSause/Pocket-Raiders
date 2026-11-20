// Lengths of clips at one pass. node durs.cjs <pass> <id,id,...>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const P = +process.argv[2], ids = process.argv[3].split(','), root = path.resolve(__dirname, '..');
  const srv = require('http').createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': u.endsWith('png') ? 'image/png' : 'text/html' }); r.end(d); }); });
  await new Promise(ok => srv.listen(0, ok));
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 } }); const out = [];
  for (const id of ids) { await page.goto('http://localhost:' + srv.address().port + '/index.html?bare&still&pass=' + P + '&c=' + id); await page.waitForFunction(() => typeof AK !== 'undefined' && AK.S); out.push(id + ' ' + await page.evaluate(() => AK.S.dur.toFixed(1) + 's ' + AK.S.acts.length + ' pieces | ' + AK.S.beats.map(b => b[0].toFixed(1) + ' ' + b[1]).join('; ').slice(0, 330))); }
  console.log(out.join('\n')); await b.close(); srv.close();
})();
