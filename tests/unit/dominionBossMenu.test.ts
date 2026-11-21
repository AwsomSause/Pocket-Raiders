// DOMINION slice D27: the Boss Menu (v4 m1) and Settings · Dominion (m2): the run rules (stamped on a new run; Day pace
// scales Heat and Tension rises, Hero pressure scales Threat), Effects & motion resolved against the game's own Motion
// settings, and the settings record and old blocks loading without a bump.
import { describe, expect, it } from 'vitest';
import { bossMenuModel, BLADES } from '../../src/core/dominion/bossMenu';
import { fxClasses, fxOf, presetFx } from '../../src/core/dominion/fx';
import { addHeat } from '../../src/core/dominion/field';
import { addTension } from '../../src/core/dominion/rivals';
import { threatOf } from '../../src/core/dominion/hero';
import { betrayalFactor, heroFactor, paced, paceFactor, rulesFromPrefs, rulesOf, SETTINGS_DATA, SIX_OPEN } from '../../src/core/dominion/rules';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, DominionPrefsSchema, RUN_RULES_DEFAULT, type DominionBlock, type DominionSetup, type RunRules } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState, Settings } from '../../src/core/state';
import { SettingsSchema } from '../../src/core/state';
import { DEFAULT_SETTINGS, SaveManager, CURRENT_VERSIONS } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { bossMenuView, settingsPageView } from '../../src/ui/redux/screens/dominion/bossMenu';
import { cardView } from '../../src/ui/redux/screens/dominion/fieldViews';
import { cardModel, gridPages } from '../../src/core/dominion/fieldScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { content } from './helpers';

const domRun = (seed = 'd27'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const setup = (rules?: RunRules): DominionSetup => ({ types: ['poison', 'dark'], member: 'grunt', look: 0, ...(rules ? { rules } : {}) });
const started = (rules?: RunRules): DominionBlock => {
  const out = startInRun(content, domRun(), setup(rules));
  expect(out.problem).toBeNull();
  return out.run.expansion!.dominion!;
};
const withRules = (r: Partial<RunRules>): DominionBlock => started({ ...RUN_RULES_DEFAULT, ...r });
const set = (o: Partial<Settings>, fx: Partial<Settings['expansion']['dominionPrefs']['fx']> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  ...o,
  expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: { ...DEFAULT_SETTINGS.expansion.dominionPrefs, fx: { ...DEFAULT_SETTINGS.expansion.dominionPrefs.fx, ...fx } } },
});
const district = (b: DominionBlock): string => Object.keys(b.field.districts)[0]!;

describe('D27 run rules', () => {
  it('a run started without rules plays at Normal: nothing in the block, every factor 1', () => {
    const b = started();
    expect(b.rules).toBeUndefined();
    expect(rulesOf(b)).toEqual(RUN_RULES_DEFAULT);
    expect([paceFactor(b), heroFactor(b), betrayalFactor(b)]).toEqual([1, 1, 1]);
    expect(paced(b, 7)).toBe(7);
  });

  it('the rules are stamped on the block and survive a save round trip', () => {
    const b = withRules({ pace: 'ruthless', hero: 'high', betrayals: 'off' });
    expect(b.rules).toEqual({ length: 'three', pace: 'ruthless', hero: 'high', betrayals: 'off' });
    expect(DominionBlockSchema.parse(JSON.parse(JSON.stringify(b))).rules).toEqual(b.rules);
    expect(betrayalFactor(b)).toBe(0);
  });

  it('Day pace scales rises in Heat and Tension, never falls', () => {
    const calm = withRules({ pace: 'calm' }), normal = started(), ruthless = withRules({ pace: 'ruthless' });
    const heat = (b: DominionBlock, n: number): number => { const d = district(b); const was = b.field.districts[d]!.heat; addHeat(b, d, n); return b.field.districts[d]!.heat - was; };
    expect(heat(normal, 20)).toBe(20);
    expect(heat(calm, 20)).toBe(Math.round(20 * SETTINGS_DATA.pace.calm));
    expect(heat(ruthless, 20)).toBe(Math.round(20 * SETTINGS_DATA.pace.ruthless));
    // Falls are untouched.
    expect(heat(calm, -10)).toBe(-10);
    const team = Object.keys(ruthless.rivals?.teams ?? {})[0];
    if (team) {
      expect(addTension(ruthless, team, 10)).toBe(Math.round(10 * SETTINGS_DATA.pace.ruthless));
      expect(addTension(calm, team, 10)).toBe(Math.round(10 * SETTINGS_DATA.pace.calm));
    }
  });

  it('Hero pressure scales Threat; Normal keeps the old value exactly; 100 stays the top', () => {
    const lo = withRules({ hero: 'low' }), mid = started(), hi = withRules({ hero: 'high' });
    for (const b of [lo, mid, hi]) { addHeat(b, district(b), 40); b.hero!.harm = 3; }
    const base = threatOf(mid);
    expect(base).toBeGreaterThan(0);
    // Threat is a weighted sum before rounding, so the scaled value is within one point of base × factor.
    expect(threatOf(hi)).toBeGreaterThan(base);
    expect(Math.abs(threatOf(hi) - base * SETTINGS_DATA.hero.high)).toBeLessThanOrEqual(1);
    expect(threatOf(lo)).toBeLessThan(base);
    hi.hero!.harm = 500;
    expect(threatOf(hi)).toBe(100);
  });

  it('Six regions cannot be picked before the Crossing: a saved Six starts a Three run', () => {
    expect(SIX_OPEN).toBe(false);
    const p = DominionPrefsSchema.parse({ run: { ...RUN_RULES_DEFAULT, length: 'six', pace: 'calm' } });
    expect(rulesFromPrefs(p)).toEqual({ ...RUN_RULES_DEFAULT, length: 'three', pace: 'calm' });
  });

  it('a bad rule in a block is rejected (failure case)', () => {
    const b = started();
    expect(() => DominionBlockSchema.parse({ ...b, rules: { ...RUN_RULES_DEFAULT, pace: 'frantic' } })).toThrow();
  });
});

