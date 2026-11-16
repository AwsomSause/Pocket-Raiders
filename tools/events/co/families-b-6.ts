// Catalog Overhaul, families-b (STORY_FAMILIES_6.md, "Covers": the road chains): Miniature Episodes, part 1 of 2 (QUESTLINE).
// Ledger: "the rest stay as three-stage Miniature Episodes with their own afterstory". Each step remembers what you did in the
// one before (Remembers variants and choice requirements); step 3 leaves the afterstory line in the run's journal.
import { BERRIES, TREASURE, any, ch, fight, flag, flagIs, fr, front, good, hasAny, heal, item, join, loseOne, money, out, peace, ptype, rest, rift, rp, scout, wild, type Json } from '../dsl.ts';
import { episode, foresight, seen, temp } from './_fb.ts';

export const CATEGORY = 'families-b';

const cash = (amount: number): Json => ({ kind: 'money', amount });
const SMALL_BERRIES = ['pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'leppa-berry'];
const ANY_BERRY = [...BERRIES, ...SMALL_BERRIES];

const LONG_LETTER = episode('long-letter', 'The Long Letter', { tint: '#40382a' }, [
  {
    intro: `A postman on a tired bicycle stops beside you. "You're heading north? This one's been in my bag four years. Every route I try, they've moved on. Maybe you'll have better luck." The envelope is soft with handling.`,
    choices: [
      ch('Promise to deliver it.', out(`He presses it into your hands like he's putting down something heavy. "Thank you. Some letters you can't throw away." The name on it is Mira. No address. Just a town that isn't on your map.`, flag('letter-promised'))),
      ch('Read the address first.', out(`"To Mira, from Tobin. Wherever you are." The postman shrugs. "That's the whole address. I told you it was hard." You take it anyway.`, flag('letter-read-address'))),
    ],
  },
  {
    intro: `A town that isn't on your map, after all. A woman tending a garden of Bellossom. You ask for Mira, and she straightens up slowly.`,
    by: [[[flagIs('letter-promised')], `A town that isn't on your map. A woman in a garden of Bellossom. You ask for Mira. "That's me." You hold out the letter you promised to bring. She sees the writing and sits down in the dirt.`]],
    choices: [
      ch('Give it to her and wait.', out(`She reads it twice. "He wrote. Four years ago, he wrote." She laughs and cries at once. "He asked if I'd forgive him. I forgave him the day after he left. He never knew."`, flag('letter-waited'), good(1))),
      ch('Give it to her and go.', out(`You put it in her hands and step back. Behind you, as you reach the gate, you hear her make a sound you will remember a long time.`, flag('letter-left'))),
    ],
  },
  {
    intro: `A Pidgeot circles once over your camp and lands, a letter in its talons. The writing on it is new, and it is addressed to you.`,
    by: [
      [[flagIs('letter-waited')], `A Pidgeot lands at your camp with a letter. "From Mira," it says on the back. "You stayed while I read it. I wrote my answer that night. Would you take it to him?"`],
      [[flagIs('letter-left')], `A Pidgeot lands at your camp with a letter. "From Mira. You left before I could thank you. I've written back to Tobin. Would you carry it, one more time?"`],
    ],
    choices: [
      ch('Carry the reply.', out(`It takes three days to find Tobin, an old man now, on a fishing boat. He reads it with his lips moving. Then he holds your hand a long time and doesn't say anything, because there isn't anything to say.`, good(1), peace(1), rp(10))),
      ch('Send the Pidgeot on to him.', out(`You tell the Pidgeot what you know of where he is. It takes the letter and climbs into the sky. You will never know for sure. You find, to your surprise, that you trust it.`, peace(1), fr(3))),
    ],
  },
], 'You carried a letter four years late, and then its answer.');

const SECRET_RECIPE = episode('secret-recipe', 'The Secret Recipe', { tint: '#4a3420' }, [
  {
    pokemon: 'slurpuff',
    intro: `A cook in a roadside kitchen, a Slurpuff on her shoulder sniffing the air. "My grandmother's recipe," she says. "Needs three berries I can't get to. Bring them, and I'll cook it for you. Then you'll know it too."`,
    choices: [
      ch('Agree to gather them.', out(`She writes them on a scrap: one sweet, one sour, one bitter. "The bitter one's the hard one. It grows where Pokémon don't like you." You pocket the list.`, flag('recipe-agreed'))),
      ch('Give her berries from your bag now.', out(`She sorts through what you have, takes one, and sniffs it. "Close. Not right." She smiles. "It's never right the first time. Bring the real ones."`, flag('recipe-agreed'), flag('recipe-tried')), { requires: [hasAny(...ANY_BERRY)] }),
    ],
  },
  {
    intro: `A bush of dark berries on a ledge, and around it a family of wild Pokémon who do not want you near. The bitter berry, from the cook's list.`,
    choices: [
      ch('Ask nicely.', out(`You sit a long way off and wait. An hour. Two. In the end the smallest of them comes over, sniffs you, and drops one berry at your feet. It takes the berry you leave in return.`, flag('recipe-asked'), peace(1))),
      ch('Battle for it.', fight(`The biggest of them stands up on the ledge. It is not going to share.`, wild({ lv: 1, win: [flag('recipe-fought')] }))),
    ],
  },
  {
    intro: `The roadside kitchen, the cook, and three berries on the counter. She looks at the bitter one for a long time.`,
    by: [
      [[flagIs('recipe-asked')], `The cook turns the bitter berry in her fingers. "They gave you this. I can tell. It isn't bruised." Her eyes are wet. "That's how Gran got hers."`],
      [[flagIs('recipe-fought')], `The cook turns the bitter berry over. "You fought for it. I can tell, it's bruised. Gran fought for hers once too. She said she never did again."`],
    ],
    choices: [
      ch('Cook it together.', out(`Slow, careful, a lot of stirring. The smell fills the road. Everyone, your team and hers, eats from the same pot. You understand the recipe now. It isn't really about the berries.`, heal(1), fr(5))),
      ch('Watch and learn.', out(`She cooks it like a prayer, not saying a word. Then she writes it out for you on a card, and signs it with her grandmother's name as well as hers.`, heal(1), rp(10))),
    ],
  },
], 'A cook taught you her grandmother\'s recipe, made with three berries you brought.');

const NIGHT_NURSE = episode('night-nurse', 'The Night Nurse', { tint: '#30283a' }, [
  {
    pokemon: 'audino',
    intro: `A clinic lit up at two in the morning, one nurse and one Audino run off their feet. Six hurt Pokémon on the cots, more coming. "Can you hold this?" she says, before she even knows your name.`,
    choices: [
      ch('Stay and help.', out(`You hold, carry, fetch, and sit with a frightened Pikipek until it sleeps. By dawn every Pokémon is stable. The nurse sits on the floor and laughs, because there's nothing else left to do.`, flag('nurse-helped'), good(1), flag('kind-helped-stranger'))),
      ch('Lend her your healer.', out(`Your Pokémon with soft paws and a softer heart works beside the Audino all night. You sleep on a bench. In the morning it is exhausted and proud.`, flag('nurse-lent'), fr(10, 'lead'))),
    ],
  },
  {
    intro: `The night clinic, the next night. The door bangs open and a trainer you've crossed before runs in carrying a limp Pokémon. He sees you and stops dead.`,
    by: [[[flagIs('nurse-helped')], `The night clinic again. The door bangs open: a trainer who once beat you on the road, carrying a limp Pokémon. The nurse looks at you. "You know the way round. Help me?"`]],
    choices: [
      ch('Help save his Pokémon.', out(`You work beside the nurse. He stands in the corner and can't stop shaking. By midnight it breathes easy. He grips your arm. "I always thought you were just in my way."`, flag('nurse-saved-rival'), good(1))),
      ch('Keep him calm while she works.', out(`You sit with him in the corridor. He talks about his Pokémon, about how they met. You let him talk. Inside, the nurse is winning.`, flag('nurse-calmed-rival'), peace(1))),
    ],
  },
  {
    intro: `A note pinned to your pack in the morning, and beside it a little box. The clinic's handwriting, and another hand under it.`,
    by: [
      [[flagIs('nurse-saved-rival')], `A note on your pack, two handwritings. The nurse: "You were a natural." Under it, scrawled: "I owe you. Next time we meet I'll go easy. Maybe." The box is from both of them.`],
      [[flagIs('nurse-calmed-rival')], `A note on your pack: "Thank you for sitting with him. He needed that more than I did." Under it, in another hand: "Thanks. Really."`],
    ],
    choices: [
      ch('Open the box.', out(`A Soothe Bell from the clinic's drawer, and a card that will open any Pokémon Center door at night. You won't need that. You'll keep it anyway.`, item('soothe-bell'))),
      ch('Go back and say goodbye.', out(`The nurse is asleep at her desk, the Audino curled in her lap. You leave a berry beside her and go quietly.`, peace(1), heal(1))),
    ],
  },
], 'You helped a night clinic save a Pokémon belonging to a trainer who used to be in your way.');

const ROOFTOP = episode('rooftop-garden', 'The Rooftop Garden', { types: ['grass'], tint: '#2e4430' }, [
  {
    intro: `A fire escape in a grey city, and at the top of it, impossibly, green. Someone has made a garden on the roof: tomatoes in tins, flowers in boots, a Budew asleep in a teacup.`,
    choices: [
      ch('Water it.', out(`There's a watering can and a barrel of rainwater. You water everything, slowly. The Budew wakes, watches, and decides you are allowed.`, flag('garden-watered'))),
      ch('Let a Grass-type tend it.', out(`Your Grass-type walks the rows like it's home, touching leaves. The wilted ones lift. The Budew follows it everywhere.`, flag('garden-grass'), fr(5, { types: ['grass'] })), { requires: [ptype('grass')] }),
      ch('Just sit there.', out(`You sit among the plants and look at the grey city. It looks different from up here. You stay longer than you meant to.`, flag('garden-sat'), peace(1))),
    ],
  },
  {
    intro: `The rooftop garden, a few days on. It has gone wild with flowers. Wild Grass-types from the whole district are visiting it.`,
    choices: [
      ch('Plant something new.', out(`You dig a berry into an empty tin. Somebody, someday, will eat what grows. Probably a Budew.`, flag('garden-planted')), { requires: [hasAny(...ANY_BERRY)] }),
      ch('Watch the visitors.', out(`A Cottonee in the lettuce, a Petilil in the boots. They don't mind you. You don't mind them.`, flag('garden-watched'), rp(10))),
    ],
  },
  {
    intro: `On the roof, an old man with a trowel. He sees you and doesn't startle. "So you're the one," he says.`,
    by: [
      [[flagIs('garden-grass')], `An old man with a trowel is on the roof. "So you're the one whose Pokémon brought my tomatoes back." He looks at your Grass-type. "Thank you, little one."`],
      [[flagIs('garden-planted')], `An old man with a trowel is on the roof, looking at a little shoot in a tin. "This one's not mine," he says. "So it's yours. I've been watering it."`],
    ],
    choices: [
      ch('Ask why he made it.', out(`"My wife loved growing things. After she died, the flat was too quiet. So I came up." He looks round at it all. "Turns out it was never quiet up here."`, peace(1), heal(0.5))),
      ch('Help him finish the day\'s work.', out(`You dig together till sunset. He sends you off with a Miracle Seed from the oldest plant. "She grew that one," he says.`, item('miracle-seed'), good(1))),
    ],
  },
], 'You helped an old man keep the rooftop garden he made for his late wife.');

const RAIN_RIDGE = episode('rain-ridge-rite', 'The Rain Ridge Rite', { types: ['water'], tint: '#4a4028' }, [
  {
    intro: `Cracked fields, a dry well, and a village elder on the road with her hands out. "The rains have failed three years. The Pokémon who brings them hasn't come down from the ridge. Will you go up and ask it why?"`,
    choices: [
      ch('Go up the ridge.', out(`You set off with a waterskin and her blessing. The village watches you all the way to the first switchback.`, flag('ridge-went'))),
      ch('Ask what it looks like first.', out(`"Blue," she says. "Big. Gentle. Its call sounds like water over stones." She pauses. "My mother said it was lonely."`, flag('ridge-went'), flag('ridge-asked'))),
    ],
  },
  {
    pokemon: 'politoed',
    intro: `At the top of the ridge, in a dried-up pool, a big Politoed sits alone. It doesn't look sick. It looks sad. Around the pool are the bones of an old shrine nobody keeps.`,
    by: [[[flagIs('ridge-asked')], `At the top of the ridge, a big Politoed sits alone in a dried pool. Blue. Big. Gentle. And, yes, lonely: the old shrine around it is fallen, and no one has come up in years.`]],
    choices: [
      ch('Rebuild the shrine.', out(`You stack the fallen stones, sweep the step, hang a fresh cord. The Politoed watches every move. When you finish, it croaks, once, very quietly.`, flag('ridge-shrine'), good(1))),
      ch('Stay and keep it company.', out(`You sit on the edge of the dry pool and tell it about the village. About the elder. It listens. After a while it leans against you.`, flag('ridge-company'), peace(1))),
    ],
  },
  {
    intro: `Halfway down the ridge, the first drop hits your hand. Then the sky opens.`,
    fx: 'rain',
    by: [
      [[flagIs('ridge-shrine')], `Halfway down, the first drop hits your hand. Then the sky opens. Above you on the ridge, the Politoed is singing, and the rebuilt shrine shines wet in the light.`],
      [[flagIs('ridge-company')], `Halfway down, rain. You look back. The Politoed is following you down the ridge, singing, and the rain is coming with it. It isn't lonely any more.`],
    ],
    choices: [
      ch('Run down to the village.', out(`Everyone is in the square with their faces up, laughing, crying, soaked. The elder holds both your hands. "It remembered us," she says. "You reminded it."`, front('rain', 4), cash(500), good(1))),
      ch('Invite the Politoed along.', out(`It thinks about the village, and the ridge. Then it decides it can bring rain wherever you're going. The elder laughs. "Bring it back sometimes."`, join({ species: ['politoed'] })), { requires: [flagIs('ridge-company')] }),
    ],
  },
], 'You climbed Rain Ridge, and the rains came back to the village below.');

const CLOCKWORK = episode('clockwork-cat', 'The Clockwork Cat', { types: ['steel'], tint: '#3a3430' }, [
  {
    intro: `Tick, tick. A clockwork Meowth made of brass wanders down the street, bumping into walls, its key slowly turning. When it bumps into your boot, it stops and looks up with glass eyes.`,
    choices: [
      ch('Wind it up.', out(`You turn the key. It purrs, a whirring purr, and trots off in a straight line, sure of itself now. It's going somewhere.`, flag('cat-wound'))),
      ch('Follow it.', out(`You follow it three streets to a closed shop with a cracked sign: REPAIRS. It sits on the step and waits. So do you.`, flag('cat-followed'))),
    ],
  },
  {
    intro: `A clockmaker's shop, the shutters half up. An old man at the bench, eyeglass in, mending a watch. "Ah. You've met Ticker."`,
    choices: [
      ch('Ask about the cat.', out(`"My daughter made it. Years ago. She's a long way off now. It goes looking for her when it winds down." He doesn't look up. "Its spring's nearly gone. I can't make another one like hers."`, flag('cat-asked'))),
      ch('Offer to help fix it.', out(`"You?" He looks at your hands, then at your Pokémon. "Hm. A Steel-type's touch might do what mine can't. Bring it to me fully wound, and we'll see."`, flag('cat-asked'), flag('cat-help'))),
    ],
  },
  {
    intro: `Tick, tick, tick: steadier now. The clockwork cat trots up the road toward you, the old clockmaker walking behind it.`,
    by: [[[flagIs('cat-help')], `Tick, tick, tick, steady and bright. The clockwork cat runs up the road, and the clockmaker hurries behind it. "We did it! New spring. Your Steel-type held the coil true."`]],
    choices: [
      ch('Wind it one more time.', out(`The cat purrs and rubs against your hand. The clockmaker smiles. "My daughter's coming home next month. I wrote and told her Ticker's well. That's what brought her." He gives you his best work.`, item('metal-coat'), good(1))),
      ch('Let it choose where to go.', out(`The cat looks at you, at him, then sits down neatly between you both. "Yes," the old man says softly. "That's where she always sat."`, peace(1), fr(3))),
    ],
  },
], 'You helped a clockmaker mend the brass cat his daughter made.');

const MARATHON = episode('marathon-of-three', 'The Marathon of Three', { tint: '#3a4a3a' }, [
  {
    intro: `Three runners in matching shirts, stretching at a milestone. "We run the whole region, every year, for our old coach," says the oldest. "Join us for a leg? Bring your fastest."`,
    choices: [
      ch('Run with them.', out(`You start fast and they laugh at you. "Pace!" By the end of the first hour you understand: it isn't a race. It's a promise.`, flag('race-ran'))),
      ch('Let your fastest Pokémon run instead.', out(`Your fastest Pokémon trots out beside them and sets an easy pace. They cheer it on like it's a fourth runner.`, flag('race-mon'), fr(5, 'lead'))),
    ],
  },
  {
    intro: `Mid-race. One of the three has gone down by the roadside, holding her ankle. The other two look at the road ahead, then at her.`,
    choices: [
      ch('Carry her on.', out(`You and your strongest Pokémon take her between you. It's slow and it hurts, but she's still in the race.`, flag('race-carried'), good(1), { kind: 'damage', share: 0.1, who: 'lead' })),
      ch('Run on for the other two.', out(`"Go," she says to them. "Finish it for coach. I'll wait here." You run beside the other two. You all look back once.`, flag('race-on'))),
      ch('Stay with her.', out(`You stay. The other two run on. You sit by the road with her and she tells you about the coach, who never once let anyone quit.`, flag('race-stayed'), peace(1))),
    ],
  },
  {
    intro: `The finish: a stone at the top of a hill, an old photo of a coach taped to it. The runners are gathering.`,
    by: [
      [[flagIs('race-carried')], `The finish. You reach the stone with the hurt runner between you, the other two cheering. All three of them touch the stone together. "Three of us," says the oldest. "Every year. Thank you."`],
      [[flagIs('race-stayed')], `The finish. The other two are already there. Then a cart comes up the hill, the hurt runner sitting in the back, waving. "Couldn't miss it," she says. "Coach wouldn't let me."`],
    ],
    choices: [
      ch('Touch the stone with them.', out(`They make you touch it too. "You ran a leg. You're on the team now." They give you their spare shirt, which doesn't fit, and their coach's whistle.`, fr(5), temp('Runner\'s pace', [{ kind: 'statMultiplier', stat: 'spe', value: 1.05 }], 3))),
      ch('Watch from the side.', out(`They stand round the photo quietly for a long minute. Then they're laughing and arguing about next year.`, peace(1), heal(0.5))),
    ],
  },
], 'You ran a leg of a marathon three friends run every year for their old coach.');

const VANE = episode('weather-vane-keeper', 'The Weather Vane Keeper', { tint: '#3a404a' }, [
  {
    intro: `An old man on a roof, tightening a weather vane shaped like a Pidgeot. "It knows things," he says. "Watch. It'll point at your next battle's weather." The vane swings, and stops.`,
    choices: [
      ch('Believe him.', out(`The vane points to the rain. "Rain," he says. "Mark me." You thank him, a bit amused, and walk on toward clouds you hadn't noticed.`, flag('vane-believed'), front('rain', 2))),
      ch('Laugh.', out(`He laughs too. "Everyone does. Mark me anyway." The Pidgeot vane points stubbornly at the sun.`, flag('vane-laughed'), front('sun', 2))),
    ],
  },
  {
    intro: `Your last battle came and went, and the weather was exactly what the old man said. On the next rooftop along the road, there he is again, smug as anything.`,
    choices: [
      ch('"You were right."', out(`"Of course I was!" He beams. "Now. Want to know the one after?" The vane swings and points at the snow.`, flag('vane-admitted'), front('snow', 2))),
      ch('Ask how it works.', out(`"I listen to the Pidgeot. The real ones. They know weather. The vane just points where they look." He winks. "Or it's magic. Up to you."`, flag('vane-asked'), rp(15))),
    ],
  },
  {
    fx: 'spin',
    intro: `The weather vane is spinning wildly, round and round, and the old keeper is standing under it, looking worried for the first time.`,
    choices: [
      ch('Ask what it means.', out(`"Something big's coming down the road ahead of you," he says. "The vane can't settle on it. Be ready." He presses a map into your hand with the route marked.`, scout(3), foresight(2))),
      ch('Climb up and steady it.', out(`You grab it. It pulls once, then stops, pointing straight at the road you're on. The old man nods slowly. "Then that's where your weather is."`, foresight(2), peace(1))),
    ],
  },
], 'An old weather vane keeper read every battle\'s weather right, and then warned you of a storm ahead.');

const SILENT_KING = episode('silent-merchant-king', 'The Silent Merchant King', { tint: '#3a3020' }, [
  {
    intro: `A merchant in a crown of dented tin sits on a carpet by the road. He doesn't speak. On the carpet before him, one item. He points at it, then at you.`,
    choices: [
      ch('Buy it.', out(`He holds up fingers for the price. Fair. You pay. He bows deeply, crown and all.`, cash(-600), any('pp-up', 'rare-candy', 'ability-capsule'), flag('king-bought')), { requires: [money(600)] }),
      ch('Bow back.', out(`You bow. He looks surprised, then pleased, then bows lower. He doesn't sell you anything, and somehow you both win.`, flag('king-bowed'))),
    ],
  },
  {
    intro: `The silent merchant king, on his carpet, further down the road. He sees you and nods. Just a nod.`,
    by: [[[flagIs('king-bowed')], `The silent merchant king, further on. He sees you, and bows first this time. There is something new on the carpet.`]],
    choices: [
      ch('Nod back and sit down.', out(`You sit across the carpet from him, the way you would with an old friend. Neither of you says anything for a while. It is the best conversation you have had all week.`, flag('king-sat'), peace(1), heal(0.3))),
      ch('Look at his new item.', out(`A Bottle Cap, polished. He points at it, at your lead, then at his heart. It's not for sale. It's a gift.`, item('bottle-cap'), flag('king-gift'))),
    ],
  },
  {
    intro: `His carpet is rolled up by the road, crown on top of it, and he is gone. Under the crown, a folded note.`,
    choices: [
      ch('Read the note.', out(`One line, in neat handwriting: "I stopped talking when my wife died, because nothing I said was for her. You were the first to answer me without words. Thank you." The crown is for you.`, good(1), any(...TREASURE))),
      ch('Leave the note unread, and the crown.', out(`You leave them where they lie. Somebody who doesn't speak should get to keep some words to himself.`, peace(2))),
    ],
  },
], 'A merchant who never spoke left you a note, and his tin crown.');

const MEMORY_LANE = episode('memory-lane', 'Memory Lane', { types: ['psychic'], tint: '#3a3048' }, [
  {
    fx: 'fog',
    intro: `A path through mist, and as you walk, the mist shows you things: your first battle this run, your team as it was when you set out, a node you'd almost forgotten. Your Pokémon walk slowly, watching.`,
    by: [
      [[seen('ovc-lost-child-s1')], `A path through mist. It shows you things from this run: a small boy holding a Pichu in the middle of the road. Your team as it was then. The way you answered him.`],
      [[seen('ovc-rain-shelter-s1')], `A path through mist. It shows you this run: a downpour, a little shelter with room for one, and the choice you made under it.`],
    ],
    choices: [
      ch('Keep walking through it.', out(`Scene after scene. Some make you smile, some don't. Your lead walks close beside you, the whole way.`, flag('memory-walked'), fr(3, 'lead'))),
      ch('Stop at the best one.', out(`You stand in front of a good moment for a long time: your team, together, after a hard win. It's real. It happened. You walk on lighter.`, flag('memory-best'), peace(1))),
    ],
  },
  {
    intro: `Further in, the mist stops on one scene and won't move on. It's something you wish you'd done differently.`,
    by: [
      [[flagIs('kind-walked-past')], `The mist stops on one scene: someone asking for help, and you walking on. It holds it there, patient, not cruel.`],
      [[flagIs('egg-lost')], `The mist stops on a riverbank: an egg rolling into the water, and you not reaching for it. It holds the moment there.`],
      [[flagIs('pack-took')], `The mist stops on a backpack by a trail, and you taking the Poké Balls and leaving the letter in the rain.`],
    ],
    choices: [
      ch('Look at it properly.', out(`You make yourself look. It hurts. Then, slowly, it stops hurting quite so much. You can't change it. You can carry it better.`, flag('memory-faced'), good(1))),
      ch('Turn away.', out(`You look at the path instead. The scene waits, then fades. It'll still be there. Not today.`, flag('memory-turned'))),
    ],
  },
  {
    intro: `The mist thins and the path comes out onto an ordinary road in ordinary sun. Behind you there is no mist at all.`,
    by: [[[flagIs('memory-faced')], `The mist lifts. Ordinary road, ordinary sun. You feel lighter than when you went in, which surprises you. Your team crowds round you as if you'd been gone a long time.`]],
    choices: [
      ch('Rest a while.', out(`You sit on a stone and your team piles round you. Nobody says anything. Nobody needs to.`, heal(0.5), fr(3))),
      ch('Walk on.', out(`You walk on. The run isn't over. There's still time to make better ones.`, peace(1))),
    ],
  },
], 'You walked Memory Lane and looked at this run, the good and the rest.');

const RIFT_PICNIC = episode('rift-picnic', 'The Rift Picnic', { tint: '#30284a' }, [
  {
    fx: 'sparkle',
    intro: `A tear in the air, light at the edges, and through it a meadow that isn't here. In the meadow, a picnic blanket set for two: sandwiches, a teapot still steaming. No one there.`,
    choices: [
      ch('Step through.', out(`The air is warm on the other side and smells of summer, although it's not summer. You sit on the edge of the blanket. Nobody comes. The tea stays hot.`, flag('picnic-in'), heal(0.3))),
      ch('Leave a note on the blanket.', out(`You reach through and leave a note: "This looks lovely. Sorry I missed you." The tear shivers.`, flag('picnic-note'))),
    ],
  },
  {
    intro: `The tear again, and this time someone's there: a girl in an old-fashioned coat, with a Clefairy, pouring tea. She looks up at you, startled. "Oh! You're the one."`,
    by: [[[flagIs('picnic-note')], `The tear again. A girl in an old-fashioned coat, with a Clefairy, holding your note. "You wrote back!" she says. "Nobody ever writes back. Sit, please. I set two cups."`]],
    choices: [
      ch('Sit and have tea.', out(`She talks about her town, which doesn't sound like any town you know. She asks about Pokémon you've never heard of, and you ask about ones she hasn't. You both laugh about the same things.`, flag('picnic-tea'), peace(1), rp(15))),
      ch('Ask where she is.', out(`"Here," she says. "Just a little bit to the side of here." The Clefairy waves at your team through the light. "We meet in the middle sometimes. It's nice."`, flag('picnic-where'), rift())),
    ],
  },
  {
    intro: `The tear is thinning, the meadow fading. The girl is packing the blanket. "It's closing," she says. "It always does. I wanted to say goodbye properly this time."`,
    choices: [
      ch('Say goodbye.', out(`She gives you a cup to keep, warm and real, from her side. "Maybe another rift," she says. The light goes. You are holding the cup.`, item('star-piece'), peace(1))),
      ch('Give her something to keep.', out(`You give her a berry from your bag. She holds it like treasure. "We don't have these," she says, amazed. The light closes on her smiling.`, loseOne(...ANY_BERRY), good(1), fr(3)), { requires: [hasAny(...ANY_BERRY)] }),
    ],
  },
], 'You had tea through a rift with a girl from just to the side of here.');

const WHALE_ROAD = episode('whale-road', 'The Whale Road', { types: ['water'], tint: '#1c3448' }, [
  {
    pokemon: 'wailord',
    intro: `The sea heaves, and an island rises out of it: grass, a few huts, a well, and under it all, breathing slow as tides, an enormous Wailord. People on its back wave to the shore.`,
    choices: [
      ch('Wade out and climb on.', out(`They pull you up laughing. "The island comes in once a year to trade. Welcome aboard, land-walker." Under your feet, the whole place sighs.`, flag('whale-aboard'))),
      ch('Wave back from the shore.', out(`They wave harder. A child holds up a shell and shouts something the wind takes. The island starts to turn.`, flag('whale-waved'))),
    ],
  },
  {
    intro: `The island people gather round. "A land-walker!" says their chief. "You must play the Ring Game. Everyone who comes aboard plays. It is rude not to."`,
    by: [[[flagIs('whale-waved')], `The island comes back in, nearer, and the chief shouts across the water: "You waved! Come play the Ring Game! It is rude not to!" A boat is coming for you.`]],
    choices: [
      ch('Play the Ring Game.', out(`You throw a ring over a post fifty paces off and it lands, ringing. The whole island roars. You're an honorary islander now.`, flag('whale-won'), cash(400)), { prompt: { id: 'throw-ring', needs: 'ok' }, fail: out(`You miss by a mile. The whole island roars anyway: "Again next year!" They hang a shell on you regardless.`, flag('whale-played')) }),
      ch('Let a Water-type play for you.', out(`Your Water-type flips the ring off its nose and sends it spinning onto the post. The islanders lose their minds.`, flag('whale-won'), fr(5, { types: ['water'] })), { requires: [ptype('water')] }),
    ],
  },
  {
    intro: `The Wailord is going under. The islanders are tying everything down, singing a slow song as the sea climbs the grass. "Time to go home," says the chief. "Under, then out to the deep."`,
    choices: [
      ch('Swim back to shore.', out(`They give you a shell on a cord. The Wailord sinks, the island under it, the song still coming up through the water long after it's gone.`, item('big-pearl'), peace(1))),
      ch('Say goodbye to the Wailord.', out(`You put your hand on its skin where it meets the sea. It's warm. One great eye opens and looks at you. Then it breathes out, and goes down.`, heal(1), fr(3))),
    ],
  },
], 'A Wailord island rose from the sea, and you played the Ring Game on its back.');

const DREAM_BRIDGE = episode('dream-bridge', 'The Dream Bridge', { types: ['psychic', 'fairy'], tint: '#3a2a4a' }, [
  {
    fx: 'float',
    intro: `At dusk, a bridge appears over a river that had no bridge. Pale, shimmering, solid when you touch it. On the far side, nothing but more dusk.`,
    choices: [
      ch('Cross it.', out(`It hums under your feet. Halfway across you can't see either bank. Your team presses close. Somewhere, very softly, someone is singing you to sleep.`, flag('bridge-crossed'))),
      ch('Wait for full dark.', out(`You wait. The bridge brightens as the light goes. A Munna drifts along it, munching the mist, and stops to look at you.`, flag('bridge-waited'))),
    ],
  },
  {
    pokemon: 'musharna',
    intro: `In the middle of the bridge, a Musharna floating in a cloud of pink smoke. A voice in your head: "I can show you a dream. A good one. One you need."`,
    by: [[[flagIs('bridge-waited')], `The Munna you watched is here, bigger now, a Musharna in pink smoke. "You waited for me. I'll show you a dream, if you like. A good one."`]],
    choices: [
      ch('Let it show you.', out(`You see your team, older, after a run that ended well. Happy. You don't know if it's true. It feels true. You wake standing on the bridge with tears on your face.`, flag('bridge-dreamed'), peace(1), heal(0.5))),
      ch('Ask it to show your Pokémon a dream instead.', out(`Smoke drifts over your team. One by one they sleep standing up, smiling. When they wake, they look at you differently. Softer.`, flag('bridge-shared'), fr(5))),
    ],
  },
  {
    intro: `Dawn, and the bridge is fading under your feet. You are almost across.`,
    choices: [
      ch('Run for the far bank.', out(`You make it with a step to spare. Behind you the bridge is gone, and the river runs under nothing. You feel rested to your bones.`, rest())),
      ch('Turn back to say thank you.', out(`You turn. The Musharna is still there in the middle of the fading bridge. It bows. Then you're on the bank, and it's gone, and you are rested to your bones.`, rest(), good(1))),
    ],
  },
], 'You crossed the Dream Bridge at dusk, and saw a dream you needed.');

export const EVENTS: Json[] = [
  ...LONG_LETTER, ...SECRET_RECIPE, ...NIGHT_NURSE, ...ROOFTOP, ...RAIN_RIDGE, ...CLOCKWORK, ...MARATHON, ...VANE, ...SILENT_KING, ...MEMORY_LANE, ...RIFT_PICNIC,
  ...WHALE_ROAD, ...DREAM_BRIDGE,
];
export const REMOVE: string[] = [];
