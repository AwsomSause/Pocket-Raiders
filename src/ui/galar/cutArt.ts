// Galar stadium camera-cut art: drawn in code (silhouettes, spotlight, broadcast lower-third), no image files.
// Presentation only. Uses its own seeded Rng so a cut always looks the same and never touches gameplay rolls.
import type Phaser from 'phaser';
import { hashSeed, Rng } from '../../core/rng';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';

const SIL = 0x2a3a5c;
const SKIN = 0x3a4a6c;

function person(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number, opts: { arms?: boolean; cap?: boolean; headset?: boolean; color?: number } = {}): void {
  g.fillStyle(opts.color ?? SIL, 1);
  g.fillCircle(x, y - 26 * s, 9 * s);
  g.fillRoundedRect(x - 13 * s, y - 16 * s, 26 * s, 34 * s, 8 * s);
  if (opts.arms) {
    g.lineStyle(5 * s, opts.color ?? SIL, 1);
    g.lineBetween(x - 11 * s, y - 10 * s, x - 20 * s, y - 36 * s);
    g.lineBetween(x + 11 * s, y - 10 * s, x + 20 * s, y - 36 * s);
  }
  if (opts.cap) g.fillRect(x - 10 * s, y - 36 * s, 20 * s, 4 * s);
  if (opts.headset) {
    g.lineStyle(2 * s, 0x9aa4b0, 1);
    g.strokeCircle(x, y - 26 * s, 11 * s);
  }
}

/** Everyday trainers the stadium crowd is made of (images/trainer/pr). Basic classes only: no gym leaders or bosses in the stands. */
export const CROWD_SPRITES: readonly string[] = [
  'youngster_f', 'school_kid_m', 'school_kid_f', 'camper_m', 'camper_f', 'ace_trainer_m', 'ace_trainer_f', 'pokefan_m', 'pokefan_f',
  'backpacker_m', 'backpacker_f', 'breeder_m', 'breeder_f', 'bird_keeper_f', 'ranger_m', 'ranger_f', 'scientist_m', 'scientist_f',
  'artist', 'baker', 'beauty_2', 'bug_type_superfan', 'cyclist_f', 'cyclist_m', 'dancer', 'doctor_f', 'doctor_m', 'expert_pokemon_breeder',
  'hoopster', 'infielder', 'janitor', 'linebacker', 'maid', 'musician', 'nursery_aide', 'officer', 'parasol_lady', 'pilot',
  'preschooler_f', 'preschooler_m', 'psychic_f', 'rich_kid_f', 'rich_kid_m', 'scuba_diver_f', 'scuba_diver_m', 'smasher', 'striker',
  'twins', 'waiter_f', 'waiter_m', 'worker_f', 'young_couple', 'clerk_f', 'clerk_m', 'black_belt_f', 'rich_f', 'rich_m', 'veteran_f', 'veteran_m',
  'collector', 'backers_f', 'backers_m', 'ruin_maniac',
].map((n) => `trainer.pr/${n}`);
/** The challengers watching from the stands and the people in the private box. */
const WATCHERS = ['ace_trainer_m', 'ace_trainer_f', 'ranger_m', 'ranger_f', 'backpacker_m', 'backpacker_f', 'camper_m', 'camper_f'].map((n) => `trainer.pr/${n}`);
const VIPS = ['rich_m', 'rich_f', 'collector', 'veteran_m', 'veteran_f', 'pokefan_f'].map((n) => `trainer.pr/${n}`);
export const INTERVIEWERS_SPRITE = 'trainer.pr/interviewers';
export const CUT_ART_PRELOAD: readonly string[] = [...new Set([...CROWD_SPRITES, ...WATCHERS, ...VIPS, INTERVIEWERS_SPRITE])];