describe('D27 settings record', () => {
  it('an older settings record without dominionPrefs loads with the defaults (no version bump)', () => {
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveSettings(DEFAULT_SETTINGS);
    const key = [...(storage as unknown as { data: Map<string, string> }).data.keys()].find((k) => k.includes('settings'))!;
    const env = JSON.parse(storage.get(key)!);
    expect(env.schemaVersion).toBe(CURRENT_VERSIONS.settings);
    delete env.data.expansion.dominionPrefs;
    storage.set(key, JSON.stringify(env));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.expansion.dominionPrefs).toEqual(DominionPrefsSchema.parse({}));
    expect(loaded.expansion.dominionPrefs).toMatchObject({ showOdds: true, autoEndDay: false, fx: { level: 'full', cutIns: 'show' } });
  });

  it('a changed record saves and loads back the same', () => {
    const storage = new MemoryStorageProvider();
    const sm = new SaveManager(storage, content);
    const s = set({}, presetFx('calm'));
    const changed = { ...s, expansion: { ...s.expansion, dominionPrefs: { ...s.expansion.dominionPrefs, showOdds: false, run: { ...RUN_RULES_DEFAULT, hero: 'high' as const } } } };
    sm.saveSettings(changed);
    expect(new SaveManager(storage, content).loadSettings().expansion.dominionPrefs).toEqual(changed.expansion.dominionPrefs);
  });

  it('rejects a bad Effects value (failure case)', () => {
    expect(() => SettingsSchema.parse({ ...DEFAULT_SETTINGS, expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: { ...DEFAULT_SETTINGS.expansion.dominionPrefs, fx: { ...DEFAULT_SETTINGS.expansion.dominionPrefs.fx, flashes: 'strobe' } } } })).toThrow();
  });
});

describe('D27 Effects & motion', () => {
  it('Full show plays everything; the presets turn things down', () => {
    expect(fxOf(set({}))).toMatchObject({ level: 'full', particles: true, cutIns: true, shake: true, flashes: 'on', linked: false });
    expect(fxClasses(fxOf(set({})))).toBe('fx-full');
    expect(fxOf(set({}, presetFx('lighter')))).toMatchObject({ level: 'lighter', particles: false, cutIns: true, flashes: 'soft' });
    expect(fxOf(set({}, presetFx('calm')))).toMatchObject({ level: 'calm', particles: false, cutIns: false, shake: false, flashes: 'off', linked: false });
    expect(fxClasses(fxOf(set({}, presetFx('calm'))))).toBe('fx-calm fx-nopart fx-noshake fx-flash-off');
  });

  it('follows the game: animations off or Reduced Motion force Calm; reduced battle motion caps at Lighter', () => {
    for (const o of [{ disableAllAnimations: true }, { menuAnimations: false }, { battleAnimations: 'off' as const }, { accessibilityProfile: 'reducedMotion' as const }]) {
      const f = fxOf(set(o));
      expect(f.level, JSON.stringify(o)).toBe('calm');
      expect(f.cutIns).toBe(false);
      expect(f.linked).toBe(true);
    }
    expect(fxOf(set({ battleAnimations: 'reduced' })).level).toBe('lighter');
    expect(fxOf(set({ reducedFlash: true })).flashes).toBe('soft');
    expect(fxOf(set({ reduceParticles: true })).particles).toBe(false);
    expect(fxOf(set({ shakeIntensity: 0 })).shake).toBe(false);
  });

  it('a switch turned off stays off at Full show (Skip cut-ins)', () => {
    expect(fxOf(set({}, { cutIns: 'skip' }))).toMatchObject({ level: 'full', cutIns: false, linked: false });
  });
});

