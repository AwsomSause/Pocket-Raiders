// Beta 0.7: Pidgey's Resolve, the Rivalry of the Sky (core/sky, data/events/sky-rivalry.json).

import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet, eligibleEvents } from '../../src/core/events';
import { permanentForm } from '../../src/core/battle/transform';
import { abilityOf, createPokemon } from '../../src/core/pokemon';
import { createBattle, resolveTurn, type BattleEvent } from '../../src/core/battle/engine';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { applySky, fearowLevel, fearowMoves, giftCandidate, isFinaleStage, meetingIsAlone, pidgeotLevel, playFinale, recruitMon, settleSky, skyOf } from '../../src/core/sky/story';
import { freshSky, SkyStateSchema } from '../../src/core/sky/state';
import { cpuDuel } from '../../src/core/sky/sim';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const newRun = (seed = 'sky-1'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { eventsDensity: 'normal' } }), 0);
const sideOf = (run: RunState, eventId: string) => run.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.eventId === eventId);
/** Finds a seed (from a fixed list) whose opening duel has this winner. */
const seedWhere = (winner: 'pidgey' | 'spearow'): string => {
  for (let i = 0; i < 200; i++) {
    const r = cpuDuel(content, `sky-${i}`, 'opening', { speciesId: 'pidgey', level: 5 }, { speciesId: 'spearow', level: 5 }, { names: ['Pidgey', 'Spearow'] });
    if ((r.winner === 0 ? 'pidgey' : 'spearow') === winner) return `sky-${i}`;
  }
  throw new Error('no seed');
};

describe('Pidgey\'s Resolve: data', () => {
  it('has all nine scenes, and the old evolution card is not the one that carries the story', () => {
    for (const id of ['sky.opening', 'sky.meet', 'sky.alone', 'sky.finale', 'sky.cheer', 'sky.join.pidgeot', 'sky.join.fearow', 'sky.overhead', 'sky.rematch']) expect(content.events.get(id), id).toBeDefined();
    expect(content.events.get('sky.meet')!.choices.length).toBeGreaterThanOrEqual(3);
  });

  it('Sky\'s Resolve is an ability; the Fly HM is a supported map item with 4 trips', () => {
    expect(content.abilities.get('skys-resolve')?.name).toBe("Sky's Resolve");
    expect(content.catalog.get('hm-fly')?.status).toBe('supported');
  });
});

describe('Pidgey\'s Resolve: the opening', () => {
  it('is offered on the first stage of a run with story events on, and not without them', () => {
    expect(eligibleEvents(content, newRun()).some((e) => e.id === 'sky.opening')).toBe(true);
    const plain = chooseStarter(content, createRun(content, { runId: 'p', seed: 'p', archetypeId: 'red' }), 0);
    expect(eligibleEvents(content, plain).some((e) => e.id === 'sky.opening')).toBe(false);
  });

  it('the winner is the same whichever bird you back, and for the same seed always', () => {
    const seed = seedWhere('pidgey');
    const a = newRun(seed);
    const b = newRun(seed);
    applySky(content, a, { kind: 'sky', act: 'duel', side: 'pidgey' });
    applySky(content, b, { kind: 'sky', act: 'duel', side: 'spearow' });
    expect(skyOf(a)!.duelWinner).toBe('pidgey');
    expect(skyOf(b)!.duelWinner).toBe('pidgey');
  });

  it('backing Pidgey and winning gives a Flying HM and ends the story', () => {
    const run = newRun(seedWhere('pidgey'));
    const text = applySky(content, run, { kind: 'sky', act: 'duel', side: 'pidgey' });
    expect(skyOf(run)).toMatchObject({ phase: 'done', ending: 'hm' });
    expect(run.inventory['hm-fly']).toBe(1);
    expect(text).toContain('Flying HM');
    expect(eligibleEvents(content, run).some((e) => e.id === 'sky.meet')).toBe(false);
  });

  it('backing Spearow and losing, backing Pidgey and losing, and backing Spearow and winning start the story', () => {
    for (const [side, winnerSeed] of [['spearow', 'pidgey'], ['pidgey', 'spearow'], ['spearow', 'spearow']] as const) {
      const run = newRun(seedWhere(winnerSeed));
      applySky(content, run, { kind: 'sky', act: 'duel', side });
      const sky = skyOf(run)!;
      expect(sky.backed).toBe(side);
      if (side === 'spearow' && winnerSeed === 'pidgey') {
        // Spearow loses: nothing happens, and the story does not begin.
        expect(sky.phase).toBe('rivalry');
      }
      expect(sky.phase).toBe('rivalry');
      expect(run.inventory['hm-fly']).toBeUndefined();
    }
  });

  it('plays through the event system: the stop is on the map, and choosing it stores the story', () => {
    const run = newRun(seedWhere('spearow'));
    const side = sideOf(run, 'sky.opening');
    expect(side).toBeDefined();
    run.stage!.current = run.stage!.map.nodes.find((n) => n.sides.some((x) => x.id === side!.id))!.id;
    const res = chooseEvent(content, run, side!.id, 0);
    expect(skyOf(res.run)?.backed).toBe('pidgey');
    expect(res.changes.join('\n')).toContain('branch');
  });
});

