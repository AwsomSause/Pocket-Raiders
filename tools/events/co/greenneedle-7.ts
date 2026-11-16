// Greenneedle, part 7: gn.31 The Forgotten Forest (doc GREENNEEDLE_REWORKED_PLACED_7.md).
// Build: npm run co:build -- greenneedle-7   then   npm run co:gn
import { anyType, ch, fight, flag, item, join, out, wild, type Json } from '../dsl.ts';
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

// =====================================================================================================================
// gn.32  THE CRYSTAL CAVERNS  (a door at step 13 needing a cave or snow, then a Pseudo Stage of six nodes; A7; once a run).
// Five crystals, each working while carried, this stage only (core/greenneedle/crystals.ts); the bag holds six. The Crystal
// Golem at the Heart fights in three phases, and each phase takes the type of the colour you carry most.
// =====================================================================================================================
const CRYSTAL_TINT = '#6f8fb8';
const cave = (o: Json = {}): Json => ({ tint: CRYSTAL_TINT, tags: ['Pokémon', 'Exploration', 'Dungeon'], effect: 'sparkle', ...o });
const hall = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, cave(o), intro, choices);
const CAVE_POOL = ['carbink', 'roggenrola', 'boldore', 'sableye', 'aron', 'bergmite', 'snorunt', 'klink', 'nosepass'];
/** The first crystal you pick up hums, and something far below hums back. */
const FIRST_HUM: Json[] = [when('crystal-hummed', { min: 0, max: 0 }, [setTo('crystal-hummed', 1)], '*It hums. Somewhere far below, something hums back, a little lower.*')];
const ROOM = [is('crystal-bag', 0, 5)];
/** Pick up a crystal: Red and Blue go on a Pokémon you choose; the rest just go in the bag. */
const take = (colour: string, o: Json = {}): Json[] => [gn('crystal', { key: colour, ...o }), ...FIRST_HUM];
const onPick = { pick: { types: [] } };
const cw = (id: string): Json => ({ kind: 'addEvent', eventId: id });
/** A cave fight: anything you meet in here is a wild one (A+1). */
const caveFight = (species: string[], win: Json[], lose: Json[] = win): Json => inside({ ...wild({ species, lv: 1, win }), caught: win, exact: true, lose });
/** The light-beam puzzle at the Hall of Beams: three mirrors (red, blue, green) turned into the beam or out of it; white opens the door. */
const BEAM = ['nothing: the beam goes straight past', 'red', 'blue', 'violet', 'green', 'yellow', 'teal', 'white'];
const mirror = (key: 'r' | 'b' | 'g', label: string): Json => ch(label, out('The turntable grinds round. The beam swings with it.',
  flag(`crystal-mirror-${key}`), when(`crystal-mirror-${key}`, { min: 2 }, [setTo(`crystal-mirror-${key}`, 0)]),
  setTo('crystal-beam', 0),
  when('crystal-mirror-r', { min: 1 }, [flag('crystal-beam', 1)]), when('crystal-mirror-b', { min: 1 }, [flag('crystal-beam', 2)]), when('crystal-mirror-g', { min: 1 }, [flag('crystal-beam', 4)]),
  ...BEAM.slice(0, 7).map((c, n) => when('crystal-beam', { min: n, max: n }, [], n === 0 ? `The door gets ${c}.` : `The beam on the door is ${c}. The door doesn't move.`)),
  when('crystal-beam', { min: 7, max: 7 }, [setTo('crystal-door-1', 1)], 'All three together: the beam goes white. The dark door grinds open.'),
  when('crystal-beam', { min: 7, max: 7 }, [scene('gn-32-beams-open')]), when('crystal-beam', { min: 0, max: 6 }, [scene('gn-32-beams')])));
