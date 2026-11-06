// Adds the original Circuit cast (18 leaders, 4 Elite Four, Selene) to src/data/bosses.json as `story: true` bosses
// (id `orig-<id>`), then builds their teams into bossTeams.json without touching any existing team.
//   node tools/story/add-circuit-bosses.mjs     (run tools/story/build-circuit-cast.mjs first)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const data = join(root, 'src', 'data');
const cast = JSON.parse(readFileSync(join(data, 'story', 'circuitCast.json'), 'utf8'));
const bossesPath = join(data, 'bosses.json');
const teamsPath = join(data, 'bossTeams.json');
const balancePath = join(data, 'balance.json');
const balance = readFileSync(balancePath, 'utf8');
const entries = [...cast.leaders, ...cast.elite, cast.champion].map((c) => ({ id: `orig-${c.id}`, name: c.name, types: c.types ?? [c.type], sprites: { default: c.sprite }, signature: c.signature, story: true }));
const lines = readFileSync(bossesPath, 'utf8').trimEnd().split('\n');
const keep = lines.slice(1, -1).map((l) => l.replace(/,$/, '')).filter((l) => !JSON.parse(l).story);
const text = `[\n${[...keep, ...entries.map((e) => ' ' + JSON.stringify(e).replace(/([:,])(?=["\[{])/g, '$1 '))].map((l) => (l.startsWith(' ') ? l : ' ' + l)).join(',\n')}\n]\n`;
JSON.parse(text);
writeFileSync(bossesPath, text);
const ours = new Set(entries.map((e) => e.id));
const blocksOf = (t) => t.slice(2, -3).split(/,\n(?= ")/);
const idOf = (b) => JSON.parse(b.match(/^ ("[^"]+")/)[1]);
const kept = blocksOf(readFileSync(teamsPath, 'utf8')).filter((b) => !ours.has(idOf(b)));
try {
  writeFileSync(balancePath, balance.replace(/"maxLevel": 500/, '"maxLevel": 100'));
  execFileSync('node', [join(root, 'tools', 'build-boss-teams.ts')], { stdio: 'inherit' });
  const added = blocksOf(readFileSync(teamsPath, 'utf8')).filter((b) => ours.has(idOf(b)));
  const out = `{\n${[...kept, ...added].join(',\n')}\n}\n`;
  JSON.parse(out);
  writeFileSync(teamsPath, out);
  console.log(`Kept ${kept.length} teams, added ${added.length}.`);
} finally {
  writeFileSync(balancePath, balance);
}
