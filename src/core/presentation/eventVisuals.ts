// Event visual director (Kice 2026-11-16: "remake the event screen system all together and let it draw events
// in its own way"). Reads an event's own words and data and decides its picture: the place, the hour, the
// mood, the weather, the shot, and a seed every drawn shape comes from. Also reads a choice, a line of text
// and an outcome and says how the screen should react to it.
//
// Presentation only and pure: no Phaser, no gameplay RNG (the seed is a hash of the event's id), nothing
// here can change an outcome. A choice is read only from what its card already shows, so a reaction never
// spoils a hidden reward.

import { fnv1a } from '../expansion/hash';
import type { ChoiceKind } from './eventStyles';

export type Daypart = 'day' | 'eve' | 'night';
/** How a place is drawn when it has no picture of its own (and what frames the picture when it has one). */
export type SetKind = 'wilds' | 'skyline' | 'room' | 'hall' | 'shop' | 'ruins' | 'snow' | 'deck' | 'fair' | 'void' | 'camp';
export type MoteKind = 'none' | 'leaves' | 'petals' | 'dust' | 'embers' | 'bubbles' | 'flakes' | 'sand' | 'stars' | 'fireflies' | 'wisps' | 'confetti' | 'sparks';
export type Mood = 'calm' | 'warm' | 'tense' | 'eerie' | 'sad' | 'festive' | 'grand' | 'mystery' | 'playful';
export type Shot = 'talk' | 'vista' | 'moment' | 'clash' | 'deal';
export type Weather = 'rain' | 'snow' | 'fog' | 'sparkle' | 'glint' | 'fire' | 'hearts' | 'flicker' | 'confetti' | 'net';
/** What the event's subject does on the spot (the old scene effects that move a figure). */
export type Stir = 'shake' | 'float' | 'rattle' | 'spin';

interface PlaceDef {
  /** Words that name the place (whole words, lower case; a trailing * matches any ending). */
  words: string;
  /** Pictures of the place (New UI arena backdrops, `bg.uie.<name>`); the event's seed picks one. Empty: the place is drawn. */
  pics: readonly string[];
  set: SetKind;
  motes: MoteKind;
  /** Indoors (or underground): the hour outside does not light it. */
  inside?: boolean;
}

/** Pictures that also come at dusk and at night (`<name>_eve`, `<name>_night`). */
const TIMED: Record<string, readonly Daypart[]> = {
  autumn: ['eve', 'night'], battleparadise: ['eve', 'night'], beach: ['eve', 'night'], lake: ['eve', 'night'], meadow: ['eve', 'night'], woodland: ['eve', 'night'], sand: ['night'],
};

