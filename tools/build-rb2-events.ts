// Run events B batch 2: builds src/data/events/trainer-b2.json from tools/events/trainerB2.ts. Run: npm run data:rb2-events
import { writeFileSync } from 'node:fs';
import { RB2_EVENTS } from './events/trainerB2.ts';

const ids = new Set<string>();
for (const e of RB2_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b2.json', import.meta.url), JSON.stringify({ events: RB2_EVENTS }, null, 1) + '\n');
console.log(`trainer-b2.json: ${RB2_EVENTS.length} events`);
