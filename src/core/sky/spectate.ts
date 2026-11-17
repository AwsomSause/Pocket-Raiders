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
import { SKY_BALANCE, SKY_FLY_ITEM, fearowLevel, fearowMoves, pidgeotLevel, pushRoom, scheduleLevel, skyOf, sparBoost } from './story';
import type { SkyState } from './state';
import { DUEL_HEADER, duelResult, endingLine, finaleEnd } from './text';

export const SPECTATE_EVENTS: ReadonlySet<string> = new Set(['sky.opening', 'sky.finale']);
/** Kice (2026-11-16): the player plays none of this story's fights. The spar and the rematch are watched too: the player's lead fights by itself. */
export const OWN_WATCH_EVENTS: ReadonlySet<string> = new Set(['sky.meet', 'sky.rematch']);

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
  if (sky && !sky.stash && OWN_WATCH_EVENTS.has(eventId)) {
    // The spar and the rematch: a healthy copy of the lead fights by itself; the real team and Bag wait untouched, so nothing counts.
    const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
    if (!lead) return;
    sky.stash = { party: structuredClone(run.party), inventory: structuredClone(run.inventory), own: true };
    const copy = structuredClone(lead);
    copy.hp = maxHp(content, copy);
    copy.status = null;
    run.party = [copy];
    run.inventory = {};
    return;
  }
  if (!sky || !SPECTATE_EVENTS.has(eventId) || sky.stash) return;
  sky.stash = { party: structuredClone(run.party), inventory: structuredClone(run.inventory) };
  const finale = eventId === 'sky.finale';
  const mon = newMon(content, run, finale ? 'pidgeot' : 'pidgey', finale ? pidgeotLevel(content, run, sky) : scheduleLevel(content, run), 'p');
  if (finale) {
    mon.fixedAbility = 'scrappy';
    mon.held = heldOf(sky.gifts);
    setMoves(content, mon, ['wing-attack', 'quick-attack', 'air-slash', 'agility']);
    // gn.02: each spar adds +2% to its stats, to a cap of 12%.
    const pct = sparBoost(sky);
    if (pct > 0) mon.statBoosts = { hp: pct, atk: pct, def: pct, spa: pct, spd: pct, spe: pct };
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
  const level = finale ? fearowLevel(content, run, sky) : scheduleLevel(content, run);
  const foe = newMon(content, run, finale ? 'fearow' : 'spearow', level, 'e');
  if (finale) setMoves(content, foe, fearowMoves((run.stage?.index ?? 0) + 1));
  foe.hp = maxHp(content, foe);
  battle.enemyTeam[0] = foe;
  battle.spectate = finale ? { kind: 'finale', cheerAt: SKY_BALANCE.cheerThreshold } : { kind: 'duel' };
}

/** True while the spar or the rematch is being watched (the player's own lead, played by the AI). */
export const ownWatching = (run: RunState): boolean => skyOf(run)?.stash?.own === true;

/** The watched spar or rematch is over: the real team and Bag come back exactly as they were. */
export function endOwnWatch(run: RunState): void {
  const sky = skyOf(run);
  if (!sky?.stash?.own) return;
  run.party = sky.stash.party as RunState['party'];
  run.inventory = sky.stash.inventory;
  delete sky.stash;
}

/** True when the scene must ask the player who to cheer for now: the finale, not asked yet, and Pidgeot is at or under the threshold (1: always, before the first turn). */
export function cheerDue(content: Content, run: RunState): boolean {
  const spec = run.battle?.spectate;
  if (!spec || spec.cheerAt === undefined || spec.cheered !== undefined || run.battle!.outcome) return false;
  const mon = run.party[run.battle!.activeIndex];
  return !!mon && mon.hp > 0 && mon.hp / maxHp(content, mon) <= spec.cheerAt;
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
    } else if (winner === 'pidgey') {
      // gn.02: backed the Spearow and it lost: nothing. It leaves, and the story never begins.
      sky.phase = 'done';
      sky.ending = 'spearow-lost';
    } else if (sky.backed === 'spearow') {
      run.story.flags['ev:pidgey-backed-spearow'] = 1;
    }
    run.story.flags['ev:pidgey-story'] = sky.phase === 'rivalry' ? 1 : 0;
    // gn.13 Flight North: the bully is from this Spearow's flock when it was seen in the same region.
    run.story.flags['ev:spearow-seen-region'] = run.regionIndex + 1;
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
  else if (cheer === 'pidgeot') {
    // gn.02: "Nothing now. Next region, the story continues from S1, with a Pidgeot that's one stage wiser."
    lines.push('Pidgeot drags itself to the cliff edge and looks at the sky. It is not finished. Next region, it will be one stage wiser.');
    sky.region += 1;
    sky.wiser += 1;
    sky.finale = { asked: false };
    sky.metStages = [];
  } else end('fearow-alone');
  return lines;
}

export { DUEL_HEADER };
