// DOMINION slice D8: Squads and Groups (Part 10; Kice 2026-11-18: "Allow the player to create their own squads/groups with
// their own incentive and Code Name"). A squad is members the Boss puts together under a Code Name, a Leader (Corporal
// to Captain) and an Incentive; one order sends the whole squad out on one job, rolled once on squad odds (the leader's
// stat + half each other member's + Cohesion + Incentive + Focus). Groups put squads under an Admin or higher.
// Pure: no Phaser. Rolls on the stream `dominion-squad` (new; no old roll moves). Hooks into the crew step through
// crew.ts's addRunHook / addOddsHook / addModHook / addCrewHook / addTaskKind, and into the Boss's Card through field.ts.

import { DOMINION_DATA } from './data';
import type { DominionAction, DominionBlock, GroupDraft, Member, Mods, Squad, SquadDraft, SquadsFile, SquadsState, Task } from './schema';
import {
  addCrewHook, addLoyalty, addModHook, addMorale, addOddsHook, addRunHook, addTaskKind, addXp, cantTake, crewOf, familyOf, leave, odds, rankN, rankWord, rng, taskById, taskLevel,
} from './crew';
import { notoriety } from './recruit';
import { addCardHook } from './field';
import { fill } from './worldTurn';

const Q = () => DOMINION_DATA.squads;
const N = (k: string): number => Q().numbers[k] as number;
const NA = (k: string): number[] => Q().numbers[k] as number[];
const T = (k: string): number => Q().traitNumbers[k] ?? 0;
const L = (k: string, v: Record<string, string | number> = {}): string => fill(Q().lines[k] ?? k, v);
/** A signed number for report lines: +5, −15. */
const sgn = (n: number): string => (n < 0 ? `−${-n}` : `+${n}`);
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const R = () => DOMINION_DATA.crew.rules;
const mc = (m: Member) => (m.crew ??= crewOf(m));

export const freshSquads = (): SquadsState => ({ list: [], groups: [], next: 1, pairs: [], seen: [] });
/** The block's squads (filled in place on a block made before D8). */
export const squadsOf = (b: DominionBlock): SquadsState => (b.squads ??= freshSquads());
export const squadOf = (b: DominionBlock, memberId: string): Squad | undefined => b.squads?.list.find((s) => s.members.includes(memberId));
export const squadById = (b: DominionBlock, id: string): Squad | undefined => b.squads?.list.find((s) => s.id === id);
export const groupOf = (b: DominionBlock, squadId: string) => b.squads?.groups.find((g) => g.squads.includes(squadId));
export const incentiveById = (id: string) => Q().incentives.find((i) => i.id === id);
export const traitById = (id: string | null) => (id ? Q().traits.find((t) => t.id === id) : undefined);
export const focusById = (id: string | null) => (id ? Q().focus.find((f) => f.id === id) : undefined);
export const targetById = (id: string | null) => (id ? Q().targets.find((t) => t.id === id) : undefined);
const memberById = (b: DominionBlock, id: string): Member | undefined => b.members.find((m) => m.id === id);

/** The Cohesion band (Strangers, Workmates, Tight, Family). */
export function bandOf(cohesion: number) {
  const bands = Q().cohesion.bands;
  let out = bands[0]!;
  for (const x of bands) if (cohesion >= x.min) out = x;
  return out;
}
export const isFamily = (s: Squad): boolean => bandOf(s.cohesion).id === 'family';

/** Squad size and kind by the leader's rank (Part 10 §3); a rank above Captain leads as a Captain would. Null below Corporal. */
export function sizeFor(rank: string): { max: number; kind: 'squad' | 'unit' } | null {
  const n = rankN(rank);
  if (n < rankN(Q().unlock.leaderMin)) return null;
  const sizes = Q().sizes;
  const row = sizes.find((x) => x.rank === rank) ?? (n > rankN(sizes.at(-1)!.rank) ? sizes.at(-1)! : null);
  return row ? { max: row.max, kind: row.kind } : null;
}
/** The Group kind an officer can lead (Admin to Commander: Group; Executive and Right Hand: Division), or null. */
export function groupKindFor(rank: string) {
  const n = rankN(rank);
  return Q().groups.find((g) => n >= rankN(g.from) && n <= rankN(g.to)) ?? null;
}
/** How many squads the Boss can run: HQ level + 1 (Part 10 §3). Operations Rooms (+1 each) come with D5's rooms. */
export const squadCap = (b: DominionBlock): number => b.hqLevel * Q().cap.perHq + Q().cap.base;

/** Why squads can't be formed yet (Street Gang and a Corporal, Part 10 §1), or null. Formed squads stay. */
export function lockedWhy(b: DominionBlock): string | null {
  if (squadsOf(b).list.length) return null;
  const u = Q().unlock;
  if (notoriety(b) < u.notoriety) return L('locked', { word: u.word, need: u.notoriety });
  if (!b.members.some((m) => sizeFor(m.rank))) return L('lockedNoCorporal');
  return null;
}

