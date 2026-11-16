// Builds src/data/jetSpecies.json from the director's Jet Pokédex data (tools/jet/source/pokedex.json, 2026-11-07):
//   node tools/jet/build-jet-species.ts
// Twenty-three Pokémon (six from the first Jet pack, seventeen from the Beta 4.4 batch): Vine Riff, Electric Oncore (Toxel), Pyro Spirit, Neon Moon (Eevee), Bastiodoom (Bastiodon), Cataggron (Aggron;
// Attack and Defence Formes are battle forms). Base stats, types, moves, TMs and abilities are the pack's. The pack's evolution
// rules (held item, nature, time, friendship) live in src/core/conditionEvolution.ts. Sprites: tools/jet/make-jet-sprites.py.
// The Beta 4.4 batch: Maliceye, Gemgoyle, Decidueye (Assassian), Dreadodile, Promised Prince and its line, the Alolan Trapinch, Dratini lines, the Paldean Golett line and Mega Alolan Flygon.
// Beta 0.7 batch: 39 more (the Galarian lines, Magmuk, Neocleon, Hoopno) with 16 new signature moves and 15 new abilities.
// Not in the game from the pack: the Pokédex entry texts, EV yields, height, and the "spread" targeting of the sound moves.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseMove, type PackMove } from './jetMoveText.ts';
import { JET_ABILITIES } from '../../src/core/battle/jetAbilities.ts';

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
// Beta 0.7 batch: 'galarian-<x>' is built on <x>; the rest are named here.
const BASED_2: Record<string, string> = { magmuk: 'muk', neocleon: 'kecleon', hoopno: 'hypno' };
const baseOf = (id: string): string | undefined => BASED[id] ?? BASED_2[id] ?? (id.startsWith('galarian-') ? id.slice('galarian-'.length) : undefined);
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
  // Beta 0.7 batch (Galarian lines). The spread moves hit one target (the engine's spread targeting is still to come).
  mv('molten-sludge', 'Molten Sludge', 'poison', 'physical', 95, 100, 10, ['contact'], { status: { id: 'brn', chance: 30 } }),
  mv('carrion-dive', 'Carrion Dive', 'dark', 'physical', 85, 100, 10, ['contact'], {}, { critStage: 1 }),
  mv('parcel-slam', 'Parcel Slam', 'normal', 'physical', 90, 100, 10, ['contact'], { statChanges: [{ stat: 'spe', stages: -1, target: 'enemy', chance: 30 }] }),
  mv('dumpster-slam', 'Dumpster Slam', 'steel', 'physical', 90, 100, 10, ['contact'], { status: { id: 'psn', chance: 30 } }),
  mv('paella-pan-toss', 'Paella Pan Toss', 'fire', 'special', 90, 100, 10, [], { status: { id: 'brn', chance: 20 } }),
  mv('static-lash', 'Static Lash', 'electric', 'physical', 50, 100, 15, ['contact'], { status: { id: 'par', chance: 30 } }, { priority: 1 }),
  mv('verdant-pulse', 'Verdant Pulse', 'grass', 'special', 90, 100, 10, ['pulse'], { statChanges: [{ stat: 'spe', stages: -1, target: 'enemy', chance: 30 }] }),
  mv('cable-snare', 'Cable Snare', 'electric', 'physical', 80, 100, 10, ['contact'], { bind: true, status: { id: 'par', chance: 10 } }),
  mv('pitaya-burst', 'Pitaya Burst', 'grass', 'special', 90, 100, 10, [], { healSelf: 0.125 }),
  mv('thunderhead-burst', 'Thunderhead Burst', 'electric', 'special', 90, 90, 10, [], { status: { id: 'par', chance: 30 }, powerRule: 'electricTerrainBoost' }),
  mv('venom-gnash', 'Venom Gnash', 'poison', 'physical', 85, 100, 10, ['bite', 'contact'], { status: { id: 'psn', chance: 30 } }),
  mv('inferno-crush', 'Inferno Crush', 'fire', 'physical', 110, 90, 5, ['contact'], { status: { id: 'brn', chance: 30 } }),
  mv('molten-coil', 'Molten Coil', 'fire', 'physical', 90, 100, 10, ['contact'], { bind: true }),
  mv('froth-burst', 'Froth Burst', 'water', 'special', 85, 100, 10, [], { statChanges: [{ stat: 'def', stages: 1, target: 'self', chance: 30 }] }),
  mv('regal-ribbon', 'Regal Ribbon', 'fairy', 'special', 130, 90, 5, [], { statChanges: [{ stat: 'spa', stages: -2, target: 'self', chance: 100 }] }),
  mv('ring-toss', 'Ring Toss', 'psychic', 'physical', 80, 100, 10, [], { drowsy: { chance: 30 } }),
];
import { readdirSync } from 'node:fs';
// Moves and abilities other data files already hold (Mega signature moves, Story, canon, catalog overhaul): never added twice.
const otherJson = (sub: string) => readdirSync(join(dataDir, 'catalogOverhaul', sub)).flatMap((f) => JSON.parse(readFileSync(join(dataDir, 'catalogOverhaul', sub, f), 'utf8')) as any[]);
const otherMoves = new Set<string>([...read('megaMoves.json').moves, ...read('storySpecies.json').moves ?? [], ...read('storySignatureMoves.json').moves, ...read('canonMoves.json').moves, ...otherJson('moves')].map((m: any) => m.id));
const otherAbilities = new Set<string>([...read('abilities.json'), ...read('storySpecies.json').abilities, ...otherJson('abilities')].map((a: any) => a.id));
const known = new Set([...moves, ...otherMoves, ...newMoves.map((m) => m.id)]);

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

