// Transformation cinematics (Visual Bible: "spectacle via presentation cues"):
// Mega Evolution and Primal Reversion shatter a crystal over the Pokémon
// (EBDX "Primega Shatter", its crystal art cut by tools/essentials/cut-primega.py),
// Dynamax and Gigantamax recall the Pokémon into a giant ball that slams down
// (Deluxe Battle Kit's scene, on Raid Battles' Max art), a Z-Move calls down
// Z-Power (Raid Battles' Ultra art, DBK title cards) and Terastal grows and
// shatters DBK's Tera crystal, with Deluxe Battle Kit orbs and glows.
//
// The battle has already decided everything: `onSwap` is where the scene
// shows the new form, and it runs exactly once (at the climax, at once when
// animations are off, or when the player skips). Nothing here draws random
// numbers; every spread is a fixed pattern.

import Phaser from 'phaser';
import { animAssetIds, zTitleAssetId } from '../../assets/catalog';
import { services } from '../../game/services';
import type { MotionLevel } from '../aero';
import { loadAssets } from '../lazyAssets';
import { ballVisual, DEFAULT_BALL } from '../ballArt';
import { screenStyleOf } from '../../core/presentation/screenStyles';
import { evolveLook } from './evolveStyles';
import type { Visual } from '../sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import { cameraForScene } from './opening';
import type { Beat } from './spectacle';
import { CINE_ASSETS, CINE_MS, DYNAMAX_SCALE, DYNAMAX_LONG_MS, DYNAMAX_LONG_SWAP_AT, CINE_SOUNDS, SWAP_AT, keyItemFor, type CineKind } from './cineLook';
import { FORM_LOOK_ASSETS } from './formLook';
import shards from './primegaShards.json';

export type { CineKind } from './cineLook';


export interface CineOptions {
  kind: CineKind;
  /** The Pokémon's centre on screen. */
  x: number;
  y: number;
  sprite: Visual | null;
  /** Type or crystal colour. */
  tint: number;
  /** Which crystal a Primal Reversion uses: Groudon's Omega or Kyogre's Alpha. */
  crystal?: 'mega' | 'alpha' | 'omega';
  /** Big words for the moment (the Z-Move's name). */
  title?: string;
  /** The Z-Move's id: its Deluxe Battle Kit title card is shown in place of `title` when it loads in time. */
  titleId?: string;
  motion: MotionLevel;
  /** 1 normal, 2 fast, 3 quick. */
  speed: number;
  intensity: number;
  /** Shake strength; defaults to `intensity`. */
  shake?: number;
  /** Shows the new form; may return its sprite (an evolution fades it in from white). */
  onSwap: () => Visual | void;
  /** Dynamax: makes the trainer's sprite for the ball-throw intro (nothing for a wild or enemy side). */
  trainer?: () => Visual | null;
  /** Dynamax (full version): the trainer's front-facing sprite, who turns to face the player and raises the Dynamax Band. */
  trainerFront?: () => Visual | null;
  /** Dynamax: the ball item the Pokémon was caught in (its own Poké Ball picture is shown); defaults to the plain Poké Ball. */
  ball?: string;
  /** "Fast Dynamax": play the short cutscene instead of the full one. */
  fast?: boolean;
  /** The Pokémon is the foe's: the trainer comes in from the right and the scene mirrors. */
  enemySide?: boolean;
  /** Gigantamax: the species' own colour for the ring, sparks and banner (defaults to gold). */
  accent?: number;
  /** Gigantamax: the banner text (e.g. "G-MAX CHARIZARD"). */
  gmaxName?: string;
  /** Calyrex's riders: the scene runs teal instead of pink, as in the reference. */
  calyrex?: boolean;
  depth?: number;
}

/** Starts loading the cinematic art and sounds (call when a battle starts). */
export function prefetchCinematics(scene: Phaser.Scene): void {
  const { assets, session } = services();
  if (session.settings.battleAnimations === 'off') return;
  void loadAssets(scene, ['ball.pb', ...CINE_ASSETS, ...FORM_LOOK_ASSETS, ...CINE_SOUNDS.map(animAssetIds.sound)].filter((id) => assets.has(id))).catch(() => undefined);
}

