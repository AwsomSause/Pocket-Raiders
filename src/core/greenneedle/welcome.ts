// gn.new.18 The Day the Center Closed: Standing Welcome. For the rest of the region the first heal at any Center also gives back
// one Revive, up to the normal cap (balance.itemCaps.revivesPerBattle). Flags: `standing-welcome` (the region it was earned in, stamped
// by the event's stampRegion) and `welcome-used` (the region it was last paid in).
import type { RunState } from '../state';
import { gnFlag, setGnFlag } from './index';

export const WELCOME = { earned: 'standing-welcome', used: 'welcome-used' } as const;

/** Called at a Center heal. Returns a line to add to the message, or '' when nothing was given. */
export function standingWelcome(run: RunState, cap: number): string {
  const here = run.regionIndex + 1;
  if (gnFlag(run, WELCOME.earned) !== here || gnFlag(run, WELCOME.used) === here) return '';
  setGnFlag(run, WELCOME.used, here);
  if ((run.inventory.revive ?? 0) >= cap) return 'The desk waves you through: your Revives are already full.';
  run.inventory.revive = (run.inventory.revive ?? 0) + 1;
  return 'Standing Welcome: the Chansey at the desk presses a Revive into your hands. "On the house."';
}
