// Greenneedle gn.new.13: The Ones You Left (doc GREENNEEDLE_PLACED_1.md lines 479–506).
// Build: npm run co:build -- greenneedle-new-13   then   npm run co:gn
import { ch, out, type Json } from '../dsl.ts';
import { bondAll, chIf, gev, gn, is, moment, rm, say, scene, setTo, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// A cold fire at the camp where the last lost run ended. Six Poké Balls on a log, and the notebook in the player's handwriting.
// The newest lost run's team (core/greenneedle/left.ts) waits; you may take one back, or bury the notebook. The others each decide.
const CAMP_TINT = '#3b3a4e';
const camp = (o: Json = {}): Json => ({ tint: CAMP_TINT, tags: ['Story', 'Recovery'], effect: 'none', ...o });
const left = (n: number): Json => ({ kind: 'gn', test: 'leftHas', n });

const door = gev('gn-new-13-door', 'The Ones You Left', camp({ stop: 'event', rarity: 'uncommon', requires: [{ kind: 'retiredGhost' }] }), say(
  'A cold fire. A bedroll, still rolled. Six Poké Balls in a row on a log, and beside them, a notebook in your own handwriting.',
  'The last page is the team, by nickname. Under it, in a hurry: "Tomorrow, the Gym."',
  'The Balls open by themselves. They have been waiting. They look at you the way a Pokémon looks at someone it remembers losing with.',
), [
  ch('Take one.', out('You kneel by the log. Nobody asks you to hurry. The Balls wait for you to choose, and they do not look away.', scene('gn-new-13-pick-a'))),
  ch('Take none. Bury the notebook.', out(say(
    'You dig a hole beside the fire, with your hands, and it takes longer than it should.',
    'The notebook goes in. Your Pokémon stand around the little grave and watch, the way you watch a friend do something hard. Nobody says anything.',
    'When you stand, they stand closer. Something is different, and none of you could say what.',
  ), bondAll(1), setTo('left-buried', 1), gn('leftFates'), scene('gn-new-13-goodbye'))),
]);

const take = (n: number): Json => chIf([left(n)], `The ${['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][n - 1]} Ball: {left:${n}}.`, out(
  'You lift the Ball. It is warm, as if someone has been holding it. It opens in your hand, and the one inside steps out and leans against you without a word. It remembers one thing it knew then, and shows you.',
  gn('leftTake', { n }), gn('leftFates'), scene('gn-new-13-goodbye'),
));

const pickA = rm('gn-new-13-pick-a', 'The Ones You Left: The Balls', camp(), say(
  'The notebook says who they were. The Balls say who they still are.',
  'The first three, on the left of the log: {left:1}, {left:2}, {left:3}.',
), [take(1), take(2), take(3), ch('Look at the others.', out('You move down the log, past the cold fire.', scene('gn-new-13-pick-b')))]);

const pickB = rm('gn-new-13-pick-b', 'The Ones You Left: The Other Balls', camp(), say(
  'The three on the right of the log. One of them is already looking toward the trees.',
  'The last three: {left:4}, {left:5}, {left:6}.',
), [take(4), take(5), take(6), ch('Look at the first three.', out('You move back along the log.', scene('gn-new-13-pick-a')))]);

const goodbye = rm('gn-new-13-goodbye', 'The Ones You Left: Morning', camp({ remembers: [
  { id: 'took', when: [is('left-took')], notice: 'The one you took walks beside you, a little behind, the way it used to. It looks back once, at the rest, and then ahead.' },
  { id: 'buried', when: [is('left-buried')], notice: 'The fresh earth is the only thing left to look at. Your Pokémon walk past it slowly, one at a time, and touch it.' },
] }), say(
  'The others decide for themselves, and you do not get a vote. That is the whole of it.',
  'Two go with a passing trainer, who calls out, "Good ones, these. I\'ll look after them." Two stay at the camp. They will keep the fire going.',
  'One walks into the woods, {left:woods}, and does not look back. You watch the trees until you cannot tell which one it was.',
), [
  ch('Walk on.', out('You put out the last of the fire. The camp stays where it is. You do not turn around, because the one in the woods would not want you to.', moment('Met the team I lost, and let them choose.', 70))),
]);

export const EVENTS: Json[] = [door, pickA, pickB, goodbye];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-13-door': {
    gn: 'gn.new.13', shape: 'Single', earliest: 'A4', home: 13, window: [13, 17], sits: 'optional', attaches: 'after', tags: ['Reunion'],
    level: 'That team, scaled to this absolute stage', often: 'run', badge: 'own',
    dressing: { kanto: 'The Ones You Left', elsewhere: 'The Ones You Left' },
    note: 'Needs a lost run on this save (the newest lost team, `retired:team`; once per run, so once per lost run). Step 13, fallback step 17. The other Pokémon decide by a seeded shuffle: one walks into the woods, the rest split between a passing trainer and the camp (run flag `left:fates`, read by gn.61). Nicknames are not kept in the run record, so the Balls show species and old level.',
  },
};
export const CHAINS: Json[] = [];
