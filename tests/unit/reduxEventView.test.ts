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

describe('New UI event screen: a department store floor (mock-up `store`)', () => {
  const chip = (name: string) => ({ name, file: null, hp: 100, level: 20, fainted: false });
  const store = (over: Partial<NonNullable<EventModel['store']>> = {}): NonNullable<EventModel['store']> => ({
    title: 'Celadon Dept. Store', clerk: 'Clerk',
    floors: [{ tag: '5F', name: 'Evolution Stones', on: true }, { tag: '4F', name: 'The Wise Man', on: false }, { tag: '1F', name: 'Lift and service', on: false }],
    party: [chip('Eevee'), chip('Pidgey')], notes: [['Can evolve', ''], ['', ''], ['', '']], ...over,
  });
  const goods = [choice('Fire Stone (₽3,000)'), { ...choice('Water Stone (₽3,000)'), locked: true, sub: 'Needs ₽3,000' }, choice('Back to the lift.')];
  const floor = (over: Partial<EventModel> = {}): EventModel => model({ name: 'Celadon Department Store: Evolution Stones', lines: [{ who: null, text: 'Fifth floor: one of each Kanto stone on velvet.' }], choices: goods, store: store(), ...over });

  it('shows the store header, the coins, every floor with this one lit, and each good with its price at the right', () => {
    for (const layout of [0, 1, 2, 3]) {
      const html = eventView(ctx(layout), floor());
      expect(html).toContain('Celadon Dept. Store');
      expect(html).toContain('₽ 2,450');
      for (const t of ['5F', 'Evolution Stones', '4F', 'The Wise Man', '1F', 'Lift and service']) expect(html).toContain(t);
      expect(count(html, 'class="btn on" style="height:44px;cursor:default"')).toBe(1);
      expect(html).toContain('>Fire Stone</span><span>₽ 3,000</span>');
      expect(html).not.toContain('(₽3,000)');
      expect(html).toContain('Back to the lift.');
      expect(count(html, 'data-act="pick"')).toBe(3);
      expect(html).toContain('<span class="nm">Clerk</span>');
      expect(html).toContain('Fifth floor: one of each Kanto stone on velvet.');
    }
  });
  it('the party strip says who the good under the cursor helps', () => {
    expect(eventView(ctx(0), floor({ index: 0 }))).toContain('Can evolve');
    expect(eventView(ctx(0), floor({ index: 2 }))).not.toContain('Can evolve');
    for (const n of ['Eevee', 'Pidgey']) expect(eventView(ctx(0), floor())).toContain(n);
  });
  it('a good the player cannot pay for is dimmed, and the text box says why while the cursor is on it', () => {
    const html = eventView(ctx(0), floor({ index: 1 }));
    expect(count(html, 'opacity:.5')).toBe(1);
    expect(html).toContain('Needs ₽3,000');
    expect(eventView(ctx(0), floor({ index: 0 }))).not.toContain('Needs ₽3,000');
  });
  it('the goods wait for the last page of text; a speaker on the page takes the name tab', () => {
    const html = eventView(ctx(0), floor({ page: { at: 0, of: 2 }, lines: [{ who: 'Miss Philippa Stott', text: 'Fifth! Rocks at silly prices.' }], speaker: 'Miss Philippa Stott' }));
    expect(html).not.toContain('Fire Stone');
    expect(html).toContain('data-act="page"');
    expect(html).toContain('<span class="nm">Miss Philippa Stott</span>');
    expect(html).toContain('1/2');
  });
  it('after buying, one Continue row stands where the goods were, and the changes show once the text is read', () => {
    const text = eventView(ctx(0), floor({ outcome: { step: 'text', ok: true, changes: ['−₽3,000', 'Fire Stone ×1'], next: 'Continue' }, lines: [{ who: null, text: 'It glows a little in the shade of your hand.' }] }));
    expect(text).not.toContain('Water Stone');
    expect(text).toContain('Continue');
    expect(text).not.toContain('>Outcome<');
    expect(text).not.toContain('Can evolve');
    const rewards = eventView(ctx(0), floor({ outcome: { step: 'rewards', ok: true, changes: ['−₽3,000', 'Fire Stone ×1'], next: 'Continue' } }));
    expect(rewards).toContain('>Outcome<');
    expect(rewards).toContain('Fire Stone');
  });
  it('seven floors and seven choices still fit (shorter rows)', () => {
    const many = eventView(ctx(0), floor({ choices: Array.from({ length: 7 }, (_, k) => choice(`Good ${k} (₽${k}00)`)), store: store({ floors: Array.from({ length: 7 }, (_, k) => ({ tag: `${k}F`, name: `Floor ${k}`, on: k === 0 })), notes: [] }) }));
    expect(count(many, 'height:38px;cursor:default')).toBe(7);
    expect(count(many, 'height:36px;')).toBe(7);
  });
  it('never injects text as HTML', () => {
    const html = eventView(ctx(0), floor({ choices: [choice('<b>x</b> (₽100)')], store: store({ title: '<i>t</i>', clerk: '<u>c</u>', floors: [{ tag: '<s>f</s>', name: '<em>n</em>', on: true }], party: [chip('<p>m</p>')], notes: [['<q>z</q>']] }) }));
    for (const bit of ['<b>x</b>', '<i>t</i>', '<u>c</u>', '<s>f</s>', '<em>n</em>', '<p>m</p>', '<q>z</q>']) expect(html).not.toContain(bit);
  });
  it('an event with no store draws as before', () => {
    expect(eventView(ctx(0), model())).not.toContain('Dept. Store');
    expect(eventView(ctx(0), model({ store: null }))).toBe(eventView(ctx(0), model()));
  });
});

describe('Stand With Them code-name card', () => {
  const card = { name: 'House Card', rank: 'Specialist', facts: [['Code name', 'Provisional Agent 000'], ['Team', 'Team Rocket, Kanto']] as [string, string][], trainer: null, badges: 2 };
  const out = (step: 'text' | 'rewards') => ({ step, ok: true, changes: ['Joined Team Rocket'], next: 'Continue' });
  it('the joining outcome is read on the card, and a click turns it like the outcome page', () => {
    const html = eventView(ctx(0), model({ codeCard: card, outcome: out('text'), lines: [{ who: null, text: 'Giovanni names you Provisional Agent 000.' }] }));
    for (const bit of ['Code Name', 'House Card', 'Specialist', 'Provisional Agent 000', 'Team Rocket, Kanto', 'Giovanni names you']) expect(html).toContain(bit);
    expect(html).toContain('data-act="next"');
    expect(html).not.toContain('data-act="back"');
  });
  it('the rewards step and the choices are the plain event page', () => {
    expect(eventView(ctx(0), model({ codeCard: card, outcome: out('rewards') }))).not.toContain('House Card');
    expect(eventView(ctx(0), model({ codeCard: card }))).not.toContain('House Card');
  });
});
