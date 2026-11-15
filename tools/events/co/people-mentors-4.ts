// Catalog Overhaul Pack, people: the mentors B7-B12 (STORY_FAMILIES_5.md, Part B, lines 504-761). Pattern: B1 Brook in people-mentors-2.ts.
// Each mentor: Lesson, Recruit, Story (catalog ids), and the rooms `final` (the Final Lesson battle, opened by MS12 "Nothing Left to Teach")
// and `farewell` (the last line and the gift, opened by the battle, win or lose). Kit: tools/events/co/_mentors.ts.
// Build: npm run co:build -- people-mentors-4
import { again, ch, egg, fight, item, join, out, room, type Json } from '../dsl.ts';
import { CATEGORY as CAT, moment, spar, variant, wildSpar } from './_people.ts';
import { bondJoin, bramLine, graduate, lesson, M, mentorKit, trust } from './_mentors.ts';

export const CATEGORY = CAT;

type Kit = ReturnType<typeof mentorKit>;
/** A Lesson outcome that counts: the mentor's bonus for the run (the engine reads the mentor's Lesson table), plus trust. */
const taught = (text: string, ...extra: Json[]): Json => out(text, ...extra, M.set('lesson'), lesson(), trust(4, 2));
/** Recruit: "Take it." (the Pokémon joins) and "Not yet." (offered again). */
const take = (text: string, joins: Json): Json => ch('"Take it."', out(text, joins, M.set('recruit'), trust(1, 2)));
const notYet = (K: Kit, text: string): Json => ch('"Not yet."', out(text, again(K.id('recruit')), trust(0, 1)));
/** A Story decision: the doc's flag, the arc step, and trust. */
const decide = (K: Kit, label: string, text: string, flag: string, ...extra: Json[]): Json => ch(label, out(text, ...extra, K.set(flag), M.set('story'), trust(5, 3)));
/** The Final Lesson: one "Ready.", a friendly six-Pokémon battle; win or lose, the farewell opens. */
const ready = (K: Kit, name: string, team: string[], text: string, o: { lv?: number; win?: Json[] } = {}): Json =>
  ch('"Ready."', fight(text, spar(name, {
    team, size: 6, lv: o.lv ?? 2,
    win: [...(o.win ?? []), moment(`You passed ${K.who}'s Final Lesson`), room(K.id('farewell'))],
    lose: [moment(`${K.who}'s Final Lesson beat you, and you still graduated`), room(K.id('farewell'))],
  })));


// ---------- B7. Marigold Hatch (eggs, bonds, patient growth) ----------
const MG = mentorKit('marigold-hatch');
const MG_TEAM = ['blissey', 'togekiss', 'lucario', 'azumarill', 'snorlax', 'clefable'];
const marigoldFight = (text: string): Json => ready(MG, 'Marigold Hatch', MG_TEAM, text);
const marigoldLine = 'Marigold: "Look at them. Look at yours. That\'s all of it."';
const marigold: Json[] = [
  MG.lesson({
    title: 'Nobody Grows on an Empty Stomach',
    intro:
      'A farmhouse kitchen, warm as a held breath, bread rising under a cloth and a kettle muttering on the hob. Marigold is flour to the elbows, and in a basket by the stove a clutch of eggs sits wrapped in an old wool blanket. ' +
      'She points you to a chair with a wooden spoon. Marigold: "Sit, sit. Nobody grows on an empty stomach." A bowl of stew appears in front of you, and one for each of your Pokémon on the floor. ' +
      'Marigold: "Feed them, rest them, talk to them. Bond\'s slower than levels, and it lasts longer."',
    choices: [
      ch('"Eat."', taught('You eat. Your Pokémon eat. Marigold watches the lot of you with her chin on her hand, and something in the kitchen settles, like a house exhaling at the end of a long day. For the run, your Pokémon grow fond of you faster.')),
      ch('"Hold an egg."', taught('Marigold lifts one from the basket and sets it in your hands as if it were the most natural thing in the world. It\'s warm. Something inside it shifts, once, against your palm. Marigold: "That one likes you. Keep it close; it\'ll hatch before the next region." For the run, your Pokémon grow fond of you faster.', egg({ species: ['togepi', 'happiny', 'riolu', 'azurill', 'munchlax'], left: 3, unit: 'stage' }))),
      ch('"Ask about bonds."', taught('Marigold talks while she kneads: about the Chansey that would only eat if she sang, about the Riolu that slept in her boot for a whole winter. None of it sounds like a lesson, and all of it is one. For the run, your Pokémon grow fond of you faster.')),
    ],
  }),
  MG.recruit({
    title: 'Waiting for the Right Person',
    intro:
      'Marigold finds you in the orchard behind the farmhouse, your lead Pokémon pressed against your leg the way it does when it is tired and happy. She stands at the gate for a while with her apron full of windfalls, just watching. ' +
      'Marigold: "See how it leans on you? That\'s trust. Here. This one\'s been waiting for the right person." In her arms, wrapped in a tea towel, something small blinks up at you.',
    choices: [
      take('The little one goes from her arms to yours without a sound and tucks its head under your chin straight away, as though it had decided long ago and was only waiting for you to arrive. Marigold dabs her eye with a floury knuckle and pretends it is the onions.', bondJoin(5, { species: ['happiny', 'togepi', 'riolu'] })),
      notYet(MG, 'Marigold nods, not a bit offended, and tucks the tea towel tighter. Marigold: "It\'ll keep. So will I." She will ask again when you pass this way.'),
    ],
  }),
  MG.story({
    title: 'The First Shell',
    intro:
      'Evening in the kitchen, the lamps low. Marigold sits by the stove turning an egg in her hands, except it is not an egg: it is a shell, empty and fine as paper, mended along one side with a thread of glue gone yellow with age. ' +
      'Marigold: "My first hatchling never came out. I kept the shell. I\'ve raised every one since like it was that one." She sets it down on the table between you, very gently. ' +
      'Marigold: "I\'m old. Someone should keep the shell after me. I\'d like it to be someone who\'ll understand it."',
    choices: [
      decide(MG, '"I\'ll keep it."', 'You pick the shell up as carefully as you have ever picked up anything. Marigold watches your hands, not your face, and whatever she sees there makes her nod. She wraps it in a square of blanket for you. Eggs you carry seem to hurry a little now, as if something is cheering them on.', 'shell', item('marigolds-shell')),
      decide(MG, '"Keep it yourself."', 'Marigold\'s hands close round the shell again, and she holds it to her chest. Marigold: "Selfish of me to ask. Thank you." She puts it back on the shelf above the stove, where it has always been, and you can see that is where it belongs.', 'kept'),
      decide(MG, '"Bury it."', 'You carry it out together, under the apple tree at the bottom of the orchard, and Marigold digs the hole herself with a trowel. She cries while she does it, quietly, the way people cry for things that happened a very long time ago. Walking back up to the house, she is lighter. You can see it in her step.', 'buried'),
    ],
    remembers: [bramLine('Marigold')],
  }),
  MG.room('final', {
    title: 'The Final Lesson',
    intro:
      'Marigold walks you out into the yard behind the farmhouse, the hens scattering, the washing snapping on the line. Six Poké Balls sit in her apron pocket, and every Pokémon in them came out of an egg in her kitchen. ' +
      'They come out before she even calls them, a Blissey, a Togekiss, a Lucario and three more, and every one of them goes to her first, to be touched once on the head. Marigold: "Go on, then. Show me how you\'ve raised yours."',
    choices: [marigoldFight('Her Blissey waddles forward first, and looks at your team with the same patient kindness its trainer does. Every one of hers is as close to her as a Pokémon can be.')],
    remembers: [
      variant('shell', [MG.is('shell')], {
        intro:
          'The yard behind the farmhouse, the washing snapping on the line. Marigold looks at the bundle in your bag where her shell rides, and smiles. Six Poké Balls, every Pokémon hatched in her kitchen, every one of them devoted to her. ' +
          'Marigold: "You kept it safe. Now show me how you\'ve raised yours."',
      }),
      variant('kept', [MG.is('kept')], {
        intro:
          'The yard behind the farmhouse. Through the kitchen window you can see the old shell on its shelf above the stove, catching the light. Six Poké Balls in Marigold\'s apron, every Pokémon hatched under that same shelf. ' +
          'Marigold: "It\'s watching. Show it how you\'ve raised yours."',
      }),
      variant('buried', [MG.is('buried')], {
        intro:
          'Marigold has brought you down to the orchard, under the apple tree, where the earth has settled and a little green has come up. She looks lighter than you have ever seen her. Six Poké Balls, every Pokémon hatched in her kitchen. ' +
          'Marigold: "Here feels right. Show me how you\'ve raised yours."',
      }),
    ],
  }),
  MG.room('farewell', {
    title: 'That\'s All of It',
    intro:
      'When it is over, Marigold\'s Pokémon and yours end up in one heap on the grass, too tired to care whose is whose. She lowers herself down beside them with a groan and looks for a long time. ' +
      `${marigoldLine} She presses two things into your hands: a smooth, pale Oval Stone, and a jar of her plum jam with a gingham lid.`,
    choices: [graduate('You hold the stone in one hand and the jam in the other, and do not trust yourself to say anything else. Marigold pats your cheek with a floury hand, the way she would a hatchling, and sends you on your way with a full stomach.', item('oval-stone'), moment('Marigold gave you a jar of her plum jam', 70))],
  }),
];


