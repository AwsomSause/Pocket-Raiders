// DOMINION slice D4: the Rank Pyramid (Part 8) and the caps each rank sets (Part 7 §4). Fifteen ranks, seats that run
// out as you climb, five bands, and the Evening moves: promote, pass over, demote, strip. Pure: changes the block given.

import { addLoyalty, addMorale, crewOf, growStat, pickTrait, rankN, rankWord, traitName } from './crew';
import { DOMINION_DATA } from './data';
import { hqFx } from './hqFx';
import { notoriety } from './recruit';
import type { DominionBlock, Member, MonMeta, RankRow, ReserveState } from './schema';
import { STAT_IDS } from './schema';
import { fill } from './worldTurn';

const P = () => DOMINION_DATA.pyramid;
const CR = () => DOMINION_DATA.crew.ranks;

/** The pyramid row for a rank id (Hopeful for an unknown one). */
export const rankRow = (id: string): RankRow => P().ranks.find((r) => r.id === id) ?? P().ranks[0]!;
/** The member level a rank needs (crew.json, Part 8 §2). */
export const rankLevel = (id: string): number => CR().find((r) => r.id === id)?.level ?? 1;
export const bandOf = (id: string) => P().bands.find((x) => x.n === rankRow(id).band)!;
export const nextRank = (id: string): RankRow | null => P().ranks[rankN(id)] ?? null;
export const prevRank = (id: string): RankRow | null => (rankN(id) > 1 ? P().ranks[rankN(id) - 2]! : null);

/** Members in a rank (a jailed or hurt member keeps the seat). */
export const seatsTaken = (b: DominionBlock, id: string): number => b.members.filter((m) => m.rank === id).length;
/** Open seats in a rank: Infinity for the open ranks (Hopeful, Recruit, Grunt). */
export function seatsOpen(b: DominionBlock, id: string): number {
  return seatsOf(b, id) === Infinity ? Infinity : Math.max(0, seatsOf(b, id) - seatsTaken(b, id));
}
/** All seats in a rank: the pyramid's, plus D4b's seat rooms (Admin Quarters, Sergeant's Post, Lieutenant's Office, Captain's Hall). */
export function seatsOf(b: DominionBlock, id: string): number {
  const r = rankRow(id);
  return r.seats ? r.seats + (hqFx(b).seats[id] ?? 0) : Infinity;
}

/** D4b: the member level a rank needs; the Officer Academy takes levels off every rank up to Sergeant. */
export function levelFor(b: DominionBlock, id: string): number {
  const off = rankN(id) <= rankN('sergeant') ? hqFx(b).rankLv : 0;
  return Math.max(1, rankLevel(id) - off);
}

/** A member in this band or higher ("Rank N crew" in the lists, Part 8 §3). */
export const hasBand = (b: DominionBlock, band: number): boolean => b.members.some((m) => rankRow(m.rank).band >= band);

// ---------- caps (Part 7 §4, Part 8 §2) ----------

/** Which region of the run this is (0 = the first). One region until the many-regions slice (D15). */
export const regionIndex = (b: DominionBlock): number => {
  void b;
  return 0;
};
/** The standing bonus from Notoriety (Part 7 §4.2, read on the A14 ladder). */
export function standingOf(b: DominionBlock): { word: string; bonus: number } {
  const n = notoriety(b);
  return [...P().caps.standing].reverse().find((s) => n >= s.min) ?? P().caps.standing[0]!;
}
export const regionBonus = (b: DominionBlock): number => {
  const t = P().caps.regionBonus;
  return t[Math.min(regionIndex(b), t.length - 1)]!;
};
/** A member's level cap: their rank's share of the HQ cap. */
export const levelCapOf = (b: DominionBlock, m: Pick<Member, 'rank'>): number => Math.max(1, Math.floor((b.levelCap * rankRow(m.rank).lvPct) / 100));
/** A member's BST cap: rank base + region + standing, never past 600. */
export const bstCapOf = (b: DominionBlock, m: Pick<Member, 'rank'>): number => Math.min(P().caps.bstMax, rankRow(m.rank).bst + regionBonus(b) + standingOf(b).bonus);
/** The Ace cap: the rank's Ace number + region + standing, at most 40 over the rank's number. 0 if no Ace slot. */
export function aceCapOf(b: DominionBlock, m: Pick<Member, 'rank'>): number {
  const r = rankRow(m.rank);
  if (!r.aces) return 0;
  return Math.min(r.aceCap + regionBonus(b) + standingOf(b).bonus, r.aceCap + P().caps.aceOver);
}
export const teamSizeOf = (m: Pick<Member, 'rank'>): number => rankRow(m.rank).team;
export const acesOf = (m: Pick<Member, 'rank'>): number => rankRow(m.rank).aces;

