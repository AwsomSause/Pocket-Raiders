// Greenneedle, part 6: gn.26 The Island of Giant Pokémon, gn.27 The Pokémon Circus (doc GREENNEEDLE_REWORKED_PLACED_6.md).
// Build: npm run co:build -- greenneedle-6   then   npm run co:gn
import { foe } from './_evil-story-kit.ts';
import { $, any, anyType, ch, egg, fight, flag, heal, hurtLead, item, join, out, RARE_HELD, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { bond, cap, chIf, gev, gn, inside, is, kindness, laterStage, leavePseudo, moment, not, notThisRegion, pick, regionChanged, rm, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

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
    ), ...solve('giants-quarrel'), ...onward('gn-26-high')), { requires: [{ kind: 'partySize', atLeast: 6 }] }),
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
/** After the first curtain: from the second visit on there is a second one (a new card, a new silhouette), once a visit. */
const SECOND_CURTAIN: Json[] = [
  gn('check', { key: 'circus-second', if: [is(VISIT, 2), not('circus-curtain')] }),
  when('circus-second', { min: 1 }, [setTo('circus-curtain', 1), pick('circus-tier', 3, 2, 1), scene('gn-27-mystery-offer-2')], '*Behind it, a second curtain.*'),
  when('circus-second', { min: 0, max: 0 }, [scene('gn-27-top')]),
];
/** One curtain: the tier is shown, the species isn't. Pay, or walk on; `next` is what follows either way. */
const mysteryOffer = (id: string, intro: string, next: Json[]): Json => croom(id, 'The Mystery Tent', {}, intro, [
  ...([['Common', 500], ['Rare', 1500], ['Very rare', 4000]] as [string, number][]).map(([tier, price], i) =>
    chIf([is('circus-tier', i + 1, i + 1)], `Pay ₽${price.toLocaleString('en-US')} (${tier}).`, out('The curtain goes back.', $(-price), join({ species: MYSTERY[i]! }), flag('circus-mystery-bought'), ...next), { requires: [{ kind: 'money', atLeast: price }] })),
  ch('Walk on.', out('The silhouette sits down. You will never know.', ...next)),
]);
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
/** After the show, in a later region's circus, the helped one may ask to join (once). */
const ASKS: Json = gn('check', { key: 'circus-asks', if: [is('circus-shy-helped'), is(VISIT, 2), not('circus-shy-joined')] });
/** The circus owner's company: the performers, and the shy one last if it was helped. */
const OWNER = (team: string[]): Json => trainer('Signor Fontaine', {
  team, lv: 0, friendly: true, sprite: 'gentleman',
  win: [
    flag('circus-season'), flag('circus-owner-beaten'), any(...RARE_PRIZES),
    when('circus-owner-beaten', { min: 1 }, [], 'Fontaine sweeps off his hat. **Signor Fontaine:** "Bravo! A season ticket: every circus after this is free. And a little something from the prop box."'),
    ASKS,
    when('circus-asks', { min: 1 }, [{ kind: 'addEvent', eventId: 'gn-27-after' }]),
  ],
  // "After the show it may ask to join": the show is over whoever won it.
  lose: [setTo('circus-owner-lost', 1), when('circus-owner-lost', { min: 1 }, [], '**Signor Fontaine:** "Marvellous! They *nearly!* Again tomorrow!"'), ASKS,
    when('circus-asks', { min: 1 }, [scene('gn-27-after')]), when('circus-asks', { min: 0, max: 0 }, [scene('gn-27-top')])],
});
const ARENA_TMS = ['body-slam', 'brick-break', 'shadow-ball', 'ice-beam'];
const MIME_SIDES = ['left', 'middle', 'right'];
const VITAMIN_PRIZES = ['protein', 'calcium', 'carbos', 'hp-up', 'iron', 'zinc'];

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
      SHY, setTo('circus-shy-today', 0), setTo('circus-curtain', 0), scene('gn-27-top'))),
    ch('Walk on.', out('The band follows you down the road for a while, then gives up.', stampRegion('circus-at'))),
  ]),
  croom('gn-27-top', 'The Pokémon Circus: The Big Top', {
    remembers: [
      { id: 'star', when: [is('circus-shy-helped'), is(VISIT, 2)], notice: '*Top of the bill on every poster: Tumble, by name. Mid-routine, it stops. It has seen someone in row four. It finishes the routine facing that way.*' },
      { id: 'bill', when: [{ kind: 'eventSeen', id: 'festival-day' }], notice: '*Lower down the bill, in smaller letters: Madame Roux, Fortunes.*' },
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
  // ---- 1. Mr. Mime's Illusions: spot which is real. Lean on each; the real one's wall holds your weight. ----
  // A ticket buys the booth: you may watch them first (the sawdust gives the real wall away), then lean on each in turn. Two
  // falls and the last one standing is the real one, and bows, but the prize is for spotting it.
  croom('gn-27-mime', 'Mr. Mime\'s Illusions', { pokemon: 'mr-mime' }, say('Three Mr. Mime. Two are illusions. Only the real one\'s wall will hold your weight.', 'One ticket. Spot the real one: lean on each, if you must.'), [
    play('Step up to the walls.', out('The three of them press their palms flat against nothing at all.', pick('circus-mime', 1, 1, 1), setTo('circus-mime-falls', 0), ...MIME_SIDES.map((_, i) => setTo(`circus-mime-tried-${i + 1}`, 0)), scene('gn-27-mime-lean'))),
    buyTicket('gn-27-mime'),
    toTop(),
  ]),
  croom('gn-27-mime-lean', 'Mr. Mime\'s Illusions', { pokemon: 'mr-mime' }, 'Left, middle or right?', [
    ...MIME_SIDES.map((side, i) => chIf([not(`circus-mime-tried-${i + 1}`)], `Lean on the ${side} one.`, out(`You lean on the ${side} one.`,
      setTo(`circus-mime-tried-${i + 1}`, 1),
      when('circus-mime', { min: i + 1, max: i + 1 }, [any(...RARE_PRIZES), flag('circus-mime-won'), scene('gn-27-mime')], 'It holds. The real Mr. Mime bows, and hands you a prize from behind its back.'),
      ...[...MIME_SIDES.keys()].filter((k) => k !== i).map((k) => when('circus-mime', { min: k + 1, max: k + 1 }, [flag('circus-mime-falls'),
        when('circus-mime-falls', { min: 0, max: 1 }, [scene('gn-27-mime-lean')], 'You fall straight through it into the sawdust. The crowd loves it. An illusion. Two left.'),
        when('circus-mime-falls', { min: 2 }, [scene('gn-27-mime')], 'You fall straight through that one too. The last Mr. Mime, the real one, bows very low. No prize for the last wall standing.'),
      ])),
    ))),
    ch('Watch them first.', out('You stand back and watch the floor, not the hands.',
      ...MIME_SIDES.map((side, i) => when('circus-mime', { min: i + 1, max: i + 1 }, [], `*Sawdust drifts across the ring. It blows straight through two of the walls. At the foot of the ${side} one, it piles up.*`)),
      scene('gn-27-mime-lean'))),
  ]),
  // ---- 2. Machamp's Strength Contest: Attack decides; it uses two of its four arms ----
  croom('gn-27-machamp', 'Machamp\'s Strength Contest', { pokemon: 'machamp' }, say('Enter one Pokémon. Attack decides.', 'The Machamp uses only two of its four arms, to be fair.'), [
    play('Enter your strongest.', out('Your strongest steps up and takes the Machamp\'s two hands.',
      gn('check', { key: 'circus-strong', if: [{ kind: 'gn', test: 'strength', key: 'machamp', n: 50 }] }),
      when('circus-strong', { min: 1 }, [item('protein'), flag('circus-strength-won')], 'Slowly, slowly, the Machamp\'s arms go down. It laughs, and lets go, and hands over a Protein.'),
      when('circus-strong', { min: 0, max: 0 }, [], 'The Machamp holds it there, politely, with two arms. It doesn\'t even need the other two.'),
      scene('gn-27-machamp'))),
    buyTicket('gn-27-machamp'),
    // The one after next (third visit on): the strongman's rematch.
    chIf([is(VISIT, 3)], 'The strongman\'s rematch.', out('The Machamp has seen you. It unfolds the other two arms.', scene('gn-27-rematch'))),
    toTop(),
  ]),
  // The one after next (third visit): the strongman's rematch. All four arms this time; two stat items for a win.
  croom('gn-27-rematch', 'The Strongman\'s Rematch', { pokemon: 'machamp' }, say('Enter one Pokémon. Attack decides.', 'This time the Machamp uses all four arms. It says that is only fair too.'), [
    play('Enter your strongest.', out('Your strongest steps up. The Machamp takes hold with all four hands.',
      gn('check', { key: 'circus-strong', if: [{ kind: 'gn', test: 'strength', key: 'machamp', n: 100 }] }),
      when('circus-strong', { min: 1 }, [any(...VITAMIN_PRIZES), any(...VITAMIN_PRIZES), flag('circus-rematch-won')], 'Four arms go down, one at a time. The Machamp stares at its hands. Then it roars with laughter, and presses two bottles on you.'),
      when('circus-strong', { min: 0, max: 0 }, [], 'Four arms. It was never going to be close. The Machamp pats your Pokémon on the head, very gently, with the fourth.'),
      scene('gn-27-rematch'))),
    buyTicket('gn-27-rematch'),
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
  mysteryOffer('gn-27-mystery-offer', 'Behind the curtain, something shifts its weight.', SECOND_CURTAIN),
  // Next region on: "the Mystery Tent has a second curtain". A second unknown Pokémon, offered once, after the first.
  mysteryOffer('gn-27-mystery-offer-2', 'The second curtain. A different silhouette. A different card.', [scene('gn-27-top')]),
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
      ...ACTS_MOVES.map((m, i) => when('circus-act', { min: i + 1, max: i + 1 }, [{ ...join({ species: ['@circus-shy'] }), moves: [m] }])), flag('circus-shy-joined'), scene('gn-27-top'))),
    ch('Stay. They need you here.', out('It nods. It goes back to the ring and does the whole routine again, just for you.', scene('gn-27-top'))),
  ]),
];