// ---------- B8. Captain Ravi Ironhand (pressure battles and clean finishes) ----------
const RV = mentorKit('ravi-ironhand');
const RV_TEAM = ['kingdra', 'machamp', 'lucario', 'barraskewda', 'pelipper', 'gyarados'];
const raviFight = (text: string): Json => ready(RV, 'Captain Ravi Ironhand', RV_TEAM, text);
const sailed = (text: string): Json => out(text, RV.set('sailed'), M.set('story'), trust(5, 3));
const ravi: Json[] = [
  RV.lesson({
    title: 'The First Bell',
    intro:
      'A coastguard station on a grey headland, the wind shoving at the windows and charts pinned flat with stones. Captain Ravi Ironhand stands by the door with a brass bell in his hand, polished so long the engraving has worn away. ' +
      'Ravi: "Eyes up. We start at the first bell." He does not ring it yet. Ravi: "Clean finishes. No wasted turns. The sea doesn\'t give you a second go."',
    choices: [
      ch('"Ring it."', taught('You take the bell and ring it, once, hard. The note goes out over the water and Ravi\'s mouth twitches, nearly a smile. The drills start at once and do not stop until dark. For the run, a knockout on the first turn of a battle sends your next Pokémon in faster.')),
      ch('"What\'s a clean finish?"', taught('Ravi draws it on a chart with a stub of pencil: the opening, the one hit that ends it, nothing wasted between. Ravi: "That. Every time." By evening you can feel the shape of it. For the run, a knockout on the first turn of a battle sends your next Pokémon in faster.')),
      ch('"I like a long fight."', taught('Ravi looks at you the way he looks at a sky going green at the edges. Ravi: "Then you\'ll be tired when it matters." He rings the bell himself, and works you twice as hard. For the run, a knockout on the first turn of a battle sends your next Pokémon in faster.')),
    ],
  }),
  RV.recruit({
    title: 'Too Brave for the Boat',
    intro:
      'Ravi has been watching your last battle from the sea wall with his arms folded and his collar up. When it ends in one sharp exchange he walks down, and for the first time since you met him, he looks pleased. ' +
      'Ravi: "That was clean. Do it again. A sailor I know needs a home for a Pokémon that\'s too brave for the boat."',
    choices: [
      take('The sailor is a broad woman with tar on her hands, and the Pokémon comes straight off her deck and over to you as if it has been looking for a bigger sea. She laughs, and Ravi does too, briefly, like it got out before he could stop it.', join({ species: ['pelipper', 'gyarados', 'dhelmise'] })),
      notYet(RV, 'Ravi nods once. Ravi: "Fair. The tide comes back. So will the offer." He will ask again at the next harbour.'),
    ],
  }),
  RV.story({
    title: 'A Storm I Should Have Seen',
    intro:
      'Ravi stands at the end of the breakwater looking at the horizon, and the horizon is the colour of a bruise. He does not turn round when you come up beside him. ' +
      'Ravi: "Twenty years on the coast. I lost one recruit to a storm I should have seen. I teach so no one else is unprepared." The first fat drops of rain hit the stones. ' +
      'He turns at last, and his face is set like a knot. Ravi: "There\'s a storm coming. Same as that one. There\'s a trawler out. I\'m going. Will you come?"',
    choices: [
      ch('"Sail with you."', out('Ravi does not thank you. He just throws you an oilskin and runs for the lifeboat, and you run after him. The engine catches on the second try, and the harbour mouth opens ahead like a throat.', room(RV.id('sea-1')))),
      decide(RV, '"Stay and keep the light on."', 'Ravi grips your shoulder once, hard, and goes alone. You climb the lighthouse stairs and keep the lamp turning all night, the beam sweeping out over water you cannot see, hour after hour. Just before dawn a light answers from the sea. He comes back, soaked to the bone, and the trawler comes in behind him.', 'light'),
      decide(RV, '"Don\'t go."', 'Ravi stares at you, and for a long moment you think he will go anyway. Ravi: "...You\'re right." He doesn\'t go. The night is very long. At first light the trawler limps in on its own, battered, every soul aboard. Ravi sits down hard on the harbour steps and puts his face in his hands.', 'stayed'),
    ],
    remembers: [bramLine('Ravi')],
  }),
  RV.room('sea-1', {
    title: 'The Harbour Mouth',
    intro:
      'Past the breakwater the sea stands up in walls. Rain comes sideways; the lifeboat climbs each wave and drops off the back of it with a crash that rattles your teeth. ' +
      'Ravi shouts over the wind with one hand on the wheel and the other pointing at the jib, which has torn loose and is thrashing. Ravi: "Haul it in! Both hands!"',
    choices: [
      ch('"Haul the sail."', out('You get the line round your fist and pull, and pull, and the sail comes in hand over hand and you lash it down. Ravi gives you one nod through the rain. Ahead, the swell gets bigger.', room(RV.id('sea-2'))), { prompt: { id: 'pull-hold', needs: 'good' }, fail: out('The line burns through your hands twice before Ravi lunges across and adds his weight to yours. Together you drag it in. Ravi: "Again, next time. Faster." Ahead, the swell gets bigger.', room(RV.id('sea-2'))) }),
      ch('"Take the wheel."', out('Ravi hesitates for half a heartbeat, then gives it to you and goes for the sail himself. You hold her bow-on to the waves with every muscle you have until he is back. Ahead, the swell gets bigger.', room(RV.id('sea-2')))),
    ],
  }),
  RV.room('sea-2', {
    title: 'In the Swell',
    intro:
      'Halfway out, something big and frightened breaks the surface beside the boat: a Sharpedo, driven up from the deep by the storm and lashing at anything that moves. It slams the hull once and the whole boat shudders. ' +
      'Ravi braces against the gunwale. Ravi: "Drive it off or hold on. Choose now."',
    choices: [
      ch('"Drive it off."', fight('You send your Pokémon to the bow and meet the Sharpedo wave for wave.', wildSpar({ species: ['sharpedo'], lv: 1, win: [room(RV.id('sea-3'))], lose: [room(RV.id('sea-3'))] }))),
      ch('"Hold on."', out('You wrap your arms round the mast as the Sharpedo comes again, and the boat heels so far the sea pours over the side, and then rights itself. The Sharpedo loses interest and sinks back into the dark. Ravi lets out a breath you can see.', room(RV.id('sea-3'))), { prompt: { id: 'brace-hold', needs: 'good' }, fail: out('The boat heels, your grip goes, and only Ravi\'s fist in your collar keeps you aboard. The Sharpedo sinks back into the dark. Neither of you says anything. Neither of you lets go for a while.', room(RV.id('sea-3'))) }),
    ],
  }),
  RV.room('sea-3', {
    title: 'The Trawler',
    intro:
      'There: a smudge of light in the murk, rising and falling. The trawler is wallowing broadside to the waves with her engine dead and four faces at the rail. Ravi brings the lifeboat as close as he dares, and holds out a coil of rope to you. ' +
      'Ravi: "One throw. Make it clean."',
    choices: [
      ch('"Throw the line."', sailed('The rope uncoils across the gap and lands right across the trawler\'s rail, and four pairs of hands grab it at once. Ravi tows them home through the worst of it. On the quay at dawn he counts heads twice, and then, quietly, a third time. Everyone is home.'), { prompt: { id: 'throw-ring', needs: 'good' }, fail: sailed('The first throw falls short and the sea eats it. Ravi hauls it back, coils it, puts it back in your hands without a word, and the second throw lands. He tows them home through the worst of it. On the quay at dawn, everyone is home.') }),
      ch('"Bring her alongside."', sailed('You take the wheel while Ravi leans out over the gap, and you hold the boats together long enough for four people to jump. Ravi tows the empty trawler home behind you. On the quay at dawn he counts heads twice, and then, quietly, a third time. Everyone is home.')),
    ],
  }),
  RV.room('final', {
    title: 'The Final Lesson',
    intro:
      'The coastguard station on the headland, where Ravi first put a bell in your hand. The sea is flat and silver today. Ravi stands on the slipway with six Poké Balls on his belt, Water and Fighting, every one of them fast. ' +
      'He rings the bell once. Ravi: "First bell. No wasted turns. Show me."',
    choices: [raviFight('Ravi\'s Kingdra hits the water before the bell has stopped ringing. This will be quick, one way or the other.')],
    remembers: [
      variant('sailed', [RV.is('sailed')], {
        intro:
          'The quay where you brought the trawler home, its crew lined up along the harbour wall to watch. Ravi stands on the slipway with six Poké Balls, Water and Fighting, every one of them fast, and the bell in his hand. ' +
          'He rings it once. Ravi: "You crewed for me once. Now show me what you learned."',
      }),
      variant('light', [RV.is('light')], {
        intro:
          'The foot of the lighthouse, where you kept the lamp turning all that night. Ravi glances up at it before he speaks. Six Poké Balls on his belt, Water and Fighting, every one of them fast. ' +
          'He rings the bell once. Ravi: "You kept the light for me. Now show me your clean finish."',
      }),
      variant('stayed', [RV.is('stayed')], {
        intro:
          'The harbour steps where Ravi sat down that morning. He stands on them now, steadier than he has been in years. Six Poké Balls on his belt, Water and Fighting, every one of them fast. ' +
          'He rings the bell once. Ravi: "You stopped me once. Now show me you can finish."',
      }),
    ],
  }),
  RV.room('farewell', {
    title: 'I\'d Sail with You',
    intro:
      'When it is over, Ravi recalls his last Pokémon and stands looking at the sea for a long time, the bell hanging from his fingers. Then he looks at you, and something in his face lets go. ' +
      'Ravi: "Clean. Every turn. I\'d sail with you." He holds out the bell, the engraving worn smooth by twenty years of his thumb.',
    choices: [graduate('The bell is heavier than it looks. Ravi closes your fingers round it with his own rough hand, then turns and walks back up to the station without looking round, the way sailors leave a quay. The first move you make in any battle will land true now.', item('ravis-bell'), moment('Ravi gave you his bell', 70))],
  }),
];


