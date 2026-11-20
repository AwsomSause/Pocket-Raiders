import { describe, expect, it } from 'vitest';
import { HUB_TOWN, POCKET_TOWN } from '../../src/core/hubTown/schema';
import { districtAt, districtOf, placeById, placesIn } from '../../src/core/hubTown/world';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { createProfile } from '../../src/core/profile';
import { TOWN, townOf } from '../../src/core/town';
import { buildingReady, readyLine, townDirectory } from '../../src/core/town/directory';
import { pageOf } from '../../src/ui/phantom/kit';
import { clip, mapRuns, phPlace, phPocket, phTownMap, POCKET_COLS, POCKET_ROWS, type PlaceModel, type PocketModel, type TownMapModel } from '../../src/ui/phantom/screens/townmap';
import { content } from './helpers';

const PH = PHANTOM_VERSIONS[0]!;
const NOON = new Date(2026, 10, 20, 12, 0, 0);

describe('Hub Town: which district a place is in', () => {
  it('every place has a district, and every place is listed once', () => {
    const all = HUB_TOWN.districts.flatMap((d) => placesIn(d.id));
    expect(all).toHaveLength(HUB_TOWN.places.length);
    expect(new Set(all.map((p) => p.id)).size).toBe(HUB_TOWN.places.length);
    for (const pl of HUB_TOWN.places) expect(districtOf(pl)).not.toBeNull();
  });

  it('a door inside a district is in it; a door on the edge takes the nearest one', () => {
    expect(districtOf(placeById('arena')!)?.name).toBe("Champions' Row");
    expect(placesIn('north').map((p) => p.id)).toEqual(['achievements', 'dojo', 'arena', 'memories', 'events', 'pocket']);
    // The Departure Gate stands on the south edge, outside every district's rectangle.
    const gate = placeById('gate')!;
    expect(districtAt(gate.door)).toBeNull();
    expect(districtOf(gate)?.id).toBe('south');
    expect(placesIn('south').map((p) => p.id)).toContain('gate');
    // The market square has no door of its own.
    expect(placesIn('plaza')).toEqual([]);
    expect(placesIn('nowhere')).toEqual([]);
  });
});

describe('Pocket Town: the directory by hamlet', () => {
  const fresh = createProfile(content, 'p');

  it('lists every building that is shown, once, under the hamlet its door is in', () => {
    const dir = townDirectory(content, fresh, NOON);
    const shown = TOWN.buildings.filter((b) => !b.hidden);
    expect(dir.hamlets.reduce((n, h) => n + h.places.length, 0)).toBe(shown.length);
    expect(dir.hamlets.map((h) => h.name)).toEqual(POCKET_TOWN.districts.map((d) => d.name));
    expect(dir.hamlets.every((h) => h.places.length > 0)).toBe(true);
    // A hidden building stays out until it opens.
    const hidden = TOWN.buildings.filter((b) => b.hidden).map((b) => b.id);
    expect(hidden.length).toBeGreaterThan(0);
    expect(dir.hamlets.flatMap((h) => h.places.map((p) => p.id)).some((id) => hidden.includes(id))).toBe(false);
  });

  it('"ready" means a once-a-day or once-a-run thing is still open; done for the day is not ready', () => {
    const b = TOWN.buildings.find((x) => !x.hidden && x.actions.some((a) => a.limit === 'day' && a.kind !== 'quiz' && a.kind !== 'gacha' && !a.cost && !a.needs) && x.actions.filter((a) => a.limit === 'day' || a.limit === 'run').length === 1)!;
    expect(b).toBeTruthy();
    expect(buildingReady(content, fresh, b, NOON)).toBe(true);
    expect(townDirectory(content, fresh, NOON).ready).toContain(b.name);
    const action = b.actions.find((a) => a.limit === 'day')!;
    const t = townOf(fresh);
    const day = `${NOON.getFullYear()}-${String(NOON.getMonth() + 1).padStart(2, '0')}-${String(NOON.getDate()).padStart(2, '0')}`;
    const done = { ...fresh, town: { ...t, daily: { ...t.daily, [action.id]: day } } };
    expect(buildingReady(content, done, b, NOON)).toBe(false);
    const dir = townDirectory(content, done, NOON);
    expect(dir.ready).not.toContain(b.name);
    expect(dir.hamlets.flatMap((h) => h.places).find((p) => p.id === b.id)?.tag).toBeNull();
  });

  it('a building with nothing limited is never "ready"', () => {
    const plain = TOWN.buildings.find((x) => !x.hidden && x.actions.every((a) => a.limit !== 'day' && a.limit !== 'run'))!;
    expect(plain).toBeTruthy();
    expect(buildingReady(content, fresh, plain, NOON)).toBe(false);
  });

  it('says what is ready in one line', () => {
    expect(readyLine([])).toBe('Nothing is waiting on you today. Every door is still open for a visit.');
    expect(readyLine(['Garden'])).toBe('One thing is ready: the Garden.');
    expect(readyLine(['Garden', 'Bakery'])).toBe('2 things are ready: the Garden and the Bakery.');
    expect(readyLine(['Garden', 'Berry Orchard', 'Bakery'])).toBe('3 things are ready: the Garden, the Berry Orchard and the Bakery.');
    expect(readyLine(['A', 'B', 'C', 'D', 'E'])).toBe('5 things are ready: the A, the B and the C and 2 more.');
  });
});

