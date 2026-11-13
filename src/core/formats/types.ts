// Beta 0.6 wide formats (plan E4): a thin interface over ordinary battles. A format keeps its own small state in
// `run.expansion.cut.format` (JSON, validated on read, so no save bump). Presentation only reads `describe`; every
// result comes from the state, never from an animation. Pure data + rules, no Phaser, no gameplay RNG unless a format
// names its own seeded stream.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';

export const FORMAT_IDS = ['breather', 'blackout', 'convoy', 'siege', 'colossus', 'front', 'debate'] as const;
export type FormatId = (typeof FORMAT_IDS)[number];

export interface FormatCtx {
  content: Content;
  run: RunState;
}

export interface FormatOption {
  id: string;
  label: string;
  enabled: boolean;
  /** Why it is off, or a short hint. */
  note?: string;
}

/** What the plain format screen shows: a title, some lines, and the choices. */
export interface FormatCard {
  title: string;
  lines: string[];
  options: FormatOption[];
  /** True when the format is finished and the screen should offer "Continue" only. */
  over: boolean;
}

export interface WideFormat<S> {
  id: FormatId;
  /** Builds the starting state from the run. Never mutates the run. */
  setup(ctx: FormatCtx, input?: unknown): S;
  describe(state: S, ctx: FormatCtx): FormatCard;
  /** The player picks an option on the card. Returns the next state (and may change the run, once). */
  choose?(state: S, optionId: string, ctx: FormatCtx): S;
  /** A battle that belongs to this format ended. */
  onBattleEnd?(state: S, won: boolean, ctx: FormatCtx): S;
  /** One battle turn passed (formats with a clock). */
  onTurn?(state: S, turn: number, ctx: FormatCtx): S;
  isOver(state: S): boolean;
}

/** The slot in `run.expansion.cut` where the running format lives. */
export interface FormatSlot {
  id: FormatId;
  state: Record<string, unknown>;
}
