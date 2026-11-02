// The Trade Stop styles (core/presentation/tradeStyles.ts): one file per style.
import type { TradeStyleId } from '../../core/presentation/tradeStyles';
import { eyecatch } from './eyecatch';
import { manga } from './manga';
import { novel } from './novel';
import type { TradeStyle } from './types';
import { versus } from './versus';

export const TRADE_LAYOUTS: Partial<Record<TradeStyleId, TradeStyle>> = { manga, versus, novel, eyecatch };

export function styleFor(id: TradeStyleId): TradeStyle {
  return TRADE_LAYOUTS[id] ?? manga;
}
