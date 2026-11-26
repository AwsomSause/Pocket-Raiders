// DOMINION HQ Staff Office (Kice 2026-11-21; plans/evil-mode-rework/hq-floors/DESIGN.md §3). Three posts a crew member
// can hold, each with gear 1-5 bought here: the Auto-Checker hires Grunts every morning by the Boss's rules, the
// Bookkeeper launders every night, the Caretaker repairs worn rooms every night. Skill = gear + half the member's stat.
// A posted member leaves their task (a crew run hook skips it). The Auto-Checker rolls on its own stream
// (`dominion-checker`) and hires through recruit.ts's own Hire Grunt, so nothing else moves.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { addRunHook, gruntType, rng, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import { addUpkeepOff, front, launder, repay, roomName } from './hq';
import { dirtyOf, hqOf, spend, withHq } from './hqFx';
import { hire, hireList } from './recruit';
import { STAT_IDS, type DominionBlock, type HqState, type Member, type StaffRole, type StaffState, type StatId } from './schema';
import { addWorldStep, fill } from './worldTurn';

const SD = () => DOMINION_DATA.hq.staff;
const Ln = () => DOMINION_DATA.hq.lines;
const money = (n: number): string => n.toLocaleString('en-US');

export const roleDef = <R extends StaffRole>(id: R) => SD().roles.find((r) => r.id === id)! as Extract<ReturnType<typeof SD>['roles'][number], { id: R }>;

export function freshStaff(): StaffState {
  const post = () => ({ member: null, gear: 0, on: true });
  return { checker: post(), books: post(), care: post(), want: null, budget: 1, beds: 1, day: 0, log: [] };
}
export const staffOf = (b: DominionBlock): StaffState => hqOf(b).staff ?? freshStaff();

/** The member holding a post (null when empty, or when they have left the crew). */
export function postHolder(b: DominionBlock, role: StaffRole): Member | null {
  const id = staffOf(b)[role].member;
  return id ? b.members.find((m) => m.id === id) ?? null : null;
}
/** The post a member holds, or null. */
export function postOf(b: DominionBlock, memberId: string): StaffRole | null {
  const st = hqOf(b).staff;
  if (!st) return null;
  for (const r of ['checker', 'books', 'care'] as const) if (st[r].member === memberId && b.members.some((m) => m.id === memberId)) return r;
  return null;
}
/** Skill 0-10: gear + half the holder's stat (0 with no holder or no gear). */
export function skillOf(b: DominionBlock, role: StaffRole): number {
  const m = postHolder(b, role);
  const g = staffOf(b)[role].gear;
  if (!m || g < 1) return 0;
  return Math.min(SD().skillCap, g + Math.floor(m.stats[roleDef(role).stat] / 2));
}
/** The post works tonight / this morning: held, geared, switched on, and its holder isn't hurt, jailed or held. */
const ready = (b: DominionBlock, role: StaffRole): Member | null => {
  const p = staffOf(b)[role];
  const m = postHolder(b, role);
  return m && p.gear >= 1 && p.on ? m : null;
};
const isOut = (m: Member): boolean => !!m.crew?.out;

export interface StaffOut { ok: boolean; block: DominionBlock; notice: string | null }
const no = (block: DominionBlock, notice: string | null): StaffOut => ({ ok: false, block, notice });

function copy(block: DominionBlock): DominionBlock & { hq: HqState & { staff: StaffState } } {
  const b = withHq(structuredClone(block)) as DominionBlock & { hq: HqState };
  b.hq.staff ??= freshStaff();
  return b as DominionBlock & { hq: HqState & { staff: StaffState } };
}

/** Puts a member on a post (or clears it with null). A member on another post moves over. The Auto-Checker starts tomorrow. */
export function post(block: DominionBlock, role: StaffRole, member: string | null): StaffOut {
  const def = roleDef(role);
  if (member !== null && !block.members.some((m) => m.id === member)) return no(block, null);
  const b = copy(block);
  const st = b.hq.staff;
  for (const r of ['checker', 'books', 'care'] as const) if (member !== null && r !== role && st[r].member === member) st[r].member = null;
  st[role].member = member;
  if (role === 'checker') st.day = b.day;
  const m = member ? b.members.find((x) => x.id === member)! : null;
  return { ok: true, block: b, notice: m ? fill(Ln().posted!, { name: m.name, role: def.name }) : fill(Ln().unposted!, { role: def.name }) };
}

