// DOMINION D12: the Chair's view models (mockups c1 a visitor at the Chair, c2 Hand it off, c3 the Tally). Plain data,
// no rolls (the whisper uses a generator made from the day and the card only, never a gameplay stream).

import type { RunState } from '../state';
import { atDoor, cardById, cardText, handOffCrew, inTally, leanOf, rightHand, scale, tierOf, whisper, wouldPick } from './chair';
import { crewOf, rankWord, traitName, traitNow } from './crew';
import { DOMINION_DATA } from './data';
import type { CourtCard, CourtFx, DominionBlock, Member } from './schema';
import { fill } from './worldTurn';

const R = () => DOMINION_DATA.courtRules;
const L = () => R().lines as Record<string, string>;

export interface Chip { text: string; cls: 'up' | 'dn' | 'q' | '' }
export interface Face { name: string; role: string; look: string; tag: 'favour' | 'grudge' | null }
export interface Top { funds: string; heat: number; regard: number; dread: number }
export interface VisitorModel {
  kind: 'visitor';
  top: Top; title: string; sub: string; chair: string; openHouse: boolean;
  visitor: Face; mon: string | null; ask: string; crisis: boolean;
  whisper: { name: string; look: string; text: string; pick: 0 | 1 | null } | null;
  answers: { label: string; chips: Chip[]; on: boolean; does: string }[];
  hand: { can: boolean; left: number; on: boolean };
  result: string[] | null;
  lead: { species: string; react: string; mood: 'happy' | 'growl' | 'sad' | 'calm' } | null;
  canClose: boolean;
  opts: { length: string; numbers: string; speed: string };
}
export interface HandModel {
  kind: 'hand';
  top: Top; sub: string;
  visitor: Face; mon: string | null; ask: string; label: [string, string];
  rows: { id: string; name: string; rank: string; loyalty: number; traits: string[]; lean: string; bar: number; look: string; likely: string; can: boolean; why: string | null; on: boolean }[];
}
export interface TallyModel {
  kind: 'tally';
  day: number;
  rows: { face: Face; answer: string; chips: Chip[] }[];
  net: Chip[];
  back: boolean;
  lock: string;
  count: number;
}
export type ChairModel = VisitorModel | HandModel | TallyModel | { kind: 'none' };

const sign = (n: number): string => `${n < 0 ? '−' : '+'}${Math.abs(n).toLocaleString('en-US')}`;
const memberOf = (b: DominionBlock, id: string | null): Member | undefined => (id ? b.members.find((m) => m.id === id) : undefined);

function top(b: DominionBlock): Top {
  const d = b.field.districts[DOMINION_DATA.field.hq]!;
  return { funds: `₽${b.funds.toLocaleString('en-US')}`, heat: b.heat, regard: d.regard, dread: d.dread };
}

/** The word on a chip for one number. */
function word(b: DominionBlock, k: string): string {
  if (k.startsWith('loy:')) return `${memberOf(b, k.slice(4))?.name ?? 'Member'} Loyalty`;
  if (k === 'ten') return DOMINION_DATA.field.rivalTeam;
  const owed = (R().owed as Record<string, { word: string }>)[k];
  if (owed) return owed.word;
  const W: Record<string, string> = {
    funds: '₽', week: '₽/wk', heat: 'Heat', wanted: 'Wanted', regard: '♥', dread: '✊', morale: 'Morale', fame: 'Notoriety', mon: 'Pokémon',
    item: 'Items', join: 'Member', members: 'Member', rackets: 'Racket', cool: 'Heat/day', wage: 'Wage', happy: 'Pokémon mood', levels: 'Levels', jailed: 'Jailed', scout: 'Scout',
  };
  return W[k] ?? k;
}

/** An exact chip (the Tally, or "Chair numbers: Exact"). */
function exact(b: DominionBlock, k: string, n: number): Chip {
  const w = word(b, k);
  const money = k === 'funds' || k === 'week' || k === 'wage';
  const num = money ? `${n < 0 ? '−' : '+'}₽${Math.abs(n).toLocaleString('en-US')}${k === 'week' ? '/wk' : ''}` : sign(n);
  return { text: money ? num : `${w} ${num}`, cls: n > 0 ? 'up' : n < 0 ? 'dn' : '' };
}

