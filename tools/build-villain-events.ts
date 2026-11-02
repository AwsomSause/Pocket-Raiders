// Writes the villain team and heist run events (tools/events/villain.ts) to src/data/eventsVillain.json, a file of
// its own so parallel event threads do not collide in events.json. Run with: npm run data:villain-events
import { writeFileSync } from 'node:fs';
import { VILLAIN_EVENTS } from './events/villain.ts';

const ids = new Set<string>();
for (const e of VILLAIN_EVENTS) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
writeFileSync(new URL('../src/data/eventsVillain.json', import.meta.url), JSON.stringify({ events: VILLAIN_EVENTS }, null, 1) + '\n');
console.log(`eventsVillain.json: ${VILLAIN_EVENTS.length} events`);