export function cinematic(scene: Phaser.Scene, o: CineOptions): Beat {
  const ballIcon = o.ball ? services().session.content.items.get(o.ball)?.iconAssetId : undefined;
  if (ballIcon && services().assets.has(ballIcon) && !scene.textures.exists(ballIcon)) void loadAssets(scene, [ballIcon]).catch(() => undefined);
  let swapped = false;
  let newVisual: Visual | null = null;
  /** Put back when the cinematic ends. */
  const onEnd: Array<() => void> = [];
  const swap = () => {
    if (swapped) return;
    swapped = true;
    const shown = o.onSwap();
    if (shown) newVisual = shown;
    if (shown instanceof Phaser.GameObjects.Sprite && o.kind === 'evolve' && o.motion !== 'off') {
      shown.setTintFill(0xffffff);
      scene.time.delayedCall(420 / o.speed, () => shown.active && shown.clearTint());
    }
  };
  if (o.motion === 'off') {
    swap();
    return { done: Promise.resolve(), skip: () => undefined };
  }
  cameraForScene(scene);
  const depth = o.depth ?? 900;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  const reduced = o.motion === 'reduced';
  // Wild Pokémon have no trainer, so they use the short opening (as in the reference's wild scene).
  const hasTrainer = !!(o.trainerFront || o.trainer);
  const longDx = (o.kind === 'dynamax' || o.kind === 'gigantamax') && !o.fast && hasTrainer;
  const fieldColor = o.calyrex ? 0x00cccc : 0xe83a8c;
  const outlineColor = o.calyrex ? 0x24f3f3 : 0xfa3960;
  const sideX = o.enemySide ? 1 : -1;
  const total = (reduced ? 700 : longDx ? DYNAMAX_LONG_MS : CINE_MS[o.kind]) / o.speed;
  const at = (ms: number, fn: () => void) => timers.push(scene.time.delayedCall(ms / o.speed, fn));
  const has = (k: string) => scene.textures.exists(k);
  const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
    obj.setName(`cine-${o.kind}`);
    objs.push(obj);
    return obj;
  };
  const tw = (config: Phaser.Types.Tweens.TweenBuilderConfig) =>
    scene.tweens.add({ ...config, duration: (config.duration as number) / o.speed, delay: ((config.delay as number) ?? 0) / o.speed, hold: ((config.hold as number) ?? 0) / o.speed });
  /** Plays an Essentials animation sound by slug, or a cinematic sound by its asset id ('cine.sfx.…'). */
  const sound = (slug: string, volume = 0.8) => {
    const { session } = services();
    const key = slug.startsWith('cine.') ? slug : animAssetIds.sound(slug);
    if (session.settings.muted || !scene.cache.audio.exists(key)) return;
    try {
      scene.sound.play(key, { volume: session.settings.sfxVolume * volume });
    } catch {
      // Sound is never critical.
    }
  };
  /** A full-screen layer from a 512×384 picture, scaled to cover. */
  const cover = (key: string, alpha: number, d = depth) => {
    const img = add(scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setDepth(d).setAlpha(0));
    img.setScale(Math.max(GAME_WIDTH / img.width, GAME_HEIGHT / img.height));
    tw({ targets: img, alpha, duration: 260 });
    return img;
  };
  /** Gigantamax's own finish (Dynamax shares the ball and the growth): a gold ring, rising sparks and a G-MAX banner when the giant form appears. */
  const gmaxFlourish = () => {
    if (reduced) return;
    const swap = longDx ? DYNAMAX_LONG_SWAP_AT : SWAP_AT.gigantamax;
    const accent = o.accent ?? 0xffd24a;
    at(swap, () => {
      sound('ess-flash2', 0.7);
      const ring = add(scene.add.circle(o.x, o.y, 30, accent, 0).setStrokeStyle(8, accent, 1).setDepth(depth + 6));
      tw({ targets: ring, scale: 7, alpha: 0, duration: 700, ease: 'Cubic.easeOut' });
      for (let i = 0; i < 10; i++) {
        const spark = add(scene.add.star(o.x + (i - 5) * 22, o.y + 30, 5, 3, 8, accent).setDepth(depth + 7).setAlpha(0.95));
        tw({ targets: spark, y: o.y - 160 - (i % 3) * 40, alpha: 0, angle: 180, duration: 900, delay: i * 40 });
      }
      const banner = add(scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, o.gmaxName ?? 'G-MAX!', textStyle(o.gmaxName ? 44 : 64, `#${accent.toString(16).padStart(6, '0')}`, { stroke: '#3a1a00', strokeThickness: 10 })).setOrigin(0.5).setDepth(depth + 8).setAlpha(0).setScale(2.2));
      tw({ targets: banner, alpha: 1, scale: 1, duration: 320, ease: 'Back.easeOut' });
      tw({ targets: banner, alpha: 0, duration: 400, delay: 900 });
    });
  };
  const whiteFlash = (alpha: number) => {
    const r = add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, alpha * o.intensity).setDepth(depth + 20));
    tw({ targets: r, alpha: 0, duration: 380 });
  };
  const bars = () => {
    if (!has('cine.raid.transitions.black_bars')) return;
    const b = cover('cine.raid.transitions.black_bars', 1, depth + 30);
    b.setScale(GAME_WIDTH / b.width, GAME_HEIGHT / b.height);
  };
  /** Fades every layer out over the last 300 ms. */
  const fadeAll = () => at(Math.max(0, total * o.speed - 300), () => tw({ targets: objs.filter((x) => (x as Phaser.GameObjects.Image).active), alpha: 0, duration: 300 }));

  /** Slowly turning light rays over the Max-energy field (drawn, so there is no picture edge to show). */
  const maxRays = (duration: number, fadeAt?: number) => {
    const g = add(scene.add.graphics().setDepth(depth + 1).setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2));
    const n = 24;
    const len = Math.hypot(GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0xffffff, 0.22 * Math.max(0.4, o.intensity));
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      g.fillTriangle(0, 0, Math.cos(a0) * len, Math.sin(a0) * len, Math.cos(a1) * len, Math.sin(a1) * len);
    }
    g.setAlpha(0);
    tw({ targets: g, alpha: 1, duration: 300 });
    tw({ targets: g, angle: 30, duration });
    if (fadeAt !== undefined) tw({ targets: g, alpha: 0, duration: 900, delay: fadeAt });
  };

  /** The old sprite (before the swap): turned white, red or hidden by the scenes below. */
  const oldSprite = o.sprite instanceof Phaser.GameObjects.Sprite ? o.sprite : null;
  const jiggle = (target: Phaser.GameObjects.GameObject & { x: number }, delay: number, times = 3) => {
    if ((o.shake ?? o.intensity) <= 0) return;
    tw({ targets: target, x: target.x + 3 * (o.shake ?? o.intensity), duration: 40, delay, yoyo: true, repeat: times });
  };

  /** The trainer's key item rises below the Pokémon and flares (full motion only; skipped if its picture isn't loaded). */
  const keyItem = () => {
    const key = keyItemFor(o.kind, o.crystal);
    if (!key || !has(key)) return;
    const y = o.y + 96;
    if (has('cine.dbk.mega.shine')) {
      const halo = add(scene.add.image(o.x, y - 30, 'cine.dbk.mega.shine').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 7).setAlpha(0).setScale(0.25));
      tw({ targets: halo, alpha: 0.9, scale: 0.45, duration: 260, delay: 140, yoyo: true, hold: 160 });
    }
    const item = add(scene.add.image(o.x, y, key).setDepth(depth + 8).setAlpha(0));
    item.setScale(56 / Math.max(item.width, item.height));
    tw({ targets: item, y: y - 30, alpha: 1, duration: 300, ease: 'Back.easeOut' });
    at(300, () => item.active && item.setTintFill(0xffffff));
    at(380, () => item.active && item.clearTint());
    tw({ targets: item, alpha: 0, y: y - 44, duration: 220, delay: 640 });
  };

  if (!reduced && o.kind !== 'evolve' && o.kind !== 'dynamaxEnd' && o.kind !== 'zmove' && o.kind !== 'mega') keyItem();
  if (reduced) {
    // Reduced motion: a soft glow and the symbol, no flying pieces or shaking.
    if (has('cine.dbk.mega.shine')) {
      const glow = add(scene.add.image(o.x, o.y, 'cine.dbk.mega.shine').setTint(o.tint).setBlendMode('ADD').setDepth(depth).setAlpha(0).setScale(0.6));
      tw({ targets: glow, alpha: 0.8, duration: 200, yoyo: true, hold: 200 });
    }
    at(SWAP_AT[o.kind] === CINE_MS[o.kind] ? 600 : 250, swap);
  } else if (o.kind === 'mega') {
    megaReference();
  } else if (o.kind === 'primal') {
    mega();
  } else if (o.kind === 'tera') {
    teraCrystal();
  } else if (o.kind === 'dynamax' || o.kind === 'gigantamax') {
    if (longDx) giantBallLong();
    else giantBall();
    if (o.kind === 'gigantamax') gmaxFlourish();
  } else if (o.kind === 'evolve') {
    evolve();
  } else if (o.kind === 'dynamaxEnd') {
    if (has('pack.dbk.burst')) {
      const puff = add(scene.add.image(o.x, o.y, 'pack.dbk.burst').setTint(0xff3060).setBlendMode('ADD').setDepth(depth).setScale(1.2));
      tw({ targets: puff, scale: 0.2, alpha: 0, duration: 500, ease: 'Cubic.easeIn' });
    }
    sound('ess-refresh', 0.6);
    at(SWAP_AT.dynamaxEnd, swap);
  } else {
    zPower();
  }

  function mega(): void {
    const crystal = `cine.primega.${o.crystal ?? 'mega'}`;
    bars();
    const dim = add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0618, 0).setDepth(depth));
    tw({ targets: dim, fillAlpha: 0.55, duration: 300 });
    // The PRSFX Mega Evolution sounds (Pokémon Memories) when they're loaded, else the Essentials stand-ins.
    const megaSfx = scene.cache.audio.exists('cine.sfx.mega1');
    sound(megaSfx ? 'cine.sfx.mega1' : 'ess-harden', 1);
    // The Pokémon glows white while the crystal builds around it.
    at(250, () => o.sprite instanceof Phaser.GameObjects.Sprite && o.sprite.active && o.sprite.setTintFill(0xffffff));
    if (has('cine.dbk.mega.orb_1')) {
      const orb = add(scene.add.image(o.x, o.y, 'cine.dbk.mega.orb_1').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 1).setAlpha(0.5).setScale(0));
      tw({ targets: orb, scale: 0.8, duration: 900, ease: 'Sine.easeOut' });
    }
    // Charge: motes drawn in from a fixed ring.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const mote = add(scene.add.image(o.x + Math.cos(a) * 220, o.y + Math.sin(a) * 160, has('pack.dbk.particle') ? 'pack.dbk.particle' : '__WHITE').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 2).setScale(0.6));
      tw({ targets: mote, x: o.x, y: o.y, scale: 0.1, duration: 500, delay: 100 + i * 60, ease: 'Quad.easeIn' });
    }
    if (has('cine.raid.transitions.shine')) {
      const ring = add(scene.add.image(o.x, o.y, 'cine.raid.transitions.shine').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 2).setScale(1.4).setAlpha(0));
      tw({ targets: ring, scale: 0.3, alpha: 0.9, duration: 800, delay: 150, ease: 'Quad.easeIn' });
    }
    if (!has(crystal)) {
      at(SWAP_AT.mega, () => {
        swap();
        whiteFlash(0.8);
      });
      return;
    }
    // The crystal builds piece by piece, then cracks.
    const S = 0.7;
    const pieces = shards.centres.map(([dx, dy], i) => {
      const n = String(i + 1).padStart(2, '0');
      const p = add(scene.add.image(o.x + dx! * S, o.y + dy! * S, crystal, `p${n}`).setScale(S * 1.3).setAlpha(0).setDepth(depth + 3));
      const c = add(scene.add.image(p.x, p.y, crystal, `c${n}`).setScale(S).setAlpha(0).setDepth(depth + 4).setBlendMode('ADD'));
      tw({ targets: p, alpha: 1, scale: S, duration: 140, delay: 300 + i * 28, ease: 'Back.easeOut' });
      return { p, c, dx: dx!, dy: dy!, i };
    });
    if (!megaSfx) {
      at(400, () => sound('ess-twine', 0.7));
      at(700, () => sound('ess-refresh', 0.8));
    }
    for (const s of pieces) {
      tw({ targets: s.c, alpha: 1, duration: 300, delay: 950 });
      // Each shard flickers once, at its own fixed moment.
      at(980 + ((s.i * 37) % 300), () => s.p.active && s.p.setTintFill(0xffffff));
      at(1040 + ((s.i * 37) % 300), () => s.p.active && s.p.clearTint());
    }
    at(SWAP_AT.mega, () => {
      swap();
      sound(megaSfx ? 'cine.sfx.mega2' : 'ess-shell-smash', 1);
      whiteFlash(0.85);
      if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(260 / o.speed, 0.01 * (o.shake ?? o.intensity));
      for (const s of pieces) {
        const len = Math.hypot(s.dx, s.dy) || 1;
        const v = 200 + ((s.i * 53) % 140);
        tw({ targets: [s.p, s.c], x: o.x + (s.dx / len) * v, duration: 750, ease: 'Quad.easeOut' });
        tw({ targets: [s.p, s.c], y: o.y + (s.dy / len) * v * 0.7 + 120, duration: 750, ease: 'Quad.easeIn' });
        tw({ targets: [s.p, s.c], angle: (s.i % 2 ? 1 : -1) * (120 + s.i * 9), alpha: 0, duration: 750 });
      }
      // The symbol: Mega, or Groudon's / Kyogre's Primal mark.
      const sym = o.crystal === 'omega' ? 'cine.dbk.primal.icon_groudon' : o.crystal === 'alpha' ? 'cine.dbk.primal.icon_kyogre' : 'pack.ebdx.symMega';
      if (has(sym)) {
        const mark = add(scene.add.image(o.x, o.y - 30, sym).setDepth(depth + 6).setScale(0));
        const size = sym.startsWith('cine') ? 0.6 : 3;
        tw({ targets: mark, scale: size, duration: 380, ease: 'Back.easeOut', yoyo: true, hold: 520 });
      }
    });
    fadeAll();
  }

  /**
   * Mega Evolution, as in the director's reference clip: the scene goes dark,
   * the Pokémon is a black silhouette while the key stone and Mega Stone
   * float over it and a pink spark reaches it, it turns white, a white ball
   * grows round it and cracks into a crystal that deepens from white to red,
   * the crystal bursts in a white flash, and the Mega form is revealed over
   * blue light rays with the Mega symbol above it.
   */
  function megaReference(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const dim = add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(depth));
    tw({ targets: dim, fillAlpha: 0.88, duration: 300 });
    const megaSfx = scene.cache.audio.exists('cine.sfx.mega1');
    sound(megaSfx ? 'cine.sfx.mega1' : 'ess-harden', 1);
    // 1. The Pokémon goes dark, then white.
    at(150, () => oldSprite?.active && oldSprite.setTintFill(0x000000));
    at(1200, () => oldSprite?.active && oldSprite.setTintFill(0xffffff));
    // 2. The key stone and the Mega Stone float above; a pink spark flies to the Pokémon.
    const props: Phaser.GameObjects.GameObject[] = [];
    const stones: Array<[string, number, number, number]> = [['cine.key.mega', -70, -120, 36], ['cine.dbk.mega.orb_1', -20, -96, 40]];
    for (const [key, dx, dy, size] of stones) {
      if (!has(key)) continue;
      const st = add(scene.add.image(o.x + dx, o.y + dy, key).setDepth(depth + 8).setAlpha(0));
      props.push(st);
      if (key.includes('orb')) st.setTint(o.tint).setBlendMode('ADD');
      st.setScale(size / Math.max(st.width, st.height));
      tw({ targets: st, alpha: 1, duration: 250, delay: 300 });
      tw({ targets: st, y: st.y - 8, duration: 500, yoyo: true, repeat: 1, delay: 500, ease: 'Sine.easeInOut' });
    }
    const spark = add(scene.add.image(o.x - 120, o.y - 20, has('pack.dbk.particle') ? 'pack.dbk.particle' : '__WHITE').setTint(0xff4a98).setBlendMode('ADD').setDepth(depth + 8).setScale(has('pack.dbk.particle') ? 1.4 : 0.6).setAlpha(0));
    props.push(spark);
    tw({ targets: spark, alpha: 1, duration: 200, delay: 400 });
    tw({ targets: spark, x: o.x, y: o.y, duration: 700, delay: 500, ease: 'Sine.easeIn' });
    tw({ targets: spark, alpha: 0, scale: 0.2, duration: 150, delay: 1200 });
    // 3. A white ball grows round it, cracks, and deepens from white to red.
    const radius = Math.min(150, Math.max(...shards.centres.map(([dx, dy]) => Math.hypot(dx!, dy!))) * 0.7 + 30);
    const ball = add(scene.add.circle(o.x, o.y, radius, 0xffffff, 1).setDepth(depth + 7).setScale(0.2).setAlpha(0));
    tw({ targets: ball, scale: 1, alpha: 1, duration: 260, delay: 1300, ease: 'Back.easeOut' });
    const crystal = 'cine.primega.mega';
    const S = 0.7;
    const pieces = has(crystal)
      ? shards.centres.map(([dx, dy], i) => {
          const n = String(i + 1).padStart(2, '0');
          const p = add(scene.add.image(o.x + dx! * S, o.y + dy! * S, crystal, `p${n}`).setScale(S).setAlpha(0).setDepth(depth + 8).setTintFill(0xffffff));
          const c = add(scene.add.image(p.x, p.y, crystal, `c${n}`).setScale(S).setAlpha(0).setDepth(depth + 9).setBlendMode('ADD').setTint(0xfff0c0));
          tw({ targets: p, alpha: 1, duration: 120, delay: 1600 });
          tw({ targets: c, alpha: 1, duration: 400, delay: 2300 });
          return { p, c, dx: dx!, dy: dy!, i };
        })
      : [];
    const fade = { v: 0 };
    const white = Phaser.Display.Color.ValueToColor(0xffffff);
    const red = Phaser.Display.Color.ValueToColor(0x6e1824);
    tw({
      targets: fade,
      v: 1,
      duration: 800,
      delay: 1650,
      onUpdate: () => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(white, red, 100, Math.round(fade.v * 100));
        const col = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
        ball.setFillStyle(col);
        for (const s of pieces) s.p.active && s.p.setTintFill(col);
      },
    });
    if (!megaSfx) {
      at(1400, () => sound('ess-twine', 0.7));
      at(1900, () => sound('ess-refresh', 0.8));
    }
    // 4. Burst: the swap happens under a full white flash, then the reveal.
    at(SWAP_AT.mega, () => {
      swap();
      sound(megaSfx ? 'cine.sfx.mega2' : 'ess-shell-smash', 1);
      ball.destroy();
      props.forEach((x) => x.destroy());
      if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(260 / o.speed, 0.01 * (o.shake ?? o.intensity));
      for (const s of pieces) {
        const len = Math.hypot(s.dx, s.dy) || 1;
        const v = 220 + ((s.i * 53) % 140);
        tw({ targets: [s.p, s.c], x: o.x + (s.dx / len) * v, duration: 700, ease: 'Quad.easeOut' });
        tw({ targets: [s.p, s.c], y: o.y + (s.dy / len) * v * 0.7 + 100, duration: 700, ease: 'Quad.easeIn' });
        tw({ targets: [s.p, s.c], angle: (s.i % 2 ? 1 : -1) * (120 + s.i * 9), alpha: 0, duration: 700 });
      }
      // Blue sky with light rays turning slowly, and a bright halo round the Pokémon.
      add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x0f7de6, 1).setDepth(depth + 3));
      const rays = add(scene.add.graphics({ x: o.x, y: o.y }).setDepth(depth + 4));
      rays.fillStyle(0x8fd8ff, 0.5);
      const R = Math.hypot(GAME_WIDTH, GAME_HEIGHT);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const w = 0.09 + ((i * 7) % 5) * 0.015;
        rays.fillTriangle(0, 0, Math.cos(a) * R, Math.sin(a) * R, Math.cos(a + w) * R, Math.sin(a + w) * R);
      }
      tw({ targets: rays, angle: 10, duration: 1400 });
      if (has('cine.dbk.mega.shine')) {
        const halo = add(scene.add.image(o.x, o.y, 'cine.dbk.mega.shine').setTint(0xfff4c8).setBlendMode('ADD').setDepth(depth + 5).setScale(0.4));
        tw({ targets: halo, scale: 1.1, alpha: 0.7, duration: 1100 });
      }
      // The real sprite lives inside the battle field (below this layer), so the reveal draws a copy above the sky: a silhouette that colours in.
      if (newVisual instanceof Phaser.GameObjects.Sprite && newVisual.active) {
        const m = newVisual.getWorldTransformMatrix().decomposeMatrix() as { translateX: number; translateY: number; scaleX: number; scaleY: number };
        const copy = add(scene.add.sprite(m.translateX, m.translateY, newVisual.texture.key, newVisual.frame.name).setOrigin(newVisual.originX, newVisual.originY).setScale(m.scaleX, m.scaleY).setDepth(depth + 6));
        copy.setTintFill(0x000000);
        at(450, () => copy.active && copy.clearTint());
      }
      whiteFlash(1);
      const sym = 'pack.ebdx.symMega';
      if (has(sym)) {
        const mark = add(scene.add.image(o.x, o.y - 70, sym).setDepth(depth + 10).setScale(0));
        tw({ targets: mark, scale: 3, duration: 380, delay: 450, ease: 'Back.easeOut', yoyo: true, hold: 520 });
      }
    });
    fadeAll();
  }

  // Deluxe Battle Kit's Terastallization scene: the stage takes the Tera Type's
  // colour, the Pokémon turns white, the Tera jewel flashes, crystal grows
  // round it in three stages and shakes, a white flash reveals the Tera form,
  // the crystal shatters and a rainbow pulse rings out.
  function teraCrystal(): void {
    bars();
    if (has('cine.raid.tera.bg')) cover('cine.raid.tera.bg', 0.75).setTint(o.tint);
    at(200, () => oldSprite?.active && oldSprite.setTintFill(0xffffff));
    if (has('cine.dbk.tera.icon')) {
      const icon = add(scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'cine.dbk.tera.icon').setDepth(depth + 5).setScale(1.4).setAlpha(0));
      tw({ targets: icon, scale: 0.6, alpha: 1, duration: 320, delay: 150, ease: 'Back.easeOut' });
      tw({ targets: icon, scale: 1.3, alpha: 0, duration: 300, delay: 650 });
    }
    // The crystal: three stages over the Pokémon (512×384 pictures centred on it).
    const crystals: Phaser.GameObjects.Image[] = [];
    [1, 2, 3].forEach((n, i) => {
      const key = `cine.dbk.tera.crystal_${n}`;
      if (!has(key)) return;
      const c = add(scene.add.image(o.x, o.y, key).setDepth(depth + 3 + i).setScale(1.1).setAlpha(0));
      crystals.push(c);
      tw({ targets: c, alpha: 1, duration: 150, delay: 500 + i * 160 });
      at(500 + i * 160, () => sound('ess-harden', 0.7));
    });
    at(1000, () => crystals.forEach((c) => jiggle(c, 0, 4)));
    sound('ess-refresh', 0.8);
    at(SWAP_AT.tera, () => {
      swap();
      whiteFlash(0.8);
      sound('ess-shell-smash', 0.9);
      rays();
      crystals.forEach((c) => c.setVisible(false));
      // The crystal breaks: shards fly out on fixed paths.
      if (has('cine.dbk.tera.crystal_4')) {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + 0.3;
          const shard = add(scene.add.image(o.x, o.y, 'cine.dbk.tera.crystal_4').setDepth(depth + 6).setScale(0.35).setAngle(i * 36));
          tw({ targets: shard, x: o.x + Math.cos(a) * 220, y: o.y + Math.sin(a) * 160, angle: i * 36 + 180, scale: 0.1, alpha: 0, duration: 650, ease: 'Cubic.easeOut' });
        }
      }
      if (has('cine.dbk.tera.shine')) {
        const shine = add(scene.add.image(o.x, o.y, 'cine.dbk.tera.shine').setBlendMode('ADD').setDepth(depth + 2).setScale(0.6));
        tw({ targets: shine, scale: 1.4, alpha: 0, duration: 800, ease: 'Quad.easeOut' });
      }
      if (has('cine.dbk.tera.pulse')) {
        const ring = add(scene.add.image(o.x, o.y, 'cine.dbk.tera.pulse').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 2).setScale(0.3));
        tw({ targets: ring, scale: 3, alpha: 0, duration: 700, ease: 'Quad.easeOut' });
      }
      if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(260 / o.speed, 0.01 * (o.shake ?? o.intensity));
    });
    fadeAll();
  }

  /** The reference's reveal: a sunburst of rays (a blue-white sky with the Tera colour at the core) spins out behind the Pokémon, then fades. */
  function rays(): void {
    const g = add(scene.add.graphics().setDepth(depth + 1).setPosition(o.x, o.y));
    const n = 16;
    const len = Math.hypot(GAME_WIDTH, GAME_HEIGHT);
    g.fillStyle(0x7ac0ff, 0.55 * o.intensity);
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      g.fillTriangle(0, 0, Math.cos(a0) * len, Math.sin(a0) * len, Math.cos(a1) * len, Math.sin(a1) * len);
    }
    g.fillStyle(o.tint, 0.5 * o.intensity).fillCircle(0, 0, 70);
    g.setScale(0.2).setAlpha(0.9);
    tw({ targets: g, scale: 1, angle: 14, duration: 650, ease: 'Cubic.easeOut' });
    tw({ targets: g, alpha: 0, duration: 450, delay: 450 });
  }

  // The full Dynamax scene, beat for beat after the reference: the Pokémon is
  // recalled into its ball, the trainer turns to face the player and raises the
  // Dynamax Band, the ball swells pink, is thrown up and slams down (the screen
  // shakes), and the giant Pokémon bursts out as a silhouette on pink rays,
  // flashing red as it roars.
  function giantBallLong(): void {
    const grow = o.kind === 'gigantamax' ? 1.3 : DYNAMAX_SCALE;
    const swapAt = DYNAMAX_LONG_SWAP_AT;
    // The real Poké Ball picture (a 12x16 icon, so it is scaled up from the pack ball's 256 px size).
    const ballItem = o.ball ?? DEFAULT_BALL;
    const ballKey = has('ball.pb') ? 'ball.pb' : 'pack.ebdx.tr.ball';
    const bk = has(ballKey) ? 256 / scene.textures.get(ballKey).getSourceImage().height : 1;
    const ground = o.y + 70;
    bars();
    sound('ess-flash2', 0.5);
    // 0-700: the ball opens and the Pokémon, flushed pale pink, is called back into it.
    const ball = has(ballKey)
      ? add(ballVisual(scene, ballItem, o.x + sideX * 20, ground, 0.3 * bk).setDepth(depth + 5).setAlpha(0))
      : add(scene.add.circle(o.x + sideX * 20, ground, 14, 0xff3060).setDepth(depth + 5).setAlpha(0));
    tw({ targets: ball, alpha: 1, duration: 120, delay: 200 });
    if (oldSprite?.active) {
      at(0, () => oldSprite.active && oldSprite.setTint(0xf8b0f0));
      tw({ targets: oldSprite, scale: 0, y: ground, duration: 300, delay: 400, ease: 'Cubic.easeIn' });
      at(300, () => sound('ess-refresh', 0.7));
    }
    // 700-1100: the trainer slides in from the side, facing the player.
    const trainer = o.trainerFront?.() ?? o.trainer?.() ?? null;
    if (trainer) {
      const tx = o.x + sideX * 190;
      add(trainer).setDepth(depth + 4).setPosition(o.enemySide ? GAME_WIDTH + 120 : -120, ground + 40).setScale(trainer.scale * 0.9).setAlpha(1);
      tw({ targets: trainer, x: tx, duration: 400, delay: 700, ease: 'Sine.easeOut' });
      tw({ targets: ball, x: o.x + sideX * 130, duration: 400, delay: 700, ease: 'Sine.easeOut' });
      // 1900-2300: …and leaves again as the scene floods pink.
      tw({ targets: trainer, x: tx + sideX * 500, scale: trainer.scale * 2, alpha: 0, duration: 450, delay: 2300, ease: 'Cubic.easeIn' });
    }
    // 1200-1900: the Dynamax Band rises above the trainer with a white outline.
    const bandKey = keyItemFor(o.kind, o.crystal);
    if (bandKey && has(bandKey)) {
      const bx = o.x + sideX * 190;
      const by = ground - 150;
      const halo = add(scene.add.image(bx, by, bandKey).setDepth(depth + 6).setAlpha(0));
      halo.setTintFill(0xffffff).setScale(60 / Math.max(halo.width, halo.height) * 1.18);
      const band = add(scene.add.image(bx, by, bandKey).setDepth(depth + 7).setAlpha(0));
      band.setScale(60 / Math.max(band.width, band.height));
      tw({ targets: [halo, band], y: by - 24, alpha: 1, duration: 450, delay: 1200, ease: 'Back.easeOut' });
      tw({ targets: [halo, band], alpha: 0, duration: 200, delay: 2000 });
      at(1250, () => sound('ess-twine', 0.6));
    }
    // 1900-2300: the ball swells and turns pink.
    at(2000, () => sound('ess-flash2', 0.8));
    tw({ targets: ball, scale: has(ballKey) ? 0.45 * bk : 1.5, duration: 300, delay: 2000, ease: 'Back.easeOut' });
    at(2000, () => (ball as Phaser.GameObjects.Image).setTint?.(o.calyrex ? 0x00cccc : 0xff3399));
    // The pink field, rays and the darkness it fades back from.
    const pink = add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, fieldColor, 0).setDepth(depth));
    tw({ targets: pink, fillAlpha: 1, duration: 380, delay: 2300 });
    at(2300, () => {
      whiteFlash(0.6);
      maxRays(swapAt - 2300 + 1200, swapAt - 2300 + 400);
    });
    // 2700-3300: the ball falls from above and slams down; the screen shakes four times.
    at(2700, () => {
      ball.setPosition(o.x, -80).setScale(has(ballKey) ? 0.45 * bk : 1.5).setAlpha(1);
      tw({ targets: ball, y: ground - 10, duration: 260, ease: 'Quad.easeIn' });
    });
    for (const [i, t] of [2960, 3060, 3160, 3240].entries()) {
      at(t, () => {
        if (i === 0) sound('ess-explosion', 0.9);
        if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(90 / o.speed, (0.014 - i * 0.003) * (o.shake ?? o.intensity));
      });
    }
    at(3300, () => sound('ess-refresh', 0.8));
    // 3300-4100: the Pokémon swells out of the ball as a white silhouette, then turns Max red.
    let ghost: Phaser.GameObjects.Image | null = null;
    if (oldSprite?.texture && oldSprite.texture.key !== '__MISSING') {
      // The Pokémon's own frame, drawn above the pink at its resting place.
      const m = oldSprite.getWorldTransformMatrix();
      const bs = Math.abs(m.scaleX) > 0.01 ? Math.abs(m.scaleX) : 1;
      at(3300, () => {
        ghost = add(scene.add.image(o.x, ground, oldSprite.texture.key, oldSprite.frame?.name).setOrigin(oldSprite.originX, oldSprite.originY).setDepth(depth + 3).setScale(bs * 0.1));
        ghost.setTintFill(0xffffff);
        tw({ targets: ghost, scale: bs * grow, duration: 800, ease: 'Cubic.easeOut' });
        tw({ targets: ghost, y: m.ty, duration: 800, ease: 'Cubic.easeOut' });
        ghost.setX(m.tx);
      });
      at(3700, () => {
        if (!ghost?.active) return;
        ghost.clearTint();
        ghost.setTint(outlineColor);
      });
    }
    at(3300, () => tw({ targets: ball, alpha: 0, scale: 0.9, duration: 260 }));
    if (has('pack.dbk.burst')) {
      const glow = add(scene.add.image(o.x, o.y, 'pack.dbk.burst').setTint(0xff3060).setBlendMode('ADD').setDepth(depth + 2).setScale(0.3 * bk).setAlpha(0));
      tw({ targets: glow, scale: 2.4, alpha: 0.8, duration: 800, delay: 3300, yoyo: true });
    }
    // 4100: the giant Pokémon is there; it roars with the pulse, flashing and shaking.
    at(swapAt, () => {
      ghost?.setVisible(false);
      swap();
      sound('ess-explosion', 0.9);
      if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(420 / o.speed, 0.014 * (o.shake ?? o.intensity));
      if (has('cine.dbk.tera.pulse')) {
        const ring = add(scene.add.image(o.x, o.y, 'cine.dbk.tera.pulse').setTint(outlineColor).setBlendMode('ADD').setDepth(depth + 4).setScale(0.3));
        tw({ targets: ring, scale: 5, alpha: 0, duration: 800, ease: 'Quad.easeOut' });
      }
    });
    for (const t of [swapAt + 120, swapAt + 320, swapAt + 560]) at(t, () => whiteFlash(0.3));
    // The pink lifts and the battle returns.
    tw({ targets: pink, fillAlpha: 0, duration: 1000, delay: swapAt + 500 });
    fadeAll();
  }

  // The Dynamax scene, after the reference footage: the screen floods pink with
  // light rays, the Pokémon is a white silhouette that swells to giant size,
  // takes on red Max energy, then the scene fades to dark and the battle
  // returns with the giant Pokémon standing in it.
  function giantBall(): void {
    const grow = o.kind === 'gigantamax' ? 1.3 : DYNAMAX_SCALE;
    const ms = CINE_MS[o.kind];
    const swapAt = SWAP_AT[o.kind];
    bars();
    // The pink field and slowly turning rays.
    const pink = add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, fieldColor, 0).setDepth(depth));
    // First the trainer's throw (the reference's opening): the ball flies to the Pokémon, which is called back into it.
    const trainer = o.trainer?.() ?? null;
    if (trainer) {
      add(trainer).setDepth(depth + 4).setScale(trainer.scale * 0.45).setPosition(o.x - 170, o.y + 90).setAlpha(0);
      tw({ targets: trainer, alpha: 1, duration: 140 });
      tw({ targets: trainer, alpha: 0, duration: 200, delay: 560 });
      if (has('pack.ebdx.tr.ball')) {
        const ball = add(scene.add.image(o.x - 150, o.y + 30, 'pack.ebdx.tr.ball').setDepth(depth + 5).setScale(0.22).setTint(0xff6080).setAlpha(0));
        tw({ targets: ball, alpha: 1, duration: 60, delay: 160 });
        tw({ targets: ball, x: o.x, duration: 300, delay: 160, ease: 'Sine.easeOut' });
        tw({ targets: ball, y: o.y - 60, duration: 150, delay: 160, ease: 'Quad.easeOut' });
        tw({ targets: ball, y: o.y, duration: 150, delay: 310, ease: 'Quad.easeIn' });
        tw({ targets: ball, alpha: 0, scale: 0.6, duration: 160, delay: 480 });
      }
    }
    tw({ targets: pink, fillAlpha: 1, duration: 260, delay: 480 });
    at(480, () => maxRays(swapAt));
    // The darkness the scene fades into just before the battle comes back.
    const dark = add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x14060e, 0).setDepth(depth + 6));
    tw({ targets: dark, fillAlpha: 1, duration: 420, delay: swapAt - 520 });
    sound('ess-flash2', 0.7);
    // The silhouette: a copy of the Pokémon's own art, filled white.
    let ghost: Phaser.GameObjects.Image | null = null;
    if (oldSprite?.active && oldSprite.texture && oldSprite.texture.key !== '__MISSING') {
      const m = oldSprite.getWorldTransformMatrix();
      const base = Math.abs(m.scaleX) || 1;
      ghost = add(scene.add.image(m.tx, m.ty, oldSprite.texture.key, oldSprite.frame?.name).setOrigin(oldSprite.originX, oldSprite.originY).setScale(base).setDepth(depth + 3));
      ghost.setTintFill(0xffffff);
      oldSprite.setAlpha(0);
      // Called back into the ball, then it reappears on the pink and swells.
      tw({ targets: ghost, scale: base * 0.05, duration: 220, delay: 300, ease: 'Cubic.easeIn' });
      at(780, () => ghost?.active && ghost.setScale(base * 0.4));
      tw({ targets: ghost, scale: base * grow, duration: 850, delay: 800, ease: 'Cubic.easeOut' });
      // White turns to red Max energy as it reaches full size.
      at(1450, () => {
        if (!ghost?.active) return;
        ghost.clearTint();
        ghost.setTint(o.calyrex ? 0x70f0f0 : 0xff5a78);
        whiteFlash(0.4);
      });
    } else if (oldSprite?.active) {
      oldSprite.setTintFill(0xffffff);
      tw({ targets: oldSprite, scale: oldSprite.scale * grow, duration: 1000, delay: 800, ease: 'Cubic.easeOut' });
    }
    const glow = has('pack.dbk.burst') ? add(scene.add.image(o.x, o.y, 'pack.dbk.burst').setTint(0xff3060).setBlendMode('ADD').setDepth(depth + 2).setScale(0.3).setAlpha(0)) : null;
    if (glow) tw({ targets: glow, scale: 2.2, alpha: 0.8, duration: 900, delay: 700, yoyo: true });
    at(1450, () => {
      sound('ess-explosion', 0.9);
      if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(380 / o.speed, 0.012 * (o.shake ?? o.intensity));
    });
    at(swapAt, () => {
      ghost?.setVisible(false);
      swap();
    });
    // The new (giant) sprite is already there when the dark lifts.
    tw({ targets: dark, fillAlpha: 0, duration: Math.max(200, ms - swapAt), delay: swapAt });
    fadeAll();
  }

  function evolve(): void {
    // The classic evolution: the Pokémon turns to light and pulses faster and faster, then bursts into its new form.
    bars();
    // A light dim: the field sits under it, so the glowing Pokémon must still read through.
    const dim = add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x06101e, 0).setDepth(depth - 1));
    tw({ targets: dim, fillAlpha: 0.3, duration: 300 });
    // The redesigned evolution looks (screens redesign): a frame, pattern and caption around the Pokémon, picked per evolution.
    const { session } = services();
    const look = screenStyleOf('evolve', session.settings.screenStyles, `${session.run?.seed ?? ''}:${session.run?.encountersCompleted ?? 0}:${Math.round(o.x)}`);
    if (look !== 'original') evolveLook(scene, look, o, depth - 1, add, tw);
    const s = o.sprite;
    const sx = s && 'scaleX' in s ? s.scaleX : 1;
    at(200, () => s instanceof Phaser.GameObjects.Sprite && s.active && s.setTintFill(0xffffff));
    if (has('cine.raid.transitions.impact')) {
      const rays = cover('cine.raid.transitions.impact', 0.5, depth);
      tw({ targets: rays, angle: 12, duration: 1800 });
    }
    sound('ess-refresh', 0.8);
    // Pulses: each a little quicker than the last (a fixed rhythm).
    let t = 250;
    for (const ms of [300, 260, 220, 180, 150, 120, 100, 80, 70, 60]) {
      at(t, () => s && s.active && tw({ targets: s, scaleX: sx * 0.7, duration: ms / 2, yoyo: true, ease: 'Sine.easeInOut' }));
      t += ms;
    }
    for (let i = 0; i < 10; i++) {
      const dx = ((i % 5) - 2) * 36;
      const mote = add(scene.add.image(o.x + dx, o.y + 80, has('pack.dbk.particle') ? 'pack.dbk.particle' : '__WHITE').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 2).setScale(0.5).setAlpha(0));
      tw({ targets: mote, y: o.y - 120, alpha: { from: 1, to: 0 }, duration: 700, delay: 200 + i * 120, ease: 'Sine.easeOut' });
    }
    at(1100, () => sound('ess-twine', 0.7));
    at(SWAP_AT.evolve, () => {
      if (s && s.active && 'setScale' in s) tw({ targets: s, scaleX: sx, duration: 1 });
      swap();
      sound('ess-shell-smash', 0.8);
      whiteFlash(0.9);
      if (has('pack.dbk.burst')) {
        const b = add(scene.add.image(o.x, o.y, 'pack.dbk.burst').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 3).setScale(0.3));
        tw({ targets: b, scale: 1.6, alpha: 0, duration: 650, ease: 'Cubic.easeOut' });
      }
      for (let i = 0; i < 6; i++) {
        if (!has('pack.ebdx.tr.shine2')) break;
        const a = (i / 6) * Math.PI * 2;
        const star = add(scene.add.image(o.x, o.y, 'pack.ebdx.tr.shine2').setScale(0.3).setDepth(depth + 4).setBlendMode('ADD'));
        tw({ targets: star, x: o.x + Math.cos(a) * 140, y: o.y + Math.sin(a) * 100, scale: 0, duration: 650, ease: 'Cubic.easeOut' });
      }
    });
    fadeAll();
  }

  function zPower(): void {
    // Reference look (Gen 7 Z-Move): dim the field, the Pokémon turns into a white shape with the Z-Crystal over it,
    // blue speed lines build to a white-out, then the move's name arrives with the rainbow Z-ring.
    const titleKey = o.titleId ? zTitleAssetId(o.titleId) : '';
    if (titleKey && !has(titleKey) && services().assets.has(titleKey)) void loadAssets(scene, [titleKey]).catch(() => undefined);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const color = `#${o.tint.toString(16).padStart(6, '0')}`;
    const dim = add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0).setDepth(depth));
    tw({ targets: dim, fillAlpha: 0.82, duration: 260 });
    // 1. The Pokémon turns to a white shape.
    at(250, () => oldSprite?.active && oldSprite.setTintFill(0xffffff));
    // The Z-Crystal floats above it.
    const crystalKey = keyItemFor('zmove');
    if (crystalKey && has(crystalKey)) {
      const gem = add(scene.add.image(o.x, o.y - 90, crystalKey).setDepth(depth + 8).setAlpha(0));
      gem.setScale(72 / Math.max(gem.width, gem.height));
      tw({ targets: gem, alpha: 1, y: gem.y - 14, duration: 350, delay: 250, ease: 'Sine.easeOut' });
      tw({ targets: gem, y: gem.y - 24, duration: 500, delay: 700, yoyo: true, ease: 'Sine.easeInOut' });
    }
    // 2. Blue speed lines build behind the white shape, then a white-out.
    if (has('cine.raid.transitions.impact')) {
      const blue = add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x2a8cff, 0).setDepth(depth + 1));
      tw({ targets: blue, fillAlpha: 0.9, duration: 500, delay: 650 });
      const lines = cover('cine.raid.transitions.impact', 0.9, depth + 2);
      lines.setAlpha(0).setTint(0x8fd0ff);
      tw({ targets: lines, alpha: 0.95, angle: 10, duration: 900, delay: 650 });
    }
    for (let i = 0; i < 12; i++) {
      if (!has('cine.dbk.zpower.particle')) break;
      const a = (i / 12) * Math.PI * 2;
      const p = add(scene.add.image(o.x + Math.cos(a) * 260, o.y + Math.sin(a) * 170, 'cine.dbk.zpower.particle').setTint(0xcfe8ff).setBlendMode('ADD').setDepth(depth + 4).setScale(1.2).setAlpha(0));
      tw({ targets: p, x: o.x, y: o.y, scale: 0.3, alpha: { from: 1, to: 0.2 }, duration: 520, delay: 500 + (i % 4) * 90, ease: 'Cubic.easeIn' });
    }
    if (oldSprite) at(900, () => oldSprite.active && oldSprite.setScale(oldSprite.scaleX * 1.08, oldSprite.scaleY * 1.08));
    const flash = add(scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setDepth(depth + 20));
    tw({ targets: flash, fillAlpha: 1, duration: 260, delay: 1050 });
    tw({ targets: flash, fillAlpha: 0, duration: 380, delay: 1380 });
    // 3. The move screen: darkened field, rainbow Z-ring and the move's name, sliding in from the left.
    at(1300, () => {
      if (over) return;
      if (oldSprite?.active) oldSprite.clearTint().setVisible(false);
      for (const x of objs) if (x !== flash && x !== dim) (x as Phaser.GameObjects.Image).setVisible?.(false);
      dim.setFillStyle(0x0a0a14, 1).setDepth(depth + 2);
      const glow = add(scene.add.rectangle(cx, cy + 40, GAME_WIDTH, 120, o.tint, 0.25).setDepth(depth + 3).setBlendMode('ADD'));
      glow.setAlpha(0);
      tw({ targets: glow, alpha: 1, duration: 200 });
      const ringX = 70;
      const ringY = cy + 40;
      const g = add(scene.add.graphics().setDepth(depth + 6));
      const rainbow = [0xff4040, 0xff9a30, 0xffe040, 0x50d060, 0x40b0ff, 0x6060ff, 0xc060ff];
      rainbow.forEach((c, i) => {
        g.lineStyle(9, c, 1);
        g.beginPath();
        g.arc(ringX, ringY, 44, Phaser.Math.DegToRad(i * 36 + 10), Phaser.Math.DegToRad(i * 36 + 40));
        g.strokePath();
      });
      g.fillStyle(0xffffff, 1).fillCircle(ringX, ringY, 6);
      g.setAlpha(0);
      tw({ targets: g, alpha: 1, duration: 220 });
      tw({ targets: g, scale: { from: 0.4, to: 1 }, duration: 260, ease: 'Back.easeOut' });
      const key = o.titleId ? zTitleAssetId(o.titleId) : '';
      if (key && has(key)) {
        const card = add(scene.add.image(cx + 40, ringY, key).setDepth(depth + 7).setScale(1.1).setAlpha(0));
        tw({ targets: card, alpha: 1, x: cx + 20, duration: 300, ease: 'Cubic.easeOut' });
      } else if (o.title) {
        const t = add(scene.add.text(ringX + 52, ringY, o.title, textStyle(34, '#ffffff', { stroke: color, strokeThickness: 7 })).setOrigin(0, 0.5).setDepth(depth + 7).setAlpha(0));
        t.x -= 80;
        tw({ targets: t, alpha: 1, x: ringX + 52, duration: 320, ease: 'Cubic.easeOut' });
      }
      sound('ess-flash2', 0.8);
    });
    sound('ess-refresh', 0.9);
    at(SWAP_AT.zmove - 1, swap);
    at(total * o.speed - 320, () => oldSprite?.active && oldSprite.clearTint().setVisible(true));
    fadeAll();
  }

  let finish: () => void = () => undefined;
  let over = false;
  const done = new Promise<void>((resolve) => {
    finish = () => {
      if (over) return;
      over = true;
      if (o.kind === 'zmove' && oldSprite?.active) oldSprite.setVisible(true);
      timers.forEach((t) => t.remove(false));
      swap();
      onEnd.forEach((fn) => fn());
      for (const x of objs) {
        scene.tweens.killTweensOf(x);
        x.destroy();
      }
      resolve();
    };
  });
  timers.push(scene.time.delayedCall(total, () => finish()));
  return { done, skip: () => finish() };
}

