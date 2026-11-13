// Beta 0.6 minigames, batch 3: Stealth Escape.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('stealth escape', () => {
  it('reaching the exit with no guards ends the game with the escape score', () => {
    const m = gameModule('stealth-escape');
    const s = m.start(content, params('stealth-escape'), rs('st')) as any;
    s.guards = [];
    for (let i = 0; i < 5; i++) m.act(content, s, 'up');
    for (let i = 0; i < 5; i++) m.act(content, s, 'right');
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBe(6);
  });
  it('being seen costs an alert and returns to the start; too many alerts end it', () => {
    const m = gameModule('stealth-escape');
    const s = m.start(content, params('stealth-escape'), rs('seen')) as any;
    s.guards = [{ axis: 0, line: 5, pos: 1, dir: -1 }];
    m.act(content, s, 'right');
    expect(s.alerts).toBe(1);
    expect([s.px, s.py]).toEqual([0, 5]);
    s.maxAlerts = 2;
    m.act(content, s, 'right');
    expect(s.done).toBe(true);
  });
  it('replays the same from the same seed', () => {
    const run = () => {
      const m = gameModule('stealth-escape');
      const s = m.start(content, params('stealth-escape'), rs('same')) as any;
      for (let i = 0; i < 12; i++) { m.tick!(content, s); m.act(content, s, i % 2 ? 'up' : 'right'); }
      return JSON.stringify(s);
    };
    expect(run()).toBe(run());
  });
});
