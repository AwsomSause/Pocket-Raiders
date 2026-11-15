// Catalog Overhaul Pack, families-c (STORY_FAMILIES 9 and 10): small event pieces the pack's scripts need and the event engine lacked.
// Pure and deterministic: nothing here rolls dice except where it is handed the event's own Rng. No save change: everything is kept
// in `run.story.flags` (`ev:<key>` numbers, like the `flag` effect; `co:<key>` strings for the Time Machine).
// Guide: docs/status/co-families-c.md.

import data from '../../data/catalogOverhaul/familiesC.json';
import type { Content, EventCondition, EventEffect } from '../contentSchema';
import { getSpecies, maxHp } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';

const RULES: { multiplier: { veryBad: number; bad: number; even: number; favours: number }; words: Record<string, string> } = data.rules;
type Run = RunState;
const num = (run: Pick<Run, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const put = (run: Run, key: string, value: number): void => { run.story.flags[`ev:${key}`] = Math.max(0, Math.round(value)); };
const nameOf = (content: Content, mon: PokemonInstance | undefined): string => (mon ? mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId) : 'your partner');
const uses = (mon: PokemonInstance): number => Object.values(mon.moveCounts ?? {}).reduce((s, n) => s + n, 0);

// ---------- the record (SF83 The Watchers) ----------

/** Pack Reputation: `rep` counts up, `rep-lost` counts down; kindness is `kind-total`; a kept find is any `honest-kept-*` flag. */
export function recordOf(run: Pick<Run, 'story'>): 'high' | 'middle' | 'low' {
  const rep = num(run, 'rep') - num(run, 'rep-lost');
  const kept = Object.keys(run.story.flags).some((k) => k.startsWith('ev:honest-kept') && Number(run.story.flags[k] ?? 0) > 0);
  if (rep <= -2 || kept) return 'low';
  if (rep >= 3 || num(run, 'kind-total') >= 5) return 'high';
  return 'middle';
}

// ---------- party reads ----------

/** The party Pokémon that has used the fewest moves this run (ties: the later slot, which is the one sent out least). */
export function leastUsed(run: Pick<Run, 'party'>): PokemonInstance | undefined {
  return run.party.reduce<PokemonInstance | undefined>((best, m) => (!best || uses(m) <= uses(best) ? m : best), undefined);
}
/** The party Pokémon that has used the most moves this run (ties: the earlier slot). */
export function mostUsed(run: Pick<Run, 'party'>): PokemonInstance | undefined {
  return run.party.reduce<PokemonInstance | undefined>((best, m) => (!best || uses(m) > uses(best) ? m : best), undefined);
}
/** SF62: the party Pokémon the Ditto copied. Seeded by the run and the stage, so a reload gives the same answer. */
export function impostorTarget(run: Pick<Run, 'party' | 'seed' | 'regionIndex' | 'stage'>): PokemonInstance | undefined {
  if (run.party.length === 0) return undefined;
  return run.party[new Rng(hashSeed(`${run.seed}::co-impostor::${run.regionIndex}::${run.stage?.index ?? 0}`)).int(0, run.party.length - 1)];
}

/** Fills {lead} {starter} {most} {least} {impostorType} and {flag:<key>} (a run flag's number, 0 when unset) in an event's text. Unknown tokens are left alone (other families fill their own). */
export function fillCoText(content: Content, run: Run, text: string): string {
  if (!text.includes('{')) return text;
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  const starter = run.party.find((m) => m.uid === run.log.starterUid) ?? lead;
  const imp = impostorTarget(run);
  const table: Record<string, () => string> = {
    lead: () => nameOf(content, lead),
    starter: () => nameOf(content, starter),
    most: () => nameOf(content, mostUsed(run)),
    least: () => nameOf(content, leastUsed(run)),
    impostorType: () => (imp ? getSpecies(content, imp.speciesId).types[0]! : 'normal'),
  };
  return text.replace(/\{(lead|starter|most|least|impostorType)\}/g, (_, k: string) => table[k]!()).replace(/\{flag:([a-z][a-z0-9-]*)\}/g, (_, k: string) => String(num(run, k)));
}

// ---------- SF72 rule battles: "How bad is it for me?" ----------

const half = (run: Pick<Run, 'party'>, test: (m: PokemonInstance) => boolean): boolean => run.party.filter(test).length * 2 >= Math.max(1, run.party.length);
const avg = (run: Pick<Run, 'party'>, of: (m: PokemonInstance) => number): number => run.party.reduce((s, m) => s + of(m), 0) / Math.max(1, run.party.length);

