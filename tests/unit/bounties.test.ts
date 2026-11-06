import { describe, expect, it } from 'vitest';
import { bountyObjective, noteBountyKills, stageBounty } from '../../src/core/bounties';
import { chooseStarter, createRun } from '../../src/core/run';
import { getSpecies } from '../../src/core/pokemon';
import { MemoryStorageProvider } from '../../src/save/storage';
import { SaveManager } from '../../src/save/saveManager';
import { content } from './helpers';

const fresh = () => chooseStarter(content, createRun(content, { runId: 'b', seed: 'bounty', archetypeId: 'red' }), 0);
const ofType = (type: string) => [...content.species.values()].find((s) => s.types.includes(type as never))!.id;
const other = (type: string) => [...content.species.values()].find((s) => !s.types.includes(type as never))!.id;

describe('Bounty Boards (S316)', () => {
  it('posts one bounty per stage, the same every time', () => {
    const run = fresh();
    const a = stageBounty(content, run)!;
    expect(a).toEqual(stageBounty(content, run));
    expect(a.target).toBe(content.balance.luck.bounty.target);
    expect(bountyObjective(content, run)!.done).toBe(false);
  });
  it('counts only the bounty type, pays once at the target, never twice', () => {
    const run = fresh();
    const b = stageBounty(content, run)!;
    expect(noteBountyKills(content, run, [{ speciesId: other(b.type) }])).toBeNull();
    expect(run.log.counters[`bounty.${b.key}`] ?? 0).toBe(0);
    const money = run.money;
    let paid: string | null = null;
    for (let i = 0; i < b.target; i++) paid = noteBountyKills(content, run, [{ speciesId: ofType(b.type) }]);
    expect(paid).toBe(b.item);
    expect(run.money).toBe(money + b.money);
    expect(bountyObjective(content, run)!.done).toBe(true);
    expect(noteBountyKills(content, run, [{ speciesId: ofType(b.type) }])).toBeNull();
    expect(run.money).toBe(money + b.money);
    expect(getSpecies(content, ofType(b.type)).types).toContain(b.type);
  });
  it('progress survives a save and reload', () => {
    const saves = new SaveManager(new MemoryStorageProvider(), content);
    const run = fresh();
    const b = stageBounty(content, run)!;
    noteBountyKills(content, run, [{ speciesId: ofType(b.type) }]);
    saves.saveRun(run);
    const loaded = saves.loadRun();
    expect(loaded.status === 'ok' && loaded.data.log.counters[`bounty.${b.key}`]).toBe(1);
  });
});
