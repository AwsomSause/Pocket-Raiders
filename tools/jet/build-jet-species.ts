// Builds src/data/jetSpecies.json: the six Jet Pokémon (director's "Jet" pack, 2026-11-07).
//   node tools/jet/build-jet-species.ts
// Four Paradox forms (Eevee and Toxel holding Booster Energy), Skull Bastiodon (Shieldon holding Black Sludge)
// and Aggron's new final stage. The pack's Pokédex file listed no stats, types or moves, so these are designed
// here (types read from the art and file names; stats near each base form's class). Evolution routes: Aggron by level
// (below); the held-item routes are in core/conditionEvolution.ts. Sprites: tools/jet/make-jet-sprites.py.
// Learnsets: the pre-evolution's list, plus a few moves for the new types. Abilities and icons use existing ones.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(import.meta.dirname, '..', '..', 'src', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
const species: any[] = read('species.json');
const moves = new Set<string>((read('moves.json') as { id: string }[]).map((m) => m.id));
const byId = new Map(species.map((s) => [s.id, s]));
type L = [number, string];
const stats = (a: number[]) => ({ hp: a[0]!, atk: a[1]!, def: a[2]!, spa: a[3]!, spd: a[4]!, spe: a[5]! });
const inherit = (id: string): L[] => byId.get(id).learnset.map((e: any) => [e.level, e.move]);

interface Def { id: string; name: string; base: string; types: string[]; stats: number[]; from: string; stage: number; learn: L[]; abilities: { normal: string[]; hidden: string | null }; baseExp: number }
const D: Def[] = [
  { id: 'espeon-paradox', name: 'Paradox Espeon', base: 'espeon', types: ['psychic', 'fire'], stats: [70, 65, 65, 135, 95, 125], from: 'eevee', stage: 2, baseExp: 230,
    learn: [...inherit('espeon'), [30, 'flamethrower'], [40, 'calm-mind'], [48, 'fire-blast']], abilities: { normal: ['protosynthesis'], hidden: 'magic-bounce' } },
  { id: 'umbreon-paradox', name: 'Paradox Umbreon', base: 'umbreon', types: ['dark', 'steel'], stats: [100, 70, 120, 70, 130, 70], from: 'eevee', stage: 2, baseExp: 230,
    learn: [...inherit('umbreon'), [30, 'iron-head'], [38, 'flash-cannon'], [44, 'iron-defense']], abilities: { normal: ['protosynthesis'], hidden: 'inner-focus' } },
  { id: 'toxtricity-future', name: 'Future Toxtricity', base: 'toxtricity', types: ['electric', 'steel'], stats: [80, 100, 75, 125, 75, 95], from: 'toxel', stage: 2, baseExp: 230,
    learn: [...inherit('toxtricity'), [34, 'flash-cannon'], [40, 'thunderbolt'], [46, 'volt-switch']], abilities: { normal: ['quark-drive'], hidden: 'transistor' } },
  { id: 'toxtricity-past', name: 'Past Toxtricity', base: 'toxtricity', types: ['poison', 'grass'], stats: [85, 115, 80, 100, 85, 75], from: 'toxel', stage: 2, baseExp: 230,
    learn: [...inherit('toxtricity'), [34, 'giga-drain'], [40, 'sludge-bomb'], [46, 'power-whip']], abilities: { normal: ['protosynthesis'], hidden: 'poison-heal' } },
  { id: 'bastiodon-skull', name: 'Skull Bastiodon', base: 'bastiodon', types: ['rock', 'poison'], stats: [70, 80, 160, 45, 135, 30], from: 'shieldon', stage: 2, baseExp: 190,
    learn: [...inherit('bastiodon'), [30, 'sludge-bomb'], [36, 'poison-jab'], [42, 'toxic']], abilities: { normal: ['sturdy'], hidden: 'poison-heal' } },
  { id: 'aggron-evolution', name: 'Aggron Evolution', base: 'aggron', types: ['steel', 'rock'], stats: [75, 130, 185, 65, 75, 55], from: 'aggron', stage: 4, baseExp: 290,
    learn: [...inherit('aggron'), [56, 'meteor-mash'], [60, 'stone-edge'], [64, 'heavy-slam']], abilities: { normal: ['sturdy'], hidden: 'heavy-metal' } },
];

const out = D.map((d) => {
  for (const [, m] of d.learn) if (!moves.has(m)) throw new Error(`${d.id}: unknown move ${m}`);
  const b = byId.get(d.base);
  const seen = new Set<string>();
  const learnset = d.learn.filter(([l, m]) => !seen.has(`${l}${m}`) && seen.add(`${l}${m}`)).sort((a, c) => a[0] - c[0]).map(([level, move]) => ({ level, move }));
  return {
    id: d.id, dex: 1100 + D.indexOf(d), name: d.name, generation: b.generation, types: d.types, baseStats: stats(d.stats), catchRate: 45, baseExp: d.baseExp,
    growthRate: b.growthRate, evolutionStage: d.stage, evolvesFrom: d.from, tags: [], learnset, evolutions: [],
    abilities: d.abilities, assets: { sprite: `custom/${d.id}`, icon: b.assets.icon, cry: b.assets.cry }, weight: b.weight, femaleRatio: b.femaleRatio, eggGroups: b.eggGroups, color: b.color,
  };
});
// Aggron's new final stage is a plain level evolution (the others need a held item, see conditionEvolution.ts).
const evolutions = [{ from: 'aggron', to: 'aggron-evolution', level: 55 }];
writeFileSync(join(dataDir, 'jetSpecies.json'), JSON.stringify({ species: out, evolutions }) + '\n');
console.log(`wrote ${out.length} Jet species`);
