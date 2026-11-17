// The walkable zones of Greenneedle's safari country: the grid they share, and the two wild zones beyond Safari Land's far gate
// (gn.19 The Deep Savanna, gn.20 The Lush Jungle). A zone is a definition: its areas as tiles, who stands about in it, and its places.
// A place is a tile where one of the zone's story rooms waits; walking onto it opens that room (the event plays exactly as written:
// its choices, fights, rewards and flags), and when it closes you are back on the same tile (zoneEnd.ts, core/minigame/flow.ts).
// Nothing is rolled here: walking costs nothing out past the fence, and every chance is the rooms' own.
// Safari Land (safari.ts) walks the same grid with its own rules on top (steps, Quiet, the tall grass).

import type { BaseState, Cell, MinigameModule, MinigameView } from '../minigame/games';
import type { Facing } from '../hubTown/schema';
import { STEP } from '../hubTown/world';

export const ZONE_W = 15;
export const ZONE_H = 7;
export const FACINGS: readonly Facing[] = ['up', 'left', 'right', 'down'];
export const COMPASS: Record<Facing, string> = { up: 'north', left: 'west', right: 'east', down: 'south' };

// ---------- the grid every zone walks ----------

export interface GridPos {
  area: number;
  x: number;
  y: number;
  facing: Facing;
}

/** The tile of an area's map at a place; off the map is `wall`. */
export const gridTile = (rows: readonly string[] | undefined, x: number, y: number, wall = 'T'): string => rows?.[y]?.[x] ?? wall;

/**
 * Turns to `facing` and walks up to `tiles` that way. `solid` stops you before a tile; `stops` ends the walk on a tile (a path, a spot).
 * Returns how many tiles were walked (0: you only turned).
 */
export function gridStep(p: GridPos, facing: Facing, tiles: number, solid: (x: number, y: number) => boolean, stops: (x: number, y: number) => boolean): number {
  p.facing = facing;
  const d = STEP[facing];
  let moved = 0;
  for (let i = 0; i < tiles; i++) {
    if (solid(p.x + d.dx, p.y + d.dy)) break;
    p.x += d.dx;
    p.y += d.dy;
    moved += 1;
    if (stops(p.x, p.y)) break;
  }
  return moved;
}

/** Into the area beside this one, by the path you took: from the west at the left edge, from the east at the right. */
export function gridEnter(p: GridPos, area: number): void {
  const east = area > p.area;
  p.x = east ? 1 : ZONE_W - 2;
  p.y = 3;
  p.facing = east ? 'right' : 'left';
  p.area = area;
}

/** An area as rows of tiles as the visit sees them, for the screen. */
export const gridRows = (tileAt: (x: number, y: number) => string): string[] =>
  Array.from({ length: ZONE_H }, (_, y) => Array.from({ length: ZONE_W }, (_, x) => tileAt(x, y)).join(''));

// ---------- a wild zone ----------

/** A place on the grid where the story waits. Its tile is a lowercase letter in the area's map. */
export interface ZonePlace {
  id: string;
  /** The letter of its tile. */
  tile: string;
  name: string;
  /** The rooms that happen here (event ids). A room that opens another room of the same place goes straight on; one elsewhere waits at its own tile. */
  events: readonly string[];
  /** Who stands on the tile while the room waits (a species id), and the mark over it. */
  who: string;
  /** A place the story may never open (an oasis, a sleeping Venusaur): while it is closed you walk over it. Any other closed place bars the way. */
  optional?: boolean;
  /** Where it is, for "Look around". */
  hint: string;
}

/** Someone who lives here and stands about (never met, never fought: the fights are the rooms'). `when`: only while that mirrored flag is 1 ('!key': while it is 0). */
export interface ZoneResident {
  area: number;
  x: number;
  y: number;
  species: string;
  facing: Facing;
  when?: string;
}

