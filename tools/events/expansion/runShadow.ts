// Shadow and Reclaim (FE-60 to FE-65, forced) and Keys and purification (EN-80 to EN-87). Nothing here forces Shadow use:
// every event gated on `hasShadow` is one the player opted into by keeping a Shadow Pokémon, and each can be walked past.
// `shadowHeart` lowers every party Shadow's corruption but never below 1: the last step stays with the Pokémon's own key.
import { ch, flag, flagIs, foe, fight, heat, leave, out, X, xr, $, type Json } from './common.ts';
import { good } from '../dsl.ts';

const sh = [X.hasShadow];
const heart = (amount: number): Json => ({ kind: 'shadowHeart', amount });
export const SHADOW_EVENTS: Json[] = [
  xr('fe-60', 'They Have Come for One of Yours', true, { req: sh, rarity: 'rare', cast: ['trainer.roughneck'], tint: '#241028' }, 'A whistle, three times, from the roof. Two grunts step out with a transport case: "That one belongs to the team. We have come to collect." This is the Reclaim attempt, announced before it begins.', [
    ch('Battle to keep it', fight('Announced: a win ends the Reclaim. A loss follows the standard defeat rule.', foe('Reclaim Squad', 'lieutenant', [flag('reclaim-beaten'), good(2)], 2))),
    ch('Pay them off (₽800)', out('They take the money and leave. They will be back, quieter.', $(-800), heat(2)), { requires: [{ kind: 'money', atLeast: 800 }] }),
    ch('Slip away before they close the street', out('You lose the whistle in a crowd. They lose your trail.', heat(1))),
  ]),
  xr('fe-61', 'The Surge', true, { req: sh, rarity: 'rare', cast: ['trainer.worker_m'], tint: '#1c1030' }, 'A transmitter on a pole starts to hum, and your Shadow Pokémon looks up. This is the Surge, announced: it will stir your Shadow Pokémon for one fight.', [
    ch('Cut the power', fight('A technician guards the box.', foe('Surge Technician', 'specialist', [flag('surge-cut'), good(1)]))),
    ch('Lead your party away from it', out('You walk three streets before the hum fades. Your party is unsettled but fine.', { kind: 'friendship', amount: 1, who: 'party' })),
    ch('Wait it out in a quiet doorway', out('It passes.', heat(1))),
  ]),
  xr('fe-62', 'Snag!', true, { rarity: 'rare', cast: ['trainer.roughneck'] }, 'A grunt with a strange glove squares up to you, and the glove has a ball in it. Announced: this is a Snag attempt on one of your Pokémon. Switching dodges it.', [
    ch('Dodge by switching in', out('The ball hits the pavement. You keep the Pokémon.', flag('snag-dodged'))),
    ch('Battle the grunt', fight('He gets one throw; a win ends it.', foe('Snag Grunt', 'specialist', [flag('snag-dodged'), good(1)]))),
    ch('Run', out('You are faster. Mostly.', heat(1))),
  ]),
  xr('fe-63', 'A Bound Pokémon', true, { rarity: 'rare', cast: ['trainer.hiker'] }, 'A wild Pokémon is chained to a stake, ringed by grunts. It looks at you and does not growl.', [
    ch('Free it', fight('The ring breaks when you do.', foe('Binding Crew', 'specialist', [good(3), { kind: 'join', shadow: false, species: [], types: [], levelBonus: 0, shinyMultiplier: 1 }], 2))),
    ch('Cut the chain quietly (₽300)', out('A bolt cutter from a stall. The Pokémon walks off into the grass.', $(-300), good(2)), { requires: [{ kind: 'money', atLeast: 300 }] }),
    ch('Walk on', leave()),
  ]),
  xr('fe-64', 'An Officer Throws Down', true, { req: sh, rarity: 'rare', cast: ['trainer.gentleman'], tint: '#241028' }, 'A lieutenant leans on a lamp post as you pass. "Your Shadow Pokémon is a team asset. I would like to see how it fights without you telling it what to do."', [
    ch('Accept the challenge', fight('A fair fight, announced; your Shadow Pokémon may hesitate, and you will see why.', foe('Challenging Lieutenant', 'lieutenant', [flag('officer-challenged'), good(1)]))),
    ch('Decline', out('"Afraid to see it?" You walk on.', heat(1))),
  ]),
  xr('fe-65', 'A Key Turns', true, { req: [X.keyHinted], rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#101830' }, 'Your Shadow Pokémon stops in the middle of the road and looks at a particular door. It remembers something. This is the moment a key is close. No fight is needed; this is a scene.', [
    ch('Follow its gaze', out('Behind the door is a small thing that matters. Your Pokémon relaxes for the first time in days.', heart(-4), flag('key-hint-followed'))),
    ch('Walk on', leave()),
  ]),
  xr('en-80', 'The Long Walk', false, { req: sh, rarity: 'uncommon', cast: ['trainer.hiker'] }, 'A road with no towns on it. Your Shadow Pokémon walks easier on this one.', [
    ch('Walk it with them', out('A day of nothing in particular. Corruption eases by 3.', heart(-3), { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Take the quick road', leave()),
  ]),
  xr('en-81', 'The Shared Table', false, { req: sh, rarity: 'uncommon', cast: ['trainer.aroma_lady'] }, 'A table in a plaza, set for strangers. A woman waves you over: "Sit. Everyone eats."', [
    ch('Sit with your whole party', out('A long meal, nobody keeping score. Corruption eases by 8.', heart(-8), { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Just eat quickly', out('A bite, and a thank-you. Corruption eases by 3.', heart(-3))),
    ch('Walk on', leave()),
  ]),
  xr('en-82', 'The Crowd Chant', false, { req: sh, rarity: 'rare', cast: ['trainer.guitarist'] }, 'A street fair, a drum, and a chant that everyone knows. The chant is about being let in.', [
    ch('Join the chant', out('You and your Shadow Pokémon are in the circle for ten minutes. Corruption eases by 12.', heart(-12), good(1))),
    ch('Stand back', out('You watch from a bench. Corruption eases by 2.', heart(-2))),
  ]),
  xr('en-83', 'The Bridge of Lamps', false, { req: sh, rarity: 'rare', cast: ['trainer.psychic_m'] }, 'A bridge lit with paper lamps. The whole town walks it once a year, thinking of someone.', [
    ch('Cross it slowly with your Shadow Pokémon', out('A hush, and the lamps; corruption eases by 15.', heart(-15), good(2))),
    ch('Cross it alone', out('It is pretty. Nothing else happens.', good(1))),
  ]),
  xr('en-84', 'A Key Hinted', false, { req: [X.keyHinted], rarity: 'uncommon', cast: ['trainer.psychic_m'] }, 'Your Shadow Pokémon nudges the same object three times: an old jacket in a shop window.', [
    ch('Buy it (₽250)', out('The shopkeeper asks no questions. Your Pokémon rests its head on it.', $(-250), heart(-5), flag('key-hint-object')), { requires: [{ kind: 'money', atLeast: 250 }] }),
    ch('Note it for later', out('You write down the shop\'s name.', flag('key-hint-noted'))),
  ]),
  xr('en-85', 'Stabilize, or Not', false, { req: sh, rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#101830' }, 'A quiet doctor offers to Stabilize your Shadow Pokémon: not purify, only steady. It would keep its Shadow traits and stop sliding. He says you can decide later.', [
    ch('Ask about the cost', out('He is honest: it will not be fully free. It will be safe.', flag('stabilize-asked'))),
    ch('Decline, gently', out('"Of course. The offer stays open."', flag('stabilize-declined'))),
  ]),
  xr('en-86', 'Purified Water', false, { rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A spring with a hand-painted sign: DRINK, IF YOU LIKE. A Pokémon you do not know laps at it.', [
    ch('Drink', out('Cool and plain. Your party is a little better for it.', { kind: 'heal', share: 0.3 })),
    ch('Fill a bottle (₽0)', out('You take a Full Heal-sized bottle, no charge.', { kind: 'item', id: 'full-heal' })),
  ]),
  xr('en-87', 'A Key Missed', false, { req: [X.keyHinted], rarity: 'uncommon', cast: ['trainer.psychic_m'] }, 'You pass the place your Shadow Pokémon\'s key points to, and by the time you notice, the shop has closed and the street is empty. Nothing is lost; the key waits.', [
    ch('Come back tomorrow', out('You mark the spot. The key will still be there.', flag('key-fallback-set'), heart(-1))),
    ch('Move on', leave()),
  ]),
] as Json[];
