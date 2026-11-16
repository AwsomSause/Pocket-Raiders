// Greenneedle gn.61: The Final Reunion (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 196-289).
// Build: npm run -s co:build -- greenneedle-61   then   npm run -s co:gn
// A walkable field (rooms that come back to the hub), the far edge, introductions, giving things back, then who stands with you in the last battle.
import { ch, isEvil, out, type Json } from '../dsl.ts';
import { chIf, gev, gn, is, rm, say, setTo, when, type Placement } from './_gn.ts';
import { anyFlag } from './_ne.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#5a4a6b';
const o = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({ tint: TINT, ...extra });
const room = (id: string): Json => ({ kind: 'addEvent', eventId: id });
const HUB = 'gn-61-hub';
const PLACE: Json = { kind: 'runPlace', regionEnd: true, lastRegion: true };

// After the third ask there is no fourth helper: go straight to the ending.
const ask = (n: number): Json[] => n >= 3 ? [room('gn-61-end')] : [
  when('reunion-offers', { min: n + 1 }, [room(`gn-61-help-${n + 1}`)]),
  when('reunion-offers', { min: 0, max: n }, [room('gn-61-end')]),
];

const help = (n: 1 | 2 | 3): Json => rm(`gn-61-help-${n}`, 'The Final Reunion: Who Stands With You', o(), say(
  '*A figure steps out of the crowd, and then stops, as if it wasn\'t sure it was allowed.*',
  '**{reunion:offer:' + n + '}** is one of the three the field remembers best. Yours to ask, or not.',
  '{reunion:ask:' + n + '}',
), [
  ch('Ask them to stand with you.', out('They nod once. It is not a small thing to be asked, and they know it. They will be there when you call.', setTo(`reunion-help-${n}`, 1), ...ask(n))),
  ch('Let them rest.', out('They look relieved, and a little hurt, and then relieved again. "Another time," they say. "Whichever time that is."', setTo(`reunion-help-${n}`, 0), ...ask(n))),
]);

const pair = (n: number, a: string, b: string, text: string): Json => chIf([is(`reunion-pair-${n}`)], `Introduce ${a} and ${b}.`, out(text, setTo(`reunion-pair-${n}`, 0), setTo(`reunion-introduced-${n}`, 1), room(HUB)));

