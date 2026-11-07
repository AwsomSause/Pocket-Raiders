// Battle/AI batch 3. S171 Evolution by Condition Variety: besides level, item and friendship (and the Bond Engine's bond
// route), some Pokémon evolve early when a condition is met after a battle: the weather the battle ended in, knowing a
// move, or using a move often enough. Checked after battles (core/run.ts); pure and RNG-free.

import type { Content } from './contentSchema';
import type { PokemonInstance, RunState } from './state';
import { periodOf } from './clock';
import { friendshipReady } from './friendship';
import { bondOf } from './bond';
import { heartbondLevel, heartbondScore } from './story2/heartbond';

export type EvoCondition =
  | { kind: 'weather'; weather: 'rain' | 'sun' | 'sand' | 'snow' | 'hail' }
  | { kind: 'knowsMove'; move: string }
  | { kind: 'moveUses'; move: string; count: number }
  /** Story Overhaul: the Pokémon's Heartbond level (Story runs only). */
  | { kind: 'heartbond'; level: number }
  /** The run clock reads night. */
  | { kind: 'night' }
  /** The run clock does not read night. */
  | { kind: 'day' }
  /** The Pokémon is holding this item (kept: it is not used up). Jet Pokémon: Booster Energy, Black Sludge. */
  | { kind: 'holds'; item: string }
  /** The Pokémon's nature is one of these (Toxel's Amped and Low Key groups). */
  | { kind: 'nature'; natures: readonly string[] }
  /** Friendship has reached the evolution level (the same high friendship the friendship routes need). */
  | { kind: 'friendship' }
  /** Another Pokémon of this species is in the party (Sableye to Gemgoyle). */
  | { kind: 'partyHas'; species: string }
  /** Every part must hold. */
  | { kind: 'all'; of: EvoCondition[] };

export interface ConditionEvolution {
  from: string;
  to: string;
  /** The earliest level this route works at. */
  minLevel: number;
  /** The natural route. Missing = this entry is a stone route only. */
  condition?: EvoCondition;
  /** Stones that do the same job from the Bag (a Sun Stone for a sunny route ...), at the same minimum level. */
  stones?: string[];
  /** The stone route also needs high friendship (Eevee to Espeon / Umbreon). */
  stoneFriendship?: boolean;
}

/** Toxel's nature groups (Jet Pokédex): Low Key becomes Vine Riff, Amped becomes Electric Oncore. */
const JET_LOW_KEY = ['lonely', 'bold', 'relaxed', 'timid', 'serious', 'modest', 'mild', 'quiet', 'bashful', 'calm', 'gentle', 'careful'] as const;
const JET_AMPED = ['hardy', 'brave', 'adamant', 'naughty', 'docile', 'impish', 'lax', 'hasty', 'jolly', 'naive', 'rash', 'sassy', 'quirky'] as const;

