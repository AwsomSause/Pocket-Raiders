// Overhaul slice 25 (growth paths, first cut): a Pokémon that has proved itself over the run settles into a
// growth path, a small permanent damage edge. The pack lists 106 paths with free-text rules; this first cut plays
// the ones the game can measure from what it already counts per Pokémon (knockouts, close calls) and the types:
//   last-stand  >= 2 close calls            +5% damage while under a quarter HP
//   striker     most KOs in the party (>=8)  +5% damage on super-effective hits
//   <type> path a Pokémon of that type with >= 8 KOs: +5% damage with moves of its own type (first pack path of the type)
// A Pokémon holds one path (`growthPath` on the instance, optional so no save bump). The other pack paths stay
// unplayed. No RNG, no cross-run memory. Switch and numbers: balance.overhaulGrowth.

import { overhaulCatalogs } from './catalogs';
import type { PokemonInstance } from '../state';
import type { Content } from '../contentSchema';

export interface GrowthConfig { enabled: boolean; bonus: number; minKos: number; minCloseCalls: number; minRoleKos: number }
export const DEFAULT_GROWTH_CONFIG: GrowthConfig = { enabled: true, bonus: 0.05, minKos: 8, minCloseCalls: 2, minRoleKos: 4 };

interface History { uid: string; knockoutsDealt: number; closeCalls: number; growth?: Record<string, number> | undefined }

/** Counter-based paths: pack id, the counter it reads, and the plain-words bonus. All give +bonus damage in the stated case. */
export const COUNTER_PATHS: Record<string, { counter: string; words: string; min?: number }> = {
  'rival-breaker': { counter: 'koRival', words: 'damage against rival Pokémon' },
  'gym-slayer': { counter: 'koGym', words: 'damage against Gym Leader Pokémon' },
  'elite-slayer': { counter: 'koElite', words: 'damage against Elite Four Pokémon' },
  'champion-slayer': { counter: 'koChampion', words: 'damage against Champion Pokémon' },
  loner: { counter: 'koSolo', words: 'damage when it is the last one standing' },
  'deep-swimmer': { counter: 'koWaterVsFRG', words: 'Water damage against Fire, Rock and Ground foes' },
  'forge-born': { counter: 'koSteelVsIRF', words: 'Steel damage against Ice, Rock and Fairy foes' },
  // Batch 3: counted from the moves it uses and the hits it lands.
  steady: { counter: 'useSure', words: 'damage with 100%-accuracy moves', min: 30 },
  gambler: { counter: 'useRisky', words: 'accuracy with moves of 80% accuracy or less', min: 8 },
  'chorus-lead': { counter: 'useSound', words: 'damage with sound moves', min: 10 },
  support: { counter: 'useStatus', words: 'accuracy with status moves', min: 15 },
  'tank-buster': { counter: 'hitHigh', words: 'damage against foes above 75% HP', min: 12 },
  'bond-breaker': { counter: 'koFull', words: 'damage against foes at full HP' },
  'ember-heart': { counter: 'useFireLow', words: 'Fire damage while under 50% HP', min: 6 },

};

/** What one move use tells the growth counters. `hpFrac` is the user's HP share before it moved. */
export interface MoveFacts { accuracy: number | null; category: string; type: string; flags: readonly string[]; hpFrac: number }
export function moveCounters(f: MoveFacts): string[] {
  const out: string[] = [];
  if (f.category === 'status') out.push('useStatus');
  if (f.accuracy === 100 && f.category !== 'status') out.push('useSure');
  if (f.accuracy !== null && f.accuracy < 80) out.push('useRisky');
  if (f.flags.includes('sound')) out.push('useSound');
  if (f.type.toLowerCase() === 'fire' && f.category !== 'status' && f.hpFrac < 0.5) out.push('useFireLow');
  return out;
}
/** What one damaging hit tells the counters: `before` and `max` are the foe's HP around the hit; `ko` when it fainted. */
export function hitCounters(before: number, max: number, ko: boolean): string[] {
  const out: string[] = [];
  if (before > max * 0.75) out.push('hitHigh');
  if (ko && before >= max) out.push('koFull');
  return out;
}
export function bumpGrowth(cfg: GrowthConfig, history: { growth?: Record<string, number> | undefined } | undefined, counters: readonly string[]): void {
  if (!cfg.enabled || !history) return;
  for (const c of counters) { history.growth ??= {}; history.growth[c] = (history.growth[c] ?? 0) + 1; }
}