/** A typed Code Name's problem (up to 20 letters, the word filter, not taken), or null. */
export function nameProblem(b: DominionBlock, name: string, selfId: string | null): string | null {
  const c = Q().codeName;
  const t = name.trim();
  if (!t) return L('nameEmpty');
  if (t.length > c.max) return L('nameLong', { n: c.max });
  if (!new RegExp(c.allowed).test(t)) return L('nameChars');
  const low = t.toLowerCase();
  if (c.badWords.some((w) => low.includes(w))) return L('nameBad');
  const st = squadsOf(b);
  if ([...st.list, ...st.groups].some((x) => x.id !== selfId && x.codeName.toLowerCase() === low)) return L('nameTaken', { name: t });
  return null;
}

/** Six suggested Code Names from the picked members' records (what they do most, where, the first Warehouse). */
export function suggestions(b: DominionBlock, memberIds: readonly string[]): string[] {
  const sg = Q().suggest;
  const st = squadsOf(b);
  const taken = new Set([...st.list, ...st.groups].map((x) => x.codeName.toLowerCase()));
  const out: string[] = [];
  const add = (n: string | undefined): void => {
    if (n && !taken.has(n.toLowerCase()) && !out.includes(n)) out.push(n);
  };
  const tally: Record<string, number> = {};
  for (const id of memberIds) {
    const m = memberById(b, id);
    if (!m) continue;
    for (const [k, v] of Object.entries(mc(m).tally)) tally[k] = (tally[k] ?? 0) + v;
  }
  for (const [fam] of Object.entries(tally).sort((a, x) => x[1] - a[1] || a[0].localeCompare(x[0]))) add(sg.byFamily[fam]);
  if (b.hqLevel === 1) add(sg.warehouse);
  const town = DOMINION_DATA.field.districts.find((d) => d.id === b.field.at) ?? DOMINION_DATA.field.districts.find((d) => d.id === DOMINION_DATA.field.hq);
  if (town) {
    add(sg.byDistrict[town.id]);
    add(fill(sg.town, { town: town.name }));
  }
  for (const s of sg.spare) add(s);
  for (const s of Object.values(sg.byDistrict)) add(s);
  return out.slice(0, 6);
}

// ---------- tonight's squad job ----------

/** Who goes out on the squad's job tonight: the leader (if fit and on the order) and the members on the same task. */
export function crewFor(b: DominionBlock, s: Squad): { leader: Member; followers: Member[] } | null {
  if (!s.order) return null;
  const leader = memberById(b, s.leader);
  if (!leader || !sizeFor(leader.rank) || mc(leader).out || mc(leader).task !== s.order) return null;
  const followers = s.members.filter((id) => id !== s.leader).map((id) => memberById(b, id)).filter((m): m is Member => !!m && !mc(m).out && mc(m).task === s.order);
  return { leader, followers };
}
const followsTonight = (b: DominionBlock, m: Member): Squad | null => {
  const s = squadOf(b, m.id);
  if (!s || s.leader === m.id) return null;
  const c = crewFor(b, s);
  return c?.followers.some((x) => x.id === m.id) ? s : null;
};
const leadsTonight = (b: DominionBlock, m: Member): Squad | null => {
  const s = squadOf(b, m.id);
  return s && s.leader === m.id && crewFor(b, s) ? s : null;
};

/** The odds parts a squad job adds for its leader (Part 10 §7), shown on the Squads page. */
export function squadParts(b: DominionBlock, s: Squad, task: Task): [string, number][] {
  const c = crewFor(b, s);
  if (!c || task.id !== s.order) return [];
  const parts: [string, number][] = [];
  const stat = task.stat;
  if (c.followers.length) {
    const half = Math.floor(c.followers.reduce((a, m) => a + (stat ? m.stats[stat] : 5), 0) / 2);
    parts.push(['Half of each member', half * R().oddsPerStat]);
  }
  const band = bandOf(s.cohesion);
  if (band.pct) parts.push([`Cohesion: ${band.word.toLowerCase()}`, band.pct]);
  const f = focusById(s.focus);
  if (f) parts.push([`Focus ${f.name}`, f.families.includes(familyOf(task.id) ?? '') ? N('focusOn') : N('focusOff')]);
  if (s.incentive === 'cut' && task.effect?.kind === 'money') parts.push(['Cut of the Take', N('cutOdds')]);
  return parts;
}

/** The squad's odds on a task tonight (the leader's odds with the squad parts), or null when it can't go out. */
export function squadOdds(b: DominionBlock, s: Squad, taskId: string): number | null {
  const leader = memberById(b, s.leader);
  const task = taskById(taskId);
  if (!leader || !task || !sizeFor(leader.rank)) return null;
  if (s.order === taskId && crewFor(b, s)) return odds(b, leader, task);
  // A preview for a task not ordered yet: the same parts as if it were.
  const preview: DominionBlock = structuredClone(b);
  const ps = squadById(preview, s.id)!;
  ps.order = taskId;
  for (const id of ps.members) {
    const m = memberById(preview, id);
    if (m && !mc(m).out) mc(m).task = taskId;
  }
  const pl = memberById(preview, s.leader)!;
  if (mc(pl).out) return null;
  return odds(preview, pl, task);
}

// Executive's Run a Crew (task 141): up to five members, not on a squad job, sharper for it tonight.
function runCrewOf(b: DominionBlock): { exec: Member; led: string[] } | null {
  const exec = b.members.find((m) => mc(m).task === 'run-a-crew' && !mc(m).out && !cantTake(m, taskById('run-a-crew')!));
  if (!exec) return null;
  const led = b.members.filter((m) => m.id !== exec.id && !mc(m).out && !['rest', 'sleep-it-off', 'run-a-crew'].includes(mc(m).task) && !followsTonight(b, m)).slice(0, N('runCrewMax')).map((m) => m.id);
  return { exec, led };
}

