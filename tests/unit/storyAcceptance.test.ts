// Story S20: a short Story Run per backstory plays without errors, is deterministic, and every module validates.
import { describe, expect, it } from 'vitest';
import { playFinaleStops } from '../../src/core/campaign/storyDirector';
import { applyEffects, chooseBackstory } from '../../src/core/story2/module';
import { validateModule } from '../../src/core/story2/moduleValidator';
import { chooseStarter, createRun } from '../../src/core/run';
import { autoplay } from './autoplay';
import { content } from './helpers';
import { newStoryRun, playModule, reachedEndings } from './storyPlay';

const play = (backstory: string, seed: string) => autoplay({
  seed, campaignId: 'orrery-circuit', steps: 500, smart: true, healOnMap: true,
  onStep: (r) => {
    if (r.story.v2 && r.story.v2.protagonist?.backstory !== backstory) chooseBackstory(content, r, backstory);
    return r;
  },
});

describe('story acceptance (S20)', () => {
  for (const b of content.storyData.backstories) {
    it(`${b.id}: module validates and a short Story Run is deterministic`, () => {
      expect(validateModule(content.storyData, b.id)).toEqual([]);
      const a = play(b.id, `acc-${b.id}`), c = play(b.id, `acc-${b.id}`);
      expect(a.story.v2?.mode).toBe('story_run');
      expect(a.story.v2?.protagonist?.backstory).toBe(b.id);
      expect(a.story.events.length).toBeGreaterThan(0);
      expect(JSON.stringify([a.phase, a.encountersCompleted, a.story.flags, a.story.events.length]))
        .toBe(JSON.stringify([c.phase, c.encountersCompleted, c.story.flags, c.story.events.length]));
    }, 60000);
  }
});

/** Endings that real play never reaches on purpose: the catch-all of a grid whose earlier rows cover every answer. */
const CATCH_ALL_ONLY: Record<string, string[]> = {};

describe('story acceptance (S20): endings and counters', () => {
  for (const b of content.storyData.backstories) {
    it(`${b.id}: every ending can be reached by real answers, and each run plays exactly one`, () => {
      const reached = reachedEndings(b.id, 30);
      expect(reached.has('NONE')).toBe(false);
      expect(b.endings.filter((e) => !reached.has(e) && !(CATCH_ALL_ONLY[b.id] ?? []).includes(e))).toEqual([]);
      for (const i of [0, 1, 2]) {
        const run = newStoryRun(`once-${b.id}-${i}`, b.id);
        const played = playModule(run, () => 0);
        expect(played.filter((id) => id.startsWith('ev_end_'))).toHaveLength(1);
        expect(new Set(played).size).toBe(played.length);
      }
    }, 120000);
  }

  it('all five backstories are on, and seeds spread across them', () => {
    expect(content.balance.story.module.enabledBackstories.sort()).toEqual(content.storyData.backstories.map((b) => b.id).sort());
    const picked = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const run = chooseStarter(content, createRun(content, { runId: `p${i}`, seed: `p${i}`, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
      picked.add(run.story.v2!.module!.backstory);
    }
    expect(picked.size).toBe(5);
  });

  it('counters start at the design values and stay inside their floor and cap', () => {
    const crim = newStoryRun('start-a', 'bs_ex_criminal');
    expect(crim.story.v2!.facts.redemption).toBe(40);
    applyEffects(content, crim, [{ id: 'x1', kind: 'add_counter', counter: 'redemption', amount: 500 }] as never);
    expect(crim.story.v2!.facts.redemption).toBe(100);
    applyEffects(content, crim, [{ id: 'x2', kind: 'add_counter', counter: 'redemption', amount: -500 }] as never);
    expect(crim.story.v2!.facts.redemption).toBe(0);
    expect(newStoryRun('start-b', 'bs_aether').story.v2!.facts.humanity).toBe(50);
    expect(newStoryRun('start-c', 'bs_hisui').story.v2!.facts.displacement).toBe(5);
  });

  it('Aether rolls its hidden Premise (all four versions appear), and the Finale marks the Champion as beaten', () => {
    const seen = new Set(Array.from({ length: 40 }, (_, i) => String(newStoryRun(`prem-${i}`, 'bs_aether').story.v2!.facts.premise)));
    expect([...seen].sort()).toEqual(['false', 'inverted', 'partial', 'true']);
    const run = newStoryRun('finale', 'bs_champion_heir');
    expect(run.story.v2!.facts.championship_won).toBeUndefined();
    playFinaleStops(content, run);
    expect(run.story.v2!.facts.championship_won).toBe(true);
  });
});
