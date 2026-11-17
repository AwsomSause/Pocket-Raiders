import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { applyEffect, conditionMet, placeEarnedCoBeats } from '../../src/core/events';
import { nodesAhead } from '../../src/core/co/placement';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { FLAGS, lessonsTaught, pondAfterTurn, pondFlag, pondMon, pondAllies, pondAllyHit, pondShape, recordLesson, setPondFlag, POND_JOIN_BELOW, POND_RETURN } from '../../src/core/episodes/poliPond';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
const eff = (run: ReturnType<typeof begin>, action: string, extra: object = {}) => applyEffect(content, run, { kind: 'pond', action, firstTry: false, gentle: false, ...extra } as never, new Rng(hashSeed('pp')));
const withBattle = (run: ReturnType<typeof begin>, kind: 'wild' | 'trainer' = 'wild') => {
  const foe = createPokemon(content, 'snorlax', 40, 'e1');
  foe.moves = [{ id: 'tackle', pp: 35 }];
  run.battle = createBattle(kind, [foe], 0, run.party[0]!.uid, kind === 'trainer' ? { classId: 'x', name: 'Boss', leaderId: null } : null);
  return run.battle;
};

describe('Poli-Pond: events', () => {
  const ids = [...content.events.keys()].filter((id) => id.startsWith('pp-'));
  it('loads every event and every addEvent target exists', () => {
    // gn.01 (catalog overhaul): the exceptional rematch is a choice of pp-rematch now (the old event is retired, never drawn); stepping aside has an afterstory; a lost rematch has its own scene.
    expect(ids.sort()).toEqual(['pp-cold-open', 'pp-ending', 'pp-lesson-aim', 'pp-lesson-footing', 'pp-lesson-stand', 'pp-pond-visit', 'pp-rematch', 'pp-rematch-again', 'pp-rematch-exceptional', 'pp-rematch-lost', 'pp-return-join', 'pp-walked-past'].sort());
    expect(content.events.get('pp-rematch-exceptional')!.disabled).toBe(true);
    for (const id of ids) for (const c of content.events.get(id)!.choices) for (const o of [c.success, c.failure]) for (const e of [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]) if (e.kind === 'addEvent') expect(content.events.has(e.eventId)).toBe(true);
  });
  it('the bully "trainer" is drawn as the Poliwhirl, and no event shows a human', () => {
    for (const c of content.events.get('pp-rematch')!.choices) expect((c.success.battle as unknown as { spritePokemon: string }).spritePokemon).toBe('poliwhirl');
    for (const id of ids) expect(content.events.get(id)!.scene.cast).toEqual([]);
  });
  it('the cold open is placed at the first stage from 2 (a callback, not a required forced stop), the lessons are rest callbacks, the exceptional rematch evolves the Poliwag mid-fight', () => {
    expect(content.events.get('pp-cold-open')).toMatchObject({ callback: true, forced: false });
    for (const l of ['aim', 'footing', 'stand']) expect(content.events.get(`pp-lesson-${l}`)).toMatchObject({ stop: 'rest', callback: true });
    const [plain, exceptional] = content.events.get('pp-rematch')!.choices.map((c) => c.success.battle as unknown as { rule: Record<string, unknown>; levelBonus: number });
    expect(exceptional!.rule).toMatchObject({ pondDuel: true, evolveMid: true, noSwitch: true });
    expect(plain!.rule.evolveMid).toBeUndefined();
    // Burl is two levels above the Poliwag.
    expect(plain!.levelBonus).toBe(2);
    expect(plain!.rule.matchLead).toBe(true);
  });
});

