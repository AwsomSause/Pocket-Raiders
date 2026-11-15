// Catalog Overhaul Pack: STORY_FAMILIES_1.md, SF2 The Apprentice, SF3 The Farmer Who Forgets, SF4 The Elder's Last Wish,
// SF5 Wicker's Cart (with the Wandering Merchant), SF6 The Pen Pal. Build: npm run co:build -- families-a-2.
import { $, any, ch, companion, fight, flag, flagAgo, flagAt, fr, isEvil, isGood, item, join, lv, money, out, room, tail, trainer, wild, BERRIES, HELD, takeNode, type Json } from '../dsl.ts';
import { buy, is, kind, later, moment, not, region, safe, sly, sub, trust, v } from './_fa.ts';

export const CATEGORY = 'families-a';

// =====================================================================================================================
// SF2. THE APPRENTICE. The Record is the Good and Evil meter: kind acts raise it, sly acts lower it.
// =====================================================================================================================
const tibTeam = (o: { team: string[]; cls?: string; lv?: number; win?: Json[] }): Json => safe(trainer('Tib', { cls: o.cls ?? 'youngster', team: o.team, size: o.team.length, lv: o.lv ?? 0, win: [flag('apprentice-mirror-done'), room('apprentice-after'), ...(o.win ?? [])] }), flag('apprentice-mirror-done'), room('apprentice-after'));

function mirror(id: string, easy: boolean): Json {
  const b = easy ? -1 : 1;
  const easyLine = easy ? ' You notice, a few turns in, that Tib never once aims at your weakest Pokémon. Somebody taught Tib to go easy. Somebody is being gone easy on.' : '';
  return sub('apprentice-follows', id, 'The Mirror Battle', 'A trainer blocks a bridge. Older now. Taller than you remember, cap worn the way you wear yours, feet set the way you set yours. Tib. A Furret stands on its hind legs at Tib\'s knee and looks you over like a judge. Tib: "I did everything you did. Was it enough?"', [
    ch('Battle Tib.', fight(`It is like fighting your own reflection from a year ago: your openers, your habits, your bad ideas.${easyLine}`, tibTeam({ team: ['furret', 'clefable', 'eevee'], lv: b }))),
  ], {
    callback: true, rarity: 'rare', requires: [is('apprentice-on'), flagAgo('apprentice-on', 2), not('apprentice-mirror-done'), easy ? is('apprentice-taught-easy') : not('apprentice-taught-easy')],
    remembers: [
      v('recruited', [is('apprentice-praised')], { intro: 'A trainer blocks a bridge. Older now. In an Evil Team uniform that does not fit across the shoulders yet. Tib. No Furret. Two hard-eyed Pokémon you have never seen Tib with. Tib: "They pay better than you." The voice is steady. The hands are not.', hide: [0], add: [ch('Battle Tib.', fight(`Tib fights like a Grunt now: dirty, quick, two on one whenever it can be managed. Under it, every now and then, there is a move you taught.${easyLine}`, tibTeam({ team: ['mightyena', 'golbat', 'weezing'], cls: 'roughneck', lv: b })))] }),
      v('working-it-out', [is('apprentice-sly'), not('apprentice-praised')], { intro: 'A trainer blocks a bridge. Older now. Tib, with a team that does not match: one thing bought, one thing found, one thing that plainly just followed Tib home. Tib: "I stopped copying. I\'m working it out." A breath. "It\'s harder. Did you know it was harder?"', hide: [0], add: [ch('Battle Tib.', fight(`Nothing Tib does is yours any more. Some of it does not work. Some of it works in ways you would never have tried.${easyLine}`, tibTeam({ team: ['furret', 'houndour', 'marill'], lv: b })))] }),
      v('own-way', [is('apprentice-own')], { intro: 'A trainer blocks a bridge. Older now. Tib, grinning, with a Furret at one knee and something small and odd at the other. Tib: "I found my own way. Want to see?"', hide: [0], add: [ch('Battle Tib.', fight(`Tib opens with a move you have never seen anybody open with. It should not work. It works.${easyLine}`, tibTeam({ team: ['furret', 'togetic', 'smeargle'], lv: b })))] }),
    ],
  });
}

