// Phantom UI: an event as the mock-ups' five-step scene (`event`, `choice`, `sy-result`, `sy-reward`): the talk with
// the speaker's bust and a waiting text box, the choice as a hand of cards, the outcome as a narration card with the
// reward still sealed, and the reward as cards that open. It draws the New UI event's model (ui/redux/screens/event.ts)
// and calls the same handlers; EventScene keeps the state. The ALL EVENTS rule holds: text stays until input, and what
// changed shows only after the text is closed. Presentation only.

import { changeVisual, lineVisual, type ChangeKind, type ChoiceIcon, type Tone, type Weather } from '../../../core/presentation/eventVisuals';
import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxAtlas } from '../../redux/assets';
import { scenery } from '../../redux/eventScenery';
import { icon } from '../../redux/kit';
import { CHANGE_ICON, changeParts, ic, plainLook, type EventChoice, type EventLook, type EventModel } from '../../redux/screens/event';
import type { ScriptLine } from '../../redux/script';
import { figure } from '../../redux/templates';
import { act, esc, hp, keys, mon, page, ransom } from '../kit';

const STEPS = ['Talk', 'Choose', 'Outcome', 'Reward'] as const;
/** The weather a talk page can ask for by name. */
const FX = ['rain', 'snow', 'fog', 'sparkle', 'glint', 'fire', 'hearts', 'flicker'] as const;
/** What kind of deed a choice is (the New UI shows it as an icon), in a word or two, and the card colour that goes with it. */
const DEED: Record<ChoiceIcon, [string, string]> = {
  battle: ['A fight', 'fight'], catch: ['A catch', 'fight'], trade: ['A trade', 'cost'], coin: ['It costs', 'cost'], dice: ['A gamble', 'cost'], leave: ['Walk away', 'safe'], care: ['A kind act', 'safe'], give: ['Give', 'safe'], take: ['Take', 'safe'],
  talk: ['Say it', 'safe'], look: ['A closer look', 'safe'], rest: ['Rest', 'safe'], train: ['Train', 'safe'], go: ['Go', 'safe'], pick: ['Your pick', 'safe'], star: ['Your call', 'safe'], lock: ['Locked', 'safe'],
};
const KIND_WORD: Record<ChangeKind, string> = { money: 'Money', heal: 'Healed', hurt: 'Hurt', join: 'Joined you', bond: 'Bond', item: 'Item', learn: 'Learned', trade: 'Trade', evil: 'Standing', stat: 'Stat', note: 'This run' };

/** The step strip at the top right: the event's name and where in it the player is. */
const strip = (name: string, at: number, steps = true): string =>
  `<div class="sy-st${steps ? '' : ' ph-st-talk'}"${steps ? ` aria-label="step ${at + 1} of ${STEPS.length}"` : ''}><b style="font-size:${name.length > 40 ? 15 : name.length > 28 ? 19 : 24}px">${esc(name)}</b>${steps ? `<div>${STEPS.map((t, k) => `<span class="${k < at ? 'd' : k === at ? 'on' : ''}"><i></i>${t}</span>`).join('')}</div>` : ''}</div>`;

/** The drawn scene of the event, at the Phantom page's size. */
const backdrop = (L: EventLook, dim: number, strips = true): string =>
  `<div class="rx ph-scn" aria-hidden="true"><div>${scenery(L.scene)}</div></div><div class="dim" style="background:rgba(8,6,10,${dim})"></div>${strips ? '<div class="strip r" aria-hidden="true"></div><div class="strip" aria-hidden="true"></div>' : ''}`;