// ---------- hooks into the crew step ----------

addOddsHook((b, m, task) => {
  let p = 0;
  const s = b.squads ? squadOf(b, m.id) : undefined;
  if (s) {
    if (leadsTonight(b, m) === s) p += squadParts(b, s, task).reduce((a, x) => a + x[1], 0);
    // Brotherhood: −10% when split up (a member working apart while the squad has an order).
    else if (s.incentive === 'brotherhood' && s.order && mc(m).task !== s.order) p -= N('splitPenalty');
  }
  // Match-Make pairs: a small bonus when both are on the same task.
  for (const [a, x] of b.squads?.pairs ?? []) {
    const other = a === m.id ? x : x === m.id ? a : null;
    const o = other ? memberById(b, other) : null;
    if (o && !mc(o).out && mc(o).task === mc(m).task) p += N('matchOdds');
  }
  const rc = runCrewOf(b);
  if (rc && rc.led.includes(m.id) && task.stat) {
    const lv = taskLevel(rc.exec, 'run-a-crew');
    const st = rc.exec.stats[task.stat];
    p += (lv >= 3 ? st : Math.floor(st / 2)) * R().oddsPerStat + (lv >= 2 ? N('runCrewPlan') : 0);
  }
  return p;
});

addModHook((b, m) => {
  const s = b.squads ? squadOf(b, m.id) : undefined;
  if (!s) return [];
  const out: Mods[] = [];
  const tn = T;
  if (s.incentive === 'fear') out.push({ loyaltyCap: N('fearLoyaltyMax') });
  if (s.incentive === 'quiet') out.push({ family: 'pick', pct: N('quietOdds') });
  switch (s.trait) {
    case 'blood-oath': out.push({ loyaltyFloor: tn('bloodOath') }); break;
    case 'iron-nerves': out.push({ stat: 'nerve', pct: tn('ironNerves') }); break;
    case 'sticky-fingers': out.push({ family: 'pick', pct: tn('stickyFingers') }); break;
    case 'lookouts': out.push({ family: 'scout', pct: tn('lookouts') }); break;
    case 'pack-hunters': out.push({ family: 'catch', pct: tn('packHunters') }); break;
    case 'bookkeepers': out.push({ task: 'audit-the-books', pct: tn('bookkeepers') }); break;
    default: break;
  }
  return out;
});

interface Before { funds: number; heat: number; pHeat: Record<string, number>; pocketed: number; odds: number; followers: string[]; squad: string | null }
const BEFORE = new Map<string, Before>();

addRunHook({
  skip: (b, m) => !!(b.squads && followsTonight(b, m)),
  before: (b, m) => {
    if (!b.squads?.list.length) return;
    if (!squadOf(b, m.id)) return;
    const lead = leadsTonight(b, m);
    const task = taskById(mc(m).task);
    const c = lead ? crewFor(b, lead) : null;
    BEFORE.set(m.id, {
      funds: b.funds, heat: b.heat, pHeat: { [m.id]: mc(m).pHeat }, pocketed: mc(m).pocketed,
      odds: lead && task ? odds(b, m, task) : 0, followers: c ? c.followers.map((x) => x.id) : [], squad: lead ? lead.id : null,
    });
  },
  after: (b, m, _seed, n) => {
    const pre = BEFORE.get(m.id);
    BEFORE.delete(m.id);
    if (!pre) return;
    const s = squadOf(b, m.id);
    if (!s) return;
    const c = mc(m);
    // Personal Heat from the job: Glory builds it 25% faster, Quiet Work halves it, Ghost Shift hides squad jobs.
    const dp = c.pHeat - (pre.pHeat[m.id] ?? c.pHeat);
    if (dp > 0) {
      let k = 1;
      if (s.incentive === 'glory') k = N('gloryHeatPct') / 100;
      if (s.incentive === 'quiet') k = N('quietHeatPct') / 100;
      if (s.trait === 'ghost-shift' && pre.squad) k = 0;
      c.pHeat = clamp(c.pHeat - dp + dp * k);
    }
    // Bookkeepers: nobody in the squad pockets a cent.
    if (s.trait === 'bookkeepers' && c.pocketed > pre.pocketed) {
      b.funds += c.pocketed - pre.pocketed;
      c.pocketed = pre.pocketed;
    }
    if (pre.squad !== s.id) return;
    // ---- the squad job (Part 10 §7) ----
    const task = taskById(c.lastTask ?? c.task);
    const ok = c.last === 'success' || c.last === 'big';
    const fam = task ? familyOf(task.id) : null;
    const label = task ? (DOMINION_DATA.crew.quickLabels[task.id] ?? task.name) : '';
    if (s.trait === 'ghost-shift' && b.heat > pre.heat) b.heat = pre.heat;
    let income = b.funds - pre.funds;
    if (income > 0 && s.trait === 'shopkeepers' && fam === 'front') {
      const more = Math.round((income * T('shopkeepers')) / 100);
      b.funds += more;
      b.earned += more;
      income += more;
    }
    n.say('crew', L('job', { squad: s.codeName, task: label }));
    if (income > 0 && s.incentive === 'cut') {
      const kept = Math.round((income * N('cutKeepPct')) / 100);
      b.funds -= kept;
      n.say('money', L('cut', { squad: s.codeName, amount: income, kept }));
    }
    // Everyone's Fatigue rises by 10, not 15 (they share the load); followers get XP and task XP.
    const tire = s.trait === 'night-owls' ? T('nightOwls') : N('fatigue');
    if (task?.effect?.kind !== 'rest') c.fatigue = clamp(c.fatigue - R().fatiguePerJob + tire);
    const fxp = NA('followerXp')[ok ? 1 : 0] ?? 1;
    const promo = s.incentive === 'promotion';
    const extra = (base: number): number => (promo ? Math.ceil((base * N('promoXpPct')) / 100) : 0) + (s.trait === 'drill-sergeants' ? T('drill') : 0);
    addXp(m, extra(R().doneXp + (ok ? R().successXp : 0)), n.lines);
    for (const id of pre.followers) {
      const f = memberById(b, id);
      if (!f) continue;
      const fc = mc(f);
      fc.lastTask = task?.id ?? fc.lastTask;
      fc.last = ok ? 'success' : 'fail';
      if (task?.effect?.kind !== 'rest') fc.fatigue = clamp(fc.fatigue + tire);
      fc.worked += 1;
      if (fam) fc.tally[fam] = (fc.tally[fam] ?? 0) + 1;
      if (task) fc.taskXp[task.id] = (fc.taskXp[task.id] ?? 0) + (ok ? 2 : 1);
      addXp(f, fxp + extra(fxp), n.lines);
    }
    // The record and Cohesion (Part 10 §5).
    s.record.jobs += 1;
    if (ok) s.record.wins += 1;
    else s.record.losses += 1;
    if (c.out?.why === 'hurt') s.record.hurt += 1;
    if (fam) s.record.fam[fam] = (s.record.fam[fam] ?? 0) + 1;
    const up = Q().cohesion.up;
    let gain = up.job * growth(b, s);
    if (ok && pre.odds < N('longShot')) {
      gain += up.longShot;
      n.say('crew', L('longShot', { squad: s.codeName, odds: pre.odds, n: up.longShot }));
      legend(b, s, `Pulled off ${label} at ${pre.odds}%.`);
    }
    cohere(b, s, gain, n.lines);
  },
});

