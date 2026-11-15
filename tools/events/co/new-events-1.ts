// The 100 new events, Part 1 (NE1 to NE25): Alphas, anomalies, Legendary Signs, Mythical Tellings, Ultra Beasts.
// Script: catalog_overhaul/NEW_EVENTS_1.md. Placement: NEW_EVENTS_PLACED.md, categories 1 to 5.
// Build: npm run co:build -- new-events-1
import { $, anyType, flagAgo, flagAt, bondIs, bondUp, fight, flag, flagIs, item, join, money, out, ptype, room, takeNode, takeNodeBack, trainer, wild, type Json } from '../dsl.ts';
import { GROUP, L, P, after, anyFlag, calmed, ch, has, kind, lose, ne, not, place, promiseStep, rep, repLost, sign, step, teach, telling, temp, variant } from './_ne.ts';

export { CATEGORY } from './_ne.ts';
export const REMOVE: string[] = [];

/** An Alpha fight started from an event (legends thread: `alpha: true` keeps the species unevolved, doubles its HP, gives the Alpha look). */
const alpha = (species: string, lv: number, win: Json[] = [], extra: Json = {}): Json => ({ ...wild({ species: [species], lv, win }), alpha: true, ...extra });
const BERRIES3 = (): Json[] => [item('oran-berry'), item('sitrus-berry'), item('pecha-berry')];
const egg = (absent = false): Json => ({ kind: 'hasEgg', ...(absent ? { absent: true } : {}) });
const quiet = (span: 'stage' | 'region', types?: string[]): Json => ({ kind: 'quietWild', span, ...(types ? { types } : {}) });
/** The Z-Crystal of that Pokémon's first type. */
const Z_BY_TYPE: Record<string, string> = { normal: 'normalium-z', fighting: 'fightinium-z', flying: 'flyinium-z', poison: 'poisonium-z', ground: 'groundium-z', rock: 'rockium-z', bug: 'buginium-z', ghost: 'ghostium-z', steel: 'steelium-z', fire: 'firium-z', water: 'waterium-z', grass: 'grassium-z', electric: 'electrium-z', psychic: 'psychium-z', ice: 'icium-z', dragon: 'dragonium-z', dark: 'darkinium-z', fairy: 'fairium-z' };
const DITTO_BY_TYPE = ['fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'].map((t) => `ditto-delta-${t}`);

// =====================================================================================================================
// CATEGORY 1. ALPHAS
// =====================================================================================================================

const NE1: Json[] = [
  ne(1, 'alpha-who-lost-its-voice', 'The Alpha Who Lost Its Voice', GROUP.alpha, {
    place: { earliest: 'A2', home: 11, window: [8, 14], sits: 'optional', attaches: 'instead', tags: ['forest', 'high'], level: 'A+2', note: 'The two nodes before it play no wild-battle music and the header reads Hush.' },
    tags: ['Pokémon', 'Combat'], rarity: 'rare', cast: ['trainer.hiker'], pokemon: 'exploud', tint: '#16241a', effect: 'none',
  },
  P(
    'The forest has no sound in it. No birds. No wind in the leaves. In a clearing sits a huge Exploud with its mouth wide open, and nothing comes out.',
    'Small Whismur sit round it in a ring, waiting to be led. It tries to roar. A dry hiss. The smallest Whismur flinches anyway, out of habit, and then looks ashamed of itself.',
    L('Ranger Odalric: "Three days like this. It shouted down a rockslide to save them. Tore something."', 'Ranger Odalric: "An Alpha that can\'t call its herd isn\'t an Alpha for long. Something else will come."'),
    'The Exploud sees you. It stands. It is still twice the height of a house, and it is trying very hard to still look like it.',
  ), [
    ch('Give it a Cheri Berry and honey for its throat.', out(P(
      'You hold the Berry up in both hands, dripping with honey. The great head comes down, slowly, and it drinks like something that has been thirsty for three days.',
      'It tries again. A croak. Then a note: thin, cracked, and the most beautiful thing the clearing has ever heard. The Whismur cheer until they fall over.',
      'Odalric presses a Throat Spray into your hand, and the Exploud leans down and shows one of your team how a voice is meant to be used.',
    ), lose('cheri-berry'), lose('honey'), calmed(), flag('exploud-healed'), item('throat-spray'), teach('hyper-voice')), { requires: [has('cheri-berry'), has('honey')], pick: {} }),
    ch('Let one of my Pokémon call for it.', out(P(
      'Your Pokémon steps into the ring, fills its chest and roars for the one who can\'t. The sound rolls out through the trees, and from every side the herd comes running.',
      'The Exploud listens to its own herd gather on somebody else\'s voice. Then it bows its huge head to your Pokémon, low, the way an Alpha bows to nobody.',
      'Odalric finds a Throat Spray in his pack for you. Your Pokémon has learned something about being heard.',
    ), calmed(), bondUp(2, 'picked'), item('throat-spray'), teach('hyper-voice')), { pick: { moveFlag: 'sound' } }),
    ch('Battle it.', fight(
      'It can\'t use a single sound move. It plants its feet in front of the Whismur and fights anyway.',
      alpha('exploud', 2, [flag('exploud-beaten'), room('ne01-the-alpha-whismur')], { rule: { foeNoFlag: 'sound' } }),
    )),
  ], [
    variant('odalric-honey', [flagIs('kind-helped-stranger')], {
      notice: L('Odalric already has the honey out, and a Cheri Berry beside it.', 'Ranger Odalric: "Thought you might."'),
      hide: [0],
      addChoices: [ch('Give it the Berry and honey Odalric holds out.', out(P(
        'You take the jar from his hands and hold it up. The great head comes down, slowly, and it drinks like something that has been thirsty for three days.',
        'It tries again. A croak. Then a note: thin, cracked, and the most beautiful thing the clearing has ever heard. The Whismur cheer until they fall over.',
        'Odalric presses a Throat Spray into your hand, and the Exploud leans down and shows one of your team how a voice is meant to be used.',
      ), calmed(), flag('exploud-healed'), item('throat-spray'), teach('hyper-voice')), { pick: {} })],
    }),
  ]),
  step(1, 'ne01-the-alpha-whismur', 'The Alpha Whismur', GROUP.alpha, { pokemon: 'whismur', tint: '#16241a' },
    P('The Exploud sits down hard, beaten, breathing like a bellows. The ring of Whismur doesn\'t scatter.', 'One of them steps out in front of it. It is bigger than the rest, and its eyes are red, and it is shaking, and it does not move aside.'), [
      ch('Catch the Alpha Whismur.', fight('It opens its mouth. It has the voice the big one lost.', alpha('whismur', 0))),
      ch('Leave it with its herd.', out('You lower the Ball. The small Alpha stands guard over the big one until you are out of sight, and for a good while after.')),
    ]),
  after(1, 'ne01-the-roar', 'A Roar Across the Valley', GROUP.alpha, [flagIs('exploud-healed'), place({ regionEnd: true })], { minStage: 3, pokemon: 'exploud', tint: '#1a2a20' },
    P('You are almost out of the valley when it comes: a roar, rolling down from the forest behind you, whole and enormous. Every bird in a mile goes up at once.', 'It isn\'t a warning. Along the road ahead, wild Pokémon lift their heads, look at you, and stay exactly where they are.'), [
      ch('Raise a hand to the forest.', out('The roar comes once more, shorter. The wild Pokémon on the road ahead are friendly today.', temp('The wild Pokémon ahead are friendly', 1, 'wild', { kind: 'captureMultiplier', value: 2.5 }))),
    ]),
];

const NE2: Json[] = [
  ne(2, 'two-alphas-one-river', 'Two Alphas, One River', GROUP.alpha, {
    place: { earliest: 'A4', home: 12, window: [10, 15], sits: 'must-see', attaches: 'instead', tags: ['water'], level: 'A+1, then A+2', note: 'Must-see when drawn: the river crosses every path. While the channel is dug, both Alphas watch from the background of that node.' },
    tags: ['Pokémon', 'Combat'], rarity: 'rare', cast: ['trainer.fisherman'], pokemon: 'feraligatr', tint: '#10283a',
  },
  P(
    'The river is the only water for miles. On the east bank stands an Alpha Feraligatr. On the west bank, an Alpha Ludicolo. Neither is drinking.',
    'Small Pokémon line both banks, thirsty, afraid to come down. A Marill takes one step toward the water and two steps back.',
    L('Fisher Jacinta: "They\'ve stood like that since the dry spell. Whoever blinks loses the river."', 'Fisher Jacinta: "If you calm one, the other takes it all. If you calm neither, nothing drinks."'),
    'Both Alphas turn their heads, very slowly, and look at you.',
  ), [
    ch('Calm the Feraligatr.', out(P(
      'You walk down the east bank with your hands open. It takes a long time. At last the great jaw lowers, and the Feraligatr drinks.',
      'On the far side the Ludicolo watches, turns, and leads its herd away upstream, into harder country. One small Lotad looks back at the water the whole way.',
      'The Feraligatr noses a Mystic Water out of the shallows and leaves it at your feet.',
    ), calmed(), flag('river-feraligatr'), item('mystic-water'))),
    ch('Calm the Ludicolo.', out(P(
      'You wade the ford with your hands open. It takes a long time. At last the Ludicolo\'s shoulders drop, and it bends and drinks.',
      'On the far side the Feraligatr watches, turns, and leads its herd away upstream, into harder country. A Totodile at the back keeps looking over its shoulder.',
      'The Ludicolo pulls a Big Root from the bank and holds it out to you, formally, like a gift between neighbours.',
    ), calmed(), flag('river-ludicolo'), item('big-root'))),
    ch('Dig a second channel (a node, and a Ground- or Water-type).', out(P(
      'A long afternoon. Your Pokémon digs and you carry, and both Alphas stand over the work like two foremen who hate each other.',
      'Fisher Jacinta: "They\'ve stopped glaring at each other. They\'re glaring at you. It\'s an improvement."',
      'The river forks. Both herds drink, a hundred metres apart, pretending not to see each other. A Mystic Water and a Big Root are left on the new bank, one from each side.',
    ), takeNode(), calmed(2), flag('river-shared'), item('mystic-water'), item('big-root')), { requires: [anyType('ground', 'water')] }),
    ch('Battle both.', fight('The Feraligatr comes off the east bank first.', alpha('feraligatr', 1, [room('ne02-the-second-alpha')]))),
  ], [
    variant('dug-before', [anyFlag('spring-flood-dug', 'flood-sandbagged')], {
      notice: 'Jacinta looks at your hands, and at the callus a spade leaves.',
      hide: [2],
      addChoices: [ch('Dig a second channel (a Ground- or Water-type).', out(P(
        'Fisher Jacinta: "You\'ve done this before."',
        'You have. The cut goes where the ground wants it, and it is done before the heat of the day. Both Alphas watch the whole time, and neither of them blinks.',
        'The river forks. Both herds drink, a hundred metres apart, pretending not to see each other. A Mystic Water and a Big Root are left on the new bank, one from each side.',
      ), calmed(2), flag('river-shared'), item('mystic-water'), item('big-root')), { requires: [anyType('ground', 'water')] })],
    }),
  ]),
  step(2, 'ne02-the-second-alpha', 'The Second Alpha', GROUP.alpha, { pokemon: 'ludicolo', tint: '#10283a' },
    P('The Feraligatr is down. For one breath the river is quiet, and the small Pokémon on the banks edge toward the water.', 'Then the Ludicolo steps down off the west bank. It has watched the whole fight. It has decided the river is still worth it.'), [
      ch('Face the Ludicolo.', fight('It doesn\'t dance. Not today.', alpha('ludicolo', 2, [flag('river-emptied'), quiet('region', ['water'])]))),
    ]),
];

