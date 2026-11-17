// Greenneedle gn.new.25 The Mural (doc GREENNEEDLE_PLACED_2.md lines 175–212).
// Build: npm run co:build -- greenneedle-new-25   then   npm run co:gn
// Region-long, once per region, no battles. S1: the Smeargle paints the player arriving. S2–S8: one new panel a stage (the subject is
// picked by core/greenneedle/mural.ts). S8 step 19: the walkable wall, then the Smeargle.
import { flag, type Json } from '../dsl.ts';
import { gev, gn, is, laterStage, moment, not, notThisRegion, rm, route, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const WALL_TINT = '#8a6f4e';
const wall = (o: Json = {}): Json => ({ tint: WALL_TINT, tags: ['Story'], effect: 'none', ...o });
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const here = gnc('thisRegion', { key: 'mural-at' });
const open = (o: Json = {}): Json => wall({ stop: 'event', rarity: 'rare', ...o });

const PANELS = ['gn-new-25-p0', 'gn-new-25-p1', 'gn-new-25-p2', 'gn-new-25-p3', 'gn-new-25-p4'];
const ENDING_AT = 6; // panels on the wall before the last one can be reached (a missed stage does not lose the ending)

const ROOMS: { id: string; name: string; text: string; walk: string }[] = [
  { id: PANELS[0]!, name: 'The Mural: Something You Passed', text: say(
    'A panel of something you walked past: {mural:passed}. Nobody in it is looking at you. There is no comment.',
    'The painter simply kept it. Everything you leave behind, it seems, someone else is carrying.',
  ), walk: 'You stand there until the figure in the doorway seems to turn. It doesn\'t. You go.' },
  { id: PANELS[1]!, name: 'The Mural: The Close Call', text: say(
    'A panel of the fight you nearly lost. Your Pokémon, small and low, the {mural:foe} huge and bright. The paint on its side is still tacky.',
    'The painter chose the second before the turn. The moment your Pokémon stood up anyway.',
  ), walk: 'Your Pokémon looks at its own painted self for a long time, and stands a little straighter.' },
  { id: PANELS[2]!, name: 'The Mural: Someone New', text: say(
    'A panel of the {mural:caught} you caught, painted mid-turn, startled, one paw still raised, as it was in the moment before it chose to stay.',
    'The painter got its eyes right. You never told anyone what colour they were.',
  ), walk: 'You look from the panel to your Ball, and back. It\'s warm in your hand.' },
  { id: PANELS[3]!, name: 'The Mural: A Kindness', text: say(
    'A panel of a kindness you almost forgot. Your hand held out, someone smaller and braver taking it. The colours are the warmest on the whole wall.',
    'The painter gave it more paint than the battles. You notice that, and don\'t know what to say.',
  ), walk: 'You touch the corner of the panel. It doesn\'t come off on your finger, though the paint is wet.' },
  { id: PANELS[4]!, name: 'The Mural: The Gym', text: say(
    'A panel of the Gym: the door, the banner, the long way up the steps. Nothing else happened that stage the painter cared to keep.',
    'It is a good painting of a building. It is also, somehow, a painting of how you stood on the steps.',
  ), walk: 'You straighten your collar, because the painted you has done the same. Then you go on.' },
];

const rooms: Json[] = ROOMS.map((r) => rm(r.id, r.name, wall(), r.text, [{ label: 'Walk on.', success: { text: r.walk, effects: [] } }]));

/** Opens the panel the painter chose this stage, and counts it. */
const painted = (): Json[] => [gn('muralPick'), stampStage('mural-step')];

const opening: Json = gev('gn-new-25-open', 'The Mural', open({ requires: [notThisRegion('mural-at')], forced: true }), say(
  '*A long blank wall at the edge of the first town. A Smeargle is painting on it, tail dipping and lifting, quick as a heartbeat.*',
  'It has drawn one figure. It doesn\'t look round when you come closer. By the time you\'re close, the figure is gone, and the paint is wet.',
  'You know whose shape it was. It was yours, arriving.',
), [
  { label: 'Look.', success: { text: 'The wall is full-height and still glistening. At its left edge, a small figure with a pack walks into the town. It was a moment ago. It is already history.', effects: [stampRegion('mural-at'), setTo('mural-panels', 1), stampStage('mural-step')] } },
  { label: 'Walk on.', success: { text: 'You walk on. Behind you, a brush taps once against a palette, as if the painter were counting you.', effects: [stampRegion('mural-at'), setTo('mural-panels', 1), stampStage('mural-step')] } },
]);

/** One panel a stage, S2 to S8: you never see it painted. */
const panel = (n: number): Json => gev(`gn-new-25-panel-${n}`, 'The Mural: A New Panel', open({ requires: [here, laterStage('mural-step'), not('mural-end')], forced: true }), say(
  '*A new panel on the long wall, next to the last. The paint is wet, and no one is here.*',
  'You never see it done. The Smeargle is a rumour of a tail at the edge of the corner, and then it is nowhere.',
), [
  { label: 'Look.', success: { text: 'You step back until the panel fills your eyes, and the world goes quiet round the edges.', effects: [...painted(), route('mural-subject', ...PANELS)] } },
  { label: 'Walk on.', success: { text: 'You walk on. Behind you the paint dries, a little more of your road kept for no one in particular.', effects: painted() } },
]);

/** The Smeargle joins (knowing Sketch); if anything was used against you this region, it lifts its brush and waits for you to pick. */
const joined = (): Json[] => [gn('muralJoin'), flag('mural-walls', 1), moment('Took the Smeargle who painted the wall of this region.', 70), gn('muralSketchOpen'), when('mural-sk-0', { min: 1 }, [scene('gn-new-25-sketch')])];

const ending: Json = gev('gn-new-25-end', 'The Mural: The Whole Wall', open({ requires: [here, is('mural-panels', ENDING_AT), not('mural-end')], forced: true }), say(
  '*The whole wall, walkable, left to right. Your whole road, in paint.*',
  'You are standing at its left end, where it began.',
), [
  { label: 'Walk the wall.', success: { text: 'You start at the left, and walk.', effects: [gn('muralWalkStart'), scene('gn-new-25-walk')] } },
]);

/** The walk, one panel at a time, left to right; at the right end, the unpainted panel and the Smeargle. */
const walk: Json = rm('gn-new-25-walk', 'The Mural: Along the Wall', wall(), say(
  '{mural:walk}',
), [
  { label: 'Walk on along the wall.', showIf: [is('mural-walk-more')], success: { text: 'You take a few steps to the right. The paint changes colour under the next lamp.', effects: [gn('muralWalkOn'), scene('gn-new-25-walk')] } },
  { label: 'Go on to the end of the wall.', showIf: [not('mural-walk-more')], success: { text: 'There is one more panel. It is the size of all the others, and it is bare plaster.', effects: [scene('gn-new-25-last')] } },
]);

const last: Json = rm('gn-new-25-last', 'The Mural: The Last Panel', wall(), say(
  '*The last panel isn\'t painted yet. The Smeargle\'s sitting under it, brush out, looking at you.*',
), [
  { label: 'Come with me.', success: { text: 'It stands, shakes out its tail, and doesn\'t look back at the wall once. The last panel stays blank. You\'ll fill it, somehow.', effects: joined() } },
  { label: 'Finish it first.', success: { text: 'You sit with it while it paints, and don\'t watch. When it\'s done it hands you the brush, and then, quietly, itself.', effects: joined() } },
  { label: 'Paint me something I\'m not proud of.', success: { text: 'It looks at you for a long moment. Then it lifts a paw and points at a panel already on the wall: the one you tried not to look at. It paints nothing new. It comes along.', effects: joined() } },
]);

/** "Its first Sketch may copy any move used against the player this region": the player picks (two to a page: a room holds four choices). */
const sketchPick = (k: number): Json => ({ label: '{mural:move:' + k + '}.', showIf: [is(`mural-sk-${k}`)], success: { text: 'The Smeargle watches your mouth while you say it, the way it watched the road.', effects: [gn('muralSketch', { n: k })] } });
const sketch: Json = rm('gn-new-25-sketch', 'The Mural: The First Sketch', wall(), say(
  'The Smeargle lifts its tail, and waits. It has watched every fight you had in this region from somewhere you couldn\'t see.',
  '*Its first Sketch may copy any move that was used against you here. Which one?*',
), [
  sketchPick(0), sketchPick(1),
  { label: 'Other moves.', showIf: [is('mural-sk-more')], success: { text: 'It tilts its head, and thinks of others.', effects: [gn('muralSketchPage'), scene('gn-new-25-sketch')] } },
  { label: 'Let it keep its Sketch for now.', success: { text: 'It lowers its tail. It will know the right one when it sees it.', effects: [] } },
]);

export const EVENTS: Json[] = [opening, ...[2, 3, 4, 5, 6, 7, 8].map(panel), ending, walk, last, sketch, ...rooms];
export const REMOVE: string[] = [];

const base = { gn: 'gn.new.25', shape: 'Region-long', earliest: 'A1', home: 5, window: [3, 15] as [number, number], sits: 'must-see' as const, attaches: 'before' as const };
export const PLACEMENT: Record<string, Placement> = {
  'gn-new-25-open': {
    ...base, tags: ['Mystery Episode', 'Region-Wide Story'], level: 'No battles', often: 'region', badge: 'own',
    beats: [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ beat: n === 1 ? 'The Smeargle starts (S1)' : `Panel ${n}`, event: n === 1 ? 'gn-new-25-open' : `gn-new-25-panel-${n}`, stage: `S${n}`, home: 5, window: [3, 15] as [number, number] })),
      { beat: 'The whole wall', event: 'gn-new-25-end', stage: 'S8', home: 19 },
    ],
    dressing: { kanto: 'The Mural', elsewhere: 'The Mural' },
    note: 'Badge: a paint brush. One panel per stage; the subject (walked-past event, close call, catch, kindness, Gym) is picked in core/greenneedle/mural.ts. Fallback step 15. Each panel names what it shows (the event passed, the foe, the Pokémon caught). The ending needs six panels on the wall and is walked panel by panel, left to right; the Smeargle joins and its first Sketch copies a move the player picks from those used against them this region. Afterstory: the Final Reunion shows one wall per region (flag mural-walls).',
  },
};
export const CHAINS: Json[] = [];
