// The one entry point for wide formats: start one, show its card, take a choice, report a finished battle or turn.
// The screen and the Extended Cut director call only these; each format lives in its own file.

import { blackout } from './blackout';
import { breather } from './breather';
import { colossus } from './colossus';
import { convoy } from './convoy';
import { debate } from './debate';
import { front } from './front';
import { siege } from './siege';
import { clearFormat, currentFormat, doneFormats, storeFormat } from './store';
import type { FormatCard, FormatCtx, FormatId, WideFormat } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FORMATS: Partial<Record<FormatId, WideFormat<any>>> = {
  breather,
  blackout,
  convoy,
  siege,
  colossus,
  front,
  debate,
};

const ONE_SHOT: readonly FormatId[] = ['breather', 'blackout', 'convoy', 'siege', 'colossus', 'front', 'debate'];

/** Starts a format, once per climax for one-shot formats (the director calls `beginCut` at the start of each climax). False when one is running or it already ran. */
export function startFormat(id: FormatId, ctx: FormatCtx, input?: unknown): boolean {
  const fmt = FORMATS[id];
  if (!fmt || (fmt.canStart && !fmt.canStart(ctx, input)) || currentFormat(ctx.run) || (ONE_SHOT.includes(id) && doneFormats(ctx.run).includes(id))) return false;
  storeFormat(ctx.run, id, fmt.setup(ctx, input));
  return true;
}

/** The card for the running format, or null when none runs. */
export function cardOf(ctx: FormatCtx): FormatCard | null {
  const slot = currentFormat(ctx.run);
  const fmt = slot && FORMATS[slot.id];
  return slot && fmt ? fmt.describe(slot.state, ctx) : null;
}

function step(ctx: FormatCtx, f: (fmt: WideFormat<any>, state: any) => unknown): boolean { // eslint-disable-line @typescript-eslint/no-explicit-any
  const slot = currentFormat(ctx.run);
  const fmt = slot && FORMATS[slot.id];
  if (!slot || !fmt) return false;
  storeFormat(ctx.run, slot.id, f(fmt, slot.state) as object);
  return true;
}

export function chooseOption(ctx: FormatCtx, optionId: string): boolean {
  return step(ctx, (fmt, s) => (fmt.choose ? fmt.choose(s, optionId, ctx) : s));
}
export function battleEnded(ctx: FormatCtx, won: boolean): boolean {
  return step(ctx, (fmt, s) => (fmt.onBattleEnd ? fmt.onBattleEnd(s, won, ctx) : s));
}
export function turnPassed(ctx: FormatCtx, turn: number): boolean {
  return step(ctx, (fmt, s) => (fmt.onTurn ? fmt.onTurn(s, turn, ctx) : s));
}

/** True when the running format has finished. The screen then calls `closeFormat`. */
export function formatOver(ctx: FormatCtx): boolean {
  const slot = currentFormat(ctx.run);
  const fmt = slot && FORMATS[slot.id];
  return !!slot && !!fmt && fmt.isOver(slot.state);
}

export function closeFormat(ctx: FormatCtx): void {
  clearFormat(ctx.run);
}
