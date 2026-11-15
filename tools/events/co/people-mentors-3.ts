// Catalog Overhaul Pack, people: mentors B2-B6 (STORY_FAMILIES_5.md lines 286-503): Celeste Ribbon, Dax Corvane, Fenwick Eon, Juno Trailwind, Dr. Linden Vale.
// Each mentor follows B1 Brook (people-mentors-2.ts): Lesson, Recruit, Story (catalog ids), and the rooms `final` (the Final Lesson battle,
// opened by MS12 "Nothing Left to Teach") and `farewell` (the last line and the gift, opened by the battle, win or lose). Kit: tools/events/co/_mentors.ts.
// Build: npm run co:build -- people-mentors-3
import { again, ch, fight, item, join, out, room, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, spar, variant } from './_people.ts';
import { bondJoin, bramLine, graduate, lesson, M, mentorKit, trust } from './_mentors.ts';

export const CATEGORY = CAT;

type Kit = ReturnType<typeof mentorKit>;
/** A Lesson outcome that counts: the arc step, the mentor's bonus (core/mentors/lessons.ts), the old meters. */
const taught = (text: string, ...extra: Json[]): Json => out(text, M.set('lesson'), lesson(), ...extra, trust(4, 2));
/** A Story decision: the doc's flag, the arc step, the old meters. */
const decided = (K: Kit, flag: string, text: string, ...extra: Json[]): Json => out(text, K.set(flag), M.set('story'), ...extra, trust(5, 3));
/** "Not yet": the Recruit comes round again. */
const notYet = (K: Kit, text: string): Json => ch('"Not yet."', out(text, again(K.id('recruit')), trust(0, 1)));
/** The Final Lesson: one "Ready." choice, a friendly battle whose win and lose both open the farewell. */
const finalFight = (K: Kit, name: string, text: string, o: { team?: string[]; size?: number; lv?: number; mirror?: boolean }): Json =>
  ch('"Ready."', fight(text, spar(name, {
    size: 6, lv: 2, ...o,
    win: [moment(`You passed ${K.who}'s Final Lesson`), room(K.id('farewell'))],
    lose: [moment(`${K.who}'s Final Lesson beat you, and you still graduated`), room(K.id('farewell'))],
  })));

