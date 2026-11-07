// Draws the run card (core/runCard.ts) on a plain canvas and saves it as a PNG. Presentation only.

import type { RunCard } from '../core/runCard';

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = word; y += lineH; } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lineH;
}

export function drawRunCard(card: RunCard, won: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 800;
  c.height = 450;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 800, 450);
  g.addColorStop(0, won ? '#24406b' : '#2b2b3d');
  g.addColorStop(1, won ? '#14213d' : '#15151f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 800, 450);
  ctx.strokeStyle = won ? '#f0d060' : '#8a8aa8';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 780, 430);
  ctx.fillStyle = won ? '#f0d060' : '#ffffff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(card.title, 32, 30 + 36);
  ctx.fillStyle = '#a9d8ff';
  ctx.font = '20px sans-serif';
  ctx.fillText(card.subtitle, 32, 108);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px sans-serif';
  ctx.imageSmoothingEnabled = false;
  card.team.slice(0, 6).forEach((m, i) => {
    const x = 32 + i * 125;
    if (m.art) ctx.drawImage(m.art.source, m.art.sx, m.art.sy, m.art.sw, m.art.sh, x + 4, 124, 112, 112);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${m.shiny ? '★' : ''}${m.name}`.slice(0, 13), x + 4, 252);
    ctx.fillStyle = '#a9d8ff';
    ctx.fillText(`Lv${m.level}`, x + 4, 270);
  });
  ctx.fillStyle = '#ffffff';
  ctx.fillStyle = '#d6e4ff';
  ctx.font = '20px sans-serif';
  ctx.fillText(card.stats.join('   ·   '), 32, 304);
  ctx.font = '18px sans-serif';
  let y = 340;
  for (const h of card.highlights) y = wrap(ctx, `• ${h}`, 32, y, 736, 24);
  ctx.fillStyle = '#7f8fb0';
  ctx.font = '16px sans-serif';
  ctx.fillText(card.footer, 32, 432);
  return c;
}

/** Saves the card as a PNG download. Returns false when the browser blocks it. */
export function saveRunCard(card: RunCard, won: boolean): boolean {
  try {
    const url = drawRunCard(card, won).toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pocket-raiders-run.png';
    a.click();
    return true;
  } catch {
    return false;
  }
}
