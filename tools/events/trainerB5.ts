// Run events B batch 5 (R60, R85): fights using the weather cycle rule and a forced sandstorm.
// Built into src/data/events/trainer-b5.json by `npm run data:rb5-events` (tools/build-rb5-events.ts).
import { $, ch, ev, fight, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
export const RB5_EVENTS: Json[] = [
  ev('weather-rival', 'Weather Rival', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.sailor'], tint: '#233040' },
    'A trainer with a barometer on their hat grins. "The sky changes every turn. Adapt or get soaked!"', [
      ch('Battle the changing sky', fight('Rain, sun, hail: the weather turns with every move.', { ...trainer('Weather Rival', { cls: 'ace-trainer', size: 3, win: [$(600), rp(3)] }), rule: { weatherCycle: ['rain', 'sun', 'hail'] } })),
      ch('Wait for a clear day', leave()),
    ]),
  ev('underground-duel', 'Underground Duel', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.hiker'], tint: '#2a2218' },
    'A trainer waits in a dusty tunnel. "Down here the sand never settles."', [
      ch('Duel underground', fight('Grit swirls through the tunnel.', { ...trainer('Tunnel Trainer', { cls: 'hiker', size: 3, win: [$(550), rp(3)] }), weather: 'sand' })),
      ch('Back out of the tunnel', leave()),
    ]),
];
