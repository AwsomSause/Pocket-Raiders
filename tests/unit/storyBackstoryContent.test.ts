// Story S1: the authored backstory modules. All 19 story gates stay at 0 and every module manifest names real records.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { storyGates } from '../../src/quality/storyGates';
import rawBackstories from '../../src/data/story/backstories.json';
import { content } from './helpers';

const data = content.storyData;
describe('backstory content', () => {
  it('keeps every story gate at 0', () => {
    const bad = storyGates(data, content, { fileExists: (p) => existsSync(p) }).filter((g) => g.offenders.length > 0);
    expect(bad.map((g) => `${g.id}: ${g.offenders.slice(0, 3).join('; ')}`)).toEqual([]);
  });
  it('module manifests name real events, remembrances and endings', () => {
    const events = new Set(data.events.map((x) => x.id)), rems = new Set(data.remembrances.map((x) => x.id));
    for (const b of rawBackstories as unknown as { id: string; events: string[]; echoEvents: string[]; remembranceUnlocks: string[]; endingGrid: { ending: string; when: unknown[] }[]; endings: string[] }[]) {
      const m = b;
      expect([b.id, m.events.filter((x) => !events.has(x))]).toEqual([b.id, []]);
      expect([b.id, m.echoEvents.filter((x) => !events.has(x))]).toEqual([b.id, []]);
      expect([b.id, m.remembranceUnlocks.filter((x) => !rems.has(x))]).toEqual([b.id, []]);
      expect(m.events.length).toBeGreaterThanOrEqual(8);
      expect(m.echoEvents.length).toBeGreaterThanOrEqual(3);
      expect(m.endings.length).toBeGreaterThanOrEqual(4);
      expect(m.endingGrid.at(-1)!.when).toEqual([]);
      expect(m.endings.every((e) => events.has('ev_' + e))).toBe(true);
    }
  });
});
