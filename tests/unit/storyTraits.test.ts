// Beta 0.7 E9: team-wide story traits (Hype Man, Reluctant Hand). Off unless the run's `storyTraits` setting is on.

import { describe, expect, it } from 'vitest';
import { createBattle, eventRuleEnd, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { assignStoryTraits, storyHype, storyNoCrit, storyOldHabits, OLD_HABITS_POWER, storyTraitOf, type StoryTraits } from '../../src/core/expansion/storyTraits';
import { ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function duel(trait: 'hype-man' | 'reluctant-hand' | null, eMove: string, enemyIndex = 0, seed = 'st') {
  const player = createPokemon(content, 'snorlax', 100, 'p');
  const enemies = ['machop', 'machop'].map((sp, i) => createPokemon(content, sp, 40, `e${i}`));
  const mv = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
  player.moves = [mv('splash')];
  for (const e of enemies) e.moves = [mv(eMove)];
  const battle = createBattle('trainer', enemies, 0, player.uid);
  battle.ai = 0;
  battle.enemyIndex = enemyIndex;
  if (trait) assignStoryTraits(battle.extra.storyTraits, enemies, `st.${trait}`, true);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed('stc')), catchMultiplier: 1 };
  const events = resolveTurn(ctx, { kind: 'move', index: 0 });
  return events.reduce((n, e) => (e.type === 'damage' && e.side === 'player' ? n + e.amount : n), 0);
}

describe('story traits', () => {
  it('only the named st.* ids count, and only when the setting is on', () => {
    expect(storyTraitOf('st.hype-man')).toBe('hype-man');
    expect(storyTraitOf('sv.rocket.roadblock')).toBeNull();
    const store: StoryTraits = {};
    expect(assignStoryTraits(store, [{ uid: 'a' }], 'st.hype-man', false)).toBe(0);
    expect(store).toEqual({});
    expect(assignStoryTraits(store, [{ uid: 'a' }, { uid: 'b' }], 'st.reluctant-hand', true)).toBe(2);
    expect(storyNoCrit(store, 'b')).toBe(true);
    expect(storyNoCrit(store, 'z')).toBe(false);
  });
  it('Hype Man needs a beaten teammate and lasts one turn', () => {
    const s: StoryTraits = { a: { trait: 'hype-man' } };
    expect(storyHype(s, 'a', 0, 1)).toBe(1);
    expect(storyHype(s, 'a', 1, 3)).toBe(1.2);
    expect(storyHype(s, 'a', 1, 3)).toBe(1.2);
    expect(storyHype(s, 'a', 1, 4)).toBe(1);
  });
  it('Reluctant Hand turns a guaranteed critical hit into a plain hit', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => `rh${i}`);
    const plain = Math.max(...seeds.map((sd) => duel(null, 'storm-throw', 0, sd)));
    const held = Math.max(...seeds.map((sd) => duel('reluctant-hand', 'storm-throw', 0, sd)));
    expect(held).toBeGreaterThan(0);
    expect(held).toBeLessThan(plain);
  });
  it('Hype Man boosts the second foe\'s first move, not the first foe\'s', () => {
    expect(duel('hype-man', 'tackle', 0)).toBe(duel(null, 'tackle', 0));
    expect(duel('hype-man', 'tackle', 1)).toBeGreaterThan(duel(null, 'tackle', 1));
  });
  it('is off by default and saves cleanly (old battles without the field still load)', () => {
    expect(ExpansionSettingsSchema.parse({}).storyTraits).toBe(false);
    const b = createBattle('trainer', [createPokemon(content, 'machop', 5, 'x')], 0, 'p');
    const old = JSON.parse(JSON.stringify(b));
    delete old.extra.storyTraits;
    expect(BattleStateSchema.parse(old).extra.storyTraits).toEqual({});
    const r = chooseStarter(content, createRun(content, { runId: 'st1', seed: 'st1', archetypeId: 'red', expansion: { storyTraits: true } }), 0);
    expect(r.expansion?.storyTraits).toBe(true);
    expect(chooseStarter(content, createRun(content, { runId: 'st2', seed: 'st2', archetypeId: 'red' }), 0).expansion?.storyTraits).toBeUndefined();
  });
});

describe('Old Habits', () => {
  it('hits harder only once the target is under half HP, and only for the named foe', () => {
    const s: StoryTraits = { a: { trait: 'old-habits' } };
    expect(storyOldHabits(s, 'a', 60, 100)).toBe(1);
    expect(storyOldHabits(s, 'a', 50, 100)).toBe(1);
    expect(storyOldHabits(s, 'a', 49, 100)).toBe(OLD_HABITS_POWER);
    expect(storyOldHabits(s, 'b', 10, 100)).toBe(1);
  });
  it('is read by Paldea\'s Old Hallway fight and off without the setting', () => {
    const s: StoryTraits = {};
    expect(assignStoryTraits(s, [{ uid: 'a' }], 'st.old-habits', false)).toBe(0);
    expect(assignStoryTraits(s, [{ uid: 'a' }], 'st.old-habits', true)).toBe(1);
  });
});

describe('forced-switch rule', () => {
  const mk = (turn: number, benchHp: number, forceSwitch?: number) => {
    const a = createPokemon(content, 'snorlax', 50, 'a');
    const b = createPokemon(content, 'machop', 50, 'b');
    b.hp = benchHp;
    const battle = createBattle('trainer', [createPokemon(content, 'machop', 40, 'e')], 0, a.uid);
    battle.turn = turn;
    battle.eventRule = forceSwitch ? { forceSwitch } : undefined;
    const events: never[] = [];
    eventRuleEnd(battle, events, [a, b], content);
    return { battle, events };
  };
  it('drives the player out every Nth turn when a healthy Pokémon waits on the bench', () => {
    expect(mk(3, 10, 3).battle.needsSwitch).toBe(true);
    expect(mk(2, 10, 3).battle.needsSwitch).toBe(false);
    expect(mk(3, 0, 3).battle.needsSwitch).toBe(false);
    expect(mk(3, 10).battle.needsSwitch).toBe(false);
  });
});
