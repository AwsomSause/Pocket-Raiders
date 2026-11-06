// A tween as a promise that always settles (Beta 4.4 "battles won't load"): a tween another effect kills
// (killTweensOf) never calls onComplete, which used to leave the battle waiting forever. It settles on
// complete, on stop, or after the time the tween should have taken (plus a margin), whichever is first.

import Phaser from 'phaser';

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** How long a tween config should run, in ms (an endless one counts as 10 s). */
export function tweenBudgetMs(config: Phaser.Types.Tweens.TweenBuilderConfig): number {
  const repeat = num(config.repeat, 0);
  if (repeat < 0) return 10_000;
  const once = num(config.duration, 1000) * (config.yoyo ? 2 : 1) + num(config.hold, 0) + num(config.repeatDelay, 0);
  return Math.min(10_000, num(config.delay, 0) + once * (repeat + 1));
}

export function tweenDone(scene: Phaser.Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const onComplete = config.onComplete;
    scene.tweens.add({
      ...config,
      onComplete: (...args: Parameters<NonNullable<typeof onComplete>>) => {
        onComplete?.(...args);
        finish();
      },
      onStop: finish,
    });
    // The scene clock runs at battle speed like the tween, so the margin scales with it.
    scene.time.delayedCall(tweenBudgetMs(config) + 500, finish);
  });
}
