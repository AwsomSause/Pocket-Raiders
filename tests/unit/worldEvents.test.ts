import { describe, expect, it } from 'vitest';
import worldEvents from '../../src/data/events/worldEvents.json';
import { content } from './helpers';

describe('World events (S134-S153 batch)', () => {
  it('every world event is in the content with a way out', () => {
    expect(worldEvents.events).toHaveLength(13);
    for (const e of worldEvents.events) {
      const def = content.events.get(e.id);
      expect(def, e.id).toBeDefined();
      expect(def!.choices.some((c) => !c.requires?.length), e.id).toBe(true);
    }
  });
});