// ---------- B2. Celeste Ribbon (showmanship, charm, status play) ----------
const C = mentorKit('celeste-ribbon');
const celeste: Json[] = [
  C.lesson({
    title: 'The Audience Is Watching',
    intro:
      'An empty contest hall, every seat folded up, dust turning slowly in the stage lights somebody left on. Celeste stands alone in the middle of the boards in a sequinned coat that throws little stars across the walls, and she is bowing, deeply and gracefully, to nobody at all. ' +
      'Celeste: "Chin up. The audience is watching, even when it\'s empty." She straightens, and catches your eye in the mirror at the back of the hall. Celeste: "Status moves are how you control the stage. Make them look at what you want them to see."',
    choices: [
      ch('"Show me."', taught('Celeste claps once, delighted, and the afternoon becomes a performance: a wave of the hand that makes your eyes slide left, a sparkle that hides a step, a song timed to the half-beat. By the end you can feel the stage tilt your way. For the run, your status moves land more often.')),
      ch('"I just want to win."', taught('Celeste laughs, not unkindly, and taps your chin up with one gloved finger. Celeste: "Darling, winning is a performance." She teaches you anyway, every trick of misdirection she knows. For the run, your status moves land more often.')),
      ch('"Bow with you."', taught('You step onto the boards beside her and bow to the empty seats, and your Pokémon bow too, a little crooked. Celeste\'s eyes go bright. She teaches you everything after that like you were family, and your team glows from the attention. For the run, your status moves land more often.', bond(1, 'party'))),
    ],
  }),
  C.recruit({
    title: 'A Pokémon That Dances',
    intro:
      'Celeste watched the whole battle from the fence, and she applauded every turn, even the bad ones. When it is over she sweeps over in the sequinned coat, eyes shining like the hall lights. ' +
      'Celeste: "Darling, that was a performance. I know someone with a Pokémon that dances."',
    choices: [
      ch('"Meet them."', out('Celeste\'s friend runs a little dance studio above a bakery, and the Pokémon is already mid-twirl when you come up the stairs. It finishes the turn, looks straight at you, and bows. It has chosen its next partner, and it is you.', join({ species: ['lopunny', 'primarina', 'gardevoir'] }), M.set('recruit'), trust(1, 2))),
      notYet(C, 'Celeste blows a kiss at the air. Celeste: "Then they\'ll keep rehearsing until you\'re ready." The offer will come round again.'),
    ],
  }),
  C.story({
    title: 'Shaking Is Allowed',
    intro:
      'Backstage at a small-town contest, after everyone has gone. Celeste sits on an upturned crate with the coat across her knees, and without the lights on her she looks smaller, older, more real. She holds up one hand and watches it. ' +
      'Celeste: "I won my third Festival with a shaking hand. Nobody saw. I teach so others know shaking is allowed." She folds the hand away in her lap. Celeste: "They\'ve asked me to judge the Grand Festival this year. I\'m terrified."',
    choices: [
      ch('"Judge it."', decided(C, 'judge', 'Celeste breathes out slowly, then nods, and something steadies in her face. She will sit at the judges\' table at the Grand Festival, and she promises you one thing: when you take the stage, she will score you honestly, even if it breaks her heart.')),
      ch('"Perform instead."', decided(C, 'perform', 'Celeste stares at you, then bursts out laughing, and the laugh turns into something fierce. She will not judge. She will enter. If you reach the end of the Grand Festival, the last performer standing between you and the ribbon will be her.')),
      ch('"Say no."', decided(C, 'rest', 'For a long moment Celeste says nothing at all. Then she reaches over and squeezes your hand, and hers is shaking, and she lets you feel it. Celeste: "Thank you for letting me." She writes the refusal that night, and sleeps well.')),
    ],
    remembers: [bramLine('Celeste')],
  }),
  C.room('final', {
    title: 'The Final Lesson',
    intro:
      'Celeste brings you back to the empty contest hall, and this time every stage light is on. She takes her place at centre stage in the sequinned coat, six Poké Balls at her belt, and bows to the seats before she bows to you. ' +
      'Celeste: "Chin up, darling. The audience is watching."',
    choices: [finalFight(C, 'Celeste Ribbon', 'Celeste sends out her Gardevoir with a flourish, and the hall fills with glitter that hides as much as it shows. Every move she makes is meant to make you look the wrong way.', { team: ['gardevoir', 'togekiss', 'milotic', 'sylveon', 'mimikyu', 'lopunny'] })],
  }),
  C.room('farewell', {
    title: 'Wonderful',
    intro:
      'When the last glitter settles, Celeste calls back her Lopunny and stands very still in the light. Then she crosses the stage to you and takes your hand, the one that held your Poké Balls, and holds it between both of hers. ' +
      'Celeste: "Your hand shook on turn two. I saw. Nobody else did. Wonderful." She unpins a faded ribbon from inside her coat, her own Festival ribbon, and presses it into your palm with a Pretty Feather.',
    choices: [graduate('You pin the ribbon on, and Celeste fixes it so it sits straight, and then she bows to you, deeply, the way she bowed to the empty seats. Your hand is shaking a little. That is allowed.', item('pretty-feather'), moment('Celeste gave you her own Festival ribbon', 70))],
  }),
];

// ---------- B3. Dax Corvane (learning by being beaten) ----------
const D = mentorKit('dax-corvane');
const daxSpar = (text: string): Json =>
  fight(text, spar('Dax', { team: ['scraggy', 'mankey'], size: 2, lv: 1, win: [moment('You beat Dax the first time you met')], lose: [moment('Dax beat you, and told you to learn from it')] }), M.set('lesson'), lesson(), trust(4, 2));
