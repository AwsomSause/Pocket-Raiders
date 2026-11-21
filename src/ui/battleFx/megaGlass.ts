// Mega Evolution, remade (animation redesign pass 20, "Mega Evolution is glass"): a double helix of colour climbs
// the Pokémon on the field, it turns white, cracks run from it to every edge of the screen, and the screen goes.
// The new picture slams together out of twenty-four glass shards (the far corners first, the Mega's face last),
// locks with its title and facts, then cracks again and the pieces fall away from the field, where the Mega form
// lands. Built beat for beat from plans/animation-redesign/src/p20.js. Presentation only.

import Phaser from 'phaser';
import type { Visual } from '../sprites';
import { GimmickStage, RAINBOW, drawFitted, firstSprite, type GimmickFeel, type GimmickPage } from './gimmickStage';
import type { Beat } from './spectacle';

export interface MegaGlassOptions extends GimmickFeel {
  /** The Pokémon standing on the field right now (read again after the swap, when it is the Mega form). */
  field: () => Visual | null | undefined;
  /** The Mega form's front picture, built by the caller (right species, form and shiny art). Only its art is read. */
  makeMegaFront: (x: number, y: number) => Visual;
  /** True when the Pokémon is the foe's: the whole picture is mirrored. */
  opposes: boolean;
  /** Shows the Mega form in the battle behind the scene (plays its cry). */
  onSwap: () => void;
  page: GimmickPage;
  /** The key item's picture (Mega Ring), shown at the start, or null. */
  itemKey?: string | null;
  /** Where the Mega mark flies to at the end (the Pokémon's name plate), or null to let it fade. */
  plate?: { x: number; y: number } | null;
}

/** When the screen goes (the cracks have reached every edge), in ms. */
export const MEGA_BREAK = 2300;
/** When the picture locks: 24 shards, 40 ms apart, 260 ms each, and a breath. */
export const MEGA_LOCK = MEGA_BREAK + 150 + 23 * 40 + 340;
/** When the picture shatters back to the field. */
export const MEGA_SHATTER = MEGA_LOCK + 3000;
export const MEGA_LENGTH = MEGA_SHATTER + 250 + 1150;

const MON_BOX: [number, number, number, number] = [482, 80, 408, 356];
const HEART = { x: 686, y: 258 };

/** The page's backdrop from the UI mockups: night blue, a pink and gold ring, and rays from the Pokémon's place. */
function paintBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#0f1530');
  g.addColorStop(1, '#2c2438');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const cx = 680, cy = 232;
  const arc = (r: number, w: number, c: string): void => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = w;
    ctx.strokeStyle = c;
    ctx.stroke();
  };
  arc(252, 50, 'rgba(196,28,160,0.86)');
  arc(212, 16, 'rgba(160,26,70,0.7)');
  arc(160, 18, 'rgba(214,150,30,0.85)');
  arc(128, 8, 'rgba(150,110,40,0.6)');
  ctx.fillStyle = 'rgba(232,122,52,0.6)';
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2 + 0.05;
    const w = 0.04;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a - w) * 1200, cy + Math.sin(a - w) * 1200);
    ctx.lineTo(cx + Math.cos(a + w) * 1200, cy + Math.sin(a + w) * 1200);
    ctx.closePath();
    ctx.fill();
  }
  const fade = ctx.createLinearGradient(0, 0, 430, 0);
  fade.addColorStop(0, 'rgba(15,21,48,1)');
  fade.addColorStop(0.25, 'rgba(15,21,48,0.85)');
  fade.addColorStop(1, 'rgba(15,21,48,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 430, H);
}

interface Shard {
  img: Phaser.GameObjects.Image;
  cx: number;
  cy: number;
}