// ---------- B9. Sable Oakridge (composure under the biggest stages) ----------
const SB = mentorKit('sable-oakridge');
const SB_TEAM = ['garchomp', 'dragonite', 'milotic', 'lucario', 'aegislash', 'gardevoir'];
const sableFight = (text: string): Json => ready(SB, 'Sable Oakridge', SB_TEAM, text);
const sable: Json[] = [
  SB.lesson({
    title: 'Do One Thing Slowly',
    intro:
      'An empty stadium, forty thousand seats and not one person in them, the wind pushing a paper cup across the pitch. Sable Oakridge sits on the team bench in plain clothes, an ordinary jacket and worn-out boots. Once, this whole place chanted their name. ' +
      'Sable: "I\'m not here to be impressive. Let\'s begin." They stand, and look up at the empty stands like they can still hear them. ' +
      'Sable: "When the crowd\'s loud, do one thing slowly. Anything. Breathe, tie a lace. Then battle."',
    choices: [
      ch('"Show me."', taught('Sable kneels and reties one boot, slowly, every loop deliberate, while you count your own breaths beside them. It feels like nothing. Then you battle, and it is not nothing at all. For the run, in boss and rival battles, your Pokémon can\'t be made to flinch on the first turn.')),
      ch('"You were Champion?"', taught('Sable does not look at the empty stands. Sable: "Was. Let\'s begin." And they do, as if the title were a coat they had hung up somewhere and forgotten. For the run, in boss and rival battles, your Pokémon can\'t be made to flinch on the first turn.')),
      ch('"I don\'t get nervous."', taught('Sable smiles, kindly, and says nothing. They just switch on the stadium speakers, and forty thousand recorded voices roar at once, and your hands shake. Sable: "Breathe. Then battle." For the run, in boss and rival battles, your Pokémon can\'t be made to flinch on the first turn.')),
    ],
  }),
  SB.recruit({
    title: 'Calm as Stone',
    intro:
      'Sable watched your last battle from the top row of an empty stand, and when you look up afterwards they are already walking down the steps towards you, unhurried. ' +
      'Sable: "That\'s how a Champion thinks. My old Gym Leader friend has a Pokémon that\'s calm as stone. Take it."',
    choices: [
      take('Sable\'s friend runs a quiet gym in the hills, and the little Pokémon sits in the middle of the floor while everyone else rushes about, perfectly still, watching you. When you hold out your hand it walks over without a flicker of hurry. Sable nods, satisfied.', join({ species: ['gible', 'larvitar', 'dratini'] })),
      notYet(SB, 'Sable shrugs, unbothered. Sable: "Stone keeps." They will ask again when the time is right.'),
    ],
  }),
  SB.story({
    title: 'One Season',
    intro:
      'The stadium again, at night, the floodlights off and only the exit signs glowing green. Sable sits on the bench looking down at their hands, turning them over as if they belonged to someone else. ' +
      'Sable: "I left the title because I stopped enjoying it. I was afraid that meant I\'d stopped being good." A long silence. Then they hold up a letter with the League\'s seal on it, already opened, read many times. ' +
      'Sable: "The League\'s asked me back. One season. Should I?"',
    choices: [
      decide(SB, '"Go back."', 'Sable folds the letter very carefully and puts it in their jacket, over their heart. When you reach the League this run, Sable will be waiting in the Elite Four: a harder League, and a warmer battle than any of the others.', 'league'),
      decide(SB, '"Don\'t."', 'Sable lets out a breath they have been holding for a whole season, and laughs, surprised at how light it feels. The letter goes in the bin by the bench. Sable stays a teacher, and is relieved, and does not hide it.', 'teacher'),
      decide(SB, '"Only if you\'d enjoy it."', 'Sable looks at you for a long time. Then at the dark stadium, as if seeing it for the first time. Sable: "...I think I would. Now." They will be in the Elite Four this run, and their League team will have a Pokémon they have never used before.', 'joy'),
    ],
    remembers: [bramLine('Sable')],
  }),
  SB.room('final', {
    title: 'The Final Lesson',
    intro:
      'The empty stadium, every floodlight on, every seat still empty. Sable stands at the far end of the pitch in their plain jacket with six Poké Balls at their belt: the team that won a Championship, and has not been seen together since. ' +
      'Sable kneels, ties one lace slowly, and stands. Sable: "Your turn. Do one thing slowly. Then battle."',
    choices: [sableFight('Sable\'s Garchomp lands on the pitch with a sound like a dropped stone, and the empty stadium seems to hold its breath.')],
    remembers: [
      variant('joy', [SB.is('joy')], {
        intro:
          'The stadium, every floodlight on. Sable is smiling before the battle even starts, properly, the way you have never seen. Six Poké Balls, the Championship team, and in their pocket a seventh they have only just begun to train. ' +
          'Sable kneels, ties one lace slowly, and stands. Sable: "I\'m enjoying this. Your turn. One thing slowly."',
      }),
      variant('league', [SB.is('league')], {
        intro:
          'The stadium, every floodlight on, League banners already hung for a season Sable has said yes to. They stand at the far end of the pitch with six Poké Balls, the Championship team, back together. ' +
          'Sable kneels, ties one lace slowly, and stands. Sable: "One practice, before the real crowd. Your turn."',
      }),
      variant('teacher', [SB.is('teacher')], {
        intro:
          'The stadium, every floodlight on and every seat empty, exactly as Sable likes it now. They stand on the pitch in their teacher\'s jacket with six Poké Balls, the Championship team, out for one last afternoon. ' +
          'Sable kneels, ties one lace slowly, and stands. Sable: "No crowd. Just us. Your turn."',
      }),
    ],
  }),
  SB.room('farewell', {
    title: 'You Did One Thing Slowly',
    intro:
      'When it is over, Sable recalls their last Pokémon and stands a moment in the floodlights, eyes closed, listening to a crowd that is not there. Then they look at you. ' +
      'Sable: "You did one thing slowly. I saw. Good." They hand you a Champion\'s ribbon, faded gold, and then, after a moment\'s hesitation, the old title cape, folded small.',
    choices: [graduate('The cape is heavier than it looks and smells faintly of an old stadium. Sable does not wait to see you put it on. They sit back down on the bench, retie a lace that did not need retying, and wave you on without looking up.', moment('Sable gave you a Champion\'s ribbon and their old title cape', 70))],
  }),
];


