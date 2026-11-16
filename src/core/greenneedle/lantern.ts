// Greenneedle gn.new.36, The Lantern Sea (doc GREENNEEDLE_PLACED_2.md lines 574–605).
// A night bay of Chinchou and Lanturn. The diver trades a pearl for one true event of this run; a boat can carry the name of
// one lost or let go (this run only); the Lanturn at the jetty lights it out to sea.
import type { RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};

/** The run's three most memorable chronicle entries, most memorable first (ties: the later one). */
export function lanternStories(run: Pick<RunState, 'story'>): string[] {
  return [...(run.story.chronicle ?? [])]
    .filter((e) => e.text.trim().length > 0)
    .sort((a, b) => b.importance - a.importance || b.seq - a.seq)
    .slice(0, 3)
    .map((e) => e.text.trim());
}

/** Holds when the nth (1–3) true event is there to tell. */
export const lanternHasStory = (run: Pick<RunState, 'story'>, n: number): boolean => lanternStories(run).length >= n;

/** One of them lost for good this run (a memorial name, or a story that set `lost-mon`). */
export const lanternLost = (run: Pick<RunState, 'story' | 'nuzlocke'>): boolean => (run.nuzlocke?.memorial.length ?? 0) > 0 || f(run, 'lost-mon') > 0;

/** One of them let go this run (released for candies, or a story that set `abandoned-mon`). */
export const lanternLetGo = (run: Pick<RunState, 'story' | 'log'>): boolean => (run.log.counters.caughtToCandies ?? 0) > 0 || f(run, 'abandoned-mon') > 0;

/** Arriving: one more visit this run. */
export function lanternArrive(run: Pick<RunState, 'story'>): string {
  set(run, 'ls-visits', f(run, 'ls-visits') + 1);
  for (const k of ['ls-boat', 'ls-child', 'ls-pearl']) delete run.story.flags[`ev:${k}`];
  return '';
}

/** The diver writes down story n (1–3), and the flag remembers which. */
export function lanternPearl(run: Pick<RunState, 'story'>, n: number): string {
  const story = lanternStories(run)[n - 1];
  if (!story) return '';
  set(run, 'ls-pearl', n);
  return `Caspar-Wyn writes it down on a strip of paper, folds it small and puts it in a shell: "${story}"`;
}

/** Tokens: {lsea:s1} {lsea:s2} {lsea:s3} (the true events on offer). */
export function lanternTokens(run: Pick<RunState, 'story'>, text: string): string {
  const s = lanternStories(run);
  return text
    .replaceAll('{lsea:s1}', s[0] ?? '')
    .replaceAll('{lsea:s2}', s[1] ?? '')
    .replaceAll('{lsea:s3}', s[2] ?? '');
}
