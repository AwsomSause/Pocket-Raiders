// Screenshots every screen of one pass, checks text fit. Usage: node src/shoot.cjs <pass> [liv|-] [only-id,...]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const R = path.dirname(__dirname);
(async () => {
const pass = +process.argv[2] || 1, liv = process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : '', only = process.argv[4] ? process.argv[4].split(',') : null;
const out = path.join(R, 'shots', 'p' + String(pass).padStart(2, '0') + (liv ? '-' + liv : '')); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errs = []; pg.on('requestfailed', q => errs.push('MISSING ' + q.url().split('/').slice(-2).join('/'))); pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('file://' + R + `/index.html?pass=${pass}&still=1&shot=1${liv ? '&liv=' + liv : ''}`); await pg.evaluate(() => document.fonts.ready);
const ids = (await pg.evaluate(() => window.__mock.list())).filter(i => !only || only.includes(i)); const problems = [];
for (const id of ids) {
  await pg.evaluate(i => window.__mock.show(i), id); await pg.waitForTimeout(140);
  await pg.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r })))); await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await pg.waitForTimeout(90);
  const bad = await pg.evaluate(() => { const res = [], S = document.getElementById('stage'); const leaves = [];
    for (const el of S.querySelectorAll('*')) { if (el.closest('[aria-hidden=true],.deco')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const txt = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' '); if (!txt) continue;
      const rg = document.createRange(); let L = 1e9, T = 1e9, Rr = -1e9, B = -1e9; for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { rg.selectNodeContents(n); for (const q of rg.getClientRects()) { L = Math.min(L, q.left); T = Math.min(T, q.top); Rr = Math.max(Rr, q.right); B = Math.max(B, q.bottom) } } if (Rr < L) continue; const r = { left: L, top: T, right: Rr, bottom: B, width: Rr - L, height: B - T }; leaves.push({ el, r, txt });
      if (r.left < -1 || r.top < -1 || r.right > 1281 || r.bottom > 721) res.push(`OFFSCREEN "${txt.slice(0, 30)}" [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') res.push(`CLIPPED-X "${txt.slice(0, 30)}"`);
      if (el.scrollHeight > el.clientHeight + 4 && cs.overflowY !== 'visible' && cs.display !== 'inline') res.push(`CLIPPED-Y "${txt.slice(0, 30)}"`);
      let p = el.parentElement; while (p && p !== S) { const pc = getComputedStyle(p); if (pc.overflow === 'hidden' || pc.clipPath !== 'none') { const pr = p.getBoundingClientRect(); if (pc.transform === 'none' && (r.left < pr.left - 3 || r.right > pr.right + 3 || r.top < pr.top - 3 || r.bottom > pr.bottom + 3)) { res.push(`CUT-BY-PARENT "${txt.slice(0, 30)}" in .${p.className.split(' ')[0]} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}] vs [${Math.round(pr.left)},${Math.round(pr.top)},${Math.round(pr.right)},${Math.round(pr.bottom)}]`); break } } p = p.parentElement } }
    for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) { const a = leaves[i], c = leaves[j]; if (a.el.contains(c.el) || c.el.contains(a.el)) continue; if (a.el.closest('.rs') && a.el.closest('.rs') === c.el.closest('.rs')) continue; const up = (e, n) => { while (n-- && e.parentElement) e = e.parentElement; return e }; if (up(a.el, 2).contains(c.el) && up(c.el, 2).contains(a.el)) continue;
      const w = Math.min(a.r.right, c.r.right) - Math.max(a.r.left, c.r.left), h = Math.min(a.r.bottom, c.r.bottom) - Math.max(a.r.top, c.r.top); if (w > 4 && h > 4) { const ar = w * h, m = Math.min(a.r.width * a.r.height, c.r.width * c.r.height); if (ar / m > 0.3) res.push(`OVERLAP "${a.txt.slice(0, 22)}" x "${c.txt.slice(0, 22)}"`) } }
    return res });
  if (bad.length) problems.push(id + ':\n  ' + [...new Set(bad)].join('\n  '));
  await pg.screenshot({ path: path.join(out, id + '.png'), clip: { x: 0, y: 0, width: 1280, height: 720 } });
}
await b.close();
fs.writeFileSync(path.join(out, 'ids.json'), JSON.stringify(ids));
console.log(`pass ${pass}${liv ? ' ' + liv : ''}: ${ids.length} screens`); if (errs.length) console.log('CONSOLE ERRORS:\n' + [...new Set(errs)].join('\n')); console.log(problems.length ? 'FIT PROBLEMS:\n' + problems.join('\n') : 'fit check: clean');
})();
