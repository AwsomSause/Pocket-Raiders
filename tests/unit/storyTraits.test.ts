// Beta 0.7 E9: team-wide story traits (Hype Man, Reluctant Hand). Off unless the run's `storyTraits` setting is on.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { assignStoryTraits, storyHype, storyNoCrit, storyTraitOf, type StoryTraits } from '../../src/core/expansion/storyTraits';
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
