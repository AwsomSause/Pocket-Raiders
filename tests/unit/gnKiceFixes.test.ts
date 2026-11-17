// Kice's Greenneedle fix list (2026-11-16): watched-only Pidgey's Resolve fights, the other Pokémon may join the rival,
// the Labyrinth's level 1 Unown stand-in, exact Tournament scaling with a hidden finalist, Flight North's bug on stage.
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseAutoAction } from '../../src/core/battle/autoBattle';
import { createPokemon } from '../../src/core/pokemon';
import { leadStarEvent, skyBirdStaging, SKY_RIVAL_SIZE } from '../../src/core/presentation/eventStars';
import { rivalMayRecruit, RIVAL_EVENT_RECRUIT, settleRivalRecruits } from '../../src/core/rivals/eventRecruit';
import { mainRival } from '../../src/core/rivals/questlines';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { applySky, skyOf } from '../../src/core/sky/story';
import { tourneyBracket } from '../../src/core/expansion/tourney';
import type { RunState } from '../../src/core/state';
import { tourneyPage, tourneyRounds } from '../../src/ui/redux/screens/bracket';
import { content } from './helpers';
import { choose, gnRun, open, setFlag, win } from './helpers/gnPlay';

const newRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { eventsDensity: 'normal' } }), 0);

describe("Pidgey's Resolve: no fight is played", () => {
  const sparring = (seed: string): RunState => {
    const run = newRun(seed);
    applySky(content, run, { kind: 'sky', act: 'duel', side: 'spearow' });
    skyOf(run)!.duelWinner = 'spearow';
    skyOf(run)!.phase = 'rivalry';
    const node = run.stage!.map.nodes[0]!;
    node.sides = [{ id: 'event-test-meet', kind: 'event', used: false, eventId: 'sky.meet' }];
    run.stage!.current = node.id;
    const at = content.events.get('sky.meet')!.choices.findIndex((c) => /spar/i.test(c.label));
    return chooseEvent(content, run, 'event-test-meet', at).run;
  };

  it('the spar is watched: the lead fights by itself, and the real team and Bag come back untouched', () => {
    const before = newRun('kice-spar');
    const run = sparring('kice-spar');
    expect(run.phase).toBe('battle');
    expect(run.battle!.spectate).toEqual({ kind: 'duel' });
    expect(run.party).toHaveLength(1);
    expect(run.inventory).toEqual({});
    let cur = run;
    for (let i = 0; i < 300 && cur.phase === 'battle'; i++) {
      const res = takeTurn(content, cur, chooseAutoAction(content, cur, [])!.action);
      cur = res.run;
      if (res.spectated) {
        expect(res.defeated).toBe(false);
        break;
      }
    }
    expect(cur.phase).not.toBe('battle');
    expect(skyOf(cur)!.stash).toBeUndefined();
    expect(cur.party.map((m) => [m.uid, m.hp, m.level])).toEqual(before.party.map((m) => [m.uid, m.hp, m.level]));
    expect(cur.inventory).toEqual(before.inventory);
    expect(skyOf(cur)!.spars).toBe(1);
  });
});

describe('the other Pokémon may join your rival', () => {
  const rivalOf = () => ({ id: 'r1', name: 'Blue', encounters: 1, setbacks: 0, state: 'active', adaptations: [], bonds: {}, cooldown: 0, traits: { ambition: 50, pride: 40, empathy: 50, adaptability: 40, vindictiveness: 30, resilience: 50 }, memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 1, turns: 3, team: ['rattata'], foes: [] as string[] } } }) as never;

  it('rolls once per story on its own stream; a hit puts the species on the main rival for good', () => {
    let hits = 0;
    for (let i = 0; i < 40; i++) {
      const run = newRun(`kice-rival-${i}`);
      run.story.rivals.push(rivalOf());
      const stream = structuredClone(run.rng);
      const line = rivalMayRecruit(content, run, 'fearow', 'sky');
      expect(run.rng).toEqual(stream);
      const caught = mainRival(run)!.caught ?? [];
      if (line) {
        hits += 1;
        expect(caught.map((c) => c.speciesId)).toEqual(['fearow']);
        expect(line).toContain('Blue');
      } else expect(caught).toEqual([]);
      expect(rivalMayRecruit(content, run, 'fearow', 'sky')).toBe('');
      expect((mainRival(run)!.caught ?? []).length).toBe(line ? 1 : 0);
    }
    expect(RIVAL_EVENT_RECRUIT.chance).toBe(0.5);
    expect(hits).toBeGreaterThan(8);
    expect(hits).toBeLessThan(32);
  });

  it('before any rival is met a hit is owed, and joins when the rival exists', () => {
    for (let i = 0; i < 40; i++) {
      const run = newRun(`kice-owed-${i}`);
      run.story.rivals = [];
      rivalMayRecruit(content, run, 'poliwhirl', 'pond');
      if (run.story.flags['ev:rival-recruit-pond'] !== 2) continue;
      run.story.rivals.push(rivalOf());
      settleRivalRecruits(content, run);
      expect(mainRival(run)!.caught!.map((c) => c.speciesId)).toEqual(['poliwhirl']);
      expect(run.story.flags['ev:rival-recruit-pond']).toBe(1);
      return;
    }
    throw new Error('no seed hit');
  });

  it('keeping the Poliwag and welcoming the Pidgeot are the two moments that roll', () => {
    const keep = content.events.get('pp-ending')!.choices[0]!.success.effects;
    expect(keep.some((e) => e.kind === 'pond' && e.action === 'keep')).toBe(true);
    const welcome = content.events.get('sky.join.pidgeot')!.choices[0]!.success.effects;
    expect(welcome.some((e) => e.kind === 'sky' && e.act === 'joinBird')).toBe(true);
  });
});

