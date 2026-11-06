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

export interface GrowthConfig { enabled: boolean; bonus: number; minKos: number; minCloseCalls: number }
export const DEFAULT_GROWTH_CONFIG: GrowthConfig = { enabled: true, bonus: 0.05, minKos: 8, minCloseCalls: 2 };

interface History { uid: string; knockoutsDealt: number; closeCalls: number }

/** Pack path id for a type's first path ("type:Fire" -> the first entry gated on it), or null. */
export function typePathId(type: string): string | null {
  const gate = `type:${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()}`;
  return overhaulCatalogs().growth_paths.entries.find((p) => p.gate === gate)?.id ?? null;
}

/** The path this Pokémon qualifies for now, or null. `party` are the histories of the whole party (for "most KOs"). */
export function pathFor(cfg: GrowthConfig, mon: History, types: readonly string[], party: readonly History[]): string | null {
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
export function growthDamageMultiplier(cfg: GrowthConfig, mon: Pick<PokemonInstance, 'growthPath'>, moveType: string, effectiveness: number, hpFrac: number, monTypes: readonly string[]): number {
  const id = mon.growthPath;
  if (!cfg.enabled || !id) return 1;
  if (id === 'last-stand') return hpFrac < 0.25 ? 1 + cfg.bonus : 1;
  if (id === 'striker') return effectiveness > 1 ? 1 + cfg.bonus : 1;
  const gate = overhaulCatalogs().growth_paths.entries.find((p) => p.id === id)?.gate;
  if (gate?.startsWith('type:')) {
    const t = gate.slice(5).toLowerCase();
    return moveType.toLowerCase() === t && monTypes.some((x) => x.toLowerCase() === t) ? 1 + cfg.bonus : 1;
  }
  return 1;
}

/** Plain words for the Pokémon info page, or null. */
export function growthLine(mon: Pick<PokemonInstance, 'growthPath'>, cfg: GrowthConfig): string | null {
  if (!mon.growthPath) return null;
  const p = overhaulCatalogs().growth_paths.entries.find((e) => e.id === mon.growthPath);
  if (!p) return null;
  const pct = Math.round(cfg.bonus * 100);
  const effect = p.id === 'last-stand' ? `+${pct}% damage under a quarter HP` : p.id === 'striker' ? `+${pct}% on super-effective hits` : `+${pct}% damage with its own type`;
  return `Growth path, ${p.name}: ${effect}. ${p.flavor}`;
}
