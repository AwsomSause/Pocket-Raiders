// Beta 0.6 E1: where the Dossier fills. Each table says which cast characters a run meets at a known story beat. Every
// write goes through `recordCast`, so meeting twice changes nothing and no random stream is touched. Ids are checked
// against the cast data by tests/unit/dossier.test.ts.

import type { RunState } from '../../state';
import { recordCast, type CastStatus } from './dossier';

type Meeting = string | [id: string, status: CastStatus];
const meet = (run: RunState, list: readonly Meeting[]): void => {
  for (const m of list) typeof m === 'string' ? recordCast(run, m) : recordCast(run, m[0], m[1]);
};

/** Kanto story events (`xe.kanto.*`) and the other named scenes where a cast member is on the page. */
export const EVENT_MEETINGS: Record<string, readonly Meeting[]> = {
  'xe.kanto.appointment': ['sc.rocket.matori'],
  'xe.kanto.harbor-export': ['sc.rocket.triad-surge'],
  'xe.kanto.blaine-defects': ['sc.rocket.blaine'],
  'xe.kanto.madame-call': ['sc.rocket.madame-boss'],
  'xe.kanto.trio-conscience': ['sc.rocket-remnants.disguises'],
  'kanto-amber-lab': ['sc.rocket.namba'],
  'grand-arc-ein': ['sc.rocket.ein'],
  'rainbow-rocket': ['sc.rocket-remnants.rainbow-giovanni'],
};

/** Kanto canon spaces (Kanto run events): the person who runs that place for Rocket. */
export const CANON_MEETINGS: Record<string, readonly Meeting[]> = {
  'cs.kanto.pewter.moon': ['sc.rocket.griggs'],
  'cs.kanto.pewter.moon.mine': ['sc.rocket.griggs'],
  'cs.kanto.vermilion.ssanne': ['sc.rocket.triad-surge'],
  'cs.kanto.celadon.gamecorner': ['sc.rocket.vesper'],
  'cs.kanto.celadon.mansion': ['sc.rocket.matori'],
  'cs.kanto.fuchsia.safari': ['sc.rocket.rudd', 'sc.rocket.triad-koga'],
  'cs.kanto.fuchsia.savanna': ['sc.rocket.rudd'],
  'cs.kanto.fuchsia.jungle': ['sc.rocket.triad-koga'],
  'cs.kanto.saffron.silph': ['sc.rocket.triad-sabrina'],
  'cs.kanto.saffron.labyrinth': ['sc.rocket.triad-sabrina'],
  'cs.kanto.cinnabar.lab': ['sc.rocket.namba', 'sc.rocket.blaine'],
};

/** Kanto's Rocket Ledger: reaching a step puts the person behind it in the Dossier (the step's rule is theirs). */
export const TRACK_MEETINGS: Record<number, readonly Meeting[]> = {
  1: ['sc.rocket.matori'],
  2: ['sc.rocket.vesper'],
  3: ['sc.rocket.triad-surge'],
  4: ['sc.rocket.rudd'],
  5: ['sc.rocket.madame-boss'],
};

/** After an event is played. */
export function meetFromEvent(run: RunState, event: { id: string; canon?: string | null }): void {
  meet(run, EVENT_MEETINGS[event.id] ?? []);
  if (event.canon) meet(run, CANON_MEETINGS[event.canon] ?? []);
}

/** After Kanto's track moves: everyone up to the highest step reached. */
export function meetFromTrack(run: RunState, regionId: string, peak: number): void {
  if (regionId !== 'kanto') return;
  for (let s = 1; s <= peak; s++) meet(run, TRACK_MEETINGS[s] ?? []);
}

/** Joining Rocket as the Inside Man: the player's own file ("House Card"). */
export function meetFromJoin(run: RunState, team: string): void {
  if (team === 'rocket') meet(run, ['sc.rocket.player-agent']);
}

/** The Side-with rival is the insider on an Inside Job against Rocket. */
export function meetFromInsideJob(run: RunState): void {
  if (run.story.evil?.teamId === 'rocket') meet(run, ['sc.rocket.rival-ace']);
}
