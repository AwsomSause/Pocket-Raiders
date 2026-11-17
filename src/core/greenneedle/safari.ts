// Greenneedle gn.18, Safari Land: a walkable zone played as a minigame (the map stop `gn-safari`). 30 Safari Balls, 500 steps, no
// battles. Four areas, each a small grid you walk tile by tile (one step a tile), the Quiet meter (0 to 10), the families, the herds at
// the waterhole, the migration, a rare Dragonair at high Quiet, and three small games inside it: photography, tracking and feeding.
// Every roll is the game's own seeded stream (minigame state `rs`), so a reload or a replay lands the same. What was caught, the nest
// egg, the photo money and the warden's verdict apply once, when it ends. In Kanto the Tauros Stampede and the Warden's Gold Teeth are
// spots inside the park (the visit steps out to the event and comes back: core/minigame/flow.ts); the far gate opens gn.19 and gn.20.

import type { Content } from '../contentSchema';
import { Rng } from '../rng';
import type { RunState } from '../state';
import { isNative, typesPool } from '../themes';
import type { BaseState, MinigameModule, MinigameView, Cell } from '../minigame/games';
import { STEP } from '../hubTown/world';
import type { Facing } from '../hubTown/schema';
import { COMPASS, FACINGS, ZONE_H, ZONE_W, gridEnter, gridRows, gridStep, gridTile } from './zone';

export const SAFARI_ID = 'gn-safari';

export const AREAS = ['The Gatehouse Plain', 'The Waterhole', 'The Long Grass', 'The Far Marsh'] as const;
/** The doc's residents of each area (missing species are skipped). */
const RESIDENTS: readonly (readonly string[])[] = [
  ['tauros', 'ponyta', 'doduo', 'nidoran-f', 'nidoran-m'],
  ['rhyhorn', 'psyduck', 'slowpoke', 'marill'],
  ['scyther', 'pinsir', 'exeggcute', 'venonat', 'paras'],
  ['dratini', 'chansey', 'poliwag', 'wooper'],
];
/** The types each area draws on from the region's own pool. */
const AREA_TYPES: readonly (readonly string[])[] = [['normal', 'ground'], ['water', 'ground'], ['bug', 'grass'], ['water', 'dragon']];
/** 8%: a "star" Pokémon. 2%: one with a regional or Delta form. */
const STARS = ['chansey', 'kangaskhan', 'tauros', 'scyther', 'pinsir', 'dratini', 'dragonair', 'heracross'];
const FORMS = ['ponyta-galar', 'slowpoke-galar', 'exeggutor-alola', 'tauros-paldea-combat', 'wooper-paldea', 'grimer-delta', 'muk-delta', 'marowak-alola', 'raichu-alola'];
const BEHAVIOURS = ['grazing', 'feeding', 'playing', 'sleeping'] as const;
type Behaviour = (typeof BEHAVIOURS)[number];
/** Feeding: what it does, and the food that is right for it. */
const HUNGER = [
  { tell: 'It keeps pawing the ground.', food: 'roots' },
  { tell: 'It keeps looking up into the branches.', food: 'fruit' },
  { tell: 'It keeps sniffing at the water.', food: 'weed' },
] as const;
const PRINTS = ['Three-toed prints', 'Round pads', 'Drag marks'] as const;
/** The nest at the end of the tracks, by area (the Long Grass and the Far Marsh). */
const NEST: Record<number, string> = { 2: 'exeggcute', 3: 'dratini' };

/** Steps: a tile walked or run is one step; standing still is three; the binoculars five; each throw two. */
const STEPS = { tile: 1, wait: 3, look: 5, act: 2, track: 5, lost: 15 } as const;
/** Walking: Quiet +1 for every `quietEvery` tiles walked; something comes out of tall grass on `grass` of the tiles; a run moves `runTiles`. */
const WALK = { quietEvery: 8, grass: 0.18, runGrass: 0.4, waitGrass: 0.3, runTiles: 2, familyAfter: 10 } as const;

/** The Kanto spaces that happen inside the park, and the doors beyond the far gate. */
export const PARK_STAMPEDE = 'cs-kanto-fuchsia-tauros';
export const PARK_TEETH = 'cs-kanto-fuchsia-warden';
export const PARK_DOORS = ['gn-19-far', 'gn-20-far'] as const;

export const PARK_W = ZONE_W;
export const PARK_H = ZONE_H;
/**
 * The four areas as tiles. `.` short grass, `,` tall grass (where Pokémon come out), `T` tree, `R` rock, `~` water, `D` the rock in the marsh
 * (all four solid). `<` `>` the paths to the areas beside it. `G` the gatehouse door, `C` the camera hut, `B` the gatehouse wall,
 * `P` prints in the mud, `F` the far gate, `S` the Stampede (Kanto), `W` the Warden's teeth (Kanto).
 */
