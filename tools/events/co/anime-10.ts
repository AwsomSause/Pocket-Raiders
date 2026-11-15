// Anime questlines, module 10: AQ39-AQ45. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ39 The Nut Who Ate Everything      (Single;    script: QUESTLINES_DEEPENED_2.md "AQ39"; MY20's first scene)
//   AQ40 The Aura Egg                    (Companion; script: QUESTLINES_DEEPENED_2.md "AQ40")
//   AQ41 The Ghost Left Behind           (Companion; script: QUESTLINES_DEEPENED_2.md "AQ41")
//   AQ42 The Dragonite Who Stopped Delivering (Companion; script: QUESTLINES_ASH.md "AQ42")
//   AQ43 The Rock That Became Steel      (Companion; script: QUESTLINES_ASH.md "AQ43"; catalog id brock-cooking)
//   AQ44 Togepi Paradise                 (Door;      script: QUESTLINES_ASH.md "AQ44"; chain rows in src/data/catalogOverhaul/pseudo/anime-10.json)
//   AQ45 The Headache                    (Single;    script: QUESTLINES_ASH.md "AQ45")
// Build: npm run co:build -- anime-10
import { $, again, at, ch, ev, fight, flag, flagIs, good, has, hurtLead, isGood, item, leave, lose, money, out, room, type Json } from '../dsl.ts';
import { AQ, age, bondLine, duel, evolve, gain, later, line, moment, seen, stageOf, tagTypes, teach, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ39: 'aq39-nut-who-ate-everything',
  AQ40: 'aq40-aura-egg',
};

export const PLACEMENT: Record<string, Place> = {
  'aq39-nut-who-ate-everything': { shape: 'Single', earliest: 'A2', home: 'a + node', sits: 'optional', tags: ['city'], note: 'The first scene of MY20 The Hinge-Eater (the legends thread builds MY20 and MY21). Needs: the Bicycle for the bike version; otherwise it is the bag\'s buckles.' },
  'aq40-aura-egg': { shape: 'Companion', earliest: 'A5', home: 9, window: [6, 12], sits: 'optional', attaches: 'before', tags: [], level: 'A+1', beats: ['aq40-hatch-fear', 'aq40-hatch-helped', 'aq40-cart-again', 'aq40-after-a-loss', 'aq40-after-a-kindness', 'aq40-it-looks-back', 'aq40-cliff-path', 'aq40-glowing-paws', 'aq40-daylight'], note: 'An egg on a hunter\'s cart, any tag. The hunter A+1. Turning point two stages on (Step 13); it evolves later, in daylight, at Bond 4.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ39: [
    'This is the first scene of MY20 The Hinge-Eater; the legends thread builds MY20 and MY21 ("when eight are met, they stack") and reads this scene\'s flags meltan-followed and meltan-colony.',
    '"Let it" eats the Bicycle for good. The doc\'s bike shop that "will make another for a Bike Voucher" is the existing Bike Voucher item (it trades for a Bicycle at the next shop); the Night Market selling the bike back as a lump is not built (the markets thread owns the Night Market).',
    'Without a Bicycle the Meltan eats the bag\'s buckles, as the doc says; "Let it" then costs one random bag item that falls out (the doc names no cost for the buckles).',
    'Remembers "Meltan is the run\'s Mythical guest" reads flag guest-meltan, which the legends thread sets.',
  ],
  AQ40: [
    '"Buy it" uses no Honest Trade Card (that card is for Pokémon trades): the price, ₽1500, is printed on the button and needs the money in hand. The cart comes back the next stage, and again each time you buy.',
    'The small scenes read what the run has really been: "after a loss" is a party Pokémon fainting in the last six battles; "after a kindness" is the Good side of the Good/Evil meter; "walked past somebody" reads flag kind-walked-past, which the kindness-ledger events of another thread set.',
    'The turning point\'s short game is the aim-drag skill check; the screen does not switch to showing only what the Riolu feels.',
    'Remembers "the Riolu on the Ledge (SF52) was saved" reads the run\'s record of A Stranded Riolu (event ledge-riolu, pick "rescued"); families-a owns that event and must keep the record if it rebuilds it.',
  ],
};

/** Questline -> date of the line-by-line re-read against the doc. */
export const CHECKED: Record<string, string> = {};

const TOWN = tagTypes('city');
const RIOLU_DARK = '#1c2436';

