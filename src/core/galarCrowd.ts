// Galar crowd favour and hype moments (Beta 0.5, Galar polish round 2).
// Galar only: the favour bar, the hype moments and their boosts exist in Galar gym, tournament and Champion battles and nowhere else.
//
// Pure and deterministic: favour is read from the battle state (no gameplay RNG, nothing stored), moments are picked by a hashed seed of their own,
// and the only effects on the fight are (1) a small rise in Hyper / Overdrive chance for the player when the crowd favours them, and
// (2) the Champion's one-time "last stand" Pokémon in a Champion battle. Everything else here is presentation.

import { z } from 'zod';
import hypeJson from '../data/galarHype.json';
import { typeEffectiveness } from './battle/damage';
import { stoneForms } from './battle/transform';
import type { Content, TypeName } from './contentSchema';
import { maxHp } from './pokemon';
import type { GalarScope } from './galarFavor';
import { hashSeed, Rng } from './rng';
import type { PokemonInstance, RunState } from './state';

export { crowdBoost, crowdFavor, galarScope, type GalarScope } from './galarFavor';

// ---------- the Champion's last stand ----------

const LAST_STAND_FLAG = (run: RunState): string => `galar-last-stand:${run.runId}:${run.encountersCompleted}`;

export function lastStandUsed(run: RunState): boolean {
  return Number(run.story.flags[LAST_STAND_FLAG(run)] ?? 0) > 0;
}

/** Marks the last stand as used (so it happens once per Champion battle, and a reload cannot repeat it). */
export function markLastStand(run: RunState): void {
  run.story.flags[LAST_STAND_FLAG(run)] = 1;
}

/** The base stat total of a species (to break ties between counters). */
function statTotal(content: Content, speciesId: string): number {
  const s = content.species.get(speciesId);
  return s ? Object.values(s.baseStats).reduce((a, n) => a + n, 0) : 0;
}

/**
 * The species the Champion throws out for the last stand: a Pokémon that can Mega Evolve whose own types hit the player's Pokémon the hardest
 * (the one on the field, or the strongest in the party when it is a stalemate). Same battle, same answer.
 */
export function pickCounterSpecies(content: Content, target: PokemonInstance, seed: string): string | null {
  const targetTypes = content.species.get(target.speciesId)?.types ?? [];
  const scored: { id: string; score: number; bst: number }[] = [];
  for (const sp of content.species.values()) {
    if (stoneForms(content, sp.id, false).length === 0) continue;
    const best = Math.max(...sp.types.map((t) => typeEffectiveness(content.typeChart, t as TypeName, targetTypes as TypeName[])));
    scored.push({ id: sp.id, score: best, bst: statTotal(content, sp.id) });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score || b.bst - a.bst || a.id.localeCompare(b.id));
  const top = scored.filter((s) => s.score === scored[0]!.score).slice(0, 6);
  return top[new Rng(hashSeed(`galar-last-stand:${seed}`)).int(0, top.length - 1)]!.id;
}

// ---------- hype moments (data: src/data/galarHype.json) ----------

export const HYPE_TRIGGERS = [
  'turn1', 'playerBigHit', 'foeBigHit', 'comeback', 'playerFirstKo', 'foeFirstKo', 'playerKoStreak', 'foeKoStreak', 'playerLast', 'foeLast',
  'playerDynamax', 'foeDynamax', 'midBattle', 'lateBattle', 'favorToPlayer', 'favorToFoe', 'evenMatch', 'lowFoe', 'lastStand', 'bondMega',
  'playerMega', 'underdog', 'playerSweep', 'foeSweep', 'flawless',
  // The Champion talking about the player's own road through Galar (Champion battles only).
  'evolveSave', 'foeEvolveSave', 'thread', 'cheat', 'shout',
  'journeyOpen', 'journeyMid', 'journeyLate', 'journeyDown', 'journeyFoeLow', 'journeyBig',
] as const;
export type HypeTrigger = (typeof HYPE_TRIGGERS)[number];
export const HYPE_SPEAKERS = ['reporter', 'crowdTrainer', 'rival', 'futureLeader', 'futureOpponent', 'host'] as const;
export type HypeSpeaker = (typeof HYPE_SPEAKERS)[number];

const HypeSchema = z.object({
  moments: z.array(z.object({
    id: z.string().min(1),
    trigger: z.enum(HYPE_TRIGGERS),
    side: z.enum(['player', 'foe', 'both']),
    scopes: z.array(z.enum(['gym', 'tournament', 'champion'])).min(1),
    speaker: z.enum(HYPE_SPEAKERS),
    title: z.string().min(1),
    lines: z.array(z.string().min(1)).min(1),
    cue: z.string(),
    weight: z.number().positive(),
    /** Facts about the player's journey that must all be true for this line (see journeyFlags in BattleScene). */
    needs: z.array(z.string()).default([]),
  })).min(50),
});
export type HypeMoment = z.infer<typeof HypeSchema>['moments'][number];
export const GALAR_HYPE: readonly HypeMoment[] = HypeSchema.parse(hypeJson).moments;

export interface HypeContext {
  runSeed: string;
  battleId: string;
  turn: number;
  scope: GalarScope;
  /** Moments already shown in this battle (ids), so none repeats. */
  seen: ReadonlySet<string>;
  /** Which speakers can be cast right now (a rival only if one watches, and so on). */
  available: ReadonlySet<HypeSpeaker>;
  /** True facts about the player's journey (a starter still in the party, a rival met, many wins...). */
  flags?: ReadonlySet<string>;
}

/** The moment for a trigger, or null when none fits (all seen, wrong scope, nobody to speak). Own seeded stream: never touches a gameplay roll. */
export function pickHype(trigger: HypeTrigger, ctx: HypeContext): HypeMoment | null {
  const options = GALAR_HYPE.filter((h) => h.trigger === trigger && h.scopes.includes(ctx.scope) && !ctx.seen.has(h.id) && ctx.available.has(h.speaker) && h.needs.every((n) => ctx.flags?.has(n) ?? false));
  if (options.length === 0) return null;
  const rng = new Rng(hashSeed(`galar-hype:${ctx.runSeed}:${ctx.battleId}:${trigger}:${ctx.turn}`));
  return rng.weighted(options.map((o) => ({ item: o, weight: o.weight })));
}

/** Fills {player} {foe} {foeMon} {myMon} {host} {rival} {leader} {starter} {ace} {badges} {wins} {rivalName} in a line ({FOE} gives the foe's name in capitals). */
export function fillHype(text: string, vars: Readonly<Record<string, string>>): string {
  return text.replace(/\{(\w+)\}/g, (all, key: string) => {
    if (key === 'FOE') return (vars.foe ?? '').toUpperCase();
    return vars[key] ?? all;
  });
}