/** Everyone in the scene: the speaker (or the first person) as the big bust, the others, the Pokémon and the things the text names beside them. */
function cast(L: EventLook, tone: Tone | null, hush: boolean): string {
  const lead = L.speaking >= 0 ? L.speaking : 0, a = L.cast[lead];
  const bust = a ? `<div class="bust ph-ev-bust${tone ? ` t-${tone}` : ''}${hush ? ' hush' : ''}" data-key="bust:${esc(a.file)}"><div class="ph-ev-sh">${figure(a, 540)}</div><div class="ph-ev-fig">${figure(a, 540)}</div></div>` : '';
  const others = L.cast.map((x, i) => (i === lead ? '' : `<div class="ph-ev-other${L.speaking >= 0 ? ' hush' : ''}" style="--i:${i}">${figure(x, 250)}</div>`)).join('');
  const base = a ? (L.cast.length > 1 ? 2.6 : 3.4) : 4.4;
  const mons = L.mons.map((file, i) => {
    const rel = L.monSize?.[i], h0 = rxAtlas(L.mons[0]!)?.f[0]?.[3], h = rxAtlas(file)?.f[0]?.[3];
    const z = rel && h0 && h ? (base * h0 * rel) / h : i === 0 ? base : base * 0.62;
    return `<div class="ph-ev-mon${!a && i === 0 && tone ? ` t-${tone}` : ''}" style="--i:${i}">${mon(file, Number(z.toFixed(2)), 'ol', '', true)}</div>`;
  }).join('');
  const buddy = L.buddy && !L.cast.length && !L.mons.length ? `<div class="ph-ev-mon ph-ev-buddy${tone ? ` t-${tone}` : ''}">${mon(L.buddy, 4, 'ol', '', true)}</div>` : '';
  const props = L.props.map((file, i) => `<div class="ph-ev-prop" style="--i:${i}">${icon(file, 64)}</div>`).join('');
  const emote = L.emote ? `<div class="sy-emo${a ? '' : ' ph-emo-m'}" data-key="emo:${esc(L.emote)}">${icon(L.emote, 60)}</div>` : '';
  return `${bust}<div class="ph-ev-row${a ? '' : ' wide'}">${others}${mons}${buddy}${props}</div>${emote}`;
}

/** The page's lines, said the way they are written. `plated`: the speaker is on the name plate, so their own lines carry no name. */
function lines(d: EventModel, key: string): string {
  const talk = d.lines.some((l) => l.who !== null);
  return d.lines.map((l: ScriptLine, i) => {
    const v = lineVisual(l.text).voice;
    const body = l.who === null ? (talk ? `<i>${esc(l.text)}</i>` : esc(l.text)) : l.who === d.speaker ? esc(l.text) : `<em>${esc(l.who)}</em> ${esc(l.text)}`;
    return `<span class="ph-ln${v === 'plain' ? '' : ` v-${v}`}" data-key="ln:${key}:${i}" style="--i:${i}">${body}</span>`;
  }).join('<br>');
}
const lettersOf = (d: EventModel): number => d.lines.reduce((n, l) => n + l.text.length + (l.who && l.who !== d.speaker ? l.who.length + 1 : 0), 0);

/** The top of the page: the stage (or the tournament's rounds), the step strip, the chips and the timer, the big title and the standing. */
function top(d: EventModel, step: number, steps: boolean): string {
  const p = d.place;
  const day = d.rounds
    ? `<div class="ph-ev-rounds"${act('bracket')}>${d.rounds.map((r) => `<div class="${r.state === 'next' ? 'on' : r.state === 'won' ? 'won' : 'ahead'}"><small>${r.state === 'won' ? '✓ ' : r.state === 'next' ? '▶ ' : ''}${esc(r.name)}</small><b>${esc(r.who)}</b></div>`).join('')}</div>`
    : p ? `<div class="day ph-day"><b>${esc(p.no)}</b><div>Stage<span>${p.of ? `of ${esc(p.of)}` : ''}</span></div><strong style="font-size:${p.region.length > 14 ? 22 : 30}px">${esc(p.region)}</strong><i>${esc(p.sub.toUpperCase())}</i></div>` : '';
  const urgent = d.timer !== null && d.timer < 0.25 ? ' urgent' : '';
  const chips = `<div class="ph-ev-chips"><span>${esc(d.tag)}</span>${d.money === null ? '' : `<span class="k">₽${d.money.toLocaleString('en-US')}</span>`}${d.countdown ? `<span class="hot${urgent}">${esc(d.countdown)}</span>` : ''}${d.cardHint ? `<span class="k btn"${act('card')}><b>T</b>Trade card</span>` : ''}${d.teamHint ? `<span class="k btn"${act('team')}><b>R</b>Their team</span>` : ''}</div>`
    + (d.timer !== null && !d.outcome ? `<div class="ph-ev-timer${urgent}"><i style="width:${Math.round(d.timer * 100)}%"></i></div>` : '');
  const title = d.title ? `<div class="ph-ev-title">${ransom(d.title, 5)}</div>` : '';
  const stand = d.standing ? `<div class="pn ph-ev-stand${d.rounds || p ? '' : ' up'}"><span class="lab">Standing</span><h3 class="tl1">${esc(d.standing.rank)}</h3>${d.standing.meters.slice(0, 3).map((m) => `<div class="ph-ev-meter"><span>${esc(m.label)}</span>${hp(Math.max(0, Math.min(m.max, m.value)), Math.max(1, m.max), 'gold')}<b>${m.value}/${m.max}</b></div>`).join('')}</div>` : '';
  return day + strip(d.name, step, steps) + `<div class="${steps ? '' : 'ph-talk-top'}">${chips}</div>` + title + stand;
}

