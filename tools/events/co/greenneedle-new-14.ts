// Greenneedle, gn.new.14 The Arcade Cabinet (doc GREENNEEDLE_PLACED_1.md §14).
// Build: npm run co:build -- greenneedle-new-14   then   npm run co:gn
// An unplugged arcade machine that is still running. The Porygon is the character in three games (a maze, a block-stacker, a
// one-screen shooter). Rushed inputs make it panic; time lets it find shortcuts; a failed game ends with it pushing the last life back.
import { ch, out, type Json } from '../dsl.ts';
import { gev, is, laterStage, moment, not, rm, say, setTo, stampStage, scene, type Placement } from './_gn.ts';
import { $, item, join } from '../dsl.ts';

export { CATEGORY } from './_gn.ts';

const ARCADE = '#2d1f4f';
const arcade = (o: Json = {}): Json => ({ tint: ARCADE, pokemon: 'porygon', tags: ['Story', 'Pokémon'], effect: 'none', cast: ['trainer.gentleman'], ...o });

interface Game { id: string; name: string; intro: string; fast: string; slow: string; fail: string; next: string }
const GAMES: Game[] = [
  { id: 'maze', name: 'The Maze', next: 'gn-new-14-stacker',
    intro: say('Game one. A maze, green lines on black, and one small blocky bird at the entrance, waiting to be told where to go.', '*It looks out of the screen at you, and taps the glass twice. Your move.*'),
    fast: 'You hammer the buttons. The bird bolts left, then right, then straight into a wall. It bumps every wall it meets, panicking, and the timer runs out.',
    slow: 'You wait. The bird stops, looks, and tries the wall. The wall opens: a shortcut the maze never showed anyone. It trots through, and out the exit.',
    fail: 'Its last life slides back across the screen at you. It does not look away. It waits, very patiently, for you to take it.' },
  { id: 'stacker', name: 'The Block-Stacker', next: 'gn-new-14-shooter',
    intro: say('Game two. Coloured blocks tumble down a narrow well. The bird stands at the bottom, holding the whole pile up with both wings.', 'It has already stopped looking at the blocks. It is looking at you.'),
    fast: 'You rush it. The blocks pile up crooked, and the bird flaps in a circle, dropping them everywhere. The well fills to the top.',
    slow: 'You give it time. It turns each block twice, slots it flush, and clears four lines at once. Then it clears four more. It does not seem surprised.',
    fail: 'The last life drifts back across the screen to you, small and bright, and stops at the edge of the glass. It waits.' },
  { id: 'shooter', name: 'The Shooter', next: 'gn-new-14-clear',
    intro: say('Game three. One screen, one little ship, and a wall of descending squares. The bird flies the ship. It has never looked so nervous.', 'In the corner, the high score reads HELP. It has not changed in years.'),
    fast: 'You mash fire. The ship sprays shots at nothing, and the squares come down faster. It panics, then freezes, then the ship is gone.',
    slow: 'You let it breathe. It finds the gap between two columns, tucks in, and picks the squares off one by one. The wall thins. The wall is gone.',
    fail: 'It nudges its last life across the screen toward you, the way you would slide a coin over a table. Then it waits.' },
];
const gameId = (g: Game): string => `gn-new-14-${g.id}`;

const gameRoom = (g: Game, i: number): Json => rm(gameId(g), `The Arcade Cabinet: ${g.name}`, arcade(), g.intro, [
  ch('Mash the buttons.', out(g.fast, scene(`gn-new-14-${g.id}-lost`))),
  ch('Give it time.', out(g.slow, setTo('arcade-cleared-games', i + 1), scene(g.next))),
]);
const failRoom = (g: Game): Json => rm(`gn-new-14-${g.id}-lost`, `The Arcade Cabinet: ${g.name}, Game Over`, arcade(), say(
  'GAME OVER, in red, across the whole screen. The bird sits very still in the middle of it.',
  g.fail,
), [
  ch('Take the life.', out('You press the button. The life goes back into the bird, and it exhales, as if it had been holding its breath. The game starts again, slower.', scene(gameId(g)))),
  ch('Walk away.', out('You step back from the glass. The bird watches you go. The screen keeps running behind you, and nobody has plugged it in.', setTo('arcade-walked', 1))),
]);

