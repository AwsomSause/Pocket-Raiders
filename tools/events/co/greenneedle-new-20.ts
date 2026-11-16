// Greenneedle gn.new.20 The Drought Ranch (doc GREENNEEDLE_PLACED_2.md lines 10–42).
// Build: npm run co:build -- greenneedle-new-20   then   npm run co:gn
// Twelve Miltank, water for nine. Break the dam (a Bibarel and three Bidoof, A+0), move the colony (a node, two wild fights),
// dig a channel (two nodes, a Ground- or Water-type; Fresh Milk at every rest this region), or walk away.
import { $, anyType, ch, fight, flag, heal, takeNode, trainer, wild, out, type Json } from '../dsl.ts';
import { eitherWay, gev, gn, is, kindness, laterStage, moment, not, regionChanged, rm, say, scene, setTo, stampRegion, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const RANCH_TINT = '#8a7a4c';
const ranch = (o: Json = {}): Json => ({ tint: RANCH_TINT, tags: ['Story', 'Relationship'], effect: 'none', ...o });
const fightTags = ['Story', 'Combat'];

/** A fight that costs nothing on a loss: the rancher patches you up and you may try again. */
const lostRoom = (id: string, again: string, label: string): Json => rm(id, 'The Drought Ranch: Patched Up', ranch(), say(
  'Ysabeau walks you back to the trough, and wets a cloth, and says nothing for a while.',
  '**Ysabeau:** "Sit. Drink. The water\'s still short, and I still need an answer. But not on an empty stomach."',
), [
  ch(label, out('You stand. Your team stands with you, a little unsteadily, and you try again.', heal(1), scene(again))),
  ch('Leave it.', out('She nods, as if you\'d said something sensible. She turns back to the trough, and the nine, and the twelve.', heal(1))),
]);

// ---------- the dam ----------
const damFight = (text: string): Json => fight(text, trainer('The Bibarel Colony', {
  team: ['bibarel', 'bidoof', 'bidoof', 'bidoof'], lv: 0, friendly: true, sprite: 'hiker',
  win: [gn('setFlag', { key: 'bibarel-dam-broken', n: 1 }), setTo('ranch-broke', 1), stampStage('ranch-stage'), stampRegion('ranch-region'), scene('gn-new-20-broke')],
  lose: [scene('gn-new-20-dam-lost')],
}));

// ---------- the move ----------
const wildEscort = (text: string, next: string, lostId: string): Json => fight(text, {
  ...eitherWay(wild({ lv: 0, win: [scene(next)] })), friendly: true, lose: [scene(lostId)],
});

const EVENTS_20: Json[] = [
  gev('gn-new-20-ranch', 'The Drought Ranch', ranch({ stop: 'event', rarity: 'uncommon', requires: [not('ranch-met')] }), say(
    '*A dry ranch under a hard sky. A woman is pouring the last of a tank into a long trough. Twelve Miltank crowd the rail.*',
    'There is water for nine. The Miltank can count, or they can feel the count. They stand very still.',
    '**The rancher, Ysabeau Kerrigan:** "Spring\'s dammed, upstream. Bibarel. They\'re dry too. I\'ve been up there twice. I came back down twice."',
    '*She doesn\'t ask. She stands by the trough, with the empty tank against her hip.*',
  ), [
    ch('Break the dam.', out('She looks at you for a long moment. "It\'s not a kind answer," she says. "But it\'s a fast one." She points you upstream.', setTo('ranch-met', 1), scene('gn-new-20-dam'))),
    ch('Move the colony.', out('**Ysabeau:** "Wetter valley, two days east. They\'ll follow if the kits go first. Someone has to walk the kits."', setTo('ranch-met', 1), takeNode(1), scene('gn-new-20-move-1'))),
    ch('Dig a second channel.', out('**Ysabeau:** "Dig? Dig where? The ground\'s like iron." She watches your team, and something in her face begins to hope.', setTo('ranch-met', 1), takeNode(2), scene('gn-new-20-dug')), { requires: [anyType('ground', 'water')] }),
    ch('Walk away.', out('She nods, once. She doesn\'t argue. She turns back to the trough, and her lips move, counting, and starting to choose which three.', setTo('ranch-met', 1), flag('kind-walked-past'))),
  ]),

  // Break the dam.
  rm('gn-new-20-dam', 'The Drought Ranch: The Dam', ranch({ tags: fightTags }), say(
    'The dam is a wall of branches and mud, higher than a house, taller than any beaver has a right to build. Water hums behind it.',
    'The Bibarel stand on top. Three thin Bidoof huddle at its feet. Their ribs show. They aren\'t angry. They\'re only holding on.',
    'You can hear the water, and you can hear the Miltank, a long way below. Neither of them is wrong.',
  ), [ch('Break it.', damFight('You lift the first branch. The colony comes at you, all together, because there is nothing else left to do.'))]),
  lostRoom('gn-new-20-dam-lost', 'gn-new-20-dam', 'Go back up.'),
  rm('gn-new-20-broke', 'The Drought Ranch: The Water Comes', ranch(), say(
    'The wall gives all at once. The water comes down the hill like a held breath let out, brown and loud and wonderful.',
    'The colony scatters into the reeds. The Bibarel looks back once, at what it built. Then it\'s gone.',
    'At the bottom of the slope, a thin stream reaches the trough. The Miltank lift their heads, all twelve, together.',
  ), [
    ch('Go down to the ranch.', out('**Ysabeau:** "It\'s done. Here." *She pays you, and doesn\'t look upstream.*', $(1200), moment('Broke the Bibarel dam for a ranch of thirsty Miltank.', 55))),
  ]),

  // Move the colony.
  rm('gn-new-20-move-1', 'The Drought Ranch: The Kits', ranch(), say(
    'The kits come out of the reeds one at a time, and they are so small. A Bibarel mother watches from the dam, and doesn\'t move.',
    'She doesn\'t trust you. She is out of water, and out of choices, and she lets the kits go.',
    'They line up behind your party in a thin, careful row. The first one holds onto your lead\'s tail.',
  ), [
    ch('Walk them east.', wildEscort('Something wild stirs in the grass, ahead. You stand between it and the kits.', 'gn-new-20-move-2', 'gn-new-20-move-lost-1')),
  ]),
  lostRoom('gn-new-20-move-lost-1', 'gn-new-20-move-1', 'Walk them again.'),
  rm('gn-new-20-move-2', 'The Drought Ranch: The Second Crossing', ranch(), say(
    'The kits are tired. One of them has stopped, and is sitting in the dust, and won\'t be moved.',
    'Your lead nudges it up. It stands. It walks. It looks, very briefly, at your lead as if it were a hill worth climbing.',
    'A rustle off the road. Something else has smelled them.',
  ), [
    ch('Stand in front of them.', wildEscort('You put yourself between the road and the row of kits, and you do not give way.', 'gn-new-20-moved', 'gn-new-20-move-lost-2')),
  ]),
  lostRoom('gn-new-20-move-lost-2', 'gn-new-20-move-2', 'Walk them on.'),
  rm('gn-new-20-moved', 'The Drought Ranch: The Wetter Valley', ranch(), say(
    'The valley opens green, all at once, and the kits run. They run into the stream with their whole bodies, shrieking, and come up laughing.',
    'The mother arrives an hour later, over the hill, with the rest of the colony behind her. She stops at the water, and she breathes.',
    'Back at the ranch, Ysabeau is already standing at the dam. The water\'s begun to come on its own, gently, as the beavers leave it.',
  ), [
    ch('Go back to the ranch.', out('**Ysabeau:** "I thought someone had to lose." *She looks at the full trough. She looks at you.* "I\'m glad nobody did."', setTo('ranch-moved', 1), kindness(1), moment('Walked a Bibarel colony\'s kits to a wetter valley, and nobody lost.', 65))),
  ]),

  // Dig a channel.
  rm('gn-new-20-dug', 'The Drought Ranch: The Channel', ranch(), say(
    'The ground is like iron. You pick the place where the land slopes toward the trough. Your Ground- or Water-type steps forward, and digs.',
    'It takes two nodes of work, in the heat, with the Miltank watching. Your digger stops twice, and you stop with it.',
    'Then, on the second evening, the earth gives. A line of dark water appears, and runs, and forks.',
    'One branch curls round the ranch to the trough. The other runs on upstream, to the dam, to the Bibarel.',
  ), [
    ch('Watch the water run.', out('**Ysabeau:** "Both. You did both. I didn\'t know that was allowed." She sits down on the trough\'s edge and laughs until she\'s crying.', setTo('ranch-dug', 1), stampRegion('ranch-dug-region'), stampRegion('ranch-region'), stampStage('ranch-stage'), kindness(2), moment('Dug a second channel, so the ranch and the Bibarel both had water.', 80))),
  ]),

  // Afterstory: the road at Step 9 (three thin Bidoof, if the dam was broken).
  gev('gn-new-20-road', 'The Drought Ranch: Three on the Road', ranch({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('ranch-broke'), laterStage('ranch-stage'), not('ranch-road')] }), say(
    'Three Bidoof stand in the middle of the road. Thin. Quiet. They do not get out of the way, and they do not ask for anything.',
    'You know them. You saw them at the foot of the dam. They look at you. They look at the water in your bottle.',
  ), [
    ch('Pour some out for them.', out('They drink, all three, one after another, very politely. The thinnest one looks at you, and bows its whole body.', setTo('ranch-road', 1), kindness(1))),
    ch('Walk on.', out('You step round them. They watch you pass, not blaming. That is the worst of it.', setTo('ranch-road', 1))),
  ]),

  // Afterstory: a Bibarel building by a road in a later region.
  gev('gn-new-20-later', 'The Drought Ranch: Beside the Road', ranch({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('ranch-met'), regionChanged('ranch-region'), not('ranch-later')], remembers: [
    { id: 'broke', when: [is('ranch-broke')], notice: 'It stops and watches you go by. It does not look away. It remembers the dam.' },
    { id: 'dug', when: [is('ranch-dug')], notice: 'Somewhere behind it, a thin line of water forks round its work. It waves a paw at you, almost shyly.' },
  ] }), say(
    'A Bibarel is building something beside the road, one patient mouthful at a time. A low wall. A little pool behind it.',
    'It is not the same Bibarel. It might be. It looks up, and its eyes stay on you a little too long.',
  ), [
    ch('Watch it work.', out('It goes back to the wall. It adds one branch. Then another. It has all the time in the world, now.', setTo('ranch-later', 1))),
  ]),
];