describe('Phantom UI: the Town Map page', () => {
  const model = (over: Partial<TownMapModel> = {}): TownMapModel => ({
    town: 'Hub Town', when: 'Evening, lamps on', size: [6, 4],
    rows: ['TT..##', '==..##', '~~oo..', '......'],
    districts: [{ name: 'Market Green', color: '#e8c070', rect: [0, 2, 6, 2] }, { name: "Champions' Row", color: '#e07060', rect: [0, 0, 6, 2] }],
    district: 1, blurb: 'Arena, Memories, Achievements',
    places: [{ name: 'Achievement Hall', small: 'Trophies and milestones', x: 4, y: 1 }, { name: 'Competitive Arena', small: 'Trainers, unlocks, rival records, League intel', x: 5, y: 1 }],
    place: 1, pins: [{ x: 1, y: 3 }], you: null, walk: 'Walk instead', ...over,
  });

  it('turns the map into runs of tiles along each row, leaving the grass out', () => {
    expect(mapRuns(['TT..##', '==..##', '~~oo..', '......'])).toEqual([
      { cls: 'mt', x: 0, y: 0, w: 2 }, { cls: 'mb', x: 4, y: 0, w: 2 },
      { cls: 'mp', x: 0, y: 1, w: 2 }, { cls: 'mb', x: 4, y: 1, w: 2 },
      { cls: 'mw', x: 0, y: 2, w: 2 }, { cls: 'mo', x: 2, y: 2, w: 2 },
    ]);
    expect(mapRuns([])).toEqual([]);
    expect(mapRuns(['....'])).toEqual([]);
  });

  it('draws the districts, the lit one, its numbered places and the other doors', () => {
    const html = phTownMap(PH, model());
    expect(pageOf(html)).toBe('town');
    expect(html).toContain('Hub Town · Evening, lamps on');
    expect(html).toContain('viewBox="0 0 6 4"');
    expect(html.match(/class="hm-z/g)).toHaveLength(2);
    expect(html.match(/class="hm-z on"/g)).toHaveLength(1);
    expect(html.match(/class="pin n/g)).toHaveLength(2);
    expect(html.match(/class="pin"/g)).toHaveLength(1);
    // The lit place carries its name on the map and "go there" in the list; a door is drawn at the middle of its tile.
    expect(html).toContain('<u>Competitive Arena</u>');
    expect(html.match(/GO THERE/g)).toHaveLength(1);
    expect(html).toContain('left:91.67%;top:37.5%');
    expect(html).toContain('<i style="background:#e07060"></i>Champions&#39; Row');
    expect(html).toContain('data-act="mapPlace" data-arg="0" data-over="mapOver"');
    expect(html).toContain('Walk instead');
    expect(html).not.toContain('hm-you');
    expect(html).not.toContain('ph-hl many');
  });

  it('shows where you stand on foot, an empty district, and tightens a long list', () => {
    const foot = phTownMap(PH, model({ you: { x: 2, y: 2, file: null }, walk: 'Keep walking' }));
    expect(foot).toContain('class="hm-you" style="left:41.67%;top:62.5%"');
    expect(foot).toContain('Keep walking');
    const empty = phTownMap(PH, model({ places: [], place: 0 }));
    expect(empty).toContain('Open ground');
    expect(empty).not.toContain('GO THERE');
    const many = phTownMap(PH, model({ places: Array.from({ length: 7 }, (_, i) => ({ name: `Place ${i}`, small: 's', x: i % 6, y: 0 })), place: 0 }));
    expect(many).toContain('ph-hl many');
    expect(many.match(/class="hl-i pn/g)).toHaveLength(7);
  });

  it('keeps a long line to one line, cut at a word', () => {
    expect(clip('short', 20)).toBe('short');
    expect(clip('Every past Trainer, their Aces, the Hall of Fame and the stories', 42)).toBe('Every past Trainer, their Aces, the Hall…');
    expect(clip('Every past Trainer, their Aces, the Hall of Fame', 42).length).toBeLessThanOrEqual(42);
    expect(clip('Supercalifragilisticexpialidocious', 10)).toBe('Supercali…');
    const html = phTownMap(PH, model({ places: [{ name: 'Hall', small: 'Every past Trainer, their Aces, the Hall of Fame and the stories NPCs remember', x: 1, y: 1 }], place: 0 }));
    expect(html).toContain('<span>Every past Trainer, their Aces, the Hall…</span>');
  });
});

describe('Phantom UI: a place and its rooms', () => {
  const model = (over: Partial<PlaceModel> = {}): PlaceModel => ({
    town: 'Hub Town', district: "Champions' Row", name: 'Competitive Arena',
    rooms: [{ label: 'Trainer Archive', small: '5/287 unlocked' }, { label: 'Intelligence Board', small: 'Intel level 0 of 3' }],
    index: 0, who: 'Arena steward', say: 'Trainers, their unlocks, rival records and League intel.', bust: null,
    preview: { label: 'Trainer Archive · 5/287 unlocked', text: 'Every trainer, what they change, and how to unlock them.', people: [] },
    backdrop: null, back: 'Back to town', ...over,
  });

  it('draws the rooms as blades with the keeper and what the lit room holds', () => {
    const html = phPlace(PH, model());
    expect(pageOf(html)).toBe('place');
    expect(html).toContain('Hub Town · Champions&#39; Row');
    expect(html.match(/class="blade/g)).toHaveLength(2);
    expect(html.match(/class="blade on"/g)).toHaveLength(1);
    expect(html).toContain('<small>5/287 unlocked</small>');
    expect(html).toContain('<span class="lab">Arena steward</span>');
    expect(html).toContain('<span class="lab">Trainer Archive · 5/287 unlocked</span>');
    expect(html).toContain('data-act="roomPick" data-arg="1" data-over="roomOver"');
    expect(html).toContain('Back to town');
    expect(html).not.toContain('pl-tr');
    expect(html).toContain('class="bgk"');
  });

  it('shows the people of a room, a menu with no district, a backdrop, and tightens a long list', () => {
    const people = [1, 2, 3, 4, 5, 6].map((n) => ({ art: null, name: `T${n}`, small: `${n} runs`, on: n === 2 }));
    const html = phPlace(PH, model({ district: '', backdrop: 'packs/memories/eventbg/indoor.png', preview: { label: 'Trainers', text: 't', people } }));
    expect(html).toContain('<small>Hub Town</small>');
    expect(html).toContain('eventbg/indoor.png');
    // Five at most, the lit one marked.
    expect(html.match(/class="ph-pl-q"/g)).toHaveLength(5);
    expect(html.match(/<div class="on">/g)).toHaveLength(1);
    const rooms = (n: number) => Array.from({ length: n }, (_, i) => ({ label: `Room ${i}`, small: '' }));
    expect(phPlace(PH, model({ rooms: rooms(5) }))).toContain('class="pl-rooms ph-pl-rooms"');
    expect(phPlace(PH, model({ rooms: rooms(6) }))).toContain('ph-pl-rooms sm');
    expect(phPlace(PH, model({ rooms: rooms(11) }))).toContain('ph-pl-rooms xs');
    expect(phPlace(PH, model({ say: '' }))).not.toContain('pl-say');
  });
});

describe('Phantom UI: the Pocket Town directory', () => {
  const places = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Place ${i}`, text: 'What it is.', tag: i === 0 ? 'READY' : '', off: i === 2 }));
  const model = (over: Partial<PocketModel> = {}): PocketModel => ({
    town: 'Pocket Town', hamlets: [{ name: 'Training Grounds', count: 12 }, { name: 'Fountain Glade', count: 1 }], hamlet: 0,
    places: places(12), place: 1, today: 'One thing is ready: the Place 0.', hub: true, ...over,
  });

  it('draws the hamlets, a page of places with what is ready, and today', () => {
    const html = phPocket(PH, model());
    expect(pageOf(html)).toBe('pocket');
    expect(html).toContain('Pocket Town · Training Grounds');
    expect(html.match(/data-act="pocketHamlet"/g)!.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('<span>12 places</span>');
    expect(html).toContain('<span>1 place</span>');
    expect(html.match(/class="pkt pn/g)).toHaveLength(12);
    expect(html.match(/class="pkt pn lt on"/g)).toHaveLength(1);
    expect(html.match(/<em>READY<\/em>/g)).toHaveLength(1);
    expect(html.match(/class="pkt pn off"/g)).toHaveLength(1);
    expect(html).toContain('Today in Pocket Town');
    expect(html).toContain('Hub Town');
    expect(html).not.toContain('ph-pk-more');
  });

  it('more places than a page: the grid shows the page the cursor is on', () => {
    const size = POCKET_COLS * POCKET_ROWS;
    const first = phPocket(PH, model({ places: places(14), place: 0 }));
    expect(first.match(/class="pkt pn/g)).toHaveLength(size);
    expect(first).toContain(`1–${size} of 14 ▼`);
    const second = phPocket(PH, model({ places: places(14), place: 13 }));
    expect(second.match(/class="pkt pn/g)).toHaveLength(2);
    expect(second).toContain('▲ 13–14 of 14');
    expect(second).toContain('data-act="pocketPlace" data-arg="13"');
  });

  it('has no Hub Town key where the town cannot be left, and clips a long text beside a tag', () => {
    expect(phPocket(PH, model({ hub: false }))).not.toContain('pocketHub');
    const long = 'Practice against ghost data of opponents who beat you in earlier runs.';
    const html = phPocket(PH, model({ places: [{ name: 'Gym Replica', text: long, tag: 'READY', off: false }, { name: 'Daycare', text: long, tag: '', off: false }], place: 0 }));
    // Two lines beside a tag, three without one.
    expect(html).toContain('<p class="txt">Practice against ghost data of opponents who…</p>');
    expect(html).toContain(`<p class="txt">${clip(long, 68)}</p>`);
    expect(clip(long, 68).length).toBeGreaterThan(46);
  });
});
