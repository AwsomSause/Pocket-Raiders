// Beta 0.7: the Saffron Fighting Tournament on screen (Kice's spec 16): a bracket strip on every tournament event, a full 32-entrant bracket (B or click),
// and the champion's podium with confetti. Presentation only: it reads core/expansion/tourney.ts and never changes the run.

import Phaser from 'phaser';
import type { Content } from '../core/contentSchema';
import { TOURNEY_ROUNDS, type TourneyView } from '../core/expansion/tourney';
import { AERO, drawGlass } from './aero';
import { pokemonVisual } from './sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

const NEXT = '#ffe060';
const WON = '#78d890';
const AHEAD = '#a69cb4';

/** The strip across the top: five round boxes with the opponent's name, a trophy at the end. Clicking it (or pressing B) opens the full bracket. */
export function drawTourneyStrip(scene: Phaser.Scene, view: TourneyView, onOpen: () => void): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(40).setName('tourney-strip');
  const w = 150;
  const gap = 8;
  const total = 5 * w + 4 * gap + 44;
  const left = (GAME_WIDTH - total) / 2;
  const bg = drawGlass(scene, left - 10, 78, total + 20, 52, { tint: AERO.glassLow, rim: AERO.rim, radius: 12, alpha: 0.9 });
  layer.add(bg);
  TOURNEY_ROUNDS.forEach((name, i) => {
    const r = i + 1;
    const state = view.now > r ? 'won' : view.now === r ? 'next' : 'ahead';
    const color = state === 'won' ? WON : state === 'next' ? NEXT : AHEAD;
    const x = left + i * (w + gap);
    const g = scene.add.graphics();
    g.fillStyle(0x10182c, state === 'next' ? 0.95 : 0.75).fillRoundedRect(x, 82, w, 44, 8);
    g.lineStyle(state === 'next' ? 3 : 2, state === 'won' ? 0x3c8a5a : state === 'next' ? 0xd9b45a : 0x50486a, 1).strokeRoundedRect(x, 82, w, 44, 8);
    layer.add(g);
    layer.add(scene.add.text(x + w / 2, 86, `${state === 'won' ? '✓ ' : state === 'next' ? '▶ ' : ''}${name}`, textStyle(12, color)).setOrigin(0.5, 0));
    const opp = view.opponents[i];
    const label = state === 'ahead' && r < 5 ? '?' : opp ? opp.name : '?';
    layer.add(scene.add.text(x + w / 2, 104, label, textStyle(13, '#ffffff', { wordWrap: { width: w - 10 } })).setOrigin(0.5, 0));
  });
  layer.add(scene.add.text(left + 5 * (w + gap) + 14, 90, view.now === 6 ? '🏆' : '🥇', textStyle(26)).setOrigin(0.5, 0));
  const hit = scene.add.rectangle(left - 10, 78, total + 20, 52, 0x000000, 0).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', onOpen);
  layer.add(hit);
  layer.add(scene.add.text(GAME_WIDTH / 2, 132, 'B: full bracket', textStyle(11, '#bfe9ff', { stroke: '#101010', strokeThickness: 3 })).setOrigin(0.5, 0));
  return layer;
}