const NE3: Json[] = [
  ne(3, 'alpha-that-follows', 'The Alpha That Follows at a Distance', GROUP.alpha, {
    place: { shape: 'Region', earliest: 'A3', home: 'Beats at steps 6, 12 and 18 of three stages of one region', sits: 'optional', attaches: 'after', note: 'Beat 1 has no badge (the lead looks back). Beat 2 is at a + node near step 12. Beat 3 is at step 18 of the third stage; she never blocks: on a path that misses it, the gate is the + node after the Gym.' },
    tags: ['Pokémon', 'Story'], rarity: 'rare', pokemon: 'arcanine', tint: '#2a2216',
  },
  P(
    'Something large has been on the ridge behind you for two stages. It never comes closer. It never leaves. Your lead keeps looking back.',
    'An Alpha Arcanine, scarred, grey at the muzzle. When you look straight at it, it lies down and studies the grass, as if it hadn\'t been following at all.',
  ), [
    ch('Leave food at the edge of camp.', out('You set a bowl down where the firelight ends and walk away from it. In the morning the bowl is empty, and it has been licked clean, and it has been carried ten paces closer to your bedroll.', flag('sienna-met'), flag('sienna-fed'))),
    ch('Shout at it to go.', out('You shout. It gets up, walks to the far side of the ridge, and lies down again where you can only see its ears. It doesn\'t go.', flag('sienna-met'), flag('sienna-shouted'))),
    ch('Ignore it.', out('You walk on. So does it, a ridge behind, at exactly your pace.', flag('sienna-met'))),
  ]),
  after(3, 'ne03-she-stands-between', 'The Arcanine in the Dark', GROUP.alpha, [flagIs('sienna-met')], { minStage: 4, stop: 'rest', pokemon: 'arcanine', tint: '#141018' },
    P(
      'Night. A pack of wild Houndoom has your camp cornered: a ring of low eyes, closing. Your team bunches up round the fire.',
      'The old Arcanine walks out of the dark and stands between. It doesn\'t fight. It doesn\'t growl. It just stands there, grey and scarred and very large.',
      'One by one, the Houndoom leave.',
    ), [
      ch('Thank it.', out('You say it out loud. One ear turns your way. It stays until the fire burns down, facing outward, and it is gone before you wake.', flag('sienna-stood'))),
      ch('Offer a Poké Ball.', out('You hold a Ball out on your open hand. It looks at the Ball, and then at you, the way you\'d look at someone who has mistaken you for somebody else. It stays until dawn all the same.', flag('sienna-stood'))),
      ch('Ask it why.', out('It can\'t tell you. It looks down the road ahead, toward the region\'s gate, for a long time. Then it lies down with its back to your fire, keeping watch.', flag('sienna-stood'))),
    ]),
  after(3, 'ne03-sienna-at-the-gate', 'Sienna at the Gate', GROUP.alpha, [flagIs('sienna-stood'), place({ regionEnd: true })], { minStage: 5, pokemon: 'arcanine', tint: '#2a2216' },
    P(
      'She is lying at the region\'s gate when you reach it, chin on her paws, watching the road beyond.',
      L('Bartholomew: "That\'s Sienna. She walked a trainer to this gate, forty years back. He never came out the other side."', 'Bartholomew: "She walks everyone who reminds her of him. Then she goes back and waits."'),
      'The old man at the gate says it kindly. He has plainly said it before.',
    ), [
      ch('Come with me, Sienna.', out(P(
        'She looks at the gate for a long time. Forty years of looking. Then she gets up, stiffly, and comes to stand at your side.',
        'She won\'t go in a Ball. She has never been in one. She walks.',
      ), flag('sienna-joined'), join({ species: ['arcanine'], lv: 5 }))),
      ch('Wait here. I\'ll come back through.', out('She lies back down at the gate, and this time she is facing the way you are going. Bartholomew takes his hat off.', flag('sienna-waits'))),
      ch('He isn\'t coming, Sienna. Go home.', out('She howls, once. It goes on a long time. Then she goes, slowly, the way she came, and she doesn\'t look back at the gate. Not once.', calmed())),
    ], [
      variant('shouted-at-her', [flagIs('sienna-shouted')], { notice: 'She came anyway, that night with the Houndoom. But she keeps her distance from you now, and her eyes on the gate.', hide: [0] }),
    ]),
];

const NE4: Json[] = [
  ne(4, 'crowned-calf', 'The Crowned Calf', GROUP.alpha, {
    place: { earliest: 'A3', home: 9, window: [7, 12], sits: 'optional', attaches: 'instead', level: 'A+1', note: 'Normal, Ground or Grass stages. While she is taught, the chosen Pokémon is out of the party for that node and comes back with one more Bond.' },
    types: ['normal', 'ground', 'grass'], requires: [{ kind: 'stageTypes', types: ['normal', 'ground', 'grass'] }],
    tags: ['Pokémon', 'Combat'], rarity: 'rare', cast: ['trainer.aroma_lady'], pokemon: 'miltank', tint: '#2a2a14',
  },
  P(
    'A herd of Tauros has formed a ring. In the middle isn\'t a bull. It\'s a very small Alpha Miltank calf with red eyes, and the bulls are bowing to it.',
    L('Herder Ximena: "Born Alpha. Never seen it. The herd follows her, and she\'s two weeks old. She leads them in circles."', 'Herder Ximena: "She walked them into a ravine yesterday. They went, because she\'s the Alpha."'),
    'The calf stamps one small hoof. Thirty Tauros stamp.',
  ), [
    ch('Teach her (a node; choose a Pokémon to walk beside her).', out(P(
      'Your Pokémon walks the herd to water and back, and the calf trots beside it. It copies everything: the pace, the turn of the head, the stop at the top of the rise.',
      'She learns one thing. Look first. At the ravine\'s edge she stops, and thirty Tauros stop behind her, and Ximena lets out a breath she has been holding since yesterday.',
      'Ximena fills your arms with Moomoo Milk. A young Tauros, with nobody left to follow in circles, decides to follow you.',
    ), takeNode(), flag('calf-taught'), bondUp(3, 'picked'), item('moomoo-milk', 3), join({ species: ['tauros'] })), { pick: {} }),
    ch('Calm her with Moomoo Milk.', out(P(
      'She drinks the whole bottle, hiccups, and falls asleep standing up. The oldest bull looks at her, and then at the herd, and quietly takes the lead while she grows.',
      'Ximena fills your arms with more Moomoo Milk than you gave. A young Tauros, bored of circles, decides to follow you.',
    ), lose('moomoo-milk'), calmed(), item('moomoo-milk', 3), join({ species: ['tauros'] })), { requires: [has('moomoo-milk')] }),
    ch('Battle the herd\'s champion for the lead.', fight('The biggest bull steps out of the ring and lowers his horns. The calf watches with enormous interest.', wild({ species: ['tauros'], lv: 1, win: [flag('herd-led'), quiet('stage', ['normal', 'ground', 'grass']), item('moomoo-milk', 3), join({ species: ['tauros'] })] }))),
  ], [
    variant('little-league', [flagIs('little-league-look-after')], {
      notice: 'You have taught small ones to look after each other before. It shows in how you stand.',
      hide: [0],
      addChoices: [ch('Teach her (choose a Pokémon to walk beside her).', out(P(
        'It takes no time at all. Your Pokémon walks, the calf copies, and at the ravine\'s edge she stops and looks first, and thirty Tauros stop behind her.',
        'Ximena fills your arms with Moomoo Milk. A young Tauros, with nobody left to follow in circles, decides to follow you.',
      ), flag('calf-taught'), bondUp(3, 'picked'), item('moomoo-milk', 3), join({ species: ['tauros'] })), { pick: {} })],
    }),
  ]),
  after(4, 'ne04-the-herd-makes-way', 'The Herd Makes Way', GROUP.alpha, [flagIs('calf-taught'), place({ lastRegion: true })], { minStage: 6, pokemon: 'miltank', tint: '#2a2a14' },
    P('The road is blocked from hedge to hedge: Tauros, a hundred of them, and at the front a full-grown Alpha Miltank with red eyes.', 'She looks at you. She looks at the road behind you, and the road ahead. She looks first. Then she steps aside, and the whole herd makes way.'), [
      ch('Walk through.', out('You walk the length of the herd. Not one bull moves until she does. At the far end you look back, and she is already leading them to water, in a straight line.', bondUp(1, 'party'))),
    ]),
];

