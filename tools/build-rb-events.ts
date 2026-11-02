// Run events B (trainer battles and challenges): builds src/data/eventsRB.json from tools/events/trainerB.ts.
// Run: npm run data:rb-events
import { writeFileSync } from 'node:fs';
import { RB_EVENTS } from './events/trainerB.ts';

const ids = new Set<string>();
for (const e of RB_EVENTS) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
writeFileSync(new URL('../src/data/eventsRB.json', import.meta.url), JSON.stringify({ events: RB_EVENTS }, null, 1) + '\n');
console.log(`eventsRB.json: ${RB_EVENTS.length} events`);