export const EVENTS: Json[] = [
  gev('gn-61-field', 'The Final Reunion', o({ stop: 'event', rarity: 'epic', forced: true, tags: ['Story', 'Relationship'], requires: [PLACE, { kind: 'flag', key: 'reunion-done', atLeast: 0, atMost: 0 }] }), say(
    '*A field outside the last city. Evening.*',
    '*You come over the rise, and stop.*',
    '*There are a lot of people in the field.*',
  ), [
    ch('Walk down into the field.', out('The grass is long, and flattened in places where people have been standing a while, waiting. They turn, one at a time, as you come down.', gn('reunionArrive'), room(HUB))),
  ]),
  rm(HUB, 'The Final Reunion: The Field', o({ remembers: [
    { id: 'few', when: [isEvil(3), is('reunion-count', 0, 6)], notice: '*There are six people in the field. They have each brought two chairs, to make it look fuller. It is the kindest thing in the game.*' },
    { id: 'taken', when: [anyFlag('hoenn-took-all', 'called-it-for-us')], notice: '*The field is full. Nobody is talking. They came because they were told to. Only your rival walks up.*' },
  ] }), say(
    '{reunion:crowd}',
    '*No one is asking for a speech. There are rugs on the grass and lanterns in the trees, and the evening is going slowly.*',
    '*Nobody has to fight tonight. Nobody has to win. They all got here by walking.*',
  ), [
    ch('Walk among them and talk.', out('You go in. People make room without being asked, and then close up behind you.', gn('reunionWalk', { n: 0 }), room('gn-61-walk'))),
    chIf([anyFlag('reunion-pair-1', 'reunion-pair-2', 'reunion-pair-3')], 'Introduce two people who should meet.', out('You look around the field for two who have never been in a room together.', room('gn-61-intro'))),
    chIf([anyFlag('psyduck-hat', 'psyduck-ibuprofen')], 'Give something back.', out('You have things that were never yours. You find the people they belong to.', room('gn-61-give'))),
    ch('Sit down where you are.', out('Somebody has left a chair empty beside you. You sit in it. Whoever you were last standing with sits down on your other side. Where you sat is where you will be at the table.', when('reunion-farvisit', { min: 1 }, [setTo('reunion-sat', 2)]), when('reunion-farvisit', { min: 0, max: 0 }, [setTo('reunion-sat', 1)]), when('reunion-offers', { min: 1 }, [room('gn-61-help-1')]), when('reunion-offers', { min: 0, max: 0 }, [room('gn-61-end')]))),
  ]),
  // One at a time: the player walks up to each, and each has one line. Whoever they are with when they sit is beside them at the Long Table.
  rm('gn-61-walk', 'The Final Reunion: Everyone Has One Line', o(), say('{reunion:one}'), [
    chIf([is('reunion-walkleft')], 'Walk on to the next.', out('You walk on. Somebody else has been waiting, and trying not to look as if they were.', gn('reunionWalk', { n: 1 }), room('gn-61-walk'))),
    chIf([is('reunion-farleft')], 'Stand at the far edge.', out('You walk past the lanterns, and past the last of the chairs, to where the grass is long and nobody is standing.', room('gn-61-far'))),
    ch('Go back to the middle.', out('The crowd makes room, and closes up again.', room(HUB))),
  ]),
  rm('gn-61-far', 'The Final Reunion: The Far Edge', o(), say(
    '*They came. They aren\'t coming closer. They can be walked up to.*',
    '{reunion:far}',
  ), [
    ch('I\'m sorry.', out('You say it, plainly, and without anything after it.', gn('reunionFar', { n: 1 }), when('reunion-farleft', { min: 1 }, [room('gn-61-far')]), when('reunion-farleft', { min: 0, max: 0 }, [room('gn-61-walk')]))),
    ch('I\'d do it again.', out('You say it. It is true, and it sounds worse out loud than it did in your head.', gn('reunionFar', { n: 2 }), when('reunion-farleft', { min: 1 }, [room('gn-61-far')]), when('reunion-farleft', { min: 0, max: 0 }, [room('gn-61-walk')]))),
    ch('(Say nothing, and stay.)', out('You stand there. The wind moves the grass.', gn('reunionFar', { n: 3 }), when('reunion-farleft', { min: 1 }, [room('gn-61-far')]), when('reunion-farleft', { min: 0, max: 0 }, [room('gn-61-walk')]))),
    ch('Go back to the others.', out('You leave them the quiet. It is the only thing you have left to give them.', room('gn-61-walk'))),
  ]),
  rm('gn-61-intro', 'The Final Reunion: Introductions', o(), say(
    '*Two people in the crowd keep looking at each other, and not at each other, the way people do who have heard a great deal and never met.*',
    '*Nothing is gained by it. That is the point.*',
  ), [
    pair(1, 'Idris', 'Ferris', 'Idris holds up a boot. Ferris, with a Pokémon asleep in their lap, nods at it gravely. "Left," says Idris. "Right," says Ferris. They have a great deal to discuss.'),
    pair(2, 'the Samurai', 'the Duelist', 'The Samurai bows. The Duelist bows lower, then wrongly, then tries again. Neither will say who won. Both of them are smiling.'),
    pair(3, 'the Cubone', 'the Mimikyu', 'The Cubone looks at the Mimikyu\'s coat, and the Mimikyu looks at the skull. Neither says a word. The Mimikyu makes room on the chair.'),
    ch('Go back to the middle.', out('You leave them to it.', room(HUB))),
  ]),
  rm('gn-61-give', 'The Final Reunion: Giving Something Back', o(), say(
    '*You had a few things that weren\'t yours. You kept them carefully.*',
    '*Every one of them is going to be refused.*',
  ), [
    chIf([is('psyduck-hat')], 'Give back the mayor\'s hat.', out('**The mayor:** "Keep it. I\'ve another. It\'s worse. Keep it." He puts it back on your head himself.', setTo('reunion-gave-hat', 1), room(HUB))),
    chIf([is('psyduck-ibuprofen')], 'Give back the ibuprofen.', out('**Its owner:** "No, no. Half of it was for me. Keep it, for the next headache." They look at you, and laugh, and are glad.', setTo('reunion-gave-ibuprofen', 1), room(HUB))),
    ch('Go back to the middle.', out('You keep them. They were meant for you to keep.', room(HUB))),
  ]),
  help(1), help(2), help(3),
  rm('gn-61-end', 'The Final Reunion: The Night', o(), say(
    '*The lanterns go on being lit, one at a time, by whoever is nearest.*',
    '*Somebody has begun setting out chairs. A great many chairs. Somebody is carrying a very long table.*',
  ), [
    ch('Go to the table.', out('The table is long enough for all of you.', setTo('reunion-done', 1))),
  ]),
];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-61-field': {
    gn: 'gn.61', shape: 'Single', earliest: 'A1', home: 18, window: [18, 18], sits: 'must-see', attaches: 'instead', tags: ['Finale Episode', 'Reunion Episode'],
    level: 'No battle', often: 'run', badge: 'A crowd',
    note: 'The last stage of the run\'s last region, step 18; the Long Table (gn.new.38) is step 19. Instead of the battle. Up to three helpers in the final battle (core/greenneedle/reunion.ts).',
  },
};

export const CHAINS: Json[] = [];
