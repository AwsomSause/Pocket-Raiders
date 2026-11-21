// DOMINION slice D28 (round-4 mockups m5-m7): getting around. The board's photos and strings are mockup m5 (sheet 0
// read straight from mockups-v4/src/i3.py), every page has a photo, every page you can walk into is reachable from the
// wheel, the wheel's pointer and last-pages list, the hub's words, the pinned column, and the shutter's three modes.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  boardMove, EDGES, hubLine, jumpable, OPENS, PAGE_IDS, PAGE_NAMES, PINS, pinned, pushLast, spotAt, spotOf, SPOTS, turn, type PageId,
} from '../../src/core/dominion/nav';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import type { DominionBlock } from '../../src/core/dominion/schema';
import { boardView, shutterMode, wheelView, withShutter } from '../../src/ui/redux/screens/dominion/navViews';
import { DEFAULT_PAD_MAP, padWheelHeld, WHEEL_BUTTON } from '../../src/core/presentation/uiPrefs';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'nav', seed: 'nav', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run.expansion!.dominion!;
};

// Mockup m5's photos and strings, from the generator that drew it.
const i3 = readFileSync('plans/evil-mode-rework/mockups-v4/src/i3.py', 'utf8');
const MOCK_KEYS: Record<string, PageId> = { set: 'settings', morn: 'morning', dist: 'district', take: 'takeover' };
const mockPins = [...i3.matchAll(/^ '(\w+)': \((\d+), (\d+), (-?\d+), '([\w-]+)', '([^']+)', '([^']+)', '([^']*)'\),/gm)]
  .map((m) => ({ id: MOCK_KEYS[m[1]!] ?? m[1]!, x: +m[2]!, y: +m[3]!, r: +m[4]!, icon: m[5]!, name: m[6]!, how: m[7]!, cls: m[8]! }));
const mockEdges = [...i3.matchAll(/\('(\w+)', '(\w+)', '([rg])', '([^']*)'\)/g)].map((m) => ({ a: MOCK_KEYS[m[1]!] ?? m[1]!, b: MOCK_KEYS[m[2]!] ?? m[2]!, gold: m[3] === 'g', label: m[4]! }));

describe('D28 the Boss\'s board (m5)', () => {
  it('sheet 1 is mockup m5: the same 14 photos, places, tilts, icons and words, and the same 16 strings', () => {
    expect(mockPins).toHaveLength(14);
    const sheet0 = PINS.filter((p) => p.sheet === 0).map(({ id, x, y, r, icon, name, how, cls }) => ({ id, x, y, r, icon, name, how, cls }));
    expect(sheet0).toEqual(mockPins);
    expect(mockEdges).toHaveLength(16);
    expect(EDGES.filter((e) => e.sheet === 0).map(({ a, b, gold, label }) => ({ a, b, gold, label }))).toEqual(mockEdges);
  });

  it('every Dominion page has a photo, and every string joins two photos on its own sheet', () => {
    for (const p of PAGE_IDS) expect(PINS.some((x) => x.id === p), p).toBe(true);
    for (const e of EDGES) {
      expect(PINS.some((x) => x.sheet === e.sheet && x.id === e.a), `${e.a} on sheet ${e.sheet}`).toBe(true);
      expect(PINS.some((x) => x.sheet === e.sheet && x.id === e.b), `${e.b} on sheet ${e.sheet}`).toBe(true);
    }
    // No two photos on a sheet overlap much (104 px wide, ~90 tall).
    for (const s of [0, 1]) {
      const pins = PINS.filter((p) => p.sheet === s);
      for (const a of pins) for (const b of pins) if (a !== b) expect(Math.abs(a.x - b.x) >= 100 || Math.abs(a.y - b.y) >= 100, `${a.id}/${b.id}`).toBe(true);
    }
  });

  it('only the pages the game brings to you cannot be walked into', () => {
    const notJump = PINS.filter((p) => !jumpable(p.id)).map((p) => p.id).sort();
    expect(notJump).toEqual(['debate', 'interrupt', 'police', 'spy']);
    for (const p of PINS.filter((x) => x.reach === 'comes')) expect(p.how).toBe('comes to you');
    // Pages that live inside another one open that one.
    expect(OPENS).toEqual({ morning: 'hq', chair: 'hq', card: 'map', takeover: 'map' });
  });

  it('the arrows walk the photos the way they lie, and stay put at an edge', () => {
    const s0 = PINS.filter((p) => p.sheet === 0);
    const at = (id: PageId): number => s0.findIndex((p) => p.id === id);
    expect(boardMove(0, at('hq'), 'right')).toBe(at('morning'));
    expect(boardMove(0, at('hq'), 'down')).toBe(at('map'));
    expect(boardMove(0, at('hq'), 'up')).toBe(at('title'));
    expect(boardMove(0, at('title'), 'left')).toBe(at('title'));
    expect(boardMove(0, at('map'), 'down')).toBe(at('map'));
    expect(boardMove(1, 99, 'left')).toBe(0);
  });

  it('draws every photo with its own tap, the cursor ring and the right memo per sheet', () => {
    const h = boardView({ sheet: 0, at: 3 });
    for (const p of PINS.filter((x) => x.sheet === 0)) expect(h).toContain(`data-testid="dom-pin-${p.id}"`);
    expect(h).toContain('class="pol on4"');
    expect(h.match(/class="tag4/g)).toHaveLength(mockEdges.filter((e) => e.label).length);
    expect(h).not.toContain('off4');
    const back = boardView({ sheet: 1, at: 0 });
    expect(back).toContain('these come to you');
    expect(back.match(/class="pol off4"/g)).toHaveLength(4);
  });
});

describe('D28 the command wheel (m6)', () => {
  it('has the eight places of m6, clockwise from the top, with their keys', () => {
    const m = [...i3.matchAll(/\('([\w-]+)', '([^']+)', '([^']+)'\)/g)].filter((x) => x[1]!.includes('-')).slice(0, 8).map((x) => [x[1], x[2], x[3]]);
    expect(SPOTS.map((s) => [s.icon, s.name, s.key])).toEqual(m);
  });

  it('every page you can walk into sits under a wheel place (one key from it) or is one', () => {
    // The title is End, from every page (D26).
    for (const p of PAGE_IDS.filter((x) => jumpable(x) && x !== 'title')) expect(spotOf(p), p).not.toBeNull();
    expect(spotOf('settings')).toBe(7);
    expect(spotOf('pyramid')).toBe(2);
    expect(spotOf('desk')).toBe(6);
    expect(spotOf(null)).toBeNull();
  });

  it('points by angle (inside the hub at nothing) and turns with the arrows', () => {
    expect(spotAt(0, -100, 76)).toBe(0);
    expect(spotAt(100, 0, 76)).toBe(2);
    expect(spotAt(0, 100, 76)).toBe(4);
    expect(spotAt(-100, -100, 76)).toBe(7);
    expect(spotAt(10, 10, 76)).toBeNull();
    expect(turn(null, 1, 3)).toBe(3);
    expect(turn(null, -1, null)).toBe(0);
    expect(turn(7, 1, null)).toBe(0);
    expect(turn(0, -1, null)).toBe(7);
  });

  it('keeps the last three pages, newest first, without repeats or pages that come to you', () => {
    let l: PageId[] = [];
    l = pushLast(l, 'hq', 'map');
    l = pushLast(l, 'map', 'crew');
    l = pushLast(l, 'crew', 'ledger');
    l = pushLast(l, 'ledger', 'hq');
    expect(l).toEqual(['ledger', 'crew', 'map']);
    expect(pushLast(l, 'hq', 'crew')).toEqual(['hq', 'ledger', 'map']);
    expect(pushLast(['map'], 'police', 'hq')).toEqual(['map']);
    expect(pushLast(['map'], 'hq', 'map')).toEqual(['hq']);
    expect(pushLast(['map', 'hq'], 'map', 'map')).toEqual(['hq']);
  });

  it('the middle says what waits where you point, from the save', () => {
    const b = block();
    b.phase = 'day';
    b.actions = 2;
    expect(hubLine(b, SPOTS[1]!)).toBe('2 actions left today.');
    b.actions = 1;
    expect(hubLine(b, SPOTS[1]!)).toBe('1 action left today.');
    expect(hubLine(b, SPOTS[4]!)).toBe(DOMINION_DATA.start.lockedTab);
    expect(hubLine(b, SPOTS[2]!)).toBe(`${b.members.length} member${b.members.length === 1 ? '' : 's'} on the roster.`);
    expect(hubLine(b, SPOTS[5]!)).toContain(`Heat ${b.heat}`);
    expect(hubLine(b, SPOTS[7]!)).toBe('Pause, save and Settings.');
    for (const s of SPOTS) expect(hubLine(b, s).length, s.id).toBeGreaterThan(0);
  });

  it('pins what waits: a crew talk, Rotom\'s desk, a rival move (three at most)', () => {
    const b = block();
    b.crew!.talks = [];
    b.crew!.alerts = [];
    expect(pinned(b)).toEqual([]);
    b.crew!.talks = [{ member: b.members[0]!.id, talk: 't', task: null }];
    b.crew!.alerts = [{ kind: 'rival', time: '2:00', text: 'Team Aqua moved into Cerulean City overnight and took the docks' }];
    b.phase = 'morning';
    const p = pinned(b);
    expect(p[0]).toEqual({ icon: 'g-letter', text: `${b.members[0]!.name} wants a word`, go: 'morning' });
    expect(p[1]!.go).toBe('rival');
    expect(p[1]!.text.length).toBeLessThanOrEqual(30);
    for (const x of p) expect(jumpable(x.go), x.go).toBe(true);
  });

  it('draws the ring, the pointed wedge, the dim places and both side lists', () => {
    const h = wheelView({ at: 1, hubName: 'Region Map', hubLine: '2 actions left today.', last: [{ id: 'hq', name: PAGE_NAMES.hq }], pins: [], shut: [4, 7] });
    expect(h).toContain('--wa:22.5deg');
    expect(h).toContain('class="wo on"');
    expect(h.match(/class="wo dim4"/g)).toHaveLength(2);
    expect(h).toContain('data-testid="dom-wheel-last-0"');
    expect(h).toContain('Nothing waits');
    expect(wheelView({ at: null, hubName: 'HQ', hubLine: '', last: [], pins: [], shut: [] })).toContain('wheel idle4');
  });
});

describe('D28 the crimson shutter (m7)', () => {
  it('Effects & motion: Full show plays the blade, Lighter a fade, Calm nothing; reduced motion fades', () => {
    expect(shutterMode('full', false)).toBe('blade');
    expect(shutterMode('full', true)).toBe('fade');
    expect(shutterMode('lighter', false)).toBe('fade');
    expect(shutterMode('calm', false)).toBe('off');
    expect(shutterMode('calm', true)).toBe('off');
  });

  it('wraps the new page, names both pages on the blade, and never takes a tap', () => {
    const h = withShutter('<div class="dom">NEW</div>', { n: 3, mode: 'blade', from: 'Region Map', to: 'Cerulean', ghost: '<div class="gh4"></div>' });
    expect(h.startsWith('<div class="slin4 blade" data-once="shut3s"><div class="dom">NEW</div></div>')).toBe(true);
    expect(h).toContain('<small>REGION MAP ▸</small>CERULEAN');
    expect(h).toContain('pointer-events:none');
    expect(h).toContain('class="shut"');
    const f = withShutter('<p></p>', { n: 4, mode: 'fade', from: 'a', to: 'b', ghost: '' });
    expect(f).not.toContain('class="shut"');
    expect(f).toContain('ghl4 fade');
  });
});

describe('D28 controllers', () => {
  const pad = (held: number[]) => ({ buttons: Array.from({ length: 17 }, (_, i) => held.includes(i)), axes: [0, 0] });
  it('Select held is the pad\'s hold-Q, unless a game action is mapped to Select', () => {
    expect(WHEEL_BUTTON).toBe(8);
    expect(padWheelHeld(pad([8]), DEFAULT_PAD_MAP)).toBe(true);
    expect(padWheelHeld(pad([]), DEFAULT_PAD_MAP)).toBe(false);
    expect(padWheelHeld(pad([9]), DEFAULT_PAD_MAP)).toBe(false);
    expect(padWheelHeld(pad([8]), { ...DEFAULT_PAD_MAP, back: 8 })).toBe(false);
  });
});
