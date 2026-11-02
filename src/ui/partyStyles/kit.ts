// Drawing helpers shared by the party rosters.
import Phaser from 'phaser';
import { pokemonIcon, pokemonVisual } from '../sprites';
import { fitLine } from '../fitText';
import { TYPE_COLORS, textStyle } from '../theme';
import type { RosterCtx, RosterMon } from './types';

export const hpColor = (f: number): number => (f > 0.5 ? 0x48d868 : f > 0.2 ? 0xf0c030 : 0xe04848);

export function text(c: Phaser.GameObjects.Container, x: number, y: number, s: string, size: number, color: string, o: { w?: number; origin?: [number, number]; extra?: Phaser.Types.GameObjects.Text.TextStyle } = {}): Phaser.GameObjects.Text {
  const t = c.scene.add.text(x, y, s, textStyle(size, color, o.extra)).setOrigin(...(o.origin ?? [0, 0]));
  if (o.w) fitLine(t, o.w);
  c.add(t);
  return t;
}

export function bar(c: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, f: number, back = 0x1a2430): void {
  const g = c.scene.add.graphics();
  g.fillStyle(back, 0.85).fillRoundedRect(x, y, w, h, h / 2);
  if (f > 0) g.fillStyle(hpColor(f), 1).fillRoundedRect(x, y, Math.max(h, w * f), h, h / 2);
  c.add(g);
}

export const frac = (m: RosterMon): number => (m.maxHp > 0 ? m.hp / m.maxHp : 0);
export const typeColor = (m: RosterMon): number => TYPE_COLORS[m.types[0] ?? 'normal'] ?? 0x888888;

export function icon(c: Phaser.GameObjects.Container, m: RosterMon, x: number, y: number, scale: number): Phaser.GameObjects.GameObject {
  const i = pokemonIcon(c.scene, m.species, x, y, scale);
  c.add(i);
  return i;
}

/** The big front sprite (lazy-loaded; a placeholder shows until the art arrives), standing with its feet at (x, y). */
export function sprite(c: Phaser.GameObjects.Container, m: RosterMon, x: number, y: number, scale: number, ctx?: RosterCtx): Phaser.GameObjects.Container {
  const v = pokemonVisual(c.scene, m.species, 'front', x, y, scale, m.shiny) as unknown as Phaser.GameObjects.Container;
  c.add(v);
  if (ctx && ctx.motion === 'full') c.scene.tweens.add({ targets: v, y: y - 5, duration: 700 + (m.index % 3) * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return v;
}

export function hit(ctx: RosterCtx, x: number, y: number, w: number, h: number, i: number): void {
  const z = ctx.scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
  z.on('pointerdown', () => (ctx.sel === i ? ctx.open(i) : ctx.select(i)));
  ctx.into.add(z);
}

export function pop(ctx: RosterCtx, target: Phaser.GameObjects.GameObject & { y: number; alpha: number }, i: number): void {
  if (!ctx.first || ctx.motion === 'off') return;
  const y = target.y;
  target.y += 26;
  target.alpha = 0;
  ctx.scene.tweens.add({ targets: target, y, alpha: 1, duration: ctx.motion === 'full' ? 340 : 120, delay: ctx.motion === 'full' ? i * 60 : 0, ease: 'Back.easeOut' });
}

export function stats(c: Phaser.GameObjects.Container, m: RosterMon, x: number, y: number, w: number, color = '#e8f6ff', step = 18): void {
  m.stats.forEach((s, i) => {
    text(c, x, y + i * step, s.label.replace('Sp. ', 'Sp'), 12, color);
    const g = c.scene.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(x + 56, y + i * step + 3, w - 100, 8, 4).fillStyle(i === 0 ? 0x48d868 : 0xf0a040, 1).fillRoundedRect(x + 56, y + i * step + 3, Math.max(6, (w - 100) * Math.min(1, s.value / 200)), 8, 4);
    c.add(g);
    text(c, x + w - 38, y + i * step, String(s.value), 12, color);
  });
}

export function moves(c: Phaser.GameObjects.Container, m: RosterMon, x: number, y: number, w: number, color = '#e8f6ff', step = 22): void {
  m.moves.slice(0, 4).forEach((mv, i) => {
    const g = c.scene.add.graphics();
    g.fillStyle(TYPE_COLORS[mv.type] ?? 0x888888, 1).fillCircle(x + 6, y + i * step + 9, 5);
    c.add(g);
    text(c, x + 18, y + i * step, mv.name, 13, color, { w: w - 90 });
    text(c, x + w, y + i * step, `PP ${mv.pp}`, 12, color, { origin: [1, 0] });
  });
}
