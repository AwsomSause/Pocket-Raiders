// Save generator (dev tool, tools/savegen.ts): turns a short spec into an importable export file ("Import save from a file").
// Everything is checked against the game's own schemas and data. Fields left blank are filled from the spec's seed, so the
// same spec always gives the same save. To support a new field: add it to SaveSpecSchema, apply it in buildProfile/buildRun/buildMon.
// Anything not covered has an escape hatch: `profile.patch`, `run.patch` and `party[].patch` set any field by dot path.
import { z } from 'zod';
import type { Content } from '../core/contentSchema';
import { genderOf } from '../core/gender';
import { createProfile } from '../core/profile';
import { createPokemon, getSpecies, maxHp, xpForLevel } from '../core/pokemon';
import { NATURE_IDS } from '../core/natures';
import { chooseStarter, createRun, fastForwardToStage } from '../core/run';
import { RunStateSchema, ProfileSchema, LegacySchema, type PokemonInstance, type Profile, type RunState } from '../core/state';
import { MemoryStorageProvider } from './storage';
import { SAVE_FORMAT, SaveManager, CURRENT_VERSIONS } from './saveManager';

const Stat = z.object({ hp: z.number().int().min(0), atk: z.number().int().min(0), def: z.number().int().min(0), spa: z.number().int().min(0), spd: z.number().int().min(0), spe: z.number().int().min(0) }).partial();
const Patch = z.record(z.string(), z.unknown()).default({});

export const MonSpecSchema = z.object({
  species: z.string().describe('Species or form id, e.g. "meowstic-female", "aggron-delta" (the form IS the species id)'),
  level: z.number().int().min(1).max(500).optional(),
  gender: z.enum(['male', 'female']).optional().describe('Picks a uid that gives this gender (error if the species cannot be that gender)'),
  shiny: z.boolean().optional(),
  nature: z.enum(NATURE_IDS).optional(),
  ability: z.string().optional().describe('Ability id, or "hidden"; must belong to the species'),
  moves: z.array(z.string()).min(1).max(8).optional(),
  held: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.number().int().min(1))]).optional().describe('Item id(s). "mega-stone" gives the species\' own Mega Stone (and a Mega Ring)'),
  ivs: z.union([Stat, z.number().int().min(0).max(31)]).optional(),
  evs: z.union([Stat, z.literal('max')]).optional(),
  friendship: z.number().int().min(0).max(255).optional(),
  nickname: z.string().max(12).optional(),
  teraType: z.string().optional(),
  hpPercent: z.number().min(1).max(100).optional(),
  status: z.string().nullable().optional(),
  patch: Patch,
}).strict();

