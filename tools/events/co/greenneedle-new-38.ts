// Greenneedle, gn.new.38 The Long Table (doc GREENNEEDLE_PLACED_2.md lines 634–667). Rules: core/greenneedle/longtable.ts.
// Build: npm run co:build -- greenneedle-new-38   then   npm run co:gn
import { ch, item, out, type Json } from '../dsl.ts';
import { chIf, gev, gn, is, not, rm, say, scene, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const FIELD = '#5a4a2e';
const field = (o: Json = {}): Json => ({ tint: FIELD, tags: ['Story', 'Recovery'], effect: 'none', ...o });
const last = (): Json => ({ kind: 'gn', test: 'lastStage' });

const seat = (k: number): Json => chIf([is(`lt-slot-${k}`)], `Sit by {lt:name:${k}}.`, out('You pull out the chair. It scrapes, loudly, on the grass. Nobody minds.', gn('ltSit', { n: k }), scene('gn-lt-talk-1')));

export const EVENTS: Json[] = [
  gev('gn-lt-door', 'The Long Table', field({ stop: 'event', rarity: 'rare', forced: true, requires: [last(), not('lt-done')] }), say(
    'The night before the last battle. In a field, a table, far too long, is being laid.',
    '*A place setting for each event that ended well, with a name card. An empty chair for each that didn\'t. At the far end, a small pile of stones: one for everything walked past.*',
    '*Everyone who was helped is carrying a dish.*',
  ), [
    ch('Walk the length of the table.', out('You walk down it slowly, reading the name cards. Some are written in very careful hands.', gn('ltArrive'), scene('gn-lt-seats'))),
  ]),
  rm('gn-lt-seats', 'The Long Table: Choose a Seat', field(), say(
    'There are {lt:count} places with a name card. Your party waits behind you, ready to sit wherever you do.',
    'Any seat. The two beside it will talk to you.',
  ), [
    seat(0), seat(1), seat(2),
    chIf([is('lt-more')], 'Walk further down the table.', out('You walk on. The lamps are strung from pole to pole, all the way along.', gn('ltPage'), scene('gn-lt-seats'))),
  ]),
  rm('gn-lt-talk-1', 'The Long Table: One Side', field(), say(
    'You sit. On one side:',
    '{lt:talk:1}',
  ), [
    chIf([is('lt-two')], 'Turn to the other side.', out('You turn in your chair, and the table seems to turn with you.', scene('gn-lt-talk-2'))),
    chIf([not('lt-two')], 'Stay until the lamps go out.', out('You stay. Nobody wants to be the first to leave a table like this.', scene('gn-lt-dawn'))),
  ]),
  rm('gn-lt-talk-2', 'The Long Table: The Other Side', field(), say(
    'On your other side:',
    '{lt:talk:2}',
  ), [
    ch('Stay until the lamps go out.', out('You stay. Nobody wants to be the first to leave a table like this.', scene('gn-lt-dawn'))),
  ]),
  rm('gn-lt-dawn', 'The Long Table: Dawn', field({ tags: ['Story', 'Recovery'] }), say(
    '*The table\'s cleared. Whatever was on your plate is in the bag: {lt:plate}.*',
    'The field is only a field again. Somewhere ahead, the last battle is waiting.',
  ), [
    ch('Pick up your bag, and go.', out('The grass is wet. Your Pokémon walk a little closer than usual. {lt:count} chairs, and one pile of stones, behind you.', item('oran-berry'), gn('ltDawn'))),
  ]),
];
export const REMOVE: string[] = [];
export const PLACEMENT: Record<string, Placement> = {
  'gn-lt-door': {
    gn: 'gn.new.38', shape: 'Single', earliest: 'A1', home: 19, window: [18, 19], sits: 'must-see', attaches: 'before', tags: ['Finale'],
    level: 'No battle', often: 'run', badge: 'own',
    dressing: { kanto: 'The Long Table', elsewhere: 'The Long Table' },
    note: 'Finale: only on the run\'s last stage (the last stage of the last region), step 19, before the final battle. Once per run. +1% to every stat of the party in the last battle per filled place, capped at 10%.',
  },
};
export const CHAINS: Json[] = [];