export interface ZoneDef {
  /** The minigame id. */
  id: string;
  title: string;
  /** The event rooms this zone belongs to open with: the first room, put at its place when the walk starts. */
  first: string;
  areas: readonly { name: string; line: string; rows: readonly string[] }[];
  /** Tiles you cannot walk onto, and what the screen says when you try. */
  solid: Record<string, string>;
  places: readonly ZonePlace[];
  residents: readonly ZoneResident[];
  /** The run flags (`ev:` keys) the walk shows: copied in when it starts and after every room. */
  flags: readonly string[];
  /** A closed place that bars the way. */
  barred: string;
  intro: string;
  help: string;
}

export interface ZoneState extends BaseState, GridPos {
  mode: 'walk';
  /** Tiles walked. */
  walked: number;
  /** The rooms the story has opened that wait at their place: the event and its stop on the map node. */
  open: { eventId: string; sideId: string; place: string }[];
  /** The places whose room has been played. */
  seen: string[];
  /** The place you stepped into (while its rooms play). */
  at: string | null;
  /** Stepped out to a room: its event, where its stop sits on the node (-1 until the run has opened it), the stops already opened. */
  away: { eventId: string; from: number; opened: string[]; side: string } | null;
  /** The zone's flags as last read from the run (water, night, unharmed...). */
  hud: Record<string, number>;
}

const SAVANNA: ZoneDef = {
  id: 'gn-savanna',
  title: 'The Deep Savanna',
  first: 'gn-19-thirsty',
  areas: [
    {
      name: 'The Edge', line: 'The fence stops. The grass is the colour of straw.',
      rows: [
        'RRRRRRRRRRRRRRR',
        'R..,.R..,,R,..R',
        'R.,,.a.,..R.*.R',
        'F....R..*.R...>',
        'R,...R.,,.b...R',
        'R,,..R..,.R.,,R',
        'RRRRRRRRRRRRRRR',
      ],
    },
    {
      name: 'The First Waterhole', line: 'Water, with something very large in the middle of it.',
      rows: [
        'RRRRRRRRRRRRRRR',
        'R.,.R~~~~.R..,R',
        'R...R~~~~.R.*.R',
        '<...c.~~..d...>',
        'R.,.R.....R...R',
        'R,,.R..,,.R.,,R',
        'RRRRRRRRRRRRRRR',
      ],
    },
    {
      name: 'The Night Plain', line: 'The sun goes down fast out here.',
      rows: [
        'RRRRRRRRRRRRRRR',
        'R..R.,R..R..R.R',
        'R..e..R.*R..R.R',
        '<..R..f..g..h.>',
        'R.*R.,R..R.,R.R',
        'R..R..R.,R..R.R',
        'RRRRRRRRRRRRRRR',
      ],
    },
    {
      name: 'The Second Waterhole', line: 'A herd, calling, not moving.',
      rows: [
        'RRRRRRRRRRRRRRR',
        'R.,.R...R~~~R.R',
        'R...R.*.R~~~R.R',
        '<...i...j...k.F',
        'R.,.R...R.,.R.R',
        'R...R.,.R...R.R',
        'RRRRRRRRRRRRRRR',
      ],
    },
  ],
  solid: { R: 'Rock and thorn. No way through.', '~': 'The waterhole. It is somebody\'s.', F: 'The last fence post.', '*': 'It lifts its head, looks at you, and goes back to what it was doing.' },
  places: [
    { id: 'edge', tile: 'a', name: 'The Edge', events: ['gn-19-thirsty'], who: 'sandile', hint: 'Something small is waiting in the gap in the rocks, east of the fence.' },
    { id: 'pit', tile: 'b', name: 'The Sand Pit', events: ['gn-19-cross'], who: 'trapinch', hint: 'A dry stretch to the east, and the sand in it is moving.' },
    { id: 'waterhole', tile: 'c', name: 'The First Waterhole', events: ['gn-19-waterhole'], who: 'hippowdon', hint: 'The first waterhole is just ahead, and it is guarded.' },
    { id: 'watch', tile: 'd', name: 'The Watching Place', events: ['gn-19-watch'], who: 'phanpy', hint: 'A ridge east of the water, over a plain.' },
    { id: 'night', tile: 'e', name: 'Night', events: ['gn-19-herd'], who: 'krokorok', hint: 'It is dark. A herd is crossing ahead, and there are eyes behind it.' },
    { id: 'devil', tile: 'f', name: 'The Dust Devil', events: ['gn-19-devil'], who: 'sandshrew', hint: 'A column of dust stands across the way east.' },
    { id: 'oasis', tile: 'g', name: 'An Oasis', events: ['gn-19-oasis'], who: 'diglett', optional: true, hint: 'Behind the dust: green, and the sound of water.' },
    { id: 'dry', tile: 'h', name: 'The Dry Stretch', events: ['gn-19-on'], who: 'donphan', hint: 'Beyond the dust, a dry stretch, and a herd calling.' },
    { id: 'ring', tile: 'i', name: 'The Wounded Leader', events: ['gn-19-ring', 'gn-19-ring-2', 'gn-19-treat', 'gn-19-guard2', 'gn-19-guard3'], who: 'donphan', hint: 'The herd stands in a ring, just ahead.' },
    { id: 'dawn', tile: 'j', name: 'The Second Waterhole', events: ['gn-19-dawn'], who: 'phanpy', hint: 'First light, and water, to the east.' },
    { id: 'out', tile: 'k', name: 'The Way Out', events: ['gn-19-prize'], who: 'gible', hint: 'The savanna\'s edge, and a fence post.' },
  ],
  residents: [
    { area: 0, x: 12, y: 2, species: 'tauros', facing: 'left' },
    { area: 0, x: 8, y: 3, species: 'cacnea', facing: 'down' },
    { area: 1, x: 12, y: 2, species: 'rhyhorn', facing: 'left' },
    { area: 2, x: 2, y: 4, species: 'sandile', facing: 'right' },
    { area: 2, x: 8, y: 2, species: 'krokorok', facing: 'left' },
    { area: 3, x: 6, y: 2, species: 'phanpy', facing: 'down' },
  ],
  flags: ['savanna-water', 'savanna-night'],
  barred: 'The way on is not open yet. Something behind you is still waiting.',
  intro: 'Past the last fence post. Nobody is counting your steps now.',
  help: 'Walk where you like: nothing out here counts your steps. The story waits where something stands in your way. Every dry crossing costs a flask.',
};

