// Greenneedle gn.new.37 The Second Nest (doc GREENNEEDLE_PLACED_2.md lines 606-633).
// Build: npm run co:build -- greenneedle-new-37   then   npm run co:gn
import { ch, fight, flag, join, out, trainer, type Json } from '../dsl.ts';
import { gev, is, moment, not, regionChanged, rm, say, scene, stampRegion, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// A Fletchinder feeds a Rufflet chick that rolled into the wrong tree. The flock, the circling Braviary, and who is left alone.
// Foster Wing is an ability (engine.ts switchIn): sent in for an ally that left under half HP, its Defense rises a stage; once a battle. The Braviary that sat low in a later region is the afterstory.
const TINT = '#32452d';
const nest = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Story'], ...o });
/** The flock: the Fletchinder's own kind, three of them, one after another (A-1). */
const FLOCK = ['fletchinder', 'fletchling', 'fletchinder'];

/** Whoever is left alone may join: the Fletchinder, with Foster Wing. */
const fletchinderJoins: Json = { ...join({ species: ['fletchinder'] }), ability: 'foster-wing' };
/** The Braviary came down: remember it (read by the afterstory) and the region it was seen in. */
const braviaryLanded: Json[] = [flag('second-nest-braviary'), flag('second-nest-done'), stampRegion('second-nest-region')];

const CARRIED = out(
  say(
    'It weighs more than it looks. It stops complaining the moment you lift it, as if it had never been held by something that was not a wing.',
    'The Braviary lands. Not on a branch. On the ground, in front of you, which a bird like that does for no one.',
    'The chick goes to it. It does not look back. Behind, on the branch, the Fletchinder watches, and does not make a sound.',
    'Then it flies down and settles by your boots. It has fed and warmed something for days, and now there is nothing to feed. It stays close anyway.',
  ),
  ...braviaryLanded, flag('second-nest-carried'), fletchinderJoins,
  moment('You carried a Rufflet to the Braviary that had circled for days. The Fletchinder that raised it came with you.', 65),
);

export const EVENTS: Json[] = [
  gev('gn-new-37-nest', 'The Second Nest', nest({
    stop: 'event', rarity: 'rare', minStage: 2, types: ['flying', 'normal'], requires: [not('second-nest-done')], effect: 'glint',
  }), say(
    'A Fletchinder is feeding a nest. The chick in it is twice its size, and the wrong shape. It keeps pushing food at a beak that is not its own.',
    '*A Rufflet. Its egg rolled into the wrong tree. On the branches round about, the flock sits, and watches, and doesn\'t like it.*',
    '*High up, a Braviary circles. It\'s been circling for days.*',
  ), [
    ch('Drive off the flock.', fight(
      'The nearest bird cries out. Then the rest. They have been waiting for someone to hold the line against, and now there is a line.',
      trainer('The Flock', { team: FLOCK, lv: -1, friendly: true, sprite: 'fletchinder', win: [flag('second-nest-done'), scene('gn-new-37-hush')], lose: [scene('gn-new-37-fell')] }),
    )),
    ch('Carry the chick to the Braviary.', CARRIED),
    ch('Do nothing, and watch.', out(
      say(
        'The flock closes in on the nest. The Fletchinder does not leave it. It spreads its wings in front of the chick and faces its own kind, alone.',
        'It loses. It was always going to. It does not move aside until it cannot stand.',
        'The Braviary comes down, then, all at once, as if it had only been waiting to see someone try. The chick goes with it, and looks back.',
        'The Fletchinder lies where it fell, watching the sky. When you step closer, it does not shy away. There is nowhere else left for it to go.',
      ),
      ...braviaryLanded, flag('second-nest-watched'), fletchinderJoins,
      moment('You watched a Fletchinder stand against its own flock for a chick that wasn\'t its own. It came with you after.', 65),
    )),
  ]),

  // ---- driven off: the fight, then what is left to do ----
  rm('gn-new-37-hush', 'The Nest, Safe', nest({ effect: 'glint' }), say(
    'The flock scatters over the trees and does not come back. The nest is whole. The chick is asleep with its beak open, full and furious at nothing.',
    'The Fletchinder settles over it. It does not thank you. It has no spare breath for it.',
    '*High above, the Braviary goes on circling. It has not stopped once.*',
  ), [
    ch('Leave them be.', out(
      'You leave the nest where it is. The Fletchinder keeps its place on the branch. Overhead, the circle goes on, wide and patient, and no one comes down.',
      flag('second-nest-left'), moment('You drove the flock off a Fletchinder\'s nest. The Braviary was still circling when you left.', 50),
    )),
  ]),
  // ---- the flock was too many: it ends as it would have without you ----
  rm('gn-new-37-fell', 'The Nest, Lost', nest({ effect: 'glint' }), say(
    'The flock is too many. Your team is pushed back off the branch, and the birds close in on the nest behind you.',
    'The Fletchinder stands in front of the chick against its own flock. It loses. It does not move aside until it cannot stand.',
    'The Braviary comes down, then, all at once. The chick goes with it, and looks back.',
  ), [
    ch('Go to the Fletchinder.', out(
      'It lies where it fell, watching the sky. When you kneel, it does not shy away. There is nowhere else left for it to go.',
      ...braviaryLanded, flag('second-nest-watched'), fletchinderJoins,
      moment('You fought a flock for a nest, and lost. The Fletchinder that raised the chick came with you after.', 60),
    )),
  ]),

  // ---- afterstory: a Braviary on low branches, in a later region ----
  gev('gn-new-37-after', 'The Low Branch', nest({
    stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, effect: 'glint',
    requires: [is('second-nest-braviary'), regionChanged('second-nest-region'), not('second-nest-after-done')],
  }), say(
    'A Braviary is sitting on a low branch. It is much too big for the branch, and it sits like a much smaller bird: head tucked, feet together.',
    'You know it. You cannot say how. Something in how it holds itself, as if it learned to be a Braviary from someone small.',
    'It looks at you for a long moment. Then it opens one wing, just a little, the way you do for someone who has to pass.',
  ), [
    ch('Sit a while.', out(
      'You sit under the branch until the light changes. Neither of you says anything. When you leave, it lifts a wing again, small and careful, the way something does that was once told to be quiet.',
      flag('second-nest-after-done'), moment('A Braviary sat on a low branch like a much smaller bird. You stayed a while.', 55),
    )),
    ch('Walk on.', out('You nod to it and go on. Behind you, it stays on its low branch, exactly where it chose to be.', flag('second-nest-after-done'))),
  ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-37-nest': {
    gn: 'gn.new.37', shape: 'Single', earliest: 'A5', home: 3, window: [1, 8], sits: 'optional', tags: ['Moral Choice'],
    level: 'A-1 if the flock is fought', often: 'run', needs: ['forest'], dressing: { kanto: 'The Second Nest', elsewhere: 'The Second Nest' },
    note: 'Once per run. Home step 3, fallback step 8. The afterstory (a Braviary on a low branch) is a callback in a later region.',
  },
};

export const CHAINS: Json[] = [];
