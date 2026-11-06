import Phaser from 'phaser';
import { playerAnimDef, playerAnimId, playerFrameNames, type PlayerAnimDef, type PlayerLook } from '../assets/playerArt';
import { playSfx } from './audio';
import { loadAssets } from './lazyAssets';
import type { MotionLevel } from './aero';

/** What the player trainer does on the battle field. Presentation only: the battle is already decided when these play. */
export type PlayerMoment = 'sendOut' | 'recall' | 'win' | 'hit' | 'defeat';

const MOMENT_ANIM: Record<PlayerMoment, string> = { sendOut: 'throw', recall: 'recall', win: 'celebrate', hit: 'hit', defeat: 'disappointment' };
/** After a finished moment: win and defeat hold their last pose, the rest go back to standing. */
const HOLDS: ReadonlySet<PlayerMoment> = new Set(['win', 'defeat']);
/** Where the ball leaves the hand on the last throw frames, as a fraction of the cell from its bottom centre. */
const HAND = { dx: 0.38, dy: -0.6 };
/** The throw frame (0-based) on which the ball is released. */
const RELEASE_FRAME = 5;

/** Asset ids to preload for a Look's battle moments. */
export function playerBattleAssetIds(look: PlayerLook): string[] {
  return [...new Set([...Object.values(MOMENT_ANIM), 'back_idle'])].filter((a) => playerAnimDef(look, a)).map((a) => playerAnimId(look, a));
}

export const preloadPlayerTrainer = (scene: Phaser.Scene, look: PlayerLook): Promise<void> => loadAssets(scene, playerBattleAssetIds(look));

export interface PlayMoment {
  /** Where the thrown ball lands (sendOut only). */
  target?: { x: number; y: number };
  /** Draws the ball in the hand (P3 passes the caught ball's picture); without it no ball is drawn. */
  makeBall?: (x: number, y: number) => Phaser.GameObjects.Image;
  /** Called on the release frame with the hand's position (the capture throw starts its own ball from there). */
  onRelease?: (hand: { x: number; y: number }) => void;
  /** Called when the thrown ball reaches the target, e.g. to show the ball-opening effect. */
  onLand?: (at: { x: number; y: number }) => void;
}

/**
 * The player's trainer standing on the battle field. Frames are stepped on the scene clock (no Phaser animation objects,
 * no gameplay RNG). Every moment can be skipped with `skip()` (the scene binds Enter, Space and a tap), and with motion
 * off the trainer just stands still, so nothing ever waits on it.
 */
export class PlayerTrainerActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private current: { finish: () => void } | null = null;
  private ball: Phaser.GameObjects.GameObject | null = null;
  private readonly cell: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly look: PlayerLook,
    x: number,
    y: number,
    private readonly height: number,
    private readonly motion: MotionLevel,
  ) {
    const key = playerAnimId(look, 'back_idle');
    this.sprite = scene.add.sprite(x, y, key, '0001.png').setOrigin(0.5, 1);
    this.cell = this.sprite.height;
    this.sprite.setScale(height / this.cell);
  }

  /** True when the Look's battle strips are loaded. */
  static ready(scene: Phaser.Scene, look: PlayerLook): boolean {
    return playerBattleAssetIds(look).every((id) => scene.textures.exists(id) && scene.textures.get(id).frameTotal > 0);
  }

  private show(anim: string, frame: number): void {
    const def = playerAnimDef(this.look, anim);
    const key = playerAnimId(this.look, anim);
    if (!def || !this.scene.textures.exists(key)) return;
    this.sprite.setTexture(key, playerFrameNames(def)[Math.min(frame, def.frames - 1)]);
    this.sprite.setOrigin(0.5, 1).setScale(this.height / this.sprite.height);
  }

  idle(): void {
    this.show('back_idle', 0);
  }

  /** Ends the moment that is playing right now (no-op otherwise). */
  skip(): void {
    this.current?.finish();
  }

  get playing(): boolean {
    return this.current !== null;
  }

  /** Plays one moment and resolves when it is over or skipped. Never rejects; resolves at once with motion off. */
  play(moment: PlayerMoment, opts: PlayMoment = {}): Promise<void> {
    this.skip();
    const anim = MOMENT_ANIM[moment];
    const def: PlayerAnimDef | undefined = playerAnimDef(this.look, anim);
    if (!def || this.motion === 'off' || !this.sprite.active) {
      this.idle();
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let released = false;
      let timer: Phaser.Time.TimerEvent | null = null;
      const finish = (): void => {
        if (this.current !== handle) return;
        this.current = null;
        timer?.remove(false);
        this.ball?.destroy();
        this.ball = null;
        if (this.sprite.active) {
          if (HOLDS.has(moment)) this.show(anim, def.frames - 1);
          else this.idle();
        }
        resolve();
      };
      const handle = { finish };
      this.current = handle;
      const step = (i: number): void => {
        if (!this.sprite.active) return finish();
        this.show(anim, i);
        if (moment === 'sendOut' && i === RELEASE_FRAME && !released) {
          released = true;
          this.releaseBall(opts);
        }
      };
      const ms = Math.round(1000 / (this.motion === 'full' ? def.fps : def.fps * 1.6));
      let n = 0;
      step(0);
      timer = this.scene.time.addEvent({
        delay: ms,
        repeat: def.frames - 1,
        callback: () => {
          n++;
          if (n >= def.frames) return finish();
          step(n);
        },
      });
    });
  }

  /** The ball flies from the hand to the target in an arc (decoration; it is gone when the moment ends). */
  private releaseBall(opts: PlayMoment): void {
    const from = { x: this.sprite.x + HAND.dx * this.height, y: this.sprite.y + HAND.dy * this.height };
    opts.onRelease?.(from);
    const target = opts.target;
    if (!target || !opts.makeBall) return;
    playSfx(this.scene, 'se.ball_throw');
    const ball = opts.makeBall(from.x, from.y);
    ball.setDepth(this.sprite.depth + 1);
    this.ball = ball;
    const dur = this.motion === 'full' ? 320 : 160;
    this.scene.tweens.add({ targets: ball, x: target.x, duration: dur, ease: 'Linear' });
    this.scene.tweens.add({
      targets: ball,
      y: { from: from.y, to: target.y },
      duration: dur,
      ease: 'Sine.easeOut',
      onComplete: () => {
        opts.onLand?.({ x: target.x, y: target.y });
        if (this.ball === ball) {
          ball.destroy();
          this.ball = null;
        }
      },
    });
  }

  destroy(): void {
    this.current?.finish();
    this.ball?.destroy();
    this.sprite.destroy();
  }
}

/** The Look the player uses on the battle field. Slice S2 adds the Look choice; until then everyone is Look A. */
export const playerLookForBattle = (): PlayerLook => 'a';
