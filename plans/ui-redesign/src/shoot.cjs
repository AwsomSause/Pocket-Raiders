// Screenshots every page of one pass and runs the text-fit check.
// node plans/ui-redesign/src/shoot.cjs <pass> <outdir> [only,ids]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const P = +process.argv[2], out = process.argv[3], only = process.argv[4] ? process.argv[4].split(',') : null;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?bare&still&pass=' + P);
  await page.evaluate(() => document.fonts.ready);
  const list = await page.evaluate(P => screensAt(P).map(s => [s.id, s.meta.g + ' · ' + s.meta.t, s.isNew, s.changed]), P);
  let bad = 0; const idx = [];
  for (let i = 0; i < list.length; i++) {
    const [id, title, isNew, changed] = list[i]; if (only && !only.includes(id)) continue;
    await page.evaluate(id => { paint(id); }, id);
    await page.waitForFunction(() => [...document.images].every(im => im.complete && im.naturalWidth > 0), null, { timeout: 5000 }).catch(() => errs.push('image missing on ' + id));
    const issues = await page.evaluate(() => __check());
    const f = String(i + 1).padStart(2, '0') + '-' + id + '.png';
    await page.screenshot({ path: path.join(out, f), clip: { x: 0, y: 0, width: 960, height: 540 } });
    idx.push({ f, title, isNew, changed });
    if (issues.length) { bad += issues.length; console.log(id + ':\n  ' + [...new Set(issues)].slice(0, 12).join('\n  ')); }
  }
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(idx));
  if (errs.length) console.log('ERRORS:\n' + [...new Set(errs)].join('\n'));
  console.log('pass ' + P + ': ' + idx.length + ' pages, ' + bad + ' fit problems, ' + errs.length + ' errors');
  await b.close();
})();
