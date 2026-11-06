// S502 Z-Trials: adds the island trial events (tools/events/ztrials.ts) to src/data/events.json.
// Safe to re-run: events with the same ids are replaced, all others kept. Run: npm run data:z-trials
import { readFileSync, writeFileSync } from 'node:fs';
import { Z_TRIAL_EVENTS } from './events/ztrials.ts';

type Json = Record<string, unknown>;
const path = new URL('../src/data/events.json', import.meta.url);
const file = JSON.parse(readFileSync(path, 'utf8')) as { events: Json[] };
const ids = new Set(Z_TRIAL_EVENTS.map((e) => String(e.id)));
file.events = [...file.events.filter((e) => !ids.has(String(e.id))), ...Z_TRIAL_EVENTS];
writeFileSync(path, JSON.stringify(file, null, 1) + '\n');
console.log(`events.json: ${file.events.length} events (${Z_TRIAL_EVENTS.length} Z-Trials)`);
