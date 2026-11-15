// New UI event ("?") screen, ported from the mock-ups' `event` template (four layouts by theme) with its
// outcome panel. EventScene keeps the state, the input and the outcome; this only draws.

import { act, B, bg, esc, foot, mon, tall, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art } from '../templates';
import { rxImage, rxUrl } from '../assets';

export interface EventChoice { label: string; sub: string; chance: string; locked: boolean }
export interface EventModel {
  name: string;
  tag: string;
  /** The intro, or the outcome text once a choice is made. */
  line: string;
  /** Backdrop file under assets/images, a tint ("#rrggbb") and the mock-ups' effect class (rain, snow, fog...). */
  art: string | null; tint: string | null; fx: string | null;
  cast: Art | null;
  mon: string | null;
  choices: EventChoice[];
  index: number;
  money: number;
  /** Outcome: null while choosing; `changes` shows after the text is read. */
  outcome: { step: 'text' | 'rewards'; ok: boolean; changes: string[]; next: string } | null;
  /** A trade: which party Pokémon goes. */
  pick: { labels: string[]; at: number } | null;
  countdown: string;
  /** Share of the countdown left (0–1), or null when the event has no timer. */
  timer: number | null;
}

const letter = (h: string): string => `<div class="bars" style="top:0"></div><div class="bars" style="bottom:0"></div>${h}`;
const pickAttr = (k: number): string => `${act('pick', k)} data-over="over"`;
const FX: Record<string, string> = { rain: 'rain', snow: 'snow', fog: 'fog', sparkle: 'sparkle', glint: 'glint', fire: 'fire', hearts: 'hearts', flicker: 'flicker' };

const BAD = /^(−|Lost|use |lose |trade away|party loses|lead loses|(party|lead) (poisoned|burned|paralysed|asleep)|Evil|Rage)/;
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
/** One outcome line as the mock-ups' "what · how much" row: "+₽300" reads Coins / +₽300, "Charisma +2" reads Charisma / +2. */
function changeRow(t: string): string {
  const money = /^([+−-]₽[\d,]+)$/.exec(t), tail = /^(.+?) ([+−-]\d+%?)$/.exec(t), head = /^([+−-]\d+%?) (.+)$/.exec(t), times = /^(.+) (×\d+)$/.exec(t);
  const [a, b] = money ? ['Coins', money[1]!] : tail ? [tail[1]!, tail[2]!] : head ? [head[2]!, head[1]!] : times ? [times[1]!, times[2]!] : [t, ''];
  return `<div class="row sm" style="color:${BAD.test(t) ? '#f08080' : 'inherit'}"><span class="grow">${esc(cap(a))}</span><b>${esc(b)}</b></div>`;
}

