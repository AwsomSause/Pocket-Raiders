// DOMINION slice D4: view models for mockup 11 (the Pokémon Reserve) and mockup 12 (the Rank Pyramid). Plain data out;
// the views draw it and the controller keeps the cursors. Nothing here rolls or changes the block.

import { squadOf } from './squads';
import { crewOf, monName, rankN, rankWord } from './crew';
import { DOMINION_DATA } from './data';
import {
  aceCapOf, acesOf, bandOf, bstCapOf, levelCapOf, promoteProblem, rankLevel, rankRow, readyFor, regionBonus, seatsOpen, seatsTaken, standingOf, teamSizeOf,
} from './pyramid';
import { book, fitsMember, reserveSize, usable } from './reserve';
import type { DominionBlock, Member } from './schema';

const P = () => DOMINION_DATA.pyramid;
export const RESERVE_PAGE = 8;

/** D8: the squad Mark shown beside a face on the Pyramid (Part 10 §9). */
function markOf(b: DominionBlock, id: string): CandModel['mark'] {
  const s = squadOf(b, id);
  return s ? { ch: DOMINION_DATA.squads.marks[s.mark]!, colour: DOMINION_DATA.squads.colors[s.mark]!, squad: s.codeName } : null;
}

export interface SlotModel { uid: string; species: string; level: number; bad: string | null; ace: boolean; pens: number }
export interface TileModel { uid: string; species: string; level: number; bst: number; type: string; fits: boolean; ace: boolean; tag: string; on: boolean; trust: number }
export interface ReserveModel {
  types: [string, string];
  count: string;
  hq: string;
  /** Who gets it: a member, or the Boss (id 'boss'). */
  who: { id: string; name: string; look: string; pill: string; lvCap: number; bstCap: number | null; sum: string; size: number; slots: SlotModel[]; hunt: string | null };
  /** A second member to show (one with an Ace slot if any, else the next one). */
  other: { name: string; pill: string; ace: boolean; slots: SlotModel[]; note: string } | null;
  page: number;
  pages: number;
  fitsOnly: boolean;
  auto: boolean;
  tiles: TileModel[];
  /** The picked tile (if any) and whether it can go to `who`. */
  pick: TileModel | null;
  cta: { text: string; ok: boolean };
  notes: string[];
}

/** Days left in the Pens (0 when out). */
const pensLeft = (b: DominionBlock, uid: string): number => {
  const p = b.reserve?.meta[uid]?.pens ?? 0;
  return p > b.day ? p - b.day : 0;
};

function slotsOf(b: DominionBlock, m: Member): SlotModel[] {
  return m.team.map((x) => {
    const meta = b.reserve?.meta[x.uid];
    let bad: string | null = null;
    if (!usable(b, m, x) && meta) bad = meta.bst > bstCapOf(b, m) ? `${meta.bst} · over cap` : x.level > levelCapOf(b, m) ? `Lv ${x.level} · over cap` : 'off-type';
    return { uid: x.uid, species: x.speciesId, level: x.level, bad, ace: !!meta?.ace, pens: pensLeft(b, x.uid) };
  });
}

/** The targets the GIVE TO panel cycles through: every member, then the Boss. */
export const giveTargets = (b: DominionBlock): string[] => [...b.members.map((m) => m.id), 'boss'];

