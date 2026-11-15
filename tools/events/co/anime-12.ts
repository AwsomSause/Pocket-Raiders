// Anime questlines, module 12: AQ54-AQ60. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
// Build: npm run co:build -- anime-12
import type { Json } from '../dsl.ts';
import type { Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {};
export const PLACEMENT: Record<string, Place> = {};
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};
export const LIMITS: Record<string, string[]> = {};
export const EVENTS: Json[] = [];
export const REMOVE: string[] = [];
