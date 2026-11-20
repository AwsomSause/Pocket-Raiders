// Sprite check: finds Pokémon and trainer sprites that are cut off or covered.
// node plans/ui-redesign/src/sprites.cjs <pass> [only,ids] [minVisible%=90]
// For every sprite it compares three small screenshots: the page as it is, the page with
// the sprite hidden, and the page with a copy of the sprite drawn on top of everything.
// The player's own back sprite may sit behind the bottom bar as in the main battle screen (60% is enough there).
// visible% = pixels the sprite really shows / pixels it would show if nothing covered it.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const P = +process.argv[2], only = process.argv[3] && process.argv[3] !== '-' ? process.argv[3].split(',') : null, MIN = +(process.argv[4] || 85);
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const cmp = await b.newPage(); await cmp.setContent('<canvas id="c"></canvas>');
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?bare&still&pass=' + P);
  await page.evaluate(() => document.fonts.ready);
  const list = await page.evaluate(P => screensAt(P).map(s => s.id), P);
  const diff = (x, y) => cmp.evaluate(async ([x, y]) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [a, b] = await Promise.all([load(x), load(y)]); const c = document.getElementById('c'); c.width = a.width; c.height = a.height;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(a, 0, 0); const d1 = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(b, 0, 0); const d2 = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]) > 6) n++;
    return n;
  }, [x, y]);
  let bad = 0, pages = 0, total = 0;
  for (const id of list) {
    if (only && !only.includes(id)) continue; pages++;
    await page.evaluate(id => paint(id), id);
    await page.waitForFunction(() => [...document.images].every(im => im.complete), null, { timeout: 5000 }).catch(() => {});
    const sprites = await page.evaluate(() => {
      const st = document.querySelector('#stage'), S = st.getBoundingClientRect(); window.__sp = [];
      return [...st.querySelectorAll('img')].filter(im => /sprites\/(m|mb|t)-/.test(im.getAttribute('src') || '')).map(im => {
        let op = 1; for (let a = im; a && a !== st.parentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.visibility === 'hidden' || cs.display === 'none') op = 0; op *= +cs.opacity; }
        const r = im.getBoundingClientRect(); if (op < .5 || r.width < 30 || r.height < 30) return null;
        if (im.closest('.ar-me,.ar-foe') && (im.closest('.ov16') || im.closest('.scr').querySelector('.ar-bg.dim,.aceband'))) return null; /* a menu laid over the dimmed battle on purpose */
        const ix = Math.max(0, Math.min(r.right, S.right) - Math.max(r.left, S.left)), iy = Math.max(0, Math.min(r.bottom, S.bottom) - Math.max(r.top, S.top));
        window.__sp.push(im);
        return { i: window.__sp.length - 1, src: im.getAttribute('src').replace('sprites/', '').replace('.png', ''), x: r.left, y: r.top, w: r.width, h: r.height, inside: ix * iy / (r.width * r.height), sx: S.left, sy: S.top, sr: S.right, sb: S.bottom };
      }).filter(Boolean);
    });
    const out = [];
    for (const s of sprites) {
      total++;
      const x = Math.max(s.x, s.sx), y = Math.max(s.y, s.sy), w = Math.min(s.x + s.w, s.sr) - x, h = Math.min(s.y + s.h, s.sb) - y;
      if (w < 4 || h < 4) { out.push(s.src + ' is off the screen'); continue; }
      const clip = { x: Math.floor(x), y: Math.floor(y), width: Math.ceil(w), height: Math.ceil(h) };
      const A = (await page.screenshot({ clip })).toString('base64');
      await page.evaluate(i => { const im = window.__sp[i]; im.dataset.v = im.style.visibility; im.style.visibility = 'hidden'; }, s.i);
      const B = (await page.screenshot({ clip })).toString('base64');
      await page.evaluate(i => { const im = window.__sp[i], r = im.getBoundingClientRect(), cs = getComputedStyle(im), c = im.cloneNode(); c.id = '__clone'; c.removeAttribute('class');
        const m = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform); let flip = m.a < 0 ? ' scaleX(-1)' : '';
        for (let a = im.parentElement; a && a.id !== 'stage'; a = a.parentElement) { const t = getComputedStyle(a).transform; if (t !== 'none' && new DOMMatrixReadOnly(t).a < 0) flip = flip ? '' : ' scaleX(-1)'; }
        let L = r.left, T = r.top, Wd = r.width, Ht = r.height, rot = cs.rotate && cs.rotate !== 'none' ? cs.rotate : '';
        if (rot) { Wd = im.offsetWidth * Math.abs(m.a || 1); Ht = im.offsetHeight * Math.abs(m.d || 1); L = r.left + r.width / 2 - Wd / 2; T = r.top + r.height / 2 - Ht / 2; } /* a tilted sprite: its box is bigger than the picture */
        c.style.cssText = `position:fixed;left:${L}px;top:${T}px;width:${Wd}px;height:${Ht}px;rotate:${rot || 'none'};z-index:2147483647;image-rendering:pixelated;margin:0;max-width:none;object-fit:${cs.objectFit};object-position:${cs.objectPosition};filter:${cs.filter};transform:${flip || 'none'};visibility:visible;opacity:1`;
        document.body.appendChild(c); }, s.i);
      const C = (await page.screenshot({ clip })).toString('base64');
      await page.evaluate(i => { document.getElementById('__clone').remove(); const im = window.__sp[i]; im.style.visibility = im.dataset.v || ''; }, s.i);
      const vis = await diff(A, B), full = await diff(C, B); if (full < 40) continue;
      const pct = Math.round(100 * Math.min(1, vis / full) * s.inside);
      if (pct < (/^mb-/.test(s.src) ? Math.min(MIN, 60) : MIN)) out.push(s.src + ' ' + pct + '% visible' + (s.inside < .97 ? ' (' + Math.round(100 * (1 - s.inside)) + '% off the screen)' : '') + ' at ' + Math.round(s.x - s.sx) + ',' + Math.round(s.y - s.sy));
    }
    if (out.length) { bad += out.length; console.log(id + ':\n  ' + out.join('\n  ')); }
  }
  console.log('pass ' + P + ': ' + pages + ' pages, ' + total + ' sprites checked, ' + bad + ' cut off or covered (under ' + MIN + '% visible)');
  await b.close();
})();
