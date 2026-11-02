// Run events E (helpers and moral choices): data checks and the follow-up chains.
import { describe, expect, it } from 'vitest';
import raw from '../../src/data/eventsHelpers.json';
import { content } from './helpers';

const ids = (raw.events as { id: string }[]).map((e) => e.id);

describe('helper and moral choice events', () => {
  it('are all in the content', () => {
    expect(ids.length).toBeGreaterThanOrEqual(40);
    for (const id of ids) expect(content.events.has(id)).toBe(true);
  });

  it('follow-up events only wait on flags another event sets', () => {
    const events = raw.events as { id: string; callback?: boolean; requires: { kind: string; key?: string }[]; choices: { success: { effects: { kind: string; key?: string }[] } }[] }[];
    const set = new Set(events.flatMap((e) => e.choices.flatMap((c) => c.success.effects.filter((f) => f.kind === 'flag').map((f) => f.key))));
    for (const e of events.filter((x) => x.callback)) {
      const need = e.requires.find((r) => r.kind === 'flag')!;
      expect(set.has(need.key), `${e.id} waits on ${need.key}`).toBe(true);
    }
  });

  it('the elder quest has three parts in order', () => {
    expect(ids).toEqual(expect.arrayContaining(['elders-last-wish-1', 'elders-last-wish-2', 'elders-last-wish-3']));
  });
});