const COLOUR_LABEL: Record<string, string> = { red: 'Red', blue: 'Blue', green: 'Green', white: 'White', black: 'Black' };
/** The Golem reads the bag before each phase: the colour carried most, said out loud. */
const READ_BAG: Json[] = [
  gn('crystalMost'),
  when('crystal-most', { min: 1, max: 1 }, [], '*Red light runs through it like heat through iron. It is Rock and Fire now.*'),
  when('crystal-most', { min: 2, max: 2 }, [], '*Blue light pools in its joints. It is Rock and Water now, and the water keeps changing its mind.*'),
  when('crystal-most', { min: 3, max: 3 }, [], '*Green light, and moss, and something growing. It is Rock and Grass now. Cracks close as you watch.*'),
  when('crystal-most', { min: 4, max: 4 }, [], '*White light, everywhere at once. It is Rock and Fairy now. It sees exactly where you are.*'),
  when('crystal-most', { min: 5, max: 5 }, [], '*It goes dark. Rock and Dark. Your Pokémon don\'t want to go near it.*'),
  gn('check', { key: 'crystal-plain', if: [exactly('crystal-most', 0)] }),
  when('crystal-plain', { min: 1 }, [], '*Nothing in your bag wins. It stays plain grey rock, and seems almost disappointed.*'),
];
/** Drop one crystal between phases (two pages: an event holds four choices). After it, the next phase. */
const toPhase: Json[] = [...READ_BAG, when('crystal-phase', { min: 1, max: 1 }, [scene('gn-32-phase-2')]), when('crystal-phase', { min: 2, max: 2 }, [scene('gn-32-phase-3')])];
const dropIt = (c: string): Json => chIf([is(`crystal-${c}`)], `The ${COLOUR_LABEL[c]} one.`, out('It rolls a little way, and stops, and the Golem watches it go.', gn('crystalDrop', { key: c }), ...toPhase));
/** Keep one crystal as a held item, at half strength (beaten Golem). */
const keepIt = (c: string): Json => chIf([is(`crystal-${c}`)], `Keep the ${COLOUR_LABEL[c]} one.`, out('It stops humming in your hand, and goes quiet, and stays.', item(`cavern-${c}-crystal`), setTo('crystal-kept', 1), cw('gn-32-follower-check')));
const GENTLE: Json[] = [gn('check', { key: 'crystal-gentle', if: [is('giants-river')] }), when('guzzlord-fed', { min: 1 }, [setTo('crystal-gentle', 1)])];
const golemPhase = (n: number): Json => inside({ ...wild({ species: ['gigalith'], lv: 2, win: n < 3 ? [setTo('crystal-phase', n), scene(`gn-32-between-${n}`)] : [setTo('crystal-golem', 1), flag('crystal-golem-defeated'), scene('gn-32-defeated')] }),
  exact: true, rule: { gn: 'golem', noCatch: true, giant: true, foeStages: { atk: 1, spd: 1 } }, lose: [setTo('crystal-golem', 3), scene('gn-32-folded')] });
const GIVE_OUT: Json = out(say(
  'You hold them out. It takes them, one at a time, very carefully, with something that isn\'t a hand.',
  'It sets them into itself. It folds back into the wall. The humming stops.',
), setTo('crystal-golem', 2), flag('crystal-golem-given'),
  // The shards are cosmetic key items: cut with the Keepsakes (Kice, Nov 13). The text keeps them; the flags remember the colours.
  ...['red', 'blue', 'green', 'white', 'black'].map((c) => when(`crystal-${c}`, { min: 1 }, [flag(`crystal-shard-${c}`)])),
  scene('gn-32-given'));
const CRYSTAL_DONE: Json[] = [flag('crystal-done'), leavePseudo()];
const phaseRoom = (n: number, intro: string): Json => hall(`gn-32-phase-${n}`, `The Heart: Phase ${n}`, { pokemon: 'gigalith', effect: 'shake' }, intro, [
  ch('Fight.', fight('It comes at you like a landslide that has decided to.', golemPhase(n))),
  n === 3 ? ch('Give it the crystals.', GIVE_OUT) : chIf([is('crystal-gentle')], 'Give it the crystals.', GIVE_OUT),
]);

