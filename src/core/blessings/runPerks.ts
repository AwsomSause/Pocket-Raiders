// Run-level perks of the run's Legendary Blessing (Bond, experience, money, encounters...): the ones that act outside a battle.
// Kept apart from index.ts (which imports events) so archetypes.ts can read them without an import cycle. The data is
// validated by index.ts (BlessingDefSchema); here it is only read.

import raw from '../../data/blessings.json';
import type { ArchetypeModifier } from '../contentSchema';

type Def = { id: string; status: string; runPerks?: ArchetypeModifier[]; communionRunPerks?: ArchetypeModifier[] };
const DEFS = new Map((raw.blessings as unknown as Def[]).map((b) => [b.id, b]));

/** The blessing's run-level perks now (its Communion list once in Communion). Kyurem's copy does not carry them. */
export function blessingRunPerks(run: { expansion?: { blessing?: { id: string; communion?: boolean; copy?: string } | null } }): ArchetypeModifier[] {
  const state = run.expansion?.blessing;
  const def = state ? DEFS.get(state.id) : undefined;
  if (!def || def.status === 'disabled') return [];
  return (state!.communion && def.communionRunPerks ? def.communionRunPerks : def.runPerks) ?? [];
}
