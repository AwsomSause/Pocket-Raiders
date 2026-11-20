// Records a tour of one pass as a video (every clip once, with a caption bar). node record.cjs <pass> <out.mp4> [id,id]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
(async () => {
  const P = +process.argv[2], out = process.argv[3], only = process.argv[4], root = path.resolve(__dirname, '..'), tmp = fs.mkdtempSync('/tmp/anim-rec-');
  const types = { html: 'text/html', png: 'image/png' };
  const srv = require('http').createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': types[f.split('.').pop()] || 'application/octet-stream' }); r.end(d); }); });
  await new Promise(ok => srv.listen(0, ok));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 960, height: 584 }, recordVideo: { dir: tmp, size: { width: 960, height: 584 } } }); const page = await ctx.newPage();
  await page.goto('http://localhost:' + srv.address().port + '/index.html?bare&cap&tour&pass=' + P + (only ? '&only=' + only : ''));
  await page.waitForFunction(() => document.title === 'tour-done', null, { timeout: 900000 });
  await ctx.close(); await b.close(); srv.close();
  const webm = path.join(tmp, fs.readdirSync(tmp).find(f => f.endsWith('.webm')));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', out]);
  console.log('video', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
})();