describe('Pidgey\'s Resolve: through the region', () => {
  const started = (): RunState => {
    const run = newRun(seedWhere('spearow'));
    applySky(content, run, { kind: 'sky', act: 'duel', side: 'pidgey' });
    return run;
  };

  it('Pidgey appears once per stage, and Fearow learns a move at each meeting', () => {
    const run = started();
    const sky = skyOf(run)!;
    expect(fearowMoves(sky)).toEqual(['peck', 'leer']);
    expect(meetingIsAlone(run, sky)).toBe(false); // never the first meeting
    expect(conditionMet(content, run, { kind: 'sky', when: 'meet' })).toBe(true);
    applySky(content, run, { kind: 'sky', act: 'meetSpar' });
    expect(sky.meets).toBe(1);
    expect(conditionMet(content, run, { kind: 'sky', when: 'meet' })).toBe(false); // same stage: no second meeting
    expect(fearowMoves(sky)).toEqual(['peck', 'leer', 'pursuit']);
  });

  it('a meeting clears the "seen" mark so the scene comes back on the next stage', () => {
    const run = started();
    run.itemCounters = { ...run.itemCounters, 'event-seen:sky.meet': 1 };
    applySky(content, run, { kind: 'sky', act: 'meetSpar' });
    expect(run.itemCounters!['event-seen:sky.meet']).toBeUndefined();
  });

  it('beating Pidgey in a spar teaches it an answer to what beat it', () => {
    const run = started();
    run.party[0] = { ...run.party[0]!, speciesId: 'bulbasaur' };
    applySky(content, run, { kind: 'sky', act: 'meetSpar' });
    const text = applySky(content, run, { kind: 'sky', act: 'sparWon' });
    expect(skyOf(run)!.answers).toEqual(['air-slash']);
    expect(text).toContain('air slash');
  });

  it('a gift is taken from the Bag, kept, and goes with Pidgeot', () => {
    const run = started();
    run.inventory['oran-berry'] = 2;
    expect(giftCandidate(content, run, 'berry')).toBe('oran-berry');
    applySky(content, run, { kind: 'sky', act: 'giftBerry' });
    expect(run.inventory['oran-berry']).toBe(1);
    expect(skyOf(run)!.gifts).toEqual(['oran-berry']);
    const mon = recruitMon(content, run, skyOf(run)!, 'pidgeot');
    expect(mon.held).toEqual({ 'oran-berry': 1 });
  });

  it('a stage found "alone" gives no spar, and a berry left for it counts as a gift', () => {
    const run = started();
    run.inventory['oran-berry'] = 1;
    applySky(content, run, { kind: 'sky', act: 'meetSpar' });
    const sky = skyOf(run)!;
    sky.metStages = [];
    const text = applySky(content, run, { kind: 'sky', act: 'aloneGift' });
    expect(sky.alone).toBe(1);
    expect(sky.gifts).toEqual(['oran-berry']);
    expect(text).toContain('does not eat it');
  });
});

