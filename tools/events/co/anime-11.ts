// Anime questlines, module 11: AQ46-AQ53. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ46 The Hungry Baby                (Single;     script: QUESTLINES_ASH.md "AQ46")
//   AQ47 The Proud Penguin              (Companion;  script: QUESTLINES_ASH.md "AQ47")
//   AQ48 The Axew and the Excadrill     (Companion;  script: QUESTLINES_ASH.md "AQ48")
//   AQ49 The Showcase                   (Tournament; script: QUESTLINES_DEEPENED_2.md "AQ49")
//   AQ50 The Inventor's Pokémon         (Single;     script: QUESTLINES_ASH.md "AQ50")
//   AQ51 Snowy                          (Companion;  script: QUESTLINES_ASH.md "AQ51"; first event = catalog id lillie-nebby)
//   AQ52 The Turtle Who Exploded        (Single;     script: QUESTLINES_ASH.md "AQ52")
//   AQ53 The Sulking Rabbit             (Companion;  script: QUESTLINES_ASH.md "AQ53")
// Build: npm run co:build -- anime-11
import { anyType, bondUp, ch, egg, ev, fight, flag, flagIs, fr, heal, hurt, hurtLead, item, leave, lose, lv, out, relic, room, takeNode, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, evolve, gain, line, monDuel, moment, seen, stageOf, tagTypes, teach, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ46: 'aq46-the-hungry-baby',
  AQ47: 'aq47-the-proud-penguin',
  AQ48: 'aq48-the-axew-and-the-excadrill',
  AQ49: 'aq49-the-showcase',
  AQ50: 'aq50-the-inventors-pokemon',
  AQ51: 'lillie-nebby',
  AQ52: 'aq52-the-turtle-who-exploded',
  AQ53: 'aq53-the-sulking-rabbit',
};

