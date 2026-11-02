// Contract between RewardScene (the draft, the pick, the party/bag buttons) and a reward look.
// A skin only paints and animates the cards: which reward is picked and what it does stay in the scene.
import type Phaser from 'phaser';
import type { MotionLevel } from '../aero';

export interface RewardInk {
  title: string;
  sub: string;
  name: string;
  desc: string;
  cmp: string;
  why: string;
  keep: string;
  hint: string;
}

export interface CardSpec {
  w: number;
  /** The rarity colour. */
  rim: number;
  index: number;
  motion: MotionLevel;
}

export interface RewardSkin {
  /** Light card faces: the scene uses dark text on them. */
  light?: boolean;
  /** The heading ("Choose one reward"); `n` is the encounter number. */
  title?: (n: number) => string;
  backdrop(scene: Phaser.Scene, motion: MotionLevel): void;
  /** The card face, painted into g with the card centred at (0, 0): x -w/2..w/2, y -135..135. */
  card(g: Phaser.GameObjects.Graphics, c: CardSpec): void;
  /** Called once the card's contents exist. `icon` is the item picture. Extra animation or ornaments go here. */
  decorate?(scene: Phaser.Scene, card: Phaser.GameObjects.Container, icon: Phaser.GameObjects.GameObject, c: CardSpec): void;
  /** Bigger names and HP under the party strip icons (the whole team on the trail). */
  teamNames?: boolean;
}

export const DARK_INK: RewardInk = { title: '#f4f1ff', sub: '#a69cb4', name: '#ffffff', desc: '#cfe0f0', cmp: '#ffe9a8', why: '#9fe8c8', keep: '#f0e0a0', hint: '#a69cb4' };
export const LIGHT_INK: RewardInk = { title: '#12324f', sub: '#3a5a78', name: '#10304a', desc: '#27465f', cmp: '#7a5200', why: '#0f6a46', keep: '#7a5200', hint: '#3a5a78' };