/** Every place an event can stand in, most specific first (a tie goes to the earlier one). */
export const PLACES = {
  camp: { words: 'camp campfire bonfire campsite tent sleeping', pics: ['woodland'], set: 'camp', motes: 'fireflies' },
  center: { words: 'nurse clinic hospital infirmary healing ward', pics: [], set: 'room', motes: 'dust', inside: true },
  shop: { words: 'shop store mart market stall stalls merchant vendor peddler pedlar bazaar counter department shopkeeper clerk salesman trader auction', pics: [], set: 'shop', motes: 'dust', inside: true },
  lab: { words: 'lab laboratory professor research researcher scientist experiment computer terminal', pics: ['lab'], set: 'room', motes: 'none', inside: true },
  gym: { words: 'gym dojo stadium arena dome tournament league colosseum court ring referee exhibition match badge', pics: ['arena'], set: 'hall', motes: 'dust', inside: true },
  factory: { words: 'factory plant generator warehouse pipeline conveyor reactor turbine machinery windworks depot silph', pics: ['industrial'], set: 'hall', motes: 'sparks', inside: true },
  fair: { words: 'festival fair fairground carnival circus parade contest stage show lantern lanterns fireworks celebration booth pageant', pics: [], set: 'fair', motes: 'confetti' },
  hall: { words: 'tower castle palace pike hall throne mansion museum hideout base headquarters vault corridor elevator casino basement cell prison bunker office lobby gallery', pics: [], set: 'hall', motes: 'dust', inside: true },
  house: { words: 'house home kitchen inn hotel cabin cottage parlour parlor bedroom school classroom library cafe café restaurant daycare day-care attic cellar shed barn porch hearth', pics: [], set: 'room', motes: 'dust', inside: true },
  ruins: { words: 'ruin ruins pyramid temple shrine altar ancient relic tablet statue monument unown pillar pillars inscription tomb crypt', pics: [], set: 'ruins', motes: 'dust' },
  graveyard: { words: 'grave graves graveyard cemetery memorial ghost ghosts haunt* spirit spirits seance séance headstone mourning', pics: ['graveyard'], set: 'wilds', motes: 'wisps' },
  void: { words: 'dream void distortion wormhole dimension rift portal ultra anomaly unreal nightmare', pics: [], set: 'void', motes: 'stars' },
  space: { words: 'space meteor meteorite comet cosmic stars constellation observatory telescope', pics: ['starlight', 'newworld'], set: 'void', motes: 'stars' },
  sky: { words: 'sky cloud clouds airship balloon glider soaring', pics: ['clouds', 'clouds2'], set: 'wilds', motes: 'none' },
  underwater: { words: 'underwater dive diving seafloor reef trench submarine sunken', pics: ['dive'], set: 'wilds', motes: 'bubbles' },
  sea: { words: 'sea ocean ship ferry boat sail sailor harbor harbour port dock docks pier deck captain anne voyage wharf', pics: [], set: 'deck', motes: 'none' },
  beach: { words: 'beach shore coast tide seaside island cove surf sandcastle', pics: ['beach'], set: 'wilds', motes: 'none' },
  waterfall: { words: 'waterfall falls cascade rapids', pics: ['waterfall', 'waterfall2'], set: 'wilds', motes: 'none' },
  lake: { words: 'lake pond river stream spring fishing angler riverbank creek brook', pics: ['lake'], set: 'wilds', motes: 'none' },
  swamp: { words: 'swamp marsh bog mire wetland reeds', pics: ['swamp', 'marsh', 'forest4'], set: 'wilds', motes: 'fireflies' },
  volcano: { words: 'volcano lava magma crater cinnabar eruption molten', pics: ['volcano', 'lava'], set: 'wilds', motes: 'embers' },
  snow: { words: 'snow ice icy blizzard frozen glacier frost tundra sleet snowfall', pics: [], set: 'snow', motes: 'flakes' },
  crystal: { words: 'crystal crystals geode', pics: ['grotto'], set: 'wilds', motes: 'sparks', inside: true },
  mine: { words: 'mine mines quarry dig excavation fossil ore miner minecart', pics: ['mine1', 'mine2', 'gemstone'], set: 'wilds', motes: 'dust', inside: true },
  cave: { words: 'cave caves cavern tunnel tunnels underground burrow den dungeon delve passage', pics: ['cave'], set: 'wilds', motes: 'dust', inside: true },
  desert: { words: 'desert dune dunes oasis sandstorm mirage', pics: ['sand'], set: 'wilds', motes: 'sand' },
  safari: { words: 'safari savanna savannah reserve', pics: ['safari'], set: 'wilds', motes: 'dust' },
  mountain: { words: 'mountain mountains peak summit cliff ridge ledge climb mt pass slope', pics: ['mountain'], set: 'wilds', motes: 'dust' },
  city: { words: 'city town street streets alley plaza square rooftop downtown village avenue sidewalk fountain', pics: [], set: 'skyline', motes: 'none' },
  garden: { words: 'garden gardens flower flowers park orchard berry berries courtyard hedge greenhouse', pics: ['flowergarden', 'courtyard'], set: 'wilds', motes: 'petals' },
  forest: { words: 'forest wood woods grove tree trees branch branches nest canopy thicket undergrowth clearing', pics: ['woodland', 'forest3', 'autumn'], set: 'wilds', motes: 'leaves' },
  meadow: { words: 'meadow field fields pasture farm ranch fence hill hills picnic grass grassland', pics: ['meadow', 'battleparadise'], set: 'wilds', motes: 'petals' },
  route: { words: 'route road path trail crossroads signpost gate roadside wayside', pics: ['route'], set: 'wilds', motes: 'leaves' },
} as const satisfies Record<string, PlaceDef>;
export type PlaceId = keyof typeof PLACES;
const PLACE_IDS = Object.keys(PLACES) as PlaceId[];

/** A map stop's kind says where the event is, when its text does not. */
const STOP_PLACE: Record<string, PlaceId> = {
  delve: 'cave', dungeon: 'cave', hideout: 'hall', tower: 'hall', casino: 'hall', shrine: 'ruins', well: 'ruins', merchant: 'shop', shop: 'shop', trade: 'shop', contest: 'fair', lab: 'lab', haunted: 'graveyard',
  library: 'house', tutor: 'house', dojo: 'gym', daycare: 'meadow', heal: 'center', fish: 'lake', berry: 'garden', fossil: 'mine', treasure: 'cave', camp: 'camp', rest: 'camp', mirage: 'desert',
};
/** Event groups with a place of their own (weaker than the event's own words). */
const GROUP_PLACE: Record<string, PlaceId> = {
  Dungeons: 'cave', 'Dungeon Puzzles': 'cave', 'Mystery Dungeon': 'cave', 'Landmark Dungeons': 'cave', 'Secret Paths': 'cave', 'Hidden Paths': 'cave', 'Mysteries & Ruins': 'ruins', Relics: 'ruins', 'Relic Fragments': 'ruins',
  'Z-Trials': 'ruins', 'Tower of Legends': 'hall', 'Heists & Hideouts': 'hall', 'Plasma Operation': 'hall', 'Merchants & Deals': 'shop', 'Merchants and deals': 'shop', 'Wandering Merchant': 'shop', 'Shops, services and games': 'shop',
  'Shops and workshops': 'shop', 'Plush Workshop': 'house', Fairground: 'fair', 'Berry Festival': 'fair', 'Holiday events': 'fair', 'Festivals and whole-run events': 'fair', 'Games of chance': 'fair', Camp: 'camp', 'Campfire Tales': 'camp',
  'Rests, camp and bond': 'camp', 'Rest spots': 'camp', 'Ultra Beasts': 'void', 'Story: Ultra Beasts': 'void', 'Whole Run: Guidance of Giratina': 'void', 'Spooky Mode': 'graveyard', 'Haunted Detour': 'graveyard', Galar: 'gym',
  'Story: Tournament': 'gym', 'Rival Tournament': 'gym', 'Past Champions and Leaders': 'gym', 'Past Champions and Gym Leaders': 'gym', 'Poli-Pond': 'lake', Town: 'city', 'Road people and town stories': 'city', 'Road people': 'route',
  Convoy: 'route', 'Trainer Challenges': 'route', 'Trainers and challenges': 'route', 'Roaming Legendaries': 'mountain', 'Legendary Beasts Chase': 'mountain', 'Legendary Route': 'mountain', 'Delta Research': 'lab', 'Form Research': 'lab',
  'Treasure Hunt': 'beach', 'Evil Teams': 'hall', 'Villain Teams': 'hall', 'Evil Team': 'hall', 'Shadow Pokémon': 'hall',
};
/** The stage's type picks the place when nothing else does. */
const TYPE_PLACE: Record<string, PlaceId> = {
  normal: 'route', grass: 'forest', bug: 'forest', fire: 'volcano', water: 'lake', ice: 'snow', electric: 'factory', steel: 'factory', poison: 'swamp', ground: 'desert', rock: 'mountain', fighting: 'gym',
  flying: 'sky', psychic: 'ruins', ghost: 'graveyard', dark: 'city', dragon: 'mountain', fairy: 'garden',
};

