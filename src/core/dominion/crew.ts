// DOMINION slice D3, the crew (Part 2; Part 9 A16-A18, A24). Each member has a task every day; the crew's World Turn
// step (the first step, Part 9 A1) runs the tasks, grows the members and writes the crew's part of the Night Report.
// Pure: every roll is on its own named stream (`dominion-crew`, `dominion-internal`), keyed by the day and the member,
// so a new stream never moves an old roll. What needs the run itself (a caught Pokémon, a level, an item) is left in
// `crew.pending` for the session to settle (session.ts `settleCrew`).

import { hashSeed, Rng } from '../rng';
import { DOMINION_DATA } from './data';
import type { Alert, CrewState, DominionBlock, Member, MemberCrew, Mods, StatId, Talk, TalkChoice, Task, Treat } from './schema';
import { STAT_IDS } from './schema';
import { addWorldStep, fill } from './worldTurn';
import { buildingDef, hasRoom, hqFx, spend } from './hqFx';

const C = () => DOMINION_DATA.crew;
const R = () => DOMINION_DATA.crew.rules;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
export const rng = (seed: string, ...key: (string | number)[]): Rng => new Rng(hashSeed([seed, ...key].join('::')));

// ---------- lookups ----------

export const taskById = (id: string): Task | undefined => DOMINION_DATA.tasks.find((t) => t.id === id);
export const gruntType = (id: string | null) => (id ? DOMINION_DATA.gruntTypes.find((t) => t.id === id) : undefined);
export const formedById = (id: string) => C().formed.find((f) => f.id === id);
export const greenById = (id: string) => C().greens.find((g) => g.id === id);
export const rankN = (id: string): number => C().ranks.find((r) => r.id === id)?.n ?? 1;
export const rankWord = (id: string): string => C().ranks.find((r) => r.id === id)?.word ?? id.toUpperCase();
export function familyOf(taskId: string): string | null {
  for (const [fam, ids] of Object.entries(C().families)) if (ids.includes(taskId)) return fam;
  return null;
}
const statWord = (s: StatId): string => s[0]!.toUpperCase() + s.slice(1);
/** A species id as a name in a report line. */
export function monName(id: string): string {
  const special: Record<string, string> = { 'nidoran-f': 'Nidoran♀', 'nidoran-m': 'Nidoran♂', farfetchd: "Farfetch'd", 'mr-mime': 'Mr. Mime' };
  return special[id] ?? id.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
}

// ---------- defaults: a D1 member gets a crew file the first time D3 sees it ----------

export function freshCrew(green: string, temperament: string, task: string, day: number): MemberCrew {
  return {
    type: null, cls: null, kind: null, role: null, green, temperament, formed: [], grew: null, motive: 'money', ambition: 10,
    pHeat: 0, fatigue: 0, xp: 0, statXp: { brawn: 0, nerve: 0, wits: 0, charm: 0, stealth: 0 }, taskXp: {}, tally: {}, treat: {},
    task, setDay: day, last: 'none', lastTask: null, out: null, worked: 0, line: [], memory: [], nick: null, wageDay: day, pocketed: 0,
    flags: [], talked: {},
  };
}

