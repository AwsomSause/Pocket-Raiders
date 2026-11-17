// Greenneedle gn.new.22 The Alley Court (doc GREENNEEDLE_PLACED_2.md lines 75–103).
// Build: npm run co:build -- greenneedle-new-22   then   npm run co:gn
import { $, ch, flag, item, join, out, room, trainer, type Json } from '../dsl.ts';
import { bond, gev, is, not, notThisStage, rm, say, scene, stampRegion, stampStage, setTo, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#8a7a6a';
const alley = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', pokemon: 'persian', ...o });
const aroom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, alley(o), intro, choices);

const MEOWTH = 'alley-meowth';
/** The young Meowth, with Fair Share. */
// Fair Share works when it steals an item in battle, so it comes knowing Thief (it caught that fish somehow).
const MEOWTH_JOINS: Json = { ...join({ species: ['meowth'], lv: -1 }), direct: true, ability: 'fair-share', moves: ['thief'], mark: MEOWTH };
const SEEN: Json[] = [flag('court-done'), stampRegion('court-region'), stampStage('court-at')];
const KEEP = (text: string, ...fx: Json[]): Json => out(text, MEOWTH_JOINS, ...fx, ...SEEN);

const ROOF = say(
  '*A rooftop. Thirty strays in a ring, shoulder to shoulder. A Persian on a water tank, still as a statue. A young Meowth in the middle, with half a fish.*',
  '*The Persian looks at you, and flicks its tail at the accused. Judge.*',
  '*An Alley Purrloin acts out the charge, with great drama: the Meowth caught a fish, and gave half away.*',
);

/** The player coaches the Meowth: three calls during the fight (the battle stops and asks, at the start of turns 1, 3 and 5). */
const CALL = (n: number, turn: number, text: string): Json => ({
  id: `call-${n}`, at: { turn }, text, prompt: `The ${['first', 'second', 'third'][n - 1]} call is yours.`,
  options: [
    { label: '"Pounce!"', text: '**You:** "Pounce!" The Meowth crouches, wiggles, and is ready.', effects: [{ kind: 'stages', side: 'you', stages: { atk: 1 } }] },
    { label: '"Dodge!"', text: '**You:** "Dodge!" The Meowth goes light on its feet.', effects: [{ kind: 'stages', side: 'you', stages: { spe: 1 } }] },
    { label: '"Steady!"', text: '**You:** "Steady!" The Meowth breathes out, and sets its paws.', effects: [{ kind: 'heal', side: 'you', share: 0.25 }] },
  ],
});
const CALLS: Json[] = [
  CALL(1, 1, 'The Persian drops from the tank. The first call is yours: how does the Meowth open?'),
  CALL(2, 3, 'Halfway through, when both are breathing hard. The second call is yours.'),
  CALL(3, 5, 'When it is nearly over, and neither of them will give way. The third call is yours.'),
];

const MEOWTH_FIGHT = trainer('The Persian', {
  size: 1, team: ['persian'], lv: -1, friendly: true, rule: { gn: 'alley', leadMark: MEOWTH, noCatch: true, asks: CALLS },
  win: [scene('gn-new-22-won')], lose: [scene('gn-new-22-lost')],
});

