// Greenneedle gn.new.03 The Ball That Wouldn't Open (tools/events/co/greenneedle-new-03.ts; rules in src/core/greenneedle/ball.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { ballBattle, ballRest, trustHolds } from '../../src/core/greenneedle/ball';
import { gnTokens } from '../../src/core/greenneedle';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag, win } from './helpers/gnPlay';

const here = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
const opened = (run: RunState, id: string): boolean => here(run).sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const castMon = (run: RunState): string => Object.keys(run.story.flags).find((k) => k.startsWith('ev:cast-ball-mon:'))!.slice('ev:cast-ball-mon:'.length);

/** The Ball found, in the bag. */
function found(seed: string): RunState {
  let run = gnRun(seed);
  open(run, 'gn-new-03-find');
  run = choose(run, 'gn-new-03-find', 'Pick it up.').run;
  return run;
}
/** One rest: its scene opens, and one choice is picked. */
function rest(run: RunState, label: string): RunState {
  ballRest(content, run);
  const id = opened(run, 'gn-new-03-hatch') ? 'gn-new-03-hatch' : 'gn-new-03-rest';
  return choose(run, id, label).run;
}

describe('gn.new.03 The Ball That Wouldn\'t Open', () => {
  it('is found once: the Pokémon inside is chosen, the Ball is in the bag', () => {
    const run = found('gn-ball-1');
    expect(flagOf(run, 'ball-found')).toBe(1);
    expect(flagOf(run, 'ball-kind')).toBe(0);
    expect(content.species.has(castMon(run))).toBe(true);
    expect(scene(gnRun('x'), 'gn-new-03-find').labels).toEqual(['Pick it up.', 'Leave it in the mud.']);
  });
  it('leaving it in the mud leaves no Ball', () => {
    let run = gnRun('gn-ball-2');
    open(run, 'gn-new-03-find');
    run = choose(run, 'gn-new-03-find', 'Leave it in the mud.').run;
    expect(flagOf(run, 'ball-found')).toBe(0);
    ballRest(content, run);
    expect(opened(run, 'gn-new-03-rest')).toBe(false);
  });
  it('opens a scene at every rest, with the doc\'s four choices', () => {
    const run = found('gn-ball-3');
    ballRest(content, run);
    expect(opened(run, 'gn-new-03-rest')).toBe(true);
    expect(scene(run, 'gn-new-03-rest').labels).toEqual(['Talk to it.', 'Leave it by the fire.', 'Hold it in the next battle.', 'Put it away.']);
  });
  it('talking, the fire and holding each add a kindness; putting it away adds none', () => {
    let run = found('gn-ball-4');
    run = rest(run, 'Talk to it.');
    expect(flagOf(run, 'ball-kind')).toBe(1);
    run = rest(run, 'Leave it by the fire.');
    expect(flagOf(run, 'ball-kind')).toBe(2);
    run = rest(run, 'Hold it in the next battle.');
    expect(flagOf(run, 'ball-kind')).toBe(3);
    expect(flagOf(run, 'ball-held')).toBe(1);
    run = rest(run, 'Put it away.');
    expect(flagOf(run, 'ball-kind')).toBe(3);
  });
  it('a held Ball is warm after a win and rocks once after a loss (shown at the next rest)', () => {
    for (const [outcome, line] of [['win', 'Warm.'], ['lose', 'It rocks once.']] as const) {
      let run = found(`gn-ball-5-${outcome}`);
      run = rest(run, 'Hold it in the next battle.');
      run.battle = { outcome } as never;
      ballBattle(run);
      run.battle = null;
      expect(flagOf(run, 'ball-held')).toBe(0);
      here(run).sides = here(run).sides.filter((s) => s.used);
      ballRest(content, run);
      expect(gnTokens(content, run, scene(run, 'gn-new-03-rest').intro)).toContain(line);
      // Only that rest: the next one is quiet again.
      here(run).sides.forEach((s) => (s.used = true));
      ballRest(content, run);
      expect(gnTokens(content, run, scene(run, 'gn-new-03-rest').intro)).not.toContain(line);
    }
  });
  it('a battle that was not held through does nothing', () => {
    const run = found('gn-ball-6');
    run.battle = { outcome: 'win' } as never;
    ballBattle(run);
    expect(flagOf(run, 'ball-show')).toBe(0);
    expect(flagOf(run, 'ball-held-result')).toBe(0);
  });
  it('at five kindnesses the next rest opens with it asleep in the party, with Trust Earned and the mark', () => {
    let run = found('gn-ball-7');
    for (let i = 0; i < 5; i++) run = rest(run, 'Talk to it.');
    expect(flagOf(run, 'ball-kind')).toBe(5);
    expect(flagOf(run, 'ball-gone')).toBe(0);
    here(run).sides.forEach((s) => (s.used = true));
    ballRest(content, run);
    expect(opened(run, 'gn-new-03-hatch')).toBe(true);
    expect(opened(run, 'gn-new-03-rest')).toBe(false);
    const sp = castMon(run);
    const before = run.party.length;
    run = choose(run, 'gn-new-03-hatch', 'Let it sleep.').run;
    const mon = [...run.party, ...run.box].find((m) => m.speciesId === sp)!;
    expect(run.party.length + run.box.length).toBeGreaterThan(before - 1);
    expect(mon.fixedAbility).toBe('trust-earned');
    expect(mon.gn).toContain('wouldnt-open');
    for (const k of ['ball-gone', 'ball-out', 'ball-waited', 'abandoned-mon']) expect(flagOf(run, k)).toBe(1);
    // It's out of the bag: no more scenes.
    here(run).sides.forEach((s) => (s.used = true));
    ballRest(content, run);
    expect(opened(run, 'gn-new-03-rest') || opened(run, 'gn-new-03-hatch')).toBe(false);
  });
  it('waiting it out makes the gn.51 rehabilitation one rest shorter', async () => {
    const { restsNeeded } = await import('../../src/core/greenneedle/smuggling');
    const run = found('gn-ball-8');
    expect(restsNeeded(run)).toBe(3);
    setFlag(run, 'ball-waited');
    expect(restsNeeded(run)).toBe(2);
  });
  it('Trust Earned holds only while another Pokémon can battle', () => {
    const mon = { fixedAbility: 'trust-earned', hp: 10 };
    const other = { hp: 5 };
    expect(trustHolds([mon, other], { side: 'player', mon })).toBe(true);
    expect(trustHolds([mon, { hp: 0 }], { side: 'player', mon })).toBe(false);
    expect(trustHolds([mon, other], { side: 'enemy', mon })).toBe(false);
    const wary = { fixedAbility: 'wary', hp: 10 };
    expect(trustHolds([wary, other], { side: 'player', mon: wary })).toBe(false);
    expect(content.abilities.get('trust-earned')?.name).toBe('Trust Earned');
  });
  describe('the tinker', () => {
    it('offers once, in a town, while the Ball is in the bag', () => {
      const run = found('gn-ball-9');
      const e = content.events.get('gn-new-03-tinker')!;
      expect(JSON.stringify(e.requires)).toContain('ball-found');
      expect(scene(run, 'gn-new-03-tinker').intro).toContain('Seized mechanism. I can crack it for two hundred. It won\'t like it.');
      expect(scene(run, 'gn-new-03-tinker').labels).toEqual(['Pay ₽200.', 'Keep it shut.']);
    });
    it('paying ₽200 forces it: it bolts, and is met again later at a level above, and can\'t be caught', () => {
      let run = found('gn-ball-10');
      run.money = 500;
      open(run, 'gn-new-03-tinker');
      run = choose(run, 'gn-new-03-tinker', 'Pay ₽200.').run;
      expect(run.money).toBe(300);
      for (const k of ['ball-gone', 'ball-bolted', 'ball-tinker']) expect(flagOf(run, k)).toBe(1);
      ballRest(content, run);
      expect(opened(run, 'gn-new-03-rest')).toBe(false);
      // A later stage: it's standing in the road.
      run.stage!.index += 1;
      open(run, 'gn-new-03-again');
      const fought = choose(run, 'gn-new-03-again', 'Battle.');
      expect(fought.battle).toBe(true);
      expect(fought.run.battle!.eventRule?.noCatch).toBe(true);
      expect(fought.run.battle!.enemyTeam[0]!.speciesId).toBe(castMon(run));
      // At A+16 it is far above the starter: the foe is made weak here so the test decides the winner.
      expect(fought.run.battle!.enemyTeam[0]!.level).toBeGreaterThanOrEqual(fought.run.party[0]!.level + 8);
      const weak = structuredClone(fought.run);
      weak.battle!.enemyTeam[0]!.level = 2;
      const after = win(weak);
      expect(flagOf(after, 'ball-met')).toBe(1);
    });
    it('the Ball can\'t be met again before a later stage, or when it wasn\'t forced', () => {
      const run = found('gn-ball-11');
      const e = content.events.get('gn-new-03-again')!;
      expect(JSON.stringify(e.requires)).toContain('ball-bolted');
      expect(JSON.stringify(e.requires)).toContain('laterStage');
    });
    it('keeping it shut ends the offer and keeps the Ball', () => {
      let run = found('gn-ball-12');
      open(run, 'gn-new-03-tinker');
      run = choose(run, 'gn-new-03-tinker', 'Keep it shut.').run;
      expect(flagOf(run, 'ball-tinker')).toBe(1);
      expect(flagOf(run, 'ball-gone')).toBe(0);
      ballRest(content, run);
      expect(opened(run, 'gn-new-03-rest')).toBe(true);
    });
  });
  describe('the afterstory', () => {
    it('waits for the next region, then offers the two choices; the Pokémon stays either way', () => {
      for (const label of ['Let them say it.', 'It\'s all right. Don\'t.']) {
        let run = found(`gn-ball-13-${label.length}`);
        for (let i = 0; i < 5; i++) run = rest(run, 'Talk to it.');
        here(run).sides.forEach((s) => (s.used = true));
        ballRest(content, run);
        let r = choose(run, 'gn-new-03-hatch', 'Let it sleep.').run;
        const e = content.events.get('gn-new-03-after')!;
        expect(JSON.stringify(e.requires)).toContain('notThisRegion');
        expect(scene(r, 'gn-new-03-after').labels).toEqual(['Let them say it.', 'It\'s all right. Don\'t.']);
        open(r, 'gn-new-03-after');
        const sp = castMon(r);
        r = choose(r, 'gn-new-03-after', label).run;
        expect(flagOf(r, 'ball-after')).toBe(1);
        expect([...r.party, ...r.box].some((m) => m.speciesId === sp)).toBe(true);
      }
    });
  });
});
