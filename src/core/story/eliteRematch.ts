// Elite Four Rematches (S127): a player who has been winning a lot meets remixed Elite Four teams (other
// teams of the same member, new lead and ace). It reads only the win count, so no roll moves. The remix
// itself is the existing `remixedMembers` (hashed, levels stay on the curve).

import type { Content } from '../contentSchema';
import type { RunState } from '../state';

/** Whether the Elite Four remix their teams for this run: battles won so far, per region (this one included), reach the setting. */
export function eliteRematchDue(content: Content, run: Pick<RunState, 'log' | 'regionIndex'>): boolean {
  const cfg = content.balance.eliteRematch;
  if (!cfg.enabled) return false;
  return run.log.battlesWon / (run.regionIndex + 1) >= cfg.winsPerRegion;
}
