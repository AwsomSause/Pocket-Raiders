// Shared pieces for the Trade Stop styles: backdrop, sprites, display type, speed lines, screentone, confetti.
import Phaser from 'phaser';
import type { TradeOffer, TradeSide } from '../../core/trade/view';
import { pokemonVisual, trainerVisual } from '../sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { RowWidget, TradeCtx, TradeHooks } from './types';

export const W = GAME_WIDTH;
export const H = GAME_HEIGHT;
export const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

/** Big anime display type (system fonts; the pixel font stays for body text). */
export const DISPLAY_FONT = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
/** Japanese sound words and seals: whatever Japanese font the device has (Limited: none bundled). */
export const JP_FONT = '"Yu Gothic", "Hiragino Sans", "Meiryo", "Noto Sans JP", "Noto Sans CJK JP", "IPAGothic", sans-serif';

export const TYPE_HUE: Record<string, number> = {
  normal: 0xd8c8a0, fire: 0xff8a4a, water: 0x6aa0ff, electric: 0xf8d030, grass: 0x7ad070, ice: 0x98e0e8, fighting: 0xd05a48, poison: 0xb060c0, ground: 0xe0c070,
  flying: 0xa8b8f8, psychic: 0xff70a8, bug: 0xa8c030, rock: 0xc0a850, ghost: 0xa070d8, dragon: 0x7860f8, dark: 0x786050, steel: 0xb8b8d0, fairy: 0xf0a8d8,
};
export const hue = (s: TradeSide | null | undefined): number => TYPE_HUE[s?.types[0] ?? 'normal'] ?? 0xcccccc;

/** The stop's location art covering the screen (cropped, never stretched), with an optional tint. */
export function backdrop(ctx: TradeCtx, into: Phaser.GameObjects.Container, tint?: number): Phaser.GameObjects.Image | null {
  const { scene } = ctx;
  if (!scene.textures.exists(ctx.backdrop)) return null;
  const f = scene.textures.getFrame(ctx.backdrop);
  const img = scene.add.image(W / 2, H / 2, ctx.backdrop).setScale(Math.max(W / f.width, H / f.height));
  if (tint !== undefined) img.setTint(tint);
  into.add(img);
  return img;
}

type Sprite = Phaser.GameObjects.Sprite;

/** A Pokémon sprite, feet at (x, y). */
export function mon(ctx: TradeCtx, s: TradeSide, x: number, y: number, scale = 3, face: 'front' | 'back' = 'front', flip = false): Sprite {
  const v = pokemonVisual(ctx.scene, ctx.species(s.speciesId), face, x, y, scale) as unknown as Sprite;
  v.setOrigin?.(0.5, 1);
  if (flip) v.setFlipX?.(true);
  return v;
}

/** A trainer sprite, feet at (x, y). */
export function trainer(ctx: TradeCtx, art: string, x: number, y: number, scale = 2, flip = false): Sprite {
  const v = trainerVisual(ctx.scene, art, '', x, y, scale) as unknown as Sprite;
  v.setOrigin?.(0.5, 1);
  if (flip) v.setFlipX?.(true);
  return v;
}

/** Black-and-white for manga/ink looks (WebGL colour matrix; unchanged on canvas). */
export function grayscale(obj: Phaser.GameObjects.GameObject): void {
  const fx = (obj as Sprite).preFX;
  if (fx) {
    const m = fx.addColorMatrix();
    m.grayscale(1);
    m.contrast(0.4, true);
  }
}

