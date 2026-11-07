// Builds src/data/storySpecies.json: the ten new species of the Story Overhaul (slice S15).
//   npm run data:story-species
// Designed in plans/Story_Overhaul_Design_v2.md (Part II, Part X-B1). Stats, types and evolution
// levels follow its table. Evolution conditions the engine can't express yet (Heartbond level,
// night, storm) are level-only for now (docs/status/story-species.md). Abilities use existing
// ones; the signature abilities are not built. Art is stand-in (tools/make-story-sprites.py).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(import.meta.dirname, '..', 'src', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
const species: any[] = read('species.json');
const moves = new Set<string>((read('moves.json') as { id: string }[]).map((m) => m.id));
const byId = new Map(species.map((s) => [s.id, s]));
type L = [number, string];
const stats = (a: number[]) => ({ hp: a[0]!, atk: a[1]!, def: a[2]!, spa: a[3]!, spd: a[4]!, spe: a[5]! });
const inherit = (id: string): L[] => byId.get(id).learnset.map((e: any) => [e.level, e.move]);

interface Def {
  id: string; name: string; dex: number; types: string[]; stats: number[]; catchRate: number; baseExp: number;
  growthRate: string; stage: number; from: string | null; tags?: string[]; learn: L[]; evolvesTo?: { to: string; level: number }[];
  abilities: { normal: string[]; hidden: string | null }; art: { icon: string; cry: string }; weight: number; female: number | null;
  eggGroups: string[]; color: string; generation: number;
}
const D: Def[] = [
  { id: 'tuftin', name: 'Tuftin', dex: 1028, types: ['normal'], stats: [40, 40, 30, 30, 40, 45], catchRate: 190, baseExp: 45, growthRate: 'medium-fast', stage: 1, from: null, tags: ['baby'],
    learn: [[1, 'tackle'], [1, 'baby-doll-eyes'], [5, 'sand-attack'], [8, 'quick-attack'], [11, 'bite'], [14, 'swift']],
    evolvesTo: [{ to: 'eevee', level: 12 }], abilities: { normal: ['run-away'], hidden: 'anticipation' }, art: { icon: '1/133', cry: '133' }, weight: 2.4, female: 0.5, eggGroups: ['ground'], color: 'brown', generation: 9 },
  { id: 'oracowl', name: 'Oracowl', dex: 1029, types: ['psychic', 'flying'], stats: [110, 55, 70, 125, 115, 65], catchRate: 45, baseExp: 245, growthRate: 'medium-fast', stage: 3, from: 'noctowl',
    learn: [...inherit('noctowl'), [42, 'psychic'], [46, 'future-sight'], [50, 'calm-mind']],
    abilities: { normal: ['wise-eye'], hidden: 'tinted-lens' }, art: { icon: '2/164', cry: '164' }, weight: 52, female: 0.5, eggGroups: ['flying'], color: 'white', generation: 9 },
  // Day form (Sun Stone); Oracowl above is the Night form (Moon / Dusk Stone). Kice, 2026-11-07.
  { id: 'oracowl-day', name: 'Oracowl (Day)', dex: 1038, types: ['psychic', 'flying'], stats: [110, 100, 80, 95, 100, 55], catchRate: 45, baseExp: 245, growthRate: 'medium-fast', stage: 3, from: 'noctowl',
    learn: [...inherit('noctowl'), [42, 'psychic'], [46, 'solar-beam'], [50, 'calm-mind']],
    abilities: { normal: ['wise-eye'], hidden: 'serene-grace' }, art: { icon: '2/164', cry: '164' }, weight: 52, female: 0.5, eggGroups: ['flying'], color: 'brown', generation: 9 },
  { id: 'tempestwing', name: 'Tempestwing', dex: 1030, types: ['flying', 'fighting'], stats: [90, 125, 70, 55, 70, 120], catchRate: 45, baseExp: 245, growthRate: 'medium-slow', stage: 3, from: 'swellow',
    learn: [...inherit('swellow'), [46, 'close-combat'], [50, 'brave-bird'], [54, 'swords-dance']],
    abilities: { normal: ['eye-of-the-gale'], hidden: 'guts' }, art: { icon: '3/277', cry: '277' }, weight: 24, female: 0.5, eggGroups: ['flying'], color: 'gray', generation: 9 },
  { id: 'megawattrel', name: 'Megawattrel', dex: 1031, types: ['electric', 'flying'], stats: [80, 70, 70, 120, 70, 125], catchRate: 45, baseExp: 245, growthRate: 'medium-slow', stage: 3, from: 'kilowattrel',
    learn: [...inherit('kilowattrel'), [52, 'thunder'], [56, 'hurricane'], [60, 'calm-mind']],
    abilities: { normal: ['grid-surfer', 'volt-absorb'], hidden: 'competitive' }, art: { icon: '9/941', cry: '941' }, weight: 52, female: 0.5, eggGroups: ['water1', 'flying'], color: 'yellow', generation: 9 },
  { id: 'equinar', name: 'Equinar', dex: 1032, types: ['psychic', 'fairy'], stats: [100, 80, 100, 125, 115, 70], catchRate: 3, baseExp: 290, growthRate: 'slow', stage: 1, from: null, tags: ['legendary'],
    learn: [[1, 'confusion'], [1, 'disarming-voice'], [10, 'calm-mind'], [20, 'dazzling-gleam'], [30, 'psychic'], [40, 'moonblast'], [50, 'future-sight'], [60, 'recover']],
    abilities: { normal: ['pressure'], hidden: 'magic-bounce' }, art: { icon: '4/488', cry: '488' }, weight: 85, female: null, eggGroups: ['no-eggs'], color: 'purple', generation: 9 },
  { id: 'hollow-shepherd', name: 'Hollow Shepherd', dex: 1033, types: ['ghost', 'ice'], stats: [95, 100, 85, 110, 105, 95], catchRate: 3, baseExp: 290, growthRate: 'slow', stage: 1, from: null, tags: ['legendary'],
    learn: [[1, 'astonish'], [1, 'powder-snow'], [10, 'shadow-sneak'], [20, 'ice-beam'], [30, 'shadow-ball'], [40, 'phantom-force'], [50, 'blizzard'], [60, 'recover']],
    abilities: { normal: ['pressure'], hidden: 'cursed-body' }, art: { icon: '8/896', cry: '896' }, weight: 160, female: null, eggGroups: ['no-eggs'], color: 'white', generation: 9 },
  { id: 'brinecrown', name: 'Brinecrown', dex: 1034, types: ['water', 'flying'], stats: [90, 105, 90, 115, 90, 100], catchRate: 3, baseExp: 290, growthRate: 'slow', stage: 1, from: null, tags: ['legendary'],
    learn: [[1, 'gust'], [1, 'water-gun'], [10, 'aqua-jet'], [20, 'air-slash'], [30, 'surf'], [40, 'hurricane'], [50, 'hydro-pump'], [60, 'roost']],
    abilities: { normal: ['pressure'], hidden: 'rain-dish' }, art: { icon: '2/249', cry: '249' }, weight: 190, female: null, eggGroups: ['no-eggs'], color: 'blue', generation: 9 },
  { id: 'veinheart', name: 'Veinheart', dex: 1035, types: ['rock', 'steel'], stats: [105, 125, 135, 70, 95, 60], catchRate: 3, baseExp: 290, growthRate: 'slow', stage: 1, from: null, tags: ['legendary'],
    learn: [[1, 'rock-throw'], [1, 'metal-claw'], [10, 'rock-slide'], [20, 'iron-head'], [30, 'flash-cannon'], [40, 'stone-edge'], [50, 'meteor-mash'], [60, 'iron-defense']],
    abilities: { normal: ['sturdy'], hidden: 'clear-body' }, art: { icon: '3/379', cry: '379' }, weight: 420, female: null, eggGroups: ['no-eggs'], color: 'gray', generation: 9 },
  { id: 'lumeria', name: 'Lumeria', dex: 1036, types: ['bug', 'fairy'], stats: [80, 70, 75, 115, 105, 100], catchRate: 3, baseExp: 270, growthRate: 'slow', stage: 1, from: null, tags: ['mythical'],
    learn: [[1, 'struggle-bug'], [1, 'fairy-wind'], [10, 'silver-wind'], [20, 'dazzling-gleam'], [30, 'bug-buzz'], [40, 'moonblast'], [50, 'quiver-dance'], [60, 'moonlight']],
    abilities: { normal: ['serene-grace'], hidden: null }, art: { icon: '5/637', cry: '637' }, weight: 14, female: null, eggGroups: ['no-eggs'], color: 'pink', generation: 9 },
  { id: 'verdelis', name: 'Verdelis', dex: 1037, types: ['grass', 'bug'], stats: [85, 105, 90, 80, 95, 90], catchRate: 3, baseExp: 270, growthRate: 'slow', stage: 1, from: null, tags: ['mythical'],
    learn: [[1, 'leafage'], [1, 'fury-cutter'], [10, 'razor-leaf'], [20, 'x-scissor'], [30, 'giga-drain'], [40, 'leaf-blade'], [50, 'swords-dance'], [60, 'synthesis']],
    abilities: { normal: ['natural-cure'], hidden: null }, art: { icon: '2/251', cry: '251' }, weight: 9, female: null, eggGroups: ['no-eggs'], color: 'green', generation: 9 },
];

