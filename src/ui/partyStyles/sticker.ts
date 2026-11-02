// Sticker Team: a deep purple sticker-book page with confetti; each row is a thick-outlined die-cut sticker.
import { windowFace, dots } from './common';
import type { PartySkin } from './types';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const sticker: PartySkin = {
  shape: 'pill',
  palette: { row: 0x5a2a8a, rowAlpha: 0.95, rowFocus: 0xc83a9a, rowRim: 0xffffff, focusRim: 0xfff060, tab: 0x4a2478, tabActive: 0xc83a9a, pane: 0x32184e, paneRim: 0xffffff },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(0xffd8ec, 1).fillRect(36, 76, 888, 380);
    for (let y = 76; y < 456; y += 32) for (let x = 36; x < 924; x += 32) if (((x - 36) / 32 + (y - 76) / 32) % 2 === 0) g.fillStyle(0xffffff, 0.55).fillRect(x, y, 32, 32);
    into.add(g);
    mons.forEach((m, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 180 + col * 300;
      const y = 80 + row * 190;
      const on = i === sel;
      const c = scene.add.container(x, y + 90);
      c.setAngle(((i * 7) % 5) - 2);
      const sg = scene.add.graphics();
      sg.fillStyle(0xffffff, 1).fillRoundedRect(-120, -86, 240, 172, 34).lineStyle(on ? 5 : 3, on ? 0xe03088 : 0xf090c0, 1).strokeRoundedRect(-120, -86, 240, 172, 34);
      sg.fillStyle(m.state === 'down' ? 0xcccccc : typeColor(m), 0.18).fillRoundedRect(-112, -78, 224, 156, 28);
      c.add(sg);
      sprite(c, m, 0, 36, on ? 1.5 : 1.25, ctx);
      text(c, 0, 44, `${m.name}  Lv${m.level}`, 14, '#8a2a5a', { origin: [0.5, 0], w: 200 });
      bar(c, -80, 66, 160, 8, frac(m), 0xf0c8dc);
      into.add(c);
      pop(ctx, c, i);
      if (on && ctx.motion === 'full') scene.tweens.add({ targets: c, scale: { from: 1, to: 1.04 }, duration: 500, yoyo: true, repeat: -1 });
      hit(ctx, x - 120, y + 4, 240, 172, i);
    });
  },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x2a1444, rim: 0xffffff, band: 0x7a34b8, bandRim: 0xffffff, radius: 26 });
    dots(scene, root, 0xff80d0, 0.18, 34, 4);
    const star = scene.add.text(900, 52, '★', { fontSize: '30px', color: '#fff060' }).setOrigin(0.5);
    root.add(star);
    if (motion === 'full') scene.tweens.add({ targets: star, angle: 20, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
};
