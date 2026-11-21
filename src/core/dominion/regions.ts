// DOMINION slice D15: many regions (design Part 5 §3-6, Part 9 A11-A13, Part 0 §6.1 Q3/Q7; mockup v4 s10).
//   - Leaving: once a region is Taken the Boss picks a Holder (yourself, an Admin or higher, or the usurped Boss), sets
//     standing orders (A12) and brings ONE member (A13). Everyone else stays with the Holder.
//   - Arriving: a fresh start in the next region (one warehouse, ₽1,000, Q3), the Boss's ace turned back into its
//     pre-evolved form at Lv 15 (Q7), Notoriety capped at Street Gang, and every held region's Boon.
//   - Each week, every held region moves: Stability (Part 5 §3), tribute, unrest and revolt, Uprisings and new Heroes,
//     and the Holder's betrayal check (A11: Secession, the Sellout, the Coup), scaled by the run's Betrayals rule (D27).
//   - Answers from the Empire screen: Visit, Pay, Replace, Spy, the Long Talk, standing orders, the Long Trip, Let go.
// Pure: no Phaser. Rolls use their own streams (`dominion-realm::...`), so nothing that rolled before moves.

import type { Content } from '../contentSchema';
import { xpForLevel, maxHp } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { activeRegion, DOMINION_DATA, setActiveRegion, useRegion } from './data';
import { chairOf, setChairHook, setChairOwed } from './chair';
import { crewOf, leave as crewLeave, rankN, withCrew } from './crew';
import { isHeld, stepById } from './empire';
import { empireOf } from './book';
import { addActedHook, addCardHook, addFightSettler, addOddsPartHook, foeLevel, setRealmFoe } from './field';
import { ensureHero, heroDefOf, heroOf } from './hero';
import { addPriceHook, withHq } from './hqFx';
import { newField } from './migrate';
import { fillCards } from './personality';
import { makeLead } from './recruit';
import { seedStart, withReserve } from './reserve';
import { addTension, teamsHere, withRivals } from './rivals';
import { betrayalFactor } from './rules';
import { DominionBlockSchema, POLICY_KEYS, type DominionBlock, type HeldRegion, type Member, type PolicyOption, type RealmState, type RegionPack } from './schema';
import { newBlock } from './start';
import { addWorldEnd, fill } from './worldTurn';

const RG = () => DOMINION_DATA.regions;
const F = () => DOMINION_DATA.field;
const L = (k: string): string => RG().lines[k] ?? k;
const rngOf = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, 'dominion-realm', ...key].join('::')));
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const weekLen = (): number => DOMINION_DATA.start.clock.weekLength;

export type PolicyKey = (typeof POLICY_KEYS)[number];
export type Orders = Record<PolicyKey, string>;

// ---------- state ----------

export function freshRealm(): RealmState {
  return { at: 'kanto', base: 0, held: [], brought: null, said: 0, away: 0, skies: null, boonWeek: 0, spreadFree: false, freeUpgrade: false, freeInfirmary: false, trip: null };
}
export function realmOf(b: DominionBlock): RealmState {
  return (b.realm ??= freshRealm());
}
/** The run's day across regions (the Empire screen's "Run day"). */
export const runDay = (b: DominionBlock): number => (b.realm?.base ?? 0) + b.day;
export const regionName = (id: string): string => RG().regions[id]?.name ?? id.charAt(0).toUpperCase() + id.slice(1);
export const packOf = (id: string): RegionPack | undefined => DOMINION_DATA.packs[id];

/** The regions this run plays, in order: the run's length, of the regions open in this release (Kanto, Johto, Hoenn). */
export function regionsInRun(b: DominionBlock): string[] {
  const n = RG().lengths[b.rules?.length ?? 'three'];
  return RG().order.filter((id) => RG().open.includes(id)).slice(0, n);
}
/** The next region to sail for, or null when this is the run's last. */
export function nextRegion(b: DominionBlock): string | null {
  const here = b.realm?.at ?? 'kanto';
  const seen = new Set([here, ...(b.realm?.held ?? []).map((h) => h.id)]);
  return regionsInRun(b).find((id) => !seen.has(id)) ?? null;
}
/** Why the Boss can't leave yet (null when they can). */
export function leaveProblem(b: DominionBlock): string | null {
  if (!b.takeover?.taken) return fill(L('leaveNotYet'), { region: regionName(activeRegion()) });
  if (!nextRegion(b)) return L('lastRegion');
  if (b.field.fight) return 'A fight is waiting.';
  return null;
}

// ---------- Holders (Part 5 §4) ----------

export interface HolderPick { id: string; kind: 'self' | 'member' | 'usurped'; name: string; rank: string | null; note: string }

/** Is this member the usurped rival Boss (merged in through the Debate)? */
const usurpedMember = (m: Member): boolean => crewOf(m).cls === 'Boss';
/** The beaten rival Boss who could hold the region for you (Wipe Out took their HQ), when none of them joined the crew. */
function beatenBoss(b: DominionBlock): string | null {
  if (!b.takeover?.paths.includes('wipe')) return null;
  return teamsHere()[0]?.boss.name ?? null;
}

export function holderPicks(b: DominionBlock): HolderPick[] {
  const H = RG().holders;
  const out: HolderPick[] = [{ id: 'self', kind: 'self', name: 'Yourself', rank: null, note: H.why.self! }];
  for (const m of b.members) {
    if (usurpedMember(m)) out.push({ id: m.id, kind: 'usurped', name: m.name, rank: m.rank, note: H.why.usurped! });
    else if (H.ranks.includes(m.rank)) out.push({ id: m.id, kind: 'member', name: m.name, rank: m.rank, note: H.why.member! });
  }
  const boss = beatenBoss(b);
  if (boss && !out.some((p) => p.kind === 'usurped')) out.push({ id: 'usurped', kind: 'usurped', name: boss, rank: null, note: H.why.usurped! });
  return out;
}

