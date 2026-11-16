// Catalog Overhaul Pack, category "places": STORY_FAMILIES_17.md SF113 Safari Land, SF114 The Battle Frontier, SF115 The League
// Exhibition, SF116 The Lost Island and the Sunken City. These are the Beta 0.7 pseudo-stages (src/data/pseudoStages.json): the
// record draws the map, each node opens its room event (rebuilt here), and the exit room's first choice walks back out.
// Rule P2 keeps every gate's two buttons exactly "Enter <name>" / "Leave"; the pack's third gate button ("Scout the bracket.",
// "Watch first.", "Read the faces.") is a Remembers variant that adds it until it has been used.
import { BERRIES, RARE_HELD, $, any, ch, ev, flag, flagIs, fr, heal, hurt, item, join, money, out, rp, type Json } from '../dsl.ts';
import { kind, leaveP, moment, no, rep, variant } from './_delve.ts';

export const CATEGORY = 'places';

const enterP = (id: string): Json => ({ kind: 'enterPseudo', id });
const again = (id: string): Json => ({ kind: 'addEvent', eventId: id });
const stay = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, again(id));
const pwild = (text: string, species: string[], lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'wild', pseudo: true, species, types: [], levelBonus: lv, shinyMultiplier: 1, win } });
const ptrainer = (text: string, name: string, o: { cls: string; size: number; lv: number; types?: string[]; format?: 'doubles'; win?: Json[] }, ...fx: Json[]): Json =>
  ({ text, effects: fx, battle: { kind: 'trainer', pseudo: true, name, classId: o.cls, size: o.size, types: o.types ?? [], levelBonus: o.lv, ...(o.format ? { format: o.format } : {}), win: o.win ?? [] } });
const steps = (n: number): Json => flag('safari-steps', -n);
const hasSteps = (n: number): Json => flagIs('safari-steps', n);

