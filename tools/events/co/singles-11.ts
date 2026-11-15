// Catalog Overhaul Pack, category "singles" (revised single events), batch 11.
// Doc: catalog_overhaul/STORY_FAMILIES_22.md SF155 Games and Shrines, SF156 Roadside, SF157 Seasonal Set Pieces.
// Known limits: docs/status/co-singles.md.
import { $, any, bondUp, ch, egg, fight, flag, flagIs, good, heal, item, join, leave, out, room, scout, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const psychic: Json = { kind: 'partyType', type: 'psychic' };
const three: Json = { kind: 'partySize', atLeast: 3 };
const catchStep = (label: string): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'captureMultiplier', value: 1.25 }], battles: 1, until: 'wild' });
const shard: Json = { kind: 'train', what: 'masteryShard' };
const EPIC = ['comet-shard', 'sacred-ash', 'poke-radar', 'super-rod', 'x-attack-6', 'x-speed-6'];
const FOSSILS = ['helix-fossil', 'dome-fossil', 'plume-fossil', 'root-fossil', 'claw-fossil'];
const RARE_BERRY = ['liechi-berry', 'ganlon-berry', 'salac-berry', 'petaya-berry', 'apicot-berry'];
const WORDS: [string, string][] = [['Hello!', 'hello'], ['Never give up!', 'never-give-up'], ['Good luck!', 'good-luck'], ['Thank you!', 'thank-you']];

