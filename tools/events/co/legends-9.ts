// Catalog Overhaul Pack, legends: Ultra Beast questlines U1 to U9 (QUESTLINES_ULTRA.md). Pack questlines: status `extra`.
// They sit around the Beta 0.7 Ultra Beast Incursions system and read its mirror flags (core/legends/signs.ts): `ultra-on` (the
// setting is on this run: every questline needs it), `ultra-static`, `ultra-beast-<species>`. Entering a home world raises
// `faller-rank` by 1 (this run only). Beast fights are pseudo fights, so losing never ends the run; a Beast Ball catches as usual.
// Cut (Kice, run-memory rule and the Nov 13 cuts): Souvenirs, Shards as pay, the Faller's Log, anything from a past run.
import { $, anyType, at, bondIs, br, ch, ev, fight, flag, flagAgo, flagIs, fr, heal, item, leave, lose, out, room, stat, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { gift } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Ultra Beasts';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 80): Json => ({ kind: 'moment', text, importance });
const not = (key: string): Json => flagIs(key, 0, 0);
const ON = flagIs('ultra-on');
const faller = (): Json => flag('faller-rank');
/** A Beast fight: pseudo (losing puts you back on the map), its Ultra Rule on for both sides, catchable with a ball. */
const beast = (species: string, rule: string, o: { lv?: number; win?: Json[]; lose?: Json[] } = {}): Json => ({
  ...wild({ species: [species], lv: o.lv ?? 3, win: o.win ?? [] }),
  pseudo: true,
  lose: o.lose ?? [],
  rule: { ultra: rule },
});

// ---------------------------------------------------------------- U1. The Task Force (Looker, Anabel): the frame
const mission = (n: 1 | 2 | 3, name: string, text: string, pay: Json[]): Json =>
  ev(`co-u1-mission-${n}`, `The Task Force: ${name}`, G, { callback: true, rarity: 'uncommon', requires: [ON, flagIs('task-force'), flagIs('u1-missions', n - 1, n - 1)], cast: ['boss.Spr_Pt_Looker'], pokemon: 'nihilego', tint: '#606880' },
    `Anabel, at the rest stop, with a folder: "One job this stage, if you want it."\n\n${text}`,
    [
      ch('Take the job.', out('You do it, and report back. Looker writes it down in a notebook held together with tape.', flag('u1-missions'), ...pay)),
      ch('"Not this stage."', out('Anabel: "Next one, then."', flag('u1-missions'))),
    ]);
const u1: Json[] = [
  ev('co-u1-noodles', 'The Task Force', G, {
    rarity: 'rare', requires: [ON, flagIs('ultra-static'), not('task-force'), not('ub-refused-help')], cast: ['boss.Spr_Pt_Looker', 'boss.anabel-gen7'], pokemon: 'nihilego', tint: '#606880',
  },
    'At the rest stop, a man in a raincoat is eating noodles at your table without asking.\n\nLooker: "Don\'t look up. You\'ve been followed by something for a stage. Not a person. The sky went the wrong colour behind you twice. You didn\'t notice. It did."\n\nAnabel, sitting down on his other side: "He means it\'s coming. We run a task force. It\'s two people and one office with a leak." She slides a Beast Ball across the table. "We have one of these. You can have it."',
    [
      ch('"Why me?"', out('Anabel: "Because of how you fight. They\'re drawn to it." She tells you which of your habits it is following: the way you win.', flag('task-force'), flag('ub-appetite-told'), item('beast-ball'))),
      ch('"What\'s coming?"', out('Looker lays out three photographs: three Beasts it could be. He taps one, then another, then shrugs. "One of them is right."', flag('task-force'), item('beast-ball'))),
      ch('"I don\'t need your help."', out('Looker: "No one does. Until." He leaves the Ball on the table anyway.', flag('ub-refused-help'), item('beast-ball'))),
    ]),
  mission(1, 'Observation', 'Watch the next strange patch of sky for one stop, without going near it. Pay: ₽600.', [$(600)]),
  mission(2, 'Gentle Hands', 'If something from somewhere else comes through, drive it off without knocking it out. Pay: a Beast Ball.', [item('beast-ball')]),
  mission(3, 'Samples', 'Bring back anything from the other side. Pay: what they know about what is coming next.', [flag('ub-appetite-told')]),
  ev('co-u1-anabel', 'The Task Force: Anabel', G, {
    callback: true, rarity: 'rare', requires: [ON, flagIs('task-force'), flagIs('u1-missions', 2)], cast: ['boss.anabel-gen7'], pokemon: 'poipole', tint: '#606880',
  },
    'Anabel, alone this time, at the edge of the camp.\n\nAnabel: "I came through one of those. I was eight. I don\'t remember where from. If you go into one, would you look? For anything that looks like a place someone could grow up?"',
    [
      ch('"I\'ll look."', out('Anabel nods, and does not say anything else for a while.', flag('anabel-look'))),
      ch('"I can\'t promise."', out('Anabel: "No. Nobody can." She smiles anyway.', flag('anabel-asked'))),
      ch('"Come with me."', out('Anabel looks at Looker. Looker looks at his noodles. "Go," he says.', flag('anabel-came'), moment('Anabel came with you to look for the place she came from.'))),
    ]),
];

// ---------------------------------------------------------------- U2. The Mother Who Wanted Paradise (Lusamine, Nihilego)
const lusamine = (win: Json[]): Json => trainer('Lusamine', { size: 3, types: ['fairy', 'poison', 'psychic'], lv: 2, friendly: true, boss: 'lusamine', win, lose: [flag('lusamine-won')] });
const u2: Json[] = [
  ev('co-u2-lab', 'The Mother Who Wanted Paradise', G, { rarity: 'rare', requires: [ON], cast: ['boss.lusamine-masters'], pokemon: 'nihilego', tint: '#e0e0f0' },
    'The Aether Foundation\'s wormhole lab. Beautiful; white; a jellyfish-shaped glass case, empty. A woman in white turns from it.\n\nLusamine: "You\'ve met them, haven\'t you? The Beasts. Aren\'t they perfect? They never age. They never leave you. They don\'t talk back. I am going to go and live with them. And I\'m taking everything I love with me."',
    [
      ch('"That\'s not love."', fight('Lusamine: "What would you know about it?"', lusamine([flag('u2-lab')]))),
      ch('"Show me."', fight('She shows you the lab: Pokémon frozen in glass cases, "to keep them perfect". Then she battles you.', lusamine([flag('u2-lab'), flag('u2-saw-cases')]))),
      ch('"Where are your children?"', fight('She does not answer. Behind the next door is an empty room with a girl\'s hat on the bed. Then she battles you.', lusamine([flag('u2-lab'), flag('u2-asked-children')]))),
    ]),
  ev('co-u2-cases', 'The Mother Who Wanted Paradise: The Cases', G, { callback: true, rarity: 'rare', requires: [ON, flagIs('u2-lab'), not('freed-caged')], cast: ['trainer.psychic_m'], pokemon: 'nihilego', tint: '#e0e0f0' },
    'An Aether van, unloading. More glass cases, and in each one a Pokémon, still. Every one she freezes is one less that fights.',
    [
      ch('Stop the van.', fight('Aether staff block the doors.', trainer('Aether Staff', { size: 2, types: ['psychic', 'steel'], lv: 1, friendly: true, win: [flag('freed-caged'), fr(1)], lose: [] }))),
      ch('Follow it.', out('It goes back to the lab. You know where she will be.', flag('u2-followed'))),
    ]),
  ev('co-u2-tear', 'The Mother Who Wanted Paradise: The Tear', G, { callback: true, rarity: 'rare', requires: [ON, flagIs('u2-lab')], pokemon: 'nihilego', tint: '#a0c0f0', effect: 'flicker' },
    'Lusamine opens a Tear to the Ultra Deep Sea. She looks back at you once, and goes through.',
    [
      ch('Follow her.', out('Cold water that is not water. Light from nowhere.', faller(), room('co-u2-deep'))),
      ch('Let her go.', leave('The Tear closes. Somewhere, a glass case cracks open on its own.')),
    ]),
  ev('co-u2-deep', 'The Ultra Deep Sea', G, { ...R, pokemon: 'nihilego', tint: '#a0c0f0', effect: 'float' },
    'Lusamine, joined with a Nihilego, beautiful and wrong.\n\nLusamine: "Stay. It doesn\'t hurt."',
    [
      ch('Fight it off her.', fight('The Nihilego lets go of her and turns on you.', beast('nihilego', 'host', { lv: 4, win: [flag('freed-caged'), flag('lusamine-saved'), moment('You pulled Lusamine back out of the Ultra Deep Sea.')] }))),
      ch('Talk to her.', out('Lillie\'s name is enough. The Nihilego lets go. Lusamine sits down in the not-water and cries.', flag('freed-caged'), flag('lusamine-saved'), item('beast-ball'), moment('Lusamine came home because someone said her daughter\'s name.')), { requires: [flagIs('nebby-met')] }),
      ch('Leave her.', out('You go back through the Tear alone.', flag('lusamine-left'))),
    ]),
  ev('co-u2-older', 'The Mother Who Wanted Paradise: Later', G, { callback: true, rarity: 'rare', requires: [ON, flagAgo('lusamine-left', 1)], cast: ['boss.lusamine-masters'], pokemon: 'nihilego', tint: '#c0c0d0' },
    'A woman in white, alone, older than she should be. Lusamine: "I need you to forgive me for something." She will not say what.',
    [
      ch('"I forgive you."', out('She closes her eyes, and walks away lighter.', flag('lusamine-forgiven'))),
      ch('"For what?"', out('She does not answer. She walks away.', flag('lusamine-asked'))),
    ]),
];

// ---------------------------------------------------------------- U3. The Flex (Buzzwole)
const u3: Json[] = [
  ev('co-u3-beach', 'The Flex', G, { rarity: 'rare', types: ['water', 'fighting'], requires: [ON], cast: ['trainer.black_belt_m'], pokemon: 'buzzwole', tint: '#c04040' },
    'On a beach, a giant red Beast is posing. Bodybuilders around it are posing back. Nobody is winning.\n\nA bodybuilder, straining: "It\'s been going for three hours. It won\'t stop until someone out-poses it. Carl passed out. Carl was the best of us."\n\nBuzzwole flexes at you.',
    [
      ch('Pose back.', out('Three rounds. Your strongest Fighting- or Bug-type poses beside you, and on the third round Buzzwole lowers its arms, deeply moved.', flag('buzzwole-outposed'), stat('atk', { who: { types: ['fighting', 'bug'] } }), room('co-u3-after')), { requires: [anyType('fighting', 'bug')] }),
      ch('Battle it.', fight('Its Ultra Rule is on: Flex.', beast('buzzwole', 'flex', { win: [flag('buzzwole-beaten'), room('co-u3-after')] }))),
      ch('Walk away.', out('It follows you, flexing, a long way down the beach before it loses interest.', flag('buzzwole-follows'))),
    ]),
  ev('co-u3-after', 'The Flex: The Gym', G, { ...R, cast: ['trainer.black_belt_m'], pokemon: 'buzzwole', tint: '#c04040' },
    'The bodybuilders carry you to their gym on their shoulders. Buzzwole comes too, still glowing.',
    [
      ch('Train with them.', out('A morning of free training. Your top Pokémon is stronger for it.', stat('atk', { who: 'top' }))),
      ch('Ask Buzzwole to come along.', fight('It will, if you can hold it.', beast('buzzwole', 'flex', { win: [flag('buzzwole-asked')] }))),
    ]),
];

// ---------------------------------------------------------------- U4. The Midway (Blacephalon): a home world, three acts at Night
const act = (n: 1 | 2 | 3, intro: string, good: string, bad: string): Json =>
  ev(`co-u4-act-${n}`, `The Midway: Act ${n}`, G, { ...R, pokemon: 'blacephalon', tint: '#e060a0', effect: 'confetti' }, intro, [
    ch(good, out('The crowd that is not there roars.', flag('midway-cheer'), room(n < 3 ? `co-u4-act-${n + 1}` : 'co-u4-curtain'))),
    ch(bad, out('The crowd that is not there yawns. You did that one already.', room(n < 3 ? `co-u4-act-${n + 1}` : 'co-u4-curtain'))),
  ]);
const u4: Json[] = [
  ev('co-u4-midway', 'The Midway', G, { rarity: 'rare', requires: [ON, at('night')], pokemon: 'blacephalon', tint: '#e060a0', effect: 'confetti' },
    'A fairground you do not remember, at night, with every ride lit and nobody on them. A clown face floats above the Ferris wheel and explodes into confetti. Then puts itself back.\n\nA loudspeaker: "NEXT ACT." A spotlight finds you.',
    [
      ch('Perform.', out('You step into the light.', faller(), room('co-u4-act-1'))),
      ch('Leave.', out('You walk out of the gate, and in through the gate, and you are back by the Ferris wheel.', room('co-u4-exit'))),
      ch('Find the operator.', out('A booth at the back.', faller(), room('co-u4-booth'))),
    ]),
  ev('co-u4-exit', 'The Midway: The Exit', G, { ...R, pokemon: 'blacephalon', tint: '#e060a0' },
    'The gate again. It looks the same as last time.',
    [ch('Try again.', leave('This time the road is the road. Behind you, the lights go out one by one.')), ch('Go back in.', out('The spotlight was waiting.', faller(), room('co-u4-act-1')))]),
  act(1, 'Act one: a battle with flair. The loudspeaker: "SHOW THEM SOMETHING."', 'Let your lead show off its best move.', 'Do what you always do.'),
  act(2, 'Act two: a move the crowd has never seen.', 'Call a move you have never used.', 'Call your favourite again.'),
  act(3, 'Act three: the pose.', 'Strike a pose nobody has struck before.', 'Bow.'),
  ev('co-u4-curtain', 'The Midway: Curtain', G, { ...R, pokemon: 'blacephalon', tint: '#e060a0', effect: 'confetti' },
    'The spotlight goes out. The loudspeaker clicks.',
    [ch('Wait.', out('Silence. Then the clown face, quietly: "No one ever stays to the end." It goes back to the booth.', flag('midway-done')), {
      branches: [
        br([flagIs('midway-cheer', 3)], 'The fairground erupts. A Blacephalon drops from the Ferris wheel, bows to you, and asks for an encore.', flag('midway-done'), flag('midway-triumph'), room('co-u4-booth')),
        br([flagIs('midway-cheer', 2, 2)], 'Polite applause, from nowhere. A Blacephalon peeks out of the booth at the back.', flag('midway-done'), room('co-u4-booth')),
      ],
    })]),
  ev('co-u4-booth', 'The Midway: The Operator', G, { ...R, pokemon: 'blacephalon', tint: '#a04080' },
    'Inside the booth is a Blacephalon, alone, running every ride by itself. Under it, a subtitle: "No one ever comes."\n\nIt asks to be applauded. Once.',
    [
      ch('Applaud.', fight('It is so happy its head goes off. Then it wants to come with you, if you can hold on to it.', beast('blacephalon', 'finale', { win: [flag('blacephalon-applauded')] }), item('beast-ball'))),
      ch('Leave it the lights.', leave('It runs the Ferris wheel for you all the way out.')),
    ]),
];

// ---------------------------------------------------------------- U5. The Ruined City (Guzzlord): a home world
const u5: Json[] = [
  ev('co-u5-city', 'The Ruined City', G, {
    rarity: 'rare', requires: [ON], pokemon: 'guzzlord', tint: '#606060',
    remembers: [{ id: 'home', when: [{ kind: 'partySpecies', species: 'guzzlord' }], notice: 'Your Guzzlord lies down in the empty street. This is its home.', addChoices: [] }],
  },
    'Through a Tear: a city very like one you know. The same streets. Nothing in them. The Pokémon Center\'s sign is there, faded. The door is open. The shelves are bare.\n\nA person in a protective suit, from a doorway: "You\'re from before. I can tell. You\'ve got colour. It ate everything. Then it was still hungry. It\'s still here. It\'s always hungry."',
    [
      ch('"What happened?"', out('Four lines. The Beast came. The leaders fed it to keep it calm. It was never enough. Then there was nobody left to feed it.', faller(), flag('u5-heard'), room('co-u5-stadium'))),
      ch('"Come back with me."', out('They cannot: they would starve on the other side. They ask for one thing from your bag, to remember colour by. You give it.', faller(), lose(), flag('u5-gift'), room('co-u5-stadium'))),
      ch('"Where is it?"', out('They point. Every street from here costs you something: it has eaten the way, and you pay to pass.', faller(), lose(), lose(), takeNode(1), room('co-u5-stadium'))),
    ]),
  ev('co-u5-stadium', 'The Ruined City: The Stadium', G, { ...R, pokemon: 'guzzlord', tint: '#404040' },
    'Guzzlord, in the city\'s stadium, eating the seats.',
    [
      ch('Battle it.', fight('It turns from the seats to you.', beast('guzzlord', 'devour', { lv: 4, win: [flag('guzzlord-found'), moment('You stood in the stadium of a city that was eaten, and fought what ate it.')] }))),
      ch('Feed it everything.', out('You empty your bag into the stands. For the first time in a long time, it stops, and sleeps.', lose(), lose(), lose(), flag('guzzlord-fed'), flag('guzzlord-found'))),
      ch('Leave and go.', leave('The survivor waves from a doorway, very small, as the Tear closes.')),
    ]),
];

// ---------------------------------------------------------------- U6. The Paper Crane (Kartana)
const u6: Json[] = [
  ev('co-u6-crane', 'The Paper Crane', G, { rarity: 'rare', types: ['grass', 'steel'], requires: [ON], cast: ['trainer.youngster_m'], pokemon: 'kartana', tint: '#f0f0e0' },
    'A folded paper crane lands on your lead. It is sharp enough to cut. More cranes, in a line, lead off the path to a forest of folded paper trees. A child sits in the middle, folding, with paper cuts on every finger.\n\nThe child: "I\'m making it a home. So it doesn\'t go back."',
    [
      ch('"Who?"', out('A Kartana steps out from behind a paper tree, very still.', room('co-u6-end'))),
      ch('"Let me help."', out('You fold three things: a boat, a box, a star. The Kartana watches each one, and on the last it bends, very slightly, like a nod.', flag('kartana-helped'), fr(1), room('co-u6-end'))),
      ch('"You\'re bleeding."', out('The child shrugs. The Kartana moves between the two of you, protecting them.', heal(0.2), room('co-u6-end'))),
    ]),
  ev('co-u6-end', 'The Paper Crane: Home', G, { ...R, cast: ['trainer.youngster_m'], pokemon: 'kartana', tint: '#f0f0e0' },
    'The paper forest rustles. The Kartana waits, and the child waits.',
    [
      ch('"Take it home."', out('A Tear opens. The Kartana goes. The child cries, and then folds you a crane that is not sharp.', flag('kartana-honoured'), moment('A child folded you a crane that was not sharp.'))),
      ch('"Let it stay with the child."', out('The child laughs for the first time. The Kartana cuts the next sheet of paper for them, perfectly.', flag('kartana-stayed'), fr(1))),
      ch('Catch it.', fight('The child shouts. The Kartana is already moving.', beast('kartana', 'paper-cut', { win: [flag('kartana-caught')] }))),
    ]),
];

// ---------------------------------------------------------------- U7. The Wall That Watches (Stakataka)
const u7: Json[] = [
  ev('co-u7-wall', 'The Wall That Watches', G, { rarity: 'rare', requires: [ON], cast: ['trainer.worker_m'], pokemon: 'stakataka', tint: '#808070' },
    'A stone wall in a field where no wall was. Every brick has an eye.\n\nA farmer: "It moved in the night. It moved a metre closer to my house. My grandson says it\'s lonely. My grandson is six."',
    [
      ch('Talk to it.', out('Every eye opens. It shifts, brick by brick, into the shape of the farmer\'s house, and settles. You rest against it; it is warm.', flag('stakataka-house'), heal(0.5))),
      ch('Knock it down.', fight('Its Ultra Rule: Many as One.', beast('stakataka', 'many-as-one', { win: [flag('stakataka-beaten')] }))),
      ch('Build next to it.', out('Your party helps the farmer build a wall alongside it. It takes two stops. In the morning it has moved to join the new wall, and the farmer\'s grandson is sitting on top.', takeNode(2), flag('stakataka-wall'), heal(1), fr(1))),
    ]),
];

// ---------------------------------------------------------------- U8. Poipole's Friend
const u8: Json[] = [
  ev('co-u8-cling', 'Poipole\'s Friend', G, {
    rarity: 'rare', requires: [ON], pokemon: 'poipole', tint: '#a060c0',
    remembers: [{ id: 'anabel', when: [flagIs('task-force')], notice: 'Anabel: "That\'s a Poipole. They choose. You don\'t. In its world, they give them to children. Because there\'s no light, and children need something."', addChoices: [] }],
  },
    'A small purple Pokémon clings to your least-used Pokémon and will not let go. It chirps.',
    [
      ch('"It can stay."', out('It chirps again, louder, and holds on tighter.', gift('poipole'), flag('poipole-clings'))),
      ch('"Find its home."', out('A Tear opens, once, just for it. Poipole looks back at you all the way in.', flag('poipole-home'))),
      ch('Ask the one it\'s holding.', out('Your Pokémon looks at you, unsure. Poipole lets go, and waits nearby, and then it is gone.', flag('poipole-asked')), {
        branches: [br([bondIs(3)], 'Your Pokémon looks at you, then nods. Poipole stays.', gift('poipole'), flag('poipole-clings'))],
      }),
    ]),
];

// ---------------------------------------------------------------- U9. The Hole in the Sky (finale)
const u9: Json[] = [
  ev('co-u9-sky', 'The Hole in the Sky', G, {
    rarity: 'rare', requires: [ON, flagIs('task-force'), flagIs('faller-rank', 2)], cast: ['boss.Spr_Pt_Looker', 'boss.anabel-gen7'], pokemon: 'necrozma', tint: '#303060', effect: 'flicker',
    remembers: [{ id: 'light', when: [{ kind: 'partySpecies', species: 'solgaleo' }], notice: 'Your Solgaleo lifts its head. The Beasts turn toward its light.', addChoices: [] }],
  },
    'The sky opens. Looker, on the phone: "Don\'t come. Do not come." Anabel, taking the phone: "Come."\n\nBeasts are coming through. Several. Not attacking anyone. Lost.',
    [
      ch('"Close it."', fight('A battle at the Tear itself.', trainer('The Hole in the Sky', { size: 3, team: ['nihilego', 'pheromosa', 'celesteela'], lv: 3, friendly: true, win: [faller(), flag('sky-closed'), moment('You closed the hole in the sky. The Beasts on this side stayed, scared.', 90)], lose: [flag('sky-held')] }))),
      ch('"Guide them home."', fight('One Beast at a time. You calm the first and the others follow its lead.', {
        ...wild({ species: ['xurkitree'], lv: 3 }), pseudo: true, lose: [],
        rule: { calm: { need: 4, start: 0, perTurn: 1, likes: ['sound'] } },
        calm: [flag('sky-guided'), moment('You walked the lost Beasts home through the hole in the sky, one at a time.', 90)],
      })),
      ch('"Let them through."', out('They come through, look around, and spread out across the region, lost and harmless and strange.', flag('sky-open'), moment('You let the Beasts through. The region is stranger now.', 85))),
    ]),
];

export const EVENTS: Json[] = [...u1, ...u2, ...u3, ...u4, ...u5, ...u6, ...u7, ...u8, ...u9];
export const REMOVE: string[] = [];