describe('Pidgey\'s Resolve: the cliff', () => {
  const atCliff = (seed: string, spars = 0): RunState => {
    const run = newRun(seed);
    const sky = freshSky(run.regionIndex, 'pidgey', 'spearow');
    sky.meets = 3;
    sky.spars = spars;
    run.expansion = { ...run.expansion, sky };
    // The last stage of the region, with a party at the level a real run has by then.
    run.stage!.index = 7;
    run.party.forEach((m) => (m.level = 25));
    return run;
  };

  it('is only on the last stage of the story region', () => {
    const run = atCliff('cliff-1');
    expect(isFinaleStage(content, run)).toBe(true);
    expect(conditionMet(content, run, { kind: 'sky', when: 'finale' })).toBe(true);
    expect(conditionMet(content, run, { kind: 'sky', when: 'meet' })).toBe(false);
    run.stage!.index = 2;
    expect(conditionMet(content, run, { kind: 'sky', when: 'finale' })).toBe(false);
  });

  it('the fight is a replay: the same inputs are the same fight, and the ask never changes the start', () => {
    const run = atCliff('cliff-2');
    const sky = skyOf(run)!;
    const a = playFinale(content, run, sky, 'ask');
    const b = playFinale(content, run, sky, 'ask');
    expect(a).toEqual(b);
    const c1 = playFinale(content, run, sky, 'pidgeot');
    const c2 = playFinale(content, run, sky, 'pidgeot');
    expect(c1).toEqual(c2);
  });

  it('Fearow is always the stronger bird, and training eases it', () => {
    const untrained = atCliff('cliff-3');
    const trained = atCliff('cliff-3', 3);
    trained.expansion!.sky!.gifts = ['oran-berry', 'oran-berry', 'oran-berry'];
    expect(fearowLevel(content, untrained, skyOf(untrained)!)).toBeGreaterThan(pidgeotLevel(content, untrained, skyOf(untrained)!));
    const gapU = fearowLevel(content, untrained, skyOf(untrained)!) - pidgeotLevel(content, untrained, skyOf(untrained)!);
    const gapT = fearowLevel(content, trained, skyOf(trained)!) - pidgeotLevel(content, trained, skyOf(trained)!);
    expect(gapT).toBeLessThan(gapU);
  });

  it('across 40 seeds the player is usually asked, and the cheer decides between two real outcomes', () => {
    let asked = 0;
    let cheerPidgeotWins = 0;
    let cheerFearowPidgeotWins = 0;
    for (let i = 0; i < 40; i++) {
      const run = atCliff(`cliff-${i}`);
      const sky = skyOf(run)!;
      if (!playFinale(content, run, sky, 'ask').asked) continue;
      asked++;
      if (playFinale(content, run, sky, 'pidgeot').winner === 0) cheerPidgeotWins++;
      if (playFinale(content, run, sky, 'fearow').winner === 0) cheerFearowPidgeotWins++;
    }
    expect(asked).toBeGreaterThanOrEqual(24);
    // Cheering Pidgeot wins it more often than cheering Fearow does (the Mega is worth more than Attack +2), and it is never certain.
    expect(cheerPidgeotWins).toBeGreaterThan(cheerFearowPidgeotWins);
    expect(cheerPidgeotWins).toBeLessThan(asked);
    expect(cheerPidgeotWins).toBeGreaterThan(0);
  });

  it('watching starts the ask and puts the cheer scene beside you; cheering decides it and an unanswered join closes', () => {
    for (let i = 0; i < 30; i++) {
      const run = atCliff(`cliff-w${i}`);
      run.stage!.current = run.stage!.map.nodes[0]!.id;
      const text = applySky(content, run, { kind: 'sky', act: 'finaleWatch' });
      const sky = skyOf(run)!;
      if (!sky.finale.asked) {
        expect(sky.phase).toBe('done');
        expect(text).toBeTruthy();
        continue;
      }
      expect(sky.phase).toBe('rivalry');
      expect(run.stage!.map.nodes[0]!.sides.some((s) => s.eventId === 'sky.cheer')).toBe(true);
      applySky(content, run, { kind: 'sky', act: 'cheer', bird: 'pidgeot' });
      expect(sky.finale.cheer).toBe('pidgeot');
      expect(['pidgeot', 'fearow']).toContain(sky.finale.winner);
      if (sky.finale.winner === 'pidgeot') {
        expect(run.stage!.map.nodes[0]!.sides.some((s) => s.eventId === 'sky.join.pidgeot')).toBe(true);
        // The join is never answered: the next region begins and it flies free.
        run.regionIndex += 1;
        settleSky(content, run);
        expect(sky.ending).toBe('pidgeot-free');
        return;
      }
      // Fearow won after Pidgeot was cheered: both birds go their own way.
      expect(sky.ending).toBe('fearow-alone');
    }
  });

  it('Pidgeot joins once, with Scrappy, a stoneless Mega that has Sky\'s Resolve, and its held item', () => {
    const run = atCliff('cliff-join');
    const sky = skyOf(run)!;
    sky.gifts = ['oran-berry'];
    sky.finale = { asked: true, cheer: 'pidgeot', winner: 'pidgeot' };
    const text = applySky(content, run, { kind: 'sky', act: 'joinBird', bird: 'pidgeot' });
    expect(sky.ending).toBe('pidgeot-joined');
    const pending = run.pending.find((p) => p.kind === 'caught');
    expect(pending).toBeDefined();
    expect(text).toContain("Sky's Resolve");
    // A second join is refused.
    const before = run.pending.length;
    applySky(content, run, { kind: 'sky', act: 'joinBird', bird: 'pidgeot' });
    expect(run.pending.length).toBe(before);
    const mon = (pending as { mon: RunState['party'][number] }).mon;
    expect(mon.fixedAbility).toBe('scrappy');
    expect(mon.skyMega).toBe(true);
    expect(abilityOf(content, mon)).toBe('scrappy');
    // No Mega Ring, no stone: it still has its Mega form, and the Mega ability is Sky's Resolve.
    const form = permanentForm(content, {}, mon);
    expect(form?.kind).toBe('mega');
    const mega = { ...mon, speciesId: form!.option.formId };
    expect(abilityOf(content, mega)).toBe('skys-resolve');
  });

  it('Fearow joins with Sniper and Drill Run', () => {
    const run = atCliff('cliff-fearow');
    const sky = skyOf(run)!;
    sky.finale = { asked: true, cheer: 'fearow', winner: 'fearow' };
    applySky(content, run, { kind: 'sky', act: 'joinBird', bird: 'fearow' });
    const mon = (run.pending.find((p) => p.kind === 'caught') as { mon: RunState['party'][number] }).mon;
    expect(mon.fixedAbility).toBe('sniper');
    expect(mon.moves.some((m) => m.id === 'drill-run')).toBe(true);
    expect(sky.ending).toBe('fearow-joined');
  });

  it('a story left hanging is settled when the Elite Four or the next region begins, without a second fight', () => {
    const run = atCliff('cliff-settle');
    run.stage!.kind = 'league' as never;
    settleSky(content, run);
    const sky = skyOf(run)!;
    expect(sky.phase).toBe('done');
    expect(['pidgeot-alone', 'fearow-alone']).toContain(sky.ending);
    const ending = sky.ending;
    settleSky(content, run);
    expect(sky.ending).toBe(ending);
  });
});

