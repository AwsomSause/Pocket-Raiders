// Greenneedle gn.new.19 The Snowbound Village (doc GREENNEEDLE_PLACED_1.md lines 692–724).
// A four-leg sled run: pick 1–5 crates, cross the frozen lake, the pine wood, the pass and the descent, then arrive.
// All of it is data (flags and wild fights); no new rules code. Build: npm run co:build -- greenneedle-new-19   then   npm run co:gn
import { anyType, ch, fight, flag, flagAgo, flagAt, heal, hurtLead, join, out, relic, wild, type Json } from '../dsl.ts';
import { chIf, gev, inside, is, kindness, leavePseudo, moment, not, rm, say, scene, setTo, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const SNOW_TINT = '#bcd3e6';
const snow = (o: Json = {}): Json => ({ tint: SNOW_TINT, pokemon: 'delibird', tags: ['Pokémon', 'Exploration'], effect: 'snow', ...o });
const leg = (o: Json = {}): Json => snow({ tags: ['Pokémon', 'Exploration', 'Combat'], ...o });

const SPEED = ['', 'swift', 'quick', 'steady', 'slow', 'crawling'];
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five'];
const HARDER = (n: number): string => (n >= 5 ? '4 (3 if you brake)' : String(Math.max(0, n - 1)));

/** Sets up a run with n crates: the speed is a word, the harder encounters are one flag each, in the order they are met. */
const load = (n: number): Json[] => [
  setTo('sv-crates', n), setTo('sv-got', n), setTo('sv-heavy', n >= 4 ? 1 : 0),
  setTo('sv-h-lake', n >= 3 ? 1 : 0), setTo('sv-h-scouts', n >= 4 ? 1 : 0), setTo('sv-h-pack', n >= 2 ? 1 : 0), setTo('sv-h-skid', n >= 5 ? 1 : 0),
];
const TABLE = [1, 2, 3, 4, 5].map((n) => `${n} crate${n > 1 ? 's' : ''}: the sled is ${SPEED[n]}; ${HARDER(n)} encounter${n === 2 ? '' : 's'} get harder.`);
const carry = (n: number): Json => ch(`Carry ${n} crate${n > 1 ? 's' : ''}.`, out(say(
  `${WORDS[n]} crate${n > 1 ? 's' : ''}, roped down tight. Halden checks every knot twice, and the Stantler leans into the harness.`,
  n >= 4 ? 'The runners groan. The Stantler looks back at you, once, and then forward.' : 'The sled glides. The Stantler barely seems to notice the weight.',
), ...load(n), scene('gn-n19-lake')));

/** A wild fight inside the run: the foe is A+0, or A+1 when an extra crate made this one harder. */
const wildLeg = (species: string[], hardKey: string, label: string, text: string, next: Json[], format?: 'doubles'): Json[] => [true, false].map((hard) =>
  chIf([hard ? is(hardKey) : not(hardKey)], label, fight(text, inside({ ...wild({ species, lv: hard ? 1 : 0, format, win: next }), caught: next, lose: [] }))));

const gn19: Json[] = [
  gev('gn-n19-door', 'The Snowbound Village', snow({ stop: 'event', rarity: 'rare', requires: [not('sv-entered')] }), say(
    '*The road is gone. An avalanche took the whole bend, and the snow still hisses as it settles.*',
    '*A Delibird drops out of the grey sky and lands in front of you. Its sack is empty. Pinned to it, a note: medicine, by nightfall.*',
    '**Sled driver, Halden Vey:** "Five crates. Five houses. The Stantler can pull five. Slowly. You decide."',
  ), [
    ch('Take the sled.', out('You step onto the runners. The Delibird perches on the front rail and watches you the whole way.', flag('sv-entered'), scene('gn-n19-load'))),
    ch('Walk on.', out('You walk on. Behind you, the Delibird stays where it landed, sack open, looking at the road.')),
  ]),
  rm('gn-n19-load', 'The Snowbound Village: The Crates', snow(), say(
    'Five crates in the snow, each marked with a house. Halden holds the Stantler\'s harness and doesn\'t look at you.',
    'Every crate you leave is a house that waits. Every crate you take is weight on the ice.',
    ...TABLE,
  ), [carry(1), carry(2), carry(3), ch('Carry more.', out('You look at the last two crates a long time.', scene('gn-n19-load-more')))]),
  rm('gn-n19-load-more', 'The Snowbound Village: The Heavy Loads', snow(), say(
    'The last two crates. The Stantler is already breathing hard, and it hasn\'t started pulling.',
    ...TABLE.slice(3),
  ), [carry(4), carry(5), ch('Take fewer.', out('You step back from the heavy crates and look at the lighter loads.', scene('gn-n19-load')))]),
  // ---- Leg 1. The frozen lake ----
  rm('gn-n19-lake', 'The Snowbound Village: The Frozen Lake', leg({ pokemon: 'seel' }), say(
    'The lake is a sheet of grey glass, and it talks. Every runner-stroke makes it ring.',
    'Thin ice rings high. Thick ice rings low. Halden shuts his eyes. "Steer by the sound," he says. "Never by what you see."',
    '*Something under the ice rises to listen too.*',
  ), wildLeg(['seel', 'spheal', 'cubchoo'], 'sv-h-lake', 'Steer by the sound.', 'The ice rings under you. A wild Pokémon breaks the surface, and the lake goes quiet around it.', [scene('gn-n19-wood')])),
  // ---- Leg 2. The pine wood ----
  rm('gn-n19-wood', 'The Snowbound Village: The Pine Wood', leg({ pokemon: 'sneasel' }), say(
    'The wood is dark and the branches hang low. Snow drops from them in heavy sheets onto the load.',
    'Halden ducks. The crates don\'t. Something small and quick has been following the sled since the lake.',
    '*A pair of red eyes. Then another.*',
  ), wildLeg(['sneasel'], 'sv-h-scouts', 'Meet the scouts.', 'A Sneasel drops from a branch onto the crates. It isn\'t hunting. It\'s weighing what you carry.', [scene('gn-n19-pack')])),
  rm('gn-n19-pack', 'The Snowbound Village: The Sneasel Pack', leg({ pokemon: 'sneasel' }), say(
    'The scout whistles. The rest of the pack comes down out of the pines, one at a time, with no hurry at all.',
    '**Halden:** "They\'re not after us. They\'re testing the load. A sled that can\'t be defended isn\'t worth the knots."',
  ), wildLeg(['sneasel'], 'sv-h-pack', 'Defend the load.', 'The pack closes in, and two of them go for the ropes. You hold the crates.', [
    when('sv-heavy', { min: 1 }, [scene('gn-n19-pass-heavy')]),
    when('sv-heavy', { min: 0, max: 0 }, [scene('gn-n19-pass-light')]),
  ], 'doubles')),
  // ---- Leg 3. The pass ----
  rm('gn-n19-pass-light', 'The Snowbound Village: The Pass', snow({ pokemon: 'stantler' }), say(
    'The wood opens onto a ridge, and the wind finds you at once. It pushes the sled sideways, then back.',
    'The load is light. The Stantler digs in and the runners bite. Halden whoops, and the wind takes it away.',
  ), [ch('Push through the wind.', out('The wind drops you on the far side of the ridge, breathless, all of you still there.', scene('gn-n19-descent')))]),
  rm('gn-n19-pass-heavy', 'The Snowbound Village: The Pass', snow({ pokemon: 'stantler' }), say(
    'The wood opens onto a ridge, and the wind finds you at once. It leans on the heavy sled like a hand.',
    'Halden shouts over it: the top crate is going. "Rope won\'t hold it! Something has to hold it!"',
  ), [
    ch('Have a Pokémon hold the crate.', out(say(
      'Your lead plants itself on the ridge and takes the crate\'s whole weight against its chest, braced and shaking.',
      'The wind howls past. The crate stays. Your lead comes through the pass tired, and proud.',
    ), hurtLead(0.2), scene('gn-n19-descent'))),
    ch('Trust the ropes.', out(say(
      'The knots hold for a breath. Then the wind takes the top crate off the sled and out over the edge.',
      'It falls a long time. Halden says one house\'s name, quietly. Nobody answers him.',
    ), flag('sv-got', -1), setTo('sv-lost', 1), scene('gn-n19-descent'))),
  ]),
  // ---- Leg 4. The descent ----
  rm('gn-n19-descent', 'The Snowbound Village: The Descent', snow({ pokemon: 'piloswine' }), say(
    'Below, the village: forty roofs and chimney smoke, close enough to see. Between you and it, a slope that falls like a staircase.',
    'The sled tips over the lip and begins to run. Fast. **Halden:** "Brake! Something heavy in the snow, now! Or hold on!"',
  ), [
    ch('Brake with a Rock- or Ground-type.', out('Your Pokémon digs in at the back. Snow sprays, the runners shriek, and the sled slows exactly as much as it needs to.', scene('gn-n19-arrive')), { requires: [anyType('rock', 'ground')] }),
    ...wildLeg(['swinub', 'piloswine'], 'sv-h-skid', 'Don\'t brake.', 'You hold on and let it run. The sled hits a drift at the bottom and throws something awake in it.', [scene('gn-n19-arrive')]),
  ]),
  // ---- Arrival: one room by the number of crates that got there ----
  rm('gn-n19-arrive', 'The Snowbound Village: The Square', snow({ tint: '#dce9f2' }), 'The sled slides into the square and stops, steaming. The village is already coming out of its doors.', [
    ch('Hand over the crates.', out('The crates come off one by one, and each is carried into a door you can see opening.', ...[1, 2, 3, 4, 5].map((n) => when('sv-got', { min: n, max: n }, [scene(`gn-n19-end-${n}`)])))),
  ]),
  ...[1, 2, 3, 4, 5].map((n) => rm(`gn-n19-end-${n}`, 'The Snowbound Village: Thanks', snow({ tint: '#dce9f2' }), say(
    n === 5 ? 'Every door in the square is open. The whole village is out in the snow, in their coats, not saying a word.' : 'The elder comes across the square in a coat that was patched long before tonight. She counts the crates by touch.',
    n === 5 ? '**Village elder:** "Five. Five houses, all of them breathing easy. Nobody to share with, nobody to leave out. You came. That\'s the thing."' : `**Village elder:** "${WORDS[n]}. That's ${n === 1 ? 'one house' : `${n} houses`} breathing easy. We'll share for the rest. You came. That's the thing."`,
    n === 5 ? 'The Delibird flies one slow circle over the square, then drops its sack in your hands. It is full.' : 'The village doesn\'t blame anyone for the crates left behind. Not once.',
  ), [ch(n >= 3 ? 'Take the village\'s thanks.' : 'Take the village\'s coats.', out(say(
    'A child presses something warm into your hands. The elder walks you to the edge of the square.',
    n >= 3 ? 'The Delibird has decided you are its Trainer, and has not asked.' : 'You walk back up the road in borrowed warmth, and it stays with you a long time.',
  ),
  relic('sv-warm-clothes', 'Warm Clothes', [{ kind: 'damageTakenMultiplier', moveType: 'ice', value: 0.9 }]),
  ...(n >= 3 ? [join({ species: ['delibird'] })] : []),
  ...(n >= 5 ? [relic('sv-herd-bell', 'Herd Bell', [{ kind: 'friendshipMultiplier', value: 1.25 }])] : []),
  ...(n < 5 ? [flagAt('sv-left')] : []),
  heal(), kindness(n), moment(n === 5 ? 'Brought every crate down the mountain: all five houses' : `Brought ${n} crate${n > 1 ? 's' : ''} down the mountain to a snowbound village`, 70),
  flag('sv-done'), leavePseudo()))])),
  // ---- Afterstory: two regions later, at a Step 5 town ----
  gev('gn-n19-grown', 'The Snowbound Village: A Grown Child', snow({ stop: 'event', rarity: 'uncommon', callback: true, requires: [flagAgo('sv-left', 2), not('sv-grown')], tags: ['Pokémon', 'Story'], pokemon: 'delibird' }), say(
    'A young adult is waiting at the edge of town, in a coat that has been mended in three different threads.',
    'They watch you come all the way up the street. Then they walk straight to you, like they had practised it.',
    '**Grown child:** "You came to our village. Years ago. With the sled. One crate was meant for our house."',
  ), [
    ch('Say you remember.', out(say(
      'You tell them you remember. You tell them you are sorry, for the house, for the winter, for the crate that never came.',
      '**Grown child:** "We were fine. I mean that. We were fine, and we\'re well, and I wanted you to know it."',
    ), kindness(2), flag('sv-grown'), moment('A child from a house in the snowbound village found you, grown, and said they were well', 70))),
    ch('Ask how the village is.', out(say(
      'They tell you: the road is rebuilt, the Stantler\'s grandchildren pull the sled now, and the Delibird that stayed behind has been feeding the square for years.',
      '**Grown child:** "We\'re well. All of us. We say so. We say so to anyone who asks."',
    ), kindness(1), flag('sv-grown'), moment('The snowbound village was well, and sent word', 60))),
  ]),
];

export const EVENTS: Json[] = gn19;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-n19-door': {
    gn: 'gn.new.19', shape: 'Door', earliest: 'A8', home: 11, window: [9, 16], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['snow'],
    level: 'A+0; each extra crate makes one wild encounter A+1', often: 'run', badge: 'own',
    dressing: { kanto: 'The Snowbound Village', elsewhere: 'The Snowbound Village' },
    note: 'Door at step 11, optional (the doc prefers a high stage there); fallback step 16, optional (the window runs to 16). Once per run. Four legs.',
  },
  'gn-n19-grown': {
    gn: 'gn.new.19', shape: 'Single', earliest: 'A8', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', tags: ['Pokémon', 'Story'], stages: [5],
    level: 'None', often: 'run', badge: 'own',
    dressing: { kanto: 'A Grown Child', elsewhere: 'A Grown Child' },
    note: 'Afterstory: if any crate was left behind, two regions later at a Step 5 town a grown child from that house finds the player.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_snowbound', name: 'The Snowbound Village', entry: 'gn-n19-door', themeId: 'normal-ice', tint: SNOW_TINT, mood: 'snow village', start: 'opened' },
];
