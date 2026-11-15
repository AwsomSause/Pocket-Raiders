// Catalog Overhaul, families-c: the SF72 rule battles' rules the engine lacked (STORY_FAMILIES_9.md, "Rule Battles").
// Every rule applies to both sides, as the pack says. Nothing here draws a gameplay random number: the rules that need
// chance (a random turn order, a random weather, a disguise) use a hash of the battle's own uids and turn, so the same
// battle plays the same way after a reload. Hooks live in engine.ts (search "coRules").

import data from '../../data/catalogOverhaul/familiesC.json';
import type { Content, TypeName } from '../contentSchema';
import { fnv1a } from '../expansion/hash';
import { getSpecies, maxHp } from '../pokemon';
import type { BattleState, PokemonInstance, Stages, Volatile } from '../state';
import type { BattleEvent, Side } from './engine';

type Battle = BattleState;
type Fighter = { side: Side; mon: PokemonInstance; stages: Stages; vol: Volatile };
const DECOYS: string[] = data.ruleBattles.decoys;
const rule = (battle: Battle) => battle.eventRule;
const once = (battle: Battle, key: string): boolean => {
  if (battle.storyEffects.includes(key)) return false;
  battle.storyEffects.push(key);
  return true;
};

/** Beginner's Luck: every critical-hit chance is multiplied (both sides). */
export const coCritMult = (battle: Battle): number => rule(battle)?.critMult ?? 1;
/** Duel on the Train: every critical-hit chance gains this much (both sides). */
export const coCritBonus = (battle: Battle): number => rule(battle)?.critBonus ?? 0;
/** Beginner's Luck: all damage is this much of normal (both sides). */
export const coDamageMult = (battle: Battle): number => rule(battle)?.damageMult ?? 1;

/** Night Shift Guards: the accuracy rule leaves these types alone (Dark and Ghost see in the dark). */
export function coAccuracyExempt(content: Content, battle: Battle, mon: PokemonInstance): boolean {
  const exempt = rule(battle)?.accuracyExempt;
  return !!exempt && getSpecies(content, mon.speciesId).types.some((t) => exempt.includes(t as TypeName));
}

/** Roofer Jax: Pokémon of this type are faster (both sides). */
export function coSpeedMult(content: Content, battle: Battle, mon: PokemonInstance): number {
  const ts = rule(battle)?.typeSpeed;
  return ts && getSpecies(content, mon.speciesId).types.includes(ts.type) ? ts.mult : 1;
}

/**
 * Turn order the rule forces, or null. Slippery Slope: random every turn (a hash, no dice). Dance-off and the bike race:
 * the winner's side moves first on turn one.
 */
export function coForcedOrder(battle: Battle, player: PokemonInstance, enemy: PokemonInstance): Side | null {
  const r = rule(battle);
  if (!r) return null;
  if (r.firstMover && battle.turn <= 1) return r.firstMover;
  if (r.randomOrder) return (fnv1a(`${player.uid}|${enemy.uid}|order|${battle.turn}`) & 1) === 0 ? 'player' : 'enemy';
  return null;
}

/** Blindfold Bout and the Magician: the foe cannot read your Pokémon until it has acted once, so it picks blind. */
export const coBlind = (battle: Battle): boolean => !!rule(battle)?.blindBoth && !battle.playerVolatile?.lastMove;

/** A Pokémon came in. Bodybuilder Beach and Stage Fright: stat stages on every entry. Sleepwalker: every Pokémon dozes one turn. Magician: each foe wears a new disguise. */
export function coEntry(content: Content, battle: Battle, c: Fighter, events: BattleEvent[]): void {
  const r = rule(battle);
  if (!r || c.mon.hp <= 0) return;
  for (const [stat, n] of Object.entries(r.entryStages ?? {}) as [keyof Stages, number][]) {
    const before = c.stages[stat] ?? 0;
    const after = Math.max(-6, Math.min(6, before + n));
    if (after === before) continue;
    c.stages[stat] = after;
    events.push({ type: 'stat', side: c.side, stat, change: after - before } as BattleEvent);
  }
  if (r.entrySleep && !c.mon.status && once(battle, `co-doze@${c.mon.uid}`)) {
    c.mon.status = { id: 'slp', turns: 1 };
    events.push({ type: 'raid', tone: 'info', text: `${getSpecies(content, c.mon.speciesId).name} is sleepwalking!` });
  }
  if (r.decoyFoe === '*' && c.side === 'enemy') disguise(battle, c.mon);
}