export function megaGlass(scene: Phaser.Scene, o: MegaGlassOptions): Beat {
  const S = new GimmickStage(scene, 'mega', o);
  const { W, H } = S;
  const mir = o.opposes;
  const mx = (x: number): number => (mir ? W - x : x);
  const has = (k: string | null | undefined): k is string => Boolean(k) && scene.textures.exists(k!);

  // ---- The Pokémon on the field, measured once (the stage never changes the real sprite). ----
  const real = firstSprite(o.field());
  const m = real ? real.getWorldTransformMatrix() : null;
  const X = m ? m.tx : mir ? 648 : 312;
  const FY = m ? m.ty : mir ? 240 : 428;
  const tall = real ? Math.max(90, real.displayHeight * real.originY * (m ? Math.abs(m.scaleY / (real.scaleY || 1)) : 1)) : 200;
  const Y = FY - tall / 2;

  let swapped = false;
  const swap = (): void => {
    if (swapped) return;
    swapped = true;
    o.onSwap();
  };

  // ---- Open: the arena dims around the Pokémon, the key item shows, an aura breathes. ----
  const dim = S.full(0x05060d, 0, 0);
  S.to(dim, 800, 300, { alpha: 0.4 });
  const aura = S.glow(X, Y, tall * 0.95, 0xe84fa0).setAlpha(0);
  const auraSize = aura.scale;
  aura.setScale(auraSize * 0.6);
  S.to(aura, 800, 400, { alpha: 0.8, scale: auraSize });
  S.to(aura, 1200, 700, { alpha: 0.5, scale: auraSize * 1.25 }, 'io');
  const ghost = S.copyOf(() => (swapped ? null : firstSprite(o.field())), 2);
  const white = S.copyOf(() => (swapped ? null : firstSprite(o.field())), 3, 0xffffff);
  if (has(o.itemKey)) {
    const ix = mx(92), iy = 330;
    const chip = S.add(scene.add.container(ix, iy), 50).setScale(0);
    const pic = scene.add.image(0, 0, o.itemKey);
    pic.setScale(Math.min(3, 64 / Math.max(pic.width, pic.height)));
    chip.add([scene.add.circle(0, 0, 46, 0x131c36, 0.9).setStrokeStyle(4, 0xffcb05, 1), pic]);
    S.to(chip, 450, 300, { scale: 1 }, 'back2');
    S.ring(550, { x: ix, y: iy, r1: 90, color: 0xffcb05, layer: 49 });
    S.to(chip, 1500, 200, { scale: 0 }, 'in');
  }
  S.at(450, () => S.sound('ess-refresh', 0.5));

  // ---- A double helix of colour climbs it. ----
  const rise = Math.max(200, tall * 1.15);
  for (let i = 0; i < 26; i += 1) {
    const u = i / 25;
    const dx = Math.sin(u * 9) * Math.min(78, tall * 0.34 + 20);
    const y = FY - 10 - u * rise;
    [1, -1].forEach((sg, j) => {
      const bead = S.add(scene.add.container(X + dx * sg, y), 4).setScale(0);
      bead.add([scene.add.circle(0, 0, 12, 0xffffff, 0.35).setBlendMode(Phaser.BlendModes.ADD), scene.add.circle(0, 0, 7, RAINBOW[(i + j * 3) % 6]!, 1)]);
      const born = 850 + u * 700;
      const life = 1200 - u * 700;
      S.to(bead, born, 120, { scale: 1 }, 'back2');
      // It swings to the other side of the Pokémon and back, every 600 ms, for as long as it lives.
      S.at(born + 120, () => scene.tweens.add({ targets: bead, x: X - dx * sg, duration: 300 / o.speed, yoyo: true, repeat: Math.max(0, Math.round(life / 600) - 1), ease: 'Sine.easeInOut' }));
      S.to(bead, born + 120 + life, 100, { scale: 0 }, 'in');
    });
  }
  S.at(850, () => S.sound(scene.cache.audio.exists('cine.sfx.mega1') ? 'cine.sfx.mega1' : 'ess-twine', 0.9));

  // ---- It turns white; cracks run to every edge; the screen shudders four times. ----
  if (white) S.to(white, 1500, 500, { alpha: 1 }, 'lin');
  S.cracks(X, Y, 1750, MEGA_BREAK);
  for (let i = 0; i < 4; i += 1) S.shake(1750 + i * 100, 100, 5 + i * 2);
  S.at(1750, () => S.sound('ess-flash2', 0.7));
  S.flash(MEGA_BREAK, 200, 0xffffff, 1);

  // ---- The screen goes: a dark stage, and the new picture as glass. ----
  const dark = S.canvas('dark', W, H);
  if (dark) {
    const c = dark.getContext();
    const g = c.createRadialGradient(mx(672), 259, 0, mx(672), 259, 560);
    g.addColorStop(0, '#3a0d33');
    g.addColorStop(0.7, '#0c0714');
    g.addColorStop(1, '#0c0714');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    dark.refresh();
  }
  const bk = S.add(dark ? scene.add.image(W / 2, H / 2, dark.key) : scene.add.rectangle(W / 2, H / 2, W, H, 0x0c0714), 5).setVisible(false);

  // The picture: the backdrop, then the Mega form at page size. Drawn once on a canvas, then cut into shards.
  const box: [number, number, number, number] = mir ? [W - MON_BOX[0] - MON_BOX[2], MON_BOX[1], MON_BOX[2], MON_BOX[3]] : MON_BOX;
  const heart = { x: mx(HEART.x), y: HEART.y };
  const bgTex = S.canvas('bg', W, H);
  const fullTex = S.canvas('full', W, H);
  const monTex = S.canvas('mon', box[2], box[3]);
  let megaArt: Phaser.GameObjects.Sprite | null = null;
  let megaHolder: Visual | null = null;
  try {
    megaHolder = o.makeMegaFront(-2000, -2000);
    megaArt = firstSprite(megaHolder);
  } catch {
    megaArt = null;
  }
  if (bgTex) {
    const c = bgTex.getContext();
    c.save();
    if (mir) {
      c.translate(W, 0);
      c.scale(-1, 1);
    }
    paintBackdrop(c, W, H);
    c.restore();
    bgTex.refresh();
  }
  if (monTex && megaArt) {
    drawFitted(monTex.getContext(), megaArt, [0, 0, box[2], box[3]], mir);
    monTex.refresh();
  }
  if (fullTex) {
    const c = fullTex.getContext();
    if (bgTex) c.drawImage(bgTex.getSourceImage() as HTMLCanvasElement, 0, 0);
    if (monTex) c.drawImage(monTex.getSourceImage() as HTMLCanvasElement, box[0], box[1]);
    fullTex.refresh();
  }
  megaHolder?.destroy();

  const shards: Shard[] = [];
  if (fullTex) {
    const Cn = 4, Rn = 3;
    const P: [number, number][][] = [];
    for (let j = 0; j <= Rn; j += 1) {
      P[j] = [];
      for (let i = 0; i <= Cn; i += 1) P[j]![i] = [i * 240 + (i && i < Cn ? S.rnd(-50, 50) : 0), j * 180 + (j && j < Rn ? S.rnd(-40, 40) : 0)];
    }
    const src = fullTex.getSourceImage() as HTMLCanvasElement;
    let n = 0;
    for (let j = 0; j < Rn; j += 1)
      for (let i = 0; i < Cn; i += 1) {
        const a = P[j]![i]!, b = P[j]![i + 1]!, c = P[j + 1]![i + 1]!, d = P[j + 1]![i]!;
        for (const T of (i + j) % 2 ? [[a, b, d], [b, c, d]] : [[a, b, c], [a, c, d]]) {
          const xs = T.map((p) => p[0]), ys = T.map((p) => p[1]);
          const x0 = Math.floor(Math.min(...xs)), y0 = Math.floor(Math.min(...ys));
          const w = Math.ceil(Math.max(...xs)) - x0, h = Math.ceil(Math.max(...ys)) - y0;
          const tex = S.canvas(`shard${n++}`, w, h);
          if (!tex) continue;
          const ctx = tex.getContext();
          ctx.beginPath();
          ctx.moveTo(T[0]![0] - x0, T[0]![1] - y0);
          ctx.lineTo(T[1]![0] - x0, T[1]![1] - y0);
          ctx.lineTo(T[2]![0] - x0, T[2]![1] - y0);
          ctx.closePath();
          ctx.save();
          ctx.clip();
          ctx.drawImage(src, -x0, -y0);
          ctx.restore();
          // A bright edge, as glass has.
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.stroke();
          tex.refresh();
          const cx = (T[0]![0] + T[1]![0] + T[2]![0]) / 3, cy = (T[0]![1] + T[1]![1] + T[2]![1]) / 3;
          const img = S.add(scene.add.image(cx, cy, tex.key).setOrigin((cx - x0) / w, (cy - y0) / h).setVisible(false), 7);
          shards.push({ img, cx, cy });
        }
      }
  }

  S.at(MEGA_BREAK, () => {
    bk.setVisible(true);
    dim.setVisible(false);
    aura.setVisible(false);
    ghost?.setVisible(false);
    white?.setVisible(false);
    swap();
    S.sound(scene.cache.audio.exists('cine.sfx.mega2') ? 'cine.sfx.mega2' : 'ess-explosion', 0.9);
  });
  // The far corners first, the Mega's face last.
  const order = shards.slice().sort((a, b) => Math.hypot(b.cx - mx(600), b.cy - 270) - Math.hypot(a.cx - mx(600), a.cy - 270));
  order.forEach((s, n) => {
    const d = MEGA_BREAK + 150 + n * 40;
    const turn = S.rnd(-140, 140);
    S.at(d, () => s.img.setVisible(true).setPosition(s.cx + (s.cx - W / 2) * 2.4, s.cy + (s.cy - H / 2) * 2.4).setAngle(turn).setScale(1.6));
    S.to(s.img, d, 260, { x: s.cx, y: s.cy, angle: 0, scale: 1 }, 'in3');
    if (n % 3 === 0) {
      S.jolt(bk, d + 260, 5);
      S.at(d + 260, () => S.sound('ess-harden', 0.35));
    }
  });

  // ---- Locked: one whole picture, a flash, six rings of colour, and the title and facts. ----
  const bg = S.add(bgTex ? scene.add.image(W / 2, H / 2, bgTex.key) : scene.add.rectangle(W / 2, H / 2, W, H, 0x141c3a), 6).setVisible(false);
  const mon = monTex ? S.add(scene.add.image(box[0] + box[2] / 2, box[1] + box[3], monTex.key).setOrigin(0.5, 1).setVisible(false), 8) : null;
  S.at(MEGA_LOCK, () => {
    shards.forEach((s) => s.img.setVisible(false));
    bk.setVisible(false);
    bg.setVisible(true);
    mon?.setVisible(true);
    S.sound('ess-flash2', 0.9);
  });
  if (mon) {
    S.to(mon, MEGA_LOCK + 220, 50, { scaleY: 0.96 });
    S.to(mon, MEGA_LOCK + 270, 300, { scaleY: 1 }, 'el');
  }
  S.flash(MEGA_LOCK, 300, 0xffffff, 0.9);
  S.jolt(bg, MEGA_LOCK, 14);
  RAINBOW.forEach((c, i) => S.ring(MEGA_LOCK + i * 40, { x: heart.x, y: heart.y, r1: 260 + i * 60, color: c, w: 8, d: 600, layer: 9 }));
  if (has('cine.dbk.mega.icon')) S.pageMark(S.add(scene.add.image(0, 0, 'cine.dbk.mega.icon'), 10), MEGA_LOCK, MEGA_SHATTER, [456, 60, 132, 228], mir);
  const page = S.page(MEGA_LOCK, o.page, mir);
  page.out(MEGA_SHATTER);

  // ---- It cracks again, and the picture shatters off the field. ----
  S.cracks(heart.x, heart.y, MEGA_SHATTER - 300, MEGA_SHATTER);
  S.at(MEGA_SHATTER - 300, () => S.sound('ess-harden', 0.6));
  S.at(MEGA_SHATTER, () => {
    bg.setVisible(false);
    mon?.setVisible(false);
    shards.forEach((s) => s.img.setVisible(true).setPosition(s.cx, s.cy).setAngle(0).setScale(1).setAlpha(1));
    S.sound('ess-shell-smash', 0.9);
  });
  shards.forEach((s) => {
    S.to(s.img, MEGA_SHATTER + 120, 600, { x: s.cx + (s.cx - W / 2) * 1.5, y: s.cy + (s.cy - H / 2) * 1.5 + 300, angle: S.rnd(-220, 220), scale: 0.6 }, 'in');
    S.to(s.img, MEGA_SHATTER + 550, 170, { alpha: 0 }, 'lin');
  });
  S.flash(MEGA_SHATTER + 120, 150, 0xffffff, 0.7);
  S.shake(MEGA_SHATTER + 120, 400, 14);

  // ---- Back on the field: the Mega form lands large and settles, dust, its mark, a roar. ----
  const L = MEGA_SHATTER + 250;
  S.at(L, () => {
    const v = o.field();
    if (!v || !v.active) return;
    const sx = v.scaleX, sy = v.scaleY;
    S.onEnd(() => v.active && v.setScale(sx, sy));
    v.setScale(sx * 1.25, sy * 1.25);
    // (Inside a beat, times count from the beat.)
    S.to(v, 0, 450, { scaleX: sx, scaleY: sy }, 'back');
    S.at(600, () => {
      if (!v.active) return;
      scene.tweens.add({ targets: v, scaleX: sx * 1.06, scaleY: sy * 0.95, duration: 80 / o.speed, onComplete: () => !S.ended && v.active && scene.tweens.add({ targets: v, scaleX: sx, scaleY: sy, duration: 300 / o.speed, ease: 'Elastic.easeOut' }) });
    });
  });
  S.dust(L + 300, X, FY, 10);
  if (has('cine.dbk.mega.icon')) {
    const mark = S.add(scene.add.image(X + 20, Y - tall * 0.5 - 40, 'cine.dbk.mega.icon').setScale(0), 48);
    S.to(mark, L + 250, 350, { scale: 2.2, angle: 360 }, 'back');
    if (o.plate) S.to(mark, L + 1000, 350, { x: o.plate.x, y: o.plate.y, scale: 0.5, alpha: 0.2 }, 'io');
    else S.to(mark, L + 1000, 200, { alpha: 0 });
  }
  for (let i = 0; i < 3; i += 1) S.ring(L + 600 + i * 100, { x: X + (mir ? -40 : 60), y: Y - tall * 0.15, r0: 20, r1: 150 + i * 60, color: 0xb6c2ff, w: 6, d: 500 });
  S.shake(L + 600, 450, 9);

  return S.run(MEGA_LENGTH, swap);
}
