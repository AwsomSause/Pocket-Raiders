// DOMINION slice D6: districts, Notoriety and the Ledger (design Part 3 §1-2, Part 9 A14; mockup 7).
// - Districts: Control grows from Rackets, and falls when Heat runs high or nobody holds a Held district for a week
//   (a Holder is the Boss working there, a member on Hold, or Be Your Face; Safehouses with guards are D5's).
// - Regard and Dread per town, never netted; Notoriety = the larger of the two in every town + 2 per holding + 1 per
//   member, on the seven-step ladder (Nobody to Empire). Each step opens things, and a step once reached stays open.
// - The Ledger (book.ts keeps the lines): each week closes on bill day into the graph's history.
// - The crew's district tasks (Patrol, Collect, Hold, Chant, Spin the Story...). Pure; no new rolls: district tasks
//   use the crew's own roll, so no old roll moves.

import { addActionGate, addHeat, districtDef, statusOf, syncHeat } from './field';
import { book, bookRest, empireOf, settleClean, weekSum } from './book';
import { addCrewHook, crewOf, modsOf, setDistrictTask, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import type { ActionDef, DistrictState, DominionAction, DominionBlock, LedgerWeek, Member, Task } from './schema';
import { addWorldEnd, fill } from './worldTurn';

const E = () => DOMINION_DATA.empire;
const F = () => DOMINION_DATA.field;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const name = (id: string): string => districtDef(id)?.name ?? id;

// ---------- districts ----------

/** Held (Part 3 §2): Control 60+ and the rival team isn't ahead there. Owned counts as held. */
export const isHeld = (d: DistrictState): boolean => ['held', 'owned'].includes(statusOf(d));
export const heldIds = (b: DominionBlock): string[] => F().districts.map((d) => d.id).filter((id) => isHeld(b.field.districts[id]!));

/** The district a member's district task is done in: their pick, else the HQ's. */
export function whereOf(m: Member): string {
  const w = crewOf(m).where;
  return w && districtDef(w) ? w : F().hq;
}

// ---------- Notoriety (A14) ----------

export interface NotorietyParts { towns: number; holdings: number; members: number; press: number; total: number }

export function notorietyOf(b: DominionBlock): NotorietyParts {
  const N = E().notoriety;
  const towns = Object.values(b.field.districts).reduce((a, d) => a + Math.max(0, d.regard, d.dread), 0);
  const holdings = heldIds(b).length * N.perHolding;
  const members = b.members.length * N.perMember;
  // D12: what the Chair added (a quote to the papers, a mural, a TV show).
  const press = b.chair?.fame ?? 0;
  return { towns, holdings, members, press, total: towns + holdings + members + press };
}

export const stepIndex = (n: number): number => {
  const s = E().notoriety.steps;
  let i = 0;
  while (i + 1 < s.length && n >= s[i + 1]!.min) i += 1;
  return i;
};
export const stepById = (id: string): number => E().notoriety.steps.findIndex((s) => s.id === id);
/** The step the town calls you now (it can fall), and the highest reached (what's unlocked). */
export const stepNow = (b: DominionBlock): number => stepIndex(notorietyOf(b).total);
export const peakOf = (b: DominionBlock): number => Math.max(b.empire?.peak ?? 0, stepNow(b));

/** A new step reached: its line, and the press contact at Street Gang. Changes the block. */
export function checkRise(b: DominionBlock): string[] {
  const e = empireOf(b), N = E().notoriety;
  const now = stepNow(b);
  const lines: string[] = [];
  if (now > e.peak) {
    e.peak = now;
    const s = N.steps[now]!;
    lines.push(fill(N.lines.risen, { word: s.word, calls: s.calls }));
  }
  if (!e.press && e.peak >= stepById(N.pressFrom)) {
    e.press = true;
    lines.push(N.lines.press);
  }
  return lines;
}

/** The step an action's list unlock names (`Notoriety "Known"`: the old words map onto the ladder), or -1. */
export function unlockStep(def: ActionDef): number {
  const m = /Notoriety\s+"([^"]+)"/.exec(def.unlock);
  if (!m) return -1;
  const word = m[1]!;
  const id = E().notoriety.oldWords[word] ?? E().notoriety.steps.find((s) => s.word.toLowerCase() === word.toLowerCase())?.id;
  return id ? stepById(id) : -1;
}

