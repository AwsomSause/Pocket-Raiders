// New UI cutscene card, ported from the mock-ups' `cut` template: a letterboxed picture with one speaker, their
// name plate, one spoken line and the five-beat strip. Three layouts: a wide shot, a burst close-up, a split screen.
// Pure drawing; the scene decides what is said and when it moves on. The mock-ups' Trainer pictures carry empty
// room around the figure; the game's are cut close, so the heights here are the figure's own, feet on the lower bar.

import { act, AREA, bg, esc, foot } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art, figure } from '../templates';

export const CUT_BEATS = ['Situation', 'Anticipation', 'Moment', 'Reaction', 'Transition'] as const;

export interface CutModel {
  /** The speaker's name, drawn big. */
  name: string;
  /** The plate over the name: "Rival", "Champion". '' leaves the plate out. */
  role: string;
  /** What is said, without quote marks. */
  line: string;
  /** The speaker's picture, or null when nobody is shown. */
  cast: Art | null;
  /** A Pokémon shown with (wide shot) or instead of (the other layouts) the speaker. */
  mon?: Art | null;
  /** The player's Trainer, for the left half of the split screen. */
  player?: Art | null;
  /** The backdrop picture of the wide shot, or null for a plain dark one. */
  backdrop: string | null;
  /** Which of the five beats is lit (0 to 4). */
  beat: number;
  /** The split screen's right half turns dark red for a villain. */
  evil?: boolean;
  /** The key hint at the bottom right; null leaves it out (a moment that cannot be skipped). */
  skip?: readonly [string, string] | null;
}

const letter = (h: string): string => `<div class="bars" style="top:0"></div><div class="bars" style="bottom:0"></div>${h}`;

/** Which beat to light for step `i` of `n`: the strip fills from the first beat to the last. */
export const cutBeat = (i: number, n: number): number => (n <= 1 ? 4 : Math.max(0, Math.min(4, Math.round((Math.max(0, i) * 4) / (n - 1)))));

/** A long line steps its letters down so it stays inside its box. */
const size = (len: number, base: number): number => (len > 260 ? base - 6 : len > 170 ? base - 4 : len > 110 ? base - 2 : base);

export function cutView(c: ReduxCtx, d: CutModel): string {
  const v = c.v(3), on = Math.max(0, Math.min(4, Math.floor(d.beat)));
  const hint = d.skip === null ? null : d.skip ?? (['Esc', 'skip'] as const);
  const tag = `<div class="abs" style="left:60px;bottom:22px;z-index:6"><div class="beat">${CUT_BEATS.map((_, k) => `<i class="${k <= on ? 'on' : ''}"></i>`).join('')}<span>${CUT_BEATS[on]}</span></div></div>${hint ? `<div class="abs sm" style="right:60px;bottom:22px;z-index:6;color:#fff"><kbd>${esc(hint[0])}</kbd>${esc(hint[1])}</div>` : ''}`;
  const next = `<div class="fill" style="z-index:7;cursor:pointer"${act('next')}></div>`;
  // A moment with nothing said (a title only) draws no empty quote marks.
  const line = d.line ? `“${esc(d.line)}”` : '', len = d.line.length;
  const plate = (st: string): string => (d.role ? `<span class="plate" style="${st}">${esc(d.role)}</span>` : '');
  const name = d.name.length > 12 ? 0.75 : 1;
  if (v === 1) {
    return letter(`<div class="fill" style="background:radial-gradient(circle,var(--p2),#000 75%)"></div><div class="burst"></div>${foot(480, 430, d.mon ? figure(d.mon, 260) : figure(d.cast, 284))}`)
      + `<div class="abs col cen" style="left:0;right:0;top:76px;z-index:6;color:#fff;gap:2px">${plate('background:var(--acc);color:#14161e')}<b style="font-size:${Math.round(52 * name)}px;text-shadow:4px 4px 0 #000">${esc(d.name)}</b></div><div class="abs" style="left:140px;right:140px;bottom:74px;text-align:center;z-index:6;color:#fff;font-size:${size(len, 20)}px;text-shadow:2px 2px 0 #000">${line}</div>` + tag + next;
  }
  if (v === 2) {
    return letter(`<div class="fill" style="background:${AREA.sys};clip-path:polygon(0 0,52% 0,46% 100%,0 100%)">${foot(230, 560, figure(d.player, 573))}</div><div class="fill" style="background:${d.evil ? '#3a1028' : AREA.battle};clip-path:polygon(52% 0,100% 0,100% 100%,46% 100%)">${foot(720, 482, d.mon ? figure(d.mon, 300) : figure(d.cast, 356))}</div><div class="abs" style="left:468px;top:0;bottom:0;width:10px;background:#fff;transform:skewX(-6deg)"></div>`)
      + `<div class="abs col" style="right:60px;top:80px;align-items:flex-end;z-index:6;color:#fff">${plate('')}<b style="font-size:${Math.round(46 * name)}px;text-shadow:4px 4px 0 #000">${esc(d.name)}</b></div><div class="abs" style="left:60px;width:400px;bottom:74px;z-index:6;color:#fff;font-size:${size(len, 19)}px;text-shadow:2px 2px 0 #000">${line}</div>` + tag + next;
  }
  const back = d.backdrop ? bg(d.backdrop) : '<div class="fill" style="background:linear-gradient(#1a2030,#0b0f18)"></div>';
  return letter(back + '<div class="shade" style="background:linear-gradient(90deg,#000c,#0000 70%)"></div>' + (d.mon ? foot(680, 440, figure(d.mon, 290)) : '') + foot(d.mon ? 300 : 660, 482, figure(d.cast, d.mon ? 290 : 344)))
    + `<div class="abs col" style="left:60px;top:110px;gap:8px;z-index:6;color:#fff;max-width:420px">${plate('align-self:flex-start;background:var(--acc);color:#14161e')}<b style="font-size:${Math.round(60 * name)}px;line-height:.95;text-shadow:5px 5px 0 #000">${esc(d.name)}</b><span style="font-size:${size(len, 20)}px;line-height:1.35;text-shadow:2px 2px 0 #000">${line}</span></div>` + tag + next;
}