export const SaveSpecSchema = z.object({
  preset: z.string().optional().describe('Name of a file in tools/savegen/presets/ to start from (this spec overrides it)'),
  seed: z.string().optional(),
  trainer: z.string().optional().describe('Player trainer: "nate" (default) or "hilda"'),
  mode: z.string().optional(),
  difficulty: z.string().optional(),
  modifiers: z.array(z.string()).optional(),
  deathBlock: z.boolean().optional(),
  campaign: z.literal('full').optional(),
  region: z.number().int().min(1).optional().describe('1-based region number'),
  stage: z.number().int().min(1).optional().describe('1-based stage number inside the region'),
  money: z.number().int().min(0).optional(),
  items: z.record(z.string(), z.number().int().min(0)).optional(),
  badges: z.union([z.literal('auto'), z.array(z.string())]).optional(),
  gimmickUses: z.record(z.string(), z.number().int().min(0)).optional().describe('e.g. {"mega:aggronite": 3, "dynamax": 1, "tera": 2}'),
  storyFlags: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])).optional().describe('Story and rival flags (run.story.flags)'),
  levelCapCheck: z.boolean().optional().describe('Error when a level is above the region cap (default true)'),
  random: z.boolean().optional().describe('Fill blank Pokémon fields from the seed (default true); false = plain defaults'),
  party: z.array(MonSpecSchema).max(6).optional(),
  run: z.object({ patch: Patch }).optional(),
  profile: z.object({
    id: z.string().optional(),
    bankCredits: z.number().int().min(0).optional(),
    researchPoints: z.number().int().min(0).optional(),
    candies: z.number().int().min(0).optional(),
    bankTier: z.number().int().min(1).max(5).optional(),
    prestige: z.number().int().min(0).max(5).optional().describe('Prestige rank 0-5 (profile.legacy)'),
    researchTree: z.array(z.string()).optional().describe('Research Tree node ids bought (profile.legacy.tree)'),
    contacts: z.array(z.string()).optional().describe('Trainer Network contacts (profile.legacy.contacts)'),
    licenses: z.array(z.string()).optional(),
    candyPerks: z.array(z.string()).optional(),
    titles: z.array(z.string()).optional(),
    unlockAllTrainers: z.boolean().optional(),
    unlockedArchetypes: z.array(z.string()).optional(),
    dexAll: z.boolean().optional().describe('Every species seen and caught'),
    remembrances: z.record(z.string(), z.enum(['locked', 'seen', 'unlocked'])).optional(),
    protagonistName: z.string().max(16).optional(),
    patch: Patch,
  }).strict().optional(),
}).strict();
export type SaveSpec = z.infer<typeof SaveSpecSchema>;
export type MonSpec = z.infer<typeof MonSpecSchema>;

/** A small seeded generator for filling blanks (not the game's RNG: this only runs in the tool). */
function seeded(text: string): () => number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Sets a value by dot path ("story.flags.x", "party.0.hp"), creating plain objects on the way. */
export function setPath(target: unknown, path: string, value: unknown): void {
  const keys = path.split('.');
  let node = target as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) {
    if (node[k] === null || typeof node[k] !== 'object') node[k] = {};
    node = node[k] as Record<string, unknown>;
  }
  node[keys[keys.length - 1]!] = value;
}

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;