// ---------- standing orders (A12) ----------

export const defaultOrders = (): Orders => ({ ...RG().policies.default } as Orders);
export const policyOf = (key: PolicyKey, id: string): PolicyOption | undefined => RG().policies[key].options.find((o) => o.id === id);
export function ordersProblem(o: Partial<Orders>): string | null {
  for (const k of POLICY_KEYS) if (!o[k] || !policyOf(k, o[k]!)) return `Pick a ${RG().policies[k].name} order.`;
  return null;
}
/** "Let the Holder decide": a member picks by their motive (A12). */
function pickedPeople(h: HeldRegion): string {
  if (h.orders.people !== 'holder') return h.orders.people;
  const motive = h.holder.member ? crewOf(h.holder.member).motive : 'power';
  return RG().policies.holderPicks[motive] ?? 'train';
}
/** The orders as the Holder reads them: motive-coloured readings replace the plain option (A12). */
function readOrders(h: HeldRegion): { opt: PolicyOption; reading: (typeof RG extends () => infer R ? R : never)['policies']['readings'][number] | null }[] {
  const motive = h.holder.member ? crewOf(h.holder.member).motive : null;
  const usurped = h.holder.kind === 'usurped';
  return POLICY_KEYS.map((k) => {
    const id = k === 'people' ? pickedPeople(h) : h.orders[k];
    const opt = policyOf(k, id) ?? RG().policies[k].options[0]!;
    const reading = h.holder.kind === 'self' ? null
      : RG().policies.readings.find((r) => r.policy === opt.id && ((r.usurped && usurped) || (!!r.motive && r.motive === motive))) ?? null;
    return { opt, reading };
  });
}
/** What the four orders add up to this week. */
function orderSum(h: HeldRegion): { tribute: number; stab: number; risk: number; grow: number; crew: number; towns: number; uprising: number; hero: number; revolt: number; guard: number; dread: boolean; lines: string[] } {
  const s = { tribute: 100, stab: 0, risk: 0, grow: 0, crew: 0, towns: 0, uprising: 0, hero: 0, revolt: 0, guard: 0, dread: false, lines: [] as string[] };
  for (const { opt, reading } of readOrders(h)) {
    const r = reading;
    const trib = r?.tribute ?? opt.tribute;
    if (trib !== undefined) s.tribute = Math.round((s.tribute * trib) / 100);
    s.stab += r?.stab ?? opt.stab ?? 0;
    s.risk += r?.risk ?? opt.risk ?? 0;
    s.grow += r?.grow ?? opt.grow ?? 0;
    s.crew += r?.crew ?? opt.crew ?? 0;
    s.towns += opt.towns ?? 0;
    s.uprising += opt.uprising ?? 0;
    s.hero += opt.hero ?? 0;
    s.revolt += opt.revolt ?? 0;
    s.guard += opt.guard ?? 0;
    if (r?.dread) s.dread = true;
    s.lines.push(fill(r?.line ?? opt.line, { holder: h.holder.name, region: regionName(h.id) }));
  }
  return s;
}

// ---------- Stability and betrayal (Part 5 §3, A11) ----------

export const bandOf = (stab: number) => RG().stability.bands.find((x) => stab >= x.min) ?? RG().stability.bands.at(-1)!;
export const riskBand = (chance: number): string => [...RG().betrayal.bands].reverse().find((x) => chance >= x.min)?.word ?? RG().betrayal.bands[0]!.word;

/** A11: the Holder's betrayal risk, before Stability. Yourself: 0. */
export function riskOf(b: DominionBlock, h: HeldRegion): number {
  if (h.holder.kind === 'self' || h.status !== 'held') return 0;
  const B = RG().betrayal, m = h.holder.member;
  let r = 0;
  if (m) {
    const c = crewOf(m);
    if (c.formed.some((t) => (DOMINION_DATA.crew.formed.find((f) => f.id === t)?.mods as { ambition?: number } | undefined)?.ambition)) r += B.ambitionTrait;
    if (c.ambition > B.ambitionAt) r += Math.floor((c.ambition - B.ambitionAt) / B.ambitionShare);
    if (m.loyalty < B.loyaltyOver) r += Math.floor((B.loyaltyOver - m.loyalty) / 2);
  }
  if (h.holder.kind === 'usurped') r += B.usurped;
  r += h.away * B.perWeekAway;
  if (h.tribute > B.tributeOver) r += Math.floor((h.tribute - B.tributeOver) / 5) * B.per5Tribute;
  r += h.grievances * B.grievance;
  if (h.offer) r += B.rivalOffer;
  if (h.raised) r += B.raise;
  if (h.spy) r += B.spy;
  r += orderSum(h).risk;
  r = Math.max(0, r);
  // A Convinced Boss (the Debate's loyal Merger) and the Long Talk halve it.
  if ((B.convincedHalf && m && convinced(b, m)) || h.talked) r = Math.round(r / 2);
  return r;
}
const convinced = (b: DominionBlock, m: Member): boolean =>
  usurpedMember(m) && Object.entries(b.debate?.deals ?? {}).some(([team, d]) => d.loyal && DOMINION_DATA.rivals.teams.find((t) => t.id === team)?.boss.name === m.name);

