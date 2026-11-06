import { describe, expect, it } from 'vitest';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { moveLore, moveRank, recordMoveMastery, topMoves } from '../../src/core/moveMastery';
import { chooseStarter, createRun } from '../../src/core/run';
import { STANDARD_CHOICE } from '../../src/core/rules';
import type { Profile } from '../../src/core/state';
import { content } from './helpers';

const profile = () => ({ claims: {}, researchPoints: 0 }) as unknown as Profile;

describe('Move Mastery (#107)', () => {
  it('ranks by uses', () => {
    expect([0, 9, 10, 30, 100].map(moveRank)).toEqual(['none', 'none', 'bronze', 'silver', 'gold']);
  });
  it('pays each rank once and never twice for the same uses', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'mm', seed: 'mm', archetypeId: 'red', rules: STANDARD_CHOICE }), 0);
    const h = Object.values(run.story.histories)[0]!;
    const move = run.party[0]!.moves[0]!.id;
    h.moves = { [move]: 30, 'not-a-move': 99 };
    const p = profile();
    const ups = recordMoveMastery(content, p, run, 't');
    expect(ups.map((u) => u.rank)).toEqual(['bronze', 'silver']);
    expect(p.researchPoints).toBe(7);
    expect(p.moveUses).toEqual({ [move]: 30 });
    h.moves = { [move]: 1 };
    expect(recordMoveMastery(content, p, run, 't2')).toEqual([]);
    expect(p.researchPoints).toBe(7);
    expect(topMoves(p)[0]).toMatchObject({ moveId: move, uses: 31, rank: 'silver' });
  });
  it('lore grows with rank and adds no power', () => {
    const flavoured = new Set(overhaulCatalogs().move_mastery_ideas.entries.map((e) => e.moveId));
    const move = [...content.moves.keys()].find((m) => !flavoured.has(m))!;
    expect(moveLore(content, move, 'none')).toEqual([]);
    expect(moveLore(content, move, 'bronze')).toHaveLength(1);
    expect(moveLore(content, move, 'silver')).toHaveLength(2);
    expect(moveLore(content, move, 'gold')).toHaveLength(3);
  });
  it('the pack adds a flavour line for its moves: experienced below gold, mastered at gold', () => {
    const e = overhaulCatalogs().move_mastery_ideas.entries.find((x) => x.moveId && content.moves.has(x.moveId))!;
    const base = (r: 'bronze' | 'gold') => moveLore(content, e.moveId!, r);
    expect(base('bronze').at(-1)).toBe(e.experienced.replaceAll('{name}', 'Your Pokémon'));
    expect(base('gold').at(-1)).toBe(e.mastered.replaceAll('{name}', 'Your Pokémon'));
    expect(base('gold').join(' ')).not.toContain('{name}');
  });
});
