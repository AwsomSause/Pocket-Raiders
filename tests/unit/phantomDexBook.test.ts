import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import type { TypeChart } from '../../src/core/contentSchema';
import { dexState, liveDexProfile, type DexDataPage, type DexCard } from '../../src/core/presentation/dexInfo';
import { tallyOf } from '../../src/core/dexResearch';
import { createProfile } from '../../src/core/profile';
import { phDex } from '../../src/ui/phantom/screens/dex';
import { gridStep, phDexList, phTypes, typeAttacks, typeHitBy, TYPE_ORDER, type DexListModel } from '../../src/ui/phantom/screens/dexbook';
import { pageOf } from '../../src/ui/phantom/kit';
import { content } from './helpers';

const PH = PHANTOM_VERSIONS[0]!;
const list = (over: Partial<DexListModel> = {}): DexListModel => ({
  set: 'Generation 1 Pokédex', tab: 'All', seen: 412, caught: 187, n: 151,
  cell: (i) => ({ no: String(i + 1).padStart(4, '0'), file: null, unknown: i % 3 === 0 }),
  index: 93,
  card: { no: '0094', name: 'Gengar', types: ['ghost', 'poison'], file: null, unknown: false, lines: ['Seen 14 times · Caught 3'], rank: { name: 'Gold', at: 3, next: 'Next, Master: Clear a region with it in your party' } },
  sets: true, ...over,
});

