// Run events B batch 6: builds src/data/events/trainer-b6.json from tools/events/trainerB6.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB6_EVENTS } from './events/trainerB6.ts';

const ids = new Set<string>();
for (const e of RB6_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b6.json', import.meta.url), JSON.stringify({ events: RB6_EVENTS }, null, 1) + '\n');
console.log(`trainer-b6.json: ${RB6_EVENTS.length} events`);
