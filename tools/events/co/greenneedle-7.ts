// Greenneedle, part 7: gn.31 The Forgotten Forest (doc GREENNEEDLE_REWORKED_PLACED_7.md).
// Build: npm run co:build -- greenneedle-7   then   npm run co:gn
import { anyType, ch, fight, flag, hasAny, item, join, loseOne, out, takeNode, wild, type Json } from '../dsl.ts';
import { anyFlag } from './_ne.ts';
import { chIf, exactly, gev, gn, inside, is, laterStage, leavePseudo, moment, not, pick, rm, roll, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

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
  when('forest-slabs', { min: 2, max: 2 }, [], '*It\'s the same gesture that\'s carved on the post outside the Hidden Village.*'),
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

const DONE: Json[] = [gn('check', { key: 'forest-harmless', if: [not(HARMED)] }), flag('forest-done'), stampStage('forest-at'), leavePseudo()];
/** The forest's wild Pokémon are met on the way (A+0). Knocking one out is the only thing that counts; catching, calming or walking round is fine. */
const forestWild = (id: string, name: string, pokemon: string, types: string[], intro: string, round: string, roundText: string, to: string): Json => node(id, name, { pokemon, remembers: [SILENT, BESIDE] }, intro, [
  ch('Battle it.', fight('It doesn\'t run. Nothing here has ever needed to.', inside({ ...wild({ types, lv: 0, win: [next(to)] }), caught: [next(to)], rule: { gn: 'forest' }, lose: [next(to)] }))),
  ch(round, out(roundText, next(to))),
]);
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
    ch('Walk on.', out('The doorways watch you to the end of the row. At the last one, something steps down into your path.', scene('gn-31-wild-1'))),
  ]),
  forestWild('gn-31-wild-1', 'The Forgotten Forest: In Your Path', 'oddish', ['grass'], say(
    'One of them has come down out of its doorway, and stands in the path. A rare one. You\'ve only seen its kind in books.',
    'It isn\'t shy. It\'s never needed to be.',
  ), 'Let it look, and walk round it.', 'It sniffs your boots, and lets you by. It watches you go.', 'gn-31-stones'),
  // ---- Node 3. The Carved Stones ----
  node('gn-31-stones', 'The Forgotten Forest: The Carved Stones', { pokemon: 'bronzor', remembers: [SILENT, BESIDE, { id: 'all-read', when: [is('forest-slabs', 4)], notice: '*You\'ve read all four. The last one stays with you.*' }] }, say(
    'Ruins, half swallowed by roots. Four stone slabs stand in a row, carved deep and worn soft.',
    'They show migrations that don\'t happen any more.',
  ), [READ, ch('Walk on.', out('Moss closes over the carvings behind you. Past the last slab, something is asleep in the path.', scene('gn-31-wild-2')))]),
  forestWild('gn-31-wild-2', 'The Forgotten Forest: Asleep in the Path', 'sewaddle', ['bug', 'grass'], say(
    'Something small is asleep in a patch of sun, right where the path goes. It opens one eye. It doesn\'t get up.',
    'Nothing has ever made it get up.',
  ), 'Step round it, quietly.', 'You go round, through the ferns. It shuts its eye again.', 'gn-31-colony'),
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
  // ---- The Trevenant was fought and beaten: the birdsong doesn't come back for the rest of the region ----
  gev('gn-31-quiet', 'No Birdsong', wood({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('forest-silent'), { kind: 'gn', test: 'thisRegion', key: 'forest-silent' }, laterStage('forest-at'), not('forest-quiet-seen')] }), say(
    'A stand of trees by the road. You stop, without knowing why. Then you know why.',
    '*No birdsong. Not here either. It hasn\'t come back anywhere in this region, since the forest.*',
  ), [
    ch('Listen a while.', out('You listen. Wind, and leaves, and nothing else. Your Pokémon stay close.', flag('forest-quiet-seen'))),
    ch('Walk on.', out('You walk on. Your own footsteps are the loudest thing on the road.', flag('forest-quiet-seen'))),
  ]),
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
/** A Green crystal you chose to carry can still be used on a Pokémon later (it's used up; the evolution's for good). */
const useGreen = (self: string): Json => chIf([is('crystal-green')], 'Use the Green crystal on one of mine.', out('You take the Green crystal out of the bag, and hold it out.', gn('crystal', { key: 'green', type: 'use' }), scene(self)), onPick);
/** A cave fight: anything you meet in here is a wild one (A+1). */
/** `exact` only for one named foe: with a pool, it would always take the first. */
/** "...and this region's own": one time in three, a Rock-, Ice- or Steel-type of this region comes instead (its own roll). */
const LOCAL = { local: { types: ['rock', 'ice', 'steel'], chance: 1 / 3 } };
const caveFight = (species: string[], win: Json[], lose: Json[] = win): Json => inside({ ...wild({ species, lv: 1, win }), caught: win, ...(species.length === 1 ? { exact: true } : LOCAL), lose });
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
/** The Golem reads the bag again (the fight's own step: core/greenneedle/crystals.ts golemRead). */
const REREAD: Json = { kind: 'op', op: 'golemRead' };
/** Drop one crystal between phases, in the fight itself (two pages: a question holds four answers). After it, the Golem reads the bag again. */
const dropIt = (c: string): Json => ({ label: `The ${COLOUR_LABEL[c]} one.`, if: [{ key: `crystal-${c}` }], text: 'It rolls a little way, and stops, and the Golem watches it go.', effects: [{ kind: 'op', op: 'crystalDrop', key: c }, REREAD] });
/** Between phases, the player gets one action: "Drop a crystal." (pick which) / "Keep everything." */
const between = (phase: number): Json => ({
  id: `between-${phase - 1}`, at: { phase },
  prompt: 'It\'s looking at the bag again.',
  text: '*It\'s looking at the bag again. It isn\'t angry. It\'s hungry, or it\'s lonely; with a rock, it\'s hard to tell.*',
  options: [
    { label: 'Drop a crystal.', text: 'You open the bag.', then: 'drop' },
    { label: 'Keep everything.', text: 'You close the bag. It watches you do it.', effects: [REREAD] },
  ],
});
const GIVE_ANSWER: Json = {
  label: 'Give it the crystals.',
  text: 'You hold them out. It takes them, one at a time, very carefully, with something that isn\'t a hand. It sets them into itself. It folds back into the wall. The humming stops.',
  effects: [{ kind: 'flag', key: 'crystal-golem-given', n: 1 }, { kind: 'end', outcome: 'win' }],
};
/** The Golem's questions: between the phases; "Which one?"; and the new button, "Give it the crystals." (third phase; from the first for a gentle hand). */
const GOLEM_ASKS: Json[] = [
  between(2), between(3),
  { id: 'drop', at: { chained: true }, text: 'Which one?', options: [dropIt('red'), dropIt('blue'), dropIt('green'), { label: 'The others.', text: 'You dig deeper in the bag.', then: 'drop-2' }] },
  { id: 'drop-2', at: { chained: true }, text: 'Which one?', options: [dropIt('white'), dropIt('black'), { label: 'Keep everything after all.', text: 'You close the bag.', effects: [REREAD] }] },
  { id: 'give', at: { button: 'Give it the crystals.', phase: 3 }, if: [{ key: 'crystal-gentle', min: 0, max: 0 }], text: 'You hold the crystals out.', options: [GIVE_ANSWER] },
  { id: 'give-gentle', at: { button: 'Give it the crystals.' }, if: [{ key: 'crystal-gentle' }], text: 'You hold the crystals out.', options: [GIVE_ANSWER] },
];
/** Keep one crystal as a held item, at half strength (beaten Golem). */
const keepIt = (c: string): Json => chIf([is(`crystal-${c}`)], `Keep the ${COLOUR_LABEL[c]} one.`, out('It stops humming in your hand, and goes quiet, and stays.', item(`cavern-${c}-crystal`), setTo('crystal-kept', 1), cw('gn-32-follower-check')));
const GENTLE: Json[] = [gn('check', { key: 'crystal-gentle', if: [is('giants-river')] }), when('guzzlord-fed', { min: 1 }, [setTo('crystal-gentle', 1)])];
/** How the one fight ended: given the crystals (the shards are cut with the Keepsakes: Kice, Nov 13; the flags remember the colours given), or beaten. */
const GOLEM_WON: Json[] = [
  when('crystal-golem-given', { min: 1 }, [setTo('crystal-golem', 2), ...['red', 'blue', 'green', 'white', 'black'].map((c) => when(`crystal-${c}`, { min: 1 }, [flag(`crystal-shard-${c}`)])), scene('gn-32-given')]),
  when('crystal-golem-given', { min: 0, max: 0 }, [setTo('crystal-golem', 1), flag('crystal-golem-defeated'), scene('gn-32-defeated')]),
];
/** The Crystal Golem: ONE fight in three phases (at two thirds and one third of its HP). The type is read at the start of each phase. */
const GOLEM_FIGHT: Json = inside({ ...wild({ species: ['gigalith'], lv: 2, win: GOLEM_WON }),
  exact: true, lose: [setTo('crystal-golem', 3), scene('gn-32-folded')],
  rule: {
    gn: 'golem', noCatch: true, giant: true, foeStages: { atk: 1, spd: 1 },
    phases: [
      { at: 0.66, line: 'The second time, it\'s slower, and it looks at the bag longer.' },
      { at: 0.33, line: 'The third time, it holds out something that isn\'t a hand.' },
    ],
    asks: GOLEM_ASKS,
  } });
