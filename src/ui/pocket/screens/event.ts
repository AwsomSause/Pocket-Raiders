// The Pocket look's event pages (mock-up pages `event`, `ev-choice`, `ev-result`, `ev-reward`): the talk with the
// player on the left and whoever speaks on the right, the choice as three big cards over the text bar, the outcome's
// text with what it found, and the rewards as stamped cards. It draws the New UI event's model
// (ui/redux/screens/event.ts) and calls the same handlers; EventScene keeps the state. The ALL EVENTS rule holds: text
// stays until input, and what changed shows only after the text is closed.
// For the animations thread's playback every page has a root (`data-key="ev"`) with a state class (`is-in`, `is-hold`,
// `is-out`), its times as `--pk-in` / `--pk-out`, and a `data-key` on each part it may move. Presentation only.

import { changeVisual, type ChangeKind, type ChoiceIcon, type Tone } from '../../../core/presentation/eventVisuals';
import { EVENT_BACKDROPS, type EventBackdrop } from '../../../core/presentation/eventStyles';
import type { SetKind, Daypart } from '../../../core/presentation/eventVisuals';
import { rxUrl as rxBg } from '../../redux/assets';
import { changeParts, plainLook, type EventChoice, type EventLook, type EventModel } from '../../redux/screens/event';
import { ballArt, itemArt, monArt, pkGone, type PkArt } from '../art';
import { act, esc, hp, keys, page, type PkKey, spr, sprH } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';
import type { PkCue } from './cards';

/** How long an event page's entrance and exit take, in seconds. */
export const PK_EVENT_TIMES = { in: 0.5, out: 0.25 } as const;
const STEPS = ['Talk', 'Choose', 'Result', 'Reward'] as const;

/** The card colour of a choice (the mock-up's risky red, costly gold, safe green), from how the scene leans on it. */
export type PkDeal = 'risk' | 'cost' | 'safe';
export const dealOf = (tone: Tone | undefined, x: EventChoice): PkDeal =>
  tone === 'danger' || tone === 'bold' || tone === 'luck' ? 'risk' : tone === 'deal' || /₽\s?[\d,]+/.test(`${x.label} ${x.sub}`) ? 'cost' : 'safe';
/** The word on a card's tag: Risky (with its odds), Costs ₽ N, or Safe. */
export function dealWord(deal: PkDeal, x: EventChoice, odds: number | null): string {
  if (x.locked) return 'Locked';
  if (deal === 'cost') { const m = /₽\s?([\d,]+)/.exec(`${x.label} ${x.sub}`); return m ? `Costs ₽ ${m[1]}` : 'A deal'; }
  if (deal === 'risk') return odds !== null ? `Risky · ${odds}%` : x.chance ? `Risky · ${x.chance}` : 'Risky';
  return x.chance ? `Safe · ${x.chance}` : 'Safe';
}
/** The picture on a choice card, by what kind of deed it is. */
const DEED_ART: Record<ChoiceIcon, PkArt> = {
  battle: itemArt('muscle_band'), catch: ballArt('pb'), trade: itemArt('nugget'), coin: itemArt('amulet_coin'), dice: itemArt('quick_claw'), leave: itemArt('map'),
  care: itemArt('soothe_bell'), give: itemArt('mystery_egg'), take: itemArt('nugget'), talk: itemArt('wise_glasses'), look: itemArt('scanner'), rest: itemArt('potion'),
  train: itemArt('protein'), go: itemArt('map'), pick: itemArt('shiny_charm'), star: itemArt('shiny_charm'), lock: itemArt('metal_coat'),
};
/** The picture on a reward card, by what the line is about. */
const CHANGE_ART: Record<ChangeKind, PkArt> = {
  money: itemArt('amulet_coin'), heal: itemArt('potion'), hurt: itemArt('lucky_punch'), join: ballArt('pb'), bond: itemArt('soothe_bell'), item: itemArt('mystery_egg'),
  learn: itemArt('exp_candy_m'), trade: itemArt('nugget'), evil: itemArt('metal_coat'), stat: itemArt('protein'), note: itemArt('calendar'),
};
const KIND_WORD: Record<ChangeKind, string> = { money: 'Money', heal: 'Healed', hurt: 'Hurt', join: 'Joined you', bond: 'Bond', item: 'Item', learn: 'Learned', trade: 'Trade', evil: 'Standing', stat: 'Stat', note: 'This run' };

