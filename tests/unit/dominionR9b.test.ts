// DOMINION redesign R9 follow-up: the Rotom Phone's pages read the run and never change it; the same day reads the
// same; the settings record v49 adds the phone's settings; the pages keep their test ids.
import { describe, expect, it } from 'vitest';
import { askModel, chaptersModel, chatterDue, chatterModel, diaryModel, inboxModel, journalModel, msgsModel, planModel, radioModel } from '../../src/core/dominion/rotomDesk';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import { LOOK_DEFAULT, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { SettingsSchema, type RunState } from '../../src/core/state';
import { CURRENT_VERSIONS, DEFAULT_SETTINGS, MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { r5Ask, r5Chapters, r5Diary, r5Inbox, r5Journal, r5Jukebox, r5Msgs, r5Plan, r5Portrait, r5Radio } from '../../src/ui/redux/screens/dominion/r50/rotomPages';
import { content } from './helpers';

const started = (): { run: RunState; b: DominionBlock } => {
  const run0 = chooseStarter(content, createRun(content, { runId: 'r9b', seed: 'r9b', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run0, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return { run: out.run, b: out.run.expansion!.dominion! };
};
const pic = (look: string | null, sz: number): string => `<i data-pic="${look ?? ''}" style="width:${sz}px"></i>`;

describe('R9 follow-up: the phone pages read the run', () => {
  it('every model leaves the block as it was', () => {
    const { run, b } = started();
    const before = JSON.stringify(b);
    radioModel(b); inboxModel(b, run); msgsModel(b, run); journalModel(b); diaryModel(b, run); askModel(b, run); planModel(b, run); chaptersModel(b); chatterModel(b, 3);
    expect(JSON.stringify(b)).toBe(before);
  });

  it('the radio has four stations; the pirate one waits for a Radio Room; a police line goes to the police band', () => {
    const { b } = started();
    const ss = radioModel(b);
    expect(ss.map((s) => s.freq)).toEqual(['88.1', '91.5', '95.0', '103.2']);
    expect(ss[3]!.locked).toBe(true);
    const withNews = { ...b, voices: { week: [{ k: 'police' as const, d: 1, l: 'Looker patrols the docks.' }], papers: [] } };
    expect(radioModel(withNews)[2]!.now).toBe('Looker patrols the docks.');
    expect(radioModel(withNews)[0]!.lines).toEqual([]);
  });

  it('the diary reads the same for the same day, and a later day reads differently (boundary: day clamps to today)', () => {
    const { run, b } = started();
    expect(diaryModel(b, run, 1)).toEqual(diaryModel(b, run, 1));
    expect(diaryModel(b, run, 99).day).toBe(b.day);
    expect(diaryModel(b, run, 0).day).toBe(1);
    expect(diaryModel(b, run).parts.map(([t]) => t)).toEqual(['Morning', 'Noon', 'Evening', 'Night']);
  });

  it('Ask Rotom answers five questions; the plan picks lying low when Heat is high', () => {
    const { run, b } = started();
    const qs = askModel(b, run);
    expect(qs).toHaveLength(5);
    for (const q of qs) expect(q.a.length).toBeGreaterThan(10);
    expect(planModel({ ...b, heat: 80 }, run).plans.find((p) => p.pick)!.letter).toBe('C');
    expect(planModel(b, run).plans).toHaveLength(3);
  });

  it('messages has a chat for each of the crew on a new run, even with the inbox empty (boundary)', () => {
    const { run, b } = started();
    const cs = msgsModel(b, run);
    expect(cs.length).toBeGreaterThanOrEqual(b.members.filter((m) => !m.crew?.out).slice(0, 5).length);
    expect(cs.at(-1)!.replies[0]!.go).toBe('crew');
  });

  it('chapters: the founding is the chapter now on a new run; one chapter is now', () => {
    const { b } = started();
    const cs = chaptersModel(b);
    expect(cs).toHaveLength(5);
    expect(cs.filter((c) => c.state === 'now')).toHaveLength(1);
    expect(chaptersModel({ ...b, opened: true, earned: 500 })[0]!.state).toBe('done');
  });

  it('the journal starts with the move into HQ; chatter shows every eighth page (some) or fourth (lots), never when off', () => {
    const { b } = started();
    expect(journalModel(b).at(-1)!.day).toBe(1);
    expect([chatterDue('some', 8), chatterDue('some', 4), chatterDue('lots', 4), chatterDue('off', 8), chatterDue('lots', 0)]).toEqual([true, false, true, false, false]);
  });
});

describe('R9 follow-up: the pages keep their test ids and never say Claude or AI', () => {
  it('draws every page', () => {
    const { run, b } = started();
    const r = r5RunOf(b, []);
    const html = [
      r5Radio(radioModel(b), 2, 0, r), r5Inbox(inboxModel(b, run), 0, pic, r), r5Msgs(msgsModel(b, run), 0, 0, pic, r), r5Journal(journalModel(b), 0, 'Red', r),
      r5Diary(diaryModel(b, run), r), r5Ask(askModel(b, run), 0, [0], r), r5Plan(planModel(b, run), 0, r), r5Chapters(chaptersModel(b), 0, r),
      r5Jukebox([{ id: 'bgm.menu', name: 'Menu', where: 'Around', heard: true }, { id: 'bgm.x', name: 'X', where: '?', heard: false }], 0, 'bgm.menu', r),
      r5Portrait({ hq: 'The Warehouse', funds: '₽1,000', heat: 5, news: 'Quiet', floors: [['g-dark-gem']], todo: ['Plan a job'], says: 'Rook: Hi', tall: true }, r),
    ].join('');
    for (const id of ['r5-radio', 'r9-station-2', 'r5-inbox', 'r5-msgs', 'r5-journal', 'r5-rdiary', 'r5-ask', 'r9-ask-0', 'r5-rplan', 'r9-plan-0', 'r5-chapters', 'r9-chapter-0', 'r5-jukebox', 'r9-track-1', 'r5-portrait', 'r9-tall'])
      expect(html, id).toContain(`data-testid="${id}"`);
    expect(html).toContain('???');
    expect(html.replace(/<[^>]+>/g, ' ')).not.toMatch(/Claude|\bAI\b/);
  });
});

describe('R9 follow-up: settings v49', () => {
  it('the record is at v49 and a v48 look without the phone settings gets their defaults', () => {
    expect(CURRENT_VERSIONS.settings).toBe(49);
    const old = { expansion: { dominionPrefs: { look: { ticker: 'off' } } } };
    const out = MIGRATIONS.settings[48]!(old as never) as { expansion: { dominionPrefs: { look: Record<string, unknown> } } };
    expect(out.expansion.dominionPrefs.look).toEqual({ ...LOOK_DEFAULT, ticker: 'off' });
    expect(LOOK_DEFAULT).toMatchObject({ chatter: 'some', captions: false, heard: [], photos: 0, awayMute: true, wrap: true, tall: true });
  });

  it('an old settings save from v45, v46, v47 or v48 loads through every step and gets the look defaults', () => {
    const PHONE = ['chatter', 'captions', 'capSize', 'musicNames', 'heard', 'photos', 'voice', 'voiceVol', 'awayMute', 'focus', 'palette', 'wrap', 'clicks', 'lockedSkins', 'tall'];
    const r9Look = Object.fromEntries(Object.entries({ ...LOOK_DEFAULT, ticker: 'off' }).filter(([k]) => !PHONE.includes(k)));
    const { look: _drop, ...noLook } = DEFAULT_SETTINGS.expansion.dominionPrefs;
    const old = (v: number) => ({ ...DEFAULT_SETTINGS, musicVolume: 0.3, expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: v === 48 ? { ...noLook, look: r9Look } : noLook } });
    for (const raw of [
      { format: 'pkmn-roguelike', record: 'settings', schemaVersion: 45, savedAt: '', data: old(45) },
      { format: 'pkmn-roguelike', record: 'settings', schemaVersion: 46, savedAt: '', data: old(46) },
      { format: 'pkmn-roguelike', record: 'settings', schemaVersion: 47, savedAt: '', data: old(47) },
      { format: 'pkmn-roguelike', record: 'settings', schemaVersion: 48, savedAt: '', data: old(48) },
    ]) {
      const storage = new MemoryStorageProvider();
      storage.set('pkr.settings', JSON.stringify(raw));
      const got = new SaveManager(storage, content).loadSettings();
      expect(got.musicVolume, `v${raw.schemaVersion}`).toBe(0.3);
      expect(got.expansion.dominionPrefs.look, `v${raw.schemaVersion}`).toEqual(raw.schemaVersion === 48 ? { ...LOOK_DEFAULT, ticker: 'off' } : LOOK_DEFAULT);
    }
  });

  it('a changed phone look round-trips; a bad value is refused (failure case)', () => {
    const storage = new MemoryStorageProvider();
    const p = DEFAULT_SETTINGS.expansion.dominionPrefs;
    const changed = { ...DEFAULT_SETTINGS, expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: { ...p, look: { ...p.look, captions: true, capSize: 'l' as const, heard: ['bgm.menu'], photos: 3, palette: 'rg' as const } } } };
    new SaveManager(storage, content).saveSettings(changed);
    expect(new SaveManager(storage, content).loadSettings().expansion.dominionPrefs.look).toEqual(changed.expansion.dominionPrefs.look);
    expect(() => SettingsSchema.parse({ ...DEFAULT_SETTINGS, expansion: { ...DEFAULT_SETTINGS.expansion, dominionPrefs: { ...p, look: { ...p.look, chatter: 'always' } } } })).toThrow();
  });
});