const MOOD_WORDS: Record<Exclude<Mood, 'calm'>, string> = {
  tense: 'ambush threat threaten* grunt grunts attack* danger dangerous trap trapped roar* snarl* growl* blocks blocking demand* glare* weapon fight challenge* steal* stolen thief thieves chase* alarm guard guards',
  eerie: 'ghost* haunt* whisper* shadow shadows curse* cursed fog mist eerie cold chill* dark darkness silent silence creak* unseen watching',
  warm: 'friend friends kind kindness gift smile* thank* bond home warm gentle hug* laugh* together care* cared share* grateful proud',
  sad: 'tears cry cries crying goodbye farewell lost grave miss misses missing sorry alone lonely mourn* grief sob* abandoned',
  festive: 'festival party celebrate* cheer* parade prize prizes crowd applause music dance* dancing confetti winner fireworks',
  grand: 'legend legendary champion ancient myth mythical throne destiny prophecy guardian titan colossal sacred eternal',
  mystery: 'puzzle riddle strange secret mysterious clue clues odd unknown hidden cipher code sealed locked symbol symbols',
  playful: 'game games trick prank play playing race bet wager dare gamble joke silly giggle* mischief',
};
const MOODS = Object.keys(MOOD_WORDS) as Exclude<Mood, 'calm'>[];

const WEATHER_WORDS: [Weather, string][] = [
  ['rain', 'rain rains raining storm downpour drizzle thunder thunderstorm'], ['snow', 'snowing snowfall blizzard sleet'], ['fog', 'fog mist haze smoke'],
  ['fire', 'fire flames blaze burning'], ['sparkle', 'sparkle* glitter* shimmer* glow*'],
];
const NIGHT_WORDS = 'night midnight moon moonlight moonlit starlight dark';
const EVE_WORDS = 'dusk evening sunset twilight dawn sunrise';
const DAY_WORDS = 'noon morning midday afternoon sunny sunlight daylight';

/**
 * Place words that usually mean something else ("put on a show", "the ring of dancers", "it is mine", Team Magma, an Ice
 * Stone, TM Surf, a Ghost type, "looks at the sky"). One of these alone does not say where an event is, in its name or
 * its text: it counts only beside a surer word for the same place or a second such word.
 */
const WEAK_WORDS = 'show stage contest booth fair ring match court badge exhibition league plant depot mine dig den pass falls ghost ghosts spirit spirits dream ultra space stars dive diving surf magma crater '
  + 'ancient relic statue tablet monument pillar pillars research computer terminal experiment healing ward sleeping trader clerk captain anne sail climb slope passage delve gallery memorial mourning '
  + 'ice icy frost frozen spring store counter base cell office berry berries park sky cloud clouds';

/** Whole words of a text, lower case. A hyphenated word also counts as its parts ("Poli-Pond" names a pond). */
export function wordsOf(text: string): string[] {
  const out: string[] = [];
  for (const w of text.toLowerCase().match(/[a-zà-ÿ]+(?:-[a-zà-ÿ]+)*/g) ?? []) {
    out.push(w);
    if (w.includes('-')) out.push(...w.split('-'));
  }
  return out;
}
const matchers = new Map<string, (w: string) => boolean>();
/** A test for a word list ("ghost haunt*"): whole words, or any ending after a `*`. */
function matcher(list: string): (w: string) => boolean {
  let m = matchers.get(list);
  if (!m) {
    const exact = new Set<string>(), stems: string[] = [];
    for (const w of list.split(' ')) (w.endsWith('*') ? stems.push(w.slice(0, -1)) : exact.add(w));
    m = (w) => exact.has(w) || stems.some((s) => w.startsWith(s));
    matchers.set(list, m);
  }
  return m;
}
const hits = (words: readonly string[], list: string): number => { const m = matcher(list); let n = 0; for (const w of words) if (m(w)) n += 1; return n; };
const weak = matcher(WEAK_WORDS);
/**
 * How surely an event's own name and text put it in a place. A word counts 4 in the name and 1 in the text (3 at most).
 * A weak word (half as much in the name) counts only beside a sure word or a second weak word.
 */
