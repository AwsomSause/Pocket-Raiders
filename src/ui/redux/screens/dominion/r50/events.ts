// DOMINION redesign R6 (pass 50): an event on the street, in four beats and a log, at pass 50 of
// plans/evil-mode-rework/redesign-50. Talk (mockup `event`, kind scene), Choose (`evchoose`, pass 10), Result
// (`evresult`), Reward (`reward`) and the Text log (`log`). The game's events are the street meetings (core/dominion/
// town.ts). Event rule: the text stays until a key press, and the reward shows only after the text is closed.

import './r6.css';
import { bg, esc, face, faceOf, frame, keys, map, page, pc, SP, type R5Key, type R5Run } from './kit';

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;

/** Someone in the event: a sprite (r50 key or ready HTML), their name, where they're from, their colour. */
export interface R5Actor { k?: string; html?: string; /** The face picture for an `html` person (cropped to the head). */ face?: string; name: string; sub: string; colour: string; /** Drawn as a dark shape (no sprite of their own). */ sil?: boolean }
export interface R5Said { who: R5Actor; text: string; you?: boolean }

const BEATS = ['Talk', 'Choose', 'Result', 'Reward'];
const beats = (on: number): string => `<ol class="beats10" data-m="beats">${map(BEATS, (b, i) => `<li class="${i < on ? 'done' : i === on ? 'on' : ''}"><i>${i + 1}</i>${b}</li>`)}</ol>`;

const body = (a: R5Actor, h: number, flip: boolean): string => {
  if (a.html) return a.html;
  return a.k ? SP(a.k, h, `${flip ? 'flip' : ''}${a.sil ? ' r6-sil' : ''}`) : '';
};
const actor = (a: R5Actor, side: 'l' | 'r', vs: boolean, h = 250): string =>
  `<div class="act ${side}" style="--pc:${a.colour}">${body(a, h, side === 'r')}<span class="plate${vs ? ' vs17' : ''}"><b>${esc(a.name)}</b><em>${esc(a.sub)}</em></span></div>`;
const faceFor = (a: R5Actor, sz: number): string => (a.face !== undefined ? faceOf(a.face, sz, a.colour) : a.k ? face(a.k, sz, a.colour) : faceOf('', sz, a.colour));
const tbox = (who: R5Actor, line: string, extra = '', tid = 'r6-ev-line'): string =>
  `<section class="tbox" data-m="box"><span class="spk6" style="--pc:${who.colour}">${faceFor(who, 62)}<b>${esc(who.name)}</b></span><p data-testid="${tid}">${esc(line)}</p>${extra}<i class="more">▼</i></section>`;
const logChip = '<i data-act="evLog" data-arg="">L · Log</i>';

// ---------- Talk (mockup `event`) ----------

export function r5EvTalk(o: { left: R5Actor; right: R5Actor | null; line: string }, run: R5Run): string {
  const ks: R5Key[] = [['Enter', 'next'], ['L', 'log', 'evLog']];
  return page({ id: 'event', g: 'Events', kind: 'scene sm-event pg-event', body: `${bg('street', 'Events', run)}\n  ${beats(0)}${actor(o.left, 'l', true)}\n  ${o.right ? actor(o.right, 'r', true) : ''}\n  `
    + `<section class="tbox" data-m="box" data-testid="dom-town"><span class="spk6" style="--pc:${o.left.colour}">${faceFor(o.left, 62)}<b>${esc(o.left.name)}</b></span><p data-testid="r6-ev-line">${esc(o.line)}</p><button class="cta on" ${act('evNext')} data-testid="r6-ev-next">Next</button><span class="tb-chips">${logChip}</span><i class="more">▼</i></section>\n  `
    + keys(ks, 'Events', run) });
}

// ---------- Choose (mockup `evchoose`) ----------

export interface R5EvChoice { label: string; note: string; icon: string; chance: string; how: string }

