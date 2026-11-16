// Greenneedle, part 6: gn.26 The Island of Giant Pokémon, gn.27 The Pokémon Circus (doc GREENNEEDLE_REWORKED_PLACED_6.md).
// Build: npm run co:build -- greenneedle-6   then   npm run co:gn
import { $, any, anyType, ch, egg, fight, flag, heal, hurtLead, item, join, out, RARE_HELD, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, gev, gn, inside, is, leavePseudo, moment, not, notThisRegion, pick, regionChanged, rm, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.26  THE ISLAND OF GIANT POKÉMON  (a door, then a Pseudo Stage of six nodes; needs water; step 15, optional, instead of the
// battle; once a run). Giants aren't Dynamax: double HP and three-quarter Speed (battle rule `giant`). Three problems; the
// guardian Nidoking reads how many you solved.
// =====================================================================================================================
const GIANT_TINT = '#5f7f6a';
const isle = (o: Json = {}): Json => ({ tint: GIANT_TINT, tags: ['Pokémon', 'Exploration', 'Story'], effect: 'none', ...o });
const groom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, isle(o), intro, choices);
const SOLVED = 'giants-solved';
/** A giant: double HP, three-quarter Speed. It can't be caught; losing to it sends you on, not out. */
const giant = (species: string, lv: number, win: Json[], lose: Json[], o: Json = {}): Json =>
  inside({ ...wild({ species: [species], lv, win }), exact: true, friendly: true, rule: { giant: true, noCatch: true }, lose, ...o });
/** Whether the guardian will fight: one problem or none solved, or the Snorlax was attacked. Worked out before the high ground. */
const THREAT: Json[] = [
  setTo('giants-threat', 0),
  gn('check', { key: 'giants-weak', if: [is(SOLVED, 0, 1)] }),
  when('giants-weak', { min: 1 }, [setTo('giants-threat', 1)]),
  when('giants-snorlax-attacked', { min: 1 }, [setTo('giants-threat', 1)]),
];
/** After a problem: the next node, or (when the player went back to help) the high ground again. */
const onward = (next: string): Json[] => [...THREAT, when('giants-back', { min: 1 }, [scene('gn-26-high')]), when('giants-back', { min: 0, max: 0 }, [{ kind: 'addEvent', eventId: next }])];
const solve = (key: string): Json[] => [flag(key), flag(SOLVED)];
/** What the island gives, by problem solved (paid on leaving, with the Giant's Mark). */
const SPOILS: Json[] = [
  when('giants-river', { min: 1 }, [item('leftovers')], 'Where the Snorlax was lying: a Leftovers.'),
  // The oar-sized feather is a cosmetic keepsake: cut with the Keepsakes (Kice, Nov 13). The text keeps it.
  when('giants-nest', { min: 1 }, [flag('giants-feather'), egg({ types: ['flying'] })], 'From the Pidgeot: a feather the size of an oar, too big to carry far. From the small birds: an Egg.'),
  when('giants-quarrel', { min: 1 }, [{ kind: 'itemFrom', ids: ['root-fossil', 'claw-fossil'] }], 'From the empty clearing: a fossil.'),
];
const MARK: Json[] = [item('giants-mark'), flag('giants-done'), stampRegion('giants-at'), ...SPOILS];
const DONE: Json[] = [...MARK, leavePseudo()];
/** Helped at the Stranding (gn.new.17) or freed the Kaiju's Tentacool (gn.11): calm around big ones. */
const CALM: Json[] = [when('stranding-helped', { min: 1 }, [setTo('giants-calm', 1)]), when('kaiju-freed', { min: 1 }, [setTo('giants-calm', 1)])];

const gn26: Json[] = [
  gev('gn-26-door', 'The Island of Giant Pokémon', isle({ stop: 'event', rarity: 'rare', types: ['water'], pokemon: 'slowbro', requires: [not('giants-done'), not('giants-entered')] }), say(
    'A boat pulled up on the shingle, and a ferryman asleep in it.',
    'Out past the breakers there\'s an island, green and high. Something on it is moving. Something very big.',
  ), [
    ch('Wake the ferryman.', out('**Ferryman:** "Out there? Hm. Mind your feet. Everything there\'s bigger than you." He rows without looking round.', flag('giants-entered'), setTo(SOLVED, 0), ...CALM, { kind: 'addEvent', eventId: 'gn-26-beach' })),
    ch('Walk on.', out('You walk on. Behind you, out at sea, something very large sighs.')),
  ]),
  // ---- Node 1. The Beach ----
  groom('gn-26-beach', 'Island of Giants: The Beach', {
    pokemon: 'slowbro',
    remembers: [{ id: 'calm', when: [is('giants-calm')], notice: '*You\'ve been calm around big ones before. It shows.*' }],
  }, say(
    'The boat grounds. The sand is full of prints the size of the boat.',
    '*A Slowbro\'s head comes up out of the surf.* *It keeps coming up.*',
    'It looks down at you, and at your lead, with enormous, gentle interest.',
  ), [
    ch('Hold still.', out('It picks your lead up, the way you\'d pick up a shell. It turns it over. It sets it down, gently.', flag('giants-held-still'),
      when('giants-calm', { min: 0, max: 0 }, [], 'The wrong way up. It wanders off, pleased with itself.'),
      when('giants-calm', { min: 1 }, [], 'The right way up. It looks at you as if to say: you\'re calm around big ones. Then it wanders off.'),
      ...onward('gn-26-river'))),
    ch('Run.', out('You run. It follows you up the beach in three slow, curious strides, and the wave it makes knocks you flat.', hurtLead(0.1), ...onward('gn-26-river'))),
    ch('Recall my lead.', out('Your lead vanishes into its Ball. The Slowbro stares at the place it was, for a long time. Then it sinks, disappointed.', ...onward('gn-26-river'))),
  ]),
  // ---- Node 2. The Dry River: problem 1 ----
  groom('gn-26-river', 'Island of Giants: The Dry River', { pokemon: 'snorlax' }, say(
    'Small Pokémon at a cracked riverbed, licking the stones.',
    'Upstream, a hill that\'s breathing. A giant Snorlax lies across the river. It has dammed it by lying down. Above it, a lake.',
    'It isn\'t doing it on purpose. It\'s asleep.',
  ), [
    chIf([anyType('flying', 'grass')], 'Tickle its foot.', out(say(
      'A feather, or a vine, along the sole of a foot the size of a door.',
      'It giggles in its sleep. It rolls over. The river finds its way round it, and the small Pokémon cheer in high, tiny voices.',
    ), ...solve('giants-river'), ...onward('gn-26-stack'))),
    chIf([anyType('ground')], 'Dig a channel past it.', out(say(
      'It takes the rest of the day. Your Ground-type digs, and digs, and the Snorlax snores on.',
      'At sunset the water finds the channel, and goes round. Nobody woke anybody.',
    ), takeNode(1), ...solve('giants-river'), ...onward('gn-26-stack'))),
    ch('Attack it.', fight('It wakes. It isn\'t pleased. When it stands, the lake comes down all at once.', giant('snorlax', 2,
      [setTo('giants-snorlax-attacked', 1), ...onward('gn-26-stack')],
      [setTo('giants-snorlax-attacked', 1), ...onward('gn-26-stack')]), setTo('giants-snorlax-attacked', 1))),
    ch('Leave it sleeping.', out('You leave it. The small Pokémon watch you go.', ...onward('gn-26-stack'))),
  ]),
  // ---- Node 3. The Sea Stack: problem 2 ----
  groom('gn-26-stack', 'Island of Giants: The Sea Stack', { pokemon: 'pidgeot' }, say(
    'A giant Pidgeot, sitting on a sea stack. Small Flying-types nest on its back, in the hollow between its shoulders.',
    'One nest has slid to the very edge. The chicks in it are crying.',
    'The Pidgeot lowers a wing, gently, so you can look.',
  ), [
    ch('Hold still.', out('You hold still. It looks at you a long time. Then the wing stays down, like a ramp.', scene('gn-26-climb'))),
    ch('Send a Pokémon up alone.', out('The small birds mob it at once, a storm of beaks and wings. It comes back down fast, and a little bald.', hurtLead(0.1), ...onward('gn-26-trench'))),
    ch('Leave the nest.', out('You leave it. The crying follows you a long way.', ...onward('gn-26-trench'))),
  ]),
  groom('gn-26-climb', 'Island of Giants: The Climb', { pokemon: 'pidgeot' }, say(
    'You climb. Its shoulders rise and fall under you as it breathes, slow as a tide.',
    'The nest is right at the edge.',
  ), [
    ch('Slide the nest back.', out(say(
      'In, out. You move with its breath. You get both hands on the nest, and slide it home.',
      'The small birds go quiet. One of them sits on your head.',
    ), ...solve('giants-nest'), ...onward('gn-26-trench')), {
      prompt: { id: 'breath-walk', needs: 'ok' },
      fail: out('It breathes out as you breathe in. You slide down its wing into soft feathers, and the nest stays where it was.', ...onward('gn-26-trench')),
    }),
  ]),
  // ---- Node 4. The Trench ----
  groom('gn-26-trench', 'Island of Giants: The Trench', { pokemon: 'rhydon' }, say(
    'A giant Rhydon walks a border, back and forth, wearing a trench. The path crosses it.',
    'It charges anything inside the trench.',
  ), [
    ch('Fight it.', fight('You step in. It lowers its horn.', giant('rhydon', 1, onward('gn-26-clearing'), onward('gn-26-clearing')))),
    ch('Go the long way round.', out('It costs you time, but the Rhydon never sees you.', takeNode(1), ...onward('gn-26-clearing'))),
    ch('Wait for it to reach the far end.', out('It turns at the far end. You run, and you\'re across before it\'s turned back.', ...onward('gn-26-clearing')), {
      prompt: { id: 'trench-dash', needs: 'ok' },
      fail: fight('Too soon. It sees you, and it comes.', giant('rhydon', 1, onward('gn-26-clearing'), onward('gn-26-clearing'))),
    }),
  ]),
  // ---- Node 5. The Clearing: problem 3 ----
  groom('gn-26-clearing', 'Island of Giants: The Clearing', { pokemon: 'tangela' }, say(
    'A giant Kabutops and a giant Tangela face each other across a clearing. Neither has moved in a day.',
    'They\'re quarrelling over a nest site. It\'s too small for either of them.',
  ), [
    ch('Show them.', out(say(
      'You walk into the clearing, and call out your whole party, and stand them in it.',
      'It\'s full. Six small Pokémon, and there\'s no more room.',
      'The giants look. They look at each other. They leave, in opposite directions.',
    ), ...solve('giants-quarrel'), ...onward('gn-26-high'))),
    ch('Side with the Kabutops.', out('The Tangela sulks. It will sulk in the clearing for a week.', flag('giants-sided'), ...onward('gn-26-high'))),
    ch('Side with the Tangela.', out('The Kabutops sulks. It will sulk in the clearing for a week.', flag('giants-sided'), ...onward('gn-26-high'))),
    ch('Leave them to it.', out('You leave them. Neither notices.', ...onward('gn-26-high'))),
  ]),
  // ---- Node 6. The High Ground: the guardian ----
  groom('gn-26-high', 'Island of Giants: The High Ground', {
    pokemon: 'nidoking',
    remembers: [{ id: 'snorlax', when: [is('giants-snorlax-attacked')], notice: '*It doesn\'t wait. It\'s already on its way down the hill.*' }],
  }, say(
    '*A giant Nidoking. It\'s the size of a church. It\'s been watching you the whole way up.*',
    '*It doesn\'t roar. It lowers its head until one eye is level with you, and it waits.*',
  ), [
    chIf([is(SOLVED, 3)], 'Wait with it.', out(say(
      'It steps aside. Then it follows you down to the beach, to see you off.',
      '*It puts one claw in the surf, and pushes the boat out.*',
    ), setTo('giants-guardian', 1), moment('You helped the island, and its guardian saw you off.', 85), ...DONE)),
    chIf([is(SOLVED, 2, 2), not('giants-threat')], 'Wait with it.', out('It steps aside, slowly. It doesn\'t see you off.', setTo('giants-guardian', 1), ...DONE)),
    chIf([is('giants-threat')], 'Fight it.', fight('It rises. The ground rises with it.', giant('nidoking', 2,
      [setTo('giants-guardian', 2), ...DONE],
      [setTo('giants-guardian', 2), heal(0.5), flag('giants-lost'), ...DONE], { foeMoves: ['earthquake', 'megahorn', 'stamp'] }))),
    chIf([is('giants-threat'), not('giants-snorlax-attacked'), not('giants-back')], 'Go back and help.', out('It watches you go back down the hill. It will still be here.', flag('giants-back'), { kind: 'addEvent', eventId: 'gn-26-help' })),
  ]),
  groom('gn-26-help', 'Island of Giants: Going Back', {}, say('Which one?'), [
    chIf([not('giants-river')], 'The river.', out('Back down to the dry river.', scene('gn-26-river'))),
    chIf([not('giants-nest')], 'The nest.', out('Back to the sea stack.', scene('gn-26-stack'))),
    chIf([not('giants-quarrel')], 'The quarrel.', out('Back to the clearing.', scene('gn-26-clearing'))),
  ]),
  // ---- Afterstory: a footprint on the mainland, a later region ----
  gev('gn-26-print', 'A Footprint', isle({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('giants-done'), regionChanged('giants-at'), not('giants-print')] }), say(
    'A single enormous footprint, pressed into a field.',
    'Nobody comments on it.',
  ), [ch('Nor do you.', out('You step round it, and walk on.', flag('giants-print')))]),
];