const JUNGLE: ZoneDef = {
  id: 'gn-jungle',
  title: 'The Lush Jungle',
  first: 'gn-20-wall',
  areas: [
    {
      name: 'The Green Wall', line: 'It is darker in here than it should be at noon.',
      rows: [
        'TTTTTTTTTTTTTTT',
        'T.,T,.T.,T..T.T',
        'T,.a..T.*T,.T.T',
        'F..T.,b..T..d.>',
        'T.,T..T.,c..T,T',
        'T..T,.T..T.,T.T',
        'TTTTTTTTTTTTTTT',
      ],
    },
    {
      name: 'The Flooded Trail', line: 'Vines, and then rain like a dropped bucket.',
      rows: [
        'TTTTTTTTTTTTTTT',
        'T.,.T..,.T~~~.T',
        'T...T.*..T~~..T',
        '<..,e....f.g..>',
        'T.,.T.,..T~~,.T',
        'T,..T..,.T~~~.T',
        'TTTTTTTTTTTTTTT',
      ],
    },
    {
      name: 'The Hill That Hums', line: 'The hill is humming.',
      rows: [
        'TTTTTTTTTTTTTTT',
        'T.,.TooooT.,T.T',
        'T...ToSooT..T.T',
        '<.,.hSoSoi..j.>',
        'T...ToooST.*T.T',
        'T,..TooooT,.T.T',
        'TTTTTTTTTTTTTTT',
      ],
    },
    {
      name: 'The Clearing', line: 'A patch of sun, a long way in.',
      rows: [
        'TTTTTTTTTTTTTTT',
        'T.,.T...T..T.TT',
        'T...T.*.T.,m.TT',
        '<...k...l..T.TT',
        'T.,.T...T..n.TT',
        'T...T.,.T.,T.TT',
        'TTTTTTTTTTTTTTT',
      ],
    },
  ],
  solid: { T: 'Leaves, trunks, more leaves. No way through.', '~': 'A river where the path was, fast and brown.', F: 'The end of the fence, already half eaten by leaves.', '*': 'It watches you from where it sits, and does not move.' },
  places: [
    { id: 'wall', tile: 'a', name: 'The Green Wall', events: ['gn-20-wall', 'gn-20-nest'], who: 'bellsprout', hint: 'The fence ends in leaves, just east.' },
    { id: 'bright-1', tile: 'b', name: 'The Bright Path', events: ['gn-20-bright'], who: 'oddish', hint: 'A bright plant leans across the path ahead.' },
    { id: 'bright-2', tile: 'c', name: 'The Bright Path', events: ['gn-20-bright-2'], who: 'gloom', hint: 'A second bright plant, bigger, further east.' },
    { id: 'bright-3', tile: 'd', name: 'The Bright Path', events: ['gn-20-bright-3'], who: 'oddish', hint: 'A whole bank of bright plants, either side of the path.' },
    { id: 'vines', tile: 'e', name: 'The Vine Tangle', events: ['gn-20-vines', 'gn-20-nest-2'], who: 'tangela', hint: 'A vine tangle lies across the path ahead.' },
    { id: 'flooded', tile: 'f', name: 'The Flooded Trail', events: ['gn-20-flooded'], who: 'ledian', hint: 'Rain ahead, and something sheltering under one leaf.' },
    { id: 'river', tile: 'g', name: 'The Storm', events: ['gn-20-river', 'gn-20-longway'], who: 'lotad', hint: 'A river where the path was.' },
    { id: 'hill', tile: 'h', name: 'The Hill That Hums', events: ['gn-20-hill', 'gn-20-nest-4', 'gn-20-pair', 'gn-20-stone1', 'gn-20-stone2', 'gn-20-stone3', 'gn-20-wave1', 'gn-20-wave2', 'gn-20-wave3'], who: 'venonat', hint: 'The hill ahead is humming.' },
    { id: 'roses', tile: 'i', name: 'Two Roselia', events: ['gn-20-roses', 'gn-20-rose-pair'], who: 'roselia', hint: 'On the far side of the hill, a patch of light.' },
    { id: 'river-2', tile: 'j', name: 'The Storm', events: ['gn-20-river2'], who: 'lotad', hint: 'The stream below the hill has burst its banks.' },
    { id: 'clearing', tile: 'k', name: 'The Clearing', events: ['gn-20-clearing', 'gn-20-standoff'], who: 'tsareena', hint: 'A clearing ahead, and something standing on one leg at its edge.' },
    { id: 'heart', tile: 'l', name: 'The Heart', events: ['gn-20-venusaur'], who: 'venusaur', optional: true, hint: 'Under the biggest tree, something very large is asleep.' },
    { id: 'ladder', tile: 'm', name: 'The Ladder', events: ['gn-20-ladder', 'gn-20-tutor', 'gn-20-nestling'], who: 'bounsweet', optional: true, hint: 'A rope ladder has come down out of the leaves, to the north-east.' },
    { id: 'treehouse', tile: 'n', name: 'The Treehouse', events: ['gn-20-treehouse', 'gn-20-treehouse-2'], who: 'foongus', optional: true, hint: 'No ladder. A ruined treehouse, low enough to climb, to the south-east.' },
  ],
  residents: [
    { area: 0, x: 8, y: 2, species: 'spinarak', facing: 'down' },
    { area: 1, x: 6, y: 2, species: 'paras', facing: 'right' },
    { area: 2, x: 11, y: 4, species: 'ariados', facing: 'left' },
    { area: 3, x: 6, y: 2, species: 'bounsweet', facing: 'down', when: 'jungle-entered' },
  ],
  flags: ['jungle-unharmed', 'jungle-entered'],
  barred: 'The leaves have closed over the way on. Something behind you is still waiting.',
  intro: 'You part the leaves. They close behind you.',
  help: 'Walk where you like. The story waits where something stands in your way. Nothing has to faint in here: somewhere above, someone is keeping count.',
};

