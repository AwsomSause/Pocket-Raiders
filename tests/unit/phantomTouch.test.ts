import { describe, expect, it } from 'vitest';
import { PHANTOM_PHONE_SETTINGS, PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { HOLD_MS, padMode, SWIPE_MAX_MS, SWIPE_MIN_PX, swipeOf, TOUCH_SIZE } from '../../src/core/presentation/touchLayout';
import { changeSetting, SETTINGS } from '../../src/core/settingsRegistry';
import { CURRENT_VERSIONS, DEFAULT_SETTINGS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { pageOf } from '../../src/ui/phantom/kit';
import { phPrompt, PROMPT_SCALE, type PhPromptModel } from '../../src/ui/phantom/screens/prompt';
import { phPops, POP_NOTE_ROOM } from '../../src/ui/phantom/screens/system';
import { content } from './helpers';

// Phantom UI part 6: the Phone page's touch settings (settings v47) and what they steer, the pops that lie over every
// screen (toasts, notices, the song caption) and the interaction prompt's window. All pure.

// The content gate looks for `envelope('settings', 46, …)` to know the v46 -> v47 upgrade has a test.
const envelope = (record: 'settings', v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });
const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;

describe('Phone touch settings (settings v47)', () => {
  it('is the current settings version', () => {
    expect(CURRENT_VERSIONS.settings).toBe(47);
  });

  it('a v46 save gains the four settings at the values the pad already had, and keeps every other setting', () => {
    const storage = new MemoryStorageProvider();
    const { touchButtons: _a, touchButtonSize: _b, swipeToSwitch: _c, holdForDetails: _d, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', envelope('settings', 46, { ...old, uiStyle: 'phantom', phantomVersion: 'velvet', oneHanded: 'left', musicVolume: 0.2 }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded).toMatchObject({ touchButtons: true, touchButtonSize: 'medium', swipeToSwitch: true, holdForDetails: true });
    expect(loaded).toMatchObject({ uiStyle: 'phantom', phantomVersion: 'velvet', oneHanded: 'left', musicVolume: 0.2 });
  });

  it('the choices survive a reload', () => {
    const storage = new MemoryStorageProvider();
    const save = new SaveManager(storage, content);
    save.saveSettings({ ...save.loadSettings(), touchButtons: false, touchButtonSize: 'large', swipeToSwitch: false, holdForDetails: false });
    expect(new SaveManager(storage, content).loadSettings()).toMatchObject({ touchButtons: false, touchButtonSize: 'large', swipeToSwitch: false, holdForDetails: false });
  });

  it('a value that is not a size falls back to a readable one instead of breaking the save', () => {
    const storage = new MemoryStorageProvider();
    const save = new SaveManager(storage, content);
    storage.set('pkr.settings', envelope('settings', 47, { ...save.loadSettings(), touchButtonSize: 'huge', musicVolume: 0.2 }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(Object.keys(TOUCH_SIZE)).toContain(loaded.touchButtonSize);
  });

  it('each has a row in Settings that changes it, and the size waits while the pad is off', () => {
    const def = (id: string) => SETTINGS.find((d) => d.id === id)!;
    for (const id of ['touchButtons', 'swipeToSwitch', 'holdForDetails'] as const) {
      expect(def(id).show(DEFAULT_SETTINGS)).toBe('On');
      expect(changeSetting(DEFAULT_SETTINGS, id)[id]).toBe(false);
    }
    const sizes: string[] = [];
    let s = DEFAULT_SETTINGS;
    for (let k = 0; k < 3; k++) { s = changeSetting(s, 'touchButtonSize'); sizes.push(s.touchButtonSize); }
    expect(sizes).toEqual(['large', 'small', 'medium']);
    expect(def('touchButtonSize').disabled?.({ ...DEFAULT_SETTINGS, touchButtons: false })).toBe(true);
    expect(def('touchButtonSize').disabled?.(DEFAULT_SETTINGS)).toBe(false);
  });

  it("the Phone page leads with the mock-up's six rows, in its order, and every id is a real setting", () => {
    expect(PHANTOM_PHONE_SETTINGS.slice(0, 6)).toEqual(['touchButtons', 'touchButtonSize', 'oneHanded', 'swipeToSwitch', 'holdForDetails', 'haptics']);
    for (const id of PHANTOM_PHONE_SETTINGS) expect(SETTINGS.some((d) => d.id === id), id).toBe(true);
  });
});

describe('what the touch settings steer', () => {
  const phone = { width: 800, height: 380, coarse: true }, desk = { width: 1400, height: 900, coarse: false };

  it('Touch buttons off hides the pad everywhere; on leaves the pad where it was', () => {
    expect(padMode(phone)).toBe('side');
    expect(padMode(phone, true)).toBe('side');
    expect(padMode(phone, false)).toBe('off');
    expect(padMode({ width: 500, height: 900, coarse: true }, false)).toBe('off');
    expect(padMode(desk, true)).toBe('off');
  });

  it('the sizes go from smaller to bigger around the usual size', () => {
    expect(TOUCH_SIZE.medium).toBe(1);
    expect(TOUCH_SIZE.small).toBeLessThan(1);
    expect(TOUCH_SIZE.large).toBeGreaterThan(1);
  });

  it('a quick sideways stroke is a swipe: left for the next one, right for the one before', () => {
    expect(swipeOf(-120, 10, 200)).toBe('next');
    expect(swipeOf(120, -10, 200)).toBe('prev');
    expect(swipeOf(-SWIPE_MIN_PX, 0, SWIPE_MAX_MS)).toBe('next');
  });

  it('a tap, a slow drag, a scroll and a slanted stroke are not swipes', () => {
    expect(swipeOf(0, 0, 80)).toBeNull();
    expect(swipeOf(-(SWIPE_MIN_PX - 1), 0, 100)).toBeNull();
    expect(swipeOf(-200, 0, SWIPE_MAX_MS + 1)).toBeNull();
    expect(swipeOf(10, 200, 150)).toBeNull();
    expect(swipeOf(-100, 60, 150)).toBeNull();
    expect(swipeOf(-200, 0, Number.NaN)).toBeNull();
    expect(swipeOf(-200, 0, -5)).toBeNull();
  });

  it('a hold is longer than a tap', () => {
    expect(HOLD_MS).toBeGreaterThan(200);
  });
});

describe('the pops over every screen', () => {
  const toast = (open = false) => ({ id: 3, kicker: 'Rare achievement', title: 'First <Steps>', art: null, lines: ['Win a battle.', 'Reward: 50 coins'], open });

  it('nothing showing is no page at all', () => {
    expect(phPops(ph, { notices: [], toasts: [], caption: '' })).toBe('');
  });

  it('a toast is a card that a tap opens; its words are escaped', () => {
    const shut = phPops(ph, { notices: [], toasts: [toast()], caption: '' });
    expect(pageOf(shut)).toBe('pops');
    expect(shut).toContain('data-act="toast" data-arg="3"');
    expect(shut).toContain('Rare achievement');
    expect(shut).toContain('First &lt;Steps&gt;');
    expect(shut).not.toContain('Win a battle.');
    const open = phPops(ph, { notices: [], toasts: [toast(true)], caption: '' });
    expect(open).toContain('Win a battle.');
    expect(open).toContain('Reward: 50 coins');
    expect(count(open, 'ph-nt-more')).toBe(0);
  });

  it('notices stack under the toasts, the newest bright, each sent away by a tap; a long one is cut', () => {
    const long = 'x'.repeat(POP_NOTE_ROOM + 40);
    const html = phPops(ph, { notices: [{ id: 9, head: 'Rival', text: 'Kieran beat Gym 2.' }, { id: 8, head: 'Notice', text: long }], toasts: [toast()], caption: '' });
    expect(count(html, 'class="pn ph-nt-n')).toBe(2);
    expect(count(html, 'ph-nt-n new')).toBe(1);
    expect(html.indexOf('ph-nt-t')).toBeLessThan(html.indexOf('ph-nt-n'));
    expect(html).toContain('data-act="notice" data-arg="9"');
    expect(html).toContain('…');
    expect(html).not.toContain(long);
  });

  it('the song caption is a strip of its own that takes no tap', () => {
    const html = phPops(ph, { notices: [], toasts: [], caption: 'Pallet <Town>' });
    expect(html).toContain('ph-nt-song');
    expect(html).toContain('Pallet &lt;Town&gt;');
    expect(html).not.toContain('data-act');
    expect(html).not.toContain('ph-nt-stack');
  });
});

describe("the interaction prompt's window", () => {
  const base = { label: 'Skill <throw>', words: 'Press Enter when the bar is in the gold zone.', result: null, box: { left: 300, top: 160, w: 360, h: 220 } };
  const at = (v: number): string => `${Math.round(v * PROMPT_SCALE)}px`;

  it('a timing bar shows how full it is and where the zone lies, on the game box scaled to the page', () => {
    const html = phPrompt({ ...base, kind: 'timing', k: 0.5, zone: [0.6, 0.8] });
    expect(pageOf(html)).toBe('prompt');
    expect(html).toContain('Skill &lt;throw&gt;');
    expect(html).toContain('width:50.0%');
    expect(html).toContain('left:60.0%;width:20.0%');
    expect(html).toContain(`left:${at(300)}`);
    expect(html).toContain(`width:${at(360)}`);
    expect(html).toContain('(Esc skips)');
    expect(html).toContain('ph-pr-hit');
  });

  it('a bar that runs past its end, or has no number yet, stays inside the card', () => {
    expect(phPrompt({ ...base, kind: 'hold', k: 7, zone: [0.9, 1.4] })).toContain('width:100.0%');
    expect(phPrompt({ ...base, kind: 'hold', k: -1, zone: [0.2, 0.1] })).toContain('width:0.0%');
    expect(phPrompt({ ...base, kind: 'timing', k: Number.NaN, zone: [0.2, 0.4] })).toContain('<i style="width:0.0%">');
  });

  it('the tap mark waits, then lights; the rhythm line has a mark per beat; the shout bars rise with the voice', () => {
    expect(phPrompt({ ...base, kind: 'tap', ready: false })).not.toContain('ph-pr-tap on');
    expect(phPrompt({ ...base, kind: 'tap', ready: true })).toContain('ph-pr-tap on');
    const beat = phPrompt({ ...base, kind: 'rhythm', beats: [0.2, 0.4, 0.6, 0.85], at: 0.4, hit: true });
    expect(count(beat, '<u style="left:')).toBe(4);
    expect(beat).toContain('class="hit"');
    const quiet = phPrompt({ ...base, kind: 'shout', level: 0, bars: [20, 40] }), loud = phPrompt({ ...base, kind: 'shout', level: 1, bars: [20, 40] });
    expect(quiet).toContain('ph-pr-dim');
    expect(quiet).toContain(`height:${at(40 * 0.3)}`);
    expect(loud).toContain(`height:${at(40)}`);
  });

  it("the drag field sits on the game's own box, so the finger lands where it is drawn; the line shows only while dragging", () => {
    const still = phPrompt({ ...base, kind: 'drag', from: [15, 80], to: [80, 25], end: null });
    expect(still).toContain(`class="ph-pr-field" style="left:${at(300)};top:${at(160)};width:${at(360)};height:${at(220)}"`);
    expect(still).not.toContain('<line');
    expect(count(still, '<u class="')).toBe(2);
    const drawn = phPrompt({ ...base, kind: 'drag', from: [15, 80], to: [80, 25], end: [50, 50] });
    expect(drawn).toContain('<line');
    expect(count(drawn, '<u class="')).toBe(3);
  });

  it('the verdict takes the place of the name', () => {
    const m: PhPromptModel = { ...base, kind: 'tap', ready: true, result: { word: 'PERFECT', color: '#9fe8ff' } };
    const html = phPrompt(m);
    expect(html).toContain('PERFECT');
    expect(html).toContain('color:#9fe8ff');
    expect(html).not.toContain('ph-pr-lab');
  });
});