// =====================================================================================================================
// gn.28  THE TEAM ROCKET HIDEOUT  (a door, then a Pseudo Stage of four floors; needs an active Evil Team, written in its
// words: Rocket's, or the region's own team re-dressed; step 14, optional, instead of the battle; A6; once a run).
// The Alert meter (0 to 10): a camera that sees you +2, an alarm +3; the tape loop blinds the next two cameras.
// =====================================================================================================================
const HIDE_TINT = '#2a1f24';
const base = (o: Json = {}): Json => ({ tint: HIDE_TINT, tags: ['Evil Team', 'Dungeon', 'Story'], effect: 'none', ...o });
const floor = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, base(o), intro, choices);
const ALERT = 'hideout-alert';
const LOOP = 'hideout-loop';
/** A camera on the floor you've just reached: +2, unless the tapes are looping. */
const INSIDE = 'hideout-inside';
/** Whether anyone can be talked past: at Alert 0 to 4; inside the team, a colleague still can up to 9. */
const canTalk: Json = { kind: 'gn', test: 'canTalkPast', key: 'hideout-alert' };
const noTalk: Json = { kind: 'gn', test: 'noTalkPast', key: 'hideout-alert' };
const insideTeam: Json = { kind: 'gn', test: 'insideTeam' };
const camera: Json[] = [
  gn('check', { key: 'hideout-looped', if: [is(LOOP)] }),
  when('hideout-looped', { min: 1 }, [flag(LOOP, -1)], 'The camera\'s red light stays off. The loop is still running.'),
  when('hideout-looped', { min: 0, max: 0 }, [flag(ALERT, 2), cap(ALERT, 10),
    when(INSIDE, { min: 0, max: 0 }, [], 'A camera turns, slowly, to follow you. (Alert +2)'),
    // Inside the team the floors are your workplace, and the meter is Suspicion.
    when(INSIDE, { min: 1 }, [], 'A camera turns, slowly, to follow you. You are staff. Staff don\'t usually come down here. (Suspicion +2)'),
  ]),
];
const alarm: Json[] = [flag(ALERT, 3), cap(ALERT, 10)];
/** On to the next floor, past its camera. */
const down = (next: string): Json[] => [...camera, { kind: 'addEvent', eventId: next }];
/** How awake the floor is: bored (0 to 4), patrols (5 to 9), everyone (10). Three lines, one shows. */
const MOOD = (where: string): Json[] => [
  // {hideout:meter} is "Alert", or "Suspicion" inside the team (where the floors are your workplace); {hideout:patrol} says who can still talk.
  { id: 'bored', when: [is(ALERT, 0, 4)], notice: `*{hideout:meter} low: the ${where} is bored. Some of them could be talked past.*` },
  { id: 'patrol', when: [is(ALERT, 5, 9)], notice: `*{hideout:meter}: patrols. Torches sweep the ${where}. {hideout:patrol}*` },
  { id: 'full', when: [is(ALERT, 10)], notice: '*{hideout:meter} 10. Every alarm in the building is going. Every Grunt left has called up one more Pokémon.*' },
];
/** A Grunt fight inside the Hideout (A+0): at Alert 10 each one has one more Pokémon. */
const grunts = (n: number, win: Json[]): Json => ({ ...foe('grunt', '{grunt}', 2, { pseudo: true, lv: 0, chain: n, win }), moreIf: { key: ALERT, at: 10 } });
const THROWN_OUT: Json[] = [flag('hideout-thrown-out'), flag('hideout-done'), leavePseudo()];
/** The rescued cast (freed here) are remembered: some nod, a few ask to join, the rest found a rescue centre. */
const FREED: Json[] = [flag('freed-caged'), stampStage('hideout-at'), stampRegion('hideout-region'), kindness(1)];
/** A reward, then out the way you came. */
const REWARD = (key: string, text: string, ...effects: Json[]): Json => out(text, ...effects, setTo(`hideout-reward`, 1), flag(`hideout-reward-${key}`), flag('hideout-done'), stampRegion('hideout-done-region'), leavePseudo());
const RARE_EGGS = ['dratini', 'larvitar', 'bagon', 'beldum', 'gible', 'deino', 'goomy', 'jangmo-o', 'riolu', 'axew'];