describe('Poli-Pond: begin, lessons, endings', () => {
  it('begin gives a shy marked Poliwag once and the save still parses', () => {
    const run = begin('pp1');
    eff(run, 'begin', { gentle: true });
    eff(run, 'begin');
    expect(run.party.filter((m) => m.pond)).toHaveLength(1);
    expect(pondMon(run)).toMatchObject({ speciesId: 'poliwag', pond: { shy: true, aim: false, kept: false } });
    expect(pondFlag(run, FLAGS.begun)).toBe(1);
    expect(RunStateSchema.safeParse(run).success).toBe(true);
  });
  it('three first-retry lessons are Exceptional; a slower one is not; a lesson counts once', () => {
    const a = begin('pp2');
    eff(a, 'begin');
    for (const l of ['aim', 'footing', 'stand'] as const) recordLesson(a, l, true);
    recordLesson(a, 'aim', true);
    expect(lessonsTaught(a)).toBe(3);
    expect(pondFlag(a, FLAGS.exceptional)).toBe(1);
    const b = begin('pp3');
    eff(b, 'begin');
    recordLesson(b, 'aim', true);
    recordLesson(b, 'footing', false);
    recordLesson(b, 'stand', true);
    expect(pondFlag(b, FLAGS.exceptional)).toBe(0);
    expect(pondMon(b)!.pond).toMatchObject({ aim: true, footing: true, stand: true });
  });
  it('Keep gives Kindness; Release and Reconcile send it home and arm the return', () => {
    const k = begin('pp4');
    eff(k, 'begin');
    eff(k, 'keep');
    expect(pondMon(k)).toMatchObject({ fixedAbility: 'kindness', pond: { kept: true, shy: false } });
    const r = begin('pp5');
    eff(r, 'begin');
    eff(r, 'release');
    expect(pondMon(r)).toBeUndefined();
    expect(pondFlag(r, FLAGS.armed)).toBe(1);
    const j = begin('pp6');
    eff(j, 'returnJoin');
    expect(pondMon(j)).toMatchObject({ speciesId: 'poliwrath', fixedAbility: 'kindness' });
  });
});

describe('Poli-Pond: nerves and tricks', () => {
  const setup = (seed: string) => {
    const run = begin(seed);
    eff(run, 'begin');
    const mon = pondMon(run)!;
    run.party = [mon, ...run.party.filter((m) => m !== mon)];
    withBattle(run);
    return { run, mon };
  };
  it('does not attack in its first battle, and is fine once that battle is over', () => {
    const { run, mon } = setup('pp7');
    expect(pondShape(content, run, { kind: 'move', index: 0 }).action).toEqual({ kind: 'idle' });
    run.battle!.participants = [mon.uid];
    run.battle!.outcome = 'win';
    pondAfterTurn(content, run);
    expect(mon.pond!.shy).toBe(false);
  });
  it('gn.01: outside the rematch an untaught lesson costs nothing (no nerves): only the first battle is lost to shyness', () => {
    const { run, mon } = setup('pp8');
    mon.pond!.shy = false;
    // Turn 3 (the old "aim" nerve), first turn out (the old "footing" nerve), under half HP (the old "stand" nerve): it just attacks.
    run.battle!.turn = 3;
    expect(pondShape(content, run, { kind: 'move', index: 0 })).toEqual({ action: { kind: 'move', index: 0 }, events: [] });
    mon.hp = 1;
    expect(pondShape(content, run, { kind: 'move', index: 0 })).toEqual({ action: { kind: 'move', index: 0 }, events: [] });
    expect(run.battle!.storyEffects).toEqual([]);
    // Failure case: a switch or an item is never touched, even while it is shy.
    mon.pond!.shy = true;
    expect(pondShape(content, run, { kind: 'switch', partyIndex: 1 }).action).toEqual({ kind: 'switch', partyIndex: 1 });
  });
  it("the rematch: Burl's three tricks (Splash-Blind turns 1-2, Shove every other turn, the Slap on turn 3), each cancelled by its lesson", () => {
    const { run, mon } = setup('pp8b');
    mon.pond!.shy = false;
    run.battle!.event = { eventId: 'pp-rematch', choiceIndex: 0, sideId: 's', success: true };
    const at = (turn: number) => {
      run.battle!.turn = turn;
      return pondShape(content, run, { kind: 'move', index: 0 });
    };
    // No lessons: both first moves miss, even turns are shoves, and turn 3 is the Slap.
    expect(at(1).events[0]!.text).toMatch(/Splash-Blind/);
    expect(at(2).events[0]!.text).toMatch(/Splash-Blind/);
    expect(at(3).events[0]!.text).toMatch(/The Slap/);
    expect(at(4).events[0]!.text).toMatch(/Shove/);
    expect(at(5).action.kind).toBe('move');
    // All three learned: nothing is lost, and the Slap no longer works on it.
    for (const l of ['aim', 'footing', 'stand'] as const) recordLesson(run, l, true);
    expect(at(1).action.kind).toBe('move');
    expect(at(2).action.kind).toBe('move');
    expect(at(3).action.kind).toBe('move');
    expect(at(3).events[0]!.text).toMatch(/doesn't\. Burl looks at his own hand/);
    expect(at(4).action.kind).toBe('move');
  });
  it('a shortcut lesson cancels its trick about half the time, the same way on every replay', () => {
    const { run, mon } = setup('pp8c');
    mon.pond!.shy = false;
    recordLesson(run, 'footing', false, true);
    expect(pondFlag(run, 'pp-lesson-footing')).toBe(3);
    run.battle!.event = { eventId: 'pp-rematch', choiceIndex: 0, sideId: 's', success: true };
    setPondFlag(run, 'pp-lesson-aim', 2);
    setPondFlag(run, 'pp-lesson-stand', 2);
    const shoves = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42].map((turn) => {
      run.battle!.turn = turn;
      return pondShape(content, run, { kind: 'move', index: 0 }).action.kind === 'idle';
    });
    const fired = shoves.filter(Boolean).length;
    expect(fired).toBeGreaterThan(2);
    expect(fired).toBeLessThan(18);
    run.battle!.turn = 4;
    const again = pondShape(content, run, { kind: 'move', index: 0 }).action.kind === 'idle';
    expect(again).toBe(shoves[0]);
  });
  it('a shortcut lesson is learned but never counts toward Exceptional', () => {
    const run = begin('pp8d');
    eff(run, 'begin');
    recordLesson(run, 'aim', true);
    recordLesson(run, 'footing', true);
    recordLesson(run, 'stand', false, true);
    expect(lessonsTaught(run)).toBe(3);
    expect(pondFlag(run, FLAGS.exceptional)).toBe(0);
  });
  it('is deterministic: the same state gives the same answer', () => {
    const a = setup('pp9');
    const b = setup('pp9');
    expect(pondShape(content, a.run, { kind: 'move', index: 0 })).toEqual(pondShape(content, b.run, { kind: 'move', index: 0 }));
  });
});

