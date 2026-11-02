// Overview pages for the party looks (Screens redesign Group B follow-up): the same facts as the plain Overview tab,
// laid out like the look's mock-up. A page only paints; the screen keeps all state and input.
import Phaser from 'phaser';
import { bar, frac, sprite, text, typeColor } from './kit';
import type { OverviewCtx } from './types';

const READY_COLOR = { ready: '#9af0a8', caution: '#ffe08a', down: '#ff9a9a' } as const;

/** The facts every layout shows, as label/value lines. */
function facts(ctx: OverviewCtx): [string, string][] {
  const m = ctx.mon;
  return [
    ['Ability', m.ability],
    ['Nature', m.nature],
    ['Mood', ctx.mood],
    ['Bond', ctx.bond],
    ['Holding', ctx.held],
    ['Evolves', ctx.evolution || '—'],
  ];
}

function factLines(c: Phaser.GameObjects.Container, ctx: OverviewCtx, x: number, y: number, w: number, label: string, ink: string, step = 22): void {
  facts(ctx).forEach(([k, v], i) => {
    text(c, x, y + i * step, k, 12, label);
    text(c, x + 62, y + i * step - 2, v, 13, ink, { w: w - 62 });
  });
}

function readyLine(c: Phaser.GameObjects.Container, ctx: OverviewCtx, x: number, y: number, w: number, ink: string): void {
  text(c, x, y, `Readiness: ${ctx.ready.label}`, 16, READY_COLOR[ctx.ready.state], { w });
  text(c, x, y + 20, ctx.status, 13, ink, { w, extra: { wordWrap: { width: w }, maxLines: 2 } });
}

function expBar(c: Phaser.GameObjects.Container, ctx: OverviewCtx, x: number, y: number, w: number, ink: string): void {
  text(c, x, y - 2, 'EXP', 12, ink);
  bar(c, x + 34, y, w - 34, 8, ctx.exp.frac);
  text(c, x + w, y + 12, ctx.exp.text, 12, ink, { origin: [1, 0] });
}

/** A big trading card (Card Binder, Sticker Book): sprite window up top, moves with power, facts in the margin. */
export function cardOverview(face: { card: number; rim: number; paper: number; ink: string; label: string }): (ctx: OverviewCtx) => void {
  return (ctx) => {
    const { scene, into: c, mon: m } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(4, 6, 230, 324, 14).fillStyle(face.card === 0 ? typeColor(m) : face.card, 1).fillRoundedRect(0, 0, 230, 324, 14).lineStyle(5, face.rim, 1).strokeRoundedRect(0, 0, 230, 324, 14);
    g.fillStyle(0x14102a, 1).fillRoundedRect(10, 32, 210, 124, 8).fillStyle(face.paper, 0.96).fillRoundedRect(10, 164, 210, 150, 6);
    c.add(g);
    text(c, 14, 8, `${m.name}${m.shiny ? ' ★' : ''}`, 16, '#ffffff', { w: 120, extra: { stroke: '#2a1408', strokeThickness: 3 } });
    text(c, 218, 10, `HP ${m.hp}/${m.maxHp}`, 12, '#ff3030', { origin: [1, 0] });
    sprite(c, m, 115, 150, 1.6);
    text(c, 18, 168, `${m.types.join(' / ')} · Lv${m.level}`, 11, face.ink);
    m.moves.slice(0, 4).forEach((mv, i) => {
      text(c, 18, 188 + i * 24, mv.name, 13, face.ink, { w: 140 });
      text(c, 212, 188 + i * 24, mv.power, 13, face.ink, { origin: [1, 0] });
    });
    bar(c, 18, 296, 194, 6, frac(m));
    // The margin: what the card back says.
    const x = 254;
    text(c, x, 2, 'Card back', 13, face.label);
    factLines(c, ctx, x, 28, 348, face.label, '#ffffff');
    readyLine(c, ctx, x, 176, 348, '#d0e4f4');
    expBar(c, ctx, x, 262, 348, '#d0e4f4');
  };
}