// ---------- SF155. GAMES AND SHRINES ----------
const SF155: Json[] = [
  {
    id: 'archaeology-dig',
    intro: 'A professor hands you a soft brush and a cold chisel, and points at a slab of rock with something curled inside it. "Gently now. The fossil does not forgive haste."',
    choices: [
      ch('Brush slowly.', out('You brush for an hour, grain by grain, your team holding their breath beside you. It comes out whole: a fossil, perfect, a shape from a world that ended long ago, lying in your hands.', any(...FOSSILS), moment('Brushed a whole fossil out of the rock.', 40))),
      ch('Chisel fast.', out('Chip, chip, crack, and out it comes, whole, by pure luck. The professor lets out a breath they had been holding the whole time.', any(...FOSSILS)), { chance: 0.5, fail: out('Chip, chip, CRACK. The fossil splits down the middle and crumbles. The professor says nothing at all, which is worse.') }),
    ],
  },
  {
    id: 'fossil-dig',
    intro: 'A hiker hands you a shovel and points at a bank of old clay. "They turn up here all the time. The common ones, anyway."',
    choices: [ch('Dig.', out('You dig until your arms burn, and there it is in the clay, a fossil, the common kind and still a little miracle.', any('plume-fossil', 'root-fossil', 'claw-fossil')))],
  },
  {
    id: 'bug-contest',
    intro: 'A park full of nets and nervous trainers. A judge with a set of scales: **"Bug-Catching Contest! Catch the finest Bug-type in the park, and I\'ll weigh it!"**',
    choices: [
      ch('Enter.', out('You crawl through the long grass for an hour and come back with a beauty. The judge weighs it, measures it, and holds it up for the crowd: the winner. Your Bug-type joins you, and the prize is a Sun Stone. "I\'ll remember this one," says the judge, and writes its name in a book.', join({ types: ['bug'] }), item('sun-stone'), { kind: 'flag', key: 'bug-contest-won', amount: 1, stamp: 'region' }, moment('Won the Bug-Catching Contest.', 45)), { branches: [{ when: [{ kind: 'flag', key: 'bug-contest-won', atLeast: 1, regionsAgo: 1 }], text: 'Before you even start, the judge waves their book at you. "Last region\'s champion! I still tell people about your Bug-type." Then you go and win again. The new one joins you, with a Sun Stone.', effects: [join({ types: ['bug'] }), item('sun-stone')] }] }),
    ],
  },
  {
    id: 'cry-shrine',
    intro: 'A stone door with three notches shaped like sound. Carved above it: **"Only living cries open me. Three, and all different."**',
    choices: [
      ch('Let three Pokémon cry.', out('Three of your Pokémon cry out together, three different voices, and the notches glow one by one. The door grinds open on a small dark shrine, and in it, an old shape carved in the stone that you would swear is watching you.', flag('sign-own'), moment('Opened the Cry Shrine.', 45)), { requires: [three] }),
      ch('Walk on.', leave('You leave the door quiet.')),
    ],
  },
  {
    id: 'escape-room',
    intro: 'The door slams behind you. A cellar with shelves of jars, each with a Pokémon\'s picture on it, and a note: **"The way out is in the order of things. The order you know best."**',
    choices: [
      ch('Line them up in the order you met your team.', out('{starter} first, of course, and then each of the others in the order they came to you, and with every jar you set down, you remember the day. The last jar clicks into place, and a key drops out of the shelf.', room('escape-room-2'))),
      ch('Line them up by size.', out('Smallest to biggest. It looks very tidy. Nothing happens. The way out is in a different order.')),
    ],
  },
  {
    id: 'escape-room-2',
    intro: 'The key opens a little chest with three bottles and a riddle: **"The left one lies. The right one lies. The middle one tells the truth."**',
    choices: [
      ch('The left bottle.', out('The label says "Drink me to get out." It lies. It tastes of old socks.')),
      ch('The middle bottle.', out('The label says "The door is behind the wine rack." It is. You push it open, and in a crate by the steps, someone left a little purse of money for whoever got this far.', $(300), moment('Escaped the cellar.', 30))),
      ch('The right bottle.', out('The label says "There is no way out." It lies, which is a comfort, but it does not tell you where the way out is.')),
    ],
  },
  {
    id: 'game-show-1',
    intro: 'Lights! Music! A host with a huge grin. "Three questions, and the grand prize! Question one, and it\'s about YOU: who was your very first partner on this run?"',
    choices: [
      ch('{starter}.', out('"CORRECT! Of course it is!" {starter} looks at you like you have done something wonderful. "On to question two!"', room('game-show-2'))),
      ch('A Magikarp.', out('"Oh, no! The audience gasps!" So does your starter. The host sends you off with a smile and a key ring.')),
      ch('I don\'t remember.', out('"You don\'t...?" The host looks at your starter. Your starter looks at you. The audience boos, gently.')),
    ],
  },
  {
    id: 'game-show-2',
    intro: '"Question two! How many types of Pokémon are there?"',
    choices: [
      ch('17.', out('"Ooh! So close! You forgot one!" The host gives you a key ring anyway.')),
      ch('18.', out('"EIGHTEEN! CORRECT! Final question!"', room('game-show-3'))),
      ch('19.', out('"Nineteen? Have you found one we don\'t know about?" The host gives you a key ring and a curious look.')),
    ],
  },
  {
    id: 'game-show-3',
    intro: '"Final question for the GRAND PRIZE! Which Pokémon is number 25 in the National Pokédex?"',
    choices: [
      ch('Pichu.', out('"Pichu is number 172! So close, so far!" The audience sighs with you. A consolation prize: ₽200.', $(200))),
      ch('Pikachu.', out('"PIKACHU! NUMBER TWENTY-FIVE! WE HAVE A WINNER!" Confetti, music, the audience on its feet, and the grand prize pressed into your hands: a Rare Candy and ₽1,000.', item('rare-candy'), $(1000), moment('Won the grand prize on the game show.', 50))),
      ch('Raichu.', out('"Raichu is twenty-six! Off by one!" The audience groans. A consolation prize: ₽200.', $(200))),
    ],
  },
  {
    id: 'hide-and-seek',
    intro: 'Leaves rustle. Something tiny and pink giggles and ducks out of sight. A voice in your head, very pleased with itself: **"Find me!"** The giggle came from somewhere above.',
    choices: [
      ch('Behind the tree.', out('Nobody behind the tree. A giggle from somewhere else entirely.')),
      ch('In the tall grass.', out('Nothing in the grass but a startled Caterpie. The giggle moves.')),
      ch('Up in the branches.', out('You look up. Two enormous blue eyes look down at you from the leaves. "Found me," says the voice, delighted, and then it is gone, with a sound like a laugh, and you will tell this story for the rest of your life.', flag('telling-mew'), moment('Played hide-and-seek with something pink.', 60))),
    ],
  },
  {
    id: 'lore-riddle-1',
    intro: 'A dusty book falls open in your hands. **"I have hands but cannot hold. I tick and tock, and I am old. Where do I rest?"**',
    choices: [
      ch('A clock tower.', out('The book flutters to a new page. A drawing of a clock tower, and under it, the next riddle.', room('lore-riddle-2'))),
      ch('A tree.', out('The book closes itself with a soft, disappointed thump.')),
    ],
  },
  {
    id: 'lore-riddle-2',
    intro: 'The next page: **"I am sweet in spring and sour in the fall. I wear a coat and hide a stone. What am I?"**',
    choices: [
      ch('A Berry.', out('The page unfolds into a map, inked by hand, with an X under an old tree.', room('lore-riddle-3'))),
      ch('A peach.', out('Close. Not close enough. The book closes.')),
    ],
  },
  {
    id: 'lore-riddle-3',
    intro: 'The map ends under an old tree. A chest sits half-buried in its roots.',
    choices: [ch('Dig.', out('You dig it out with your hands and your team\'s paws. Inside, wrapped in cloth that crumbles when you touch it: something rare and old, left for whoever could read the riddles.', any(...EPIC), moment('Followed the riddle book to its treasure.', 45)))],
  },
  {
    id: 'mind-reader',
    intro: 'A mind-reader at a little table fans out five cards. "Guess my card. One in five. Or, if you have a friend who can read minds..."',
    choices: [
      ch('Pick a card.', out('You pick the third card. The mind-reader stares. "...Yes." They hand over their bent spoon, a little shaken. "A Twisted Spoon. You\'ve earned it."', item('twisted-spoon')), { chance: 0.2, fail: out('Not that one. "One in five," says the mind-reader kindly, putting the cards away.') }),
      ch('Let your Psychic-type read it.', out('Your Psychic-type stares at the mind-reader for a long moment. The mind-reader stares back. Then they both laugh, and the mind-reader hands over the spoon. "Fair\'s fair. A Twisted Spoon."', item('twisted-spoon'), bondUp(1, { types: ['psychic'] })), { requires: [psychic] }),
    ],
  },
  {
    id: 'parrot-teacher',
    intro: 'A Chatot hops onto your shoulder and looks you in the eye. "Teach me! Teach me a word!"',
    choices: WORDS.map(([word, key]) => ch(`"${word}"`, out(`"${word}" The Chatot says it back, perfectly, in your voice, and then again, and then flies off saying it to everybody.`, flag('parrot-phrase'), flag(`parrot-${key}`)))),
  },
  {
    id: 'parrot-repeats',
    intro: 'A familiar squawk overhead. The Chatot. And everyone you pass on this road seems to be saying the same thing.',
    choices: [
      ch('Wave.', out('The Chatot lands on your shoulder, shouts your word in your own voice, and flies off again. People keep saying it to you all the way down the road.', bondUp(1, 'lead')), { branches: WORDS.map(([word, key]) => ({ when: [flagIs(`parrot-${key}`)], text: `The Chatot lands on your shoulder and shouts "${word}" in your own voice, and flies off again. All the way down the road, people you pass say it to you: "${word}" Some of them are smiling.`, effects: [bondUp(1, 'lead')] })) }),
    ],
  },
];

