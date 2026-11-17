// Greenneedle gn.new.03, The Ball That Wouldn't Open (doc GREENNEEDLE_PLACED_1.md lines 125–160).
// Build: npm run co:build -- greenneedle-new-03   then   npm run co:gn
// An old Poké Ball with a strip of tape that says "sorry". Found once (step 3 of stage 1 or 2), then a scene at one rest a stage: five kindnesses
// and it comes out by itself. A town's tinker can crack it for ₽200 (it bolts; met again 16 stages later, at that stage's level, can't be caught). Afterstory in the next region.
import { $, ch, fight, money, out, wild, type Json } from '../dsl.ts';
import { gev, gn, is, moment, not, notThisRegion, rm, say, setTo, stageGapMin, stampRegion, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#8a7a62';
const ball = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Story'], effect: 'none', ...o });
const MON = '@ball-mon';

export const EVENTS: Json[] = [
  // ---- Found once ----
  gev('gn-new-03-find', 'The Ball That Wouldn\'t Open', ball({ stop: 'event', rarity: 'uncommon', requires: [not('ball-found')] }), say(
    '*An old Poké Ball, half sunk in the mud. The paint is worn to bare metal where small thumbs once held it.*',
    '*A strip of tape runs across the seam, curling at its edges. On it, in a child\'s careful hand, one word:* sorry.',
  ), [
    ch('Pick it up.', out(say(
      '*You press the button. Nothing happens. The button doesn\'t work.*',
      '*Something inside shifts its weight, quietly, away from where your hand is. It isn\'t hiding from the Ball. It\'s hiding from whoever opens it.*',
      'You put it in your bag anyway. It weighs almost nothing, and it is not empty.',
    ), gn('ballFind'), moment('Found an old Poké Ball in the mud that wouldn\'t open. The tape said sorry.', 65))),
  ]),

  // ---- At every rest while it's in the bag (run.ts opens this beside the rest stop) ----
  rm('gn-new-03-rest', 'The Ball That Wouldn\'t Open', ball({ tags: ['Pokémon', 'Recovery'] }), say(
    '{ball:held}',
    'The old Ball sits at the bottom of your bag, quiet. You can tell, by the weight, that something in it is awake.',
  ), [
    ch('Talk to it.', out(say(
      'You tell it about the road. The weather. Who is hurt, and who is only pretending not to be. You don\'t ask it to answer.',
      '*The Ball is warm.*',
    ), gn('ballKind'))),
    ch('Leave it by the fire.', out(say(
      'You set it down in the firelight, close enough to feel it, not close enough to crowd it. You don\'t watch.',
      '*In the morning it\'s rolled closer to the hurt one.*',
    ), gn('ballKind'))),
    ch('Hold it in the next battle.', out(say(
      'You close your hand around it, and keep it there. If it wants to see what a fight looks like from the inside of a hand, it can.',
      'It stays still. It is listening.',
    ), gn('ballHold'))),
    ch('Put it away.', out('You tuck it back down into the bag, deep, where it\'s quiet. Nothing happens. Nothing was asked of it, and that is its own kind of kindness.')),
  ]),
  // ---- Five kindnesses: it comes out by itself, and the next rest opens with this ----
  rm('gn-new-03-hatch', 'The Ball That Wouldn\'t Open: It Came Out', ball({ tags: ['Pokémon', 'Relationship'] }), say(
    'The next rest opens with one more shape asleep among the party, curled up small against the warmest of them.',
    '*Nobody saw it come out. The tape is on the ground, folded in half.*',
    'You read the word one more time. It does not seem to have been meant for you.',
  ), [
    ch('Let it sleep.', out(say(
      'You don\'t wake it. You pull a blanket over the whole pile, and sit watch for a while.',
      'When it finally stirs, it looks at you, then at your hand, and doesn\'t flinch. It stays.',
    ), { kind: 'join', recall: false, species: [MON], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, ability: 'trust-earned', mark: 'wouldnt-open' },
    gn('ballHatched'), stampRegion('ball-at'), moment('Waited for a Ball that wouldn\'t open, and it opened itself.', 85))),
  ]),

  // ---- The shop's offer (any town, once) ----
  gev('gn-new-03-tinker', 'The Tinker', ball({ stop: 'event', rarity: 'uncommon', tags: ['Shop', 'Story'], requires: [is('ball-found'), not('ball-gone'), not('ball-tinker')] }), say(
    'A tinker\'s stall, between a kettle and a broken clock. They see the old Ball in your bag before you\'ve said a word.',
    '**Tinker:** "Seized mechanism. I can crack it for two hundred. It won\'t like it."',
  ), [
    ch('Pay ₽200.', out(say(
      'They set it in a vice, and something small and precise clicks. A crack of light.',
      'Then a streak across the floor, under the stall, out the door. The Tinker holds up the empty shell, and the tape, and says nothing.',
    ), $(-200), gn('ballForce'), setTo('ball-tinker', 1), stampStage('ball-bolt-stage')), { requires: [money(200)] }),
    ch('Keep it shut.', out('"Suit yourself." They don\'t offer again. The Ball is a little warmer when you walk away, or you\'d like to think so.', setTo('ball-tinker', 1))),
  ]),
  // ---- Forced: met again as a wild Pokémon that can't be caught ----
  gev('gn-new-03-again', 'The Ball That Wouldn\'t Open: Bolted', ball({ stop: 'event', rarity: 'uncommon', tags: ['Pokémon', 'Story'], requires: [is('ball-bolted'), stageGapMin('ball-bolt-stage', 16), not('ball-met')] }), say(
    'It is standing in the road. You know it before you see its face, because there is still a scrap of tape stuck to one foot.',
    'It does not run. It has run enough.',
  ), [
    ch('Battle.', fight('It doesn\'t attack because it hates you. It attacks because nobody has ever shown it what else to do with being afraid.', {
      ...wild({ species: [MON], win: [setTo('ball-met', 1), moment('Met the Pokémon from the Ball again, after the tinker forced it open.', 60)] }), exact: true, rule: { gn: 'ball', noCatch: true }, lose: [setTo('ball-met', 1)],
    })),
    ch('Let it go.', out('You step off the road and let it pass. It looks back once, from the trees, at the place where the Ball used to be.', setTo('ball-met', 1))),
  ]),

  // ---- Afterstory: the next region, step 5 ----
  gev('gn-new-03-after', 'The Ball That Wouldn\'t Open: A Young Trainer', ball({ stop: 'event', rarity: 'uncommon', tags: ['Story'], requires: [is('ball-out'), notThisRegion('ball-at'), not('ball-after')] }), say(
    '*A young trainer on the path stops mid-stride. Their eyes go to the Pokémon beside you, and then the colour goes out of their face.*',
    'They have carried one word around for a very long time. It is trying to come out.',
  ), [
    ch('Let them say it.', out(say(
      '"I\'m sorry," they whisper, to the Pokémon, not to you. "I\'m so sorry. I couldn\'t— I was too small. I didn\'t know how."',
      'It looks at them for a long moment. Then it leans against your leg, and stays.',
    ), setTo('ball-after', 1), moment('A young trainer said sorry to the Pokémon from the Ball. It stayed with you.', 80))),
    ch('It\'s all right. Don\'t.', out(say(
      'You step between them, gently. "It\'s all right. You don\'t have to."',
      'They cry anyway, quietly, with their hands over their mouth. The Pokémon doesn\'t move from your side.',
    ), setTo('ball-after', 1), moment('Told a young trainer it was all right. The Pokémon from the Ball stayed with you.', 80))),
  ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-03-find': {
    gn: 'gn.new.03', shape: 'Region-long', earliest: 'A1', home: 3, window: [2, 7], sits: 'optional', attaches: 'after', tags: ['Interrupting Episode'], stages: [1, 2],
    level: 'None', often: 'run', badge: 'own',
    note: 'Badge: a taped Ball. Found once a run, at step 3 of stage 1 or 2 (step 7 is the fallback, the end of the window). From then on its scene opens at one rest a stage (run.ts ballRest) until it comes out (five kindnesses). Hatched, it sets ball-waited and abandoned-mon.',
  },
  'gn-new-03-tinker': { gn: 'gn.new.03', shape: 'Single', earliest: 'A2', home: 4, window: [1, 10], sits: 'optional', attaches: 'town', tags: ['Interrupting Episode'], level: 'None', often: 'run', badge: 'own', note: 'A town\'s tinker, once, while the Ball is still in the bag. ₽200 forces it open: it bolts.' },
  'gn-new-03-again': { gn: 'gn.new.03', shape: 'Single', earliest: 'A17', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Interrupting Episode'], level: 'A+0, cannot be caught', often: 'run', badge: 'own', note: 'Sixteen stages after the tinker forced it (the doc\'s A+16): the Pokémon, wild, at the stage\'s level. It can\'t be caught.' },
  'gn-new-03-after': { gn: 'gn.new.03', shape: 'Single', earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', attaches: 'after', tags: ['Interrupting Episode'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: the next region, step 5. A young trainer goes white; the Pokémon stays whichever is picked.' },
};

export const CHAINS: Json[] = [];
