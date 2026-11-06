import { describe, expect, it } from 'vitest';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { identityLine, personalityOfMon, quirkOfMon, quirkReaction } from '../../src/core/overhaul/personality';
import { NATURE_IDS } from '../../src/core/natures';

const mon = (uid: string, nature?: (typeof NATURE_IDS)[number]) => ({ uid, nature, speciesId: 'pikachu' });

describe('overhaul personality', () => {
  it('is stable for a Pokémon and varies across Pokémon', () => {
    expect(personalityOfMon(mon('a1'))).toBe(personalityOfMon(mon('a1')));
    const p = new Set<string>(), q = new Set<string>();
    for (let i = 0; i < 600; i++) { p.add(personalityOfMon(mon(`u${i}`)).id); q.add(quirkOfMon(mon(`u${i}`)).id); }
    expect(p.size).toBeGreaterThan(50);
    expect(q.size).toBeGreaterThan(45);
  });
  it('a personality always lists the Pokémon\'s nature when one fits', () => {
    for (const n of NATURE_IDS) {
      const cap = n[0]!.toUpperCase() + n.slice(1);
      const any = overhaulCatalogs().personalities.entries.some((e) => e.natures.includes(cap));
      if (any) for (let i = 0; i < 20; i++) expect(personalityOfMon(mon(`x${i}`, n)).natures).toContain(cap);
    }
  });
  it('identity line names both', () => {
    const l = identityLine(mon('z'));
    expect(l).toContain(personalityOfMon(mon('z')).name);
    expect(l).toContain(quirkOfMon(mon('z')).name);
  });
  it('reactions: repeatable, only from quirks that react, null when none', () => {
    const party = Array.from({ length: 40 }, (_, i) => mon(`p${i}`));
    const a = quirkReaction(party, 'rest_node', 'k1', () => 'Mon');
    expect(a).toBe(quirkReaction(party, 'rest_node', 'k1', () => 'Mon'));
    expect(a).toBeTruthy();
    expect(a).not.toContain('{Name}');
    expect(quirkReaction(party, 'no_such_moment', 'k', () => 'Mon')).toBeNull();
    expect(quirkReaction([], 'rest_node', 'k', () => 'Mon')).toBeNull();
  });
});
