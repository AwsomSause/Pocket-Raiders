// Liaison and Cipher (FE-66 to FE-71, forced) and the Liaison trail (EN-96 to EN-103). The Grand Arc at Street scale.
// No event takes a Data ROM: FE-70 copies, never removes. Four of the six forced events have no battle.
import { $, ch, flag, foe, fight, heat, leave, out, X, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

const ga = [X.grandArc];
export const LIAISON_EVENTS: Json[] = [
  xr('fe-66', 'The Man With the Clipboard', true, { req: ga, rarity: 'rare', cast: ['trainer.gentleman'], tint: '#101820' }, 'A thin man with a clipboard writes down every Pokémon that passes the crossroads, yours included. He does not look up. This is a scene, not a fight.', [
    ch('Ask what he is counting', out('"Throughput," he says. Then he writes down your question.', flag('liaison-seen'), { kind: 'research', amount: 4 })),
    ch('Look over his shoulder', out('Columns of numbers, and a header: CIPHER, ACCOUNT 2.', flag('liaison-seen'), flag('cipher-account-seen'))),
    ch('Walk past', leave()),
  ]),
  xr('fe-67', 'Samples', true, { req: [...ga, X.liaisonSeen], rarity: 'rare', cast: ['trainer.worker_m'] }, 'A numbered crate is being loaded into a van, and the liaison is signing for it. The crate is the first shipment of Samples: if it leaves, the Stock grows.', [
    ch('Stop the loading', fight('A loader and a driver, no more. A win stops the crate.', foe('Crate Loaders', 'specialist', [flag('samples-stopped'), good(2)], 2))),
    ch('Delay the van (₽300)', out('A flat tire, a long argument. The crate does not leave tonight.', $(-300), flag('samples-stopped')), { requires: [{ kind: 'money', atLeast: 300 }] }),
    ch('Let it go', out('The van pulls out. The Stock grows by one step.', { kind: 'grandArcStock', step: 1 })),
  ]),
  xr('fe-68', 'A Demonstration', true, { req: [...ga, X.liaisonSeen], rarity: 'rare', cast: ['trainer.gentleman'], tint: '#101820' }, 'The liaison is showing a buyer something in a locked room, and the buyer is impressed. You see a lit window.', [
    ch('Break up the sale', fight('A guard and a demonstrator.', foe('Demonstration Crew', 'lieutenant', [flag('demo-stopped'), good(2)]))),
    ch('Take notes from the street', out('You are too far to hear. You are close enough to see the buyer\'s face.', flag('demo-watched'), { kind: 'research', amount: 5 })),
    ch('Walk on', leave()),
  ]),
  xr('fe-69', 'The Invoice', true, { req: ga, rarity: 'rare', cast: ['trainer.worker_m'] }, 'A courier hands you an envelope by mistake. Inside: an invoice for "Services, Region (partial)", with a line item you recognise. No fight, no hurry.', [
    ch('Read it all the way through', out('Names, amounts, and a signature you will see again.', flag('invoice-read'), { kind: 'research', amount: 6 })),
    ch('Give it back to the courier', out('He thanks you, and does not meet your eye.', heat(-1))),
  ]),
  xr('fe-70', 'Late Fee', true, { req: [...ga, X.romHeld], rarity: 'rare', cast: ['trainer.roughneck'] }, 'A collector for the liaison taps his watch. "Overdue." He wants a copy of the Data ROM you hold, and he will take it by force. A lost fight never costs the ROM: a copy is all anyone can take.', [
    ch('Fight him', fight('A win and he leaves you alone.', foe('The Collector', 'lieutenant', [flag('late-fee-beaten'), good(2)]))),
    ch('Pay the late fee (₽500)', out('He signs off. The ROM stays with you.', $(-500)), { requires: [{ kind: 'money', atLeast: 500 }] }),
    ch('Hand over a copy', out('He copies it on the spot. The original stays in your hand.', heat(1))),
  ]),
  xr('fe-71', 'The Postcard From Elsewhere', true, { req: ga, rarity: 'rare', cast: ['trainer.aroma_lady'] }, 'A postcard with no stamp is slipped under your door. It shows the next region on your road. On the back, in a neat hand: SEE YOU THERE.', [
    ch('Keep it', out('You keep it, face up, in your notebook.', flag('postcard-kept'))),
    ch('Throw it away', out('You do not look at it again.')),
  ]),
  xr('en-96', 'A Crate Number', false, { req: ga, rarity: 'common', cast: ['trainer.worker_m'] }, 'A stencilled number on an empty crate in an alley: 00-17-A. The same number is on a van parked two blocks away.', [
    ch('Follow the van', out('It leads to a warehouse you will remember.', flag('crate-number-followed'), { kind: 'research', amount: 4 })),
    ch('Note the number and go', out('You write it on your hand and wash it off later.', flag('crate-number-noted'))),
  ]),
  xr('en-97', 'A Maker\'s Plate', false, { req: ga, rarity: 'common', cast: ['trainer.worker_m'] }, 'A discarded machine with a brass plate: BUILT FOR CIPHER, SERIES 2. A tinkerer is trying to buy it for scrap.', [
    ch('Tell him what it is', out('He puts it down, shaken. He thanks you for the warning.', good(2))),
    ch('Take the plate', out('A cold bit of brass, and a name.', flag('makers-plate'))),
  ]),
  xr('en-98', 'A Waveform on a Napkin', false, { req: [...ga, X.liaisonSeen], rarity: 'uncommon', cast: ['trainer.psychic_m'] }, 'A napkin on a café table, a waveform drawn in pen. Someone drew it while thinking about something else.', [
    ch('Take it', out('You show it to someone who knows. It matches a signal at the Silph tower.', flag('waveform-taken'), { kind: 'research', amount: 5 })),
    ch('Leave it', leave()),
  ]),
  xr('en-99', 'Meowth Reads a Stencil', false, { req: [...ga, X.liaisonSeen], rarity: 'uncommon', cast: ['trainer.roughneck'] }, 'A talking Meowth is reading a stencil on a van, mouthing it. He sees you. "Don\'t say nothing."', [
    ch('Ask what it says', out('He reads it out. It is a delivery window. He asks you not to use it.', flag('stencil-read'), { kind: 'research', amount: 4 })),
    ch('Offer him a snack', out('He eats it. "I ain\'t sayin\' nothin\', but thanks."', { kind: 'friendship', amount: 1, who: 'party' })),
  ]),
  xr('en-100', 'The Clipboard, Unattended', false, { req: ga, rarity: 'uncommon', cast: ['trainer.gentleman'] }, 'A clipboard lies on a bench. Nobody is near it.', [
    ch('Read it', out('Counts, timings, a map. Everything on it is a request for numbers.', flag('clipboard-read'), { kind: 'research', amount: 4 })),
    ch('Move it where its owner can find it', out('Better to be decent than clever.', good(1))),
  ]),
  xr('en-101', 'A Copy', false, { req: [...ga, X.romHeld], rarity: 'rare', cast: ['trainer.psychic_m'] }, 'A courier is carrying a Data ROM identical to yours. Hers is a copy. Yours is the only original.', [
    ch('Ask who copied it', out('"The Boss\'s supplier," she says, then regrets saying it.', flag('rom-copy-learned'))),
    ch('Let her pass', leave()),
  ]),
  xr('en-102', 'A Debt Repaid', false, { req: [...ga, X.trioFriendly], rarity: 'rare', cast: ['trainer.roughneck'] }, 'Three figures in dark coats and a talking Meowth stand in the shade of a vending machine. "We owe you," says one. "We never said we would pay."', [
    ch('Accept their help', out('They carry a heavy crate of supplies for you, then vanish before the next street.', { kind: 'item', id: 'great-ball', count: 3 }, { kind: 'item', id: 'super-potion', count: 2 })),
    ch('Tell them it is fine', out('"Then we owe you more."', good(2))),
  ]),
  xr('en-103', 'The Girl Who Sees Auras', false, { req: ga, rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#14182c' }, 'A girl sits on a wall and stares just left of you. "Your Pokémon have colours," she says. "Yours is the only party that is a little bit blue." She says it kindly.', [
    ch('Ask her about the blue', out('"It is where they are sad, but they like being with you."', { kind: 'friendship', amount: 3, who: 'party' })),
    ch('Ask about the other people', out('She says some of the people in the plaza have one big dark colour. She does not say which.', flag('aura-girl-met'))),
  ]),
] as Json[];