describe('Pidgey\'s Resolve: the afterstory', () => {
  const after = (ending: 'pidgeot-left' | 'pidgeot-free' | 'fearow-free' | 'fearow-alone'): RunState => {
    const run = newRun('after');
    const sky = freshSky(run.regionIndex, 'pidgey', 'spearow');
    sky.phase = 'done';
    sky.ending = ending;
    run.expansion = { ...run.expansion, sky };
    run.regionIndex += 1;
    return run;
  };

  it('the bird that did not join is overhead in the next region, once', () => {
    for (const ending of ['pidgeot-free', 'fearow-free', 'fearow-alone'] as const) {
      const run = after(ending);
      expect(conditionMet(content, run, { kind: 'sky', when: 'overhead' })).toBe(true);
      const text = applySky(content, run, { kind: 'sky', act: 'overhead' });
      expect(text.length).toBeGreaterThan(40);
      expect(conditionMet(content, run, { kind: 'sky', when: 'overhead' })).toBe(false);
    }
  });

  it('a Pidgeot that left is met again for one more fight, not an overhead shape', () => {
    const run = after('pidgeot-left');
    expect(conditionMet(content, run, { kind: 'sky', when: 'overhead' })).toBe(false);
    expect(conditionMet(content, run, { kind: 'sky', when: 'rematch' })).toBe(true);
    applySky(content, run, { kind: 'sky', act: 'rematchWon' });
    expect(skyOf(run)!.ending).toBe('rematch-done');
    expect(conditionMet(content, run, { kind: 'sky', when: 'rematch' })).toBe(false);
  });
});

