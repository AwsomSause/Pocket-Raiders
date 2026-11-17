// New UI event ("?") screen, remade (Kice 2026-11-16: "let it draw events in its own way"). One stage for every
// event: the scene the event director decided (core/presentation/eventVisuals, drawn by ../eventScenery), the people
// and Pokémon staged in it, choice cards that say what kind of deed each is and make the scene lean their way, text
// that is said the way it is written, and an outcome that lands. EventScene keeps the state, the input and the
// outcome; this only draws. The ALL EVENTS rule holds: text stays until input, results show only after the text.

import type { Burst, ChangeVisual, ChoiceIcon, ChoiceVisual, Mood, Shot, Stir, Tone, Voice } from '../../../core/presentation/eventVisuals';
import { changeVisual, choiceVisual, lineVisual, outcomeBurst } from '../../../core/presentation/eventVisuals';
import { scenery, type SceneryLook } from '../eventScenery';
import { partyStrip, type PartyChip } from '../game';
import { rxAtlas } from '../assets';
import { act, B, esc, foot, H, hpb, icon, mini, mon, TX, W } from '../kit';
import type { ScriptLine } from '../script';
import type { ReduxCtx } from '../stage';
import { priceOf } from '../storeFloors';
import { figure, type Art } from '../templates';
import { bracketView, type BracketModel, type RoundChip } from './bracket';
import { runCardView, type RunCardModel } from './over';
import { honestView, type HonestModel } from './stops';
import { teamView, type TeamModel } from './team';

export interface EventChoice { label: string; sub: string; chance: string; locked: boolean }
/** What the event director decided for this event, and how the page on show reacts (EventScene fills it in). */
export interface EventLook {
  scene: SceneryLook;
  shot: Shot;
  /** What the event's subject does on the spot (the scene effects that move a figure), or null. */
  stir: Stir | null;
  /** The event's own 5 x 5 mark (15 bits). */
  sigil: number;
  /** The people in the scene (at most three) and which one is speaking (-1: nobody, or someone not pictured). */
  cast: Art[];
  speaking: number;
  /** Pokémon in the scene, as sprite files (at most two). */
  mons: string[];
  /** Each Pokémon's drawn height as a share of the first one's (null or missing: the stage's own size). */
  monSize?: (number | null)[];
  /** Things the text names, as picture files (at most three). */
  props: string[];
  /** A scene with nobody in it: the player's lead Pokémon looks on from the near corner (its back sprite), or null. */
  buddy?: string | null;
  /** One per choice: its icon, its tone and its odds. */
  choices: ChoiceVisual[];
  /** The mark over whoever speaks on this page (a picture file), or null. */
  emote: string | null;
}
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
  /** Sabrina's Labyrinth: this page is a black screen ('dark'), or the first Pokémon's face filling it ('face'). */
  scare?: 'dark' | 'face' | null;
  /** Backdrop file under assets/images, a tint ("#rrggbb") and the mock-ups' effect class (rain, snow, fog...). */
  art: string | null; tint: string | null; fx: string | null;
  cast: Art | null;
  mon: string | null;
  /** The director's picture of this event. Without one the stage is dressed from the fields above. */
  look?: EventLook | null;
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
  /** Stand With Them: the code-name card that the joining outcome's text is read on (the mock-ups' card page). */
  codeCard?: Pick<RunCardModel, 'name' | 'rank' | 'facts' | 'trainer' | 'badges'> | null;
  /** The event has a trade card to read: a tag on the tag row opens it (T). */
  cardHint?: boolean;
  /** gn.new.29: the rival's team as a page of its own (R opens it, Enter closes it), and whether the rival's scene has one to read. */
  team?: TeamModel | null;
  teamHint?: boolean;
  /** A department store floor (mock-up `store`): the floor directory with this floor lit, the party, and a note per Pokémon for each choice (who a good helps). */
  store?: { title: string; clerk: string; floors: { tag: string; name: string; on: boolean }[]; party: PartyChip[]; notes: string[][] } | null;
}

