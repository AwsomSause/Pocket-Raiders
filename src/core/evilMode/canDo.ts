// Evil Mode slice 12: the one guard (design Part 30 section 10), as far as the road's children go. `step` asks it first,
// for every action: a screen that forgot to grey a button still can't do the thing. The Hero and the other three are
// minors; none of them is ever a person on a job, a post, a hire, a door or a cell, and the only things that can be done
// to one of the three are help, talk and mislead. Pure; it never changes anything.

import type { EvilAction } from './day';
import { ROAD_IDS, ROAD_WHATS } from './road';
import type { EvilModeBlock } from './schema';
import { starRefusal } from './lastThree';

export type CanDo = { ok: true } | { ok: false; why: string };

const NOT_A_CHILD = 'Not a child on the road. Nothing in the mode does that.';

/** Ids that name a person in each action (the fields a forced action could point at a child). */
function personIds(a: EvilAction): string[] {
  const any = a as Record<string, unknown>;
  const out: string[] = [];
  for (const k of ['id', 'ref', 'who', 'stay']) if (typeof any[k] === 'string' && a.type !== 'roadDo' && a.type !== 'openLetter' && a.type !== 'roomAct') out.push(any[k] as string);
  if (a.type === 'roomAct' && a.who) out.push(a.who);
  const job = (any.job ?? null) as { squad?: unknown } | null;
  if (job && Array.isArray(job.squad)) out.push(...(job.squad as string[]));
  if (a.type === 'raidQueue') out.push(...a.queue);
  return out;
}

export function canDo(block: EvilModeBlock, a: EvilAction): CanDo {
  const kids = new Set<string>([...ROAD_IDS, ...(block.hero ? [block.hero.rivalId] : []), ...block.road.map((t) => t.id)]);
  if (personIds(a).some((id) => kids.has(id))) return { ok: false, why: NOT_A_CHILD };
  if (a.type === 'roadDo' && (!ROAD_WHATS.includes(a.what) || !block.road.some((t) => t.id === a.who))) return { ok: false, why: NOT_A_CHILD };
  // Slice 20: Team Star's locks. Nothing reaches a Star base but a Visit; no Chair, no Pen, no person slot (Part 15b section 5.1).
  const star = starRefusal(block, a as unknown as { type: string } & Record<string, unknown>);
  if (star) return { ok: false, why: star };
  return { ok: true };
}
