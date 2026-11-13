// Tier-5 rival AI (Beta 0.6 R4). Pure and deterministic: it picks among moves the engine already scored, using
// (1) a win condition named before the battle, (2) a scouting ledger (this rival, this run only), (3) ~50% switch
// prediction and (4) a small endgame search (two Pokémon or fewer each side). Personality changes style, never skill.
// No gameplay RNG is drawn: the "~50%" roll is a hash of the run seed, rival and turn, so no existing roll moves.

import { fnv1a } from '../story/moments';
import type { RivalOverhaulState } from './overhaulSchema';

export type WinCondition = 'sweep' | 'weather' | 'stall';

/** What the battle carries for the AI (set at battle start from the rival's record; stored in the run). */
export interface RivalBrain {
  tier: 4 | 5;
  winCondition: WinCondition;
  personality: string;
  /** Moves you have shown this rival in earlier fights this run. */
  seenMoves: string[];
  seenSpecies: string[];
  /** Share of watched turns you switched, 0..1 (0.25 when nothing is known). */
  switchRate: number;
  /** The rival lost its last battle to you (Bitter Challenger holds a grudge). */
  lostLast?: boolean;
  /** Used for the rolls (run seed + rival id). */
  seed: string;
}

export interface Tier5Option {
  index: number;
  /** The engine's own score for the move. */
  score: number;
  /** Estimated damage to the current foe, HP. */
  damage: number;
  priority?: boolean;
  setup?: boolean;
  heal?: boolean;
  weather?: boolean;
  status?: boolean;
  /** Estimated damage if the foe switches to its likeliest replacement (for punishing a switch). */
  switchDamage?: number;
  /** Self-KO or other giving-up moves. */
  sacrifice?: boolean;
}

export interface Tier5Input {
  brain: RivalBrain;
  turn: number;
  options: Tier5Option[];
  ownHp: number;
  ownMaxHp: number;
  foeHp: number;
  foeMaxHp: number;
  ownFaster: boolean;
  /** The foe's best damage on us, and the best on us from moves the ledger says it has. */
  foeBestDamage: number;
  isAce: boolean;
  ownReserves: number;
  foeReserves: number;
  /** The foe has a bench and an obvious reason to switch (the AI's own read). */
  switchLikely: boolean;
}

/** Deterministic 0..1 roll for one decision; independent of every RNG stream. */
export const t5Roll = (brain: Pick<RivalBrain, 'seed'>, turn: number, tag: string): number => (fnv1a(`${brain.seed}:t5:${tag}:${turn}`) % 10000) / 10000;

/** Chance the AI plays the switch-punishing move: about 50%, nudged by how you have actually played (0.3..0.7). */
export function switchPunishChance(switchRate: number): number {
  return Math.max(0.3, Math.min(0.7, 0.5 + (switchRate - 0.25)));
}

/** Names the plan before the battle from the rival's team: a weather mon wins weather, many defensive mons stall, else sweep. */
export function chooseWinCondition(team: { weatherSetter?: boolean; bulky?: boolean }[]): WinCondition {
  if (team.some((m) => m.weatherSetter)) return 'weather';
  if (team.length > 0 && team.filter((m) => m.bulky).length * 2 > team.length) return 'stall';
  return 'sweep';
}

/** Does this move protect the plan? Returns a score multiplier (1 = neutral). */
export function planFactor(brain: RivalBrain, o: Tier5Option, i: Pick<Tier5Input, 'isAce' | 'ownHp' | 'ownMaxHp' | 'foeBestDamage' | 'foeHp'>): number {
  let f = 1;
  const safe = i.foeBestDamage < i.ownHp;
  if (brain.winCondition === 'sweep' && i.isAce && o.setup && safe) f *= 1.25;
  if (brain.winCondition === 'weather' && o.weather) f *= 1.3;
  if (brain.winCondition === 'stall' && (o.heal || o.status)) f *= 1.2;
  if (brain.winCondition === 'stall' && o.damage >= i.foeHp) f *= 1.1;
  return f;
}

/** Personality: a tie-break style, never a blunder. Multipliers stay within a few per cent. */
export function styleFactor(brain: RivalBrain, o: Tier5Option, i: Pick<Tier5Input, 'ownHp' | 'ownMaxHp' | 'foeHp' | 'ownReserves' | 'foeReserves' | 'turn'>): number {
  const behind = i.ownReserves < i.foeReserves;
  switch (brain.personality) {
    case 'champion-chaser': return o.damage > 0 ? 1.04 : 1;
    case 'bitter-challenger': return brain.lostLast && o.damage >= i.foeHp ? 1.05 : 1;
    case 'enthusiast': return o.damage > 0 && !o.heal ? 1.03 : 1;
    case 'idealist': return o.sacrifice ? 0.8 : 1;
    case 'strategist': return o.setup || o.switchDamage ? 1.04 : 1;
    case 'protector': return o.heal ? 1.05 : 1;
    case 'prodigy': return 1;
    case 'underdog': return behind && o.damage > 0 ? 1.05 : 1;
    default: return 1;
  }
}

