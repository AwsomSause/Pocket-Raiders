// Who stands on the event stage, for the few events whose own data cannot say it (presentation only, no gameplay RNG).

/** Flight North: after the bully, the small Bug-type is the only Pokémon you have, and it is the star of every room. */
export const leadStarEvent = (eventId: string): boolean => /^gn-13-(meadow|cocoon|stream|hatch|camp|boss|goodbye)$/.test(eventId);

const PIDGEY_LINE = ['pidgey', 'pidgeotto', 'pidgeot'];
const SPEAROW_LINE = ['spearow', 'fearow'];
/** Pidgey's Resolve only (Kice 2026-11-16): Pidgey keeps its size; Spearow and Fearow are drawn this much taller than it. */
export const SKY_RIVAL_SIZE = 1.12;

/**
 * Pidgey's Resolve (events `sky.*`): the order to draw the two birds in (Pidgey's line first) and each one's height as a
 * share of the first one's (null: the stage's own size). Null for every other event, or when both birds are not there.
 */
export function skyBirdStaging(eventId: string, speciesIds: readonly string[]): { order: number[]; size: (number | null)[] } | null {
  if (!eventId.startsWith('sky.')) return null;
  const p = speciesIds.findIndex((id) => PIDGEY_LINE.includes(id));
  const s = speciesIds.findIndex((id) => SPEAROW_LINE.includes(id));
  if (p < 0 || s < 0) return null;
  return { order: [p, s], size: [null, SKY_RIVAL_SIZE] };
}
