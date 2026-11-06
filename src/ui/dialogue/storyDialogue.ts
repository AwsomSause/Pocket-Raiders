// "Story Portrait" text UI (Kice's pick, mockup #5): a dark glass box with a gold rim and name plate,
// a big portrait that slides in, and speech that types like talking (pauses, loud bits shake the box,
// voice blips pitched per speaker). Presentation only: nothing here touches game state.
import Phaser from 'phaser';
import type { MotionLevel } from '../aero';
import { services } from '../../game/services';
import { trainerVisual } from '../sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TYPE_COLORS, textStyle } from '../theme';
import { planSpeech, voicePitch, type SpeechMood, type SpeechPlan, type SpeechVoice } from './speechPacing';

export const STORY_GOLD = 0xd4b060;
const BOX_TOP = 0x14182c;
const BOX_BOTTOM = 0x080a14;
export const LETTER_MS = { instant: 0, faster: 7, fast: 15, normal: 30, slow: 52 } as const;
export type TextSpeed = keyof typeof LETTER_MS;

// ---------- voice blips ----------

const WAVE: Record<SpeechVoice, OscillatorType> = { brash: 'square', cheerful: 'square', calm: 'triangle', gentle: 'sine', grim: 'sawtooth' };

/** One short "talking" blip through Web Audio (no asset). Silent when muted or the sound can't start. */
export function voiceBlip(scene: Phaser.Scene, hz: number, voice: SpeechVoice, loud = false): void {
  const { settings } = services().session;
  if (settings.muted || settings.sfxVolume <= 0) return;
  const ctx = (scene.sound as unknown as { context?: AudioContext }).context;
  if (!ctx || ctx.state !== 'running') return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = WAVE[voice] ?? 'triangle';
    osc.frequency.setValueAtTime(hz, t);
    osc.frequency.exponentialRampToValueAtTime(hz * 0.92, t + 0.05);
    const peak = (loud ? 0.07 : 0.045) * settings.sfxVolume * (voice === 'grim' || voice === 'brash' ? 0.6 : 1);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch {
    /* audio is never critical */
  }
}

// ---------- shared pieces ----------

/** The name plate: a gold tab with the name and an optional role in small print. */
function namePlate(scene: Phaser.Scene, name: string, role: string | undefined, color = STORY_GOLD): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const label = scene.add.text(20, 4, name.toUpperCase(), textStyle(24, '#1a1408', { shadow: undefined }));
  const sub = role ? scene.add.text(label.x + label.width + 10, 10, `· ${role.toUpperCase()}`, textStyle(16, '#3a2a10', { shadow: undefined })) : null;
  const w = (sub ? sub.x + sub.width : label.x + label.width) + 26;
  const g = scene.add.graphics();
  g.fillStyle(color, 1).beginPath().moveTo(0, 0).lineTo(w, 0).lineTo(w - 14, 34).lineTo(0, 34).closePath().fillPath();
  g.fillStyle(0x000000, 0.18).fillRect(0, 28, w - 3, 6);
  c.add([g, label, ...(sub ? [sub] : [])]);
  return c;
}

/** The box body: dark glass gradient, gold rim, outer shadow. */
function drawBox(g: Phaser.GameObjects.Graphics, w: number, h: number, rim = STORY_GOLD): void {
  g.fillStyle(0x000000, 0.5).fillRoundedRect(-3, -3, w + 6, h + 6, 8);
  g.fillGradientStyle(BOX_TOP, BOX_TOP, BOX_BOTTOM, BOX_BOTTOM, 0.95, 0.95, 0.97, 0.97).fillRect(0, 0, w, h);
  g.lineStyle(3, rim, 1).strokeRoundedRect(0, 0, w, h, 6);
}

