// Run events B batch 10 (R62, R78, R84, R94): contest, loaner draft, sky duel, sniper.
// Built into src/data/events/trainer-b10.json by `npm run data:rb10-events` (tools/build-rb10-events.ts).
import { $, any, ch, ev, fight, good, HELD, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule?: Json): Json => ({ ...trainer(name, o), ...(rule ? { rule } : {}) });

export const RB10_EVENTS: Json[] = [
  ev('sky-duel', 'Sky Duel', G, { stop: 'event', rarity: 'rare', cast: ['trainer.sailor'], tint: '#1f2a3a' },
    'A pilot challenges you on a floating platform. "Up here the ground is a long way down. Ground moves will miss."', [
      ch('Duel in the sky', fight('Clouds drift under your feet.', duel('Sky Pilot', { cls: 'ace-trainer', size: 2, win: [$(700), rp(4)] }, { sky: true }))),
      ch('Keep your feet down', leave()),
    ]),
  ev('sniper-ambush', 'Sniper Ambush', G, { stop: 'event', rarity: 'rare', cast: ['trainer.hiker'], tint: '#2a2a1f' },
    'A sharpshooter picks off your weakest partner. "I always aim for the soft spot." A friend lends you a hand.', [
      ch('Fight back together', fight('Two on two, and they are aiming for the weak one.', duel('Sharpshooter', { cls: 'ace-trainer', size: 2, ally: 'machop', win: [$(700), rp(4)] }, { sniper: true }))),
      ch('Run for cover', leave()),
    ]),
  ev('contest-judges-challenge', "Contest Judge's Challenge", G, { stop: 'event', rarity: 'rare', cast: ['trainer.gentleman'], tint: '#33241f' },
    '"Show me style, not just strength. Four different moves and the judges will be impressed." Nobody faints in a contest.', [
      ch('Enter the contest', fight('The judges take their seats.', duel('Contest Judge', { cls: 'psychic', size: 2, win: [any(...HELD), good(2), rp(5)] }, { contest: 4 }))),
      ch('Watch from the crowd', leave()),
    ]),
  ev('dream-team-draft', 'Dream Team Draft', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.juggler'], tint: '#2a1f33' },
    'A scout offers a loaner Pokémon for one fight. "Draft one of three, and show me your dream team."', [
      ...(['pikachu', 'machop', 'gastly'] as const).map((s) =>
        ch(`Draft ${s.charAt(0).toUpperCase()}${s.slice(1)}`, fight(`The scout hands you a loaner ${s}.`, duel('Draft Scout', { cls: 'ace-trainer', size: 2, ally: s, win: [$(600), rp(3)] }))),
      ),
      ch('Pass', leave()),
    ]),
];
