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
