// Greenneedle, part 7: gn.31 The Forgotten Forest (doc GREENNEEDLE_REWORKED_PLACED_7.md).
// Build: npm run co:build -- greenneedle-7   then   npm run co:gn
import { ch, fight, flag, item, join, out, wild, type Json } from '../dsl.ts';
import { chIf, exactly, gev, gn, inside, is, leavePseudo, moment, not, pick, rm, roll, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.31  THE FORGOTTEN FOREST  (a door at step 12 needing a forest, then a Pseudo Stage of six nodes; A8; once a run).
// Untouched for centuries. From the first step the game counts one thing and never says so: whether a wild Pokémon was
// knocked out here (battle rule `forest` sets `forest-harmed`; catching, calming and fleeing are fine). After the first, the
// birdsong stops. The ancient Trevenant at the Sacred Tree reads it, and the four carved slabs.
// =====================================================================================================================
const FOREST_TINT = '#2f4a2a';
const wood = (o: Json = {}): Json => ({ tint: FOREST_TINT, tags: ['Pokémon', 'Exploration', 'Mystery'], effect: 'none', ...o });
const node = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, wood(o), intro, choices);
const next = (id: string): Json => ({ kind: 'addEvent', eventId: id });
const HARMED = 'forest-harmed';
/** After the first knockout the birdsong stops. Nothing says why. */
const SILENT = { id: 'silent', when: [is(HARMED)], notice: '*It\'s very quiet. The birdsong stopped a while ago, and hasn\'t come back.*' };
/** Passed the canopy village's test (gn.20) or kept Quiet in Safari Land (gn.18): the forest's Pokémon walk beside you. */
const BESIDE = { id: 'beside', when: [is('forest-beside')], notice: '*Two Oddish and a Sewaddle fall in beside you, as if you\'d been expected.*' };
const FRIENDS: Json[] = [gn('check', { key: 'forest-beside', if: [is('safari-quiet', 7)] }), when('jungle-village', { min: 1 }, [setTo('forest-beside', 1)])];
/** Read all four slabs, or kept the Hidden Village's secret (gn.06): the Trevenant knows the gesture. */
const KNOWS: Json[] = [gn('check', { key: 'forest-knows', if: [is('forest-slabs', 4)] }), when('village-kept-secret', { min: 1 }, [setTo('forest-knows', 1)])];

const SLABS: string[] = [
  'The first slab: many Pokémon, of every kind, walking in a line toward a great tree. Some carry their young on their backs.',
  'The second slab: the tree, with a small winged shape in its branches. The sun is behind it, carved as a ring of points.',
  'The third slab: people, at the forest\'s edge, with their hands up, palms out. Not coming in. Just letting the forest see them.',
  'The fourth slab: the tree alone. The line of Pokémon is gone. A single tall figure with one eye stands in front of it.',
];
/** The slabs are read in order, one at a time (an event has at most four choices). */
const READ: Json = chIf([is('forest-slabs', 0, 3)], 'Read the next slab.', out('You brush the moss from the next slab, and read it with your fingers as much as your eyes.',
  ...SLABS.map((text, n) => when('forest-slabs', { min: n, max: n }, [], text)),
  gn('check', { key: 'forest-slab-3', if: [exactly('forest-slabs', 2), is('village-kept-secret')] }),
  when('forest-slab-3', { min: 1 }, [], '*You\'ve seen that gesture before: carved on the post outside the Hidden Village.*'),
  flag('forest-slabs'), scene('gn-31-stones')));

/** The clearing's two secrets roll separately, 5% each. Shiny only if nothing was knocked out here. Nothing says so. */
const SECRETS: Json[] = [
  roll('forest-celebi', 5),
  roll('forest-koko', 5),
  when('forest-celebi', { min: 1 }, [
    flag('forest-sighting-celebi'), flag('telling-celebi'),
    moment('In the Forgotten Forest, something green went round a trunk, and came back a moment before it left.', 85),
    when(HARMED, { min: 0, max: 0 }, [flag('forest-shiny-celebi')], '*It wasn\'t green. It was pink. It looked at you as if it already knew you.*'),
  ], '*Something green goes round a trunk. It comes back round the other side, a moment before it left.*'),
  when('forest-koko', { min: 1 }, [
    flag('forest-sighting-koko'), flag('sign-tapu-koko'),
    moment('In the Forgotten Forest, a shell of yellow opened, and looked at you, and was gone.', 85),
    when(HARMED, { min: 0, max: 0 }, [flag('forest-shiny-koko')], '*Its colours were wrong: darker, richer. The rare kind. The air still hums where it was.*'),
  ], '*A crack of yellow between the trees. Two halves of a shell close, and open, and it\'s looking at you, and it\'s gone.*'),
  gn('check', { key: 'forest-sighting-none', if: [not('forest-celebi'), not('forest-koko')] }),
  when('forest-sighting-none', { min: 1 }, [], '*The mushrooms have been stepped over, recently, by something light.*'),
];