/** A place that is drawn in the New UI (it has no picture) gets the nearest of the mock-ups' backdrops (Pokémon Memories). */
const SET_BG: Record<SetKind, EventBackdrop> = { wilds: 'field', skyline: 'city', room: 'indoor', hall: 'indoor', shop: 'indoor', ruins: 'ruins', snow: 'snow', deck: 'water', fair: 'city', void: 'cave', camp: 'forest' };
export function pkEventBg(d: Pick<EventModel, 'art'>, L: EventLook): string {
  if (L.scene.pic) return L.scene.pic;
  if (d.art && !L.scene.inside) return d.art;
  const bg = SET_BG[L.scene.set], times: readonly string[] = EVENT_BACKDROPS[bg];
  const want: Daypart = L.scene.set === 'camp' ? 'night' : L.scene.time;
  const t = L.scene.inside ? 'day' : times.includes(want) ? want : times[want === 'day' ? 0 : times.length - 1]!;
  return `packs/memories/eventbg/${t === 'day' ? bg : `${bg}_${t}`}.png`;
}

/** The text of a page in one string (the speaker's own lines need no name; a narrator's lines are plain). */
export function pageText(d: Pick<EventModel, 'lines' | 'speaker'>): string {
  return d.lines.map((l) => (l.who === null || l.who === d.speaker ? l.text : `${l.who}: ${l.text}`)).join('\n');
}
/** A card's lines: its small print split into short points (at most `max`). */
export function points(sub: string, max: number): string[] {
  return sub.split(/(?<=[.!?;])\s+/).map((s) => s.replace(/[.;]$/, '').trim()).filter(Boolean).slice(0, max);
}

const root = (cls: string, cue: PkCue): string =>
  `<div class="scr event e9 ${cls} gx-cue gx-ev is-${cue}" data-key="ev" style="--pk-in:${PK_EVENT_TIMES.in}s;--pk-out:${PK_EVENT_TIMES.out}s">`;

/** The band at the top left: the event's tag, its name, and where it happens. */
function where(d: EventModel, L: EventLook): string {
  const p = d.place, sky = L.scene.weather && L.scene.weather !== 'sparkle' && L.scene.weather !== 'glint' ? L.scene.weather.charAt(0).toUpperCase() + L.scene.weather.slice(1) : '';
  const at = [p ? `${p.region}${p.of ? ` · Stage ${p.no}` : ''}` : '', p?.sub ?? '', sky].filter(Boolean).join(' · ');
  const urgent = d.timer !== null && d.timer < 0.25 ? ' urgent' : '';
  const chips = (d.money === null ? '' : `<i class="gx-ev-chip">₽ ${d.money.toLocaleString('en-US')}</i>`) + (d.countdown ? `<i class="gx-ev-chip hot${urgent}">${esc(d.countdown)}</i>` : '')
    + (d.cardHint ? `<i class="gx-ev-chip k"${act('card')}><kbd>T</kbd>Trade card</i>` : '') + (d.teamHint ? `<i class="gx-ev-chip k"${act('team')}><kbd>R</kbd>Their team</i>` : '');
  // The band holds the tag, the name and the place in 600px: a long tag reads "Event", the place goes before the name shrinks past 22px.
  const tag = d.tag.length <= 12 ? d.tag : 'Event', left = 600 - 40 - tag.length * 8;
  const place = at && d.name.length * 22 * 0.55 + at.length * 7 + 12 <= left ? at : '';
  const size = fit(d.name, left - (place ? place.length * 7 + 12 : 0), 32, 16, 0.55);
  return `<div class="ev-where" data-m="hdr" data-key="ev-where" title="${esc(d.tag)}"><em>${esc(tag)}</em><b style="font-size:${size}px">${esc(d.name)}</b>${place ? `<span>${esc(place)}</span>` : ''}</div>`
    + (chips ? `<div class="gx-ev-chips" data-key="ev-chips">${chips}</div>` : '')
    + (d.timer !== null && !d.outcome ? `<div class="gx-ev-timer${urgent}"><i style="width:${Math.round(d.timer * 100)}%"></i></div>` : '');
}
const beats = (at: number): string => `<div class="beats" data-key="ev-beats">${STEPS.map((t, k) => `<i class="${k < at ? 'past' : k === at ? 'on' : ''}">${k + 1} ${t}</i>`).join('')}</div>`;

