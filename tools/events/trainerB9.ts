// Run events B batch 9 (R56, R83, R99, R104): rooftop timing (turn limit), silent text, spare-the-foe win, mimic foe.
// Built into src/data/events/trainer-b9.json by `npm run data:rb9-events` (tools/build-rb9-events.ts).
import { $, any, ch, ev, fight, good, HELD, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule: Json, slowWin?: Json[]): Json => ({ ...trainer(name, o), rule, ...(slowWin ? { slowWin } : {}) });

export const RB9_EVENTS: Json[] = [
  ev('rooftop-rumble', 'Rooftop Rumble', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.biker'], tint: '#232a30' },
    'A brawl on a windy rooftop. "Knock them off fast and the bonus is yours!"', [
      ch('Rumble!', fight('The wind howls over the edge.', duel('Rooftop Brawler', { cls: 'roughneck', size: 3, win: [$(900), rp(4)] }, { turnLimit: 4 }, [$(450), rp(2)]))),
      ch('Stay on the stairs', leave()),
    ]),
  ev('library-duel-silence', 'Library Duel Silence', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.gentleman'], tint: '#24241f' },
    'A librarian presses a finger to their lips. "Shh. This duel is silent. No battle text."', [
      ch('Duel in silence', fight('Not a word is spoken.', duel('Silent Librarian', { cls: 'psychic', size: 2, win: [$(500), rp(3)] }, { silent: true }))),
      ch('Whisper goodbye', leave()),
    ]),
  ev('eco-ranger-test', 'Eco Ranger Test', G, { stop: 'event', rarity: 'rare', cast: ['trainer.hiker'], tint: '#1f2e24' },
    'A ranger tests you: "Calm wild-hearted Pokémon without a single knockout. Put each one to sleep or wear it down to its last sliver."', [
      ch('Take the ranger test', fight('The ranger nods. "No knockouts, remember."', duel('Eco Ranger', { cls: 'hiker', size: 2, win: [any(...HELD), good(2), rp(5)] }, { spare: true }))),
      ch('Decline', leave()),
    ]),
  ev('mimic-mayhem', 'Mimic Mayhem', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.juggler'], tint: '#2a1f33' },
    'A street mime copies your every move. "Watch me! Whatever you do, my Pokémon does next."', [
      ch('Face the mime', fight('The mime mirrors your stance.', duel('Street Mime', { cls: 'ace-trainer', size: 2, win: [$(600), rp(3)] }, { mimic: true }))),
      ch('Ignore the mime', leave()),
    ]),
];
