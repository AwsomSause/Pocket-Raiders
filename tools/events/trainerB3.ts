// Run events B batch 3 (R57, R58, R69, R74, R76, R82, R91, R92, R96): trainer fights with their own rules
// (`rule` on the trainer battle: no switching, no attacks, sudden death, turn limits, sleeping foes, reversed lead, start stages).
// Built into src/data/events/trainer-b3.json by `npm run data:rb3-events` (tools/build-rb3-events.ts).
import { $, any, ch, ev, fight, good, HELD, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule: Json, slowWin?: Json[]): Json => ({ ...trainer(name, o), rule, ...(slowWin ? { slowWin } : {}) });

export const RB3_EVENTS: Json[] = [
  ev('backwards-battle', 'Backwards Battle', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.psychic_m'], tint: '#241f33' },
    'A trainer in a back-to-front jacket grins. "We fight backwards today. Your last Pokémon leads."', [
      ch('Fight backwards', fight('"Left is right, last is first!"', duel('Backwards Trainer', { cls: 'ace-trainer', size: 3, win: [$(500), rp(3)] }, { reversed: true }))),
      ch('Walk forwards, away', leave()),
    ]),
  ev('handicap-match', 'Handicap Match', G, { stop: 'event', rarity: 'rare', cast: ['trainer.black_belt_m'], tint: '#2a2218' },
    '"One Pokémon each way: you may not switch, and I get a friend. Win and the prize is doubled."', [
      ch('Take the handicap', fight('"No switching. No excuses."', duel('Handicap Challenger', { cls: 'black-belt', size: 2, win: [$(1000), rp(4)] }, { noSwitch: true }))),
      ch('Decline', leave()),
    ]),
  ev('sudden-death-duel', 'Sudden Death Duel', G, { stop: 'event', rarity: 'rare', cast: ['trainer.sailor'], tint: '#2e1a1a' },
    '"First Pokémon to faint ends it. The winner keeps a held item from the loser."', [
      ch('Accept the duel', fight('A single Poké Ball is thrown. So is yours.', duel('Sudden Death Rival', { cls: 'veteran', size: 1, lv: 2, win: [any(...HELD), rp(3)] }, { suddenDeath: true }))),
      ch('Refuse', leave()),
    ]),
  ev('sleepwalker-brawl', 'Sleepwalker Brawl', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.hex_maniac'], tint: '#1f2233' },
    'A trainer is sleepwalking, and so are their Pokémon. "Strike first, or lose the edge!" they mumble.', [
      ch('Take advantage', fight('Their Pokémon snooze on the spot, and then stir.', duel('Sleepwalker', { cls: 'psychic', size: 3, win: [$(450), rp(2)] }, { foeAsleep: true }))),
      ch('Let them sleep', leave()),
    ]),
  ev('pizza-delivery-duel', 'Pizza Delivery Duel', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.worker_m'], tint: '#2a2518' },
    '"Win in 5 turns or the pizza goes cold and so does the tip!"', [
      ch('Fight fast', fight('The delivery rider checks their watch. "Go!"', duel('Pizza Rider', { cls: 'biker', size: 2, win: [$(700), rp(3)] }, { turnLimit: 5 }, [$(350), rp(1)]))),
      ch('Not hungry', leave()),
    ]),
  ev('bodybuilder-beach', 'Bodybuilder Beach', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.black_belt_m'], tint: '#2e2a14' },
    'Sun, sand and a Pokémon gym on the shore. "Everyone here is pumped. Both sides start with Attack raised!"', [
      ch('Flex and fight', fight('The beach crowd cheers as Attack surges on both sides.', duel('Beach Bodybuilder', { cls: 'black-belt', size: 3, win: [$(550), rp(3)] }, { stages: { atk: 2 } }))),
      ch('Just tan', leave()),
    ]),
  ev('pacifist-challenge', 'Pacifist Challenge', G, { stop: 'event', rarity: 'rare', cast: ['trainer.gentleman'], tint: '#1f2e24' },
    '"Win without striking. Use only status moves and last eight turns without falling."', [
      ch('Take the vow', fight('The monk bows. "Only calm moves count."', duel('Pacifist Monk', { cls: 'ace-trainer', size: 2, win: [any(...HELD), good(1), rp(4)] }, { noAttacks: true, surviveTurns: 8 }))),
      ch('Decline', leave()),
    ]),
  ev('speedrun-trial', 'Speedrun Trial', G, { stop: 'event', rarity: 'rare', cast: ['trainer.biker'], tint: '#232a2a' },
    '"Beat my three Pokémon in 10 turns. A slow win pays half."', [
      ch('Start the clock', fight('A stopwatch clicks.', duel('Speedrun Judge', { cls: 'ace-trainer', size: 3, win: [$(900), rp(4)] }, { turnLimit: 10 }, [$(450), rp(2)]))),
      ch('Skip it', leave()),
    ]),
  ev('honor-duel', 'Honor Duel', G, { stop: 'event', rarity: 'rare', cast: ['trainer.sailor'], tint: '#2e2418' },
    '"An honorable duel: nobody switches out. The victor earns a pride perk."', [
      ch('Fight with honor', fight('Both trainers salute.', duel('Honor Duelist', { cls: 'veteran', size: 2, win: [any(...HELD), good(2), rp(3)] }, { noSwitch: true }))),
      ch('Bow out', leave()),
    ]),
];
