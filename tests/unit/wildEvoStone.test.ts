// Beta 0.6 B9: a wild Pokémon that evolves by a stone can stand beside one; win the fight and you take it.

import { describe, expect, it } from 'vitest';
import { wildStoneFor } from '../../src/core/evoEncounter';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const start = (seed: string, on: boolean): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(on ? { expansion: { evolutionEncounters: true } } : {}) }), 0);

describe('wild pre-evolutions meet their stone (B9)', () => {
  it('needs the setting, a plain stone evolution, and is decided by its own hash', () => {
    const cfg = content.balance.evolutionEncounter;
    const old = cfg.wildStoneChance;
    try {
      cfg.wildStoneChance = 1;
      expect(wildStoneFor(content, start('w0', true), 'growlithe', 'k')).toBe('fire-stone');
      expect(wildStoneFor(content, start('w0', false), 'growlithe', 'k')).toBeNull();
      expect(wildStoneFor(content, start('w0', true), 'pidgey', 'k')).toBeNull(); // level evolution, no stone
      expect(wildStoneFor(content, start('w0', true), 'pikachu', 'k')).toBe('thunder-stone'); // the plain branch, not the Alolan one
      cfg.wildStoneChance = 0;
      expect(wildStoneFor(content, start('w0', true), 'growlithe', 'k')).toBeNull();
      cfg.wildStoneChance = 0.5;
      const a = wildStoneFor(content, start('w1', true), 'growlithe', 'same');
      expect(wildStoneFor(content, start('w1', true), 'growlithe', 'same')).toBe(a);
    } finally {
      cfg.wildStoneChance = old;
    }
  });

  it('beating the Pokémon gives the stone once', () => {
    const cfg = content.balance.evolutionEncounter;
    const old = cfg.wildStoneChance;
    try {
      cfg.wildStoneChance = 1;
      // Species depend on the seed, so look for a first fight that has a stone beside it.
      for (let i = 0; i < 400; i++) {
        let run = toBattle(start(`wes-${i}`, true));
        if (!run.battle?.evoStone) continue;
        const stone = run.battle.evoStone;
        const before = run.inventory[stone] ?? 0;
        run.battle.enemyTeam[0]!.hp = 1;
        run.party[0]!.hp = run.party[0]!.hp;
        for (let t = 0; t < 12 && run.battle && run.battle.outcome === null; t++) run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
        if (run.inventory[stone] === undefined) continue; // the fight was lost or fled: try another seed
        expect(run.inventory[stone]).toBe(before + 1);
        return;
      }
      throw new Error('no seed produced a wild fight with a stone');
    } finally {
      cfg.wildStoneChance = old;
    }
  }, 60_000);
});
