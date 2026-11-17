// Writes display names for the dashboard:  node tools/sim100k/names.ts <out.json>
import { writeFileSync } from 'node:fs';
import { closeModules, loadModule } from '../lib/gameModules.ts';
const { buildContent } = await loadModule<{ buildContent: () => any }>('/src/data/index.ts');
await closeModules();
const c = buildContent();
const pick = (m: Map<string, any>, f: (v: any) => string | undefined) => Object.fromEntries([...m.entries()].map(([k, v]) => [k, f(v)]).filter(([k, v]) => v && v !== k));
const out = {
  species: pick(c.species, (v) => v.name), events: pick(c.events, (v) => v.title ?? v.name), arch: pick(c.archetypes, (v) => v.name),
  items: { ...pick(c.items, (v) => v.name), ...(c.catalog?.entries ? pick(c.catalog.entries instanceof Map ? c.catalog.entries : new Map(Object.entries(c.catalog.entries)), (v: any) => v.name) : {}) },
  moves: pick(c.moves, (v) => v.name), regions: pick(c.regions, (v) => v.name), evil: pick(c.evilTeams instanceof Map ? c.evilTeams : new Map(Object.entries(c.evilTeams?.teams ?? c.evilTeams ?? {})), (v: any) => v.name),
};
writeFileSync(process.argv[2]!, JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(' '), JSON.stringify(Object.entries(out.events).slice(0, 3)), Object.keys(c.catalog ?? {}).slice(0, 8), c.evilTeams instanceof Map, Object.keys(c.evilTeams ?? {}).slice(0, 6));
