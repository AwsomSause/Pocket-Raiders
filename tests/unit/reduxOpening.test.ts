import { describe, expect, it } from 'vitest';
import { bootView, creditsRows, creditsView, type BootModel, type CreditsModel } from '../../src/ui/redux/screens/boot';
import type { EventModel } from '../../src/ui/redux/screens/event';
// The welcome log and the tutorial use the mock-ups' talk page (the event screen itself was remade as a stage).
import { talkView as eventView } from '../../src/ui/redux/screens/talk';
import { FORM_KEYS, beatTag, formView, typeKey, vanceLine, type FormModel } from '../../src/ui/redux/screens/prologue';
import { DESK_ROWS, deskItems, type DeskInput } from '../../src/ui/redux/screens/run';
import { pageLines } from '../../src/ui/redux/script';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: the screens before the first run (loading, update splash, welcome log, prologue, tutorial) and the credits.
// Each is a pure function from a model to HTML, so the rules are checked here without a browser.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: (n) => layout % n });
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('loading screen and update splash', () => {
  const boot = (over: Partial<BootModel> = {}): BootModel => ({ title: 'Loading the region…', progress: 0.5, note: 'Tip: save before a Gym.', splash: null, ...over });

  it('shows the title, the tip and a bar as wide as the progress', () => {
    const html = bootView(ctx(0), boot());
    expect(html).toContain('Loading the region…');
    expect(html).toContain('Tip: save before a Gym.');
    expect(html).toContain('width:50%');
    expect(html).not.toContain('data-act="next"');
  });
  it('keeps the bar between empty and full whatever the loader reports', () => {
    expect(bootView(ctx(0), boot({ progress: -3 }))).toContain('width:0%');
    expect(bootView(ctx(0), boot({ progress: 7 }))).toContain('width:100%');
  });
  it('has a Poké Ball layout and a running Pikachu layout', () => {
    expect(bootView(ctx(0), boot())).toContain('class="ball"');
    expect(bootView(ctx(1), boot())).not.toContain('class="ball"');
  });
  it('the update splash shows its picture and moves on with a click anywhere', () => {
    const html = bootView(ctx(0), boot({ title: 'Beta 0.7 is here', splash: 'promo/splash.png' }));
    expect(html).toContain('promo/splash.png');
    expect(count(html, 'data-act="next"')).toBe(1);
  });
  it('never injects text as HTML', () => {
    expect(bootView(ctx(0), boot({ title: '<img src=x>', note: '<b>x</b>' }))).not.toMatch(/<img src=x>|<b>x<\/b>/);
  });
});

describe('credits', () => {
  const credits = (over: Partial<CreditsModel> = {}): CreditsModel => ({ lead: 'A run by Kice', rows: [{ kind: 'title', text: 'Pocket Raiders' }, { kind: 'heading', text: 'Design' }, { kind: 'text', text: 'Kice' }, { kind: 'gap', text: '' }, { kind: 'heading', text: 'Team' }, { kind: 'mons', text: '', mons: ['pokemon/25', 'pokemon/6'] }], party: ['pokemon/25'], art: 'arenas/mountain_bg.png', roll: 120, ...over });

  it('groups each small heading with the bold lines under it', () => {
    const html = creditsRows(credits().rows);
    expect(count(html, 'class="col cen"')).toBe(2);
    expect(html.indexOf('Design')).toBeLessThan(html.indexOf('Kice'));
    expect(html).toContain('Pocket Raiders');
  });
  it('an empty list of rows draws nothing', () => {
    expect(creditsRows([])).toBe('');
  });
  it('rolls from where the scene says, and can be skipped', () => {
    const html = creditsView(ctx(0), credits());
    expect(html).toContain('translateY(120px)');
    expect(html).toContain('overflow:hidden');
    expect(html).toContain('<kbd>Esc</kbd>skip');
    expect(html).toContain('A run by Kice');
  });
  it('standing still (motion off) it can be scrolled instead', () => {
    const html = creditsView(ctx(0), credits({ roll: null }));
    expect(html).toContain('overflow:auto');
    expect(html).not.toContain('translateY');
  });
  it('leaves out the lead line and the party row when there is none', () => {
    const html = creditsView(ctx(0), credits({ lead: '', party: [] }));
    expect(html).not.toContain('A run by');
    expect(html).toContain('bottom:44px');
  });
});