/** Cohesion growth speed: Brotherhood doubles it; a squad whose Group runs a different Incentive grows at half speed. */
function growth(b: DominionBlock, s: Squad): number {
  let k = s.incentive === 'brotherhood' ? N('brotherhoodGrowth') : 1;
  const g = groupOf(b, s.id);
  if (g && g.incentive !== s.incentive) k /= N('groupClashGrowth');
  return k;
}
function legend(b: DominionBlock, s: Squad, line: string): void {
  s.record.legends.push({ day: b.day, line });
  if (s.record.legends.length > 12) s.record.legends.shift();
}
/** Changes Cohesion; reaching Family offers three Squad Traits from the record (Part 10 §6). */
function cohere(b: DominionBlock, s: Squad, d: number, lines: string[] | null): void {
  const was = isFamily(s);
  s.cohesion = clamp(s.cohesion + d);
  if (!was && isFamily(s) && !s.trait && !s.offered.length) {
    s.offered = offerTraits(s);
    if (lines) lines.push(L('family', { squad: s.codeName }));
    legend(b, s, 'Became Family.');
  }
}
/** Three traits by what the squad mostly did (ties: the list's order). Old Warehouse only for a first-Warehouse squad. */
export function offerTraits(s: Squad): string[] {
  const score = (t: SquadsFile['traits'][number]): number =>
    t.warehouse ? (s.warehouse ? 1000 : -1) : t.earned.reduce((a, f) => a + (s.record.fam[f] ?? 0), 0);
  return Q().traits.map((t, i) => ({ t, i, sc: score(t) })).filter((x) => x.sc >= 0)
    .sort((a, x) => x.sc - a.sc || a.i - x.i).slice(0, 3).map((x) => x.t.id);
}

