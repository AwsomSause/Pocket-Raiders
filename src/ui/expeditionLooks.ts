// Expedition screen looks (screens redesign group E): Aero Layers (glass bubbles + a loot bar), Manga Dungeon
// (one big panel with a speech bubble and caption boxes) and Depth Scan (neon layer rows + a loot cache box).
// ExpeditionScene keeps the data and the choices; this only draws and says where the choice menu goes.
// Presentation only: no rules, no gameplay RNG.
import Phaser from 'phaser';
import { availableNodes } from '../core/expedition/flow';
import type { ExpeditionState } from '../core/state';
import { fitLine } from './fitText';
import { GAME_HEIGHT as H, GAME_WIDTH as W, textStyle } from './theme';

export type ExpeditionLook = 'aero' | 'manga' | 'depth';

export interface ExpeditionLookData {
  exp: ExpeditionState;
  name: string;
  tier: number;
  loot: string;
  party: string;
  prompt: string;
}

export interface ExpeditionLayout {
  menu: { x: number; y: number; columns: number; itemWidth: number; itemHeight: number };
  /** Where the "Choose your next stop" line goes. */
  promptAt: { x: number; y: number; originX: number };
  /** Text colour for the menu rows and prompt. */
  ink: string;
  promptColor: string;
}

const NODE_COLOR: Record<string, number> = {
  wild: 0x58a858, trainer: 0xc85858, elite: 0xa040c0, rest: 0xe06890, cache: 0xd0a030, research: 0x4890d0,
  mystery: 0x9070c0, recruit: 0x30b0a0, megaEnergy: 0xf0c020, totem: 0xe8a020, raid: 0xd04040, finale: 0xf08020,
};

const layerCount = (exp: ExpeditionState): number => Math.max(...exp.nodes.map((n) => n.layer)) + 1;
const layerNow = (exp: ExpeditionState): number => (exp.current ? exp.nodes.find((n) => n.id === exp.current)!.layer + 1 : 0);

export function drawExpeditionLook(scene: Phaser.Scene, look: ExpeditionLook, d: ExpeditionLookData): ExpeditionLayout {
  if (look === 'aero') return aero(scene, d);
  if (look === 'manga') return manga(scene, d);
  return depth(scene, d);
}

function route(scene: Phaser.Scene, exp: ExpeditionState, box: { x0: number; x1: number; yc: number; dy: number }, draw: (g: Phaser.GameObjects.Graphics, x: number, y: number, state: 'done' | 'lit' | 'far', color: number) => void): void {
  const layers = layerCount(exp);
  const pos = new Map<string, { x: number; y: number }>();
  for (let l = 0; l < layers; l++) {
    const col = exp.nodes.filter((n) => n.layer === l);
    col.forEach((n, i) => pos.set(n.id, { x: box.x0 + (l * (box.x1 - box.x0)) / Math.max(1, layers - 1), y: box.yc + (i - (col.length - 1) / 2) * box.dy }));
  }
  const g = scene.add.graphics();
  const lit = new Set(exp.status === 'route' ? availableNodes(exp).map((n) => n.id) : []);
  for (const n of exp.nodes) {
    const a = pos.get(n.id)!;
    for (const nx of n.next) {
      const b = pos.get(nx)!;
      g.lineStyle(3, 0xffffff, n.done || exp.current === n.id ? 0.85 : 0.3);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
  }
  for (const n of exp.nodes) {
    const p = pos.get(n.id)!;
    const state = n.done ? 'done' : lit.has(n.id) || n.id === exp.node ? 'lit' : 'far';
    draw(g, p.x, p.y, state, n.blocked ? 0x503030 : NODE_COLOR[n.kind] ?? 0x888888);
    const glyph = n.blocked ? '✗' : n.done ? '✓' : (n.kind[0] ?? '·').toUpperCase();
    scene.add.text(p.x, p.y, glyph, textStyle(16, '#ffffff')).setOrigin(0.5);
  }
}

function aero(scene: Phaser.Scene, d: ExpeditionLookData): ExpeditionLayout {
  scene.add.text(24, 12, d.name, textStyle(30, '#ffffff')).setShadow(0, 2, '#1c6a9c', 4, false, true);
  fitLine(scene.add.text(24, 48, `Tier ${d.tier} · ${layerCount(d.exp)} layers · extract any time`, textStyle(14, '#0a3c66')), W - 48, 11);
  route(scene, d.exp, { x0: 80, x1: W - 80, yc: 160, dy: 78 }, (g, x, y, state, color) => {
    const r = state === 'lit' ? 30 : 26;
    if (state === 'lit') g.fillStyle(0xffe060, 0.35).fillCircle(x, y, r + 8);
    g.fillStyle(state === 'lit' ? 0xffd040 : color, state === 'done' ? 0.4 : state === 'lit' ? 1 : 0.55).fillCircle(x, y, r);
    g.fillStyle(0xffffff, 0.45).fillEllipse(x - r * 0.3, y - r * 0.4, r * 0.8, r * 0.45);
    g.lineStyle(state === 'lit' ? 5 : 3, 0xffffff, state === 'far' ? 0.6 : 1).strokeCircle(x, y, r);
  });
  // Glass loot-and-risk bar at the bottom.
  const bar = scene.add.graphics();
  bar.fillStyle(0xffffff, 0.8).fillRoundedRect(24, 452, W - 48, 62, 28);
  bar.fillStyle(0x9fd8f0, 0.45).fillRoundedRect(24, 484, W - 48, 30, { tl: 0, tr: 0, bl: 28, br: 28 });
  bar.lineStyle(2, 0xffffff, 1).strokeRoundedRect(24, 452, W - 48, 62, 28);
  fitLine(scene.add.text(44, 460, d.loot, textStyle(15, '#0a3c66')), W - 88, 11);
  fitLine(scene.add.text(44, 486, d.party, textStyle(13, '#2c5c86')), W - 88, 10);
  return { menu: { x: 40, y: 322, columns: 2, itemWidth: 440, itemHeight: 40 }, promptAt: { x: W / 2, y: 298, originX: 0.5 }, ink: '#0a3c66', promptColor: '#0a3c66' };
}

function manga(scene: Phaser.Scene, d: ExpeditionLookData): ExpeditionLayout {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 1).fillRect(20, 20, W - 40, 250);
  g.lineStyle(4, 0xffffff, 1).strokeRect(24, 24, W - 48, 242);
  route(scene, d.exp, { x0: 90, x1: W - 90, yc: 175, dy: 62 }, (gg, x, y, state) => {
    gg.fillStyle(state === 'lit' ? 0xffffff : 0x3a3a40, state === 'done' ? 0.5 : 1).fillRect(x - 17, y - 17, 34, 34);
    gg.lineStyle(3, 0xffffff, state === 'far' ? 0.5 : 1).strokeRect(x - 17, y - 17, 34, 34);
  });
  // Speech bubble.
  const line = `Layer ${Math.max(1, layerNow(d.exp))} of ${layerCount(d.exp)}... ${d.exp.status === 'route' ? 'the cave goes deeper!' : 'what now?'}`;
  const t = scene.add.text(0, 0, line, textStyle(15, '#000000'));
  const bw = Math.min(W - 120, t.width + 40);
  g.fillStyle(0xffffff, 1).fillEllipse(W / 2, 62, bw, 42);
  t.setPosition(W / 2 - t.width / 2, 62 - t.height / 2);
  scene.add.text(40, 30, d.name, textStyle(14, '#e8e8e8'));
  // Caption boxes, loot with a red offset shadow.
  const cap = (x: number, w: number, label: string, shadow: boolean): void => {
    if (shadow) g.fillStyle(0xe8323c, 1).fillRect(x + 10, 286 + 10, w, 50);
    g.fillStyle(0xffffff, 1).fillRect(x, 286, w, 50);
    g.lineStyle(4, 0x000000, 1).strokeRect(x, 286, w, 50);
    fitLine(scene.add.text(x + 14, 300, label, textStyle(15, '#000000')), w - 28, 10);
  };
  cap(20, 450, `LOOT: ${d.loot.replace(/^Loot:\s*/, '')}`, true);
  cap(490, 450, `PARTY: ${d.party}`, false);
  return { menu: { x: 20, y: 388, columns: 2, itemWidth: 450, itemHeight: 40 }, promptAt: { x: 20, y: 364, originX: 0 }, ink: '#000000', promptColor: '#000000' };
}

