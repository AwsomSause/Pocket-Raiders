// Run events B batch 9: builds src/data/events/trainer-b10.json from tools/events/trainerB10.ts. Run: npm run data:rb10-events
import { writeFileSync } from 'node:fs';
import { RB10_EVENTS } from './events/trainerB10.ts';

const ids = new Set<string>();
for (const e of RB10_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b10.json', import.meta.url), JSON.stringify({ events: RB10_EVENTS }, null, 1) + '\n');
console.log(`trainer-b10.json: ${RB10_EVENTS.length} events`);