// The night's upkeep for squads (after every task): losses, demotions, punishments, new members, the week, chatter.
addCrewHook((b, seed, n) => {
  const st = b.squads;
  if (!st) return;
  const D = Q().cohesion.down;
  const ids = new Set(b.members.map((m) => m.id));
  // Members new since the last look (none counted the first time: a save from before squads).
  const fresh = st.seen.length ? b.members.filter((m) => !st.seen.includes(m.id)) : [];
  {
    for (const m of fresh) {
      if (st.list.some((s) => s.trait === 'welcome-mat')) addLoyalty(b, m, T('welcomeMat'));
      if (st.list.some((s) => s.trait === 'talkers' && s.order && familyOf(s.order) === 'recruit')) m.traitPoints += 1;
    }
  }
  st.seen = [...ids];
  st.pairs = st.pairs.filter(([a, x]) => ids.has(a) && ids.has(x));
  for (const s of st.list) {
    // Members lost: left the crew, or in a cell tonight.
    for (const id of [...s.members]) {
      const m = memberById(b, id);
      const gone = !m;
      const jailed = m && mc(m).last === 'arrested';
      if (!gone && !jailed) continue;
      const name = m?.name ?? b.crew?.gone.find((g) => g.id === id)?.name ?? id;
      cohere(b, s, D.lost, null);
      n.lines.push(L('lost', { squad: s.codeName, name, n: sgn(D.lost) }));
      if (gone) s.members = s.members.filter((x) => x !== id);
    }
    // The leader demoted (or gone): Cohesion −20; no leader fit to lead: the order stops.
    const lead = memberById(b, s.leader);
    if (lead && rankN(lead.rank) < rankN(s.leaderRank)) {
      cohere(b, s, D.demoted, null);
      n.lines.push(L('demoted', { squad: s.codeName, name: lead.name, n: sgn(D.demoted) }));
    }
    if (lead) s.leaderRank = lead.rank;
    if (!lead || !sizeFor(lead.rank)) {
      if (s.order) n.lines.push(L('leaderless', { squad: s.codeName }));
      s.order = null;
    }
    // A member punished in front of them.
    for (const id of s.members) {
      const m = memberById(b, id);
      if (!m) continue;
      const p = mc(m).treat.punish ?? 0;
      if (p > (s.punished[id] ?? 0)) {
        cohere(b, s, D.punished, null);
        n.lines.push(L('punished', { squad: s.codeName, name: m.name, n: sgn(D.punished) }));
      }
      s.punished[id] = p;
    }
    // Every night: Unbreakable's Morale floor, Lookouts' extra cooling.
    for (const id of s.members) {
      const m = memberById(b, id);
      if (!m) continue;
      if (s.trait === 'unbreakable') m.morale = Math.max(m.morale, T('unbreakable'));
      if (s.trait === 'lookouts') mc(m).pHeat = clamp(mc(m).pHeat - T('lookoutsCool'));
    }
  }
  st.list = st.list.filter((s) => s.members.length > 0);
  if (b.day % DOMINION_DATA.start.clock.weekLength === 0) weekly(b, n.lines);
  // Members talk about their squad (a line bank keyed by Cohesion).
  const r = rng(seed, 'dominion-squad', b.day, 'chatter');
  if (st.list.length && r.int(1, 100) <= N('chatterChance')) {
    const s = r.pick(st.list);
    const who = memberById(b, r.pick(s.members));
    const bank = Q().chatter[bandOf(s.cohesion).id as 'family'];
    if (who) n.lines.push(fill(r.pick(bank), { squad: s.codeName, name: who.name }));
  }
});

/** A Vengeance target is gone once a later slice flags it (`gone:<id>` in the block's flags: D9 rival Admins, D10 Gyms). */
export const targetGone = (b: DominionBlock, id: string | null): boolean => !!id && b.flags.includes(`gone:${id}`);

/** The weekly side (on the wage day): Incentive deals, matching Motives, upkeep, Dread. */
function weekly(b: DominionBlock, lines: string[]): void {
  const st = squadsOf(b);
  for (const s of st.list) {
    const inc = incentiveById(s.incentive);
    const ms = s.members.map((id) => memberById(b, id)).filter((m): m is Member => !!m);
    let allMatch = !!inc;
    for (const m of ms) {
      const match = !!inc?.fits.includes(mc(m).motive);
      if (!match) allMatch = false;
      addMorale(m, match ? N('matchMorale') : N('clashMorale'));
      if (s.incentive === 'promotion') mc(m).ambition = clamp(mc(m).ambition + N('promoAmbition'));
      if (s.incentive === 'pokemon' && b.reserve) {
        for (const mon of m.team) {
          const meta = b.reserve.meta[mon.uid];
          if (meta) meta.trust = Math.min(DOMINION_DATA.pyramid.trust.max, meta.trust + N('firstTrust'));
        }
      }
    }
    if (allMatch && ms.length) cohere(b, s, Q().cohesion.up.matchWeek * growth(b, s), lines);
    if (s.incentive === 'pokemon' && ms.length) {
      const amount = N('firstUpkeep') * ms.length;
      b.funds -= amount;
      lines.push(L('upkeep', { squad: s.codeName, amount }));
    }
    if (s.incentive === 'purse' && ms.length) {
      const amount = ms.reduce((a, m) => a + m.wage * (N('purseWageX') - 1), 0);
      b.funds -= amount;
      lines.push(L('purse', { squad: s.codeName, amount }));
    }
    const ds = b.field.districts[s.town];
    const town = DOMINION_DATA.field.districts.find((d) => d.id === s.town)?.name ?? s.town;
    const dread = (s.incentive === 'glory' ? N('gloryDread') : 0) + (s.trait === 'street-legends' ? T('streetLegends') : 0);
    if (ds && dread) {
      ds.dread += dread;
      lines.push(L('dread', { squad: s.codeName, town, n: dread }));
    }
    if (s.trait === 'money-hands') {
      const pay = b.field.rackets.filter((x) => x.district === s.town).reduce((a, x) => a + x.weekly, 0);
      const amount = Math.round((pay * T('moneyHands')) / 100);
      if (amount > 0) {
        b.funds += amount;
        b.earned += amount;
        lines.push(L('rackets', { squad: s.codeName, amount, town }));
      }
    }
    if (s.incentive === 'vengeance' && targetGone(b, s.target)) {
      for (const m of ms) addMorale(m, N('vengeanceGoneMorale'));
      lines.push(L('goneTarget', { squad: s.codeName, n: sgn(N('vengeanceGoneMorale')) }));
    }
  }
}

