// Run events B batch 6 (R73, R79, R95): fights with the contrary, cursed hat and pinch hitter rules.
// Built into src/data/events/trainer-b6.json by `npm run data:rb6-events` (tools/build-rb6-events.ts).
import { $, any, ch, ev, fight, HELD, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule: Json): Json => ({ ...trainer(name, o), rule });

export const RB6_EVENTS: Json[] = [
  ev('the-contrarian', 'The Contrarian', G, { stop: 'event', rarity: 'rare', cast: ['trainer.hex_maniac'], tint: '#241f33' },
    '"Up is down and down is up," says a trainer with a backwards cap. "Every stat change in our fight is inverted."', [
      ch('Fight the Contrarian', fight('Boosts become drops, and drops become boosts.', duel('The Contrarian', { cls: 'psychic', size: 3, win: [$(700), rp(4)] }, { contrary: true }))),
      ch('Leave them to it', leave()),
    ]),
  ev('pinch-hitter', 'Pinch Hitter', G, { stop: 'event', rarity: 'rare', cast: ['trainer.youngster_m'], tint: '#2a2218' },
    '"Bottom of the ninth! Here every Pokémon that goes down gets back up once. Both sides are tough tonight."', [
      ch('Step up to the plate', fight('Your team gets a second wind each.', duel('Pinch Hitter', { cls: 'ace-trainer', size: 3, lv: 1, win: [$(750), any(...HELD), rp(4)] }, { pinchHitter: true }))),
      ch('Stay in the dugout', leave()),
    ]),
  ev('cursed-hat-trainer', 'Trainer with a Cursed Hat', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.hex_maniac'], tint: '#2e1a2e' },
    'A trainer\'s tall hat twitches. "It flips every status condition between our Pokémon, every single turn."', [
      ch('Fight the hat', fight('The hat hums as the battle starts.', duel('Cursed Hat Trainer', { cls: 'psychic', size: 3, win: [$(600), rp(3)] }, { cursedHat: true }))),
      ch('Back away from the hat', leave()),
    ]),
];