/** The weekly betrayal chance, % (risk and Stability, A11), scaled by the run rule and Kingmaker; capped. */
export function betrayalChance(b: DominionBlock, h: HeldRegion): number {
  if (h.holder.kind === 'self' || h.status !== 'held') return 0;
  const B = RG().betrayal;
  let c = riskOf(b, h) / B.riskShare + Math.max(0, 50 - h.stability) / B.stabilityShare;
  c *= betrayalFactor(b);
  if (B.kingmakerHalf && b.members.some((m) => crewOf(m).formed.includes('kingmaker'))) c /= 2;
  return Math.round(clamp(c, 0, B.cap));
}

/** Which betrayal a Holder picks (A11): the usurped Boss secedes; money or fear sells you out; a senior rank goes for the empire. */
function kindOf(b: DominionBlock, h: HeldRegion): 'secession' | 'sellout' | 'coup' {
  if (h.holder.kind === 'usurped') return 'secession';
  const m = h.holder.member;
  if (m && RG().betrayal.sellout.includes(crewOf(m).motive)) return 'sellout';
  if (m && RG().holders.coupRanks.includes(m.rank) && b.realm!.held.filter((x) => x.status === 'held').length > 1) return 'coup';
  return 'secession';
}

function betray(b: DominionBlock, h: HeldRegion, seed: string, lines: string[]): void {
  const kind = kindOf(b, h), K = RG().kinds[kind];
  const v = { holder: h.holder.name, region: regionName(h.id) };
  h.kind = kind;
  h.traitor = h.holder.name;
  if (kind === 'sellout') {
    h.status = 'sellout';
    h.wanted = clamp(h.wanted + RG().betrayal.sellWanted, 0, 100);
  } else h.status = 'seceded';
  lines.push(fill(L('betrayed'), { text: fill(K.text, v) }));
  if (kind !== 'coup') return;
  // The Coup: every other Holder gets the letter; each may side with them.
  for (const o of b.realm!.held) {
    if (o === h || o.status !== 'held' || o.holder.kind === 'self') continue;
    const r = rngOf(seed, 'coup', runDay(b), o.id);
    const from = { holder: o.holder.name, from: h.holder.name, region: regionName(o.id) };
    if (r.int(1, 100) <= Math.round(RG().betrayal.coupChance * betrayalFactor(b))) {
      o.status = 'seceded';
      o.kind = 'coup';
      o.traitor = o.holder.name;
      lines.push(fill(L('coupJoin'), from));
    } else lines.push(fill(L('coupHeld'), from));
  }
}

/** One held region's week (Part 5 §3, A11, A12). Mutates `h`; returns the Morning Report lines and the tribute paid. */
function heldWeek(b: DominionBlock, h: HeldRegion, seed: string): { lines: string[]; tribute: number } {
  const S = RG().stability, lines: string[] = [];
  const day = runDay(b), r = rngOf(seed, 'week', day, h.id);
  if (h.status === 'lost' || h.status === 'seceded') return { lines, tribute: 0 };
  const o = orderSum(h);
  const v = { holder: h.holder.name, region: regionName(h.id) };
  let d = S.path[h.path] + o.stab;
  if (h.holder.kind === 'self') {
    if (day - h.visited > RG().holders.self.visitEvery) {
      d += RG().holders.self.missed;
      h.visited = day; // the hit lands once per missed fortnight
      lines.push(fill(L('selfMissed'), { region: v.region, days: RG().holders.self.visitEvery }));
    }
  } else {
    d -= S.decay;
    const m = h.holder.member;
    if (m) {
      d += Math.max(0, m.stats.wits - S.witsOver) * S.perWits;
      for (const t of crewOf(m).formed) d += S.traitBonus[t] ?? 0;
    }
  }
  if (h.wanted > S.wanted.over) d += S.wanted.n;
  if (h.status === 'sellout') d += S.wanted.n;
  // An Uprising (Monarch's ruled regions, Part 5 §1) and a new Hero (Part 5 §3) are the region's own rolls.
  if (h.path === 'monarch' && r.int(1, 100) <= Math.round((S.uprising.chance * (100 + o.uprising + uprisingMod(b))) / 100)) {
    d += S.uprising.hit;
    lines.push(fill(L('uprising'), v));
  }
  if (r.int(1, 100) <= Math.round((S.newHero.chance * (100 + o.hero)) / 100)) {
    d += S.newHero.hit;
    lines.push(fill(L('newHero'), { ...v, hero: heroFor(h.id, r) }));
  }
  if (h.path === 'shadow' && h.wanted > S.wanted.over && r.int(1, 100) <= S.shadowCrack.chance) {
    h.towns = Math.max(0, h.towns - S.shadowCrack.towns);
    lines.push(fill(L('cracked'), v));
  }
  const floor = h.holder.kind === 'self' ? RG().holders.self.floor : 0;
  h.stability = clamp(h.stability + d, floor, 100);
  // Unrest takes a town a week; a Revolt takes three and stops the tribute (Part 5 §3). Guards (orders) may save one.
  const band = bandOf(h.stability);
  if (band.id === 'unrest' && r.int(1, 100) > o.guard) {
    h.towns = Math.max(0, h.towns - S.unrestLoss);
    lines.push(fill(L('unrest'), { ...v, towns: h.towns }));
  } else if (band.id === 'revolt' && r.int(1, 100) > o.revolt) {
    const n = Math.min(h.towns, S.revoltLoss);
    h.towns -= n;
    lines.push(fill(L('revolt'), { ...v, n }));
  }
  h.towns = Math.max(0, h.towns + o.towns);
  h.crew = Math.max(0, h.crew + o.crew);
  if (h.towns === 0) {
    h.status = 'lost';
    lines.push(fill(L('lost'), v));
    return { lines, tribute: 0 };
  }
  // A rival offer reaches the Holder now and then (A11).
  h.offer = h.holder.kind !== 'self' && r.int(1, 100) <= RG().betrayal.rivalOfferChance;
  // The tribute: a share of the region's income, by the orders, cut by unrest.
  const tribute = Math.max(0, Math.round((h.base * h.towns * h.tribute * o.tribute * bandOf(h.stability).boon * (100 + tributeMod(b))) / 100 / 100 / 100 / 100));
  h.last = tribute;
  h.base += o.grow > 0 ? Math.round((h.base * o.grow) / 100) : 0;
  lines.push(fill(L('week'), { ...v, stab: h.stability, word: band.word, tribute }));
  // Tells as the risk climbs (A11): one line per threshold passed.
  const chance = betrayalChance(b, h);
  const at = RG().betrayal.tellsAt.filter((x) => chance >= x).length;
  if (at > h.tells) {
    h.tells = at;
    lines.push(fill(RG().tells[(at + h.id.length) % RG().tells.length]!, v));
  }
  // The betrayal check (A11), on its own stream; Betrayals: Off never rolls.
  if (chance > 0 && rngOf(seed, 'betray', day, h.id).int(1, 100) <= chance) betray(b, h, seed, lines);
  // The week's things that build reset; the Boss being away adds a week.
  h.away += 1;
  h.spy = false;
  return { lines, tribute: h.status === 'held' ? tribute : 0 };
}
const heroFor = (id: string, r: Rng): string => {
  const reg = DOMINION_DATA.hero.regions[id];
  const pool = reg?.heroes ?? [];
  return pool.length ? heroDefOf(pool[r.int(0, pool.length - 1)]!).name : 'a kid with a bike';
};