function placeScore(name: readonly string[], intro: readonly string[], list: string): { score: number; loose: number } {
  const m = matcher(list), unsure = new Set<string>();
  let sureName = 0, sureText = 0, unsureHits = 0;
  for (const w of name) if (m(w)) { if (weak(w)) { unsure.add(w); unsureHits += 2; } else sureName += 1; }
  for (const w of intro) if (m(w)) { if (weak(w)) { unsure.add(w); unsureHits += 1; } else sureText += 1; }
  const backed = sureName > 0 || sureText > 0 || unsure.size > 1;
  return { score: sureName * 4 + Math.min(3, sureText + (backed ? unsureHits : 0)), loose: backed ? 0 : unsureHits };
}
/**
 * The place an event's own words name, and how surely (0: they name none). A tie goes to the earlier place. `hint` is
 * the place of a lone weak word, when that is all there is: a last guess, better than nothing.
 */
function ownPlace(ev: Pick<VisualEvent, 'name' | 'intro'>): { place: PlaceId; score: number; hint: PlaceId | null } {
  const name = wordsOf(ev.name), intro = wordsOf(ev.intro);
  let place: PlaceId = 'route', score = 0, hint: PlaceId | null = null, loose = 0;
  for (const id of PLACE_IDS) {
    const n = placeScore(name, intro, PLACES[id].words);
    if (n.score > score) { score = n.score; place = id; }
    if (n.loose > loose) { loose = n.loose; hint = id; }
  }
  return { place, score, hint: score > 0 ? null : hint };
}

/** The last part of an id that opens a storyline ("gn-04-door", "sky.opening"). */
const DOORS = new Set(['door', 'opening', 'open', 'intro', 'start', 'begin', 'arrive', 'arrival', 'entrance', 'gate']);
/** More events than this under one start of an id is a whole pack of stories, not one storyline. */
const FAMILY_MAX = 40;

/**
 * Where an event's storyline is set, for the events of it whose own words do not say. Events whose ids share a start
 * ("gn-04-door", "gn-04-dance-1"; "sky.opening", "sky.finale"; not "sky.opening" with "sky-pillar") are one storyline: its place is where its opening event
 * is clearly set (the event named by the shared start itself, or its "door"), else where more of its clearly set events
 * are than anywhere else (two or more of them). The longest shared start wins.
 */
export function familyPlaces(events: readonly Pick<VisualEvent, 'id' | 'name' | 'intro'>[]): Map<string, PlaceId> {
  const keys = (id: string): string[] => { const cut: string[] = []; for (let i = id.length - 1; i > 0; i--) if (id[i] === '-' || id[i] === '.') cut.push(id.slice(0, i + 1)); return cut; };
  const families = new Map<string, { door: PlaceId | null; said: PlaceId | null; n: number; tally: Map<PlaceId, number> }>();
  const family = (k: string) => { let f = families.get(k); if (!f) { f = { door: null, said: null, n: 0, tally: new Map() }; families.set(k, f); } return f; };
  for (const ev of events) {
    const own = ownPlace(ev), sure = own.score >= 2 ? own.place : null;
    // An event whose id is the shared start itself opens its storyline ("ovc-memory-lane", then "ovc-memory-lane-s1").
    if (sure) for (const sep of '-.') family(ev.id + sep).door ??= sure;
    for (const k of keys(ev.id)) {
      const f = family(k);
      f.n += 1;
      const opens = DOORS.has(ev.id.slice(k.length));
      // The opening event's one word is a last guess for a storyline that agrees on nothing else.
      if (opens && own.score > 0) f.said ??= own.place;
      if (!sure) continue;
      f.tally.set(sure, (f.tally.get(sure) ?? 0) + 1);
      if (opens) f.door ??= sure;
    }
  }
  const placeOf = (k: string): PlaceId | null => {
    const f = families.get(k);
    if (!f || f.n < 1 || f.n > FAMILY_MAX) return null;
    if (f.door) return f.door;
    let top: PlaceId | null = null, most = 0, next = 0;
    for (const [p, n] of f.tally) { if (n > most) { next = most; most = n; top = p; } else if (n > next) next = n; }
    return top && most >= 2 && most > next ? top : f.said;
  };
  const out = new Map<string, PlaceId>();
  for (const ev of events) for (const k of keys(ev.id)) { const p = placeOf(k); if (p) { out.set(ev.id, p); break; } }
  return out;
}