export interface ChargeOptions {
  x: number;
  y: number;
  tint: number;
  /** What the charge really does, from the mechanic (e.g. "Next hit ×1.5"). Never more than the rules give. */
  label: string;
  motion: MotionLevel;
  intensity: number;
  depth?: number;
}

/**
 * A signature charge-up (Master Expansion Catalog 21): a wind-up aura, motes
 * drawn in, a rising hum and a preview pill saying what the charge does. Only
 * played for real mechanics: two-turn moves, raid telegraphs, a boss
 * gathering its strength.
 */
export function chargeUp(scene: Phaser.Scene, o: ChargeOptions): Beat {
  if (o.motion === 'off') return { done: Promise.resolve(), skip: () => undefined };
  const depth = o.depth ?? 880;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
    obj.setName('cine-charge');
    objs.push(obj);
    return obj;
  };
  const full = o.motion === 'full';
  const has = (k: string) => scene.textures.exists(k);
  if (has('cine.dbk.mega.shine')) {
    const aura = add(scene.add.image(o.x, o.y, 'cine.dbk.mega.shine').setTint(o.tint).setBlendMode('ADD').setDepth(depth).setScale(0.3).setAlpha(0));
    scene.tweens.add({ targets: aura, scale: full ? 0.75 : 0.6, alpha: 0.85, duration: 500, ease: 'Sine.easeOut' });
    if (full) scene.tweens.add({ targets: aura, scale: 0.65, duration: 260, delay: 500, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  }
  if (full) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      const mote = add(scene.add.image(o.x + Math.cos(a) * 130, o.y + Math.sin(a) * 100, has('pack.dbk.particle') ? 'pack.dbk.particle' : '__WHITE').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 1).setScale(0.5));
      scene.tweens.add({ targets: mote, x: o.x, y: o.y, scale: 0.1, alpha: 0.4, duration: 420, delay: i * 55, ease: 'Quad.easeIn' });
    }
    if (has('cine.raid.transitions.shine')) {
      const ring = add(scene.add.image(o.x, o.y, 'cine.raid.transitions.shine').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 1).setScale(0.9).setAlpha(0));
      scene.tweens.add({ targets: ring, scale: 0.25, alpha: 0.9, duration: 600, ease: 'Quad.easeIn' });
    }
  }
  const { session } = services();
  const key = animAssetIds.sound('ess-harden');
  if (!session.settings.muted && scene.cache.audio.exists(key)) {
    try {
      scene.sound.play(key, { volume: session.settings.sfxVolume * 0.7, rate: 0.8 });
    } catch {
      // Sound is never critical.
    }
  }
  // The preview pill: what the charge will do.
  const color = `#${o.tint.toString(16).padStart(6, '0')}`;
  const text = scene.add.text(0, 0, o.label, textStyle(17, '#ffffff', { stroke: '#0b2a4a', strokeThickness: 4 })).setOrigin(0.5);
  const w = text.width + 28;
  const g = scene.add.graphics();
  g.fillStyle(0x0b2a4a, 0.85).fillRoundedRect(-w / 2, -16, w, 32, 16);
  g.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1).strokeRoundedRect(-w / 2, -16, w, 32, 16);
  const pill = add(scene.add.container(Math.min(GAME_WIDTH - w / 2 - 8, Math.max(w / 2 + 8, o.x)), o.y - 110, [g, text]).setDepth(depth + 2).setScale(full ? 0.4 : 1).setAlpha(full ? 0 : 1));
  if (full) scene.tweens.add({ targets: pill, scale: 1, alpha: 1, duration: 300, delay: 250, ease: 'Back.easeOut' });
  let resolveDone: () => void = () => undefined;
  let over = false;
  const done = new Promise<void>((resolve) => (resolveDone = resolve));
  const finish = () => {
    if (over) return;
    over = true;
    for (const x of objs) {
      scene.tweens.killTweensOf(x);
      x.destroy();
    }
    resolveDone();
  };
  scene.time.delayedCall(full ? 1300 : 700, finish);
  return { done, skip: finish };
}
