// The Trade Stop styles (core/presentation/tradeStyles.ts): one file per style.
import type { TradeStyleId } from '../../core/presentation/tradeStyles';
import { cable } from './cable';
import { cards } from './cards';
import { chibi } from './chibi';
import { cutin } from './cutin';
import { episode } from './episode';
import { eyecatch } from './eyecatch';
import { ink } from './ink';
import { manga } from './manga';
import { novel } from './novel';
import { shoujo } from './shoujo';
import { sunsetStyle } from './sunset';
import type { TradeStyle } from './types';
import { versus } from './versus';

export const TRADE_LAYOUTS: Record<TradeStyleId, TradeStyle> = { manga, versus, novel, eyecatch, episode, cutin, shoujo, chibi, cable, cards, sunset: sunsetStyle, ink };

export function styleFor(id: TradeStyleId): TradeStyle {
  return TRADE_LAYOUTS[id] ?? manga;
}
