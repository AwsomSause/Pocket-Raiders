import { describe, expect, it } from 'vitest';
import { EVO_FLICKER, evoFormAt, evolutionLines, evolutionsSince, evolutionTimeline, partyLooks } from '../../src/core/presentation/evolutionScene';

describe('evolution scene timeline', () => {
  it('flickers between the forms on a shrinking beat and ends on the new form', () => {
    const tl = evolutionTimeline('full');
    expect(tl.beats[0]).toEqual({ at: 0, show: 'from' });
    expect(tl.beats.length).toBeGreaterThan(8);
    for (let i = 1; i < tl.beats.length; i++) {
      expect(tl.beats[i]!.show).not.toBe(tl.beats[i - 1]!.show);
      expect(tl.beats[i]!.at).toBeGreaterThan(tl.beats[i - 1]!.at);
    }
    const gaps = tl.beats.slice(1).map((b, i) => b.at - tl.beats[i]!.at);
    expect(gaps[0]).toBe(EVO_FLICKER.firstMs);
    expect(gaps[gaps.length - 1]!).toBeLessThan(gaps[0]!);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(EVO_FLICKER.floorMs - 1);
    expect(tl.beats[tl.beats.length - 1]!.show).toBe('to');
    expect(tl.revealAt).toBeGreaterThan(tl.beats[tl.beats.length - 1]!.at);
    expect(tl.flashMs).toBe(EVO_FLICKER.flashMs);
  });

  it('is the same every time (no randomness) and follows the speed setting', () => {
    expect(evolutionTimeline('full')).toEqual(evolutionTimeline('full'));
    const fast = evolutionTimeline('full', 2);
    expect(fast.revealAt).toBeLessThan(evolutionTimeline('full').revealAt);
    expect(fast.beats.length).toBe(evolutionTimeline('full').beats.length);
  });

  it('reduced motion skips the flicker; off reveals at once', () => {
    const reduced = evolutionTimeline('reduced');
    expect(reduced.beats).toHaveLength(1);
    expect(reduced.flashMs).toBe(0);
    expect(reduced.revealAt).toBe(EVO_FLICKER.reducedMs);
    expect(evolutionTimeline('off')).toEqual({ beats: [], revealAt: 0, flashMs: 0 });
  });

  it('says which form shows at a moment', () => {
    const tl = evolutionTimeline('full');
    expect(evoFormAt(tl, 0)).toBe('from');
    expect(evoFormAt(tl, EVO_FLICKER.firstMs)).toBe('to');
    expect(evoFormAt(tl, tl.revealAt + 1)).toBe('to');
  });
});

describe('evolution scene lines', () => {
  it('opens with "What?", closes with Congratulations and one line per move', () => {
    const l = evolutionLines('Charmander', 'Charmeleon', ['Dragon Breath']);
    expect(l.intro).toBe('What? Charmander is evolving!');
    expect(l.outro).toEqual(['Congratulations! Your Charmander evolved into Charmeleon!', 'Charmeleon learned Dragon Breath!']);
    expect(evolutionLines('A', 'B').outro).toHaveLength(1);
  });
});

describe('who evolved', () => {
  const evo = (a: string, b: string) => (a === 'charmander' && b === 'charmeleon') || (a === 'eevee' && b === 'vaporeon');
  it('finds party Pokémon whose species became an evolution', () => {
    const before = partyLooks([{ uid: '1', speciesId: 'charmander' }, { uid: '2', speciesId: 'eevee' }, { uid: '3', speciesId: 'pikachu' }]);
    const after = [{ uid: '1', speciesId: 'charmeleon' }, { uid: '2', speciesId: 'vaporeon', shiny: true }, { uid: '3', speciesId: 'pikachu' }];
    expect(evolutionsSince(before, after, evo)).toEqual([
      { uid: '1', from: 'charmander', to: 'charmeleon', shiny: false },
      { uid: '2', from: 'eevee', to: 'vaporeon', shiny: true },
    ]);
  });
  it('ignores new arrivals, unchanged Pokémon and changes that are not evolutions', () => {
    const before = partyLooks([{ uid: '1', speciesId: 'charmander' }]);
    expect(evolutionsSince(before, [{ uid: '1', speciesId: 'charmander' }, { uid: '9', speciesId: 'charmeleon' }], evo)).toEqual([]);
    expect(evolutionsSince(before, [{ uid: '1', speciesId: 'rotom-wash' }], evo)).toEqual([]);
    expect(evolutionsSince(new Map(), [], evo)).toEqual([]);
  });
});
