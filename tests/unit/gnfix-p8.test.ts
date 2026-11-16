// Greenneedle fix pass, part 8 (gn.new.01-19 against GREENNEEDLE_PLACED_1.md): the differences the audit listed, one block per event.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { addEventStops, stageNumber } from '../../src/core/events';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import { conditionMet } from '../../src/core/events';
import { ballAnswer } from '../../src/core/greenneedle/ball';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const at = (seed: string, eventId: string, flags: Record<string, number> = {}): RunState => {
  const run = gnRun(seed);
  for (const [k, v] of Object.entries(flags)) setFlag(run, k, v);
  open(run, eventId);
  return run;
};
/** A fresh run moved to absolute stage `n` (same region), so stamps `n` stages back can be tested. */
const atStage = (seed: string, n: number): RunState => { const run = gnRun(seed); run.stage!.index = n - 1; return run; };
const onMap = (run: RunState, eventId: string): number => run.stage!.map.nodes.filter((n) => n.sides.some((s) => s.eventId === eventId)).length;
const placement = (id: string) => content.coPlacement!.get(id)!;
const joined = (run: RunState, species: string) => [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === species);

describe('gn.new.02 The Dog at the Station (fixes)', () => {
  it('only the platform needs a city; the later beats fit any stage', () => {
    expect(placement('gn-new-02-platform').tags).toEqual(['city']);
    for (const id of ['gn-new-02-porter', 'gn-new-02-landlady', 'gn-new-02-clinic', 'gn-new-02-last', 'gn-new-02-last-sit']) expect(placement(id).tags, id).toEqual([]);
    expect(placement('gn-new-02-platform').window).toEqual([5, 15]);
  });

  it('asking around puts the porter on the map ahead, in the same stage', () => {
    const run = atStage('dogfix-porter', 3); open(run, 'gn-new-02-platform');
    expect(onMap(run, 'gn-new-02-porter')).toBe(0);
    const r = choose(run, 'gn-new-02-platform', 'Ask around town.');
    expect(onMap(r.run, 'gn-new-02-porter')).toBe(1);
  });

  it('only ever sat: two stages on, the last visit is placed on the map (must-see) and gives the Growlithe with Vigil', () => {
    const run = atStage('dogfix-sit', 4);
    const now = stageNumber(content, run);
    setFlag(run, 'dog-open', 1); setFlag(run, 'dog-seen', 1); setFlag(run, 'dog-station-sat', 1); setFlag(run, 'dog-at', now - 2);
    addEventStops(content, run);
    expect(onMap(run, 'gn-new-02-last-sit')).toBeGreaterThan(0);
    expect(onMap(run, 'gn-new-02-last')).toBe(0);
    const scn = scene(run, 'gn-new-02-last-sit');
    expect(scn.labels).toEqual(['Sit one more time.']);
    expect(scn.intro).not.toMatch(/Ward two|Emlyn/);
    open(run, 'gn-new-02-last-sit');
    const r = choose(run, 'gn-new-02-last-sit', 'Sit one more time.');
    expect(joined(r.run, 'growlithe')?.fixedAbility).toBe('vigil');
    expect(flagOf(r.run, 'dog-chose-player')).toBe(1);
  });

  it('boundary: one stage on is too early; fed or led has no last visit at all', () => {
    const early = atStage('dogfix-early', 4);
    setFlag(early, 'dog-open', 1); setFlag(early, 'dog-station-sat', 1); setFlag(early, 'dog-at', stageNumber(content, early) - 1);
    addEventStops(content, early);
    expect(onMap(early, 'gn-new-02-last-sit')).toBe(0);
    for (const key of ['dog-fed', 'dog-led']) {
      const run = atStage(`dogfix-${key}`, 4);
      setFlag(run, 'dog-open', 1); setFlag(run, key, 1); setFlag(run, 'dog-at', stageNumber(content, run) - 2);
      addEventStops(content, run);
      expect(onMap(run, 'gn-new-02-last-sit') + onMap(run, 'gn-new-02-last'), key).toBe(0);
    }
    expect(JSON.stringify(content.events.get('gn-new-02-last'))).not.toMatch(/Do it once more/);
  });

  it('asked around: the clinic and ward two are both placed at S(n+2), and ward two needs no clinic visit', () => {
    const run = atStage('dogfix-ask', 4);
    setFlag(run, 'dog-open', 1); setFlag(run, 'dog-asking', 1); setFlag(run, 'dog-at', stageNumber(content, run) - 2);
    addEventStops(content, run);
    expect(onMap(run, 'gn-new-02-clinic')).toBe(1);
    expect(onMap(run, 'gn-new-02-last')).toBeGreaterThan(0);
    expect(onMap(run, 'gn-new-02-landlady')).toBe(0);
    const scn = scene(run, 'gn-new-02-last');
    expect(scn.labels).toEqual(['Carry the letter.', 'Carry the Growlithe.']);
    expect(scn.intro).toMatch(/He's in ward two\. He's been ill a long time\./);
    setFlag(run, 'dog-clinic', 1);
    expect(scene(run, 'gn-new-02-last').intro).not.toMatch(/You never reached the clinic/);
  });

  it('the clerk on holiday is met only if they were reunited', () => {
    expect(JSON.stringify(content.events.get('gn-new-02-holiday')!.requires)).toMatch(/dog-reunited/);
    const r = choose(at('dogfix-holiday', 'gn-new-02-holiday', { 'dog-reunited': 1 }), 'gn-new-02-holiday', 'Sit with him.');
    expect(said(r)).toMatch(/Habit/);
  });
});

