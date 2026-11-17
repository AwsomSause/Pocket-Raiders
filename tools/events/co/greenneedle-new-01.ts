// Greenneedle, gn.new.01 The Eevee Who Couldn't Choose (doc GREENNEEDLE_PLACED_1.md lines 11-74).
// Build: npm run co:build -- greenneedle-new-01   then   npm run co:gn
// Region-long, no battles of its own: a cold open (S1 step 1), seven admirer beats (one a stage) and the ending (S8 step 19).
// Every beat asks the same three-way question; the answers don't decide what the Eevee becomes. What you DID across the region does
// (core/greenneedle/eevee.ts tallies won battles and Pokémon Center heals; the gn op `eeveeEnd` picks the form).
import { ch, flag, item, join, out, type Json } from '../dsl.ts';
import { bond, gev, gn, is, moment, not, regionChanged, say, stampRegion, stampStage, laterStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#b58a5a';
const eev = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Story', 'Relationship'], pokemon: 'eevee', effect: 'none', stop: 'event', rarity: 'rare', ...o });
const AT = 'eevee-at';
const STAGE = 'eevee-stage';
const here: Json = { kind: 'gn', test: 'thisRegion', key: AT };

// ---- The cold open (S1, step 1, must-see) ----
const OPEN = gev('gn-new-01-open', "The Eevee Who Couldn't Choose", eev({ cast: ['trainer.worker_m'], requires: [not('eevee-on'), not('eevee-done')] }), say(
  'A crossroads with seven roads. An Eevee sits in the exact middle, turning in a slow circle.',
  '*It looks down each road in turn. Every road gets the same long look.*',
  '*It looks at you. Then it gets up, and follows, ten paces back.*',
  '**A carter, passing:** "That one\'s been there since spring. Can\'t make its mind up. You\'ve given it an eighth road, I suppose."',
), [
  ch('Walk on.', out('You walk on. Behind you, quick small steps keep time with yours, always ten paces back.', gn('eeveeStart'), flag('eevee-b0'), stampRegion(AT), stampStage(STAGE))),
]);

// ---- The seven admirers ----
interface Admirer { id: string; who: string; cast: string; line: string; gift: Json[]; giftText: string; stage: string; home: number; fallback: number }
const ADMIRERS: Admirer[] = [
  { id: 'fisherman', who: 'Fisherman', cast: 'trainer.fisherman', line: 'It\'d love the water. Look at it looking. Here: a Water Stone. No charge.', gift: [item('water-stone')], giftText: 'He holds out the Water Stone, wet and blue. The Eevee sniffs it, and steps back anyway. The stone goes in your bag.', stage: 'S1', home: 15, fallback: 19 },
  { id: 'magician', who: 'Street magician', cast: 'trainer.firebreather', line: 'A little fire in it! The crowds would adore it. Here, take this, with my compliments.', gift: [item('fire-stone')], giftText: 'She opens her hand, and a Fire Stone sits in it as if it had always been there. The Eevee sniffs it, and steps back anyway. The stone goes in your bag.', stage: 'S2', home: 5, fallback: 10 },
  { id: 'electrician', who: 'Electrician', cast: 'trainer.worker_m', line: 'Quick thing like that? It wants to be quicker. Take a Thunder Stone. I\'ve got spares.', gift: [item('thunder-stone')], giftText: 'He taps the Thunder Stone against his glove, and it crackles. The Eevee sniffs it, and steps back anyway. The stone goes in your bag.', stage: 'S3', home: 5, fallback: 10 },
  { id: 'nurse', who: 'Night-shift nurse', cast: 'trainer.fairy_tale_girl', line: 'It sits with my patients after dark. It\'s a night creature. I can tell. Please, take this.', gift: [bond(1)], giftText: 'She ties a ribbon that holds the moonlight round your wrist. The Eevee sniffs it, and steps back anyway. The ribbon stays; it makes you feel a little closer to your team (Bond +1).', stage: 'S4', home: 15, fallback: 19 },
  { id: 'gardener', who: 'Gardener', cast: 'trainer.aroma_lady', line: 'It sleeps in my beds. It\'s half plant already. A Leaf Stone would do it no harm at all.', gift: [item('leaf-stone')], giftText: 'She presses the Leaf Stone into your palm, still smelling of soil. The Eevee sniffs it, and steps back anyway. The stone goes in your bag.', stage: 'S5', home: 5, fallback: 10 },
  { id: 'guide', who: 'Mountain guide', cast: 'trainer.hiker', line: 'It doesn\'t feel the cold. Have you noticed? Here: an Ice Stone. Cold as the pass, and no use to me.', gift: [item('ice-stone')], giftText: 'He hands over the Ice Stone with a gloved hand, and frost clings to it. The Eevee sniffs it, and steps back anyway. The stone goes in your bag.', stage: 'S6', home: 15, fallback: 19 },
  { id: 'ribbon', who: 'Ribbon-maker', cast: 'trainer.lady', line: 'I don\'t want to change it. I just made it this.', gift: [bond(1)], giftText: 'She holds out a ribbon she made herself, no stone, no promise. The Eevee sniffs it, and steps back anyway. You take the ribbon (Bond +1).', stage: 'S7', home: 5, fallback: 10 },
];
const stageNo = (s: string): number => Number(s.slice(1));

const SCENE_LEAD = [
  'The Eevee is ten paces back, as always. You can hear it padding along after you, and every time you look round it stops and looks away.',
  'Then someone steps out of the roadside, and stops dead, and looks at it for a long moment.',
];
const beat = (n: number, a: Admirer): Json => gev(`gn-new-01-b${n}`, `The Eevee Who Couldn't Choose: ${a.who}`, eev({
  cast: [a.cast],
  requires: [is('eevee-on'), not(`eevee-b${n}`), here, ...(n >= 2 ? [laterStage(STAGE)] : [])],
}), say(...SCENE_LEAD, `**${a.who}:** "${a.line}"`, '*The Eevee looks at you. It always looks at you.*'), [
  ch('Nod.', out(a.giftText, ...a.gift, flag('eevee-nod'), flag(`eevee-b${n}`), stampStage(STAGE))),
  ch('Shake my head.', out(`The ${a.who.toLowerCase()} nods, a little hurt, and steps back to let you pass. The Eevee follows you, ten paces back.`, flag(`eevee-refused-${a.id}`), flag(`eevee-b${n}`), stampStage(STAGE))),
  ch('Shrug.', out('The Eevee shrugs too, in its way: one small shoulder, a flick of the ears. Then it pads on after you.', flag('eevee-shrug'), flag(`eevee-b${n}`), stampStage(STAGE))),
]);

// ---- The ending (S8, step 19) ----
const FORM_LINES: [string, string][] = [
  ['umbreon', 'Moon-rings bloom across it like frost on a window. Its eyes go red and steady. It is **Umbreon**, a night creature after all.'],
  ['espeon', 'Its fur lightens to the colour of a good morning, and a small red gem opens on its brow. It is **Espeon**, and it already knew what you were going to do.'],
  ['sylveon', 'Pale ribbons unfurl from its neck and wind around your wrist. It is **Sylveon**, glad to be here, and so is everyone you have healed.'],
  ['vaporeon', 'Its skin goes cool and smooth, and a fin slips out along its back. It is **Vaporeon**, and it has been looking at the water all along.'],
  ['jolteon', 'Its fur stands up in a thousand bright spikes and the air round it crackles. It is **Jolteon**, as quick as the fights you ended.'],
  ['flareon', 'Warmth rolls off it in a wave, and a great fire-coloured ruff flares round its neck. It is **Flareon**, and the firelight loves it.'],
  ['leafeon', 'Leaves unfold along its tail and its ears, and it smells of cut grass. It is **Leafeon**, half plant, just as the gardener said.'],
  ['glaceon', 'Frost crawls over its coat and its ears turn into crystal. It is **Glaceon**, and it doesn\'t feel the cold at all.'],
];
const joinOf = (species: string, ability?: string): Json => ({ ...join({ species: [species], lv: 0 }), friendship: 30, ...(ability ? { ability } : {}) });
const FORMS: Json[] = [
  ...FORM_LINES.map(([sp, text], i) => gn('when', { key: 'eevee-form', min: i + 1, max: i + 1, then: [joinOf(sp)], text })),
  gn('when', { key: 'eevee-form', min: 9, max: 9, then: [joinOf('eevee', 'open-road')], text: 'It stays an **Eevee**. It never needed the choice. Its first step each fight is a good one, and it knows it (Open Road).' }),
];
const ENDING = gev('gn-new-01-end', 'The Eevee Who Couldn\'t Choose: The Last Rest', eev({
  cast: [], requires: [is('eevee-on'), not('eevee-done'), here, laterStage(STAGE)],
  remembers: [{ id: 'shrugged', when: [is('eevee-shrug', 3), not('eevee-nod')], notice: '*You shrugged every time, and it shrugged back. It looks at you now like someone who has found a friend.*' }],
}), say(
  'At the last rest of the region, the fire is low and the road ahead is quiet.',
  '*The Eevee walks into the firelight and sits down in front of you.*',
  'It looks at you. It looks at the fire. It looks at all seven roads behind you, and it doesn\'t look away from any of them.',
  '*It isn\'t asking any more.*',
), [
  ch('Hold out a hand.', out('It steps into your hand, warm and light, and something in it settles. The answer was never in what you said. It was in the road.',
    gn('eeveeEnd'), ...FORMS, moment('The Eevee who couldn\'t choose chose, by watching how you walked.', 70))),
]);

// ---- The afterstory: each admirer you turned down is met once in a later region, at a step 5 town ----
const AFTER: Record<string, { name: string; lines: string[]; label: string; reply: string }> = {
  fisherman: { name: 'The Fisherman, Later', lines: ['A man at a harbour wall, a net across his knees, and a small blue Pokémon asleep in a bucket beside him.', '**Fisherman:** "Water type. Didn\'t need a stone. Turns out I\'d been looking for the wrong kind of thing."'], label: 'Wave.', reply: 'You wave. He holds up his catch of the day, and grins like a man with nothing left to prove.' },
  magician: { name: 'The Street Magician, Later', lines: ['A crowd in a square, and at the middle of it the street magician, a small bright Pokémon on her shoulder.', '**Street magician:** "Not the one I wanted. The one I got. And the crowds adore *her.* Hello again!"'], label: 'Clap.', reply: 'You clap with everyone else. She bows to you a little deeper than to the rest.' },
  electrician: { name: 'The Electrician, Later', lines: ['A lamp-post with a ladder against it, a coil of wire, and a small yellow Pokémon holding the end of it.', '**Electrician:** "Quick enough. Quick enough as it is, it turns out. Don\'t know why I ever thought it needed more."'], label: 'Wave.', reply: 'He waves a screwdriver at you. The little one sneezes sparks, and the lamp flickers on.' },
  nurse: { name: 'The Night-Shift Nurse, Later', lines: ['A quiet clinic at dusk, and a nurse changing shifts, a soft grey Pokémon curled around her ankle.', '**Night-shift nurse:** "It sits with my patients after dark now. Not the one I wanted. A good one, though."'], label: 'Wave.', reply: 'She lifts a hand in the doorway. The lamps go on one by one behind her.' },
  gardener: { name: 'The Gardener, Later', lines: ['A row of beds in a town square, freshly dug, and a gardener with a small green Pokémon scratching in the soil.', '**Gardener:** "It sleeps in my beds. Different Pokémon, same habit. I think they all do, in the end."'], label: 'Wave.', reply: 'She waves a trowel. The seedling Pokémon looks up with soil on its nose.' },
  guide: { name: 'The Mountain Guide, Later', lines: ['A signpost at the edge of a town, a heavy pack, and a broad-shouldered guide with a sturdy Pokémon at his heel.', '**Mountain guide:** "Doesn\'t feel the cold either. I\'ve stopped checking. Funny how they find you, the cold-proof ones."'], label: 'Wave.', reply: 'He raises one gloved hand. His partner stamps once, like a signature.' },
  ribbon: { name: 'The Ribbon-Maker, Later', lines: ['A little stall hung with ribbons, and the ribbon-maker behind it, a quiet Pokémon draped in a scrap of silk.', '**Ribbon-maker:** "You turned it down, and quite right. I made something else instead. Here: another. For the road."'], label: 'Accept the ribbon.', reply: 'She ties it on herself, without asking, with a bow neat as a promise (Bond +1).' },
};
const afterEvent = (id: string): Json => {
  const a = AFTER[id]!;
  return gev(`gn-new-01-after-${id}`, `The Eevee Who Couldn't Choose: ${a.name}`, eev({
    pokemon: undefined, stop: 'event', rarity: 'uncommon', callback: true, cast: [ADMIRERS.find((x) => x.id === id)!.cast],
    requires: [is(`eevee-refused-${id}`), not(`eevee-after-${id}`), regionChanged(AT)],
  }), say(...a.lines), [
    ch(a.label, out(a.reply, flag(`eevee-after-${id}`), ...(id === 'ribbon' ? [bond(1)] : []))),
  ]);
};

export const EVENTS: Json[] = [OPEN, ...ADMIRERS.map((a, i) => beat(i + 1, a)), ENDING, ...ADMIRERS.map((a) => afterEvent(a.id))];

export const REMOVE: string[] = [];

const BASE: Placement = { gn: 'gn.new.01', shape: 'Region', earliest: 'A1', sits: 'must-see', attaches: 'after', tags: ['Region-Wide Story', 'Companion Story'], level: 'no battles', often: 'run', badge: 'own', chain: 'gn.new.01' };
const BEATS = [
  { beat: 'Cold open', event: 'gn-new-01-open', stage: 'S1', home: 1, window: [1, 1] as [number, number] },
  ...ADMIRERS.map((a, i) => ({ beat: `Beat ${i + 1}: ${a.who}`, event: `gn-new-01-b${i + 1}`, stage: a.stage, home: a.home, window: [a.home, a.fallback] as [number, number] })),
  { beat: 'Ending', event: 'gn-new-01-end', stage: 'S8', home: 19, window: [19, 19] as [number, number] },
];
export const PLACEMENT: Record<string, Placement> = {
  'gn-new-01-open': { ...BASE, beat: 1, attaches: 'after', beats: BEATS, note: 'Badge: a small brown paw. After the run\'s first encounter, so the first battle still starts. Once a run (the doc says once per save; no memory across runs). Best in a run\'s first or second region.' },
  ...Object.fromEntries(ADMIRERS.map((a, i) => [`gn-new-01-b${i + 1}`, { ...BASE, beat: i + 2, stages: [stageNo(a.stage)], beats: BEATS, ...(i === 0 ? { sits: 'must-see' as const } : { sits: 'optional' as const }) }])),
  'gn-new-01-end': { ...BASE, beat: 9, attaches: 'before', beats: BEATS, note: 'S8 step 19, at a + node if one is near.' },
  // Afterstory: each admirer turned down is met once in a later region, at a step 5 town.
  ...Object.fromEntries(ADMIRERS.map((x) => [`gn-new-01-after-${x.id}`, { gn: 'gn.new.01', shape: 'Single', earliest: 'A2', home: 5, window: [3, 8] as [number, number], sits: 'optional' as const, attaches: 'town' as const, tags: ['Reunion Episode'], level: 'None', often: 'run' as const, badge: 'own', note: 'Afterstory: met once in a later region, at a step 5 town.' }])),
};

export const CHAINS: Json[] = [];