/** D12 card 129: the Chair's answer moves Monarch Uprising checks (−50% bought off, +25% refused). */
const uprisingMod = (b: DominionBlock): number => (b.flags.includes('uprising-cut') ? RG().chair.uprisingCut : 0) + (b.flags.includes('uprising-up') ? RG().chair.uprisingUp : 0);
/** The Chair's lasting tribute answers (cards 127, 128), as a percent change. */
const tributeMod = (b: DominionBlock): number => (b.flags.includes('tribute-cut') ? -RG().chair.tributeCut : 0) + (b.flags.includes('smuggle-line') ? RG().chair.smuggle : 0);
/** The Chair's lasting answers about the held regions travel with the Boss to every new region. */
const REALM_FLAGS = ['tribute-cut', 'smuggle-line', 'uprising-cut', 'uprising-up'];
const flagOn = (b: DominionBlock, on: string, off?: string): void => {
  b.flags = [...b.flags.filter((f) => f !== on && f !== off), on];
};
const heldNow = (b: DominionBlock): HeldRegion[] => b.realm?.held.filter((h) => h.status === 'held') ?? [];

// ---------- the Chair (court cards 80, 126-129, 132 waited for D15) ----------

// `stab:N` moves every held region's Stability; before the first one is held it waits in chair.owed and lands on leaving.
setChairOwed('stab', (b, n) => {
  const held = heldNow(b);
  if (!held.length) {
    const ch = chairOf(b);
    ch.owed.stab = (ch.owed.stab ?? 0) + n;
    return;
  }
  for (const h of held) h.stability = clamp(h.stability + n, 0, 100);
});
setChairHook('magma-cool', (b) => {
  const n = RG().chair.tension;
  if (!b.rivals?.teams.magma || !b.rivals.teams.aqua) return null;
  addTension(b, 'magma', -n);
  addTension(b, 'aqua', n);
  return fill(L('magmaCool'), { n });
});
setChairHook('aqua-cool', (b) => {
  const n = RG().chair.tension;
  if (!b.rivals?.teams.aqua || !b.rivals.teams.magma) return null;
  addTension(b, 'aqua', -n);
  addTension(b, 'magma', n);
  return fill(L('aquaCool'), { n });
});
// Card 126: two hands from the crew go to the newest held region (the lowest ranks first, never an officer).
setChairHook('held-two', (b) => {
  const h = heldNow(b).at(-1);
  if (!h) return null;
  const officers = new Set(RG().holders.ranks);
  const pick = b.members.filter((m) => !officers.has(m.rank)).sort((x, y) => rankN(x.rank) - rankN(y.rank) || x.level - y.level || x.id.localeCompare(y.id)).slice(0, RG().chair.sendTwo);
  if (!pick.length) return fill(L('sentNone'), { region: regionName(h.id) });
  for (const m of pick) crewLeave(b, m, 'held', null, '', []);
  h.crew += pick.length;
  return fill(L('sentTwo'), { names: pick.map((m) => m.name).join(' and '), region: regionName(h.id) });
});
setChairHook('tribute-cut', (b) => (flagOn(b, 'tribute-cut'), fill(L('tributeCut'), { n: RG().chair.tributeCut })));
setChairHook('smuggle-line', (b) => (flagOn(b, 'smuggle-line'), fill(L('smuggle'), { n: RG().chair.smuggle })));
setChairHook('uprising-cut', (b) => (flagOn(b, 'uprising-cut', 'uprising-up'), fill(L('uprisingCut'), { n: -RG().chair.uprisingCut })));
setChairHook('uprising-up', (b) => (flagOn(b, 'uprising-up', 'uprising-cut'), fill(L('uprisingUp'), { n: RG().chair.uprisingUp })));

// ---------- the World Turn: every week, the held regions; boons; the brought member remembers ----------

