// Greenneedle gn.new.32 The Storm Chaser (doc GREENNEEDLE_PLACED_2.md lines 422-459): three sightings and a fourth meeting.
// Build: npm run co:build -- greenneedle-new-32   then   npm run co:gn
// Memory (this run only): raikou-sighting counts the sightings; raikou-approached / -waited / -ball / -pichu count the choices;
// raikou-ball and raikou-calm (Wait; sheltering the Pichu is its own memory, raikou-pichu) decide the fourth meeting: Balls all three times = a fair fight, calm all three = the night
// at camp, anything else = the nod.
import { ch, fight, flag, item, out, wild, type Json } from '../dsl.ts';
import { exactly, gev, is, laterStage, moment, not, say, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#4f5f7f';
const storm = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Exploration', 'Legendary'], effect: 'rain', ...o });
const SEEN = (n: number): Json[] => [exactly('raikou-sighting', n), laterStage('raikou-step')];
const AFTER = (): Json[] => [flag('raikou-sighting'), stampStage('raikou-step')];

/** The three first-meeting choices of a sighting. */
const approach = (text: string): Json => ch('Approach.', out(text, flag('raikou-approached'), ...AFTER()));
const wait = (text: string): Json => ch('Wait.', out(text, flag('raikou-waited'), flag('raikou-calm'), ...AFTER()));
const ball = (text: string): Json => ch('Throw a Ball.', out(text, flag('raikou-ball'), ...AFTER()));

const REMEMBERS_WAIT: Json = { id: 'waits', when: [is('raikou-waited', 1)], notice: 'The air on this hill is the same as the last one. Still, and heavy, and waiting for you to move.' };

export const EVENTS: Json[] = [
  gev('gn-32-pool', 'The Storm Chaser', storm({ stop: 'event', rarity: 'rare', requires: [not('raikou-sighting')] }), say(
    '*Lightning hits the same hill three times. You count. Then you look up.*',
    'Something is standing on it. Four legs. A mane like a thunderhead. Drinking from a pool the rain made, as if the storm were its own.',
  ), [
    approach('You climb. It lets you get to twenty paces. Then it is on the next hill, drinking again, as if you were weather that changed your mind.'),
    wait('You sit in the wet grass and let it finish. It drinks for a long time. Then it looks at you, once, and goes. The pool is still shaking.'),
    ball('The Ball leaves your hand. It bats it out of the air without turning its head. The Ball rolls away in the rain, and it goes on drinking.'),
  ]),
  gev('gn-32-ridge', 'The Storm Chaser: The Ridge', storm({ stop: 'event', rarity: 'rare', callback: true, requires: SEEN(1), remembers: [REMEMBERS_WAIT] }), say(
    '*A town below, lights on in the rain. A ridge above it. The lightning keeps landing on one spot.*',
    'It is there again. Watching the town from the rock, the way a guard watches, or a child at a window. Water runs off its flanks in sparks.',
  ), [
    approach('You get close enough to hear it breathe. It turns its head. The town is quiet below. It leaves along the ridge, unhurried, and every light below flickers once.'),
    wait('You sit down on the wet rock and look at the town too. It looks at you. Then back. Neither of you has anywhere to be.'),
    ball('The Ball arcs out. It bats it away without turning its head, the same as before, and goes on watching the town as if you were not there.'),
  ]),
  gev('gn-32-pichu', 'The Storm Chaser: The Pichu', storm({ stop: 'event', rarity: 'rare', callback: true, requires: SEEN(2), remembers: [REMEMBERS_WAIT] }), say(
    '*A cry in the rain, thin and high. Beneath a tree the lightning has already split once, a tiny yellow shape is trembling.*',
    'A Pichu. It crept too close to the great beast on the hill, and now it cannot move. The beast stands over it, very still.',
  ), [
    approach('You step forward. The beast lets you, then steps off the hill before you can reach it. The Pichu is still shaking, still alone, and still staring after it.'),
    wait('You hold your place. The beast looks at the Pichu, at you, at the Pichu. Then it steps back, and back, and is gone into the clouds.'),
    ball('The Ball goes wide. It bats it out of the air with a paw, almost bored, and looks down at the Pichu as if to ask what you thought you were doing.'),
    ch('Shelter the Pichu.', out(say(
      'You kneel over it in the rain. Your coat is over its head. The thunder goes off like a drum, and the Pichu flinches into your arm.',
      'The beast watches. Then it steps back first, and the lightning, for a breath, stops landing on this hill.',
    ), flag('raikou-pichu'), ...AFTER())),
  ]),
  gev('gn-32-meet-fight', 'The Storm Chaser: Fair Fight', storm({ stop: 'event', rarity: 'rare', callback: true, requires: [...SEEN(3), is('raikou-ball', 3)] }), say(
    '*Step 17, optional. The hill again. The storm has been following your Balls for three sightings, and it has stopped being patient.*',
    'It is standing in the open, no hill to hide behind. Lightning crawls over its back. It looks at you the way you looked at it, three times.',
  ), [
    ch('Fight it.', fight('It does not wait. The air goes white. It comes down the hill like a bolt that has finally decided where to land.', {
      ...wild({ species: ['raikou'], lv: 2, win: [flag('raikou-sighting'), flag('raikou-ran'), moment('You chased the storm three times and finally fought it. It ran when it was losing.', 80)] }),
      exact: true,
      caught: [flag('raikou-sighting'), flag('raikou-caught'), moment('You chased the storm three times, and caught it.', 100)],
    })),
    ch('Walk away.', out('You have thrown enough Balls. It watches you go down the hill, with the rain on its back, and does not follow.', flag('raikou-sighting'))),
  ]),
  gev('gn-32-meet-night', 'The Storm Chaser: The Night Walk', storm({ stop: 'event', rarity: 'rare', callback: true, requires: [...SEEN(3), is('raikou-calm', 3)], tint: '#2c344a', effect: 'rain' }), say(
    '*Camp, in the dark. The fire is low, and the rain has stopped. Something outside the light is walking slowly through the tents.*',
    'It does not growl. It does not hurry. It stops at every Pokémon in the camp, lowers its head, and looks at each one, as if it were learning your names.',
  ), [
    ch('Stay still.', out(say(
      'It comes to yours last. Your lead looks up at it and is not afraid. They look at each other for a long moment.',
      'Then it turns, and goes. In the dawn there is a scorch mark in the grass, exactly the shape of a paw. Thundermark.',
    ), item('thundermark'), flag('raikou-sighting'), flag('raikou-gift'), moment('The Storm Chaser walked through your camp at night, looked at every Pokémon, and left a paw print in the grass.', 100))),
  ]),
  gev('gn-32-meet-nod', 'The Storm Chaser: The Nod', storm({ stop: 'event', rarity: 'rare', callback: true, requires: [...SEEN(3), is('raikou-ball', 0, 2), is('raikou-calm', 0, 2)] }), say(
    '*The same hill. The same lightning. The same shape against the sky.*',
    'It is on the hill once more. You were not sure which of you was chasing the other, and you are not sure now.',
  ), [
    ch('Look back.', out(say(
      'It looks at you for a long time. Then, very slightly, it nods.',
      'Nothing else. No gift, no fight. Only the nod. Then the hill is empty, and the storm walks away over the next one.',
    ), flag('raikou-sighting'), moment('You saw the storm four times. On the fourth it nodded.', 60))),
  ]),
  gev('gn-32-pikachu', 'The Storm Chaser: The Pikachu', storm({ stop: 'event', rarity: 'rare', callback: true, requires: [is('raikou-pichu'), laterStage('raikou-step'), not('raikou-pika-met')] }), say(
    '*Thunder rolls down a valley, close and loud. A Pikachu is sitting on a fence post, watching it, with its ears up.*',
    'It is the Pichu from the hill. It has grown, a little. The thunder cracks, and it does not flinch. It looks at you and grins.',
  ), [
    ch('Say hello.', out(say(
      'It runs along the fence and up your arm and sits on your shoulder, as if it had always done so.',
      'The next thunderclap rattles the valley. It leans into your neck, laughing. It remembers who stood over it in the rain.',
      'Then it hops back to its post, and turns its face to the storm again. It has thunder to watch.',
    ), flag('raikou-pika-met'), moment('The Pichu you sheltered is a Pikachu now, and it is not afraid of thunder.', 60))),
    ch('Let it be.', out('It watches you go, ears up, perfectly steady. Every time the thunder rolls, it salutes.', flag('raikou-pika-met'))),
  ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-32-pool': {
    gn: 'gn.new.32', shape: 'Region-long', earliest: 'A9', home: 7, window: [5, 12], sits: 'optional', attaches: 'after', tags: ['Legendary'], stages: [2], needs: ['storm'], needsAll: ['high'],
    level: 'The battle path: Raikou at A+2', often: 'run', badge: 'own',
    beats: [
      { beat: 'Sighting 1: drinking at a pool (needs high; fallback step 12)', event: 'gn-32-pool', stage: 'S2', home: 7, window: [5, 12] },
      { beat: 'Sighting 2: watching a town from a ridge (fallback step 17)', event: 'gn-32-ridge', stage: 'S4', home: 12, window: [10, 17] },
      { beat: 'Sighting 3: standing over a Pichu (fallback step 12)', event: 'gn-32-pichu', stage: 'S6', home: 7, window: [5, 12] },
      { beat: 'The fourth meeting: Balls only = fair fight (step 17); waited = the night walk (step 10, near a + node); mixed = the nod', event: 'gn-32-meet-night', stage: 'S7 or S8', home: 10, window: [8, 13] },
    ],
    dressing: { kanto: 'The Storm Chaser', elsewhere: 'The Storm Chaser' },
    note: 'Badge: a bolt. Once per run (the doc says per save; no memory across runs). Raikou is the battle path (fair, A+2, catchable; it runs if it is losing); the patient path (Wait at all three sightings) gives the Thundermark (a team charm: Electric-types in the party act first on turn one of a battle fought in rain). A sheltered Pichu is met later as a Pikachu that is not afraid of thunder (gn-32-pikachu; it does not join).',
  },
};
export const CHAINS: Json[] = [];
