import { describe, expect, it } from 'vitest';
import { InteractionLog } from '../../src/core/presentation/uiPrefs';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { LOG_ROOM, logRowHeight, logWindow, phLog, phWheel, wheelStep, type PhLogRow, type PhWheelModel } from '../../src/ui/phantom/screens/system';

// The Phantom UI's run log page and the map's quick wheel, and the log's store behind them.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const say = (text: string, who = 'Blue'): PhLogRow => ({ who, text, kind: 'say' });

describe('the run log behind the Log page', () => {
  it('keeps what is said, chosen and gained beside the plain notes, and the short list is as it was', () => {
    const log = new InteractionLog(3, 5);
    log.add('Saved file 1', 1);
    log.tell('stage', 'Kanto · Route 21', 'Stage 13', 2);
    log.tell('say', '  Smell ya later!  ', 'Blue', 3);
    log.tell('pick', 'Track it down', 'You', 4);
    expect(log.backlog().map((e) => [e.kind ?? 'note', e.who ?? '', e.text])).toEqual([['note', '', 'Saved file 1'], ['stage', 'Stage 13', 'Kanto · Route 21'], ['say', 'Blue', 'Smell ya later!'], ['pick', 'You', 'Track it down']]);
    // The short list (the New and Old looks' window) holds only the plain notes.
    expect(log.recent().map((e) => e.text)).toEqual(['Saved file 1']);
  });

  it('an empty line is not kept, nor the same line twice in a row; the oldest lines leave first', () => {
    const log = new InteractionLog(3, 4);
    log.tell('say', '   ', 'Blue');
    log.tell('gain', 'Received 2 Ultra Balls');
    log.tell('gain', 'Received 2 Ultra Balls');
    expect(log.backlog()).toHaveLength(1);
    // The same words from someone else, or as another kind, are a new line.
    log.tell('say', 'Received 2 Ultra Balls', 'Oak');
    for (let k = 0; k < 4; k++) log.tell('say', `Line ${k}`, 'Blue');
    expect(log.backlog().map((e) => e.text)).toEqual(['Line 0', 'Line 1', 'Line 2', 'Line 3']);
  });

  it('belongs to one run: another run starts it empty, the same run keeps it, and the notes list is not touched', () => {
    const log = new InteractionLog();
    log.scope('seed#1');
    log.add('Saved file 1');
    log.tell('say', 'Hello.', 'Oak');
    log.scope('seed#1');
    expect(log.backlog()).toHaveLength(2);
    log.scope('seed#2');
    expect(log.backlog()).toEqual([]);
    expect(log.recent()).toHaveLength(1);
    log.clear();
    expect(log.recent()).toEqual([]);
  });
});

describe('which rows of the log are on the page', () => {
  const rows = Array.from({ length: 30 }, (_, k) => say(`Line ${k}`));
  const fit = Math.floor(LOG_ROOM / logRowHeight(rows[0]!));

  it('draws as many rows as fit and follows the lit row up and down', () => {
    expect(fit).toBeGreaterThanOrEqual(6);
    expect(logWindow(rows, 0, 0)).toEqual({ top: 0, end: fit });
    // Past the last drawn row: the page moves just far enough.
    expect(logWindow(rows, 0, fit)).toEqual({ top: 1, end: fit + 1 });
    // Above the first drawn row: it becomes the first.
    expect(logWindow(rows, 12, 4)).toEqual({ top: 4, end: 4 + fit });
    // At the end there is no empty room under the last row.
    expect(logWindow(rows, 29, 29)).toEqual({ top: 30 - fit, end: 30 });
    // A cursor out of range is kept inside.
    expect(logWindow(rows, 0, 99).end).toBe(30);
    expect(logWindow(rows, 5, -3).top).toBe(0);
  });

  it('long rows take more room, one taller than the page is drawn alone, and an empty log draws nothing', () => {
    const long = say('x'.repeat(400));
    expect(logRowHeight(long)).toBeGreaterThan(logRowHeight(rows[0]!) * 2);
    const mixed = [rows[0]!, long, long, long, rows[1]!];
    const w = logWindow(mixed, 0, 0);
    expect(w.end).toBeLessThan(5);
    expect(mixed.slice(w.top, w.end).reduce((h, r) => h + logRowHeight(r), 0)).toBeLessThanOrEqual(LOG_ROOM);
    const huge = say('x'.repeat(5000));
    expect(logRowHeight(huge)).toBeGreaterThan(LOG_ROOM);
    expect(logWindow([rows[0]!, huge, rows[1]!], 0, 1)).toEqual({ top: 1, end: 2 });
    expect(logWindow([], 3, 3)).toEqual({ top: 0, end: 0 });
    expect(logWindow(rows.slice(0, 3), 0, 2)).toEqual({ top: 0, end: 3 });
  });
});