describe('Poli-Pond: the return', () => {
  const champion = (seed: string, flag: string) => {
    const run = begin(seed);
    // A full-ish party: the return waits until two or fewer are left standing.
    for (const [i, sp] of ['rattata', 'pidgey', 'oddish'].entries()) run.party.push(createPokemon(content, sp, 10, `x${i}`));
    setPondFlag(run, FLAGS.armed, 1);
    setPondFlag(run, flag, 1);
    const battle = withBattle(run, 'trainer');
    run.stage!.current = run.stage!.map.nodes[0]!.id;
    run.stage!.map.nodes[0]!.kind = 'champion';
    return { run, battle };
  };
  // The return on the field (allies the game plays) is tested through the engine in gnscreen-allies.test.ts. Here: when it starts,
  // who comes, and the old strikes that a battle saved in the middle of the old return still finishes with.
  it('waits until you are losing, then asks the engine to put a Poliwrath and three Poliwhirl on the field for three turns', () => {
    const { run, battle } = champion('pp10', FLAGS.release);
    const calls: { species: string[]; opts: object }[] = [];
    const join = (allies: { speciesId: string; uid: string }[], opts: object) => {
      calls.push({ species: allies.map((m) => m.speciesId), opts });
      battle.guests = { uids: allies.map((m) => m.uid) };
    };
    expect(pondAfterTurn(content, run, join)).toEqual([]);
    run.party[0]!.hp = 1; // badly hurt is not "losing": three are still standing
    run.party[3]!.hp = 0;
    expect(pondAfterTurn(content, run, join)).toEqual([]);
    run.party[2]!.hp = 0; // two left
    // Without the engine there is no field to stand on: the return waits.
    expect(pondAfterTurn(content, run)).toEqual([]);
    expect(pondFlag(run, FLAGS.fired)).toBe(0);
    const allies = pondAllies(content, run, 'release');
    expect(allies.map((m) => m.speciesId)).toEqual(['poliwrath', 'poliwhirl', 'poliwhirl', 'poliwhirl']);
    const avg = Math.round(run.party.reduce((n, m) => n + m.level, 0) / run.party.length);
    expect(allies.every((m) => m.level === avg)).toBe(true);
    const first = pondAfterTurn(content, run, join);
    expect(first.map((c) => c.text)).toEqual([
      'A cry from off the field. Your lead turns its head before you do.',
      'A Poliwrath walks onto the field. It looks at you. It recognises you first.',
      'Behind it, three Poliwhirl. They take the field beside you, as allies, a turn each beside the Poliwrath.',
    ]);
    expect(calls).toEqual([{ species: ['poliwrath', 'poliwhirl', 'poliwhirl', 'poliwhirl'], opts: { turns: 3, rotate: true, anchor: 'pond-ally-0' } }]);
    expect(pondFlag(run, FLAGS.fired)).toBe(1);
    expect(pondFlag(run, 'poli-returned')).toBe(1);
    // While they are out nothing more is said; when the engine has taken them off the field, the last line.
    expect(pondAfterTurn(content, run, join)).toEqual([]);
    battle.guests = undefined;
    expect(pondAfterTurn(content, run, join).map((c) => c.text)).toEqual(['The pond steps back to the edge of the field. The rest is yours.']);
    expect(pondAfterTurn(content, run, join)).toEqual([]); // once only
    expect(calls).toHaveLength(1);
  });
  it('Reconcile brings four Poliwhirl (Burl among them) for four turns', () => {
    const { run, battle } = champion('pp11', FLAGS.reconcile);
    run.party[2]!.hp = 0;
    run.party[3]!.hp = 0;
    let asked: object | null = null;
    const lines = pondAfterTurn(content, run, (allies, opts) => {
      asked = { n: allies.length, ...opts };
      battle.guests = { uids: allies.map((m) => m.uid) };
    });
    expect(lines.some((c) => c.text.includes('four Poliwhirl, Burl among them'))).toBe(true);
    expect(asked).toEqual({ n: 5, turns: 4, rotate: true, anchor: 'pond-ally-0' });
  });
  it('a battle saved in the middle of the old return finishes the old way: strikes with their own moves, the foe never under 1 HP', () => {
    const { run, battle } = champion('pp11c', FLAGS.release);
    run.party[2]!.hp = 0;
    run.party[3]!.hp = 0;
    setPondFlag(run, FLAGS.fired, 1);
    battle.storyEffects.push('pond-return:3');
    const foe = battle.enemyTeam[0]!;
    const full = maxHp(content, foe);
    const allies = pondAllies(content, run, 'release');
    const wrath = pondAllyHit(content, battle, allies[0]!, foe)!;
    const whirl = pondAllyHit(content, battle, allies[1]!, foe)!;
    expect(wrath.damage).toBeGreaterThan(0);
    expect(whirl.damage).toBeGreaterThan(0);
    expect(pondAfterTurn(content, run).map((c) => c.text)).toEqual([`Poliwrath uses ${wrath.move} on Snorlax.`, `The three Poliwhirl follow, one after another: ${whirl.move}.`]);
    expect(foe.hp).toBe(Math.max(1, full - wrath.damage - 3 * whirl.damage));
    pondAfterTurn(content, run);
    const last = pondAfterTurn(content, run);
    expect(last[last.length - 1]!.text).toBe('The pond steps back to the edge of the field. The rest is yours.');
    const afterThree = foe.hp;
    expect(pondAfterTurn(content, run)).toEqual([]);
    expect(foe.hp).toBe(afterThree);
    // Boundary: a foe on its last HP is not fainted by the old strikes.
    const again = champion('pp11b', FLAGS.release);
    again.run.party[2]!.hp = 0;
    again.run.party[3]!.hp = 0;
    setPondFlag(again.run, FLAGS.fired, 1);
    again.battle.storyEffects.push('pond-return:3');
    again.battle.enemyTeam[0]!.hp = 3;
    pondAfterTurn(content, again.run);
    expect(again.battle.enemyTeam[0]!.hp).toBe(1);
    expect(again.battle.outcome).toBeFalsy();
  });
  it('is not played in an ordinary fight', () => {
    const { run } = champion('pp12', FLAGS.release);
    run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.kind = 'battle' as never;
    run.party[2]!.hp = 0;
    run.party[3]!.hp = 0;
    let asked = false;
    expect(pondAfterTurn(content, run, () => { asked = true; })).toEqual([]);
    expect(asked).toBe(false);
  });
});

