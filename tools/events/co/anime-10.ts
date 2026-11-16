// Anime questlines, module 10: AQ39-AQ45. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ39 The Nut Who Ate Everything      (Single;    script: QUESTLINES_DEEPENED_2.md "AQ39"; MY20's first scene)
//   AQ40 The Aura Egg                    (Companion; script: QUESTLINES_DEEPENED_2.md "AQ40")
//   AQ41 The Ghost Left Behind           (Companion; script: QUESTLINES_DEEPENED_2.md "AQ41")
//   AQ42 The Dragonite Who Stopped Delivering (Companion; script: QUESTLINES_ASH.md "AQ42")
//   AQ43 The Rock That Became Steel      (Companion; script: QUESTLINES_ASH.md "AQ43"; catalog id brock-cooking)
//   AQ44 Togepi Paradise                 (Door;      script: QUESTLINES_ASH.md "AQ44"; chain rows in src/data/catalogOverhaul/pseudo/anime-10.json)
//   AQ45 The Headache                    (Single;    script: QUESTLINES_ASH.md "AQ45")
// Build: npm run co:build -- anime-10
import { $, again, at, bondUp, ch, egg, ev, fight, flag, flagIs, good, has, heal, hurtLead, isGood, item, leave, lose, money, out, room, takeNode, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, evolve, gain, later, line, moment, monDuel, notYet, seen, stageOf, tagTypes, teach, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ39: 'aq39-nut-who-ate-everything',
  AQ40: 'aq40-aura-egg',
  AQ41: 'aq41-ghost-left-behind',
  AQ42: 'aq42-dragonite-stopped-delivering',
  AQ43: 'brock-cooking',
  AQ44: 'aq44-togepi-paradise',
  AQ45: 'aq45-the-headache',
};

export const PLACEMENT: Record<string, Place> = {
  'aq39-nut-who-ate-everything': { shape: 'Single', earliest: 'A2', home: 'a + node', sits: 'optional', tags: ['city'], note: 'The first scene of MY20 The Hinge-Eater (the legends thread builds MY20 and MY21). Needs: the Bicycle for the bike version; otherwise it is the bag\'s buckles.' },
  'aq40-aura-egg': { shape: 'Companion', earliest: 'A5', home: 9, window: [6, 12], sits: 'optional', attaches: 'before', tags: [], level: 'A+1', beats: ['aq40-hatch-fear', 'aq40-hatch-helped', 'aq40-cart-again', 'aq40-after-a-loss', 'aq40-after-a-kindness', 'aq40-it-looks-back', 'aq40-cliff-path', 'aq40-glowing-paws', 'aq40-daylight'], note: 'An egg on a hunter\'s cart, any tag. The hunter A+1. Turning point two stages on (Step 13); it evolves later, in daylight, at Bond 4.' },
  'aq41-ghost-left-behind': { shape: 'Companion', earliest: 'A4', home: 14, window: [11, 17], sits: 'optional', attaches: 'instead', tags: ['eerie'], beats: ['aq41-dented-chair', 'aq41-the-door', 'aq41-neighbour', 'aq41-the-home', 'aq41-homecoming', 'aq41-sundays', 'aq41-tent', 'aq41-coat', 'aq41-cup', 'aq41-sunday-tea'], note: 'The town: an empty house. Until towns exist: Step 14. "Find the trainer" takes two nodes. Turning point (the Sunday visit) two stages after it joins.' },
  'aq42-dragonite-stopped-delivering': { shape: 'Companion', earliest: 'A8', home: 12, window: [9, 15], sits: 'optional', tags: [], beats: ['aq42-top-letter', 'aq42-lighthouse', 'aq42-post-office-family', 'aq42-sorting', 'aq42-crossroads', 'aq42-folded-leaf', 'aq42-first-letter'], note: 'The town: a post office. Else Step 12, any tag. "Deliver the letters" takes three nodes. Turning point two stages after the Dratini joins.' },
  'brock-cooking': { shape: 'Companion', earliest: 'A6', home: 11, window: [8, 14], sits: 'optional', tags: ['cave'], beats: ['aq43-curled-up', 'aq43-old-mine', 'aq43-steel', 'aq43-came-out', 'aq43-brocks-table', 'aq43-pebbles', 'aq43-spark', 'aq43-in-front', 'aq43-fire-again'], note: 'Catalog id brock-cooking (Brock\'s Cooking) is this questline\'s first event. The Metal Coat quest is two nodes on. Turning point two stages after the Geodude joins.' },
  'aq44-togepi-paradise': { shape: 'Door', earliest: 'A5', home: 13, window: [11, 15], sits: 'side-branch', tags: [], beats: ['aq44-togepi-leads', 'aq44-paradise', 'aq44-let-go', 'aq44-another-guardian', 'aq44-it-chooses', 'aq44-the-egg'], note: 'A side-branch door, any tag. A Togepi in the party leads the way to it (second entry aq44-togepi-leads, its own chain row). Chain rows in src/data/catalogOverhaul/pseudo/anime-10.json.' },
  'aq45-the-headache': { shape: 'Single', earliest: 'A2', home: 8, window: [5, 11], sits: 'optional', tags: ['water'] },
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
  AQ41: [
    'Remembers "Haunter\'s Prank or Haunter\'s Mansion happened (Kanto)" reads Haunter\'s Mansion (event cs-kanto-route-haunter) or Haunter\'s Prank (event cs-kanto-lavender-tower-prank, AQ13\'s Kanto meeting), one variant each.',
    'The game has no days of the week: "It can come home Sundays" is the turning point two stages after it joins, a visit home where the cup has tea in it.',
  ],
  AQ42: [
    'Remembers "The Old Courier (Part 9) was done" reads flag old-courier-delivered; the greenneedle thread (gn.new.33 The Old Courier) must set it when that flight ends.',
    'The doc gives only the meeting; the Dratini\'s small scenes and its turning point (it carries its first letter and becomes a Dragonair) follow the Companion rule in QUESTLINES_PLACED.md.',
  ],
  AQ43: [
    'Remembers "the player beat a Fire Gym this region" reads flag fire-gym-beaten stamped for this region (flagThisRegion); the game does not yet record which type of Gym was beaten, so the Gym system must set that flag with a region stamp before this variant can show.',
    '"Brock\'s friendship" is flag aq43-brock-friend plus his meal (a full heal and Bond for the party); the game has no friendship meter for named people. His Onix becoming a Steelix is told in the scene: it is Brock\'s Pokémon, not yours.',
    'The doc gives only the meeting; the Geodude\'s small scenes and its turning point (it stands up to a Fire-type and becomes a Graveler) follow the Companion rule in QUESTLINES_PLACED.md.',
  ],
  AQ44: [
    'In Kanto the egg\'s Togepi from "Who Keeps the Egg" (event cs-kanto-route-egg, the Kanto canon thread) starts AQ44: any Togepi line in the party opens the second entry, aq44-togepi-leads, and when that event was seen and its egg hatched (flag kanto-route-egg-hatched) the scene names it as that egg\'s Togepi. A Togepi from elsewhere leads the way too.',
    'The doc files AQ44 as a Companion story with a farewell; here it is a side-branch Door, and the farewell is Misty\'s, inside it. Nothing is taken from the player.',
  ],
  AQ45: [
    '"Give it Ibuprofen" needs the bottle from The Psyduck Migration (gn.29, the greenneedle thread). The bottle is a keepsake, which is cut, so there is no Ibuprofen item: the choice reads gn.29\'s flag psyduck-joined (set when its Psyduck and bottle are given), and the Remembers "completed The Psyduck Migration" reads the same flag.',
    '"On its third hit taken, it uses a Psychic so strong the pool empties": Misty\'s Psyduck knows Psychic in the fight, but the game has no hit-count trigger, so it may use it at any time.',
  ],
};

/** Questline -> date of the line-by-line re-read against the doc. */
export const CHECKED: Record<string, string> = { AQ39: '2026-11-15', AQ40: '2026-11-15', AQ41: '2026-11-15', AQ42: '2026-11-15', AQ43: '2026-11-15', AQ44: '2026-11-15', AQ45: '2026-11-15' };

