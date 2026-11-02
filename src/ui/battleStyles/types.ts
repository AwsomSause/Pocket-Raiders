// A battle style (screens redesign, Kice 2026-11-02): how the battle screen's panels, buttons and
// overlays look. Presentation only; BattleScene keeps every rule, input and outcome.
import type Phaser from 'phaser';
import type { PillPainter } from '../widgets';
import type { MotionLevel } from '../aero';

/** What a style may show around the battle (only things the player can already see). */
export interface BattleFrameInfo {
  player: string;
  foe: string;
  /** The foe trainer's title, or null for a wild battle. */
  trainer: string | null;
  turn: number;
  region: string;
  motion: MotionLevel;
  reducedFlash: boolean;
}

export interface BattleSkin {
  /** Text colour on this style's panels (databoxes, message bar). */
  text: string;
  /** Text colour on its buttons. */
  buttonText: string;
  /** The databox behind a Pokémon's name and HP, in the box's own coordinates (player 16,2,366,128; foe 6,4,360,100). */
  databox: (scene: Phaser.Scene, isPlayer: boolean, rim: number) => Phaser.GameObjects.GameObject;
  /** The long message bar along the bottom. */
  messageBar: (scene: Phaser.Scene, x: number, y: number, w: number, h: number) => Phaser.GameObjects.GameObject;
  /** The command window on the bar's right (hidden until a menu opens). */
  commandWindow: (scene: Phaser.Scene, x: number, y: number, w: number, h: number) => Phaser.GameObjects.Graphics;
  /** Each menu button. */
  pill: PillPainter;
  /** How the move menu is laid out (default: a 2x2 grid in the message bar). `place` gets the option index and count; (0,0) is the bar's top-left. `floating` moves sit over the arena, so the bar keeps its prompt. */
  moveMenu?: { floating?: boolean; columns: number; itemWidth: number; itemHeight: number; fontSize: number; place?: (i: number, n: number) => { x: number; y: number } };
  /** Root menu tints (Fight, Bag, Pokémon, extras...). */
  rootTints?: number[];
  /** Extras drawn once over the arena (letterbox, scanlines, broadcast bars). */
  frame?: (scene: Phaser.Scene, info: BattleFrameInfo) => void;
  /** A short opening flourish after the usual intro (title cards, VS splash). Resolves when done. */
  intro?: (scene: Phaser.Scene, info: BattleFrameInfo) => Promise<void>;
}
