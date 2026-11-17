// Greenneedle, gn.new.14 The Arcade Cabinet (doc GREENNEEDLE_PLACED_1.md §14).
// Build: npm run co:build -- greenneedle-new-14   then   npm run co:gn
// An unplugged arcade machine that is still running. The Porygon is the character in three games (a maze, a block-stacker, a
// one-screen shooter). Rushed inputs make it panic; time lets it find shortcuts; a failed game ends with it pushing the last life back.
import { ch, out, type Json } from '../dsl.ts';
import { gev, gn, is, laterStage, moment, not, notThisRegion, rm, say, setTo, stampRegion, stampStage, type Placement } from './_gn.ts';
import { $, item, join } from '../dsl.ts';

export { CATEGORY } from './_gn.ts';

const ARCADE = '#2d1f4f';
const arcade = (o: Json = {}): Json => ({ tint: ARCADE, pokemon: 'porygon', tags: ['Story', 'Pokémon'], effect: 'none', cast: ['trainer.gentleman'], ...o });

// The three games are played for real on the cabinet's screen: minigame `gn-arcade` (core/greenneedle/arcade.ts). "Play." opens it
// beside the node; clearing all three opens the room where the bird steps out (core/greenneedle/arcadeEnd.ts); failing a game and
// walking away, or leaving half-way, sets arcade-walked.
const play = gn('minigame', { key: 'gn-arcade' });
// The rooms of the earlier two-choice version: a run saved inside one of them walks back to the glass and plays the real games.
const OLD_ROOMS: [string, string][] = [
  ['maze', 'The Maze'], ['stacker', 'The Block-Stacker'], ['shooter', 'The Shooter'],
  ['maze-lost', 'The Maze, Game Over'], ['stacker-lost', 'The Block-Stacker, Game Over'], ['shooter-lost', 'The Shooter, Game Over'],
];
const oldRoom = ([id, name]: [string, string]): Json => rm(`gn-new-14-${id}`, `The Arcade Cabinet: ${name}`, arcade(), say(
  '*The screen flickers, and the game starts over from the title. The small blocky bird is back at the first entrance, waiting.*',
), [ch('Step up to the glass.', out('You put both hands on the controls. The bird straightens up.', play))]);

const EVENTS: Json[] = [
  gev('gn-new-14-cabinet', 'The Arcade Cabinet', arcade({ stop: 'event', rarity: 'rare', requires: [not('arcade-walked'), not('arcade-sold')], remembers: [
    { id: 'board', when: [is('arcade-sold')], notice: 'The cabinet is gone from the corner. In its place, a pale rectangle on the floor, and the faint smell of hot dust.' },
  ] }), say(
    '*An arcade machine in the back of a shop. Unplugged, with the cord coiled on the floor beside it, and running anyway.*',
    '*One high score on the screen. The initials: HELP.*',
    '**Shopkeeper, Mr. Vandersloot:** "Came with the building. I\'d give you fifty for someone to take it. Or I\'ll take two hundred from you, as is."',
    '*On the screen, a small blocky bird looks out at you and taps the glass.*',
  ), [
    ch('Play.', out('A coin you don\'t remember putting in drops into the slot. The bird straightens up. It has waited a long time for this.', setTo('arcade-played', 1), stampStage('arcade-stage'), play)),
    ch('Sell it for him.', out('Mr. Vandersloot counts out fifty into your hand, gratefully, and finds you a buyer by the end of the afternoon. As is.', $(50), setTo('arcade-sold', 1), stampStage('arcade-stage'), moment('Sold an arcade cabinet as is. The bird on the screen watched you leave.', 55))),
    ch('Walk on.', out('You walk on. Behind you, something small taps the glass, once, then goes quiet.', setTo('arcade-walked', 1))),
  ]),
  ...OLD_ROOMS.map(oldRoom),
  rm('gn-new-14-clear', 'The Arcade Cabinet: All Three Cleared', arcade({ tags: ['Pokémon', 'Relationship', 'Story'] }), say(
    'The last square falls. The screen goes white, and then, for the first time in years, it goes quiet.',
    '*The bird steps out of the screen. One polygon at a time: a wing, a beak, a leg, until it is standing on the shop floor, blinking, entirely pink and blue.*',
    '**Mr. Vandersloot:** "Well. I\'ve had that thing a decade. Nobody mentioned it did that."',
  ), [ch('Say hello.', out('It is a Porygon. It looks at its own feet, then at yours, and decides it is going with you. On the cabinet, the high score reads HELP. Then it reads nothing at all.',
    { ...join({ species: ['porygon'] }), asIs: true, ability: 'debug', mark: 'arcade-porygon' }, setTo('arcade-cleared', 1), moment('Cleared three games, and a Porygon stepped out of the screen.', 85)))]),
  gev('gn-new-14-board', 'The Arcade Cabinet: The Score Table', arcade({ stop: 'event', rarity: 'uncommon', requires: [laterStage('arcade-stage'), notThisRegion('arcade-board-region')], remembers: [
    { id: 'sold', when: [is('arcade-sold')], notice: 'The high-score table reads HELP. Still. It is exactly as you remember it, and it is looking at you.' },
    { id: 'cleared', when: [is('arcade-cleared')], notice: 'First place: THX. Second place: your initials. A small blocky bird is on the cabinet, in the corner of the screen, waving.' },
  ] }), say(
    '*Another arcade, in another back room. A row of machines, humming, with a score table glowing on each of them.*',
    'You read the nearest table before you can stop yourself.',
  ), [ch('Read it.', out('You stand there a moment, and then you go on.', setTo('arcade-board', 1), stampRegion('arcade-board-region')))]),
];
const EVENTS_LIST = EVENTS;
export { EVENTS_LIST as EVENTS };
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-14-cabinet': {
    gn: 'gn.new.14', shape: 'Single, three minigames', earliest: 'A3', home: 15, window: [13, 18], sits: 'must-see', attaches: 'town', tags: ['Miniature Episode'],
    level: 'No battles', often: 'run', badge: 'own',
    note: 'Badge: an arcade cabinet. In the back of a shop (a Town stop once towns exist); fallback step 5 of the next stage. Once a run. The three games are played (minigame gn-arcade: fast presses panic the bird, time finds shortcuts, a failed game pushes the last life back); the Porygon joins with Debug when all three are cleared. Sold as is: arcade-sold.',
  },
  'gn-new-14-board': { gn: 'gn.new.14', shape: 'Single', earliest: 'A4', home: 5, window: [2, 10], sits: 'optional', attaches: 'town', tags: ['Miniature Episode'], level: 'None', often: 'region', badge: 'own', note: 'Afterstory: every later arcade in the same run, one a region (first place THX, your initials second; or HELP, still, if sold).' },
};
export const CHAINS: Json[] = [];
