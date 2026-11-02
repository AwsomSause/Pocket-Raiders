// The map looks (Screens redesign, Group B). `SCREEN_STYLES_READY.map` lists the ones the player can get.
import type { ScreenStyleId } from '../../core/presentation/screenStyles';
import { nextstop } from './nextstop';
import { panorama } from './panorama';
import { starchart } from './starchart';
import { townmap } from './townmap';
import type { MapSkin } from './types';
import { wiigrid } from './wiigrid';

export const MAP_SKINS: Record<ScreenStyleId<'map'>, MapSkin> = { townmap, starchart, wiigrid, nextstop, panorama };
