import { describe, expect, it } from 'vitest';
import { pickThree, TRAITS, type Trait } from '../../src/core/story2/quiz';
import { content } from './helpers';

// Design v2 Part II "The roster" and Appendix S.6: exactly 74 Remembrance lines, 1 to 3 stages each, every stage a real species.
const ROSTER = ['bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic', 'mudkip', 'turtwig', 'chimchar', 'piplup', 'snivy', 'tepig', 'oshawott', 'chespin', 'fennekin', 'froakie', 'rowlet', 'litten', 'popplio', 'grookey', 'scorbunny', 'sobble', 'sprigatito', 'fuecoco', 'quaxly',
  'dratini', 'larvitar', 'bagon', 'beldum', 'gible', 'deino', 'goomy', 'jangmo-o', 'dreepy', 'frigibax',
  'pichu', 'tuftin', 'magby', 'elekid', 'togepi', 'aron',
  'pidgey', 'hoothoot', 'taillow', 'starly', 'pidove', 'fletchling', 'pikipek', 'rookidee', 'wattrel',
  'rhyhorn', 'porygon', 'mankey', 'gastly', 'abra', 'machop', 'magnemite', 'shinx', 'weedle', 'caterpie', 'nidoran-f', 'nidoran-m', 'poliwag', 'oddish', 'swinub', 'ralts', 'trapinch', 'duskull', 'sandile', 'pawniard', 'grubbin', 'blipbug',
  // Not in the design roster: added by the director (2026-11-07) because they are Story Run starters.
  'vulpix', 'psyduck'];

const lines = content.storyData.remembrances;

describe('Remembrance roster', () => {
  it('is the closed list of 76 lines (74 from the design plus Vulpix and Psyduck), each 1 to 3 real stages', () => {
    expect(ROSTER).toHaveLength(76);
    expect(lines.map((r) => r.line[0]).sort()).toEqual([...ROSTER].sort());
    expect(new Set(lines.map((r) => r.id)).size).toBe(76);
    for (const r of lines) {
      expect(r.line.length, r.id).toBeGreaterThanOrEqual(1);
      expect(r.line.length, r.id).toBeLessThanOrEqual(3);
      for (const s of r.line) expect(content.species.get(s), `${r.id}: ${s}`).toBeTruthy();
      for (const m of r.moves) expect(content.moves.get(m), `${r.id}: ${m}`).toBeTruthy();
    }
  });

  it('has the design rarity counts (plus 2 Familiar) and a 53-line opening quiz pool (Wattrel is no longer a starter)', () => {
    const count = (k: string) => lines.filter((r) => r.rarity === k).length;
    expect([count('familiar'), count('unusual'), count('rare'), count('exceptional')]).toEqual([34, 20, 12, 10]);
    expect(lines.filter((r) => r.quizEligible)).toHaveLength(53);
  });

  it('the quiz gives 3 distinct lines from the real pool for many score sets', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let i = 0; i < 500; i += 1) {
      const scores = Object.fromEntries(TRAITS.map((t) => [t, Math.round(5 + rnd() * 90)])) as Record<Trait, number>;
      const picks = pickThree(lines, scores, `s${i}`);
      expect(new Set(picks.map((p) => p.id)).size).toBe(3);
      expect(picks.every((p) => p.quizEligible)).toBe(true);
      expect(new Set(picks.map((p) => p.role)).size).toBeGreaterThanOrEqual(2);
    }
  });
});
