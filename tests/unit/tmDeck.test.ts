import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, mapActions, useMapAction } from '../../src/core/run';
import { content } from './helpers';

function runWith(deck: boolean) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'deck', archetypeId: 'red' }), 0));
  if (deck) applyCatalog(content, run, getCatalogEntry(content, 'tm-deck'), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('t')) });
  return run;
}

describe('TM Deck (S415)', () => {
  it('shows no action without the item', () => {
    expect(mapActions(content, runWith(false)).some((a) => a.kind === 'tmDeck')).toBe(false);
  });

  it('offers lead-type moves once per stage, as a teach decision', () => {
    const run = runWith(true);
    const action = mapActions(content, run).find((a) => a.kind === 'tmDeck')!;
    expect(action).toBeDefined();
    expect(action.problem).toBeNull();
    const { run: after } = useMapAction(content, run, 'tmDeck');
    const d = after.pending[0]!;
    expect(d.kind).toBe('teachMove');
    if (d.kind !== 'teachMove') return;
    expect(d.uid).toBe(run.party[0]!.uid);
    expect(d.moveIds.length).toBeGreaterThan(0);
    expect(d.moveIds.length).toBeLessThanOrEqual(3);
    expect(after.phase).toBe('decision');
    // Same state, same offer.
    expect(useMapAction(content, run, 'tmDeck').run.pending[0]).toEqual(d);
  });
});
