// Contract between MapScene (state, input, travel) and a map look (how the backdrop, routes and stops are drawn).
// A skin only paints: it never changes which stops exist or what they do.
import type Phaser from 'phaser';
import type { MotionLevel } from '../aero';

export interface Pt {
  x: number;
  y: number;
}

export interface MapSkin {
  /** Draws a frame or title over the scenery (the Town Map border, the panorama's biome names...). */
  frame?(scene: Phaser.Scene, motion: MotionLevel, ctx: { title: string; types: string[] }): void;
  /** Paints over the bottom panel's background, before its buttons are added (the Wii menu's light bar). */
  bar?(scene: Phaser.Scene, ctx: { clock: string; money: number; cap: number }): void;
  /** Writes the stop's kind under its token (the Wii channel tiles). */
  labels?: boolean;
  /** Shows the choices as big cards with a "Further ahead" strip instead of the node web (Next-Stop Cards). */
  cards?: boolean;
  /** The full-screen scenery, drawn under the map and the panels. */
  backdrop(scene: Phaser.Scene, motion: MotionLevel): void;
  /** One route segment between two stops. */
  edge(g: Phaser.GameObjects.Graphics, a: Pt, b: Pt, s: { open: boolean; walked: boolean }): void;
  /** One stop's token (the glyph, ball or boss art is drawn on top by the scene). */
  token(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, s: { color: number; alpha: number; boss: boolean; current: boolean; reachable: boolean }): void;
}
