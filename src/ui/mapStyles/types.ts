// Contract between MapScene (state, input, travel) and a map look (how the backdrop, routes and stops are drawn).
// A skin only paints: it never changes which stops exist or what they do.
import type Phaser from 'phaser';
import type { MotionLevel } from '../aero';

export interface Pt {
  x: number;
  y: number;
}

export interface MapSkin {
  /** The full-screen scenery, drawn under the map and the panels. */
  backdrop(scene: Phaser.Scene, motion: MotionLevel): void;
  /** One route segment between two stops. */
  edge(g: Phaser.GameObjects.Graphics, a: Pt, b: Pt, s: { open: boolean; walked: boolean }): void;
  /** One stop's token (the glyph, ball or boss art is drawn on top by the scene). */
  token(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, s: { color: number; alpha: number; boss: boolean; current: boolean; reachable: boolean }): void;
}
