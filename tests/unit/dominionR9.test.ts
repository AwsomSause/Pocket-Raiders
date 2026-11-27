// DOMINION redesign R9 (pass 50): the look settings (settings v48) and their migration, the page root carrying them, the
// Settings pages keeping their test ids, and the wheel in the new look.
import { describe, expect, it } from 'vitest';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import { DominionPrefsSchema, LOOK_DEFAULT, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { SettingsSchema } from '../../src/core/state';
import { CURRENT_VERSIONS, DEFAULT_SETTINGS, MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { r5SetLook } from '../../src/ui/redux/screens/dominion/r50/kit';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { r5Calm, r5Save, r5SetHome, r5SetPage, r5Skins, r5Vault, rowsHtml, type R5Row } from '../../src/ui/redux/screens/dominion/r50/settings';
import { r5Wheel } from '../../src/ui/redux/screens/dominion/r50/wheel';
import { content } from './helpers';

const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'r9', seed: 'r9', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run.expansion!.dominion!;
};

/** Writes a settings envelope at an older version, the way an older build left it. */
function oldRecord(version: number, edit: (data: Record<string, any>) => void) {
  const storage = new MemoryStorageProvider();
  new SaveManager(storage, content).saveSettings(DEFAULT_SETTINGS);
  const key = [...(storage as unknown as { data: Map<string, string> }).data.keys()].find((k) => k.includes('settings'))!;
  const env = JSON.parse(storage.get(key)!);
  env.schemaVersion = version;
  edit(env.data);
  storage.set(key, JSON.stringify(env));
  return storage;
}

describe('R9 settings v48: the Dominion look', () => {
  it('the settings record is at v48', () => {
    expect(CURRENT_VERSIONS.settings).toBe(49);
  });

  it('a v45 record without a look loads with the default look and keeps everything else', () => {
    const storage = oldRecord(45, (d) => { delete d.expansion.dominionPrefs.look; d.expansion.dominionPrefs.showOdds = false; d.musicVolume = 0.2; });
    const s = new SaveManager(storage, content).loadSettings();
    expect(s.expansion.dominionPrefs.look).toEqual(LOOK_DEFAULT);
    expect(s.expansion.dominionPrefs.showOdds).toBe(false);
    expect(s.musicVolume).toBe(0.2);
  });

  it('a v47 record with half a look keeps its values and fills the rest (boundary)', () => {
    const storage = oldRecord(47, (d) => { d.expansion.dominionPrefs.look = { ticker: 'off', colour: 'shapes' }; });
    const look = new SaveManager(storage, content).loadSettings().expansion.dominionPrefs.look;
    expect(look).toEqual({ ...LOOK_DEFAULT, ticker: 'off', colour: 'shapes' });
  });

  it('the step leaves a record with no Dominion prefs alone', () => {
    expect(MIGRATIONS.settings[47]!({ musicVolume: 0.5 } as never)).toEqual({ musicVolume: 0.5 });
  });

  it('a changed look saves and loads back the same', () => {
    const storage = new MemoryStorageProvider();
    const p = DEFAULT_SETTINGS.expansion.dominionPrefs;
    const changed = { ...DEFAULT_SETTINGS, expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: { ...p, look: { ...p.look, readAloud: true, voiceRate: 'fast' as const, frame: 'gold' as const, skin: 'johto' as const, cursor: 'ball' as const } } } };
    new SaveManager(storage, content).saveSettings(changed);
    expect(new SaveManager(storage, content).loadSettings().expansion.dominionPrefs.look).toEqual(changed.expansion.dominionPrefs.look);
  });

  it('rejects a bad look value (failure case)', () => {
    const p = DEFAULT_SETTINGS.expansion.dominionPrefs;
    expect(() => SettingsSchema.parse({ ...DEFAULT_SETTINGS, expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: { ...p, look: { ...p.look, frame: 'neon' } } } })).toThrow();
    expect(() => DominionPrefsSchema.parse({ look: { sparkle: true } })).toThrow();
  });
});

