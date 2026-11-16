// Greenneedle gn.35, Thunderstorm Ridge: the lightning that hunts the party's lead, the friendly Electric-types the charged
// crystals draw, and the overcharged one at the summit (battle rules `overcharged` and `earthing`, read by battle/engine.ts).
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { abilityOf, getSpecies, maxHp } from '../pokemon';

const flagOf = (run: RunState, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const setFlag = (run: RunState, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};

/** The Lightning Rod from the hilltop event (w4-lightning-rod, "Wait for the strike."): a length of the struck iron, carried. */
export const HILLTOP_ROD = 'hilltop-rod';

/**
 * One node's lightning (gn op `lightning`, `n` percent). The sky warns first; then it strikes the party's lead and paralyses it,
 * unless a Ground-type is in front (it goes into the hill), a lightning rod takes it (a held Metal Coat, or the hilltop's rod), or the
 * lead's Lightning Rod or Volt Absorb drinks it (Volt Absorb heals a quarter, Lightning Rod starts its next battle at +1 Sp. Atk).
 * Every strike counts in `ridge-struck`. Returns the lines to show.
 */
export function lightning(content: Content, run: RunState, percent: number, roll: number): string {
  if (roll * 100 >= percent) return '';
  const lead = run.party.find((m) => m.hp > 0);
  if (!lead) return '';
  const name = getSpecies(content, lead.speciesId).name;
  setFlag(run, 'ridge-struck', flagOf(run, 'ridge-struck') + 1);
  const warn = `*${name}'s fur stands up, for a second. Then the sky comes down.*`;
  const types = getSpecies(content, lead.speciesId).types;
  if (types.includes('ground')) return `${warn} The bolt goes into ${name}, and through it, and into the hill. Nothing happens.`;
  if (lead.held?.['metal-coat']) return `${warn} It hits the Metal Coat ${name} is holding, and runs off it into the rock.`;
  if (flagOf(run, HILLTOP_ROD) > 0) return `${warn} It finds the iron rod from the hilltop first. The rod rings like a bell, and goes quiet.`;
  const ability = abilityOf(content, lead);
  if (ability === 'volt-absorb') {
    const max = maxHp(content, lead);
    lead.hp = Math.min(max, lead.hp + Math.max(1, Math.floor(max / 4)));
    return `${warn} ${name} drinks it. It looks better for it.`;
  }
  if (ability === 'lightning-rod') {
    lead.boosts = [...(lead.boosts ?? []), { kind: 'stage', stat: 'spa', stages: 1, turns: 99 }];
    return `${warn} ${name} pulls it in, and holds it. Its next battle starts charged (+1 Sp. Atk).`;
  }
  if (lead.status || types.includes('electric')) return `${warn} It hits ${name}, hard. ${name} shakes it off.`;
  lead.status = { id: 'par' };
  return `${warn} It hits ${name}. ${name} is paralysed.`;
}

/** A friendly follower (drawn by a charged crystal) is caught twice as easily. */
export const ridgeCatch = (run: RunState, battle: Pick<BattleState, 'eventRule'>): number => (battle.eventRule?.gn === 'ridge' && flagOf(run, 'ridge-friendly') > 0 ? 2 : 1);

/** What the player sees on each turn of the earthing (the doc's three lines). With two turns (NE9's Manectric remembered), the first and last. */
export const EARTH_LINES = [
  'The bolts bend away from it, and into your Ground-type, and into the hill.',
  'It stops shaking. It looks at its own paws.',
  'The sky over the summit clears, in a circle. It sits down, hard, like something that\'s been standing for a month.',
];
export function earthLine(turn: number, of: number): string | null {
  if (turn < 1 || turn > of) return null;
  if (of === 2) return EARTH_LINES[turn === 1 ? 0 : 2]!;
  return EARTH_LINES[Math.min(turn, 3) - 1]!;
}

/** The overcharged one hurts itself every turn: 1/16 of its HP. */
export const overchargeSelfHurt = (content: Content, mon: PokemonInstance): number => Math.max(1, Math.floor(maxHp(content, mon) / 16));
