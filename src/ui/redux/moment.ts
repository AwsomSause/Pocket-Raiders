// New UI: an important moment (boss intro, ace entrance, betrayal, raid, rival scene...) played as the mock-ups'
// cutscene card. The card stays for the moment's planned length, its five-beat strip follows the moment's five
// phases, and a skippable moment ends on a click, Esc or a held Space. Presentation only: it never touches game state
// and a drawing failure resolves quietly.

import type Phaser from 'phaser';
import { MOMENT_PHASES, type MomentPhase, type MomentPlan } from '../../core/cinematic/moments';
import { cutView, type CutModel } from './screens/cut';
import { mountRedux } from './stage';

const HOLD_MS = 500;
/** Reading time for the spoken line: a card with words stays at least this long, however short the plan. */
const READ_BASE_MS = 1400;
const READ_PER_LETTER_MS = 26;
const READ_MAX_MS = 5200;

/**
 * How long each beat of the card shows. The plan's five phase lengths are kept; when the line needs longer to be
 * read than the whole plan lasts, the extra time goes to the middle beat (the Moment). With animations off
 * (`cardOnly`) the card is shown once, on the Moment beat, for the reading time.
 */
export function cutTimes(plan: Pick<MomentPlan, 'ms' | 'cardOnly'>, letters: number): Record<MomentPhase, number> {
  const read = letters > 0 ? Math.min(READ_MAX_MS, READ_BASE_MS + READ_PER_LETTER_MS * letters) : 0;
  if (plan.cardOnly) return { situation: 0, anticipation: 0, moment: Math.max(900, read), reaction: 0, transition: 0 };
  const total = MOMENT_PHASES.reduce((n, p) => n + plan.ms[p], 0);
  return { ...plan.ms, moment: plan.ms.moment + Math.max(0, read - total) };
}

export interface CutMomentEnv {
  /** Called when the player skips (so the caller can remember it). */
  onSkip?: () => void;
}

/** Plays the card. Resolves when the moment ends or is skipped; `plan.play` false resolves at once. */
export function playCutMoment(scene: Phaser.Scene, plan: MomentPlan, model: Omit<CutModel, 'beat' | 'skip'>, env: CutMomentEnv = {}): Promise<{ skipped: boolean }> {
  if (!plan.play) return Promise.resolve({ skipped: false });
  return new Promise((resolve) => {
    let over = false;
    let beat = plan.cardOnly ? 2 : 0;
    let held = 0;
    const finish = (skipped: boolean): void => {
      if (over) return;
      over = true;
      scene.input.keyboard?.off('keydown', onKey);
      scene.input.keyboard?.off('keyup', onUp);
      try {
        view.destroy();
      } catch {
        // the scene may already be gone
      }
      if (skipped) env.onSkip?.();
      resolve({ skipped });
    };
    const onKey = (e: KeyboardEvent): void => {
      if (!plan.skippable) return;
      if (e.key === 'Escape') return finish(true);
      if (e.key !== ' ') return;
      if (held === 0) held = scene.time.now;
      else if (scene.time.now - held >= HOLD_MS) finish(true);
    };
    const onUp = (): void => { held = 0; };
    const view = mountRedux(scene, {
      render: (c) => cutView(c, { ...model, beat, skip: plan.skippable ? ['Esc', 'skip'] : null }),
      acts: { next: () => { if (plan.skippable) finish(true); } },
    });
    scene.input.keyboard?.on('keydown', onKey);
    scene.input.keyboard?.on('keyup', onUp);
    scene.events.once('shutdown', () => finish(false));
    const times = cutTimes(plan, model.line.length);
    const wait = (ms: number): Promise<void> => (ms <= 0 || over ? Promise.resolve() : new Promise((r) => scene.time.delayedCall(ms, r)));
    void (async () => {
      try {
        for (const [i, phase] of MOMENT_PHASES.entries()) {
          if (over) return;
          if (times[phase] <= 0) continue;
          beat = i;
          view.refresh();
          await wait(times[phase]);
        }
      } catch {
        // A presentation failure must never block the game.
      }
      finish(false);
    })();
  });
}
