// Beta 0.7 WS3: doors into story Raids 1, 3, 4 and 5, the shout prompt, and the new Settings rows.
import { describe, expect, it } from 'vitest';
import { ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { changeSetting, settingById } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';
import { judgeShout, promptById, promptLengthMs } from '../../src/core/interaction/prompt';
import { eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { resolveStoryRaid } from '../../src/core/raid/storyRaids';
import { evilOf } from '../../src/core/evil/teams';
import { content } from './helpers';

const DOORS: [number, string][] = [[1, 'mt-moon-dig'], [3, 'pokemon-tower'], [4, 'vermilion-docks'], [5, 'safari-night']];
const effectsOf = (e: unknown): { kind: string; n?: number; result?: string }[] => JSON.stringify(e).match(/\{"kind":"storyRaid"[^}]*\}/g)?.map((x) => JSON.parse(x)).filter((x) => x.result) ?? [];

describe('raid doors', () => {
  for (const [n, slug] of DOORS) {
    it(`Raid ${n} has an entry event gated on the raid and a finale that can resolve every outcome`, () => {
      const entry = content.events.get(`rd-${slug}-1`)!;
      const fin = content.events.get(`rd-${slug}-2`)!;
      expect(entry, 'entry').toBeDefined();
      expect(fin, 'finale').toBeDefined();
      expect(entry.requires.some((r) => r.kind === 'storyRaid' && r.n === n)).toBe(true);
      const e1 = effectsOf(entry);
      const e2 = effectsOf(fin);
      expect(new Set(e1.map((x) => x.result))).toEqual(new Set(['failure', 'declined']));
      expect(new Set(e2.map((x) => x.result))).toEqual(new Set(['triumph', 'failure', 'success', 'partial']));
      for (const x of [...e1, ...e2]) expect(x.n).toBe(n);
    });
  }
});

describe('shout prompt', () => {
  it('a shout or a button press is the same grade, silence is a miss', () => {
    const def = promptById('snorlax-shout');
    expect(def.kind).toBe('shout');
    if (def.kind !== 'shout') return;
    expect(judgeShout(def, true).grade).toBe('good');
    expect(judgeShout(def, false).grade).toBe('miss');
    expect(judgeShout(def, false, { skip: true, skipGrade: 'good' }).skipped).toBe(true);
    expect(promptLengthMs(def)).toBe(def.listenMs);
  });
  it('the Sleeping Snorlax event offers it', () => {
    // Greenneedle gn.49 replaced the Kanto Snorlax (cs-kanto-route-snorlax): the shout comes after the Poké Flute, on the noise meter.
    expect(content.events.get('cs-kanto-route-snorlax')!.choices.some((c) => c.label === 'Play the Poké Flute.')).toBe(true);
    for (const i of [1, 2, 3]) expect(content.events.get(`gn-49-noise-${i}`)!.choices.some((c) => c.prompt?.id === 'snorlax-shout'), `gn-49-noise-${i}`).toBe(true);
  });
});

describe('settings rows', () => {
  it('Extended Cut is off by default and toggles; density cycles; Kanto toggles', () => {
    expect(DEFAULT_SETTINGS.expansion.climaxCut).toBe('standard');
    expect(settingById('climaxCut')!.show(DEFAULT_SETTINGS)).toBe('Off');
    const on = changeSetting(DEFAULT_SETTINGS, 'climaxCut');
    expect(on.expansion.climaxCut).toBe('extended');
    expect(changeSetting(on, 'climaxCut').expansion.climaxCut).toBe('standard');
    const seen = [DEFAULT_SETTINGS];
    for (let i = 0; i < 3; i++) seen.push(changeSetting(seen[i]!, 'eventsDensity'));
    expect(seen.map((s) => s.expansion.eventsDensity)).toEqual(['normal', 'full', 'low', 'normal']);
    expect(changeSetting(DEFAULT_SETTINGS, 'kantoSevii').expansion.kantoSevii).toBe(false);
  });
  it('an old settings block with the removed placeholder keys still loads', () => {
    const old = { ...ExpansionSettingsSchema.parse({}), climaxSecondShot: true, rivalOverhaul: true, rivalFriend: true, secondChancePct: 5, healsPerBattle: 10, revivesPerBattle: 6, blessingsEnabled: true, mythicalsEnabled: true, ultraBeastsEnabled: true, wholeRunEventsPct: 35, whatIfCasts: true, eventsDensity: 'full' };
    const out = ExpansionSettingsSchema.parse(old);
    expect(out.eventsDensity).toBe('full');
    expect(Object.keys(out)).not.toContain('healsPerBattle');
  });
});

describe('doors are drawable in a live Kanto run', () => {
  const kanto = () => {
    const r = chooseStarter(content, createRun(content, { runId: 'rd1', seed: 'rd1', archetypeId: 'red' }), 0);
    r.regionOrder[r.regionIndex] = 'kanto';
    evilOf(r).teamId = 'rocket';
    r.stage = { ...(r.stage ?? ({} as never)), index: 5 } as never;
    return r;
  };
  it('Raid 1 and 3 doors can be drawn; Raid 4 only after Raid 2; resolved raids close their door', () => {
    const r = kanto();
    const ids = () => new Set(eligibleEvents(content, r).map((e) => e.id));
    expect(ids().has('rd-mt-moon-dig-1')).toBe(true);
    expect(ids().has('rd-pokemon-tower-1')).toBe(true);
    expect(ids().has('rd-vermilion-docks-1')).toBe(false);
    resolveStoryRaid(content, r, 2, 'partial');
    expect(ids().has('rd-vermilion-docks-1')).toBe(true);
    resolveStoryRaid(content, r, 1, 'declined');
    expect(ids().has('rd-mt-moon-dig-1')).toBe(false);
    expect(ids().has('rd-mt-moon-dig-2')).toBe(false); // finale is reached only through the entry
  });
});
