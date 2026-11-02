// Contract between TradeScene (state, input, the real trade) and a Trade Stop style (how it is drawn).
// A style never changes game state: it draws the stop, the focused offer, the option list and the trade moment.
import type Phaser from 'phaser';
import type { Species } from '../../core/contentSchema';
import type { TradeOffer, TradeView } from '../../core/trade/view';

export interface TradeCtx {
  scene: Phaser.Scene;
  view: TradeView;
  /** Reduced/off motion: no idle loops, short moments. */
  calm: boolean;
  /** Location art key (Pokemon Memories event backdrop), loaded before the style draws. */
  backdrop: string;
  /** The player's trainer art id. */
  player: string;
  species(id: string): Species;
  /** Layers: the stop's frame, the focused offer (cleared on every focus change), the options, the trade moment. */
  layers: { back: Phaser.GameObjects.Container; stage: Phaser.GameObjects.Container; list: Phaser.GameObjects.Container; top: Phaser.GameObjects.Container };
}

/** One option row: an offer, or the last row (leave). */
export interface TradeRow {
  title: string;
  sub: string;
  problem: string | null;
  offer: TradeOffer | null;
}

export interface RowWidget {
  focus(on: boolean): void;
}

export interface TradeHooks {
  focus(i: number): void;
  pick(i: number): void;
}

export interface TradeStyle {
  /** How many option rows fit at once (the scene pages through longer lists). */
  rows: number;
  /** The stop's frame: backdrop, place, money. Drawn once into layers.back. */
  frame(ctx: TradeCtx): void;
  /** Draws the focused offer into layers.stage (already cleared). `null` = the leave row. */
  stage(ctx: TradeCtx, offer: TradeOffer | null): void;
  /** Draws `rows` (absolute indices start at `first`) into layers.list (already cleared). */
  list(ctx: TradeCtx, rows: TradeRow[], first: number, hooks: TradeHooks): RowWidget[];
  /** Plays the trade moment into layers.top; returns the milliseconds it takes. */
  moment(ctx: TradeCtx, offer: TradeOffer & { give: NonNullable<TradeOffer['give']> }): number;
}
