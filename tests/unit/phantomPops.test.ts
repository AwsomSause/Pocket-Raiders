import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { PH_BOOK_ROWS, phBook, phBracket, phDossier, phReport, phRoll, phScout, phTrack } from '../../src/ui/phantom/screens/pops';
import type { BracketModel } from '../../src/ui/redux/screens/bracket';
import type { BookModel, DossierModel, ReportModel, RollModel, TrackModel } from '../../src/ui/redux/screens/popups';

// The Phantom UI's map pop pages: pure functions from the New UI pop-ups' models to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;

const report = (over: Partial<ReportModel> = {}): ReportModel => ({
  rivals: ['Joey', 'Mira'], pick: 0, name: 'Joey', tag: 'Champion Chaser', art: null, facts: [['Role', 'Rival'], ['Style', 'Rush']], lead: 1,
  feelings: [['Rivalry', 60], ['Respect', 50], ['Trust', 130]], marks: ['owes-you-one'], meetings: [['Kanto', '2 meetings, stepped in']], ...over,
});
const dossier = (over: Partial<DossierModel> = {}): DossierModel => ({
  tabs: ['Aqua', 'Rocket'], tab: 1, people: [{ name: 'Madame Boss', rank: 'Leader emerita', file: null }, { name: 'Surge', rank: 'Executive', file: null }, { name: 'Koga', rank: 'Executive', file: null }],
  rows: [{ label: 'Leader', people: [0] }, { label: 'Executive', people: [1, 2] }], pick: 2,
  file: { name: 'Shinobi Koga', mark: 'Canon', facts: [['Rank', 'Executive'], ['Status', 'Beaten']], voice: 'Poison is patience.', noteTitle: 'Canon note', note: 'Fuchsia Gym.' }, shade: null, ...over,
});
const entry = (k: number, known = true) => ({ name: known ? `Entry ${k}` : '???', file: null, known, badge: 'Special', lines: [`Line for ${k}.`], pips: k === 0 ? 2 : null, obtain: k === 0 ? 'Yes, with the key' : '' });
const book = (over: Partial<BookModel> = {}): BookModel => ({
  tabs: [{ name: 'Special Pokémon', short: 'Special', count: '2 of 9' }, { name: 'Shadow Pokémon', short: 'Shadow', count: '1 of 6' }], tab: 0,
  entries: Array.from({ length: 12 }, (_, k) => entry(k, k < 3)), pick: 0, shadow: false, help: 'A trait shows once you have met the Pokémon.', empty: 'Nothing here yet.', ...over,
});
const track = (over: Partial<TrackModel> = {}): TrackModel => ({
  kicker: 'Kanto · World state', title: 'The Ledger Fills', seen: 3,
  steps: [{ n: 1, name: 'Small Print', rule: '', state: 'seen' }, { n: 2, name: 'House Rules', rule: 'One Pokémon Center per city closes at night', state: 'now' }, { n: 3, name: 'Export', rule: '', state: 'next' }, { n: 4, name: '', rule: '', state: 'locked' }],
  scales: [{ head: 'Street · One person', text: 'A shopkeeper adds "insurance".', seen: true }, { head: 'World · Part of something bigger', text: 'SECRET-TEXT', seen: false }],
  civilian: '"Mind the house rules."', next: 'Next: Export, if a raid is failed or declined.', ...over,
});
const roll = (over: Partial<RollModel> = {}): RollModel => ({
  town: 'Pewter City', index: 0, rolled: 2, optional: 8, page: null, text: 'Each Kanto town rolls which optional spaces appear this run.',
  cards: [{ name: 'Veridian Forest', state: 'star', note: 'Pseudo-stage' }, { name: 'Mt. Moon', state: 'star', note: 'Pseudo-stage · Done' }, { name: 'The Flock', state: 'dice', note: 'Event' }, { name: 'Museum', state: 'open', note: 'Event' }, { name: 'Water Wheel', state: 'off', note: 'Event' }, { name: 'Rest Stop', state: 'off', note: 'Event' }],
  ...over,
});

