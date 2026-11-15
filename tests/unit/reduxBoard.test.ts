import { describe, expect, it } from 'vitest';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { boardProgress, boardSize, boardView, type BoardModel, type BoardRow } from '../../src/ui/redux/templates';

// The mock-ups' board (quests, chains, tasks): rows with a progress bar and a state tag, in two layouts.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const rows = (n: number): BoardRow[] => Array.from({ length: n }, (_, i) => ({ title: `Quest ${i + 1}`, sub: `${i} of ${n}`, tag: i % 2 ? 'Active' : 'New', pct: i * 10 }));
const model = (over: Partial<BoardModel> = {}): BoardModel => ({ title: 'Quest Log', area: 'hub', rows: rows(3), index: 0, text: 'Every quest chain in one list.', ...over });
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('New UI board (quest list)', () => {
  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      const size = boardSize(ctx(layout));

      it('shows a short list whole, with its text box and no position counter', () => {
        const html = boardView(ctx(layout), model());
        expect(count(html, 'data-act="pick"')).toBe(3);
        for (const t of ['Quest Log', 'Quest 1', 'Quest 3', 'Every quest chain in one list.']) expect(html).toContain(t);
        // The counter reads "1–3 of 3"; a row's own text ("2 of 3") is not a counter.
        expect(html).not.toMatch(/\d+–\d+ of \d+/);
      });

      it('scrolls a long list with the focused row and says where it is', () => {
        const top = boardView(ctx(layout), model({ rows: rows(20), index: 0 }));
        expect(count(top, 'data-act="pick"')).toBe(size);
        expect(top).toContain(`1–${size} of 20`);
        expect(top).toContain('Quest 1<');
        const end = boardView(ctx(layout), model({ rows: rows(20), index: 19 }));
        expect(end).toContain('Quest 20');
        expect(end).toContain(`${20 - size + 1}–20 of 20`);
        expect(end).not.toContain('Quest 1<');
        // The click on a row reports its place in the whole list, not on the screen.
        expect(end).toContain('data-act="pick" data-arg="19"');
      });

      it('survives an empty list and a focus that is out of range', () => {
        const none = boardView(ctx(layout), model({ rows: [], index: 4 }));
        expect(count(none, 'data-act="pick"')).toBe(0);
        expect(none).toContain('Nothing here yet');
        const far = boardView(ctx(layout), model({ rows: rows(3), index: 99 }));
        expect(count(far, 'data-act="pick"')).toBe(3);
        expect(count(boardView(ctx(layout), model({ rows: rows(3), index: -5 })), 'data-act="pick"')).toBe(3);
      });

      it('keeps a bar between empty and full, leaves it out when there is no progress, and never lets text in as HTML', () => {
        const html = boardView(ctx(layout), model({ rows: [{ title: '<i>x</i>', sub: 'a & b', tag: 'Done', pct: 250 }, { title: 'No bar', sub: '', pct: null }, { title: 'Below', sub: '', pct: -40 }] }));
        expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
        expect(html).not.toContain('<i>x</i>');
        expect(html).toContain('width:100%');
        expect(html).toContain('width:0%');
        expect(html).not.toMatch(/width:-|width:250/);
        expect(count(html, 'class="hp')).toBe(2);
      });
    });
  }
});

describe('New UI board progress from a count tag', () => {
  it('reads a fraction or a percentage as a bar, a state and a count in words', () => {
    expect(boardProgress('0/5')).toEqual({ pct: 0, state: 'New', count: '0 of 5' });
    expect(boardProgress('2/5')).toEqual({ pct: 40, state: 'Active', count: '2 of 5' });
    expect(boardProgress('5 of 5')).toEqual({ pct: 100, state: 'Done', count: '5 of 5' });
    expect(boardProgress(' 37% ')).toEqual({ pct: 37, state: 'Active', count: '37%' });
    expect(boardProgress('100%')).toEqual({ pct: 100, state: 'Done', count: '100%' });
  });

  it('keeps the bar inside its ends when the count runs over', () => {
    expect(boardProgress('7/5')).toEqual({ pct: 100, state: 'Done', count: '7 of 5' });
    expect(boardProgress('250%')).toEqual({ pct: 100, state: 'Done', count: '100%' });
    // One of 300 is started, even though the bar rounds to nothing.
    expect(boardProgress('1/300')).toEqual({ pct: 0, state: 'Active', count: '1 of 300' });
  });

  it('leaves every other tag alone', () => {
    for (const t of ['', 'Claim', 'Lv 5', '3/0', '2/5 done', 'x 3', '1/2/3', '-1/5']) expect(boardProgress(t)).toBeNull();
  });
});