const pickAttr = (k: number): string => `${act('pick', k)} data-over="over"`;
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

/** Small line icons (16 x 16, drawn in the text colour): what kind of deed a choice is, what an outcome line is about. */
const ICONS: Record<ChoiceIcon | 'bolt' | 'plus' | 'dot', string> = {
  battle: '<path d="M3 3l10 10M13 3L3 13M2 10l4 4M14 10l-4 4"/>',
  catch: '<circle cx="8" cy="8" r="6"/><path d="M2 8h4M10 8h4"/><circle cx="8" cy="8" r="1.6"/>',
  trade: '<path d="M2 5h11M10 2l3 3-3 3M14 11H3M6 8l-3 3 3 3"/>',
  coin: '<circle cx="8" cy="8" r="6"/><path d="M8 5v6M6.5 6.5h2.2a1.3 1.3 0 010 2.6H6.5"/>',
  dice: '<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5.5 5.5h.01M10.5 5.5h.01M8 8h.01M5.5 10.5h.01M10.5 10.5h.01"/>',
  leave: '<path d="M7 2.5H3v11h4M7 8h7M11 5l3 3-3 3"/>',
  care: '<path d="M8 13.5L2.6 8.2a3.2 3.2 0 014.5-4.5l.9.9.9-.9a3.2 3.2 0 014.5 4.5z"/>',
  give: '<rect x="2.5" y="6.5" width="11" height="7"/><path d="M1.5 4h13v2.5h-13zM8 4v9.5M8 4C6 4 5 1.5 6.5 1.5S8 4 8 4s0-2.5 1.5-2.5S10 4 8 4"/>',
  take: '<path d="M8 2v8M5 7l3 3 3-3M2.5 11v2.5h11V11"/>',
  talk: '<path d="M2.5 3h11v7.5H8l-3 3v-3H2.5z"/>',
  look: '<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  rest: '<path d="M12.5 10.5A5.5 5.5 0 015.5 3.5a5.5 5.5 0 107 7z"/>',
  train: '<path d="M2 13l4-4 3 2 5-6M10 5h4v4"/>',
  go: '<path d="M3 3l5 5-5 5M8.5 3l5 5-5 5"/>',
  pick: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.8"/>',
  star: '<path d="M8 1.8l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.4l-3.9 2.2.9-4.3-3.2-3 4.3-.5z"/>',
  lock: '<rect x="3" y="7" width="10" height="7"/><path d="M5 7V5a3 3 0 016 0v2"/>',
  bolt: '<path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z"/>',
  plus: '<path d="M8 3v10M3 8h10"/>',
  dot: '<circle cx="8" cy="8" r="2.5"/>',
};
const ic = (name: keyof typeof ICONS, px = 16): string => `<svg viewBox="0 0 16 16" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const CHANGE_ICON: Record<ChangeVisual['kind'], keyof typeof ICONS> = { money: 'coin', heal: 'plus', hurt: 'bolt', join: 'catch', bond: 'care', item: 'give', learn: 'train', trade: 'trade', evil: 'look', stat: 'star', note: 'dot' };
const MOOD_INK: Record<Mood, string> = { calm: '#8fe0b0', warm: '#ffc070', tense: '#ff7a6a', eerie: '#b09af4', sad: '#8ab4ee', festive: '#ffe05a', grand: '#f4d060', mystery: '#7ae0ee', playful: '#ff9ad8' };

/** The event's own mark: a 5 x 5 mirrored grid from its 15 bits, in the mood's ink. */
function sigilOf(bits: number, ink: string): string {
  let cells = '';
  for (let y = 0; y < 5; y += 1) for (let x = 0; x < 5; x += 1) if ((bits >> (y * 3 + (x < 3 ? x : 4 - x))) & 1) cells += `<rect x="${3 + x * 5}" y="${3 + y * 5}" width="5" height="5"/>`;
  return `<svg class="ev-sigil" viewBox="0 0 31 31" width="38" height="38" shape-rendering="crispEdges" aria-hidden="true"><rect width="31" height="31" rx="5" fill="#0c1020d0"/><g fill="${ink}">${cells || '<rect x="13" y="13" width="5" height="5"/>'}</g></svg>`;
}

const hashOf = (t: string): number => { let h = 0x811c9dc5; for (let i = 0; i < t.length; i += 1) h = Math.imul(h ^ t.charCodeAt(i), 0x01000193) >>> 0; return h; };
const oddsOf = (x: EventChoice): number | null => { const n = /(\d+)\s*%/.exec(x.chance); return n ? Math.max(0, Math.min(100, Number(n[1]))) : null; };

/** A model without the director's picture (a scene outside a run, a test) still gets a stage: dressed from its plain fields. */
function plainLook(d: EventModel): EventLook {
  const seed = hashOf(d.name);
  return {
    scene: { set: 'wilds', place: 'route', inside: false, time: 'day', mood: 'calm', weather: null, motes: 'none', seed, pic: d.art, tint: d.tint, still: true },
    shot: d.cast ? 'talk' : d.mon ? 'moment' : 'vista', stir: null, sigil: (seed ^ (seed >>> 15)) & 0x7fff, cast: d.cast ? [d.cast] : [], speaking: d.speaker && d.cast ? 0 : -1, mons: d.mon ? [d.mon] : [], props: [],
    choices: d.choices.map((x) => choiceVisual({ label: x.label, kind: 'safe', locked: x.locked, chance: null })), emote: null,
  };
}

/** Where the figures' feet stand. */
const FEET = 428;
/** Where each person and Pokémon stands, by how many there are and what the scene is about. */
function stagingOf(L: EventLook): { cast: { x: number; px: number }[]; mons: { x: number; k: number }[] } {
  const n = L.cast.length, alone = n === 0;
  const cast = L.shot === 'moment' && n ? [{ x: 130, px: 200 }, { x: 60, px: 180 }, { x: 520, px: 180 }] : n === 1 ? [{ x: 250, px: 250 }] : n === 2 ? [{ x: 270, px: 250 }, { x: 120, px: 212 }] : [{ x: 260, px: 250 }, { x: 110, px: 206 }, { x: 410, px: 206 }];
  const mons = alone || L.shot === 'moment' ? [{ x: alone ? 300 : 340, k: 3.4 }, { x: 500, k: 2.2 }] : n === 1 ? [{ x: 440, k: 2.6 }, { x: 110, k: 2 }] : n === 2 ? [{ x: 440, k: 2.4 }, { x: 540, k: 1.8 }] : [{ x: 530, k: 2 }, { x: 30, k: 1.6 }];
  return { cast: cast.slice(0, n), mons: mons.slice(0, L.mons.length) };
}

/** The stage: the drawn scene, then everyone in it, the things the text names, and the mark over the speaker. */
function stage(L: EventLook, page: string, tone: Tone | null, focus: number): string {
  const at = stagingOf(L);
  const lean = tone === 'danger' ? ' r-brace' : tone === 'away' ? ' r-back' : tone === 'kind' ? ' r-near' : tone === 'curious' ? ' r-tilt' : tone === 'deal' ? ' r-nod' : tone === 'bold' ? ' r-up' : '';
  const stirOn = (i: number, isMon: boolean): string => (L.stir && !L.scene.still && (L.mons.length ? isMon && i === 0 : i === 0) ? ` st-${L.stir}` : '');
  const people = L.cast.map((a, i) => {
    const s = at.cast[i]!, hush = L.speaking >= 0 && L.speaking !== i;
    return `<div class="foot ev-fig${hush ? ' hush' : L.speaking === i ? ' sp' : ''}${i === 0 || L.speaking === i ? lean : ''}" data-once="fig${i}:${tone ?? ''}:${focus}:${L.speaking}" style="left:${s.x}px;top:${FEET}px;z-index:${3 - (i ? 1 : 0)};--i:${i}"><div class="ev-in${stirOn(i, false)}" data-once="in${i}">${figure(a, s.px)}</div></div>`;
  }).join('');
  const mons = L.mons.map((file, i) => {
    const s = at.mons[i]!;
    // A set size is measured on what is drawn (the trimmed frame), against the first Pokémon.
    const rel = L.monSize?.[i], h0 = rxAtlas(L.mons[0]!)?.f[0]?.[3], h = rxAtlas(file)?.f[0]?.[3];
    const k = rel && h0 && h ? (at.mons[0]!.k * h0 * rel) / h : s.k;
    return `<div class="foot ev-fig${!L.cast.length && i === 0 ? lean : ''}" data-once="mon${i}:${tone ?? ''}:${focus}" style="left:${s.x}px;top:${FEET}px;z-index:3;--i:${i + 1}"><div class="ev-in ev-hop${stirOn(i, true)}" data-once="inm${i}">${mon(file, k, '', true)}</div></div>`;
  }).join('');
  // Things the text names stand on the ground to the right of whoever is there, never under the choices.
  const right = Math.max(180, ...at.cast.map((s) => s.x + 70), ...at.mons.map((s) => s.x + 60));
  const size = L.shot === 'deal' ? 52 : 40;
  const props = L.props.map((file, i) => ({ file, x: right + 30 + i * (size + 14) })).filter((p) => p.x + size < 590)
    .map((p, i) => `<div class="abs ev-prop" data-once="prop${i}" style="left:${p.x}px;top:${FEET - size - 4}px;--i:${i}">${icon(p.file, size)}</div>`).join('');
  const buddy = L.buddy && !L.cast.length && !L.mons.length ? `<div class="foot ev-fig ev-buddy${lean}" data-once="bud:${tone ?? ''}:${focus}" style="left:150px;top:${FEET + 30}px;z-index:3"><div class="ev-in" data-once="inb">${mon(L.buddy, 3, '', true)}</div></div>` : '';
  const who = L.speaking >= 0 ? at.cast[L.speaking] : at.cast[0];
  const head = who ? { x: who.x + 36, y: FEET - who.px - 30 } : at.mons[0] ? { x: at.mons[0].x + 30, y: FEET - 62 * at.mons[0].k } : null;
  const emote = L.emote && head ? `<div class="abs ev-emote" data-once="em:${page}:${L.emote}" style="left:${head.x}px;top:${Math.max(64, head.y)}px">${icon(L.emote, 44)}</div>` : '';
  const toned = tone && tone !== 'calm' ? `<div class="fill ev-tone t-${tone}" data-once="tone:${tone}:${focus}"></div>` : '';
  return `<div class="fill ev-stage shot-${L.shot}">${scenery(L.scene)}${toned}${people}${mons}${buddy}${props}${emote}</div>`;
}

/** The one big reaction of an outcome, as a burst of small marks from the middle of the scene. */
function burstOf(kind: Burst, key: string): string {
  if (kind === 'none') return '';
  const marks: Partial<Record<Burst, [string, number]>> = { gold: ['●', 12], heal: ['✚', 8], join: ['★', 10], bond: ['♥', 8], gift: ['✦', 10] };
  const m = marks[kind];
  const bits = m ? Array.from({ length: m[1] }, (_, i) => `<i style="--a:${Math.round((360 / m[1]) * i + 12)}deg;--i:${i}">${m[0]}</i>`).join('') : '';
  return `<div class="fill ev-burst b-${kind}" data-once="${key}">${bits}</div>`;
}

const BAD = '#f08080';
/** One outcome line as "what · how much" with the icon of what it is about: "+₽300" reads Coins / +₽300, "Charisma +2" reads Charisma / +2. */
function changeRow(t: string, i: number): string {
  const money = /^([+−-]₽[\d,]+)$/.exec(t), tail = /^(.+?) ([+−-]\d+%?)$/.exec(t), head = /^([+−-]\d+%?) (.+)$/.exec(t), times = /^(.+) (×\d+)$/.exec(t);
  const [a, b] = money ? ['Coins', money[1]!] : tail ? [tail[1]!, tail[2]!] : head ? [head[2]!, head[1]!] : times ? [times[1]!, times[2]!] : [t, ''];
  const v = changeVisual(t);
  return `<div class="row sm ev-row" data-once="row${i}:${esc(t)}" style="--i:${i};${v.good ? '' : `color:${BAD}`}"><i class="ev-ic k-${v.kind}">${ic(CHANGE_ICON[v.kind], 14)}</i><span class="grow">${esc(cap(a))}</span><b>${esc(b)}</b></div>`;
}

export function eventView(c: ReduxCtx, d: EventModel): string {
  if (d.bracket) return bracketView(c, d.bracket);
  if (d.honest) return honestView(c, d.honest);
  if (d.codeCard && d.outcome?.step === 'text') {
    const text = d.lines.map((l) => (l.who ? `${l.who}: ${l.text}` : l.text)).join(' ');
    return runCardView(c, { ...d.codeCard, title: 'Code Name', team: [], text, hints: [['Enter', 'next']], area: 'story', save: false, tap: 'next' });
  }
  if (d.team) return teamView(c, d.team);
  const out = d.outcome, more = d.page.at < d.page.of - 1, ch = out || more ? [] : d.choices;
  const L = d.look ?? plainLook(d);
  const pageKey = `${out ? out.step : 'intro'}${d.page.at}`;
  const talk = d.lines.some((l) => l.who !== null);
  /** One line, said the way it is written: a shout is heavy, a whisper small, a trailing line fades. */
  const said = (l: ScriptLine, i: number, body: string): string => { const v: Voice = lineVisual(l.text).voice; return `<span class="ev-ln${v === 'plain' ? '' : ` v-${v}`}" data-once="ln:${pageKey}:${i}" style="--i:${i}">${body}</span>`; };
  /** The page as HTML. `plated`: the speaker is on the name plate, so their own lines need no name. */
  const say = (plated: boolean): string => d.lines.map((l, i) => said(l, i, l.who === null ? (talk ? `<i style="opacity:.85">${esc(l.text)}</i>` : esc(l.text)) : plated && l.who === d.speaker ? esc(l.text) : `<b class="acc">${esc(l.who)}</b> ${esc(l.text)}`)).join('<br>');
  const len = d.lines.reduce((n, l) => n + l.text.length + (l.who ? l.who.length + 1 : 0), 0);
  /** Rows the page takes in the wide text box (about 84 letters a row). */
  const rows = d.lines.reduce((n, l) => n + Math.max(1, Math.ceil((l.text.length + (l.who && l.who !== d.speaker ? l.who.length + 1 : 0)) / 84)), 0);
  const mark = (st: string): string => (d.page.of > 1 ? `<span class="sm${more ? ' rx-more' : ''}" style="position:absolute;${st}">${d.page.at + 1}/${d.page.of}${more ? ' ▼' : ''}</span>` : '');
  /** While pages remain, a click anywhere turns the page. */
  const turn = more ? `<div class="fill hit" style="z-index:20;cursor:pointer"${act(out ? 'next' : 'page')}></div>` : '';
  /** The tournament strip: five rounds, the next one lit. `st` places it. It sits above the page-turn layer so it can always be clicked. */
  const strip = (st: string): string => (d.rounds ? `<div class="abs row" style="gap:6px;z-index:21;cursor:pointer;${st}"${act('bracket')}>${d.rounds.map((r) => `<div class="win${r.state === 'next' ? ' sel' : ''}" style="flex:1;min-width:0;padding:3px 8px${r.state === 'ahead' ? ';opacity:.6' : ''}"><div style="font-size:11px;white-space:nowrap">${r.state === 'won' ? '✓ ' : r.state === 'next' ? '▶ ' : ''}${esc(r.name)}</div><b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.who)}</b></div>`).join('')}<span class="sm" style="white-space:nowrap;color:#fff;text-shadow:1px 1px 0 #000"><kbd>B</kbd>bracket</span></div>` : '');
  const title = d.title ? `<div class="abs" style="left:0;right:0;top:146px;text-align:center;font-size:40px;font-weight:700;color:var(--acc);text-shadow:3px 3px 0 #000,0 0 18px #000;letter-spacing:.08em;z-index:6;pointer-events:none">${esc(d.title)}</div>` : '';
  /** The standing panel: a rank and up to three meters. `st` places it. */
  const standing = (st: string, cls = 'glass'): string => (d.standing ? W(`<div class="row"><span class="sm grow">Standing</span><b class="acc">${esc(d.standing.rank)}</b></div>${d.standing.meters.slice(0, 3).map((m) => `<div class="row sm" style="gap:8px"><span style="width:84px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.label)}</span>${hpb(Math.max(0, Math.min(100, m.max > 0 ? (m.value / m.max) * 100 : 0)), 0, ' gold')}<b style="width:44px;text-align:right">${m.value}/${m.max}</b></div>`).join('')}`, `display:flex;flex-direction:column;gap:5px;padding:8px 12px;${st}`, cls) : '');
  const q = `<span class="tg">${esc(d.tag)}</span>${d.money === null ? '' : `<span class="tg no" style="margin-left:6px">₽ ${d.money.toLocaleString('en-US')}</span>`}${d.countdown ? `<span class="tg${d.timer !== null && d.timer < 0.25 ? ' ev-urgent' : ''}" style="margin-left:6px;background:#e84838;color:#fff">${esc(d.countdown)}</span>` : ''}${d.cardHint ? `<span class="tg no" style="margin-left:6px;cursor:pointer;position:relative;z-index:9"${act('card')}><kbd>T</kbd> Trade card</span>` : ''}${d.teamHint ? `<span class="tg no" style="margin-left:6px;cursor:pointer;position:relative;z-index:9"${act('team')}><kbd>R</kbd> Their team</span>` : ''}`;
  const cont = out ? [{ label: more ? 'Next' : out.step === 'text' && out.changes.length ? 'Continue' : out.next, sub: '', chance: '', locked: false }] : [];
  const list = out ? cont : ch;
  const btnAct = (k: number): string => (out ? act('next') : pickAttr(k));
  const lit = (k: number): boolean => (out ? true : k === d.index);
  const fail = out && !out.ok ? '<span class="acc">It didn’t go your way… </span>' : '';
  const lineP = fail + say(true);
  const side = (title: string, x: { name: string; file: string | null } | null): string => W(`<span class="sm">${title}</span><div style="height:76px;display:flex;align-items:center;justify-content:center">${x?.file ? mini(x.file, 72) : `<b style="font-size:40px;opacity:.6">${x ? '' : '?'}</b>`}</div><b style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(x?.name ?? 'Not known yet')}</b>`, 'flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px');
  const card = d.pick?.card ? `<div class="row" style="gap:10px">${side('You give', d.pick.card.give)}<b class="acc" style="font-size:26px">⇄</b>${side('You get', d.pick.card.get)}</div>` : '';
  const picker = d.pick ? '<div class="shade"></div>' + W(`<b style="font-size:19px">${card ? 'The trade, both sides' : 'Pick a Pokémon'}</b>${card}${d.pick.labels.map((t, k) => B(esc(t), k === d.pick!.at, `height:${card && d.pick!.labels.length > 4 ? 28 : 36}px;font-size:15px`, '', `${act('trade', k)} data-over="tradeOver"`)).join('')}<span class="sm"><kbd>Enter</kbd>${card ? 'trade' : 'choose'} <kbd>Esc</kbd>back</span>`, `position:absolute;left:260px;right:260px;top:${card ? 40 : 110}px;display:flex;flex-direction:column;gap:${card ? 6 : 8}px;padding:16px;z-index:12`) : '';

  if (d.store) {
    // The mock-ups' `store` page: floors down the left, this floor's goods with their prices, who a good helps, the clerk's text box.
    const S = d.store, tall = S.floors.length > 5;
    const floors = `<div class="abs col" style="left:24px;top:76px;width:210px;gap:${tall ? 5 : 7}px">${S.floors.map((f) => `<div class="btn${f.on ? ' on' : ''}" style="height:${tall ? 38 : 44}px;cursor:default"><b>${esc(f.tag)}</b><small>${esc(f.name)}</small></div>`).join('')}</div>`;
    const tight = list.length > 5;
    const goods = `<div class="abs col" style="left:260px;right:24px;top:92px;gap:${tight ? 5 : 7}px">${list.map((x, k) => { const g = priceOf(x.label); return `<div class="btn${lit(k) ? ' on' : ''}" style="${tight ? 'height:36px;' : ''}${x.locked ? 'opacity:.5;' : ''}cursor:pointer"${btnAct(k)}><span class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(g ? g.name : x.label)}</span>${g ? `<span>${esc(g.price)}</span>` : x.chance ? `<small>${esc(x.chance)}</small>` : ''}</div>`; }).join('')}</div>`;
    const cash = d.money === null ? '' : `<span class="tg" style="position:absolute;right:20px;top:60px">₽ ${d.money.toLocaleString('en-US')}</span>`;
    const why = !out && ch[d.index]?.locked && ch[d.index]!.sub ? `<span class="acc"> ${esc(ch[d.index]!.sub)}</span>` : '';
    const results = out?.step === 'rewards' ? W(`<b class="acc">Outcome</b>${out.changes.map(changeRow).join('')}`, 'position:absolute;right:24px;top:70px;width:290px;display:flex;flex-direction:column;gap:6px;z-index:8', 'glass') : '';
    return H(S.title, 'shop', [['Enter', out || more ? 'next' : 'choose']]) + cash + floors + goods + partyStrip(S.party, 'left:24px;right:24px;bottom:112px', out ? undefined : S.notes[d.index]) + TX(`<div style="font-size:${len > 190 ? 14 : len > 110 ? 16 : 18}px;line-height:1.3">${lineP}${why}</div>${mark('right:14px;top:4px')}`, d.speaker ?? S.clerk) + results + turn + picker;
  }

  // ---- the stage ----
  const looks = (k: number): ChoiceVisual => L.choices[k] ?? choiceVisual({ label: list[k]?.label ?? '', kind: 'safe', locked: !!list[k]?.locked, chance: null });
  const focused = !out && ch.length ? looks(d.index) : null;
  const tone: Tone | null = focused ? focused.tone : null;
  const textTop = 540 - 16 - (rows * 25 + 20);
  // The choices stand in a column at the right, on the text box; a long list gets shorter cards so every one stays on screen.
  const colTop = d.rounds ? 122 : 78, room = textTop - 12 - colTop - 24;
  const step = Math.min(48, Math.max(24, Math.floor(room / Math.max(1, list.length))));
  const high = step - (step > 40 ? 6 : 4), small = step < 40;
  // A long choice label shrinks and wraps inside its card (`px` is the room for text) so no word runs past the edge.
  const fit = (x: EventChoice, px: number, base: number): string => {
    const n = x.label.length;
    for (const [size, lines] of [[base, 1], [13, 2], [11, 3], [10, 3]] as const) {
      if (size > base || n * size * 0.58 > px * lines || lines * (size + 1) > high) continue;
      return lines === 1 ? '' : `;font-size:${size}px;white-space:normal;line-height:${size + 1}px`;
    }
    return n * (small ? 13 : 16) * 0.58 <= px ? '' : ';font-size:10px;white-space:normal;line-height:11px';
  };
  const cards = list.map((x, k) => {
    if (out) return `<div class="btn on ev-ch t-calm" style="height:42px;justify-content:center;cursor:pointer" data-once="cont:${pageKey}"${btnAct(k)}>${esc(x.label)}<i class="ev-ic">${ic('go', 14)}</i></div>`;
    const v = looks(k), odds = v.odds ?? oddsOf(x);
    const meter = odds === null ? (x.chance ? `<small>${esc(x.chance)}</small>` : '') : `<small class="ev-odds${odds >= 70 ? ' hi' : odds < 40 ? ' lo' : ''}"><i style="width:${odds}%"></i><b>${esc(x.chance || `${odds}%`)}</b></small>`;
    return `<div class="btn ev-ch t-${v.tone}${lit(k) ? ' on' : ''}" data-once="ch:${pageKey}:${k}" style="height:${high}px;--i:${k};${small ? 'font-size:14px;' : ''}${x.locked ? 'opacity:.5;' : ''}cursor:pointer${fit(x, 336 - 32 - 30 - (meter ? 62 : 0), small ? 14 : 16)}"${btnAct(k)}><i class="ev-ic">${ic(v.icon, small ? 12 : 14)}</i><span class="grow">${esc(x.label)}</span>${meter}</div>`;
  }).join('');
  const note = !out && ch[d.index]?.sub ? `<div class="ev-note t-${tone ?? 'calm'}" data-once="note:${d.index}">${esc(ch[d.index]!.sub)}</div>` : '';
  const results = out?.step === 'rewards' ? W(`<b class="acc">Outcome</b>${out.changes.map(changeRow).join('')}`, 'display:flex;flex-direction:column;gap:6px', 'glass ev-out') : '';
  const column = list.length || results ? `<div class="abs col ev-col" style="right:24px;bottom:${540 - textTop + 12}px;width:336px;gap:${step - high}px;z-index:8">${note}${results}${cards}</div>` : '';
  // What the outcome does to the scene: a fight or a failure shows with the text; anything won shows only with the results.
  const burst: Burst = out ? outcomeBurst(out.changes, out.ok, /battle|fight/i.test(out.next)) : 'none';
  const lands = !out ? '' : out.step === 'text' ? (burst === 'battle' || burst === 'fail' || burst === 'hurt' ? burstOf(burst === 'hurt' ? 'fail' : burst, `burst:text:${burst}`) : '') : burstOf(burst === 'battle' ? 'none' : burst, `burst:rewards:${burst}`);
  const nameSize = d.name.length > 44 ? 15 : d.name.length > 30 ? 18 : 21;
  const head = `<div class="abs row ev-head" style="left:16px;top:12px;gap:10px;z-index:7;max-width:${d.standing ? 560 : 920}px">${sigilOf(L.sigil, MOOD_INK[L.scene.mood])}<div class="col" style="gap:5px;min-width:0"><b class="ev-name" style="font-size:${nameSize}px">${esc(d.name)}</b><div>${q}</div></div></div>`
    + (d.timer !== null && !out ? `<div class="abs hp gold${d.timer < 0.25 ? ' ev-urgent' : ''}" style="left:64px;top:60px;width:200px;height:6px;z-index:7"><i style="width:${Math.round(d.timer * 100)}%"></i></div>` : '');
  const shout = d.lines.some((l) => lineVisual(l.text).voice === 'shout');
  const box = `<div class="abs txt ev-txt${shout ? ' ev-jolt' : ''}" data-once="txt:${pageKey}" style="left:20px;right:20px;bottom:16px;z-index:6">${d.speaker ? `<span class="nm">${esc(d.speaker)}</span>` : ''}${lineP}${mark('right:14px;bottom:2px')}</div>`;
  if (d.scare && !out) {
    // The black screen, then the face: nothing else is on show but the text box (and the page turn).
    const face = d.scare === 'face' && L.mons[0] ? `<div class="foot${L.scene.still ? '' : ' ev-scare'}" data-once="scare:${pageKey}" style="left:480px;top:760px;z-index:5">${mon(L.mons[0], 11, '', true)}</div>` : '';
    return `<div class="fill" style="background:#000;z-index:4"></div>${face}${box}${turn}`;
  }
  return stage(L, pageKey, tone, out ? -1 : d.index) + lands + head + strip('left:20px;right:20px;top:70px') + title + standing(`position:absolute;left:20px;top:${d.rounds ? 122 : 74}px;width:250px;z-index:7`) + column + box + picker + turn;
}
