// Catalog Overhaul Pack, legends: the Z Anomalies (QUESTLINES_ALPHAS_AND_ANOMALIES.md part four).
// Z1 rebuilds the 18 island-trial-* ids (three a run, drawn by the run's type spread); Z2 rebuilds z-sigil-ruin, z-sigil-pool and
// z-form-trial; Z3, Z4, Z6 and Z7 are pack questlines (status `extra`). Z5 (Darkrai's Darkest Dream) is built with the Mythicals.
// Run flags: `trials-passed` (each Trial), `trials-calmed` (each Totem calmed), `sigils-held` (a pair of sigils kept for a Z-Mega).
import { ch, ev, fight, flag, flagIs, fr, has, heal, item, leave, lose, moveFlag, out, ptype, room, rp, takeNode, trainer, at as when, wild, type Json } from '../dsl.ts';
import { alpha, gift } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Z Anomalies';
const T = 'Z-Trials';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 70): Json => ({ kind: 'moment', text, importance });
const starterType = (type: string): Json => ({ kind: 'starter', type });
const stamped = (key: string): Json => ({ kind: 'flag', key, amount: 1, stamp: 'region' });
const cap = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}`;

// ---------------------------------------------------------------- Z1. The Island Chain
type Trial = { type: string; crystal: string; place: string; captain: string; totem: string; reason: string; thanks: string };
const TRIALS: Trial[] = [
  { type: 'normal', crystal: 'normalium-z', place: 'a grassy shrine', captain: 'Captain Yuri', totem: 'gumshoos', reason: 'It is big because it is hungry. Somebody fed it once, for a whole summer, and then left. It has been waiting for them at the shrine ever since.', thanks: 'silk-scarf' },
  { type: 'fighting', crystal: 'fightinium-z', place: 'a dojo of stone', captain: 'Captain Gaku', totem: 'hariyama', reason: 'It is big because its trainer told it to guard the dojo, and then the dojo closed. It has been guarding nothing for ten years.', thanks: 'black-belt' },
  { type: 'flying', crystal: 'flyinium-z', place: 'a cliff above the clouds', captain: 'Captain Sora', totem: 'toucannon', reason: 'It is big because its nest fell. It grew to be big enough to catch the next one.', thanks: 'sharp-beak' },
  { type: 'poison', crystal: 'poisonium-z', place: 'a swamp of green mist', captain: 'Captain Mire', totem: 'salazzle', reason: 'It is big because the swamp was drained once, and it was the only one left to fill it back with its own mist.', thanks: 'poison-barb' },
  { type: 'ground', crystal: 'groundium-z', place: 'a canyon of red dust', captain: 'Captain Dune', totem: 'mudsdale', reason: 'It is big because it carried every stone out of a rockslide that buried its herd. It is still carrying them, in its head.', thanks: 'soft-sand' },
  { type: 'rock', crystal: 'rockium-z', place: 'a quarry of glittering stone, where Kahuna Olivia sits on a boulder watching', captain: 'Captain Flint', totem: 'lycanroc', reason: 'It is big because the quarry blasts at sunrise, every day, and it howls back at them, every day, and it has never once lost.', thanks: 'hard-stone' },
  { type: 'bug', crystal: 'buginium-z', place: 'a hollow tree alive with hum', captain: 'Captain Fern', totem: 'vikavolt', reason: 'The Swarm Totem is an Alpha Vikavolt guarding a hive that was robbed. It thinks you came back for the rest.', thanks: 'silver-powder' },
  { type: 'ghost', crystal: 'ghostium-z', place: 'a lantern-lit graveyard', captain: 'Captain Hollow', totem: 'mimikyu', reason: 'It is big because it wanted to be loved, and it made its costume bigger and bigger so somebody would notice.', thanks: 'spell-tag' },
  { type: 'steel', crystal: 'steelium-z', place: 'a forge under the hill', captain: 'Captain Anvil', totem: 'bronzong', reason: 'It is big because it was a bell, once, in a town that is gone, and it is still trying to ring loud enough for someone to hear.', thanks: 'metal-coat' },
  { type: 'fire', crystal: 'firium-z', place: 'a caldera of embers', captain: 'Captain Kiawe', totem: 'marowak-alola', reason: 'It is big because it dances the fire dance for its mother, every night, the way she taught it. The flames have only got bigger.', thanks: 'charcoal' },
  { type: 'water', crystal: 'waterium-z', place: 'a lagoon of clear tide', captain: 'Captain Lana', totem: 'araquanid', reason: 'It is big because the lagoon is its bubble. Every fish here lives inside it. It will not let anything pop it.', thanks: 'mystic-water' },
  { type: 'grass', crystal: 'grassium-z', place: 'a jungle clearing', captain: 'Captain Mallow', totem: 'lurantis', reason: 'It is big because it is pretending to be a flower so the hungry ones eat it instead of the real flowers. It has been pretending a long time.', thanks: 'miracle-seed' },
  { type: 'electric', crystal: 'electrium-z', place: 'a power plant humming with sparks', captain: 'Captain Calder', totem: 'togedemaru', reason: 'It is big because it has been soaking up the plant\'s spare current to keep the lights on in the village below. Nobody asked it to.', thanks: 'magnet' },
  { type: 'psychic', crystal: 'psychium-z', place: 'a moonlit observatory', captain: 'Captain Lune', totem: 'gothitelle', reason: 'It is big because it reads the stars for the old astronomer who can\'t see them any more, and the stars are a heavy thing to carry.', thanks: 'twistedspoon' },
  { type: 'ice', crystal: 'icium-z', place: 'a glacier cave', captain: 'Captain Frost', totem: 'crabominable', reason: 'It is big because it climbed the mountain to punch the snow, and the snow did not stop, so it did not stop either.', thanks: 'nevermeltice' },
  { type: 'dragon', crystal: 'dragonium-z', place: 'a ridge where wings once nested', captain: 'Captain Drake', totem: 'kommo-o', reason: 'It is big because it is the last of the ridge. It rings its scales every evening and waits for an answer.', thanks: 'dragon-fang' },
  { type: 'dark', crystal: 'darkinium-z', place: 'a ruin that never sees the sun', captain: 'Captain Nyx', totem: 'mightyena', reason: 'It is big because it is the pack. All of them. It ate their share of the dark when the others left.', thanks: 'blackglasses' },
  { type: 'fairy', crystal: 'fairium-z', place: 'a meadow of soft light', captain: 'Captain Sola', totem: 'ribombee', reason: 'It is big because it makes pollen puffs for every child who comes to the meadow, and more children come every year.', thanks: 'fairy-feather' },
];

const totemFight = (t: Trial, calm: boolean): Json =>
  alpha({
    species: t.totem,
    lv: 2,
    ...(calm ? { need: 5, likes: ['sound', 'scent'] as ('sound' | 'scent')[], calm: [item(t.crystal), item(t.thanks), flag('trials-passed'), flag('trials-calmed'), flag(`trial-${t.type}`)] } : {}),
    win: [item(t.crystal), flag('trials-passed'), flag(`trial-${t.type}`), rp(6)],
  });
const trial = (t: Trial): Json =>
  ev(`island-trial-${t.type}`, `Island Trial: ${cap(t.type)}`, T, {
    rarity: 'rare', minStage: 1, requires: [], types: [t.type], tint: '#2a3a4a',
    remembers: [
      { id: 'first', when: [flagIs('trials-met', 0, 0)], intro: `A hollow tree on a beach. ${t.captain} leans against it. You look down: there is a Z-Ring on your wrist. There was not a moment ago.\n\n${t.captain}: "You carry a Z-Ring. So you're doing the Trials."\n${t.captain}: "Three this run. Pass all three and the Kahuna will see you."\n${t.captain}: "Each of our Totems has a reason it's big. Find out why, and you'll know how to win."` },
      ...(t.type === 'bug' ? [{ id: 'alphas-know', when: [flagIs('calmed-alpha', 3)], notice: 'The Swarm Totem lifts its head and smells the Alphas on you. It lowers its jaws and lets you in.', addChoices: [ch('Walk into the hive.', out('It does not fight. It shows you the robbed hive, and the empty cells, and then it gives you the crystal it was guarding.', item(t.crystal), item(t.thanks), flag('trials-passed'), flag('trials-calmed'), flag(`trial-${t.type}`), flag('trials-met')))] }] : []),
    ],
  },
    `${t.captain} waits at ${t.place}.\n\n${t.captain}: "Here's the puzzle. Then the Totem. You can quit anytime. No shame."`,
    [
      ch('Start the Trial.', fight(`The puzzle is short and strange, and at the end of it the Totem ${cap(t.totem.replace('-alola', ''))} rises, huge and glowing.`, totemFight(t, false), item('z-ring'), flag('trials-met'), flag(`trial-${t.type}-started`))),
      ch('Ask about the Totem.', out(`${t.captain}: "${t.reason}"\n\nKnowing it, you might not have to fight it at all.`, item('z-ring'), flag('trials-met'), flag(`trial-${t.type}-asked`), room(`co-z1-calm-${t.type}`))),
      ch('Come back later.', leave(`${t.captain}: "It'll be here till the region ends."`)),
    ]);
const calmRoom = (t: Trial): Json =>
  ev(`co-z1-calm-${t.type}`, `Island Trial: ${cap(t.type)}: The Totem`, T, { ...R, tint: '#3a4a5a' },
    `You know why it is big now. The Totem watches you come, and does not move first.`,
    [
      ch('Calm it.', fight('You go slowly. Soothing sounds, sweet scents, a balm if you have one. The Captain holds their breath.', totemFight(t, true))),
      ch('Fight it anyway.', fight('It rises, huge and glowing.', totemFight(t, false))),
    ]);
// The Grand Trial's crystal is the starter's type. A choice holds at most 8 branches, so the rarer starter types fall through to a second look.
const CRYSTAL_ORDER = ['grass', 'fire', 'water', 'electric', 'normal', 'psychic', 'fighting', 'dragon', 'bug', 'flying', 'poison', 'ground', 'rock', 'ghost', 'steel', 'ice', 'dark', 'fairy'];
function crystalRooms(): Json[] {
  const done = [flag('grand-trial'), moment('You passed the Grand Trial of the Island Chain.', 85)];
  const groups = [CRYSTAL_ORDER.slice(0, 8), CRYSTAL_ORDER.slice(8, 16), CRYSTAL_ORDER.slice(16)];
  const id = (n: number) => (n === 0 ? 'co-z1-crystal' : `co-z1-crystal-${n + 1}`);
  return groups.map((types, n) =>
    ev(id(n), 'The Grand Trial: The Crystal', T, { ...R, tint: '#7a6a4a' },
      n === 0 ? 'Olivia, brushing dust off her sleeve: "That\'s the Grand Trial. You did it properly."\nShe holds out a crystal the colour of your oldest friend.' : 'She turns the crystal in the light until it settles on your oldest friend\'s colour.',
      [ch('Take it.', out(n < groups.length - 1 ? 'It flickers between colours.' : 'A plain Z-Crystal, warm from her hand.', ...(n < groups.length - 1 ? [room(id(n + 1))] : [item('normalium-z'), ...done])), {
        branches: types.map((t) => ({ when: [starterType(t)], text: `A ${cap(t)} Z-Crystal, for your oldest friend.`, effects: [item(TRIALS.find((x) => x.type === t)!.crystal), ...done] })),
      })]));
}
const z1: Json[] = [
  ...TRIALS.map(trial),
  ...TRIALS.map(calmRoom),
  ev('co-z1-grand', 'The Grand Trial', T, {
    callback: true, rarity: 'rare', requires: [flagIs('trials-passed', 3), flagIs('grand-trial', 0, 0)], cast: [], tint: '#5a4a3a',
    remembers: [{ id: 'all-calmed', when: [flagIs('trials-calmed', 3)], intro: 'Kahuna Olivia, on the steps of the shrine, arms folded: "Three. All three calmed. You already passed."\nShe holds out a crystal the colour of your oldest friend.', hide: [0], addChoices: [ch('Take the crystal.', out('She does not battle. She only nods, once, the way Captains bow.', room('co-z1-crystal')))] }],
  },
    'Kahuna Olivia, on the steps of the shrine: "Three. Good. Now me."',
    [
      ch('Face the Kahuna.', fight('Olivia: "Don\'t hold back. I won\'t."', trainer('Kahuna Olivia', { size: 4, types: ['rock'], lv: 3, win: [room('co-z1-crystal')] }))),
      ch('Not yet.', leave('Olivia: "I\'ll be here."')),
    ]),
  ...crystalRooms(),
];

// ---------------------------------------------------------------- Z2. The Sigils
const SIGIL_FORMS = ['onix-z', 'tangela-z', 'voltorb-z', 'diglett-z', 'piplup-z', 'noctowl-z', 'sudowoodo-z', 'skarmory-z', 'linoone-z', 'granbull-z'];
const z2: Json[] = [
  ev('z-sigil-ruin', 'A Sigil in the Stone', G, { rarity: 'rare', minStage: 1, requires: [], cast: ['trainer.psychic_m'], tint: '#4a3a6a', effect: 'glint',
    remembers: [{ id: 'rubbing', when: [flagIs('oriel-told'), flagIs('sigil-pairs', 2), flagIs('sigil-rubbing', 0, 0)], notice: 'Oriel is here again. She hands you a sheet of paper: a sigil rubbing, both halves. "One free pair. I traced it in the first ruin. Don\'t tell anyone."', addChoices: [ch('Take the rubbing.', out('A pair of sigils on paper, still faintly warm. Kept for when you need them.', flag('sigil-rubbing'), flag('sigils-held'), moment('Oriel gave you a sigil rubbing.', 70)))] }],
  },
    'A ruined wall. A carved sigil glows. It matches nothing in the guidebook.\n\nScholar Oriel, copying it: "There\'s another one. There\'s always another one. They come in pairs."\nOriel: "One\'s here. The other is somewhere water\'s touched it."\nOriel: "When both are lit, something steps out. It\'s not a Mega. It\'s older."',
    [
      ch('Find the other sigil.', out('You copy the sigil into your journal. The next stage, you will look for water.', flag('sigil-lit'))),
      ch('"Tell me more."', out('Oriel: "A Z-form is a Pokémon with its second shape showing. You can earn one, or you can make one of yours." She writes her name in your journal, next to the sigil.', flag('sigil-lit'), flag('oriel-told'))),
      ch('Leave it.', leave('The sigil stays lit behind you, for as long as you are in this region.')),
    ]),
  ev('z-sigil-pool', 'The Sigil Pool', G, { callback: true, rarity: 'rare', minStage: 1, requires: [flagIs('sigil-lit')], cast: [], tint: '#3a5a7a', effect: 'rain' },
    'The water in a rock pool is humming. A second sigil lies on the bottom. When you lean over it, the first one, a whole stage behind you, answers.',
    [
      ch('Reach in and light it.', out('Both sigils burn together. Something in the glow takes a shape.', flag('sigil-lit', -1), flag('sigil-pairs'), room('z-form-trial'))),
      ch('Leave it.', leave('The humming follows you a little way, then stops.')),
    ]),
  ev('z-form-trial', 'The Z-Form Trial', G, { ...R, minStage: 1, requires: [], tint: '#6a4a8a', effect: 'sparkle' },
    'Both sigils burn together. A Z-form steps out of the glow to test you: a Pokémon you know, with its second shape showing.',
    [
      ch('Accept the test.', fight('It is not angry. It wants to see what you are.', { ...wild({ species: SIGIL_FORMS, lv: 2, win: [flag('sigil-passed'), room('co-z2-after')] }), pseudo: true, lose: [] })),
      ch('Bow and step back.', leave('It looks at you a while, then fades back into the stone.')),
    ]),
  ev('co-z2-after', 'The Sigils: After', G, { ...R, tint: '#6a4a8a' },
    'The test is over. The glow is going out of the sigils. Whatever you did not catch is already walking back into the stone.',
    [
      ch('Keep the sigils.', out('You trace both halves into your journal before the glow goes. A pair, kept. Something that is yours can be re-shaped with them, one day.', flag('sigils-held'))),
      ch('Let them fade.', out('They fade. The wall is just a wall.', rp(15))),
    ]),
];

// ---------------------------------------------------------------- Z3. The Cold Ghost (Z-Gastly)
const withSigils = (text: string, ...effects: Json[]): Json[] => [{ when: [flagIs('sigils-held')], text, effects: [...effects, flag('sigils-held', -1), item('gengarite-z')] }];
const z3: Json[] = [
  ev('co-z3-cave', 'The Cold Ghost', G, {
    rarity: 'rare', cast: ['trainer.hiker'], pokemon: 'gastly-z', tint: '#a0c0e0', effect: 'snow',
    remembers: [{ id: 'starter-fire', when: [{ kind: 'starter', type: 'fire' }], notice: 'Your starter\'s flame leans toward it, the way you lean toward a friend across a room.', hide: [1], addChoices: [ch('Introduce it to your starter.', out('They sit together. Your starter\'s flame does not melt it; it only warms it a little. They become friends at once, and it comes with you, already changing.', flag('coldghost-friend'), gift('haunter-z'), fr(2, 'starter')), { branches: withSigils('They sit together. They become friends at once. When it sees your sigils it reaches for them, and the frost on it turns to something brighter.', flag('coldghost-friend'), gift('haunter-z'), fr(2, 'starter')) })] }],
  },
    'The deepest, coldest cave. Frost on the walls makes a face, and the face moves. It is a Gastly made of frost, not gas.\n\nIt drifts close. Your breath freezes. It touches your sleeve. The sleeve frosts. It pulls back, sad.\nMiner, at the cave mouth, later: "That\'s the one froze in the collapse. Came back. Brought the cold with it."\nMiner: "It wants to be warm. It can\'t be."',
    [
      ch('Take it to the hot spring.', out('Two nodes to the spring. It sits in the steam and does not melt. It is a little less sad. It stays with you.', takeNode(2), flag('coldghost-spring'), gift('gastly-z'))),
      ch('Introduce it to a Fire-type.', out('The two sit together, a little apart, then closer. They become friends.', flag('coldghost-friend'), gift('gastly-z')), { requires: [ptype('fire')], branches: withSigils('The two sit together. They become friends. It sees your sigils and drifts to them on its own, and you keep the stone that comes out of the frost.', flag('coldghost-friend'), gift('gastly-z')) }),
      ch('Let it stay in the cold.', out('It is happiest here. It stays. Before you go it leaves something on your bag: a shard of ice that does not melt.', flag('coldghost-stayed'), item('nevermeltice'))),
    ]),
];

// ---------------------------------------------------------------- Z4. The Spoon That Bent the Wrong Way (Z-Abra)
const spoonSigils = (text: string, ...effects: Json[]): Json[] => [{ when: [flagIs('sigils-held')], text, effects: [...effects, flag('sigils-held', -1), item('alakazite-z')] }];
const z4: Json[] = [
  ev('co-z4-night-1', 'The Spoon That Bent the Wrong Way', G, { rarity: 'rare', requires: [ptype('psychic'), when('night')], pokemon: 'abra-z', tint: '#504070' },
    'Night at camp. A pop of air. An Abra, transparent at the edges, picks up your spoon. It vanishes.',
    [ch('Go back to sleep.', out('You wake with one spoon fewer.', flag('spoon-night')))]),
  ev('co-z4-night-2', 'The Spoon That Bent the Wrong Way: Second Night', G, { callback: true, rarity: 'rare', requires: [flagIs('spoon-night', 1, 1)], pokemon: 'abra-z', tint: '#504070' },
    'Second night: the same pop of air, the same transparent Abra, the same spoon.',
    [ch('Stay awake next time.', out('You put your last spoon out, on purpose.', flag('spoon-night')))]),
  ev('co-z4-night-3', 'The Spoon That Bent the Wrong Way: Third Night', G, { callback: true, rarity: 'rare', requires: [flagIs('spoon-night', 2, 2)], pokemon: 'abra-z', tint: '#403060' },
    'Third night: you are awake. It stares back at you, holding the spoon. Your Psychic-type sits up, looks at it, and nods toward the trees.',
    [
      ch('Follow it.', out('Into the woods, a long way, the Abra blinking in and out ahead of you.', flag('spoon-night'), flag('spoon-followed'), room('co-z4-grave'))),
      ch('Grab the spoon.', out('It fades a little, holding on, and lets go. It does not come back.', flag('spoon-night'), flag('spoon-grabbed'))),
      ch('Leave it the spoon.', out('It takes it. The next night it brings one back, bent. And the night after. Three bent spoons, lined up by your bag. The fourth night, it waits for you at the trees.', flag('spoon-night'), flag('spoon-left'), room('co-z4-grave'))),
    ]),
  ev('co-z4-grave', 'The Spoon That Bent the Wrong Way: The Grave', G, {
    ...R, pokemon: 'abra-z', tint: '#605080',
    remembers: [{ id: 'bent-three', when: [flagIs('spoon-left')], notice: 'You still have the three bent spoons it brought you.', addChoices: [ch('Lay the three bent spoons on the pile.', out('You lay them down with the others. It looks at them, and at you, and then it laughs, for the first time. It evolves, and it takes one spoon, straight now, to carry forever.', flag('spoon-straight'), gift('kadabra-z'), item('straight-spoon')), { branches: spoonSigils('You lay them down. It laughs, and evolves, and takes the straight spoon. When it sees your sigils, it holds them too, and something older in it wakes.', flag('spoon-straight'), gift('kadabra-z'), item('straight-spoon')) })] }],
  },
    'A grave in the woods, with a pile of bent spoons on it, and a magician\'s hat rotted flat.\nA wooden marker: "THE GREAT PELLO. HE BENT THEM BACK."\nThe Abra lays the spoon on the pile and looks at you.',
    [
      ch('Leave the spoons.', out('You leave them. It looks at the pile a long time. Then it evolves, and comes with you.', flag('spoon-kept'), gift('kadabra-z')), { branches: spoonSigils('You leave them. It evolves, and comes with you. When it sees your sigils, it holds them, and something older in it wakes.', flag('spoon-kept'), gift('kadabra-z')) }),
      ch('Take them back.', out('You gather the spoons. It fades, for good. The hat is just a hat.', flag('spoon-taken'))),
      ch('Bend one straight.', out('Your Psychic-type takes a spoon and bends it straight. The Abra laughs, for the first time. It evolves, and it carries the straight spoon forever.', flag('spoon-straight'), gift('kadabra-z'), item('straight-spoon')), { requires: [ptype('psychic')], branches: spoonSigils('It laughs, for the first time, and evolves, and takes the straight spoon. When it sees your sigils, it holds them too.', flag('spoon-straight'), gift('kadabra-z'), item('straight-spoon')) }),
    ]),
];

// ---------------------------------------------------------------- Z6. The Snorlax That Learned to Fight (Doran)
const spar = (n: number, lv: number, win: Json[]): Json =>
  trainer('Doran\'s Snorlax', { team: ['snorlax'], size: 1, lv, friendly: true, win, lose: n === 3 ? [room('co-z6-after')] : [flag('snorlax-spar')], sprite: 'black_belt_m' });
const z6: Json[] = [
  ev('co-z6-dojo', 'The Snorlax That Learned to Fight', G, { rarity: 'rare', cast: ['trainer.black_belt_m'], pokemon: 'snorlax', tint: '#806040' },
    'A dojo in the hills. A Snorlax, awake, doing push-ups. The floor shakes with each one.\n\nBlack Belt Doran, sitting by the wall: "Don\'t look at me. I told it it couldn\'t."\nDoran: "I said, a Snorlax will never be a fighter. That was a year ago. It hasn\'t slept since."\nThe Snorlax stops. It looks at you and points at the mat.',
    [
      ch('Spar with it.', fight('It is slow, and it is strong, and it is trying so hard.', spar(1, 0, [flag('snorlax-spar')]), flag('snorlax-sparred'))),
      ch('Tell Doran to apologise.', fight('Doran: "It doesn\'t want sorry. It wants to win." He waves at the mat. "Go on, then."', spar(1, 0, [flag('snorlax-spar')]), flag('snorlax-sparred'))),
      ch('Leave.', out('It keeps training. You hear the floor shake all the way down the hill.', stamped('snorlax-left'))),
    ]),
  ev('co-z6-spar-2', 'The Snorlax That Learned to Fight: Second Spar', G, { callback: true, rarity: 'rare', requires: [flagIs('snorlax-spar', 1, 1)], cast: ['trainer.black_belt_m'], pokemon: 'snorlax', tint: '#806040' },
    'Doran\'s Snorlax has walked all the way down to the road to find you. It points at the grass. Here will do.',
    [ch('Spar again.', fight('It is faster than last time.', spar(2, 2, [flag('snorlax-spar')])))]),
  ev('co-z6-spar-3', 'The Snorlax That Learned to Fight: Third Spar', G, { callback: true, rarity: 'rare', requires: [flagIs('snorlax-spar', 2)], cast: ['trainer.black_belt_m'], pokemon: 'snorlax', tint: '#a06040' },
    'The third time. Doran has come too. He sits on a rock and does not say anything. The Snorlax bows to you, properly, the way he must have taught it.',
    [ch('Bow back and begin.', fight('It does not hold back.', spar(3, 5, [flag('snorlax-beat-it'), room('co-z6-after')])))]),
  ev('co-z6-after', 'The Snorlax That Learned to Fight: After', G, { ...R, cast: ['trainer.black_belt_m'], pokemon: 'snorlax', tint: '#c08050' },
    'The Snorlax stands over your Pokémon, panting. It looks at Doran.',
    [
      ch('"Doran, say something."', out('Doran, very quietly: "...You can." It lies down where it stands and sleeps, for the first time in a year. Doran gives you a Munchlax from the dojo\'s litter. "It\'ll want to fight. Let it."', gift('munchlax'), flag('doran-friend'), moment('Black Belt Doran told his Snorlax it could. It slept for the first time in a year.', 85))),
      ch('Give it the sigils.', out('The sigils light in your hands. It becomes something new in Doran\'s arms, and he cries. When it is done he gives you a Munchlax from the litter, and the stone it left behind.', flag('sigils-held', -1), gift('munchlax'), item('snorlaxite-z'), flag('doran-friend'), moment('Doran\'s Snorlax took its second shape in his arms.', 90)), { requires: [flagIs('sigils-held')] }),
    ]),
  ev('co-z6-alpha', 'The Snorlax That Learned to Fight: Still Training', G, { callback: true, rarity: 'rare', requires: [{ kind: 'flag', key: 'snorlax-left', atLeast: 1, atMost: 99, regionsAgo: 1 }], pokemon: 'snorlax', tint: '#604020' },
    'A region on, a huge Snorlax in the road, doing push-ups. It is an Alpha now. It is very, very tired. It points at the grass.',
    [
      ch('Spar with it.', fight('It fights like it has not slept in a year, because it hasn\'t.', alpha({ species: 'snorlax', need: 3, likes: ['sound'], calm: [flag('snorlax-calmed'), heal(0.5)], win: [flag('snorlax-beat-it')] }))),
      ch('Leave it.', leave('You step round it. It does not stop.')),
    ]),
];

// ---------------------------------------------------------------- Z7. The Alpha of Alphas (Alphayena)
const roundPass = (key: string): Json[] => [flag('alphayena-round'), flag(`alphayena-${key}`)];
const z7: Json[] = [
  ev('co-z7-hill', 'The Alpha of Alphas', G, {
    rarity: 'rare', requires: [flagIs('calmed-alpha', 3), when('night')], pokemon: 'alphayena', tint: '#303040',
    remembers: [
      { id: 'bow', when: [flagIs('calmed-alpha', 6)], notice: 'It looks at you a long time. Then it lowers its head, as if it had already decided.', addChoices: [ch('Accept the bow.', out('It bows. Every Alpha you calmed howls once more, far away. It does not leave you a pup, this time.', flag('alphayena-bowed')))] },
      { id: 'fed', when: [flagIs('fed-poochyena')], notice: 'It sniffs the air. It knows you fed one of its own once. The test will start at the second round.' },
    ],
  },
    'Night. From every direction, every Alpha you calmed this run howls once, at the same time.\nOn the hill ahead, a huge hyena shape, black and grey, with a mane like a storm.\n\nIne, if you met her, at your side: "That\'s the one they answer to."\nIne: "It\'s noticed you calming them. It wants to know if you meant it."',
    [
      ch('Accept its test.', out('It turns and lopes into the dark. The first round is the hunt.', flag('alphayena-test'), room('co-z7-hunt')), { branches: [{ when: [flagIs('fed-poochyena')], text: 'It knows you. It skips the hunt. The second round is the hold.', effects: [flag('alphayena-test'), ...roundPass('hunt'), room('co-z7-hold')] }] }),
      ch('Back away.', out('It watches you go. Then it leaves too.', flag('alphayena-left'))),
      ch('Throw it a balm.', out('It eats it, and watches you. Then the test.', lose('calming-balm'), flag('alphayena-test'), room('co-z7-hunt')), { requires: [has('calming-balm')] }),
    ]),
  ev('co-z7-hunt', 'The Alpha of Alphas: The Hunt', G, { ...R, pokemon: 'alphayena', tint: '#303040' },
    'A wild Pokémon bolts out of the long grass. The Alphayena looks at you: catch it, without harming it.',
    [ch('Give chase, gently.', fight('Soothing sounds, a sweet scent, a balm: anything but a blow.', { ...wild({ species: ['furret'], win: [room('co-z7-hold')] }), pseudo: true, rule: { calm: { need: 3, start: 0, perTurn: 0, likes: ['sound', 'scent'] } }, calm: [...roundPass('hunt'), room('co-z7-hold')], lose: [room('co-z7-hold')] }))]),
  ev('co-z7-hold', 'The Alpha of Alphas: The Hold', G, {
    ...R, pokemon: 'alphayena', tint: '#303040',
    remembers: [{ id: 'angry', when: [flagIs('noble-beaten')], notice: 'It knows you beat a Noble down instead of calming it. It is angry. Seven turns, not five.', hide: [0], addChoices: [ch('Hold for seven turns.', fight('It comes at you, and it does not stop.', alpha({ species: 'alphayena', rule: { surviveTurns: 7 }, win: [...roundPass('hold'), room('co-z7-howl')], lose: [room('co-z7-howl')] })))] }],
  },
    'The Alphayena itself steps forward. Survive five turns against it.',
    [ch('Hold for five turns.', fight('It comes at you, and it does not stop.', alpha({ species: 'alphayena', rule: { surviveTurns: 5 }, win: [...roundPass('hold'), room('co-z7-howl')], lose: [room('co-z7-howl')] })))]),
  ev('co-z7-howl', 'The Alpha of Alphas: The Howl', G, { ...R, pokemon: 'alphayena', tint: '#404060' },
    'The last round. It lifts its head and howls, and waits for your team to answer.',
    [
      ch('Howl together.', out('Every one of your Pokémon that knows a sound move lifts its head and answers, together.', ...roundPass('howl'), room('co-z7-end')), { requires: [moveFlag('sound')] }),
      ch('Stay silent.', out('Your team is quiet. It waits, then lowers its head.', room('co-z7-end'))),
    ]),
  ev('co-z7-end', 'The Alpha of Alphas: The Verdict', G, { ...R, pokemon: 'alphayena', tint: '#404060' },
    'The Alphayena stands over you on the hill. The Alphas have gone quiet.',
    [
      ch('Wait for its answer.', out('It marks you, one long look, as prey. Then it is gone.', flag('alphayena-prey')), {
        branches: [
          { when: [flagIs('alphayena-round', 3)], text: 'It bows. A Poochyena pup trots out of the dark and sits at your feet. It is yours, from its own pack.', effects: [flag('alphayena-bowed'), gift('poochyena', { ability: 'pack-call' }), moment('The Alpha of Alphas bowed to you and gave you a pup from its pack.', 90)] },
          { when: [flagIs('alphayena-round', 2)], text: 'It looks at you a long time, then leaves, respectful.', effects: [flag('alphayena-respect')] },
        ],
      }),
    ]),
];

export const EVENTS: Json[] = [...z1, ...z2, ...z3, ...z4, ...z6, ...z7];
export const REMOVE: string[] = [];
