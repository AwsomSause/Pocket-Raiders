import { describe, expect, it } from 'vitest';
import { bookRows, bookView, dossierView, DOSSIER_ROWS, leadLine, listWindow, pyramidFace, reportView, trackView, type BookModel, type DossierModel, type ReportModel, type TrackModel } from '../../src/ui/redux/screens/popups';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// The New UI map pop-ups (Dossier, Field Notes, Notebook track page, Rival Report), drawn from the mock-ups' Beta 0.6
// templates. These are pure: a model in, HTML out.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: (n) => layout % n });
const count = (html: string, bit: string): number => html.split(bit).length - 1;

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Person ${i}`, rank: i ? 'Grunt' : 'Leader', file: null }));
const dossier = (n: number, pick = 0): DossierModel => ({
  tabs: ['Aqua', 'Rocket'],
  tab: 1,
  people: people(n),
  rows: [{ label: 'Leader', people: [0] }, { label: 'Grunt', people: Array.from({ length: n - 1 }, (_, i) => i + 1) }],
  pick,
  file: { name: `Person ${pick}`, mark: 'Canon', facts: [['Rank', 'Leader'], ['Status', 'At large'], ['Ace', '???'], ['Met', 'Stop 4']], voice: 'Warm <b>', noteTitle: 'Canon note', note: 'Founder' },
  shade: null,
});

describe('listWindow', () => {
  it('shows everything when the list is short', () => expect(listWindow(4, 2, 6)).toEqual({ from: 0, to: 4 }));
  it('keeps the picked row in view in a long list, at both ends', () => {
    expect(listWindow(20, 0, 6)).toEqual({ from: 0, to: 6 });
    expect(listWindow(20, 10, 6)).toEqual({ from: 7, to: 13 });
    expect(listWindow(20, 19, 6)).toEqual({ from: 14, to: 20 });
  });
  it('handles an empty list', () => expect(listWindow(0, 0, 6)).toEqual({ from: 0, to: 0 }));
});

describe('New UI Dossier', () => {
  it('the list layout shows one folder tab per team, six people at most and the case file', () => {
    const html = dossierView(ctx(0), dossier(9, 7));
    expect(count(html, 'data-act="popTab"')).toBe(2);
    expect(count(html, 'data-act="popPick"')).toBe(DOSSIER_ROWS);
    expect(html).toContain('Person 7');
    expect(html).toContain('8 of 9');
    expect(html).toContain('Overheard: “Warm &lt;b&gt;”');
    expect(html).toContain('Canon note');
    expect(html).toContain('data-act="pop"');
  });
  it('a short folder shows no counter', () => expect(dossierView(ctx(0), dossier(3))).not.toContain(' of 3'));
  it('the pyramid layout shows every person once, by rank row, and names the ranks', () => {
    const html = dossierView(ctx(1), dossier(5, 2));
    expect(count(html, 'data-act="popPick"')).toBe(5);
    expect(html).toContain('Leader · Grunt');
    expect(count(html, 'win sel')).toBe(1);
  });
  it('pyramid faces shrink so many ranks or a crowded rank still fit', () => {
    expect(pyramidFace(4, 4)).toEqual({ face: 44, cell: 86, names: true });
    const tall = pyramidFace(8, 3);
    expect(tall.face).toBeLessThan(30);
    expect(tall.names).toBe(false);
    expect(8 * (tall.face + 26) + 7 * 10).toBeLessThanOrEqual(330 + 8 * 10);
    const wide = pyramidFace(2, 12);
    expect(12 * wide.cell + 11 * 10).toBeLessThanOrEqual(500);
    expect(wide.face).toBeGreaterThanOrEqual(16);
  });
});

const book = (n: number, pick = 0, tab = 1): BookModel => ({
  tabs: [{ name: 'Special Pokémon', short: 'Special', count: '2 of 9' }, { name: 'Shadow Pokémon', short: 'Shadow', count: '1 of 6' }, { name: 'Data ROMs', short: 'Data ROMs', count: '1 of 3' }, { name: 'Keys', short: 'Keys', count: '1 held' }],
  tab,
  entries: Array.from({ length: n }, (_, i) => ({ name: i ? '???' : 'Amberjack', file: null, known: !i, badge: i ? 'Shadow' : 'Aerodactyl · Tier 3 Gripped', lines: i ? [] : ['Key type: Place'], pips: i < 2 ? 2 - i : null, obtain: i ? '' : 'Yes, with the key' })),
  pick,
  shadow: tab === 1,
  help: 'Hint 1 shows the key type.',
  empty: 'Nothing here yet. Entries appear as you meet them.',
});

describe('New UI Field Notes', () => {
  it('shows four tabs, the entries of the open one and the picked entry on the right page', () => {
    const html = bookView(ctx(0), book(3));
    expect(count(html, 'data-act="popTab"')).toBe(4);
    expect(count(html, 'data-act="popPick"')).toBe(3);
    expect(html).toContain('Aerodactyl · Tier 3 Gripped');
    expect(html).toContain('Key type: Place');
    expect(html).toContain('Hints ');
    expect(html).toContain('Yes, with the key');
    // The ring stands under the Pokémon's picture: an entry with no picture gets the plain square instead.
    expect(html).not.toContain('border:5px solid');
    expect(html).toContain('width:110px;height:110px;background:#0002');
    expect(html).toContain('Hint 1 shows the key type.');
  });
  it('the book layout shortens the tab names so all four fit down the edge; the other layout keeps them whole', () => {
    expect(bookView(ctx(0), book(1))).toContain('>Shadow</span>');
    expect(bookView(ctx(1), book(1))).toContain('>Shadow Pokémon</span>');
  });
  it('a long tab shows a window of rows and where the cursor is', () => {
    for (const layout of [0, 1]) {
      const html = bookView(ctx(layout), book(12, 9));
      expect(count(html, 'data-act="popPick"')).toBe(bookRows(ctx(layout)));
      expect(html).toContain('10 of 12');
    }
  });
  it('an empty tab says so and draws no entry', () => {
    const html = bookView(ctx(0), book(0));
    expect(html).toContain('Nothing here yet');
    expect(count(html, 'data-act="popPick"')).toBe(0);
  });
});

const track: TrackModel = {
  kicker: 'KANTO · WORLD STATE',
  title: 'The Ledger Fills',
  steps: [{ n: 1, name: 'Small Print', rule: 'r1', state: 'seen' }, { n: 2, name: 'House Rules', rule: 'Prizes are Black-Label', state: 'now' }, { n: 3, name: 'Closed Roads', rule: 'r3', state: 'seen' }, { n: 4, name: 'Export', rule: 'Pools shrink', state: 'next' }, { n: 5, name: '', rule: 'hidden', state: 'locked' }],
  seen: 3,
  scales: [{ head: 'Street · One person', text: 'A shopkeeper adds insurance.', seen: true }, { head: 'World · Part of something bigger', text: 'secret', seen: false }],
  civilian: '"Mind the house rules."',
  next: 'Next: Export, if a raid is failed or declined.',
};

describe('New UI Notebook track page', () => {
  it('the page layout marks the step you are on, strikes the ones behind and hides what is locked', () => {
    const html = trackView(ctx(0), track);
    expect(count(html, '◀ now')).toBe(1);
    expect(count(html, 'line-through')).toBe(2);
    expect(html).toContain('Prizes are Black-Label');
    expect(html).toContain('Pools shrink');
    expect(html).not.toContain('hidden');
    expect(html).not.toContain('r1');
    expect(html).toContain('???');
    expect(html).toContain('A shopkeeper adds insurance.');
    expect(html).not.toContain('secret');
    expect(html).toContain('Next: Export');
  });
  it('the strip layout fills the bar up to the step you are on and says what it does', () => {
    const html = trackView(ctx(1), track);
    expect(html).toContain('width:25%');
    expect(html).toContain('Step 2: House Rules');
    expect(html).toContain('Not yet');
    expect(html).toContain('Mind the house rules.');
  });
});

const report: ReportModel = {
  rivals: ['Joey', 'Mira'],
  pick: 0,
  name: 'Joey',
  tag: 'Champion Chaser',
  art: null,
  facts: [['Role', 'Rival']],
  lead: 1,
  feelings: [['Rivalry', 60], ['Respect', 50], ['Trust', 30], ['Admiration', 20]],
  marks: ['Owes You One'],
  meetings: [['Kanto', '2 meetings, stepped in']],
};

describe('New UI Rival Report', () => {
  it('says who leads in words', () => {
    expect(leadLine('Joey', 0)).toBe('Level');
    expect(leadLine('Joey', 2)).toBe('Joey is ahead by 2');
    expect(leadLine('Joey', -3)).toBe('You lead by 3');
  });
  it('lights one of the seven Lead steps and shows feelings, marks and meetings', () => {
    const html = reportView(ctx(0), report);
    expect(count(html, 'height:12px;background:var(--acc)')).toBe(1);
    expect(count(html, 'height:12px;background:var(--p2)')).toBe(6);
    expect(html).toContain('Joey is ahead by 1');
    expect(count(html, 'hp gold')).toBe(4);
    expect(html).toContain('Owes You One');
    expect(html).toContain('2 meetings, stepped in');
    expect(count(html, 'data-act="popPick"')).toBe(2);
  });
  it('a lone rival has no switcher, and no marks reads as such', () => {
    const html = reportView(ctx(1), { ...report, rivals: ['Joey'], marks: [] });
    expect(count(html, 'data-act="popPick"')).toBe(0);
    expect(html).toContain('No marks yet');
    expect(html).not.toContain('◀ ▶');
  });
});
