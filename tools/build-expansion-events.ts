// Writes src/data/events/xe-<region>.json from tools/events/expansion/<region>.ts, one file per region. Run with: npm run data:xe-events
// `--check` fails when a file is out of date (a unit test runs it).
import { readFileSync, writeFileSync } from 'node:fs';
import { XE_KANTO_EVENTS } from './events/expansion/kanto.ts';
import { XE_JOHTO_EVENTS } from './events/expansion/johto.ts';
import { XE_UNOVA_EVENTS } from './events/expansion/unova.ts';
import { XE_KALOS_EVENTS } from './events/expansion/kalos.ts';
import { XE_GALAR_EVENTS } from './events/expansion/galar.ts';

// One line per region: add the next region here.
const REGIONS: Record<string, readonly Record<string, unknown>[]> = {
  kanto: XE_KANTO_EVENTS,
  johto: XE_JOHTO_EVENTS,
  unova: XE_UNOVA_EVENTS,
  kalos: XE_KALOS_EVENTS,
  galar: XE_GALAR_EVENTS,
};

const ids = new Set<string>();
let stale = false;
for (const [region, events] of Object.entries(REGIONS)) {
  for (const e of events) {
    const id = String(e.id);
    if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
    ids.add(id);
  }
  const text = JSON.stringify({ events }, null, 1) + '\n';
  const url = new URL(`../src/data/events/xe-${region}.json`, import.meta.url);
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync(url, 'utf8'); } catch { /* missing counts as stale */ }
    if (have !== text) { console.error(`xe-${region}.json is out of date: run npm run data:xe-events`); stale = true; }
  } else writeFileSync(url, text);
  console.log(`xe-${region}.json: ${events.length} events`);
}
if (stale) process.exit(1);
