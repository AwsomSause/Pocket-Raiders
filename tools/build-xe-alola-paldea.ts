// Writes src/data/events/xe-alola.json and xe-paldea.json from tools/events/expansion/{alola,paldea}.ts.
// Run with: npm run data:xe-alola-paldea. `--check` fails when a file is out of date (a unit test runs it).
import { readFileSync, writeFileSync } from 'node:fs';
import { XE_ALOLA_EVENTS } from './events/expansion/alola.ts';
import { XE_PALDEA_EVENTS } from './events/expansion/paldea.ts';

let stale = false;
for (const [file, events] of [['xe-alola.json', XE_ALOLA_EVENTS], ['xe-paldea.json', XE_PALDEA_EVENTS]] as const) {
  const ids = new Set<string>();
  for (const e of events) {
    const id = String(e.id);
    if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
    ids.add(id);
  }
  const text = JSON.stringify({ events }, null, 1) + '\n';
  const url = new URL(`../src/data/events/${file}`, import.meta.url);
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync(url, 'utf8'); } catch { /* missing */ }
    if (have !== text) { console.error(`${file} is out of date: run npm run data:xe-alola-paldea`); stale = true; }
  } else writeFileSync(url, text);
  console.log(`${file}: ${events.length} events`);
}
if (stale) process.exit(1);
