// Named officers (FE-52 to FE-59, forced) and Special Pokémon (EN-70 to EN-79). The Expanded cast met on the road, and the
// teams' special Pokémon met outside battle. Extended Cut events need the Extended climax setting.
import { $, ch, flag, flagIs, foe, fight, heat, leave, out, X, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

const ext = [X.extendedCut];
export const CAST_EVENTS: Json[] = [
  xr('fe-52', 'An Officer With a Name', true, { req: ext, rarity: 'rare', cast: ['trainer.gentleman'] }, 'A woman in a pressed uniform stops you. "I am Officer Hale of the team\'s planning office. I do not usually leave my desk, and I would like to be done quickly."', [
    ch('Hear her out', out('She offers a trade: leave the next shipment alone and she will leave you alone. You do not answer yet.', flag('officer-hale-met'), heat(1))),
    ch('Battle her', fight('A Lieutenant\'s party, no more.', foe('Officer Hale', 'lieutenant', [flag('officer-hale-beaten'), good(2)]))),
    ch('Excuse yourself', leave('"A pity," she says, and means it.')),
  ]),
  xr('fe-53', 'The Familiar Face', true, { req: ext, rarity: 'rare', cast: ['trainer.worker_m'] }, 'A man in a team uniform is not wearing his hat right. You know him from somewhere. He knows you too. "I took this job after the factory closed."', [
    ch('Tell him he does not have to stay', out('He looks at the ground. "Where would I go?" You tell him about the next town, and who is hiring.', flag('whatif-face-turned'), good(3))),
    ch('Battle him', fight('He fights like someone who would rather not.', foe('Familiar Grunt', 'specialist', [flag('whatif-face-beaten'), heat(1)]))),
    ch('Pretend you do not know him', leave()),
  ]),
  xr('fe-54', 'Handler and Hound', true, { req: ext, rarity: 'rare', cast: ['trainer.hiker'] }, 'A Handler walks a big, quiet Pokémon on a short lead. It looks at you, once. "This is a trained line," she says. "Do not make me prove it."', [
    ch('Ask about the Pokémon', out('She tells you more than she meant to: how it is trained and what it will not do. You write it down.', flag('handler-line-learned'), { kind: 'research', amount: 6 })),
    ch('Battle the Handler', fight('The Handler and her Pokémon, announced before the first move.', foe('The Handler', 'lieutenant', [flag('handler-line-learned'), heat(1)]))),
    ch('Back away slowly', leave()),
  ]),
  xr('fe-55', 'The Inside Man Appears', true, { req: ext, rarity: 'rare', cast: ['trainer.roughneck'] }, 'A grunt keeps falling behind his patrol and looking at you. When the others turn a corner he says it fast: "I am on your side. I cannot say more."', [
    ch('Trust him', out('He slips you a note and walks off. It is a time and a door.', flag('insideman-met'), flag('insideman-note'))),
    ch('Test him with a battle', fight('He loses on purpose. You are not sure whether that is better or worse.', foe('Inside Man', 'grunt', [flag('insideman-met')]))),
    ch('Do not trust anyone in that uniform', leave()),
  ]),
  xr('fe-56', 'The Inside Man Warns', true, { req: [...ext, flagIs('insideman-met')], rarity: 'rare', cast: ['trainer.roughneck'] }, 'The Inside Man catches your sleeve. "Tonight the Collectors are out in force. Do not go by the main road."', [
    ch('Take the back way', out('You avoid a patrol and an awkward conversation.', heat(-2), flag('insideman-warned'))),
    ch('Go by the main road anyway', fight('The patrol is waiting, exactly as he said.', foe('Night Patrol', 'specialist', [heat(1)], 2))),
  ]),
  xr('fe-57', 'The Inside Man Is Caught', true, { req: [...ext, flagIs('insideman-met')], rarity: 'rare', cast: ['trainer.roughneck'] }, 'Two lieutenants are walking your Inside Man down an alley, hands on his shoulders.', [
    ch('Step in', fight('You get him free, and a promise to keep quiet.', foe('Escort Lieutenant', 'lieutenant', [flag('insideman-saved'), good(3)]))),
    ch('Create a distraction (₽400)', out('A dropped crate of balls. He runs. You pay for the crate.', $(-400), flag('insideman-saved')), { requires: [{ kind: 'money', atLeast: 400 }] }),
    ch('Look away', out('You hear nothing more from him.', flag('insideman-lost'))),
  ]),
  xr('fe-58', 'The Runner', true, { req: ext, rarity: 'rare', cast: ['trainer.youngster_m'] }, 'A kid runs past with a satchel and does not stop. He drops one thing as he turns the corner: an envelope with no name. Nothing chases him. Nothing needs to.', [
    ch('Pick it up', out('A hand-drawn map. One building is circled twice.', flag('runner-map'), { kind: 'research', amount: 4 })),
    ch('Leave it where it fell', leave()),
  ]),
  xr('fe-59', 'The Honor Guard', true, { req: ext, rarity: 'rare', cast: ['trainer.black_belt_m'] }, 'Four black-clad guards stand in a square outside a district gate. They salute you, crisply. "Orders are orders."', [
    ch('Battle them', fight('A tough fight; one district is easier to hold if you win.', foe('Honor Guard', 'lieutenant', [flag('district-held'), good(2)], 2))),
    ch('Talk them down', out('One of them lowers his hand. The gate stays open for you.', flag('district-held'), heat(1)), { requires: [{ kind: 'attribute', key: 'charisma', atLeast: 20 }] }),
    ch('Go around', leave()),
  ]),
  // Special Pokémon
  xr('en-70', 'A Tag Removed', false, { rarity: 'uncommon', cast: ['trainer.aroma_lady'] }, 'A Pokémon wears a black tag on its ear, plainly. A volunteer with a pair of snips is working her way along a fence of cages.', [
    ch('Help her', out('One tag comes off; the Pokémon walks out of the cage and does not look back.', good(3), flag('tag-removed'), { kind: 'friendship', amount: 3, who: 'party' })),
    ch('Read the tag instead', out('A line number and a lot code. You write them down.', flag('tag-read'), { kind: 'research', amount: 4 })),
    ch('Leave it', leave()),
  ]),
  xr('en-71', 'A Trait Overheard', false, { rarity: 'common', cast: ['trainer.roughneck'] }, 'Two grunts argue about whose Pokémon is the better "line". One brags about its signature trait and how nothing can stop it.', [
    ch('Listen carefully', out('You catch the trait and its one weakness.', flag('trait-overheard'), { kind: 'research', amount: 5 })),
    ch('Interrupt with a challenge', fight('They both turn on you.', foe('Bragging Grunt', 'grunt', [flag('trait-overheard'), heat(1)], 2))),
    ch('Walk on', leave()),
  ]),
  xr('en-72', 'One Left Behind', false, { rarity: 'uncommon', cast: ['trainer.hiker'] }, 'A hideout has been cleared in a hurry. One Pokémon is still in the corner, tagged, shivering, unclaimed.', [
    ch('Take it with you', out('It joins you for the road. It is wary, but it follows.', { kind: 'join', shadow: false, species: [], types: [], levelBonus: -2, shinyMultiplier: 1 }, good(2))),
    ch('Wait for its trainer', out('Nobody comes. You leave water and a note.', good(1))),
    ch('Leave it', leave()),
  ]),
  xr('en-73', 'One Returned', false, { rarity: 'uncommon', cast: ['trainer.aroma_lady'] }, 'A grunt in civilian clothes stands outside a Center holding a ball in both hands. "I took this from a trainer. It never worked right for me. Do you know whose it is?"', [
    ch('Take it and find the owner', out('You carry it to the next town. A girl is waiting. She cries.', good(3), { kind: 'friendship', amount: 3, who: 'party' })),
    ch('Tell him to hand it in himself', out('He nods. He goes in.', good(1))),
  ]),
  xr('en-74', 'A Signature, Seen', false, { rarity: 'uncommon', cast: ['trainer.psychic_m'] }, 'On a rooftop across the street, a Pokémon you do not know practises one move, over and over. The glow before it hits is unmistakable.', [
    ch('Watch from cover', out('You learn the glow and the warning that comes before it.', flag('signature-seen'), { kind: 'research', amount: 5 })),
    ch('Walk on', leave()),
  ]),
  xr('en-75', 'The Stolen Egg', false, { rarity: 'rare', cast: ['trainer.roughneck'] }, 'A grunt is carrying a warm egg wrapped in a jacket. He sees you and runs.', [
    ch('Give chase', fight('He trips on a root and the egg rolls free.', foe('Egg Thief', 'grunt', [{ kind: 'egg', species: [], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' }, good(2)]))),
    ch('Let him go', leave()),
  ]),
  xr('en-76', 'Training Yard', false, { rarity: 'common', cast: ['trainer.black_belt_m'] }, 'A fenced yard where recruits train their Pokémon. A drill sergeant waves you in. "Free spar, no tricks. Nobody keeps score."', [
    ch('Spar for the fun of it', out('A hard hour. Your lead comes away sharper.', { kind: 'levels', amount: 1, who: 'lead' })),
    ch('Watch from the fence', out('You pick up a trick or two.', { kind: 'research', amount: 3 })),
    ch('Not today', leave()),
  ]),
  xr('en-77', 'A Name on a Crate', false, { rarity: 'common', cast: ['trainer.worker_m'] }, 'A stack of crates, each stencilled with a name and a number. One of the names is the same as a Pokémon you once lost.', [
    ch('Look closer', out('The number matches an entry in a ledger you have heard about.', flag('crate-name-found'), { kind: 'research', amount: 4 })),
    ch('Walk on', leave()),
  ]),
  xr('en-78', 'The Grateful One', false, { rarity: 'uncommon', cast: ['trainer.hiker'] }, 'A Pokémon you helped earlier turns up on a ledge, a little thinner and a little braver. It brings you something it found.', [
    ch('Accept the gift', out('A berry and a long look. It stays near for a while.', { kind: 'item', id: 'sitrus-berry' }, { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Thank it and let it go', out('It trots off, satisfied.', good(1))),
  ]),
  xr('en-79', 'The Signature Move, Rehearsed', false, { req: ext, rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#18121c' }, 'From a roof you watch the finale\'s own Apex rehearse its signature move, with an engineer calling the warning line. You can read both from here.', [
    ch('Memorise the warning line', out('You now know what it says, and what it means.', flag('apex-warning-learned'), { kind: 'research', amount: 6 })),
    ch('Mark one part of the move', out('You note the part that matters most: it is where the engineer\'s eyes go.', flag('apex-part-marked'))),
  ]),
] as Json[];
