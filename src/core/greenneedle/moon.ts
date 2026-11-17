// Mt. Moon (gn.04): "if an evil-team raid touched this cave". A raid is one of the region's Evil Team Operations (evil/teams.ts, E2:
// a stopped Operation is a raid won, one that went through, lost or left alone, is a raid lost). Read when the player walks into the cave.
import type { RunState } from '../state';

export const MOON_RAID_WON = 'team-raid-moon-won';
export const MOON_RAID_LOST = 'team-raid-moon-lost';

/** 'won' when the player stopped an Operation in this region, 'lost' when one went through (lost, left alone or helped) and none was stopped, else 'none'. */
export function moonRaid(run: Pick<RunState, 'story' | 'regionIndex'>): 'won' | 'lost' | 'none' {
  const here = (run.story.evil?.ops ?? []).filter((op) => op.region === run.regionIndex);
  if (here.some((op) => op.outcome === 'foiled' || op.outcome === 'infiltrated')) return 'won';
  if (here.some((op) => op.outcome === 'succeeded' || op.outcome === 'joined')) return 'lost';
  return 'none';
}