const APPRENTICE: Json[] = [
  {
    id: 'apprentice-follows', requires: [not('apprentice-on')],
    intro: 'The road. A kid has been following you for an hour, hiding behind trees that are far too thin to hide anyone. When you finally stop and turn round, the kid steps out with both hands up. Tib: "Please, may I watch? I\'ll carry your bag. I won\'t talk." A beat. "I won\'t talk at all. You won\'t even know I\'m here. Is that a Potion? What\'s that one?" Tib takes a breath and gets it out all at once. "I want to be a trainer. A real one. Like you."',
    choices: [
      ch('You can watch.', out('Tib nods very seriously and vanishes behind the nearest too-thin tree. For the rest of your journey there will be a small shape at the edge of things: on a wall, up a signpost, three rows back in a crowd. Watching what you do. All of what you do.', flagAt('apprentice-on'), companion(2))),
      ch('Go home.', out('Tib: "Okay." Tib turns round and walks away down the road without arguing. That evening, across a field, you see a small fire a careful distance from yours. Tib is following anyway. Just better at it.', flagAt('apprentice-on'), flag('apprentice-sent'))),
      ch('Carry the bag, then.', out('Tib takes the strap in both hands as if being handed a crown. Then Tib starts talking, and does not stop: about types, about a cousin who saw a Dragonite once, about whether Potions go off. Your shoulders have not felt this light in weeks. Your ears will recover.', flagAt('apprentice-on'), flag('apprentice-bag'), companion(2), item('sitrus-berry'))),
    ],
  },
  {
    id: 'face-aspiring-rival', requires: [is('apprentice-on'), later('apprentice-on', { stages: 2 }), not('apprentice-taught')],
    intro: 'Tib is waiting in the middle of the road in a hand-me-down cap a size too big, striking a pose. It takes you a moment to place it. It is your pose, exactly, from your last battle, down to the angle of the elbow. Tib: "I want to be just like you! Battle me so I can learn!" Tib has a Pokémon now. It is tiny. It is trying to do the pose as well.',
    choices: [
      ch('Battle, go easy.', out('You pull every punch and let the tiny thing land its one good hit, and then another. When your Pokémon sits down and "faints", Tib screams loud enough to lift birds off a fence. Tib has won. Tib is thrilled. And Tib, who watches everything, has just learned what going easy looks like, and that it is a thing strong people do.', flag('apprentice-taught'), flag('apprentice-taught-easy'), fr(3, 'party'), ...kind())),
      ch('Battle for real.', fight('You give Tib what was asked for: a real one. It is over quickly.', safe(trainer('Tib', { cls: 'youngster', team: ['sentret'], size: 1, lv: -3, win: [flag('apprentice-taught'), flag('apprentice-taught-real'), moment('You beat the kid who follows you, properly. Tib cried, got up, and asked to go again', 50)] }), flag('apprentice-taught'), flag('apprentice-taught-real')))),
      ch('Teach instead.', out('No battle. You sit Tib down in the dust and spend the afternoon on one move, over and over, until the tiny Pokémon can do it without falling on its face. Your lead demonstrates forty times without complaint, and seems to stand a little taller for having been the example. Tib writes everything down on one arm.', flag('apprentice-taught'), flag('apprentice-taught-teach'), fr(5, 'lead'), ...kind())),
    ],
  },
  {
    id: 'apprentice-kind', name: 'What You Did', requires: [is('apprentice-on'), flagAgo('apprentice-on', 1), not('apprentice-kind'), not('apprentice-sly'), { kind: 'meter', key: 'goodEvil', side: 'positive', atLeast: 0 }],
    intro: 'A new region, and someone running to catch you up. The kid from before. Taller, somehow. Tib: "I copied what you did for the stranded Pokémon. It worked!" Tib cannot stand still. "I found a Sentret stuck in a fence. I did what you did. It\'s mine now." A Sentret peeks over Tib\'s shoulder, one paw gripping Tib\'s collar, and regards you gravely.',
    choices: [
      ch('Proud of you.', out('Tib glows. There is no other word for it. Tib glows all the way down the road, walking backwards so as to keep looking at you, until the Sentret has to chirp a warning about a ditch.', flag('apprentice-kind'), fr(3, 'party'))),
      ch('Do it your way next time.', out('Tib\'s mouth opens to argue and then closes. You can see the idea go in: that there might be a way that is not your way. Tib walks off slowly, frowning at nothing, the Sentret patting Tib\'s ear. Next time you meet, Tib will have invented something.', flag('apprentice-kind'), flag('apprentice-own'))),
      ch('Was it scared?', out('The bounce goes out of Tib, and something better comes in. Tib: "...Yeah. I talked to it until it wasn\'t." Tib reaches up without looking, and the Sentret puts its paw in Tib\'s hand.', flag('apprentice-kind'), flag('apprentice-gentle'), fr(3, 'party'))),
    ],
  },
  {
    id: 'apprentice-sly', name: 'What You Did', requires: [is('apprentice-on'), flagAgo('apprentice-on', 1), not('apprentice-kind'), not('apprentice-sly'), isEvil(1)],
    intro: 'A new region, and someone standing in the path with a very innocent look. The kid from before. Tib: "I copied what you did to that shopkeeper. Want to see?" Tib opens a bag. Three items, tags still on, stolen. Tib looks up at you with total trust. "You did it. So it\'s fine. Right?"',
    choices: [
      ch('It\'s not fine.', out('Tib: "But you—" And Tib tells it back to you. All of it. The day, the place, what you took or took advantage of, what you said afterwards. Tib was watching from behind a too-thin tree, and remembers it better than you do. When Tib has finished there is nothing either of you can say. Tib closes the bag and walks off, confused, looking back twice.', flag('apprentice-sly'), flag('apprentice-confronted'))),
      ch('Give them back with me. (two nodes)', out('Three shops. Three counters. Tib does the talking at each one, in a voice that gets smaller every time, and you stand behind with a hand on Tib\'s shoulder. Two shopkeepers take their goods back and say nothing. The third reaches for the telephone. It costs you ₽500 to put the receiver down again. Outside, Tib says, very quietly, "You did it too, though." You say yes. You say that is why you came.', takeNode(2), flag('apprentice-sly'), flag('apprentice-returned'), $(-500), ...kind()), { requires: [money(500)] }),
      ch('Nice haul.', out('Tib grins, a grin you have seen in a mirror. Across the street, a man in a dark cap who has been reading the same page of a newspaper for some time folds it, and looks at Tib for a long moment, and smiles too.', flag('apprentice-sly'), flag('apprentice-praised'), ...sly())),
    ],
  },
  mirror('apprentice-mirror', false),
  mirror('apprentice-mirror-easy', true),
  sub('apprentice-follows', 'apprentice-after', 'After the Mirror', 'The bridge is quiet again. Tib recalls the last Pokémon and stands with the Ball held in both hands, breathing hard, looking at you across the planks. Whatever you say next, Tib is going to keep.', [
    ch('You\'re better than me.', out('Tib\'s face does several things at once, and then Tib is crying, the happy kind, wiping it away with the heel of a hand and laughing at the same time. "I\'m not. I\'m not! But you said it." From now on there will be a friend on your road: now and then, when a fight needs two, Tib will simply be there.', flag('apprentice-friend'), companion(3), ...kind())),
    ch('Stop copying me.', out('Tib goes very still. Then the chin comes up. Tib: "Then I\'ll beat you." It is not a threat. It is a promise, made the way you make them. Tib walks off the far end of the bridge without looking back, and you understand that you have a second rival now, and that this one knows every trick you have.', flag('apprentice-rival'), tail(6))),
    ch('Come with me.', out('Tib looks at the road behind, and the road ahead, and then at you. "Really?" Tib is across the bridge before you have finished nodding. For the rest of this journey you will not walk alone, and when a fight needs two, the second will be standing right beside you with a too-big cap on.', flag('apprentice-friend'), flag('apprentice-with'), companion(9), ...kind())),
  ], {
    remembers: [
      v('uniform-off', [is('apprentice-praised'), isGood(5)], { notice: 'The uniform is torn at one shoulder now. Tib keeps touching the tear. Tib has been watching you all this time, and lately, everything Tib has seen you do has been kind.', add: [ch('Take the uniform off.', out('You say it gently. Tib looks down at the jacket as if seeing it for the first time. The fingers go to the top button. Then the next. Tib folds it, carefully, because Tib folds everything carefully, and sets it on the rail of the bridge, and leaves it there. "It never fitted," Tib says. Underneath is the hand-me-down cap, crushed flat in a pocket. Tib puts it back on.', flag('apprentice-saved'), flag('apprentice-friend'), companion(3), ...kind(2), moment('Tib took the uniform off, because of what Tib had watched you do', 80)))] }),
      v('uniform-stays', [is('apprentice-praised')], { notice: 'The uniform is torn at one shoulder now. Tib keeps touching the tear.', add: [ch('Take the uniform off.', out('You say it. Tib almost does. You see the hand start to move. Then Tib looks at you, hard, and you watch Tib remember everything Tib has watched you do lately. "Why? You wouldn\'t." The hand drops. A whistle sounds from the trees, and Tib goes to it, at a run, without looking back. Tib will be wearing that jacket when you next meet.', flagAt('apprentice-recruit'), moment('Tib stayed with the Evil Team. Tib learned that from somewhere', 75)))] }),
    ],
  }),
  sub('apprentice-follows', 'apprentice-bag-return', 'The Bag', 'Running feet behind you. Tib, out of breath, holding out the bag strap you handed over a long time ago. "I forgot. This is yours. I\'ve been carrying it so long I thought it was mine." Tib pushes it into your hands. It is heavier than when you gave it. "I put something in. Don\'t look till I\'ve gone."', [
    ch('Take the bag back.', out('You wait until Tib is a small shape on the road. Inside, wrapped in a clean sock, is the best thing Tib owned. There is a note, on the back of a shop receipt, in very careful letters: FOR CARRYING. You stand in the road for a while.', any(...HELD), flag('apprentice-bag-back'), fr(3, 'party'))),
  ], { callback: true, requires: [is('apprentice-bag'), is('apprentice-mirror-done'), not('apprentice-bag-back')] }),
  sub('apprentice-follows', 'apprentice-lieutenant', 'Lieutenant Tib', 'An Evil Team checkpoint, and the officer in charge of it is too young for the stripes on the sleeve. Tib. A year of orders has put something flat behind the eyes. Two Grunts twice Tib\'s age wait on Tib\'s word. Tib sees you and, for half a second, forgets to be a lieutenant.', [
    ch('Take the uniform off.', fight('Tib\'s jaw sets. "Make me." It is the answer you would have given. Tib sends the Grunts away with one hand, and faces you alone.', safe(trainer('Lieutenant Tib', { cls: 'roughneck', team: ['mightyena', 'crobat', 'weezing', 'furret'], size: 4, lv: 1, win: [flag('apprentice-saved'), flag('apprentice-recruit', -1), flag('apprentice-friend'), companion(3), ...kind(2), moment('You beat Lieutenant Tib, and Tib came home', 85)] }), flag('apprentice-lieutenant-lost')))),
    ch('Walk past.', out('You walk through the checkpoint. Tib does not stop you, and does not look at you. As you pass, you see that the fourth Ball on Tib\'s belt is an old one, scuffed, cheap. The Furret. Tib still has the Furret.', flag('apprentice-lieutenant-passed'))),
  ], { callback: true, rarity: 'rare', requires: [is('apprentice-recruit'), flagAgo('apprentice-recruit', 1), not('apprentice-saved'), not('apprentice-lieutenant-passed')] }),
];