// ---------- task kinds: Match-Make (58) and Run a Crew (141) ----------

addTaskKind('matchMake', (b0, m0, ok0, ctx) => {
  const x = { ...ctx, b: b0, m: m0, ok: ok0 };
  const b = x.b;
  const st = squadsOf(b);
  const paired = new Set(st.pairs.flat());
  const free = b.members.filter((m) => m.id !== x.m.id && !paired.has(m.id) && !mc(m).out);
  if (free.length < 2) return x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
  // Squad-mates first: the matchmaker pairs two who already work together when they can.
  const a = x.r.pick(free);
  const mates = free.filter((m) => m.id !== a.id && squadOf(b, m.id) && squadOf(b, m.id) === squadOf(b, a.id));
  const other = x.r.pick(mates.length ? mates : free.filter((m) => m.id !== a.id));
  if (x.ok) {
    st.pairs.push([a.id, other.id]);
    if (x.lv >= 2) for (const m of [a, other]) addMorale(m, N('matchPairMorale'));
    x.say('crew', L('matched', { a: a.name, b: other.name, name: x.m.name }));
  } else {
    for (const m of [a, other]) addMorale(m, N('matchFailMorale'));
    x.say('crew', L('matchFailed', { a: a.name, b: other.name, name: x.m.name, n: sgn(N('matchFailMorale')) }));
  }
});

addTaskKind('runCrew', (b0, m0, ok0, ctx) => {
  const x = { ...ctx, b: b0, m: m0, ok: ok0 };
  const rc = runCrewOf(x.b);
  const led = rc?.exec.id === x.m.id ? rc.led : [];
  if (!x.ok || !led.length) return x.say('crew', fill(DOMINION_DATA.crew.report.fail!, { name: x.m.name, task: x.label }));
  if (x.lv >= 5) for (const id of led) {
    const m = memberById(x.b, id);
    if (m) addXp(m, 1, []);
  }
  x.say('crew', L('runCrew', { name: x.m.name, n: led.length }));
});

// ---------- the Boss's Card: Vengeance and Glory travel with the members brought along ----------

addCardHook((b, actionId, targetId, bring) => {
  if (!b.squads) return [];
  const parts: [string, number][] = [];
  const seen = new Set<string>();
  for (const id of bring) {
    const s = squadOf(b, id);
    if (!s || seen.has(s.id)) continue;
    seen.add(s.id);
    if (s.incentive === 'vengeance' && s.target && s.target === targetId && targetById(s.target)?.live) parts.push([`${s.codeName}'s Vengeance`, N('vengeanceOdds')]);
    if (s.incentive === 'glory' && /(^|-)(attack|raid)$/.test(actionId)) parts.push([`${s.codeName}'s Glory`, N('gloryOdds')]);
  }
  return parts;
});

// ---------- the Boss's orders ----------

type Out = { ok: boolean; block: DominionBlock; notice: string | null };
const no = (block: DominionBlock, notice: string | null): Out => ({ ok: false, block, notice });

/** Why the draft can't be saved, or null (Part 10 §1-§3). */
export function draftProblem(b: DominionBlock, d: SquadDraft): string | null {
  const st = squadsOf(b);
  const self = d.id ? squadById(b, d.id) : null;
  if (d.id && !self) return 'No such squad.';
  if (!self) {
    const lock = lockedWhy(b);
    if (lock) return lock;
    if (st.list.length >= squadCap(b)) return L('full', { n: st.list.length, cap: squadCap(b) });
  }
  const name = nameProblem(b, d.codeName, d.id);
  if (name) return name;
  const leader = memberById(b, d.leader);
  const size = leader ? sizeFor(leader.rank) : null;
  if (!leader || !size) return L('noLeader');
  const all = [d.leader, ...d.members.filter((x) => x !== d.leader)];
  if (new Set(all).size !== all.length) return 'Each member once.';
  for (const id of all) {
    const m = memberById(b, id);
    if (!m) return 'No such member.';
    const other = squadOf(b, id);
    if (other && other.id !== d.id) return L('taken', { name: m.name, squad: other.codeName });
  }
  if (all.length < Q().minMembers) return L('tooFew', { n: Q().minMembers });
  if (all.length > size.max) return L('tooMany', { rank: rankWord(leader.rank).toLowerCase().replace(/^./, (c) => c.toUpperCase()), n: size.max });
  const inc = incentiveById(d.incentive);
  if (!inc) return 'Pick an Incentive.';
  if (d.incentive === 'vengeance' && !targetById(d.target)) return L('needTarget');
  if (d.focus && !focusById(d.focus)) return 'No such Focus.';
  if (!Number.isInteger(d.mark) || d.mark < 0 || d.mark >= Q().marks.length) return 'Pick a Mark.';
  return null;
}

