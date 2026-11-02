// Contract between the Pokémon screen (PokemonScreen in ui/pokemonMenu.ts: state, input, actions) and a party look.
// A skin only paints the window, the party rows and the tabs. All text stays light, so every look uses dark faces.
import type Phaser from 'phaser';
import type { MotionLevel } from '../aero';

export interface PartyPalette {
  row: number;
  rowAlpha: number;
  rowFocus: number;
  rowRim: number;
  focusRim: number;
  tab: number;
  tabActive: number;
  /** The detail panels on the right. */
  pane: number;
  paneRim: number;
}

export interface PartySkin {
  palette: PartyPalette;
  shape: 'round' | 'square' | 'slant' | 'pill';
  /** Non-focused rows fade (the spotlight look). */
  dimRows?: boolean;
  /** The whole window: backdrop, header band and message band, added to `root` (which already has the dark shade). */
  chrome(scene: Phaser.Scene, root: Phaser.GameObjects.Container, motion: MotionLevel): void;
}