const MAPS: readonly (readonly string[])[] = [
  [
    'TTTTTTTTTTTTTTT',
    'TB.C....,,,,..T',
    'T.....,,,,,,..T',
    'G......,,,S...>',
    'T...,,,,......T',
    'T..,,,,,,.....T',
    'TTTTTTTTTTTTTTT',
  ],
  [
    'TTTTTTTTTTTTTTT',
    'T..,,.....,,..T',
    'T.,,.~~~~~.,,.T',
    '<....~~~~~....>',
    'T.,,.~~~~~.,,.T',
    'T..,,.....,,..T',
    'TTTTTTTTTTTTTTT',
  ],
  [
    'TTTTTTTTTTTTTTT',
    'T,,,,,,.,,,,,,T',
    'T,,R,,,.,,,P,,T',
    '<.............>',
    'T,,,,,,.,,R,,,T',
    'T,,,,,,.,,,,,,T',
    'TTTTTTTTTTTTTTT',
  ],
  [
    'TTTTTTTTTTTTTTT',
    'T,,~~..,,,..W.T',
    'T,,~~.,,D,....T',
    '<.............F',
    'T..,,,.~~.,,P.T',
    'T.,,,,.~~.,,,.T',
    'TTTTTTTTTTTTTTT',
  ],
];
const SOLID = 'TR~D';
export type ParkSpot = 'gate' | 'camera' | 'prints' | 'far' | 'stampede' | 'teeth';

interface Encounter {
  species: string;
  catchP: number;
  fleeP: number;
  behaviour: Behaviour;
  noticed: boolean;
  star: boolean;
  /** Won't eat: the HUNGER index, until it is fed (or the wrong food is offered). */
  hungry: number | null;
  fed: boolean;
  dragonair: boolean;
  /** How many tiles off it is (1 to 3): a photograph scores on distance. */
  dist?: number;
  /** Bait is down: leaving it and stepping back raises Quiet. */
  baited?: boolean;
}

/** A photograph: who, what it was doing ('family' and 'migration' are the two set pieces), and its score. */
export interface ParkPhoto {
  species: string;
  kind: string;
  score: number;
}

export interface SafariState extends BaseState {
  area: number;
  steps: number;
  balls: number;
  quiet: number;
  walks: number;
  waits: number;
  mode: 'walk' | 'meet' | 'family' | 'herd' | 'migration' | 'track' | 'nest' | 'spot';
  /** Where you stand in the area's grid, and which way you face. */
  x: number;
  y: number;
  facing: Facing;
  /** Tiles walked (not run) this visit. */
  walked: number;
  /** What you are standing at, while it asks (`mode` 'spot'). */
  spot: ParkSpot | null;
  /** Where the Kangaskhan and its young are, while they cross. */
  fam: { x: number; y: number } | null;
  /** The Kanto spaces inside the park this visit, and the ones already played. */
  kanto: string[];
  seen: string[];
  /** The doors beyond the far gate that are open to you; the one you took. */
  doors: string[];
  door: string | null;
  /** The side stop of the door you took (set when the visit ends; the screen opens it next). */
  doorSide: string | null;
  /** Stepped out to an event inside the park: its id, where its stop sits on the node, the stops already opened, the Safari Balls you owned yourself. */
  away: { eventId: string; from: number; opened: string[]; own: number } | null;
  /** The best photograph of this visit, and the one from an earlier visit that hangs in the gatehouse. */
  photo: ParkPhoto | null;
  wall: ParkPhoto | null;
  /** The last photograph taken (the screen shows it as a picture until you move on). */
  shot: ParkPhoto | null;
  mon: Encounter | null;
  caught: string[];
  /** The region's own residents of each area (set when the game starts; empty in a test without a run). */
  local: string[][];
  camera: boolean;
  shots: number;
  photoBest: number;
  photoMoney: number;
  familySeen: boolean;
  plainWalks: number;
  herd: 'rhyhorn' | 'tauros' | 'none' | null;
  herdWaits: number;
  migration: number;
  migrationSeen: boolean;
  dragonairSeen: boolean;
  /** Binoculars in the Long Grass: the next one met is feeding and hasn't seen you. */
  feedingNext: boolean;
  tracked: boolean;
  track: { print: number; fork: number; right: number[] } | null;
  egg: string | null;
  nestLeft: boolean;
  farGate: boolean;
  /** The warden's running commentary. */
  warden: string;
}

const rng = (s: BaseState) => new Rng(s.rs);
const keep = (s: BaseState, r: Rng) => void (s.rs = r.state);
const clampQ = (n: number) => Math.max(0, Math.min(10, n));
const pct = (p: number) => `${Math.round(p * 100)}%`;
const nameOf = (content: Content, id: string) => content.species.get(id)?.name ?? id;

const WARDEN_WALK = [
  'And here... nothing at all. Marvellous. Nothing is the hardest thing to film.',
  'The trainer walks. Slowly. That\'s it. That\'s all you have to do.',
  'Listen. No. Listen properly.',
];
const WARDEN_RUN = 'The trainer approaches. Slowly. Slower than that. No. Well. There it goes.';
const WARDEN_WAIT = 'Standing still. Good. Most people never learn it.';

function setWarden(s: SafariState, line: string): void {
  s.warden = `Warden: "${line}"`;
}