describe('name entry', () => {
  const form = (over: Partial<FormModel> = {}): FormModel => ({ title: 'Your name', prompt: 'What do people call you?', value: 'Kice', fields: [{ label: 'Name', value: 'Kice' }], field: 0, ok: 'That is me', note: 'Up to 12 letters.', ...over });

  it('has thirty on-screen keys: the alphabet, a hyphen, an apostrophe, a space and delete', () => {
    expect(FORM_KEYS).toHaveLength(30);
    expect(count(formView(ctx(0), form()), 'data-act="key"')).toBe(30);
  });
  it('shows the prompt, the value, the three buttons and the note', () => {
    const html = formView(ctx(0), form());
    for (const bit of ['What do people call you?', 'Kice', 'Paste', 'That is me', 'Clear', 'Up to 12 letters.']) expect(html).toContain(bit);
    for (const a of ['paste', 'ok', 'clear']) expect(count(html, `data-act="${a}"`)).toBe(1);
    expect(html).not.toContain('data-act="field"');
  });
  it('several boxes (custom pronouns) show as chips, one of them lit', () => {
    const html = formView(ctx(0), form({ fields: [{ label: 'They', value: 'xe' }, { label: 'Them', value: '' }], field: 1 }));
    expect(count(html, 'data-act="field"')).toBe(2);
    expect(html).toContain('Them: …');
    expect(html).toContain('next box');
  });
  it('never injects a typed value as HTML', () => {
    expect(formView(ctx(0), form({ value: '<i>x</i>' }))).not.toContain('<i>x</i>');
  });

  it('typing: a grid key starts a word with a capital and goes on in small letters', () => {
    let v = '';
    for (const k of ['K', 'I', 'C', 'E', ' ', 'B']) v = typeKey(v, k, 12, true);
    expect(v).toBe('Kice B');
    expect(typeKey("O'", 'N', 12, true)).toBe("O'N");
  });
  it('typing: a keyboard key is taken as typed', () => {
    expect(typeKey('k', 'I', 12)).toBe('kI');
    expect(typeKey('k', 'i', 12)).toBe('ki');
  });
  it('typing: delete takes the last letter and is safe on an empty value', () => {
    expect(typeKey('Kice', '⌫', 12)).toBe('Kic');
    expect(typeKey('Kice', 'Backspace', 12)).toBe('Kic');
    expect(typeKey('', '⌫', 12)).toBe('');
  });
  it('typing: stops at the limit and ignores keys that are not a letter', () => {
    expect(typeKey('abc', 'd', 3)).toBe('abc');
    expect(typeKey('abc', 'Shift', 12)).toBe('abc');
    expect(typeKey('abc', 'Enter', 12)).toBe('abc');
  });
});

describe('prologue text', () => {
  it('"VANCE: words" is Professor Vance speaking, without the quote marks', () => {
    expect(vanceLine('VANCE: "You made it."')).toEqual({ who: 'Prof. Vance', text: 'You made it.' });
    expect(vanceLine('VANCE (a recording): Hello.')).toEqual({ who: 'Prof. Vance (a recording)', text: 'Hello.' });
  });
  it('anything else is telling', () => {
    expect(vanceLine('The lighthouse hums.')).toEqual({ who: null, text: 'The lighthouse hums.' });
    expect(vanceLine('')).toEqual({ who: null, text: '' });
  });
  it('"Beat 3: Professor Vance" is tag "Prologue 3/11" and the name alone', () => {
    expect(beatTag('Beat 3: Professor Vance', 11)).toEqual({ tag: 'Prologue 3/11', name: 'Professor Vance' });
    expect(beatTag('Choose your Look', 11)).toEqual({ tag: 'Prologue', name: 'Choose your Look' });
  });
});

describe('pages of spoken lines', () => {
  const line = (who: string | null, n: number) => ({ who, text: 'word '.repeat(n).trim() });

  it('no lines, no page', () => {
    expect(pageLines([])).toEqual([]);
  });
  it('lines that fit stay on one page', () => {
    const lines = [line('Prof. Oak', 5), line(null, 5)];
    expect(pageLines(lines, 240)).toEqual([lines]);
  });
  it('a long talk is cut into pages that never pass the limit and lose no word', () => {
    const lines = [line('Prof. Oak', 60), line(null, 30), line('Prof. Oak', 40)];
    const pages = pageLines(lines, 120);
    expect(pages.length).toBeGreaterThan(2);
    for (const p of pages) expect(p.reduce((n, l) => n + l.text.length, 0)).toBeLessThanOrEqual(120);
    expect(count(pages.flat().map((l) => l.text).join(' '), 'word')).toBe(130);
    expect(pages[0]![0]!.who).toBe('Prof. Oak');
  });
});

