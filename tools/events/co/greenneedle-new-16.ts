// Greenneedle gn.new.16  THE THING IN THE WELL  (GREENNEEDLE_PLACED_1.md lines 576-614).
// A single, step 5 must-see (fallback step 15), A2, no battles, once a run. The Feebas joins with the new ability Unlooked-For.
// Build: npm run co:build -- greenneedle-new-16
import { ch, flag, has, item, join, lose, out, room, type Json } from '../dsl.ts';
import { gev, moment, not, rm, say, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const WELL = '#5d7f78';
const well = (o: Json = {}): Json => ({ tint: WELL, tags: ['Pokémon', 'Story'], effect: 'fog', pokemon: 'feebas', ...o });
const GONE: Json = not('well-done');

/** The Feebas: it joins, and carries Unlooked-For. */
const FEEBAS = (extra: Json = {}): Json => ({ ...join({ species: ['feebas'], lv: -1 }), asIs: true, ability: 'unlooked-for', mark: 'well-feebas', ...extra });

const OPENING = say(
  'A village has stopped using its well. Nobody goes near it. The rope runs over the wheel, and the bucket comes up by itself.',
  'It is full of small pebbles, carefully stacked, each one set on the next with care.',
  '**Villager, Old Tabor:** "It\'s been doing that a month. We draw from the river now. Two miles."',
  '*The pebbles are sorted by colour.*',
);
const CHOICES = (): Json[] => [
  ch('Lower a light.', out('You tie a lantern to the bucket and let it down. Far below, two wide eyes catch the glow, and hold it. Then a splash, and the dark again. The bucket comes up empty, and wet, and very carefully set down.', room('gn-new-16-again'))),
  ch('Lower a Pokémon.', out('Your Pokémon rides the bucket down and comes back up dry, and puzzled, with a pebble balanced on its head. It does not dare move. Whatever is down there has been very gentle.', room('gn-new-16-again'))),
  ch('Lower myself.', out(say(
    'You tie off the rope, and the villagers hold their breath. Down you go, the stones sliding past, the circle of sky growing small.',
    'At the bottom there is no water. There is a Feebas, brown and ragged, pressed against the far wall, staring at the bucket. It has been waiting a month for someone to come down.',
    'It does not run. It has nowhere to run to.',
  ), flag('well-seen'), room('gn-new-16-choose'))),
  ch('Lower a gift.', out('You think about what could be given to something that stacks pebbles. A gift, and then see what comes back.', room('gn-new-16-gift'))),
];

const EVENTS: Json[] = [
  gev('gn-new-16-well', 'The Thing in the Well', well({ stop: 'event', rarity: 'rare', forced: true, minStage: 2, requires: [GONE] }), OPENING, CHOICES()),
  rm('gn-new-16-again', 'The Well, Again', well({ requires: [GONE] }), say(
    'The bucket hangs still. The rope creaks a little in the wheel, and then does not.',
    'Old Tabor watches from a safe distance, hands under his arms.',
  ), CHOICES()),

  // ---- the gifts: a Berry, a Pearl, a Heart Scale (three exchanges, each better than what went down) ----
  rm('gn-new-16-gift', 'A Gift for the Well', well({ requires: [GONE] }), say(
    'You decide to start small. Something kind, and easy to lose.',
    '*The rope waits in your hand.*',
  ), [
    ch('Lower a Berry.', out('**Old Tabor:** "A Berry. For the well. Aye, I\'ve a few." He finds one in his coat and hands it over as if giving up a friend. You lower it, and let go of the rope. When the bucket comes up, the Berry is gone. In its place, wet and shining and polished by someone with all the time in the world: a Pearl.',
      item('pearl'), flag('well-gift'), room('gn-new-16-gift2'))),
  ]),
  rm('gn-new-16-gift2', 'A Better Gift', well({ requires: [GONE] }), say(
    'It gave you more than you sent. You are not sure it knows the rate. You are not sure there is one.',
    'The bucket waits. The next gift is the Pearl.',
  ), [
    ch('Lower the Pearl.', out('The Pearl goes down in the bucket. When it comes back, the Pearl is gone, and there is a Heart Scale in its place, pink and perfect, the colour of the inside of a shell.',
      lose('pearl'), item('heart-scale'), flag('well-gift'), room('gn-new-16-gift3')), { requires: [has('pearl')] }),
  ]),
  rm('gn-new-16-gift3', 'The Last Gift', well({ requires: [GONE] }), say(
    'It keeps giving back more. Each time, the pebbles on the rim are set a little closer to the middle, as if it is learning how.',
    'One more. Down in the dark, something is holding very still.',
  ), [
    ch('Lower the Heart Scale.', out('The Heart Scale goes down. Long, long after, the bucket comes up. There is a Prism Scale in it, bright as the first light on water. Something very small, and very far down, is waiting to see what you do.',
      lose('heart-scale'), item('prism-scale'), flag('well-gift'), room('gn-new-16-choose')), { requires: [has('heart-scale')] }),
  ]),

  // ---- after well-seen or three gifts ----
  rm('gn-new-16-choose', 'What Lives in the Well', well({ requires: [GONE] }), say(
    'It is a Feebas. It has been alone down there with its stones, in the dark, in a dry well, for a month.',
    'Out in the daylight, Old Tabor and the others are waiting. Nobody has said what is down there. Nobody has asked.',
  ), [
    ch('Lift it out.', out(say(
      'You bring it up in the bucket, wet cloth over the top. It presses small and trembling against your chest. The villagers crowd round, and you open your coat a little, only a little.',
      'It hides inside, behind your arm. For the first time in a month, it is warm.',
    ), FEEBAS(), flag('well-done'), flag('well-lifted'), moment('A Feebas lived in a dry well, stacking pebbles by colour. It chose to hide in your coat.', 60))),
    ch('Tell the village.', out(say(
      'You tell them. A Feebas, in the well, stacking pebbles. Half the village goes quiet, ashamed, thinking of the buckets they cut loose. The other half simply does not believe it.',
      '**Old Tabor:** "A fish. A month of river water, for a fish."',
      'He says it twice, and the second time he does not mean it any more. The Feebas, in your arms, looks at the ground. You take it with you.',
    ), FEEBAS(), flag('well-done'), flag('well-told'), moment('You told a village there was a Feebas in their well. Half were ashamed. Half did not believe you.', 55))),
    ch('Leave it its bucket.', out(say(
      'You do not lift it out. You tie the rope off and step back. The bucket goes down, and comes up once more, slowly.',
      'There is one pebble in it. The best one. Smooth, and warm, and set in the middle like a seed. You take it, and leave the well to the thing that lives in it.',
    ), item('oval-stone'), flag('well-done'), flag('well-left'), moment('You left a Feebas its well, and it left you its best pebble.', 55))),
  ]),
];

export { EVENTS };
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-16-well': {
    gn: 'gn.new.16', shape: 'Single', earliest: 'A2', home: 5, window: [3, 8], sits: 'must-see', attaches: 'before', tags: ['Miniature Episode', 'Companion Story'], level: 'no battles', often: 'run', badge: 'none',
    note: 'Home step 5; the fallback is step 15 (the window\'s reach). Once per run: well-done. Afterstory for the Final Reunion: it reads well-done (the well is in use, a pebble on the rim).',
  },
};
export const CHAINS: Json[] = [];
