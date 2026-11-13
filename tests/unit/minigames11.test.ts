// The Day the Center Closed, beds version (picked Triage layout).

import { describe, expect, it } from 'vitest';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const params = (id: string, tier = 1) => content.minigames.games.find((g) => g.id === id)!.difficultyTiers[tier]!.params;
const rs = (seed: string) => new Rng(hashSeed(seed)).state;

describe('triage beds', () => {
  it('the right supply on a bedded patient saves them; the wrong one wastes it', () => {
    const m = gameModule('triage-beds');
    const s = m.start(content, params('triage-beds'), rs('beds')) as any;
    const q = s.patients[0];
    s.supplies = [3, 3, 3, 3];
    m.act(content, s, 'p0');
    m.act(content, s, 'b1');
    expect(q.status).toBe('bed');
    const wrong = (q.cond + 1) % 4;
    m.act(content, s, `s${wrong}`);
    expect(q.status).toBe('bed');
    expect(s.supplies[wrong]).toBe(2);
    m.act(content, s, `s${q.cond}`);
    expect(q.status).toBe('saved');
    expect(s.beds[1]).toBeNull();
    expect(s.points).toBe(q.sev);
  });
  it('a full bed refuses a second patient and waiting patients get worse', () => {
    const m = gameModule('triage-beds');
    const s = m.start(content, params('triage-beds'), rs('full')) as any;
    m.act(content, s, 'p0');
    m.act(content, s, 'b0');
    m.act(content, s, 'p1');
    m.act(content, s, 'b0');
    expect(s.patients[1].status).toBe('wait');
    const hp = s.patients[2].hp;
    m.tick!(content, s);
    expect(s.patients[2].hp).toBeLessThan(hp);
  });
  it('perfect play (treat worst first with the right supplies) gets the maximum and the game always ends', () => {
    const m = gameModule('triage-beds');
    const s = m.start(content, { ...params('triage-beds', 0) }, rs('perfect')) as any;
    const order = s.patients.map((q: any, i: number) => i).sort((a: number, b: number) => s.patients[b].sev - s.patients[a].sev);
    for (const i of order) {
      if (s.supplies[s.patients[i].cond] <= 0 || s.patients[i].status !== 'wait') continue;
      m.act(content, s, `p${i}`);
      m.act(content, s, `b${s.beds.indexOf(null)}`);
      m.act(content, s, `b${s.beds.indexOf(i)}`);
      m.act(content, s, `s${s.patients[i].cond}`);
    }
    for (let i = 0; i < 100 && !s.done; i++) m.tick!(content, s);
    expect(s.done).toBe(true);
    expect(m.result(s).score).toBe(m.result(s).max);
  });
});