const CRYSTAL_DONE: Json[] = [flag('crystal-done'), leavePseudo()];

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
    useGreen('gn-32-deep'),
    ch('Leave it.', out('You leave it where it is. The hum doesn\'t change.', cw('gn-32-passage'))),
  ]),
  // A wild one in the passage: with the Black crystal carried, it may flee (40%), fight (40%) or follow (20%).
  hall('gn-32-passage', 'The Crystal Caverns: The Passage', {
    pokemon: 'sableye',
    // White shows hidden paths (plural): the second one is here.
    remembers: [{ id: 'path', when: [is('crystal-white'), not('crystal-path-2')], notice: '*The White crystal lights a seam in the passage wall. It isn\'t a seam. It\'s a way through.*', addChoices: [ch('Follow the hidden path.', out('A crawl, a turn, and a pocket in the rock where something was put down a long time ago, and never fetched.', flag('crystal-path-2'), { kind: 'itemFrom', ids: ['rare-candy', 'star-piece', 'pp-up'] }, scene('gn-32-passage')))] }],
  }, 'Something comes up the passage toward you, drawn by the hum.', [
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
  ), [ch('Stand your ground.', out('It reads your bag the way you\'d read a face.', ...GENTLE, ...READ_BAG, scene('gn-32-phase-1'))), useGreen('gn-32-heart')]),
  hall('gn-32-phase-1', 'The Heart: The Crystal Golem', { pokemon: 'gigalith', effect: 'shake' }, 'It leans down toward your bag, and the crystals in it light up.', [
    ch('Fight.', fight('It comes at you like a landslide that has decided to.', GOLEM_FIGHT)),
  ]),
  // ---- How it ended ----
  hall('gn-32-defeated', 'The Heart: The Golem Falls', { pokemon: 'gigalith' }, say(
    'It settles. The crystals in it go dim, one by one.',
    'Among the rubble: a Hard Stone, something rare, and one crystal that hasn\'t gone dark yet.',
  ), [ch('Gather it up.', out('You fill your hands.', item('hard-stone'), { kind: 'itemFrom', ids: ['leftovers', 'life-orb', 'focus-sash', 'eviolite', 'rocky-helmet', 'choice-band', 'choice-specs'] }, scene('gn-32-keep')))]),
  hall('gn-32-keep', 'The Heart: One Crystal', { pokemon: 'gigalith' }, 'One crystal stays lit, if you choose it. Its light at half strength, for good.', [keepIt('red'), keepIt('blue'), keepIt('green'), ch('The others.', out('You look again.', scene('gn-32-keep-2')))]),
  hall('gn-32-keep-2', 'The Heart: One Crystal', { pokemon: 'gigalith' }, 'One crystal stays lit, if you choose it.', [keepIt('white'), keepIt('black'), ch('None of them.', out('You let them go dark.', cw('gn-32-follower-check')))]),
  hall('gn-32-given', 'The Heart: The Wall', { pokemon: 'carbink' }, say(
    'Where it folded, the wall moves once more. A Carbink climbs out of it, and looks at you, and follows.',
    'Where it set your crystals into itself, the rock still shows their colours, faintly. They hum once, and go quiet.',
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

// =====================================================================================================================
// gn.33  THE SUNKEN CITY  (a door at step 12 needing water: a causeway at low tide, a dive at high; A9; then a Pseudo Stage:
// three districts in any order, then the archive). Nobody drowned. The water rose for a hundred years and they left in good
// order, and left one thing behind on purpose. The game never says it in words. Bronze wheels drain or flood a room. Water-types
// swim the flooded stairs; without one, each crossing takes a node going round. The Relicanth guards every name.
// =====================================================================================================================
const SUNK_TINT = '#2d6e7a';
const sea = (o: Json = {}): Json => ({ tint: SUNK_TINT, tags: ['Pokémon', 'Exploration', 'Mystery'], effect: 'none', ...o });
const street = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, sea(o), intro, choices);
const LOW_TIDE: Json = { kind: 'gn', test: 'lowTide' };
const HIGH_TIDE: Json = { kind: 'gn', test: 'highTide' };
/** Crossing the flooded stairs: free with a Water-type (or the flooded lower houses' shortcut); else a node going round. */
const CROSS: Json[] = [
  gn('check', { key: 'sunken-swim', if: [anyType('water')] }), setTo('sunken-cost', 1),
  when('sunken-swim', { min: 1 }, [setTo('sunken-cost', 0)]), when('sunken-shortcut', { min: 1 }, [setTo('sunken-cost', 0)]),
  when('sunken-cost', { min: 1 }, [takeNode(1)], 'No Water-type to swim the flooded stairs. You go the long way round, over the roofs. It takes a while.'),
];
/** A district seen. All three: one Notebook line, and only one. */
const visit = (key: string): Json[] => [
  when(key, { min: 0, max: 0 }, [flag('sunken-districts')]), setTo(key, 1),
  gn('check', { key: 'sunken-notebook', if: [is('sunken-districts', 3), not('sunken-had-time')] }),
  when('sunken-notebook', { min: 1 }, [flag('sunken-had-time'), moment('They had time.', 80)], '*In your Notebook, in your own hand: They had time.*'),
];
const go = (label: string, key: string, room: string, text: string): Json => ch(label, out(text, ...CROSS, ...visit(key), scene(room)));
const STAIRS = (text = 'Back up the stairs.'): Json => ch('Back to the stairs.', out(text, scene('gn-33-stairs')));
/** Put an object back where it belongs. The Relicanth watches each one. */
const putBack = (key: string, label: string, text: string): Json => chIf([is(`sunken-${key}`), not(`sunken-${key}-back`)], label, out(text, flag(`sunken-${key}-back`), flag('sunken-returned'), scene(`gn-33-${key === 'weight' ? 'market' : key === 'boat' ? 'houses' : 'archive'}`)));
const BOAT_LIGHT = { id: 'lantern', when: [is('lantern-boat')], notice: '*Once, at the Lantern Sea, you floated a boat. Below the windowsill, in the dark water, something is waiting to light the way.*' };
const SUNKEN_DONE: Json[] = [flag('sunken-done'), stampStage('sunken-at'), leavePseudo()];

const gn33: Json[] = [
  gev('gn-33-door', 'The Sunken City', sea({ stop: 'event', rarity: 'rare', types: ['water'], pokemon: 'relicanth', requires: [not('sunken-done'), not('sunken-entered')] }), say(
    'Off the shore, the tops of towers. A whole city, under clear water, laid out like a map of itself.',
    'The fishermen don\'t go near it. "It isn\'t haunted," one says. "It\'s just *somebody\'s.*"',
  ), [
    chIf([LOW_TIDE], 'Walk the causeway.', out('At low tide the old causeway is out of the water, stone by stone. You walk out to the towers.', flag('sunken-entered'), setTo('sunken-districts', 0), setTo('sunken-returned', 0), cw('gn-33-stairs'))),
    chIf([HIGH_TIDE], 'Dive.', out('The tide is in. You take a breath, and go down, past the tops of the towers, into the streets.', flag('sunken-entered'), setTo('sunken-districts', 0), setTo('sunken-returned', 0), cw('gn-33-stairs'))),
    ch('Walk on.', out('The towers go under as the tide turns.')),
  ]),
  // ---- The flooded stairs, where the three districts meet ----
  street('gn-33-stairs', 'The Sunken City: The Stairs', { pokemon: 'relicanth' }, say(
    'A wide stair, going down into green water, where three districts meet.',
    'There is no narrator here, and nobody to ask. Just the streets.',
  ), [
    go('The Market.', 'sunken-market', 'gn-33-market', 'You go down toward the stalls.'),
    go('The Houses.', 'sunken-houses', 'gn-33-houses', 'You go along a street of doorways.'),
    go('The Temple.', 'sunken-temple', 'gn-33-temple', 'You go toward the dome.'),
    chIf([{ kind: 'anyFlag', keys: ['sunken-key', 'sunken-bell'] }], 'Down to the archive.', out('Below the temple, a round door.', cw('gn-33-archive'))),
  ]),
  // ---- The Market ----
  street('gn-33-market', 'The Sunken City: The Market', { pokemon: 'corsola' }, say(
    '*Stalls, under four fathoms of clear water. Weights on the scales. Baskets stacked. A broom leaning where someone left it.*',
    'It\'s laid out as if for tomorrow. Nothing is overturned. Nothing was dropped.',
    'A Corsola sits behind one counter, a Krabby behind another, like shopkeepers waiting to open.',
  ), [
    ch('Look round the stalls.', fight('The shopkeepers don\'t like browsers.', inside({ ...wild({ species: ['corsola', 'krabby', 'staryu'], lv: 1, win: [scene('gn-33-market')] }), caught: [scene('gn-33-market')], exact: true, lose: [scene('gn-33-market')] }))),
    ch('Turn the Market\'s bronze wheel.', out('It\'s stiff, but it moves. Something below the stalls clanks awake.', scene('gn-33-wheel-m'))),
    putBack('weight', 'Put the weight back on the scale.', 'It sits in its pan as if it had never moved. The scale settles, level. Somewhere below, something old turns to watch.'),
    STAIRS(),
  ]),
  street('gn-33-wheel-m', 'The Market: The Wheel', { pokemon: 'krabby' }, 'Two ways to turn it: drain the cellar under the stalls, or flood the square.', [
    chIf([not('sunken-drain-m')], 'Drain the cellar.', out('The water goes out of the cellar with a long sigh. On the floor, in the silt: a scale-weight, stamped with a fish.', setTo('sunken-drain-m', 1), scene('gn-33-cellar'))),
    chIf([not('sunken-flood-m')], 'Flood the square.', out('Clean water pours over the square. Your Water-types roll in it like it\'s home.', setTo('sunken-flood-m', 1), { kind: 'heal', share: 1, types: ['water'] }, scene('gn-33-market'))),
    ch('Leave it.', out('You leave the wheel where it is.', scene('gn-33-market'))),
  ]),
  street('gn-33-cellar', 'The Market: The Cellar', { pokemon: 'krabby' }, 'A scale-weight, stamped with a fish. Somebody weighed things fairly here, every day, for a long time.', [
    ch('Pick it up.', out('It\'s heavier than it looks.', setTo('sunken-weight', 1), scene('gn-33-market'))),
    ch('Leave it.', out('You leave it in the silt.', scene('gn-33-market'))),
  ]),
  // ---- The Houses ----
  street('gn-33-houses', 'The Sunken City: The Houses', { pokemon: 'staryu' }, say(
    '*A street of doorways. Beside each door, at shoulder height, marks cut in the stone. A line. A date. Above it, another line. Another date.*',
    'In one house, a table set for a meal. Under each plate, a sandbag.',
    'On a windowsill, a child\'s clay boat, pointing out to sea.',
  ), [
    ch('Read the marks.', out(say(
      'High-water marks, carved and dated, each a little higher. The lowest are at the ankle.',
      'They go up slowly: a hand\'s width in a lifetime.',
    ), setTo('sunken-marks', 1), when('sunken-drain-h', { min: 1 }, [setTo('sunken-marks-top', 1)], 'With the street drained you can read them to the top: over the lintel. The last date is very neat.'),
      gn('check', { key: 'sunken-new-line', if: [anyFlag('aqua-flooded', 'hoenn-final-plan')] }),
      when('sunken-new-line', { min: 1 }, [], 'At the very top, one new line. Very recent. Cut by nobody.'), scene('gn-33-houses'))),
    ch('Turn the Houses\' bronze wheel.', out('It turns. Water moves somewhere behind the walls.', scene('gn-33-wheel-h'))),
    ch('Go to the windowsill.', out('The clay boat, pointing out to sea.', scene('gn-33-sill'))),
    STAIRS(),
  ]),
  street('gn-33-sill', 'The Houses: The Windowsill', { pokemon: 'staryu', remembers: [BOAT_LIGHT] }, 'A child\'s clay boat on the sill, pointing out to sea. Outside the window, open water.', [
    chIf([not('sunken-boat')], 'Take the clay boat from the sill.', out('It fits in one hand. Somebody small made it, and pressed their thumb into the bow.', setTo('sunken-boat', 1), scene('gn-33-houses'))),
    chIf([is('sunken-boat'), not('sunken-boat-back')], 'Set the boat on the water outside the window.', out(say('It floats.', 'It turns, slowly, until it points out to sea, the way it was.'),
      when('lantern-boat', { min: 1 }, [], 'It goes out through the gate on its own. Something below lights its way.'),
      flag('sunken-boat-back'), flag('sunken-returned'), scene('gn-33-houses'))),
    ch('Leave it be.', out('You leave the sill as it is.', scene('gn-33-houses'))),
  ]),
  street('gn-33-wheel-h', 'The Houses: The Wheel', { pokemon: 'staryu' }, 'Two ways to turn it: drain the street, or flood the lower houses.', [
    chIf([not('sunken-drain-h')], 'Drain the street.', out('The street drains. The marks go all the way up, over the lintels, clear and dry.', setTo('sunken-drain-h', 1), scene('gn-33-houses'))),
    chIf([not('sunken-flood-h')], 'Flood the lower houses.', out('The lower houses fill. Now there\'s a way through them, by swimming, straight to the stairs.', setTo('sunken-flood-h', 1), setTo('sunken-shortcut', 1), scene('gn-33-houses'))),
    ch('Leave it.', out('You leave it.', scene('gn-33-houses'))),
    STAIRS('Back along the street.'),
  ]),
  // ---- The Temple ----
  street('gn-33-temple', 'The Sunken City: The Temple', { pokemon: 'relicanth', remembers: [{ id: 'flooded', when: [is('sunken-dome-flooded')], notice: '*The dome is full of water now. The mural shows through it, bright as the day it was painted.*' }] }, say(
    '*A dome, still whole. Inside, dry air, and a mural that runs all the way round.*',
  ), [
    ch('Look at the mural.', out(say(
      'The mural has the sea drawn inside the walls, and the people walking out. In a line. Carrying things. Children on shoulders. Pokémon beside them.',
      'Nobody\'s running.',
      'At the end, the last figure is looking back. It\'s holding something small in both hands. It puts it down.',
    ), setTo('sunken-mural', 1), scene('gn-33-temple'))),
    ch('Turn the Temple\'s bronze wheel.', out('It\'s the heaviest of the three.', scene('gn-33-wheel-t'))),
    STAIRS(),
  ]),
  street('gn-33-wheel-t', 'The Temple: The Wheel', { pokemon: 'relicanth' }, 'Two ways to turn it: drain the crypt below, or flood the dome.', [
    chIf([not('sunken-drain-t')], 'Drain the crypt.', out('The crypt drains. On a hook by the stair, a bronze key, shaped like a coelacanth.', setTo('sunken-drain-t', 1), scene('gn-33-crypt'))),
    chIf([not('sunken-dome-flooded')], 'Flood the dome.', out('You put your hands on the wheel.', scene('gn-33-flood-1'))),
    ch('Leave it.', out('You leave it.', scene('gn-33-temple'))),
  ]),
  // The game asks twice.
  street('gn-33-flood-1', 'The Temple: Flood the Dome?', { pokemon: 'relicanth' }, 'The dome is the only dry room in the city. The mural is in it. Flood it?', [
    ch('Flood it.', out('You lean on the wheel.', scene('gn-33-flood-2'))),
    ch('No.', out('You take your hands off the wheel.', scene('gn-33-temple'))),
  ]),
  street('gn-33-flood-2', 'The Temple: Are You Sure?', { pokemon: 'relicanth' }, 'Somebody painted every one of those people. Are you sure?', [
    ch('Yes. Flood it.', out(say('The water comes in from the floor up. You watch the paint.', 'It holds. Somebody, a long time ago, made sure it would.'), setTo('sunken-dome-flooded', 1), scene('gn-33-temple'))),
    ch('No. Leave it dry.', out('You let the wheel go back. The dome stays dry.', scene('gn-33-temple'))),
  ]),
  street('gn-33-crypt', 'The Temple: The Crypt', { pokemon: 'relicanth' }, 'A bronze key, shaped like a coelacanth, on its hook. Below the temple, a round door with a slot shaped like a bell.', [
    ch('Take the key.', out('It\'s cold. The coelacanth\'s eye is a tiny hole, worn smooth by a thumb.', setTo('sunken-key', 1), scene('gn-33-temple'))),
    ch('Leave it.', out('You leave it on its hook.', scene('gn-33-temple'))),
  ]),
  // ---- The archive ----
  street('gn-33-archive', 'The Sunken City: The Archive', {
    pokemon: 'relicanth',
    remembers: [{ id: 'bell', when: [is('sunken-bell'), not('sunken-key')], notice: '*The bell fits the slot exactly. You ring it once, and the door rolls aside.*' }],
  }, say(
    '*Shelves cut in the rock. On them, clay tablets, thousands, stacked like plates.*',
    '*Something very old turns in the water in front of them.*',
    'An ancient Relicanth. It isn\'t guarding treasure. It\'s guarding the last record of who lived here: every name.',
  ), [
    putBack('key', 'Hang the key back on its hook.', 'The key goes back on its hook by the door. The Relicanth watches it settle.'),
    ch('Wait in front of it.', out('It looks at what you\'ve put back, and what you haven\'t.',
      gn('check', { key: 'sunken-all-back', if: [is('sunken-returned', 3)] }),
      when('sunken-all-back', { min: 1 }, [setTo('sunken-relicanth', 1), flag('sunken-relicanth-passed'), scene('gn-33-tablet')], 'After the third, it moves aside.'),
      when('sunken-all-back', { min: 0, max: 0 }, [setTo('sunken-relicanth', 2), flag('sunken-relicanth-looked'), scene('gn-33-looked')]))),
    chIf([{ kind: 'anyFlag', keys: ['sunken-weight', 'sunken-boat', 'sunken-key'] }], 'Fight it, with what you took.', fight('It doesn\'t leave the shelves. It doesn\'t need to.', inside({
      ...wild({ species: ['relicanth'], lv: 2, win: [setTo('sunken-relicanth', 3), flag('sunken-relicanth-fought'), scene('gn-33-sank')] }),
      exact: true, foeMoves: ['ancient-power', 'head-smash', 'aqua-tail', 'rest'], rule: { noCatch: true },
      lose: [setTo('sunken-relicanth', 3), flag('sunken-relicanth-fought'), ...SUNKEN_DONE],
    }))),
  ]),
  street('gn-33-tablet', 'The Archive: The Small Tablet', { pokemon: 'relicanth' }, say(
    '*One tablet\'s been set apart from the others, on a cushion of weed. It\'s small. It fits in both hands.*',
    '*It\'s the thing the last figure in the mural put down.*',
  ), [
    chIf([{ kind: 'item', id: 'relic-crown', absent: true }], 'Take it.', out(say('It\'s cold. It has marks on it that aren\'t writing, yet.', 'Beside it, a little crown, a child\'s, made for a festival that never came again.'),
      setTo('sunken-tablet', 1), stampStage('sunken-tablet-at'), item('relic-crown'), ...SUNKEN_DONE)),
    chIf([{ kind: 'item', id: 'relic-crown' }], 'Take it.', out('It\'s cold. It has marks on it that aren\'t writing, yet. You already have the crown that was beside it, once.', setTo('sunken-tablet', 1), stampStage('sunken-tablet-at'), item('relic-vase'), ...SUNKEN_DONE)),
  ]),
  street('gn-33-looked', 'The Archive: Look, Don\'t Touch', { pokemon: 'relicanth' }, say(
    'It lets you look. Not touch.',
    'Thousands of names. You read a few. They\'re ordinary names.',
  ), [ch('Go back up.', out('It turns in the water as you go.',
    when('sunken-returned', { min: 1, max: 1 }, [item('pearl-string')], 'On the stair, as if somebody left it for you: a Pearl String.'),
    when('sunken-returned', { min: 2, max: 2 }, [item('relic-vase')], 'On the stair, as if somebody left it for you: a Relic Vase.'),
    ...SUNKEN_DONE))]),
  street('gn-33-sank', 'The Archive: In the Way', { pokemon: 'relicanth' }, say(
    'It sinks in front of the shelves. Even now, it\'s in the way.',
    'You reach past it. The small tablet on its cushion of weed comes away in your hand.',
  ), [ch('Take it, and go.', out('Nothing stops you. That\'s the worst part.', setTo('sunken-tablet', 1), stampStage('sunken-tablet-at'), ...SUNKEN_DONE))]),
  // ---- Afterstory: a potter in a later coastal town ----
  gev('gn-33-potter', 'A Potter\'s Stall', sea({ stop: 'event', rarity: 'uncommon', callback: true, types: ['water'], cast: ['trainer.lady'], requires: [is('sunken-done'), laterStage('sunken-at'), not('sunken-potter')] }), say(
    'In a coastal town, a potter sells little clay boats to tourists. Each has a thumbprint pressed into the bow.',
    'She doesn\'t know where the shape comes from. "My grandmother made them," she says. "Her grandmother, too, I think."',
  ), [
    ch('Ask where the shape comes from.', out('"From the sea, Gran said. From before." She shrugs, and smiles, and presses her thumb into the next one.', flag('sunken-potter'))),
    ch('Walk on.', out('You walk on. The boats on her table all point the same way: out to sea.', flag('sunken-potter'))),
  ]),
];

// =====================================================================================================================
// gn.34  CAVERNS-O-MIGHTY  (the stage after the Sunken City, step 9, must-see while the Small Tablet is carried; the ground opens;
// three chambers and an end). The Unown are the cave. Each chamber asks for a word whose answer was in the Sunken City; a
// player who never saw it can still try letters until a word fits (`cavern-guessed`). The last word picks the Regi.
// =====================================================================================================================
const UNOWN_TINT = '#5a4f6e';
const deep = (o: Json = {}): Json => ({ tint: UNOWN_TINT, tags: ['Legendary', 'Exploration', 'Mystery'], effect: 'flicker', pokemon: 'unown', ...o });
const chamber = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, deep(o), intro, choices);
/** The Relicanth was fought and beaten: every word on the walls is the same one. */
const THIEF = { id: 'thief', when: [is('sunken-relicanth-fought')], notice: '*Every word on the walls is the same one, the whole way down. THIEF.*' };
/** Fight a lot of them and the walls get harder to read. */
const FADED = { id: 'faded', when: [is('cavern-unown-beaten', 3)], notice: '*So many letters are gone from the walls now. What\'s left is hard to read.*' };
const unownFight = (back: string): Json => ch('Fight the Unown.', fight('They come off the wall like leaves in a wind.', inside({
  ...wild({ species: ['unown'], lv: 1, win: [flag('cavern-unown-beaten'), scene(back)] }), caught: [scene(back)], exact: true, lose: [scene(back)],
})));
/** A chamber opens. It was a guess unless the Sunken City's carving for it was seen, and the walls can still be read. */
const SOLVED = (n: number, clue: string): Json[] => [
  setTo(`cavern-word-${n}`, 1), flag('cavern-solved'),
  gn('check', { key: `cavern-read-${n}`, if: [is(clue), is('cavern-unown-beaten', 0, 2)] }),
  when(`cavern-read-${n}`, { min: 0, max: 0 }, [flag('cavern-guessed')], 'The chamber opens. You couldn\'t say why that word and not another.'),
  scene('gn-34-lintel'),
];
/** The answer was in the Sunken City: the walls here say it again, while there are letters enough left to read. */
const CLUE = (clue: string, notice: string): Json => ({ id: 'clue', when: [is(clue), is('cavern-unown-beaten', 0, 2)], notice });
// How a word's spelled: loose Unown are led, one at a time, to a row of niches. A wrong letter drifts back out.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const niches = (word: string, n: number): string => word.split('').map((c, i) => (i < n ? c : '_')).join(' ');
/** The four loose Unown offered for niche `i`: the right letter and three others, the right one's place moving niche by niche. */
const loose = (word: string, i: number, others: string[] = []): string[] => {
  const right = word[i]!;
  const at = ALPHABET.indexOf(right);
  const decoys = [...others, ...[7, 13, 19].map((k) => ALPHABET[(at + k + i * 3) % 26]!)].filter((c, n, all) => c !== right && all.indexOf(c) === n).slice(0, 3);
  decoys.splice((i + word.length) % 4, 0, right);
  return decoys;
};
const drifts = (c: string, self: string): Json => ch(`${c}.`, out(`The ${c} settles into the niche, turns once, and drifts back out. Not that.`, flag('cavern-tries'), scene(self)));
/** The rooms that spell `word` from niche `from` on (ids `<id>-<niche>`); `done` runs when the last letter settles. */
const spell = (id: string, name: string, word: string, done: Json[], from = 0): Json[] => word.split('').slice(from).map((_, k) => {
  const i = from + k;
  const self = `${id}-${i + 1}`;
  const last = i === word.length - 1;
  return chamber(self, name, {}, `The niches: ${niches(word, i)}\n\nLoose Unown drift overhead. You can lead one down.`, loose(word, i).map((c) => (c === word[i]
    ? ch(`${c}.`, out(last ? `The ${c} settles. ${niches(word, word.length)}. The niches glow, one by one.` : `The ${c} settles into its niche, and stays. ${niches(word, i + 1)}`, ...(last ? done : [scene(`${id}-${i + 2}`)])))
    : drifts(c, self))));
});
const BALLS = ['poke-ball', 'great-ball', 'ultra-ball', 'premier-ball', 'net-ball', 'dive-ball', 'nest-ball', 'repeat-ball', 'timer-ball', 'quick-ball', 'dusk-ball', 'luxury-ball', 'heal-ball'];
const REGI = (key: string): Json[] => [gn('cast', { key: 'cavern-regi', species: [key] })];
const CAVERN_DONE: Json[] = [flag('cavern-done'), leavePseudo()];
const regiFight = (calmed: boolean): Json => inside({
  ...wild({ species: ['@cavern-regi'], lv: 2, win: [flag('cavern-regi-defeated'), scene('gn-34-defeated')] }),
  caught: [flag('cavern-regi-caught'), ...CAVERN_DONE], exact: true, lose: [...CAVERN_DONE],
  ...(calmed ? { rule: { foeStages: { atk: -1, def: -1, spa: -1, spd: -1, spe: -1 } } } : {}),
});
const DOOR = {
  scale: chIf([not('cavern-word-1')], 'Through the door marked SCALE.', out('A chamber with a carving of a balance.', scene('gn-34-scale'))),
  line: chIf([not('cavern-word-2')], 'Through the door marked LINE.', out('A chamber with a carving of a doorway.', scene('gn-34-line'))),
  hands: chIf([not('cavern-word-3')], 'Through the door marked HANDS.', out('A chamber with a carving of two hands.', scene('gn-34-hands'))),
};
const RARE_OF: [string, number, string][] = [['regirock', 1, 'stone-plate'], ['regice', 2, 'icicle-plate'], ['registeel', 3, 'iron-plate']];

