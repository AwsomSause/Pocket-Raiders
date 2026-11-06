// S498 Alpha Nobles: adds the frenzied noble events (tools/events/nobles.ts) to src/data/events.json.
// Safe to re-run: events with the same ids are replaced, all others kept. Run: npm run data:nobles
import { readFileSync, writeFileSync } from 'node:fs';
import { NOBLE_EVENTS } from './events/nobles.ts';

type Json = Record<string, unknown>;
const path = new URL('../src/data/events.json', import.meta.url);
const file = JSON.parse(readFileSync(path, 'utf8')) as { events: Json[] };
const ids = new Set(NOBLE_EVENTS.map((e) => String(e.id)));
file.events = [...file.events.filter((e) => !ids.has(String(e.id))), ...NOBLE_EVENTS];
writeFileSync(path, JSON.stringify(file, null, 1) + '\n');
console.log(`events.json: ${file.events.length} events (${NOBLE_EVENTS.length} nobles)`);
