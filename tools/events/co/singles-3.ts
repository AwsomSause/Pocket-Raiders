// Catalog Overhaul Pack, category "singles" (revised single events), batch 3.
// Doc: catalog_overhaul/STORY_FAMILIES_19.md, SF138 Road People and Light Comedy.
// Light comedy, kept short; each event has one choice that changes a later callback (a scene on a later stage).
// Known limits: docs/status/co-singles.md.
import { $, any, ch, cure, fight, flag, flagIs, heal, item, leave, out, reveal, room, scout, takeNode, trainer, wild, type Json } from '../dsl.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const no = (key: string): Json => ({ kind: 'flag', key, atMost: 0 });
const pick = { pick: {} };
const tutor: Json = { kind: 'addStop', stop: 'tutor' };
const advice = (topic: 'weakness' | 'habits'): Json => ({ kind: 'coAdvice', topic });
const repLost: Json = { kind: 'flag', key: 'rep-lost', amount: 1 };
/** A scene on a later stage, once the flag is set (and once per run). */
const later = (id: string, name: string, key: string, intro: string, choices: Json[], o: Json = {}): Json => ({
  id, name, group: 'Road people', stop: 'event', rarity: 'uncommon', callback: true, requires: [flagIs(key), no(`${id}-seen`)], scene: { cast: [], effect: 'hearts' }, ...o, intro,
  choices: choices.map((c) => ({ ...c, success: { ...(c.success as Json), effects: [...((c.success as Json).effects as Json[]), flag(`${id}-seen`)] }, ...(c.failure ? { failure: { ...(c.failure as Json), effects: [...((c.failure as Json).effects as Json[]), flag(`${id}-seen`)] } } : {}) })),
});
const rm = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group: 'Road people', room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
const LISSIE: Record<string, { label: string; types: string[]; team: string[] }> = {
  fire: { label: 'Fire', types: ['fire'], team: ['growlithe', 'ponyta', 'vulpix'] },
  water: { label: 'Water', types: ['water'], team: ['psyduck', 'poliwag', 'staryu'] },
  grass: { label: 'Grass', types: ['grass'], team: ['oddish', 'bellsprout', 'exeggcute'] },
};

