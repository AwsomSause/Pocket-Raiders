// Item stages (item rework part 2): most catalog items come in Stage I, II and III at rising rarities.

import { describe, expect, it } from 'vitest';
import { stagesOf, stageId, withStages, type StageRules } from '../../src/core/itemStages';
import type { CatalogEntry } from '../../src/core/contentSchema';
import { content } from './helpers';

const RULES: StageRules = { enabled: true, factors: [1.5, 2], skipKinds: ['teachMove'], skipFamilies: ['Evolution items'] };
const base = (over: Partial<CatalogEntry>): CatalogEntry =>
  ({ id: 'x', name: 'X', family: 'F', description: 'Prize money +10%', rarity: 'common', stacksOn: 'player', max: null, how: 'passive', icon: null, status: 'supported', effect: { kind: 'passive', passive: 'money', percent: 10 }, ...over }) as CatalogEntry;

describe('item stages', () => {
  it('Stage II and III are stronger, one and two rarities up, with the text restated', () => {
    const [ii, iii] = stagesOf(base({}), RULES);
    expect(ii).toMatchObject({ id: 'x-ii', name: 'X II', rarity: 'uncommon', description: 'Prize money +15% (Stage II)', effect: { percent: 15 } });
    expect(iii).toMatchObject({ id: 'x-iii', name: 'X III', rarity: 'rare', effect: { percent: 20 } });
  });

  it('Luck never grows with the stage, X items gain a whole stage each, fractions turn into percents', () => {
    const money = stagesOf(base({ description: '+₽80, +1 Luck', effect: { kind: 'money', amount: 80, changes: { luck: 1 } } as CatalogEntry['effect'] }), RULES);
    expect(money[1]!.effect).toMatchObject({ amount: 160, changes: { luck: 1 } });
    const x = stagesOf(base({ effect: { kind: 'battleBoost', boosts: [{ kind: 'stage', stat: 'atk', stages: 1, turns: 5 }] } as CatalogEntry['effect'] }), RULES);
    expect(x.map((e) => (e.effect as { boosts: { stages: number }[] }).boosts[0]!.stages)).toEqual([2, 3]);
    const lefties = stagesOf(base({ description: 'Heals 1/16 max HP', effect: { kind: 'held', hooks: [{ hook: 'endTurn', fraction: 0.0625 }] } as CatalogEntry['effect'] }), RULES);
    expect(lefties[0]!.description).toBe('Heals 9% max HP (Stage II)');
  });

  it('skips epic items, charms, skipped kinds/families, and items with nothing to scale (boundary)', () => {
    expect(stagesOf(base({ rarity: 'epic' }), RULES)).toEqual([]);
    expect(stagesOf(base({ name: 'Coin Charm' }), RULES)).toEqual([]);
    expect(stagesOf(base({ family: 'Evolution items' }), RULES)).toEqual([]);
    expect(stagesOf(base({ effect: { kind: 'held', hooks: [{ hook: 'berryCure', statuses: ['par'], confusion: false }] } as unknown as CatalogEntry['effect'] }), RULES)).toEqual([]);
    expect(stagesOf(base({}), { ...RULES, enabled: false })).toEqual([]);
    expect(withStages([base({})], RULES).map((e) => e.id)).toEqual(['x', 'x-ii', 'x-iii']);
  });

  it('the real catalog has stage copies that offer as draft rewards and pass the schema', () => {
    expect(content.catalog.get(stageId('charcoal', 3))).toMatchObject({ rarity: 'epic', effect: { hooks: [{ percent: 40 }] } });
    expect(content.rewards.has('item:charcoal-ii')).toBe(true);
    expect(content.catalog.has('fire-stone-ii')).toBe(false);
  });
});
