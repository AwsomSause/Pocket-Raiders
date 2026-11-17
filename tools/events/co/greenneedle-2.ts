// Greenneedle, part 2: events gn.06 to gn.10 (doc GREENNEEDLE_REWORKED_PLACED_2.md).
// gn.06 Bridge Crossing and the Hidden Village.
// In Kanto the canon space at Cerulean ("Nugget Bridge", cs-kanto-cerulean-bridge) opens the same story; everywhere else the placer puts
// gn-06-bridge on step 10. The old canon sub-scenes are retired (CANON_SPACES_KANTO_MOVED_TO_GREENNEEDLE.md: "The Greenneedle version is the only version").
// Build: npm run co:build -- greenneedle-2
import customSpecies from '../../../src/data/customSpecies.json' with { type: 'json' };
import { ch, fight, flag, heal, item, join, leave, out, room, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, kindness, eitherWay, gev, gn, inside, intel, is, leavePseudo, moment, not, partyHas, pick, regionChanged, rm, roll, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const notRegion = (...ids: string[]): Json => ({ kind: 'gn', test: 'notRegion', types: ids });
const itemEach = (id: string): Json => gn('itemEach', { key: id });
const leadSlowed = (): Json => gn('leadBoost', { type: 'spe', n: -1 });
const cap = (key: string, n: number): Json => gn('capFlag', { key, n });

// =====================================================================================================================
// gn.06  BRIDGE CROSSING AND THE HIDDEN VILLAGE  (a must-see check on step 10; once per region)
// =====================================================================================================================
const BRIDGE_TINT = '#4a3b28';
const GORGE_TINT = '#24402e';
const bridge = (o: Json = {}): Json => ({ tint: BRIDGE_TINT, tags: ['Story', 'Trainer'], ...o });
const gorge = (o: Json = {}): Json => ({ tint: GORGE_TINT, tags: ['Dungeon', 'Story'], ...o });

/** The nine Grass starters of the village, in roll order (1 to 9): its family, its egg move, its episode's first scene. */
const STARTERS = [
  { n: 1, id: 'bulbasaur', name: 'Bulbasaur', family: ['bulbasaur', 'ivysaur', 'venusaur'], egg: 'power-whip', first: 'gn-06-st-bulbasaur' },
  { n: 2, id: 'chikorita', name: 'Chikorita', family: ['chikorita', 'bayleef', 'meganium'], egg: 'ancient-power', first: 'gn-06-st-chikorita' },
  { n: 3, id: 'treecko', name: 'Treecko', family: ['treecko', 'grovyle', 'sceptile'], egg: 'dragon-breath', first: 'gn-06-st-treecko' },
  { n: 4, id: 'turtwig', name: 'Turtwig', family: ['turtwig', 'grotle', 'torterra'], egg: 'superpower', first: 'gn-06-st-turtwig' },
  { n: 5, id: 'snivy', name: 'Snivy', family: ['snivy', 'servine', 'serperior'], egg: 'glare', first: 'gn-06-st-snivy' },
  { n: 6, id: 'chespin', name: 'Chespin', family: ['chespin', 'quilladin', 'chesnaught'], egg: 'belly-drum', first: 'gn-06-st-chespin' },
  { n: 7, id: 'rowlet', name: 'Rowlet', family: ['rowlet', 'dartrix', 'decidueye'], egg: 'confuse-ray', first: 'gn-06-st-rowlet' },
  { n: 8, id: 'grookey', name: 'Grookey', family: ['grookey', 'thwackey', 'rillaboom'], egg: 'fake-out', first: 'gn-06-st-grookey' },
  { n: 9, id: 'sprigatito', name: 'Sprigatito', family: ['sprigatito', 'floragato', 'meowscarada'], egg: 'sucker-punch', first: 'gn-06-st-sprigatito' },
] as const;
type Starter = (typeof STARTERS)[number];

/** Whether the village's starter has chosen the player: its episode done, and Standing 2 (3 when the player already owns one of its family). */
const CHECK_CHOSEN: Json = when('gn-st-trust', { min: 1 }, [
  when('gn-st-family', { min: 0, max: 0 }, [when('village-standing', { min: 2 }, [setTo('gn-st-chose', 1)])]),
  when('village-standing', { min: 3 }, [setTo('gn-st-chose', 1)]),
]);
/** One point of Village Standing (0 to 3). */
const STANDING = (task: string): Json[] => [flag(task), flag('village-standing'), cap('village-standing', 3), CHECK_CHOSEN];
/** The episode went right: it trusts the player. */
const TRUSTED = (s: Starter): Json[] => [setTo('gn-st-trust', 1), flag(`gn-st-${s.id}-trusted`), CHECK_CHOSEN];
/** The episode went wrong: a Miracle Seed, and one more try. */
const FAILED = (s: Starter): Json[] => [
  when('gn-st-failed', { min: 0, max: 0 }, [item('miracle-seed'), scene(s.first)], `The ${s.name} watches you go. Granny Tamsel presses a Miracle Seed into your hand. "It'll let you try once more. Once."`),
  when('gn-st-failed', { min: 1 }, [], `The ${s.name} turns away for good. Some doors only open twice.`),
  flag('gn-st-failed'),
];

/** The fall: the gorge (a chain pseudo stage) begins, with the village's starter rolled once, now. */
const FALL_RESET: Json[] = [
  setTo('village-standing', 0), setTo('gn-st-trust', 0), setTo('gn-st-chose', 0), setTo('gn-st-failed', 0),
  setTo('gn-st-water', 0), setTo('gn-st-snivy-miss', 0), setTo('gn-st-chiko-thanked', 0),
];
const VILLAGE_RESET: Json[] = [setTo('gn-village-sat', 0), ...['pool', 'shrine', 'legend', 'mill', 'hat', 'food'].map((k) => setTo(`gn-village-went-${k}`, 0))];
/** Where you can walk to in the village, each once a visit (the hub's choices): key, label, room, the walk there. */
const VILLAGE_PLACES: [string, string, string, string][] = [
  ['pool', 'Go to the Healing Pool.', 'gn-06-pool', 'You follow the steam, down between the houses.'],
  ['shrine', 'Go to the Berry Shrine.', 'gn-06-shrine', 'You walk out to the edge of the orchard.'],
  ['legend', "Sit by Granny Tamsel's fire.", 'gn-06-legend', 'You find a place by the fire.'],
  ['mill', 'Go to the mill.', 'gn-06-task-mill', 'You walk down to the stopped wheel.'],
  ['hat', 'Talk to the small boy.', 'gn-06-task-hat', 'A small boy is standing very still in the lane, looking at nothing.'],
  ['food', 'Go to the long table.', 'gn-06-task-food', 'Under the trees, they are laying the long table.'],
];
/** Back to the village square (the hub). */
const BACK: Json = scene('gn-06-village');
/** A Berry in the bag, or held by one of the team (gn op `payBerry` takes it). */
const HAS_BERRY: Json = { kind: 'gn', test: 'holdsBerry' };
const FALL: Json[] = [
  flag('kanto-bridge-fell'), flag('gn-bridge-fell-count'),
  pick('gn-village-starter', 1, 1, 1, 1, 1, 1, 1, 1, 1),
  room('gn-06-bank'),
];
/** The crossing: five trainers, one after another. */
const HOLD: Json[] = [flag('gn-bridge-held'), scene('gn-06-span-1')];

const CROSS = (): Json => ch('Step onto the bridge.', out(
  'You put one foot on the first plank. It takes your weight with a long, complaining groan, like an old man getting out of a chair.',
  setTo('gn-bridge-fall', 0),
  when('gn-bridge-held', { min: 0, max: 0 }, [roll('gn-bridge-fall', 50)]),
  when('gn-bridge-held', { min: 1 }, [roll('gn-bridge-fall', 75)]),
  when('gn-bridge-fall', { min: 1 }, FALL_RESET),
  when('gn-bridge-fall', { min: 1 }, VILLAGE_RESET),
  when('gn-bridge-fall', { min: 1 }, FALL, 'A plank goes. Then the rope. The river comes up fast. Dark. Then birdsong, and the smell of woodsmoke, and your lead licking your face.'),
  when('gn-bridge-fall', { min: 0, max: 0 }, HOLD, 'It holds. The ropes are older than they look. Next time, perhaps not.'),
));

const BRIDGE_TEXT = (place: string): string => say(
  `${place}. A rope bridge, slung across a gorge so deep the river at the bottom is only a sound.`,
  'It creaks before you are even on it. The planks are grey with age, and every third one has been mended with something that was not meant to be a plank.',
  'There is no other way across. The road behind you has already decided that for you.',
);

/** The five on the bridge, at A-1. */
const SPAN = [
  { cls: 'youngster', cast: 'youngster_m', name: 'Youngster Ned', line: '"Halfway won\'t do! You have to beat all five of us!"', types: ['normal'] },
  { cls: 'camper', cast: 'camper', name: 'Camper Rosa', line: '"I\'ve stood on this plank since breakfast. Don\'t look down. I did, once."', types: ['ground', 'normal'] },
  { cls: 'bug-catcher', cast: 'bug_catcher', name: 'Bug Catcher Wil', line: '"The bridge sways when you lose. I\'ve lost a lot. I\'m used to it."', types: ['bug'] },
  { cls: 'swimmer', cast: 'swimmer', name: 'Swimmer Jo', line: '"If I fall in, I\'ll be fine. If you fall in... well. Let\'s battle."', types: ['water'] },
  { cls: 'ace-trainer', cast: 'bird_keeper_m', name: 'Ace Trainer Corin', line: '"Four down. I\'m the one they keep for last. Show me why you got this far."', types: ['flying', 'fighting'] },
];

const span = SPAN.map((t, i) => rm(`gn-06-span-${i + 1}`, `The Bridge: ${t.name}`, bridge({ cast: [`trainer.${t.cast}`], effect: 'none' }), say(
  i === 0 ? 'Five people stand along the bridge, spaced out like fence posts, each one waiting for you to reach them.' : `Number ${i + 1} of 5. The bridge sways under you, and the next one is already standing up to meet you.`,
  `**${t.name}:** ${t.line}`,
), [
  ch(i === 4 ? 'Battle the last one.' : 'Battle.', fight(
    'The bridge bounces under both of you as the Pokémon come out. Nobody watching would call this a sensible place for a battle.',
    trainer(t.name, { cls: t.cls, size: 2, types: [...t.types], lv: -1, win: [scene(i === 4 ? 'gn-06-offer' : `gn-06-span-${i + 2}`)] }),
  )),
]));

const OFFER_NO = (): Json => ch('No.', out(
  'He shrugs, as if he had expected nothing else and is only a little sorry about it. He hands over the prize: a Nugget, heavy and cold. **The man:** "Offer stands."',
  item('nugget'), intel(1), moment('A man in a plain coat offered a uniform on the bridge. You said no.', 50),
));
const OFFER_YES = (): Json => ch('Yes.', fight(
  'He grins, too wide. **The man:** "Good. A small test first. Nothing you can\'t handle." His Pokémon is already out, and it is not really trying.',
  trainer('The Man in the Plain Coat', { cls: 'gentleman', size: 1, types: ['poison'], lv: -2, win: [item('nugget'), flag('rocket-recruit-offered'), moment('You said yes to the man on the bridge. He wrote your name down.', 60)] }),
));

const gn06: Json[] = [
  gev('gn-06-bridge', 'Bridge Crossing', bridge({
    stop: 'event', rarity: 'rare', forced: true, types: ['normal', 'water'], effect: 'none', requires: [notRegion('kanto')],
    remembers: [{ id: 'told', when: [is('village-told')], notice: 'At the near end, someone has nailed a new sign to the post. It points straight down. **THE HIDDEN VILLAGE · SOUVENIRS**' }],
  }), BRIDGE_TEXT('A gorge with no name on the map'), [CROSS()]),

  // ---- the crossing ----
  ...span,
  rm('gn-06-offer', 'The Far End', bridge({ cast: ['trainer.gentleman'], effect: 'none' }), say(
    'At the far end, a man in a plain coat is clapping. Slowly. He has been watching the whole way across.',
    '**The man:** "Five for five. We pay well for that. Regular meals. A uniform. Interested?"',
  ), [
    OFFER_NO(),
    OFFER_YES(),
    ch("Who's 'we'?", out(
      'He smiles, and taps the inside of his collar, where a single red letter is stitched. Then he waits, as if you should already know the answer.',
      intel(1), scene('gn-06-offer-again'),
    )),
  ]),
  rm('gn-06-offer-again', 'The Far End', bridge({ cast: ['trainer.gentleman'], effect: 'none' }), say(
    'The letter on his collar is the colour of a warning sign. He sees you looking, and lets you look.',
    '**The man:** "Well? It\'s a simple question."',
  ), [OFFER_NO(), OFFER_YES()]),

  // ---- the gorge: four nodes ----
  rm('gn-06-bank', 'The Bank', gorge({ effect: 'float' }), say(
    'You wake on a bank of round grey stones. The bridge is a thin line against the sky, very far up. Your bag is wet. Your lead is not leaving your side.',
    'Something rustles in the reeds. Then something else. The gorge has noticed you.',
  ), [
    ch('Get up and keep moving.', fight(
      'You get up. Your knees are not sure about it. The reeds part.',
      inside(eitherWay(wild({ types: ['grass', 'water', 'bug'], lv: 0, chain: 2, win: [room('gn-06-narrows')] }))),
    )),
  ]),
  rm('gn-06-narrows', 'The Narrows', gorge({ effect: 'none' }), say(
    'The river runs through a slot in the rock here, fast and white and loud. There is no path along it. There is only across.',
    'A Water-type could carry everyone over. A Flying-type could lift you. Otherwise, it is going to be cold.',
  ), [
    chIf([{ kind: 'partyType', type: 'water' }], 'Let your Water-type carry everyone.', out('It goes in without being asked, and takes you over one at a time, dry as a bone, and looks very pleased with itself on the far side.', room('gn-06-path'))),
    chIf([{ kind: 'partyType', type: 'flying' }], 'Let your Flying-type lift you over.', out('A few strong wingbeats, a moment of nothing under your feet, and then rock. Nobody gets wet. Nobody says anything about how high that was.', room('gn-06-path'))),
    ch('Wade across.', out(
      'The water takes your breath straight out of you. You come out the far side shaking, and your lead is shaking worse. It will start its next battle a step slow.',
      leadSlowed(), room('gn-06-path'),
    )),
  ]),
  rm('gn-06-path', 'The Old Path', gorge({ effect: 'none' }), say(
    'Stone steps, worn into dips, and nobody has swept them for a very long time. Moss in every crack.',
    'At the top of the first flight, a carved post. A leaf. And under the leaf, a hand, held up, palm out. Not *stop*, exactly. More like *wait*.',
  ), [
    ch('Climb the steps.', out('You climb. The steps go on a long way. Nothing stops you. At the top, the smell of woodsmoke.', room('gn-06-mill'))),
  ]),
  rm('gn-06-mill', 'The Mill', gorge({ effect: 'none' }), say(
    'Smoke, first. Then a waterwheel, stopped, with river weed wound through its paddles. Then roofs: low, mossy, close together, like people keeping warm.',
    'Nobody is surprised to see you. That is the strangest part.',
  ), [ch('Walk into the village.', out('A small boy sees you, and runs. A moment later an old woman comes out of the biggest house, drying her hands.', room('gn-06-village')))]),

  // ---- the Hidden Village ----
  rm('gn-06-village', 'The Hidden Village', gorge({
    effect: 'none',
    remembers: [{ id: 'told', when: [is('village-told')], notice: 'There is a signpost at the edge of the village now, and a stall selling carved leaves. Granny Tamsel is not angry. She only looks tired. "We heard you talked," she says. "Well. Sit anyway."' }],
  }), say(
    'A few houses, a mill, a pool that steams in the cool air. People who are not on any map, and would like to keep it that way.',
    '**Granny Tamsel:** "You fell. Everyone who comes here fell. Sit. Eat. Then we\'ll see about a rope."',
  ), [
    chIf([not('gn-village-sat')], 'Sit, and eat.', out(
      'You sit. Somebody puts a bowl in your hands. It is hot, and plain, and the best thing you have eaten in weeks. Around you the village goes back to its day, and lets you be part of it.',
      flag('gn-village-sat'),
      ...STARTERS.map((s) => when('gn-village-starter', { min: s.n, max: s.n }, [partyHas('gn-st-family', ...s.family), when(`gn-st-${s.id}-joined`, { min: 0, max: 0 }, [scene(s.first)])])),
      BACK,
    )),
    chIf([is('gn-village-sat')], 'Walk round the village.', out('You get up and walk. Nobody minds where you go.', scene('gn-06-walk'))),
    chIf([is('gn-village-sat')], 'See who needs a hand.', out('There is always something that needs doing, in a place this small.', scene('gn-06-tasks'))),
    chIf([is('gn-village-sat')], 'Go to the rope.', out('Granny Tamsel walks you to the foot of the cliff, where the rope hangs down.', scene('gn-06-rope'))),
  ]),
  rm('gn-06-walk', 'The Hidden Village: Round the Houses', gorge({ effect: 'none' }), 'A pool that steams. A little roofed shelf at the edge of the orchard. A fire, with an old woman beside it.', [
    ...VILLAGE_PLACES.slice(0, 3).map(([key, label, to, text]) => chIf([not(`gn-village-went-${key}`)], label, out(text, flag(`gn-village-went-${key}`), scene(to)))),
    ch('Back to the square.', out('You walk back to the middle of the village.', BACK)),
  ]),
  rm('gn-06-tasks', 'The Hidden Village: A Hand', gorge({ effect: 'none' }), 'A stopped waterwheel. A small boy standing very still in the lane. A long table being laid under the trees.', [
    ...VILLAGE_PLACES.slice(3).map(([key, label, to, text]) => chIf([not(`gn-village-went-${key}`)], label, out(text, flag(`gn-village-went-${key}`), scene(to)))),
    ch('Back to the square.', out('You walk back to the middle of the village.', BACK)),
  ]),
  rm('gn-06-pool', 'The Healing Pool', gorge({ effect: 'sparkle' }), say(
    'A pool in a ring of flat stones, steaming. The water is the colour of weak tea and smells of moss. A child is sitting with her feet in it.',
    '**Child:** "It fixes things. Not everything. Most things."',
  ), [ch('Let your team rest in it.', out('One by one they wade in, and one by one their shoulders come down. When they climb out, every scrape is gone. The pool is a little cloudier. It will clear by morning.', heal(1), BACK))]),
  rm('gn-06-shrine', 'The Berry Shrine', gorge({ effect: 'none' }), say(
    'A little roofed shelf at the edge of the orchard, with a bowl on it. In the bowl, Berries. Next to the bowl, a carved hand, palm up.',
    'There is no one watching it. There does not need to be.',
  ), [ch('Take one for each of your team.', out('One each. You count twice, to be sure. The carved hand does not mind.', itemEach('oran-berry'), BACK))]),
  rm('gn-06-legend', "Granny Tamsel's Legend", gorge({ cast: [], effect: 'none' }), say(
    'In the evening, by the fire, Granny Tamsel tells the story the village always tells.',
    '**Granny Tamsel:** "Nine little green ones, from nine far places. Each one fell, the way you did. Each one stayed."',
    '**Granny Tamsel:** "They don\'t belong to us. We belong to them, a bit. One lives here now. It will look at you."',
    '**Granny Tamsel:** "If it likes what it sees, it goes with you. We never give them. They go."',
  ), [ch('Listen until the fire is low.', out('By the time she stops, half the village is asleep where they sit. You are not. You are thinking about being looked at.', intel(1), BACK))]),
  rm('gn-06-task-mill', 'Mend the Mill', gorge({ effect: 'none' }), say(
    'The waterwheel has stopped. River weed has wound itself through the paddles, thick as rope, and the miller stands looking at it with his hands on his hips.',
    '**The miller:** "Every spring. Every single spring."',
  ), [
    chIf([{ kind: 'partyTypes', types: ['water', 'grass', 'fighting'] }], 'Send a Pokémon in to clear it.', out('Your Pokémon goes at the weed like it has a grudge. In a few minutes the wheel shudders, and turns, and the whole village looks up at the sound.', ...STANDING('gn-village-mill'), BACK)),
    ch('Clear it yourself, by hand.', out('It takes the whole afternoon. Your hands are green to the wrist. When the wheel finally turns, the miller shakes one of them anyway.', ...STANDING('gn-village-mill'), BACK)),
  ]),
  rm('gn-06-task-hat', 'Find the Hat', gorge({ effect: 'none' }), say(
    'A small boy, Pip-Tamsel, has lost his straw hat. He is not crying. He is very nearly crying, and he would like you to know that he is not.',
    '**Pip:** "It was my grandad\'s. It\'s too big. I was growing into it."',
  ), [ch('Help him look.', out('You look in the stream, on the mill roof, and under every bush he points at.', pick('gn-village-hat', 1, 1, 1),
    when('gn-village-hat', { min: 1, max: 1 }, [...STANDING('gn-village-hat'), BACK], 'It is in the stream, caught on a stone. You fish it out. Pip puts it on wet, and it comes down over his eyes, and he does not care.'),
    when('gn-village-hat', { min: 2, max: 2 }, [...STANDING('gn-village-hat'), BACK], 'It is on the mill roof. You climb. You do not look down. Pip claps when you hand it over.'),
    when('gn-village-hat', { min: 3, max: 3 }, [scene('gn-06-task-lotad')], 'It is on the head of a wild Lotad, sitting in the shallows, looking extremely pleased with itself.'),
  ))]),
  rm('gn-06-task-lotad', 'The Lotad in the Hat', gorge({ pokemon: 'lotad', effect: 'none' }), say(
    'The Lotad wears the hat the way a king wears a crown. It has never owned anything before. You can tell.',
    'Pip looks at the Lotad. The Lotad looks at Pip.',
  ), [
    chIf([HAS_BERRY], 'Trade it a Berry.', out('You hold out a Berry. The Lotad thinks about it for a long time, then tips its head, and the hat slides off into Pip\'s arms. It eats the Berry like it has won.', gn('payBerry'), ...STANDING('gn-village-hat'), BACK)),
    ch('Let it keep it; weave him a new one.', out('You sit with Pip by the water and weave reeds until your fingers ache. The new hat is lopsided. He loves it more than the old one, and will not say so.', ...STANDING('gn-village-hat'), BACK)),
  ]),
  rm('gn-06-task-food', 'Share Food', gorge({ effect: 'none' }), say(
    'At dusk the village eats together, at one long table under the trees. Everybody brings something. Nobody checks.',
    '**Granny Tamsel:** "Sit down, then. You\'re making the place look untidy."',
  ), [
    chIf([HAS_BERRY], 'Put in a Berry.', out('You put a Berry in the big bowl in the middle. Somebody cuts it into enough pieces for everyone, somehow.', gn('payBerry'), ...STANDING('gn-village-food'), BACK)),
    ch('Cook something.', out('You cook. It is not very good. Everybody eats it anyway, and the miller asks for more, which is either kindness or a very strange palate.', ...STANDING('gn-village-food'), BACK)),
    ch('Just sit down when asked.', out('You sit. You eat what you are given. You laugh when the others laugh. That, it turns out, was the task.', ...STANDING('gn-village-food'), BACK)),
  ]),

  // ---- leaving ----
  rm('gn-06-rope', 'The Rope', gorge({
    effect: 'none',
    remembers: [{ id: 'chosen', when: [is('gn-st-chose')], notice: 'You are at the foot of the rope, ready to climb. Something is sitting on your bag. **Granny Tamsel:** "Well. It\'s decided, then. We don\'t give them. They go."' }],
  }), say(
    'A rope, hanging all the way down from the broken bridge, knotted every arm\'s length. Somebody has tied it there for you.',
    '**Granny Tamsel:** "One thing. You\'ll be asked where you\'ve been. We\'d take it kindly if you fell in a river, and that was all."',
  ), [
    ch('Climb.', out(
      'You climb. It takes a long time. When you look down from the top, the roofs are a few grey dots and the smoke is one thin line, and then the mist closes over them like a hand.',
      ...STARTERS.map((s) => when('gn-village-starter', { min: s.n, max: s.n }, [when('gn-st-chose', { min: 1 }, [
        join({ species: [s.id] }), { kind: 'teachMove', move: s.egg, species: s.id }, flag(`gn-st-${s.id}-joined`), flag('kanto-hidden-starter'),
        moment(`The ${s.name} of the Hidden Village chose you.`, 75),
      ], `Halfway up, the weight on your bag shifts, and something small and green settles against your neck. At the top, the ${s.name} looks back down the gorge once. Then it looks at you, and that is that.`)])),
      flag('kanto-hidden-done'), setTo('gn-village-afterstory', 1), leavePseudo(),
    )),
    ch('Not yet.', out('You let go of the rope. The village is still there behind you.', BACK)),
  ]),

  // ---- afterstory: the traveller with a notebook (later in the same region) ----
  gev('gn-06-notebook', 'A Traveller with a Notebook', bridge({ stop: 'event', rarity: 'uncommon', callback: true, cast: ['trainer.hiker'], effect: 'none', requires: [is('gn-village-afterstory'), not('gn-village-asked')] }), say(
    'A traveller with a notebook stops you on the road. Pencil behind his ear. Mud to the knee.',
    '**Traveller:** "You came up out of the gorge, didn\'t you? People talk about a village down there. Is it real?"',
  ), [
    ch('Never heard of it.', out('He looks at you for a moment, then writes something down and crosses it out. "No. Course not."', flag('village-kept-secret'), flag('gn-village-asked'), setTo('gn-village-afterstory', 0))),
    ch("There's nothing down there.", out('"Nothing at all?" "A river. Rocks." He sighs, and closes the notebook.', flag('village-kept-secret'), flag('gn-village-asked'), setTo('gn-village-afterstory', 0))),
    ch("Yes. It's lovely.", out('His whole face lights up. He writes and writes. You have the feeling, watching the pencil go, that you have just given something away.', flag('village-told'), flag('gn-village-asked'), setTo('gn-village-afterstory', 0))),
  ]),
];

// =====================================================================================================================
// gn.06  the nine starter episodes (each succeeds into TRUSTED, or fails into FAILED: a Miracle Seed and one retry)
// =====================================================================================================================
const st = (s: Starter, suffix: string, name: string, intro: string, choices: Json[]): Json =>
  rm(`gn-06-st-${s.id}${suffix}`, `${s.name}: ${name}`, gorge({ pokemon: s.id, effect: 'none' }), intro, choices);
const S = Object.fromEntries(STARTERS.map((s) => [s.id, s])) as Record<Starter['id'], Starter>;
/** A pick where one answer is right: right goes on, wrong fails the episode. */
const quiz = (right: Json[], wrong: Json[], options: [string, boolean, string][]): Json[] =>
  options.map(([label, ok, text]) => ch(label, out(text, ...(ok ? right : wrong))));

const bul = S.bulbasaur;
const chi = S.chikorita;
const tre = S.treecko;
const tur = S.turtwig;
const sni = S.snivy;
const che = S.chespin;
const row = S.rowlet;
const gro = S.grookey;
const spr = S.sprigatito;

const WATER_WALK = (n: number): Json => st(bul, n === 1 ? '' : `-water-${n}`, n === 1 ? 'The Hidden Garden' : 'Another Bucket', n === 1 ? say(
  'Behind the houses there is a garden where sick Pokémon come to rest. In the middle of it, a giant Venusaur lies wilting, its great flower drooping to the ground.',
  'A Bulbasaur stands guard at its side. It does not take its eyes off you. Then it looks, pointedly, at the empty bucket by the well.',
) : 'The Bulbasaur watches you come back with the bucket. It does not say thank you. It looks at the well again.', [
  ch(n === 1 ? 'Pick up the bucket.' : 'Fetch another.', out(
    'The walk from the well is short, and the bucket is heavy, and the path has a root in it exactly where you are not looking.',
    roll('gn-st-spill', 25),
    when('gn-st-spill', { min: 1 }, [scene(`gn-06-st-bulbasaur-water-${Math.min(4, n + 1)}`)], 'You trip. Half of it goes on your boots. That one does not count.'),
    when('gn-st-spill', { min: 0, max: 0 }, [flag('gn-st-water'), when('gn-st-water', { min: 0, max: 2 }, [scene(`gn-06-st-bulbasaur-water-${Math.min(4, n + 1)}`)]), when('gn-st-water', { min: 3 }, [scene('gn-06-st-bulbasaur-thieves')])], 'You pour it at the Venusaur\'s roots. The soil drinks it at once.'),
  )),
]);

const starterEpisodes: Json[] = [
  // Bulbasaur: carry water three times (a spill costs one more walk), then drive off three Poison-type thieves.
  WATER_WALK(1), WATER_WALK(2), WATER_WALK(3), WATER_WALK(4),
  st(bul, '-thieves', 'The Thieves', say(
    'The Venusaur lifts its head a little, for the first time. And then, at the garden wall, three shapes: Poison-types, slinking in after the healing herbs.',
    'The Bulbasaur plants its feet in front of the Venusaur. It glances at you, just once.',
  ), [ch('Stand beside it.', fight('You stand beside it. The thieves come anyway.', inside({
    ...eitherWay(wild({ types: ['poison'], lv: 0, chain: 3, win: [...TRUSTED(bul)] })), lose: FAILED(bul),
  }), setTo('gn-st-water', 0)))]),

  // Chikorita: three scent clues to the lost dew bottle; it only helps if thanked first, not the lead.
  st(chi, '', 'The Shadow', say(
    'A Chikorita has followed you since you arrived. Everywhere. When your lead walks beside you, the Chikorita walks closer.',
    'The village\'s dew bottle has gone missing. The Chikorita puts its nose to the ground, and finds the first clue at once: a drop of dew on a leaf, where no dew should be.',
  ), [
    ch('Thank the Chikorita.', out('It goes pink from the leaf down. It does not look at your lead at all. It sets off along the trail at a trot.', flag('gn-st-chiko-thanked'), scene('gn-06-st-chikorita-2'))),
    ch('Thank your lead.', out('Your lead looks pleased. The Chikorita sits down, very hard, and stares at nothing. It is not going to help now.', ...FAILED(chi))),
  ]),
  st(chi, '-2', 'The Second Clue', say('The trail runs out at a fork. Left, the smell of mint. Right, the smell of woodsmoke. Ahead, river water.', 'The Chikorita looks at you, waiting.'), quiz([scene('gn-06-st-chikorita-3')], FAILED(chi), [
    ['Follow the mint.', true, 'Mint grows where the morning dew lies longest. The Chikorita nods, as if you passed something.'],
    ['Follow the woodsmoke.', false, 'Smoke dries everything. The trail is gone. The Chikorita lies down in the path.'],
    ['Follow the river.', false, 'The river smells of everything at once. You lose the trail in it.'],
  ])),
  st(chi, '-3', 'The Third Clue', say('In the mint, a bee, heavy and slow, flying the same line again and again. A broken cork, chewed. And a dent in the grass the size of a small, round body.'), quiz(TRUSTED(chi), FAILED(chi), [
    ['Follow the bee.', false, 'The bee goes home. The Chikorita sighs through its nose.'],
    ['Follow the dent in the grass.', true, 'It leads to a Sentret, fast asleep, curled round the dew bottle like a pillow. The Chikorita carries the bottle home in its mouth, very proud, and walks right beside you all the way.'],
    ['Look at the cork.', false, 'It is a cork. The Chikorita had already seen it. It waits for you to catch up, and you do not.'],
  ])),

  // Treecko: a three-tap timing run across the rooftops against the elder (prompt roof-leap, one tap a roof), then "Plant a cutting."
  st(tre, '', 'The Dying Tree', say(
    'A Treecko will not leave an old tree at the edge of the village. The tree is nearly gone: grey bark, three green leaves.',
    'To speak to it, says the village, you must first beat the Treecko elder across the rooftops. The elder is already waiting on the first roof.',
  ), [ch('Climb up and race.', out('The elder flicks its tail: go.', scene('gn-06-st-treecko-2')))]),
  st(tre, '-2', 'The Rooftops: First Gap', say('The first gap. The roof on the far side is lower, and wet. The elder is already in the air.'), [
    ch('Jump.', out('You land, skid, keep going. The elder glances back, surprised.', scene('gn-06-st-treecko-3')), { prompt: { id: 'roof-leap', needs: 'ok' }, fail: out('A beat late. The elder is already two roofs on. You will not catch it now.', ...FAILED(tre)) }),
  ]),
  st(tre, '-3', 'The Rooftops: The Long Roof', say('A long roof, a loose tile halfway along, and the elder going straight over it without slowing.'), [
    ch('Jump the loose tile.', out('Over it, and on. You lose a step. You keep your feet.', scene('gn-06-st-treecko-4')), { prompt: { id: 'roof-leap', needs: 'ok' }, fail: out('The tile goes. So do you, very nearly. By the time you are up, the race is over.', ...FAILED(tre)) }),
  ]),
  st(tre, '-4', 'The Rooftops: The Last Leap', say('The last roof, and the old tree beyond it. The elder is beside you, neck and neck.'), [
    ch('Jump.', out('The elder jumps first, too early, and has to scramble. You land clean. It looks at you a long time, then steps aside.', scene('gn-06-st-treecko-5')), { prompt: { id: 'roof-leap', needs: 'ok' }, fail: out('Too early. You catch the edge, and hang there, and the elder looks down at you, not unkindly.', ...FAILED(tre)) }),
  ]),
  st(tre, '-5', 'The Old Tree', say(
    'The Treecko sits in the last fork of the old tree, among the three green leaves. It lets you come close.',
    'You can see, now, that it is not guarding the tree. It is keeping it company.',
  ), [
    ch('Plant a cutting.', out('You cut a green shoot from the last living branch, and hold it out. The Treecko looks at it, and at the tree, and takes the cutting gently in its mouth. It comes down. It is coming with you.', ...TRUSTED(tre))),
    ch('Tell it the tree will be fine.', out('It looks at you the way you would look at someone who says that. It goes back up into the leaves.', ...FAILED(tre))),
  ]),

  // Turtwig: plant a sapling, three turns of weather; the right answer each time is "Wait."
  st(tur, '', 'The Seedlings', say(
    'A Turtwig carries the village\'s seedlings on its back, a little forest of them, all the way to the hill where they will be planted.',
    'It lets you plant one. Then it settles down beside it, and looks at the sky, and waits for the weather.',
  ), [ch('Plant the sapling.', out('You press the earth down round it. The Turtwig nods, slowly.', scene('gn-06-st-turtwig-2')))]),
  st(tur, '-2', 'The First Weather: Sun', say('The sun comes out hard. The sapling\'s leaves curl at the edges.'), quiz([scene('gn-06-st-turtwig-3')], FAILED(tur), [
    ['Water it.', false, 'You water it. The Turtwig closes its eyes. Too much, too soon.'],
    ['Shade it with your hands.', false, 'Your arms ache. The Turtwig gently pushes them down.'],
    ['Wait.', true, 'You wait. By evening the leaves uncurl on their own. The Turtwig shifts a little closer.'],
  ])),
  st(tur, '-3', 'The Second Weather: Wind', say('Wind, in the night. The sapling bends almost flat.'), quiz([scene('gn-06-st-turtwig-4')], FAILED(tur), [
    ['Tie it to a stick.', false, 'You tie it. The Turtwig unties it with its mouth, carefully, and looks at you.'],
    ['Wait.', true, 'You wait. In the morning it is standing again, a little crooked, a little stronger.'],
    ['Build a wall round it.', false, 'The wall falls on it. The Turtwig does not say anything. It does not have to.'],
  ])),
  st(tur, '-4', 'The Third Weather: Rain', say('Rain, for a whole day. The ground goes soft. The sapling does nothing at all.'), quiz(TRUSTED(tur), FAILED(tur), [
    ['Dig a ditch to drain it.', false, 'You cut its roots with the spade. The Turtwig walks away, very slowly.'],
    ['Wait.', true, 'You wait. On the third morning, there is a new leaf. The Turtwig gets up, shakes the seedlings on its back, and walks to your side, as if that was always where it was going.'],
  ])),

  // Snivy: three etiquette tests. A wrong pick, and it turns its back for a beat (a second wrong pick ends it).
  st(sni, '', 'Three Tests', say(
    'A Snivy sits on the well wall as if it owns it. It looks you up and down and does not seem impressed.',
    'The first test, plainly, is how you greet it.',
  ), [
    ch('A nod.', out('It nods back, very slightly. Correct.', scene('gn-06-st-snivy-2'))),
    ch('Hold out a hand.', out('It looks at the hand. It turns its back for a beat. Then it turns round again, giving you one more chance.', flag('gn-st-snivy-miss'), when('gn-st-snivy-miss', { min: 2 }, FAILED(sni)), when('gn-st-snivy-miss', { min: 0, max: 1 }, [scene('gn-06-st-snivy')]))),
  ]),
  st(sni, '-2', 'Three Tests: Where to Stand', say('It hops down and walks. It expects you to walk too. The question is where.'), [
    ch('Beside it.', out('Beside. It allows this.', scene('gn-06-st-snivy-3'))),
    ch('In front, to lead.', out('It stops. It turns its back for a beat.', flag('gn-st-snivy-miss'), when('gn-st-snivy-miss', { min: 2 }, FAILED(sni)), when('gn-st-snivy-miss', { min: 0, max: 1 }, [scene('gn-06-st-snivy-2')]))),
    ch('Behind it.', out('It stops. A follower is no better than a leader. It turns its back for a beat.', flag('gn-st-snivy-miss'), when('gn-st-snivy-miss', { min: 2 }, FAILED(sni)), when('gn-st-snivy-miss', { min: 0, max: 1 }, [scene('gn-06-st-snivy-2')]))),
  ]),
  st(sni, '-3', 'Three Tests: When It Wins', say('A wild Pokémon wanders too close. The Snivy deals with it in two moves, perfectly, and then looks at you.'), [
    ch('Say nothing.', out('You say nothing. The Snivy holds your gaze a moment longer, and then, for the first time, almost smiles. It walks at your side from then on.', ...TRUSTED(sni))),
    ch('"Well done!"', out('It turns its back for a beat. Praise is for those who need it.', flag('gn-st-snivy-miss'), when('gn-st-snivy-miss', { min: 2 }, FAILED(sni)), when('gn-st-snivy-miss', { min: 0, max: 1 }, [scene('gn-06-st-snivy-3')]))),
  ]),

  // Chespin: cook to replace the festival food. Three ingredients from six that it likes; it keeps tasting.
  st(che, '', 'The Festival Food', say(
    'The festival food is gone. All of it. A Chespin sits in the empty pot, round as a ball, licking its paws.',
    'Somebody has to cook it again. The Chespin climbs out of the pot to help, which means tasting.',
  ), [ch('Start cooking.', out('Six things on the table: Oran, Pecha, Rawst, Tamato, Chesto, and a pinch of salt. It likes three.', scene('gn-06-st-chespin-2')))]),
  st(che, '-2', 'First Ingredient', say('The Chespin sniffs each one. Its ears go up at one of them.'), quiz([scene('gn-06-st-chespin-3')], FAILED(che), [
    ['Oran.', true, 'Its ears stay up. In it goes.'],
    ['Tamato.', false, 'It sneezes, hard. The pot goes over.'],
    ['Chesto.', false, 'It eats it, and falls asleep in the flour.'],
  ])),
  st(che, '-3', 'Second Ingredient', say('It is reaching for the bowl. Again.'), [
    ch('Stop it tasting.', out('You move the bowl. It looks betrayed. Then it points, firmly, at the Pecha.', scene('gn-06-st-chespin-4'))),
    ch('Let it taste.', out('It tastes. And tastes. When you look again there is nothing left but the spoon.', ...FAILED(che))),
  ]),
  st(che, '-4', 'The Last Two', say('Pecha, then. And one more. The Chespin is leaning on your arm.'), quiz(TRUSTED(che), FAILED(che), [
    ['Pecha and Rawst.', true, 'It tastes the finished pot (once, you allow it) and closes its eyes in bliss. At the festival, it sits on your knee the whole night.'],
    ['Pecha and salt.', false, 'It spits. The whole village hears it.'],
    ['Pecha and Tamato.', false, 'Its quills go up all at once. Nobody eats that.'],
  ])),

  // Rowlet: a night patrol past three sleepers without waking the village (prompt night-tiptoe at each), then lift it out of the chimney.
  st(row, '', 'The Rescue', say(
    'A Rowlet is stuck in a chimney. It is asleep. It has been asleep, the village thinks, for two days.',
    'The chimney is on the far side of the village. To get there at night, you must pass three sleeping Pokémon without waking anyone.',
  ), [ch('Go at midnight.', out('The moon is thin. Everything is very quiet, and very close.', scene('gn-06-st-rowlet-2')))]),
  st(row, '-2', 'The Night Patrol: the Snorlax', say('A Snorlax across the path, snoring like a bellows. The only way is round by the fence, between the posts, slowly.'), [
    ch('Creep round by the fence.', out('Round by the fence, between the posts. It snores on.', scene('gn-06-st-rowlet-3')), { prompt: { id: 'night-tiptoe', needs: 'ok' }, fail: out('Your foot finds the one dry stick. Its eyes open. It sits up. So does every light in the village.', ...FAILED(row)) }),
  ]),
  st(row, '-3', 'The Night Patrol: the Growlithe', say('A Growlithe asleep on a step, one ear twitching. You are downwind. You only have to be slow.'), [
    ch('Walk past, downwind.', out('The wind takes your smell away. The ear stops twitching.', scene('gn-06-st-rowlet-4')), { prompt: { id: 'night-tiptoe', needs: 'ok' }, fail: out('Too quick. It wakes, and barks, and barks.', ...FAILED(row)) }),
  ]),
  st(row, '-4', 'The Night Patrol: the Hoothoot', say('A Hoothoot on the chimney\'s own roof, eyes shut, one foot tucked up. Hoothoot never fully sleep. You wait for it to turn its head.'), [
    ch('Climb while its head is turned.', out('It turns its head, all the way round, the other way. You climb.', scene('gn-06-st-rowlet-5')), { prompt: { id: 'night-tiptoe', needs: 'ok' }, fail: out('You move a breath too soon. It hoots. Lights come on.', ...FAILED(row)) }),
  ]),
  st(row, '-5', 'The Chimney', say('You reach down into the chimney. Feathers. Warm. Still asleep.'), [
    ch('Lift it out.', out('You lift it out. It does not wake. You carry it home and put it on your bag, and go to sleep. In the morning it is on your head, awake, looking around as if it has always lived there.', ...TRUSTED(row))),
  ]),

  // Grookey: find three sticks (it rejects two), then match a four-beat drum pattern on the stumps.
  st(gro, '', 'The Lost Stick', say(
    'A Grookey sits on a stump, drumming on its knees. It has lost its stick, and its rhythm with it. The beat keeps falling apart in its hands.',
  ), [ch('Find it a stick.', out('You bring the first stick. It holds it, taps it once, and throws it over its shoulder. Too light.', scene('gn-06-st-grookey-2')))]),
  st(gro, '-2', 'Another Stick', say('The second stick is better. It taps it twice. It throws it too. Too straight, somehow.'), [
    ch('Find a third.', out('The third stick is crooked, and dark, and heavy at one end. It taps it. It taps it again. It grins.', scene('gn-06-st-grookey-3'))),
  ]),
  st(gro, '-3', 'The Drum Pattern', say(
    'It plays a pattern on the stumps, and holds the stick out to you. *Long. Short. Short. Long.* Your turn.',
  ), [
    ch('Play it back.', out('You play it back. It plays it again, louder, faster, and the whole village starts clapping along. It finds the beat. It keeps it. It keeps you.', ...TRUSTED(gro)), { prompt: { id: 'stump-drum', needs: 'ok' }, fail: out('Close. Not close enough. It stops. It looks at the stick. The beat falls apart again.', ...FAILED(gro)) }),
  ]),

  // Sprigatito: it steals your Berry. A three-node chase; catching it isn't the win, sitting down and ignoring it is.
  st(spr, '', 'The Thief', say(
    'A Sprigatito strolls up, takes the Berry right out of your hand, and walks off with it. Not fast. It wants you to see.',
  ), [
    ch('Chase it.', out('You run. It runs. It is having the best day of its life.', scene('gn-06-st-sprigatito-2'))),
    ch('Sit down, and ignore it.', out('You sit. You look at the trees. After a while there is a small weight in your lap: the Berry, a bit chewed. The Sprigatito sits down next to you, pretending it was always there.', ...TRUSTED(spr))),
  ]),
  st(spr, '-2', 'The Chase: the Orchard', say('Through the orchard. It stops, looks back, and waits until you are nearly close enough.'), [
    ch('Keep chasing.', out('Over the fence. It is laughing at you, somehow.', scene('gn-06-st-sprigatito-3'))),
    ch('Sit down, and ignore it.', out('You sit, in the grass. You do not look. In a while it comes back by itself and drops the Berry in your lap, and sits, and leans on you.', ...TRUSTED(spr))),
  ]),
  st(spr, '-3', 'The Chase: the Mill Roof', say('Up onto the mill roof. It sits on the ridge, Berry in its mouth, tail swishing, very pleased.'), [
    ch('Climb up and catch it.', out('You catch it. It goes limp in your arms and lets you have the Berry. But it does not look at you again. Catching it was never the win.', ...FAILED(spr))),
    ch('Sit down, and ignore it.', out('You sit down on the ground below, your back to the mill. A long while later there is a thump on the grass, and the Berry rolls against your hand. Then the Sprigatito climbs into your lap.', ...TRUSTED(spr))),
  ]),
];

// ---- Kanto: the canon space at Cerulean opens the same story (cs.kanto.cerulean.bridge) ----
const KANTO_BRIDGE: Json = gev('cs-kanto-cerulean-bridge', 'Nugget Bridge', bridge({ stop: 'event', rarity: 'common', types: ['normal', 'water'], effect: 'none' }), BRIDGE_TEXT('The bridge north of Cerulean'), [CROSS()]);
(KANTO_BRIDGE as Json).canon = 'cs.kanto.cerulean.bridge';


// =====================================================================================================================
// gn.07  COLD NIGHT'S RAIN  (Pseudo Stage: five nodes; door on step 13, must-see; once per run)
// =====================================================================================================================
const RAIN_TINT = '#1a2433';
const rainy = (o: Json = {}): Json => ({ tint: RAIN_TINT, tags: ['Dungeon', 'Pokémon', 'Story'], effect: 'rain', ...o });
const inRain = (battle: Json): Json => ({ ...battle, weather: 'rain' });
const thisRegion = (key: string): Json => ({ kind: 'gn', test: 'thisRegion', key });
const stampRegionOf = (key: string): Json => gn('stampRegion', { key });
const clampFlame = (): Json => gn('clampFlag', { key: 'rain-flame', min: 0, max: 5 });
const flame = (n: number): Json[] => [flag('rain-flame', n), clampFlame()];

/** The Fire-type on the rock, rolled when the stage is created (1 to 13), and whose it was. */
const FIRES: { id: string; name: string; w: number; owner: 'damian' | 'hunter' | 'show' | 'racer' | 'trainer' }[] = [
  { id: 'charmander', name: 'Charmander', w: 30, owner: 'damian' },
  { id: 'growlithe', name: 'Growlithe', w: 7.5, owner: 'hunter' }, { id: 'growlithe-hisui', name: 'Hisuian Growlithe', w: 7.5, owner: 'hunter' },
  { id: 'vulpix', name: 'Vulpix', w: 6, owner: 'show' }, { id: 'vulpix-alola', name: 'Alolan Vulpix', w: 6, owner: 'show' },
  { id: 'ponyta', name: 'Ponyta', w: 5, owner: 'racer' }, { id: 'ponyta-galar', name: 'Galarian Ponyta', w: 5, owner: 'racer' },
  ...['cyndaquil', 'torchic', 'chimchar', 'tepig', 'fennekin', 'litten', 'scorbunny', 'fuecoco'].map((id) => ({ id, name: id[0]!.toUpperCase() + id.slice(1), w: 33 / 8, owner: 'trainer' as const })),
];
const fireIs = (i: number): { min: number; max: number } => ({ min: i + 1, max: i + 1 });
/** Effects for whichever Fire-type it is. */
const perFire = (make: (f: (typeof FIRES)[number]) => Json[], text?: (f: (typeof FIRES)[number]) => string): Json[] =>
  FIRES.map((f, i) => when('rain-fire', fireIs(i), make(f), text?.(f)));
const OWNERS = {
  damian: { name: 'Damian', cls: 'ace-trainer', cast: 'trainer.damian', types: ['fire', 'fighting'], letter: 'a Fire-type team, and a Gym that is not a real Gym' },
  hunter: { name: 'The Hunter', cls: 'roughneck', cast: 'trainer.roughneck', types: ['ground', 'normal'], letter: 'a hunter\'s team, Ground and Normal-types, "good noses"' },
  show: { name: 'The Show Trainer', cls: 'aroma-lady', cast: 'trainer.aroma_lady', types: ['fairy', 'psychic'], letter: 'a show team, Fairy and Psychic-types, "the pretty ones"' },
  racer: { name: 'The Racer', cls: 'biker', cast: 'trainer.biker', types: ['normal', 'flying'], letter: 'a racing stable, Normal and Flying-types, "the fast ones"' },
  trainer: { name: 'The Trainer', cls: 'ace-trainer', cast: 'trainer.camper', types: ['water', 'grass'], letter: 'a trainer\'s team, Water and Grass-types, "the ones I actually wanted"' },
} as const;
type OwnerKey = keyof typeof OWNERS;
const ownerOf = (i: number): OwnerKey => FIRES[i]!.owner;
/** Each owner and the run of Fire-type picks (1 to 15) that were theirs. */
const OWNER_RANGES: [OwnerKey, number, number][] = (['damian', 'hunter', 'show', 'racer', 'trainer'] as OwnerKey[]).map((k) => {
  const at = FIRES.flatMap((f, i) => (f.owner === k ? [i + 1] : []));
  return [k, Math.min(...at), Math.max(...at)];
});
/** At Flame 0 it has gone very still; the next rest gives +1 whatever the player does. */
const STILL: Json = when('rain-flame', { min: 0, max: 0 }, [...flame(1)], 'It has gone very still. Your lead curls round it without being asked, and after a while the little flame comes back.');

const SAVE_IT = (): Json => ch('Save it.', out(
  'You pick it up. It weighs almost nothing. Its tail hisses in the rain, and it does not fight you. It does not do anything at all.',
  flag('rain-entered'), setTo('rain-flame', 1), setTo('rain-offered', 0), pick('rain-fire', ...FIRES.map((f) => f.w)),
  room('gn-07-rock'),
));
const WALK_ON = (): Json => ch('Go on your way.', leave('You walk on. Behind you the rain keeps falling on the rock, on the little flame, on the road it is watching.'));
const RAIN_DOOR_TEXT = (place: string): string => say(
  '*Fade in. Rain.*',
  `${place}. A rock by the road. A small Fire-type on it, tail flame the size of a match, looking down the road at someone who isn't coming.`,
  'It looks at you. It looks back at the road.',
);
const WALKED: Json[] = [flag('rain-walked'), stampRegionOf('rain-walked-at')];

const ownerScene = (key: OwnerKey): Json[] => {
  const o = OWNERS[key];
  const afterLine = key === 'damian'
    ? '**Damian:** "...Take care of it. No. Don\'t tell me. I know you will. That\'s the whole point, isn\'t it."'
    : '**The owner:** "It never looked at me like that."';
  const won = [when('rain-entered', { min: 1 }, [], afterLine), ...(key === 'damian' ? [flag('rain-damian-beaten')] : []), scene('gn-07-reward')];
  const lose = [scene(`gn-07-owner-${key}`)];
  return [
    rm(`gn-07-owner-${key}`, `The Crossroads: ${o.name}`, rainy({
      cast: [o.cast],
      remembers: key === 'damian' ? [{ id: 'met', when: [is('damian-meetings')], notice: '**Damian:** "...It\'s you. From the Gym. Oh. Oh, this looks bad, doesn\'t it."' }] : [],
    }), key === 'damian' ? say(
      '*A lantern. A trainer under a good umbrella.*',
      '**Damian:** "Hey! That\'s— you found my— look, I was coming back. I was. I got busy. It\'s a long road."',
      '*The Fire-type looks at him. Its flame doesn\'t change.*',
    ) : say(
      '*A lantern. A trainer under a good umbrella.*',
      '**The owner:** "There you are. Huh. You look better. Stronger. All right, I\'ll take it back."',
      '*The Fire-type looks at them. Its flame doesn\'t change.*',
    ), [
      chIf([is('rain-flame', 0, 4)], 'Fight for it.', fight(
        'It hides inside your coat. You can feel it shaking against your ribs. You fight for it.',
        inside({ ...inRain(trainer(o.name, { cls: o.cls, size: 6, types: [...o.types], lv: 1, win: won })), lose }),
      ), { branches: [{ when: [is('rain-flame', 3, 4)], text: 'It climbs out of your coat and steps between you. It doesn\'t attack. It stands there, in the rain, flame up. Then you fight.', effects: [] }] }),
      chIf([is('rain-flame', 5)], 'Let it stand with you.', fight(
        'It climbs out of your coat and steps between you, in the rain, flame up. You fight their team down to the last one. Then it steps forward.',
        inside({ ...inRain(trainer(o.name, { cls: o.cls, size: 5, types: [...o.types], lv: 1, win: [gn('stash'), ...perFire((f) => [join({ species: [f.id] }) as Json].map((j) => ({ ...j, direct: true }))), scene(`gn-07-last-${key}`)] })), lose }),
      )),
    ]),
    rm(`gn-07-last-${key}`, 'Its Own Fight', rainy({ cast: [o.cast] }), say(
      'Their last Pokémon comes out. Nobody sends the Fire-type out. It just goes.',
      'It has one move. It is enough.',
    ), [
      ch('Watch.', fight('It stands in the rain with its flame up, and does not look back at you once.', inside({
        ...inRain(trainer(o.name, { cls: o.cls, size: 1, types: [...o.types], lv: 1, win: [gn('unstash'), ...won] })),
        rule: { gn: 'lastflame' }, lose: [gn('unstash'), ...won],
      }), moment('In the rain, it fought for itself.', 70))),
    ]),
  ];
};

const gn07: Json[] = [
  gev('gn-07-door', "Cold Night's Rain", rainy({ stop: 'event', rarity: 'rare', forced: true, types: ['fire', 'water'], requires: [notRegion('kanto'), not('rain-entered'), not('rain-walked')] }),
    RAIN_DOOR_TEXT('A road at dusk'), [SAVE_IT(), { ...WALK_ON(), success: { ...(WALK_ON().success as Json), effects: WALKED } }]),
  rm('gn-07-rock', 'The Rock', rainy(), say(
    'It weighs almost nothing. Its tail hisses in the rain.',
    'You open your coat and it climbs in without being asked, and turns round twice, and puts its head out under your chin to keep watching the road.',
    'It will not battle. It will ride along. The rain will not stop tonight: Fire moves are weakened here, and Water moves are strong.',
  ), [ch('Walk on, into the dark.', out('The road goes down towards the river. The rain does not let up.', room('gn-07-culvert')))]),
  rm('gn-07-culvert', 'The Culvert', rainy({
    remembers: [{ id: 'abandoned', when: [is('abandoned-mon')], notice: 'One of your team, one that was once left behind itself, comes and sits down beside it without being asked. Neither of them says anything.' }],
  }), say(
    'A concrete pipe under the road, big enough to crawl into, dry at the back. A rest, of a kind.',
    'The Fire-type watches the rain at the mouth of it. Its flame is very small.',
  ), [
    ch('Build a shelter.', out('You prop your coat on two sticks across the mouth of the pipe. The wind stops. The little flame stands up straighter.', heal(1), when('abandoned-mon', { min: 1 }, [...flame(1)]), ...flame(1), room('gn-07-road'))),
    ch('Offer food.', out('*Offered food: it turns its head away. Its stomach is audible.*', heal(1), setTo('rain-offered', 1), when('abandoned-mon', { min: 1 }, [...flame(1)]), room('gn-07-road'))),
    ch("Let it sit outside; it's a Fire-type.", out('It sits outside in the rain, because you put it there. It does not complain. The flame gets smaller.', heal(1), when('abandoned-mon', { min: 1 }, [...flame(1)]), ...flame(-1), room('gn-07-road'))),
  ]),
  rm('gn-07-road', 'The Flooded Road', rainy(), say(
    'The road is a river now, ankle-deep and running. Things live in it tonight that do not usually live on roads.',
  ), [ch('Wade on.', fight('Something rises out of the water ahead.', inside(eitherWay(inRain(wild({ types: ['water', 'electric', 'ghost'], lv: 1, chain: 2, win: [
    gn('noFaint', { key: 'rain-flame', n: 1 }), clampFlame(), roll('rain-letter', 25),
    when('rain-letter', { min: 1 }, [intel(1), ...OWNER_RANGES.map(([key, min, max]) => when('rain-fire', { min, max }, [], `On the team: ${OWNERS[key].letter}.`))], 'Caught on a branch: a wet page. *"...it\'s just not strong enough. I\'ll come back for it if it toughens up. Don\'t wait for me, I told it. It didn\'t understand."*'),
    room('gn-07-barn'),
  ] }))))))]),
  rm('gn-07-barn', 'The Barn', rainy(), say(
    'A barn with half a roof. Dry straw at one end. You can hear the rain on the good half like gravel being poured.',
    'The Fire-type climbs out of your coat and sits in the straw, and looks at you.',
  ), [
    ch('Offer food again.', out('It turns its head away again. Its stomach is audible.', heal(1), STILL, setTo('rain-offered', 1), room('gn-07-crossroads')), {
      branches: [{ when: [is('rain-offered')], text: '*Offered again: it eats so fast it hiccups a spark.*', effects: [heal(1), STILL, ...flame(1), room('gn-07-crossroads')] }],
    }),
    ch('Ask your Fire-type to sit with it.', out('Your Fire-type lies down in the straw and lets it lean on its warm side. After a while you can\'t tell whose flame is whose.', heal(1), STILL, ...flame(2), room('gn-07-crossroads')), { requires: [{ kind: 'partyType', type: 'fire' }] }),
    ch('Just sleep.', out('You sleep. When you wake it is in your coat again, as if it never left.', heal(1), STILL, room('gn-07-crossroads'))),
  ]),
  rm('gn-07-crossroads', 'The Crossroads', rainy(), say(
    '*A lantern, at the crossroads, swinging a little in the wind. Somebody is standing under it.*',
  ), [ch('Walk into the lantern light.', out('The Fire-type goes very still in your coat.', ...FIRES.map((_, i) => when('rain-fire', fireIs(i), [...(ownerOf(i) === 'damian' ? [flag('rain-damian')] : []), scene(`gn-07-owner-${ownerOf(i)}`)]))))]),
  ...(['damian', 'hunter', 'show', 'racer', 'trainer'] as OwnerKey[]).flatMap(ownerScene),
  rm('gn-07-reward', 'It Warms to You', rainy({ effect: 'none' }), say(
    'The rain is stopping. Not all at once: the way a person stops crying.',
    'It climbs down out of your coat and sits in front of you, and looks up, and its flame is the biggest you have seen it.',
  ), [ch('Take it with you.', out('It climbs back into your coat. It is not going anywhere.',
    ...perFire((f) => [{ ...join({ species: [f.id] }), ability: 'kept-flame', held: 'charcoal' }, flag('kanto-rain-fire')]),
    flag('kanto-rain-saved'), flag('rain-saved'), moment('You saved a Fire-type from the rain, and it chose you.', 75), leavePseudo(),
  ))]),
  // ---- if the player walked on: met later in the region, beside a nurse at a Center ----
  gev('gn-07-nurse', 'A Small Scarf', rainy({
    stop: 'event', rarity: 'uncommon', callback: true, effect: 'none', cast: [], requires: [is('rain-walked'), thisRegion('rain-walked-at'), not('rain-nurse-seen')],
    remembers: [{ id: 'walked', when: [is('kind-walked-past', 3)], notice: '**The nurse:** "Someone had to."' }],
  }), say(
    'At the Center, beside the nurse at the desk, a small Fire-type sits on the counter wearing a little knitted scarf. Healthy. Warm. Somebody else saved it.',
    '*It looks at you for a moment. It doesn\'t look away quickly.*',
  ), [ch('Look back at it.', out('Then the nurse calls the next name, and it turns to watch her instead.', flag('rain-nurse-seen')))]),
];

// ---- Kanto: the canon space on the road out of Cerulean (cs.kanto.cerulean.rain) ----
const KANTO_RAIN: Json = { ...gev('cs-kanto-cerulean-rain', "Cold Night's Rain", rainy({ stop: 'event', rarity: 'common', types: ['fire', 'water'], requires: [not('rain-entered'), not('rain-walked')] }),
  RAIN_DOOR_TEXT('The road out of Cerulean'), [SAVE_IT(), { ...WALK_ON(), success: { ...(WALK_ON().success as Json), effects: WALKED } }]), canon: 'cs.kanto.cerulean.rain' };

// =====================================================================================================================
// gn.08  THE SQUIRTLE SQUAD  (Single: a gauntlet with scenes between; step 7, optional; once per run)
// =====================================================================================================================
const SQUAD_TINT = '#2b4a63';
const squad = (o: Json = {}): Json => ({ tint: SQUAD_TINT, tags: ['Pokémon', 'Combat', 'Story'], pokemon: 'squirtle', ...o });
const RESPECT: Json[] = [flag('squad-respect'), cap('squad-respect', 5)];
/** The Fire Brigade Prank: on the first turn of each Squad battle, the hose hits your lead (Speed -1). Squad members can't be caught: one joins at the end. */
const HOSE = { myStages: { spe: -1 }, noCatch: true };
const HOSE_LINE = '*The Squad opens with the hose!* A jet of cold water hits your lead square in the face. It is slower for it.';
const lesser = (win: Json[]): Json => ({ ...inside(eitherWay({ ...wild({ species: ['squirtle'], lv: -1, win }), look: 'squad-lesser' })), rule: HOSE, pseudo: false, friendly: true });
const squadFight = (n: number, next: string, label = 'Take on the next one.'): Json =>
  rm(`gn-08-fight-${n}`, `The Squad: Fight ${n}`, squad({ cast: [] }), say(
    n === 1 ? 'One of them steps out in front of the others, pushes its shades up its nose, and points at you. A challenge. The others cheer.' : 'Another one steps out. The others cheer exactly as loudly as last time.',
  ), [ch(label, fight(HOSE_LINE, lesser([scene(next)])))]);

const gn08: Json[] = [
  gev('gn-08-town', 'The Squirtle Squad', squad({ stop: 'event', rarity: 'rare', types: ['water'], requires: [notRegion('kanto'), not('squad-done')] }), say(
    'A small town on the road, with its shutters down in the middle of the afternoon.',
    'Somebody has painted a turtle in sunglasses on the side of the fire station. Somebody else has tried to scrub it off, and given up halfway.',
  ), [
    ch('Walk into town.', out('The street is very quiet. Too quiet, for a town with this much paint on it.', flag('squad-done'), setTo('squad-respect', 0), roll('squad-standoff', 35),
      when('squad-standoff', { min: 1 }, [scene('gn-08-standoff')]), when('squad-standoff', { min: 0, max: 0 }, [scene('gn-08-pranks')]))),
    ch('Keep to the road.', leave('You keep to the road. Behind you, faintly, something that sounds a lot like a bucket hits the ground.')),
  ]),
  rm('gn-08-pranks', 'The Pranksters', squad(), say(
    'A bucket falls on your head. It is full of water. Of course it is.',
    '*Five Squirtle in pointed shades on a wall. The one in the middle folds its arms.*',
    'That one is the Leader: a Wartortle, in fact, a head taller than the rest. It looks at you over the top of its shades. The others look at it.',
  ), [ch('Shake the water off, and face them.', out('The Leader nods once, as if you have agreed to something.', scene('gn-08-fight-1')))]),
  rm('gn-08-standoff', 'The Standoff', squad(), say(
    'Officer Jenny has already rounded up the Lesser members. They sit in a row on the kerb, shades off, sulking.',
    'Only the Leader is left: a Wartortle, on the roof of the fire station, arms folded. It is not coming down.',
    '**Officer Jenny:** "It won\'t come down for me. Maybe it\'ll come down for a trainer."',
  ), [ch('Sit down with the Lesser members first.', out('You sit on the kerb. They shuffle along to make room, suspicious. Then one of them stands up, and Officer Jenny lets it.', scene('gn-08-fight-1')))]),

  squadFight(1, 'gn-08-specs'),
  rm('gn-08-specs', 'Specs', squad(), say(
    'One of them is patting its face, looking for its shades. They are on the back of its head.',
    'The others are trying very hard not to laugh.',
  ), [
    ch('Tell it where they are.', out('It reaches round, finds them, and goes very red. The others laugh after all. It does not look at you again.', scene('gn-08-fight-2'))),
    ch('Hand it a spare pair.', out('You hand it a spare pair of sunglasses, and say nothing. It puts them on. Now it has two. It looks extremely cool. It knows.', ...RESPECT, scene('gn-08-fight-2'))),
  ]),
  squadFight(2, 'gn-08-tank'),
  rm('gn-08-tank', 'Tank', squad(), say(
    'The biggest one plants its elbow on an upturned crate and looks at you. An arm-wrestle. It is very sure it is the strongest.',
    'It isn\'t.',
  ), [
    ch('Lose, on purpose, with a straight face.', out('You strain. You grit your teeth. You lose. *(It flexes. It looks at the others. They\'re impressed. It looks at you, and, very slightly, nods.)*', ...RESPECT, scene('gn-08-fight-3'))),
    ch('Win.', out('You win, easily. It stares at its own arm as if it has betrayed it. Nobody says anything for a while.', scene('gn-08-fight-3'))),
  ]),
  squadFight(3, 'gn-08-smoulder'),
  rm('gn-08-smoulder', 'Smoulder', squad(), say(
    'One of them stands very close to the others. Closer than it needs to. When your team comes near, it edges behind the biggest one.',
    'It is looking at one of your Pokémon in particular. The warm one.',
  ), [
    ch('Keep your Fire-type back, without a word.', out('You move your Fire-type behind you, as if by accident. The little one lets out a breath it has been holding for a long time.', ...RESPECT, scene('gn-08-star')), { requires: [{ kind: 'partyType', type: 'fire' }] }),
    ch('Let your team go where they like.', out('Your team wanders where it likes. The little one spends the whole time behind the others, shaking, pretending it is not.', scene('gn-08-star'))),
  ]),
  rm('gn-08-star', 'Star', squad(), say(
    'One of them has climbed onto a crate. It clears its throat. It has a routine.',
    'It is not ready. You can tell from the first spin.',
  ), [
    ch('Watch all of it. Clap.', out('You watch every second of it. You clap at the end. *(It bows too low and falls off the crate. It gets up as if that was the ending.)*', ...RESPECT, scene('gn-08-leader'))),
    ch('Look away halfway through.', out('You look away at the wrong moment. When you look back it is sitting on the crate, very still, and the routine is over.', scene('gn-08-leader'))),
  ]),
  rm('gn-08-leader', 'The Leader', squad({ pokemon: 'wartortle' }), say(
    'The Leader comes down at last, and stands in front of you, and takes off its shades. It folds them. It puts them in its shell.',
    'Then it raises its fists.',
  ), [ch('Fight the Leader.', fight(HOSE_LINE, { ...inside(eitherWay({ ...wild({ species: ['wartortle'], lv: 0, win: [scene('gn-08-salute')] }), look: 'squad-leader' })), rule: HOSE, pseudo: false, friendly: true }))]),
  rm('gn-08-salute', 'The Leader', squad({ pokemon: 'wartortle' }), say(
    'It picks itself up. It puts its shades back on. Then it stands to attention, very straight, and salutes you.',
  ), [
    ch('Salute back.', out('You salute back. It holds the salute a moment longer than you, as is proper. The whole Squad stands up a little straighter.', ...RESPECT, scene('gn-08-after'))),
    ch('Wave.', out('You wave. It lowers its hand slowly, as if you have said something in a language it does not speak.', scene('gn-08-after'))),
  ]),
  rm('gn-08-after', 'Something Bigger', squad({ pokemon: 'blastoise' }), say(
    'The Squad parts. Something big is coming down the street, slowly, the ground shaking a little with each step.',
  ), [
    chIf([{ kind: 'partyLevelOver', over: 8 }], 'Face the Mega Squad Blastoise.', fight(HOSE_LINE, { ...inside(eitherWay({ ...wild({ species: ['blastoise-mega'], lv: 1, win: [scene('gn-08-fire')] }), look: 'squad-leader' })), rule: HOSE, pseudo: false, friendly: true, foeMoves: ['skull-bash', 'water-spout'] })),
    chIf([{ kind: 'partyLevelOver', over: 3 }, { kind: 'partyLevelOver', over: 8, absent: true }], 'Face the Leader Blastoise.', fight(HOSE_LINE, { ...inside(eitherWay({ ...wild({ species: ['blastoise'], lv: 1, win: [scene('gn-08-fire')] }), look: 'squad-leader' })), rule: HOSE, pseudo: false, friendly: true, foeMoves: ['skull-bash', 'water-spout'] })),
    chIf([{ kind: 'partyLevelOver', over: 3, absent: true }], 'It was only the wind.', out('It was only a delivery cart, and a very large Slowpoke pulling it. The Squad looks embarrassed on its behalf.', scene('gn-08-fire'))),
  ]),
  rm('gn-08-fire', "The Town's Fire", squad({ effect: 'fire' }), say(
    'Smoke. A real fire, three streets over, going up into the sky in a thick grey rope.',
    '*The Squad looks at the smoke. They look at the Leader. Smoulder\'s shaking.*',
  ), [
    ch("You're the fire brigade, aren't you?", out('The Leader salutes. They put it out in a line, passing water hand to hand, as if they have always known how. One by one, the town opens its shutters.', flag('squad-fire-brigade'), scene('gn-08-recruit'))),
    chIf([{ kind: 'partyType', type: 'water' }], "I'll handle it.", out('Your Water-types do it. The Squad stands in the street and watches. They are quieter, after.', flag('squad-fire-player'), scene('gn-08-recruit'))),
    ch('Smoulder, with me.', out('It goes, behind your leg, the whole way. And at the end, when there is one flame left, it steps out and puts it out itself.', flag('squad-fire-smoulder'), ...RESPECT, scene('gn-08-recruit'))),
  ]),
  rm('gn-08-recruit', 'One of the Squad', squad(), say(
    'Later, the Squad lines up in front of you. One of them steps forward and holds out its shades.',
  ), [ch('Take the shades.', out('It slides on a second pair, grins, and falls in beside you.',
    roll('squad-leader-coin', 50),
    when('squad-respect', { min: 0, max: 2 }, [setTo('squad-pick', 1)]),
    when('squad-respect', { min: 3 }, [setTo('squad-pick', 1), when('squad-leader-coin', { min: 1 }, [setTo('squad-pick', 2)])]),
    when('squad-fire-player', { min: 1 }, [setTo('squad-pick', 1)]),
    when('squad-pick', { min: 1, max: 1 }, [{ ...join({ species: ['squirtle'] }), ability: 'contrary', look: 'squad-lesser', moves: ['swagger', 'hex', 'shades-down'], held: 'cool-shades' }, flag('squad-lesser-joined'), stampStage('squad-joined-stage')], 'It is one of the Lesser members.'),
    when('squad-pick', { min: 2, max: 2 }, [{ ...join({ species: ['wartortle'] }), ability: 'contrary', look: 'squad-leader', moves: ['swagger', 'hex', 'shades-down'], held: 'cool-shades' }, flag('squad-leader-joined')], 'It is the Leader. The Squad salutes it as it goes.'),
    flag('kanto-squad-joined'), moment('A member of the Squirtle Squad joined you, in its shades.', 70),
  ))]),
  // ---- afterstory: a Lesser recruit that reaches the Leader's level goes back to challenge it ----
  gev('gn-08-challenge', "The Leader's Shades", squad({ stop: 'event', rarity: 'uncommon', callback: true, pokemon: 'wartortle', requires: [is('squad-lesser-joined'), not('squad-challenge-done'), { kind: 'gn', test: 'lookAtLevel', types: ['squad-lesser'], key: 'squad-leader-level' }] }), say(
    'The road goes past a fire station with a turtle in sunglasses painted on its side. Your Squirtle stops dead.',
    'On the roof, arms folded, the Leader. Your Squirtle looks at it, and then at you. It has caught up. It knows it has.',
  ), [
    ch('Let it go and challenge it.', fight('Your Squirtle walks out alone into the middle of the street, and pushes its shades up its nose.', {
      ...{ ...wild({ species: ['wartortle'], lv: 0, win: [gn('setLook', { key: 'squad-challenger', type: 'squad-leader' }), gn('unmark', { key: 'squad-challenger' }), flag('squad-challenge-done')] }), look: 'squad-leader' },
      friendly: true, rule: { leadMark: 'squad-challenger', noSwitch: true, noCatch: true }, lose: [gn('unmark', { key: 'squad-challenger' }), flag('squad-challenge-done')],
    }, gn('markLook', { key: 'squad-challenger', type: 'squad-lesser' }))),
    ch('Not today.', leave('Your Squirtle watches the roof until the road bends. Then it pushes its shades up its nose, and walks on.')),
  ]),
];

// ---- Kanto: the canon space in the town on the road from Cerulean (cs.kanto.cerulean.squad) ----
const KANTO_SQUAD: Json = { ...gev('cs-kanto-cerulean-squad', 'The Squirtle Squad', squad({ stop: 'event', rarity: 'common', types: ['water'], requires: [not('squad-done')] }), (gn08[0] as { intro: string }).intro, (gn08[0] as { choices: Json[] }).choices), canon: 'cs.kanto.cerulean.squad' };

// =====================================================================================================================
// gn.09  BILL'S LIGHTHOUSE  (Pseudo Stage: a search, then five nodes; Door at step 16, optional; needs water; once per run)
// =====================================================================================================================
const BILL_TINT = '#1c2a44';
const cape = (o: Json = {}): Json => ({ tint: BILL_TINT, tags: ['Dungeon', 'Mystery', 'Story'], effect: 'none', ...o });
const BILL_DOOR_TEXT = say(
  'A lighthouse on a cape, far out past the last houses. Its lamp is not turning. It is blinking: a signal, out to sea.',
  'Something out there is answering.',
  'At night, the wild Pokémon of the coast come down to the shore and stand on the sand, all facing the water.',
);
const BILL_DOOR_CHOICES: Json[] = [
  ch('Look for the lighthouse.', out('You wait for dark. The beacon is only visible at night, and even then only from the right places.', flag('bill-done'), room('gn-09-search'))),
  ch('Not tonight.', leave('You leave the cape behind you. Out at sea, the blinking goes on without you.')),
];
/** The search: five signs, three right readings find the beacon; a wrong one costs a node of walking (never a fight, and the night never ends early). */
const CLUES: [string, string, string, string, string][] = [
  ['A Light on the Sea', 'A light out on the sea, blinking. It looks like a ship. It looks like it is the beacon.', 'Follow the gaps, not the flashes.', 'Follow the flashes.', 'It is a reflection. The gaps between the flashes line up with something on land, further round the cape.'],
  ["A Ship's Horn", "A ship's horn, out in the dark. Long, and low.", 'Turn round.', 'Walk towards the horn.', 'It is answering something behind you. You turn round, and there, faint on the headland, is a blink of light.'],
  ['A Line of Wingull', 'A line of Wingull, flying low over the water in a hurry, crying.', 'Go where they came from.', 'Follow the Wingull.', 'They are flying away from it. You walk the way they came, against the wind.'],
  ['Krabby on the Rocks', 'Krabby on the rocks, dozens of them, all facing one way. None of them moves when you pass.', 'Go the way they face.', 'Go the way they turn their backs on.', 'You go the way they face. A few of them shuffle round to keep facing it as you pass.'],
  ['The Tide', 'The tide, going out. You can hear it pulling at the stones.', "Follow the tide's pull, to the point.", 'Keep to the high-water line.', 'It is pulling toward the point. You follow it out across the wet sand.'],
];
const clueRoom = (n: number): Json => {
  const [name, intro, right, wrong, rightText] = CLUES[n - 1]!;
  return rm(`gn-09-clue-${n}`, `The Search: ${name}`, cape(), intro, [
    ch(right, out(rightText, flag('bill-clues'), flag('bill-read'), scene('gn-09-search'))),
    ch(wrong, out('You go the wrong way, and you only know it after an hour of walking.', flag('bill-read'), flag('bill-wrong'), scene('gn-09-walk'))),
  ]);
};
const SIGNAL_CRIES = ['A low call, like a horn.', 'A rising song.', "Something that isn't in the Pokédex."];
const signalRoom = (n: number, pattern: string, next: Json[]): Json => rm(`gn-09-signal-${n}`, 'The Signal', cape({ pokemon: 'clefairy' }), say(
  `A light pattern from the sea: *${pattern}*.`,
  '**Bill:** "Three patterns. Three cries on the machine. Match them. Take your time; it does."',
), SIGNAL_CRIES.map((cry, i) => ch(cry, i === n - 1
  ? out('You play the cry out to sea. Far off, something answers in the same voice, and goes quiet, satisfied. Bill writes it down.', flag('bill-matched'), ...next)
  : out('The wrong cry goes out over the water. The thing answers anyway, puzzled, a little slower. Bill writes that down too.', ...next))));
const BILL_REWARD: Json[] = [
  flag('kanto-bill-pc'), flag('kanto-ssanne-ticket'), item('bills-pc'), item('ss-ticket'), item('bills-recorder'), gn('eggNotes'),
  stampRegion('bill-region'), moment("You saw what answers Bill's lighthouse.", 70), leavePseudo(),
];
const SURFACED = [
  'A very large Dragonite. It stands in the shallows, taller than the lighthouse, and looks at the lamp as if it were a face.',
  'A Lapras pod: nine of them. The largest one sings. It is the third pattern.',
  'A Wailord. It rises, and rises, until it blocks out the sunrise.',
  'A silhouette. Bill puts his hand over your notebook. **Bill:** "No. Don\'t write that down. Don\'t ask me."',
];

const gn09: Json[] = [
  gev('gn-09-door', "Bill's Lighthouse", cape({ stop: 'event', rarity: 'rare', types: ['water'], requires: [notRegion('kanto'), not('bill-done')] }), BILL_DOOR_TEXT, BILL_DOOR_CHOICES),
  rm('gn-09-search', 'The Search', cape(), say(
    'The beacon is only visible at night, and only from the right places. There are signs, if you can read them.',
    'Five signs. Three right readings will lead you there. A wrong one costs a long walk.',
  ), [
    chIf([is('bill-clues', 3)], 'Follow the beacon.', out('There it is: the lamp, on the point, blinking. You can see the path up to it now.', room('gn-09-shore'))),
    chIf([is('bill-clues', 0, 2), is('bill-read', 0, 4)], 'Read the next sign.', out('You look for the next sign.', ...CLUES.map((_, i) => when('bill-read', { min: i, max: i }, [scene(`gn-09-clue-${i + 1}`)])))),
    chIf([is('bill-clues', 0, 2), is('bill-read', 5)], 'Walk back to the first sign.', out('Five signs, and not enough of them read right. The night is long. You walk back along the shore to where you started, and look again.', setTo('bill-read', 0), setTo('bill-clues', 0), scene('gn-09-search'))),
  ]),
  ...[1, 2, 3, 4, 5].map(clueRoom),
  rm('gn-09-walk', 'The Long Way Round', cape(), say(
    'The wrong way is a long way. The shore goes on in the dark, and the beacon is no nearer.',
  ), [ch('Walk back.', out('It costs you the walk, and nothing else. You come back to the signs with sand in your shoes.', scene('gn-09-search')))]),
  rm('gn-09-shore', 'The Shore', cape(), say(
    '*Thirty wild Pokémon on the sand, facing the sea. None of them looks round.*',
    '*Under the surface, something passes. It takes a long time to finish passing.*',
  ), [
    ch('Stand with them.', out('You stand with them. After a while your lead comes and stands beside you, and faces the sea too. It will not say why.', bond(1), room('gn-09-cottage'))),
    ch('Go up to the lighthouse.', out('You leave them to it and climb the path. Not one of them watches you go.', room('gn-09-cottage'))),
  ]),
  rm('gn-09-cottage', "The Keeper's Cottage", cape(), say(
    'The keeper\'s cottage at the foot of the tower. Old photographs on every wall.',
    '*A man and a Dragonite, forty years ago. A child on a Lapras. And some that shouldn\'t be here: Pokémon from regions you have already finished, in places you have been.*',
  ), [
    ch('Look closer.', out('One photograph has your lead in the background, small and out of focus, looking at the camera. The date on the back is from before it hatched. Your lead looks at it for a long time.', room('gn-09-stairs'))),
    ch('Leave them.', out('You leave them on the walls. Some things are easier not to look at closely.', room('gn-09-stairs'))),
  ]),
  rm('gn-09-stairs', 'The Stairs', cape({
    remembers: [{ id: 'kind', when: [is('fog-named')], notice: 'Under the crayon, one more line, newer: *"someone else came. they were nice to it too."*' }],
  }), say(
    'Research logs, pinned up all the way round the spiral stairs. Three hands.',
    '**The first hand, neat:** *"Signal sent 2100. No reply."*',
    '**The second, hurried:** *"Reply at 2140. Not a ship. Not anything I\'ve a name for."*',
    '**The third, a child\'s, in crayon:** *"it says hello back. it is sad. i told it about my dog."*',
  ), [ch('Climb to the lamp room.', out('You climb the last of the stairs. Somebody up there is talking to themselves.', room('gn-09-lamp')))]),
  rm('gn-09-lamp', 'The Lamp Room', cape({ pokemon: 'clefairy' }), say(
    'The lamp room. A machine as big as a wardrobe, humming. And at the console, a Clefairy.',
    '**The Clefairy, in a man\'s voice:** "Don\'t laugh. I\'m Bill. There was a mishap. The red button. No, the other red button."',
  ), [
    chIf([not('bill-signal-done')], 'Press the button.', out('You press the other red button. There is a flash, and a pop, and a man sitting on the floor where the Clefairy was, and a Clefairy sitting next to him, looking just as surprised.\n\n**Bill:** "Thank you. I\'ve been a Clefairy since Tuesday. The worst part is, I didn\'t mind it."', scene('gn-09-signal-1'))),
    chIf([not('bill-signal-done')], 'Laugh first.', out('You laugh. You can\'t help it. The Clefairy folds its arms and waits until you have finished, then points at the button, and you press it.\n\n**Bill:** "Thank you. I\'ve been a Clefairy since Tuesday. The worst part is, I didn\'t mind it."', scene('gn-09-signal-1'))),
    chIf([not('bill-signal-done')], 'Ask the Clefairy to dance.', out('It does a small, dignified dance. Halfway through, its foot catches the button. A flash, a pop: a man and a Clefairy, both mid-step.\n\n**Bill:** "Thank you. I\'ve been a Clefairy since Tuesday. The worst part is, I didn\'t mind it."', scene('gn-09-signal-1'))),
    chIf([is('bill-signal-done')], 'Go out onto the gallery.', out('The sky outside is going grey. Bill picks up a flask of tea and two cups. "Come on. It\'s nearly time."', room('gn-09-gallery'))),
  ]),
  signalRoom(1, 'long, long, short', [scene('gn-09-signal-2')]),
  signalRoom(2, 'short, short, short, long', [scene('gn-09-signal-3')]),
  signalRoom(3, 'one long, held', [setTo('bill-signal-done', 1), scene('gn-09-lamp')]),
  rm('gn-09-gallery', 'The Gallery, at Dawn', cape({ effect: 'sparkle' }), say(
    'The gallery round the top of the tower. Cold wind. The sea going from black to grey.',
    '**Bill:** "It comes at first light. It\'s come every morning for a year. I\'ve never been sure it\'s real."',
  ), [ch('Watch the water.', out('The sea goes still. Then it surfaces.', pick('bill-surfaced', 40, 35, 24, 1), ...SURFACED.map((t, i) => when('bill-surfaced', { min: i + 1, max: i + 1 }, [], t)), scene('gn-09-dawn')))]),
  rm('gn-09-dawn', 'The Gallery, at Dawn', cape({ effect: 'sparkle' }), say(
    '**Bill:** "It was looking for something its own size. That\'s all. I built a light, and it thought I was one."',
  ), [
    ch('Answer it, one more time.', out('Bill sends the signal one more time. It answers. Then it goes, slowly, the way it came.', flag('bill-answered'), ...BILL_REWARD)),
    ch('Turn the lamp off.', out('Bill turns the lamp off. It waits a long time in the grey water. Then it goes. Bill doesn\'t turn the lamp back on for a week.', flag('bill-lamp-off'), ...BILL_REWARD)),
    ch('Leave it on. Let it keep coming.', out('You leave it on. It will come every dawn. Bill isn\'t alone, and neither is it.', flag('bill-kept-on'), ...BILL_REWARD)),
  ]),
  // ---- afterstory: Bill writes once, in a later region ----
  gev('gn-09-letter', 'A Letter from Bill', cape({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('kanto-bill-pc'), not('bill-letter'), regionChanged('bill-region')],
    remembers: [{ id: 'lamp-off', when: [is('bill-lamp-off')], notice: '*P.S. I\'ve built a bigger lamp. I don\'t know yet if I\'ll turn it on.*' }],
  }), say(
    'A letter catches up with you, the envelope gone soft with travelling. Bill\'s handwriting, small and fast.',
    '*"I heard it again last night. Further out. I think it was saying goodbye, or hello. I wrote it down both ways."*',
  ), [ch('Fold the letter away.', out('You fold it carefully and keep it.', flag('bill-letter')))]),
];