addActionGate((b, def) => {
  const N = E().notoriety;
  const need = unlockStep(def);
  if (need > 0 && peakOf(b) < need) return fill(N.lines.gate, { word: N.steps[need]!.word, min: N.steps[need]!.min });
  if (def.unlock === 'Press contact' && !b.empire?.press) return N.lines.noPress;
  return null;
});

// ---------- after every step: the books and the ladder ----------

/** What `stepInRun` (and a fight's end) calls with the block as it was: books the money, checks the ladder. */
export function afterStep(b: DominionBlock, fundsBefore: number, sumBefore: number, line: string, where: string | null): string[] {
  const e = empireOf(b);
  if (where && !e.visits.includes(where)) e.visits.push(where);
  bookRest(b, fundsBefore, sumBefore, line);
  return checkRise(b);
}

/** The Ledger line an action's money lands on. */
export function lineFor(a: DominionAction): string {
  if (a.t === 'act' && DOMINION_DATA.field.play[a.action]?.clean) return 'legit';
  return E().ledger.byAction[a.t] ?? 'other';
}

export { weekSum };

// ---------- the World Turn's end: Control, holding, and the week's close ----------

const weekLen = (): number => DOMINION_DATA.start.clock.weekLength;

function endOfTurn(b: DominionBlock): string[] {
  const e = empireOf(b), K = E().control;
  const lines: string[] = [];
  const statusBefore = new Map(Object.entries(b.field.districts).map(([id, d]) => [id, statusOf(d)]));
  // Heat wears Control down (Part 3 §2), unless someone stood guard there today.
  for (const d of F().districts) {
    const ds = b.field.districts[d.id]!;
    if (ds.heat >= K.heatErodeAt && ds.control > 0 && !e.guarded.includes(d.id)) {
      ds.control = clamp(ds.control - K.heatErode);
      lines.push(fill(K.lines.erode, { district: d.name, n: K.heatErode }));
    }
  }
  e.guarded = [];
  if (b.day % weekLen() === 0) {
    // Rackets dig in: +Control in their districts.
    const dug = [...new Set(b.field.rackets.map((r) => r.district))];
    for (const id of dug) {
      const ds = b.field.districts[id];
      if (ds) ds.control = clamp(ds.control + K.racketWeekly);
    }
    if (dug.length && K.racketWeekly) lines.push(fill(K.lines.rackets, { n: K.racketWeekly, districts: dug.map(name).join(', ') }));
    // Held districts need a Holder each week (Part 3 §2).
    for (const id of F().districts.map((d) => d.id)) {
      const ds = b.field.districts[id]!;
      if (!isHeld(ds) || e.visits.includes(id) || e.holders.includes(id)) continue;
      ds.control = clamp(ds.control - K.holdLoss);
      lines.push(fill(K.lines.unheld, { district: name(id), n: K.holdLoss }));
    }
    closeWeek(b);
  }
  // Status changes worth a line (a district held, or slipping).
  const rank = ['rival', 'out', 'foot', 'contested', 'held', 'owned'];
  for (const [id, was] of statusBefore) {
    const now = statusOf(b.field.districts[id]!);
    if (now === was) continue;
    const up = rank.indexOf(now) > rank.indexOf(was);
    if (up && (now === 'held' || now === 'owned')) lines.push(fill(K.lines.rose, { district: name(id), word: K.words[now] }));
    else if (!up && (was === 'held' || was === 'owned')) lines.push(fill(K.lines.slipped, { district: name(id), word: K.words[now] }));
  }
  syncHeat(b);
  lines.push(...checkRise(b));
  return lines;
}

/** Closes this week's page into the history (the graph), and starts a new one. */
export function closeWeek(b: DominionBlock): LedgerWeek {
  const e = empireOf(b);
  settleClean(b);
  const n = notorietyOf(b);
  const ds = Object.values(b.field.districts);
  const w: LedgerWeek = {
    w: Math.max(1, Math.floor(b.day / weekLen())),
    clean: e.clean, dirty: b.funds - e.clean, net: weekSum(b), lines: { ...e.week },
    notoriety: n.total, regard: ds.reduce((a, d) => a + Math.max(0, d.regard), 0), dread: ds.reduce((a, d) => a + Math.max(0, d.dread), 0),
    held: heldIds(b).length, wanted: b.heat,
  };
  e.weeks = [...e.weeks, w].slice(-E().ledger.keep);
  e.week = {};
  e.visits = [];
  e.holders = [];
  e.collect = {};
  return w;
}

addWorldEnd((b) => endOfTurn(b));

// ---------- the crew's district tasks ----------

