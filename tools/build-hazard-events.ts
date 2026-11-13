// Beta 0.6: biome hazards, map stops and NE76-80 -> src/data/events/hazards.json (own file; overrides older events with the same id).
// Placement of replaced events (stop, rarity, minStage, types, requires, scene...) is copied from the old event. Run: npm run data:hazards
import { readFileSync, writeFileSync } from 'node:fs';
import { CALLBACKS, HAZARDS, HZ, NEW_EVENTS, PATCHES, STOPS } from './events/hazards.ts';

type Json = Record<string, unknown>;
const read = (p: string): Json[] => (JSON.parse(readFileSync(new URL(`../src/data/${p}`, import.meta.url), 'utf8')) as { events: Json[] }).events;
// Old versions: the generated files minus our own output, so a re-run reads the same sources.
const old = [...read('events.json'), ...read('eventsWeather.json'), ...read('events/worldEvents.json'), ...read('events/run-catalogue.json'), ...read('events/galar.json')];
const KEEP = ['stop', 'rarity', 'minStage', 'types', 'requires', 'secret', 'room', 'keyItem', 'gameEvent', 'scene'];

function revise(id: string, group: string | null, intro: string, choices: Json[], remembers?: Json[]): Json {
  const prev = old.find((e) => e.id === id);
  if (!prev) throw new Error(`no old event ${id} to revise`);
  const meta: Json = {};
  for (const k of KEEP) if (prev[k] !== undefined) meta[k] = prev[k];
  return { id, name: prev.name, group: group ?? prev.group, ...meta, intro, choices, ...(remembers ? { remembers } : {}) };
}

const events: Json[] = [];
for (const h of HAZARDS) for (const id of h.ids) events.push(revise(id, HZ, h.intro, h.choices, h.remembers));
for (const s of STOPS) events.push(revise(s.id, null, s.intro, s.choices, s.remembers));
for (const [id, patch] of Object.entries(PATCHES)) {
  const prev = old.find((e) => e.id === id);
  if (!prev) throw new Error(`no old event ${id} to patch`);
  events.push(patch(structuredClone(prev) as never));
}
events.push(...CALLBACKS, ...NEW_EVENTS);
const ids = new Set<string>();
for (const e of events) { if (ids.has(String(e.id))) throw new Error(`duplicate ${e.id}`); ids.add(String(e.id)); }
writeFileSync(new URL('../src/data/events/hazards.json', import.meta.url), JSON.stringify({ override: true, events }, null, 1) + '\n');
console.log(`hazards.json: ${events.length} events`);
