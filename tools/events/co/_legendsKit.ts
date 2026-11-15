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
  ...(o.need || o.rule ? { rule: { ...(o.rule ?? {}), ...(o.need ? { calmBar: { need: o.need, start: o.start ?? 0, perTurn: o.perTurn ?? 0, likes: o.likes ?? [] } } : {}) } } : {}),
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

/** The Promise a Mythical asks (promisesData.ts), as the Visit scene says it. `forgives`: it forgives once. */
export const PROMISES: Readonly<Record<string, { title: string; promise: string; forgives: boolean }>> = {
  mew: { title: 'Mew', promise: 'Bring everyone: no two Pokémon in the party share the same pair of types.', forgives: true },
  celebi: { title: 'Celebi', promise: 'Harm no wood: knock out no wild Grass- or Bug-type.', forgives: true },
  jirachi: { title: 'Jirachi', promise: 'Refuse no one: agree to every request made of you in an event.', forgives: false },
  deoxys: { title: 'Deoxys', promise: 'Change with me: never lead with the same Pokémon two stages running.', forgives: true },
  phione: { title: 'Phione', promise: 'Take me along the coast: whenever a path by water is offered, take it.', forgives: true },
  darkrai: { title: 'Darkrai', promise: 'Keep away from them: use at most every second rest node.', forgives: true },
  shaymin: { title: 'Shaymin', promise: 'Take no payment for kindness: choose every generous ending an event offers.', forgives: true },
  victini: { title: 'Victini', promise: 'Never turn away: flee no battle and decline no challenge.', forgives: true },
  keldeo: { title: 'Keldeo', promise: 'Fight your own battles: accept no assist from a rival or ally.', forgives: true },
  meloetta: { title: 'Meloetta', promise: 'Finish the song: never quit or skip a minigame once begun.', forgives: true },
  genesect: { title: 'Genesect', promise: 'No more machines: use no TM or technical item this run.', forgives: false },
  diancie: { title: 'Diancie', promise: 'Sell nothing: sell no item this run.', forgives: true },
  hoopa: { title: 'Hoopa', promise: 'Let me play: it takes one random item a stage; keep at least three items in the bag.', forgives: true },
  volcanion: { title: 'Volcanion', promise: 'Finish what you started: take in or find a home for every rescued Pokémon.', forgives: false },
  magearna: { title: 'Magearna', promise: 'Carry this for me: one Pokémon holds her bouquet until the last stage.', forgives: true },
  zeraora: { title: 'Zeraora', promise: 'No more cages: catch nothing more this run.', forgives: false },
  meltan: { title: 'Meltan', promise: 'Feed me: give it one held item per stage.', forgives: true },
  zarude: { title: 'Zarude', promise: 'It is yours now: the youngest Pokémon in your party must never faint.', forgives: true },
  pecharunt: { title: 'Pecharunt', promise: 'Accept every gift: take whatever is offered to you by anyone.', forgives: false },
};

/**
 * The end of a Visit scene: the Promise room `co-my-<id>-promise`. "I promise." sets `vow-<id>` (core/legends/signs.ts makes the
 * Mythical the run's Guest, one per run); "Not this run." leaves a ₽500 gift; asking what happens on a broken Promise comes back here.
 * Every Visit entry requires `believed-<id>` and no Mythical visited yet (`mythical-visited` is 0).
 */
export const promiseRoom = (id: string, intro: string, yes: string, tint: string, extra: Json = {}): Json => {
  const m = PROMISES[id]!;
  const self = `co-my-${id}-promise`;
  return {
    id: self, name: `${m.title}: The Promise`, group: 'Story: Mythical', room: true, rarity: 'rare', ...extra,
    scene: { cast: [], pokemon: id, tint, effect: 'sparkle' },
    intro: `${intro}\n\nThe Promise: ${m.promise}`,
    choices: [
      { label: '"I promise."', success: { text: yes, effects: [{ kind: 'flag', key: `vow-${id}`, amount: 1 }, { kind: 'moment', text: `${m.title} came to you, and you made it a promise.`, importance: 90 }] } },
      { label: '"Not this run."', success: { text: `${m.title} leaves a small gift (₽500) and goes. No harm done.`, effects: [{ kind: 'money', amount: 500 }, { kind: 'flag', key: `${id}-declined`, amount: 1 }] } },
      { label: '"What happens if I break it?"', success: { text: m.forgives ? `${m.title} will forgive you once. The second time, it leaves.` : `${m.title} does not forgive. Break it once and it is gone.`, effects: [{ kind: 'addEvent', eventId: self }] } },
    ],
  };
};

/** Conditions every Visit entry carries: the Mythical is believed (3 Tellings) and no Mythical has visited this run. */
export const visitable = (id: string): Json[] => [
  { kind: 'flag', key: `believed-${id}`, atLeast: 1, atMost: 99 },
  { kind: 'flag', key: 'mythical-visited', atLeast: 0, atMost: 0 },
];
