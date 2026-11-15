// Greenneedle, part 2: events gn.06 to gn.10 (doc GREENNEEDLE_REWORKED_PLACED_2.md).
// gn.06 Bridge Crossing and the Hidden Village.
// In Kanto the canon space at Cerulean ("Nugget Bridge", cs-kanto-cerulean-bridge) opens the same story; everywhere else the placer puts
// gn-06-bridge on step 10. The old canon sub-scenes are retired (CANON_SPACES_KANTO_MOVED_TO_GREENNEEDLE.md: "The Greenneedle version is the only version").
// Build: npm run co:build -- greenneedle-2
import { ch, fight, flag, heal, item, join, leave, out, room, trainer, wild, type Json } from '../dsl.ts';
import { chIf, eitherWay, gev, gn, inside, intel, is, leavePseudo, moment, not, partyHas, pick, rm, roll, say, scene, setTo, when, type Placement } from './_gn.ts';

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
    stop: 'dungeon', rarity: 'rare', forced: true, types: ['normal', 'water'], effect: 'none', requires: [notRegion('kanto')],
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
    ch('Climb the steps.', fight(
      'You climb. Something that lives on the steps does not like being climbed past.',
      inside(eitherWay(wild({ types: ['grass', 'bug'], lv: 0, win: [room('gn-06-mill')] }))),
    )),
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
    ch('Sit, and eat.', out(
      'You sit. Somebody puts a bowl in your hands. It is hot, and plain, and the best thing you have eaten in weeks. Around you the village goes back to its day, and lets you be part of it.',
      ...STARTERS.map((s) => when('gn-village-starter', { min: s.n, max: s.n }, [partyHas('gn-st-family', ...s.family), when(`gn-st-${s.id}-joined`, { min: 0, max: 0 }, [scene(s.first)])])),
      scene('gn-06-pool'), scene('gn-06-shrine'), scene('gn-06-legend'),
      scene('gn-06-task-mill'), scene('gn-06-task-hat'), scene('gn-06-task-food'),
      scene('gn-06-rope'),
    )),
  ]),
  rm('gn-06-pool', 'The Healing Pool', gorge({ effect: 'sparkle' }), say(
    'A pool in a ring of flat stones, steaming. The water is the colour of weak tea and smells of moss. A child is sitting with her feet in it.',
    '**Child:** "It fixes things. Not everything. Most things."',
  ), [ch('Let your team rest in it.', out('One by one they wade in, and one by one their shoulders come down. When they climb out, every scrape is gone. The pool is a little cloudier. It will clear by morning.', heal(1)))]),
  rm('gn-06-shrine', 'The Berry Shrine', gorge({ effect: 'none' }), say(
    'A little roofed shelf at the edge of the orchard, with a bowl on it. In the bowl, Berries. Next to the bowl, a carved hand, palm up.',
    'There is no one watching it. There does not need to be.',
  ), [ch('Take one for each of your team.', out('One each. You count twice, to be sure. The carved hand does not mind.', itemEach('oran-berry')))]),
  rm('gn-06-legend', "Granny Tamsel's Legend", gorge({ cast: [], effect: 'none' }), say(
    'In the evening, by the fire, Granny Tamsel tells the story the village always tells.',
    '**Granny Tamsel:** "Nine little green ones, from nine far places. Each one fell, the way you did. Each one stayed."',
    '**Granny Tamsel:** "They don\'t belong to us. We belong to them, a bit. One lives here now. It will look at you."',
    '**Granny Tamsel:** "If it likes what it sees, it goes with you. We never give them. They go."',
  ), [ch('Listen until the fire is low.', out('By the time she stops, half the village is asleep where they sit. You are not. You are thinking about being looked at.', intel(1)))]),
  rm('gn-06-task-mill', 'Mend the Mill', gorge({ effect: 'none' }), say(
    'The waterwheel has stopped. River weed has wound itself through the paddles, thick as rope, and the miller stands looking at it with his hands on his hips.',
    '**The miller:** "Every spring. Every single spring."',
  ), [
    chIf([{ kind: 'partyTypes', types: ['water', 'grass', 'fighting'] }], 'Send a Pokémon in to clear it.', out('Your Pokémon goes at the weed like it has a grudge. In a few minutes the wheel shudders, and turns, and the whole village looks up at the sound.', ...STANDING('gn-village-mill'))),
    ch('Clear it yourself, by hand.', out('It takes the whole afternoon. Your hands are green to the wrist. When the wheel finally turns, the miller shakes one of them anyway.', ...STANDING('gn-village-mill'))),
  ]),
  rm('gn-06-task-hat', 'Find the Hat', gorge({ effect: 'none' }), say(
    'A small boy, Pip-Tamsel, has lost his straw hat. He is not crying. He is very nearly crying, and he would like you to know that he is not.',
    '**Pip:** "It was my grandad\'s. It\'s too big. I was growing into it."',
  ), [ch('Help him look.', out('You look in the stream, on the mill roof, and under every bush he points at.', pick('gn-village-hat', 1, 1, 1),
    when('gn-village-hat', { min: 1, max: 1 }, [...STANDING('gn-village-hat')], 'It is in the stream, caught on a stone. You fish it out. Pip puts it on wet, and it comes down over his eyes, and he does not care.'),
    when('gn-village-hat', { min: 2, max: 2 }, [...STANDING('gn-village-hat')], 'It is on the mill roof. You climb. You do not look down. Pip claps when you hand it over.'),
    when('gn-village-hat', { min: 3, max: 3 }, [scene('gn-06-task-lotad')], 'It is on the head of a wild Lotad, sitting in the shallows, looking extremely pleased with itself.'),
  ))]),
  rm('gn-06-task-lotad', 'The Lotad in the Hat', gorge({ pokemon: 'lotad', effect: 'none' }), say(
    'The Lotad wears the hat the way a king wears a crown. It has never owned anything before. You can tell.',
    'Pip looks at the Lotad. The Lotad looks at Pip.',
  ), [
    ch('Trade it a Berry.', out('You hold out a Berry. The Lotad thinks about it for a long time, then tips its head, and the hat slides off into Pip\'s arms. It eats the Berry like it has won.', ...STANDING('gn-village-hat'))),
    ch('Let it keep it; weave him a new one.', out('You sit with Pip by the water and weave reeds until your fingers ache. The new hat is lopsided. He loves it more than the old one, and will not say so.', ...STANDING('gn-village-hat'))),
  ]),
  rm('gn-06-task-food', 'Share Food', gorge({ effect: 'none' }), say(
    'At dusk the village eats together, at one long table under the trees. Everybody brings something. Nobody checks.',
    '**Granny Tamsel:** "Sit down, then. You\'re making the place look untidy."',
  ), [
    ch('Put in a Berry.', out('You put a Berry in the big bowl in the middle. Somebody cuts it into enough pieces for everyone, somehow.', ...STANDING('gn-village-food'))),
    ch('Cook something.', out('You cook. It is not very good. Everybody eats it anyway, and the miller asks for more, which is either kindness or a very strange palate.', ...STANDING('gn-village-food'))),
    ch('Just sit down when asked.', out('You sit. You eat what you are given. You laugh when the others laugh. That, it turns out, was the task.', ...STANDING('gn-village-food'))),
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

  // Treecko: a three-tap rooftop race against the elder, then "Plant a cutting."
  st(tre, '', 'The Dying Tree', say(
    'A Treecko will not leave an old tree at the edge of the village. The tree is nearly gone: grey bark, three green leaves.',
    'To speak to it, says the village, you must first beat the Treecko elder across the rooftops. The elder is already waiting on the first roof.',
  ), [ch('Climb up and race.', out('The elder flicks its tail: go.', scene('gn-06-st-treecko-2')))]),
  st(tre, '-2', 'The Rooftops: First Gap', say('The first gap. The roof on the far side is lower, and wet.'), quiz([scene('gn-06-st-treecko-3')], FAILED(tre), [
    ['Jump now.', true, 'You land, skid, keep going. The elder glances back, surprised.'],
    ['Wait a beat.', false, 'The elder is already two roofs on. You will not catch it now.'],
  ])),
  st(tre, '-3', 'The Rooftops: The Long Roof', say('A long roof, a loose tile halfway along, and the elder going straight over it without slowing.'), quiz([scene('gn-06-st-treecko-4')], FAILED(tre), [
    ['Go round the loose tile.', true, 'Round it, and on. You lose a step. You keep your feet.'],
    ['Follow the elder straight over.', false, 'The tile goes. So do you, very nearly. By the time you are up, the race is over.'],
  ])),
  st(tre, '-4', 'The Rooftops: The Last Leap', say('The last roof, and the old tree beyond it. The elder is beside you, neck and neck.'), quiz([scene('gn-06-st-treecko-5')], FAILED(tre), [
    ['Wait a beat, then jump.', true, 'The elder jumps first, too early, and has to scramble. You land clean. It looks at you a long time, then steps aside.'],
    ['Jump now.', false, 'Too early. You catch the edge, and hang there, and the elder looks down at you, not unkindly.'],
  ])),
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

  // Rowlet: a night patrol past three sleepers without waking the village, then lift it out of the chimney.
  st(row, '', 'The Rescue', say(
    'A Rowlet is stuck in a chimney. It is asleep. It has been asleep, the village thinks, for two days.',
    'The chimney is on the far side of the village. To get there at night, you must pass three sleeping Pokémon without waking anyone.',
  ), [ch('Go at midnight.', out('The moon is thin. Everything is very quiet, and very close.', scene('gn-06-st-rowlet-2')))]),
  st(row, '-2', 'The Night Patrol: the Snorlax', say('A Snorlax across the path, snoring like a bellows.'), quiz([scene('gn-06-st-rowlet-3')], FAILED(row), [
    ['Climb over it, softly.', false, 'Its eyes open. It sits up. So does every light in the village.'],
    ['Go round by the fence.', true, 'Round by the fence, between the posts. It snores on.'],
  ])),
  st(row, '-3', 'The Night Patrol: the Growlithe', say('A Growlithe asleep on a step, one ear twitching.'), quiz([scene('gn-06-st-rowlet-4')], FAILED(row), [
    ['Walk past downwind.', true, 'The wind takes your smell away. The ear stops twitching.'],
    ['Walk past quickly.', false, 'It wakes, and barks, and barks.'],
  ])),
  st(row, '-4', 'The Night Patrol: the Hoothoot', say('A Hoothoot on the chimney\'s own roof, eyes shut, one foot tucked up.'), quiz([scene('gn-06-st-rowlet-5')], FAILED(row), [
    ['Wait for it to turn its head.', true, 'It turns its head, all the way round, the other way. You climb.'],
    ['Climb while it sleeps.', false, 'Hoothoot never fully sleep. It hoots. Lights come on.'],
  ])),
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
  ), quiz(TRUSTED(gro), FAILED(gro), [
    ['Long, short, short, long.', true, 'You play it back. It plays it again, louder, faster, and the whole village starts clapping along. It finds the beat. It keeps it. It keeps you.'],
    ['Short, long, long, short.', false, 'It stops. It looks at the stick. The beat falls apart again.'],
    ['Long, long, short, short.', false, 'Close. Not close enough. It sits back down on its stump.'],
  ])),

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