/** Gentle idle bob (skipped when calm). */
export function bob(ctx: TradeCtx, obj: Phaser.GameObjects.GameObject & { y: number }, amount = 6, ms = 900): void {
  if (ctx.calm) return;
  ctx.scene.tweens.add({ targets: obj, y: obj.y - amount, duration: ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** Slide/pop an object in from an offset (instant when calm). */
export function enter(ctx: TradeCtx, obj: { x: number; y: number; alpha: number }, dx: number, dy = 0, delay = 0, ms = 420): void {
  if (ctx.calm) return;
  const { x, y, alpha } = obj;
  obj.x = x + dx;
  obj.y = y + dy;
  obj.alpha = 0;
  ctx.scene.tweens.add({ targets: obj, x, y, alpha, delay, duration: ms, ease: 'Back.easeOut' });
}

/** Big display text with an outline. */
export function display(ctx: TradeCtx, x: number, y: number, text: string, size: number, color: string, stroke = '#000000', thick = 6, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.GameObjects.Text {
  return ctx.scene.add.text(x, y, text, { fontFamily: DISPLAY_FONT, fontSize: `${size}px`, color, stroke, strokeThickness: thick, fontStyle: 'italic', ...extra });
}

/** Japanese sound word / seal. */
export function jp(ctx: TradeCtx, x: number, y: number, text: string, size: number, color: string, stroke = '#ffffff', thick = 6): Phaser.GameObjects.Text {
  return ctx.scene.add.text(x, y, text, { fontFamily: JP_FONT, fontSize: `${size}px`, color, stroke, strokeThickness: thick, fontStyle: 'bold' });
}

/** Body text in the game's pixel font. */
export function body(ctx: TradeCtx, x: number, y: number, text: string, size: number, color = '#ffffff', extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.GameObjects.Text {
  return ctx.scene.add.text(x, y, text, textStyle(size, color, extra));
}

/** Radial speed lines around (cx, cy). */
export function speedLines(g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number, alpha: number, count = 64, inner = 90, seed = 1): Phaser.GameObjects.Graphics {
  const rng = new Phaser.Math.RandomDataGenerator([String(seed)]);
  const R = Math.hypot(W, H);
  g.fillStyle(color, alpha);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rng.realInRange(-0.03, 0.03);
    const w = rng.realInRange(0.006, 0.02);
    const r0 = inner + rng.realInRange(0, 60);
    g.fillTriangle(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R, cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
  }
  return g;
}

/**
 * Halftone screentone dots over a rectangle, as a tiled texture (drawn once, cheap every frame).
 * Added to `into`; `mask` optionally clips it.
 */
export function tone(ctx: TradeCtx, into: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, color: number, alpha: number, step = 6, r = 1.2): Phaser.GameObjects.TileSprite {
  const { scene } = ctx;
  const key = `trade-tone-${step}-${r}`;
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics({}, false).fillStyle(0xffffff, 1);
    g.fillCircle(step / 4, step / 4, r).fillCircle(step / 4 + step / 2, step / 4 + step / 2, r);
    g.generateTexture(key, step, step);
    g.destroy();
  }
  const t = scene.add.tileSprite(x, y, w, h, key).setOrigin(0).setTint(color).setAlpha(alpha);
  into.add(t);
  return t;
}

/** Confetti/foil burst from (x, y) into `into` (skipped when calm). */
export function burst(ctx: TradeCtx, into: Phaser.GameObjects.Container, x: number, y: number, colors: number[], n = 36, spread = 320): void {
  if (ctx.calm) return;
  const { scene } = ctx;
  for (let i = 0; i < n; i++) {
    const p = scene.add.rectangle(x, y, Phaser.Math.Between(6, 12), Phaser.Math.Between(4, 8), colors[i % colors.length]!).setAngle(Phaser.Math.Between(0, 180));
    into.add(p);
    const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const d = Phaser.Math.FloatBetween(spread * 0.3, spread);
    scene.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 80, angle: p.angle + 360, alpha: 0, duration: Phaser.Math.Between(700, 1300), ease: 'Cubic.easeOut' });
  }
}

/** A white flash over the screen (skipped when calm). */
export function flash(ctx: TradeCtx, into: Phaser.GameObjects.Container, color = 0xffffff, ms = 260, delay = 0): void {
  if (ctx.calm) return;
  const r = ctx.scene.add.rectangle(0, 0, W, H, color, 0).setOrigin(0);
  into.add(r);
  ctx.scene.tweens.add({ targets: r, alpha: 0.95, duration: ms / 3, delay, yoyo: true, hold: ms / 3, onComplete: () => r.destroy() });
}

/** Hit zone that focuses on hover and picks on click. */
export function hit(ctx: TradeCtx, into: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, i: number, hooks: TradeHooks): void {
  const z = ctx.scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
  z.on('pointerover', () => hooks.focus(i));
  z.on('pointerdown', () => {
    hooks.focus(i);
    hooks.pick(i);
  });
  into.add(z);
}

/**
 * A generic option row: a graphics body redrawn on focus by `paint(g, on, locked)`, a title and a sub line.
 * Most styles use it with their own paint function.
 */
export function row(
  ctx: TradeCtx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: { title: string; sub: string; problem: string | null },
  i: number,
  hooks: TradeHooks,
  paint: (g: Phaser.GameObjects.Graphics, on: boolean, locked: boolean) => void,
  colors: { on: string; off: string; sub?: string; locked?: string },
  size = 18,
): RowWidget {
  const { scene } = ctx;
  const box = scene.add.container(x, y);
  const g = scene.add.graphics();
  const locked = Boolean(r.problem);
  const title = body(ctx, 14, h > 46 ? 6 : (h - size) / 2 - 2, r.title, size, colors.off, { wordWrap: { width: w - 24 } });
  const sub = body(ctx, 14, 30, locked ? r.problem! : r.sub, 13, colors.sub ?? colors.off, { wordWrap: { width: w - 24 } }).setVisible(h > 46);
  box.add([g, title, sub]);
  ctx.layers.list.add(box);
  hit(ctx, box, 0, 0, w, h, i, hooks);
  const set = (on: boolean) => {
    g.clear();
    paint(g, on, locked);
    title.setColor(locked ? (colors.locked ?? '#8a8a96') : on ? colors.on : colors.off);
    sub.setColor(locked ? (colors.locked ?? '#8a8a96') : colors.sub ?? (on ? colors.on : colors.off));
    if (on && !ctx.calm) scene.tweens.add({ targets: box, scale: { from: 1.04, to: 1 }, duration: 180, ease: 'Back.easeOut' });
  };
  set(false);
  return { focus: set };
}

/** The money/place tag most styles show. */
export function moneyText(ctx: TradeCtx): string {
  return `${ctx.view.place}  ·  ₽${ctx.view.money}`;
}

/** "Squirtle Lv14" */
export const label = (s: TradeSide): string => `${s.name} Lv${s.level}`;

/** The line under a moment: what happened. */
export function momentLine(o: TradeOffer & { give: TradeSide }): string {
  return `${o.give.name} was traded for ${o.get.name}! ${o.get.name} joined at Lv${o.get.level}.`;
}
