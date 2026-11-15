// Beta 0.7: Pidgey's Resolve, the Rivalry of the Sky (core/sky, data/events/sky-rivalry.json).

import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet, eligibleEvents } from '../../src/core/events';
import { chooseAutoAction } from '../../src/core/battle/autoBattle';
import { cheerDue, cheerSky } from '../../src/core/sky/spectate';
import { chunkLines } from '../../src/core/sky/text';
import { permanentForm } from '../../src/core/battle/transform';
import { abilityOf, createPokemon } from '../../src/core/pokemon';
import { createBattle, resolveTurn, type BattleEvent } from '../../src/core/battle/engine';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { applySky, fearowLevel, fearowMoves, giftCandidate, isFinaleStage, meetingIsAlone, pidgeotLevel, playFinale, recruitMon, settleSky, skyOf } from '../../src/core/sky/story';
import { freshSky, SkyStateSchema } from '../../src/core/sky/state';
import { cpuDuel } from '../../src/core/sky/sim';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const newRun = (seed = 'sky-1'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { eventsDensity: 'normal' } }), 0);
const sideOf = (run: RunState, eventId: string) => {
  const found = run.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.eventId === eventId);
  if (found) return found;
  // A scene the stage did not place (the test moved the story along by hand): put it beside the first node.
  const node = run.stage!.map.nodes[0]!;
  node.sides.push({ id: `event-test-${eventId}`, kind: 'event', used: false, eventId });
  return node.sides[node.sides.length - 1]!;
};
/** Starts a watched fight from its event (choice `pick`), then plays it to the end the way the scene does: auto turns, and a cheer when asked. */
const watch = (run: RunState, eventId: string, pick: number, cheer?: 'pidgeot' | 'fearow') => {
  const side = sideOf(run, eventId)!;
  run.stage!.current = run.stage!.map.nodes.find((n) => n.sides.some((x) => x.id === side.id))!.id;
  let cur = chooseEvent(content, run, side.id, pick).run;
  const party = structuredClone(cur.party);
  let asked = false;
  for (let i = 0; i < 300; i++) {
    if (cur.phase !== 'battle') throw new Error('the fight ended without a result');
    if (cheerDue(content, cur)) {
      asked = true;
      if (cheer) cheerSky(content, cur, cheer);
      else cur.battle!.spectate!.cheered = 'none';
    }
    const pickAction = chooseAutoAction(content, cur, [])!;
    const res = takeTurn(content, cur, pickAction.action);
    cur = res.run;
    if (res.spectated) return { run: cur, lines: res.spectated.lines, asked, watchedParty: party };
  }
  throw new Error('the fight did not end');
};
/** Finds a seed (from a fixed list) whose opening duel has this winner. */
const seedWhere = (winner: 'pidgey' | 'spearow'): string => {
  for (let i = 0; i < 200; i++) {
    const r = cpuDuel(content, `sky-${i}`, 'opening', { speciesId: 'pidgey', level: 5 }, { speciesId: 'spearow', level: 5 }, { names: ['Pidgey', 'Spearow'] });
    if ((r.winner === 0 ? 'pidgey' : 'spearow') === winner) return `sky-${i}`;
  }
  throw new Error('no seed');
};

