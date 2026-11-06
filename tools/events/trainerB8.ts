// Run events B batch 8 (R59): the hidden-foe rule (silhouette and ??? until the foe moves; display only).
// Built into src/data/events/trainer-b8.json by `npm run data:rb8-events` (tools/build-rb8-events.ts).
import { $, ch, ev, fight, leave, rp, trainer, type Json } from './dsl.ts';

const G = 'Trainer Challenges';
const duel = (name: string, o: Parameters<typeof trainer>[1], rule: Json): Json => ({ ...trainer(name, o), rule });

export const RB8_EVENTS: Json[] = [
  ev('blindfold-bout', 'Blindfold Bout', G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.hex_maniac'], tint: '#1a1a1a' },
    '"Fight blind! You will not see my team until each Pokémon moves."', [
      ch('Put on the blindfold', fight('The lights drop. Only silhouettes remain.', duel('Blindfold Master', { cls: 'psychic', size: 3, win: [$(650), rp(3)] }, { hiddenFoe: true }))),
      ch('Keep your eyes open and walk on', leave()),
    ]),
  ev('magicians-misdirection', "Magician's Misdirection", G, { stop: 'event', rarity: 'uncommon', cast: ['trainer.juggler'], tint: '#2a1f33' },
    'A magician twirls a cape. "Watch my hands! My Pokémon is never what it seems."', [
      ch('Watch the magician', fight('The announcer calls out the wrong name.', duel('Stage Magician', { cls: 'psychic', size: 3, win: [$(650), rp(3)] }, { decoyFoe: 'magikarp' }))),
      ch('Applaud and leave', leave()),
    ]),
];