/** What an answer moves, as chips: one arrow small, two arrows big (exact numbers when the setting says so). */
export function answerChips(b: DominionBlock, c: CourtCard, fx: CourtFx[], memberId: string | null, showExact: boolean, maybe = false): Chip[] {
  const out: Chip[] = [];
  const push = (k: string, n: number, raw = n): void => {
    if (!n) return;
    const big = k === 'funds' || k === 'week' ? Math.abs(raw) >= R().big.funds : Math.abs(raw) >= R().big.n;
    const chip = showExact ? exact(b, k, n) : { text: `${word(b, k)} ${n > 0 ? '▲' : '▼'}${big ? (n > 0 ? '▲' : '▼') : ''}`, cls: (n > 0 ? 'up' : 'dn') as Chip['cls'] };
    out.push(maybe ? { text: `${chip.text}?`, cls: 'q' } : chip);
  };
  for (const e of fx) {
    switch (e.k) {
      case 'funds': push('funds', scale(b, e.n) * (e.each ? Math.max(1, b.members.length) : 1), e.n); break;
      case 'deal': push('week', scale(b, e.n), e.n); break;
      case 'racket': push('funds', e.share < 0 ? -1 : 1, e.share < 0 ? -1 : 1); break;
      case 'zero': out.push({ text: '₽ back to 0', cls: 'up' }); break;
      case 'heat': case 'wanted': case 'regard': case 'dread': case 'morale': case 'fame': case 'mon': push(e.k, e.n); break;
      case 'heatAll': push('heat', e.n); break;
      case 'monMember': push('mon', e.n); break;
      case 'loyalty': push(e.who === 'all' ? 'crew' : `loy:${e.who === 'named' ? memberId ?? '' : ''}`, e.n); break;
      case 'owed': push(e.key, e.n); break;
      case 'item': if (e.id !== '*') out.push({ text: `+Item`, cls: maybe ? 'q' : 'up' }); else push('item', e.n); break;
      case 'join': out.push({ text: '+Member', cls: maybe ? 'q' : 'up' }); break;
      case 'leave': out.push({ text: '−Member', cls: maybe ? 'q' : 'dn' }); break;
      case 'tag': out.push({ text: e.tag === 'favour' ? 'Favour' : 'Grudge', cls: e.tag === 'favour' ? 'up' : 'dn' }); break;
      case 'follow': case 'later': out.push({ text: '? comes back', cls: 'q' }); break;
      case 'fight': out.push({ text: '⚔ a fight', cls: 'q' }); break;
      case 'chance': out.push(...answerChips(b, c, e.yes, memberId, showExact, true)); break;
    }
  }
  // The same number twice (Loyalty for two members) reads once.
  return out.filter((x, i) => out.findIndex((y) => y.text === x.text) === i).slice(0, 4);
}

function face(b: DominionBlock, c: CourtCard, memberId: string | null): Face {
  const m = memberOf(b, memberId);
  const crew = c.look === 'member' && m;
  const tag = b.chair?.tags[c.who === 'member' ? memberId ?? '' : c.who ?? ''] ?? null;
  // A visitor the list only describes ("Your first member's mum") goes by their role ("Rook's mum").
  const described = !crew && /^your /i.test(c.name) && !!c.role;
  return {
    name: crew ? m.name : cardText(b, described ? c.role! : c.name, memberId),
    role: crew ? `your ${rankWord(m.rank).toLowerCase()}` : described ? 'a visitor' : cardText(b, c.role ?? '', memberId),
    look: crew ? m.look : c.look.startsWith('mon:') ? c.look : c.look === 'member' ? m?.look ?? 'trainer/pr/rocket_grunt_m' : c.look,
    tag,
  };
}

function monOf(b: DominionBlock, c: CourtCard, memberId: string | null): string | null {
  if (c.foe) return c.foe.species[0]!;
  if (c.look === 'member') return memberOf(b, memberId)?.team[0]?.speciesId ?? null;
  return null;
}

