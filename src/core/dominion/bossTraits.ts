// DOMINION Boss stats and traits (redesign R1 follow-up, pass-50 mockup `boss`). Each player trainer starts the run
// with its own Edge spread (always 10 points, so no Boss is stronger overall) and two traits from start.json. The traits
// are read where they act: Debate start (conviction), the run start (Heat, rival Tension) and Edge XP (learn). A run
// started before this has no `boss` on its block, so it has no traits and keeps its Edge.

import { DOMINION_DATA } from './data';
import type { DominionBlock, StatId } from './schema';

type BossData = typeof DOMINION_DATA.start.boss;
export type BossTrait = BossData['traits'][number];
export interface BossStart { edge: Record<StatId, number>; traits: BossTrait[] }

const B = (): BossData => DOMINION_DATA.start.boss;

/** The Boss's starting Edge and traits for a trainer (archetype id); trainers without their own row use the default. */
export function bossStart(archetypeId: string): BossStart {
  const row = B().byArchetype[archetypeId] ?? B().default;
  return { edge: { ...row.edge }, traits: row.traits.map((id) => B().traits.find((t) => t.id === id)!).filter(Boolean) };
}

/** The traits on a run's block (none for runs started before Boss traits). */
export function bossTraits(b: DominionBlock): BossTrait[] {
  return (b.boss?.traits ?? []).map((id) => B().traits.find((t) => t.id === id)).filter((t): t is BossTrait => !!t);
}

const sum = (b: DominionBlock, kind: BossTrait['kind'], stat?: StatId): number =>
  bossTraits(b).filter((t) => t.kind === kind && (!stat || t.stat === stat)).reduce((n, t) => n + t.n, 0);

/** Debate: extra Conviction when the Boss (not an Admin) sits down. */
export const traitConviction = (b: DominionBlock): number => sum(b, 'conviction');

/** At the start of the run: the Boss's trainer, Edge spread and traits; Heat and every rival team's Tension moved by
 *  the traits. Mutates `b` (the fresh block, before the first save). */
export function applyBossStart(b: DominionBlock, archetypeId: string): void {
  const s = bossStart(archetypeId);
  b.boss = { id: archetypeId, traits: s.traits.map((t) => t.id) };
  b.field.edge.stats = { ...s.edge };
  b.heat = Math.max(0, Math.min(100, b.heat + sum(b, 'heat')));
  const ten = sum(b, 'tension');
  if (ten && b.rivals) for (const t of Object.values(b.rivals.teams)) {
    t.tension = Math.max(0, Math.min(100, t.tension + ten));
    t.peak = Math.max(t.peak, t.tension);
  }
}

/** Edge XP for the Boss with a learn trait's extra point when that stat grows (XP above 0). */
export const withLearn = (b: DominionBlock, stat: StatId, xp: number): number => (xp > 0 ? xp + sum(b, 'learn', stat) : xp);

/** The Boss title earned by a finished Dominion run ("Boss of Kanto"), from the last region it took. */
export const bossTitle = (region: string): string => B().title.replace('{region}', region);
