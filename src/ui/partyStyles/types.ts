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

export interface RosterMon {
  index: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  state: 'ready' | 'caution' | 'down';
  /** LEAD, FNT or a status name; empty when none. */
  tag: string;
  species: import('../../core/contentSchema').Species;
  shiny: boolean;
  types: string[];
  ability: string;
  nature: string;
  stats: { label: string; value: number }[];
  moves: { name: string; type: string; pp: string; power: string }[];
}

/** What a roster page needs: the party, who is selected, and how to select or open one. */
export interface RosterCtx {
  scene: Phaser.Scene;
  /** Draw into this container (it is emptied on every redraw). */
  into: Phaser.GameObjects.Container;
  mons: RosterMon[];
  sel: number;
  motion: MotionLevel;
  /** True the first time the page is drawn (play entrances only then). */
  first: boolean;
  /** The line the party screen speaks for the selected one. */
  line: string;
  select(i: number): void;
  open(i: number): void;
}

export interface PartySkin {
  /** The party page, drawn like the mock-up; Enter or a second click opens the full summary (all seven tabs) in this look. */
  roster?(ctx: RosterCtx): void;
  palette: PartyPalette;
  shape: 'round' | 'square' | 'slant' | 'pill';
  /** Non-focused rows fade (the spotlight look). */
  dimRows?: boolean;
  /** The whole window: backdrop, header band and message band, added to `root` (which already has the dark shade). */
  chrome(scene: Phaser.Scene, root: Phaser.GameObjects.Container, motion: MotionLevel): void;
}
