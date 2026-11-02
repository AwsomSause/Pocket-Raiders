// Per-trainer VS screens for boss battles, rebuilt from the Pokémon Memories
// repo's Essentials transitions (Graphics/Transitions; art list in
// assets/catalog.ts `VS_CARDS`):
// - hgss: the HeartGold/SoulSilver bar (a Kanto leader's own colours) scrolls
//   in, the trainer's card slides onto it and the VS letters bounce and flash;
// - bw: the same with the Black/White green bar and the BW trainer card;
// - e4: the flaming Elite Four / Champion bar (Cynthia);
// - champion: a starry backdrop, a lightning beam and a tall portrait.
//
// Presentation only: fixed length, ends early on any input (skip), a still
// card with reduced motion, nothing when battle animations are off. Never
// touches battle state or gameplay random numbers.

import Phaser from 'phaser';
import type { VsStyle } from '../../assets/catalog';
import type { MotionLevel } from '../aero';
import { beat, noBeat, type Beat } from './spectacle';
import { VS_MS } from './vsLook';

export interface VsScreenArt {
  style: VsStyle;
  /** Texture keys (already loaded): the trainer's card and the bar under it. */
  card: string;
  bar: string;
}


const E4_FRAMES = 12;
const E4_FRAME_H = 192;

/** True when every texture the VS screen draws is loaded (else the regular boss intro plays). */
export function vsScreenReady(scene: Phaser.Scene, art: VsScreenArt): boolean {
  const shared = art.style === 'hgss' ? ['vs.shared.hgss_vs1', 'vs.shared.hgss_vs2'] : art.style === 'e4' ? ['vs.shared.e4_bar', 'vs.shared.hgss_vs1'] : art.style === 'champion' ? ['vs.shared.champion_bg', 'vs.shared.champion_beam', 'vs.shared.bw_vs'] : ['vs.shared.bw_vs'];
  return [art.card, ...(art.style === 'hgss' || art.style === 'bw' ? [art.bar] : []), ...shared].every((k) => scene.textures.exists(k));
}

