// The Night Parade's Spirit Market (gn.new.11): the market screen. Six paper lanterns along the top (the doc's "counter on screen"),
// the four stalls and the gate in a night lane, and under them what the stall keeper says and what the player can answer.
// MinigameScene keeps the input and core/greenneedle/spiritMarket.ts the rules; this only draws. The keepers are their own sprites
// from the packs; the lanterns, awnings and the gate are drawn here with plain shapes.

import { act, B, esc, foot, H, tall, W } from '../kit';
import type { ReduxCtx } from '../stage';

export interface SpiritMarketModel {
  title: string;
  lanterns: number;
  max: number;
  /** The Misdreavus has rung its bell (the fifth action). */
  bell: boolean;
  /** Where the player stands: 'lanes', a stall's id, 'gate' or 'dark'. */
  at: string;
  stalls: readonly { id: string; name: string; trade: string; /** Why it can't trade now, or ''. */ shut: string; used: number; file: string | null }[];
  /** The Misdreavus at the gate. */
  gate: string | null;
  prompt: string;
  /** The choices, in the rules' order. In the lanes the first ones are the stalls and the last is the gate. */
  cells: readonly { label: string; detail: string; off: boolean }[];
  cols: number;
  index: number;
  /** Once the night is over: how it ended and what each trade did. */
  outcome: { lines: readonly string[]; log: readonly string[] } | null;
  hints: readonly (readonly [string, string])[];
}

const LANE = { x: 24, y: 136, w: 912, h: 186 };
const GATE_W = 148;
const AWNING = ['#8a4a9a', '#3d6a8a', '#a0406a', '#5a6a4a'];
const rich = (t: string): string => esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');

/** One paper lantern of the counter: lit, or burnt down. */
function lantern(x: number, lit: boolean, last: boolean): string {
  const paper = lit ? `background:radial-gradient(ellipse at 50% 60%,#fff3b0 0,#ffc34a 45%,#e8782a 100%);box-shadow:0 0 0 2px #5a2a14,0 0 ${last ? 10 : 18}px ${last ? 3 : 6}px #ffb84a88` : 'background:#3a3348;box-shadow:0 0 0 2px #1c1826;opacity:.75';
  return `<div class="abs" style="left:${x}px;top:0;width:34px;height:58px"><i class="abs" style="left:16px;top:0;width:2px;height:10px;background:#1c1826"></i><i class="abs" style="left:7px;top:9px;width:20px;height:5px;border-radius:2px;background:#1c1826"></i><i class="abs" style="left:3px;top:14px;width:28px;height:34px;border-radius:12px/16px;${paper}"></i><i class="abs" style="left:9px;top:48px;width:16px;height:4px;border-radius:2px;background:#1c1826"></i>${lit ? '' : '<i class="abs" style="left:15px;top:22px;width:4px;height:14px;border-radius:2px;background:#1c1826"></i>'}</div>`;
}