/** The member's crew file. Rook (D1) is grunt type #1, Tripping Grunt (grunt-types.md: the first Grunt is always #1). */
export function crewOf(m: Member): MemberCrew {
  if (m.crew) return m.crew;
  if (m.rank === 'grunt' || m.look.includes('c-rook')) {
    const t = gruntType('t1')!;
    return { ...freshCrew(t.green, greenById(t.green)!.temperaments[0]!, 'guard-hq', m.joinedDay), type: t.id, motive: 'belonging' };
  }
  // The D1 Admin: a trainer-class person. Their Green trait comes from their name, so it never changes on reload.
  const greens = C().greens;
  const g = greens[[...m.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % greens.length]!;
  const cls = DOMINION_DATA.start.members.admin.looks.find((l) => l.file === m.look)?.cls ?? null;
  return { ...freshCrew(g.id, g.temperaments[0]!, 'guard-hq', m.joinedDay), cls, kind: 'route', motive: 'money', ambition: 35 };
}

export const freshCrewState = (): CrewState => ({
  stores: [], leads: [], hires: [], hireDay: 0, talks: [], talksToday: 0, talkDay: 0, alerts: [], saved: 0, used: [], patrons: {}, gone: [],
  next: 2, rerolled: [], pending: [],
});

/** The block with every crew field filled (a D1 save, or a member made before D3). Returns a copy. */
export function withCrew(block: DominionBlock): DominionBlock {
  const b = structuredClone(block);
  b.crew ??= freshCrewState();
  b.crew.next = Math.max(b.crew.next, b.members.length + 1);
  for (const m of b.members) m.crew = crewOf(m);
  return b;
}
const cs = (b: DominionBlock): CrewState => (b.crew ??= freshCrewState());
const mc = (m: Member): MemberCrew => (m.crew ??= crewOf(m));

// ---------- traits and mods ----------

/** Every live modifier the member carries (formed traits), plus won Patrons'. */
export function modsOf(b: DominionBlock, m: Member): Mods[] {
  const out: Mods[] = [];
  for (const id of mc(m).formed) {
    const f = formedById(id);
    if (f?.live) out.push(f.mods);
  }
  for (const p of C().patrons) if (p.live && cs(b).patrons[p.id]?.state === 'won') out.push(p.mods);
  return out;
}
const appliesTo = (mod: Mods, task: Task): boolean =>
  (!mod.family && !mod.task && !mod.stat) || (!!mod.family && familyOf(task.id) === mod.family) || mod.task === task.id || (!!mod.stat && task.stat === mod.stat);

/** The member's current trait for lines and the card: the newest Formed trait, or the Green one. */
export const traitNow = (m: Member): string => mc(m).formed.at(-1) ?? mc(m).green;
export function traitName(id: string): string {
  return formedById(id)?.name ?? greenById(id)?.name ?? id;
}

// ---------- levels ----------

export const xpToNext = (level: number): number => R().xpBase + R().xpPerLevel * level;
export function taskLevel(m: Member, taskId: string): number {
  const xp = mc(m).taskXp[taskId] ?? 0;
  const t = R().taskLevelXp;
  let lv = 1;
  for (let i = 1; i < t.length; i++) if (xp >= t[i]!) lv = i + 1;
  return lv;
}
const TASK_WORDS = ['Green', 'Steady', 'Reliable', 'Veteran', 'Master'];
export const taskLevelWord = (lv: number): string => TASK_WORDS[lv - 1] ?? 'Green';

/** Adds member XP; returns the report lines for levels gained. */
function addXp(m: Member, xp: number, lines: string[]): void {
  const c = mc(m);
  c.xp += xp;
  while (m.level < R().maxLevel && c.xp >= xpToNext(m.level)) {
    c.xp -= xpToNext(m.level);
    m.level += 1;
    lines.push(fill(C().report.level!, { name: m.name, level: m.level }));
  }
}
function growStat(m: Member, stat: StatId, tenths: number, lines: string[]): void {
  const c = mc(m);
  c.statXp[stat] += tenths;
  while (c.statXp[stat] >= R().statStep) {
    c.statXp[stat] -= R().statStep;
    if (m.stats[stat] >= 10) break;
    m.stats[stat] += 1;
    lines.push(fill(C().report.stat!, { name: m.name, stat: statWord(stat), value: m.stats[stat] }));
  }
}
function remember(b: DominionBlock, m: Member, line: string): void {
  const c = mc(m);
  c.memory.push({ day: b.day, line });
  if (c.memory.length > R().memoryLength) c.memory.splice(1, 1); // the first memory stays: the Crew File shows it beside today's
}
export function treat(m: Member, t: Treat, n = 1): void {
  const c = mc(m);
  c.treat[t] = (c.treat[t] ?? 0) + n;
}
function loyaltyBounds(b: DominionBlock, m: Member): [number, number] {
  let lo = 0, hi = 100;
  for (const mod of modsOf(b, m)) {
    if (mod.loyaltyFloor !== undefined) lo = Math.max(lo, mod.loyaltyFloor);
    if (mod.loyaltyCap !== undefined) hi = Math.min(hi, mod.loyaltyCap);
  }
  return [lo, Math.max(lo, hi)];
}
export function addLoyalty(b: DominionBlock, m: Member, n: number): void {
  const [lo, hi] = loyaltyBounds(b, m);
  m.loyalty = clamp(m.loyalty + n, lo, hi);
}
export const addMorale = (m: Member, n: number): void => void (m.morale = clamp(m.morale + n));

// ---------- tasks and odds ----------

/** Why the member can't take this task today, or null. */
export function cantTake(m: Member, task: Task): string | null {
  if (task.status === 'disabled') return `Opens with ${task.needs}.`;
  if (rankN(m.rank) < rankN(task.min)) return `Needs ${rankWord(task.min)} rank.`;
  if (rankN(m.rank) <= 1 && !['rest', 'train', 'guard-hq', 'sleep-it-off'].includes(task.id)) return 'Hopefuls only Rest, Train and Guard.';
  if (mc(m).line.includes(task.id)) return 'Their line: they won\'t.';
  return null;
}

/** The task's odds for this member today, 0-100 (Part 2 §2: stat × 8 + level × 2 + bonuses). Sure tasks are 100. */
export function odds(b: DominionBlock, m: Member, task: Task): number {
  if (task.effect?.sure) return 100;
  const r = R();
  const c = mc(m);
  const stat = task.stat ? m.stats[task.stat] : 5;
  let p = stat * r.oddsPerStat + m.level * r.oddsPerLevel + r.taskLevelOdds[taskLevel(m, task.id) - 1]!;
  if (gruntType(c.type)?.bestAt === task.id) p += r.bestAtBonus;
  for (const mod of modsOf(b, m)) {
    if (mod.pct && appliesTo(mod, task)) p += mod.pct;
    if (mod.planned && c.setDay < b.day - 6) p += mod.planned;
  }
  if (c.green === 'clumsy' && !c.formed.length && (familyOf(task.id) === 'pick' || task.id === 'take-a-delivery')) p -= r.clumsyPenalty;
  if (c.green === 'nervous' && !c.formed.length && !c.flags.includes('nervous-fading') && task.stat === 'nerve') p -= r.nervousPenalty;
  if (m.morale < r.lowMorale) p -= r.lowMoralePenalty;
  if (c.fatigue >= r.tiredAt) p -= r.tiredPenalty;
  return clamp(p, r.oddsMin, r.oddsMax);
}

const lerp = (range: [number, number], stat: number): number => Math.round(range[0] + ((range[1] - range[0]) * (stat - 1)) / 9);

// ---------- the crew's World Turn step ----------

const TIMES = ['0:40', '1:15', '1:50', '2:10', '2:45', '3:20', '3:40', '4:05', '4:30', '5:00', '5:15', '5:40'];

/** Mischief the Green trait does before the task runs (Part 2 §4.1), or null. */
function greenMischief(r: Rng, m: Member, task: Task): 'refused' | 'skipped' | 'wandered' | null {
  const c = mc(m);
  if (c.formed.length) return null;
  const noSkip = modsOfMember(m).some((x) => x.noSkip);
  if (c.green === 'soft' && task.id === 'shake-down') return 'refused';
  if (c.green === 'lazy' && !noSkip && r.chance(R().lazySkip / 100)) return 'skipped';
  if (c.green === 'lost' && !c.flags.some((f) => f.startsWith('map:')) && r.chance(R().lostWander / 100)) return 'wandered';
  return null;
}
const modsOfMember = (m: Member): Mods[] => mc(m).formed.map((id) => formedById(id)).filter((f) => f?.live).map((f) => f!.mods);

interface Night { lines: string[]; alerts: Alert[]; guardHeld: Member | null; guards: Member[]; slept: Member[] }

function say(n: Night, kind: Alert['kind'], text: string): void {
  n.lines.push(text);
  n.alerts.push({ kind, time: TIMES[Math.min(n.alerts.length, TIMES.length - 1)]!, text });
}

/** Runs one member's task. */
function runTask(b: DominionBlock, m: Member, seed: string, n: Night): void {
  const c = mc(m);
  const rep = C().report;
  const r = rng(seed, 'dominion-crew', b.day, m.id);
  if (c.out) {
    // Hurt or in a cell: no task; the days count down (a Nurse or a Field Medic heals a day sooner).
    const medic = c.out.why === 'hurt' && (b.members.some((x) => x.id !== m.id && mc(x).role === 'nurse' && !mc(x).out) || b.members.some((x) => modsOfMember(x).some((y) => y.medic)));
    c.out.days -= medic ? 2 : 1;
    if (c.out.days <= 0) {
      say(n, 'crew', fill(c.out.why === 'jail' ? rep.freed! : rep.healed!, { name: m.name }));
      c.out = null;
    } else say(n, 'crew', fill(rep.out!, { name: m.name, why: c.out.why === 'jail' ? 'in a cell' : 'hurt' }));
    c.last = 'none';
    c.worked = 0;
    return;
  }
  // A talk can set today's task once (time off, a visit home) or a half day.
  const once = c.flags.find((f) => f.startsWith('once:'));
  c.flags = c.flags.filter((f) => f !== once);
  let task = taskById(once ? once.slice(5) : c.task);
  if (!task || cantTake(m, task)) task = taskById('guard-hq')!;
  const e = task.effect!;
  c.lastTask = task.id;
  const label = C().quickLabels[task.id] ?? task.name;
  const mods = modsOf(b, m);
  const forced = c.flags.includes(`forced:${task.id}`);
  c.flags = c.flags.filter((f) => f !== `forced:${task!.id}`);
  const refuse = mods.some((x) => x.refuse?.includes(task!.id));
  let mischief = refuse ? 'refused' : greenMischief(r, m, task);
  if (forced && mischief === 'refused') mischief = null;
  if (mischief) {
    c.last = mischief;
    say(n, 'crew', fill(rep[mischief]!, { name: m.name, task: mischief === 'refused' ? label.toLowerCase() : label }));
    if (task.effect?.kind === 'guard' && mischief === 'skipped') n.slept.push(m);
    return;
  }
  const half = c.flags.includes('half');
  c.flags = c.flags.filter((f) => f !== 'half');
  const p = Math.max(R().oddsMin, odds(b, m, task) - (half ? R().halfDayPenalty : 0));
  let ok = e.sure || r.int(1, 100) <= p;
  if (!ok && mods.some((x) => x.reroll) && !cs(b).rerolled.includes(m.id)) {
    cs(b).rerolled.push(m.id);
    ok = r.int(1, 100) <= p;
  }
  const lv = taskLevel(m, task.id);
  const yieldPct = R().taskLevelYield[lv - 1]! + mods.filter((x) => x.yieldPct && appliesTo(x, task!)).reduce((a, x) => a + x.yieldPct!, 0);
  const heatMod = mods.filter((x) => x.heat && appliesTo(x, task!)).reduce((a, x) => a + x.heat!, 0) + (c.green === 'loudmouth' && !c.formed.length ? R().loudmouthHeat : 0) - (lv >= 2 ? 1 : 0);
  const stat = task.stat ? m.stats[task.stat] : 5;
  let xp = R().doneXp;
  c.last = ok ? 'success' : 'fail';
  const fam = familyOf(task.id);
  if (fam) c.tally[fam] = (c.tally[fam] ?? 0) + 1;
  if (ok) {
    xp += R().successXp;
    if (task.stat) growStat(m, task.stat, R().statPerSuccess, n.lines);
    for (const id of Object.keys(cs(b).patrons)) {
      const pat = C().patrons.find((x) => x.id === id);
      const st = cs(b).patrons[id]!;
      if (pat && st.state === 'found' && pat.job.kind === 'tasks' && pat.job.family === fam) st.progress += 1;
    }
  }
  switch (e.kind) {
    case 'guard':
      n.guards.push(m);
      if (ok) n.guardHeld ??= m;
      else n.slept.push(m);
      break;
    case 'money': {
      if (ok) {
        let amount = Math.round(lerp(e.funds!, stat) * (1 + yieldPct / 100));
        const pocketPct = (c.green === 'greedy' && !c.formed.length ? R().greedyPocket : 0) + mods.reduce((a, x) => a + (x.pocket ?? 0), 0);
        const pocket = Math.round((amount * pocketPct) / 100);
        amount -= pocket;
        c.pocketed += pocket;
        if (mods.some((x) => x.ambition) && pocket) c.ambition = clamp(c.ambition + 1);
        b.funds += amount;
        b.earned += amount;
        b.heat = clamp(b.heat + Math.max(0, (e.heat ?? 0) + heatMod));
        c.pHeat = clamp(c.pHeat + Math.max(0, (e.heat ?? 0) + heatMod));
        if (amount >= lerp(e.funds!, 10)) c.last = 'big';
        say(n, 'money', fill(rep.money!, { name: m.name, task: label, amount }));
      } else caughtOrFail(b, m, label, e.risky ?? false, e.caughtHeat, e.fine, r, n);
      break;
    }
    case 'steal': {
      if (ok) {
        const pool = pools(b).steal;
        const species = pool[r.int(0, pool.length - 1)]!;
        const level = Math.min(b.levelCap, r.int(R().stealLevel[0], R().stealLevel[1]));
        cs(b).pending.push({ k: 'mon', species, level });
        b.heat = clamp(b.heat + (e.heat ?? 0) + heatMod);
        c.pHeat = clamp(c.pHeat + (e.heat ?? 0));
        say(n, 'crew', fill(rep.steal!, { name: m.name, mon: monName(species), level }));
      } else caughtOrFail(b, m, label, true, e.caughtHeat, undefined, r, n);
      break;
    }
    case 'catch': {
      if (ok) {
        const pool = pools(b).catch;
        const species = pool[r.int(0, pool.length - 1)]!;
        const level = Math.min(b.levelCap, r.int(R().catchLevel[0], R().catchLevel[1]) + (lv >= 2 ? 1 : 0) + (lv >= 4 ? 2 : 0));
        cs(b).pending.push({ k: 'mon', species, level });
        say(n, 'crew', fill(rep.catch!, { name: m.name, mon: monName(species), level }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'berries': {
      if (ok) {
        const list = lv >= 5 || (lv >= 4 && b.day % 7 === 0) ? R().rareBerries : R().berries;
        const id = list[r.int(0, list.length - 1)]!;
        const k = lv >= 3 ? 2 : 1;
        cs(b).pending.push({ k: 'item', id, n: k });
        say(n, 'crew', fill(rep.berries!, { name: m.name, n: k, berry: monName(id) }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'scout': {
      if (ok) {
        cs(b).saved = Math.min(R().scoutActions, cs(b).saved + 1);
        say(n, 'crew', fill(rep.scout!, { name: m.name, n: R().scoutActions }));
        // Patrons are found by Scouting (A16).
        const pat = C().patrons.find((x) => cs(b).patrons[x.id]?.state === 'rumour');
        if (pat) {
          cs(b).patrons[pat.id] = { state: 'found', progress: 0, day: b.day };
          say(n, 'crew', fill(rep.rumour!, { name: m.name, rumour: `${pat.name}, ${pat.who}. ${pat.jobText}` }));
        }
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'recruit': {
      // Leads are made by recruit.ts (it owns the candidate roll); here the crew step asks for one.
      if (ok && LEAD_MAKER) {
        const lead = LEAD_MAKER(b, m, seed);
        say(n, 'crew', lead ? fill(rep.found!, { name: m.name, cand: lead.name, cls: lead.cls }) : fill(rep.foundNone!, { name: m.name }));
      } else say(n, 'crew', fill(rep.foundNone!, { name: m.name }));
      break;
    }
    case 'train': {
      // D5: the Training Room and the Dojo add XP to every Train task.
      let gain = (e.xp ?? R().trainXp) + mods.reduce((a, x) => a + (x.trainXp ?? 0), 0) + hqFx(b).trainXp;
      if (mods.some((x) => x.xpMult && appliesTo(x, task!))) gain *= 2;
      const mentor = b.members.find((x) => x.id !== m.id && mc(x).task === task!.id && modsOfMember(x).some((y) => y.mentor) && rankN(m.rank) <= 2);
      if (mentor) gain += 1;
      xp += gain;
      if (e.grow) growStat(m, e.grow, R().statPerSuccess, n.lines);
      say(n, 'crew', fill(rep.train!, { name: m.name, xp: gain }));
      if (r.int(1, 100) <= (e.injury ?? R().injuryChance)) {
        // D5: the Infirmary halves the time off.
        const days = Math.max(1, Math.round((R().injuryDays * (100 - hqFx(b).injury)) / 100));
        c.out = { why: 'hurt', days };
        say(n, 'crew', fill(rep.injured!, { name: m.name, days }));
      }
      break;
    }
    case 'trainMon': {
      const mon = [...m.team].sort((a, x) => a.level - x.level)[0];
      if (ok && mon && mon.level < b.levelCap) {
        const to = Math.min(b.levelCap, mon.level + (lv >= 5 ? 3 : lv >= 3 ? 2 : 1));
        cs(b).pending.push({ k: 'level', member: m.id, uid: mon.uid, level: to });
        say(n, 'crew', fill(rep.trainMon!, { name: m.name, mon: monName(mon.speciesId), level: to }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'rest': {
      addMorale(m, R().restMorale + (lv >= 3 ? 5 : 0));
      c.fatigue = clamp(c.fatigue - Math.round((R().fatigueRest * (100 + hqFx(b).fatigue)) / 100));
      c.pHeat = clamp(c.pHeat - R().pHeatRestCool);
      c.worked = 0;
      say(n, 'crew', fill(rep.rest!, { name: m.name, morale: R().restMorale }));
      break;
    }
    case 'audit': {
      const who = b.members.filter((x) => x.id !== m.id && mc(x).pocketed > 0);
      if (ok && who.length) {
        const amount = who.reduce((a, x) => a + mc(x).pocketed, 0);
        b.funds += amount;
        for (const x of who) {
          mc(x).pocketed = 0;
          addLoyalty(b, x, -R().auditLoyalty);
        }
        say(n, 'money', fill(rep.audit!, { name: m.name, amount, who: who.map((x) => x.name).join(' and ') }));
      } else say(n, 'crew', ok ? fill(rep.auditClean!, { name: m.name }) : fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'welcome': {
      const fresh = b.members.filter((x) => x.id !== m.id && b.day - x.joinedDay <= 7);
      if (ok && fresh.length) {
        for (const x of fresh) {
          addMorale(x, R().welcomeMorale);
          addLoyalty(b, x, R().welcomeLoyalty);
        }
        say(n, 'crew', fill(rep.welcome!, { name: m.name }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'interview': {
      const lead = cs(b).leads.filter((l) => !l.waiting).at(-1);
      if (ok && lead) {
        lead.bonus = Math.max(lead.bonus, C().recruit.interviewBonus);
        say(n, 'crew', fill(rep.interview!, { name: m.name, cand: lead.name, n: C().recruit.interviewBonus }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'mentor':
    case 'coach': {
      const who = b.members.filter((x) => x.id !== m.id && !mc(x).out).sort((a, x) => a.level - x.level)[0];
      if (ok && who) {
        const gain = e.kind === 'mentor' ? R().mentorXp : R().coachXp;
        addXp(who, gain, n.lines);
        say(n, 'crew', fill(rep[e.kind]!, { name: m.name, who: who.name, xp: gain }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'rally': {
      if (ok) {
        for (const x of b.members) addMorale(x, R().rallyMorale);
        say(n, 'crew', fill(rep.rally!, { name: m.name, n: R().rallyMorale }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
    case 'drills': {
      if (ok) {
        for (const x of b.members) if (x.id !== m.id && familyOf(mc(x).task) === 'train' && !mc(x).out) addXp(x, 1, n.lines);
        say(n, 'crew', fill(rep.drills!, { name: m.name }));
      } else say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
      break;
    }
  }
  // After the task: XP, task XP, Fatigue (A18), Thrill.
  addXp(m, xp, n.lines);
  const before = taskLevel(m, task.id);
  c.taskXp[task.id] = (c.taskXp[task.id] ?? 0) + (ok ? 2 : 1);
  const after = taskLevel(m, task.id);
  if (after > before) n.lines.push(fill(C().report.taskLevel!, { name: m.name, word: taskLevelWord(after), task: label, level: after }));
  if (e.kind !== 'rest') {
    c.fatigue = clamp(c.fatigue + R().fatiguePerJob);
    c.worked += 1;
    if (c.fatigue >= R().tiredAt) n.lines.push(fill(C().report.tired!, { name: m.name, fatigue: c.fatigue }));
  }
  if (c.motive === 'thrill' && e.risky && ok) addMorale(m, R().thrillMorale);
}

function caughtOrFail(b: DominionBlock, m: Member, label: string, risky: boolean, caughtHeat: number | undefined, fine: number | undefined, r: Rng, n: Night): void {
  const c = mc(m);
  const rep = C().report;
  if (!risky) {
    if (fine) spend(b, fine);
    say(n, 'crew', fill(rep.fail!, { name: m.name, task: label }));
    return;
  }
  const heat = caughtHeat ?? R().heatOnCaught;
  b.heat = clamp(b.heat + heat);
  c.pHeat = clamp(c.pHeat + R().pHeatOnCaught);
  c.last = 'caught';
  say(n, 'police', fill(rep.caught!, { name: m.name, task: label.toLowerCase(), heat }));
  if (r.int(1, 100) <= R().arrestCaughtChance) arrest(b, m, n, rep.arrested!);
}

function arrest(b: DominionBlock, m: Member, n: Night, line: string): void {
  const c = mc(m);
  const days = modsOfMember(m).find((x) => x.jailDays !== undefined)?.jailDays ?? R().jailDays;
  c.out = { why: 'jail', days };
  c.last = 'arrested';
  say(n, 'police', fill(line, { name: m.name, bail: R().bail, days }));
  remember(b, m, 'The night the cell door shut.');
}

const pools = (b: DominionBlock) => {
  void b;
  const region = DOMINION_DATA.start.start.region.toLowerCase();
  return C().pools[region] ?? C().pools.kanto!;
};

/** recruit.ts registers the lead maker (it owns the candidate roll), so this file doesn't import it. */
type LeadMaker = (b: DominionBlock, finder: Member, seed: string) => { name: string; cls: string } | null;
let LEAD_MAKER: LeadMaker | null = null;
export function setLeadMaker(f: LeadMaker): void {
  LEAD_MAKER = f;
}
type DayHook = (b: DominionBlock, seed: string, n: { lines: string[]; say: (kind: Alert['kind'], text: string) => void }) => void;
const DAY_HOOKS: DayHook[] = [];
/** recruit.ts and talk.ts add their nightly upkeep here (leads leaving, Patrons, the talk cards). */
export function addCrewHook(h: DayHook): void {
  DAY_HOOKS.push(h);
}

/** The crew's World Turn step (Part 9 A1, first in the order). Changes `block` in place. */
export function crewStep(block: DominionBlock, seed: string): string[] {
  const b = block;
  const st = cs(b);
  const rep = C().report;
  const n: Night = { lines: [], alerts: [], guardHeld: null, guards: [], slept: [] };
  st.pending = [];
  st.saved = Math.min(0, st.saved);
  if (b.day % 7 === 1) st.rerolled = [];
  for (const m of b.members) {
    mc(m);
    runTask(b, m, seed, n);
  }
  // A thief tries the door (Part 2 §2: Guard defends against thieves).
  const r = rng(seed, 'dominion-crew', b.day, 'thief');
  if (r.int(1, 100) <= R().thiefChance) {
    if (n.guardHeld) say(n, 'crew', fill(rep.guardHeld!, { name: n.guardHeld.name }));
    else if (b.funds > 0) {
      const amount = Math.min(R().thiefMax, Math.max(1, Math.round((b.funds * R().thiefPct) / 100)));
      spend(b, amount);
      for (const s of n.slept) say(n, 'crew', fill(rep.guardSlept!, { name: s.name }));
      say(n, 'crew', fill(rep.thief!, { amount }));
    }
  } else for (const g of n.guards) say(n, 'crew', fill(rep.guardQuiet!, { name: g.name }));
  // Personal Heat cools (A18); at 50+ the police may pick them up. A Lawyer and Nobody cool it faster.
  const lawyer = b.members.find((x) => mc(x).role === 'lawyer' && !mc(x).out);
  const extraCool = (lawyer ? R().lawyerCool : 0) + C().patrons.filter((p) => p.live && st.patrons[p.id]?.state === 'won').reduce((a, p) => a + (p.mods.pHeat ?? 0), 0);
  if (lawyer && b.heat > 0) {
    b.heat -= 1;
    n.lines.push(fill(rep.lawyer!, { name: lawyer.name }));
  }
  for (const m of b.members) {
    const c = mc(m);
    c.pHeat = clamp(c.pHeat - R().pHeatCool - extraCool);
    if (!c.out && c.pHeat >= R().arrestAt && rng(seed, 'dominion-crew', b.day, m.id, 'arrest').int(1, 100) <= c.pHeat - R().arrestBase) arrest(b, m, n, rep.pickedUp!);
  }
  // Pay day was yesterday's World Turn (D1's weekly bills): count it as paid on time or late (Part 2 §4.2), Money motive.
  if (b.day > 1 && (b.day - 1) % DOMINION_DATA.start.clock.weekLength === 0) {
    for (const m of b.members) {
      treat(m, m.unpaid ? 'payLate' : 'payOnTime');
      if (!m.unpaid && mc(m).motive === 'money') addLoyalty(b, m, R().moneyLoyalty);
      if (mc(m).motive === 'belonging' && b.members.length >= 3) addMorale(m, R().belongingMorale);
    }
    weekly(b, seed, n);
  }
  for (const m of b.members) {
    const [lo, hi] = loyaltyBounds(b, m);
    m.loyalty = clamp(m.loyalty, lo, hi);
    growTraits(b, m, n);
  }
  for (const h of DAY_HOOKS) h(b, seed, { lines: n.lines, say: (k, t) => say(n, k, t) });
  st.alerts = n.alerts;
  return n.lines;
}

/** Loyalty below 20: a weekly roll to quit, steal from you, or sell you out (Part 2 §5). */
function weekly(b: DominionBlock, seed: string, n: Night): void {
  const rep = C().report;
  const noQuit = C().patrons.some((p) => p.live && p.mods.noQuit && cs(b).patrons[p.id]?.state === 'won');
  for (const m of [...b.members]) {
    const c = mc(m);
    c.pocketed = 0;
    if (m.loyalty >= R().disloyalAt) continue;
    const mult = modsOf(b, m).reduce((a, x) => a * (x.disloyal ?? 1), 1);
    const roll = rng(seed, 'dominion-crew', b.day, m.id, 'week').int(1, 100);
    if (!noQuit && roll <= R().quitChance * mult) leave(b, m, 'quit', n, fill(rep.quit!, { name: m.name }));
    else if (!noQuit && roll <= (R().quitChance + R().stealChance) * mult) {
      const amount = Math.max(0, Math.min(b.funds, R().stealBase + m.level * R().stealPerLevel));
      spend(b, amount);
      leave(b, m, 'stole', n, fill(rep.stole!, { name: m.name, amount }));
    } else if (roll <= (R().quitChance + R().stealChance + R().sellOutChance) * mult) {
      b.heat = clamp(b.heat + R().sellOutHeat);
      say(n, 'police', fill(rep.soldOut!, { name: m.name, heat: R().sellOutHeat }));
    } else say(n, 'crew', fill(rep.unhappy!, { name: m.name }));
  }
}

/** A member leaves the crew for good (quit, stole, dismissed). The Goodbye talk can see them off. */
export function leave(b: DominionBlock, m: Member, why: string, n: Night | null, line: string): void {
  b.members = b.members.filter((x) => x.id !== m.id);
  cs(b).gone.push({ id: m.id, name: m.name, day: b.day, why });
  if (n) say(n, 'crew', line);
}

/** Green traits mature (Part 2 §4.2): the first at Grunt rank and level, the second at Sergeant. */
export function growTraits(b: DominionBlock, m: Member, n: { lines: string[] } | null): string | null {
  const c = mc(m);
  const tr = C().traitRanks;
  const firstRank = C().ranks.find((r) => r.id === tr.first)!;
  const secondRank = C().ranks.find((r) => r.id === tr.second)!;
  const want = rankN(m.rank) >= secondRank.n && m.level >= secondRank.level ? 2 : rankN(m.rank) >= firstRank.n && m.level >= firstRank.level ? 1 : 0;
  if (c.formed.length >= want) return null;
  const days = Object.values(c.tally).reduce((a, x) => a + x, 0);
  if (days < R().traitDays) return null;
  const to = pickTrait(m);
  if (!to) return null;
  const from = c.formed.length ? c.formed.at(-1)! : c.green;
  c.formed.push(to);
  c.grew = { from, to, day: b.day };
  m.untrained = false;
  const line = fill(C().growLine, { name: m.name, from: traitName(from), to: traitName(to) });
  n?.lines.push(line);
  remember(b, m, memberLine(m, b.day));
  return to;
}

/** The trait that fits the member's record best (Part 2 §4.2 table, then their Grunt type's "Grows into"). */
export function pickTrait(m: Member): string | null {
  const c = mc(m);
  const t = c.treat;
  const punish = t.punish ?? 0;
  const best = Math.max(0, ...Object.entries(t).filter(([k]) => k !== 'punish').map(([, v]) => v ?? 0));
  if (punish >= R().resentfulPunish && punish > best && !c.formed.includes('resentful')) return 'resentful';
  const typeGrow = gruntType(c.type)?.grows;
  let top: { id: string; score: number } | null = null;
  for (const f of C().formed) {
    if (c.formed.includes(f.id) || f.id === 'resentful') continue;
    const fits = f.from.includes(c.green) || (f.id === typeGrow);
    if (!fits) continue;
    const fam = f.family ? (c.tally[f.family] ?? 0) : typeGrow === f.id ? Math.max(0, ...Object.values(c.tally)) : 0;
    let score = fam + 2 * (f.treat ? (t[f.treat] ?? 0) : 0) + (f.id === typeGrow ? 1 : 0);
    if (!f.family && f.id !== typeGrow) score = 0;
    if (!top || score > top.score) top = { id: f.id, score };
  }
  if (top && top.score > 0) return top.id;
  return typeGrow && !c.formed.includes(typeGrow) ? typeGrow : null;
}

/** What the member says today: a line from their current trait's bank, rotating by day. */
export function memberLine(m: Member, day: number): string {
  const id = traitNow(m);
  const bank = C().lines[id];
  if (bank) return bank[day % bank.length]!;
  const g = C().lines.trait!;
  return fill(g[day % g.length]!, { trait: traitName(id), joined: m.joinedDay });
}

/** Pays a jailed member's bail (Part 2 §2: ₽500 or they're gone 3 days). */
export function bail(block: DominionBlock, memberId: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = withCrew(block);
  const m = b.members.find((x) => x.id === memberId);
  if (!m || mc(m).out?.why !== 'jail') return { ok: false, block, notice: null };
  if (b.funds < R().bail) return { ok: false, block, notice: `Not enough money: bail is ₽${R().bail}.` };
  spend(b, R().bail);
  mc(m).out = null;
  addLoyalty(b, m, R().bailLoyalty);
  return { ok: true, block: b, notice: `${m.name} is out on bail. −₽${R().bail}.` };
}

// ---------- morning: assigning tasks ----------

export function assign(block: DominionBlock, memberId: string, taskId: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const b = withCrew(block);
  const m = b.members.find((x) => x.id === memberId);
  const task = taskById(taskId);
  if (!m || !task || !['morning', 'evening'].includes(b.phase)) return { ok: false, block, notice: null };
  const why = cantTake(m, task);
  if (why) return { ok: false, block, notice: why };
  if (task.room && !hasRoom(b, task.room)) return { ok: false, block, notice: `Build the ${buildingDef(task.room)?.name ?? task.room} first.` };
  const c = mc(m);
  if (c.task !== taskId) {
    c.task = taskId;
    c.setDay = b.day;
  }
  // Sending someone worn out back to work counts as pushing them hard (Part 2 §4.2).
  if (c.fatigue >= R().pushFatigue && task.effect?.kind !== 'rest') treat(m, 'push');
  return { ok: true, block: b, notice: null };
}

addWorldStep('crew', crewStep);

export { STAT_IDS };
export type { Night, TalkChoice, Talk };