describe('talk page used by the welcome log and the tutorial', () => {
  const choice = (label: string) => ({ label, sub: '', chance: '', locked: false });
  const page = (over: Partial<EventModel> = {}): EventModel => ({
    name: 'Raider Log', tag: 'First launch', lines: [{ who: null, text: 'Entry one.' }], speaker: null, page: { at: 0, of: 1 },
    art: null, tint: null, fx: null, cast: null, mon: null, choices: [choice('Begin')], index: 0, money: null, outcome: null, pick: null, countdown: '', timer: null, ...over,
  });

  for (const layout of [0, 1, 2, 3]) {
    it(`layout ${layout}: no money tag when the page has no wallet; the tag shows with one`, () => {
      expect(eventView(ctx(layout), page())).not.toContain('₽');
      expect(eventView(ctx(layout), page({ money: 300 }))).toContain('₽ 300');
    });
    it(`layout ${layout}: the ten-lesson list shows every lesson`, () => {
      const html = eventView(ctx(layout), page({ choices: Array.from({ length: 10 }, (_, k) => choice(`Lesson ${k + 1}`)) }));
      expect(count(html, 'data-act="pick"')).toBe(10);
    });
  }
  it('a long list gets shorter buttons in the default layout so it stays under the tag; a short list keeps the usual ones', () => {
    const many = eventView(ctx(0), page({ choices: Array.from({ length: 10 }, (_, k) => choice(`Lesson ${k + 1}`)) }));
    const few = eventView(ctx(0), page({ choices: [choice('Next'), choice('Skip')] }));
    const h = /height:(\d+)px;font-size:14px/.exec(many);
    expect(h).not.toBeNull();
    expect(Number(h![1]) * 10 + 4 * 10).toBeLessThanOrEqual(540 - 97 - 44 + 4);
    expect(few).not.toMatch(/height:\d+px;font-size:14px/);
  });
  it('more than five choices stand in two columns in the wide-box layout', () => {
    expect(eventView(ctx(2), page({ choices: Array.from({ length: 6 }, (_, k) => choice(`L${k}`)) }))).toContain('grid-auto-flow:column');
    expect(eventView(ctx(2), page({ choices: Array.from({ length: 5 }, (_, k) => choice(`L${k}`)) }))).not.toContain('grid-auto-flow:column');
  });
});

describe('New UI Preparation Desk rows (the mock-up menu)', () => {
  const desk = (over: Partial<DeskInput> = {}): DeskInput => ({ campaign: 'Full campaign', mode: 'Standard', difficulty: 'Hard', prep: null, modifiers: 0, deathBlock: false, seed: null, saved: 0, slots: 3, ...over });
  it('has one row per desk row, in the mock-up order, with Depart last', () => {
    const rows = deskItems(desk());
    expect(rows.map((r) => r.label)).toEqual(['Campaign', 'Mode', 'Preparation', 'Modifiers', 'Seed & Codes', 'Loadout presets', 'Depart']);
    expect(rows.length).toBe(DESK_ROWS.length);
    expect(DESK_ROWS[DESK_ROWS.length - 1]).toBe('start');
  });
  it('says what each row is set to', () => {
    const notes = deskItems(desk({ prep: 'Trail Kit', modifiers: 2, deathBlock: true, seed: 'abc', saved: 1 })).map((r) => r.note);
    expect(notes).toEqual(['Full campaign', 'Standard · Hard', 'Trail Kit', '3 on', 'abc', '1 of 3 saved', 'Pick your starter']);
  });
  it('an empty setup reads None, Random and 0 on; a mode and difficulty of the same name show once', () => {
    const notes = deskItems(desk({ difficulty: 'Standard', seed: '' })).map((r) => r.note);
    expect(notes.slice(1, 5)).toEqual(['Standard', 'None', '0 on', 'Random']);
  });
  it('a long seed is cut to fit its row, and odd counts stay inside their ends', () => {
    const rows = deskItems(desk({ seed: 'PR1.' + 'x'.repeat(60), modifiers: -4, saved: 9 }));
    expect(rows[4]!.note.length).toBe(20);
    expect(rows[4]!.note.endsWith('…')).toBe(true);
    expect(rows[3]!.note).toBe('0 on');
    expect(rows[5]!.note).toBe('3 of 3 saved');
  });
});