/** A visit saved before the park had a grid: fill in what it lacks, at the area's way in. */
export function parkState(s: SafariState): SafariState {
  if (s.x === undefined) Object.assign(s, { x: 1, y: 3, facing: 'right', walked: 0, spot: null, fam: null, kanto: [], seen: [], doors: [], door: null, doorSide: null, away: null, photo: null, wall: null, shot: null });
  return s;
}

/** The tile at a place as the visit sees it (a spot that is gone reads as the grass around it). Off the grid is a tree. */
export function parkTile(s: SafariState, x: number, y: number, area = s.area): string {
  const ch = gridTile(MAPS[area], x, y);
  if (ch === 'S') return s.kanto.includes(PARK_STAMPEDE) && !s.seen.includes(PARK_STAMPEDE) ? 'S' : ',';
  if (ch === 'W') return s.kanto.includes(PARK_TEETH) && !s.seen.includes(PARK_TEETH) ? 'W' : '.';
  if (ch === 'P') return s.tracked ? '.' : 'P';
  return ch;
}

export const parkSolid = (s: SafariState, x: number, y: number): boolean => SOLID.includes(parkTile(s, x, y));

/** The area as rows of tiles, for the screen. */
export function parkRows(s: SafariState): string[] {
  return gridRows((x, y) => parkTile(s, x, y));
}

/** Where the Pokémon you met stands: `dist` tiles ahead of you, stopping short of a tree, a rock, the water or the fence. */
export function parkMonAt(s: SafariState): { x: number; y: number } | null {
  if (s.mode !== 'meet' || !s.mon) return null;
  const d = STEP[s.facing];
  let at = { x: s.x, y: s.y };
  for (let i = 1; i <= (s.mon.dist ?? 1); i++) {
    const nx = s.x + d.dx * i, ny = s.y + d.dy * i;
    if (nx < 1 || ny < 1 || nx > PARK_W - 2 || ny > PARK_H - 2) break;
    at = { x: nx, y: ny };
  }
  return at;
}

function poolOf(content: Content, s: SafariState): string[] {
  let own = RESIDENTS[s.area]!.filter((id) => content.species.has(id));
  if (s.area === 1 && s.herd === 'rhyhorn') own = [...own.filter((id) => id !== 'tauros'), 'rhyhorn', 'rhyhorn'];
  if (s.area === 1 && s.herd === 'tauros') own = [...own.filter((id) => id !== 'rhyhorn'), 'tauros', 'tauros', 'tauros'];
  return [...own, ...(s.local[s.area] ?? [])];
}

/** Something comes out of the grass (or doesn't). `unnoticed`: you came quietly. */
function meet(content: Content, s: SafariState, r: Rng, unnoticed: boolean): void {
  let species: string;
  let star = false;
  let dragonair = false;
  if (s.area === 3 && s.quiet >= 8 && !s.dragonairSeen && content.species.has('dragonair')) {
    species = 'dragonair';
    dragonair = true;
    s.dragonairSeen = true;
  } else if (s.migration > 0) {
    s.migration -= 1;
    species = r.pick(RESIDENTS[3]!.filter((id) => content.species.has(id)));
  } else {
    const roll = r.float();
    const stars = STARS.filter((id) => content.species.has(id));
    const forms = FORMS.filter((id) => content.species.has(id));
    if (roll < 0.08 && stars.length) {
      species = r.pick(stars);
      star = true;
    } else if (roll < 0.1 && forms.length) species = r.pick(forms);
    else species = r.pick(poolOf(content, s));
  }
  const behaviour: Behaviour = dragonair ? 'sleeping' : s.feedingNext ? 'feeding' : r.pick([...BEHAVIOURS]);
  const quietBonus = s.quiet >= 8 ? 0.1 : 0;
  const mon: Encounter = {
    species,
    catchP: Math.min(0.95, (dragonair ? 0.25 : star ? 0.15 : 0.3) + quietBonus),
    fleeP: dragonair ? 0.02 : 0.12 + (s.quiet <= 3 ? 0.25 : 0),
    behaviour,
    noticed: !(unnoticed || s.feedingNext || dragonair),
    star,
    hungry: !star && !dragonair && r.chance(0.125) ? r.int(0, HUNGER.length - 1) : null,
    fed: false,
    dragonair,
    dist: dragonair ? 2 : r.int(1, 3),
  };
  s.feedingNext = false;
  // Quiet 0 to 3: Pokémon bolt on sight.
  if (s.quiet <= 3 && !dragonair && r.chance(0.5)) {
    s.msg = `A ${nameOf(content, species)} sees you, and bolts.`;
    setWarden(s, 'Gone. You could hear that one coming from the gate.');
    return;
  }
  s.mon = mon;
  s.mode = 'meet';
  s.msg = dragonair ? 'A Dragonair, asleep on a rock in the marsh. It hasn\'t seen you.' : `A wild ${nameOf(content, species)}${star ? ' (a rare one!)' : ''}, ${behaviour}.`;
  if (dragonair) setWarden(s, 'Oh. Oh, look at that. Nobody sees that. Don\'t breathe.');
}