describe('Phantom UI: the Pokédex of the pause menu', () => {
  it('draws one screen of the set around the cursor, with the counts and the picked species on its card', () => {
    const html = phDexList(PH, list());
    expect(pageOf(html)).toBe('dex');
    expect(html.match(/class="dx ph-dxl/g)).toHaveLength(24);
    expect(html.match(/class="dx ph-dxl on/g)).toHaveLength(1);
    expect(html).toContain('data-key="c93"');
    expect(html).toContain('SEEN <b>412</b>');
    expect(html).toContain('CAUGHT <b>187</b>');
    expect(html).toContain('No. 0094');
    expect(html).toContain('Gengar');
    expect(html).toContain('MASTERY: GOLD');
    expect(html.match(/<i class="f"><\/i>/g)).toHaveLength(3);
    expect(html).toMatch(/\d+–\d+ of 151/);
    for (const word of ['Entry', 'Region', 'Show: All', 'Type chart', 'Back']) expect(html).toContain(word);
  });

  it('boundary: a short set has no page line, one set has no Region key, and an unmet species shows no rank', () => {
    const html = phDexList(PH, list({ n: 5, index: 0, sets: false, card: { no: '0001', name: '???', types: [], file: null, unknown: true, lines: ['Not met yet. Meet it in a run to fill this page.'], rank: null } }));
    expect(html.match(/class="dx ph-dxl/g)).toHaveLength(5);
    expect(html).not.toContain(' of 5');
    expect(html).not.toContain('Region');
    expect(html).not.toContain('MASTERY');
    expect(html).toContain('Not met yet');
  });

  it('failure: an empty filter says so instead of drawing an empty card', () => {
    const html = phDexList(PH, list({ n: 0, index: 0, card: null, tab: 'Mastered' }));
    expect(html).not.toContain('class="dx ph-dxl');
    expect(html).toContain('Nothing here yet');
    expect(html).toContain('Show: Mastered');
  });

  it('escapes names', () => {
    const html = phDexList(PH, list({ set: '<b>x</b>', card: { ...list().card!, name: '<i>y</i>' } }));
    expect(html).not.toContain('<b>x</b>');
    expect(html).not.toContain('<i>y</i>');
  });

  it('moves through a grid without leaving it', () => {
    expect(gridStep(0, 10, 6, 'left')).toBe(0);
    expect(gridStep(0, 10, 6, 'right')).toBe(1);
    expect(gridStep(0, 10, 6, 'down')).toBe(6);
    expect(gridStep(5, 10, 6, 'down')).toBe(9); // the last row is short: land on its last cell
    expect(gridStep(7, 10, 6, 'down')).toBe(7);
    expect(gridStep(9, 10, 6, 'right')).toBe(9);
    expect(gridStep(3, 10, 6, 'up')).toBe(3);
    expect(gridStep(0, 0, 6, 'right')).toBe(0);
  });

  it('an entry opened from it has the next-entry, page, cry and type chart keys; the hub entry keeps its own', () => {
    const card: DexCard = { state: 'caught', no: 'No. 0094', name: 'Gengar', types: ['ghost', 'poison'], facts: [['Height', '1.5 m'], ['Weight', '40.5 kg']], note: 'Caught.', stats: [], line: [], next: 'Final form' };
    const data: DexDataPage = { title: 'Gengar', state: 'caught', facts: [], evolutions: [], moves: [] };
    const book = phDex(PH, { card, data, page: 0, art: null, line: [], book: true });
    for (const word of ['Next entry', 'Cry', 'Type chart']) expect(book).toContain(word);
    expect(book).toContain('data-act="dexGo" data-arg="types"');
    const hub = phDex(PH, { card, data, page: 0, art: null, line: [] });
    expect(hub).not.toContain('dexGo');
    expect(hub).toContain('data-act="flip"');
    const unknown = phDex(PH, { card: { ...card, state: 'unknown', name: '???' }, data, page: 0, art: null, line: [], book: true });
    expect(unknown).not.toContain('Cry');
    expect(unknown).toContain('Type chart');
  });
});

describe('Phantom UI: the type chart', () => {
  const chart: TypeChart = content.typeChart;
  const types = TYPE_ORDER.filter((t) => chart[t] !== undefined);

  it('has all eighteen types and reads the game\'s own chart', () => {
    expect(types).toHaveLength(18);
    expect(typeAttacks(chart, types, 'fire')).toEqual({ x2: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'], zero: [] });
    expect(typeHitBy(chart, types, 'fire')).toEqual({ x2: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], zero: [] });
    expect(typeAttacks(chart, types, 'normal').zero).toEqual(['ghost']);
    expect(typeHitBy(chart, types, 'ground').zero).toEqual(['electric']);
  });

  it('every pair on the page matches the damage rule', () => {
    for (const a of types) {
      const r = typeAttacks(chart, types, a);
      for (const d of types) {
        const m = chart[a]?.[d] ?? 1;
        expect(r.x2.includes(d)).toBe(m > 1);
        expect(r.half.includes(d)).toBe(m > 0 && m < 1);
        expect(r.zero.includes(d)).toBe(m === 0);
        expect(typeHitBy(chart, types, d).x2.includes(a)).toBe(m > 1);
      }
    }
  });

  it('draws the tiles, the picked type and both panels; an empty row says "nothing"', () => {
    const html = phTypes(PH, { types, index: types.indexOf('fire'), chart });
    expect(pageOf(html)).toBe('types');
    expect(html.match(/class="tc-t/g)).toHaveLength(18);
    expect(html.match(/class="tc-t on/g)).toHaveLength(1);
    expect(html).toContain('Fire attacks');
    expect(html).toContain('Fire is hit by');
    expect(html.match(/<em>nothing<\/em>/g)).toHaveLength(2);
    expect(html).toContain('Pick a type');
  });
});

describe('Phantom UI: the Pokédex in the middle of a run', () => {
  const profile = { ...createProfile(content, 'p'), speciesSeen: ['pidgey'], speciesCaught: ['rattata'], dexResearch: { pidgey: { seen: 2, caught: 0 } } };

  it('reads what is banked plus what this run has met and caught, and leaves the profile alone', () => {
    const live = liveDexProfile(profile, { speciesSeen: ['pidgey', 'zubat'], speciesCaught: ['zubat'], dexTally: { pidgey: { seen: 3, caught: 0 }, zubat: { seen: 1, caught: 1 } } });
    expect(dexState(live, 'zubat')).toBe('caught');
    expect(dexState(live, 'rattata')).toBe('caught');
    expect(dexState(live, 'pidgey')).toBe('seen');
    expect(dexState(live, 'mew')).toBe('unknown');
    expect(tallyOf(live, 'pidgey')).toEqual({ seen: 5, caught: 0 });
    expect(tallyOf(live, 'zubat')).toEqual({ seen: 1, caught: 1 });
    expect(live.speciesSeen.filter((x) => x === 'pidgey')).toHaveLength(1);
    expect(profile.speciesSeen).toEqual(['pidgey']);
    expect(profile.dexResearch).toEqual({ pidgey: { seen: 2, caught: 0 } });
  });

  it('boundary: outside a run, or with an empty log, it is the profile', () => {
    expect(liveDexProfile(profile, undefined)).toBe(profile);
    const live = liveDexProfile(profile, { speciesSeen: [], speciesCaught: [] });
    expect(live.speciesSeen).toEqual(['pidgey']);
    expect(live.speciesCaught).toEqual(['rattata']);
  });
});
