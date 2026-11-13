// Beta 0.6 minigames, batch 2: Orchestra.

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('orchestra', () => {
  it('a perfect conductor gets full score, swell works as an action', () => {
    for (let tier = 0; tier < 3; tier++) {
      const m = gameModule('orchestra');
      const s = m.start(content, params('orchestra', tier), rs(`orch${tier}`)) as any;
      for (let i = 0; i < 200 && !s.done; i++) {
        m.tick!(content, s);
        const q = s.cues.find((c: any) => c.hit === null && c.beat === s.beat);
        if (q) m.act(content, s, q.kind === 4 ? 'swell' : String(q.kind));
      }
      expect(s.done).toBe(true);
      expect(m.result(s)).toEqual({ score: m.result(s).max, max: m.result(s).max });
    }
  });
  it('a wrong cue breaks the combo and a missed cue scores nothing', () => {
    const m = gameModule('orchestra');
    const s = m.start(content, params('orchestra'), rs('wrong')) as any;
    s.combo = 3;
    m.act(content, s, 'swell');
    m.act(content, s, '0');
    expect(s.combo).toBe(0);
    for (let i = 0; i < 200 && !s.done; i++) m.tick!(content, s);
    expect(m.result(s).score).toBe(0);
  });
});