const EVENTS: Json[] = [
  gev('gn-new-14-cabinet', 'The Arcade Cabinet', arcade({ stop: 'event', rarity: 'rare', requires: [not('arcade-walked'), not('arcade-sold')], remembers: [
    { id: 'board', when: [is('arcade-sold')], notice: 'The cabinet is gone from the corner. In its place, a pale rectangle on the floor, and the faint smell of hot dust.' },
  ] }), say(
    '*An arcade machine in the back of a shop. Unplugged, with the cord coiled on the floor beside it, and running anyway.*',
    '*One high score on the screen. The initials: HELP.*',
    '**Shopkeeper, Mr. Vandersloot:** "Came with the building. I\'d give you fifty for someone to take it. Or I\'ll take two hundred from you, as is."',
    '*On the screen, a small blocky bird looks out at you and taps the glass.*',
  ), [
    ch('Play.', out('A coin you don\'t remember putting in drops into the slot. The bird straightens up. It has waited a long time for this.', setTo('arcade-played', 1), stampStage('arcade-stage'), scene('gn-new-14-maze'))),
    ch('Sell it for him.', out('Mr. Vandersloot counts out fifty into your hand, gratefully, and finds you a buyer by the end of the afternoon. As is.', $(50), setTo('arcade-sold', 1), stampStage('arcade-stage'), moment('Sold an arcade cabinet as is. The bird on the screen watched you leave.', 55))),
    ch('Walk on.', out('You walk on. Behind you, something small taps the glass, once, then goes quiet.', setTo('arcade-walked', 1))),
  ]),
  ...GAMES.map(gameRoom),
  ...GAMES.map(failRoom),
  rm('gn-new-14-clear', 'The Arcade Cabinet: All Three Cleared', arcade({ tags: ['Pokémon', 'Relationship', 'Story'] }), say(
    'The last square falls. The screen goes white, and then, for the first time in years, it goes quiet.',
    '*The bird steps out of the screen. One polygon at a time: a wing, a beak, a leg, until it is standing on the shop floor, blinking, entirely pink and blue.*',
    '**Mr. Vandersloot:** "Well. I\'ve had that thing a decade. Nobody mentioned it did that."',
  ), [ch('Say hello.', out('It is a Porygon. It looks at its own feet, then at yours, and decides it is going with you. On the cabinet, the high score reads HELP. Then it reads nothing at all.',
    { ...join({ species: ['porygon'] }), asIs: true, ability: 'debug', mark: 'arcade-porygon' }, setTo('arcade-cleared', 1), moment('Cleared three games, and a Porygon stepped out of the screen.', 85)))]),
  gev('gn-new-14-board', 'The Arcade Cabinet: The Score Table', arcade({ stop: 'event', rarity: 'uncommon', requires: [laterStage('arcade-stage'), not('arcade-board')], remembers: [
    { id: 'sold', when: [is('arcade-sold')], notice: 'The high-score table reads HELP. Still. It is exactly as you remember it, and it is looking at you.' },
    { id: 'cleared', when: [is('arcade-cleared')], notice: 'First place: THX. Second place: your initials. A small blocky bird is on the cabinet, in the corner of the screen, waving.' },
  ] }), say(
    '*Another arcade, in another back room. A row of machines, humming, with a score table glowing on each of them.*',
    'You read the nearest table before you can stop yourself.',
  ), [ch('Read it.', out('You stand there a moment, and then you go on.', setTo('arcade-board', 1)))]),
];
const EVENTS_LIST = EVENTS;
export { EVENTS_LIST as EVENTS };
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-14-cabinet': {
    gn: 'gn.new.14', shape: 'Single, three minigames', earliest: 'A3', home: 15, window: [13, 18], sits: 'must-see', attaches: 'town', tags: ['Miniature Episode'],
    level: 'No battles', often: 'run', badge: 'own',
    note: 'Badge: an arcade cabinet. In the back of a shop (a Town stop once towns exist); fallback step 5 of the next stage. Once a run. The three games are choices (mash the buttons panics, time finds shortcuts); the Porygon joins with Debug when all three are cleared. Sold as is: arcade-sold.',
  },
  'gn-new-14-board': { gn: 'gn.new.14', shape: 'Single', earliest: 'A4', home: 5, window: [2, 10], sits: 'optional', attaches: 'town', tags: ['Miniature Episode'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: every later arcade in the same run (first place THX, your initials second; or HELP, still, if sold).' },
};
export const CHAINS: Json[] = [];
