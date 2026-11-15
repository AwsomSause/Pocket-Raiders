import { describe, expect, it } from 'vitest';
import { eventView, type EventModel } from '../../src/ui/redux/screens/event';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI event screen is a pure function from a model to HTML, so its rules can be checked without a browser:
// every layout shows every choice, choices wait for the last page of text, and text is never injected as HTML.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const choice = (label: string) => ({ label, sub: 'Certain outcome', chance: '', locked: false });
const model = (over: Partial<EventModel> = {}): EventModel => ({
  name: 'Pokémon Center', tag: 'Map stops · Common', lines: [{ who: null, text: 'A small Pokémon Center.' }], speaker: null, page: { at: 0, of: 1 },
  art: null, tint: null, fx: null, cast: null, mon: null, choices: [choice('Heal.'), choice('Shop.')], index: 0, money: 2450, outcome: null, pick: null, countdown: '', timer: null, ...over,
});
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI event screen', () => {
  for (const layout of [0, 1, 2, 3]) {
    describe(`layout ${layout}`, () => {
      it('shows every choice, however many there are', () => {
        const html = eventView(ctx(layout), model({ choices: ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((l) => choice(`Option ${l}`)) }));
        expect(count(html, 'data-act="pick"')).toBe(7);
        for (const l of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) expect(html).toContain(`Option ${l}`);
      });

      it('lets a long choice label wrap inside its button, and leaves short labels as they are', () => {
        const long = 'Tell him the truth about the midnight clock, all of it, gently, and stay until he has heard every word.';
        const short = eventView(ctx(layout), model());
        const html = eventView(ctx(layout), model({ choices: [choice('Heal.'), choice(long)] }));
        expect(html).toContain(long);
        // The card layout (3) wraps by itself; the button layouts switch wrapping on only for the long label.
        if (layout !== 3) {
          expect(short).not.toContain('white-space:normal');
          expect(count(html, 'white-space:normal')).toBe(1);
        }
      });

      it('holds the choices back while pages of text remain, and turns the page on a click anywhere', () => {
        const html = eventView(ctx(layout), model({ page: { at: 0, of: 3 } }));
        expect(count(html, 'data-act="pick"')).toBe(0);
        expect(count(html, 'data-act="page"')).toBe(1);
        expect(html).toContain('1/3');
        expect(html).not.toContain('Heal.');
        const last = eventView(ctx(layout), model({ page: { at: 2, of: 3 } }));
        expect(count(last, 'data-act="pick"')).toBe(2);
        expect(count(last, 'data-act="page"')).toBe(0);
        expect(last).toContain('3/3');
      });

      it('names the speaker and never lets text in as HTML', () => {
        const html = eventView(ctx(layout), model({ lines: [{ who: 'Blue', text: '<img src=x onerror=1> Smell ya later!' }, { who: null, text: 'He leaves.' }], speaker: 'Blue' }));
        expect(html).toContain('Blue');
        expect(html).toContain('&lt;img src=x onerror=1&gt; Smell ya later!');
        expect(html).not.toContain('<img src=x');
        expect(html).toContain('He leaves.');
      });

      it('shows the outcome text first and the results only in the results step', () => {
        const text = eventView(ctx(layout), model({ outcome: { step: 'text', ok: true, changes: ['+₽300', 'Charisma +2'], next: 'Continue' }, lines: [{ who: null, text: 'Everyone is healed.' }] }));
        expect(text).toContain('Everyone is healed.');
        expect(text).not.toContain('Outcome');
        expect(count(text, 'data-act="next"')).toBe(1);
        expect(count(text, 'data-act="pick"')).toBe(0);
        const paged = eventView(ctx(layout), model({ outcome: { step: 'text', ok: true, changes: ['+₽300'], next: 'Continue' }, page: { at: 0, of: 2 } }));
        expect(paged).not.toContain('Outcome');
        const results = eventView(ctx(layout), model({ outcome: { step: 'rewards', ok: true, changes: ['+₽300', 'Charisma +2'], next: 'Continue' } }));
        expect(results).toContain('Outcome');
        expect(results).toContain('+₽300');
        expect(results).toContain('Charisma');
      });

      it('draws the standing panel with its rank and at most three meters', () => {
        expect(eventView(ctx(layout), model())).not.toContain('Standing');
        const meters = ['Trust', 'Respect', 'Wins', 'Extra'].map((label, i) => ({ label, value: i + 1, max: 10 }));
        const html = eventView(ctx(layout), model({ standing: { rank: 'Friendly Rival', meters } }));
        expect(html).toContain('Friendly Rival');
        for (const l of ['Trust', 'Respect', 'Wins']) expect(html).toContain(l);
        expect(html).not.toContain('Extra');
        expect(html).toContain('2/10');
        // A meter never draws past full or below empty, and a zero maximum is not a division by zero.
        const odd = eventView(ctx(layout), model({ standing: { rank: 'R', meters: [{ label: 'Over', value: 15, max: 10 }, { label: 'Zero', value: 3, max: 0 }, { label: 'Neg', value: -2, max: 10 }] } }));
        expect(odd).toContain('width:100%');
        expect(odd).not.toContain('NaN');
        expect(odd).not.toContain('Infinity');
        expect(odd).not.toMatch(/width:-/);
      });
    });
  }
});
