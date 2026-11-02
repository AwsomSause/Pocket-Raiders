// The status and field animations filled from the Pokémon Memories pack: Protect, Bind, Leech Seed, Snow and the four terrains each have their
// Essentials animation on disk, and a terrain starting plays its animation.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/core/battle/engine';
import { planCues } from '../../src/core/presentation/cues';
import { commonChoice } from '../../src/core/presentation/moveAnims';
import { moveAnims } from '../../src/data/presentation';
import { content } from './helpers';

const data = moveAnims();
const SLOTS = ['protect', 'bind', 'seed', 'weather.snow', 'terrain.electric', 'terrain.grassy', 'terrain.misty', 'terrain.psychic'];

describe('Pokémon Memories status and field animations', () => {
  it('each slot plays its Essentials animation, and the file and its sheets are on disk', () => {
    const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
    for (const slot of SLOTS) {
      const { anim } = commonChoice(data, slot);
      expect(anim, slot).toMatch(/^ess-common-/);
      expect(existsSync(join(assets, 'battle-anims', `${anim}.json`)), slot).toBe(true);
      for (const g of data.anims[anim]!.graphics) expect(existsSync(join(assets, 'images', 'battle_anims', `${g}.png`)), g).toBe(true);
    }
  });

  it('a terrain starting plays its animation at full motion only', () => {
    const events = [{ type: 'terrain', terrain: 'psychic' }] as BattleEvent[];
    const full = planCues(events, content, data, { mode: 'full', intensity: 1 }).flat();
    expect(full).toContainEqual(expect.objectContaining({ kind: 'commonAnim', anim: 'ess-common-psychicterrain' }));
    expect(planCues(events, content, data, { mode: 'reduced', intensity: 1 }).flat().some((c) => c.kind === 'commonAnim')).toBe(false);
  });
});

describe('status patterns (Deluxe Battle Kit, via Pokémon Memories)', () => {
  it('burn, freeze, paralysis and poison each have a pattern on disk, loaded with the battle; sleep and none have none', async () => {
    const { FORM_LOOK_ASSETS, STATUS_PULSE, statusPatternKey } = await import('../../src/ui/battleFx/formLook');
    const assets = join(import.meta.dirname, '..', '..', 'public', 'assets');
    for (const [status, name] of [['brn', 'burn'], ['frz', 'frozen'], ['par', 'paralysis'], ['psn', 'poison']]) {
      expect(statusPatternKey(status)).toBe(`fx.status.pattern.${name}`);
      expect(FORM_LOOK_ASSETS).toContain(`fx.status.pattern.${name}`);
      expect(existsSync(join(assets, 'images', 'packs', 'dbk', 'status', `${name}.png`)), name).toBe(true);
    }
    expect(statusPatternKey('slp')).toBeNull();
    expect(statusPatternKey(null)).toBeNull();
    expect(STATUS_PULSE.min).toBeLessThan(STATUS_PULSE.max);
  });
});
