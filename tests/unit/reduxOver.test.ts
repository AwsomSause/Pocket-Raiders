import { describe, expect, it } from 'vitest';
import { cutBeat, cutView, CUT_BEATS, type CutModel } from '../../src/ui/redux/screens/cut';
import { overView, reportPages, reportView, runCardView, type OverModel, type RunCardModel } from '../../src/ui/redux/screens/over';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI run end: the defeat and victory page, the run card, the full report and the cutscene card that
// "Witness the Rest" uses. All pure functions from a model to HTML.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const team = (down: boolean[]): OverModel['team'] => down.map((d, i) => ({ file: `pokemon/${i + 1}`, name: `Mon ${i + 1}`, down: d }));
const over = (o: Partial<OverModel> = {}): OverModel => ({ win: false, title: 'RUN OVER', sub: 'Fell in Kanto · Gym Leader Misty', facts: [['Battles won', '74'], ['Seed', 'ABC']], payouts: [['Bank Credits', '+ 1,240']], team: team([true, false, true]), buttons: ['Witness the rest', 'Run card', 'Back to Hub'], index: 0, extras: [['Tab', 'full report', 'report'], ['F', 'final team', 'team']], backdrop: null, poked: null, ...o });

describe('New UI run end page', () => {
  for (const layout of [0, 1]) {
    it(`layout ${layout}: shows the title, both windows, the party and the buttons`, () => {
      const html = overView(ctx(layout), over());
      for (const t of ['RUN OVER', 'Fell in Kanto · Gym Leader Misty', 'Battles won', '74', 'Payouts', '+ 1,240', 'Witness the rest', 'Run card', 'Back to Hub']) expect(html).toContain(t);
      expect(count(html, 'data-act="pick"')).toBe(3);
      expect(count(html, 'data-act="poke"')).toBe(3);
      expect(count(html, 'data-act="report"')).toBe(3);
      expect(html).toContain('data-act="team"');
      expect(html).toContain(layout ? 'left:24px;right:24px;top:150px' : 'left:120px;right:120px;top:150px');
    });
  }

  it('lights the focused button only', () => {
    const html = overView(ctx(0), over({ index: 2 }));
    expect(count(html, 'class="btn on"')).toBe(1);
    expect(html).toMatch(/class="btn on"[^>]*data-arg="2"/);
  });

  it('a loss turns the fallen into silhouettes while someone still stands; a wiped team stays recognisable', () => {
    expect(count(overView(ctx(0), over()), 'class="sil"')).toBe(2);
    const wiped = overView(ctx(0), over({ team: team([true, true, true]) }));
    expect(count(wiped, 'class="sil"')).toBe(0);
    expect(count(wiped, 'grayscale')).toBe(3);
  });

  it('a win shows the burst, the whole party in colour and the accent title', () => {
    const html = overView(ctx(0), over({ win: true, title: 'CHAMPION!', team: team([true, false]) }));
    expect(html).toContain('class="burst"');
    expect(html).toContain('class="acc">CHAMPION!');
    expect(count(html, 'class="sil"')).toBe(0);
    expect(count(html, 'grayscale')).toBe(0);
    expect(overView(ctx(0), over())).not.toContain('class="burst"');
  });

  it('shows a reaction over the tapped Pokémon only', () => {
    expect(count(overView(ctx(0), over({ poked: 1 })), 'rx-pop')).toBe(1);
    expect(count(overView(ctx(0), over({ poked: null })), 'rx-pop')).toBe(0);
    expect(count(overView(ctx(0), over({ poked: 9 })), 'rx-pop')).toBe(0);
  });

  it('survives no party, no extras and a missing picture, and never lets text in as HTML', () => {
    const html = overView(ctx(0), over({ team: [{ file: null, name: '<b>x</b>', down: false }], extras: [], sub: '<i>sub</i>', facts: [['<u>a</u>', '1']] }));
    expect(html).not.toContain('<b>x</b>');
    expect(html).not.toContain('<i>sub</i>');
    expect(html).not.toContain('<u>a</u>');
    expect(html).not.toContain('class="keys"');
    expect(count(overView(ctx(0), over({ team: [] })), 'data-act="poke"')).toBe(0);
  });
});

const card = (o: Partial<RunCardModel> = {}): RunCardModel => ({ title: 'Run card', name: 'Run 128', rank: 'Win', facts: [['Result', 'Champion'], ['Trainer', 'Red']], trainer: null, badges: 5, team: ['pokemon/6', null, 'pokemon/94', 'pokemon/130'], text: 'Saved as a PNG you can share.', hints: [['Enter', 'save']], ...o });

describe('New UI run card', () => {
  it('shows the name, the result tag, the facts and eight badge discs with the won ones lit', () => {
    const html = runCardView(ctx(0), card());
    for (const t of ['Run card', 'Run 128', 'Win', 'Champion', 'Saved as a PNG you can share.']) expect(html).toContain(t);
    expect(count(html, 'border-radius:50%')).toBe(8);
    expect(count(html, 'background:var(--p2);box-shadow')).toBe(3);
    expect(html).toContain('data-act="save"');
  });

  it('keeps the discs between none and eight', () => {
    expect(count(runCardView(ctx(0), card({ badges: 40 })), 'background:var(--p2);box-shadow')).toBe(0);
    expect(count(runCardView(ctx(0), card({ badges: -3 })), 'background:var(--p2);box-shadow')).toBe(8);
  });

  it('the wide layout adds up to three of the team beside the card', () => {
    expect(runCardView(ctx(1), card())).toContain('left:60px;right:60px');
    expect(runCardView(ctx(0), card())).toContain('left:150px;right:150px');
  });
});