/** What a KO tells the growth counters. `by` are the winner's types, `foe` the fallen foe's types. */
export interface KoFacts { by: readonly string[]; foe: readonly string[]; rival: boolean; trainerClass: string | null; solo: boolean }

/** The counters one KO adds to (names from COUNTER_PATHS). */
export function koCounters(f: KoFacts): string[] {
  const low = (a: readonly string[]) => a.map((x) => x.toLowerCase());
  const by = low(f.by);
  const foe = low(f.foe);
  const out: string[] = [];
  if (f.rival) out.push('koRival');
  if (f.trainerClass === 'gym-leader') out.push('koGym');
  if (f.trainerClass === 'elite-four') out.push('koElite');
  if (f.trainerClass === 'champion') out.push('koChampion');
  if (f.solo) out.push('koSolo');
  if (by.includes('water') && foe.some((t) => ['fire', 'rock', 'ground'].includes(t))) out.push('koWaterVsFRG');
  if (by.includes('steel') && foe.some((t) => ['ice', 'rock', 'fairy'].includes(t))) out.push('koSteelVsIRF');
  return out;
}

/** Add a KO to the winner's history counters (does nothing when the switch is off). */
export function noteGrowthKo(cfg: GrowthConfig, history: { growth?: Record<string, number> | undefined } | undefined, facts: KoFacts): void {
  if (!cfg.enabled || !history) return;
  for (const c of koCounters(facts)) { history.growth ??= {}; history.growth[c] = (history.growth[c] ?? 0) + 1; }
}

/** Pack path id for a type's first path ("type:Fire" -> the first entry gated on it), or null. */
export function typePathId(type: string): string | null {
  const gate = `type:${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()}`;
  return overhaulCatalogs().growth_paths.entries.find((p) => p.gate === gate)?.id ?? null;
}

/** The path this Pokémon qualifies for now, or null. `party` are the histories of the whole party (for "most KOs"). */
export function pathFor(cfg: GrowthConfig, mon: History, types: readonly string[], party: readonly History[]): string | null {
  // A counter path needs enough of its kind of KO, and the most of it in the party (a tie goes to nobody).
  let best: { id: string; n: number } | null = null;
  for (const [id, def] of Object.entries(COUNTER_PATHS)) {
    const n = mon.growth?.[def.counter] ?? 0;
    if (n < (def.min ?? cfg.minRoleKos)) continue;
    const top = Math.max(...party.map((h) => h.growth?.[def.counter] ?? 0));
    if (n === top && party.filter((h) => (h.growth?.[def.counter] ?? 0) === top).length === 1 && (!best || n > best.n)) best = { id, n };
  }
  if (best) return best.id;
  if (mon.closeCalls >= cfg.minCloseCalls) return 'last-stand';
  const top = Math.max(0, ...party.map((h) => h.knockoutsDealt));
  if (mon.knockoutsDealt >= cfg.minKos && mon.knockoutsDealt === top && party.filter((h) => h.knockoutsDealt === top).length === 1) return 'striker';
  if (mon.knockoutsDealt >= cfg.minKos) for (const t of types) { const id = typePathId(t); if (id) return id; }
  return null;
}

/** Give paths to party members that earned one. Returns a line per new path. Safe to call often: a Pokémon keeps its first path. */
export function assignGrowthPaths(content: Content, party: PokemonInstance[], histories: Record<string, History | undefined>): string[] {
  const cfg = content.balance.overhaulGrowth;
  if (!cfg.enabled) return [];
  const hs = party.map((m) => histories[m.uid]).filter((h): h is History => h !== undefined);
  const names = new Map(overhaulCatalogs().growth_paths.entries.map((p) => [p.id, p.name]));
  const out: string[] = [];
  for (const mon of party) {
    if (mon.growthPath) continue;
    const h = histories[mon.uid];
    if (!h) continue;
    const id = pathFor(cfg, h, content.species.get(mon.speciesId)?.types ?? [], hs);
    if (!id || !names.has(id)) continue;
    mon.growthPath = id;
    out.push(`${content.species.get(mon.speciesId)?.name ?? mon.speciesId} found its way: ${names.get(id)}.`);
  }
  return out;
}

