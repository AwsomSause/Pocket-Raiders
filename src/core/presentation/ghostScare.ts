/**
 * Sabrina's Labyrinth, "The Ghost Returns": the first pages are a black screen, then the ghost's face fills it.
 * Presentation only: which picture a page of the opening text gets. The event's text, choices and effects are untouched.
 */
export type GhostScare = 'dark' | 'face';

const SCARE_PAGES: Record<string, readonly (GhostScare | null)[]> = {
  'gn-14-return': ['dark', 'dark', 'face'],
};

/** The scare picture for this page of the event's opening text, or null (any other event, the later pages, an outcome). */
export function ghostScareFor(eventId: string, intro: boolean, page: number): GhostScare | null {
  if (!intro) return null;
  return SCARE_PAGES[eventId]?.[page] ?? null;
}
