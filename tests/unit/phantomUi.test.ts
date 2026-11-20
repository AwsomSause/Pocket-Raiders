import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { changeSetting, SETTINGS } from '../../src/core/settingsRegistry';
import { nextPhantomVersion, PHANTOM_PHONE_SETTINGS, PHANTOM_SETTINGS_PAGES, PHANTOM_VERSION_IDS, PHANTOM_VERSIONS, phantomVersion, type PhantomVersionId } from '../../src/core/presentation/phantom';
import { applyPhantomPreset, PHANTOM_PRESETS, phantomPresetOf } from '../../src/core/presentation/phantomPresets';
import { CURRENT_VERSIONS, DEFAULT_SETTINGS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { pageOf, ransom } from '../../src/ui/phantom/kit';
import { phSettings, type PhSettingsModel } from '../../src/ui/phantom/screens/settings';
import { titleView, type TitleModel } from '../../src/ui/redux/screens/title';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { content } from './helpers';

// The Phantom UI (Settings > Display > UI style > Phantom): the setting and its save upgrade, the three presets,
// and the Title and Settings pages, which are pure functions from a model to HTML.

const envelope = (v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: v, savedAt: '', data });
const ph = PHANTOM_VERSIONS[0]!;
const ctx = (on: boolean): ReduxCtx => ({ k: 0, skin: {} as ReduxCtx['skin'], v: () => 0, ph: on ? ph : null });
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;

describe('Phantom UI setting (settings v46)', () => {
  it('is the current settings version', () => {
    expect(CURRENT_VERSIONS.settings).toBe(46);
  });

  it('a v45 save gains the first version and keeps its style and every other setting', () => {
    const storage = new MemoryStorageProvider();
    const { phantomVersion: _p, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', envelope(45, { ...old, uiStyle: 'old', reduxSkin: 'cGear', musicVolume: 0.2 }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.phantomVersion).toBe('phantom');
    expect(loaded.uiStyle).toBe('old');
    expect(loaded.reduxSkin).toBe('cGear');
    expect(loaded.musicVolume).toBe(0.2);
  });

  it('a chosen style and version survive a reload', () => {
    const storage = new MemoryStorageProvider();
    const save = new SaveManager(storage, content);
    save.saveSettings({ ...save.loadSettings(), uiStyle: 'phantom', phantomVersion: 'velvet' });
    const again = new SaveManager(storage, content).loadSettings();
    expect([again.uiStyle, again.phantomVersion]).toEqual(['phantom', 'velvet']);
  });

  it('a broken version name in a save falls back to the first version instead of losing the settings', () => {
    expect(phantomVersion('nope').id).toBe('phantom');
    expect(phantomVersion(undefined).id).toBe('phantom');
  });

  it('UI style steps New, Phantom, Old and round again; the version row only works in Phantom', () => {
    let s = { ...DEFAULT_SETTINGS };
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) { s = changeSetting(s, 'uiStyle'); seen.push(s.uiStyle); }
    expect(seen).toEqual(['phantom', 'old', 'new']);
    expect(changeSetting(DEFAULT_SETTINGS, 'phantomVersion')).toBe(DEFAULT_SETTINGS);
    const on = { ...DEFAULT_SETTINGS, uiStyle: 'phantom' as const };
    expect(changeSetting(on, 'phantomVersion').phantomVersion).toBe('midnight');
  });

  it('the five versions go round in order and each names a player trainer', () => {
    let v: PhantomVersionId = PHANTOM_VERSION_IDS[0];
    const order = PHANTOM_VERSION_IDS.map(() => (v = nextPhantomVersion(v)));
    expect(order).toEqual(['midnight', 'channel', 'fantasia', 'velvet', 'phantom']);
    expect(PHANTOM_VERSIONS.map((x) => x.heroName)).toEqual(['Red', 'Blue', 'Hilda', 'Green', 'Nate']);
  });

  it('every Settings page of the Phantom UI is a real group, and the Phone page lists real settings', () => {
    const ids = new Set(SETTINGS.map((d) => d.id));
    for (const id of PHANTOM_PHONE_SETTINGS) expect(ids.has(id), id).toBe(true);
    const groups = new Set<string>([...SETTINGS.map((d) => d.category), 'data', 'phone']);
    for (const p of PHANTOM_SETTINGS_PAGES) expect(groups.has(p.id), p.id).toBe(true);
    // No game group is left without a page.
    for (const c of new Set(SETTINGS.map((d) => d.category))) expect(PHANTOM_SETTINGS_PAGES.some((p) => p.id === c), c).toBe(true);
    expect(new Set(PHANTOM_SETTINGS_PAGES.map((p) => p.letter)).size).toBe(PHANTOM_SETTINGS_PAGES.length);
  });
});

