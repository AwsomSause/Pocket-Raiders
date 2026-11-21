// DOMINION D17: the balance simulator's player (`npm run sim:evil`). It plays a Dominion run day by day with a simple
// policy through the same `stepInRun` a person's keys go through, so it finds the economy that goes broke on day 9
// before a person has to. It isn't a playtest: it never reads a screen, answers every question with its first choice,
// and settles fights with a coin weighted by `win` (its own stream, `dominion-sim::<seed>`, never a gameplay stream).

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { STANDARD_CHOICE } from '../rules';
import { chooseStarter, createRun } from '../run';
import type { RunState } from '../state';
import { DOMINION_DATA, useRegion } from './data';
import { actionDef, card, playOf } from './field';
import { endDominionFight } from './fightEnd';
import { runDay } from './regions';
import type { DominionAction, DominionBlock } from './schema';
import { DOMINION_MODE_ID, fightInRun, startInRun, stepInRun } from './session';

export type SimPolicy = 'earner' | 'crew' | 'mix';
export const SIM_POLICIES: SimPolicy[] = ['earner', 'crew', 'mix'];

export interface SimDay { day: number; funds: number; heat: number; members: number; peak: number }
export interface SimResult {
  policy: SimPolicy; seed: string; days: SimDay[];
  acts: number; fights: number; won: number; broke: number; collapses: number; lowest: number;
  stuck: string | null; taken: boolean; hired: number; gone: number; why: Record<string, number>;
}

const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
/** Answers that clear whatever the run waits on (talks, street meetings, the Chair, cards, the Hero, the police). */
const UNSTICK: DominionAction[] = [
  { t: 'talk', choice: 0 }, { t: 'townMeet', choice: 0 }, { t: 'meet', choice: 0 }, { t: 'court', choice: 0 }, { t: 'courtNext' }, { t: 'closeDoors' },
  { t: 'card', index: 0, choice: 0 }, { t: 'interrupt', how: 'fight' }, { t: 'released' }, { t: 'jobCaught', choice: 'leave' }, { t: 'after', how: 'leave' },
  { t: 'debateDone' }, { t: 'walkOut' }, { t: 'sStop' }, { t: 'spyDrop' },
];

export function simRun(content: Content, seed: string, policy: SimPolicy, days: number, win = 0.65): SimResult {
  const rng = new Rng(hashSeed(`dominion-sim::${seed}`));
  const res: SimResult = { policy, seed, days: [], acts: 0, fights: 0, won: 0, broke: 0, collapses: 0, lowest: 0, stuck: null, taken: false, hired: 0, gone: 0, why: {} };
  let run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const allowed = DOMINION_DATA.start.types.allowed;
  const k = Math.floor(new Rng(hashSeed(`dominion-sim-types::${seed}`)).float() * allowed.length);
  const pair: [string, string] = [allowed[k]!, allowed[(k + 7) % allowed.length]!];
  const st = startInRun(content, run, { types: pair, member: 'grunt', look: 0 });
  if (st.problem) return { ...res, stuck: st.problem };
  run = st.run;
  let lastNote: string | null = null;
  const step = (a: DominionAction): boolean => {
    const out = stepInRun(content, run, a);
    if (!out.ok) {
      lastNote = out.notice;
      return false;
    }
    run = out.run;
    if (out.fight || blk(run).field.fight) fight();
    return true;
  };
  const fight = (): void => {
    const f = blk(run).field.fight;
    if (!f) return;
    const begun = fightInRun(content, run);
    if (!begun) return;
    const won = rng.float() < win;
    res.fights += 1;
    if (won) res.won += 1;
    const out = structuredClone(begun);
    endDominionFight(content, out, won ? 'win' : 'lose');
    run = out;
  };
  /** A two-answer question (a talk, the Chair's visitor): the answer that keeps more crew, then more money. */
  const better = (t: 'talk' | 'court'): boolean => {
    const score = (r: RunState): number => blk(r).members.length * 10_000 + blk(r).funds;
    const tries = [0, 1].map((choice) => stepInRun(content, run, { t, choice } as DominionAction)).filter((o) => o.ok);
    if (!tries.length) return false;
    const best = tries.reduce((x, y) => (score(y.run) > score(x.run) ? y : x));
    run = best.run;
    if (best.fight || blk(run).field.fight) fight();
    return true;
  };
  const unstick = (): boolean => better('talk') || better('court') || UNSTICK.some((a) => step(a));
  step({ t: 'open' });
  let guard = 0;
  while (runDay(blk(run)) <= days && guard++ < days * 80) {
    const b = blk(run);
    useRegion(b);
    if (b.takeover?.taken) {
      res.taken = true;
      break;
    }
    let ok = false;
    if (b.phase === 'morning') {
      // Everyone hires when there's room and ₽1,500 spare (the first one on the hire list).
      if (b.members.length < b.rosterCap && b.funds > 1500 && step({ t: 'hire', index: 0 })) res.hired += 1;
      // An HQ upgrade once it costs under a third of the money (more crew, more rooms).
      if (b.funds > 3 * upgradeCost(b)) step({ t: 'upgrade' });
      if (policy !== 'earner') assignCrew(blk(run), policy, step);
      ok = step({ t: 'toDay' });
    } else if (b.phase === 'day') {
      const pick = b.actions > 0 && policy !== 'crew' ? bestAct(run) : null;
      ok = pick ? step({ t: 'act', ...pick, bring: [] }) : false;
      if (ok) res.acts += 1;
      else ok = step({ t: 'endDay' });
    } else if (b.phase === 'evening') ok = step({ t: 'toNight' });
    else if (b.phase === 'night') {
      const before = runDay(b);
      ok = step({ t: 'rest' }) || step({ t: 'skipNight' });
      if (ok && runDay(blk(run)) !== before) note(res, blk(run));
    }
    if (!ok && !unstick()) {
      res.stuck = `${b.phase} day ${b.day}: ${lastNote ?? 'nothing to do'}`;
      break;
    }
  }
  return res;
}

