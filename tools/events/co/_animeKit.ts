// Shared vocabulary for the anime questline modules (tools/events/co/anime-*.ts). Files starting with "_" are not built.
// Source docs: QUESTLINES_ANIME_INSPIRED.md (AN1-AN36), QUESTLINES_ASH.md (AQ1-AQ60), QUESTLINES_DEEPENED_1.md (AN5, AN9, AN28, AN35)
// and QUESTLINES_DEEPENED_2.md (twelve AQ stories). Status note: docs/status/co-anime.md.
import { trainer, wild, type Json } from '../dsl.ts';

export const CATEGORY = 'anime';
export const AN = 'Anime-inspired questlines';
export const AQ = 'Pokémon-anime questlines';

// ---------- conditions (core/events/questline.ts) ----------
/** A story flag was first set `atLeast`..`atMost` stages ago (0 = this stage). */
export const age = (key: string, atLeast = 1, atMost = 99): Json => ({ kind: 'flagAge', key, atLeast, atMost });
/** A Pokémon of this evolution line (base species id) is in the party, at Bond level `bond` or more (Bond N = friendship N x 50). */
export const line = (species: string, bond = 0): Json => ({ kind: 'partyLine', species, bond });
/** Nobody of this evolution line is in the party. */
export const noLine = (species: string): Json => ({ kind: 'partyLine', species, absent: true });
/** A flag that was never set. */
export const notYet = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });
/** An event already played this run. */
export const seen = (id: string): Json => ({ kind: 'eventSeen', id });
/** This exact species is in the party. */
export const hasMon = (species: string): Json => ({ kind: 'partySpecies', species });
/** A party member at this friendship or more (Bond 3 = 150, Bond 4 = 200, maximum = 250). */
export const fond = (atLeast: number): Json => ({ kind: 'friendship', atLeast });
export const knows = (move: string): Json => ({ kind: 'partyMove', move });
export const badges = (atLeast: number): Json => ({ kind: 'badges', atLeast });

// ---------- effects ----------
/** Bond for the party member of this line only ("+1 Bond" = 5). */
export const bondLine = (species: string, amount: number): Json => ({ kind: 'friendshipLine', species, amount });
/** This event's stop opens beside the node reached after `nodes` more nodes. */
export const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
/** A party member of species `from` becomes `to` for good (an evolution that happens in the scene). Does nothing when `from` is not in the party. */
export const evolve = (from: string, to: string): Json => ({ kind: 'formChange', from, to });
/** A line in the run's Chronicle (an Afterstory that happens inside the same run). */
export const moment = (text: string, importance = 60): Json => ({ kind: 'moment', text, importance });
/** The first conscious Pokémon of `type` (else the lead), or `species`, learns a move. */
export const teach = (move: string, o: { type?: string; species?: string } = {}): Json => ({ kind: 'teachMove', move, ...o });
/** A short boost for the next `battles` battles (ArchetypeModifier effects). */
export const temp = (label: string, effects: Json[], battles = 1): Json => ({ kind: 'tempEffect', label, effects, battles });
/** A Pokémon joins, with the extras the story gives it. `bond` is extra friendship (1 to 100) on top of the base 70. */
export const gain = (species: string, o: { moves?: string[]; ability?: string; hidden?: boolean; shiny?: number; lv?: number; level?: number; bond?: number } = {}): Json => ({
  kind: 'join', shadow: false, species: [species], types: [], levelBonus: o.lv ?? 0, shinyMultiplier: o.shiny ?? 1,
  ...(o.moves ? { moves: o.moves } : {}), ...(o.ability ? { ability: o.ability } : {}), ...(o.hidden ? { hiddenAbility: true } : {}),
  ...(o.level ? { level: o.level } : {}), ...(o.bond ? { friendship: o.bond } : {}),
});
/** The companion leaves the party because it chose to (a farewell the player picked). The choice is locked when it is not in the party. */
export const farewell = (label: string, species: string[]): Json => ({ kind: 'tradeAway', want: { label, species } });
/** Signs (STANDARDS.md): a Legendary Sign of +n until the legends thread names the real effect. */
export const sign = (legend: string, n = 1): Json => ({ kind: 'flag', key: `sign-${legend}`, amount: n });

