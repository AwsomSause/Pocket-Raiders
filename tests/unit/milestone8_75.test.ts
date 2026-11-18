// Milestone 8.75 part B: friendship. Starting values, gains and losses,
// Charisma, friendship evolutions and the save upgrade.

import { describe, expect, it } from 'vitest';
import { getArchetype } from '../../src/core/archetypes';
import { zeroAttributes, type Attributes } from '../../src/core/attributes';
import { evolutionTarget } from '../../src/core/evolution';
import { changeFriendship, friendshipHearts } from '../../src/core/friendship';
import { createPokemon } from '../../src/core/pokemon';
import { applyReward } from '../../src/core/rewards';
import { chooseStarter, createRun, debugReplaceEnemy, resolveDecision, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { CURRENT_VERSIONS, MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, toBattle } from './helpers';

const f = content.balance.friendship;
const newRun = (seed: string, attributes?: Partial<Attributes>): RunState =>
  chooseStarter(content, createRun(content, { runId: `r-${seed}`, seed, archetypeId: 'red', attributes: attributes && { ...zeroAttributes(), ...attributes } }), 0);

/** Plays the battle with the lead's first damaging move until it ends. */
function playOut(run: RunState) {
  let result;
  let guard = 0;
  while (run.phase === 'battle' && guard++ < 300) {
    const mon = run.party[run.battle!.activeIndex]!;
    const idx = mon.moves.findIndex((m) => m.pp > 0 && (content.moves.get(m.id)!.power ?? 0) > 0);
    result = takeTurn(content, run, { kind: 'move', index: idx >= 0 ? idx : 0 });
    run = result.run;
  }
  return result!;
}

describe('friendship values', () => {
  it('new Pokémon start at the base value and the starter higher', () => {
    expect(createPokemon(content, 'rattata', 10, 'x').friendship).toBe(f.base);
    expect(newRun('start').party[0]!.friendship).toBe(f.starter);
  });

  it('stays between 0 and the maximum; Charisma scales gains only', () => {
    const mon = createPokemon(content, 'rattata', 10, 'x');
    changeFriendship(content, mon, 1000);
    expect(mon.friendship).toBe(f.max);
    changeFriendship(content, mon, -1000);
    expect(mon.friendship).toBe(0);
    changeFriendship(content, mon, 5, 2);
    expect(mon.friendship).toBe(10);
    changeFriendship(content, mon, -1, 2);
    expect(mon.friendship).toBe(9);
  });

  it('shows as hearts, five only when it can evolve by friendship', () => {
    const mon = createPokemon(content, 'pichu', 5, 'x');
    mon.friendship = 0;
    expect(friendshipHearts(content, mon)).toBe(0);
    mon.friendship = f.evolveAt - 1;
    expect(friendshipHearts(content, mon)).toBe(4);
    mon.friendship = f.evolveAt;
    expect(friendshipHearts(content, mon)).toBe(5);
  });
});

describe('friendship evolutions', () => {
  it('happen on their own at the threshold (the Soothe Bell still works before it)', () => {
    const pichu = createPokemon(content, 'pichu', 5, 'x');
    pichu.friendship = f.evolveAt - 1;
    expect(evolutionTarget(content, pichu)).toBeNull();
    pichu.friendship = f.evolveAt;
    expect(evolutionTarget(content, pichu)).toBe('pikachu');
    const golbat = createPokemon(content, 'golbat', 30, 'g');
    golbat.friendship = f.max;
    expect(evolutionTarget(content, golbat)).toBe('crobat');
    const eevee = createPokemon(content, 'eevee', 10, 'e');
    eevee.friendship = f.max;
    expect(['espeon', 'umbreon', 'sylveon']).toContain(evolutionTarget(content, eevee));
  });

  it('a Pokémon that only evolves by stone does not evolve by friendship', () => {
    const pikachu = createPokemon(content, 'pikachu', 10, 'p');
    pikachu.friendship = f.max;
    expect(evolutionTarget(content, pikachu)).toBeNull();
  });

  it('a friendly Pichu evolves after winning a battle', () => {
    let run = toBattle(newRun('pichu'));
    const uid = run.party[0]!.uid;
    run.party[0] = { ...createPokemon(content, 'pichu', 40, uid), friendship: f.evolveAt - f.perBattleWon };
    run = debugReplaceEnemy(content, run, 'magikarp', 2);
    const result = playOut(run);
    expect(result.end?.outcome).toBe('win');
    // It waits as a decision (the evolution scene plays it; B could stop it), still a Pichu until then.
    expect(result.run.pending[0]).toEqual({ kind: 'evolve', uid, to: 'pikachu' });
    expect(result.run.party[0]!.speciesId).toBe('pichu');
    const after = resolveDecision(content, result.run, { kind: 'evolve', accept: true });
    expect(after.run.party[0]!.speciesId).toBe('pikachu');
    expect(after.message).toContain('Congratulations! Your Pichu evolved into Pikachu!');
    expect(after.run.log.counters.evolutions).toBe((result.run.log.counters.evolutions ?? 0) + 1);
    expect(after.run.pending.some((d) => d.kind === 'evolve')).toBe(false);
  });

  it('B stops the evolution: it stays a Pichu, and the next won battle offers it again', () => {
    let run = toBattle(newRun('pichu-stop'));
    const uid = run.party[0]!.uid;
    run.party[0] = { ...createPokemon(content, 'pichu', 40, uid), friendship: f.evolveAt - f.perBattleWon };
    run = debugReplaceEnemy(content, run, 'magikarp', 2);
    const result = playOut(run);
    const stopped = resolveDecision(content, result.run, { kind: 'evolve', accept: false });
    expect(stopped.message).toBe('Huh? Pichu stopped evolving!');
    expect(stopped.run.party[0]!.speciesId).toBe('pichu');
    expect(stopped.run.log.counters.evolutions ?? 0).toBe(result.run.log.counters.evolutions ?? 0);
    expect(stopped.run.pending.some((d) => d.kind === 'evolve')).toBe(false);
    expect(evolutionTarget(content, stopped.run.party[0]!)).toBe('pikachu');
    // Any other answer is refused: the decision needs a yes or a no.
    expect(() => resolveDecision(content, result.run, { kind: 'skipMove' })).toThrow('Let it evolve, or stop it');
  });

  it('an evolution that can no longer happen is dropped quietly (the Pokémon left the party)', () => {
    let run = toBattle(newRun('pichu-gone'));
    const uid = run.party[0]!.uid;
    run.party[0] = { ...createPokemon(content, 'pichu', 40, uid), friendship: f.evolveAt - f.perBattleWon };
    run = debugReplaceEnemy(content, run, 'magikarp', 2);
    const result = structuredClone(playOut(run).run);
    result.pending = [{ kind: 'evolve', uid: 'nobody', to: 'pikachu' }];
    const out = resolveDecision(content, result, { kind: 'evolve', accept: true });
    expect(out.message).toBe('');
    expect(out.run.party[0]!.speciesId).toBe('pichu');
  });
});

describe('friendship gains and losses', () => {
  it('winning a battle raises it for the participants, and Charisma makes it grow faster', () => {
    for (const [charisma, multiplier] of [[0, 1], [100, 2]] as const) {
      let run = toBattle(newRun(`win-${charisma}`, { charisma }));
      run.party[0] = createPokemon(content, run.party[0]!.speciesId, 60, run.party[0]!.uid);
      run = debugReplaceEnemy(content, run, 'magikarp', 2);
      const before = run.party[0]!.friendship;
      const result = playOut(run);
      expect(result.end?.outcome).toBe('win');
      const levels = result.events.filter((e) => e.type === 'levelUp').length;
      expect(levels).toBe(0);
      expect(result.run.party[0]!.friendship - before).toBe(Math.round(f.perBattleWon * multiplier));
    }
  });

  it('levelling up raises it', () => {
    let run = toBattle(newRun('level'));
    run = debugReplaceEnemy(content, run, 'magikarp', 15);
    run.party[0] = createPokemon(content, run.party[0]!.speciesId, 30, run.party[0]!.uid);
    run.stage!.index = 5; // the stage level cap must allow level 30
    run.party[0]!.xp -= 1; // one experience point short of level 30
    run.party[0]!.level = 29;
    const before = run.party[0]!.friendship;
    const result = playOut(run);
    const levels = result.events.filter((e) => e.type === 'levelUp' && e.uid === run.party[0]!.uid);
    expect(levels.length).toBeGreaterThan(0);
    expect(result.run.party[0]!.friendship - before).toBe(f.perLevel + f.perBattleWon);
  });

  it('fainting lowers it', () => {
    let run = toBattle(newRun('faint'));
    run = debugReplaceEnemy(content, run, 'mewtwo', 100);
    const result = playOut(run);
    expect(result.run.phase).toBe('over');
    expect(result.run.party[0]!.friendship).toBe(f.starter + f.perFaint);
  });

  it('vitamins raise it', () => {
    const run = newRun('vitamin');
    const before = run.party[0]!.friendship;
    applyReward(content, run, getArchetype(content, 'red'), 'protein');
    expect(run.party[0]!.friendship - before).toBe(f.perVitamin);
  });
});

describe('save upgrade', () => {
  it('gives every Pokémon in a v7 run a friendship value', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const run = toBattle(newRun('old'));
    const strip = ({ friendship: _f, ...m }: { friendship: number }) => m;
    const oldRun = { ...run, party: run.party.map(strip), battle: { ...run.battle!, enemyTeam: run.battle!.enemyTeam.map(strip) } };
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 7, savedAt: '', data: oldRun }));
    const result = saves.loadRun();
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.data.party[0]!.friendship).toBe(120);
      expect(result.data.battle!.enemyTeam[0]!.friendship).toBe(70);
    }
  });
});

