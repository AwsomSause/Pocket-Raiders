// Anime questlines, module 6: AQ9-AQ15, AQ17. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ9  The Muk That Hugs              (Single, two nodes;   script: QUESTLINES_ASH.md "AQ9")
//   AQ10 The Thirty Tauros              (Single;              script: QUESTLINES_ASH.md "AQ10")
//   AQ11 The Baby Lapras                (Companion;           script: QUESTLINES_ASH.md "AQ11")
//   AQ12 The Snorlax and the Melons     (Single;              script: QUESTLINES_ASH.md "AQ12")
//   AQ13 The Ghost Who Made Her Laugh   (Companion;           script: QUESTLINES_ASH.md "AQ13"; in Kanto, Haunter's Prank is its meeting)
//   AQ14 The Sap Thief                  (Single, three scenes; script: QUESTLINES_ASH.md "AQ14")
//   AQ15 The Jealous One                (Companion;           script: QUESTLINES_ASH.md "AQ15")
//   AQ17 The Herd's Little One          (Companion;           script: QUESTLINES_DEEPENED_2.md "AQ17")
// Build: npm run co:build -- anime-6
import { $, anyType, bondIs, ch, ev, ferry, fight, flag, flagAgo, flagAt, flagIs, fr, has, heal, item, leave, lose, lv, out, room, statusLead, takeNode, type Json } from '../dsl.ts';
import { AQ, age, beast, notYet, monDuel, bondLine, duel, evolve, farewell, gain, hasMon, knows, line, moment, seen, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ9: 'aq09-muk-that-hugs',
  AQ10: 'aq10-thirty-tauros',
  AQ11: 'aq11-baby-lapras',
  AQ12: 'aq12-snorlax-and-the-melons',
  AQ13: 'aq13-ghost-who-made-her-laugh',
  AQ14: 'aq14-sap-thief',
  AQ15: 'aq15-jealous-one',
  AQ17: 'aq17-herds-little-one',
};

export const PLACEMENT: Record<string, Place> = {
  'aq09-muk-that-hugs': { shape: 'Single', earliest: 'A3', home: 'a + node', sits: 'optional', attaches: 'rest', note: 'Single: two nodes. It is outside the Pokémon Center; "Find it someone." takes the next two nodes.' },
  'aq10-thirty-tauros': { shape: 'Single', earliest: 'A4', home: 11, window: [8, 14], sits: 'optional', tags: ['normal'], note: 'Normal-type stages. A ranch.' },
  'aq11-baby-lapras': { shape: 'Companion', earliest: 'A4', home: 10, window: [7, 13], sits: 'optional', tags: ['water', 'snow'], beats: ['aq11-first-island', 'aq11-second-island', 'aq11-third-night', 'aq11-the-pod', 'aq11-lapras-surfaces'], note: 'A beach. The three islands are the small scenes; the third island (its pod, and poachers) is the turning point two stages on, on a water stage.' },
  'aq12-snorlax-and-the-melons': { shape: 'Single', earliest: 'A2', home: 8, window: [5, 11], sits: 'optional', tags: ['forest'], beats: ['aq12-festival'], note: 'A melon town. The festival in its honour is a follow-up one stage after "Wake it with music."' },
  'aq13-ghost-who-made-her-laugh': { shape: 'Companion', earliest: 'A4', home: 12, window: [9, 15], sits: 'optional', attaches: 'town', tags: ['eerie'], beats: ['aq13-pratfall', 'aq13-vanishing', 'aq13-tickle', 'aq13-the-laugh'], note: 'The town: a silent Gym, off duty; else Step 12. In Kanto, Haunter\'s Prank (cs-kanto-lavender-tower-prank) is the meeting: aq13-tower-haunter follows it to the Gym. The turning point (the laugh) is two stages on.' },
  'aq14-sap-thief': { shape: 'Single', earliest: 'A2', home: 7, window: [4, 10], sits: 'optional', tags: ['forest'], note: 'Single: three small scenes. "Find it a sap tree." takes the next three nodes.' },
  'aq15-jealous-one': { shape: 'Companion', earliest: 'A3', home: 8, window: [5, 11], sits: 'optional', tags: ['forest'], beats: ['aq15-too-close', 'aq15-waiting-its-turn', 'aq15-too-big', 'aq15-the-ranch', 'aq15-the-ranch-early'], note: 'The turning point (the trainer\'s ranch) is two stages on; one stage on (aq15-the-ranch-early) when your starter is in the party.' },
  'aq17-herds-little-one': { shape: 'Companion', earliest: 'A3', home: 'a + node', sits: 'optional', tags: ['water'], level: 'A+2', beats: ['aq17-sideways', 'aq17-cant-stop', 'aq17-spring', 'aq17-herd-passes', 'aq17-lead-them', 'aq17-at-the-ford'], note: 'A breeder\'s camp on a water stage. The turning point ("Raise it to lead them") is a region later, at Stage 5, Step 13; the herd\'s leader is A+2, one on one.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ9: [
    'The hug poisons your lead Pokémon (until it is healed), not you: the player has no health of their own. The doc says the player is poisoned for one node.',
    'Remembers "the Polluted Factory was shut down" reads flag kanto-factory-cleared, which the Kanto Canon Spaces Polluted Factory (cs-kanto-fuchsia-factory) sets when its Magmuk is beaten.',
    'Afterstory "the NO MUK sign is gone in later runs" is not built (nothing crosses runs); the sign comes down in this run when the Muk is homed.',
  ],
  AQ10: [
    'Remembers "the player caught a Tauros in Safari Land this run" checks that you went into Safari Land (Kanto Canon Spaces, cs-kanto-fuchsia-safari) and have a Tauros in the party: the game does not record where a Pokémon was caught.',
    'Remembers "the player has completed AQ37 (The Old Guardian)" reads flag aq37-guardian-done, which the module that builds AQ37 must set when that story ends.',
  ],
  AQ11: [
    '"Three islands by sea" are the Companion beats: two islands as small scenes while its Bond rises, and the third island two stages after the meeting (the turning point), not three nodes in a row.',
    'Whether it stays with its pod is your choice at the end (Companion rule: the player always chooses); the doc leaves it to the Lapras ("It looks at the player").',
    '"It surfaces to carry the player across any sea once per run" is one scene a stage after it goes home, which carries you a node ahead (the skipAhead effect): the game has no sea crossings to choose from.',
  ],
  AQ12: [
    '"A long battle; it is sleepy and almost impossible to knock out" is a wild Snorlax that knows Rest and Sleep Talk.',
    'Remembers "The Sleeping Snorlax (Part 8) was done" reads flag sleeping-snorlax-done; the thread that builds the Sleeping Snorlax (gn.49, greenneedle) must set it.',
    'Afterstory "the festival is held every year in later runs" is not built (nothing crosses runs); the festival in its honour is held once, a stage later, in this run.',
  ],
  AQ13: [
    'In Kanto, Haunter\'s Prank is this meeting (QUESTLINES_PLACED.md, overlaps settled). The Prank (cs-kanto-lavender-tower-prank, another thread\'s Lavender Tower room) gives no Haunter, so a follow-up (aq13-tower-haunter, gated by seen of the Prank) brings that Haunter to the silent Gym and plays the meeting there; the drawn meeting stays away once either has played.',
    'The three-step routine (a pratfall, a disappearing trick, a tickle) is spread over the Companion beats: the Haunter joins you and rehearses one bit each time its Bond rises, then performs all three at the turning point, where the third works.',
    'The Haunter staying with her is your choice at the end (Companion rule: the player always chooses). If you keep it, she still gives the Twisted Spoon, but no Gastly.',
    'Remembers "the player completed Sabrina\'s Labyrinth (Part 8)" reads flag kanto-sabrina-labyrinth-done, set by the Kanto Canon Spaces labyrinth\'s last room.',
    'The Twisted Spoon is a new item (src/data/itemCatalog/anime-6.json: Psychic moves +20%). Afterstory "her Gym is loud in later runs" is not built (nothing crosses runs).',
  ],
  AQ14: [
    'Remembers "the player completed Viridian Forest\'s Samurai duel" checks seen of cs-kanto-pewter-forest-n6 (Kanto Canon Spaces, Veridian Forest: The Samurai).',
    'Afterstory "the Bulbasaur and Heracross share a tree in later runs" is not built (nothing crosses runs).',
  ],
  AQ15: [
    'Remembers "a Pokémon that has never left the party" is read as your starter being in the party (at Bond 1 or more): the game does not record whether a Pokémon ever left it. With it, the turning point comes a stage sooner (a second copy of the scene, aq15-the-ranch-early).',
    '"Spend time with just the Bayleef" (a stage of one-on-one): its trainer lends it to you, and the stage is the Companion beats with the Bayleef in your party; the rest of your party is not sent away.',
    'Handing the Bayleef back is your choice (Companion rule: the player always chooses). If it stays with you, there is no Chikorita.',
  ],
  AQ17: [
    '"Keep it": every time a herd passes, on any stage, it stops and watches. Built as one scene a stage later: the game has no herds passing on the map.',
    '"If it leads, it visits: at every water stage, it\'s at the ford" is one visit, a stage later on a water stage, where it leaves the tusk.',
    'The Donphan Leader\'s Tusk (new item, src/data/itemCatalog/anime-6.json) gives +12% accuracy to every move, so Rollout and Ice Ball (90%) no longer miss: the game has no accuracy hook for named moves.',
    'The one-on-one fight: your first Ground-type leads and cannot be switched out (battle rule leadType + noSwitch); the rule does not pick the Donphan itself.',
  ],
};