// ---------- B10. Tobias Satchel (items, holding and trading) ----------
const TB = mentorKit('tobias-satchel');
// The doc names the held items, not the species: a team picked to suit them, in the doc's item order.
const TB_TEAM = ['ambipom', 'kangaskhan', 'snorlax', 'breloom', 'conkeldurr', 'ferrothorn'];
const tobiasFight = (text: string): Json => ready(TB, 'Tobias Satchel', TB_TEAM, text);
const tobias: Json[] = [
  TB.lesson({
    title: 'The Price of Not Having It',
    intro:
      'A market stall under a striped awning, the morning crowd jostling past. Tobias leans on the counter with a satchel over one shoulder that clinks every time he moves, and a grin that has sold a great many things. ' +
      'Tobias: "Everything has a price. The good stuff has two." He taps a Berry on the counter between you. Tobias: "The price you pay, and the price of not having it when you need it."',
    choices: [
      ch('"Teach me to trade."', taught('Tobias spends the morning walking you up and down the market, weighing a Leftovers against a Life Orb against your team, until you can see the sums in your head. For the run, shops mark which held items are worth it for your team, and every shop has one item 20% off.')),
      ch('"What\'s the second price?"', taught('Tobias tells you about a Trainer who sold her last Revive to buy a hat, and what happened two routes later. He does not finish the story. He does not need to. For the run, shops mark which held items are worth it for your team, and every shop has one item 20% off.')),
      ch('"Sell me something."', taught('Tobias laughs, delighted, and sells you nothing at all; instead he makes you sell him your own bag, item by item, and tell him why each one is in it. For the run, shops mark which held items are worth it for your team, and every shop has one item 20% off.')),
    ],
  }),
  TB.recruit({
    title: 'Something That Picks Things Up',
    intro:
      'Tobias saw the whole battle from his stall, and he is clapping before your opponent has recalled their last Pokémon. He leans over the counter, and for once there is no sales pitch in his voice. ' +
      'Tobias: "You used that item perfectly. I\'d have charged for that lesson. A friend\'s got a Pokémon that picks things up. You\'ll get along."',
    choices: [
      take('Tobias\'s friend keeps a junk shop two streets over, and the Pokémon is asleep on a heap of odds and ends. It wakes, looks at you, and drops something shiny into your palm by way of hello. Tobias: "See? Already paying its way."', join({ species: ['meowth', 'munchlax', 'linoone'] })),
      notYet(TB, 'Tobias taps his nose. Tobias: "A good trader waits for the right price." He will ask again on market day.'),
    ],
  }),
  TB.story({
    title: 'The Worst Deal I Ever Made',
    intro:
      'Closing time at the market, the awnings coming down all along the street. Tobias sits on an upturned crate patting the satchel at his hip, not counting the day\'s takings for once. ' +
      'Tobias: "My first customer was a girl with no money and a Pokémon with no Berries. I gave her both. Worst deal I ever made." He smiles, but not with the usual grin. ' +
      'Tobias: "She\'s a Gym Leader now. She\'s never come back. I\'d like to know if she remembers."',
    choices: [
      decide(TB, '"Ask her."', 'You take the question to this region\'s Gym Leader yourself. She goes quiet, then fetches a book from her office and opens it: pressed flat between the pages is a Berry, brown with age, his first. She does remember. When you tell Tobias, he does not say a word for a long time.', 'asked'),
      decide(TB, '"Leave it."', 'Tobias looks at you, then down at the satchel, and the real smile comes back slowly. Tobias: "Best deal I ever made." He stands, slings the satchel over his shoulder, and goes back to closing up the stall, whistling.', 'left'),
      decide(TB, '"Bring her to you."', 'It takes some doing, but the next market day she comes to the stall in person. She buys everything on it, every last Berry and bauble. Tobias cries openly behind the counter and insists, to anyone who will listen, that it is allergies.', 'reunion'),
    ],
    remembers: [bramLine('Tobias')],
  }),
  TB.room('final', {
    title: 'The Final Lesson',
    intro:
      'The market after dark, the stalls shuttered and lanterns strung between them. Tobias stands in the middle of the empty street with six Poké Balls laid out on a cloth like goods for sale, and every Pokémon in them holds a perfect item: a Choice Scarf, a Life Orb, Leftovers, a Focus Sash, an Assault Vest, a Rocky Helmet. ' +
      'Tobias: "Final sale. Show me what you\'ve learned to carry."',
    choices: [tobiasFight('Tobias\'s first Pokémon steps forward with a Choice Scarf knotted round its neck, and moves before you have finished blinking.')],
    remembers: [
      variant('asked', [TB.is('asked')], {
        intro:
          'The market after dark, lanterns strung between the shuttered stalls. Tobias has a little book tucked in his breast pocket now, with a pressed Berry inside. Six Poké Balls on a cloth, every Pokémon holding a perfect item: Choice Scarf, Life Orb, Leftovers, Focus Sash, Assault Vest, Rocky Helmet. ' +
          'Tobias: "She remembered. Now let\'s see what you remember."',
      }),
      variant('left', [TB.is('left')], {
        intro:
          'The market after dark, lanterns strung between the shuttered stalls. Tobias is whistling. Six Poké Balls laid out on a cloth, every Pokémon holding a perfect item: Choice Scarf, Life Orb, Leftovers, Focus Sash, Assault Vest, Rocky Helmet. ' +
          'Tobias: "Best deal I ever made, and this is the next one. Show me."',
      }),
      variant('reunion', [TB.is('reunion')], {
        intro:
          'The market after dark, and the stall is bare: she bought everything on it, and Tobias has not restocked for sheer happiness. Six Poké Balls on the empty counter, every Pokémon holding a perfect item: Choice Scarf, Life Orb, Leftovers, Focus Sash, Assault Vest, Rocky Helmet. ' +
          'Tobias: "Last stock I\'ve got. Show me what you\'ve learned."',
      }),
    ],
  }),
  TB.room('farewell', {
    title: 'Good Trader',
    intro:
      'When it is over, Tobias gathers up his six Poké Balls and the empty cloth, and laughs, short and pleased, like a man who has just been beaten on a price and does not mind. ' +
      'Tobias: "You paid both prices. Good trader." He lifts the satchel off his own shoulder, the one that has clinked beside him at every stall you have ever seen him at, and hangs it on yours.',
    choices: [graduate('The satchel settles against your hip as if it has always been there, and it holds more than it should. Tobias gives the strap one last tug to straighten it, then turns away quickly and becomes very busy with his awning.', item('tobias-satchel'), moment('Tobias gave you his satchel', 70))],
  }),
];


