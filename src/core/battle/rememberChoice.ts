// Overhaul slice 6, "Remember the last choice": which move to highlight on the move menu.
// Pure and presentation-only: it never picks or runs a move for the player, only says where the cursor starts.

/**
 * Where the move-menu cursor should start. `lastMoveId` is the move this Pokémon used last, if any.
 * `usable[i]` says whether slot i can be chosen right now (PP left, not Disabled, not Choice-locked, not Taunted...).
 * Returns the remembered move's slot when it is usable; when it is not, the next usable slot after it (wrapping);
 * null when there is nothing to remember, so the menu keeps its normal first-usable default.
 */
export function defaultMoveIndex(moveIds: readonly string[], usable: readonly boolean[], lastMoveId: string | undefined, enabled = true): number | null {
  if (!enabled || !lastMoveId) return null;
  const at = moveIds.indexOf(lastMoveId);
  if (at < 0) return null; // The move was forgotten or replaced: start from the normal default.
  for (let step = 0; step < moveIds.length; step++) {
    const i = (at + step) % moveIds.length;
    if (usable[i]) return i;
  }
  return null;
}