/** Forms a new squad or saves changes to one (Part 10 §1, §4, §5): joining Loyalty, swaps, a changed Incentive. */
export function saveSquad(block: DominionBlock, d: SquadDraft): Out {
  const b = structuredClone(block);
  const why = draftProblem(b, d);
  if (why) return no(block, why);
  const st = squadsOf(b);
  const leader = memberById(b, d.leader)!;
  const all = [d.leader, ...d.members.filter((x) => x !== d.leader)];
  const inc = incentiveById(d.incentive)!;
  const D = Q().cohesion.down;
  if (!st.seen.length) st.seen = b.members.map((m) => m.id);
  const joining = (s: Squad, ids: string[]): void => {
    for (const id of ids) {
      const m = memberById(b, id)!;
      if (inc.fits.includes(mc(m).motive)) addLoyalty(b, m, N('matchLoyalty'));
      if (s.incentive === 'purse') addMorale(m, N('purseMorale'));
      if (s.trait === 'old-warehouse') addLoyalty(b, m, T('oldWarehouse'));
      s.punished[id] = mc(m).treat.punish ?? 0;
    }
  };
  let s: Squad;
  if (!d.id) {
    s = {
      id: `sq${st.next}`, codeName: d.codeName.trim(), leader: d.leader, members: all, incentive: d.incentive, target: d.incentive === 'vengeance' ? d.target : null,
      focus: d.focus, mark: d.mark, cohesion: Q().cohesion.start, trait: null, offered: [], order: null,
      town: b.field.districts[b.field.at] ? b.field.at : DOMINION_DATA.field.hq, formed: b.day, warehouse: b.hqLevel === 1, leaderRank: leader.rank, punished: {},
      record: { jobs: 0, wins: 0, losses: 0, hurt: 0, fam: {}, legends: [{ day: b.day, line: 'Formed.' }] },
    };
    st.next += 1;
    st.list.push(s);
    joining(s, all);
    return { ok: true, block: b, notice: L('formed', { squad: s.codeName, n: all.length, leader: leader.name, incentive: inc.name }) };
  }
  s = squadById(b, d.id)!;
  const out = s.members.filter((id) => !all.includes(id));
  const added = all.filter((id) => !s.members.includes(id));
  if (out.length) cohere(b, s, D.swapped * out.length, null);
  if (d.incentive !== s.incentive) {
    cohere(b, s, D.incentive, null);
    s.incentive = d.incentive;
  }
  s.leader = d.leader;
  s.leaderRank = leader.rank;
  s.members = all;
  s.codeName = d.codeName.trim();
  s.target = d.incentive === 'vengeance' ? d.target : null;
  s.focus = d.focus;
  s.mark = d.mark;
  for (const id of out) delete s.punished[id];
  joining(s, added);
  if (s.order) for (const id of added) {
    const m = memberById(b, id)!;
    if (!mc(m).out) mc(m).task = s.order;
  }
  return { ok: true, block: b, notice: L('edited', { squad: s.codeName }) };
}

/** Breaks a squad up. A Family squad costs every member Morale −15, and one of them may quit (Part 10 §8). */
export function disband(block: DominionBlock, id: string, seed: string): Out {
  const b = structuredClone(block);
  const st = squadsOf(b);
  const s = squadById(b, id);
  if (!s) return no(block, null);
  const lines = [L('disbanded', { squad: s.codeName })];
  if (isFamily(s)) {
    lines.push(L('splitFamily', { squad: s.codeName, n: sgn(N('splitFamilyMorale')) }));
    const ms = s.members.map((x) => memberById(b, x)).filter((m): m is Member => !!m);
    for (const m of ms) addMorale(m, N('splitFamilyMorale'));
    const r = rng(seed, 'dominion-squad', b.day, s.id, 'split');
    if (ms.length && r.int(1, 100) <= N('splitQuitChance')) {
      const m = r.pick(ms);
      leave(b, m, 'quit', null, '');
      lines.push(L('splitQuit', { name: m.name }));
    }
  }
  st.list = st.list.filter((x) => x.id !== id);
  for (const g of st.groups) g.squads = g.squads.filter((x) => x !== id);
  st.groups = st.groups.filter((g) => g.squads.length > 0);
  return { ok: true, block: b, notice: lines.join(' ') };
}

/** One order for the whole squad (Part 10 §7). A squad refuses as one voice a job that crosses a member's Line. */
export function setOrder(block: DominionBlock, id: string, taskId: string | null): Out {
  const b = structuredClone(block);
  const s = squadById(b, id);
  if (!s) return no(block, null);
  if (!['morning', 'evening'].includes(b.phase)) return no(block, L('phase'));
  if (!taskId) {
    s.order = null;
    return { ok: true, block: b, notice: L('cleared', { squad: s.codeName }) };
  }
  const task = taskById(taskId);
  const leader = memberById(b, s.leader);
  if (!task || !leader) return no(block, null);
  if (!sizeFor(leader.rank)) return no(block, L('leaderless', { squad: s.codeName }));
  const why = cantTake(leader, task);
  if (why) return no(block, why);
  if (!['fear', 'purse'].includes(s.incentive)) {
    const liner = s.members.map((x) => memberById(b, x)).find((m) => m && mc(m).line.includes(taskId));
    if (liner) return no(block, L('refuse', { squad: s.codeName, name: liner.name, them: liner.gender === 'f' ? 'her' : 'him' }));
  }
  s.order = taskId;
  for (const mid of s.members) {
    const m = memberById(b, mid);
    if (!m || mc(m).out) continue;
    if (mc(m).task !== taskId) {
      mc(m).task = taskId;
      mc(m).setDay = b.day;
    }
  }
  const o = squadOdds(b, s, taskId) ?? 0;
  const label = DOMINION_DATA.crew.quickLabels[task.id] ?? task.name;
  return { ok: true, block: b, notice: L('order', { squad: s.codeName, task: label, odds: o }) };
}