/** One Pokémon under a stage light (Spotlight, Mii Plaza): a big portrait on a disc, the facts beside it. */
export function stageOverview(tone: { disc: number; beam: number; ink: string; label: string }): (ctx: OverviewCtx) => void {
  return (ctx) => {
    const { scene, into: c, mon: m } = ctx;
    const g = scene.add.graphics();
    g.fillStyle(tone.beam, 0.16).fillTriangle(110, 0, 0, 300, 220, 300);
    g.fillStyle(tone.disc, 0.85).fillEllipse(110, 296, 210, 40);
    g.lineStyle(3, 0xffffff, 0.5).strokeEllipse(110, 296, 210, 40);
    c.add(g);
    sprite(c, m, 110, 296, 2);
    text(c, 240, 2, `${m.name}${m.shiny ? ' ★' : ''}`, 24, '#ffffff', { w: 290 });
    text(c, 600, 8, `Lv${m.level}`, 20, '#ffffff', { origin: [1, 0] });
    text(c, 240, 36, m.types.join(' · ').toUpperCase(), 13, tone.label);
    text(c, 240, 62, 'HP', 12, tone.label);
    bar(c, 270, 64, 200, 12, frac(m));
    text(c, 480, 58, `${m.hp}/${m.maxHp}`, 15, '#ffffff');
    expBar(c, ctx, 240, 92, 360, tone.ink);
    readyLine(c, ctx, 240, 120, 360, tone.ink);
    factLines(c, ctx, 240, 172, 360, tone.label, '#ffffff');
    text(c, 240, 310, 'Moves', 12, tone.label);
    text(c, 296, 308, m.moves.map((mv) => mv.name).join(' · ') || '—', 13, '#ffffff', { w: 304 });
  };
}

/** A manga page (Manga Roster, Shonen Power): slanted panels, a big character panel and a power gauge. */
export function panelOverview(tone: { panel: number; rim: number; ink: string; label: string; gauge: number }): (ctx: OverviewCtx) => void {
  return (ctx) => {
    const { scene, into: c, mon: m } = ctx;
    const g = scene.add.graphics();
    const slant = (x: number, y: number, w: number, h: number, fill: number, a: number): void => {
      const pts = [new Phaser.Geom.Point(x + 12, y), new Phaser.Geom.Point(x + w, y), new Phaser.Geom.Point(x + w - 12, y + h), new Phaser.Geom.Point(x, y + h)];
      g.fillStyle(fill, a).fillPoints(pts, true).lineStyle(3, tone.rim, 1).strokePoints(pts, true);
    };
    slant(0, 0, 200, 326, typeColor(m), 0.9);
    g.lineStyle(2, 0xffffff, 0.18);
    for (let i = 0; i < 14; i++) g.lineBetween(100, 160, 100 + Math.cos(i * 0.45) * 180, 160 + Math.sin(i * 0.45) * 180);
    slant(214, 0, 388, 64, tone.panel, 0.95);
    slant(214, 74, 388, 112, tone.panel, 0.9);
    slant(214, 194, 388, 132, tone.panel, 0.9);
    c.add(g);
    sprite(c, m, 100, 300, 1.9);
    text(c, 244, 6, `${m.name}${m.shiny ? ' ★' : ''}`, 24, tone.ink, { w: 250 });
    text(c, 584, 10, `Lv${m.level}`, 20, tone.ink, { origin: [1, 0] });
    text(c, 244, 40, m.types.join(' · ').toUpperCase(), 12, tone.label);
    text(c, 244, 82, 'POWER', 12, tone.label);
    bar(c, 304, 84, 230, 14, frac(m));
    text(c, 544, 80, `${m.hp}/${m.maxHp}`, 14, tone.ink);
    expBar(c, ctx, 244, 116, 330, tone.ink);
    readyLine(c, ctx, 244, 138, 330, tone.ink);
    factLines(c, ctx, 244, 204, 340, tone.label, tone.ink, 20);
  };
}