/** Real character art for the cuts. `sprite` returns null until a picture is loaded (the drawn silhouettes cover that). */
export interface CutArtKit {
  sprite: (assetId: string, x: number, y: number, scale: number) => Phaser.GameObjects.GameObject | null;
  /** The Champion host, the opposing trainer and the watching rival: boss / trainer picture ids ('' when unknown). */
  host: string;
  opponent: string;
  rival: string;
  /** The person talking in a 'speaker' cut: their picture id. */
  speaker?: string;
  /** Other people crowding in beside the speaker (a shout from the stands has a few friends). */
  also?: string[];
}

type Sized = Phaser.GameObjects.GameObject & { height: number; setScale: (n: number) => unknown };

/** Draws one cut's art and fades it out after `durationMs`. Returns the container so the caller can clean up early. */
export function drawCutArt(scene: Phaser.Scene, cutId: string, seed: string, durationMs: number, animate: boolean, kit?: CutArtKit): Phaser.GameObjects.Container {
  const rng = new Rng(hashSeed(`galar-cutart:${seed}:${cutId}`));
  const layer = scene.add.container(0, 0).setDepth(1795).setScrollFactor(0).setAlpha(0);
  const back = scene.add.graphics();
  back.fillStyle(0x0a1020, 0.8);
  back.fillRect(0, 40, GAME_WIDTH, GAME_HEIGHT - 80);
  layer.add(back);
  const g = scene.add.graphics();
  layer.add(g);
  const bob: Phaser.GameObjects.Graphics[] = [];
  const fr = scene.add.graphics(); // the broadcast frame, drawn last so pictures never cover it

  /** One real trainer picture, or null if it isn't loaded. Pictures are scaled to a target height so none is cropped by the frame. */
  const place = (id: string, x: number, y: number, scale: number, flip = false): Phaser.GameObjects.GameObject | null => {
    const o = kit?.sprite(id, x, y, scale) ?? null;
    if (o && flip && 'setFlipX' in o) (o as unknown as Phaser.GameObjects.Sprite).setFlipX(true);
    return o;
  };
  /** A big single portrait (boss pictures vary in size): fitted to `height` pixels tall, feet at (x, y). */
  const portrait = (id: string, x: number, y: number, height: number): boolean => {
    if (!id) return false;
    const o = place(id, x, y, 1) as Sized | null;
    if (!o) return false;
    if (o.height > 0) o.setScale(Math.min(height / o.height, 6));
    layer.add(o);
    return true;
  };
  const crowd = (rows: number, arms: boolean, cap: boolean, hot: boolean, pool: readonly string[] = CROWD_SPRITES): void => {
    for (let r = 0; r < rows; r++) {
      const s = 1.3 + r * 0.4;
      const y = 480 - (rows - 1 - r) * 62;
      const row = scene.add.container(0, 0);
      const silhouettes = scene.add.graphics();
      row.add(silhouettes);
      for (let x = -10 + rng.int(0, 20); x < GAME_WIDTH + 20; x += (arms ? 46 : 52) * s) {
        const id = pool[rng.int(0, pool.length - 1)]!;
        const flip = rng.float() < 0.5;
        const pic = place(id, x, y, s, flip);
        if (pic) row.add(pic);
        else person(silhouettes, x, y - 30 * s + 30, s * 0.9, { arms: arms && rng.float() < 0.7, cap: cap && rng.float() < 0.5, color: hot && rng.float() < 0.15 ? 0xe05a3c : SIL });
      }
      layer.add(row);
      bob.push(row as unknown as Phaser.GameObjects.Graphics);
    }
  };

  switch (cutId) {
    case 'crowd-cheer':
      crowd(3, true, false, false);
      break;
    case 'fan-group':
      crowd(3, true, false, true);
      g.fillStyle(0xffd040, 0.9);
      for (let i = 0; i < 6; i++) g.fillTriangle(120 + i * 140, 250, 108 + i * 140, 285, 132 + i * 140, 285); // foam fingers / banners
      break;
    case 'speaker': {
      // Someone from the crowd (or the host, the rival, a reporter) turns to the camera: the stands behind them, dimmed, and their own picture large.
      crowd(2, false, false, false);
      const dim = scene.add.graphics();
      dim.fillStyle(0x0a1020, 0.6);
      dim.fillRect(0, 130, GAME_WIDTH, GAME_HEIGHT - 170);
      layer.add(dim);
      (kit?.also ?? []).slice(0, 2).forEach((id, i) => portrait(id, GAME_WIDTH / 2 + (i === 0 ? -300 : 300), 450, 230));
      if (!portrait(kit?.speaker ?? '', GAME_WIDTH / 2, 470, 330)) person(g, GAME_WIDTH / 2, 400, 3.2);
      break;
    }
    case 'trainers-watching':
      crowd(2, false, true, false, WATCHERS);
      break;
    case 'private-box': {
      g.fillStyle(0x141a2b, 1);
      g.fillRoundedRect(250, 190, 460, 230, 14);
      for (let i = 0; i < 4; i++) {
        const pic = place(VIPS[(i + rng.int(0, VIPS.length - 1)) % VIPS.length]!, 315 + i * 110, 412, 2.1, i % 2 === 1);
        if (pic) layer.add(pic);
        else person(g, 310 + i * 110, 360, 1.5, { cap: i === 1 });
      }
      fr.lineStyle(4, 0xd9b45a, 1);
      fr.strokeRoundedRect(250, 190, 460, 230, 14);
      break;
    }
    case 'commentator': {
      // A reporter and a cameraman: the "interviewers" picture, large and centred.
      if (!portrait(INTERVIEWERS_SPRITE, GAME_WIDTH / 2, 472, 330)) {
        g.fillStyle(0x1a2234, 1);
        g.fillRect(240, 340, 480, 70);
        person(g, 360, 350, 1.8, { headset: true });
        person(g, 600, 350, 1.8, { headset: true });
      }
      break;
    }
    case 'opponent-closeup':
      if (!portrait(kit?.opponent ?? '', GAME_WIDTH / 2, 480, 340)) {
        g.fillStyle(SKIN, 1);
        g.fillCircle(GAME_WIDTH / 2, 280, 85);
        g.fillRoundedRect(GAME_WIDTH / 2 - 150, 350, 300, 160, 40);
        g.fillStyle(SIL, 1);
        g.fillRect(GAME_WIDTH / 2 - 95, 210, 190, 34); // cap brim
      }
      break;
    case 'champion-silhouette': {
      g.fillStyle(0xfff0b0, 0.18);
      g.fillTriangle(GAME_WIDTH / 2 - 30, 60, GAME_WIDTH / 2 + 30, 60, GAME_WIDTH / 2 + 180, 480); // spotlight cone
      g.fillTriangle(GAME_WIDTH / 2 - 30, 60, GAME_WIDTH / 2 - 180, 480, GAME_WIDTH / 2 + 180, 480);
      if (!portrait(kit?.host ?? '', GAME_WIDTH / 2, 480, 330)) {
        person(g, GAME_WIDTH / 2, 400, 3.2);
        g.fillStyle(SIL, 1);
        g.fillTriangle(GAME_WIDTH / 2 - 50, 340, GAME_WIDTH / 2 + 50, 340, GAME_WIDTH / 2, 470); // cape
      }
      break;
    }
    case 'rival-silhouette':
      if (!portrait(kit?.rival ?? '', 640, 478, 300)) person(g, 640, 380, 2.4, { color: 0x151b2c });
      fr.lineStyle(6, 0x3a4660, 1);
      fr.lineBetween(0, 410, GAME_WIDTH, 410); // rail, in front of the rival
      break;
    default:
      crowd(2, true, false, false);
  }

  // Broadcast-style frame: corner marks, LIVE tag and a lower-third (on top of the pictures).
  layer.add(fr);
  fr.lineStyle(3, 0xffffff, 0.5);
  for (const [x, y, dx, dy] of [[24, 56, 1, 1], [GAME_WIDTH - 24, 56, -1, 1], [24, GAME_HEIGHT - 56, 1, -1], [GAME_WIDTH - 24, GAME_HEIGHT - 56, -1, -1]] as const) {
    fr.lineBetween(x, y, x + 30 * dx, y);
    fr.lineBetween(x, y, x, y + 30 * dy);
  }
  fr.fillStyle(0xd02828, 1);
  fr.fillRoundedRect(36, 66, 62, 24, 6);
  layer.add(scene.add.text(67, 78, 'LIVE', textStyle(14, '#ffffff')).setOrigin(0.5));
  fr.fillStyle(0x10203a, 0.92);
  fr.fillRect(0, 100, GAME_WIDTH * 0.45, 26);
  fr.fillStyle(0xffd040, 1);
  fr.fillRect(0, 100, 8, 26);
  layer.add(scene.add.text(22, 113, 'GALAR CHAMPIONSHIP  ·  STADIUM CAM', textStyle(13, '#ffffff')).setOrigin(0, 0.5));

  scene.tweens.add({ targets: layer, alpha: 1, duration: 180 });
  if (animate) for (const row of bob) scene.tweens.add({ targets: row, y: -6, duration: 260 + rng.int(0, 120), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.time.delayedCall(Math.max(300, durationMs - 200), () => {
    scene.tweens.add({ targets: layer, alpha: 0, duration: 200, onComplete: () => layer.destroy() });
  });
  return layer;
}

const wait = (scene: Phaser.Scene, ms: number): Promise<void> => new Promise((r) => scene.time.delayedCall(ms, r));

/** Confetti and sweeping spotlights for the tournament final. Returns the objects so the caller can fade them with the card. */
function finalDressing(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, seed: string, animate: boolean): void {
  const rng = new Rng(hashSeed(`galar-final:${seed}`));
  const beams = scene.add.graphics();
  beams.fillStyle(0xfff0b0, 0.14);
  for (const x of [200, 480, 760]) {
    beams.fillTriangle(x - 20, 40, x + 20, 40, x + 160, GAME_HEIGHT - 40);
    beams.fillTriangle(x - 20, 40, x - 160, GAME_HEIGHT - 40, x + 160, GAME_HEIGHT - 40);
  }
  layer.add(beams);
  if (animate) scene.tweens.add({ targets: beams, x: 40, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const colors = [0xffd040, 0xe05a3c, 0x78b8e8, 0xffffff, 0x78d890];
  for (let i = 0; i < 50; i++) {
    const c = scene.add.rectangle(rng.int(0, GAME_WIDTH), rng.int(40, 120), 8, 12, colors[i % colors.length]!).setAngle(rng.int(0, 180));
    layer.add(c);
    if (animate) scene.tweens.add({ targets: c, y: GAME_HEIGHT - 40, angle: c.angle + 360, duration: 1400 + rng.int(0, 1600), delay: rng.int(0, 900), repeat: -1 });
  }
}

export interface IntroCardSpec {
  tag: string;
  name: string;
  style: string;
  line: string;
  /** Boss portrait asset id, or '' for a silhouette. */
  sprite: string;
  final: boolean;
}

/** A broadcast-style trainer introduction: portrait, name, battle style and the announcer's line. Resolves when it has faded. */
export async function playIntroCard(scene: Phaser.Scene, spec: IntroCardSpec, seed: string, animate: boolean, makePortrait: (x: number, y: number) => Phaser.GameObjects.GameObject | null): Promise<void> {
  const layer = scene.add.container(0, 0).setDepth(1795).setScrollFactor(0).setAlpha(0);
  const back = scene.add.graphics();
  back.fillStyle(spec.final ? 0x1a0f2a : 0x0a1020, 0.9);
  back.fillRect(0, 40, GAME_WIDTH, GAME_HEIGHT - 80);
  back.fillStyle(spec.final ? 0xffd040 : 0x78b8e8, 1);
  back.fillRect(0, 40, GAME_WIDTH, 4);
  back.fillRect(0, GAME_HEIGHT - 44, GAME_WIDTH, 4);
  layer.add(back);
  if (spec.final) finalDressing(scene, layer, seed, animate);
  const portrait = makePortrait(GAME_WIDTH * 0.3, 480);
  if (portrait) {
    layer.add(portrait);
  } else {
    const g = scene.add.graphics();
    person(g, GAME_WIDTH * 0.3, 330, 4.5);
    layer.add(g);
  }
  const x = GAME_WIDTH * 0.52;
  layer.add(scene.add.text(x, 130, spec.tag, textStyle(spec.final ? 26 : 20, spec.final ? '#ffd040' : '#78b8e8')));
  layer.add(scene.add.text(x, 170, spec.name, textStyle(spec.final ? 44 : 36, '#ffffff', { stroke: '#101820', strokeThickness: 6 })));
  layer.add(scene.add.text(x, 228, spec.style, textStyle(16, '#bfe9ff', { wordWrap: { width: GAME_WIDTH * 0.42 } })));
  layer.add(scene.add.text(x, 290, `"${spec.line}"`, textStyle(16, '#e8e0f0', { wordWrap: { width: GAME_WIDTH * 0.42 } })));
  layer.add(scene.add.text(36, GAME_HEIGHT - 76, 'GALAR CHAMPIONSHIP  ·  NOW ENTERING', textStyle(13, '#ffffff')));
  scene.tweens.add({ targets: layer, alpha: 1, duration: 250 });
  await wait(scene, spec.final ? 5400 : 3800);
  scene.tweens.add({ targets: layer, alpha: 0, duration: 250, onComplete: () => layer.destroy() });
  await wait(scene, 260);
}

/** The Dynamax Band handover: a glowing band with pulsing rings. Resolves when it has faded. */
export async function playBandCard(scene: Phaser.Scene, animate: boolean, makeBand: (x: number, y: number) => Phaser.GameObjects.GameObject | null): Promise<void> {
  const layer = scene.add.container(0, 0).setDepth(1795).setScrollFactor(0).setAlpha(0);
  const back = scene.add.graphics();
  back.fillStyle(0x2a0a14, 0.92);
  back.fillRect(0, 40, GAME_WIDTH, GAME_HEIGHT - 80);
  layer.add(back);
  const rings: Phaser.GameObjects.Arc[] = [];
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.circle(GAME_WIDTH / 2, 250, 60 + i * 40, 0xe05a3c, 0).setStrokeStyle(4, 0xe05a3c, 0.8 - i * 0.2);
    layer.add(ring);
    rings.push(ring);
  }
  const band = makeBand(GAME_WIDTH / 2, 250);
  if (band) layer.add(band);
  else {
    const b = scene.add.graphics();
    b.lineStyle(14, 0xe05a3c, 1);
    b.strokeCircle(GAME_WIDTH / 2, 250, 40);
    layer.add(b);
  }
  layer.add(scene.add.text(GAME_WIDTH / 2, 380, 'DYNAMAX BAND', textStyle(36, '#ffd040', { stroke: '#101820', strokeThickness: 6 })).setOrigin(0.5));
  layer.add(scene.add.text(GAME_WIDTH / 2, 430, 'Power that makes a Pokémon tower over the stadium.', textStyle(16, '#e8e0f0')).setOrigin(0.5));
  if (animate) for (const [i, r] of rings.entries()) scene.tweens.add({ targets: r, scale: 1.5, alpha: 0, duration: 1300, delay: i * 350, repeat: -1 });
  scene.tweens.add({ targets: layer, alpha: 1, duration: 250 });
  await wait(scene, 4000);
  scene.tweens.add({ targets: layer, alpha: 0, duration: 250, onComplete: () => layer.destroy() });
  await wait(scene, 260);
}
