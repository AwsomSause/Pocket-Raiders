// Evolution looks (screens redesign, Group D): a frame of light, patterns and a caption drawn around the
// evolving Pokémon, in the style's own language. Presentation only: the cinematic decides the timing and
// the form swap; the centre stays clear so the Pokémon always reads. Deterministic (no gameplay RNG).

import Phaser from 'phaser';
import type { ScreenStyleId } from '../../core/presentation/screenStyles';
import { paintPattern } from '../dSkins';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';

type EvolveStyle = ScreenStyleId<'evolve'>;

interface Look {
  pattern: Parameters<typeof paintPattern>[2];
  color: number;
  alpha: number;
  caption: string;
  mark: string;
  captionColor: string;
  stroke: string;
  /** Caption plate colour and where it sits (top or bottom). */
  plate: number;
  at: 'top' | 'bottom';
  slam: boolean;
}

const LOOKS: Record<EvolveStyle, Look> = {
  aero: { pattern: 'bubbles', color: 0xcdeeff, alpha: 0.6, caption: 'Evolution!', mark: '', captionColor: '#ffffff', stroke: '#0a3a78', plate: 0x2a78c8, at: 'top', slam: false },
  classic: { pattern: 'scan', color: 0xbfd8ff, alpha: 0.18, caption: 'What? It is evolving!', mark: '', captionColor: '#ffffff', stroke: '#101a3a', plate: 0x101a3a, at: 'bottom', slam: false },
  shonen: { pattern: 'speed', color: 0xfff0a0, alpha: 0.4, caption: 'POWER UP!!', mark: '', captionColor: '#fff0a0', stroke: '#8a0a0a', plate: 0xc01a1a, at: 'top', slam: true },
  ink: { pattern: 'ink', color: 0x101010, alpha: 0.7, caption: 'EVOLVE!', mark: '', captionColor: '#f4ecdc', stroke: '#000000', plate: 0xc0282a, at: 'bottom', slam: true },
  episode: { pattern: 'letterbox', color: 0xf0d060, alpha: 1, caption: 'EPISODE: A NEW FORM', mark: '', captionColor: '#f0d060', stroke: '#000000', plate: 0x000000, at: 'bottom', slam: false },
  dna: { pattern: 'helix', color: 0x7ff3ff, alpha: 0.85, caption: 'Rewriting…', mark: '', captionColor: '#aaf4ec', stroke: '#04282e', plate: 0x061c22, at: 'top', slam: false },
  eyecatch: { pattern: 'sparkle', color: 0xffe08a, alpha: 0.9, caption: 'TO BE CONTINUED…', mark: '', captionColor: '#ffffff', stroke: '#c01a4a', plate: 0xff5a8a, at: 'bottom', slam: true },
};

/**
 * Draws the look into one container (the cinematic fades it out with its other layers).
 * `tw` is the cinematic's tween helper, so the look follows the playback speed.
 */
export function evolveLook(
  scene: Phaser.Scene,
  style: EvolveStyle,
  o: { x: number; y: number },
  depth: number,
  add: <T extends Phaser.GameObjects.GameObject>(obj: T) => T,
  tw: (config: Phaser.Types.Tweens.TweenBuilderConfig) => unknown,
): void {
  const look = LOOKS[style];
  const box = add(scene.add.container(0, 0).setDepth(depth));
  box.setAlpha(0);
  tw({ targets: box, alpha: 1, duration: 300 });
  paintPattern(scene, box, look.pattern, look.color, look.alpha, false, { x: o.x - GAME_WIDTH / 2, y: 0, w: GAME_WIDTH, h: GAME_HEIGHT });
  // A caption plate along the top or bottom edge; the Pokémon sits between.
  const y = look.at === 'top' ? 34 : GAME_HEIGHT - 120;
  const plate = scene.add.graphics().fillStyle(look.plate, 0.88).fillRoundedRect(GAME_WIDTH / 2 - 230, y - 22, 460, 44, style === 'classic' || style === 'episode' ? 3 : 18);
  const text = scene.add.text(GAME_WIDTH / 2, y, look.caption, textStyle(26, look.captionColor, { stroke: look.stroke, strokeThickness: 5 })).setOrigin(0.5);
  box.add([plate, text]);
  if (look.slam) {
    box.setScale(1);
    text.setScale(2.4).setAlpha(0);
    tw({ targets: text, scale: 1, alpha: 1, duration: 260, delay: 250, ease: 'Back.easeOut' });
  } else {
    text.setAlpha(0);
    tw({ targets: text, alpha: 1, duration: 400, delay: 250 });
  }
}
export const EVOLVE_STYLE_IDS = Object.keys(LOOKS) as EvolveStyle[];