export interface Fit { ok: boolean; ace: boolean; why: string | null }

/**
 * Whether a Pokémon (level + its meta) fits a member: Team Type and both caps, or an Ace slot (any type, the Ace cap).
 * `aceFree` says if the member has an Ace slot free for it (its own Ace counts as free).
 */
export function fitFor(b: DominionBlock, m: Pick<Member, 'rank'> & { crew?: Member['crew'] }, level: number, meta: Pick<MonMeta, 'bst' | 'types' | 'rare'>, aceFree: boolean): Fit {
  const W = P().why;
  if (meta.rare) return { ok: false, ace: false, why: W.never };
  // Bug Whisperer (a Formed trait): his Bug types get +10 on the level cap.
  const lvCap = levelCapOf(b, m) + (m.crew?.formed.includes('bug-whisperer') && meta.types.includes('bug') ? P().reserve.bugCap : 0);
  if (level > lvCap) return { ok: false, ace: false, why: fill(W.lv, { lv: level, cap: lvCap }) };
  const onType = meta.types.some((t) => b.types.includes(t));
  const cap = bstCapOf(b, m);
  if (onType && meta.bst <= cap) return { ok: true, ace: false, why: null };
  const aceCap = aceCapOf(b, m);
  if (aceFree && aceCap && meta.bst <= aceCap) return { ok: true, ace: true, why: null };
  if (!onType) return { ok: false, ace: false, why: W.offType };
  return { ok: false, ace: false, why: fill(W.bst, { bst: meta.bst, cap }) };
}

// ---------- moving on the pyramid (Part 8 §4) ----------

/** The rank a member is ready for (level and HQ level), seat or no seat. */
export function readyFor(b: DominionBlock, m: Member): RankRow | null {
  const next = nextRank(m.rank);
  if (!next || m.level < levelFor(b, next.id) || b.hqLevel < next.hq) return null;
  return next;
}

/** Why a member can't be promoted now, or null. */
export function promoteProblem(b: DominionBlock, m: Member): string | null {
  const next = nextRank(m.rank);
  if (!next) return `${m.name} is already the Right Hand.`;
  if (b.phase !== 'evening') return 'Promotions happen in the Evening.';
  if (m.level < levelFor(b, next.id)) return `${rankWord(next.id)} needs member Lv ${levelFor(b, next.id)} (${m.name} is Lv ${m.level}).`;
  if (b.hqLevel < next.hq) return `${rankWord(next.id)} needs HQ Lv ${next.hq}.`;
  if (!seatsOpen(b, next.id)) return `Every ${rankWord(next.id)} seat is taken.`;
  return null;
}

/** An empty Reserve book (the Day 1 Pokémon are added by reserve.ts). */
export const freshReserve = (): ReserveState => ({ box: [], meta: {}, hunt: {}, auto: false, passed: {}, promoted: [], stripped: [] });
const reserveBook = (b: DominionBlock): ReserveState => (b.reserve ??= freshReserve());

function setRank(m: Member, id: string): void {
  m.rank = id;
  m.wage = CR().find((r) => r.id === id)?.wage ?? m.wage;
}

/** Promote one rank (the Evening scene). Others Ready for that seat are passed over: Ambition +10; three times, Resentful. */
export function promote(b: DominionBlock, memberId: string): { ok: boolean; notice: string | null } {
  const m = b.members.find((x) => x.id === memberId);
  if (!m) return { ok: false, notice: null };
  const why = promoteProblem(b, m);
  if (why) return { ok: false, notice: why };
  const to = nextRank(m.rank)!;
  const mv = P().moves, L = P().lines;
  const passed = b.members.filter((x) => x.id !== m.id && x.rank === m.rank && readyFor(b, x)?.id === to.id);
  setRank(m, to.id);
  addLoyalty(b, m, mv.promoteLoyalty);
  addMorale(m, mv.promoteMorale);
  crewOf(m).memory.push({ day: b.day, line: `The Boss made me ${rankWord(to.id)}.` });
  const lines = [fill(L.promoted!, { name: m.name, rank: rankWord(to.id), loyalty: mv.promoteLoyalty, morale: mv.promoteMorale })];
  lines.push(...schooled(b, m));
  const book = reserveBook(b);
  book.promoted.push({ member: m.id, day: b.day });
  // Only pass over if the seat is now gone for them (an open rank never passes anyone over).
  if (!seatsOpen(b, to.id)) {
    for (const x of passed) {
      const c = crewOf(x);
      c.ambition = Math.min(100, c.ambition + mv.passedAmbition);
      c.flags = [...c.flags.filter((f) => !f.startsWith('passed:')), `passed:${b.day}`];
      book.passed[x.id] = (book.passed[x.id] ?? 0) + 1;
      lines.push(fill(L.passed!, { name: x.name, n: mv.passedAmbition }));
      if (book.passed[x.id] === mv.resentfulAfter && !c.formed.includes('resentful')) {
        c.formed.push('resentful');
        lines.push(fill(L.resentful!, { name: x.name }));
      }
    }
  }
  return { ok: true, notice: lines.join(' ') };
}

