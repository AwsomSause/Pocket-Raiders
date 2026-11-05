import { describe, expect, it } from 'vitest';
import { peekStreams } from '../../src/core/tools/rngView';
import { Rng, STREAM_NAMES, createStreams } from '../../src/core/rng';

describe('rng stream view', () => {
  it('lists every stream and predicts the next values without moving the real stream', () => {
    const streams = createStreams('seed-1');
    const before = JSON.stringify(streams);
    const view = peekStreams(streams, 3);
    expect(view.map((v) => v.name)).toEqual([...STREAM_NAMES]);
    expect(JSON.stringify(streams)).toBe(before);
    const real = new Rng(streams.battle);
    const battle = view.find((v) => v.name === 'battle')!;
    expect(battle.next).toEqual([real.float(), real.float(), real.float()].map((x) => Math.round(x * 10000) / 10000));
  });
  it('is the same twice', () => {
    const s = createStreams('x');
    expect(peekStreams(s)).toEqual(peekStreams(s));
  });
});
