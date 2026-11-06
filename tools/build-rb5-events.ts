// Run events B batch 5: builds src/data/events/trainer-b5.json from tools/events/trainerB5.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB5_EVENTS } from './events/trainerB5.ts';

const ids = new Set<string>();
for (const e of RB5_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b5.json', import.meta.url), JSON.stringify({ events: RB5_EVENTS }, null, 1) + '\n');
console.log(`trainer-b5.json: ${RB5_EVENTS.length} events`);
