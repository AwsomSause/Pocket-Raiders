import { describe, expect, it } from 'vitest';
import { chooseEvent, eventView } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { eventView as drawEvent, type EventModel } from '../../src/ui/redux/screens/event';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { content } from './helpers';

// The Honest Trade Card: before a swap is committed, each Pokémon the player could give says what comes back.
// A swap from a fixed table names it; a rolled swap says it is not known. What the card says must be what happens.

const SWAP = 'cs-kanto-vermilion-maiden-swap';
const begin = (seed: string) => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
  run.party.push(createPokemon(content, 'pidgey', 5, 'p'));
  return run;
};
const swapEffect = () => {
  const e = content.events.get(SWAP)!.choices[0]!.success.effects.find((f) => f.kind === 'tradeFor');
  if (!e || e.kind !== 'tradeFor') throw new Error('the swap event has no tradeFor effect');
  return e;
};
/** Runs `fn` with a fixed table on the swap, then puts the event back as it was. */
function withTable<T>(table: Record<string, string>, fn: () => T): T {
  const e = swapEffect();
  const before = e.table;
  e.table = table;
  try { return fn(); } finally { e.table = before; }
}

describe('Honest Trade Card (core)', () => {
  it('a rolled swap does not claim to know what comes back', () => {
    const { run, sideId } = debugForceEvent(content, begin('TC1'), SWAP);
    const picks = eventView(content, run, sideId).choices[0]!.tradePicks!;
    expect(picks.length).toBeGreaterThanOrEqual(2);
    for (const p of picks) expect(p.gets).toBeNull();
  });

  it('a table swap names what comes back, and that is what the player gets', () => {
    withTable({ pidgey: 'abra' }, () => {
      const { run, sideId } = debugForceEvent(content, begin('TC2'), SWAP);
      const picks = eventView(content, run, sideId).choices[0]!.tradePicks!;
      const pidgey = picks.find((p) => p.label.startsWith('Pidgey'))!;
      expect(pidgey.gets).toBe('abra');
      // The other Pokémon is not in the table: still not known.
      expect(picks.find((p) => p.uid !== pidgey.uid)!.gets).toBeNull();
      const after = chooseEvent(content, run, sideId, 0, pidgey.uid).run;
      expect(after.party.some((m) => m.speciesId === 'abra')).toBe(true);
      expect(after.party.some((m) => m.uid === pidgey.uid)).toBe(false);
    });
  });

  it('a table entry that names no real species is shown as not known, never as a broken name', () => {
    withTable({ pidgey: 'not-a-species' }, () => {
      const { run, sideId } = debugForceEvent(content, begin('TC3'), SWAP);
      for (const p of eventView(content, run, sideId).choices[0]!.tradePicks!) expect(p.gets).toBeNull();
    });
  });

  it('a pick that is not a swap carries no card at all', () => {
    const run = begin('TC4');
    const { run: at, sideId } = debugForceEvent(content, run, 'cs-kanto-celadon-mansion-roof'); // a "pick a Pokémon" choice (the Kanto canon rebuild moved New Island's)
    const picks = eventView(content, at, sideId).choices[0]!.tradePicks!;
    expect(picks.length).toBeGreaterThan(0);
    for (const p of picks) expect('gets' in p).toBe(false);
  });
});

describe('Honest Trade Card (New UI view)', () => {
  const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: () => layout });
  const model = (pick: EventModel['pick']): EventModel => ({
    name: 'Swap Alley', tag: 'Canon Spaces', lines: [{ who: null, text: 'Three traders hold up cards.' }], speaker: null, page: { at: 0, of: 1 },
    art: null, tint: null, fx: null, cast: null, mon: null, choices: [{ label: 'Fair swap', sub: '', chance: '', locked: false }], index: 0, money: 0, outcome: null, pick, countdown: '', timer: null,
  });
  for (const layout of [0, 1, 2, 3]) {
    it(`layout ${layout}: shows both sides, says so when the other side is not known, and stays a plain list without a card`, () => {
      const known = drawEvent(ctx(layout), model({ labels: ['Pidgey Lv5'], at: 0, card: { give: { name: 'Pidgey Lv5', file: null }, get: { name: 'Abra', file: null } } }));
      expect(known).toContain('The trade, both sides');
      expect(known).toContain('You give');
      expect(known).toContain('You get');
      expect(known).toContain('Abra');
      expect(known).not.toContain('Not known yet');
      const unknown = drawEvent(ctx(layout), model({ labels: ['Pidgey Lv5'], at: 0, card: { give: { name: 'Pidgey Lv5', file: null }, get: null } }));
      expect(unknown).toContain('Not known yet');
      const plain = drawEvent(ctx(layout), model({ labels: ['Pidgey Lv5', 'Rattata Lv3'], at: 1, card: null }));
      expect(plain).toContain('Pick a Pokémon');
      expect(plain).not.toContain('You give');
      expect(plain.split('data-act="trade"').length - 1).toBe(2);
    });
  }
});
