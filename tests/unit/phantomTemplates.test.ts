import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phBrief, phName, phSetup, phStarter, RUN_STEPS, stepRibbon } from '../../src/ui/phantom/screens/run';
import { phVersion } from '../../src/ui/phantom/screens/version';
import { phBoard, phConfirm, phGrid, phHead, phMenu, phOptions, phSaves, phStats } from '../../src/ui/phantom/templates';
import { FORM_KEYS } from '../../src/ui/redux/screens/prologue';
import { savesView } from '../../src/ui/redux/screens/saves';
import { starterView } from '../../src/ui/redux/screens/run';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { boardView, gridCols, gridView, menuView, settingsView, statsView, type GridModel, type MenuModel } from '../../src/ui/redux/templates';

// The Phantom UI's shared pages (menu, option rows, picture wall, board, number tiles, save files, confirm) and the
// pages of starting a run. Each is a pure function from the same model its New UI twin takes to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const ctx = (on: boolean): ReduxCtx => ({ k: 0, skin: {} as ReduxCtx['skin'], v: () => 0, ph: on ? ph : null });
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const items = (n: number) => Array.from({ length: n }, (_, k) => ({ label: `Row ${k + 1}`, note: k % 2 ? 'short' : 'a much longer note that only the card shows' }));
const menu = (over: Partial<MenuModel> = {}): MenuModel => ({ title: 'Camp', items: items(12), index: 0, text: 'Pick one.', ...over });
const grid = (over: Partial<GridModel> = {}): GridModel => ({ title: 'Trainer Select', n: 40, cell: (i) => ({ label: `T${i}`, off: i % 7 === 6 }), index: 0, detail: { title: 'Ace', sub: 'The first', body: 'A steady hand.', facts: [['+', 'More money'], ['Record', 'No runs yet']] }, found: 12, total: 40, text: 'Choose a trainer.', ...over });

describe('Phantom shared pages take over only when Phantom is on', () => {
  it('each New view hands over to its Phantom page and keeps its own page otherwise', () => {
    const m = menu(), g = grid();
    const pairs: [string, string, string][] = [
      [menuView(ctx(false), m), menuView(ctx(true), m), 'list'],
      [gridView(ctx(false), g), gridView(ctx(true), g), 'wall'],
      [boardView(ctx(false), { title: 'Quests', area: 'hub', rows: [], index: 0, text: '' }), boardView(ctx(true), { title: 'Quests', area: 'hub', rows: [], index: 0, text: '' }), 'board'],
      [statsView(ctx(false), { title: 'Me', tiles: [['Runs', '3']], text: '' }), statsView(ctx(true), { title: 'Me', tiles: [['Runs', '3']], text: '' }), 'tiles'],
      [settingsView(ctx(false), { title: 'Choices', tabs: ['A'], tab: 0, rows: [{ label: 'x', value: 'y' }], index: 0, text: '' }), settingsView(ctx(true), { title: 'Choices', tabs: ['A'], tab: 0, rows: [{ label: 'x', value: 'y' }], index: 0, text: '' }), 'opts'],
    ];
    for (const [plain, phantom, id] of pairs) {
      expect(pageOf(plain)).toBeNull();
      expect(pageOf(phantom)).toBe(id);
    }
  });

  it('the Phantom style always steers a wall six cells wide', () => {
    expect(gridCols(ctx(true))).toBe(6);
  });
});

describe('Phantom menu', () => {
  it('shows a window of rows that follows the cursor, numbers them, and reaches the last row', () => {
    for (const index of [0, 5, 11]) {
      const html = phMenu(ph, menu({ index }));
      expect(count(html, 'class="it ph-it')).toBe(6);
      expect(count(html, 'class="it ph-it on')).toBe(1);
      expect(html).toContain(`data-arg="${index}"`);
    }
    expect(phMenu(ph, menu({ index: 11 }))).toContain('7–12 of 12');
    expect(count(phMenu(ph, menu({ text: '' })), 'class="it ph-it')).toBe(7);
  });

  it('keeps a long note for the card and a short one on its row; nothing is cut with an ellipsis', () => {
    const html = phMenu(ph, menu({ index: 0 }));
    expect(count(html, 'a much longer note that only the card shows')).toBe(1);
    expect(html).toContain('<span>short</span>');
    expect(html).not.toContain('text-overflow');
  });

  it('dims a row that cannot be chosen and escapes what the data says', () => {
    const html = phMenu(ph, menu({ items: [{ label: '<b>x</b>', disabled: true }] }));
    expect(html).toContain('ph-it on off');
    expect(html).not.toContain('<b>x</b>');
  });
});

