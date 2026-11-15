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
import { $, anyType, bondIs, ch, ev, ferry, fight, flag, flagIs, fr, has, heal, item, leave, lv, out, room, statusLead, takeNode, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, farewell, gain, hasMon, knows, line, moment, seen, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ9: 'aq09-muk-that-hugs',
  AQ10: 'aq10-thirty-tauros',
  AQ11: 'aq11-baby-lapras',
  AQ12: 'aq12-snorlax-and-the-melons',
};

export const PLACEMENT: Record<string, Place> = {
  'aq09-muk-that-hugs': { shape: 'Single', earliest: 'A3', home: 'a + node', sits: 'optional', attaches: 'rest', note: 'Single: two nodes. It is outside the Pokémon Center; "Find it someone." takes the next two nodes.' },
  'aq10-thirty-tauros': { shape: 'Single', earliest: 'A4', home: 11, window: [8, 14], sits: 'optional', tags: ['normal'], note: 'Normal-type stages. A ranch.' },
  'aq11-baby-lapras': { shape: 'Companion', earliest: 'A4', home: 10, window: [7, 13], sits: 'optional', tags: ['water', 'snow'], beats: ['aq11-first-island', 'aq11-second-island', 'aq11-third-night', 'aq11-the-pod', 'aq11-lapras-surfaces'], note: 'A beach. The three islands are the small scenes; the third island (its pod, and poachers) is the turning point two stages on, on a water stage.' },
  'aq12-snorlax-and-the-melons': { shape: 'Single', earliest: 'A2', home: 8, window: [5, 11], sits: 'optional', tags: ['forest'], beats: ['aq12-festival'], note: 'A melon town. The festival in its honour is a follow-up one stage after "Wake it with music."' },
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
};

/** Set after the questline was re-read line by line against its doc. */
export const CHECKED: Record<string, string> = { AQ9: '2026-11-15', AQ10: '2026-11-15', AQ11: '2026-11-15' };

const ANY: string[] = [];
const NORMAL = tagTypes('normal');
const SEA_SNOW = tagTypes('water', 'snow');
const SEA = tagTypes('water');
const WOOD = tagTypes('forest');

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
];

export const REMOVE: string[] = [];
