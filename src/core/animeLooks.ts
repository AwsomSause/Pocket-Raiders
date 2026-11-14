// Anime Forms (Kice's zip, 2026-11-14): special art for the Squirtle Squad and the Fighting
// Tournament champion Primeape. Presentation only: a Pokémon's `look` changes which sprite is
// drawn, never its species, stats or any roll. Pure data with no imports (the asset catalog uses it).

export const ANIME_LOOKS = ['squad-lesser', 'squad-leader', 'champion'] as const;
export type AnimeLook = (typeof ANIME_LOOKS)[number];

/** look -> species id -> sprite path under images/pokemon (custom/<key>). */
export const ANIME_LOOK_SPRITES: Record<AnimeLook, Record<string, string>> = {
  'squad-lesser': { squirtle: 'custom/anime-lesser-squirtle-squad', wartortle: 'custom/anime-lesser-wartortle', blastoise: 'custom/anime-lesser-blastoise', 'blastoise-mega': 'custom/anime-mega-squad-blastoise' },
  'squad-leader': { squirtle: 'custom/anime-leader-squirtle-squad', wartortle: 'custom/anime-leader-wartortle', blastoise: 'custom/anime-leader-blastoise', 'blastoise-mega': 'custom/anime-mega-squad-blastoise' },
  champion: { primeape: 'custom/anime-champion-primeape' },
};

/** The anime sprite for this look and species, or undefined (then the normal art shows). */
export function animeSprite(look: string | undefined, speciesId: string): string | undefined {
  return look ? ANIME_LOOK_SPRITES[look as AnimeLook]?.[speciesId] : undefined;
}

/** Every anime sprite path (for the asset catalog). */
export const ANIME_SPRITE_PATHS: readonly string[] = [...new Set(Object.values(ANIME_LOOK_SPRITES).flatMap((m) => Object.values(m)))];
