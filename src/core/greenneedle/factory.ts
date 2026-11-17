// Greenneedle gn.17, the Polluted Factory: the turn-end rules of its fights. Pure and seed-free: a burst pipe or a burn is hashed from the
// Pokémon and the turn (no gameplay stream is touched), so the screen, a replay and a reloaded save always agree.

import type { BattleEvent } from '../battle/engine';
import type { Content } from '../contentSchema';
import { fnv1a } from '../expansion/hash';
import { createPokemon, getSpecies, maxHp } from '../pokemon';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { isSpreadMove } from '../trainerPerks';

/** The token that carries how many turns the Molten Sludge burns (set when the fight starts: six, one fewer per Pokémon freed from the pits). */
export const SLUDGE_TURNS = 'gn-sludge:';
/** A Water move turned the sludge to steam: it is gone for the rest of the fight. */
export const SLUDGE_OFF = 'gn-sludge-off';
/** At most this many small ones split off in phase one. */
const MAX_SPLITS = 3;

const roll = (key: string, inN: number): boolean => fnv1a(key) % inN === 0;

/** The player's move this turn (from the turn's events), or null. */
function playerMoveThisTurn(events: readonly BattleEvent[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i] as { type: string; side?: string; moveId?: string };
    if (e.type === 'move' && e.side === 'player' && e.moveId) return e.moveId;
  }
  return null;
}

/** The Polluted Factory's named fight rules. */
export const FACTORY_RULES: ReadonlySet<string> = new Set(['pipes', 'sludge', 'furnace', 'core']);

/** End of a turn in a Polluted Factory fight (`rule.gn` pipes, sludge or furnace; `battle.turn` has already moved on, so the first turn ends at 2). */
export function factoryTurnEnd(content: Content, battle: BattleState, mine: PokemonInstance | undefined, events: BattleEvent[]): void {
  const gn = battle.eventRule?.gn;
  if (!mine || mine.hp <= 0) return;
  const types = getSpecies(content, mine.speciesId).types;
  // The Pipes: after the first turn, a pipe may burst (one in four): the lead is poisoned. Poison- and Steel-types are immune.
  if (gn === 'pipes' && battle.turn === 2 && !mine.status && !types.some((t) => t === 'poison' || t === 'steel') && roll(`${mine.uid}::pipe::${battle.enemyTeam[0]?.uid ?? ''}`, 4)) {
    mine.status = { id: 'psn' };
    events.push({ type: 'raid', tone: 'info', text: 'A pipe bursts overhead! Hot runoff pours down.' }, { type: 'status', side: 'player', status: 'psn' });
  }
  if (gn !== 'sludge' && gn !== 'furnace') return;
  const used = playerMoveThisTurn(events);
  // The Furnace: Water moves steam (half damage, in the engine) and clear the Molten Sludge.
  if (gn === 'furnace' && used && content.moves.get(used)?.type === 'water' && !battle.storyEffects.includes(SLUDGE_OFF)) {
    battle.storyEffects.push(SLUDGE_OFF);
    events.push({ type: 'raid', tone: 'info', text: 'The water hits the molten sludge and goes up as steam. The floor is clear!' });
  }
  // The Sludge: each spread move that lands splits off a small one, which has to be beaten too.
  if (gn === 'sludge' && used && isSpreadMove(used)) {
    const splits = battle.storyEffects.filter((s) => s.startsWith('gn-split:')).length;
    const boss = battle.enemyTeam[0];
    if (boss && boss.hp > 0 && splits < MAX_SPLITS && content.species.has('grimer')) {
      const small = createPokemon(content, 'grimer', Math.max(2, boss.level - 5), `${boss.uid}-split${splits + 1}`);
      battle.enemyTeam.push(small);
      battle.storyEffects.push(`gn-split:${small.uid}`);
      events.push({ type: 'raid', tone: 'phase', text: 'The spread move splits it! A small one breaks off and slides away to wait its turn.' });
    }
  }
  // Molten Sludge: Pokémon that aren't Fire, Poison or Ground lose 1/16 of their HP a turn, while it lasts. It never knocks anything out.
  const token = battle.storyEffects.find((s) => s.startsWith(SLUDGE_TURNS));
  const turns = token ? Number(token.slice(SLUDGE_TURNS.length)) : 0;
  if (battle.turn - 1 <= turns && !battle.storyEffects.includes(SLUDGE_OFF) && mine.hp > 1 && !types.some((t) => t === 'fire' || t === 'poison' || t === 'ground')) {
    const amount = Math.min(mine.hp - 1, Math.max(1, Math.floor(maxHp(content, mine) / 16)));
    mine.hp -= amount;
    events.push({ type: 'raid', tone: 'info', text: 'Molten sludge scalds your Pokémon!' }, { type: 'damage', side: 'player', amount, hpAfter: mine.hp, effectiveness: 1, crit: false });
  }
  // The Furnace: every Pokémon that isn't a Fire-type may catch a burn each turn (one in five).
  if (gn === 'furnace' && mine.hp > 0 && !mine.status && !types.includes('fire') && roll(`${mine.uid}::furnace::${battle.turn}`, 5)) {
    mine.status = { id: 'brn' };
    events.push({ type: 'raid', tone: 'info', text: 'The floor is burning!' }, { type: 'status', side: 'player', status: 'brn' });
  }
}

