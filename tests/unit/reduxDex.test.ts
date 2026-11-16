import { describe, expect, it } from 'vitest';
import { dexCard, dexDataPage } from '../../src/core/presentation/dexInfo';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { dexView, statPct, type DexModel } from '../../src/ui/redux/screens/dex';
import { content } from './helpers';

// The New UI's Pokédex species page (the mock-ups' `dex` page), in both layouts.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const profile = { speciesSeen: ['bulbasaur', 'pikachu'], speciesCaught: ['bulbasaur'], dexResearch: { bulbasaur: { seen: 9, caught: 2 } } };
const model = (id: string, page: 0 | 1 = 0): DexModel => {
  const card = dexCard(content, profile, id);
  return { card, data: dexDataPage(content, profile, id), page, art: null, line: card.line.map(() => null) };
};
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI Pokédex species page', () => {
  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      it('shows the name, number, types, the four facts, six stat bars and the evolution line', () => {
        const html = dexView(ctx(layout), model('bulbasaur'));
        for (const t of ['Bulbasaur', 'No. 0001', 'Grass', 'Poison', 'Height', '0.7 m', 'Weight', '6.9 kg', 'Caught', 'Battles', 'Research level', 'Evolves into Ivysaur']) expect(html).toContain(t);
        expect(count(html, 'class="hp gold"')).toBe(6);
        expect(count(html, 'class="ty"')).toBe(2);
        expect(html).toContain('data-act="flip"');
        expect(html).toContain('data-act="back"');
        // Two arrows between the three forms of the line.
        expect(count(html, '<b>→</b>')).toBe(2);
      });

      it('the second page keeps the card and lists the facts and the level-up moves', () => {
        const html = dexView(ctx(layout), model('bulbasaur', 1));
        for (const t of ['Bulbasaur', 'Abilities', 'Overgrow', 'Egg groups', 'Catch rate', 'Level-up moves', 'Left or Right']) expect(html).toContain(t);
        expect(count(html, 'class="hp gold"')).toBe(0);
        // A species seen but not caught keeps its hidden ability hidden.
        expect(dexView(ctx(layout), model('pikachu', 1))).toContain('???');
      });

      it('an unmet species shows a question mark and nothing else, on either page', () => {
        for (const page of [0, 1] as const) {
          const html = dexView(ctx(layout), model('charmander', page));
          expect(html).toContain('???');
          expect(html).toContain('Not met yet');
          expect(html).not.toContain('Charmander');
          expect(html).not.toContain('Fire');
          expect(count(html, 'class="hp gold"')).toBe(0);
          expect(html).not.toContain('data-act="flip"');
        }
      });
    });
  }

  it('a stat bar stays between empty and full', () => {
    expect(statPct(0)).toBe(0);
    expect(statPct(78)).toBe(49);
    expect(statPct(160)).toBe(100);
    expect(statPct(255)).toBe(100);
    expect(statPct(-5)).toBe(0);
  });

  it('never lets a name in as HTML', () => {
    const m = model('bulbasaur');
    m.card = { ...m.card, name: '<i>x</i>', note: 'a & b' };
    const html = dexView(ctx(0), m);
    expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
    expect(html).not.toContain('<i>x</i>');
    expect(html).toContain('a &amp; b');
  });
});
