// Greenneedle gn.new.12, The Cartographer (doc GREENNEEDLE_PLACED_1.md lines 450–478).
// A Xatu shows the stage's whole map, then one image drawn from the run's seed: a place, a silhouette or a number. It will happen.
//  1 a place: a later region of this run (true once the run enters it);
//  2 a silhouette: a Pokémon of this region not met yet (it turns up far more often for the rest of the run; true once it is met);
//  3 a number: a level above the lead's (true once any Pokémon of yours reaches it).
// Only a Legendary Blessing's Communion can change the image (the Xatu's second visit). Flags live in `run.story.flags` as `ev:xatu-*`.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { isNative, wildEligibleSpecies } from '../themes';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const SIL = 'ev:xatu-sp:';

export const xatuKind = (run: Pick<RunState, 'story'>): number => f(run, 'xatu-prophecy');
const silhouette = (run: Pick<RunState, 'story'>): string | null => {
  const hit = Object.keys(run.story.flags).find((k) => k.startsWith(SIL) && Number(run.story.flags[k]) > 0);
  return hit ? hit.slice(SIL.length) : null;
};

/** Draws the image (kind by the stop's seeded roll). `again`: a second draw after Communion, never the same kind of image twice in a row. */
export function xatuDraw(content: Content, run: RunState, float: () => number, again: boolean): string {
  const lastKind = again ? xatuKind(run) : 0;
  const hasLater = run.regionIndex + 1 < run.regionOrder.length;
  const seen = new Set(run.log.speciesSeen);
  const region = run.regionOrder[run.regionIndex];
  const pool = wildEligibleSpecies(content)
    .filter((s) => s.evolutionStage === 1 && !seen.has(s.id))
    .map((s) => s.id)
    .sort();
  const kinds = [1, 2, 3].filter((k) => k !== lastKind && (k !== 1 || hasLater) && (k !== 2 || pool.length > 0));
  const kind = kinds[Math.min(kinds.length - 1, Math.floor(float() * kinds.length))]!;
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(SIL)) delete run.story.flags[k];
  set(run, 'xatu-prophecy', kind);
  if (kind === 1) {
    const later = run.regionOrder.length - run.regionIndex - 1;
    set(run, 'xatu-region', run.regionIndex + 2 + Math.min(later - 1, Math.floor(float() * later)));
  } else if (kind === 2) {
    // A Pokémon of this region first (its natives), else any unmet one.
    const natives = pool.filter((id) => isNative(content, content.species.get(id)!, region));
    const from = natives.length > 0 ? natives : pool;
    run.story.flags[`${SIL}${from[Math.min(from.length - 1, Math.floor(float() * from.length))]!}`] = 1;
  } else {
    const lead = Math.max(...run.party.map((m) => m.level), 1);
    set(run, 'xatu-number', lead + 6 + Math.floor(float() * 5));
  }
  if (again) set(run, 'xatu-changed', 1);
  return '';
}

/** Has it happened? */
export function xatuTrue(run: RunState): boolean {
  const kind = xatuKind(run);
  if (kind === 1) return run.regionIndex + 1 >= f(run, 'xatu-region');
  if (kind === 2) {
    const sp = silhouette(run);
    return !!sp && run.log.speciesSeen.includes(sp);
  }
  if (kind === 3) return [...run.party, ...run.box].some((m) => m.level >= f(run, 'xatu-number'));
  return false;
}

/** The last rest of the last stage of the last region. */
export function finalRest(content: Content, run: RunState, stagesPerRegion: number): boolean {
  return run.regionIndex + 1 >= run.regionOrder.length && (run.stage?.index ?? 0) + 1 >= stagesPerRegion;
}

/** The silhouette is far likelier than the rest of its pool for the rest of the run. */
export const xatuWildWeight = (run: Pick<RunState, 'story'>, speciesId: string): number => (xatuKind(run) === 2 && silhouette(run) === speciesId ? 20 : 1);

/** Tokens `{xatu:image}` (the image, in the Xatu's words), `{xatu:map}` (what the Xatu does with the map). */
export function xatuTokens(content: Content, run: RunState, text: string): string {
  return text.replace(/\{xatu:image\}/g, () => {
    const kind = xatuKind(run);
    if (kind === 1) return `A place: ${content.regions.get(run.regionOrder[f(run, 'xatu-region') - 1] ?? '')?.name ?? 'a far region'}, and you, walking into it.`;
    if (kind === 2) {
      const sp = silhouette(run);
      return `A silhouette on a ridge, with the outline of a ${content.species.get(sp ?? '')?.name ?? 'Pokémon'}.`;
    }
    return `A number, in a child's chalk: ${f(run, 'xatu-number')}. It is a level. It is yours.`;
  });
}