const dax: Json[] = [
  D.lesson({
    title: 'This Is a Rivalry',
    intro:
      'A field gate at the edge of town. A lanky trainer in a battered cap sits on the top rail of the fence, swinging one boot, and you have never seen him before, but he is looking at you like he has been waiting. ' +
      'Dax: "Don\'t smile. This is a rivalry, not a lesson." He drops off the fence and lands lightly. Dax: "We battle. You lose. You learn. Again."',
    choices: [
      ch('"Battle."', daxSpar('Dax grins for half a second, then hides it. He sends out his team and does not hold back, not even a little.')),
      ch('"Why don\'t you lose?"', daxSpar('Dax looks at you for a long moment, like the question is a door he did not know was there. He does not answer it. He just sends out his team.')),
      ch('"I\'ll win."', daxSpar('Dax\'s face lights up, fierce and glad, like you finally said something worth hearing. He sends out his team before you finish the sentence.')),
    ],
  }),
  D.recruit({
    title: 'Too Stubborn for Her',
    intro:
      'Dax is waiting by the route sign after your battle, arms crossed, cap pulled low. He kicks a stone. He clearly hates what he is about to say. ' +
      'Dax: "Fine. That was… good. Don\'t let it go to your head. There\'s a kid with a Pokémon too stubborn for her. It\'d suit you."',
    choices: [
      ch('"Meet her."', out('The kid is about nine and very tired, and her Pokémon is sitting in the middle of the path refusing to move for anyone. It looks at you. You look at it. Neither of you blinks. Then it gets up and walks to your side like that was its idea all along, and it was.', bondJoin(5, { species: ['tauros', 'pangoro', 'scrafty'] }), M.set('recruit'), trust(1, 2))),
      notYet(D, 'Dax shrugs like he does not care, which means he does. Dax: "It\'s not going anywhere. It\'s too stubborn." The offer will come round again.'),
    ],
  }),
  D.story({
    title: 'Real',
    intro:
      'A rooftop above a battle club, late, the city lights coming on below. Dax sits on the edge with his cap in his hands, turning it round and round. He does not look at you while he talks. ' +
      'Dax: "I lost to you and I was furious for a week. Then I realised I\'d never been that interested in anything before." The cap stops turning. Dax: "I\'ve been asked to coach a team. Real. I\'d have to stop battling you."',
    choices: [
      ch('"Take the job."', decided(D, 'coach', 'Dax lets out a breath that sounds like it hurts. Then he puts the cap back on, and when he looks at you his eyes are wet and he is grinning. He takes the job. One day, his students will be the ones standing across the field from you.')),
      ch('"Keep battling me."', decided(D, 'rival', 'Dax goes very still, and then he grins, the real one, all teeth. He turns the job down that night. When the Final Lesson comes, he will bring the hardest battle he has ever built, and he will build it just for you.')),
      ch('"Do both."', decided(D, 'both', 'Dax laughs out loud, like you dared him. He takes the job and keeps battling you, and within a week he is so tired he falls asleep standing up. When the Final Lesson comes he will be one Pokémon short, and he will laugh about it.')),
    ],
    remembers: [bramLine('Dax')],
  }),
  D.room('final', {
    title: 'The Final Lesson',
    intro:
      'The same field gate where you met, the same fence. Dax is sitting on the top rail again, and when he sees you he drops off it without a word. Six Poké Balls at his belt. He has been studying your team for weeks. ' +
      'Dax: "Don\'t smile. We battle. You lose. Again."',
    choices: [finalFight(D, 'Dax', 'Dax sends out his team, and your stomach drops: it is your team, every one of them, one level stronger, mirrored move for move. He learned you by heart.', { mirror: true, lv: 1 })],
    remembers: [
      variant('rival', [D.is('rival')], {
        intro:
          'The same field gate, the same fence, and Dax is waiting with his cap on backwards, the way he wears it when he means it. He turned down a real job for this battle, and it shows in every line of him. ' +
          'Dax: "Don\'t smile. This is a rivalry, not a lesson."',
        hide: [0],
        add: [finalFight(D, 'Dax', 'Dax sends out his team, and it is yours, every one of them, mirrored and pushed past anything you have faced from him. This is the hardest battle he has ever built.', { mirror: true, lv: 3 })],
      }),
      variant('both', [D.is('both')], {
        intro:
          'The field gate. Dax is half asleep on the fence, a clipboard from his coaching job still under one arm. He jerks awake when you arrive and counts the Poké Balls on his belt, and frowns, and counts again. Five. ' +
          'Dax: "Don\'t smile. Five is plenty."',
        hide: [0],
        add: [finalFight(D, 'Dax', 'Dax sends out his team: your own Pokémon, mirrored, one level stronger, and one short. He laughs about it the whole way through, and he is still dangerous.', { mirror: true, lv: 1, size: 5 })],
      }),
    ],
  }),
  D.room('farewell', {
    title: 'Not the Last Time',
    intro:
      'When it is over, Dax stands for a long time with his hands in his pockets, looking at the ground between you. Then he pulls off his battered old cap and jams it on your head, and drops a Choice Band into your hand like it is nothing. ' +
      'Dax: "That\'s the last time I teach you. Not the last time I beat you."',
    choices: [graduate('The cap is too big and smells of field grass. Dax climbs back onto the fence and does not look at you as you go, but you hear him laugh, once, behind you.', item('choice-band'), moment('Dax gave you his old cap', 70))],
  }),
];

