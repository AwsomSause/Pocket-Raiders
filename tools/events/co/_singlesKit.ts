// Catalog Overhaul Pack, singles: shared helpers for tools/events/co/singles-<n>.ts.
import type { Json } from '../dsl.ts';

/** PLAN.md section 2: no event ends a run. Every trainer or wild fight an event starts is friendly (a loss puts the party back on its feet at the same node). */
export function friendlyAll(events: Json[]): Json[] {
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const b = o.battle as Record<string, unknown> | undefined;
      if (b && (b.kind === 'trainer' || b.kind === 'wild') && !b.pseudo) b.friendly = true;
      Object.values(o).forEach(walk);
    }
  };
  walk(events);
  return events;
}