const NE5: Json[] = [
  ne(5, 'alpha-of-the-empty-nest', 'The Alpha of the Empty Nest', GROUP.alpha, {
    place: { earliest: 'A3', home: 14, window: [11, 17], sits: 'side-branch', attaches: 'instead', tags: ['high'], level: 'A+2', note: 'A side branch: the nodes "Sit" takes are the branch\'s own, so the slow choice costs the least here.' },
    tags: ['Pokémon', 'Combat'], rarity: 'rare', cast: ['trainer.hiker'], pokemon: 'braviary', tint: '#1c2634',
  },
  P(
    'A huge Alpha Braviary circles a nest on the cliff. The nest is empty. It has been empty a long time; the sticks are grey.',
    'It dives at anything that comes near: you, a Wingull, a leaf.',
    'Climber Lazarus: "Egg thieves, two summers back. It\'s guarded nothing ever since."',
    'In your bag, something shifts. If there is an egg in there, the Braviary has noticed.',
  ), [
    ch('Sit below the nest until it lands (a node).', out(P(
      'You sit. It dives at you four times and you don\'t move. The afternoon goes. The light goes gold.',
      'At dusk it lands beside you, close enough to touch, and folds its wings. It doesn\'t look at the nest. Neither do you.',
      'When you get up to go, there is a Sharp Beak on the rock where it sat, and one long feather for your hat.',
    ), takeNode(), calmed(), item('sharp-beak'), flag('braviary-feather'))),
    ch('Show it an egg from my bag.', out(P(
      'You hold the egg up in both hands. The Braviary goes absolutely still in the air, and then it comes down like something falling.',
      'It tucks the egg under its wing for one night. It doesn\'t sleep. In the morning it gives the egg back, warm, and watches your hands the whole time you pack it.',
      'There is a Sharp Beak on the rock, and one long feather for your hat.',
    ), calmed(), flag('egg-under-wing'), { kind: 'eggWarm', steps: 1, friendship: 5 }, item('sharp-beak'), flag('braviary-feather')), { requires: [egg()] }),
    ch('Battle it.', fight('The wind off the cliff is on its side.', alpha('braviary', 2, [item('sharp-beak'), flag('braviary-feather')], { rule: { foeTailwind: 4 } }))),
  ], [
    variant('took-an-egg', [flagIs('took-egg'), not('egg-returned')], {
      notice: 'It knows. It looks at your bag, and at your hands, and it screams at you until the cliff rings.',
      hide: [0],
      addChoices: [ch('Sit below the nest until it lands (two nodes).', out(P(
        'You sit. It doesn\'t trust you, and it is right not to. It dives at you all afternoon, and all the next morning.',
        'On the second dusk it lands. Not beside you. Near. It folds its wings and looks out to sea.',
        'When you get up to go, there is a Sharp Beak on the rock where it sat, and one long feather.',
      ), takeNode(2), calmed(), item('sharp-beak'), flag('braviary-feather')))],
    }),
    variant('returned-the-egg', [flagIs('egg-returned')], {
      notice: 'It circles once over your head, lower than it comes for anyone. It has heard about an egg that went home.',
      hide: [0],
      addChoices: [ch('Sit below the nest.', out(P(
        'You have barely sat down when it lands beside you, at once, and folds its wings.',
        'It doesn\'t look at the nest. It looks at you, sidelong, for a long time. There is a Sharp Beak on the rock when you go, and one long feather for your hat.',
      ), calmed(), item('sharp-beak'), flag('braviary-feather')))],
    }),
  ]),
  after(5, 'ne05-first-look', 'The Hatchling\'s First Look', GROUP.alpha, [flagIs('egg-under-wing'), egg(true)], { minStage: 4, stop: 'rest', tint: '#1c2634' },
    P('The egg the Braviary kept warm has hatched. You remember now: the shell cracked, and the first thing the hatchling did was look up.', 'Not at you. Up, at the sky, as if somebody had told it where to look.'), [
      ch('Look up with it.', out('There is nothing up there but weather. The hatchling watches it for a while anyway, and then tucks itself against your boot.', bondUp(1, 'newest'))),
    ]),
];

// =====================================================================================================================
// CATEGORY 2. MEGA, DELTA AND Z ANOMALIES
// =====================================================================================================================

const AMPHAROSITE_PRICE = 3000;

const NE6: Json[] = [
  ne(6, 'mega-stone-that-refused', 'The Mega Stone That Refused', GROUP.anomaly, {
    place: { earliest: 'A4', home: 16, window: [14, 18], sits: 'optional', attaches: 'town', note: '"Find the friend" is a node back: the kid with the Flaaffy is one step back, and nothing is refought.' },
    tags: ['Story', 'Relationship'], cast: ['trainer.lacey'], pokemon: 'ampharos', tint: '#2a2430',
  },
  P(
    'A trainer in the square is shouting at her Ampharos. The Mega Stone on its collar is glowing, and the Ampharos won\'t change.',
    L('Trainer Rosamund: "It worked last week! It worked for my brother!"', 'The Ampharos looks at the ground.'),
    'Ezekiel: "Stones don\'t refuse. Pokémon do. Ask it what you did last week."',
    L('The old stone-cutter doesn\'t look up from his chisel.', 'Rosamund: "...I traded its friend away."'),
  ), [
    ch('Help her find the friend (a node back).', out(P(
      'The Flaaffy is two towns back, with a kid who loves it and who listens to the whole story with a very serious face. He\'ll trade it back, fairly: the card is laid on the table, both sides, nothing hidden.',
      'You walk them home. The Ampharos sees the Flaaffy at the end of the street and lights up, tail to ears, before the Stone does anything at all.',
      'Rosamund can\'t speak. She pushes the Ampharosite\'s twin into your hands, the one her brother wore.',
    ), takeNodeBack(), flag('mega-reunited'), item('ampharosite'))),
    ch('Tell her to apologise.', out(P(
      'She kneels in the square, in front of everybody. It takes a while. She isn\'t good at it, and she keeps going anyway.',
      'The Ampharos puts its head on her shoulder. No Mega today. She wipes her face and says that\'s fine. She says it twice, and the second time she means it.',
      'Ezekiel hands you a Soothe Bell from his apron without a word.',
    ), flag('mega-apology'), item('soothe-bell'))),
    ch(`Offer to buy the Stone (₽${AMPHAROSITE_PRICE.toLocaleString('en-US')}).`, out(P(
      'She names a fair price and you pay it. She unclips the Stone from the collar herself.',
      'The Ampharos watches it go from her hand into yours. It doesn\'t make a sound.',
    ), $(-AMPHAROSITE_PRICE), flag('mega-bought'), item('ampharosite')), { requires: [money(AMPHAROSITE_PRICE)] }),
  ], [
    variant('yours-too', [bondIs(2, 'any', true)], { notice: L('Ezekiel looks over your team, one at a time, and stops on one of them.', 'Ezekiel: "Yours too. Not yet."') }),
  ]),
  after(6, 'ne06-rosamund-in-the-circuit', 'Rosamund, Reunited', GROUP.anomaly, [flagIs('mega-reunited')], { minStage: 6, cast: ['trainer.lacey'], pokemon: 'ampharos', tint: '#2a2430' },
    P('A trainer waves at you across the road so hard she nearly drops her bag. Rosamund. She is on the Circuit now.', 'Beside her walk an Ampharos and a Flaaffy, shoulder to shoulder, and the Stone on the collar is already humming.'), [
      ch('Battle her.', fight('"Watch this," she says. "It does it every time now."', trainer('Rosamund', { team: ['flaaffy', 'ampharos'], size: 2, win: [rep()] }))),
      ch('Wave back and walk on.', out('The Ampharos lights its tail for you, twice, like a lighthouse saying hello.')),
    ]),
];

const NE7: Json[] = [
  ne(7, 'delta-in-the-greenhouse', 'The Delta in the Greenhouse', GROUP.anomaly, {
    place: { earliest: 'A2', home: 7, window: [5, 10], sits: 'optional', attaches: 'town', tags: ['forest', 'city'], level: 'A+0' },
    tags: ['Pokémon', 'Story'], cast: ['trainer.aroma_lady'], pokemon: 'roselia-delta', tint: '#16302a',
  },
  P(
    'A greenhouse with fogged glass. Inside, the plants have grown round a Pokémon. It\'s a Roselia, but it\'s the wrong colour, and frost follows its hands.',
    L('Gardener Philippa: "It grew here. I don\'t know how. It can\'t go outside: the sun hurts it."', 'Gardener Philippa: "A researcher offered me money. A lot. She said she\'d \'learn so much.\'"'),
    'The Delta Roselia waters a seedling with ice. The seedling likes it.',
  ), [
    ch('Leave it here, and help shade the glass (a node, and a Grass- or Ice-type).', out(P(
      'You and your Pokémon spend the day on ladders, painting the panes white and hanging reed mats. Philippa hands things up. The Roselia supervises from a flowerpot.',
      'By evening the greenhouse is a winter garden, cool and blue, with frost ferns on every pane. It stays. It was never going anywhere.',
      'It gives you a piece of ice that hasn\'t melted all day, and doesn\'t intend to.',
    ), takeNode(), flagAt('delta-greenhouse'), item('nevermeltice')), { requires: [anyType('grass', 'ice')] }),
    ch('Take it to Linden\'s study, where it\'ll be safe and known.', out(P(
      'Linden meets you at the door with the blinds already drawn. He is careful with it: he asks before he measures, and he writes down what it likes before what it is.',
      'Philippa visits on Thursdays. Your own Delta research is a step further on, and there is a piece of Never-Melt Ice on your desk when you leave.',
    ), flag('delta-studied'), item('nevermeltice'))),
    ch('Let it choose.', out(P(
      'It looks at the door. It looks at you. It looks at Philippa, who is holding a watering can with both hands and trying not to hope out loud.',
      'It walks to her and sits on her boot. She has shown it more kindness than anyone here. She gives you its first frost flower, a piece of ice that won\'t melt.',
    ), item('nevermeltice'))),
  ], [
    variant('black-market-researcher', [flagIs('bought-stolen')], {
      notice: 'The researcher is at the gate again. You know that coat: it\'s the black market\'s. Philippa takes your sleeve and asks, very quietly, if you would see her off.',
      addChoices: [ch('See the researcher off.', fight('"I only want to learn so much," she says, and reaches for a Ball.', trainer('Researcher', { cls: 'scientist', size: 2, win: [flagAt('delta-greenhouse'), item('nevermeltice'), rep()] })))],
    }),
    variant('kind-to-it', [flagIs('kind-total', 3)], {
      hide: [2],
      addChoices: [ch('Let it choose.', out(P(
        'It looks at the door. It looks at Philippa. It looks at you for a long time, the way wild things look at people who have been kind without being asked.',
        'It walks to you and holds up both frosted hands to be carried. Philippa laughs, and cries a little, and packs it a jar of greenhouse soil for the road.',
      ), flag('delta-roselia-joined'), { ...join({ species: ['roselia-delta'] }), moves: ['icy-wind'] }))],
    }),
  ]),
  after(7, 'ne07-snow-flowers', 'A Postcard of Snow Flowers', GROUP.anomaly, [flagIs('delta-greenhouse'), flagAgo('delta-greenhouse')], { minStage: 4, stop: 'rest', pokemon: 'roselia-delta', tint: '#16302a' },
    P('A postcard has found you, a whole region on. A photograph: a greenhouse with white panes, and inside it, flowers made of snow, hundreds of them.', 'On the back, in a gardener\'s square handwriting: "It asks after you. I can tell."'), [
      ch('Keep the postcard.', out('You put it where it won\'t bend. Your team crowds in to look at the picture, and for a moment the whole camp smells of cold glass and green things.', bondUp(1, 'party'))),
    ]),
];

