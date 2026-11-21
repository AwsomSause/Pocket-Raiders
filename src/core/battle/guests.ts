// Allies the game controls ("guests"): temporary Pokémon that fight on the player's side of a double or triple battle.
//
// A guest is a real Pokémon at the end of the party for one battle. It stands in one of the player's spots, is drawn like any
// other Pokémon, picks its own move each turn (guestChoice in doubles.ts: its best move, no random numbers), can be hit and can
// faint, and goes home when the battle ends or when its turns are up. The player never commands it and can't send it out.
// The field holds three Pokémon a side at most, so more allies than free spots wait behind and take turns (`rotate`).
//
// This file is the small shared part (who is a guest); the field work is in doubles.ts ("guest allies"). No Phaser, no RNG.

import type { BattleState } from '../state';

type GuestView = Pick<BattleState, 'guests'> | null | undefined;

/** True when `uid` is an ally the game controls in this battle. */
export const isGuest = (battle: GuestView, uid: string | undefined): boolean => !!uid && !!battle?.guests?.uids.includes(uid);

/** True when `uid` is in the party for this battle only: the ally you command (`loaner`) or one the game controls. */
export const isTempAlly = (battle: (GuestView & Pick<BattleState, 'loaner'>) | null | undefined, uid: string | undefined): boolean =>
  !!uid && !!battle && (battle.loaner === uid || isGuest(battle, uid));

/** True when this spot was added to make room for allies: on your side only allies stand there, on the foe's it stays empty. */
export const closedSpot = (battle: GuestView, side: 'player' | 'enemy', spot: number): boolean => !!battle?.guests?.closed?.[side].includes(spot);

const GRUDGE = 'guest-grudge:';
/** A story rule (gn.25) asks an ally to use its next move on one foe: remembered until that ally next picks a move. */
export function guestGrudge(battle: Pick<BattleState, 'storyEffects'>, guestUid: string, foeUid: string): void {
  battle.storyEffects = [...battle.storyEffects.filter((t) => !t.startsWith(`${GRUDGE}${guestUid}:`)), `${GRUDGE}${guestUid}:${foeUid}`];
}
/** The foe this ally was asked to go for (its uid), taken off the list; undefined when there is none. */
export function takeGrudge(battle: Pick<BattleState, 'storyEffects'>, guestUid: string): string | undefined {
  const tag = battle.storyEffects.find((t) => t.startsWith(`${GRUDGE}${guestUid}:`));
  if (!tag) return undefined;
  battle.storyEffects = battle.storyEffects.filter((t) => t !== tag);
  return tag.slice(`${GRUDGE}${guestUid}:`.length);
}
