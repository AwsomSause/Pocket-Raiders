// Greenneedle gn.21 to gn.30 against the docs (GREENNEEDLE_REWORKED_PLACED_5.md and _6.md): the differences the audit found, fixed.
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseEvent, conditionMet, eventView } from '../../src/core/events';
import { takeTurn } from '../../src/core/run';
import { gathering, reunionArrive, truceMeets } from '../../src/core/greenneedle/reunion';
import { bondNewest, islanderTint, oldEggMove, pinkFade, pinkShade, pinkTint, PINK_MARKS, raiseMarked, truceAnswers, truceCover, truceHurt } from '../../src/core/greenneedle/part3';
import { POKEMON_MOMENTS } from '../../src/core/moments/pokemonMoments';
import placement from '../../src/data/catalogOverhaul/placement/greenneedle.json';
import { gnTokens } from '../../src/core/greenneedle';
import { targetKind } from '../../src/core/battle/doubles';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const next = (run: RunState): string => openSide(run)!.eventId;
const withTeam = (seed: string, extra: string[] = ['snorlax']): RunState => {
  const run = gnRun(seed);
  for (const [i, sp] of extra.entries()) run.party.push(createPokemon(content, sp, run.party[0]!.level + 5, `p-${i}`));
  return run;
};
const everyone = (run: RunState): PokemonInstance[] => [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))];
const ids = (run: RunState): string[] => {
  reunionArrive(content, run);
  return gathering(run)!.att.map((a) => a.id);
};
const lineOf = (run: RunState, id: string): string => gathering(run)!.att.find((a) => a.id === id)!.line;

describe("gn.21 The Pokémon That Wouldn't Evolve", () => {
  it('Final Reunion: Linus comes after every ending but the one where it left him', () => {
    for (const end of [1, 2, 3, 4]) {
      const run = gnRun(`fx21-linus-${end}`);
      setFlag(run, 'wontevolve-done');
      setFlag(run, 'wontevolve-end', end);
      if (end === 2) setFlag(run, 'wontevolve-stayed');
      expect(ids(run)).toContain('linus');
      // Only when it stayed with him is there "a Pokémon beside him"; otherwise he has the stone on its string.
      expect(lineOf(run, 'linus')).toMatch(end === 2 ? /a Pokémon beside him/ : /on a string round his neck/);
    }
    const gone = gnRun('fx21-linus-5');
    setFlag(gone, 'wontevolve-done');
    setFlag(gone, 'wontevolve-end', 5);
    setFlag(gone, 'wontevolve-linus-gone');
    expect(ids(gone)).not.toContain('linus');
    // Never met: nobody to come.
    expect(ids(gnRun('fx21-linus-none'))).not.toContain('linus');
  });

  it('"Who was the other one?" remembers that it stayed with its trainer', () => {
    const run = withTeam('fx21-stayed', ['snorlax', 'pichu']);
    setFlag(run, 'cast-wontevolve:pikachu');
    for (const k of ['wontevolve-1', 'wontevolve-2']) setFlag(run, k);
    setFlag(run, 'wontevolve-side', 3);
    setFlag(run, 'wontevolve-at', run.regionIndex + 1);
    open(run, 'gn-21-stone');
    const out = choose(run, 'gn-21-stone', 'Linus. Who was the other one?').run;
    expect(flagOf(out, 'wontevolve-end')).toBe(2);
    expect(flagOf(out, 'wontevolve-stayed')).toBe(1);
  });

  const challenge = (seed: string): RunState => {
    const run = withTeam(seed);
    open(run, 'gn-21-road');
    const defended = choose(run, 'gn-21-road', "It doesn't want to. Leave it be.").run;
    return choose(defended, 'gn-21-challenge', 'Accept.').run;
  };

  it('beat 1 is scripted: "It loses. Narrowly." Your Pokémon holds on at 1 HP through every hit', () => {
    let run = challenge('fx21-duel1');
    expect(run.battle!.eventRule?.holdOn).toBe('you');
    // However hard it hits, your Pokémon is never knocked out.
    for (let i = 0; i < 6 && run.phase === 'battle'; i++) {
      run = structuredClone(run);
      const mine = run.party[run.battle!.activeIndex]!;
      mine.hp = 1;
      for (const foe of run.battle!.enemyTeam) foe.hp = maxHp(content, foe);
      for (const m of mine.moves) m.pp = 5;
      run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
      if (run.phase === 'battle') expect(run.party[run.battle!.activeIndex]!.hp).toBeGreaterThanOrEqual(1);
    }
    expect(run.phase).toBe('battle');
    // It ends with a win, and yours below a third.
    const done = win(run);
    expect(next(done)).toBe('gn-21-bow');
    // The one that fought (the strongest, wherever it stands in the party) is the one left below a third.
    expect(done.party.filter((m) => m.hp <= Math.floor(maxHp(content, m) * 0.3))).toHaveLength(1);
  });

  it('beat 2 is scripted: "it wins, narrowly". It holds on at 1 HP through every hit', () => {
    const start = withTeam('fx21-duel2');
    setFlag(start, 'cast-wontevolve:pikachu');
    setFlag(start, 'wontevolve-1');
    setFlag(start, 'wontevolve-at', start.regionIndex + 1);
    open(start, 'gn-21-back');
    let run = choose(choose(start, 'gn-21-back', 'Show me again, on me.').run, 'gn-21-again', 'Go.').run;
    expect(run.battle!.eventRule?.holdOn).toBe('foe');
    run = structuredClone(run);
    for (const foe of run.battle!.enemyTeam) foe.hp = 1;
    for (const mon of run.party) if (mon.hp > 0) mon.hp = maxHp(content, mon);
    run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    expect(run.phase).toBe('battle');
    expect(run.battle!.enemyTeam[0]!.hp).toBe(1);
    expect(next(lose(run))).toBe('gn-21-again-won');
  });

  it('the picture shows the rolled Pokémon once it is cast (nothing before)', () => {
    const run = withTeam('fx21-art');
    const side = open(run, 'gn-21-road');
    expect(content.events.get('gn-21-road')!.scene.pokemon).toBe('@wontevolve');
    expect(eventView(content, run, side).event.scene.pokemon).toBeUndefined();
    setFlag(run, 'cast-wontevolve:torchic');
    expect(eventView(content, run, side).event.scene.pokemon).toBe('torchic');
  });
});