// ---------- SF113 Safari Land ----------
const SAFARI: Json[] = [
  {
    id: 'safari-zone',
    intro: 'A long fence of split rails, and behind it grass up to a person\'s shoulder, moving in a wind you can\'t feel. A warden in a wide hat stands at the gate with a ledger. Mrs. Okoye, the warden: "Rare Pokémon inside. Five hundred to enter. No battles in there, not one. Mind your steps: you get thirty, and every one counts."',
    choices: [
      ch('Enter (500).', out('She takes the money and writes your name in the ledger in neat round letters. "Thirty steps. Bait makes them linger; rocks make them easier to catch, and quicker to bolt. I show you the odds. I always show the odds."', $(-500), again('ps-safari-zone-gate')), { requires: [money(500)] }),
      ch('Ask about the rules.', stay('safari-zone', '"No battles: we don\'t hurt them here. Thirty steps; bait costs you five, creeping up slow costs ten. Throw bait and they stay longer. Throw a rock and they\'re easier, but they\'re more likely to run. Every throw, I tell you the odds first. Fair?" It is.')),
      ch('Not today.', out('You thank her and walk on along the fence. Something enormous moves in the grass on the other side, keeping pace with you a while.')),
    ],
  },
  {
    id: 'ev-safari-ticket',
    intro: 'A warden at the fence holds up a stiff paper ticket and waves you over. "Somebody left a day pass at the gate. Take it." Behind you a small girl is pressed against the rails, staring at the grass the way you stare at a shop window.',
    choices: [
      ch('Take it.', out('"Free entry, then. Thirty steps, same as everyone." She tears the stub and lets you through.', again('ps-safari-zone-gate'))),
      ch('Give it to the kid behind me.', out('The girl looks at the ticket, then at you, then runs in before anyone can change their mind. Half an hour later she comes back out with a Nidoran♀ in her arms and her whole face shining, and she shows you, and shows you again.', ...kind(), moment('You gave your Safari pass to a little girl, and she caught her first Pokémon.', 55))),
    ],
  },
  {
    id: 'ps-safari-zone-gate',
    intro: 'The gate swings shut behind you. Grass, and sky, and the smell of warm earth. Mrs. Okoye calls through the rails: "Thirty steps. No battles. I\'ll be at the far gate."',
    choices: [
      { ...ch('Enter Safari Zone', out('You step into the grass. You count your first step without meaning to.', flag('safari-steps', -99), flag('safari-steps', 30), enterP('ps_safari_zone'))),
        branches: [{ when: [flagIs('safari-bonus')], text: 'You step into the grass. "Five extra steps," Mrs. Okoye calls, "for the one you let go last time."', effects: [flag('safari-steps', -99), flag('safari-steps', 35), enterP('ps_safari_zone')] }] },
      ch('Leave', out('You turn back at the gate. Mrs. Okoye nods: some days are for looking.')),
    ],
  },
  {
    id: 'ps-safari-zone-a',
    intro: 'The Grassland. Something stirs in the tall grass: a herd of Doduo racing in circles, heads bobbing, all three of each head talking at once.',
    choices: [
      ch('Throw bait. (5 steps)', stay('ps-safari-zone-a', 'You toss the bait wide. The herd slows, and circles it, and starts to peck. They are not going anywhere now.', steps(5), flag('safari-bait-a')), { requires: [hasSteps(5)] }),
      ch('Throw a Ball.', out('The Ball wobbles once, twice, three times. Click. A Doduo, all three heads indignant.', join({ species: ['doduo'] })), { chance: 0.3, fail: out('The Doduo bursts out and the whole herd scatters, shrieking, in nine directions at once.') }),
      ch('Walk on.', out('You let the herd race on and walk deeper in.')),
    ],
    remembers: [variant('baited', [flagIs('safari-bait-a')], { notice: 'The herd is busy at the bait, slow and careless.', hide: [0, 1], add: [ch('Throw a Ball at the feeding herd.', out('They barely look up. The Ball clicks shut on a Doduo with its mouth still full.', join({ species: ['doduo'] }), flag('safari-bait-a', -1)), { chance: 0.55, fail: out('It pops out, still chewing, and trots off after the others.', flag('safari-bait-a', -1)) })] })],
  },
  {
    id: 'ps-safari-zone-b',
    intro: 'The Rare Cry. An unusual cry from beyond a hedge of reeds: high and sweet, nothing like the herds. Through the reeds you can see it: a Chansey, or a Dratini in a pond, or a Tauros standing alone, depending on where the wind is.',
    choices: [
      ch('Approach slowly. (10 steps)', stay('ps-safari-zone-b', 'You creep forward a step at a time, ten steps that take an age. It hears you, and looks, and does not run. You are close now.', steps(10), flag('safari-slow-b')), { requires: [hasSteps(10)] }),
      ch('Throw a rock.', out('The rock lands short, and it flinches, and in that instant your Ball is already in the air. It holds. It is yours.', join({ species: ['chansey', 'dratini', 'tauros'] }), moment('You caught something rare in the Safari Zone.', 60)), { chance: 0.4, fail: out('It startles at the rock and is gone, a cry fading into the grass. You stand there with the Ball in your hand.') }),
      ch('Leave it.', out('You leave it to its reeds. Some things you are glad just to have seen.')),
    ],
    remembers: [variant('slow', [flagIs('safari-slow-b')], { notice: 'It is watching you, close enough to touch.', hide: [0], add: [ch('Throw a Ball, gently.', out('You roll the Ball the last little way. It sniffs it, and lets it take it. A rare catch, and a gentle one.', join({ species: ['chansey', 'dratini', 'tauros'] }), flag('safari-slow-b', -1), moment('You caught something rare in the Safari Zone, gently.', 60)), { chance: 0.5, fail: out('At the last moment it bolts. Close. So close.', flag('safari-slow-b', -1)) })] })],
  },
  {
    id: 'ps-safari-zone-c',
    intro: 'The Wild Patch. Something stirs: a Kangaskhan with a baby in her pouch, watching you over the top of a thornbush. The baby peeks out, and ducks, and peeks out again.',
    choices: [
      ch('Stay back.', out('You stay where you are and keep your hands down. The mother watches. Then the baby climbs half out of the pouch and waves at you with its whole arm. Your team waves back.', fr(3))),
      ch('Throw bait. (5 steps)', stay('ps-safari-zone-c', 'You lay the bait down and back away. The mother comes for it, slowly, and lets you stay near while she eats.', steps(5), flag('safari-bait-c')), { requires: [hasSteps(5)] }),
      ch('Throw a Ball.', out('Somehow it holds. You open your eyes. The mother looks at the Ball, and at you, and does not seem to mind at all.', join({ species: ['kangaskhan'] })), { chance: 0.08, fail: out('She bats the Ball back to you, quite gently. The baby laughs.') }),
    ],
    remembers: [variant('baited', [flagIs('safari-bait-c')], { notice: 'She lets you near while she eats.', hide: [1, 2], add: [ch('Throw a Ball, up close.', out('So close you could touch her. The Ball clicks. She doesn\'t seem to mind; the baby, inside with her, waves through the glass.', join({ species: ['kangaskhan'] }), flag('safari-bait-c', -1)), { chance: 0.2, fail: out('She shrugs the Ball off and goes back to eating. No hard feelings.', flag('safari-bait-c', -1)) })] })],
  },
  {
    id: 'ps-safari-zone-d',
    intro: 'The Exit. Daylight over the far gate. Mrs. Okoye is waiting with her ledger open. "Steps all used? Show me what you found."',
    choices: [
      ch('Show her.', out('She looks at each one properly, writes it in her ledger, and nods. "Well caught. Well treated." She hands you a few Balls for the road.', leaveP, item('ultra-ball', 3), rp(2), flag('safari-steps', -99))),
      ch('Release one back in.', out('You open a Ball at the gate and let the one you caught last go back into the grass. It looks back once. Mrs. Okoye smiles, a slow wide smile. "Next time, five more steps. On me."', leaveP, { kind: 'sendAway', key: 'safari-released', who: 'newest' }, flag('safari-bonus'), flag('safari-steps', -99), ...kind()), { requires: [{ kind: 'partySize', atLeast: 2 }] }),
    ],
  },
];

