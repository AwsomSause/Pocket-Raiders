// Dynamax, remade (animation redesign pass 20, "one long camera move"): the Pokémon is recalled, the ball swells
// in the hand and is thrown out of the top of the screen, and the camera follows it. Cut: the trainer's shoes and
// one foot the size of a house. The camera climbs the giant without a cut, through storm cloud and lightning, and
// stops at its face above the weather as it roars. The page locks with its title and facts, then the camera drops
// back to the field, where the giant stands. Built beat for beat from plans/animation-redesign/src/p20.js.
// Presentation only.

import Phaser from 'phaser';
import { ballVisual } from '../ballArt';
import type { Visual } from '../sprites';
import { GimmickStage, firstSprite, type GimmickFeel, type GimmickPage } from './gimmickStage';
import type { Beat } from './spectacle';

export interface DynamaxPanOptions extends GimmickFeel {
  kind: 'dynamax' | 'gigantamax';
  /** The Pokémon standing on the field (read again after the swap, when it is the giant). */
  field: () => Visual | null | undefined;
  /** The giant's front picture, built by the caller. */
  makeGiantFront: (x: number, y: number) => Visual;
  /** The trainer who Dynamaxes it, seen small beside the foot, or null. */
  makeTrainer: ((x: number, y: number) => Visual) | null;
  /** The other side's Pokémon, seen small beside the foot, or null. */
  makeOther: ((x: number, y: number) => Visual) | null;
  /** The ball it is recalled into. */
  ballItem: string;
  /** True when the Pokémon is the foe's: everything is mirrored. */
  opposes: boolean;
  /** Shows the giant in the battle behind the scene (plays its cry). */
  onSwap: () => void;
  page: GimmickPage;
  /** The key item's picture (Dynamax Band), or null. */
  itemKey?: string | null;
  /** The storm cloud picture, or null for plain cloud. */
  cloudKey?: string | null;
}

/** When the camera cuts to the giant's foot, in ms. */
export const DMAX_CUT = 2150;
/** When the camera reaches the giant's face and it roars. */
export const DMAX_ROAR = DMAX_CUT + 2900;
/** When the page locks. */
export const DMAX_LOCK = DMAX_ROAR + 650;
/** When the camera drops back to the field. */
export const DMAX_DROP = DMAX_LOCK + 3000;
export const DMAX_LENGTH = DMAX_DROP + 300 + 1100;

const MON_BOX: [number, number, number, number] = [487, 43, 465, 403];
const PINK = 0xff2d8a;
/** The height of the one tall picture the camera climbs. */
const TALL = 2200;
/** The ground line in it, and the giant's height on it. */
const GROUND = 2176;
const GIANT = 1920;
/** Where the camera stops: the giant's face. */
const FACE = 1186;