/** What the director reads of an event (an `EventDef` fits). */
export interface VisualEvent {
  id: string;
  name: string;
  group: string;
  intro: string;
  stop?: string | undefined;
  rarity?: string | undefined;
  types?: readonly string[] | undefined;
  scene?: { cast: readonly string[]; pokemon?: string | undefined; tint?: string | undefined; effect?: string | undefined } | undefined;
}
export interface VisualContext {
  /** The run's hour. */
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  /** The stage theme's types (lower case), most telling first. */
  stageTypes: readonly string[];
  /** The kinds of the event's choices, as their cards show them. */
  kinds: readonly ChoiceKind[];
  /** Where the event's storyline is set (`familyPlaces`), for an event whose own words do not say. */
  family?: PlaceId | undefined;
}
export interface EventVisual {
  place: PlaceId;
  /** Why this place: the event's own words, its map stop, its group, its storyline, the stage's type, or nothing (the road). */
  placedBy: 'words' | 'stop' | 'group' | 'family' | 'stage' | 'default';
  set: SetKind;
  inside: boolean;
  time: Daypart;
  /** Backdrop pictures to try, best first (asset ids); empty when the place is drawn. */
  pictures: string[];
  mood: Mood;
  weather: Weather | null;
  stir: Stir | null;
  motes: MoteKind;
  /** The event's own number: every drawn shape, the light's angle and the sigil come from it. */
  seed: number;
  /** A 5 x 5 mirrored mark that is this event's alone (15 bits, row by row, left three columns). */
  sigil: number;
  /** Everything above in one line; two events with the same line would look the same. */
  signature: string;
}

const STIRS: readonly string[] = ['shake', 'float', 'rattle', 'spin'];
const WEATHERS: readonly string[] = ['rain', 'snow', 'fog', 'sparkle', 'glint', 'fire', 'hearts', 'flicker', 'confetti', 'net'];

/** The picture of one event. Same event, hour and stage: same picture, always. */
export function eventVisual(ev: VisualEvent, ctx: VisualContext): EventVisual {
  const seed = fnv1a(ev.id) >>> 0;
  const name = wordsOf(ev.name), intro = wordsOf(ev.intro);
  // Place: the event's name counts most, then its text, then its stop, its group, its storyline, the stage.
  const own = ownPlace(ev), best = own.score;
  let place: PlaceId = own.place, placedBy: EventVisual['placedBy'] = best > 0 ? 'words' : 'default';
  if (best < 2) {
    const byStop = ev.stop ? STOP_PLACE[ev.stop] : undefined, byGroup = GROUP_PLACE[ev.group];
    const byType = TYPE_PLACE[(ev.types?.[0] ?? ctx.stageTypes[0] ?? '').toLowerCase()];
    // One word in the text loses to the stop or the group. With no word at all the storyline places the event, then a lone weak word, then the stage.
    if (byStop) { place = byStop; placedBy = 'stop'; }
    else if (byGroup) { place = byGroup; placedBy = 'group'; }
    else if (best === 0 && ctx.family) { place = ctx.family; placedBy = 'family'; }
    else if (best === 0 && own.hint) { place = own.hint; placedBy = 'words'; }
    else if (best === 0 && byType) { place = byType; placedBy = 'stage'; }
  }
  const def: PlaceDef = PLACES[place];
  const all = [...name, ...intro];
  const want: Daypart = hits(all, NIGHT_WORDS) ? 'night' : hits(all, EVE_WORDS) ? 'eve' : hits(all, DAY_WORDS) ? 'day' : ctx.period === 'night' ? 'night' : ctx.period === 'evening' ? 'eve' : 'day';
  const time: Daypart = place === 'graveyard' || place === 'camp' || place === 'space' ? 'night' : want;
  const pictures = pictureIds(def.pics, seed, time);

  const scores = MOODS.map((m) => hits(all, MOOD_WORDS[m]));
  const fights = ctx.kinds.filter((k) => k === 'battle').length;
  scores[MOODS.indexOf('tense')]! += fights * 2;
  if (ev.rarity === 'legendary' || ev.rarity === 'epic') scores[MOODS.indexOf('grand')]! += 2;
  if (place === 'graveyard') scores[MOODS.indexOf('eerie')]! += 1;
  if (place === 'fair') scores[MOODS.indexOf('festive')]! += 1;
  const top = Math.max(...scores);
  const mood: Mood = top > 0 ? MOODS[scores.indexOf(top)]! : 'calm';

  const fx = ev.scene?.effect ?? 'none';
  const said = WEATHER_WORDS.find(([, list]) => hits(all, list) > 0)?.[0] ?? null;
  const weather: Weather | null = WEATHERS.includes(fx) ? (fx as Weather) : def.inside && (said === 'rain' || said === 'snow') ? null : said;
  const stir: Stir | null = STIRS.includes(fx) ? (fx as Stir) : null;
  const motes: MoteKind = weather === 'snow' ? 'flakes' : def.motes === 'leaves' && time === 'night' ? 'fireflies' : def.motes === 'petals' && time === 'night' ? 'fireflies' : def.motes;
  const sigil = (seed ^ (seed >>> 15)) & 0x7fff;
  const signature = [place, def.pics.length ? pictures[0] : def.set, time, mood, weather ?? '-', stir ?? '-', motes, seed.toString(36)].join('/');
  return { place, placedBy, set: def.set, inside: !!def.inside, time, pictures, mood, weather, stir, motes, seed, sigil, signature };
}

/** The pictures of a place to try, best first: the seed's pick at this hour, then the same picture by day, then the others. */
function pictureIds(pics: readonly string[], seed: number, time: Daypart): string[] {
  if (!pics.length) return [];
  const at = seed % pics.length, order = [...pics.slice(at), ...pics.slice(0, at)], out: string[] = [];
  for (const p of order) {
    if (time !== 'day' && TIMED[p]?.includes(time)) out.push(`bg.uie.${p}_${time}`);
    out.push(`bg.uie.${p}`);
  }
  return out;
}

