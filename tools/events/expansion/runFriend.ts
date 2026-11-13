// Rival and the Friend (EN-88 to EN-95): the Errand, the Eve, the keepsake at the entrance, the receipt, a postcard, a cellmate.
// EN-88 and EN-89 are the Friend's two new encounters (the Friend exists only in runs where `friendPresent` holds).
import { $, ch, flag, heat, leave, out, X, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

const fr = [X.friendPresent];
export const FRIEND_EVENTS: Json[] = [
  xr('en-88', 'The Errand', false, { req: fr, rarity: 'uncommon', cast: ['trainer.youngster_m'] }, 'Your Friend meets you outside a Center with a list. "Can you help me with some errands? It is faster with two."', [
    ch('Help with the whole list', out('Three stops, two jokes, one stolen ice cream. Your party likes your Friend.', { kind: 'friendship', amount: 3, who: 'party' }, flag('friend-errand'))),
    ch('Take half the list', out('You are both home before dark. Fair enough.', flag('friend-errand'), { kind: 'friendship', amount: 1, who: 'party' })),
    ch('Not today', leave('"Next time, then."')),
  ]),
  xr('en-89', 'The Eve', false, { req: fr, rarity: 'rare', cast: ['trainer.youngster_m'], tint: '#14182c' }, 'The night before a big thing, your Friend sits beside you on a step. "I am a little scared. I do not want to say that to anyone else."', [
    ch('Tell them you are, too', out('You sit together for a long time. It helps.', { kind: 'friendship', amount: 3, who: 'party' }, flag('friend-eve'), good(1))),
    ch('Give them a pep talk', out('"You are better than you think." They believe you, a little.', flag('friend-eve'))),
    ch('Say nothing, stay close', out('That works too.', flag('friend-eve'))),
  ]),
  xr('en-90', 'Something of Theirs', false, { rarity: 'uncommon', cast: ['trainer.youngster_m'] }, 'At the entrance to a place you will have to go in alone, someone has left a small thing on the ground: a button, a wristband, a drawing. Yours, or from someone who loves you.', [
    ch('Take it with you', out('It is a small weight in your pocket, and a lighter heart.', flag('keepsake-held'), { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Leave it where it is', leave()),
  ]),
  xr('en-91', 'A Rival Who Stayed', false, { req: fr, rarity: 'uncommon', cast: ['trainer.youngster_m'] }, 'Your Friend lags behind to help a stranger with a stuck cart, then catches up, wiping their hands. "What? We had time."', [
    ch('Help push the cart', out('A good deed done quickly, and a little better for it.', good(2), { kind: 'friendship', amount: 1, who: 'party' })),
    ch('Wait by the road', leave()),
  ]),
  xr('en-92', 'The Receipt', false, { rarity: 'rare', cast: ['trainer.roughneck'] }, 'A grunt slips a receipt into your pocket as he passes: itemised, stamped, dated. It records where your rival\'s Pokémon was taken.', [
    ch('Keep it', out('A thin paper, a long list, and a place you will want to look at.', flag('receipt-held'), { kind: 'research', amount: 5 })),
    ch('Throw it away', out('You cannot unread it.', flag('receipt-seen'))),
  ]),
  xr('en-93', 'A Postcard, Not for You', false, { rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A postcard blown against your shoe, addressed to someone else. Even so, you can read: "Wish you were here."', [
    ch('Mail it for them', out('You find a post box and drop it in.', good(1))),
    ch('Keep it', out('It is just a card.')),
  ]),
  xr('en-94', 'What the Shadow Remembers', false, { req: [X.hasShadow], rarity: 'uncommon', cast: ['trainer.psychic_m'] }, 'In a quiet moment your Shadow Pokémon stops and listens to a bell in the distance. It has heard this bell before.', [
    ch('Walk toward the bell', out('A small church garden. The bell stops. Your Pokémon seems steadier.', { kind: 'friendship', amount: 2, who: 'party' }, flag('shadow-remembered'))),
    ch('Carry on', leave()),
  ]),
  xr('en-95', 'Cellmate', false, { rarity: 'rare', cast: ['trainer.hiker'], tint: '#14141c' }, 'A holding cell at a hideout you are walking through. Someone is in it, not a grunt: a local kid, caught wandering. He looks at you.', [
    ch('Let him out', out('He takes the key and runs for the door, then comes back to say thank you.', good(3), flag('cellmate-freed'), heat(1))),
    ch('Leave a Potion and a note', out('He will be found by someone kinder.', { kind: 'loseItem', id: 'potion' }, good(1))),
    ch('Walk on', leave()),
  ]),
] as Json[];