describe('run save v46 (an evolution waiting as a decision)', () => {
  const won = (): RunState => {
    let run = toBattle(newRun('pichu-save'));
    const uid = run.party[0]!.uid;
    run.party[0] = { ...createPokemon(content, 'pichu', 40, uid), friendship: f.evolveAt - f.perBattleWon };
    run = debugReplaceEnemy(content, run, 'magikarp', 2);
    return playOut(run).run;
  };

  it('is the current run version; v45 runs load untouched', () => {
    expect(CURRENT_VERSIONS.run).toBe(46);
    const r = toBattle(newRun('v45'));
    expect(MIGRATIONS.run[45]!(r)).toBe(r);
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 45, savedAt: '', data: r }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.migratedFrom).toBe(45);
  });

  it('a waiting evolution survives save and reload, and applies once', () => {
    const run = won();
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(run);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(back.data.pending[0]).toEqual(run.pending[0]);
    const once = resolveDecision(content, back.data, { kind: 'evolve', accept: true }).run;
    expect(once.party[0]!.speciesId).toBe('pikachu');
    expect(once.pending.some((d) => d.kind === 'evolve')).toBe(false);
  });

  it('a save naming an unknown species to evolve into is refused, not loaded', () => {
    const run = won();
    run.pending[0] = { kind: 'evolve', uid: run.party[0]!.uid, to: 'not-a-pokemon' };
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: CURRENT_VERSIONS.run, savedAt: '', data: run }));
    expect(new SaveManager(storage, content).loadRun().status).not.toBe('ok');
  });
});
