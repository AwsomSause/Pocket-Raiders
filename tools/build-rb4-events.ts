// Run events B batch 4: builds src/data/events/trainer-b4.json from tools/events/trainerB4.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB4_EVENTS } from './events/trainerB4.ts';

const ids = new Set<string>();
for (const e of RB4_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b4.json', import.meta.url), JSON.stringify({ events: RB4_EVENTS }, null, 1) + '\n');
console.log(`trainer-b4.json: ${RB4_EVENTS.length} events`);
