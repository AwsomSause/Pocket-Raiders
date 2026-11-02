// Shop styles by shop type (shops redesign): every kind of shop has its own look.
import type { ShopTypeId } from '../../core/shopTypes';
import { bazaar } from './bazaar';
import { carousel } from './carousel';
import { depot } from './depot';
import { mart } from './mart';
import { night } from './night';
import { pokenet } from './pokenet';
import type { ShopLayout } from './types';

export const SHOP_LAYOUTS: Record<ShopTypeId, ShopLayout> = { mart, boutique: carousel, bazaar, depot, pokenet, night };

export const shopLayout = (type: ShopTypeId): ShopLayout => SHOP_LAYOUTS[type] ?? mart;