const gn34: Json[] = [
  gev('gn-34-door', 'The Ground Opens', deep({ stop: 'event', rarity: 'rare', forced: true, requires: [is('sunken-tablet'), laterStage('sunken-tablet-at'), not('cavern-done'), not('cavern-entered')] }), say(
    '*The Small Tablet\'s warm. Then it\'s hot.*',
    '*The marks on it move. They line up. They point down.*',
    '*The ground in front of you folds open like a book.*',
  ), [
    ch('Go down.', out('Steps, cut for feet a little bigger than yours. The walls are moving.', flag('cavern-entered'), setTo('cavern-solved', 0), cw('gn-34-corridor'))),
  ]),
  // ---- The long corridor ----
  chamber('gn-34-corridor', 'Caverns-o-Mighty: The Corridor', { remembers: [THIEF] }, say(
    'The Unown are the cave. They\'re the only things alive down here, and they\'re on every wall.',
    'They spell words. Not to you. To each other. HERE. WAIT. STILL. A long one: WE KEPT IT.',
    '*Halfway along, they stop. They arrange themselves into your name. And hold it. Then the letters look at you, all at once, one eye each.*',
  ), [
    ch('Say it aloud.', out('Your own name comes back off the walls, softer each time, until it\'s only the Unown saying it.', setTo('unown-name', 1), cw('gn-34-lintel'))),
    ch('Spell something back.', out('You hold up your hands and wait. The letters come.', scene('gn-34-spell'))),
    ch('Walk on.', out('The name stays behind you. It\'s spelled right.', cw('gn-34-lintel'))),
  ]),
  chamber('gn-34-spell', 'Caverns-o-Mighty: Spell Something Back', {}, 'Which word? One you\'ve seen on the walls.', [
    ...['HERE', 'WAIT', 'STILL', 'WE KEPT IT'].map((w, i) => ch(`${w}.`, out(`They copy it, pleased. ${w}, all down the corridor.`, flag('unown-spoke'), setTo('unown-word', i + 1), cw('gn-34-lintel')))),
  ]),
  // ---- The lintels: three Unown on each door say where it goes, before you step through ----
  chamber('gn-34-lintel', 'Caverns-o-Mighty: The Doors', {
    remembers: [{ id: 'done', when: [is('cavern-word-1'), is('cavern-word-2'), is('cavern-word-3')], notice: 'The three Unown on the last lintel rearrange themselves. Now they spell END.', addChoices: [ch('Through the door marked END.', out('Seven dots, somewhere ahead, waiting to light.',
      // A player who guessed (in any chamber) gets a random one of the three, whatever the last word was.
      when('cavern-guessed', { min: 1 }, [pick('cavern-last', 1, 1, 1)]),
      ...RARE_OF.map(([sp, n]) => when('cavern-last', { min: n, max: n }, REGI(sp))),
      // `unown.spoke`: in the end chamber, the walls spell the word the player gave them.
      ...['HERE', 'WAIT', 'STILL', 'WE KEPT IT'].map((w, i) => when('unown-word', { min: i + 1, max: i + 1 }, [], `Ahead, on the walls, all the way round, the Unown spell the word you gave them: ${w}.`)),
      cw('gn-34-end')))] },
      // The Unown rearrange on the lintels after each chamber: the same doorway goes somewhere else. The player reads where before stepping through.
      { id: 'moved-1', when: [exactly('cavern-solved', 1)], notice: '*The Unown on the lintels have rearranged. The doors go somewhere else now. You read them again before you step.*', hide: [0, 1, 2], addChoices: [DOOR.hands, DOOR.scale, DOOR.line] },
      { id: 'moved-2', when: [exactly('cavern-solved', 2)], notice: '*The Unown on the lintels have rearranged again. The doors go somewhere else now. You read them again before you step.*', hide: [0, 1, 2], addChoices: [DOOR.line, DOOR.hands, DOOR.scale] }],
  }, 'Doors, and over each one, three Unown on the lintel. When they rearrange, the door goes somewhere else. You can read where before you step through.', [
    DOOR.scale, DOOR.line, DOOR.hands,
  ]),
  // ---- 1. The Scale ----
  chamber('gn-34-scale', 'Caverns-o-Mighty: The Scale', { remembers: [CLUE('sunken-weight', '*Small, on the wall, the Unown have spelled it once already: TRADE. The scale-weight, stamped with a fish. You held it.*'), THIEF, FADED] }, say(
    'A carving of a balance, with a fish on one side and nothing on the other. Below it, a row of five empty niches.',
    'Loose Unown drift in the air. You can lead them, one at a time, to the niches.',
  ), [
    ch('Lead the Unown to the niches.', out('You hold out a hand. One drifts down to it, curious.', scene('gn-34-scale-1'))),
    unownFight('gn-34-scale'),
  ]),
  ...spell('gn-34-scale', 'Caverns-o-Mighty: The Scale', 'TRADE', SOLVED(1, 'sunken-weight')),
  // ---- 2. The Line ----
  chamber('gn-34-line', 'Caverns-o-Mighty: The Line', { remembers: [CLUE('sunken-marks', '*Small, on the wall, the Unown have spelled it once already: RISING. The high-water marks, a hand\'s width in a lifetime. You read them.*'), THIEF, FADED] }, say(
    'A carving of a doorway, with lines beside it, each one higher than the last. A row of six empty niches.',
  ), [
    ch('Lead the Unown to the niches.', out('You hold out a hand. One drifts down to it, curious.', scene('gn-34-line-1'))),
    unownFight('gn-34-line'),
  ]),
  ...spell('gn-34-line', 'Caverns-o-Mighty: The Line', 'RISING', SOLVED(2, 'sunken-marks')),
  // ---- 3. The Hands: your own choice of three ----
  chamber('gn-34-hands', 'Caverns-o-Mighty: The Hands', { remembers: [CLUE('sunken-mural', '*Small, on the wall, three words, one under another: KEPT. LEFT. GIVEN. The last figure in the mural, putting something down. Which it was is yours to say.*'), THIEF, FADED] }, say(
    'A carving of two hands, open, something small between them. A row of empty niches: more than you need, or just enough.',
    'The last figure in the mural, looking back, putting something down.',
  ), [
    ch('Lead the Unown to the niches.', out('You hold out a hand. One drifts down to it, curious.', scene('gn-34-hands-1'))),
    unownFight('gn-34-hands'),
  ]),
  // The first letter picks the word: K, L or G.
  chamber('gn-34-hands-1', 'Caverns-o-Mighty: The Hands', {}, 'The niches: _ _ _ _\n\nLoose Unown drift overhead. You can lead one down.', [
    ch('K.', out('The K settles into its niche, and stays. K _ _ _', scene('gn-34-kept-2'))),
    drifts('S', 'gn-34-hands-1'),
    ch('L.', out('The L settles into its niche, and stays. L _ _ _', scene('gn-34-left-2'))),
    ch('G.', out('The G settles into its niche, and stays. A fifth niche opens beside the fourth. G _ _ _ _', scene('gn-34-given-2'))),
  ]),
  ...spell('gn-34-kept', 'Caverns-o-Mighty: The Hands', 'KEPT', [setTo('cavern-last', 1), ...SOLVED(3, 'sunken-mural')], 1),
  ...spell('gn-34-left', 'Caverns-o-Mighty: The Hands', 'LEFT', [setTo('cavern-last', 2), ...SOLVED(3, 'sunken-mural')], 1),
  ...spell('gn-34-given', 'Caverns-o-Mighty: The Hands', 'GIVEN', [setTo('cavern-last', 3), ...SOLVED(3, 'sunken-mural')], 1),
  // ---- The end ----
  chamber('gn-34-end', 'Caverns-o-Mighty: The End', {
    pokemon: 'regirock',
    remembers: [
      { id: 'guessed', when: [is('cavern-guessed')], notice: '*The dots light, but the door behind them opens on one you didn\'t choose.*' },
      THIEF,
      { id: 'spoke', when: [is('unown-spoke')], notice: '*On the walls, all the way round, the Unown spell the word you gave them.*' },
    ],
  }, say(
    '*Seven dots light, one after another.*',
    '*It doesn\'t move toward you. It was put here to wait for the tablet, and the tablet\'s come.*',
  ), [
    ch('Hold out the tablet.', out('It takes it. It sets it into its own chest, where there\'s a space the right size.', setTo('cavern-tablet-given', 1), scene('gn-34-regi'))),
    ch('Battle.', fight('The dots flare.', regiFight(false))),
    // "At full HP: almost no chance, and it's shown": one in a hundred, and the Ball is spent either way.
    ch('Throw a Ball. (About 1 in 100.)', out('It doesn\'t bounce off. It closes. It shakes once, twice, three times, and stays shut. Seven dots go dark, one after another.',
      loseOne(...BALLS), flag('cavern-ball'), flag('cavern-regi-caught'), join({ species: ['@cavern-regi'], lv: 2 }), ...CAVERN_DONE), {
      requires: [hasAny(...BALLS)], chance: 0.01,
      fail: out('It bounces off. At full strength, there was almost no chance: about one in a hundred. You could see that.', loseOne(...BALLS), flag('cavern-ball'), scene('gn-34-end')),
    }),
  ]),
  chamber('gn-34-regi', 'Caverns-o-Mighty: It Has What It Waited For', { pokemon: 'regirock' }, 'It has what it was waiting for. It stands a little lower now, the way you do after a long day.', [
    chIf([not('cavern-guessed')], 'Battle.', fight('It fights, but its heart isn\'t in it.', regiFight(true))),
    chIf([is('cavern-guessed')], 'Battle.', fight('It fights at full strength. It doesn\'t know you.', regiFight(false))),
  ]),
  chamber('gn-34-defeated', 'Caverns-o-Mighty: Still', { pokemon: 'regirock' }, say(
    'It goes still, the dots dark. Where it stood, something rare of its own kind, and the Small Tablet, cracked.',
    'The tablet hums, faintly, when you turn toward other sealed doors.',
  ), [ch('Take them.', out('Cold, both of them.',
    ...RARE_OF.map(([, n, plate]) => when('cavern-last', { min: n, max: n }, [item(plate)])),
    flag('cavern-tablet-cracked'), ...CAVERN_DONE))]),
];

