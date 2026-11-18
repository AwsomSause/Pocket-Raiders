// Evil Mode slice 1 ("the shell"): founding to a first state, the empty day machine, saves, the setting and the mode gate.
import { describe, expect, it } from 'vitest';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { BEAT_END, beatStrip, step } from '../../src/core/evilMode/day';
import { foundingModel, frameModel, newDraft, pageReady } from '../../src/core/evilMode/screens';
import { EVIL_MODE_ID, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { BEATS, EvilModeBlockSchema, type EvilModeBlock } from '../../src/core/evilMode/schema';
import { checkName, foundTeam, loyaltyBand, methodsLit, type FoundingChoice } from '../../src/core/evilMode/start';
import { EXPANSION_SETTINGS_DEFAULTS } from '../../src/core/expansion/schema';
import { getMode, offeredModes, rulesProblem, STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { changeSetting } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS, SaveManager, CURRENT_VERSIONS } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { sceneForRun } from '../../src/scenes/routing';
import { content } from './helpers';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', ...over });
const block = (over: Partial<FoundingChoice> = {}): EvilModeBlock => {
  const r = foundTeam(choice(over), { boss: 'red', length: 'three', stage: 2 });
  if (!r.ok) throw new Error(r.problem);
  return r.block;
};
const evilRun = () => chooseStarter(content, createRun(content, { runId: 'ev1', seed: 'ev1', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });

describe('Evil Mode data', () => {
  it('six Creeds, eight Doctrines, seven methods, all with a status', () => {
    expect(EVIL_DATA.creeds).toHaveLength(6);
    expect(EVIL_DATA.doctrines).toHaveLength(8);
    expect(EVIL_DATA.methods).toHaveLength(7);
    for (const x of [...EVIL_DATA.creeds, ...EVIL_DATA.doctrines, ...EVIL_DATA.methods]) expect(['supported', 'limited', 'disabled', 'invalid']).toContain(x.status);
  });
  it('no suggested name is a taken name, and every suggestion passes the name check', () => {
    const taken = new Set(EVIL_DATA.founding.names.taken.map((t) => t.toLowerCase()));
    for (const n of Object.values(EVIL_DATA.founding.names.lists).flat()) {
      expect(taken.has(n.toLowerCase()), n).toBe(false);
      expect(checkName(n).ok, n).toBe(true);
    }
  });
});

describe('founding (start.ts)', () => {
  it('a first state from each Creed passes the schema, with the Creed\'s first-morning numbers', () => {
    for (const c of EVIL_DATA.creeds) {
      const b = block({ creed: c.id });
      expect(EvilModeBlockSchema.safeParse(b).success, c.id).toBe(true);
      expect(b.team).toMatchObject({ creed: c.id, funds: c.start.funds, heat: c.start.heat, regard: c.start.regard, dread: c.start.dread, boss: 'red', patron: null, corruption: 0 });
      expect(b.here).toEqual({ region: 0, stage: 2, day: 1, beat: 'morning' });
      // Slice 4: founding draws the Roster and the first applicant from evil-people, and from no other stream.
      // Slice 17: and the mole's handler and street on evil-mole (Part 11 section 1: rolled at the run's start).
      expect(Object.entries(b.draws).every(([s, n]) => (s === 'evil-people' ? n === c.start.roster + b.applicants.length : s === 'evil-mole' ? n === 2 : n === 0))).toBe(true);
      expect(b.applied).toEqual(['applicants:0:1:1']);
    }
  });
  it('the Line changes the first morning: Whatever it takes Heat +1, Clean hands Regard +1 (boundary: capped at 10)', () => {
    const grey = block();
    expect(block({ line: 'whatever' }).team.heat).toBe(grey.team.heat + 1);
    expect(block({ line: 'clean' }).team.regard).toBe(grey.team.regard + 1);
    expect(block({ line: 'clean' }).team.heat).toBe(grey.team.heat);
  });
  it('rejects a block with any one top-level or team field removed (failure)', () => {
    const b = block();
    for (const k of Object.keys(b)) {
      const copy = { ...b } as Record<string, unknown>;
      delete copy[k];
      expect(EvilModeBlockSchema.safeParse(copy).success, k).toBe(false);
    }
    for (const k of Object.keys(b.team)) {
      const team = { ...b.team } as Record<string, unknown>;
      delete team[k];
      expect(EvilModeBlockSchema.safeParse({ ...b, team }).success, `team.${k}`).toBe(false);
    }
  });
  it('the name check: empty, too long, not letters, taken, unsayable all fail; fourteen letters pass', () => {
    expect(checkName('').ok).toBe(false);
    expect(checkName('A'.repeat(15)).ok).toBe(false);
    expect(checkName('Abcdefghijklmn').ok).toBe(true);
    expect(checkName('Kettle9').ok).toBe(false);
    expect(checkName('rocket').ok).toBe(false);
    expect(checkName('Brr').ok).toBe(false);
    expect(checkName('  Open   Hand ').problem).toMatch(/already exists/);
    expect(foundTeam(choice({ name: 'Rocket' }), { boss: 'red', length: 'three', stage: 2 }).ok).toBe(false);
    expect(foundTeam(choice({ creed: 'nope' }), { boss: 'red', length: 'three', stage: 2 }).ok).toBe(false);
    expect(foundTeam(choice({ doctrine: '' }), { boss: 'red', length: 'three', stage: 2 }).ok).toBe(false);
  });
  it('the Line lights methods: Clean hands has five, Grey and darker all seven', () => {
    expect(methodsLit('clean').filter((m) => m.lit).map((m) => m.id)).toEqual(['persuade', 'pay', 'outplay', 'scout', 'expose']);
    expect(methodsLit('grey').every((m) => m.lit)).toBe(true);
    expect(methodsLit('whatever').every((m) => m.lit)).toBe(true);
  });
  it('Loyalty is a band, never a number: Belonging starts Easy, Profit Steady', () => {
    expect(loyaltyBand(block({ creed: 'belonging' })).name).toBe('Easy');
    expect(loyaltyBand(block({ creed: 'profit' })).name).toBe('Steady');
  });
});

describe('the day machine (day.ts)', () => {
  it('six beats go round; after the Hero comes the next day\'s Morning', () => {
    let b = block();
    for (const beat of BEATS) {
      expect(b.here.beat).toBe(beat);
      const r = step(b, { type: BEAT_END[beat] });
      expect(r.ok).toBe(true);
      b = r.block;
    }
    expect(b.here).toMatchObject({ day: 2, beat: 'morning' });
  });
  it('an action that does not fit the beat changes nothing (a double press can\'t skip a beat)', () => {
    const b = block();
    const r = step(b, { type: 'send' });
    expect(r.ok).toBe(false);
    expect(r.block).toBe(b);
    const once = step(b, { type: 'dismissOvernight' }).block;
    expect(step(once, { type: 'dismissOvernight' }).ok).toBe(false);
  });
  it('the beat strip marks done, now and later', () => {
    const b = step(step(block(), { type: 'dismissOvernight' }).block, { type: 'send' }).block;
    expect(beatStrip(b).map((s) => s.state)).toEqual(['done', 'done', 'now', 'later', 'later', 'later']);
  });
  it('same state and same actions give the same result (replay)', () => {
    const play = () => { let b = block(); for (let i = 0; i < 20; i++) b = step(b, { type: BEAT_END[b.here.beat] }).block; return b; };
    expect(play()).toEqual(play());
  });
});

describe('Evil Mode on a run, and saves', () => {
  it('an Evil Mode run routes to the Evil screen; a Standard run does not', () => {
    const r = evilRun();
    expect(sceneForRun(r)).toBe('Evil');
    expect(sceneForRun(chooseStarter(content, createRun(content, { runId: 's', seed: 's', archetypeId: 'red' }), 0))).toBe('Map');
  });
  it('founding writes the block once; the Boss is the run\'s trainer', () => {
    const r = evilRun();
    const a = foundInRun(r, choice(), 'three', 2);
    expect(a.problem).toBeNull();
    expect(a.run.expansion?.evilMode?.team.boss).toBe('red');
    expect(r.expansion?.evilMode).toBeUndefined();
    const again = foundInRun(a.run, choice({ name: 'Anvil' }), 'six', 2);
    expect(again.run.expansion?.evilMode?.team.name).toBe('Kettle');
    expect(foundInRun(chooseStarter(content, createRun(content, { runId: 's', seed: 's', archetypeId: 'red' }), 0), choice(), 'three', 2).problem).not.toBeNull();
  });
  it('save at each beat and reload: the same state', () => {
    let r = foundInRun(evilRun(), choice(), 'three', 2).run;
    const storage = new MemoryStorageProvider();
    for (let i = 0; i < BEATS.length + 1; i++) {
      const sm = new SaveManager(storage, content);
      sm.saveRun(r);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded.status).toBe('ok');
      if (loaded.status !== 'ok') return;
      expect(loaded.data).toEqual(r);
      r = stepInRun(loaded.data, { type: BEAT_END[loaded.data.expansion!.evilMode!.here.beat] }).run;
    }
    expect(r.expansion?.evilMode?.here).toMatchObject({ day: 2, beat: 'dispatch' });
  });
  it('a run saved before the mode loads unchanged, with no block', () => {
    const storage = new MemoryStorageProvider();
    const r = chooseStarter(content, createRun(content, { runId: 'old', seed: 'old', archetypeId: 'red' }), 0);
    storage.set('pkr.run', envelope('run', CURRENT_VERSIONS.run, r));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status === 'ok' && loaded.data).toEqual(r);
    expect(loaded.status === 'ok' && loaded.data.expansion?.evilMode).toBeUndefined();
  });
  it('a damaged block does not pass the run schema (failure: the save is not silently changed)', () => {
    const r = foundInRun(evilRun(), choice(), 'three', 2).run;
    const bad = { ...r, expansion: { ...r.expansion, evilMode: { ...r.expansion!.evilMode!, here: { region: 0, stage: 1, day: 0, beat: 'noon' } } } };
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope('run', CURRENT_VERSIONS.run, bad));
    expect(new SaveManager(storage, content).loadRun().status).not.toBe('ok');
  });
});