const DONE: Json[] = [gn('check', { key: 'forest-harmless', if: [not(HARMED)] }), flag('forest-done'), leavePseudo()];
/** An ancient Grass-type, from the rarer half of this region's Grass pool, with an ability its kind never has. */
const ABILITIES: [string, string][] = [
  ['old-growth', 'Old Growth: it mends a little every turn, in any weather.'],
  ['deep-roots', 'Deep Roots: nothing can make it leave a fight, and it shrugs off the worst hits.'],
  ['forests-memory', 'Forest\'s Memory: the first sleep, poison or paralysis of each battle doesn\'t take.'],
];
const ANCIENT: Json[] = [
  pick('forest-gift', 1, 1, 1),
  ...ABILITIES.map(([ability, line], i) => when('forest-gift', { min: i + 1, max: i + 1 }, [
    { ...join({ types: ['grass'] }), rarer: true, ability, marks: ['ancient, from the Forgotten Forest'] },
  ], line)),
  moment('Something old woke up in the Forgotten Forest, and came with you.', 90),
];
const fallsSilent = 'The birdsong doesn\'t come back. Not here, and not anywhere else in this region.';
const TREVENANT = (): Json => inside({
  ...wild({ species: ['trevenant'], lv: 2, win: [item('miracle-seed'), setTo('forest-trevenant', 3), flag('forest-trevenant-fought'), stampRegion('forest-silent'), when(HARMED, { min: 1 }, [], fallsSilent), ...DONE] }),
  exact: true, foeMoves: ['forests-curse', 'wood-hammer', 'horn-leech', 'will-o-wisp'], rule: { noCatch: true },
  lose: [setTo('forest-trevenant', 3), flag('forest-trevenant-fought'), ...DONE],
});
const BERRY_LEAVES = { id: 'planted', when: [is('forest-planted')], notice: '*Among the old leaves of the nest: the leaves of the Berry you planted. You\'d know them anywhere.*' };

