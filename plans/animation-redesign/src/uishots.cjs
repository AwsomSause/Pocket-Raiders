/* Photographs pages of the UI redesign (plans/ui-redesign) so the animation mockups can move the real pass-25 screens.
   node uishots.cjs <pass> <id[=name][:css selectors to hide, | separated]> ...   -> sprites/u-<name>.png, and prints the boxes of each page's parts */
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [P, ...ids] = process.argv.slice(2), b = await chromium.launch(), page = await b.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('file://' + path.resolve(__dirname, '../../ui-redesign/index.html') + '?bare&still&pass=' + P); await page.evaluate(() => document.fonts.ready);
  for (const spec of ids) {
    const [idn, hide] = spec.split(':'), [id, name] = idn.split('=');
    await page.evaluate(([id, d]) => { window.__depth = d; paint(id); }, [id, +(process.env.DEPTH || 2)]); await page.waitForTimeout(500);
    const rects = await page.evaluate(hide => {
      const st = document.createElement('style'); st.textContent = '.tl{visibility:hidden!important}*{animation-play-state:paused!important;caret-color:transparent}' + (hide ? hide.split('|').map(s => s + '{visibility:hidden!important}').join('') : ''); document.head.appendChild(st);
      const scr = document.querySelector('.scr'), o = scr.getBoundingClientRect(), out = [];
      const walk = (el, d) => { for (const c of el.children) { const r = c.getBoundingClientRect(); if (r.width < 50 || r.height < 20) continue; out.push('  '.repeat(d) + c.tagName.toLowerCase() + (c.className && c.className.baseVal === undefined ? '.' + String(c.className).trim().replace(/\s+/g, '.') : '') + ' ' + [r.left - o.left, r.top - o.top, r.width, r.height].map(Math.round).join(',')); if (d < (window.__depth ?? 2)) walk(c, d + 1); } };
      walk(scr, 0); return out;
    }, hide);
    await page.screenshot({ path: path.resolve(__dirname, '../sprites/u-' + (name || id) + '.png'), clip: { x: 0, y: 0, width: 960, height: 540 } });
    console.log('# ' + (name || id) + '\n' + rects.join('\n'));
    await page.evaluate(() => document.head.lastChild.remove());
  }
  await b.close();
})();