export const EVENTS: Json[] = [...gn06, ...starterEpisodes, KANTO_BRIDGE];

/** The old Kanto canon builds of this story (moved to Greenneedle): kept for saved runs, never shown again. */
export const REMOVE: string[] = [
  'cs-kanto-cerulean-bridge-n1', 'cs-kanto-cerulean-bridge-n2', 'cs-kanto-cerulean-bridge-n3',
  'cs-kanto-cerulean-village', 'cs-kanto-cerulean-hv-n1', 'cs-kanto-cerulean-hv-n2', 'cs-kanto-cerulean-hv-n3', 'cs-kanto-cerulean-hv-pick',
  'cs-kanto-cerulean-hv-t1', 'cs-kanto-cerulean-hv-t2', 'cs-kanto-cerulean-hv-t3', 'cs-kanto-cerulean-hv-t4', 'cs-kanto-cerulean-hv-t5',
  'cs-kanto-cerulean-hv-t6', 'cs-kanto-cerulean-hv-t7', 'cs-kanto-cerulean-hv-t8', 'cs-kanto-cerulean-hv-t9', 'cs-kanto-cerulean-hv-exit',
];

export const PLACEMENT: Record<string, Placement> = {
  'gn-06-bridge': {
    gn: 'gn.06', shape: 'Single', earliest: 'A2', home: 10, window: [8, 12], sits: 'must-see', tags: ['Interrupting Episode', 'Pseudo Stage', 'Community Episode'],
    level: 'A+0 in the gorge; bridge trainers A-1', often: 'region', dressing: { kanto: 'Nugget Bridge', kantoStage: 'Cerulean (the canon space)', elsewhere: 'Bridge Crossing' },
    note: 'Kanto shows it through the canon space cs-kanto-cerulean-bridge. The village starter is once per run for each starter (no cross-run memory).',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_gorge', name: 'The Gorge and the Hidden Village', entry: 'gn-06-bridge', themeId: 'water-grass', tint: GORGE_TINT, mood: 'woodsmoke', start: 'opened' },
];