/** A bobbing ▼ "press to go on" cue. */
function nextCue(scene: Phaser.Scene, x: number, y: number, motion: MotionLevel, color = '#d4b060'): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, '▼', textStyle(24, color)).setOrigin(1, 1).setVisible(false);
  if (motion === 'full') scene.tweens.add({ targets: t, y: y + 5, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return t;
}

/** Shakes a box sideways (a loud word). Strength follows reduced motion; none when motion is off. */
export function shakeBox(scene: Phaser.Scene, target: Phaser.GameObjects.Container, motion: MotionLevel, strong = false): void {
  if (motion === 'off' || !target.active) return;
  const x = target.getData('homeX') ?? target.x;
  target.setData('homeX', x);
  const amp = motion === 'reduced' ? 2 : strong ? 9 : 6;
  scene.tweens.killTweensOf(target);
  target.x = x;
  scene.tweens.add({ targets: target, x: x + amp, duration: 40, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => (target.x = x) });
}

/** Types a planned line into a text object. Returns a stop() that shows it all at once. */
export function typeSpeech(
  scene: Phaser.Scene,
  text: Phaser.GameObjects.Text,
  plan: SpeechPlan,
  opts: { speed: TextSpeed; motion: MotionLevel; hz?: number; voice?: SpeechVoice; onShake?: (i: number) => void; onDone?: () => void },
): { stop(): boolean; typing(): boolean } {
  let timer: Phaser.Time.TimerEvent | null = null;
  let n = 0;
  const finish = (): void => {
    timer?.remove(false);
    timer = null;
    n = plan.beats.length;
    text.setText(plan.plain);
    opts.onDone?.();
  };
  if (opts.speed === 'instant' || opts.motion === 'off' || plan.beats.length === 0) {
    text.setText(plan.plain);
    if (plan.shakeAt.length > 0) opts.onShake?.(plan.shakeAt[0]!);
    scene.time.delayedCall(0, () => opts.onDone?.());
    return { stop: () => false, typing: () => false };
  }
  const shakes = new Set(plan.shakeAt);
  text.setText('');
  const step = (): void => {
    if (!text.active) return;
    const beat = plan.beats[n]!;
    n++;
    text.setText(plan.plain.slice(0, n));
    if (shakes.has(n - 1)) opts.onShake?.(n - 1);
    if (beat.blip && opts.hz) voiceBlip(scene, opts.hz * beat.pitch, opts.voice ?? 'calm', beat.loud);
    if (n >= plan.beats.length) {
      timer = null;
      opts.onDone?.();
      return;
    }
    timer = scene.time.delayedCall(Math.max(1, Math.round(beat.wait * (LETTER_MS[opts.speed] / LETTER_MS.normal))), step);
  };
  step();
  return {
    stop: () => {
      if (n >= plan.beats.length) return false;
      finish();
      return true;
    },
    typing: () => n < plan.beats.length,
  };
}

// ---------- the battle message bar ----------

export interface StoryBar {
  /** Colours the stripe and shows a type tag ("FIRE") for a move line; null puts back the gold stripe. */
  accent(type: string | null): void;
  container: Phaser.GameObjects.Container;
}

/** The battle message bar in the Story Portrait look: dark glass, a left stripe, a small type tag over the text. */
export function storyBar(scene: Phaser.Scene, x: number, y: number, w: number, h: number, motion: MotionLevel): StoryBar {
  const g = scene.add.graphics();
  g.fillGradientStyle(0x0d1020, 0x0d1020, 0x05060c, 0x05060c, 0.92, 0.92, 0.96, 0.96).fillRect(x, y, w, h);
  g.fillStyle(0xffffff, 0.16).fillRect(x, y, w, 2);
  const stripe = scene.add.rectangle(x, y, 12, h, STORY_GOLD).setOrigin(0);
  const tagBg = scene.add.rectangle(x + 28, y + 9, 70, 26, STORY_GOLD).setOrigin(0).setVisible(false);
  const tag = scene.add.text(x + 37, y + 14, '', textStyle(16, '#ffffff', { shadow: undefined })).setVisible(false);
  const accent = (type: string | null): void => {
    const color = type ? (TYPE_COLORS[type] ?? STORY_GOLD) : STORY_GOLD;
    const was = stripe.fillColor;
    stripe.setFillStyle(color);
    tag.setText(type ? type.toUpperCase() : '').setVisible(Boolean(type));
    tagBg.setFillStyle(color).setSize(tag.width + 18, 26).setVisible(Boolean(type));
    if (type && was !== color && motion === 'full') {
      stripe.setScale(1, 0.2);
      scene.tweens.add({ targets: stripe, scaleY: 1, duration: 160, ease: 'Quad.easeOut' });
    }
  };
  return { accent, container: scene.add.container(0, 0, [g, stripe, tagBg, tag]) };
}

// ---------- a spoken line (battle cut-in or any scene) ----------

export interface StoryLineOpts {
  speaker: string;
  role?: string;
  text: string;
  voice?: SpeechVoice;
  /** Trainer/boss art id for the portrait; none draws the box alone. */
  artId?: string | null;
  rim?: number;
  motion: MotionLevel;
  speed: TextSpeed;
  /** Dim the screen behind (battle cut-in). */
  dim?: boolean;
  depth?: number;
  /** Called once when the line is shouted (the box shakes): play a cry, make a Pokémon hop... */
  onShout?: () => void;
}

export interface StoryLine {
  plain: string;
  mood: SpeechMood;
  /** First press finishes the typing; the next one closes the line. */
  advance(): void;
  /** Resolves after the line closed and slid away. */
  done: Promise<void>;
}

const BOX = { x: 230, y: 330, w: 716, h: 196 };

/** Shows one spoken line in the Story Portrait look and waits for the player to go on. */
export function storyLine(scene: Phaser.Scene, o: StoryLineOpts): StoryLine {
  const depth = o.depth ?? 1600;
  const motion = o.motion;
  const plan = planSpeech(o.text, LETTER_MS.normal, o.voice ?? 'calm');
  const hz = voicePitch(o.speaker, o.voice ?? 'calm');
  const root = scene.add.container(0, 0).setDepth(depth).setName('story-line');
  const dim = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, o.dim === false ? 0 : 0.55).setOrigin(0);
  const vignette = scene.add.graphics();
  vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0, 0.5, 0).fillRect(0, 0, GAME_WIDTH * 0.6, GAME_HEIGHT);
  root.add([dim, vignette]);

  // The portrait: the trainer's art, big, standing on the bottom-left corner.
  const portrait = scene.add.container(150, GAME_HEIGHT + 6);
  if (o.artId) {
    const art = trainerVisual(scene, o.artId, o.speaker, 0, 0, 4);
    const b = art.getBounds();
    // Containers (placeholders) are centred; sprites stand on their feet.
    if (art instanceof Phaser.GameObjects.Container) art.setY(-b.height / 2);
    portrait.add(art);
  }
  root.add(portrait);

  const box = scene.add.container(BOX.x, BOX.y);
  box.setData('homeX', BOX.x);
  const g = scene.add.graphics();
  drawBox(g, BOX.w, BOX.h, o.rim ?? STORY_GOLD);
  const plate = namePlate(scene, o.speaker, o.role, o.rim ?? STORY_GOLD).setPosition(26, -20);
  const body = scene.add.text(32, 30, '', textStyle(28, COLORS.textLight, { wordWrap: { width: BOX.w - 70 }, lineSpacing: 10 }));
  const cue = nextCue(scene, BOX.w - 16, BOX.h - 10, motion);
  box.add([g, plate, body, cue]);
  root.add(box);

  // Entrances.
  if (motion === 'full') {
    dim.setAlpha(0);
    vignette.setAlpha(0);
    scene.tweens.add({ targets: [dim, vignette], alpha: 1, duration: 220 });
    portrait.x = -220;
    scene.tweens.add({ targets: portrait, x: 150, duration: 340, ease: 'Back.easeOut' });
    box.y = BOX.y + 80;
    box.setAlpha(0);
    scene.tweens.add({ targets: box, y: BOX.y, alpha: 1, duration: 260, ease: 'Cubic.easeOut', delay: 80 });
  } else if (motion === 'reduced') {
    root.setAlpha(0);
    scene.tweens.add({ targets: root, alpha: 1, duration: 150 });
  }

  let shouted = false;
  const onShake = (): void => {
    shakeBox(scene, box, motion, plan.mood === 'shout');
    if (shouted) return;
    shouted = true;
    if (motion === 'full') scene.tweens.add({ targets: portrait, y: portrait.y - 26, duration: 130, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
    try {
      o.onShout?.();
    } catch {
      /* presentation only */
    }
  };

  let typed = false;
  let typer: { stop(): boolean; typing(): boolean } | null = null;
  const startTyping = (): void => {
    if (!body.active || typer) return;
    typer = typeSpeech(scene, body, plan, { speed: o.speed, motion, hz, voice: o.voice, onShake, onDone: () => ((typed = true), cue.setVisible(true)) });
  };
  if (motion === 'full') scene.time.delayedCall(260, startTyping);
  else startTyping();

  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  let closing = false;
  const close = (): void => {
    if (closing) return;
    closing = true;
    const end = (): void => {
      scene.tweens.killTweensOf([root, portrait, box, cue, dim, vignette]);
      root.destroy();
      resolveDone();
    };
    if (motion === 'full' && root.active) {
      scene.tweens.add({ targets: portrait, x: -220, duration: 200, ease: 'Cubic.easeIn' });
      scene.tweens.add({ targets: [box, dim, vignette], alpha: 0, duration: 200, onComplete: end });
    } else end();
  };
  return {
    plain: plan.plain,
    mood: plan.mood,
    advance: () => {
      if (closing) return;
      if (!typer) {
        // Pressed before typing began: show it all.
        startTyping();
        (typer as { stop(): boolean } | null)?.stop();
        return;
      }
      if (!typed && typer.stop()) return;
      close();
    },
    done,
  };
}
