// Builds src/data/jetSpecies.json from the director's Jet Pokédex data (tools/jet/source/pokedex.json, 2026-11-07):
//   node tools/jet/build-jet-species.ts
// Twenty-three Pokémon (six from the first Jet pack, seventeen from the Beta 4.4 batch): Vine Riff, Electric Oncore (Toxel), Pyro Spirit, Neon Moon (Eevee), Bastiodoom (Bastiodon), Cataggron (Aggron;
// Attack and Defence Formes are battle forms). Base stats, types, moves, TMs and abilities are the pack's. The pack's evolution
// rules (held item, nature, time, friendship) live in src/core/conditionEvolution.ts. Sprites: tools/jet/make-jet-sprites.py.
// The Beta 4.4 batch: Maliceye, Gemgoyle, Decidueye (Assassian), Dreadodile, Promised Prince and its line, the Alolan Trapinch, Dratini lines, the Paldean Golett line and Mega Alolan Flygon.
// Not in the game from the pack: the Pokédex entry texts, EV yields, height, and the "spread" targeting of the sound moves.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const here = import.meta.dirname;
const dataDir = join(here, '..', '..', 'src', 'data');
const read = (f: string) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
const pack = JSON.parse(readFileSync(join(here, 'source', 'pokedex.json'), 'utf8')).pokemon as any[];
const species: any[] = read('species.json');
const moveList: any[] = read('moves.json');
const moves = new Set<string>(moveList.map((m) => m.id));
const byId = new Map(species.map((s) => [s.id, s]));
const kebab = (s: string) => s.toLowerCase().replace(/[_ ]/g, '-');
const FIRST = { cataggron: 'aggron' } as Record<string, string>;
// Beta 4.4 batch: the existing species each new one is built on (generation, icon, cry and colour borrow from it).
const BASED: Record<string, string> = {
  maliceye: 'sableye', gemgoyle: 'sableye', 'decidueye-assassian': 'decidueye', dreadodile: 'krookodile', 'promised-prince': 'piplup', 'benovolant-beak': 'prinplup',
  'tyrant-king': 'empoleon', 'fallen-liege': 'empoleon', 'alolan-trapinch': 'trapinch', 'alolan-vibrava': 'vibrava', 'alolan-flygon': 'flygon', 'mega-alolan-flygon': 'flygon',
  'paldean-golett': 'golett', 'paldean-golurk': 'golurk', 'alolan-dratini': 'dratini', 'alolan-dragonair': 'dragonair', 'alolan-dragonite': 'dragonite',
};
// Game ids: the Mega is called like the other Megas.
const GAME_ID: Record<string, string> = { 'mega-alolan-flygon': 'alolan-flygon-mega' };
const gid = (packId: string) => GAME_ID[packId] ?? packId;

const ICON: Record<string, string> = { 'vine-riff': '8/849', 'electric-oncore': '8/849', 'pyro-spirit': '2/196', 'neon-moon': '2/197', bastiodoom: '4/411', cataggron: '3/306' };
const CRY: Record<string, string> = { 'vine-riff': '849', 'electric-oncore': '849', 'pyro-spirit': '196', 'neon-moon': '197', bastiodoom: '411', cataggron: '306' };
const EGG: Record<string, string> = { 'Human-Like': 'humanshape', Field: 'ground', Monster: 'monster', 'Water 1': 'water1', Mineral: 'mineral', Dragon: 'dragon', Bug: 'bug', Flying: 'flying' };
const COLOR: Record<string, string> = { 'vine-riff': 'green', 'electric-oncore': 'purple', 'pyro-spirit': 'red', 'neon-moon': 'black', bastiodoom: 'gray', cataggron: 'gray' };
const stat = (b: any) => ({ hp: b.hp, atk: b.attack, def: b.defense, spa: b.spAtk, spd: b.spDef, spe: b.speed });

// New moves (the signature moves; Cataclysm Cannon has one version per Forme, picked in battle by its user's form).
const mv = (id: string, name: string, type: string, category: string, power: number, accuracy: number, pp: number, flags: string[], effects: object, extra: object = {}) =>
  ({ id, name, type, category, power, accuracy, pp, priority: 0, critStage: 0, target: 'enemy', flags, effects, ...extra });
