import { describe, expect, it } from 'vitest';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { counterStop, counterView, type CounterModel } from '../../src/ui/redux/screens/counter';

// The New UI's Exchange Counter (the mock-ups' counter page with a clerk), in both layouts.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const model = (over: Partial<CounterModel> = {}): CounterModel => ({
  title: 'Exchange Counter', clerk: 'Counter clerk', chips: ['450 credits', '60 Research'],
  offers: [
    { name: 'Research Points', price: '100 credits', art: null, have: 'You have 60 Research Points', text: '100 credits buy 25 Research Points a lot.', problems: [null, 'You need 500 Bank Credits (you have 450).'] },
    { name: 'Bank Credits', price: '50 Research Points', art: null, have: 'You have 450 Bank Credits', text: '50 Research Points buy 10 credits a lot.', problems: [null, 'You need 250 Research Points (you have 60).'] },
  ],
  buttons: ['Exchange 1', 'Exchange 5'], index: 0, text: 'Trade Bank Credits and Research Points, one lot or five at a time.', ...over,
});
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI Exchange Counter', () => {
  it('numbers the cursor stops offer by offer, one per button', () => {
    expect([counterStop(0, 0, 2), counterStop(0, 1, 2), counterStop(1, 0, 2), counterStop(1, 1, 2)]).toEqual([0, 1, 2, 3]);
  });

  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      it('shows both offers with their prices, what the player holds, the two buttons and the clerk', () => {
        const html = counterView(ctx(layout), model());
        for (const t of ['Exchange Counter', 'Research Points', '100 credits', 'Bank Credits', '50 Research Points', '450 credits', '60 Research', 'You have 60 Research Points', 'Exchange 1', 'Exchange 5', 'Counter clerk', 'one lot or five at a time']) expect(html).toContain(t);
        // The focused offer's two buttons are stops 0 and 1; the other offer is one click target.
        expect(html).toContain('data-act="pick" data-arg="0"');
        expect(html).toContain('data-act="pick" data-arg="1"');
        expect(html).toContain('data-act="pick" data-arg="2"');
        expect(html).not.toContain('data-arg="3"');
      });

      it('the cursor on the second offer shows its card, and its second button is lit', () => {
        const html = counterView(ctx(layout), model({ index: 3 }));
        expect(html).toContain('You have 450 Bank Credits');
        expect(html).not.toContain('You have 60 Research Points');
        expect(html).toMatch(/class="btn on"[^>]*data-arg="3"[^>]*>Exchange 5/);
        expect(html).toMatch(/class="btn"[^>]*data-arg="2"[^>]*>Exchange 1/);
      });

      it('a button that cannot be pressed is dimmed, and the others are not', () => {
        const html = counterView(ctx(layout), model());
        expect(html).toMatch(/opacity:\.45"[^>]*>Exchange 5/);
        expect(html).not.toMatch(/opacity:\.45"[^>]*>Exchange 1/);
      });

      it('survives a cursor out of range and an empty counter', () => {
        expect(counterView(ctx(layout), model({ index: 99 }))).toContain('You have 450 Bank Credits');
        expect(counterView(ctx(layout), model({ index: -4 }))).toContain('You have 60 Research Points');
        const none = counterView(ctx(layout), model({ offers: [] }));
        expect(none).toContain('Nothing here yet');
        expect(count(none, 'data-act="pick"')).toBe(0);
      });

      it('never lets text in as HTML', () => {
        const html = counterView(ctx(layout), model({ text: '<b>x</b> & y', chips: ['<i>1</i>'] }));
        expect(html).toContain('&lt;b&gt;x&lt;/b&gt; &amp; y');
        expect(html).not.toContain('<i>1</i>');
      });
    });
  }
});
