// Standing (animation redesign pass 11): each Pokémon breathes and moves in place in its own way between turns
// (`standLook` in core/presentation/motionBasics). The loops run on the sprite itself, so code that pauses or stops a
// sprite's tweens stops them too; `standStill` puts the sprite back exactly where and how big it stood.
// Presentation only.

import Phaser from 'phaser';
import { standLook, type StandKind } from '../../core/presentation/motionBasics';
import { spritesAnimate } from '../display';

const BASE = 'standBase';
const LOOPS = 'standLoops';
/** A hit's recoil playing on the sprite (`{ stop }`); `standStill` ends it so nothing else starts from mid-recoil. */
export const HIT_RUN = 'hitRun';

type Base = { y: number; sx: number; sy: number; angle: number; x?: number };

/** Stops a sprite's standing loops and puts it back at its resting place, size and angle. */
export function standStill(scene: Phaser.Scene, v: Phaser.GameObjects.Sprite): void {
  // A hit's recoil still playing ends first (in its end state: on its spot, at its size).
  const hit = v.getData(HIT_RUN) as { stop: () => void } | undefined;
  v.setData(HIT_RUN, undefined);
  hit?.stop();
  const loops = v.getData(LOOPS) as Phaser.Tweens.Tween[] | undefined;
  // stop(), not remove(): a TweenChain (the paralysis twitch) has its own remove(child) that throws without one.
  loops?.forEach((t) => t.stop());
  v.setData(LOOPS, undefined);
  const base = v.getData(BASE) as Base | undefined;
  if (base && v.active) v.setPosition(base.x ?? v.x, base.y).setScale(base.sx, base.sy).setAngle(base.angle);
  v.setData(BASE, undefined);
  void scene;
}

/**
 * Starts a Pokémon standing its own way (after `delay` ms) at its size now. `restY` is its resting height on the
 * field (it may still be settling from an entrance); left out, where it is now. `ms` overrides the breath length.
 */
export function stand(scene: Phaser.Scene, v: Phaser.GameObjects.GameObject, kind: StandKind, full: boolean, delay = 0, ms?: number, restY?: number): void {
  if (!full || !spritesAnimate() || !(v instanceof Phaser.GameObjects.Sprite)) return;
  scene.time.delayedCall(delay, () => {
    if (!v.active) return;
    standStill(scene, v);
    const look = standLook(kind);
    const base: Base = { y: restY ?? v.y, sx: v.scaleX, sy: v.scaleY, angle: v.angle };
    v.setData(BASE, base);
    const breath = ms ?? look.ms;
    const loops: Phaser.Tweens.Tween[] = [];
    const loop = (props: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>): void => {
      loops.push(scene.tweens.add({ targets: v, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', ...props }));
    };
    loop({ scaleY: base.sy * look.sy, scaleX: base.sx * look.sx, duration: breath / 2 });
    if (look.rise) loop({ y: { from: base.y, to: base.y - look.rise }, duration: breath / 2 });
    if (look.tilt) loop({ angle: { from: base.angle - look.tilt, to: base.angle + look.tilt }, duration: look.tiltMs / 2 });
    if (look.hop) loop({ y: { from: base.y, to: base.y - look.hop }, duration: look.hopEvery / 9, ease: 'Quad.easeOut', repeatDelay: look.hopEvery - (2 * look.hopEvery) / 9, delay: (look.hopEvery * 3) / 9 });
    v.setData(LOOPS, loops);
  });
}

/**
 * Paralysis (pass 8): it stands locked, and every 1.1 s it twitches: 4 px one way, 3 px the other, back. The twitch is
 * a standing loop, so `standStill` ends it and puts it back at `restX`.
 */
export function twitch(scene: Phaser.Scene, v: Phaser.GameObjects.GameObject, full: boolean, restX: number): void {
  if (!full || !spritesAnimate() || !(v instanceof Phaser.GameObjects.Sprite) || !v.active) return;
  standStill(scene, v);
  v.setData(BASE, { y: v.y, sx: v.scaleX, sy: v.scaleY, angle: v.angle, x: restX } satisfies Base);
  const step = 1100 / 6;
  const chain = scene.tweens.chain({
    targets: v,
    loop: -1,
    tweens: [
      { x: restX, duration: step * 3 },
      { x: restX + 4, duration: step },
      { x: restX - 3, duration: step },
      { x: restX, duration: step },
    ],
  });
  v.setData(LOOPS, [chain]);
}

/** Confused (pass 8): it sways under its circling stars, tipping and leaning each way in turn. */
export function sway(scene: Phaser.Scene, v: Phaser.GameObjects.GameObject, full: boolean, restX: number, rot: number, dx: number, ms: number): void {
  if (!full || !spritesAnimate() || !(v instanceof Phaser.GameObjects.Sprite) || !v.active) return;
  standStill(scene, v);
  v.setData(BASE, { y: v.y, sx: v.scaleX, sy: v.scaleY, angle: v.angle, x: restX } satisfies Base);
  const q = ms / 4;
  const ease = 'Sine.easeInOut';
  const chain = scene.tweens.chain({
    targets: v,
    loop: -1,
    tweens: [
      { angle: rot, x: restX + dx, duration: q, ease },
      { angle: 0, x: restX, duration: q, ease },
      { angle: -rot, x: restX - dx, duration: q, ease },
      { angle: 0, x: restX, duration: q, ease },
    ],
  });
  v.setData(LOOPS, [chain]);
}