// =====================================================================================================================
// SF3. THE FARMER WHO FORGETS. Abner has dementia. He is never mocked, never a puzzle to solve, and never cured.
// =====================================================================================================================
const FARMER: Json[] = [
  {
    id: 'farmers-quest-1', name: 'The Farmer\'s Long Errand', requires: [not('farmer-met')],
    intro: 'A gate by a field. An old man in a straw hat stands at it, and as you pass he holds out a paper seed packet, soft with handling. Abner: "Would you carry this seed to a field three towns away?" He pats his own leg, apologising for it. "I\'d do it myself. My knees." He does not seem to expect an answer. He is looking past you at his field, which is bare earth from hedge to hedge. Abner: "There\'s a stake in the ground there. With a name on. You\'ll see."',
    choices: [
      ch('I\'ll carry it.', out('He puts the packet in your palm and folds your fingers over it with both his hands, which are dry and very warm. "Good. That\'s good." He goes back to looking at the bare field. You put the seed where it will not be crushed. Three towns on, your map has a field on it that was not there before.', flagAt('farmer-met'), flag('farmer-seed1'))),
      ch('Whose name?', out('He frowns. Not at you. At something a long way off. Abner: "...Funny. I can see it. Can\'t read it." He stays with that for a moment, and then it passes like a cloud off the sun, and he hands you the seed with a smile, as though you had only just arrived.', flagAt('farmer-met'), flag('farmer-seed1'), flag('farmer-asked'))),
      ch('I can\'t.', out('Abner: "That\'s alright. Someone will." He says it without any weight at all. When you look back from the corner he is holding the packet out to a woman with a handcart, with exactly the same words, and exactly the same hope.', flagAt('farmer-met'), flag('farmer-refused'))),
    ],
  },
  sub('farmers-quest-1', 'farmers-field', 'The Field Three Towns On', 'The field, three towns on. A wooden stake, weathered silver. Carved into it, deep, by a hand that took its time: BRAMBLE. Around the stake a ring of flowers is half dead for want of company. At the far edge of the grass a Skiddo is grazing. It lifts its head when it sees you, and shies away.', [
    ch('Plant the seed.', out('You press it into the earth beside the stake with your thumb. It does not wait. A green thread comes up through the soil while you are still kneeling, uncurls two leaves, and stops, as if to see what you make of it. The Skiddo has stopped chewing. It watches the little shoot with its whole body.', flag('farmer-planted'), flag('farmer-seed1', -1), fr(3, 'party'), ...kind())),
    ch('Look around.', out('In the long grass near the stake your foot turns something up. A leather collar, stiff with weather, buckle rusted shut. On the brass tag, worn nearly smooth: BRAMBLE. It is far too small for a Gogoat. It would fit a Skiddo. You set it back down where it was.', flag('farmer-looked'), room('farmers-field'))),
    ch('Call the Skiddo.', out('You crouch and hold out a hand and make the sort of noise you would make. It comes. Halfway. Then it stops, legs braced, nostrils wide, wanting to and not able to. It stands there for as long as you do.', flag('farmer-called'), room('farmers-field'))),
  ], {
    callback: true, requires: [is('farmer-seed1'), later('farmer-seed1', { stages: 1 }), not('farmer-planted')],
    remembers: [
      v('looked-and-called', [is('farmer-looked'), is('farmer-called')], { intro: 'The stake. The collar in the grass. The Skiddo, halfway, watching. The seed is still in your pocket.', hide: [1, 2] }),
      v('looked', [is('farmer-looked')], { intro: 'The stake, and the little collar lying where you left it. At the edge of the grass, the Skiddo is still watching you. The seed is still in your pocket.', hide: [1] }),
      v('called', [is('farmer-called')], { intro: 'The stake, and the Skiddo standing halfway between the hedge and you, not coming closer, not leaving. The seed is still in your pocket.', hide: [2] }),
    ],
  }),
  {
    id: 'farmers-quest-2', name: 'The Same Farmer', requires: [is('farmer-met'), flagAgo('farmer-met', 1), not('farmer-met2')],
    intro: 'One region later. The same gate. The same straw hat. The same man, holding out a seed packet as you pass, and his eyes go over your face without catching on anything. He does not know you. Abner: "A seed? To the field? Nice of you to offer." You had not offered. Abner: "I once asked another stranger. Long ago. Never knew if they went." At the farmhouse door a woman is standing with a tea towel in her hands, watching the two of you. His daughter. Wynne.',
    choices: [
      ch('I went. It grew.', out('Abner: "Did it? Well. Good." He smiles. Not at you. At the field, as if the field had told him. He holds the smile for a long moment. Then he puts another seed in your hand, the same way, folding your fingers over it.', flagAt('farmer-met2'), flag('farmer-told'), flag('farmer-seed2')), { requires: [is('farmer-planted')] }),
      ch('I\'ll go again.', out('He does not hear the "again". He hears the "go". Another packet, soft with handling, pressed into your palm with both his warm dry hands. "Good. That\'s good."', flagAt('farmer-met2'), flag('farmer-seed2'))),
      ch('Talk to Wynne.', out('You leave him at the gate, looking at his field, and walk up to the house.', flagAt('farmer-met2'), flag('farmer-wynne'), room('farmers-wynne'))),
    ],
    remembers: [
      v('the-rival-went', [is('farmer-refused')], { notice: 'He goes on, pleased with it. "A stranger did go, in the end, mind. Young one. In a hurry. Came back special to tell me it was planted." You know that description. Your rival walked three towns for an old man\'s seed, and never mentioned it to anyone.' }),
    ],
  },
  sub('farmers-quest-1', 'farmers-wynne', 'Wynne', 'She keeps her voice down, though he would not hear. Wynne: "He asks everyone. Most say yes and drop it in a ditch. I don\'t blame them." She twists the tea towel. "Bramble was his Gogoat. Raised her from an egg. She died the year before his memory went." She looks down the path at the straw hat. Wynne: "He forgot her first. I think that\'s why he keeps planting."', [
    ch('I\'ll keep going.', out('Wynne goes into the house and comes back with a seed packet from a drawer that is full of them. Wynne: "Thank you. He won\'t. So I will." She stays on the step to watch you go, and when you pass the gate her father raises his hat to you, as he would to any kind stranger.', flag('farmer-seed2'))),
    ch('Should I tell him?', out('Wynne does not answer straight away. Wynne: "You can. He\'ll be sad. Then he\'ll forget, and be sad without knowing why. I stopped." She says it without bitterness. It is only what she has learned. She leaves it with you, and goes in for the seed.', room('farmers-tell'))),
    ch('There\'s a Skiddo at the field.', out('Her hands go still on the towel. Wynne: "...Bramble had a kid. We let it go wild when we couldn\'t keep up." She looks toward a place three towns away. "It stayed? All this time, it stayed by her?" She has to go inside for a minute. When she comes back she has a seed packet, and red eyes, and she presses the packet into your hand exactly the way her father does.', flag('farmer-seed2'), flag('farmer-skiddo-told'))),
  ]),
  sub('farmers-quest-1', 'farmers-tell', 'At the Gate', 'Abner is at the gate where you left him, looking at the bare field. Wynne has put a seed packet in your pocket and gone back to the step. She is not watching. She is very carefully not watching.', [
    ch('Tell him about Bramble.', out('You tell him. That there was a Gogoat. That he raised her from the egg. That her name is carved on a stake three towns on. He listens with his whole face. Then he cries, quietly, the way old men do, and takes your hand in both of his, and thanks you. "Bramble. Yes. Yes." Two minutes later he wipes his eyes, puzzled to find them wet, and asks if you would carry a seed to a field three towns away. On the step, Wynne says nothing.', flag('farmer-told-bramble'), flag('farmer-seed2'))),
    ch('Say nothing.', out('You stand with him a while and look at the field together. He seems glad of the company. When you go, he lifts his hat. In your pocket, the seed.', flag('farmer-seed2'))),
  ]),
  sub('farmers-quest-1', 'farmers-field-again', 'The Field Again', 'The field three towns on. The stake, BRAMBLE, silver in the sun. Where you planted the first seed there is a flower now, knee high, a colour you do not have a name for. The Skiddo is lying beside it. It gets up when it sees you. It does not shy away.', [
    ch('Plant the seed.', out('You plant the second beside the first. It comes up at once, as the other did. The Skiddo walks over, slowly, the whole way this time, and smells the new shoot, and then smells your hand. Its nose is cold. It lets you rest your palm between its small horns for exactly one breath.', flag('farmer-planted'), flag('farmer-seed2', -1), fr(3, 'party'), ...kind())),
  ], { callback: true, requires: [is('farmer-seed2'), later('farmer-seed2', { stages: 1 }), is('farmer-met2')] }),
  {
    id: 'farmers-quest-3', name: 'Lucky', requires: [is('farmer-met2'), flagAgo('farmer-met2', 1), not('farmer-end')],
    intro: 'One region later. You come over the hill and stop. The farmer\'s fields are green all the way to the horizon: beans, barley, flowers along every hedge. He is at his gate. He looks at you kindly and without knowing. Abner: "I don\'t know your face. Take what you like." He waves an arm at all of it, amazed and content. Abner: "I seem to have been lucky. Folk keep planting things for me." And at the field three towns on, you know before you see it, the stake is deep in flowers, and beside it, patient as a hill, a Gogoat is lying.',
    choices: [
      ch('Bring the Gogoat home. (two nodes)', out('It takes two long days to walk a Gogoat three towns. It comes willingly, a pace behind you, stopping to look at things. At the gate, Abner looks at it for a long time. The Gogoat looks back. "Hello, you," he says. He does not know why he says it. His hand goes out and finds the place behind its horns as if the hand remembered on its own. The Gogoat walks past him into the yard and lies down beside his chair. Wynne comes to you with something held in both hands. A collar. Wynne: "It\'s yours. He\'d want someone to remember her who can."', takeNode(2), flag('farmer-end'), flag('farmer-home'), item('brambles-collar'), fr(5, 'party'), ...kind(2), moment('You brought Bramble\'s kid home. Abner said "Hello, you," and did not know why', 90))),
      ch('Leave it at the field.', out('You leave it where it has chosen to be: beside the stake, in the flowers, keeping its mother company. It watches you go with calm yellow eyes. Later you hear that Wynne walks out there on Sundays now, three towns each way, and sits with it, and tells it about her father.', flag('farmer-end'), flag('farmer-field'), fr(3, 'party'))),
      ch('Take what you like.', out('He means it, so you do. He fills your arms himself, far past what you would have taken: berries off three different bushes, and a great knotted root he pulls up with a grunt and knocks the soil from. "Lucky," he says again, shaking his head at his own fields. "Can\'t think what I did to earn it."', flag('farmer-end'), flag('farmer-took'), any(...BERRIES), any(...BERRIES), any(...BERRIES), item('big-root'))),
    ],
    remembers: [
      v('both-planted', [is('farmer-planted', 2)], { notice: 'You know those flowers round the stake. You put them there, two seeds, a region apart. Wynne told a neighbour, who told you: they are the ones Bramble used to eat out of his hat. The young Gogoat followed them back to that field all by itself.' }),
    ],
  },
];

