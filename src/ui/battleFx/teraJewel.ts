// Terastallize, remade (animation redesign pass 20, "inside the jewel"): one crystal closes over the Pokémon on
// the field and the camera goes into it. Inside, twelve mirrored slices of the Pokémon turn like a kaleidoscope,
// changing colour as they go, then fold into one point of light that becomes the crown: the page with its title
// and facts. The crystal breaks on the field and the Tera jewel drops onto the Pokémon's head.
// Built beat for beat from plans/animation-redesign/src/p20.js. Presentation only.

import Phaser from 'phaser';
import type { Visual } from '../sprites';
import { GimmickStage, drawnBox, firstSprite, type GimmickFeel, type GimmickPage } from './gimmickStage';
import type { Beat } from './spectacle';

export interface TeraJewelOptions extends GimmickFeel {
  /** The Pokémon standing on the field. */
  field: () => Visual | null | undefined;
  /** Its front picture, built by the caller. Only its art is read. */
  makeFront: (x: number, y: number) => Visual;
  /** True when the Pokémon is the foe's: the page is mirrored. */
  opposes: boolean;
  /** The Tera Type's colour. */
  tint: number;
  /** Puts the Tera look on the Pokémon in the battle (its jewel), under cover of the flash. */
  onReveal: () => void;
  page: GimmickPage;
  /** The key item's picture (Tera Orb), or null. */
  itemKey?: string | null;
  /** The jewel icon of this Tera Type: a texture and a frame, or null. */
  jewel?: { key: string; frame: number | string } | null;
}

/** When the camera is inside the jewel, in ms. */
export const TERA_INSIDE = 1750;
/** When the slices have folded to one point and the page locks. */
export const TERA_LOCK = TERA_INSIDE + 2200;
/** When the crystal breaks on the field. */
export const TERA_BREAK = TERA_LOCK + 3000;
export const TERA_LENGTH = TERA_BREAK + 200 + 1100;

const MON_BOX: [number, number, number, number] = [594, 112, 296, 324];
const SLICES = 12;
/** A slice is thirty degrees wide and this long. */
const REACH = 620;
const HALF = Math.tan(Math.PI / SLICES) * REACH;
/** The crystal's drawn part inside its picture (the art has wide empty borders). */
const CRYSTAL = { x: 140, y: 14, w: 138, h: 197 };

/** Goes round a list of values, smoothly, once every `period` ms. */
const cycle = (values: number[], t: number, period: number): number => {
  const u = (((t % period) + period) % period) / period;
  const f = u * (values.length - 1);
  const i = Math.min(values.length - 2, Math.floor(f));
  const k = f - i;
  const e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
  return values[i]! + (values[i + 1]! - values[i]!) * e;
};

