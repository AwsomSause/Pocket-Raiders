// Writes src/data/catalogOverhaul/status/places.json from the built co-places-*.json files and tools/catalog-overhaul/places-closeout.json.
// Run: node tools/catalog-overhaul/places-status.ts [YYYY-MM-DD]   (the date an id was re-read against its doc; kept for ids already listed)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '../..');
const read = <T>(p: string): T => JSON.parse(readFileSync(join(root, p), 'utf8')) as T;
const ledger = read<{ rows: string[][] }>('src/data/catalogOverhaul/ledger.json').rows.filter((r) => r[5] === 'places').map((r) => r[0]!);
const mine = new Set(ledger);
const out = 'src/data/catalogOverhaul/status/places.json';
const prev = existsSync(join(root, out)) ? read<{ built: Record<string, string> }>(out) : { built: {} };
const closeout = read<{ merged: Record<string, string>; rule: Record<string, string>; scrapped: string[]; extra: Record<string, string> }>('tools/catalog-overhaul/places-closeout.json');
const today = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const built: Record<string, string> = {};
const extra: Record<string, string> = { ...closeout.extra };
for (const f of readdirSync(join(root, 'src/data/events')).filter((x) => /^co-places-\d+\.json$/.test(x)).sort()) {
  for (const e of read<{ events: { id: string; name: string }[] }>(`src/data/events/${f}`).events) {
    if (mine.has(e.id)) built[e.id] = prev.built[e.id] ?? today;
    else if (!(e.id in extra)) extra[e.id] = e.id;
  }
}
for (const id of [...Object.keys(closeout.merged), ...Object.keys(closeout.rule), ...closeout.scrapped]) if (built[id]) throw new Error(`${id} is built and also closed out`);
writeFileSync(join(root, out), JSON.stringify({ category: 'places', built, merged: closeout.merged, rule: closeout.rule, scrapped: closeout.scrapped, extra }, null, 1) + '\n');
const done = Object.keys(built).length + Object.keys(closeout.merged).length + Object.keys(closeout.rule).length + closeout.scrapped.length;
console.log(`places: ${done} of ${ledger.length} closed (${Object.keys(built).length} built, ${Object.keys(closeout.merged).length} merged, ${Object.keys(closeout.rule).length} rule), ${Object.keys(extra).length} extra`);