const gn31: Json[] = [
  gev('gn-31-door', 'The Forgotten Forest', wood({ stop: 'event', rarity: 'rare', types: ['grass'], pokemon: 'oddish', requires: [not('forest-done'), not('forest-entered')] }), say(
    'A gap between two trees. It wasn\'t there on the way in. You\'re sure of it.',
    'The light through it is older, somehow. Greener. Nothing on the far side has ever been cut.',
  ), [
    ch('Step through the gap.', out('The air changes. It smells of moss and rain that fell a hundred years ago.',
      flag('forest-entered'), setTo(HARMED, 0), setTo('forest-slabs', 0), ...FRIENDS,
      gn('check', { key: 'forest-planted', if: [is('garden-planted')] }), when('pink-stone-planted', { min: 1 }, [setTo('forest-planted', 1)]),
      next('gn-31-gap'))),
    ch('Walk on.', out('When you look back, it\'s only two trees, close together, the way they always were.')),
  ]),
  // ---- Node 1. The Gap ----
  node('gn-31-gap', 'The Forgotten Forest: The Gap', { pokemon: 'oddish' }, say(
    'Two trees lean apart. In here the light is older.',
    'Nobody\'s cut anything here, or caught anything, or lit a fire. Not for centuries.',
    '*Your lead stops, and sniffs, and steps very carefully. Birds you don\'t know are singing.*',
  ), [ch('Follow your lead in.', out('It goes slowly. So do you.', next('gn-31-street')))]),
  // ---- Node 2. The Hollow Street ----
  node('gn-31-street', 'The Forgotten Forest: The Hollow Street', { pokemon: 'pumpkaboo', remembers: [SILENT, BESIDE] }, say(
    'A row of trees with rooms in them. A doorway in each trunk, a shelf, a hearth gone cold.',
    'Somebody small lived here. Not people.',
    'Wild Pokémon sit in the doorways, watching you pass. They aren\'t afraid. They\'ve never needed to be.',
  ), [
    chIf([not('forest-looked')], 'Look inside one.', out(say(
      'A shelf of acorns. A bed of moss, pressed flat by something that slept here a long time.',
      'A small carved figure: something with wings and a leaf. It\'s been dusted. Recently.',
    ), flag('forest-looked'), scene('gn-31-street'))),
    ch('Walk on.', out('The doorways watch you to the end of the row.', next('gn-31-stones'))),
  ]),
  // ---- Node 3. The Carved Stones ----
  node('gn-31-stones', 'The Forgotten Forest: The Carved Stones', { pokemon: 'bronzor', remembers: [SILENT, BESIDE, { id: 'all-read', when: [is('forest-slabs', 4)], notice: '*You\'ve read all four. The last one stays with you.*' }] }, say(
    'Ruins, half swallowed by roots. Four stone slabs stand in a row, carved deep and worn soft.',
    'They show migrations that don\'t happen any more.',
  ), [READ, ch('Walk on.', out('Moss closes over the carvings behind you.', next('gn-31-colony')))]),
  // ---- Node 4. The Colony Roads ----
  node('gn-31-colony', 'The Forgotten Forest: The Colony Roads', { pokemon: 'sewaddle', remembers: [SILENT, BESIDE] }, say(
    'A Bug colony\'s paths cross yours, worn deep into the roots by more feet than you can count. They have right of way.',
    '*A line of Sewaddle, each carrying a leaf, goes by. It goes by for a very long time.*',
  ), [
    ch('Wait for the line to pass.', out('You wait. The last Sewaddle looks up as it passes, and seems to nod.', next('gn-31-clearing'))),
    ch('Step through it.', fight('The line breaks around you. Three of them turn.',
      inside({ ...wild({ species: ['sewaddle', 'swadloon', 'leavanny'], lv: 0, chain: 3, win: [next('gn-31-clearing')] }), caught: [next('gn-31-clearing')], exact: true, rule: { gn: 'forest' }, lose: [next('gn-31-clearing')] }))),
  ]),
  // ---- Node 5. The Blank Clearing (the map doesn't show it) ----
  node('gn-31-clearing', 'The Forgotten Forest: A Clearing', { pokemon: 'shroomish', remembers: [SILENT, BESIDE] }, say(
    'A clearing the map didn\'t show. Grass. A ring of mushrooms.',
    'The quiet is different here. Like a room somebody has only just left.',
  ), [ch('Cross the clearing.', out('You go softly, round the ring and not through it.', ...SECRETS, ...KNOWS, next('gn-31-tree')))]),
  // ---- Node 6. The Sacred Tree ----
  node('gn-31-tree', 'The Forgotten Forest: The Sacred Tree', {
    pokemon: 'trevenant',
    remembers: [{ id: 'village', when: [is(HARMED), is('village-kept-secret')], notice: '*It looks at your hands, then at your face. It knows the gesture before you make it.*' }, SILENT],
  }, say(
    'A tree so old it\'s mostly hollow, and still in leaf.',
    '*In front of it, something that looks like another tree, until its one eye opens.*',
    'An ancient Trevenant. It doesn\'t speak. It looks at your hands.',
  ), [
    chIf([not(HARMED)], 'Stand still, and let it look.', out(say(
      'It looks for a long time. Longer than you\'ve been alive, maybe.',
      'Then it moves aside, slowly, the way old trees move. Birds land on it.',
    ), setTo('forest-trevenant', 1), flag('forest-trevenant-passed'), scene('gn-31-nest'))),
    chIf([is(HARMED), is('forest-knows')], 'Put my hands up, palms out.', out(say(
      'It considers. The forest holds its breath.',
      'Then it lets you come as far as the roots, and no farther.',
    ), setTo('forest-trevenant', 2), flag('forest-trevenant-roots'), scene('gn-31-roots'))),
    chIf([is(HARMED)], 'Battle.', fight('It doesn\'t make a sound. The ground does.', TREVENANT())),
  ]),
  node('gn-31-nest', 'The Forgotten Forest: Inside the Tree', { pokemon: 'trevenant', remembers: [BERRY_LEAVES] }, say(
    'Inside the tree: a nest, very old, lined with leaves that are still green.',
    '*In it, something asleep. It has been asleep a very long time.*',
  ), [ch('Wake it gently.', out('It opens its eyes, and looks at you, and decides.', ...ANCIENT, ...DONE))]),
  node('gn-31-roots', 'The Forgotten Forest: The Roots', { pokemon: 'trevenant', remembers: [BERRY_LEAVES] }, say(
    'At the roots, the Trevenant stops you with one branch.',
    'Below it, in a hollow, something stirs, and climbs out to you, blinking.',
  ), [ch('Kneel down to it.', out('The Trevenant watches you both. It doesn\'t move until you\'re gone.', ...ANCIENT, ...DONE))]),
];

export const EVENTS: Json[] = [...gn31];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-31-door': {
    gn: 'gn.31', shape: 'Door', earliest: 'A8', home: 12, window: [10, 15], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Legendary'], needs: ['forest'],
    level: 'A+0; the Trevenant A+2', often: 'run', badge: '?', dressing: { kanto: 'A gap in Viridian Forest', elsewhere: 'A gap between two trees' },
    note: 'Badge: a "?". Six nodes. A side branch from step 12: a gap between two trees that wasn\'t there on the way in.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_forest', name: 'The Forgotten Forest', entry: 'gn-31-door', themeId: 'grass-bug', tint: FOREST_TINT, mood: 'ancient forest', start: 'opened' },
];
