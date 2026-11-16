import { describe, expect, it } from 'vitest';
import { bestMedalWord, gameView, type GameModel } from '../../src/ui/redux/screens/minigame';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI minigame screen (the mock-ups' `game` page): its windows across the top, "Best" last.

const ctx: ReduxCtx = { k: 0, skin: {} as ReduxCtx['skin'], v: () => 0 };
const model = (o: Partial<GameModel> = {}): GameModel => ({
  title: 'Pokémon Memory · Normal', hud: ['Moves left 16', 'Pairs 0/8'], prompt: 'Flip two tiles to find a pair.', medal: null, art: null, party: [],
  cols: 4, cells: [{ label: '?', detail: '', off: false }], index: 0, hints: [['Enter', 'choose']], ...o,
});

describe('New UI minigame windows', () => {
  it('the run\'s best medal is the last window, "Best", as on the mock-up', () => {
    const html = gameView(ctx, model({ best: 'Silver' }));
    expect(html).toContain('Best');
    expect(html).toContain('Silver');
    expect(html.indexOf('Pairs')).toBeLessThan(html.indexOf('Best'));
  });
  it('no "Best" window when none is given', () => {
    expect(gameView(ctx, model())).not.toContain('>Best<');
  });
  it('a medal is written as a word, and no medal yet says so', () => {
    expect(bestMedalWord('gold')).toBe('Gold');
    expect(bestMedalWord('bronze')).toBe('Bronze');
    expect(bestMedalWord('none')).toBe('None yet');
    expect(bestMedalWord(undefined)).toBe('None yet');
  });
});
