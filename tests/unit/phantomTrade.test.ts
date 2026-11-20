import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phHonest, phTrade } from '../../src/ui/phantom/screens/trade';
import type { HonestModel, HonestSide, TradeModel } from '../../src/ui/redux/screens/stops';

// The Phantom UI's trade pages: pure functions from the New UI trade models to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;

const trade = (over: Partial<TradeModel> = {}): TradeModel => ({
  title: 'Trade Post', money: 900, you: null, trader: 'Trade Post Clerk', traderArt: null,
  give: { file: null, name: 'Charizard', level: 30, types: ['fire', 'flying'] }, get: { file: null, name: 'Magmar', level: 30, types: ['fire'] },
  verdict: 'About even', bad: false, cost: 50, at: 0, count: 2, focus: 0, line: 'Pick one of yours.', done: null, ...over,
});
const side = (name: string, over: Partial<HonestSide> = {}): HonestSide => ({
  file: null, name, level: 13, types: ['water'], nature: 'Adamant', ability: 'Hyper Cutter', hidden: false, moves: ['Vise Grip', 'Leer'], quirk: { name: 'Collector', line: 'It picks up shiny things.' },
  marks: ['ruined forty nets'], held: null, shiny: false, value: 2, evolvesTo: null, ...over,
});
const honest = (over: Partial<HonestModel> = {}): HonestModel => ({
  title: 'Trade', you: null, trader: 'Effie', traderArt: null, wants: 'a Bug-type', gift: false, give: side('Caterpie', { value: 1 }), get: side('Krabby'),
  warn: null, why: 'It ruined forty nets.', asking: false, at: 0, count: 2, focus: 0, readOnly: false, ...over,
});

describe('Phantom quick trade', () => {
  it('shows both sides, the cost, the small print and the two buttons with one lit', () => {
    const html = phTrade(ph, trade());
    expect(pageOf(html)).toBe('trade');
    expect(count(html, /class="pn (?:lt|dk) tilt ph-tr-card"/)).toBe(2);
    for (const t of ['Trade Post', 'Charizard', 'Magmar', 'Lv 30', 'About even', 'Costs ₽50', '₽900', 'Pick one of yours.', '1 / 2']) expect(html).toContain(t);
    expect(html).toMatch(/class="blade on"[^>]*data-act="accept" data-arg="" data-over="acc"/);
    expect(html).toMatch(/class="blade"[^>]*data-act="decline" data-arg="" data-over="dec"/);
    expect(count(html, 'data-act="step"')).toBe(2);
  });

  it('a trade that cannot be done dims Accept and says why; a single offer has no arrows; a free one names no cost', () => {
    const html = phTrade(ph, trade({ give: null, bad: true, verdict: 'You need ₽50.', count: 1, cost: 0, focus: 1 }));
    expect(html).toMatch(/class="blade off"[^>]*data-act="accept"/);
    expect(html).toContain('class="ph-tr-v bad"');
    expect(html).toContain('Nothing this trader wants');
    expect(html).not.toContain('data-act="step"');
    expect(html).not.toContain('Costs');
  });

  it('after the trade the two have swapped and the page waits for an input', () => {
    const html = phTrade(ph, trade({ done: 'Charizard left. Magmar joined!' }));
    // Your side now holds what you got.
    expect(html.indexOf('Magmar')).toBeLessThan(html.indexOf('Charizard</h3>'));
    expect(html).toContain('Charizard left. Magmar joined!');
    expect(html).not.toContain('data-act="accept"');
    expect(html).not.toContain('data-act="decline"');
    expect(count(html, 'data-act="done"')).toBe(3);
    expect(html).toContain('class="ph-tr-mon pop"');
  });
});

describe('Phantom Honest Trade Card', () => {
  it('tells both sides in full: nature, ability, four move slots, quirk, history and the fair value', () => {
    const html = phHonest(ph, honest());
    expect(pageOf(html)).toBe('trade');
    expect(count(html, 'class="ph-tr-mv"')).toBe(2);
    expect(count(html, /<span>—<\/span>/)).toBe(4);
    for (const t of ['Effie', 'Caterpie', 'Krabby', 'Adamant', 'Hyper Cutter', 'Vise Grip', 'Collector', 'ruined forty nets', 'Fair value 2', 'Fair value 1', 'Fair trade', 'It ruined forty nets.']) expect(html).toContain(t);
    expect(html).toMatch(/class="blade on"[^>]*data-act="accept"[^>]*>Trade</);
    expect(html).toMatch(/data-act="back" data-arg="" data-over="dec"/);
  });

  it('a worse deal is flagged, and the second question changes the button and hides the arrows', () => {
    const worse = phHonest(ph, honest({ warn: 'worse' }));
    expect(worse).toContain('You give more than you get');
    expect(worse).toContain('class="ph-tr-v bad"');
    const asking = phHonest(ph, honest({ warn: 'worse', asking: true }));
    expect(asking).toContain('Mine’s worth less than yours. You sure?');
    expect(asking).toContain('Yes, trade');
    expect(asking).not.toContain('data-act="step"');
  });

  it('reading the card shows one Close button; a gift asks nothing; no fitting Pokémon says what is wanted', () => {
    const read = phHonest(ph, honest({ readOnly: true }));
    expect(read).not.toContain('data-act="accept"');
    expect(read).toMatch(/data-act="back"[^>]*>Close</);
    const gift = phHonest(ph, honest({ gift: true, give: null }));
    expect(gift).toContain('Nothing asked in return');
    expect(gift).toContain('A gift');
    const none = phHonest(ph, honest({ give: null }));
    expect(none).toContain('Nothing in your party fits: a Bug-type');
    expect(none).toMatch(/class="blade on off"[^>]*data-act="accept"/);
    expect(none).toContain('I’m looking for a Bug-type.');
  });

  it('a hidden ability, a held item, a shiny and a trade evolution are all said; data is escaped', () => {
    const html = phHonest(ph, honest({ get: side('<b>Kadabra</b>', { hidden: true, held: 'Twisted Spoon', shiny: true, evolvesTo: 'Alakazam' }) }));
    for (const t of ['(Hidden)', 'Twisted Spoon', '✦', 'Evolves into Alakazam when traded']) expect(html).toContain(t);
    expect(html).not.toContain('<b>Kadabra</b>');
  });
});
