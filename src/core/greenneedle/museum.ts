// Greenneedle gn.41, the Pokémon Museum: each region's museum is its own. gn op `museumArrive` picks, for this region's museum, the
// label that is wrong on purpose (`museum-wrong`, 1 to 6), always one the player could know from this run: the bell (they've rung one
// like it), the net (they've seen the factory stamp), the portrait (her face is on a statue on a cliff), the footprint (they've seen what
// made it), the tablet (the marks are letters). Each region uses one not used yet; if the player hasn't done any linked event, the sixth
// kind (a date the museum's own History wall contradicts). It also casts the locked gallery's resident (`@museum-secret`) and records
// which region's Legendary hall to show (`museum-region`, 1 = Kanto ... 9 = Paldea).
import type { RunState } from '../state';

export const MUSEUM_REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'] as const;
/** The run flags that let the player know each wrong label (any one is enough). */
export const MUSEUM_LINKS: readonly (readonly string[])[] = [
  ['sunken-bell', 'lost-island-bell-rung'],
  ['kaiju-entered', 'factory-entered'],
  ['maiden-entered'],
  ['giants-entered'],
  ['cavern-entered'],
];
/** The locked gallery's resident, by region (in turn): a Sigilyph; a Golett that dusts; a Cofagrigus that's part of the collection; a Bronzor. */
export const MUSEUM_SECRET = ['sigilyph', 'golett', 'cofagrigus', 'bronzor'] as const;

/** How many different collections the museums have (tools/events/co/greenneedle-9.ts BONE_SETS, HIDDEN_SETS). */
export const MUSEUM_SETS = 3;

const f = (run: RunState, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: RunState, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};

export function museumArrive(run: RunState, region: string): string {
  const r = Math.max(0, (MUSEUM_REGIONS as readonly string[]).indexOf(region));
  set(run, 'museum-region', r + 1);
  // Each region's museum is different: its collection (the bones on the tray, the plaques, the Relics behind the exhibits), in turn.
  set(run, 'museum-set', (run.regionIndex % MUSEUM_SETS) + 1);
  let wrong = 6;
  for (let i = 0; i < MUSEUM_LINKS.length; i += 1) {
    const k = (run.regionIndex + i) % MUSEUM_LINKS.length;
    if (f(run, `museum-used-${k + 1}`) > 0) continue;
    if (MUSEUM_LINKS[k]!.some((key) => f(run, key) > 0)) {
      wrong = k + 1;
      break;
    }
  }
  if (wrong < 6) set(run, `museum-used-${wrong}`, 1);
  set(run, 'museum-wrong', wrong);
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-museum-secret:')) delete run.story.flags[k];
  run.story.flags[`ev:cast-museum-secret:${MUSEUM_SECRET[run.regionIndex % MUSEUM_SECRET.length]!}`] = 1;
  return '';
}