// ---------- SF156. ROADSIDE ----------
const SF156: Json[] = [
  {
    id: 'passing-caravan',
    intro: 'A caravan rolls by on the other road. The drivers wave. A small child leans out of the back window, staring at your Pokémon with enormous eyes.',
    choices: [
      ch('Wave.', out('You wave. The child waves back with their whole arm until the caravan is out of sight. You do not know it yet, but that was Tib, long before they ever met you.', flag('tib-seen'))),
      ch('Call out.', out('"Hello!" you shout. The child shouts back, "I\'m TIB!" and the caravan rolls away. You will hear that name again.', flag('tib-seen'), flag('tib-name-heard'))),
    ],
  },
  {
    id: 'sleeping-npc',
    intro: 'A trainer is asleep against a rock, muttering in their sleep. It sounds like a battle plan.',
    choices: [
      ch('Lean in.', out('You lean in. "...lead with the... then switch to..." It is your rival\'s plan, word for word: you know now who they will open with, and every fight between here and there.', { kind: 'riftPreview' }, flag('rival-plan-heard'))),
      ch('Leave a blanket.', out('You tuck your spare blanket round them and walk on. Later, far down the road, someone waves at you from a hilltop, wrapped in a blanket.', good(1), flag('kindness'))),
    ],
  },
  {
    id: 'tap-the-silhouette',
    intro: 'A shape moves in the tall grass. A faint cry: "Vee?" Fluffy tail, long ears. Who is it?',
    choices: [
      ch('An Eevee.', fight('"Vee!" It is, and it is very pleased you knew. It does not run. It comes right up to you, curious, and is much easier to catch than any wild one has a right to be.', wild({ species: ['eevee'] }), catchStep('It came to you: easier to catch'))),
      ch('A Buneary.', out('It hears the wrong name, flattens its ears, and is gone in a rustle of grass.')),
      ch('A Pikachu.', out('It hears the wrong name, gives a disgusted "Vee!", and is gone.')),
    ],
  },
  {
    id: 'voting-booth',
    intro: 'A little booth with ballots stands at a fork in the road. **"Everyone votes,"** says the sign. Your Pokémon crowd round it, very seriously.',
    choices: [
      ch('Let them vote.', out('Pawprints on ballots. The count: THE QUIET PATH wins. The ones who voted for it strut down it at the front, and you all take it slow and easy.', heal(0.25), bondUp(1, 'lead')), { chance: 0.5, fail: out('Pawprints on ballots. The count: THE LONG ROAD wins. The ones who voted for it lead the way, very proud, and from the long road you can see everything ahead.', scout(3), bondUp(1, 'top')) }),
    ],
  },
];

