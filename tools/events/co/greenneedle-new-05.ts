// Greenneedle gn.new.05: The Egg That Listened (doc GREENNEEDLE_PLACED_1.md lines 196-227; the hatch is SF122 in STORY_FAMILIES_17.md).
// Build: npm run co:build -- greenneedle-new-05   then   npm run co:gn
// A day-care worker gives you an egg at Stage 1. At each rest one word appears over it, drawn from the stage just played (again, careful,
// loud, soft, far, quick). At Stage 8, Step 19 it hatches: its nature comes from the words, it knows the move you used most that region
// (core/greenneedle/listened.ts), and its Bond starts at Friendly. Sets flag `egg-listened-hatched` (gn.40's day-care village reads it).
import { ch, egg, out, type Json } from '../dsl.ts';
import { bond, gev, gn, is, notThisRegion, notThisStage, rm, say, setTo, stampRegion, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#d8c7a0';
const dc = (o: Json = {}): Json => ({ tint: TINT, tags: ['Story', 'Recovery'], effect: 'none', ...o });

const WORDS = ['again', 'careful', 'loud', 'soft', 'far', 'quick'] as const;

/** What the player sees when the word appears. */
const WORD: Record<(typeof WORDS)[number], { text: string; keep: string }> = {
  again: {
    text: say(
      'The egg is warm, and over it, in thin pale letters like breath on glass, one word: *again.*',
      'You used one move over and over this stage. It heard every one. It ticks, in a rhythm you recognise: yours.',
    ),
    keep: 'You say the name of the move out loud. The egg ticks along with it, a half-beat behind.',
  },
  careful: {
    text: say(
      'The egg is warm, and over it, in thin pale letters, one word: *careful.*',
      'You pulled your hurt Pokémon out of harm\'s way this stage, again and again. The egg heard the swaps, and it learned what they meant.',
    ),
    keep: 'You tuck it deeper into the bag. It settles, slow and satisfied, like something that has learned it will be protected.',
  },
  loud: {
    text: say(
      'The egg is warm, and over it, in thin pale letters, one word: *loud.*',
      'You kept your hurt Pokémon in the fight this stage, and the fight was loud. The egg heard every bit of it, and it did not flinch.',
    ),
    keep: 'You shout something silly, to even it out. The egg gives a short, bright knock. It thinks that was great.',
  },
  soft: {
    text: say(
      'The egg is warm, and over it, in thin pale letters, one word: *soft.*',
      'You chose kindly this stage, in every conversation, even when it cost you something. The egg heard that too.',
    ),
    keep: 'You talk to it in the quiet voice you use for strangers who turn out to be friends. The shell seems a little warmer.',
  },
  far: {
    text: say(
      'The egg is warm, and over it, in thin pale letters, one word: *far.*',
      'You walked past people this stage: waves from the side of the road, doors left shut. The egg heard your footsteps and nothing else.',
    ),
    keep: 'You stop, just for a moment, and tell it where you are going and why. It ticks twice, as if it was keeping count.',
  },
  quick: {
    text: say(
      'The egg is warm, and over it, in thin pale letters, one word: *quick.*',
      'You won fast this stage, and the fights were over before they began. The egg barely had time to hear them.',
    ),
    keep: 'You tell it about the last fight, the whole thing, quickly. It ticks fast the entire time, trying to keep up.',
  },
};

// ----- the gift (Stage 1, Step 5, at a day-care; fallback Step 15) -----
const gift: Json[] = [
  gev('gn-new-05-daycare', 'The Egg That Listened', dc({ stop: 'event', rarity: 'rare', forced: true, requires: [notThisRegion('egg-listen-at')] }), say(
    '*A day-care yard in the early light. Small Pokémon dozing in the grass, a bucket of berries by the gate, and a worker with flour on her sleeves.*',
    'She walks straight up to you and presses an egg into your hands. It is warm. It is heavier than it looks.',
    '**Day-care worker, Mrs. Holloway:** "Nobody\'s claimed it. Talk to it. They hear more than you\'d think."',
  ), [
    ch('Talk to it.', out('You feel a little foolish. You say hello anyway, to a shell. Something inside goes still, the way a person does when they are listening.', egg({ left: 9, unit: 'stage' }), gn('eggTake'), setTo('egg-carry', 1), stampRegion('egg-listen-at'), bond(1))),
    ch('Hold it, quietly.', out('You say nothing. You just hold it against your chest. Mrs. Holloway nods, as if that were also an answer, and goes back to her berries.', egg({ left: 9, unit: 'stage' }), gn('eggTake'), setTo('egg-carry', 1), stampRegion('egg-listen-at'))),
  ]),
];

// ----- the rests: one word each stage -----
const rest: Json[] = [
  gev('gn-new-05-rest', 'The Egg Listens', dc({ stop: 'event', rarity: 'common', requires: [is('egg-carry'), notThisStage('egg-rested')], tags: ['Recovery', 'Story'] }), say(
    '*A quiet moment at the rest. You take the egg out of the bag and set it in your lap. It is warm, and it is, somehow, waiting.*',
  ), [
    ch('Listen.', out('You hold very still. Something happens to the egg\'s shell, just under the surface, like writing in frost.',
      gn('eggWord'), stampStage('egg-rested'),
      ...WORDS.map((w, i) => gn('when', { key: 'egg-word', min: i, max: i, then: [gn('scene', { key: `gn-new-05-w-${w}` })] })))),
    ch('Let it sleep.', out('You leave it in the bag. It ticks softly against your side all the way along. It will have a word for you later.')),
  ]),
  ...WORDS.map((w) => rm(`gn-new-05-w-${w}`, `The Word: ${w}`, dc(), WORD[w].text, [
    ch('Say it back.', out(WORD[w].keep, bond(1))),
    ch('Just keep it company.', out('You sit with it a while, saying nothing. It seems to prefer that, too.')),
  ])),
];

// ----- the hatch (Stage 8, Step 19; SF122) -----
const hatch: Json[] = [
  gev('gn-new-05-hatch', 'The Egg Decides', dc({ stop: 'event', rarity: 'rare', forced: true, requires: [is('egg-carry')], tags: ['Story'] }), say(
    '*The egg is ticking too fast to count. A crack runs across the shell, thin as a hair, and then a second one. It has decided it is time.*',
    'Every word it heard this region is somewhere in there. It has been keeping them all.',
  ), [
    ch('Talk to it.', out(say(
      'You kneel and say its name, or what you would have called it. The shell shakes, tickles open, and a small, damp face looks up at you. It knows that voice.',
      '*It looks at the Pokémon that used that move all region. It plants its feet the same way. It falls over.*',
    ), gn('eggHatch', { n: 1 }), setTo('egg-listened-hatched', 1), bond(2))),
    ch('Stay quiet.', out(say(
      'You say nothing. You watch. The shell opens on its own, and a small, damp face looks around until it finds yours. It knows you anyway.',
      '*It looks at the Pokémon that used that move all region. It plants its feet the same way. It falls over.*',
    ), gn('eggHatch', { n: 0 }), setTo('egg-listened-hatched', 1))),
  ]),
];

export const EVENTS: Json[] = [...gift, ...rest, ...hatch];
export const REMOVE: string[] = [];

/** Placement as the doc gives it (written to src/data/catalogOverhaul/placement/greenneedle.json by tools/catalog-overhaul/gn-placement.ts). */
export const PLACEMENT: Record<string, Placement> = {
  'gn-new-05-daycare': {
    gn: 'gn.new.05', shape: 'Region-long', earliest: 'A1', home: 5, window: [4, 6], sits: 'must-see', attaches: 'town', tags: ['Region-long'], stages: [1],
    level: 'None', often: 'region',
    dressing: { kanto: 'The Egg That Listened', elsewhere: 'The Egg That Listened' },
    beats: [
      { beat: 'The gift (must-see; fallback Step 15)', event: 'gn-new-05-daycare', stage: 'S1', home: 5, window: [4, 15] },
      { beat: 'The word, at each rest', event: 'gn-new-05-rest', stage: 'S1-S7', home: 10, window: [8, 12] },
      { beat: 'The hatch', event: 'gn-new-05-hatch', stage: 'S8', home: 19, window: [17, 20] },
    ],
    note: 'Once per region. Given at Step 5 of the region\'s Stage 1 at a day-care (fallback Step 15); rocks at the heal node nearest Step 10 each stage; hatches at Stage 8, Step 19.',
  },
  'gn-new-05-rest': {
    gn: 'gn.new.05', shape: 'Single', earliest: 'A1', home: 10, window: [8, 12], sits: 'optional', attaches: 'rest', tags: ['Region-long'], stages: [1, 2, 3, 4, 5, 6, 7],
    level: 'None', often: 'region', note: 'Once per stage while the egg is carried: the heal node nearest Step 10, or Step 10 itself.',
  },
  'gn-new-05-hatch': {
    gn: 'gn.new.05', shape: 'Single', earliest: 'A1', home: 19, window: [17, 20], sits: 'must-see', attaches: 'after', tags: ['Region-long'], stages: [8],
    level: 'None', often: 'region', note: 'Stage 8, Step 19: the egg hatches (SF122).',
  },
};

export const CHAINS: Json[] = [];