addWorldEnd((b, seed) => {
  if (!b.realm || !b.opened) return [];
  const R = b.realm, lines: string[] = [];
  if (b.day % weekLen() !== 0) return [];
  let total = 0;
  for (const h of R.held) {
    const out = heldWeek(b, h, seed);
    lines.push(...out.lines);
    total += out.tribute;
  }
  if (total > 0) {
    b.funds += total;
    const e = empireOf(b);
    e.week.tribute = (e.week.tribute ?? 0) + total;
    lines.push(fill(L('tribute'), { n: total.toLocaleString('en-GB') }));
  }
  lines.push(...boonsWeek(b, seed));
  const said = remember(b, seed);
  if (said) lines.push(said);
  return lines;
});

// ---------- Boons (Part 5 §5) ----------

/** A held region's Boon strength now, % (Stability's band: Unrest halves it, Revolt stops it). */
export function boonPower(b: DominionBlock, boon: string): number {
  const def = RG().boons.find((x) => x.id === boon);
  const h = def && b.realm?.held.find((x) => x.id === def.region);
  return h && (h.status === 'held' || h.status === 'sellout') ? bandOf(h.stability).boon : 0;
}
const has = (b: DominionBlock, boon: string): boolean => boonPower(b, boon) > 0;

function boonsWeek(b: DominionBlock, seed: string): string[] {
  const R = realmOf(b), out: string[] = [];
  const week = Math.floor(b.day / weekLen());
  if (R.boonWeek === week) return out;
  R.boonWeek = week;
  if (has(b, 'radio') && !R.spreadFree) {
    R.spreadFree = true;
    out.push(L('boonSpread'));
  }
  if (has(b, 'network') && b.members[0]) {
    const lead = makeLead(b, b.members[0], `${seed}::realm-walkin::${week}`);
    if (lead) out.push(fill(L('boonWalk'), { name: lead.name }));
  }
  if (has(b, 'weather')) {
    R.skies = { district: b.field.at, until: b.day + weekLen() };
    out.push(fill(L('boonSkies'), { district: F().districts.find((d) => d.id === b.field.at)?.name ?? b.field.at }));
  }
  if (has(b, 'academy')) out.push(...academy(b));
  return out;
}
/** Paldea's Academy archive: every member gets Wits +1 once. */
function academy(b: DominionBlock): string[] {
  const out: string[] = [];
  for (const m of b.members) {
    const c = crewOf(m);
    if (c.flags.includes('academy')) continue;
    c.flags.push('academy');
    m.stats.wits = Math.min(10, m.stats.wits + 1);
    out.push(fill(L('boonWits'), { name: m.name }));
  }
  return out;
}

// Radio Tower: Spread the Word costs no Day action once a week.
addCardHook((b, _run, c) => {
  if (c.def.id === 'spread-the-word' && b.realm?.spreadFree && c.def.slot === 'day') {
    c.cost = c.travel.cost;
    c.note = [c.note, 'Radio Tower: free this week.'].filter(Boolean).join(' ');
  }
});
addActedHook((b, def) => {
  if (def.id === 'spread-the-word' && b.realm?.spreadFree) b.realm.spreadFree = false;
});
// Weather Institute (limited): fair skies over one district, +10% on jobs there this week.
addOddsPartHook((b) => {
  const s = b.realm?.skies;
  if (!s || b.day > s.until || s.district !== b.field.at) return [];
  return [['Fair skies', Math.round((RG().arrive.fairSkies * boonPower(b, 'weather')) / 100)]];
});
// Galactic science: Science Labs −50%. Lumiose money: the first HQ upgrade in a region is free. Aether: the Infirmary is free.
addPriceHook((b, what, price) => {
  if (!b.realm?.held.length) return price;
  const sci = RG().boons.find((x) => x.id === 'science')!;
  if (sci.rooms?.includes(what) && has(b, 'science')) return Math.round(price * (1 - (0.5 * boonPower(b, 'science')) / 100));
  if (what === 'hq-upgrade' && has(b, 'lumiose') && b.hqLevel === DOMINION_DATA.start.start.hqLevel) return 0;
  if (what === 'infirmary' && has(b, 'aether') && !(b.hq?.rooms ?? []).some((r) => r.id === 'infirmary')) return 0;
  return price;
});

// ---------- the brought member remembers (A13) ----------

function remember(b: DominionBlock, seed: string): string | null {
  const R = realmOf(b);
  const m = R.brought ? b.members.find((x) => x.id === R.brought) : undefined;
  const last = R.held.at(-1);
  if (!m || !last) return null;
  const M = RG().memory;
  const banks = [M.arrive, M.compare, M.name, M.warn];
  if (R.said >= banks.length * 2) return null;
  const bank = banks[R.said % banks.length]!;
  const line = bank[rngOf(seed, 'memory', R.said, m.id).int(0, bank.length - 1)]!;
  R.said += 1;
  const here = teamsHere()[0]?.name ?? 'the locals';
  const text = fill(line, {
    region: regionName(R.at), rival: here, oldRival: last.rival ?? 'the old lot', hero: heroDefOf(heroOf(b).id).name, oldHero: last.hero ?? 'the old Hero',
    old: last.holder.kind === 'self' ? 'the old crew' : last.holder.name, oldRegion: regionName(last.id),
  });
  return `${m.name}: "${text}"`;
}

// ---------- leaving and arriving (Part 5 §6, Q3, Q7, A13) ----------

export interface LeaveChoice { holder: string; orders: Orders; bring: string | null }