const newMoves = [
  mv('thornstrum', 'Thornstrum', 'grass', 'special', 80, 100, 10, ['sound'], { powerRule: 'poisonedBoost' }),
  mv('feedback-shred', 'Feedback Shred', 'electric', 'special', 90, 100, 10, ['sound'], { status: { id: 'par', chance: 20 } }),
  mv('grave-rampart', 'Grave Rampart', 'poison', 'special', 80, 100, 10, [], { attackFrom: 'spd', status: { id: 'psn', chance: 30 } }),
  mv('mindflare', 'Mindflare', 'fire', 'special', 85, 100, 10, [], { targetsDefense: true, status: { id: 'brn', chance: 10 } }),
  mv('neon-eclipse', 'Neon Eclipse', 'dark', 'physical', 75, 100, 10, ['contact'], { drain: 0.5 }),
  mv('cataclysm-cannon', 'Cataclysm Cannon', 'steel', 'physical', 100, 90, 5, [], {}),
  mv('cataclysm-cannon-attack', 'Cataclysm Cannon', 'steel', 'physical', 130, 90, 5, ['jetform'], { recoil: 0.25 }),
  mv('cataclysm-cannon-defence', 'Cataclysm Cannon', 'steel', 'physical', 80, 90, 5, ['jetform'], { statChanges: [{ stat: 'def', stages: 1, target: 'self', chance: 100 }] }),
  // Beta 4.4 batch.
  mv('jewel-juggle', 'Jewel Juggle', 'ghost', 'special', 25, 90, 10, [], { hits: [2, 5], statChanges: [{ stat: 'spd', stages: -1, target: 'enemy', chance: 10 }] }),
  mv('prism-maw', 'Prism Maw', 'dragon', 'physical', 85, 100, 10, ['bite', 'contact'], { statChanges: [{ stat: 'def', stages: -1, target: 'enemy', chance: 30 }] }),
  mv('dusk-volley', 'Dusk Volley', 'dark', 'physical', 120, 100, 10, [], { charge: {}, koBoost: { stat: 'spe', stages: 1 } }, { critStage: 1 }),
  mv('quake-jaw', 'Quake Jaw', 'ground', 'physical', 90, 100, 10, ['bite', 'contact'], {}),
  mv('spark-splash', 'Spark Splash', 'water', 'special', 40, 100, 25, [], { status: { id: 'par', chance: 20 } }),
  mv('riptide-arc', 'Riptide Arc', 'electric', 'special', 70, 100, 15, [], { status: { id: 'par', chance: 30 }, powerRule: 'rainBoost' }),
  mv('imperial-plunge', 'Imperial Plunge', 'flying', 'physical', 95, 95, 10, ['contact'], { statChanges: [{ stat: 'def', stages: -1, target: 'enemy', chance: 30 }] }),
  mv('storm-rend', 'Storm Rend', 'electric', 'physical', 90, 100, 10, ['slicing', 'contact'], { status: { id: 'par', chance: 10 } }, { critStage: 1 }),
  mv('burrow-snap', 'Burrow Snap', 'ground', 'physical', 60, 100, 20, ['bite', 'contact'], { bind: true }),
  mv('wingsong', 'Wingsong', 'bug', 'special', 65, 100, 15, ['sound'], { confuse: { chance: 20 } }),
  mv('cyclone-wing', 'Cyclone Wing', 'flying', 'special', 85, 100, 10, [], { powerRule: 'tailwindBoost' }),
  mv('hypnospot', 'Hypnospot', 'psychic', 'special', 80, 100, 15, [], { status: { id: 'slp', chance: 10 } }),
  mv('hypnospot-mega', 'Hypnospot', 'psychic', 'special', 80, 100, 15, ['jetform'], { status: { id: 'slp', chance: 30 } }),
  mv('rune-jab', 'Rune Jab', 'ghost', 'physical', 40, 100, 30, ['punch', 'contact'], {}, { priority: 1 }),
  mv('bastion-fist', 'Bastion Fist', 'rock', 'physical', 100, 90, 10, ['punch', 'contact'], { breaksScreens: true }),
  mv('coral-splash', 'Coral Splash', 'water', 'special', 45, 100, 25, [], { statChanges: [{ stat: 'spe', stages: -1, target: 'enemy', chance: 30 }] }),
  mv('pearl-pulse', 'Pearl Pulse', 'water', 'special', 75, 100, 15, ['pulse'], { statChanges: [{ stat: 'spd', stages: 1, target: 'self', chance: 20 }] }),
  mv('reef-tempest', 'Reef Tempest', 'water', 'special', 100, 100, 5, [], { weather: 'rain' }),
];
const known = new Set([...moves, ...newMoves.map((m) => m.id)]);