/** Set after the questline was re-read line by line against its doc. */
export const CHECKED: Record<string, string> = { AQ9: '2026-11-15', AQ10: '2026-11-15', AQ11: '2026-11-15', AQ12: '2026-11-15', AQ13: '2026-11-15', AQ14: '2026-11-15', AQ15: '2026-11-15', AQ17: '2026-11-15' };

const ANY: string[] = [];
const NORMAL = tagTypes('normal');
const SEA_SNOW = tagTypes('water', 'snow');
const SEA = tagTypes('water');
const WOOD = tagTypes('forest');
const EERIE = tagTypes('eerie');

// AQ13: the meeting's three choices, shared by the drawn meeting and the Kanto follow-up to Haunter's Prank.
const AQ13_HELP = ch('Help it.', out('The Haunter spins round, delighted, and shakes your hand with a hand that is not quite there. It has a plan, it tells you, in that feeling that is almost words: a routine. Three bits. It needs practice, and an audience that will not run away screaming. Your Pokémon, apparently. It drifts out of the Gym after you, already rehearsing, and the Leader watches it go without a flicker.', gain('haunter', { bond: 5 }), flag('aq13-haunter-met'), flag('aq13-gym-seen')));
const AQ13_JOKE = ch('Tell her a joke yourself.', out('You walk down to the steps and tell her the best joke you know. Silence. It goes on so long you can hear the lights hum again. Then a horrible wheezing cackle behind you: the Haunter, laughing at you, rolling in the air and holding its sides. And the Leader\'s mouth moves. Only one corner. Only for a moment. The Haunter stops dead in the air. It saw.', flag('aq13-gym-seen'), room('aq13-nearly')));
const AQ13_WHY = ch('Ask her why.', out('You sit two steps below her and ask. She does not look at you. "I gave my laugh to my powers when I was small," she says. "That was the price, and I paid it. I want it back." She turns the bent spoon over in her fingers. Behind you, the Haunter has gone very quiet.', flag('aq-haunter-why'), flag('aq13-gym-seen'), room('aq13-her-why')));
const AQ14_JOINS = (text: string, ...more: Json[]): Json => out(text, ...more, gain('heracross', { ability: 'sap-sipper', bond: 10 }), flag('aq14-heracross-joined'));
// AQ15: the turning point's choices, shared by its two copies (two stages on, or one when the starter is in the party).
const AQ15_RANCH = (): Json[] => [
  ch('Take it home.', out('You give him its Ball. He holds it like something that might break, and then he does not need it, because the Bayleef has its head on his shoulder and the Pikachu between its leaves. "Pick one," he says, nodding at the paddock behind him, full of small green leaves bobbing in the grass. "Any of them. It\'s the least I can do." One Chikorita marches straight up to you and sits on your foot. That settles it.', farewell('Bayleef goes home to its trainer', ['bayleef', 'meganium']), gain('chikorita', { bond: 10 }), flag('aq15-home'), moment('You walked a jealous Bayleef home, calm, to a trainer who had nearly given up on it.', 65))),
  ch('Ask him to let it stay with you.', out('He looks at the Bayleef for a long time. It looks back at him, and at the Pikachu, and then at you. "It chose already," he says at last, quietly. "Didn\'t it." He scratches it under the chin, the way he must have when it was small. "Go on, then. Visit." He does not offer you anything else, and you do not ask.', bondLine('chikorita', 10), flag('aq15-home'), flag('aq15-bayleef-stayed'), moment('A jealous Bayleef learned to share, and chose to stay with you.', 60))),
];
const AQ13_STAY = (text: string): Json => out(text, flag('aq-haunter-laugh'), room('aq13-stay'));