// ---------- SF114 The Battle Frontier ----------
// "Go again." starts the bracket over at round 1, every opponent a level higher (a Remembers variant on each round).
const FRONT_AGAIN = flagIs('frontier-again');
const round = (id: string, intro: string, mk: (lv: number) => Json[], extra = 0): Json => ({
  id,
  intro,
  choices: mk(extra),
  remembers: [variant('again', [FRONT_AGAIN], { notice: 'Second time through: they have heard about you, and they have trained.', hide: [0], add: [mk(extra + 1)[0]!] })],
});
const FRONTIER: Json[] = [
  {
    id: 'ps-battle-frontier-gate',
    intro: 'A building like a cathedral, all glass and white stone, with the sound of a crowd somewhere inside. A clerk in a pressed jacket checks your name off a list. Mr. Diallo, the Frontier clerk: "Four rounds, one arena. Win four or lose one. Your Pokémon are healed between rounds. No items in battle. No mercy, no shame."',
    choices: [
      ch('Enter Battle Frontier', out('He opens the arena doors. The noise of the crowd hits you like weather.', enterP('ps_battle_frontier'))),
      ch('Leave', out('"No shame," says Mr. Diallo, and means it.')),
    ],
    remembers: [variant('scout', [no('frontier-scouted')], { add: [ch('Scout the bracket.', stay('ps-battle-frontier-gate', 'Mr. Diallo turns the list round so you can read it. Round one leads with a Fighting-type. Round two, a veteran\'s old Normal-type. Round three, twins, two at once. Round four: the Brain, and next to her name, only a question mark.', flag('frontier-scouted')))] })],
  },
  round('ps-battle-frontier-a', 'Round 1. Your first opponent bounces on her toes at the far end of the arena. Ace Trainer Corinne: "First round\'s always nerves. Mine, not yours."', (lv) => [
    ch('Battle.', ptrainer('"Okay. Okay okay okay. Let\'s go."', 'Ace Trainer Corinne', { cls: 'ace-trainer', size: 3, lv: 3 + lv, win: [heal(1)] })),
  ]),
  round('ps-battle-frontier-b', 'Round 2. An old man in a frayed cap, his Pokémon as grey at the muzzle as he is. Veteran Hask: "I\'ve lost here forty times. This is forty-one, or my first win."', (lv) => [
    ch('Battle.', ptrainer('He nods, and sets his feet.', 'Veteran Hask', { cls: 'veteran', size: 3, lv: 4 + lv, win: [heal(1)] })),
    ch('"Good luck."', ptrainer('He laughs, surprised into it. "You too. Mean it."', 'Veteran Hask', { cls: 'veteran', size: 3, lv: 4 + lv, win: [heal(1), flag('frontier-hask-hand'), moment('Veteran Hask lost his forty-first Frontier battle to you, and shook your hand.', 50)] })),
  ]),
  round('ps-battle-frontier-c', 'Round 3. Two girls in matching scarves, finishing each other\'s sentences. The Twins, Sib and Sab: "Doubles!" "DOUBLES!"', (lv) => [
    ch('Battle.', ptrainer('They point at you at exactly the same moment.', 'Twins Sib and Sab', { cls: 'ace-trainer', size: 4, lv: 5 + lv, format: 'doubles', win: [heal(1)] })),
  ]),
  round('ps-battle-frontier-d', 'Round 4, the Brain. A tall woman in white comes down the arena steps without hurrying, and the crowd goes completely silent. Frontier Brain, Lady Imara: "Three rounds is good. Four is the Frontier."', (lv) => [
    ch('Battle.', ptrainer('She raises one hand. Behind her, the board lights up: ROUND 4.', 'Frontier Brain Imara', { cls: 'ace-trainer', size: 4, lv: 6 + lv, win: [$(800)] })),
    ch('"Ask for her best."', ptrainer('A smile, the first. "Then you\'ll have it." Her team comes out two levels stronger than it should be. The prize doubles on the board.', 'Frontier Brain Imara', { cls: 'ace-trainer', size: 4, lv: 8 + lv, win: [$(1600), moment('You asked the Frontier Brain for her best, and beat it.', 75)] })),
  ]),
  {
    id: 'ps-battle-frontier-e',
    intro: 'Daylight, through the arena\'s high doors. The crowd is still on its feet. Mr. Diallo meets you at the exit with something small and bright on a ribbon. "Symbol\'s yours."',
    choices: [
      ch('Take it.', out('The Frontier Symbol is heavier than it looks. Mr. Diallo shakes your hand. "Four rounds. Not many do." Under the Symbol he has tucked a Choice Band, as is Frontier custom.', leaveP, item('choice-band'), flag('frontier-symbol'), flag('frontier-again', -99), moment('You won the Battle Frontier\'s Symbol.', 75))),
      ch('Go again.', out('"Again?" Mr. Diallo looks at you over his glasses, and then laughs. "From round one. They\'ll all be a level sharper." He opens the arena doors again.', leaveP, flag('frontier-symbol'), flag('frontier-again'), again('ps-battle-frontier-gate'))),
    ],
  },
];

