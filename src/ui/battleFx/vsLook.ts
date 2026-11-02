// How long each VS screen style (vsScreens.ts) holds the screen. No Phaser here, so tests can check it.

import type { VsStyle } from '../../assets/catalog';

/** Full-motion length of each VS screen style, in ms. */
export const VS_MS: Record<VsStyle, number> = { hgss: 2100, bw: 2100, e4: 2300, champion: 2600 };