/** Buys the post's next gear. */
export function buyGear(block: DominionBlock, role: StaffRole): StaffOut {
  const def = roleDef(role);
  const g = staffOf(block)[role].gear;
  if (g >= 5) return no(block, fill(Ln().gearTop!, { role: def.name }));
  const cost = def.costs[g]!;
  if (block.funds < cost) return no(block, fill(Ln().noMoney!, { cost }));
  const b = copy(block);
  spend(b, cost);
  b.hq.staff[role].gear = g + 1;
  return { ok: true, block: b, notice: fill(Ln().gearBought!, { role: def.name, gear: def.gear[g]!, n: g + 1, cost: money(cost) }) };
}

const WANTS: (StatId | null)[] = [null, ...STAT_IDS];
const cyc = (i: number, d: number, n: number): number => (((i + d) % n) + n) % n;
/** Changes an Auto-Checker rule (the Wanted stat, the budget, beds kept free) or switches a post on or off. */
export function setRule(block: DominionBlock, key: 'want' | 'budget' | 'beds' | 'on', role: StaffRole | undefined, d: number): StaffOut {
  const b = copy(block);
  const st = b.hq.staff;
  if (key === 'want') st.want = WANTS[cyc(WANTS.indexOf(st.want), d, WANTS.length)]!;
  else if (key === 'budget') st.budget = cyc(st.budget, d, SD().budgets.length);
  else if (key === 'beds') st.beds = cyc(st.beds, d, SD().beds.length);
  else if (role) st[role].on = !st[role].on;
  else return no(block, null);
  return { ok: true, block: b, notice: null };
}

function note(st: StaffState, lines: string[]): void {
  st.log = [...lines, ...st.log].slice(0, 12);
}

// ---------- the Auto-Checker (each morning, from session.ts: it needs the run to make the new Grunts' Pokémon) ----------

const RANK: Record<string, number> = { C: 1, U: 2, R: 3 };

/**
 * The Auto-Checker's morning: once a Day, it hires from today's Hire list by the Boss's rules. Returns null when it has
 * nothing to do (no post, no gear, switched off, already worked today).
 */
export function autoCheck(content: Content, run: RunState, seed: string): { run: RunState; lines: string[] } | null {
  const b0 = run.expansion?.dominion;
  if (!b0?.hq?.staff) return null;
  const st0 = b0.hq.staff;
  const m = ready(b0, 'checker');
  if (!m || st0.day === b0.day) return null;
  let b = withCrew(copy(b0)) as ReturnType<typeof copy>;
  b.hq.staff.day = b.day;
  const lines: string[] = [];
  const done = (): { run: RunState; lines: string[] } => {
    note(b.hq.staff, lines);
    return { run: { ...out, expansion: { ...out.expansion, dominion: b } }, lines };
  };
  let out: RunState = run;
  if (isOut(m)) {
    lines.push(fill(Ln().staffOut!, { who: m.name, role: roleDef('checker').name }));
    return done();
  }
  const def = roleDef('checker');
  const g = b.hq.staff.checker.gear;
  const skill = skillOf(b, 'checker');
  const r = rng(seed, 'dominion-checker', b.day);
  const st = b.crew!;
  if (st.hireDay !== b.day) {
    st.hires = hireList(b, seed);
    st.hireDay = b.day;
  }
  const allowed = def.rarities[g - 1]!;
  const want = g >= def.wantFrom ? b.hq.staff.want : null;
  const budget0 = SD().budgets[b.hq.staff.budget] ?? 0;
  let budget = budget0 || Infinity;
  const beds = SD().beds[b.hq.staff.beds] ?? 0;
  const haggle = def.haggle[g - 1]!;
  const miss = Math.max(0, def.misjudge.base - def.misjudge.perSkill * skill);
  const price = (p: number): number => Math.round((p * (100 - haggle)) / 100);
  let skipped: string | null = null;
  for (let k = 0; k < def.perDay[g - 1]!; k++) {
    const pool = st.hires.map((h, i) => ({ h, i, t: gruntType(h.type)! })).filter((c) => !c.h.sold && allowed.includes(c.t.rarity));
    if (!pool.length) break;
    if (b.members.length >= b.rosterCap - beds) {
      skipped = fill(Ln().checkerSkip!, { who: m.name, name: pool[0]!.h.name, why: beds ? `keeping ${beds} bed${beds === 1 ? '' : 's'} free` : 'the HQ is full' });
      break;
    }
    const fits = pool.filter((c) => price(c.h.price) <= Math.min(budget, b.funds));
    if (!fits.length) {
      skipped = fill(Ln().checkerSkip!, { who: m.name, name: pool[0]!.h.name, why: price(pool[0]!.h.price) > b.funds ? 'not enough money' : 'over budget' });
      break;
    }
    // A skilled checker weighs them all (your Wanted stat, then rarity, then price); an unskilled one takes the first.
    const score = (c: (typeof fits)[number]): number => (want && c.t.lean === want ? 1000 : 0) + RANK[c.t.rarity]! * 100 - c.h.price / 100;
    const ranked = skill >= 5 ? [...fits].sort((x, y) => score(y) - score(x) || x.i - y.i) : want ? [...fits.filter((c) => c.t.lean === want), ...fits.filter((c) => c.t.lean !== want)] : fits;
    let pick = ranked[0]!;
    const missed = r.int(1, 100) <= miss && fits.length > 1;
    if (missed) pick = fits[r.int(0, fits.length - 1)]!;
    st.hires[pick.i]!.price = price(pick.h.price);
    const res = hire(content, { ...out, expansion: { ...out.expansion, dominion: b } }, pick.i);
    if (!res.ok) {
      skipped = fill(Ln().checkerSkip!, { who: m.name, name: pick.h.name, why: (res.notice ?? 'refused').replace(/\.$/, '') });
      break;
    }
    out = res.run;
    b = out.expansion!.dominion! as ReturnType<typeof copy>;
    const nm = b.members[b.members.length - 1]!;
    if (def.trained[g - 1]) nm.stats[pick.t.lean] = Math.min(10, nm.stats[pick.t.lean] + def.trained[g - 1]!);
    budget -= st.hires[pick.i]?.price ?? 0;
    lines.push(fill(missed ? Ln().checkerMiss! : Ln().checkerHired!, { who: m.name, name: pick.h.name, type: pick.t.name, price: money(price(pick.h.price)) }));
  }
  if (skipped) lines.push(skipped);
  if (!lines.length) lines.push(Ln().checkerIdle!);
  return done();
}

