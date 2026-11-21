// The Z-Move, remade (animation redesign pass 20, "the move is the cutscene"): the Z rises over the Pokémon, it
// leaves the top of the screen, and the view cuts to the sky looking down: the target small on the field, a shadow
// growing around it, and the Pokémon coming down wrapped in its Z-Power. The damage is counted out in huge
// numbers, the title and facts hold, and the Pokémon lands back on its place. Built beat for beat from
// plans/animation-redesign/src/p20.js, with one change for Kice's rule that a move's own effect is never drawn:
// what falls is the Pokémon in its light, not a picture of the move. The battle's own move animation and the
// HP bar follow after the cutscene, as before. Presentation only.

import Phaser from 'phaser';
import type { Visual } from '../sprites';
import { textStyle } from '../theme';
import { GimmickStage, RAINBOW, firstSprite, type GimmickFeel, type GimmickPage } from './gimmickStage';
import type { Beat } from './spectacle';

export interface ZMoveSkyOptions extends GimmickFeel {
  /** The Pokémon standing on the field. */
  field: () => Visual | null | undefined;
  /** Its front picture and the target's, built by the caller. */
  makeFront: (x: number, y: number) => Visual;
  makeTarget: ((x: number, y: number) => Visual) | null;
  /** True when the Pokémon is the foe's: the page is mirrored. */
  opposes: boolean;
  /** The move's type colour. */
  tint: number;
  page: GimmickPage;
  /** The key item's picture (Z-Ring), or null. */
  itemKey?: string | null;
  /** The Z-Move's title art when the pack has one; otherwise its name is written. */
  titleKey?: string | null;
  title?: string | null;
  /** What the hit did, already decided by the rules before the cutscene plays: the damage and how well it worked. Null when it did no damage. */
  hit?: { damage: number; effectiveness: number } | null;
}

/** When the view cuts to the sky, in ms. */
export const Z_SKY = 1850;
/** When the Pokémon arrives. */
export const Z_IMPACT = Z_SKY + 1050;
/** When the page locks. */
export const Z_LOCK = Z_IMPACT + 1650;
/** When the view returns to the field. */
export const Z_BACK = Z_LOCK + 2800;
export const Z_LENGTH = Z_BACK + 250 + 700;

const MON_BOX: [number, number, number, number] = [594, 112, 296, 324];
const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