/** The text box: who speaks, the page, how many pages there are, and the mark that it waits for the player. */
function box(d: EventModel, key: string, wait: string, go: string): string {
  const n = lettersOf(d), fail = d.outcome && !d.outcome.ok ? '<em class="ph-ev-fail">It didn’t go your way… </em>' : '';
  const shout = d.lines.some((l) => lineVisual(l.text).voice === 'shout');
  const pages = d.page.of > 1 ? `<div class="sy-pg" aria-label="page ${d.page.at + 1} of ${d.page.of}">${Array.from({ length: Math.min(d.page.of, 12) }, (_, k) => `<i class="${k < d.page.at ? 'd' : k === d.page.at ? 'on' : ''}"></i>`).join('')}</div>` : '';
  return `<div class="sy-box ph-ev-box${d.speaker ? '' : ' nar'}${shout ? ' jolt' : ''}" data-key="box:${key}"${go}>${d.speaker ? `<div class="sy-nm"><b>${esc(d.speaker)}</b></div>` : ''}<p style="font-size:${n > 330 ? 19 : n > 240 ? 22 : n > 150 ? 24 : 27}px">${fail}${lines(d, key)}</p>${pages}<div class="sy-wait"><i aria-hidden="true"></i><kbd>↵</kbd><span>${esc(wait)}</span></div></div>`;
}

/** The choices as a hand of cards. Up to four stand side by side with their text; more are dealt as two rows, and the lit one's text is read out under them. */
function hand(d: EventModel, L: EventLook, ch: readonly EventChoice[], key: string): string {
  const n = ch.length, rowsOf = n > 4 ? 2 : 1, cols = Math.ceil(n / rowsOf), gap = n <= 3 ? 26 : 12;
  const w = n <= 3 ? 250 : Math.floor((854 - (cols - 1) * gap) / cols);
  const cards = ch.map((x, k) => {
    const v = L.choices[k], deed: ChoiceIcon = x.locked ? 'lock' : v?.icon ?? 'star', [word, cls] = DEED[deed];
    const odds = v?.odds ?? (/(\d+)\s*%/.exec(x.chance) ? Math.max(0, Math.min(100, Number(/(\d+)\s*%/.exec(x.chance)![1]))) : null);
    const meter = odds === null ? (x.chance ? `<small>${esc(x.chance)}</small>` : '<small class="none"></small>') : `<small class="ph-odds${odds >= 70 ? ' hi' : odds < 40 ? ' lo' : ''}"><i style="width:${odds}%"></i><u>${esc(x.chance || `${odds}%`)}</u></small>`;
    const room = (w - 44) * (rowsOf > 1 ? 2 : 3), size = Math.max(14, Math.min(rowsOf > 1 ? 22 : n > 3 ? 25 : 31, Math.floor(Math.sqrt((room * 30) / Math.max(1, x.label.length)))));
    const r = n <= 3 ? (k - (n - 1) / 2) * 5 : ((k % cols) - (cols - 1) / 2) * 1.2;
    return `<div class="sy-cd ph-cd ${cls}${k === d.index ? ' on' : ''}${x.locked ? ' off' : ''}" data-key="cd:${key}:${k}" style="--i:${k};--r:${r.toFixed(1)}deg;width:${w}px"${act('pick', k, 'over')}><kbd>${k + 1}</kbd><em>${ic(deed, 13)}${esc(word)}</em><b style="font-size:${size}px">${esc(x.label)}</b>${rowsOf > 1 ? '' : `<p style="font-size:${x.sub.length > 110 ? 14 : x.sub.length > 70 ? 16 : 18}px">${esc(x.sub)}</p>`}${meter}</div>`;
  }).join('');
  const lit = ch[d.index], buddy = L.buddy ?? L.mons[0] ?? null;
  const note = lit?.sub && (rowsOf > 1 || lit.locked) ? `<div class="sy-th ph-th" data-key="th:${d.index}">${buddy ? mon(buddy, 1.4, 'ol') : ''}<p>${esc(lit.sub)}</p></div>` : '';
  // Cards with nothing under their name (a talk page's answers) are short.
  const plain = rowsOf === 1 && ch.every((x) => !x.sub);
  return `<div class="sy-cds ph-cds${rowsOf > 1 ? ' two' : n > 3 ? ' four' : ''}${plain ? ' plain' : ''}" style="gap:${gap}px">${cards}</div>${note}`;
}

