import { describe, expect, it } from 'vitest';
import { StadiumDirector } from '../../src/ui/galar/stadiumDirector';

const hooks = (alive = { player: 3, foe: 3 }) => ({
  runSeed: 'S', battleId: 'b', host: 'Leon', impressive: false, rivalWatching: false,
  disableAnimations: () => true, reduceMotion: () => false, setIntensity: () => {}, finalMusic: () => {}, alive: () => alive, say: async () => {},
});

describe('StadiumDirector beats', () => {
  const dir = (alive?: { player: number; foe: number }) => new StadiumDirector({} as never, hooks(alive));
  it('reads big super-effective hits, near-KO survivals, Dynamax and faints', () => {
    const d = dir();
    expect(d.beatFor({ type: 'damage', side: 'enemy', amount: 60, hpAfter: 40, effectiveness: 2, crit: false })).toBe('bigHit');
    expect(d.beatFor({ type: 'damage', side: 'enemy', amount: 10, hpAfter: 90, effectiveness: 2, crit: false })).toBeNull();
    expect(d.beatFor({ type: 'damage', side: 'player', amount: 95, hpAfter: 5, effectiveness: 1, crit: false })).toBe('survived');
    expect(d.beatFor({ type: 'faint', side: 'enemy', uid: 'u', participants: [] })).toBe('knockOut');
  });
  it('a big hit while behind is a comeback', () => {
    expect(dir({ player: 1, foe: 3 }).beatFor({ type: 'damage', side: 'enemy', amount: 80, hpAfter: 20, effectiveness: 2, crit: false })).toBe('comeback');
  });
  it('does nothing and never throws when animations are off', async () => {
    const d = dir();
    await d.onEvent({ type: 'faint', side: 'player', uid: 'u', participants: [] });
    await d.afterTurn();
  });
});