/** The tournament's rounds, the big title (the champion) and the standing panel. */
function extras(d: EventModel): string {
  const rounds = d.rounds ? `<div class="gx-ev-rounds" data-key="ev-rounds"${act('bracket')}>${d.rounds.map((r) => `<div class="${r.state}"><small>${r.state === 'won' ? '✓ ' : r.state === 'next' ? '▶ ' : ''}${esc(r.name)}</small><b>${esc(r.who)}</b></div>`).join('')}</div>` : '';
  const title = d.title ? `<div class="gx-ev-title" data-key="ev-title">${esc(d.title)}</div>` : '';
  const stand = d.standing ? `<div class="pn gx-ev-stand" data-key="ev-stand"><div class="gx-fact"><span>Standing</span><b>${esc(d.standing.rank)}</b></div>${d.standing.meters.slice(0, 3).map((m) => `<div class="gx-ev-meter"><span>${esc(m.label)}</span>${hp(m.max > 0 ? (100 * m.value) / m.max : 0)}<b>${m.value}/${m.max}</b></div>`).join('')}</div>` : '';
  return rounds + title + stand;
}

/** The player and their lead Pokémon (left), whoever is in the scene (right), its Pokémon, the things the text names. */
function cast(d: EventModel, L: EventLook, glow: boolean): string {
  const lead = L.speaking >= 0 ? L.speaking : 0, npc = pkArtOf(L.cast[lead]);
  const me = pkArtOf(d.me ?? null), buddy = d.lead ?? null;
  const you = me || buddy ? `<div class="ev-you" data-key="ev-you">${me ? sprH(me, 207) : ''}${buddy ? fitPic(monArt(buddy), 170, 170, '', 3) : ''}</div>` : '';
  const others = L.cast.map((a, i) => (i === lead ? '' : sprH(pkArtOf(a), 240))).join('');
  const emote = L.emote ? `<i class="gx-ev-emo" data-key="ev-emo">${spr({ file: L.emote, whole: true }, 2)}</i>` : '';
  const far = npc && L.mons.length ? ' gx-ev-far' : '';
  const them = npc ? `<div class="ev-npc${far}${L.speaking >= 0 && L.speaking !== lead ? ' hush' : ''}" data-key="ev-npc">${emote}${sprH(npc, 308)}</div>` + (others ? `<div class="ev-npc gx-ev-more${far}" data-key="ev-more">${others}</div>` : '') : '';
  const mons = L.mons.length ? `<div class="ev-mon${npc ? ' gx-ev-side' : ''}" data-key="ev-mon">${glow ? '<i class="ev-glow"></i>' : ''}${L.mons.map((f, i) => fitPic(monArt(f), i ? 140 : 230, i ? 140 : 230, '', 3)).join('')}${npc ? '' : emote}</div>` : '';
  const props = L.props.length ? `<div class="gx-ev-props" data-key="ev-props">${L.props.map((f) => fitPic({ file: f, whole: true }, 48, 48, '', 2)).join('')}</div>` : '';
  return you + them + mons + props;
}

/** The text bar: the speaker's face in a circle and their name on a tab, the page, and the mark that it waits. */
function bar(d: EventModel, L: EventLook, go: string, waits: boolean): string {
  const who = L.speaking >= 0 ? pkArtOf(L.cast[L.speaking]) : null, text = pageText(d);
  const fail = d.outcome && !d.outcome.ok ? '<b class="gx-ev-fail">It didn’t go your way… </b>' : '';
  const size = fitBody(text + (fail ? ' It didn’t go your way… ' : ''), d.speaker ? 700 : 820, 86, [17, 16, 15, 14, 13, 12], 1.45);
  const lines = d.lines.map((l) => (l.who === null || l.who === d.speaker ? esc(l.text) : `<b class="gx-ev-who">${esc(l.who)}</b> ${esc(l.text)}`)).join('<br>');
  const pg = d.page.of > 1 ? `<small class="gx-ev-pg">${d.page.at + 1}/${d.page.of}</small>` : '';
  return `<div class="tb${d.speaker ? ' sp' : ''} talk" data-m="tb" data-key="ev-tb"${go}>${d.speaker && who ? `<i class="por">${sprH(who, 154)}</i>` : ''}${d.speaker ? `<b class="tb-w">${esc(d.speaker)}</b>` : ''}<p style="font-size:${size}px">${fail}${lines}</p>${waits ? `<em class="tb-go">${pg}<kbd>Enter</kbd></em>` : pg ? `<em class="tb-go">${pg}</em>` : ''}</div>`;
}