describe('New UI full report paging', () => {
  it('keeps a short report on one page and drops blank lines at the ends', () => {
    expect(reportPages(['', 'a', 'b', '', ''])).toEqual([['a', 'b']]);
    expect(reportPages([])).toEqual([]);
    expect(reportPages(['', ' ', ''])).toEqual([]);
  });

  it('never loses or reorders a line, and never puts more rows on a page than fit', () => {
    const lines = Array.from({ length: 53 }, (_, i) => (i % 9 === 4 ? '' : `Line ${i} ${'x'.repeat((i * 37) % 200)}`));
    const pages = reportPages(lines, 10, 40);
    expect(pages.flat().filter((t) => t.trim())).toEqual(lines.filter((t) => t.trim()));
    for (const p of pages) {
      expect(p[0]!.trim()).not.toBe('');
      expect(p[p.length - 1]!.trim()).not.toBe('');
      const rows = p.reduce((n, t) => n + Math.max(1, Math.ceil(t.length / 40)), 0);
      // A page holds at most ten rows, unless a single line is longer than a whole page.
      if (p.length > 1) expect(rows).toBeLessThanOrEqual(10);
    }
  });

  it('moves a heading on with the lines it heads', () => {
    const pages = reportPages(['a', 'b', 'c', 'Run timeline:', 'first', 'second'], 4, 40);
    expect(pages).toEqual([['a', 'b', 'c'], ['Run timeline:', 'first', 'second']]);
    // A heading with nothing under it is still kept.
    expect(reportPages(['a', 'b', 'c', 'd', 'Alone:'], 4, 40).flat()).toContain('Alone:');
  });

  it('gives a line longer than a page its own page', () => {
    const long = 'y'.repeat(500);
    expect(reportPages(['a', long, 'b'], 4, 40)).toEqual([['a'], [long], ['b']]);
  });

  it('draws one page with where the reader is, and stays inside the pages', () => {
    const pages = [['One'], ['Two'], ['Three:']];
    const first = reportView(ctx(0), { title: 'Full report', pages, page: 0 });
    expect(first).toContain('One');
    expect(first).toContain('1 / 3');
    expect(first).toContain('next page');
    const last = reportView(ctx(0), { title: 'Full report', pages, page: 99 });
    expect(last).toContain('Three:');
    expect(last).toContain('3 / 3');
    expect(last).not.toContain('next page');
    expect(reportView(ctx(0), { title: 'Full report', pages, page: -4 })).toContain('One');
    expect(reportView(ctx(0), { title: 'Empty', pages: [], page: 0 })).toContain('Empty');
    expect(reportView(ctx(0), { title: 'T', pages: [['<b>x</b>']], page: 0 })).not.toContain('<b>x</b>');
  });
});

const cut = (o: Partial<CutModel> = {}): CutModel => ({ name: 'Kieran', role: 'Rival', line: 'You stopped at stage 14. I kept going.', cast: null, backdrop: null, beat: 4, ...o });

describe('New UI cutscene card', () => {
  for (const layout of [0, 1, 2]) {
    it(`layout ${layout}: shows the speaker, the plate, the line in quotes, the beat strip and the skip hint`, () => {
      const html = cutView(ctx(layout), cut());
      for (const t of ['Kieran', 'Rival', '“You stopped at stage 14. I kept going.”', 'Transition', '<kbd>Esc</kbd>skip', 'data-act="next"']) expect(html).toContain(t);
      expect(count(html, 'class="bars"')).toBe(2);
      expect(count(html, '<i class="on">')).toBe(5);
    });

    it(`layout ${layout}: leaves the plate out without a role, takes its own key hint, and escapes text`, () => {
      const html = cutView(ctx(layout), cut({ role: '', name: '<b>N</b>', line: 'a <i>b</i>', skip: ['Esc', 'credits'], beat: 0 }));
      expect(html).not.toContain('class="plate"');
      expect(html).not.toContain('<b>N</b>');
      expect(html).not.toContain('<i>b</i>');
      expect(html).toContain('<kbd>Esc</kbd>credits');
      expect(count(html, '<i class="on">')).toBe(1);
      expect(html).toContain(CUT_BEATS[0]);
    });
  }

  it('keeps the beat between the first and the last', () => {
    expect(cutView(ctx(0), cut({ beat: 99 }))).toContain('Transition');
    expect(cutView(ctx(0), cut({ beat: -3 }))).toContain('Situation');
  });

  it('fills the strip from the first card to the last', () => {
    expect(cutBeat(0, 1)).toBe(4);
    expect(cutBeat(0, 5)).toBe(0);
    expect(cutBeat(4, 5)).toBe(4);
    expect(cutBeat(1, 3)).toBe(2);
    expect(cutBeat(0, 2)).toBe(0);
    expect(cutBeat(1, 2)).toBe(4);
    expect(cutBeat(9, 3)).toBe(4);
    expect(cutBeat(-2, 3)).toBe(0);
    expect(cutBeat(0, 0)).toBe(4);
  });
});

describe('the card page as the hub Trainer Card', () => {
  it('takes the hub band and cannot be saved: no save click, the click beside it still goes back', () => {
    const html = runCardView(ctx(0), card({ title: 'Trainer Card', area: 'hub', save: false }));
    expect(html).toContain('--c:#3d8bea');
    expect(html).not.toContain('data-act="save"');
    expect(html).toContain('data-act="back"');
    expect(html).toContain('Trainer Card');
  });
  it('the run card keeps its gold band and its save click', () => {
    const html = runCardView(ctx(0), card());
    expect(html).toContain('--c:#b8862a');
    expect(html).toContain('data-act="save"');
  });
});
