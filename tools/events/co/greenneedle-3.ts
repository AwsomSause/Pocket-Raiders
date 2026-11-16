// Greenneedle, part 3: events gn.11 to gn.15 (doc GREENNEEDLE_REWORKED_PLACED_3.md).
// In Kanto the canon spaces at Vermilion and Saffron open the same stories (CANON_SPACES_KANTO_MOVED_TO_GREENNEEDLE.md: "The Greenneedle
// version is the only version"); the old canon rooms are retired below (kept for saved runs).
// Build: npm run co:build -- greenneedle-3   then   npm run co:gn
import { $, at, ch, egg, eggMove, fight, flag, has, heal, hurt, item, join, leave, money, out, ptype, room, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, is, kindness, laterStage, leavePseudo, moment, not, notThisRegion, notThisStage, partyHas, pick, rm, roll, route, say, scene, setTo, stampRegion, stampStage, when, weighted, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const cap = (key: string, n: number): Json => gn('capFlag', { key, n });
const test = (name: string, o: Json = {}): Json => ({ kind: 'gn', test: name, ...o });
const again = (eventId: string): Json => ({ kind: 'seeAgain', eventId });
const hasNot = (id: string): Json => ({ kind: 'item', id, absent: true });

// =====================================================================================================================
// gn.11  KAIJU TENTACRUEL  (World Event: a raid in three phases; step 14, must-see, instead of the battle; needs water; A5)
// =====================================================================================================================
const HARBOUR_TINT = '#23465a';
const harbour = (o: Json = {}): Json => ({ tint: HARBOUR_TINT, tags: ['Combat', 'Story', 'Pokémon'], pokemon: 'tentacruel', effect: 'none', ...o });
const COMPANY = 'Coastline Ball Works';

const KAIJU_OPEN = say(
  '*A pier folds in half.*',
  '*Boats slide down it like plates off a table. People run past you, inland. A harbour bell rings and rings, and then stops, because the tower it was in isn\'t there.*',
  '*Out in the bay, something lifts a crane out of the water, looks at it, and puts it down on a warehouse.*',
  'It is a Tentacruel. It is the size of a ferry. Nobody Dynamaxed it: it grew, year on year, on what the harbour poured into the bay.',
  '**Harbourmaster, Captain Ffion:** "It came up at dawn. It\'s not attacking. It\'s *looking* for something. It just doesn\'t care what\'s in the way."',
  '**Ffion:** "I\'ve boats that\'ll help. I\'ve trainers stuck on the breakwater. I\'ve a town. Pick what you save first."',
);
/** gn.new.17 The Stranding: the same harbourmaster remembers the player. */
const FFION_KNOWS: Json = when('stranding-helped', { min: 1 }, [], '**Ffion:** "You again. Good. You\'re calm around big ones."');
const KAIJU_ENTER: Json[] = [flag('kaiju-entered'), stampStage('kaiju-at'), FFION_KNOWS];
const KAIJU_DOOR: Json[] = [
  ch('Ask Ffion for the boats.', out(say(
    'Ffion puts two fingers in her mouth and whistles. Three trawlers swing their bows round at once.',
    '"They\'ll worry it every time it shields up. That\'s all they can do. It\'s enough."',
  ), ...KAIJU_ENTER, flag('kaiju-boats'), scene('gn-11-breakwater'))),
  ch('Go straight to the breakwater.', out(say(
    'You run toward the water while everyone else runs away from it.',
    'Ffion shouts something after you. The wind takes most of it. The last word is "careful".',
  ), ...KAIJU_ENTER, scene('gn-11-breakwater'))),
];

const TURNS_LEFT = is('kaiju-turns', 0, 3);
/** A rescue: one turn with a Water- or Flying-type in the party, two without. Four turns before the swarm closes in. */
const rescue = (who: string, label: string, water: string, slow: string, back: string): Json =>
  chIf([not(`kaiju-${who}`), TURNS_LEFT], label, out(slow, flag(`kaiju-${who}`), flag('kaiju-rescued'), flag('kaiju-turns', 2), cap('kaiju-turns', 4), scene(back)), {
    branches: ['water', 'flying'].map((t) => ({ when: [ptype(t)], text: water, effects: [flag(`kaiju-${who}`), flag('kaiju-rescued'), flag('kaiju-turns', 1), scene(back)] })),
  });
const SWARM_LOST: Json[] = [flag('kaiju-lost'), scene('gn-11-retreat')];
const swarmFight = (format: 'doubles' | undefined): Json => ({ ...eitherWay(wild({ species: ['tentacool'], lv: 0, format, win: [scene('gn-11-seawall')] })), friendly: true, lose: SWARM_LOST });

/** What the rescued, the boats and the pylons did before the boss fight: once per point of each flag (core/events raidFlagMods). */
const KAIJU_MODS: Json[] = [
  { flag: 'kaiju-rescued', hpPercent: 6 },
  { flag: 'kaiju-boats', hpPercent: 9 },
  { flag: 'kaiju-pylons', foeStages: { atk: 1 }, hpPercent: 6 },
  { flag: 'kaiju-braced', hpPercent: 6 },
];
const KAIJU_DONE: Json[] = [flag('kanto-kaiju-won'), flag('kaiju-done')];
const PSYDUCK_GIRL: Json = when('kaiju-girl', { min: 1 }, [], '**The girl with the Psyduck:** "I said. I said it was looking."');
const STAMP_TEXT = (lead: string): string => say(lead, `*"PROPERTY OF ${COMPANY.toUpperCase()}"*`, 'Somebody made this net, and somebody lost it, and somebody\'s factory is still pouring into the bay.');
const takeFloat = (back: string, lead: string): Json => chIf([not('kaiju-stamp')], 'Take the float with the stamp.', out(STAMP_TEXT(lead), flag('kaiju-stamp'), scene(back)));
const PIER = 'Later, they rebuild the pier with a gap in it, for something to swim through.';

const gn11: Json[] = [
  gev('gn-11-harbour', 'Kaiju Tentacruel', harbour({ stop: 'event', rarity: 'rare', forced: true, types: ['water', 'poison'], requires: [not('kaiju-entered'), not('kaiju-done')] }), KAIJU_OPEN, KAIJU_DOOR),
  rm('gn-11-breakwater', 'The Harbour', harbour({ pokemon: 'tentacool' }), say(
    'Tentacool swarm in the shallows, hundreds of them, pale as jelly. Four people are stranded on what is left of the breakwater.',
    '**Swimmer Bettany** treads water by a broken post, furious. **Old Ned** sits on a rock, still holding his rod. Further along, **a Sailor** and his Machop hold a mooring line, and **a small girl** with a Psyduck is pointing at the reef.',
    'The tide gives you four turns before the swarm closes. A Water- or Flying-type gets someone off in one. Anyone else takes two.',
  ), [
    rescue('bettany', 'Get Swimmer Bettany off the post.',
      'Your Pokémon reaches her in one go. Bettany climbs out, spits seawater, and says, "I was doing *lengths*." She wants a go at it.',
      'It takes two tries through the swarm. Bettany climbs out, spits seawater, and says, "I was doing *lengths*." She wants a go at it.', 'gn-11-breakwater'),
    rescue('ned', 'Reach Old Ned on his rock.',
      'Ned steps across like he\'s getting off a bus. "Took your time." He hasn\'t let go of the rod. He says he can hook one of those out of a fight.',
      'Two slow trips through the stinging water. Ned steps across like he\'s getting off a bus. "Took your time." He says he can hook one of those out of a fight.', 'gn-11-breakwater'),
    chIf([TURNS_LEFT], 'Go further along the breakwater.', out('You pick your way along the broken stones, toward the Sailor and the girl.', scene('gn-11-breakwater-2'))),
    ch('Hold the shallows.', out(say('The tide turns. The swarm closes on the breakwater all at once.', 'Whoever is still out there will have to hold on. You turn to face the Tentacool.'), scene('gn-11-swarm'))),
  ]),
  rm('gn-11-breakwater-2', 'The Far End of the Breakwater', harbour({ pokemon: 'machop' }), say(
    'The Sailor has wrapped the mooring line twice round his arm. His Machop holds the other end in its teeth, eyes shut, jaw set. The boat on the line is the last one still floating.',
    'Past him, the small girl sits cross-legged with her Psyduck. She isn\'t frightened. She is pointing at the reef, and has been, the whole time.',
  ), [
    rescue('sailor', 'Help the Sailor and his Machop.',
      'Your Pokémon takes the line. The Machop lets go for the first time in an hour and sits down hard. The Sailor says it can brace a pylon if you need one dropped.',
      'Two turns of hauling, side by side with the Machop. It lets go for the first time in an hour. The Sailor says it can brace a pylon if you need one dropped.', 'gn-11-breakwater-2'),
    rescue('girl', 'Carry the girl and her Psyduck back.',
      'She holds the Psyduck very tightly and keeps her eyes on the reef the whole way. "It keeps looking at the same place," she says. "There. Look."',
      'It takes two turns. She holds the Psyduck very tightly and keeps her eyes on the reef. "It keeps looking at the same place," she says. "There. Look."', 'gn-11-breakwater-2'),
    ch('Back along the breakwater.', out('You pick your way back to the others.', scene('gn-11-breakwater'))),
  ]),
  rm('gn-11-swarm', 'The Swarm', harbour({ pokemon: 'tentacool' }), 'The Tentacool come up the stones in a wave, stinging, glassy, and a long way from calm.', [
    chIf([is('kaiju-ned')], 'Fight the swarm.', fight('Old Ned casts once, long and lazy. A Tentacool sails out of the swarm on the end of his line. "One fewer," he says. The rest come at you.', swarmFight(undefined))),
    chIf([not('kaiju-ned')], 'Fight the swarm.', fight('Two of them reach the top of the stones together.', swarmFight('doubles'))),
  ]),
  rm('gn-11-seawall', 'The Sea Wall', harbour(), say(
    'It reaches the sea wall. Pylons and cranes stand along it, four of them, leaning in the wind.',
    'It drags one arm along the wall, feeling for something. It doesn\'t look at the town at all.',
    '**Ffion:** "Drop one on it! It\'ll stop it a breath. It\'ll also make it angry. Your call."',
  ), [
    chIf([is('kaiju-pylons', 0, 3), test('moveType', { types: ['fighting', 'rock', 'steel'] })], 'Drop a pylon on it.', out(say(
      'Your Pokémon hits the footing. The pylon groans, tips, and comes down across its arms.',
      'It stops, stunned, for one breath. When it moves again, it moves faster, and it is angry now.',
    ), flag('kaiju-pylons'), cap('kaiju-pylons', 4),
    when('kaiju-sailor', { min: 1 }, [flag('kaiju-braced')], 'The Sailor\'s Machop braces the pylon with its shoulder. The stun holds for two breaths.'),
    scene('gn-11-seawall'))),
    ch('Follow it to the reef.', out('It leaves the wall behind. You follow it along the shore toward the reef.', scene('gn-11-reef')), {
      branches: [{ when: [is('kaiju-pylons', 0, 0)], text: 'You leave the pylons standing. It leaves the wall behind, calm, still looking. You follow it toward the reef.', effects: [scene('gn-11-reef')] }],
    }),
  ]),
  rm('gn-11-reef', 'The Reef', harbour({ pokemon: 'tentacool' }), say(
    '*It stops. It turns its back on the town. It lowers itself over one patch of reef, and it doesn\'t move from it.*',
    '*It isn\'t attacking anything now. It\'s guarding.*',
    'Under it, caught in a net, is a Tentacool. Small. Hurt. The net\'s float has a factory stamp on it.',
  ), [
    chIf([test('cutter')], 'Cut the net.', out(say(
      'One of your Pokémon goes for the net. The rest stand between it and the Kaiju, which panics, swinging blind, because something is near its little one.',
      'Two turns. The cords part. The net falls away.',
    ), hurt(0.15), when('kaiju-pylons', { min: 1 }, [hurt(0.05)], 'It is angry from the pylons. Its swings land harder.'), when('kaiju-pylons', { min: 3 }, [hurt(0.05)]),
    flag('kaiju-freed'), ...KAIJU_DONE, scene('gn-11-freed'))),
    ch('Break its last shield.', fight(say(
      'You step out onto the reef. It rises to meet you, and the bay rises with it.',
      'Three shield bars glow across its body. Out in the shallows, the Tentacool gather to its call.',
    ), {
      kind: 'raid', raidId: 'kaiju-tentacruel', name: 'Kaiju Tentacruel', levelBonus: -1, flagMods: KAIJU_MODS,
      win: [flag('kaiju-won'), ...KAIJU_DONE, scene('gn-11-sinks')],
      lose: [...SWARM_LOST],
    })),
    takeFloat('gn-11-reef', 'You wade out and pull the float free of the cords. Under the weed, pressed into the plastic:'),
  ]),
  rm('gn-11-freed', 'The Small One', harbour({ pokemon: 'tentacool' }), say(
    '*The Kaiju goes still the moment the net falls away. It lifts the small one in two tentacles. It looks at you for a long time.*',
    'Then it sets the small one down in the shallows at your feet, and waits.',
  ), [
    chIf([not('kaiju-kept')], 'Hold out a hand.', out(say(
      'The small Tentacool drifts to you. Behind it, the Kaiju lowers itself, slowly, into the bay, watching the whole way down.',
      'It is the one from the net. It stays.',
    ), PSYDUCK_GIRL, { ...join({ species: ['tentacool'], lv: -6 }), ability: 'huge-power', moves: ['liquidation'] }, item('poison-barb'), item('mystic-water'), flag('kaiju-kept'),
    moment('The Kaiju Tentacruel lifted its little one out of the net, looked at you for a long time, and let it go with you.', 75), scene('gn-11-freed'))),
    takeFloat('gn-11-freed', 'The float is still in the cut net. Under the weed:'),
    chIf([is('kaiju-kept')], 'Leave the harbour.', out(say('Ffion watches the bay close over it. "Right," she says. "Pier first."', PIER), flag('kaiju-left'))),
  ]),
  rm('gn-11-sinks', 'It Sinks', harbour(), say(
    'The last shield breaks. It sinks, slowly, and drags itself off the reef. It does not go far. It stays in the deep water, watching the net.',
    'The small one\'s still caught. Someone wades out with a knife and cuts it free, and it swims, crooked, to the big shape waiting in the dark.',
  ), [
    takeFloat('gn-11-sinks', 'The float is still tangled in the cut net. Under the weed:'),
    ch('Leave the harbour.', out(say('Ffion looks at the wreck of her pier for a while. "It wasn\'t after us," she says. "I know that. Doesn\'t help."', PIER), flag('kaiju-left'))),
  ]),
  rm('gn-11-retreat', 'It Retreats', harbour(), say(
    'It turns from the reef, past the breakwater, out into the bay, and the harbour market slams its shutters for the day.',
    'When the water settles, the girl with the Psyduck and Old Ned wade out to the reef together. Ned has a bread knife. They cut the small one free, and the Kaiju takes it, and goes.',
    'You get nothing. The town is still standing.',
  ), [ch('Walk back into town.', out('Ffion claps you on the shoulder as you pass. She doesn\'t say anything. She doesn\'t have to.', flag('kaiju-left'), flag('kaiju-done')))]),
  // Afterstory: freed, it comes back once, as an ally, in a sea battle later in the run.
  gev('gn-11-return', 'Something Rises', harbour({ stop: 'event', rarity: 'rare', types: ['water'], requires: [is('kaiju-freed'), not('kaiju-returned'), laterStage('kaiju-at')] }), say(
    'A trawler with no name painted on it is dragging a net through the shallows. The net is full of Tentacool.',
    'Two crewmen see you watching. They don\'t like being watched. They let their Pokémon out.',
  ), [
    ch('Stand in their way.', fight(say(
      'You step onto the jetty. Behind you, the water bulges.',
      '*A tentacle the size of a mast rises out of the bay and lays itself, gently, beside your Pokémon. It remembers you.*',
    ), trainer('Net Crew', { cls: 'roughneck', size: 3, format: 'doubles', lv: 1, types: ['water', 'poison'], ally: 'tentacruel', friendly: true, lose: [flag('kaiju-returned')], win: [flag('kaiju-returned'), kindness(1), moment('The Kaiju Tentacruel rose out of the sea to fight beside you.', 70)] }))),
    ch('Let it go.', leave('You walk on. Out in the bay, something very large follows the trawler, just under the surface.')),
  ]),
];
const KANTO_KAIJU: Json = { ...gev('cs-kanto-vermilion-kaiju', 'Kaiju Tentacruel', harbour({ stop: 'event', rarity: 'common', types: ['water'], requires: [not('kaiju-entered'), not('kaiju-done')] }), KAIJU_OPEN, KAIJU_DOOR), canon: 'cs.kanto.vermilion.kaiju' };

// =====================================================================================================================
// gn.12  MAIDEN'S PEAK  (Pseudo Stage + Hub: a walkable market and a six-node chase; Town node, until towns exist step 9, optional)
// =====================================================================================================================
const MAIDEN_TINT = '#3b2f52';
const peak = (o: Json = {}): Json => ({ tint: MAIDEN_TINT, tags: ['Mystery', 'Shop', 'Story'], effect: 'none', ...o });
const toSquare = (n: 1 | 2 | 3, label = 'Back to the square.'): Json => ch(label, out('You step back into the crowd. Somebody is selling lanterns shaped like Pokémon. Everybody is laughing.', scene(n === 1 ? 'gn-12-square' : `gn-12-square-${n}`)));
const buy = (label: string, price: number, text: string, back: string, ...effects: Json[]): Json => ch(`${label} (₽${price.toLocaleString('en-GB')})`, out(text, $(-price), ...effects, scene(back)), { requires: [{ kind: 'money', atLeast: price }] });

/** TM Hall: two boards of 24 moves (eight types, three each); the board changes each visit; the price goes by power (₽20 a point). */
const BOARDS: { type: string; name: string; moves: [string, string, number][] }[][] = [
  [
    { type: 'fire', name: 'Fire', moves: [['flamethrower', 'Flamethrower', 90], ['fire-blast', 'Fire Blast', 110], ['heat-wave', 'Heat Wave', 95]] },
    { type: 'water', name: 'Water', moves: [['surf', 'Surf', 90], ['hydro-pump', 'Hydro Pump', 110], ['scald', 'Scald', 80]] },
    { type: 'grass', name: 'Grass', moves: [['energy-ball', 'Energy Ball', 90], ['giga-drain', 'Giga Drain', 75], ['leaf-storm', 'Leaf Storm', 130]] },
    { type: 'electric', name: 'Electric', moves: [['thunderbolt', 'Thunderbolt', 90], ['thunder', 'Thunder', 110], ['volt-switch', 'Volt Switch', 70]] },
    { type: 'ice', name: 'Ice', moves: [['ice-beam', 'Ice Beam', 90], ['blizzard', 'Blizzard', 110], ['icicle-crash', 'Icicle Crash', 85]] },
    { type: 'ground', name: 'Ground', moves: [['earthquake', 'Earthquake', 100], ['earth-power', 'Earth Power', 90], ['high-horsepower', 'High Horsepower', 95]] },
    { type: 'psychic', name: 'Psychic', moves: [['psychic', 'Psychic', 90], ['psyshock', 'Psyshock', 80], ['zen-headbutt', 'Zen Headbutt', 80]] },
    { type: 'fairy', name: 'Fairy', moves: [['dazzling-gleam', 'Dazzling Gleam', 80], ['draining-kiss', 'Draining Kiss', 50], ['play-rough', 'Play Rough', 90]] },
  ],
  [
    { type: 'fighting', name: 'Fighting', moves: [['close-combat', 'Close Combat', 120], ['aura-sphere', 'Aura Sphere', 80], ['drain-punch', 'Drain Punch', 75]] },
    { type: 'rock', name: 'Rock', moves: [['stone-edge', 'Stone Edge', 100], ['rock-slide', 'Rock Slide', 75], ['power-gem', 'Power Gem', 80]] },
    { type: 'steel', name: 'Steel', moves: [['flash-cannon', 'Flash Cannon', 80], ['iron-head', 'Iron Head', 80], ['heavy-slam', 'Heavy Slam', 80]] },
    { type: 'dark', name: 'Dark', moves: [['dark-pulse', 'Dark Pulse', 80], ['crunch', 'Crunch', 80], ['knock-off', 'Knock Off', 65]] },
    { type: 'ghost', name: 'Ghost', moves: [['shadow-ball', 'Shadow Ball', 80], ['shadow-claw', 'Shadow Claw', 70], ['hex', 'Hex', 65]] },
    { type: 'dragon', name: 'Dragon', moves: [['dragon-pulse', 'Dragon Pulse', 85], ['dragon-claw', 'Dragon Claw', 80], ['outrage', 'Outrage', 120]] },
    { type: 'poison', name: 'Poison', moves: [['sludge-bomb', 'Sludge Bomb', 90], ['poison-jab', 'Poison Jab', 80], ['sludge-wave', 'Sludge Wave', 95]] },
    { type: 'flying', name: 'Flying', moves: [['air-slash', 'Air Slash', 75], ['brave-bird', 'Brave Bird', 120], ['hurricane', 'Hurricane', 110]] },
  ],
];
const boardRoom = (b: number, i: number): Json => {
  const t = BOARDS[b]![i]!;
  return rm(`gn-12-tm-${b + 1}-${t.type}`, `TM Hall: ${t.name}`, peak(), say(`The ${t.name} case. Three discs on velvet, a price card under each. The clerk polishes the glass while you look.`, 'The price goes by power. The clerk says the board changes every visit. The clerk says this every visit.'), [
    ...t.moves.map(([mv, nm, power]) => buy(`TM ${nm}`, power * 20, `The disc hums in the reader. ${nm} is taught on the spot.`, `gn-12-tm-${b + 1}`, { kind: 'teachMove', move: mv, type: t.type })),
    ch('Back to the cases.', out('You go back along the cases.', scene(`gn-12-tm-${b + 1}`))),
  ]);
};
const caseCh = (b: number, i: number): Json => ch(`The ${BOARDS[b]![i]!.name} case.`, out(`You lean over the ${BOARDS[b]![i]!.name} case.`, scene(`gn-12-tm-${b + 1}-${BOARDS[b]![i]!.type}`)));
/** One board: the door wall (cases 1-3), the far wall (4-6), the last wall (7-8), and a room for each case. */
const tmHall = (b: number): Json[] => [
  rm(`gn-12-tm-${b + 1}`, 'TM Hall', peak(), say(
    'A long hall of glass cases, each with labelled discs. A board at the door lists the twenty-four moves on offer today, grouped by type.',
    '"Pick the move," says the clerk. "Not the disc. The move."',
  ), [caseCh(b, 0), caseCh(b, 1), caseCh(b, 2), ch('Further along the hall.', out('The far wall.', scene(`gn-12-tm-${b + 1}-b`)))]),
  rm(`gn-12-tm-${b + 1}-b`, 'TM Hall: The Far Wall', peak(), 'The far wall of the hall: three more cases, and two more by the back door.', [caseCh(b, 3), caseCh(b, 4), caseCh(b, 5), ch('The last wall.', out('Two more cases, by the back door.', scene(`gn-12-tm-${b + 1}-c`)))]),
  rm(`gn-12-tm-${b + 1}-c`, 'TM Hall: The Last Wall', peak(), 'The last two cases, by the back door.', [caseCh(b, 6), caseCh(b, 7), ch('Back to the door.', out('You go back to the door.', scene(`gn-12-tm-${b + 1}`))), toSquare(1)]),
  ...BOARDS[b]!.map((_, i) => boardRoom(b, i)),
];

/** The villagers' names for her: each different, every one sure. */
const HER_NAMES = ['"That\'s Marguerite. Everyone knows that."', '"Oh, that\'s Old Ilse. Was. Is. You know."', '"Her name was Sorrel. My grandmother told me."', '"Wenna. Wenna of the ships. Obviously."', '"She\'s called the Lady. That\'s her name. The Lady."'];
const ASK_HER: Json[] = [pick('maiden-name', 1, 1, 1, 1, 1), ...HER_NAMES.map((t, i) => when('maiden-name', { min: i + 1, max: i + 1 }, [], `${t} They say it like it\'s the weather.`))];

/** The first three sightings: the player picks a way. The right way is the one the crowd isn't looking: `a` rooms (right is right), `b` (left). */
const SIGHTINGS: { n: number; where: string; seen: string; left: string; a: string; b: string }[] = [
  { n: 1, where: 'The End of Lantern Row', seen: 'A veil, turning a corner.', left: 'a petal, pale pink, on the cobbles',
    a: 'On the left, a juggler has every face in the street turned his way. On the right, the few people by the wall all have their backs to the lane.',
    b: 'On the right, a juggler has every face in the street turned his way. On the left, the few people by the wall all have their backs to the lane.' },
  { n: 2, where: 'Across Swap Alley', seen: 'A lantern, held low, moving against the crowd.', left: 'a ribbon, tied to a railing in a bow',
    a: 'On the left, a trader is shouting prices, and everyone near him is watching. On the right, two old men play cards with their backs to the passage.',
    b: 'On the right, a trader is shouting prices, and everyone near him is watching. On the left, two old men play cards with their backs to the passage.' },
  { n: 3, where: 'Above Egg Row', seen: 'A laugh, on the bridge above you. Nobody is on the bridge.', left: 'a wet footprint, small, on dry stone',
    a: 'On the left, the egg-sellers are all looking up at the bridge. On the right, a queue faces the hatchery, every back turned to the stair.',
    b: 'On the right, the egg-sellers are all looking up at the bridge. On the left, a queue faces the hatchery, every back turned to the stair.' },
];
const sightRoom = (s: (typeof SIGHTINGS)[number], v: 'a' | 'b'): Json => {
  const rightWay = v === 'a' ? 'right' : 'left';
  const go = (way: 'left' | 'right'): Json => {
    const right = way === rightWay;
    const next: Json[] = s.n < 3 ? [roll(`maiden-way-${s.n + 1}`, 50), route(`maiden-way-${s.n + 1}`, `gn-12-see-${s.n + 1}-a`, `gn-12-see-${s.n + 1}-b`)] : [room('gn-12-see-4')];
    return ch(way === 'left' ? 'Left.' : 'Right.', out(right
      ? `You go ${way}, where nobody is looking. There: ${s.left}. She was here a moment ago.`
      : `You go ${way}, with the crowd. Lanterns, faces, nothing. You find your way back round, slower.`, ...(right ? [flag('maiden-right')] : []), ...next));
  };
  return rm(`gn-12-see-${s.n}-${v}`, `Maiden's Peak: ${s.where}`, peak(), say(`*${s.seen}*`, 'Two ways she could have gone.', v === 'a' ? s.a : s.b), [go('left'), go('right')]);
};

const LADY_GIFTS: Json[] = [
  when('maiden-right', { min: 2 }, [item('fairy-feather'), flag('kanto-maiden-blessing'), flag('maiden-blessing')],
    'And because you came the short way, and she turned, and she saw you: a Fairy Feather, light as nothing. Down the hill, the Tea House lanterns light one by one. They will stay lit.'),
];
const gn12: Json[] = [
  gev('gn-12-door', "Maiden's Peak", peak({ stop: 'event', rarity: 'rare', types: ['fairy', 'ghost'], requires: [not('maiden-done')] }), say(
    'A cliff town, all stairs and lanterns. It is festival week. The old woman selling tea says it is always festival week.',
    'Above the market, at the far end of a street, a woman in a veil is walking away. She does not hurry. She does not look back.',
  ), [
    ch('Walk into the market.', out('The crowd takes you in. Somewhere ahead, a lantern turns a corner.', flag('maiden-entered'), stampRegion('maiden-region'), room('gn-12-square'))),
    ch('Not today.', leave('You keep to the road. Behind you, festival music, and one lantern, high up, that does not move with the wind.')),
  ]),
  rm('gn-12-square', "Maiden's Peak: The Market", peak(), say(
    'Lantern Row and the TM Hall open off the square. Further in: Swap Alley, Egg Row, the stalls, the dusk lanes, the Tea House.',
    'At the end of Lantern Row, a veil turns a corner.',
  ), [
    ch('Lantern Row.', out('Paper lanterns overhead, shelves of medicine underneath. Everything costs a little more here.', scene('gn-12-lantern'))),
    ch('The TM Hall.', out('A long hall of glass cases. The board by the door has changed again.', roll('maiden-board', 50), when('maiden-board', { min: 0, max: 0 }, [scene('gn-12-tm-1')]), when('maiden-board', { min: 1 }, [scene('gn-12-tm-2')]))),
    ch('Further into the market.', out('You push deeper in.', scene('gn-12-square-2'))),
    ch('Run after the veil.', out('You leave the stalls behind and run.', flag('maiden-chase'), roll('maiden-way-1', 50), route('maiden-way-1', 'gn-12-see-1-a', 'gn-12-see-1-b'))),
  ]),
  rm('gn-12-square-2', "Maiden's Peak: Swap Alley and Egg Row", peak(), 'Traders in every doorway, warm baskets, painted stalls, a man with a stack of sealed boxes. The lane carries on toward the cliff.', [
    ch('Swap Alley.', out('Traders call from every doorway.', scene('gn-12-swap'))),
    ch('Egg Row.', out('Baskets of warm eggs and a very old man with a very serious face.', scene('gn-12-eggs'))),
    ch('The Costume Stalls and the Mystery Boxes.', out('Ribbons on spools. Sealed boxes stacked to the awning.', scene('gn-12-stalls'))),
    ch('Further in.', out('The lanes get older and narrower.', scene('gn-12-square-3'))),
  ]),
  rm('gn-12-square-3', "Maiden's Peak: The Old Lanes", peak({ pokemon: 'gastly' }), 'The dusk lanes, a fortune teller\'s curtain, and at the very back of the market, the Tea House.', [
    ch('The Dusk Vendors.', out('A lane of trays.', scene('gn-12-dusk'))),
    ch('The Fortune Teller.', out('A bead curtain, and the smell of incense.', scene('gn-12-roux'))),
    ch('The Tea House.', out('An old woman is already pouring.', scene('gn-12-tea'))),
    toSquare(1),
  ]),
  rm('gn-12-lantern', 'Lantern Row', peak(), say('Poké Balls, status cures, out-of-battle supplies. Prices are ten per cent higher than anywhere else; nobody minds.', 'At the end of the row, a veil turns a corner.'), [
    buy('Poké Balls ×5', 1100, 'Five Poké Balls, wrapped in festival paper.', 'gn-12-lantern', item('poke-ball', 5)),
    buy('Full Heal ×2 and Super Potion ×2', 1540, 'The stallholder adds a lantern-shaped sweet for free.', 'gn-12-lantern', item('full-heal', 2), item('super-potion', 2)),
    toSquare(1),
  ]),
  ...tmHall(0), ...tmHall(1),
  rm('gn-12-swap', 'Swap Alley', peak({ pokemon: 'meowth' }), say(
    'The trading district. Three traders hold up cards: what they will take, and roughly what they give. Each card is honest.',
    'Ask anyone who the lady is, and they will tell you. Ask two, and you will get two names.',
  ), [
    ch('The first card: something of similar strength.', out('A handshake, a swap of Poké Balls.', { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { region: true, bst: 20 }, honest: true }, scene('gn-12-nature'))),
    ch('The second card: a little further off.', out('The trader grins. "A little gamble. Not much of one."', { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { region: true, bst: 60 }, honest: true }, scene('gn-12-nature'))),
    ch('The third card: anything goes.', out('"No promises," says the third trader, "except that it\'s alive and it\'s yours."', { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { region: true, bst: 200 }, honest: true }, scene('gn-12-nature'))),
    toSquare(2),
  ]),
  // Swap Alley: each trade comes with a choice of nature (the doc). The trader's apprentice knows four tricks.
  rm('gn-12-nature', 'Swap Alley: A Choice of Nature', peak({ pokemon: 'meowth' }), say(
    'The trader\'s apprentice looks your new Pokémon over. "First day with you. It could go a few ways. Which way do you want it to go?"',
  ), [
    ch('Bold and steady (Adamant).', out('It squares its shoulders.', gn('natureLast', { key: 'adamant' }), scene('gn-12-swap'))),
    ch('Quick on its feet (Jolly).', out('It bounces, twice.', gn('natureLast', { key: 'jolly' }), scene('gn-12-swap'))),
    ch('Clever and careful (Modest).', out('It sits down and thinks about it.', gn('natureLast', { key: 'modest' }), scene('gn-12-swap'))),
    ch('Leave it as it is.', out('"Good answer," says the apprentice.', scene('gn-12-swap'))),
  ]),
  rm('gn-12-eggs', 'Egg Row', peak({ pokemon: 'togepi' }), say('Mystery eggs in straw. A warm-sand hatchery. Egg traders. And the Egg Move Tutor, who teaches one egg move a visit and charges by how rare it is.', 'Above the row, on a stone bridge, somebody laughs.'), [
    buy('A mystery Egg', 1500, 'It is warm in your hands, and it moves once.', 'gn-12-eggs', egg({ left: 3, unit: 'battle' })),
    ch('Trade a Pokémon for a sand-warmed Egg.', out('The hatchery keeper digs an Egg out of the warm sand. "It\'s nearly there," she says. It hatches after your next battle.', { kind: 'tradeAway', want: { label: 'a Pokémon of yours' } }, egg({ left: 1, unit: 'battle' }), scene('gn-12-eggs'))),
    buy('The Egg Move Tutor', 1000, 'The old man whispers a secret to your lead. It looks at you, startled, as if it had always known.', 'gn-12-eggs', eggMove()),
    toSquare(2),
  ]),
  rm('gn-12-stalls', 'The Costume Stalls and the Mystery Boxes', peak(), say(
    'Outfits on hooks for trainers, ribbons on spools for their Pokémon. Next door, sealed boxes, ₽1,000 each. The odds are printed on every lid, in small, honest letters:',
    '*Ultra Ball 40% · Rare Candy 30% · Nugget 20% · Ability Capsule 9% · Master Ball 1%*',
  ), [
    buy('A festival ribbon for your lead', 500, 'Your lead wears it proudly, and keeps checking it is still there.', 'gn-12-stalls', bond(1), moment('Wore a festival ribbon from Maiden\'s Peak.', 40)),
    buy('Ribbons for the whole team', 1500, 'A ribbon each. They compare them.', 'gn-12-stalls', { kind: 'friendship', amount: 3, who: 'party' }),
    buy('A sealed Mystery Box', 1000, 'You shake it. It rattles. You open it.', 'gn-12-stalls', ...weighted('maiden-box', [['ultra-ball', 40], ['rare-candy', 30], ['nugget', 20], ['ability-capsule', 9], ['master-ball', 1]])),
    toSquare(2),
  ]),
  rm('gn-12-dusk', 'The Dusk Vendors', peak({ pokemon: 'haunter' }), say(
    'Ghost-types with trays. They only open at dusk; before then the trays are empty and the lane is cold.',
    'They sell Spell Tags, Dusk Stones and Reaper Cloths, and they take payment in Berries. Nobody knows what they do with the Berries.',
    'Behind them, the Ghost-types all turn, at once, to look at the same empty place. On one tray: frost, in the shape of a hand.',
  ), [
    chIf([at('evening'), test('holdsBerry')], 'A Spell Tag, for a Berry.', out('A Gastly takes the Berry very carefully, as if it might be hot.', gn('payBerry'), item('spell-tag'), scene('gn-12-dusk'))),
    chIf([at('evening'), test('holdsBerry')], 'A Dusk Stone, for a Berry.', out('A Haunter drops the stone into your hand. It is cold, and it stays cold.', gn('payBerry'), item('dusk-stone'), scene('gn-12-dusk'))),
    chIf([at('evening'), test('holdsBerry')], 'A Reaper Cloth, for a Berry.', out('The cloth folds itself before you can.', gn('payBerry'), item('reaper-cloth'), scene('gn-12-dusk'))),
    toSquare(3),
  ]),
  rm('gn-12-roux', 'The Fortune Teller', peak(), say(
    '**Madame Roux**, in a different shawl. She does not look up from the cards.',
    '"One true thing about where you\'re going next. Only one. The rest you can find out like everybody else."',
  ), [
    buy('Cross her palm', 600, 'She turns one card, and tells you a true thing. You will remember it on the next stage.', 'gn-12-roux', ...weighted('maiden-roux', [['roux-wild', 1], ['roux-trainers', 1], ['roux-gym', 1]])),
    toSquare(3),
  ]),
  rm('gn-12-tea', 'The Tea House', peak(), say(
    'A full rest. An old woman pours.',
    '**The old woman:** "My mother saw her. Her mother saw her. She\'s waiting for a ship. Don\'t ask me which. I asked my mother, and she changed the subject."',
  ), [
    ch('Rest and drink.', out('Your whole team sleeps like logs in the warm. When you wake, the tea is still hot.', heal(1), scene('gn-12-tea'))),
    ch('Ask who the lady is.', out('The old woman thinks about it.', ...ASK_HER, scene('gn-12-tea'))),
    toSquare(3),
  ]),
  ...SIGHTINGS.flatMap((s) => [sightRoom(s, 'a'), sightRoom(s, 'b')]),
  rm('gn-12-see-4', "Maiden's Peak: Behind the Dusk Vendors", peak({ pokemon: 'haunter' }), say(
    '*The Ghost-types all turn to look at the same empty place.*',
    'You look where they look. There is nobody. On a tray, frost, in the shape of a hand, melting.',
  ), [ch('Keep going.', out('Up toward the cliff stairs.', room('gn-12-see-5')))]),
  rm('gn-12-see-5', "Maiden's Peak: The Cliff Stairs", peak(), say(
    '*A reflection in a shop window, walking up.*',
    'You turn round. The stairs behind you are empty. In the window, she keeps climbing.',
  ), [ch('Climb.', out('Nothing is left on the stairs. Just the stairs, and the top of them.',
    when('lantern-boat', { min: 1 }, [], 'In the window, just before she is gone, you see what she is carrying: a paper boat.'),
    room('gn-12-top')))]),
  rm('gn-12-top', "Maiden's Peak: The Cliff", peak(), say(
    'The cliff. The sea. A statue of a woman looking out.',
    '*She\'s at the edge. Her back\'s to you. Her hair moves in a wind you can\'t feel.*',
    '*She turns.*',
    '*She isn\'t there.*',
    '*On the stone where she stood: something small, and bright.*',
    'The statue on the cliff has her face.',
  ), [
    chIf([hasNot('fairium-z')], 'Pick it up.', out('A Z-Crystal, humming with a Fairy light. Fairium Z.', item('fairium-z'), flag('kanto-maiden-zcrystal'), ...LADY_GIFTS, flag('maiden-done'), flag('maiden-top'), leavePseudo())),
    chIf([has('fairium-z')], 'Pick them up.', out('You already hold her crystal. She left three Fairy HMs instead: Dazzling Gleam, Play Rough, Moonblast.', item('hm-dazzling-gleam'), item('hm-play-rough'), item('hm-moonblast'), flag('kanto-maiden-hms'), ...LADY_GIFTS, flag('maiden-done'), flag('maiden-top'), leavePseudo())),
  ]),
  // The Lady's Blessing: the Tea House stays open as a hub for the rest of the run (a stop on every later stage).
  gev('gn-12-teahouse', 'The Tea House', peak({ stop: 'event', rarity: 'common', callback: true, types: ['fairy'], requires: [is('maiden-blessing'), notThisStage('maiden-tea-at')] }), say(
    'A lantern you would know anywhere, hanging over a door that was not here yesterday. Inside, the old woman from Maiden\'s Peak is pouring.',
    '"She said you\'d be by," she says. "She doesn\'t usually say."',
  ), [
    ch('Rest and drink.', out('A full rest, and tea that is still hot when you wake.', heal(1), stampStage('maiden-tea-at'), again('gn-12-teahouse'))),
    ch('Not now.', out('"It\'ll be here," she says.', stampStage('maiden-tea-at'), again('gn-12-teahouse'))),
  ]),
  // Afterstory: her portrait hangs in one shop in every later region, a little older in each.
  gev('gn-12-portrait', 'A Portrait', peak({ stop: 'event', rarity: 'common', callback: true, types: ['fairy'], requires: [is('maiden-top'), notThisRegion('maiden-region'), notThisRegion('maiden-portrait-at')] }), say(
    'In a shop that sells nothing you need, a portrait hangs behind the counter. A woman at a cliff edge, looking out to sea.',
    'It is her. She is a little older than she was.',
  ), [ch('Look a while.', out('The shopkeeper says it came with the building. You don\'t ask which building.', stampRegion('maiden-portrait-at'), again('gn-12-portrait')))]),
];
const KANTO_MAIDEN: Json = { ...gev('cs-kanto-vermilion-maiden', "Maiden's Peak", peak({ stop: 'event', rarity: 'common', types: ['fairy'], requires: [not('maiden-done'), not('maiden-entered')] }), (gn12[0] as { intro: string }).intro, (gn12[0] as { choices: Json[] }).choices), canon: 'cs.kanto.vermilion.maiden' };

// =====================================================================================================================
// gn.13  FLIGHT NORTH  (a must-see check on step 17, before the battle, no badge; half the time a seven-node pseudo stage at levels 5 to 20)
// The return ("Second Wind") after a lost run is core/instrumentality/flightNorth.ts (Beta 0.7): it reads `kanto-flight-bug` and the Bug-type's name.
// =====================================================================================================================
const FLIGHT_TINT = '#2f5d73';
const north = (o: Json = {}): Json => ({ tint: FLIGHT_TINT, tags: ['Story', 'Pokémon', 'Evil Team'], effect: 'none', ...o });
const fn = (action: 'name' | 'trust', name?: string): Json => ({ kind: 'flightNorth', action, ...(name ? { name } : {}) });
const NAMES = ['Pip', 'Nettle', 'Thimble', 'Button'];
/** Its line: Weedle when flag `flight-weedle` is 1, else Caterpie. */
const asBug = (caterpie: Json[], weedle: Json[]): Json[] => [when('flight-weedle', { min: 0, max: 0 }, caterpie), when('flight-weedle', { min: 1 }, weedle)];
const EVOLVE_COCOON: Json[] = [{ kind: 'formChange', from: 'caterpie', to: 'metapod' }, { kind: 'formChange', from: 'weedle', to: 'kakuna' }];
const EVOLVE_FINAL: Json[] = [{ kind: 'formChange', from: 'metapod', to: 'butterfree' }, { kind: 'formChange', from: 'kakuna', to: 'beedrill' }, { kind: 'formChange', from: 'caterpie', to: 'butterfree' }, { kind: 'formChange', from: 'weedle', to: 'beedrill' }];
/** Inside: the bag is empty and there are no Poké Balls, so nothing is caught and no item is used. */
const inFlight = (battle: Json): Json => ({ ...battle, pseudo: true, rule: { noCatch: true, noItems: true, ...((battle.rule as Json | undefined) ?? {}) } });
const FLOCK = (text: string): Json => when('flight-flock', { min: 1 }, [], text);
const THEFT_ODDS: Json = gn('roll', {
  key: 'flight-stolen', n: 50, mods: [
    { when: [{ kind: 'gn', test: 'lookAtLevel', types: ['squad-lesser', 'squad-leader'], key: 'gn-none' }], n: -5 },
    { when: [{ kind: 'evil', heat: 6 }], n: -5 },
    { when: [is('ssanne-trio-seen')], n: 5 },
  ],
});
const THEFT = say(
  '*A shadow. You look up.*',
  '**Jessie:** "Prepare for trouble!"',
  '**James:** "And you know the rest; we\'re on a schedule!"',
  '*A net. A hook. A vacuum hose with a funnel on it.*',
  '**Meowth:** "All of \'em! Even da little one! Meowth, dat\'s right!"',
  '*Your lead reaches for you through the net. Then the balloon\'s a dot. Then it\'s nothing.*',
);
const FLIGHT_CHECK: Json[] = [
  ch('Keep walking.', out('You keep walking.',
    flag('flight-checked'), THEFT_ODDS,
    partyHas('flight-had-caterpie', 'caterpie', 'metapod', 'butterfree'), partyHas('flight-had-weedle', 'weedle', 'kakuna', 'beedrill'),
    when('flight-stolen', { min: 0, max: 0 }, [], 'Nothing. A balloon crosses the sky, far off. It has a cat\'s face. Your Pokémon watch it all the way to the horizon, and walk a little closer to you after.'),
    when('flight-stolen', { min: 1 }, [gn('stash'), flag('kanto-flight-stolen'), room('gn-13-bully')], THEFT),
  )),
];

const gn13: Json[] = [
  gev('gn-13-check', 'Flight North', north({ stop: 'event', rarity: 'rare', forced: true, types: ['normal', 'flying'], pokemon: 'meowth', requires: [not('flight-checked')] }), say(
    'The road north runs between high grass and a wide, empty sky.',
    'Somewhere above you, very faintly, three voices are clearing their throats.',
  ), FLIGHT_CHECK),
  rm('gn-13-bully', 'Flight North: The Bully', north({ pokemon: 'spearow' }), say(
    '*Grass. Sky. You sit up. The belt\'s empty. The bag\'s empty. Even the Poké Balls are gone.*',
    'A Spearow lands on your chest and pecks. You have nothing to fight it with. There is nobody to call.',
  ), [
    ch('Cover your head.', out(say(
      '*Then something small hits the Spearow from the side like a thrown shoe.*',
      '*The Spearow goes over. The small thing stands there, wobbling.*',
      '*It looks at what it\'s done. It looks at you. It\'s as surprised as you are.*',
    ),
    roll('flight-weedle', 50), when('flight-had-caterpie', { min: 1 }, [setTo('flight-weedle', 0)]), when('flight-had-weedle', { min: 1 }, [setTo('flight-weedle', 1)]),
    ...asBug([{ ...join({ species: ['caterpie'] }), level: 5, direct: true }, flag('kanto-flight-bug', 1)], [{ ...join({ species: ['weedle'] }), level: 5, direct: true }, flag('kanto-flight-bug', 2)]),
    pick('flight-name', 1, 1, 1, 1), ...NAMES.map((n, i) => when('flight-name', { min: i + 1, max: i + 1 }, [fn('name', n)], `It needs a name. You call it ${n}. (You can call it something else from your party.)`)),
    room('gn-13-meadow')), {
      branches: [{ when: [{ kind: 'gn', test: 'thisRegion', key: 'spearow-seen-region' }], text: say(
        'You know this Spearow. It\'s from the flock by the branch, the one that fought the Pidgey. Its flock wheels overhead, watching.',
        '*Then something small hits it from the side like a thrown shoe. The Spearow goes over. The small thing stands there, wobbling, as surprised as you are.*',
      ), effects: [
        setTo('flight-flock', 1), roll('flight-weedle', 50), when('flight-had-caterpie', { min: 1 }, [setTo('flight-weedle', 0)]), when('flight-had-weedle', { min: 1 }, [setTo('flight-weedle', 1)]),
        ...asBug([{ ...join({ species: ['caterpie'] }), level: 5, direct: true }, flag('kanto-flight-bug', 1)], [{ ...join({ species: ['weedle'] }), level: 5, direct: true }, flag('kanto-flight-bug', 2)]),
        pick('flight-name', 1, 1, 1, 1), ...NAMES.map((n, i) => when('flight-name', { min: i + 1, max: i + 1 }, [fn('name', n)], `It needs a name. You call it ${n}. (You can call it something else from your party.)`)),
        room('gn-13-meadow'),
      ] }],
    }),
  ]),
  rm('gn-13-meadow', 'Flight North: The Meadow', north({ pokemon: 'pidgey' }), say(
    'It follows you into the long grass. Every few steps it rears up and looks round, checking you\'re still there.',
    'Two wild Pokémon are in the way. It is the only one of you that can fight. It knows it.',
  ), [ch('Let it try.', fight('It squares up, trembling, and gives two rising notes: its cry. You will know it anywhere, later.', inFlight({ kind: 'wild', species: ['rattata', 'pidgey', 'nidoran-f', 'nidoran-m', 'oddish', 'bellsprout', 'sentret', 'zigzagoon'], types: [], level: 6, chain: 2, levelBonus: 0, shinyMultiplier: 1,
    win: [{ kind: 'levels', amount: 2, who: 'lead' }, fn('trust'), FLOCK('High up, the Spearow flock passes over, once. It doesn\'t come down.'), room('gn-13-cocoon')] })))]),
  rm('gn-13-cocoon', 'Flight North: Cocoon Night', north(), say(
    '*It wins. It hops. It nearly falls over. It looks back to see if you saw.*',
    'Night, and no fire. It spins a thread and begins to wrap itself in. It isn\'t afraid of the change. It\'s afraid you won\'t be there after.',
    '*It can\'t walk now. You carry it.*',
  ), [
    ch('Carry it inside my coat.', out('You carry it against your chest, out of the wind. Through the shell, very faintly, you can feel it settle.', ...EVOLVE_COCOON, heal(1), bond(1), fn('trust'), room('gn-13-stream'))),
    ch('Carry it where it can see.', out('You carry it in your hands, held up, so it can watch the stars go over. It doesn\'t move. You think it\'s looking.', ...EVOLVE_COCOON, heal(1), bond(1), fn('trust'), room('gn-13-stream'))),
  ]),
  rm('gn-13-stream', 'Flight North: The Stream', north({ pokemon: 'poliwag' }), say(
    'At the stream, something bigger comes out of the water. Your cocoon can\'t run. It can only Harden, and wait.',
  ), [ch('Stay with it.', fight('You put yourself beside it on the stones, close enough to feel the shell tick as it hardens.', inFlight({ kind: 'wild', species: ['poliwag', 'psyduck', 'tentacool', 'goldeen'], types: [], level: 9, levelBonus: 0, shinyMultiplier: 1, rule: { noAttacks: true, surviveTurns: 4 },
    win: [{ kind: 'levels', amount: 1, who: 'lead' }, fn('trust'), room('gn-13-hatch')] })))]),
  rm('gn-13-hatch', 'Flight North: Hatching', north({ pokemon: 'pidgey' }), say(
    '*It takes every hit. It doesn\'t make a sound.*',
    'In the morning the shell splits. It comes out changed.',
    '*It\'s never had wings before. It flies into a tree. It tries again.*',
    'A flock of Pidgey lifts out of a dead oak, all at once, and turns on it.',
  ), [ch('Stand together.', fight('It doesn\'t look away from them. Neither do you.', { ...inFlight({ kind: 'wild', species: ['pidgey'], types: [], level: 10, chain: 2, levelBonus: 0, shinyMultiplier: 1,
    win: [{ kind: 'levels', amount: 4, who: 'lead' }, heal(1), fn('trust'), FLOCK('The Spearow flock passes over again, higher. This time it keeps going.'), room('gn-13-camp')] }) }, ...EVOLVE_FINAL))]),
  rm('gn-13-camp', "Flight North: The Trio's Camp", north({ pokemon: 'meowth' }), say(
    'A campfire, a balloon tethered to a tree, and by the fire, a cage. Your team is in it.',
    '*Your lead sees you through the bars. It doesn\'t make a sound either. It\'s learned that from somebody.*',
  ), [ch('Slip in from the shadows.', fight('You send it in low, out of the firelight, at the trio\'s guards.', inFlight({ kind: 'trainer', name: 'The Trio\'s Guards', team: ['ekans', 'koffing'], level: 15, size: 2, types: [], levelBonus: 0, win: [{ kind: 'levels', amount: 4, who: 'lead' }, heal(1), fn('trust'), room('gn-13-boss')] })))]),
  rm('gn-13-boss', 'Flight North: The Boss', north({ pokemon: 'venomoth' }), say(
    '**James:** "It\'s a *bug.* You\'ve come to rescue six Pokémon with a *bug.*"',
    '**Jessie:** "Venomoth, dear. Do tidy up."',
  ), [ch('Fight!', fight('It looks back at you once. Then it goes.', inFlight({ kind: 'trainer', name: 'Jessie & James', team: ['venomoth'], level: 20, size: 1, types: [], levelBonus: 0, rule: { shinyRescue: true, evolveMid: true }, win: [room('gn-13-goodbye')] }), ...EVOLVE_FINAL))]),
  rm('gn-13-goodbye', 'Flight North: Goodbye', north(), say(
    '**Meowth:** "Dere\'s TWO of \'em?!"',
    '**All three:** "We\'re blasting off agaaaain!"',
    'You open the cage. Your team pours out, every one of them talking at once, and every one of them at full strength.',
    '*The shiny one\'s waiting, on a branch, looking north.*',
  ), [ch('Say goodbye.', out(say(
    '*It looks at the shiny one. It looks at you.*',
    '*It does its victory hop, one more time. It doesn\'t fall over.*',
    '*They go.*',
  ), { kind: 'restoreParty' }, heal(1), flag('kanto-flight-gratitude'), flag('flight-done'), moment('A small Bug-type saved your whole team, then flew north.', 85), leavePseudo()))]),
];
const KANTO_FLIGHT: Json = { ...gev('cs-kanto-vermilion-flight', 'Flight North', north({ stop: 'event', rarity: 'common', types: ['normal', 'flying'], pokemon: 'meowth', requires: [not('flight-checked')] }), (gn13[0] as { intro: string }).intro, FLIGHT_CHECK), canon: 'cs.kanto.vermilion.flightnorth' };

// =====================================================================================================================
// gn.14  SABRINA'S LABYRINTH  (a door on step 11, optional, instead of the battle, a "?" badge; seven nodes, the ghost L10 to L40; its return
// one region later). The rules are core/expansion/canonSaffron.ts (the ghost, the lanterns, the reset or resume) and labyrinth.ts (the false slot).
// =====================================================================================================================
const LAB_TINT = '#2a1a40';
const lab = (o: Json = {}): Json => ({ tint: LAB_TINT, tags: ['Mystery', 'Pokémon', 'Story'], effect: 'fog', ...o });
const canon = (action: string, level?: number): Json => ({ kind: 'canon', action, species: [], ...(level ? { level } : {}) });
/** The ghost's level after each node (canonSaffron LABYRINTH_LEVELS). */
const GHOST_LV = [10, 15, 20, 25, 30, 37, 40];
const LAB_RETRY: Json[] = [canon('labRetry')];
/** A lantern opens: one of your Pokémon is freed and follows as a light, the ghost grows, and this is a lantern node, so everyone heals. */
const lantern = (n: number, next: string): Json[] => [canon('ghostFree'), canon('ghostLevel', GHOST_LV[n]), canon('labRoom', n), heal(1), room(next)];
/** A wrong answer: the room shoves back, the ghost takes it, and the trial starts over. */
const shoved = (id: string, text: string): Json => out(text, hurt(0.2), scene(id));
const inLab = (battle: Json): Json => ({ ...battle, pseudo: true });

const LAB_DOOR: Json[] = [
  ch('Read it.', out(say(
    'She turns your palm to the light. Her thumb stops in the middle of it.',
    '**Fortune-teller:** "Oh. Oh, you poor thing. Through the curtain, please. Mind the step."',
  ), flag('lab-entered'), canon('ghostStart'), room('gn-14-lost'))),
  ch('No, thank you.', leave('You keep walking. She goes on smiling at the place where you were standing.')),
];
const LAB_INTRO = say(
  '**A fortune-teller at a folding table:** "Your aura\'s very loud. Shall I read it? No charge. It\'s a special entrance."',
  'Behind her, a curtain the colour of a bruise. Something on the other side is breathing slowly.',
);

const gn14: Json[] = [
  gev('gn-14-door', "Sabrina's Labyrinth", lab({ stop: 'event', rarity: 'rare', types: ['psychic', 'ghost'], pokemon: 'mr-mime', requires: [not('lab-entered')] }), LAB_INTRO, LAB_DOOR),
  rm('gn-14-lost', "Sabrina's Labyrinth: The First Fight", lab({ pokemon: 'gengar' }), say(
    '*The party\'s Poké Balls roll off the belt, one by one, and through the walls.*',
    '*A battle starts. You reach for a Poké Ball. Your hand closes on nothing.*',
    'Someone in a hood is waiting for you to send something out. You have nobody to send.',
  ), [ch('Stand there anyway.', fight('You stand with empty hands. It doesn\'t take long.', inLab(trainer('Hooded Shape', { size: 1, types: ['ghost', 'psychic'], rule: { noItems: true, noPokemon: true }, win: [room('gn-14-ghost')], lose: [room('gn-14-ghost')] }))))]),
  rm('gn-14-ghost', "Sabrina's Labyrinth: The Companion", lab({ pokemon: 'duskull' }), say(
    '*It ends. A tombstone pushes up through the floor. The name on it is yours.*',
    '*A swarm of Ghost-types crosses the room, laughing, right to left, and is gone.*',
    '*One stays behind. It floats down. It looks at the tombstone, and then at you, standing next to it, a little see-through.*',
    '*It holds out a hand, or a string, or a sleeve.*',
  ), [
    ch('Take it.', out(say(
      'It\'s colder than a hand and warmer than you expected. When you step, it steps, a moment behind you, copying.',
      'Somewhere ahead, six small lights are waiting in the dark. You know every one of them by the way it flickers.',
    ), flag('lab-ghost-offered'), room('gn-14-n1'))),
    ch('Ask why it\'s helping.', out(say(
      'It thinks about it for a long time.',
      '*It points at the tombstone. Then at you. Then it shakes its head, very firmly, as if correcting a spelling.*',
      'It takes your sleeve and waits for you to walk first, so it can copy.',
    ), flag('lab-ghost-offered'), room('gn-14-n1'))),
  ]),
  rm('gn-14-n1', "Sabrina's Labyrinth: The Body", lab({ pokemon: 'hypno' }), say(
    'Node 1. Through a door you haven\'t opened, **your own body** stands in a room you\'ve never entered. It\'s breathing. It doesn\'t turn round.',
    'Between you and the first lantern, a trainer sways on their feet with their eyes half shut, a Poké Ball loose in one hand.',
    '*The ghost copies the way you stand, a step behind.*',
  ), [ch('Wake them with a battle.', fight('The trainer blinks at you, slowly, and throws without looking.', inLab(trainer('Sleepwalking Trainer', { size: 1, types: ['psychic', 'ghost'], rule: { matchLead: true, foeAsleep: true, noItems: true }, win: lantern(1, 'gn-14-n2'), lose: LAB_RETRY }))), {
    branches: [
      { when: [is('hoenn-cruel')], text: 'In the next room, your body turns round. It looks at you. It looks disappointed. Then the trainer throws, without looking.', effects: [] },
      { when: [is('robbed-trainer')], text: 'In the next room, your body turns round. It looks at you. It looks disappointed. Then the trainer throws, without looking.', effects: [] },
    ],
  })]),
  rm('gn-14-n2', "Sabrina's Labyrinth: The Mirror", lab({ pokemon: 'mr-mime' }), say(
    'Node 2. A tall mirror fills the far wall. In it, the lantern hangs on your right. On your side of the glass, there is no lantern at all.',
    'At the ends of the corridors, **your Pokémon, glimpsed as ghosts**, wave at you. A little late, every time.',
    '*Walk so the reflection reaches the lantern.*',
  ), [
    ch('Walk to your right.', shoved('gn-14-n2', 'Your reflection walks to its right, away from the lantern. The glass ripples like a laugh. Something cold shoves the ghost back to the start.')),
    ch('Walk to your left.', out(say(
      'Your reflection walks the other way, right up to the lantern, and puts its hand on it.',
      'The glass lets go of the light. One of the waving shapes at the end of the corridor stops waving and comes to you.',
    ), ...lantern(2, 'gn-14-n3'))),
    ch('Walk into the mirror.', shoved('gn-14-n2', 'You walk into the glass. It is very much glass. The ghost winces for you, a moment late.')),
  ]),
  rm('gn-14-n3', "Sabrina's Labyrinth: Four Doors", lab({ pokemon: 'haunter' }), say(
    'Node 3. **Doors that open onto places from earlier regions.** A town you left. A route. The first rest of the run. A harbour.',
    'They light up one at a time, in an order, and then go dark. The lantern is behind whichever door you open last, if you get it right.',
    '*The ghost has stopped copying you. It\'s watching the doors too.*',
  ), [ch('Watch the doors.', out('You watch.',
    pick('lab-doors', 1, 1, 1),
    when('lab-doors', { min: 1, max: 1 }, [], 'The town. The route. The rest. The harbour.'),
    when('lab-doors', { min: 2, max: 2 }, [], 'The route. The harbour. The town. The rest.'),
    when('lab-doors', { min: 3, max: 3 }, [], 'The rest. The town. The harbour. The route.'),
    room('gn-14-n3-doors')))]),
  rm('gn-14-n3-doors', "Sabrina's Labyrinth: Four Doors", lab({ pokemon: 'haunter' }), say(
    'The doors are dark now. Through one of them, faintly, you can hear the town you started from.',
    'Open them in the order they lit.',
  ), [
    ...[['Town, route, rest, harbour.', 1], ['Route, harbour, town, rest.', 2], ['Rest, town, harbour, route.', 3], ['Harbour, rest, route, town.', 4]].map(([label, k]) => ch(label as string, out('You open the doors, one after another.',
      when('lab-doors', { min: k as number, max: k as number }, lantern(3, 'gn-14-n4'), 'The last door opens on the first rest of your run: the same bench, the same light. The lantern is sitting on the bench, waiting.'),
      when('lab-doors', { max: (k as number) - 1 }, [hurt(0.2), scene('gn-14-n3')], 'The wrong door. It opens onto a route you never walked, and the wind off it knocks the ghost flat. The doors light up again, from the start.'),
      when('lab-doors', { min: (k as number) + 1 }, [hurt(0.2), scene('gn-14-n3')], 'The wrong door. It opens onto a route you never walked, and the wind off it knocks the ghost flat. The doors light up again, from the start.'),
    ))),
  ]),
  rm('gn-14-n4', "Sabrina's Labyrinth: Two Doors", lab({ pokemon: 'banette' }), say(
    'Node 4. Two doors. One\'s labelled **"Right."**',
    'Beside them, **a villager repeats one sentence**, over and over, to nobody: "She was only a little girl when it started."',
    '*The ghost floats level with you now. Not behind. Beside.*',
  ), [
    ch('Open the door marked "Right."', shoved('gn-14-n4', 'It opens onto the same room, and the same villager, saying the same sentence. The ghost bumps into you from behind. You\'re back where you began.')),
    ch('Open the other one.', out(say(
      'The villager stops in the middle of the sentence. For a moment, very quietly: "...She was so lonely."',
      'Then the lantern is in your hands.',
    ), ...lantern(4, 'gn-14-n5'))),
  ]),
  rm('gn-14-n5', "Sabrina's Labyrinth: The Floating Floor", lab({ pokemon: 'drifblim' }), say(
    'Node 5. A floor of tiles floating over nothing. Each one tips when you put weight on it.',
    'On the far wall, **children\'s drawings of your team**, in crayon, pinned up. Each has a gold star. One of them is of the ghost.',
    '*It goes first now. It doesn\'t look back to check you\'re following. It knows.*',
  ), [
    ch('Step where it steps.', out(say(
      'You put your feet exactly where it floats. Not one tile tips.',
      'At the far side, it stops under the drawing of itself. It looks at the gold star for a long time.',
    ), ...lantern(5, 'gn-14-n6'))),
    ch('Run for the far side.', shoved('gn-14-n5', 'Three tiles in, the floor tips. You fall a long way, slowly, and land at the start. The ghost comes down after you, holding your sleeve.')),
    ch('Pick the steadiest tiles.', shoved('gn-14-n5', 'The steadiest tile is the one that flips. Of course it is. You land back at the start with a crayon in your hair.')),
  ]),
  rm('gn-14-n6', "Sabrina's Labyrinth: The Small Grave", lab({ pokemon: 'dusclops' }), say(
    'Node 6. **A small grave, for a Pokémon you never lost.** Beside it, the last lantern, and a riddle chalked on the floor:',
    '*"I\'m with you all your life and you\'ve never touched me."*',
  ), [
    ch('A shadow.', out('The chalk smudges, as if someone breathed on it. The last lantern opens.',
      when('lost-mon', { min: 1 }, [], 'The grave has a name on it. You know the name. The ghost floats over and stays by it, very still, for as long as you need.'),
      when('lost-mon', { min: 0, max: 0 }, [], 'The stone is blank. The ghost won\'t go near it. It waits by the lantern instead, with its back to the grave.'),
      when('shedinja-answered', { min: 1 }, [], 'The Shedinja is standing by the grave, a little apart. It doesn\'t move. You think it came to see you through.'),
      ...lantern(6, 'gn-14-sabrina'))),
    ch('A name.', shoved('gn-14-n6', 'The chalk rubs itself out and writes the riddle again, more slowly, as if for a child. The cold comes up out of the floor and knocks the ghost back.')),
    ch('Your own heartbeat.', shoved('gn-14-n6', 'You can\'t hear your heartbeat in here. You realise you haven\'t been able to for a while. The riddle writes itself out again.')),
  ]),
  rm('gn-14-sabrina', "Sabrina's Labyrinth: Sabrina", lab({ pokemon: 'alakazam' }), say(
    '**Sabrina, not turning round:** "You came all this way without a body. Most people stop at the grave."',
    '*A doll on her knee turns its head.*',
    'Her Alakazam is already looking at your ghost. Its spoons are bent toward it.',
    'Every turn, one of your ghost\'s moves will lie. Every second turn, it can see true.',
  ), [ch('Face Sabrina.', fight('It floats out in front of you. It doesn\'t look back. It leads.', inLab(trainer('Sabrina', { size: 1, team: ['alakazam'], types: ['psychic'], lv: 2, rule: { matchLead: true, noItems: true, evolveMid: true, ghostRescue: true, falseSlot: true }, win: [canon('ghostEnd'), flag('kanto-sabrina-ghost'), flag('kanto-sabrina-labyrinth-done'), flag('kanto-sabrina-haunting-owed'), room('gn-14-goodbye')], lose: LAB_RETRY }))))]),
  rm('gn-14-goodbye', "Sabrina's Labyrinth: Goodbye", lab({ pokemon: 'gengar' }), say(
    'You have your body back. The lights go back into the Poké Balls, one by one, and the belt is heavy again.',
    '*It floats in front of you. It copies your wave, a step behind, the way it did at the start.*',
  ), [ch('Wave back.', out(say('*It\'s gone.*', 'The curtain is only a curtain. The fortune-teller\'s table is folded up and leaning on the wall.'), moment('A ghost walked you back to your own body, then let go of your sleeve.', 80), leavePseudo()))]),
  rm('gn-14-return', 'The Ghost Returns', lab({ pokemon: 'gengar', tags: ['Story', 'Pokémon'] }), say(
    '*Black screen.*',
    '*Nothing.*',
    '*Its face, very large, very suddenly.*',
    '*Then it backs off, embarrassed, and holds out a hand, or a string, or a sleeve.*',
  ), [
    ch('Take it.', out('It\'s still cold. It still waits for you to step first.', canon('ghostReturn'))),
    ch('Not this time.', out('It nods, a moment late, the way it always did. Then it goes back into the dark.')),
  ]),
];
const KANTO_LAB: Json = { ...gev('cs-kanto-saffron-labyrinth', "Sabrina's Labyrinth", lab({ stop: 'event', rarity: 'common', types: ['psychic', 'ghost'], pokemon: 'mr-mime', requires: [not('lab-entered')] }), LAB_INTRO, LAB_DOOR), canon: 'cs.kanto.saffron.labyrinth' };

// =====================================================================================================================
// gn.15  ROUTE 25: THE ANGRY MANKEY  (step 6, must-see, instead of the battle, a red "!"; five Mankey in a row at A+1; the thieves' camp is a
// side branch at the next step, or found first; one Mankey joins with Swords Dance and Mach Punch)
// =====================================================================================================================
const R25_TINT = '#6b4a3a';
const r25 = (o: Json = {}): Json => ({ tint: R25_TINT, tags: ['Combat', 'Pokémon', 'Story'], pokemon: 'mankey', effect: 'none', ...o });
const MANKEY_LINE = ['mankey', 'primeape', 'annihilape'];
/** A gauntlet fight: a hungry Mankey at A+1. It fights for its troop and can't be caught; losing just sends you back down the road. */
const troopFight = (win: Json[], o: Json = {}): Json => {
  const { rule, ...rest } = o;
  return { ...wild({ species: ['mankey'], lv: 1, win }), friendly: true, lose: [room('gn-15-driven')], ...rest, rule: { noCatch: true, ...((rule as Json | undefined) ?? {}) } };
};
const FOOD_BACK: Json[] = [flag('mankey-food-returned')];
/** Food returned: before the gauntlet the fifth comes out alone and bows; after it, the four eat (and the Mankey with you is fonder). */
const FOOD_HOME: Json[] = [
  when('mankey-gauntlet', { min: 0, max: 0 }, [room('gn-15-bow')], 'You carry the sack back to the road. The screaming in the trees stops.'),
  when('mankey-gauntlet', { min: 1 }, [{ kind: 'friendship', bond: 2, who: { species: MANKEY_LINE } }], 'The four sit up and eat. The fifth doesn\'t eat until they have.'),
];
const CAMP_INTRO = say(
  '*Three trainers round a fire, with a sack of Berries the size of a barrel.*',
  'Mankey fur is caught on the sack\'s drawstring. There\'s a week of rinds round the fire.',
  '**A trainer:** "They\'re wild Pokémon. It\'s not stealing. It\'s foraging, second-hand."',
);
const R25_OPEN = say(
  '*A screech. Then four more. The trees shake.*',
  '*Five Mankey drop onto the road. Four are jumping, shrieking, beating the ground.*',
  '*The fifth is standing still, in front of the other four, with its arms out.*',
);
const R25_DOOR: Json[] = [
  ch('Face them.', out('You put your bag down and stand your ground. The four stop jumping. They come.', flag('mankey-met'), flag('mankey-gauntlet'), gn('ahead', { key: 'gn-15-camp' }), room('gn-15-m1'))),
  ch('Find out why they\'re so angry.', out('You back away slowly, off the road. Behind the trees, there\'s smoke, and a trail of Berry rinds.', flag('mankey-met'), room('gn-15-camp'))),
];
/** Fed the starving Poochyena, or gave the Taken Egg back: the fifth has seen that look before. */
const SEEN_THE_LOOK: Json[] = [is('fed-poochyena')];
const SEEN_THE_EGG: Json[] = [is('egg-returned')];
const WAITED: Json[] = [flag('mankey-waited'), flag('mankey-fifth-earned'), room('gn-15-reward')];
const LOWERS = say(
  '*It lowers its arms.*',
  'It doesn\'t trust you. It watches every step you take. But it lets you pass, and it lets the four crawl back behind it.',
);

const gn15: Json[] = [
  gev('gn-15-troop', 'Route 25: The Angry Mankey', r25({ stop: 'event', rarity: 'rare', forced: true, types: ['fighting'], requires: [not('mankey-met')] }), R25_OPEN, R25_DOOR),
  rm('gn-15-camp', "Route 25: The Thieves' Camp", r25({ pokemon: 'meowth', tint: '#4a3a2a', requires: [not('mankey-food-returned')] }), CAMP_INTRO, [
    ch('Take it back (a battle).', fight('You stand up into the firelight. Three trainers stand up too.', trainer('Three Trainers', { size: 3, team: ['meowth', 'raticate', 'sandshrew'], win: [...FOOD_BACK, ...FOOD_HOME] }))),
    ch('Buy it back.', out('You count out ₽500. They shrug, and push the sack over with a foot.', $(-500), ...FOOD_BACK, ...FOOD_HOME), { requires: [money(500)] }),
    ch('Ask them to carry it back themselves.', out(say(
      'They know who you are. They look at each other. Then, sheepish, they lift the sack between them.',
      'Five Mankey watch them the whole way back to the road. Nobody says anything.',
    ), ...FOOD_BACK, flag('mankey-thieves-sorry'), ...FOOD_HOME), { requires: [is('rep', 3)] }),
    ch('Leave it.', out('You leave them to their fire.',
      when('mankey-gauntlet', { min: 0, max: 0 }, [flag('mankey-gauntlet'), gn('ahead', { key: 'gn-15-camp' }), room('gn-15-m1')], 'Back on the road, the Mankey are waiting. They come.'),
    )),
  ]),
  rm('gn-15-m1', 'Route 25: The First', r25(), say(
    'The first Mankey comes in low and screaming. It opens its mouth wider than its face.',
    'There will be no healing between them. They won\'t give you time.',
  ), [ch('Hold the line.', fight('It opens with a Screech. Your lead flinches; its guard drops.', troopFight([room('gn-15-m2')], { rule: { myStages: { def: -2 } } })))]),
  rm('gn-15-m2', 'Route 25: The Second', r25(), say(
    'The second doesn\'t wait for the first to get up. It\'s all claws and noise.',
  ), [ch('Hold the line.', fight('It goes for you with Fury Swipes, over and over, like it\'s digging.', troopFight([room('gn-15-m3')], { foeMoves: ['fury-swipes'] })))]),
  rm('gn-15-m3', 'Route 25: The Third', r25(), say(
    'The third has something clutched to its chest. A Berry. One of theirs.',
    'It hasn\'t eaten it. It\'s been saving it.',
  ), [ch('Hold the line.', fight('Halfway through, it eats the Berry. It looks almost ashamed.', troopFight([room('gn-15-breath')], { held: 'sitrus-berry' })))]),
  rm('gn-15-breath', 'Route 25: One Breath', r25(), say(
    'Three are down. The fourth hangs back, just for a moment, to look at them.',
    'It\'s the only breath you\'ll get.',
  ), [ch('Take it.', out('You crouch with your team and breathe. It isn\'t much.', heal(0.25), room('gn-15-m4')))]),
  rm('gn-15-m4', 'Route 25: The Fourth', r25(), say(
    'The fourth watched the others fall. It isn\'t screaming any more. It comes in quiet, low and fast, aiming for the legs.',
  ), [ch('Hold the line.', fight('A Low Kick, then another. It learned that from somewhere.', troopFight([room('gn-15-fifth')], { foeMoves: ['low-kick'] })))]),
  rm('gn-15-fifth', 'Route 25: The Fifth', r25(), say(
    'The four crawl back behind it. The fifth hasn\'t moved since the start.',
    '*It stands in front of them, with its arms out.*',
    'It doesn\'t attack. It\'s waiting to see what you do.',
  ), [
    ch('Attack it.', fight('It doesn\'t move out of the way. When it does fight back, it fights like a Primeape, and it\'s furious.', troopFight([flag('mankey-fifth-beaten'), room('gn-15-reward')], { levelBonus: 3, foeMoves: ['rage'], rule: { foeStands: 1, foeStages: { atk: 1, def: 1, spe: 1 } } }), flag('mankey-hit-fifth'))),
    ch('Wait.', out(say(
      '*It looks at you. It looks at the bag. It makes a small, tired sound.*',
      '*The other four are thin. You can see that now.*',
    ), room('gn-15-fifth-2')), {
      branches: [
        { when: SEEN_THE_LOOK, text: say('*It looks at you. It looks at the bag.*', 'Then it looks at your face, for a long time. It\'s seen that look before. You gave a starving Poochyena your lunch once, and it shows.', LOWERS), effects: WAITED },
        { when: SEEN_THE_EGG, text: say('*It looks at you. It looks at the bag.*', 'Then it looks at your face, for a long time. It\'s seen that look before. You rolled a stolen Egg back to its parents once, and it shows.', LOWERS), effects: WAITED },
      ],
    }),
  ]),
  rm('gn-15-fifth-2', 'Route 25: The Fifth', r25(), say(
    'It still has its arms out. They\'re shaking now. It\'s been holding them up for a long time.',
  ), [
    ch('Wait.', out(LOWERS, ...WAITED)),
    ch('Attack it.', fight('It doesn\'t move out of the way. When it does fight back, it fights like a Primeape, and it\'s furious.', troopFight([flag('mankey-fifth-beaten'), room('gn-15-reward')], { levelBonus: 3, foeMoves: ['rage'], rule: { foeStands: 1, foeStages: { atk: 1, def: 1, spe: 1 } } }), flag('mankey-hit-fifth'))),
  ]),
  rm('gn-15-bow', 'Route 25: The Fifth', r25(), say(
    'The gauntlet doesn\'t happen.',
    '*The fifth walks out onto the road, alone. It looks at the sack. It looks at you.*',
    '*It bows.*',
  ), [ch('Bow back.', out('Behind it, in the trees, four thin Mankey are already eating.', flag('mankey-fifth-earned'), room('gn-15-reward')))]),
  rm('gn-15-driven', 'Route 25: Driven Back', r25(), say(
    'Your team goes down. The Mankey don\'t chase you. They just stand on the road until you\'re gone.',
  ), [ch('Walk on.', out('Nobody joins you. Behind you, the screaming starts again, and then stops.', flag('mankey-driven')))]),
  rm('gn-15-reward', 'Route 25: One of the Troop', r25(), say(
    'The road\'s quiet. The troop is looking at you.',
    'One Mankey steps out. It doesn\'t ask. It just stands next to your bag, the way the fifth stood in front of the four.',
  ), [
    ch('Let it come.', out('It falls in beside you. It already knows Swords Dance and Mach Punch, from somewhere.',
      when('mankey-fifth-beaten', { min: 1 }, [], 'The four lie where they fell. The fifth, beaten, still drags itself in front of them. It\'s one of the four that comes. The fifth never joins anyone who hit it first.'),
      when('mankey-fifth-earned', { min: 1 }, [flag('mankey-fifth-joined')], 'It\'s the fifth. It doesn\'t look back at the others. It knows they\'ll eat tonight.'),
      when('mankey-food-returned', { min: 0, max: 0 }, [{ ...join({ species: ['mankey'] }), moves: ['swords-dance', 'mach-punch'] }]),
      when('mankey-food-returned', { min: 1 }, [{ ...join({ species: ['mankey'] }), moves: ['swords-dance', 'mach-punch'], friendship: 10 }], 'Bond +2: it has seen you bring the food home.'),
      when('mankey-gauntlet', { min: 1 }, [{ kind: 'canon', action: 'flawless', species: [] }]),
      flag('kanto-mankey'), stampStage('mankey-at'))),
    ch('Leave the troop together.', out('You shake your head. It goes back to the others. They make room for it.', flag('kanto-mankey'), stampStage('mankey-at'))),
  ]),
  gev('gn-15-grove', 'The Berry Grove', r25({ stop: 'event', rarity: 'uncommon', pokemon: 'mankey', tint: '#4f6a2a', tags: ['Story', 'Pokémon'], requires: [is('mankey-thieves-sorry'), laterStage('mankey-at'), not('mankey-grove')] }), say(
    'A Berry grove, fenced with string and tin cans. Three trainers are sitting on the fence. You know them.',
    '**A trainer:** "We guard it now. From people like us." They look embarrassed. "The Mankey come by for the windfalls."',
  ), [
    ch('Help them watch the fence.', fight('Someone\'s coming through the trees with an empty sack.', trainer('Berry Thieves', { size: 2, team: ['rattata', 'meowth'], friendly: true, win: [item('sitrus-berry', 2)] }), flag('mankey-grove'))),
    ch('Wave and walk on.', out('They wave back. One of them is wearing a Mankey-fur hat, and looks very sorry about it.', flag('mankey-grove'))),
  ]),
];
const KANTO_R25: Json = { ...gev('cs-kanto-saffron-r25', 'Route 25: The Angry Mankey', r25({ stop: 'event', rarity: 'common', types: ['fighting'], requires: [not('mankey-met')] }), R25_OPEN, R25_DOOR), canon: 'cs.kanto.saffron.route25' };

export const EVENTS: Json[] = [...gn11, KANTO_KAIJU, ...gn12, KANTO_MAIDEN, ...gn13, KANTO_FLIGHT, ...gn14, KANTO_LAB, ...gn15, KANTO_R25];

/** The old Kanto canon builds of these stories (moved to Greenneedle): kept for saved runs, never shown again. */
export const REMOVE: string[] = [
  ...['n1', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'goodbye'].map((n) => `cs-kanto-vermilion-flight-${n}`),
  ...['r25-camp', 'r25-1', 'r25-4', 'r25-5', 'r25-after', 'r25-camp-after', 'r25-thanks', 'r25-claim'].map((n) => `cs-kanto-saffron-${n}`),
  ...['lab-lost', 'lab-ghost', 'lab-n1', 'lab-n2', 'lab-n3', 'lab-n4', 'lab-n5', 'lab-n6', 'lab-final', 'return-shuppet', 'return-duskull', 'return-drifloon', 'return-gastly'].map((n) => `cs-kanto-saffron-${n}`),
  'ev-sabrina-labyrinth',
  ...['square-a', 'square-b', 'lantern', 'tm1', 'tm2', 'tm3', 'tm4', 'tm5', 'tm6', 'tm7', 'tm8', 'swap', 'eggs', 'tea', 'n1', 'n2', 'n3', 'n4', 'n5', 'top'].map((n) => `cs-kanto-vermilion-maiden-${n}`),
];

export const PLACEMENT: Record<string, Placement> = {
  'gn-11-harbour': {
    gn: 'gn.11', shape: 'World Event', earliest: 'A5', home: 14, window: [12, 17], sits: 'must-see', attaches: 'instead', tags: ['World Event', 'Raid'], needs: ['water'],
    level: 'A+2', often: 'run', dressing: { kanto: 'Kaiju Tentacruel', kantoStage: 'Vermilion harbour (the canon space)', elsewhere: 'Kaiju Tentacruel' },
    note: 'Badge: a wave. Kanto shows it through cs-kanto-vermilion-kaiju (the canon raid den is no longer placed).',
  },
  'gn-11-return': { gn: 'gn.11', shape: 'Single', earliest: 'A6', home: 8, window: [1, 20], sits: 'optional', tags: ['Afterstory'], needs: ['water'], level: 'A+1', often: 'run', note: 'Only when the Kaiju was freed.' },
  'gn-13-check': {
    gn: 'gn.13', shape: 'Single', earliest: 'A4', home: 17, window: [15, 19], sits: 'must-see', attaches: 'before', tags: ['Interrupting Episode', 'Pseudo Stage', 'Companion Story', 'Finale'],
    level: 'Always levels 5 to 20 inside', often: 'run', dressing: { kanto: 'Flight North', kantoStage: 'The road north of Vermilion (the canon space)', elsewhere: 'Flight North' },
    badge: 'None', note: 'No badge: a surprise. Kanto shows it through cs-kanto-vermilion-flight.',
  },
  'gn-15-troop': {
    gn: 'gn.15', shape: 'Single', earliest: 'A4', home: 6, window: [4, 9], sits: 'must-see', attaches: 'instead', tags: ['Interrupting Episode'],
    level: 'A+1', often: 'run', badge: '!', dressing: { kanto: 'Route 25: The Angry Mankey', kantoStage: 'Route 25, on the way to Saffron (the canon space)', elsewhere: 'The Angry Mankey' },
    note: 'Badge: a red "!". The thieves\' camp is a side stop on the next step (op `ahead`) or found first. Kanto shows it through cs-kanto-saffron-r25.',
  },
  'gn-15-grove': { gn: 'gn.15', shape: 'Single', earliest: 'A5', home: 8, window: [1, 20], sits: 'optional', tags: ['Afterstory'], level: 'A+0', often: 'run', note: 'Only when the thieves carried the food back (sorry).' },
  'gn-14-door': {
    gn: 'gn.14', shape: 'Door', earliest: 'A6', home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Mystery Episode', 'Companion Story'],
    level: "The ghost L10 to L40; Alakazam is the ghost's level +2", often: 'run', badge: '?', dressing: { kanto: "Sabrina's Labyrinth", kantoStage: 'Saffron (the canon space)', elsewhere: "Sabrina's Labyrinth" },
    note: 'The doc says once per save; once per run here (no memory across runs). Kanto shows it through cs-kanto-saffron-labyrinth.',
  },
  'gn-12-door': {
    gn: 'gn.12', shape: 'Door', earliest: 'A5', home: 9, window: [7, 12], sits: 'optional', attaches: 'town', tags: ['Pseudo Stage', 'Hub Destination', 'Mystery Episode'],
    level: 'A+0', often: 'run', dressing: { kanto: "Maiden's Peak", kantoStage: 'The cliff town east of Vermilion (the canon space)', elsewhere: "Maiden's Peak" },
    note: 'Badge: a lantern. Until towns exist it sits on step 9. Kanto shows it through cs-kanto-vermilion-maiden.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_flight', name: 'Flight North', entry: 'gn-13-check', themeId: 'normal-flying', tint: FLIGHT_TINT, mood: 'open sky', start: 'opened' },
  { id: 'ps_gn_labyrinth', name: "Sabrina's Labyrinth", entry: 'gn-14-door', themeId: 'psychic-ghost', tint: LAB_TINT, mood: 'shadow lanterns', start: 'opened' },
  { id: 'ps_gn_maiden', name: "Maiden's Peak", entry: 'gn-12-door', themeId: 'fairy-ghost', tint: MAIDEN_TINT, mood: 'festival lanterns', start: 'opened' },
];
