// Evil Mode slice 12: the Hero's temper (design Part 18 section 5). Five steps, a word under their marker. Moved one step
// at a time by named things only; never below Curious; never reset at a Crossing. Pure.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilModeBlock, Hero } from './schema';

/** A species id as the Hero says it ("mr-mime" -> "Mr Mime"); a name already said comes back the same. */
export const monName = (id: string): string => (id ? id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'starter');

export const temperWord = (t: number, data: EvilData = EVIL_DATA): string => data.road.temper.words[Math.max(0, Math.min(4, t))]!;
export const temperDoes = (t: number, data: EvilData = EVIL_DATA): string => data.road.temper.does[Math.max(0, Math.min(4, t))]!;

/** One step (or `by`), with the reason (an id in road.json `temper.why`). A step that changes nothing isn't written. */
export function moveTemper(hero: Hero, by: number, why: string, data: EvilData = EVIL_DATA, to?: number): Hero {
  const next = to ?? Math.max(0, Math.min(4, hero.temper + by));
  if (next === hero.temper) return hero;
  const text = data.road.temper.why[why] ?? why;
  return { ...hero, temper: next, temperWhy: [...hero.temperWhy, `${by > 0 || (to ?? 0) > hero.temper ? '+' : '−'} ${text}`] };
}

export const withTemper = (block: EvilModeBlock, by: number, why: string, data: EvilData = EVIL_DATA): EvilModeBlock =>
  (block.hero ? { ...block, hero: moveTemper(block.hero, by, why, data) } : block);

/** At Angry or above they walk three steps a day whatever the personality (Part 18 section 5). */
export const angrySteps = (hero: Hero, data: EvilData = EVIL_DATA): number | null => (hero.temper >= 3 ? data.road.temper.angrySteps : null);

/**
 * The Evening's temper (Part 18 section 5): a holding on their road that turned by a Lean or a Take that went today, +1
 * once a district; anything on their home street, +1 each. Read from today's Log entries only, so nothing counts twice.
 */
export function eveningTemper(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const hero = block.hero;
  const d = block.district;
  if (!hero || !d) return block;
  const today = block.log.filter((e) => e.kind === 'job' && e.day === block.here.day && e.region === d.region && e.district === d.n && e.result === 'went' && (e.method === 'lean' || e.method === 'take'));
  let out = block;
  const key = `temper:turned:${d.region}:${d.n}`;
  if (today.some((e) => !hero.home.holdings.includes(e.to ?? '')) && !out.applied.includes(key)) out = { ...withTemper(out, 1, 'turned', data), applied: [...out.applied, key] };
  for (const e of today) if (hero.home.holdings.includes(e.to ?? '') && hero.home.district === d.n && hero.home.region === d.region) out = withTemper(out, 1, 'street', data);
  return out;
}