/** Ledger: with a priority move seen on the foe's side we do not gamble at low HP; else a plain bonus for our own priority finisher. */
export function ledgerFactor(brain: RivalBrain, o: Tier5Option, i: Pick<Tier5Input, 'ownHp' | 'ownMaxHp' | 'foeHp' | 'ownFaster' | 'foeBestDamage'>): number {
  const threatened = i.foeBestDamage >= i.ownHp;
  if (threatened && !i.ownFaster && o.priority && o.damage >= i.foeHp) return 1.6;
  return 1;
}

/**
 * Endgame solving: with two or fewer each side, a two-ply search over our move and the foe's best reply, scoring the
 * outcome in HP shares. Returns the best option index, or null when the position is not an endgame.
 */
export function endgamePick(i: Tier5Input): number | null {
  if (i.ownReserves > 1 || i.foeReserves > 1 || i.options.length === 0) return null;
  let best: { index: number; v: number } | null = null;
  for (const o of i.options) {
    const kos = o.damage >= i.foeHp;
    const dealt = Math.min(1, o.damage / Math.max(1, i.foeHp));
    const foeKos = i.foeBestDamage >= i.ownHp;
    // If we KO first (faster, or priority) there is no reply; otherwise the foe answers.
    const first = i.ownFaster || o.priority;
    const taken = kos && first ? 0 : Math.min(1, i.foeBestDamage / Math.max(1, i.ownHp)) * (o.heal ? 0.5 : 1);
    const lose = !(kos && first) && foeKos && !o.heal ? 1 : 0;
    const healGain = o.heal ? 0.4 : 0;
    const v = (kos ? 2 : dealt) - taken - lose * 2 + healGain + o.score * 1e-6;
    if (!best || v > best.v + 1e-9) best = { index: o.index, v };
  }
  return best ? best.index : null;
}

/**
 * The tier-5 choice among already-scored options. Returns the chosen move index. Order: endgame solver, then the
 * switch-punish read (about half the time when a switch is likely), then plan/ledger/style-weighted scores.
 */
export function tier5Pick(i: Tier5Input): number {
  const { brain, options } = i;
  const end = endgamePick(i);
  if (end !== null) return end;
  if (i.switchLikely && options.some((o) => o.switchDamage && o.switchDamage > 0) && t5Roll(brain, i.turn, 'switch') < switchPunishChance(brain.switchRate)) {
    return options.reduce((b, o) => ((o.switchDamage ?? 0) > (b.switchDamage ?? 0) ? o : b)).index;
  }
  let best = options[0]!;
  let bv = -Infinity;
  for (const o of options) {
    const v = o.score * planFactor(brain, o, i) * ledgerFactor(brain, o, i) * styleFactor(brain, o, i);
    if (v > bv + 1e-9) {
      bv = v;
      best = o;
    }
  }
  return best.index;
}

/** Builds the battle's brain from the rival's record. Tier 3 under pity (the engine then uses its normal AI). */
export function brainFor(rec: RivalOverhaulState, rivalId: string, runSeed: string, winCondition: WinCondition, pityTier: number | null): RivalBrain | null {
  if (pityTier !== null && pityTier < 5) return null;
  const l = rec.ledger;
  const switchRate = l && l.turns >= 8 ? Math.min(1, l.switches / l.turns) : 0.25;
  return { tier: 5, winCondition, personality: rec.personality, seenMoves: l?.moves ?? [], seenSpecies: l?.species ?? [], switchRate, lostLast: rec.marks.includes('beaten-by-you'), seed: `${runSeed}:${rivalId}` };
}

/** Writes what a finished battle showed into the ledger (moves, species, turns, switches), capped. */
export function scout(rec: RivalOverhaulState, seen: { moves: string[]; species: string[]; items?: string[]; abilities?: string[]; turns: number; switches: number }): void {
  const l = (rec.ledger ??= { moves: [], items: [], abilities: [], species: [], turns: 0, switches: 0 });
  const add = (list: string[], more: string[], cap: number) => {
    for (const m of more) if (!list.includes(m)) list.push(m);
    if (list.length > cap) list.splice(0, list.length - cap);
  };
  add(l.moves, seen.moves, 60);
  add(l.species, seen.species, 60);
  add(l.items, seen.items ?? [], 30);
  add(l.abilities, seen.abilities ?? [], 30);
  l.turns += seen.turns;
  l.switches += seen.switches;
}

/** Counter-pick slots allowed against you by encounter (R4/§6.4), limited to species already seen. */
export function counterSlots(encounter: 'first' | 'mid' | 'finale' | 'league'): number {
  return { first: 0, mid: 1, finale: 2, league: 3 }[encounter];
}
export const mayCounter = (rec: RivalOverhaulState, speciesId: string): boolean => !!rec.ledger?.species.includes(speciesId);