/** What the next HQ level costs (hq.json), or Infinity at the top. */
function upgradeCost(b: DominionBlock): number {
  const next = DOMINION_DATA.hq.levels.find((l) => l.lv === b.hqLevel + 1);
  return next?.cost ?? Infinity;
}

function note(res: SimResult, b: DominionBlock): void {
  res.days.push({ day: runDay(b), funds: b.funds, heat: b.heat, members: b.members.length, peak: b.empire?.peak ?? 0 });
  if (b.funds < 0) res.broke += 1;
  res.lowest = Math.min(res.lowest, b.funds);
  res.collapses = b.annals?.falls ?? 0;
  res.gone = b.crew?.gone.length ?? 0;
  res.why = {};
  for (const g of b.crew?.gone ?? []) res.why[g.why] = (res.why[g.why] ?? 0) + 1;
}

/** The best paying Day action where the Boss stands (or one hop of travel), weighed by odds and Heat. */
function bestAct(run: RunState): { action: string; target: string | null; district: string } | null {
  const b = blk(run);
  const F = DOMINION_DATA.field;
  const here = b.field.at;
  const district = F.districts.find((d) => d.id === here);
  if (!district) return null;
  let best: { action: string; target: string | null; district: string; score: number } | null = null;
  for (const id of Object.keys(F.play)) {
    const p = playOf(id)!, def = actionDef(id);
    if (!def || def.slot !== 'day' || !p.pay || p.battle?.on === 'always') continue;
    for (const t of [null, ...district.targets.map((x) => x.id)]) {
      const c = card(b, run, id, t, here);
      if (!c || c.blocked || c.cost > b.actions) continue;
      const pay = c.pay ? (c.pay[0] + c.pay[1]) / 2 : 0;
      const score = (pay * (c.roll ? c.chance : 100)) / 100 - c.heat * 40 - c.failHeat * (100 - c.chance) * 0.2;
      if (!best || score > best.score) best = { action: id, target: t, district: here, score };
      if (!p.kinds) break;
    }
  }
  return best && best.score > 0 ? { action: best.action, target: best.target, district: best.district } : null;
}

/** Morning: every free member on the first quick task that pays (crew) or alternating pay and training (mix). */
function assignCrew(b: DominionBlock, policy: SimPolicy, step: (a: DominionAction) => boolean): void {
  const quick = DOMINION_DATA.crew.quick;
  b.members.forEach((m, i) => {
    if (m.crew?.out) return;
    const order = policy === 'mix' && i % 2 ? ['train', ...quick] : quick;
    for (const task of order) if (task !== 'rest' && step({ t: 'assign', member: m.id, task })) return;
  });
}