export const PLACEMENT: Record<string, Place> = {
  'aq46-the-hungry-baby': { shape: 'Single', earliest: 'A2', home: 'the town: a Contest Hall; else a + node', sits: 'optional', attaches: 'town', tags: [], note: 'Tags: any.' },
  'aq47-the-proud-penguin': { shape: 'Companion', earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', tags: ['water', 'snow'], beats: ['aq47-wont-go-in', 'aq47-not-a-toy', 'aq47-the-stone', 'aq47-standing-tall'], note: 'The doc gives only the meeting; the small scenes and the turning point follow the Companion rule. The turning point is two stages after the gift Piplup joins.' },
  'aq48-the-axew-and-the-excadrill': { shape: 'Companion', earliest: 'A5', home: 9, window: [6, 12], sits: 'optional', tags: ['cave'], level: 'A+1', beats: ['aq48-first-tusks', 'aq48-knocked-over', 'aq48-on-guard', 'aq48-the-dragonite'], note: 'The doc gives only the meeting; the small scenes (once the Egg hatches) and the turning point follow the Companion rule. The turning point Dragonite is A+1, two stages after the Egg.' },
  'aq49-the-showcase': { shape: 'Tournament', earliest: 'A4', home: 'the Town node; until towns exist, Step 12', sits: 'optional', attaches: 'town', tags: ['city', 'fairy'], beats: ['aq49-the-stick'], note: 'Three rounds on one node (rooms). Tags city; Fairy stages. The Fennekin\'s own scene comes at Bond 2.' },
  'aq50-the-inventors-pokemon': { shape: 'Single', earliest: 'A3', home: 10, window: [7, 13], sits: 'optional', attaches: 'town', tags: ['city', 'electric'], note: 'In the town where the run has one (a garage); else Step 10. Tags city; Electric stages.' },
  'lillie-nebby': { shape: 'Companion', earliest: 'A3', home: 'a + node: an egg', sits: 'optional', tags: ['snow'], beats: ['aq51-the-scarf', 'aq51-fingertip', 'aq51-blizzard'], note: 'Catalog id lillie-nebby is this questline\'s meeting. The Vulpix is Lillie\'s, so the small scenes come one stage after it hatches and the turning point two stages after (not by its Bond in your party). "Give her time" ends at the meeting.' },
  'aq52-the-turtle-who-exploded': { shape: 'Single', earliest: 'A3', home: 9, window: [6, 12], sits: 'optional', tags: ['hot'] },
  'aq53-the-sulking-rabbit': { shape: 'Companion', earliest: 'A3', home: 7, window: [4, 10], sits: 'optional', tags: ['city'], beats: ['aq53-on-its-own', 'aq53-warm-up', 'aq53-watch-me', 'aq53-the-poster', 'aq53-under-the-hood'], note: 'The doc gives only the meeting; the small scenes (once the Egg hatches) and the turning point follow the Companion rule. "Give it space" brings Goh and his Raboot back one stage later (aq53-on-its-own), and the Egg comes then.' },
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
  AQ49: [
    'The player\'s Pokémon gets its +2 Bond when it is picked to join the act, not after the Finale: the game cannot yet carry a pick from one room to the next.',
    'The three-part rhythm game is three short skill checks, one per round (echo-rhythm, throw-ring, copycat-claps). The act wins either way, as the doc writes it; a clean Finale adds a little Bond for the party.',
  ],
  AQ50: [
    'The machine puzzle is a short skill check (tilt-drag). Its "and then everything else" is a half heal for the party on success; on a miss the machine explodes (a small hit to the party) and the Dedenne is blown free.',
  ],
  AQ51: [
    'Lillie\'s friendship is a run relic (your Pokémon\'s friendship grows 10% faster) with a Chronicle line and the flag reunion-guest-lillie; the game has no friendship with a person to give.',
    'The Vulpix stays Lillie\'s, so its small scenes follow the stages after it hatches instead of its Bond rising in your party.',
    '"She touches it in the Final Reunion" is the flag reunion-guest-lillie and a Chronicle line; the Final Reunion itself belongs to another thread.',
    'Remembers "L12 (Nebby) was done" reads the pack flags nebby-trust and nebby-chose, which the legends thread must set; L12\'s "Who are they?" path sets no flag, so it is not remembered.',
  ],
  AQ52: [
    'Remembers "Z1 (the Island Chain) Fire Trial was done" reads the existing Island Trial: Fire event (run by Trial Captain Kiawe) and the pack flag trial-fire-started, which the thread that builds Z1 must set.',
  ],
  AQ53: [
    'Remembers "the player has a Pokémon that evolved and changed personality": the game does not track personality changes, so it reads aq16-owl-turned (AQ16 in anime-0: the shiny Hoothoot that evolved and stopped hiding), the one such change built so far.',
  ],
};

export const CHECKED: Record<string, string> = { AQ46: '2026-11-15', AQ47: '2026-11-15', AQ48: '2026-11-15', AQ49: '2026-11-15', AQ50: '2026-11-15', AQ51: '2026-11-15', AQ52: '2026-11-15', AQ53: '2026-11-15' };

const COLD_SEA = tagTypes('water', 'snow');
const CAVE = tagTypes('cave');
const SHOWCASE = tagTypes('city', 'fairy');
const WORKSHOP = tagTypes('city', 'electric');
const SNOW = tagTypes('snow');
const HOT = tagTypes('hot');
const CITY = tagTypes('city');

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
      ch('"Finish for yourselves."', out('She nods once and turns to the Braixen, and they dance the Finale for nobody but each other. It is clumsy and it is joyful and it ends. They lose. They finish: the first time they ever have. Serena comes off breathless and shining. "We were dreadful! Did you see? We were dreadful all the way to the end!"', flag('aq49-good-advice'), flag('showcase-finished'), room('aq49-serenas-egg'))),
      ch('"Win it back."', out('They try. They try far too hard: bigger spins, faster steps, the stick up twice as high. Half of it goes wrong. But they reach the end on their feet. They lose. They finish: the first time they ever have. "We were dreadful," Serena gasps, coming off, and then she starts to laugh. "All the way to the end!"', flag('showcase-finished'), room('aq49-serenas-egg'))),
      ch('"Bow, and come off."', out('She stares at you. Then she shakes her head, turns back to the light, and finishes anyway. They lose. They finish: the first time they ever have. She comes off breathless. "I wasn\'t stopping. Not this time. Not even for you." She is grinning. "We were dreadful all the way to the end!"', flag('showcase-finished'), room('aq49-serenas-egg'))),
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
  // ---------------- AQ50. The Inventor's Pokémon ----------------
  ev('aq50-the-inventors-pokemon', 'The Inventor\'s Pokémon', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: WORKSHOP, cast: ['boss.clemont'], pokemon: 'dedenne', tint: '#2a2a14', effect: 'flicker' },
    'A bang from a garage at the end of the street. Smoke rolls out of the door in a neat grey ring. Inside, a machine the size of a wardrobe is ticking, sparking and smelling of burnt bread, and through a little round window in its side a Dedenne is looking out at you, whiskers flat, stuck. A young man in a blue jumpsuit and enormous round glasses waves the smoke away. "It was supposed to make toast!" He pushes his glasses up his nose. "The future is now. Slightly on fire." Behind him a Luxray lies on a workbench, staring at the machine without blinking. Its eyes glow faintly. It can see straight through steel. Three wires hang out of a panel by the hatch: red, blue and yellow.',
    [
      ch('Free the Dedenne.', out('You kneel by the panel. Up close the machine is warm and humming, and the Dedenne presses its paws to the glass. "One of those wires opens the hatch," Clemont says, hovering. "The other two do... something. I didn\'t label them. I was going to label them."',
        flag('aq50-freeing'), room('aq50-three-wires'))),
      ch('Fix the machine.', out('You and Clemont open the side panel together and stare into a nest of gears. There is a pattern in it, if you look long enough: one cog turning the wrong way, one spring in back to front. You set them right. The machine shudders, dings, and makes toast. Then it makes pancakes. Then a boiled egg, a pot of tea, a polished pair of glasses and a freshly ironed jumpsuit. Last of all the hatch opens, and the Dedenne walks out holding a slice of toast. Everybody eats. "It works," Clemont whispers. "It works too well. I love it."',
        heal(0.5), flag('aq50-machine-fixed'), room('aq50-from-the-gym')),
        { prompt: { id: 'tilt-drag', needs: 'good' }, fail: out('You set one cog right and another wrong, and the machine notices. It hums, then whines, then explodes, gently, in a great puff of crumbs and soot. When the smoke clears everyone in the garage is black from head to foot, and the hatch has blown open. The Dedenne sails out across the room and lands in Clemont\'s arms. He looks down at it through two clean circles where his glasses were. "Science," he says faintly.',
          hurt(0.1), flag('aq50-machine-exploded'), room('aq50-from-the-gym')) }),
      ch('Ask Luxray.', out('You look at the Luxray. The Luxray looks at you, sighs through its nose, and gets down off the workbench. It walks to the panel, studies the three wires with those glowing eyes, and puts one large paw on the yellow. You pull it. The hatch springs open and the Dedenne flies out into Clemont\'s arms. "Luxray!" Clemont cries. "You could have said!" The Luxray goes back to its bench. It did say. It has been saying it all morning.',
        flag('aq50-asked-luxray'), room('aq50-from-the-gym'))),
    ]),
  ev('aq50-three-wires', 'Three Wires', AQ, { room: true, cast: ['boss.clemont'], pokemon: 'dedenne', tint: '#2a2a14', effect: 'flicker' },
    'Red, blue, yellow. One of them opens the hatch. The other two will not be good. Inside the machine the Dedenne\'s whiskers are crackling with little sparks, and every time a spark jumps, it jumps toward the yellow wire. On the bench, the Luxray has opened one eye, and it is looking at the yellow wire too.',
    [
      ch('Pull the red wire.', out('The machine fires a slice of toast across the garage like a cannonball. Then another. Then twenty. A crust catches {lead} full in the face, and a spark comes with it. Through the storm of toast the Luxray walks calmly to the panel and pulls the yellow wire with its teeth. The hatch opens. The Dedenne climbs out and pats {lead} on the nose, apologising for the machine.', hurtLead(0.1), flag('aq50-wrong-wire'), room('aq50-from-the-gym'))),
      ch('Pull the blue wire.', out('A fat blue spark jumps out of the panel and lands on {lead}, who did nothing to deserve it. The machine starts playing a march. The Luxray gets up, crosses the garage, and pulls the yellow wire with its teeth, and the hatch swings open. The Dedenne climbs out, shakes itself, and sits on {lead}\'s head to say sorry.', hurtLead(0.1), flag('aq50-wrong-wire'), room('aq50-from-the-gym'))),
      ch('Pull the yellow wire.', out('Click. The hatch swings open with a polite little ding, and the Dedenne tumbles out into your hands, warm and fizzing and covered in crumbs. Clemont throws both arms in the air. "The yellow! I KNEW it was the yellow! I would have guessed the yellow!" On the bench, the Luxray closes its eye. Good.', fr(3, 'lead'), flag('aq50-right-wire'), room('aq50-from-the-gym'))),
    ]),
  ev('aq50-from-the-gym', 'A Dedenne From the Gym', AQ, { room: true, cast: ['boss.clemont'], pokemon: 'dedenne', tint: '#24281a', effect: 'sparkle',
    remembers: [
      { id: 'fixed', when: [flagIs('aq50-machine-fixed')], notice: 'The machine is still making things in the corner: a sandwich, a sock, a small paper crown. Clemont puts the crown on the little Dedenne. It does not take it off.' },
      { id: 'luxray', when: [flagIs('aq50-asked-luxray')], notice: 'The Luxray has come down off its bench to look at you. It looks at the little Dedenne, and at you, and then gives one slow blink. It approves.' },
      { id: 'wrong-wire', when: [flagIs('aq50-wrong-wire')], notice: 'The little Dedenne goes straight to {lead} and starts gently combing the singed fur flat with its paws, as if it is the one who has to make up for the machine.' },
    ] },
    'Clemont sits on an upturned bucket with the rescued Dedenne asleep on his head and soot on his nose, perfectly happy. "That one\'s my sister\'s. She\'d never have forgiven me." He points up at the garage rafters. A dozen little faces look down from the wiring. "The Gym\'s full of them. They live in the cables, they eat the power. One of them has followed you round the garage since you came in." It has. It is sitting on your shoe.',
    [
      ch('Take the little Dedenne.', out('It climbs from your shoe to your shoulder and settles in your collar, whiskers fizzing against your neck. Clemont beams. "Tell people it came from my Gym! Tell them the inventor sent it!" From the rafters a dozen Dedenne watch it go, and from the bench the Luxray watches too, and the machine in the corner makes one more slice of toast, for the road.',
        gain('dedenne', { bond: 10 }), flag('aq50-dedenne-given'))),
      ch('Leave it in the Gym\'s wires.', leave('It climbs back up into the rafters with the others, a little reluctantly. Clemont waves you off from the garage door with toast in his hand. "Come back when I\'ve fixed the future!" Behind him something goes bang.')),
    ]),
  // ---------------- AQ51. Snowy (its first event is the catalog id lillie-nebby) ----------------
  ev('lillie-nebby', 'Snowy', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: SNOW, cast: ['boss.lillie-z'], pokemon: 'vulpix-alola', tint: '#1e2a3a', effect: 'snow',
    remembers: [
      { id: 'nebby-trust', when: [flagIs('nebby-trust')], notice: 'She looks up and knows you. "You stood in front of the people chasing Nebby and me." She takes a breath, and for once her hands do not go back to her lap. They stay, an inch above the shell. She is braver than she was.' },
      { id: 'nebby-chose', when: [flagIs('nebby-chose')], notice: 'She knows you. "Nebby went to you, that day. All on its own. I was so jealous." She almost laughs. "It taught me something. Being chosen is brave too." She is braver than she was. Her hands stay an inch above the shell.' },
    ] },
    'Snow on the path, falling slowly. A girl in a white hat and a white dress sits very straight on a bench, holding a basket in her arms. She is afraid to touch Pokémon, any Pokémon, and has been for as long as she can remember. In the basket, on a folded scarf, is an Egg: white as frost, and so cold the air above it smokes. She has carried it a long way, and she has never once touched it. Her hands go out to it. Hover. Go back to her lap. "I can\'t touch it. I want to. I can\'t." She looks down at her gloves. "The professor says it hatches when it feels someone warm. It\'s supposed to be me." The Egg gives one small tap from inside, as if it is waiting too.',
    [
      ch('Hold it with her.', out('You sit beside her. She pulls off one glove herself, and her hand is shaking. You put yours underneath it, and together, very slowly, you lower both onto the shell. It is so cold it stings. She flinches. She does not let go. Under her palm something taps, then cracks, and a small white Vulpix pushes its way out, sneezes a little flurry of snow, and looks straight up at her. Lillie is crying. "I\'m touching her," she whispers. "Look. I\'m touching her."',
        flag('aq51-hatched'), flag('aq51-held-together'), fr(3))),
      ch('Hatch it for her.', out('She passes you the basket as if it were burning. You hold the Egg inside your coat, against your chest, for a long time, while she watches every breath you take. Then it cracks in your arms, and a small white Vulpix blinks up at you first. It sniffs. It turns. It climbs out of your arms, across the bench, and curls up on the scarf in her lap, right beside her hands. She does not touch it. But she does not move away. "She came to me," Lillie says, astonished. "She came to me."',
        flag('aq51-hatched'), flag('aq51-hatched-for-her'))),
      ch('Give her time.', out('You sit beside her and say nothing. The snow comes down. Her hands go out, and hover, and go back, three times, four. The Egg taps, patient. In the end she tucks the scarf round it, very carefully, without touching it. "Not today." She looks at you, and her chin is up. "But I will. I promise. One day you\'ll see me hold her." You believe her.',
        flag('aq51-gave-time'), flag('reunion-guest-lillie'), relic('lillies-friendship', 'Lillie\'s Friendship', [{ kind: 'friendshipMultiplier', value: 1.1 }]), moment('Lillie could not touch her Egg yet. She promised that one day you would see her hold it.', 60))),
    ]),
  // Small scenes: the Vulpix is Lillie's, so they follow the stages after it hatched, not its Bond in your party.
  ev('aq51-the-scarf', 'The Scarf', AQ, { callback: true, requires: [flagIs('aq51-hatched'), age('aq51-hatched', 1)], cast: ['boss.lillie-z'], pokemon: 'vulpix-alola', tint: '#1e2a3a', effect: 'snow' },
    'Lillie catches you up on the road, a little out of breath, with the Vulpix trotting at her heels in the snow. It is a long road. The Vulpix is very small. It is falling further and further behind, and Lillie keeps stopping and holding out her hands and taking them back. "She\'s tired," she says. "I know she\'s tired."',
    [
      ch('Carry it to her.', out('You lift the Vulpix out of the snow and put it in the scarf Lillie holds out like a sling, so that she can carry it without her hands touching fur. She carries it the rest of the way, very carefully, talking to it all the time. At the next rest your own Pokémon crowd round the scarf to look.', fr(2), flag('aq51-scene-1'))),
      ch('Wait with her.', out('You stop. She kneels down in the snow and holds the scarf open, and waits. The Vulpix looks at it, and at her, and climbs in by itself. Lillie lifts it. Her face is very pink and very proud. "She chose to," she says. "She chose."', fr(2), flag('aq51-scene-1'))),
    ]),
  ev('aq51-fingertip', 'One Fingertip', AQ, { callback: true, requires: [seen('aq51-the-scarf'), flagIs('aq51-scene-1')], cast: ['boss.lillie-z'], pokemon: 'vulpix-alola', tint: '#18202e', effect: 'none' },
    'Camp, late. The Vulpix has fallen asleep curled against Lillie\'s shoe, its tail over its nose. Lillie is not asleep. She is looking at it. Slowly, she reaches out one fingertip, and stops a breath away from the white fur. She stays like that, not breathing.',
    [
      ch('Say nothing. Wait.', out('You wait with her. The fire ticks. After a long, long time her fingertip comes down, and touches the very tip of one white ear, and stays there for the space of a heartbeat. Then she takes it back and holds that hand in the other one, as if it had done something enormous. It had.', flag('aq51-fingertip'), flag('aq51-scene-2'))),
      ch('"She\'s warm. Like you."', out('"Is she?" Lillie whispers. Her fingertip comes down, just the tip of it, on the white fur. "She is. She\'s warm." She does not take it back for a while. The Vulpix, asleep, presses its head up into the touch, and Lillie makes a small sound that is nearly a laugh and nearly not.', flag('aq51-fingertip'), flag('aq51-scene-2'))),
    ]),
  // The turning point: two stages after it hatched.
  ev('aq51-blizzard', 'In the Blizzard', AQ, { callback: true, minStage: stageOf('A5'), requires: [flagIs('aq51-hatched'), age('aq51-hatched', 2)], types: SNOW, cast: ['boss.lillie-z'], pokemon: 'vulpix-alola', tint: '#141c28', effect: 'snow',
    remembers: [
      { id: 'held-together', when: [flagIs('aq51-held-together')], notice: 'She held this Egg once with your hand under hers. You are too far away now to do that. She knows it. She is already running.' },
      { id: 'hatched-for-her', when: [flagIs('aq51-hatched-for-her')], notice: 'It hatched in your arms. For one second, out on the ice, the Vulpix looks for you. Then it looks for her.' },
    ] },
    'The snow comes sideways out of nowhere, and the world goes white. When it clears a little, the Vulpix is gone. Lillie is calling its name, her voice thin in the wind. Then you see it: out on a frozen ledge, chasing snowflakes, and three Sneasel slinking round the rocks toward it, claws out. The Vulpix has seen them. It is too small to run. "No," Lillie says. "No, no, no."',
    [
      ch('Fight them off.', fight('You run for the ledge. The Sneasel turn to meet you, grinning. Behind you, you hear Lillie running too.',
        beast({ species: ['sneasel'], format: 'doubles', lv: 1, win: [flag('aq51-sneasel-beaten'), room('aq51-her-name')] }, { lose: [flag('aq51-sneasel-lost'), room('aq51-her-name')] }))),
      ch('Let her go to it.', out('You stay where you are, and she does not even see you not moving. She is already past you, out onto the ice, slipping, falling, getting up. She drops to her knees in front of the Vulpix with her arms wide, and the three Sneasel look at a girl who will not move for anything, and decide this is not worth it.',
        flag('aq51-she-went'), room('aq51-her-name'))),
    ]),
  ev('aq51-her-name', 'Her Name Is Snowy', AQ, { room: true, cast: ['boss.lillie-z'], pokemon: 'vulpix-alola', tint: '#2a3448', effect: 'sparkle' },
    'Lillie is kneeling in the snow, and she is holding the Vulpix. Not in a scarf. Not in a basket. In her own two bare hands, pressed against her coat, its small cold nose tucked under her chin. She did not think about it. She just picked her up. She looks at her hands as if they belong to someone else. "I\'m holding her." Then, quietly, to the Vulpix: "Snowy. Your name is Snowy."',
    [
      ch('"Snowy."', out('Snowy sneezes a flurry of snow straight into Lillie\'s face, and Lillie laughs, really laughs, louder than you have ever heard her. She does not put Snowy down all the way back to camp. When you part on the road, she takes your hand, without thinking, and squeezes it. "Thank you. For waiting with me. For all of it." You have a friend now. You both know it.',
        flag('aq51-lillie-friend'), flag('reunion-guest-lillie'), relic('lillies-friendship', 'Lillie\'s Friendship', [{ kind: 'friendshipMultiplier', value: 1.1 }]), moment('Lillie picked up her Vulpix with her own two hands, and named her Snowy.', 75))),
    ]),
  // ---------------- AQ52. The Turtle Who Exploded ----------------
  ev('aq52-the-turtle-who-exploded', 'The Turtle Who Exploded', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: HOT, cast: ['boss.kiawe'], pokemon: 'turtonator', tint: '#3a1a10', effect: 'fire',
    remembers: [
      { id: 'took-the-trial', when: [seen('island-trial-fire')], notice: 'Kiawe stops halfway through wiping his hands, and looks at you properly. "The caldera. You took my Trial." A slow grin. "I ran that Trial, and I remember how you fought. The dance will come easy to you."' },
      { id: 'started-the-trial', when: [flagIs('trial-fire-started')], notice: 'Kiawe looks at the Z-Ring on your wrist, then at you. "You started my Fire Trial. I\'m the Captain who ran it. I remember you." He nods at the field. "Then you know what heat is. Good."' },
    ] },
    'A farm on the side of a volcano. Black earth in long terraces, steam rising from cracks between the rows, and the smell of baked soil and sweet potatoes. A Charizard is pulling a plough down a field, slow and straight, wings folded. At the end of the row, in the sun, a Turtonator lies flat on its stomach, fast asleep, its spiked shell glinting. A young man with a towel round his neck and dirt to the elbows leans on a fence. "It\'s on its break. It takes long breaks. Its Shell Trap is worth the wait." He wipes his forehead. "Help with the harvest, and I\'ll teach you a dance. A Z-Move dance."',
    [
      ch('Harvest.', out('It takes the rest of the day. You dig sweet potatoes out of earth so warm it steams in your hands, and carry baskets up the terraces, and your Pokémon pull carts beside the Charizard, which sets the pace and does not slow down for anyone. The Turtonator sleeps through all of it. At sunset Kiawe\'s family sets a long table in the yard, and his grandfather and his little sister pile every plate twice. Everybody eats until nobody can move. "Now," Kiawe says, standing up. "The dance. I keep my word."',
        takeNode(), heal(1), fr(3), flag('aq52-harvested'), room('aq52-the-dance'))),
      ch('Battle Turtonator.', fight('Kiawe raises an eyebrow, then whistles. The Turtonator opens one eye, sighs smoke, and gets up. "Go on," Kiawe says. "Hit the shell. Everybody does, once."',
        monDuel('Kiawe\'s Turtonator', 'turtonator', 0, { foeMoves: ['shell-trap'], win: [flag('aq52-shell-trap'), room('aq52-the-dance')], lose: [flag('aq52-shell-trap'), flag('aq52-shell-trap-lost'), room('aq52-the-dance')] }))),
      ch('Learn the dance.', out('"The dance first? Before the harvest?" Kiawe looks at the fields, then at you, and laughs. "Fine. The fields will still be here." He plants his feet in the black earth. Arms crossed, then flung up and out like a fire catching, a stamp, a turn, a blaze. You copy him, beat for beat, until the ground is warm under your feet and your arms remember it on their own. He stops, nods, and puts a red crystal in your hand, warm as a coal. "Firium Z. You earned it. Now come and dig."',
        item('firium-z'), flag('aq52-danced')),
        { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out('Arms crossed, flung up, a stamp, a turn, a blaze. You get the stamp. You get the turn. You get the blaze wrong eleven times, and Kiawe makes you do it all again from the start, every time, until the sun is low and the Charizard has finished the field without you. On the twelfth go, it is right. He grins and drops a red crystal into your hand, warm as a coal. "Firium Z. Slow, but you got there. That\'s how fire works."',
          takeNode(), item('firium-z'), flag('aq52-danced')) }),
    ]),
  ev('aq52-the-dance', 'The Dance', AQ, { room: true, cast: ['boss.kiawe'], pokemon: 'charizard', tint: '#3a1a10', effect: 'fire',
    remembers: [
      { id: 'shell-trap', when: [flagIs('aq52-shell-trap')], notice: 'Your Pokémon are still smoking gently from the Shell Trap. The Turtonator has gone back to sleep, satisfied. "Now you know," Kiawe says. "Never hit the shell. Everybody does, once."' },
      { id: 'harvested', when: [flagIs('aq52-harvested')], notice: 'You are too full to move, and Kiawe makes you move anyway. His little sister sits on the fence to watch, and laughs at you, and then at him.' },
    ] },
    'Kiawe stands in the black earth with his feet planted, the volcano smoking behind him. "Watch. Then copy." Arms crossed in front of his face. Then flung up and out, like a fire catching. A stamp. A turn. A blaze. Every move has a weight to it, as if he is throwing something heavy and hot. "It isn\'t a dance for showing off. It\'s a promise to your Pokémon. You give it everything, and it gives you everything back."',
    [
      ch('Learn the dance.', out('Beat for beat, you copy him, until the ground is warm under your feet and your arms remember it on their own. At the last blaze, your Pokémon roar together without being told. Kiawe nods once and drops a red crystal into your hand, warm as a coal. "Firium Z. Use it for something that matters."',
        item('firium-z'), flag('aq52-danced')),
        { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out('You get the stamp. You get the turn. You get the blaze wrong eleven times, and he makes you start from the top every time, until the stars are out over the volcano. On the twelfth go it is right, and your Pokémon roar together. He drops a red crystal into your hand. "Firium Z. Slow, but you got there. That\'s how fire works."',
          takeNode(), item('firium-z'), flag('aq52-danced')) }),
      ch('Thank him, and go.', leave('"No dance?" Kiawe shrugs, not offended. "The offer stands. The volcano isn\'t going anywhere." Behind him, the Turtonator rolls over in the sun, and something in its shell goes click.')),
    ]),
  // ---------------- AQ53. The Sulking Rabbit ----------------
  ev('aq53-the-sulking-rabbit', 'The Sulking Rabbit', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: CITY, cast: ['trainer.youngster_m'], pokemon: 'raboot', tint: '#2a1e1a', effect: 'none',
    remembers: [
      { id: 'owl-turned', when: [flagIs('aq16-owl-turned')], notice: 'Goh stares at your Noctowl. "Wait. That one used to hide, didn\'t it? I can tell. And now it doesn\'t." He swallows. "It changed when it evolved, and you didn\'t lose it. How?"',
        addChoices: [ch('Tell him about the owl.', out('You tell him about the gold Hoothoot that hid from every lamp, and the night it flew into all of them at once. You tell him it did not stop being itself when it changed. It just stopped being afraid of being looked at. Goh listens with his whole face. Then he goes and sits next to the Raboot, not too close, and says nothing at all, and the Raboot pushes its hood back half an inch to look at him.', flag('aq53-owl-advice'), room('aq53-the-egg')))] },
    ] },
    'A city park, and a football pitch with nobody on it. On the bench sits a Raboot with its hood pulled down over its eyes and its arms folded, refusing everything. It will not battle. A boy in a cap, Goh, holds out a Poké Ball to it. It turns its head away. He holds out a berry. It turns its head the other way. "It evolved and now it hates everything." He sits down hard on the grass. "Especially me." The Raboot slides off the bench, finds a stone, and kicks it at you: neat, hard, perfectly aimed, right at your shin. It is a very good kick. Behind the bench, on the fence, a poster of a famous footballer is peeling in the rain.',
    [
      ch('Give it space.', out('You sit down at the far end of the bench and do not look at it. Goh opens his mouth, and you shake your head, and he shuts it again. The Raboot sulks. It sulks for an hour, and when you finally get up and go, it is still sulking, a small furious shape under a hood. "It\'s going to be like this forever," Goh says. You do not think so. You think it needs a while longer than an hour.',
        flag('aq53-gave-space'))),
      ch('Kick a stone back.', out('You trap the stone with your foot and flick it back. The Raboot\'s ears come up under the hood. It traps it, flicks it up, knee, knee, heel, and sends it back to you in the air. You head it, badly. It catches it on one foot and holds it there, balanced, while it looks at you. Back and forth, a hundred times, more. It is very good. It is so much better than you. And somewhere around the fiftieth kick, under the hood, it starts to smile.',
        flag('aq53-keepy-uppy'), room('aq53-the-egg')),
        { prompt: { id: 'whack-tap', needs: 'ok' }, fail: out('You try to flick it back and miss the stone completely. The Raboot snorts. Then it hops down, traps the stone, and keeps it up alone: knee, knee, heel, head, round its back and up again, showing you how. You clap. It does it again, faster, glancing at you to see if you are still watching. You are. Under the hood, it starts to smile.',
          flag('aq53-keepy-uppy'), room('aq53-the-egg')) }),
      ch('Ask what\'s wrong.', out('You crouch down in front of it and ask. Not Goh: it. The Raboot stares at you from under the hood for a long time. Then it lifts one paw and points, past you, at the peeling poster on the fence: a footballer in mid-kick, with a whole stadium on its feet behind him. Goh looks at the poster. Then at his phone, full of Pokémon he has caught. Then at the Raboot. "Oh," he says quietly. "You wanted me to notice you."',
        flag('aq53-asked'), room('aq53-the-egg'))),
    ]),
  // "Give it space": it sulks a whole stage, then follows on its own.
  ev('aq53-on-its-own', 'On Its Own', AQ, { callback: true, requires: [flagIs('aq53-gave-space'), age('aq53-gave-space', 1)], cast: ['trainer.youngster_m'], pokemon: 'raboot', tint: '#2a1e1a', effect: 'none' },
    'Footsteps behind you on the road, and a voice: "Wait up!" It is Goh, out of breath, and a long way behind him, kicking a pebble along the road, hood still up, is the Raboot. It is not in its Ball. Nobody is making it come. It is following, on its own. "It sulked for days," Goh says. "Then this morning it was just... there. Walking behind me."',
    [
      ch('Wave to the Raboot.', out('You wave. The Raboot looks at you from under its hood, and very deliberately does not wave back. Then it kicks the pebble, hard and neat, so that it skids to a stop exactly at your feet. A hello. Goh laughs out loud, for the first time since you met him.', flag('aq53-followed'), room('aq53-the-egg'))),
    ]),
  ev('aq53-the-egg', 'Something Small and Fast', AQ, { room: true, cast: ['trainer.youngster_m'], pokemon: 'raboot', tint: '#2a201a', effect: 'sparkle' },
    'Goh digs in his bag and comes out with an Egg, warm and wriggling, with a faint red flame-pattern on the shell. "Professor gave me this to look after. It\'s a Scorbunny, like mine was." He turns it over in his hands. "I want it to go to someone who\'ll notice it. From the very start. Every trick." He looks at the Raboot, then at you. "Will you?"',
    [
      ch('Take the Egg.', out('It kicks inside the shell the moment you hold it, hard, as if it is already practising. Goh grins. "Yeah. That\'s a Scorbunny." The Raboot comes over and looks at the Egg for a long moment from under its hood. Then it pushes the hood back, all the way, so the Egg can see its face.',
        egg({ species: ['scorbunny'] }), flag('aq53-egg-taken'))),
      ch('Leave it with Goh.', leave('Goh nods and puts the Egg back in his bag, carefully, next to the Raboot\'s spare berry. "I\'ll notice it, then. Both of them." The Raboot kicks a stone into the bag after the Egg, gently. A welcome, maybe.')),
    ]),
  // Small scenes: one each time its Bond rises a step, once it has hatched and while it is in the party.
  ev('aq53-warm-up', 'Warm-Up', AQ, { callback: true, requires: [flagIs('aq53-egg-taken'), line('scorbunny', 1), age('aq53-egg-taken', 1)], pokemon: 'scorbunny', tint: '#2a201a', effect: 'none' },
    'Morning, cold. The Scorbunny will not sit still. It runs circles round the camp to warm its feet until the pads glow, then kicks everything it can find: pine cones, pebbles, your boot, the kettle. Every time it kicks something it looks round to see if you saw.',
    [
      ch('Race it.', out('You get up and race it round the camp. It wins, easily, by miles, and then runs back to win again. By the fifth lap it is laughing, a squeaky breathless sound, and its feet are glowing like coals.', bondLine('scorbunny', 5), flag('aq53-scene-1'))),
      ch('Watch every kick.', out('You put down your breakfast and watch. Pine cone: you nod. Pebble: you nod. Kettle: you wince, and nod. It notices you noticing, and the kicks get bigger and bolder and more ridiculous, all for you.', bondLine('scorbunny', 5), flag('aq53-scene-1'))),
    ]),
  ev('aq53-watch-me', 'Watch Me', AQ, { callback: true, requires: [seen('aq53-warm-up'), line('scorbunny', 2)], pokemon: 'scorbunny', tint: '#2a201a', effect: 'none' },
    'The Scorbunny has learned a trick: a stone flicked up, caught on its knee, sent spinning over its head and back down onto its foot. It does it perfectly. You were looking the other way. When you turn round, it is standing with the stone on its foot, ears flat, very still.',
    [
      ch('Ask it to do it again.', out('"Again? I missed it." The ears come up. It does it again, even better, and this time it watches your face the whole way through instead of the stone, and nearly drops it, and doesn\'t. You clap. It does it six more times.', bondLine('scorbunny', 5), flag('aq53-scene-2'))),
      ch('Say sorry, and sit down to watch.', out('You say sorry and sit down where you can see it properly, and you do not look away. It waits, making sure. Then it does the trick, and a new one after it that it has not even practised. It wobbles. It lands it. It looks at you as if you did it together.', bondLine('scorbunny', 5), flag('aq53-scene-2'))),
    ]),
  ev('aq53-the-poster', 'The Poster', AQ, { callback: true, requires: [seen('aq53-watch-me'), line('scorbunny', 3)], pokemon: 'scorbunny', tint: '#2a1e1a', effect: 'glint' },
    'In a town, the Scorbunny stops in front of a poster on a wall: a famous Cinderace, mid-kick, with a stadium on its feet behind it. It stands there a long time, looking up. Then it looks down at its own feet, which are small, and not very famous.',
    [
      ch('Lift it up to see.', out('You lift it up so it is face to face with the Cinderace. It studies the poster seriously, every line of the kick. Then it twists in your hands and copies the pose exactly, in the air, and looks round at you to check.', bondLine('scorbunny', 5), flag('aq53-scene-3'))),
      ch('"You\'ll be on one, one day."', out('It looks at you sideways, as if you might be laughing at it. You are not. It looks at the poster once more, then at you, and then it walks on with its chest out, kicking a stone ahead of it all the way down the street, as if there were a stadium watching. There is. It is you.', bondLine('scorbunny', 5), flag('aq53-scene-3'))),
    ]),
  // The turning point: two stages after the Egg, while it is in the party. It evolves, and sulks.
  ev('aq53-under-the-hood', 'Under the Hood', AQ, { callback: true, minStage: stageOf('A5'), requires: [flagIs('aq53-egg-taken'), age('aq53-egg-taken', 2), line('scorbunny')], types: CITY, pokemon: 'raboot', tint: '#221a18', effect: 'none',
    remembers: [
      { id: 'keepy-uppy', when: [flagIs('aq53-keepy-uppy')], notice: 'You remember a park, and Goh\'s Raboot, and a stone kicked back and forth a hundred times. Yours has never seen that. But it has the same look under the hood.' },
      { id: 'asked', when: [flagIs('aq53-asked')], notice: 'You remember Goh\'s Raboot pointing at a poster on a fence, because nobody had asked it. You know what this is.' },
    ] },
    'In the night it evolved. In the morning there is a Raboot sitting by the cold fire with a hood of fur pulled down over its eyes and its arms folded. It will not eat. It will not battle. When you say its name it does not look up. Then it gets up, finds a stone, and kicks it at your shin: neat, hard, perfectly aimed. You have seen this before. You were not the one being kicked at, then.',
    [
      ch('Give it space.', out('You leave it be. It sulks all day, trailing far behind, kicking stones into the ditch. You do not look back, though it costs you. At evening, when you sit by the fire, it comes and sits down beside you, not touching, hood up. After a long while it leans. Just slightly. Just enough.',
        evolve('scorbunny', 'raboot'), bondLine('scorbunny', 10), flag('aq53-turned'), room('aq53-noticed'))),
      ch('Kick a stone back.', out('You trap the stone and flick it back. Its ears come up under the hood. Knee, knee, heel, and back to you in the air; you head it, badly; it catches it on one foot and holds it. Back and forth until the sun is high. Somewhere in the middle of it the hood falls back on its own, and it is grinning.',
        evolve('scorbunny', 'raboot'), bondLine('scorbunny', 10), flag('aq53-turned'), room('aq53-noticed'))),
      ch('Ask what\'s wrong.', out('You crouch down in front of it and ask. It stares at you from under the hood. Then it points, not at a poster, but at you: at your eyes. Watch me, it means. I changed, and I need you to still see me. You nod. You see it. It pushes the hood back with one paw.',
        evolve('scorbunny', 'raboot'), bondLine('scorbunny', 10), flag('aq53-turned'), room('aq53-noticed'))),
    ]),
  ev('aq53-noticed', 'Noticed', AQ, { room: true, pokemon: 'raboot', tint: '#2a201a', effect: 'sparkle' },
    'On the road out of town there is an empty football pitch. The Raboot stops at the edge of it. It looks at the grass, and at you, and at a stone lying in the centre circle. It is asking.',
    [
      ch('Watch it play.', out('You sit on the touchline. It plays the whole pitch alone: dribbles, turns, a long curling kick into an empty goal, and after every one it looks round to make sure you are still watching. You are. You always will be. When it is done it walks back to you with its hood down and its head up, and you understand that it was never sulking about evolving. It was afraid you would stop looking.',
        lv(1, 'lead'), moment('A Raboot that sulked under its hood played a whole pitch alone, and you watched every kick.', 70))),
    ]),
];

export const REMOVE: string[] = [];