/** One fact about the team, by name. Facts are about species, moves, levels and party order, never HP, so the read is the same before and after the fight. */
export function teamFact(content: Content, run: Pick<Run, 'party'>, fact: string): boolean {
  const [name, arg] = fact.split(':') as [string, string | undefined];
  const sp = (m: PokemonInstance) => getSpecies(content, m.speciesId);
  const moves = (m: PokemonInstance) => m.moves.map((s) => content.moves.get(s.id)).filter((x) => !!x);
  const levels = run.party.map((m) => m.level);
  switch (name) {
    case 'type': return half(run, (m) => sp(m).types.includes(arg as never));
    case 'anyType': return run.party.some((m) => sp(m).types.includes(arg as never));
    case 'moveType': return half(run, (m) => moves(m).some((v) => v!.type === arg && v!.category !== 'status'));
    case 'anyMoveType': return run.party.some((m) => moves(m).some((v) => v!.type === arg && v!.category !== 'status'));
    case 'status': return half(run, (m) => moves(m).some((v) => v!.category === 'status'));
    case 'noStatus': return !half(run, (m) => moves(m).some((v) => v!.category === 'status'));
    case 'slow': return avg(run, (m) => sp(m).baseStats.spe) < 65;
    case 'fast': return avg(run, (m) => sp(m).baseStats.spe) >= 90;
    case 'physical': return half(run, (m) => sp(m).baseStats.atk > sp(m).baseStats.spa);
    case 'special': return half(run, (m) => sp(m).baseStats.spa > sp(m).baseStats.atk);
    case 'frail': return avg(run, (m) => sp(m).baseStats.hp + sp(m).baseStats.def + sp(m).baseStats.spd) < 210;
    case 'bulky': return avg(run, (m) => sp(m).baseStats.hp + sp(m).baseStats.def + sp(m).baseStats.spd) > 270;
    case 'small': return run.party.length < 3;
    case 'full': return run.party.length >= 5;
    case 'lastWeak': return run.party.length > 1 && levels[levels.length - 1]! < Math.max(...levels) && levels[levels.length - 1] === Math.min(...levels);
    case 'lastStrong': return run.party.length > 1 && levels[levels.length - 1] === Math.max(...levels) && Math.min(...levels) < Math.max(...levels);
    default: return false;
  }
}
export const TEAM_FACT = /^(type|anyType|moveType|anyMoveType):[a-z]+$|^(status|noStatus|slow|fast|physical|special|frail|bulky|small|full|lastWeak|lastStrong)$/;

/** The prize multiplier of a rule battle: ×2 very bad, ×1.5 bad, ×1 neutral, ×0.75 when the rule favours the player. */
export function ruleMultiplier(content: Content, run: Pick<Run, 'party'>, bad: readonly string[], good: readonly string[]): number {
  const score = bad.filter((f) => teamFact(content, run, f)).length - good.filter((f) => teamFact(content, run, f)).length;
  return score >= 2 ? RULES.multiplier.veryBad : score === 1 ? RULES.multiplier.bad : score === 0 ? RULES.multiplier.even : RULES.multiplier.favours;
}

// ---------- the Time Machine (FE4): one battle as its Paradox counterpart ----------

const PAST: Record<string, string> = data.paradox.past;
const FUTURE: Record<string, string> = data.paradox.future;
const MACHINE = 'co:machine';

/** The counterpart the ring would show for this species, or null ("Some things were always like that"). */
export function paradoxOf(content: Content, speciesId: string, era: 'past' | 'future'): string | null {
  const to = (era === 'past' ? PAST : FUTURE)[speciesId];
  return to && content.species.has(to) ? to : null;
}
function enterMachine(content: Content, run: Run, era: 'past' | 'future'): string {
  restoreMachine(content, run);
  const mon = run.party.find((m) => m.hp > 0);
  const to = mon ? paradoxOf(content, mon.speciesId, era) : null;
  if (!mon || !to) return `${nameOf(content, mon)} comes out exactly the same`;
  const share = mon.hp / maxHp(content, mon);
  run.story.flags[MACHINE] = `${mon.uid}|${mon.speciesId}`;
  const was = nameOf(content, mon);
  mon.speciesId = to;
  mon.hp = Math.max(1, Math.round(maxHp(content, mon) * share));
  return `${was} steps out as ${getSpecies(content, to).name}, for one battle`;
}
/** Time is elastic: the changed Pokémon snaps back (after the test battle, and as a safety net on the next step of the map). */
export function restoreMachine(content: Content, run: Run): boolean {
  const held = run.story.flags[MACHINE];
  if (typeof held !== 'string' || !held.includes('|')) return false;
  delete run.story.flags[MACHINE];
  const [uid, speciesId] = held.split('|') as [string, string];
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon || !content.species.has(speciesId)) return false;
  const share = mon.hp / maxHp(content, mon);
  mon.speciesId = speciesId;
  mon.hp = mon.hp <= 0 ? 0 : Math.max(1, Math.round(maxHp(content, mon) * share));
  return true;
}

// ---------- conditions and effects ----------

export type CoCondition = Extract<EventCondition, { kind: 'record' }>;
export const coConditionMet = (run: Run, c: CoCondition): boolean => recordOf(run) === c.is;
export const coConditionText = (c: CoCondition): string => (c.is === 'low' ? 'Only if the road thinks badly of you' : c.is === 'high' ? 'Needs a good name on this road' : 'Needs an ordinary name on this road');

export type CoEffect = Extract<EventEffect, { kind: 'ruleRead' | 'rulePrize' | 'pickTest' | 'timeMachine' }>;
export function coEffectWords(e: CoEffect): string {
  switch (e.kind) {
    case 'ruleRead': return e.store ? '' : 'the game reads your team';
    case 'rulePrize': return `prize money (₽${e.amount} × the rule's multiplier)`;
    case 'pickTest': return '';
    case 'timeMachine': return `your lead steps into the ${e.era}`;
  }
}