/** After bait, a rock or a miss: it may wander off. */
function maybeFlee(content: Content, s: SafariState, r: Rng): void {
  if (s.mon && r.chance(s.mon.fleeP)) {
    s.msg = `The ${nameOf(content, s.mon.species)} wandered off.`;
    s.mon = null;
    s.mode = 'walk';
  }
}

function photoScore(s: SafariState): number {
  const m = s.mon!;
  const behaviour = m.behaviour === 'grazing' ? 1 : 2;
  // Distance: right beside it +2, a tile off +1, from far away nothing.
  const distance = Math.max(0, 3 - (m.dist ?? 3));
  return Math.max(1, behaviour + distance + (m.noticed ? 0 : 2) + (s.quiet >= 8 ? 1 : 0) + (m.star || m.dragonair ? 2 : 0));
}

function sellShot(s: SafariState, score: number, species: string, kind: string): void {
  s.shots += 1;
  s.shot = { species, kind, score };
  if (!s.photo || score > s.photo.score) s.photo = { species, kind, score };
  s.photoBest = Math.max(s.photoBest, score);
  if (score >= 3) s.photoMoney += score * 80;
}

function enterArea(s: SafariState, area: number): void {
  // You come in by the path you took: from the west at the left edge, from the east at the right.
  gridEnter(s, area);
  s.mon = null;
  s.mode = 'walk';
  if (area === 1 && s.herd === null) {
    s.mode = 'herd';
    s.msg = 'Two herds at the waterhole: Rhyhorn on one bank, Tauros on the other. Nobody is drinking.';
    setWarden(s, 'A dispute. Wait, and one of them will back down. Throw anything and nobody will.');
  } else if (area === 3 && !s.migrationSeen) {
    s.migrationSeen = true;
    s.mode = 'migration';
    s.msg = 'The ground shakes. A migration is starting, here in the marsh, and it is going to cross the whole park.';
    setWarden(s, 'Once a visit. Once. Look up from the Balls for a minute.');
  } else s.msg = `${AREAS[area]}.`;
}

function finish(s: SafariState): void {
  s.done = true;
  s.mon = null;
}

const PHOTO_WORDS: Record<string, string> = { grazing: 'grazing', feeding: 'feeding', playing: 'playing', sleeping: 'asleep', family: 'with its young out of the pouch', migration: 'on the move with the whole herd' };

/** A photograph in words (the brass plate under it). */
export function photoWords(content: Content, p: ParkPhoto): string {
  return `${nameOf(content, p.species)}, ${PHOTO_WORDS[p.kind] ?? p.kind}`;
}

/** One walk (a tile) or one run (up to two) the way you face. Turning into something solid costs nothing. */
function move(content: Content, s: SafariState, r: Rng, facing: Facing, running: boolean): void {
  const d = STEP[facing];
  // A spot or a path stops you on it.
  const moved = gridStep(s, facing, running ? WALK.runTiles : 1, (x, y) => parkSolid(s, x, y), (x, y) => !'.,'.includes(parkTile(s, x, y)));
  if (moved === 0) {
    const ahead = parkTile(s, s.x + d.dx, s.y + d.dy);
    s.msg = ahead === '~' ? 'Water. Too deep to wade.' : ahead === 'T' ? 'The trees are too thick that way.' : 'A rock in the way.';
    return;
  }
  s.steps -= moved * STEPS.tile;
  if (running) {
    s.quiet = clampQ(s.quiet - 1);
    setWarden(s, WARDEN_RUN);
  } else {
    s.walked += moved;
    s.walks += 1;
    if (s.walked % WALK.quietEvery === 0) s.quiet = clampQ(s.quiet + 1);
    if (s.walked % 4 === 0) setWarden(s, WARDEN_WALK[(s.walked / 4) % WARDEN_WALK.length]!);
    if (s.area === 0) s.plainWalks += 1;
  }
  const tile = parkTile(s, s.x, s.y);
  const ask = (spot: ParkSpot): void => {
    s.mode = 'spot';
    s.spot = spot;
    s.msg = '';
  };
  s.msg = '';
  if (tile === '>') return enterArea(s, Math.min(3, s.area + 1));
  if (tile === '<') return enterArea(s, Math.max(0, s.area - 1));
  if (tile === 'G') return ask('gate');
  if (tile === 'P') return ask('prints');
  if (tile === 'F') return ask('far');
  if (tile === 'S') return ask('stampede');
  if (tile === 'W') return ask('teeth');
  if (tile === 'C') {
    if (!s.camera) return ask('camera');
    s.msg = 'The camera\'s hook is empty. It is round your neck.';
    return;
  }
  if (tile === 'B') {
    s.msg = s.wall
      ? `On the gatehouse wall, in a frame: your photograph. A small brass plate under it: "${photoWords(content, s.wall)}. ${s.wall.score} points."`
      : 'The gatehouse wall. An empty frame, and a small brass plate with nothing on it yet.';
    return;
  }
  // A Kangaskhan and its young cross the plain once a visit, once you have walked a little way into it.
  if (s.area === 0 && !s.familySeen && s.plainWalks >= WALK.familyAfter && content.species.has('kangaskhan')) {
    s.familySeen = true;
    s.mode = 'family';
    const at = [3, -3, 2, -2].map((dx) => s.x + dx).find((x) => x >= 1 && x <= PARK_W - 2 && !parkSolid(s, x, s.y)) ?? s.x;
    s.fam = { x: at, y: s.y };
    s.msg = 'A Kangaskhan and its young are crossing the plain.';
    return;
  }
  if (tile === ',') {
    if (r.chance(running ? WALK.runGrass : WALK.grass)) meet(content, s, r, false);
    else s.msg = 'Nothing. Long grass, moving in the wind.';
  }
}