export function vsScreen(scene: Phaser.Scene, art: VsScreenArt, motion: MotionLevel, intensity = 1): Beat {
  if (motion === 'off') return noBeat();
  const W = scene.scale.width;
  const H = scene.scale.height;
  const depth = 1000;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
    (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(depth + objs.length);
    (o as unknown as { setName(n: string): unknown }).setName('vs-screen');
    objs.push(o);
    return o;
  };
  const veil = add(scene.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0));
  const cardX = W * 0.68;
  const vsX = W * 0.27;

  if (motion === 'reduced') {
    // A still card on its bar, faded in and out.
    if (art.style === 'champion') add(scene.add.image(cardX, H, art.card).setOrigin(0.5, 1).setScale(H / 400));
    else {
      if (scene.textures.exists(art.bar) && art.style !== 'e4') add(scene.add.tileSprite(W / 2, H / 2, W, 128, art.bar).setScale(1, 1.5));
      add(scene.add.image(cardX, H / 2, art.card).setScale(1.6));
    }
    scene.tweens.add({ targets: objs, alpha: { from: 0, to: 1 }, duration: 180, yoyo: true, hold: 700 });
    return beat(scene, objs, 1100);
  }

  const total = VS_MS[art.style];
  const tw = (config: Phaser.Types.Tweens.TweenBuilderConfig) => scene.tweens.add(config);
  const flash = (at: number, alpha: number) => {
    const r = add(scene.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0));
    tw({ targets: r, fillAlpha: { from: alpha * intensity, to: 0 }, duration: 320, delay: at });
  };
  /** The VS letters: pop in, bounce, then (HGSS) flick between the two drawings. */
  const vsLetters = (at: number, key: string, alt?: string) => {
    const vs = add(scene.add.image(vsX, H / 2, key).setScale(0).setAngle(-12));
    tw({ targets: vs, scale: 2, angle: 0, duration: 380, delay: at, ease: 'Back.easeOut' });
    tw({ targets: vs, y: H / 2 - 10, duration: 160, delay: at + 420, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
    if (alt && scene.textures.exists(alt)) {
      for (let i = 0; i < 6; i++) scene.time.delayedCall(at + 450 + i * 180, () => vs.active && vs.setTexture(i % 2 ? key : alt));
    }
  };

  if (art.style === 'hgss' || art.style === 'bw') {
    // The bar grows out of a line, then scrolls fast behind the card.
    const bar = add(scene.add.tileSprite(W / 2, H / 2, W, 128, art.bar).setScale(1, 0));
    tw({ targets: bar, scaleY: art.style === 'hgss' ? 1.6 : 1.7, duration: 240, delay: 120, ease: 'Cubic.easeOut' });
    tw({ targets: bar, tilePositionX: art.style === 'hgss' ? 2400 : -2400, duration: total, ease: 'Linear' });
    const card = add(scene.add.image(W + 260, H / 2, art.card).setScale(art.style === 'hgss' ? 1.6 : 1.5));
    tw({ targets: card, x: cardX, duration: 360, delay: 300, ease: 'Back.easeOut' });
    tw({ targets: card, x: cardX - 14, duration: total - 900, delay: 700, ease: 'Sine.easeInOut' });
    flash(640, 0.75);
    vsLetters(640, art.style === 'hgss' ? 'vs.shared.hgss_vs1' : 'vs.shared.bw_vs', art.style === 'hgss' ? 'vs.shared.hgss_vs2' : undefined);
  } else if (art.style === 'e4') {
    // The flaming bar plays its twelve frames on a loop; the card burns in on top.
    const tex = scene.textures.get('vs.shared.e4_bar');
    for (let i = 0; i < E4_FRAMES; i++) if (!tex.has(`f${i}`)) tex.add(`f${i}`, 0, 0, i * E4_FRAME_H, 768, E4_FRAME_H);
    const bar = add(scene.add.image(W / 2, H / 2, 'vs.shared.e4_bar', 'f0').setScale(W / 768, 1.4).setAlpha(0));
    tw({ targets: bar, alpha: 1, duration: 200, delay: 100 });
    for (let t = 0, i = 0; t < total; t += 70, i++) scene.time.delayedCall(t, () => bar.active && bar.setFrame(`f${i % E4_FRAMES}`));
    const card = add(scene.add.image(W + 260, H / 2, art.card).setScale(1.7));
    tw({ targets: card, x: cardX, duration: 380, delay: 320, ease: 'Back.easeOut' });
    flash(680, 0.8);
    vsLetters(680, 'vs.shared.hgss_vs1', 'vs.shared.hgss_vs2');
  } else {
    // Champion: stars drift, a lightning beam cracks down the middle, the portrait rises in.
    const bg = add(scene.add.tileSprite(W / 2, H / 2, W, H, 'vs.shared.champion_bg').setAlpha(0));
    tw({ targets: bg, alpha: 1, duration: 300 });
    tw({ targets: bg, tilePositionY: -700, duration: total, ease: 'Linear' });
    const beam = add(scene.add.image(W * 0.45, H / 2, 'vs.shared.champion_beam').setDisplaySize(W * 0.9, H).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
    tw({ targets: beam, alpha: { from: 1, to: 0.55 }, duration: 90, delay: 420, yoyo: true, repeat: 8 });
    const card = add(scene.add.image(cardX + 40, H + 420, art.card).setOrigin(0.5, 1).setScale(H / 400));
    tw({ targets: card, y: H, duration: 520, delay: 300, ease: 'Cubic.easeOut' });
    for (const [i, key] of (['vs.shared.champion_shine1', 'vs.shared.champion_shine2'] as const).entries()) {
      if (!scene.textures.exists(key)) continue;
      const shine = add(scene.add.image(cardX + (i ? 90 : -70), H * (i ? 0.62 : 0.3), key).setBlendMode(Phaser.BlendModes.ADD).setScale(0));
      tw({ targets: shine, scale: 1.2, alpha: { from: 1, to: 0 }, angle: 90, duration: 700, delay: 900 + i * 300, repeat: 1 });
    }
    flash(420, 0.9);
    vsLetters(820, 'vs.shared.bw_vs');
  }
  // Out: a white flash and everything fades into the arena.
  flash(total - 300, 0.6);
  tw({ targets: objs.filter((o) => o !== veil), alpha: 0, duration: 260, delay: total - 280 });
  tw({ targets: veil, alpha: 0, duration: 260, delay: total - 280 });
  return beat(scene, objs, total);
}