// =====================================================================================================================
// SF4. THE ELDER'S LAST WISH. Step 3 comes one region after step 1 whatever happens.
// =====================================================================================================================
const charm = item('aldous-charm');
const ELDER: Json[] = [
  {
    id: 'elders-last-wish-1', name: 'Three Things', requires: [not('elder-letter')],
    intro: 'A cottage by a lane. A frail old man in a chair by the door waves you over with two fingers, and when you are close enough he presses a letter into your hand before you can say a word. Elder Aldous: "Three things before I rest." He holds up a finger that shakes. "First. Deliver this to the old mill. To Sabine. Don\'t read it." He fixes you with a pale, fierce eye. "I\'ll know if you read it." The eye softens. "I won\'t, actually. But don\'t."',
    choices: [
      ch('I\'ll take it.', out('He nods once, and sinks back in the chair as if that had cost him. The envelope is thin and has been sealed, opened and sealed again, many times. The old mill is on your map now, two turns of the road on.', flagAt('elder-letter'))),
      ch('Read it.', out('You wait until the lane bends. The paper is one sheet, the hand is shaky. "Sabine. You were right about the star. I was too proud. Forgive an old fool. C." That is all. Forty years of something, in four lines, and you had no business in any of it. You fold it exactly as it was. You feel like a snoop. You are one.', flagAt('elder-letter'), flag('elder-read'))),
      ch('How long do you have?', out('He is not offended. He considers it, as a practical question deserves. Aldous: "Long enough if you hurry. Not long enough if you don\'t." He closes his eyes. You are already walking.', flagAt('elder-letter'), flag('elder-asked'))),
    ],
  },
  {
    id: 'elders-last-wish-2', name: 'The Star Was Real', callback: true, requires: [is('elder-letter'), not('elder-berries'), not('elder-done')],
    intro: 'The old mill, its wheel still turning though there is nothing left to grind. A woman with white hair is standing by the race with the letter open in her hands. She has read it already. She is reading it again. Her hands shake. Sabine: "Forty years. He could have walked here." She laughs, and it breaks in the middle. "We saw a falling star. He said it was a satellite. I said it was a star. We didn\'t speak for forty years over a star." She folds the page along its old creases. Sabine: "Tell him the star was real. And bring him a bowl of Berries from the east grove. He used to pick them for me."',
    choices: [
      ch('I\'ll bring them. (two nodes)', fight('The east grove is two fields over, gone half wild. The best bushes are in the middle, and something has made its home under them that does not see why it should share.', wild({ types: ['grass', 'bug'], win: [takeNode(2), flag('elder-berries'), item('oran-berry'), item('pecha-berry'), moment('You picked a bowl of Berries in the east grove for a man who used to pick them for someone else', 55)] }))),
      ch('Come with me and tell him.', out('She looks down the lane as if it were a mountain. Sabine: "My legs won\'t." She is quiet for a moment. Then she goes inside, and you hear a drawer, and a pen scratching for a long time. When she comes out she has a second letter. She does not seal it. "He always said my handwriting was a punishment. Let him be punished."', flag('elder-letter2'), room('elders-last-wish-2'))),
      ch('Was it real?', out('She glances up the lane toward the cottage, as though he might hear across forty years and two miles. Sabine: "It was a meteor. Tiny." From her apron pocket she takes a black stone the size of a plum, pitted and heavy, and sets it in your hand. "I found it the next day. I never told him." She closes your fingers on it. "I wanted to be right more than I wanted him to know. Take it. One of us should stop."', flag('elder-stone'), room('elders-last-wish-2'))),
    ],
    remembers: [
      v('both-asked', [is('elder-letter2'), is('elder-stone')], { intro: 'Sabine stands by the mill race with nothing left in her hands. The second letter is in your pocket. The black stone is in your other pocket. Sabine: "The Berries. From the east grove. He used to pick them for me." She looks at the wheel going round. "Hurry, if you would."', hide: [1, 2] }),
      v('letter-written', [is('elder-letter2')], { intro: 'Sabine stands by the mill race. Her second letter is in your pocket, unsealed. Sabine: "And the Berries. From the east grove. He used to pick them for me."', hide: [1] }),
      v('stone-given', [is('elder-stone')], { intro: 'Sabine stands by the mill race. The black stone is heavy in your pocket. Sabine: "And the Berries. From the east grove. He used to pick them for me."', hide: [2] }),
    ],
  },
  {
    id: 'elders-last-wish-3', name: 'Be Kind to Them', callback: true, forced: true, requires: [is('elder-letter'), flagAgo('elder-letter', 1), not('elder-done')],
    // Late: the berries never came.
    intro: 'The cottage, shuttered. The chair is gone from beside the door. A note is pinned where a hand would knock, in a neighbour\'s round writing: "He went in his sleep, Tuesday. He\'d been asking for a traveller." You read it twice. Then you walk to the mill, because there is nowhere else to take it. Sabine is by the race. She is holding a worn charm on a cord. Sabine: "He left this for you, with the neighbour. They brought it to me. I\'ve been waiting." She turns it over. "I wrote him back. He never got it. So I\'m giving it to you. It\'s yours now." The letter is one line. "Whoever carried his letter. Thank you. Don\'t wait forty years for anything. — S."',
    choices: [
      ch('I\'m sorry I was late.', out('She shakes her head before you have finished. Sabine: "You got the letter here. That was the important part." She puts the charm in your hand and holds your hand closed over it a moment, the way he did with the envelope. "He knew I\'d read it. That was all he wanted, in the end. He just wanted to have said it."', flag('elder-done'), flag('elder-late'), charm)),
      ch('Did you go to the funeral?', out('Sabine: "First time I\'d been out in forty years." She almost smiles. "I wore the wrong shoes. He\'d have had something to say." She puts the charm in your hand. "They let me stand at the front. Nobody there knew who I was. I knew. That was enough."', flag('elder-done'), flag('elder-late'), charm)),
      ch('Keep the charm.', out('She looks at it for a long time. Then she puts the cord over her own head, and tucks the charm inside her collar, where it sits against her like a hand. "Thank you," she says. "I didn\'t know how to ask." You leave with one line of her handwriting folded in your pocket, and it is plenty to carry.', flag('elder-done'), flag('elder-late'), flag('elder-charm-kept'), ...kind())),
    ],
    remembers: [
      v('on-time-read', [is('elder-berries'), is('elder-read')], {
        intro: 'Aldous sits by the window now, smiling. Thinner. The bowl is in his lap before you have finished crossing the room. Aldous: "Berries. From the east grove. She remembered." He eats one. He laughs, a young man\'s laugh in an old man\'s chest. Then he looks at you sidelong and winks. "You read it, didn\'t you." It is not a reproach. It is one snoop greeting another. Aldous: "One last thing. Be kind to your Pokémon. They\'ll remember everything. Every single thing." He presses a worn charm into your hand.',
        hide: [0, 1, 2], add: onTime(),
      }),
      v('on-time', [is('elder-berries')], {
        intro: 'Aldous sits by the window now, smiling. Thinner. The bowl is in his lap before you have finished crossing the room. Aldous: "Berries. From the east grove. She remembered." He eats one. He laughs, a young man\'s laugh in an old man\'s chest. Aldous: "One last thing. Be kind to your Pokémon. They\'ll remember everything. Every single thing." He presses a worn charm into your hand.',
        hide: [0, 1, 2], add: onTime(),
      }),
    ],
  },
];
function onTime(): Json[] {
  return [
    ch('I will.', out('He nods, satisfied, like a man ticking the last item off a list. His eyes close. His hand stays on the bowl. He is only resting. You let yourself out very quietly, with the charm warm in your fist.', flag('elder-done'), charm, fr(3, 'party'))),
    ch('Tell me about the star.', out('He tells it. It is a lovely story: a summer night, a hill, a girl who knew the name of everything in the sky. In his telling, she saw it first, and she was right at once, and he was only ever teasing. That is not how it went. He has got it wrong in the way that is kindest to her. You do not correct him.', flag('elder-done'), charm, fr(3, 'party'))),
    ch('Give him Sabine\'s stone.', out('You put the black stone in his palm. He knows what it is before you say. He holds it up to the window, and turns it, and his whole face comes apart and back together. "Proud fool," he says. He means himself. He has never been so happy to have lost an argument. He holds the star in his hand all afternoon.', flag('elder-done'), flag('elder-star'), charm, fr(5, 'party'), ...kind(), moment('You put a fallen star in an old man\'s hand, forty years late and just in time', 85)), { requires: [is('elder-stone')] }),
  ];
}

