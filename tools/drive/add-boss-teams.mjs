// Adds teams for the Drive bosses (bosses.json entries with "drive": true) to src/data/bossTeams.json
// without touching any team already there. The committed teams were built when levels stopped at 100,
// so the generator runs with that cap (balance.json is restored afterwards).
//   node tools/drive/add-boss-teams.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const data = join(root, 'src', 'data');
const balancePath = join(data, 'balance.json');
const teamsPath = join(data, 'bossTeams.json');
const balance = readFileSync(balancePath, 'utf8');
const before = readFileSync(teamsPath, 'utf8');
const drive = new Set(JSON.parse(readFileSync(join(data, 'bosses.json'), 'utf8')).filter((b) => b.drive).map((b) => b.id));
// Keep every non-Drive team exactly as it is; drop old Drive teams so a re-run replaces them.
const blocksOf = (text) => text.slice(2, -3).split(/,\n(?= ")/);
const idOf = (block) => JSON.parse(block.match(/^ ("[^"]+")/)[1]);
const kept = blocksOf(before).filter((b) => !drive.has(idOf(b)));
try {
  writeFileSync(balancePath, balance.replace(/"maxLevel": 500/, '"maxLevel": 100'));
  execFileSync('node', [join(root, 'tools', 'build-boss-teams.ts')], { stdio: 'inherit' });
  const added = blocksOf(readFileSync(teamsPath, 'utf8')).filter((b) => drive.has(idOf(b)));
  const out = `{\n${[...kept, ...added].join(',\n')}\n}\n`;
  JSON.parse(out);
  writeFileSync(teamsPath, out);
  console.log(`Kept ${kept.length} bosses' teams, added ${added.length} Drive bosses.`);
} finally {
  writeFileSync(balancePath, balance);
}