export const EVENTS: Json[] = [
  // ---------------- AQ9. The Muk That Hugs ----------------
  ev('aq09-muk-that-hugs', 'The Muk That Hugs', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: ANY, cast: ['trainer.pr/nursery_aide'], pokemon: 'muk', tint: '#2a2238', effect: 'none',
    remembers: [
      { id: 'max-bond', when: [bondIs(5)], notice: 'The Muk looks along your line of Pokémon and stops at {most}. Something passes between them. {most} has been loved for a long time, and it knows what a hug is worth.', hide: [0],
        addChoices: [ch('Let it hug you.', out('It goes straight past you. It stops in front of {most}, opens its arms, and waits. {most} looks back at you once. Then it steps in and lets itself be held, smell and all, for a long, long moment, and it does not flinch. Nobody faints. When they part, the Muk is shining, and it follows {most} down the road like a little brother who has finally been let into the game.', fr(5, 'top'), gain('muk', { bond: 20 }), flag('aq-muk-hugged')))] },
      { id: 'factory', when: [flagIs('kanto-factory-cleared')], notice: 'You know that smell. It is the factory you shut down: the green fog, the grimy pipes. When you tell the nurse, she takes the peg off her nose. "It came from there? Then it never had a chance." She sits down on the step beside it, close enough to touch.' },
    ] },
    'A Pokémon Center, and a sign taped to its door in big red letters: NO MUK. A Muk is sitting outside it, on the step, in a small puddle of itself. It is very still, the way someone sits when they have been told to wait and nobody has come back. The nurse comes out with a peg on her nose. "It hugs everyone. It means well. Three people fainted." She looks at it, and her voice goes soft. "Its trainer left it here. She couldn\'t get a job, smelling like that." The Muk sees you. Its whole body lifts. It opens its arms.',
    [
      ch('Let it hug you.', out('You step in. It is warm, and wet, and it smells like a drain that has given up, and it holds on as if you might be the last person in the world. Your eyes stream. Your head swims. {lead} rushes in to pull you free and gets hugged too, and comes out green and wobbling. The Muk is overjoyed. It will not leave your side. When you walk on, it slides along behind you, humming to itself.', statusLead('poison'), gain('muk', { bond: 20 }), flag('aq-muk-hugged'))),
      ch('Bathe it first.', out('Your Water-type gives it everything: a spray, a soak, a long rinse in the Center\'s fountain. The fountain turns brown. The Muk comes out gleaming and smelling exactly the same. It looks at the Water-type that worked so hard for it, and before anybody can stop it, it hugs that one instead. Your Water-type, to its great credit, hugs it back. The Muk follows you both down the road, delighted to be clean, which it is not.', fr(5, { types: ['water'] }), gain('muk', { bond: 10 })), { requires: [anyType('water')] }),
      ch('Find it someone.', out('You ask at every door for two whole nodes of road. People are kind about it, from a distance. They close their windows kindly. Then, at the far end of town, a manhole cover lifts, and a man in waders climbs out and asks what all the fuss is about.', takeNode(2), room('aq09-sewage-worker'))),
    ]),
  ev('aq09-sewage-worker', 'Somebody Who Can\'t Smell', AQ, { room: true, cast: ['trainer.worker_m'], pokemon: 'muk', tint: '#2a2238', effect: 'none' },
    'He is Mr. Osgood Prall, and he has worked the sewers for thirty years. "Lost my sense of smell the first week. Best thing that ever happened to me." He looks past you at the Muk, and his face goes very quiet. "Is that one... does it hug?" He swallows. "Nobody\'s hugged me since my mum."',
    [
      ch('Introduce them.', out('The Muk does not need introducing. It goes to him like water going downhill and wraps him up, all of him, and he stands in the middle of the street with his eyes shut, holding on. When he can speak again, he presses something into your hand: a lump of Black Sludge, wrapped in a clean handkerchief. "For your Poison-types. And thank you. You don\'t know what you\'ve done." You think you might. When you pass the Center on your way out, the NO MUK sign has gone.', item('black-sludge'), flag('aq-muk-homed'), fr(2))),
    ]),

  // ---------------- AQ10. The Thirty Tauros ----------------
  ev('aq10-thirty-tauros', 'The Thirty Tauros', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: NORMAL, cast: ['trainer.pr/breeder_m'], pokemon: 'tauros', tint: '#3a2c1a', effect: 'none',
    remembers: [
      { id: 'grandcalf', when: [seen('cs-kanto-fuchsia-safari'), hasMon('tauros')], notice: 'Your Tauros has gone very still. Then it is over the fence before you can call it, running flat out for the ring. The rancher stares after it. "That one\'s from the Safari Zone. Look at the shoulders. That\'s the old one\'s grandcalf." The ring opens, and lets it in.' },
      { id: 'guardian', when: [flagIs('aq37-guardian-done')], notice: 'You have seen this before, with the old guardian. You tell the rancher what the herd is doing. They are not guarding it. They are keeping it company, so it does not have to go alone. He puts his hat back on, slowly, and nods.' },
    ] },
    'A ranch at the end of a long fence. Thirty Tauros, and not one of them is grazing. They stand in a ring in the far field, shoulder to shoulder, tails still. The rancher leans on the gate. "A trainer caught all thirty in one day, in the Safari Zone. Brought them here. Comes to visit, sometimes." He takes his hat off and turns it in his hands. "The oldest one is dying. The others won\'t leave it to eat." In the middle of the ring an old Tauros lies in the grass, grey at the muzzle, breathing slow.',
    [
      ch('Sit with the herd.', out('You climb the fence and walk out across the field. Thirty heads turn toward you. Nobody charges. A gap opens in the ring, just wide enough, and you sit down in it, in the cool grass, with the old one\'s slow breath in front of you. The herd lets you stay. The sun goes down. Nobody moves all night, and neither do you.', takeNode(1), flag('aq-tauros-sat'), room('aq10-dawn'))),
      ch('Call a doctor.', out('It takes two nodes to bring her out and back. The doctor kneels in the grass beside the old one for a long time, with the herd breathing all round her. "There\'s nothing to fix," she says at last. "It\'s just old. It\'s done everything a Tauros does." She gives it something for the pain. Its breathing eases. It goes in the night, easy, with its head on the grass. In the morning the herd is grazing, and the rancher is cutting a notch into the far post.', takeNode(2), flag('aq-tauros-doctor'))),
      ch('Let them be.', leave('You leave them their field. It dies in the night. You hear it from the road: thirty voices at once, low, and then nothing at all. In the morning, when you look back from the hill, the herd is grazing.')),
    ]),
  ev('aq10-dawn', 'Dawn in the Ring', AQ, { room: true, cast: ['trainer.pr/breeder_m'], pokemon: 'tauros', tint: '#4a3a24', effect: 'none' },
    'Near dawn, the old Tauros lifts its head one last time and looks round the ring at all of them, one by one. Then it lays its head down. The herd stands a while longer. As the light comes, they break the circle and go to graze, slowly, one by one. The youngest does not go. It walks out of the circle, across the wet grass, and stands beside you. The rancher is at the fence. He has seen this. "It chose," he says quietly.',
    [
      ch('Take it with you.', out('"Go on," the rancher says. "They do that, sometimes. Pick somebody." The young Tauros stamps once, and falls in at your side. On your way out you pass the far post. The rancher is cutting a notch into it: the first of thirty, he says, though he hopes he never gets to the last.', gain('tauros', { bond: 20 }), moment('You sat all night in the ring of thirty Tauros while the oldest died, and the youngest chose you.', 65))),
      ch('Send it back to its herd.', out('You put your hand on its neck and turn it, gently, toward the others. It looks at you a long time. Then it goes, and the herd makes room for it. The rancher is cutting a notch into the far post. "Thirty notches, one day," he says. "That\'s a lot of goodbyes." You think the herd will be all right. They know how to do it now.', fr(3))),
    ]),

  // ---------------- AQ11. The Baby Lapras ----------------
  ev('aq11-baby-lapras', 'The Baby Lapras', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: SEA_SNOW, cast: ['trainer.fisherman'], pokemon: 'lapras', tint: '#1a2c3e', effect: 'none' },
    'A grey beach under a grey sky. Something small is crying at the water\'s edge: one high, thin note, over and over. It is a baby Lapras, no bigger than a rowing boat, all alone. When you step closer it backs into the surf, shaking, and the note goes higher. An old fisherman is mending a net on the rocks. "Some kids were cruel to it. Threw stones, for fun. It doesn\'t trust anyone now." He points his needle out to sea. "Its pod went that way. Three islands ago."',
    [
      ch('Take it to its pod.', out('You wade in up to your knees and wait. It takes a long time. Then it comes, an inch at a time, and lays its head against your hand as if it is not sure hands can be like this. The fisherman nods slowly. "Three islands. Let it carry you. It needs to be some use to somebody, after what they did." It sings once, short and clear, at the open sea.', gain('lapras', { bond: 5 }), flag('aq11-lapras-met'), flag('aq11-to-pod'))),
      ch('Raise it.', out('You sit on the sand, and it watches you from the waves until the tide brings it in. When it finally touches your hand, you tell it that it can come with you, and stay. It comes. It is gentle, and good, and it carries your bag in the shallows. Only at night it sings at the sea, the same short call, and listens for an answer that does not come.', gain('lapras', { bond: 5 }), flag('aq11-lapras-met'), flag('aq11-raised'))),
      ch('Leave it with the fisherman.', leave('The fisherman sets down his net. "I\'ve a boat, and nobody to fill it but me." He wades out, very slowly, and talks to it in a low voice for a long time, about nothing: the tide, the gulls, his knees. When you look back from the headland, the little Lapras is in the shallows beside his boat. It is not crying. It is happy.')),
    ]),
  // Small scenes: the islands, one each time its Bond rises, while it is in the party.
  ev('aq11-first-island', 'The First Island', AQ, { callback: true, requires: [flagIs('aq11-lapras-met'), line('lapras', 1), age('aq11-lapras-met', 1)], pokemon: 'lapras', tint: '#1a2c3e', effect: 'none',
    remembers: [{ id: 'raised', when: [flagIs('aq11-raised')], notice: 'You were not taking it anywhere. It took you here. It wanted to look.' }] },
    'The first island: a rock, a bent tree and a great many gulls. The Lapras carries you there on its back, though it is barely big enough, paddling hard and very proud of itself. On the beach it lifts its head and sings its short call, as loud as it can. The gulls answer. Nothing else does.',
    [
      ch('Sing back.', out('You are not much of a singer. You sing anyway: the same short call, as near as you can get it. It turns and stares at you. Then it sings again, and you answer again, and the two of you go on like that until the light goes, two voices over an empty sea.', bondLine('lapras', 5), flag('aq11-island-1'))),
      ch('Let it rest on the sand.', out('It is worn out, though it would never say so. You sit with it on the warm sand while it sleeps, with one flipper over your foot to make sure you do not leave. In its sleep it sings, very quietly.', bondLine('lapras', 5), flag('aq11-island-1'))),
    ]),
  ev('aq11-second-island', 'The Second Island', AQ, { callback: true, requires: [seen('aq11-first-island'), line('lapras', 2)], pokemon: 'lapras', tint: '#1e3446', effect: 'none' },
    'It is bigger now. It carries you to the second island without a breath of strain. There is a fishing village here, and a pier, and on the pier a row of children. The Lapras stops dead in the water. It remembers children. It starts to back away, shaking, and one of the children holds out a fish.',
    [
      ch('Stand between it and the pier.', out('You slide off its back into the water and stand in front of it, up to your chest in the cold sea, until the children have gone home. It presses its head against your back the whole time. It is not shaking any more. It is only waiting, because you are there.', bondLine('lapras', 5), flag('aq11-island-2'))),
      ch('Let the children come, slowly.', out('You hold its neck and talk to it, low and steady, and the child with the fish comes down the steps one at a time. "Hello," she says. "I\'m sorry somebody was mean." It takes the fish. It takes it very carefully, so it does not touch her fingers. Then it sings at her, and all the children cheer.', bondLine('lapras', 5), flag('aq11-island-2'), flag('aq11-children'))),
    ]),
  ev('aq11-third-night', 'Something Answers', AQ, { callback: true, requires: [seen('aq11-second-island'), line('lapras', 3)], pokemon: 'lapras', tint: '#14243a', effect: 'sparkle' },
    'Night, out at sea, with the stars thick and low. The Lapras sings its short call into the dark, as it does every night. And this time, far away, so faint you could be imagining it, something answers. It goes still under you. It sings again. The answer comes again: a long, low note, the voice of something very big. It has grown so much since the beach. You feel it grow a little more, right there, listening.',
    [
      ch('Follow the song.', out('It swims toward the sound all night, steady and sure, carrying you without a word. By dawn the answer has stopped. But it knows the way now. It has heard it.', bondLine('lapras', 5), lv(1, { species: ['lapras'] }), flag('aq11-heard-pod'))),
      ch('Hold on, and let it listen.', out('It does not swim. It floats there till morning, listening, singing back once in a while, very softly, as if afraid of being too loud. You lie on its back and watch the stars. It is not lonely tonight.', bondLine('lapras', 5), lv(1, { species: ['lapras'] }), flag('aq11-heard-pod'))),
    ]),
  // The turning point: the third island, two stages after the meeting, while it is still in the party.
  ev('aq11-the-pod', 'The Third Island', AQ, { callback: true, requires: [flagIs('aq11-lapras-met'), age('aq11-lapras-met', 2), line('lapras')], types: SEA, cast: ['trainer.roughneck'], pokemon: 'lapras', tint: '#1a2c3e', effect: 'rain',
    remembers: [
      { id: 'mother', when: [seen('r133-lapras-ferry')], notice: 'At the front of the pod is a Lapras you know: the one that waited at the shore and carried you across the water. It is calling, over and over, and your Lapras is calling back. It is its mother.' },
      { id: 'raised', when: [flagIs('aq11-raised')], notice: 'You never promised to bring it here. It brought you. It has been lonely for this sound since the beach.' },
    ] },
    'The third island. The pod is here: a dozen great grey backs in the bay, singing all together. Your Lapras answers louder than you have ever heard it. Then you see the boats. Two of them, low and fast, with a net strung between, closing on the pod from the seaward side. Poachers. One of them stands up in the bow and points straight at your Lapras. "Get the little one too. Little ones fetch more."',
    [
      ch('Stop the poachers.', fight('You turn your Lapras toward the boats. It goes without being asked.', duel('Poachers', { cls: 'roughneck', size: 2, format: 'doubles', types: ['water', 'dark'], win: [flag('aq11-poachers-stopped'), room('aq11-pod-leader')] }, { lose: [flag('aq11-poachers-fled'), room('aq11-pod-leader')] }))),
      ch('Sing the warning with it.', out('You both sing: your Lapras with everything it has, you with your hands round your mouth. The pod hears. Twelve grey backs go under at once, deep, and the net closes on empty water. The poachers curse and turn for the open sea.', flag('aq11-warned'), room('aq11-pod-leader'))),
    ]),
  ev('aq11-pod-leader', 'The Pod', AQ, { room: true, pokemon: 'lapras', tint: '#1e3446', effect: 'sparkle',
    remembers: [
      { id: 'asked', when: [flagIs('aq11-to-pod'), flagIs('aq11-poachers-stopped')], intro: 'The boats are gone. The pod comes up all round you, and the biggest of them, old and scarred along one side, swims slowly up to your Lapras and touches its nose to its nose. It is the pod leader. It looks at the little one for a long time, and then at you, and then back. It is asking it to stay. Your Lapras looks at the pod. It looks at you.' },
    ] },
    'When the sea is quiet again, the pod surfaces, far out in the bay. They sing all together, and your Lapras sings back. It swims out to the edge of the pod and stops there, between them and you, looking from one to the other. It has grown so much since the beach. It is still not sure where it belongs.',
    [
      ch('Go with your pod.', out('You tell it, and your voice does not work properly. It comes back to you first. It lays its head against your hand, the way it did on the beach, for a long time. Then it turns and swims out to them, and the pod closes round it, and they sing. You can hear the song long after you lose sight of them. It will not forget who carried whom.', farewell('Lapras goes home to its pod', ['lapras']), flag('aq11-lapras-home'), moment('You carried a baby Lapras across three islands to its pod, and let it go home.', 70))),
      ch('Stay with me.', out('It hears you. It looks at its pod one more time, a long look, and sings to them once: not goodbye, more like I know where you are now. Then it turns and comes back, and you climb on, and it carries you away from the island, steady and sure, the biggest it has ever been.', bondLine('lapras', 10), flag('aq11-lapras-stayed'), moment('You carried a baby Lapras to its pod, and it chose to stay with you.', 70))),
    ]),
  ev('aq11-lapras-surfaces', 'A Grey Back in the Water', AQ, { callback: true, requires: [flagIs('aq11-lapras-home'), age('aq11-lapras-home', 1)], types: SEA, pokemon: 'lapras', tint: '#1a2c3e', effect: 'float' },
    'A wide stretch of water, and no bridge, and no boat. You are standing at the edge working out how long the long way round will take when the water bulges, and a great grey back rises out of it, and a head you know turns toward you. It is bigger. It is very pleased with itself. It lowers its neck so you can climb on.',
    [
      ch('Climb on.', out('It carries you across, steady and sure, singing the whole way, and from somewhere far out its pod sings back. On the far side it waits until you are safe on the shore. Then it goes under, and you do not see it again this run. You do not need to. You know where it is.', ferry(), flag('aq11-carried'))),
    ]),

  // ---------------- AQ12. The Snorlax and the Melons ----------------
  ev('aq12-snorlax-and-the-melons', 'The Snorlax and the Melons', AQ, { rarity: 'common', minStage: stageOf('A2'), types: WOOD, cast: ['trainer.pr/rich_m', 'trainer.worker_m'], pokemon: 'snorlax', tint: '#2a3a1c', effect: 'none',
    remembers: [
      { id: 'old-friend', when: [flagIs('sleeping-snorlax-done')], notice: 'In its sleep, the Snorlax sniffs, and sniffs again, and rolls toward you. It knows your bag. You have been near a friend of its, the other great sleeper, and something of that one is still on you. It is following the smell before it is properly awake.',
        addChoices: [ch('Let it follow your bag.', out('You walk away from the field, slowly, and the Snorlax gets up and follows your bag, nose first, eyes still mostly shut. It follows it out of the fields, down the lane and into the cool shade by the river, where it lies down beside you and goes back to sleep with its head on your pack. When it wakes, it is yours. The mayor pays up, weeping with relief.', gain('snorlax', { bond: 15 }), flag('aq-snorlax-led'), $(400)))] },
    ] },
    'A little town with its bunting already up for a festival. The melon fields are empty: only stalks, rinds and a great deal of flattened earth. In the very last field a Snorlax is asleep on its back, with half a melon rind over its face like a hat. The mayor wrings his sash. "It ate the melons. Every melon. We had a festival planned!" A farmer beside him, quietly: "It ate the scarecrow." The mayor turns to you. "We\'ll pay anyone who moves it. Anyone!"',
    [
      ch('Catch it.', fight('It does not get up for you. It opens one eye, considers you, and closes it again. This is going to take a while.', beast({ species: ['snorlax'], win: [gain('snorlax'), flag('aq-snorlax-caught'), $(400)] }, { foeMoves: ['rest', 'sleep-talk'], lose: [room('aq12-still-there')] }))),
      ch('Feed it something it likes more.', out('The farmer fetches a basket from the orchard: three kinds of Berry, the last the town has. "The melons were sweet with a sharp edge to them," he says. "Like a Sitrus, nearly." In its sleep, the Snorlax\'s nose twitches toward the basket.', room('aq12-three-berries'))),
      ch('Wake it with music.', out('The mayor says the festival band would have done it, if there were a festival, or a band. Whatever wakes it will have to come from you.', room('aq12-music'))),
    ]),
  ev('aq12-still-there', 'Still There', AQ, { room: true, cast: ['trainer.pr/rich_m'], pokemon: 'snorlax', tint: '#2a3a1c', effect: 'none' },
    'Your Pokémon are worn out. The Snorlax is not. It has slept through most of the battle, waking only to eat a Berry nobody saw it pick, and now it rolls over and snores. The mayor sits down on a melon rind. "Anything else?" he asks. "Anything at all?"',
    [
      ch('Feed it something it likes more.', out('The farmer brings the last basket of the orchard. "Sweet with a sharp edge," he says. "Like a Sitrus, nearly." The Snorlax sniffs in its sleep.', room('aq12-three-berries'))),
      ch('Wake it with music.', out('If it will not be moved, perhaps it can be woken.', room('aq12-music'))),
      ch('Leave it sleeping.', leave('You leave the town with its bunting and its empty fields, and a Snorlax asleep in the last of them. Behind you, the mayor is still sitting on the melon rind.')),
    ]),
  ev('aq12-three-berries', 'Three Berries', AQ, { room: true, cast: ['trainer.worker_m'], pokemon: 'snorlax', tint: '#2a3a1c', effect: 'none' },
    'Three Berries in the basket: a blue Oran, a pink Pecha and a round yellow Sitrus. You hold each one under the Snorlax\'s nose in turn. Its nostrils flare. Somewhere deep inside it, a stomach rumbles like distant thunder.',
    [
      ch('The Oran Berry.', out('It eats the Oran in its sleep, stalk and all, and goes on sleeping. The great stomach rumbles again: not that one. One nostril turns, very slightly, toward the basket.', room('aq12-last-berry'))),
      ch('The Pecha Berry.', out('It eats the Pecha in its sleep, licks its lips, and goes on sleeping. Too sweet, perhaps. One nostril turns, very slightly, toward the basket.', room('aq12-last-berry'))),
      ch('The Sitrus Berry.', out('Its eyes open. It sits up, very slowly, the way a hill would sit up if it could. You walk backwards out of the field holding the Sitrus out in front of you, and it follows, down the lane, the whole town trailing behind at a safe distance. At the river it lies down in the cool mud, eats the Berry and falls asleep again, out of the fields at last. When it wakes, it wakes looking for you. The mayor pays you, and shakes your hand for a full minute.', gain('snorlax', { bond: 10 }), flag('aq-snorlax-led'), $(400))),
    ]),
  ev('aq12-last-berry', 'One More Berry', AQ, { room: true, cast: ['trainer.worker_m'], pokemon: 'snorlax', tint: '#2a3a1c', effect: 'none' },
    'The Snorlax is still asleep, still in the field, but it is not as asleep as it was. One huge nostril has turned toward the basket, toward the round yellow one, and it is quivering.',
    [
      ch('The Sitrus Berry.', out('Its eyes open. It sits up, very slowly, the way a hill would sit up if it could. You walk backwards out of the field holding the Sitrus out in front of you, and it follows, down the lane, the whole town trailing behind at a safe distance. At the river it lies down in the cool mud, eats the Berry and falls asleep again, out of the fields at last. When it wakes, it wakes looking for you. The mayor pays you, and shakes your hand for a full minute.', gain('snorlax', { bond: 10 }), flag('aq-snorlax-led'), $(400))),
      ch('Leave it sleeping.', leave('You put the basket down beside it and walk on. Behind you, a long, contented crunch.')),
    ]),
  ev('aq12-music', 'Music in the Melon Field', AQ, { room: true, cast: ['trainer.pr/rich_m'], pokemon: 'snorlax', tint: '#2a3a1c', effect: 'none' },
    'The mayor brings out the festival drum, then remembers there is nobody to play it. Whatever wakes it will have to come from you: a Poké Flute, if you carry one, or a Pokémon that can Sing. The Snorlax snores on, with the rind still over its face.',
    [
      ch('Play the Poké Flute.', out('The first notes go out over the empty field. The Snorlax opens its eyes. It sits up. It looks around at the flattened stalks, the rinds, the bunting nobody will need, and its great face falls. It is not sorry the way people are sorry. It is sad the way a child is sad when the party is over and nobody told them. It gets up and lumbers off toward the hills, slowly, without looking back. The mayor watches it go for a long time. "Well," he says. "Pays the same." He pays you. He does not look happy about any of it.', flag('aq-snorlax-woke'), $(400)), { requires: [has('poke-flute')] }),
      ch('Have it sung awake.', out('Your singer starts soft and gets louder. The Snorlax opens its eyes. It sits up. It looks around at the flattened stalks, the rinds, the bunting nobody will need, and its great face falls. It is not sorry the way people are sorry. It is sad the way a child is sad when the party is over and nobody told them. It gets up and lumbers off toward the hills, slowly, without looking back. The mayor watches it go for a long time. "Well," he says. "Pays the same." He pays you. He does not look happy about any of it.', flag('aq-snorlax-woke'), $(400)), { requires: [knows('sing')] }),
      ch('Leave it sleeping.', leave('You have nothing that would wake it. You leave it to its dreams, which are almost certainly about melons.')),
    ]),
  // "If aq.snorlax.woke": the town plants a field just for it, and holds the festival in its honour.
  ev('aq12-festival', 'The Festival of the Snorlax', AQ, { callback: true, requires: [flagIs('aq-snorlax-woke'), age('aq-snorlax-woke', 1)], cast: ['trainer.pr/rich_m'], pokemon: 'snorlax', tint: '#3a3a1c', effect: 'confetti' },
    'Word finds you on the road. The melon town has planted a new field up on the hill, fenced with nothing at all, and it is not for selling. It is for the Snorlax. They held the festival after all, in its honour. When you get there, the Snorlax is in the middle of everything, wearing a garland of melon flowers, eating the first melon of the new crop very, very slowly, so that it will last.',
    [
      ch('Join the festival.', out('You eat, and dance badly, and your Pokémon eat more than is polite. When it is all over the mayor finds you and gives you the festival prize: a Leftovers, wrapped in a melon leaf. "It was going to be a melon," he admits. "But it seemed wrong, somehow." On the hill, the Snorlax is asleep in its own field, smiling.', item('leftovers'), heal(0.5), fr(3))),
    ]),

  // ---------------- AQ13. The Ghost Who Made Her Laugh ----------------
  ev('aq13-ghost-who-made-her-laugh', 'The Ghost Who Made Her Laugh', AQ, { rarity: 'rare', minStage: stageOf('A4'), types: EERIE, requires: [notYet('aq13-gym-seen')], cast: ['boss.sabrina-lgpe'], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none' },
    'A Gym, off duty, and so quiet you can hear the lights hum. No cheering, no echo, no footsteps. The Leader sits alone on the arena steps, perfectly still, a bent spoon in her fingers. A Gym trainer whispers to you: "She hasn\'t smiled since she was a child. Not once." Then a cold breath on the back of your neck. A Haunter is floating behind you, grinning. Its words arrive as a feeling more than a sound: I\'ll make her laugh. Watch me. It makes faces at her for an hour: stretched ones, inside-out ones, faces no face should make. Nothing.',
    [AQ13_HELP, AQ13_JOKE, AQ13_WHY]),
  // In Kanto, Haunter's Prank is the meeting: its Haunter brings you to the silent Gym.
  ev('aq13-tower-haunter', 'The Haunter From the Tower', AQ, { callback: true, requires: [seen('cs-kanto-lavender-tower-prank'), notYet('aq13-gym-seen')], types: EERIE, cast: ['boss.sabrina-lgpe'], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none' },
    'The Haunter from the tower is back. It is wearing your hat, and it will not give it back, but it takes your sleeve and pulls. It pulls you all the way to a Gym, off duty, so quiet you can hear the lights hum. The Leader sits alone on the arena steps, perfectly still, a bent spoon in her fingers. A Gym trainer whispers: "She hasn\'t smiled since she was a child. Not once." The Haunter grins at you: I\'ll make her laugh. Watch me. It makes faces at her for an hour, stretched ones, inside-out ones. Nothing.',
    [AQ13_HELP, AQ13_JOKE, AQ13_WHY]),
  ev('aq13-nearly', 'Nearly', AQ, { room: true, cast: ['boss.sabrina-lgpe'], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none' },
    'The Haunter floats in front of you, upside down, staring at nothing. It is thinking. You can feel it thinking, like a draught under a door. She nearly laughed. At you. At it, laughing at you. Slowly, its grin comes back, wider than before.',
    [
      AQ13_HELP,
      AQ13_WHY,
      ch('Leave them to it.', leave('You leave the Haunter making faces in the silent Gym. As the door closes behind you, you think you hear, very faintly, someone breathe out through her nose.')),
    ]),
  ev('aq13-her-why', 'The Price', AQ, { room: true, cast: ['boss.sabrina-lgpe'], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none' },
    'The Leader goes back to her stillness. The Haunter drifts up beside her, closer than before, and for once it does not pull a face. It only looks at her, the way you look at a locked door you have decided to open.',
    [
      AQ13_HELP,
      ch('Leave them to it.', leave('You leave them there, the still woman and the ghost who will not stop looking at her. Some doors take a long time.')),
    ]),
  // Small scenes: one bit of the routine each time its Bond rises, while it is in the party.
  ev('aq13-pratfall', 'The Pratfall', AQ, { callback: true, requires: [flagIs('aq13-haunter-met'), line('gastly', 1), age('aq13-haunter-met', 1)], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none' },
    'Camp. The routine\'s first bit is a pratfall. The trouble is that the Haunter is a ghost. It hurls itself at the ground with total commitment and sinks gently through it, and rises back up looking betrayed. It tries again. It sinks again. Your Pokémon watch in a polite and terrible silence.',
    [
      ch('Show it how to fall.', out('You trip over your own bag, on purpose, arms everywhere, and land flat on your back. {lead} snorts. The Haunter studies you like a textbook. Its next fall is solid: it makes itself heavy, just for one second, and hits the dirt with a wonderful thump. It lies there, glowing with pride.', bondLine('gastly', 5), flag('aq13-scene-1'))),
      ch('Laugh anyway.', out('You laugh. Not because it is funny, but because it tried so hard. The Haunter knows the difference. It does it again, and again, sinking through the ground each time with a new face, until the laugh is a real one.', bondLine('gastly', 5), flag('aq13-scene-1'))),
    ]),
  ev('aq13-vanishing', 'The Disappearing Trick', AQ, { callback: true, requires: [seen('aq13-pratfall'), line('gastly', 2)], pokemon: 'haunter', tint: '#2a1a3a', effect: 'flicker' },
    'The second bit is a disappearing trick. The Haunter vanishes, beautifully, and reappears right behind {lead}, who screams and throws a bucket straight through it. That was not the plan. The plan was wonder. It sits on a rock afterwards, sulking, only half there.',
    [
      ch('Tell it the scream was the best part.', out('It thinks about that for a long time. Then it vanishes again and reappears behind you, and when you jump, it is so pleased it glows. Wonder, it decides, is overrated.', bondLine('gastly', 5), flag('aq13-scene-2'))),
      ch('Practise the timing with it.', out('You count it in, over and over, until the vanishing is a thing of beauty. Then you add one wobble at the end, a bow that goes wrong and turns into a tumble. {lead} laughs out loud. The Haunter freezes, then bows again, wobbling on purpose.', bondLine('gastly', 5), flag('aq13-scene-2'))),
    ]),
  ev('aq13-tickle', 'The Third Bit', AQ, { callback: true, requires: [seen('aq13-vanishing'), line('gastly', 3)], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none' },
    'The third bit came by accident. The Haunter was reaching for the last Berry and brushed {lead}\'s side, and {lead} folded up laughing, helpless, kicking at the grass. The Haunter stared at its own hand. Then it looked at you. It does not need to say it. That is the one. That is the third bit.',
    [
      ch('Let it practise on you.', out('It is merciless. You laugh until you cry, until you are lying in the grass begging, and it floats over you with the face of a scientist who has found the answer at last.', bondLine('gastly', 5), flag('aq13-scene-3'))),
      ch('Warn it to be gentle with her.', out('You tell it: she has not laughed in years. It might hurt, a little, the first time, like a stiff door. The Haunter goes quiet, and nods, and spends the evening practising the softest tickle in the world on a leaf.', bondLine('gastly', 5), flag('aq13-scene-3'), flag('aq13-gentle'))),
    ]),
  // The turning point: two stages after the meeting, back at the Gym, while the Haunter is in the party.
  ev('aq13-the-laugh', 'The Laugh', AQ, { callback: true, minStage: stageOf('A6'), requires: [flagIs('aq13-haunter-met'), age('aq13-haunter-met', 2), line('gastly')], types: EERIE, cast: ['boss.sabrina-lgpe'], pokemon: 'haunter', tint: '#2a1a3a', effect: 'none',
    remembers: [
      { id: 'why', when: [flagIs('aq-haunter-why')], notice: 'You know what she gave away to be what she is. So does the Haunter. It is not doing this for a laugh any more. It is doing it to give something back.', hide: [0],
        addChoices: [ch('Help it.', AQ13_STAY('You nod. It floats down beside her and reaches out with the softest touch in the world. She jerks. She makes a sound like a door that has not opened in years. Then she laughs, helpless and too loud, and then she is crying, both at once, and she does not hide either. When she can breathe she holds out her hand to the Haunter. "Stay," she says. "Please. It is so quiet here."'))] },
      { id: 'labyrinth', when: [flagIs('kanto-sabrina-labyrinth-done')], notice: 'She sees you, and something moves in her face. "You. You walked out of my labyrinth. Nobody walks out."', hide: [0],
        addChoices: [ch('Help it.', AQ13_STAY('You nod. The Haunter does not even need the second bit. The pratfall lands, a thump that shakes the lights, and on the very first try she laughs: short, startled, real, at the ghost and at you, the one who walked out of her illusion. Then she cannot stop. The Gym trainers come running to see. The Haunter is laughing too, and spinning, and glowing.'))] },
      { id: 'tower', when: [seen('cs-kanto-lavender-tower-prank')], notice: 'It is still wearing the hat it stole from you in the tower. It has decided the hat is lucky.' },
    ] },
    'The silent Gym again. The Leader is on her steps with her bent spoon. The Haunter floats out to the middle of the arena, alone, and bows. The first bit: the pratfall, a thump that shakes the lights. Nothing. The second bit: it vanishes, and it is behind her, and she does not even turn round. Nothing. It looks back at you across the empty arena. You can feel it asking.',
    [
      ch('Help it.', AQ13_STAY('You nod. It floats down beside her, slow, and reaches out with the softest touch in the world. She jerks. She makes a sound like a door that has not opened in years. And then she laughs: a real laugh, helpless, too loud, bouncing off every wall of that silent Gym. The Gym trainers come running. The Haunter is laughing too, and spinning, and glowing. When she can breathe, she looks at it, and her eyes are wet.')),
    ]),
  ev('aq13-stay', 'Loud', AQ, { room: true, cast: ['boss.sabrina-lgpe'], pokemon: 'haunter', tint: '#3a2a4a', effect: 'confetti' },
    'The Gym is loud now. The trainers are laughing because she is laughing, and nobody is quite sure what at. The Leader wipes her eyes and looks at the Haunter at your shoulder. The Haunter looks at her, and at you, and back again. It wants to stay. It is not sure it is allowed.',
    [
      ch('Let it stay with her.', out('It hugs you, cold as a cellar and very tight, and floats to her side. She gives you a Gastly from the Gym, a small giggling one that has been bored out of its mind for years, and then the spoon she has been holding all this time. "I bent it the day I stopped laughing," she says. "I don\'t need it now." Behind you, as you go, the Gym is the loudest place in town.', farewell('Haunter stays with the Leader', ['haunter', 'gengar']), gain('gastly', { bond: 10 }), item('twisted-spoon'), flag('aq13-haunter-stayed'), moment('A Haunter made a Gym Leader laugh for the first time since she was a child, and stayed to keep her laughing.', 70))),
      ch('Ask it to come with you.', out('It looks at her for a long time. Then it comes back to your shoulder. She understands. "Come back and make me laugh," she says, and she gives you the bent spoon anyway. "I don\'t need it now." The Gym stays loud behind you all the way down the street.', bondLine('gastly', 10), item('twisted-spoon'), flag('aq13-haunter-kept'), moment('A Haunter made a Gym Leader laugh for the first time since she was a child.', 70))),
    ]),

  // ---------------- AQ14. The Sap Thief ----------------
  ev('aq14-sap-thief', 'The Sap Thief', AQ, { rarity: 'common', minStage: stageOf('A2'), types: WOOD, cast: ['trainer.pr/school_kid_f'], pokemon: 'heracross', tint: '#1e2e16', effect: 'none' },
    'Morning, at the edge of a wood. A Bulbasaur is sitting very still with its eyes screwed shut, while a Heracross drinks from the bulb on its back with long, loud slurps. Its trainer, a girl with a scraped knee, stands by wringing her hands. "It does this every morning. My Bulbasaur won\'t fight it. It\'s too polite." The Heracross finishes, wipes its horn, bows deeply to the Bulbasaur and walks off into the trees. The Bulbasaur opens one eye. It looks exhausted.',
    [
      ch('Separate them.', fight('Next morning you are waiting by the Bulbasaur. The Heracross arrives, sees you in its way, and lowers its horn. It is strong, and it is not used to being told no.', monDuel('Heracross', 'heracross', 1, { win: [room('aq14-sulking')], lose: [room('aq14-sulking')] }))),
      ch('Find it a sap tree.', out('You set off into the wood with the Heracross trudging behind you and the girl calling directions from the path. It takes three nodes. The first tree is dry as paper. The second has been split by lightning. The third is old and thick and running with golden sap, and it is crawling with Bugs.', takeNode(3), flag('aq-heracross-tree'), room('aq14-colony-tree'))),
      ch('Let them sort it out.', out('You sit down on a log and wait. Next morning the Heracross comes for breakfast as usual. The Bulbasaur sits as usual. The Heracross leans in. And the Bulbasaur, very politely, says no: one Vine Whip, right across the horn. Everybody freezes. Then the Heracross sits down hard, rubbing its horn, and starts to laugh, a clicking beetle laugh. The Bulbasaur laughs too. By the afternoon they are sharing a puddle, and the girl is crying with relief.', flag('aq-heracross-friends'), fr(3))),
    ]),
  ev('aq14-sulking', 'Sulking', AQ, { room: true, cast: ['trainer.pr/school_kid_f'], pokemon: 'heracross', tint: '#1e2e16', effect: 'none' },
    'Win or lose, the battle is over, and the Heracross is sulking. It sits under a tree with its back to everybody, horn drooping, and makes a point of not looking at the Bulbasaur. It will drink somewhere else, it says, with every line of its body. The Bulbasaur looks almost sorry for it.',
    [
      ch('Leave it to sulk.', leave('You walk on. The Bulbasaur\'s bulb is safe. When you glance back, the Heracross is still under its tree, and the Bulbasaur has edged a little closer to it, just in case.')),
    ]),
  ev('aq14-colony-tree', 'The Colony\'s Tree', AQ, { room: true, pokemon: 'heracross', tint: '#2a2a10', effect: 'none',
    remembers: [
      { id: 'samurai', when: [seen('cs-kanto-pewter-forest-n6')], notice: 'A voice from the trees: "So that\'s where you got to!" It is the Samurai from Viridian Forest, helmet under his arm. He knows you; you fought him. "This tree is mine. My family\'s, since before the forest had a name. That Heracross used to drink here every morning, before it went wandering." He waves the Bugs back.',
        addChoices: [ch('Thank the Samurai.', AQ14_JOINS('"Drink, then, old friend," the Samurai says, and the Bugs part for it. The Heracross drinks until it is round. Then it comes and stands in front of you and bows, the same deep bow it gave the Bulbasaur every morning, and this time it does not walk off into the trees. "It has chosen," the Samurai says. "Look after it." Ever since that sap, leaves and vines have done it nothing but good.'))] },
    ] },
    'A Bug colony owns this tree. Beedrill hum on the high branches. A Pinsir sits at the roots like a gate. A Scyther paces in front of the trunk, blades out, on guard. They watch the Heracross. The Heracross watches the sap. Its stomach makes a long, sad sound.',
    [
      ch('Fight for a share.', fight('The Scyther steps forward. The Pinsir closes its horns. The colony will share with nobody who has not earned it.', beast({ species: ['pinsir', 'scyther', 'beedrill'], format: 'doubles', win: [room('aq14-the-sap')] }, { lose: [room('aq14-turned-away')] }))),
      ch('Offer the colony your Honey.', AQ14_JOINS('You set the Honey down at the roots. The Beedrill come down to it first, then the Pinsir, then even the Scyther, carefully. While they eat, the Heracross drinks until it is round. Then it comes and stands in front of you and bows, the same deep bow it gave the Bulbasaur every morning, and this time it does not walk off into the trees. Ever since that sap, leaves and vines have done it nothing but good.', lose('honey')), { requires: [has('honey')] }),
    ]),
  ev('aq14-the-sap', 'The Sap', AQ, { room: true, pokemon: 'heracross', tint: '#2a2a10', effect: 'sparkle' },
    'The colony draws back, buzzing, and makes room at the trunk. The Heracross does not wait to be asked twice. The sap runs gold in the evening light, and it drinks and drinks.',
    [
      ch('Let it drink its fill.', AQ14_JOINS('It drinks until it is round. Then it comes and stands in front of you and bows, the same deep bow it gave the Bulbasaur every morning, and this time it does not walk off into the trees. Ever since that sap, leaves and vines have done it nothing but good.')),
    ]),
  ev('aq14-turned-away', 'Turned Away', AQ, { room: true, pokemon: 'heracross', tint: '#2a2a10', effect: 'none' },
    'The colony has won. The Scyther stands in front of the trunk again, and nobody is getting past it today. The Heracross looks up at the gold running down the bark, once. Then it turns round and trudges back toward the edge of the wood, toward a Bulbasaur that is too polite to say no.',
    [
      ch('Walk it back.', leave('You walk it back together. The Bulbasaur sees it coming and shuts its eyes, very politely. Maybe some mornings are just like that.')),
    ]),

  // ---------------- AQ15. The Jealous One ----------------
  ev('aq15-jealous-one', 'The Jealous One', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: WOOD, cast: ['trainer.pr/camper_m'], pokemon: 'bayleef', tint: '#20321a', effect: 'none' },
    'A clearing, and a young trainer on a stump with his Pokémon around him. Or trying to be. Every time one of them comes near him, a Bayleef charges in and knocks it flying. "It used to be so sweet," he says, rubbing his eyes. "Then it evolved. Now it thinks it\'s too big to cuddle, and it\'s too jealous not to try." The Bayleef headbutts his Pikachu clean off his knee. Then it stands there, looking at what it did, and the leaf on its head droops. It looks so guilty it is hard to watch.',
    [
      ch('Spend time with just the Bayleef.', out('"Just it?" He looks at the others. "I can\'t. They need me too." He looks at the Bayleef, which is pretending not to listen. "But you could. It isn\'t jealous of you. Not yet." He hands you its Ball as if it were made of glass. "A stage, one on one. Then bring it to my ranch. It\'s on your road." The Bayleef watches him the whole way out of the clearing.', gain('bayleef', { bond: 5 }), flag('aq15-bayleef-met'), flag('aq-bayleef-time'))),
      ch('Make them share.', fight('"A battle," you tell him. "Your Bayleef and your Pikachu, side by side, against mine. They win together or not at all." He looks doubtful. The Bayleef looks furious. The Pikachu looks resigned.', duel('Camper Linden', { cls: 'camper', size: 2, format: 'doubles', team: ['bayleef', 'pikachu'], win: [flag('aq-bayleef-share'), room('aq15-tag-team')] }, { lose: [flag('aq-bayleef-share'), room('aq15-tag-team')] }))),
      ch('Let it go to a ranch.', out('He goes very quiet. Then he nods, because he has thought it himself, at night. At his family\'s ranch the Bayleef has a whole hill to itself and nobody to be jealous of, and it is happy, rolling in the clover, leaf up. He is not. He stands at the fence a long time with his Pikachu on his shoulder. Before you go, he gives you a Chikorita from the ranch\'s little ones. "Somebody should get cuddled," he says, and does not look at you.', gain('chikorita', { bond: 5 }), flag('aq15-ranch'))),
    ]),
  ev('aq15-tag-team', 'Tag Team', AQ, { room: true, cast: ['trainer.pr/camper_m'], pokemon: 'bayleef', tint: '#20321a', effect: 'none' },
    'It was a mess at first. The Bayleef shoved the Pikachu out of the way of an attack and took it full in the face; the Pikachu shocked the Bayleef by accident. Then, somewhere in the middle, the Bayleef lowered its head and let the Pikachu run up its neck and leap from it, and after that they were a team. Win or lose, the trainer comes off the field with the Pikachu on one shoulder and the Bayleef\'s head on the other, and he is laughing.',
    [
      ch('Take the Chikorita he offers.', out('"From my ranch," he says, pressing a Ball into your hands. "It\'s the littlest. It reminds me of somebody." The Bayleef watches the Chikorita go, and for once it does not mind at all.', gain('chikorita', { bond: 10 }), fr(2))),
    ]),
  // Small scenes: one each time its Bond rises, while the Bayleef is in your party.
  ev('aq15-too-close', 'Too Close', AQ, { callback: true, requires: [flagIs('aq15-bayleef-met'), line('chikorita', 1)], pokemon: 'bayleef', tint: '#20321a', effect: 'none' },
    'Camp. {lead} comes to sit beside you, the way it always does. The Bayleef is there first, with a shove that sends {lead} rolling into the ferns. Then it freezes, and looks at you, to see how angry you are going to be.',
    [
      ch('Make room for both.', out('You shuffle over and pat the ground on both sides. It takes a while. {lead} comes back warily. The Bayleef stiffens, and does not shove. By the time the fire is low, they are both leaning on you, one on each side, pretending not to notice each other.', bondLine('chikorita', 5), fr(2, 'lead'), flag('aq15-scene-1'))),
      ch('Sit apart with the Bayleef.', out('You take it a little way off, under a tree, just the two of you. It is so surprised that it forgets to be jealous. It puts its head in your lap, carefully, as if it might be told off for it, and sighs the whole of its breath out.', bondLine('chikorita', 5), flag('aq15-scene-1'))),
    ]),
  ev('aq15-waiting-its-turn', 'Waiting Its Turn', AQ, { callback: true, requires: [seen('aq15-too-close'), line('chikorita', 2)], pokemon: 'bayleef', tint: '#20321a', effect: 'none' },
    'Feeding time. You go down the line with the bowls. The Bayleef stands at the end of it, shaking with the effort of staying where it is. It does not charge. It does not shove. It waits, and its leaf is trembling.',
    [
      ch('Feed it first.', out('You stop, go straight to the end of the line, and put the first bowl down in front of it. It stares at the bowl, then at you. It does not eat straight away. It waits until everyone else has a bowl too.', bondLine('chikorita', 5), flag('aq15-scene-2'))),
      ch('Feed it last, and make a fuss of it.', out('It gets its bowl last, and with it every scratch behind the leaf you have, and a great deal of telling it how good it was. It eats with its eyes half shut, the happiest thing at camp.', bondLine('chikorita', 5), flag('aq15-scene-2'))),
    ]),
  ev('aq15-too-big', 'Too Big to Cuddle', AQ, { callback: true, requires: [seen('aq15-waiting-its-turn'), line('chikorita', 3)], pokemon: 'bayleef', tint: '#1a2a16', effect: 'none' },
    'Late at night it comes to where you are lying and tries to curl up in your lap, the way it must have done when it was a Chikorita. It does not fit. Not even nearly. It tries anyway, folding its long neck this way and that, and then it stops, and stands there, ashamed of being so big.',
    [
      ch('Let it try.', out('You sit up and open your arms, and it climbs in, all of it, too heavy, legs everywhere, and you both fall over. It does not get up. It lies on top of you with its leaf in your face, purring like something much smaller.', bondLine('chikorita', 5), flag('aq15-scene-3'))),
      ch('Lie down beside it.', out('You lie down next to it instead, in the grass, close. It is the right size for that. It puts its head on your chest and keeps it there until morning.', bondLine('chikorita', 5), flag('aq15-scene-3'))),
    ]),
  // The turning point: its trainer's ranch, two stages after the meeting (one, if your starter is with you).
  ev('aq15-the-ranch', 'Home to the Ranch', AQ, { callback: true, requires: [flagIs('aq15-bayleef-met'), age('aq15-bayleef-met', 2), line('chikorita'), notYet('aq15-home')], types: WOOD, cast: ['trainer.pr/camper_m'], pokemon: 'bayleef', tint: '#20321a', effect: 'hearts' },
    'The ranch, on your road, as he promised. The trainer is waiting at the gate with his Pikachu on his shoulder. The Bayleef stops. You wait for the charge. It does not come. It walks up to him, slowly, and lowers its head, and lets the Pikachu climb down onto it and sit between its leaves. The trainer makes the sound people make at weddings. "What did you do?" Nothing, really. You gave it time, and it watched how your team was treated.',
    AQ15_RANCH()),
  ev('aq15-the-ranch-early', 'Home to the Ranch', AQ, { callback: true, requires: [flagIs('aq15-bayleef-met'), age('aq15-bayleef-met', 1), line('chikorita'), bondIs(1, 'starter'), notYet('aq15-home')], types: WOOD, cast: ['trainer.pr/camper_m'], pokemon: 'bayleef', tint: '#20321a', effect: 'hearts' },
    'It has been watching {starter} all this while: how you talk to it, how it has never once been left behind. It learned faster than anybody thought it could. The ranch is on your road, and the trainer is at the gate with his Pikachu. The Bayleef walks up to him, slowly, lowers its head, and lets the Pikachu climb down and sit between its leaves. "What did you do?" he whispers. Nothing, really. You let it see.',
    AQ15_RANCH()),

  // ---------------- AQ17. The Herd's Little One ----------------
  ev('aq17-herds-little-one', 'The Herd\'s Little One', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: SEA, cast: ['trainer.pr/breeder_f'], pokemon: 'phanpy', tint: '#2a2a1a', effect: 'none' },
    'A breeder\'s camp on a riverbank. A Phanpy sits in the shallows, filling its trunk and letting go, delighted every single time. Half an eggshell is still on the bank. The breeder, Mrs. Petronella Oduya, sits on a crate with her sleeves rolled up. "It hatched here this morning. The egg came down the river on a raft of reeds; I fished it out. It\'s never met another Phanpy. It thinks it\'s whatever I am." It sprays her. She lets it. Downriver the ground starts to tremble: a Donphan herd, forty strong, migrating, rolling through the far ford without a glance. The Phanpy has stopped playing. Its ears are right out.',
    [
      ch('Let it meet them.', out('It runs at them as fast as its legs go. It is knocked flat by the very first one, by accident. A cow Donphan stops, turns it right way up with her trunk and looks it over, nose to tail, as if checking it for damage. It walks with them as far as the bend. Then it comes back, at a run, covered in dust and enormously pleased with itself, and climbs into your bag. Mrs. Oduya laughs till she has to hold the crate. "It\'s met its family. And then it picked you."', gain('phanpy', { bond: 10 }), flag('aq17-phanpy-met'), flag('aq17-met-herd'))),
      ch('Keep it.', out('You crouch at the water\'s edge. It sprays you. You let it. Mrs. Oduya nods, as if you have passed something. "Yours, then." It is happy, so happy, all the way up the bank. Only, when the last of the herd goes round the bend, it stops, and watches the empty ford until the dust has settled.', gain('phanpy', { bond: 10 }), flag('aq17-phanpy-met'), flag('aq17-kept'))),
      ch('Raise it to lead them.', out('"Lead them?" Mrs. Oduya looks at the herd, then at the little thing in the river with its ears out. "That herd\'s been going the same wrong way for years. Maybe it needs somebody who doesn\'t know the way." She lifts it out of the water with both hands and gives it to you. "They come back through a region from now, on their way home. Have it ready."', gain('phanpy', { bond: 10 }), flag('aq17-phanpy-met'), flagAt('aq17-raised'))),
    ]),
  // "Keep it": a herd passes.
  ev('aq17-herd-passes', 'A Herd Passes', AQ, { callback: true, requires: [flagIs('aq17-kept'), age('aq17-kept', 1), line('phanpy')], pokemon: 'phanpy', tint: '#2a2a1a', effect: 'shake' },
    'The ground trembles under the road. A herd is passing somewhere beyond the trees: Donphan, by the sound of it. Your Phanpy stops dead in the middle of the path. Its ears go right out. It watches the place where the sound is until long after the sound has gone.',
    [
      ch('Wait with it.', out('You sit down in the road beside it. It does not look at you. But when the dust has settled it leans on your leg for a moment, heavy and warm, and then it is ready to go on.', bondLine('phanpy', 5), flag('aq17-watched'))),
    ]),
  // Small scenes: one each time its Bond rises, while it is in the party.
  ev('aq17-sideways', 'Sideways', AQ, { callback: true, requires: [flagIs('aq17-phanpy-met'), line('phanpy', 1), age('aq17-phanpy-met', 1)], pokemon: 'phanpy', tint: '#2a2a1a', effect: 'none' },
    'Camp. The Phanpy has seen a Donphan roll, once, and it has decided. It tucks its head, it gathers itself, it launches, and it goes sideways, straight into the tent. The tent comes down. From somewhere inside comes a small, muffled, triumphant toot.',
    [
      ch('Dig it out.', out('You find it under the groundsheet, upside down and beaming. It wants to go again. It goes again. The tent comes down again. You put it up four times that night and do not mind once.', bondLine('phanpy', 5), flag('aq17-scene-1'))),
      ch('Move the tent somewhere else.', out('You pitch the tent behind a big rock. It rolls into the rock instead, sits there seeing stars, and then tries again, aiming very carefully at the rock.', bondLine('phanpy', 5), flag('aq17-scene-1'))),
    ]),
  ev('aq17-cant-stop', 'It Can\'t Stop', AQ, { callback: true, requires: [seen('aq17-sideways'), line('phanpy', 2)], pokemon: 'phanpy', tint: '#2a2a1a', effect: 'shake' },
    'It can roll now. It cannot stop. It comes down the slope toward camp like a grey boulder with ears, faster and faster, and {lead} sees it coming and plants its feet and stands right in the way. It is bowled clean over. The two of them end up in a heap at the bottom, and the Phanpy looks very worried indeed.',
    [
      ch('Help them both up.', out('{lead} gets up, shakes itself off, and nudges the Phanpy as if to say: again. The worry on the little face turns to pure adoration. They roll together until dark.', bondLine('phanpy', 5), fr(3, 'lead'), flag('aq17-scene-2'))),
      ch('Teach it to stop.', out('You show it: ears out, legs out, dig the trunk in. It ploughs a long furrow through the camp and stops one inch from the fire, and looks up at you, very proud, with its trunk full of dirt.', bondLine('phanpy', 5), flag('aq17-scene-2'))),
    ]),
  ev('aq17-spring', 'A Pool at Every Camp', AQ, { callback: true, requires: [seen('aq17-cant-stop'), line('phanpy', 3)], pokemon: 'phanpy', tint: '#1e2e2a', effect: 'sparkle' },
    'It has found something out. It puts its trunk to the dry ground at camp, and snuffles, and digs, and water comes up: a little spring, cold and clear. It makes a pool. It sits in it. It does the same at the next camp, and the one after. It has never once asked if anybody else would like a bath.',
    [
      ch('Get in too.', out('You put your feet in, and then your whole team piles in around you, and the Phanpy sits in the middle of everyone, spraying them all in turn, the happiest it has ever been.', bondLine('phanpy', 5), heal(0.25), flag('aq17-scene-3'))),
      ch('Let it have its pool.', out('You leave it the pool and sit on the bank. It looks up at you now and then, to check you are watching. You are. That is all it wanted.', bondLine('phanpy', 5), flag('aq17-scene-3'))),
    ]),
  // The turning point ("Raise it to lead them"): a region later, the same herd on its way back.
  ev('aq17-lead-them', 'Raise It to Lead Them', AQ, { callback: true, requires: [flagIs('aq17-raised'), flagAgo('aq17-raised', 1), line('phanpy')], types: SEA, pokemon: 'donphan', tint: '#3a3020', effect: 'shake' },
    'A region later, and the same herd, on its way back. Your Phanpy is a Donphan now, or very nearly. The herd\'s leader is old and scarred, and for three seasons it has led them the wrong way round a dry riverbed, because that is the way it knows. The herd is thin. Your Donphan walks out in front of it, puts its trunk to the dry bed and digs. Water comes up. The old one looks at the water. It looks at the upstart. Slowly, it lowers its tusks.',
    [
      ch('Let it answer.', fight('It isn\'t cruel. It\'s a question, asked properly, one on one. The herd makes a ring.', monDuel('The Herd\'s Leader', 'donphan', 2, { rule: { leadType: 'ground', noSwitch: true }, win: [flag('aq17-leader-beaten'), room('aq17-the-water-way')], lose: [flag('aq17-leader-lost'), room('aq17-the-old-ones-trunk')] }), evolve('phanpy', 'donphan'))),
    ]),
  ev('aq17-the-water-way', 'The Water Way', AQ, { room: true, pokemon: 'donphan', tint: '#3a3020', effect: 'sparkle' },
    'The old one bows. It steps to the side, and when the herd moves off it walks at your Donphan\'s shoulder, not in front. Forty heads turn to your Donphan, waiting. Your Donphan turns, and looks at you.',
    [
      ch('Let it lead them.', out('You put your hand on its trunk, the way Mrs. Oduya did on the riverbank. It leans into it for a long moment. Then it walks to the front of the herd, and the old one falls in at its shoulder, and forty Donphan follow the water away down the valley. It looks back only once. It does not need to look back more.', farewell('Donphan leads the herd', ['phanpy', 'donphan']), flag('aq17-leads'), flag('reunion-guest-donphan-herd'), moment('The Phanpy who hatched on a raft of reeds found water in a dry riverbed, and led its herd home.', 75))),
      ch('Come with me. They\'ll follow the water now.', out('It looks at the herd, at the old one, at the water running bright in the riverbed. They will follow it now; they know the way. It turns and comes back to you, and the old leader trumpets once, and the whole herd answers. You walk on with the ground still shaking under your feet.', bondLine('phanpy', 10), flag('aq17-stays'), flag('reunion-guest-donphan-herd'), moment('Your Donphan found water for its herd, showed them the way, and came back to you.', 75))),
    ]),
  ev('aq17-the-old-ones-trunk', 'The Old One\'s Trunk', AQ, { room: true, pokemon: 'donphan', tint: '#3a3020', effect: 'none' },
    'Your Donphan goes down. When it gets up, the old leader is standing over it. It puts its trunk on the youngster\'s head, gently, the way the cow put the little one right way up at the ford, long ago. Then it turns the herd, all forty of them, toward the water your Donphan found. It follows the water anyway. The herd drinks.',
    [
      ch('Go to your Donphan.', out('It is sitting in the new water, sore and very wet, watching the herd drink. When you sit down beside it, it sprays you, the way it sprayed Mrs. Oduya on the first morning. You let it.', bondLine('phanpy', 10), flag('reunion-guest-donphan-herd'), moment('Your Donphan lost to the old leader, but the herd follows the water it found.', 70))),
    ]),
  ev('aq17-at-the-ford', 'At the Ford', AQ, { callback: true, requires: [flagIs('aq17-leads'), age('aq17-leads', 1)], types: SEA, pokemon: 'donphan', tint: '#2a2a1a', effect: 'none' },
    'A ford, and on the far bank a Donphan herd, drinking. At the front of it stands one you know. It sees you. It lifts its trunk and trumpets, and the whole herd trumpets with it, so loud the water shivers. When they have gone, something is left on the near bank, where you are sure to find it: the tip of a tusk, worn smooth, set on a flat stone.',
    [
      ch('Take the tusk.', out('It is warm from the sun. It is heavy. You hold it and look at the far bank for a long time. Then you put it in your bag, carefully, the way it once climbed into your bag, covered in dust.', item('donphan-leaders-tusk'), fr(3))),
    ]),
];

export const REMOVE: string[] = [];