export function reserveModel(b: DominionBlock, whoId: string, at: number, page: number, fitsOnly: boolean, boss: { party: number; look: string }): ReserveModel {
  const r = b.reserve ?? book(structuredClone(b));
  const m = b.members.find((x) => x.id === whoId) ?? null;
  const st = standingOf(b);
  const who: ReserveModel['who'] = m
    ? {
        id: m.id, name: m.name, look: m.look, pill: `${rankWord(m.rank)} · RANK ${rankN(m.rank)}`, lvCap: levelCapOf(b, m), bstCap: bstCapOf(b, m),
        sum: `${rankRow(m.rank).bst} base + ${regionBonus(b)} region + ${st.bonus} ${st.word}`, size: teamSizeOf(m), slots: slotsOf(b, m),
        hunt: (r.hunt[m.id] ?? 'reserve') === 'self' ? 'Hunts for themselves' : 'Hunts for the Reserve',
      }
    : { id: 'boss', name: 'The Boss', look: boss.look, pill: 'THE BOSS · 16', lvCap: b.levelCap, bstCap: null, sum: 'No BST cap, no type rule', size: 6, slots: [], hunt: null };
  const all = r.box.map((x): TileModel => {
    const meta = r.meta[x.uid];
    const fit = m ? fitsMember(b, m, x) : { ok: x.level <= b.levelCap, ace: false, why: x.level <= b.levelCap ? null : `Lv ${x.level}` };
    const tag = fit.ok ? (fit.ace ? 'ACE' : 'FITS') : (fit.why ?? 'NO').toUpperCase().replace(/ > CAP \d+$/, '').replace(/^LV (\d+)$/, 'LV $1');
    return { uid: x.uid, species: x.speciesId, level: x.level, bst: meta?.bst ?? 0, type: meta?.types[0] ?? 'normal', fits: fit.ok, ace: fit.ace, tag, on: false, trust: meta?.trust ?? 0 };
  });
  const shown = fitsOnly ? all.filter((t) => t.fits) : all;
  const pages = Math.max(1, Math.ceil(shown.length / RESERVE_PAGE));
  const pg = Math.min(page, pages - 1);
  const tiles = shown.slice(pg * RESERVE_PAGE, pg * RESERVE_PAGE + RESERVE_PAGE);
  const pick = tiles[Math.min(at, tiles.length - 1)] ?? null;
  if (pick) pick.on = true;
  const aceHolder = b.members.find((x) => x.id !== whoId && acesOf(x) > 0);
  const nextOne = b.members[(b.members.findIndex((x) => x.id === whoId) + 1) % Math.max(1, b.members.length)];
  const o = aceHolder ?? (nextOne && nextOne.id !== whoId ? nextOne : undefined);
  const other = o
    ? { name: o.name, pill: rankWord(o.rank), ace: acesOf(o) > 0, slots: slotsOf(b, o), note: acesOf(o) > 0 ? `${acesOf(o) > 1 ? 'Two Aces' : 'One Ace'} of any type (cap ${aceCapOf(b, o)}).` : `Team ${o.team.length} of ${teamSizeOf(o)} · Lv cap ${levelCapOf(b, o)}` }
    : null;
  const pickName = pick ? monName(pick.species) : '';
  const full = m ? m.team.length >= teamSizeOf(m) : false;
  const cta = !pick
    ? { text: r.box.length ? 'Nothing here fits' : 'The Reserve is empty', ok: false }
    : pick.fits ? { text: `Give ${pickName} to ${m ? m.name : 'the Boss'}`, ok: true } : { text: `${pickName}: ${full ? P().why.full : all.find((t) => t.uid === pick.uid)!.tag.toLowerCase()}`, ok: false };
  const notes: string[] = [];
  for (const x of r.box) {
    const left = pensLeft(b, x.uid);
    if (left > 0) notes.push(`Stolen ${monName(x.speciesId)}: ${left} day${left === 1 ? '' : 's'} in the Pens.`);
  }
  const kept = b.report.find((l) => l.includes('“for') || l.includes('"for'));
  if (kept) notes.unshift(kept);
  return {
    types: b.types, count: `${r.box.length} / ${reserveSize(b)}`, hq: `HQ Lv ${b.hqLevel} · cap ${b.levelCap}`, who, other, page: pg, pages, fitsOnly,
    auto: r.auto, tiles, pick, cta, notes: notes.slice(0, 2),
  };
}

// ---------- mockup 12: the Rank Pyramid ----------

export interface TierModel { n: number; label: string; z: string; seats: ('f' | 'o' | 'w')[]; count: string | null; hot: boolean; locked: boolean; left: number; top: number; width: number }
export interface CandModel { id: string; name: string; look: string; rank: string; level: number; loyalty: number; ambition: number; z: string; stripe: string; mark: { ch: string; colour: string; squad: string } | null }
export interface PyramidModel {
  crew: string;
  hq: string;
  tiers: TierModel[];
  head: string;
  headRight: string;
  cands: CandModel[];
  alert: string | null;
  info: string[];
  cta: { text: string; ok: boolean };
  /** Where the gold thread starts (the hot tier's open seat), or null. */
  thread: { x: number; y: number } | null;
  evening: boolean;
  /** The capstone's letter: the team's initial (blank until the Founding). */
  initial: string;
}

/** Members in pyramid order (highest rank first), the order the cursor walks. */
export const pyramidOrder = (b: DominionBlock): Member[] => [...b.members].sort((a, x) => rankN(x.rank) - rankN(a.rank) || a.id.localeCompare(x.id, undefined, { numeric: true }));

