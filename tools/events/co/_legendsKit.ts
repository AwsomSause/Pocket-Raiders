// Helpers for the legends category of the Catalog Overhaul Pack (Alphas, Anomalies, Legendary, Mythical and Ultra questlines).
// Files starting with "_" are not built. Shared contract: /mnt/project-files/plans/catalog-overhaul/LEGENDS_PIECES.md.
import type { Json } from '../dsl.ts';

/** A Sign of a Legendary (species id, a group such as `bird`, or `own`): +N Influence when it is the run's own Legendary. */
export const sign = (who: string, amount = 1): Json => ({ kind: 'flag', key: `sign-${who}`, amount });
/** One Telling of a Mythical: three make it believed (Mythical Promises). */
export const telling = (mythical: string, amount = 1): Json => ({ kind: 'flag', key: `telling-${mythical}`, amount });

/**
 * An Alpha fight (core/battle/calm.ts). `need` balms fill the Calm bar; `likes` adds a liked kind of move; `perTurn` fills it by itself.
 * `calm`: what calming pays (the `win` effects do not pay then). `win`: what beating it pays. Every Alpha fight is a pseudo fight
 * unless `pseudo: false`: losing it puts you back on the map, it never ends the run.
 */
export const alpha = (o: {
  species: string;
  /** Balms needed to calm it (1 to 12). Leave it out for an Alpha that can only be fought (and caught with a ball once beaten down). */
  need?: number;
  start?: number;
  perTurn?: number;
  likes?: ('sound' | 'scent')[];
  lv?: number;
  calm?: Json[];
  win?: Json[];
  lose?: Json[];
  rule?: Json;
  weather?: string;
  pseudo?: boolean;
}): Json => ({
  kind: 'wild',
  alpha: true,
  species: [o.species],
  types: [],
  levelBonus: o.lv ?? 0,
  shinyMultiplier: 1,
  ...(o.pseudo === false ? {} : { pseudo: true }),
  ...(o.weather ? { weather: o.weather } : {}),
  ...(o.need || o.rule ? { rule: { ...(o.rule ?? {}), ...(o.need ? { calm: { need: o.need, start: o.start ?? 0, perTurn: o.perTurn ?? 0, likes: o.likes ?? [] } } : {}) } } : {}),
  win: o.win ?? [],
  ...(o.need ? { calm: o.calm ?? [] } : {}),
  lose: o.lose ?? [],
});

/** A calmed (or caught) Alpha joins, with the Alpha Mark: it keeps its size, +10% HP and its signature move. */
export const joinAlpha = (species: string, o: { moves?: string[]; ability?: string; lv?: number } = {}): Json => ({
  kind: 'join',
  species: [species],
  types: [],
  levelBonus: o.lv ?? 0,
  shinyMultiplier: 1,
  alpha: true,
  ...(o.moves ? { moves: o.moves } : {}),
  ...(o.ability ? { ability: o.ability } : {}),
});

/** A plain gift Pokémon that knows a signature move (the Frigibax with Last Winter, the Litwick that knows a name). */
export const gift = (species: string, o: { moves?: string[]; ability?: string; lv?: number; friendship?: number } = {}): Json => ({
  kind: 'join',
  species: [species],
  types: [],
  levelBonus: o.lv ?? 0,
  shinyMultiplier: 1,
  ...(o.moves ? { moves: o.moves } : {}),
  ...(o.ability ? { ability: o.ability } : {}),
  ...(o.friendship ? { friendship: o.friendship } : {}),
});

/** The run's count of calmed Alphas (`calmed.alpha` in the pack) for a calm that happens outside a battle (A7 "Fix", A8 "Build shade"). */
export const calmedAlpha = (): Json => ({ kind: 'flag', key: 'calmed-alpha', amount: 1 });
