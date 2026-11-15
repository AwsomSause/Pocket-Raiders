// Pokémon Moments that play as a scene with choices (POKEMON_MOMENTS.md). The rest of the moments live in src/data/pokemonMoments.json.
// PA11 NOT FROM HERE (Ultra Beasts): a rest scene, opened by the rest moment pa11-not-from-here (20%). Sitting with it three times in a run lets it sleep by the fire (+3 Bond), and from then on
// its Beast Boost fires once at the start of each battle (the moment pa11-sleeps-by-the-fire).
// Build: npm run co:build -- pack-moments
import { bondUp, ev, flag, flagIs, out, type Json } from '../dsl.ts';
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
];