/** D4b: what the Classroom and the Skill Exam Hall give a member on promotion. */
function schooled(b: DominionBlock, m: Member): string[] {
  const fx = hqFx(b), SL = P().school.lines, out: string[] = [];
  for (let i = 0; i < fx.promoTrait; i++) {
    // Classroom: the member chooses their next trait now (at most two formed); with two, a trait point instead.
    const c = crewOf(m);
    const to = c.formed.length < 2 ? pickTrait(m) : null;
    if (to) {
      c.grew = { from: c.formed.at(-1) ?? c.green, to, day: b.day };
      c.formed.push(to);
      m.untrained = false;
      out.push(fill(SL.classTrait!, { name: m.name, trait: traitName(to) }));
    } else {
      m.traitPoints += 1;
      out.push(fill(SL.classPoint!, { name: m.name }));
    }
  }
  if (fx.examStat) {
    // Skill Exam Hall: the exam finds a talent: tenths on the member's best stat that can still grow.
    const stat = STAT_IDS.filter((k) => m.stats[k] < 10).sort((a, x) => m.stats[x] - m.stats[a])[0];
    if (stat) {
      growStat(m, stat, fx.examStat * 10, []);
      out.push(fill(SL.exam!, { name: m.name, stat: stat[0]!.toUpperCase() + stat.slice(1), value: m.stats[stat] }));
    }
  }
  return out;
}

/** One rank down, any Evening: Loyalty −20, Morale −20. Pokémon over the new caps are benched (Part 7 §4.3). */
export function demote(b: DominionBlock, memberId: string): { ok: boolean; notice: string | null } {
  const m = b.members.find((x) => x.id === memberId);
  if (!m) return { ok: false, notice: null };
  const to = prevRank(m.rank);
  if (!to) return { ok: false, notice: `${m.name} is a Hopeful: there's nowhere lower.` };
  if (b.phase !== 'evening') return { ok: false, notice: 'Demotions happen in the Evening.' };
  const mv = P().moves;
  setRank(m, to.id);
  addLoyalty(b, m, mv.demoteLoyalty);
  addMorale(m, mv.demoteMorale);
  crewOf(m).memory.push({ day: b.day, line: `The Boss took my rank away. ${rankWord(to.id)} again.` });
  return { ok: true, notice: fill(P().lines.demoted!, { name: m.name, rank: rankWord(to.id), loyalty: mv.demoteLoyalty, morale: mv.demoteMorale }) };
}

/** Back to Recruit, any Evening: Loyalty −40, and the night may see them walk out with one Pokémon. */
export function strip(b: DominionBlock, memberId: string): { ok: boolean; notice: string | null } {
  const m = b.members.find((x) => x.id === memberId);
  if (!m) return { ok: false, notice: null };
  if (rankN(m.rank) <= rankN('recruit')) return { ok: false, notice: `${m.name} has no rank to strip.` };
  if (b.phase !== 'evening') return { ok: false, notice: 'That happens in the Evening.' };
  const mv = P().moves;
  setRank(m, 'recruit');
  addLoyalty(b, m, mv.stripLoyalty);
  crewOf(m).memory.push({ day: b.day, line: 'Stripped back to Recruit in front of everyone.' });
  if (!reserveBook(b).stripped.includes(m.id)) reserveBook(b).stripped.push(m.id);
  return { ok: true, notice: fill(P().lines.stripped!, { name: m.name, loyalty: mv.stripLoyalty }) };
}
