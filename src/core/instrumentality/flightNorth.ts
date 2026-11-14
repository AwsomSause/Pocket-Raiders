// Beta 0.7: Flight North, the Bug-type's return ("Second Wind"). During the stage the lone Caterpie or Weedle is a character (named, bonded);
// when it leaves it is remembered in run.expansion.flightNorth. If the run is later lost, the game-over screen cracks, the Bug-type comes back
// as Mega Beedrill or a Gigantamax-sized Butterfree, the whole team is revived and it fights alongside for that battle, once per run.
// It goes first in the rescue order, so Second Chance never also triggers. No random numbers.

import type { Content } from '../contentSchema';
import { maxHp } from '../pokemon';
import type { PokemonInstance, RunState } from '../state';

export type FlightNorthState = NonNullable<NonNullable<RunState['expansion']>['flightNorth']>;
export type BugLine = 'caterpie' | 'weedle';

export const FLIGHT_NORTH = { assistStrikes: 6, trustGain: 30, bugFamily: { caterpie: ['caterpie', 'metapod', 'butterfree'], weedle: ['weedle', 'kakuna', 'beedrill'] } } as const;

/** What comes back, by line. The Mega Stone is the one the kept Pokémon carries (Butterfree's is its Z Mega Stone). */
export const RETURN_FORMS: Record<BugLine, { returnSpecies: string; display: string; species: string; stone: string }> = {
  weedle: { returnSpecies: 'beedrill-mega', display: 'Mega Beedrill', species: 'beedrill', stone: 'beedrillite' },
  caterpie: { returnSpecies: 'butterfree-gmax', display: 'Gigantamax-sized Butterfree', species: 'butterfree', stone: 'butterfreite-z' },
};

/** The own music for the return battle (presentation id; the audio layer falls back to the boss track when it is missing). */
export const RETURN_MUSIC = 'bgm.flight_north';

/** The game-over screen cracks, cracks again, then shatters (presentation lines; the first three are sounds, not words). */
export const CRACK_LINES = ['The screen cracks.', 'It cracks again.', 'And then it shatters.'] as const;

export const NORTH_WIND_LINE = "North's Wind: the Bug-type lifts one of you back to your feet and the air itself runs faster.";

const lineOf = (speciesId: string): BugLine | null => (['caterpie', 'weedle'] as const).find((l) => (FLIGHT_NORTH.bugFamily[l] as readonly string[]).includes(speciesId)) ?? null;

/** Stage effects: `name` renames the lone Bug-type, `trust` raises its bond. Does nothing when it is not in the party. */
export function flightNorthEffect(run: RunState, e: { action: 'name' | 'trust'; name?: string }): string {
  const bug = run.party.length === 1 ? run.party[0] : undefined;
  if (!bug || !lineOf(bug.speciesId)) return '';
  if (e.action === 'name') {
    const name = (e.name ?? '').trim().slice(0, 12);
    if (!name) return '';
    bug.care = { ...(bug.care ?? {}), nickname: name } as PokemonInstance['care'];
    return `You name it ${name}`;
  }
  bug.friendship = Math.min(255, bug.friendship + FLIGHT_NORTH.trustGain);
  return 'It trusts you a little more';
}

/** The Bug-type is leaving the party (stage over, stage lost, or a new stage began): remember who it was. Once per run. */
export function rememberFlightBug(run: RunState, party: readonly PokemonInstance[]): void {
  if (run.expansion?.flightNorth || Number(run.story.flags['ev:kanto-flight-bug'] ?? 0) <= 0) return;
  const bug = party.length === 1 ? party[0] : undefined;
  const line = bug ? lineOf(bug.speciesId) : null;
  if (!bug || !line) return;
  run.expansion = { ...run.expansion, flightNorth: { line, name: bug.care?.nickname ?? '', friendship: bug.friendship, shiny: bug.shiny, state: 'ready' } } as RunState['expansion'];
}

/** True while the return can still save a lost run. Second Chance stays shut once Flight North exists in the run. */
export const flightNorthReady = (run: Pick<RunState, 'expansion'>): boolean => run.expansion?.flightNorth?.state === 'ready';
export const flightNorthClaimsRescue = (run: Pick<RunState, 'expansion'>): boolean => Boolean(run.expansion?.flightNorth);