function depth(scene: Phaser.Scene, d: ExpeditionLookData): ExpeditionLayout {
  const cyan = 0x4ae0ff;
  const pink = 0xff40e0;
  scene.add.text(24, 14, '// EXPEDITION DEPTH SCAN', textStyle(24, '#4ae0ff'));
  scene.add.text(24, 46, `LAYER ${Math.max(1, layerNow(d.exp))} / ${layerCount(d.exp)}`, textStyle(13, '#ff40e0'));
  const layers = layerCount(d.exp);
  const now = layerNow(d.exp);
  const rowH = Math.min(46, Math.floor(430 / layers));
  const g = scene.add.graphics();
  for (let l = 0; l < layers; l++) {
    const y = 84 + l * (rowH + 8);
    const here = l + 1 === now;
    const boss = d.exp.nodes.some((n) => n.layer === l && n.kind === 'finale');
    g.lineStyle(here ? 4 : 2, here ? pink : cyan, 0.25).strokeRect(22, y - 2, 576, rowH + 4);
    g.lineStyle(2, here ? pink : cyan, 1).strokeRect(24, y, 572, rowH);
    const state = l + 1 < now ? 'CLEARED' : here ? 'YOU ARE HERE' : boss ? 'BOSS' : 'UNKNOWN';
    scene.add.text(40, y + rowH / 2, `LAYER ${l + 1} · ${state}`, textStyle(15, '#e8fbff')).setOrigin(0, 0.5);
  }
  // Loot cache box on the right.
  g.lineStyle(4, cyan, 0.25).strokeRect(618, 84, 322, 150);
  g.lineStyle(2, cyan, 1).strokeRect(620, 86, 318, 146);
  scene.add.text(634, 96, 'LOOT CACHE', textStyle(14, '#e8fbff'));
  const lootBody = scene.add.text(634, 120, d.loot.replace(/^Loot:\s*/, '').replace(/,\s*/g, '\n').replace(/\s+·\s+/g, '\n'), textStyle(13, '#e8fbff', { wordWrap: { width: 290 } }));
  if (lootBody.height > 100) lootBody.setScale(100 / lootBody.height);
  fitLine(scene.add.text(24, H - 44, d.party, textStyle(12, '#4a90a8')), W - 48, 9);
  return { menu: { x: 620, y: 272, columns: 1, itemWidth: 318, itemHeight: 38 }, promptAt: { x: 620, y: 246, originX: 0 }, ink: '#e8fbff', promptColor: '#ff40e0' };
}