describe('Kindness', () => {
  const duo = () => {
    const a = createPokemon(content, 'poliwag', 30, 'a');
    a.fixedAbility = 'kindness';
    a.moves = [{ id: 'tackle', pp: 35 }];
    const b = createPokemon(content, 'magikarp', 30, 'b');
    b.moves = [{ id: 'tackle', pp: 35 }];
    const c = createPokemon(content, 'magikarp', 30, 'c');
    c.moves = [{ id: 'tackle', pp: 35 }];
    const enemy = createPokemon(content, 'snorlax', 30, 'e');
    enemy.moves = [{ id: 'tackle', pp: 35 }];
    enemy.hp = 999;
    const battle = createBattle('wild', [enemy], 0, a.uid, null);
    const ctx: BattleContext = { content, battle, party: [a, b, c], inventory: {}, rng: new Rng(hashSeed('k')), captureRng: new Rng(hashSeed('kc')), catchMultiplier: 1 };
    return { battle, ctx, a, b, c };
  };
  it('the Pokémon that comes in moves first, even when it is slower (twice a battle)', () => {
    const { battle, ctx } = duo();
    const ev = resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.storyEffects).toContain('kind:b');
    const next = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(next.filter((e) => e.type === 'move').map((e) => (e as { side: string }).side)[0]).toBe('player');
    expect(ev.some((e) => e.type === 'raid' && /Kindness/.test((e as { text: string }).text))).toBe(true);
  });
  it('is used at most twice per battle', () => {
    const { battle, ctx, a } = duo();
    battle.storyEffects.push('kind-used', 'kind-used');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.storyEffects.some((e) => e.startsWith('kind:'))).toBe(false);
    expect(a.fixedAbility).toBe('kindness');
  });
});

