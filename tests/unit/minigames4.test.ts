// Beta 0.6 minigames, batch 1: Psyduck Migration, The Day the Center Closed, Sled Run.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('psyduck migration', () => {
  it('grows on a duckling, ends on the edge, and cannot turn straight back', () => {
    const m = gameModule('psyduck-migration');
    const s = m.start(content, params('psyduck-migration'), rs('snake')) as any;
    s.duck = [s.body[0][0] + 1, s.body[0][1]];
    m.tick!(content, s);
    expect(s.caught).toBe(1);
    expect(s.body.length).toBe(2);
    m.act(content, s, 'left');
    expect(s.pending).toBe('right');
    for (let i = 0; i < 20 && !s.done; i++) m.tick!(content, s);
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBe(1);
  });
  it('replays the same from the same seed', () => {
    const run = () => {
      const m = gameModule('psyduck-migration');
      const s = m.start(content, params('psyduck-migration'), rs('same')) as any;
      for (let i = 0; i < 10; i++) m.tick!(content, s);
      return JSON.stringify(s);
    };
    expect(run()).toBe(run());
  });
});

describe('center triage', () => {
  it('treating the critical patient first scores it, and the rest can run out of time', () => {
    const m = gameModule('center-triage');
    const s = m.start(content, params('center-triage'), rs('tri')) as any;
    const top = s.patients.findIndex((p: any) => p.sev === Math.max(...s.patients.map((q: any) => q.sev)));
    m.act(content, s, String(top));
    for (let i = 0; i < 200 && !s.done; i++) m.tick!(content, s);
    expect(s.done).toBe(true);
    expect(s.patients[top].status).toBe('saved');
    expect(m.result(s).score).toBeLessThanOrEqual(m.result(s).max);
  });
});

describe('sled run', () => {
  it('dodging every rock keeps all lives and a rock hit costs one', () => {
    const m = gameModule('sled-run');
    const s = m.start(content, params('sled-run'), rs('sled')) as any;
    s.rows = [{ rock: 1, berry: -1 }, { rock: -1, berry: 0 }];
    s.totalBerries = 1;
    const lives = s.lives;
    m.tick!(content, s);
    expect(s.lives).toBe(lives - 1);
    m.act(content, s, 'left');
    m.tick!(content, s);
    expect(s.berries).toBe(1);
    expect(s.done).toBe(true);
    expect(m.result(s)).toEqual({ score: 1, max: 1 });
  });
});
