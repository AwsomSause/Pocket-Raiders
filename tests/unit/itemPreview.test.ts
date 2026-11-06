// Overhaul slice 7: the item screen's party preview tells the truth about what an item will do.
import { describe, expect, it } from 'vitest';
import { itemCard, itemFooter, previewItemOn } from '../../src/core/itemPreview';
import { applyItemToPokemon, itemUseProblem } from '../../src/core/items';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { partyPreviews, quickSummaryText } from '../../src/ui/itemScreen';
import { content } from './helpers';

const make = (species = 'charmander', level = 20) => createPokemon(content, species, level, 'u1');
const byKind = (kind: string) => [...content.items.values()].filter((i) => i.effect.kind === kind);

describe('previewItemOn', () => {
  it('heal items: the preview says exactly how much HP the real use restores', () => {
    const potion = byKind('healHp')[0]!;
    for (const mult of [1, 1.5]) {
      const mon = make();
      mon.hp = 1;
      const p = previewItemOn(content, potion, mon, { healMultiplier: mult });
      const real = structuredClone(mon);
      applyItemToPokemon(content, potion, real, { healMultiplier: mult });
      expect(p.mark).toBe('good');
      expect(p.short).toBe(`HP 1 → ${real.hp}`);
      expect(p.detail).toContain(`${real.hp}/${maxHp(content, mon)}`);
    }
  });

  it('a full-HP Pokémon is marked as already full, a fainted one as fainted (heal) or good (revive)', () => {
    const potion = byKind('healHp')[0]!;
    const revive = byKind('revive')[0]!;
    const full = make();
    expect(previewItemOn(content, potion, full)).toMatchObject({ mark: 'already', short: 'HP full' });
    const down = make();
    down.hp = 0;
    expect(previewItemOn(content, potion, down)).toMatchObject({ mark: 'fainted', short: 'Fainted' });
    expect(previewItemOn(content, revive, down).mark).toBe('good');
    expect(previewItemOn(content, revive, full)).toMatchObject({ mark: 'already', short: 'Not fainted' });
  });

  it('an engine reason (battle rules) wins over the item rules', () => {
    const potion = byKind('healHp')[0]!;
    const mon = make();
    mon.hp = 1;
    const p = previewItemOn(content, potion, mon, { problem: 'Healing is forbidden here.' });
    expect(p.mark).toBe('blocked');
    expect(p.detail).toBe('Healing is forbidden here.');
  });

  it('every item kind with a Pokémon target: "good" exactly when the real rules allow it, and a non-empty explanation', () => {
    const kinds = ['healHp', 'cureStatus', 'fullRestore', 'restorePp', 'revive', 'natureNudge', 'teraShard', 'evolve'];
    const states = [make(), Object.assign(make(), { hp: 3 }), Object.assign(make(), { hp: 0 }), Object.assign(make(), { status: { id: 'brn' as const, turns: 0 } }), make('eevee', 30)];
    for (const kind of kinds) {
      for (const item of byKind(kind)) {
        for (const mon of states) {
          const p = previewItemOn(content, item, mon);
          expect(p.mark === 'good').toBe(itemUseProblem(content, item, mon) === null);
          expect(p.detail.length).toBeGreaterThan(0);
          expect(p.short.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('is pure: previewing changes nothing', () => {
    const mon = make();
    mon.hp = 2;
    const before = JSON.stringify(mon);
    for (const item of content.items.values()) previewItemOn(content, item, mon);
    expect(JSON.stringify(mon)).toBe(before);
  });
});

describe('item card and party previews', () => {
  it('counts who the item works on and builds the footer line', () => {
    const potion = byKind('healHp')[0]!;
    const hurt = make();
    hurt.hp = 4;
    const party = [hurt, make('squirtle'), Object.assign(make('bulbasaur'), { hp: 0 })];
    const previews = partyPreviews(content, potion, party);
    const card = itemCard(content, potion, 3, previews);
    expect(card.applies).toBe('Works on 1 of 3 Pokémon right now.');
    expect(card.owned).toBe(3);
    expect(card.restrictions).toContain('Not on a fainted Pokémon.');
    expect(itemFooter(card, previews[0]!)).toContain('you have 3');
  });

  it('an empty party gives an empty result without throwing', () => {
    const potion = byKind('healHp')[0]!;
    expect(partyPreviews(content, potion, [])).toEqual([]);
    expect(itemCard(content, potion, 0, []).applies).toBe('Works on 0 of 0 Pokémon right now.');
  });
});

describe('quick Pokémon summary', () => {
  it('lists types, ability, nature, stats, moves with PP, held items, status, HP and evolution without a run', () => {
    const mon = make('charmander', 16);
    mon.hp = 5;
    mon.status = { id: 'brn', turns: 0 };
    const text = quickSummaryText(content, null, mon);
    expect(text).toContain('Charmander');
    expect(text).toMatch(/Fire/);
    expect(text).toContain('Status: Burn');
    expect(text).toMatch(/Moves:\n\s+\S/);
    expect(text).toMatch(/PP \d+\/\d+/);
    expect(text).toContain('Held: nothing');
    expect(text).toContain('Evolution:');
    expect(text).toMatch(/HP 5\/\d+ \(\d+%\)/);
  });
  it('shows a fainted Pokémon as fainted', () => {
    const mon = make();
    mon.hp = 0;
    expect(quickSummaryText(content, null, mon)).toContain('Status: Fainted');
  });
});