/** The Pokémon picker of a trade or a gift: the list, and for a trade both sides of it. */
function picker(d: EventModel): string {
  const p = d.pick;
  if (!p) return '';
  const side = (title: string, x: { name: string; file: string | null } | null): string => `<div class="ph-evp-side"><small>${title}</small><div>${x?.file ? mon(x.file, 1.6, 'ol') : `<b>${x ? '' : '?'}</b>`}</div><b>${esc(x?.name ?? 'Not known yet')}</b></div>`;
  const card = p.card ? `<div class="ph-evp-card">${side('You give', p.card.give)}<i>⇄</i>${side('You get', p.card.get)}</div>` : '';
  const tight = p.labels.length > (card ? 4 : 7);
  return `<div class="ph-shade" data-key="pick"></div><div class="pn lt ph-evp${tight ? ' tight' : ''}" data-key="pickp"><span class="lab">${card ? 'The trade, both sides' : 'Pick a Pokémon'}</span>${card}<div class="ph-evp-list">${p.labels.map((t, k) => `<div class="blade${k === p.at ? ' on' : ''}" style="--i:${k};--sh:#000"${act('trade', k, 'tradeOver')}>${esc(t)}</div>`).join('')}</div><span class="ph-sheet-k">Enter: ${card ? 'trade' : 'choose'} · Esc: back</span></div>`;
}

/** What changed, as cards that open one after the other. */
function rewards(d: EventModel, L: EventLook, changes: readonly string[], next: string, steps: boolean): string {
  const n = changes.length, small = n > 3, cols = n <= 3 ? Math.max(1, n) : n <= 8 ? 4 : 5;
  const cards = changes.map((t, i) => {
    const v = changeVisual(t), [a, b] = changeParts(t);
    const art = v.kind === 'money' && b ? `<div class="mny" style="font-size:${b.length > 7 ? 26 : small ? 30 : 40}px">${esc(b)}</div>` : `<div class="ph-rc-ic">${ic(CHANGE_ICON[v.kind], small ? 44 : 76)}</div>`;
    const r = small ? ((i % cols) - (cols - 1) / 2) * 1.5 : (i - (n - 1) / 2) * 6;
    const what = a.charAt(0).toUpperCase() + a.slice(1);
    return `<div class="sy-rc ph-rc${v.good ? '' : ' bad'}${v.kind === 'note' ? ' run' : ''}" data-key="rc:${i}:${esc(t)}" style="--i:${i};--r:${r.toFixed(1)}deg"><small>${KIND_WORD[v.kind]}</small>${art}<b style="font-size:${what.length > 34 ? 15 : what.length > 20 ? (small ? 16 : 20) : small ? 20 : 27}px">${esc(what)}</b>${v.kind !== 'money' && b ? `<p>${esc(b)}</p>` : '<p></p>'}</div>`;
  }).join('');
  const good = changes.some((t) => changeVisual(t).good), deed = d.choices[d.index]?.label;
  return page('sy-reward', '<div class="bgk"></div>' + backdrop(L, 0.7, false)
    + `<div class="sy-yt">${ransom(d.outcome?.ok && good ? 'YOURS' : 'WHAT CHANGED', 9)}</div>${strip(d.name, 3, steps)}`
    + `<div class="sy-open ph-open${small ? ' small' : ''}" style="--cols:${cols}">${cards}</div>`
    + `<div class="pn sy-from"><span class="lab">${good ? 'Why you got this' : 'Why this happened'}</span><p class="txt">${esc(d.name)}${deed ? `: ${esc(deed)}` : ''}</p></div>`
    + `<div class="sy-wait ph-ev-stay"${act('next')}><i aria-hidden="true"></i><kbd>↵</kbd><span>Stays until you press Enter</span></div>`
    + keys(['Enter', next, 'next']));
}

