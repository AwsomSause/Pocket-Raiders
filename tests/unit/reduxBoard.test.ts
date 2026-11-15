import { describe, expect, it } from 'vitest';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { boardProgress, boardSize, boardView, gridStart, menuView, type BoardModel, type BoardRow } from '../../src/ui/redux/templates';

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

      it('keeps the last row on screen when the list has an uneven number of rows', () => {
        for (const n of [7, 9, 21]) {
          const end = boardView(ctx(layout), model({ rows: rows(n), index: n - 1 }));
          expect(end).toContain(`data-act="pick" data-arg="${n - 1}"`);
          expect(end).toContain(`–${n} of ${n}`);
        }
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

describe('New UI grid scrolling', () => {
  it('starts on a row boundary and always holds the focused cell', () => {
    for (const [cols, size] of [[2, 6], [2, 8], [7, 14]] as const) {
      for (const n of [1, 2, 7, 13, 15, 21, 40, 41]) {
        for (let index = 0; index < n; index++) {
          const s = gridStart(n, index, size, cols);
          expect(s % cols).toBe(0);
          expect(s).toBeGreaterThanOrEqual(0);
          expect(index).toBeGreaterThanOrEqual(s);
          expect(index).toBeLessThan(s + size);
        }
      }
    }
  });

  it('shows the last card of a two-column menu with an uneven number of rows', () => {
    const items = Array.from({ length: 11 }, (_, i) => ({ label: `Room ${i + 1}` }));
    const html = menuView(ctx(1), { title: 'Menu', items, index: 10 });
    expect(html).toContain('Room 11');
    expect(html).toContain('data-act="pick" data-arg="10"');
    expect(html).toContain('–11 of 11');
  });
});

describe('New UI board with a long text box', () => {
  const rows6: BoardRow[] = Array.from({ length: 6 }, (_, i) => ({ title: `Row ${i + 1}`, sub: 'x' }));
  const long = 'Affection 40 · Respect 40 · Sync 15 · Confidence 50 · Will 30 · Strain 0. Steady: it follows your lead. Protective: Guards its team like a wall. It drags its tail through puddles. Quirk, Stage Fright: Nervous before bosses, then fierce.';
  const shown = (html: string): number => html.split('data-act="pick"').length - 1;
  const at = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });

  it('the one-column list shows one row fewer under a text box of three lines or more, so no row hides under it', () => {
    expect(shown(boardView(at(0), { title: 'Bonds', area: 'party', rows: rows6, index: 0, text: 'Short.' }))).toBe(5);
    expect(shown(boardView(at(0), { title: 'Bonds', area: 'party', rows: rows6, index: 0, text: long }))).toBe(4);
    // The focused row is still on screen at the end of the list.
    const end = boardView(at(0), { title: 'Bonds', area: 'party', rows: rows6, index: 5, text: long });
    expect(end).toContain('Row 6');
    expect(shown(end)).toBe(4);
  });

  it('the two-column layout keeps its six cards (they end well above the text box)', () => {
    expect(shown(boardView(at(1), { title: 'Bonds', area: 'party', rows: rows6, index: 0, text: long }))).toBe(6);
  });
});
