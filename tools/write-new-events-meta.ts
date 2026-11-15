// Catalog Overhaul row 17 (new events): writes the placement file and the status file from tools/events/co/new-events-*.ts.
// Run after `npm run co:build -- new-events-1 new-events-2 new-events-3 new-events-4`:  node tools/write-new-events-meta.ts
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'tools/events/co');
for (const f of readdirSync(dir).filter((n) => /^new-events-\d+\.ts$/.test(n)).sort()) await import(join(dir, f));
const { PLACEMENT, NE_IDS } = (await import(join(dir, '_ne.ts'))) as { PLACEMENT: Record<string, unknown>; NE_IDS: Record<string, string> };

const sorted = <T>(o: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
writeFileSync(
  join(root, 'src/data/catalogOverhaul/placement-staged/new-events.json'),
  JSON.stringify({ $note: 'Catalog Overhaul placement for the 100 new events (NEW_EVENTS_PLACED.md), keyed by event id. Written by tools/write-new-events-meta.ts.', ...sorted(PLACEMENT) }, null, 1) + '\n',
);
writeFileSync(
  join(root, 'src/data/catalogOverhaul/status/new-events.json'),
  JSON.stringify({ category: 'new-events', note: 'NE number (and NEn:id for its steps and afterstories) to the event that plays it. NE61 to NE65 wait for the markets Honest Trade Card.', built: {}, merged: {}, rule: {}, scrapped: [], extra: sorted(NE_IDS) }, null, 1) + '\n',
);
console.log(`placement: ${Object.keys(PLACEMENT).length} events; status: ${Object.keys(NE_IDS).length} entries`);