// ---------- B4. Fenwick Eon (evolution timing and forms) ----------
const F = mentorKit('fenwick-eon');
const fenwick: Json[] = [
  F.lesson({
    title: 'A Wall of Strings',
    intro:
      'A cottage at the end of a lane, smelling of tea and old paper. One whole wall is covered in pinned strings, dozens of them, every one a different colour, and most have a little knot tied somewhere along their length. Fenwick, grey-haired and soft-spoken, is watching your Pokémon with the patience of someone watching a kettle. ' +
      'Fenwick: "There\'s a form in there. Be patient with it." He runs a finger along the strings. Fenwick: "Each string\'s a Pokémon I\'ve known. Each knot\'s when it evolved. Some have no knot."',
    choices: [
      ch('"Show me how to time it."', taught('Fenwick pulls up two chairs and shows you the strings one by one: this one evolved too early and was always a little sorry, this one waited and grew strong in the waiting. By the time the tea is cold you understand. For the run, a Pokémon you hold back from evolving grows stronger while it waits.')),
      ch('"Why no knot?"', taught('Fenwick touches a pale blue string with no knot on it, and his voice goes very gentle. Fenwick: "Some don\'t need to." He does not say more, but he teaches you the rest of it kindly. For the run, a Pokémon you hold back from evolving grows stronger while it waits.')),
      ch('"Tie a string for mine."', taught('Fenwick\'s face lights up. He chooses a colour for your starter with great care, pins a new string to the wall, and leaves room on it for a knot. Your starter watches the whole thing and leans against your leg. For the run, a Pokémon you hold back from evolving grows stronger while it waits.', bond(1), moment('Fenwick pinned a string for your starter on his wall'))),
    ],
  }),
  F.recruit({
    title: 'Ready to Choose',
    intro:
      'Fenwick has been watching one of your Pokémon all through the battle, and when it ends he grabs your sleeve, eyes wide behind his glasses. ' +
      'Fenwick: "Oh! It\'s starting. Do you see? I know a breeder with an Eevee who\'s ready to choose."',
    choices: [
      ch('"Meet it."', out('The breeder\'s yard is full of stones and leaves and little dishes of water, and in the middle of it all an Eevee sits looking at each one in turn, like it cannot decide. Then it looks at you, and stops looking at anything else.', join({ species: ['eevee'] }), M.set('recruit'), trust(1, 2))),
      notYet(F, 'Fenwick smiles and lets go of your sleeve. Fenwick: "It\'ll wait. They\'re good at waiting." The offer will come round again.'),
    ],
  }),
  F.story({
    title: 'Some Have No Knot',
    intro:
      'Evening in the cottage, the lamp lit, the wall of strings throwing long shadows. Fenwick stands in front of the pale blue string, the one with no knot, and touches it with two fingers like it might still be warm. ' +
      'Fenwick: "My Eevee never evolved. I used to think I failed it. Now I think it just didn\'t need to." He turns, and he is looking at your Eevee, and his voice cracks a little. Fenwick: "Yours. The Eevee I found you. Would you… would you let it stay as it is? For me? You don\'t have to."',
    choices: [
      ch('"I won\'t evolve it."', decided(F, 'kept', 'Fenwick covers his mouth with his hand and nods, and nods. He kneels and holds your Eevee for a long time, and when he lets go it carries itself differently, taller, sure of itself. He teaches it Last Resort before you leave, the move his own Eevee loved best.', { kind: 'statBoost', stat: 'all', percent: 10, who: 'picked', until: 'run' }, { kind: 'teachMove', move: 'last-resort', species: 'eevee' }), { requires: [{ kind: 'partySpecies', species: 'eevee' }], pick: { types: ['normal'] } }),
      ch('"It\'s its choice."', decided(F, 'choice', 'Fenwick goes quiet, and then he smiles, the slow, wondering smile of someone who has just been taught something. Fenwick: "Yes. Of course. It\'s its choice." When the next chance to evolve comes, your Eevee will decide for itself: to grow into what your party needs, or to stay.')),
      ch('"I\'ll evolve it."', decided(F, 'evolved', 'Fenwick does not flinch. He just nods, and reaches for a new string. Fenwick: "Of course. It\'s yours." He is not hurt, and you can see that he means it. He ties a knot in it, ready for the day, and pins it next to the pale blue one.', moment('Fenwick tied a knot for your Eevee'))),
    ],
    remembers: [bramLine('Fenwick')],
  }),
  F.room('final', {
    title: 'The Final Lesson',
    intro:
      'Fenwick leads you out into the cottage garden at dusk, past the window where the strings hang. He carries seven Poké Balls, not six, and he holds the last one in both hands before he clips it to his belt. ' +
      'Fenwick: "Every form there is. And one that never needed one. Show me yours."',
    choices: [finalFight(F, 'Fenwick Eon', 'Fenwick sends out his Eeveelutions one by one, each a different answer to the same question. And last of all, waiting at his feet, his own old Eevee, grey around the muzzle, unevolved.', { team: ['espeon', 'umbreon', 'vaporeon', 'jolteon', 'flareon', 'sylveon', 'eevee'], size: 7 })],
  }),
  F.room('farewell', {
    title: 'It Never Needed To',
    intro:
      'His old Eevee lies down in the grass beside him when it is over, tired and content, and Fenwick sits down with it and strokes its ears. When he looks up at you his eyes are full. ' +
      'Fenwick: "It never needed to. Neither do you. But you can." He holds out an Everstone, a length of pale blue string knotted round it.',
    choices: [graduate('You take the stone, and the string is soft from years of handling. Fenwick goes back inside to pin a new string on his wall. When you look back through the window, there is a knot in it already.', item('everstone'), moment('Fenwick tied a knot of string round an Everstone for you', 70))],
  }),
];