describe('the setting and the mode gate', () => {
  it('Evil Mode is on by default from slice 9 (a whole region plays); Run length is Three', () => {
    expect(EXPANSION_SETTINGS_DEFAULTS.evilMode).toBe(true);
    expect(EXPANSION_SETTINGS_DEFAULTS.evilRunLength).toBe('three');
    expect(DEFAULT_SETTINGS.expansion.evilMode).toBe(true);
  });
  it('settings saved before the setting existed load with it on (the new default); a saved Off stays Off', () => {
    const storage = new MemoryStorageProvider();
    const old = structuredClone(DEFAULT_SETTINGS) as Record<string, unknown> & { expansion: Record<string, unknown> };
    delete old.expansion.evilMode;
    delete old.expansion.evilRunLength;
    storage.set('pkr.settings', envelope('settings', CURRENT_VERSIONS.settings, old));
    expect(new SaveManager(storage, content).loadSettings().expansion).toMatchObject({ evilMode: true, evilRunLength: 'three' });
    storage.set('pkr.settings', envelope('settings', CURRENT_VERSIONS.settings, { ...old, expansion: { ...old.expansion, evilMode: false } }));
    expect(new SaveManager(storage, content).loadSettings().expansion.evilMode).toBe(false);
  });
  it('Run Setup offers the mode only while the setting is on', () => {
    expect(offeredModes({ evilMode: false }).map((m) => m.id)).not.toContain(EVIL_MODE_ID);
    expect(offeredModes({ evilMode: true }).map((m) => m.id)).toContain(EVIL_MODE_ID);
    expect(getMode(EVIL_MODE_ID)?.progressionEligible).toBe(false);
    expect(rulesProblem({ ...STANDARD_CHOICE, modeId: EVIL_MODE_ID })).toBeNull();
  });
  it('the Settings row turns it on and off; Run length turns between Three and Six (six regions exist since slice 19)', () => {
    const off = changeSetting(DEFAULT_SETTINGS, 'evilMode');
    expect(off.expansion.evilMode).toBe(false);
    expect(changeSetting(off, 'evilMode').expansion.evilMode).toBe(true);
    expect(DEFAULT_SETTINGS.expansion.evilRunLength).toBe('three');
    const six = changeSetting(DEFAULT_SETTINGS, 'evilRunLength');
    expect(six.expansion.evilRunLength).toBe('six');
    expect(changeSetting(six, 'evilRunLength').expansion.evilRunLength).toBe('three');
  });
});