/**
 * The line shut down (gn.17; the flag holds the region it happened in, plus one): for the rest of that region, on a water route,
 * Poison-types are a step rarer (half as likely) and Water-types a step more common (half as likely again). 1 everywhere else.
 */
export function factoryWildWeight(content: Content, run: Pick<RunState, 'story' | 'regionIndex'>, themeTypes: readonly string[], speciesId: string): number {
  if (!themeTypes.includes('water')) return 1;
  const types = content.species.get(speciesId)?.types ?? [];
  // The research was sold and the buyer built another factory (the flag holds that region, plus one): the other way round, in that region.
  if (Number(run.story.flags['ev:factory-second'] ?? 0) === run.regionIndex + 1) return (types.includes('poison') ? 1.5 : 1) * (types.includes('water') ? 0.5 : 1);
  if (Number(run.story.flags['ev:factory-shutdown'] ?? 0) !== run.regionIndex + 1) return 1;
  return (types.includes('poison') ? 0.5 : 1) * (types.includes('water') ? 1.5 : 1);
}

/** The Sludge Pits (rule `pits`): one of these tokens is one Pokémon still stuck. Each costs one of your Pokémon its move (it is pulling), and frees one. */
export const PIT_PULL = 'gn-you-wait:It turns its back on the Grimer, wades in, and hauls one of the stuck Pokémon out of the pit.';
/** Six Pokémon are stuck in the pits. */
export const PIT_STUCK = 6;

/** The fight at the pits begins: `pulls` of your Pokémon's moves will go on pulling (at most the six that are stuck, less those already out). */
export function pitsStart(battle: BattleState, pulls: number, alreadyFreed: number): void {
  const n = Math.max(0, Math.min(pulls, PIT_STUCK - alreadyFreed));
  for (let i = 0; i < n; i++) battle.storyEffects.push(PIT_PULL);
  battle.storyEffects.push(`gn-pits:${n}:${alreadyFreed}`);
}

/**
 * "Pull them out." asked in the fight itself (core/greenneedle/ask.ts): each of your Pokémon able to stand pulls one out this turn
 * (at most three stand in the pit fight, and no more than are still stuck), giving up its move. Returns the line.
 */
export function pitsPull(content: Content, run: Pick<RunState, 'party'>, battle: BattleState): string {
  const at = battle.storyEffects.findIndex((t) => t.startsWith('gn-pits:'));
  if (at < 0) return '';
  const [, pulls, before] = battle.storyEffects[at]!.split(':').map(Number);
  const queued = battle.storyEffects.filter((t) => t === PIT_PULL).length;
  const stuck = PIT_STUCK - (before ?? 0) - (pulls ?? 0);
  const hands = Math.min(battle.doubles ? (battle.doubles.trio ? 3 : 2) : 1, run.party.filter((m) => m.hp > 0).length);
  const n = Math.max(0, Math.min(hands - queued, stuck));
  for (let i = 0; i < n; i++) battle.storyEffects.push(PIT_PULL);
  battle.storyEffects[at] = `gn-pits:${(pulls ?? 0) + n}:${before ?? 0}`;
  return n > 0 ? 'Your team turns from the Grimer and wades into the pit.' : 'There is nobody left to pull out.';
}

/** How many are out of the pits now: those out before the fight, plus one for every pull made so far. Undefined outside the pits fight. */
export function pitsFreed(battle: Pick<BattleState, 'storyEffects'>): number | undefined {
  const note = battle.storyEffects.find((t) => t.startsWith('gn-pits:'));
  if (!note) return undefined;
  const [, pulls, before] = note.split(':').map(Number);
  const left = battle.storyEffects.filter((t) => t === PIT_PULL).length;
  return Math.min(PIT_STUCK, (before ?? 0) + (pulls ?? 0) - left);
}

/** Dr. Stroud's research, handed to a professor: this Ball is on sale in every shop for the rest of the run, whatever the badge count. */
export const PROFESSOR_BALL = 'dream-ball';
export const professorBall = (story: Pick<RunState, 'story'>['story'] | undefined, itemId: string): boolean => itemId === PROFESSOR_BALL && Number(story?.flags['ev:factory-research-given'] ?? 0) > 0;
