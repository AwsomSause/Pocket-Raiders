// Beta 0.6 E1: where the Dossier fills. Each table says which cast characters a run meets at a known story beat. Every
// write goes through `recordCast`, so meeting twice changes nothing and no random stream is touched. Ids are checked
// against the cast data by tests/unit/dossier.test.ts.

import type { RunState } from '../../state';
import { ALOLA_PALDEA_MEETINGS } from './meetRegions';
import { SINNOH_HOENN_BOSS_CAST, SINNOH_HOENN_EVENT_MEETINGS, SINNOH_HOENN_TRACK_MEETINGS } from './meetSinnohHoenn';
import { beatTeamHeads, markBeaten, recordCast, type CastStatus } from './dossier';

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
  'xe.kalos.boutique': ['sc.flare.garance'],
  'xe.kalos.cafe': ['sc.flare.sycamore', 'sc.flare.diantha'],
  'xe.kalos.tall-man': ['sc.flare.az'],
  'xe.kalos.courier': ['sc.flare.alain'],
  'xe.kalos.under-time': ['sc.flare.venus'],
  'xe.kalos.essentia': ['sc.flare.essentia'],
  'xe.galar.ball-guy': ['sc.macro-cosmos.ball-guy'],
  'xe.galar.road-closed': ['sc.yell.gaz', 'sc.yell.shaz'],
  'xe.galar.mine': ['sc.macro-cosmos.peony'],
  'xe.galar.their-majesties': ['sc.macro-cosmos.sordward', 'sc.macro-cosmos.shielbert'],
  'xe.galar.partner-firm': ['sc.macro-cosmos.ardos'],
  'xe.galar.gig': ['sc.yell.piers', 'sc.yell.marnie'],
  'kanto-amber-lab': ['sc.rocket.namba'],
  'grand-arc-ein': ['sc.rocket.ein'],
  'rainbow-rocket': ['sc.rocket-remnants.rainbow-giovanni'],
  ...ALOLA_PALDEA_MEETINGS,
  ...SINNOH_HOENN_EVENT_MEETINGS,
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

/** Every other region's track: reaching a step puts the person behind it in the Dossier. */
export const TRACK_MEETINGS_BY_REGION: Record<string, Record<number, readonly Meeting[]>> = {
  kanto: TRACK_MEETINGS,
  ...SINNOH_HOENN_TRACK_MEETINGS,
  kalos: { 1: ['sc.flare.garance'], 2: ['sc.flare.corbeau'], 3: ['sc.flare.valerie'], 4: ['sc.flare.venus'], 5: ['sc.flare.essentia'] },
  galar: { 1: ['sc.macro-cosmos.ball-guy'], 2: ['sc.yell.gaz'], 3: ['sc.macro-cosmos.sordward'], 4: ['sc.macro-cosmos.hollis'], 5: ['sc.macro-cosmos.pryce'] },
};

/** After an event is played. */
export function meetFromEvent(run: RunState, event: { id: string; canon?: string | null }): void {
  meet(run, EVENT_MEETINGS[event.id] ?? []);
  if (event.canon) meet(run, CANON_MEETINGS[event.canon] ?? []);
}

/** After a region's track moves: everyone up to the highest step reached. */
export function meetFromTrack(run: RunState, regionId: string, peak: number): void {
  const table = TRACK_MEETINGS_BY_REGION[regionId];
  if (!table) return;
  for (let s = 1; s <= peak; s++) meet(run, table[s] ?? []);
}

/** Joining Rocket as the Inside Man: the player's own file ("House Card"). */
export function meetFromJoin(run: RunState, team: string): void {
  if (team === 'rocket') meet(run, ['sc.rocket.player-agent']);
}

/** The Side-with rival is the insider on an Inside Job against Rocket. */
export function meetFromInsideJob(run: RunState): void {
  if (run.story.evil?.teamId === 'rocket') meet(run, ['sc.rocket.rival-ace']);
}

/** Boss and leader battles (game ids) that are also cast characters. A win marks them beaten. */
export const BOSS_CAST: Record<string, string> = {
  sabrina: 'sc.rocket.triad-sabrina',
  koga: 'sc.rocket.triad-koga',
  'lt-surge': 'sc.rocket.triad-surge',
  blaine: 'sc.rocket.blaine',
  ...SINNOH_HOENN_BOSS_CAST,
};

/** A gym leader, Elite Four or Champion fight was won. */
export function beatBoss(run: RunState, leaderId: string | null | undefined): void {
  const id = leaderId && BOSS_CAST[leaderId];
  if (id) markBeaten(run, id);
}

/** A story raid result: a win (triumph or success) beats the team's Executives and Seconds; any other result except declined only meets them. */
export function fromRaidResult(run: RunState, team: string, result: string, meetHeads: (run: RunState, team: string) => unknown): void {
  if (result === 'declined') return;
  meetHeads(run, team);
  if (result === 'triumph' || result === 'success') beatTeamHeads(run, team);
}

/** The run's team climax was won. */
export function beatClimax(run: RunState): void {
  const team = run.story.evil?.teamId;
  if (team) beatTeamHeads(run, team);
}
