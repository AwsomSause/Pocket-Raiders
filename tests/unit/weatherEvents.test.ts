// Run events J (weather, terrain and hazards): data loads, every id is unique, every choice has an outcome.

import { describe, expect, it } from 'vitest';
import weatherJson from '../../src/data/eventsWeather.json';
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
});
