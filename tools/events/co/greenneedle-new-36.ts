// Greenneedle gn.new.36: The Lantern Sea (doc GREENNEEDLE_PLACED_2.md lines 574–605).
// Build: npm run co:build -- greenneedle-new-36   then   npm run co:gn
import { at, ch, item, join, out, type Json } from '../dsl.ts';
import { chIf, gev, gn, is, kindness, moment, not, notThisRegion, rm, say, scene, setTo, stampRegion, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// A night bay. Chinchou and Lanturn in the shallows, paper boats along the shore. No battles.
const TINT = '#2f5f8f';
const sea = (o: Json = {}): Json => ({ tint: TINT, pokemon: 'lanturn', tags: ['Pokémon', 'Story'], effect: 'none', ...o });
const toHub = scene('gn-new-36-hub');
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });

const EVENTS: Json[] = [
  gev('gn-new-36-sea', 'The Lantern Sea', sea({ stop: 'event', rarity: 'rare', requires: [at('night'), notThisRegion('ls-at')], remembers: [
    { id: 'again', when: [is('ls-visits')], notice: 'The same bay, the same lights from below. On the shore, one more paper boat than the town can account for. Nobody will say who made it.' },
  ] }), say(
    'At night, the bay lights up from below.',
    '*Chinchou and Lanturn, hundreds of them, in the shallows. On the shore, paper boats, each with a candle.*',
    '**Boat-maker, Aunt Brigid:** "One for each who didn\'t come home. Yours is free. Everyone\'s first one\'s free."',
  ), [
    ch('Go down to the shore.', out('You go down to the water. The light moves under your feet, slowly, like breathing. Nobody here is in a hurry.', gn('lsArrive'), stampRegion('ls-at'), toHub)),
    ch('Walk on.', out('You walk on. Behind you the bay goes on glowing, for anyone who wants it.')),
  ]),
  // Day of the Dead (SF158, singles-12) sets `lantern-sea-open`: the way to the Lantern Sea is open, by day or night, on the next stop that can hold it.
  gev('gn-new-36-dotd', 'The Lantern Sea: The Way Is Open', sea({ stop: 'event', rarity: 'rare', callback: true, requires: [is('lantern-sea-open'), notThisRegion('ls-at')] }), say(
    'You followed the marigolds, and the smell of candle smoke, and the sound of people speaking quietly. The road bends down to a bay.',
    '*Chinchou and Lanturn, hundreds, in the shallows, lit from below. On the shore, paper boats, each with a candle.*',
    '**Boat-maker, Aunt Brigid:** "One for each who didn\'t come home. Yours is free. Everyone\'s first one\'s free."',
  ), [
    ch('Go down to the shore.', out('You go down to the water. The light moves under your feet, slowly, like breathing. Nobody here is in a hurry.', gn('lsArrive'), stampRegion('ls-at'), setTo('lantern-sea-open', 0), toHub)),
    ch('Walk on.', out('You walk on. Behind you the bay goes on glowing, for anyone who wants it.')),
  ]),
  rm('gn-new-36-hub', 'The Lantern Sea: The Shore', sea(), say(
    'The shore, lit from underneath. People move along it quietly, in twos and threes, speaking low.',
    'The boat-makers sit at a long trestle with the paper, the brushes and the candles. A diver stands knee-deep in the shallows, dripping and content. A child searches the reeds.',
    'At the end of the jetty, a Lanturn is waiting. It has been waiting a long time.',
  ), [
    ch('The boat-makers.', out('You walk along the trestle to Aunt Brigid\'s end.', scene('gn-new-36-boats'))),
    chIf([not('ls-pearl')], 'The diver, Caspar-Wyn.', out('You wade out to him. The water is warm, and everywhere it\'s lit.', scene('gn-new-36-diver'))),
    chIf([not('ls-child')], 'The child in the reeds.', out('She\'s looking along the bank, bent over, very serious. She hasn\'t noticed you yet.', scene('gn-new-36-child'))),
    ch('The Lanturn at the jetty.', out('You walk out along the boards. The Lanturn turns one slow light towards you, and then away again.', scene('gn-new-36-jetty'))),
  ]),
  rm('gn-new-36-boats', 'The Lantern Sea: The Boat-makers', sea(), say(
    'Aunt Brigid has paper to the elbows. Small boats stand in rows, each folded exactly the same, each with a stub of candle.',
    '**Aunt Brigid:** "The brush is for a name. Write it however you like. The water can read."',
    'She holds one out to you, and a brush, wet with ink.',
  ), [
    chIf([not('ls-boat')], 'Take a boat and a brush.', out('She presses it into your hands. It weighs almost nothing. You find you\'re holding it very carefully.', setTo('ls-boat', 1), toHub)),
    chIf([is('ls-boat')], 'Ask who the boats are for.', out('**Aunt Brigid:** "For anyone. The one who didn\'t come back, the one who left, the one who never got a chance. Doesn\'t matter. We don\'t check."', toHub)),
    ch('Back to the shore.', out('You nod your thanks. She\'s already folding the next one.', toHub)),
  ]),
  rm('gn-new-36-diver', 'The Lantern Sea: The Diver', sea(), say(
    '**Caspar-Wyn:** "I trade for stories. Doesn\'t have to be big. Has to be *true.*" He holds up a pearl, white as the inside of a shell.',
    '"Tell me one thing that happened to you out there. I\'ll know if you\'re being clever."',
    '*What happened to you, this run:*',
    '**First:** {lsea:s1}',
    '**Second:** {lsea:s2}',
    '**Third:** {lsea:s3}',
  ), [
    chIf([gnc('lsStory', { n: 1 })], 'Tell him the first.', out('You tell it plainly, the whole way through. He doesn\'t interrupt once.', gn('lsPearl', { n: 1 }), item('pearl'), moment('Traded a true story for a pearl at the Lantern Sea.', 50), toHub)),
    chIf([gnc('lsStory', { n: 2 })], 'Tell him the second.', out('You tell it. Halfway through, he stops smiling, and just listens.', gn('lsPearl', { n: 2 }), item('pearl'), moment('Traded a true story for a pearl at the Lantern Sea.', 50), toHub)),
    chIf([gnc('lsStory', { n: 3 })], 'Tell him the third.', out('You tell it, quietly. When you\'re done, the water around you is very still.', gn('lsPearl', { n: 3 }), item('pearl'), moment('Traded a true story for a pearl at the Lantern Sea.', 50), toHub)),
    ch('Keep it to yourself.', out('"Fair enough," says Caspar-Wyn, and means it. "Some you don\'t spend."', toHub)),
  ]),
  rm('gn-new-36-child', 'The Lantern Sea: The Child in the Reeds', sea(), say(
    'She\'s about seven. Her sleeves are soaked to the shoulder.',
    '"I had a boat," she says, without looking up. "I put it down for one second."',
  ), [
    ch('Help her look.', out('You wade in beside her and part the reeds, one handful at a time. It takes a long while. You find it caught on a root, upside down, the candle still in it. She holds it against her chest.', kindness(1), setTo('ls-child', 1), toHub)),
    ch('Make her a new one.', out('You sit on the bank and fold one from your own paper, badly. She watches every crease. "It\'s lopsided," she says, and takes it as if it were made of glass.', kindness(1), setTo('ls-child', 1), toHub)),
  ]),
  rm('gn-new-36-jetty', 'The Lantern Sea: The Jetty', sea(), say(
    'The Lanturn waits at the end of the boards, light low, facing the open water.',
    'It\'s waiting for one boat in particular. Nobody knows whose.',
  ), [
    chIf([is('ls-boat')], 'Float a boat.', out('You crouch at the edge, the paper boat in your hands. The brush is wet. You think about whose name goes on it.', scene('gn-new-36-name'))),
    ch('Just watch.', out('You sit at the end of the jetty and watch the others go. One by one the little lights leave the shore. The Lanturn follows none of them. It waits. Eventually you get up, and go.', moment('Watched the boats go out on the Lantern Sea.', 40))),
    ch('Back to the shore.', out('You leave it waiting.', toHub)),
  ]),
  rm('gn-new-36-name', 'The Lantern Sea: A Name', sea(), say(
    'The ink pools at the nib. The boat is very small.',
    'Whose name goes on it?',
  ), [
    chIf([gnc('lsLost')], 'Write the name of one you lost.', out('You write it slowly, the whole name, the way they were called. The letters spread a little in the paper. You don\'t wipe your eyes.', scene('gn-new-36-float'))),
    chIf([gnc('lsLetGo')], 'Write the name of one you let go.', out('You write it. It looks smaller on paper than it was. You hope wherever they are, they\'re warm.', scene('gn-new-36-float'))),
    ch('Write a name nobody else will read.', out('You write a name that isn\'t a Pokémon\'s. You fold the paper over it before anyone can see.', scene('gn-new-36-float'))),
  ]),
  rm('gn-new-36-float', 'The Lantern Sea: The Boat', sea(), say(
    'You light the candle from the one beside you. You set the boat on the water, and push, very gently.',
    'The Lanturn at the jetty turns. It slides after the boat without a sound, and its light goes on ahead, wide and warm, down the dark water, so the boat has somewhere to go.',
    'Under it, all across the bay, the Chinchou lights flicker once, together. Like a nod.',
  ), [
    ch('Watch it all the way out.', out('You watch until the boat is a spark, and then not even that. Something small bumps your ankle: a Chinchou, fat and pleased with itself. It liked your boat. It follows you back up the shore.', { ...join({ species: ['chinchou'] }), ability: 'guiding-light', mark: 'lantern-chinchou' }, setTo('lantern-boat', 1), kindness(1), moment('Floated a boat for someone lost, on the Lantern Sea. The Lanturn lit its way.', 80))),
  ]),
];

export { EVENTS };
export const REMOVE: string[] = [];
export const CHAINS: Json[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-36-sea': {
    gn: 'gn.new.36', shape: 'Hub', earliest: 'A8', home: 15, window: [13, 19], sits: 'must-see', attaches: 'town', tags: ['Community Episode'], needs: ['water'], needsAll: ['night'],
    level: 'No battles', often: 'region', badge: 'own',
    note: 'Badge: a paper boat. At night on a water stage (the doc\'s fallback step 19 is the end of the window). Day of the Dead (SF158) opens it too, by day or night, through gn-new-36-dotd (an afterstory-style callback on the flag `lantern-sea-open`). Once per region; every later visit has one more boat than the town can account for. Floating a boat sets lantern-boat (read by gn.33 and the gn-07 window).',
  },
};
