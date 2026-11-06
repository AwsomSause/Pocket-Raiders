import { describe, expect, it } from 'vitest';
import { moveFlavor, moveFullDescription } from '../../src/core/battle/moveText';
import { content } from './helpers';

describe('move descriptions and side effects (Beta 4.4 #26)', () => {
  it('every ordinary move has the game description, plus the numbers when it has a side effect', () => {
    const missing = [...content.moves.values()].filter((m) => !moveFlavor(m.id) && !/z-move|g-max|max /i.test(m.name) && !m.id.startsWith('g-max') && !m.id.startsWith('max-') && (m as { supported?: boolean }).supported !== false && !m.id.endsWith('-torque'));
    expect(missing.map((m) => m.id)).toEqual([]);
    const flame = moveFullDescription(content.moves.get('flamethrower')!);
    expect(flame).toContain('scorched');
    expect(flame).toContain('10% chance to burn');
  });

  it('moves that were missing their side effect now have it', () => {
    expect(content.moves.get('psybeam')!.effects.confuse?.chance).toBe(10);
    expect(content.moves.get('confusion')!.effects.confuse?.chance).toBe(10);
    expect(content.moves.get('water-pulse')!.effects.confuse?.chance).toBe(20);
    expect(content.moves.get('supercell-slam')!.effects.crashOnMiss).toBe(true);
    expect(content.moves.get('zippy-zap')!.effects.statChanges?.[0]).toMatchObject({ stat: 'eva', stages: 1, target: 'self' });
  });
});
