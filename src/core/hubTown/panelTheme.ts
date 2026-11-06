// Pocket Town panel themes (Appendix S.5, slice 2): pure data, so tests can read it without Phaser.
import { POCKET_TOWN } from './schema';
import { districtAt } from './world';

export type PanelLayout = 'list' | 'shelf' | 'altar' | 'machine' | 'roster';

export interface PanelTheme {
  frame: number;
  floor: number;
  accent: number;
  name: string;
}

/** Frame colours per district (the minimap colours): Training red, Culture blue, Home green, Play purple, plaza gold. */
export const PANEL_THEMES: Record<string, PanelTheme> = {
  training: { frame: 0xe07060, floor: 0x3a2a28, accent: 0xffd08a, name: 'Training Grounds' },
  culture: { frame: 0x70a0e0, floor: 0x232c44, accent: 0xcfe0ff, name: 'Culture Quarter' },
  home: { frame: 0x70c070, floor: 0x243a2a, accent: 0xd6f5c0, name: 'Home Gardens' },
  play: { frame: 0xc090e0, floor: 0x33264a, accent: 0xf0d8ff, name: 'Play Street' },
  plaza: { frame: 0xe8c070, floor: 0x2d2838, accent: 0xffe8b0, name: 'Town Plaza' },
};

/** Buildings with their own layout; everything else is a list. */
const LAYOUTS: Record<string, PanelLayout> = { library: 'shelf', shrine: 'altar', capsule: 'machine', dojo: 'roster' };
export const panelLayout = (buildingId: string): PanelLayout => LAYOUTS[buildingId] ?? 'list';

/** The district a building stands in (by its door on the Pocket Town map); the plaza theme when it has none. */
export function buildingDistrict(buildingId: string): string {
  const place = POCKET_TOWN.places.find((p) => p.id === buildingId);
  return (place && districtAt(place.door, POCKET_TOWN)?.id) || 'plaza';
}