// =====================================================================================================================
// gn.27  THE POKÉMON CIRCUS  (a hub, at the town until towns exist: step 10, optional; A4; once a region, with new acts each
// time). Six attractions on tickets (three free at the gate, ₽100 more), the shy one behind the tent, and the final act.
// =====================================================================================================================
const CIRCUS_TINT = '#b0453a';
const tent = (o: Json = {}): Json => ({ tint: CIRCUS_TINT, tags: ['Pokémon', 'Story', 'Shop'], effect: 'none', cast: ['trainer.gentleman'], ...o });
const croom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, tent(o), intro, choices);
const TICKETS = 'circus-tickets';
const VISIT = 'circus-visits';
const FONTAINE = '**Signor Fontaine:**';
/** An attraction's turn costs a ticket. */
const play = (label: string, success: Json, o: Json = {}): Json => ch(label, { ...success, effects: [flag(TICKETS, -1), ...(success.effects as Json[])] }, { requires: [is(TICKETS)], ...o });
const buyTicket = (back: string): Json => ch('Buy a ticket (₽100).', out('A striped ticket, still warm from the machine.', $(-100), flag(TICKETS), scene(back)), { requires: [{ kind: 'money', atLeast: 100 }] });
const toTop = (label = 'Back to the Big Top.'): Json => ch(label, out('Back under the big top. The band hasn\'t stopped once.', scene('gn-27-top')));
/** The shy one: Mime Jr. that juggles, a Pachirisu on the high wire, a Kirlia that dances, or a performer from this region. */
const SHY = gn('cast', { key: 'circus-shy', species: ['mime-jr', 'pachirisu', 'kirlia'], n: 1 });
const HELPS = ['circus-rehearsed', 'circus-wings', 'circus-on-stage'];
const helpedCheck: Json[] = [
  setTo('circus-help-count', 0),
  ...HELPS.map((k) => when(k, { min: 1 }, [flag('circus-help-count')])),
  when('circus-help-count', { min: 2 }, [setTo('circus-shy-helped', 1)], '*Two of the three, and tonight it finishes its act to a standing crowd. It bows, falls over, and stays down, laughing.*'),
];
const FINAL = (team: string[]): Json[] => [
  chIf([not('circus-shy-helped')], 'Places!', fight('The ringmaster sweeps his hat at the band. "Marvellous!"', OWNER(team))),
  chIf([is('circus-shy-helped')], 'Places!', fight('The ringmaster sweeps his hat at the band. Tumble is last in line, and proud.', OWNER([...team, '@circus-shy']))),
  ch('Not tonight.', out('"Tomorrow, then! Or the next day! We are always here, until we aren\'t!"', scene('gn-27-top'))),
];
const ACTS_MOVES = ['baton-pass', 'teeter-dance', 'encore'];
const RARE_PRIZES = RARE_HELD;
const SOLO: Json = { kind: 'canon', action: 'solo', species: [] };
const UNSOLO: Json = { kind: 'canon', action: 'unsolo', species: [] };
/** The Mystery Tent's three tiers (shown); the species isn't. */
const MYSTERY: string[][] = [
  ['eevee', 'pikachu', 'growlithe', 'vulpix', 'ponyta', 'abra', 'magnemite', 'shellder'],
  ['dratini', 'larvitar', 'bagon', 'gible', 'beldum', 'riolu', 'scyther', 'togepi'],
  ['lapras', 'snorlax', 'chansey', 'aerodactyl', 'porygon', 'kangaskhan'],
];
const SHY_CHOICES: Json[] = [
  chIf([not('circus-rehearsed')], 'Rehearse with it, in the empty tent.', out(say(
    'You sit in the front row of the empty tent. Then your lead sits beside you. Then the whole party.',
    'Six in the audience. It gets all the way through the routine.',
  ), flag('circus-rehearsed'), ...helpedCheck, scene('gn-27-top'))),
  chIf([not('circus-wings')], 'Stand in the wings tonight.', out(say(
    'During the show, it looks to the side, and you\'re there.',
    'It keeps looking. It keeps going.',
  ), flag('circus-wings'), ...helpedCheck, scene('gn-27-top'))),
  chIf([not('circus-on-stage')], 'Go on with it.', out(say(
    'You walk on beside it. It goes badly for you and wonderfully for it.',
    'The crowd assumes it\'s a clown act. The applause is enormous.',
  ), flag('circus-on-stage'), flag('rep'), ...helpedCheck, scene('gn-27-top'))),
  ch('Leave it be.', out('It isn\'t on the bill tonight.', scene('gn-27-top'))),
];
/** The circus owner's company: the performers, and the shy one last if it was helped. */
const OWNER = (team: string[]): Json => trainer('Signor Fontaine', {
  team, lv: 0, friendly: true, sprite: 'gentleman',
  win: [
    flag('circus-season'), flag('circus-owner-beaten'), any(...RARE_PRIZES),
    when('circus-owner-beaten', { min: 1 }, [], 'Fontaine sweeps off his hat. **Signor Fontaine:** "Bravo! A season ticket: every circus after this is free. And a little something from the prop box."'),
    gn('check', { key: 'circus-asks', if: [is('circus-shy-helped'), is(VISIT, 2)] }),
    when('circus-asks', { min: 1 }, [{ kind: 'addEvent', eventId: 'gn-27-after' }]),
  ],
  lose: [setTo('circus-owner-lost', 1), when('circus-owner-lost', { min: 1 }, [], '**Signor Fontaine:** "Marvellous! They *nearly!* Again tomorrow!"'), scene('gn-27-top')],
});
const ARENA_TMS = ['body-slam', 'brick-break', 'shadow-ball', 'ice-beam'];