const abilities: { id: string; name: string; description: string }[] = [];
const out: any[] = [];
const learnables: Record<string, { egg: string[]; other: string[] }> = {};
// Evolutions the species files carry: level ups inside the pack, and routes from an existing species (item).
const evolutions: { from: string; to: string; level?: number; item?: string }[] = [];
const tmCsv = readFileSync(join(here, 'source', 'tm_moves.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
const packById = new Map(pack.map((p) => [kebab(p.id), p]));
const stageOf = (id: string): number => {
  const p = packById.get(id)!;
  if (!p.evolution.from) return 1;
  const from = kebab(p.evolution.from);
  return packById.has(from) ? stageOf(from) + 1 : (byId.get(FIRST[id] ?? from)?.evolutionStage ?? 1) + 1;
};
let dex = 1100;

for (const p of pack) {
  const id = kebab(p.id);
  const mega = p.evolution.trigger === 'mega_evolution';
  const sid0 = gid(id);
  const stage = mega ? stageOf(kebab(p.evolution.from)) : stageOf(id);
  const learn: [number, string][] = [];
  for (const e of p.learnset.levelUp) {
    const m = kebab(e.moveId);
    if (!known.has(m)) throw new Error(`${id}: unknown move ${m}`);
    learn.push([e.level === 0 ? Math.max(1, p.evolution.minLevel ?? 1) : e.level, m]);
  }
  const seen = new Set<string>();
  const learnset = learn.filter(([l, m]) => !seen.has(`${l}${m}`) && seen.add(`${l}${m}`)).sort((a, b) => a[0] - b[0]).map(([level, move]) => ({ level, move }));
  const slot = (s: string) => p.abilities.find((a: any) => a.slot === s);
  for (const a of p.abilities) if (a.isNew && !abilities.some((x) => x.id === kebab(a.id))) abilities.push({ id: kebab(a.id), name: a.name, description: a.description });
  const normal = [slot('standard'), slot('unique')].filter(Boolean).map((a: any) => kebab(a.id));
  const base = byId.get(BASED[id] ?? FIRST[id] ?? kebab(p.evolution.from));
  if (!base) throw new Error(`${id}: no base species`);
  const from = p.evolution.from ? (mega ? 'alolan-vibrava' : kebab(p.evolution.from)) : null;
  const mk = (sid: string, name: string, stats: any, extra: object) => ({
    id: sid, dex: dex++, name, generation: base.generation, types: p.types.map((t: string) => t.toLowerCase()), baseStats: stat(stats), catchRate: p.profile.catchRate, baseExp: p.profile.baseExp,
    growthRate: p.profile.growthRate.toLowerCase().replace(/ /g, '-'), evolutionStage: stage, evolvesFrom: from, tags: stage === 1 && !p.evolution.from && BASED[id] ? ['scout'] : [], learnset, evolutions: [],
    abilities: { normal, hidden: slot('hidden') ? kebab(slot('hidden').id) : null }, assets: { sprite: `custom/${sid}`, icon: ICON[id] ?? `${base.generation}/${base.dex}`, cry: CRY[id] ?? `${base.dex}` },
    weight: p.profile.weightKg, femaleRatio: p.profile.genderRatio ? p.profile.genderRatio.femalePercent / 100 : null, eggGroups: p.profile.eggGroups.map((g: string) => EGG[g] ?? g.toLowerCase()), color: COLOR[id] ?? base.color, ...extra,
  });
  if (p.forms?.length) {
    for (const f of p.forms) out.push(mk(f.isDefault ? id : `${id}-${f.id}`, f.isDefault ? p.name : `${f.name.replace(' Forme', '')} ${p.name}`, f.baseStats, f.isDefault ? {} : { form: { kind: 'battle', base: id } }));
  } else if (mega) out.push(mk(sid0, p.name, p.baseStats, { form: { kind: 'mega', base: 'alolan-flygon' } }));
  else out.push(mk(sid0, p.name, p.baseStats, {}));
  // Evolutions that are plain level ups (or an item on an existing species) live in the species data; held-item, nature, time and party routes are in core/conditionEvolution.ts.
  const e = p.evolution;
  if (!mega && e.from && e.trigger === 'level_up' && e.minLevel && !e.heldItem && !e.natures?.length && !e.time && !e.partyRequirement) {
    if (packById.has(kebab(e.from))) evolutions.push({ from: kebab(e.from), to: sid0, level: e.minLevel });
  } else if (e.trigger === 'use_item' && e.item) evolutions.push({ from: kebab(e.from), to: sid0, item: kebab(e.item) });
  const tm = [...new Set(tmCsv.filter((r) => r[0] === p.id).map((r) => kebab(r[2]!)).filter((m) => moves.has(m)))];
  for (const f of out.filter((o) => o.id === sid0 || o.id.startsWith(`${sid0}-`))) learnables[f.id] = { egg: [], other: tm };
}
// The species file lists a pack species' own level-up evolutions too, so the Pokédex and evolution screens show them.
for (const ev of evolutions.filter((x) => x.level !== undefined)) {
  const target = out.find((o) => o.id === ev.from);
  if (target) { target.evolutions.push({ to: ev.to, level: ev.level }); }
}
const external = evolutions.filter((x) => !out.some((o) => o.id === x.from)).map((x) => (x.item ? { from: x.from, to: x.to, item: x.item } : { from: x.from, to: x.to, level: x.level }));
// Alolan Flygonite, the Mega Stone of Alolan Flygon.
const items = [{ id: 'alolan-flygonite', name: 'Alolan Flygonite', description: 'Lets Alolan Flygon Mega Evolve in battle (needs the Mega Ring).', category: 'transformation', iconAssetId: 'item.alolan_flygonite', usableInBattle: false, usableOutside: false, target: 'none', effect: { kind: 'megaStone', forms: { 'alolan-flygon': 'alolan-flygon-mega' }, primal: false } }];
const rewards = [{ id: 'alolan-flygonite', name: 'Alolan Flygonite', description: items[0]!.description, category: 'transformation', rarity: 'rare', effect: { kind: 'addItem', item: 'alolan-flygonite', quantity: 1 }, stacking: 'instant', scope: 'run', moneyMultiplierApplies: false, iconAssetId: 'item.alolan_flygonite' }];
// Move descriptions: the pack's signature move texts (a quoted CSV; the last column is the text). The Forme versions share their move's text.
const descriptions: Record<string, string> = {};
for (const line of readFileSync(join(here, 'source', 'signature_moves.csv'), 'utf8').trim().split('\n').slice(1)) {
  const m = /^[^,]*,[^,]*,([A-Z_]+),.*?,("(?:[^"]|"")*"|[^,]*)$/.exec(line);
  if (m) descriptions[kebab(m[1]!)] = m[2]!.replace(/^"|"$/g, '').replace(/""/g, '"');
}
descriptions['cataclysm-cannon-attack'] = descriptions['cataclysm-cannon-defence'] = descriptions['cataclysm-cannon']!;
descriptions['hypnospot-mega'] = descriptions['hypnospot']!;
for (const m of newMoves) if (!descriptions[m.id]) throw new Error(`no description for ${m.id}`);
writeFileSync(join(dataDir, 'jetSpecies.json'), JSON.stringify({ species: out, evolutions: external, moves: newMoves, abilities, learnables, items, rewards, descriptions }) + '\n');
console.log(`wrote ${out.length} Jet species, ${newMoves.length} moves, ${abilities.length} abilities`);

// Presentation: each new move borrows the look of the strongest ordinary move of its type and category (src/data/moveAnims.json, presentation only).
const animsPath = join(dataDir, 'moveAnims.json');
const anims = JSON.parse(readFileSync(animsPath, 'utf8')) as { moves: Record<string, unknown> };
for (const m of newMoves) {
  const donor = moveList
    .filter((o) => o.type === m.type && o.category === m.category && anims.moves[o.id] && !/^(z|max)-/.test(o.id))
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
  if (!donor) throw new Error(`no animation donor for ${m.id}`);
  const { pack: _pack, script: _script, ...look } = anims.moves[donor.id] as Record<string, unknown>;
  anims.moves[m.id] = { ...look, source: 'type', ...(m.id === 'dusk-volley' ? { script: 'duskvolley' } : {}) };
}
writeFileSync(animsPath, JSON.stringify(anims, null, 2) + '\n');