const NE8: Json[] = [
  ne(8, 'z-crystal-for-someone-else', 'A Z-Crystal for Someone Else', GROUP.anomaly, {
    place: { earliest: 'A5', home: 13, window: [10, 16], sits: 'side-branch', attaches: 'instead', tags: ['water', 'eerie'], level: 'A+1', note: 'On a side branch so it can be left: with no Pokémon at Bond 4 the node stays lit for the stage and can be reached once more from the next + node.' },
    repeat: true, requires: [not('z-chosen')],
    tags: ['Pokémon', 'Mystery'], rarity: 'rare', cast: ['trainer.youngster_m'], tint: '#102a34', effect: 'glint',
  },
  P(
    'A Z-Crystal sits on a stone pedestal in the open. Nobody has taken it. Dozens of trainers have clearly tried: the ground is worn smooth around it.',
    L('Kalani: "It burns you if you pick it up. Everybody tries. It\'s not for you."', 'Kalani: "Granddad says it\'s waiting for a Pokémon, not a trainer."'),
    'The kahuna\'s grandson yawns. One of your Pokémon is staring at the crystal.',
  ), [
    ch('Let my Pokémon go to it.', out(P(
      'The one who trusts you most walks up to the pedestal on its own. It looks back at you once. Then it touches the crystal.',
      'The crystal goes cool. The light in it settles, like something that has stopped waiting. Kalani sits up straight for the first time today.',
      'Kalani: "...Huh. Granddad\'s going to want to hear about this."',
    ), flag('z-chosen'), { kind: 'typeItem', who: 'top', table: Z_BY_TYPE }), { requires: [bondIs(4)] }),
    ch('Pick it up myself.', out('It burns. No harm done: just a red hand, a dropped crystal that rolls back to exactly where it was, and Kalani laughing so hard he has to hold the pedestal.')),
    ch('Ask who it\'s for.', out(P('Kalani: "A Pokémon that would do the dance even if no one was watching."', 'He says it like something he has been made to learn by heart. Then, grudgingly: one that trusts its trainer nearly all the way. Bond 4, the old people call it.'))),
  ], [
    variant('not-yet', [bondIs(4, 'any', true)], {
      hide: [0],
      addChoices: [ch('Let my Pokémon go to it.', out(P(
        'Your Pokémon walks up to the pedestal, sniffs the crystal, sneezes, and backs away. The light inside doesn\'t change.',
        'Kalani: "Told you. It\'ll keep. Come back when one of them means it."',
        'The crystal stays where it is. It will be here for a while yet.',
      )))],
    }),
  ]),
  after(8, 'ne08-the-kahuna-nods', 'An Old Man in the Crowd', GROUP.anomaly, [flagIs('z-chosen')], { minStage: 6, tint: '#102a34' },
    P('The first time your Pokémon\'s Z-Power lights the field, you see him: an old man at the back of the crowd, in a flowered shirt, with Kalani\'s chin.', 'He isn\'t watching the move. He is watching your Pokémon\'s face while it does the dance. He nods, once, slowly.'), [
      ch('Nod back.', out('By the time the dust settles he is gone. Kalani is standing where he stood, pretending he wasn\'t impressed.', bondUp(1, 'top'))),
    ]),
];

const NE9: Json[] = [
  ne(9, 'mega-that-wont-come-down', 'The Mega That Won\'t Come Down', GROUP.anomaly, {
    place: { earliest: 'A5', home: 15, window: [12, 17], sits: 'must-see', attaches: 'before', tags: ['storm'], level: 'A+2', note: 'The header reads Storm for three steps round it. Waiting it out ends the storm for the rest of the stage.' },
    tags: ['Pokémon', 'Combat', 'Survival'], rarity: 'rare', cast: ['trainer.lacey', 'trainer.youngster_m'], pokemon: 'manectric-mega', tint: '#141a30', effect: 'rain',
  },
  P(
    'Lightning has been striking the same hill for an hour. On top of it, a wild Mega Manectric, with no trainer and no Stone, can\'t stop.',
    L('Storm chaser Ada: "It\'s stuck in the form. The storm\'s feeding it. It\'s burning itself out."', 'Kip: "When the storm goes, it goes. Maybe for good."'),
    'It howls. The howl is tired.',
  ), [
    ch('Ground it (a Ground-type takes the lightning).', out(P(
      'Your Ground-type climbs the hill and plants itself beside the Manectric. The next bolt comes down, and goes through it into the earth, and the next, and the next.',
      'The lightning has somewhere to go at last. The Manectric shrinks, shudders, and sleeps with its head across your Pokémon\'s feet.',
    ), flag('mega-grounded'), bondUp(2, { types: ['ground'] })), { requires: [ptype('ground')] }),
    ch('Wait out the storm with it (two nodes).', out(P(
      'You sit on the hill in the rain where it can see you, and you stay. It is a long storm. Twice you think it has gone out.',
      'It survives, barely. When the clouds break it comes down off the hill after you, limping, half the size it was. In the scorched grass where it stood lies a Manectite.',
    ), takeNode(2), flag('storm-waited'), item('manectite'), { ...join({ species: ['manectric'] }), levelShare: 0.5 })),
    ch('Battle it down.', fight('It doesn\'t want to fight. It can\'t do anything else.', wild({ species: ['manectric-mega'], lv: 2, win: [flag('mega-battled-down'), item('manectite')] }), { kind: 'front', weather: 'rain', columns: 1 })),
  ], [
    variant('good-with-current', [anyFlag('rocket-radio-shorted', 'macro-plug-pulled')], {
      notice: 'Storm chaser Ada: "You\'re good with current. I heard."',
      hide: [0],
      addChoices: [ch('Ground it (a Ground-type takes the lightning).', out(P(
        'Your Ground-type climbs the hill and plants itself beside the Manectric. You show it where to stand: you have done this to bigger machines than a storm.',
        'The lightning goes to earth. The Manectric shrinks, shudders, and sleeps. And in the scorched grass, exactly where you guessed, lies a Manectite.',
      ), flag('mega-grounded'), bondUp(2, { types: ['ground'] }), item('manectite')), { requires: [ptype('ground')] })],
    }),
  ]),
];

const NE10: Json[] = [
  ne(10, 'delta-dittos-question', 'The Delta Ditto\'s Question', GROUP.anomaly, {
    place: { earliest: 'A3', home: 8, window: [4, 16], sits: 'optional', attaches: 'after', level: 'A+0', note: 'It follows the Ditto\'s first meeting by at least five nodes.' },
    requires: [flagIs('delta-ditto-met')],
    tags: ['Pokémon', 'Mystery'], cast: ['trainer.psychic_m'], pokemon: 'ditto-delta', tint: '#2a1c34', effect: 'sparkle',
  },
  P(
    'A Delta Ditto sits on the path in the shape of you. It has got the hat wrong.',
    'It copies your wave. It copies your lead. It copies your lead\'s type, then picks a different one, pleased with itself.',
    'Thaddeus: "It\'s asking you something. They do that. It wants to know what it should be."',
    'The professor\'s aide says it without stopping, like a man who has been asked the same question by a Ditto and didn\'t know either.',
  ), [
    ch('Be whatever you like.', out(P(
      'It thinks. You can see it think: the whole of it ripples. Then it turns into something no one has ever seen: a small, round, happy shape, in a colour and a type of its own choosing.',
      'It stays that way. It looks at you to see if that was allowed. It was.',
    ), flag('ditto-free'), join({ species: DITTO_BY_TYPE }))),
    ch('Be like me.', out(P(
      'It fixes the hat. For a whole stage there are two of you on the road, and one of you can\'t battle, and people say hello to both.',
      'At the stage\'s end it waves, your wave exactly, and goes off the way you didn\'t.',
    ), flag('ditto-twin'))),
    ch('Be like {lead}.', out(P(
      'It copies your lead perfectly, type and all, down to the way it holds its head. Your lead does not like it. Your lead circles it twice, stiff with outrage.',
      'It stands beside your lead for the next fight all the same, a matched pair, and one of the pair is delighted.',
    ), flag('ditto-mirror'), { kind: 'tagPartner', copy: 'lead', battles: 1 })),
  ], [
    variant('elder-ditto', [flagIs('elder-ditto-met')], { notice: 'Before anything else, it turns for a moment into an old, slow, sea-coloured shape you have met before: the elder\'s. A greeting. Then it is you again, with the hat wrong.' }),
  ]),
  after(10, 'ne10-two-of-you', 'Weren\'t There Two of You?', GROUP.anomaly, [flagIs('ditto-twin')], { minStage: 4, cast: ['trainer.fisherman'], tint: '#2a1c34' },
    P('A man mending a net looks up as you pass, looks past you, and frowns.', 'Fisherman: "Weren\'t there two of you?"'), [
      ch('"Only for a while."', out('He nods as if that is a perfectly ordinary thing to hear, and goes back to his net. Your lead looks behind you, just to be sure.', bondUp(1, 'lead'))),
    ]),
];