const TOWN = tagTypes('city');
const RIOLU_DARK = '#1c2436';
const EERIE = tagTypes('eerie');
const GHOST_DARK = '#1e1a2a';
const POST_DARK = '#22262e';
const CAVE = tagTypes('cave');
const CAVE_DARK = '#1c1a18';
const PARADISE = '#2a2438';
const SEA = tagTypes('water');
const POOL = '#1a2c40';

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
    `A cart of cages at the roadside, most of them empty, all of them clean. On the driver's seat, wrapped in a horse blanket like something precious, is an egg, blue and black. The hunter is a pleasant man with a ledger and a pencil behind his ear. "Lev Culpepper. It can read thoughts before it hatches. Feels what's round it." He taps the blanket. "Put it by a frightened man, it comes out timid. By a cruel one, it comes out useful. Worth a fortune to the right buyer. I've a buyer. Fifteen hundred, if it's you." Your hand is near the seat. Something inside the egg turns toward your hand.`,
    [
      ch('Steal the egg.', out(`You do not decide; your hands do. Blanket and all, you have it, and you are running, and Mr. Culpepper is shouting something about his ledger behind you. You run until the road bends twice and your lungs burn. The egg is warm against your chest. It is moving. You are frightened, and you know it can feel that.`, flag('aq40-stolen'), later('aq40-hatch-fear', 1))),
      ch('Buy it.', out(`He has already named the price, ₽1500. It is high, and he says so: "It's a fortune, and that's what it is." You count it out. He counts it again, writes it in the ledger, and lifts the blanket into your arms, egg and all. As he turns the cart, the shell cracks. A blue face looks up at you, blinking, wet, already feeling for what you feel. Mr. Culpepper tips his hat. "Good doing business. There's always another." He means it. He clicks to his Rapidash, and the empty cages rattle away up the road to find one.`, $(-1500), gain('riolu', { bond: 10 }), flag('aq40-bought'), flag('aq40-met')), { requires: [money(1500)] }),
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
    `A cart of cages at the roadside. You know it before you see the blanket. On the driver's seat, wrapped up warm, is another egg, blue and black. Mr. Lev Culpepper looks up from his ledger and smiles, honestly glad. "A repeat customer! Same price as before. It's only fair." He taps the shell. "This one's the quiet sort. I've a buyer, if you haven't. Fifteen hundred."`,
    [
      ch('Steal the egg.', out(`This time he sees you coming and does not quite believe it. By the time he does, you are over the wall with the blanket in your arms. It hatches before you stop running: a blue face, red eyes, reading your fear, and then what is under it. It holds on to your collar with both paws and stays.`, gain('riolu', { bond: 10 }), flag('aura-fear'), flag('aq40-cart-ended'))),
      ch('Buy it.', out(`You pay. He writes it down. It hatches in your arms as he counts, and looks up at you as if you were the answer to a question. "There's always another," says Mr. Culpepper, cheerfully, and he means it. Somewhere up the road there is a nest he has not found yet. He will find it.`, $(-1500), gain('riolu', { bond: 10 }), again('aq40-cart-again')), { requires: [money(1500)] }),
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
      ch('Grin back.', out(`You grin back. That is the right answer. It falls over with delight, gets up, and does a small, terrible dance round the fire. Your other Pokémon watch, puzzled. By the end, one of them is dancing too.`, bondLine('riolu', 5), bondUp(1, 'party'), flag('aq40-scene-2'))),
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

  // ---------------- AQ41. The Ghost Left Behind ----------------
  ev('aq41-ghost-left-behind', 'The Ghost Left Behind', AQ, { rarity: 'rare', minStage: stageOf('A4'), types: EERIE, pokemon: 'gengar', tint: GHOST_DARK, effect: 'flicker',
    remembers: [{ id: 'haunter-mansion', when: [seen('cs-kanto-route-haunter')], notice: 'Back up the road, a Haunter threw a party in a broken house and giggled at the door. This is what that Haunter might be in forty years, if somebody stays.' }, { id: 'haunter-prank', when: [seen('cs-kanto-lavender-tower-prank')], notice: 'In the tower, a Haunter played tricks on you until you laughed. This is what that Haunter might be in forty years, if somebody stays.' }] },
    `An empty house at the end of the lane. The door opens before you touch it. A hat stand bows as you pass. Somewhere a piano is playing one finger at a time, wrong. It has kept the house exactly as its trainer left it: a coat on the hook, brushed; a cup on the table, washed, and set out again every morning for nine years. Two chairs by the fire. One has a dent in it. The other has a shadow in it, with a grin. Then your shoelaces are tied together. A Gengar laughs, delighted, and then looks at the door, to see who else laughed. Nobody.`,
    [
      ch('Find the trainer.', out(`You untie your laces and go back out through the door that opens by itself. The Gengar watches from the window as you knock on the neighbours' doors, one after another. The asking takes the rest of the day and the next. It does not leave the window.`, takeNode(2), flag('aq41-searched'), room('aq41-neighbour'))),
      ch('Stay with it.', out(`You hop over to the fire, laces still tied, and sit down in the dented chair.`, room('aq41-dented-chair'))),
      ch('Play its tricks back.', out(`You crouch, very slowly, and tie its shoelaces. It has not got any. That is not the point; it is the principle. It looks down at its feet. It looks at you. Then it laughs so hard it sinks through the floorboards, and you can hear it laughing in the cellar, and then under the garden, and then it comes back up through the rug, still laughing, and does it again.`, flag('aq41-played'), room('aq41-the-door'))),
    ]),
  ev('aq41-dented-chair', 'Nobody Sits There', AQ, { room: true, pokemon: 'gengar', tint: GHOST_DARK, effect: 'flicker' },
    `It is shocked. Its grin goes out like a lamp. Nobody sits there. Nobody has sat there in nine years. You start to get up. Then something changes in its face, and it is pleased, so pleased it flickers. It fetches the cup from the table, carefully, with both hands. There is nothing in it. It holds up an invisible pot and pours, a long, careful pour, and hands the cup to you.`,
    [
      ch('Mime drinking.', out(`You drink. Nothing, very slowly, with your little finger out. It watches you with its whole face, the way someone watches a guest taste their cooking. When you set the cup down and sigh, it claps, soundlessly, and then it pours you another.`, flag('aq41-stayed'), flag('aq41-drank'), room('aq41-the-door'))),
      ch('Hold the cup and wait.', out(`You hold the cup in both hands, the way he must have, and you wait. It sits in its chair across the fire and waits with you. You are both waiting for the same thing. It is very good company.`, flag('aq41-stayed'), room('aq41-the-door'))),
    ]),
  ev('aq41-the-door', 'Who Else Laughed', AQ, { room: true, pokemon: 'gengar', tint: GHOST_DARK, effect: 'none' },
    `The fire is low. The Gengar is happier than it has been in a long while, you can tell, and still, every few minutes, it looks at the door. Nine years of looking at a door. The coat on the hook is brushed. The cup is washed. Everything is ready for someone.`,
    [
      ch('Find the trainer.', out(`"I'll find him," you tell it, and its grin flickers. You go knocking on the neighbours' doors, one after another. The asking takes the rest of the day and the next. It watches from the window the whole time.`, takeNode(2), flag('aq41-searched'), room('aq41-neighbour'))),
      ch('Leave it the house.', leave(`You let yourself out. Behind you the door closes by itself, gently. At the window the Gengar waves, and then turns back to the fire to wash a cup that nobody has used.`)),
    ]),
  ev('aq41-neighbour', 'Over the Fence', AQ, { room: true, cast: ['trainer.pr/pokefan_f'], tint: '#2a2a30', effect: 'none' },
    `Two nodes of knocking. At last, a neighbour, over a fence, with a trowel. "Old Mr. Entwistle? He didn't leave. He went out for bread and had a fall. That's nine years." She looks at the house. "He's at the home in the next town. He asks about the lodger. We thought he meant a person."`,
    [
      ch('Go to the home.', out(`You thank her. She calls after you, "Tell him the roses came back!" The next town is not far. You walk it fast.`, room('aq41-the-home'))),
      ch('Ask what he was like.', out(`"Kind. Daft. He'd laugh at anything. Used to come out with his laces tied together, swearing blind he never did it." She smiles at the house. "We'd hear him laughing through the wall. Him and somebody." She tells you the way to the home.`, flag('aq41-asked-neighbour'), room('aq41-the-home'))),
    ]),
  ev('aq41-the-home', 'The Lodger', AQ, { room: true, cast: ['trainer.pr/veteran_m'], tint: '#2a2c34', effect: 'none' },
    `The home. A bright room that smells of soap. A man by a window, very old, a blanket on his knees. Mr. Hyperion Entwistle. When you say where you have been, he grips the arms of his chair. "Is it... it's still there? I thought it'd have gone. To somebody." His voice cracks. "I told the nurses: there's a Gengar, it'll need its tea. They gave me a tablet."`,
    [
      ch('It\'s kept your coat brushed.', out(`He laughs, and the laugh turns into something else halfway. "That coat. I bought it for a wedding and never got married." He wipes his eyes with the back of his hand. "Brushed. Nine years. The daft thing." He is already pushing at the wheels of his chair. "Well? Somebody take me to see it."`, flag('aq41-told-coat'), room('aq41-homecoming'))),
      ch('Come and see it.', out(`He does not answer. He is already reaching for the wheels of his chair, and his hands are shaking, and a nurse is hurrying over to say he cannot, and he is saying that he can, and that he is going home.`, room('aq41-homecoming'))),
      ch('It thinks you left it.', out(`He shuts his eyes. For a long moment he does not say anything at all. Then, very quietly: "Then somebody take me home."`, flag('aq41-told-truth'), room('aq41-homecoming'))),
    ]),
  ev('aq41-homecoming', 'The Door Opens', AQ, { room: true, cast: ['trainer.pr/veteran_m'], pokemon: 'gengar', tint: GHOST_DARK, effect: 'none' },
    `The house. You push the chair up the path. The door opens before it is touched. The Gengar is in the hall. It has seen who is in the chair with wheels. It does not do a trick. It does not do anything at all. Then every light in the house comes on at once, and the piano plays something with both hands, and it is right.`,
    [
      ch('Wheel him in.', out(`You wheel him in, over the step, into the light. He holds out both hands. It comes into them like water finding the low place. Neither of them says anything. In the kitchen, a cup is being washed, and then another, and set out on the table, side by side.`, flag('aq41-home'), room('aq41-sundays'))),
      ch('Wait on the step.', out(`You stay outside on the step and let them have it. Through the window you watch him hold out both hands, and it comes into them. The piano keeps playing. After a while, a shadow with a grin opens the door for you, and bows, like the hat stand.`, flag('aq41-home'), room('aq41-sundays'))),
    ]),
  ev('aq41-sundays', 'It Can Come Home Sundays', AQ, { room: true, cast: ['trainer.pr/veteran_m'], pokemon: 'gengar', tint: '#30283a', effect: 'sparkle',
    remembers: [{ id: 'mimed', when: [flagIs('aq41-drank')], notice: 'On the table there are three cups now. One for him, one for it, and one for you, still empty: for the miming.' }] },
    `Late. The fire is lit properly for the first time in nine years. Mr. Entwistle sits in the dented chair, and the Gengar sits in the other, and they have been laughing for an hour about nothing. He looks over at you. "I can't keep up with it now. Look at me. It wants someone who'll laugh at the laces." He pats its head. "Would you? It can come home Sundays."`,
    [
      ch('Take it with you.', out(`"Yes," you say. The Gengar looks at him. He nods. It looks at you, and grins, and your laces are tied together before you have taken a step. Mr. Entwistle laughs until he cries. At the door it turns back to him, once, and he waves. "Sundays," he says. "I'll put the kettle on."`, gain('gengar', { bond: 20 }), flag('aq41-met'), moment('A Gengar kept a house ready for nine years, and you brought its trainer home.', 70))),
      ch('It should stay with him.', leave(`"It should stay with you," you say. He looks at it a long while, and it looks at him, and he says, "Aye. Maybe it should." When you leave, your laces are tied together. You can hear the two of them laughing all the way down the lane.`)),
    ]),
  // Small scenes: one each time its Bond rises, while it is in the party.
  ev('aq41-tent', 'Inside Out', AQ, { callback: true, requires: [flagIs('aq41-met'), line('gastly', 1), age('aq41-met', 1)], pokemon: 'gengar', tint: GHOST_DARK, effect: 'none' },
    `You wake up and something is wrong with the sky. It is canvas. The tent is inside out, with you in it, and all your things are on the outside, neatly folded. Somewhere nearby, something is trying very hard not to laugh.`,
    [
      ch('Laugh.', out(`You laugh. It bursts out of the ground beside you, helpless, holding its sides. That is what it wanted: not the trick, the laugh after. It lies on its back in the grass and grins at the sky for an hour.`, bondLine('gastly', 5), flag('aq41-scene-1'))),
      ch('Turn the tent the right way out.', out(`You take the tent down and put it back up, the right way. It watches, deflated. Then you tie its non-existent laces, solemnly, and it laughs so hard it falls through the earth.`, bondLine('gastly', 5), flag('aq41-scene-1'))),
    ]),
  ev('aq41-coat', 'Brushed', AQ, { callback: true, requires: [seen('aq41-tent'), line('gastly', 2)], pokemon: 'gengar', tint: GHOST_DARK, effect: 'none' },
    `Morning. Your coat is not where you left it. It is hanging on a branch, brushed, every crease smoothed, the collar turned down just so. The Gengar is beside it, admiring its work. It has done this every morning for nine years for somebody. Now it is doing it for you.`,
    [
      ch('Put it on.', out(`You put it on. It walks round you twice, picks off one last thread, and nods. Then it unties one of your laces, so that you will not get too comfortable.`, bondLine('gastly', 5), flag('aq41-scene-2'))),
      ch('Thank it.', out(`"Thank you," you tell it. It does not know what to do with that. It grins, and flickers, and vanishes into your shadow, and stays there all day, very quiet and very pleased.`, bondLine('gastly', 5), flag('aq41-scene-2'))),
    ]),
  ev('aq41-cup', 'A Cup for You', AQ, { callback: true, requires: [seen('aq41-coat'), line('gastly', 3)], pokemon: 'gengar', tint: '#30283a', effect: 'none' },
    `It sets out a cup. For you. On a flat stone beside the fire, washed in the stream, handle turned toward your hand. It did this for nine years for somebody who did not come. Now it does it for you, and you are here.`,
    [
      ch('Drink from it.', out(`There is water in it this time, cold from the stream. You drink it all. It watches you set the cup down, and something in its grin goes soft round the edges. Tomorrow there is a cup again. And the morning after. Every morning.`, bondLine('gastly', 5), flag('aq41-scene-3'))),
      ch('Pour one for it.', out(`You fill a second cup and set it on the other side of the fire. It stares at the cup for a long time. Nobody has ever set one out for it. It does not drink; it cannot quite. It holds the cup all evening instead.`, bondLine('gastly', 5), flag('aq41-scene-3'))),
    ]),
  // The turning point: two stages after it joins, while it is in the party. It goes home on a Sunday.
  ev('aq41-sunday-tea', 'Sunday', AQ, { callback: true, minStage: stageOf('A6'), requires: [flagIs('aq41-met'), age('aq41-met', 2), line('gastly')], types: EERIE, cast: ['trainer.pr/veteran_m'], pokemon: 'gengar', tint: '#30283a', effect: 'sparkle' },
    `It wakes you before dawn, which it never does, and points down the road. It is Sunday. You do not know how it knows; it knows. The house at the end of the lane is lit. The door opens before you touch it. In the kitchen there are two cups set out on the table, the way there always were, and today, for the first time, there is tea in them.`,
    [
      ch('Go in with it.', out(`Mr. Entwistle is home for the day, in the dented chair, with the kettle on. "There it is!" It ties his laces before he can stand up, and he laughs until he has to hold the table. You drink your tea. It drinks nothing and is perfectly happy. When you leave, it comes with you, and waves to him from the gate, and he waves back. "Next Sunday."`, bondLine('gastly', 10), flag('aq41-sunday'), moment('On a Sunday, the cup on the table had tea in it, and the Gengar went home for the day.', 70), flag('reunion-guest-gengar'))),
      ch('Let it go in alone.', out(`You wait at the gate. Through the window you can see two cups, and an old man laughing, and a shadow with a grin. It stays all morning. At noon it comes out, and takes your hand, and walks you back down the lane, and it does not look back at the door, not once. It knows the door will open.`, bondLine('gastly', 10), flag('aq41-sunday'), flag('reunion-guest-gengar'))),
    ]),

  // ---------------- AQ42. The Dragonite Who Stopped Delivering ----------------
  ev('aq42-dragonite-stopped-delivering', 'The Dragonite Who Stopped Delivering', AQ, { rarity: 'rare', minStage: stageOf('A8'), cast: ['trainer.pr/clerk_m'], pokemon: 'dragonite', tint: POST_DARK, effect: 'none',
    remembers: [{ id: 'old-courier', when: [flagIs('old-courier-delivered')], notice: 'This one is young, younger than the old courier you flew with over the storm wall. It heard about that last flight. Everyone on the routes did. It wears its mailbag the same way, strap across the chest, and it looks at you as if it knows who you are.' }] },
    `A small post office, letters pinned to every wall. In the middle of the sorting room sits a Dragonite, wings folded, on a pile of undelivered letters as high as a haystack. It is not asleep. It is guarding them. The postmaster, Mr. Aldous Penhallow, wrings his cap. "It stopped a week ago. Won't say why. Won't let me near the pile." He sighs. "Twenty years, never missed a round." On the very top of the pile is one letter, held down under the Dragonite's claw. It is addressed to a lighthouse.`,
    [
      ch('Deliver the letters.', out(`You hold out your arms. The Dragonite looks at you for a long time, then lifts its claw and lets you take them all, except the top one. That one it keeps. For three nodes you are the post: a birthday card to a farm, a bill nobody wanted, a love letter you carry very carefully. The Dragonite flies over you the whole way, watching you do its round. At the end there is only the lighthouse left, and it lands, and gives you the last letter.`, takeNode(3), good(1), flag('aq42-delivered'), later('aq42-lighthouse', 3))),
      ch('Ask why it stopped.', out(`You sit down in front of the pile and ask. It does not say. It looks at the letter under its claw, and then at you, and then it gets up, scattering envelopes, picks you up as easily as a parcel, and walks out of the door. The postmaster shouts. Then you are in the air, over the town, over the hills, toward the sea.`, flag('aq42-asked'), room('aq42-lighthouse'))),
      ch('Read the top letter.', out(`You reach for the top letter. The Dragonite growls, low. You stop. It thinks about it, and then it lifts its claw, very slowly, and lets you take it. The envelope is soft from being held. It has been opened, and closed again, many times.`, flag('aq42-read'), room('aq42-top-letter'))),
    ]),
  ev('aq42-top-letter', 'No Address but the Lighthouse', AQ, { room: true, pokemon: 'dragonite', tint: POST_DARK, effect: 'none' },
    `It is from the keeper's daughter. "Dad. I know I said I wouldn't write. I'm writing. I'm sorry about the boat, and the shouting, and the six years. I'm coming home in the spring if you'll have me." There is no return address. There is no other address at all: only the name of the lighthouse, in big careful capitals, as if she was not sure it would find him. The Dragonite watches you read every word.`,
    [
      ch('Deliver the letters.', out(`You fold the letter back into its envelope and hold out your arms for the rest. It lets you take them. For three nodes you are the post, and the Dragonite flies over you, watching, holding the daughter's letter in its claw. At the end there is only the lighthouse left.`, takeNode(3), good(1), flag('aq42-delivered'), later('aq42-lighthouse', 3))),
      ch('Ask why it stopped.', out(`"Why did you stop?" you ask it, holding the letter. It takes the envelope back from you, very gently, tucks it into its bag, and picks you up. Then you are in the air, over the hills, toward the sea and a white tower on a rock.`, flag('aq42-asked'), room('aq42-lighthouse'))),
    ]),
  ev('aq42-lighthouse', 'The Lighthouse', AQ, { room: true, pokemon: 'dragonite', tint: '#1c2a36', effect: 'rain' },
    `The lighthouse stands on its rock with the sea all round it, and its lamp is dark. Beside the door, under a slate, is a grave. The name on it is the keeper's. The date is three weeks ago. Every week for twenty years the Dragonite landed here with his post, and he came out, and he talked to it while he read. Then one week he did not come out. It kept coming for two more weeks. Then the letter came, the one with no address but this, and it did not know where else to take it. So it stopped.`,
    [
      ch('Leave the letter on the grave.', out(`The Dragonite takes the letter from its bag and lays it on the slate, square, the way it would push one under a door. It puts a stone on it so the wind will not take it. It stands there a long while in the rain. Then something in its shoulders comes loose, and it turns, and it is ready to go back to work.`, flag('aq42-laid'), room('aq42-post-office-family'))),
      ch('Write her a reply.', out(`On the back of a delivery slip you write to her: where he is, and when, and that the post kept coming every week, and who brought it. The postmark on her letter gives a town, at least. The Dragonite reads it over your shoulder. Then it takes the slip, very carefully, and puts it in its bag, at the front, where the urgent ones go.`, flag('aq42-reply'), room('aq42-post-office-family'))),
    ]),
  ev('aq42-post-office-family', 'The Post Office\'s Family', AQ, { room: true, cast: ['trainer.pr/clerk_m'], pokemon: 'dratini', tint: POST_DARK, effect: 'sparkle' },
    `Back at the post office the pile is gone; the Dragonite is out on its round again, and Mr. Penhallow has cried twice already and denies it both times. "You'll not leave with nothing." In a basket behind the counter, among the parcel string, are three small Dratini: the post office's family, the Dragonite's own. One of them has been watching you since you came in. "That one keeps trying to climb into the mailbags. It wants to go somewhere."`,
    [
      ch('Take the Dratini.', out(`It is out of the basket before you reach it, wound twice round your arm, looking at the door. Mr. Penhallow laughs. "There. It's chosen its round." As you leave, the Dragonite passes low over the roof and dips one wing. The little Dratini watches it all the way out of sight.`, gain('dratini', { bond: 10 }), flag('aq42-met'), moment('A Dragonite stopped delivering because one letter had nowhere to go. You helped it find somewhere.', 65))),
      ch('Let it grow up on the route.', leave(`"It should learn the round here," you say, "from the best." Mr. Penhallow nods, and the little Dratini looks at you, disappointed and forgiving at once. When you go, the Dragonite is on the roof, and the Dratini has climbed up to sit beside it, both of them watching the road.`)),
    ]),
  // Small scenes: one each time its Bond rises, while it is in the party.
  ev('aq42-sorting', 'Sorting', AQ, { callback: true, requires: [flagIs('aq42-met'), line('dratini', 1), age('aq42-met', 1)], pokemon: 'dratini', tint: POST_DARK, effect: 'none' },
    `You come back to camp and your bag is empty. Everything in it is laid out on the ground in rows, by size, edges lined up: berries, Balls, a map, a sock. The Dratini lies at the end of the row, very proud, the way the post office lays out the morning's letters.`,
    [
      ch('Pack it back the same way.', out(`You pack it back in its rows, carefully, to keep the system. It watches every item go in and nods at each one. From now on your bag is the tidiest bag on the road, and you never lose a thing.`, bondLine('dratini', 5), flag('aq42-scene-1'))),
      ch('Ask it to find the map.', out(`It finds the map in one second, and brings it to you in its mouth, and then brings you the sock as well, in case. It is very good at this. It is born to it.`, bondLine('dratini', 5), flag('aq42-scene-1'))),
    ]),
  ev('aq42-crossroads', 'Every Crossroads', AQ, { callback: true, requires: [seen('aq42-sorting'), line('dratini', 2)], pokemon: 'dratini', tint: POST_DARK, effect: 'none' },
    `At every crossroads now, the Dratini stops and looks round. You did not understand it at first. Then you did: it is looking for a postbox. When there is one, it goes and sits under it for a moment, the way someone touches a doorframe when they come home.`,
    [
      ch('Wait for it.', out(`You wait at every crossroads. It never takes long. One evening there is a red postbox in the middle of nowhere, and it is so pleased it goes round the post three times.`, bondLine('dratini', 5), flag('aq42-scene-2'))),
      ch('Post a card home.', out(`At the next postbox you write a card, to anyone, and let the Dratini push it into the slot with its nose. It listens to it fall. It looks at you as if you have given it a present.`, bondLine('dratini', 5), flag('aq42-scene-2'))),
    ]),
  ev('aq42-folded-leaf', 'A Folded Leaf', AQ, { callback: true, requires: [seen('aq42-crossroads'), line('dratini', 3)], pokemon: 'dratini', tint: '#1c3036', effect: 'sparkle' },
    `In the morning there is a leaf on your pillow. It has been folded, twice, very carefully, into the shape of an envelope. The Dratini is coiled at the foot of your bedroll, pretending to be asleep, watching you through one eye to see if you open it.`,
    [
      ch('Open it.', out(`You open it. There is nothing inside but a small round pebble, the smoothest pebble in the world. You say thank you to the leaf, out loud. The Dratini stops pretending to be asleep and puts its chin on your knee.`, bondLine('dratini', 5), flag('aq42-scene-3'))),
      ch('Keep it sealed.', out(`You put it in your pocket, unopened, the way you would keep a letter you were saving. The Dratini watches it go in. It seems to think that is the best answer of all.`, bondLine('dratini', 5), flag('aq42-scene-3'))),
    ]),
  // The turning point: two stages after it joins. The Dragonite brings a letter, and the Dratini carries the answer.
  ev('aq42-first-letter', 'Its First Letter', AQ, { callback: true, minStage: stageOf('A10'), requires: [flagIs('aq42-met'), age('aq42-met', 2), line('dratini')], pokemon: 'dragonite', tint: '#1c2a36', effect: 'sparkle',
    remembers: [{ id: 'reply', when: [flagIs('aq42-reply')], notice: 'The letter is from the keeper\'s daughter. She got your reply. She is at the lighthouse now; she has lit the lamp again, and she is staying. "Tell the courier," she writes, "the post still comes here."' }] },
    `A shadow goes over the road, circles, and lands: the Dragonite from the post office, mailbag on, back on its round. It has a letter for you. Your name, and under it, just: "on the road." It found you anyway. The Dratini goes very still, staring at the bag. While you read, the Dragonite looks at the little one, and then at you, and holds out the bag.`,
    [
      ch('Let it carry your answer.', out(`You write an answer and hold it out. The Dratini takes it in its mouth, gently, as if it were an egg. Then it is glowing, from the nose back, and it is longer, and there are small white wings at its head, and a Dragonair rises off the road with the letter held high. It flies one slow circle with the Dragonite, side by side. Then it comes back to you, letter delivered into the old courier's bag. Its first round.`, evolve('dratini', 'dragonair'), bondLine('dratini', 10), flag('aq42-turned'), moment('Your Dratini carried its first letter, and became a Dragonair on the way.', 70))),
      ch('Keep the letter.', out(`You fold the letter and keep it. The Dragonite nods, as if that is allowed, and lifts off for the next town. The Dratini watches it go until it is a dot. It is not ready yet. That is all right. It sleeps that night curled round the letter in your bag.`, bondLine('dratini', 5), flag('aq42-turned'))),
    ]),

  // ---------------- AQ43. The Rock That Became Steel (catalog id brock-cooking) ----------------
  ev('brock-cooking', 'The Rock That Became Steel', AQ, { rarity: 'uncommon', minStage: stageOf('A6'), types: CAVE, cast: ['boss.brock'], pokemon: 'onix', tint: CAVE_DARK, effect: 'none',
    remembers: [{ id: 'same-leader', when: [{ kind: 'flag', key: 'fire-gym-beaten', atLeast: 1, atMost: 99, regionsAgoMost: 0 }], notice: 'Brock names the Leader. You know the name: you beat that same Leader this region, Fire-type and all. "Then you know," he says. "Then you know what it was up against."' }] },
    `A young man sits on a rock outside a cave mouth, stirring a pot over a small fire. The smell is wonderful. He has not eaten any of it. "My Onix," Brock says, nodding at the dark. "It lost to a Fire-type. Badly. It hasn't come out since." He stirs. "It's never lost to Fire like that. It doesn't know what to do." He lifts the lid, and lets it fall. "It won't eat. I made its favourite."`,
    [
      ch('Go in.', out(`You take a bowl of the stew and go in, slowly, into the cool and the dark. Far back, where the cave narrows, there is a great grey shape, curled up as small as a thing that size can curl.`, room('aq43-curled-up'))),
      ch('Find it a Metal Coat.', out(`"A Metal Coat," Brock says, sitting up. "When it holds one... I've thought about it. There's an old mine two valleys on. They used to find them there." He looks at the cave. "I can't leave it. Would you?" You set off. Two nodes on, the hills open and there is the mine.`, flag('aq43-coat-quest'), later('aq43-old-mine', 2))),
      ch('Battle it out of there.', fight(`You step into the cave mouth and call a challenge into the dark. Brock half rises, and then sits down again, and lets you. Something enormous uncoils. The ground shakes. It comes out angry.`, monDuel("Brock's Onix", 'onix', 0, { win: [flag('aq43-battled'), room('aq43-came-out')], lose: [flag('aq43-battled'), flag('aq43-onix-won'), room('aq43-came-out')] }))),
      ch('Give it your Metal Coat.', out(`You take the Metal Coat out of your bag. Brock stares at it, and then at you, and then he takes it in both hands like a medal. "You'd give it this? For mine?" He goes into the cave with it. You hear him talking, low, for a long time.`, lose('metal-coat'), flag('aq43-coat-given'), room('aq43-steel')), { requires: [has('metal-coat')] }),
    ]),
  ev('aq43-curled-up', 'Curled Up', AQ, { room: true, pokemon: 'onix', tint: '#141418', effect: 'none' },
    `The Onix is curled up at the back of the cave with its head under its own tail, the way a child hides under a blanket. The scorch marks are still on its rocks. It hears you. It does not look up. You set the bowl of stew down beside its head.`,
    [
      ch('Sit with it.', out(`You sit down against its side. It is cold, as stone is cold. You do not say anything for a long time. After a while its breathing changes, and its head comes out from under its tail, and it looks at the bowl. It eats, slowly. Then it puts its great chin down beside you and leaves it there. When you come out together, Brock has to turn away for a moment.`, flag('aq43-sat-with'), room('aq43-brocks-table'))),
      ch('Tell it about your own worst loss.', out(`You tell it about the worst fight you ever lost: how it felt, how long it took to want to battle again. It listens. Rock is a good listener. When you finish it uncurls, very slowly, and eats the stew, every bit, and follows you out into the light, ducking its head at the cave mouth.`, flag('aq43-sat-with'), room('aq43-brocks-table'))),
    ]),
  ev('aq43-old-mine', 'The Old Mine', AQ, { room: true, pokemon: 'magneton', tint: '#1e2026', effect: 'glint' },
    `The old mine is half fallen in. Rails run into the dark and stop. Deep inside, something hums: a Magneton has made its nest in the seam where the Metal Coats used to be found, and it is sitting on one, polishing it with static. It is not going to hand it over for the asking.`,
    [
      ch('Fight the Magneton for it.', fight(`The Magneton turns all three eyes on you, and the hum climbs to a whine.`, beast({ species: ['magneton'], win: [flag('aq43-coat-won'), room('aq43-steel')] }, { lose: [flag('aq43-coat-won'), flag('aq43-mine-scraped'), room('aq43-steel')] }))),
      ch('Dig for another.', out(`You leave the Magneton to its treasure and dig in the old spoil heaps outside. It takes all day, and your hands are raw, and in the last light you find one: a Metal Coat, black with age, still whole. You carry it back to the cave.`, takeNode(1), flag('aq43-coat-dug'), room('aq43-steel'))),
    ]),
  ev('aq43-steel', 'The Rock That Became Steel', AQ, { room: true, cast: ['boss.brock'], pokemon: 'steelix', tint: '#2a2e36', effect: 'glint' },
    `Brock takes the Metal Coat into the cave. You wait at the mouth. For a while there is only his voice, low and steady. Then a light, coming up the tunnel like dawn coming up a valley: not red, not fire, but silver. The ground shakes. Out of the cave comes something long and shining and new, and it does not duck its head at the cave mouth. It does not need to. It is steel.`,
    [
      ch('Watch it in the sun.', out(`The Steelix lifts its head into the sunlight and the light runs off it like water. It looks at its own body as if it had never seen it. Brock is standing under it, laughing and wiping his face. "Fire's not going to scorch that," he says. The Steelix bends down and very gently knocks him over.`, flag('aq43-steelix'), room('aq43-brocks-table'))),
    ]),
  ev('aq43-came-out', 'Angry, and Better', AQ, { room: true, cast: ['boss.brock'], pokemon: 'onix', tint: CAVE_DARK, effect: 'shake' },
    `The Onix is out of the cave. It is furious, steaming, its rocks grinding, and it is better: whatever was curled up in the dark has been shaken loose by the fight. It roars at the sky. It roars at you. Then it looks round for Brock, and sees the pot, and stops.`,
    [
      ch('Let Brock feed it.', out(`Brock holds out the bowl. The Onix glares at it. Then it eats the whole pot, pot and all very nearly, and lies down in the sun with a groan of pure relief. "Thank you," Brock says to you, and means more than the fight. "It needed someone to make it angry instead of sad."`, flag('aq43-angry-better'), room('aq43-brocks-table'))),
    ]),
  ev('aq43-brocks-table', 'Brock\'s Table', AQ, { room: true, cast: ['boss.brock'], pokemon: 'geodude', tint: '#2a2420', effect: 'hearts' },
    `That evening Brock cooks for everyone: you, your Pokémon, his Onix, and a crowd of his family's Pokémon who seem to have arrived from nowhere at the smell. It is the best meal you have had on the road. Afterwards he sits back and looks at you the way people look at a friend they did not have this morning. "My family keeps Geodude," he says. "One of them has been following you around the fire all night."`,
    [
      ch('Take the Geodude.', out(`The little Geodude is already sitting on your boot. Brock laughs. "It likes you. Feed it well." He presses a pot of leftovers into your hands too. "And yourself." When you leave, Brock and his Onix wave from the cave mouth, both of them, one much taller.`, heal(1), bondUp(1, 'party'), flag('aq43-brock-friend'), gain('geodude', { bond: 10 }), flag('aq43-met'), moment('Brock cooked for you outside a cave, and you made a friend.', 60))),
      ch('Just the meal, thanks.', out(`"Your loss," Brock grins, and fills your bowl again. The Geodude sulks, then forgives you, and sits on your boot for the rest of the evening anyway. When you leave, Brock and his Onix wave from the cave mouth.`, heal(1), bondUp(1, 'party'), flag('aq43-brock-friend'))),
    ]),
  // Small scenes: the Geodude, once its Bond rises, while it is in the party.
  ev('aq43-pebbles', 'Pebbles', AQ, { callback: true, requires: [flagIs('aq43-met'), line('geodude', 1), age('aq43-met', 1)], pokemon: 'geodude', tint: '#2a2420', effect: 'none' },
    `Brock packed you food for the road. At the bottom of the bag, wrapped in a cloth, there is a handful of small round pebbles. You did not understand until the Geodude found them. It eats them one at a time, slowly, eyes closed, the way you would eat sweets from home.`,
    [
      ch('Save one for later.', out(`You keep one back in your pocket. Three days later, on a bad evening, you give it the last pebble. It holds it a long time before it eats it.`, bondLine('geodude', 5), flag('aq43-scene-1'))),
      ch('Find it more.', out(`You spend the evening at the stream finding the roundest pebbles you can. It inspects every one, rejects most of them, and is plainly delighted that you tried.`, bondLine('geodude', 5), flag('aq43-scene-1'))),
    ]),
  ev('aq43-spark', 'A Spark from the Fire', AQ, { callback: true, requires: [seen('aq43-pebbles'), line('geodude', 2)], pokemon: 'geodude', tint: '#3a2418', effect: 'fire' },
    `A spark jumps out of the campfire and lands on the Geodude's arm. It flinches back so hard it rolls over. It has heard about Brock's Onix. It looks at the fire for a long time. Then it shuffles forward and sits right beside it, close, closer than it likes, glaring at the flames.`,
    [
      ch('Sit beside it.', out(`You sit down next to it, close to the fire too. It does not look at you. It does lean, a little. You both sit there until the fire burns down, and it never once moves back.`, bondLine('geodude', 5), flag('aq43-scene-2'))),
      ch('Move it back.', out(`You lift it back to a sensible distance. It rolls straight forward again, stubborn as stone. You let it. It is practising.`, bondLine('geodude', 5), flag('aq43-scene-2'))),
    ]),
  ev('aq43-in-front', 'In Front', AQ, { callback: true, requires: [seen('aq43-spark'), line('geodude', 3)], pokemon: 'geodude', tint: '#2a2420', effect: 'none' },
    `A wild Fire-type flares up out of the grass in front of you, more startled than dangerous. Before anyone else can move, the Geodude has rolled in front of you, arms out, rocks set, between you and the flame.`,
    [
      ch('Let it stand there.', out(`You let it stand. The wild Pokémon looks at the small grey rock planted in the road, decides it is not worth it, and goes. The Geodude stays exactly where it is for a full minute after, just to be sure. Then it looks back at you, enormously pleased.`, bondLine('geodude', 5), flag('aq43-scene-3'))),
      ch('Pick it up.', out(`You scoop it up and step back, and the wild Pokémon goes. The Geodude grumbles all the way up the road. It wanted to stand there. Next time, you think, you will let it.`, bondLine('geodude', 5), flag('aq43-scene-3'))),
    ]),
  // The turning point: two stages after it joins. The Fire-type again.
  ev('aq43-fire-again', 'Against the Fire', AQ, { callback: true, minStage: stageOf('A8'), requires: [flagIs('aq43-met'), age('aq43-met', 2), line('geodude')], types: CAVE, cast: ['trainer.firebreather', 'boss.brock'], pokemon: 'geodude', tint: '#3a2418', effect: 'fire',
    remembers: [{ id: 'steelix', when: [flagIs('aq43-steelix')], notice: 'Brock has come to watch, and behind him, shining in the firelight, is his Steelix. It does not flinch at the flames at all. The Geodude looks up at it for a long moment.' }] },
    `A fire-breather on the road, a big man with a bigger grin, and his Fire-types round him like a forge. He is the one who scorched Brock's Onix, or one just like him. "Rock-types!" he laughs. "I love Rock-types. They're so easy." Your Geodude rolls forward out of your bag without being asked, and plants itself in front of you, and does not move back.`,
    [
      ch('Fight beside it.', fight(`Brock's voice, from somewhere behind: "Go on, then. Show him."`, duel('Fire-breather Hale', { cls: 'firebreather', size: 2, types: ['fire'], lv: 1, win: [evolve('geodude', 'graveler'), bondLine('geodude', 10), flag('aq43-turned'), moment('Your Geodude stood in front of the fire and did not move back, and became a Graveler.', 70)] }, { lose: [bondLine('geodude', 5), flag('aq43-turned'), flag('aq43-fire-lost')] }))),
      ch('Let it face him alone.', out(`You step back. The Geodude stands alone in the road, and the fire comes at it, and it does not move. When the smoke clears it is still there, scorched and furious and whole, and it is bigger: Graveler, four arms set, glaring. The fire-breather stops grinning. "Huh," he says, and goes. Brock is clapping slowly from the hill.`, evolve('geodude', 'graveler'), bondLine('geodude', 10), hurtLead(0.1), flag('aq43-turned'), flag('aq43-alone'), moment('Your Geodude stood in front of the fire and did not move back, and became a Graveler.', 70))),
    ]),

  // ---------------- AQ44. Togepi Paradise (a side-branch Door) ----------------
  ev('aq44-togepi-paradise', 'Togepi Paradise', AQ, { rarity: 'rare', minStage: stageOf('A5'), requires: [notYet('aq44-found')], cast: ['boss.misty'], pokemon: 'togetic', tint: PARADISE, effect: 'sparkle' },
    `Off the path, behind a hedge so thick it looks painted, there is a gap no wider than a shoulder. Through it comes a sound like a hundred small bells, and then, sharp over the top of it, an engine. Someone is standing in the gap, keeping watch: a girl with orange hair, her fists clenched, and on her shoulder a white Togetic with its wings half open. "Don't just stand there," says Misty. "If you're coming, come. They need everyone."`,
    [
      ch('Go through the gap.', out(`You turn sideways and squeeze through. The hedge closes behind you like a door.`, flag('aq44-found'), room('aq44-paradise'))),
      ch('Leave the gap be.', leave(`You step back. Misty looks at you for one second, and then she is gone through the hedge. The bells go on, and so does the engine. You walk on, and you do not hear which one stops first.`)),
    ]),
  ev('aq44-togepi-leads', 'Togepi Paradise', AQ, { callback: true, minStage: stageOf('A5'), requires: [notYet('aq44-found'), line('togepi')], cast: ['boss.misty'], pokemon: 'togepi', tint: PARADISE, effect: 'sparkle',
    remembers: [{ id: 'kanto-egg', when: [seen('cs-kanto-route-egg'), flagIs('kanto-route-egg-hatched')], notice: 'It is the Togepi from the egg on the Kanto road, the one somebody had to decide who kept. It has never been here. It knows the way anyway.' }] },
    `Your Togepi will not walk on. It stands in the road waving its little arms, then sets off sideways, off the path, toward a hedge so thick it looks painted. There is a gap in it no wider than a shoulder, and through the gap comes a sound like a hundred small bells, and, over the top of it, an engine. A girl with orange hair is standing in the gap with a Togetic on her shoulder. She looks at your Togepi and goes very still. "It found its own way here," Misty says. "They always can. Come on."`,
    [
      ch('Follow it through.', out(`Your Togepi goes through first. You turn sideways and follow, and the hedge closes behind you like a door.`, flag('aq44-found'), flag('aq44-led'), room('aq44-paradise'))),
      ch('Pick it up and walk on.', leave(`You pick it up. It wriggles, looking back at the gap, all the way down the road. Misty watches you go without a word.`)),
    ]),
  ev('aq44-paradise', 'The Paradise', AQ, { room: true, cast: ['boss.misty'], pokemon: 'togetic', tint: PARADISE, effect: 'sparkle' },
    `Inside the hedge is a bowl of green meadow under a ring of white cliffs, and it is full of Togepi: hundreds, in the grass, on the rocks, asleep in the flowers. It is the most peaceful place you have ever stood in. At the far end, men in white coats with surveying poles and a growling machine are pushing in, and the Togepi are backing away from them. "They want it," Misty says. "The peace. For themselves. A retreat, they call it." Her voice shakes. "I raised it from an egg. It's the only one who can protect them." Her Togetic looks at the paradise. Then it looks at her.`,
    [
      ch('Help her let it go.', out(`You put a hand on Misty's shoulder. She knows what you mean before you say it. "I know," she says. "I know. I've known since we came through the hedge."`, flag('aq44-let-go'), room('aq44-let-go'))),
      ch('Protect the paradise together.', fight(`"Together, then," says Misty, and she wipes her eyes with her wrist, and she is a Gym Leader again. You walk down the meadow side by side toward the machine.`, duel('The Retreat Surveyors', { cls: 'ace-trainer', size: 3, format: 'doubles', types: ['steel', 'normal'], win: [flag('aq44-protected'), room('aq44-another-guardian')] }, { pseudo: true, lose: [flag('aq44-protected'), flag('aq44-surveyors-won'), room('aq44-another-guardian')] }))),
      ch('Ask the Togetic.', out(`You crouch so you are level with Misty's shoulder, and you ask it, out loud, what it wants. Misty makes a sound, but she does not stop you. The Togetic looks at you. It looks at her for a long time. Then it opens its wings.`, flag('aq44-asked'), room('aq44-it-chooses'))),
    ]),
  ev('aq44-let-go', 'The Guardian', AQ, { room: true, cast: ['boss.misty'], pokemon: 'togetic', tint: PARADISE, effect: 'sparkle' },
    `Misty lifts the Togetic off her shoulder and holds it up in both hands. "Go on," she says. "Go on, then. They need you more than I do." It hesitates. She nods, and keeps nodding. It rises out of her hands, over the meadow, and begins to glow, and the light goes out across the grass like a ripple on water. The machine coughs and stops. The men in white coats look up, and something in their faces goes quiet, and they pack up their poles, and they leave.`,
    [
      ch('Stay with Misty.', out(`Misty is crying. She does not hide it and she does not stop. You stand beside her while the Togetic circles above its new home. "I'm not sorry," she says, and her voice breaks, and she says it again so it comes out right. "I'm not sorry. Look at it." You look. It is where it belongs, and so, in a way, is she.`, moment('Misty let her Togetic go to guard the paradise, and cried, and did not regret it.', 70), room('aq44-the-egg'))),
    ]),
  ev('aq44-it-chooses', 'It Chooses', AQ, { room: true, cast: ['boss.misty'], pokemon: 'togetic', tint: PARADISE, effect: 'sparkle' },
    `The Togetic lifts off Misty's shoulder. It goes up over the meadow, and turns, and looks back at her one last time, and then it chooses the paradise. Its light spreads out across the grass. The growling machine stops. The men in white coats lower their poles, one by one, and walk out the way they came, as if they had forgotten what they came for.`,
    [
      ch('Go to Misty.', out(`Misty is standing very straight. "It asked you," she says, "and it chose. That's fair. That's how it should be." Then her face crumples and she cries, hard, the way you cry for something good. "I raised it to be able to choose," she says. "I just didn't think it would." The Togetic comes down once, and touches her forehead with its own, and goes back to its post.`, moment('Asked what it wanted, Misty\'s Togetic chose to guard the Togepi paradise.', 70), room('aq44-the-egg'))),
    ]),
  ev('aq44-another-guardian', 'Another Guardian', AQ, { room: true, cast: ['boss.misty'], pokemon: 'togetic', tint: PARADISE, effect: 'sparkle' },
    `The machine is gone, and the men in white coats with it. The Togetic lands back on Misty's shoulder and stays there; she holds on to it with one hand as if it might change its mind. But the paradise is still unguarded, and they will come back, or someone like them will. The oldest Togepi in the meadow comes waddling up to you both, and looks at your party, and then at you, and makes a long, serious sound. It is asking for another guardian.`,
    [
      ch('Promise to send one.', out(`"We'll find one," you tell it. Misty nods, fiercely. "We will." The old Togepi seems to accept that. It turns and calls into the grass, and something round and white comes rolling out of the flowers toward you.`, flag('aq44-guardian-promised'), room('aq44-the-egg'))),
    ]),
  ev('aq44-the-egg', 'An Egg from the Paradise', AQ, { room: true, cast: ['boss.misty'], pokemon: 'togepi', tint: PARADISE, effect: 'hearts' },
    `Before you go, the Togepi of the meadow roll an egg to your feet. It is white, with red and blue shapes on it, and it is warm. Misty picks it up and puts it in your hands. "It's a thank you," she says. "From them." She smiles, eyes still wet. "Raise it well. It might come back here one day, to keep the place safe."`,
    [
      ch('Take the egg.', out(`You hold it against your chest. It knocks once, from the inside, as if saying hello. Misty walks you to the hedge. On the other side, the road is exactly where you left it, as if no time at all has passed. Behind you, a hundred small bells.`, egg({ species: ['togepi'], left: 3 }), flag('aq44-egg'), flag('aq44-paradise-done'), moment('The Togepi of a hidden paradise gave you one of their eggs.', 60))),
      ch('Leave it in the meadow.', out(`"It should hatch here," you say, "where it's safe." Misty nods, and sets it back in the flowers. On the other side of the hedge, the road is exactly where you left it. Behind you, a hundred small bells.`, flag('aq44-paradise-done'))),
    ]),

  // ---------------- AQ45. The Headache ----------------
  ev('aq45-the-headache', 'The Headache', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: SEA, cast: ['boss.misty'], pokemon: 'psyduck', tint: POOL, effect: 'rain',
    remembers: [{ id: 'cousin', when: [flagIs('psyduck-joined')], notice: 'The Psyduck stops holding its head long enough to stare at your bag. It has seen that bottle before. It is a cousin of the Psyduck from the migration, the one at the very back of the line, and it knows exactly what is in there.' }] },
    `A swimming race in a big outdoor pool, the crowd shouting, a dozen swimmers churning up the lanes. Halfway down lane four, a Poké Ball on a swimmer's belt pops open by itself. A Psyduck comes out, looks round in total confusion, and sinks like a stone. Misty is out of the water and back into it before anyone else moves. "EVERY TIME!" She drags it out onto the side. It is holding its head in both hands. "It's always got a headache," she says, wringing out her hair. "When it gets bad enough, it's actually brilliant. For about a minute."`,
    [
      ch('Teach it to swim.', out(`"A Water-type," you say, "that can't swim." Misty throws her hands up. "Be my guest! I've tried for years." The Psyduck looks at the water. It looks at you. It holds its head.`, flag('aq45-lessons'), room('aq45-lesson-one'))),
      ch('Wait for the headache.', fight(`"You want to see it?" Misty grins and steps back. "Then battle it. Don't go easy. Its head has to really hurt." The Psyduck waddles to the edge of the pool, holding its head, and blinks at you. The crowd starts to gather.`, monDuel("Misty's Psyduck", 'psyduck', 0, { foeMoves: ['psychic', 'confusion'], win: [flag('aq-psyduck-brilliant'), room('aq45-pool-empty')], lose: [flag('aq-psyduck-brilliant'), room('aq45-pool-empty')] }))),
      ch('Give it Ibuprofen.', out(`You take the bottle out of your bag. Misty raises an eyebrow. The Psyduck takes the bottle in both hands, very seriously, and looks at it for a long time. Then it lets go of its head. Its eyes un-cross. It looks, for the first time since you met it, perfectly calm. Its headache is gone. So, Misty says, sighing, is its brilliance. "Well. At least it'll stop sinking out of worry."`, flag('aq-psyduck-cured'), room('aq45-gym-pool')), { requires: [flagIs('psyduck-joined')] }),
    ]),
  // Three lessons.
  ev('aq45-lesson-one', 'Lesson One: Floating', AQ, { room: true, cast: ['boss.misty'], pokemon: 'psyduck', tint: POOL, effect: 'float' },
    `The shallow end. You stand waist-deep and hold out your arms. The Psyduck climbs down the steps one at a time, holding its head with one hand and the rail with the other, and steps into your arms like someone stepping onto ice. "Just float," you tell it. It does not know what that means.`,
    [
      ch('Hold it up and let go slowly.', out(`You hold it flat on the water and take your hands away, one finger at a time. It sinks one finger at a time. You catch it. You try again. On the ninth try it stays up for a whole second, and its eyes go very wide. Misty, on the side, claps once, startled.`, room('aq45-lesson-two'))),
      ch('Show it how.', out(`You lie back on the water yourself and float, arms out, looking at the sky. It watches you. Then it lies back too, stiff as a plank, and sinks. You fish it out. But it tries again, without being asked, and that is the lesson.`, room('aq45-lesson-two'))),
    ]),
  ev('aq45-lesson-two', 'Lesson Two: Kicking', AQ, { room: true, cast: ['boss.misty'], pokemon: 'psyduck', tint: POOL, effect: 'float' },
    `The next morning, before the pool opens. The Psyduck is waiting at the shallow end already, sitting on the top step with its feet in the water, holding its head. It got here before you. "Kicking today," you tell it. It looks at its feet as if they belong to somebody else.`,
    [
      ch('Hold its hands while it kicks.', out(`You walk backwards down the lane, holding both its hands, and it kicks. It kicks like a wind-up toy, furious and in the wrong direction. Water goes everywhere. Misty gets soaked and does not complain. By the end of the lane it is going forwards, mostly. It is very proud.`, room('aq45-lesson-three'))),
      ch('Race it, slowly.', out(`You swim beside it, very slowly, and let it think it is racing. It kicks harder than you have ever seen anything kick. It reaches the rope first, by a beak, and turns round holding its head and quacking in triumph.`, room('aq45-lesson-three'))),
    ]),
  ev('aq45-lesson-three', 'Lesson Three: On Its Back', AQ, { room: true, cast: ['boss.misty'], pokemon: 'psyduck', tint: POOL, effect: 'float' },
    `The third morning. Misty has come to watch properly this time, sitting on the side with her chin on her knees. The Psyduck walks into the water without holding the rail. It still holds its head. Today, you think, it has to do the whole thing by itself.`,
    [
      ch('Let go and trust it.', out(`You step back and take your hands away. It wobbles. It starts to sink. Then, by itself, it lies back, all the way back, belly to the sky, holding its head in both hands, and floats. It floats right down the lane on its back, perfectly still, looking up at the clouds, and it is so pleased it forgets to sink. Misty is laughing and crying at once. "Three years," she says. "Three years!"`, flag('aq45-floats'), room('aq45-gym-pool')),
        { prompt: { id: 'balloon-drag', needs: 'ok' }, fail: out(`It sinks. You fish it out. It sits on the step and holds its head, and you think that is the end of it. Then it gets up and walks back in. The second time it lies back, all the way back, belly to the sky, and floats down the lane, holding its head, utterly pleased. Misty is laughing. "Three years!"`, flag('aq45-floats'), room('aq45-gym-pool')) }),
    ]),
  ev('aq45-pool-empty', 'For About a Minute', AQ, { room: true, cast: ['boss.misty'], pokemon: 'psyduck', tint: '#24304a', effect: 'shake' },
    `It took its hits, one, two, three, holding its head tighter each time. Then its eyes went blue and the air went tight. The Psychic it used was so strong the pool emptied: every drop of it, up in one great wobbling sheet, hanging in the air over the crowd, and then, very gently, set down on the grass outside. Now everyone is standing on the dry bottom of an empty pool. The Psyduck blinks. It looks round. It holds its head, confused all over again.`,
    [
      ch('Look at Misty.', out(`Misty is standing in the deep end with no water in it, dripping, with her hands on her hips. "For about a minute," she says. "Told you." Then she laughs so hard she has to sit down on the tiles, and the Psyduck comes and sits next to her, and pats her, kindly, with no idea why.`, room('aq45-gym-pool'))),
    ]),
  ev('aq45-gym-pool', 'Misty\'s Gym Pool', AQ, { room: true, cast: ['boss.misty'], pokemon: 'psyduck', tint: POOL, effect: 'none' },
    `Later, at her Gym, Misty shows you the back pool, where the Water-types she looks after live. There is a second Psyduck there, sitting on the edge, holding its head, gazing at nothing in particular. "That one's been here a year," Misty says. "Never wants to swim, never wants to battle. I think it's waiting for someone with patience." She looks at you sideways. "You've got more than I have."`,
    [
      ch('Take the Psyduck.', out(`You crouch beside it. It looks at you for a very long time, holding its head. Then it holds out one hand to you, and keeps the other on its head, just in case. Misty grins. "Good luck," she says. "You'll need it. Don't let it sink."`, gain('psyduck', { bond: 10 }), flag('aq45-psyduck'), moment('You met Misty\'s Psyduck, and took home one of its friends from her Gym pool.', 55))),
      ch('Leave it in the pool.', leave(`"It's happy here," you say. Misty shrugs. "It's something here, anyway." The Psyduck watches you go, holding its head, and then, very slowly, lies back in the water and floats.`)),
    ]),
];

export const REMOVE: string[] = [];
