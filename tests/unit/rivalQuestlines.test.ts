// Rival questline events (Beta 0.6): the rivalState condition, the rivalChange effect, and the questline data.
import { describe, expect, it } from 'vitest';
import { applyEffect, conditionMet } from '../../src/core/events';
import { featuredRival } from '../../src/core/rivals/living';
import { overhaulOf, registerRival } from '../../src/core/rivals/overhaul';
import { chooseStarter, createRun } from '../../src/core/run';
import { Rng, hashSeed } from '../../src/core/rng';
import { content } from './helpers';

const setup = (withRival = true) => {
  const run = chooseStarter(content, createRun(content, { runId: 'rq', seed: 'rq', archetypeId: 'red' }), 0);
  if (!run.story.rivals.length) run.story.rivals.push({ id: 'blue', name: 'Blue', state: 'rival', encounters: 1, rivalPotential: 5 } as never);
  const id = featuredRival(run)!.id;
  if (withRival) registerRival(run, { id, role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' });
  return { run, id };
};
const rng = () => new Rng(hashSeed('rq-fx'));
/** Flags the engine writes for the questlines (core/rivals/questlines.ts): the Circuit board, a remembered loss, a pick or a roll. */
const ENGINE_SET = ['rq-lost-at', 'rq-lost-kind', 'rival-mentor-ask', 'rq-r6-true'];
// Shared keys other files read: Reputation (STANDARDS.md), and the promise flags (MEMORY_AND_FORMAT.md: Jirachi's "every promise kept", NE36 to NE40).
const SHARED_READ = ['rep', 'rep-lost', 'rival-promise-made', 'rival-promise-kept', 'rival-promise-broken'];

describe('rival questlines', () => {
  it('rivalChange moves feelings, lead and marks, all clamped', () => {
    const { run, id } = setup();
    const before = overhaulOf(run, id)!.feelings.trust;
    applyEffect(content, run, { kind: 'rivalChange', feelings: { trust: 2 }, lead: 1, mark: 'saved-by-you' }, rng());
    const rec = overhaulOf(run, id)!;
    expect(rec.feelings.trust).toBe(Math.min(10, before + 2));
    expect(rec.lead).toBe(1);
    expect(rec.marks).toContain('saved-by-you');
    applyEffect(content, run, { kind: 'rivalChange', feelings: { trust: 50 as never }, lead: 3 }, rng());
    expect(overhaulOf(run, id)!.feelings.trust).toBe(10);
    expect(overhaulOf(run, id)!.lead).toBe(3);
  });
  it('rivalChange does nothing without a registered rival', () => {
    const { run } = setup(false);
    expect(() => applyEffect(content, run, { kind: 'rivalChange', feelings: { trust: 2 }, lead: 1 }, rng())).not.toThrow();
  });
  it('rivalState reads feeling, lead and mark; false without a rival', () => {
    const { run, id } = setup();
    const trust = overhaulOf(run, id)!.feelings.trust;
    expect(conditionMet(content, run, { kind: 'rivalState', feeling: { key: 'trust', atLeast: trust } })).toBe(true);
    expect(conditionMet(content, run, { kind: 'rivalState', feeling: { key: 'trust', atLeast: Math.min(10, trust + 1) } })).toBe(trust < 10 ? false : true);
    expect(conditionMet(content, run, { kind: 'rivalState', leadAtLeast: 2 })).toBe(false);
    applyEffect(content, run, { kind: 'rivalChange', feelings: {}, lead: 2, mark: 'beat-you' }, rng());
    expect(conditionMet(content, run, { kind: 'rivalState', leadAtLeast: 2 })).toBe(true);
    expect(conditionMet(content, run, { kind: 'rivalState', mark: 'beat-you' })).toBe(true);
    const none = setup(false).run;
    expect(conditionMet(content, none, { kind: 'rivalState', leadAtLeast: -3 })).toBe(false);
  });
  it('ships the questline events, each rival-gated and with valid choices', () => {
    const ids = ['rq-empty-slot', 'rq-help-wanted', 'rq-letter', 'rq-swap-day', 'rq-asks-you-to-lose', 'rq-rival-in-trouble', 'rq-stone-on-the-hill'];
    for (const id of ids) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.requires.some((c) => c.kind === 'rivalMet'), id).toBe(true);
    }
  });
  it('callbacks only open from their flag', () => {
    for (const id of ['rq-favour-returned', 'rq-bitter-rival', 'rq-in-trouble-again', 'rq-the-young-one', 'rq-old-man-stands']) {
      const e = content.events.get(id)!;
      expect(e.callback, id).toBe(true);
      expect(e.requires.some((c) => c.kind === 'flag'), id).toBe(true);
    }
  });
});

describe('rival questlines batch 2', () => {
  it('loads every rq event, valid, with unique ids', () => {
    const rq = [...content.events.values()].filter((e) => e.id.startsWith('rq-'));
    expect(rq.length).toBeGreaterThanOrEqual(40);
    for (const e of rq) {
      expect(e.group, e.id).toBe('Rival questline');
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('every flag a callback needs is set by some rq event', () => {
    // The rival questline scenes (old rq-* ids and the pack rebuild's group); retired ids are never drawn, so they do not count.
    const rq = [...content.events.values()].filter((e) => !e.disabled && (e.id.startsWith('rq-') || e.group === 'Rival questline'));
    const setters = new Set<string>();
    const walk = (o: unknown): void => {
      if (Array.isArray(o)) o.forEach(walk);
      else if (o && typeof o === 'object') {
        const r = o as Record<string, unknown>;
        if (r.kind === 'flag' && typeof r.key === 'string' && r.amount !== undefined) setters.add(r.key);
        // A questline `set` writes a flag too (rq-r4-name, rq-r6-scout).
        if (r.kind === 'rivalQuest' && r.set && typeof (r.set as { key?: unknown }).key === 'string') setters.add((r.set as { key: string }).key);
        Object.values(r).forEach(walk);
      }
    };
    rq.forEach((e) => walk({ c: e.choices, r: e.remembers }));
    for (const e of rq.filter((x) => x.callback))
      for (const c of e.requires) if (c.kind === 'flag' && c.atLeast >= 1 && !ENGINE_SET.includes(c.key)) expect(setters.has(c.key), `${e.id} needs ${c.key}`).toBe(true);
  });
});

describe('rival questline flags', () => {
  it('every flag an rq event sets is read by some rq event or echo', () => {
    const rq = [...content.events.values()].filter((e) => !e.disabled && (e.id.startsWith('rq-') || e.group === 'Rival questline'));
    const set = new Set<string>();
    const read = new Set<string>();
    const walk = (o: unknown, req: boolean): void => {
      if (Array.isArray(o)) o.forEach((x) => walk(x, req));
      else if (o && typeof o === 'object') {
        const r = o as Record<string, unknown>;
        if (r.kind === 'flag' && typeof r.key === 'string') (req ? read : set).add(r.key);
        for (const [k, v] of Object.entries(r)) walk(v, req || k === 'requires' || k === 'when');
      }
    };
    rq.forEach((e) => walk(e, false));
    // 'rival-anonymous' style decrements count as reads of the same key.
    // `rep` is the shared Reputation flag (STANDARDS.md), read by the record condition of other files.
    const unread = [...set].filter((k) => !read.has(k) && !SHARED_READ.includes(k));
    expect(unread).toEqual([]);
  });
});