export const CONDITION_EVOLUTIONS: ConditionEvolution[] = [
  { from: 'sliggoo', to: 'goodra', minLevel: 40, condition: { kind: 'weather', weather: 'rain' }, stones: ['water-stone'] },
  // A matching stone also works for time and weather routes; Eevee's day / night pair needs high friendship too.
  { from: 'eevee', to: 'espeon', minLevel: 1, stones: ['sun-stone'], stoneFriendship: true },
  { from: 'eevee', to: 'umbreon', minLevel: 1, stones: ['moon-stone', 'dusk-stone'], stoneFriendship: true },
  // Day / night friendship routes.
  { from: 'budew', to: 'roselia', minLevel: 1, stones: ['sun-stone'], stoneFriendship: true },
  { from: 'riolu', to: 'lucario', minLevel: 1, stones: ['sun-stone'], stoneFriendship: true },
  { from: 'chingling', to: 'chimecho', minLevel: 1, stones: ['moon-stone', 'dusk-stone'], stoneFriendship: true },
  // Time-of-day level routes: the stone picks the form.
  { from: 'rockruff', to: 'lycanroc', minLevel: 25, stones: ['sun-stone'] },
  { from: 'rockruff', to: 'lycanroc-midnight', minLevel: 25, stones: ['moon-stone'] },
  { from: 'rockruff', to: 'lycanroc-dusk', minLevel: 25, stones: ['dusk-stone'] },
  { from: 'tyrunt', to: 'tyrantrum', minLevel: 39, stones: ['sun-stone'] },
  { from: 'amaura', to: 'aurorus', minLevel: 39, stones: ['moon-stone', 'dusk-stone'] },
  { from: 'cosmoem', to: 'solgaleo', minLevel: 53, stones: ['sun-stone'] },
  { from: 'cosmoem', to: 'lunala', minLevel: 53, stones: ['moon-stone'] },
  { from: 'aipom', to: 'ambipom', minLevel: 20, condition: { kind: 'knowsMove', move: 'double-hit' } },
  { from: 'yanma', to: 'yanmega', minLevel: 20, condition: { kind: 'knowsMove', move: 'ancient-power' } },
  { from: 'tangela', to: 'tangrowth', minLevel: 20, condition: { kind: 'knowsMove', move: 'ancient-power' } },
  { from: 'lickitung', to: 'lickilicky', minLevel: 20, condition: { kind: 'knowsMove', move: 'rollout' } },
  { from: 'steenee', to: 'tsareena', minLevel: 18, condition: { kind: 'knowsMove', move: 'stomp' } },
  { from: 'bonsly', to: 'sudowoodo', minLevel: 10, condition: { kind: 'knowsMove', move: 'mimic' } },
  { from: 'mime-jr', to: 'mr-mime', minLevel: 10, condition: { kind: 'knowsMove', move: 'mimic' } },
  { from: 'girafarig', to: 'farigiraf', minLevel: 20, condition: { kind: 'knowsMove', move: 'twin-beam' } },
  { from: 'dunsparce', to: 'dudunsparce', minLevel: 20, condition: { kind: 'knowsMove', move: 'hyper-drill' } },
  { from: 'stantler', to: 'wyrdeer', minLevel: 20, condition: { kind: 'moveUses', move: 'psyshield-bash', count: 20 } },
  { from: 'primeape', to: 'annihilape', minLevel: 25, condition: { kind: 'moveUses', move: 'rage-fist', count: 20 } },
  // Jet Pokémon (docs/status/jet-pokemon.md; rules from the director's Jet Pokédex). The held item stays held.
  { from: 'toxel', to: 'vine-riff', minLevel: 30, condition: { kind: 'all', of: [{ kind: 'holds', item: 'booster-energy' }, { kind: 'nature', natures: JET_LOW_KEY }] } },
  { from: 'toxel', to: 'electric-oncore', minLevel: 30, condition: { kind: 'all', of: [{ kind: 'holds', item: 'booster-energy' }, { kind: 'nature', natures: JET_AMPED }] } },
  { from: 'eevee', to: 'pyro-spirit', minLevel: 1, condition: { kind: 'all', of: [{ kind: 'holds', item: 'booster-energy' }, { kind: 'day' }, { kind: 'friendship' }] } },
  { from: 'eevee', to: 'neon-moon', minLevel: 1, condition: { kind: 'all', of: [{ kind: 'holds', item: 'booster-energy' }, { kind: 'night' }, { kind: 'friendship' }] } },
  // Beta 4.4 batch (docs/status/beta-4-4-pokemon.md). Rowlet's line: Decidueye by day from 34, the Assassian form by night from 36.
  { from: 'dartrix', to: 'decidueye', minLevel: 34, condition: { kind: 'day' } },
  { from: 'dartrix', to: 'decidueye-assassian', minLevel: 36, condition: { kind: 'night' } },
  { from: 'sableye', to: 'gemgoyle', minLevel: 1, condition: { kind: 'partyHas', species: 'sableye' } },
  { from: 'krookodile', to: 'dreadodile', minLevel: 55, condition: { kind: 'holds', item: 'hard-stone' } },
  { from: 'benovolant-beak', to: 'tyrant-king', minLevel: 17, condition: { kind: 'holds', item: 'kings-rock' } },
  { from: 'bastiodon', to: 'bastiodoom', minLevel: 1, condition: { kind: 'holds', item: 'black-sludge' } },
  { from: 'aggron', to: 'cataggron', minLevel: 55, condition: { kind: 'holds', item: 'metal-coat' } },
  // Story Overhaul S15. The engine's only storm weather is rain, so "storm" and "thunderstorm" mean a win that ends in rain.
  { from: 'tuftin', to: 'eevee', minLevel: 1, condition: { kind: 'heartbond', level: 3 } },
  { from: 'noctowl', to: 'oracowl', minLevel: 42, stones: ['moon-stone', 'dusk-stone'], condition: { kind: 'all', of: [{ kind: 'night' }, { kind: 'heartbond', level: 6 }] } },
  // Day form: the Sun Stone picks it (Night needs night, Heartbond 6 or a Moon / Dusk Stone above).
  { from: 'noctowl', to: 'oracowl-day', minLevel: 42, stones: ['sun-stone'] },
  { from: 'swellow', to: 'tempestwing', minLevel: 46, condition: { kind: 'weather', weather: 'rain' }, stones: ['water-stone'] },
  { from: 'kilowattrel', to: 'megawattrel', minLevel: 52, condition: { kind: 'weather', weather: 'rain' }, stones: ['water-stone'] },
];

