// Overhaul slice 19: run memories, titles, run title and a fair MVP (src/data/overhaul/ milestones, titles, run_titles).
// Pure and save-free: everything is read from what the run already recorded (story histories and the party), and
// every pick that needs a "random" choice uses a hash of the run seed, so no gameplay stream is touched.
//
// Milestones the game can detect today are listed in DETECTORS (about twenty of the 135); the others stay quiet
// until a system records what they need. Titles whose requirement is not covered never show.

import { overhaulCatalogs } from './catalogs';
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import type { PokemonHistory } from '../story/schema';

interface Ctx {
  run: RunState;
  mon: PokemonInstance;
  h: PokemonHistory;
  finals: Set<string>;
  medianLevel: number;
  isMvp: boolean;
}

const mastered = (h: PokemonHistory) => Object.values(h.moves).filter((n) => n >= 80).length;

/** Milestone id -> does this Pokémon deserve it? Only what the run records today. */
export const DETECTORS: Record<string, (c: Ctx) => boolean> = {
  'M-FIRST': (c) => c.h.joinedBy === 'starter',
  'M-GIFT': (c) => c.h.joinedBy === 'gift',
  'M-BOSS5': (c) => c.h.bossesBeaten >= 5,
  'M-UNBROKEN': (c) => c.h.bossesBeaten >= 3 && c.h.knockoutsTaken === 0,
  'M-EVOLVED': (c) => c.h.evolutions.length >= 1,
  'M-EVOTWICE': (c) => c.h.evolutions.length >= 2,
  'M-EVOFINAL': (c) => c.h.evolutions.length >= 1 && c.finals.has(c.mon.speciesId),
  'M-SHINY': (c) => c.mon.shiny,
  'M-HATCHED': (c) => c.mon.hatched === true,
  'M-HATCHSHINY': (c) => c.mon.hatched === true && c.mon.shiny,
  'M-HYPER': (c) => Object.values(c.h.hyper).some((n) => n > 0),
  'M-ENDURE': (c) => c.h.survivedFatal >= 1,
  'M-TRUST': (c) => c.mon.friendship >= 255,
  'M-BATTLE100': (c) => c.h.battles >= 100,
  'M-KO100': (c) => c.h.knockoutsDealt >= 100,
  'M-MASTER': (c) => mastered(c.h) >= 1,
  'M-MASTER3': (c) => mastered(c.h) >= 3,
  'M-OVERLEVEL': (c) => c.mon.level >= c.medianLevel + 5,
  'M-MVP': (c) => c.isMvp,
  'M-HALLFAME': (c) => c.run.victory === true,
};

const fnv = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** How much a Pokémon carried the run. Damage is only one part: bosses, close calls, survival, growth and bonds count too. */
export function mvpScore(h: PokemonHistory, mon: Pick<PokemonInstance, 'friendship'>): number {
  return h.bossesBeaten * 4 + h.closeCalls * 2 + h.survivedFatal * 3 + h.evolutions.length * 2 + h.knockoutsDealt + h.battles * 0.25 + Math.floor(mon.friendship / 50);
}

/** The run's MVP among the current party, or null. Ties go to the lower uid. */
export function runMvp(run: RunState): PokemonInstance | null {
  let best: { mon: PokemonInstance; score: number } | null = null;
  for (const mon of run.party) {
    const h = run.story.histories[mon.uid];
    if (!h) continue;
    const score = mvpScore(h, mon);
    if (!best || score > best.score || (score === best.score && mon.uid < best.mon.uid)) best = { mon, score };
  }
  return best ? best.mon : null;
}

