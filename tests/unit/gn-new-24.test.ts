// gn.new.24 The Night Shift at the Day-Care (tools/events/co/greenneedle-new-24.ts, core/greenneedle/nightshift.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { chooseEvent } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { NS_LEAD, nsSides } from '../../src/core/greenneedle/nightshift';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const sides = (run: RunState): string => openSide(run)?.eventId ?? 'none';
const LABELS = ['North.', 'South.', 'East.', 'West.'];
/** Posts the party Pokémon `uid` on `side` (1 north, 2 south, 3 east, 4 west) at the sentry room of wave `k`. */
function post(run: RunState, k: number, side: number, uid: string): RunState {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const stop = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === `gn-new-24-sent-${k}`)!;
  return chooseEvent(content, run, stop.id, side - 1, uid).run;
}
/** Places the two sentries so the wave's side is covered (or not), and returns the fight's label. */
function toWave(run: RunState, k: number, covered: boolean): { run: RunState; fight: string } {
  expect(sides(run)).toBe(`gn-new-24-sent-${k}`);
  expect(scene(run, `gn-new-24-sent-${k}`).labels).toEqual(LABELS);
  const raid = nsSides(run)[k - 1]!;
  const others = [1, 2, 3, 4].filter((s) => s !== raid);
  const [a, b] = covered ? [raid, others[0]!] : [others[0]!, others[1]!];
  let r = post(run, k, a, run.party[0]!.uid);
  // one sentry is not enough: the room is still open
  expect(sides(r)).toBe(`gn-new-24-sent-${k}`);
  r = post(r, k, b, r.party[1]!.uid);
  expect(flagOf(r, 'ns-side')).toBe(raid);
  expect(flagOf(r, 'ns-cover')).toBe(covered ? 1 : 0);
  return { run: r, fight: covered ? 'Hold the fence.' : 'Run to the open side.' };
}
function start(seed: string): RunState {
  const run = gnRun(seed);
  run.party.push(createPokemon(content, 'pidgey', run.party[0]!.level, 'p-second'));
  open(run, 'gn-new-24');
  // must-see, and the doc gives no way to say no
  expect(scene(run, 'gn-new-24').labels).toEqual(['Take the night shift.']);
  return choose(run, 'gn-new-24', 'Take the night shift.').run;
}
const fightWave = (run: RunState, k: number, covered: boolean, win_: boolean): RunState => {
  const w = toWave(run, k, covered);
  const r = choose(w.run, `gn-new-24-w${k}`, w.fight);
  expect(r.battle).toBe(true);
  return win_ ? win(r.run) : lose(r.run);
};