describe('D27 Boss Menu', () => {
  it('lists the ten blades of mockup m1 (plus tutorial d10, Replay a lesson) with their keys, and the empire at a glance', () => {
    const b = started();
    const m = bossMenuModel(b, 2, { card: null, slot: 1 });
    expect(m.blades.map((x) => x.key)).toEqual(['Esc', '1', '3', '4', '5', '6', 'R', 'S', 'T', 'End']);
    expect(m.blades.map((x) => x.id)).toEqual([...BLADES]);
    expect(m.blades.find((x) => x.id === 'hide')).toMatchObject({ label: 'Go into hiding', dim: true });
    expect(m.glance.funds).toBe(`₽${b.funds.toLocaleString('en-US')}`);
    expect(m.slot.line).toContain('Slot 1');
    expect(m.quote.length).toBeGreaterThan(0);
    // The cursor stays on the list.
    expect(bossMenuModel(b, 99, { card: null, slot: 1 }).at).toBe(BLADES.length - 1);
    const html = bossMenuView(m, null);
    expect(html).toContain('Boss Menu');
    expect(html).toContain('class="blade on"');
    expect(html).toContain('<span class="key q4" data-act="wheel" data-arg="" style="cursor:pointer">Q</span>');
    expect(html).not.toMatch(/Claude|\bAI\b/);
  });

  it('the menu never changes the block', () => {
    const b = started();
    const before = JSON.stringify(b);
    bossMenuModel(b, 0, { card: 'Key-Card: Pearl · $0.00 of $10', slot: 2 });
    expect(JSON.stringify(b)).toBe(before);
  });
});

describe('D27 Settings page and the Card', () => {
  it('the Dominion tab draws the run rows and the Effects block side by side, as in m2', () => {
    const run = [{ label: 'Day pace', kind: 'seg' as const, opts: [{ label: 'Calm', on: false }, { label: 'Normal', on: true }, { label: 'Ruthless', on: false }] }];
    const html = settingsPageView({ cats: [{ id: 'dominion', label: 'Dominion', icon: 'g-relic-crown' }], cat: 0, focus: 'rows', row: 0, run, fx: { level: 'full', rows: [{ label: 'Show', kind: 'pill', value: 'full' }, { label: 'Particles', kind: 'tg', on: true }], linked: false, why: [], now: 'now: Full show' }, head: 'Dominion', headNote: '', notice: null });
    expect(html).toContain('Your run');
    expect(html).toContain('Effects &amp; motion');
    expect(html).toContain('class="srow sel"');
    expect(html).toContain('data-testid="dom-fx-full"');
  });

  it('Show odds off hides the dial and the odds, and changes nothing else', () => {
    const r = domRun();
    const out = startInRun(content, r, setup());
    const b = out.run.expansion!.dominion!;
    const d = DOMINION_DATA.field.districts[0]!;
    const id = gridPages(b).flat().find((x) => { const c = cardModel(b, out.run, x, d.targets[0]?.id ?? null, d.id, [], null); return !!c?.roll; });
    expect(id).toBeTruthy();
    const c = cardModel(b, out.run, id!, d.targets[0]?.id ?? null, d.id, [], null)!;
    const shown = cardView(c, null, 'N');
    const hidden = cardView(c, null, 'N', false);
    expect(shown).toContain('HOW THE ODDS ARE MADE');
    expect(hidden).not.toContain('HOW THE ODDS ARE MADE');
    expect(hidden).toContain('dom-card-odds-hidden');
    expect(hidden).toMatch(/data-testid="dom-card-chance">\?</);
  });
});
