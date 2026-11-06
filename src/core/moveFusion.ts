// Battle/AI batch 3. S155 Move Fusion: at a Move Tutor stop, a Pokémon that knows damaging moves of two fusing types can
// merge them into one stronger hybrid move (both are used up, the hybrid takes the first one's slot). S175 Tera Shard
// Crafting: the Workshop forges a Tera Shard of a type from that type's crafting material. Pure, no random numbers.

import type { Content, Move, TypeName } from './contentSchema';
import type { PokemonInstance } from './state';

/** Unordered type pairs and the existing move they fuse into. */
export const FUSIONS: { types: [TypeName, TypeName]; result: string }[] = [
  { types: ['fighting', 'flying'], result: 'flying-press' },
  { types: ['water', 'fire'], result: 'steam-eruption' },
  { types: ['ice', 'water'], result: 'freeze-dry' },
  { types: ['fire', 'electric'], result: 'fusion-flare' },
  { types: ['electric', 'ice'], result: 'freeze-shock' },
  { types: ['fire', 'ice'], result: 'ice-burn' },
  { types: ['ground', 'fire'], result: 'scorching-sands' },
  { types: ['ghost', 'dark'], result: 'bitter-malice' },
  { types: ['grass', 'fairy'], result: 'matcha-gotcha' },
  { types: ['psychic', 'fighting'], result: 'psyshield-bash' },
  { types: ['rock', 'steel'], result: 'stone-axe' },
  { types: ['psychic', 'flying'], result: 'esper-wing' },
  { types: ['fairy', 'flying'], result: 'springtide-storm' },
];

export interface FusionOption {
  /** The two known moves that are used up. */
  a: string;
  b: string;
  result: string;
}

const damaging = (m: Move | undefined): m is Move => Boolean(m && m.category !== 'status' && (m.power ?? 0) > 0);

/** Every fusion this Pokémon can make now: one per fusing pair, using its first move of each type. Not when it already knows the result. */
export function fusionOptions(content: Content, mon: PokemonInstance): FusionOption[] {
  const known = mon.moves.map((s) => content.moves.get(s.id)).filter(damaging);
  const out: FusionOption[] = [];
  for (const f of FUSIONS) {
    if (!content.moves.has(f.result) || mon.moves.some((s) => s.id === f.result)) continue;
    const a = known.find((m) => m.type === f.types[0]);
    const b = known.find((m) => m.type === f.types[1] && m.id !== a?.id);
    if (a && b) out.push({ a: a.id, b: b.id, result: f.result });
  }
  return out;
}

/** Applies a fusion (mutates `mon`): the hybrid takes the first move's slot, the second move is forgotten. */
export function applyFusion(content: Content, mon: PokemonInstance, f: FusionOption): void {
  const at = mon.moves.findIndex((s) => s.id === f.a);
  if (at < 0 || !mon.moves.some((s) => s.id === f.b)) throw new Error('That fusion is no longer possible');
  mon.moves[at] = { id: f.result, pp: content.moves.get(f.result)!.pp };
  mon.moves = mon.moves.filter((s) => s.id !== f.b);
}

/** S175: the Workshop's Tera Forge prices (crafting material of the type and money). */
export const TERA_FORGE = { material: 5, money: 500, minBadges: 1 };
