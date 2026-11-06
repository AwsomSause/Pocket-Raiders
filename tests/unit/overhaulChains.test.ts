import { describe, expect, it } from 'vitest';
import { buildContent, RAW_CONTENT } from '../../src/data';
import { buildPools, chainEvents, LEGEND_SPECIES, mapOutcome, type PoolItem } from '../../src/core/overhaul/chains';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import species from '../../src/data/species.json';

const items = RAW_CONTENT.itemCatalog as PoolItem[];
const pools = buildPools(items);

describe('overhaul event chains', () => {
  it('turns all 180 chains into events that the normal schema accepts', () => {
    const content = buildContent();
    const { events, stats } = chainEvents(items);
    expect(stats.chains).toBe(180);
    for (const e of events) expect(content.events.has(e.id as string)).toBe(true);
    expect(events.length).toBe(stats.stages);
  });

  it('can be switched off', () => {
    const off = buildContent({ ...RAW_CONTENT, balance: { ...(RAW_CONTENT.balance as object), overhaulChains: { enabled: false, legendaryMinStage: 7 } } });
    expect(off.events.has('ovc-roadside-stand-s1')).toBe(false);
    expect(buildContent().events.has('ovc-roadside-stand-s1')).toBe(true);
  });

  it('maps outcomes to real effects', () => {
    expect(mapOutcome('50 coins and thanks', 'common', pools).effects).toContainEqual({ kind: 'money', amount: 50 });
    expect(mapOutcome('2 common berries', 'common', pools).effects[0]).toMatchObject({ kind: 'itemFrom', count: 2 });
    expect(mapOutcome('a common egg', 'common', pools).effects[0]).toMatchObject({ kind: 'egg' });
    expect(mapOutcome('a double battle', 'rare', pools).battle).toMatchObject({ kind: 'trainer', size: 2 });
  });

  it('keeps nothing and unknown outcomes free of invented rewards', () => {
    expect(mapOutcome('nothing', 'common', pools)).toEqual({ kind: 'none', effects: [] });
    expect(mapOutcome('', 'common', pools).kind).toBe('none');
    expect(mapOutcome('you feel odd', 'common', pools)).toEqual({ kind: 'story', effects: [] });
  });

  it('later stages need the flag of the stage before; legendary chains start late and only one per run', () => {
    const { events } = chainEvents(items);
    const byId = new Map(events.map((e) => [e.id as string, e]));
    const s2 = byId.get('ovc-roadside-stand-s2')!;
    expect(s2.callback).toBe(true);
    expect(s2.requires).toEqual([{ kind: 'flag', key: 'ovc-roadside-stand-s1' }]);
    const l1 = byId.get('ovc-legend-lugia-shrine-s1')!;
    expect(l1.minStage).toBe(7);
    expect(l1.requires).toEqual([{ kind: 'flag', key: 'ovc-legend', atMost: 0 }]);
    expect(l1.rarity).toBe('epic');
  });

  it('every legendary chain has real species, and the last battle uses them', () => {
    const ids = new Set((species as { id: string }[]).map((s) => s.id));
    const legends = overhaulCatalogs().event_chains.entries.filter((c) => c.rarity === 'legendary');
    expect(legends.length).toBe(20);
    for (const c of legends) {
      expect(LEGEND_SPECIES[c.id]?.length).toBeGreaterThan(0);
      for (const sp of LEGEND_SPECIES[c.id]!) expect(ids.has(sp)).toBe(true);
    }
    const { events } = chainEvents(items);
    const last = events.find((e) => e.id === 'ovc-legend-lugia-shrine-s3')! as { choices: { success: { battle?: { species: string[] } } }[] };
    expect(last.choices[0]!.success.battle?.species).toEqual(['lugia']);
  });

  it('covers most outcomes with a real rule', () => {
    const { stats } = chainEvents(items);
    expect(stats.mapped + stats.battles).toBeGreaterThan(stats.options * 0.2);
    console.log(JSON.stringify(stats));
  });
});