export const EVENTS: Json[] = [
  {
    id: 'barkeep-usual',
    intro: '**Barkeep, Fitz**, polishing a glass that was clean an hour ago: "The usual? Or the special. It changes. Nobody knows how. Not even me."',
    choices: [
      ch('The usual.', out('Something warm in a thick mug, and a seat by the stove for your team. Fitz does not ask where you have been. Everyone is healed.', heal(1))),
      ch('The special.', out('Today the special is a Berry in a little glass dish, set down with great ceremony. "Hold it. It will know when."', any('sitrus-berry', 'lum-berry', 'liechi-berry', 'salac-berry')), { chance: 0.5, fail: out('Today the special is a rumour, poured slowly. Fitz leans in and tells you exactly who is waiting at the end of this road, and what they bring.', { kind: 'gymPreview' }) }),
    ],
  },
  {
    id: 'birthday-party-crash',
    intro: 'Streamers, a lopsided cake and a garden full of shrieking children. **Parents, desperate:** "You\'re a trainer! We need a battle show! Please. Anything."',
    choices: [
      ch('Put on a show.', out('Your team does every trick it knows, and some it does not. The children scream themselves hoarse. You leave with cake in your hair.')),
      ch('Let the kid battle me.', fight('The birthday kid marches up with one Pokémon and enormous seriousness. They lose, and laugh so hard they fall over, and then they ask how you did that, and you tell them.', trainer('Birthday Kid', { cls: 'youngster', size: 1, lv: -2, win: [flag('birthday-kid-battled'), moment('Battled a kid at their birthday party. They lost and laughed.', 35)] }))),
    ],
  },
  later('birthday-kid-returns', 'The Birthday Kid', 'birthday-kid-battled',
    'A young trainer plants themself in the road with their arms crossed. You know that face. It had cake on it. "Remember me? I trained. I trained with the one YOU used."', [
      ch('Battle.', fight('They send out a Pokémon just like the one you battled them with, and they have clearly watched it very, very closely.', trainer('The Birthday Kid', { mirror: true, win: [$(400), moment('The birthday kid came back, trained like you.', 45)] }))),
    ]),
  {
    id: 'blind-date-wingman',
    intro: 'Two nervous trainers at opposite tables of a cafe, each pretending not to look at the other. One of them catches your sleeve: "Please. Help us talk. I can\'t do it."',
    choices: [
      ch('Introduce them.', out('You march one over to the other and say both their names. They look at each other in silence for so long that you leave them to it.')),
      ch('Talk about their Pokémon.', out('You ask about their Pokémon, and both of them light up at once, and then they are talking to each other instead of to you. It works. You slip away.', flag('wingman-pokemon-talk'))),
    ],
  },
  later('blind-date-callback', 'A Name for a Hatchling', 'wingman-pokemon-talk',
    'The couple from the cafe find you on the road, holding hands and a very small Pokémon. "We named it after your lead. We hope that\'s all right. It\'s the reason we\'re together."', [
      ch('Say it\'s perfect.', out('Your lead sniffs the little one, very seriously, and allows it. The couple cry a bit. So do you, a bit.', moment('A couple named their Pokémon after your lead.', 50))),
    ]),
  {
    id: 'borrowed-ally',
    intro: '**A burly traveller, Gorm**, backed against a cliff by three trainers who have decided he looks like easy money: "Take my partner! Two of us, they won\'t dare!"',
    choices: [
      ch('Tag in.', fight('His Machoke steps up beside your lead and cracks its knuckles. It is a tag battle, two of you against them.', trainer('Road Toughs', { format: 'doubles', size: 3, ally: 'machoke', win: [$(300), flag('gorm-tagged'), moment('Fought beside Gorm\'s Machoke.', 40)] }))),
      ch('Call the police.', out('You run for the nearest call box. Officer Jenny arrives at a gallop, and the three toughs remember they have somewhere else to be. Gorm shakes your hand until your arm aches.')),
    ],
  },
  later('borrowed-ally-cheer', 'Gorm\'s Machoke', 'gorm-tagged',
    'At the edge of the crowd near the Gym, something big is waving both pairs of arms over everyone\'s heads. Gorm\'s Machoke has spotted you. It is cheering. Gorm is trying to make it stop. He is not trying very hard.', [
      ch('Wave back.', out('You wave. The Machoke flexes for you, very deliberately, all four arms. Your team flexes back. Gorm gives up and joins in.', moment('Gorm\'s Machoke cheered you on near a Gym.', 40))),
    ]),
  {
    id: 'broken-vending-pokeball',
    intro: 'A vending machine blinks ERROR, ERROR, ERROR, and with every blink it spits a Poké Ball onto the pavement. Nobody else is around.',
    choices: [
      ch('Grab a few.', out('You take five and leave the rest rolling. That seems like the right number for a machine that is having a bad day.', item('poke-ball', 5))),
      ch('Grab as many as I can.', out('You fill your arms, and then your bag, and then the owner comes round the corner and stops. "Those are mine." He holds out his hands. You give them back, every one, and he does not say another word.')),
      ch('Tell the owner.', out('You find him in the shop next door and tell him. He runs out, kicks the machine in exactly the right place, and it stops. Then he gives you three Great Balls, "for being the only one who told me."', item('great-ball', 3))),
    ],
  },
  {
    id: 'childs-drawing',
    intro: '**A child with a crayon map**, the X drawn so hard it went through the paper: "My treasure! It\'s buried right here. I\'ll share!"',
    choices: [
      ch('Dig it up.', out('You dig where the X is while she jumps up and down. Under the dirt there is a toy Pikachu, faded and loved.', room('childs-drawing-toy'))),
      ch('Help her dig it up.', out('You dig together, both of you filthy to the elbows. Under the dirt there is a toy Pikachu, faded and loved, and she holds it up like a trophy.', room('childs-drawing-toy'))),
    ],
  },
  rm('childs-drawing-toy', 'The Toy Pikachu', 'She looks at the toy Pikachu for a long time. Then she holds it out to you with both hands. "You found it. So it\'s yours. That\'s the rule."', [
    ch('Keep it.', out('You take it and thank her properly. She nods, satisfied: rules are rules. You carry the toy Pikachu carefully.', item('toy-pikachu'))),
    ch('Give it back.', out('You close her fingers back around it. "Keep it safe for me." She hugs it so hard its ear bends, and everybody in the street heard about it by dinner.', flag('rep'))),
  ], { scene: { cast: [], pokemon: 'pikachu', effect: 'hearts' } }),
  {
    id: 'coverage-judge',
    intro: '**A critic outside a cafe**, lowering her sunglasses at your team: "Your team. Oh, dear. Oh, dear, dear."',
    choices: [
      ch('Tell me.', out('She tells you. She is rude about it, and she is right.', advice('weakness'))),
      ch('No, thanks.', leave('"Your funeral, darling." She sips her coffee.')),
    ],
  },
  {
    id: 'dance-off',
    intro: 'Drums start up out of nowhere. **A dancer** points straight at you across the square: "You! Follow my arrows!"',
    choices: [
      ch('Dance.', out('You hit every arrow. The crowd goes wild. The dancer bows to you, deeply, and says they will look for you at the next festival.', flag('dancer-met'), moment('Won a dance-off in a square full of strangers.', 40)), { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('You miss the third arrow and then all the rest of them, and the crowd loves you for it anyway. The dancer laughs and says they will look for you at the next festival.', flag('dancer-met')) }),
      ch('Let a Pokémon dance.', out('The one you chose hits every arrow, and some that are not there. The dancer is delighted and says they will look for you both at the next festival.', flag('dancer-met'), { kind: 'friendship', amount: 5, who: 'picked' }), { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('Your Pokémon dances to a completely different song from the one playing, and the crowd adores it. The dancer says they will look for you at the next festival.', flag('dancer-met')), ...pick }),
    ],
  },
  {
    id: 'field-trip-chaperone',
    intro: '**Teacher, Ms. Agu**, with six children holding a rope between them: "Could you guard us across the route? Wild Pokémon appear. I\'ve counted. Three times, on this stretch."',
    choices: [
      ch('Lead.', fight('You walk in front, and the rope of children follows. The first wild Pokémon comes out of the grass, then the second, then the third, and every child gets across without a scratch.', wild({ chain: 3, win: [flag('rep'), moment('Walked six children safely across the route.', 45)] }))),
      ch('Bring up the rear.', fight('You walk at the back, where the stragglers are. The wild Pokémon come from behind, all three times, and every time you are there first. Every child gets across.', wild({ chain: 3, win: [flag('rep'), moment('Walked six children safely across the route.', 45)] }))),
    ],
  },
  {
    id: 'glove-duel',
    intro: '**A trainer** throws a glove at your feet in front of the whole street. "A duel. Properly. Three against three, no switching. In front of everyone."',
    choices: [
      ch('Accept.', fight('The street clears to make a ring. Three against three, no switching: the rules are read out loud. If you lose, you lose nothing but your pride.', trainer('Duellist', { size: 3, win: [$(500)] }))),
      ch('Refuse.', out('You step over the glove and walk on. Behind you, somebody laughs, and the story goes round the street faster than you can.', repLost)),
    ],
  },
  {
    id: 'graveyard-ghost-helps',
    intro: 'A pale light drifts out of the trees ahead and hangs in the air, waiting. It is the ghost from the graveyard you tidied. It wants you to follow.',
    choices: [
      ch('Follow.', out('It leads you off the path and round, by a long, quiet way through the trees. From the far side you can see the ambush that was waiting on the road. The ghost bows to you, once, and fades.', moment('A ghost led you round an ambush.', 45))),
    ],
  },
  {
    id: 'library-gift',
    intro: '**Librarian, Mrs. Quarry**, over the top of her glasses: "You look like a trainer who knows things. Is there a fact the shelves don\'t have yet?"',
    choices: [
      ch('Answer the quiz.', out('She writes your answer down in the big book, and then, in a whisper, tells you where a move tutor keeps his scrolls. It is close.', tutor), { check: 'intelligence', fail: out('"Oh, we have that one." She is very kind about it.') }),
      ch('No.', leave('"Another time, then." She goes back to her stamping.')),
    ],
  },
  {
    id: 'library-overdue-fine',
    intro: '**Clerk**, holding up a book with your name on the card: "A year overdue. ₽200, or you can read it back to us tonight. Out loud."',
    choices: [
      ch('Pay ₽200.', out('You pay. He stamps the card with enormous satisfaction.', $(-200)), { requires: [{ kind: 'money', atLeast: 200 }] }),
      ch('Read it back (a node).', out('You read the whole thing aloud, all evening, to a room of three old men and a sleeping cat. At the end, the clerk tells you the book was right about one thing: where a move tutor lives.', takeNode(), tutor)),
    ],
  },
  {
    id: 'playstyle-mentor',
    intro: '**A mentor** you half recognise falls into step beside you: "Don\'t mind me. I\'ve been watching you fight. Here\'s what I noticed."',
    choices: [
      ch('Listen.', out('You listen.', advice('habits'))),
      ch('Not now.', leave('"Fair enough. You\'ll work it out." They peel off at the next fork.')),
    ],
  },
  {
    id: 'professors-lab',
    intro: '**Professor**, three monitors and a cold coffee: "Ah, a trainer! Could you help with one thing? Just one. I have three, and I can only fund one."',
    choices: [
      ch('Delta request.', out('"Delta forms. Strange colours, strange types. If you see one, I need to know." You take the request.', flag('lab-request-delta'))),
      ch('Z request.', out('"Z-Crystals. The trials, the dances. Bring me what you learn." You take the request.', flag('lab-request-z'))),
      ch('Mega request.', out('"Mega Evolution. Bond, stone, and something else nobody can name. Find out what." You take the request.', flag('lab-request-mega'))),
    ],
  },
  {
    id: 'recommend-team',
    intro: '**Young trainer, Lissie**, notebook open, pen ready: "What type would you build around? Honestly? I\'ll do whatever you say."',
    choices: Object.entries(LISSIE).map(([k, v]) => ch(`${v.label}.`, out(`She writes "${v.label.toUpperCase()}" in capitals and underlines it three times. "Right. Watch this space." She runs off before you can say anything else.`, flag(`rec-${k}`)))),
  },
  ...Object.entries(LISSIE).map(([k, v]) => ({
    id: `recommend-returns-${k}`,
    intro: `**Lissie**, waving a notebook full of ${v.label}-type notes: "I took your advice! Every word. Now let’s see if it was any good."`,
    choices: [ch('Battle.', fight(`Her ${v.label}-type team is everything you told her, and some things you did not. She is grinning the whole time.`, trainer('Lissie', { team: v.team, size: 3, lv: 1, win: [$(500), moment(`Lissie came back with the ${v.label}-type team you suggested.`, 45)] })))],
  })),
  {
    id: 'registration-desk',
    intro: '**Clerk**, flipping through a file with your name on it: "Ah. I have your file. You\'ve quit a tournament before, it says here." He looks up. "Have you?"',
    choices: [
      ch('That was then.', out('He looks at you over the file for a long moment, then stamps it. "Then this is now." You are registered.', flag('tournament-registered'))),
      ch('I won\'t quit.', out('"They all say that." He stamps it anyway, harder than he needs to. You are registered.', flag('tournament-registered'))),
    ],
  },
  {
    id: 'riddle-guard',
    intro: 'A guard in old armour blocks the bridge. **"I speak without a mouth and hear without ears. What am I?"**',
    choices: [
      ch('An echo.', out('He lowers his spear. "An echo." He sounds almost sad that you got it. You cross.')),
      ch('The wind.', fight('"WRONG." He draws himself up. After the battle he lets you cross anyway, muttering "an echo" under his breath.', trainer('Riddling Guard', { size: 2, win: [] }))),
      ch('A ghost.', fight('"WRONG." He draws himself up. After the battle he lets you cross anyway, muttering "an echo" under his breath.', trainer('Riddling Guard', { size: 2, win: [] }))),
    ],
  },
  {
    id: 'soap-box-derby',
    intro: '**A kid** in a crash helmet three sizes too big, standing beside a cart made of crates: "Build one and race me! Bet you can\'t!"',
    choices: [
      ch('Build fast.', out('You build it light and low, and it flies down the hill, and you win by a wheel. The kid is so impressed they ask you how you did it, and you tell them.', flag('derby-raced')), { check: 'speed', fail: out('You build it light and low, and it loses a wheel halfway down. The kid wins, and helps you up, and asks how you would do it next time. You tell them.', flag('derby-raced')) }),
      ch('Build sturdy.', out('You build it heavy and solid, and it rumbles down the hill and wins simply by not falling apart. The kid takes notes.', flag('derby-raced')), { check: 'strength', fail: out('You build it heavy and solid, and it is far too slow. The kid wins and pats your cart kindly. They want to know how you put the axle on.', flag('derby-raced')) }),
    ],
  },
  later('soap-box-derby-shop', 'The Bike Shop', 'derby-raced',
    'A bike shop with a hand-painted sign. The owner looks up from a wheel, and you know that face: the soap box kid, older, with grease on their nose. "It\'s you! Everything\'s half price for you. Forever. That\'s the rule."', [
      ch('Look around.', out('They show you every bike in the shop, and then they open the shop counter for you at half price.', { kind: 'addStop', stop: 'shop' }, { kind: 'tempEffect', label: 'Old friend’s discount: half price', effects: [{ kind: 'priceMultiplier', value: 0.5 }], battles: 1, until: 'battle' }, moment('The soap box kid owns a bike shop now.', 40))),
    ]),
  {
    id: 'street-magician',
    intro: '**A street magician**, sweeping off a tall hat: "A volunteer! You, with the honest face!"',
    choices: [
      ch('Volunteer.', out('You step up. He taps his hat, your lead vanishes in a puff of smoke, and the crowd gasps, and you gasp, and then it reappears behind you holding a Lucky Punch. The magician winks. "I\'ll be at the fair. Come and see the real trick."', item('lucky-punch'), flag('magician-met'))),
      ch('Let a Pokémon volunteer.', out('The one you chose climbs into the hat, and the hat is empty, and the crowd gasps. Then it climbs back out of your bag holding a Lucky Punch. The magician bows. "I\'ll be at the fair."', item('lucky-punch'), flag('magician-met')), pick),
    ],
  },
  {
    id: 'tavern-gossip',
    intro: '**Two regulars** at the end of the bar, both swearing to their stories: "There\'s a path off the road nobody uses." "No, there\'s a cave nobody\'s found." "Which one\'s true?"',
    choices: [
      ch('The path.', out('You follow the first story, and it is true. There is a path, and it leads to a stop no map shows.', reveal(), scout(3)), { chance: 0.5, fail: out('You follow the first story, and there is no path, only a very surprised Pidgey. The cave was the true one, apparently.') }),
      ch('The cave.', out('You follow the second story, and it is true. Behind the hill there is a cave mouth, and a stop no map shows.', reveal(), scout(3)), { chance: 0.5, fail: out('You follow the second story, and there is no cave, only a hill. The path was the true one, apparently.') }),
    ],
  },
  {
    id: 'wedding-guestbook',
    intro: 'Bells, ribbons, a crowd, and two Pokémon in tiny bowties trying very hard to sit still. A guestbook stands open at the gate. **"Sign, and be lucky!"**',
    choices: [
      ch('Sign.', out('You sign your name, and add a little message. The couple wave from the arch. Everyone cheers.', flag('wedding-signed'), flag('lore-egg-song'))),
      ch('Sign, and let a Pokémon stamp it.', out('You sign, and the one you chose presses a muddy paw beside your name. The bride laughs so hard she has to sit down.', flag('wedding-signed'), flag('lore-egg-song')), pick),
    ],
  },
  later('wedding-callback', 'The Wedding’s Little One', 'wedding-signed',
    'The couple from the wedding find you, a year on by their calendar, with a baby Pokémon riding on a shoulder. "We named it after you. You signed the book. You were lucky for us."', [
      ch('Hold it.', out('The baby Pokémon takes hold of your finger and will not let go. It has your name. You will think about that for a long time.', moment('A couple named their baby Pokémon after you.', 55))),
    ]),
  {
    id: 'part-timer',
    intro: '**Shop owner**, eyeing your team: "Your Pokémon could help out for pay. A stage\'s work. I\'ll send it back with wages, and something learned, or at least a story."',
    choices: [
      ch('Pick a Pokémon.', out('The one you chose trots off with an apron round its neck. It is back by the next stage, very proud of itself, with ₽500 and a story about a customer who tried to pay in Berries.', $(500)), pick),
    ],
  },
];

export const REMOVE: string[] = [];
void cure;
