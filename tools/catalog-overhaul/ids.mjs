// usage: node ids.mjs item|species|move|cast <id...>  -> prints which ids are unknown
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url).pathname;
const [kind, ...ids] = process.argv.slice(2);
const j = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
let have;
if (kind === 'item') { const a = j('src/data/items.json'); const b = j("src/data/itemCatalog.json"); have = new Set([...(a.items ?? a).map((x) => x.id), ...b.map((x) => x.id)]); }
if (kind === 'species') { const a = j('src/data/species.json'); have = new Set((a.species ?? a).map((x) => x.id)); }
if (kind === 'move') { const a = j('src/data/moves.json'); have = new Set((a.moves ?? a).map((x) => x.id)); }
if (kind === 'cast') { const s = readFileSync(root + 'src/assets/catalog.ts', 'utf8'); have = { has: (id) => s.includes(`'${id}'`) || s.includes(`"${id}"`) }; }
for (const id of ids) if (!have.has(id)) console.log('UNKNOWN', kind, id);
console.log('checked', ids.length);
