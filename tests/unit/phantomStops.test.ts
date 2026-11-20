import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phHeal, phReward, phShop, type PhHealModel, type PhShopModel } from '../../src/ui/phantom/screens/stops';
import type { RewardModel } from '../../src/ui/redux/screens/stops';

// The Phantom UI's stops of a run: the reward draft, the shop and the healing spot. Pure functions from a model to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const chip = (name: string, hp = 100) => ({ name, file: null, hp, level: 12, fainted: hp === 0 });

const reward = (over: Partial<RewardModel> = {}): RewardModel => ({
  title: 'Victory spoils', index: 1, party: [chip('Oshawott'), chip('Pidgey', 0)], buttons: ['Reroll (1)', 'Skip'], text: 'Take one.', result: null,
  cards: [{ name: 'Potion', kind: 'item', text: 'Heals 20 HP.', art: null, notes: [] }, { name: 'Lucky Egg', kind: 'held', text: 'More EXP.', art: null, notes: ['New!'] }, { name: '₽300', kind: 'money', text: 'Pocket money.', art: null, notes: [] }],
  ...over,
});

const shop = (over: Partial<PhShopModel> = {}): PhShopModel => ({
  title: 'Poké Mart', small: 'Kanto · Stage 2', chips: ['Morning'], money: 850, text: 'Welcome!', index: 0,
  rows: [{ label: 'Potion', price: 200, was: null, off: false, art: null }, { label: 'Great Ball', price: 480, was: 600, off: false, art: null }, { label: 'Revive', price: 1500, was: null, off: true, art: null }],
  lit: { name: 'Potion', owned: 2, pocket: 'Medicine', about: 'Heals 20 HP.', art: null },
  buy: [{ label: 'Buy 1', act: 'buy', on: true }, { label: 'Buy 5', act: 'buy5', on: false, dim: true }], extras: ['Sell'], basket: [], total: null,
  party: [chip('Oshawott', 40)], notes: ['Can use'], ask: null, hints: [['Enter', 'Buy']], keeper: null, clerk: null, ...over,
});

const heal = (over: Partial<PhHealModel> = {}): PhHealModel => ({
  title: 'Healing spot', small: 'Kanto · Stage 2', text: 'Your Pokémon were fully healed!',
  party: [{ file: null, name: 'Oshawott', from: 50, hp: '25/25' }, { file: null, name: 'Pidgey', from: 0, hp: '18/18' }, { file: null, name: 'Abra', from: 130, hp: '12/12' }], ...over,
});