export function teraJewel(scene: Phaser.Scene, o: TeraJewelOptions): Beat {
  const S = new GimmickStage(scene, 'tera', o);
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

  let revealed = false;
  const reveal = (): void => {
    if (revealed) return;
    revealed = true;
    o.onReveal();
  };

  // ---- Open: the arena dims, the Tera Orb shows. ----
  const dim = S.full(0x05060d, 0, 0);
  S.to(dim, 800, 300, { alpha: 0.45 });
  S.copyOf(() => firstSprite(o.field()), 2);
  const white = S.copyOf(() => firstSprite(o.field()), 3, 0xffffff);
  S.itemChip(o.itemKey, mir);

  // ---- One crystal closes over it. ----
  let crystal: Phaser.GameObjects.Image | null = null;
  if (has('cine.dbk.tera.crystal_2')) {
    const k = Math.max(1.75, (tall + 70) / CRYSTAL.h);
    crystal = S.add(scene.add.image(X + 10, FY + 34, 'cine.dbk.tera.crystal_2').setCrop(CRYSTAL.x, CRYSTAL.y, CRYSTAL.w, CRYSTAL.h), 4);
    const src = crystal;
    // Stood on its bottom edge: the origin is the foot of the drawn part.
    src.setOrigin((CRYSTAL.x + CRYSTAL.w / 2) / src.width, (CRYSTAL.y + CRYSTAL.h) / src.height).setScale(k, 0).setAlpha(0).setTint(Phaser.Display.Color.ValueToColor(o.tint).lighten(55).color);
    S.at(900, () => src.setAlpha(0.92));
    S.to(src, 900, 250, { scaleY: k }, 'back2');
  }
  S.at(900, () => S.sound('ess-harden', 0.7));
  S.shake(1120, 200, 8);
  if (white) S.to(white, 1000, 300, { alpha: 0.8 }, 'lin');
  for (let i = 0; i < 6; i += 1) S.glint(1150 + i * 70, X + S.rnd(-90, 90), Y + S.rnd(-130, 60), 60);

  // ---- The camera goes inside. ----
  S.at(1300, () => {
    scene.tweens.add({ targets: cam, zoom: 2.2, scrollX: X - W / 2, scrollY: Y - H / 2, duration: 450 / o.speed, ease: (u: number) => u * u * u });
  });
  S.onEnd(() => scene.tweens.killTweensOf(cam));
  S.flash(TERA_INSIDE, 300, 0xffffff, 1);
  S.at(TERA_INSIDE + 50, () => {
    scene.tweens.killTweensOf(cam);
    cam.setZoom(1).setScroll(0, 0);
  });

  // ---- Inside the jewel: the page's backdrop, dark, and twelve mirrored slices turning. ----
  const light = Phaser.Display.Color.ValueToColor(o.tint).lighten(60);
  const bg = S.backdrop('bg', { key: 'cine.raid.tera.bg', c1: light.rgba, c2: '#1c3a66', rays: { x: 690, y: 250, color: 'rgba(255,255,255,0.22)', n: 24 }, mirror: mir }, 5).setVisible(false);
  const shade = S.full(0x04060c, 0.55, 6).setVisible(false);
  // One slice is drawn on a canvas every frame (the Pokémon slides and turns inside it); the twelve on screen all show it.
  const wedge = S.canvas('wedge', REACH, HALF * 2);
  let art: Phaser.GameObjects.Sprite | null = null;
  let holder: Visual | null = null;
  try {
    holder = o.makeFront(-4000, -4000);
    art = firstSprite(holder);
  } catch {
    art = null;
  }
  const artBox = art ? drawnBox(art) : null;
  const crystalSrc = has('cine.dbk.tera.crystal_2') ? (scene.textures.get('cine.dbk.tera.crystal_2').getSourceImage() as HTMLImageElement) : null;
  const paintWedge = (t: number): void => {
    if (!wedge) return;
    const c = wedge.getContext();
    const h = HALF * 2;
    c.clearRect(0, 0, REACH, h);
    c.save();
    c.beginPath();
    c.moveTo(0, HALF);
    c.lineTo(REACH, 0);
    c.lineTo(REACH, h);
    c.closePath();
    c.clip();
    const g = c.createLinearGradient(0, 0, REACH, 0);
    g.addColorStop(0.04, 'rgba(255,255,255,0)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.24)');
    g.addColorStop(0.75, 'rgba(191,243,255,0.2)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, REACH, h);
    c.imageSmoothingEnabled = false;
    if (crystalSrc) {
      const cx = cycle([560, 460, 620, 560], t, 2100) - 60;
      c.globalAlpha = 0.85;
      c.drawImage(crystalSrc, CRYSTAL.x, CRYSTAL.y, 120, 170, cx - 60, HALF - 85, 120, 170);
      c.globalAlpha = 1;
    }
    if (art && artBox && art.frame?.source?.image) {
      const k = 215 / artBox.h;
      const x = cycle([320, 220, 420, 280, 320], t, 2100);
      c.translate(x, HALF + 20);
      c.rotate((cycle([0, 30, -24, 0], t, 1400) * Math.PI) / 180);
      c.drawImage(art.frame.source.image as CanvasImageSource, art.frame.cutX + artBox.x, art.frame.cutY + artBox.y, artBox.w, artBox.h, (-artBox.w * k) / 2, (-artBox.h * k) / 2, artBox.w * k, artBox.h * k);
    }
    c.restore();
    wedge.refresh();
  };
  const slices: Phaser.GameObjects.Image[] = [];
  if (wedge) {
    paintWedge(0);
    for (let i = 0; i < SLICES; i += 1) {
      const s = S.add(scene.add.image(W / 2, H / 2, wedge.key).setOrigin(0, 0.5).setFlipY(i % 2 === 1).setAngle((i * 360) / SLICES - 80).setScale(0.15).setVisible(false), 7);
      slices.push(s);
    }
  }
  let inside = -1;
  const turn = { a: -80 };
  const hue = Phaser.Display.Color.IntegerToColor(o.tint).h;
  const spin = (): void => {
    if (inside < 0 || S.ended) return;
    const t = (scene.time.now - inside) * o.speed;
    if (t > 2200) return;
    paintWedge(t);
    const shift = cycle([0, 70, -40, 0], t, 1050) / 360;
    const tint = Phaser.Display.Color.HSVToRGB((((hue + shift) % 1) + 1) % 1, 0.28, 1) as Phaser.Types.Display.ColorObject;
    slices.forEach((s, i) => s.setAngle((i * 360) / SLICES + turn.a).setTint(tint.color));
  };
  scene.events.on('update', spin);
  S.onEnd(() => scene.events.off('update', spin));
  S.at(TERA_INSIDE, () => {
    inside = scene.time.now;
    bg.setVisible(true);
    shade.setVisible(true);
    slices.forEach((s) => s.setVisible(true));
    holder?.setVisible(false);
    S.sound('ess-twine', 0.7);
  });
  S.onEnd(() => holder?.destroy());
  S.to(slices, TERA_INSIDE, 400, { scale: 1 }, 'out3');
  S.to(turn, TERA_INSIDE, 2160, { a: 150 }, 'io');
  S.to(slices, TERA_INSIDE + 1900, 260, { scale: 0 }, 'in3');
  for (let i = 0; i < 3; i += 1) {
    S.at(TERA_INSIDE + 500 + i * 500, () => {
      const p = has('cine.dbk.tera.pulse') ? S.add(scene.add.image(W / 2, H / 2, 'cine.dbk.tera.pulse').setBlendMode(Phaser.BlendModes.ADD), 8) : S.add(scene.add.circle(W / 2, H / 2, 40).setStrokeStyle(6, 0xffffff, 1), 8);
      p.setScale(0.4).setAlpha(0.9);
      scene.tweens.add({ targets: p, scale: 12, alpha: 0, duration: 700 / o.speed, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    });
  }
  for (let i = 0; i < 12; i += 1) S.glint(TERA_INSIDE + 300 + i * 140, S.rnd(80, 880), S.rnd(50, 490), S.rnd(40, 110), 0xffffff, 9);

  // ---- One point of light becomes the crown: the page. ----
  const flare = S.glow(W / 2, H / 2, 40, o.tint, 10).setAlpha(0);
  const flareSize = flare.scale;
  S.at(TERA_LOCK - 60, () => flare.setAlpha(1));
  S.to(flare, TERA_LOCK - 60, 600, { scale: flareSize * 22, alpha: 0 }, 'out');
  S.flash(TERA_LOCK, 350, 0xffffff, 0.95);
  S.at(TERA_LOCK, () => {
    slices.forEach((s) => s.setVisible(false));
    S.sound('ess-shell-smash', 0.9);
  });
  S.to(shade, TERA_LOCK, 500, { alpha: 0 });
  S.jolt(bg, TERA_LOCK, 14);
  const big = S.bigMon('mon', o.makeFront, MON_BOX, mir, 11);
  if (big) {
    big.setVisible(false).setScale(1.5);
    S.at(TERA_LOCK + 50, () => big.setVisible(true));
    S.to(big, TERA_LOCK + 50, 220, { scale: 1 }, 'in3');
    S.to(big, TERA_LOCK + 270, 50, { scaleY: 0.96 });
    S.to(big, TERA_LOCK + 320, 300, { scaleY: 1 }, 'el');
  }
    const crown = o.jewel && has(o.jewel.key) ? S.add(scene.add.image(0, 0, o.jewel.key, o.jewel.frame), 12) : has('cine.dbk.tera.icon') ? S.add(scene.add.image(0, 0, 'cine.dbk.tera.icon'), 12) : null;
  if (crown) S.pageMark(crown, TERA_LOCK, TERA_BREAK, [634, 38, 140, 140], mir);
  const page = S.page(TERA_LOCK + 50, o.page, mir);
  page.out(TERA_BREAK);
  if (big) S.to(big, TERA_BREAK, 150, { alpha: 0 });

  // ---- The crystal breaks on the field. ----
  S.flash(TERA_BREAK, 300, 0xffffff, 0.9);
  S.at(TERA_BREAK, () => {
    reveal();
    white?.setVisible(false);
    S.sound('ess-explosion', 0.7);
  });
  S.at(TERA_BREAK + 50, () => {
    bg.setVisible(false);
    crystal?.setVisible(false);
    dim.setVisible(false);
  });
  if (o.particles !== false) {
    S.at(TERA_BREAK + 80, () => {
      const cols = [0xffffff, 0xe8fbff, 0xbff3ff, o.tint];
      for (let i = 0; i < 30; i += 1) {
        const a = S.rnd(0, Math.PI * 2);
        const v = S.rnd(200, 700);
        const size = S.rnd(10, 30);
        const p = S.add(scene.add.triangle(X, Y, 0, size, size * 0.5, 0, size, size * 0.7, cols[i % 4]!, 1), 30);
        const life = S.rnd(500, 900) / o.speed;
        scene.tweens.add({ targets: p, x: X + Math.cos(a) * v * 0.6, angle: S.rnd(-500, 500), alpha: 0, duration: life, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
        scene.tweens.add({ targets: p, y: Y + Math.sin(a) * v * 0.6 + 140, duration: life, ease: 'Quad.easeIn' });
      }
    });
  }
  const L = TERA_BREAK + 200;
  S.land(o.field, L, 1.15, 400);
  // The jewel drops onto its head, squashes, and is the battle's own jewel from then on.
  if (crown && o.jewel && has(o.jewel.key)) {
    const top = Y - tall / 2 - 30;
    const drop = S.add(scene.add.image(X, top - 210, o.jewel.key, o.jewel.frame).setScale(1.6).setAlpha(0), 31);
    S.at(L + 150, () => drop.setAlpha(1));
    S.to(drop, L + 150, 280, { y: top }, 'in');
    S.to(drop, L + 430, 60, { scaleY: 1.28 });
    S.to(drop, L + 490, 250, { scaleY: 1.6 }, 'el');
    S.to(drop, L + 800, 200, { alpha: 0 });
  }
  for (let i = 0; i < 8; i += 1) S.glint(L + i * 70, X + S.rnd(-110, 110), Y + S.rnd(-120, 60), 30, 0xe8fbff);

  return S.run(TERA_LENGTH, reveal);
}