const gn27: Json[] = [
  gev('gn-27-gate', 'The Pokémon Circus', tent({
    stop: 'event', rarity: 'rare', requires: [notThisRegion('circus-at')],
    remembers: [
      { id: 'season', when: [is('circus-season')], notice: '*Your season ticket gets a bow from the man at the gate. Every ride is free tonight.*' },
      { id: 'again', when: [is(VISIT)], notice: '*New posters. New acts. The same band, and the same smell of sugar.*' },
    ],
  }), say(
    '*A tent, red and gold, where there was a field yesterday. A band. A smell of sugar.*',
    `${FONTAINE} "Six wonders! One night only! Possibly two! Step up, step up, the clever ones win things!"`,
  ), [
    ch('Step up.', out('Three tickets, free at the gate. More are ₽100 at the booth inside.',
      flag(VISIT), stampRegion('circus-at'), setTo(TICKETS, 3), when('circus-season', { min: 1 }, [setTo(TICKETS, 99)]),
      SHY, setTo('circus-shy-today', 0), scene('gn-27-top'))),
    ch('Walk on.', out('The band follows you down the road for a while, then gives up.', stampRegion('circus-at'))),
  ]),
  croom('gn-27-top', 'The Pokémon Circus: The Big Top', {
    remembers: [
      { id: 'star', when: [is('circus-shy-helped'), is(VISIT, 2)], notice: '*Top of the bill on every poster: Tumble, by name. Mid-routine, it stops. It has seen someone in row four. It finishes the routine facing that way.*' },
      { id: 'bill', when: [is('roux-met')], notice: '*Lower down the bill, in smaller letters: Madame Roux, Fortunes.*' },
      { id: 'magician', when: [is('magician-met')], notice: '*And: The Magician. Somebody has drawn a rabbit on the poster.*' },
    ],
  }, say('Sawdust, lanterns, a ring in the middle and booths all round it.', 'A board by the entrance: Illusions. Strength. The Track. The Jugglers. The Arena. The Mystery Tent.'), [
    ch('See the attractions.', out('Six booths, and a barker at each.', scene('gn-27-acts'))),
    ch('Walk round behind the tent.', out('Away from the crowd, a practice ring under a single lamp.', flag('circus-shy-met'), scene('gn-27-shy'))),
    ch('The final act.', out('The lights dim. The band stops.', when(VISIT, { min: 3 }, [scene('gn-27-final-3')]), when(VISIT, { max: 2 }, [scene('gn-27-final')]))),
    ch('Leave the circus.', out('Outside, the night is very quiet after the band.', flag('circus-done'))),
  ]),
  croom('gn-27-acts', 'The Pokémon Circus: The Booths', {}, 'Mr. Mime\'s Illusions. Machamp\'s Strength Contest. Rapidash\'s Track.', [
    ch('Mr. Mime\'s Illusions.', out('Three Mr. Mime, side by side, each leaning on an invisible wall.', scene('gn-27-mime'))),
    ch('Machamp\'s Strength Contest.', out('A Machamp on a box, two arms folded behind its back.', scene('gn-27-machamp'))),
    ch('Rapidash\'s Track.', out('A short sandy track and three jumps.', scene('gn-27-track'))),
    ch('More booths.', out('Further round the ring.', scene('gn-27-acts-2'))),
  ]),
  croom('gn-27-acts-2', 'The Pokémon Circus: The Booths', {}, 'The Jugglers. The Arena. The Mystery Tent.', [
    ch('The Jugglers.', out('Aipom on a bench, tails twitching.', scene('gn-27-juggle'))),
    ch('The Arena.', out('A sawdust ring and three trainers in sequins.', scene('gn-27-arena'))),
    ch('The Mystery Tent.', out('A small black tent with a small black curtain.', scene('gn-27-mystery'))),
    ch('Further round.', out('The last booths, by the exit.', scene('gn-27-acts-3'))),
  ]),
  croom('gn-27-acts-3', 'The Pokémon Circus: New This Year', {}, 'The newest acts, still smelling of paint.', [
    chIf([is(VISIT, 2)], 'The Ambipom trapeze.', out('High overhead, Ambipom swing from bar to bar by their tails, and catch each other every time. Nearly every time.', bond(1))),
    chIf([is(VISIT, 2)], 'The fire-eater.', out('A Magmar eats a torch, and looks at you as if to say: your turn. You decline.', flag('circus-fire'))),
    chIf([is(VISIT, 3)], 'The water show.', out('A Dewgong and three Lumineon in a glass tank, turning in slow rings. The crowd goes quiet.', heal(0.25))),
    toTop(),
  ]),
  // ---- 1. Mr. Mime's Illusions: lean on each; the real one's wall holds ----
  croom('gn-27-mime', 'Mr. Mime\'s Illusions', { pokemon: 'mr-mime' }, say('Three Mr. Mime. Two are illusions. Only the real one\'s wall will hold your weight.', 'One ticket, and you may lean once.'), [
    play('Lean on a wall.', out('You pick one.', pick('circus-mime', 1, 1, 1), scene('gn-27-mime-lean'))),
    buyTicket('gn-27-mime'),
    toTop(),
  ]),
  croom('gn-27-mime-lean', 'Mr. Mime\'s Illusions', { pokemon: 'mr-mime' }, 'Left, middle or right?', ['left', 'middle', 'right'].map((side, i) => ch(`The ${side} one.`, out(`You lean on the ${side} one.`,
    when('circus-mime', { min: i + 1, max: i + 1 }, [any(...RARE_PRIZES), flag('circus-mime-won'), scene('gn-27-mime')], 'It holds. The real Mr. Mime bows, and hands you a prize from behind its back.'),
    when('circus-mime', { min: 0, max: i }, [scene('gn-27-mime')], 'You fall straight through it into the sawdust. The crowd loves it.'),
    when('circus-mime', { min: i + 2 }, [scene('gn-27-mime')], 'You fall straight through it into the sawdust. The crowd loves it.'),
  )))),
  // ---- 2. Machamp's Strength Contest: Attack decides; it uses two of its four arms ----
  croom('gn-27-machamp', 'Machamp\'s Strength Contest', { pokemon: 'machamp' }, say('Enter one Pokémon. Attack decides.', 'The Machamp uses only two of its four arms, to be fair.'), [
    play('Enter your strongest.', out('Your strongest steps up and takes the Machamp\'s two hands.',
      gn('check', { key: 'circus-strong', if: [{ kind: 'gn', test: 'strength', key: 'machamp', n: 50 }] }),
      when('circus-strong', { min: 1 }, [item('protein'), flag('circus-strength-won')], 'Slowly, slowly, the Machamp\'s arms go down. It laughs, and lets go, and hands over a Protein.'),
      when('circus-strong', { min: 0, max: 0 }, [], 'The Machamp holds it there, politely, with two arms. It doesn\'t even need the other two.'),
      scene('gn-27-machamp'))),
    buyTicket('gn-27-machamp'),
    toTop(),
  ]),
  // ---- 3. Rapidash's Track: three jumps ----
  croom('gn-27-track', 'Rapidash\'s Track', { pokemon: 'rapidash' }, say('A short race beside a Rapidash. Three jumps.', 'Speed, and timing.'), [
    play('Race.', out('Three jumps, and three clean landings. The Rapidash nods to you at the finish.', $(600), flag('circus-track-won'), scene('gn-27-track')), {
      prompt: { id: 'track-jumps', needs: 'ok' },
      fail: out('You clip the last jump. The Rapidash waits for you at the finish, which is somehow worse.', flag(TICKETS, -1), scene('gn-27-track')),
    }),
    buyTicket('gn-27-track'),
    toTop(),
  ]),
  // ---- 4. The Jugglers: three Aipom, then five, then seven ----
  croom('gn-27-juggle', 'The Jugglers', { pokemon: 'aipom' }, say('Keep the beat while the Aipom juggle.', 'Three Aipom, then five, then seven.'), [
    play('Keep the beat.', out('Three Aipom, three balls. Easy.', scene('gn-27-juggle-5')), {
      prompt: { id: 'juggle-three', needs: 'ok' },
      fail: out('A ball goes into the crowd. So does an Aipom.', flag(TICKETS, -1), scene('gn-27-juggle')),
    }),
    buyTicket('gn-27-juggle'),
    toTop(),
  ]),
  croom('gn-27-juggle-5', 'The Jugglers', { pokemon: 'aipom' }, 'Five Aipom now.', [
    ch('Keep the beat.', out('Five. The crowd starts clapping along.', scene('gn-27-juggle-7')), { prompt: { id: 'juggle-five', needs: 'ok' }, fail: out('The fifth Aipom catches a ball with its face.', scene('gn-27-juggle')) }),
  ]),
  croom('gn-27-juggle-7', 'The Jugglers', { pokemon: 'aipom' }, 'Seven Aipom. The balls are a blur.', [
    ch('Keep the beat.', out('Seven, and not one dropped. The Aipom pile on you in celebration, and leave you a bundle of Berries.', item('sitrus-berry', 2), item('lum-berry', 2), flag('circus-juggle-won'), scene('gn-27-juggle')), { prompt: { id: 'juggle-seven', needs: 'ok' }, fail: out('Ball six and ball seven meet in the middle.', scene('gn-27-juggle')) }),
  ]),
  // ---- 5. The Arena: three battles, no switching, one Pokémon ----
  croom('gn-27-arena', 'The Arena', { pokemon: 'machoke' }, say('Three battles, one after another. One Pokémon. No switching.', 'Win all three and a TM is yours.'), [
    play('Send in your strongest.', fight('The bell rings.', { ...trainer('Arena Performers', { size: 1, chain: 3, lv: 0, friendly: true, win: [UNSOLO, pick('circus-tm', 1, 1, 1, 1), ...ARENA_TMS.map((m, i) => when('circus-tm', { min: i + 1, max: i + 1 }, [{ kind: 'teachMove', move: m }])), flag('circus-arena-won'), scene('gn-27-arena')], lose: [UNSOLO, scene('gn-27-arena')] }) }, SOLO)),
    buyTicket('gn-27-arena'),
    toTop(),
  ]),
  // ---- 6. The Mystery Tent: one unknown Pokémon, offered once ----
  croom('gn-27-mystery', 'The Mystery Tent', {
    remembers: [{ id: 'two', when: [is(VISIT, 2)], notice: '*This year there is a second curtain.*' }],
  }, say('A curtain. A silhouette behind it. A price on a card.', 'Its tier is shown. Its species isn\'t.'), [
    play('Draw back the card.', out('The card turns over.', pick('circus-tier', 3, 2, 1), scene('gn-27-mystery-offer'))),
    buyTicket('gn-27-mystery'),
    toTop(),
  ]),
  croom('gn-27-mystery-offer', 'The Mystery Tent', {}, 'Behind the curtain, something shifts its weight.', [
    chIf([is('circus-tier', 1, 1)], 'Pay ₽500 (Common).', out('The curtain goes back.', $(-500), join({ species: MYSTERY[0]! }), flag('circus-mystery-bought'), scene('gn-27-top')), { requires: [{ kind: 'money', atLeast: 500 }] }),
    chIf([is('circus-tier', 2, 2)], 'Pay ₽1,500 (Rare).', out('The curtain goes back.', $(-1500), join({ species: MYSTERY[1]! }), flag('circus-mystery-bought'), scene('gn-27-top')), { requires: [{ kind: 'money', atLeast: 1500 }] }),
    chIf([is('circus-tier', 3, 3)], 'Pay ₽4,000 (Very rare).', out('The curtain goes back.', $(-4000), join({ species: MYSTERY[2]! }), flag('circus-mystery-bought'), scene('gn-27-top')), { requires: [{ kind: 'money', atLeast: 4000 }] }),
    ch('Walk on.', out('The silhouette sits down. You will never know.', scene('gn-27-top'))),
  ]),
  // ---- The shy one ----
  croom('gn-27-shy', 'The Pokémon Circus: The Practice Ring', {
    remembers: [{ id: 'understudy', when: [is('understudy-went-on')], notice: '*The Mime Jr. from the Understudy is here too, practising beside it. They seem to be friends.*' }],
  }, say(
    '*Behind the tent, at the practice ring, something is doing a perfect routine to nobody.*',
    '*It sees you. It drops everything.*',
    '**A stagehand, Clover Pye:** "That\'s Tumble. Best we\'ve got. Goes on, sees the faces, and can\'t move. Three seasons now."',
  ), SHY_CHOICES),
  // ---- The final act ----
  croom('gn-27-final', 'The Pokémon Circus: The Final Act', {
    remembers: [{ id: 'shy', when: [is('circus-shy-helped')], notice: '*Last into the ring: Tumble. It waves at you first.*' }],
  }, say(
    `${FONTAINE} "And NOW! The management itself! A battle! My company against your… what do you call yours? Your *friends!* How sweet! Places!"`,
  ), [
    ...FINAL(['mr-mime', 'machamp', 'rapidash', 'aipom']),
  ]),
  croom('gn-27-final-3', 'The Pokémon Circus: The Final Act', {
    remembers: [{ id: 'shy', when: [is('circus-shy-helped')], notice: '*Last into the ring: Tumble. It waves at you first.*' }],
  }, say(
    `${FONTAINE} "And NOW! The management itself! And my Ambipom, who has grown since last we met! Places!"`,
  ), FINAL(['mr-mime', 'machamp', 'rapidash', 'ambipom'])),
  croom('gn-27-after', 'The Pokémon Circus', {}, say(
    'After the show, the tent empties. Tumble comes out of the wings and stands at your feet.',
    'It\'s holding the end of a ribbon from its act. It holds it out.',
  ), [
    ch('Come with us.', out('It takes the ribbon in its teeth, and comes. It brings a move from its act.', pick('circus-act', 1, 1, 1),
      ...ACTS_MOVES.map((m, i) => when('circus-act', { min: i + 1, max: i + 1 }, [{ ...join({ species: ['@circus-shy'] }), moves: [m] }])), flag('circus-shy-joined'))),
    ch('Stay. They need you here.', out('It nods. It goes back to the ring and does the whole routine again, just for you.')),
  ]),
];


export const EVENTS: Json[] = [...gn26, ...gn27];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-26-door': {
    gn: 'gn.26', shape: 'Door', earliest: 'A7', home: 15, window: [13, 18], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['water'],
    level: 'Giants A+1; the guardian A+2', often: 'run', badge: 'own', dressing: { kanto: 'Off Vermilion: the Island of Giants', elsewhere: 'The Island of Giant Pokémon' },
    note: 'Badge: a very large footprint. Six nodes. Kanto has no older Island of Giants space to replace.',
  },
  'gn-27-gate': {
    gn: 'gn.27', shape: 'Single', earliest: 'A4', home: 10, window: [8, 13], sits: 'optional', attaches: 'town', tags: ['Hub Destination'], level: 'The arena and the owner A+0', often: 'region', badge: 'own',
    note: 'Badge: a striped tent. At a Town or Hub node; until towns exist, step 10. Returns in later regions with new acts (the trapeze and fire-eater, then the water show and the evolved ace).',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_giants', name: 'The Island of Giant Pokémon', entry: 'gn-26-door', themeId: 'water-grass', tint: GIANT_TINT, mood: 'giant island', start: 'opened' },
];