describe('Phantom reward draft', () => {
  it('deals every reward as a card with one lit, keeps the run buttons and the team, and takes on a click', () => {
    const html = phReward(ph, reward());
    expect(pageOf(html)).toBe('reward');
    expect(count(html, 'class="rc ph-rw')).toBe(3);
    expect(count(html, 'class="rc ph-rw on')).toBe(1);
    expect(html).toMatch(/data-act="pick" data-arg="2" data-over="over"/);
    for (const t of ['Victory spoils', 'Potion', 'Lucky Egg', 'New!', 'Reroll (1)', 'Skip', 'Take one.']) expect(html).toContain(t);
    expect(count(html, 'class="gim ph-gim')).toBe(2);
    expect(html).not.toContain('ph-rw-res');
  });

  it('a button can be lit instead of a card, many rewards go slim, and a lone reward is "your prize"', () => {
    const onButton = phReward(ph, reward({ index: 4 }));
    expect(count(onButton, 'class="gim ph-gim on')).toBe(1);
    const many = phReward(ph, reward({ cards: Array.from({ length: 6 }, (_, k) => ({ name: `Gift ${k}`, kind: 'item', text: '', art: null, notes: [] })), index: 0 }));
    expect(count(many, /class="rc ph-rw(?: on)? slim/)).toBe(6);
    const one = reward({ cards: reward().cards.slice(0, 1), index: 0 });
    // The cut-out title is spelt letter by letter: the words differ, so the letter count does.
    expect(phReward(ph, one)).not.toBe(phReward(ph, reward({ index: 0 })));
  });

  it('what you got stays on its own page until an input, and its text is escaped', () => {
    const html = phReward(ph, reward({ result: ['You took the <b>Lucky Egg</b>.', '', 'Pidgey holds it.'] }));
    expect(html).toMatch(/class="ph-rw-res"[^>]*data-act="done"/);
    expect(html).toContain('Pidgey holds it.');
    expect(html).not.toContain('<b>Lucky Egg</b>');
    expect(count(html, '<p class="txt"></p>')).toBe(0);
  });
});

describe('Phantom shop', () => {
  it('lists the goods with the lit one, a sale price, a sold-out row, the wallet and the buy buttons', () => {
    const html = phShop(ph, shop());
    expect(pageOf(html)).toBe('shop');
    expect(count(html, 'class="it ph-bi ph-si')).toBe(3);
    expect(count(html, 'class="it ph-bi ph-si on')).toBe(1);
    expect(count(html, /class="it ph-bi ph-si[^"]* off"/)).toBe(1);
    for (const t of ['Poké Mart', 'Welcome!', 'Great Ball', '600', '480', '850', 'Heals 20 HP.', 'Buy 1', 'Sell', 'Morning']) expect(html).toContain(t);
    expect(html).toMatch(/class="blade on"[^>]*data-act="buy"/);
    expect(html).toMatch(/class="blade off"[^>]*data-act="buy5"/);
    expect(html).toMatch(/data-act="pick" data-arg="3" data-over="over"/);
  });

  it('an empty shelf says so, a basket lists its goods, and a question box sits on top', () => {
    const empty = phShop(ph, shop({ rows: [], lit: null, buy: [] }));
    expect(empty).toContain('Sold out');
    const depot = phShop(ph, shop({ basket: ['Potion ×2', 'Revive ×1'], total: 1900, ask: { title: 'Check out?', body: 'That comes to ₽1,900.', options: ['Pay', 'Not yet'], index: 0 } }));
    for (const t of ['Potion ×2', 'Revive ×1', 'Check out?', 'Pay', 'Not yet']) expect(depot).toContain(t);
    expect(depot).toMatch(/1,?900/);
  });

  it('text from data is escaped', () => {
    const html = phShop(ph, shop({ title: '<i>x</i>', text: '<b>hi</b>' }));
    expect(html).not.toContain('<i>x</i>');
    expect(html).not.toContain('<b>hi</b>');
  });
});

describe('Phantom healing spot', () => {
  it('gives each Pokémon a ball and an HP bar that fills from where it was, then ALL BETTER after the last one', () => {
    const html = phHeal(ph, heal());
    expect(pageOf(html)).toBe('heal');
    expect(count(html, 'class="hc-s"')).toBe(3);
    expect(html).toContain('--from:50%');
    expect(html).toContain('--from:0%');
    // A value outside 0–100 is clamped, never drawn past the bar.
    expect(html).toContain('--from:100%');
    expect(html).not.toContain('--from:130%');
    for (const t of ['Healing spot', 'Kanto · Stage 2', '25/25', '18/18']) expect(html).toContain(t);
    expect(html).toMatch(/class="hc-t" style="animation-delay:1\.44s"/);
  });

  it('the words stay until an input: the box and the key both call heal, and the text is escaped', () => {
    const html = phHeal(ph, heal({ text: 'Healed! <b>x</b>' }));
    expect(html).toMatch(/class="pn lt hc-say ph-hc-say tilt"[^>]*data-act="heal"/);
    expect(count(html, 'data-act="heal"')).toBe(2);
    expect(html).not.toContain('<b>x</b>');
    expect(phHeal(ph, heal({ party: [] }))).toContain('hc-row');
  });
});
