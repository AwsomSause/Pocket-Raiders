// Records a click-through of one pass as a video. Usage: node src/tour.cjs <pass> <out.mp4> <id,id,...> [liv]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const R = path.dirname(__dirname);
(async () => {
  const pass = +process.argv[2], out = process.argv[3], ids = process.argv[4].split(','), liv = process.argv[5] || '';
  const tmp = fs.mkdtempSync('/tmp/tour-'); const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: tmp, size: { width: 1280, height: 720 } } }); const pg = await ctx.newPage();
  await pg.goto('file://' + R + `/index.html?pass=${pass}&shot=1&s=${ids[0]}${liv ? '&liv=' + liv : ''}`); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(1500);
  for (const id of ids.slice(1)) { await pg.evaluate(i => window.__mock.go(i), id); await pg.waitForTimeout(1900) }
  await ctx.close(); await b.close(); const webm = fs.readdirSync(tmp).find(f => f.endsWith('.webm'));
  execSync(`ffmpeg -y -loglevel error -i ${tmp}/${webm} -c:v libx264 -pix_fmt yuv420p -crf 26 -movflags +faststart "${out}"`); console.log(out, Math.round(fs.statSync(out).size / 1024) + ' KB');
})();