// =====================================================================================================================
// CATEGORY 3. LEGENDARY SIGNS
// =====================================================================================================================

const BELL_TEXT = (bell: string): string => P(
  'It is nine hundred steps. Your Pokémon takes the hammer and you take her arm, and she tells you about every dawn of sixty years on the way up, and none of them twice.',
  'At the top she strikes the bell herself. One clean note goes out over the whole town. A feather drifts past the window, slowly, the colour of the sunrise.',
  `She doesn\'t see it. You do. She gives you the ${bell} off its hook: "It should go with someone whose knees work."`,
);
const RING_TEXT = (bell: string): string => P(
  'You climb the nine hundred steps alone and strike it. It rings wrong: flat, and late, and twice.',
  'Far below, on step forty, an old woman laughs until she has to hold the rail.',
  `Oighrig: "It\'ll forgive you." She sends the ${bell} down the road after you with a boy who runs.`,
);

const NE11: Json[] = [
  ne(11, 'bell-ringers-last-morning', 'The Bell Ringer\'s Last Morning', GROUP.legend, {
    place: { earliest: 'A3', home: 2, window: [1, 4], sits: 'optional', attaches: 'town', tags: ['high', 'eerie'], note: 'A dawn event: the header must read Morning, so it sits in the first four steps. If she is carried, the bell is heard at every node for the rest of the stage, quieter each time.' },
    requires: [anyFlag('blessing-ho-oh', 'blessing-lugia'), { kind: 'period', in: ['morning'] }],
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.aroma_lady'], tint: '#3a2a1c',
  },
  P(
    'An old woman is climbing a tower with a hammer. There are nine hundred steps. She is on step forty, sitting down.',
    L('Bell ringer Oighrig: "Every dawn for sixty years. It hears. I know it hears. It never comes."', 'Bell ringer Oighrig: "My knees say this is the last one. Carry the hammer? I\'ll tell you when to strike."'),
  ), [
    ch('Carry the hammer, and her (a node, and a Fighting- or Flying-type).', out(BELL_TEXT('Clear Bell'), takeNode(), sign(), flag('bell-oighrig'), item('clear-bell')), { requires: [anyType('fighting', 'flying')], branches: [{ when: [flagIs('blessing-lugia')], text: BELL_TEXT('Tidal Bell'), effects: [takeNode(), sign(), flag('bell-oighrig'), item('tidal-bell')] }] }),
    ch('Ring it for her.', out(RING_TEXT('Clear Bell'), sign(), item('clear-bell')), { branches: [{ when: [flagIs('blessing-lugia')], text: RING_TEXT('Tidal Bell'), effects: [sign(), item('tidal-bell')] }] }),
    ch('Tell her it isn\'t coming.', out(P('She looks at you for a moment. Then she smiles, picks up the hammer, and gets to her feet one knee at a time.', 'Bell ringer Oighrig: "No. But I am."', 'She climbs anyway. You hear the bell from the road, a long while later. It is on time.'))),
  ], [
    variant('keeps-lights', [anyFlag('lighthouse-lit', 'crossing-lamp-lit')], { notice: 'Bell ringer Oighrig: "You keep lights. I can tell."' }),
  ]),
];

const NE12: Json[] = [
  ne(12, 'footprint-pond', 'The Footprint Pond', GROUP.legend, {
    place: { earliest: 'A3', home: 10, window: [7, 13], sits: 'optional', attaches: 'after', tags: ['hot'], level: 'A+0' },
    requires: [anyFlag('blessing-groudon', 'blessing-fire', 'blessing-landorus', 'blessing-zygarde')],
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.worker_m'], tint: '#3a2c14',
  },
  P(
    'A pond shaped like a foot. Each toe is the size of a cart. Farmers have built a fence round it and planted beans.',
    'Farmer Wenceslas: "My grandmother\'s grandmother saw it step here. We don\'t drain it. We don\'t deepen it."',
    L('A developer in a clean coat has a folder under his arm and a pen already out.', 'Mr. Ferreira: "It\'s a pond. I\'m offering each of you a year\'s wages."'),
  ), [
    ch('Speak for the pond.', fight(
      'You have barely started when Ferreira\'s guard steps between you and the farmers. Your name doesn\'t carry far enough here to be heard over him.',
      trainer('Ferreira\'s Guard', { cls: 'worker', size: 2, win: [sign(), flag('pond-kept'), ...BERRIES3()] }),
    )),
    ch('Stay out of it.', out(P(
      'The farmers vote, with beans in a hat. It\'s close. A year\'s wages is a year\'s wages.',
      'It goes Ferreira\'s way by two beans. Wenceslas stands at the fence a long time with his hat in his hands.',
    ), flag('pond-sold')), { branches: [{ when: [flagIs('kind-helped-stranger')], text: P('The farmers vote, with beans in a hat. It\'s close. A year\'s wages is a year\'s wages.', 'But they have heard of you: the one who stops for people. Somebody says so out loud, and looks at the pond, and the vote goes the pond\'s way by two beans.'), effects: [flag('pond-kept')] }] }),
    ch('Ask what the pond is worth to them.', out(P(
      'Farmer Wenceslas: "It\'s proof."',
      'He doesn\'t say of what. He doesn\'t need to. Ferreira hears it, and looks at the toes the size of carts, and lowers his voice. Then he closes his folder and leaves.',
      'The farmers fill your hands with beans from the fence.',
    ), sign(), flag('pond-kept'), ...BERRIES3())),
  ], [
    variant('reputation-carries', [flagIs('rep', 3)], {
      hide: [0],
      addChoices: [ch('Speak for the pond.', out(P(
        'You speak, and they listen, because they know who is speaking. Even Ferreira\'s guard takes his hands out of his pockets.',
        'When you finish, nobody reaches for the pen. Ferreira looks at the faces round the fence, closes his folder, and goes.',
        'The farmers fill your hands with beans from the fence.',
      ), sign(), flag('pond-kept'), ...BERRIES3()))],
    }),
    variant('magma-money', [flagIs('team-op-stopped-magma-drill')], { notice: 'You know that folder\'s crest. Ferreira\'s money is Magma\'s, and he knows you know. He is already edging toward his cart.' }),
  ]),
  after(12, 'ne12-the-second-footprint', 'The Second Footprint', GROUP.legend, [flagIs('pond-kept'), { kind: 'weather', in: ['rain'] }], { minStage: 4, tint: '#1c2c34', effect: 'rain' },
    P('Heavy rain, the first in months. Word comes down the road behind you, farm to farm, faster than the water.', 'The foot-shaped pond has overflowed. And the overflow has filled a second hollow nobody knew was there: another footprint, a stride further on, pointing the same way.'), [
      ch('Look the way it was walking.', out('It was walking the way you are going. The whole team is quiet for a while.', sign())),
    ]),
];

const NE13: Json[] = [
  ne(13, 'child-who-draws-it', 'The Child Who Draws It', GROUP.legend, {
    place: { earliest: 'A1', home: 5, window: [3, 9], sits: 'optional', attaches: 'town', note: 'The detail he drew is in the background of a later node of the same stage, exactly as drawn.' },
    requires: [flagIs('blessing-influence', 0)],
    tags: ['Legendary', 'Story'], cast: ['trainer.youngster_m', 'trainer.aroma_lady'], tint: '#2c2a34',
  },
  P(
    'A chalk drawing covers the whole square: the Legendary that watches over this run, drawn by someone who has seen it.',
    L('Anselmo: "It comes to my window. Nobody believes me."', 'His mother: "He says it every night. Please don\'t encourage him."'),
    'She sounds tired, not unkind. The small boy has chalk up to his elbows. The drawing has a detail no book shows.',
  ), [
    ch('I believe you.', out(P('He stares at you. Then he digs in his pocket and gives you his best chalk, the long one, the one he was saving.', 'Anselmo: "For if you see it. So you can draw it too."'), sign(), flag('anselmo-believed'))),
    ch('Ask him what it does at the window.', out(P('Anselmo: "It checks I\'m asleep. Then it goes."', 'He says it as if it were the most ordinary thing a legend could do. Perhaps it is.'), sign())),
    ch('Tell his mother about the detail.', out(P('You point it out: the one thing in the drawing that isn\'t in any book, and couldn\'t be guessed.', 'She looks at the drawing properly for the first time. She looks at her son. Then she sits down on the step, slowly, with her hand over her mouth.'), sign(), rep())),
  ], [
    variant('facing-away', [flagIs('sign-broken')], { notice: 'In the drawing, it is facing away. Anselmo doesn\'t know why he drew it like that. He says that is how it stood at the window last night.' }),
  ]),
  after(13, 'ne13-you-saw-it', 'The Face of Someone Who Saw It', GROUP.legend, [flagIs('anselmo-believed'), flagIs('blessing-influence', 3)], { minStage: 2, cast: ['trainer.youngster_m'], tint: '#2c2a34' },
    P('There is a chalk drawing on the ground here, a long way from any square. The same hand. The same detail no book shows. He was here.', 'Under it, in careful letters: "You saw it. You\'ve got the face of someone who saw it."'), [
      ch('Add to the drawing with his chalk.', out('You draw what you can. It isn\'t as good as his. You leave the chalk beside it for whoever sees it next.', sign())),
    ]),
];

