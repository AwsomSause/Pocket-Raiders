// Builds src/data/jetSpecies.json from the director's Jet Pokédex data (tools/jet/source/pokedex.json, 2026-11-07):
//   node tools/jet/build-jet-species.ts
// Six Pokémon: Vine Riff, Electric Oncore (Toxel), Pyro Spirit, Neon Moon (Eevee), Bastiodoom (Bastiodon), Cataggron (Aggron;
// Attack and Defence Formes are battle forms). Base stats, types, moves, TMs and abilities are the pack's. The pack's evolution
// rules (held item, nature, time, friendship) live in src/core/conditionEvolution.ts. Sprites: tools/jet/make-jet-sprites.py.
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
const kebab = (s: string) => s.toLowerCase().replace(/_/g, '-');
const FIRST = { cataggron: 'aggron' } as Record<string, string>;

const ICON: Record<string, string> = { 'vine-riff': '8/849', 'electric-oncore': '8/849', 'pyro-spirit': '2/196', 'neon-moon': '2/197', bastiodoom: '4/411', cataggron: '3/306' };
const CRY: Record<string, string> = { 'vine-riff': '849', 'electric-oncore': '849', 'pyro-spirit': '196', 'neon-moon': '197', bastiodoom: '411', cataggron: '306' };
const EGG: Record<string, string> = { 'Human-Like': 'humanshape', Field: 'ground', Monster: 'monster' };
const COLOR: Record<string, string> = { 'vine-riff': 'green', 'electric-oncore': 'purple', 'pyro-spirit': 'red', 'neon-moon': 'black', bastiodoom: 'gray', cataggron: 'gray' };
const stat = (b: any) => ({ hp: b.hp, atk: b.attack, def: b.defense, spa: b.spAtk, spd: b.spDef, spe: b.speed });

// New moves (the six signature moves; Cataclysm Cannon has one version per Forme, picked in battle by its user's form).
const mv = (id: string, name: string, type: string, category: string, power: number, accuracy: number, pp: number, flags: string[], effects: object) =>
  ({ id, name, type, category, power, accuracy, pp, priority: 0, critStage: 0, target: 'enemy', flags, effects });
const newMoves = [
  mv('thornstrum', 'Thornstrum', 'grass', 'special', 80, 100, 10, ['sound'], { powerRule: 'poisonedBoost' }),
  mv('feedback-shred', 'Feedback Shred', 'electric', 'special', 90, 100, 10, ['sound'], { status: { id: 'par', chance: 20 } }),
  mv('grave-rampart', 'Grave Rampart', 'poison', 'special', 80, 100, 10, [], { attackFrom: 'spd', status: { id: 'psn', chance: 30 } }),
  mv('mindflare', 'Mindflare', 'fire', 'special', 85, 100, 10, [], { targetsDefense: true, status: { id: 'brn', chance: 10 } }),
  mv('neon-eclipse', 'Neon Eclipse', 'dark', 'physical', 75, 100, 10, ['contact'], { drain: 0.5 }),
  mv('cataclysm-cannon', 'Cataclysm Cannon', 'steel', 'physical', 100, 90, 5, [], {}),
  mv('cataclysm-cannon-attack', 'Cataclysm Cannon', 'steel', 'physical', 130, 90, 5, ['jetform'], { recoil: 0.25 }),
  mv('cataclysm-cannon-defence', 'Cataclysm Cannon', 'steel', 'physical', 80, 90, 5, ['jetform'], { statChanges: [{ stat: 'def', stages: 1, target: 'self', chance: 100 }] }),
];
const known = new Set([...moves, ...newMoves.map((m) => m.id)]);

const abilities: { id: string; name: string; description: string }[] = [];
const out: any[] = [];
const learnables: Record<string, { egg: string[]; other: string[] }> = {};
const tmCsv = readFileSync(join(here, 'source', 'tm_moves.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
let dex = 1100;

for (const p of pack) {
  const id = kebab(p.id);
  const stage = p.evolution.chain.length;
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
  const base = byId.get(FIRST[id] ?? kebab(p.evolution.from));
  const mk = (sid: string, name: string, stats: any, extra: object) => ({
    id: sid, dex: dex++, name, generation: base.generation, types: p.types.map((t: string) => t.toLowerCase()), baseStats: stat(stats), catchRate: p.profile.catchRate, baseExp: p.profile.baseExp,
    growthRate: p.profile.growthRate.toLowerCase().replace(/ /g, '-'), evolutionStage: stage, evolvesFrom: kebab(p.evolution.from), tags: [], learnset, evolutions: [],
    abilities: { normal, hidden: slot('hidden') ? kebab(slot('hidden').id) : null }, assets: { sprite: `custom/${sid}`, icon: ICON[id], cry: CRY[id] },
    weight: p.profile.weightKg, femaleRatio: p.profile.genderRatio.femalePercent / 100, eggGroups: p.profile.eggGroups.map((g: string) => EGG[g] ?? g.toLowerCase()), color: COLOR[id], ...extra,
  });
  if (p.forms?.length) {
    for (const f of p.forms) out.push(mk(f.isDefault ? id : `${id}-${f.id}`, f.isDefault ? p.name : `${f.name.replace(' Forme', '')} ${p.name}`, f.baseStats, f.isDefault ? {} : { form: { kind: 'battle', base: id } }));
  } else out.push(mk(id, p.name, p.baseStats, {}));
  const tm = [...new Set(tmCsv.filter((r) => r[0] === p.id).map((r) => kebab(r[2]!)).filter((m) => moves.has(m)))];
  for (const f of out.filter((o) => o.id === id || o.id.startsWith(`${id}-`))) learnables[f.id] = { egg: [], other: tm };
}
writeFileSync(join(dataDir, 'jetSpecies.json'), JSON.stringify({ species: out, evolutions: [], moves: newMoves, abilities, learnables }) + '\n');
console.log(`wrote ${out.length} Jet species, ${newMoves.length} moves, ${abilities.length} abilities`);