/** Damage multiplier from the attacker's path for one hit. `hpFrac` is the attacker's HP share (0..1). */
export interface HitFacts { foeTypes?: readonly string[]; rival?: boolean; trainerClass?: string | null; solo?: boolean; accuracy?: number | null; sound?: boolean; foeHpFrac?: number }
export function growthDamageMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, moveType: string, effectiveness: number, hpFrac: number, monTypes: readonly string[], hit: HitFacts = {}): number {
  const id = mon.growthPath;
  if (!cfg.enabled || !id) return 1;
  if (id === 'last-stand') return hpFrac < 0.25 ? 1 + cfg.bonus : 1;
  if (id === 'striker') return effectiveness > 1 ? 1 + cfg.bonus : 1;
  if (id in COUNTER_PATHS) {
    const foe = (hit.foeTypes ?? []).map((t) => t.toLowerCase());
    const ok = id === 'rival-breaker' ? hit.rival === true
      : id === 'gym-slayer' ? hit.trainerClass === 'gym-leader'
      : id === 'elite-slayer' ? hit.trainerClass === 'elite-four'
      : id === 'champion-slayer' ? hit.trainerClass === 'champion'
      : id === 'loner' ? hit.solo === true
      : id === 'steady' ? hit.accuracy === 100
      : id === 'chorus-lead' ? hit.sound === true
      : id === 'tank-buster' ? (hit.foeHpFrac ?? 0) > 0.75
      : id === 'bond-breaker' ? (hit.foeHpFrac ?? 0) >= 1
      : id === 'ember-heart' ? moveType.toLowerCase() === 'fire' && hpFrac < 0.5
      : id === 'gambler' || id === 'support' ? false
      : id === 'deep-swimmer' ? moveType.toLowerCase() === 'water' && foe.some((t) => ['fire', 'rock', 'ground'].includes(t))
      : moveType.toLowerCase() === 'steel' && foe.some((t) => ['ice', 'rock', 'fairy'].includes(t));
    const amount = id === 'steady' || id === 'chorus-lead' ? Math.min(cfg.bonus, 0.03) : cfg.bonus;
    return ok ? 1 + amount : 1;
  }
  const gate = overhaulCatalogs().growth_paths.entries.find((p) => p.id === id)?.gate;
  if (gate?.startsWith('type:')) {
    const t = gate.slice(5).toLowerCase();
    return moveType.toLowerCase() === t && monTypes.some((x) => x.toLowerCase() === t) ? 1 + cfg.bonus : 1;
  }
  return 1;
}

/** Accuracy multiplier for the two accuracy paths (Gambler: moves under 80%; Support: status moves). */
export function growthAccuracyMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, accuracy: number | null, category: string): number {
  if (!cfg.enabled || accuracy === null) return 1;
  if (mon.growthPath === 'gambler' && accuracy < 80) return 1 + cfg.bonus;
  if (mon.growthPath === 'support' && category === 'status') return 1 + cfg.bonus;
  return 1;
}

/** Plain words for the Pokémon info page, or null. */
export function growthLine(mon: Pick<PokemonInstance, 'growthPath'>, cfg: GrowthConfig): string | null {
  if (!mon.growthPath) return null;
  const p = overhaulCatalogs().growth_paths.entries.find((e) => e.id === mon.growthPath);
  if (!p) return null;
  const pct = Math.round(cfg.bonus * 100);
  const counter = COUNTER_PATHS[p.id];
  const effect = counter ? `+${p.id === 'steady' || p.id === 'chorus-lead' ? Math.min(pct, 3) : pct}% ${counter.words}` : p.id === 'last-stand' ? `+${pct}% damage under a quarter HP` : p.id === 'striker' ? `+${pct}% on super-effective hits` : `+${pct}% damage with its own type`;
  return `Growth path, ${p.name}: ${effect}. ${p.flavor}`;
}
