// Overhaul slice 22: the pack's lines for its major trainers (gym leaders, Elite Four, champions, rivals, bosses).
// The line file is big (about 12,000 lines), so it loads once on request (ensureTrainerLines, called by the battle
// scene before a boss fight). The drama planner is synchronous: it asks packPool(), which is null until the lines
// have loaded, and then it falls back to its own lines. Presentation only: it never changes a battle.

import { loadOverhaulLines, overhaulCatalogs } from './catalogs';
import type { DialogueCategory } from '../drama/schema';

type Situation = 'intro' | 'sendout' | 'survive' | 'repeat' | 'ace' | 'fail' | 'low' | 'last' | 'win' | 'lose' | 'taunt';

/** Which pack situation fits each of the drama planner's dialogue categories. */
export const CATEGORY_SITUATION: Partial<Record<DialogueCategory, Situation>> = {
  opening: 'intro',
  callbackWon: 'repeat',
  callbackLost: 'repeat',
  switch: 'sendout',
  survived: 'survive',
  desperation: 'low',
  foeKo: 'taunt',
  taunt: 'taunt',
  defeat: 'lose',
  victory: 'win',
};

const MAX_PER_SITUATION = 24;
let cache: Map<string, Map<string, string[]>> | null = null;
let loading: Promise<void> | null = null;

/** Loads the trainer lines once. Safe to call many times. */
export function ensureTrainerLines(): Promise<void> {
  loading ??= loadOverhaulLines('major_trainer_lines').then((f) => {
    const map = new Map<string, Map<string, string[]>>();
    for (const e of f.entries) {
      if (e.text.trim() === '...' || e.text.length < 8) continue;
      const bySit = map.get(e.trainer) ?? new Map<string, string[]>();
      const list = bySit.get(e.situation) ?? [];
      if (list.length < MAX_PER_SITUATION) list.push(e.text);
      bySit.set(e.situation, list);
      map.set(e.trainer, bySit);
    }
    cache = map;
  });
  return loading;
}

/** Test hook: forget the loaded lines. */
export function resetTrainerLines(): void {
  cache = null;
  loading = null;
}

/** The pack trainer id for a game boss id (a gym leader id, an Elite Four member, a champion), or null. */
export function packTrainerFor(bossId: string | null | undefined): string | null {
  if (!bossId) return null;
  return overhaulCatalogs().major_trainers.entries.find((t) => t.bossId === bossId)?.id ?? null;
}

/** Lines for this boss in this dialogue category, or null (not loaded, no such boss, nothing for the situation). */
export function packPool(bossId: string | null | undefined, category: DialogueCategory): string[] | null {
  const sit = CATEGORY_SITUATION[category];
  if (!cache || !sit) return null;
  const t = packTrainerFor(bossId);
  const lines = t ? cache.get(t)?.get(sit) : undefined;
  return lines && lines.length ? lines : null;
}
