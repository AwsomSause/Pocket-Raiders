// Greenneedle, part 4: events gn.16 to gn.20 (doc GREENNEEDLE_REWORKED_PLACED_4.md).
// In Kanto the Saffron canon space opens the same Tournament ("The Greenneedle version is the only version"); its old rooms are retired below.
// Build: npm run co:build -- greenneedle-4   then   npm run co:gn
import { $, anyType, ch, fight, flag, heal, hurt, item, join, leave, money, out, room, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, inside, intel, is, kindness, laterStage, leavePseudo, moment, not, notThisRegion, rm, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

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
/** A hit landed on the first turn of the bout (core/greenneedle/tournament.ts notes it): the crowd rises. */
const FIRST_HIT: Json[] = [when('tc-first-hit', { min: 1 }, [...crowd(), setTo('tc-first-hit', 0)], 'First turn, first hit: it landed one before the bell had stopped ringing. The crowd roars.')];
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
  ({ ...trainer(name, { size: 1, types: ['fighting'], friendly: true, rule: { matchLead: true, bstMatch: true, noItems: true, ...rule }, win: [...FROM_BEHIND, ...FIRST_HIT, heal(0.4), ...win], lose: OUT }), species: [species], levelBonus: -1, ...o });
/** The montage: Power, Guard and Footwork, each once, for the rest of the bracket. */
const TRAIN = (next: string): Json[] => [
  { ...ch('Power', out('It hits a sandbag until the bag gives up. Then it hits the floor where the bag was.', setTo('tournament-montage-power', 1),
    { kind: 'tempEffect', label: 'Training: Power', effects: [{ kind: 'statMultiplier', stat: 'atk', value: 1.1 }, { kind: 'statMultiplier', stat: 'spa', value: 1.1 }], battles: 5, until: 'battle' }, room(next))), showIf: [not('tournament-montage-power')] },
  { ...ch('Guard', out('You throw Berries at it. It learns to block them. It eats the ones it blocks, and looks at you for more.', setTo('tournament-montage-guard', 1),
    { kind: 'tempEffect', label: 'Training: Guard', effects: [{ kind: 'damageTakenMultiplier', value: 0.9 }], battles: 5, until: 'battle' }, room(next))), showIf: [not('tournament-montage-guard')] },
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
  ), [ch('Step into the ring.', fight('You can read them. Your Mankey can hear them. It\'s a step ahead all match.', // The twin shouts the move before it happens: the Machop's opening move is shown before you pick yours (rule `twin`), and your fighter is a step ahead all match.
    bout('Machop', 'machop', { gn: 'twin', myStages: { spe: 1 } }, [item('muscle-band'), room('gn-16-c1')]), FOOTWORK))]),
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
    ...FIRST_HIT,
    when('tc-last-exchange', { min: 1 }, [room('gn-16-last')]),
    when('tc-last-exchange', { min: 0, max: 0 }, CHAMPION),
  ], lose: FINAL_LOSS }), levelBonus: -1 }, FOOTWORK, setTo('tc-last-exchange', 0), setTo('tc-call', 0),
  when('tournament-bowed', { min: 1 }, [], 'In the front row, the Throh is bowing at every hit.'),
  when('tournament-crowd', { min: 5 }, [], 'The hall chants your Mankey\'s name. Its first move will go first.')))]),
  room16('gn-16-last', 'Tournament: The Last Exchange', ring(5, { pokemon: 'primeape' }), say(
    'Both are below a quarter. The hall holds its breath. The game slows.',
    'Your fighter does not look at the rival. It looks at you.',
  ), [
    ch('Now!', fight('You shout. It goes at once: its first move lands before the rival\'s.', lastBout(), setTo('tc-call', 1))),
    ch('Wait for it.', fight('You hold it back, one beat, two. The rival comes to it. It will strike second, and much harder.', lastBout(), setTo('tc-call', 2))),
    ch('You choose.', fight('You say nothing. It looks back at you, once, and decides.', lastBout(), setTo('tc-call', 3), setTo('tc-you-choose', 1),
      gn('check', { key: 'tc-trusts', if: [{ kind: 'friendship', atLeast: 85 }] }),
      when('tc-trusts', { min: 0, max: 0 }, [], 'It looks back at you, and waits. It does not know you well enough yet to be left to it. You call the moves.'))),
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

// =====================================================================================================================
// gn.17  THE POLLUTED FACTORY  (Pseudo Stage: six nodes ending in a three-phase raid; step 8, optional, instead of the battle;
// must-see when the player took the stamped float at the Kaiju, gn.11). The fight rules are core/greenneedle/factory.ts (burst pipes,
// the Molten Sludge, the splitting Magmuk, the burning floor) and gnBattleStart (the Muk's shield, Toxic Spikes, the core).
// =====================================================================================================================
const FACTORY_TINT = '#4a4a2a';
const plant = (o: Json = {}): Json => ({ tint: FACTORY_TINT, tags: ['Combat', 'Pokémon', 'Story'], effect: 'fog', pokemon: 'grimer', ...o });
/** The pool (doc): Grimer, Koffing, Trubbish, Stunky, Gulpin and their regional and Delta forms; evolved ones come with the level. */
const FACTORY_POOL = ['grimer', 'grimer-alola', 'grimer-delta', 'koffing', 'trubbish', 'stunky', 'gulpin'];
/** Every wild battle here has Sludge on the field: Poison moves +10% for everyone. */
const SLUDGE: Json = { typeBoost: { type: 'poison', pct: 10 } };
const MARK = 'factory-in';
/** A lost raid: the factory locks down. Wild Pokémon caught inside are lost; the party you came in with is safe. */
const LOCKDOWN: Json[] = [
  gn('dropUnmarked', { key: MARK }), flag('factory-lost'),
  when('factory-lost', { min: 1 }, [], 'Shutters slam down over every door. A siren. The factory locks down, and you are put out on the coast road. Anything you caught in there stays in there.'),
];
const ENTER: Json[] = [flag('factory-entered'), stampStage('factory-at'), gn('markParty', { key: MARK }), room('gn-17-pipes')];
const SCRIMSHAW = say(
  'A chain-link gate, a smokestack, and a smell like a struck match dropped in a drain.',
  '**Foreman, Mr. Scrimshaw:** "Visitors sign the waiver. It says we\'re not liable. For anything. It\'s a very thorough waiver."',
  'He holds out a clipboard. The pen is chained to it. The chain is corroded green.',
);
const GATE: Json[] = [
  ch('Sign.', out('You sign. Mr. Scrimshaw files it without reading it, under a stack of others nobody read either. The gate rattles open.', ...ENTER)),
  ch('Read it first.', out(say(
    'You read it. All of it. Mr. Scrimshaw shifts from foot to foot.',
    'Page four, in very small print: "solvent residue may be released into the river during normal operation." It\'s a File, now. You keep it.',
  ), flag('factory-file'), intel(1), ...ENTER)),
  ch('Climb the fence.', out('You go over the fence while he\'s still holding out the pen. Your sleeve tears on the wire. He doesn\'t chase you. He just writes something down.', hurt(0.05), ...ENTER)),
];
const FLOAT_GATE = say(
  'A chain-link gate, a smokestack, and the smell of the same slick you saw on the sea.',
  'You hold up the float from the Kaiju\'s net. The stamp is the factory\'s own: a ball inside a cog.',
  '**Mr. Scrimshaw:** "...That\'s ours. That\'s one of ours. I told them the nets would drift."',
  'He looks at it a long time. Then he unlocks the gate himself.',
  '**Mr. Scrimshaw:** "Control room valves. Ignore the labels. Black stain first, then green, then yellow. Don\'t tell them I told you."',
);
/** A raid phase: the Magmuk, uncatchable, at A+2. */
const magmuk = (rule: string, win: Json[]): Json => inside({ ...wild({ species: ['muk-delta-fire'], lv: 2, win }), rule: { gn: rule, noCatch: true }, lose: LOCKDOWN });
/** Once in the raid, the Muk that was helped takes the first attack of the phase the player picks. */
const MUK_IN_FRONT = (text: string, battle: Json): Json =>
  chIf([is('factory-muk-helped'), not('factory-muk-used')], 'Send the Muk in front.', fight(text, battle, setTo('factory-muk-now', 1), flag('factory-muk-used')));
const WON = (text: string, ...more: Json[]): Json[] => [flag('kanto-factory-cleared'), item('black-sludge'), moment(text, 75), ...more, when('factory-shutdown', { min: 0, max: 0 }, [flag('factory-left-running')]), scene('gn-17-pick')];
/** After the pick: the research, if it was taken, then out. */
const PICKED = (n: number): Json[] => [setTo('kanto-factory-pick', n), when('factory-research', { min: 1 }, [scene('gn-17-research')]), when('factory-research', { min: 0, max: 0 }, [leavePseudo()])];
/** A valve: the right one (by the stain) closes; a wrong one bangs, sprays and opens the others again. */
const valve = (label: string, right: boolean, next: string): Json =>
  ch(label, right
    ? out('It turns hard, then all at once. Somewhere below, a pipe stops roaring.', flag('factory-valves'), scene(next))
    : out('Wrong one. The pipes bang like a door kicked in, a hot spray hits your arm, and the valves you closed spin open again.', hurt(0.1), setTo('factory-valves', 0), scene('gn-17-control')));

const gn17: Json[] = [
  gev('gn-17-door', 'The Polluted Factory', plant({ stop: 'event', rarity: 'rare', types: ['poison'], requires: [not('factory-entered'), not('kaiju-stamp')] }), SCRIMSHAW, GATE),
  gev('gn-17-float', 'The Polluted Factory', plant({ stop: 'event', rarity: 'rare', types: ['poison'], requires: [not('factory-entered'), is('kaiju-stamp')] }), FLOAT_GATE, [
    FLOAT_IN_DOOR(),
  ]),
  rm('gn-17-pipes', 'The Polluted Factory: The Pipes', plant({ pokemon: 'koffing' }), say(
    '*The pipes are labelled: IN. OUT. DON\'T ASK.*',
    'They sweat and tick in the heat. Something in the dark between them shifts, and coughs.',
  ), [ch('Go through.', fight('A pipe groans overhead as something comes out of the dark.', PIPE_FIGHT([scene('gn-17-pipes-2')])))]),
  rm('gn-17-pipes-2', 'The Polluted Factory: The Pipes', plant({ pokemon: 'stunky' }), say(
    'Further in, the pipes get lower. You have to stoop.',
    'A drip lands on your neck. It\'s warm. Something else is down here, and it\'s heard you.',
  ), [ch('Keep going.', fight('It comes at you from under a pipe marked DON\'T ASK.', PIPE_FIGHT([room('gn-17-line')])))]),
  rm('gn-17-line', 'The Polluted Factory: The Line', plant({ pokemon: 'magnemite' }), say(
    'The production line. Half-made Poké Balls ride a belt, cheap red shells, thin as eggshell.',
    '**Scientist, Dr. Stroud:** "Do you know what a Poké Ball costs to make *properly?* Nobody can afford properly."',
    'He says it like he has said it to himself many times, and has never once believed it.',
  ), [
    ch('Fight him.', fight('He sighs, and reaches for a Ball off the belt.', inside(trainer('Dr. Stroud', { cls: 'scientist', size: 2, types: ['poison'], lv: 1, win: [$(800), scene('gn-17-desk')] })))),
    ch('Walk past him.', out('He doesn\'t stop you. He goes back to his clipboard. His desk is behind him, unlocked.', scene('gn-17-desk'))),
  ]),
  rm('gn-17-desk', "The Polluted Factory: Dr. Stroud's Desk", plant({ pokemon: 'magnemite' }), say(
    'The desk drawer is full of research. Solvent counts. River samples. A graph that only goes up.',
    'At the bottom, in pencil: "Proper would cost 4x. Tell them."',
  ), [
    ch('Take the research.', out('You take it. Dr. Stroud watches you do it and says nothing at all.', flag('factory-research'), room('gn-17-pits'))),
    ch('Leave it.', out('You shut the drawer. Someone else can carry that.', room('gn-17-pits'))),
  ]),
  rm('gn-17-pits', 'The Polluted Factory: The Sludge Pits', plant({
    pokemon: 'grimer',
    remembers: [{
      // The Trubbish Nobody Wanted (SF69), caught or kept: it won't leave the sludge pits until every one's out.
      id: 'trubbish', when: [is('trubbish-kept')],
      notice: 'Your Trubbish is over the rail before you have decided anything. It is in the pit, up to its middle, pulling. It won\'t leave the sludge pits until every one\'s out. It knows what it is to be left.',
      hide: [0, 1, 2],
      addChoices: [ch('Pull them out.', fight(
        'Your team wades in after the Trubbish. The Grimer don\'t wait. Six pulls, with the horde at your back: a Pokémon that is pulling is not fighting.',
        HORDE(true), setTo('factory-pulls', 6),
      ))],
    }],
  }), say(
    'The sludge pits. Three Grimer slide up out of the muck to meet you.',
    'And in the pits, stuck fast, six Pokémon that wandered in and couldn\'t get out. One of them is still trying.',
    'Each of yours can pull one free in a turn, instead of fighting. Six stuck: two turns to get them all, with the Grimer horde still attacking.',
  ), [
    ch('Pull them all out.', fight('Your team wades in and pulls. The muck lets go with a sound like a boot in mud. The Grimer don\'t wait.', HORDE(true), setTo('factory-pulls', 6))),
    ch('Pull out three, then fight.', fight('One turn of pulling, with the Grimer coming on. Then you turn and face them.', HORDE(true), setTo('factory-pulls', 3))),
    ch('Fight the Grimer; leave the pits.', fight('The three Grimer come on together, slow and sure. Behind them, in the pits, something stops trying.', HORDE(false), setTo('factory-pulls', 0))),
  ]),
  // The old second go at the pits (before the pulling moved into the fight): kept so a saved run standing on it still loads.
  rm('gn-17-pits-2', 'The Polluted Factory: The Sludge Pits', plant({ pokemon: 'grimer' }), say(
    'Some are out, shaking off the sludge on the walkway. Some are still in.',
    'The Grimer are closing in.',
  ), [
    ch('Pull the rest out.', fight('One more heave, all together, with the Grimer at your back.', HORDE(true), setTo('factory-pulls', 6))),
    ch("That's enough.", fight('You leave the rest. You turn to the Grimer.', HORDE(false), setTo('factory-pulls', 0))),
  ]),
  rm('gn-17-muk', 'The Polluted Factory: The Muk in the Wall', plant({ pokemon: 'muk' }), say(
    'A Muk is pressed against a split in the pipe wall, holding a leak shut with its own body.',
    'It\'s been there for days. Its edges have dried and cracked. It doesn\'t look at you. It can\'t afford to.',
  ), [
    { ...ch('Seal the pipe for it (a Steel-, Fire- or Rock-type).', out(say(
      'Your Pokémon seals the split, a weld that glows and cools.',
      '*It slides off the wall. It leaves its shape there, in the grime. It looks at the place where it was.*',
      '*It looks at you. It\'s never been thanked, so it doesn\'t know what this is.*',
      'It follows you. Quietly, a little behind.',
    ), flag('factory-muk-helped'), kindness(1), moment('You sealed a pipe so a Muk could finally let go of the wall.', 70), room('gn-17-control')), { requires: [anyType('steel', 'fire', 'rock')] }) },
    ch('Feed it.', out(say(
      'You hold food up to it. It eats from your hand without moving off the wall. Then it eats again. Days of nothing go out of its edges.',
      'With something in it at last, it does what it was too spent to do: it leaves a piece of itself in the split, a plug the size of a fist, and the leak stays shut without it.',
      '*It slides off the wall. It looks at the place where it was. It looks at you. It\'s never been thanked, so it doesn\'t know what this is.*',
      'It follows you. Quietly, a little behind.',
    ), flag('factory-muk-helped'), kindness(1), moment('You fed a Muk that had held a pipe shut for days, until it could let go of the wall.', 70), room('gn-17-control'))),
    ch('Leave it.', out('You walk on. Behind you, it holds the leak shut. It will go on holding it.', room('gn-17-control'))),
  ]),
  rm('gn-17-control', 'The Polluted Factory: The Control Room', plant({ pokemon: 'magneton' }), say(
    'The control room. Dials, all in the red. Three big wheel valves on the wall.',
    'A window looks down into the furnace. Something down there glows.',
  ), [
    chIf([is('factory-valves', 0, 2)], 'Close the valves.', out('You go to the valves.', setTo('factory-valves', 0), scene('gn-17-valve1'))),
    chIf([not('factory-scientist')], 'Fight the scientist.', fight('A second scientist steps out from behind the dials. "You can\'t be in here!"', inside(trainer('Scientist', { cls: 'scientist', size: 2, types: ['poison', 'steel'], lv: 1, win: [$(600), flag('factory-scientist'), scene('gn-17-control')] })))),
    ch('Look through the glass.', out('You go to the window. The lever is beside it, behind its own pane.', flag('factory-saw-form'), scene('gn-17-glass'))),
    ch('Go down to the furnace.', out('A metal stair, down into the heat.', room('gn-17-raid1'))),
  ]),
  rm('gn-17-glass', 'The Polluted Factory: Through the Glass', plant({ pokemon: 'muk', effect: 'fire' }), say(
    'Through the glass: something in the furnace, moving. A Muk of Ground and Fire, glowing at the seams.',
    'It isn\'t angry. It hurts. It rolls over in the heat like something trying to sleep on a burn.',
    'Beside the window, behind its own glass: LINE STOP.',
  ), [
    chIf([not('factory-shutdown')], 'Break the glass.', out('You break the glass. The lever is cold. Once it\'s pulled, the line stops, and it doesn\'t start again.', scene('gn-17-lever'))),
    ch('Step back.', out('You step back from the window. The glow stays on your eyes a while.', scene('gn-17-control'))),
  ]),
  rm('gn-17-lever', 'The Polluted Factory: Line Stop', plant({ pokemon: 'magneton' }), say('Your hand is on the lever. It can\'t be undone.'), [
    ch('Pull it.', out(say(
      'The line stops. The belt grinds to a halt. Every half-made Ball rolls off the end and onto the floor.',
      'Somewhere below, the river stops getting worse.',
    ), stampRegion('factory-shutdown'), moment('You pulled the lever and stopped the factory line for good.', 70), scene('gn-17-control'))),
    ch('Not yet.', out('You take your hand off it.', scene('gn-17-control'))),
  ]),
  rm('gn-17-valve1', 'The Polluted Factory: The Valves', plant({ pokemon: 'magneton' }), say(
    'Three valves, labelled COOLANT, STEAM and WATER. The labels are wrong. The stains on the floor are right.',
    'Under COOLANT, the floor is black and eaten through. Under WATER, a green crust. Under STEAM, a thin yellow film.',
  ), [valve('The valve marked COOLANT.', true, 'gn-17-valve2'), valve('The valve marked STEAM.', false, ''), valve('The valve marked WATER.', false, '')]),
  rm('gn-17-valve2', 'The Polluted Factory: The Valves', plant({ pokemon: 'magneton' }), say('One down. The pipes shudder. The green crust under WATER has started to bubble.'), [
    valve('The valve marked STEAM.', false, ''), valve('The valve marked WATER.', true, 'gn-17-valve3'),
  ]),
  rm('gn-17-valve3', 'The Polluted Factory: The Valves', plant({ pokemon: 'magneton' }), say('Two down. Only STEAM is left, over its thin yellow film.'), [
    ch('The valve marked STEAM.', out('The last one closes. The whole building goes quiet, like it\'s holding its breath.', flag('factory-valves'), scene('gn-17-control'))),
  ]),
  rm('gn-17-raid1', 'The Polluted Factory: The Furnace', plant({ pokemon: 'muk', effect: 'fire' }), say(
    'The Magmuk. Huge, slow, spreading across the floor like a spill that decided to stand up.',
    'Wherever it touches, the floor glows. It lays Molten Sludge on its first turn.',
    'Spread moves split it. Each one makes a small one that has to be beaten too. Hit it once at a time.',
  ), [
    ch('Fight.', fight('It rears up. The heat comes off it in waves.', magmuk('sludge', [scene('gn-17-raid2')]))),
    MUK_IN_FRONT('Your Muk flows out in front of everyone, without being asked.', magmuk('sludge', [scene('gn-17-raid2')])),
  ]),
  rm('gn-17-raid2', 'The Polluted Factory: The Furnace Burns', plant({ pokemon: 'muk', effect: 'fire' }), say(
    'It\'s burning now, and so is the floor. Anything that isn\'t a Fire-type may catch a burn each turn.',
    'Water moves go up as steam: half damage. But they clear the Molten Sludge.',
  ), [
    ch('Fight.', fight('The floor glows under your feet.', magmuk('furnace', [scene('gn-17-core')]))),
    MUK_IN_FRONT('Your Muk flows out in front, its edges hissing on the floor.', magmuk('furnace', [scene('gn-17-core')])),
  ]),
  rm('gn-17-core', 'The Polluted Factory: The Core', plant({ pokemon: 'grimer' }), say(
    'It\'s small now. Small, fast and frightened. The size of a Grimer, backing into a corner.',
    '*It\'s pressed against the furnace door. It keeps looking at the pipe it came out of.*',
  ), [
    ch('Finish it.', fight('It only has weak moves left. It uses them anyway.', magmuk('core', WON('You finished the Magmuk in the Polluted Factory.')))),
    ch('Stop attacking.', out(say(
      'You call your team back. It stays in the corner. One turn. Two.',
      'Then it slides into the pipe it came out of, and is gone.',
    ), ...WON('You stopped attacking, and the Magmuk went home down its pipe.'))),
    chIf([is('factory-muk-helped')], 'Let the Muk go to it.', out(say(
      'Your Muk slides over. It puts an arm round it.',
      'The small one stops shaking. They go into the pipe together. Neither looks back.',
    ), flag('factory-magmuk-calmed'), kindness(2), ...WON('The Muk you freed took the Magmuk home.'))),
  ]),
  rm('gn-17-pick', 'The Polluted Factory: After', plant({ pokemon: 'grimer' }), say(
    'The furnace ticks as it cools. On the floor, a lump of Black Sludge, still warm.',
    'Out of the pits and the pipes, a few of the ones you passed are watching you. One of them could come along.',
  ), [
    ch('Alolan Grimer', out('The Alolan Grimer slides up, all bright colours, and sticks to your boot.', join({ species: ['grimer-alola'] }), ...PICKED(1))),
    ch('Delta Grimer', out('The Delta Grimer, dry and sandy, nudges your hand.', join({ species: ['grimer-delta'] }), ...PICKED(2))),
    ch('Trubbish', out('The Trubbish rolls over to you and waits to be picked up.', join({ species: ['trubbish'] }), ...PICKED(3))),
    chIf([is('factory-muk-helped'), not('factory-magmuk-calmed')], 'The Muk', out('Your Muk doesn\'t wait to be asked. It\'s already beside you. It knows how to hold something shut for someone else.',
      { ...join({ species: ['muk'] }), ability: 'stopgap' }, ...PICKED(4))),
  ]),
  rm('gn-17-research', "The Polluted Factory: Dr. Stroud's Research", plant({ pokemon: 'magnemite' }), say(
    'You still have Dr. Stroud\'s research. It\'s worth a lot to the right people.',
  ), [
    ch('Sell it.', out('A buyer pays a lot, in cash, without asking where it came from. They\'ll build another factory, somewhere further on.', $(5000), flag('factory-research-sold'), stampRegion('factory-sold-at'), leavePseudo())),
    ch('Hand it to a professor.', out('The professor reads it twice and goes pale. "This changes how we make Balls. Properly." They send you one to try, and word goes round: from now on every shop on your road stocks the Dream Ball.', item('dream-ball'), flag('factory-research-given'), leavePseudo())),
  ]),
  gev('gn-17-fishing', 'A River with Fish in It', plant({ stop: 'event', rarity: 'uncommon', pokemon: 'magikarp', effect: 'none', tint: '#2a5a6a', tags: ['Pokémon', 'Story'], requires: [is('factory-shutdown'), { kind: 'gn', test: 'thisRegion', key: 'factory-shutdown' }, laterStage('factory-at'), not('factory-fished')] }), say(
    'On the riverbank, a man in a foreman\'s jacket with the badge torn off. Mr. Scrimshaw. Out of a job.',
    'His line is in the water. The water is clear. Something tugs.',
    '**Mr. Scrimshaw:** "Fish in it. Can you believe that? There are fish in it."',
  ), [ch('Sit with him.', out('You sit. He catches nothing for an hour and doesn\'t mind at all.', moment('Mr. Scrimshaw, fishing in a river with fish in it.', 55), kindness(1), flag('factory-fished')))]),
];
function FLOAT_IN_DOOR(): Json {
  return ch('Go in.', out('Mr. Scrimshaw writes the valve order on the back of your hand in marker, so you won\'t forget.', flag('factory-valve-order'), ...ENTER));
}
function PIPE_FIGHT(win: Json[]): Json {
  return inside(eitherWay({ ...wild({ types: ['poison'], species: FACTORY_POOL, lv: 1, win }), rule: { gn: 'pipes', ...SLUDGE } }));
}
function HORDE(pull: boolean): Json {
  return inside(eitherWay({ ...wild({ format: 'triples', species: ['grimer'], lv: 1, win: [scene('gn-17-muk')] }), rule: pull ? { gn: 'pits', ...SLUDGE } : SLUDGE }));
}
const FLOAT_IN: Json = FLOAT_IN_DOOR();
// In Kanto the canon door is the factory's door: with the stamped float from the Kaiju, the foreman recognises it there too.
const KANTO_FACTORY: Json = { ...gev('cs-kanto-fuchsia-factory', 'The Polluted Factory', plant({
  stop: 'event', rarity: 'common', types: ['poison'], requires: [not('factory-entered')],
  remembers: [{ id: 'float', when: [is('kaiju-stamp')], intro: FLOAT_GATE, hide: [0, 1, 2], addChoices: [FLOAT_IN] }],
}), SCRIMSHAW, GATE), canon: 'cs.kanto.fuchsia.factory' };
/** Consequences (doc): research sold, "the buyer builds another factory, in a later region"; left running, "the Kaiju, if freed, comes back". */
const FOLLOW_UPS: Json[] = [
  gev('gn-17-second', 'The Same Stamp', plant({
    stop: 'event', rarity: 'uncommon', pokemon: 'grimer', tags: ['Story'],
    requires: [is('factory-research-sold'), { kind: 'gn', test: 'regionChanged', key: 'factory-sold-at' }, not('factory-second')],
  }), say(
    'A river you have never seen before, and a smell you have. A struck match, dropped in a drain.',
    'Upstream there is a new smokestack, the brick still clean. A new chain-link gate. On the gate, the same stamp: a ball inside a cog. Under it, in fresh paint, a name you last saw on a receipt.',
    'The buyer built it. With the graph that only goes up, and the pencil note at the bottom crossed out.',
  ), [
    ch('Look at the water.', out(say(
      'The river below the outfall is the colour the other one was. Something small and purple slides off the bank into it, quite at home.',
      'For the rest of this region, on water routes, Poison-types are a step more common, and Water-types a step rarer.',
    ), stampRegion('factory-second'), moment('The research you sold built a second factory, on a new river.', 65))),
    ch('Walk on.', out(say(
      'You walk on. You can smell it for a long way.',
      'For the rest of this region, on water routes, Poison-types are a step more common, and Water-types a step rarer.',
    ), stampRegion('factory-second'))),
  ]),
  gev('gn-17-kaiju-back', 'It Came Back', plant({
    stop: 'event', rarity: 'rare', pokemon: 'tentacruel', tint: '#1d3a4a', effect: 'shake', tags: ['Combat', 'Pokémon', 'Story'],
    requires: [is('factory-left-running'), is('kaiju-freed'), laterStage('factory-at'), not('factory-kaiju-back'), { kind: 'stageTypes', types: ['water'] }],
  }), say(
    'The slick is on this water too. It followed the coast, the way the factory\'s runoff does, because nobody stopped the line.',
    '*Out in the bay, the sea bulges. The Kaiju. It came back.*',
    'There is a new net across its body, the same cheap cord, the same stamped floats, cutting in. It is not looking at the town. It is looking for whoever keeps doing this.',
  ), [
    chIf([{ kind: 'gn', test: 'cutter' }], 'Cut it free again.', out(say(
      'You have done this before, and so has it. It holds still this time, mostly. The cords part. It hangs in the water a moment, looking at you, and at the slick, and at you.',
      'Then it goes. It will be back for as long as the factory runs.',
    ), hurt(0.2), kindness(1), flag('factory-kaiju-back'), moment('The Kaiju came back in a new net from the same factory, and you cut it free again.', 65))),
    ch('Drive it away from the harbour.', fight(
      'It rises to meet you, and the bay rises with it. It is hurt, and it is angrier than last time.',
      { kind: 'raid', raidId: 'kaiju-tentacruel', name: 'Kaiju Tentacruel', levelBonus: 0, win: [flag('factory-kaiju-back'), item('poison-barb')], lose: [flag('factory-kaiju-back')] },
    )),
    ch('Leave the harbour to it.', out('You leave. Behind you a pier goes, plank by plank, and nobody on it is the one who made the net.', flag('factory-kaiju-back'))),
  ]),
];

// =====================================================================================================================
// gn.18  SAFARI LAND  (Hub Destination: the town; until towns exist step 12, optional; once a region). The park itself is a minigame,
// core/greenneedle/safari.ts (30 Balls, 500 steps, four areas, Quiet, families, herds, the migration, photography, tracking, feeding);
// what a visit leaves behind is safariEnd.ts. These events are the gate, the free second visit and the Kanto canon space.
// =====================================================================================================================
const PARK_TINT = '#6a7a2e';
const park = (o: Json = {}): Json => ({ tint: PARK_TINT, tags: ['Pokémon', 'Exploration', 'Story'], effect: 'none', pokemon: 'rhyhorn', ...o });
const OPEN_PARK: Json[] = [stampRegion('safari-at'), gn('minigame', { key: 'gn-safari' })];
const WARDEN_GATE = say(
  'A wooden gatehouse, a turnstile, and a warden in a wide hat with binoculars round their neck.',
  '**Warden Baoba-Lin:** "Thirty Safari Balls. Five hundred steps. No battles: your Pokémon wait here. Bait, rocks, or Balls. Or nothing, which is underrated."',
  '**Warden:** "I\'ll be narrating. Under my breath. Pretend I\'m not."',
);
const PHOTO_ON_WALL: Json = { id: 'photo', when: [is('safari-photo-best')], notice: 'On the gatehouse wall, one of your photographs hangs in a frame, with a small brass plate under it.' };
const GATE18: Json[] = [
  chIf([not('safari-fee-up')], 'Pay ₽500 and go in.', out('The turnstile clicks. Thirty Safari Balls in a canvas bag, and a step counter on your wrist.', $(-500), ...OPEN_PARK), { requires: [money(500)] }),
  chIf([is('safari-fee-up')], 'Pay ₽800 and go in.', out('**Warden:** "Eight hundred. The Rhyhorn are still talking about last time." The turnstile clicks.', $(-800), ...OPEN_PARK), { requires: [money(800)] }),
  ch('Not today.', leave('**Warden:** "Fair enough. It\'ll be here. That\'s rather the point of it."')),
];
const gn18: Json[] = [
  gev('gn-18-gate', 'Safari Land', park({ stop: 'event', rarity: 'uncommon', types: ['normal', 'ground'], requires: [notThisRegion('safari-at')], remembers: [PHOTO_ON_WALL] }), WARDEN_GATE, GATE18),
  gev('gn-18-return', 'Safari Land: A Free Visit', park({ stop: 'event', rarity: 'uncommon', types: ['normal', 'ground'], requires: [is('safari-free'), { kind: 'gn', test: 'thisRegion', key: 'safari-free' }, not('safari-free-used')], remembers: [PHOTO_ON_WALL] }), say(
    'The warden lifts the turnstile bar before you reach it.',
    '**Warden:** "You. Go on. No charge. You were barely there last time; be barely there again."',
  ), [
    ch('Go in, free.', out('Thirty Safari Balls, and the warden doesn\'t even count them out.', setTo('safari-free-used', 1), gn('minigame', { key: 'gn-safari' }))),
    ch('Not today.', leave('**Warden:** "It keeps."')),
  ]),
];
const KANTO_SAFARI: Json = { ...gev('cs-kanto-fuchsia-safari', 'Safari Land', park({ stop: 'event', rarity: 'common', types: ['normal', 'ground'], requires: [notThisRegion('safari-at')], remembers: [PHOTO_ON_WALL] }), WARDEN_GATE, GATE18), canon: 'cs.kanto.fuchsia.safari' };

export const EVENTS: Json[] = [...gn16, KANTO_TOURNEY, ...gn17, KANTO_FACTORY, ...FOLLOW_UPS, ...gn18, KANTO_SAFARI];

/** The old Kanto canon builds of these stories (moved to Greenneedle): kept for saved runs, never shown again. */
export const REMOVE: string[] = [
  ...['tc', 't1', 'tm1', 't2', 'tm2', 't3', 'tm3', 't4', 'tm4', 't5a', 't5b', 't5c', 't-win1', 't-win2', 't-win3', 'rival-return'].map((n) => `cs-kanto-saffron-${n}`),
  ...['n1', 'n2', 'n3', 'n4', 'n5a', 'n5b', 'n5c', 'n6', 'pick'].map((n) => `cs-kanto-fuchsia-factory-${n}`),
];

export const PLACEMENT: Record<string, Placement> = {
  'gn-16-door': {
    gn: 'gn.16', shape: 'Single', earliest: 'A4', home: 15, window: [13, 18], sits: 'optional', attaches: 'town', tags: ['Tournament Episode'],
    level: 'Every foe scaled exactly to your Mankey or Primeape', often: 'run', dressing: { kanto: 'The Fighting Tournament', kantoStage: 'Saffron (the canon space)', elsewhere: 'The Fighting Tournament' },
    note: 'Badge: a belt. The stage after gn.15, with its Mankey in the party. Until towns exist it sits on step 15. Kanto shows it through cs-kanto-saffron-tournament.',
  },
  'gn-17-door': {
    gn: 'gn.17', shape: 'Door', earliest: 'A6', home: 8, window: [6, 11], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Raid'],
    level: 'A+1; the raid at A+2', often: 'run', badge: 'own', dressing: { kanto: 'The Polluted Factory', kantoStage: 'The coast road near Fuchsia (the canon space)', elsewhere: 'The Polluted Factory' },
    note: 'Badge: a smokestack. Six nodes ending in a three-phase raid. Kanto shows it through cs-kanto-fuchsia-factory.',
  },
  'gn-17-float': {
    gn: 'gn.17', shape: 'Door', earliest: 'A6', home: 8, window: [6, 11], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage', 'Raid'],
    level: 'A+1; the raid at A+2', often: 'run', badge: 'own', dressing: { kanto: 'The Polluted Factory', kantoStage: 'The coast road near Fuchsia (the canon space)', elsewhere: 'The Polluted Factory' },
    note: 'The same door, must-see, when the player took the stamped float at the Kaiju (gn.11): Mr. Scrimshaw opens the gate and gives the valve order.',
  },
  'gn-18-gate': {
    gn: 'gn.18', shape: 'Single', earliest: 'A5', home: 12, window: [10, 15], sits: 'optional', attaches: 'town', tags: ['Hub Destination', 'Community Episode'],
    level: 'No battles; catches at A+0', often: 'region', badge: 'own', dressing: { kanto: 'Safari Land', kantoStage: 'Fuchsia (the canon space)', elsewhere: 'Safari Land' },
    note: 'Badge: a paw print. The park is the gn-safari minigame stop the gate opens. Until towns exist it sits on step 12. Kanto shows it through cs-kanto-fuchsia-safari.',
  },
  'gn-18-return': { gn: 'gn.18', shape: 'Single', earliest: 'A5', home: 14, window: [10, 20], sits: 'optional', attaches: 'town', tags: ['Hub Destination'], level: 'No battles', often: 'region', note: 'The free second visit, after a visit that ended on Quiet 8 or more, the same region.' },
  'gn-17-second': { gn: 'gn.17', shape: 'Single', earliest: 'A7', home: 8, window: [6, 14], sits: 'optional', tags: ['Afterstory'], level: 'no battle', often: 'run', note: 'Only after the research was sold, in a later region: the buyer\'s new factory. Poison a step more common, Water a step rarer, on that region\'s water routes.' },
  'gn-17-kaiju-back': { gn: 'gn.17', shape: 'Single', earliest: 'A7', home: 10, window: [8, 15], sits: 'optional', tags: ['Afterstory'], level: 'the Kaiju raid at A+0', often: 'run', needs: ['water'], note: 'Only when the factory was left running and the Kaiju was cut free at gn.11: it comes back on a later water stage.' },
  'gn-17-fishing': { gn: 'gn.17', shape: 'Single', earliest: 'A6', home: 14, window: [9, 20], sits: 'optional', tags: ['Afterstory'], level: 'A+0', often: 'run', note: 'Only after the line was shut down, later the same region.' },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_factory', name: 'The Polluted Factory', entry: 'gn-17-door', themeId: 'poison-steel', tint: FACTORY_TINT, mood: 'smog', start: 'opened' },
];
