// Pokémon Moments that play as a scene with choices (POKEMON_MOMENTS.md). The rest of the moments live in src/data/pokemonMoments.json.
// PA11 NOT FROM HERE (Ultra Beasts): a rest scene, opened by the rest moment pa11-not-from-here (20%). Sitting with it three times in a run lets it sleep by the fire (+3 Bond), and from then on
// its Beast Boost fires once at the start of each battle (the moment pa11-sleeps-by-the-fire).
// PG2 ANY ROAD (Eevee), PG8 OLD QUARRELS (the weather trio), PG18 CHANGE OF CLOTHES (Rotom): rest scenes opened the same way.
// Build: npm run co:build -- pack-moments
import { bondUp, br, ev, flag, flagIs, hurt, out, type Json } from '../dsl.ts';
import { GROUP, P, ch, moment, not, variant } from './_ne.ts';

export { CATEGORY } from './_ne.ts';
export const REMOVE: string[] = [];

/** Bond goes to the first Ultra Beast in the party ({group:ultra-beasts} names the same one). */
const BEAST = { species: ['nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana', 'guzzlord', 'poipole', 'naganadel', 'stakataka', 'blacephalon'] };

const sit = (n: number): Json => ch('Sit with it.', out(P(
  'You sit down beside {group:ultra-beasts} in the cold grass and look up where it is looking. There is nothing there. Just stars, and the dark between them.',
  n === 1
    ? 'It doesn\'t look away from the sky. But after a while, it leans a little of its weight against you. Not much. Enough.'
    : 'This time it glances at you before it looks up again. As if checking you came. As if it had hoped you would.',
), bondUp(1, BEAST), flag('pa11-sat')));

const leaveIt = ch('Leave it be.', out(P(
  'You leave {group:ultra-beasts} to its watching. Some things a person can\'t help with.',
  'When you look back from the fire it is still there, small against the sky, staring at a place that isn\'t here.',
)));