// ---------- B5. Juno Trailwind (shortcuts, hidden spots, rare finds) ----------
const J = mentorKit('juno-trailwind');
const junoTaught = 'For the run, the map shows you where hidden things lie once you are within two steps of them.';
const junoFound = (text: string): Json => out(text, J.set('found'), moment('You found the old Stoutland that walked Juno out of the mountains'), trust(5, 3));
const juno: Json[] = [
  J.lesson({
    title: 'The Road Doesn\'t Wait',
    intro:
      'A trailhead at dawn, a wooden sign pointing three directions, mist still lying in the valley below. Juno is sitting on a rock re-lacing her boots, sun-browned and wind-creased, her pack already on. She does not look up. ' +
      'Juno: "Boots on. The road doesn\'t wait." She yanks the laces tight and stands, squinting at the path. Juno: "Look down, look up, look sideways. Treasure hides in all three."',
    choices: [
      ch('"Show me."', taught(`Juno sets off at a pace that makes your calves burn, and the whole way she points: a bent branch, a scuffed stone, a glint under a root. By noon you are seeing them before she points. ${junoTaught}`)),
      ch('"Race you."', taught(`Juno grins and is gone before you finish the word. You lose, badly, but on the way you trip over three things she left for you to find, and you start to see how she sees. ${junoTaught}`)),
      ch('"What\'s the best thing you ever found?"', taught(`Juno stops on the path, and for a second her face goes somewhere far away. Juno: "A way out." She does not explain yet. She just walks on, and teaches you to look. ${junoTaught}`)),
    ],
  }),
  J.recruit({
    title: 'Only to People Who Look',
    intro:
      'Juno crouches at the edge of a valley after your battle, running her fingers over a mark in the mud too fresh to be old and too strange to be ordinary. She looks up at you with something like pride. ' +
      'Juno: "Now you\'re reading the ground. Good. There\'s a Pokémon in this valley that only shows itself to people who look."',
    choices: [
      ch('"Find it."', out('You look down, up and sideways, and on the third hour, in a hollow under a fallen tree, you find it, watching you like it has been waiting for someone to notice. It does not run. It steps out of the shadow and comes to you.', join({ species: ['absol', 'lapras', 'dratini', 'larvitar', 'riolu'] }), M.set('recruit'), trust(1, 2))),
      notYet(J, 'Juno shrugs and stands. Juno: "It\'ll still be hiding. That\'s what it does." The offer will come round again.'),
    ],
  }),
  J.story({
    title: 'Nine Days',
    intro:
      'A campfire on a ridge, the last light going purple. Juno is tracing a route in the dirt with a stick, the same route, over and over, and she does not seem to know she is doing it. ' +
      'Juno: "I was lost for nine days once. A wild Pokémon walked me out. I\'ve been paying it back ever since." The stick stops. Juno: "It was a Stoutland. Old. I think it\'s still up there. I\'ve never gone back. Scared it won\'t be."',
    choices: [
      ch('"Let\'s go look."', out('Juno looks at you for a long time across the fire. Then she rubs out the route in the dirt with her boot and picks up her pack. Juno: "First light." The mountain is three days of climbing.', M.set('story'), room(J.id('mountain-1')))),
      ch('"Go alone."', decided(J, 'alone', 'Juno nods slowly, like she knew that was the answer. She is gone before you wake. Three days later she comes back down the trail, eyes red and smiling, with a sleepy pup tucked inside her jacket, and she does not say a word about what she found. She does not need to.')),
      ch('"Leave it as a good memory."', decided(J, 'memory', 'Juno is quiet for a long time, watching the fire. Juno: "...Yeah." She puts the stick down. She does not say thank you, but she sits a little closer, and she is grateful.')),
    ],
    remembers: [bramLine('Juno')],
  }),
  J.room('mountain-1', {
    title: 'The Scree Slope',
    intro:
      'The first day is loose stone and thin air, the path Juno took nine days lost twenty years ago gone under rockfall. She stops at a fork and stares at it, and for the first time since you have known her, she does not know which way to go. ' +
      'Juno: "It was different then. Everything was."',
    choices: [
      ch('"Look down."', out('You crouch and find it: an old claw scrape on the stone, worn almost smooth, pointing left. Juno touches it and has to look away. You climb on.', room(J.id('mountain-2')))),
      ch('"Follow the stream."', out('You follow the sound of water, because a lost thing goes downhill and a guide goes up it. Juno laughs, startled. Juno: "That\'s what I\'d have said." You climb on.', room(J.id('mountain-2')))),
    ],
  }),
  J.room('mountain-2', {
    title: 'The Cold Night',
    intro:
      'The second night you camp under an overhang while the wind howls past, and Juno cannot sleep. She sits at the mouth of the shelter with her arms round her knees, looking up at the dark peak. ' +
      'Juno: "What if it\'s gone? What if I\'m too late?"',
    choices: [
      ch('"Then you came anyway."', out('Juno does not answer. But after a while she lies down, and she sleeps, and in the morning she is the first one up, boots already laced.', room(J.id('mountain-3')))),
      ch('Sit with her.', out('You sit beside her and say nothing at all, and your Pokémon curl up against you both. Some time before dawn her head drops onto your shoulder. In the morning she does not mention it.', room(J.id('mountain-3')))),
    ],
  }),
  J.room('mountain-3', {
    title: 'It Knows Her',
    intro:
      'The third day, near the top, the path opens into a high meadow full of wind and little white flowers. There is a den under a leaning pine. And lying in front of it in the sun, grey to the tips of its ears, is a very old Stoutland, with three tumbling grandpups climbing over its back. ' +
      'Its head comes up. Its nose works. Juno stops dead, and her pack slides off one shoulder.',
    choices: [
      ch('"Go on."', junoFound('Juno walks forward, one step, two, and the old Stoutland gets up, slow and stiff, and walks to meet her. It puts its great grey head against her chest. It knows her. Juno sinks down into the flowers and holds on, and the grandpups pile into her lap.')),
      ch('Stay back.', junoFound('You stay at the edge of the meadow and let her go alone. You watch the old Stoutland get up and cross the grass to her, slow and certain. It knows her. When she finally looks back at you, she is laughing and crying at once, a pup chewing her bootlace.')),
    ],
  }),
  J.room('final', {
    title: 'The Final Lesson',
    intro:
      'Juno meets you at a trailhead in the last region, a wooden sign pointing three ways, boots already laced. Six Poké Balls ride on the straps of her pack, every one of them fast and hard to pin down. ' +
      'Juno: "Boots on. Show me what you\'ve learned to see."',
    choices: [finalFight(J, 'Juno Trailwind', 'Juno sends out her Talonflame in a streak of fire, and from the first turn her team is everywhere you are not looking.', { team: ['talonflame', 'zoroark', 'lycanroc', 'whimsicott', 'noivern', 'crobat'] })],
    remembers: [
      variant('found', [J.is('found')], {
        intro:
          'Juno meets you at a trailhead in the last region, and at her side, moving slow but sure, is the old grey Stoutland from the mountain, come down to see her off. Six Poké Balls on her pack straps; the first one is new. ' +
          'Juno: "It wanted to come. Boots on."',
        hide: [0],
        add: [finalFight(J, 'Juno Trailwind', 'Juno sends out the old Stoutland first, and it plants its feet and looks at you with tired, knowing eyes. Behind it, her fast team waits to strike from every side.', { team: ['stoutland', 'talonflame', 'zoroark', 'lycanroc', 'whimsicott', 'noivern'] })],
      }),
    ],
  }),
  J.room('farewell', {
    title: 'Where to Look',
    intro:
      'When it is over, Juno sits down on the trailhead rock and starts re-lacing her boots, the way she did the first morning. She does not look up for a while. When she does, she is smiling. ' +
      'Juno: "You found the way. I just showed you where to look." She digs in her pack and tosses you a battered Itemfinder, its casing scratched from a hundred trails.',
    choices: [graduate('The Itemfinder hums in your hand, already pointing somewhere. Juno shoulders her pack, nods once, and sets off up the trail without saying goodbye. The road doesn\'t wait.', item('itemfinder'))],
  }),
];

