// Quick id check for the anime modules: node tools/catalog-overhaul/anime-ids.cjs species:hoothoot move:hypnosis ability:insomnia item:camp-curry cast:trainer.pr/scuba_diver_m cast:boss.ash
// Prints each id with "ok" or "MISSING" (species includes custom species; items include src/data/itemCatalog/*.json; cast = art exists for a scene cast id).
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../..');
const load = (f) => JSON.parse(fs.readFileSync(path.join(root, 'src/data', f), 'utf8'));
const ids = (a) => new Set(a.map((x) => x.id));
const species = new Set([...ids(load('species.json')), ...ids(load('customSpecies.json'))]);
const moves = new Map(load('moves.json').map((m) => [m.id, m]));
const abilities = ids(load('abilities.json'));
const items = ids([...load('itemCatalog.json'), ...fs.readdirSync(path.join(root, 'src/data/itemCatalog')).filter((f) => f.endsWith('.json')).flatMap((f) => load(`itemCatalog/${f}`))]);
// Cast art: "trainer.<x>" -> images/trainer/<x>.png (x may be "pr/<name>" or "drive/<name>"), "boss.<x>" -> images/bosses/<x>.png (x may be "drive/<name>").
const art = (dir, id) => fs.existsSync(path.join(root, 'public/assets/images', dir, `${id}.png`));
for (const arg of process.argv.slice(2)) {
  const [kind, id] = arg.split(':');
  let ok;
  if (kind === 'species') ok = species.has(id);
  else if (kind === 'move') ok = moves.has(id) && moves.get(id).supported !== false;
  else if (kind === 'ability') ok = abilities.has(id);
  else if (kind === 'item') ok = items.has(id);
  else if (kind === 'cast') ok = id.startsWith('boss.') ? art('bosses', id.slice(5)) : id.startsWith('trainer.') ? art('trainer', id.slice(8)) : 'cast ids start with trainer. or boss.';
  else ok = 'unknown kind';
  console.log(`${arg}: ${ok === true ? 'ok' : ok === false ? 'MISSING' : ok}`);
}