export const EVENTS: Json[] = [
  {
    ...ev('pa11-not-from-here', 'Not From Here', GROUP.ultra, {
      // Never drawn on its own: the rest moment pa11-not-from-here (20% at a healing stop) opens it beside the stop.
      room: true, rarity: 'uncommon', tint: '#141a2e', effect: 'none',
      requires: [{ kind: 'partyGroup', group: 'ultra-beasts' }, not('pa11-sleeps')],
    }, P(
      'The fire is low and the team is asleep. All but one.',
      '{group:ultra-beasts} is standing apart at the edge of the light, looking up at the sky. Not at the stars. Past them.',
      'It is looking at a place that isn\'t here.',
    ), [sit(1), leaveIt]),
    tags: ['Relationship', 'Recovery'],
    remembers: [
      variant('pa11-second-night', [flagIs('pa11-sat', 1, 1)], {
        notice: 'It is looking up again. The same patch of sky. When it hears you, it shifts over, just a little, and leaves room.',
        hide: [0],
        addChoices: [sit(2)],
      }),
      variant('pa11-third-night', [flagIs('pa11-sat', 2)], {
        notice: 'It is looking up again. But it keeps glancing back at the fire. At the team. At you.',
        hide: [0],
        addChoices: [ch('Sit with it.', out(P(
          'You sit down beside it, the way you always do. It looks up at the sky for a long moment.',
          'Then {group:ultra-beasts} turns its back on the sky. It walks to the fire, curls up between the others, and closes its eyes.',
          'It doesn\'t look up again. Not that night. Not any night after. Whatever it was waiting for, it has stopped waiting.',
        ), bondUp(3, BEAST), flag('pa11-sat'), flag('pa11-sleeps'), moment('The Ultra Beast stopped looking at the sky and slept by the fire.', 70)))],
      }),
    ],
  },

  // PG2 Any Road: it evolves into the form that fits the weather, the place or the time, and the text says why.
  ev('pg2-any-road', 'Any Road', GROUP.camp, { room: true, rarity: 'uncommon', tint: '#2a2418', effect: 'none', requires: [{ kind: 'partyGroup', group: 'pg2-eevee' }] }, P(
    'You wake to a small, careful rustling. Eevee has its nose in your bag.',
    'It is not after food. It has rolled the evolution stones out onto the blanket, one by one, and it is looking at them very seriously.',
    'Then it looks at the sky. Then at you. It is asking something.',
  ), [
    // Nothing in the sky or the place calls to it: it chooses the day (Espeon). The branches go first when they hold.
    ch('Let it choose.', out(P('The light comes through the trees. Eevee turns to face it, and the light seems to stay in its eyes.', 'It chose the day. It is an Espeon now.'), { kind: 'formChange', from: 'eevee', to: 'espeon' }), { branches: [
      br([{ kind: 'weather', in: ['rain'] }], P('The rain is falling soft on the tent. Eevee walks out into it and stands there, eyes closed, until the water seems to go right into it.', 'It chose the rain. It is a Vaporeon now.'), { kind: 'formChange', from: 'eevee', to: 'vaporeon' }),
      br([{ kind: 'weather', in: ['sun'] }], P('The sun is hot on the grass already. Eevee lies down in the brightest patch and lets it soak in.', 'It chose the heat. It is a Flareon now.'), { kind: 'formChange', from: 'eevee', to: 'flareon' }),
      br([{ kind: 'weather', in: ['snow', 'hail'] }], P('Snow on the tent roof. Eevee pushes the flap open with its nose and breathes the cold in, deep.', 'It chose the cold. It is a Glaceon now.'), { kind: 'formChange', from: 'eevee', to: 'glaceon' }),
      br([{ kind: 'stageTypes', types: ['electric'] }], P('The air here crackles. Eevee\'s fur stands up on end, and it does not mind at all.', 'It chose the storm. It is a Jolteon now.'), { kind: 'formChange', from: 'eevee', to: 'jolteon' }),
      br([{ kind: 'stageTypes', types: ['grass', 'bug'] }], P('Eevee pads to the oldest tree at the edge of the camp and presses its face to the moss.', 'It chose the forest. It is a Leafeon now.'), { kind: 'formChange', from: 'eevee', to: 'leafeon' }),
      br([{ kind: 'stageTypes', types: ['fairy'] }], P('Eevee climbs into your lap and stays there, ribbons of something warm already curling around your wrist.', 'It chose you. It is a Sylveon now.'), { kind: 'formChange', from: 'eevee', to: 'sylveon' }),
      br([{ kind: 'period', in: ['evening', 'night'] }], P('It is dark still. Eevee sits under the moon until the rings on its body begin to glow.', 'It chose the night. It is an Umbreon now.'), { kind: 'formChange', from: 'eevee', to: 'umbreon' }),
    ] }),
    ch('Not yet.', out(P('You gather the stones and put them back. Eevee watches each one go.', 'Then it curls up in your bag on top of them, like it is keeping them safe. There is time. There is still time.'))),
  ]),
  // PG8 Old Quarrels: two of Groudon, Kyogre and Rayquaza won't sleep near each other.
  ev('pg8-old-quarrels', 'Old Quarrels', GROUP.camp, { room: true, rarity: 'uncommon', tint: '#1e2430', effect: 'none', requires: [{ kind: 'partyGroup', group: 'trio-weather', atLeast: 2 }] }, P(
    'The fire is lit, the team is fed, and two of them will not lie down.',
    'They stand on opposite sides of the camp. The ground under one is hot. The air over the other is wet. Neither will look away first.',
    'This is older than you. Much older. But they are both yours.',
  ), [
    ch('Sleep between them.', out(P(
      'You drag your bedroll into the middle, right between them, and lie down.',
      'For a long time neither moves. Then, very slowly, they lie down too, one on each side of you. The heat and the damp meet over your head all night.',
      'You do not sleep much. Nobody does. But they slept near each other, for you.',
    ), bondUp(1, { species: ['groudon'] }), bondUp(1, { species: ['kyogre'] }), bondUp(1, { species: ['rayquaza'] }), hurt(0.5))),
    ch('Separate camps.', out(P(
      'You build a second fire on the far side of the clearing. One of them goes to it without being asked.',
      'They sleep apart. The rest is a good one. The quarrel will keep.',
    ))),
  ]),
  // PG18 Change of Clothes: Rotom found an appliance; the player sees which before choosing.
  ev('pg18-change-of-clothes', 'Change of Clothes', GROUP.camp, { room: true, rarity: 'uncommon', tint: '#1c2228', effect: 'none', requires: [{ kind: 'partyGroup', group: 'pg18-rotom' }] }, P(
    'A whirr. A clank. A very pleased crackle of static.',
    'Rotom has got into {rotomAppliance} somebody left by the road. Its eyes peer out of the front, delighted.',
    'It hums at you hopefully.',
  ), [
    // A washing machine unless the place says otherwise (the same order as the {rotomAppliance} line).
    ch('Let it stay.', out(P('The washing machine shudders and starts to spin. Rotom sloshes happily inside.', 'Rotom is Wash Rotom now.'), { kind: 'formChange', from: 'rotom', to: 'rotom-wash' }), { branches: [
      br([{ kind: 'stageTypes', types: ['fire'] }], P('The oven door bangs shut with Rotom inside. It glows orange and very proud.', 'Rotom is Heat Rotom now.'), { kind: 'formChange', from: 'rotom', to: 'rotom-heat' }),
      br([{ kind: 'stageTypes', types: ['ice'] }], P('Frost creeps across the fridge door. Rotom hums, cold and smug.', 'Rotom is Frost Rotom now.'), { kind: 'formChange', from: 'rotom', to: 'rotom-frost' }),
      br([{ kind: 'stageTypes', types: ['flying'] }], P('The fan blades spin up with a roar. Your hat is gone. Rotom is thrilled.', 'Rotom is Fan Rotom now.'), { kind: 'formChange', from: 'rotom', to: 'rotom-fan' }),
      br([{ kind: 'stageTypes', types: ['grass'] }], P('The lawnmower coughs into life. Rotom does one very neat lap of the camp.', 'Rotom is Mow Rotom now.'), { kind: 'formChange', from: 'rotom', to: 'rotom-mow' }),
    ] }),
    ch('Out you get.', out(P('You knock on the side. A long, sulky pause. Then Rotom drifts out, crackling under its breath.', 'It sits on your shoulder for the rest of the night, still sulking. It is warm, at least.'))),
  ]),
];
