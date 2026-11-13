// Rocket Row Arcade cabinets: Whack-a-Diglett and Claw Machine.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('whack-a-diglett', () => {
  it('hits count, a Meowth is a strike, and a perfect player gets everything', () => {
    const m = gameModule('arcade-whack-a-diglett');
    const s = m.start(content, params('arcade-whack-a-diglett'), rs('whack')) as any;
    for (let i = 0; i < 200 && !s.done; i++) {
      m.tick!(content, s);
      for (const mole of s.moles) if (!mole.decoy && !mole.hit) m.act(content, s, String(mole.hole));
    }
    expect(s.done).toBe(true);
    expect(s.strikes).toBe(0);
    expect(m.result(s)).toEqual({ score: s.total, max: s.total });
  });
  it('too many Meowth hits end it', () => {
    const m = gameModule('arcade-whack-a-diglett');
    const s = m.start(content, params('arcade-whack-a-diglett'), rs('meow')) as any;
    s.maxStrikes = 1;
    s.moles = [{ hole: 4, left: 2, decoy: true, hit: false }];
    m.act(content, s, '4');
    expect(s.done).toBe(true);
  });
});

describe('claw machine', () => {
  it('a drop over a prize takes it, an empty drop wastes the try, and it ends when drops run out', () => {
    const m = gameModule('arcade-claw-machine');
    const s = m.start(content, params('arcade-claw-machine'), rs('claw')) as any;
    s.prizes = [0, 3, 0, 0, 1];
    s.col = 1;
    m.act(content, s, 'drop');
    expect(s.got).toBe(3);
    m.act(content, s, 'drop');
    expect(s.got).toBe(3);
    s.drops = 1;
    m.act(content, s, 'drop');
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBeLessThanOrEqual(m.result(s).max);
  });
});
