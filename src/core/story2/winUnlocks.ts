// The "win" unlock route for Remembrance lines (Design v2 Part II): win a Story Run with a matching Pokémon on your team and the
// line joins the Remembrance Archive. `unlock.arg` is `type:<type>` (a party member of that type). Pure; no RNG.

import type { RunState } from '../state';
import type { StoryData } from './schema';

/** Words for the locked-line hint, e.g. `type:rock` becomes "Win a Story Run with a Rock-type Pokémon on your team." */
export function winHint(arg: string | undefined): string {
  const m = /^type:([a-z]+)$/.exec(arg ?? '');
  return m ? `Win a Story Run with a ${m[1]![0]!.toUpperCase()}${m[1]!.slice(1)}-type Pokémon on your team.` : 'Win a run to unlock.';
}

/** Ids of the "win" lines this finished run unlocks. Empty unless the run is a won Story Run. */
export function winUnlocks(data: Pick<StoryData, 'remembrances'>, run: Pick<RunState, 'victory' | 'party'>, typesOf: (speciesId: string) => readonly string[]): string[] {
  if (run.victory !== true) return [];
  const partyTypes = new Set(run.party.flatMap((p) => typesOf(p.speciesId)));
  return data.remembrances.filter((r) => {
    if (r.status === 'disabled' || r.unlock.kind !== 'win') return false;
    const m = /^type:([a-z]+)$/.exec(r.unlock.arg ?? '');
    return !!m && partyTypes.has(m[1]!);
  }).map((r) => r.id);
}
