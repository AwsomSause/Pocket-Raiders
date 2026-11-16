// Greenneedle gn.new.24 The Night Shift at the Day-Care (doc GREENNEEDLE_PLACED_2.md lines 143-174).
// Build: npm run co:build -- greenneedle-new-24   then   npm run co:gn
// Five waves on the garden's four sides. Before each wave the player places two sentries (a pair of sides): a covered side means the raider
// starts the fight at -1 Attack and -1 Speed. After wave 2 the player may leave food at the fence instead.
import { ch, egg, fight, flag, join, out, wild, type Json } from '../dsl.ts';
import { chIf, gev, is, moment, not, pick, say, scene, setTo, stampStage, when, laterStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#1f2a44';
const base = { stop: 'event', rarity: 'rare' as const, tint: TINT, effect: 'none' };
const room = (o: Record<string, unknown> = {}): Record<string, unknown> => ({ ...base, room: true, ...o });

/** A pair of sides the two sentries guard: label, and which raid sides (1 north, 2 south, 3 east, 4 west) it covers. */
const PAIRS: [string, number[]][] = [['North and south.', [1, 2]], ['East and west.', [3, 4]], ['North and east.', [1, 3]], ['South and west.', [2, 4]]];

const WAVE_FOES = ['sneasel', 'sneasel', 'sneasel', 'sneasel', 'weavile'];
/** Where the story goes after wave k (1-5). */
const AFTER = ['gn-new-24-sent-2', 'gn-new-24-food', 'gn-new-24-sent-4', 'gn-new-24-sent-5', 'gn-new-24-end'];

const lost = (k: number): Json[] => [flag('daycare-egg-taken'), stampStage('ns-at'), scene(AFTER[k - 1]!)];
const waveFight = (k: number, covered: boolean): Json => ({
  ...wild({ species: [WAVE_FOES[k - 1]!], lv: k === 5 ? 0 : -1, win: [scene(AFTER[k - 1]!)] }),
  exact: true, friendly: true, lose: lost(k),
  rule: { noCatch: true, ...(covered ? { foeStages: { atk: -1, spe: -1 } } : {}) },
});

const WAVE_LINE = [
  'Something small and quick comes over the fence with a sack already open. A Sneasel, thin as a coat hanger.',
  'The second one has learned from the first. It stays low, and goes for the shed door.',
  'The third raider doesn\'t even look at you. It looks at the shed, at the forty eggs in it, the way you look at supper.',
  'The fourth is the thinnest of all, and the fastest. Mrs. Holloway bangs the pan. It doesn\'t stop.',
  'The Weavile with the torn ear comes over the wall last, slowly. It isn\'t hungry for the eggs. It looks like it hasn\'t been warm in years.',
];
const SIDE_LINE = (k: number): string => `Wave ${k} of five. The wind turns, and the garden goes quiet on one side. Where do the two sentries stand?`;

const sentries = (k: number): Json =>
  gev(`gn-new-24-sent-${k}`, `The Night Shift: Sentries ${k}`, room(), say(
    SIDE_LINE(k),
    '*North, south, east, west. Two of your Pokémon, one pair of sides. The raiders won\'t say which way they\'re coming.*',
  ), PAIRS.map(([label, covers]) => ch(label, out(
    'Your Pokémon take their places in the wet grass, and the garden holds its breath.',
    pick('ns-side', 1, 1, 1, 1), setTo('ns-cover', 0),
    ...covers.map((s) => when('ns-side', { min: s, max: s }, [setTo('ns-cover', 1)])),
    scene(`gn-new-24-w${k}`),
  ))));

const wave = (k: number): Json =>
  gev(`gn-new-24-w${k}`, `The Night Shift: Wave ${k}`, room(), say(
    WAVE_LINE[k - 1]!,
    k === 5 ? '*They aren\'t a team. Four thin Sneasel, and a Weavile with a torn ear.*' : '*From one of the four sides.*',
  ), [
    chIf([is('ns-cover')], 'Hold the fence.', fight('It comes in from the side where your sentries stand, and meets them first. It stumbles, surprised.', waveFight(k, true))),
    chIf([not('ns-cover')], 'Run to the open side.', fight('It comes in from the side nobody is guarding, and you run for it across the wet grass.', waveFight(k, false))),
  ]);

const gnew24: Json[] = [
  gev('gn-new-24', 'The Night Shift at the Day-Care', { ...base, forced: true, effect: 'none', cast: ['trainer.oldman'], requires: [not('night-shift-done')] }, say(
    'It is midnight. The day-care couple stand in their garden holding a frying pan and a broom, and they are not joking.',
    '**Mr. Holloway:** "Three day-cares this week. Eggs gone. We\'ve forty in the shed."',
    '**Mrs. Holloway:** "We\'re not as quick as we were. Would you?"',
  ), [
    ch('Take the night shift.', out('Mrs. Holloway presses the broom into your hand. It is warm from hers. Mr. Holloway locks the shed, and checks it twice.', scene('gn-new-24-sent-1'))),
    ch('Not tonight.', out('Mr. Holloway nods like he expected it. The shed light stays on behind you for a long time.')),
  ]),
  ...[1, 2, 3, 4, 5].map(sentries),
  ...[1, 2, 3, 4, 5].map(wave),
  gev('gn-new-24-food', 'The Night Shift: The Fence', room(), say(
    'Two waves down. The garden is quiet, and the quiet has weight. In the dark by the fence, something is sitting very still.',
    '*They aren\'t a team. They are hungry, and they are not stupid.*',
  ), [
    ch('Leave food at the fence.', out(say(
      'You set down a bowl of Mrs. Holloway\'s stew, and step back, and say nothing. The raids stop. The night goes quiet.',
      'At dawn the Weavile with the torn ear comes to the gate. It looks at you through the bars for a long, long time. Then it goes.',
    ), flag('daycare-fed'), setTo('night-shift-sneasel', 1), scene('gn-new-24-end'))),
    ch('Hold the garden.', out('You shake out the broom. Three waves to go. Behind you, the shed door rattles, and holds.', scene('gn-new-24-sent-3'))),
  ]),
  gev('gn-new-24-end', 'The Night Shift: Morning', {
    ...base, room: true,
    remembers: [
      { id: 'fed', when: [is('daycare-fed')], notice: 'Mrs. Holloway has left a second bowl at the fence. The Weavile\'s tracks go up to it, and stop.' },
      { id: 'taken', when: [is('daycare-egg-taken')], notice: 'The shed is one egg short. Mr. Holloway counts it three times, and doesn\'t say anything. His hands say it.' },
    ],
  }, say(
    'The sun comes up over a flattened garden, and a shed full of eggs, and a couple who have not sat down all night.',
    '**Mrs. Holloway:** "Take one. Please. We\'d only worry that it was the wrong one anyway."',
    'Three eggs sit on the table, each in a different knit cosy.',
  ), [
    ch('The speckled one.', out('It is warm, and heavier than it looks.', when('daycare-egg-taken', { min: 0, max: 0 }, [flag('daycare-defended')]), setTo('night-shift-done', 1), egg({ types: ['normal', 'fairy'] }))),
    ch('The mossy one.', out('It smells of rain and garden. Something inside it shifts when you laugh.', when('daycare-egg-taken', { min: 0, max: 0 }, [flag('daycare-defended')]), setTo('night-shift-done', 1), egg({ types: ['water', 'bug', 'grass'] }))),
    ch('The warm red one.', out('It is hot as a stone from a campfire, and it ticks, softly.', when('daycare-egg-taken', { min: 0, max: 0 }, [flag('daycare-defended')]), setTo('night-shift-done', 1), egg({ types: ['fire', 'electric', 'fighting'] }))),
  ]),
  gev('gn-new-24-found', 'The Night Shift: The Egg That Was Taken', {
    ...base, callback: true, cast: ['trainer.oldman'], requires: [is('daycare-egg-taken'), laterStage('ns-at'), not('ns-found')],
  }, say(
    'Behind a collapsed barn, in a nest of coats and dry leaves, a hatchling is asleep. Four thin Sneasel sit around it, taking turns to keep watch.',
    'It hatched here. It has their way of tucking its chin. A hatchling raised by Sneasel has a nature no day-care would ever have given it.',
  ), [
    ch('Take it home.', out('The Sneasel watch you lift it. The thinnest one steps aside, and doesn\'t make a sound.', { ...join({ species: ['sneasel'], lv: -3 }), nature: 'naughty' }, setTo('ns-found', 1), moment('Found the stolen egg, hatched and raised by the Sneasel who took it.', 70))),
    ch('Leave it with them.', out('The hatchling yawns. The Sneasel look at you as if you had finally said something sensible.', setTo('ns-found', 1))),
  ]),
];

export const EVENTS: Json[] = gnew24;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-24': {
    gn: 'gn.new.24', shape: 'Interrupting', earliest: 'A5', home: 10, window: [10, 19], sits: 'must-see', tags: ['Interrupting Episode'], needs: ['night'],
    level: 'A-1 Sneasel; A+0 Weavile', often: 'run', badge: 'own',
    dressing: { kanto: 'The Night Shift at the Day-Care', elsewhere: 'The Night Shift at the Day-Care' },
    note: 'Fallback step 19. Five waves. A wave lost: one egg is taken (found hatched at step 7 of a later stage, optional: gn-new-24-found).',
  },
  'gn-new-24-found': {
    gn: 'gn.new.24', shape: 'Single', earliest: 'A5', home: 7, window: [5, 10], sits: 'optional', attaches: 'after', tags: ['Interrupting Episode'], level: 'None', often: 'run', badge: 'own',
    dressing: { kanto: 'The Egg That Was Taken', elsewhere: 'The Egg That Was Taken' },
    note: 'Only after a wave was lost, a later stage.',
  },
};
export const CHAINS: Json[] = [];
