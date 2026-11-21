// Overhaul slice 8: the battle Info panel shows type matchups, transformations and revealed abilities, and never leaks hidden foes.
import { describe, expect, it } from 'vitest';
import { battleConditions, foeIdentityHidden } from '../../src/core/battle/conditions';
import { currentEnemy } from '../../src/core/state';
import { chooseStarter, createRun } from '../../src/core/run';
import { createPokemon } from '../../src/core/pokemon';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

function battleRun(): RunState {
  const run = toBattle(chooseStarter(content, createRun(content, { runId: 'r-info', seed: 'info', archetypeId: 'red', campaignId: 'full' }), 0));
  const mon = createPokemon(content, 'charmander', 10, run.party[0]!.uid);
  mon.moves = [{ id: 'ember', pp: 25 }, { id: 'growl', pp: 40 }, { id: 'tackle', pp: 0 }];
  run.party[0] = mon;
  return run;
}
const withFoe = (run: RunState, speciesId: string) => {
  const foe = currentEnemy(run.battle!);
  foe.speciesId = speciesId;
};

describe('battle Info: type effectiveness', () => {
  it('lists each damaging move against the foe, skipping status moves, and marks empty PP', () => {
    const run = battleRun();
    withFoe(run, 'bulbasaur');
    const c = battleConditions(content, run);
    expect(c.moves.some((l) => l.startsWith('Ember: super effective'))).toBe(true);
    expect(c.moves.some((l) => l.includes('Growl'))).toBe(false);
    expect(c.moves.find((l) => l.startsWith('Tackle'))).toContain('(no PP)');
  });
  it('says "no effect" for an immune foe and "not very effective" for a resisting one', () => {
    const run = battleRun();
    withFoe(run, 'gastly');
    expect(battleConditions(content, run).moves.find((l) => l.startsWith('Tackle'))).toContain('no effect');
    withFoe(run, 'squirtle');
    expect(battleConditions(content, run).moves.find((l) => l.startsWith('Ember'))).toContain('not very effective');
  });
  it('uses the Tera type once the foe has Terastallized', () => {
    const run = battleRun();
    withFoe(run, 'bulbasaur');
    run.battle!.transform.teraTypes[currentEnemy(run.battle!).uid] = 'water';
    const c = battleConditions(content, run);
    expect(c.moves.find((l) => l.startsWith('Ember'))).toContain('not very effective');
    expect(c.foe.join('\n')).toContain('Terastallized: Water');
  });
});

describe('battle Info: hidden information stays hidden', () => {
  it('a hidden foe shows no name, type, moves matchup or catch odds until it has moved', () => {
    const run = battleRun();
    withFoe(run, 'bulbasaur');
    run.battle!.eventRule = { hiddenFoe: true } as never;
    expect(foeIdentityHidden(run.battle!)).toBe(true);
    const c = battleConditions(content, run);
    const text = c.foe.join('\n');
    expect(text).not.toMatch(/Bulbasaur|Grass|Poison|Catch odds/);
    expect(c.moves).toEqual([]);
    run.battle!.enemyVolatile.lastMove = 'tackle';
    expect(battleConditions(content, run).foe.join('\n')).toContain('Bulbasaur');
  });
  it('an Illusion shows the species it copies, not the real one', () => {
    const run = battleRun();
    withFoe(run, 'zoroark');
    run.battle!.enemyVolatile.illusion = 'pikachu';
    const text = battleConditions(content, run).foe.join('\n');
    expect(text).toContain('Pikachu');
    expect(text).not.toContain('Zoroark');
  });
  it('the foe ability and item show only after they were seen', () => {
    const run = battleRun();
    withFoe(run, 'bulbasaur');
    expect(battleConditions(content, run).foe.join('\n')).toContain('Ability: not shown yet');
    const seen = battleConditions(content, run, { ability: 'overgrow', items: ['oran-berry'] }).foe.join('\n');
    expect(seen).toMatch(/Ability: Overgrow/);
    expect(seen).toContain('Held item seen:');
  });
});

describe('battle Info: your side', () => {
  it('shows your ability, your transformation state and a Hyper move that is ready', () => {
    const run = battleRun();
    const mon = run.party[run.battle!.activeIndex]!;
    mon.moves[1]!.hyper = true;
    run.battle!.transform.teraTypes[mon.uid] = 'fire';
    run.battle!.transform.used.player = ['tera'];
    const text = battleConditions(content, run).yours.join('\n');
    expect(text).toContain('Ability:');
    expect(text).toContain('Terastallized: Fire');
    expect(text).toContain('You have used: Terastallization');
    expect(text).toContain('Hyper move ready:');
  });
  it('is pure: building the lines changes nothing', () => {
    const run = battleRun();
    const before = JSON.stringify(run);
    battleConditions(content, run, { ability: 'blaze' });
    expect(JSON.stringify(run)).toBe(before);
  });
});

describe('Pocket Battle Info page and move card (structured)', () => {
  it('both sides with stat stages, four field cards, the foe Ability hidden until shown; looking changes nothing', async () => {
    const { battleInfo } = await import('../../src/core/presentation/battleInfo');
    const run = battleRun();
    withFoe(run, 'bulbasaur');
    run.battle!.enemyStages.atk = 2;
    run.battle!.weather = { id: 'rain', turns: 3 } as NonNullable<RunState['battle']>['weather'];
    const before = JSON.stringify(run);
    const info = battleInfo(content, run);
    expect(info.foe?.name).toBe('Bulbasaur');
    expect(info.foe?.ability).toBe('Not shown yet');
    expect(info.foe?.stages[0]).toEqual(['Atk', 2]);
    expect(info.me?.name).toBe('Charmander');
    expect(info.mid).toHaveLength(4);
    expect(info.mid[0]).toMatchObject({ em: 'Weather', b: 'Rain' });
    expect(info.mid[0]!.span).toContain('3 turns left');
    expect(battleInfo(content, run, { ability: 'overgrow' }).foe?.ability).toBe('Overgrow');
    expect(JSON.stringify(run)).toBe(before);
  });
  it('the move card: numbers, the type multiplier, same-type bonus; a status move or a hidden foe has no matchup', async () => {
    const { moveInfo } = await import('../../src/core/presentation/battleInfo');
    const run = battleRun();
    withFoe(run, 'bulbasaur');
    const ember = moveInfo(content, run, 0, () => 'text')!;
    expect(ember.name).toBe('Ember');
    expect(ember.vs).toMatchObject({ foe: 'Bulbasaur', mult: 2, stab: true });
    expect(moveInfo(content, run, 1, () => '')!.vs).toBeNull();
    expect(moveInfo(content, run, 9, () => '')).toBeNull();
    run.battle!.eventRule = { ...(run.battle!.eventRule ?? {}), hiddenFoe: true } as NonNullable<RunState['battle']>['eventRule'];
    expect(moveInfo(content, run, 0, () => '')!.vs).toBeNull();
    expect((await import('../../src/core/presentation/battleInfo')).battleInfo(content, run).foe).toBeNull();
  });
});