/** The whole bracket: thirty-two names narrowing to one, with you highlighted and the recurring competitors marked. */
export function drawTourneyPanel(scene: Phaser.Scene, content: Content, view: TourneyView, onClose: () => void): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(85).setName('tourney-bracket');
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0).setInteractive().on('pointerdown', onClose));
  layer.add(drawGlass(scene, 12, 12, GAME_WIDTH - 24, GAME_HEIGHT - 24, { tint: AERO.glassLow, rim: AERO.rim, radius: 18, alpha: 0.97 }));
  layer.add(scene.add.text(GAME_WIDTH / 2, 20, 'Saffron Fighting Tournament', textStyle(22, COLORS.gold)).setOrigin(0.5, 0));
  const stillIn = view.now === 0 ? 32 : view.survivors[Math.min(view.now - 1, 5)]?.length ?? 1;
  layer.add(scene.add.text(GAME_WIDTH / 2, 46, `${view.now === 6 ? 'CHAMPION' : `${stillIn} still in`}  ·  B or click to close`, textStyle(13, '#bfe9ff')).setOrigin(0.5, 0));
  const cols = 6;
  const colW = (GAME_WIDTH - 60) / cols;
  const top = 88;
  const bottom = GAME_HEIGHT - 28;
  const rounds = [...TOURNEY_ROUNDS, 'Champion'];
  for (let c = 0; c < cols; c++) {
    const col = view.survivors[c] ?? [];
    const x = 30 + c * colW;
    layer.add(scene.add.text(x + colW / 2 - 4, top - 4, rounds[c]!, textStyle(11, view.now === c + 1 ? NEXT : view.now > c + 1 ? WON : AHEAD)).setOrigin(0.5, 1));
    const rowH = (bottom - top) / Math.max(1, col.length);
    col.forEach((e, i) => {
      const y = top + i * rowH + rowH / 2;
      const gone = e.outIn > 0 && e.outIn <= Math.max(0, view.now - 1);
      const color = e.you ? '#ffe060' : gone ? '#6a6278' : e.named ? '#ffb070' : '#d8e8f8';
      const size = col.length > 16 ? 9 : col.length > 8 ? 11 : 13;
      const label = `${e.you ? '★ ' : e.named ? '• ' : ''}${e.name}`;
      layer.add(scene.add.text(x, y, label, textStyle(size, color, { wordWrap: { width: colW - 6 } })).setOrigin(0, 0.5));
    });
  }
  layer.add(scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '★ you   • recurring competitors and the rival', textStyle(11, '#a69cb4')).setOrigin(0.5, 0));
  return layer;
}

/** The champion's podium: spotlight, the winning Pokémon on the top step, the belt, falling confetti, and (when the troop came) a row of Mankey in the crowd. */
export function drawChampionStage(scene: Phaser.Scene, content: Content, speciesId: string, troop: boolean, calm: boolean): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(12).setName('tourney-champion');
  // Left of centre: the event's own art (the organizer) stands on the right.
  const cx = 330;
  const floor = 300;
  layer.add(scene.add.triangle(cx, 60, 0, 0, -150, floor - 60, 150, floor - 60, 0xfff4a0, 0.16).setOrigin(0.5, 0));
  layer.add(scene.add.rectangle(cx, floor + 6, 190, 36, 0xc09030).setStrokeStyle(2, 0x604810));
  layer.add(scene.add.text(cx, floor + 6, '1', textStyle(24, '#3a2808')).setOrigin(0.5));
  layer.add(scene.add.rectangle(cx - 150, floor + 18, 110, 20, 0x9090a0).setStrokeStyle(2, 0x505060));
  layer.add(scene.add.rectangle(cx + 150, floor + 24, 110, 8, 0xa06030).setStrokeStyle(2, 0x503010));
  const sp = content.species.get(speciesId);
  if (sp) layer.add(pokemonVisual(scene, sp, 'front', cx, floor - 6, 2.4) as unknown as Phaser.GameObjects.GameObject);
  layer.add(scene.add.text(cx, floor - 128, 'CHAMPION', textStyle(34, COLORS.gold, { stroke: '#402800', strokeThickness: 6 })).setOrigin(0.5).setName('champion-title'));
  layer.add(scene.add.rectangle(cx, floor - 22, 76, 8, 0xd02828).setStrokeStyle(2, 0xffd860));
  layer.add(scene.add.rectangle(cx, floor - 22, 18, 12, 0xffd860));
  if (troop) {
    const mk = content.species.get('mankey');
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 100;
      if (Math.abs(x - cx) < 140 || !mk) continue;
      layer.add(scene.add.text(x, floor + 40, '🐒', textStyle(30)).setOrigin(0.5).setName('troop-fan'));
    }
  }
  if (!calm) {
    const colors = [0xff5050, 0xffd860, 0x60c0ff, 0x78d890, 0xd890ff];
    scene.time.addEvent({
      delay: 70, loop: true,
      callback: () => {
        const p = scene.add.rectangle(Phaser.Math.Between(20, GAME_WIDTH - 20), 60, Phaser.Math.Between(5, 9), Phaser.Math.Between(8, 14), colors[Phaser.Math.Between(0, colors.length - 1)]!, 0.95);
        layer.add(p);
        scene.tweens.add({ targets: p, y: floor + 60, x: p.x + Phaser.Math.Between(-60, 60), angle: Phaser.Math.Between(-360, 360), alpha: 0.2, duration: Phaser.Math.Between(1600, 2600), ease: 'Sine.easeIn', onComplete: () => p.destroy() });
      },
    });
  }
  return layer;
}
