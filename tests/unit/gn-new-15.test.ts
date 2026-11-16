// Greenneedle gn.new.15 The Weather Station (tools/events/co/greenneedle-new-15.ts).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { abilityOf } from '../../src/core/pokemon';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { createBattle, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { pinLine, pinnedWeather } from '../../src/core/greenneedle/weather';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag, win } from './helpers/gnPlay';
import type { RunState } from '../../src/core/state';

const next = (run: RunState): string => openSide(run)!.eventId;
const inside = (seed: string): RunState => {
  const run = gnRun(seed);
  open(run, 'gn-new-15-door');
  return choose(run, 'gn-new-15-door', 'Follow it in.').run;
};
/** The porch, then the floor plan (a scene beside the porch). */
const hall = (run: RunState): RunState => choose(run, 'gn-new-15-porch', 'Go in.').run;
const ROOM_LABELS = ['The archive.', 'The generator.', 'The balloon shed.', 'The radio room.'];

describe('gn.new.15 The Weather Station', () => {
  it('a door at step 12, optional, needs high, A7; the pseudo stage opens on the porch', () => {
    expect(content.coPlacement!.get('gn-new-15-door')).toMatchObject({ shape: 'door', home: 12, sits: 'optional', attaches: 'instead', earliest: 7, tags: ['high'] });
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_station')!;
    expect(chainRooms(content, chain).map((r) => r.event)).toContain('gn-new-15-porch');
    const run = inside('t15-door');
    expect(run.stage!.pseudo?.id).toBe('ps_gn_station');
    expect(next(run)).toBe('gn-new-15-porch');
  });

  it('the floor plan has the four rooms; entering from the right room solves each puzzle (generator, archive, generator, shed, archive, radio)', () => {
    let run = hall(inside('t15-route'));
    expect(scene(run, 'gn-new-15-hall').labels).toEqual(ROOM_LABELS);
    // Generator first: Castform comes from the porch in the wrong form, a wild fight, then back to the plan.
    run = choose(run, 'gn-new-15-hall', 'The generator.').run;
    expect(scene(run, 'gn-new-15-generator').labels).toEqual(['Let Castform try.']);
    run = win(choose(run, 'gn-new-15-generator', 'Let Castform try.').run);
    expect(flagOf(run, 'ws-from')).toBe(2);
    expect(flagOf(run, 'ws-generator')).toBe(0);
    // Archive from the generator (sunny): dry.
    run = choose(run, 'gn-new-15-hall', 'The archive.').run;
    expect(scene(run, 'gn-new-15-archive').labels).toEqual(['Let Castform dry the charts.']);
    run = choose(run, 'gn-new-15-archive', 'Let Castform dry the charts.').run;
    expect(flagOf(run, 'ws-archive')).toBe(1);
    // Generator from the archive (rainy): cool.
    run = choose(run, 'gn-new-15-hall', 'The generator.').run;
    run = choose(run, 'gn-new-15-generator', 'Let Castform cool it.').run;
    expect(flagOf(run, 'ws-generator')).toBe(1);
    // Shed from the generator (sunny): thaw.
    run = choose(run, 'gn-new-15-hall', 'The balloon shed.').run;
    run = choose(run, 'gn-new-15-shed', 'Let Castform thaw the winch.').run;
    expect(flagOf(run, 'ws-shed')).toBe(1);
    // Archive again (pass through, from the shed it is snowy), then the radio room from the archive (rainy).
    run = choose(run, 'gn-new-15-hall', 'The archive.').run;
    expect(scene(run, 'gn-new-15-archive').labels).toEqual(['Pass through.']);
    run = choose(run, 'gn-new-15-archive', 'Pass through.').run;
    run = choose(run, 'gn-new-15-hall', 'The radio room.').run;
    run = choose(run, 'gn-new-15-radio', 'Let Castform wash the lens.').run;
    expect(next(run)).toBe('gn-new-15-tower');
  });

  it('the radio room from the wrong room fights a wild one and the plan reopens; the shed from the radio room fails too', () => {
    let run = hall(inside('t15-wrong'));
    run = choose(run, 'gn-new-15-hall', 'The balloon shed.').run;
    run = win(choose(run, 'gn-new-15-shed', 'Let Castform try.').run);
    expect(flagOf(run, 'ws-shed')).toBe(0);
    expect(flagOf(run, 'ws-from')).toBe(3);
  });

  it('the tower: three choices; each pays the Castform with Forecast Ahead and ends the stage', () => {
    for (const label of ['"It\'ll pass."', '"You couldn\'t have known."', '"Let\'s read it together."']) {
      const run = inside(`t15-tower-${label.length}`);
      const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
      here.sides.push({ id: 'tower', kind: 'event', used: false, eventId: 'gn-new-15-tower' });
      expect(scene(run, 'gn-new-15-tower').labels).toEqual(['"It\'ll pass."', '"You couldn\'t have known."', '"Let\'s read it together."']);
      const done = choose(run, 'gn-new-15-tower', label).run;
      expect(flagOf(done, 'ws-done')).toBe(1);
      expect(done.stage!.pseudo).toBeFalsy();
      const castform = [...done.party, ...done.box, ...done.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m?.speciesId === 'castform');
      expect(castform, label).toBeTruthy();
      expect(castform!.fixedAbility).toBe('forecast-ahead');
      expect(abilityOf(content, castform!)).toBe('forecast-ahead');
    }
  });

  it('Forecast Ahead tells you at the start of a battle which weather the foe can set', () => {
    const lines = (foeAbility: string | null): string[] => {
      const me = createPokemon(content, 'castform', 20, 'p1');
      me.fixedAbility = 'forecast-ahead';
      const foe = createPokemon(content, 'ekans', 20, 'e1');
      foe.fixedAbility = foeAbility ?? undefined;
      const battle = createBattle('wild', [foe], 0, me.uid);
      const ctx: BattleContext = { content, battle, party: [me], inventory: {}, rng: new Rng(hashSeed('t15')), captureRng: new Rng(hashSeed('t15c')), catchMultiplier: 1 };
      return startBattle(ctx).flatMap((e) => (e.type === 'spectacle' ? [e.text] : [])).filter((t) => t.startsWith('Forecast Ahead'));
    };
    expect(lines('drizzle')).toEqual(['Forecast Ahead: their team can bring rain.']);
    expect(lines('snow-warning')).toEqual(['Forecast Ahead: their team can bring snow.']);
    expect(lines(null)).toEqual(['Forecast Ahead: nothing on their side can change the weather.']);
    const plain = createPokemon(content, 'ekans', 20, 'p2');
    const battle = createBattle('wild', [createPokemon(content, 'ekans', 20, 'e2')], 0, plain.uid);
    const ctx: BattleContext = { content, battle, party: [plain], inventory: {}, rng: new Rng(hashSeed('t15b')), captureRng: new Rng(hashSeed('t15d')), catchMultiplier: 1 };
    expect(startBattle(ctx).some((e) => e.type === 'spectacle' && e.text.startsWith('Forecast Ahead'))).toBe(false);
  });

  it('the pinned forecast shows once at step 1 of a later stage, and only after the Station', () => {
    const run = gnRun('t15-pin');
    expect(pinLine(content, run)).toBe('');
    setFlag(run, 'ws-done');
    expect(pinLine(content, run)).toMatch(/Forecast for this stage/);
    expect(pinLine(content, run)).toBe('');
  });

  it('right four times in five (over many stages)', () => {
    const run = gnRun('t15-rate');
    let right = 0;
    for (let i = 0; i < 400; i++) {
      run.seed = `rate-${i}`;
      if (pinnedWeather(content, run).right) right++;
    }
    expect(right / 400).toBeGreaterThan(0.72);
    expect(right / 400).toBeLessThan(0.88);
  });
});
