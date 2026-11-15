// Catalog Overhaul Pack (legends): the Z Anomalies (co-legends-4.json): Island Trials, Sigils, Z-forms, Alphayena and Pack Call.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { abilityStatus } from '../../src/core/battle/abilities';
import { activeVariant } from '../../src/core/eventMemory';
import { chooseEvent } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { PokemonInstance, RunState } from '../../src/core/state';
import file from '../../src/data/events/co-legends-4.json';
import { content } from './helpers';

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'zt', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}
const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;

describe('Z Anomalies', () => {
  it('every species, item and room the file names exists', () => {
    const text = JSON.stringify(file);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"species":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"(?:item|loseItem)","id":"([^"]+)"/g)) expect(content.items.has(m[1]!) || content.catalog.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"kind":"addEvent","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!), m[1]).toBeDefined();
  });

  it('Z1: a Trial gives the Z-Ring; asking the Captain opens a calm fight for the crystal and the Totem\'s thanks', () => {
    const run = chooseEvent(content, at('island-trial-bug', 'zb'), 'x', 1).run;
    expect(run.inventory['z-ring']).toBeGreaterThan(0);
    expect(f(run, 'trial-bug-asked')).toBe(1);
    const fought = chooseEvent(content, at('co-z1-calm-bug', 'zc'), 'x', 0).run;
    expect(fought.battle!.calm).toMatchObject({ need: 5 });
    expect(fought.battle!.enemyTeam[0]!.speciesId).toBe('vikavolt');
  });

  it('Z1: the Swarm Totem lets you in when three Alphas are calmed; the Grand Trial pays the starter\'s crystal', () => {
    const bug = content.events.get('island-trial-bug')!;
    const run = at('island-trial-bug', 'zs', (r) => { r.story.flags['ev:calmed-alpha'] = 3; r.story.flags['ev:trials-met'] = 1; });
    expect(activeVariant(content, run, bug)?.id).toBe('alphas-know');
    const crystal = content.events.get('co-z1-crystal')!;
    expect(crystal.choices[0]!.branches).toHaveLength(8);
    expect(content.events.get('co-z1-crystal-3')!.choices[0]!.branches).toHaveLength(2);
  });

  it('Z2: the second sigil needs the first; both lit open the Z-form test', () => {
    expect(content.events.get('z-sigil-pool')!.requires).toContainEqual(expect.objectContaining({ key: 'sigil-lit' }));
    const run = chooseEvent(content, at('z-sigil-pool', 'zp', (r) => { r.story.flags['ev:sigil-lit'] = 1; }), 'x', 0).run;
    expect(f(run, 'sigil-pairs')).toBe(1);
    expect(f(run, 'sigil-lit')).toBe(0);
  });

  it('Z4: a kept pair of sigils turns the Abra\'s choice into a Z-Mega stone', () => {
    const run = chooseEvent(content, at('co-z4-grave', 'zg', (r) => { r.story.flags['ev:sigils-held'] = 1; }), 'x', 0).run;
    expect(run.inventory['alakazite-z']).toBe(1);
    expect(f(run, 'sigils-held')).toBe(0);
  });

  it('Z7: the Hold round is a survive-five-turns fight with the Alphayena; seven after a Noble was beaten', () => {
    const hold = content.events.get('co-z7-hold')!;
    expect(hold.choices[0]!.success.battle).toMatchObject({ rule: { surviveTurns: 5 } });
    const angry = at('co-z7-hold', 'zh', (r) => { r.story.flags['ev:noble-beaten'] = 1; });
    expect(activeVariant(content, angry, hold)?.addChoices[0]!.success.battle).toMatchObject({ rule: { surviveTurns: 7 } });
  });
});

describe('Pack Call', () => {
  const mon = (species: string, uid: string, ability: string, ...moves: string[]): PokemonInstance => {
    const m = createPokemon(content, species, 30, uid);
    m.fixedAbility = ability;
    m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    return m;
  };
  it('is supported; the next ally to switch in on turn 1 gains +1 Attack, and later switches do not', () => {
    expect(abilityStatus('pack-call')).toBe('supported');
    const pup = mon('poochyena', 'p1', 'pack-call', 'tackle');
    const mate = mon('mightyena', 'p2', 'intimidate', 'tackle');
    const third = mon('rattata', 'p3', 'run-away', 'tackle');
    const battle = createBattle('wild', [mon('caterpie', 'e1', 'shield-dust', 'string-shot')], 0, pup.uid);
    const ctx: BattleContext = { content, battle, party: [pup, mate, third], inventory: {}, rng: new Rng(hashSeed('pack')), captureRng: new Rng(hashSeed('pack-c')), catchMultiplier: 1 };
    const events = startBattle(ctx);
    expect(events.some((e) => e.type === 'ability' && e.ability === 'pack-call')).toBe(true);
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.atk).toBe(1);
    resolveTurn(ctx, { kind: 'switch', partyIndex: 2 });
    expect(battle.playerStages.atk).toBe(0);
  });
  it('a switch after turn 1 gets nothing', () => {
    const pup = mon('poochyena', 'p1', 'pack-call', 'tackle');
    const mate = mon('mightyena', 'p2', 'intimidate', 'tackle');
    const battle = createBattle('wild', [mon('caterpie', 'e1', 'shield-dust', 'string-shot')], 0, pup.uid);
    const ctx: BattleContext = { content, battle, party: [pup, mate], inventory: {}, rng: new Rng(hashSeed('pack2')), captureRng: new Rng(hashSeed('pack2-c')), catchMultiplier: 1 };
    startBattle(ctx);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.playerStages.atk).toBe(0);
    expect(battle.extra.packCall).toBeNull();
  });
});