export const EVENTS: Json[] = EVENTS_20;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-20-ranch': {
    gn: 'gn.new.20', shape: 'Single', earliest: 'A4', home: 6, window: [4, 11], sits: 'optional', attaches: 'instead', tags: ['Moral Choice'], needs: ['forest'],
    level: 'A+0 if the dam is broken (a Bibarel and three Bidoof)', often: 'run', badge: 'own',
    dressing: { kanto: 'The Drought Ranch', elsewhere: 'The Drought Ranch' },
    note: 'Badge: a water drop. Home step 6, fallback step 11. "Move the colony" spends the next node, "Dig a channel" the next two (a Ground- or Water-type needed). Dug: a Fresh Milk at every rest this region. Broken: sets bibarel-dam-broken (gn.55 reads it).',
  },
  'gn-new-20-road': { gn: 'gn.new.20', shape: 'Single', earliest: 'A4', home: 9, window: [7, 12], sits: 'optional', attaches: 'after', tags: ['Moral Choice'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: three thin Bidoof on the road a stage later, only if the dam was broken.' },
  'gn-new-20-later': { gn: 'gn.new.20', shape: 'Single', earliest: 'A5', home: 6, window: [2, 14], sits: 'optional', attaches: 'after', tags: ['Moral Choice'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: a Bibarel building by a road in a later region of the same run; broken: it stops and watches.' },
};

export const CHAINS: Json[] = [];