function buildMon(content: Content, m: MonSpec, i: number, seed: string, random: boolean, problems: string[]): PokemonInstance | null {
  const where = `party[${i}] (${m.species})`;
  if (!content.species.has(m.species)) {
    problems.push(`${where}: unknown species/form`);
    return null;
  }
  const species = getSpecies(content, m.species);
  const rng = seeded(`${seed}:mon:${i}:${m.species}`);
  const level = m.level ?? 50;
  let uid = `gen-${i}`;
  if (m.gender) {
    let found = false;
    for (let k = 0; k < 500 && !found; k++) {
      uid = `gen-${i}-${k}`;
      found = genderOf(content, { uid, speciesId: m.species }) === m.gender;
    }
    if (!found) problems.push(`${where}: this species cannot be ${m.gender} (it is ${species.femaleRatio === null ? 'genderless' : species.femaleRatio === 1 ? 'always female' : 'always male'})`);
  }
  const mon: PokemonInstance = createPokemon(content, m.species, level, uid, `${seed}:${uid}`);
  mon.xp = xpForLevel(species.growthRate, level, content.balance.difficulty.highLevelXp);
  mon.shiny = m.shiny ?? false;
  mon.nature = m.nature ?? (random ? NATURE_IDS[Math.floor(rng() * NATURE_IDS.length)]! : 'hardy');
  // Ability: a name, "hidden", or (blank) the roll createPokemon made / a random slot.
  const ab = species.abilities;
  if (m.ability) {
    if (m.ability === 'hidden' || (ab.hidden && m.ability === ab.hidden)) {
      if (ab.hidden) mon.abilitySlot = -1;
      else problems.push(`${where}: has no hidden ability`);
    } else {
      const idx = ab.normal.indexOf(m.ability);
      if (idx < 0) problems.push(`${where}: ability "${m.ability}" is not one of ${[...ab.normal, ab.hidden ? `${ab.hidden} (hidden)` : null].filter(Boolean).join(', ')}`);
      else mon.abilitySlot = idx;
    }
  } else if (random) {
    const slots = [...ab.normal.map((_, k) => k), ...(ab.hidden ? [-1] : [])];
    mon.abilitySlot = slots[Math.floor(rng() * slots.length)] ?? 0;
  }
  // Moves: the given list, or four picked from what it learns by its level (attacks first), or its normal level-up four.
  if (m.moves) {
    for (const id of m.moves) if (!content.moves.has(id)) problems.push(`${where}: unknown move "${id}"`);
    mon.moves = m.moves.filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  } else if (random) {
    const pool = [...new Set(species.learnset.filter((e) => e.level <= Math.min(level, 100) && content.moves.has(e.move)).map((e) => e.move))];
    const attacks = pool.filter((id) => (content.moves.get(id)?.power ?? 0) > 0);
    const others = pool.filter((id) => !attacks.includes(id));
    const pick = (a: string[], n: number) => { const c = [...a]; const out: string[] = []; while (c.length && out.length < n) out.push(c.splice(Math.floor(rng() * c.length), 1)[0]!); return out; };
    const chosen = [...pick(attacks, 3), ...pick(others, 1)];
    for (const id of pick([...attacks.filter((a) => !chosen.includes(a)), ...others.filter((a) => !chosen.includes(a))], 4 - chosen.length)) chosen.push(id);
    if (chosen.length > 0) mon.moves = chosen.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  }
  // Held items.
  const held: Record<string, number> = {};
  const items = m.held === undefined ? [] : typeof m.held === 'string' ? [m.held] : Array.isArray(m.held) ? m.held : Object.entries(m.held).map(([k, n]) => [k, n] as const);
  for (const it of items) {
    const [id, n] = typeof it === 'string' ? [it, 1] : it;
    let real = id;
    if (id === 'mega-stone') {
      const stone = [...content.items.values()].find((x) => x.effect.kind === 'megaStone' && Object.keys((x.effect as { forms: Record<string, string> }).forms).includes(m.species));
      if (!stone) { problems.push(`${where}: no Mega Stone exists for this species`); continue; }
      real = stone.id;
    }
    if (!content.items.has(real)) { problems.push(`${where}: unknown item "${real}"`); continue; }
    held[real] = (held[real] ?? 0) + n;
  }
  if (Object.keys(held).length > 0) mon.held = held;
  // Stats.
  const roll = (): number => (random ? Math.floor(rng() * 32) : 31);
  const ivs: Record<string, number> = typeof m.ivs === 'number' ? Object.fromEntries(STATS.map((s) => [s, m.ivs as number])) : Object.fromEntries(STATS.map((s) => [s, (m.ivs as Record<string, number> | undefined)?.[s] ?? roll()]));
  mon.ivs = ivs;
  mon.evs = m.evs === 'max' ? { hp: 252, atk: 252, spe: 6 } : (m.evs ?? {});
  const evTotal = Object.values(mon.evs).reduce((a, b) => a + (b ?? 0), 0);
  if (evTotal > 510) problems.push(`${where}: EVs add up to ${evTotal} (the limit is 510)`);
  for (const [s, v] of Object.entries(mon.evs)) if ((v ?? 0) > 252) problems.push(`${where}: ${s} EV ${v} is above 252`);
  if (m.friendship !== undefined) mon.friendship = m.friendship;
  if (m.teraType) mon.teraType = m.teraType as PokemonInstance['teraType'];
  if (m.nickname) mon.care = { ...(mon.care ?? ({} as NonNullable<PokemonInstance['care']>)), nickname: m.nickname } as PokemonInstance['care'];
  if (m.status !== undefined) mon.status = m.status as PokemonInstance['status'];
  for (const [k, v] of Object.entries(m.patch)) setPath(mon, k, v);
  mon.hp = Math.max(1, Math.floor((maxHp(content, mon) * (m.hpPercent ?? 100)) / 100));
  return mon;
}