// ---------- B6. Dr. Linden Vale (studying Pokémon so battles are never a surprise) ----------
const L = mentorKit('linden-vale');
const lindenTaught = 'For the run, you see the move each opponent means to open with before you choose your own.';
const linden: Json[] = [
  L.lesson({
    title: 'Watch the Feet',
    intro:
      'A long grass field, bees in the clover. A man in a rumpled coat lies on his stomach in the grass with a sketchbook, pencil flying, utterly absorbed in a wild Pokémon twenty paces off. He holds up one hand without looking round. ' +
      'Linden: "Hold still, I want to sketch that stance." The pencil scratches. Then he rolls over and grins at you, grass in his hair. Linden: "Every Pokémon tells you what it\'ll do before it does it. Watch the feet."',
    choices: [
      ch('"Teach me."', taught(`Linden hands you a spare pencil and makes you sketch until your hand cramps: the shift of weight before a leap, the tail that lifts before a charge. By evening you are seeing it before it happens. ${lindenTaught}`)),
      ch('"Sketch my starter."', taught(`Linden\'s eyes light up. He sketches your starter from six angles, muttering, and shows you every one: the little tell before it attacks, the one before it dodges. Your starter is very proud of its portrait. ${lindenTaught}`)),
      ch('"Is this about the Deltas?"', taught(`Linden goes still, then laughs, and taps the pencil against his teeth. Linden: "Everything\'s about the Deltas, eventually." He does not explain. He teaches you to watch the feet, and his notebook stays closed. ${lindenTaught}`)),
    ],
  }),
  L.recruit({
    title: 'Hard to Predict',
    intro:
      'Linden watched your whole battle with his notebook open, ticking things off, and by the end he is practically bouncing. ' +
      'Linden: "Fascinating! You did exactly what the data said you would. Here, a colleague found a Pokémon that\'s hard to predict. It\'ll keep you honest."',
    choices: [
      ch('"Take it."', out('Linden\'s colleague hands the Pokémon over with visible relief and a page of notes that just says "???" in three different inks. It looks at you, and you have no idea what it will do next. Linden is delighted.', join({ species: ['ditto', 'porygon'] }), M.set('recruit'), trust(1, 2))),
      notYet(L, 'Linden scribbles a note. Linden: "Predictable. I like it." The offer will come round again.'),
    ],
  }),
  L.story({
    title: 'Results and Answers',
    intro:
      'Linden\'s field camp at night, a lantern hanging from a branch, pages of notes held down with stones. He closes the notebook slowly, both hands flat on its cover, like he is keeping something in. ' +
      'Linden: "The lab wanted results. I wanted answers. They weren\'t the same thing, so I left." He looks at the lantern, not at you. Linden: "They want me back. They\'ve funded the Delta work. If I go, it\'ll be published. Properly. With their name on it."',
    choices: [
      // TODO(new item): the Delta Lens (D1, The Delta Study) is given here at once; no item exists yet.
      ch('"Go back."', decided(L, 'lab', 'Linden is quiet a long time. Then he nods, once, and opens the notebook again. Linden: "Then you should have this now." He gives you the Delta Lens from his study, early, no matter how far along you are, so the work goes on even if he goes back.')),
      ch('"Publish it yourself."', decided(L, 'self', 'Linden blinks at you, then laughs, startled and young. He writes it himself, by lantern light, and when he shows you the first page your name is in it, in the thanks, in his own careful hand.')),
      ch('"Don\'t publish."', decided(L, 'kept', 'Linden looks down at the notebook for a long time. Linden: "Some answers should be kept." He ties the cover shut with a string. Every place the Deltas live stays a secret, and stays safe.')),
    ],
    remembers: [bramLine('Linden')],
  }),
  L.room('final', {
    title: 'The Final Lesson',
    intro:
      'Linden waits in the long grass field where you met, the sketchbook under his arm, six Poké Balls at his belt. He has been watching you for a whole run, and the notebook is full. ' +
      'Linden: "I\'ve predicted every move you\'ll make. Prove me wrong."',
    choices: [finalFight(L, 'Dr. Linden Vale', 'Linden sends out his Alakazam with the notebook open in his other hand, and every move his team makes is an answer to a question you have not asked yet.', { team: ['alakazam', 'porygon-z', 'metagross', 'bronzong', 'reuniclus', 'magnezone'] })],
  }),
  L.room('farewell', {
    title: 'Don\'t Tell Me',
    intro:
      'When it is over, Linden closes the notebook and stands looking at it for a while. Then he holds it out to you, the whole thing, every page of sketches and tells and scribbled answers. ' +
      'Linden: "I predicted you\'d win. Don\'t tell me if I was wrong."',
    choices: [graduate('The notebook is heavy and warm from his hands. On the first page, in careful pencil, is a sketch of you, watching the feet. Linden waves you off and lies back down in the grass to sketch the next thing.', item('lindens-notebook'))],
  }),
];

