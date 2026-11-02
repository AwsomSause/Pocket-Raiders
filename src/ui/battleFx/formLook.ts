// What a Terastallized or Dynamaxed Pokémon wears for the rest of the battle
// (Deluxe Battle Kit art via the Pokémon Memories repo): a slowly drifting
// crystal pattern in its Tera Type, or the red Dynamax energy pattern, laid
// over the sprite. No Phaser here, so tests can check it.

import { TERA_PATTERN_TYPES } from '../../assets/catalog';

export { TERA_PATTERN_TYPES };

/** Row of each type in the Tera type icon strip (images/packs/dbk/tera/types.png, 32×32 rows; Essentials' icon order). */
export const TERA_ICON_ROW: Record<string, number> = {
  normal: 0, fighting: 1, flying: 2, poison: 3, ground: 4, rock: 5, bug: 6, ghost: 7, steel: 8,
  fire: 10, water: 11, grass: 12, electric: 13, psychic: 14, ice: 15, dragon: 16, dark: 17, fairy: 18, stellar: 19,
};

export const teraPatternKey = (type: string): string =>
  `fx.tera.pattern.${(TERA_PATTERN_TYPES as readonly string[]).includes(type) ? type : 'default'}`;

/** Calyrex's riders have their own Dynamax pattern; everyone else wears the red one. */
export const dynamaxPatternKey = (speciesId: string): string => `fx.dynamax.pattern.${speciesId.startsWith('calyrex') ? 'calyrex' : 'dynamax'}`;

/** How strongly the pattern shows over the sprite (DBK uses opacity 150 of 255). */
export const PATTERN_ALPHA = 150 / 255;
/** Pattern drift in pixels per second (DBK moves it 1 px every 0.1 s). */
export const PATTERN_DRIFT = 10;

/** Loaded when a battle starts, with the cinematics. */
export const FORM_LOOK_ASSETS = [
  ...TERA_PATTERN_TYPES.map(teraPatternKey), 'fx.tera.pattern.default',
  'fx.dynamax.pattern.dynamax', 'fx.dynamax.pattern.calyrex',
  'ui.tera.types', 'ui.dynamax.icon',
];
