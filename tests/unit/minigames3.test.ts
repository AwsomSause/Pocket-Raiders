// New minigames (S437, S445, S446, S451, S453, S486, S493, S494) and the Battle Palace nature rules: solvable, bounded, deterministic.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { palaceStyle } from '../../src/core/exhibition';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('puzzle slots', () => {
  it('can always be solved within the turns given, and jackpots at 12', () => {
    const m = gameModule('puzzle-slots');
    for (let i = 0; i < 40; i++) {
      const s = m.start(content, params('puzzle-slots', 2), rs(`slot${i}`)) as any;
      // Solve by turning every reel until it matches reel 1.
      for (let c = 1; c < 4; c++) while (s.off[c] !== s.off[0]) m.act(content, s, `turn${c}`);
      expect(m.result(s)).toEqual({ score: 12, max: 12 });
      expect(s.done || s.moves > 0).toBe(true);
    }
  });
});

describe('obstacle course', () => {
  it('stat profile always adds to 12, rests are limited, and it ends', () => {
    const m = gameModule('obstacle-course');
    const s = m.start(content, params('obstacle-course'), rs('ath')) as any;
    expect((s.stats as number[]).reduce((a, b) => a + b, 0)).toBe(12);
    for (let i = 0; i < 10; i++) m.act(content, s, 'rest');
    expect(s.rests).toBe(0);
    for (let i = 0; i < 100 && !s.done; i++) m.act(content, s, '0');
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBeLessThanOrEqual(m.result(s).max);
  });
});

describe('dance battle', () => {
  it('ignores input while the rival dances, then scores a perfect copy', () => {
    const m = gameModule('dance-battle');
    const s = m.start(content, params('dance-battle'), rs('dance')) as any;
    m.act(content, s, '0');
    expect(s.input).toBe(0);
    for (let guard = 0; guard < 200 && !s.done; guard++) {
      while (s.show < s.seq.length) m.tick!(content, s);
      for (const step of [...s.seq]) m.act(content, s, String(step));
    }
    expect(m.result(s)).toEqual({ score: s.rounds, max: s.rounds });
  });
});

describe('pinball, styler and photo', () => {
  it('pinball ends by balls or time and never exceeds its target', () => {
    const m = gameModule('pinball-bonus');
    const s = m.start(content, params('pinball-bonus'), rs('pin')) as any;
    for (let i = 0; i < 500 && !s.done; i++) m.tick!(content, s);
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBeLessThanOrEqual(m.result(s).max);
  });
  it('styler closes loops in order and a wrong tap breaks the line', () => {
    const m = gameModule('ranger-styler');
    const s = m.start(content, params('ranger-styler'), rs('sty')) as any;
    m.act(content, s, '3');
    expect(s.hp).toBe(params('ranger-styler').hp! - 1);
    for (let i = 0; i < 8; i++) m.act(content, s, String((s.start + i) % 8));
    expect(s.loops).toBe(1);
  });
  it('photo scores the asked type more in the centre frame', () => {
    const m = gameModule('snap-photo');
    const s = m.start(content, params('snap-photo'), rs('snap')) as any;
    s.spots = [null, null, null, null, s.ask, null, null, null, null];
    m.act(content, s, '4');
    expect(s.points).toBe(3);
  });
});

describe('bug contest', () => {
  it('keeps the best bug and ends when searches run out', () => {
    const m = gameModule('bug-contest');
    const s = m.start(content, params('bug-contest'), rs('bug')) as any;
    for (let i = 0; i < 40 && !s.done; i++) m.act(content, s, s.last ? 'keep' : 'spot0');
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBeGreaterThan(0);
  });
});

describe('Battle Palace natures', () => {
  it('attack natures attack, defence natures defend, speed natures alternate, neutral is free', () => {
    expect(palaceStyle('adamant')).toBe('attack');
    expect(palaceStyle('modest')).toBe('attack');
    expect(palaceStyle('bold')).toBe('support');
    expect(palaceStyle('calm')).toBe('support');
    expect(palaceStyle('jolly')).toBe('fickle');
    expect(palaceStyle('hardy')).toBe('free');
    expect(palaceStyle(undefined)).toBe('free');
  });
  it('the palace pool shows natures and replays the same', () => {
    const m = gameModule('battle-palace');
    const a = m.start(content, params('battle-palace'), rs('pal')) as any;
    const b = m.start(content, params('battle-palace'), rs('pal')) as any;
    expect(a.pool.every((f: any) => typeof f.nature === 'string')).toBe(true);
    expect(a).toEqual(b);
  });
});