// ---------- B11. Vesper Nox (the second plan; setting up and punishing mistakes) ----------
const VN = mentorKit('vesper-nox');
// The doc names no team ("The Final Lesson is Vesper's Elite Four battle"): a Ghost and Dark setup team.
const VN_TEAM = ['sableye', 'mismagius', 'honchkrow', 'weavile', 'chandelure', 'spiritomb'];
const vesperFight = (lv: number, text: string): Json => ready(VN, 'Elite Four Vesper', VN_TEAM, text, { lv, win: [VN.set('final-won')] });
const vesperFinalIntro = (mood: string, line: string): string =>
  `The League. The Elite Four chamber of shadows: black glass floor, candles burning without flame, the long walk from the door to where Vesper sits on a carved chair with her cloak spread round her like a second night. ${mood} ` +
  `Vesper: "${line}"`;
const vesperPromise = (lv: number, text: string): Json => vesperFight(lv, text);
const vesperDecisions = (): Json[] => [
  decide(VN, '"Promise."', 'Vesper looks at you for a long moment, and something in her face goes very still and very bright. She holds out a gloved hand, and you shake it. When you meet her at the League, she will not hold back, and neither will you. Win, and she will be happy.', 'promise'),
  decide(VN, '"I\'ll hold back."', 'Vesper\'s smile does not move, but something behind it does. Vesper: "Then so will I." She inclines her head, perfectly polite, and turns back to the board. She is quietly disappointed, and lets you see it, just for a second.', 'soft'),
];
const vesper: Json[] = [
  VN.lesson({
    title: 'Show Me Your Second Plan',
    intro:
      'A dark lounge at the top of a hotel, velvet and low lamps and the city glittering beyond the glass. Vesper Nox sits cloaked in a deep chair with a chessboard set up in front of her, the pieces already in play against an opponent who left long ago. ' +
      'Vesper: "Don\'t tell me your plan. Show me your second plan." She moves a knight without looking at it. Vesper: "Everyone has a first. Winners have the next."',
    choices: [
      ch('"Teach me."', taught('Vesper spends the evening watching you battle her shadows, and every time your first plan fails she says only "and?" until you have an answer. For the run, the first time each battle an opponent misses, your active Pokémon gets a little stronger.')),
      ch('"What if the first plan works?"', taught('Vesper laughs softly. Vesper: "Then you\'ll have a spare." She makes you build one anyway, and then another behind it. For the run, the first time each battle an opponent misses, your active Pokémon gets a little stronger.')),
      ch('"Play chess."', taught('You sit down opposite her. Vesper wins in nine moves, and smiles: not cruelly, but like someone who has enjoyed every single one of them. Then she shows you where your second plan should have been. For the run, the first time each battle an opponent misses, your active Pokémon gets a little stronger.')),
    ],
  }),
  VN.recruit({
    title: 'Outgrown Me',
    intro:
      'Vesper watched your last battle from the shadow of a doorway, and you only know she was there because of the soft, slow applause when it ends. She steps into the light, cloak whispering. ' +
      'Vesper: "Elegant. I almost didn\'t see it. A Pokémon I raised has outgrown me." Something moves in the shadow behind her, patient and clever.',
    choices: [
      take('The Pokémon slides out of Vesper\'s shadow and into yours as though it has been planning this move for some time. Vesper watches it go with an expression you cannot read, then turns away. Vesper: "Look after its second plan."', join({ species: ['gengar', 'hydreigon', 'zoroark'] })),
      notYet(VN, 'Vesper inclines her head. Vesper: "Patience is a plan too." She will ask again.'),
    ],
  }),
  VN.story({
    title: 'To Lose Well',
    intro:
      'The dark lounge, late, the city lights gone soft with rain. Vesper stands at the window adjusting the clasp of her cloak, again and again, a small nervous movement you have never seen from her. ' +
      'Vesper: "Every challenger who reaches me is better than I was. I teach because I\'d like, once, to lose well." She turns from the glass. ' +
      'Vesper: "I\'m Elite Four. You\'ll meet me at the League. When you do, I\'d like a real battle. No holding back from me, and none from you."',
    choices: [
      ...vesperDecisions(),
      ch('"Why does it matter?"', out('Vesper is silent for so long the rain gets louder. Vesper: "Because losing well is the last thing I haven\'t done." She sits, folds her hands, and waits for your answer.', room(VN.id('story-again')))),
    ],
    remembers: [bramLine('Vesper')],
  }),
  VN.room('story-again', {
    title: 'The Last Thing',
    intro: 'The rain runs down the glass. Vesper sits very still in the deep chair, cloak gathered round her, and the chessboard between you holds a game neither of you is playing. She is waiting, and she will not ask twice.',
    choices: vesperDecisions(),
  }),
  VN.room('final', {
    title: 'The Final Lesson',
    intro: vesperFinalIntro('Six Poké Balls rest in her lap, Ghost and Dark, every one of them built to set up and punish a mistake.', 'Show me your second plan.'),
    choices: [vesperFight(2, 'Vesper\'s Sableye flickers out of the candle-shadow, and the chamber goes darker by a shade.')],
    remembers: [
      variant('promise', [VN.is('promise')], {
        intro: vesperFinalIntro('She rises as you enter, and she is smiling: you promised, and so did she. Six Poké Balls, Ghost and Dark, and nothing held back.', 'A real battle. As promised. Show me everything.'),
        hide: [0],
        add: [vesperPromise(3, 'Vesper sends out her Sableye at full strength, and you can feel the difference before it has even moved.')],
      }),
      variant('soft', [VN.is('soft')], {
        intro: vesperFinalIntro('She does not rise. Six Poké Balls in her lap, Ghost and Dark, and you can tell from the way she holds them that she will keep her word and hold back.', 'As agreed. Let\'s begin.'),
        hide: [0],
        add: [vesperPromise(0, 'Vesper\'s Sableye drifts out of the candle-shadow without hurry. She is holding back, as she said she would.')],
      }),
    ],
  }),
  VN.room('farewell', {
    title: 'That Was the One',
    intro:
      'Vesper recalls her last Pokémon and sits back, cloak pooling round her, and for a while she says nothing at all. Vesper: "Not today. But you never stopped planning. I saw." She unclasps the cloak and holds it out to you, with a Dusk Stone resting in its folds.',
    choices: [graduate('The cloak is lighter than it looks, and warm from her. Vesper sets the Dusk Stone on top of it with one gloved finger, like the last piece on a board. You leave her in the candlelight, already setting up a new game.', item('dusk-stone'), moment('Vesper gave you her cloak', 70))],
    remembers: [
      variant('won', [VN.is('final-won')], {
        intro:
          'Vesper\'s last Pokémon falls, and the candles in the chamber gutter all at once. She sits very still. Then she laughs, softly, wonderingly, and her eyes are bright. ' +
          'Vesper: "Oh. That was it. That was the one. Thank you." She unclasps the cloak and holds it out to you, with a Dusk Stone resting in its folds.',
      }),
    ],
  }),
];


