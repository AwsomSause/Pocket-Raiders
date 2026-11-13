// The Orchestra Pit (picked Orchestra layout): four lanes, held notes, applause.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('orchestra pit', () => {
  it('a perfect player (tap on the line, let go of long notes at the end) scores the maximum', () => {
    for (let tier = 0; tier < 3; tier++) {
      const m = gameModule('orchestra-pit');
      const s = m.start(content, params('orchestra-pit', tier), rs(`pit${tier}`)) as any;
      for (let i = 0; i < 400 && !s.done; i++) {
        m.tick!(content, s);
        for (const n of s.notes) if (n.state === 0 && n.row === 5) m.act(content, s, String(n.lane));
      }
      expect(s.done).toBe(true);
      expect(s.applause).toBe(s.maxApplause);
      expect(m.result(s).score).toBeGreaterThan(m.result(s).max * 0.85);
    }
  });
  it('tapping an empty lane costs applause, and zero applause ends the show', () => {
    const m = gameModule('orchestra-pit');
    const s = m.start(content, { ...params('orchestra-pit'), applause: 2 }, rs('quiet')) as any;
    m.act(content, s, '0');
    expect(s.applause).toBe(1);
    m.act(content, s, '1');
    expect(s.done).toBe(true);
  });
  it('tapping again lets go of a held note', () => {
    const m = gameModule('orchestra-pit');
    const s = m.start(content, params('orchestra-pit'), rs('hold')) as any;
    s.notes = [{ lane: 2, row: 5, len: 3, state: 0, heldTicks: 0 }];
    m.act(content, s, '2');
    expect(s.notes[0].state).toBe(1);
    m.act(content, s, '2');
    expect(s.notes[0].state).toBe(2);
  });
});
