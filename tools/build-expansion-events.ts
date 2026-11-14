// Writes src/data/events/xe-kanto.json from tools/events/expansion/*.ts. Run with: npm run data:xe-events
// `--check` fails when the file is out of date (a unit test runs it).
import { readFileSync, writeFileSync } from 'node:fs';
import { XE_KANTO_EVENTS } from './events/expansion/kanto.ts';
import { XE_JOHTO_EVENTS } from './events/expansion/johto.ts';
import { XE_UNOVA_EVENTS } from './events/expansion/unova.ts';

const files: [string, Record<string, unknown>[]][] = [
  ['xe-kanto.json', XE_KANTO_EVENTS],
  ['xe-johto.json', XE_JOHTO_EVENTS],
  ['xe-unova.json', XE_UNOVA_EVENTS],
];
const ids = new Set<string>();
let stale = false;
for (const [name, events] of files) {
  for (const e of events) {
    const id = String(e.id);
    if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
    ids.add(id);
  }
  const text = JSON.stringify({ events }, null, 1) + '\n';
  const url = new URL(`../src/data/events/${name}`, import.meta.url);
  if (process.argv.includes('--check')) {
    let old = '';
    try { old = readFileSync(url, 'utf8'); } catch { /* missing */ }
    if (old !== text) { console.error(`${name} is out of date: run npm run data:xe-events`); stale = true; }
  } else writeFileSync(url, text);
  console.log(`${name}: ${events.length} events`);
}
if (stale) process.exit(1);