/** The Boss's ace: the highest level in the party (the first on a tie). */
export const aceOf = (run: Pick<RunState, 'party'>): PokemonInstance | undefined =>
  run.party.reduce<PokemonInstance | undefined>((a, m) => (!a || m.level > a.level ? m : a), undefined);
/** Q7: the ace turned back one stage (Charizard → Charmeleon), at the new Warehouse cap; moves, nature, IVs, EVs kept. */
export function preEvolve(content: Content, mon: PokemonInstance, level: number): PokemonInstance {
  const sp = content.species.get(mon.speciesId);
  const from = sp?.evolvesFrom && content.species.get(sp.evolvesFrom) ? sp.evolvesFrom : mon.speciesId;
  const out: PokemonInstance = { ...structuredClone(mon), speciesId: from, level };
  const to = content.species.get(from)!;
  out.xp = xpForLevel(to.growthRate, level, content.balance.difficulty.highLevelXp);
  out.hp = maxHp(content, out);
  return out;
}

/** The region's weekly income per held town when the Boss leaves (the tribute is a share of it). */
function basePerTown(b: DominionBlock, towns: number): number {
  const weeks = (b.empire?.weeks ?? []).slice(-4);
  const gross = weeks.length ? weeks.reduce((a, w) => a + Math.max(0, w.clean + w.dirty), 0) / weeks.length : 0;
  return Math.max(RG().tribute.share * 10, Math.round(gross / Math.max(1, towns)));
}

/**
 * Leaves the Taken region for the next one. The Holder keeps the old region; the brought member and the ace come along.
 * Returns the new run (a fresh block for the next region), or why not.
 */
export function leave(content: Content, run0: RunState, choice: LeaveChoice): { run: RunState; problem: string | null } {
  const old = run0.expansion?.dominion;
  if (!old) return { run: run0, problem: 'No Dominion here.' };
  useRegion(old);
  const why = leaveProblem(old) ?? ordersProblem(choice.orders);
  if (why) return { run: run0, problem: why };
  const pick = holderPicks(old).find((p) => p.id === choice.holder);
  if (!pick) return { run: run0, problem: 'Pick who holds the region.' };
  if (choice.bring && (choice.bring === choice.holder || !old.members.some((m) => m.id === choice.bring))) return { run: run0, problem: 'Pick someone else to bring.' };
  const from = activeRegion(), to = nextRegion(old)!;
  const R0 = old.realm ?? freshRealm();
  const path = old.takeover!.taken!.path;
  const towns = Object.values(old.field.districts).filter(isHeld).length || 1;
  const holderMember = pick.kind !== 'self' ? old.members.find((m) => m.id === pick.id) ?? null : null;
  const brought = choice.bring ? structuredClone(old.members.find((m) => m.id === choice.bring)!) : null;
  const left = old.members.filter((m) => m.id !== holderMember?.id && m.id !== brought?.id).length;
  const day = runDay(old);
  const held: HeldRegion = {
    id: from, path, left: day,
    holder: { kind: pick.kind, name: pick.name, member: holderMember ? structuredClone(holderMember) : null },
    stability: clamp(RG().stability.start[path] + (pick.kind === 'usurped' ? RG().holders.usurped.stability : 0), 0, 100),
    away: 0, visited: day, grievances: 0, offer: false, raised: false, spy: false, talked: false,
    tribute: RG().tribute.default, orders: { ...choice.orders }, base: basePerTown(old, towns), towns, crew: left,
    status: 'held', traitor: null, kind: null, tells: 0, wanted: clamp(old.heat, 0, 100), last: 0,
    rival: teamsHere()[0]?.name ?? null, hero: old.hero ? heroDefOf(old.hero.id).name : null,
  };
  // Chair answers about Stability given before anything was held land on the first held region now.
  held.stability = clamp(held.stability + (old.chair?.owed.stab ?? 0), 0, 100);

  // The next region: its data overlay first, then a fresh block on its own seed (so its rolls aren't Kanto's again).
  setActiveRegion(to);
  const run = structuredClone(run0);
  const ace = aceOf(run);
  const seed = run.seed;
  run.seed = `${seed}::realm::${to}`;
  const types = old.types;
  let b = withCrew(newBlock(content, run, { types: [types[0], types[1]], member: 'grunt', look: 0, ...(old.rules ? { rules: old.rules } : {}) }));
  b.field = { ...(newField(0) as unknown as DominionBlock['field']) };
  regionField(b);
  b.funds = RG().arrive.funds;
  seedStart(content, run, b);
  run.seed = seed;
  // Carried: the team's name and Founding, the run rules, the Boss's own Edge and mastery, a capped Notoriety.
  b.teamName = old.teamName;
  if (old.team) b.team = structuredClone(old.team);
  b.field.edge = structuredClone(old.field.edge);
  b.field.mastery = structuredClone(old.field.mastery);
  b.flags = [...b.flags, ...old.flags.filter((f) => REALM_FLAGS.includes(f) && !b.flags.includes(f))];
  if (brought) {
    brought.crew = { ...crewOf(brought), task: 'rest', out: null, where: undefined };
    b.members.push(brought);
  }
  b = withRivals(withHq(withReserve(content, b), b.funds));
  const peak = Math.min(old.empire?.peak ?? 0, stepById(RG().arrive.notorietyCap));
  empireOf(b).peak = peak;
  b.realm = {
    ...R0, at: to, base: day, held: [...R0.held.map((h) => structuredClone(h)), held], brought: brought?.id ?? null, said: 0,
    away: 0, skies: null, boonWeek: 0, spreadFree: false, freeUpgrade: false, freeInfirmary: false, trip: null,
  };
  b = ensureHero(fillCards(b, run.seed), run.archetypeId, `${run.seed}::realm::${to}`);
  // D16: the partners must be agreed again in each region; only Looker's deal (no partners for the run) comes along.
  if (old.partners?.closed) b.partners = { deals: {}, offered: [], ended: [], kept: [], met: {}, inv: {}, used: 0, closed: true, purge: null, last: { day: 0, money: {}, mons: {}, feud: null }, due: [] };
  // Arrival lines (the Morning Report of Day 1) and the boons already won.
  const A = RG().arrive.lines, lines: string[] = [];
  run.party = [];
  if (ace) {
    const mon = preEvolve(content, ace, RG().arrive.aceLevel);
    run.party = [mon];
    const name = ace.care?.nickname || (content.species.get(ace.speciesId)?.name ?? ace.speciesId);
    lines.push(mon.speciesId !== ace.speciesId
      ? fill(A.ace!, { ace: name, species: content.species.get(mon.speciesId)?.name ?? mon.speciesId, level: mon.level })
      : fill(A.aceSame!, { ace: name, level: mon.level }));
  } else lines.push(A.noAce!);
  lines.push(brought ? fill(A.brought!, { name: brought.name }) : A.nobody!);
  run.inventory = { ...DOMINION_DATA.start.start.inventory };
  for (const h of b.realm!.held) {
    const boon = RG().boons.find((x) => x.region === h.id);
    if (boon && h.status === 'held') lines.push(fill(A.boon!, { region: regionName(h.id), name: boon.name, text: boon.text }));
  }
  if (has(b, 'silph')) {
    run.inventory['ultra-ball'] = (run.inventory['ultra-ball'] ?? 0) + RG().arrive.ultraBalls;
    const hq = b.hq!;
    hq.rooms.push({ uid: `r${hq.next++}`, id: RG().arrive.garage, tier: 1, cond: 100, spent: 0, building: false, up: false, ready: b.day, shut: false, ruined: false, at: null });
    lines.push(A.garage!);
  }
  if (has(b, 'academy')) lines.push(...academy(b));
  lines.push(fill(A.fame!, { region: regionName(to), word: DOMINION_DATA.empire.notoriety.steps[peak]!.word }));
  b.report = lines;
  const block = DominionBlockSchema.parse(b);
  return { run: { ...run, expansion: { ...(run.expansion ?? {}), dominion: block } }, problem: null };
}