/** A talk page (the prologue, the story, the tutorial, a broadcast): the same page without the event's step strip, its picture dressed from the model's plain fields. */
export function phTalk(ph: PhantomVersion, d: EventModel): string {
  const plain = plainLook(d), fx = d.fx && (FX as readonly string[]).includes(d.fx) ? (d.fx as Weather) : null;
  return phEvent(ph, { ...d, look: d.look ?? { ...plain, scene: { ...plain.scene, weather: fx, still: !fx } } }, false);
}

/** An event, drawn from the New UI event's model. `steps`: show where in the event the player is. */
export function phEvent(_ph: PhantomVersion, d: EventModel, steps = true): string {
  const out = d.outcome, more = d.page.at < d.page.of - 1, ch = out || more ? [] : d.choices;
  const L = d.look ?? plainLook(d);
  const key = `${out ? out.step : 'intro'}${d.page.at}`;
  if (out?.step === 'rewards') return rewards(d, L, out.changes, out.next, steps);
  const turn = more ? `<div class="ph-ev-turn"${act(out ? 'next' : 'page')}></div>` : '';
  if (d.scare && !out) {
    // The black screen, then the face: nothing else is on show but the text box.
    const face = d.scare === 'face' && L.mons[0] ? `<div class="ph-ev-scare${L.scene.still ? ' still' : ''}" data-key="scare:${key}">${mon(L.mons[0], 14, '', '', true)}</div>` : '';
    return page('event', `<div class="bgk" style="background:#000"></div>${face}${box(d, key, 'Waits for you', more ? act('page') : '')}${turn}${keys(['Enter', 'Next', more ? 'page' : undefined])}`);
  }
  const lit = ch.length ? L.choices[d.index] : undefined, tone: Tone | null = lit ? lit.tone : null;
  // A talk page whose only choice is to go on ("Continue") keeps the text box, and the box is the button.
  const solo = !steps && ch.length === 1 && !ch[0]!.sub && !ch[0]!.chance && !ch[0]!.locked ? ch[0]! : null;
  if (ch.length && !solo) {
    // The choice: the scene steps back, the page's text is the question and the choices are dealt as cards.
    const n = lettersOf(d);
    const q = `<div class="sy-q ph-q${n > 54 ? ' long' : ''}" data-key="q:${key}"><small>${esc(d.speaker ? `${d.speaker} says` : 'What do you do?')}</small><span style="font-size:${n > 54 ? (n > 300 ? 16 : n > 200 ? 18 : 20) : 38}px">${lines(d, key)}</span></div>`;
    return page('choice', backdrop(L, 0.35) + cast(L, tone, true) + '<div class="dim ph-ev-dim2" style="background:rgba(8,6,10,.5)"></div>' + top(d, 1, steps) + q + hand(d, L, ch, key) + picker(d)
      + keys(['◀▶', 'Look'], ['Enter', 'Choose'], ...(steps && d.page.of > 1 ? [['Esc', 'Read back', 'page', -1] as const] : []), ...(d.rounds ? [['B', 'Bracket', 'bracket'] as const] : [])));
  }
  // The talk, and the outcome's text: the scene, the people in it and the text box that waits.
  const label = more ? 'Waits for you' : out ? (out.changes.length ? 'Continue' : out.next) : solo ? solo.label : 'Waits for you';
  const go = out ? act('next') : more ? act('page') : solo ? act('pick', 0) : '';
  const me = d.me && d.speaker && !out ? `<div class="sy-me" aria-label="your trainer"><div><div class="ph-ev-me">${figure(d.me, 300)}</div></div><em>…</em><span>listening</span></div>` : '';
  const seal = out && out.changes.length ? '<div class="sy-seal" aria-label="what changed, still closed"><div><i></i></div><b>What changed</b><span>Opens after you close this</span></div>' : '';
  const hit = out && !out.ok ? '<div class="ph-ev-hit" data-key="hit" aria-hidden="true"></div>' : '';
  return page(out ? 'sy-result' : 'event', backdrop(L, out ? 0.45 : 0.35) + cast(L, null, false) + hit + top(d, out ? 2 : 0, steps) + me + seal
    + box(d, key, label, go) + picker(d) + turn
    + keys(['Enter', more ? 'Next' : out || solo ? label : 'Next', out ? 'next' : more ? 'page' : solo ? 'pick' : undefined, solo && !more && !out ? 0 : ''], ...(steps && d.page.at > 0 && !out ? [['Esc', 'Read back', 'page', -1] as const] : []), ...(d.rounds ? [['B', 'Bracket', 'bracket'] as const] : [])));
}
