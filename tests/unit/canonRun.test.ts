import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { chooseEvent } from '../../src/core/events';
import { canonSlotOf } from '../../src/core/expansion/canonRun';
import { content } from './helpers';

const begin = (seed: string, on: boolean) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(on ? { expansion: { kantoCanon: true } } : {}) }), 0);
/** The run for the n-th seed whose first region is Kanto (the region order is rolled from the seed). */
const kantoSeeds = (() => { const out: string[] = []; for (let i = 0; out.length < 40 && i < 400; i++) if (begin(`K${i}`, false).regionOrder[0] === 'kanto') out.push(`K${i}`); return out; })();
const start = (seed: string, on: boolean) => begin(seed, on);
const canonStops = (run: ReturnType<typeof start>) => run.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.id.startsWith('canon-')).map((s) => ({ ...s, node: n.id })));

describe('Kanto canon stops in a run', () => {
  it('finds Kanto-first seeds', () => expect(kantoSeeds.length).toBeGreaterThan(5));
  it('a Kanto run with the setting on gets Pewter canon events, one menu kept in the run', () => {
    let seen = 0;
    for (const seed of kantoSeeds.slice(0, 10)) {
      const run = start(seed, true);
      expect(canonSlotOf(content, run)).toBe('stage-1');
      const stops = canonStops(run);
      expect(stops.length).toBeGreaterThan(0);
      expect(stops.length).toBeLessThanOrEqual(3); // Veridian Forest plus up to two rolled events
      expect(run.expansion!.canon!.menus['stage-1']!.slice(0, 2)).toEqual(['cs.kanto.pewter.forest', 'cs.kanto.pewter.moon']);
      for (const s of stops) expect(content.events.get(s.eventId!)!.canon).not.toBeNull();
      seen += stops.length;
      expect(stops.some((s) => s.eventId === 'cs-kanto-pewter-forest')).toBe(true);
    }
    expect(seen).toBeGreaterThan(10);
  });
  it('with the setting off nothing is added and no canon block exists', () => {
    const run = start(kantoSeeds[0]!, false);
    expect(canonStops(run)).toEqual([]);
    expect(run.expansion?.canon).toBeUndefined();
  });
  it('canon events never turn up as random stops', () => {
    const run = start(kantoSeeds[1]!, false);
    for (const n of run.stage!.map.nodes) for (const s of n.sides) if (s.eventId) expect(content.events.get(s.eventId)?.canon ?? null).toBeNull();
  });
  it('playing a canon event marks the space finished and copies its flag', () => {
    for (const seed of kantoSeeds) {
      const run = start(seed, true);
      const stop = canonStops(run).find((s) => s.eventId === 'cs-kanto-pewter-flock');
      if (!stop) continue;
      const node = run.stage!.map.nodes.find((n) => n.sides.some((x) => x.id === stop.id))!;
      run.stage!.current = node.id;
      const after = chooseEvent(content, run, stop.id, 1).run;
      expect(after.expansion!.canon!.completed).toContain('cs.kanto.pewter.flock');
      expect(after.expansion!.canon!.flags).toContain('kanto.flock.seen');
      return;
    }
    throw new Error('no Kanto-first run rolled the Flock');
  });
});

import { debugForceEvent } from '../../src/core/run';

describe('Veridian Forest (Samurai duel)', () => {
  const duel = (species: string) => {
    const base = begin('SAMURAI', true);
    const run = structuredClone(base);
    run.party[0]!.speciesId = species;
    const { run: forced, sideId } = debugForceEvent(content, run, 'cs-kanto-pewter-forest-n6');
    return chooseEvent(content, forced, sideId, 0).run;
  };
  it('is a 1-on-1 at the lead\'s level with no items or switching, and counters a Flying-weak Bug-type with Scyther', () => {
    const run = duel('caterpie');
    expect(run.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['scyther']);
    expect(run.battle!.enemyTeam[0]!.level).toBe(run.party[0]!.level);
    expect(run.battle!.eventRule).toMatchObject({ suddenDeath: true, noSwitch: true, noItems: true });
  });
  it('uses Pinsir against a Bug-type that is not weak to Flying', () => {
    expect(duel('scizor').battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['pinsir']);
  });
  it('Samurai Slash exists as a Bug move with the first-use flinch', () => {
    const m = content.moves.get('samurai-slash')!;
    expect(m).toMatchObject({ type: 'bug', category: 'physical', power: 70, accuracy: 100, pp: 10 });
    expect(m.effects.flinchFirstUse).toBe(true);
  });
  it('the whole chain of rooms opens from the gate (every addEvent target exists)', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith('cs-kanto-pewter-forest'));
    expect(ids.length).toBe(7);
    for (const id of ids) for (const c of content.events.get(id)!.choices) for (const o of [c.success, c.failure]) for (const eff of [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]) if (eff.kind === 'addEvent') expect(content.events.has(eff.eventId)).toBe(true);
  });
});