export const SAVANNA_ID = SAVANNA.id;
export const JUNGLE_ID = JUNGLE.id;
export const ZONES: Readonly<Record<string, ZoneDef>> = { [SAVANNA.id]: SAVANNA, [JUNGLE.id]: JUNGLE };
export const isZone = (id: string | undefined): boolean => Boolean(id && ZONES[id]);
/** The zone whose rooms begin with this event (the door's first room), if any. */
export const zoneOfFirst = (eventId: string): ZoneDef | undefined => Object.values(ZONES).find((z) => z.first === eventId);

export const zonePlaceOf = (def: ZoneDef, eventId: string): ZonePlace | undefined => def.places.find((p) => p.events.includes(eventId));
const placeAt = (def: ZoneDef, ch: string): ZonePlace | undefined => (ch >= 'a' && ch <= 'z' ? def.places.find((p) => p.tile === ch) : undefined);
/** A place as the walk sees it: `open` (its room waits), `done` (played), `closed`. */
export function zonePlaceState(s: ZoneState, p: ZonePlace): 'open' | 'done' | 'closed' {
  if (s.open.some((o) => o.place === p.id)) return 'open';
  return s.seen.includes(p.id) ? 'done' : 'closed';
}

/** The tile at a place as the walk sees it: a place's letter while its room waits, '#' while it bars the way, ground once it is done (or was never opened). */
export function zoneTile(def: ZoneDef, s: ZoneState, x: number, y: number, area = s.area): string {
  const ch = gridTile(def.areas[area]?.rows, x, y, Object.keys(def.solid)[0]);
  const p = placeAt(def, ch);
  if (!p) return ch;
  const st = zonePlaceState(s, p);
  return st === 'open' ? ch : st === 'closed' && !p.optional ? '#' : '.';
}

