// Greenneedle gn.new.34 The Warning (GREENNEEDLE_PLACED_2.md §34). An Absol on a ridge, a village throwing stones, a slide at night.
// Build: npm run co:build -- greenneedle-new-34
import { anyType, ch, flag, join, moveFlag, out, room, wild, type Json } from '../dsl.ts';
import { chIf, eitherWay, gev, is, moment, not, rm, say, setTo, stampRegion, stampStage, regionChanged, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const RIDGE = '#4b5563';
const w = (o: Json = {}): Json => ({ tags: ['Story', 'Pokémon'], tint: RIDGE, pokemon: 'absol', ...o });
const READY = [is('warning-open'), not('warning-done')];

// ---- the six (or three) turns: carry, dig, shout, hold ----
const turnRoom = (id: string, name: string, turn: number, total: number, next: string, _driven: boolean): Json => rm(id, name, w({ effect: 'rain', tint: '#33404f' }), say(
  `Turn ${turn} of ${total}. The crack above the school has widened to a hand. Mud runs down it, brown and slow, and then not so slow.`,
  turn === total ? 'This is the last turn. Whatever is not done now is going to be done for you.' : 'Voices below. A bell, rung wrong. Somebody is carrying a child on their back and does not know which way to go.',
), tasks(next));

/** The four tasks. Dig needs Ground, Rock or Fighting; shouting is better with a sound move; holding the door is better with Steel. */
const tasks = (next: string): Json[] => [
  ch('Carry the children.', out('Anything strong or large takes a child under each arm and runs. They are heavy, and wet, and silent. You count heads. The count is right. You count again.', flag('warning-carried'), room(next))),
  ch('Dig a channel to turn the slide.', out('Claws, fists and shoulders cut a trench across the slope, as deep as they can make it, as fast as they can make it. The mud arrives at it, and leans, and starts to go the other way.', flag('warning-dug'), room(next)), { requires: [anyType('ground', 'rock', 'fighting')] }),
  ch('Shout the houses awake.', out('Every window on the street lights up. Doors bang. Nobody remembers dressing, and everybody is dressed.', flag('warning-shouted'), room(next)), {
    branches: [{ when: [moveFlag('sound')], text: 'A sound move, as loud as you can make it. It rolls down the street and into every house, and every house wakes up at once. Somebody laughs, crying, in the dark.', effects: [flag('warning-shouted'), room(next)] }],
  }),
  ch('Hold the school door.', out('Something brave puts its shoulder to the school door and does not give. Behind it, small hands pass children out through the gap, one at a time.', flag('warning-held'), room(next)), {
    branches: [{ when: [anyType('steel')], text: 'Steel takes the door and does not bend. The mud hits it, and it holds, and it holds, and the last child is out.', effects: [flag('warning-held'), room(next)] }],
  }),
];

const turns = (prefix: string, total: number, driven: boolean, endId: string): Json[] =>
  Array.from({ length: total - 1 }, (_, i) => turnRoom(`${prefix}${i + 2}`, `The Slide, Turn ${i + 2}`, i + 2, total, i + 2 === total ? endId : `${prefix}${i + 3}`, driven));

export const EVENTS: Json[] = [
  // ---- the ridge (Step 5, must-see) ----
  gev('gn-new-34', 'The Warning', w({ stop: 'event', rarity: 'rare', forced: true, minStage: 1, effect: 'fog', requires: [not('warning-open')] }), say(
    'A village is throwing stones at an Absol on the ridge. It does not leave.',
    '**Goody Prowse:** "It came before the flood. It came before the fire. Drive it off and we\'ll pay."',
    '*A stone hits it. It does not flinch. It looks at the school.*',
  ), [
    ch('Drive it off.', {
      text: 'You step up with your team, and the stones stop, because now somebody else is doing it. The Absol looks at you. It looks at you for a long time. It does not look afraid. It looks sorry.',
      effects: [flag('absol-driven'), flag('warning-open'), setTo('warning-turns', 3), stampStage('warning-stage'), stampRegion('warning-region')],
      battle: eitherWay({ ...wild({ species: ['absol'], lv: 0 }), rule: { noCatch: true } }),
    }),
    ch('Stand between it and the stones.', out(say(
      'You step between. A stone hits your bag, and then another, and then the throwing stops, one arm at a time.',
      'Goody Prowse lowers hers last. The Absol looks at you once. Then it turns and walks up the ridge, and stops, and waits.',
    ), flag('absol-shielded'), flag('absol-believed'), flag('warning-open'), setTo('warning-turns', 6), stampStage('warning-stage'), stampRegion('warning-region'))),
    ch('Follow it.', out(say(
      'The Absol goes up the ridge without looking back. You follow it, and the village watches you go.',
      'Above the school there is a crack in the hillside. It is wet. It is widening. Nobody else has looked up here in a week.',
    ), flag('absol-believed'), flag('warning-open'), setTo('warning-turns', 6), stampStage('warning-stage'), stampRegion('warning-region'))),
  ]),

  // ---- the slide, believed: six turns (Step 10) ----
  gev('gn-new-34-slide', 'The Slide', w({ stop: 'event', rarity: 'rare', callback: true, minStage: 1, effect: 'rain', tint: '#33404f', requires: [...READY, is('absol-believed'), not('absol-driven')] }), say(
    'The crack goes. A sound like a door in the sky, and then the hill starts moving, all of it, quietly.',
    'The Absol is already at the school, and so are you. It is the only warning anyone is going to get, and you have six turns.',
    '*Every task is a person.*',
  ), tasks('gn-new-34-b2')),
  ...turns('gn-new-34-b', 6, false, 'gn-new-34-end'),

  // ---- the slide, driven off: three turns ----
  gev('gn-new-34-slide-driven', 'The Slide, at Night', w({ stop: 'event', rarity: 'rare', callback: true, minStage: 1, effect: 'rain', tint: '#33404f', requires: [...READY, is('absol-driven')] }), say(
    'That night, the hill comes down.',
    'The Absol is already there, digging at the school door with its horn. It did not wait to be asked, and it did not wait to be forgiven.',
    'There are three turns. Somebody has to be quicker than the mud.',
  ), tasks('gn-new-34-d2')),
  ...turns('gn-new-34-d', 3, true, 'gn-new-34-end'),

  // ---- the end: nobody dies; buildings do ----
  rm('gn-new-34-end', 'After the Slide', w({ effect: 'rain' }), say(
    'It is quiet after. Mud to the windowsills. The school is standing, or it is not. Nobody is under it.',
    'Goody Prowse is sitting in the street with a child on her knee, counting heads. She counts them twice.',
    'The Absol stands on the ridge, in the grey light, looking at the village.',
  ), [
    chIf([not('absol-driven')], 'Walk up to the Absol.', out(say(
      'It does not run. It looks like something that was right, and is too tired to be glad of it.',
      'Nobody says the word sorry out loud. The village sends up a pot of something warm, which is how a village says it.',
    ), flag('warning-done'), room('gn-new-34-join'), moment('An Absol warned a village about the slide. It was believed too late by some, and in time by enough.', 70))),
    chIf([is('absol-driven')], 'Watch it go.', out(say(
      'It does not run. It looks at your hands, and the hands of everyone behind you, and every one of them has held a stone.',
      'It turns and walks over the ridge, and does not look back. You do not follow. Some things are not yours to ask for.',
    ), flag('warning-done'), moment('The village drove the Absol off, and it came back to dig anyway. Nobody has forgotten it.', 65))),
  ]),

  // ---- the reward: it joins unless it was driven off ----
  rm('gn-new-34-join', 'Before the Fall', w({ effect: 'sparkle' }), say(
    'It comes down off the ridge slowly, as if the ground might change its mind.',
    'It stops an arm\'s length away. Then it presses its forehead to the back of your hand and stays there.',
    'It knows what comes before the falling. It will tell you, every time.',
  ), [
    ch('Come with me.', out('It falls in beside you. Somewhere behind, a child is waving from the school steps.', { ...join({ species: ['absol'], lv: 0 }), ability: 'before-the-fall' }, flag('absol-joined'))),
  ]),

  // ---- afterstory: a shrine, and the stones (a later region of the same run) ----
  gev('gn-new-34-shrine', 'The Pile of Stones', w({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 1, effect: 'fog', requires: [is('warning-done'), regionChanged('warning-region'), not('warning-shrine-seen')] }), say(
    'A small shrine at the edge of a road, with a flat stone for an offering and a dish of water in front of it.',
    'Behind it, on the ridge, there are stones. They are stacked in a neat pile, each one set on the last.',
    'Somebody stacked them. Nobody threw them.',
  ), [
    ch('Leave a stone on the pile.', out('You set it on top, gently, the way you would put down something that could still hurt. The wind turns, and for a moment the whole ridge sounds like someone saying thank you.', flag('warning-shrine-seen'))),
    ch('Walk on.', out('You walk on. Behind you, the pile does not move. It is not going to.', flag('warning-shrine-seen'))),
  ]),
];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-34': {
    gn: 'gn.new.34', shape: 'World Event', earliest: 'A6', sits: 'must-see', tags: ['World Event', 'Pokémon', 'Story'], level: 'no battles unless driven off (A+0)', often: 'run', needs: ['high'],
    beats: [
      { beat: 'The warning (must-see)', event: 'gn-new-34', stage: 'S(n)', home: 5, window: [4, 8] },
      { beat: 'The slide', event: 'gn-new-34-slide', stage: 'S(n)', home: 10, window: [9, 14] },
      { beat: 'The slide, after a drive-off', event: 'gn-new-34-slide-driven', stage: 'S(n)', home: 10, window: [9, 14] },
      { beat: 'The pile of stones', event: 'gn-new-34-shrine', stage: 'a later region', home: 8, window: [4, 14] },
    ],
    note: 'Fallback: the warning at Step 15, the slide at Step 19. Once per run; six turns if believed, three if driven off.',
  },
};
export const CHAINS: Json[] = [];
