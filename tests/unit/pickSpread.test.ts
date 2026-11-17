import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { generateRegionOrder } from '../../src/core/regions';
import { firstRegionWeights } from '../../src/core/gameEvents';
import { Rng, hashSeed } from '../../src/core/rng';
import { registerFromRival } from '../../src/core/rivals/overhaul';
import { beastToCall, freshUltra } from '../../src/core/ultra/run';
import { INVADERS } from '../../src/core/ultra/beasts';

const tally = (xs: string[]): Record<string, number> => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});

describe('pick spread (sim-100k skew fix)', () => {
  it('the main rival personality is near-even across all personalities, whatever the archetype', () => {
    const N = 4000;
    const picks: string[] = [];
    for (let i = 0; i < N; i++) {
      const run = { seed: `spread-${i}`, expansion: {} } as never;
      // "social-climber" matches no pack personality: it used to always land on one constant fallback.
      picks.push(registerFromRival(run, { id: 'rival-major', archetype: i % 2 ? 'caretaker' : 'social-climber', style: 'x', arc: null } as never, 'main').personality);
    }
    const t = tally(picks);
    const keys = Object.keys(t);
    expect(keys.length).toBe(8);
    for (const k of keys) { expect(t[k]! / N, k).toBeGreaterThan(0.09); expect(t[k]! / N, k).toBeLessThan(0.16); }
  });
  it('the rival battle style is even across all styles', () => {
    const picks: string[] = [];
    for (let i = 0; i < 4000; i++) picks.push(registerFromRival({ seed: `style-${i}`, expansion: {} } as never, { id: 'rival-major', archetype: 'x', style: i % 2 ? 'blitz' : 'unknown', arc: null } as never, 'main').style);
    const t = tally(picks);
    expect(Object.keys(t).length).toBeGreaterThanOrEqual(8);
    for (const k of Object.keys(t)) expect(t[k]! / 4000, k).toBeLessThan(0.2);
  });
  it('the main rival arc is even across the seven non-friend arcs', () => {
    const picks: string[] = [];
    for (let i = 0; i < 4000; i++) picks.push(registerFromRival({ seed: `arc-${i}`, expansion: {} } as never, { id: 'rival-major', archetype: 'x', style: 'x', arc: { id: 'underdog-finds-their-method' } } as never, 'main').arc);
    const t = tally(picks);
    expect(Object.keys(t).length).toBe(7);
    for (const k of Object.keys(t)) expect(t[k]! / 4000, k).toBeLessThan(0.2);
  });
  it('the main personality is stable for a seed', () => {
    const mk = () => registerFromRival({ seed: 'same', expansion: {} } as never, { id: 'rival-major', archetype: 'x', style: 'x', arc: null } as never, 'main').personality;
    expect(mk()).toBe(mk());
  });
  it('the Ultra Beast is spread across every ready Appetite when a seed is given', () => {
    const picks: string[] = [];
    for (let i = 0; i < 3000; i++) {
      const u = freshUltra();
      for (const b of INVADERS) if (b.appetite) u.appetites[b.appetite] = b.threshold * (b.id === 'ub-symbiont' ? 3 : 1);
      picks.push(beastToCall(u, `seed-${i}`)!.id);
    }
    const t = tally(picks);
    expect(Object.keys(t).length).toBeGreaterThanOrEqual(INVADERS.filter((b) => b.appetite).length);
    expect(Math.max(...Object.values(t)) / 3000).toBeLessThan(0.2);
  });
});

describe('Homeland Week (dated first-region boost)', () => {
  const ev = content.gameEvents.get('homeland-week')!;
  it('is on for exactly 7 days from its start and off after', async () => {
    const { activeGameEvents } = await import('../../src/core/gameEvents');
    const on = (d: string) => activeGameEvents(content, new Date(`${d}T12:00:00Z`)).some((a) => a.event.id === 'homeland-week');
    expect(ev.schedule.kind).toBe('dated');
    expect(on('2026-11-17')).toBe(false);
    expect(on('2026-11-18')).toBe(true);
    expect(on('2026-11-24')).toBe(true);
    expect(on('2026-11-25')).toBe(false);
  });
  it('Kanto, Hoenn and Galar open about 3x as often with it on, and roll nothing extra with it off', () => {
    const campaign = content.campaigns.get('full')!;
    const first = (weights: Record<string, number>, i: number) => generateRegionOrder(content, campaign, new Rng(hashSeed(`r-${i}`)), null, { seed: `r-${i}`, weights })[0]!;
    const N = 3000;
    const share = (w: Record<string, number>) => { let n = 0; for (let i = 0; i < N; i++) if (['kanto', 'hoenn', 'galar'].includes(first(w, i))) n++; return n / N; };
    const off = share({});
    const on = share(firstRegionWeights(content, ['homeland-week@2026-11-18']));
    expect(on).toBeGreaterThan(off + 0.2);
    for (let i = 0; i < 20; i++) expect(generateRegionOrder(content, campaign, new Rng(hashSeed(`r-${i}`)), null, { seed: 'x', weights: {} })).toEqual(generateRegionOrder(content, campaign, new Rng(hashSeed(`r-${i}`)), null));
  });
});

describe('story moment caps', () => {
  it('a moment stops once it has happened its per-run cap; riled-up has a tight cap', async () => {
    const { momentCapped, momentCountKey } = await import('../../src/core/story/momentCaps');
    const run = { story: { flags: {} as Record<string, unknown> } } as never as { story: { flags: Record<string, number> } };
    const r = content.story.rarity;
    expect(r.perRunCaps.enemyRiledUp).toBeLessThanOrEqual(2);
    const def = content.story.definitions.find((d) => d.triggerConditions.trigger === 'enemyRiledUp')!;
    expect(momentCapped(content, run as never, 'enemyRiledUp')).toBe(false);
    run.story.flags[momentCountKey(def.id)] = r.perRunCaps.enemyRiledUp!;
    expect(momentCapped(content, run as never, 'enemyRiledUp')).toBe(true);
    const other = content.story.definitions.find((d) => d.triggerConditions.trigger === 'angerDangerous')!;
    run.story.flags[momentCountKey(other.id)] = r.perRunCap - 1;
    expect(momentCapped(content, run as never, 'angerDangerous')).toBe(false);
    run.story.flags[momentCountKey(other.id)] = r.perRunCap;
    expect(momentCapped(content, run as never, 'angerDangerous')).toBe(true);
  });
});
