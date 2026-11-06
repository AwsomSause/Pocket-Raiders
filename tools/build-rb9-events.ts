// Run events B batch 9: builds src/data/events/trainer-b9.json from tools/events/trainerB9.ts. Run: npm run data:rb3-events
import { writeFileSync } from 'node:fs';
import { RB9_EVENTS } from './events/trainerB9.ts';

const ids = new Set<string>();
for (const e of RB9_EVENTS) {
  if (ids.has(String(e.id))) throw new Error(`duplicate event id ${e.id}`);
  ids.add(String(e.id));
}
writeFileSync(new URL('../src/data/events/trainer-b9.json', import.meta.url), JSON.stringify({ events: RB9_EVENTS }, null, 1) + '\n');
console.log(`trainer-b9.json: ${RB9_EVENTS.length} events`);