/** The choices as cards: three stand tall side by side; more stand in rows and say less. */
function cards(d: EventModel, L: EventLook, ch: readonly EventChoice[]): string {
  const n = ch.length, cols = n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : 4, rows = Math.ceil(n / cols), low = !!d.rounds || !!d.standing;
  const H = (low ? 216 : 252), gap = 16, h = Math.floor((H - (rows - 1) * 12) / rows), w = Math.floor((904 - (cols - 1) * gap) / cols);
  const tall = rows === 1, many = rows > 2;
  const list = ch.map((x, k) => {
    const v = L.choices[k], deal = dealOf(v?.tone, x), odds = v?.odds ?? null;
    // The tag already says what it costs.
    const pts = tall ? points(x.sub, w > 260 ? 3 : 2).filter((t) => deal !== 'cost' || !/^costs?\s*₽/i.test(t)) : [];
    if (tall && odds !== null && !x.locked) pts.push(`Works ${odds}% of the time`);
    const room = (w - 36) * (tall ? 2 : many ? 1 : 1.6);
    const tag = `<span class="ch-top">${many ? '' : `<i class="ch-ic">${fitPic(x.locked ? itemArt('metal_coat') : DEED_ART[v?.icon ?? 'star'], tall ? 64 : 40, tall ? 64 : 40, '', 2)}</i>`}<em>${esc(dealWord(deal, x, odds))}</em></span>`;
    return `<div class="chc ${deal}${k === d.index ? ' on' : ''}${x.locked ? ' gx-off' : ''}" data-key="ev-ch-${k}" style="height:${h}px"${act('pick', k, 'over')}>${tag}<b style="font-size:${fit(x.label, room, tall ? 30 : 24, 14, 0.5)}px">${esc(x.label)}</b>${pts.length ? `<ul style="font-size:${pts.join(' ').length > 120 ? 12 : 13.5}px">${pts.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>`;
  }).join('');
  const lit = ch[d.index], note = !tall && lit?.sub ? `<div class="gx-ev-note" data-key="ev-note">${esc(lit.sub)}</div>` : '';
  return `<div class="ch-row${low ? ' gx-low' : ''}${tall ? '' : ' gx-many'}" data-key="ev-row" style="grid-template-columns:repeat(${cols},${w}px)">${list}</div>${note}`;
}

/** What changed, as stamped cards (they stay until Enter). */
function rewards(d: EventModel, L: EventLook, changes: readonly string[]): string {
  const n = changes.length, small = n > 3, cols = n <= 4 ? Math.max(1, n) : n <= 6 ? 3 : 4;
  const cardsHtml = changes.map((t, i) => {
    const v = changeVisual(t), [a, b] = changeParts(t), what = a.charAt(0).toUpperCase() + a.slice(1);
    // The item itself when its picture is there; a Pokémon that joined is the event's own Pokémon.
    const named = itemArt(a.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')), guess: PkArt = { file: named.file };
    const art: PkArt = v.kind === 'join' && L.mons[0] ? monArt(L.mons[0]) : v.kind === 'item' && !pkGone(guess) ? guess : CHANGE_ART[v.kind];
    const title = v.kind === 'money' && b ? `₽ ${b.replace(/^[+]?₽/, '')}` : what, line = v.kind === 'money' ? KIND_WORD.money : b || KIND_WORD[v.kind];
    return `<div class="erc${v.good ? '' : ' gx-bad'}" data-key="ev-rw-${i}"><i class="erc-ic">${fitPic(art, small ? 44 : 64, small ? 44 : 64, '', 2)}</i><b style="font-size:${fit(title, small ? 150 : 190, small ? 22 : 30, 13, 0.5)}px">${esc(title)}</b><span>${esc(line)}</span></div>`;
  }).join('');
  const good = changes.some((t) => changeVisual(t).good);
  return `<div class="erw-h" data-key="ev-rw-h"><b>${d.outcome?.ok && good ? 'You received' : 'What changed'}</b></div><div class="erw-row${small ? ' gx-small' : ''}" data-key="ev-rw" style="--cols:${cols}">${cardsHtml}</div>`;
}

/** The Pokémon picker of a trade or a gift: the list, and for a trade both sides of it. */
function picker(d: EventModel): string {
  const p = d.pick;
  if (!p) return '';
  const side = (title: string, x: { name: string; file: string | null } | null): string => `<div class="gx-pk-side"><small>${title}</small>${x?.file ? fitPic(monArt(x.file), 96, 80, '', 2) : `<b class="gx-q">?</b>`}<b>${esc(x?.name ?? 'Not known yet')}</b></div>`;
  const card = p.card ? `<div class="gx-pk-card">${side('You give', p.card.give)}<i>⇄</i>${side('You get', p.card.get)}</div>` : '';
  const tight = p.labels.length > (card ? 4 : 7);
  return `<div class="gx-shade" data-key="ev-pick-dim"></div><div class="pn gx-pick${tight ? ' tight' : ''}" data-key="ev-pick"><b class="gx-pick-t">${card ? 'The trade, both sides' : 'Pick a Pokémon'}</b>${card}<div class="gx-pick-list">${p.labels.map((t, k) => `<div class="btn sm${k === p.at ? ' on' : ''}"${act('trade', k, 'tradeOver')}><b>${esc(t)}</b></div>`).join('')}</div><span class="gx-pick-k"><kbd>Enter</kbd>${card ? 'trade' : 'choose'} <kbd>Esc</kbd>back</span></div>`;
}

/** An event, drawn from the New UI event's model. */
export function pkEvent(d: EventModel, cue: PkCue = 'in'): string {
  const out = d.outcome, more = d.page.at < d.page.of - 1, ch = out || more ? [] : d.choices;
  const L = d.look ?? plainLook(d);
  const bg = `<img class="px ar-bg${ch.length || out?.step === 'rewards' ? ' dim' : ''}" data-key="ev-bg" src="${esc(rxBg(pkEventBg(d, L)))}" alt=""><i class="ev-vig"></i>`;
  const back: PkKey[] = d.page.at > 0 && !out ? [['Esc', 'read back', 'page', -1]] : [];
  const extra: PkKey[] = [...(d.rounds ? [['B', 'bracket', 'bracket'] as const] : []), ...(d.cardHint ? [['T', 'trade card', 'card'] as const] : []), ...(d.teamHint ? [['R', 'their team', 'team'] as const] : [])];
  if (out?.step === 'rewards') {
    return page('ev-reward', 26, root('erw', cue) + bg + where(d, L) + beats(3) + rewards(d, L, out.changes)
      + `<div class="tb talk" data-m="tb" data-key="ev-tb"${act('next')}><p>The rewards stay on screen until you press Enter.</p><em class="tb-go"><kbd>Enter</kbd></em></div>`
      + keys([['Enter', out.next.toLowerCase(), 'next']]) + '</div>');
  }
  if (d.scare && !out) {
    // The black screen, then the face: nothing else is on show but the text bar.
    const face = d.scare === 'face' && L.mons[0] ? `<div class="gx-ev-scare" data-key="ev-scare">${fitPic(monArt(L.mons[0]), 900, 520, '', 9)}</div>` : '';
    return page('event', 26, root('gx-dark', cue) + face + bar(d, L, more ? act('page', 1) : '', true) + keys([['Enter', 'next', more ? 'page' : undefined, more ? 1 : undefined]]) + '</div>');
  }
  if (ch.length) {
    // The choice: the scene steps back, the cards come up and the question stays in the text bar.
    return page('ev-choice', 26, root('ec26 ech', cue) + bg + where(d, L) + beats(1) + extras(d) + cards(d, L, ch) + bar(d, L, '', false) + picker(d)
      + keys([['←→', 'move'], ['Enter', 'choose', 'pick', d.index], ...back, ...extra]) + '</div>');
  }
  // The talk, and the outcome's text.
  const label = more ? 'next' : out ? (out.changes.length ? 'continue' : out.next.toLowerCase()) : 'next';
  const go = out ? act('next') : more ? act('page', 1) : '';
  return page(out ? 'ev-result' : 'event', 26, root(out ? 'ers' : '', cue) + bg + where(d, L) + beats(out ? 2 : 0) + extras(d) + cast(d, L, !!out)
    + bar(d, L, go, true) + picker(d) + (go ? `<div class="gx-hit gx-ev-hit"${go}></div>` : '')
    + keys([['Enter', label, out ? 'next' : more ? 'page' : undefined, more && !out ? 1 : undefined], ...back, ...extra]) + '</div>');
}
