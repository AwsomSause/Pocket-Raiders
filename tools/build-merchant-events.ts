// Run events A (merchants, deals and swaps): writes src/data/eventsMerchants.json from tools/events/merchants.ts.
// Run: npm run data:merchant-events
import { writeFileSync } from 'node:fs';
import { MERCHANT_EVENTS } from './events/merchants.ts';

const ids = new Set<string>();
for (const e of MERCHANT_EVENTS) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
writeFileSync(new URL('../src/data/eventsMerchants.json', import.meta.url), JSON.stringify({ events: MERCHANT_EVENTS }, null, 1) + '\n');
console.log(`eventsMerchants.json: ${MERCHANT_EVENTS.length} events`);