export const EVENTS: Json[] = [...celeste, ...dax, ...fenwick, ...juno, ...linden];
export const REMOVE: string[] = [];

const docOf = (n: string, mentor: string, extra: Record<string, string> = {}): Record<string, string> => ({
  [`mentor-${mentor}-lesson`]: `SF5 ${n} Lesson`, [`mentor-${mentor}-recruit`]: `SF5 ${n} Recruit`, [`mentor-${mentor}-story`]: `SF5 ${n} Story`,
  [`mentor-${mentor}-final`]: `SF5 ${n} Final Lesson`, [`mentor-${mentor}-farewell`]: `SF5 ${n} Final Lesson (last line, gift)`, ...extra,
});
export const DOC: Record<string, string> = {
  ...docOf('B2', 'celeste-ribbon'),
  ...docOf('B3', 'dax-corvane'),
  ...docOf('B4', 'fenwick-eon'),
  ...docOf('B5', 'juno-trailwind', {
    'mentor-juno-trailwind-mountain-1': 'SF5 B5 Story (Look: mountain node 1)', 'mentor-juno-trailwind-mountain-2': 'SF5 B5 Story (Look: mountain node 2)', 'mentor-juno-trailwind-mountain-3': 'SF5 B5 Story (Look: mountain node 3)',
  }),
  ...docOf('B6', 'linden-vale'),
};

export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'celeste-(judge|perform|rest)', readBy: 'SF14.5 Grand Festival: Celeste judges, performs as the final opponent, or rests (cross-doc, not built)' },
  { match: 'dax-coach', readBy: 'Dax\'s students on the Roster in later runs (cross-run, not built); the Final Lesson uses the default mirror room' },
  { match: 'fenwick-(kept|choice|evolved)', readBy: 'Fenwick\'s Eevee: kept = stays an Eevee all run, choice = evolves into what the party needs at the next chance (needs engine); evolved has no later reader' },
  { match: 'juno-(alone|memory)', readBy: 'Juno\'s Story endings; the Final Lesson uses the default room (only juno-found changes it)' },
  { match: 'linden-(lab|self|kept)', readBy: 'D1 The Delta Study: the Delta Lens at once, the paper with the player\'s name (D1 afterstory), Delta habitats protected for the save (cross-doc / cross-run, not built)' },
];