export function eventView(c: ReduxCtx, d: EventModel): string {
  const v = c.v(4), out = d.outcome, ch = out ? [] : d.choices;
  const amb = (d.tint ? `<div class="fill" style="background:${d.tint};opacity:.5;mix-blend-mode:multiply"></div>` : '') + (d.fx && FX[d.fx] ? `<div class="fill fx-${FX[d.fx]}"></div>` : '');
  const back = d.art ? bg(d.art) : '<div class="bg" style="background:var(--p2)"></div>';
  // The person in the scene: a trainer atlas, or a plain picture, scaled to a height.
  const who = (px: number): string => {
    if (!d.cast) return '';
    if (d.cast.atlas) return tall(d.cast.file, px);
    const dim = rxImage(d.cast.file);
    return dim ? `<i class="im" style="width:${Math.round((dim[0] * px) / dim[1])}px;height:${px}px;background:url(${rxUrl(d.cast.file)}) 0 0/100% 100%"></i>` : '';
  };
  const star = (x: number): string => (d.mon ? foot(x, 330, mon(d.mon, 3, '', true)) : '');
  const q = `<span class="tg">${esc(d.tag)}</span><span class="tg no" style="margin-left:6px">₽ ${d.money.toLocaleString('en-US')}</span>${d.countdown ? `<span class="tg" style="margin-left:6px;background:#e84838;color:#fff">${esc(d.countdown)}</span>` : ''}`;
  const sub = (x: EventChoice): string => x.sub;
  const outcome = out?.step === 'rewards' ? W(`<b class="acc">Outcome</b>${out.changes.map(changeRow).join('')}`, 'position:absolute;right:24px;top:70px;width:290px;display:flex;flex-direction:column;gap:6px;z-index:8', 'glass') : '';
  const cont = out ? [{ label: out.step === 'text' && out.changes.length ? 'Continue' : out.next, sub: '', chance: '', locked: false }] : [];
  const list = out ? cont : ch;
  const btnAct = (k: number): string => (out ? act('next') : pickAttr(k));
  const lit = (k: number): boolean => (out ? true : k === d.index);
  const fail = out && !out.ok ? '<span class="acc">It didn’t go your way… </span>' : '';
  const line = fail + esc(d.line);
  const picker = d.pick ? '<div class="shade"></div>' + W(`<b style="font-size:19px">Pick a Pokémon</b>${d.pick.labels.map((t, k) => B(esc(t), k === d.pick!.at, 'height:36px;font-size:15px', '', `${act('trade', k)} data-over="tradeOver"`)).join('')}<span class="sm"><kbd>Esc</kbd>back</span>`, 'position:absolute;left:280px;right:280px;top:110px;display:flex;flex-direction:column;gap:8px;padding:16px;z-index:12') : '';
  const pct = (x: EventChoice): string => (x.chance ? `<small>${esc(x.chance)}</small>` : '');

  if (v === 1) {
    return letter(back + amb + star(480) + foot(300, 478, who(280))) + `<div class="abs sm" style="left:20px;top:74px;color:#fff;z-index:6">${esc(d.name)}</div><div class="abs" style="left:20px;top:16px;z-index:7">${q}</div><div class="abs" style="left:120px;right:120px;bottom:132px;text-align:center;color:#fff;font-size:${d.line.length > 220 ? 15 : d.line.length > 120 ? 18 : 21}px;line-height:1.35;text-shadow:2px 2px 0 #000;z-index:6">${line}</div><div class="abs" style="left:60px;right:60px;bottom:74px;z-index:6;display:grid;grid-template-columns:repeat(${Math.max(1, Math.min(list.length, 4))},1fr);gap:10px">${list.map((x, k) => B(esc(x.label), lit(k), `justify-content:center;font-size:14px;padding:0 6px;height:46px${x.locked ? ';opacity:.5' : ''}`, '', btnAct(k))).join('')}</div>${d.timer !== null && !out ? `<div class="abs hp gold" style="left:60px;right:60px;bottom:22px;height:6px;z-index:6"><i style="width:${Math.round(d.timer * 100)}%"></i></div>` : ''}<div class="abs sm" style="left:60px;right:60px;bottom:44px;z-index:6;color:#fff;text-align:center;text-shadow:1px 1px 0 #000">${esc(list[out ? 0 : d.index] ? sub(list[out ? 0 : d.index]!) : '')}</div>` + outcome + picker;
  }
  if (v === 2) {
    return back + amb + '<div class="shade" style="background:#060a1870"></div>' + star(700) + foot(d.mon ? 250 : 720, 540, who(310)) + `<div class="abs win glass" style="left:0;right:0;bottom:0;height:176px;padding:20px 60px;border-radius:0;clip-path:none"><div class="plate" style="position:absolute;left:60px;top:-18px">${esc(d.name)}</div><div style="font-size:${d.line.length > 260 ? 15 : d.line.length > 160 ? 17 : 20}px;line-height:1.45;max-height:132px;overflow:hidden">${line}</div><div class="abs row sm" style="right:24px;bottom:10px;gap:14px"><span>${esc(list[out ? 0 : d.index] ? sub(list[out ? 0 : d.index]!) : '')}</span></div></div><div class="abs col" style="left:180px;width:420px;top:86px;gap:9px">${list.map((x, k) => B(esc(x.label) + pct(x), lit(k), `justify-content:center${x.locked ? ';opacity:.5' : ''}`, '', btnAct(k))).join('')}</div><div class="abs" style="left:20px;top:16px">${q}</div>` + outcome + picker;
  }
  if (v === 3) {
    return `<div class="abs" style="left:16px;top:16px;width:560px;bottom:16px;overflow:hidden;box-shadow:0 0 0 4px var(--pa),0 0 0 8px var(--l);transform:rotate(-.6deg)">${back + amb}${star(150)}${foot(d.mon ? 400 : 280, 520, who(280))}<div class="abs txt" style="left:16px;right:16px;top:16px;font-size:${d.line.length > 240 ? 14 : 17}px;line-height:1.35">${line}</div></div><div class="abs col" style="left:604px;right:20px;top:20px;gap:10px">${W(`<div class="row"><b class="grow" style="font-size:20px">${esc(d.name)}</b></div><span class="tg">${esc(d.tag)}</span><div class="sm">₽ ${d.money.toLocaleString('en-US')}${d.countdown ? ` · <b class="acc">${esc(d.countdown)}</b>` : ''}</div>`, 'display:flex;flex-direction:column;gap:6px')}${list.map((x, k) => W(`<b style="font-size:15px">${esc(x.label)}</b><div class="row sm"><span class="grow">${esc(x.sub)}</span><b>${esc(x.chance || '—')}</b></div>`, `padding:8px 12px;display:flex;flex-direction:column;gap:3px${x.locked ? ';opacity:.55' : ''}`, lit(k) ? 'sel' : '', btnAct(k))).join('')}</div>` + (outcome ? outcome.replace('right:24px;top:70px', 'left:40px;top:300px') : '') + picker;
  }
  return back + amb + star(d.cast ? 520 : 300) + foot(d.mon && !d.cast ? 220 : 250, 416, who(240)) + `<div class="abs" style="left:20px;top:16px">${q}</div><div class="abs col" style="right:24px;bottom:${d.line.length > 180 ? 160 : 122}px;width:340px;gap:8px">${list.map((x, k) => B(esc(x.label) + pct(x), lit(k), x.locked ? 'opacity:.5' : '', '', btnAct(k))).join('')}</div>${!out && ch[d.index]?.sub ? `<div class="abs sm" style="right:24px;bottom:${(d.line.length > 180 ? 160 : 122) + ch.length * 52 + 2}px;width:340px;color:#fff;text-shadow:1px 1px 0 #000;text-align:right;line-height:16px">${esc(ch[d.index]!.sub)}</div>` : ''}` + TX(line, d.name, d.line.length > 260 ? 'font-size:15px;line-height:20px' : '') + outcome + picker;
}