/** Every backdrop picture the director can ask for (the audit checks each one is in the asset catalog). */
export function allPictureIds(): string[] {
  const out = new Set<string>();
  for (const id of PLACE_IDS) for (const p of PLACES[id].pics) { out.add(`bg.uie.${p}`); for (const t of TIMED[p] ?? []) out.add(`bg.uie.${p}_${t}`); }
  return [...out];
}

/**
 * How the scene is framed, once the screen knows who is in it: a fight on offer is a clash, a person is a talk,
 * a Pokémon alone is a moment, goods and prices are a deal, and a place with nobody in it is a vista.
 */
export function shotOf(v: Pick<EventVisual, 'mood' | 'place'>, people: number, pokemon: boolean, kinds: readonly ChoiceKind[]): Shot {
  if (kinds.includes('battle') && (v.mood === 'tense' || kinds.every((k) => k === 'battle'))) return 'clash';
  const deals = kinds.filter((k) => k === 'trade' || k === 'cost').length;
  if (v.place === 'shop' || (kinds.length > 0 && deals * 2 >= kinds.length && deals > 0)) return people || !pokemon ? 'deal' : 'moment';
  if (people) return 'talk';
  return pokemon ? 'moment' : 'vista';
}

// ---------- choices ----------

export type ChoiceIcon = 'battle' | 'catch' | 'trade' | 'coin' | 'dice' | 'leave' | 'care' | 'give' | 'take' | 'talk' | 'look' | 'rest' | 'train' | 'go' | 'pick' | 'star' | 'lock';
/** How the scene leans while a choice is under the cursor. */
export type Tone = 'danger' | 'deal' | 'luck' | 'kind' | 'bold' | 'curious' | 'calm' | 'away' | 'shut';
export interface ChoiceVisual { icon: ChoiceIcon; tone: Tone; /** Odds as a 0–100 meter, or null. */ odds: number | null }