export function zMoveSky(scene: Phaser.Scene, o: ZMoveSkyOptions): Beat {
  const S = new GimmickStage(scene, 'zmove', o);
  const { W, H } = S;
  const mir = o.opposes;
  const mx = (x: number): number => (mir ? W - x : x);
  const has = (k: string | null | undefined): k is string => Boolean(k) && scene.textures.exists(k!);
  const cam = scene.cameras.main;
  const type = Phaser.Display.Color.ValueToColor(o.tint);

  const real = firstSprite(o.field());
  const before = o.field();
  const m = real ? real.getWorldTransformMatrix() : null;
  const X = m ? m.tx : mir ? 648 : 312;
  const FY = m ? m.ty : mir ? 240 : 428;
  const tall = real ? Math.max(90, real.displayHeight * real.originY * (m ? Math.abs(m.scaleY / (real.scaleY || 1)) : 1)) : 200;
  const Y = FY - tall / 2;
  const showReal = (): void => {
    if (before?.active) before.setVisible(true).setData('motionShadow', 1);
  };
  S.onEnd(showReal);

  // ---- Open: the arena dims, the Z-Ring shows, the Pokémon glows, and the Z rises over it. ----
  const dim = S.full(0x05060d, 0, 0);
  S.to(dim, 800, 300, { alpha: 0.5 });
  const aura = S.glow(X, Y, tall * 0.9, 0xfff04d).setAlpha(0);
  S.to(aura, 800, 300, { alpha: 0.7 });
  S.to(aura, 1500, 200, { alpha: 0 });
  const ghost = S.copyOf(() => firstSprite(o.field()), 2);
  S.itemChip(o.itemKey, mir);
  const zTex = S.canvas('z', 300, 400);
  if (zTex) {
    const c = zTex.getContext();
    const g = c.createLinearGradient(0, 0, 300, 400);
    RAINBOW.forEach((col, i) => g.addColorStop(i / 5, hex(col)));
    c.beginPath();
    for (const [i, [x, y]] of ([[30, 30], [270, 30], [270, 95], [125, 305], [270, 305], [270, 370], [30, 370], [30, 305], [175, 95], [30, 95]] as const).entries()) (i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 10;
    c.lineJoin = 'round';
    c.strokeStyle = '#ffffff';
    c.stroke();
    zTex.refresh();
    const z = S.add(scene.add.image(X, Y - 20, zTex.key).setScale(0).setAngle(-120).setAlpha(0), 5);
    S.at(850, () => z.setAlpha(0.9));
    S.to(z, 850, 300, { scale: 0.55, angle: 0 }, 'back');
    S.to(z, 1400, 150, { scale: 1.4, alpha: 0 });
  }
  S.at(850, () => S.sound('ess-twine', 0.6));

  // ---- It crouches and leaves the top of the screen; the camera looks up after it. ----
  S.at(1400, () => {
    const shot = S.copyOf(() => firstSprite(o.field()), 3, undefined, false);
    ghost?.setVisible(false);
    if (!shot || !before?.active) return;
    before.setVisible(false).setData('motionShadow', 0);
    const y0 = shot.y;
    scene.tweens.chain({
      targets: shot,
      tweens: [
        { y: y0 + 14, duration: 100 / o.speed, ease: 'Quad.easeOut' },
        { y: y0 - 760, duration: 220 / o.speed, ease: 'Cubic.easeIn' },
      ],
    });
  });
  S.streak(1500, { x1: X, y1: FY, x2: X, y2: -60, w: 40, color: 0xfff04d, d: 120, hold: 100, out: 200, alpha: 0.85, layer: 4 });
  S.dust(1500, X, FY, 12);
  S.at(1500, () => {
    scene.tweens.add({ targets: cam, scrollY: -60, duration: 300 / o.speed, ease: 'Quad.easeIn' });
    S.sound('ess-flash2', 0.7);
  });
  S.onEnd(() => scene.tweens.killTweensOf(cam));
  S.flash(Z_SKY, 150, 0xffffff, 1);
  S.at(Z_SKY + 50, () => {
    scene.tweens.killTweensOf(cam);
    cam.setScroll(0, 0);
  });

  // ---- The sky, looking down. ----
  const skyTex = S.canvas('sky', W, H);
  if (skyTex) {
    const c = skyTex.getContext();
    c.save();
    c.translate(W / 2, H * 0.96);
    c.scale(1, 0.75);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, W * 0.8);
    g.addColorStop(0, type.clone().lighten(45).rgba);
    g.addColorStop(0.45, type.clone().darken(18).rgba);
    g.addColorStop(1, type.clone().darken(78).rgba);
    c.fillStyle = g;
    c.fillRect(-W, -H * 2, W * 2, H * 3);
    c.restore();
    skyTex.refresh();
  }
  const sky = S.add(skyTex ? scene.add.image(W / 2, H / 2, skyTex.key) : scene.add.rectangle(W / 2, H / 2, W, H, o.tint), 10).setVisible(false);
  const ground = S.add(scene.add.ellipse(W / 2, 474, 520, 120, 0x4f8f44, 1), 11).setVisible(false);
  const groundEdge = S.add(scene.add.ellipse(W / 2, 474, 400, 84, 0x6aa84f, 1), 11).setVisible(false);
  const shadow = S.add(scene.add.ellipse(W / 2, 482, 200, 44, 0x000000, 1).setAlpha(0).setScale(0.3), 12);
  let target: Visual | null = null;
  try {
    target = o.makeTarget ? S.add(S.stand(o.makeTarget(0, 0), W / 2, 486, 126), 13) : null;
    target?.setVisible(false);
  } catch {
    target = null;
  }
  let diver: Visual | null = null;
  try {
    diver = S.add(S.stand(o.makeFront(0, 0), W / 2, 70 + 36, 72), 16);
    diver.setVisible(false);
  } catch {
    diver = null;
  }
  const light = S.glow(W / 2, 70, 450, 0xffffff, 15).setAlpha(0);
  const lightFull = light.scale;
  const lightTint = S.glow(W / 2, 70, 450, o.tint, 14).setAlpha(0);
  S.at(Z_SKY, () => {
    dim.setVisible(false);
    for (const v of [sky, ground, groundEdge, target, diver]) v?.setVisible(true);
    shadow.setAlpha(0.25);
  });
  S.to(shadow, Z_SKY, 1050, { scale: 2.6, alpha: 0.6 }, 'in');
  // The target sees it coming.
  if (target) {
    const t = target;
    S.at(Z_SKY + 500, () => scene.tweens.add({ targets: t, x: t.x + 3, duration: 20 / o.speed, yoyo: true, repeat: 13 }));
  }
  if (diver) {
    const d = diver;
    const s0 = d.scaleX;
    S.to(d, Z_SKY, 350, { scaleX: s0 * 1.3, scaleY: s0 * 1.3 }, 'out');
    S.to(d, Z_SKY + 450, 600, { y: 400 + 90, scaleX: s0 * 2.4, scaleY: s0 * 2.4 }, 'in3');
  }
  for (const g of [light, lightTint]) {
    g.setScale(lightFull * 0.04);
    S.at(Z_SKY + 200, () => g.setAlpha(1));
    S.to(g, Z_SKY + 200, 250, { scale: lightFull * 0.16 }, 'out3');
    S.to(g, Z_SKY + 450, 600, { scale: lightFull * (g === light ? 1.2 : 1.6), y: 420 }, 'in3');
  }
  for (let i = 0; i < 16; i += 1) {
    const x1 = 80 + S.rnd(0, 800), x2 = 80 + S.rnd(0, 800);
    S.streak(Z_SKY + 450 + i * 35, { x1, y1: H, x2, y2: -80, w: 5, color: i % 2 ? 0xffe45e : 0xffffff, d: 120, hold: 20, out: 100, alpha: 0.7, layer: 17 });
  }
  S.at(Z_SKY + 450, () => S.sound('ess-refresh', 0.8));

  // ---- It arrives. ----
  S.at(Z_IMPACT, () => {
    for (const v of [diver, light, lightTint, target, shadow, ground, groundEdge]) v?.setVisible(false);
    S.sound('ess-explosion', 0.9);
  });
  S.flash(Z_IMPACT, 500, 0xffffff, 1);
  S.jolt(sky, Z_IMPACT, 22);
  S.jolt(sky, Z_IMPACT + 200, 12);
  for (let i = 0; i < 4; i += 1) S.ring(Z_IMPACT + i * 90, { x: W / 2, y: 470, r0: 40, r1: 420 + i * 160, color: i % 2 ? 0xffe45e : 0xffffff, flat: 0.32, w: 12, d: 600, layer: 18 });
  if (o.particles !== false) {
    S.at(Z_IMPACT, () => {
      const cols = [0xffffff, 0xffe45e, type.clone().lighten(20).color, o.tint];
      for (let i = 0; i < 40; i += 1) {
        const a = Phaser.Math.DegToRad(S.rnd(200, 340));
        const v = S.rnd(300, 1100);
        const p = S.add(scene.add.circle(W / 2, 470, S.rnd(5, 15), cols[i % 4]!, 1), 18);
        const life = S.rnd(500, 1000) / o.speed;
        scene.tweens.add({ targets: p, x: W / 2 + Math.cos(a) * v * 0.6, alpha: 0, duration: life, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
        scene.tweens.add({ targets: p, y: 470 + Math.sin(a) * v * 0.5 + 120, duration: life, ease: 'Quad.easeIn' });
      }
    });
  }

  // ---- The damage, counted out. ----
  if (o.hit && o.hit.damage > 0) {
    const hit = o.hit;
    const num = S.add(scene.add.text(W / 2, 250, '0', textStyle(230, '#ffe45e', { stroke: '#141c3a', strokeThickness: 14 })).setOrigin(0.5).setScale(2).setAlpha(0), 19);
    S.at(Z_IMPACT + 200, () => num.setAlpha(1));
    S.to(num, Z_IMPACT + 200, 120, { scale: 1 }, 'lin');
    const count = { v: 0 };
    S.at(Z_IMPACT + 250, () => scene.tweens.add({ targets: count, v: hit.damage, duration: 700 / o.speed, onUpdate: () => !S.ended && num.setText(`-${Math.round(count.v)}`) }));
    S.at(Z_IMPACT + 960, () => num.setText(`-${hit.damage}`));
    S.to(num, Z_IMPACT + 950, 60, { scale: 1.25 }, 'out');
    S.to(num, Z_IMPACT + 1010, 200, { scale: 1 }, 'el');
    S.to(num, Z_IMPACT + 1560, 120, { scale: 1.6, alpha: 0 });
    S.jolt(sky, Z_IMPACT + 950, 12);
    const word = hit.effectiveness > 1 ? 'SUPER EFFECTIVE!' : hit.effectiveness > 0 && hit.effectiveness < 1 ? 'Not very effective…' : null;
    if (word) {
      const se = S.add(scene.add.text(W / 2, 400, word, textStyle(54, '#ffffff', { stroke: '#141c3a', strokeThickness: 8 })).setOrigin(0.5).setScale(0), 19);
      S.to(se, Z_IMPACT + 1000, 160, { scale: 1 }, 'back2');
      S.to(se, Z_IMPACT + 1450, 120, { alpha: 0 });
    }
  }

  // ---- The page: the Z-Move's name across it. ----
  const bg = S.backdrop('bg', { c1: type.clone().lighten(40).rgba, c2: type.clone().darken(25).rgba, rays: { x: 700, y: 250, color: 'rgba(255,255,255,0.2)', n: 30 }, mirror: mir }, 25).setVisible(false);
  S.at(Z_LOCK, () => {
    sky.setVisible(false);
    bg.setVisible(true);
    S.sound('ess-flash2', 0.9);
  });
  S.flash(Z_LOCK, 300, 0xffffff, 0.9);
  S.jolt(bg, Z_LOCK, 14);
  const big = S.bigMon('mon', o.makeFront, MON_BOX, mir, 26);
  if (big) {
    big.setVisible(false).setScale(1.5);
    S.at(Z_LOCK + 50, () => big.setVisible(true));
    S.to(big, Z_LOCK + 50, 220, { scale: 1 }, 'in3');
    S.to(big, Z_LOCK + 270, 50, { scaleY: 0.96 });
    S.to(big, Z_LOCK + 320, 300, { scaleY: 1 }, 'el');
    S.to(big, Z_BACK, 150, { alpha: 0 });
  }
  // The move's name slides in under the Pokémon.
  const nameAt = { x: mx(655), y: 377 };
  const name: (Phaser.GameObjects.Image | Phaser.GameObjects.Text) | null = has(o.titleKey)
    ? S.add(scene.add.image(nameAt.x, nameAt.y, o.titleKey), 27)
    : o.title
      ? S.add(scene.add.text(nameAt.x, nameAt.y, o.title, textStyle(64, '#ffffff', { stroke: hex(type.clone().darken(40).color), strokeThickness: 10 })).setOrigin(0.5), 27)
      : null;
  if (name) {
    if (name instanceof Phaser.GameObjects.Image) S.fit(name, 610, 142);
    else if (name.width > 600) name.setScale(600 / name.width);
    name.setX(mir ? -400 : W + 400);
    S.to(name, Z_LOCK + 500, 220, { x: nameAt.x }, 'out3');
    S.to(name, Z_BACK, 150, { alpha: 0 });
  }
  if (has(o.itemKey)) S.pageMark(S.add(scene.add.image(0, 0, o.itemKey), 27), Z_LOCK + 50, Z_BACK, [464, 90, 108, 108], mir);
  const page = S.page(Z_LOCK + 50, o.page, mir);
  page.out(Z_BACK);

  // ---- Back on the field: it lands on its place. ----
  S.to(bg, Z_BACK, 250, { alpha: 0 });
  S.at(Z_BACK, showReal);
  S.land(o.field, Z_BACK + 250, 1.12, 300);
  S.dust(Z_BACK + 300, X, FY, 10);

  return S.run(Z_LENGTH, () => undefined);
}
