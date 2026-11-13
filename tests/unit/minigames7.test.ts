// Beta 0.6 minigames, batch 4: the arcade cabinets.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('arcade ball breaker', () => {
  it('breaks a brick in the way and ends by balls, time or bricks', () => {
    const m = gameModule('arcade-ball-breaker');
    const s = m.start(content, params('arcade-ball-breaker'), rs('brk')) as any;
    s.bricks = s.bricks.map(() => false);
    s.bricks[2 * 6 + 3] = true;
    s.total = 1;
    s.x = 2; s.y = 3; s.dx = 1; s.dy = -1;
    m.tick!(content, s);
    expect(s.broken).toBe(1);
    expect(s.done).toBe(true);
    expect(m.result(s)).toEqual({ score: 1, max: 1 });
  });
});

describe('arcade snowball shooter', () => {
  it('a snowball hits the lowest target in its column', () => {
    const m = gameModule('arcade-snowball-shooter');
    const s = m.start(content, params('arcade-snowball-shooter'), rs('shoot')) as any;
    s.targets = [{ col: 1, row: 1 }, { col: 1, row: 3 }];
    m.act(content, s, '1');
    expect(s.hit).toBe(1);
    expect(s.targets).toEqual([{ col: 1, row: 1 }]);
  });
  it('targets that reach the bottom cost lives and the game always ends', () => {
    const m = gameModule('arcade-snowball-shooter');
    const s = m.start(content, params('arcade-snowball-shooter'), rs('end')) as any;
    for (let i = 0; i < 300 && !s.done; i++) m.tick!(content, s);
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBeLessThanOrEqual(m.result(s).max);
  });
});

describe('arcade berry stacker', () => {
  it('trims the overhang, and a full miss ends it', () => {
    const m = gameModule('arcade-berry-stacker');
    const s = m.start(content, params('arcade-berry-stacker'), rs('stk')) as any;
    const top = s.stack[0];
    s.pos = top.left + 1;
    m.act(content, s, 'drop');
    expect(s.stack.length).toBe(2);
    expect(s.width).toBe(top.width - 1);
    s.pos = 0; s.stack[1] = { left: 6, width: 1 };
    m.act(content, s, 'drop');
    expect(s.done).toBe(true);
  });
});