/** Morning or Evening: where a member does their district task. */
export function setWhere(block: DominionBlock, memberId: string, district: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = withCrew(block);
  const m = b.members.find((x) => x.id === memberId);
  if (!m || !districtDef(district) || !['morning', 'evening'].includes(b.phase)) return { ok: false, block, notice: null };
  crewOf(m).where = district;
  return { ok: true, block: b, notice: null };
}

setDistrictTask((b, m, task: Task, x) => {
  const e = task.effect!, T = E().tasks.lines;
  const id = whereOf(m);
  const ds = b.field.districts[id]!;
  const em = empireOf(b);
  const n = e.n ? (x.lv >= 3 ? e.n[1] : e.n[0]) : 0;
  const v = { name: m.name, task: task.name, district: name(id), n };
  if (e.heat) addHeat(b, id, e.heat);
  switch (e.does) {
    case 'regard':
      ds.regard += n;
      x.say('world', fill(T.regard!, v));
      break;
    case 'dread':
      ds.dread += n;
      x.say('world', fill(T.dread!, v));
      break;
    case 'cool':
    case 'peace':
      addHeat(b, id, -n);
      if (e.does === 'peace') ds.rival = clamp(ds.rival - 1);
      x.say('police', fill(T.cool!, v));
      break;
    case 'patrol':
      ds.rival = clamp(ds.rival - n);
      if (!em.guarded.includes(id)) em.guarded.push(id);
      x.say('world', fill(T.patrol!, v));
      break;
    case 'line':
      ds.rival = clamp(ds.rival - n);
      if (!em.guarded.includes(id)) em.guarded.push(id);
      x.say('world', fill(T.line!, v));
      break;
    case 'collect': {
      if (!b.field.rackets.some((r) => r.district === id)) {
        x.say('money', fill(T.noRackets!, v));
        break;
      }
      const pct = e.collect?.[x.lv - 1] ?? 100;
      em.collect[id] = Math.max(em.collect[id] ?? 0, pct);
      x.say('money', fill(T.collect!, { ...v, pct }));
      break;
    }
    case 'hold':
      if (!isHeld(ds)) {
        x.say('world', fill(T.notHeld!, v));
        break;
      }
      if (!em.holders.includes(id)) em.holders.push(id);
      x.say('world', fill(T.hold!, v));
      break;
    case 'face':
      ds.regard += n;
      if (!em.holders.includes(id)) em.holders.push(id);
      x.say('world', fill(T.face!, v));
      break;
    case 'eavesdrop': {
      const open = (districtDef(id)?.targets ?? []).filter((t) => (b.field.scouted[t.id] ?? 0) < b.day + 1);
      if (!open.length) {
        x.say('world', fill(T.nothing!, v));
        break;
      }
      const t = open[x.r.int(0, open.length - 1)]!;
      b.field.scouted[t.id] = b.day + F().odds.scoutDays;
      x.say('world', fill(T.eavesdrop!, { ...v, target: t.name }));
      break;
    }
    case 'poll': {
      if (x.lv >= 3) {
        const list = F().districts.filter((d) => b.field.districts[d.id]!.regard || b.field.districts[d.id]!.dread || d.id === id)
          .map((d) => `${d.name} ♥${b.field.districts[d.id]!.regard} ✊${b.field.districts[d.id]!.dread}`).join(', ');
        x.say('world', fill(T.pollAll!, { ...v, list }));
      } else x.say('world', fill(T.poll!, { ...v, regard: ds.regard, dread: ds.dread }));
      break;
    }
    case 'party': {
      const cost = e.cost ?? 0;
      if (b.funds < cost) {
        x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: m.name, task: task.name }));
        break;
      }
      b.funds -= cost;
      book(b, 'crew', -cost);
      ds.regard += n;
      x.say('world', fill(T.party!, { ...v, cost }));
      break;
    }
    case 'song':
      ds.regard += n;
      for (const y of b.members) y.morale = Math.min(100, y.morale + (e.mor ?? 0));
      x.say('world', fill(T.song!, { ...v, mor: e.mor ?? 0 }));
      break;
    default:
      break;
  }
  syncHeat(b);
});

// Honest Accountant (a Formed trait): while one works for you, every Racket pays more ('*' in the week's collect map).
addCrewHook((b) => {
  const pct = Math.max(0, ...b.members.filter((m) => !crewOf(m).out).flatMap((m) => modsOf(b, m).map((x) => x.collect ?? 0)));
  if (pct) empireOf(b).collect['*'] = pct;
});