export const zoneSolid = (def: ZoneDef, s: ZoneState, x: number, y: number): boolean => {
  const ch = zoneTile(def, s, x, y);
  return ch === '#' || ch in def.solid;
};
export const zoneRows = (def: ZoneDef, s: ZoneState): string[] => gridRows((x, y) => zoneTile(def, s, x, y));

/** Who stands about in the area you are in (the residents whose time it is), and who waits at each open place. */
export function zoneStanding(def: ZoneDef, s: ZoneState): { x: number; y: number; species: string; facing: Facing; waits: boolean }[] {
  const out = def.residents
    .filter((r) => r.area === s.area && (!r.when || (r.when.startsWith('!') ? !s.hud[r.when.slice(1)] : Boolean(s.hud[r.when]))))
    .map((r) => ({ x: r.x, y: r.y, species: r.species, facing: r.facing, waits: false }));
  def.areas[s.area]!.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const p = placeAt(def, ch);
    if (p && zonePlaceState(s, p) === 'open') out.push({ x, y, species: p.who, facing: 'left' as Facing, waits: true });
  }));
  return out;
}

/** The place whose room waits, if any (there is one at a time, as the story goes). */
export const zoneNext = (def: ZoneDef, s: ZoneState): ZonePlace | undefined => def.places.find((p) => zonePlaceState(s, p) === 'open');
const areaOfPlace = (def: ZoneDef, p: ZonePlace): number => def.areas.findIndex((a) => a.rows.some((row) => row.includes(p.tile)));

