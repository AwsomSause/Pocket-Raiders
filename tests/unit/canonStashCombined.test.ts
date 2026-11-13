// Flight North (Vermilion) and the Fighting Tournament / Labyrinth (Saffron) both keep a party stash in run.expansion.canon.stash.
// They must never undo each other: each restore only touches its own stash.
import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, startEncounter } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { restoreStash as restoreFlight, stashParty } from '../../src/core/expansion/canonRun';
import { applyCanonEffect, leaveCanonStash, restoreStash as restoreSaffron } from '../../src/core/expansion/canonSaffron';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const begin = (seed: string, species: string[]) => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
  run.party = species.map((s, i) => { const m = createPokemon(content, s, 30, `t${i}`); m.hp = 999; return m; });
  return run;
};
const names = (run: ReturnType<typeof begin>) => run.party.map((m) => m.speciesId);
const enterTournament = (run: ReturnType<typeof begin>) => applyCanonEffect(content, run, { kind: 'canon', action: 'solo', species: ['mankey', 'primeape'] } as never, new Rng(hashSeed('c')));

describe('Flight North and the Saffron stash do not undo each other', () => {
  it('a Saffron stash survives Flight North\'s restore (the one startEncounter and pseudoLost call)', () => {
    const run = begin('S1', ['mankey', 'pikachu', 'eevee']);
    enterTournament(run);
    expect(names(run)).toEqual(['mankey']);
    expect(restoreFlight(run)).toBe(false);
    expect(names(run)).toEqual(['mankey']); // not swapped for the stash
    expect(run.expansion!.canon!.stash).toHaveLength(2);
    expect(restoreSaffron(run)).toBe(true);
    expect(names(run)).toEqual(['mankey', 'pikachu', 'eevee']);
  });
  it('Flight North cannot stash on top of a Saffron stash', () => {
    const run = begin('S2', ['mankey', 'pikachu', 'eevee']);
    enterTournament(run);
    expect(stashParty(run)).toBe(false);
    expect(names(run)).toEqual(['mankey']);
  });
  it('a Flight North stash survives Saffron\'s restore and leave', () => {
    const run = begin('S3', ['mankey', 'pikachu', 'eevee']);
    expect(stashParty(run)).toBe(true);
    expect(run.party).toHaveLength(0);
    expect(restoreSaffron(run)).toBe(false);
    leaveCanonStash(run);
    expect(run.expansion!.canon!.stash).toHaveLength(3);
    expect(restoreFlight(run)).toBe(true);
    expect(names(run)).toEqual(['mankey', 'pikachu', 'eevee']);
    expect(run.expansion!.canon!.stash).toBeUndefined();
  });
  it('stepping onto an ordinary node while a Saffron stash is open leaves the stash alone, and the run still parses', () => {
    const run = begin('S4', ['mankey', 'pikachu', 'eevee']);
    enterTournament(run);
    const node = run.stage!.map.nodes.find((n) => n.kind === 'wild' || n.kind === 'trainer')!;
    startEncounter(content, run, node);
    expect(run.party.map((m) => m.uid)).toContain('t0');
    expect(RunStateSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
    expect(run.expansion!.canon!.solo).toBeDefined();
    expect(run.expansion!.canon!.stash).toHaveLength(2);
  });
});
