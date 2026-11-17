// Allies the game controls, on the field beside the player (core/battle/guests.ts; the field work is in battle/doubles.ts).
// gn.25 The Unlikely Friendship: the pack fight is a triple battle with the Zangoose and the Seviper on your side.
// gn.01 Poli-Pond, the return: a Poliwrath and three (or four) Poliwhirl stand beside you for three (or four) turns.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { commandPlan, shiftOptionProblem } from '../../src/core/battle/fieldMenu';
import { fieldUids, makeDoubles } from '../../src/core/battle/doubles';
import { isGuest } from '../../src/core/battle/guests';
import { makeTriples } from '../../src/core/battle/triples';
import { FLAGS, pondFlag, setPondFlag } from '../../src/core/episodes/poliPond';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn, type TurnResult } from '../../src/core/run';
import { RunStateSchema, type PokemonInstance, type RunState } from '../../src/core/state';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, win } from './helpers/gnPlay';

const field = (run: RunState) => fieldUids({ battle: run.battle!, party: run.party });
const species = (run: RunState, uid: string | null): string | null => (uid ? ([...run.party, ...run.battle!.enemyTeam].find((m) => m.uid === uid)?.speciesId ?? uid) : null);
const reload = (run: RunState): RunState => RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
const turn = (run: RunState, index = 0): TurnResult => takeTurn(content, run, { kind: 'move', index });
const texts = (r: TurnResult): string[] => r.events.map((e) => (e as { text?: string }).text ?? '').filter(Boolean);