const NE14: Json[] = [
  ne(14, 'two-priests-one-shrine', 'Two Priests, One Shrine', GROUP.legend, {
    place: { earliest: 'A4', home: 14, window: [11, 16], sits: 'side-branch', attaches: 'instead', tags: ['eerie', 'forest', 'high'], note: '"Ask the shrine" takes the next node of the branch: a night\'s vigil, with a priest at each end of the step.' },
    requires: [flagIs('blessing-influence', 0)],
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.psychic_m', 'trainer.hex_maniac'], tint: '#241c2c',
  },
  P(
    'A shrine with two doors. A priest stands at each, and they aren\'t speaking.',
    L('Priest Evaristo: "It\'s a guardian. We honour it with silence."', 'Priestess Domitila: "It\'s lonely. We honour it with songs."'),
    L('They turn to you at the same moment. It is the first thing they have done together in a year.', 'Both: "Settle it."'),
  ), [
    ch('Silence.', out(P('Domitila bows, stiffly, and closes her songbook. The shrine will be quiet for a year.', 'Nothing answers. Perhaps the one it was built for likes company more than they knew. No harm is done; the quiet is only quiet.'), flag('shrine-silence')),
      { branches: [{ when: [not('blessing-company')], text: P('Domitila bows, stiffly, and closes her songbook. The shrine will be quiet for a year.', 'And in the quiet, something settles over the roof like a held breath let go. The one it was built for has always walked alone. It is glad to be left to.'), effects: [flag('shrine-silence'), sign()] }] }),
    ch('Song.', out(P('Evaristo bows, stiffly, and unbars his door. The shrine will sing for a year.', 'Nothing answers. Perhaps the one it was built for prefers its own company. No harm is done; a song is only a song.'), flag('shrine-song')),
      { branches: [{ when: [flagIs('blessing-company')], text: P('Evaristo bows, stiffly, and unbars his door. The shrine will sing for a year.', 'Domitila starts before he has finished bowing. And somewhere above the roof, something that has never once travelled alone turns its head to listen.'), effects: [flag('shrine-song'), sign()] }] }),
    ch('Ask the shrine (a node).', out(P(
      'You sit down between the two doors. The priests look at each other, and then, since neither will leave first, they sit too: one at each end of the step.',
      'At dusk the wind makes a sound in the eaves. It isn\'t a silence. It isn\'t a song. It is neither, and it is plainly an answer, and both of them hear it.',
    ), takeNode(), sign(), flag('shrine-asked'), flag('listened-first'))),
  ], [
    variant('always-waits', [flagIs('listened-first', 2)], { notice: 'Priestess Domitila: "You always wait. Good."' }),
  ]),
  after(14, 'ne14-one-bench', 'Two Priests, One Bench', GROUP.legend, [anyFlag('shrine-asked', 'shrine-silence', 'shrine-song')], { minStage: 5, cast: ['trainer.psychic_m', 'trainer.hex_maniac'], tint: '#241c2c' },
    P('You know those two robes. Evaristo and Domitila are sitting on a roadside bench, sharing it. Not speaking, and not not speaking.', 'There is a bag of roasted chestnuts between them, exactly in the middle.'), [
      ch('Walk past quietly.', out('Domitila hums half a bar. Evaristo lets her.')),
    ]),
];

const NE15: Json[] = [
  ne(15, 'legends-old-trainer', 'The Legend\'s Old Trainer', GROUP.legend, {
    place: { earliest: 'A6', home: 17, window: [15, 18], sits: 'optional', attaches: 'town' },
    requires: [flagIs('blessing-influence', 0)],
    tags: ['Legendary', 'Story'], rarity: 'rare', tint: '#2c2a24',
  },
  P(
    'A very old man feeds birds. One slat of his bench is marked: scorched, or frozen, or cracked. Whatever sat there once was no ordinary thing.',
    L('Zebedee: "It sat here with me. Once. Seventy years ago. I never caught it. I never tried."', 'Zebedee: "People ask why not. You don\'t catch a sunrise."'),
    'Zebedee: "If you see it, tell it the bench is still here."',
  ), [
    ch('I\'ll tell it.', out('He nods. That is all. He goes back to the birds, and his hand is steadier than it was.', sign(), flag('zebedee-message'))),
    ch('Come and tell it yourself.', out(P('He laughs. Then he doesn\'t. He looks at the marked slat, and at his own two hands.', 'Zebedee: "...When?"', 'He is already working out which coat.'), sign(), flag('zebedee-travels'))),
    ch('Why did it sit with you?', out(P('Zebedee: "I was crying. It didn\'t ask why."', 'He has had seventy years to find a better answer. He never needed one.'), sign())),
  ]),
];

// =====================================================================================================================
// CATEGORY 4. MYTHICAL TELLINGS
// =====================================================================================================================

const NE16: Json[] = [
  ne(16, 'wish-already-granted', 'The Wish That Was Already Granted', GROUP.myth, {
    place: { earliest: 'A3', home: 12, window: [9, 16], sits: 'optional', attaches: 'rest', tags: ['night'] },
    tags: ['Legendary', 'Story'], rarity: 'rare', pokemon: 'jirachi', tint: '#141834', effect: 'sparkle',
    requires: [not('promise-broken-jirachi')],
  },
  P(
    'A woman is asleep on a hill with a telescope. A note is pinned to her coat: "If it comes, wake me."',
    'A small light is sitting on the telescope, reading the note.',
    L('The light, in your head: "She wished for her brother to come home. He came home nine years ago. She keeps coming."', 'The light: "Should I wake her?"'),
  ), [
    ch('Wake her.', out('You touch her shoulder. She sees it for one second: one whole second of the thing she has waited nine years to thank. She cries, and says thank you to the sky, over and over, long after it has gone.', telling('jirachi'), flagAt('jirachi-seen'))),
    ch('Let her sleep.', out('The light tucks the note back under its pin, carefully, the way you\'d tuck in a blanket. It sits with her a while longer. Then there is only the hill, and the telescope, and the stars.', telling('jirachi'), flagAt('jirachi-seen'))),
    ch('Ask what she really wants.', out(P('The light: "To have somewhere to go at night."', 'The light thinks about that for a long time. It hadn\'t known that could be a wish. It looks at the sleeping woman as if it were seeing her for the first time.'), telling('jirachi'), flagAt('jirachi-seen'), promiseStep('jirachi'))),
  ]),
  // Remembers "If promise.jirachi.broken: the light isn't there. Only the note." Every base choice needs the light, so this is its own scene that takes NE16's place.
  after(16, 'ne16-only-the-note', 'The Wish That Was Already Granted', GROUP.myth, [flagIs('promise-broken-jirachi'), not('ne16-wish-already-granted-done'), { kind: 'period', in: ['evening', 'night'] }], { minStage: 3, stop: 'rest', pokemon: 'jirachi', tint: '#141834' },
    P('A woman is asleep on a hill with a telescope. A note is pinned to her coat: "If it comes, wake me."', 'Nothing is sitting on the telescope. There is only the note, and the wind turning its corner over and back.'), [
      ch('Pin the note down so it can\'t blow away.', out('You fix it with a second pin from your own collar. She doesn\'t wake. Nothing comes. You go quietly.', flag('ne16-wish-already-granted-done'))),
    ]),
  after(16, 'ne16-the-next-hill', 'The Woman on the Next Hill', GROUP.myth, [flagAgo('jirachi-seen')], { minStage: 5, stop: 'rest', tint: '#141834' },
    P('A region later, on another hill, there is a telescope you know. She is awake this time, with a flask and a second cup.', 'She doesn\'t know your face. She waves anyway, the way people wave who have somewhere to go at night.'), [
      ch('Wave back.', out('She points the telescope at something for you, and pours the second cup.', { kind: 'heal', share: 0.25 })),
    ]),
];

const NE17: Json[] = [
  ne(17, 'time-travellers-garden', 'The Time Traveller\'s Garden', GROUP.myth, {
    place: { earliest: 'A2', home: 9, window: [6, 13], sits: 'side-branch', attaches: 'instead', tags: ['forest'], note: 'The branch has two nodes, Young and Old, and the player can only walk one; the other is seen across the hedge.' },
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.aroma_lady'], pokemon: 'celebi', tint: '#14301c', effect: 'sparkle',
  },
  P(
    'A garden in the forest with rows in three states: seedlings, full bloom, and bare winter stalks, side by side.',
    L('Fidelma, who is young: "I planted these."', 'Fidelma, who is old: "She did. I\'m weeding."'),
    'They have the same hands. Something green flickers between the rows.',
  ), [
    ch('Help the young one plant.', room('ne17-choose-a-seed')),
    ch('Help the old one weed.', out(P('You weed beside her all morning, across the hedge from her own young back. She doesn\'t hurry. She has done this row before.', 'She tells you one thing about the country ahead, plainly, the way you\'d tell someone what the weather did last year.'), telling('celebi'), { kind: 'scout', columns: 6 }, { kind: 'gymPreview' })),
    ch('Ask what grows in the last row.', out(P('Both of them answer, the young one a little before the old one.', 'Fidelma: "Whatever you plant now."'), telling('celebi'))),
  ].map((c, i) => (i === 0 ? { ...c, success: { text: 'She hands you a trowel and a tray of seed packets, each one labelled in a handwriting that gets shakier as you go down the row.', effects: [room('ne17-choose-a-seed')] } } : c))),
  step(17, 'ne17-choose-a-seed', 'A Seed You Choose', GROUP.myth, { cast: ['trainer.aroma_lady'], tint: '#14301c' },
    P('Fidelma: "One seed. Your choice. It\'ll matter."', 'Across the hedge, the old one stops weeding to see which packet you pick. She already knows. She watches anyway.'), [
      ch('Plant an Oran Berry.', out('You press it into the last row and water it in. Something green flickers past your shoulder, and the soil is warm.', flag('garden-planted'), flag('garden-planted-oran'), telling('celebi'))),
      ch('Plant a Sitrus Berry.', out('You press it into the last row and water it in. Something green flickers past your shoulder, and the soil is warm.', flag('garden-planted'), flag('garden-planted-sitrus'), telling('celebi'))),
      ch('Plant a Lum Berry.', out('You press it into the last row and water it in. Something green flickers past your shoulder, and the soil is warm.', flag('garden-planted'), flag('garden-planted-lum'), telling('celebi'))),
    ]),
  after(17, 'ne17-the-tree-by-the-road', 'A Tree With a Carved F', GROUP.myth, [flagIs('garden-planted'), place({ lastRegion: true })], { minStage: 6, tint: '#14301c' },
    P('A full-grown Berry tree stands by the road in the last region, heavy with fruit. It is older than the road.', 'You know the Berry. You planted one, a long way back and not very long ago. There is a letter carved in the bark at the height of a gardener\'s hand: F.'), [
      ch('Pick from your tree.', out('The fruit comes away easily, as if it had been waiting.', item('oran-berry', 4)), { branches: [{ when: [flagIs('garden-planted-sitrus')], text: 'The Sitrus fruit comes away easily, as if it had been waiting.', effects: [item('sitrus-berry', 4)] }, { when: [flagIs('garden-planted-lum')], text: 'The Lum fruit comes away easily, as if it had been waiting.', effects: [item('lum-berry', 4)] }] }),
    ]),
];

