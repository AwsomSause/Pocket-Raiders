// The mentor scenes (Beta 0.5 §2): a dim stage, the mentor on the left and the protégé on the right, and a gold stream of
// light that runs from one to the other. Three moods share the stage: 'assist' (Mentor's Last Resort: the stream flows to the
// protégé and a heart bursts), 'graduation' (the two charge at each other and meet in a flash) and 'return' (the returning
// Pokémon slides in and bows to the mentor). The light is the Deluxe Battle Kit pack art already in the repo (particle, pulse,
// burst, shine) and the sounds are the game's own effects and jingles. Presentation only: never touches battle state;
// skipping cleans everything up.
import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import { playSfx, playSfxLazy } from '../audio';
import { beat, type Beat } from './spectacle';

type Pic = Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

export interface MentorSceneOptions {
  mode: 'assist' | 'graduation' | 'return';
  makeMentor: (x: number, y: number) => Pic;
  makeProte: (x: number, y: number) => Pic;
  /** A line shown under the stage (the move lent, the result...). */
  caption: string;
  /** Time scale (1 = normal) and flash strength 0..1 from the animation settings. */
  speed?: number;
  intensity?: number;
  depth?: number;
}

export function mentorScene(scene: Phaser.Scene, o: MentorSceneOptions): Beat {
  const depth = o.depth ?? 900;
  const speed = o.speed ?? 1;
  const ms = (n: number) => n / speed;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const add = <T extends Phaser.GameObjects.GameObject>(g: T): T => {
    (g as unknown as Phaser.GameObjects.Components.Depth).setDepth(depth);
    g.setName('cine-mentor');
    objs.push(g);
    return g;
  };
  const midY = GAME_HEIGHT * 0.52;
  const has = (k: string) => scene.textures.exists(k);
  const sound = (delay: number, id: string, lazy = false) => scene.time.delayedCall(ms(delay), () => (lazy ? playSfxLazy(scene, id) : playSfx(scene, id)));
  const dim = add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0614, 0).setOrigin(0));
  scene.tweens.add({ targets: dim, fillAlpha: 0.78, duration: ms(250) });
  const mentor = add(o.makeMentor(o.mode === 'return' ? -80 : GAME_WIDTH * 0.25, midY) as Phaser.GameObjects.GameObject) as Pic;
  const prote = add(o.makeProte(o.mode === 'return' ? GAME_WIDTH + 80 : GAME_WIDTH * 0.75, midY) as Phaser.GameObjects.GameObject) as Pic;
  if (o.mode === 'return') {
    scene.tweens.add({ targets: mentor, x: GAME_WIDTH * 0.28, duration: ms(500) });
    scene.tweens.add({ targets: prote, x: GAME_WIDTH * 0.7, duration: ms(900), delay: ms(300), ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: prote, x: GAME_WIDTH * 0.45, duration: ms(500), delay: ms(1500), ease: 'Sine.easeInOut' });
  }
  const caption = add(scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, o.caption, textStyle(24, '#fff3c0', { stroke: '#181818', strokeThickness: 5, wordWrap: { width: GAME_WIDTH - 120 }, align: 'center' })).setOrigin(0.5).setAlpha(0));
  scene.tweens.add({ targets: caption, alpha: 1, duration: ms(300), delay: ms(300) });

  const sparks = (fromX: number, toX: number, count: number, delay: number) => {
    for (let i = 0; i < count; i++) {
      const dot = has('pack.dbk.particle') ? add(scene.add.image(fromX, midY + (i % 5 - 2) * 14, 'pack.dbk.particle').setScale(0.9).setBlendMode('ADD').setTint(0xffe27a)) : add(scene.add.circle(fromX, midY + (i % 5 - 2) * 14, 5, 0xffd860, 0.95));
      scene.tweens.add({ targets: dot, x: toX, y: midY + (i % 3 - 1) * 10, alpha: 0, scale: 0.4, duration: ms(650), delay: ms(delay + i * 70), ease: 'Sine.easeIn' });
    }
  };
  const burst = (x: number, delay: number, color: number) => {
    const ring = has('pack.dbk.pulse') ? add(scene.add.image(x, midY, 'pack.dbk.pulse').setScale(0.3).setBlendMode('ADD').setTint(color)) : add(scene.add.circle(x, midY, 20, color, 0.9));
    scene.tweens.add({ targets: ring, scale: has('pack.dbk.pulse') ? 3 : 7, alpha: 0, duration: ms(600), delay: ms(delay) });
    if (has('pack.dbk.burst')) {
      const rays = add(scene.add.image(x, midY, 'pack.dbk.burst').setScale(0.4).setAlpha(0).setBlendMode('ADD').setTint(color));
      scene.tweens.add({ targets: rays, alpha: 0.85, scale: 1.4, angle: 25, yoyo: true, duration: ms(350), delay: ms(delay) });
    }
    if ((o.intensity ?? 1) > 0) scene.time.delayedCall(ms(delay), () => scene.cameras.main.flash(180, 255, 235, 170));
  };
  if (o.mode === 'assist') {
    scene.tweens.add({ targets: mentor, x: GAME_WIDTH * 0.32, duration: ms(500), delay: ms(300), ease: 'Back.easeOut' });
    sparks(GAME_WIDTH * 0.32, GAME_WIDTH * 0.75, 12, 800);
    scene.tweens.add({ targets: prote, scale: (prote as Phaser.GameObjects.Sprite).scale * 1.12, yoyo: true, duration: ms(300), delay: ms(1500) });
    burst(GAME_WIDTH * 0.75, 1500, 0xffe27a);
    sound(800, 'se.sparkle');
    sound(1500, 'se.ui_ability');
    const heart = add(scene.add.text(GAME_WIDTH * 0.75, midY - 110, '♥', textStyle(54, '#ff7a9a', { stroke: '#181818', strokeThickness: 6 })).setOrigin(0.5).setAlpha(0));
    scene.tweens.add({ targets: heart, alpha: 1, y: midY - 150, duration: ms(500), delay: ms(1500) });
  } else if (o.mode === 'graduation') {
    scene.tweens.add({ targets: mentor, x: GAME_WIDTH * 0.45, duration: ms(500), delay: ms(500), ease: 'Quad.easeIn', yoyo: true, hold: ms(200) });
    scene.tweens.add({ targets: prote, x: GAME_WIDTH * 0.55, duration: ms(500), delay: ms(500), ease: 'Quad.easeIn', yoyo: true, hold: ms(200) });
    burst(GAME_WIDTH * 0.5, 1000, 0xffffff);
    burst(GAME_WIDTH * 0.5, 1900, 0xffd860);
    sound(1000, 'se.hit_strong');
    sound(1900, 'se.hit_strong');
    sound(2300, 'me.evo_success', true);
  } else {
    sparks(GAME_WIDTH * 0.45, GAME_WIDTH * 0.28, 8, 2100);
    burst(GAME_WIDTH * 0.3, 2300, 0xffe27a);
    sound(300, 'se.pb_rel');
    sound(2100, 'se.sparkle');
    sound(2300, 'me.pkmn_get', true);
  }
  const total = o.mode === 'assist' ? 2600 : o.mode === 'graduation' ? 3000 : 3300;
  return beat(scene, objs, ms(total));
}