describe('Phantom run log page', () => {
  const rows: PhLogRow[] = [{ who: 'Stage 13', text: 'Kanto · Route 21', kind: 'stage' }, say('A wild <b>Dragonite</b> has been raiding the carts.', 'Prof. Oak'), { who: 'You', text: 'Track it down', kind: 'pick' }, { who: '', text: 'Received 2 Ultra Balls', kind: 'gain' }, { who: 'Tip', text: 'hold TAB on the map.', kind: 'note' }];

  it('reads the run back: a heading per stage, who said what, what you chose and what you got, with one row lit', () => {
    const html = phLog(ph, { where: 'Stage map', rows, cursor: 2, top: 0 });
    expect(pageOf(html)).toBe('log');
    for (const t of ['Stage map', 'Log', 'Stage 13', 'Kanto · Route 21', 'Prof. Oak', '<i>You chose</i> Track it down', 'Received 2 Ultra Balls', 'Tip', '3 / 5', 'Scroll', 'Close']) expect(html).toContain(t);
    expect(count(html, 'class="lr ph-lr')).toBe(5);
    expect(html).toMatch(/class="lr ph-lr pick on" data-key="lr2"[^>]*data-act="logAt" data-arg="2"/);
    expect(html).toMatch(/class="lr ph-lr ph-lr-st" data-key="lr0"/);
    expect(html).toMatch(/class="lr ph-lr gain" data-key="lr3"/);
    expect(count(html, / on" data-key/)).toBe(1);
    // Text from the game is escaped.
    expect(html).not.toContain('<b>Dragonite</b>');
    // A click beside the rows, and the key hint, both close it.
    expect(count(html, 'data-act="log"')).toBe(2);
  });

  it('a long log draws only the rows that fit, and the bar says which part; an empty log says so', () => {
    const many = Array.from({ length: 40 }, (_, k) => say(`Line ${k}`));
    const html = phLog(ph, { where: 'Event', rows: many, cursor: 39, top: 39 });
    const drawn = count(html, 'class="lr ph-lr');
    expect(drawn).toBeGreaterThanOrEqual(6);
    expect(drawn).toBeLessThan(40);
    expect(html).toContain('Line 39');
    expect(html).not.toContain('Line 0<');
    expect(html).toContain('40 / 40');
    const top = Number(/<i style="top:([\d.]+)%/.exec(html)![1]);
    expect(top).toBeGreaterThan(50);
    const empty = phLog(ph, { where: 'Hub', rows: [], cursor: 0, top: 0 });
    expect(empty).toContain('Nothing yet.');
    expect(empty).not.toContain('ph-lg-n');
    expect(empty).not.toContain('data-act="logAt"');
  });
});

describe('the quick wheel', () => {
  const wheel = (over: Partial<PhWheelModel> = {}): PhWheelModel => ({
    items: ['Party', 'Bag', 'Rivals', 'Phone', 'Pokédex', 'Reserve', 'Save', 'Settings'].map((label) => ({ label, note: `${label} note`, off: label === 'Rivals' })), index: 1, held: true, ...over,
  });

  it('a direction key moves one slot the short way toward that side of the ring, and stops there', () => {
    // Eight slots: the top is 0, the right 2, the bottom 4, the left 6.
    expect(wheelStep(0, 8, 'right')).toBe(1);
    expect(wheelStep(1, 8, 'right')).toBe(2);
    expect(wheelStep(2, 8, 'right')).toBe(2);
    expect(wheelStep(0, 8, 'left')).toBe(7);
    expect(wheelStep(7, 8, 'up')).toBe(0);
    expect(wheelStep(1, 8, 'up')).toBe(0);
    expect(wheelStep(3, 8, 'down')).toBe(4);
    expect(wheelStep(5, 8, 'down')).toBe(4);
    // Straight across is a tie: it goes clockwise.
    expect(wheelStep(0, 8, 'down')).toBe(1);
    // Other sizes, a lone slot, and a slot out of range.
    expect(wheelStep(0, 10, 'left')).toBe(9);
    expect(wheelStep(0, 1, 'right')).toBe(0);
    expect(wheelStep(-1, 8, 'up')).toBe(0);
  });

  it('stands the slots evenly round the ring with one lit, says what the lit one is, and how to open it', () => {
    const html = phWheel(wheel());
    expect(count(html, 'class="wi ph-wi')).toBe(8);
    expect(html).toMatch(/class="wi ph-wi on" data-key="wi1" style="--i:1;--a:-45deg" data-act="wheel" data-arg="1" data-over="wheelOver"><b>Bag<\/b>/);
    expect(html).toContain('--a:-90deg');
    expect(html).toContain('--a:225deg');
    expect(html).toMatch(/class="wi ph-wi off" data-key="wi2"/);
    for (const t of ['Let go to open', 'Bag note', 'Release to go', 'Hold <kbd>TAB</kbd> on the map']) expect(html).toContain(t);
    expect(html).toContain('rotate:-45.0deg');
    // A click beside the slots, and Esc, shut it.
    expect(count(html, 'data-act="wheel" data-arg="-1"')).toBe(2);
  });

  it('opened by a tap it waits for Enter; a slot that is off says so; the needle goes the short way; names are escaped', () => {
    const tap = phWheel(wheel({ held: false, index: 2 }));
    expect(tap).toContain('Not yet');
    expect(tap).toContain('Rivals note');
    expect(tap).toMatch(/data-act="wheel" data-arg="2"><b[^>]*>Enter<\/b>/);
    expect(phWheel(wheel({ held: false }))).toContain('Enter to open');
    // From the top one step left: the needle turns back 45 degrees, not forward 315.
    expect(phWheel(wheel({ index: 7, spin: -1 }))).toContain('rotate:-135.0deg');
    expect(phWheel(wheel({ items: [{ label: '<i>x</i>', note: '<b>y</b>' }], index: 0 }))).not.toMatch(/<i>x<\/i>|<b>y<\/b>/);
  });
});