const STRIPE: Record<string, string> = { 'z-st': '#5a6488', 'z-crew': '#2bb3a5', 'z-off': '#3f7ad8', 'z-cmd': '#7b3fa0', 'z-inner': '#c08a2a' };

export function pyramidModel(b: DominionBlock, sel: number, hqName: string): PyramidModel {
  const order = pyramidOrder(b);
  const m = order[Math.min(sel, order.length - 1)] ?? null;
  const ready = m ? readyFor(b, m) : null;
  const target = ready ?? (m ? DOMINION_DATA.pyramid.ranks[rankN(m.rank)] ?? null : null);
  const geo = (i: number) => ({ left: Math.round(219 - 14.5 * i), top: Math.round(70 + 30.4 * i), width: Math.round(170 + 29 * i) });
  const tiers: TierModel[] = [];
  tiers.push({ n: 16, label: 'THE BOSS', z: 'z-inner', seats: ['f'], count: null, hot: false, locked: false, ...geo(0) });
  for (let n = 15; n >= 3; n--) {
    const row = P().ranks[n - 1]!;
    const taken = seatsTaken(b, row.id);
    const hot = !!target && target.id === row.id;
    let seats: TierModel['seats'] = [];
    let count: string | null = null;
    if (row.seats) {
      seats = Array.from({ length: row.seats }, (_, i) => (i < taken ? 'f' : 'o'));
      if (hot && seatsOpen(b, row.id)) seats[taken] = 'w';
    } else count = `${taken} member${taken === 1 ? '' : 's'}`;
    tiers.push({ n, label: rankWord(row.id), z: bandOf(row.id).z, seats, count, hot, locked: row.hq > b.hqLevel, ...geo(16 - n) });
  }
  const low = seatsTaken(b, 'recruit') + seatsTaken(b, 'hopeful');
  tiers.push({ n: 2, label: 'RECRUIT · HOPEFUL', z: 'z-st', seats: [], count: `${low} member${low === 1 ? '' : 's'}`, hot: !!target && (target.id === 'recruit' || target.id === 'hopeful'), locked: false, ...geo(14) });
  const hotTier = tiers.find((t) => t.hot && t.seats.includes('w'));
  const thread = hotTier ? { x: hotTier.left + hotTier.width - 14, y: hotTier.top + 14 } : null;
  const cands: CandModel[] = [];
  let head = '';
  let headRight = '';
  let alert: string | null = null;
  const info: string[] = [];
  if (m && target) {
    const others = order.filter((x) => x.id !== m.id && x.rank === m.rank && readyFor(b, x)?.id === target.id);
    for (const x of [m, ...others].slice(0, 2)) {
      const c = crewOf(x);
      cands.push({ id: x.id, name: x.name, look: x.look, rank: rankWord(x.rank), level: x.level, loyalty: x.loyalty, ambition: c.ambition, z: bandOf(x.rank).z, stripe: STRIPE[bandOf(x.rank).z] ?? '#7b3fa0', mark: markOf(b, x.id) });
    }
    const row = rankRow(target.id);
    head = row.seats ? (seatsOpen(b, target.id) ? `${rankWord(target.id)} SEAT OPEN` : `${rankWord(target.id)} SEATS FULL`) : `NEXT: ${rankWord(target.id)}`;
    headRight = row.seats ? `${seatsTaken(b, target.id)} of ${row.seats} filled` : 'open rank';
    const rival = cands[1];
    if (rival && row.seats && seatsOpen(b, target.id) === 1) alert = `Pass ${rival.name} over and their Ambition goes up ${P().moves.passedAmbition}.`;
    if (!ready) info.push(`${rankWord(target.id)} needs member Lv ${rankLevel(target.id)} (${m.name} is Lv ${m.level}) and HQ Lv ${row.hq}.`);
    info.push(row.unlocks);
  } else if (m) {
    head = `${rankWord(m.rank)}`;
    headRight = 'the top';
  }
  const problem = m ? promoteProblem(b, m) : 'No crew yet.';
  const cta = m && !problem ? { text: `Promote ${m.name}`, ok: true } : { text: problem ?? '', ok: false };
  return {
    crew: `Crew ${b.members.length} / ${b.rosterCap}`, hq: `HQ Lv ${b.hqLevel} · ${hqName}`, tiers, head, headRight, cands, alert, info, cta, thread, evening: b.phase === 'evening',
    initial: b.teamName ? b.teamName[0]!.toUpperCase() : '',
  };
}