function buildProfile(content: Content, spec: SaveSpec, problems: string[]): Profile {
  const p = spec.profile ?? { patch: {} };
  const profile = createProfile(content, p.id ?? 'generated');
  if (p.bankCredits !== undefined) { profile.bankCredits = p.bankCredits; profile.lifetimeBankCredits = Math.max(profile.lifetimeBankCredits, p.bankCredits); }
  if (p.researchPoints !== undefined) profile.researchPoints = p.researchPoints;
  if (p.candies !== undefined) profile.candies = p.candies;
  if (p.bankTier !== undefined) profile.bankTier = p.bankTier;
  if (p.prestige !== undefined || p.researchTree || p.contacts) {
    profile.legacy = { ...LegacySchema.parse(profile.legacy ?? {}), ...(p.prestige !== undefined ? { prestige: p.prestige } : {}), ...(p.researchTree ? { tree: p.researchTree } : {}), ...(p.contacts ? { contacts: p.contacts } : {}) };
  }
  if (p.licenses) profile.licenses = p.licenses;
  if (p.candyPerks) profile.candyPerks = p.candyPerks;
  if (p.titles) profile.titles = p.titles;
  if (p.unlockAllTrainers) profile.unlockedArchetypes = [...content.archetypes.keys()];
  if (p.unlockedArchetypes) profile.unlockedArchetypes = [...new Set([...profile.unlockedArchetypes, ...p.unlockedArchetypes])];
  for (const id of profile.unlockedArchetypes) if (!content.archetypes.has(id)) problems.push(`profile: unknown trainer "${id}"`);
  if (spec.trainer && !profile.unlockedArchetypes.includes(spec.trainer)) profile.unlockedArchetypes.push(spec.trainer);
  if (p.dexAll) { const all = [...content.species.keys()]; profile.speciesSeen = all; profile.speciesCaught = all; }
  if (p.remembrances) for (const [id, state] of Object.entries(p.remembrances)) profile.story.remembrance[id] = { ...(profile.story.remembrance[id] ?? { firstSeenRun: null, runs: 0 }), state } as never;
  if (p.protagonistName) { profile.story.protagonist.name = p.protagonistName; profile.story.protagonist.nameSet = true; }
  for (const [k, v] of Object.entries(p.patch)) setPath(profile, k, v);
  return profile;
}

function buildRun(content: Content, spec: SaveSpec, problems: string[]): RunState | null {
  const trainer = spec.trainer ?? 'nate';
  if (!content.archetypes.has(trainer)) { problems.push(`unknown trainer "${trainer}"`); return null; }
  const seed = spec.seed ?? 'generated-run';
  const rules = { modeId: spec.mode ?? 'standard', difficultyId: spec.difficulty ?? 'standard', modifierIds: spec.modifiers ?? [], deathBlock: spec.deathBlock ?? false };
  let run = createRun(content, { archetypeId: trainer, seed, runId: `gen-${seed}`, rules } as Parameters<typeof createRun>[1]);
  run = chooseStarter(content, run, 0);
  const regionIdx = (spec.region ?? 1) - 1;
  const stageIdx = (spec.stage ?? 1) - 1;
  const stages = content.campaigns.get(run.campaignId)!.stagesPerRegion;
  if (regionIdx >= run.regionOrder.length) problems.push(`region ${spec.region} does not exist (this run has ${run.regionOrder.length} regions)`);
  else if (stageIdx >= stages) problems.push(`stage ${spec.stage} does not exist (a region has ${stages} stages)`);
  else {
    const earned = fastForwardToStage(content, run, regionIdx, stageIdx);
    run.badges = spec.badges === 'auto' || spec.badges === undefined ? [...new Set(earned)] : spec.badges;
  }
  return run;
}

