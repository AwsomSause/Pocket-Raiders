import { describe, expect, it } from 'vitest';
import { buildContent, RAW_CONTENT } from '../../src/data';
import { MYTHICAL_QUESTS, mythicalChainEvents } from '../../src/core/overhaul/mythicalChains';
import species from '../../src/data/species.json';

describe('mythical quest chains', () => {
  it('builds 3 valid events per quest, all accepted by the normal schema', () => {
    const content = buildContent();
    const events = mythicalChainEvents();
    expect(events.length).toBe(MYTHICAL_QUESTS.length * 3);
    for (const e of events) expect(content.events.has(e.id as string)).toBe(true);
  });
  it('each quest ends in a catchable wild battle with a real Mythical species', () => {
    const tagged = new Map((species as { id: string; tags?: string[] }[]).map((s) => [s.id, s.tags ?? []]));
    for (const q of MYTHICAL_QUESTS) expect(tagged.get(q.species)).toContain('mythical');
    const last = mythicalChainEvents().find((e) => e.id === 'ovm-mew-s3')! as { choices: { success: { battle?: { species: string[] } } }[] };
    expect(last.choices[0]!.success.battle?.species).toEqual(['mew']);
  });
  it('only one quest per run, none early, and each stage needs the one before', () => {
    const byId = new Map(mythicalChainEvents().map((e) => [e.id as string, e]));
    expect(byId.get('ovm-mew-s1')!.requires).toEqual([{ kind: 'flag', key: 'ovc-mythic', atMost: 0 }]);
    expect(byId.get('ovm-mew-s1')!.minStage).toBe(9);
    expect(byId.get('ovm-mew-s3')!.requires).toEqual([{ kind: 'flag', key: 'ovm-mew-2' }]);
  });
  it('can be switched off', () => {
    const off = buildContent({ ...RAW_CONTENT, balance: { ...(RAW_CONTENT.balance as object), mythicalChains: { enabled: false, minStage: 9 } } });
    expect(off.events.has('ovm-mew-s1')).toBe(false);
    expect(buildContent().events.has('ovm-mew-s1')).toBe(true);
  });
});