const OLD_DEX = 62; // the first 62 pack entries were built by earlier batches (Beta 4.4, Beta 0.7)
for (const p of pack.filter((x) => x.dexNumber <= OLD_DEX)) {
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
  for (const a of p.abilities) if (a.isNew && !otherAbilities.has(kebab(a.id)) && !abilities.some((x) => x.id === kebab(a.id))) abilities.push({ id: kebab(a.id), name: a.name, description: a.description });
  const normal = p.abilities.filter((a: any) => a.slot !== 'hidden').map((a: any) => kebab(a.id));
  const base = byId.get(baseOf(id) ?? FIRST[id] ?? kebab(p.evolution.from));
  if (!base) throw new Error(`${id}: no base species`);
  const from = p.evolution.from ? (mega ? 'alolan-vibrava' : kebab(p.evolution.from)) : null;
  const mk = (sid: string, name: string, stats: any, extra: object) => ({
    id: sid, dex: dex++, name, generation: base.generation, types: p.types.map((t: string) => t.toLowerCase()), baseStats: stat(stats), catchRate: p.profile.catchRate, baseExp: p.profile.baseExp,
    growthRate: p.profile.growthRate.toLowerCase().replace(/ /g, '-'), evolutionStage: stage, evolvesFrom: from, tags: stage === 1 && !p.evolution.from && baseOf(id) ? ['scout'] : [], learnset, evolutions: [],
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
  // (Condition routes of this batch - friendship, a known move, a held item - are in core/conditionEvolution.ts.)
  const tm = [...new Set(tmCsv.filter((r) => r[0] === p.id).map((r) => kebab(r[2]!)).filter((m) => moves.has(m)))];
  for (const f of out.filter((o) => o.id === sid0 || o.id.startsWith(`${sid0}-`))) learnables[f.id] = { egg: [], other: tm };
}
// The species file lists a pack species' own level-up evolutions too, so the Pokédex and evolution screens show them.
for (const ev of evolutions.filter((x) => x.level !== undefined)) {
  const target = out.find((o) => o.id === ev.from);
  if (target) { target.evolutions.push({ to: ev.to, level: ev.level }); }
}
// Stone routes inside the pack (Galarian Muk to Magmuk with a Fire Stone ...) are listed on the species too.
for (const ev of evolutions.filter((x) => x.item)) {
  const target = out.find((o) => o.id === ev.from);
  if (target) target.evolutions.push({ to: ev.to, item: ev.item });
}
const external = evolutions.filter((x) => !out.some((o) => o.id === x.from)).map((x) => (x.item ? { from: x.from, to: x.to, item: x.item } : { from: x.from, to: x.to, level: x.level }));
// Alolan Flygonite, the Mega Stone of Alolan Flygon.
const items: any[] = [{ id: 'alolan-flygonite', name: 'Alolan Flygonite', description: 'Lets Alolan Flygon Mega Evolve in battle (needs the Mega Ring).', category: 'transformation', iconAssetId: 'item.alolan_flygonite', usableInBattle: false, usableOutside: false, target: 'none', effect: { kind: 'megaStone', forms: { 'alolan-flygon': 'alolan-flygon-mega' }, primal: false } }];
const rewards: any[] = [{ id: 'alolan-flygonite', name: 'Alolan Flygonite', description: items[0]!.description, category: 'transformation', rarity: 'rare', effect: { kind: 'addItem', item: 'alolan-flygonite', quantity: 1 }, stacking: 'instant', scope: 'run', moneyMultiplierApplies: false, iconAssetId: 'item.alolan_flygonite' }];
// ---- Batch 5 (2026-11-16): the rest of the pack, dex 63-207 (145 Pokémon) ----
const abilitiesBefore = abilities.length;
const nameId = (s: string) => s.toLowerCase().replace(/[.'’]/g, '').replace(/[_ ]/g, '-');
const ITEM_ID: Record<string, string> = { Leek: 'stick', 'Never-Melt Ice': 'nevermeltice', 'Twisted Spoon': 'twistedspoon' };
const itemId = (n: string) => ITEM_ID[n] ?? nameId(n);
const EGG2: Record<string, string> = { Undiscovered: 'no-eggs', Amorphous: 'indeterminate', 'Water 1': 'water1', 'Water 2': 'water2', 'Water 3': 'water3', 'Human-Like': 'humanshape', Field: 'ground', Grass: 'plant' };
const eggs2 = (gs: string[]) => gs.map((g) => EGG2[g] ?? g.toLowerCase());
const newPack = pack.filter((x) => x.dexNumber > OLD_DEX);
const isFormPack = (p: any) => p.evolution.trigger === 'mega_evolution' || p.evolution.trigger === 'dynamax';
// The game id of the species a Mega / Dynamax form belongs to (a pack species keeps its pack id: katanetch-d).
const baseGameId = (p: any): string => { const bp = pack.find((x) => x.name === p.evolution.from && !isFormPack(x)); return bp ? kebab(bp.id) : nameId(p.evolution.from); };
const gameIdOf = (p: any): string => {
  if (p.evolution.trigger === 'mega_evolution') { const suf = /-([xyz])$/.exec(kebab(p.id)); return `${baseGameId(p)}-mega${suf ? `-${suf[1]}` : ''}`; }
  if (p.evolution.trigger === 'dynamax') return `${baseGameId(p)}-gmax`;
  return kebab(p.id);
};
const findSp = (id: string): any => out.find((o) => o.id === id) ?? byId.get(id);
const conditionEvolutions: any[] = [];
const BASED_3: Record<string, string> = { pinchit: 'pinsir', pincero: 'pinsir', hercub: 'heracross', herakid: 'heracross', 'snowman-snorlax': 'snorlax', 'ancient-exeggutor': 'exeggutor', 'nightmare-exeggutor': 'exeggutor' };
const G_EFFECTS: Record<string, object> = { 'g-max-toxitide': { status: 'psn' }, 'g-max-overgrowth': { bind: true } };
const patches: { id: string; evolvesFrom: string; evolutionStage?: number }[] = [];
const footprintBase: Record<string, string> = {};
// An existing species that now follows a new one moves up a stage (Fearow: Spearow, Skyrake, Fearow).
const addPatch = (target: string, from: string, fromStage: number, first = true) => {
  const t = byId.get(target)!;
  const stage = Math.max(t.evolutionStage, fromStage + 1);
  t.evolutionStage = stage;
  patches.push({ id: target, evolvesFrom: first ? from : t.evolvesFrom, evolutionStage: stage });
  for (const ev of t.evolutions ?? []) if (byId.has(ev.to) && byId.get(ev.to).evolutionStage <= stage) addPatch(ev.to, target, stage, false);
};
const megaMoves: Record<string, string> = {};
const moveLimits: Record<string, string[]> = {};
const droppedLearn: Record<string, string[]> = {};
const gmaxEntries: Record<string, { forms: string[]; type: string; effects?: object }> = {};
const gmaxMoves: any[] = [];
const megaStones: { id: string; name: string; base: string; form: string; type: string }[] = [];
const packMoveOf = (p: any): PackMove | undefined => p.signatureMove;

// New signature moves, built from the pack's effect text (tools/jet/jetMoveText.ts).
for (const p of newPack) {
  const sm = packMoveOf(p);
  if (!sm) continue;
  const id = kebab(sm.id);
  if (known.has(id)) continue;
  if (sm.category === 'Max') {
    gmaxMoves.push({ id, name: sm.name, type: sm.type.toLowerCase(), category: 'status', power: null, accuracy: null, pp: 5, priority: 0, critStage: 0, target: 'enemy', flags: [], effects: {}, supported: false, needs: `${sm.name}: ${sm.description}` });
    known.add(id);
    continue;
  }
  const r = parseMove(sm);
  const status = sm.category === 'Status';
  const power = sm.power ?? (/Power (\d+)/.exec(sm.description) ? Number(/Power (\d+)/.exec(sm.description)![1]) : null);
  const mega = p.evolution.trigger === 'mega_evolution';
  const flags = [...r.flags, ...(mega ? ['megasig'] : [])];
  const move = mv(id, sm.name, sm.type.toLowerCase(), sm.category.toLowerCase(), (power ?? (r.effects.counter ? 60 : null)) as number, r.accuracy as number, sm.pp ?? 10, flags, r.effects, { critStage: r.critStage, priority: r.priority, ...(sm.target === 'self_or_field' ? { target: 'self' } : {}) });
  void status;
  newMoves.push(move);
  known.add(id);
  if (r.left.length) moveLimits[id] = r.left;
}

const addAbilities = (p: any) => {
  for (const a of p.abilities) if (a.isNew && !otherAbilities.has(kebab(a.id)) && !abilities.some((x) => x.id === kebab(a.id))) abilities.push({ id: kebab(a.id), name: a.name, description: a.description });
};
const megaSigIds = new Set<string>(Object.values(read('megaMoves.json').byForm as Record<string, string>));
const learnOf = (p: any): { level: number; move: string }[] => {
  const seen2 = new Set<string>();
  const dropped: string[] = [];
  const list: [number, string][] = [];
  for (const e of p.learnset.levelUp) {
    const m = kebab(e.moveId);
    if (!known.has(m)) { dropped.push(m); continue; }
    if (megaSigIds.has(m)) continue;
    list.push([e.level === 0 ? Math.max(1, p.evolution.minLevel ?? 1) : e.level, m]);
  }
  if (dropped.length) droppedLearn[p.id] = dropped;
  return list.filter(([l, m]) => !seen2.has(`${l}${m}`) && seen2.add(`${l}${m}`)).sort((a, b) => a[0] - b[0]).map(([level, move]) => ({ level, move }));
};
const tmOf = (p: any) => [...new Set(tmCsv.filter((r) => r[0] === p.id).map((r) => kebab(r[2]!)).filter((m) => moves.has(m)))];
const mkNew = (p: any, sid: string, base: any, stage: number, from: string | null, learnset: unknown, extra: object) => ({
  id: sid, dex: dex++, name: p.name, generation: base.generation, types: p.types.map((t: string) => t.toLowerCase()), baseStats: stat(p.baseStats), catchRate: p.profile.catchRate, baseExp: p.profile.baseExp,
  growthRate: p.profile.growthRate.toLowerCase().replace(/ /g, '-'), evolutionStage: stage, evolvesFrom: from, tags: [] as string[], learnset, evolutions: [] as object[],
  abilities: { normal: p.abilities.filter((a: any) => !/hidden/.test(a.slot)).map((a: any) => kebab(a.id)), hidden: p.abilities.find((a: any) => /hidden/.test(a.slot)) ? kebab(p.abilities.find((a: any) => /hidden/.test(a.slot)).id) : null },
  assets: { sprite: `custom/${sid}`, icon: base.assets?.icon ?? `${base.generation}/${base.dex}`, cry: base.assets?.cry ?? `${base.dex}` },
  weight: p.profile.weightKg ?? base.weight ?? 100, femaleRatio: p.profile.genderRatio ? p.profile.genderRatio.femalePercent / 100 : null, eggGroups: eggs2(p.profile.eggGroups), color: base.color, ...extra,
});
// Condition routes: held item, known move, night, high friendship, a level. Plain level ups and stones are in the species data.
const routeOf = (p: any, fromId: string, toId: string) => {
  const e = p.evolution;
  const parts: any[] = [];
  const text = `${e.condition ?? ''}`;
  if (e.heldItem) parts.push({ kind: 'holds', item: itemId(e.heldItem) });
  if (e.knowsMove) parts.push({ kind: 'knowsMove', move: kebab(e.knowsMove) });
  const km = /knows (\w[\w ]*)$/.exec(text);
  if (km && !e.knowsMove && !/Sketch/.test(text)) parts.push({ kind: 'knowsMove', move: kebab(km[1]!) });
  if (e.timeOfDay === 'night') parts.push({ kind: 'night' });
  if (e.friendship === 'high') parts.push({ kind: 'friendship' });
  const hold = /while it holds an? (.+)$/.exec(text);
  if (hold && !e.heldItem) parts.push({ kind: 'holds', item: itemId(hold[1]!) });
  if (e.location === 'in a snowy area') parts.push({ kind: 'weather', weather: 'snow' });
  const lvl = /Lv\. (\d+)/.exec(text);
  const minLevel = e.minLevel ?? (lvl ? Number(lvl[1]) : /Sketch/.test(text) ? 40 : 1);
  const condition = parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : { kind: 'all', of: parts };
  return { from: fromId, to: toId, minLevel, ...(condition ? { condition } : {}) };
};

// Pass 1: ordinary species (new lines and new forms of existing lines). Pass 2: Megas and Gigantamax forms, which copy their base.
for (const pass of [1, 2]) {
  for (const p of newPack.filter((x) => (pass === 2) === isFormPack(x))) {
    const sid = gameIdOf(p);
    addAbilities(p);
    const e = p.evolution;
    if (pass === 1) {
      const fromId = e.from ? nameId(e.from) : null;
      const intoId = e.into ? nameId(e.into) : null;
      const baseId = BASED_3[sid] ?? (p.basedOn ? nameId(p.basedOn) : intoId && packById.has(intoId) ? nameId(packById.get(intoId).basedOn) : (fromId ?? intoId)!);
      const base = findSp(baseId) ?? findSp(fromId ?? '') ?? findSp(intoId ?? '') ?? (p.basedOn ? findSp(nameId(p.basedOn)) : undefined);
      if (!base) throw new Error(`${sid}: no base species ${baseId}`);
      let stage = 1;
      if (fromId) { const fs = findSp(fromId); if (!fs) throw new Error(`${sid}: no parent ${fromId}`); stage = fs.evolutionStage + 1; }
      const sp: any = mkNew(p, sid, base, stage, fromId, learnOf(p), { tags: !fromId ? ['scout'] : [] });
      out.push(sp);
      footprintBase[sid] = base.id;
      learnables[sid] = { egg: [], other: tmOf(p) };
      // The routes in the pack's own words.
      const plain = e.trigger === 'level_up' && e.minLevel && !e.heldItem && !e.knowsMove && !e.timeOfDay && !e.condition && !e.friendship && !e.location;
      if (fromId && plain) {
        const ev = { from: fromId, to: sid, level: e.minLevel };
        const parent = out.find((o) => o.id === fromId);
        if (parent) parent.evolutions.push({ to: sid, level: e.minLevel }); else external.push(ev);
      } else if (fromId && e.trigger === 'use_item' && e.item) {
        const parent = out.find((o) => o.id === fromId);
        const itm = itemId(e.item);
        if (e.knowsMove) conditionEvolutions.push({ from: fromId, to: sid, minLevel: 1, stones: [itm], stoneCondition: { kind: 'knowsMove', move: kebab(e.knowsMove) } });
        else if (parent) parent.evolutions.push({ to: sid, item: itm }); else external.push({ from: fromId, to: sid, item: itm });
      } else if (fromId) conditionEvolutions.push(routeOf(p, fromId, sid));
      // "X evolves into T at Lv. N" in the pack's notes: T is an existing species that now comes after X.
      const nm = /evolves into ([^.]+?) at Lv\. (\d+)/.exec(e.notes ?? '');
      if (nm && byId.has(nameId(nm[1]!))) { sp.evolutions.push({ to: nameId(nm[1]!), level: Number(nm[2]) }); addPatch(nameId(nm[1]!), sid, stage); }
      // A new first stage that evolves into an existing species ("into").
      if (intoId && !fromId && !packById.has(intoId)) {
        addPatch(intoId, sid, stage);
        if (e.trigger === 'level_up' && e.minLevel && !e.heldItem && !e.friendship && !e.condition) sp.evolutions.push({ to: intoId, level: e.minLevel });
        else conditionEvolutions.push(routeOf(p, sid, intoId));
      }
    } else {
      const isMega = e.trigger === 'mega_evolution';
      const baseId = baseGameId(p);
      const base = findSp(baseId);
      if (!base) throw new Error(`${sid}: no base ${baseId}`);
      const keep = (base.tags ?? []).filter((t: string) => t !== 'scout' && t !== 'baby');
      const sp: any = mkNew(p, sid, base, base.evolutionStage, null, JSON.parse(JSON.stringify(base.learnset)), { tags: keep, form: { kind: isMega ? 'mega' : 'gigantamax', base: baseId }, ...(isMega ? {} : { baseStats: { ...base.baseStats } }) });
      sp.generation = base.generation;
      out.push(sp);
      learnables[sid] = learnables[baseId] ?? (read('learnables.json') as any)[baseId] ?? { egg: [], other: [] };
      if (isMega) {
        const smId = packMoveOf(p) ? kebab(packMoveOf(p)!.id) : null;
        if (smId && known.has(smId)) megaMoves[sid] = smId;
        const stoneName = p.megaStone as string;
        megaStones.push({ id: nameId(stoneName), name: stoneName, base: baseId, form: sid, type: p.types[0].toLowerCase() });
      } else {
        const smId = kebab(packMoveOf(p)!.id);
        gmaxEntries[smId] = { forms: [sid], type: gmaxMoves.find((g) => g.id === smId)?.type ?? p.types[0].toLowerCase(), ...(G_EFFECTS[smId] ? { effects: G_EFFECTS[smId] } : {}) };
      }
    }
  }
}
// The Mega stones: one item and one reward-draft entry each (same shape as src/data/megaStones.json).
for (const s of megaStones) {
  const desc = `Lets ${findSp(s.base).name} Mega Evolve in battle (needs the Mega Ring).`;
  items.push({ id: s.id, name: s.name, description: desc, category: 'transformation', iconAssetId: `item.${s.id.replace(/-/g, '_')}`, usableInBattle: false, usableOutside: false, target: 'none', effect: { kind: 'megaStone', forms: { [s.base]: s.form }, primal: false } });
  rewards.push({ id: s.id, name: s.name, description: desc, category: 'transformation', rarity: 'rare', effect: { kind: 'addItem', item: s.id, quantity: 1 }, stacking: 'instant', scope: 'run', moneyMultiplierApplies: false, iconAssetId: `item.${s.id.replace(/-/g, '_')}` });
}
for (const g of gmaxMoves) newMoves.push(g);
writeFileSync(join(here, 'source', 'stones.json'), JSON.stringify(megaStones.map((s) => ({ id: s.id, type: s.type }))) + '\n');
// Move descriptions: the pack's signature move texts (a quoted CSV; the last column is the text). The Forme versions share their move's text.
const descriptions: Record<string, string> = {};
for (const line of readFileSync(join(here, 'source', 'signature_moves.csv'), 'utf8').trim().split('\n').slice(1)) {
  const m = /^[^,]*,[^,]*,([A-Z_]+),.*?,("(?:[^"]|"")*"|[^,]*)$/.exec(line);
  if (m) descriptions[kebab(m[1]!)] = m[2]!.replace(/^"|"$/g, '').replace(/""/g, '"');
}
descriptions['cataclysm-cannon-attack'] = descriptions['cataclysm-cannon-defence'] = descriptions['cataclysm-cannon']!;
descriptions['hypnospot-mega'] = descriptions['hypnospot']!;
for (const m of newMoves) if (!descriptions[m.id]) throw new Error(`no description for ${m.id}`);
writeFileSync(join(dataDir, 'jetSpecies.json'), JSON.stringify({ species: out, evolutions: external, moves: newMoves, abilities, learnables, items, rewards, descriptions, conditionEvolutions, patches, megaMoves, footprintBase, pendingAbilities: abilities.slice(abilitiesBefore).map((a) => a.id).filter((id) => !JET_ABILITIES.includes(id)) }) + '\n');
// Gigantamax moves of the three Dynamax forms join the G-Max table (presentation of Max moves is the engine's).
const maxPath = join(dataDir, 'maxMoves.json');
const maxData = JSON.parse(readFileSync(maxPath, 'utf8'));
for (const [k, v] of Object.entries(gmaxEntries)) maxData.gmax[k] = v;
writeFileSync(maxPath, JSON.stringify(maxData, null, 2) + '\n');
writeFileSync(join(here, 'source', 'batch5-report.json'), JSON.stringify({ moveLimits, droppedLearn }, null, 1) + '\n');
console.log(`wrote ${out.length} Jet species, ${newMoves.length} moves, ${abilities.length} abilities`);

// Presentation: each new move borrows the look of the strongest ordinary move of its type and category (src/data/moveAnims.json, presentation only).
const animsPath = join(dataDir, 'moveAnims.json');
const anims = JSON.parse(readFileSync(animsPath, 'utf8')) as { moves: Record<string, unknown> };
for (const m of newMoves.filter((x) => !x.id.startsWith('g-max-'))) {
  const donor = moveList
    .filter((o) => o.type === m.type && o.category === m.category && anims.moves[o.id] && !/^(z|max)-/.test(o.id))
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0) || a.id.localeCompare(b.id))[0];
  if (!donor) throw new Error(`no animation donor for ${m.id}`);
  const { pack: _pack, script: _script, ...look } = anims.moves[donor.id] as Record<string, unknown>;
  anims.moves[m.id] = { ...look, source: 'type', ...(m.id === 'dusk-volley' ? { script: 'duskvolley' } : {}) };
}
// The G-Max moves of the Dynamax forms look like their type's Max move.
for (const g of newMoves.filter((x) => x.id.startsWith('g-max-'))) {
  const donorId = (maxData.byType as Record<string, string>)[g.type];
  const donor = donorId ? anims.moves[donorId] : undefined;
  if (!donor) throw new Error(`no animation donor for ${g.id}`);
  const { pack: _p, script: _s, ...look } = donor as Record<string, unknown>;
  anims.moves[g.id] = { ...look, source: 'type' };
}
writeFileSync(animsPath, JSON.stringify(anims, null, 2) + '\n');