describe('view models (screens.ts)', () => {
  it('Next lights only once a page is filled', () => {
    const d = newDraft();
    expect(pageReady({ ...d, page: 'name' })).toBe(false);
    expect(pageReady({ ...d, page: 'name', name: 'Kettle' })).toBe(true);
    expect(pageReady({ ...d, page: 'creed' })).toBe(false);
    expect(pageReady({ ...d, page: 'summary', name: 'Kettle', creed: 'cause', doctrine: 'tide' })).toBe(true);
  });
  it('the Grunt says the name and looks away at Whatever it takes', () => {
    const m = foundingModel({ ...newDraft(), page: 'line', name: 'Kettle', line: 'whatever' }, { bossName: 'Red', bossFile: null, starter: 'Bulbasaur', starterFile: null, oldLook: true, length: 'three' });
    expect(m.grunt.says).toBe('Team Kettle!');
    expect(m.grunt.looksAway).toBe(true);
    expect(m.oldLookLine).toBe(EVIL_DATA.founding.oldLookLine);
  });
  it('the frame: a Loyalty word, no Corruption slot at 0, the day chip and the beat button', () => {
    const f = frameModel(block(), 'Red');
    expect(f.strip.corruption).toBeNull();
    expect(f.strip.loyalty.name).toBe('Steady');
    expect(f.chips).toEqual(['Kanto · District 1 · Day 1', "Kanto: Everything's owned"]);
    expect(f.button).toBe('To work');
    expect(f.team.name).toBe('Team Kettle');
  });
});
