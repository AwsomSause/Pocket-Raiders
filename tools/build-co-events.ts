// Catalog Overhaul Pack: turns each tools/events/co/<name>.ts into src/data/events/co-<name>.json.
// Run: npm run co:build -- [name ...]   (no name = every module). One module, one output file, so threads never share a file.
//
// A module exports:
//   CATEGORY  the owning category (src/data/catalogOverhaul/ledger.json, column "category", or a category with no ledger ids)
//   EVENTS    full events, written with tools/events/dsl.ts. For an id that was an old event, anything you leave out of
//             name, group, stop, rarity, tags, types, minStage, requires, scene... is copied from where the old event sat.
//   REMOVE    old event ids a MERGE, SCRAP or RULE verdict retires. They stay loadable for saved runs but are never drawn again.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Json = Record<string, unknown>;
const root = join(import.meta.dirname, '..');
const dir = join(root, 'tools/events/co');
const old = JSON.parse(readFileSync(join(root, 'src/data/catalogOverhaul/oldPlacement.json'), 'utf8')) as Record<string, Json>;

const wanted = process.argv.slice(2);
const names = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.startsWith('_')).map((f) => f.slice(0, -3)).filter((n) => wanted.length === 0 || wanted.includes(n));
for (const w of wanted) if (!names.includes(w)) throw new Error(`no module tools/events/co/${w}.ts`);

for (const name of names) {
  const mod = (await import(join(dir, `${name}.ts`))) as { CATEGORY?: string; EVENTS?: Json[]; REMOVE?: string[] };
  if (!mod.CATEGORY) throw new Error(`${name}: export CATEGORY`);
  const remove = [...new Set(mod.REMOVE ?? [])].sort();
  const ids = new Set<string>();
  const events = (mod.EVENTS ?? []).map((e) => {
    const id = String(e.id);
    if (ids.has(id)) throw new Error(`${name}: duplicate event ${id}`);
    if (remove.includes(id)) throw new Error(`${name}: ${id} is both built and removed`);
    ids.add(id);
    const prev = old[id];
    if (!prev) return e;
    // Old placement first, then what the module wrote; the id leads.
    const { id: _id, ...rest } = e;
    const given = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    return { id, ...prev, ...given };
  });
  for (const e of events) if (!e.name || e.group === undefined) throw new Error(`${name}: ${e.id} needs a name and a group (it has no old event to copy them from)`);
  const file = join(root, `src/data/events/co-${name}.json`);
  writeFileSync(file, JSON.stringify({ catalogOverhaul: mod.CATEGORY, override: true, remove, events }, null, 1) + '\n');
  console.log(`co-${name}.json: ${events.length} events, ${remove.length} removed${existsSync(file) ? '' : ' (new)'}`);
}
