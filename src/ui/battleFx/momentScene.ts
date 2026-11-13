// The full-screen scene of a Pokémon moment (core/moments `scene`), built for "Failure Will (NOT) Be Tolerated":
// fade to black, static and electrical crackle, the voice reads each line over the dark Pokémon, then its eyes open red
// with a flash and the theme fades in. Presentation only: the revive already happened in the battle rules.
//
// Audio is the director's own clips in public/assets/audio/moments/ (see docs/quality/asset-provenance.md). If a clip is
// missing the scene still plays, silent, with the text. Mute and the sound/music volumes are respected; skipping (or
// minimal animations) keeps the text and the theme but drops the waits.

import Phaser from 'phaser';
import { services } from '../../game/services';

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
  /** The Pokémon that comes back: shown dark on the black screen; its eyes open red at the end. */
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | null;
  /** Skip pressed or animations minimal: keep the text, drop the long waits. */
  fast: boolean;
}

function spriteOf(v: MomentSceneOptions['sprite']): Phaser.GameObjects.Sprite | null {
  if (!v) return null;
  if (v instanceof Phaser.GameObjects.Sprite) return v;
  return (v.list.find((o) => o instanceof Phaser.GameObjects.Sprite) as Phaser.GameObjects.Sprite | undefined) ?? null;
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
    const src = spriteOf(opts.sprite);
    let mon: Phaser.GameObjects.Image | null = null;
    if (src) {
      mon = add(scene.add.image(w / 2, h * 0.46, src.texture.key, src.frame.name).setDepth(5001).setTint(0x151515));
      const scale = (h * 0.42) / mon.height;
      mon.setScale(scale);
    }
    // Static and electrical crackle (the director's clip) over flickering noise lines.
    void playClip('failure-static', sfx, 4600);
    const frames = fast ? 0 : Math.floor(opts.staticMs / 60);
    for (let i = 0; i < frames; i++) {
      noise.clear();
      for (let n = 0; n < 60; n++) noise.fillStyle(0xffffff, Math.random() * 0.5).fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 80, 2);
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
      const eyeY = mon.y - mon.displayHeight * 0.2;
      const gap = mon.displayWidth * 0.11;
      for (const x of [mon.x - gap, mon.x + gap]) {
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
