// Overhaul slice 22: the pack's lines for its major trainers (gym leaders, Elite Four, champions, rivals, bosses).
// The line file is big (about 12,000 lines), so it loads once on request (ensureTrainerLines, called by the battle
// scene before a boss fight). The drama planner is synchronous: it asks packPool(), which is null until the lines
// have loaded, and then it falls back to its own lines. Presentation only: it never changes a battle.

import { loadOverhaulLines, overhaulCatalogs } from './catalogs';
import { pickIndex, type DialogueCategory } from '../drama/schema';
import type { Candidate, PlanCtx } from '../drama/events';
import type { BattleEvent } from '../battle/engine';

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
/** Archetype lines (ordinary trainer classes), by class id then situation. */
let archCache: Map<string, Map<string, string[]>> | null = null;
let loading: Promise<void> | null = null;

/** Loads the trainer lines once. Safe to call many times. */
export function ensureTrainerLines(): Promise<void> {
  loading ??= Promise.all([loadOverhaulLines('major_trainer_lines'), loadOverhaulLines('archetype_lines')]).then(([f, arch]) => {
    const am = new Map<string, Map<string, string[]>>();
    for (const e of arch.entries) {
      if (e.text.trim() === '...' || e.text.length < 8) continue;
      const bySit = am.get(e.archetype) ?? new Map<string, string[]>();
      const list = bySit.get(e.situation) ?? [];
      if (list.length < MAX_PER_SITUATION) list.push(e.text);
      bySit.set(e.situation, list);
      am.set(e.archetype, bySit);
    }
    archCache = am;
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
  archCache = null;
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
  const bySit = t ? cache.get(t) : undefined;
  // A boss's role lines ("Good to see you again, friend.") are extra ways to open the fight.
  const lines = sit === 'intro' && bySit ? [...(bySit.get('intro') ?? []), ...(bySit.get('role') ?? [])].slice(0, MAX_PER_SITUATION * 2) : bySit?.get(sit);
  return lines && lines.length ? lines : null;
}

/** Archetype lines for an ordinary trainer class (16 classes have them), or null. */
export function archetypePool(classId: string | null | undefined, category: DialogueCategory): string[] | null {
  const sit = CATEGORY_SITUATION[category];
  if (!archCache || !sit || !classId) return null;
  const lines = archCache.get(classId)?.get(sit);
  return lines && lines.length ? lines : null;
}

function situationLines(c: PlanCtx, sit: Situation | 'weather' | 'overdrive'): string[] | null {
  const id = packTrainerFor(c.battle.trainer?.leaderId);
  const lines = (id ? cache?.get(id)?.get(sit) : undefined) ?? archCache?.get(c.battle.trainer?.classId ?? '')?.get(sit);
  return lines && lines.length ? lines : null;
}

/**
 * Pack lines for moments the drama planner has no category for: the weather changing, your Pokémon doing something
 * extraordinary (Hyper/Overdrive), and the trainer's ace and last Pokémon coming out. One short line each, once per battle.
 * Presentation only; picked by hashing, never by the battle's random numbers.
 */
export function packMomentCandidates(c: PlanCtx): Candidate[] {
  if (!cache) return [];
  const out: Candidate[] = [];
  const add = (ev: PlanCtx['drama'][number], tag: string, sit: Situation | 'weather' | 'overdrive', tier: Candidate['tier']) => {
    const lines = situationLines(c, sit);
    if (!lines) return;
    const id = `${c.key}:pack:${tag}`;
    out.push({ ev: { ...ev, id }, category: 'event', tier, pool: [lines[pickIndex(id, lines.length)]!], cue: { event: `pack:${sit}` } });
  };
  const at = (i: number) => ({ id: '', kind: 'enemyMove' as const, turn: c.turn, at: i, data: {} });
  c.events.forEach((e: BattleEvent, i) => {
    if (e.type === 'weather') add(at(i), 'weather', 'weather', 'ambient');
    else if (e.type === 'hyper' && e.side === 'player') add(at(i), 'overdrive', 'overdrive', 'tactical');
  });
  const team = c.battle.enemyTeam;
  if (team.length > 1) {
    for (const ev of c.drama) {
      if (ev.kind !== 'enemySwitch') continue;
      const mon = team.find((m) => m.uid === ev.data.uid);
      if (!mon) continue;
      const alive = team.filter((m) => m.hp > 0).length;
      const topLevel = Math.max(...team.map((m) => m.level));
      if (alive === 1) add(ev, 'last', 'last', 'tactical');
      else if (mon.level === topLevel && team.findIndex((m) => m.level === topLevel) === team.indexOf(mon)) add(ev, 'ace', 'ace', 'tactical');
    }
  }
  return out;
}
