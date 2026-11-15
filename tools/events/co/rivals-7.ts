// Catalog Overhaul Pack, rival questlines R19 to R24 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R19 The Rival Who Became Champion, R20 Greetings Between Teams, R21 The Long Night at the Inn, R22 One for the Road,
// R23 The Race for First Pick (a chain pseudo-stage: pseudoStages.json `ps_rival_race`), R24 What They Call You.
// Build: npm run co:build -- rivals-7
import { ch, fight, item, join, out, room, trainer, wild, type Json } from '../dsl.ts';
import { beat, done, due, feel, feels, met, page, part, quest, R, rival, rq, RS, script, set, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

const between = (key: string, atLeast: number, atMost: number): Json => ({ kind: 'flag', key, atLeast, atMost });
const EVE = rq({ leagueEve: true });

// ======================================================================================================
// R19. THE RIVAL WHO BECAME CHAMPION (finale; needs Lead +3). The League's last door, at the last stage before it.
// ======================================================================================================
const R19_END = { win: [quest({ openFirst: ['rq-r19-title'] })], lose: [quest({ openFirst: ['rq-r19-photo'] })] };
const champion: Json[] = [
  beat('rq-r19-champion', 'The Rival Who Became Champion', { minStage: 2, requires: [met(1), EVE, { kind: 'rivalState', leadAtLeast: 3 }], tint: '#2a2410', effect: 'glint', priority: 85 },
    script(
      page('The League doors. A steward bows.', who('Steward', 'The Champion is expecting you.'), 'The portrait above the doors is new. The paint is barely dry. It is {rival}.'),
      page('On the way in, the screens in the hall play the Rival Reports you never opened, one second each.', '{rival} winning. {rival} training in the rain. {rival} asleep on a bench with their team piled on top of them.'),
      page('The last one was never sent. {rival} in the chair, alone, in an empty hall, holding a cup they have not drunk from.'),
      page('Then the doors open, and there they are, in the chair.', RS('champion', { 'champion-chaser': 'Told you. Took the chair. Kept it warm.' })),
    ),
    [
      ch('"Let\'s go."', fight(page(R('That\'s the only thing you could have said.')), rival({ lv: 3, size: 6, quest: { counter: 'lead' }, ...R19_END }))),
      ch('"Congratulations."', fight(script(page(R('Don\'t.'), R('Not until you\'ve tried to take it.'))), rival({ lv: 3, size: 6, quest: { counter: 'lead' }, ...R19_END }))),
      ch('"You don\'t look happy."', fight(script(
        page('{rival} looks at you for a long time.', R('It\'s lonely up here. I didn\'t know.')),
        page('They stand. Their ace is already at their side. So is yours. Neither of you remembers calling them.'),
      ), rival({ lv: 3, size: 6, quest: { aceFirst: true }, ...R19_END })), { requires: [feels('friendship', 6)] }),
    ]),
  part('rq-r19-title', 'The Rival Who Became Champion: The Chair', { tint: '#2a2410', effect: 'confetti' },
    script(
      page('Their last Pokémon goes down. {rival} kneels beside it for a moment before they recall it.', RS('lost', { 'champion-chaser': 'I kept it warm for you. I think I always knew I was.' })),
      page('They take the Champion\'s pin off and hold it out.', R('It\'s yours. It was always going to be.'), R('Rematch. Whenever you like. I mean it.')),
    ),
    [ch('Take the pin.', out('It is still warm from their hand.'))]),
  part('rq-r19-photo', 'The Rival Who Became Champion: The Photo', { tint: '#2a2410', effect: 'none' },
    script(
      page('They win. The hall roars. Someone with a camera runs in for the Hall of Fame photograph.'),
      page('{rival} puts a hand up.', R('Not without them.'), 'They point at you. They do not lower their hand until you are standing next to them.'),
    ),
    [ch('Stand with them.', out('The flash goes off. In the photo, neither of you is looking at the camera.'))]),
];

// ======================================================================================================
// R20. GREETINGS BETWEEN TEAMS (Pokémon-level rivalry). Meetings 2, 4, 6 and the last. Starter Rivalry: rq-starter-rivalry.
// 3 to 5: both sides +1 Speed when a rival fight from a scene starts; 6 and up: +1 Attack and Sp. Atk too (core/rivals/questlines.ts).
// ======================================================================================================
const greet = (): Json[] => [
  ch('"Let them."', out('You let them. It takes a while. Nobody minds.', { kind: 'flag', key: 'rq-starter-rivalry', amount: 1 })),
  ch('"Call them back."', out(script(page('You both call. Your teams come back slowly, looking over their shoulders.', R('Spoilsports, the pair of us.'))))),
  ch('"Let just those two battle."', out(script(page('The two starters circle each other. A few sparks, a lot of noise. Nobody wins.', 'Both of them look delighted.')), { kind: 'flag', key: 'rq-starter-rivalry', amount: 2 })),
];
const greetings: Json[] = [
  beat('rival-mon-greeting', 'Greetings Between Teams', { minStage: 2, requires: [met(2)], tint: '#1f2a24', effect: 'hearts' },
    script(page('Before either of you can say a word, both teams burst out of their Balls.', 'The two starters square up, nose to nose. Everyone else sniffs everyone else.'), page(R('...They\'ve been waiting for this.'))),
    greet()),
  beat('rq-r20-game', 'Greetings Between Teams: The Game', { minStage: 3, requires: [met(4)], tint: '#1f2a24', effect: 'hearts' },
    script(page('The teams are out again before anyone asks. Two of them have a game going. It has rules.', 'Nobody else understands the rules. Every so often one of them shouts, and the other one has to hop.'), page(R('I asked mine to explain it once. It looked at me like I was stupid.'))),
    greet()),
  beat('rq-r20-gift', 'Greetings Between Teams: A Present', { minStage: 4, requires: [met(6)], tint: '#1f2a24', effect: 'sparkle' },
    script(page('{rival}\'s lead trots over to yours with something in its mouth. A stick. A good one. It puts it down very carefully.', 'It is a present. Your lead knows it is a present.'), page(R('It\'s never given me a stick.'), R('Not once.'))),
    greet()),
  beat('rq-r20-last', 'Greetings Between Teams: Side by Side', { minStage: 2, requires: [met(3), EVE], tint: '#1f2a24', effect: 'glint' },
    script(page('Neither of you says a word.', 'Both starters walk out first, side by side, all the way to the middle. Then they turn and face each other.'), page('Nobody called them. Nobody needed to.')),
    [ch('Let them start.', out('Whatever happens next, it started like this.', { kind: 'flag', key: 'rq-starter-rivalry', amount: 1 }))]),
];

// ======================================================================================================
// R21. THE LONG NIGHT AT THE INN (Mystery). A6+, Step 13, must-see when drawn: a storm shuts the road. One long node:
// three clue scenes (ten, midnight, two) and the accusation at dawn.
// ======================================================================================================
const INN = { tint: '#1a1f2a', effect: 'rain' as const };
const inn: Json[] = [
  beat('rq-r21-inn', 'The Long Night at the Inn', { minStage: 6, requires: [met(1), due('R21.open')], ...INN, priority: 70 },
    script(
      page('A storm shuts the road. The only light for miles is an inn, and four other people have already had the same idea.', 'A man in a heavy coat. A girl with red eyes and a too-big bag. A big, quiet man you are almost sure is a Gym Leader on holiday.'),
      page('And {rival}, at the end of the bar, who looks straight at you and says nothing at all.'),
      page(who('Innkeeper', 'Someone\'s Poké Ball has gone missing.'), who('Innkeeper', 'Nobody leaves till it\'s found. Not that you could, in this.')),
    ),
    [ch('Settle in for the night.', out('You take a chair by the fire. The storm hammers on the shutters.', room('rq-r21-ten'), done('R21.open')))]),
  part('rq-r21-ten', 'The Long Night at the Inn: Ten O\'Clock', INN,
    script(page('The parlour. The man in the heavy coat is dealing cards, badly. He keeps losing count.', 'His coat is on the back of his chair. It hangs wrong, heavy on one side, as if something is in the lining.')),
    [ch('Remember the coat.', out('You do not say anything. You remember the way it hangs.', room('rq-r21-midnight')))]),
  part('rq-r21-midnight', 'The Long Night at the Inn: Midnight', INN,
    script(page('The stairs, in the dark. {rival} is coming down as you go up.', R('Evening. Stranger.'), 'They are muddy to the knee. They have been out the back, in the storm, nowhere near the rooms.')),
    [ch('"Evening, stranger."', out('They nearly smile. They do not stop.', room('rq-r21-two')))]),
  part('rq-r21-two', 'The Long Night at the Inn: Two O\'Clock', INN,
    script(page('The kitchen. The girl with the big bag is crying over it. There is a Ball-shaped gap in the lining, where something used to be.', 'The Gym Leader is making her cocoa, very gently, and not asking any questions.'), page(who('Runaway', 'It was the only thing I took. The only one that wanted to come.'))),
    [ch('Sit with her until she stops.', out('The Gym Leader hands you a cocoa too, without asking. He is exactly who he says he is.', room('rq-r21-dawn')))]),
  part('rq-r21-dawn', 'The Long Night at the Inn: Dawn', INN,
    script(page('Dawn. The storm has blown itself out. The innkeeper gathers everyone in the parlour.', who('Innkeeper', 'Well? Somebody saw something.'), 'Everybody looks at you.')),
    [
      ch('Accuse the smuggler.', out(script(
        page('You point at the coat. The man goes white. The innkeeper slits the lining, and out drops a Poké Ball.', 'The girl snatches it up and holds it against her chest.'),
        page('Later, on the step, she holds the Ball out to you.', who('Runaway', 'I asked it. It wants to go with you. It says you notice things.')),
      ), join({ species: ['eevee'], lv: 0 }), feel({ respect: 1 }))),
      ch('Accuse the rival.', out(script(page('{rival} goes very still.', R('Mud to the knee, and you still thought it was me.'), 'They do not argue. Later, the innkeeper finds the Ball in the smuggler\'s coat.'), page('{rival} is gone before breakfast.')), feel({ trust: -2 }))),
      ch('Cover for the rival when their sponsor arrives.', out(script(page('A car pulls up outside. You hear {rival} go up the stairs, two at a time.'), page(R('...You saw?'), 'You nod.')), room('rq-r21-sponsor'))),
    ]),
  part('rq-r21-sponsor', 'The Long Night at the Inn: The Sponsor', INN,
    script(page('A man in a good coat comes in out of the wet and looks around the parlour as if he owns it.', who('Sponsor', 'I\'m looking for a young trainer. Talented. Ungrateful.')), page('Upstairs, a curtain moves.')),
    [
      ch('"Nobody here like that."', out(script(
        page('He looks at you. He looks at the stairs. He leaves.'),
        page('On the road, later, {rival} falls into step beside you.', R('"Nobody here like that." ...Thanks. I think.'), R('Was it the "talented" or the "ungrateful" that didn\'t fit?')),
      ), feel({ trust: 2 }))),
      ch('"They left in the night."', out(script(page('He swears, quietly, and goes back out to the car.'), page('On the road, later, {rival} catches up with you, out of breath.', R('Left in the night. That\'s good. I might use that.'))), feel({ trust: 2 }))),
      ch('"Who\'s asking?"', out(script(page('He does not answer. He looks at you a little too long, then goes.'), page('On the road, later, {rival} is waiting by the first milestone.', R('"Who\'s asking." You\'re terrifying. I love it.'))), feel({ trust: 2 }))),
    ]),
];

// ======================================================================================================
// R22. ONE FOR THE ROAD (short, recurring). After every rival battle that earns By a Thread (rq-drink-owed): the loser buys the drink.
// Variants: 1 (cans), 3 (glasses), 5 (the winner pays by mistake). The last: at the League, two drinks already open.
// ======================================================================================================
const DRINK_DONE = (): Json[] => [set('rq-drink-owed', 0), { kind: 'flag', key: 'rq-drinks', amount: 1 }];
const drinks: Json[] = [
  beat('rival-shared-drink', 'One for the Road', { minStage: 2, requires: [met(1), yes('rq-drink-owed')], tint: '#2a1f1a', effect: 'none', tags: ['Rival', 'Relationship'],
    remembers: [
      { id: 'glasses', when: [between('rq-drinks', 2, 2)], intro: script(page('{rival} is waiting at the next bench with two glasses, actual glasses, on a tray.', R('I asked. They do glasses. I thought: glasses.'))) },
      { id: 'pays', when: [between('rq-drinks', 4, 4)], intro: script(page('The winner pays, by mistake. Neither of you notices. You sit on the bench and drink them anyway.')) },
      { id: 'lost', when: [yes('rq-thread-won')], intro: script(page('{rival} is at the next bench with two cans from the machine. They lost. They are buying.', RS('lost', { 'bitter-challenger': 'Again. Always again.' }))) },
    ] },
    script(page('Two cans from the machine at the next bench. You lost, so you are buying.', '{rival} takes theirs without a word, then says one anyway.', RS('won'))),
    [
      ch('"Cheers."', out('The cans clink. Ten seconds. It is enough.', ...DRINK_DONE())),
      ch('"Next time."', out(R('Next time.') + '\nThey say it like a promise. It probably is.', ...DRINK_DONE())),
      ch('Say nothing.', out('You drink. They drink. The road is still there when you are done.', ...DRINK_DONE())),
    ]),
  beat('rq-r22-last', 'One for the Road: The Last One', { minStage: 2, requires: [met(1), yes('rq-drinks'), EVE], tint: '#2a1f1a', effect: 'none' },
    script(page('{rival} is on the bench outside the League doors. Two drinks, already bought. Already open.', 'Nothing is said.')),
    [ch('Sit down.', out('Nothing is said. Nothing needs to be.'))]),
];

// ======================================================================================================
// R23. THE RACE FOR FIRST PICK (pseudo-stage, a race of five nodes in two lanes). A3+, Step 10, side branch.
// Each node cleared fast costs the rival a beat (rq-r23-beat); a fight on the way costs you the time. The rival started first,
// so the crate is yours with three beats or more.
// ======================================================================================================
const RACE = { tint: '#2a2a14', effect: 'none' as const };
const beatFast = (): Json => ({ kind: 'flag', key: 'rq-r23-beat', amount: 1 });
const crateRooms = ['rq-r23-first', 'rq-r23-kind', 'rq-r23-best'];
const race: Json[] = [
  beat('rival-race', 'The Race for First Pick', { minStage: 3, requires: [met(1), due('R23.open')], ...RACE, effect: 'rattle', pseudo: true },
    script(page('A supply crate on the far side of a field, sitting in the sun with its lid half off.', '{rival} is already running.'), page(R('First one there picks!'))),
    [
      ch('Run!', out('You are off the line before you have decided to be. Two ways across: a fence, or the long grass.', room('rq-r23-fence'), room('rq-r23-grass'), done('R23.open'))),
      ch('Let them have it.', out(script(page('You watch them go. They get there, turn round, and look confused that you are not behind them.', R('...You\'re no fun.'))), done('R23.open'))),
    ]),
  part('rq-r23-fence', 'The Race: The Fence', RACE,
    script(page('A fence, chest-high. {rival} is already over the next one.')),
    [
      ch('Vault it.', out('You clear it clean. Somewhere ahead, {rival} looks back and swears.', beatFast(), room('rq-r23-level'))),
      ch('Fight the Pokémon nesting on it.', fight('A Pokémon on the fence post does not want you climbing its fence.', wild({ types: ['normal', 'flying'], win: [room('rq-r23-level')] }))),
    ]),
  part('rq-r23-grass', 'The Race: The Long Grass', RACE,
    script(page('Grass to the shoulder. You can hear {rival} crashing through it somewhere to your left.')),
    [
      ch('Find the trodden path.', out('There is a path, if you look. You find it, and you fly.', beatFast(), room('rq-r23-level'))),
      ch('Push through whatever is in there.', fight('Something in the grass does not like being pushed through.', wild({ types: ['grass', 'bug'], win: [room('rq-r23-level')] }))),
    ]),
  part('rq-r23-level', 'The Race: Neck and Neck', RACE,
    script(page('Halfway. You come out of the field and {rival} comes out of the grass at exactly the same moment. Level.', RS('pseudo', { enthusiast: 'This is the best day! I\'m going to lose! I don\'t even mind!' }))),
    [
      ch('Sprint.', out('You find a gear you did not know you had.', beatFast(), room('rq-r23-trainer'), room('rq-r23-hill'))),
      ch('Laugh with them.', out('You are both laughing too hard to run properly. Neither of you minds.', feel({ friendship: 1 }), room('rq-r23-trainer'), room('rq-r23-hill'))),
    ]),
  part('rq-r23-trainer', 'The Race: In the Way', RACE,
    script(page('A trainer steps into the path with a Ball raised.', who('Trainer', 'Nobody passes without a battle!'))),
    [
      ch('Dodge round.', out('You go round. He is still announcing himself when you are gone.', beatFast(), room('rq-r23-crate'))),
      ch('Battle him.', fight('He is very pleased to be battled.', trainer('Trainer', { size: 2, win: [room('rq-r23-crate')] }))),
    ]),
  part('rq-r23-hill', 'The Race: The Hill', RACE,
    script(page('A hill. The crate is on the other side of it. {rival} is going round.')),
    [
      ch('Straight over the top.', out('Your legs are on fire. You do not care. You are over.', beatFast(), room('rq-r23-crate'))),
      ch('Stop for the view.', out('You stop for one breath at the top. It is a good view. {lead} thinks so too.', room('rq-r23-crate'))),
    ]),
  part('rq-r23-crate', 'The Race: The Crate', RACE,
    script(page('The crate. Three things inside, in straw: a Lucky Egg, a Soothe Bell, a pouch of tuning dust.')),
    [ch('Who got there first?', out('You both arrive, gasping, and look at each other.', quest({ openFirst: crateRooms })))]),
  // The finish: first pick (P4: one item).
  part('rq-r23-first', 'The Race: First Pick', { ...RACE, effect: 'confetti', requires: [yes('rq-r23-beat', 3)] },
    script(page('You touch the crate first. Just. {rival} slaps it a second later and lies down in the grass.', R('Pick, then. Go on. Gloat.'))),
    [
      ch('Take the Lucky Egg.', out('{rival} takes the Soothe Bell, very slowly, as if it was what they wanted all along.', item('lucky-egg'))),
      ch('Take the Soothe Bell.', out('{rival} grabs the Lucky Egg so fast they nearly drop it.', item('soothe-bell'))),
      ch('Take the tuning dust.', out(R('...Seriously? You won and you took the DUST?'), item('tuning-dust-spe'))),
    ]),
  part('rq-r23-kind', 'The Race: Second Pick', { ...RACE, requires: [feels('friendship', 6)] },
    script(page('{rival} gets there first. Their hand goes to the best one. It stops.', 'It moves one to the left.', R('This one. I wanted this one. Obviously.'))),
    [ch('Take the Lucky Egg they left.', out('They do not look at you while you take it. They are smiling at the Soothe Bell as if it is the best thing they have ever owned.', item('lucky-egg')))]),
  part('rq-r23-best', 'The Race: Second Place', RACE,
    script(page('{rival} gets there first and takes the Lucky Egg. They hold it up to the sun.', R('First pick. Winner\'s pick. Write it down.'))),
    [ch('Take the Soothe Bell.', out('It rings, very quietly, as you pick it up. {lead} likes the sound.', item('soothe-bell')))]),
];

// ======================================================================================================
// R24. WHAT THEY CALL YOU (run-long). {called} already follows the Marks (core/rivals/questlines.ts calledName);
// these two scenes mark the change, and the last region's final battle (the last stage) is where they say your real name.
// ======================================================================================================
const names: Json[] = [
  beat('rival-nickname', 'What They Call You', { minStage: 2, requires: [met(1), rq({ mark: 'first-blood' })], tint: '#1f1f2a', effect: 'none' },
    script(page('{rival} waves from across the road.', R('Oi! {called}!'), 'You stop. That is new. You are not sure when it happened.')),
    [ch('Wave back.', out('They grin, as if they have got away with something.')), ch('"What did you call me?"', out(R('{called}. Suits you. Don\'t argue.')))]),
  beat('living-rival-acknowledges', 'They Say It Out Loud', { minStage: 2, requires: [met(2), EVE], tint: '#1f1f2a', effect: 'glint', priority: 75 },
    script(
      page('The last stage before the League. {rival} is waiting, warmed up, ready, the way they have been waiting all run.', R('One more. Then the League. Then, I don\'t know.')),
      page('Halfway through a sentence, they say your name. Your real name. Said right. For the first time.', 'They hear themselves say it.'),
      page('They do not take it back.'),
    ),
    [ch('Say theirs.', out('It is the first time either of you has meant it like that.', set('rival-name-known', 1))), ch('Say nothing. Nod.', out('They nod back. That is enough.', set('rival-name-known', 1)))]),
];

export const EVENTS: Json[] = [...champion, ...greetings, ...inn, ...drinks, ...race, ...names];
export const REMOVE: string[] = [];
