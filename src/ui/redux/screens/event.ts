// New UI event ("?") screen, ported from the mock-ups' `event` template (four layouts by theme) with its
// outcome panel. EventScene keeps the state, the input and the outcome; this only draws.

import { partyStrip, type PartyChip } from '../game';
import { act, B, bg, esc, foot, H, hpb, mini, mon, TX, W } from '../kit';
import type { ScriptLine } from '../script';
import type { ReduxCtx } from '../stage';
import { priceOf } from '../storeFloors';
import { figure, type Art } from '../templates';
import { bracketView, type BracketModel, type RoundChip } from './bracket';
import { honestView, type HonestModel } from './stops';

export interface EventChoice { label: string; sub: string; chance: string; locked: boolean }
export interface EventModel {
  name: string;
  tag: string;
  /**
   * The page of text on show (the intro, or the outcome text once a choice is made): its lines, the person on the
   * name plate when one person speaks, and where the page sits in the text. Choices wait for the last page.
   */
  lines: ScriptLine[];
  speaker: string | null;
  page: { at: number; of: number };
  /** Backdrop file under assets/images, a tint ("#rrggbb") and the mock-ups' effect class (rain, snow, fog...). */
  art: string | null; tint: string | null; fx: string | null;
  cast: Art | null;
  mon: string | null;
  choices: EventChoice[];
  index: number;
  /** Coins on the tag row; null leaves the coin tag out (a scene outside a run). */
  money: number | null;
  /** Outcome: null while choosing; `changes` shows after the text is read. */
  outcome: { step: 'text' | 'rewards'; ok: boolean; changes: string[]; next: string } | null;
  /** A choice that takes a party Pokémon: which one goes. `card` (swaps): both sides, shown before the player commits; `get` null = not known until the swap. */
  pick: { labels: string[]; at: number; card?: { give: { name: string; file: string | null }; get: { name: string; file: string | null } | null } | null } | null;
  countdown: string;
  /** Share of the countdown left (0–1), or null when the event has no timer. */
  timer: number | null;
  /** A rank label and up to three named meters beside the text (Trust with a rival, a ladder rank), or null. */
  standing?: { rank: string; meters: { label: string; value: number; max: number }[] } | null;
  /** A tournament event: its rounds as a strip (a click or B opens the bracket), the bracket page when it is open, and a big title (the champion). */
  rounds?: RoundChip[] | null;
  bracket?: BracketModel | null;
  title?: string | null;
  /** Catalog Overhaul: the Honest Trade Card as a page of its own (while a Pokémon is picked for the trade, or when the card is read with T). */
  honest?: HonestModel | null;
  /** The event has a trade card to read: a tag on the tag row opens it (T). */
  cardHint?: boolean;
  /** A department store floor (mock-up `store`): the floor directory with this floor lit, the party, and a note per Pokémon for each choice (who a good helps). */
  store?: { title: string; clerk: string; floors: { tag: string; name: string; on: boolean }[]; party: PartyChip[]; notes: string[][] } | null;
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
  if (d.bracket) return bracketView(c, d.bracket);
  if (d.honest) return honestView(c, d.honest);
  const v = c.v(4), out = d.outcome, more = d.page.at < d.page.of - 1, ch = out || more ? [] : d.choices;
  const talk = d.lines.some((l) => l.who !== null);
  /** The page as HTML. `plated`: the layout shows the speaker on a name plate, so their own lines need no name. */
  const say = (plated: boolean): string => d.lines.map((l) => (l.who === null ? (talk ? `<i style="opacity:.85">${esc(l.text)}</i>` : esc(l.text)) : plated && l.who === d.speaker ? esc(l.text) : `<b class="acc">${esc(l.who)}</b> ${esc(l.text)}`)).join('<br>');
  const len = d.lines.reduce((n, l) => n + l.text.length + (l.who ? l.who.length + 1 : 0), 0);
  /** Rows the page takes in the wide text box (about 84 letters a row). */
  const rows = d.lines.reduce((n, l) => n + Math.max(1, Math.ceil((l.text.length + (l.who && l.who !== d.speaker ? l.who.length + 1 : 0)) / 84)), 0);
  const mark = (st: string): string => (d.page.of > 1 ? `<span class="sm${more ? ' rx-more' : ''}" style="position:absolute;${st}">${d.page.at + 1}/${d.page.of}${more ? ' ▼' : ''}</span>` : '');
  /** While pages remain, a click anywhere turns the page. */
  const turn = more ? `<div class="fill hit" style="z-index:20;cursor:pointer"${act(out ? 'next' : 'page')}></div>` : '';
  const plate = d.speaker ?? d.name;
  /** The tournament strip: five rounds, the next one lit. `st` places it. It sits above the page-turn layer so it can always be clicked. */
  const strip = (st: string): string => (d.rounds ? `<div class="abs row" style="gap:6px;z-index:21;cursor:pointer;${st}"${act('bracket')}>${d.rounds.map((r) => `<div class="win${r.state === 'next' ? ' sel' : ''}" style="flex:1;min-width:0;padding:3px 8px${r.state === 'ahead' ? ';opacity:.6' : ''}"><div style="font-size:11px;white-space:nowrap">${r.state === 'won' ? '✓ ' : r.state === 'next' ? '▶ ' : ''}${esc(r.name)}</div><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.who)}</b></div>`).join('')}<span class="sm" style="white-space:nowrap;color:#fff;text-shadow:1px 1px 0 #000"><kbd>B</kbd>bracket</span></div>` : '');
  const title = d.title ? `<div class="abs" style="left:0;right:0;top:146px;text-align:center;font-size:40px;font-weight:700;color:var(--acc);text-shadow:3px 3px 0 #000,0 0 18px #000;letter-spacing:.08em;z-index:6;pointer-events:none">${esc(d.title)}</div>` : '';
  /** Where the standing panel starts: under the strip when there is one. */
  const sTop = (y: number): number => (d.rounds ? y + 50 : y);
  /** The standing panel: a rank and up to three meters. `st` places it. */
  const standing = (st: string, c = 'glass'): string => (d.standing ? W(`<div class="row"><span class="sm grow">Standing</span><b class="acc">${esc(d.standing.rank)}</b></div>${d.standing.meters.slice(0, 3).map((m) => `<div class="row sm" style="gap:8px"><span style="width:84px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.label)}</span>${hpb(Math.max(0, Math.min(100, m.max > 0 ? (m.value / m.max) * 100 : 0)), 0, ' gold')}<b style="width:44px;text-align:right">${m.value}/${m.max}</b></div>`).join('')}`, `display:flex;flex-direction:column;gap:5px;padding:8px 12px;${st}`, c) : '');
  const amb = (d.tint ? `<div class="fill" style="background:${d.tint};opacity:.5;mix-blend-mode:multiply"></div>` : '') + (d.fx && FX[d.fx] ? `<div class="fill fx-${FX[d.fx]}"></div>` : '');
  const back = d.art ? bg(d.art) : '<div class="bg" style="background:var(--p2)"></div>';
  const who = (px: number): string => figure(d.cast, px);
  const star = (x: number): string => (d.mon ? foot(x, 330, mon(d.mon, 3, '', true)) : '');
  const q = `<span class="tg">${esc(d.tag)}</span>${d.money === null ? '' : `<span class="tg no" style="margin-left:6px">₽ ${d.money.toLocaleString('en-US')}</span>`}${d.countdown ? `<span class="tg" style="margin-left:6px;background:#e84838;color:#fff">${esc(d.countdown)}</span>` : ''}${d.cardHint ? `<span class="tg no" style="margin-left:6px;cursor:pointer;position:relative;z-index:9"${act('card')}><kbd>T</kbd> Trade card</span>` : ''}`;
  const sub = (x: EventChoice): string => x.sub;
  const outcome = out?.step === 'rewards' ? W(`<b class="acc">Outcome</b>${out.changes.map(changeRow).join('')}`, 'position:absolute;right:24px;top:70px;width:290px;display:flex;flex-direction:column;gap:6px;z-index:8', 'glass') : '';
  const cont = out ? [{ label: more ? 'Next' : out.step === 'text' && out.changes.length ? 'Continue' : out.next, sub: '', chance: '', locked: false }] : [];
  const list = out ? cont : ch;
  const btnAct = (k: number): string => (out ? act('next') : pickAttr(k));
  const lit = (k: number): boolean => (out ? true : k === d.index);
  const fail = out && !out.ok ? '<span class="acc">It didn’t go your way… </span>' : '';
  const line = fail + say(false), lineP = fail + say(true);
  const side = (title: string, x: { name: string; file: string | null } | null): string => W(`<span class="sm">${title}</span><div style="height:76px;display:flex;align-items:center;justify-content:center">${x?.file ? mini(x.file, 72) : `<b style="font-size:40px;opacity:.6">${x ? '' : '?'}</b>`}</div><b style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(x?.name ?? 'Not known yet')}</b>`, 'flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px');
  const card = d.pick?.card ? `<div class="row" style="gap:10px">${side('You give', d.pick.card.give)}<b class="acc" style="font-size:26px">⇄</b>${side('You get', d.pick.card.get)}</div>` : '';
  const picker = d.pick ? '<div class="shade"></div>' + W(`<b style="font-size:19px">${card ? 'The trade, both sides' : 'Pick a Pokémon'}</b>${card}${d.pick.labels.map((t, k) => B(esc(t), k === d.pick!.at, `height:${card && d.pick!.labels.length > 4 ? 28 : 36}px;font-size:15px`, '', `${act('trade', k)} data-over="tradeOver"`)).join('')}<span class="sm"><kbd>Enter</kbd>${card ? 'trade' : 'choose'} <kbd>Esc</kbd>back</span>`, `position:absolute;left:260px;right:260px;top:${card ? 40 : 110}px;display:flex;flex-direction:column;gap:${card ? 6 : 8}px;padding:16px;z-index:12`) : '';
  const pct = (x: EventChoice): string => (x.chance ? `<small>${esc(x.chance)}</small>` : '');
  // A long choice label shrinks and wraps inside its button (`px` is the room for text) so no word runs past the edge.
  const fit = (x: EventChoice, px: number, base: number, chance = true): string => {
    const len = x.label.length + (chance && x.chance ? x.chance.length + 2 : 0);
    for (const [size, lines] of [[base, 1], [14, 2], [12, 3], [10, 3]] as const) {
      if (size > base || len * size * 0.6 > px * lines) continue;
      return lines === 1 ? '' : `;font-size:${size}px;white-space:normal;line-height:${size + 1}px`;
    }
    return ';font-size:10px;white-space:normal;line-height:11px';
  };
  // The letterbox layout lays the choices out as a grid across 840 pixels; this is the room for text in one cell.
  const gridCols = Math.max(1, Math.min(list.length, list.length > 4 ? Math.ceil(list.length / Math.ceil(list.length / 4)) : 4));
  const cellW = Math.floor((840 - (gridCols - 1) * (list.length > 4 ? 6 : 10)) / gridCols) - 14;

  if (d.store) {
    // The mock-ups' `store` page: floors down the left, this floor's goods with their prices, who a good helps, the clerk's text box.
    const S = d.store, tall = S.floors.length > 5;
    const floors = `<div class="abs col" style="left:24px;top:76px;width:210px;gap:${tall ? 5 : 7}px">${S.floors.map((f) => `<div class="btn${f.on ? ' on' : ''}" style="height:${tall ? 38 : 44}px;cursor:default"><b>${esc(f.tag)}</b><small>${esc(f.name)}</small></div>`).join('')}</div>`;
    const tight = list.length > 5;
    const goods = `<div class="abs col" style="left:260px;right:24px;top:92px;gap:${tight ? 5 : 7}px">${list.map((x, k) => { const g = priceOf(x.label); return `<div class="btn${lit(k) ? ' on' : ''}" style="${tight ? 'height:36px;' : ''}${x.locked ? 'opacity:.5;' : ''}cursor:pointer"${btnAct(k)}><span class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g ? g.name : x.label)}</span>${g ? `<span>${esc(g.price)}</span>` : x.chance ? `<small>${esc(x.chance)}</small>` : ''}</div>`; }).join('')}</div>`;
    const cash = d.money === null ? '' : `<span class="tg" style="position:absolute;right:20px;top:60px">₽ ${d.money.toLocaleString('en-US')}</span>`;
    const why = !out && ch[d.index]?.locked && ch[d.index]!.sub ? `<span class="acc"> ${esc(ch[d.index]!.sub)}</span>` : '';
    return H(S.title, 'shop', [['Enter', out || more ? 'next' : 'choose']]) + cash + floors + goods + partyStrip(S.party, 'left:24px;right:24px;bottom:112px', out ? undefined : S.notes[d.index]) + TX(`<div style="font-size:${len > 190 ? 14 : len > 110 ? 16 : 18}px;line-height:1.3">${lineP}${why}</div>${mark('right:14px;top:4px')}`, d.speaker ?? S.clerk) + outcome + turn + picker;
  }
  if (v === 1) {
    return letter(back + amb + star(480) + foot(300, 478, who(280))) + `<div class="abs sm" style="left:20px;top:74px;color:#fff;z-index:6">${esc(d.name)}</div><div class="abs" style="left:20px;top:16px;z-index:7">${q}</div><div class="abs" style="left:120px;right:120px;bottom:${132 + Math.max(0, Math.ceil(list.length / 4) - 1) * 52}px;text-align:center;color:#fff;font-size:${len > 220 ? 15 : len > 120 ? 18 : 21}px;line-height:1.35;text-shadow:2px 2px 0 #000;z-index:6">${line}${mark('right:-60px;bottom:0;color:#fff')}</div><div class="abs" style="left:60px;right:60px;bottom:74px;z-index:6;display:grid;grid-template-columns:repeat(${gridCols},1fr);gap:${list.length > 4 ? 6 : 10}px">${list.map((x, k) => B(esc(x.label), lit(k), `justify-content:center;text-align:center;font-size:14px;padding:0 6px;height:46px${x.locked ? ';opacity:.5' : ''}${fit(x, cellW, 14, false)}`, '', btnAct(k))).join('')}</div>${d.timer !== null && !out ? `<div class="abs hp gold" style="left:60px;right:60px;bottom:22px;height:6px;z-index:6"><i style="width:${Math.round(d.timer * 100)}%"></i></div>` : ''}<div class="abs sm" style="left:60px;right:60px;bottom:44px;z-index:6;color:#fff;text-align:center;text-shadow:1px 1px 0 #000">${esc(list[out ? 0 : d.index] ? sub(list[out ? 0 : d.index]!) : '')}</div>` + strip('left:60px;right:60px;top:98px') + title + standing(`position:absolute;left:20px;top:${sTop(100)}px;width:250px;z-index:7`) + outcome + picker + turn;
  }
  if (v === 2) {
    // More than five choices (the tutorial's lessons) stand in two columns, read down the first and then the second.
    const two = list.length > 5;
    return back + amb + '<div class="shade" style="background:#060a1870"></div>' + star(700) + foot(d.mon ? 250 : 720, 540, who(310)) + `<div class="abs win glass" style="left:0;right:0;bottom:0;height:176px;padding:20px 60px;border-radius:0;clip-path:none"><div class="plate" style="position:absolute;left:60px;top:-18px">${esc(plate)}</div><div style="font-size:${len > 200 || d.lines.length > 3 ? 17 : 20}px;line-height:1.4">${lineP}</div>${mark('right:24px;top:8px')}<div class="abs row sm" style="right:24px;bottom:10px;gap:14px"><span>${esc(list[out ? 0 : d.index] ? sub(list[out ? 0 : d.index]!) : '')}</span></div></div><div class="abs ${two ? '' : 'col'}" style="${two ? `left:40px;width:610px;display:grid;grid-auto-flow:column;grid-template-rows:repeat(${Math.ceil(list.length / 2)},auto);grid-auto-columns:1fr;column-gap:10px` : 'left:180px;width:420px'};top:${d.rounds ? 104 : two ? 70 : 86}px;gap:${two ? 6 : d.rounds && list.length > 3 ? 5 : 9}px">${list.map((x, k) => B(esc(x.label) + pct(x), lit(k), `justify-content:center;text-align:center${x.locked ? ';opacity:.5' : ''}${fit(x, two ? 260 : 380, two ? 15 : 18)}${two && !fit(x, 260, 15) ? ';font-size:15px' : ''}`, '', btnAct(k))).join('')}</div><div class="abs" style="left:20px;top:16px">${q}</div>` + strip('left:20px;right:20px;top:48px') + title + standing(`position:absolute;right:24px;top:${sTop(52)}px;width:250px;z-index:7`) + (d.standing || d.rounds ? outcome.replace('right:24px;top:70px', `right:24px;top:${d.standing ? sTop(186) : 104}px`) : outcome) + picker + turn;
  }
  if (v === 3) {
    // A long list gets one-line cards so every choice stays on screen.
    const many = list.length > 6;
    return `<div class="abs" style="left:16px;top:16px;width:560px;bottom:16px;overflow:hidden;box-shadow:0 0 0 4px var(--pa),0 0 0 8px var(--l);transform:rotate(-.6deg)">${back + amb}${star(150)}${foot(d.mon ? 400 : 280, 520, who(280))}${strip('left:10px;right:10px;bottom:10px')}${title}<div class="abs txt" style="left:16px;right:16px;top:16px;font-size:${len > 200 || d.lines.length > 3 ? 15 : 17}px;line-height:1.35">${line}${mark('right:10px;bottom:2px')}</div></div><div class="abs col" style="left:604px;right:20px;top:20px;gap:${many ? 6 : 10}px">${W(`<div class="row"><b class="grow" style="font-size:20px">${esc(d.name)}</b></div><span class="tg">${esc(d.tag)}</span>${d.money === null && !d.countdown ? '' : `<div class="sm">${d.money === null ? '' : `₽ ${d.money.toLocaleString('en-US')}`}${d.countdown ? ` · <b class="acc">${esc(d.countdown)}</b>` : ''}</div>`}`, 'display:flex;flex-direction:column;gap:6px')}${standing('', '')}${list.map((x, k) => W(`<b style="font-size:${many ? 13 : 15}px${many ? ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis' : ''}">${esc(x.label)}</b>${many && !x.sub && !x.chance ? '' : `<div class="row sm"><span class="grow">${esc(x.sub)}</span><b>${esc(x.chance || '—')}</b></div>`}`, `padding:${many ? '5px 12px' : '8px 12px'};display:flex;flex-direction:column;gap:3px${x.locked ? ';opacity:.55' : ''}`, lit(k) ? 'sel' : '', btnAct(k))).join('')}</div>` + (outcome ? outcome.replace('right:24px;top:70px', 'left:40px;top:300px') : '') + picker + turn;
  }
  // A long list (the tutorial's ten lessons) gets shorter buttons so the whole list stays on screen under the tag.
  const room = 540 - (rows * 25 + 72) - 44, tight = list.length * 52 > room, step = tight ? Math.max(26, Math.floor(room / list.length)) : 52;
  return back + amb + star(d.cast ? 520 : 300) + foot(d.mon && !d.cast ? 220 : 250, 416, who(240)) + `<div class="abs" style="left:20px;top:16px">${q}</div><div class="abs col" style="right:24px;bottom:${rows * 25 + 72}px;width:340px;gap:${tight ? 4 : 8}px">${list.map((x, k) => B(esc(x.label) + pct(x), lit(k), (tight ? `height:${step - 4}px;font-size:${step < 40 ? 14 : 16}px;` : '') + (x.locked ? 'opacity:.5' : '') + fit(x, 300, tight ? 14 : 18), '', btnAct(k))).join('')}</div>${!out && ch[d.index]?.sub ? `<div class="abs sm" style="right:24px;bottom:${(rows * 25 + 72) + ch.length * step + 2}px;width:340px;color:#fff;text-shadow:1px 1px 0 #000;text-align:right;line-height:16px">${esc(ch[d.index]!.sub)}</div>` : ''}` + TX(lineP + mark('right:14px;bottom:2px'), plate) + strip('left:20px;right:20px;top:48px') + title + standing(`position:absolute;left:20px;top:${sTop(52)}px;width:250px;z-index:7`) + (d.rounds ? outcome.replace('right:24px;top:70px', 'right:24px;top:104px') : outcome) + picker + turn;
}
