// The interaction prompt widget (ideas W0): shows one data-driven prompt (core/interaction/prompt.ts) and
// resolves with a PromptResult. It only collects timestamps and positions; every grade comes from the pure
// judges, so what you see never decides an outcome. Controls: pointer or Space/Enter (tap, hold, timing,
// rhythm) and pointer drag (drag, where Space/Enter can't aim, so the assist skip is offered instead).
// Esc skips (counted as a skipped 'ok'). Reduced/Off motion draws the same prompt without the bounce.

import Phaser from 'phaser';
import { resolveAnim } from '../core/presentation/animRegistry';
import '../core/interaction/reactions';
import { animSettingsFrom } from '../core/accessibility';
import type { Settings } from '../core/state';
import {
  judgeDrag, judgeHold, judgeRhythm, judgeShout, judgeTap, judgeTiming, promptLengthMs, skippedResult,
  type PromptAssist, type PromptDef, type PromptResult,
} from '../core/interaction/prompt';
import { MicMeter, ShoutDetector } from '../game/micInput';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';
import { esc, W } from './redux/kit';
import { mountRedux, reduxOn, type ReduxView } from './redux/stage';

const BOX = { w: 360, h: 220 };
const GRADE_COLOR: Record<string, string> = { miss: '#ff6a6a', ok: '#ffe08a', good: '#8affc0', perfect: '#9fe8ff' };

export interface PromptOptions {
  assist?: PromptAssist;
  /** Where the panel centres; defaults to the screen centre. */
  at?: { x: number; y: number };
  /** Full / reduced / off motion (from the player's settings). */
  motion?: 'full' | 'reduced' | 'off';
  /** Shout prompts only: the Settings > Controls > Microphone switch. Off (default) means the button is the only input. */
  mic?: boolean;
}