// ---- Kanto: the canon space on the cape north of Cerulean (cs.kanto.cerulean.bill) ----
const KANTO_BILL: Json = { ...gev('cs-kanto-cerulean-bill', "Bill's Lighthouse", cape({ stop: 'event', rarity: 'common', types: ['water'], requires: [not('bill-done')] }), BILL_DOOR_TEXT, BILL_DOOR_CHOICES), canon: 'cs.kanto.cerulean.bill' };

// =====================================================================================================================
// gn.10  THE S.S. ANNE  (Pseudo Stage: three decks of four nodes, then the captain and the rival; Door step 5, optional; needs water; A5)
// =====================================================================================================================
const SHIP_TINT = '#2f5d73';
const ship = (o: Json = {}): Json => ({ tint: SHIP_TINT, tags: ['Dungeon', 'Story', 'Trainer'], effect: 'none', ...o });
const DECKS = ['Lower', 'Main', 'Upper'] as const;
const RQ = (o: Json): Json => ({ kind: 'rivalQuest', ...o });
/** Who you fight at each node (Sailor Dobbs-Leary takes the last node of every deck). */
const DECK_TRAINERS: { name: string; cls?: string; types: string[]; line: string }[] = [
  { name: 'Sailor', types: ['water', 'fighting'], line: 'A sailor coiling rope looks up and grins. "Passenger! Fancy a scrap before supper?"' },
  { name: 'Cook', types: ['normal', 'fire'], line: 'A cook in a stained apron blocks the corridor with a soup ladle. "Nobody gets past the galley without a battle. House rule."' },
  { name: 'Stowaway', types: ['poison', 'dark'], line: 'Someone climbs out of a lifeboat cover, blinking. "You didn\'t see me. Unless you want to battle about it."' },
  { name: 'Worker', cls: 'worker', types: ['steel', 'electric'], line: 'In the engine room, a worker wipes her hands. "Down here we settle things the old way."' },
  { name: 'Gentleman', types: ['normal', 'fairy'], line: 'A gentleman in a dinner jacket bows. "A friendly match, before the soup?"' },
  { name: 'Lass', cls: 'lass', types: ['normal', 'grass'], line: 'A lass on the stairs points at you. "You! You look like you battle. Battle me."' },
  { name: 'Fisher', cls: 'fisherman', types: ['water'], line: 'A fisher leaning over the rail reels in nothing at all. "Nothing biting. You\'ll do instead."' },
  { name: 'Waiter', types: ['normal', 'psychic'], line: 'A waiter balances a tray on one hand and a Poké Ball in the other. "Your table is ready. After this."' },
  { name: 'Collector', types: ['steel', 'ground'], line: 'A collector in a velvet coat sizes up your team, one by one. "Interesting. Let\'s see them work."' },
  { name: 'Ace Trainer', cls: 'ace-trainer', types: ['dragon', 'water'], line: 'An Ace Trainer at the top of the stairs. "I heard you\'ve been winning below decks. That stops here."' },
  { name: 'Veteran', cls: 'veteran', types: ['fighting', 'steel'], line: 'In the captain\'s corridor, a veteran stands guard. "The captain is resting. You\'ll have to get past me."' },
  { name: 'Officer', types: ['water', 'flying'], line: 'The first officer straightens his cap. "Last cabin before the bridge. Let\'s do this properly."' },
];
/** `learned`: he's learned from what beat him. If your party has a `sees`-type, he brings `types` built against it. */
const DOBBS: { lv: number; size: number; types: string[]; line: string; after: string; learned?: { sees: string; types: string[] } }[] = [
  { lv: -1, size: 2, types: ['water'], line: '**Sailor Dobbs-Leary:** "Dobbs-Leary, able seaman! Fancy a battle? Course you do."', after: '**Dobbs-Leary:** "Ha! Lost. Right. See you upstairs."' },
  { lv: 0, size: 3, types: ['water', 'grass'], learned: { sees: 'water', types: ['grass', 'electric'] }, line: '**Dobbs-Leary:** "I\'ve been thinking about that Water move of yours."', after: '**Dobbs-Leary:** "Still not enough. Still! Upstairs, then."' },
  { lv: 1, size: 3, types: ['water', 'dragon'], learned: { sees: 'grass', types: ['dragon', 'flying'] }, line: '**Dobbs-Leary:** "Third time. I\'ve a new friend. Meet the new friend."', after: '**Dobbs-Leary:** "Three times. Fair\'s fair." He presses something warm into your hand. "My lucky coin. Hasn\'t been lucky for me."' },
];
const REGION_TABLE: Record<string, string> = {
  pikachu: 'raichu-alola', raichu: 'raichu-alola', rattata: 'rattata-alola', raticate: 'raticate-alola', sandshrew: 'sandshrew-alola', sandslash: 'sandslash-alola',
  vulpix: 'vulpix-alola', ninetales: 'ninetales-alola', diglett: 'diglett-alola', dugtrio: 'dugtrio-alola', meowth: 'meowth-alola', persian: 'persian-alola',
  geodude: 'geodude-alola', graveler: 'graveler-alola', golem: 'golem-alola', grimer: 'grimer-alola', muk: 'muk-alola', exeggcute: 'exeggutor-alola', exeggutor: 'exeggutor-alola',
  cubone: 'marowak-alola', marowak: 'marowak-alola', ponyta: 'ponyta-galar', rapidash: 'rapidash-galar', slowpoke: 'slowpoke-galar', slowbro: 'slowbro-galar',
  farfetchd: 'farfetchd-galar', koffing: 'weezing-galar', weezing: 'weezing-galar', 'mr-mime': 'mr-mime-galar', growlithe: 'growlithe-hisui', arcanine: 'arcanine-hisui',
  voltorb: 'voltorb-hisui', electrode: 'electrode-hisui', qwilfish: 'qwilfish-hisui',
};
const REGIONALS = [...new Set([...Object.values(REGION_TABLE), 'meowth-galar'])];
/** Delta forms (customSpecies.json): any Pokémon with one can be traded for it, once per ship. */
const DELTA_TABLE: Record<string, string> = Object.fromEntries((customSpecies as { id: string }[]).map((x) => x.id).filter((id) => id.endsWith('-delta')).map((id) => [id.slice(0, -'-delta'.length), id]));
/** A blackout aboard: put ashore with no loss except the trades not yet taken (the captain's gift follows you down the gangway). */
const SSANNE_ASHORE: Json[] = [
  flag('ssanne-ashore'),
  when('ssanne-ashore', { min: 1 }, [], 'You wake on the harbour wall with your bag beside you. Nothing is missing. The passengers and their trades have sailed on. A steward has left a parcel: "From the captain. The Network Machine, and his compass."'),
  item('network-machine'), item('captains-compass'), flag('kanto-ssanne-done'), flag('kanto-ssanne-machine'), gn('stampRegion', { key: 'ssanne-region' }), leavePseudo(),
];
const deckRoom = (k: number): string => (k <= 12 ? `gn-10-deck-${k}` : 'gn-10-captain');
/** Optional rooms offered after a node's battle (up to four per voyage). */
const ROOM_AFTER: Record<number, Json[]> = {
  1: [scene('gn-10-galley'), scene('gn-10-secret')], 2: [scene('gn-10-engine')], 3: [roll('ssanne-stow-roll', 20), when('ssanne-stow-roll', { min: 1 }, [scene('gn-10-stowaways')])],
  5: [scene('gn-10-seasick')], 6: [scene('gn-10-dining')], 7: [scene('gn-10-games')], 8: [scene('gn-10-contest')],
  9: [scene('gn-10-collector')], 10: [roll('ssanne-cup-roll', 15), when('ssanne-cup-roll', { min: 1 }, [scene('gn-10-cup')])], 11: [roll('ssanne-duel-roll', 30), when('ssanne-duel-roll', { min: 1 }, [scene('gn-10-duel')])],
};
/** The secret trades, each stranger than the last: how many taken so far (from, to), the line, how far the swap may stray. */
const SECRET_TRADES: [number, number, string, Json][] = [
  [0, 0, 'Someone takes your Pokémon, and hands back something a little odd: from this region, but not what you would have picked.', { region: true, bst: 80 }],
  [1, 1, 'The second trader does not look at your Pokémon at all. What comes back is stranger than the last one.', { region: true, bst: 200 }],
  [2, 99, 'The third trader smiles. What comes back is not from this region, and nobody says where it is from.', { pool: REGIONALS, bst: 200 }],
];
const RESET_TRADES: Json[] = [setTo('ssanne-took-a', 0), setTo('ssanne-took-b', 0), setTo('ssanne-took-c', 0)];
const deckNode = (k: number): Json[] => {
  const deck = DECKS[Math.floor((k - 1) / 4)]!;
  const dobbs = k % 4 === 0 ? DOBBS[k / 4 - 1]! : null;
  const t = DECK_TRAINERS[k - 1]!;
  const here = deckRoom(k);
  const won = (extra: Json[]): Json[] => [setTo('ssanne-at', k), ...RESET_TRADES, ...extra, ...(ROOM_AFTER[k] ?? []), scene(here)];
  const dobbsFight = (types: string[]): Json => trainer('Sailor Dobbs-Leary', { size: dobbs!.size, types, lv: dobbs!.lv, win: won([flag('ssanne-dobbs'), ...(k === 12 ? [when('ssanne-dobbs', { min: 3 }, [item('amulet-coin')], DOBBS[2]!.after), when('ssanne-dobbs', { min: 0, max: 2 }, [], '**Dobbs-Leary:** "Well. That\'s that, then."')] : [when('ssanne-dobbs', { min: 1 }, [], dobbs!.after)])]), lose: SSANNE_ASHORE, friendly: true });
  const battle = dobbs
    ? dobbsFight(dobbs.types)
    : trainer(t.name, { ...(t.cls ? { cls: t.cls } : {}), size: 2, types: t.types, lv: 1, win: won([]), lose: SSANNE_ASHORE, friendly: true });
  const trades = `gn-10-trades-${k}`;
  const tradeB = `gn-10-tradeb-${k}`;
  const AT = is('ssanne-at', k, k);
  return [
    rm(here, `S.S. Anne: ${deck} Deck, Cabin ${k}`, ship(), say(
      k === 1 ? '**Boarding. Purser, Mr. Ashworth:** "Ticket. Thank you. Trainers aft, traders everywhere, the captain\'s unwell and would rather you didn\'t knock."' : `The ${deck.toLowerCase()} deck. The ship rolls, gently, under your feet.`,
      dobbs ? dobbs.line : t.line,
    ), [
      ...(dobbs?.learned
        ? [
          chIf([is('ssanne-at', k - 1, k - 1), { kind: 'partyType', type: dobbs.learned.sees }], 'Battle.', fight('He has learned from what beat him: his team is built for yours this time.', dobbsFight(dobbs.learned.types))),
          chIf([is('ssanne-at', k - 1, k - 1), { kind: 'partyType', type: dobbs.learned.sees, absent: true }], 'Battle.', fight('Battle on the open deck.', battle)),
        ]
        : [chIf([is('ssanne-at', k - 1, k - 1)], 'Battle.', fight('Battle on the open deck.', battle))]),
      chIf([AT], 'Trade with the passengers.', out('Two passengers are waiting with Poké Balls in their hands.', scene(trades))),
      chIf([AT], k === 12 ? 'Go to the captain\'s cabin.' : 'Move on.', out(k === 12 ? 'A steward finds you. "The captain is asking for you. He\'s, ah. Not well."' : 'You walk on along the deck.', ...RESET_TRADES, room(deckRoom(k + 1)))),
    ]),
    rm(trades, `S.S. Anne: Trades, Cabin ${k}`, ship(), say('Two trade offers. Each passenger shows you their card, honestly: what they give, and what they want.'), [
      chIf([not('ssanne-took-a')], 'Trade A: any Pokémon for one of similar strength.', out('A passenger trades with you: same level, much the same strength, from this region.', { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { region: true, bst: 40 }, honest: true }, flag('ssanne-took-a'), scene(trades))),
      chIf([not('ssanne-took-b')], 'Trade B: the region trade.', out('The second passenger opens a case of Poké Balls.', scene(tradeB))),
      chIf([is('ssanne-secret'), not('ssanne-took-c')], 'The secret trade.', out('Behind the kitchen, the traders look up from their cards.', scene(`gn-10-secret-${k}`))),
      ch('Back.', out('You leave the passengers to it.', scene(here))),
    ]),
    rm(`gn-10-secret-${k}`, `S.S. Anne: The Secret Trade, Cabin ${k}`, ship(), say('A card table, a lamp, and a Poké Ball pushed across the felt. Each trade in this room is stranger than the last.'), [
      ...SECRET_TRADES.map(([min, max, text, similar]) => chIf([is('ssanne-secret-n', min, max)], 'Trade.', out(text, { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar, honest: true }, flag('ssanne-took-c'), flag('ssanne-secret-n'), scene(trades)))),
      ch('Back.', out('"Suit yourself."', scene(trades))),
    ]),
    rm(tradeB, `S.S. Anne: The Region Trade, Cabin ${k}`, ship(), say('**Passenger:** "Anything with a regional cousin? I trade like for like: same level, and it keeps what it is holding."'), [
      ch('Trade for its regional form.', out('"Oh, a lovely one! I have just the thing."', { kind: 'tradeFor', want: { label: 'a Pokémon with a regional form', species: Object.keys(REGION_TABLE) }, table: k % 2 === 0 ? { ...REGION_TABLE, meowth: 'meowth-galar' } : REGION_TABLE, honest: 'region' }, flag('ssanne-took-b'), scene(trades))),
      ch('None of those: any Pokémon for a regional one.', out('"Never mind. Anything will do. Here, take this one."', { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, similar: { pool: REGIONALS, bst: 200 }, honest: 'region' }, flag('ssanne-took-b'), scene(trades))),
      chIf([not('ssanne-delta-done')], 'Trade for its Delta form.', out('A passenger in dark glasses looks at your Pokémon a long moment. "I know what that one could be." Same level. Something different looks back at you.', { kind: 'tradeFor', want: { label: 'a Pokémon with a Delta form', species: Object.keys(DELTA_TABLE) }, table: DELTA_TABLE, honest: 'region' }, flag('ssanne-took-b'), flag('ssanne-delta-done'), scene(trades))),
      ch('Back.', out('"Another time."', scene(trades))),
    ]),
  ];
};
/** An optional room: entering it counts toward the voyage's four. */
const ROOMS_LEFT = is('ssanne-rooms', 0, 3);
const enter = (label: string, success: Json, extra: Json[] = []): Json => chIf([ROOMS_LEFT, ...extra], label, { ...success, effects: [flag('ssanne-rooms'), ...(success.effects as Json[])] });
const pass = (text = 'You walk past. There will be other rooms.'): Json => ch('Walk past.', leave(text));
const MEALS: [string, Json][] = [
  ['Spicy Curry', { kind: 'damageMultiplier', value: 1.1 }], ['Citrus Salad', { kind: 'statMultiplier', stat: 'spe', value: 1.1 }], ['Hearty Stew', { kind: 'damageTakenMultiplier', value: 0.9 }],
  ['Grilled Fish', { kind: 'critChanceBonus', value: 0.1 }], ['Sweet Dumplings', { kind: 'xpMultiplier', value: 1.25 }],
];
const gn10: Json[] = [
  gev('gn-10-dock', 'The S.S. Anne', ship({ stop: 'event', rarity: 'rare', types: ['water'], requires: [notRegion('kanto'), not('ssanne-done')] }), say(
    'A great white liner at the harbour wall, flags up, the gangway down. The S.S. Anne, in port for one night.',
    'A guard at the foot of the gangway checks every ticket twice. Nobody gets on without one.',
  ), [
    chIf([is('kanto-ssanne-ticket')], 'Hand over the Ticket and board.', out('"Welcome aboard!" The gangway creaks under your feet.', flag('ssanne-done'), room('gn-10-deck-1'))),
    chIf([not('kanto-ssanne-ticket'), { kind: 'money', atLeast: 2000 }], 'Buy a spare Ticket at the harbour market (₽2,000), and board.', out('A stallholder sells you a spare ticket for ₽2,000, with a wink. The guard checks it twice, and lets you on.', { kind: 'money', amount: -2000 }, item('ss-ticket'), flag('kanto-ssanne-ticket'), flag('ssanne-done'), room('gn-10-deck-1'))),
    ch('Not today.', leave('You step back from the gangway. The ship sails at dawn without you.')),
  ]),
  ...Array.from({ length: 12 }, (_, i) => deckNode(i + 1)).flat(),
  // ---- the optional rooms ----
  rm('gn-10-galley', 'The Galley', ship({ effect: 'none' }), say('**Chef, Madame Brioche:** "Sit. You\'re thin."'), [
    enter('Sit down and eat.', out('She feeds your whole team, and you. A full meal: everyone is fully healed, and something on the plate stays with you.', { kind: 'heal', share: 1 }, pick('ssanne-meal', 1, 1, 1, 1, 1), ...MEALS.map(([name, fx], i) => when('ssanne-meal', { min: i + 1, max: i + 1 }, [{ kind: 'tempEffect', label: name, effects: [fx], battles: 1, until: 'battle' }], `${name}: for your next battle.`)))),
    pass(),
  ]),
  rm('gn-10-secret', 'The Secret Trade Room', ship({ effect: 'none' }), say(
    'Behind the kitchen, past the stoves, a door with no handle on the outside. Somebody has wedged it open with a ladle.',
    'Inside: a card table, a lamp, and people who do not give their names.',
  ), [
    enter('Go in.', out('Madame Brioche watches you go, and says nothing. "Traders. The odd kind. Don\'t tell the purser." For the rest of the voyage, there is a third trade at every cabin, each stranger than the last.', flag('ssanne-secret'))),
    pass('You leave the door as it is. Whatever is traded in there, it is not for you.'),
  ]),
  rm('gn-10-engine', 'The Engine Room', ship(), say(
    'Below the waterline, in the heat and the noise, a team is loading crates that aren\'t on the manifest.',
    'One of the crates is breathing.',
  ), [
    enter('Open one.', fight('A caged Pokémon looks up at you. Two Grunts look up from the crates at the same moment.', trainer('Grunts', { format: 'doubles', size: 2, types: ['poison', 'dark'], lv: 1, win: [flag('freed-caged'), flag('ssanne-engine-opened'), { kind: 'evil', heat: 1 }, intel(1)], lose: SSANNE_ASHORE, friendly: true }))),
    enter('Report it to the purser.', out('Mr. Ashworth listens, goes pale, and sends two officers down. By the time they get there the crates are gone, and so is the team.', flag('ssanne-engine-reported'))),
    ch('Walk away.', leave('You walk away. The crate goes on breathing behind you.')),
  ]),
  rm('gn-10-stowaways', 'The Stowaways', ship(), say(
    'A barrel in the corner is humming "Prepare for trouble". The lid pops off: Jessie, James and a very flustered Meowth.',
    '**Meowth:** "We are NOT stowaways. We are, uh. Barrel inspectors."',
  ), [
    enter('Battle the trio.', fight('"Prepare for trouble!" "Make it double!" The barrel rolls away mid-motto.', trainer('Jessie & James', { format: 'doubles', size: 2, lv: 1, win: [flag('ssanne-trio-seen'), flag('kanto-ssanne-stowaways'), intel(1)], lose: SSANNE_ASHORE, friendly: true }))),
    pass('You put the lid back on. The barrel says "thank you" in three voices.'),
  ]),
  rm('gn-10-seasick', 'The Seasick One', ship(), say('A passenger\'s Pokémon, green about the gills, alone on a bench. Its trainer is nowhere to be seen.'), [
    enter('Take it up for air.', out('You carry it up on deck. The wind does it good. When its trainer finds you, they shake your hand for a long time.', kindness(1), flag('ssanne-seasick'))),
    enter('Sit with it.', out('You sit with it until the worst passes. It leans on you. When its trainer finds you, they don\'t say anything; they just nod.', kindness(1), flag('ssanne-seasick'))),
    pass(),
  ]),
  rm('gn-10-dining', 'The Dining Room', ship(), say('Pokémon eat at the tables in the dining room, napkins tucked in. Your team gets a table of its own.'), [
    { ...enter('Sit one of them at the head of the table.', out('It sits at the head of the table, very straight, and is served first. It will not stop looking at you.', { kind: 'friendship', bond: 1, who: 'picked' })), pick: {} },
    pass(),
  ]),
  rm('gn-10-games', 'The Game Room', ship(), say('Cards, under green lamps. The odds are printed on the felt, honestly: the house wins four hands in ten.'), [
    { ...enter('Play a hand: ₽500 on the table, 60% to win ₽1,000.', out('You win the hand. The dealer slides the chips across without a word.', { kind: 'money', amount: 1000 }), [{ kind: 'money', atLeast: 500 }]), chance: 0.6, failure: { text: 'You lose the hand. The odds were on the felt.', effects: [flag('ssanne-rooms'), { kind: 'money', amount: -500 }] } },
    pass('You watch a few hands, and keep your money.'),
  ]),
  rm('gn-10-contest', 'The Beauty Contest', ship({ effect: 'sparkle' }), say('A beauty contest in the ballroom. One entrant each. The judges look at condition, and at how much the Pokémon trusts its trainer.'), [
    { ...enter('Enter your lead.', out('A polite round of applause, and second place. The judges liked it, but they could tell: its condition, or how far it trusts you, was not quite there.')), branches: [{ when: [{ kind: 'bondLevel', atLeast: 3, who: 'lead' }, { kind: 'gn', test: 'leadFit' }], text: 'It walks out like it owns the ballroom, in perfect condition, and looks back at you once, at the end. First place. The judges stand up.', effects: [flag('ssanne-rooms'), flag('ssanne-contest-won'), bond(1)] }] },
    pass(),
  ]),
  rm('gn-10-collector', 'The Collector', ship(), say(
    'A man with a monocle and a velvet coat stops you on the stairs. He points at one of your team.',
    '**Mr. Cornelius Quayle:** "That one. Name your price."',
  ), [
    enter('No.', out('"Two thousand, then."', scene('gn-10-collector-2'))),
    enter('Yes.', out('"Fifteen hundred. A pleasure." He takes it away with both hands, as if it might break.', { kind: 'tradeAway', want: { label: 'the Pokémon he points at' } }, { kind: 'money', amount: 1500 }, flag('ssanne-collector-sold'))),
  ]),
  rm('gn-10-collector-2', 'The Collector', ship(), say('**Quayle:** "Three thousand. I am being very reasonable."'), [
    ch('No.', out('"Five, then. Final offer. Probably."', scene('gn-10-collector-3'))),
    ch('Yes.', out('"Three thousand. A pleasure."', { kind: 'tradeAway', want: { label: 'the Pokémon he points at' } }, { kind: 'money', amount: 3000 }, flag('ssanne-collector-sold'))),
  ]),
  rm('gn-10-collector-3', 'The Collector', ship(), say('**Quayle:** "Five thousand. You will not see an offer like it again on this sea."'), [
    ch('No.', out('He sighs, very deeply, and gives you his card. *Cornelius Quayle. Collector. Always buying.* "You\'ll hear from me."', setTo('ssanne-collector-refused', 3))),
    ch('Yes.', out('"Five thousand. A pleasure, finally."', { kind: 'tradeAway', want: { label: 'the Pokémon he points at' } }, { kind: 'money', amount: 5000 }, flag('ssanne-collector-sold'))),
  ]),
  rm('gn-10-cup', 'The Deck Cup', ship(), say('The sun deck has been cleared for a tournament: three rounds, one winner, and a Rare Candy on a velvet cushion.'), [
    enter('Enter the cup.', fight('Three rounds, back to back.', trainer('Cup Challenger', { size: 2, lv: 2, chain: 3, chainHeal: 0.2, win: [item('rare-candy')], lose: SSANNE_ASHORE, friendly: true }))),
    pass('You watch from the rail.'),
  ]),
  rm('gn-10-duel', 'The Passenger Duel', ship(), say('A passenger in a white suit flips a coin onto the table. "Two against two. The stake is a Premium Ball. Interested?"'), [
    enter('Accept.', fight('Two against two, on the card table.', trainer('Rich Passenger', { format: 'doubles', size: 2, types: ['normal', 'psychic'], lv: 1, win: [item('premier-ball')], lose: SSANNE_ASHORE, friendly: true }))),
    pass('You decline. The coin goes back in the waistcoat pocket.'),
  ]),
  // ---- the captain and the rival ----
  rm('gn-10-captain', "The Captain's Cabin", ship(), say(
    'A cabin. A man the colour of old paper, lying very still in a bunk.',
    '**Captain Winslow:** "Thirty years at sea. Still. Every voyage. Don\'t tell the crew."',
  ), [
    ch('Rub his back.', out('You rub his back. After a while he breathes out, long and slow, and sits up.', room('gn-10-rival'))),
    ch("Fetch the galley's ginger.", out('Madame Brioche hands over the ginger without a word. The captain chews it, makes a face, and sits up.', room('gn-10-rival'))),
    ch('Let a Pokémon sing to him.', out('One of your team sings, quietly. The captain closes his eyes. When it finishes, he sits up.', room('gn-10-rival'))),
  ]),
  rm('gn-10-rival', 'The Top Deck', ship({
    remembers: [
      { id: 'show', when: [RQ({ personality: ['prodigy', 'enthusiast'] })], notice: '**Rival:** "Front row for my next win. You\'re welcome."' },
      { id: 'plan', when: [RQ({ personality: ['strategist'] })], notice: '**Rival:** "Twelve cabins, one captain, one top deck. I worked out you\'d end up here before I boarded."' },
      { id: 'gentle', when: [RQ({ personality: ['protector', 'idealist'] })], notice: '**Rival:** "Did you see the seasick one on the main deck? I hope somebody sat with it."' },
    ],
  }), say(
    'On the top deck, in the wind, someone you know is leaning on the rail.',
    '**Rival:** "Of course you\'re on this boat."',
  ), [ch('Battle.', fight('A full battle on the top deck, the sea all round.', trainer('Rival', { rival: true, size: 4, lv: 1, win: [scene('gn-10-gift')], lose: SSANNE_ASHORE, friendly: true }),
    gn('check', { key: 'ssanne-rv-ahead', if: [{ kind: 'gn', test: 'rivalAhead' }] }), gn('check', { key: 'ssanne-rv-won', if: [{ kind: 'rivalLast', result: 'win' }] }), gn('check', { key: 'ssanne-rv-lost', if: [{ kind: 'rivalLast', result: 'lose' }] }),
    when('ssanne-rv-ahead', { min: 1 }, [], '**Rival:** "I\'m ahead, you know. I counted on the way up the stairs."'),
    when('ssanne-rv-ahead', { min: 0, max: 0 }, [], '**Rival:** "You\'re ahead. For now. Boats are good for catching up."'),
    when('ssanne-rv-won', { min: 1 }, [], '**Rival:** "Last time you beat me. I\'ve thought about it every day since."'),
    when('ssanne-rv-lost', { min: 1 }, [], '**Rival:** "Last time I beat you. Don\'t let the sea air fool you: I can do it again."'),
    when('ssanne-engine-opened', { min: 1 }, [], '**Rival:** "And I saw you go down to the engine room. What was in those crates?"'),
  ))]),
  rm('gn-10-gift', "The Captain's Gift", ship({ effect: 'sparkle' }), say(
    'The captain is on his feet at the top of the gangway when the ship comes in. He presses two things into your hands.',
    '**Captain Winslow:** "The Network Machine. And my compass. It has never once pointed north."',
  ), [ch('Take them, and go ashore.', out('You go down the gangway with the Network Machine and the Captain\'s Compass. Behind you the S.S. Anne sounds its horn.', item('network-machine'), item('captains-compass'), flag('kanto-ssanne-done'), flag('kanto-ssanne-machine'), stampRegion('ssanne-region'), moment('You sailed on the S.S. Anne, and the captain gave you his compass.', 70), leavePseudo()))]),
  // ---- afterstory: passengers from the voyage across the region; the Collector's still asking ----
  gev('gn-10-passengers', 'A Familiar Face', ship({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('kanto-ssanne-done'), is('ssanne-after', 0, 2), { kind: 'gn', test: 'notThisStage', key: 'ssanne-after-stage' }],
    remembers: [
      { id: 'seasick', when: [is('ssanne-seasick'), not('ssanne-after')], notice: 'It is the owner of the seasick Pokémon. It is not green any more. It sees you first, and pulls its trainer across the road by the sleeve. **The owner:** "You! It remembers you. So do I."' },
      { id: 'collector', when: [is('ssanne-collector-refused')], notice: 'Across the street, a velvet coat and a monocle. Mr. Quayle raises his hat to you, and then, unmistakably, looks at the same Pokémon as before. **Quayle:** "Still not for sale? I\'m still asking."' },
    ],
  }), say(
    'A face you know from the ship: someone from the dining room, or the card tables, or the rail. They wave. "The S.S. Anne! You were on her too!"',
  ), [ch('Wave back.', out('You talk about the voyage for a while, the way people do. The passengers got off at every port along this coast; you will see more of them.', flag('ssanne-after'), gn('stampStage', { key: 'ssanne-after-stage' })))]),
];

