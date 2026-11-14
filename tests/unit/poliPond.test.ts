import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { applyEffect } from '../../src/core/events';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { FLAGS, lessonsTaught, pondAfterTurn, pondFlag, pondMon, pondShape, recordLesson, setPondFlag, POND_RETURN } from '../../src/core/episodes/poliPond';
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
    expect(ids.sort()).toEqual(['pp-cold-open', 'pp-ending', 'pp-lesson-aim', 'pp-lesson-footing', 'pp-lesson-stand', 'pp-pond-visit', 'pp-rematch', 'pp-rematch-exceptional', 'pp-return-join'].sort());
    for (const id of ids) for (const c of content.events.get(id)!.choices) for (const o of [c.success, c.failure]) for (const e of [...(o?.effects ?? []), ...(o?.battle?.win ?? [])]) if (e.kind === 'addEvent') expect(content.events.has(e.eventId)).toBe(true);
  });
  it('the cold open is placed at the first stage from 2 (a callback, not a required forced stop), the lessons are rest callbacks, the exceptional rematch evolves the Poliwag mid-fight', () => {
    expect(content.events.get('pp-cold-open')).toMatchObject({ callback: true, forced: false });
    for (const l of ['aim', 'footing', 'stand']) expect(content.events.get(`pp-lesson-${l}`)).toMatchObject({ stop: 'rest', callback: true });
    const b = content.events.get('pp-rematch-exceptional')!.choices[0]!.success.battle as unknown as { rule: Record<string, unknown> };
    expect(b.rule).toMatchObject({ pondDuel: true, evolveMid: true, noSwitch: true });
    expect((content.events.get('pp-rematch')!.choices[0]!.success.battle as unknown as { rule: Record<string, unknown> }).rule.evolveMid).toBeUndefined();
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
  it('each lesson cancels its own nerve; the rematch words them as the bully\'s tricks', () => {
    const { run, mon } = setup('pp8');
    mon.pond!.shy = false;
    run.battle!.turn = 3;
    expect(pondShape(content, run, { kind: 'move', index: 0 }).action).toEqual({ kind: 'idle' });
    mon.pond!.aim = true;
    expect(pondShape(content, run, { kind: 'move', index: 0 }).action).toEqual({ kind: 'idle' }); // footing: first turn out
    mon.pond!.footing = true;
    run.battle!.playerVolatile.turnsOut = 1;
    expect(pondShape(content, run, { kind: 'move', index: 0 }).action.kind).toBe('move');
    mon.hp = 1;
    expect(pondShape(content, run, { kind: 'move', index: 0 }).action.kind).toBe('switch'); // tries to run, once
    expect(pondShape(content, run, { kind: 'move', index: 0 }).action.kind).toBe('move');
    mon.pond!.stand = true;
    run.battle!.turn = 2;
    expect(pondShape(content, run, { kind: 'move', index: 0 }).events).toEqual([]);
    run.battle!.event = { eventId: 'pp-rematch', choiceIndex: 0, sideId: 's', success: true };
    mon.pond!.aim = false;
    run.battle!.turn = 3;
    expect(pondShape(content, run, { kind: 'move', index: 0 }).events[0]!.text).toMatch(/bully/);
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
    setPondFlag(run, FLAGS.armed, 1);
    setPondFlag(run, flag, 1);
    const battle = withBattle(run, 'trainer');
    run.stage!.current = run.stage!.map.nodes[0]!.id;
    run.stage!.map.nodes[0]!.kind = 'champion';
    return { run, battle };
  };
  it('waits until you are losing, then Poliwrath and three Poliwhirl strike for three turns and never finish the foe', () => {
    const { run, battle } = champion('pp10', FLAGS.release);
    expect(pondAfterTurn(content, run)).toEqual([]);
    run.party[0]!.hp = Math.floor(maxHp(content, run.party[0]!) * 0.3);
    const foe = battle.enemyTeam[0]!;
    const full = maxHp(content, foe);
    const first = pondAfterTurn(content, run);
    expect(first.length).toBe(3);
    expect(foe.hp).toBe(full - Math.round(full * (POND_RETURN.wrathShare + 3 * POND_RETURN.whirlShare)));
    pondAfterTurn(content, run);
    pondAfterTurn(content, run);
    const afterThree = foe.hp;
    expect(pondAfterTurn(content, run)).toEqual([]);
    expect(foe.hp).toBe(afterThree);
    expect(pondFlag(run, FLAGS.fired)).toBe(1);
    foe.hp = 2;
    battle.storyEffects = [];
    expect(pondAfterTurn(content, run)).toEqual([]); // once only
  });
  it('Reconcile brings four Poliwhirl for four turns', () => {
    const { run, battle } = champion('pp11', FLAGS.reconcile);
    run.party[0]!.hp = 1;
    for (let i = 0; i < 6; i++) pondAfterTurn(content, run);
    const full = maxHp(content, battle.enemyTeam[0]!);
    const total = 4 * Math.round(full * (POND_RETURN.wrathShare + 4 * POND_RETURN.whirlShare));
    expect(battle.enemyTeam[0]!.hp).toBe(Math.max(1, full - total));
  });
  it('is not played in an ordinary fight', () => {
    const { run } = champion('pp12', FLAGS.release);
    run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.kind = 'battle' as never;
    run.party[0]!.hp = 1;
    expect(pondAfterTurn(content, run)).toEqual([]);
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
