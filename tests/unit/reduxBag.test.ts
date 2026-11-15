import { describe, expect, it } from 'vitest';
import { bagAction, bagCols, bagCount, bagUseNote, bagView, type BagItem, type BagModel } from '../../src/ui/redux/screens/bag';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI Bag is a pure function from a model to HTML: pockets as tabs, the items as a list with a detail
// window (layout 0) or a grid of cells (layout 1), and the party strip under them.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const item = (i: number, over: Partial<BagItem> = {}): BagItem => ({ label: `Item ${i + 1}`, tag: `×${i + 1} · COMMON`, note: `Heals ${i} HP`, art: null, off: false, ...over });
const bag = (over: Partial<BagModel> = {}): BagModel => ({ title: 'Bag', hints: [['Enter', 'choose']], pockets: { labels: ['All', 'Medicine', 'Balls'], index: 0 }, n: 4, item: (i) => item(i), index: 0, strip: '<div id="strip"></div>', text: 'Choose an item.', ...over });
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI Bag', () => {
  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      const size = layout === 1 ? 14 : 6;
      // The list layout also has the action button in the detail window, which picks the focused item.
      const extra = layout === 1 ? 0 : 1;

      it('shows the pockets, every item of a short pocket, the party strip and the text box', () => {
        const html = bagView(ctx(layout), bag());
        expect(count(html, 'data-act="tab"')).toBe(3);
        expect(count(html, 'data-act="pick"')).toBe(4 + extra);
        for (let i = 0; i < 4; i++) expect(html).toContain(`data-act="pick" data-arg="${i}"`);
        expect(html).toContain('id="strip"');
        expect(html).toContain('Choose an item.');
        expect(html).toContain('×3');
        expect(html).not.toMatch(/\d+–\d+ of \d+/);
      });

      it('scrolls a long pocket with the focused item and says where it is', () => {
        const top = bagView(ctx(layout), bag({ n: 40, index: 0 }));
        expect(count(top, 'data-act="pick"')).toBe(size + extra);
        expect(top).toContain(`1–${size} of 40`);
        const end = bagView(ctx(layout), bag({ n: 40, index: 39 }));
        expect(end).toContain('data-arg="39"');
        expect(end).toContain('–40 of 40');
        expect(end).not.toContain('data-act="pick" data-arg="0"');
      });

      it('asks only for the items on screen', () => {
        const asked: number[] = [];
        bagView(ctx(layout), bag({ n: 500, index: 250, item: (i) => { asked.push(i); return item(i); } }));
        expect(new Set(asked).size).toBeLessThanOrEqual(size);
        expect(asked).toContain(250);
      });

      it('survives an empty pocket and a focus that is out of range', () => {
        const none = bagView(ctx(layout), bag({ n: 0, index: 3, item: () => { throw new Error('no item to ask for'); } }));
        expect(count(none, 'data-act="pick"')).toBe(0);
        expect(none).toContain('Nothing here yet');
        // The pockets stay, so the player can leave the empty one.
        expect(count(none, 'data-act="tab"')).toBe(3);
        expect(count(bagView(ctx(layout), bag({ index: 99 })), 'data-act="pick"')).toBe(4 + extra);
        expect(count(bagView(ctx(layout), bag({ index: -7 })), 'data-act="pick"')).toBe(4 + extra);
        expect(count(bagView(ctx(layout), bag({ pockets: null })), 'data-act="tab"')).toBe(0);
      });

      it('never lets an item name or a pocket name in as HTML', () => {
        const html = bagView(ctx(layout), bag({ pockets: { labels: ['<b>All</b>'], index: 0 }, item: (i) => item(i, { label: '<i>x</i>', note: 'a <u>b</u>' }) }));
        expect(html).not.toContain('<i>x</i>');
        expect(html).not.toContain('<b>All</b>');
        expect(html).not.toContain('<u>b</u>');
        expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
      });
    });
  }

  it('moves the cursor one column in the list and seven in the grid', () => {
    expect(bagCols(ctx(0))).toBe(1);
    expect(bagCols(ctx(1))).toBe(7);
  });

  it('names what Enter does on the detail window button, or shows a tag for an always-on item', () => {
    const view = (note: string): string => bagView(ctx(0), bag({ n: 1, item: (i) => item(i, { note }) }));
    expect(view('Heals 20 HP')).toContain('>Use<');
    expect(view('Not held · Raises Speed')).toContain('>Give<');
    expect(view('Not held · Raises Speed')).toContain('Raises Speed');
    expect(view('Held by Lucario · Raises Speed')).toContain('>Change holder<');
    const on = view('Always on · More credits');
    expect(on).toContain('<span class="tg">Always on</span>');
    expect(count(on, 'data-act="pick"')).toBe(1);
    const ball = bagView(ctx(0), bag({ n: 1, item: (i) => item(i, { note: 'Battle use · Catches Pokémon', off: true }) }));
    expect(ball).toContain('<span class="tg">Battle use</span>');
    expect(ball).not.toContain('>Use<');
  });

  it('dims an item that cannot be used', () => {
    expect(bagView(ctx(0), bag({ n: 1, item: (i) => item(i, { off: true }) }))).toContain('opacity:.55');
    expect(bagView(ctx(1), bag({ n: 1, item: (i) => item(i, { off: true }) }))).toContain('cell sel off');
  });
});

describe('New UI Bag helpers', () => {
  it('reads the action from the first words of the note', () => {
    expect(bagAction('Held by Gengar · x')).toBe('Change holder');
    expect(bagAction('held by Gengar')).toBe('Change holder');
    expect(bagAction('Not held · x')).toBe('Give');
    expect(bagAction('Always on · x')).toBe('');
    expect(bagAction('Working now')).toBe('');
    expect(bagAction('')).toBe('Use');
    expect(bagAction('It is not held by anyone')).toBe('Use');
    // A battle-only item has no button while it cannot be chosen; if it can be (cashed in), Enter still does something.
    expect(bagAction('Battle use · Catches Pokémon', true)).toBe('');
    expect(bagAction('Battle use · Catches Pokémon', false)).toBe('Use');
    expect(bagAction('Usable · Restores 20 HP', true)).toBe('Use');
  });

  it('finds the count in a tag, and nothing when there is none', () => {
    expect(bagCount('×2 · RARE')).toBe('×2');
    expect(bagCount('RARE · x12')).toBe('x12');
    expect(bagCount('RARE')).toBe('');
    expect(bagCount('')).toBe('');
    expect(bagCount('xtra · big')).toBe('');
  });

  it('says who an item would help', () => {
    expect(bagUseNote(1, true, null, 20)).toBe('Holds it');
    expect(bagUseNote(3, false, null, 20)).toBe('Holds 3');
    expect(bagUseNote(0, false, null, 20)).toBe('');
    expect(bagUseNote(0, true, null, 20)).toBe('Can use');
    expect(bagUseNote(0, true, 'HP is full', 20)).toBe('No effect');
    expect(bagUseNote(0, true, 'It has fainted', 0)).toBe('Fainted');
    // A revive on a fainted Pokémon has no problem, so it can be used.
    expect(bagUseNote(0, true, null, 0)).toBe('Can use');
  });
});
