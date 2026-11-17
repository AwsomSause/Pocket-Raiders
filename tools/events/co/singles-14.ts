// Catalog Overhaul Pack, category "singles" (revised single events), batch 14.
// Doc: catalog_overhaul/STORY_FAMILIES_22.md SF161 Battle Moments.
// The moments themselves (lines, when they happen) live in src/data/dramaEvents.json. These are the five after-battle choices:
// a moment with `after` remembers its Pokémon (`who: 'moment'`) and opens its room beside the next node (core/drama/events.ts).
import { bondUp, ch, flag, out, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const rm = (id: string, name: string, intro: string, choices: Json[]): Json => ({ id, name, group: 'Battle moments', room: true, scene: { cast: [], effect: 'none' }, intro, choices });
/** Bond Engine trust is 0 to 100; the doc's "+1 trust" is one step of ten. */
const trust = (amount: number): Json => ({ kind: 'coTrust', amount, who: 'moment' });

const SF161: Json[] = [
  rm('moment-refusal', 'After the Refusal', 'The battle is over. The Pokémon that would not follow your order sits a little apart from the others, watching you, waiting to see what you will do.', [
    ch('Apologise to it.', out('You kneel down and tell it you are sorry: that was too much to ask. It looks at you for a long moment. Then it comes and sits beside you.', trust(10))),
    ch('Say nothing.', out('You say nothing. It says nothing. After a while it gets up and walks on with the others, and the space between you stays where it is.')),
  ]),
  rm('moment-combo', 'After the Hand-Over', 'The battle is over. The two that handed over to each other are side by side, still breathing hard, pretending not to look at each other.', [
    ch('Tell them they work well together.', out('You tell them. They both look away at the same moment, in the same direction, and that makes it worse, and then they are both laughing.', bondUp(1, 'moment'))),
  ]),
  rm('moment-mercy', 'After the Mercy', 'The battle is over. The trainer who told you that you could stop is packing up, not looking at you, as if it was nothing.', [
    ch('Thank them.', out('You thank them. They shrug, and then they do not. "Someone said it to me, once." They tell everyone on the road that you were worth the kindness.', flag('rep'))),
  ]),
  rm('moment-initiative', 'After the Initiative', 'The battle is over. The Pokémon that ignored your order, and was right, is looking up at you with its ears back, not sure if it is in trouble.', [
    ch('Thank it.', out('You thank it. You were wrong, and it knew, and it trusted you to understand. It pushes its head into your hand.', bondUp(1, 'moment'))),
    ch('Tell it to listen next time.', out('You tell it to listen next time. It looks at you for a long moment, then nods, slowly, the way you would to someone who has not quite understood yet.')),
  ]),
  rm('moment-turning', 'After the Turning Point', 'The battle is over. One of your team is standing a little differently now. Something happened to it in there, and it is still deciding what.', [
    ch('Tell it you saw.', out('You tell it you saw. It stands taller, and it does not stop.', bondUp(1, 'moment'))),
  ]),
];

export const EVENTS: Json[] = friendlyAll([...SF161]);
export const REMOVE: string[] = [];