export const EVENTS: Json[] = [
  gev('gn-new-22-court', 'The Alley Court', alley({ stop: 'event', rarity: 'rare', types: ['normal', 'dark'], forced: true, requires: [not('court-done')] }), say(
    '*A coin drops on the stones in front of you. A Meowth, on purpose, looking you dead in the eye. Then it runs.*',
    'You follow. Over a fence, up a drainpipe, onto the roof.',
    ROOF,
  ), [
    ch('"Rule for the Persian."', out(say(
      'The Persian dips its head. Order holds. The ring breaks up, quietly, and nobody looks at the Meowth.',
      'The Meowth sits with half a fish, and does not eat it.',
      'A sack is pushed over to you, heavy and clinking. Stolen, and everyone knows it. You take it. You also take the Meowth, because it has followed you down the pipe.',
    ), MEOWTH_JOINS, $(500), item('great-ball', 3), flag('court-persian'), flag('bought-stolen'), ...SEEN)),
    ch('"Rule for the Meowth."', out(say(
      'The ring goes silent. The Persian stands up on its tank, slowly, all the way. It was never going to let this go.',
      'A challenge, cat against cat. The Meowth steps forward, small, shaking, and does not step back.',
      'The Persian looks at you. You may call the moves.',
    ), MEOWTH_JOINS, flag('court-meowth'), room('gn-new-22-fight'))),
    ch('"Ask what the kittens think."', out(say(
      'Six kittens are fetched from a box. They are asked. They hold a vote, by sitting on things: the Purrloin, the Persian\'s tail, the fish.',
      'It is chaos. It works. Somehow the fish is shared out, bone by bone, thirty ways, and the Persian takes the head with great dignity.',
      'The little Meowth looks at you as if you had hung the moon.',
    ), MEOWTH_JOINS, flag('court-kittens'), ...SEEN)),
  ]),
  aroom('gn-new-22-fight', 'The Alley Court: The Challenge', { pokemon: 'meowth' }, say(
    '*Thirty strays, not breathing. The Meowth on the stones, the Persian above it.*',
    'Three calls are yours to make, during the fight. The Meowth does the rest.',
  ), [ch('Let them fight.', { ...out('The Persian does not hold back. Neither does the Meowth.'), battle: MEOWTH_FIGHT })]),
  aroom('gn-new-22-won', 'The Alley Court: The Verdict', { pokemon: 'persian' }, say(
    'The Persian stops. Its chest heaves. It looks at the Meowth for a long time, and then, deliberately, it lies down.',
    'The ring breaks into yowling. Someone sets the other half of the fish at the Meowth\'s feet.',
  ), [ch('Take the Meowth home.', out('It has already decided. It jumps onto your shoulder, fish and all, and falls asleep.', flag('court-meowth-won'), bond(), ...SEEN))]),
  aroom('gn-new-22-lost', 'The Alley Court: The Verdict', { pokemon: 'persian' }, say(
    'The Meowth is flat on the stones. The Persian stands over it. And then, with a great sigh, the Persian steps back.',
    'It was never about winning. It wanted to see if the Meowth would get up. It did.',
  ), [ch('Take the Meowth home.', out('The Persian flicks its tail at the door. Go. The Meowth limps after you, with the fish.', flag('court-meowth-lost'), ...SEEN))]),
  // ---- The afterstory: coins on windowsills at Steps 5 and 15, for the rest of the region ----
  ...[5, 15].map((n) => gev(`gn-new-22-coin-${n}`, 'Coins on a Windowsill', alley({
    stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, pokemon: 'meowth',
    requires: [is('court-done'), { kind: 'gn', test: 'thisRegion', key: 'court-region' }, { kind: 'gn', test: 'laterStage', key: 'court-at' }, notThisStage(`court-coin-${n}-at`)],
  }), say(
    '*On a windowsill, a coin. Then another, polished, set in a neat row. The strays have been here.*',
    'The Meowth on your shoulder sniffs once, and purrs.',
  ), [ch('Take one.', out('You take a single coin. The Meowth watches, and decides you can be trusted with the rest.', $(100), stampStage(`court-coin-${n}-at`)))])),
];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-22-court': {
    gn: 'gn.new.22', shape: 'Single', earliest: 'A5', home: 15, window: [13, 17], sits: 'must-see', attaches: 'before', needs: ['city'], tags: ['Miniature Episode', 'Companion Story'], level: 'A-1', often: 'run', badge: 'own',
    note: 'Fallback: step 5 of the next stage. A Meowth drops a coin and leads the player to a rooftop. The challenge is one fight with three calls chosen in the court.',
  },
  'gn-new-22-coin-5': { gn: 'gn.new.22', shape: 'Single', earliest: 'A5', home: 5, window: [4, 6], sits: 'optional', attaches: 'before', level: 'no battle', often: 'region', badge: 'none', note: 'Afterstory: coins on windowsills at Steps 5 and 15 for the rest of the region.' },
  'gn-new-22-coin-15': { gn: 'gn.new.22', shape: 'Single', earliest: 'A5', home: 15, window: [14, 16], sits: 'optional', attaches: 'before', level: 'no battle', often: 'region', badge: 'none', note: 'Afterstory: coins on windowsills at Steps 5 and 15 for the rest of the region.' },
};

export const CHAINS: Json[] = [];