describe('Pidgey\'s Resolve: data', () => {
  it('has all eight scenes, and the old evolution card is not the one that carries the story', () => {
    for (const id of ['sky.opening', 'sky.meet', 'sky.alone', 'sky.finale', 'sky.join.pidgeot', 'sky.join.fearow', 'sky.overhead', 'sky.rematch']) expect(content.events.get(id), id).toBeDefined();
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

  it('is a watched fight on the real engine: your team and Bag are set aside, both sides are birds, and nothing counts', () => {
    const run = newRun();
    const bag = structuredClone(run.inventory);
    const team = structuredClone(run.party);
    const side = sideOf(run, 'sky.opening')!;
    run.stage!.current = run.stage!.map.nodes.find((n) => n.sides.some((x) => x.id === side.id))!.id;
    const started = chooseEvent(content, run, side.id, 0).run;
    expect(started.phase).toBe('battle');
    expect(started.battle!.spectate).toEqual({ kind: 'duel' });
    expect(started.party.map((m) => m.speciesId)).toEqual(['pidgey']);
    expect(started.inventory).toEqual({});
    expect(started.battle!.enemyTeam[0]!.speciesId).toBe('spearow');
    const done = watch(newRun(), 'sky.opening', 0);
    expect(done.run.party).toEqual(team);
    expect(done.run.inventory['hm-fly'] ?? 0).toBeLessThanOrEqual(1);
    expect({ ...done.run.inventory, 'hm-fly': undefined }).toEqual({ ...bag, 'hm-fly': undefined });
    expect(done.run.phase).toBe('map');
    expect(done.run.battle).toBeNull();
    expect(skyOf(done.run)!.stash).toBeUndefined();
  });

  it('every backing and result is played out, and the lines are read', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      for (const pick of [0, 1]) {
        const done = watch(newRun(`sky-${i}`), 'sky.opening', pick);
        const sky = skyOf(done.run)!;
        seen.add(`${sky.backed}/${sky.duelWinner}`);
        expect(done.lines.join(' ').length).toBeGreaterThan(80);
        if (sky.backed === 'pidgey' && sky.duelWinner === 'pidgey') {
          expect(sky).toMatchObject({ phase: 'done', ending: 'hm' });
          expect(done.run.inventory['hm-fly']).toBe(1);
          expect(done.lines.join(' ')).toContain('Flying HM');
        } else {
          expect(sky.phase).toBe('rivalry');
          expect(done.run.inventory['hm-fly']).toBeUndefined();
        }
      }
    }
    expect(seen.size).toBe(4);
  });

  it('the watched fight is deterministic for a seed', () => {
    const a = watch(newRun('sky-7'), 'sky.opening', 0);
    const b = watch(newRun('sky-7'), 'sky.opening', 0);
    expect(skyOf(a.run)!.duelWinner).toBe(skyOf(b.run)!.duelWinner);
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

  it('Fearow is always the stronger bird, and training eases it', () => {
    const untrained = atCliff('cliff-3');
    const trained = atCliff('cliff-3', 3);
    trained.expansion!.sky!.gifts = ['oran-berry', 'oran-berry', 'oran-berry'];
    const gapU = fearowLevel(content, untrained, skyOf(untrained)!) - pidgeotLevel(content, untrained, skyOf(untrained)!);
    const gapT = fearowLevel(content, trained, skyOf(trained)!) - pidgeotLevel(content, trained, skyOf(trained)!);
    expect(gapU).toBeGreaterThan(0);
    expect(gapT).toBeLessThan(gapU);
  });

  it('is watched: Pidgeot (with its gifts) against Fearow (with the moves it learned), your team set aside', () => {
    const run = atCliff('cliff-4');
    skyOf(run)!.gifts = ['oran-berry'];
    skyOf(run)!.meets = 5;
    const side = sideOf(run, 'sky.finale')!;
    run.stage!.current = run.stage!.map.nodes.find((n) => n.sides.some((x) => x.id === side.id))!.id;
    const started = chooseEvent(content, run, side.id, 0).run;
    expect(started.battle!.spectate).toEqual({ kind: 'finale', cheerAt: 0.35 });
    expect(started.party.map((m) => m.speciesId)).toEqual(['pidgeot']);
    expect(started.party[0]!.held).toEqual({ 'oran-berry': 1 });
    expect(started.party[0]!.fixedAbility).toBe('scrappy');
    expect(started.battle!.enemyTeam[0]!.speciesId).toBe('fearow');
    expect(started.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(fearowMoves(skyOf(started)!));
  });

  it('across 30 seeds the player is usually asked, and the answer decides between real outcomes', () => {
    let asked = 0;
    let pidgeotCheerWins = 0;
    let fearowCheerPidgeotWins = 0;
    for (let i = 0; i < 30; i++) {
      const seed = `cliff-${i}`;
      const probe = watch(atCliff(seed), 'sky.finale', 0, 'pidgeot');
      if (!probe.asked) continue;
      asked++;
      if (skyOf(probe.run)!.finale.winner === 'pidgeot') pidgeotCheerWins++;
      const other = watch(atCliff(seed), 'sky.finale', 0, 'fearow');
      if (skyOf(other.run)!.finale.winner === 'pidgeot') fearowCheerPidgeotWins++;
    }
    expect(asked).toBeGreaterThanOrEqual(15);
    expect(pidgeotCheerWins).toBeGreaterThan(0);
    expect(pidgeotCheerWins).toBeLessThan(asked);
    expect(pidgeotCheerWins).toBeGreaterThan(fearowCheerPidgeotWins);
  });

  it('every ending follows the winner and the cheer, and your team always comes back', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40 && seen.size < 5; i++) {
      for (const cheer of ['pidgeot', 'fearow', undefined] as const) {
        const run = atCliff(`cliff-e${i}`);
        const team = structuredClone(run.party);
        const done = watch(run, 'sky.finale', 0, cheer);
        const sky = skyOf(done.run)!;
        expect(done.run.party).toEqual(team);
        expect(sky.stash).toBeUndefined();
        expect(done.lines.length).toBeGreaterThan(0);
        const here = done.run.stage!.map.nodes.flatMap((n) => n.sides).map((x) => x.eventId);
        if (!done.asked) {
          expect(sky.finale.cheer).toBeUndefined();
          expect(sky.ending).toBe(sky.finale.winner === 'pidgeot' ? 'pidgeot-alone' : 'fearow-alone');
        } else if (sky.finale.winner === 'pidgeot' && cheer === 'pidgeot') expect(here).toContain('sky.join.pidgeot');
        else if (sky.finale.winner === 'pidgeot') expect(sky.ending).toBe('pidgeot-left');
        else if (cheer === 'fearow') expect(here).toContain('sky.join.fearow');
        else expect(sky.ending).toBe('fearow-alone');
        seen.add(`${sky.finale.winner}/${cheer ?? 'none'}/${sky.ending ?? 'open'}`);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  it('cheering Pidgeot makes it Mega (a stoneless Mega); cheering Fearow gives Attack +2', () => {
    let megaSeen = false;
    let furySeen = false;
    for (let i = 0; i < 30 && !(megaSeen && furySeen); i++) {
      const r = atCliff(`cliff-m${i}`);
      const side = sideOf(r, 'sky.finale')!;
      r.stage!.current = r.stage!.map.nodes.find((n) => n.sides.some((x) => x.id === side.id))!.id;
      let run = chooseEvent(content, r, side.id, 0).run;
      for (let t = 0; t < 300 && run.phase === 'battle'; t++) {
        if (cheerDue(content, run)) {
          const bird = i % 2 === 0 ? 'pidgeot' : 'fearow';
          cheerSky(content, run, bird);
          if (bird === 'fearow') {
            expect(run.battle!.playerStages.atk).toBeGreaterThanOrEqual(2);
            furySeen = true;
          } else expect(run.party[0]!.skyMega).toBe(true);
        }
        const res = takeTurn(content, run, chooseAutoAction(content, run, [])!.action);
        run = res.run;
        if (res.events.some((e) => (e as { type: string; kind?: string }).type === 'transform' && (e as { kind?: string }).kind === 'mega')) megaSeen = true;
        if (res.spectated) break;
      }
    }
    expect(furySeen).toBe(true);
    expect(megaSeen).toBe(true);
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

describe('Pidgey\'s Resolve: reading the text', () => {
  it('long story lines are cut to pieces that fit the message box, and nothing is lost', () => {
    const long = ['You step off the path and the two of them do not even notice you. A Pidgey, small and brown and stubborn. A Spearow, loud and quick and a size too big for the branch.', 'Short.'];
    const pieces = chunkLines(long);
    expect(pieces.every((p) => p.length <= 84)).toBe(true);
    expect(pieces.join(' ').replace(/\s+/g, ' ')).toBe(long.join(' ').replace(/\s+/g, ' '));
    const huge = 'x'.repeat(200);
    expect(chunkLines([huge]).join('')).toBe(huge);
  });

  it('every line the story can say fits after cutting', async () => {
    const text = await import('../../src/core/sky/text');
    const all = [...text.DUEL_HEADER, ...text.duelResult('pidgey', 'pidgey'), ...text.duelResult('pidgey', 'spearow'), ...text.duelResult('spearow', 'pidgey'), ...text.duelResult('spearow', 'spearow'), ...text.FINALE_SETUP, text.FINALE_ASK, ...text.finaleEnd('pidgeot', 'pidgeot'), ...text.finaleEnd('pidgeot', 'fearow'), ...text.finaleEnd('pidgeot', undefined), ...text.finaleEnd('fearow', 'fearow'), ...text.finaleEnd('fearow', 'pidgeot'), ...text.finaleEnd('fearow', undefined)];
    for (const piece of chunkLines(all)) expect(piece.length).toBeLessThanOrEqual(84);
  });
});
