// Greenneedle, gn.new.29 The Borrowed Team (doc GREENNEEDLE_PLACED_2.md lines 313–346).
// Build: npm run co:build -- greenneedle-new-29   then   npm run co:gn
// An exhibition: the referee swaps the hats. You command the rival's real team (their moves, their habits); they command yours. Rules in
// core/greenneedle/borrowed.ts. Both come out of it knowing the other's team; one Pokémon of each lingers, and gets a one-battle bonus the
// next time you meet. Rival Trust 2 or more; once per run (declining counts).
import { ch, fight, item, out, trainer, type Json } from '../dsl.ts';
import { gev, gn, is, moment, rm, say, scene, setTo, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const ring = (o: Json = {}): Json => ({ tint: '#46506a', tags: ['Story'], effect: 'none', ...o });

const AFTER_REMEMBERS: Json[] = [
  { id: 'won', when: [is('borrow-result', 1, 1)], notice: '*The referee raises your arm. It was the rival\'s team that did the winning, and the rival is trying hard not to look proud of them.*' },
  { id: 'lost', when: [is('borrow-result', 2, 2)], notice: '*The referee raises the rival\'s arm. Your own team did that, without you. They keep looking back at you to see if you mind.*' },
];

const door = gev('gn-new-29-hats', 'The Borrowed Team', ring({ stop: 'event', rarity: 'rare', forced: true, requires: [is('borrow-met', 0, 0), gnc('rivalTrust', { n: 2 })] }), say(
  'A referee holds out two hats. One is yours. One is theirs. Nobody has told the Pokémon yet.',
  '**Referee:** "Exhibition rules. You wear theirs. They wear yours. So do the Pokémon."',
  '**{borrow:name}:** {borrow:dont}',
  '*Your lead looks from the rival to you, and back again. It has never been asked to trust a stranger before.*',
), [
  ch('Swap.', out('You put on their hat. It is a size too big, and warm, and smells faintly of their bag. The Pokémon are led across the ring.', gn('borrowStart'), scene('gn-new-29-fight'))),
  ch('Not today.', out('You hand the hat back. The referee shrugs; the rival laughs, a little relieved. Your Pokémon lean against your legs.', setTo('borrow-met', 1))),
]);

const fightRoom = rm('gn-new-29-fight', 'The Borrowed Team: The Match', ring(), say(
  'You stand at the edge of the ring with their team at your feet. Their moves. Their habits. Their quiet, particular ways of waiting.',
  'Across from you, {borrow:name} holds **your** team. Your {borrow:mine} is in front, looking over its shoulder at you.',
  '*Behind you, {borrow:theirs} looks across the ring at its trainer, then at you. It has not decided what to do about this.*',
), [
  ch('Battle.', fight('The referee drops his hand. Each Pokémon glances over its shoulder first, then obeys.', trainer('Exhibition', { cls: 'ace-trainer', size: 6, lv: 0, friendly: true, rule: { gn: 'borrowed' },
    win: [gn('borrowEnd', { n: 1 }), item('lucky-egg'), moment('Won an exhibition with the rival\'s team, while the rival used yours.', 70), scene('gn-new-29-after')],
    lose: [gn('borrowEnd', { n: 0 }), moment('Lost an exhibition with the rival\'s team, while the rival used yours.', 55), scene('gn-new-29-after')] }))),
]);

const after = rm('gn-new-29-after', 'The Borrowed Team: Hats Off', ring({ remembers: AFTER_REMEMBERS }), say(
  'The hats come off. Each Pokémon goes home, slowly, and not in a straight line.',
  'A {borrow:theirs} lingers at your knee a moment longer than it needs to. Across the ring, your {borrow:mine} has stopped beside {borrow:name} and will not be moved.',
  '**{borrow:name}:** {borrow:after}',
  '*You know their team now: every move, every habit. They know yours. Neither of you says so.*',
), [
  ch('Hand back the hats.', out('The referee collects both hats and folds them over one arm. For a moment you and the rival just stand there, knowing each other a little too well.')),
]);

export const EVENTS: Json[] = [door, fightRoom, after];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-29-hats': {
    gn: 'gn.new.29', shape: 'Single', earliest: 'A9', home: 15, window: [13, 19], sits: 'must-see', attaches: 'instead', tags: ['Rival Episode'],
    level: 'Both real teams, as they are', often: 'run', badge: 'own',
    dressing: { kanto: 'The Borrowed Team', elsewhere: 'The Borrowed Team' },
    note: 'Badge: two hats. Needs Rival Trust 2 or more (the second region or later). Step 15 must-see, fallback step 19. Once per run (declining counts). Rules in core/greenneedle/borrowed.ts: you command the rival\'s last team, they command yours; the winner gets a Lucky Egg; both learn the other\'s team and moves; one lingerer each gives a one-battle bonus (+1 Attack to each lead) at the next meeting.',
  },
};

export const CHAINS: Json[] = [];