// ---------------------------------------------------------------------------------------------------------------------
describe('gn.25: the pack fight has the Zangoose and the Seviper on the field, played by the game', () => {
  const pack = (seed: string, extra: string[] = ['snorlax', 'pidgey']): RunState => {
    const run = gnRun(seed);
    for (const [i, sp] of extra.entries()) run.party.push(createPokemon(content, sp, run.party[0]!.level + 5, `p-${i}`));
    open(run, 'gn-25-heap');
    return choose(choose(run, 'gn-25-heap', 'Watch.').run, 'gn-25-pack', 'Fight beside them.').run;
  };
  const pair = (run: RunState): { zan: PokemonInstance; sev: PokemonInstance } => ({ zan: run.party.find((m) => m.speciesId === 'zangoose')!, sev: run.party.find((m) => m.speciesId === 'seviper')! });

  it('normal: a triple battle, your lead on the left and the pair beside it; six Mightyena, three out at a time', () => {
    const run = pack('al25-a');
    const b = run.battle!;
    expect(b.doubles?.trio).toBeTruthy();
    expect(field(run).player.map((u) => species(run, u))).toEqual([run.party[0]!.speciesId, 'zangoose', 'seviper']);
    expect(field(run).enemy.map((u) => species(run, u))).toEqual(['mightyena', 'mightyena', 'mightyena']);
    expect(b.enemyTeam).toHaveLength(6);
    const { zan, sev } = pair(run);
    expect(b.guests?.uids).toEqual([zan.uid, sev.uid]);
    expect(b.loaner).toBeUndefined();
    // The pair are at the party's level (A+0) and are the last two in the party; your own Pokémon keep their places.
    expect(run.party.slice(-2).map((m) => m.speciesId)).toEqual(['zangoose', 'seviper']);
    // The player is asked for the lead only: the game plays the other two.
    expect(commandPlan({ battle: b, party: run.party }).map((p) => p.kind)).toEqual(['ask', 'skip', 'skip']);
  });

  it('the pair pick their own moves each turn, and whatever is sent for their spots is ignored', () => {
    const run = pack('al25-b');
    const { zan, sev } = pair(run);
    for (const m of run.party) m.hp = maxHp(content, m);
    // A command for an ally's spot (even a wrong one) is not read.
    const bad = { action: { kind: 'switch' as const, partyIndex: 0 } };
    const r = takeTurn(content, run, { kind: 'double', commands: [{ action: { kind: 'move', index: 0 }, target: { side: 'enemy', spot: 0 } }, bad, bad] });
    const moves = r.events.filter((e) => e.type === 'move' && (e as { side: string }).side === 'player');
    expect(moves.length).toBeGreaterThanOrEqual(2); // the lead and at least one of the pair got their move off
    // Nothing was switched: the pair still stand where they stood.
    expect(field(r.run).player.slice(1)).toEqual([zan.uid, sev.uid]);
    // Their PP went down: they used real moves.
    const after = pair(r.run);
    const used = (before: PokemonInstance, now: PokemonInstance) => before.moves.some((m, i) => now.moves[i]!.pp < m.pp);
    expect(used(zan, after.zan) || used(sev, after.sev)).toBe(true);
  });

  it('failure: an ally is not the player\'s to send out, and nobody shifts while allies hold their places', () => {
    const run = pack('al25-c');
    const b = run.battle!;
    const zanIndex = run.party.findIndex((m) => m.speciesId === 'zangoose');
    expect(shiftOptionProblem(b, 0)).toBe('Your allies hold their places');
    expect(() => takeTurn(content, run, { kind: 'double', commands: [{ action: { kind: 'shift' } }, null, null] })).toThrow('Your allies hold their places');
    // The lead cannot switch into an ally (already out), and an ally can't be picked for a refill either (below).
    expect(() => takeTurn(content, run, { kind: 'double', commands: [{ action: { kind: 'switch', partyIndex: zanIndex } }, null, null] })).toThrow();
  });

  it('they can be hit and can faint; your next Pokémon takes the fallen one\'s place', () => {
    let run = pack('al25-d');
    for (const m of run.party) m.hp = maxHp(content, m);
    const { zan, sev } = pair(run);
    run.party.find((m) => m.uid === zan.uid)!.hp = 1;
    run.party.find((m) => m.uid === sev.uid)!.hp = 1;
    let fell: string | null = null;
    for (let i = 0; i < 12 && run.phase === 'battle' && !fell; i++) {
      run = structuredClone(run);
      // Keep the fight going: your own stay healthy and the pack stays sturdy, so only the pair are at risk.
      for (const m of run.party) if (!isGuest(run.battle, m.uid) && m.hp > 0) m.hp = maxHp(content, m);
      for (const f of run.battle!.enemyTeam) if (f.hp > 0) f.hp = maxHp(content, f);
      const r = turn(run);
      run = r.run;
      const down = r.events.find((e) => e.type === 'faint' && [zan.uid, sev.uid].includes((e as { uid: string }).uid));
      if (down) fell = (down as { uid: string }).uid;
    }
    expect(fell).not.toBeNull();
    expect(run.party.find((m) => m.uid === fell)!.hp).toBe(0);
    // Its place is the player's to fill, from the player's own bench: never with the other ally.
    const b = run.battle!;
    expect(b.needsSwitch).toBe(true);
    const guestIndex = run.party.findIndex((m) => isGuest(b, m.uid) && m.hp > 0);
    if (guestIndex >= 0) expect(() => takeTurn(content, run, { kind: 'switch', partyIndex: guestIndex })).toThrow();
    const benchIndex = run.party.findIndex((m, i) => i !== 0 && m.hp > 0 && !isGuest(b, m.uid) && !field(run).player.includes(m.uid));
    run = takeTurn(content, run, { kind: 'switch', partyIndex: benchIndex }).run;
    expect(field(run).player).toContain(run.party[benchIndex]!.uid);
  });

  it('boundary: when your own Pokémon are all down the fight is lost, even with the pair standing; they go home after a win or a loss', () => {
    const lost = lose(pack('al25-e', []));
    expect(lost.phase).toBe('map');
    expect(flagOf(lost, 'truce-pack-lost')).toBe(1);
    expect(lost.party.some((m) => m.speciesId === 'zangoose' || m.speciesId === 'seviper')).toBe(false);
    const start = pack('al25-f');
    const own = start.party.filter((m) => !isGuest(start.battle, m.uid)).map((m) => ({ uid: m.uid, level: m.level }));
    const won = win(start);
    expect(won.party.map((m) => m.uid)).toEqual(own.map((m) => m.uid));
  });

  it('when one of the pair is hit hard, the other uses its next move on whatever did it', () => {
    let run = pack('al25-g');
    for (const m of run.party) m.hp = maxHp(content, m);
    for (const f of run.battle!.enemyTeam) f.hp = maxHp(content, f);
    const { zan, sev } = pair(run);
    // The far-left Mightyena hurt the Zangoose: the Seviper (on the right edge) can only reach it with a long-range move, so the
    // centre one is used here: both of the pair can reach the centre.
    const foe = run.battle!.enemyTeam.find((m) => m.uid === field(run).enemy[1])!;
    run.battle!.storyEffects.push(`guest-grudge:${sev.uid}:${foe.uid}`);
    const before = foe.hp;
    const r = turn(run);
    run = r.run;
    expect(run.battle?.storyEffects.some((t) => t.startsWith('guest-grudge:')) ?? false).toBe(false);
    expect(run.battle!.enemyTeam.find((m) => m.uid === foe.uid)!.hp).toBeLessThan(before);
    expect(zan.uid).not.toBe(sev.uid);
  });

  it('save and reload in the middle: the same fight goes on, turn for turn', () => {
    let a = turn(pack('al25-h')).run;
    let b = reload(a);
    expect(b.battle!.guests).toEqual(a.battle!.guests);
    for (let i = 0; i < 4 && a.phase === 'battle' && !a.battle!.needsSwitch; i++) {
      a = turn(a).run;
      b = turn(reload(b)).run;
    }
    expect(b).toEqual(a);
  });

  it('determinism: the same seed and the same commands give the same fight', () => {
    const play = (): RunState => {
      let run = pack('al25-i');
      for (let i = 0; i < 5 && run.phase === 'battle' && !run.battle!.needsSwitch; i++) run = turn(run).run;
      return run;
    };
    expect(play()).toEqual(play());
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('gn.01 Poli-Pond, the return: the pond stands on the field beside you', () => {
  /** A Champion fight the player is losing (two of four standing), with the pond's return armed. */
  const champion = (seed: string, flag: string = FLAGS.release, o: { foes?: string[]; foeMove?: string; foeLevel?: number } = {}): RunState => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
    for (const [i, sp] of ['rattata', 'pidgey', 'oddish'].entries()) run.party.push(createPokemon(content, sp, 10, `x${i}`));
    setPondFlag(run, FLAGS.armed, 1);
    setPondFlag(run, flag, 1);
    const foes = (o.foes ?? ['snorlax']).map((sp, i) => {
      const foe = createPokemon(content, sp, o.foeLevel ?? 40, `e${i}`);
      foe.moves = [{ id: o.foeMove ?? 'growl', pp: 40 }];
      return foe;
    });
    run.battle = createBattle('trainer', foes, 0, run.party[0]!.uid, { classId: 'x', name: 'Boss', leaderId: null });
    run.phase = 'battle';
    run.stage!.current = run.stage!.map.nodes[0]!.id;
    run.stage!.map.nodes[0]!.kind = 'champion';
    run.party[0]!.hp = maxHp(content, run.party[0]!);
    return run;
  };
  const losing = (run: RunState): RunState => {
    run.party[2]!.hp = 0;
    run.party[3]!.hp = 0;
    return run;
  };
  const heal = (run: RunState): RunState => {
    const next = structuredClone(run);
    for (const m of next.party) if (m.hp > 0) m.hp = maxHp(content, m);
    return next;
  };

  it('normal: it waits until you are losing; then the Poliwrath and a Poliwhirl stand beside your lead, and the foe fields no more than before', () => {
    let run = champion('alpp-a', FLAGS.release, { foes: ['snorlax', 'machamp', 'gengar'] });
    run = turn(run).run;
    expect(run.battle!.guests).toBeUndefined(); // four of four standing: not losing
    expect(run.battle!.doubles).toBeFalsy();
    const r = turn(losing(heal(run)));
    run = r.run;
    expect(texts(r)).toEqual(expect.arrayContaining([
      'A cry from off the field. Your lead turns its head before you do.',
      'A Poliwrath walks onto the field. It looks at you. It recognises you first.',
      'Behind it, three Poliwhirl. They take the field beside you, as allies, a turn each beside the Poliwrath.',
    ]));
    const b = run.battle!;
    expect(b.guests).toMatchObject({ turns: 3, rotate: true, anchor: 'pond-ally-0', grown: 'single', closed: { player: [1, 2], enemy: [0, 2] } });
    expect(b.guests!.uids).toEqual(['pond-ally-0', 'pond-ally-1', 'pond-ally-2', 'pond-ally-3']);
    expect(field(run).player.map((u) => species(run, u))).toEqual([run.party[0]!.speciesId, 'poliwrath', 'poliwhirl']);
    // The foe still has one Pokémon out (in the centre, where everyone reaches it), though two more wait on its bench.
    expect(field(run).enemy.map((u) => species(run, u))).toEqual([null, 'snorlax', null]);
    // They are real Pokémon at the party's average level.
    const own = run.party.filter((m) => !isGuest(b, m.uid));
    const avg = Math.round(own.reduce((n, m) => n + m.level, 0) / own.length);
    expect(run.party.filter((m) => isGuest(b, m.uid)).every((m) => m.level === avg)).toBe(true);
    expect(commandPlan({ battle: b, party: run.party }).map((p) => p.kind)).toEqual(['ask', 'skip', 'skip']);
    expect(pondFlag(run, FLAGS.fired)).toBe(1);
    expect(pondFlag(run, 'poli-returned')).toBe(1);
  });

  it('three turns as allies: each Poliwhirl takes one turn beside the Poliwrath, then they all step back and it is a single battle again', () => {
    let run = turn(losing(champion('alpp-b'))).run;
    const beside: (string | null)[] = [];
    let last: TurnResult | null = null;
    for (let i = 0; i < 3; i++) {
      expect(field(run).player[1]).toBe('pond-ally-0'); // the Poliwrath never rotates out
      beside.push(field(run).player[2] ?? null);
      last = turn(heal(run));
      run = last.run;
      if (i < 2) expect(run.battle!.guests!.turns).toBe(2 - i);
    }
    expect(beside).toEqual(['pond-ally-1', 'pond-ally-2', 'pond-ally-3']);
    expect(texts(last!)).toContain('The pond steps back to the edge of the field. The rest is yours.');
    expect(run.battle!.guests).toBeUndefined();
    expect(run.battle!.doubles).toBeFalsy();
    expect(run.party.map((m) => m.uid).some((u) => u.startsWith('pond-ally'))).toBe(false);
    expect(run.party).toHaveLength(4);
    expect(run.battle!.activeIndex).toBe(0);
    // The single battle goes on as before, and the return does not come twice.
    const after = turn(heal(run));
    expect(after.run.battle?.guests).toBeUndefined();
    expect(texts(after).some((t) => t.includes('Poliwrath walks onto the field'))).toBe(false);
  });

  it('Reconcile: four Poliwhirl (Burl among them) for four turns', () => {
    const r = turn(losing(champion('alpp-c', FLAGS.reconcile)));
    let run = r.run;
    expect(texts(r).some((t) => t.includes('four Poliwhirl, Burl among them'))).toBe(true);
    expect(run.battle!.guests).toMatchObject({ turns: 4 });
    expect(run.battle!.guests!.uids).toHaveLength(5);
    const beside: (string | null)[] = [];
    for (let i = 0; i < 4; i++) {
      beside.push(field(run).player[2] ?? null);
      run = turn(heal(run)).run;
    }
    expect(beside).toEqual(['pond-ally-1', 'pond-ally-2', 'pond-ally-3', 'pond-ally-4']);
    expect(run.battle!.guests).toBeUndefined();
  });

  it('they hit with real moves and can land the knock-out', () => {
    let run = turn(losing(champion('alpp-d'))).run;
    run = heal(run);
    const lead = run.party[0]!;
    lead.moves = [{ id: 'growl', pp: 40 }]; // the player's own Pokémon does no damage this turn
    run.battle!.enemyTeam[0]!.hp = 1;
    const r = turn(run);
    expect(r.events.some((e) => e.type === 'faint' && (e as { side: string }).side === 'enemy')).toBe(true);
    expect(r.run.battle === null || r.run.battle.outcome === 'win' || r.run.phase !== 'battle').toBe(true);
    // And they go home with the fight: nobody from the pond is left in the party.
    expect(r.run.party.some((m) => m.uid.startsWith('pond-ally'))).toBe(false);
  });

  it('they can be hit and can faint, and the next one waiting walks in', () => {
    // A foe whose move hits everyone next to it, far above their level.
    let run = turn(losing(champion('alpp-e'))).run;
    run = heal(run);
    const strong = createPokemon(content, 'snorlax', 90, 'e0');
    strong.moves = [{ id: 'earthquake', pp: 10 }];
    run.battle!.enemyTeam[0] = strong;
    run.party[0]!.moves = [{ id: 'protect', pp: 10 }];
    const before = field(run).player.slice(1);
    const r = turn(run);
    const fainted = r.events.filter((e) => e.type === 'faint' && (e as { side: string }).side === 'player').map((e) => (e as { uid: string }).uid);
    expect(fainted.length).toBeGreaterThan(0);
    for (const uid of fainted) expect(before).toContain(uid);
    for (const uid of fainted) expect(r.run.party.find((m) => m.uid === uid)!.hp).toBe(0);
    // The next one waiting takes the fallen one's place by itself.
    const now = field(r.run).player.slice(1);
    for (const uid of fainted) expect(now).not.toContain(uid);
    expect(now).toHaveLength(2);
    for (const uid of now) expect(r.run.party.find((m) => m.uid === uid)!.hp).toBeGreaterThan(0);
    expect(r.run.battle!.needsSwitch).toBe(false); // the player is not asked to fill an ally's place
  });

  it('boundary: your lead falls while the pond is out: you pick your next Pokémon for your own place only', () => {
    let run = turn(losing(champion('alpp-f'))).run;
    run = structuredClone(run);
    run.battle!.enemyTeam[0] = { ...createPokemon(content, 'snorlax', 90, 'e0'), moves: [{ id: 'tackle', pp: 35 }] };
    run.party[0]!.hp = 1;
    run.party[0]!.moves = [{ id: 'growl', pp: 40 }];
    for (let i = 0; i < 3 && run.battle?.guests && !run.battle.needsSwitch; i++) {
      run = structuredClone(run);
      run.party[0]!.hp = Math.min(1, run.party[0]!.hp);
      run = turn(run).run;
    }
    if (run.battle?.needsSwitch) {
      const b = run.battle;
      const ally = run.party.findIndex((m) => isGuest(b, m.uid) && m.hp > 0 && !field(run).player.includes(m.uid));
      if (ally >= 0) expect(() => takeTurn(content, run, { kind: 'switch', partyIndex: ally })).toThrow();
      run = takeTurn(content, run, { kind: 'switch', partyIndex: 1 }).run;
      if (run.battle?.doubles) expect(field(run).player[0]).toBe(run.party[1]!.uid);
      else expect(run.battle!.activeIndex).toBe(1);
    }
    expect(run.phase).toBe('battle');
  });

  it('failure: no return while a replacement is owed, in a watched fight, or twice', () => {
    const owed = losing(champion('alpp-g', FLAGS.release, { foeLevel: 90 }));
    owed.party[0]!.hp = 1;
    owed.party[0]!.moves = [{ id: 'growl', pp: 40 }];
    const r = turn(owed);
    if (r.run.battle?.needsSwitch) expect(r.run.battle.guests).toBeUndefined();
    const watched = losing(champion('alpp-h'));
    watched.battle!.spectate = { kind: 'duel' };
    expect(turn(watched).run.battle?.guests).toBeUndefined();
    const fired = losing(champion('alpp-i'));
    setPondFlag(fired, FLAGS.fired, 1);
    expect(turn(fired).run.battle?.guests).toBeUndefined();
  });

  it('a double battle grows by one place: one ally at a time, and the foe keeps to its two', () => {
    const run = losing(champion('alpp-j', FLAGS.release, { foes: ['snorlax', 'machamp', 'gengar'] }));
    makeDoubles(run.battle!, run.party);
    const r = takeTurn(content, run, { kind: 'move', index: 0 });
    const b = r.run.battle!;
    expect(b.guests).toMatchObject({ grown: 'double', closed: { player: [2], enemy: [2] } });
    expect(field(r.run).player.map((u) => species(r.run, u))).toEqual([run.party[0]!.speciesId, 'rattata', 'poliwrath']);
    expect(field(r.run).enemy[2]).toBeNull();
    let next = heal(r.run);
    for (let i = 0; i < 3 && next.battle?.guests?.uids.length; i++) next = takeTurn(content, heal(next), { kind: 'move', index: 0 }).run;
    // They have gone; the extra places stay empty for the rest of the fight.
    expect(next.party.some((m) => m.uid.startsWith('pond-ally'))).toBe(false);
    expect(field(next).player[2]).toBeNull();
    expect(field(next).enemy[2]).toBeNull();
  });

  it('save and reload in the middle of the return, and determinism', () => {
    const play = (save: boolean): RunState => {
      let run = turn(losing(champion('alpp-k'))).run;
      for (let i = 0; i < 4 && run.phase === 'battle' && !run.battle!.needsSwitch; i++) run = turn(save ? reload(run) : run).run;
      return run;
    };
    const plain = play(false);
    expect(play(true)).toEqual(plain);
    expect(play(false)).toEqual(plain);
  });

  it('a battle saved in the middle of the old return (no allies on the field) still loads and finishes the old way', () => {
    const run = losing(champion('alpp-l'));
    run.battle!.storyEffects.push('pond-return:2');
    setPondFlag(run, FLAGS.fired, 1);
    const r = turn(reload(run));
    expect(r.run.battle!.guests).toBeUndefined();
    expect(texts(r).some((t) => /^Poliwrath uses /.test(t))).toBe(true);
    expect(r.run.battle!.storyEffects).toContain('pond-return:1');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('an ordinary battle is unchanged', () => {
  const plain = (seed: string, shape: 'single' | 'double' | 'triple'): RunState => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
    for (const [i, sp] of ['rattata', 'pidgey', 'oddish'].entries()) run.party.push(createPokemon(content, sp, 12, `x${i}`));
    const foes = ['geodude', 'zubat', 'ekans', 'paras'].map((sp, i) => createPokemon(content, sp, 11, `e${i}`));
    run.battle = createBattle('trainer', foes, 0, run.party[0]!.uid, { classId: 'x', name: 'Boss', leaderId: null });
    if (shape === 'double') makeDoubles(run.battle, run.party);
    if (shape === 'triple') makeTriples(run.battle, run.party);
    run.phase = 'battle';
    return run;
  };
  const play = (run: RunState, n = 6): RunState => {
    let now = run;
    for (let i = 0; i < n && now.phase === 'battle'; i++) {
      const b = now.battle!;
      now = b.needsSwitch ? takeTurn(content, now, { kind: 'switch', partyIndex: now.party.findIndex((m, k) => m.hp > 0 && !(b.doubles ? field(now).player.includes(m.uid) : k === b.activeIndex)) }).run : turn(now).run;
    }
    return now;
  };

  it.each(['single', 'double', 'triple'] as const)('a %s battle never gains allies, asks for every spot, and plays the same with or without the (empty) ally record', (shape) => {
    const a = play(plain(`alplain-${shape}`, shape));
    expect(a.battle?.guests).toBeUndefined();
    expect(a.party.map((m) => m.uid)).toEqual(plain(`alplain-${shape}`, shape).party.map((m) => m.uid));
    if (shape !== 'single') expect(commandPlan({ battle: plain('x', shape).battle!, party: plain('x', shape).party }).every((p) => p.kind === 'ask')).toBe(true);
    // The ally code is inert when there are no allies: an empty record changes no roll and no result.
    const withRecord = plain(`alplain-${shape}`, shape);
    if (shape !== 'single') withRecord.battle!.guests = { uids: [] };
    const b = play(withRecord);
    if (b.battle) delete b.battle.guests;
    expect(b).toEqual(a);
  });

  it('a save without the ally record loads (the field is optional: no save version change)', () => {
    const run = plain('alplain-save', 'double');
    const raw = JSON.parse(JSON.stringify(run));
    expect('guests' in raw.battle).toBe(false);
    expect(RunStateSchema.parse(raw).battle!.guests).toBeUndefined();
  });
});
