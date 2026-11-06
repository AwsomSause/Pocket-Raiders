// Plays a cutscene plan (core/story2/cutscene.ts). Presentation only: it reads the plan and reports which story flags
// the scene set; it never changes game state itself and a failure here never blocks the story.
// Dialogue uses the Story Portrait line. Holding Skip (Esc, Space or a long press) ends the scene with a recap card.

import type Phaser from 'phaser';
import { planCutscene, skipCutscene, type Cutscene, type CutsceneStep, type PlanOptions } from '../../core/story2/cutscene';
import { renderTemplate } from '../../core/story2/templates';
import type { MotionLevel } from '../aero';
import { storyLine, type TextSpeed } from '../dialogue/storyDialogue';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';

export interface CutsceneRun {
  /** Resolves when the scene ended or was skipped. `flags` are the story flags to set. */
  done: Promise<{ skipped: boolean; flags: string[] }>;
  skip(): void;
}

export interface CutsceneEnv extends PlanOptions {
  text: (key: string) => string | undefined;
  values: Record<string, string>;
  motion: MotionLevel;
  speed: TextSpeed;
  speaker: (id: string) => { name: string; artId?: string | null } | undefined;
}

const HOLD_MS = 600;

export function playCutscene(scene: Phaser.Scene, c: Cutscene, env: CutsceneEnv): CutsceneRun {
  const plan = planCutscene(c, env);
  const flags = new Set<string>();
  let skipped = false;
  let finish: (r: { skipped: boolean; flags: string[] }) => void = () => undefined;
  const done = new Promise<{ skipped: boolean; flags: string[] }>((res) => { finish = res; });
  const veil = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(1500).setName('cutscene-veil');
  let line: { advance(): void; done: Promise<void> } | null = null;
  let heldSince = 0;

  const end = (wasSkipped: boolean): void => {
    scene.input.keyboard?.off('keydown', onKey);
    scene.input.keyboard?.off('keyup', onKeyUp);
    veil.destroy();
    for (const s of c.steps) if (wasSkipped) for (const f of s.sets) flags.add(f);
    finish({ skipped: wasSkipped, flags: [...flags] });
  };
  const showRecap = async (): Promise<void> => {
    const key = skipCutscene(c)?.recapKey;
    const text = (key && env.text(key)) ?? env.text('cutscene.recap.default') ?? '';
    veil.setAlpha(1);
    const t = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, renderTemplate(text, env.values), textStyle(22, '#ffffff', { wordWrap: { width: 700 }, align: 'center' })).setOrigin(0.5).setDepth(1501);
    await new Promise<void>((r) => scene.time.delayedCall(env.motion === 'full' ? 1400 : 900, r));
    t.destroy();
  };
  const doSkip = (): void => {
    if (skipped || !skipCutscene(c)) return;
    skipped = true;
    line?.advance();
    void showRecap().then(() => end(true));
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' && e.key !== ' ') return;
    if (heldSince === 0) heldSince = scene.time.now;
    else if (scene.time.now - heldSince >= HOLD_MS) doSkip();
  };
  const onKeyUp = (): void => { heldSince = 0; };
  scene.input.keyboard?.on('keydown', onKey);
  scene.input.keyboard?.on('keyup', onKeyUp);

  const step = async (s: CutsceneStep): Promise<void> => {
    for (const f of s.sets) flags.add(f);
    if (s.track === 'dialogue' && s.textKey) {
      const who = env.speaker(String(s.args.speaker ?? ''));
      line = storyLine(scene, { speaker: who?.name ?? '', text: renderTemplate(env.text(s.textKey) ?? '', env.values), artId: who?.artId ?? null, motion: env.motion, speed: env.speed, dim: false });
      await line.done;
      line = null;
    } else if (s.kind === 'fade' && env.motion !== 'off') {
      const to = Number(s.args.to ?? 1);
      await new Promise<void>((r) => scene.tweens.add({ targets: veil, alpha: to, duration: Math.max(1, s.ms), onComplete: () => r() }));
    } else if (s.ms > 0) {
      await new Promise<void>((r) => scene.time.delayedCall(s.ms, r));
    }
  };

  void (async () => {
    try {
      const start = scene.time.now;
      for (const s of plan) {
        if (skipped) return;
        const wait = s.at - (scene.time.now - start);
        if (wait > 0 && env.motion !== 'off') await new Promise<void>((r) => scene.time.delayedCall(wait, r));
        if (skipped) return;
        await step(s);
      }
      if (!skipped) end(false);
    } catch {
      // A presentation failure must not stop the story: report what was set and move on.
      if (!skipped) end(false);
    }
  })();

  return { done, skip: doSkip };
}