const gn32: Json[] = [
  gev('gn-32-door', 'The Crystal Caverns', cave({ stop: 'event', rarity: 'rare', types: ['rock', 'ice', 'steel'], pokemon: 'carbink', requires: [not('crystal-done'), not('crystal-entered')] }), say(
    'A crack in the rock, and light coming out of it. Not daylight. Something cleaner.',
    'Your Pokémon go quiet. There\'s a hum in the stone, too low to hear, high enough to feel in your teeth.',
  ), [
    ch('Go in.', out('The crack opens into a mouth, and the mouth is full of light.', flag('crystal-entered'),
      ...['red', 'blue', 'green', 'white', 'black'].map((c) => setTo(`crystal-${c}`, 0)), setTo('crystal-bag', 0), setTo('crystal-phase', 0), ...GENTLE, cw('gn-32-mouth'))),
    ch('Walk on.', out('The hum follows you a little way down the road, then lets you go.')),
  ]),
  // ---- Node 1. The Bright Mouth ----
  hall('gn-32-mouth', 'The Crystal Caverns: The Bright Mouth', { pokemon: 'carbink' }, say(
    'Light from nowhere. It comes out of the walls, out of the floor, out of the air between.',
    'On a ledge, a red crystal, the size of a fist. Free for the taking.',
    '*A Carbink watches you from a crack in the wall. It doesn\'t blink. It may not be able to.*',
  ), [
    chIf([not('crystal-took-1'), ...ROOM], 'Take the Red crystal, for one of mine.', out('You hold it out to one of your Pokémon. It warms.', ...take('red'), flag('crystal-took-1'), scene('gn-32-mouth')), onPick),
    ch('Go deeper.', out('The light follows you in.', cw('gn-32-gallery'))),
  ]),
  // ---- Node 2. The Ore Gallery ----
  hall('gn-32-gallery', 'The Crystal Caverns: The Ore Gallery', { pokemon: 'roggenrola', remembers: [{ id: 'swung', when: [is('crystal-swings', 3)], notice: '*The deposits are worked out. Your arms ache.*' }] }, say(
    'Ore in the walls: veins of it, glittering. Three good places to swing at. A pool, very clear, very deep, with blue light at the bottom.',
    'Off to one side, a warm chamber. Something red glows in there, and something big is sitting in front of it.',
  ), [
    chIf([is('crystal-swings', 0, 2)], 'Swing at the ore.', fight('The rock gives. Something in it didn\'t want to be found.', caveFight(['roggenrola', 'aron', 'nosepass'], [
      { kind: 'itemFrom', ids: ['hard-stone', 'hard-stone', 'everstone', 'star-piece', 'metal-coat'] },
      flag('crystal-swings'), scene('gn-32-gallery')]))),
    chIf([not('crystal-took-2'), anyType('water')], 'Send a Pokémon down for the Blue crystal.', out('A long dive, a long wait, and up it comes with the light in its mouth.', flag('crystal-took-2'), setTo('crystal-blue-for', 2), scene('gn-32-blue'))),
    chIf([not('crystal-took-3')], 'Go into the warm chamber.', fight('It stands up. It\'s been guarding that light a long time.', caveFight(['slugma', 'roggenrola', 'nosepass'], [flag('crystal-took-3'), scene('gn-32-warm')], [flag('crystal-took-3'), scene('gn-32-gallery')]))),
    ch('Go on.', out('The gallery narrows into a hall of mirrors.', cw('gn-32-beams'))),
  ]),
  hall('gn-32-warm', 'The Crystal Caverns: A Warm Chamber', { pokemon: 'slugma' }, 'Behind where it sat: a second Red crystal, warm as a hand.', [
    chIf(ROOM, 'Take it, for one of mine.', out('It glows brighter as you choose.', ...take('red'), scene('gn-32-gallery')), onPick),
    ch('Leave it.', out('You leave it where it was. It keeps glowing, for nobody.', scene('gn-32-gallery'))),
  ]),
  // Blue: the Pokémon, then the type from three offered.
  hall('gn-32-blue', 'The Crystal Caverns: A Blue Crystal', { pokemon: 'bergmite' }, 'The Blue crystal is cold and wet and it shows three colours, depending how you hold it.', [
    chIf(ROOM, 'Hold it to the water.', out('The light goes the colour of deep water.', ...take('blue', { type: 'water' }), when('crystal-blue-for', { min: 2, max: 2 }, [scene('gn-32-gallery')]), when('crystal-blue-for', { min: 4, max: 4 }, [scene('gn-32-fall')])), onPick),
    chIf(ROOM, 'Hold it to the ice.', out('The light goes the colour of old ice.', ...take('blue', { type: 'ice' }), when('crystal-blue-for', { min: 2, max: 2 }, [scene('gn-32-gallery')]), when('crystal-blue-for', { min: 4, max: 4 }, [scene('gn-32-fall')])), onPick),
    chIf(ROOM, 'Hold it to the stone.', out('The light goes the colour of polished steel.', ...take('blue', { type: 'steel' }), when('crystal-blue-for', { min: 2, max: 2 }, [scene('gn-32-gallery')]), when('crystal-blue-for', { min: 4, max: 4 }, [scene('gn-32-fall')])), onPick),
    ch('Leave it.', out('You set it back in the water.', when('crystal-blue-for', { min: 2, max: 2 }, [scene('gn-32-gallery')]), when('crystal-blue-for', { min: 4, max: 4 }, [scene('gn-32-fall')]))),
  ]),
  // ---- Node 3. The Hall of Beams ----
  hall('gn-32-beams', 'The Crystal Caverns: The Hall of Beams', {
    pokemon: 'carbink',
    remembers: [{ id: 'sang', when: [is('crystal-hollow-heard')], intro: say(
      'A shaft of light, three crystal mirrors on turntables, and a dark door. The door is already open.',
      'Somebody sang into the Crystal Hollow once, and it carried all the way down here. The door remembered.',
    ), hide: [0, 1, 2], addChoices: [ch('Go through the open door.', out('It hums as you pass, the note you sang.', setTo('crystal-door-1', 1), scene('gn-32-beams-open')))] }],
  }, say(
    'A shaft of light from somewhere above. Three crystal mirrors on turntables: one red, one blue, one green. A dark door.',
    'Each mirror colours the beam. The door is waiting for something.',
  ), [mirror('r', 'Turn the red mirror.'), mirror('b', 'Turn the blue mirror.'), mirror('g', 'Turn the green mirror.'), ch('Leave the door shut.', out('You leave the mirrors as they are.', cw('gn-32-fall')))]),
  hall('gn-32-beams-open', 'The Crystal Caverns: Behind the Door', { pokemon: 'carbink' }, 'Behind the door: a small room, and a White crystal on the floor, lit up by the beam you made.', [
    chIf(ROOM, 'Take the White crystal.', out('It\'s light to hold. When you look at the walls, you can see the cracks that go somewhere.', ...take('white'), cw('gn-32-fall'))),
    ch('Leave it.', out('You leave it in its beam.', cw('gn-32-fall'))),
  ]),
  // ---- Node 4. The Frozen Fall ----
  hall('gn-32-fall', 'The Crystal Caverns: The Frozen Fall', { pokemon: 'snorunt' }, say(
    'A waterfall, frozen mid-fall. Ice-types live in the gaps behind it. Inside the ice, a blue light.',
    'And another door, another beam, two mirrors. Where the third should be, there\'s an empty turntable.',
  ), [
    chIf([not('crystal-took-4')], 'Break the Blue crystal out of the ice.', fight('The ice cracks. The things that live in it are not happy.', caveFight(['bergmite', 'snorunt'], [flag('crystal-took-4'), setTo('crystal-blue-for', 4), scene('gn-32-blue')], [flag('crystal-took-4'), scene('gn-32-fall')]))),
    chIf([not('crystal-door-2'), anyType('steel')], 'Stand a Steel-type in the gap.', out('It stands on the turntable, very still, and the beam bounces off it, true as a mirror. The door opens.', setTo('crystal-door-2', 1), scene('gn-32-green'))),
    chIf([not('crystal-door-2'), is('crystal-white')], 'Hold the White crystal in the gap.', out('The White crystal catches the beam and throws it on. The door opens.', setTo('crystal-door-2', 1), scene('gn-32-green'))),
    ch('Go on, down.', out('The cold follows you down.', cw('gn-32-deep'))),
  ]),
  hall('gn-32-green', 'The Crystal Caverns: The Green Crystal', { pokemon: 'carbink' }, say(
    'Behind the door, one Green crystal, on a shelf. Rare. One to a visit.',
    'It lets a Pokémon change the way it couldn\'t on its own: without the stone, without the trade, without the time of day. That change is for good.',
  ), [
    chIf(ROOM, 'Use it on one of mine.', out('The green goes into it, all at once.', ...take('green'), scene('gn-32-fall')), onPick),
    chIf(ROOM, 'Carry it.', out('It goes in your bag. It feels like it\'s growing.', ...take('green'), scene('gn-32-fall'))),
    ch('Leave it.', out('You leave it on its shelf.', scene('gn-32-fall'))),
  ]),
  // ---- Node 5. The Deep ----
  hall('gn-32-deep', 'The Crystal Caverns: The Deep', {
    pokemon: 'sableye',
    remembers: [{ id: 'path', when: [is('crystal-white'), not('crystal-path')], notice: '*The White crystal shows you a crack in the wall that goes somewhere.*', addChoices: [ch('Follow the hidden path.', out('A side passage, and at the end of it, something somebody left a long time ago.', flag('crystal-path'), { kind: 'itemFrom', ids: ['rare-candy', 'star-piece', 'pp-up'] }, scene('gn-32-deep')))] }],
  }, say(
    'Dark. The light doesn\'t reach this far.',
    'On a plinth, alone, a Black crystal. It\'s cold even from here. The hum is louder, and lower.',
  ), [
    chIf(ROOM, 'Take it.', out('Your fingers ache with the cold. Below you, the hum gets louder.', ...take('black'), cw('gn-32-passage'))),
    ch('Leave it.', out('You leave it where it is. The hum doesn\'t change.', cw('gn-32-passage'))),
  ]),
  // A wild one in the passage: with the Black crystal carried, it may flee (40%), fight (40%) or follow (20%).
  hall('gn-32-passage', 'The Crystal Caverns: The Passage', { pokemon: 'sableye' }, 'Something comes up the passage toward you, drawn by the hum.', [
    ch('Stand your ground.', out('Its eyes catch the light.', setTo('crystal-black-roll', 2), when('crystal-black', { min: 1 }, [pick('crystal-black-roll', 40, 40, 20)]),
      when('crystal-black-roll', { min: 1, max: 1 }, [cw('gn-32-heart')], 'It sees what you\'re carrying, and runs.'),
      when('crystal-black-roll', { min: 2, max: 2 }, [scene('gn-32-passage-fight')]),
      when('crystal-black-roll', { min: 3, max: 3 }, [gn('cast', { key: 'crystal-follower', species: CAVE_POOL, n: 1 }), setTo('crystal-follower', 1), cw('gn-32-heart')], 'It doesn\'t fight. It falls in behind you, and follows.'))),
  ]),
  hall('gn-32-passage-fight', 'The Crystal Caverns: The Passage', { pokemon: 'sableye' }, 'It comes at you.', [
    ch('Fight.', fight('It\'s quick in the dark.', caveFight(['sableye', 'klink', 'carbink', 'boldore'], [cw('gn-32-heart')]))),
  ]),
  // ---- Node 6. The Heart ----
  hall('gn-32-heart', 'The Crystal Caverns: The Heart', { pokemon: 'gigalith', effect: 'shake', remembers: [{ id: 'follower', when: [is('crystal-follower')], notice: '*Behind you, the one that followed sits down to watch.*' }] }, say(
    'The far wall isn\'t a wall. It unfolds.',
    '*A Gigalith, twice the size it should be, grown through with crystal of every colour. It turns toward your bag.*',
  ), [ch('Stand your ground.', out('It reads your bag the way you\'d read a face.', ...GENTLE, ...READ_BAG, scene('gn-32-phase-1')))]),
  phaseRoom(1, 'It leans down toward your bag, and the crystals in it light up.'),
  ...[1, 2].map((n) => hall(`gn-32-between-${n}`, 'The Heart: Between', { pokemon: 'gigalith' }, say(
    '*It\'s looking at the bag again. It isn\'t angry. It\'s hungry, or it\'s lonely; with a rock, it\'s hard to tell.*',
  ), [
    ch('Drop a crystal.', out('You open the bag.', scene('gn-32-drop'))),
    ch('Keep everything.', out('You close the bag. It watches you do it.', ...toPhase)),
  ])),
  hall('gn-32-drop', 'The Heart: Drop a Crystal', { pokemon: 'gigalith' }, 'Which one?', [dropIt('red'), dropIt('blue'), dropIt('green'), ch('The others.', out('You dig deeper in the bag.', scene('gn-32-drop-2')))]),
  hall('gn-32-drop-2', 'The Heart: Drop a Crystal', { pokemon: 'gigalith' }, 'Which one?', [dropIt('white'), dropIt('black'), ch('Keep everything after all.', out('You close the bag.', ...toPhase))]),
  phaseRoom(2, 'The second time, it\'s slower, and it looks at the bag longer.'),
  phaseRoom(3, 'The third time, it holds out something that isn\'t a hand.'),
  // ---- How it ended ----
  hall('gn-32-defeated', 'The Heart: The Golem Falls', { pokemon: 'gigalith' }, say(
    'It settles. The crystals in it go dim, one by one.',
    'Among the rubble: a Hard Stone, something rare, and one crystal that hasn\'t gone dark yet.',
  ), [ch('Gather it up.', out('You fill your hands.', item('hard-stone'), { kind: 'itemFrom', ids: ['leftovers', 'life-orb', 'focus-sash', 'eviolite', 'rocky-helmet', 'choice-band', 'choice-specs'] }, scene('gn-32-keep')))]),
  hall('gn-32-keep', 'The Heart: One Crystal', { pokemon: 'gigalith' }, 'One crystal stays lit, if you choose it. Its light at half strength, for good.', [keepIt('red'), keepIt('blue'), keepIt('green'), ch('The others.', out('You look again.', scene('gn-32-keep-2')))]),
  hall('gn-32-keep-2', 'The Heart: One Crystal', { pokemon: 'gigalith' }, 'One crystal stays lit, if you choose it.', [keepIt('white'), keepIt('black'), ch('None of them.', out('You let them go dark.', cw('gn-32-follower-check')))]),
  hall('gn-32-given', 'The Heart: The Wall', { pokemon: 'carbink' }, say(
    'Where it folded, the wall moves once more. A Carbink climbs out of it, and looks at you, and follows.',
    'In your hand: one small shard of each colour you gave. They hum, faintly, when you turn toward places nobody\'s found.',
  ), [ch('Let it come.', out('It walks at your heel all the way to the light.', { ...join({ species: ['carbink'] }), marks: ['came out of the wall in the Crystal Caverns'] }, cw('gn-32-follower-check')))]),
  hall('gn-32-folded', 'The Heart: The Wall', { pokemon: 'gigalith' }, 'It doesn\'t follow you. It folds back into the wall, and the humming goes on without you.', [
    ch('Find the way out.', out('The light leads you out.', setTo('crystal-golem', 3), cw('gn-32-follower-check'))),
  ]),
  // The one that followed: caught at double the chance, or it wanders off.
  hall('gn-32-follower-check', 'The Crystal Caverns: The Way Out', { pokemon: 'carbink', remembers: [{ id: 'follower', when: [is('crystal-follower')], intro: 'At the mouth of the cave, the one that followed you all the way stops, and looks at you.', hide: [0], addChoices: [
    ch('Try to catch it.', fight('It doesn\'t run.', inside({ ...wild({ species: ['@crystal-follower'], lv: 1, win: [...CRYSTAL_DONE] }), caught: [...CRYSTAL_DONE], exact: true, rule: { catchTimes: 2 }, lose: [...CRYSTAL_DONE] }))),
    ch('Let it wander off.', out('It watches you go. Then it turns, and goes back in, toward the hum.', ...CRYSTAL_DONE)),
  ] }] }, 'Daylight, at last. Behind you, the hum goes on.', [ch('Step out.', out('The crystals in your bag go quiet the moment the sun touches them.', ...CRYSTAL_DONE))]),
];