function hudLines(def: ZoneDef, s: ZoneState): string[] {
  if (def.id === SAVANNA_ID) return [`Water: ${s.hud['savanna-water'] ?? 0} of 3 flasks`, s.hud['savanna-night'] ? 'Night' : 'Day'];
  return [`Unharmed: ${s.hud['jungle-unharmed'] ? 'yes' : 'no'}`];
}

function zoneModule(def: ZoneDef): MinigameModule<ZoneState> {
  return {
    start(_c, _p, rs) {
      return { rs, done: false, msg: def.intro, tick: 0, area: 0, x: 1, y: 3, facing: 'right', mode: 'walk', walked: 0, open: [], seen: [], at: null, away: null, hud: {} };
    },
    view(_content, s) {
      const area = def.areas[s.area]!;
      const hud = [area.name, ...hudLines(def, s), `Places: ${s.seen.length}`, s.msg];
      const cells: Cell[] = [];
      for (const f of FACINGS) cells.push({ id: `go:${f}`, label: `Walk ${COMPASS[f]}`, detail: zoneSolid(def, s, s.x + STEP[f].dx, s.y + STEP[f].dy) ? 'something in the way' : 'one tile', tone: 'good', disabled: s.done });
      cells.push({ id: `run:${s.facing}`, label: `Run ${COMPASS[s.facing]}`, detail: 'two tiles', tone: 'info', disabled: s.done });
      cells.push({ id: 'look', label: 'Look around', detail: 'where the story waits', tone: 'info', disabled: s.done });
      return { hud, prompt: def.help, cols: 3, cells, done: s.done } satisfies MinigameView;
    },
    act(_content, s, id) {
      if (s.done || s.away) return;
      if (id === 'look') {
        const next = zoneNext(def, s);
        const there = next ? areaOfPlace(def, next) : s.area;
        s.msg = !next ? 'Nothing is waiting. The way is open.' : there === s.area ? next.hint : `${next.hint} That is ${there > s.area ? 'east' : 'west'} of here, in ${def.areas[there]!.name}.`;
        return;
      }
      if (!id.startsWith('go:') && !id.startsWith('run:')) return;
      const facing = id.slice(id.indexOf(':') + 1) as Facing;
      if (!FACINGS.includes(facing)) return;
      const moved = gridStep(s, facing, id.startsWith('run:') ? 2 : 1, (x, y) => zoneSolid(def, s, x, y), (x, y) => !'.,oS'.includes(zoneTile(def, s, x, y)));
      if (moved === 0) {
        const d = STEP[facing];
        const ahead = zoneTile(def, s, s.x + d.dx, s.y + d.dy);
        s.msg = ahead === '#' ? def.barred : (def.solid[ahead] ?? 'Something in the way.');
        return;
      }
      s.walked += moved;
      s.msg = '';
      const tile = zoneTile(def, s, s.x, s.y);
      if (tile === '>' || tile === '<') {
        gridEnter(s, Math.max(0, Math.min(def.areas.length - 1, s.area + (tile === '>' ? 1 : -1))));
        s.msg = `${def.areas[s.area]!.name}. ${def.areas[s.area]!.line}`;
        return;
      }
      const place = placeAt(def, tile);
      const room = place && s.open.find((o) => o.place === place.id);
      if (place && room) {
        // The room opens (zoneEnd.ts steps the run out to it); the walk waits on this tile.
        s.at = place.id;
        s.away = { eventId: room.eventId, from: -1, opened: [], side: room.sideId };
      }
    },
    result: () => ({ score: 0, max: 1 }),
  };
}

export const ZONE_GAMES: Record<string, MinigameModule<never>> = Object.fromEntries(Object.values(ZONES).map((z) => [z.id, zoneModule(z) as never]));
