import { describe, expect, it } from 'vitest';
import { honestLine, honestVerdict, honestView, type HonestModel, type HonestSide } from '../../src/ui/redux/screens/honest';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: the Honest Trade Card page (Catalog Overhaul, TRADES.md 1.1): both sides with the same lines, the fair
// values compared in one word, the trader's words in the text box, and the second yes when theirs is worth less.

const ctx: ReduxCtx = { k: 0, skin: {} as ReduxCtx['skin'], v: () => 0 };
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const side = (over: Partial<HonestSide> = {}): HonestSide => ({ name: 'Krabby', file: null, level: 12, nature: 'adamant', ability: 'Hyper Cutter', hidden: false, moves: ['Bubble', 'Leer', 'Vise Grip', 'Harden'], quirk: { name: 'Collector', line: 'Picks things up.' }, marks: ['raised on a pier'], held: null, evolvesTo: null, value: 2, shiny: false, ...over });
const card = (over: Partial<HonestModel> = {}): HonestModel => ({ trader: 'Effie', why: 'It chews my nets.', wants: 'any non-Water Pokémon', yours: side({ name: 'Charmander', value: 2 }), theirs: side(), warn: null, gift: false, picks: ['Charmander Lv12'], at: 0, asking: false, ...over });

describe('Honest Trade Card: the word between the sides', () => {
  it('compares the two fair values', () => {
    expect(honestVerdict(card())).toBe('Fair trade');
    expect(honestVerdict(card({ theirs: side({ value: 3 }) }))).toBe('You get more');
    expect(honestVerdict(card({ theirs: side({ value: 5 }), warn: 'much-better' }))).toBe('You get much more');
    expect(honestVerdict(card({ yours: side({ value: 4 }), warn: 'worse' }))).toBe('You give more');
    // A higher value on your side reads the same even if the warning was not passed on.
    expect(honestVerdict(card({ yours: side({ value: 4 }) }))).toBe('You give more');
  });
  it('a gift and a card with no Pokémon picked have their own words', () => {
    expect(honestVerdict(card({ gift: true, yours: null }))).toBe('A gift');
    expect(honestVerdict(card({ yours: null }))).toBe('Their offer');
  });
  it('the trader says why, and asks once when theirs is worth less', () => {
    expect(honestLine(card())).toBe('It chews my nets.');
    expect(honestLine(card({ asking: true }))).toContain('You sure?');
  });
});

describe('Honest Trade Card page', () => {
  it('shows every line of the card on both sides', () => {
    const html = honestView(ctx, card({ theirs: side({ hidden: true, held: 'Mystic Water', evolvesTo: 'Kingler', shiny: true }) }));
    for (const t of ['Trade', 'You', 'Effie', 'Charmander', 'Krabby', 'Lv 12', 'Adamant', 'Hyper Cutter (hidden)', 'Bubble', 'Vise Grip', 'Collector: Picks things up.', 'Raised on a pier', 'Mystic Water', 'Evolves into Kingler', '★ Krabby', 'It chews my nets.', 'They want: any non-Water Pokémon', 'Fair trade']) expect(html, t).toContain(t);
    expect(count(html, 'data-value')).toBe(2);
    expect(count(html, 'data-act="trade"')).toBe(1);
  });
  it('a side with nothing to tell says so, and four moves at most are listed', () => {
    const html = honestView(ctx, card({ theirs: side({ ability: null, quirk: null, marks: [], moves: ['A', 'B', 'C', 'D', 'E'] }) }));
    expect(html).toContain('Nothing yet');
    expect(html).toContain('>None<');
    expect(html).not.toContain('>E<');
    expect(honestView(ctx, card({ theirs: side({ moves: [] }) }))).toContain('No moves');
  });
  it('while the trader waits for the second yes, the lit button says so and the warning is in the text box', () => {
    const html = honestView(ctx, card({ yours: side({ value: 5 }), warn: 'worse', asking: true, picks: ['Charizard Lv30', 'Caterpie Lv5'] }));
    expect(html).toContain('Yes, trade');
    expect(html).not.toContain('Charizard Lv30');
    expect(html).toContain('Caterpie Lv5');
    expect(html).toContain('You sure?');
    expect(html).toContain('You give more');
  });
  it('a long list of Pokémon scrolls with the lit one and says where it is', () => {
    const picks = Array.from({ length: 9 }, (_, i) => `Mon ${i + 1}`);
    const top = honestView(ctx, card({ picks, at: 0 }));
    expect(count(top, 'data-act="trade"')).toBe(6);
    expect(top).toContain('1 of 9');
    const end = honestView(ctx, card({ picks, at: 8 }));
    expect(end).toContain('Mon 9');
    expect(end).toContain('data-act="trade" data-arg="8"');
    expect(end).not.toContain('Mon 1<');
  });
  it('read before choosing (no Pokémon picked): the offer, what they want, and a Close button; a gift asks for nothing', () => {
    const html = honestView(ctx, card({ yours: null, picks: [] }));
    expect(count(html, 'data-act="trade"')).toBe(0);
    expect(html).toContain('data-act="tradeBack"');
    expect(html).toContain('Their offer');
    expect(html).toContain('They want: any non-Water Pokémon');
    const gift = honestView(ctx, card({ yours: null, picks: [], gift: true, wants: 'Nothing: a gift' }));
    expect(gift).toContain('This one is a gift.');
    expect(gift).toContain('A gift');
  });
  it('never lets text in as HTML', () => {
    const html = honestView(ctx, card({ trader: '<b>x</b>', why: 'a <i>b</i>', theirs: side({ name: '<u>k</u>', moves: ['<s>m</s>'], marks: ['<em>z</em>'] }) }));
    for (const bad of ['<b>x</b>', '<i>b</i>', '<u>k</u>', '<s>m</s>', '<em>z</em>']) expect(html).not.toContain(bad);
  });
});
