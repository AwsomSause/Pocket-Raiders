// The Pokémon-screen (party) looks (Screens redesign, Group B). `SCREEN_STYLES_READY.party` lists the ones the player can get.
import type { ScreenStyleId } from '../../core/presentation/screenStyles';
import { aero } from './aero';
import { binder } from './binder';
import { classic } from './classic';
import { manga } from './manga';
import { mii } from './mii';
import { shonen } from './shonen';
import { spotlight } from './spotlight';
import { sticker } from './sticker';
import type { PartySkin } from './types';

export const PARTY_SKINS: Record<ScreenStyleId<'party'>, PartySkin> = { aero, classic, mii, binder, manga, spotlight, shonen, sticker };
export { face as paintFace } from './common';
