// Run events B batch 7: builds src/data/events/trainer-b7.json from tools/events/trainerB7.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB7_EVENTS } from './events/trainerB7.ts';

const ids = new Set<string>();
for (const e of RB7_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b7.json', import.meta.url), JSON.stringify({ events: RB7_EVENTS }, null, 1) + '\n');
console.log(`trainer-b7.json: ${RB7_EVENTS.length} events`);
