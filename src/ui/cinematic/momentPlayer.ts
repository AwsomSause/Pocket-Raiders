// Plays a planned cinematic moment (core/cinematic/moments.ts): letterbox, title card, five beats. Presentation only:
// it returns when the moment ends or is skipped and never touches battle state. A drawing failure resolves quietly.
// `inner` lets a caller run an existing scene (megaScene, teraScene, bossCinematic...) during the reveal/impact beats.

import type Phaser from 'phaser';
import { MOMENT_PHASES, type MomentPlan, type MomentSpec } from '../../core/cinematic/moments';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';

export interface MomentEnv {
  title?: string;
  subtitle?: string;
  /** Runs once, at the start of the reveal beat. Awaited, but cut short if the player skips. */
  inner?: () => Promise<void>;
  /** Called when the player skips (so the caller can remember it). */
  onSkip?: () => void;
}

const HOLD_MS = 500;

export function playMoment(scene: Phaser.Scene, spec: MomentSpec, plan: MomentPlan, env: MomentEnv = {}): Promise<{ skipped: boolean }> {
  if (!plan.play) return Promise.resolve({ skipped: false });
  return new Promise((resolve) => {
    const objs: Phaser.GameObjects.GameObject[] = [];
    let over = false;
    let held = 0;
    const bars = plan.cardOnly ? [] : [scene.add.rectangle(GAME_WIDTH / 2, -40, GAME_WIDTH, 80, 0x000000), scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 40, GAME_WIDTH, 80, 0x000000)];
    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, (env.title ?? '').toUpperCase(), textStyle(spec.tier === 'S' ? 56 : 44, '#ffe060', { stroke: '#181818', strokeThickness: 8 })).setOrigin(0.5).setAlpha(0);
    const sub = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, env.subtitle ?? '', textStyle(22, '#bfe9ff', { stroke: '#181818', strokeThickness: 4 })).setOrigin(0.5).setAlpha(0);
    const hint = plan.skippable ? scene.add.text(GAME_WIDTH - 14, 14, 'hold Space: skip', textStyle(14, '#9aa4b0')).setOrigin(1, 0) : null;
    objs.push(...bars, title, sub, ...(hint ? [hint] : []));
    for (const o of objs) (o as Phaser.GameObjects.Text).setScrollFactor(0).setDepth(1800);

    const finish = (skipped: boolean): void => {
      if (over) return;
      over = true;
      scene.input.keyboard?.off('keydown', onKey);
      scene.input.keyboard?.off('keyup', onUp);
      scene.tweens.add({ targets: objs, alpha: 0, duration: 200, onComplete: () => { objs.forEach((o) => o.destroy()); resolve({ skipped }); } });
      scene.time.delayedCall(500, () => resolve({ skipped }));
      if (skipped) env.onSkip?.();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (!plan.skippable || e.key !== ' ') return;
      if (held === 0) held = scene.time.now;
      else if (scene.time.now - held >= HOLD_MS) finish(true);
    };
    const onUp = (): void => { held = 0; };
    scene.input.keyboard?.on('keydown', onKey);
    scene.input.keyboard?.on('keyup', onUp);

    const wait = (ms: number): Promise<void> => (ms <= 0 || over ? Promise.resolve() : new Promise((r) => scene.time.delayedCall(ms, r)));
    void (async () => {
      try {
        for (const phase of MOMENT_PHASES) {
          if (over) return;
          if (phase === 'anticipation') bars.forEach((b, i) => scene.tweens.add({ targets: b, y: i === 0 ? 40 : GAME_HEIGHT - 40, duration: Math.max(1, plan.ms.anticipation) }));
          if (phase === 'buildup') scene.tweens.add({ targets: title, alpha: 1, duration: Math.max(1, plan.ms.buildup) });
          if (phase === 'reveal') {
            scene.tweens.add({ targets: sub, alpha: 1, duration: Math.max(1, plan.ms.reveal / 2) });
            if (env.inner) await Promise.race([env.inner(), new Promise<void>((r) => scene.time.delayedCall(6000, r))]);
          }
          await wait(plan.ms[phase]);
        }
        if (plan.cardOnly) await wait(900);
      } catch {
        // A presentation failure must never block the game.
      }
      finish(false);
    })();
  });
}