/** The display name: the player's own name for it, else the species name. */
export function bugName(content: Content, fn: FlightNorthState): string {
  return fn.name || content.species.get(RETURN_FORMS[fn.line].species)?.name || RETURN_FORMS[fn.line].display;
}

export interface FlightNorthReturn { lines: string[]; name: string; display: string; music: string }

/** Everything the return does to the run, in place. The caller has already decided the loss is run-ending (rewinds and the jewel went first). */
export function applyFlightNorthReturn(content: Content, run: RunState): FlightNorthReturn {
  const battle = run.battle!;
  const fn = run.expansion!.flightNorth!;
  const form = RETURN_FORMS[fn.line];
  const name = bugName(content, fn);
  for (const mon of run.party) {
    mon.hp = maxHp(content, mon);
    mon.status = null;
  }
  battle.outcome = null;
  battle.activeIndex = 0;
  battle.flightNorth = true;
  const top = Math.max(...run.party.map((m) => m.level), 20);
  battle.finaleAssist = { id: 'flight-north', name, speciesId: form.returnSpecies, level: top, strikesLeft: FLIGHT_NORTH.assistStrikes };
  battle.rivalNote = [battle.rivalNote, `${name} is here. Your whole team is on its feet again.`].filter(Boolean).join(' ');
  run.expansion = { ...run.expansion, flightNorth: { ...fn, state: 'fighting' } } as RunState['expansion'];
  return { lines: [...CRACK_LINES, `${name} comes through the broken glass as ${form.display}.`, `"I was never gone. I only went north."`], name, display: form.display, music: RETURN_MUSIC };
}

/** After the return battle is won: the Bug-type, ready to be kept. It always has its Mega Stone and knows North's Wind. */
export function returnedBug(content: Content, run: RunState, make: (speciesId: string, level: number) => PokemonInstance): PokemonInstance | null {
  const fn = run.expansion?.flightNorth;
  if (!fn || fn.state !== 'fighting') return null;
  const form = RETURN_FORMS[fn.line];
  const level = Math.max(...run.party.map((m) => m.level), 20);
  const mon = make(form.species, level);
  mon.shiny = fn.shiny;
  mon.friendship = fn.friendship;
  mon.held = { ...(mon.held ?? {}), [form.stone]: 1 };
  if (fn.name) mon.care = { ...(mon.care ?? {}), nickname: fn.name } as PokemonInstance['care'];
  const wind = content.moves.get('norths-wind');
  if (wind) {
    if (mon.moves.length < 4) mon.moves.push({ id: wind.id, pp: wind.pp });
    else mon.moves[3] = { id: wind.id, pp: wind.pp };
  }
  return mon;
}

/** True when its Bond is at the maximum: it refuses to leave (it joins without asking). */
export const refusesToLeave = (run: Pick<RunState, 'expansion'>): boolean => (run.expansion?.flightNorth?.friendship ?? 0) >= 255;

export function markOffered(run: RunState, uid: string): void {
  const fn = run.expansion?.flightNorth;
  if (fn) run.expansion = { ...run.expansion, flightNorth: { ...fn, state: 'offered', uid } } as RunState['expansion'];
}

/** Keep or release decided. Returns the line to show. */
export function markDecided(run: RunState, mon: PokemonInstance, kept: boolean): string {
  const fn = run.expansion?.flightNorth;
  if (!fn || fn.uid !== mon.uid) return '';
  run.expansion = { ...run.expansion, flightNorth: { ...fn, state: kept ? 'kept' : 'released' } } as RunState['expansion'];
  return kept ? 'North\'s Wind is yours to carry now.' : 'It rises, turns once, and is gone into the north. Later you may see its shape cross the sky.';
}

/** Released: its silhouette crosses the sky in later regions. A short line for the region's first stage, or null. */
export function skySilhouette(run: Pick<RunState, 'expansion' | 'regionIndex'>): string | null {
  return run.expansion?.flightNorth?.state === 'released' && run.regionIndex > 0
    ? 'High above, a small winged shape crosses the sky from south to north and does not stop.' : null;
}
