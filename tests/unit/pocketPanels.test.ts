// Pocket Town panels (Appendix S.5, slice 2): every building maps to a district theme, the four special buildings
// have their own layout, and those layouts have room for all their actions.
import { describe, expect, it } from 'vitest';
import { PANEL_THEMES, buildingDistrict, panelLayout } from '../../src/core/hubTown/panelTheme';
import { TOWN } from '../../src/core/town';

describe('Pocket Town panel themes', () => {
  it('puts every building in a district that has a theme', () => {
    for (const b of TOWN.buildings) {
      const d = buildingDistrict(b.id);
      expect(PANEL_THEMES[d], `${b.id} -> ${d}`).toBeDefined();
    }
    expect(buildingDistrict('dojo')).toBe('training');
    expect(buildingDistrict('library')).toBe('culture');
    expect(buildingDistrict('garden')).toBe('home');
    expect(buildingDistrict('capsule')).toBe('play');
    expect(buildingDistrict('not-a-building')).toBe('plaza');
  });

  it('gives the Library, Shrine, Capsule Corner and Dojo their own layouts', () => {
    expect(panelLayout('library')).toBe('shelf');
    expect(panelLayout('shrine')).toBe('altar');
    expect(panelLayout('capsule')).toBe('machine');
    expect(panelLayout('dojo')).toBe('roster');
    expect(panelLayout('garden')).toBe('list');
  });

  it('keeps the special layouts to a few actions (they do not scroll)', () => {
    for (const id of ['library', 'shrine', 'capsule', 'dojo']) {
      const n = TOWN.buildings.find((b) => b.id === id)!.actions.length;
      expect(n, id).toBeGreaterThan(0);
      expect(n, id).toBeLessThanOrEqual(4);
    }
  });
});