describe('Phantom UI presets', () => {
  it('the starting settings are the Standard preset', () => {
    expect(phantomPresetOf(DEFAULT_SETTINGS, DEFAULT_SETTINGS)).toBe('standard');
  });

  it('each preset is recognised after it is applied, from any other preset', () => {
    for (const a of PHANTOM_PRESETS) for (const b of PHANTOM_PRESETS) {
      expect(phantomPresetOf(applyPhantomPreset(applyPhantomPreset(DEFAULT_SETTINGS, a.id, DEFAULT_SETTINGS), b.id, DEFAULT_SETTINGS), DEFAULT_SETTINGS)).toBe(b.id);
    }
  });

  it('a preset leaves keys, sound, the look and gameplay alone', () => {
    const mine = { ...DEFAULT_SETTINGS, musicVolume: 0.1, sfxVolume: 0.3, muted: true, uiStyle: 'phantom' as const, phantomVersion: 'channel' as const, textSpeed: 'slow' as const, battleSpeed: DEFAULT_SETTINGS.battleSpeed };
    const calm = applyPhantomPreset(mine, 'calm', DEFAULT_SETTINGS);
    expect([calm.musicVolume, calm.sfxVolume, calm.muted, calm.uiStyle, calm.phantomVersion, calm.textSpeed]).toEqual([0.1, 0.3, true, 'phantom', 'channel', 'slow']);
    expect(calm.gamepadMap).toEqual(mine.gamepadMap);
    expect(calm.expansion).toEqual(mine.expansion);
    expect([calm.reducedFlash, calm.battleAnimations, calm.shakeHits]).toEqual([true, 'reduced', 0]);
  });

  it('changing one of its settings by hand leaves no preset lit', () => {
    expect(phantomPresetOf({ ...DEFAULT_SETTINGS, reducedFlash: !DEFAULT_SETTINGS.reducedFlash }, DEFAULT_SETTINGS)).toBe(null);
  });
});

describe('Phantom UI Title', () => {
  const model = (over: Partial<TitleModel> = {}): TitleModel => ({ options: [{ label: 'Continue', disabled: true }, { label: 'New Run' }, { label: '<b>Settings</b>' }], index: 1, version: 'Beta 0.7', art: '', notes: [], ...over });

  it('the New UI draws its own Title while Phantom is off', () => {
    expect(pageOf(titleView(ctx(false), model()))).toBe(null);
  });

  it('the splash waits for a button and names the version', () => {
    const html = titleView(ctx(true), model({ press: true }));
    expect(pageOf(html)).toBe('title');
    expect(html).toContain('data-act="start"');
    expect(html).toContain('Red VERSION');
    expect(html).toContain('data-act="version"');
    expect(html).not.toContain('data-act="pick"');
  });

  it('the menu shows every option once, lights the chosen one and dims a disabled one', () => {
    const html = titleView(ctx(true), model());
    expect(pageOf(html)).toBe('menu');
    expect(count(html, 'class="blade')).toBe(3);
    expect(html).toContain('class="blade on" style="--i:1" data-act="pick" data-arg="1"');
    expect(html).toContain('class="blade off" style="--i:0"');
    expect(html).not.toContain('<b>Settings</b>');
    expect(html).toContain('&lt;b&gt;Settings&lt;/b&gt;');
  });

  it('save warnings take the card beside the menu', () => {
    const html = titleView(ctx(true), model({ notes: ['Your saved run could not be loaded.'], save: { title: 'Slot 1', lines: ['x'] } }));
    expect(html).toContain('Your saved run could not be loaded.');
    expect(html).not.toContain('Slot 1');
  });

  it('cut-out letters are the same every time and keep the word readable', () => {
    expect(ransom('POCKET')).toBe(ransom('POCKET'));
    expect(ransom('A<B')).toContain('aria-label="A&lt;B"');
  });
});