// ---------- battles: every story fight is friendly (people's piece): a loss never ends the run, the party gets back up, `lose` effects apply ----------
type Extra = Record<string, unknown>;
/** A trainer fight. `extra` takes any EventBattle trainer field (lineup, team, sprite, spritePokemon, rule, lose, level, weather, ally...). */
export const duel = (name: string, o: Parameters<typeof trainer>[1] = {}, extra: Extra = {}): Json => ({ ...trainer(name, o), friendly: true, ...extra });
/** A wild fight. `extra` takes any EventBattle wild field (lose, rule, foeMoves, weather...). */
export const beast = (o: Parameters<typeof wild>[0] = {}, extra: Extra = {}): Json => ({ ...wild(o), friendly: true, ...extra });
/** A fight against one named Pokémon that can pay `lose` effects (drawn as that Pokémon, not as a person). */
export const monDuel = (name: string, species: string, lv = 0, extra: Extra = {}): Json => ({ ...trainer(name, { size: 1, lv }), lineup: [species], spritePokemon: species, friendly: true, ...extra });

// ---------- placement (src/data/catalogOverhaul/placement/anime.json; the lead thread's placer reads it) ----------
export type Shape = 'Single' | 'Door' | 'Stage-Three' | 'Trial' | 'Region' | 'Run-Long' | 'Companion' | 'Tournament';
export interface Place {
  shape: Shape;
  /** "A3" = not before absolute stage 3. */
  earliest: string;
  home?: number | string;
  window?: [number, number];
  sits?: 'must-see' | 'optional' | 'side-branch';
  attaches?: 'after' | 'before' | 'instead' | 'rest' | 'town';
  tags?: string[];
  level?: string;
  often?: 'run' | 'region';
  /** The questline's later beats, in order (event ids), where the shape has several. */
  beats?: string[];
  /** Anything the doc says about where it sits that has no field (Night, Rain, "the header reads Dusk"). */
  note?: string;
}

/** Stage tags of the pack to the type themes the game has today (an event is likelier on a stage themed with one of its types). */
const TAG_TYPES: Record<string, string[]> = {
  water: ['water'], forest: ['grass', 'bug'], eerie: ['ghost', 'dark'], city: ['normal', 'electric', 'steel'], hot: ['fire', 'ground'],
  snow: ['ice'], cave: ['rock', 'ground'], high: ['flying', 'rock'], storm: ['electric'],
};
export const tagTypes = (...tags: string[]): string[] => [...new Set(tags.flatMap((t) => TAG_TYPES[t] ?? [t]))];
/** "A4" -> 4 (EventDef.minStage). */
export const stageOf = (earliest: string): number => Number(earliest.replace(/^A/, ''));

/** What every anime module exports besides CATEGORY, EVENTS and REMOVE (read by tools/catalog-overhaul/anime-report.ts). */
export interface QuestlineIndex {
  /** Questline number ("AN1", "AQ16") to its first event id. */
  QUESTLINES: Record<string, string>;
  /** First event id of a questline to its placement block. */
  PLACEMENT: Record<string, Place>;
  /** What the doc asks for that the game cannot do yet, per questline (real limits only; goes into docs/status/co-anime.md). */
  LIMITS: Record<string, string[]>;
}

// ---------- the rival slot (rivals thread, core/rivals/questlines.ts): one rival beat per stage, steps 3-18 ----------
/** Condition: this stage's rival slot is still free (rival stories AQ23, AQ54-AQ58, AQ60 put it in `requires`). */
export const slotFree = (): Json => ({ kind: 'rivalQuest', slotFree: true });
/** Effect: this beat used the stage's rival slot (in every choice that plays the beat). */
export const takeSlot = (): Json => ({ kind: 'rivalQuest', takeSlot: true });