/** The new region's districts as its data starts them (migrate.ts's newField reads Kanto's raw file). */
function regionField(b: DominionBlock): void {
  const f = F();
  const districts: DominionBlock['field']['districts'] = {};
  for (const d of f.districts) districts[d.id] = { heat: 0, control: d.control, rival: d.rival, regard: 0, dread: 0 };
  b.field.districts = districts;
  b.field.at = f.hq;
  b.field.visited = [f.hq];
}

/** The opening scene for a region after the first: its own arrival lines, with the brought member's name. */
export function arrivalLines(b: DominionBlock): string[] | null {
  const R = b.realm;
  if (!R || R.at === 'kanto') return null;
  const p = packOf(R.at);
  if (!p) return null;
  const m = R.brought ? b.members.find((x) => x.id === R.brought) : undefined;
  return p.arrive.map((l) => fill(l, { brought: m?.name ?? 'Nobody' }));
}

// ---------- answers on the Empire screen ----------

export type RealmOp = 'visit' | 'pay' | 'replace' | 'spy' | 'talk' | 'orders' | 'tribute' | 'trip' | 'letGo';
export interface RealmOut { ok: boolean; block: DominionBlock; notice: string | null; fight: boolean }

export function realmStep(block: DominionBlock, op: RealmOp, region: string, arg: { member?: string; orders?: Orders; tribute?: number }, seed: string): RealmOut {
  const no = (notice: string): RealmOut => ({ ok: false, block, notice, fight: false });
  const b = structuredClone(block);
  const h = b.realm?.held.find((x) => x.id === region);
  if (!h) return no(L('noRegion'));
  const v = { holder: h.holder.name, region: regionName(h.id) };
  const A = RG().answers;
  const yes = (notice: string, fight = false): RealmOut => ({ ok: true, block: b, notice, fight });
  if (b.field.fight) return no('A fight is waiting.');
  switch (op) {
    case 'visit': {
      if (h.status !== 'held' && h.status !== 'sellout') return no(L('noRegion'));
      if (b.phase !== 'day') return no('Visits start in the Day.');
      // Two days: the rest of today and tomorrow (the crew runs those Days; clock.ts reads `away`).
      b.actions = 0;
      realmOf(b).away = A.visit.days - 1;
      h.stability = clamp(h.stability + A.visit.stab, 0, 100);
      h.away = 0;
      h.visited = runDay(b);
      h.grievances = Math.max(0, h.grievances - 1);
      return yes(fill(L('visit'), v));
    }
    case 'pay': {
      if (h.holder.kind === 'self' || h.status !== 'held') return no(L('noRegion'));
      if (b.funds < A.pay.cost) return no(fill(L('noFunds'), { cost: A.pay.cost.toLocaleString('en-GB') }));
      b.funds -= A.pay.cost;
      h.raised = true;
      if (h.holder.member) h.holder.member.loyalty = Math.min(100, h.holder.member.loyalty + A.pay.loyalty);
      return yes(fill(L('pay'), v));
    }
    case 'spy': {
      if (h.holder.kind === 'self' || h.status !== 'held') return no(L('noRegion'));
      if (b.funds < A.spy.cost) return no(fill(L('noFunds'), { cost: A.spy.cost.toLocaleString('en-GB') }));
      b.funds -= A.spy.cost;
      h.spy = true;
      return yes(fill(L('spy'), { ...v, band: riskBand(betrayalChance(b, h)) }));
    }
    case 'talk': {
      if (h.holder.kind === 'self' || h.status !== 'held') return no(L('noRegion'));
      if (riskOf(b, h) < RG().betrayal.longTalkAt) return no(fill(L('noTalk'), v));
      if (b.phase !== 'evening') return no(L('notEvening'));
      h.talked = true;
      h.grievances = 0;
      return yes(fill(L('talkDone'), v));
    }
    case 'orders': {
      const o = arg.orders;
      const why = o ? ordersProblem(o) : 'Pick the orders.';
      if (why || !o) return no(why!);
      h.orders = { ...o };
      return yes(fill(L('orders'), { region: v.region, orders: POLICY_KEYS.map((k) => policyOf(k, o[k])!.name).join(', ') }));
    }
    case 'tribute': {
      const t = arg.tribute ?? RG().tribute.default;
      if (!RG().tribute.steps.includes(t)) return no('Pick a tribute rate.');
      h.tribute = t;
      return yes(fill(L('week'), { ...v, stab: h.stability, word: bandOf(h.stability).word, tribute: Math.round((h.base * h.towns * t) / 100) }));
    }
    case 'replace': {
      if (b.phase !== 'evening') return no(L('notEvening'));
      const m = b.members.find((x) => x.id === arg.member);
      if (!m || !(RG().holders.ranks.includes(m.rank) || usurpedMember(m))) return no('Pick an Admin or higher.');
      const oldName = h.holder.name;
      // The old Holder comes back to the crew (unless they turned on you); half their people stay.
      if (h.holder.member && h.status === 'held' && b.members.length < b.rosterCap) b.members.push(h.holder.member);
      b.members = b.members.filter((x) => x.id !== m.id);
      h.holder = { kind: usurpedMember(m) ? 'usurped' : 'member', name: m.name, member: structuredClone(m) };
      if (A.replace.keepHalf) h.crew = Math.ceil(h.crew / 2);
      h.stability = clamp(h.stability + A.replace.stab, 0, 100);
      h.grievances = 0;
      h.raised = false;
      h.talked = false;
      h.tells = 0;
      if (h.status === 'sellout') {
        h.status = 'held';
        h.kind = null;
        h.traitor = null;
      }
      return yes(fill(L('replace'), { old: oldName, holder: m.name, region: v.region }));
    }
    case 'trip': {
      if (h.status !== 'seceded') return no(L('noRegion'));
      // The Long Trip: retake it from the traitor in one fight at their HQ (their crew and the old team).
      realmOf(b).trip = h.id;
      b.field.fight = { why: 'realm', foe: 'realm', begun: false, action: 'long-trip', target: h.id, district: F().hq, pass: true, big: false, wager: 0, racket: null };
      return yes(fill(L('reclaimOpen'), { region: v.region, traitor: h.traitor ?? h.holder.name }), true);
    }
    case 'letGo': {
      if (h.status !== 'seceded' && h.status !== 'sellout') return no(L('noRegion'));
      h.status = 'lost';
      return yes(fill(L('letGo'), v));
    }
  }
}