export function r5EvChoose(o: { left: R5Actor; crew: R5Actor | null; line: string; choices: readonly R5EvChoice[]; at: number }, run: R5Run): string {
  const cs = map(o.choices, (c, i) => `<button class="evc-c${i === o.at ? ' on' : ''}" ${act('townMeet', i)} data-over="evOver" data-testid="dom-town-${i}" style="--d:${i * 100}ms">${SP(c.icon, 34)}<span class="row-t"><b>${esc(c.label)}</b><em>${esc(c.note)}</em></span><span class="evc-r"><kbd>${i + 1}</kbd><b>${esc(c.chance)}</b><em>${esc(c.how)}</em></span></button>`);
  const n = o.choices.length;
  const ks: R5Key[] = [[`1-${n}`, 'choose'], ['Enter', 'confirm'], ['L', 'log', 'evLog']];
  const who = o.crew ?? o.left;
  return page({ id: 'evchoose', g: 'Events', kind: 'ev10 b-ch', body: `${bg('street', 'Events', run)}${beats(1)}\n  ${actor(o.left, 'l', false, 230)}\n  <nav class="evc">${cs}</nav>\n  ${tbox(who, o.line)}\n  ${keys(ks, 'Events', run)}` });
}

// ---------- Result (mockup `evresult`) ----------

export function r5EvResult(o: { left: R5Actor; right: R5Actor | null; art: string; roll: { stat: string; word: string; line: string; ok: boolean } | null; who: R5Actor; line: string }, run: R5Run): string {
  const roll = o.roll ? `<div class="roll10${o.roll.ok ? '' : ' r6-miss'}" data-testid="r6-ev-roll"><em>${esc(o.roll.stat)}</em><b>${esc(o.roll.word)}</b><span>${esc(o.roll.line)}</span></div>` : '';
  const ks: R5Key[] = [['Enter', 'close the text'], ['L', 'log', 'evLog']];
  return page({ id: 'evresult', g: 'Events', kind: 'ev10 b-res', body: `${bg('street', 'Events', run)}${beats(2)}\n  ${actor(o.left, 'l', false, 230)}\n  ${o.art ? `<div class="evr-art">${o.art}</div>` : ''}${o.right ? actor(o.right, 'r', false, 200) : ''}\n  ${roll}\n  `
    + tbox(o.who, o.line, '<span class="tb-chips"><i>Reward shows after this text</i></span>') + `\n  ${keys(ks, 'Events', run)}` });
}

// ---------- Reward (mockup `reward`) ----------

export interface R5RewardCard { icon: string; title: string; sub: string }

export function r5EvReward(o: { big: string; cards: readonly R5RewardCard[] }, run: R5Run): string {
  const cards = map(o.cards, (c, i) => `<div class="rw-c" style="--d:${300 + i * 150}ms">${SP(c.icon, 48)}<b>${esc(c.title)}</b><em>${esc(c.sub)}</em></div>`);
  const ks: R5Key[] = [['Enter', 'take it and close']];
  return page({ id: 'reward', g: 'Events', kind: 'rw10', body: `${bg('gold', 'Events', run)}${beats(3)}<div class="rw-burst" data-nocheck=""></div>\n  <div class="rw-h" data-m="ttl"><small>Event reward</small><b data-testid="r6-reward-big">${esc(o.big)}</b></div>\n  <div class="rw-cards" data-testid="r6-reward">${cards}</div>\n  <p class="rw-n">The text is closed, so the reward shows. It stays until you press a key.</p>\n  <button class="cta on rw-go" ${act('evNext')} data-testid="r6-reward-close">Close</button>${keys(ks, 'Events', run)}` });
}

// ---------- the Text log (mockup `log`) ----------

/** Lines the log shows at once. */
export const LOG_ROWS = 5;

export function r5EvLog(o: { lines: readonly R5Said[]; first: number; where: string }, run: R5Run): string {
  const rows = o.lines.slice(o.first, o.first + LOG_ROWS);
  const lg = map(rows, (l, i) => `<div class="lg" style="--i:${i};--d:${i * 60}ms">${faceFor(l.who, 40)}<span><b style="color:${l.you ? '#e0294a' : l.who.colour}">${esc(l.who.name.toUpperCase())}</b><p>${esc(l.text)}</p></span></div>`);
  const ks: R5Key[] = [['↑↓', 'scroll'], ['L', 'close', 'evLog'], ['Esc', 'back', 'evLog']];
  return frame({ id: 'log', g: 'Events', kind: 'log', bg: 'street', top: { title: 'Text log', sub: o.where, crumb: ['Map', 'map'], icon: 'g-letter' }, body: `<section class="pn log10" data-m="panel" data-testid="r6-log"><h3><i>Everything said in this event</i></h3>${lg}</section>`, keys: ks, run, noTabs: true });
}

/** The ring colour for a sprite key (kit's person colours). */
export const colourOf = (k: string): string => pc(k);