// ---- Kanto: the canon space at Vermilion harbour (cs.kanto.vermilion.ssanne) ----
const KANTO_SSANNE: Json = { ...gev('cs-kanto-vermilion-ssanne', 'The S.S. Anne', ship({ stop: 'event', rarity: 'common', types: ['water'], requires: [not('ssanne-done')] }), (gn10[0] as { intro: string }).intro, (gn10[0] as { choices: Json[] }).choices), canon: 'cs.kanto.vermilion.ssanne' };

export const EVENTS: Json[] = [...gn06, ...starterEpisodes, KANTO_BRIDGE, ...gn07, KANTO_RAIN, ...gn08, KANTO_SQUAD, ...gn09, KANTO_BILL, ...gn10, KANTO_SSANNE];

/** The old Kanto canon builds of this story (moved to Greenneedle): kept for saved runs, never shown again. */
export const REMOVE: string[] = [
  'cs-kanto-cerulean-squad-n1', 'cs-kanto-cerulean-squad-n2', 'cs-kanto-cerulean-squad-n3', 'cs-kanto-cerulean-squad-reward',
  ...['charmander', 'growlithe', 'vulpix', 'ponyta', 'cyndaquil', 'torchic', 'chimchar', 'tepig', 'fennekin', 'litten', 'scorbunny', 'fuecoco'].flatMap((f) => ['open', 'r1', 'r2', 'r3', 'owner'].map((n) => `cs-kanto-cerulean-rain-${f}-${n}`)),
  'cs-kanto-cerulean-rain-lost',
  'cs-kanto-cerulean-bridge-n1', 'cs-kanto-cerulean-bridge-n2', 'cs-kanto-cerulean-bridge-n3',
  'cs-kanto-cerulean-village', 'cs-kanto-cerulean-hv-n1', 'cs-kanto-cerulean-hv-n2', 'cs-kanto-cerulean-hv-n3', 'cs-kanto-cerulean-hv-pick',
  'cs-kanto-cerulean-hv-t1', 'cs-kanto-cerulean-hv-t2', 'cs-kanto-cerulean-hv-t3', 'cs-kanto-cerulean-hv-t4', 'cs-kanto-cerulean-hv-t5',
  'cs-kanto-cerulean-hv-t6', 'cs-kanto-cerulean-hv-t7', 'cs-kanto-cerulean-hv-t8', 'cs-kanto-cerulean-hv-t9', 'cs-kanto-cerulean-hv-exit',
  ...['n1', 'n2', 'n3', 'n4', 'n5', 'final', 'house'].map((n) => `cs-kanto-cerulean-bill-${n}`),
  ...[...Array.from({ length: 12 }, (_, i) => [`n${i + 1}`, `t${i + 1}`]).flat(), 'galley', 'meal1', 'meal2', 'meal3', 'meal4', 'meal5', 'stow', 'duel', 'cup', 'captain', 'rival', 'reward'].map((n) => `cs-kanto-vermilion-ssanne-${n}`),
];

