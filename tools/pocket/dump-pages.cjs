// Writes the final HTML of every UI-redesign mock-up page at Kice's picks, one file per page, for porting to src/ui/pocket.
// node tools/pocket/dump-pages.cjs <out-dir>     (build the mock-up page first: python3 plans/ui-redesign/src/build.py)
// Picks: pages that exist at the Final Cut (slider 26) are taken there (Title keeps pass 17, Pause pass 24 through
// their own `as` lock); pages added by the new-areas round are taken at slider 51. index.json lists id, group, title, tier.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2];
  if (!out) throw new Error('usage: node tools/pocket/dump-pages.cjs <out-dir>');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const url = 'file://' + path.resolve('plans/ui-redesign/index.html') + '?bare&still&pass=';
  const index = [];
  const seen = new Set();
  for (const P of [26, 51]) {
    await p.goto(url + P);
    const list = await p.evaluate((P) => screensAt(P).map((s) => ({ id: s.id, g: s.meta.g, t: s.meta.t, as: s.meta.as || P })), P);
    for (const s of list) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      const html = await p.evaluate((id) => { paint(id); return document.querySelector('#stage').innerHTML; }, s.id);
      fs.writeFileSync(path.join(out, s.id + '.html'), html);
      index.push({ id: s.id, group: s.g, title: s.t, tier: s.as, bytes: html.length });
    }
  }
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 1));
  console.log(index.length + ' pages written to ' + out);
  await b.close();
})();
