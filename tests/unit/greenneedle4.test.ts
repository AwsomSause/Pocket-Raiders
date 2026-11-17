// Greenneedle part 4 (doc GREENNEEDLE_REWORKED_PLACED_4.md): gn.16 The Fighting Tournament.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { shopBadgesNeeded, shopStock, takeTurn } from '../../src/core/run';
import { conditionMet } from '../../src/core/events';
import { FOE_WAITS } from '../../src/core/greenneedle';
import { SAFARI_ID, type SafariState } from '../../src/core/greenneedle/safari';
import { gameModule } from '../../src/core/minigame/games';
import { beginMinigame, minigameAct } from '../../src/core/minigame/flow';
import { hashSeed, Rng } from '../../src/core/rng';
import { PIT_PULL, PROFESSOR_BALL, SLUDGE_OFF, SLUDGE_TURNS, factoryTurnEnd, factoryWildWeight, pitsFreed, pitsStart } from '../../src/core/greenneedle/factory';
import { RIVAL_RETURN_EVENT } from '../../src/core/expansion/canonSaffron';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';
import { step } from './autoplay';

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

describe('gn.17 The Polluted Factory', () => {
  /** A run at the factory gate, signed in, with a Steel-type along to seal the Muk's pipe. */
  const inside = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    run.party.push(createPokemon(content, 'magnemite', run.party[0]!.level, 'p-steel'));
    setup(run);
    open(run, 'gn-17-door');
    return choose(run, 'gn-17-door', 'Sign.').run;
  };
  /** Through the pipes, the line and the pits, to the Muk in the wall. */
  const toMuk = (seed: string, setup?: (run: RunState) => void): RunState => {
    let run = win(choose(win(choose(inside(seed, setup), 'gn-17-pipes', 'Go through.').run), 'gn-17-pipes-2', 'Keep going.').run);
    run = choose(run, 'gn-17-line', 'Walk past him.').run;
    run = choose(run, 'gn-17-desk', 'Take the research.').run;
    return win(choose(run, 'gn-17-pits', 'Fight the Grimer; leave the pits.').run);
  };
  const toControl = (seed: string, setup?: (run: RunState) => void, muk = 'Seal the pipe for it (a Steel-, Fire- or Rock-type).'): RunState => choose(toMuk(seed, setup), 'gn-17-muk', muk).run;
  const closeValves = (run: RunState): RunState => {
    let r = choose(run, 'gn-17-control', 'Close the valves.').run;
    r = choose(r, 'gn-17-valve1', 'The valve marked COOLANT.').run;
    r = choose(r, 'gn-17-valve2', 'The valve marked WATER.').run;
    return choose(r, 'gn-17-valve3', 'The valve marked STEAM.').run;
  };

  it('a door on step 8 (window 6 to 11), optional; must-see instead when the stamped float came from the Kaiju', () => {
    expect(content.coPlacement!.get('gn-17-door')).toMatchObject({ home: 8, window: [6, 11], sits: 'optional', attaches: 'instead' });
    expect(content.coPlacement!.get('gn-17-float')).toMatchObject({ home: 8, window: [6, 11], sits: 'must-see' });
    expect(content.events.get('gn-17-float')!.requires).toContainEqual(expect.objectContaining({ key: 'kaiju-stamp', atLeast: 1 }));
    expect(content.events.get('gn-17-door')!.requires).toContainEqual(expect.objectContaining({ key: 'kaiju-stamp', atMost: 0 }));
    expect(content.events.get('cs-kanto-fuchsia-factory')!.canon).toBe('cs.kanto.fuchsia.factory');
    expect(content.events.get('cs-kanto-fuchsia-factory-n1')?.disabled ?? true).toBe(true);
  });

  it('the gate: Sign., Read it first. (page four is a File) or Climb the fence.; the float opens it with the valve order', () => {
    const run = gnRun('t17-gate');
    open(run, 'gn-17-door');
    expect(scene(run, 'gn-17-door').labels).toEqual(['Sign.', 'Read it first.', 'Climb the fence.']);
    const read = choose(run, 'gn-17-door', 'Read it first.');
    expect(flagOf(read.run, 'factory-file')).toBe(1);
    expect(read.run.party.every((m) => m.gn?.includes('factory-in'))).toBe(true);
    const f = gnRun('t17-float');
    setFlag(f, 'kaiju-stamp');
    open(f, 'gn-17-float');
    expect(scene(f, 'gn-17-float').intro).toMatch(/That's one of ours/);
    const opened = choose(f, 'gn-17-float', 'Go in.');
    expect(flagOf(opened.run, 'factory-valve-order')).toBe(1);
  });

  it('the pipes: Sludge on the field (Poison +10%), and a pipe may burst after the first turn; Poison- and Steel-types are immune', () => {
    const b = choose(inside('t17-pipes'), 'gn-17-pipes', 'Go through.').run.battle!;
    expect(b.eventRule).toMatchObject({ gn: 'pipes', typeBoost: { type: 'poison', pct: 10 } });
    const burst = (species: string): number => {
      let n = 0;
      for (let i = 0; i < 60; i++) {
        const mon = createPokemon(content, species, 20, `pipe-${i}`);
        const battle = structuredClone(b);
        battle.turn = 2;
        factoryTurnEnd(content, battle, mon, []);
        if (mon.status?.id === 'psn') n++;
      }
      return n;
    };
    expect(burst('rattata')).toBeGreaterThan(5);
    expect(burst('rattata')).toBeLessThan(30);
    expect(burst('grimer')).toBe(0);
    expect(burst('magnemite')).toBe(0);
  });

  it('the pits: the pulling happens in the Grimer fight: each Pokémon that pulls gives up its move, six at most; the Trubbish Nobody Wanted will not leave until all six are out', () => {
    const atPits = (seed: string, setup?: (run: RunState) => void): RunState => {
      let run = win(choose(win(choose(inside(seed, setup), 'gn-17-pipes', 'Go through.').run), 'gn-17-pipes-2', 'Keep going.').run);
      return choose(choose(run, 'gn-17-line', 'Walk past him.').run, 'gn-17-desk', 'Leave it.').run;
    };
    const sturdy = (run: RunState): RunState => {
      for (const foe of run.battle!.enemyTeam) { foe.moves = [{ id: 'splash', pp: 40 }]; }
      return run;
    };
    const run = atPits('t17-pits');
    expect(scene(run, 'gn-17-pits').labels).toEqual(['Pull them all out.', 'Pull out three, then fight.', 'Fight the Grimer; leave the pits.']);
    expect(scene(run, 'gn-17-pits').intro).toMatch(/with the Grimer horde still attacking/);
    // All six: six pulls are queued, and each costs one of your Pokémon its move while the Grimer go on attacking.
    let all = sturdy(choose(structuredClone(run), 'gn-17-pits', 'Pull them all out.').run);
    expect(all.battle!.eventRule).toMatchObject({ gn: 'pits' });
    expect(all.battle!.storyEffects.filter((t) => t === PIT_PULL)).toHaveLength(6);
    expect(flagOf(all, 'factory-freed')).toBe(0);
    const foeHp = all.battle!.enemyTeam.map((m) => m.hp);
    const active = all.battle!.doubles ? all.battle!.doubles.player.spots?.length ?? 2 : 1;
    const turn = step(content, all);
    all = turn.run;
    const pulled = 6 - all.battle!.storyEffects.filter((t) => t === PIT_PULL).length;
    expect(pulled).toBeGreaterThanOrEqual(1);
    expect(pulled).toBeLessThanOrEqual(Math.max(1, active, 3));
    expect(flagOf(all, 'factory-freed')).toBe(pulled);
    // A Pokémon that pulled did not attack: on the first turn everyone out was pulling, so no Grimer lost HP.
    expect(all.battle!.enemyTeam.map((m) => m.hp)).toEqual(foeHp);
    for (let i = 0; i < 12 && all.phase === 'battle' && all.battle!.storyEffects.includes(PIT_PULL); i++) all = step(content, sturdy(all)).run;
    expect(flagOf(all, 'factory-freed')).toBe(6);
    // Three: one turn's worth, never more.
    let three = sturdy(choose(structuredClone(run), 'gn-17-pits', 'Pull out three, then fight.').run);
    expect(three.battle!.storyEffects.filter((t) => t === PIT_PULL)).toHaveLength(3);
    for (let i = 0; i < 8 && three.phase === 'battle' && three.battle!.storyEffects.includes(PIT_PULL); i++) three = step(content, sturdy(three)).run;
    expect(flagOf(three, 'factory-freed')).toBe(3);
    expect(flagOf(win(three), 'factory-freed')).toBe(3);
    // None: an ordinary horde fight.
    const none = choose(structuredClone(run), 'gn-17-pits', 'Fight the Grimer; leave the pits.').run;
    expect(none.battle!.storyEffects).not.toContain(PIT_PULL);
    expect(flagOf(win(none), 'factory-freed')).toBe(0);
    // The Trubbish Nobody Wanted: it is already in the pit; all six or nothing.
    const kept = atPits('t17-pits-trub', (r) => setFlag(r, 'trubbish-kept'));
    expect(scene(kept, 'gn-17-pits').intro).toMatch(/every one's out/);
    expect(scene(kept, 'gn-17-pits').labels).toEqual(['Pull them out.']);
    expect(choose(kept, 'gn-17-pits', 'Pull them out.').run.battle!.storyEffects.filter((t) => t === PIT_PULL)).toHaveLength(6);
  });
  it('the pit count: pulls made so far, on top of those already out, never more than six', () => {
    const b = { storyEffects: [] as string[] } as unknown as RunState['battle'] & object;
    expect(pitsFreed(b)).toBeUndefined();
    pitsStart(b, 6, 4);
    expect(b.storyEffects.filter((t) => t === PIT_PULL)).toHaveLength(2);
    expect(pitsFreed(b)).toBe(4);
    b.storyEffects.splice(b.storyEffects.indexOf(PIT_PULL), 1);
    expect(pitsFreed(b)).toBe(5);
    const full = { storyEffects: [] as string[] } as unknown as RunState['battle'] & object;
    pitsStart(full, 3, 6);
    expect(full.storyEffects).not.toContain(PIT_PULL);
    expect(pitsFreed(full)).toBe(6);
  });

  it('the Muk in the wall: sealing it needs a Steel-, Fire- or Rock-type; it follows', () => {
    const run = toMuk('t17-muk');
    expect(scene(run, 'gn-17-muk').labels).toEqual(['Seal the pipe for it (a Steel-, Fire- or Rock-type).', 'Feed it.', 'Leave it.']);
    const sealed = choose(run, 'gn-17-muk', 'Seal the pipe for it (a Steel-, Fire- or Rock-type).');
    expect(sealed.text).toMatch(/never been thanked/);
    expect(flagOf(sealed.run, 'factory-muk-helped')).toBe(1);
    expect(content.events.get('gn-17-muk')!.choices[0]!.requires).toContainEqual(expect.objectContaining({ kind: 'partyTypes', types: ['steel', 'fire', 'rock'] }));
    // Feeding it helps it too: it plugs the leak with a piece of itself, and follows.
    const fed = choose(run, 'gn-17-muk', 'Feed it.');
    expect(fed.text).toMatch(/never been thanked/);
    expect(flagOf(fed.run, 'factory-muk-helped')).toBe(1);
    expect(flagOf(choose(run, 'gn-17-muk', 'Leave it.').run, 'factory-muk-helped')).toBe(0);
  });

  it('the valves: the labels are wrong, the stains are right; closed, the raid opens without Toxic Spikes; a wrong one opens them all again', () => {
    const control = toControl('t17-valves');
    const closed = closeValves(control);
    expect(flagOf(closed, 'factory-valves')).toBe(3);
    expect(scene(closed, 'gn-17-control').labels).not.toContain('Close the valves.');
    const raid = choose(choose(closed, 'gn-17-control', 'Go down to the furnace.').run, 'gn-17-raid1', 'Fight.').run;
    expect(raid.battle!.sideEffects.player.toxicSpikes ?? 0).toBe(0);
    const wrong = choose(choose(control, 'gn-17-control', 'Close the valves.').run, 'gn-17-valve1', 'The valve marked STEAM.').run;
    expect(flagOf(wrong, 'factory-valves')).toBe(0);
    const spiked = choose(choose(wrong, 'gn-17-control', 'Go down to the furnace.').run, 'gn-17-raid1', 'Fight.').run;
    expect(spiked.battle!.sideEffects.player.toxicSpikes).toBe(1);
  });

  it('the line stop is behind glass and cannot be undone; on water routes for the rest of the region Poison is rarer, Water more common', () => {
    let run = choose(toControl('t17-lever'), 'gn-17-control', 'Look through the glass.').run;
    expect(scene(run, 'gn-17-glass').intro).toMatch(/Ground and Fire/);
    run = choose(choose(run, 'gn-17-glass', 'Break the glass.').run, 'gn-17-lever', 'Pull it.').run;
    expect(flagOf(run, 'factory-shutdown')).toBe(run.regionIndex + 1);
    expect(factoryWildWeight(content, run, ['water', 'normal'], 'grimer')).toBe(0.5);
    expect(factoryWildWeight(content, run, ['water', 'normal'], 'psyduck')).toBe(1.5);
    expect(factoryWildWeight(content, run, ['rock', 'ground'], 'grimer')).toBe(1);
    expect(scene(choose(run, 'gn-17-control', 'Look through the glass.').run, 'gn-17-glass').labels).toEqual(['Step back.']);
  });

  it('the raid: uncatchable; Molten Sludge for six turns less one per Pokémon freed; spread moves split it (three at most); the Muk takes one phase\'s first attack', () => {
    let run = closeValves(toControl('t17-raid', (r) => setFlag(r, 'factory-freed', 2)));
    run = choose(run, 'gn-17-control', 'Go down to the furnace.').run;
    expect(scene(run, 'gn-17-raid1').labels).toEqual(['Fight.', 'Send the Muk in front.']);
    const fight = choose(run, 'gn-17-raid1', 'Send the Muk in front.').run;
    const b = fight.battle!;
    expect(b.enemyTeam[0]!.speciesId).toBe('muk-delta-fire');
    expect(b.eventRule).toMatchObject({ gn: 'sludge', noCatch: true });
    expect(b.storyEffects).toContain(`${SLUDGE_TURNS}4`);
    expect(b.storyEffects.some((x) => x.startsWith(FOE_WAITS))).toBe(true);
    expect(b.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(['earth-power', 'flamethrower', 'gunk-shot', 'sludge-wave']);
    // Spread moves split it.
    const split = structuredClone(b);
    for (let i = 0; i < 5; i++) factoryTurnEnd(content, split, fight.party[0], [{ type: 'move', side: 'player', moveId: 'sludge-wave' } as never]);
    expect(split.enemyTeam.map((m) => m.speciesId)).toEqual(['muk-delta-fire', 'grimer', 'grimer', 'grimer']);
    // The Molten Sludge: 1/16 a turn, never a knockout; gone after its turns.
    const mon = createPokemon(content, 'rattata', 20, 'scald');
    const hot = structuredClone(b);
    hot.turn = 5;
    factoryTurnEnd(content, hot, mon, []);
    expect(mon.hp).toBe(maxHp(content, mon) - Math.floor(maxHp(content, mon) / 16));
    mon.hp = 1;
    factoryTurnEnd(content, hot, mon, []);
    expect(mon.hp).toBe(1);
    const cool = createPokemon(content, 'rattata', 20, 'scald-2');
    hot.turn = 6;
    factoryTurnEnd(content, hot, cool, []);
    expect(cool.hp).toBe(maxHp(content, cool));
    expect(scene(win(fight), 'gn-17-raid2').labels).toEqual(['Fight.']);
  });

  it('the furnace: Water moves steam and clear the sludge; non-Fire Pokémon may catch a burn; Fire-types never do', () => {
    const run = win(choose(choose(closeValves(toControl('t17-furnace')), 'gn-17-control', 'Go down to the furnace.').run, 'gn-17-raid1', 'Fight.').run);
    const b = choose(run, 'gn-17-raid2', 'Fight.').run.battle!;
    expect(b.eventRule).toMatchObject({ gn: 'furnace' });
    const steam = structuredClone(b);
    factoryTurnEnd(content, steam, createPokemon(content, 'squirtle', 20, 'steam'), [{ type: 'move', side: 'player', moveId: 'water-gun' } as never]);
    expect(steam.storyEffects).toContain(SLUDGE_OFF);
    const burns = (species: string): number => {
      let n = 0;
      for (let t = 2; t < 40; t++) {
        const mon = createPokemon(content, species, 20, `burn-${species}`);
        const battle = structuredClone(b);
        battle.turn = t;
        battle.storyEffects.push(SLUDGE_OFF);
        factoryTurnEnd(content, battle, mon, []);
        if (mon.status?.id === 'brn') n++;
      }
      return n;
    };
    expect(burns('rattata')).toBeGreaterThan(2);
    expect(burns('charmander')).toBe(0);
  });

  it('the core: Finish it., Stop attacking. or Let the Muk go to it.; Black Sludge and a pick; the Muk joins with Stopgap', () => {
    const run = win(choose(win(choose(choose(closeValves(toControl('t17-core')), 'gn-17-control', 'Go down to the furnace.').run, 'gn-17-raid1', 'Fight.').run), 'gn-17-raid2', 'Fight.').run);
    expect(scene(run, 'gn-17-core').labels).toEqual(['Finish it.', 'Stop attacking.', 'Let the Muk go to it.']);
    const core = choose(run, 'gn-17-core', 'Finish it.').run.battle!;
    expect(core.enemyTeam[0]!.hp * 3).toBeLessThanOrEqual(maxHp(content, core.enemyTeam[0]!));
    expect(core.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(['ember', 'mud-slap', 'acid']);
    const spared = choose(run, 'gn-17-core', 'Stop attacking.').run;
    expect(flagOf(spared, 'kanto-factory-cleared')).toBe(1);
    expect(spared.inventory['black-sludge'] ?? spared.party.some((m) => m.held?.['black-sludge'])).toBeTruthy();
    expect(scene(spared, 'gn-17-pick').labels).toEqual(['Alolan Grimer', 'Delta Grimer', 'Trubbish', 'The Muk']);
    const calmed = choose(run, 'gn-17-core', 'Let the Muk go to it.').run;
    expect(flagOf(calmed, 'factory-magmuk-calmed')).toBe(1);
    expect(scene(calmed, 'gn-17-pick').labels).toEqual(['Alolan Grimer', 'Delta Grimer', 'Trubbish']);
    const picked = choose(spared, 'gn-17-pick', 'The Muk');
    const offered = picked.run.pending.find((p) => p.kind === 'caught' && p.mon.speciesId === 'muk');
    expect(offered && offered.kind === 'caught' ? offered.mon.fixedAbility : null).toBe('stopgap');
    expect(flagOf(picked.run, 'kanto-factory-pick')).toBe(4);
    expect(scene(picked.run, 'gn-17-research').labels).toEqual(['Sell it.', 'Hand it to a professor.']);
  });

  it('a lost raid locks the factory down: Pokémon caught inside are lost, the team you came in with is safe', () => {
    let run = choose(choose(toControl('t17-lost'), 'gn-17-control', 'Go down to the furnace.').run, 'gn-17-raid1', 'Fight.').run;
    const cameIn = run.party.filter((m) => m.gn?.includes('factory-in')).map((m) => m.uid);
    run.party.push(createPokemon(content, 'grimer', 10, 'caught-inside'));
    run = lose(run);
    expect(run.party.some((m) => m.uid === 'caught-inside')).toBe(false);
    expect(run.party.map((m) => m.uid)).toEqual(cameIn);
    expect(cameIn).toEqual(['p1', 'p-steel']);
    expect(run.party.every((m) => !m.gn?.includes('factory-in'))).toBe(true);
    expect(flagOf(run, 'factory-lost')).toBe(1);
  });

  it('Stopgap: once per battle, a move\'s extra effect on an ally lands on it instead', () => {
    const run = choose(inside('t17-gap'), 'gn-17-pipes', 'Go through.').run;
    const muk = createPokemon(content, 'muk', 30, 'gap-muk');
    muk.fixedAbility = 'stopgap';
    run.party.push(muk);
    const lead = run.party[run.battle!.activeIndex]!;
    lead.hp = maxHp(content, lead);
    const foe = run.battle!.enemyTeam[0]!;
    foe.moves = [{ id: 'nuzzle', pp: 20 }];
    run.party[run.battle!.activeIndex]!.moves = [{ id: 'growl', pp: 40 }];
    const after = takeTurn(content, run, { kind: 'move', index: 0 });
    const me = after.run.party.find((m) => m.uid === lead.uid)!;
    expect(me.status).toBeFalsy();
    expect(after.run.party.find((m) => m.uid === 'gap-muk')!.status?.id).toBe('par');
    expect(after.run.battle?.storyEffects ?? []).toContain('stopgap:gap-muk');
  });
});

describe('gn.17 consequences (the research, the Kaiju, the Kanto door)', () => {
  it('research handed to a professor: the special Ball is on sale for the rest of the run, whatever the badges', () => {
    const run = gnRun('gnfix17-ball');
    const entry = content.shop.find((e) => e.item === PROFESSOR_BALL)!;
    expect(entry.minBadges).toBeGreaterThan(run.badges.length);
    expect(shopBadgesNeeded(content, run, entry)).toBe(entry.minBadges);
    expect(shopStock(content, run).some((e) => e.item === PROFESSOR_BALL && run.badges.length >= shopBadgesNeeded(content, run, e))).toBe(false);
    open(run, 'gn-17-research');
    const given = choose(run, 'gn-17-research', 'Hand it to a professor.').run;
    expect(given.inventory[PROFESSOR_BALL]).toBe((run.inventory[PROFESSOR_BALL] ?? 0) + 1);
    expect(shopBadgesNeeded(content, given, entry)).toBe(0);
    // Other Balls keep their badge gate.
    const other = content.shop.find((e) => e.item === 'beast-ball')!;
    expect(shopBadgesNeeded(content, given, other)).toBe(other.minBadges);
  });
  it('research sold: in a later region the buyer has built another factory, and its water routes turn the other way', () => {
    let run = gnRun('gnfix17-sold');
    run.regionIndex = 0;
    open(run, 'gn-17-research');
    run = choose(run, 'gn-17-research', 'Sell it.').run;
    expect(flagOf(run, 'factory-research-sold')).toBe(1);
    const second = content.events.get('gn-17-second')!;
    const holds = (r: RunState) => second.requires.every((c) => conditionMet(content, r, c));
    expect(holds(run)).toBe(false);
    run.regionIndex = 1;
    expect(holds(run)).toBe(true);
    open(run, 'gn-17-second');
    expect(scene(run, 'gn-17-second').intro).toMatch(/the same stamp: a ball inside a cog/);
    run = choose(run, 'gn-17-second', 'Look at the water.').run;
    expect(holds(run)).toBe(false);
    expect(factoryWildWeight(content, run, ['water'], 'grimer')).toBe(1.5);
    expect(factoryWildWeight(content, run, ['water'], 'magikarp')).toBe(0.5);
    expect(factoryWildWeight(content, run, ['grass'], 'grimer')).toBe(1);
    run.regionIndex = 2;
    expect(factoryWildWeight(content, run, ['water'], 'grimer')).toBe(1);
    // Never sold: it never shows.
    const clean = gnRun('gnfix17-clean');
    clean.regionIndex = 1;
    expect(second.requires.every((c) => conditionMet(content, clean, c))).toBe(false);
  });
  it('left running: the Kaiju, if it was cut free, comes back on a later water stage', () => {
    const back = content.events.get('gn-17-kaiju-back')!;
    const run = gnRun('gnfix17-kaiju');
    const flags = back.requires.filter((c) => c.kind !== 'stageTypes' && c.kind !== 'gn');
    expect(flags.every((c) => conditionMet(content, run, c))).toBe(false);
    setFlag(run, 'factory-left-running');
    expect(flags.every((c) => conditionMet(content, run, c))).toBe(false);
    setFlag(run, 'kaiju-freed');
    expect(flags.every((c) => conditionMet(content, run, c))).toBe(true);
    expect(back.requires).toContainEqual({ kind: 'stageTypes', types: ['water'] });
    open(run, 'gn-17-kaiju-back');
    expect(scene(run, 'gn-17-kaiju-back').intro).toMatch(/It came back/);
    const fight = choose(structuredClone(run), 'gn-17-kaiju-back', 'Drive it away from the harbour.');
    expect(fight.battle).toBe(true);
    const left = choose(run, 'gn-17-kaiju-back', 'Leave the harbour to it.').run;
    expect(flagOf(left, 'factory-kaiju-back')).toBe(1);
    expect(flags.every((c) => conditionMet(content, left, c))).toBe(false);
  });
  it('in Kanto the canon door knows the float too', () => {
    const run = gnRun('gnfix17-kanto');
    open(run, 'cs-kanto-fuchsia-factory');
    expect(scene(run, 'cs-kanto-fuchsia-factory').labels).toEqual(['Sign.', 'Read it first.', 'Climb the fence.']);
    setFlag(run, 'kaiju-stamp');
    expect(scene(run, 'cs-kanto-fuchsia-factory').intro).toMatch(/That's ours\. That's one of ours/);
    expect(scene(run, 'cs-kanto-fuchsia-factory').labels).toEqual(['Go in.']);
    const inside = choose(run, 'cs-kanto-fuchsia-factory', 'Go in.').run;
    expect(flagOf(inside, 'factory-valve-order')).toBe(1);
    expect(flagOf(inside, 'factory-entered')).toBe(1);
  });
});

describe('gn.18 Safari Land', () => {
  const fresh = (): SafariState => gameModule(SAFARI_ID).start(content, { steps: 500, balls: 30 }, new Rng(hashSeed('t18-park')).state) as unknown as SafariState;
  const act = (s: SafariState, id: string): SafariState => {
    gameModule(SAFARI_ID).act(content, s as never, id);
    return s;
  };
  const cells = (s: SafariState) => gameModule(SAFARI_ID).view(content, s as never).cells;
  /** The gate paid, the park's stop on the node, and the visit started. */
  const visit = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    run.money = 2000;
    setup(run);
    open(run, 'gn-18-gate');
    const paid = choose(run, 'gn-18-gate', run.story.flags['ev:safari-fee-up'] ? 'Pay ₽800 and go in.' : 'Pay ₽500 and go in.').run;
    const here = paid.stage!.map.nodes.find((n) => n.id === paid.stage!.current)!;
    const stop = here.sides.find((x) => x.kind === 'minigame' && x.minigameId === SAFARI_ID)!;
    return beginMinigame(content, paid, stop.id, 0);
  };

  it('in the town (until towns exist step 12, window 10 to 15), once a region; the park never turns up as a random minigame stop', () => {
    expect(content.coPlacement!.get('gn-18-gate')).toMatchObject({ home: 12, window: [10, 15], sits: 'optional', attaches: 'town' });
    expect(content.events.get('gn-18-gate')!.requires).toContainEqual(expect.objectContaining({ kind: 'gn', test: 'notThisRegion', key: 'safari-at' }));
    expect(content.minigames.games.find((g) => g.id === SAFARI_ID)).toMatchObject({ eventOnly: true, attemptLimit: 1 });
    expect(content.events.get('cs-kanto-fuchsia-safari')!.canon).toBe('cs.kanto.fuchsia.safari');
  });

  it('₽500 to enter: 30 Safari Balls and 500 steps; after a loud visit it costs ₽800', () => {
    const run = visit('t18-gate');
    expect(run.money).toBe(1500);
    expect(run.phase).toBe('minigame');
    const s = run.minigame!.state as SafariState;
    expect([s.balls, s.steps, s.quiet]).toEqual([30, 500, 0]);
    expect(visit('t18-gate-b', (r) => setFlag(r, 'safari-fee-up')).money).toBe(1200);
    expect((visit('t18-alpha', (r) => setFlag(r, 'alpha-calmed')).minigame!.state as SafariState).quiet).toBe(3);
    // The flag the Alpha event actually sets (families/new-events write `calmed-alpha`).
    expect((visit('t18-alpha-b', (r) => setFlag(r, 'calmed-alpha')).minigame!.state as SafariState).quiet).toBe(3);
  });

  it('Quiet rises when you walk, wait and watch, and falls when you run or throw a rock; every chance is shown', () => {
    const s = fresh();
    act(s, 'wait');
    expect(s.quiet).toBe(1);
    s.mode = 'walk';
    s.mon = null;
    act(s, 'look');
    expect(s.quiet).toBe(2);
    s.mode = 'walk';
    s.mon = null;
    act(s, 'run');
    expect(s.quiet).toBe(1);
    expect(s.steps).toBe(500 - 3 - 5 - 5);
    // An encounter: Ball, bait, rock or leave, with the chances.
    s.mode = 'meet';
    s.mon = { species: 'tauros', catchP: 0.3, fleeP: 0.12, behaviour: 'grazing', noticed: true, star: false, hungry: null, fed: false, dragonair: false };
    expect(cells(s).map((c) => c.label)).toEqual(['Throw a Ball', 'Throw bait', 'Throw a rock', 'Leave']);
    expect(gameModule(SAFARI_ID).view(content, s as never).prompt).toMatch(/catch 30%, wanders off 12%/);
    // Bait: easier to catch, likelier to wander off (held at 0% here so the test sees it stay).
    s.mon.fleeP = -0.1;
    act(s, 'bait');
    expect(s.mon!.catchP).toBeCloseTo(0.45);
    expect(s.mon!.fleeP).toBeCloseTo(0);
    s.mon!.fleeP = 0.12;
    const q = s.quiet;
    act(s, 'rock');
    if (s.mon) expect(s.mon.catchP).toBeCloseTo(0.35);
    expect(s.quiet).toBe(Math.max(0, q - 1));
  });

  it('a Kangaskhan family crosses the plain once; nothing can be thrown at it; the warden buys a photo of the young one', () => {
    const s = fresh();
    act(s, 'camera');
    act(s, 'walk');
    if (s.mode === 'meet') act(s, 'leave');
    act(s, 'walk');
    expect(s.mode).toBe('family');
    expect(cells(s).find((c) => c.id === 'ball')).toMatchObject({ disabled: true, detail: "Not while the young one's out of the pouch" });
    act(s, 'photo');
    expect(s.photoBest).toBe(10);
    expect(s.photoMoney).toBe(800);
    act(s, 'leave');
    expect(s.familySeen).toBe(true);
  });

  it('two herds at the waterhole: wait three times and one backs down, which changes who lives there', () => {
    const s = fresh();
    act(s, 'next');
    expect(s.mode).toBe('herd');
    act(act(act(s, 'wait'), 'wait'), 'wait');
    expect(['rhyhorn', 'tauros']).toContain(s.herd);
    expect(s.mode).toBe('walk');
  });

  it('tracking to a nest (two forks): leaving the egg is Quiet +2; a wrong print loses the trail', () => {
    const s = fresh();
    s.area = 2;
    act(s, 'track');
    const right = s.track!.print;
    act(act(s, `print:${right}`), `print:${right}`);
    expect(s.mode).toBe('nest');
    const q = s.quiet;
    act(s, 'leaveNest');
    expect([s.quiet, s.nestLeft]).toEqual([q + 2, true]);
    const t = fresh();
    t.area = 3;
    act(t, 'track');
    act(t, `print:${(t.track!.print + 1) % 3}`);
    expect([t.mode, t.egg]).toEqual(['walk', null]);
  });

  it('feeding: the right food from its behaviour doubles the catch chance; at Quiet 8 it simply follows you', () => {
    const s = fresh();
    s.mode = 'meet';
    s.mon = { species: 'ponyta', catchP: 0.3, fleeP: 0, behaviour: 'grazing', noticed: true, star: false, hungry: 1, fed: false, dragonair: false };
    expect(gameModule(SAFARI_ID).view(content, s as never).prompt).toMatch(/looking up/);
    act(s, 'feed:fruit');
    expect(s.mon!.catchP).toBeCloseTo(0.6);
    s.quiet = 8;
    s.mon = { species: 'ponyta', catchP: 0.3, fleeP: 0, behaviour: 'grazing', noticed: true, star: false, hungry: 0, fed: false, dragonair: false };
    act(s, 'feed:roots');
    expect(s.caught).toEqual(['ponyta']);
  });

  it('at Quiet 8 or more, a Dragonair asleep on a rock in the Far Marsh, and only then', () => {
    const s = fresh();
    s.area = 3;
    s.migrationSeen = true;
    s.quiet = 9;
    for (let i = 0; i < 40 && s.mode !== 'meet'; i++) act(s, 'wait');
    expect(s.mon).toMatchObject({ species: 'dragonair', behaviour: 'sleeping', noticed: false });
    const low = fresh();
    low.area = 3;
    low.migrationSeen = true;
    low.quiet = 4;
    for (let i = 0; i < 40; i++) {
      act(low, 'wait');
      expect(low.mon?.species).not.toBe('dragonair');
      low.mode = 'walk';
      low.mon = null;
      low.quiet = 4;
    }
  });

  it('leaving: the catches join at A+0, the photos are paid, the warden judges the Quiet; in Kanto the Stampede and the Gold Teeth are inside', () => {
    let run = visit('t18-end');
    const s = run.minigame!.state as SafariState;
    s.caught = ['tauros', 'dratini'];
    s.photoMoney = 400;
    s.quiet = 9;
    const money = run.money;
    run = minigameAct(content, run, 'exit');
    expect(run.minigame!.outcome!.lines.join(' ')).toMatch(/barely here/);
    expect(run.money).toBe(money + 400);
    expect(run.pending.filter((p) => p.kind === 'caught').map((p) => (p.kind === 'caught' ? p.mon.speciesId : ''))).toEqual(['tauros', 'dratini']);
    expect(flagOf(run, 'safari-free')).toBe(run.regionIndex + 1);
    expect(flagOf(run, 'safari-quiet')).toBe(9);
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    if (run.regionOrder[run.regionIndex] === 'kanto') expect(here.sides.some((x) => x.eventId === 'cs-kanto-fuchsia-tauros')).toBe(true);
    const loud = visit('t18-loud');
    (loud.minigame!.state as SafariState).quiet = 2;
    const after = minigameAct(content, loud, 'exit');
    expect(after.minigame!.outcome!.lines.join(' ')).toMatch(/upset for a week/);
    expect(flagOf(after, 'safari-fee-up')).toBe(1);
  });

  it('every action costs steps, so a visit always ends', () => {
    const s = fresh();
    const r = new Rng(hashSeed('t18-random'));
    for (let i = 0; i < 2000 && !s.done; i++) {
      const open = cells(s).filter((c) => !c.disabled && c.id !== 'far' && c.id !== 'exit');
      act(s, r.pick(open).id);
    }
    expect(s.done).toBe(true);
    expect(s.steps).toBe(0);
  });
});
