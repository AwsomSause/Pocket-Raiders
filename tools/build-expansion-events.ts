// Writes src/data/events/xe-<region>.json from tools/events/expansion/*.ts. Run with: npm run data:xe-events
// `--check` fails when a file is out of date (a unit test runs it).
import { readFileSync, writeFileSync } from 'node:fs';
import { XE_KANTO_EVENTS } from './events/expansion/kanto.ts';
import { XE_SINNOH_EVENTS } from './events/expansion/sinnoh.ts';
import { XE_HOENN_EVENTS } from './events/expansion/hoenn.ts';

const files = { kanto: XE_KANTO_EVENTS, sinnoh: XE_SINNOH_EVENTS, hoenn: XE_HOENN_EVENTS };
const ids = new Set<string>();
let stale = false;
for (const [region, events] of Object.entries(files)) {
  for (const e of events) {
    const id = String(e.id);
    if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
    ids.add(id);
  }
  const text = JSON.stringify({ events }, null, 1) + '\n';
  const url = new URL(`../src/data/events/xe-${region}.json`, import.meta.url);
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync(url, 'utf8'); } catch { /* missing */ }
    if (have !== text) { console.error(`xe-${region}.json is out of date: run npm run data:xe-events`); stale = true; }
  } else writeFileSync(url, text);
  console.log(`xe-${region}.json: ${events.length} events`);
}
if (stale) process.exit(1);
