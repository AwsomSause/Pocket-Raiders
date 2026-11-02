// A battle style (screens redesign, Kice 2026-11-02): how the battle screen is laid out and drawn,
// following its mock-up in /mnt/project-files/redesign/battle/. Presentation only; BattleScene keeps
// every rule, input and outcome.
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
  /** Your party in order: species id and whether it has fainted. */
  party: { speciesId: string; fainted: boolean }[];
}

export type Rect = [x: number, y: number, w: number, h: number];
export type Spot = [x: number, y: number, size?: number];

/** Where a databox's parts sit (in the box's own coordinates; the box itself sits at x, y). */
export interface BoxSpec {
  x: number;
  y: number;
  /** The panel the skin draws (also the size of the low-HP glow). */
  panel: Rect;
  name: Spot;
  /** Words before the name ("TARGET // "). */
  namePrefix?: string;
  /** Upper-case the name. */
  upper?: boolean;
  /** The level, right-aligned to x; or 'inline' to follow the name ("CHARIZARD · Lv42"). */
  level: Spot | 'inline';
  /** HP gauge: left x, centre y, width, height. */
  hp: [x: number, y: number, w: number, h?: number];
  /** The gauge's own colours (fighting-game gold on dark red). */
  hpLook?: { track: number; rim: number; fill: readonly [number, number, number] };
  /** The small "HP" pill before the gauge (the original look). */
  hpTag?: boolean;
  /** HP numbers (player) or percentage (foe, when `pct`). */
  hpText?: { at: Spot; align?: 'left' | 'right'; prefix?: string; pct?: boolean };
  /** EXP strip: left x, centre y, width. */
  xp?: [x: number, y: number, w: number];
  /** Where status, Tera and other badges start. */
  status: [x: number, y: number];
  /** The Pokémon's types ("GHOST · POISON"). */
  types?: Spot;
  /** The trainer's team: a row of Poké Ball icons (or ● ○ text when the art is missing). */
  team?: Spot;
  /** The Pokémon's party icon in a circle (fighting-game portrait). */
  portrait?: Spot;
}

export interface MenuSpec {
  x: number;
  y: number;
  columns: number;
  itemWidth: number;
  itemHeight: number;
  fontSize: number;
  /** Option positions inside the menu, given the option index and count. */
  place?: (i: number, n: number) => { x: number; y: number };
  align?: 'left' | 'center' | 'right';
  angle?: (i: number, n: number) => number;
  lift?: number;
  /** Hide the pointer and glow frame (the buttons show focus themselves). */
  bare?: boolean;
  /** The focused label's colour. */
  focusColor?: string;
  /** Labels sit in the top-left corner this many pixels in (cards), instead of centred. */
  inset?: number;
  /** Upper-case the labels (FIGHT / BAG). */
  upper?: boolean;
}

/** A menu layout, or one chosen by how many options there are (and, for a combined root, how many are moves). */
export type MenuLayout = MenuSpec | ((n: number, moves: number) => MenuSpec);

/** One move as a style may label it. */
export interface MoveView {
  name: string;
  type: string;
  category: string;
  power: string;
  accuracy: string;
  pp: number;
  maxPp: number;
}

export interface BattleLayout {
  foe: BoxSpec;
  player: BoxSpec;
  /** The message bar the skin draws (null: none). */
  bar: Rect | null;
  message: { x: number; y: number; w: number; size: number; align?: 'left' | 'center' };
  /** The command window behind menus (null: none). */
  command: Rect | null;
  /** The page tabs (Attack, Party, Item, Auto, Info). */
  tabs: { x: number; y: number };
  /** The focused move's details; `inline` puts the type and category badges on the same line. */
  moveInfo: { x: number; y: number; inline?: boolean };
  root: MenuLayout;
  moves: MenuLayout;
  /** The first screen shows the moves and the other commands together (Wii channel grid); picking a move uses it at once. */
  combined?: boolean;
  /** Where the run header (stage, battle number, money) sits, right-aligned (default: top right). */
  header?: { x: number; y: number };
}

/** Something a style keeps up to date (turn counters, party rows). */
export interface BattleHud {
  update?: (info: BattleFrameInfo) => void;
}

export interface BattleSkin {
  layout: BattleLayout;
  /** Text colour on this style's panels (databoxes, message). */
  text: string;
  /** Text colour on its buttons. */
  buttonText: string;
  /** A font family for its text (default: the game's pixel font). */
  font?: string;
  /** The databox panel in `rect` (box coordinates). */
  databox: (scene: Phaser.Scene, isPlayer: boolean, rect: Rect) => Phaser.GameObjects.GameObject;
  /** The message bar in `rect`. */
  messageBar?: (scene: Phaser.Scene, rect: Rect) => Phaser.GameObjects.GameObject;
  /** The command window in `rect` (hidden until a menu opens). */
  commandWindow?: (scene: Phaser.Scene, rect: Rect) => Phaser.GameObjects.Graphics;
  /** Each menu button. */
  pill: PillPainter;
  /** Root menu tints (Fight, Bag, Pokémon, extras...). */
  rootTints?: number[];
  /** A move's button text: label and an optional second line. */
  moveText?: (m: MoveView) => { label: string; detail?: string };
  /** Drawn into the arena, above the battleback and below the Pokémon (floors, tints, a whole new backdrop). */
  backdrop?: (scene: Phaser.Scene, field: Phaser.GameObjects.Container, info: BattleFrameInfo) => void;
  /** Extras over the arena (letterbox, scanlines, broadcast bars, VS badges); may keep itself updated. */
  frame?: (scene: Phaser.Scene, info: BattleFrameInfo) => BattleHud | void;
  /** Applied to each Pokémon sprite as it appears (ink silhouettes). */
  sprite?: (visual: Phaser.GameObjects.GameObject) => void;
  /** A short opening flourish after the usual intro (title cards, VS splash). Resolves when done. */
  intro?: (scene: Phaser.Scene, info: BattleFrameInfo) => Promise<void>;
}
