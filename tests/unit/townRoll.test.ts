import { describe, expect, it } from 'vitest';
import { townRollPages } from '../../src/core/expansion/townRoll';
import { canonEventFor } from '../../src/core/expansion/canonRun';
import { chooseStarter, createRun } from '../../src/core/run';
import { canonKanto } from '../../src/data/expansion';
import { content } from './helpers';

// The Town Roll page: a read-only look at the menu a Kanto Canon run rolled for the town of its stage.

const begin = (seed: string, on: boolean) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(on ? { expansion: { kantoCanon: true } } : {}) }), 0);
const kantoSeeds = (() => { const out: string[] = []; for (let i = 0; out.length < 8 && i < 400; i++) if (begin(`K${i}`, false).regionOrder[0] === 'kanto') out.push(`K${i}`); return out; })();

describe('Town Roll page', () => {
  it('finds Kanto-first seeds', () => expect(kantoSeeds.length).toBe(8));

  it('Stage 1 of a Kanto Canon run: Pewter City, the two starred spaces first, then what was rolled, then what was left out', () => {
    for (const seed of kantoSeeds) {
      const run = begin(seed, true);
      const [page, ...more] = townRollPages(content, run);
      expect(more).toEqual([]);
      expect(page!.town).toBe('Pewter City');
      expect(page!.slot).toBe('stage-1');
      expect(page!.cards.slice(0, 2).map((c) => [c.id, c.state])).toEqual([['cs.kanto.pewter.forest', 'always'], ['cs.kanto.pewter.moon', 'always']]);
      const states = page!.cards.map((c) => c.state);
      // Left-out spaces come last.
      expect(states.slice(states.indexOf('off')).every((s) => s === 'off')).toBe(true);
      expect(page!.rolled).toBe(states.filter((s) => s === 'rolled').length);
      expect(page!.optional).toBe(page!.rolled + states.filter((s) => s === 'off').length);
      expect(new Set(page!.cards.map((c) => c.id)).size).toBe(page!.cards.length);
    }
  });

  it('every space shown as placed is on the stored menu and has something to play; left-out ones are optional spaces of the town', () => {
    const run = begin(kantoSeeds[0]!, true);
    const page = townRollPages(content, run)[0]!;
    const menu = run.expansion!.canon!.menus['stage-1']!;
    for (const c of page.cards) {
      const sp = canonKanto.spaces.find((s) => s.id === c.id)!;
      expect(content.raids.raids.some((r) => r.canon === c.id) || !!canonEventFor(content, c.id, 'stage-1')).toBe(true);
      if (c.state === 'off') {
        expect(menu).not.toContain(c.id);
        expect([sp.town, sp.appears, sp.parent]).toEqual(['pewter', 'roll', null]);
      } else expect(menu).toContain(c.id);
    }
  });

  it('reading the page rolls nothing and changes nothing', () => {
    const run = begin(kantoSeeds[1]!, true);
    const before = JSON.stringify(run);
    const a = townRollPages(content, run), b = townRollPages(content, run);
    expect(JSON.stringify(run)).toBe(before);
    expect(b).toEqual(a);
  });

  it('a finished space is marked done', () => {
    const run = begin(kantoSeeds[2]!, true);
    const first = townRollPages(content, run)[0]!.cards[0]!;
    expect(first.done).toBe(false);
    run.expansion!.canon!.completed.push(first.id);
    expect(townRollPages(content, run)[0]!.cards[0]!.done).toBe(true);
  });

  it('no page without Kanto Canon, outside Kanto, or before the menu is rolled', () => {
    expect(townRollPages(content, begin(kantoSeeds[0]!, false))).toEqual([]);
    let other: string | null = null;
    for (let i = 0; other === null && i < 400; i++) if (begin(`K${i}`, false).regionOrder[0] !== 'kanto') other = `K${i}`;
    expect(townRollPages(content, begin(other!, true))).toEqual([]);
    const run = begin(kantoSeeds[0]!, true);
    run.expansion!.canon!.menus = {};
    expect(townRollPages(content, run)).toEqual([]);
  });
});
