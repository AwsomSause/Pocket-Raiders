// Writes clips.json (every clip with its title, group and notes) for lists.py. node src/dump.cjs
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const root = path.resolve(__dirname, '..');
  const srv = require('http').createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': u.endsWith('png') ? 'image/png' : 'text/html' }); r.end(d); }); });
  await new Promise(ok => srv.listen(0, ok));
  const b = await chromium.launch(); const page = await b.newPage();
  await page.goto('http://localhost:' + srv.address().port + '/index.html?bare&still&pass=25&c=idle'); await page.waitForFunction(() => typeof AK !== 'undefined' && AK.S);
  const d = await page.evaluate(() => Object.entries(AK.clips).map(([id, v]) => { const s = v.slice().sort((a, b) => a.pass - b.pass), L = s[s.length - 1]; const ideas = []; for (const v of s) if (v.meta.idea && !ideas.some(q => q[1] === v.meta.idea)) ideas.push([v.pass, v.meta.idea]); return { id, first: s[0].pass, last: L.pass, n: s.length, t: L.meta.t, g: L.meta.g, now: s[0].meta.now, idea: L.meta.idea, ideas }; }));
  fs.writeFileSync(path.join(__dirname, 'clips.json'), JSON.stringify(d, null, 1)); console.log(d.length); await b.close(); srv.close();
})();