export const EVENTS: Json[] = [...gn31, ...gn32, ...gn33, ...gn34];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-31-door': {
    gn: 'gn.31', shape: 'Door', earliest: 'A8', home: 12, window: [10, 15], sits: 'side-branch', attaches: 'instead', tags: ['Pseudo Stage', 'Legendary'], needs: ['forest'],
    level: 'A+0; the Trevenant A+2', often: 'run', badge: '?', dressing: { kanto: 'A gap in Viridian Forest', elsewhere: 'A gap between two trees' },
    note: 'Badge: a "?". Six nodes. A side branch from step 12: a gap between two trees that wasn\'t there on the way in.',
  },
  'gn-32-door': {
    gn: 'gn.32', shape: 'Door', earliest: 'A7', home: 13, window: [11, 16], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['cave', 'snow'],
    level: 'A+1; the Golem A+2', often: 'run', badge: 'own', dressing: { kanto: 'Under Cerulean Cave: the Crystal Caverns', elsewhere: 'The Crystal Caverns' },
    note: 'Badge: a crystal. Six nodes. The Crystal Hollow (SF93) is its front chamber: singing into it opens the Hall of Beams\' door.',
  },
  'gn-33-door': {
    gn: 'gn.33', shape: 'Door', earliest: 'A9', home: 12, window: [10, 15], sits: 'side-branch', attaches: 'instead', tags: ['Pseudo Stage', 'Mystery'], needs: ['water'],
    level: 'A+1; the Relicanth A+2', often: 'run', badge: 'own', dressing: { kanto: 'Off the Seafoam coast: the Sunken City', elsewhere: 'The Sunken City' },
    note: 'Badge: a drowned tower. Three districts in any order, then the archive. A causeway at low tide, a dive at high. "Once per save" is once per run (no memory across runs).',
  },
  'gn-34-door': {
    gn: 'gn.34', shape: 'Door', earliest: 'A10', home: 9, window: [7, 12], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage', 'Legendary'],
    level: 'Unown A+1; the Regi A+2', often: 'run', badge: 'None', dressing: { kanto: 'Under the next stage: Caverns-o-Mighty', elsewhere: 'Caverns-o-Mighty' },
    note: 'No badge: the ground opens. The stage after the Sunken City, must-see while the Small Tablet is carried. "Before the battle; the node\'s battle doesn\'t happen": it takes the battle\'s place.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_unown', name: 'Caverns-o-Mighty', entry: 'gn-34-door', themeId: 'psychic-ghost', tint: UNOWN_TINT, mood: 'unown caverns', start: 'opened' },
  { id: 'ps_gn_sunken', name: 'The Sunken City', entry: 'gn-33-door', themeId: 'water-ghost', tint: SUNK_TINT, mood: 'sunken city', start: 'opened' },
  { id: 'ps_gn_crystal', name: 'The Crystal Caverns', entry: 'gn-32-door', themeId: 'rock-fairy', tint: CRYSTAL_TINT, mood: 'crystal cave', start: 'opened' },
  // The six nodes by column (the wild ones met on the way are scenes of their node). The clearing is one of the map's blank spaces: walking into it draws it.
  { id: 'ps_gn_forest', name: 'The Forgotten Forest', entry: 'gn-31-door', themeId: 'grass-bug', tint: FOREST_TINT, mood: 'ancient forest', start: 'opened',
    layout: [['gn-31-gap'], ['gn-31-street'], ['gn-31-stones'], ['gn-31-colony'], ['gn-31-clearing'], ['gn-31-tree']], hidden: ['gn-31-clearing'] },
];