describe('gn.new.01 The Eevee Who Couldn\'t Choose (fixes)', () => {
  it('each "admirer, later" scene is placed at a step 5 town', () => {
    for (const id of ['fisherman', 'magician', 'electrician', 'nurse', 'gardener', 'guide', 'ribbon']) {
      const p = placement(`gn-new-01-after-${id}`);
      expect(p, id).toBeTruthy();
      expect([p.home, p.attaches, p.sits]).toEqual([5, 'town', 'optional']);
    }
  });
});

describe('gn.new.03 The Ball That Wouldn\'t Open (fixes)', () => {
  const again = () => content.events.get('gn-new-03-again')!;
  it('the bolted Pokémon is met 16 stages later, not before (boundary 15 / 16)', () => {
    const run = atStage('ballfix-gap', 20);
    setFlag(run, 'ball-bolted', 1);
    setFlag(run, 'ball-bolt-stage', 5);
    expect(again().requires.every((c) => conditionMet(content, run, c))).toBe(false);
    setFlag(run, 'ball-bolt-stage', 4);
    expect(again().requires.every((c) => conditionMet(content, run, c))).toBe(true);
    setFlag(run, 'ball-bolt-stage', 0);
    expect(again().requires.every((c) => conditionMet(content, run, c))).toBe(false);
    expect(JSON.stringify(again())).not.toMatch(/"levelBonus":16/);
  });
  it('the find has no refuse choice', () => {
    expect(scene(gnRun('ballfix-find'), 'gn-new-03-find').labels).toEqual(['Pick it up.']);
  });
  it('a held Ball answers as soon as the battle is decided, once', () => {
    for (const [outcome, line] of [['win', /warm/], ['lose', /rocks once/]] as const) {
      const run = gnRun(`ballfix-held-${outcome}`);
      setFlag(run, 'ball-found', 1); setFlag(run, 'ball-held', 1);
      const battle = { outcome, storyEffects: [] } as never;
      expect(ballAnswer(run, battle)).toMatch(line);
      expect(ballAnswer(run, battle)).toBe('');
      expect(ballAnswer(run, { outcome: null, storyEffects: [] } as never)).toBe('');
    }
    expect(ballAnswer(gnRun('ballfix-not-held'), { outcome: 'win', storyEffects: [] } as never)).toBe('');
  });
});
