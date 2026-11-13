// Quiet moments (EN-112 to EN-119): rests with a small choice. General by design: none carries an Expanded flag.
import { ch, flag, leave, out, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

export const QUIET_EVENTS: Json[] = [
  xr('en-112', 'The Dossier Open', false, { rarity: 'common', cast: ['trainer.gentleman'] }, 'A quiet night at a rest stop. You open your notebook to the page that lists everyone you have met since you started.', [
    ch('Read it from the top', out('It is a lot of people. Some you are glad you met.', flag('dossier-read'), { kind: 'friendship', amount: 1, who: 'party' })),
    ch('Add a note', out('A line about someone you do not want to forget.', flag('dossier-noted'))),
  ]),
  xr('en-113', 'A Name Given', false, { rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A kid at the rest stop has a Pokémon who has never had a nickname. The kid asks you to name it.', [
    ch('Give it a name', out('You choose something warm. The kid grins from ear to ear.', good(2))),
    ch('Let the kid pick', out('He names it Bob. Bob it is.', good(1))),
  ]),
  xr('en-114', 'Two Asleep', false, { rarity: 'common', cast: ['trainer.hiker'] }, 'Two of your Pokémon have fallen asleep against each other. The fire is warm.', [
    ch('Let them sleep', out('They wake rested and a little closer.', { kind: 'heal', share: 0.4 }, { kind: 'friendship', amount: 3, who: 'party' })),
    ch('Wake them for the road', leave()),
  ]),
  xr('en-115', 'An Offering', false, { rarity: 'uncommon', cast: ['trainer.psychic_m'] }, 'A memorial wall with shelves of small things: a berry, a feather, a stone. People leave them for Pokémon they miss.', [
    ch('Leave a berry for one you lost', out('You set it down gently. You feel a bit lighter.', { kind: 'loseItem', id: 'oran-berry' }, flag('offering-left'), good(1))),
    ch('Read the notes', out('Each one is a small story.', { kind: 'friendship', amount: 1, who: 'party' })),
  ]),
  xr('en-116', 'The Breather Before', false, { rarity: 'uncommon', cast: ['trainer.aroma_lady'] }, 'The last warm room before something big. The kettle is on; the chairs are soft; nobody here is in a hurry.', [
    ch('Save the evening for tomorrow', out('A slow night, a hot drink, and a good sleep. You will remember it tomorrow.', flag('breather-saved'), { kind: 'heal', share: 0.5 })),
    ch('Move on', leave()),
  ]),
  xr('en-117', 'A Fireside Story', false, { rarity: 'common', cast: ['trainer.hiker'] }, 'A traveller by the fire tells the story of the first time he saw a Pokémon he had only read about.', [
    ch('Listen to the end', out('It is a good story. It is also a little sad.', { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Add one of your own', out('He nods, pleased.', good(1))),
  ]),
  xr('en-118', 'Rain on the Roof', false, { rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A shelter, a tin roof, a fine steady rain. Nobody wants to move.', [
    ch('Wait it out', out('You doze off. The rain stops, and you feel rested.', { kind: 'heal', share: 0.3 })),
    ch('Run for it', leave()),
  ]),
  xr('en-119', 'The Flask Before the Climax', false, { rarity: 'rare', cast: ['trainer.gentleman'], tint: '#14141c' }, 'A traveller offers you a flask. "For the road. For whatever is at the end of it." It is just tea.', [
    ch('Drink it', out('It tastes like a long walk.', { kind: 'heal', share: 0.6 })),
    ch('Save it', out('You tuck it in your bag.', { kind: 'item', id: 'super-potion' })),
  ]),
] as Json[];
