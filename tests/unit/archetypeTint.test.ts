// Overhaul P8: no archetype lacks a send-out throw. 19 trainer pictures have their own throwing sprite; every other archetype
// gets the generic pose with a tint from its own picture.
import { describe, expect, it } from 'vitest';
import { hasThrowTint, throwKind, throwTint } from '../../src/core/archetypeTint';
import { bossBackId } from '../../src/assets/catalog';
import { content } from './helpers';

const sprites = [...new Set([...content.archetypes.values()].map((a) => a.spriteAssetId))];

describe('trainer throw coverage', () => {
  it('covers every archetype picture with an own throw or a tinted fallback', () => {
    expect(sprites.length).toBeGreaterThanOrEqual(250);
    const uncovered = sprites.filter((s) => !bossBackId(s) && !hasThrowTint(s));
    expect(uncovered).toEqual([]);
  });

  it('own-sprite trainers keep their sprite; others use the fallback', () => {
    expect(throwKind('boss.lucas')).toBe('own');
    expect(throwKind('trainer.red')).toBe('fallback');
    expect(throwKind(null)).toBe('fallback');
  });

  it('tints are soft, stable colours; unknown pictures stay untinted', () => {
    expect(throwTint('trainer.red')).toBe(throwTint('trainer.red'));
    expect(throwTint('boss.nobody')).toBe(0xffffff);
    for (const s of sprites) {
      const t = throwTint(s);
      for (const sh of [16, 8, 0]) expect((t >> sh) & 255).toBeGreaterThanOrEqual(100);
    }
  });
});
