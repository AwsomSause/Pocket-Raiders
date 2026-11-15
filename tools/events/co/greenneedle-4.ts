// Greenneedle, part 4: events gn.16 to gn.20 (doc GREENNEEDLE_REWORKED_PLACED_4.md).
// In Kanto the Saffron canon space opens the same Tournament ("The Greenneedle version is the only version"); its old rooms are retired below.
// Build: npm run co:build -- greenneedle-4   then   npm run co:gn
import { $, ch, fight, flag, heal, item, leave, out, room, trainer, type Json } from '../dsl.ts';
import { bond, gev, gn, is, kindness, laterStage, moment, not, notThisRegion, rm, say, setTo, stampRegion, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const cap = (key: string, n: number): Json => gn('capFlag', { key, n });

// =====================================================================================================================
// gn.16  THE FIGHTING TOURNAMENT  (needs the Route 25 Mankey; five one-on-one rounds on one node, every foe scaled to it; until towns exist: step 15)
// The stash, the title, Champion's Entrance and the rival's return are core/expansion/canonSaffron.ts; the bracket on screen is tourney.ts.
// =====================================================================================================================
const RING_TINT = '#7a3b2e';
const FIGHTERS = ['mankey', 'primeape'];
const ring = (round: number, o: Json = {}): Json => ({ tint: RING_TINT, tags: ['Combat', 'Pokémon', 'Story'], effect: 'none', pokemon: 'mankey', ...o, tourney: round });
/** gev puts unknown fields on the event; the bracket number belongs on the scene. */
const withBracket = (ev: Json): Json => {
  const { tourney, ...rest } = ev as Json & { tourney?: number };
  return tourney === undefined ? ev : { ...rest, scene: { ...(rest.scene as Json), tourney } };
};
const room16 = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => withBracket(rm(id, name, o, intro, choices));
const crowd = (n = 1): Json[] => [flag('tournament-crowd', n), cap('tournament-crowd', 5)];
/** Won from behind (the fighter at half HP or less): the crowd rises. */
const FROM_BEHIND: Json[] = [gn('check', { key: 'tc-behind', if: [{ kind: 'gn', test: 'hurtLead' }] }), when('tc-behind', { min: 1 }, crowd(), 'It won from behind! The crowd is on its feet.')];
/** Footwork: +1 Speed at the start of each match. */
const FOOTWORK: Json = when('tournament-montage-footwork', { min: 1 }, [gn('leadBoost', { type: 'spe', n: 1 })]);
/** Out in rounds 1 to 4: the team comes back, the prizes so far are kept. */
const OUT: Json[] = [{ kind: 'canon', action: 'unsolo', species: [] }, flag('tournament-out'), room('gn-16-out')];
/** Lost the final: four rounds of prizes, and the Tournament can be entered again in the next region. */
const FINAL_LOSS: Json[] = [{ kind: 'canon', action: 'unsolo', species: [] }, flag('tournament-lost'), room('gn-16-lost')];
const CHAMPION: Json[] = [
  { kind: 'canon', action: 'champion', species: FIGHTERS }, flag('kanto-tournament-won'), { kind: 'canon', action: 'unsolo', species: [] },
  moment('Won the Fighting Tournament with a Mankey from Route 25.', 85), room('gn-16-bell'),
];
/** One round: a one-on-one bout, the foe scaled exactly to your fighter (level and stat total). */
const bout = (name: string, species: string, rule: Json, win: Json[], o: Json = {}): Json =>
  ({ ...trainer(name, { size: 1, types: ['fighting'], friendly: true, rule: { matchLead: true, bstMatch: true, noItems: true, ...rule }, win: [...FROM_BEHIND, heal(0.4), ...win], lose: OUT }), species: [species], levelBonus: -1, ...o });
/** The montage: Power, Guard and Footwork, each once, for the rest of the bracket. */
const TRAIN = (next: string): Json[] => [
  { ...ch('Power', out('It hits a sandbag until the bag gives up. Then it hits the floor where the bag was.', setTo('tournament-montage-power', 1),
    { kind: 'tempEffect', label: 'Training: Power', effects: [{ kind: 'statMultiplier', stat: 'atk', value: 1.1 }, { kind: 'statMultiplier', stat: 'spa', value: 1.1 }], battles: 5, until: 'battle' }, room(next))), showIf: [not('tournament-montage-power')] },
  { ...ch('Guard', out('You throw Berries at it. It learns to block them. It eats the ones it blocks, and looks at you for more.', setTo('tournament-montage-guard', 1),
    { kind: 'tempEffect', label: 'Training: Guard', effects: [{ kind: 'statMultiplier', stat: 'def', value: 1.1 }, { kind: 'statMultiplier', stat: 'spd', value: 1.1 }], battles: 5, until: 'battle' }, room(next))), showIf: [not('tournament-montage-guard')] },
  { ...ch('Footwork', out('It chases its own shadow round a ring until it catches it. It doesn\'t know what to do then.', setTo('tournament-montage-footwork', 1), room(next))), showIf: [not('tournament-montage-footwork')] },
];
const REST = (next: string): Json => ch('Rest.', out('It sits with its back against yours. Nobody says anything. It\'s the right call.', bond(1), room(next)));
const COMMENTARY_OPEN = say(
  '**Commentator, "Big" Hector Brannock:** "And HERE they come! Out of nowhere! Off the road! A *wild-caught* Mankey, ladies and gentlemen!"',
  '**Colour, Miss Cordelia Fane:** "I\'d like to remind viewers that \'out of nowhere\' is where all of them come from, Hector."',
);
const DOOR16 = say(
  'A sports hall with the doors propped open. Thirty-two names on a chalkboard. Fighting-types only.',
  '**A steward:** "One on one. No switching. Forty percent patch-up between rounds. Faint, and you\'re out, but you keep what you\'ve won."',
  'Your Mankey reads the board as if it can read. Maybe it can.',
);
const SIGN_UP: Json[] = [
  ch('Sign up.', out('Your name goes at the bottom of the board, in chalk. Everyone else on your team goes to the rail, and not one of them is happy about it.',
    { kind: 'canon', action: 'solo', species: FIGHTERS }, flag('tournament-entered'), stampRegion('tournament-at'), setTo('tc-last-exchange', 0), setTo('tc-you-choose', 0),
    when('mankey-food-returned', { min: 0, max: 0 }, [setTo('tournament-crowd', 0)]),
    when('mankey-food-returned', { min: 1 }, [setTo('tournament-crowd', 2)], 'The whole troop is in the stands, on each other\'s shoulders. Someone has hung a Berry sack from the rail like a banner. Crowd 2.'),
    when('tournament-lost', { min: 1 }, [], 'Across the hall, Pax sees you and grins. "Again? Good."'),
    room('gn-16-r1'))),
  ch('Not today.', leave('You leave the board for somebody else. Your Mankey looks back at it twice.')),
];

const gn16: Json[] = [
  withBracket(gev('gn-16-door', 'The Fighting Tournament', ring(0, { stop: 'event', rarity: 'rare', types: ['fighting'], requires: [is('kanto-mankey'), laterStage('mankey-at'), { kind: 'partyLine', species: 'mankey' }, not('kanto-tournament-won'), not('tournament-out'), notThisRegion('tournament-at')] }), DOOR16, SIGN_UP)),
  room16('gn-16-r1', 'Tournament: Round of 32', ring(1, { pokemon: 'machop' }), say(
    COMMENTARY_OPEN,
    'Round one: a **Machop**, with its twin coaching from the rail. The twin shouts every move a second before it happens.',
    '**Fane:** "You can read them like a menu, Hector."',
  ), [ch('Step into the ring.', fight('You can read them. Your Mankey can hear them. It\'s a step ahead all match.', bout('Machop', 'machop', { myStages: { spe: 1 } }, [item('muscle-band'), room('gn-16-c1')]), FOOTWORK))]),
  room16('gn-16-c1', 'Tournament: The Corridor', ring(1, { pokemon: 'machop' }), say(
    'In the corridor, the Machop\'s twin is crying. The beaten one is comforting it, an arm round its shoulders.',
  ), [
    ch('Good match.', out('The beaten one looks up and nods. The twin wipes its face and nods too, a second later.', room('gn-16-gap1'))),
    ch('Walk on.', out('You walk past. Behind you, they\'re already arguing about the rematch.', room('gn-16-gap1'))),
  ]),
  room16('gn-16-gap1', 'Tournament: The Montage', ring(1), say('Four gaps between rounds. Pick what to train: it lasts the rest of the bracket.'), TRAIN('gn-16-r2')),
  room16('gn-16-r2', 'Tournament: Round of 16', ring(2, { pokemon: 'throh' }), say(
    'Round two: a **Throh** that bows to everyone, including the referee.',
    'It bows to your Mankey. It holds the bow, and waits.',
  ), [
    ch('Bow back.', fight('Your Mankey bows. The hall goes "Aww." Crowd +1.', bout('Throh', 'throh', {}, [item('protein'), room('gn-16-gap2')]), FOOTWORK, ...crowd(), flag('tournament-bowed'))),
    ch('Don\'t.', fight('Your Mankey doesn\'t bow. The Throh straightens up, unbothered, and bows to the referee again instead.', bout('Throh', 'throh', {}, [item('protein'), room('gn-16-gap2')]), FOOTWORK)),
  ]),
  room16('gn-16-gap2', 'Tournament: The Montage', ring(2, { pokemon: 'throh' }), say(
    'It bows again after it loses. In the corridor, it\'s bowing to a vending machine.',
    'Pick what to train.',
  ), TRAIN('gn-16-r3')),
  room16('gn-16-r3', 'Tournament: Quarterfinal', ring(3, { pokemon: 'hitmonchan' }), say(
    'Round three: a **Hitmonchan** that has never made a sound.',
    '**Brannock:** "Not a sound from the Hitmonchan! Not ever! Cordelia, has it *ever?*"',
    '**Fane:** "Once. In the regionals. It sneezed. They replayed it for a week."',
  ), [ch('Step into the ring.', fight('It doesn\'t cry out when it\'s hit. It doesn\'t cry out when it hits back.', bout('Hitmonchan', 'hitmonchan', { silent: true }, [item('focus-sash'), room('gn-16-gap3')]), FOOTWORK))]),
  room16('gn-16-gap3', 'Tournament: The Montage', ring(3, { pokemon: 'hitmonchan' }), say(
    'When it lost, it tapped its glove to its chest, once.',
    'In the corridor it\'s alone, lacing its gloves. It looks up. It nods.',
    'Pick what to train.',
  ), TRAIN('gn-16-r4')),
  room16('gn-16-r4', 'Tournament: Semifinal', ring(4, { pokemon: 'hawlucha' }), say(
    'Round four: a **Hawlucha** that plays to the crowd. It poses on the ropes. It blows kisses.',
    '**Fane:** "It\'s better than it pretends, Hector. They always are."',
  ), [ch('Step into the ring.', fight('The Hawlucha bows to the stands, not to you.', bout('Hawlucha', 'hawlucha', { gn: 'hawlucha' }, [item('black-belt'), room('gn-16-gap4')]), FOOTWORK,
    when('mankey-fifth-joined', { min: 1 }, crowd(2), 'When the Hawlucha taunts the front row, your Mankey steps between it and them, arms out. The fifth. It always will. Crowd +2.')))]),
  room16('gn-16-gap4', 'Tournament: The Corridor', ring(4, { pokemon: 'primeape' }), say(
    'Against the corridor wall, the rival\'s fighter is sitting with a thin trainer who\'s wrapping its hands.',
    '**The rival\'s trainer, a kid called Pax:** "It\'s from Route 25 too. Different troop. Same thieves. We didn\'t have anyone who brought the food back."',
    '**Pax:** "The prize money\'s for them. That\'s all. No hard feelings, whatever happens."',
  ), [REST('gn-16-final'), ...TRAIN('gn-16-final')]),
  room16('gn-16-final', 'Tournament: The Final', ring(5, { pokemon: 'primeape' }), say(
    'The final. The rival is a Mankey or a Primeape, like yours, with its own reasons for being here.',
    '**Brannock:** "Two wild ones from the same road, Cordelia! You couldn\'t WRITE this!"',
  ), [ch('Step into the ring.', fight('The bell goes.', { ...trainer('Pax', { size: 1, types: ['fighting'], mirror: true, friendly: true, rule: { gn: 'final', evolveMid: true, noItems: true }, win: [
    when('tc-last-exchange', { min: 1 }, [room('gn-16-last')]),
    when('tc-last-exchange', { min: 0, max: 0 }, CHAMPION),
  ], lose: FINAL_LOSS }), levelBonus: -1 }, FOOTWORK, setTo('tc-last-exchange', 0),
  when('tournament-bowed', { min: 1 }, [], 'In the front row, the Throh is bowing at every hit.'),
  when('tournament-crowd', { min: 5 }, [], 'The hall chants your Mankey\'s name. Its first move will go first.')))]),
  room16('gn-16-last', 'Tournament: The Last Exchange', ring(5, { pokemon: 'primeape' }), say(
    'If either hasn\'t evolved, it did, in the heat of the match.',
    '**Brannock:** "It\'s— Cordelia, it\'s EVOLVING! In the RING! Is that ALLOWED?"',
    '**Fane:** "Nobody\'s ever been brave enough to tell one it isn\'t."',
    'Both are below a quarter. The hall holds its breath. The game slows.',
  ), [
    ch('Now!', fight('You shout. It goes.', lastBout())),
    ch('Wait for it.', fight('You hold it back, one beat, two. Then you let it go.', lastBout())),
    ch('You choose.', fight('You say nothing. It looks back at you, once, and decides.', lastBout(), setTo('tc-you-choose', 1))),
  ]),
  room16('gn-16-bell', 'Tournament: After the Bell', ring(6, { pokemon: 'primeape' }), say(
    'The title is yours: "Champion," before its name, in every battle from now on. Dynamic Punch. The belt.',
    'Pax\'s fighter helps yours up. Pax holds out a hand.',
    'There\'s an envelope of prize money on the table.',
  ), [
    ch('Keep the prize money.', out('You take the envelope. Pax nods. "Fair\'s fair."', $(3000))),
    ch('Give it to Pax\'s troop.', out('You push the envelope across. Pax stares at it, then at you. "...They\'ll eat all winter."', kindness(2), flag('tournament-shared'))),
    ch('Split it.', out('You split it down the middle, note by note. Pax laughs, and it cracks halfway.', $(1500), kindness(2), flag('tournament-shared'))),
  ]),
  room16('gn-16-out', 'Tournament: Out', ring(0), say(
    'Your Mankey goes down. The referee counts it out, gently.',
    'Your team pours over the rail. You keep what you\'ve won.',
  ), [ch('Walk on.', out('**Fane:** "That one will be back, Hector." **Brannock:** "They always are!"'))]),
  room16('gn-16-lost', 'Tournament: The Final, Lost', ring(5, { pokemon: 'primeape' }), say(
    'Pax\'s fighter helps yours up. It holds on a moment longer than it needs to.',
    '**Pax:** "Next region. Come back. It\'ll want a rematch. So will I."',
    'You keep four rounds of prizes.',
  ), [ch('Walk on.', out('Your Mankey looks back at the ring all the way to the door.'))]),
  rm('gn-16-rival-return', 'A Familiar Belt', ring(0, { pokemon: 'primeape' }), say(
    'On the path ahead, a fighter of your own kind stands very straight, arms folded across a belt it made itself: red cloth, knotted, bleached by the sun.',
    'It looks at you, and bows, once, from the waist.',
  ), [
    ch('Bow back.', out('It grins. The home-made belt is the best thing it owns. It has never looked better.',
      when('tournament-shared', { min: 1 }, [], 'The belt has two names stitched on it. One of them is yours.'),
      moment('The Tournament rival came back in a home-made belt, and bowed.', 60), { kind: 'friendship', amount: 10, who: 'party' })),
    ch('Walk on.', out('You nod and walk on. It watches you go, belt and all.')),
  ]),
];
function lastBout(): Json {
  return { ...trainer('Pax', { size: 1, types: ['fighting'], mirror: true, friendly: true, rule: { gn: 'lastExchange', evolveMid: true, noItems: true }, win: CHAMPION, lose: FINAL_LOSS }), levelBonus: -1 };
}
const KANTO_TOURNEY: Json = { ...withBracket(gev('cs-kanto-saffron-tournament', 'The Fighting Tournament', ring(0, { stop: 'event', rarity: 'common', types: ['fighting'], requires: [is('kanto-mankey'), { kind: 'partyLine', species: 'mankey' }, not('kanto-tournament-won'), not('tournament-out'), notThisRegion('tournament-at')] }), DOOR16, SIGN_UP)), canon: 'cs.kanto.saffron.tournament' };

export const EVENTS: Json[] = [...gn16, KANTO_TOURNEY];

/** The old Kanto canon builds of these stories (moved to Greenneedle): kept for saved runs, never shown again. */
export const REMOVE: string[] = [
  ...['tc', 't1', 'tm1', 't2', 'tm2', 't3', 'tm3', 't4', 'tm4', 't5a', 't5b', 't5c', 't-win1', 't-win2', 't-win3', 'rival-return'].map((n) => `cs-kanto-saffron-${n}`),
];

export const PLACEMENT: Record<string, Placement> = {
  'gn-16-door': {
    gn: 'gn.16', shape: 'Single', earliest: 'A4', home: 15, window: [13, 18], sits: 'optional', attaches: 'town', tags: ['Tournament Episode'],
    level: 'Every foe scaled exactly to your Mankey or Primeape', often: 'run', dressing: { kanto: 'The Fighting Tournament', kantoStage: 'Saffron (the canon space)', elsewhere: 'The Fighting Tournament' },
    note: 'Badge: a belt. The stage after gn.15, with its Mankey in the party. Until towns exist it sits on step 15. Kanto shows it through cs-kanto-saffron-tournament.',
  },
};

export const CHAINS: Json[] = [];