describe('gn.22 The Lonely Cubone', () => {
  const guest = (seed: string): RunState => {
    const run = withTeam(seed);
    run.party.push({ ...createPokemon(content, 'cubone', run.party[0]!.level, 'p-cub'), gn: ['cubone-guest'] });
    setFlag(run, 'cubone-trusted');
    return run;
  };

  it('wave 3: the Cubone is still on the field as a second fighter, two of yours against the large Mandibuzz', () => {
    const run = guest('fx22-wave3');
    open(run, 'gn-22-wave3');
    const fight = choose(run, 'gn-22-wave3', 'Let it.').run;
    expect(fight.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['mandibuzz']);
    expect(fight.battle!.doubles).toBeTruthy();
    expect(fight.party[fight.battle!.activeIndex]!.speciesId).toBe('cubone');
    expect(fight.battle!.doubles!.player.index).toBeGreaterThanOrEqual(0);
    expect(fight.battle!.doubles!.enemy.index).toBe(-1);
    // The fight plays through: a turn, then the win opens the grave.
    const turn = takeTurn(content, structuredClone(fight), { kind: 'move', index: 0 }).run;
    expect(['battle', 'map', 'reward']).toContain(turn.phase);
    expect(next(win(fight))).toBe('gn-22-grave');
  });

  it('with nobody else able to fight, wave 3 is the Cubone alone (no crash)', () => {
    const run = gnRun('fx22-alone');
    run.party = [{ ...createPokemon(content, 'cubone', run.party[0]!.level, 'p-cub'), gn: ['cubone-guest'] }];
    open(run, 'gn-22-wave3');
    expect(choose(run, 'gn-22-wave3', 'Let it.').run.battle!.doubles).toBeFalsy();
  });

  it('the Field of Stones: the ghosts never attack', () => {
    const run = guest('fx22-ghost');
    open(run, 'gn-22-stones');
    let fight = choose(run, 'gn-22-stones', 'Walk among them.').run;
    expect(fight.battle!.eventRule?.foeStands).toBe(99);
    for (let i = 0; i < 5; i++) {
      fight = structuredClone(fight);
      for (const foe of fight.battle!.enemyTeam) foe.hp = maxHp(content, foe);
      const before = fight.party.map((m) => m.hp);
      const turn = takeTurn(content, fight, { kind: 'move', index: 0 });
      fight = turn.run;
      if (fight.phase !== 'battle') break;
      expect(fight.party.map((m) => m.hp)).toEqual(before);
      expect(fight.battle!.turn).toBeGreaterThan(i);
    }
  });

  it('walking away is remembered as walking past; the Dog-at-the-Station drawing reads the flag that event sets', () => {
    const run = withTeam('fx22-walk');
    open(run, 'gn-22-door');
    expect(flagOf(choose(run, 'gn-22-door', 'Walk away.').run, 'kind-walked-past')).toBe(1);
    const sat = guest('fx22-dog');
    expect(scene(sat, 'gn-22-hollow').intro).not.toMatch(/second small figure/);
    setFlag(sat, 'dog-station-sat');
    expect(scene(sat, 'gn-22-hollow').intro).toMatch(/second small figure, sitting/);
    // gn.new.02 really sets it.
    expect(JSON.stringify(content.events.get('gn-new-02-platform')!.choices[0])).toContain('dog-station-sat');
  });

  it('the Pokémon Tower ghost sees this Cubone', () => {
    const run = guest('fx22-tower');
    const room = content.events.get('cs-kanto-lavender-tower-f6')!;
    expect(scene(run, room.id).intro).not.toMatch(/doesn't need to be asked/);
    run.party.find((m) => m.speciesId === 'cubone')!.gn = ['cubone-friend'];
    expect(scene(run, room.id).intro).toMatch(/doesn't need to be asked/);
  });
});

describe('gn.23 The Magikarp That Could', () => {
  it('it is four levels higher at each appearance, and joins at the level it has reached', () => {
    let run = withTeam('fx23-level');
    open(run, 'gn-23-a1');
    run = choose(run, 'gn-23-a1', 'Go on! You can do it!').run;
    const first = flagOf(run, 'karp-level');
    expect(first).toBeGreaterThanOrEqual(1);
    for (const n of [2, 3, 4, 5]) {
      open(run, `gn-23-a${n}`);
      run = choose(run, `gn-23-a${n}`, n % 2 ? 'Walk on.' : 'Go on! You can do it!').run;
      expect(flagOf(run, 'karp-level')).toBe(first + 4 * (n - 1));
    }
    setFlag(run, 'karp-encouraged', 3);
    open(run, 'gn-23-falls');
    run = choose(run, 'gn-23-falls', 'Watch.').run;
    expect(flagOf(run, 'karp-level')).toBe(first + 20);
    run = choose(run, 'gn-23-rise', 'Hold out your hand.').run;
    const gyarados = everyone(run).find((m) => m.speciesId === 'gyarados')!;
    expect(gyarados.gn).toContain('karp-notch');
    expect(gyarados.level).toBeGreaterThanOrEqual(Math.min(first + 20, 100) > gyarados.level ? gyarados.level : first + 20);
  });

  it('raiseMarked: up to the stored level, never past the level cap, never down', () => {
    const run = withTeam('fx23-raise');
    const karp = { ...createPokemon(content, 'magikarp', 5, 'p-karp'), gn: ['karp-notch'] };
    run.party.push(karp);
    setFlag(run, 'karp-level', 9);
    expect(raiseMarked(content, run, 'karp-notch', 'karp-level')).toMatch(/level 9/);
    expect(karp.level).toBe(9);
    setFlag(run, 'karp-level', 7);
    expect(raiseMarked(content, run, 'karp-notch', 'karp-level')).toBe('');
    expect(karp.level).toBe(9);
    setFlag(run, 'karp-level', 999);
    raiseMarked(content, run, 'karp-notch', 'karp-level');
    expect(karp.level).toBeLessThanOrEqual(100);
    expect(karp.level).toBeGreaterThan(9);
    // Nobody carries the mark: nothing happens.
    expect(raiseMarked(content, run, 'no-such-mark', 'karp-level')).toBe('');
  });

  it('the Little League team on the bank reads the flag the School Yard really sets', () => {
    const run = withTeam('fx23-league');
    expect(scene(run, 'gn-23-a5').intro).not.toMatch(/Little League/);
    setFlag(run, 'little-league-coached');
    expect(scene(run, 'gn-23-a5').intro).toMatch(/your Little League team/);
    expect(JSON.stringify(content.events.get('school-yard-skirmish'))).toContain('little-league-coached');
  });

  it('PS1 is in the game: a Magikarp that lasts three turns against a Gym Leader evolves there', () => {
    const ps1 = POKEMON_MOMENTS.find((m) => m.id === 'ps1-the-magikarp-that-could')!;
    expect(ps1.status).toBe('supported');
    expect(ps1.effect?.evolveAfter).toMatchObject({ to: 'gyarados', turns: 3 });
  });
});

describe('gn.24 The Forgotten Partner', () => {
  it('a remembered move may be an egg move when its level-up list has dropped nothing', () => {
    const mon = createPokemon(content, 'pikachu', 5, 'p-egg');
    const id = oldEggMove(content, mon);
    if (id) {
      expect(content.moves.has(id)).toBe(true);
      expect(mon.moves.some((m) => m.id === id)).toBe(false);
    }
    // The op: nothing dropped (level 1 knows everything it could), so it takes the egg move if the line has one.
    const run = gnRun('fx24-egg');
    const partner = { ...createPokemon(content, 'pikachu', 1, 'p-old'), gn: ['old-partner'] };
    run.party.push(partner);
    const known = new Set(partner.moves.map((m) => m.id));
    const dropped = content.species.get('pikachu')!.learnset.filter((x) => x.level <= 1 && !known.has(x.move));
    const side = open(run, 'gn-24-visit3');
    setFlag(run, 'partner-visits', 3);
    const out = chooseEvent(content, run, side, 0).run;
    const now = out.party.find((m) => m.uid === 'p-old')!;
    const egg = oldEggMove(content, partner);
    if (dropped.length === 0 && egg) expect(now.moves.some((m) => m.id === egg)).toBe(true);
    expect(flagOf(out, 'partner-peace')).toBe(1);
  });

  it('Final Reunion: Rosabel is there on a folding chair; if it went home, it is on her lap, and it waves', () => {
    const met = gnRun('fx24-reunion');
    setFlag(met, 'partner-met');
    expect(ids(met)).toContain('rosabel');
    expect(lineOf(met, 'rosabel')).toMatch(/on a folding chair/);
    expect(lineOf(met, 'rosabel')).not.toMatch(/waves/);
    const home = gnRun('fx24-reunion-home');
    setFlag(home, 'partner-met');
    setFlag(home, 'partner-went-home');
    expect(ids(home)).toContain('rosabel');
    expect(lineOf(home, 'rosabel')).toMatch(/on her lap.*waves/);
    const refused = gnRun('fx24-reunion-no');
    setFlag(refused, 'partner-met');
    setFlag(refused, 'partner-refused');
    expect(ids(refused)).not.toContain('rosabel');
    expect(ids(gnRun('fx24-reunion-never'))).not.toContain('rosabel');
  });
});

describe('gn.25 The Unlikely Friendship', () => {
  const pack = (seed: string): RunState => {
    const run = withTeam(seed);
    open(run, 'gn-25-heap');
    return choose(choose(run, 'gn-25-heap', 'Watch.').run, 'gn-25-pack', 'Fight beside them.').run;
  };
  const pair = (run: RunState): { zan: PokemonInstance; sev: PokemonInstance } => ({ zan: run.party.find((m) => m.speciesId === 'zangoose')!, sev: run.party.find((m) => m.speciesId === 'seviper')! });

  it('when one is below a third, the other stands in front and takes the next hit (once each)', () => {
    const run = pack('fx25-cover');
    const { zan, sev } = pair(run);
    const b = run.battle!;
    expect(truceCover(content, b, run.party, zan)).toBe(''); // healthy: nobody steps in
    zan.hp = Math.floor(maxHp(content, zan) / 3) - 1;
    expect(truceCover(content, b, run.party, zan)).toBe('Seviper');
    expect(truceCover(content, b, run.party, zan)).toBe(''); // only the next hit
    sev.hp = 1;
    expect(truceCover(content, b, run.party, sev)).toBe('Zangoose');
    // Your own Pokémon aren't part of the truce.
    const mine = run.party[0]!;
    mine.hp = 1;
    expect(truceCover(content, b, run.party, mine)).toBe('');
  });

  it('nobody stands in front when the partner is down, or outside the pack fight', () => {
    const run = pack('fx25-cover-none');
    const { zan, sev } = pair(run);
    zan.hp = 1;
    sev.hp = 0;
    expect(truceCover(content, run.battle!, run.party, zan)).toBe('');
    sev.hp = 10;
    run.battle!.eventRule = {};
    expect(truceCover(content, run.battle!, run.party, zan)).toBe('');
  });

  it('when one is hit hard, the other goes for whatever did it', () => {
    const run = pack('fx25-avenge');
    const { zan } = pair(run);
    const b = run.battle!;
    const foe = b.enemyTeam[0]!;
    const full = foe.hp;
    truceHurt(content, b, run.party, foe.uid, zan, 1); // a scratch: no answer
    expect(truceAnswers(content, b, run.party)).toEqual([]);
    truceHurt(content, b, run.party, foe.uid, zan, Math.ceil(maxHp(content, zan) / 3));
    const lines = truceAnswers(content, b, run.party);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^Seviper goes straight for the Mightyena that hurt Zangoose/);
    expect(foe.hp).toBeLessThan(full);
    expect(foe.hp).toBeGreaterThanOrEqual(1); // the knock-out stays the player's
    expect(truceAnswers(content, b, run.party)).toEqual([]); // answered once
  });

  it('the fight plays through the engine with the rule on', () => {
    let run = pack('fx25-engine');
    for (let i = 0; i < 3 && run.phase === 'battle' && !run.battle!.needsSwitch; i++) run = takeTurn(content, structuredClone(run), { kind: 'move', index: 0 }).run;
    expect(['battle', 'map', 'reward']).toContain(run.phase);
  });

  const recruited = (seed: string, reunited: boolean): RunState => {
    const run = withTeam(seed);
    run.party.push({ ...createPokemon(content, 'zangoose', 20, 'p-zan'), fixedAbility: 'truce' });
    setFlag(run, 'truce-one', 1);
    if (reunited) setFlag(run, 'truce-reunited');
    return run;
  };

  it('Final Reunion: separated and never let in, they find each other, and the recruited one goes', () => {
    const run = recruited('fx25-reunion', false);
    expect(ids(run)).toContain('truce');
    expect(run.party.some((m) => m.speciesId === 'zangoose')).toBe(false);
    expect(lineOf(run, 'truce')).toMatch(/find each other. Yours goes/);
    expect(flagOf(run, 'truce-apart')).toBe(1);
  });

  it('Final Reunion: nothing happens when the other was let in, when both joined, or when it is your last Pokémon', () => {
    const together = recruited('fx25-reunion-ok', true);
    expect(ids(together)).not.toContain('truce');
    expect(together.party.some((m) => m.speciesId === 'zangoose')).toBe(true);
    const both = withTeam('fx25-reunion-both');
    setFlag(both, 'truce-both');
    expect(ids(both)).not.toContain('truce');
    const last = recruited('fx25-reunion-last', false);
    last.party = last.party.filter((m) => m.speciesId === 'zangoose');
    truceMeets(last);
    expect(last.party).toHaveLength(1);
    expect(flagOf(last, 'truce-apart')).toBe(0);
  });
});

describe('gn.26 The Island of Giant Pokémon', () => {
  it('"Show them" needs the whole party of six: the clearing is full with six small Pokémon in it', () => {
    const few = withTeam('fx26-few');
    const side = open(few, 'gn-26-clearing');
    const show = (run: RunState, id: string) => eventView(content, run, id).choices.find((c) => c.label === 'Show them.')!;
    expect(show(few, side).locked).toBeTruthy();
    const six = withTeam('fx26-six', ['snorlax', 'pichu', 'rattata', 'pidgey', 'caterpie']);
    expect(six.party).toHaveLength(6);
    const side6 = open(six, 'gn-26-clearing');
    expect(show(six, side6).locked).toBeFalsy();
    expect(flagOf(choose(six, 'gn-26-clearing', 'Show them.').run, 'giants-quarrel')).toBe(1);
  });

  it('Stamp shakes the whole field: it hits (and flinches) everyone else, on both sides', () => {
    const stamp = content.moves.get('stamp')!;
    expect(targetKind(stamp)).toBe('others');
    expect(stamp.effects.flinchChance).toBe(100);
  });
});

describe('gn.27 The Pokémon Circus', () => {
  const gate = (seed: string, visits = 0, setup: (run: RunState) => void = () => {}): RunState => {
    const run = withTeam(seed);
    run.money = 20000;
    setFlag(run, 'circus-visits', visits);
    setup(run);
    open(run, 'gn-27-gate');
    return choose(run, 'gn-27-gate', 'Step up.').run;
  };
  const SIDES = ['left', 'middle', 'right'];
  const mime = (seed: string): RunState => {
    const run = gate(seed);
    open(run, 'gn-27-mime');
    return choose(run, 'gn-27-mime', 'Step up to the walls.').run;
  };

  it("Mr. Mime's Illusions can be worked out: watching shows whose wall the sawdust piles against", () => {
    const run = mime('fx27-watch');
    const real = flagOf(run, 'circus-mime');
    const watched = choose(run, 'gn-27-mime-lean', 'Watch them first.');
    expect(said(watched)).toMatch(new RegExp(`At the foot of the ${SIDES[real - 1]} one, it piles up`));
    expect(flagOf(watched.run, 'circus-tickets')).toBe(2); // watching is free
    const leaned = choose(watched.run, 'gn-27-mime-lean', `Lean on the ${SIDES[real - 1]} one.`);
    expect(said(leaned)).toMatch(/It holds/);
    expect(flagOf(leaned.run, 'circus-mime-won')).toBe(1);
  });

  it('lean on each: a fall leaves two, a second fall leaves the real one and no prize', () => {
    const run = mime('fx27-falls');
    const real = flagOf(run, 'circus-mime');
    const wrong = SIDES.filter((_, i) => i !== real - 1);
    const one = choose(run, 'gn-27-mime-lean', `Lean on the ${wrong[0]} one.`);
    expect(said(one)).toMatch(/Two left/);
    expect(scene(one.run, 'gn-27-mime-lean').labels).not.toContain(`Lean on the ${wrong[0]} one.`);
    expect(flagOf(one.run, 'circus-tickets')).toBe(2); // the same ticket
    // Second lean, right this time: still a prize.
    expect(flagOf(choose(one.run, 'gn-27-mime-lean', `Lean on the ${SIDES[real - 1]} one.`).run, 'circus-mime-won')).toBe(1);
    const two = choose(one.run, 'gn-27-mime-lean', `Lean on the ${wrong[1]} one.`);
    expect(said(two)).toMatch(/No prize for the last wall standing/);
    expect(flagOf(two.run, 'circus-mime-won')).toBe(0);
    expect(next(two.run)).toBe('gn-27-mime');
  });

  it('next region: the Mystery Tent has a second curtain (once); the first visit has one', () => {
    const offer = (run: RunState, id: string) => choose(run, id, 'Walk on.').run;
    const first = gate('fx27-curtain-1');
    open(first, 'gn-27-mystery');
    const a = offer(choose(first, 'gn-27-mystery', 'Draw back the card.').run, 'gn-27-mystery-offer');
    expect(next(a)).toBe('gn-27-top');
    const second = gate('fx27-curtain-2', 1);
    expect(flagOf(second, 'circus-visits')).toBe(2);
    open(second, 'gn-27-mystery');
    const b = offer(choose(second, 'gn-27-mystery', 'Draw back the card.').run, 'gn-27-mystery-offer');
    expect(next(b)).toBe('gn-27-mystery-offer-2');
    expect(flagOf(b, 'circus-tier')).toBeGreaterThanOrEqual(1);
    const c = offer(b, 'gn-27-mystery-offer-2');
    expect(next(c)).toBe('gn-27-top');
    // A second card the same night: only the one curtain again.
    open(c, 'gn-27-mystery');
    expect(next(offer(choose(c, 'gn-27-mystery', 'Draw back the card.').run, 'gn-27-mystery-offer'))).toBe('gn-27-top');
  });

  it("the one after: a strongman's rematch, all four arms, two stat items", () => {
    const early = gate('fx27-rematch-early', 1);
    expect(scene(early, 'gn-27-machamp').labels).not.toContain("The strongman's rematch.");
    const run = gate('fx27-rematch', 2);
    expect(scene(run, 'gn-27-machamp').labels).toContain("The strongman's rematch.");
    open(run, 'gn-27-machamp');
    const room = choose(run, 'gn-27-machamp', "The strongman's rematch.").run;
    const weak = choose(room, 'gn-27-rematch', 'Enter your strongest.');
    expect(said(weak)).toMatch(/never going to be close|Four arms go down/);
    // A much stronger Pokémon beats all four arms.
    const strong = structuredClone(room);
    strong.party.push(createPokemon(content, 'machamp', 100, 'p-champ'));
    const won = choose(strong, 'gn-27-rematch', 'Enter your strongest.');
    expect(said(won)).toMatch(/Four arms go down/);
    expect(flagOf(won.run, 'circus-rematch-won')).toBe(1);
  });

  it('after the show it may ask to join, even when Fontaine wins', () => {
    const run = gate('fx27-asks', 1, (r) => setFlag(r, 'circus-shy-helped'));
    open(run, 'gn-27-final');
    const lost = lose(choose(run, 'gn-27-final', 'Places!').run);
    expect(next(lost)).toBe('gn-27-after');
    const stayed = choose(lost, 'gn-27-after', 'Stay. They need you here.').run;
    expect(next(stayed)).toBe('gn-27-top'); // "Again tomorrow": you can come back
    // First visit: it doesn't ask yet.
    const first = gate('fx27-asks-first', 0, (r) => setFlag(r, 'circus-shy-helped'));
    open(first, 'gn-27-final');
    expect(next(lose(choose(first, 'gn-27-final', 'Places!').run))).toBe('gn-27-top');
  });

  it('Madame Roux is on the bill once you have met her at her fair', () => {
    const run = gate('fx27-roux');
    expect(scene(run, 'gn-27-top').intro).not.toMatch(/Madame Roux/);
    expect(content.events.has('festival-day')).toBe(true);
    const bill = content.events.get('gn-27-top')!.remembers!.find((r) => r.id === 'bill')!;
    expect(bill.when).toEqual([{ kind: 'eventSeen', id: 'festival-day' }]);
  });
});

describe('gn.28 The Team Rocket Hideout', () => {
  const rocket = (seed: string): RunState => {
    const run = withTeam(seed);
    run.story.evil = { teamId: 'rocket', beat: 0, nextAt: 0, heat: 0, ops: [], villains: {}, defector: false, end: 'none', region: 0, stages: 0 } as never;
    return run;
  };
  const at = (seed: string, room: string, alert: number, staff = false): RunState => {
    const run = rocket(seed);
    setFlag(run, 'hideout-entered');
    setFlag(run, 'hideout-alert', alert);
    if (staff) {
      setFlag(run, 'team-rocket-inside');
      setFlag(run, 'hideout-inside');
    }
    open(run, room);
    return run;
  };

  it('inside the team the floors are your workplace and the meter is Suspicion', () => {
    const out = at('fx28-out', 'gn-28-offices', 2);
    expect(scene(out, 'gn-28-offices').intro).toMatch(/Alert low/);
    const staff = at('fx28-staff', 'gn-28-offices', 2, true);
    const view = eventView(content, staff, staff.stage!.map.nodes.find((n) => n.id === staff.stage!.current)!.sides.at(-1)!.id);
    expect(view.event.intro).toMatch(/Suspicion low/);
    expect(view.event.intro).not.toMatch(/Alert/);
    expect(gnTokens(content, staff, '{hideout:meter} / {hideout:patrol}')).toBe('Suspicion / A colleague can still talk their way past. Just.');
    expect(gnTokens(content, out, '{hideout:meter} / {hideout:patrol}')).toBe("Alert / Nobody's talking their way past anyone now.");
  });

  it('a colleague can still talk their way past patrols (5 to 9), never at 10; an outsider only at 0 to 4', () => {
    const labels = (alert: number, staff: boolean): string[] => scene(at(`fx28-talk-${alert}-${staff}`, 'gn-28-offices', alert, staff), 'gn-28-offices').labels;
    expect(labels(4, false)).toContain('Talk your way past.');
    expect(labels(5, false)).not.toContain('Talk your way past.');
    expect(labels(5, true)).toContain('Talk your way past.');
    expect(labels(9, true)).toContain('Talk your way past.');
    expect(labels(10, true)).not.toContain('Talk your way past.');
    const talked = choose(at('fx28-talk-staff', 'gn-28-offices', 7, true), 'gn-28-offices', 'Talk your way past.');
    expect(said(talked)).toMatch(/"Audit," you say/);
    expect(said(talked)).toMatch(/Suspicion \+2/);
    // The pen keeper helps a colleague at 7; an outsider has to fight her.
    const helped = choose(at('fx28-keeper-staff', 'gn-28-holding', 7, true), 'gn-28-holding', 'Ask the keeper to help.');
    expect(helped.battle).toBe(false);
    expect(flagOf(helped.run, 'freed-caged')).toBe(1);
    expect(choose(at('fx28-keeper-out', 'gn-28-holding', 7), 'gn-28-holding', 'Ask the keeper to help.').battle).toBe(true);
  });

  it('going in works out whether you are staff', () => {
    const run = rocket('fx28-door');
    setFlag(run, 'team-rocket-inside');
    open(run, 'gn-28-door');
    const inside = choose(run, 'gn-28-door', 'Go in.');
    expect(flagOf(inside.run, 'hideout-inside')).toBe(1);
    expect(said(inside)).toMatch(/You work here/);
    const outsider = rocket('fx28-door-out');
    open(outsider, 'gn-28-door');
    expect(flagOf(choose(outsider, 'gn-28-door', 'Go in.').run, 'hideout-inside')).toBe(0);
  });

  it('the Shadow Pokémon is offered once: opened in the locked lab, it is not on the Vault shelves too', () => {
    const fresh = at('fx28-shadow', 'gn-28-reward', 3);
    expect(scene(fresh, 'gn-28-reward').labels).toEqual(['A Shadow Pokémon.', 'A stolen evolution item.', 'A rare egg.', 'A pass to the black market.']);
    setFlag(fresh, 'hideout-shadow-freed');
    expect(scene(fresh, 'gn-28-reward').labels).toEqual(['A stolen evolution item.', 'A rare egg.', 'A pass to the black market.']);
  });

  it('one of the freed asks to join at normal catch odds: it never attacks, and a catch has Bond +1 already', () => {
    const run = rocket('fx28-asks');
    setFlag(run, 'freed-caged');
    setFlag(run, 'hideout-region', run.regionIndex + 5);
    open(run, 'gn-28-asks');
    const fight = choose(run, 'gn-28-asks', 'Come with us.');
    expect(fight.battle).toBe(true);
    expect(fight.run.battle!.kind).toBe('wild');
    expect(fight.run.battle!.eventRule?.foeStands).toBe(99);
    expect(fight.run.battle!.eventRule?.noCatch).toBeUndefined();
    const caught = win(fight.run, { catchIt: true });
    expect(flagOf(caught, 'hideout-asked')).toBe(caught.regionIndex + 1);
    const base = content.balance.friendship.base;
    expect(everyone(caught).some((m) => m.friendship >= base + 50)).toBe(true);
  });

  it('bondNewest: the newest Pokémon, capped at the top; nothing with an empty party', () => {
    const run = withTeam('fx28-bond');
    const last = run.party[run.party.length - 1]!;
    last.friendship = content.balance.friendship.max - 10;
    bondNewest(content, run, 50);
    expect(last.friendship).toBe(content.balance.friendship.max);
    run.party = [];
    expect(bondNewest(content, run, 50)).toBe('');
  });

  it('the rescue centre becomes a place to rest on the map', () => {
    const run = rocket('fx28-centre');
    setFlag(run, 'freed-caged');
    setFlag(run, 'hideout-region', run.regionIndex + 5);
    open(run, 'gn-28-centre');
    const here = (r: RunState) => r.stage!.map.nodes.find((n) => n.id === r.stage!.current)!;
    const before = here(run).sides.filter((s) => s.kind === 'heal').length;
    const out = choose(run, 'gn-28-centre', 'Go in.').run;
    expect(here(out).sides.filter((s) => s.kind === 'heal').length).toBe(before + 1);
    expect(flagOf(out, 'hideout-centre')).toBe(1);
  });
});

describe('gn.29 The Psyduck Migration', () => {
  it('the doc\'s kinds: Miniature Episode, Snake minigame', () => {
    expect((placement as Record<string, { kinds: string[] }>)['gn-29-town']!.kinds).toEqual(['Miniature Episode', 'Snake minigame']);
  });

  it('PS14 The Headache applies to this Psyduck at double the chance', () => {
    const ps14 = POKEMON_MOMENTS.find((m) => m.id === 'p2-psyduck-headache')!;
    expect(ps14.chance).toBe(0.5);
    expect(ps14.chanceMark).toEqual({ mark: 'psyduck-headache', times: 2 });
    // The Psyduck from the lake carries that mark.
    expect(JSON.stringify(content.events.get('gn-29-lake'))).toContain('"mark":"psyduck-headache"');
  });
});

describe('gn.30 The Island of Pink Pokémon', () => {
  const pinkMon = (uid: string, shade = 0): PokemonInstance => ({ ...createPokemon(content, 'mareep', 12, uid), marks: [PINK_MARKS[shade]!] });
  const later = (seed: string, fruit: number): RunState => {
    const run = withTeam(seed);
    run.party.push(pinkMon('p-pink'));
    setFlag(run, 'pink-done');
    setFlag(run, 'pink-reward', 1);
    setFlag(run, 'pink-fruit', fruit);
    setFlag(run, 'pink-shade-at', run.regionIndex + 1);
    return run;
  };
  const due = (run: RunState): boolean => content.events.get('gn-30-fade')!.requires.every((c) => conditionMet(content, run, c));

  it('a side branch at step 11', () => {
    expect(content.coPlacement!.get('gn-30-door')).toMatchObject({ home: 11, window: [9, 14], sits: 'side-branch' });
  });

  it('you choose which Pokémon eats the fruit', () => {
    const run = withTeam('fx30-pick');
    const side = open(run, 'gn-30-gift');
    const index = scene(run, 'gn-30-gift').labels.indexOf('Let one of yours try the fruit.');
    const out = chooseEvent(content, run, side, index, run.party[1]!.uid).run;
    expect(out.party[1]!.marks).toContain(PINK_MARKS[0]);
    expect(out.party[0]!.marks ?? []).not.toContain(PINK_MARKS[0]);
    expect(flagOf(out, 'pink-shade-at')).toBe(out.regionIndex + 1);
  });

  it('pink fades a shade at each region with no fruit, and then it is gone', () => {
    const run = later('fx30-fade', 0);
    expect(due(run)).toBe(false); // not in the region it left the island
    run.regionIndex += 1;
    expect(due(run)).toBe(true);
    open(run, 'gn-30-fade');
    expect(scene(run, 'gn-30-fade').labels).toEqual(['There is no fruit.']);
    let out = choose(run, 'gn-30-fade', 'There is no fruit.').run;
    const mon = (r: RunState) => r.party.find((m) => m.uid === 'p-pink')!;
    expect(pinkShade(mon(out))).toBe(1);
    expect(flagOf(out, 'pink-shade')).toBe(1);
    expect(due(out)).toBe(false); // once a region
    for (const shade of [2, -1]) {
      out.regionIndex += 1;
      expect(due(out)).toBe(true);
      open(out, 'gn-30-fade');
      out = choose(out, 'gn-30-fade', 'There is no fruit.').run;
      expect(pinkShade(mon(out))).toBe(shade);
    }
    // Its own colour again: nothing left to fade, so the scene never comes back.
    out.regionIndex += 1;
    expect(due(out)).toBe(false);
    expect(mon(out).marks).toEqual([]);
  });

  it('each Pink Fruit holds the colour for one region; after the last, "Plant the stone?"', () => {
    const run = later('fx30-fruit', 2);
    run.regionIndex += 1;
    open(run, 'gn-30-fade');
    expect(scene(run, 'gn-30-fade').labels).toEqual(['Give it a Pink Fruit.', 'Keep the fruit for later.']);
    const fed = choose(run, 'gn-30-fade', 'Give it a Pink Fruit.').run;
    expect(flagOf(fed, 'pink-fruit')).toBe(1);
    expect(pinkShade(fed.party.find((m) => m.uid === 'p-pink')!)).toBe(0);
    expect(openSide(fed)?.eventId).not.toBe('gn-30-stone');
    fed.regionIndex += 1;
    open(fed, 'gn-30-fade');
    const last = choose(fed, 'gn-30-fade', 'Give it a Pink Fruit.').run;
    expect(flagOf(last, 'pink-fruit')).toBe(0);
    expect(next(last)).toBe('gn-30-stone');
    expect(scene(last, 'gn-30-stone').intro).toMatch(/Plant the stone\?/);
    const planted = choose(last, 'gn-30-stone', 'Plant it.');
    expect(flagOf(planted.run, 'pink-stone-planted')).toBe(1);
    expect(planted.text).not.toMatch(/later run|next run/); // no memory across runs
    expect(flagOf(choose(last, 'gn-30-stone', 'Keep it.').run, 'pink-stone-kept')).toBe(1);
    // Keeping the fruit instead lets the colour go a shade.
    const kept = choose(run, 'gn-30-fade', 'Keep the fruit for later.').run;
    expect(flagOf(kept, 'pink-fruit')).toBe(2);
    expect(pinkShade(kept.party.find((m) => m.uid === 'p-pink')!)).toBe(1);
  });

  it('pinkFade: every pink Pokémon you own, in the party and the box; nothing when nobody is pink', () => {
    const run = withTeam('fx30-all');
    expect(pinkFade(content, run)).toBe('');
    run.party.push(pinkMon('p-a', 0));
    run.box.push(pinkMon('p-b', 2));
    const text = pinkFade(content, run);
    expect(pinkShade(run.party.find((m) => m.uid === 'p-a')!)).toBe(1);
    expect(pinkShade(run.box[0]!)).toBe(-1);
    expect(text).toMatch(/its own colour again/);
  });

  it('pink is visible: a tint by shade, and every foe met on the island is pink', () => {
    expect(pinkTint(pinkMon('p-0', 0))).toBe(0xff9ec8);
    expect(pinkTint(pinkMon('p-1', 1))).not.toBe(pinkTint(pinkMon('p-0', 0)));
    expect(pinkTint(pinkMon('p-2', 2))).not.toBeNull();
    expect(pinkTint(createPokemon(content, 'mareep', 12, 'p-plain'))).toBeNull();
    expect(islanderTint('gn-30-orchard')).toBe(0xff9ec8);
    expect(islanderTint('gn-26-beach')).toBeNull();
    expect(islanderTint(undefined)).toBeNull();
  });
});