/** Runs one prompt and resolves with its result. Cleans up all its objects and listeners. */
export function runInteractionPrompt(scene: Phaser.Scene, def: PromptDef, opts: PromptOptions = {}): Promise<PromptResult> {
  return new Promise((resolve) => {
    const assist = opts.assist ?? {};
    const motion = opts.motion ?? 'full';
    const cx = opts.at?.x ?? GAME_WIDTH / 2;
    const cy = opts.at?.y ?? GAME_HEIGHT / 2;
    const left = cx - BOX.w / 2;
    const top = cy - BOX.h / 2;
    const root = scene.add.container(0, 0).setDepth(1000);
    const gfx = scene.add.graphics();
    const title = scene.add.text(cx, top - 26, def.label, textStyle(22, COLORS.text)).setOrigin(0.5);
    const hint = scene.add.text(cx, top + BOX.h + 16, `${def.hint}  (Esc skips)`, textStyle(14, '#c8c0d8')).setOrigin(0.5);
    const verdict = scene.add.text(cx, cy, '', textStyle(34, '#ffffff')).setOrigin(0.5).setAlpha(0);
    root.add([gfx, title, hint, verdict]);
    if (motion === 'full') {
      root.setScale(0.9).setAlpha(0);
      scene.tweens.add({ targets: root, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    }

    const t0 = scene.time.now;
    const now = () => scene.time.now - t0;
    let pressAt: number | null = null; // first press (tap/timing) or hold start
    let heldMs: number | null = null;
    let dragEnd: [number, number] | null = null;
    let dragStartMs = 0;
    let dragging = false;
    const presses: number[] = [];
    let finished = false;
    let shouted = false;
    let level = 0;
    const meter = def.kind === 'shout' && opts.mic ? new MicMeter() : null;
    const detector = new ShoutDetector();
    if (meter) void meter.start(true).then(() => { if (finished) meter.stop(); });
    const toBox = (p: Phaser.Input.Pointer): [number, number] => [((p.x - left) / BOX.w) * 100, ((p.y - top) / BOX.h) * 100];
    const px = (v: [number, number]) => ({ x: left + (v[0] / 100) * BOX.w, y: top + (v[1] / 100) * BOX.h });

    // New UI: the prompt is the mock-ups' small window (fishing bite bar, "Enter: talk" prompt) drawn over whatever
    // screen is open. Same timestamps, same judges; only the picture and where the pointer lands differ.
    let rx: ReduxView | null = null;
    let shown: PromptResult | null = null;
    const offs: (() => void)[] = [];

    const finish = (result: PromptResult) => {
      if (finished) return;
      finished = true;
      shown = result;
      rx?.refresh();
      for (const off of offs) off();
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointerup', onUp);
      scene.input.off('pointermove', onMove);
      scene.input.keyboard?.off('keydown', onKeyDown);
      scene.input.keyboard?.off('keyup', onKeyUp);
      tick.destroy();
      meter?.stop();
      verdict.setText(result.skipped ? 'Skipped' : result.grade.toUpperCase()).setColor(GRADE_COLOR[result.grade] ?? '#ffffff').setAlpha(1);
      if (motion === 'full') scene.tweens.add({ targets: verdict, scale: { from: 0.6, to: 1.1 }, duration: 260, ease: 'Back.easeOut' });
      window.setTimeout(() => { try { root.destroy(true); } catch { /* scene already gone */ } rx?.destroy(); resolve(result); }, motion === 'off' ? 250 : 650);
    };

    const judge = (): PromptResult => {
      switch (def.kind) {
        case 'tap': return judgeTap(def, pressAt, assist);
        case 'hold': return judgeHold(def, heldMs ?? (pressAt !== null ? now() - pressAt : null), assist);
        case 'drag': return judgeDrag(def, dragEnd, dragEnd ? now() - dragStartMs : 0, assist);
        case 'timing': return judgeTiming(def, pressAt, assist);
        case 'rhythm': return judgeRhythm(def, presses, assist);
        case 'shout': return judgeShout(def, shouted, assist);
      }
    };

    const press = () => {
      const t = now();
      if (assist.skip) return finish(skippedResult(assist));
      if (def.kind === 'rhythm') {
        presses.push(t);
        pulse();
      } else if (def.kind === 'hold') {
        if (pressAt === null) pressAt = t;
      } else if (def.kind === 'shout') {
        shouted = true;
        finish(judge());
      } else if (def.kind === 'tap' || def.kind === 'timing') {
        if (pressAt === null) { pressAt = t; finish(judge()); }
      }
    };
    const release = () => {
      if (def.kind === 'hold' && pressAt !== null && heldMs === null) { heldMs = now() - pressAt; finish(judge()); }
    };
    const onDown = (p: Phaser.Input.Pointer) => {
      if (def.kind === 'drag') {
        if (!assist.skip) { dragging = true; dragStartMs = now(); dragEnd = toBox(p); }
        else finish(skippedResult(assist));
      } else press();
    };
    const onMove = (p: Phaser.Input.Pointer) => { if (dragging) dragEnd = toBox(p); };
    const onUp = (p: Phaser.Input.Pointer) => {
      if (def.kind === 'drag' && dragging) { dragging = false; dragEnd = toBox(p); finish(judge()); } else release();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Escape') return finish(skippedResult({ skipGrade: 'ok' }));
      if (e.key === ' ' || e.key === 'Enter') press();
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') release(); };
    scene.input.on('pointerdown', onDown);
    scene.input.on('pointerup', onUp);
    scene.input.on('pointermove', onMove);
    scene.input.keyboard?.on('keydown', onKeyDown);
    scene.input.keyboard?.on('keyup', onKeyUp);

    let pulseUntil = 0;
    function pulse() { pulseUntil = now() + 120; }

    if (reduxOn()) {
      root.setVisible(false);
      const pct = (v: number): string => `${Math.max(0, Math.min(100, v * 100)).toFixed(1)}%`;
      // The mock-ups' gold bar, with the zone to hit marked on it.
      const bar = (k: number, zone?: readonly [number, number]): string =>
        `<div class="hp gold" style="height:12px;position:relative;overflow:visible"><i style="width:${pct(k)};transition:none"></i>${zone ? `<u style="position:absolute;left:${pct(zone[0])};width:${pct(zone[1] - zone[0])};top:-4px;bottom:-4px;border-radius:4px;box-shadow:0 0 0 2px var(--acc);background:#fff3"></u>` : ''}</div>`;
      const html = (): string => {
        const t = now();
        const key = '<kbd>Enter</kbd>';
        const head = shown
          ? `<b style="font-size:26px;color:${GRADE_COLOR[shown.grade] ?? '#fff'};text-shadow:2px 2px 0 #0008">${shown.skipped ? 'Skipped' : shown.grade.toUpperCase()}</b>`
          : `<b class="acc${motion === 'full' ? ' pulse' : ''}" style="font-size:24px">${esc(def.label)}</b>`;
        // The data's hints describe the old ring; the bar gets the mock-up's words, keeping any extra context after a colon.
        const extra = /:\s*(.+)$/.exec(def.hint)?.[1] ?? '';
        const words = def.kind === 'timing' ? `Press Enter when the bar is in the gold zone.${extra ? ` ${extra.charAt(0).toUpperCase()}${extra.slice(1)}` : ''}` : def.kind === 'hold' ? 'Hold Enter, then let go when the bar is in the gold zone.' : def.hint;
        const hintLine = `<div class="sm">${esc(words)} <span style="opacity:.7">(Esc skips)</span></div>`;
        const frame = (body: string, st = `left:${left}px;width:${BOX.w}px;top:${cy - 80}px`): string => '<div class="fill hit"></div>' + W(head + body + hintLine, `position:absolute;${st};display:flex;flex-direction:column;gap:10px;padding:16px 18px;text-align:center;z-index:2;pointer-events:none`);
        switch (def.kind) {
          case 'tap':
            // The mock-up prompt chip: the key and what it does; it lights up when the mark appears.
            return frame(`<div class="row" style="justify-content:center;opacity:${t < 400 ? 0.35 : 1}">${key}<b>Now!</b></div>`);
          case 'timing': {
            const len = promptLengthMs(def);
            return frame(bar(t / len, [(def.landMs - def.windowsMs.good) / len, (def.landMs + def.windowsMs.good) / len]));
          }
          case 'hold': {
            const len = promptLengthMs(def);
            return frame(bar(pressAt === null ? 0 : (heldMs ?? t - pressAt) / len, [(def.targetMs - def.windowsMs.good) / len, (def.targetMs + def.windowsMs.good) / len]));
          }
          case 'rhythm': {
            const last = Math.max(...def.beatsMs) + 400;
            const dots = def.beatsMs.map((b) => `<u style="position:absolute;left:${pct(b / last)};top:-3px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 2px #0006"></u>`).join('');
            return frame(`<div class="hp" style="height:8px;position:relative;overflow:visible;margin:8px 0">${dots}<u style="position:absolute;left:${pct(t / last)};top:-7px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:${t < pulseUntil ? '#78f090' : '#9fe8ff'};box-shadow:0 0 0 2px #fff"></u></div>`);
          }
          case 'shout':
            return frame(bar(Math.min(1, level * 3)) + `<div class="row" style="justify-content:center">${key}<b>Shout!</b></div>`);
          case 'drag': {
            // The drag field sits exactly where the pointer maths expects it (the same box the canvas drew).
            const at = (v: readonly [number, number], st: string): string => `<u style="position:absolute;left:${v[0]}%;top:${v[1]}%;${st}"></u>`;
            const lineTo = dragging && dragEnd ? `<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="${def.from[0]}" y1="${def.from[1]}" x2="${dragEnd[0]}" y2="${dragEnd[1]}" stroke="#9fe8ff" stroke-width="1.2"/></svg>` : '';
            const field = `<div class="abs" style="left:${left}px;top:${top}px;width:${BOX.w}px;height:${BOX.h}px;background:var(--p2);border-radius:6px;z-index:3;pointer-events:none">${lineTo}${at(def.from, 'width:20px;height:20px;margin:-10px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #0006')}${at(def.to, 'width:44px;height:44px;margin:-22px;border-radius:50%;box-shadow:0 0 0 3px var(--acc),inset 0 0 0 12px #0000,inset 0 0 0 15px var(--acc)')}${dragging && dragEnd ? at(dragEnd, 'width:16px;height:16px;margin:-8px;border-radius:50%;background:#9fe8ff') : ''}</div>`;
            // One window holds the title, the field and the hint; the field keeps the canvas box's place for the pointer maths.
            const shell = W(`${head}<span style="flex:1"></span>${hintLine}`, `position:absolute;left:${left - 18}px;top:${top - 52}px;width:${BOX.w + 36}px;height:${BOX.h + 112}px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;padding:12px 16px;text-align:center;z-index:2;pointer-events:none`);
            return '<div class="fill hit"></div>' + shell + field;
          }
        }
      };
      rx = mountRedux(scene, { clear: true, render: html });
      // The window covers the canvas, so the pointer is read from it (in game pixels) and fed to the same handlers.
      const el = rx.el;
      const point = (e: PointerEvent): Phaser.Input.Pointer => {
        const r = el.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * GAME_WIDTH, y: ((e.clientY - r.top) / r.height) * GAME_HEIGHT } as Phaser.Input.Pointer;
      };
      const down = (e: PointerEvent): void => onDown(point(e));
      const move = (e: PointerEvent): void => onMove(point(e));
      const up = (e: PointerEvent): void => onUp(point(e));
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      offs.push(() => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); });
    }

    const draw = () => {
      const t = now();
      gfx.clear();
      gfx.fillStyle(0x10121c, 0.88).fillRoundedRect(left, top, BOX.w, BOX.h, 16);
      gfx.lineStyle(3, 0x9fe8ff, 0.9).strokeRoundedRect(left, top, BOX.w, BOX.h, 16);
      const mid = { x: cx, y: cy };
      switch (def.kind) {
        case 'tap': {
          if (t < 400) break; // the mark appears after a short beat
          gfx.fillStyle(0xffe060, 1).fillCircle(mid.x, mid.y, 34);
          gfx.lineStyle(4, 0xffffff, 0.9).strokeCircle(mid.x, mid.y, 34);
          break;
        }
        case 'timing': {
          const k = Math.min(1, t / def.landMs);
          gfx.lineStyle(4, 0xffffff, 0.8).strokeCircle(mid.x, mid.y, 30);
          gfx.lineStyle(5, 0x9fe8ff, 1).strokeCircle(mid.x, mid.y, 30 + (1 - k) * 90);
          break;
        }
        case 'hold': {
          const k = Math.min(1, pressAt === null ? 0 : (t - pressAt) / def.targetMs);
          gfx.lineStyle(4, 0xffffff, 0.8).strokeCircle(mid.x, mid.y, 44);
          gfx.fillStyle(0x78f090, 0.85).fillCircle(mid.x, mid.y, 44 * k);
          break;
        }
        case 'drag': {
          const a = px(def.from);
          const b = px(def.to);
          gfx.fillStyle(0xffffff, 0.9).fillCircle(a.x, a.y, 10);
          gfx.lineStyle(3, 0xffe060, 0.6).strokeCircle(b.x, b.y, 22).strokeCircle(b.x, b.y, 8);
          if (dragging && dragEnd) { const p = px(dragEnd); gfx.lineStyle(3, 0x9fe8ff, 0.9).lineBetween(a.x, a.y, p.x, p.y); gfx.fillStyle(0x9fe8ff, 1).fillCircle(p.x, p.y, 8); }
          break;
        }
        case 'shout': {
          // A loudness bar (mic on) and a big button that does the same thing as a shout.
          const k = Math.min(1, level * 3);
          gfx.fillStyle(0x24283a, 1).fillRoundedRect(left + 30, top + 40, BOX.w - 60, 18, 6);
          gfx.fillStyle(0x78f090, 1).fillRoundedRect(left + 30, top + 40, (BOX.w - 60) * k, 18, 6);
          gfx.fillStyle(0xffe060, 1).fillCircle(mid.x, mid.y + 30, 40 + (t % 800 < 120 ? 4 : 0));
          gfx.lineStyle(4, 0xffffff, 0.9).strokeCircle(mid.x, mid.y + 30, 40);
          break;
        }
        case 'rhythm': {
          const y = cy;
          const span = BOX.w - 60;
          const last = Math.max(...def.beatsMs) + 400;
          gfx.lineStyle(2, 0xffffff, 0.4).lineBetween(left + 30, y, left + 30 + span, y);
          for (const b of def.beatsMs) gfx.fillStyle(0xffe060, 1).fillCircle(left + 30 + (b / last) * span, y, 8);
          const headX = left + 30 + Math.min(1, t / last) * span;
          gfx.fillStyle(t < pulseUntil ? 0x78f090 : 0x9fe8ff, 1).fillCircle(headX, y, 12);
          break;
        }
      }
    };

    const tick = scene.time.addEvent({
      delay: 16, loop: true,
      callback: () => {
        if (finished) return;
        if (meter && meter.state === 'on') { level = meter.level(); if (detector.feed(level, now())) { shouted = true; return finish(judge()); } }
        if (rx) rx.refresh();
        else draw();
        // Don't hang: end at the latest when the prompt's length is up.
        if (now() > promptLengthMs(def) + 300 && !(def.kind === 'drag' && dragging)) finish(judge());
      },
    });
  });
}

/** Plays a tiny reaction cue (core/interaction/reactions.ts) above (x, y). Decoration only; resolves when done. */
export function playReaction(scene: Phaser.Scene, settings: Settings, id: string, x: number, y: number): Promise<void> {
  const plan = resolveAnim(id, animSettingsFrom(settings));
  if (!plan || !plan.play) return Promise.resolve();
  return new Promise((resolve) => {
    const label = scene.add.text(x, y, plan.glyph, textStyle(30, plan.color)).setOrigin(0.5).setDepth(1001);
    if (plan.reduced) {
      scene.tweens.add({ targets: label, alpha: 0, duration: plan.ms, onComplete: () => { label.destroy(); resolve(); } });
      return;
    }
    label.setScale(0.4);
    scene.tweens.add({
      targets: label, y: y - 26, scale: 1.15, duration: plan.ms * 0.45, ease: 'Back.easeOut',
      onComplete: () => scene.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: plan.ms * 0.55, ease: 'Sine.easeIn', onComplete: () => { label.destroy(); resolve(); } }),
    });
  });
}