// ---------- SF115 The League Exhibition ----------
// Its old opener (the Champion's Invitation) now opens the Hall of Past Champions, so the Exhibition has its own poster on the road.
const EXHIBITION: Json[] = [
  { ...ev('league-exhibition-poster', 'An Exhibition Poster', 'Pseudo Stages', { stop: 'event', rarity: 'rare', types: [], minStage: 5, tint: '#3a2a5a' },
    'A poster on a lamppost, half torn: "LEAGUE EXHIBITION. TONIGHT. ALL CHALLENGERS WELCOME. NOTHING TO LOSE." Somebody has drawn a little crown on it in pen.',
    [
      ch('Go to the hall.', out('You follow the arrows on the posters, lamppost after lamppost, to a hall lit up like a festival.', again('ps-league-exhibition-gate'))),
      ch('Walk on.', out('You leave the poster flapping in the wind.')),
    ]), pseudo: true },
  {
    id: 'ps-league-exhibition-gate',
    intro: 'A hushed hall, its seats full, every face turned to the floor. An usher in white gloves leans down to you. Usher: "Exhibition. Two matches. Nothing to lose, no badge to win. Everyone\'s watching."',
    choices: [
      ch('Enter League Exhibition', out('The usher lifts the rope for you. The quiet in the hall is the loudest thing you have ever walked into.', enterP('ps_league_exhibition'))),
      ch('Leave', out('You slip back out into the night. Inside, the crowd sighs, and settles to wait for someone else.')),
    ],
    remembers: [variant('watch', [no('exhibition-watched')], { add: [ch('Watch first.', stay('ps-league-exhibition-gate', 'You stand at the back and watch one match through. The Elite on the floor tonight leads with the same Pokémon every time, and every time, they win with it. You note what it is.', flag('exhibition-watched')))] })],
  },
  {
    id: 'ps-league-exhibition-a',
    intro: 'Match 1. One of the region\'s Elite Four, off duty, in a cardigan instead of their League colours. "Show me how you\'d beat me," they say. "I won\'t hold it against you. Honestly."',
    choices: [ch('Battle.', ptrainer('They smile and send out their lead, the one you saw, or would have.', 'Elite Four Member', { cls: 'veteran', size: 4, lv: 5, win: [heal(0.5)] }))],
  },
  {
    id: 'ps-league-exhibition-b',
    intro: 'Match 2, the Boss. A young man in a Champion\'s coat that does not quite fit him. "The Champion\'s busy," says Ferran, the understudy. "I\'m what you get. I\'m good."',
    choices: [
      ch('Battle.', ptrainer('He squares his shoulders inside the borrowed coat.', 'Understudy Ferran', { cls: 'veteran', size: 4, lv: 6, win: [$(600)] })),
      ch('Ask why he\'s the understudy.', stay('ps-league-exhibition-b', '"I lost the final," he says. "Twice. Same Champion, both times." He shrugs, and the coat slips. "I\'m still here. That counts for something, doesn\'t it?" It does.', flag('exhibition-ferran-asked'))),
    ],
  },
  {
    id: 'ps-league-exhibition-c',
    intro: 'Daylight, or the hall\'s bright doors. The crowd is on its feet for you, the whole hall of them, clapping, someone whistling through their fingers.',
    choices: [
      ch('Wave to the crowd.', out('You wave, a little awkwardly, and the noise doubles. A child in the front row waves back with both arms. People will remember the challenger who stopped to wave.', leaveP, rep(1), item('max-potion', 2))),
      ch('Slip out.', out('You duck out the side door while they are still clapping. Outside the night is cool and quiet. Ferran is out there too, by himself, and gives you a nod.', leaveP, item('max-potion', 2))),
    ],
  },
];

