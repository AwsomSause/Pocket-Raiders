// Anime questlines, module 11: AQ46-AQ53. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ46 The Hungry Baby                (Single;     script: QUESTLINES_ASH.md "AQ46")
// Build: npm run co:build -- anime-11
import { anyType, ch, egg, ev, fight, flag, flagIs, fr, item, leave, lose, out, room, takeNode, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, evolve, gain, line, monDuel, moment, seen, stageOf, tagTypes, teach, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ46: 'aq46-the-hungry-baby',
  AQ47: 'aq47-the-proud-penguin',
  AQ48: 'aq48-the-axew-and-the-excadrill',
};

export const PLACEMENT: Record<string, Place> = {
  'aq46-the-hungry-baby': { shape: 'Single', earliest: 'A2', home: 'the town: a Contest Hall; else a + node', sits: 'optional', attaches: 'town', tags: [], note: 'Tags: any.' },
  'aq47-the-proud-penguin': { shape: 'Companion', earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', tags: ['water', 'snow'], beats: ['aq47-wont-go-in', 'aq47-not-a-toy', 'aq47-the-stone', 'aq47-standing-tall'], note: 'The doc gives only the meeting; the small scenes and the turning point follow the Companion rule. The turning point is two stages after the gift Piplup joins.' },
  'aq48-the-axew-and-the-excadrill': { shape: 'Companion', earliest: 'A5', home: 9, window: [6, 12], sits: 'optional', tags: ['cave'], level: 'A+1', beats: ['aq48-first-tusks', 'aq48-knocked-over', 'aq48-on-guard', 'aq48-the-dragonite'], note: 'The doc gives only the meeting; the small scenes (once the Egg hatches) and the turning point follow the Companion rule. The turning point Dragonite is A+1, two stages after the Egg.' },
};

export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ46: [
    'The ribbon the Munchlax wins is a Chronicle line: the game has no Contest ribbons.',
    'Remembers "AQ12 (The Snorlax and the Melons) was done" reads the pack flags aq-snorlax-caught, aq-snorlax-led and aq-snorlax-woke, one variant each; the batch that builds AQ12 must set them.',
  ],
  AQ47: [
    'Unwavering is not an ability in the game: the Piplup comes with an Everstone instead (it cannot evolve while holding it, and its stats rise 10%).',
    'The Empoleon fight is a double battle with a Pelipper beside the Empoleon, because a fight with an ally Pokémon needs two foes; Dawn\'s Piplup fights beside you as that ally.',
  ],
  AQ48: [
    'Remembers "the player\'s lead is a Dragon-type" reads a Dragon-type anywhere in the party: the game has no lead-type condition yet.',
    'The Dragonite fight is a double battle with a Dragonair beside the Dragonite, because a fight with an ally Pokémon needs two foes; Iris\'s Excadrill fights beside you as that ally.',
  ],
};

export const CHECKED: Record<string, string> = { AQ46: '2026-11-15', AQ47: '2026-11-15' };

const COLD_SEA = tagTypes('water', 'snow');
const CAVE = tagTypes('cave');
const SHOWCASE = tagTypes('city', 'fairy');