// ---------- B12. Ysolde Marrow (myths, legends and the places they sleep) ----------
const YS = mentorKit('ysolde-marrow');
// "and one Legendary-adjacent (a Regi, if the player has met none)": Registeel; which Legendaries the player has met is not readable yet.
const YS_TEAM = ['bronzong', 'claydol', 'sigilyph', 'cofagrigus', 'golurk', 'registeel'];
const ysoldeFight = (text: string): Json => ready(YS, 'Ysolde Marrow', YS_TEAM, text);
const ysolde: Json[] = [
  YS.lesson({
    title: 'Like Walking into a Church',
    intro:
      'A library in a ruin, half its roof open to the sky and ivy growing through the shelves. Ysolde Marrow sits cross-legged among drifts of scrolls, grey-braided, a magnifying glass on a cord round her neck. ' +
      'She does not look up. Ysolde: "Quiet. The old ones listen better than people do." Only when you have stood still long enough does she raise her eyes. ' +
      'Ysolde: "Walk into a Legendary\'s place like you\'re walking into a church."',
    choices: [
      ch('"Teach me."', taught('Ysolde teaches you how to read a place: the stones left as offerings, the silence birds keep, the paths nobody walks. By dusk you are whispering without meaning to. For the run, every Legendary Sign you find counts for more.')),
      ch('"Have you seen one?"', taught('Ysolde\'s hands go still on the scroll. Ysolde: "Once. Briefly." She says no more, but she teaches you all afternoon like someone who has. For the run, every Legendary Sign you find counts for more.')),
      ch('"Read me a scroll."', taught('Ysolde unrolls one so old it crackles, and reads aloud in a low voice about a bell that rang beneath a mountain and a light that answered from the sea. The ruin seems to lean in to listen. For the run, every Legendary Sign you find counts for more.')),
    ],
  }),
  YS.recruit({
    title: 'What the Third Scroll Said',
    intro:
      'You come back to the ruined library with what you found, and Ysolde reads your face before you speak. She is already pulling a scroll from the shelf, and her hands are trembling a little. ' +
      'Ysolde: "Yes. That\'s what the third scroll said. There\'s a Pokémon that guards a shrine near here. It\'d follow you."',
    choices: [
      take('The shrine is a ring of stones on a hill, and the Pokémon has been standing guard in the middle of it longer than anyone knows. When you step inside the ring it turns, slowly, and follows you out. Ysolde writes it all down.', join({ species: ['bronzong', 'claydol', 'sigilyph'] })),
      notYet(YS, 'Ysolde nods. Ysolde: "It has waited centuries. It can wait a little longer." She will ask again.'),
    ],
  }),
  YS.story({
    title: 'Four Hundred Pages',
    intro:
      'Ysolde clears a table among the scrolls and unrolls a map across it, weighting the corners with books. In the middle, circled over and over in ink, is a stretch of empty coast. ' +
      'Ysolde: "I saw one once, for three seconds, in a storm. I\'ve written four hundred pages since to be sure I didn\'t dream it." She puts her hand flat on the circle, and does not look at you. ' +
      'Ysolde: "You\'ve seen them. Properly. Will you tell me if I was right?"',
    choices: [
      decide(YS, '"You were right."', 'Ysolde: "Oh." She sits down, very suddenly, on a pile of scrolls. She doesn\'t speak for a while. When she finally looks up, she looks thirty years younger, and as if she might cry, and she does not seem to mind either.', 'right'),
      decide(YS, '"I don\'t know which you saw."', 'So she tells you: the shape in the storm, the sound it made, the colour of the light. As she speaks, you realise you know it. It is the very Legendary whose blessing this journey has followed. A Sign, and she has carried it for thirty years.', 'sign'),
      decide(YS, '"Show me the pages."', 'You read all four hundred, by lamplight, while Ysolde pretends to sleep. Her description matches a Legendary you have met yourself, line for line. When you tell her, she adds your account as the last chapter, and the book goes to the printer at last.', 'book'),
    ],
    remembers: [bramLine('Ysolde')],
  }),
  YS.room('final', {
    title: 'The Final Lesson',
    intro:
      'Ysolde takes you to the ring of stones on the hill, where the old guardian once stood. Six Poké Balls hang from her belt on lengths of braided cord, every one a guardian: Bronzong, Claydol, Sigilyph, Cofagrigus, Golurk, and one older than all of them. ' +
      'Ysolde: "Quietly, now. The old ones are watching. Show them."',
    choices: [ysoldeFight('Ysolde\'s Bronzong rises from the grass with a low bell note, and the stones of the ring seem to hum along with it.')],
    remembers: [
      variant('right', [YS.is('right')], {
        intro:
          'The ring of stones on the hill. Ysolde stands straighter than she did, like someone who has finally put down something heavy. Six guardians on braided cords: Bronzong, Claydol, Sigilyph, Cofagrigus, Golurk, and one older than all of them. ' +
          'Ysolde: "I was right. Now show the old ones you are too."',
      }),
      variant('sign', [YS.is('sign')], {
        intro:
          'The ring of stones on the hill, and the sky above it has the same strange light as her story. Six guardians on braided cords: Bronzong, Claydol, Sigilyph, Cofagrigus, Golurk, and one older than all of them. ' +
          'Ysolde: "It\'s watching you, you know. Show it."',
      }),
      variant('book', [YS.is('book')], {
        intro:
          'The ring of stones on the hill. Ysolde has a printed copy of her book under her arm, your chapter marked with a ribbon. Six guardians on braided cords: Bronzong, Claydol, Sigilyph, Cofagrigus, Golurk, and one older than all of them. ' +
          'Ysolde: "One last chapter. Show the old ones."',
      }),
    ],
  }),
  YS.room('farewell', {
    title: 'The Old Ones Would Be Pleased',
    intro:
      'When it is over, Ysolde recalls her guardians one by one, murmuring something to each, and the hum goes out of the stones. She turns to you with her braid coming loose in the wind. ' +
      'Ysolde: "The old ones would be pleased with you. I am." From her satchel she takes a thick bundle of pages tied with string: all four hundred, in her own cramped hand.',
    choices: [graduate('The pages are heavy, and every margin is full of notes on where the old ones sleep and what wakes them. Ysolde rests her hand on the bundle one last time, then on your head, briefly, like a blessing. Then she goes back to her ruin.', item('ysoldes-pages'), moment('Ysolde gave you her four hundred pages', 70))],
  }),
];

