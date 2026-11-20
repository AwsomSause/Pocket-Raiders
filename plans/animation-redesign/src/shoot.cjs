// Photographs clips of one pass as film strips (6 moments each) and runs the text-fit check at every moment.
// node plans/animation-redesign/src/shoot.cjs <pass> <outdir> [all | id,id]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const P = +process.argv[2], out = process.argv[3], arg = process.argv[4] || '', only = arg && arg !== 'all' ? arg.split(',') : null;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('requestfailed', r => errs.push('missing ' + r.url().split('/').pop()));
  const root = path.resolve(__dirname, '..'), types = { html: 'text/html', png: 'image/png', js: 'text/javascript', json: 'application/json' };
  const srv = require('http').createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[f.split('.').pop()] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(ok => srv.listen(0, ok));
  await page.goto('http://localhost:' + srv.address().port + '/index.html?bare&still&pass=' + P);
  await page.evaluate(() => document.fonts.ready);
  const list = await page.evaluate(P => clipsAt(P).map(s => [s.id, s.meta.g + ' · ' + s.meta.t, s.isNew, s.changed]), P);
  let bad = 0; const idx = [];
  for (let i = 0; i < list.length; i++) {
    const [id, title, isNew, changed] = list[i]; if (only ? !only.includes(id) : (arg !== 'all' && !changed)) continue;
    const info = await page.evaluate(id => { build(id); return { dur: AK.S.dur, beats: AK.S.beats, n: AK.S.acts.length }; }, id);
    await page.waitForTimeout(60);
    let ts = info.beats.map(x => Math.min(info.dur, x[0] + 0.12));
    if (ts.length > 6) ts = ts.filter((_, k) => Math.round(k * 5 / (ts.length - 1)) !== Math.round((k - 1) * 5 / (ts.length - 1)) || k === 0);
    if (ts.length < 6) ts = Array.from({ length: 6 }, (_, k) => info.dur * (0.06 + 0.94 * k / 5));
    ts[ts.length - 1] = info.dur; const fr = [], issues = [];
    for (let k = 0; k < ts.length; k++) {
      issues.push(...await page.evaluate(t => { __seek(t); return __check(); }, ts[k]));
      const f = String(i + 1).padStart(3, '0') + '-' + id + '-' + k + '.png';
      await page.screenshot({ path: path.join(out, f), clip: { x: 0, y: 0, width: 960, height: 540 } }); fr.push([f, ts[k]]);
    }
    idx.push({ id, title, isNew, changed, dur: info.dur, fr, acts: info.n });
    const u = [...new Set(issues)]; if (u.length) { bad += u.length; console.log(id + ':\n  ' + u.slice(0, 10).join('\n  ')); }
  }
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(idx));
  if (errs.length) console.log('ERRORS:\n' + [...new Set(errs)].slice(0, 15).join('\n'));
  console.log('pass ' + P + ': ' + idx.length + ' clips, ' + bad + ' fit problems, ' + errs.length + ' errors; biggest clip ' + Math.max(0, ...idx.map(x => x.acts)) + ' pieces');
  await b.close(); srv.close();
})();
