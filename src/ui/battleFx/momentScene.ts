// The full-screen scene of a Pokémon moment (core/moments `scene`), built for "Failure Will (NOT) Be Tolerated":
// fade to black, static and electrical crackle, the voice reads each line over the dark Pokémon, then its eyes open red
// with a flash and the theme fades in. Presentation only: the revive already happened in the battle rules.
//
// Audio is the director's own clips in public/assets/audio/moments/ (see docs/quality/asset-provenance.md). If a clip is
// missing the scene still plays, silent, with the text. Mute and the sound/music volumes are respected; skipping (or
// minimal animations) keeps the text and the theme but drops the waits.

import Phaser from 'phaser';
import { pokemonAssetIds } from '../../assets/catalog';
import { getSpecies } from '../../core/pokemon';
import { services } from '../../game/services';
import { loadAssets } from '../lazyAssets';

const BASE = `${import.meta.env.BASE_URL}assets/audio/moments/`;
const THEME_FADE_MS = 2500;
let theme: HTMLAudioElement | null = null;
let themeFade: number | null = null;

function clip(name: string, volume: number): HTMLAudioElement | null {
  if (volume <= 0) return null;
  try {
    const a = new Audio(`${BASE}${name}.ogg`);
    a.volume = Math.min(1, volume);
    return a;
  } catch {
    return null;
  }
}

/** Plays a clip; resolves when it ends (or at once when it cannot play), never rejects. `maxMs` caps the wait. */
function playClip(name: string, volume: number, maxMs = 6000): Promise<void> {
  return new Promise((resolve) => {
    const a = clip(name, volume);
    if (!a) return resolve();
    const done = () => resolve();
    a.onended = done;
    a.onerror = done;
    a.play().catch(done);
    setTimeout(done, maxMs);
  });
}

/** The Overcharged theme: loops, fades in. Stopped when the battle scene shuts down. */
export function startMomentTheme(scene: Phaser.Scene, fast = false): void {
  const s = services().session.settings;
  const target = s.muted ? 0 : Math.min(1, s.musicVolume);
  stopMomentTheme();
  if (target <= 0) return;
  try {
    const a = new Audio(`${BASE}failure-theme.ogg`);
    a.loop = true;
    a.volume = fast ? target : 0;
    theme = a;
    void a.play().catch(() => undefined);
    if (!fast) {
      const t0 = performance.now();
      themeFade = window.setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / THEME_FADE_MS);
        a.volume = target * k;
        if (k >= 1 && themeFade !== null) { clearInterval(themeFade); themeFade = null; }
      }, 50);
    }
    scene.events.once('shutdown', stopMomentTheme);
  } catch {
    /* silent */
  }
}

export function stopMomentTheme(): void {
  if (themeFade !== null) { clearInterval(themeFade); themeFade = null; }
  if (theme) { theme.pause(); theme = null; }
}

export interface MomentSceneOptions {
  fadeMs: number;
  staticMs: number;
  lines: readonly string[];
  /** One clip name per line (same order); lines without a clip are shown for a moment, silent. */
  clips?: readonly string[];
  /** The Pokémon that comes back: its front art is shown dark on the black screen; its eyes open red at the end. */
  speciesId: string;
  /** Skip pressed or animations minimal: keep the text, drop the long waits. */
  fast: boolean;
}

/** Eye spots as fractions (0..1) of a species' front-art frame; species not listed get two eyes in the upper middle. */
const EYES: Record<string, [number, number][]> = {
  rotom: [[0.47, 0.42], [0.54, 0.42]],
  magnezone: [[0.37, 0.43], [0.74, 0.45]],
  golurk: [[0.45, 0.26], [0.54, 0.26]],
  golett: [[0.39, 0.33], [0.49, 0.33]],
  porygon2: [[0.2, 0.31], [0.3, 0.33]],
  'porygon-z': [[0.47, 0.29], [0.54, 0.29]],
  claydol: [[0.34, 0.64], [0.52, 0.64]],
  metagross: [[0.33, 0.42], [0.5, 0.42]],
  bronzong: [[0.43, 0.28], [0.5, 0.28]],
  klinklang: [[0.4, 0.66], [0.46, 0.66]],
  genesect: [[0.33, 0.41], [0.42, 0.4]],
  cryogonal: [[0.44, 0.6], [0.52, 0.6]],
  bastiodon: [[0.22, 0.28], [0.42, 0.28]],
  probopass: [[0.47, 0.26], [0.52, 0.26]],
};

/** The front art of a species, loaded first when needed: texture key and its first frame. Null when it can't be had. */
async function frontArt(scene: Phaser.Scene, speciesId: string): Promise<{ key: string; frame: string } | null> {
  try {
    const species = getSpecies(services().session.content, speciesId);
    const key = pokemonAssetIds(species.assets).front;
    if (!scene.textures.exists(key)) await loadAssets(scene, [key]);
    if (!scene.textures.exists(key)) return null;
    const frame = scene.textures.get(key).getFrameNames().sort()[0];
    return frame === undefined ? null : { key, frame };
  } catch {
    return null;
  }
}