// ---------- SF157. SEASONAL SET PIECES ----------
const SF157: Json[] = [
  {
    id: 'academy-exam',
    intro: 'Trainer Academy week. An examiner has set up a desk on the road. "Open exam! Three questions, then a battle. Pass, and you leave with a Mastery Shard."',
    choices: [
      ch('Sit it.', fight('Three questions: type matchups, a status rule, and one about patience that makes you think. You answer all three. "Now the practical," says the examiner, and sends out their team.', trainer('Academy Examiner', { cls: 'veteran', size: 3, lv: 1, win: [shard, moment('Passed the Trainer Academy exam.', 40)] }))),
      ch('Watch.', out('You watch the other trainers sit it. You learn a lot from their mistakes, and a little from their nerves.')),
    ],
  },
  {
    id: 'earth-week-cleanup',
    intro: 'Earth Week. Volunteers are clearing litter from a riverbank, and a Wingull is tangled in a plastic ring. "Many hands!" says the organiser.',
    choices: [
      ch('Join (a node).', out('You spend the whole stretch on it: bags and bags of rubbish, and the Wingull, freed, sitting on your head for an hour out of sheer gratitude. The river looks like a river again.', takeNode(1), good(1), flag('kindness'), moment('Spent a day cleaning the riverbank.', 45))),
      ch('Walk on.', leave('You walk on. The volunteers keep going without you.')),
    ],
  },
  {
    id: 'friendship-picnic',
    intro: 'The Friendship Festival. Blankets, sweets and Pokémon everywhere. Someone has left you a seat.',
    choices: [
      ch('Sit.', out('You sit and eat sweets and watch everyone else\'s Pokémon play. It is lovely.', heal(0.25))),
      ch('Bring the team.', out('Your whole team piles onto the blanket, and the afternoon goes by in a heap of crumbs and naps and new friends.', bondUp(1, 'party'))),
    ],
  },
  {
    id: 'harvest-berry-fair',
    intro: 'The Harvest Festival\'s Berry Fair: tables of enormous berries, rosettes, and farmers eyeing each other\'s produce.',
    choices: [
      ch('Enter a Berry.', out('You enter the best berry you have found on the road. It wins a rosette, and ₽300 in prize money.', $(300), moment('Won a rosette at the Berry Fair.', 30)), { chance: 0.5, fail: out('Your berry is very nice. The winning berry is the size of a Snorlax\'s head. You get a participation sticker.') }),
      ch('Judge.', out('They need a judge, and you have an honest face. You taste forty berries, and the winner thanks you with a rare one of their own.', any(...RARE_BERRY))),
    ],
  },
  {
    id: 'pokemon-day-parade',
    intro: 'Pokémon Day! A parade of every kind of Pokémon marching through town with ribbons and drums.',
    choices: [ch('March with them.', out('You march at the front with {starter}, who has never been so proud of anything in its life.', bondUp(1, 'starter'), moment('Marched in the Pokémon Day parade.', 35)))],
  },
  {
    id: 'spring-bloom-guardian',
    intro: 'Spring bloom. A meadow full of Gracidea, and in the middle, the first bloom of the year, glowing faintly. Something small and green is curled up beside it, guarding it.',
    choices: [
      ch('Don\'t pick the bloom.', out('You leave the bloom where it is. The little guardian opens one eye, sees you walking away, and closes it again, content.', good(1))),
      ch('Ask to see it.', out('You kneel and ask, quietly. The little guardian sits up, looks at you a long while, and then moves aside to let you see. The bloom opens in your presence, and the meadow smells of thanks.', flag('sign-shaymin'), moment('Was shown the first bloom of spring.', 55))),
    ],
  },
  {
    id: 'spring-egg-hunt',
    intro: 'Painted eggs hidden all over the meadow. Children everywhere. One egg, you notice, is not painted at all. It is warm.',
    choices: [ch('Hunt.', out('You find three: two painted wooden ones, and one real egg, warm, that seems to lean toward your voice when you speak. You keep that one.', egg(), flag('egg-that-listened'), moment('Found an egg that listens.', 50)))],
  },
  {
    id: 'stargazing-meteor-watch',
    intro: 'Stargazing night. Everyone lying in the grass. A meteor streaks overhead, green and wrong, and comes down somewhere close.',
    choices: [
      ch('Make a wish.', out('You make a wish. You will not say what. Your lead, lying beside you, looks like it made one too.', bondUp(1, 'lead'))),
      ch('Follow where it fell.', out('You follow it into the hills. A crater, still steaming, and in it, a shard of green crystal that hums, and for one second, a shape standing at the edge of the light that is not quite a Pokémon you know. Then it is gone.', item('star-piece'), flag('telling-deoxys'), moment('Followed a falling star.', 55))),
    ],
  },
  {
    id: 'summer-beach-tournament',
    intro: 'Summer Splash. A sandcastle stadium hosts the beach\'s biggest tournament: three rounds, one champion, one Shell Bell.',
    choices: [ch('Enter.', fight('Round one, round two, and the final, in the sun and the spray, with the crowd stamping in the stands.', trainer('Beach Tournament', { cls: 'swimmer', size: 3, lv: 1, chain: 3, win: [item('shell-bell'), moment('Won the beach tournament.', 45)] })))],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF155, ...SF156, ...SF157]);
export const REMOVE: string[] = [];