describe('R9 pages', () => {
  const b = block();
  const run = r5RunOf(b, []);
  const rows: R5Row[] = [
    { label: 'Heat warnings', ctl: { k: 'sw', on: true } },
    { label: 'News ticker', ctl: { k: 'seg', opts: [{ label: 'On', on: true }, { label: 'Quiet', on: false }, { label: 'Off', on: false }] } },
  ];

  it('the look reaches the page root', () => {
    r5SetLook({ ...LOOK_DEFAULT, keyHints: 'icons', colour: 'shapes', frame: 'gold', skin: 'johto' }, 'kanto');
    const html = r5SetHome([{ id: 'dominion', name: 'Dominion', icon: 'g-dark-gem', about: 'Run rules' }], 0, run);
    expect(html).toContain('data-keys="icons"');
    expect(html).toContain('data-colour="shapes"');
    expect(html).toContain('data-frame="gold"');
    expect(html).toContain('sk-johto');
    r5SetLook(LOOK_DEFAULT, 'kanto');
  });

  it('the home, a category, Save, Calm, skins and the vault keep their test ids', () => {
    const home = r5SetHome([{ id: 'dominion', name: 'Dominion', icon: 'g-dark-gem', about: '' }, { id: 'rotom', name: 'Rotom', icon: 'g-xtransceiver', about: '' }], 1, run);
    expect(home).toContain('data-testid="r5-set"');
    expect(home).toMatch(/class="[^"]*\bon\b[^"]*"[^>]*data-testid="r5-set-tile-rotom"|data-testid="r5-set-tile-rotom"[^>]*class="[^"]*\bon\b/);
    const page = r5SetPage({ cats: [{ id: 'dominion', name: 'Dominion', icon: 'g-dark-gem' }], cat: 0, rows, row: 1, preview: '', pid: 'setdom', notice: null }, run);
    for (const id of ['r5-setdom', 'dom-set-row-0', 'dom-set-row-1', 'dom-set-cat-dominion', 'dom-set-list', 'dom-set-preview']) expect(page, id).toContain(`data-testid="${id}"`);
    expect(rowsHtml(rows, 1, 8)).toContain('Quiet');
    expect(r5Save({ boss: 'Boss', team: 'Nova', lines: [], crew: [], slot: 1, at: 0, notice: null }, run)).toContain('data-testid="r5-save-2"');
    expect(r5Calm(true, [['Motion', 'Off']], run)).toContain('data-testid="r5-calm-state"');
    expect(r5Skins([{ id: 'johto', name: 'Johto', icon: '', about: '', sky: '', open: true, on: false }], rows, 0, run)).toContain('data-testid="r5-skin-johto"');
    expect(r5Vault([{ id: 'k1', name: 'Card', orb: 'Adamant Orb', legend: 'dialga', state: 'Ready', inUse: true, usedUp: false }], 0, run)).toContain('data-testid="r5-vault-k1"');
  });

  it('no page says Claude or AI', () => {
    const all = r5SetHome([{ id: 'rotom', name: 'Rotom', icon: 'g-xtransceiver', about: 'Rotom helps' }], 0, run) + r5SetPage({ cats: [{ id: 'rotom', name: 'Rotom', icon: '' }], cat: 0, rows, row: 0, preview: '', pid: 'rotom', notice: null }, run);
    expect(all.replace(/<[^>]+>/g, ' ')).not.toMatch(/Claude|\bAI\b/);
  });

  it('the wheel keeps D28 test ids and marks the pointed spot', () => {
    const html = r5Wheel({ spots: [{ name: 'HQ', icon: 'g-dark-gem', key: '1', dim: false }, { name: 'Ops', icon: 'g-dark-gem', key: '2', dim: true }], at: 1, hubName: 'Nova', hubLine: 'Where to?', last: [{ go: 'hq', name: 'HQ', icon: '' }], pins: [] }, run);
    for (const id of ['dom-wheel', 'dom-wheel-spot-0', 'dom-wheel-spot-1', 'dom-wheel-hub', 'dom-wheel-last-0']) expect(html, id).toContain(`data-testid="${id}"`);
    expect(html).toMatch(/class="dl on dim4"/);
  });
});
