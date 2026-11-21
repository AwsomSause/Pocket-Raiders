// Phantom UI: the interaction prompt's window (tap, timing, hold, rhythm, shout, drag). The mock-ups had no page for
// it, so it is built from their parts: a dark slanted card with the prompt's name, its meter, and what to press.
// A pure function from a model to HTML; `ui/interactionPrompt.ts` keeps the clock and the judges, so nothing drawn
// here decides a grade. The page is see-through: only its catch-all layer takes the pointer.

import { esc, page } from '../kit';

/** The Phantom stage is 1280 wide and the game's own pixels are 960: one game pixel is this many stage pixels. */
export const PROMPT_SCALE = 1280 / 960;

interface Base {
  /** The prompt's name ("Counter!"). */
  label: string;
  /** What to press. */
  words: string;
  /** The verdict, once it is in: its word and its colour. */
  result: { word: string; color: string } | null;
  /** The game's own box for the prompt, in game pixels (the pointer is read against it). */
  box: { left: number; top: number; w: number; h: number };
}
export type PhPromptModel = Base & (
  | { kind: 'tap'; /** The mark is up: press now. */ ready: boolean }
  | { kind: 'timing' | 'hold'; /** How full the bar is, 0 to 1. */ k: number; /** Where the zone to hit lies, 0 to 1. */ zone: readonly [number, number] }
  | { kind: 'rhythm'; /** Each beat's place on the line, 0 to 1. */ beats: readonly number[]; at: number; /** A press just landed. */ hit: boolean }
  | { kind: 'shout'; /** How loud, 0 to 1. */ level: number; /** The bars' full heights, in game pixels. */ bars: readonly number[] }
  | { kind: 'drag'; /** In percent of the box. */ from: readonly [number, number]; to: readonly [number, number]; end: readonly [number, number] | null }
);

const pct = (v: number): string => `${(Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0)) * 100).toFixed(1)}%`;
const px = (v: number): number => Math.round(v * PROMPT_SCALE);

export function phPrompt(d: PhPromptModel): string {
  const head = d.result
    ? `<b class="ph-pr-res" data-key="res" style="color:${esc(d.result.color)}">${esc(d.result.word)}</b>`
    : `<b class="ph-pr-lab" data-key="lab">${esc(d.label)}</b>`;
  const hint = `<p class="txt">${esc(d.words)} <span>(Esc skips)</span></p>`;
  const bar = (k: number, zone: readonly [number, number]): string =>
    `<div class="ph-pr-bar"><i style="width:${pct(k)}"></i><u style="left:${pct(zone[0])};width:${pct(Math.max(0, zone[1] - zone[0]))}"></u></div>`;
  const catchAll = '<div class="ph-fill hit ph-pr-hit"></div>';
  const { left, top, w, h } = d.box;
  if (d.kind === 'drag') {
    // The field keeps the game's own box, so the pointer lands where it is drawn.
    const dot = (v: readonly [number, number], cls: string): string => `<u class="${cls}" style="left:${v[0].toFixed(1)}%;top:${v[1].toFixed(1)}%"></u>`;
    const line = d.end ? `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="${d.from[0]}" y1="${d.from[1]}" x2="${d.end[0].toFixed(1)}" y2="${d.end[1].toFixed(1)}"/></svg>` : '';
    const field = `<div class="ph-pr-field" style="left:${px(left)}px;top:${px(top)}px;width:${px(w)}px;height:${px(h)}px">${line}${dot(d.from, 'a')}${dot(d.to, 'b')}${d.end ? dot(d.end, 'c') : ''}</div>`;
    const shell = `<div class="pn ph-pr-card ph-pr-shell" style="left:${px(left) - 26}px;top:${px(top) - 70}px;width:${px(w) + 52}px;height:${px(h) + 150}px">${head}<span class="ph-pr-gap"></span>${hint}</div>`;
    return page('prompt', catchAll + shell + field, false);
  }
  let body = '';
  switch (d.kind) {
    case 'tap': body = `<div class="ph-pr-tap${d.ready ? ' on' : ''}"><kbd>Enter</kbd><b>Now!</b></div>`; break;
    case 'timing':
    case 'hold': body = bar(d.k, d.zone); break;
    case 'rhythm': body = `<div class="ph-pr-beat">${d.beats.map((b) => `<u style="left:${pct(b)}"></u>`).join('')}<i class="${d.hit ? 'hit' : ''}" style="left:${pct(d.at)}"></i></div>`; break;
    case 'shout': {
      const k = Math.max(0, Math.min(1, d.level));
      body = `<div class="ph-pr-mic">${d.bars.map((b) => `<i style="height:${px(b * (0.3 + 0.7 * k))}px"></i>`).join('')}</div>`;
      break;
    }
  }
  const card = `<div class="pn ph-pr-card" style="left:${px(left)}px;top:${px(top + h / 2 - 80)}px;width:${px(w)}px">${head}${body}${hint}</div>`;
  return page('prompt', (d.kind === 'shout' ? '<div class="ph-shade ph-pr-dim"></div>' : '') + catchAll + card, false);
}