const safari: MinigameModule<SafariState> = {
  start(_c, p, rs) {
    return {
      rs, done: false, msg: 'The Gatehouse Plain. The grass is long and the sky is very big.', tick: 0,
      x: 1, y: 3, facing: 'right', walked: 0, spot: null, fam: null, kanto: [], seen: [], doors: [], door: null, doorSide: null, away: null, photo: null, wall: null, shot: null,
      area: 0, steps: p.steps ?? 500, balls: p.balls ?? 30, quiet: clampQ(p.quiet ?? 0), walks: 0, waits: 0, mode: 'walk', mon: null, caught: [], local: [[], [], [], []],
      camera: false, shots: 0, photoBest: 0, photoMoney: 0, familySeen: false, plainWalks: 0, herd: null, herdWaits: 0, migration: 0, migrationSeen: false,
      dragonairSeen: false, feedingNext: false, tracked: false, track: null, egg: null, nestLeft: false, farGate: false,
      warden: 'Warden: "And here... the Rhyhorn. Forty stone of bad temper. Watch. It\'s going to do nothing at all. Marvellous."',
    };
  },
  view(content, s) {
    parkState(s);
    const hud = [`${AREAS[s.area]}`, `Steps: ${s.steps}`, `Safari Balls: ${s.balls}`, `Quiet: ${s.quiet}/10`, `Caught: ${s.caught.length}`, s.msg, s.warden];
    const cells: Cell[] = [];
    const c = (id: string, label: string, detail: string, tone: Cell['tone'] = 'info', disabled = false) => cells.push({ id, label, detail, tone, disabled: s.done || disabled });
    let prompt = 'Walk, wait or watch. Quiet rises when you are careful.';
    if (s.mode === 'meet' && s.mon) {
      const m = s.mon;
      prompt = `${nameOf(content, m.species)}: catch ${pct(m.catchP)}, wanders off ${pct(m.fleeP)}.${m.hungry !== null && !m.fed ? ` It won't eat. ${HUNGER[m.hungry]!.tell}` : ''}`;
      c('ball', 'Throw a Ball', `catch ${pct(m.catchP)}`, 'hot', s.balls <= 0);
      c('bait', 'Throw bait', 'easier to catch, likelier to wander off');
      c('rock', 'Throw a rock', 'harder to catch, less likely to leave', 'bad');
      c('leave', 'Leave', m.baited ? 'leave the bait and step back: Quiet +1' : 'let it be', 'dim');
      if ((m.dist ?? 1) > 1) c('closer', 'Step closer', `${m.dist! - 1} ${m.dist === 2 ? 'tile' : 'tiles'} off after; it may look up`, 'info');
      if (s.camera) c('photo', 'Take a photo', `${m.noticed ? 'it has seen you' : 'it hasn\'t seen you'}; ${photoScore(s)} points from here`, 'good');
      if (m.hungry !== null && !m.fed) for (const food of ['roots', 'fruit', 'weed']) c(`feed:${food}`, `Offer ${food}`, 'pick from how it behaves', 'good');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'family') {
      prompt = 'A Kangaskhan and its young cross the plain. The young one is out of the pouch.';
      c('ball', 'Throw a Ball', 'Not while the young one\'s out of the pouch', 'dim', true);
      c('watch', 'Watch', 'Quiet +1', 'good');
      c('closer', 'Step closer', 'Quiet -2', 'bad');
      if (s.camera) c('photo', 'Take a photo', 'the young one, out of the pouch', 'hot');
      c('leave', 'Walk on', 'let them pass', 'dim');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'herd') {
      prompt = `Rhyhorn on one bank, Tauros on the other. Waited: ${s.herdWaits} of 3.`;
      c('wait', 'Wait', 'three steps, no throwing', 'good');
      c('rock', 'Throw a rock', 'Quiet -1', 'bad');
      c('leave', 'Walk on', 'leave them to it', 'dim');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'migration') {
      prompt = 'The migration crosses the marsh and heads for the plain.';
      c('watch', 'Watch', 'Quiet +1', 'good');
      if (s.camera) c('photo', 'Take a photo', 'the whole herd, on the move', 'hot');
      c('leave', 'Walk on', 'they will be all over the park for a while', 'dim');
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'track' && s.track) {
      prompt = `You are following ${PRINTS[s.track.print]!.toLowerCase()}. A fork (${s.track.fork + 1} of 2): which prints go on?`;
      PRINTS.forEach((label, i) => c(`print:${i}`, label, `${STEPS.track} steps`));
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    if (s.mode === 'nest') {
      prompt = `A nest, hidden in the ${s.area === 2 ? 'long grass' : 'reeds'}. An egg in it, warm.`;
      c('take', 'Take an egg', 'it hatches later', 'hot');
      c('leaveNest', 'Leave it', 'Quiet +2; the warden notices', 'good');
      return { hud, prompt, cols: 2, cells, done: s.done };
    }
    if (s.mode === 'spot' && s.spot) {
      const stay = (label = 'Not now') => c('stay', label, 'carry on round the park', 'dim');
      if (s.spot === 'gate') {
        prompt = 'The gatehouse door. The warden is on the other side of it, pretending not to count.';
        c('exit', 'Leave the park', 'end the visit', 'hot');
        stay('Stay a while');
      } else if (s.spot === 'camera') {
        prompt = 'The gatehouse camera, on a hook by the door. The warden buys good shots: distance, behaviour, and whether it saw you.';
        c('camera', 'Borrow the camera', 'the warden buys good shots', 'hot');
        stay();
      } else if (s.spot === 'prints') {
        prompt = 'Prints in the mud, going off into the grass.';
        c('track', 'Follow the prints', 'to a nest, across two forks', 'info');
        stay('Leave them');
      } else if (s.spot === 'far') {
        prompt = 'At the far gate. Warden: "Beyond here, it isn\'t a park. Nobody\'s counting your steps. Nobody\'s coming to fetch you, either."';
        for (const id of s.doors) c(`door:${id}`, content.events.get(id)?.name ?? id, 'the visit ends; you go through', 'hot');
        stay('Turn back');
      } else if (s.spot === 'stampede') {
        prompt = 'The ground hums. Out on the plain, the horizon is the wrong colour, and it is getting closer.';
        c('see', 'Stand and watch it come', 'the Tauros Stampede', 'hot');
        stay('Step out of the way');
      } else {
        prompt = 'The warden is here, off his usual path, talking. Nobody could understand a word of it.';
        c('see', 'Hear him out', 'the Warden\'s Gold Teeth', 'hot');
        stay('Leave him to it');
      }
      return { hud, prompt, cols: 3, cells, done: s.done };
    }
    prompt = 'Walk the park a tile at a time. Tall grass is where they are. Quiet rises when you are careful.';
    for (const f of FACINGS) c(`go:${f}`, `Walk ${COMPASS[f]}`, parkSolid(s, s.x + STEP[f].dx, s.y + STEP[f].dy) ? 'something in the way' : `${STEPS.tile} step`, 'good');
    c(`run:${s.facing}`, `Run ${COMPASS[s.facing]}`, `${WALK.runTiles} tiles; Quiet -1`, 'bad');
    c('wait', 'Wait', `${STEPS.wait} steps; Quiet +1`, 'good');
    c('look', 'Use the binoculars', `${STEPS.look} steps; Quiet +1`, 'info');
    c('exit', 'Head for the gate', 'end the visit', 'dim');
    return { hud, prompt, cols: 4, cells, done: s.done } satisfies MinigameView;
  },
  act(content, s, id) {
    parkState(s);
    if (s.done || s.away) return;
    const r = rng(s);
    s.shot = null;
    if (s.mode === 'meet' && s.mon) {
      const m = s.mon;
      s.steps -= id === 'closer' ? STEPS.tile : STEPS.act;
      if (id === 'ball' && s.balls > 0) {
        s.balls -= 1;
        if (r.chance(m.catchP)) {
          s.caught.push(m.species);
          s.msg = `Caught! ${nameOf(content, m.species)} is yours.`;
          setWarden(s, m.dragonair ? 'Well. I didn\'t think I\'d live to see that.' : 'And that, for the record, is how it\'s done.');
          s.mon = null;
          s.mode = 'walk';
        } else {
          s.quiet = clampQ(s.quiet - 1);
          s.msg = 'It broke free!';
          maybeFlee(content, s, r);
        }
      } else if (id === 'bait') {
        m.catchP = Math.min(0.95, m.catchP + 0.15);
        m.fleeP = Math.min(0.9, m.fleeP + 0.1);
        m.baited = true;
        s.msg = 'It eats the bait, and looks about for more.';
        maybeFlee(content, s, r);
      } else if (id === 'rock') {
        m.catchP = Math.max(0.05, m.catchP - 0.1);
        m.fleeP = Math.max(0.02, m.fleeP - 0.1);
        s.quiet = clampQ(s.quiet - 1);
        s.msg = 'It glares at you and digs in.';
        setWarden(s, 'A rock. In my park.');
        maybeFlee(content, s, r);
      } else if (id === 'photo' && s.camera) {
        const score = photoScore(s);
        sellShot(s, score, m.species, m.behaviour);
        s.msg = `Click. A ${score}-point shot${score >= 3 ? ' the warden will buy' : ''}.`;
        m.noticed = true;
        m.fleeP = Math.min(0.9, m.fleeP + 0.05);
        maybeFlee(content, s, r);
      } else if (id.startsWith('feed:') && m.hungry !== null && !m.fed) {
        const right = id === `feed:${HUNGER[m.hungry]!.food}`;
        m.fed = true;
        if (right && s.quiet >= 8) {
          s.caught.push(m.species);
          s.msg = `It eats from your hand, then simply follows you. ${nameOf(content, m.species)} will walk with you to the gate.`;
          s.mon = null;
          s.mode = 'walk';
        } else if (right) {
          m.catchP = Math.min(0.95, m.catchP * 2);
          s.msg = 'It eats. It looks at you differently now. Its catch chance doubles.';
        } else {
          m.fleeP = Math.min(0.9, m.fleeP + 0.1);
          s.msg = 'It turns its nose up.';
          maybeFlee(content, s, r);
        }
      } else if (id === 'closer' && (m.dist ?? 1) > 1) {
        m.dist = m.dist! - 1;
        // Coming closer: it may look up (less often when the park has forgotten you).
        if (!m.noticed && !m.dragonair && r.chance(s.quiet >= 8 ? 0.2 : 0.5)) {
          m.noticed = true;
          s.msg = 'You step closer. It looks up.';
        } else s.msg = m.noticed ? 'You step closer. It watches you come.' : 'You step closer. It hasn\'t seen you.';
      } else if (id === 'leave') {
        if (m.baited) {
          s.quiet = clampQ(s.quiet + 1);
          s.msg = 'You leave the bait where it is and step back.';
        } else s.msg = 'You leave it be.';
        s.mon = null;
        s.mode = 'walk';
      }
    } else if (s.mode === 'family') {
      s.steps -= STEPS.wait;
      if (id === 'watch') {
        s.quiet = clampQ(s.quiet + 1);
        s.msg = 'The young one tumbles out, climbs back in, tumbles out again.';
        setWarden(s, 'Nobody throws anything at a family. Not in my park.');
      } else if (id === 'closer') {
        s.quiet = clampQ(s.quiet - 2);
        // Within one tile of the family.
        if (s.fam) {
          const dx = Math.sign(s.fam.x - s.x), dy = dx === 0 ? Math.sign(s.fam.y - s.y) : 0;
          while (Math.abs(s.fam.x - s.x) + Math.abs(s.fam.y - s.y) > 1 && !parkSolid(s, s.x + dx, s.y + dy)) {
            s.x += dx;
            s.y += dy;
          }
        }
        s.msg = 'The mother turns and stares you down. They hurry on.';
        s.mode = 'walk';
        s.fam = null;
      } else if (id === 'photo' && s.camera) {
        sellShot(s, 10, 'kangaskhan', 'family');
        s.msg = 'Click. The young one, out of the pouch, looking straight at its mother. A 10-point shot.';
        setWarden(s, 'That one goes on the wall.');
      } else if (id === 'leave') {
        s.msg = 'They pass. The grass closes behind them.';
        s.mode = 'walk';
        s.fam = null;
      }
    } else if (s.mode === 'herd') {
      s.steps -= STEPS.wait;
      if (id === 'wait') {
        s.herdWaits += 1;
        s.quiet = clampQ(s.quiet + 1);
        if (s.herdWaits >= 3) {
          s.herd = r.chance(0.5) ? 'rhyhorn' : 'tauros';
          s.msg = s.herd === 'rhyhorn' ? 'The Tauros back down and wander off. The Rhyhorn drink.' : 'The Rhyhorn grumble and turn away. The Tauros wade in.';
          setWarden(s, 'There. Patience. The waterhole decides who drinks.');
          s.mode = 'walk';
        } else s.msg = 'Nobody moves. You don\'t either.';
      } else {
        s.herd = 'none';
        if (id === 'rock') s.quiet = clampQ(s.quiet - 1);
        s.msg = 'Both herds scatter. Nobody drinks today.';
        s.mode = 'walk';
      }
    } else if (s.mode === 'migration') {
      s.steps -= STEPS.wait;
      s.migration = 3;
      if (id === 'watch') {
        s.quiet = clampQ(s.quiet + 1);
        s.msg = 'They go past for a long time. You stop counting.';
      } else if (id === 'photo' && s.camera) {
        sellShot(s, 6, RESIDENTS[3]!.find((x) => content.species.has(x)) ?? 'dratini', 'migration');
        s.msg = 'Click. The whole herd, on the move. A 6-point shot.';
      } else s.msg = 'You walk on. Behind you, the marsh is emptying.';
      s.mode = 'walk';
    } else if (s.mode === 'track' && s.track && id.startsWith('print:')) {
      s.steps -= STEPS.track;
      const t = s.track;
      if (Number(id.slice(6)) === t.right[t.fork]) {
        t.fork += 1;
        if (t.fork >= 2) {
          s.mode = 'nest';
          s.track = null;
          s.msg = 'The prints end at a nest.';
        } else s.msg = 'The prints go on.';
      } else {
        s.steps -= STEPS.lost;
        s.track = null;
        s.mode = 'walk';
        s.msg = 'The prints peter out. You\'ve lost the trail.';
      }
    } else if (s.mode === 'nest') {
      s.steps -= STEPS.act;
      if (id === 'take') {
        s.egg = NEST[s.area] ?? 'exeggcute';
        s.msg = 'You take one egg, carefully, and leave the rest.';
      } else {
        s.nestLeft = true;
        s.quiet = clampQ(s.quiet + 2);
        s.msg = 'You leave it. You back away the way you came.';
        setWarden(s, 'I saw that. I won\'t say anything. I saw it, though.');
      }
      s.mode = 'walk';
    } else if (s.mode === 'spot' && s.spot) {
      const spot = s.spot;
      s.spot = null;
      s.mode = 'walk';
      if (id === 'exit' && spot === 'gate') {
        s.steps -= 1;
        finish(s);
      } else if (id === 'camera' && spot === 'camera') {
        s.camera = true;
        s.steps -= 1;
        s.msg = 'The gatehouse camera. The warden buys good shots: distance, behaviour, and whether it saw you.';
      } else if (id === 'track' && spot === 'prints') {
        s.steps -= STEPS.track;
        s.tracked = true;
        s.mode = 'track';
        s.track = { print: r.int(0, PRINTS.length - 1), fork: 0, right: [] };
        // The trail you started on is the trail that goes on.
        s.track.right = [s.track.print, s.track.print];
        s.msg = `You find ${PRINTS[s.track.print]!.toLowerCase()} in the mud and follow them.`;
      } else if (id.startsWith('door:') && spot === 'far' && s.doors.includes(id.slice(5))) {
        s.door = id.slice(5);
        s.farGate = true;
        s.msg = 'At the far gate.';
        setWarden(s, 'Beyond here, it isn\'t a park. Nobody\'s counting your steps. Nobody\'s coming to fetch you, either.');
        finish(s);
      } else if (id === 'see' && (spot === 'stampede' || spot === 'teeth')) {
        // The visit steps out to the event (core/minigame/flow.ts) and comes back to this tile.
        s.away = { eventId: spot === 'stampede' ? PARK_STAMPEDE : PARK_TEETH, from: -1, opened: [], own: 0 };
        s.msg = '';
      } else s.msg = spot === 'far' ? 'You turn back from the gate.' : 'You walk on.';
    } else if (id.startsWith('go:') || id.startsWith('run:')) {
      const facing = id.slice(id.indexOf(':') + 1) as Facing;
      if (FACINGS.includes(facing)) move(content, s, r, facing, id.startsWith('run:'));
    } else {
      switch (id) {
        case 'wait':
          s.steps -= STEPS.wait;
          s.waits += 1;
          s.quiet = clampQ(s.quiet + 1);
          setWarden(s, WARDEN_WAIT);
          if (parkTile(s, s.x, s.y) === ',' && r.chance(WALK.waitGrass)) meet(content, s, r, true);
          else s.msg = 'You stand still. The park forgets you\'re there.';
          break;
        case 'look':
          s.steps -= STEPS.look;
          s.quiet = clampQ(s.quiet + 1);
          if (s.area === 2) {
            s.feedingNext = true;
            s.msg = 'From far off: a Scyther sharpening its blades on a stone. It only does it when nobody\'s close.';
          } else if (s.area === 3) s.msg = 'Through the binoculars: reeds pressed flat in a ring. A nest, somewhere in there.';
          else if (s.area === 1) s.msg = 'Through the binoculars: a Psyduck holding its head, at the edge of the water.';
          else s.msg = 'Through the binoculars: grazers, all facing the same way, into the wind.';
          break;
        case 'exit':
          s.steps -= 1;
          finish(s);
          break;
        default:
          break;
      }
    }
    keep(s, r);
    if (s.steps <= 0) {
      s.steps = 0;
      s.msg = 'Out of steps. The warden is waiting for you at the gate.';
      finish(s);
    }
  },
  result: (s) => ({ score: Math.min(30, s.caught.length), max: 30 }),
};

export const SAFARI_GAMES: Record<string, MinigameModule<never>> = { [SAFARI_ID]: safari as never };

/** The region's own residents for each area: up to four native species of the area's types, drawn by the game's stream. */
export function safariLocal(content: Content, run: Pick<RunState, 'regionOrder' | 'regionIndex'>, r: Rng): string[][] {
  const regionId = run.regionOrder[run.regionIndex];
  return AREA_TYPES.map((types, area) => {
    const own = new Set(RESIDENTS[area]);
    const native = typesPool(content, types as never, regionId)
      .filter((p) => !own.has(p.speciesId) && content.species.has(p.speciesId) && isNative(content, content.species.get(p.speciesId)!, regionId))
      .map((p) => p.speciesId)
      .sort();
    return r.shuffle(native).slice(0, 4);
  });
}

/** The warden's verdict by the Quiet you ended on. */
export function wardenVerdict(quiet: number): string {
  if (quiet >= 8) return 'Warden: "You were barely here. That\'s the highest thing I know how to say." A second visit, free, any time this region.';
  if (quiet >= 4) return 'Warden: "Fair enough."';
  return 'Warden: "The Rhyhorn\'s going to be upset for a week." The entry fee is ₽800 next time.';
}