describe('gn.new.24 The Night Shift at the Day-Care', () => {
  it('the five waves: the first four from four different sides, the fifth never the fourth\'s side; the same for the same seed', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const s = nsSides({ seed });
      expect(s).toHaveLength(5);
      expect([...s.slice(0, 4)].sort()).toEqual([1, 2, 3, 4]);
      expect(s[4]).not.toBe(s[3]);
      expect(nsSides({ seed })).toEqual(s);
    }
  });

  it('two party Pokémon are placed as sentries; the one on the raided side meets a raider at -1 Attack and Speed', () => {
    let run = start('t24-waves');
    const w = toWave(run, 1, true);
    expect(scene(w.run, 'gn-new-24-w1').labels).toEqual(['Hold the fence.']);
    const sentry = w.run.party.find((m) => m.gn?.includes(NS_LEAD))!;
    expect(sentry.uid).toBe(w.run.party[0]!.uid);
    const r = choose(w.run, 'gn-new-24-w1', w.fight);
    expect(r.run.battle!.enemyTeam[0]!.speciesId).toBe('sneasel');
    expect(r.run.battle!.enemyStages.atk).toBe(-1);
    expect(r.run.battle!.enemyStages.spe).toBe(-1);
    expect(r.run.party[r.run.battle!.activeIndex]!.uid).toBe(sentry.uid);
    run = win(r.run);
    expect(sides(run)).toBe('gn-new-24-sent-2');
    // the posts are cleared between waves
    expect(run.party.some((m) => m.gn?.some((t) => t.startsWith('ns-')))).toBe(false);
    const open2 = toWave(run, 2, false);
    expect(scene(open2.run, 'gn-new-24-w2').labels).toEqual(['Run to the open side.']);
    const r2 = choose(open2.run, 'gn-new-24-w2', open2.fight);
    expect(r2.run.battle!.enemyStages.atk).toBe(0);
  });

  it('a fainted sentry covers nothing, and a lone Pokémon is sentry enough on its own', () => {
    const run = start('t24-faint');
    const raid = nsSides(run)[0]!;
    run.party[0]!.hp = 0;
    // a fainted Pokémon cannot be posted: the pick changes nothing
    const same = post(run, 1, raid, run.party[0]!.uid);
    expect(flagOf(same, 'ns-posted')).toBe(0);
    // the one that can stand is all the sentries there are
    const r = post(run, 1, raid, run.party[1]!.uid);
    expect(sides(r)).toBe('gn-new-24-w1');
    expect(flagOf(r, 'ns-cover')).toBe(1);
  });

  it('five wins: the day is defended, one egg of three, and no Sneasel stays', () => {
    let run = start('t24-five');
    run = fightWave(run, 1, true, true);
    run = fightWave(run, 2, false, true);
    expect(sides(run)).toBe('gn-new-24-food');
    run = choose(run, 'gn-new-24-food', 'Hold the garden.').run;
    run = fightWave(run, 3, true, true);
    run = fightWave(run, 4, true, true);
    const w5 = toWave(run, 5, true);
    const r5 = choose(w5.run, 'gn-new-24-w5', w5.fight);
    expect(r5.run.battle!.enemyTeam[0]!.speciesId).toBe('weavile');
    run = win(r5.run);
    expect(scene(run, 'gn-new-24-end').labels).toHaveLength(3);
    run = choose(run, 'gn-new-24-end', 'The mossy one.').run;
    expect(flagOf(run, 'daycare-defended')).toBe(1);
    expect(flagOf(run, 'daycare-egg-taken')).toBe(0);
    expect(flagOf(run, 'night-shift-sneasel')).toBe(0);
    expect(flagOf(run, 'night-shift-done')).toBe(1);
    expect(run.party.some((m) => m.gn?.some((t) => t.startsWith('ns-')))).toBe(false);
  });

  it('food at the fence after wave 2: the raids stop, an egg is still given, and "defended" is kept for five wins', () => {
    let run = start('t24-fed');
    run = fightWave(run, 1, true, true);
    run = fightWave(run, 2, true, true);
    run = choose(run, 'gn-new-24-food', 'Leave food at the fence.').run;
    expect(flagOf(run, 'daycare-fed')).toBe(1);
    expect(flagOf(run, 'night-shift-sneasel')).toBe(1);
    expect(sides(run)).toBe('gn-new-24-end');
    run = choose(run, 'gn-new-24-end', 'The speckled one.').run;
    expect(flagOf(run, 'daycare-defended')).toBe(0);
  });

  it('the Sneasel that stayed can be collected on any later visit', () => {
    const guard = content.events.get('gn-new-24-guard')!;
    expect(guard.callback).toBe(true);
    const run = gnRun('t24-guard');
    setFlag(run, 'daycare-fed');
    setFlag(run, 'night-shift-sneasel');
    setFlag(run, 'ns-fed-at', 0);
    open(run, 'gn-new-24-guard');
    expect(scene(run, 'gn-new-24-guard').labels).toEqual(['Ask it to come with you.', 'Leave it to guard the garden.']);
    // left: it is still there on another visit
    const left = choose(structuredClone(run), 'gn-new-24-guard', 'Leave it to guard the garden.').run;
    expect(flagOf(left, 'night-shift-sneasel')).toBe(1);
    // taken: a Sneasel joins, and the fence post is empty after
    const took = choose(run, 'gn-new-24-guard', 'Ask it to come with you.');
    const all = [...took.run.party, ...took.run.box, ...took.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))];
    expect(all.some((m) => m.speciesId === 'sneasel')).toBe(true);
    expect(flagOf(took.run, 'night-shift-sneasel')).toBe(0);
    expect(flagOf(took.run, 'daycare-sneasel-taken')).toBe(1);
  });

  it('a wave lost: one egg is taken, the night goes on, and it is found hatched later (not a Sneasel: whatever was in the egg)', () => {
    let run = start('t24-lost');
    run = fightWave(run, 1, false, false);
    expect(flagOf(run, 'daycare-egg-taken')).toBe(1);
    expect(sides(run)).toBe('gn-new-24-sent-2');
    expect(scene(run, 'gn-new-24-found').labels).toEqual(['Take it home.', 'Leave it with them.']);
    setFlag(run, 'ns-at', 0);
    open(run, 'gn-new-24-found');
    const home = choose(run, 'gn-new-24-found', 'Take it home.');
    const pend = home.run.pending.find((p) => p.kind === 'caught');
    const mon = pend && pend.kind === 'caught' ? pend.mon : [...home.run.party, ...home.run.box].at(-1)!;
    expect(mon.nature).toBe('naughty');
    expect(mon.speciesId).not.toBe('sneasel');
    const types = content.species.get(mon.speciesId)!.types;
    expect(types.some((t) => ['normal', 'fairy', 'water', 'bug', 'grass', 'fire', 'electric', 'fighting'].includes(t))).toBe(true);
  });
});