describe('Phantom UI Settings', () => {
  const base: PhSettingsModel = { kind: 'page', from: 'TITLE', title: 'Look', tiles: [], presets: PHANTOM_PRESETS.map((p) => ({ n: p.n, about: p.about, meters: p.meters })), preset: 1, rail: PHANTOM_SETTINGS_PAGES.map((p) => ({ label: p.n, letter: p.letter })), at: 2,
    rows: Array.from({ length: 12 }, (_, i) => ({ label: `Row ${i}`, value: i === 0 ? 'On' : i === 1 ? '70%' : i === 2 ? 'Full  · next battle' : 'Word' })), index: 0, help: 'Help <here>', options: { list: ['A', 'B'], on: 1 } };

  it('home: three presets with the one in use lit, a tile per page, and the other entries as buttons', () => {
    const tiles = PHANTOM_SETTINGS_PAGES.map((p) => ({ label: p.n, letter: p.letter, about: p.about, changed: p.id === 'audio' ? 2 : 0 }));
    const rows = [...tiles.map((t) => ({ label: t.label, value: '' })), { label: 'Game Summary', value: '' }, { label: 'Back', value: '' }];
    const html = phSettings(ph, { ...base, kind: 'home', tiles, rows, index: 11 });
    expect(pageOf(html)).toBe('set');
    expect(count(html, /class="ps[ "]/)).toBe(3);
    expect(html).toContain('class="ps on" style="--i:1" data-act="preset" data-arg="1"');
    expect(count(html, /class="c8[ "]/)).toBe(10);
    expect(html).toContain('2 changed');
    expect(html).toContain('class="key on" data-act="pick" data-arg="11"');
  });

  it('a page: six rows follow the cursor, and every row can be reached by scrolling', () => {
    const seen = new Set<string>();
    for (let index = 0; index < 12; index++) {
      const html = phSettings(ph, { ...base, index });
      expect(count(html, /class="sr[ "]/)).toBe(6);
      expect(html).toContain(`class="sr on" style="--i:${index < 2 ? index : index > 8 ? index - 6 : 2}"`);
      for (const m of html.matchAll(/data-arg="(\d+)" data-over="over"/g)) seen.add(m[1]!);
    }
    expect(seen.size).toBe(12);
  });

  it('a page: a switch, a bar and a cycling word, with the "next battle" note kept', () => {
    const html = phSettings(ph, base);
    expect(html).toContain('<i class="a">ON</i><i class="">OFF</i>');
    expect(html).toContain('<i style="width:70%"></i>');
    expect(html).toContain('<span class="v cyc">Full<small class="ph-note">next battle</small></span>');
    expect(html).toContain('Help &lt;here&gt;');
    expect(html).toContain('SETTINGS · 3 OF 10');
  });

  it('a page: the chosen setting\'s values show with the one in use lit', () => {
    const html = phSettings(ph, base);
    expect(html).toContain('<div class=""><b>A</b></div><div class="on"><b>B</b></div>');
  });
});

describe('Phantom UI rules file', () => {
  const css = readFileSync('src/ui/phantom/phantom.gen.css', 'utf8');
  it('is scoped to the Phantom layer and carries no mock-up viewer rules', () => {
    expect(css).not.toMatch(/\.vw-/);
    expect(css).not.toMatch(/(^|[\s,}])\.p\d+[\s.[{:,]/m);
    for (const line of css.split('\n')) if (line && !line.startsWith('/*') && !line.startsWith('@')) expect(line.startsWith('.phx'), line.slice(0, 60)).toBe(true);
  });
  it('gives every animation its own ph- name', () => {
    for (const m of css.matchAll(/@keyframes ([\w-]+)/g)) expect(m[1]!.startsWith('ph-'), m[1]).toBe(true);
  });
});