export interface GeneratedSave { file: string; report: string[] }

/** Builds the export file text for a spec, or throws an Error listing every problem found. */
export function generateSave(content: Content, input: unknown): GeneratedSave {
  const parsed = SaveSpecSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((e) => `${e.path.join('.') || 'spec'}: ${e.message}`).join('\n'));
  const spec = parsed.data;
  const problems: string[] = [];
  const profile = buildProfile(content, spec, problems);
  const run = buildRun(content, spec, problems);
  const report: string[] = [];
  if (run) {
    const seed = spec.seed ?? 'generated-run';
    const party = (spec.party ?? []).map((m, i) => buildMon(content, m, i, seed, spec.random ?? true, problems));
    if ((spec.party ?? []).length > 0) run.party = party.filter((m): m is PokemonInstance => m !== null);
    if (run.party.length > content.balance.partyMax) problems.push(`party has ${run.party.length} Pokémon (max ${content.balance.partyMax})`);
    if (spec.money !== undefined) run.money = spec.money;
    for (const [id, n] of Object.entries(spec.items ?? {})) { if (!content.items.has(id)) problems.push(`unknown item "${id}"`); else run.inventory[id] = n; }
    const needRing = run.party.some((m) => Object.keys(m.held ?? {}).some((id) => content.items.get(id)?.effect.kind === 'megaStone'));
    if (needRing && !run.inventory['mega-ring']) run.inventory['mega-ring'] = 1;
    for (const [k, v] of Object.entries(spec.gimmickUses ?? {})) run.gimmicks.uses[k] = v;
    Object.assign(run.story.flags, spec.storyFlags ?? {});
    if (run.party[0]) run.log.starterUid = run.party[0].uid;
    run.pending = [];
    for (const [k, v] of Object.entries(spec.run?.patch ?? {})) setPath(run, k, v);
    if (spec.levelCapCheck !== false) {
      const cap = Math.min(500, 100 + 50 * (spec.region ?? 1));
      for (const m of run.party) if (m.level > cap) problems.push(`${m.speciesId} level ${m.level} is above the region ${spec.region ?? 1} cap (${cap}); set "levelCapCheck": false to allow it`);
    }
    report.push(`region ${run.regionIndex + 1} (${run.regionOrder[run.regionIndex]}), stage ${(run.stage?.index ?? 0) + 1}, ${run.badges.length} badges, $${run.money}`);
    for (const m of run.party) report.push(`${m.speciesId} L${m.level} ${m.nature} ability#${m.abilitySlot} ${genderOf(content, m) ?? 'genderless'}${m.shiny ? ' shiny' : ''} [${m.moves.map((x) => x.id).join(', ')}]${m.held ? ' holding ' + Object.keys(m.held).join(', ') : ''}`);
  }
  if (problems.length > 0) throw new Error(problems.join('\n'));

  const exportedAt = '2026-01-01T00:00:00.000Z';
  const envelope = (record: 'profile' | 'run', data: unknown) => ({ format: SAVE_FORMAT, record, schemaVersion: CURRENT_VERSIONS[record], savedAt: exportedAt, data });
  const file = { format: SAVE_FORMAT, kind: 'export', exportedAt, profile: envelope('profile', profile), settings: null, run: envelope('run', run) };
  const text = JSON.stringify(file, null, 1);
  // The proof: the game's own importer accepts it and the run loads back.
  const saves = new SaveManager(new MemoryStorageProvider(), content);
  const imported = saves.importSave(text);
  if (!imported.ok) throw new Error(`The generated file does not import: ${imported.reason}`);
  if (saves.loadRun().status !== 'ok') throw new Error('The generated run does not load.');
  ProfileSchema.parse(imported.profile);
  RunStateSchema.parse(imported.run);
  report.push('import check passed');
  return { file: text, report };
}
