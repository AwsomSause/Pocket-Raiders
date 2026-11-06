// Run events B batch 3: builds src/data/events/trainer-b3.json from tools/events/trainerB3.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB3_EVENTS } from './events/trainerB3.ts';

const ids = new Set<string>();
for (const e of RB3_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b3.json', import.meta.url), JSON.stringify({ events: RB3_EVENTS }, null, 1) + '\n');
console.log(`trainer-b3.json: ${RB3_EVENTS.length} events`);