const NE18: Json[] = [
  ne(18, 'smallest-guest', 'The Smallest Guest', GROUP.myth, {
    place: { earliest: 'A1', home: 'Any + node', sits: 'optional', attaches: 'rest', note: 'No badge: the extra bowl is an option at the rest, once, with no explanation.' },
    tags: ['Legendary', 'Recovery'], pokemon: 'mew', tint: '#2c1c2c', effect: 'sparkle',
  },
  P(
    'The team\'s food is being eaten by something nobody can see. The bowls empty a bite at a time.',
    'Your lead growls at the air. The air giggles.',
    'A pink tail, for a blink.',
  ), [
    ch('Put out an extra bowl.', out('You fill one more bowl and set it a little apart. It empties, neatly. In the morning there is a Berry in it that nobody on your team recognises.', telling('mew'), flag('mew-fed'), item('enigma-berry'))),
    ch('Try to catch it.', out('You throw. The Ball closes on nothing at all, rocks once out of politeness, and opens. Laughter, from somewhere above the tent.')),
    ch('Pretend not to notice.', out(P('It gets bolder. It tries every bowl. It sits on your lead\'s head.', 'Your lead, who can see it perfectly well, is furious, and holds still for the whole meal because you asked it to.'), telling('mew'), bondUp(1, 'lead'))),
  ]),
  after(18, 'ne18-the-extra-bowl', 'The Extra Bowl', GROUP.myth, [flagIs('mew-fed')], { minStage: 2, stop: 'rest', pokemon: 'mew', tint: '#2c1c2c', effect: 'sparkle' },
    P('You have got into the habit of putting out one bowl more than you have mouths.', 'This morning the extra bowl is empty again, and licked, and turned upside down like a hat.'), [
      ch('Fill it again.', out('Somewhere just out of sight, something small is pleased with you.', bondUp(1, 'party'))),
    ]),
];

const NE19: Json[] = [
  ne(19, 'nightmare-cure', 'The Nightmare Cure', GROUP.myth, {
    place: { earliest: 'A4', home: 16, window: [13, 18], sits: 'optional', attaches: 'town', tags: ['night', 'eerie'], level: 'A+1', note: 'The Lunar Feather is on the next node, on a windowsill, where somebody has left it for exactly this.' },
    tags: ['Legendary', 'Story'], rarity: 'rare', pokemon: 'darkrai', tint: '#101020', effect: 'rain',
  },
  P(
    'A whole inn is asleep at noon. The innkeeper is asleep at the desk with the pen still moving.',
    'Dr. Adeyemi: "Nobody\'s hurt. They won\'t wake. It\'s standing on the roof."',
    'On the roof, in the rain, a dark shape. It looks ashamed.',
  ), [
    ch('Talk to it.', room('ne19-on-the-roof')),
    ch('Fetch a Lunar Feather (a node).', out(P('It is on a windowsill down the road, weighted with a stone, as if somebody had left it for exactly this. You carry it back through the rain.', 'They wake, all at once, in the middle of their sentences. The shape on the roof leaves, quickly, without looking back. The doctor shakes your hand for a long time.'), takeNode(), rep(), item('lunar-wing'))),
    ch('Battle it.', fight('It doesn\'t fight back much.', wild({ species: ['darkrai'], lv: 1, win: [flag('darkrai-driven')] }), { kind: 'front', weather: 'rain', columns: 1 })),
  ].map((c, i) => (i === 0 ? { ...c, success: { text: P('You climb out of a top window onto the tiles. It doesn\'t run. It can\'t help it: wherever it goes, they sleep, and dream badly.', 'It came to the inn because it was raining.'), effects: [telling('darkrai'), flag('darkrai-heard'), room('ne19-on-the-roof')] } } : c))),
  step(19, 'ne19-on-the-roof', 'On the Roof', GROUP.myth, { pokemon: 'darkrai', tint: '#101020', effect: 'rain' },
    P('The rain comes down on both of you. Under the tiles, forty people breathe slowly.', 'It looks at the road, and at the sky, and at you. It will go if you say so. It always goes.'), [
      ch('Stand on the roof with it until the rain stops.', out(P('You stand. It stands. Neither of you says anything, which suits it.', 'At dusk the rain stops, and the inn wakes on its own, yawning, with no memory of any dream at all. When you look round, you are alone on the roof.'), promiseStep('darkrai'), flag('darkrai-roof'))),
      ch('Tell it you understand, and climb down.', out('It watches you go. When the rain eases it slips away over the rooftops, and the inn wakes slowly behind it.')),
    ]),
  after(19, 'ne19-the-bad-dream', 'A Bad Dream', GROUP.myth, [flagIs('darkrai-driven')], { minStage: 5, stop: 'rest', tint: '#101020' },
    P('You sleep badly. So does your lead: it twitches and whimpers at the foot of your bedroll, chasing or chased.', 'You know whose dream this is. You drove it off a roof in the rain.'), [
      ch('Sit up with your lead until it passes.', out('Morning comes eventually. The rest of the team is rested. Your lead is not: it got nothing from this night but your hand on its back.', { kind: 'heal', share: 1 }, { kind: 'damage', share: 0.3, who: 'lead' })),
    ]),
];

const NE20: Json[] = [
  ne(20, 'bouquet-road', 'The Bouquet Road', GROUP.myth, {
    place: { earliest: 'A2', home: 7, window: [5, 11], sits: 'optional', attaches: 'after', tags: ['forest', 'hot'], note: 'Flowers come up behind the player on the map itself: that stretch of path turns green and stays green for the stage.' },
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.worker_m'], pokemon: 'shaymin', tint: '#1c3018',
  },
  P(
    'A road paved with flowers, growing out of a burnt hillside. They end at a small green hedgehog-shaped lump that is fast asleep.',
    L('Captain Berengaria: "Burnt black last month. Then this. It\'s walked the whole fire line."', 'Captain Berengaria: "It\'s worn out. Someone should carry it the last stretch."'),
    'The firefighter leans on her spade. She would do it herself, but her hands are black to the wrist, and it is very clean.',
  ), [
    ch('Carry it (a node).', out(P('It weighs nothing. It doesn\'t wake. You carry it up the last of the fire line, and where you step, flowers come up through the ash behind you.', 'At the top it yawns, climbs down, and leaves a Gracidea in your hand as if it were paying a fare.'), takeNode(), telling('shaymin'), flag('shaymin-carried'), item('gracidea'))),
    ch('Let a Pokémon carry it.', out(P('Your Pokémon carries it the last stretch on its back, stepping as if it were carrying water.', 'When it wakes, it tucks a flower behind your Pokémon\'s ear. The flower doesn\'t wilt. It isn\'t going to.'), telling('shaymin'), bondUp(2, 'picked'), flag('flower-behind-ear')), { pick: {} }),
    ch('Let it rest.', out('You leave it sleeping. An hour on, it wakes, thanks nobody, and walks the last stretch itself, with the flowers following.', telling('shaymin'))),
  ]),
];

// =====================================================================================================================
// CATEGORY 5. ULTRA BEASTS
// =====================================================================================================================

const NE21: Json[] = [
  ne(21, 'beast-that-came-through-small', 'The Beast That Came Through Small', GROUP.ultra, {
    place: { earliest: 'A5', home: 10, window: [6, 15], sits: 'optional', attaches: 'after', note: 'The Beast rides in the player\'s hood, the Fire-type walks beside, and the tear is over that node at midnight.' },
    tags: ['Legendary', 'Pokémon'], rarity: 'rare', cast: ['trainer.aroma_lady'], pokemon: 'poipole', tint: '#201434', effect: 'flicker',
  },
  P(
    'A wormhole the size of a coin hangs over a puddle. Something has come through it: a Poipole, and it has lost its colour from the cold.',
    L('Hyacinth: "It\'s a juvenile. The hole\'s too small to go back."', 'Hyacinth: "The Foundation wants it boxed. I don\'t."'),
    'Researcher Wicke\'s assistant is holding the box. She hasn\'t opened it.',
  ), [
    ch('Keep it warm until the hole grows (a node, with a Fire-type).', out(P('It rides in your hood, shivering, with your Fire-type walking close beside. By evening its colour has come back, purple first.', 'At midnight the hole is the size of a door. It looks at you, and at the warm one, and goes home.', 'Hyacinth gives you the Beast Ball it never needed.'), takeNode(), flag('beast-sent-home'), bondUp(1, { types: ['fire'] }), item('beast-ball')), { requires: [ptype('fire')] }),
    ch('Take it with me.', out(P('It comes. It watches the sky every night, the wrong part of the sky, where its home isn\'t.', 'It is homesick, and it will fight like it until it trusts you.'), flag('poipole-taken'), { ...join({ species: ['poipole'] }), quirk: 'homesick' })),
    ch('Hand it to the Foundation.', out('Hyacinth closes the box herself, gently. It is safe, and it will be studied. She gives you a Beast Ball and can\'t quite look at you.', flag('beast-boxed'), item('beast-ball'))),
  ]),
];