/** The traitor's side for the Long Trip: their own team (a member Holder) or the region's old Boss. */
export function realmSide(b: DominionBlock, run: Pick<RunState, 'party'>): { name: string; classId: string; leaderId: string | null; species: string[]; level: number } | null {
  const h = b.realm?.held.find((x) => x.id === b.realm?.trip);
  if (!h) return null;
  const m = h.holder.member;
  const team = DOMINION_DATA.rivals.teams.find((t) => t.region === h.id);
  const species = m?.team.length ? m.team.map((x) => x.speciesId) : team?.boss.species ?? ['raticate'];
  return { name: h.traitor ?? h.holder.name, classId: m ? 'ace-trainer' : 'gym-leader', leaderId: m ? null : team?.boss.id ?? null, species: species.slice(0, 6), level: foeLevel(b, run, 3) };
}
setRealmFoe((b, run) => {
  const s = realmSide(b, run);
  return s ? { name: s.name, species: s.species[0]!, level: s.level, wild: false } : { name: 'A traitor', species: 'raticate', level: foeLevel(b, run, 3), wild: false };
});
/** The Long Trip's end: a win takes the region back (Stability resets, you hold it yourself); a loss changes nothing. */
addFightSettler('realm', (_content, b, _run, _fight, outcome) => tripEnd(b, outcome));
export function tripEnd(b: DominionBlock, outcome: 'win' | 'lose' | 'fled'): string[] {
  const R = realmOf(b), h = R.held.find((x) => x.id === R.trip);
  R.trip = null;
  if (!h || outcome !== 'win') return [];
  const traitor = h.traitor ?? h.holder.name;
  h.status = 'held';
  h.kind = null;
  h.traitor = null;
  h.holder = { kind: 'self', name: 'Yourself', member: null };
  h.stability = RG().reclaim.stab;
  h.towns = Math.max(1, Math.round((h.towns || 1) * (RG().reclaim.control / 100)) || 1);
  h.grievances = 0;
  h.visited = runDay(b);
  h.away = 0;
  h.tells = 0;
  return [fill(L('reclaimWon'), { region: regionName(h.id), traitor })];
}

/** Clock hook: a Day the Boss is away visiting starts with no actions (the crew runs it). */
export function awayToday(b: DominionBlock): string | null {
  const R = b.realm;
  if (!R || R.away <= 0) return null;
  R.away -= 1;
  return L('visitAway');
}

export { useRegion };
