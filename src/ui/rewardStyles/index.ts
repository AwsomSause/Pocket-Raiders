// The reward-pick looks (Screens redesign, Group B). `SCREEN_STYLES_READY.reward` lists the ones the player can get.
import type { ScreenStyleId } from '../../core/presentation/screenStyles';
import { aero } from './aero';
import { cutin } from './cutin';
import { ds } from './ds';
import { episode } from './episode';
import { gifts } from './gifts';
import { holopack } from './holopack';
import { novel } from './novel';
import { orbit } from './orbit';
import { reels } from './reels';
import { trail } from './trail';
import type { RewardSkin } from './types';
import { wiishop } from './wiishop';

export const REWARD_SKINS: Record<ScreenStyleId<'reward'>, RewardSkin> = { aero, holopack, gifts, ds, wiishop, orbit, reels, trail, episode, novel, cutin };
export { DARK_INK, LIGHT_INK } from './types';