// =====================================================================================================================
// SF5. WICKER'S CART (the Wandering Merchant wm-* is Old Tam, Wicker's partner). `wicker-spent` counts hundreds spent at Wicker:
// the pack's fund of 3 / 6 / 9 (one per 500) is 15 / 30 / 45.
// =====================================================================================================================
const W = 'wicker-spent';
const wickerTalk = room('wicker-stock');
const WICKER: Json[] = [
  {
    id: 'peddler-1', name: 'Her First Cart', requires: [not('wicker-met')],
    intro: 'A crossroads. A cart with one wobbly wheel. A woman in a patched coat is leaning on a stick beside it, and when she sees you she waves both arms as if you were a ship. Wicker: "Hello! I\'m Wicker, and I sell everything that fell off other people\'s wagons." She holds up a finger. "Legally. I check. Mostly I check." She kicks the wobbly wheel, fondly. "Wheel\'s going. If I sell enough this region, I can fix it. No pressure." A pause. "Some pressure."',
    choices: [
      ch('Show me the stock.', out('She whips the tarp back like a magician. Six things, each with a paper tag in neat writing, each priced at exactly what it is worth.', flagAt('wicker-met'), wickerTalk)),
      ch('What happened to your leg?', out('Wicker: "Fell off my own wagon." She laughs, a tremendous laugh, far too big for the crossroads. It is plainly true. She is still laughing as she pulls the tarp back to show you what she has.', flagAt('wicker-met'), flag('wicker-leg'), wickerTalk)),
      ch('Fell off whose wagons?', out('Wicker: "Anyone who doesn\'t come back for them in a month. I keep a ledger." She produces it: a fat book, every find with a date, a place and a blank line for a name. Most of the lines are still blank. She shows it to you the way other people show photographs. Then she pulls the tarp back.', flagAt('wicker-met'), flag('wicker-ledger'), wickerTalk)),
    ],
  },
  sub('peddler-1', 'wicker-stock', 'Wicker\'s Stock', 'Wicker\'s cart, tarp thrown back. Everything on it is what its tag says it is. She watches you look, bouncing slightly on her good leg.', [
    buy('Super Potion', 700, 'super-potion', 'She wraps it in yesterday\'s newspaper and ties it with string. "That one came off a doctor\'s gig. He never missed it."', 'wicker-stock', W),
    buy('Great Ball', 600, 'great-ball', 'She polishes it on her sleeve before she hands it over. "Found in a ditch, good as new. Somebody\'s bad throw is your good luck."', 'wicker-stock', W),
    buy('Full Heal', 400, 'full-heal', 'She checks the seal against the light first. "Still good. I check. Mostly I check. That one I checked."', 'wicker-stock', W),
    ch('See the rest.', out('"Oh, there\'s more. There\'s always more." She digs.', room('wicker-stock-b'))),
  ]),
  sub('peddler-1', 'wicker-stock-b', 'Wicker\'s Stock', 'The back of the cart: the better things, wrapped in sacking.', [
    buy('Two Sitrus Berries', 500, 'sitrus-berry', 'She counts them into your hand and adds a look that says she would have thrown in a third if the wheel were not what it is.', 'wicker-stock-b', W, 2),
    buy('Silk Scarf', 1000, 'silk-scarf', 'She shakes it out. It is finer than anything else on the cart. "A month and a day I held that. Nobody came. Their loss."', 'wicker-stock-b', W),
    buy('Revive', 2000, 'revive', 'She hands it over with both hands. "That\'s a wheel spoke, that is. Thank you. I mean it."', 'wicker-stock-b', W),
    ch('That\'s all, thanks.', out('She pulls the tarp down and ties it. "Tell people! Wicker! Crossroads! Found goods!" You can hear her laughing for some distance.')),
  ]),
  {
    id: 'wm-1', name: 'The Squeaky Cart', requires: [not('tam-met')],
    intro: 'A different road. You hear the cart before you see it: one wheel squeaking, steady as a cricket. A thin old man in a wide hat walks beside it at the pace of someone who has never once been in a hurry. Old Tam: "I walk this road once a stage. Find me at the next stage and my prices drop." He looks you over from under the hat brim. Tam: "You\'ve met Wicker? Then you\'ve met the loud half of the business."',
    choices: [
      ch('Buy.', out('He has a small tray and no patter at all. He simply shows you what there is.', flag('tam-met'), room('tam-stock'))),
      ch('You\'re partners?', out('Tam: "She found me in a ditch. I was the thing that fell off a wagon." He says it as plain fact, and then the corner of his mouth goes up. "Month and a day, she waited. Nobody came back for me. So she kept me." He shows you his tray.', flag('tam-met'), flag('tam-story'), room('tam-stock'))),
      ch('See you next stage.', out('He touches his hat. "Same cart. Listen for the wheel." The squeak goes off down the road, unhurried.', flag('tam-met'))),
    ],
  },
  sub('wm-1', 'tam-stock', 'Tam\'s Tray', 'A small tray of small things, each one honest.', [
    buy('Potion', 200, 'potion', 'He counts your change twice, slowly, and gives you a coin back that you had overpaid.', 'tam-stock'),
    buy('Poké Ball', 200, 'poke-ball', 'He hands it over without a word. It has been cleaned, and oiled at the hinge.', 'tam-stock'),
    buy('Two Oran Berries', 200, 'oran-berry', 'He picks the two best from the tray, and you can see him doing it.', 'tam-stock', undefined, 2),
    ch('That\'s all.', out('He touches his hat. The wheel takes up its squeak.')),
  ]),
  {
    id: 'wm-2', name: 'The Squeaky Cart Again', requires: [is('tam-met'), later('tam-met', { stages: 1 }), not('tam-second')],
    intro: 'You hear it before you see it. Tam: "The squeaky cart again, right where I said. Regulars get a better cut."',
    choices: [
      ch('Buy (−10%).', out('The same tray. A tenth off every tag, written in pencil over the ink.', flag('tam-second'), room('tam-stock-regular'))),
      ch('Oil your wheel.', out('You kneel in the road with your own oil and do the hub properly. The squeak stops. In the silence Tam looks at the wheel, and then at you, and for a moment he cannot find his usual nothing-to-say. "Thirty years it\'s done that," he manages. For the rest of this region, wherever you buy, word has gone ahead of you: this one is to have a little off.', flag('tam-second'), flag('tam-oiled'), region('Tam\'s word: prices are a twentieth lower', { kind: 'priceMultiplier', group: 'all', value: 0.95 }), room('tam-stock-regular'), ...kind())),
      ch('Ask about Wicker.', out('Tam: "She\'s saving for a wheel. Buy from her. I\'ll be fine." He says it at once, as if he had been waiting for someone to ask so that he could say it. He shows you his tray anyway.', flag('tam-second'), room('tam-stock-regular'))),
    ],
  },
  sub('wm-1', 'tam-stock-regular', 'Tam\'s Tray', 'The small tray, for a regular. Every price has been pencilled down by a tenth.', [
    buy('Potion', 180, 'potion', 'He counts your change twice, slowly.', 'tam-stock-regular'),
    buy('Poké Ball', 180, 'poke-ball', 'Cleaned, and oiled at the hinge.', 'tam-stock-regular'),
    buy('Two Oran Berries', 180, 'oran-berry', 'The two best on the tray.', 'tam-stock-regular', undefined, 2),
    ch('That\'s all.', out('He touches his hat. "Next stage. I keep something back for a third visit."')),
  ]),
  {
    id: 'wm-3', name: 'The Rare Box', requires: [is('tam-second'), later('tam-second', { stages: 1 }), not('tam-third')],
    intro: 'Tam is at a crossroads, and for once he is the one waving. Tam: "Third time. I keep a rare box for friends." It is a plain wooden box with a brass catch, the only thing on the cart he has not put a tag on.',
    choices: [
      ch('Open it. (₽1000)', out('He takes your money, and then he opens the catch for you himself, slowly, because he likes this part. Whatever is inside, it is worth every coin you paid and then some. Tam does not sell a friend a bad box.', flag('tam-third'), $(-1000), any('leftovers', 'life-orb', 'choice-band', 'choice-scarf', 'choice-specs', 'expert-belt', 'shell-bell', 'rocky-helmet')), { requires: [money(1000)] }),
      ch('Save it for Wicker.', out('He looks at you for a while from under the hat. Then he puts the box back on the cart, right at the front where he can see it. Tam: "She\'s got a box of her own, for the end. I\'ll put this in beside it." He clears his throat. "She\'ll want to know who."', flag('tam-third'), flag('tam-box-saved'), ...kind())),
      ch('What\'s in it?', out('Tam: "Something someone didn\'t come back for." He rests a hand on the lid. It is clear he thinks that is the saddest and the best thing a box can hold.', flag('tam-asked-box'), room('wm-3'))),
    ],
    remembers: [v('asked', [is('tam-asked-box')], { intro: 'The plain wooden box sits between you on the cart. Something someone did not come back for. Tam waits, in no hurry at all.', hide: [2] })],
  },
  {
    id: 'wm-4', name: 'Route\'s End', requires: [is('tam-third'), later('tam-third', { stages: 1 }), not('tam-done')],
    intro: 'Tam\'s cart, packed up. Tray strapped down, tarp roped, the squeaky wheel chocked with a stone. He is sitting on the tailboard, which you have never seen him do. Tam: "My route ends here. Knees. Wicker\'s taking me on the cart. Riding, at last." He holds out a folded cloth with three things in it. Tam: "Take this. You earned it."',
    choices: [
      ch('Thank you.', out('He nods. That is all the speech he has in him. He lets you look at all three.', flag('tam-done'), room('tam-gift'))),
      ch('Ride with Wicker, then?', out('He laughs. You have never heard him laugh. It is a small dry sound, surprised at itself. "I am." He looks down the road he has walked for thirty years. "Two seats, she says. Had the second one made before she asked me." He lets you look at all three.', flag('tam-done'), flag('tam-rides'), room('tam-gift'))),
      ch('Keep your route.', out('Tam: "No. It\'s done." He says it without sorrow. A thing can be finished and still have been good. He lets you look at all three.', flag('tam-done'), room('tam-gift'))),
    ],
  },
  sub('wm-1', 'tam-gift', 'Tam\'s Gift', 'Three things on a folded cloth, each of them something someone did not come back for, each of them kept oiled and wrapped for years against the day it would be wanted. "One," says Tam. "Whichever."', [
    ch('The Leftovers.', out('He wraps it back in the cloth and gives you the cloth too.', item('leftovers'))),
    ch('The Scope Lens.', out('He wraps it back in the cloth and gives you the cloth too.', item('scope-lens'))),
    ch('The Shell Bell.', out('He wraps it back in the cloth and gives you the cloth too.', item('shell-bell'))),
  ]),
  {
    id: 'peddler-2', name: 'A New Wheel', requires: [is('wicker-met'), flagAgo('wicker-met', 1), not('wicker-second')],
    // Base: the fund is short (under 3). The new wheel is the variant.
    intro: 'Wicker\'s cart. The wobbly wheel is the same wheel, splinted now with two slats and a great deal of twine. She sees you looking at it, and beams as if it were brand new. Wicker: "Look who I found on the road! I\'ve been telling everyone about you." She pats the splint. "Next region."',
    choices: [
      ch('Show me the stock.', out('The tarp goes back. Eight things this time, and one of them she has put right in the middle on a square of velvet.', flag('wicker-second'), flagAt('wicker-second-at'), room('wicker-stock2'))),
      ch('And Tam?', out('Wicker: "Still walking his road. Won\'t ride. Stubborn." She says "stubborn" the way other people say a pet name. Then she throws the tarp back.', flag('wicker-second'), flagAt('wicker-second-at'), room('wicker-stock2'))),
      ch('Tell me about the box.', out('There is a wrapped box in the corner of the cart, roped down separately from everything else. Her hand goes to it without her looking. Wicker: "Not yet. That\'s the reason I started. You\'ll get it." For once she is not laughing. Then she is again, and the tarp goes back.', flag('wicker-second'), flagAt('wicker-second-at'), flag('wicker-box-seen'), room('wicker-stock2'))),
    ],
    remembers: [
      v('wheel-and-sign', [is(W, 30)], { intro: 'Wicker\'s cart, and you nearly do not know it. A new wheel, round and true. A new painted sign across the side, red on cream: WICKER & TAM, FOUND GOODS. Wicker: "Look who I found on the road! I\'ve been telling everyone about you." She slaps the wheel. "The wheel\'s from you. Well, from what you bought. Same thing."' }),
      v('new-wheel', [is(W, 15)], { intro: 'Wicker\'s cart, running straight for once. A new wheel, round and true, and above it a sign she has only half finished painting: WICKER & TAM, FOUND G. Wicker: "Look who I found on the road! I\'ve been telling everyone about you." She slaps the wheel. "The wheel\'s from you. Well, from what you bought. Same thing."' }),
    ],
  },
  sub('peddler-1', 'wicker-stock2', 'Wicker & Tam, Found Goods', 'Wicker\'s cart, tarp thrown back. Eight things, tagged in her neat hand.', [
    buy('Super Potion', 700, 'super-potion', 'Newspaper and string. "Same doctor. He really ought to tie things down."', 'wicker-stock2', W),
    buy('Ultra Ball', 800, 'ultra-ball', '"Month and a day in my ledger. It\'s yours fair and square."', 'wicker-stock2', W),
    buy('Full Heal', 400, 'full-heal', 'She checks the seal against the light. "Checked."', 'wicker-stock2', W),
    ch('See the rest.', out('"Oh, the good end. Come round this side."', room('wicker-stock2-b'))),
  ]),
  sub('peddler-1', 'wicker-stock2-b', 'Wicker & Tam, Found Goods', 'The good end of the cart.', [
    buy('Lum Berry', 500, 'lum-berry', 'She picks the best of the punnet.', 'wicker-stock2-b', W),
    buy('Expert Belt', 1500, 'expert-belt', '"Somebody clever lost that. Somebody cleverer found it."', 'wicker-stock2-b', W),
    buy('Revive', 2000, 'revive', 'Both hands. "Thank you. I mean it."', 'wicker-stock2-b', W),
    ch('And the one on the velvet?', out('She had been hoping you would ask.', room('wicker-stock2-c'))),
  ]),
  sub('peddler-1', 'wicker-stock2-c', 'Wicker & Tam, Found Goods', 'The square of velvet, and what is on it. Beside it, last of the eight, a plain band.', [
    buy('Muscle Band', 1000, 'muscle-band', '"Plain, but it works. Like Tam."', 'wicker-stock2-c', W),
    buy('Leftovers (Rare)', 3000, 'leftovers', 'She lifts it off the velvet as if it might wake. "Rarest thing I ever found. I held it three months, not one. I wanted to be sure." She puts it in your hands. "That\'s most of a sign, that is."', 'wicker-stock2-c', W),
    ch('That\'s all, thanks.', out('The tarp comes down. "Tell people! Wicker and Tam! Found goods!"')),
  ]),
  {
    id: 'peddler-3', name: 'The Last Delivery', requires: [is('wicker-second'), flagAgo('wicker-second-at', 1), not('wicker-done')],
    // Base: no shop money yet (fund under 6), Tam not met.
    intro: 'A crossroads at dusk. Wicker is waiting with a wrapped box in her arms, the one that was always roped down in the corner. Wicker: "Last delivery of my career. I\'m retiring. Opening a shop. With a door." She laughs, shorter than usual. "Haven\'t the money for the door yet. I\'ll get there." She holds the box out. "I want you to have the reason I started." She opens it. Inside is a cap. It is yours. Worn soft in the places yours is worn soft. Yours is on your head. Wicker: "I found it the day I hurt my leg. Sat in the ditch holding it. Thought, someone lost this, and someone\'ll come back. Nobody did. So I went looking. Turns out it was you."',
    choices: [
      ch('Thank you.', out('You take it. It fits. Of course it fits. Wicker watches you turn it over in your hands and wipes her eyes with her patched sleeve, and laughs at herself for doing it. "Years, I carried that. Years. Lightest thing on the cart and the heaviest." Tucked inside the crown, wrapped in a twist of paper, is a little something she has added for the road.', flag('wicker-done'), any('amulet-coin', 'lucky-egg', 'quick-claw'), fr(3, 'party'))),
      ch('Keep it. It\'s yours too.', out('She stares at you. Then her whole face folds up, and she cries, properly, leaning on her stick at the crossroads with the cap held against her chest. "In the window," she gets out. "I\'ll put it in the window. So everyone who comes in asks." She grips your arm. "You never pay full at my counter. Not you. Not ever." And for the rest of this journey, wherever her word reaches, you do not.', flag('wicker-done'), flag('wicker-window'), region('Wicker\'s word: prices are a fifth lower', { kind: 'priceMultiplier', group: 'all', value: 0.8 }), ...kind(2), moment('Wicker kept your cap for her shop window, so that everyone would ask', 80))),
      ch('How did you know it was mine?', out('She looks at you as if it were the simplest question anyone had ever asked her. Wicker: "Same laugh." And she laughs, the tremendous one, too big for the crossroads, and you hear it, and you hear yours in it. She puts the cap in your hands. Tucked in the crown is a little something for the road.', flag('wicker-done'), any('amulet-coin', 'lucky-egg', 'quick-claw'), fr(3, 'party'))),
    ],
    remembers: [
      v('ledger', [is('wicker-ledger')], { notice: 'She has the ledger open on the cart beside her, at a page from years back. One find. One date. One ditch. And on the line for the name, which was blank for all those years, your name, in fresher ink. You look at the date beside it. She wrote it in the day you met.' }),
      v('shop-and-tam', [is(W, 30), is('tam-met')], { intro: 'A crossroads at dusk. Wicker is waiting with a wrapped box in her arms, and beside her, sitting on the tailboard with his hat on his knee, is Old Tam. Wicker: "Last delivery of my career. I\'m retiring. Opening a shop. With a door." Tam nods, as if the door had been his idea. Wicker holds the box out. "I want you to have the reason I started." She opens it. Inside is a cap. It is yours. Worn soft in the places yours is worn soft. Yours is on your head. Wicker: "I found it the day I hurt my leg. Sat in the ditch holding it. Thought, someone lost this, and someone\'ll come back. Nobody did. So I went looking. Turns out it was you."' }),
      v('tam-there', [is('tam-met')], { intro: 'A crossroads at dusk. Wicker is waiting with a wrapped box in her arms, and beside her, sitting on the tailboard with his hat on his knee, is Old Tam. Wicker: "Last delivery of my career. I\'m retiring. Opening a shop. With a door." She laughs, shorter than usual. "Haven\'t the money for the door yet. I\'ll get there." Tam says, to nobody, "She will." Wicker holds the box out. "I want you to have the reason I started." She opens it. Inside is a cap. It is yours. Worn soft in the places yours is worn soft. Yours is on your head. Wicker: "I found it the day I hurt my leg. Sat in the ditch holding it. Thought, someone lost this, and someone\'ll come back. Nobody did. So I went looking. Turns out it was you."' }),
    ],
  },
  sub('peddler-1', 'wicker-tams-box', 'The Box Tam Saved', 'Wicker catches your sleeve before you go. From under the seat she pulls a second box: plain wood, a brass catch. You know it. Wicker: "Tam says you turned this down so I could have it. Daft. Lovely, but daft." She pushes it at you. "I\'m retiring. What do I want with a rare box? Open it."', [
    ch('Open it.', out('The catch is stiff. Inside, in a nest of wood shavings, is the best thing Tam ever found on thirty years of road. Something someone did not come back for. It has come to you the long way round, through two people who each tried to give it to the other.', any('leftovers', 'life-orb', 'choice-band', 'choice-scarf', 'choice-specs'), flag('tam-box-opened'))),
  ], { callback: true, requires: [is('tam-box-saved'), is('wicker-done'), not('tam-box-opened')] }),
];