const NE22: Json[] = [
  ne(22, 'town-that-likes-its-beast', 'The Town That Likes Its Beast', GROUP.ultra, {
    place: { earliest: 'A6', home: 13, window: [10, 16], sits: 'optional', attaches: 'town' },
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.aroma_lady'], pokemon: 'celesteela', tint: '#1c2c24', effect: 'confetti',
  },
  P(
    'A town has built a festival round a Celesteela standing in its field. Children climb it. It has been there since spring.',
    'Mayor Drusilla: "It scares off storms. Tourists love it. We named it Agnes."',
    L('A man in a grey Foundation coat waits until she has gone to say his piece.', 'Mr. Lindqvist: "It\'s rooting. In a year, that field is dead for a century."'),
  ), [
    ch('Tell the town the truth.', out(P('You say it from the bandstand. The town is angry at you, and then at Lindqvist, and then, as the afternoon goes on, quiet.', 'Nobody thanks you today. They will work out what to do. It will take them a while to forgive the one who made them.'), repLost(), flagAt('beast-agnes-truth'))),
    ch('Find a place it can root safely (a node).', out(P('An old quarry, two fields over: bare rock, nothing to kill. The town walks Agnes there in a parade, with the band, and the children riding.', 'The baker: "We\'ll visit. It likes the Tuesday bread."', 'They press a Beast Ball on you that someone won at the coconut shy, and a bag of festival sweets.'), takeNode(), flag('beast-agnes-moved'), item('beast-ball'), item('rare-candy'), item('sweet-heart', 2))),
    ch('Leave them be.', out('The festival goes on. The children climb. The grass round Agnes\'s feet is a little yellower than the grass further out. Someone hands you a Beast Ball from the prize stall, and sweets.', flag('beast-agnes-stays'), item('beast-ball'), item('sweet-heart', 2))),
  ]),
  after(22, 'ne22-the-town-thinks-again', 'The Town Thinks Again', GROUP.ultra, [flagIs('beast-agnes-truth'), flagAgo('beast-agnes-truth')], { minStage: 7, cast: ['trainer.aroma_lady'], tint: '#1c2c24' },
    P('A letter with a mayor\'s seal has followed you into the next region.', '"We moved her to the quarry. It took the whole town and a week. You were right, and we were rude about it. Agnes sends nothing, being a Beast, but the bakery sends this."'), [
      ch('Open the parcel.', out('Tuesday bread, a little stale, and worth it. Word of what you did has got here ahead of you.', rep(2), { kind: 'heal', share: 0.25 })),
    ]),
];

const NE23: Json[] = [
  ne(23, 'paper-samurais-duel', 'The Paper Samurai\'s Duel', GROUP.ultra, {
    place: { earliest: 'A7', home: 15, window: [12, 18], sits: 'side-branch', attaches: 'instead', tags: ['forest', 'high'], level: 'A+2, one on one' },
    tags: ['Legendary', 'Combat'], rarity: 'rare', cast: ['trainer.black_belt_m'], pokemon: 'kartana', tint: '#1c2a1c',
  },
  P(
    'A Kartana stands on a bridge rail. Every blade of grass on the bank has been cut to the same height.',
    'It bows. It points at your lead, then at the bridge.',
    'Kenshiro Vale: "One on one. No switching. It\'s asking nicely."',
    'The passing swordsman keeps his own hands well away from his own sword.',
  ), [
    ch('Accept.', fight('Your lead steps onto the bridge alone. The Kartana bows again, lower.', { ...wild({ species: ['kartana'], lv: 2, win: [flag('kartana-honoured'), item('razor-claw'), item('beast-ball')] }), rule: { noSwitch: true }, lose: [flag('kartana-honoured'), item('razor-claw'), item('beast-ball')], friendly: true })),
    ch('Bow, and decline.', out('You bow. It considers you, bows back, and steps off the rail to let you cross. The grass on the far bank is the same height too.')),
    ch('Send out everyone.', fight('It looks at your whole team lining up. If paper can be disgusted, it is.', wild({ species: ['kartana'], lv: 2, win: [flag('kartana-dishonoured')] }))),
  ], [
    variant('glove-duel', [flagIs('glove-duel-accepted')], { notice: 'Before anything else, it draws a line across the bridge with one arm: the same line somebody once drew for you with a glove.' }),
  ]),
  after(23, 'ne23-the-falling-tree', 'The Falling Tree', GROUP.ultra, [flagIs('kartana-honoured')], { minStage: 8, stop: 'rest', pokemon: 'kartana', tint: '#1c2a1c' },
    P('In the night a dead tree comes down over your camp, the whole length of it, with a crack like the sky breaking.', 'It lands in two halves, one on either side of the fire. The cut is perfectly clean. On the far stump, a small folded shape bows, and is gone.'), [
      ch('Bow to the dark.', out('Your team sleeps the rest of the night between the two halves of the tree, as safe as it has ever been.', { kind: 'heal', share: 0.5 }, bondUp(1, 'party'))),
    ]),
];

const NE24: Json[] = [
  ne(24, 'what-the-guzzlord-left', 'What the Guzzlord Left', GROUP.ultra, {
    place: { earliest: 'A8', home: 6, window: [4, 9], sits: 'must-see', attaches: 'before', level: 'A+1', note: 'The stage\'s map is drawn with a bite out of it: two steps of bare ground. Rebuilding begins to fill it in. Tracking adds a battle on a side branch, with its tail end only.' },
    tags: ['Legendary', 'Story'], rarity: 'rare', cast: ['trainer.worker_m', 'trainer.fairy_tale_girl'], pokemon: 'guzzlord', tint: '#2c2420',
  },
  P(
    'A bite has been taken out of a hill, a barn, and half a road. On the edge of the bite, a family sits on a sofa that is all they have.',
    L('Emeric: "It ate the house. It didn\'t eat us. It looked at us and went round."', 'Odette: "It was crying. Nobody believes me."'),
    'The daughter says it to you, not to her father. She has stopped saying it to him.',
  ), [
    ch('Help them rebuild (a node).', out(P('A wall, then a roof. Your team carries beams. Emeric works without a word and doesn\'t stop until the door hangs straight.', 'Odette gives you her drawing of it: huge, and round, and crying. She has drawn the tears very carefully.'), takeNode(), ...kind(2), flag('guzzlord-rebuilt'), flag('odette-drawing'))),
    ch('Track it.', fight(P('The trail is easy: it is a trench. It ends in a quarry, where something enormous is eating rock, as far from people as it could get.', 'You only catch the tail end of it, and the tail end notices you.'), wild({ species: ['guzzlord'], lv: 1, win: [] }), flag('guzzlord-found'), flag('odette-drawing'))),
    ch('Give them money (₽500).', out('They take it, embarrassed. Emeric counts it twice so he will know exactly what he owes you. Odette gives you her drawing of it, crying, because you didn\'t laugh.', $(-500), ...kind(1), flag('odette-drawing')), { requires: [money(500)] }),
  ]),
  after(24, 'ne24-the-dog-door', 'A Very Large Dog Door', GROUP.ultra, [anyFlag('guzzlord-rebuilt', 'guzzlord-found'), place({ regionEnd: true })], { minStage: 9, cast: ['trainer.fairy_tale_girl'], tint: '#2c2420' },
    P('The house on the edge of the bite is finished: new walls, new roof, the old sofa on the porch.', 'In the back wall there is a dog door. It is twice the height of the front door. Odette painted "IN CASE" over it herself.'), [
      ch('Tell her it\'s a good door.', out('She already knows. She waves until you are out of sight.', ...kind(1))),
    ]),
];

const NE25: Json[] = [
  ne(25, 'beast-in-the-mirror', 'The Beast in the Mirror', GROUP.ultra, {
    place: { earliest: 'A6', home: 12, window: [9, 15], sits: 'optional', attaches: 'after', tags: ['water'] },
    tags: ['Legendary', 'Mystery'], rarity: 'rare', cast: ['trainer.youngster_m'], pokemon: 'nihilego', tint: '#101c34', effect: 'float',
  },
  P(
    'The lake reflects a different sky. Under the surface, a Nihilego drifts, and it is holding something: a child\'s lost hat.',
    'Leopold: "It took my hat. Then it gave my sister\'s ball back. It doesn\'t know which things are ours."',
    'The Nihilego offers the hat to your reflection.',
  ), [
    ch('Reach into the water.', out(P('Your hand goes through your own reflection. It puts the hat into your fingers. Its touch is cold, and for one second you see where it is from: a sky with nothing in it you could name.', 'Leopold gets his hat back, wet. He gives you a strange Ball he found on the shore, and puts the hat on wet.'), flag('nihilego-touched'), item('beast-ball'))),
    ch('Send a Water-type.', out(P('Your Pokémon swims out and takes the hat, gently, from something that lets go as gently. It comes back unharmed, and thoughtful, and looks at the lake for a long time after.', 'Leopold gives you a strange Ball he found on the shore.'), bondUp(1, { types: ['water'] }), item('beast-ball')), { requires: [ptype('water')] }),
    ch('Leave the hat.', out(P('Leopold: "It can keep it. It looks lonely."', 'He shrugs, like someone much older. Under the water, the Nihilego puts the hat on. Leopold gives you a strange Ball he found on the shore: he has no use for it.'), ...kind(1), item('beast-ball'))),
  ]),
  after(25, 'ne25-the-hat', 'The Hat Again', GROUP.ultra, [anyFlag('nihilego-touched', 'ne25-beast-in-the-mirror-done')], { minStage: 8, cast: ['trainer.fairy_tale_girl'], tint: '#101c34' },
    P('A different town, a different child, the same hat. You would know it anywhere: it still has the water mark.', 'Nobody can tell you how she came by it. She says she found it on her windowsill, dry, on a night it rained.'), [
      ch('Say nothing about the lake.', out('She wears it at exactly the angle Leopold did.')),
    ]),
];

export const EVENTS: Json[] = [...NE1, ...NE2, ...NE3, ...NE4, ...NE5, ...NE6, ...NE7, ...NE8, ...NE9, ...NE10, ...NE11, ...NE12, ...NE13, ...NE14, ...NE15, ...NE16, ...NE17, ...NE18, ...NE19, ...NE20, ...NE21, ...NE22, ...NE23, ...NE24, ...NE25];
