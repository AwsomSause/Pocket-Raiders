// Run events B batch 7 (R77, R97): fights with the fan club and beginner's luck rules.
// Built into src/data/events/trainer-b7.json by `npm run data:rb7-events` (tools/build-rb7-events.ts).
import { $, ch, ev, fight, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule: Json): Json => ({ ...trainer(name, o), rule });

export const RB7_EVENTS: Json[] = [
  ev('fan-club-tournament', 'Fan Club Tournament', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.guitarist'], tint: '#33201f' },
    'A stadium full of fans chants for whoever just scored a knockout. "Take the crowd, take the match!"', [
      ch('Play to the crowd', fight('The stands erupt before the first move.', duel('Fan Club Champion', { cls: 'ace-trainer', size: 3, win: [$(650), rp(3)] }, { fanClub: true }))),
      ch('Skip the stadium', leave()),
    ]),
  ev('beginners-luck', "Beginner's Luck", G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.youngster_m'], tint: '#2a3320' },
    'A wide-eyed rookie waves. "I have never won a thing, so the universe owes me! My Pokémon crit like crazy, but you heal a little too."', [
      ch('Play along', fight('Luck swings both ways in this one.', duel('Lucky Rookie', { cls: 'youngster', size: 3, win: [$(500), rp(3)] }, { beginnersLuck: true }))),
      ch('Wish them luck and leave', leave()),
    ]),
];