/** Milestone ids each party Pokémon has earned (uid -> ids). */
export function earnedMilestones(content: Content, run: RunState): Record<string, string[]> {
  const parents = new Set([...content.species.values()].map((s) => s.evolvesFrom).filter(Boolean) as string[]);
  const finals = new Set([...content.species.keys()].filter((id) => !parents.has(id)));
  const levels = run.party.map((m) => m.level).sort((a, b) => a - b);
  const medianLevel = levels.length ? levels[Math.floor(levels.length / 2)]! : 0;
  const mvp = runMvp(run)?.uid;
  const out: Record<string, string[]> = {};
  for (const mon of run.party) {
    const h = run.story.histories[mon.uid];
    if (!h) continue;
    const ctx: Ctx = { run, mon, h, finals, medianLevel, isMvp: mon.uid === mvp };
    out[mon.uid] = Object.entries(DETECTORS).filter(([, f]) => f(ctx)).map(([id]) => id);
  }
  return out;
}

/** The best title for a set of milestones: highest tier whose "M-A" or "M-A+M-B" requirement is met. */
export function titleFor(earned: readonly string[]): string | null {
  const have = new Set(earned);
  let best: { title: string; tier: number } | null = null;
  for (const t of overhaulCatalogs().titles.entries) {
    if (!/^M-[A-Z0-9]+(\+M-[A-Z0-9]+)*$/.test(t.requires)) continue;
    if (!t.requires.split('+').every((r) => have.has(r))) continue;
    if (!best || t.tier > best.tier) best = { title: t.title, tier: t.tier };
  }
  return best?.title ?? null;
}

const WEIGHT = { landmark: 3, major: 2, minor: 1 } as const;

/** The run's title for the victory screen, e.g. "The Run Pikachu Carried", or null. */
export function runTitle(content: Content, run: RunState, mvpName: string | null): string | null {
  const cat = overhaulCatalogs().run_titles;
  const pools = cat.pools;
  const ok = cat.entries.filter((t) => t.phase === 'end' && t.requires.every((r) => r === 'mvp' ? !!mvpName : !!pools[r]));
  if (!ok.length) return null;
  const t = ok[fnv(`${run.seed}:runtitle`) % ok.length]!;
  const text = t.template.replace(/\{(\w+)\}/g, (_, k: string) => (k === 'mvp' ? mvpName! : pools[k]![fnv(`${run.seed}:rt:${k}`) % pools[k]!.length]!));
  return text.includes('{') ? null : text;
}

/** Memory lines for the end of a won run: run title, the MVP with its title, and up to two milestone memories. */
export function memoryLines(content: Content, run: RunState): string[] {
  const mvp = runMvp(run);
  if (!mvp) return [];
  const name = (m: PokemonInstance) => content.species.get(m.speciesId)?.name ?? m.speciesId;
  const earned = earnedMilestones(content, run);
  const out: string[] = [];
  const rt = runTitle(content, run, name(mvp));
  if (rt) out.push(`The story of this run: "${rt}".`);
  const title = titleFor(earned[mvp.uid] ?? []);
  const h = run.story.histories[mvp.uid]!;
  out.push(`Run MVP: ${name(mvp)}${title ? ` ${title}` : ''}, with ${h.bossesBeaten} boss battle${h.bossesBeaten === 1 ? '' : 's'} won and ${h.closeCalls} close call${h.closeCalls === 1 ? '' : 's'} survived.`);
  const ms = new Map(overhaulCatalogs().milestones.entries.map((m) => [m.id, m]));
  const picks: { line: string; w: number; key: number }[] = [];
  for (const mon of run.party) {
    for (const id of earned[mon.uid] ?? []) {
      const m = ms.get(id);
      if (!m || id === 'M-MVP' || id === 'M-HALLFAME') continue;
      const key = fnv(`${run.seed}:mem:${mon.uid}:${id}`);
      picks.push({ line: m.phrasings[key % m.phrasings.length]!.replaceAll('{name}', name(mon)), w: WEIGHT[m.weight], key });
    }
  }
  picks.sort((a, b) => b.w - a.w || a.key - b.key);
  out.push(...picks.slice(0, 2).map((p) => p.line));
  return out;
}
