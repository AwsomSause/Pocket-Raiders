// 12 Spotlight Stage: a dark stage with a light cone on the detail area; the waiting Pokémon fade into the shadows.
import { GAME_HEIGHT } from '../theme';
import { windowFace } from './common';
import type { PartySkin } from './types';
import { stageOverview, bodyFrames } from './overviews';
import { bar, frac, hit, icon, moves, pop, sprite, stats, text, typeColor } from './kit';

export const spotlight: PartySkin = {
  shape: 'pill',
  frame: bodyFrames.spotlight,
  overview: stageOverview({ disc: 0x2a2a3a, beam: 0xfff0c0, ink: '#d0e4f4', label: '#ffd070' }),
  tabs: { underline: true, gap: 6 },
  dimRows: true,
  palette: { row: 0x14141c, rowAlpha: 0.7, rowFocus: 0x40407a, rowRim: 0x5a5a7a, focusRim: 0xfff2b0, tab: 0x14141c, tabActive: 0x40407a, pane: 0x0c0c14, paneRim: 0x6a6a8a },
  roster(ctx) {
    const { scene, into, mons, sel } = ctx;
    const m = mons[sel]!;
    const g = scene.add.graphics();
    g.fillStyle(0xfff0c0, 0.12).fillTriangle(480, 78, 330, 400, 630, 400).fillStyle(0xfff0c0, 0.2).fillEllipse(480, 400, 320, 40);
    g.fillStyle(0x10142a, 0.8).fillRoundedRect(48, 150, 190, 150, 10).lineStyle(2, 0x6a7aa8, 1).strokeRoundedRect(48, 150, 190, 150, 10).fillRoundedRect(722, 150, 190, 130, 10).strokeRoundedRect(722, 150, 190, 130, 10);
    into.add(g);
    text(into, 480, 82, m.name, 24, '#ffffff', { origin: [0.5, 0] });
    text(into, 480, 110, `Lv${m.level} / ${m.types.join(' / ')} / ${m.nature}`, 13, '#c8d0f0', { origin: [0.5, 0], w: 420 });
    sprite(into, m, 480, 392, 3, ctx);
    stats(into, m, 58, 160, 170, '#e8f0ff', 21);
    moves(into, m, 732, 160, 170, '#e8f0ff', 28);
    mons.forEach((o, i) => {
      if (i === sel) return;
      const k = i < sel ? i : i - 1;
      const x = 150 + k * 140;
      const c = scene.add.container(x, 0);
      c.setAlpha(0.55);
      sprite(c, o, 0, 440, 1.1);
      into.add(c);
      pop(ctx, c, i);
      hit(ctx, x - 60, 380, 120, 76, i);
    });
    text(into, 480, 440, '◀ previous   ▶ next: the next Pokémon walks into the spotlight', 12, '#a8b0d0', { origin: [0.5, 0] });
  },
  chrome(scene, root, motion) {
    windowFace(scene, root, { fill: 0x08080e, rim: 0x6a6a8a, band: 0x181828, bandRim: 0x8a8aaa });
    const g = scene.add.graphics().setBlendMode('ADD');
    g.fillStyle(0xfff0c0, 0.09).fillTriangle(640, 70, 330, GAME_HEIGHT - 80, 930, GAME_HEIGHT - 80);
    g.fillStyle(0xfff0c0, 0.08).fillEllipse(630, GAME_HEIGHT - 88, 560, 46);
    root.add(g);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.65, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
};
