// Pidgey's Resolve: the two CPU-versus-CPU fights (the opening branch, the cliff finale) are played on the real battle engine and shown
// on the real battle scene, like a player's fight with both sides run by the AI. The player's own team and Bag are set aside while it
// runs (`sky.stash`) and put back when it ends; nothing in the fight counts (no EXP, money, drops or catches).
//
// Flow: the event's battle starts (core/events.ts startEventBattle) -> prepareSpectate swaps the party -> shapeSpectateFoe builds the
// other side and marks the battle -> the scene plays every turn by itself (it never shows a menu) and, in the finale, asks the player
// who to cheer for the first time Pidgeot is under 35% HP (cheerSky) -> takeTurn hands the end to finishSpectate.

import type { Content } from '../contentSchema';
import { maxHp } from '../pokemon';
import { newMon } from '../run';
import type { PokemonInstance, RunState } from '../state';
import { addItem } from '../items';
import { SKY_BALANCE, SKY_FLY_ITEM, fearowLevel, fearowMoves, pidgeotLevel, pushRoom, skyOf } from './story';
import type { SkyState } from './state';
import { DUEL_HEADER, duelResult, endingLine, finaleEnd } from './text';

export const SPECTATE_EVENTS: ReadonlySet<string> = new Set(['sky.opening', 'sky.finale']);

const setMoves = (content: Content, mon: PokemonInstance, ids: readonly string[]): void => {
  mon.moves = ids.filter((id) => content.moves.has(id)).slice(0, 4).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
};

const heldOf = (gifts: readonly string[]): Record<string, number> => {
  const held: Record<string, number> = {};
  for (const id of gifts) held[id] = (held[id] ?? 0) + 1;
  return held;
};

/** Sets the player's team and Bag aside and puts the player-side bird in the party. Called when the event battle starts, before the battle exists. */
export function prepareSpectate(content: Content, run: RunState, eventId: string): void {
  const sky = skyOf(run);
  if (!sky || !SPECTATE_EVENTS.has(eventId) || sky.stash) return;
  sky.stash = { party: structuredClone(run.party), inventory: structuredClone(run.inventory) };
  const finale = eventId === 'sky.finale';
  const mon = newMon(content, run, finale ? 'pidgeot' : 'pidgey', finale ? pidgeotLevel(content, run, sky) : SKY_BALANCE.duelLevel, 'p');
  if (finale) {
    mon.fixedAbility = 'scrappy';
    mon.held = heldOf(sky.gifts);
    setMoves(content, mon, ['wing-attack', 'quick-attack', 'air-slash', 'agility']);
  }
  mon.hp = maxHp(content, mon);
  run.party = [mon];
  run.inventory = {};
}

/** Builds the other bird and marks the battle as watched. */
export function shapeSpectateFoe(content: Content, run: RunState, sky: SkyState, eventId: string): void {
  const battle = run.battle;
  if (!battle) return;
  const finale = eventId === 'sky.finale';
  const level = finale ? fearowLevel(content, run, sky) : SKY_BALANCE.duelLevel;
  const foe = newMon(content, run, finale ? 'fearow' : 'spearow', level, 'e');
  if (finale) setMoves(content, foe, fearowMoves(sky));
  foe.hp = maxHp(content, foe);
  battle.enemyTeam[0] = foe;
  battle.spectate = finale ? { kind: 'finale', cheerAt: SKY_BALANCE.cheerThreshold } : { kind: 'duel' };
}

/** True when the scene must ask the player who to cheer for now: the finale, not asked yet, and Pidgeot is under the threshold. */
export function cheerDue(content: Content, run: RunState): boolean {
  const spec = run.battle?.spectate;
  if (!spec || spec.cheerAt === undefined || spec.cheered !== undefined || run.battle!.outcome) return false;
  const mon = run.party[run.battle!.activeIndex];
  return !!mon && mon.hp > 0 && mon.hp / maxHp(content, mon) < spec.cheerAt;
}

/** The player's cheer: Pidgeot Mega Evolves from resolve alone, or Pidgeot is furious (Attack +2). */
export function cheerSky(content: Content, run: RunState, bird: 'pidgeot' | 'fearow'): string {
  const battle = run.battle;
  const sky = skyOf(run);
  if (!battle?.spectate || !sky || battle.spectate.cheered !== undefined) return '';
  battle.spectate.cheered = bird;
  sky.finale = { ...sky.finale, asked: true, cheer: bird };
  const mon = run.party[battle.activeIndex];
  if (bird === 'pidgeot') {
    if (mon) mon.skyMega = true;
    return "Pidgeot's resolve is unwavering!";
  }
  battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 2);
  return 'Pidgeot is furious!';
}

/** The watched fight is over: the real team and Bag come back, the story moves on, and the lines to read are returned. */
export function finishSpectate(content: Content, run: RunState, outcome: 'win' | 'lose'): string[] {
  const sky = skyOf(run);
  const spec = run.battle?.spectate;
  if (!sky || !spec) return [];
  if (sky.stash) {
    run.party = sky.stash.party as RunState['party'];
    run.inventory = sky.stash.inventory;
    delete sky.stash;
  }
  run.battle = null;
  run.phase = 'map';
  const lines: string[] = [];
  if (spec.kind === 'duel') {
    const winner = outcome === 'win' ? 'pidgey' : 'spearow';
    sky.duelWinner = winner;
    lines.push(...duelResult(sky.backed, winner));
    if (sky.backed === 'pidgey' && winner === 'pidgey') {
      sky.phase = 'done';
      sky.ending = 'hm';
      addItem(run.inventory, SKY_FLY_ITEM, 1);
      lines.push('You are given a Flying HM.');
    }
    return lines;
  }
  const winner = outcome === 'win' ? 'pidgeot' : 'fearow';
  const cheer = spec.cheered === 'pidgeot' || spec.cheered === 'fearow' ? spec.cheered : undefined;
  sky.finale = { ...sky.finale, asked: cheer !== undefined, ...(cheer ? { cheer } : {}), winner };
  lines.push(...finaleEnd(winner, cheer));
  const end = (ending: NonNullable<SkyState['ending']>): void => {
    sky.ending = ending;
    sky.phase = 'done';
    lines.push(endingLine(ending));
  };
  if (winner === 'pidgeot' && cheer === 'pidgeot') pushRoom(run, 'sky.join.pidgeot');
  else if (winner === 'pidgeot') end(cheer === 'fearow' ? 'pidgeot-left' : 'pidgeot-alone');
  else if (cheer === 'fearow') pushRoom(run, 'sky.join.fearow');
  else end('fearow-alone');
  return lines;
}

export { DUEL_HEADER };