export const EVENTS: Json[] = [...gn31, ...gn32];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-31-door': {
    gn: 'gn.31', shape: 'Door', earliest: 'A8', home: 12, window: [10, 15], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Legendary'], needs: ['forest'],
    level: 'A+0; the Trevenant A+2', often: 'run', badge: '?', dressing: { kanto: 'A gap in Viridian Forest', elsewhere: 'A gap between two trees' },
    note: 'Badge: a "?". Six nodes. A side branch from step 12: a gap between two trees that wasn\'t there on the way in.',
  },
  'gn-32-door': {
    gn: 'gn.32', shape: 'Door', earliest: 'A7', home: 13, window: [11, 16], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['cave', 'snow'],
    level: 'A+1; the Golem A+2', often: 'run', badge: 'own', dressing: { kanto: 'Under Cerulean Cave: the Crystal Caverns', elsewhere: 'The Crystal Caverns' },
    note: 'Badge: a crystal. Six nodes. The Crystal Hollow (SF93) is its front chamber: singing into it opens the Hall of Beams\' door.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_crystal', name: 'The Crystal Caverns', entry: 'gn-32-door', themeId: 'rock-fairy', tint: CRYSTAL_TINT, mood: 'crystal cave', start: 'opened' },
  { id: 'ps_gn_forest', name: 'The Forgotten Forest', entry: 'gn-31-door', themeId: 'grass-bug', tint: FOREST_TINT, mood: 'ancient forest', start: 'opened' },
];
