// Greenneedle, gn.new.31 The Fox at the Shrine (doc GREENNEEDLE_PLACED_2.md lines 385-421).
// Build: npm run co:build -- greenneedle-new-31   then   npm run co:gn
// A Region-long story: a shrine (S1, step 1) and nine lanterns, each a small task at its own stage. No battles.
// Run flags: fox-met (took up the promise), fox-declined, fox-at (the region), fox-l<n> (lantern n lit), fox-r<n> (refused: dark this run),
// fox-lit (how many are lit). The doc keeps a refused lantern dark in every later run; there is no memory across runs, so it is dark for this run.
import { $, ch, flag, good, item, join, money, out, type Json } from '../dsl.ts';
import { bond, gev, gn, intel, is, moment, not, rm, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#c98a4b';
const FOX = 'ninetales';
const base = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Story', 'Mystery'], effect: 'none', cast: [], pokemon: FOX, ...o });
const here: Json = { kind: 'gn', test: 'thisRegion', key: 'fox-at' };

/** A lantern is lit: counted, remembered, and the fifth hands over the charm. */
const light = (n: number): Json[] => [
  flag(`fox-l${n}`), flag('fox-lit'),
  when('fox-lit', { min: 4, max: 4 }, [item('fox-charm')], 'A small paper lantern lifts from the fifth stone and floats into your hands. It is warm. **Fox Lantern Charm:** curse and burn do half damage.'),
];
/** One lantern's scene: a task, "Do it." or "Refuse." */
const task = (n: number, name: string, stop: Json, intro: string, doIt: Json, doReq: Json[] = [], refuse: { text: string; fx: Json[] } | null = null): Json[] => [
  gev(`gn-31-l${n}`, `The Fox at the Shrine: ${name}`, base({
    stop: 'event', rarity: 'rare', requires: [is('fox-met'), here, not(`fox-l${n}`), not(`fox-r${n}`)], ...stop,
  }), intro, [
    ch('Do it.', doIt, { requires: doReq }),
    ch('Refuse.', out(say(
      ...(refuse ? [refuse.text] : []),
      'The Ninetales nods once. It does not seem angry. It seems to have expected it.',
      `*The ${['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'][n - 1]} lantern stays dark.*`,
    ), flag(`fox-r${n}`), ...(refuse?.fx ?? []))),
  ]),
];
const wroom = (id: string, name: string, intro: string, choices: Json[]): Json => rm(id, `The Fox at the Shrine: ${name}`, base(), intro, choices);

const gn31: Json[] = [
  // ---- The shrine (S1, step 1, must-see) ----
  gev('gn-31-shrine', 'The Fox at the Shrine', base({ stop: 'event', rarity: 'rare', requires: [not('fox-met'), not('fox-declined')] }), say(
    'A roadside shrine, older than the road. Nine stone lanterns stand in a row, and only one is lit. Nobody tends the flame.',
    'A Ninetales watches from the roof, nine tails still in the dusk. It has been watching a long time.',
    '**The Ninetales, in your head:** "I am keeping a promise. I\'ve forgotten whose. Will you carry it a while?"',
    '*It looks at the eight dark lanterns, and then at you.*',
  ), [
    ch('Carry it.', out('The flame leans toward you, once, the way a candle leans toward an open door.', flag('fox-met'), stampRegion('fox-at'), setTo('fox-lit', 0))),
    ch('Walk on.', out('You bow, because it seems right, and walk on. Behind you the lantern stays lit. It has plenty of practice.', flag('fox-declined'))),
  ]),

  // ---- Lantern 1 (S1, step 4, optional): carry water ----
  ...task(1, 'Water', {}, say(
    'The first lantern\'s task is written on the stone in a thin, old hand: *Carry water from the stream to the shrine.*',
    'The stream is a long walk from the road. A cracked stone bowl waits beside the lantern. It holds almost nothing.',
    '*Nine tails. A very patient wait. It would never say it is thirsty.*',
  ), out(say(
    'You cup what you can, again and again, and carry it up the hill in a leaking bowl. It takes most of an hour.',
    'The bowl is full when you finish. The Ninetales drinks first, then pours the rest over the stone.',
  ), ...light(1), bond(1), good(1))),

  // ---- Lantern 2 (S2, step 5): return a lost thing ----
  ...task(2, 'A Lost Thing', {}, say(
    'The second lantern\'s task: *Return a lost thing to its owner.*',
    'In the grass beside the road there is a child\'s scarf, red wool, a name stitched inside the hem. It has been rained on.',
    'Somebody is missing this. Somebody has been looking.',
  ), out(say(
    'You ask at the next house, and the next. The third door opens on a boy who stops mid-word and starts to cry.',
    '**The boy:** "I thought it was gone for good. I looked for days. Thank you. Thank you."',
    'The second lantern lights while you are still walking back.',
  ), ...light(2), good(1))),

  // ---- Lantern 3 (S3, step 8, optional): forgive a debt ----
  ...task(3, 'A Debt', {}, say(
    'The third lantern\'s task: *Forgive a debt someone owes you.*',
    'A trainer is waiting on the path. You beat them on the road, days back, and they never paid the prize money. They owe you six hundred and an apology.',
    '**The trainer:** "I know what I owe. I sold my bike to get it. It\'s here, all of it, counted twice. I\'m sorry it took so long."',
    '*They hold the money out. Their hand is not quite steady.*',
  ), out(say(
    'You hold up one hand. **You:** "Keep it. We\'re even."',
    'The trainer stares, and then sits down on the path, all at once, like someone cut a string. They are laughing and crying together.',
    '**The trainer:** "I\'ll remember you did that. I won\'t forget."',
  ), ...light(3), bond(1), good(1)), [], { text: 'You take the six hundred. It is yours; nobody could say otherwise. The trainer thanks you for waiting, and walks home.', fx: [$(600)] }),

  // ---- Lantern 4 (S4, steps 6-7, any lane): keep silent for a step ----
  ...task(4, 'Silence', { requires: [is('fox-met'), here, not('fox-l4'), not('fox-r4')] }, say(
    'The fourth lantern\'s task: *Keep silent for a step.*',
    'Nothing else is written. The stone around the lantern is worn smooth, as if people have run their thumbs over it for centuries, waiting.',
    'It will be hard. Everything on the road wants an answer.',
  ), out(say(
    'You close your mouth, and you leave it closed.',
    '*For the rest of this step, whatever anyone asks you, your answer is "…".*',
  ), gn('foxSilence'), { kind: 'laterEvent', eventId: 'gn-31-quiet-2', nodes: 1 })),
  // The step after: the silence is over, and the lantern lights.
  wroom('gn-31-quiet-2', 'Silence', say(
    'A bird starts up in the hedge. A cart goes by. The wind moves the grass in long waves.',
    'You can hear everything. For a whole step you were not part of it. You were only listening, which is its own kind of company.',
  ), [ch('…', out(say(
    'For a whole step the world had your whole attention, and you asked it for nothing.',
    '*Somewhere behind you, a lantern catches without a spark.*',
  ), ...light(4), intel(1)))]),

  // ---- Lantern 5 (S5, step 15): lose on purpose ----
  ...task(5, 'A Game', {}, say(
    'The fifth lantern\'s task: *Lose something on purpose.*',
    'A little girl is playing stones by the road, alone, flipping them off the back of her hand. She looks up at you, hopeful, and defensive.',
    '**The girl:** "Nobody plays with me anymore. I always win. Will you? Please? Even if you\'re better."',
  ), out('You crouch beside her and pick up three stones. She gives you a very serious look.', scene('gn-31-game'))),
  wroom('gn-31-game', 'A Game', say(
    'The stones fly. Your toss is steady. You could clear every one of hers, and she knows it, and she is waiting to see what you do.',
    'It costs you nothing but a win. It costs you a win.',
  ), [
    ch('Play to win.', out(say(
      'You win, cleanly. She stares at the stones, then at you, then she picks them up very carefully and goes home without a word.',
      '*The fifth lantern stays dark.*',
    ), flag('fox-r5'))),
    ch('Let her win.', out(say(
      'You miss the last stone by a hair, and you are very good at looking surprised.',
      '**The girl:** "I won! I *won*! Did you see?" You tell her you did. It is the best loss you ever took.',
    ), ...light(5), bond(1), good(1))),
  ]),

  // ---- Lantern 6 (S6, step 3, optional): leave food for something that won't thank you ----
  ...task(6, 'Food', {}, say(
    'The sixth lantern\'s task: *Leave food for something that won\'t thank you.*',
    'At the edge of the trees, something is watching you. It is thin, and wary, and has the eyes of a creature that has been chased.',
    'It will take the food the moment you are gone. It will never look at you with anything but suspicion.',
  ), out(say(
    'You put the food down, well back from the trees, and you walk away without looking over your shoulder.',
    'When you finally do look, the bowl is empty. There is no thanks, and that is exactly what the lantern wanted.',
  ), $(-150), ...light(6), good(1)), [money(150)]),

  // ---- Lantern 7 (S7, step 12, optional): give away the item you'd least like to ----
  ...task(7, 'A Gift', {}, say(
    'The seventh lantern\'s task: *Give away the item you\'d least like to.*',
    'A traveller sits by the road with an empty satchel and a sick Pokémon in her lap. She isn\'t asking. She is far too proud for that.',
    'You know exactly which thing in your bag you wouldn\'t want to part with. So does she, somehow.',
  ), out(say(
    'You open your bag, and your hand goes straight to the one thing you did not want to give up.',
    'The traveller reads it in your face. **The traveller:** "You don\'t have to." You press it into her hands anyway.',
  ), gn('giveDearest', { key: 'fox-gave' }),
  when('fox-gave', { min: 1, max: 1 }, [...light(7), good(1)]),
  when('fox-gave', { min: 0, max: 0 }, [], 'Your bag is empty. There is nothing to give. The lantern stays dark.'))),

  // ---- Lantern 8 (S8, step 10, at a + node if one is near): stay awake one rest ----
  ...task(8, 'The Night Watch', { requires: [is('fox-met'), here, not('fox-l8'), not('fox-r8')] }, say(
    'The eighth lantern\'s task: *Stay awake one rest.*',
    'The camp is warm. Your Pokémon are drifting off, one by one, into the easy sleep of the well fed.',
    'Somebody has to sit up with the dark. It will be you. Your lead will not rest tonight.',
  ), out(say(
    'You put your back against a tree and watch the fire. The others sleep, and heal, and breathe slowly.',
    'Your lead sits up beside you, awake, with its shoulder against yours. Neither of you says a word till the sun comes.',
  ), { kind: 'heal', share: 1, who: 'others' }, ...light(8), bond(2))),

  // ---- Lantern 9 (S8, step 19): come back ----
  ...task(9, 'Come Back', { rarity: 'epic' }, say(
    'The ninth lantern\'s task is the shortest of all: *Come back.*',
    'The shrine is where you left it, and so is the Ninetales. It has been on the roof the whole time, nine tails in the dusk.',
    'It does not say it is glad. It lowers its head instead.',
  ), out(say(
    'You climb the old steps once more. The Ninetales looks at the lights, one at a time.',
    '*The last lantern takes the flame as if it has been waiting a thousand years for the one thing: that someone returned.*',
  ), ...light(9), when('fox-lit', { min: 8 }, [scene('gn-31-nine')]), when('fox-lit', { max: 7 }, [], 'Some of the nine stay dark. The Ninetales looks at each of them, and then at you. "It\'s a start," it says. "It will do."'))),

  // ---- All nine lit ----
  wroom('gn-31-nine', 'Remembered', say(
    'Nine lanterns burn in a row, and for the first time in a long age the shrine is bright from end to end.',
    '**The Ninetales:** "I remember. It was made to me. A trainer. \'I\'ll come back.\' ...You are not them."',
    '*It looks at the nine lights.*',
    '**The Ninetales:** "It\'s kept. I\'ve decided."',
  ), [ch('Bow.', out(say(
    'A small kit pads out of the shadow under the roof, orange and soft, and sits down on your foot. It has been raised here, in the quiet.',
    'It has your scent on it already. It has been waiting for you, even though it never knew you.',
  ), { ...join({ species: ['vulpix'] }), ability: 'thousand-year-promise' }, moment('The Ninetales at the shrine decided the promise had been kept.', 80)))]),
];

export const EVENTS: Json[] = gn31;
export const REMOVE: string[] = [];

const BEAT: Placement = { gn: 'gn.new.31', shape: 'Region', earliest: 'A9', sits: 'must-see', tags: ['Region-Wide Story', 'Legendary-Adjacent'], level: 'No battles', often: 'run', badge: 'own', chain: 'gn.new.31' };
const lanes = (n: number, stage: string, home: number, window: [number, number]): { beat: string; event: string; stage: string; home: number; window: [number, number] } => ({ beat: `Lantern ${n}`, event: `gn-31-l${n}`, stage, home, window });
const BEATS = [
  { beat: 'The shrine', event: 'gn-31-shrine', stage: 'S1', home: 1, window: [1, 2] as [number, number] },
  lanes(1, 'S1', 4, [3, 6]), lanes(2, 'S2', 5, [4, 7]), lanes(3, 'S3', 8, [6, 10]), lanes(4, 'S4', 6, [6, 7]), lanes(5, 'S5', 15, [13, 17]),
  lanes(6, 'S6', 3, [2, 5]), lanes(7, 'S7', 12, [10, 14]), lanes(8, 'S8', 10, [8, 12]), lanes(9, 'S8', 19, [17, 19]),
];
const L = (n: number, stage: number, home: number, window: [number, number], sits: 'must-see' | 'optional', attaches: Placement['attaches'] = 'after'): Placement => ({ ...BEAT, beat: n, sits, attaches, stages: [stage], home, window, beats: BEATS });
export const PLACEMENT: Record<string, Placement> = {
  'gn-31-shrine': { ...BEAT, beat: 0, attaches: 'before', stages: [1], home: 1, window: [1, 2], beats: BEATS, note: 'Badge: a stone lantern. Step 1 of Stage 1. Not a run\'s first region. Once a run (the doc says once per save; no memory across runs); a refused lantern stays dark for the rest of this run.' },
  'gn-31-l1': L(1, 1, 4, [3, 6], 'optional'),
  'gn-31-l2': L(2, 2, 5, [4, 7], 'must-see'),
  'gn-31-l3': L(3, 3, 8, [6, 10], 'optional'),
  'gn-31-l4': { ...L(4, 4, 6, [6, 7], 'must-see'), note: 'Steps 6 to 7, any lane. For the rest of that step every choice of every event reads "…" (core/greenneedle/fox.ts foxSilent); the lantern lights one node on.' },
  'gn-31-l5': L(5, 5, 15, [13, 17], 'must-see'),
  'gn-31-l6': L(6, 6, 3, [2, 5], 'optional'),
  'gn-31-l7': L(7, 7, 12, [10, 14], 'optional'),
  'gn-31-l8': { ...L(8, 8, 10, [8, 12], 'must-see', 'rest'), note: 'At a + node if one is near.' },
  'gn-31-l9': L(9, 8, 19, [17, 19], 'must-see', 'before'),
};

export const CHAINS: Json[] = [];