describe('Phantom wall, board, tiles and option rows', () => {
  it('the wall shows whole lines of six, the lit cell once, and the count', () => {
    const html = phGrid(ph, grid({ index: 37 }));
    expect(count(html, 'class="dx ph-dx') % 6 === 4 || count(html, 'class="dx ph-dx') % 6 === 0).toBe(true);
    expect(count(html, /class="dx ph-dx on/)).toBe(1);
    expect(html).toContain('<b>12</b> / 40');
    expect(html).toContain('data-arg="37"');
  });

  it('the board shows five rows, fewer under a long line, and says when it is empty', () => {
    const rows = Array.from({ length: 9 }, (_, k) => ({ title: `Task ${k}`, sub: 'do it', tag: 'New', pct: k * 10 }));
    expect(count(phBoard(ph, { title: 'Tasks', area: 'hub', rows, index: 8, text: 'ok' }), 'class="pn ph-row')).toBe(5);
    expect(count(phBoard(ph, { title: 'Tasks', area: 'hub', rows, index: 8, text: 'x'.repeat(200) }), 'class="pn ph-row')).toBe(4);
    expect(phBoard(ph, { title: 'Tasks', area: 'hub', rows: [], index: 0, text: '' })).toContain('Nothing here yet');
  });

  it('tiles: at most eight, and only the pressable one is a button', () => {
    const tiles = Array.from({ length: 10 }, (_, k) => [`L${k}`, `${k}`] as const);
    const html = phStats(ph, { title: 'My stats', tiles, press: 2, text: '' });
    expect(count(html, 'class="rc-s ph-tile')).toBe(8);
    expect(count(html, 'data-act="pick"')).toBe(1);
  });

  it('option rows: six follow the cursor and a row with no value has no arrows', () => {
    const rows = Array.from({ length: 10 }, (_, k) => ({ label: `Rule ${k}`, value: k === 9 ? '' : 'On' }));
    const html = phOptions(ph, { title: 'Choices', tabs: ['One', 'Two'], tab: 1, rows, index: 9, text: 'help' });
    expect(count(html, 'class="sr ph-sr')).toBe(6);
    expect(count(html, 'class="v cyc"')).toBe(5);
    expect(html).toContain('5–10 of 10');
  });

  it('a long title is set smaller instead of running off the page', () => {
    expect(phHead('Bag', 'x')).not.toContain('font-size');
    expect(phHead('Loadout presets and saved builds', 'x')).toContain('font-size:30px');
  });
});

describe('Phantom save files', () => {
  const slots = [
    { tag: 'Slot 1', name: 'Red', where: 'Johto · Stage 14', time: '2026-11-20', party: [], empty: false },
    { tag: 'Slot 2', name: '', where: '', time: '', party: [], empty: true },
  ];
  it('is the Save page: a card per file, Load and Erase for a used file, Start here for an empty one', () => {
    const used = savesView(ctx(true), { slots, focus: 0, onDelete: false, note: '', confirm: null });
    expect(pageOf(used)).toBe('save');
    expect(count(used, /class="slot[ "]/)).toBe(2);
    expect(used).toContain('>Load<');
    expect(used).toContain('>Erase<');
    const empty = phSaves(ph, { slots, focus: 1, onDelete: false, note: '', confirm: null });
    expect(empty).toContain('>Start here<');
    expect(empty).not.toContain('>Erase<');
  });

  it('the confirm card lists every answer and lights the cursor', () => {
    const html = phConfirm({ title: 'Erase file 1?', body: 'This cannot be undone.', options: ['Erase', 'Keep'], index: 1 });
    expect(count(html, 'data-act="confirm"')).toBe(2);
    expect(html).toMatch(/class="blade on"[^>]*data-arg="1"/);
  });
});

describe('Phantom start of a run', () => {
  it('the step ribbon follows the real order and ticks the steps behind', () => {
    expect(RUN_STEPS).toEqual(['Trainer', 'Rules', 'Partner', 'Plan']);
    const html = stepRibbon(2);
    expect(count(html, 'class="done"')).toBe(2);
    expect(count(html, 'class="on"')).toBe(1);
  });

  it('partner: three cards, the lit one offers Choose; a blind draft names nothing', () => {
    const picks = ['Cyndaquil', 'Mudkip', 'Rowlet'].map((name) => ({ name, file: null, types: ['fire'], stats: 'HP 39', moves: 'Lv 5: Tackle' }));
    const html = starterView(ctx(true), { title: 'Starter Select', picks, on: 1, sub: 'Trainer Red' });
    expect(pageOf(html)).toBe('starter');
    expect(count(html, 'class="scd ')).toBe(3);
    expect(count(html, 'class="sctk"')).toBe(1);
    const blind = phStarter(ph, { title: 'x', picks, on: 0, sub: '', blind: true });
    expect(blind).not.toContain('Mudkip');
    expect(count(blind, '???')).toBe(3);
  });

  it('partner cards name the home region and your past runs with it, as the mock-up does', () => {
    const picks = [{ name: 'Cyndaquil', region: 'Johto', past: '3 past runs · best 6 badges' }, { name: 'Mudkip', region: 'Hoenn', past: 'New to you' }].map((p) => ({ ...p, file: null, types: ['fire'], stats: 'HP 39', moves: 'Lv 5: Tackle' }));
    const html = phStarter(ph, { title: 'x', picks, on: 0, sub: '' });
    expect(html).toContain('<span class="lab">Johto · Remembrance</span>');
    expect(html).toContain('<div class="ph-sc-past">3 past runs · best 6 badges</div>');
    expect(html).toContain('<div class="ph-sc-past new">New to you</div>');
    expect(html).toContain('<div class="sctk">Z · Choose</div>');
    expect(phStarter(ph, { title: 'x', picks, on: 0, sub: '', blind: true })).not.toContain('ph-sc-past');
  });

  it('rules: every desk row but the last is a row, and the last is the Begin blade', () => {
    const html = phSetup(ph, { title: 'Preparation Desk', items: [{ label: 'Campaign', note: 'Kanto' }, { label: 'Mode', note: 'Standard' }, { label: 'Depart', note: '' }], index: 2, art: null, card: [['Trainer', 'Red']], seed: 'ABC', text: 'Set the run up.' });
    expect(count(html, 'class="sr ph-sr')).toBe(2);
    expect(html).toContain('su-go on');
    expect(html).toContain('Begin the run');
    expect(html).toContain('SEED ABC');
  });

  it('plan: the regions, the first stage, the seed with Copy, the party and Depart', () => {
    const html = phBrief(ph, { title: 'Briefing', campaign: 'World Tour', regions: ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos'], facts: [['Stages', '30']], nodes: ['battle', 'shop'], stage: 'Route 1', notes: [['Event', 'Homeland Week']], seed: 'SEED1', party: [{ name: 'Mudkip', file: null }], index: 1, text: '' });
    expect(html).toContain('+</b>2 more');
    expect(count(html, 'class="ph-node ')).toBe(2);
    expect(html).toMatch(/<em class="on"[^>]*data-act="copy"/);
    expect(html).toContain('data-act="go"');
  });

  it('name: a box per letter with the caret after the last, every key of the grid, and the three buttons', () => {
    const html = phName(ph, { title: 'Name and pronouns', prompt: 'What is your name?', value: 'Kai', fields: [{ label: 'Name', value: 'Kai' }], field: 0, ok: 'That is me', note: '' });
    expect(pageOf(html)).toBe('nick');
    expect(count(html, 'data-act="key"')).toBe(FORM_KEYS.length);
    expect(count(html, '<b class="cur">')).toBe(1);
    for (const a of ['paste', 'ok', 'clear']) expect(html).toContain(`data-act="${a}"`);
  });

  it('version select: five cards, the one in use marked, the cursor card opened', () => {
    const html = phVersion(ph, { on: 3, now: 'midnight' });
    expect(count(html, /class="vc v-/)).toBe(5);
    expect(count(html, 'IN USE')).toBe(1);
    expect(html).toMatch(/class="vc v-fantasia on"/);
  });
});