// ---------- SF116 The Lost Island and the Sunken City ----------
const LOST: Json[] = [
  {
    id: 'ev-lost-civilization',
    intro: 'Your ruin rubbings line up, at last, with a coast no map shows. At the end of the jetty a boat waits, as if it has been waiting a long time. In it sits a boatman, silent and old, his hands folded on the oars.',
    choices: [
      ch('Get in.', out('He rows without a word. The coast drops behind you, and then there is only sea, and then, out of the mist, an island with faces carved into its cliffs.', flag('lost-island-rubbings'), again('ps-lost-island-gate'))),
      ch('Ask how long he\'s waited.', stay('ev-lost-civilization', 'He holds up ten fingers. Then ten again. Then he puts his hands back on the oars, and looks at you, and waits a little longer.')),
      ch('Not yet.', out('You leave him at the jetty. He does not seem to mind. He has had practice.')),
    ],
  },
  {
    id: 'ps-lost-island-gate',
    intro: 'Vines over stone faces, hundreds of them, eyes closed. A stair cut into the cliff. Pots still on a step where someone set them down, a thousand years ago, and never came back for them. A civilization that left in a hurry.',
    choices: [
      ch('Enter Lost Island', out('You climb the stair between the sleeping faces.', enterP('ps_lost_island'))),
      ch('Leave', out('You go back down to the boat. The boatman rows you home without a word, as if this too is something he has seen many times.')),
    ],
    remembers: [variant('faces', [no('lost-island-faces')], { add: [ch('Read the faces.', stay('ps-lost-island-gate', 'You trace them with your fingers. They are not gods. They are people: a city of them, carved in the hour it sank. This island was its lookout. They are still looking out to sea, waiting for it to come back up.', flag('lost-island-faces'), rp(2)))] })],
  },
  {
    id: 'ps-lost-island-a',
    intro: 'The Ruins. Something stirs among the statues: a Bronzor, drifting from face to face, turning slowly, ringing very softly whenever it touches stone.',
    choices: [
      ch('Battle.', pwild('It rings once, sharply, and turns its face to you.', ['bronzor'], 3, [])),
      ch('Follow it.', out('You follow the Bronzor at a distance. It drifts along a path you would never have found, round the edge of a courtyard where the tiles are loose and the ground beneath them is hollow. It knows this place.', flag('lost-island-followed'))),
    ],
  },
  {
    id: 'ps-lost-island-b',
    intro: 'The Watcher. Someone is waiting at the top of the stair, arms folded, sunburnt and very serious. Island scholar Tavita: "Nobody comes here. Nobody has for twenty years. Prove you\'re careful."',
    choices: [
      ch('Battle.', ptrainer('"Careful," she says, "means you don\'t mind losing."', 'Scholar Tavita', { cls: 'veteran', size: 3, lv: 4 })),
      ch('Show my rubbings.', out('She takes the rubbings, and goes very still, and reads them twice. "You copied these from the mainland stones. You understood them." She hands them back as if they are made of glass. "Come on. I\'ll show you the way. I\'ve been waiting for someone who\'d understand."', flag('tavita-guide'), rp(3)), { requires: [flagIs('lost-island-rubbings')] }),
    ],
  },
  {
    id: 'ps-lost-island-c',
    intro: 'A Sealed Chamber. A door of black stone, its lock cold and old: a hole in the shape of a bell, and around it, carvings of the sea rising.',
    choices: [
      ch('Use the bell.', out('The bell from the Sunken City fits the lock exactly. You ring it once. The sound goes down into the island and comes back up from very far below, and the door swings in. Inside, on a plinth, a sea-green treasure, and a carving of a great shape asleep under the waves.', any(...RARE_HELD), flag('lost-island-bell-rung'), flag('sign-kyogre'), moment('You rang the Sunken City\'s bell on the Lost Island, and the sealed door opened.', 70)), { requires: [flagIs('sunken-bell')], chance: 0.5, fail: out('The bell fits the lock exactly. You ring it once, and the door swings in. Inside, on a plinth, a red-gold treasure, and a carving of a great shape asleep under the earth.', any(...RARE_HELD), flag('lost-island-bell-rung'), flag('sign-groudon'), moment('You rang the Sunken City\'s bell on the Lost Island, and the sealed door opened.', 70)) }),
      ch('Force it.', out('You put your shoulder to the door until something gives: not the door. You and your lead are bruised for it. Through a crack you see a glint, out of reach.', hurt(0.1))),
      ch('Leave.', out('You leave the chamber sealed. Whatever is behind it has waited this long.')),
    ],
  },
  {
    id: 'ps-lost-island-d',
    intro: 'A Trap. A floor of loose stone tiles, each carved with a face. Some faces are worn smooth from walking. Some are clean, as if nobody ever dared step on them.',
    choices: [
      ch('Step on the faces.', out('You step only on the worn faces, the way the city did. The floor holds. It was never a trap for the people who lived here: they walked on their own faces for luck.', rp(1))),
      ch('Avoid the faces.', out('You pick your way between them, and the tiles between the faces drop away under you. Everyone gets a scrape climbing out.', hurt(0.1))),
    ],
    remembers: [
      variant('guide', [flagIs('tavita-guide')], { notice: 'Tavita stops you with a hand on your arm. "Faces," she says. "Always the faces."' }),
      variant('followed', [flagIs('lost-island-followed')], { notice: 'Ahead, the Bronzor you followed drifts over the tiles, touching only the worn faces.', add: [ch('Follow the Bronzor across.', out('You step where it hums. The floor never moves. On the far side, the Bronzor rings once, pleased, and drifts away.', fr(2)))] }),
    ],
  },
  {
    id: 'ps-lost-island-g',
    intro: 'The Guardian. The deepest room, a hall open to the sky. In the middle, kneeling, a Golurk as tall as a house: an Alpha, built a thousand years ago to guard the lookout. Its eyes light when you come in. It stands.',
    choices: [
      ch('Calm it.', out('You ring the bell, once, the way the city must have. The Golurk stops. It lowers its great head, and kneels again, and lets you pass. It has been waiting a long time to hear that sound.', flag('calmed-alpha'), flag('lost-island-golurk-calmed'), moment('You calmed the Lost Island\'s Alpha Golurk with the old city\'s bell.', 70)), { requires: [flagIs('lost-island-bell-rung')] }),
      ch('Battle.', pwild('It raises its fists. The hall shakes.', ['golurk'], 6, [$(400)])),
    ],
  },
  {
    id: 'ps-lost-island-h',
    intro: 'The Exit. Daylight, and the sea far below. And under the water, a shimmer: streets, and roofs, and towers, all drowned and all quite clear. The Sunken City, right where the faces have been looking all along.',
    choices: [
      ch('Dive to the ruins.', out('You climb down to the water and slip under.', leaveP, item('max-potion', 2), again('mr-underwater-ruins'))),
      ch('Sail home.', out('The boatman is waiting. He looks at the island for a long time, as you row away, as if saying goodbye to someone.', leaveP, item('max-potion', 2))),
    ],
  },
  {
    id: 'mr-underwater-ruins',
    room: true,
    intro: 'The Underwater Ruins. Pillars under clear green water, a doorway, a staircase going down to nowhere. Something glints on the bottom between two fallen columns.',
    choices: [
      ch('Dive for it.', out('You go down until your ears hurt. It is a crown: a small one, a child\'s, made for some festival that never came again. Beside it, a pearl. You bring both up into the light.', item('relic-crown'), item('pearl'), moment('You found a child\'s crown in the Sunken City.', 55))),
      ch('Leave it.', out('You leave the crown where it is. It belongs to the city. You float a while above the drowned streets, and then you swim back up into the sun.')),
    ],
  },
];

export const EVENTS: Json[] = [...SAFARI, ...FRONTIER, ...EXHIBITION, ...LOST];
export const REMOVE: string[] = [];