/** Picks the Squad Trait at Family from the three offered. */
export function chooseTrait(block: DominionBlock, id: string, trait: string): Out {
  const b = structuredClone(block);
  const s = squadById(b, id);
  if (!s || !s.offered.includes(trait) || s.trait) return no(block, null);
  s.trait = trait;
  s.offered = [];
  if (trait === 'old-warehouse') for (const mid of s.members) {
    const m = memberById(b, mid);
    if (m) addLoyalty(b, m, T('oldWarehouse'));
  }
  const t = traitById(trait)!;
  legend(b, s, `Earned ${t.name}.`);
  return { ok: true, block: b, notice: L('trait', { squad: s.codeName, trait: t.name }) };
}

/** The Boss bailing a squad member out counts as a rescue of one of their own (Cohesion +15). */
export function rescued(b: DominionBlock, memberId: string): string | null {
  const s = b.squads ? squadOf(b, memberId) : undefined;
  const m = memberById(b, memberId);
  if (!s || !m) return null;
  const up = Q().cohesion.up.rescue * growth(b, s);
  cohere(b, s, up, null);
  return L('rescued', { squad: s.codeName, name: m.name, n: up });
}

// ---------- Groups (Part 10 §2) ----------

export function groupProblem(b: DominionBlock, d: GroupDraft): string | null {
  const st = squadsOf(b);
  if (d.id && !st.groups.some((g) => g.id === d.id)) return 'No such group.';
  const name = nameProblem(b, d.codeName, d.id);
  if (name) return name;
  const leader = memberById(b, d.leader);
  const kind = leader ? groupKindFor(leader.rank) : null;
  if (!leader || !kind) return L('groupLeader');
  if (st.groups.some((g) => g.id !== d.id && g.leader === d.leader)) return `${leader.name} already leads a Group.`;
  if (new Set(d.squads).size !== d.squads.length || d.squads.length < kind.min || d.squads.length > kind.max) return L('groupSize', { min: kind.min, max: kind.max });
  for (const id of d.squads) {
    const s = squadById(b, id);
    if (!s) return 'No such squad.';
    const g = groupOf(b, id);
    if (g && g.id !== d.id) return L('inGroup', { squad: s.codeName, group: g.codeName });
  }
  if (!incentiveById(d.incentive)) return 'Pick an Incentive.';
  return null;
}

export function saveGroup(block: DominionBlock, d: GroupDraft): Out {
  const b = structuredClone(block);
  const why = groupProblem(b, d);
  if (why) return no(block, why);
  const st = squadsOf(b);
  const leader = memberById(b, d.leader)!;
  const g = d.id ? st.groups.find((x) => x.id === d.id)! : { id: `gr${st.next++}`, codeName: '', leader: '', incentive: '', squads: [], order: null, mark: 0 };
  Object.assign(g, { codeName: d.codeName.trim(), leader: d.leader, squads: [...d.squads], incentive: d.incentive });
  if (!d.id) st.groups.push(g);
  if (incentiveById(d.incentive)!.fits.includes(mc(leader).motive) && !d.id) addLoyalty(b, leader, N('matchLoyalty'));
  return { ok: true, block: b, notice: d.id ? L('edited', { squad: g.codeName }) : L('groupFormed', { group: g.codeName, n: g.squads.length, leader: leader.name }) };
}

export function disbandGroup(block: DominionBlock, id: string): Out {
  const b = structuredClone(block);
  const st = squadsOf(b);
  const g = st.groups.find((x) => x.id === id);
  if (!g) return no(block, null);
  st.groups = st.groups.filter((x) => x.id !== id);
  return { ok: true, block: b, notice: L('groupDisbanded', { group: g.codeName }) };
}

/** One order for every squad in the Group; a squad that refuses keeps its own task. */
export function groupOrder(block: DominionBlock, id: string, taskId: string | null): Out {
  const g = block.squads?.groups.find((x) => x.id === id);
  if (!g) return no(block, null);
  let b = block;
  const notes: string[] = [];
  for (const sid of g.squads) {
    const out = setOrder(b, sid, taskId);
    if (out.ok) b = out.block;
    else if (out.notice) notes.push(out.notice);
  }
  if (b === block) return no(block, notes.join(' ') || null);
  const task = taskId ? taskById(taskId) : null;
  b.squads!.groups.find((x) => x.id === id)!.order = taskId;
  const head = task ? L('orderGroup', { group: g.codeName, task: DOMINION_DATA.crew.quickLabels[task.id] ?? task.name }) : L('cleared', { squad: g.codeName });
  return { ok: true, block: b, notice: [head, ...notes].join(' ') };
}

/** The clock's entry for the D8 actions (block only). Null for any other action. */
export function squadStep(block: DominionBlock, a: DominionAction, seed: string): Out | null {
  switch (a.t) {
    case 'squadSave': return saveSquad(block, a.draft);
    case 'squadDisband': return disband(block, a.squad, seed);
    case 'squadOrder': return setOrder(block, a.squad, a.task);
    case 'squadTrait': return chooseTrait(block, a.squad, a.trait);
    case 'groupSave': return saveGroup(block, a.draft);
    case 'groupDisband': return disbandGroup(block, a.group);
    case 'groupOrder': return groupOrder(block, a.group, a.task);
    default: return null;
  }
}