const VERBS: [ChoiceIcon, Tone, RegExp][] = [
  ['leave', 'away', /^["“'(]?(leave|walk away|walk on|decline|refuse|ignore|pass\b|no\b|not now|not today|not my|move on|back away|back off|turn back|keep walking|keep going|say no|skip|never mind|slip away|step away|let it|do nothing|stay out|retire|don['’]t|do not)/i],
  ['battle', 'danger', /\b(fight|battle|challenge|attack|duel|rematch|strike|defend|beat|stop (him|her|them|it)|face (him|her|them|it)|stand your ground|take (him|her|them|it) on)\b/i],
  ['catch', 'bold', /\b(catch|capture|throw (a|the|your) [\w é]*ball)\b/i],
  ['trade', 'deal', /\b(trade|swap|exchange|barter)\b/i],
  ['coin', 'deal', /\b(buy|pay|purchase|bet|wager|donate|spend|tip|bribe|hire|rent)\b|₽/i],
  ['care', 'kind', /\b(heal|help|comfort|feed|pet|hug|tend|rescue|save|protect|share|nurse|calm|soothe|free|carry|shelter|forgive|thank|sing|replant|mend|fix|repair|water|cover)\b/i],
  ['give', 'kind', /\b(give|offer|hand over|hand it|return|lend|gift|bring|show|hold out|point (him|her|them) to|leave (it|them) (a|an|some))\b/i],
  ['take', 'bold', /\b(take|grab|pick up|pick it up|keep|steal|pocket|accept|claim|open|loot|collect|dig|pull|lift|tear|lock|set|move|spin|put)\b/i],
  ['train', 'bold', /\b(train|practice|practise|spar|teach|learn|study|drill)\b/i],
  ['look', 'curious', /\b(look|search|examine|inspect|investigate|read|watch|follow|explore|peek|check|listen|track|scout|find|see|browse|wait and see)\b/i],
  ['rest', 'calm', /\b(rest|sleep|camp|wait|sit|stay|nap|linger|relax|crouch|kneel)\b/i],
  ['go', 'bold', /\b(go|enter|climb|cross|run|jump|dive|sneak|push|press|step|ride|sail|race|charge|head|walk|swim|fly|try|haul|steer|turn|lose them|restart|crack|break|hide|come|stand|back to)\b/i],
  ['talk', 'curious', /\b(ask|talk|tell|say|speak|answer|greet|apologi[sz]e|promise|explain|admit|lie|argue|agree|call|deal)\b|^["“']|\?["”']?$|^(I|I['’]\w+|We|We['’]\w+|You|She|He|They|Why|What|How|Who|Where|When|Yes|Fine|Okay|Sure)\b/i],
];

/** A choice's icon and tone, from what its card shows: its kind, its words, its odds, whether it is locked. */
export function choiceVisual(c: { label: string; kind: ChoiceKind; locked: boolean; chance: number | null }): ChoiceVisual {
  const odds = c.chance === null ? null : Math.round(Math.max(0, Math.min(1, c.chance)) * 100);
  if (c.locked) return { icon: 'lock', tone: 'shut', odds };
  if (c.kind === 'battle') return { icon: 'battle', tone: 'danger', odds };
  if (c.kind === 'trade') return { icon: 'trade', tone: 'deal', odds };
  const verb = VERBS.find(([, , re]) => re.test(c.label));
  if (c.kind === 'cost') return { icon: verb && verb[0] !== 'leave' && verb[1] === 'deal' ? verb[0] : 'coin', tone: 'deal', odds };
  if (verb) return { icon: verb[0], tone: c.kind === 'chance' && verb[1] === 'calm' ? 'luck' : verb[1], odds };
  if (c.kind === 'chance') return { icon: 'dice', tone: 'luck', odds };
  // A thing named, not a deed ("A kite.", "The upper lounge.", "Oran."): the player points at it.
  return /^(an?|the|some|my|your|\w+\.?$)\b/i.test(c.label.trim()) || c.label.trim().split(/\s+/).length <= 3 ? { icon: 'pick', tone: 'curious', odds } : { icon: 'star', tone: 'calm', odds };
}

// ---------- text ----------

export type Voice = 'plain' | 'shout' | 'whisper' | 'trail';
export type Emote = 'exclamation' | 'question' | 'exclaim_question' | 'ellipsis' | 'smile' | 'teardrop' | 'anger' | 'heart' | 'zzz' | 'lightbulb' | 'music_note' | 'nervous_sweat' | 'shocked' | 'hungry' | 'thumbs_up' | 'sparkle' | 'gift' | 'frown' | 'dizzy_spiral';
const EMOTE_WORDS: [Emote, string][] = [
  ['anger', 'angry furious snarl* growl* rage shout* yell* glare*'], ['teardrop', 'cry cries crying tears sob* weep*'], ['smile', 'laugh* smile* grin* chuckle* giggle* beam*'],
  ['heart', 'love loves blush* adore* cuddle* nuzzle*'], ['zzz', 'sleep* yawn* snore* doze* asleep'], ['lightbulb', 'idea realise* realize* remember* understand*'],
  ['music_note', 'sing* hum* song music whistle*'], ['nervous_sweat', 'nervous sweat* gulp* fidget* stammer* tremble*'], ['shocked', 'gasp* startle* shock* scream* jump*'],
  ['hungry', 'hungry stomach starving'], ['thumbs_up', 'thank* bravo congratulations'], ['sparkle', 'sparkle* shine* dazzle*'], ['gift', 'gift present parcel'],
  ['frown', 'sad sigh* frown* sorry'], ['dizzy_spiral', 'dizzy confus* stagger*'],
];
export interface LineVisual { voice: Voice; emote: Emote | null }

/** How one line of text is said, and the mark it puts over whoever says it. */
export function lineVisual(text: string): LineVisual {
  const t = text.trim();
  const loud = /!{2,}|\b[A-Z]{4,}\b/.test(t) || (/!["”']?$/.test(t) && t.length <= 60);
  const hush = /^\(.*\)$/.test(t) || /\bwhisper/i.test(t);
  const trail = /(\.\.\.|…)["”']?$/.test(t);
  const voice: Voice = loud ? 'shout' : hush ? 'whisper' : trail ? 'trail' : 'plain';
  const words = wordsOf(t);
  const said = EMOTE_WORDS.find(([, list]) => hits(words, list) > 0)?.[0] ?? null;
  const emote: Emote | null = said ?? (/\?!|!\?/.test(t) ? 'exclaim_question' : loud ? 'exclamation' : /\?["”']?$/.test(t) ? 'question' : trail ? 'ellipsis' : null);
  return { voice, emote };
}

// ---------- outcomes ----------

export type ChangeKind = 'money' | 'heal' | 'hurt' | 'join' | 'bond' | 'item' | 'learn' | 'trade' | 'evil' | 'stat' | 'note';
export interface ChangeVisual { kind: ChangeKind; good: boolean }
export type Burst = 'battle' | 'gold' | 'heal' | 'hurt' | 'join' | 'bond' | 'gift' | 'fail' | 'none';

const LOSS = /^(−|-|Lost|use |lose |trade away|party loses|lead loses|(party|lead) (poisoned|burned|paralysed|asleep)|Evil|Rage)|\b(lost|loses|fainted|poisoned|burned|paralysed|cursed|pushed back|out of luck)\b/i;

/** One outcome line ("+₽300", "Charisma +2", "Potion ×2", "Pikachu joined the party"): what it is about and whether it is good news. */
export function changeVisual(text: string): ChangeVisual {
  const bad = LOSS.test(text) || /[−-]\d/.test(text.replace(/^[^ ]+ /, ' '));
  const kind: ChangeKind = /₽/.test(text) ? 'money'
    : /^(Evil|Rage|Wanted|Heat|Notoriety)\b/.test(text) ? 'evil'
    : /^Traded\b/i.test(text) ? 'trade'
    : /\b(joined|joins|stays by your side|appears!|came back as|egg\b|hatched)/i.test(text) ? 'join'
    : /\b(learned|now knows)\b/i.test(text) ? 'learn'
    : /\b(heal|healed|restored|recover|recovered|revived|rested|cured)\b/i.test(text) ? 'heal'
    : /\bHP\b|\b(damage|fainted|poisoned|burned|paralysed|asleep|hurt)\b/i.test(text) ? 'hurt'
    : /\b(friendship|bond|trust|affection|loyalty)\b/i.test(text) ? 'bond'
    : /×\d+$|^(Got|You got|Received|Found|Used)\b/i.test(text) ? 'item'
    : /^(.+?) [+−-]\d+%?$|^[+−-]\d+%? /.test(text) ? 'stat'
    : 'note';
  return { kind, good: kind === 'hurt' ? /\bHP \+|\+\d+ HP/.test(text) && !bad : !bad };
}

/** The one big reaction of an outcome: a battle starts, it failed, or the change that matters most. */
export function outcomeBurst(changes: readonly string[], ok: boolean, battle: boolean): Burst {
  if (battle) return 'battle';
  const seen = changes.map(changeVisual);
  const has = (k: ChangeKind, good: boolean): boolean => seen.some((c) => c.kind === k && c.good === good);
  if (has('join', true)) return 'join';
  if (has('hurt', false)) return 'hurt';
  if (!ok) return 'fail';
  if (has('heal', true)) return 'heal';
  if (has('money', true)) return 'gold';
  if (has('bond', true)) return 'bond';
  if (seen.some((c) => c.good && (c.kind === 'item' || c.kind === 'learn' || c.kind === 'stat'))) return 'gift';
  return seen.some((c) => !c.good) ? 'fail' : 'none';
}

// ---------- who the text names ----------

/** Trainer classes the text can name, and the picture that stands for each (asset ids; the screen skips any it lacks). */
const CLASS_ART: [string, string][] = [
  ['hiker hikers', 'trainer.hiker'], ['fisherman fisher angler', 'trainer.fisherman'], ['youngster boy', 'trainer.youngster_m'], ['biker bikers', 'trainer.biker'], ['nurse', 'trainer.pr/doctor_f'],
  ['doctor medic', 'trainer.pr/doctor_m'], ['scientist researcher', 'trainer.pr/scientist_m'], ['officer police policeman', 'trainer.pr/officer'], ['pilot', 'trainer.pr/pilot'],
  ['clerk shopkeeper cashier vendor merchant', 'trainer.pr/clerk_m'], ['waiter waitress', 'trainer.pr/waiter_m'], ['maid', 'trainer.pr/maid'], ['artist painter', 'trainer.pr/artist'], ['baker', 'trainer.pr/baker'],
  ['breeder', 'trainer.pr/breeder_f'], ['ranger', 'trainer.pr/ranger_m'], ['camper', 'trainer.pr/camper_m'], ['backpacker traveller traveler', 'trainer.pr/backpacker_m'], ['cyclist', 'trainer.pr/cyclist_m'],
  ['dancer', 'trainer.pr/dancer'], ['musician guitarist singer', 'trainer.pr/musician'], ['veteran', 'trainer.pr/veteran_m'], ['collector', 'trainer.pr/collector'], ['janitor', 'trainer.pr/janitor'],
  ['swimmer', 'trainer.pr/swimmer_m'], ['diver', 'trainer.pr/scuba_diver_m'], ['twins', 'trainer.pr/twins'], ['worker workers miner', 'trainer.worker_m'], ['firebreather', 'trainer.firebreather'],
  ['psychic medium', 'trainer.psychic_m'], ['reporter interviewer interviewers', 'trainer.pr/interviewers'], ['gentleman', 'trainer.pr/rich_m'], ['lady madame', 'trainer.pr/rich_f'], ['preschooler toddler', 'trainer.pr/preschooler_m'],
  ['schoolkid student pupil', 'trainer.pr/school_kid_m'], ['beauty', 'trainer.pr/beauty_2'], ['blackbelt karate', 'trainer.black_belt_m'], ['birdkeeper', 'trainer.bird_keeper_m'], ['bugcatcher', 'trainer.bug_catcher'],
  ['maniac', 'trainer.pr/ruin_maniac'], ['girl', 'trainer.pr/school_kid_f'], ['couple', 'trainer.pr/young_couple'],
];

/** People the text names by their trade ("a Hiker blocks the path"), as pictures to try, in the order they are named (at most `max`). */
export function castInText(text: string, max = 2): string[] {
  const out: string[] = [];
  for (const w of wordsOf(text)) {
    const id = CLASS_ART.find(([list]) => matcher(list)(w))?.[1];
    if (id && !out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Names the text mentions, from an index of lower-case names to ids (species, items): whole, capitalised words only
 * (so "ditto" in a sentence is not the Pokémon), the longest name first, in the order they appear, at most `max`.
 */
export function namedInText(text: string, index: ReadonlyMap<string, string>, max = 2): string[] {
  const out: string[] = [];
  const tokens = text.match(/[A-ZÀ-Ý][\wÀ-ÿ'’.-]*(?: [A-ZÀ-Ý][\wÀ-ÿ'’.-]*){0,2}/g) ?? [];
  for (const t of tokens) {
    const parts = t.split(' ');
    for (let n = parts.length; n > 0 && out.length < max; n -= 1) {
      let found = false;
      for (let i = 0; i + n <= parts.length; i += 1) {
        // The last word of a name may end a sentence or own something ("Ditto.", "Eevee’s"); "Mr. Mime" keeps its inner dot.
        const id = index.get(parts.slice(i, i + n).join(' ').toLowerCase().replace(/[.,'’-]+$/, '').replace(/[’']s$/, ''));
        if (id && !out.includes(id)) { out.push(id); found = true; }
      }
      if (found) break;
    }
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}