// =====================================================================================================================
// SF6. THE PEN PAL. P writes once a region. P is the rival's younger sibling, Pim.
// =====================================================================================================================
const wrote = (topic: string): Json[] => [flag('penpal-wrote'), flag(`penpal-wrote-${topic}`)];
const PENPAL: Json[] = [
  {
    id: 'pen-pal-letter', name: 'A Letter Waiting', requires: [{ kind: 'rivalMet', atLeast: 1 }, not('penpal-1')],
    intro: 'A courier jogs up, checks your face against something written on his wrist, and presses a small envelope into your hand. Courier: "From someone who remembers you. Left at the post office." The letter is in neat pencil, the letters carefully joined. "Hello. You don\'t know me. I know a bit about you. Is it true you walk everywhere, even when there\'s a faster way? Why? — P."',
    choices: [
      ch('Because it was right.', out('You write it on the back of the envelope and give it to the courier, who tucks it in his cap. A region from now there will be an answer waiting, in the same neat pencil. It will say: "I thought so."', flagAt('penpal-1'), flag('penpal-right'), ...wrote('why'))),
      ch('I don\'t know.', out('You write it down exactly like that. It looks very bare on the paper. The courier takes it without reading it. A region from now, the answer will say: "That\'s alright. I don\'t know most things either."', flagAt('penpal-1'), flag('penpal-honest'), ...wrote('why'))),
      ch('Who are you?', out('You send the question back. The answer, when it comes, is one line: "Someone ahead of you on the road. That\'s all for now." Under it, rubbed out but not quite, another line that began "My" and stopped.', flagAt('penpal-1'), flag('penpal-curious'), ...wrote('why'))),
    ],
    remembers: [
      v('freed', [is('freed-caged')], { intro: 'A courier jogs up, checks your face against something written on his wrist, and presses a small envelope into your hand. Courier: "From someone who remembers you. Left at the post office." The letter is in neat pencil, the letters carefully joined. "Hello. You don\'t know me. I know a bit about you. Is it true you opened the cage and let them all go? Why? — P."' }),
      v('wallet', [is('honest-returned-wallet')], { intro: 'A courier jogs up, checks your face against something written on his wrist, and presses a small envelope into your hand. Courier: "From someone who remembers you. Left at the post office." The letter is in neat pencil, the letters carefully joined. "Hello. You don\'t know me. I know a bit about you. Is it true you gave the wallet back with everything still in it? Why? — P."' }),
      v('helped', [is('kind-helped-stranger')], { intro: 'A courier jogs up, checks your face against something written on his wrist, and presses a small envelope into your hand. Courier: "From someone who remembers you. Left at the post office." The letter is in neat pencil, the letters carefully joined. "Hello. You don\'t know me. I know a bit about you. Is it true you stopped to help a stranger who had nothing to give you? Why? — P."' }),
    ],
  },
  {
    id: 'pen-pal-mailbox', name: 'The Mailbox', requires: [is('penpal-1'), flagAgo('penpal-1', 1), not('penpal-2')],
    intro: 'A mailbox on a post, where no house is. A name is chalked on it: P. A letter sticks out of the slot. It is not signed this time. It did not need to be. "I saw a trainer today who everyone says is the best. I think they\'re lonely. Are you lonely?" In the corner there is a tiny drawing of a Pokémon, done with great care and much rubbing out. You know that Pokémon. It is what your rival\'s first partner was, before it grew.',
    choices: [
      ch('Sometimes.', out('You write it small. You put it in the box and shut the flap. The answer, when it finds you, says: "Me too. My sibling\'s always away."', flagAt('penpal-2'), flag('penpal-lonely'), ...wrote('lonely'))),
      ch('Not with my team.', out('You write it, and your lead reads it over your arm and looks insufferably pleased. The answer, when it finds you, says: "That\'s a nice answer. I\'ll tell them."', flagAt('penpal-2'), flag('penpal-team'), ...wrote('lonely'), fr(3, 'party'))),
      ch('Are you?', out('You send the question straight back. The answer, when it finds you, says: "Only on Tuesdays." Under it is a second tiny drawing, of the same Pokémon, laughing.', flagAt('penpal-2'), flag('penpal-joke'), ...wrote('lonely'))),
    ],
  },
  sub('pen-pal-mailbox', 'pen-pal-third', 'The Pressed Flower', 'A third letter, waiting at the next region\'s post office with your name on it. When you unfold it a pressed flower slides out: small, blue, a kind that only grows in one place you know. Your rival was there, a region ago. "My sibling says you\'re the only one who makes them try. Is that a good thing?"', [
    ch('Yes.', out('You write the one word and underline it. You put the flower back between the pages, where it was.', flagAt('penpal-3'), flag('penpal-yes'), ...wrote('try'))),
    ch('It\'s hard work.', out('You write: for both of us. You think about it, and leave it in. You put the flower back between the pages.', flagAt('penpal-3'), flag('penpal-hard'), ...wrote('try'))),
    ch('Tell them to rest.', out('You write it, and then, because it looks like an order, you add: please. You put the flower back between the pages. Somewhere ahead of you on the road, someone who never rests is going to be told to, by the one person they cannot argue with.', flagAt('penpal-3'), flag('penpal-rest'), ...wrote('try'), trust(1))),
  ], { callback: true, requires: [is('penpal-2'), flagAgo('penpal-2', 1), not('penpal-3')] }),
  sub('pen-pal-mailbox', 'pen-pal-p', 'P.', 'The post office in the last town on the road. Behind the counter window, on a stool too tall for them, a child is waiting, chin on both fists. They have your rival\'s eyes. They have your rival\'s hair. Everything about them is your rival, much smaller. Pim: "Hi. I\'m P." Then, in a rush: "I\'m their little sibling. They talk about you all the time. Like, ALL the time." Pim looks you up and down, checking you against a long file of pencil letters. "I wanted to know if you were nice or if they just think you\'re good at battling."', [
    ch('What\'s the verdict?', out('Pim takes this seriously. Pim counts on fingers. "Nice. That\'s from the first letter. Honest. That\'s from when you said you didn\'t know." Pim thinks. "Lonely, but okay." Pim holds the verdict up to the light one more time, and nods, and stamps it with an imaginary stamp.', flag('penpal-met'), room('pen-pal-p-rival'))),
    ch('Does your sibling know?', out('Pim nearly falls off the stool. Pim: "No! Don\'t tell!" Both hands flat on the counter. "They\'d go red. They go SO red. You have to promise." You are still deciding whether to promise when the door opens behind you.', flag('penpal-met'), flag('penpal-asked-know'), room('pen-pal-p-rival'))),
    ch('I\'m both.', out('Pim considers this with enormous gravity, and then grins your rival\'s grin, exactly, on a face half the size. Pim: "That\'s what I\'ll tell them."', flag('penpal-met'), room('pen-pal-p-rival'))),
  ], {
    callback: true, rarity: 'rare', requires: [is('penpal-3'), flagAgo('penpal-3', 1), not('penpal-met')],
    remembers: [
      v('weird', [is('penpal-joke'), is('penpal-wrote', 3)], { notice: 'On the counter beside Pim is a bundle tied with a bootlace: every letter you sent, in order, the corners squared. And a note for themselves on top, in neat pencil, that says only: WEIRD (good).' }),
      v('all-letters', [is('penpal-wrote', 3)], { notice: 'On the counter beside Pim is a bundle tied with a bootlace: every letter you sent, in order, the corners squared. Pim pushes it across. "So you can see what you said."' }),
    ],
  }),
  sub('pen-pal-mailbox', 'pen-pal-p-rival', 'Oh No', 'The door of the post office bangs. Your rival, halfway through it, with a parcel slip in one hand. Rival: "Pim? What are you— oh." They see you. They see the bundle of letters. They see everything, all at once. Rival: "Oh no." Pim has gone completely still on the stool, the way a small animal does, and is looking at you.', [
    ch('Your sibling\'s great.', out('Your rival opens their mouth, and shuts it, and looks at Pim, and something in their shoulders comes down that you have never seen come down. "Yeah," they say. "Yeah, they are." Pim beams until it seems the stool might take off. On the way out your rival presses something into your hand without looking at you: an old Ball charm, a child\'s one, the paint worn through. "First one I ever had. Pim says you should have it." Then, lower: "It was called Button. My first Pokémon. Don\'t tell anyone."', trust(1), flag('penpal-done'), flag('rival-name-known'), fr(3, 'party'))),
    ch('Pim wrote to me.', out('Your rival turns to the stool. "You WROTE to—" Pim holds up the bundle like a shield. Your rival takes the top letter and reads your handwriting, and goes on reading, and whatever is written there, it is enough. The parcel slip is forgotten. "You said that?" they ask you. "To a kid you\'d never met?" On the way out they push an old, worn Ball charm into your hand. "First one I ever had. And its name was Button. Don\'t."', flag('penpal-done'), flag('rival-name-known'), trust(1)), { requires: [is('penpal-right')] }),
    ch('I didn\'t tell.', out('Pim lets out a breath like a kettle. Pim is delighted. Pim mouths THANK YOU with their whole face. And your rival, looking from one of you to the other, starts to laugh, helplessly, leaning on the door. "You two. You two have been—" They cannot finish. On the way out they push an old, worn Ball charm into your hand. "First one I ever had. Its name was Button. Pim will tell you anyway."', trust(1), flag('penpal-done'), flag('rival-name-known'), fr(3, 'party'))),
  ], {
    remembers: [
      v('honest', [is('penpal-honest'), not('penpal-right')], { hide: [1], add: [ch('Pim wrote to me.', out('Your rival turns to the stool. "You WROTE to—" Pim holds up the bundle like a shield. Your rival takes the top letter, and reads your handwriting. I don\'t know, it says. They read it twice. "You told a kid you didn\'t know," they say slowly. "I never tell anyone that." On the way out they push an old, worn Ball charm into your hand. "First one I ever had. And its name was Button. Don\'t."', flag('penpal-done'), flag('rival-name-known'), trust(1)))] }),
      v('curious', [not('penpal-right'), not('penpal-honest')], { hide: [1], add: [ch('Pim wrote to me.', out('Your rival turns to the stool. "You WROTE to—" Pim holds up the bundle like a shield. Your rival takes the top letter. Who are you, it says, in your hand. They look at you over the top of it. Nobody speaks. It is awkward in the way only three people in a small post office can be. Then Pim says, "They\'re nice, though," and the worst of it passes. On the way out your rival pushes an old Ball charm at you, not quite meeting your eye. "Pim says. It was called Button."', flag('penpal-done'), flag('rival-name-known')))] }),
    ],
  }),
];

export const EVENTS: Json[] = [...APPRENTICE, ...FARMER, ...ELDER, ...WICKER, ...PENPAL];
export const REMOVE: string[] = [];

void lv; void join; void sly; void later;
