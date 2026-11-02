// Trade Stop styles (trade stops redesign, Kice 2026-11-02): twelve anime/manga ways to draw the
// Trade Post and the Plaza traders. Kice wants them all, alternating at random. They are the `trade`
// screen of the shared screen-style setting (screenStyles.ts: Random, a pinned style, or Original),
// so there is no save change. Presentation only: the style never changes what is traded.
import { ORIGINAL, SCREEN_STYLES, SCREEN_STYLES_READY, screenStyleOf, type ScreenStyleId } from './screenStyles';

export type TradeStyleId = ScreenStyleId<'trade'>;
/** Every style, in mock-up order (/mnt/project-files/redesign/trade-stops). */
export const TRADE_STYLE_IDS = Object.keys(SCREEN_STYLES.trade.styles) as TradeStyleId[];
/** The styles that are built (later slices add the rest). Random only draws from these. */
export const TRADE_STYLES_READY: readonly TradeStyleId[] = SCREEN_STYLES_READY.trade;

/**
 * The look one trade stop draws with, or 'original' (the old text list). "Random" picks from a hash of
 * `salt` (run seed, stop and trades made): stable while you look, different from stop to stop, never gameplay RNG.
 */
export function pickTradeStyle(saved: Readonly<Record<string, string>> | undefined, salt: string): TradeStyleId | typeof ORIGINAL {
  return screenStyleOf('trade', saved, salt);
}

/** The random-pick salt for one visit to a stop. */
export const tradeSalt = (seed: string, sideId: string, tradesMade: number): string => `${seed}:${sideId}:${tradesMade}`;

/** True when this stop should open the Trade Stop screen (false: the player chose the Original look). */
export function useTradeScreen(saved: Readonly<Record<string, string>> | undefined, salt: string): boolean {
  return pickTradeStyle(saved, salt) !== ORIGINAL;
}
