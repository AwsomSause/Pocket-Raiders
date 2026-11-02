// Run events J (weather, terrain and hazards): data loads, every id is unique, every choice has an outcome.

import { describe, expect, it } from 'vitest';
import weatherJson from '../../src/data/eventsWeather.json';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun, tickTempEffects } from '../../src/core/run';
import { createBattle } from '../../src/core/battle/engine';
import { content } from './helpers';

const ids = (weatherJson as { events: { id: string }[] }).events.map((e) => e.id);

describe('weather and hazard events', () => {
  it('adds 35 events to the run event pool', () => {
    expect(ids).toHaveLength(35);
    expect(new Set(ids).size).toBe(35);
    for (const id of ids) expect(content.events.has(id) || [...content.events.values()].some((e) => e.id === id)).toBe(true);
  });

  it('gives each event 2+ choices, and a failure outcome wherever there is a check or chance', () => {
    for (const e of (weatherJson as { events: { id: string; choices: { check?: string; chance?: number; failure?: unknown }[] }[] }).events) {
      expect(e.choices.length).toBeGreaterThanOrEqual(2);
      for (const c of e.choices) if (c.check || c.chance !== undefined) expect(c.failure, e.id).toBeDefined();
    }
  });

  it('a tempEffect choice boosts the next fight only, then runs out', () => {
    let run = chooseStarter(content, createRun(content, { runId: 'wx', seed: 'wx', archetypeId: 'red' }), 0);
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'wx', kind: 'event', used: false, eventId: 'wx-earthquake-tremor' });
    const before = run.perkEffects.length;
    run = chooseEvent(content, run, 'wx', 0).run;
    expect(run.tempEffects).toHaveLength(1);
    expect(run.perkEffects.some((m) => m.kind === 'typeDamageMultiplier' && m.type === 'ground')).toBe(true);
    expect(run.perkEffects.length).toBe(before + 1);
    tickTempEffects(run, createBattle('wild', [run.party[0]!], 0, run.party[0]!.uid), false);
    expect(run.tempEffects).toHaveLength(0);
    expect(run.perkEffects.some((m) => m.kind === 'typeDamageMultiplier' && m.type === 'ground')).toBe(false);
  });
});