// ---------- the Bookkeeper and the Caretaker (each night, a World Turn step) ----------

export function staffNight(block: DominionBlock): string[] {
  if (!block.hq?.staff) return [];
  const lines: string[] = [];
  const books = ready(block, 'books');
  if (books) {
    if (isOut(books)) lines.push(fill(Ln().staffOut!, { who: books.name, role: roleDef('books').name }));
    else {
      const def = roleDef('books');
      const p = block.hq.staff.books;
      const cap = Math.round((def.wash[p.gear - 1]! * (100 + def.washPerSkill * skillOf(block, 'books'))) / 100);
      const fr = front(block);
      const amount = Math.min(cap, dirtyOf(block));
      if (!fr && amount > 0) lines.push(fill(Ln().booksNoFront!, { who: books.name }));
      else if (fr && amount > 0) {
        const o = launder(block, amount);
        if (o.ok) {
          Object.assign(block, o.block);
          lines.push(fill(Ln().booksWash!, { who: books.name, amount: money(amount), front: fr.name }));
        }
      }
      const loan = block.hq!.loan;
      if (loan && p.gear >= def.repayFrom) {
        const pay = Math.min(loan.owed, block.funds - def.keep);
        const o = pay > 0 ? repay(block, pay) : null;
        if (o?.ok) {
          Object.assign(block, o.block);
          lines.push(fill(Ln().booksRepay!, { who: books.name, amount: money(pay) }));
        }
      }
    }
  }
  const care = ready(block, 'care');
  if (care) {
    if (isOut(care)) lines.push(fill(Ln().staffOut!, { who: care.name, role: roleDef('care').name }));
    else {
      const def = roleDef('care');
      let pts = def.repair[block.hq!.staff!.care.gear - 1]! + skillOf(block, 'care');
      const worn = block.hq!.rooms.filter((r) => !r.ruined && r.cond < 100).sort((x, y) => x.cond - y.cond || x.uid.localeCompare(y.uid));
      for (const r of worn) {
        const n = Math.min(100 - r.cond, pts, def.pointCost ? Math.floor(Math.max(0, block.funds) / def.pointCost) : pts);
        if (n < 1) break;
        r.cond += n;
        pts -= n;
        spend(block, n * def.pointCost);
        lines.push(fill(Ln().careFix!, { who: care.name, name: roomName(r), n, cost: money(n * def.pointCost) }));
      }
    }
  }
  if (lines.length) note(block.hq!.staff!, lines);
  return lines;
}

addWorldStep('world', (b) => staffNight(b));
// A posted member works their desk, not their task.
addRunHook({ skip: (b, m) => postOf(b, m.id) !== null });
// The Caretaker's gear cuts the weekly upkeep.
addUpkeepOff((b) => (ready(b, 'care') ? roleDef('care').upkeepOff[staffOf(b).care.gear - 1]! : 0));