export const PLACEMENT: Record<string, Placement> = {
  'gn-06-bridge': {
    gn: 'gn.06', shape: 'Single', earliest: 'A2', home: 10, window: [8, 12], sits: 'must-see', tags: ['Interrupting Episode', 'Pseudo Stage', 'Community Episode'],
    level: 'A+0 in the gorge; bridge trainers A-1', often: 'region', dressing: { kanto: 'Nugget Bridge', kantoStage: 'Cerulean (the canon space)', elsewhere: 'Bridge Crossing' },
    note: 'Kanto shows it through the canon space cs-kanto-cerulean-bridge. The village starter is once per run for each starter (no cross-run memory).',
  },
  'gn-07-door': {
    gn: 'gn.07', shape: 'Door', earliest: 'A3', home: 13, window: [11, 16], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage', 'Companion Story'],
    level: 'A+1', often: 'run', dressing: { kanto: "Cold Night's Rain", kantoStage: 'The road out of Cerulean (the canon space)', elsewhere: "Cold Night's Rain" },
    note: 'Kanto shows it through cs-kanto-cerulean-rain. The opening can not be skipped: "Go on your way" ends it at once.',
  },
  'gn-08-town': {
    gn: 'gn.08', shape: 'Single', earliest: 'A3', home: 7, window: [5, 11], sits: 'optional', tags: ['Miniature Episode', 'Community Episode'],
    level: 'Lesser A-1, the Leader A+0, the Blastoise A+1', often: 'run', dressing: { kanto: 'The Squirtle Squad', kantoStage: 'A town on the road from Cerulean (the canon space)', elsewhere: 'The Squirtle Squad' },
  },
  'gn-09-door': {
    gn: 'gn.09', shape: 'Door', earliest: 'A3', home: 16, window: [14, 18], sits: 'optional', tags: ['Pseudo Stage', 'Mystery Episode'], needs: ['water'],
    level: 'A-1', often: 'run', dressing: { kanto: "Bill's Lighthouse", kantoStage: 'The cape north of Cerulean (the canon space)', elsewhere: "Bill's Lighthouse" },
    note: 'Better at night: the search is always played at night. Kanto shows it through cs-kanto-cerulean-bill.',
  },
  'gn-10-dock': {
    gn: 'gn.10', shape: 'Door', earliest: 'A5', home: 5, window: [3, 8], sits: 'optional', tags: ['Pseudo Stage', 'Hub Destination'], needs: ['water'],
    level: 'A+1', often: 'run', dressing: { kanto: 'The S.S. Anne', kantoStage: 'Vermilion harbour (the canon space)', elsewhere: 'The S.S. Anne' },
    note: "Needs Bill's Ticket (gn.09) or a spare from the harbour market for 2,000. Kanto shows it through cs-kanto-vermilion-ssanne.",
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_ssanne', name: 'The S.S. Anne', entry: 'gn-10-dock', themeId: 'normal-water', tint: SHIP_TINT, mood: 'sea air', start: 'opened' },
  { id: 'ps_gn_lighthouse', name: "Bill's Lighthouse", entry: 'gn-09-door', themeId: 'water-dragon', tint: BILL_TINT, mood: 'night sea', start: 'opened' },
  { id: 'ps_gn_rain', name: "Cold Night's Rain", entry: 'gn-07-door', themeId: 'water-ghost', tint: RAIN_TINT, mood: 'rain', start: 'opened' },
  { id: 'ps_gn_gorge', name: 'The Gorge and the Hidden Village', entry: 'gn-06-bridge', themeId: 'water-grass', tint: GORGE_TINT, mood: 'woodsmoke', start: 'opened' },
];