describe('gn.01 fixes: levels, steps, the retry', () => {
  it('the Poliwag joins two levels under the party, so Burl (two above it) is at the party\'s level', () => {
    const run = begin('ppf1');
    run.party.forEach((m) => (m.level = 9));
    eff(run, 'begin');
    expect(POND_JOIN_BELOW).toBe(2);
    expect(pondMon(run)!.level).toBe(7);
    // Boundary: never under level 2.
    const low = begin('ppf1b');
    low.party.forEach((m) => (m.level = 2));
    eff(low, 'begin');
    expect(pondMon(low)!.level).toBe(2);
  });
  it('the lessons and the pond visit are placed ahead in the doc\'s order: Aim (7), Footing (11), the guilty Poliwhirl (14), Standing its ground (17)', () => {
    for (const seed of ['ppf2', 'ppf3', 'ppf4', 'ppf5']) {
      const run = begin(seed);
      const stage = run.stage!;
      stage.index = 1; // gn.01 starts at A2
      // Standing on a node of the cold open's own step (3).
      const col = Math.max(1, Math.round((3 * stage.map.columns) / 20));
      stage.current = stage.map.nodes.find((n) => n.column === col)!.id;
      for (const n of stage.map.nodes) n.sides = n.sides.filter((x) => !x.eventId?.startsWith('pp-'));
      eff(run, 'begin');
      applyEffect(content, run, { kind: 'gn', op: 'stampStage', key: 'pp-stage' } as never, new Rng(hashSeed('pp')));
      const columnOf = (id: string): number[] => stage.map.nodes.filter((n) => n.sides.some((x) => x.eventId === id)).map((n) => n.column);
      const cols = ['pp-lesson-aim', 'pp-lesson-footing', 'pp-pond-visit', 'pp-lesson-stand'].map(columnOf);
      for (const c of cols) expect(c.length).toBeGreaterThan(0);
      // Each sits in one column, all ahead of the player, in order.
      const one = cols.map((c) => { expect(new Set(c).size).toBe(1); return c[0]!; });
      expect(one[0]!).toBeGreaterThan(col);
      expect(one[0]!).toBeLessThan(one[1]!);
      expect(one[1]!).toBeLessThan(one[2]!);
      expect(one[2]!).toBeLessThan(one[3]!);
      // The doc's steps, as columns of this map.
      expect(one).toEqual([7, 11, 14, 17].map((step) => Math.round((step * stage.map.columns) / 20)));
      // Each is on every node of its column that the player can still reach (no route misses it); the placer adds nothing more.
      const ahead = nodesAhead(stage.map, stage.current!);
      for (const [i, id] of ['pp-lesson-aim', 'pp-lesson-footing', 'pp-pond-visit', 'pp-lesson-stand'].entries()) {
        expect(columnOf(id).length).toBe(stage.map.nodes.filter((n) => n.column === one[i] && ahead.has(n.id)).length);
      }
      const before = stage.map.nodes.flatMap((n) => n.sides).length;
      placeEarnedCoBeats(content, run);
      expect(stage.map.nodes.flatMap((n) => n.sides).length).toBe(before);
    }
  });
  it('boundary: a cold open found late still places all four ahead, in order, and never on the Gym column', () => {
    const run = begin('ppf7');
    const stage = run.stage!;
    const col = Math.round((15 * stage.map.columns) / 20);
    stage.current = stage.map.nodes.find((n) => n.column === col)!.id;
    for (const n of stage.map.nodes) n.sides = n.sides.filter((x) => !x.eventId?.startsWith('pp-'));
    eff(run, 'begin');
    const at = (id: string): number => stage.map.nodes.find((n) => n.sides.some((x) => x.eventId === id))!.column;
    const cols = ['pp-lesson-aim', 'pp-lesson-footing', 'pp-pond-visit', 'pp-lesson-stand'].map(at);
    expect(cols[0]!).toBeGreaterThan(col);
    for (let i = 1; i < cols.length; i++) expect(cols[i]!).toBeGreaterThanOrEqual(cols[i - 1]!);
    expect(Math.max(...cols)).toBeLessThan(stage.map.columns);
    // Failure case: a second `begin` adds no second Poliwag and no second set of scenes.
    const sides = stage.map.nodes.flatMap((n) => n.sides).length;
    eff(run, 'begin');
    expect(stage.map.nodes.flatMap((n) => n.sides).length).toBe(sides);
    expect(run.party.filter((m) => m.pond)).toHaveLength(1);
  });
  it('a lost rematch comes back only on a water stage; the first rematch needs no water', () => {
    const first = content.events.get('pp-rematch')!;
    const again = content.events.get('pp-rematch-again')!;
    expect(first.requires.some((c) => c.kind === 'stageTypes')).toBe(false);
    expect(again.requires).toContainEqual({ kind: 'stageTypes', types: ['water'] });
    expect(content.coPlacement!.get('pp-rematch')).toMatchObject({ home: 2, window: [1, 4], sits: 'must-see', level: 0 });
    expect(content.coPlacement!.get('pp-rematch-again')!.tags).toEqual(['water']);
    const run = begin('ppf6');
    eff(run, 'begin');
    run.story.flags['ev:pp-stage'] = 1;
    run.stage!.index = 1; // the stage after the one it joined on
    const ok = (id: string): boolean => content.events.get(id)!.requires.every((c) => conditionMet(content, run, c));
    const water = [...content.themes.values()].find((t) => t.types.includes('water'))!;
    const dry = [...content.themes.values()].find((t) => !t.types.includes('water'))!;
    run.stage!.themeId = dry.id;
    expect(ok('pp-rematch')).toBe(true);
    expect(ok('pp-rematch-again')).toBe(false);
    // Lost on an earlier stage.
    run.story.flags['ev:pp-lost-stage'] = 1;
    expect(ok('pp-rematch')).toBe(false);
    expect(ok('pp-rematch-again')).toBe(false); // not a water stage
    run.stage!.themeId = water.id;
    expect(ok('pp-rematch-again')).toBe(true);
    // Both scenes are the same fight.
    expect(again.choices.map((c) => c.label)).toEqual(first.choices.map((c) => c.label));
  });
});