export function spiritMarketView(_c: ReduxCtx, d: SpiritMarketModel): string {
  const inLanes = d.at === 'lanes' && !d.outcome;
  const ring = (on: boolean): string => (on ? 'box-shadow:0 0 0 3px var(--acc),0 0 0 5px #0008;' : '');
  // The counter: one lantern for every action there was, the burnt ones dark.
  const lamps = Array.from({ length: d.max }, (_, i) => lantern(i * 46, i < d.lanterns, d.lanterns === 1)).join('');
  const counter = `<div class="abs" data-lanterns="${d.lanterns}" style="left:24px;top:62px;width:${LANE.w}px;height:66px;border-radius:6px;background:linear-gradient(#171226,#231a3a);box-shadow:0 0 0 3px var(--l)">`
    + `<div class="abs" style="left:14px;top:8px;line-height:1.15;color:#f4e8c8"><div style="font-size:12px;letter-spacing:.1em;opacity:.8">LANTERNS LEFT</div><div style="font-size:26px;font-weight:700">${d.lanterns} <span style="font-size:15px;font-weight:400;opacity:.8">of ${d.max}</span></div></div>`
    + `<div class="abs" style="left:150px;top:4px;width:${d.max * 46}px;height:58px">${lamps}</div>`
    + `<div class="abs" style="right:14px;top:9px;width:${LANE.w - 190 - d.max * 46}px;text-align:right;color:#f4e8c8;font-size:13px;line-height:1.35">A trade is one action. Looking is free.<br>${d.bell ? '<span class="tg">The bell has rung</span>' : `<span style="opacity:.8">The Misdreavus rings its bell at the fifth.</span>`}</div></div>`;
  // The lane: four stalls and the gate.
  const sw = (LANE.w - GATE_W) / Math.max(1, d.stalls.length);
  const dark = d.at === 'dark' || (d.outcome && d.lanterns === 0);
  let lane = `<div class="abs" style="left:${LANE.x}px;top:${LANE.y}px;width:${LANE.w}px;height:${LANE.h}px;overflow:hidden;border-radius:6px;box-shadow:0 0 0 3px var(--l);background:linear-gradient(#0f0b1e 0,#221a3c 58%,#3a2c4a 58%,#2a2038 100%)">`;
  d.stalls.forEach((s, i) => {
    const x = Math.round(i * sw), here = d.at === s.id, on = inLanes && d.index === i;
    const faded = (!inLanes && !here && !d.outcome) || (inLanes && !!s.shut);
    const glow = dark ? '' : `<i class="abs" style="left:${sw / 2 - 60}px;top:18px;width:120px;height:120px;border-radius:50%;background:radial-gradient(#ffc34a44,#ffc34a00 70%)"></i>`;
    const keeper = s.file ? foot(sw / 2, 122, tall(s.file, 84)) : `<div class="abs" style="left:${sw / 2 - 26}px;top:54px;width:52px;height:68px;border-radius:26px 26px 6px 6px;background:#4a3a6a"></div>`;
    const awning = `<i class="abs" style="left:10px;top:12px;width:${sw - 20}px;height:22px;clip-path:polygon(8% 0,92% 0,100% 100%,0 100%);background:repeating-linear-gradient(90deg,${AWNING[i % AWNING.length]} 0 18px,#e8dcc0 18px 36px)"></i><i class="abs" style="left:16px;top:34px;width:3px;height:92px;background:#1c1826"></i><i class="abs" style="left:${sw - 19}px;top:34px;width:3px;height:92px;background:#1c1826"></i>`;
    const table = `<i class="abs" style="left:8px;top:118px;width:${sw - 16}px;height:14px;border-radius:3px;background:#6a4a32;box-shadow:inset 0 -4px 0 #0004"></i>`;
    const plate = `<div class="abs" style="left:6px;top:134px;width:${sw - 12}px;height:48px;text-align:center;line-height:1.2;color:#f4e8c8"><div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</div><div style="font-size:11.5px;opacity:.85">${esc(inLanes && s.shut ? s.shut : s.trade)}</div></div>`;
    const count = s.used > 0 ? `<span class="abs tg" style="right:10px;top:40px">${s.used} trade${s.used === 1 ? '' : 's'}</span>` : '';
    lane += `<div class="abs" data-stall="${s.id}" style="left:${x}px;top:0;width:${sw}px;height:${LANE.h}px;opacity:${faded ? 0.45 : 1}">${glow}${awning}${keeper}${table}${plate}${count}`
      + `<div class="abs"${inLanes ? ` data-cell="${i}"` : ''} style="left:4px;top:4px;right:4px;bottom:4px;border-radius:8px;${inLanes && !s.shut ? 'cursor:pointer;' : ''}${ring(on || (here && !d.outcome))}"${inLanes && !s.shut ? `${act('pick', i)} data-over="over"` : ''}></div></div>`;
  });
  // The gate, and the Misdreavus that keeps it. In the lanes it is the way out (the last choice).
  const gx = LANE.w - GATE_W, gi = d.stalls.length, gateOn = inLanes && d.index === gi;
  lane += `<div class="abs" data-stall="gate" style="left:${gx}px;top:0;width:${GATE_W}px;height:${LANE.h}px;opacity:${!inLanes && d.at !== 'gate' && d.at !== 'dark' && !d.outcome ? 0.45 : 1}">`
    + `<i class="abs" style="left:22px;top:20px;width:8px;height:112px;background:#7a2a2a"></i><i class="abs" style="left:${GATE_W - 30}px;top:20px;width:8px;height:112px;background:#7a2a2a"></i><i class="abs" style="left:10px;top:14px;width:${GATE_W - 20}px;height:10px;border-radius:3px;background:#9a3a3a"></i><i class="abs" style="left:18px;top:34px;width:${GATE_W - 36}px;height:6px;background:#7a2a2a"></i>`
    + (d.gate ? foot(GATE_W / 2, 124, tall(d.gate, 66)) : '')
    + `<div class="abs" style="left:4px;top:134px;width:${GATE_W - 8}px;text-align:center;line-height:1.2;color:#f4e8c8"><div style="font-size:14px;font-weight:700">The gate</div><div style="font-size:11.5px;opacity:.85">${inLanes ? 'Leave the market.' : 'A Misdreavus keeps it.'}</div></div>`
    + `<div class="abs"${inLanes ? ` data-cell="${gi}"` : ''} style="left:4px;top:4px;right:4px;bottom:4px;border-radius:8px;${inLanes ? 'cursor:pointer;' : ''}${ring(gateOn || ((d.at === 'gate' || d.at === 'dark') && !d.outcome))}"${inLanes ? `${act('pick', gi)} data-over="over"` : ''}></div></div>`;
  if (dark) lane += '<div class="abs" style="left:0;top:0;right:0;bottom:0;background:#0a0814aa;pointer-events:none"></div>';
  lane += '</div>';
  // Under the lane: what is said, and (at a stall, the gate or in the dark) the answers.
  const top = LANE.y + LANE.h + 12, h = 540 - top - 14;
  const size = (t: string, room: number): number => (t.length > room * 2.2 ? 12 : t.length > room * 1.5 ? 13 : t.length > room ? 14 : 16);
  if (d.outcome) {
    const said = d.outcome.lines.join(' ');
    const log = d.outcome.log.length ? `<div style="margin-top:6px;font-size:12px;line-height:1.3;opacity:.85">${d.outcome.log.map((l) => esc(l)).join('<br>')}</div>` : '';
    const total = said.length + d.outcome.log.join(' ').length;
    return H(d.title, 'story', d.hints) + counter + lane
      + W(`<div style="overflow:hidden;max-height:${h - 16}px"><div style="font-size:${total > 620 ? 12 : size(said, 150)}px;line-height:1.3">${rich(said)}</div>${total > 900 ? '' : log}</div>`, `position:absolute;left:24px;top:${top}px;width:${LANE.w - 150}px;height:${h}px;padding:8px 14px;box-sizing:border-box`)
      + `<div class="abs" style="right:24px;top:${top + h - 46}px;width:124px">${B('Done', true, 'justify-content:center', '', act('pick', 0))}</div>`;
  }
  const focus = d.cells[d.index];
  if (inLanes) {
    const note = focus ? `<div style="margin-top:6px;font-size:13px;opacity:.85"><b>${esc(focus.label)}</b> ${esc(focus.detail)}</div>` : '';
    return H(d.title, 'story', d.hints) + counter + lane
      + W(`<div style="font-size:${size(d.prompt, 230)}px;line-height:1.3">${rich(d.prompt)}</div>${note}`, `position:absolute;left:24px;top:${top}px;width:${LANE.w}px;height:${h}px;padding:10px 14px;box-sizing:border-box;overflow:hidden`);
  }
  const textW = 372, listX = 24 + textW + 12, listW = LANE.w - textW - 12;
  const cols = Math.max(1, d.cols), rows = Math.ceil(d.cells.length / cols);
  const gap = 5, bh = Math.min(38, Math.floor((h - (rows - 1) * gap) / rows)), bw = Math.floor((listW - (cols - 1) * 8) / cols);
  const list = d.cells.map((c, i) => {
    const x = listX + (i % cols) * (bw + 8), y = top + Math.floor(i / cols) * (bh + gap);
    return `<div class="abs" data-cell="${i}" style="left:${x}px;top:${y}px;width:${bw}px;opacity:${c.off ? 0.45 : 1}">${B(`<span style="overflow:hidden;text-overflow:ellipsis">${esc(c.label)}</span>`, d.index === i, `height:${bh}px;font-size:${bh < 30 ? 13 : 15}px;padding:0 12px;${c.off ? '' : 'cursor:pointer'}`, cols === 1 && c.off ? esc(c.detail) : '', c.off ? '' : `${act('pick', i)} data-over="over"`)}</div>`;
  }).join('');
  const note = focus ? `<div style="margin-top:8px;font-size:13px;line-height:1.3;opacity:.85">${esc(focus.detail)}</div>` : '';
  return H(d.title, 'story', d.hints) + counter + lane
    + W(`<div style="font-size:${size(d.prompt, 120)}px;line-height:1.3">${rich(d.prompt)}</div>${note}`, `position:absolute;left:24px;top:${top}px;width:${textW}px;height:${h}px;padding:10px 14px;box-sizing:border-box;overflow:hidden`)
    + list;
}
