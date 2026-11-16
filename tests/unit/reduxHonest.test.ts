import { describe, expect, it } from 'vitest';
import { honestLine, honestVerdict, honestView, type HonestModel, type HonestSide } from '../../src/ui/redux/screens/stops';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: the Honest Trade Card (Catalog Overhaul TRADES.md 1.1-1.3) drawn on the mock-ups' trade page. The page is
// a pure function from a model to HTML, so what it must always tell the player is checked here without a browser.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: (n) => layout % n });
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const mon = (over: Partial<HonestSide> = {}): HonestSide => ({
  file: null, name: 'Haunter', level: 28, types: ['ghost', 'poison'], nature: 'Timid', ability: 'Levitate', hidden: false,
  moves: ['Shadow Ball', 'Hypnosis', 'Lick', 'Curse'], quirk: { name: 'Night singer', line: 'It sings at night.' }, marks: ['hatched on a ferry', 'survived a flood'],
  held: null, shiny: false, value: 5, evolvesTo: null, ...over,
});
const card = (over: Partial<HonestModel> = {}): HonestModel => ({
  title: 'Harbour Trade', you: null, trader: 'Marlo', traderArt: null, wants: 'a Water type', gift: false,
  give: mon({ name: 'Psyduck', level: 24, types: ['water'], nature: 'Calm', ability: 'Damp', moves: ['Water Gun', 'Confusion'], quirk: null, marks: [], value: 4 }),
  get: mon(), warn: null, why: 'It keeps the whole dock awake.', asking: false, at: 0, count: 1, focus: 0, readOnly: false, ...over,
});

describe('Honest Trade Card', () => {
  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      it('tells both sides in full: name, level, nature, ability, all four moves, quirk, history and one fair value each', () => {
        const html = honestView(ctx(layout), card());
        for (const bit of ['Haunter', 'Lv 28', 'Timid', 'Levitate', 'Shadow Ball', 'Hypnosis', 'Lick', 'Curse', 'Night singer', 'It sings at night.', 'hatched on a ferry', 'survived a flood', 'Fair value 5']) expect(html).toContain(bit);
        for (const bit of ['Psyduck', 'Lv 24', 'Calm', 'Damp', 'Water Gun', 'Confusion', 'Fair value 4']) expect(html).toContain(bit);
        expect(html).toContain('Marlo');
        expect(html).toContain('It keeps the whole dock awake.');
      });
      it('always shows four move slots, with a dash for an empty one', () => {
        const html = honestView(ctx(layout), card({ give: null, gift: true, get: mon({ moves: ['Lick'] }) }));
        expect(count(html, '>—</span>')).toBe(3);
      });
      it('marks a hidden ability, a held item, a shiny and a trade evolution', () => {
        const html = honestView(ctx(layout), card({ get: mon({ hidden: true, held: 'Spell Tag', shiny: true, evolvesTo: 'Gengar' }) }));
        expect(html).toContain('(Hidden)');
        expect(html).toContain('Spell Tag');
        expect(html).toContain('✦');
        expect(html).toContain('Evolves into Gengar when traded');
        const plain = honestView(ctx(layout), card());
        for (const bit of ['(Hidden)', 'Holds', '✦', 'Evolves into']) expect(plain).not.toContain(bit);
      });
      it('has one Trade and one Back button; stepping through your Pokémon only when there are several', () => {
        const one = honestView(ctx(layout), card());
        expect(count(one, 'data-act="accept"')).toBe(1);
        expect(count(one, 'data-act="back"')).toBe(1);
        expect(one).not.toContain('data-act="step"');
        const many = honestView(ctx(layout), card({ count: 3, at: 1 }));
        expect(count(many, 'data-act="step"')).toBe(2);
        expect(many).toContain('2/3');
      });
      it('"Ask about it" only shows the card: no Trade button, one button to close', () => {
        const html = honestView(ctx(layout), card({ readOnly: true, count: 3 }));
        expect(html).not.toContain('data-act="accept"');
        expect(html).not.toContain('data-act="step"');
        expect(count(html, 'data-act="back"')).toBe(1);
      });
      it('with nothing that fits, the Trade button is dimmed and the page says what is wanted', () => {
        const html = honestView(ctx(layout), card({ give: null }));
        expect(html).toMatch(/opacity:\.5"[^>]*data-act="accept"/);
        expect(html).toContain('a Water type');
      });
      it('never injects text as HTML', () => {
        const html = honestView(ctx(layout), card({ trader: '<b>x</b>', why: '<i>y</i>', get: mon({ name: '<u>z</u>', moves: ['<s>m</s>'], marks: ['<em>k</em>'] }) }));
        for (const bit of ['<b>x</b>', '<i>y</i>', '<u>z</u>', '<s>m</s>', '<em>k</em>']) expect(html).not.toContain(bit);
      });
    });
  }

  it('the verdict: a gift, a fair trade, a worse one (in red), a much better one, or what is needed', () => {
    expect(honestVerdict(card())).toEqual({ text: 'Fair trade', bad: false });
    expect(honestVerdict(card({ warn: 'worse' }))).toEqual({ text: 'You give more than you get', bad: true });
    expect(honestVerdict(card({ warn: 'much-better' }))).toEqual({ text: 'Much better for you', bad: false });
    expect(honestVerdict(card({ gift: true, give: null }))).toEqual({ text: 'A gift', bad: false });
    expect(honestVerdict(card({ give: null }))).toEqual({ text: 'Needs a Water type', bad: true });
    expect(honestView(ctx(0), card({ warn: 'worse' }))).toContain('color:#f08080');
    expect(honestView(ctx(0), card())).not.toContain('color:#f08080');
  });

  it('the trader says why; after a warning they ask once more, and the button says so', () => {
    expect(honestLine(card())).toBe('It keeps the whole dock awake.');
    expect(honestLine(card({ warn: 'much-better' }))).toBe('It keeps the whole dock awake.');
    expect(honestLine(card({ asking: true, warn: 'worse' }))).toBe('Mine’s worth less than yours. You sure?');
    expect(honestLine(card({ give: null }))).toBe('I’m looking for a Water type. It keeps the whole dock awake.');
    const asking = honestView(ctx(0), card({ asking: true, warn: 'worse', count: 3 }));
    expect(asking).toContain('Yes, trade');
    expect(asking).toContain('Mine’s worth less than yours. You sure?');
    // While the trader waits for the answer, the offer cannot be switched.
    expect(asking).not.toContain('data-act="step"');
  });
});