export function chairModel(b: DominionBlock, run: Pick<RunState, 'party'>, at: number, hand: number | null): ChairModel {
  const ch = b.chair;
  if (!ch?.open) return { kind: 'none' };
  if (inTally(b)) return tallyModel(b);
  const door = atDoor(b)!;
  const c = door.card;
  const showExact = ch.opts.numbers === 'exact' || (ch.seen[String(c.id)] !== undefined && ch.seen[String(c.id)]! < b.day);
  const visitor = face(b, c, door.member);
  const ask = cardText(b, c.ask, door.member);
  if (hand !== null) {
    const can = handOffCrew(b, c, door).map((m) => m.id);
    const rows = b.members.map((m, i) => {
      const lean = leanOf(m);
      const named = m.id === door.member || m.id === door.second;
      const likely = can.includes(m.id) && lean !== 'none' ? cardText(b, (wouldPick(b, c, m, null) ? c.b : c.a).label, door.member) : '';
      const t = traitNow(m);
      return {
        id: m.id, name: m.name, rank: rankWord(m.rank), loyalty: m.loyalty, traits: [traitName(t), ...(crewOf(m).formed.length ? [traitName(crewOf(m).green)] : [])].slice(0, 2),
        lean: R().leanWord[lean] ?? lean, bar: R().leanBar[lean] ?? 50, look: m.look, likely,
        can: can.includes(m.id), why: named ? 'named on this card' : crewOf(m).out ? 'away tonight' : can.includes(m.id) ? null : 'below Grunt rank', on: i === hand,
      };
    });
    return { kind: 'hand', top: top(b), sub: `${ch.at + 1} of ${ch.docket.length}`, visitor, mon: monOf(b, c, door.member), ask, label: [c.a.label, c.b.label], rows };
  }
  const w = whisper(b, c, door.member);
  const lastRow = ch.result ? ch.tally.at(-1) : undefined;
  const species = run.party[0]?.speciesId ?? null;
  let lead: VisitorModel['lead'] = null;
  if (species) {
    let mood: 'happy' | 'growl' | 'sad' | 'calm' = 'calm';
    const ch2 = lastRow?.changes ?? {};
    if ((ch2.regard ?? 0) > 0 || (ch2.morale ?? 0) > 0) mood = 'happy';
    else if ((ch2.dread ?? 0) > 0) mood = 'growl';
    else if ((ch2.funds ?? 0) < 0 || (ch2.regard ?? 0) < 0) mood = 'sad';
    // `{mon}` is filled with the species' name by the screen.
    lead = { species, mood, react: lastRow ? R().react[mood] : '' };
  }
  return {
    kind: 'visitor', top: top(b), title: L().title!, sub: `${ch.at + 1} of ${ch.docket.length}`, chair: R().chairs[tierOf(b)]!, openHouse: b.day % R().openHouseEvery === 0,
    visitor, mon: monOf(b, c, door.member), ask, crisis: !!c.crisis,
    whisper: w ? { name: w.who.name, look: w.who.look, text: w.text, pick: w.pick } : null,
    answers: [c.a, c.b].map((a, i) => ({ label: cardText(b, a.label, door.member), chips: answerChips(b, c, a.fx, door.member, showExact), on: i === at, does: a.does })),
    hand: { can: !c.crisis && !ch.handed && handOffCrew(b, c, door).length > 0, left: ch.handed ? 0 : 1, on: at === 2 },
    result: ch.result,
    lead,
    canClose: !c.crisis && !ch.result,
    opts: ch.opts,
  };
}

function tallyModel(b: DominionBlock): TallyModel {
  const ch = b.chair!;
  const net: Record<string, number> = {};
  const rows = ch.tally.map((t) => {
    const c = cardById(t.card)!;
    const by = memberOf(b, t.by);
    const ans = t.pick < 0 ? 'Sent home' : by ? `${by.name} decided` : cardText(b, (t.pick ? c.b : c.a).label, t.member);
    for (const [k, n] of Object.entries(t.changes)) net[k] = (net[k] ?? 0) + n;
    return { face: { ...face(b, c, t.member), tag: t.tag }, answer: ans, chips: Object.entries(t.changes).slice(0, 3).map(([k, n]) => exact(b, k, n)) };
  });
  const keep = ['funds', 'week', 'regard', 'dread', 'heat', 'ten', 'threat', 'morale', 'fame'];
  const rh = rightHand(b);
  return {
    kind: 'tally', day: b.day, rows, count: ch.tally.length,
    net: keep.filter((k) => net[k]).map((k) => exact(b, k, net[k]!)),
    back: ch.tally.some((t) => t.back),
    lock: rh ? fill(L().lockDoor!, { name: rh.name }) : L().night!,
  };
}
