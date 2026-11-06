// Run events B batch 8: builds src/data/events/trainer-b8.json from tools/events/trainerB8.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB8_EVENTS } from './events/trainerB8.ts';

const ids = new Set<string>();
for (const e of RB8_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b8.json', import.meta.url), JSON.stringify({ events: RB8_EVENTS }, null, 1) + '\n');
console.log(`trainer-b8.json: ${RB8_EVENTS.length} events`);
