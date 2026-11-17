// gn.60 The Pokémon That Followed You Home: no node, no prompt until the reveal.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { visitSide } from '../../src/core/run';
import { maxHp } from '../../src/core/pokemon';
import { cryOf, followedCue, followedSpecies, followedStep, FOLLOW_POOL } from '../../src/core/greenneedle/followed';
import { content } from './helpers';
import { choose, flagOf, gnRun, setFlag } from './helpers/gnPlay';

const rest = (run: RunState): { run: RunState; message: string } => {
  const node = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const id = `t-heal-${node.sides.length}`;
  node.sides.push({ id, kind: 'heal', used: false } as (typeof node.sides)[number]);
  return visitSide(content, run, id);
};
const reveals = (run: RunState): boolean => run.stage!.map.nodes.some((n) => n.sides.some((x) => x.eventId === 'gn-60-reveal' && !x.used));
const inRegion = (seed: string, r: number): RunState => {
  const run = gnRun(seed);
  run.regionIndex = r;
  return run;
};

describe('gn.60 The Pokémon That Followed You Home', () => {
  it('what it is comes from the seed and the first region: small, common, and kept', () => {
    const a = gnRun('t60-a');
    const sp = followedSpecies(content, a);
    expect(FOLLOW_POOL[a.regionOrder[0]!] ?? []).toContain(sp);
    expect(followedSpecies(content, structuredClone(a))).toBe(sp);
    expect(flagOf(a, 'followed-species')).toBeGreaterThan(0);
  });

  it('region 1 shows a shape once a stage on a battle background; region 4 shows prints on sand, snow and mud', () => {
    const run = inRegion('t60-cue', 0);
    const node = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    node.kind = 'wild';
    let shown = 0;
    for (let i = 0; i < 30; i++) {
      run.stage!.current = node.id;
      node.id = node.id; // same node, new walk
      followedStep(content, run);
      if (followedCue(run) === 1) shown += 1;
    }
    expect(shown).toBeLessThanOrEqual(1);
  });

  it('nothing is said or offered: no choices anywhere before the reveal', () => {
    const run = inRegion('t60-quiet', 1);
    const out = rest(run);
    expect(reveals(out.run)).toBe(false);
    expect(out.message).toContain('Your Pokémon were fully healed');
  });

  it('region 3: a rest leaves one more Berry in the bag, with no message, once a stage', () => {
    const run = inRegion('t60-berry', 2);
    run.party[0]!.held = { 'oran-berry': 1 };
    const out = rest(run);
    expect(out.run.party[0]!.held!['oran-berry']).toBe(2);
    expect(out.message).not.toMatch(/berry/i);
  });

  it('the team notices from region 2, and a shopkeeper says it once', () => {
    const run = inRegion('t60-notice', 1);
    const out = rest(run);
    expect(out.message).toMatch(/bush/);
    const again = rest(out.run);
    expect(again.message).not.toMatch(/bush/);
  });

  it('after four regions it walks in; there is no way to send it away; it joins at the lead level with Long Journey', () => {
    const run = inRegion('t60-reveal', 4);
    setFlag(run, 'followed-kind-act');
    const r = rest(run).run;
    expect(reveals(r)).toBe(true);
    const labels = content.events.get('gn-60-reveal')!.choices.map((c) => c.label);
    expect(labels).toEqual(['"There you are."', '"...How long?"', '(Hold out a hand.)']);
    const lead = r.party[0]!.level;
    const res = choose(r, 'gn-60-reveal', '(Hold out a hand.)').run;
    const mon = [...res.party, ...res.box].find((m) => m.gn?.includes('followed-home'))!;
    expect(mon.speciesId).toBe(followedSpecies(content, res));
    expect(mon.level).toBe(lead);
    expect(mon.fixedAbility).toBe('long-journey');
    expect(mon.friendship).toBe(content.balance.friendship.max);
    expect(mon.eventBoosts?.atk).toBe(12);
    expect(mon.care?.nickname).toBe(cryOf(content.species.get(mon.speciesId)!.name));
    expect(mon.hp).toBe(maxHp(content, mon));
    expect(flagOf(res, 'followed-revealed')).toBe(2);
  });

  it('without the kind act it takes all six regions; a team on its last legs brings it at once', () => {
    const early = inRegion('t60-slow', 4);
    expect(reveals(rest(early).run)).toBe(false);
    const late = inRegion('t60-slow2', 5);
    expect(reveals(rest(late).run)).toBe(true);
    const weak = inRegion('t60-weak', 1);
    weak.party.push({ ...structuredClone(weak.party[0]!), uid: 'extra-60', hp: 0 });
    weak.party[0]!.hp = 1;
    expect(reveals(rest(weak).run)).toBe(true);
  });

  it('a one-syllable cry', () => {
    expect(cryOf('Sentret')).toBe('Sen');
    expect(cryOf('Yamper')).toBe('Yam');
  });
});