/** Applies one of this file's effects. `pickedUid` is the party Pokémon the player pointed at (a `pick` choice). Returns the change in words. */
export function applyCoEffect(content: Content, run: Run, e: CoEffect, pickedUid?: string): string {
  switch (e.kind) {
    case 'ruleRead': {
      const mult = ruleMultiplier(content, run, e.bad, e.good);
      put(run, e.key, mult * 100);
      return e.store ? '' : `${RULES.words[String(mult)]} (₽${Math.round(e.prize * mult)})`;
    }
    case 'rulePrize': {
      const mult = (num(run, e.key) || 100) / 100;
      const amount = Math.round(e.amount * mult);
      run.money += amount;
      put(run, e.key, 0);
      return `+₽${amount}${mult !== 1 ? ` (prize ×${mult})` : ''}`;
    }
    case 'pickTest': {
      const picked = run.party.find((m) => m.uid === pickedUid);
      const right = e.test === 'leastUsed' ? leastUsed(run) : impostorTarget(run);
      // Least used: any Pokémon tied for the fewest moves is a true answer.
      const pass = !!picked && !!right && (e.test === 'leastUsed' ? uses(picked) === uses(right) : picked.uid === right.uid);
      put(run, pass ? e.pass : e.fail, num(run, pass ? e.pass : e.fail) + 1);
      if (!pass && picked && e.sulk > 0) picked.friendship = Math.max(0, picked.friendship - e.sulk);
      return picked ? `You point at ${nameOf(content, picked)}` : '';
    }
    case 'timeMachine':
      return enterMachine(content, run, e.era);
  }
}

// ---------- hooks (run.ts) ----------

const IDOL = data.idol;
export const idolCurse = (run: Pick<Run, 'story'>): number => (num(run, 'idol-carried') > 0 ? num(run, 'idol-curse') : 0);

/** A new stage starts. SF74: the carried idol pays ₽300 and its Curse grows by 1. SF85: the Oath of Speed's rest count starts again. */
export function coStageStart(run: Run): void {
  put(run, 'oath-rests', 0);
  if (num(run, 'idol-carried') <= 0) return;
  run.money += IDOL.money;
  put(run, 'idol-curse', num(run, 'idol-curse') + 1);
  put(run, 'idol-paid', num(run, 'idol-paid') + IDOL.money);
}

/** A battle begins. SF74, Curse 3: the Pokémon sent out starts 10% of its HP down (never below 1). */
export function coBattleBegin(content: Content, run: Run): void {
  if (idolCurse(run) < IDOL.hpCurse || !run.battle) return;
  const mon = run.party[run.battle.activeIndex] ?? run.party.find((m) => m.hp > 0);
  if (mon && mon.hp > 1) mon.hp = Math.max(1, mon.hp - Math.ceil(maxHp(content, mon) * IDOL.hpShare));
}

/** A healing stop was used (`before` = HP before it). SF74, Curse 5: it heals 25% less. SF85: a second rest in one stage breaks the Oath of Speed. */
export function coHealStop(content: Content, run: Run, before: readonly number[]): void {
  put(run, 'oath-rests', num(run, 'oath-rests') + 1);
  if (num(run, 'oath-speed') > 0 && num(run, 'oath-rests') >= 2) put(run, 'oath-broken', 1);
  if (idolCurse(run) < IDOL.restCurse) return;
  run.party.forEach((m, i) => {
    const was = before[i] ?? 0;
    if (m.hp > was) m.hp = Math.max(was, Math.min(m.hp, was + Math.floor((maxHp(content, m) - was) * IDOL.restShare)));
  });
}

/** The player fled a battle: breaks the Oath of Steel (SF85). */
export function coFled(run: Run): void {
  if (num(run, 'oath-steel') > 0) put(run, 'oath-broken', 1);
}
/** A wild Pokémon was knocked out while a Ball was in the bag (it could have been caught): breaks the Oath of Mercy (SF85). */
export function coWildKo(run: Run): void {
  const ball = Object.keys(run.inventory).some((id) => id.endsWith('-ball') && (run.inventory[id] ?? 0) > 0);
  if (ball && num(run, 'oath-mercy') > 0) put(run, 'oath-broken', 1);
}

/** One step on the map. The Time Machine's safety net, and FE2: the kept Sealed Letter glows the first time the whole party is under 25% HP. Returns an event id to open beside this node, or null. */
export function coNodeEnter(content: Content, run: Run): string | null {
  restoreMachine(content, run);
  if (num(run, 'letter-kept') > 0 && num(run, 'letter-glow') === 0 && run.party.length > 0) {
    const hp = run.party.reduce((s, m) => s + Math.max(0, m.hp), 0);
    const max = run.party.reduce((s, m) => s + maxHp(content, m), 0);
    if (hp * 4 < max) {
      put(run, 'letter-glow', 1);
      return 'rk-sealed-letter-open';
    }
  }
  return null;
}