function disguise(battle: Battle, mon: PokemonInstance): void {
  const pool = DECOYS.filter((id) => id !== mon.speciesId);
  if (pool.length === 0) return;
  // The rule object is shared with the event's data: give the battle its own copy before changing it.
  battle.eventRule = { ...battle.eventRule!, decoyFoe: pool[fnv1a(`${mon.uid}|decoy`) % pool.length]! };
}

/** The battle starts: the first random weather, and the first disguise. */
export function coStartRules(battle: Battle, events: BattleEvent[]): void {
  const r = rule(battle);
  if (!r) return;
  if (r.weatherRandom) {
    const w = r.weatherRandom[fnv1a(`${battle.enemyTeam[0]?.uid ?? ''}|weather|0`) % r.weatherRandom.length]!;
    battle.weather = { id: w, turns: 999 };
    events.push({ type: 'weather', weather: w } as BattleEvent);
  }
  const foe = battle.enemyTeam[battle.enemyIndex];
  if (r.decoyFoe === '*' && foe) disguise(battle, foe);
}

/** The end of a turn. Forecaster Brio: a new weather. Roofer Jax: a knockout in the first turns is noted. Sleepwalker: the first to act gains Speed. */
export function coTurnEnd(battle: Battle, events: BattleEvent[]): void {
  const r = rule(battle);
  if (!r || battle.outcome) return noteEarlyKo(battle, events);
  if (r.weatherRandom) {
    const options = r.weatherRandom.filter((w) => w !== battle.weather?.id);
    const w = options[fnv1a(`${battle.enemyTeam[0]?.uid ?? ''}|weather|${battle.turn}`) % Math.max(1, options.length)] ?? r.weatherRandom[0]!;
    battle.weather = { id: w, turns: 999 };
    events.push({ type: 'weather', weather: w } as BattleEvent);
  }
  noteEarlyKo(battle, events);
  if (r.firstActBoost && !battle.storyEffects.includes('co-first-act')) {
    const first = events.find((e) => e.type === 'move') as { side: Side } | undefined;
    if (first && once(battle, 'co-first-act')) {
      const stages = first.side === 'player' ? battle.playerStages : battle.enemyStages;
      stages.spe = Math.min(6, stages.spe + 1);
      events.push({ type: 'stat', side: first.side, stat: 'spe', change: 1 } as BattleEvent);
    }
  }
}

function noteEarlyKo(battle: Battle, events: BattleEvent[]): void {
  const turns = rule(battle)?.earlyKo;
  // The turn counter has already moved on when a turn ends (turn 1 ends with it at 2).
  if (!turns || battle.turn > turns + 1) return;
  if (events.some((e) => e.type === 'faint' && (e as { side: Side }).side === 'enemy') && once(battle, 'co-early-ko')) {
    events.push({ type: 'raid', tone: 'info', text: 'A knockout in the opening turns! The bonus is yours.' });
  }
}

/** Coach Dugan's Pinch Hitter, the foe's side: a fainted foe gets back up once at a quarter of its HP. */
export function coPinchFoe(content: Content, battle: Battle, foe: PokemonInstance, events: BattleEvent[]): void {
  if (!rule(battle)?.pinchHitter || foe.hp > 0 || !once(battle, `pinch@${foe.uid}`)) return;
  foe.hp = Math.max(1, Math.ceil(maxHp(content, foe) / 4));
  foe.status = null;
  events.push({ type: 'raid', tone: 'phase', text: `${getSpecies(content, foe.speciesId).name} gets back up! Pinch hitter!` });
}