describe('Phantom Rival Report', () => {
  it('lists every rival with the picked one lit, and shows the lead, the feelings, the marks and the meetings', () => {
    const html = phReport(ph, report());
    expect(pageOf(html)).toBe('rivals');
    expect(count(html, /class="rv pn/)).toBe(2);
    expect(count(html, 'class="rv pn lt on"')).toBe(1);
    expect(html).toMatch(/data-act="popPick" data-arg="1"/);
    for (const t of ['2 rivals are on your trail', 'Joey is ahead by 1', 'Champion Chaser', 'Rivalry', 'owes-you-one', '2 meetings, stepped in', 'Losing to a rival never ends your run.']) expect(html).toContain(t);
    expect(count(html, '<i class="on them">')).toBe(1);
    // A feeling over 100 is clamped to the bar.
    expect(html).toContain('width:100%');
    expect(html).not.toContain('width:130%');
    expect(html).toMatch(/data-act="pop"/);
  });

  it('one rival has no "change rival" key, no marks says so, and names are escaped', () => {
    const html = phReport(ph, report({ rivals: ['<b>x</b>'], name: '<b>x</b>', marks: [], lead: -2 }));
    expect(html).toContain('1 rival is on your trail');
    expect(html).toContain('No marks yet');
    expect(html).toContain('You lead by 2');
    expect(html).not.toContain('<b>x</b>');
    expect(html).not.toContain('▲▼');
  });
});

describe('Phantom Dossier', () => {
  it('draws the folders as tabs, the chain of command by rank, and the picked person’s case file', () => {
    const html = phDossier(ph, dossier());
    expect(pageOf(html)).toBe('dossier');
    expect(count(html, 'data-act="popTab"')).toBe(2);
    expect(html).toMatch(/<span class="on" data-act="popTab" data-arg="1">Rocket<\/span>/);
    expect(count(html, 'class="ph-dos-rank"')).toBe(2);
    expect(count(html, /class="ph-dos-p/)).toBe(3);
    expect(count(html, 'class="ph-dos-p on"')).toBe(1);
    for (const t of ['3 on file · Rocket', 'Shinobi Koga', 'Canon', 'Poison is patience.', 'Fuchsia Gym.', 'Beaten']) expect(html).toContain(t);
  });

  it('one folder has no folder key, and an empty folder draws no case file', () => {
    const html = phDossier(ph, dossier({ tabs: ['Rocket'], tab: 0, people: [], rows: [], pick: 0 }));
    expect(html).not.toContain('Folder');
    expect(html).not.toContain('ph-dos-file');
  });
});

describe('Phantom Field Notes', () => {
  it('shows a window of entries around the cursor, the picked entry’s page and the tab’s help', () => {
    const html = phBook(ph, book());
    expect(pageOf(html)).toBe('notes');
    expect(count(html, /class="ph-nb-row/)).toBe(PH_BOOK_ROWS);
    expect(count(html, /class="ph-nb-row on/)).toBe(1);
    expect(count(html, /class="ph-nb-row[^"]* unk"/)).toBe(PH_BOOK_ROWS - 3);
    for (const t of ['Special Pokémon · 2 of 9', 'Entry 0', 'Line for 0.', 'Yes, with the key', 'A trait shows once you have met the Pokémon.', '1 of 12']) expect(html).toContain(t);
    expect(html).toContain('aria-label="2 of 3"');
    const far = phBook(ph, book({ pick: 11 }));
    expect(far).toContain('12 of 12');
    expect(far).toMatch(/data-act="popPick" data-arg="11"/);
    expect(far).not.toMatch(/data-act="popPick" data-arg="0"/);
  });

  it('an empty tab says so, and the Shadow tab rings its picture in purple', () => {
    const none = phBook(ph, book({ entries: [], pick: 0 }));
    expect(none).toContain('Nothing here yet.');
    expect(none).not.toContain('ph-nb-card');
    expect(phBook(ph, book({ shadow: true }))).toContain('class="ph-nb-pic sh"');
  });
});

describe('Phantom Notebook', () => {
  it('lays the plan out as steps, marks the one it is on, and keeps unseen scales shut', () => {
    const html = phTrack(ph, track());
    expect(pageOf(html)).toBe('track');
    expect(count(html, /class="ph-tk-s /)).toBe(4);
    expect(count(html, 'class="ph-tk-s now"')).toBe(1);
    expect(html).toContain('???');
    expect(html).toContain('width:33%');
    for (const t of ['Kanto · World state', 'Step 2', 'House Rules', 'closes at night', 'Civilians say', 'Next: Export']) expect(html).toContain(t);
    expect(html).toContain('A shopkeeper adds &quot;insurance&quot;.');
    expect(html).not.toContain('SECRET-TEXT');
    expect(html).toContain('aria-label="3 of 5"');
  });

  it('a plan that has not moved says so', () => {
    const html = phTrack(ph, track({ steps: [{ n: 1, name: 'Small Print', rule: '', state: 'next' }], civilian: '' }));
    expect(html).toContain('width:0%');
    expect(html).not.toContain('Civilians say');
  });
});

describe('Phantom Town Roll', () => {
  it('deals the spaces on the map as cards with one lit, and the ones left out as tags', () => {
    const html = phRoll(ph, roll());
    expect(pageOf(html)).toBe('roll');
    expect(count(html, /class="ph-rl-c /)).toBe(4);
    expect(count(html, /class="ph-rl-c star on"/)).toBe(1);
    expect(count(html, /class="ph-rl-off"/)).toBe(1);
    expect(html).toMatch(/<span class=""[^>]*data-act="popPick" data-arg="4" data-over="popOver">Water Wheel/);
    for (const t of ['Pewter City', 'Always here', 'Rolled', 'Unlocked', 'Not this run', '2 of 8 optional spaces placed on the map', 'Pseudo-stage · Done', 'To the map']) expect(html).toContain(t);
  });

  it('a left-out space can be lit, a short town keeps every space as a card, and a second town is numbered', () => {
    expect(phRoll(ph, roll({ index: 5 }))).toMatch(/<span class="on"[^>]*>Rest Stop/);
    const short = phRoll(ph, roll({ cards: roll().cards.slice(2, 5), index: 2, page: [2, 2] }));
    expect(count(short, /class="ph-rl-c /)).toBe(3);
    expect(short).toContain('class="ph-rl-c off on"');
    expect(short).not.toContain('ph-rl-off');
    expect(short).toContain('Pewter City · Town 2 of 2');
  });
});

describe('Phantom bracket', () => {
  const who = (name: string, over = {}) => ({ name, file: null, you: false, out: false, named: true, ...over });
  const bracket = (over: Partial<BracketModel> = {}): BracketModel => ({
    title: 'Tournament bracket', pages: ['Group A', 'Group B', 'Finals'], page: 0, text: '11 players, seed fixed.',
    columns: [
      { name: 'Round of 16', now: true, slots: [who('Hal'), who('(bye)', { out: true }), who('Cy'), who('Red', { you: true })] },
      { name: 'Quarterfinal', now: false, slots: [who('Hal'), null] },
      { name: 'Semifinal', now: false, slots: [null] },
    ], ...over,
  });

  it('draws each column with its slots: you in gold, the beaten struck out, an unplayed match as a question mark', () => {
    const html = phBracket(ph, bracket());
    expect(pageOf(html)).toBe('bracket');
    expect(count(html, /class="ph-bk-col /)).toBe(3);
    expect(count(html, 'class="ph-bk-col c0 now"')).toBe(1);
    expect(count(html, /class="ph-bk-s[ "]/)).toBe(7);
    expect(html).toContain('class="ph-bk-s you"');
    expect(html).toContain('★ Red');
    expect(count(html, 'class="ph-bk-s out"')).toBe(1);
    expect(count(html, 'class="ph-bk-s q"')).toBe(2);
    expect(count(html, 'data-act="bracketPage"')).toBe(3);
    expect(html).toMatch(/<span class="on" data-act="bracketPage" data-arg="0">Group A/);
    expect(html).toContain('11 players, seed fixed.');
    expect(html).toMatch(/class="key" data-act="bracket"/);
  });

  it('the last column of one name is the winner card; a watch chip and custom keys are kept; one page has no tabs', () => {
    const html = phBracket(ph, bracket({ pages: [], columns: [{ name: 'Final', now: false, slots: [who('Hal'), who('Cy', { out: true })] }, { name: 'Winner', now: true, slots: [who('Hal')] }], extra: 'W: watch a round 1 match', hints: [['Enter', 'copy'], ['Esc', 'back']] }));
    expect(count(html, /class="ph-bk-s win"/)).toBe(1);
    expect(html).not.toContain('data-act="bracketPage"');
    expect(html).toMatch(/class="ph-bk-x" data-act="bracketWatch"/);
    expect(html).toContain('Copy');
    expect(html).toMatch(/data-act="bracket" data-arg=""><b[^>]*>X<\/b>Back/);
  });
});

describe('Phantom rival team', () => {
  const cards = [{ name: 'Growlithe', file: null, level: 31, types: ['fire'], moves: ['Ember', 'Bite'] }, { name: 'Pidgeotto', file: null, level: 0, types: ['normal', 'flying'], moves: [] }];

  it('gives each Pokémon a card with its level, types and four move slots, and closes on a click or Enter', () => {
    const html = phScout(ph, { rival: 'Okafor', cards });
    expect(pageOf(html)).toBe('scout');
    expect(count(html, 'data-testid="team-card"')).toBe(2);
    expect(html).toContain('Okafor&#39;s team');
    expect(html).toContain('Lv.31');
    // No level known: none is shown.
    expect(count(html, 'Lv.')).toBe(1);
    expect(count(html, '<span>—</span>')).toBe(6);
    expect(html).toContain('You will not forget them.');
    expect(count(html, 'data-act="back"')).toBe(2);
    // Without a picture of the rival the cards take the full width.
    expect(html).toContain('class="sc-g ph-sc-g wide"');
    expect(html).not.toContain('sc-who');
  });
});
