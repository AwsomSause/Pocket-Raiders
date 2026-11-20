// Save audit (2026-11-19, Kice: "saves are breaking more and more"): every event choice, every item, every
// Pokémon and every ability is played once and the run is saved and loaded again. Nothing may throw, and every
// save must load as it was written: not rejected, not repaired.
import { describe, expect, it } from 'vitest';
import { visibleChoices } from '../../src/core/eventMemory';
import { chooseEvent, giveItem } from '../../src/core/events';
import { addItem } from '../../src/core/items';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { PSEUDO, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { content, toBattle } from './helpers';

const base = chooseStarter(content, createRun(content, { runId: 'sweep', seed: 'sweep', archetypeId: 'red' }), 0);

function atEvent(eventId: string): RunState {
  const run = structuredClone(base);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'sweep', kind: 'event', used: false, eventId });
  run.money = 5000;
  return run;
}

/** Saves and loads the run; null when it comes back clean. */
function roundTrip(run: RunState): string | null {
  const storage = new MemoryStorageProvider();
  const written = new SaveManager(storage, content).saveRun(run);
  if (!written.ok) return `write: ${written.reason}`;
  const loaded = new SaveManager(storage, content).loadRun();
  if (loaded.status !== 'ok') return `load ${loaded.status}: ${'reason' in loaded ? loaded.reason : ''}`;
  if (loaded.repaired?.length) return `repaired: ${loaded.repaired.join('; ')}`;
  return null;
}

/** A choice the player can't take right now (the scene shows it locked) is not a bug. */
const LOCKED = /^(Needs|Not yet|Only|No team has noticed|Your rival has a team)/;

describe('save sweep', () => {
  it('every event choice plays and its run saves and loads clean', () => {
    const problems: string[] = [];
    let played = 0;
    for (const event of content.events.values()) {
      const choices = visibleChoices(content, atEvent(event.id), event);
      choices.forEach((_, i) => {
        let run: RunState;
        try {
          run = chooseEvent(content, atEvent(event.id), 'sweep', i).run;
        } catch (e) {
          const message = (e as Error).message;
          if (!LOCKED.test(message)) problems.push(`${event.id} #${i} threw: ${message}`);
          return;
        }
        played++;
        const problem = roundTrip(run);
        if (problem) problems.push(`${event.id} #${i}: ${problem}`);
      });
    }
    expect(played).toBeGreaterThan(15000);
    expect(problems).toEqual([]);
  }, 900_000);

  it('every item, given by an event or dropped straight in the Bag, saves and loads', () => {
    const problems: string[] = [];
    for (const id of [...content.items.keys(), ...content.catalog.keys()]) {
      const given = structuredClone(base);
      try {
        giveItem(content, given, id, 2, new Rng(hashSeed(id)));
      } catch (e) {
        problems.push(`${id} threw: ${(e as Error).message}`);
        continue;
      }
      const a = roundTrip(given);
      if (a) problems.push(`${id} given: ${a}`);
      const raw = structuredClone(base);
      addItem(raw.inventory, id, 1);
      const b = roundTrip(raw);
      if (b) problems.push(`${id} in the Bag: ${b}`);
    }
    expect(problems).toEqual([]);
  }, 900_000);

  it('every Pokémon and every ability fights three turns and the battle saves and loads', () => {
    const problems: string[] = [];
    const start = toBattle(structuredClone(base));
    expect(start.phase).toBe('battle');
    const abilities = [...content.abilities.keys()];
    let k = 0;
    for (const speciesId of content.species.keys()) {
      let run = structuredClone(start);
      const mon = createPokemon(content, speciesId, 50, run.party[0]!.uid);
      mon.fixedAbility = abilities[k++ % abilities.length];
      run.party[0] = mon;
      const foeUid = run.battle!.enemyTeam[run.battle!.enemyIndex]!.uid;
      const foe = createPokemon(content, speciesId, 50, foeUid);
      foe.fixedAbility = abilities[k++ % abilities.length];
      run.battle!.enemyTeam[run.battle!.enemyIndex] = foe;
      try {
        for (let t = 0; t < 3 && run.phase === 'battle'; t++) {
          const lead = run.party[run.battle!.activeIndex]!;
          const index = lead.moves.findIndex((m) => m.pp > 0);
          if (index < 0) break;
          run = takeTurn(content, run, { kind: 'move', index }).run;
        }
      } catch (e) {
        problems.push(`${speciesId} [${mon.fixedAbility} vs ${foe.fixedAbility}] threw: ${(e as Error).message}`);
        continue;
      }
      const problem = roundTrip(run);
      if (problem) problems.push(`${speciesId} [${mon.fixedAbility}]: ${problem}`);
    }
    expect(k).toBeGreaterThanOrEqual(abilities.length);
    expect(problems).toEqual([]);
  }, 900_000);

  it('every pseudo-stage uses a stage theme that exists', () => {
    expect([...PSEUDO.records, ...PSEUDO_CHAINS].filter((r) => !content.themes.has(r.themeId)).map((r) => `${r.id}: ${r.themeId}`)).toEqual([]);
  });
});