export const EVENTS: Json[] = [...marigold, ...ravi, ...sable, ...tobias, ...vesper, ...ysolde];
export const REMOVE: string[] = [];

export const DOC: Record<string, string> = {
  'mentor-marigold-hatch-lesson': 'SF5 B7 Lesson', 'mentor-marigold-hatch-recruit': 'SF5 B7 Recruit', 'mentor-marigold-hatch-story': 'SF5 B7 Story',
  'mentor-marigold-hatch-final': 'SF5 B7 Final Lesson', 'mentor-marigold-hatch-farewell': 'SF5 B7 Final Lesson (last line, gift)',
  'mentor-ravi-ironhand-lesson': 'SF5 B8 Lesson', 'mentor-ravi-ironhand-recruit': 'SF5 B8 Recruit', 'mentor-ravi-ironhand-story': 'SF5 B8 Story',
  'mentor-ravi-ironhand-sea-1': 'SF5 B8 Story (Sail: sea stage 1)', 'mentor-ravi-ironhand-sea-2': 'SF5 B8 Story (Sail: sea stage 2)', 'mentor-ravi-ironhand-sea-3': 'SF5 B8 Story (Sail: sea stage 3, the trawler)',
  'mentor-ravi-ironhand-final': 'SF5 B8 Final Lesson', 'mentor-ravi-ironhand-farewell': 'SF5 B8 Final Lesson (last line, gift)',
  'mentor-sable-oakridge-lesson': 'SF5 B9 Lesson', 'mentor-sable-oakridge-recruit': 'SF5 B9 Recruit', 'mentor-sable-oakridge-story': 'SF5 B9 Story',
  'mentor-sable-oakridge-final': 'SF5 B9 Final Lesson', 'mentor-sable-oakridge-farewell': 'SF5 B9 Final Lesson (last line, gift)',
  'mentor-tobias-satchel-lesson': 'SF5 B10 Lesson', 'mentor-tobias-satchel-recruit': 'SF5 B10 Recruit', 'mentor-tobias-satchel-story': 'SF5 B10 Story',
  'mentor-tobias-satchel-final': 'SF5 B10 Final Lesson', 'mentor-tobias-satchel-farewell': 'SF5 B10 Final Lesson (last line, gift)',
  'mentor-vesper-nox-lesson': 'SF5 B11 Lesson', 'mentor-vesper-nox-recruit': 'SF5 B11 Recruit', 'mentor-vesper-nox-story': 'SF5 B11 Story',
  'mentor-vesper-nox-story-again': 'SF5 B11 Story (Why: the choice again)', 'mentor-vesper-nox-final': 'SF5 B11 Final Lesson', 'mentor-vesper-nox-farewell': 'SF5 B11 Final Lesson (last line, gift)',
  'mentor-ysolde-marrow-lesson': 'SF5 B12 Lesson', 'mentor-ysolde-marrow-recruit': 'SF5 B12 Recruit', 'mentor-ysolde-marrow-story': 'SF5 B12 Story',
  'mentor-ysolde-marrow-final': 'SF5 B12 Final Lesson', 'mentor-ysolde-marrow-farewell': 'SF5 B12 Final Lesson (last line, gift)',
};

// Every story decision flag is read by its mentor's Final Lesson room; these are the other systems the doc says read them later.
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'sable-(league|joy)', readBy: 'Sable in the Elite Four this run, harder League and a warmer battle; joy adds a Pokémon Sable never used (SF5 B9 Story; needs engine: League roster)' },
  { match: 'vesper-(promise|soft)', readBy: 'Vesper\'s real League battle at full strength or held back (SF5 B11 Story; needs engine: League roster). Read now by her Final Lesson room' },
  { match: 'ravi-light', readBy: 'A2\'s lighthouse lamp, if relit (SF5 B8 Story; cross-doc). Read now by Ravi\'s Final Lesson room' },
  { match: 'ysolde-sign', readBy: 'The run\'s blessing-Legendary Sign (SF5 B12 Story; cross-doc, Legendary Signs). Read now by Ysolde\'s Final Lesson room' },
];
