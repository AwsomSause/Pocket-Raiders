// Run events B batch 4 (R61, R64, R67, R75, R81, R88, R89, R90, R93, R105, R106, R108, R109, R110): trainer fights built from
// existing battle options plus the batch 3 fight rules (`rule`) and next-fight modifiers (`tempEffect`).
// Built into src/data/events/trainer-b4.json by `npm run data:rb4-events` (tools/build-rb4-events.ts).
import { $, any, ch, ev, fight, flag, good, heal, HELD, leave, out, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule?: Json, extra: Json = {}): Json => ({ ...trainer(name, o), ...(rule ? { rule } : {}), ...extra });
const first = (label: string): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'firstStrike' }], battles: 1, until: 'battle' });
const TYPES = ['fire', 'water', 'grass', 'electric', 'ice', 'fighting'];

export const RB4_EVENTS: Json[] = [
  ev('dance-off-duel', 'Dance-Off Duel', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.guitarist'], tint: '#2a1f33' },
    'A trainer cranks up the music. "Win the dance-off and you move first in our battle!"', [
      ch('Dance!', fight('You nail the moves. "Fine, you go first."', duel('Dance Rival', { cls: 'ace-trainer', size: 3, win: [$(500), rp(3)] }), first('Won the dance-off: you strike first')), { prompt: { id: 'hurdle-rhythm', needs: 'good' }, fail: fight('You stumble over your own feet. "Now we fight."', duel('Dance Rival', { cls: 'ace-trainer', size: 3, win: [$(400), rp(2)] })) }),
      ch('Skip the dancing', leave()),
    ]),
  ev('mentors-examination', "Mentor's Examination", G, { stop: 'event', rarity: 'rare', cast: ['trainer.gentleman'], tint: '#2e2418' },
    '"A veteran sets a rule: no bag items. Pass my examination and take a reward."', [
      ch('Sit the exam', fight('The mentor folds their arms. "Your Pokémon only."', duel('Examining Mentor', { cls: 'veteran', size: 3, win: [any(...HELD), good(1), rp(5)] }, { noItems: true }))),
      ch('Not ready', leave()),
    ]),
  ev('type-roulette-duel', 'Type Roulette Duel', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.gambler'], tint: '#2a2a10' },
    'A giant wheel of types stands by the road. "Spin it. Whatever it lands on is the theme of our fight!"', [
      ch('Spin the wheel', fight('The wheel clicks to a stop.', duel('Roulette Trainer', { cls: 'ace-trainer', size: 3, types: [TYPES[0]!], win: [$(600), rp(3)] })), { chance: 0.34, fail: fight('The wheel clicks to a different stop.', duel('Roulette Trainer', { cls: 'ace-trainer', size: 3, types: [TYPES[1]!], win: [$(600), rp(3)] })) }),
      ch('Spin it a second time', fight('The needle settles on a fresh type.', duel('Roulette Trainer', { cls: 'ace-trainer', size: 3, types: [TYPES[2]!], win: [$(600), rp(3)] })), { chance: 0.5, fail: fight('Different theme again.', duel('Roulette Trainer', { cls: 'ace-trainer', size: 3, types: [TYPES[3]!], win: [$(600), rp(3)] })) }),
      ch('Walk past the wheel', leave()),
    ]),
  ev('mirror-image-trainer', 'Mirror Image Trainer', G, { stop: 'event', rarity: 'rare', minStage: 2, cast: ['trainer.psychic_m'], tint: '#202033' },
    'A trainer holds up a mirror. "Beat your own build."', [
      ch('Face your reflection', fight('Your lead stares back at you.', duel('Mirror Trainer', { cls: 'psychic', size: 1, lv: 1, win: [$(700), rp(4)] }, undefined, { mirror: true }))),
      ch('Turn the mirror away', leave()),
    ]),
  ev('gym-janitor-challenge', 'Gym Janitor Challenge', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.worker_m'], tint: '#2a2518' },
    'The arena floor is filthy. "Sweep it for me and the leader\'s apprentice will give you a fair fight."', [
      ch('Sweep the arena', fight('The floor gleams. The apprentice nods.', duel('Leader\'s Apprentice', { cls: 'ace-trainer', size: 3, win: [$(650), rp(3)] }), first('Clean arena: you strike first')), { prompt: { id: 'whack-tap', needs: 'good' }, fail: fight('You leave smears. The apprentice sighs.', duel('Leader\'s Apprentice', { cls: 'ace-trainer', size: 3, win: [$(450), rp(2)] })) }),
      ch('Just fight', fight('"Fine, dirty floor and all."', duel('Leader\'s Apprentice', { cls: 'ace-trainer', size: 3, win: [$(400), rp(2)] }))),
      ch('Leave', leave()),
    ]),
  ev('moot-court-showdown', 'Moot Court Showdown', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.gentleman'], tint: '#2a2a2a' },
    'Two trainers argue a case. "Out-argue me, then we enforce the verdict in battle."', [
      ch('Argue your case', fight('The judge sides with you. "You choose who moves first."', duel('Opposing Counsel', { cls: 'ace-trainer', size: 3, win: [$(600), rp(3)] }), first('Won the debate: you strike first')), { check: 'intelligence', fail: fight('The judge rules against you. "Battle it out."', duel('Opposing Counsel', { cls: 'ace-trainer', size: 3, win: [$(400), rp(2)] })) }),
      ch('Plead no contest', leave()),
    ]),
  ev('twin-trainers', 'Trainer Pair of Twins', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.fairy_tale_girl'], tint: '#2a2030' },
    'Two twins finish each other\'s sentences. "We fight as one!"', [
      ch('Fight the twins', fight('They stand shoulder to shoulder, one big wall of Pokémon.', duel('The Twins', { cls: 'ace-trainer', size: 1, lv: 5, win: [$(700), rp(3)] }))),
      ch('Say goodbye to both', leave()),
    ]),
  ev('veterans-vengeance', "Veteran's Vengeance", G, { stop: 'event', rarity: 'rare', minStage: 3, cast: ['trainer.sailor'], tint: '#2e1a1a' },
    'A scarred trainer blocks the road. "I remember a run that fell short. I have trained since."', [
      ch('Fight them again', fight('Their team is a shadow of an old run, only stronger.', duel('Returning Veteran', { cls: 'veteran', size: 4, lv: 2, win: [$(1200), any(...HELD), rp(5)] }, undefined, { retired: true }))),
      ch('Decline', leave()),
    ]),
  ev('underdog-union', 'Underdog Union', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.youngster_m'], tint: '#222a2a' },
    'A club of weak-looking trainers grins. "Every one of us carries a rare held item. Underestimate us!"', [
      ch('Take on the union', fight('They look small. Their items are not.', duel('Underdog Union', { cls: 'youngster', size: 4, lv: -3, win: [any(...HELD), $(400), rp(3)] }))),
      ch('Walk on', leave()),
    ]),
  ev('charity-match', 'Charity Match', G, { stop: 'event', rarity: 'common', cast: ['trainer.gentleman'], tint: '#1f2e24' },
    'A banner reads: ALL PRIZES GO TO THE TOWN FUND. A friendly trainer waves you over.', [
      ch('Fight for charity', fight('The crowd cheers. The prize money goes to the town.', duel('Charity Trainer', { cls: 'ace-trainer', size: 2, win: [flag('charity', 1), good(2), rp(4)] }))),
      ch('Keep walking', leave()),
    ]),
  ev('camp-counselor-contest', 'Camp Counselor Contest', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.hiker'], tint: '#233023' },
    '"Three-legged battle! You get a partner you did not pick."', [
      ch('Pair up', fight('A camper\'s Pokémon joins you for this fight.', duel('Camp Counselors', { cls: 'hiker', size: 2, ally: 'pikachu', win: [$(450), rp(3)] }))),
      ch('Sit this one out', leave()),
    ]),
  ev('chefs-cook-off-battle', "Chef's Cook-Off Battle", G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.worker_m'], tint: '#2e2418' },
    'A chef flips a pan. "Beat me and my winning meal heals your whole team!"', [
      ch('Take the cook-off', fight('Steam rises over the arena.', duel('Battle Chef', { cls: 'worker', size: 3, win: [heal(1), rp(3)] })) ),
      ch('Skip the meal', leave()),
    ]),
  ev('time-trial-gate', 'Time Trial Gate', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.worker_m'], tint: '#232a2a' },
    'A gate stays shut until you finish a quiz in 15 seconds. A guard waits behind it.', [
      ch('Race the quiz', fight('The gate swings open and the guard steps out.', duel('Gate Guard', { cls: 'ace-trainer', size: 3, win: [$(700), rp(3)] }), first('Beat the clock: you strike first')), { prompt: { id: 'gauge-hold', needs: 'good' }, fail: out('Time runs out. The gate stays shut and the guard shrugs.') }),
      ch('Skip the gate', leave()),
    ]),
  ev('stage-fright-challenge', 'Stage Fright Challenge', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.guitarist'], tint: '#2a1f33' },
    '"A packed crowd is watching. Everyone is nervous: all Speed drops at the start!"', [
      ch('Step on stage', fight('The crowd roars and nerves bite.', duel('Stage Rival', { cls: 'ace-trainer', size: 3, win: [$(550), rp(3)] }, { stages: { spe: -1 } }))),
      ch('Stay backstage', leave()),
    ]),
];
