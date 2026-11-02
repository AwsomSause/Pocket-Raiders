import { describe, expect, it } from 'vitest';
import { buildContent, RAW_CONTENT } from '../../src/data';
import games from '../../src/data/eventsGames.json';

describe('auto-discovered event files', () => {
  it('adds the events of every file in eventsExtra to the event map', () => {
    const copy = { ...games.events[0]!, id: 'extra-copy-test' };
    const content = buildContent({ ...RAW_CONTENT, eventsExtra: [...(RAW_CONTENT.eventsExtra ?? []), { events: [copy] }] });
    expect(content.events.has('extra-copy-test')).toBe(true);
    expect(buildContent().events.has('extra-copy-test')).toBe(false);
  });
});