export async function playMomentScene(scene: Phaser.Scene, opts: MomentSceneOptions): Promise<void> {
  const settings = services().session.settings;
  const w = scene.scale.width;
  const h = scene.scale.height;
  const sfx = settings.muted ? 0 : settings.sfxVolume;
  const fast = opts.fast;
  const wait = (ms: number) => (fast ? Promise.resolve() : new Promise<void>((r) => scene.time.delayedCall(ms, r)));
  const made: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => { made.push(o); return o; };
  const veil = add(scene.add.rectangle(0, 0, w, h, 0x000000, 1).setOrigin(0).setAlpha(0).setDepth(5000));
  const noise = add(scene.add.graphics().setDepth(5003));
  const text = add(scene.add.text(w / 2, h * 0.86, '', { fontFamily: 'monospace', fontSize: `${Math.max(12, Math.round(h / 26))}px`, color: '#8fe8ff', align: 'center', wordWrap: { width: w * 0.86 } }).setOrigin(0.5).setDepth(5004));
  try {
    scene.tweens.add({ targets: veil, alpha: 1, duration: fast ? 0 : opts.fadeMs });
    await wait(opts.fadeMs);
    veil.setAlpha(1);
    // The Pokémon, dark, in the middle of the black screen.
    const art = await frontArt(scene, opts.speciesId);
    let mon: Phaser.GameObjects.Image | null = null;
    let eyeSpots: { x: number; y: number }[] = [];
    if (art) {
      mon = add(scene.add.image(w / 2, h * 0.46, art.key, art.frame).setDepth(5001).setTint(0x151515));
      // Scale the whole source frame (padding included) so the eye fractions land on the art.
      const f = mon.frame;
      const scale = (h * 0.42) / f.realHeight;
      mon.setScale(scale);
      const left = mon.x - mon.displayWidth / 2;
      const top = mon.y - mon.displayHeight / 2;
      // Phaser sizes the image to the untrimmed source frame, so the fractions apply to its full width and height.
      eyeSpots = (EYES[opts.speciesId] ?? [[0.4, 0.3], [0.6, 0.3]]).map(([fx, fy]) => ({
        x: left + fx * f.realWidth * scale,
        y: top + fy * f.realHeight * scale,
      }));
    }
    // Static and electrical crackle (the director's clip) over flickering noise lines.
    void playClip('failure-static', sfx, 4600);
    const frames = fast ? 0 : Math.floor(opts.staticMs / 60);
    // Flicker from a tiny fixed-seed generator: presentation code never uses a random number source.
    let seed = 12345;
    const next = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < frames; i++) {
      noise.clear();
      for (let n = 0; n < 60; n++) noise.fillStyle(0xffffff, next() * 0.5).fillRect(next() * w, next() * h, 20 + next() * 80, 2);
      await wait(60);
    }
    noise.clear();
    // The voice, line by line.
    for (let i = 0; i < opts.lines.length; i++) {
      text.setText(opts.lines[i]!);
      const name = opts.clips?.[i];
      if (name && !fast) await playClip(name, sfx);
      else await wait(900);
      await wait(i === opts.lines.length - 1 ? 250 : 350);
    }
    // After the last line: the eyes open in red, the flash plays, the theme fades in.
    text.setText('');
    void playClip('failure-flash', sfx, 2400);
    startMomentTheme(scene, fast);
    if (mon) {
      for (const { x, y: eyeY } of eyeSpots) {
        const glow = add(scene.add.circle(x, eyeY, Math.max(6, mon.displayWidth * 0.05), 0xff1010, 0.35).setDepth(5002).setBlendMode(Phaser.BlendModes.ADD));
        const eye = add(scene.add.circle(x, eyeY, Math.max(3, mon.displayWidth * 0.022), 0xff3030, 1).setDepth(5002).setBlendMode(Phaser.BlendModes.ADD));
        if (!fast) scene.tweens.add({ targets: [glow, eye], alpha: { from: 0, to: 1 }, scale: { from: 0.2, to: 1 }, duration: 350 });
      }
      mon.setTint(0x5a2020);
    }
    const flash = add(scene.add.rectangle(0, 0, w, h, 0xffffff, fast ? 0 : 0.85).setOrigin(0).setDepth(5005));
    if (!fast) scene.tweens.add({ targets: flash, alpha: 0, duration: 500 });
    await wait(1600);
  } finally {
    const clear = () => { for (const o of made) o.destroy(); };
    if (fast) clear();
    else scene.tweens.add({ targets: veil, alpha: 0, duration: 600, onComplete: clear });
  }
}
