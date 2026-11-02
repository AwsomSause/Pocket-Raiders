// Run events K (R506-R560): builds src/data/eventsRK.json from tools/events/rk.ts. Safe to re-run. Run: npm run data:rk-events
import { writeFileSync } from 'node:fs';
import { RK_EVENTS } from './events/rk.ts';

type Json = Record<string, unknown>;
const ids = new Set<string>();
for (const e of RK_EVENTS) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
// A room is any event another event opens with `addEvent`/`addEventFrom`: it is never drawn on its own.
const rooms = new Set<string>();
const collect = (o: unknown): void => {
  if (Array.isArray(o)) o.forEach(collect);
  else if (o && typeof o === 'object') {
    const r = o as Json;
    if (r.kind === 'addEvent') rooms.add(String(r.eventId));
    if (r.kind === 'addEventFrom') (r.ids as string[]).forEach((i) => rooms.add(i));
    Object.values(r).forEach(collect);
  }
};
collect(RK_EVENTS);
for (const e of RK_EVENTS) if (rooms.has(String(e.id))) e.room = true;
writeFileSync(new URL('../src/data/eventsRK.json', import.meta.url), JSON.stringify({ events: RK_EVENTS }, null, 1) + '\n');
console.log(`eventsRK.json: ${RK_EVENTS.length} events`);
