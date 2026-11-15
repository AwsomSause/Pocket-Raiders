// Greenneedle part 4 (doc GREENNEEDLE_REWORKED_PLACED_4.md): gn.16 The Fighting Tournament.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { FOE_WAITS } from '../../src/core/greenneedle';
import { RIVAL_RETURN_EVENT } from '../../src/core/expansion/canonSaffron';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

describe('gn.16 The Fighting Tournament', () => {
  /** A run with the Route 25 Mankey and two others, at the Tournament's door, signed up. */
  const signed = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    const mankey = createPokemon(content, 'mankey', run.party[0]!.level, 'p-r25');
    mankey.moves = [{ id: 'karate-chop', pp: 25 }];
    run.party.push(mankey, createPokemon(content, 'eevee', 5, 'p-eevee'));
    setFlag(run, 'kanto-mankey');
    setup(run);
    open(run, 'gn-16-door');
    return choose(run, 'gn-16-door', 'Sign up.').run;
  };
  /** A won prize: in the bag, or already held by the fighter. */
  const prize = (run: RunState, id: string) => (run.inventory[id] ?? 0) > 0 || run.party.some((m) => (m.held?.[id] ?? 0) > 0);
  const fighter = (run: RunState) => run.party.find((m) => m.uid === 'p-r25')!;
  /** Rounds 1 to 4 and the montage, up to the final. */
  const toFinal = (seed: string, setup?: (run: RunState) => void): RunState => {
    let run = signed(seed, setup);
    run = choose(win(choose(run, 'gn-16-r1', 'Step into the ring.').run), 'gn-16-c1', 'Good match.').run;
    run = choose(run, 'gn-16-gap1', 'Power').run;
    run = choose(win(choose(run, 'gn-16-r2', 'Bow back.').run), 'gn-16-gap2', 'Guard').run;
    run = choose(win(choose(run, 'gn-16-r3', 'Step into the ring.').run), 'gn-16-gap3', 'Footwork').run;
    run = win(choose(run, 'gn-16-r4', 'Step into the ring.').run);
    return choose(run, 'gn-16-gap4', 'Rest.').run;
  };

  it('needs the Route 25 Mankey in the party, the stage after; until towns exist it is optional on step 15 (window 13 to 18)', () => {
    expect(content.coPlacement!.get('gn-16-door')).toMatchObject({ home: 15, window: [13, 18], sits: 'optional' });
    const req = content.events.get('gn-16-door')!.requires;
    expect(req).toContainEqual(expect.objectContaining({ key: 'kanto-mankey' }));
    expect(req).toContainEqual(expect.objectContaining({ kind: 'partyLine', species: 'mankey' }));
    expect(req).toContainEqual(expect.objectContaining({ kind: 'gn', test: 'laterStage', key: 'mankey-at' }));
  });

  it('signing up leaves only the Mankey; with the food returned the troop is in the stands (Crowd 2)', () => {
    const run = signed('t16-sign', (r) => setFlag(r, 'mankey-food-returned'));
    expect(run.party.map((m) => m.uid)).toEqual(['p-r25']);
    expect(flagOf(run, 'tournament-crowd')).toBe(2);
    expect(flagOf(signed('t16-sign-b'), 'tournament-crowd')).toBe(0);
    expect(content.events.get('gn-16-r1')!.scene.tourney).toBe(1);
  });

  it('every round is one on one, scaled to the fighter; it heals 40% between rounds and pays the round prize', () => {
    const run = signed('t16-r1');
    const r1 = choose(run, 'gn-16-r1', 'Step into the ring.').run;
    expect(r1.battle!.enemyTeam).toHaveLength(1);
    expect(r1.battle!.enemyTeam[0]!.level).toBe(fighter(run).level);
    expect(r1.battle!.eventRule).toMatchObject({ matchLead: true, bstMatch: true, myStages: { spe: 1 } });
    const after = win(r1);
    expect(prize(after, 'muscle-band')).toBe(true);
    const r4 = choose(toFinal('t16-r4'), 'gn-16-final', 'Step into the ring.').run;
    expect(r4.battle!.eventRule).toMatchObject({ gn: 'final', evolveMid: true });
  });

  it('the montage: Power, Guard and Footwork once each; the fourth gap offers Rest.', () => {
    let run = signed('t16-mont');
    run = choose(win(choose(run, 'gn-16-r1', 'Step into the ring.').run), 'gn-16-c1', 'Walk on.').run;
    expect(scene(run, 'gn-16-gap1').labels).toEqual(['Power', 'Guard', 'Footwork']);
    run = choose(run, 'gn-16-gap1', 'Footwork').run;
    expect(flagOf(run, 'tournament-montage-footwork')).toBe(1);
    const r2 = choose(run, 'gn-16-r2', "Don't.").run;
    expect(fighter(r2).boosts ?? r2.battle!.playerStages).toBeTruthy();
    run = win(r2);
    expect(scene(run, 'gn-16-gap2').labels).toEqual(['Power', 'Guard']);
    expect(scene(toFinal('t16-mont-b'), 'gn-16-final').labels).toEqual(['Step into the ring.']);
    let c = signed('t16-mont-c');
    c = choose(win(choose(c, 'gn-16-r1', 'Step into the ring.').run), 'gn-16-c1', 'Walk on.').run;
    c = choose(win(choose(choose(c, 'gn-16-gap1', 'Power').run, 'gn-16-r2', "Don't.").run), 'gn-16-gap2', 'Guard').run;
    c = choose(win(choose(c, 'gn-16-r3', 'Step into the ring.').run), 'gn-16-gap3', 'Footwork').run;
    const at4 = scene(win(choose(c, 'gn-16-r4', 'Step into the ring.').run), 'gn-16-gap4');
    expect(at4.labels).toEqual(['Rest.']);
  });

  it('bowing to the Throh: Crowd +1 and it bows in the front row of the final; the Hawlucha misses twice on purpose; the fifth guards the front row (Crowd +2)', () => {
    let run = signed('t16-bow', (r) => setFlag(r, 'mankey-fifth-joined'));
    run = choose(win(choose(run, 'gn-16-r1', 'Step into the ring.').run), 'gn-16-c1', 'Walk on.').run;
    run = choose(run, 'gn-16-gap1', 'Power').run;
    const bow = choose(run, 'gn-16-r2', 'Bow back.').run;
    expect(flagOf(bow, 'tournament-crowd')).toBeGreaterThanOrEqual(1);
    run = choose(win(bow), 'gn-16-gap2', 'Guard').run;
    run = choose(win(choose(run, 'gn-16-r3', 'Step into the ring.').run), 'gn-16-gap3', 'Footwork').run;
    const before = flagOf(run, 'tournament-crowd');
    const r4 = choose(run, 'gn-16-r4', 'Step into the ring.');
    expect(flagOf(r4.run, 'tournament-crowd')).toBe(Math.min(5, before + 2));
    expect(r4.run.battle!.storyEffects.filter((x) => x.startsWith(FOE_WAITS))).toHaveLength(2);
    const fin = choose(choose(win(r4.run), 'gn-16-gap4', 'Rest.').run, 'gn-16-final', 'Step into the ring.');
    expect([fin.text, ...fin.changes].join(' ')).toMatch(/Throh is bowing/);
  });

  it('winning the final outright: Champion, Dynamic Punch, Champion\'s Entrance, the team comes back; sharing the prize is Kindness +2', () => {
    const run = win(choose(toFinal('t16-win'), 'gn-16-final', 'Step into the ring.').run);
    expect(flagOf(run, 'kanto-tournament-won')).toBe(1);
    expect(run.party).toHaveLength(3);
    const champ = fighter(run);
    expect(champ.fixedAbility).toBe('champions-entrance');
    expect(champ.moves.map((m) => m.id)).toContain('dynamic-punch');
    expect(scene(run, 'gn-16-bell').labels).toEqual(['Keep the prize money.', "Give it to Pax's troop.", 'Split it.']);
    expect(flagOf(choose(run, 'gn-16-bell', 'Split it.').run, 'tournament-shared')).toBe(1);
  });

  it('the last exchange: when both are under a quarter the match pauses for "Now!", "Wait for it." or "You choose." (Bond 3: its first move goes first)', () => {
    const fin = choose(toFinal('t16-last'), 'gn-16-final', 'Step into the ring.').run;
    const b = fin.battle!;
    const me = fin.party[b.activeIndex]!;
    me.moves = [{ id: 'leer', pp: 30 }];
    b.enemyTeam[0]!.moves = [{ id: 'leer', pp: 30 }];
    me.hp = 1;
    b.enemyTeam[0]!.hp = 1;
    me.friendship = 200;
    const run = takeTurn(content, fin, { kind: 'move', index: 0 }).run;
    expect(flagOf(run, 'tc-last-exchange')).toBe(1);
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.some((x) => !x.used && x.eventId === 'gn-16-last')).toBe(true);
    expect(scene(run, 'gn-16-last').labels).toEqual(['Now!', 'Wait for it.', 'You choose.']);
    const last = choose(run, 'gn-16-last', 'You choose.').run;
    expect(last.battle!.storyEffects).toContain(`kind:${last.party[last.battle!.activeIndex]!.uid}`);
    const foe = last.battle!.enemyTeam[0]!;
    expect(foe.hp * 4).toBeLessThan(maxHp(content, foe));
  });

  it('out in an early round: the team comes back, prizes kept, no second try this run; a lost final can be tried again next region', () => {
    const out = lose(choose(signed('t16-out'), 'gn-16-r1', 'Step into the ring.').run);
    expect(out.party).toHaveLength(3);
    expect(flagOf(out, 'tournament-out')).toBe(1);
    const lost = lose(choose(toFinal('t16-lost'), 'gn-16-final', 'Step into the ring.').run);
    expect(flagOf(lost, 'tournament-lost')).toBe(1);
    expect(flagOf(lost, 'tournament-out')).toBe(0);
    expect(prize(lost, 'black-belt')).toBe(true);
    expect(content.events.get('gn-16-door')!.requires).toContainEqual(expect.objectContaining({ kind: 'gn', test: 'notThisRegion', key: 'tournament-at' }));
  });

  it('the rival comes back in a home-made belt; with the prize shared, it has two names on it', () => {
    expect(RIVAL_RETURN_EVENT).toBe('gn-16-rival-return');
    const run = gnRun('t16-rival');
    setFlag(run, 'tournament-shared');
    open(run, RIVAL_RETURN_EVENT);
    const bow = choose(run, RIVAL_RETURN_EVENT, 'Bow back.');
    expect([bow.text, ...bow.changes].join(' ')).toMatch(/two names/);
    expect(content.events.get('cs-kanto-saffron-t1')!.disabled).toBe(true);
  });
});
