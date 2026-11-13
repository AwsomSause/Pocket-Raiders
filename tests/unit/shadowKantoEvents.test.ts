// Kanto Named Shadows are obtainable in play: each has an event that hands it over and, where its key is a story act, an event that meets the key.

import { describe, expect, it } from 'vitest';
import { applyEffect, conditionMet } from '../../src/core/events';
import { startGrandArc } from '../../src/core/grandArc';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { checkFlagKeys, activeKey } from '../../src/core/shadow2';
import { content } from './helpers';

const fresh = (seed: string) => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  startGrandArc(run);
  return run;
};
const open = (run: ReturnType<typeof fresh>, id: string) => (content.events.get(id)!.requires ?? []).every((r) => conditionMet(content, run, r));
const rng = () => new Rng(hashSeed('k'));

describe('Kanto Named Shadow events', () => {
  const cases: [string, string, string][] = [
    ['kanto-amber-lab', 'ss.rocket.amberjack', 'Aerodactyl'],
    ['kanto-fossil-vault', 'ss.rocket.shellshock', 'Kabutops'],
    ['kanto-safari-truck', 'ss.rocket.matron', 'Kangaskhan'],
    ['kanto-lavender-fog', 'ss.rocket.black-fog', 'Haunter'],
  ];
  for (const [eventId, ssId] of cases) {
    it(`${eventId} hands over ${ssId} once`, () => {
      const run = fresh(eventId);
      run.regionOrder = ['kanto', ...run.regionOrder.slice(1)];
      run.regionIndex = 0;
      expect(open(run, eventId)).toBe(true);
      const ev = content.events.get(eventId)!;
      const battle = ev.choices[0]!.success.battle!;
      expect(battle.kind).toBe('trainer');
      for (const e of (battle as { win: Parameters<typeof applyEffect>[2][] }).win) applyEffect(content, run, e, rng());
      const d = run.pending[0] as { kind: string; mon: { shadow?: { named?: string } } };
      expect(d.kind).toBe('caught');
      expect(d.mon.shadow?.named).toBe(ssId);
      expect(open(run, eventId)).toBe(false);
    });
  }
  it('the key events appear after the Shadow is met, and meeting the key frees it', () => {
    for (const [first, key, ssId, flagKey] of [['kanto-fossil-vault', 'kanto-pewter-registry', 'ss.rocket.shellshock', 'xk-fossil-registered'], ['kanto-lavender-fog', 'kanto-tower-rites', 'ss.rocket.black-fog', 'xk-tower-cleansed']] as const) {
      const run = fresh(key);
      run.regionOrder = ['kanto', ...run.regionOrder.slice(1)];
      run.regionIndex = 0;
      expect(open(run, key)).toBe(false);
      for (const e of (content.events.get(first)!.choices[0]!.success.battle as { win: Parameters<typeof applyEffect>[2][] }).win) applyEffect(content, run, e, rng());
      const mon = (run.pending[0] as { mon: (typeof run.party)[number] }).mon;
      run.party.push(mon);
      expect(activeKey(mon)?.shadow).toBe(ssId);
      expect(open(run, key)).toBe(true);
      for (const e of content.events.get(key)!.choices[0]!.success.effects) applyEffect(content, run, e, rng());
      expect(checkFlagKeys(content, run)).toHaveLength(0);
      expect(mon.shadow).toBeUndefined();
      expect(run.story.flags[`ev:${flagKey}`]).toBe(1);
      expect(open(run, key)).toBe(false);
    }
  });
  it('the events never appear in a run without the Grand Arc, or outside Kanto', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'x', seed: 'x', archetypeId: 'red' }), 0));
    run.regionOrder = ['kanto', ...run.regionOrder.slice(1)];
    expect(open(run, 'kanto-amber-lab')).toBe(false);
    const arc = fresh('y');
    arc.regionOrder = ['johto', ...arc.regionOrder.filter((r) => r !== 'johto')];
    arc.regionIndex = 0;
    expect(open(arc, 'kanto-amber-lab')).toBe(false);
  });
});
