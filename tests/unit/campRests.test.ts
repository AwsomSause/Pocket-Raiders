// Camp and rest scenes NE81-85 (Beta 0.6): load, are once-per-run, change the party, and remember each other.

import { describe, expect, it } from 'vitest';
import { conditionMet, eventView, chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const IDS = ['camp-one-who-wont-eat', 'camp-the-argument', 'camp-the-bath', 'camp-nightmare-watch', 'camp-photograph-nobody-posed'];

function setup(id: string, flags: Record<string, number> = {}): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'camp', archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'c', kind: 'event', used: false, eventId: id });
  for (const [k, v] of Object.entries(flags)) run.story.flags[`ev:${k}`] = v;
  return run;
}

describe('camp and rest scenes', () => {
  it('loads all five as rest-stop events with no cross-run state', () => {
    for (const id of IDS) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.stop).toBe('rest');
      expect(e!.choices).toHaveLength(3);
      expect(JSON.stringify(e)).not.toMatch(/keepsake|souvenir|shard/i);
    }
  });

  it('friendship choices raise the party and cure works (the Bath)', () => {
    let run = setup('camp-the-bath');
    run.party.forEach((m) => { m.friendship = 0; m.status = 'poison' as never; });
    run = chooseEvent(content, run, 'c', 0).run;
    expect(run.party.every((m) => m.friendship > 0)).toBe(true);
    expect(run.party.every((m) => !m.status)).toBe(true);
    expect(run.perkEffects?.some((m) => m.kind === 'priceMultiplier')).toBe(true);
  });

  it('the pair from the fire shows up as an extra choice in the Argument, and the base indices stay', () => {
    const plain = eventView(content, setup('camp-the-argument'), 'c');
    expect(plain.choices).toHaveLength(3);
    const run = setup('camp-the-argument', { 'camp-pair': 1 });
    const v = eventView(content, run, 'c');
    expect(v.choices).toHaveLength(4);
    expect(v.event.intro).toContain('pair');
    const after = chooseEvent(content, run, 'c', 3).run;
    expect(after.story.flags['ev:camp-argument']).toBeTruthy();
  });

  it('the photo remembers the argument', () => {
    expect(eventView(content, setup('camp-photograph-nobody-posed'), 'c').event.intro).not.toContain('argued');
    expect(eventView(content, setup('camp-photograph-nobody-posed', { 'camp-argument': 1 }), 'c').event.intro).toContain('argued');
  });

  it('is deterministic and each scene plays once per run', () => {
    const a = chooseEvent(content, setup('camp-nightmare-watch'), 'c', 2).run;
    const b = chooseEvent(content, setup('camp-nightmare-watch'), 'c', 2).run;
    expect(JSON.stringify(a.party.map((m) => m.friendship))).toBe(JSON.stringify(b.party.map((m) => m.friendship)));
    expect(a.itemCounters?.['event-seen:camp-nightmare-watch']).toBe(1);
  });

  it('The One Who Won\'t Eat needs a recent faint, and a night\'s rest clears it', () => {
    const run = setup('camp-one-who-wont-eat');
    expect(conditionMet(content, run, { kind: 'memberFainted', within: 6 })).toBe(false);
    run.expansion = { ...run.expansion, lastFaint: { uid: run.party[0]!.uid, at: run.encountersCompleted } };
    expect(conditionMet(content, run, { kind: 'memberFainted', within: 6 })).toBe(true);
    run.encountersCompleted += 7;
    expect(conditionMet(content, run, { kind: 'memberFainted', within: 6 })).toBe(false);
    run.encountersCompleted -= 7;
    const camp = setup('camp-checkpoint');
    camp.expansion = { lastFaint: { uid: 'x', at: camp.encountersCompleted } };
    const rested = chooseEvent(content, camp, 'c', 0).run;
    expect(rested.expansion?.lastFaint).toBeUndefined();
  });
});