describe("Sabrina's Labyrinth: the first fight", () => {
  it('your side is a level 1 Unown (never a Pokémon of yours), and it is gone when the fight ends', () => {
    const run = gnRun('kice-lab');
    run.party.push(createPokemon(content, 'pikachu', run.party[0]!.level, 'p-test-pikachu'));
    open(run, 'gn-14-door');
    const fight = choose(choose(run, 'gn-14-door', 'Read it.').run, 'gn-14-lost', 'Stand there anyway.').run;
    const mine = fight.party[fight.battle!.activeIndex]!;
    expect([mine.speciesId, mine.level]).toEqual(['unown', 1]);
    const after = takeTurn(content, structuredClone(fight), { kind: 'move', index: 0 }).run;
    expect(after.phase).toBe('map');
    expect(after.party.some((m) => m.speciesId === 'unown')).toBe(false);
    expect(after.party).toHaveLength(1);
    expect(after.story.flags['ev:stand-in-uid']).toBeUndefined();
  });
});

describe('the Fighting Tournament', () => {
  const signed = (seed: string, level: number): RunState => {
    const run = gnRun(seed);
    const mankey = createPokemon(content, 'mankey', level, 'p-r25');
    mankey.moves = [{ id: 'karate-chop', pp: 25 }];
    run.party.push(mankey);
    setFlag(run, 'kanto-mankey');
    open(run, 'gn-16-door');
    return choose(run, 'gn-16-door', 'Sign up.').run;
  };
  const toFinal = (seed: string, level: number): RunState => {
    let run = signed(seed, level);
    run = choose(win(choose(run, 'gn-16-r1', 'Step into the ring.').run), 'gn-16-c1', 'Good match.').run;
    run = choose(run, 'gn-16-gap1', 'Power').run;
    run = choose(win(choose(run, 'gn-16-r2', 'Bow back.').run), 'gn-16-gap2', 'Guard').run;
    run = choose(win(choose(run, 'gn-16-r3', 'Step into the ring.').run), 'gn-16-gap3', 'Footwork').run;
    run = win(choose(run, 'gn-16-r4', 'Step into the ring.').run);
    return choose(run, 'gn-16-gap4', 'Rest.').run;
  };

  it('every foe, the finalist too, is exactly the fighter\'s level, even above the region cap', () => {
    for (const level of [12, 90]) {
      const run = signed(`kice-t16-${level}`, level);
      const r1 = choose(run, 'gn-16-r1', 'Step into the ring.').run;
      expect(r1.battle!.enemyTeam[0]!.level).toBe(r1.party[r1.battle!.activeIndex]!.level);
      const final = choose(toFinal(`kice-t16f-${level}`, level), 'gn-16-final', 'Step into the ring.').run;
      expect(final.battle!.enemyTeam[0]!.level).toBe(final.party[final.battle!.activeIndex]!.level);
    }
  });

  it('the finalist is "?" on the strip and the bracket until the final', () => {
    const run = signed('kice-t16-hide', 12);
    for (const now of [0, 1, 2, 3, 4]) {
      const view = tourneyBracket(content, run, now);
      expect(tourneyRounds(view)[4]!.who).toBe('?');
      for (const page of [0, 1, 2, 3, 4]) {
        const slots = tourneyPage(view, (s) => s, page, 't').columns.flatMap((c) => c.slots);
        expect(slots.some((s) => s && /^Rival /.test(s.name))).toBe(false);
      }
    }
    const view = tourneyBracket(content, run, 5);
    expect(tourneyRounds(view)[4]!.who).toMatch(/^Rival /);
    expect(tourneyPage(view, (s) => s, 4, 't').columns.flatMap((c) => c.slots).some((s) => s && /^Rival /.test(s.name))).toBe(true);
    expect(content.events.get('gn-16-gap4')!.scene.pokemon).not.toBe('primeape');
  });
});

describe('who stands on the event stage', () => {
  it('Flight North shows the bug in every room after the bully, and no room pictures a Pidgey except the flock at Hatching', () => {
    for (const id of ['meadow', 'cocoon', 'stream', 'hatch', 'camp', 'boss', 'goodbye']) expect(leadStarEvent(`gn-13-${id}`)).toBe(true);
    expect(leadStarEvent('gn-13-check')).toBe(false);
    expect(leadStarEvent('gn-13-bully')).toBe(false);
    expect(content.events.get('gn-13-meadow')!.scene.pokemon).toBeUndefined();
    const meadow = content.events.get('gn-13-meadow')!.choices[0]!.success.battle!;
    expect(meadow.kind === 'wild' && meadow.species.includes('pidgey')).toBe(false);
  });

  it("Pidgey's Resolve only: Pidgey's line first at its own size, Spearow or Fearow a little taller", () => {
    expect(skyBirdStaging('sky.opening', ['spearow', 'pidgey'])).toEqual({ order: [1, 0], size: [null, SKY_RIVAL_SIZE] });
    expect(skyBirdStaging('sky.finale', ['pidgeot', 'fearow'])).toEqual({ order: [0, 1], size: [null, SKY_RIVAL_SIZE] });
    expect(skyBirdStaging('sky.meet', ['pidgey'])).toBeNull();
    expect(skyBirdStaging('gn-13-hatch', ['pidgey', 'spearow'])).toBeNull();
    expect(SKY_RIVAL_SIZE).toBeGreaterThan(1);
  });
});
