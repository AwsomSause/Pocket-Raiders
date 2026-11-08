import { describe, expect, it } from 'vitest';
import story from '../../src/data/story.json';
import { hyperAnimId } from '../../src/core/presentation/storyAnims';

describe('Hyper/Overdrive flourish coverage', () => {
  it('every Hyper and Overdrive moment in story.json has its own flourish (not the generic one)', () => {
    const defs = story.definitions as unknown as Record<string, { family?: string }> | { id: string; family?: string }[];
    const list = Array.isArray(defs) ? defs : Object.entries(defs).map(([id, d]) => ({ id, ...d }));
    const moments = list.filter((d) => d.family === 'hyper' || d.family === 'overdrive');
    expect(moments.length).toBeGreaterThanOrEqual(9);
    expect(moments.filter((m) => hyperAnimId(m.id) === 'overdrive.moment').map((m) => m.id)).toEqual([]);
  });
});