export const EVENTS: Json[] = [
  // ---------------- AQ46. The Hungry Baby ----------------
  ev('aq46-the-hungry-baby', 'The Hungry Baby', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: [], cast: ['boss.may-rs'], pokemon: 'munchlax', tint: '#3a2430', effect: 'confetti',
    remembers: [
      { id: 'snorlax-caught', when: [flagIs('aq-snorlax-caught')], notice: 'The little one in the basket goes very still and sniffs at your belt. It met your Snorlax once, asleep in the melon fields, and climbed all the way up it. It sits up as tall as a Munchlax can. It has decided what it wants to be.' },
      { id: 'snorlax-led', when: [flagIs('aq-snorlax-led')], notice: '"Wait," May says. "The Snorlax by the river. That was you?" The little one was there. It slept against that great warm side all afternoon. It has wanted to be that big ever since.' },
      { id: 'snorlax-woke', when: [flagIs('aq-snorlax-woke')], notice: 'At the melon festival they threw for that Snorlax, the little one rode on its stomach for the whole parade. May says it has been trying to be that round ever since, and it is getting there.' },
    ] },
    'A Contest Hall, between rounds. Coloured lights, a hum of nerves, and a long snack table with nothing on it but crumbs and one licked plate. Under the tablecloth, something round is breathing slowly. A girl in a red bandana lifts the cloth and sighs from the bottom of her heart. "It was meant to be in the next round. It ate the judges\' lunch." The Munchlax looks up at her, perfectly happy. It burps. A whole Berry rolls out across the floor. Its nose has already found your bag. At May\'s feet sits a basket with a smaller Munchlax in it, watching the big one the way a little brother watches a hero. "That one\'s from home," May says. "Mum asked me to find it a trainer. One with a big bag."',
    [
      ch('Enter it anyway.', out('May looks at you, at the Munchlax, at the clock. "Why not. It can\'t get worse." On stage it waddles to the centre, sits down, and wags one finger to and fro. Metronome. The hall holds its breath. Out of nowhere comes a perfect move: a shower of gold sparks that spell nothing and mean everything. The judges, still hungry, give it full marks. May takes the ribbon in both hands, laughing so hard she cannot bow. "By accident! It won by ACCIDENT!" Afterwards she pushes the basket into your arms. "You brought us luck. Take the little one. It already wags its finger at dinner."',
        flag('aq46-ribbon-won'), moment('May\'s Munchlax won a Contest ribbon by accident, with one wag of a finger.', 50), gain('munchlax', { moves: ['metronome'], bond: 10 }), flag('aq46-munchlax-given'))),
      ch('Hide the snacks.', out('The judges need a new lunch, so you and May hide the trays: behind a curtain, under a hat, inside a tuba. The Munchlax finds the curtain first. Then the hat. Then the tuba, which makes a noise nobody in the hall will forget. It finds the Oran Berry in your bag too, straight through the zip, and eats it with great politeness. May gives up and sits on the floor. "It always finds them. It always will." The little one in the basket has watched every step. May lifts it out and gives it to you. "Guard your bag. It\'s learning."',
        lose('oran-berry'), flag('aq46-snacks-found'), gain('munchlax', { ability: 'pickup' }), flag('aq46-munchlax-given'))),
      ch('Feed it till it sleeps.', out('You pool every snack you have and May raids the hall kitchen. The Munchlax eats all of it, slowly, with deep contentment, and falls asleep on the stage steps with a Berry still in its paw. It snores through the whole round. May\'s name is called. May does not go. When the results go up without her she laughs until she cries, sitting beside it with one hand on its round, rising stomach. "Worth it. Look at that face." Then she lifts the basket into your arms. "This one hasn\'t eaten in an hour. Brace yourself."',
        flag('aq46-fed-to-sleep'), gain('munchlax', { bond: 20 }), flag('aq46-munchlax-given'))),
    ]),

  // ---------------- AQ47. The Proud Penguin ----------------
  ev('aq47-the-proud-penguin', 'The Proud Penguin', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: COLD_SEA, cast: ['boss.dawn'], pokemon: 'piplup', tint: '#1c2e44', effect: 'snow',
    remembers: [
      { id: 'met-the-trainer', when: [seen('evo-pokemon-that-wouldnt-evolve')], notice: 'Dawn looks at you again. "Wait. You met the trainer whose Pokémon wouldn\'t evolve, didn\'t you? They came through here. They said you stood up for them." She lets out a long breath. "So you\'re on our side too. Good. Then I\'ll say it: I agree with you."' },
    ] },
    'A harbour on a cold morning, ice in the ropes and gulls complaining. A girl in a white beanie is losing an argument with a Piplup. It will not be picked up. It will not go in its Ball: when she holds it out, it turns its back on it. A trainer walking past says, "Still a Piplup? Mine evolved weeks ago," and the Piplup puffs up to twice its size. The girl sighs. "It doesn\'t want to change. I don\'t want it to either. Everyone says we\'re wrong." The Piplup climbs her coat, stands on her head, and folds its flippers, chest out, like the figurehead of a very small ship.',
    [
      ch('You\'re not wrong.', out('Dawn\'s shoulders come down from round her ears. "Really?" "Really." She laughs, the shaky kind that has been waiting a long time. On her head the Piplup unfolds its flippers, looks down at you from its great height, and bows: a deep, formal bow that nearly tips it off. Dawn catches it without looking. They have done this before.',
        flag('aq47-not-wrong'), room('aq47-one-more-piplup'))),
      ch('Battle with it.', fight('An old sailor on the jetty has been listening. "A Piplup with that much chest? Let\'s see it." His Empoleon rises out of the water like a cathedral. Dawn\'s Piplup slides off her head and marches to your side without being asked.',
        duel('Old Salt Halloran', { cls: 'fisherman', size: 2, format: 'doubles', types: ['water'], ally: 'piplup', win: [flag('aq47-battled'), flag('aq47-battle-won'), room('aq47-one-more-piplup')] }, { lineup: ['empoleon', 'pelipper'], lose: [flag('aq47-battled'), room('aq47-one-more-piplup')] }))),
      ch('Let it decide.', out('You stand on tiptoe so you are level with the Piplup on Dawn\'s head, and you ask it: change, or stay? It thinks about it properly, eyes shut, beak up. Then it taps its own chest twice with one flipper. Stay. This is me. Dawn reaches up and, for the first time all morning, it lets her lift it down into her arms. "Then that\'s settled," she says, to the whole harbour.',
        flag('aq47-it-decided'), room('aq47-one-more-piplup'))),
    ]),
  ev('aq47-one-more-piplup', 'One More Who Won\'t', AQ, { room: true, cast: ['boss.dawn'], pokemon: 'piplup', tint: '#1c2e44', effect: 'snow',
    remembers: [
      { id: 'won', when: [flagIs('aq47-battle-won')], notice: 'The Empoleon went down, but the last hit was yours, not the Piplup\'s. It nearly had it alone. It is still glaring at the water where the Empoleon sank, and the old sailor is laughing and saluting it.' },
      { id: 'lost', when: [flagIs('aq47-battled')], notice: 'The Empoleon won, in the end. But the Piplup got up after every hit, and the last time it got up the Empoleon took a step back. "Nearly," the old sailor says, and salutes it. "Very nearly."' },
    ] },
    'Dawn opens her bag. Inside, wrapped in a scarf, is a second Piplup: smaller, crosser, with one feather that will not lie flat. "The professor\'s lab had one more. It turned down three trainers. It won\'t go in a Ball either." She holds it out with both hands. "It\'s been watching you. It doesn\'t watch people." The small Piplup looks at you. It does not bow. It waits to see if you will.',
    [
      ch('Take it, as it is.', out('You bow first. It considers this for a long second, then bows back, exactly as deep and not a feather deeper. Dawn ties a smooth grey stone to the scarf round its neck. "An Everstone. Not to stop it. So it knows nobody\'s waiting for it to be something else." The Piplup walks to your side on its own two feet and stands there, chest out.',
        gain('piplup', { bond: 10 }), item('everstone'), flag('aq47-piplup-met'))),
      ch('It should stay with Dawn.', leave('Dawn nods, not unhappy. "Then it has two of us who won\'t make it change." Both Piplup watch you go, from the top of her head, side by side, like two small ships in harbour.')),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq47-wont-go-in', 'It Won\'t Go In', AQ, { callback: true, requires: [flagIs('aq47-piplup-met'), line('piplup', 1), age('aq47-piplup-met', 1)], pokemon: 'piplup', tint: '#1c2e44', effect: 'none' },
    'Camp, and it is cold. Everyone else has gone back in their Balls for the night. The Piplup stands beside its Ball and looks at it the way you look at a door you have already said no to. It is shivering. It will not say so.',
    [
      ch('Let it sleep outside.', out('You build the fire up and leave it be. Near midnight you wake: it has come in close, not touching you, a flipper\'s width away, near enough to share the warm. It is asleep standing up. It looks very pleased with itself.', bondLine('piplup', 5), flag('aq47-scene-1'))),
      ch('Put your scarf over it.', out('You drape your scarf over it without a word. It pecks the scarf once, to make clear this is its own decision, and then sinks into it until only the beak shows. In the morning it carries the scarf all day and will not give it back.', bondLine('piplup', 5), flag('aq47-scene-1'))),
    ]),
  ev('aq47-not-a-toy', 'Not a Toy', AQ, { callback: true, requires: [seen('aq47-wont-go-in'), line('piplup', 2)], pokemon: 'piplup', tint: '#24304a', effect: 'none' },
    'In a town square a small boy spots the Piplup and runs at it with both arms out. "Penguin! Can I carry it?" The Piplup swells up, flippers wide, every feather on end. It is about to peck a child, and it knows it, and it is going to anyway.',
    [
      ch('Let it walk on its own.', out('"It likes to walk," you tell the boy. "Walk with it." He does, very seriously, matching its steps across the square. The Piplup deflates, one feather at a time. At the far side it lets him pat its head, once, quickly, like a toll.', bondLine('piplup', 5), flag('aq47-scene-2'))),
      ch('Ask it first.', out('You kneel. "He wants to carry you. Up to you." The Piplup stares at you as if nobody has ever asked it anything. Then it looks at the boy, and holds up one flipper: no. But it lets him hold the flipper. They stand there, holding flippers, both very proud.', bondLine('piplup', 5), flag('aq47-scene-2'))),
    ]),
  ev('aq47-the-stone', 'The Stone Round Its Neck', AQ, { callback: true, requires: [seen('aq47-not-a-toy'), line('piplup', 3)], pokemon: 'piplup', tint: '#2a3448', effect: 'glint' },
    'A trainer at a Pokémon Center looks at the grey stone on the Piplup\'s scarf and snorts. "Take that rock off it and it\'ll be an Empoleon by Friday. Then it\'ll be strong." The Piplup goes quiet. Later you find it polishing the Everstone with its flipper, slowly, round and round, not looking at you.',
    [
      ch('"You\'re strong now."', out('It stops polishing. It looks at you for a long time, the way it looked at Dawn\'s Ball on the harbour: deciding. Then it ties the scarf tighter, all by itself, and goes to sleep with the stone held against its chest.', bondLine('piplup', 5), flag('aq47-scene-3'))),
      ch('"It\'s your stone. You choose."', out('You leave it there with the stone. In the morning the scarf is knotted on, twice, in the clumsiest knot you have ever seen. It has decided. It will keep deciding, every morning, and every morning it will be the same answer.', bondLine('piplup', 5), flag('aq47-scene-3'))),
    ]),
  // The turning point: two stages after it joined, while it is still in the party.
  ev('aq47-standing-tall', 'Standing Tall', AQ, { callback: true, minStage: stageOf('A4'), requires: [flagIs('aq47-piplup-met'), age('aq47-piplup-met', 2), line('piplup')], types: COLD_SEA, cast: ['boss.dawn'], pokemon: 'empoleon', tint: '#16263c', effect: 'snow',
    remembers: [
      { id: 'decided', when: [flagIs('aq47-it-decided')], notice: 'Dawn\'s Piplup decided to stay itself, that morning on the harbour. Yours was watching from her bag. It has the same look now: eyes shut, beak up, choosing.' },
      { id: 'nearly', when: [flagIs('aq47-battled')], notice: 'It is the same Empoleon from the harbour, with the same old sailor. He remembers you. "Nearly, last time," he says. "Let\'s see about nearly."' },
    ] },
    'An ice floe at the harbour mouth, and a crowd. An Empoleon stands on it, huge and gleaming, while trainers queue to be beaten. Dawn is at the front with her Piplup on her head. "Everyone keeps telling me what it\'ll be one day." Your Piplup walks past her, past the queue, out onto the ice, and stops in front of the Empoleon. It does not puff up. It does not need to. The crowd starts laughing, and then, one by one, stops.',
    [
      ch('Fight beside it.', fight('You step out onto the ice. The Piplup does not look round. It knows you are there.',
        monDuel('The Harbour Empoleon', 'empoleon', 1, { win: [bondLine('piplup', 10), flag('aq47-stood-tall'), room('aq47-unwavering')], lose: [bondLine('piplup', 5), flag('aq47-stood-tall'), flag('aq47-ice-lost'), room('aq47-unwavering')] }))),
      ch('Let it stand alone.', out('You stay at the edge. The Empoleon looks down at the Piplup. The Piplup looks up and does not move one feather. A long minute. Then the Empoleon, slowly, lowers its great head until their beaks are level, and bows. The crowd goes silent. Dawn is crying and pretending she is not.',
        bondLine('piplup', 10), flag('aq47-stood-tall'), flag('aq47-stood-alone'), room('aq47-unwavering'))),
    ]),
  ev('aq47-unwavering', 'Unwavering', AQ, { room: true, cast: ['boss.dawn'], pokemon: 'piplup', tint: '#24304a', effect: 'sparkle' },
    'Back on the jetty, Dawn sets her Piplup down beside yours. They are exactly the same height. They have no intention of being anything else. "Nobody says we\'re wrong any more," Dawn says. "Or they do, and we don\'t hear it." Both Piplup turn to you, and wait.',
    [
      ch('Bow to them both.', out('You bow. Two Piplup bow back, perfectly in time, perfectly proud, and one of them falls over. It is not yours. Yours helps it up, and then stands on your boot for the rest of the morning, a small blue weight that has decided, every day, to be exactly what it is.',
        bondLine('piplup', 5), moment('A Piplup that would not change stood on the ice in front of an Empoleon, and stayed exactly itself.', 70))),
    ]),

  // ---------------- AQ48. The Axew and the Excadrill ----------------
  ev('aq48-the-axew-and-the-excadrill', 'The Axew and the Excadrill', AQ, { rarity: 'uncommon', minStage: stageOf('A5'), types: CAVE, cast: ['boss.iris-gen5bw2'], pokemon: 'excadrill', tint: '#2e2418', effect: 'rattle',
    remembers: [
      { id: 'dragon-in-party', when: [anyType('dragon')], notice: 'The Excadrill catches sight of your Dragon-type and turns its whole body round to face the rock wall. It will not look at it. Not yet. Iris winces. "Sorry. It\'s not you. It\'s every Dragon there is."' },
    ] },
    'At the mouth of a cave there is a hole, and in the hole there is an Excadrill. It dug the hole itself, exactly its own size, and it sits in it with its back to the world and its claws folded into a sulky point. A girl with a great cloud of purple hair sits on a rock beside it, chin in her hands. "It lost to a Dragon and blamed me. It\'s been sulking for a year." Her Axew has not given up. It dances. It brings an apple. It pats the Excadrill\'s steel head with one tiny claw. The Excadrill flicks it away without looking, and the Axew rolls over three times, and gets up, and comes back.',
    [
      ch('Help Excadrill face a Dragon.', fight('A Dragon Tamer has been training in the cave all week, and his Dragonite fills the tunnel like weather. The Excadrill sees it and goes rigid. Then Iris says its name, very quietly, and it climbs out of the hole and stands beside you.',
        duel('Dragon Tamer Wyndham', { cls: 'dragon-tamer', size: 2, format: 'doubles', types: ['dragon'], ally: 'excadrill', win: [flag('aq48-faced-dragon'), room('aq48-the-egg')] }, { lineup: ['dragonite', 'dragonair'], lose: [flag('aq48-faced-dragon'), flag('aq48-dragon-lost'), room('aq48-the-egg')] }))),
      ch('Train the Axew.', out('You and Iris set up a target: a pile of stones in the cave mouth. The Axew plants its feet, screws up its face and breathes out a blast of blue fire far too big for it. Dragon Rage. It knocks the stones flat and knocks the Axew flat on its back. In the hole, the Excadrill has turned round. It is looking. It climbs out, walks over, and sets the Axew back on its feet with one careful claw.',
        flag('aq48-axew-trained'), room('aq48-the-egg')),
        { prompt: { id: 'aim-drag', needs: 'ok' }, fail: out('It misses. It misses all afternoon: the ceiling, the floor, Iris\'s hair, very nearly. By dusk your arms ache from resetting stones. Then, with the light going, it breathes out one perfect blast of blue fire, Dragon Rage, and the stones go flying. In the hole, the Excadrill has turned round. It climbs out and taps the Axew\'s head, once, as if it had never been away.',
          takeNode(), flag('aq48-axew-trained'), room('aq48-the-egg')) }),
      ch('Battle both.', fight('"Both of them? Together?" Iris looks at the hole. "It won\'t." The Axew trots out to face you anyway, alone and tiny. For a long moment nothing happens. Then the ground shakes, and the Excadrill bursts up out of its hole and lands in front of the Axew, claws out, between it and you.',
        duel('Iris', { cls: 'dragon-tamer', size: 2, format: 'doubles', types: ['ground', 'dragon'], win: [flag('aq48-battled-both'), room('aq48-the-egg')] }, { sprite: 'iris', lineup: ['excadrill', 'axew'], lose: [flag('aq48-battled-both'), room('aq48-the-egg')] }))),
    ]),
  ev('aq48-the-egg', 'Listening Again', AQ, { room: true, cast: ['boss.iris-gen5bw2'], pokemon: 'excadrill', tint: '#2e2418', effect: 'sparkle',
    remembers: [
      { id: 'faced-dragon', when: [flagIs('aq48-faced-dragon')], notice: 'The Dragonite flew off down the tunnel, and the Excadrill was still standing in the dust, claws up, shaking. It had won. It turned round and looked at Iris for the first time in a year.' },
      { id: 'trained', when: [flagIs('aq48-axew-trained')], notice: 'The Excadrill keeps walking round the Axew, looking at it from every side, as if it cannot work out where that much fire came from in something that small.' },
      { id: 'both', when: [flagIs('aq48-battled-both')], notice: 'All through the fight the Excadrill kept itself between you and the Axew. When it was over, it did not go back to its hole. It sat down next to Iris instead.' },
    ] },
    'The Excadrill is out of its hole. When Iris says its name, it turns its head and listens, and Iris has to sit down on a rock for a minute with her hand over her mouth. "A year," she says. "A whole year." Then she digs in her bag and holds out an Egg, warm and faintly scaled. "From my village. It\'s an Axew. It\'ll get knocked over a lot. It\'ll get up every time. Will you take it?"',
    [
      ch('Take the Egg.', out('It is heavier than it looks, and it is very warm. Iris\'s Axew pats the shell with one tiny claw, the way it patted the Excadrill: a welcome, and a warning. "Watch out for it," Iris says. "And let it watch out for you."',
        egg({ species: ['axew'] }), flag('aq48-egg-taken'))),
      ch('Leave it with Iris.', leave('Iris nods and tucks the Egg back in her bag. "Then it\'ll hatch in the village, where it can see the dragons." Behind her the Excadrill and the Axew are sharing the apple. The Excadrill is letting the Axew have most of it.')),
    ]),
  // Small scenes: one each time its Bond rises a step, once it has hatched and while it is in the party.
  ev('aq48-first-tusks', 'First Tusks', AQ, { callback: true, requires: [flagIs('aq48-egg-taken'), line('axew', 1), age('aq48-egg-taken', 1)], pokemon: 'axew', tint: '#2e2418', effect: 'none' },
    'Camp. The Axew has found a rock and is chewing it, hard, to sharpen its tusks the way it has seen bigger dragons do. It is not working. Its tusks ache. It sits with the rock in its lap, trying very hard not to cry, and failing.',
    [
      ch('Find it a softer stone.', out('You hunt along the stream until you find one smooth and soft as soap. It gnaws, tries, gnaws again, and slowly the stone takes the shape of its bite. It falls asleep with the stone still in its mouth, like a baby with a spoon.', bondLine('axew', 5), flag('aq48-scene-1'))),
      ch('Sit with it until it stops hurting.', out('You sit down with it. It leans on your leg, still sniffing. Neither of you can make its tusks grow faster. You stay anyway, until the fire is low and it is breathing slow, and it has decided that hurting is something you do with someone.', bondLine('axew', 5), flag('aq48-scene-1'))),
    ]),
  ev('aq48-knocked-over', 'Knocked Over', AQ, { callback: true, requires: [seen('aq48-first-tusks'), line('axew', 2)], pokemon: 'axew', tint: '#2e2418', effect: 'none' },
    'After a bad battle {lead} sits apart from the others, its back turned, sulking. The Axew trots over to cheer it up: a dance, a pat, a berry held up in both claws. {lead} flicks it away without looking. The Axew rolls over, gets up, and comes back.',
    [
      ch('Pick the Axew up.', out('You scoop it up before it can be knocked over again. It wriggles: it was not finished. You set it down a little closer, and this time {lead} does not flick it away. It just lets the Axew lean on it, the way Iris\'s Excadrill once let hers.', bondLine('axew', 5), fr(5, 'lead'), flag('aq48-scene-2'))),
      ch('Let it try again.', out('It tries again. And again. On the fifth go {lead} turns round, finally, and the Axew is standing there holding out a squashed berry with a face full of hope. {lead} eats the berry. The sulk is over. The Axew struts round the camp for an hour.', bondLine('axew', 5), fr(5, 'lead'), flag('aq48-scene-2'))),
    ]),
  ev('aq48-on-guard', 'On Guard', AQ, { callback: true, requires: [seen('aq48-knocked-over'), line('axew', 3)], pokemon: 'axew', tint: '#24201a', effect: 'none' },
    'You wake in the night. The Axew is standing at the edge of the firelight, facing the dark mouth of a cave, its little tusks lifted. Something big is moving in there. The Axew is shaking from head to tail. It does not step back.',
    [
      ch('Stand behind it.', out('You get up and stand behind it, not in front. Whatever is in the cave breathes once, huge and slow, and moves away deeper into the rock. The Axew stays on guard until dawn. Then it turns round and falls asleep on your feet.', bondLine('axew', 5), flag('aq48-scene-3'))),
      ch('Call it back to bed.', out('It looks round at you, torn, and then it comes, because you called. It sleeps facing the cave, one eye open. In the morning it brings you a stone from the cave mouth, as if to prove it went that far.', bondLine('axew', 5), flag('aq48-scene-3'))),
    ]),
  // The turning point: two stages after the Egg, while the Axew is in the party.
  ev('aq48-the-dragonite', 'Get Up Again', AQ, { callback: true, minStage: stageOf('A7'), requires: [flagIs('aq48-egg-taken'), age('aq48-egg-taken', 2), line('axew')], types: CAVE, cast: ['boss.iris-gen5bw2'], pokemon: 'dragonite', tint: '#241c14', effect: 'rattle',
    remembers: [
      { id: 'faced-dragon', when: [flagIs('aq48-faced-dragon')], notice: 'Iris\'s Excadrill once stood in front of a Dragonite with you, shaking, and won. It is here now. It nudges your Axew forward, gently, with the flat of its claw.' },
      { id: 'trained', when: [flagIs('aq48-axew-trained')], notice: 'Iris\'s Axew is here too. It plants its feet beside yours, breathes in, and shows it: blue fire, Dragon Rage, the way you all practised in the cave mouth.' },
    ] },
    'A narrow pass through the mountain, and a Dragonite asleep across it, as big as the pass. Iris is there with her Excadrill, out of breath; she has been following its tracks for days. "It\'s gentle, mostly. It just won\'t let anything small go by." Your Axew steps out in front of you. It is shaking. It does not step back. The Dragonite opens one eye.',
    [
      ch('Face it together.', fight('The Dragonite unfolds itself and the pass goes dark. Your Axew roars, the small high roar of something that has decided.',
        beast({ species: ['dragonite'], lv: 1, win: [evolve('axew', 'fraxure'), bondLine('axew', 10), flag('aq48-turned'), room('aq48-tusks-like-blades')] }, { lose: [bondLine('axew', 5), flag('aq48-turned'), flag('aq48-dragonite-lost'), room('aq48-tusks-like-blades')] }))),
      ch('Let it do what Iris\'s Axew did.', out('You stand back. The Axew plants its feet, screws up its face, and breathes out blue fire far too big for it. Dragon Rage. It knocks itself flat. It gets up. The Dragonite looks at it for a long time, then lifts its great head out of the way and lets it pass, and you with it.',
        teach('dragon-rage', { species: 'axew' }), bondLine('axew', 10), flag('aq48-turned'), flag('aq48-dragon-rage'), room('aq48-tusks-like-blades'))),
    ]),
  ev('aq48-tusks-like-blades', 'Tusks Like Blades', AQ, { room: true, cast: ['boss.iris-gen5bw2'], pokemon: 'excadrill', tint: '#2e2418', effect: 'sparkle' },
    'On the far side of the pass Iris sits down in the sun, her Excadrill beside her, listening to every word she says. "It got knocked over," she says, watching your Axew. "It got up. That\'s all a dragon is, you know. Something that gets up." The Excadrill rumbles, low, in agreement.',
    [
      ch('Thank them both.', out('Iris laughs and waves it off. Her Excadrill does not wave. It walks over to your Axew, looks down at it for a long moment, and taps its head once with one steel claw: the way it used to flick hers away, turned into something else. Your Axew stands there afterwards, very still, very tall.',
        bondLine('axew', 5), moment('An Axew that kept getting knocked over stood in front of a Dragonite, and did not step back.', 70))),
    ]),

  // ---------------- AQ49. The Showcase (QUESTLINES_DEEPENED_2.md) ----------------
  ev('aq49-the-showcase', 'The Showcase', AQ, { rarity: 'rare', minStage: stageOf('A4'), types: SHOWCASE, cast: ['boss.serena'], pokemon: 'braixen', tint: '#3a1c30', effect: 'sparkle' },
    'Backstage at a Pokémon Showcase. Ribbons, mirrors, a smell of hairspray and nerves. A girl in a red hat is re-tying the same bow for the fourth time. "It\'s terrified. So am I." Her Braixen holds its stick in both hands, like something that might get away. Last time it dropped it: in the spin, in front of everyone. It rolled off the stage, and somebody in the front row handed it back. "It wasn\'t the dropping. It was that I stopped. I just stood there." She pulls the bow tight. "It looked at me to see what we do now, and I didn\'t know. It\'s forgiven me. I haven\'t." Her Sylveon has wound a ribbon round her wrist, and is holding on.',
    [
      ch('Perform with them.', out('Serena stares at you. "With us? On stage?" The Braixen looks at the Pokémon you chose, and something in its grip loosens, just a little. Somebody hands you a ribbon. Somebody else pushes you towards the light. "Three rounds," Serena whispers. "Theme, Free, Finale. Don\'t look at the judges. They\'re only people."',
        bondUp(2, 'picked'), flag('aq49-performing'), room('aq49-theme')), { pick: {} }),
      ch('Coach them.', out('"From the wings?" Serena nods hard, too many times. "Yes. Please. Tell me what to do. Tell me before each round, and I\'ll do it." She squeezes your hand, then goes out into the light with her Braixen and her Sylveon, and you take your place in the dark at the side of the stage.',
        flag('aq49-coaching'), room('aq49-coach-theme'))),
      ch('Cheer.', out('"You\'ll be out there? Where I can see you?" You promise. She makes you say which row. "Third row. Third row." She says it to the Braixen as well, and the Braixen nods, very seriously, and holds its stick a little less tightly. You go and find your seat.',
        flag('aq49-cheering'), room('aq49-third-row'))),
    ]),
  // Perform with them: three rounds, the player's Pokémon in the act.
  ev('aq49-theme', 'Round One: Theme', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#3a1c30', effect: 'sparkle' },
    'The lights come up so bright the hall vanishes behind them. The Theme round: a walk, a turn, a pose, all in time with the music. Serena takes a breath you can hear from where you stand. The Braixen is beside her. Your Pokémon is beside you. The music starts.',
    [
      ch('A walk, a turn, a pose.', out('Four in step, then four in a turn, then still. It lands. Somebody in the dark claps before they mean to. Serena does not look at the judges. She looks at the Braixen, and the Braixen looks back, and for a moment they both forget to be afraid.', room('aq49-free')),
        { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out('You are a beat late on the turn and your Pokémon is a beat early on the pose, and it comes out a sort of shuffle. Nobody minds. Nothing much can go wrong in a Theme round, and nothing much does. Serena grins at you sideways. "Warm-up," she mouths.', room('aq49-free')) }),
    ]),
  ev('aq49-free', 'Round Two: Free', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#3a1c30', effect: 'spin' },
    'The Free round. The music swells for the spin, and the stick goes up, flaming, turning over and over against the lights. On the second beat, it slips. You knew it might. Everyone knew. It hits the boards and rolls. The hall goes quiet, the terrible quiet of a whole room deciding not to look. The Braixen has stopped. It is looking at Serena, to see what they do now. Your Pokémon is nearer.',
    [
      ch('Pick it up and throw it.', out('Your Pokémon scoops up the stick without breaking step. It does not hand it back. It throws it: high, spinning, to Serena, as if that was always the next move. She catches it. She does not stop. She laughs, out loud, on stage, in front of everyone, and spins.', flag('aq49-good-throw'), room('aq49-finale')),
        { prompt: { id: 'throw-ring', needs: 'ok' }, fail: out('Your Pokémon scoops up the stick and throws it, a little wild, a little wide. Serena does not wait for it to come to her. She runs, leaps, catches it at full stretch, and lands laughing, out loud, on stage, in front of everyone, and spins.', room('aq49-finale')) }),
    ]),
  ev('aq49-finale', 'Round Three: Finale', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#3a1c30', effect: 'confetti' },
    'The Finale is whatever is made of that. Nobody planned it. The Braixen throws the stick to your Pokémon on purpose now, and your Pokémon throws it back, and Serena\'s Sylveon catches the ribbons as they fall, and the music has to hurry to keep up. Serena is still laughing. One more beat. One more pass.',
    [
      ch('Finish it together.', out('The stick goes up one last time and comes down in three hands at once. The hall stands. The judges stand. Serena drops to her knees on the boards with her arms round the Braixen and her face in its fur. They win. The drop was the best thing in the act. "We dropped it," she keeps saying. "We dropped it and it was the best bit."',
        flag('showcase-shared'), fr(3), room('aq49-serenas-egg')),
        { prompt: { id: 'copycat-claps', needs: 'ok' }, fail: out('You miss a beat at the very end and nobody on earth could care. The stick comes down, the music stops, and the hall is on its feet. They win. The drop was the best thing in the act. Serena is on her knees with her arms round the Braixen. "We dropped it," she keeps saying. "We dropped it and it was the best bit."',
          flag('showcase-shared'), room('aq49-serenas-egg')) }),
    ]),
  // Coach them: one thing to say before each round.
  ev('aq49-coach-theme', 'From the Wings: Theme', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#2a1828', effect: 'none' },
    'From the wings you can see everything: the lights, the judges, Serena\'s knuckles white on her ribbon. She looks across at you before the Theme round, waiting. You get one thing to say. She will do exactly what you tell her.',
    [
      ch('"Look at each other, not them."', out('She turns her back on the judges and looks at the Braixen. The Braixen looks at her. The walk, the turn, the pose: none of it is perfect, and all of it is together. When she comes off she is breathing fast and her eyes are bright. "That helped. That really helped."', flag('aq49-good-advice'), room('aq49-coach-free'))),
      ch('"Smile at the judges."', out('She smiles at the judges. It is a very brave smile, and it is aimed the wrong way: she misses the Braixen\'s turn and they bump. It is not a disaster. It is not together, either. She comes off with the smile still on, like something she forgot to take off.', room('aq49-coach-free'))),
      ch('"Don\'t think about the stick."', out('Now she can think of nothing else, and nor can the Braixen. They get through the Theme round staring at the stick between them as if it might bite. She comes off pale. "I thought about the stick," she says. "The whole time."', room('aq49-coach-free'))),
    ]),
  ev('aq49-coach-free', 'From the Wings: Free', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#2a1828', effect: 'none' },
    'The Free round is next: the spin, and the stick going up. Serena looks across at you again. Her face says it plainly. This is where it went wrong last time. This is where she stopped. One more thing to say.',
    [
      ch('"If it drops, keep going. Make it the act."', out('It drops. Of course it drops. She keeps going. It isn\'t elegant. She picks it up mid-step, nearly falls over, and carries on, pink to the ears, and the Braixen spins round her as if that was always the shape of it.', flag('aq49-good-advice'), room('aq49-coach-finale'))),
      ch('"Hold it tighter this time."', out('The Braixen holds it so tightly the spin goes stiff and short, and on the second beat it slips anyway. She stops: one second, two, the whole old nightmare. Then the Braixen picks the stick up itself and pushes it into her hand, and she keeps going.', room('aq49-coach-finale'))),
      ch('"Whatever you do, don\'t drop it."', out('It drops. She freezes, exactly as she did last time, for one long second with the whole hall watching. Then her eyes find you in the wings. She picks it up, and she does not stop again.', room('aq49-coach-finale'))),
    ]),
  ev('aq49-coach-finale', 'From the Wings: Finale', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#2a1828', effect: 'none' },
    'The Finale. They are behind on points and everyone in the hall knows it: there is no way back to a win from here. Serena knows it too. She looks across at you one last time, and she is not asking how to win.',
    [
      ch('"Finish for yourselves."', out('She nods once and turns to the Braixen, and they dance the Finale for nobody but each other. It is clumsy and it is joyful and it ends. They lose. They finish. Serena comes off breathless and shining. "We were dreadful! Did you see? We were dreadful all the way to the end!"', flag('aq49-good-advice'), flag('showcase-finished'), room('aq49-serenas-egg'))),
      ch('"Win it back."', out('They try. They try far too hard: bigger spins, faster steps, the stick up twice as high. Half of it goes wrong. But they reach the end on their feet. They lose. They finish. "We were dreadful," Serena gasps, coming off, and then she starts to laugh. "All the way to the end!"', flag('showcase-finished'), room('aq49-serenas-egg'))),
      ch('"Bow, and come off."', out('She stares at you. Then she shakes her head, turns back to the light, and finishes anyway. They lose. They finish. She comes off breathless. "I wasn\'t stopping. Not this time. Not even for you." She is grinning. "We were dreadful all the way to the end!"', flag('showcase-finished'), room('aq49-serenas-egg'))),
    ]),
  // Cheer: the third row.
  ev('aq49-third-row', 'The Third Row', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#3a1c30', effect: 'spin' },
    'You are in the third row. The Theme round goes by in a blur of light. Then the Free round: the music swells, the stick goes up, flaming, turning against the lights. It wobbles. It is coming down wrong. On stage the Braixen\'s eyes go wide. You have one breath to do something.',
    [
      ch('Shout her name!', out('"SERENA!" Half the hall turns to look at you. Serena does not. She hears it and she does not stop, and that is all it takes. The Braixen catches the stick on one finger, balanced, wobbling, and holds it. They win, barely. Afterwards the Braixen looks out into the dark, straight at the third row.', flag('showcase-cheered'), room('aq49-serenas-egg'))),
      ch('Shout the Braixen\'s name!', out('"BRAIXEN!" It hears you. Its ears go up and its eyes come off the stick, onto the third row, and then back, steadier. It catches the stick on one finger, balanced, wobbling, and holds it. They win, barely. Afterwards it looks out into the dark, straight at you.', flag('showcase-cheered'), room('aq49-serenas-egg'))),
      ch('Hold up both hands: catch it!', out('You stand up and hold both hands high, open, the way you would to catch something. On stage the Braixen sees you, does the same, and the stick drops neatly onto one finger, balanced, wobbling. It holds. They win, barely. Afterwards the Braixen looks out into the third row and holds up both hands.', flag('showcase-cheered'), room('aq49-serenas-egg'))),
    ]),
  ev('aq49-serenas-egg', 'From the Same Litter', AQ, { room: true, cast: ['boss.serena'], pokemon: 'braixen', tint: '#3a1c30', effect: 'hearts',
    remembers: [
      { id: 'all-good-advice', when: [flagIs('aq49-good-advice', 3)], notice: '"Every word you said from the wings," Serena says. "I used every one. I could hear you even when I couldn\'t."' },
      { id: 'shared', when: [flagIs('showcase-shared')], notice: 'Your Pokémon has the Braixen\'s stick and will not give it back. The Braixen does not seem to mind. They have a whole routine now.' },
      { id: 'cheered', when: [flagIs('showcase-cheered')], notice: 'The Braixen comes and finds you first, before Serena, and holds up the stick on one finger, as if to show you it is still there.' },
    ] },
    'Backstage again. The mirrors, the hairspray, the ribbons all over the floor. Serena has her hat off and her hair everywhere. She does not re-tie the bow. Instead she presses an Egg into your hands, warm, faintly orange. "It\'s from the same litter as her. It\'ll drop things. They all do." She closes your fingers round it. "Let it."',
    [
      ch('Take the Egg.', out('You hold it carefully. It is warm all the way through, the way a stick of fire is warm. Serena watches you hold it, and nods, and for the first time today she does not look afraid of anything. "Next time there\'s a stage," she says, "come and find us. We\'ll throw you something."',
        egg({ species: ['fennekin'] }), flag('aq49-fennekin-egg'), flag('reunion-guest-serena'), moment('Serena\'s Braixen dropped its stick on a Showcase stage, and the act went on.', 65))),
      ch('Let Serena keep it.', out('She tucks the Egg back into her bag, against her Sylveon, who curls round it. "Then it\'ll hatch backstage somewhere, and drop its first stick on a real stage." She grins. "Come and watch. Third row."',
        flag('reunion-guest-serena'), moment('Serena\'s Braixen dropped its stick on a Showcase stage, and the act went on.', 65))),
    ]),
  // The Fennekin's own scene, at Bond 2.
  ev('aq49-the-stick', 'The Stick', AQ, { callback: true, requires: [flagIs('aq49-fennekin-egg'), line('fennekin', 2)], pokemon: 'fennekin', tint: '#3a2418', effect: 'none' },
    'On a quiet stretch of road the Fennekin finds a stick. It is the perfect stick: straight, light, exactly its size. It carries it proudly for a mile, tail high. Then it trips on nothing, and drops it. It stops dead, and looks up at you, to see what you do now.',
    [
      ch('Again!', out('"Again!" It blinks. Then it picks the stick up, flings it up as high as a Fennekin can fling anything, and misses it completely on the way down. "Again!" It tries again. And again. By the end of the road it has caught it twice, and dropped it forty times, and never once stopped.', bondLine('fennekin', 5), flag('aq49-stick-again'))),
      ch('Pick it up and throw it back.', out('You pick the stick up and toss it to it, gently, high, as if that was always the next move. The Fennekin catches it in its teeth, staggers, and does not drop it. It carries it the rest of the day with its ears up, and every so often it drops it on purpose, so you can do that again.', bondLine('fennekin', 5), flag('aq49-stick-thrown'))),
    ]),
];

export const REMOVE: string[] = [];
