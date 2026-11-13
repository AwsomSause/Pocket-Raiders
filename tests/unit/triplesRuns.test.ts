// Triple battles in runs (Beta 0.6 T3): the Triples Only rule, ordinary trainers from a later region (balance.triples),
// whole fights through takeTurn, the run-level field helpers, and the Battle Factory's triple format.

import { describe, expect, it } from 'vitest';
import { autoCommands, monAt } from '../../src/core/battle/doubles';
import { fieldIndexes, isTriples } from '../../src/core/battle/triples';
import { fight } from '../../src/core/exhibition';
import { nextChoices } from '../../src/core/map';
import { getMinigame } from '../../src/core/minigame/flow';
import { gameModule } from '../../src/core/minigame/games';
import { hashSeed, Rng } from '../../src/core/rng';
import { makeRules, rulesProblem, STANDARD_CHOICE, triplesOnly } from '../../src/core/rules';
import { chooseStarter, createRun, startEncounter, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const withMods = (modifierIds: string[]) => ({ ...STANDARD_CHOICE, modifierIds });

/** A run in its third region, where trainers bring full teams. */
function runWith(seed: string, c = content, partySize = 3): RunState {
  const run = structuredClone(chooseStarter(c, createRun(c, { runId: seed, seed, archetypeId: 'red' }), 0));
  for (let i = 1; i < partySize; i++) run.party.push({ ...structuredClone(run.party[0]!), uid: `extra${i}` });
  run.regionIndex = 2;
  run.stage!.index = 4;
  run.encountersCompleted = 40;
  return run;
}
const trainerNode = (run: RunState) => ({ ...nextChoices(run.stage!)[0]!, kind: 'trainer' as const, harder: false });

describe('Triples Only rule', () => {
  it('exists, is mutually exclusive with Doubles Only, and stays closed until the battle screen draws triples', () => {
    expect(triplesOnly(makeRules(STANDARD_CHOICE))).toBe(false);
    expect(rulesProblem(withMods(['triples-only']))).toMatch(/not available yet/);
  });
  it('makes every trainer fight that can be a triple battle one', () => {
    const run = runWith('tri-only');
    run.rules = { ...run.rules, modifierIds: ['triples-only'] };
    expect(triplesOnly(run.rules)).toBe(true);
    startEncounter(content, run, trainerNode(run));
    expect(run.battle!.enemyTeam.length).toBeGreaterThanOrEqual(3);
    expect(isTriples(run.battle!)).toBe(true);
  });
  it('needs three healthy Pokémon on your side (boundary)', () => {
    const run = runWith('tri-two', content, 2);
    run.rules = { ...run.rules, modifierIds: ['triples-only'] };
    startEncounter(content, run, trainerNode(run));
    expect(isTriples(run.battle!)).toBe(false);
  });
});

describe('triple trainer battles from the balance', () => {
  const on = { ...content, balance: { ...content.balance, triples: { enabled: true, chance: 1, fromRegion: 0, bossIds: [] } } };
  const big = (r: RunState) => r.battle!.enemyTeam.length >= 3;

  it('are off by default, so runs play as before', () => {
    expect(content.balance.triples.enabled).toBe(false);
    const run = runWith('tri-off');
    startEncounter(content, run, trainerNode(run));
    expect(isTriples(run.battle!)).toBe(false);
  });
  it('start from fromRegion only, and the same seed always gives the same format', () => {
    const later = { ...on, balance: { ...on.balance, triples: { ...on.balance.triples, fromRegion: 3 } } };
    const run = runWith('tri-region', later);
    startEncounter(later, run, trainerNode(run));
    expect(isTriples(run.battle!)).toBe(false);
    for (const seed of ['t1', 't2', 't3', 't4', 't5', 't6']) {
      const a = runWith(seed, on);
      startEncounter(on, a, trainerNode(a));
      const b = runWith(seed, on);
      startEncounter(on, b, trainerNode(b));
      expect(isTriples(a.battle!)).toBe(isTriples(b.battle!));
      expect(big(a), seed).toBe(true);
      expect(isTriples(a.battle!), seed).toBe(true);
    }
  });
  it('a whole triple battle plays through takeTurn to an outcome, with the field helpers seeing all three', () => {
    let found = false;
    for (const seed of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']) {
      let run = runWith(seed, on, 4);
      for (const m of run.party) m.level = 100;
      startEncounter(on, run, trainerNode(run));
      if (!isTriples(run.battle!)) continue;
      found = true;
      expect(fieldIndexes(run.battle!, 'player')).toHaveLength(3);
      expect(fieldIndexes(run.battle!, 'enemy').length).toBeGreaterThanOrEqual(3);
      for (let turn = 0; turn < 80 && run.phase === 'battle' && !run.battle?.outcome; turn++) {
        const battle = run.battle!;
        const ctx = { battle, party: run.party, content: on };
        if (battle.needsSwitch) {
          const onField = [0, 1, 2].map((s) => monAt(ctx, 'player', s as 0 | 1 | 2)?.uid);
          const spare = run.party.findIndex((m) => m.hp > 0 && !onField.includes(m.uid));
          run = takeTurn(on, run, { kind: 'switch', partyIndex: spare }).run;
        } else run = takeTurn(on, run, { kind: 'double', commands: autoCommands(ctx) }).run;
      }
      expect(run.phase === 'battle' ? run.battle?.outcome : 'done').toBeTruthy();
      break;
    }
    expect(found).toBe(true);
  });
});

describe('field helpers', () => {
  it('fieldIndexes lists one, two or three Pokémon a side', () => {
    expect(fieldIndexes({ activeIndex: 2, enemyIndex: 0, doubles: undefined }, 'player')).toEqual([2]);
    const run = runWith('fi');
    startEncounter(content, run, trainerNode(run));
    expect(fieldIndexes(run.battle!, 'player')[0]).toBe(run.battle!.activeIndex);
  });
});

describe('Battle Factory triple format', () => {
  const team = (trainer: string, ids: string[]) => ({ trainer, fighters: ids.map((id) => ({ speciesId: id, name: id, level: 50 })) });
  it('an exhibition can be fought as a triple battle, the same every time', () => {
    const a = team('A', ['charizard', 'blastoise', 'venusaur']);
    const b = team('B', ['pikachu', 'snorlax', 'gengar']);
    const one = fight(content, 'seed', 'k', a, b, { triples: true });
    const two = fight(content, 'seed', 'k', a, b, { triples: true });
    expect(one).toEqual(two);
    expect(one.lines.length).toBeGreaterThan(2);
    expect(one.lines.at(-1)).toMatch(/wins the exhibition/);
  });
  it('the format can be switched before the first rental only, and a triple round is fought', () => {
    const def = getMinigame(content, 'battle-factory');
    const mod = gameModule('battle-factory');
    const s = mod.start(content, def.difficultyTiers[0]!.params, new Rng(hashSeed('factory')).state);
    const cell = () => mod.view(content, s).cells.find((c) => c.id === 'triples')!;
    expect(cell().label).toBe('Format: Single');
    mod.act(content, s, 'triples');
    expect(cell().label).toBe('Format: Triple');
    mod.act(content, s, 'r0');
    expect(cell().disabled).toBe(true);
    // Failure: no switching once a rental is chosen.
    mod.act(content, s, 'triples');
    expect(cell().label).toBe('Format: Triple');
    mod.act(content, s, 'r1');
    mod.act(content, s, 'r2');
    expect(mod.view(content, s).hud.join(' ')).toMatch(/Round won|Lost to/);
  });
});
