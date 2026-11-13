// Beta 0.6 minigames, batches 5-6: Debate Club and Safari Trek.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('debate club', () => {
  it('always picking the matching argument scores full marks', () => {
    const m = gameModule('debate-club');
    const s = m.start(content, { ...params('debate-club'), uses: 99 }, rs('deb')) as any;
    while (!s.done) m.act(content, s, String(s.rounds[s.at].crowd));
    expect(m.result(s)).toEqual({ score: s.rounds.length * 2, max: s.rounds.length * 2 });
  });
  it('a limited argument runs out and a bad crowd mood ends the debate', () => {
    const m = gameModule('debate-club');
    const s = m.start(content, params('debate-club'), rs('mood')) as any;
    s.uses = [0, 5, 5];
    m.act(content, s, '0');
    expect(s.at).toBe(0);
    s.rounds.forEach((r: any) => (r.crowd = 0));
    s.mood = 1;
    m.act(content, s, '1');
    expect(s.done).toBe(true);
  });
});

describe('safari trek', () => {
  it('following the true route leads to the photo phase; the centre frame scores 3', () => {
    const m = gameModule('safari-trek');
    const s = m.start(content, { ...params('safari-trek'), steps: 99 }, rs('trek')) as any;
    for (const l of [...s.route]) m.act(content, s, String(l));
    expect(s.phase).toBe('photo');
    m.act(content, s, 'f4');
    expect(s.photo).toBe(3);
    for (let i = 0; i < 5; i++) m.act(content, s, 'f4');
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBeLessThanOrEqual(m.result(s).max);
  });
  it('running out of steps ends the trek', () => {
    const m = gameModule('safari-trek');
    const s = m.start(content, params('safari-trek'), rs('lost')) as any;
    const wrong = String((s.route[0] + 1) % 3);
    for (let i = 0; i < 20 && !s.done; i++) m.act(content, s, wrong);
    expect(s.done).toBe(true);
  });
});
