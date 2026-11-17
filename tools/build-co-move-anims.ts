// Gives every Catalog Overhaul move (src/data/catalogOverhaul/moves/*.json) a look in src/data/moveAnims.json: the animation of the
// strongest ordinary move of the same type and category (same donor rule as tools/story/build-signature-moves.mjs). Presentation only.
// Run: node tools/build-co-move-anims.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const ordinary: { id: string; type: string; category: string; power?: number }[] = read('src/data/moves.json');
const anims = read('src/data/moveAnims.json');
const dir = 'src/data/catalogOverhaul/moves';
let added = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  for (const m of read(`${dir}/${f}`) as { id: string; type: string; category: string }[]) {
    const donor = ordinary.filter((o) => o.type === m.type && o.category === m.category && anims.moves[o.id] && !/^(z|max)-/.test(o.id)).sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
    if (!donor) throw new Error(`no animation donor for ${m.id}`);
    const { pack: _p, script: _s, ...look } = anims.moves[donor.id];
    anims.moves[m.id] = { ...look, source: 'type' };
    added++;
  }
}
writeFileSync('src/data/moveAnims.json', JSON.stringify(anims, null, 2) + '\n');
console.log(`co move looks: ${added}`);
