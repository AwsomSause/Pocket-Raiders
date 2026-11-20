// One or more exact moments of one clip. node snap.cjs <pass> <clip> <t,t,...> <out prefix>   (several times are laid side by side)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
(async () => {
  const [P, id, ts, out] = [+process.argv[2], process.argv[3], process.argv[4].split(',').map(Number), process.argv[5]], root = path.resolve(__dirname, '..');
  const srv = require('http').createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]); fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': u.endsWith('png') ? 'image/png' : 'text/html' }); r.end(d); }); });
  await new Promise(ok => srv.listen(0, ok));
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://localhost:' + srv.address().port + '/index.html?bare&still&pass=' + P + '&c=' + id); await page.evaluate(() => document.fonts.ready); await page.waitForLoadState('networkidle');
  const fs2 = [];
  for (const t of ts) { await page.evaluate(t => __seek(t), t); const f = out + '-' + t + '.png'; await page.screenshot({ path: f }); fs2.push(f); }
  await b.close(); srv.close();
  if (fs2.length > 1) { execFileSync('python3', ['-c', `
from PIL import Image
import sys
ims=[Image.open(f).resize((640,360)) for f in sys.argv[2:]]
cols=min(3,len(ims)); rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(cols*644,rows*364),'#12141b')
for i,im in enumerate(ims): s.paste(im,((i%cols)*644,(i//cols)*364))
s.save(sys.argv[1],quality=85)`, out + '.jpg', ...fs2]); console.log(out + '.jpg'); }
})();