describe('Pidgey\'s Resolve: saves', () => {
  it('the state round-trips through the expansion schema, and an old run without it loads', () => {
    const sky = freshSky(0, 'spearow', 'pidgey');
    sky.gifts.push('oran-berry');
    const parsed = ExpansionRunSchema.parse(JSON.parse(JSON.stringify({ sky })));
    expect(parsed.sky).toEqual(SkyStateSchema.parse(sky));
    expect(ExpansionRunSchema.parse({}).sky).toBeUndefined();
  });

  it('a Pokémon with skyMega survives a copy; one without it has no such field', () => {
    const mon = createPokemon(content, 'pidgeot', 30, 'x');
    expect(mon.skyMega).toBeUndefined();
    expect(structuredClone({ ...mon, skyMega: true as const }).skyMega).toBe(true);
  });
});

describe('Sky\'s Resolve in battle', () => {
  const fight = (ability: string | undefined, aMoves: string[], bMoves: string[], bSpecies = 'caterpie') => {
    const a = createPokemon(content, 'pidgeot', 50, 'a');
    a.moves = aMoves.map((id) => ({ id, pp: 99 }));
    if (ability) a.fixedAbility = ability;
    a.hp = 9999;
    const b = createPokemon(content, bSpecies, 50, 'b');
    b.moves = bMoves.map((id) => ({ id, pp: 99 }));
    b.hp = 9999;
    const battle = createBattle('trainer', [b], 0, a.uid, { classId: 'ace-trainer', name: 'x', leaderId: null });
    const ctx = { content, battle, party: [a], inventory: {}, rng: new Rng(hashSeed('sr')), captureRng: new Rng(hashSeed('sc')), catchMultiplier: 1 };
    const events: BattleEvent[] = [];
    for (let i = 0; i < 30; i++) events.push(...resolveTurn(ctx, { kind: 'move', index: 0 }));
    return events;
  };

  it('Normal moves become Flying: Tackle is super effective against a Bug', () => {
    const plain = fight(undefined, ['tackle'], ['harden']);
    const resolve = fight('skys-resolve', ['tackle'], ['harden']);
    const eff = (es: BattleEvent[]) => es.find((e) => e.type === 'damage' && e.side === 'enemy');
    expect((eff(plain) as { effectiveness: number }).effectiveness).toBe(1);
    expect((eff(resolve) as { effectiveness: number }).effectiveness).toBe(2);
  });

  it('its moves cannot miss, and moves used against it cannot miss either (the cost stays)', () => {
    const misses = (es: BattleEvent[], side: 'player' | 'enemy') => es.filter((e) => e.type === 'miss' && e.side === side).length;
    const control = fight(undefined, ['hurricane'], ['hurricane'], 'pidgeot');
    expect(misses(control, 'player') + misses(control, 'enemy')).toBeGreaterThan(0);
    const resolve = fight('skys-resolve', ['hurricane'], ['hurricane'], 'pidgeot');
    expect(misses(resolve, 'player')).toBe(0);
    expect(misses(resolve, 'enemy')).toBe(0);
  });
});
