// Beta 0.6 E2: draws the Notebook's world-state track page ("Ledger 1", an open notebook: steps on the left page,
// "how much you've seen" on the right). The words come from core/expansion/trackView.ts; nothing here changes the run.

import type Phaser from 'phaser';
import type { StepState, TrackPage } from '../core/expansion/trackView';
import { fitBlock, fitLine } from './fitText';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

const PAPER = 0xfbf3df;
const INK = '#2a2038';
const VIOLET = '#7a5aa6';
const GOLD = 0xe8a92c;
const BOX: Record<StepState, { fill: number; line: number; ink: string; dash: boolean; tag: string }> = {
  seen: { fill: 0xefe6cf, line: 0x7fa8a4, ink: INK, dash: false, tag: 'SEEN' },
  now: { fill: 0xffe8a8, line: GOLD, ink: INK, dash: false, tag: 'NOW' },
  next: { fill: 0xe9e8ef, line: 0x9a9ab0, ink: '#6c6a7c', dash: true, tag: 'NEXT' },
  locked: { fill: 0xf3ecd9, line: 0xdcd5c4, ink: '#9a948a', dash: false, tag: 'LOCKED' },
};

/** Builds the page as one container (depth set by the caller). `onClose` runs when the backdrop is clicked. */
export function drawTrackPage(scene: Phaser.Scene, page: TrackPage, onClose: () => void): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(85).setName('track-page');
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive().on('pointerdown', onClose));
  const bw = Math.min(GAME_WIDTH - 60, 900);
  const bh = GAME_HEIGHT - 70;
  const bx = (GAME_WIDTH - bw) / 2;
  const by = 36;
  const book = scene.add.graphics();
  book.fillStyle(0x6a4a8a, 1).fillRoundedRect(bx, by, bw, bh, 18);
  book.fillStyle(PAPER, 1).fillRoundedRect(bx + 8, by + 8, bw - 16, bh - 16, 12);
  book.lineStyle(2, 0xd8ccb0, 1).lineBetween(bx + bw / 2, by + 10, bx + bw / 2, by + bh - 10);
  layer.add(book);
  const half = bw / 2 - 24;
  const lx = bx + 24;
  const rx = bx + bw / 2 + 20;
  layer.add(scene.add.text(lx, by + 22, page.kicker, textStyle(11, VIOLET)));
  layer.add(fitLine(scene.add.text(lx, by + 38, page.title, textStyle(26, INK)), half));
  let y = by + 82;
  const rowH = Math.min(62, (bh - 150) / page.steps.length - 6);
  for (const s of page.steps) {
    const st = BOX[s.state];
    const g = scene.add.graphics();
    g.fillStyle(st.fill, 1).fillRoundedRect(lx, y, half - 12, rowH, 8);
    if (st.dash) {
      g.lineStyle(2, st.line, 1);
      for (let dx = 0; dx < half - 12; dx += 12) g.lineBetween(lx + dx, y, lx + Math.min(dx + 6, half - 12), y).lineBetween(lx + dx, y + rowH, lx + Math.min(dx + 6, half - 12), y + rowH);
    } else g.lineStyle(2, st.line, 1).strokeRoundedRect(lx, y, half - 12, rowH, 8);
    layer.add(g);
    layer.add(scene.add.text(lx + 12, y + rowH / 2, String(s.step), textStyle(22, st.ink)).setOrigin(0, 0.5));
    layer.add(fitLine(scene.add.text(lx + 44, y + 6, `${s.name || '???'}  ${st.tag}`, textStyle(14, st.ink)), half - 70));
    layer.add(fitBlock(scene.add.text(lx + 44, y + 24, s.rule, textStyle(11, st.ink, { wordWrap: { width: half - 70 } })), half - 70, rowH - 26));
    y += rowH + 6;
  }
  layer.add(fitBlock(scene.add.text(lx, y + 4, page.nextLine, textStyle(12, VIOLET, { wordWrap: { width: half } })), half, 36));
  layer.add(scene.add.text(rx, by + 22, "HOW MUCH YOU'VE SEEN", textStyle(11, VIOLET)));
  for (let i = 0; i < 5; i++) layer.add(scene.add.circle(rx + 8 + i * 22, by + 52, 8, i < page.seenCount ? GOLD : PAPER).setStrokeStyle(2, GOLD));
  let ry = by + 78;
  for (const sc of page.scales) {
    layer.add(scene.add.text(rx, ry, `${sc.scale} · ${sc.note}`, textStyle(12, sc.seen ? INK : '#9a948a')));
    layer.add(fitBlock(scene.add.text(rx, ry + 17, sc.text, textStyle(11, sc.seen ? INK : '#9a948a', { wordWrap: { width: half } })), half, 32));
    ry += 52;
  }
  layer.add(scene.add.text(rx, ry + 8, 'Civilians say', textStyle(13, INK)));
  layer.add(fitBlock(scene.add.text(rx, ry + 28, page.civilian, textStyle(13, INK, { wordWrap: { width: half } })), half, 54));
  layer.add(scene.add.text(bx + bw / 2, by + bh - 20, 'T or click to close', textStyle(10, VIOLET)).setOrigin(0.5, 1));
  return layer;
}
