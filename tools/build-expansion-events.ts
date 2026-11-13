// Writes src/data/events/xe-kanto.json from tools/events/expansion/*.ts. Run with: npm run data:xe-events
// `--check` fails when the file is out of date (a unit test runs it).
import { readFileSync, writeFileSync } from 'node:fs';
import { XE_KANTO_EVENTS } from './events/expansion/kanto.ts';

const events = [...XE_KANTO_EVENTS];
const ids = new Set<string>();
for (const e of events) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
const text = JSON.stringify({ events }, null, 1) + '\n';
const url = new URL('../src/data/events/xe-kanto.json', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(url, 'utf8') !== text) {
    console.error('xe-kanto.json is out of date: run npm run data:xe-events');
    process.exit(1);
  }
} else writeFileSync(url, text);
console.log(`xe-kanto.json: ${events.length} events`);
