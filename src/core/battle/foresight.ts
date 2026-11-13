// Beta 0.6 Foresight Tax (Oracle Sabrina, Blackout's Triad anchor): while the rule `foresight` is on, the first move the player
// chooses each turn is revealed to her before she chooses. The reveal is announced every turn. It stops for the rest of the
// battle once any of her Pokémon has fainted. The reveal changes only what she expects to take (see `threat` in engine.ts's
// Advanced AI read) and makes her choose her best move that turn; it draws no random number of its own.

import type { BattleEvent } from './engine';
import type { BattleState } from '../state';

export const foresightOn = (battle: BattleState): boolean => Boolean(battle.eventRule?.foresight) && !battle.foresight?.ended;

/**
 * Called once per turn, before the enemy picks. Returns the revealed move id (or null when nothing is revealed this turn: a
 * switch, an item, or the foresight is over) and writes the announcement.
 */
export function foresightBegin(battle: BattleState, playerMoveId: string | null, events: BattleEvent[]): string | null {
  if (!battle.eventRule?.foresight) return null;
  const fs = (battle.foresight ??= { ended: false, revealed: null });
  if (!fs.ended && battle.enemyTeam.some((m) => m.hp <= 0)) {
    fs.ended = true;
    fs.revealed = null;
    events.push({ type: 'raid', tone: 'warn', text: 'Sabrina loses the thread. Her Foresight Tax is over for this battle.' });
  }
  if (fs.ended) return null;
  fs.revealed = playerMoveId;
  events.push({
    type: 'raid',
    tone: 'warn',
    text: playerMoveId ? `Foresight Tax: Sabrina sees your move before she chooses (${playerMoveId.replace(/-/g, ' ')}).` : 'Foresight Tax: Sabrina sees what you are about to do before she chooses.',
  });
  return playerMoveId;
}