/** Moves whose uses are counted on the Pokémon (`moveCounts`) because a route needs them. */
export const COUNTED_MOVES = new Set(CONDITION_EVOLUTIONS.flatMap((e) => (e.condition?.kind === 'moveUses' ? [e.condition.move] : [])));

/** Counts one use of a move by your Pokémon when a route needs it (mutates `mon`). */
export function countMoveUse(mon: PokemonInstance, moveId: string): void {
  if (!COUNTED_MOVES.has(moveId)) return;
  mon.moveCounts = { ...mon.moveCounts, [moveId]: Math.min(999, (mon.moveCounts?.[moveId] ?? 0) + 1) };
}

/** Plain words for a route ("knows Ancient Power", "battle in rain", "use Rage Fist 20 times"). */
export function conditionText(content: Content, c: EvoCondition): string {
  if (c.kind === 'weather') return `win a battle that ends in ${c.weather}`;
  if (c.kind === 'heartbond') return `reach Heartbond ${c.level}`;
  if (c.kind === 'night') return 'win at night';
  if (c.kind === 'day') return 'win by day';
  if (c.kind === 'nature') return `have a ${c.natures.length === 12 ? 'Low Key' : 'Amped'} nature`;
  if (c.kind === 'friendship') return 'be very friendly';
  if (c.kind === 'partyHas') return `have another ${content.species.get(c.species)?.name ?? c.species} in the party`;
  if (c.kind === 'holds') return `hold ${c.item.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ')}`;
  if (c.kind === 'all') return c.of.map((x) => conditionText(content, x)).join(' and ');
  const name = content.moves.get(c.move)?.name ?? c.move;
  return c.kind === 'knowsMove' ? `know ${name}` : `use ${name} ${c.count} times`;
}

/** What the run adds to a check: it unlocks the Heartbond and night conditions. */
export interface EvoRunInfo { heartbond: number | null; night: boolean; party?: readonly string[] }

export function evoRunInfo(run: RunState, mon: PokemonInstance): EvoRunInfo {
  return { heartbond: run.story.v2 ? heartbondLevel(heartbondScore(bondOf(run, mon.uid))) : null, night: periodOf(run) === 'night', party: run.party.map((m) => m.speciesId) };
}

function conditionMet(content: Content, c: EvoCondition, mon: PokemonInstance, weather: string | null, info: EvoRunInfo | undefined): boolean {
  switch (c.kind) {
    case 'weather': return weather === c.weather;
    case 'knowsMove': return mon.moves.some((m) => m.id === c.move);
    case 'moveUses': return (mon.moveCounts?.[c.move] ?? 0) >= c.count;
    case 'heartbond': return (info?.heartbond ?? 0) >= c.level;
    case 'night': return info?.night === true;
    case 'day': return info?.night === false;
    case 'holds': return (mon.held?.[c.item] ?? 0) > 0;
    case 'nature': return mon.nature !== undefined && c.natures.includes(mon.nature);
    case 'friendship': return friendshipReady(content, mon);
    case 'partyHas': return (info?.party ?? []).filter((id) => id === c.species).length >= 2;
    case 'all': return c.of.every((x) => conditionMet(content, x, mon, weather, info));
  }
}

/** The species this Pokémon evolves into by a condition route right now (`weather` = the weather the battle ended in), or null. */
export function conditionEvolutionTarget(content: Content, mon: PokemonInstance, weather: string | null, info?: EvoRunInfo): string | null {
  if (mon.hp <= 0 || mon.care?.holdEvolve) return null;
  for (const e of CONDITION_EVOLUTIONS) {
    if (e.from !== mon.speciesId || mon.level < e.minLevel || !content.species.has(e.to) || !e.condition) continue;
    if (conditionMet(content, e.condition, mon, weather, info)) return e.to;
  }
  return null;
}

/** Species a stone from the Bag turns this Pokémon into through a time / weather route (Sun Stone: Eevee to Espeon at high friendship). */
export function stoneRouteTargets(content: Content, mon: PokemonInstance, itemId: string): string[] {
  return CONDITION_EVOLUTIONS
    .filter((e) => e.from === mon.speciesId && e.stones?.includes(itemId) && mon.level >= e.minLevel && content.species.has(e.to) && (!e.stoneFriendship || friendshipReady(content, mon)))
    .map((e) => e.to);
}