export function dynamaxPan(scene: Phaser.Scene, o: DynamaxPanOptions): Beat {
  const S = new GimmickStage(scene, o.kind, o);
  const { W, H } = S;
  const mir = o.opposes;
  const mx = (x: number): number => (mir ? W - x : x);
  const has = (k: string | null | undefined): k is string => Boolean(k) && scene.textures.exists(k!);
  const cam = scene.cameras.main;

  const real = firstSprite(o.field());
  const m = real ? real.getWorldTransformMatrix() : null;
  const X = m ? m.tx : mir ? 648 : 312;
  const FY = m ? m.ty : mir ? 240 : 428;
  const tall = real ? Math.max(90, real.displayHeight * real.originY * (m ? Math.abs(m.scaleY / (real.scaleY || 1)) : 1)) : 200;
  const Y = FY - tall / 2;
  const hand = { x: mx(60), y: mir ? 150 : 420 };

  let swapped = false;
  const before = o.field();
  const showReal = (): void => {
    if (before?.active) before.setVisible(true).setData('motionShadow', 1);
  };
  const swap = (): void => {
    if (swapped) return;
    swapped = true;
    showReal();
    o.onSwap();
  };
  S.onEnd(showReal);

  S.itemChip(o.itemKey, mir, 1000);

  // ---- Recall: a red beam, and the Pokémon is pulled into the ball. ----
  S.streak(850, { x1: X, y1: Y, x2: hand.x, y2: hand.y, w: 8, color: 0xff5a5a, d: 140, hold: 100, out: 120, layer: 6 });
  S.at(850, () => S.sound('se.ball_catch', 0.6));
  S.at(900, () => {
    const shot = S.copyOf(() => firstSprite(o.field()), 2, 0xff5a5a, false);
    if (!shot || !before?.active) return;
    shot.setAlpha(1);
    before.setVisible(false).setData('motionShadow', 0);
    scene.tweens.add({ targets: shot, scaleX: 0, scaleY: 0, x: hand.x, y: hand.y, duration: 200 / o.speed, ease: 'Quad.easeIn', onComplete: () => shot.destroy() });
  });

  // ---- The ball swells in the hand, then is thrown out of the top of the screen; the camera follows. ----
  const ball = S.add(ballVisual(scene, o.ballItem, hand.x, hand.y, 3), 8).setScale(0);
  const halo = S.glow(hand.x, hand.y, 30, PINK, 7).setAlpha(0);
  const haloSize = halo.scale;
  S.to(ball, 1080, 150, { scale: 3 }, 'back2');
  S.to(ball, 1230, 450, { scale: 9 }, 'io');
  S.to(halo, 1230, 450, { alpha: 0.9, scale: haloSize * 4 }, 'io');
  S.shake(1250, 400, 5);
  S.at(1230, () => S.sound('ess-refresh', 0.7));
  S.at(1720, () => {
    halo.setVisible(false);
    const to = { x: mx(520), y: -160 };
    const path = { u: 0 };
    scene.tweens.add({
      targets: path,
      u: 1,
      duration: 400 / o.speed,
      onUpdate: () => {
        const u = path.u;
        ball.setPosition(hand.x + (to.x - hand.x) * u, hand.y + (to.y - hand.y) * u - 60 * 4 * u * (1 - u)).setAngle(-500 * u * (mir ? -1 : 1));
      },
    });
    S.sound('ess-flash2', 0.5);
  });
  S.at(1760, () => scene.tweens.add({ targets: cam, scrollY: -70, duration: 380 / o.speed, ease: 'Quad.easeIn' }));
  S.onEnd(() => scene.tweens.killTweensOf(cam));
  S.flash(DMAX_CUT, 200, PINK, 1);
  S.at(DMAX_CUT + 50, () => {
    scene.tweens.killTweensOf(cam);
    cam.setScroll(0, 0);
  });

  // ---- The one tall picture: night at the top, storm in the middle, the stadium floor at the bottom. ----
  const strip = S.add(scene.add.container(mir ? W : 0, H - TALL), 10).setVisible(false);
  if (mir) strip.setScale(-1, 1);
  const sky = S.canvas('sky', 32, TALL);
  if (sky) {
    const c = sky.getContext();
    const g = c.createLinearGradient(0, 0, 0, TALL);
    g.addColorStop(0, '#12020c');
    g.addColorStop(0.4, '#4a0a2a');
    g.addColorStop(0.7, '#a01a58');
    g.addColorStop(0.96, '#ff5aa6');
    g.addColorStop(0.961, '#1a0410');
    g.addColorStop(1, '#1a0410');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, TALL);
    sky.refresh();
    strip.add(scene.add.image(-40, 0, sky.key).setOrigin(0, 0).setDisplaySize(W + 80, TALL));
  } else strip.add(scene.add.rectangle(0, 0, W, TALL, 0x4a0a2a).setOrigin(0, 0));
  for (let i = 0; i < 9; i += 1) {
    strip.add(scene.add.circle(60 + i * 105, 2096, 16, 0xffd6ef, 0.35).setBlendMode(Phaser.BlendModes.ADD));
    strip.add(scene.add.circle(60 + i * 105, 2096, 5, 0xffffff, 1));
  }
  // The giant: so large that only its near side fits on the screen.
  try {
    const giant = S.stand(o.makeGiantFront(0, 0), 1000, GROUND, GIANT);
    for (const p of giant instanceof Phaser.GameObjects.Container ? (giant.list as Phaser.GameObjects.Sprite[]) : [giant]) p.setTint?.(0xe0b8cc);
    strip.add(giant);
  } catch {
    // Without its picture the climb still plays over the storm.
  }
  for (const [make, x, h] of [[o.makeTrainer, 150, 92], [o.makeOther, 360, 84]] as const) {
    if (!make) continue;
    try {
      strip.add(S.stand(make(0, 0), x, GROUND + 3, h));
    } catch {
      // A missing small figure is left out.
    }
  }
  ([[1810, 0.9, 1], [1560, 0.85, -1], [1345, 0.9, 1], [640, 0.6, -1]] as const).forEach(([y, a, d]) => {
    if (has(o.cloudKey)) {
      const src = scene.textures.get(o.cloudKey).getSourceImage();
      const cloud = scene.add.tileSprite(480, y, 3200, 190, o.cloudKey).setAlpha(a).setTileScale(190 / Math.max(1, src.height));
      strip.add(cloud);
      scene.tweens.add({ targets: cloud, tilePositionX: -d * 300, duration: 12000 / o.speed });
      S.onEnd(() => scene.tweens.killTweensOf(cloud));
    } else {
      for (let i = 0; i < 7; i += 1) strip.add(scene.add.ellipse(i * 170 + (d > 0 ? 0 : 60), y + (i % 2) * 22, 300, 110, 0x2a0618, a * 0.8));
    }
  });
  S.at(DMAX_CUT, () => {
    strip.setVisible(true);
    ball.setVisible(false);
    swap();
    S.sound('ess-explosion', 0.5);
  });
  // A heavy step, then the climb.
  S.jolt(strip, DMAX_CUT + 220, 14);
  S.dust(DMAX_CUT + 220, mx(720), 500, 12, 0x5a2a44);
  S.dust(DMAX_CUT + 220, mx(940), 500, 8, 0x5a2a44);
  S.to(strip, DMAX_CUT + 600, 2200, { y: H / 2 - FACE }, 'io');
  [1300, 1900, 2400].forEach((d, i) => {
    S.at(DMAX_CUT + d, () => {
      const draw = (): void => {
        const g = S.add(scene.add.graphics(), 20);
        const x1 = mx(120 + i * 330), x2 = mx(200 + i * 260);
        const pts: [number, number][] = [];
        for (let k = 0; k <= 8; k += 1) pts.push([x1 + ((x2 - x1) * k) / 8 + (k && k < 8 ? S.rnd(-40, 40) : 0), (H * k) / 8]);
        for (const [w, c] of [[12, PINK], [6, 0xffffff]] as const) {
          g.lineStyle(w, c, 1);
          g.beginPath();
          g.moveTo(pts[0]![0], pts[0]![1]);
          for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
          g.strokePath();
        }
        scene.tweens.add({ targets: g, alpha: 0, duration: 110 / o.speed, onComplete: () => g.destroy() });
      };
      draw();
      S.at(120, draw);
      S.sound('ess-flash2', 0.6);
    });
    S.flash(DMAX_CUT + d, 100, PINK, 0.3);
  });

  // ---- Its face, above the weather: the roar. ----
  for (let i = 0; i < 4; i += 1) S.ring(DMAX_ROAR + i * 100, { x: mx(430), y: 300, r0: 30, r1: 260 + i * 130, color: i % 2 ? PINK : 0xffffff, w: 9, d: 550, layer: 21 });
  S.jolt(strip, DMAX_ROAR, 18);
  S.jolt(strip, DMAX_ROAR + 200, 10);
  S.flash(DMAX_ROAR, 200, PINK, 0.45);
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2 + S.rnd(-0.1, 0.1);
    const r0 = S.rnd(260, 340), r1 = 700;
    S.streak(DMAX_ROAR + S.rnd(0, 200), { x1: W / 2 + Math.cos(a) * r1, y1: H / 2 + Math.sin(a) * r1, x2: W / 2 + Math.cos(a) * r0, y2: H / 2 + Math.sin(a) * r0, w: 4, d: 120, hold: 120, out: 160, alpha: 0.8, layer: 21 });
  }
  S.at(DMAX_ROAR, () => S.sound('ess-explosion', 0.9));

  // ---- The page. ----
  const bg = S.backdrop('bg', { key: 'cine.raid.max.bg', c1: '#ff5aa6', c2: '#5a0a34', rays: { x: 700, y: 250, color: 'rgba(255,90,166,0.35)', n: 30 }, mirror: mir }, 25).setVisible(false);
  S.at(DMAX_LOCK, () => {
    strip.setVisible(false);
    bg.setVisible(true);
  });
  S.flash(DMAX_LOCK, 350, 0xffffff, 0.95);
  S.jolt(bg, DMAX_LOCK, 16);
  const big = S.bigMon('mon', o.makeGiantFront, MON_BOX, mir, 26);
  if (big) {
    big.setVisible(false).setScale(1.5);
    S.at(DMAX_LOCK + 50, () => big.setVisible(true));
    S.to(big, DMAX_LOCK + 50, 220, { scale: 1 }, 'in3');
    S.to(big, DMAX_LOCK + 270, 50, { scaleY: 0.96 });
    S.to(big, DMAX_LOCK + 320, 300, { scaleY: 1 }, 'el');
    S.to(big, DMAX_DROP, 300, { y: big.y + H }, 'in3');
  }
  const page = S.page(DMAX_LOCK + 50, o.page, mir);
  page.out(DMAX_DROP);

  // ---- The camera drops back to the field, where the giant stands. ----
  S.to(bg, DMAX_DROP, 300, { y: H / 2 + H }, 'in3');
  const L = DMAX_DROP + 300;
  S.land(o.field, L, 1.17, 400, 'el');
  S.shake(L, 500, 18);
  S.dust(L, X - 80, FY, 10);
  S.dust(L, X + 90, FY, 10);
  S.ring(L, { x: X, y: FY, r1: 330, color: PINK, w: 10, d: 600, flat: 0.35, layer: 3 });

  return S.run(DMAX_LENGTH, swap);
}
