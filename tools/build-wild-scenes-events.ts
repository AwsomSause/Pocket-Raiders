// Run events C (wild Pokémon scenes): adds tools/events/wildScenes*.ts to src/data/events.json.
// Safe to re-run: events with the same ids are replaced, all others kept. Run: npm run data:wild-scenes
import { readFileSync, writeFileSync } from 'node:fs';
import { WILD_SCENES_A } from './events/wildScenesA.ts';
import { WILD_SCENES_B } from './events/wildScenesB.ts';

type Json = Record<string, unknown>;
const ALL: Json[] = [...WILD_SCENES_A, ...WILD_SCENES_B];
const path = new URL('../src/data/events.json', import.meta.url);
const file = JSON.parse(readFileSync(path, 'utf8')) as { events: Json[] };
const ids = new Set<string>();
for (const e of ALL) {
  const id = String(e.id);
  if (ids.has(id)) throw new Error(`duplicate event id ${id}`);
  ids.add(id);
}
file.events = [...file.events.filter((e) => !ids.has(String(e.id))), ...ALL];
writeFileSync(path, JSON.stringify(file, null, 1) + '\n');
console.log(`events.json: ${file.events.length} events (${ALL.length} from the wild-scenes builder)`);