export const EVENTS: Json[] = [
  // ---------------- AQ39. The Nut Who Ate Everything ----------------
  ev('aq39-nut-who-ate-everything', 'The Nut Who Ate Everything', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: TOWN, pokemon: 'meltan', tint: '#2a2e36', effect: 'glint',
    remembers: [{ id: 'bike', when: [has('bicycle')],
      intro: `A small sound, like somebody enjoying a boiled sweet. Your bicycle is leaning on a wall where you left it for one minute. It has no bell. Something is finishing the bell, and then it starts on the handlebars. It is the size of a fist: a blob of silver with a hex nut for a head and one eye looking out through the hole. It sees you. It waves, a small polite wave. It keeps eating.`,
      hide: [0, 1],
      addChoices: [
        ch('Let it.', out(`You sit down on the kerb. It eats the bike. All of it. The handlebars, the chain, both wheels, spoke by spoke, the little reflector last, like a mint after dinner. It takes an hour, and you watch the whole hour, and it is oddly restful: the clink, the pause, the clink. When it is done it is rounder, and it pats itself, and it looks at you as if you had cooked. Then it follows you. The bike is gone. A shop with a Bike Voucher could build you another.`, lose('bicycle'), flag('aq39-let-it'), room('aq39-it-follows'))),
        ch('Feed it something else.', out(`There is a scrap pile behind the Pokémon Center, and you carry it there under one arm. It does not struggle; it is still chewing. A kettle. A hinge. A bent spoon. It looks at the pile the way a child looks at a birthday, and then it is in heaven, up to its eye in a kettle. Your bicycle stands by the wall, one handlebar shorter, no bell. Nobody touches it again. When you leave, it follows you.`, flag('aq39-fed'), room('aq39-it-follows'))),
      ] }] },
    `A small sound, like somebody enjoying a boiled sweet. Your bag is on the ground where you set it down for one minute. It has no buckles. Something is finishing the last one, and then it starts on the zip. It is the size of a fist: a blob of silver with a hex nut for a head and one eye looking out through the hole. It sees you. It waves, a small polite wave. It keeps eating.`,
    [
      ch('Let it.', out(`You sit down beside the bag. It eats every buckle, the zip, the little metal feet on the bottom, and the ring your keys hang from. It takes an hour, and you watch the whole hour, and it is oddly restful: the clink, the pause, the clink. When it is done it is rounder, and your bag will not close. Something falls out of it on the next hill, and you do not notice until it is far behind. The Meltan follows you.`, lose(), flag('aq39-let-it'), room('aq39-it-follows'))),
      ch('Feed it something else.', out(`There is a scrap pile behind the Pokémon Center, and you carry it there under one arm. It does not struggle; it is still chewing. A kettle. A hinge. A bent spoon. It looks at the pile the way a child looks at a birthday, and then it is in heaven, up to its eye in a kettle. Your bag keeps what is left of its zip. When you leave, it follows you.`, flag('aq39-fed'), room('aq39-it-follows'))),
      ch('Chase it.', out(`It runs. It is quick, for a nut, and it leaves a trail of eaten things behind it like crumbs. A gate latch. A drain cover, so you have to jump the drain. A row of somebody's medals, pinned to a coat on a line, gone, the ribbons left fluttering. You follow the trail down the bank and into a culvert under the road, and there you stop.`, flag('meltan-colony'), room('aq39-colony'))),
    ]),
  ev('aq39-colony', 'The Colony', AQ, { room: true, pokemon: 'meltan', tint: '#22262c', effect: 'glint' },
    `In the culvert, forty Meltan sit in a ring round an old tram wheel, the way people sit round a campfire. Some are chewing. One is asleep with a bolt in its mouth. They all look up at once. Forty eyes, forty hex nuts, turning toward you with a sound like a drawer of cutlery. Nobody runs. Then one of them, very solemn, waddles out of the ring and holds out a washer to you, in both hands, as a gift.`,
    [
      ch('Take the washer.', out(`You take it. It is warm from being held, and it has been polished, round and round, by somebody with time. The one who gave it goes pink with pride, if silver can go pink. The ring shuffles to make room, and for a while you sit by the tram wheel with forty small metal Pokémon who think you are a guest.`, item('colony-washer'), flag('aq39-washer'), room('aq39-it-follows'))),
      ch('Has anybody got a spare bell?', out(`A discussion. Forty heads lean in; there is a great deal of clinking. At last a very small one is pushed forward from the back. It has a bell. It has not eaten it. It has been saving it, a long time, maybe for something exactly like this. It holds the bell for one more second. Then it gives it up, with dignity, and goes back to its place without looking round. The bell rings, small and clear, when you put it in your pocket.`, item('soothe-bell'), flag('aq39-bell'), room('aq39-it-follows'))),
      ch('You can\'t eat the *town.*', out(`Forty Meltan look at each other. You can see them thinking about the town: the railings, the lamp posts, the clock tower, all that lovely iron. It is a long think. Then, slowly, two of them carry the drain cover back up the bank and set it down. Half of it. It is a start. From now on, the ring agrees with much clinking, only what nobody wants. The one with the medals hands them back.`, flag('aq39-town-spared'), good(1), room('aq39-it-follows'))),
    ]),
  ev('aq39-it-follows', 'It Follows', AQ, { room: true, pokemon: 'meltan', tint: '#2a2e36', effect: 'none',
    remembers: [{ id: 'guest-jealous', when: [flagIs('guest-meltan')], notice: 'Your Mythical guest, the Meltan who has been riding with you, sees the new one and goes very still. It is jealous. It walks over and sits on the new one. For a moment they merge slightly, two nuts, one blob. Then they come apart with a small pop. They look at each other. It is settled.' }] },
    `You walk on. Behind you, every few steps, a small clink. You stop; it stops. You turn round, and there is the Meltan in the road, one eye in its nut, pretending to be a bolt somebody dropped. It is not a good pretence. It is a little rounder than when you met it, and it is very plainly following you.`,
    [
      ch('Let it come along.', out(`You crouch and hold out your hand. It climbs on, heavy as a fistful of coins, and settles in the crook of your arm. It looks up at you. It looks at the buckle on your belt, thoughtfully. Then it decides you are worth more whole, and goes to sleep.`, gain('meltan', { bond: 10 }), flag('meltan-followed'), moment('A Meltan ate something of yours, and then followed you home.', 55))),
      ch('Send it home.', leave(`You point back down the road. It looks where you are pointing for a long time. Then it goes, clinking, and at the corner it turns and waves the same small polite wave. You will miss the sound, a little.`)),
    ]),

  // ---------------- AQ40. The Aura Egg ----------------
  ev('aq40-aura-egg', 'The Aura Egg', AQ, { rarity: 'rare', minStage: stageOf('A5'), cast: ['trainer.pr/collector'], pokemon: 'riolu', tint: RIOLU_DARK, effect: 'none',
    remembers: [{ id: 'ledge-sibling', when: [{ kind: 'choice', id: 'ledge-riolu', pick: 'rescued', made: true }], notice: 'Somewhere behind you on the road is a ledge over a river, and a Riolu you pulled up off it. The egg rocks once, hard, toward that road. They have never met. It knows anyway: that one is its sibling.' }] },
    `A cart of cages at the roadside, most of them empty, all of them clean. On the driver's seat, wrapped in a horse blanket like something precious, is an egg, blue and black. The hunter is a pleasant man with a ledger and a pencil behind his ear. "Lev Culpepper. It can read thoughts before it hatches. Feels what's round it." He taps the blanket. "Put it by a frightened man, it comes out timid. By a cruel one, it comes out useful. Worth a fortune to the right buyer. I've a buyer." Your hand is near the seat. Something inside the egg turns toward your hand.`,
    [
      ch('Steal the egg.', out(`You do not decide; your hands do. Blanket and all, you have it, and you are running, and Mr. Culpepper is shouting something about his ledger behind you. You run until the road bends twice and your lungs burn. The egg is warm against your chest. It is moving. You are frightened, and you know it can feel that.`, flag('aq40-stolen'), later('aq40-hatch-fear', 1))),
      ch('Buy it. (₽1500)', out(`He names the price before you ask. It is high, and he says so: "It's a fortune, and that's what it is." You count it out. He counts it again, writes it in the ledger, and lifts the blanket into your arms, egg and all. As he turns the cart, the shell cracks. A blue face looks up at you, blinking, wet, already feeling for what you feel. Mr. Culpepper tips his hat. "Good doing business. There's always another." He means it. He clicks to his Rapidash, and the empty cages rattle away up the road to find one.`, $(-1500), gain('riolu', { bond: 10 }), flag('aq40-bought'), flag('aq40-met')), { requires: [money(1500)] }),
      ch('Fight the hunter.', fight(`"Pity," says Mr. Culpepper, and closes the ledger on his pencil to keep his place. His Houndoom comes round the cart. In the blanket on the seat, the egg rocks, and rocks again.`, duel('Hunter Culpepper', { cls: 'veteran', size: 2, team: ['houndoom', 'mightyena'], lv: 1, win: [flag('aura-helped'), room('aq40-hatch-helped')] }, { lose: [flag('aura-helped'), flag('aq40-hunter-won'), room('aq40-hatch-helped')] }))),
    ]),
  ev('aq40-hatch-fear', 'What It Reads First', AQ, { room: true, pokemon: 'riolu', tint: RIOLU_DARK, effect: 'shake' },
    `A node on, under a hedge, with your heart still going like a drum, the egg hatches in your arms. A small blue face. Red eyes, wide open. The first thing it reads is your fear: the running, the shouting, the dread that he is coming. It is frightened too, all at once, and shaking, and it does not know why. Then it reads what is under the fear. It goes quiet.`,
    [
      ch('Hold it until it stops shaking.', out(`You hold it. Neither of you says anything. Its paws are tiny and very hot, and they find the place over your heart and stay there, reading. Slowly your heart slows, and so does its shaking, as if you were teaching each other. Whatever it found under the fear, it has decided to keep.`, gain('riolu', { bond: 10 }), flag('aura-fear'), flag('aq40-met'))),
      ch('Tell it the truth: you were scared.', out(`"I was scared," you tell it. "I'm still a bit scared." It listens with its whole face. Then it puts both paws flat on your chest, as if checking your answer, and nods, very seriously. You were telling the truth. That seems to matter to it more than anything else in the world so far.`, gain('riolu', { bond: 15 }), flag('aura-fear'), flag('aq40-met'))),
    ]),
  ev('aq40-hatch-helped', 'Who Is Angry for It', AQ, { room: true, cast: ['trainer.pr/collector'], pokemon: 'riolu', tint: RIOLU_DARK, effect: 'glint' },
    `Halfway through the fight, a paw comes out of the blanket. Then a head. The egg has hatched in the middle of it all, and the Riolu does not know anything yet but one thing: who is angry on its behalf. It stands up on the cart seat, wobbling. It throws something small and blue at the hunter's Houndoom. The Houndoom yelps, more surprised than hurt. Mr. Culpepper looks at his ledger, then at the Riolu, and shuts the book. "Not that one, then," he says. "It's chosen."`,
    [
      ch('Catch it before it falls.', out(`It topples off the seat, all legs, and you catch it. It is warm and furious and very pleased with itself. It looks at you as if to say: did you see? The hunter drives away without a word. The Riolu watches him go, and then it watches you, to learn what you feel about that.`, gain('riolu', { bond: 15 }), flag('aq40-met'))),
      ch('Let it come to you.', out(`You hold out your hands and wait. It climbs down off the cart by itself, a step at a time, the way a child gets off a wall. It walks the last bit to you on its own feet. Then it leans on your shin and stays there. The hunter drives away, and it does not even look.`, gain('riolu', { bond: 10 }), flag('aq40-met'))),
    ]),
  // He hunts another: the cart again a stage later, another egg, the same price.
  ev('aq40-cart-again', 'The Cart Again', AQ, { callback: true, requires: [flagIs('aq40-bought'), age('aq40-bought', 1)], cast: ['trainer.pr/collector'], pokemon: 'riolu', tint: RIOLU_DARK, effect: 'none' },
    `A cart of cages at the roadside. You know it before you see the blanket. On the driver's seat, wrapped up warm, is another egg, blue and black. Mr. Lev Culpepper looks up from his ledger and smiles, honestly glad. "A repeat customer! Same price as before. It's only fair." He taps the shell. "This one's the quiet sort. I've a buyer, if you haven't."`,
    [
      ch('Steal the egg.', out(`This time he sees you coming and does not quite believe it. By the time he does, you are over the wall with the blanket in your arms. It hatches before you stop running: a blue face, red eyes, reading your fear, and then what is under it. It holds on to your collar with both paws and stays.`, gain('riolu', { bond: 10 }), flag('aura-fear'), flag('aq40-cart-ended'))),
      ch('Buy it. (₽1500)', out(`You pay. He writes it down. It hatches in your arms as he counts, and looks up at you as if you were the answer to a question. "There's always another," says Mr. Culpepper, cheerfully, and he means it. Somewhere up the road there is a nest he has not found yet. He will find it.`, $(-1500), gain('riolu', { bond: 10 }), again('aq40-cart-again')), { requires: [money(1500)] }),
      ch('Fight the hunter.', fight(`He sighs, and marks his place in the ledger. "I'd hoped we were past this." His Houndoom pads round the cart. The blanket on the seat begins to move.`, duel('Hunter Culpepper', { cls: 'veteran', size: 2, team: ['houndoom', 'mightyena'], lv: 1, win: [gain('riolu', { bond: 15 }), flag('aura-helped'), flag('aq40-cart-ended')] }, { lose: [gain('riolu', { bond: 10 }), flag('aura-helped'), flag('aq40-cart-ended')] }))),
    ]),
  // Small scenes: it feels what you feel. Each one comes from what the run has really been, once its Bond is high enough.
  ev('aq40-after-a-loss', 'Back to Back', AQ, { callback: true, requires: [flagIs('aq40-met'), line('riolu', 1), { kind: 'memberFainted', within: 6 }], pokemon: 'riolu', tint: RIOLU_DARK, effect: 'none' },
    `Camp, after a bad fight. Somebody went down today, and you are sitting with your back to a tree, not talking. The Riolu comes and sits against your back, spine to spine. It does not know why you are sad. It only knows that you are, and so it is sad too, as hard as it can, to help.`,
    [
      ch('Lean back against it.', out(`You lean. It leans. For a long time the two of you hold each other up like two halves of an arch. When you finally sigh, it sighs too, exactly the same length, and you laugh, and it is so startled by the laugh that it laughs as well.`, bondLine('riolu', 5), flag('aq40-scene-1'))),
      ch('Tell it what happened.', out(`You tell it, quietly, about the fight. It does not understand a word. It understands all of it. When you finish it goes and sits by whoever fell today, and puts a paw on them, and stays there until they are asleep.`, bondLine('riolu', 5), flag('aq40-scene-1'))),
    ]),
  ev('aq40-after-a-kindness', 'Unaccountably Pleased', AQ, { callback: true, requires: [flagIs('aq40-met'), line('riolu', 2), isGood(1)], pokemon: 'riolu', tint: '#2a3440', effect: 'sparkle' },
    `You did something kind today. It was nothing much; you have already half forgotten it. The Riolu has not. All evening it is unaccountably pleased. It hums. It brings you a stick for no reason. It keeps catching your eye across the fire and grinning, as if the two of you share a secret.`,
    [
      ch('Ask it what is so funny.', out(`It points at you. Then at its own chest. Then it spreads its paws wide, the whole size of the evening. You think it means: you felt like this, and so I do. It goes to sleep still smiling, one paw on your boot.`, bondLine('riolu', 5), flag('aq40-scene-2'))),
      ch('Grin back.', out(`You grin back. That is the right answer. It falls over with delight, gets up, and does a small, terrible dance round the fire. Your other Pokémon watch, puzzled. By the end, one of them is dancing too.`, bondLine('riolu', 5), fr2Party(), flag('aq40-scene-2'))),
    ]),
  ev('aq40-it-looks-back', 'It Looks Back', AQ, { callback: true, requires: [flagIs('aq40-met'), line('riolu', 3), flagIs('kind-walked-past')], pokemon: 'riolu', tint: RIOLU_DARK, effect: 'none' },
    `Back down the road, somebody asked you for help, and you walked past. The Riolu has been quiet ever since. Now, at the top of the hill, it stops. It looks back. It looks at you. It does not follow, for a moment. It is reading what you feel about it, and it is not sure yet what it found.`,
    [
      ch('Go back with it.', out(`You turn round. It runs ahead of you all the way down the hill. Whoever it was is gone, but there is still a gate to mend and a child's ball on a roof, and the two of you see to both. On the way up again it holds your hand. It does not let go until the top.`, good(1), bondLine('riolu', 10), flag('aq40-scene-3'), flag('aq40-went-back'))),
      ch('Wait for it to come.', out(`You do not go back. You wait at the top of the hill, and you let it look at you for as long as it needs. It takes a long time. Then it comes, slowly, and walks beside you, not touching. It has learned something about you today. You hope, one day, to be the other thing it reads.`, bondLine('riolu', 5), flag('aq40-scene-3'))),
    ]),
  // The turning point: two stages after the meeting, while it is in the party.
  ev('aq40-cliff-path', 'The Fog on the Cliff', AQ, { callback: true, minStage: stageOf('A7'), requires: [flagIs('aq40-met'), age('aq40-met', 2), line('riolu')], cast: [], pokemon: 'riolu', tint: '#2c3238', effect: 'fog' },
    `A cliff path, in fog so thick you can hear the sea but not see your own boots. Then a scrape, a cry, and your {lead} is gone: a slip, a ledge six feet down, out of sight. You call. Something calls back, hurt, from nowhere. You cannot see it. You cannot see anything. Beside you, the Riolu shuts its eyes. Its ears lift. It can.`,
    [
      ch('Follow what it feels.', out(`It takes your wrist in both paws. You shut your eyes too, because there is no point having them open. In the grey there is a warm shape, down and to the left, and the Riolu guides your hand toward it, a little more, a little more, there. Your fingers close on {lead}. You haul. It comes up over the edge, bruised and alive. The Riolu opens its eyes. It is looking at its own paws. They are glowing.`, bondLine('riolu', 10), flag('aq40-listened'), flag('aq40-turned'), room('aq40-glowing-paws')),
        { prompt: { id: 'aim-drag', needs: 'ok' }, fail: out(`You reach where you think it is, and it is not. The Riolu tugs your wrist, patient, and you try again, and miss again, and the third time you stop thinking and simply let it move your hand. There: warm. You haul {lead} up over the edge, scraped from the rock and alive. The Riolu opens its eyes. It is looking at its own paws. They are glowing.`, hurtLead(0.2), bondLine('riolu', 10), flag('aq40-listened'), flag('aq40-turned'), room('aq40-glowing-paws')) }),
    ]),
  ev('aq40-glowing-paws', 'Glowing Paws', AQ, { room: true, pokemon: 'riolu', tint: '#24304a', effect: 'sparkle' },
    `The fog is lifting off the cliff in rags. Your {lead} is sitting up, shaky, licking a graze. The Riolu stands a little apart, holding its paws out in front of it, turning them over. The glow is fading, slowly, like the warmth from a cup. It looks up at you. For the first time since it hatched, it is not reading you. It is asking.`,
    [
      ch('Hold its paws in yours.', out(`You take its paws. They are warm right through. "You found them," you tell it. "In all that. You found them." It hears every word, and under the words, how much you mean it. The glow comes back, just for a moment, between your hands. Whatever it is going to grow into, it knows now that it was listened to.`, teach('force-palm', { species: 'riolu' }), moment('In the fog on a cliff path, a Riolu found your lost Pokémon with its eyes shut, and its paws began to glow.', 70))),
    ]),
  // It evolves when it is ready: in daylight, at Bond 4, after it has been listened to.
  ev('aq40-daylight', 'When It Is Ready', AQ, { callback: true, requires: [seen('aq40-cliff-path'), flagIs('aq40-listened'), line('riolu', 4), at('morning', 'afternoon')], pokemon: 'lucario', tint: '#2c3c58', effect: 'sparkle' },
    `Morning, bright and clear. The Riolu has walked out ahead of you onto a rise, into the full sun, and stands there with its eyes shut and its paws open. You have been listening to it for a long while now: what it feels, what it notices, when it wants to stop. It has been waiting for this light. It looks back once, to be sure you are here. You are.`,
    [
      ch('Listen.', out(`You stand still and listen, the way it taught you. The glow starts in its paws and does not fade this time. It climbs its arms, its chest, its whole small body, and the small body is not small any more. Lucario stands on the rise in the sunlight, taller than you, and the first thing it does is turn round and read you, all of you, gently. Then it walks back down the hill and falls into step beside you, as it always has.`, evolve('riolu', 'lucario'), bondLine('riolu', 5), flag('aq40-lucario'), moment('In full daylight, when it was ready, your Riolu became a Lucario.', 75))),
    ]),
];

export const REMOVE: string[] = [];
