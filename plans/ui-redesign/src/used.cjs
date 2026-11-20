// Lists the sprite files the page really uses (for publishing). node used.cjs > list
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  const used = new Set(); page.on('request', r => { const m = r.url().match(/sprites\/([^?]+\.png)/); if (m) used.add('sprites/' + m[1]); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?bare&still');
  const max = await page.evaluate(() => PR.maxPass);
  for (let P = 1; P <= max; P++) { const ids = await page.evaluate(P => { PR.P = P; for (const s of document.querySelectorAll('style[data-pass]')) s.media = (+s.dataset.pass <= P) ? 'all' : 'not all'; return screensAt(P).map(s => s.id); }, P);
    for (const id of ids) { await page.evaluate(id => paint(id), id); await page.waitForTimeout(30); } }
  await page.waitForTimeout(300); console.log(JSON.stringify([...used].sort())); await b.close();
})();
