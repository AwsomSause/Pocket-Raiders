import { beforeEach, describe, expect, it } from 'vitest';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { CATEGORY_SITUATION, ensureTrainerLines, packPool, packTrainerFor, resetTrainerLines } from '../../src/core/overhaul/trainerLines';
import { DRAMA_CATEGORIES_FOR_TEST } from './helpers-trainer-lines';
import { openingDrama } from '../../src/core/drama';
import { createBattle } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function bossRun(leaderId: string | null) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'tl', seed: 'tl', archetypeId: 'red' }), 0));
  run.battle = createBattle('trainer', [createPokemon(content, 'onix', 12, 'e1')], 0, run.party[0]!.uid, { classId: leaderId ? 'gym-leader' : 'youngster', name: 'Brock', leaderId });
  run.battle.ai = 1;
  run.phase = 'battle';
  return run;
}

describe('overhaul trainer lines', () => {
  beforeEach(() => resetTrainerLines());
  it('is quiet until the lines load, then serves lines for a known boss', async () => {
    expect(packPool('brock', 'opening')).toBeNull();
    await ensureTrainerLines();
    const pool = packPool('brock', 'defeat');
    expect(pool?.length).toBeGreaterThan(0);
    expect(pool!.every((l) => l.length >= 8 && !/[{}]/.test(l))).toBe(true);
  });
  it('unknown boss and unmapped category give null', async () => {
    await ensureTrainerLines();
    expect(packPool('nobody-here', 'opening')).toBeNull();
    expect(packPool('brock', 'command')).toBeNull();
    expect(packPool(null, 'opening')).toBeNull();
    expect(packTrainerFor('')).toBeNull();
  });
  it('maps only real categories', () => {
    for (const c of Object.keys(CATEGORY_SITUATION)) expect(DRAMA_CATEGORIES_FOR_TEST).toContain(c);
  });
  it('some pack trainers have opening lines', async () => {
    await ensureTrainerLines();
    const n = overhaulCatalogs().major_trainers.entries.filter((t) => t.bossId && packPool(t.bossId, 'opening')).length;
    expect(n).toBeGreaterThan(0);
  });
  it('the drama planner uses the pack lines for a boss once loaded, and its own lines before', async () => {
    const before = openingDrama(content, bossRun('brock'));
    await ensureTrainerLines();
    const run = bossRun('brock');
    const after = openingDrama(content, run);
    expect(after).toHaveLength(before.length);
    expect(after[0]!.text).not.toBe('');
    expect(packPool('brock', 'opening')).toContain(after[0]!.text);
    // an ordinary trainer is untouched
    const plain = openingDrama(content, bossRun(null));
    expect(plain[0]!.text).toBeTruthy();
  });
});