const out = D.map((d) => {
  for (const [, m] of d.learn) if (!moves.has(m)) throw new Error(`${d.id}: unknown move ${m}`);
  const seen = new Set<string>();
  const learnset = d.learn.filter(([l, m]) => !seen.has(`${l}${m}`) && seen.add(`${l}${m}`)).sort((a, b) => a[0] - b[0]).map(([level, move]) => ({ level, move }));
  return {
    id: d.id, dex: d.dex, name: d.name, generation: d.generation, types: d.types, baseStats: stats(d.stats), catchRate: d.catchRate, baseExp: d.baseExp,
    growthRate: d.growthRate, evolutionStage: d.stage, evolvesFrom: d.from, tags: d.tags ?? [], learnset, evolutions: d.evolvesTo ?? [], abilities: d.abilities,
    assets: { sprite: `custom/${d.id}`, ...d.art }, weight: d.weight, femaleRatio: d.female, eggGroups: d.eggGroups, color: d.color,
  };
});
// The three new final stages evolve by condition (src/core/conditionEvolution.ts), not by level alone, so no plain level entries here.
const evolutions: { from: string; to: string; level: number }[] = [];
// Eevee now has a baby; TMs and tutors for the new Legends and Tuftin (the others borrow their pre-evolution's list).
const abilities = [
  { id: 'wise-eye', name: 'Wise Eye', description: 'Ignores the foe raising its evasion and prevents its own accuracy from being lowered.' },
  { id: 'eye-of-the-gale', name: 'Eye of the Gale', description: 'Raises Speed by one stage after surviving a super-effective hit.' },
  { id: 'grid-surfer', name: 'Grid Surfer', description: 'Doubles Speed on Electric Terrain and raises Speed by one stage after landing an Electric move.' },
];
const patches = [{ id: 'eevee', evolvesFrom: 'tuftin' }];
// Wild-availability rows (the CSV import only knows PokeAPI's species). Babies and Legends are not wild-eligible, so only Tuftin needs one.
const availability = { tuftin: { rarity: 'common', difficulty: 1, minLevel: 4, maxLevel: 8, captureRate: 190 } };
const common = ['protect', 'rest', 'sleep-talk', 'substitute', 'toxic', 'hidden-power', 'return', 'facade', 'double-team', 'endure'];
const other: Record<string, string[]> = {
  tuftin: ['covet', 'charm', 'yawn', 'helping-hand'], equinar: ['calm-mind', 'psyshock', 'shadow-ball', 'energy-ball', 'light-screen', 'reflect'],
  'hollow-shepherd': ['ice-beam', 'blizzard', 'shadow-ball', 'will-o-wisp', 'icy-wind', 'curse'], brinecrown: ['hydro-pump', 'surf', 'hurricane', 'rain-dance', 'ice-beam', 'roost'],
  veinheart: ['earthquake', 'stone-edge', 'rock-slide', 'iron-defense', 'stealth-rock', 'swords-dance'], lumeria: ['bug-buzz', 'moonblast', 'quiver-dance', 'psychic', 'giga-drain', 'u-turn'],
  verdelis: ['leaf-blade', 'x-scissor', 'swords-dance', 'earthquake', 'u-turn', 'synthesis'],
};
const learnables: Record<string, { egg: string[]; other: string[] }> = {};
for (const [id, extra] of Object.entries(other)) {
  const list = [...new Set([...extra, ...(id === 'tuftin' ? [] : common)])];
  for (const m of list) if (!moves.has(m)) throw new Error(`${id}: unknown move ${m}`);
  learnables[id] = { egg: id === 'tuftin' ? ['wish', 'curse', 'stored-power'].filter((m) => moves.has(m)) : [], other: list };
}
writeFileSync(join(dataDir, 'storySpecies.json'), JSON.stringify({ species: out, evolutions, patches, abilities, learnables, availability }) + '\n');
console.log(`wrote ${out.length} species, ${evolutions.length} evolutions`);
