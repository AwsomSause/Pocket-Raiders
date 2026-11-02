// Run events B (R51-R103, "Trainer battles and challenges", approved 2026-11-02). Batch 1: the ones that
// the existing trainer-battle effects can express (chains, forced weather, rivals, loaners, bets).
// Built into src/data/eventsRB.json by `npm run data:rb-events` (tools/build-rb-events.ts).
import { $, any, at, BERRIES, ch, ev, fight, flag, flagIs, good, has, heal, HELD, leave, lv, money, out, ptype, rp, SNACKS, TREASURE, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
/** A trainer battle with the Run-events-B extras (forced weather / terrain, healing between chained fights). */
const duel = (name: string, o: Parameters<typeof trainer>[1], extra: { weather?: string; terrain?: string; chainHeal?: number } = {}): Json => ({ ...trainer(name, o), ...extra });

export const RB_EVENTS: Json[] = [
  // R51
  ev('hot-dog-duelists', 'Hot Dog Duelists', G, { stop: 'event', rarity: 'common', cast: ['trainer.worker_m'], tint: '#2b2418' },
    'Two vendors share one hot dog stand and one grudge. "Beat us both and the feast is on the house!"', [
      ch('Take on both vendors', fight('"Order up!" The first vendor sends out their team.', duel('Hot Dog Duelists', { cls: 'worker', size: 2, chain: 2, win: [heal(1), any(...SNACKS), rp(2)] }))),
      ch('Just buy a hot dog', out('It is a very good hot dog.', { kind: 'money', amount: -30 }, heal(0.25))),
      ch('Walk on', leave()),
    ]),
  // R52
  ev('umbrella-squad', 'Umbrella Squad', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.fisherman'], tint: '#1c2630', effect: 'rain' },
    'A line of trainers in matching yellow raincoats blocks the road. "No sun, no wind, just rain. Care to dance?"', [
      ch('Battle in the rain', fight('The sky opens up the moment the first ball is thrown.', duel('Umbrella Squad', { cls: 'fisherman', size: 3, types: ['water'], win: [$(450), any(...BERRIES), rp(3)] }, { weather: 'rain' }))),
      ch('Decline politely', leave()),
    ]),
  // R53
  ev('night-shift-guards', 'Night Shift Guards', G, { stop: 'event', rarity: 'uncommon', requires: [at('night')], cast: ['trainer.worker_m'], tint: '#10101c' },
    'Torch beams sweep the road. "Night shift. Nobody passes without a duel." Their Pokémon see well in the dark.', [
      ch('Duel the guards', fight('The beams snap to you and the guards advance.', duel('Night Shift Guards', { cls: 'veteran', size: 3, types: ['dark'], lv: 1, win: [$(700), any(...HELD), rp(4)] }))),
      ch('Wait for dawn', leave('You camp a while until the guards clock off.')),
    ]),
  // R54
  ev('retired-leader-spar', 'Retired Gym Leader Spar', G, { stop: 'event', rarity: 'rare', minStage: 2, cast: ['trainer.hiker'], tint: '#2a2218' },
    'A retired Gym Leader dusts off an old badge case. "No prize money. But I will teach you everything I still know."', [
      ch('Spar with the veteran', fight('"Show me what you have learned."', duel('Retired Gym Leader', { boss: 'brock', size: 3, win: [lv(2, 'party'), rp(5), good(1)] }))),
      ch('Politely refuse', leave()),
    ]),
  // R63
  ev('double-date-doubles', 'Double Date Doubles', G, { stop: 'event', rarity: 'uncommon', minStage: 2, cast: ['trainer.fairy_tale_girl'], tint: '#2b1f2b', effect: 'hearts' },
    'A stranger waves you over. "Our dinner partners cancelled! Be our doubles team? You can borrow my Pokémon."', [
      ch('Team up and fight', fight('Two couples, two Pokémon each, one very awkward dinner.', duel('Double Date Pair', { cls: 'ace-trainer', size: 2, ally: 'pikachu', win: [$(600), any(...SNACKS), rp(3)] }))),
      ch('Dinner for one', leave()),
    ]),
  // R65
  ev('rookie-hazing', 'Rookie Hazing', G, { stop: 'event', rarity: 'common', cast: ['trainer.youngster_m'], tint: '#2a2a1e' },
    'A gang of Youngsters surrounds you, each holding a Pokéball. "Welcome to the road, rookie! Let us show you how it works."', [
      ch('Take them all on', fight('Six tiny teams in a row. They may be small, but there are a lot of them.', duel('Youngster Gang', { cls: 'youngster', size: 6, lv: -4, win: [$(350), lv(1, 'party'), rp(2)] }))),
      ch('Run for it', leave('You duck between two of them and sprint away.')),
    ]),
  // R66
  ev('speed-dating-trainers', 'Speed-Dating Trainers', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.fairy_tale_girl'], tint: '#2b1f2b', effect: 'hearts' },
    'A bell rings. "Three minutes per table, one Pokémon each. Impress them!"', [
      ch('Go around the tables', fight('The first table, the first match, the first bell.', duel('Speed-Date Trainers', { cls: 'ace-trainer', size: 1, chain: 3, win: [$(500), heal(0.5), rp(3)] }))),
      ch('Stay at the bar', out('You sip lemonade and watch everyone else flirt in lightning rounds.', heal(0.1))),
    ]),
  // R70
  ev('relay-battle', 'Relay Battle', G, { stop: 'event', rarity: 'rare', minStage: 2, cast: ['trainer.black_belt_m'], tint: '#2a2218' },
    'Three trainers stand in a line, each with a baton. "A relay! Beat each of us in turn. You may catch your breath between legs."', [
      ch('Run the relay', fight('The first runner steps up.', duel('Relay Team', { cls: 'black-belt', size: 2, chain: 3, win: [$(900), any(...TREASURE), rp(5)] }, { chainHeal: 0.1 }))),
      ch('Cheer from the sidelines', leave()),
    ]),
  // R71
  ev('boss-rush-mini', 'Boss Rush Mini', G, { stop: 'event', rarity: 'rare', minStage: 2, cast: [], tint: '#241420', effect: 'rattle' },
    'The grass shakes. Three weak but furious wild bosses crowd the path, one after another.', [
      ch('Fight all three', fight('The first one steps out, snarling.', { kind: 'wild', species: [], types: [], levelBonus: 1, shinyMultiplier: 1, chain: 3, win: [$(800), any(...TREASURE), rp(5)] })),
      ch('Slip away', leave()),
    ]),
  // R72
  ev('collectors-test', "Collector's Test", G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.psychic_m'], tint: '#1c2630' },
    'A collector squints at your team. "I only battle people who own a Water-type. If you do, the prize is bigger."', [
      ch('Show your Water-type and battle', fight('"Aha! Exactly what I wanted to see."', duel('The Collector', { cls: 'psychic', size: 3, types: ['water'], win: [$(1000), any(...TREASURE), rp(5)] })), { requires: [ptype('water')] }),
      ch('Battle anyway', fight('"No Water-type? Fine. Smaller prize."', duel('The Collector', { cls: 'psychic', size: 3, types: ['water'], win: [$(400), rp(2)] }))),
      ch('Walk on', leave()),
    ]),
  // R98
  ev('gamblers-gauntlet', "The Gambler's Gauntlet", G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.roughneck'], tint: '#2b2418' },
    'A card sharp slaps the table. "Bet on yourself! The bigger the stake, the bigger the payout."', [
      ch('Bet $200 on yourself', fight('"Easy money," the sharp grins.', duel('Card Sharp', { cls: 'roughneck', size: 2, win: [$(600)] }, {}), { kind: 'money', amount: -200 }), { requires: [money(200)] }),
      ch('Bet $600 on yourself', fight('The sharp whistles. "A real gambler!"', duel('Card Sharp', { cls: 'roughneck', size: 3, lv: 1, win: [$(2200), rp(3)] }), { kind: 'money', amount: -600 }), { requires: [money(600)] }),
      ch('Keep your money', leave()),
    ]),
  // R100
  ev('school-yard-skirmish', 'School Yard Skirmish', G, { stop: 'event', rarity: 'common', cast: ['trainer.youngster_m'], tint: '#2a2a1e' },
    'The bell rings and the school yard swarms with kids holding Pokéballs. "Battle! Battle! Battle!"', [
      ch('Battle the whole class', fight('A wave of kid trainers, tiny levels, big enthusiasm.', duel('School Kids', { cls: 'youngster', size: 6, lv: -5, chain: 2, win: [$(500), lv(1, 'party'), rp(2)] }))),
      ch('Give the kids some candy', out('They cheer and scatter. You feel good.', good(1), { kind: 'money', amount: -50 })),
    ]),
  // R102
  ev('rivals-friend', "Rival's Friend", G, { stop: 'event', rarity: 'uncommon', minStage: 2, cast: [], tint: '#2a1d24' },
    'A stranger steps in front of you. "My friend says you are the one to beat. I want to see for myself."', [
      ch('Accept the challenge', fight('"Do not hold back."', duel('Rival\'s Friend', { cls: 'ace-trainer', size: 3, lv: 1, win: [$(800), any(...HELD), rp(4)] }))),
      ch('Decline', leave()),
    ]),
];
