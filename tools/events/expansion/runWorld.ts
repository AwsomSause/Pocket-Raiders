// World-state pressure (FE-44 to FE-51, forced) and Track scenes (EN-60 to EN-69). The track made physical:
// closed roads, a taken shop, a blackout; and the civilians living under each step. No battle above Specialist here.
import { $, ch, flag, flagIs, foe, fight, heat, leave, out, track, X, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

const hi = [X.trackHigh];
export const WORLD_EVENTS: Json[] = [
  xr('fe-44', 'The Road Is Closed', true, { req: hi, cast: ['trainer.roughneck'] }, 'A Rocket barricade across the road: "Closed for inventory." The detour is long, and the grunts have not seen you yet.', [
    ch('Take the long way round', out('It costs you an hour and a bit of nerve, nothing else.', heat(-1))),
    ch('Break the barricade', fight('Two grunts come out of the van.', foe('Rocket Barricade', 'grunt', [heat(1)], 2))),
    ch('Pay the "inventory fee" (₽600)', out('The barricade lifts. The receipt says INSURANCE.', $(-600)), { requires: [{ kind: 'money', atLeast: 600 }] }),
  ]),
  xr('fe-45', 'The Shop Is Taken', true, { req: hi, cast: ['trainer.worker_m'] }, 'The Poké Mart has a Rocket sign over the door and half its shelves bare. A grunt behind the counter: "New management."', [
    ch('Buy the leftovers (₽300)', out('A few Potions at triple the sign price. It is still a shop.', $(-300), { kind: 'item', id: 'potion', count: 3 }), { requires: [{ kind: 'money', atLeast: 300 }] }),
    ch('Take the shop back', fight('The grunt calls for a friend.', foe('Rocket Clerk', 'specialist', [{ kind: 'item', id: 'super-potion', count: 2 }, good(2)]))),
    ch('Walk on', leave('You find the owner out back, who points you to the next town\'s shop.')),
  ]),
  xr('fe-46', 'Blackout', true, { req: hi, cast: ['trainer.worker_m'], tint: '#0c0c14' }, 'The lights go out across the block. A voice on a loudspeaker: "Power is a privilege. Accuracy is, too." Your Pokémon will fight at a disadvantage in the dark: moves miss more often tonight.', [
    ch('Wait for dawn at the Center', out('You sit out the dark. The power is back by morning and your party is rested.', { kind: 'heal', share: 1 }, { kind: 'rest' })),
    ch('Push on in the dark', fight('Accuracy is down 10% in this fight. It is announced, and you can still back out.', foe('Rocket Lineman', 'specialist', [heat(1), { kind: 'item', id: 'smoke-ball' }]))),
    ch('Find the breaker', out('You trace the cable to a grunt\'s van and pull the plug. The lights come back, and so does their patience.', heat(2), good(1))),
  ]),
  xr('fe-47', 'Requisition', true, { req: hi, cast: ['trainer.roughneck'] }, 'A grunt with a clipboard is "requisitioning" a Pokémon Center\'s supplies: bandages, Potions, a cot. The nurse looks at you.', [
    ch('Stand beside the nurse', fight('The Requisition Squad does not take it well.', foe('Rocket Requisition', 'specialist', [{ kind: 'item', id: 'full-heal', count: 2 }, good(2)]))),
    ch('Hand over ₽500', out('The clipboard gets its tick. The nurse keeps her cots.', $(-500)), { requires: [{ kind: 'money', atLeast: 500 }] }),
    ch('Slip away quietly', leave()),
  ]),
  xr('fe-48', 'The Leader\'s Announcement', true, { req: hi, rarity: 'rare', cast: ['trainer.gentleman'], tint: '#18121c' }, 'Every screen in town shows the same face. "Citizens, from tonight the Ledger is simply how things are done." The crowd goes quiet. Nothing else happens, and there is nothing to fight.', [
    ch('Listen to the end', out('You learn what the Ledger now covers, and who is nervous about it.', flag('ledger-announced'), { kind: 'research', amount: 5 })),
    ch('Walk on', leave()),
  ]),
  xr('fe-49', 'Checkpoint', true, { req: hi, cast: ['trainer.roughneck'] }, 'Two grunts and a folding table: "Papers." Everyone ahead of you is being let through for a small fee.', [
    ch('Show the Gym badges instead', out('"Fine. Go." They do not look at what they are waving through.', heat(1)), { requires: [{ kind: 'badges', atLeast: 1 }] }),
    ch('Fight your way through', fight('The table goes over.', foe('Checkpoint Guard', 'specialist', [heat(2)], 2))),
    ch('Pay the toll (₽400)', out('The table is moved an inch.', $(-400)), { requires: [{ kind: 'money', atLeast: 400 }] }),
  ]),
  xr('fe-50', 'The Poached Meadow', true, { req: hi, cast: ['trainer.hiker'] }, 'The tall grass is flattened in neat rows. A trapper is loading cages into a truck with a red R on the side.', [
    ch('Release the cages', fight('The trapper does not give up the key.', foe('Rocket Trapper', 'specialist', [good(3), { kind: 'item', id: 'great-ball', count: 2 }]))),
    ch('Follow the truck\'s tracks', out('You mark where the truck stops. It helps the next person who cares.', flag('poach-route-marked'), heat(1))),
    ch('Report it to the Ranger', out('The Ranger takes the note and thanks you.', good(1))),
  ]),
  xr('fe-51', 'Supply Line', true, { req: hi, cast: ['trainer.roughneck'] }, 'A convoy of three vans, one lead grunt. They are ferrying the supplies that keep the Ledger funded. A win here would make the world a little easier.', [
    ch('Stop the convoy', fight('Three fights in a row, no healing between them. A win turns the Ledger back one step.', foe('Convoy Driver', 'specialist', [track('raidSuccess'), heat(2)], 3))),
    ch('Slow it down (₽300)', out('A few well-placed nails in a tire. The convoy is late, not stopped.', $(-300), heat(1)), { requires: [{ kind: 'money', atLeast: 300 }] }),
    ch('Let it pass', leave()),
  ]),
  // Track scenes: the civilians under each step.
  xr('en-60', 'What the Baker Heard', false, { req: [{ kind: 'track', atLeast: 1 }], rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A baker slides you a warm roll. "Heard the shop on Elm is paying \'insurance\' now. For what? Nobody says."', [
    ch('Ask her to say more', out('She tells you which shop, and when the Collector comes by.', flag('baker-tip'), { kind: 'research', amount: 3 })),
    ch('Buy another roll (₽80)', out('It is a good roll. Your party shares it.', $(-80), { kind: 'friendship', amount: 3, who: 'party' }), { requires: [{ kind: 'money', atLeast: 80 }] }),
    ch('Thank her and go', leave()),
  ]),
  xr('en-61', 'The Queue', false, { req: hi, rarity: 'common', cast: ['trainer.worker_m'] }, 'A queue around the block for a Center that opens two hours a night. People have brought chairs.', [
    ch('Give up your place to someone with a sick Pokémon', out('A woman thanks you three times. Your party does not mind the wait.', good(2), { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Wait your turn', out('Two hours later, a rested party.', { kind: 'heal', share: 1 })),
    ch('Walk past', leave()),
  ]),
  xr('en-62', 'The Back-Door Shop', false, { req: [{ kind: 'track', atLeast: 2 }], rarity: 'uncommon', cast: ['trainer.worker_m'] }, 'A shopkeeper waves you into a stockroom. "The front door is watched. Here, it\'s the old prices. Quick."', [
    ch('Buy a bundle (₽500)', out('Potions and a ball, at honest prices.', $(-500), { kind: 'item', id: 'potion', count: 3 }, { kind: 'item', id: 'poke-ball', count: 3 }), { requires: [{ kind: 'money', atLeast: 500 }] }),
    ch('Tell him you will not be a customer', leave('He shrugs. "Then you were never here."')),
  ]),
  xr('en-63', 'Black-Label', false, { req: [{ kind: 'track', atLeast: 2 }], rarity: 'common', cast: ['trainer.guitarist'] }, 'The prize counter at the Game Corner has new labels: BLACK. A boy stares at a plush he can no longer afford.', [
    ch('Buy it for him (₽400)', out('He hugs it and will not stop thanking you.', $(-400), good(2)), { requires: [{ kind: 'money', atLeast: 400 }] }),
    ch('Ask the counter who made the new labels', out('The counter goes quiet. You write it down.', flag('black-label-asked'))),
    ch('Move on', leave()),
  ]),
  xr('en-64', 'The Street That Left', false, { req: [{ kind: 'track', atLeast: 4 }], rarity: 'uncommon', cast: ['trainer.hiker'] }, 'Half a street of shutters, a notice taped to each: GONE WITH THE EXPORT. A boy sits on a step holding a Poké Ball that nobody will answer.', [
    ch('Sit with him', out('He tells you what his Pokémon was like. It is a long story, and a good one.', good(3), { kind: 'friendship', amount: 3, who: 'party' })),
    ch('Leave a few Potions', out('He takes them with both hands.', { kind: 'loseItem', id: 'potion' }, good(1))),
    ch('Walk on', leave()),
  ]),
  xr('en-65', 'Under New Management', false, { req: hi, rarity: 'uncommon', cast: ['trainer.gentleman'] }, 'A restaurant has a new sign: UNDER NEW MANAGEMENT. The old owner is washing the windows anyway.', [
    ch('Ask what changed', out('"The menu. The prices. Who I am allowed to serve." He gives you a note for the next town.', flag('management-note'))),
    ch('Order a meal (₽200)', out('The food is fine. The silence is not.', $(-200), { kind: 'heal', share: 0.5 }), { requires: [{ kind: 'money', atLeast: 200 }] }),
    ch('Leave', leave()),
  ]),
  xr('en-66', 'The Rocket Advert', false, { req: hi, rarity: 'common', cast: ['trainer.roughneck'] }, 'Every screen in the plaza runs a jingle: "Team Rocket: Insuring Your Peace of Mind." People hum it without noticing.', [
    ch('Tear down the poster', out('A grunt notices. You have a head start.', heat(2), good(1))),
    ch('Study the advert', out('You catch the number at the bottom. It is a tip line.', flag('advert-number'), { kind: 'research', amount: 4 })),
    ch('Ignore it', leave()),
  ]),
  xr('en-67', 'A Letter Home', false, { req: hi, rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A woman asks if you can carry a letter to her sister in the next town. Post is "slow" these days.', [
    ch('Carry it', out('You will remember the name on the envelope.', flag('letter-carried'), good(2))),
    ch('Decline politely', leave()),
  ]),
  xr('en-68', 'The Closed Gym Door', false, { req: hi, rarity: 'uncommon', cast: ['trainer.black_belt_m'] }, 'A dojo is shuttered. A black belt sweeps the step anyway. "My students stopped coming. Somebody is telling them it is not safe."', [
    ch('Spar with him', out('A friendly bout. He teaches you something about breathing.', { kind: 'levels', amount: 1, who: 'lead' })),
    ch('Promise to tell the town it is safe', out('You do, at the next stop. The town thinks about it.', good(2), flag('town-reassured'))),
    ch('Leave him to it', leave()),
  ]),
  xr('en-69', 'Name It Out Loud', false, { req: [{ kind: 'track', atLeast: 5 }], rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#14141c' }, 'Everyone in the square knows what is wrong and nobody says it. A child asks you, loudly, what the Ledger is.', [
    ch('Tell her the truth, plainly', out('The square goes still, and then a few people nod. It is not much. It is a start.', good(3), track('raidSuccess'))),
    ch('Change the subject', out('She frowns. You walk on.', heat(1))),
  ]),
] as Json[];