const gn28: Json[] = [
  gev('gn-28-door', 'The {team} Hideout', base({ stop: 'event', rarity: 'rare', pokemon: 'meowth', requires: [{ kind: 'evil', ends: ['none'] }, not('hideout-done'), not('hideout-entered')] }), say(
    'A shuttered {front} building on the edge of town. No sign on the door.',
    'A {grunt} is smoking by the bins. He doesn\'t see you. Behind him, the door is propped open with a fire extinguisher.',
  ), [
    ch('Go in.', out('You step over the extinguisher. Inside it smells of floor polish and burnt coffee.', flag('hideout-entered'), setTo(ALERT, 0), setTo(LOOP, 0),
      gn('check', { key: INSIDE, if: [insideTeam] }), when(INSIDE, { min: 1 }, [], '*You know the smell. You work here. Today you are not here to work.*'), ...camera, { kind: 'addEvent', eventId: 'gn-28-offices' })),
    ch('Walk on.', out('You walk on. Behind you the {grunt} finishes his cigarette, kicks the extinguisher, and the door swings shut.')),
  ]),
  // ---- Floor 1. Offices ----
  floor('gn-28-offices', '{team} Hideout: The Offices', { pokemon: 'meowth', remembers: MOOD('office') }, say(
    'Desks. A canteen with a broken kettle. Two {grunt}s arguing over a stapler.',
    'On the staff noticeboard: *LOST: one Meowth, answers to nothing.*',
  ), [
    chIf([not('hideout-file')], 'Search the filing cabinet.', out(say(
      'Third drawer down, under a lunch order: a File. Names, dates, a map with red pins in it.',
      'You fold it into your jacket. The drawer squeaks shut.',
    ), flag('hideout-file'), { kind: 'evil', mark: 'files' }, ...alarmIfSeen(), scene('gn-28-offices'))),
    ch('Slip behind the canteen.', out('Past the fridge, a door marked STAFF ONLY. Somebody has written *REALLY* under it.', scene('gn-28-back'))),
    chIf([canTalk], 'Talk your way past.', out('You walk up to them as if you had every right to.',
      when(INSIDE, { min: 0, max: 0 }, [], '"New starter," you say. "They sent me down to Labs." The {grunt}s shrug. Neither of them wants the stapler that much.'),
      when(INSIDE, { min: 1 }, [], '"Audit," you say, and hold up a clipboard from the nearest desk. They know your face. They don\'t like it, but they know it. They let you by.'),
      ...down('gn-28-labs'))),
    ch('Fight your way through.', fight('The stapler goes flying. Both of them reach for their Balls.', grunts(2, down('gn-28-labs')))),
  ]),
  floor('gn-28-back', '{team} Hideout: Behind the Canteen', { pokemon: 'meowth' }, say(
    'A cupboard full of mops. Behind the mops, a cash box. Beside it, a wall of little monitors.',
    'A tape deck under the desk, labelled *LOOP*.',
  ), [
    chIf([not('hideout-cash')], 'Take the petty cash.', out('Notes, coins, a voucher for a free noodle bowl. The team\'s petty cash. (₽1,200)', $(1200), flag('hideout-cash'), scene('gn-28-back'))),
    chIf([not('hideout-tapes')], 'Put the loop on.', out('The monitors flicker, and show an empty corridor, over and over. The next two cameras see nothing.', setTo(LOOP, 2), flag('hideout-tapes'), scene('gn-28-back'))),
    chIf([not('hideout-tapes')], 'Smash the monitors.', fight('Glass everywhere. Somewhere upstairs, a bell starts ringing. Boots on the stairs. (Alert +3)', grunts(1, [scene('gn-28-offices')]), ...alarm, flag('hideout-tapes'))),
    ch('Back to the offices.', out('You put the mops back the way they were.', scene('gn-28-offices'))),
  ]),
  // ---- Floor 2. Labs ----
  floor('gn-28-labs', '{team} Hideout: The Labs', {
    pokemon: 'porygon',
    remembers: [
      { id: 'known', when: [is('hideout-lab-known')], notice: '*Through the frosted glass of the locked lab, the lights are still on.*' },
      ...MOOD('lab floor').slice(1),
    ],
  }, say(
    'Glass. Machines that hum. Scientists in white coats who don\'t look up.',
    'At the end of the floor, one laboratory is locked. Beside it, one scientist is standing at a window, not working.',
  ), [
    chIf([not('hideout-scientist')], 'Talk to the scientist at the window.', out('He doesn\'t turn round. He\'s been waiting for somebody, and it might as well be you.', scene('gn-28-scientist'))),
    chIf([is('hideout-lab-key'), not('hideout-lab-open')], 'Unlock the laboratory.', out('The key turns. The door hisses.', flag('hideout-lab-open'), scene('gn-28-lab'))),
    ch('Take the stairs down.', out('The stairs go down to a floor that smells of straw.', ...down('gn-28-holding'))),
    chIf([is(ALERT, 5)], 'Fight the patrol.', fight('A patrol comes round the corner. They\'ve been looking for you.', grunts(1, [scene('gn-28-labs')]))),
  ]),
  floor('gn-28-scientist', '{team} Hideout: Dr. Emmerich Aldersey', { pokemon: 'porygon' }, say(
    '**Dr. Emmerich Aldersey:** "You\'re not staff. Good. I\'ve been hoping someone who isn\'t staff would come."',
    '**Dr. Emmerich Aldersey:** "I signed on for the research. I didn\'t ask what it was for. I\'ve started asking."',
  ), [
    ch('Give me the key.', out('He takes a key off a string round his neck and holds it out. He doesn\'t follow you.', flag('hideout-lab-key'), flag('hideout-scientist'), scene('gn-28-labs'))),
    chIf([not('hideout-lab-known')], 'What\'s in the locked lab?', out(say(
      '**Dr. Emmerich Aldersey:** "The ones that didn\'t take. They\'re still alive."',
      '"Nobody\'s switched the lights off. That\'s how I know someone here still feels something."',
    ), flag('hideout-lab-known'), scene('gn-28-scientist'))),
    ch('Come with me.', out(say(
      'He looks at you for a long moment. Then he takes off his badge, and goes down the floor opening every door.',
      '**Dr. Emmerich Aldersey:** "Next region. Look under a rock. I\'ll find you."',
    ), flag('hideout-lab-key'), flag('hideout-scientist'), setTo('hideout-scientist-turned', 1), stampRegion('hideout-turned-region'), setTo(LOOP, 1), scene('gn-28-labs'))),
    ch('You knew. You stayed.', out('**Dr. Emmerich Aldersey:** "Yes." He gives you the key. He goes back to his window.', flag('hideout-lab-key'), flag('hideout-scientist'), setTo('hideout-scientist-judged', 1), scene('gn-28-labs'))),
  ]),
  floor('gn-28-lab', '{team} Hideout: The Locked Laboratory', {
    pokemon: 'porygon',
    remembers: [{ id: 'known', when: [is('hideout-lab-known')], notice: '*He was right. The lights are on. Someone kept them on.*' }],
  }, say(
    'Tanks. In them, Pokémon mid-way through something. They turn their heads to follow you.',
    'One tank glows a dark, wrong purple. The Pokémon inside it is a Shadow Pokémon. It presses one paw to the glass.',
  ), [
    ch('Open its tank.', out(say(
      'The glass slides up. It steps out into the cold air and stands very close to you.',
      'It doesn\'t trust you. It doesn\'t trust anyone. It comes anyway.',
    ), { ...join({ shadow: true }) }, flag('hideout-shadow-freed'), scene('gn-28-labs'))),
    ch('Leave them sleeping.', out('You leave the lights on.', scene('gn-28-labs'))),
  ]),
  // ---- Floor 3. Holding (SF133, the Holding Pen) ----
  floor('gn-28-holding', '{team} Hideout: Holding', {
    pokemon: 'chansey',
    remembers: [
      { id: 'kind', when: [is('kind-total', 10)], notice: '*One of them knows your lead. A kindness you did on some road, a long time ago. It comes to the bars first.*' },
      ...MOOD('pen').slice(1),
    ],
  }, say(
    'Cages, stacked three high, labelled for shipping. A Chansey in the nearest one is trying to look after all of them through the bars.',
    'The pen keeper, a tired {grunt} with a bucket of feed, steps in front of them. "Don\'t. I just feed them. Don\'t."',
  ), [
    ch('Open every cage.', fight('You open every cage. She drops the bucket and reaches for a Ball.', grunts(1, [...FREED, ...down('gn-28-vault')]), flag('hideout-pen-fought'))),
    chIf([canTalk], 'Ask the keeper to help.', out('You ask her, quietly, the way you would ask for the salt.',
      when(INSIDE, { min: 0, max: 0 }, [], 'She looks at you for a long time. "...They bite the boss. They never bite me."'),
      when(INSIDE, { min: 1 }, [], '"You\'re from upstairs," she says. "I\'ve seen you in the canteen." She looks at the cages, and at you. "...Go on, then. Before I think about it."'),
      when('hideout-entered', { min: 1 }, [], 'She hands you the keys, folds her jacket on the bucket, and helps you open every cage. Then she walks out with them.'),
      flag('hideout-keeper-quit'), ...FREED, ...down('gn-28-vault'))),
    chIf([noTalk], 'Ask the keeper to help.', fight('"Not with the alarms going," she says. "They\'ll know it was me." She puts the bucket down, and reaches for a Ball.', grunts(1, [...FREED, ...down('gn-28-vault')]))),
  ]),
  // ---- Floor 4. The Vault ----
  floor('gn-28-vault', '{team} Hideout: The Vault', { pokemon: 'persian', effect: 'shake' }, say(
    'A round steel door, open. Inside, gold-coloured shelves and a desk. Behind the desk, {lt}.',
    '**{lt}:** "You\'ve cost us a floor of salaries. Do you know what a {grunt} *costs?* The hats alone."',
  ), [
    chIf([is(ALERT, 0, 9)], 'Fight.', fight('{lt} stands, and straightens their cuffs.', exec([]), flag('hideout-exec'))),
    // Alert 10: "two Grunts stand with them". One fight: the Executive's own team and one Pokémon from each Grunt, two at a time.
    chIf([is(ALERT, 10)], 'Fight.', fight('{lt} snaps their fingers. Two {grunt}s step out from behind the shelves, and stand with them.', exec([], true), flag('hideout-exec'))),
  ]),
  floor('gn-28-reward', '{team} Hideout: The Vault Shelves', { pokemon: 'persian' }, say(
    '{lt} is gone, out a back door you didn\'t see. The shelves are full of things the team took.',
    'You can carry one. Anything more and you won\'t make the stairs.',
  ), [
    // The Shadow Pokémon is the one from the locked lab: if you opened its tank upstairs, it is already with you.
    chIf([not('hideout-shadow-freed')], 'A Shadow Pokémon.', REWARD('shadow', 'A Poké Ball in a velvet box, cold to the touch. It never asked to be like this. It comes with you.', { ...join({ shadow: true }) })),
    ch('A stolen evolution item.', out('A stone with a luggage label tied to it. A name and an address, in a child\'s writing.', scene('gn-28-stone'))),
    ch('A rare egg.', REWARD('egg', 'An Egg in a padded crate stamped FRAGILE. Nobody has written what it is.', egg({ species: RARE_EGGS }))),
    ch('A pass to the black market.', REWARD('pass', 'A plastic card with a red R on it. For the rest of the region, the night market will treat you as one of theirs.', stampRegion('hideout-pass'))),
  ]),
  floor('gn-28-stone', '{team} Hideout: The Luggage Label', { pokemon: 'persian' }, say(
    'The label says who it belongs to. They live two towns back.',
  ), [
    ch('Return it to its owner.', REWARD('stone-returned', 'You post it back with a note. A week later a drawing finds you: you, a stone, and a very big smile.', kindness(1))),
    ch('Keep it.', REWARD('stone', 'You untie the label and put it in your pocket. The stone is yours now.', { kind: 'itemFrom', ids: ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone', 'dusk-stone', 'dawn-stone', 'shiny-stone', 'ice-stone'] })),
  ]),
  // ---- After: the rescued cast, the rescue centre, the scientist's note ----
  gev('gn-28-nod', 'Someone You Freed', base({ stop: 'event', rarity: 'uncommon', callback: true, tags: ['Pokémon', 'Relationship'], requires: [is('freed-caged'), laterStage('hideout-at')] }), say(
    'A wild Pokémon steps onto the path. It doesn\'t raise its hackles. It doesn\'t run.',
    'It looks at you, and it nods, once. You were the one who opened the cage.',
  ), [ch('Nod back.', out('It turns, and goes back into the long grass. It knows where you are now.', flag('hideout-nods')))]),
  gev('gn-28-asks', 'Someone You Freed, Again', base({ stop: 'event', rarity: 'uncommon', callback: true, tags: ['Pokémon', 'Relationship'], requires: [is('freed-caged'), notThisRegion('hideout-region'), notThisRegion('hideout-asked')] }), say(
    'One of the Pokémon from the Hideout cages has been following you for a whole stage.',
    'It finally comes close enough to touch. It sits down at your feet and waits.',
  ), [
    // "A few ask to join, at normal catch odds, with Bond +1 already": it never attacks; a Ball decides, at the usual odds.
    ch('Come with us.', fight('It waits. It won\'t raise a paw against you. Whether it stays is up to the Ball.', { ...wild({ lv: 0, win: [stampRegion('hideout-asked')] }), friendly: true, rule: { foeStands: 99 }, caught: [gn('bondNewest', { n: 50 }), stampRegion('hideout-asked')], lose: [stampRegion('hideout-asked')] })),
    ch('Go on. You\'re free.', out('It stays a moment longer. Then it goes, light-footed, the way free things go.', stampRegion('hideout-asked'))),
  ]),
  gev('gn-28-centre', 'The Rescue Centre', base({ stop: 'event', rarity: 'common', callback: true, tags: ['Recovery', 'Pokémon'], pokemon: 'chansey', requires: [is('freed-caged'), notThisRegion('hideout-region'), not('hideout-centre')] }), say(
    'A hand-painted sign by the road: *RESCUE CENTRE. ALL WELCOME. NO TEAMS.*',
    'The nurse is a Chansey. You know her. She was in the nearest cage, looking after everyone through the bars.',
  ), [ch('Go in.', out('She looks after your whole team, and won\'t take a thing for it. The ones you freed built the place themselves. The door stays open: a place to rest, here, for as long as you are on this road.', heal(1), { kind: 'addStop', stop: 'heal' }, flag('hideout-centre')))]),
  gev('gn-28-note', 'A Note Under a Rock', base({ stop: 'event', rarity: 'common', callback: true, tags: ['Evil Team', 'Story'], requires: [is('hideout-scientist-turned'), notThisRegion('hideout-turned-region'), not('hideout-note'), { kind: 'evil', ends: ['none'] }] }), say(
    'A flat stone on a fence post, with a corner of paper sticking out from under it.',
  ), [ch('Read it.', out('Folded small. It\'s signed E.A.', gn('nextOp', {}), flag('hideout-note')))]),
];

/** The cabinet: a camera in the corner sees you unless the tape's looping. */
function alarmIfSeen(): Json[] { return camera; }
/** {lt} at A+2. Winning opens the shelves; losing throws you out, and nothing else. */
function exec(extra: Json[], withGrunts = false): Json {
  return { ...foe('executive', '{lt}', withGrunts ? 5 : 3, { pseudo: true, lv: 2, ...(withGrunts ? { format: 'doubles' as const } : {}), win: [flag('hideout-exec-beaten'), ...extra, { kind: 'addEvent', eventId: 'gn-28-reward' }] }), lose: THROWN_OUT };
}

// =====================================================================================================================
// gn.29  THE PSYDUCK MIGRATION  (a town stop, step 5 until towns exist, optional, instead of the battle; A2; once a region).
// Snake: the minigame `gn-psyduck` (core/greenneedle/snake.ts); the lake opens when it ends (snakeEnd.ts).
// =====================================================================================================================
const DUCK_TINT = '#d9b84a';
const duckTown = (o: Json = {}): Json => ({ tint: DUCK_TINT, tags: ['Pokémon', 'Region'], effect: 'none', pokemon: 'psyduck', ...o });
const BERRY_BUNDLE: Json[] = [{ kind: 'itemFrom', ids: ['oran-berry', 'sitrus-berry', 'lum-berry', 'persim-berry'] }, { kind: 'itemFrom', ids: ['oran-berry', 'sitrus-berry', 'lum-berry', 'persim-berry'] }, { kind: 'itemFrom', ids: ['oran-berry', 'sitrus-berry', 'lum-berry', 'persim-berry'] }];
/** What the town gives: nothing knocked over, a Rare item (and the mayor's hat); a few, a Berry bundle; the wedding cake, nothing extra. */
const THANKS: Json[] = [
  when('psyduck-knocked', { min: 0, max: 0 }, [{ kind: 'itemFrom', ids: RARE_HELD }, flag('psyduck-hat')], 'Nothing knocked over. Mrs. Quimby gives you a Rare item from the town hall, and her own hat. It doesn\'t fit. She insists.'),
  gn('check', { key: 'psyduck-few', if: [is('psyduck-knocked', 1), not('psyduck-cake')] }),
  when('psyduck-few', { min: 1 }, BERRY_BUNDLE, 'A few things knocked over. The town gives you a Berry bundle anyway, a little stiffly.'),
  when('psyduck-cake', { min: 1 }, [], 'The wedding cake. Nothing extra. The couple are laughing about it, eventually.'),
];
/** Ibuprofen is a one-of-a-kind keepsake: cut with the Keepsakes (Kice, Nov 13). The text keeps it. */
const IBUPROFEN = 'Mrs. Quimby presses a bottle of Ibuprofen into your hand. "For the little one. It isn\'t medicine, dear. It\'s a *gesture.*"';

const gn29: Json[] = [
  gev('gn-29-town', 'The Psyduck Migration', duckTown({
    stop: 'event', rarity: 'uncommon', requires: [notThisRegion('psyduck-at')],
    remembers: [{ id: 'bridge', when: [is('kanto-bridge-fell')], notice: '**Mrs. Quimby:** "The bridge is out. Some fool went through it last week."' }],
  }), say(
    '*Psyduck in the road. Psyduck in the fountain. A Psyduck on a roof, with no clear idea how.*',
    '*A bench slides three feet to the left by itself. A lamp post bends, politely.*',
    '**Mayor, Mrs. Quimby:** "They come through every year, on the way to the lake. They\'ve always gone *round.* This year the bridge is out, so they\'ve come *through,* and they\'ve all got headaches."',
    '**Mrs. Quimby:** "They\'ll follow anything that walks in a straight line. We haven\'t got anyone who can."',
  ), [
    ch('I\'ll lead them.', out('Mrs. Quimby claps her hands once. "Splendid. Mind the flower pots."', stampRegion('psyduck-at'), flag('psyduck-led'), gn('minigame', { key: 'gn-psyduck' }))),
    chIf([not('psyduck-why')], 'Why do they have headaches?', out('**Mrs. Quimby:** "They always have headaches, dear. It\'s what they *are.*"', flag('psyduck-why'), scene('gn-29-town'))),
    ch('Not my ducks.', out('You walk on. Behind you, a lamp post bends to let a Psyduck past.', stampRegion('psyduck-at'))),
  ]),
  gev('gn-29-lake', 'The Lake', duckTown({ room: true, tags: ['Pokémon', 'Region'] }), say(
    '*The line reaches the water. One by one, they walk in. The headaches go.*',
    '*Thirty Psyduck float, perfectly still, facing the same way.*',
    '*One doesn\'t go in. It\'s the one that was at the very back. It\'s looking at you, and holding its head.*',
  ), [
    chIf([is('psyduck-rounds', 3)], 'Kneel down to it.', out(say(
      'It walks into your arms and leans its whole head against you. It still hurts. It doesn\'t seem to mind so much now.',
      IBUPROFEN,
    ), { ...join({ species: ['psyduck'] }), ability: 'headache', mark: 'psyduck-headache' }, setTo('psyduck-joined', 1), flag('psyduck-ibuprofen'), ...THANKS)),
    chIf([is('psyduck-rounds', 3)], 'Let it find its own way in.', out('It looks at the water. It looks at you. In the end, it walks in backwards, still holding its head.', ...THANKS)),
    chIf([is('psyduck-rounds', 0, 2)], 'Leave them at the edge of town.', out('They sit down where you left them. The town walks them the rest of the way, slowly, one Psyduck at a time.')),
  ]),
];

// =====================================================================================================================
// gn.30  THE ISLAND OF PINK POKÉMON  (a door, then a Pseudo Stage of five nodes; needs water; step 11, optional, instead of the
// battle; A6; once a run). A real population: pink because of the island's fruit. What you notice on nodes 1 to 3 answers the
// Slowking's three questions. Nothing on nodes 1 to 3 has to be fought; fighting there makes the islanders keep their distance.
// =====================================================================================================================
const PINK_TINT = '#e48fb4';
const pinkOpts = (o: Json = {}): Json => ({ tint: PINK_TINT, tags: ['Pokémon', 'Exploration', 'Mystery'], effect: 'none', ...o });
const isle5 = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, pinkOpts(o), intro, choices);
/** A thing you noticed: counted, and remembered for the quiz. */
const notice = (key: string, text: string, back: string): Json => chIf([not(key)], NOTICE_LABEL[key]!, out(text, flag(key), flag('pink-noticed'), scene(back)));
const NOTICE_LABEL: Record<string, string> = {
  'pink-saw-sand': 'Look at the sand.',
  'pink-saw-fruit': 'Offer an Oran Berry.',
  'pink-saw-young': 'Watch the young ones.',
  'pink-saw-stones': 'Follow the stream to the sea.',
};
/** A fight with islanders (A+0). Fighting on nodes 1 to 3 makes them keep their distance. */
const islanders = (species: string[], next: string): Json => fight('They don\'t understand at first. Then they do.',
  inside({ ...wild({ species, lv: 0, win: [{ kind: 'addEvent', eventId: next }] }), exact: true, lose: [{ kind: 'addEvent', eventId: next }] }), setTo('pink-battled', 1));
/** Calm around wild things: kept Quiet in Safari Land, or passed the canopy village's test (gn.20). */
const PINK_CALM: Json[] = [gn('check', { key: 'pink-calm', if: [is('safari-quiet', 7)] }), when('jungle-village', { min: 1 }, [setTo('pink-calm', 1)])];
const KEEP_AWAY = { id: 'away', when: [is('pink-battled')], notice: '*The islanders watch you from further off now. Nobody comes to sniff the bag.*' };
const RIDER = { id: 'rider', when: [is('pink-calm'), not('pink-battled')], notice: '*A small pink Paras has climbed into your hood. It rides there, quite happy, eating.*' };
/** The Slowking's quiz: one room per question; a right answer counts. */
const question = (n: number, q: string, right: string, wrong: [string, string], next: Json): Json =>
  isle5(`gn-30-q${n}`, 'Island of Pink Pokémon: The Hilltop', { pokemon: 'slowking' }, `**The Slowking:** "${q}"`, [
    ch(right, out('It writes something on its shell, slowly.', flag('pink-quiz'), next)),
    ch(wrong[0], out('It writes something on its shell, slowly, and then crosses it out.', next)),
    ch(wrong[1], out('It looks at you for some time. Then it writes something down.', next)),
  ]);
const PINK_DONE: Json[] = [flag('pink-done'), stampRegion('pink-at'), stampRegion('pink-shade-at'), leavePseudo()];
const hasPink: Json = { kind: 'gn', test: 'hasPink', key: 'pink' };
/** A region of mainland food with no fruit: a shade paler. */
const FADES: Json[] = [gn('pinkFade'), flag('pink-shade'), stampRegion('pink-shade-at')];
const PINK_ISLANDERS = ['rhyhorn', 'nidoran-f', 'nidoran-m', 'paras', 'mareep', 'slowpoke', 'exeggcute'];

const gn30: Json[] = [
  gev('gn-30-door', 'The Island of Pink Pokémon', pinkOpts({ stop: 'event', rarity: 'rare', types: ['water'], pokemon: 'rhyhorn', requires: [not('pink-done'), not('pink-entered')] }), say(
    'Out past the point, an island. From here, the whole of it looks faintly pink.',
    'A fisherman mending nets shrugs. "The fruit," he says, as if that explained it. "I\'ll row you, if you like."',
  ), [
    ch('Row across.', out('The water goes clear, then pale, then pink over the sand.', flag('pink-entered'), ...PINK_CALM, { kind: 'addEvent', eventId: 'gn-30-landing' })),
    ch('Walk on.', out('You walk on. The island stays pink on the horizon all afternoon.')),
  ]),
  // ---- Node 1. The Landing ----
  isle5('gn-30-landing', 'Island of Pink Pokémon: The Landing', { pokemon: 'rhyhorn' }, say(
    'A beach of pale pink sand. A pink Rhyhorn watches the boat come in.',
    'It decides you aren\'t food, and goes back to eating.',
  ), [
    notice('pink-saw-sand', 'You crouch. The sand\'s pink too, all the way down. It isn\'t just the animals.', 'gn-30-landing'),
    ch('Walk up the beach.', out('The Rhyhorn doesn\'t look up.', { kind: 'addEvent', eventId: 'gn-30-orchard' })),
    ch('Battle the Rhyhorn.', islanders(['rhyhorn'], 'gn-30-orchard')),
  ]),
  // ---- Node 2. The Orchard ----
  isle5('gn-30-orchard', 'Island of Pink Pokémon: The Orchard', { pokemon: 'nidoran-f', remembers: [KEEP_AWAY, RIDER] }, say(
    'Low trees with round pink fruit. Underneath, a Rhyhorn, two Nidoran, a Paras and a Mareep, all pink, eating together.',
    'They\'ve never seen a trainer. They walk right up and sniff your bag.',
  ), [
    notice('pink-saw-fruit', 'A pink Nidoran sniffs your Oran Berry, and turns its nose up. They only eat the fruit.', 'gn-30-orchard'),
    ch('Walk on.', out('They follow you to the edge of the trees, and stop there.', { kind: 'addEvent', eventId: 'gn-30-stream' })),
    ch('Battle them.', islanders(['nidoran-f', 'paras', 'mareep'], 'gn-30-stream')),
  ]),
  // ---- Node 3. The Stream ----
  isle5('gn-30-stream', 'Island of Pink Pokémon: The Stream', { pokemon: 'rhyhorn', remembers: [KEEP_AWAY, RIDER] }, say(
    'Clear water over pink stones. Pink Pokémon drink upstream.',
    'Downstream, at the mouth, a few Pokémon of ordinary colours.',
  ), [
    notice('pink-saw-young', 'A grey-pink Rhyhorn calf, still drinking milk. The young ones are paler.', 'gn-30-stream'),
    notice('pink-saw-stones', 'The stones get smaller toward the sea, until they\'re sand. Pink sand.', 'gn-30-stream'),
    ch('Walk on.', out('The path climbs into big, old trees.', { kind: 'addEvent', eventId: 'gn-30-grove' })),
    ch('Battle them.', islanders(['rhyhorn', 'slowpoke'], 'gn-30-grove')),
  ]),
  // ---- Node 4. The Old Grove ----
  isle5('gn-30-grove', 'Island of Pink Pokémon: The Old Grove', { pokemon: 'kangaskhan', effect: 'shake' }, say(
    'Huge trees, the oldest on the island. Three pink Nidoking and a pink Kangaskhan stand across the path.',
    '*They don\'t charge. They stand. The Kangaskhan\'s young one looks out of the pouch, holding a fruit in both hands.*',
  ), [
    ch('Battle through.', fight('The Nidoking come first, one after another.', inside({ ...wild({ species: ['nidoking'], lv: 1, win: [scene('gn-30-grove-2')] }), exact: true, chain: 3, lose: [{ kind: 'addEvent', eventId: 'gn-30-high' }] }), setTo('pink-grove', 1))),
    ch('Put down my own food, and step back.', out(say(
      'They sniff it. They don\'t want it. But the offer\'s understood.',
      'The Kangaskhan steps aside. Its young one leans out of the pouch and holds out a fruit. Then two more.',
    ), setTo('pink-grove', 2), setTo('pink-fruit', 3), moment('A pink Kangaskhan\'s young one gave you three fruit.', 70), { kind: 'addEvent', eventId: 'gn-30-high' })),
    ch('Go round.', out('Along the cliffs. It takes the rest of the day.', setTo('pink-grove', 3), takeNode(1), { kind: 'addEvent', eventId: 'gn-30-high' })),
  ]),
  isle5('gn-30-grove-2', 'Island of Pink Pokémon: The Old Grove', { pokemon: 'kangaskhan', effect: 'shake' }, say(
    'The last Nidoking backs off. The Kangaskhan puts its young one down behind a root, and comes forward.',
  ), [
    ch('Battle.', fight('It fights the way mothers fight.', inside({ ...wild({ species: ['kangaskhan'], lv: 1, win: [{ kind: 'addEvent', eventId: 'gn-30-high' }] }), exact: true, lose: [{ kind: 'addEvent', eventId: 'gn-30-high' }] }))),
  ]),
  // ---- Node 5. The Hilltop ----
  isle5('gn-30-high', 'Island of Pink Pokémon: The Hilltop', {
    pokemon: 'slowking',
    remembers: [{ id: 'trampled', when: [is('pink-battled')], notice: '**The Slowking:** "You have *trampled* across my study."' }],
  }, say(
    '*A flat rock. A pink Slowking, writing on a shell with a stick dipped in fruit juice. It looks up, some time after you arrive.*',
    '**The Slowking, slowly, and very well:** "A visitor. You have walked across my study. I have three questions. They are things you could have seen."',
    '"Then, if you like, we shall fight. I am told that is customary."',
  ), [ch('Answer its questions.', out('It turns to a clean part of the shell.', setTo('pink-quiz', 0), scene('gn-30-q1')))]),
  question(1, 'Why are they pink?', 'The fruit.', ['The water.', 'They\'re born that way.'], scene('gn-30-q2')),
  question(2, 'Why is the sand pink?', 'The fruit\'s stones, ground down.', ['Coral.', 'The sunsets.'], scene('gn-30-q3')),
  question(3, 'Are the young ones pink?', 'Not yet. It takes time.', ['Yes, from the egg.', 'Only the old ones.'], scene('gn-30-after')),
  isle5('gn-30-after', 'Island of Pink Pokémon: The Hilltop', {
    pokemon: 'slowking',
    remembers: [
      { id: 'three', when: [is('pink-quiz', 3)], notice: '**The Slowking:** "You looked. So few look. They arrive, and they say \'how odd,\' and they leave. Sit. I shall tell you what I think it is *for.*" *It has eleven theories. It tells you four of them before it loses its thread.*' },
      { id: 'some', when: [is('pink-quiz', 0, 2)], notice: '**The Slowking:** "Hm. You saw some of it." *It underlines something twice.*' },
    ],
  }, say('A pink Slowbro and a pink Exeggutor wander up the hill and stand beside it.'), [
    ch('Fight, as is customary.', fight('**The Slowking:** "For the exercise, then."', { ...trainer('The Pink Slowking', { team: ['slowking', 'slowbro', 'exeggutor'], lv: 1, win: [scene('gn-30-gift')] }), pseudo: true, rule: { gn: 'slowking' }, lose: [scene('gn-30-gift')] })),
    ch('Decline, politely.', out('**The Slowking:** "Very sensible." It goes back to its shell.', scene('gn-30-gift'))),
  ]),
  isle5('gn-30-gift', 'Island of Pink Pokémon: Leaving', { pokemon: 'mareep' }, say(
    'The boat is where you left it. The islanders have come down to the beach to watch you go.',
  ), [
    ch('A pink islander comes with you.', out('One of them walks down the sand and gets into the boat, and that is that.', { ...join({ species: PINK_ISLANDERS }), marks: ['pink from the island fruit'] }, setTo('pink-reward', 1), ...PINK_DONE)),
    ch('Let one of yours try the fruit.', out('It eats the fruit for a day. By evening it\'s a very pale pink, and very pleased with itself.', gn('markPink'), setTo('pink-reward', 2), ...PINK_DONE), { pick: {} }),
  ]),
  // ---- Afterstory: mainland food. A shade paler at each region's end, unless you kept some fruit. ----
  gev('gn-30-fade', 'The Colour', pinkOpts({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, pokemon: 'mareep', requires: [is('pink-done'), hasPink, regionChanged('pink-shade-at')] }), say(
    'A whole region of mainland food. Your pink one has been looking at its own feet a good deal lately.',
    '*The colour is going. Not fast. But it is going.*',
  ), [
    chIf([is('pink-fruit')], 'Give it a Pink Fruit.', out(say(
      'It eats the fruit in three bites, and sits with the stone in its mouth for a while, like a sweet.',
      'The colour holds. One more region.',
    ), flag('pink-fruit', -1), stampRegion('pink-shade-at'),
      gn('check', { key: 'pink-last', if: [not('pink-fruit')] }), when('pink-last', { min: 1 }, [scene('gn-30-stone')]))),
    chIf([is('pink-fruit')], 'Keep the fruit for later.', out('You keep the fruit in the bag. It is a shade paler than it was. It doesn\'t seem to mind.', ...FADES)),
    chIf([not('pink-fruit')], 'There is no fruit.', out('There is nothing to give it but what the mainland grows. It is a shade paler than it was. It doesn\'t seem to mind.', ...FADES)),
  ]),
  isle5('gn-30-stone', 'The Colour: The Last Stone', { pokemon: 'mareep' }, say(
    'That was the last of the fruit. What is left is its stone, the size of a thumbnail, pink all the way through.',
    '*Plant the stone?*',
  ), [
    ch('Plant it.', out(say(
      'You press it into the soft ground at the edge of the camp, and pour a little water over it.',
      'One day, a small pink tree. You won\'t pass this way again to see it. Somebody will.',
    ), flag('pink-stone-planted'), moment('Planted the last Pink Fruit\'s stone by a camp, for whoever comes next.', 70))),
    ch('Keep it.', out('You put it in your pocket. It weighs nothing at all.', flag('pink-stone-kept'))),
  ]),
];


export const EVENTS: Json[] = [...gn26, ...gn27, ...gn28, ...gn29, ...gn30];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-26-door': {
    gn: 'gn.26', shape: 'Door', earliest: 'A7', home: 15, window: [13, 18], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['water'],
    level: 'Giants A+1; the guardian A+2', often: 'run', badge: 'own', dressing: { kanto: 'Off Vermilion: the Island of Giants', elsewhere: 'The Island of Giant Pokémon' },
    note: 'Badge: a very large footprint. Six nodes. Kanto has no older Island of Giants space to replace.',
  },
  'gn-28-door': {
    gn: 'gn.28', shape: 'Door', earliest: 'A6', home: 14, window: [12, 17], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Evil Team'],
    level: 'Grunts A+0; the Executive A+2', often: 'run', badge: 'own', dressing: { kanto: 'Under the Celadon Game Corner: the Rocket Hideout', elsewhere: 'The {team} Hideout' },
    note: 'Badge: a red R (a "?" until the team is known). Four floors: Offices, Labs, Holding, the Vault. The Hideout of the evil-team story (step 7), written out as a stage of its own.',
  },
  'gn-29-town': {
    gn: 'gn.29', shape: 'Single', earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', attaches: 'instead', tags: ['Miniature Episode', 'Snake minigame'], level: 'No battle', often: 'region', badge: 'own',
    note: 'Badge: a small duck. At the town; until towns exist, step 5. Snake in three rounds (core/greenneedle/snake.ts).',
  },
  'gn-30-door': {
    gn: 'gn.30', shape: 'Door', earliest: 'A6', home: 11, window: [9, 14], sits: 'side-branch', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['water'],
    level: 'A+0; the grove\'s guards A+1; the Slowking A+1', often: 'run', badge: 'own', dressing: { kanto: 'Off the coast: the Island of Pink Pokémon', elsewhere: 'The Island of Pink Pokémon' },
    note: 'Badge: a pink dot. Five nodes. A side branch from step 11.',
  },
  'gn-27-gate': {
    gn: 'gn.27', shape: 'Single', earliest: 'A4', home: 10, window: [8, 13], sits: 'optional', attaches: 'town', tags: ['Hub Destination'], level: 'The arena and the owner A+0', often: 'region', badge: 'own',
    note: 'Badge: a striped tent. At a Town or Hub node; until towns exist, step 10. Returns in later regions with new acts (the trapeze and fire-eater, then the water show and the evolved ace).',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_hideout', name: 'The Hideout', entry: 'gn-28-door', themeId: 'dark-steel', tint: HIDE_TINT, mood: 'evil team hideout', start: 'opened' },
  { id: 'ps_gn_pink', name: 'The Island of Pink Pokémon', entry: 'gn-30-door', themeId: 'water-grass', tint: PINK_TINT, mood: 'pink island', start: 'opened' },
  { id: 'ps_gn_giants', name: 'The Island of Giant Pokémon', entry: 'gn-26-door', themeId: 'water-grass', tint: GIANT_TINT, mood: 'giant island', start: 'opened' },
];
