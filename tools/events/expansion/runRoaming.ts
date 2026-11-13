// Roaming cast (extended), FE-72 to FE-75 (forced) and EN-104 to EN-111: the roaming teams' beats, expanded.
import { $, ch, flag, foe, fight, heat, leave, out, X, xr, type Json } from './common.ts';
import { good } from '../dsl.ts';

export const ROAMING_EVENTS: Json[] = [
  xr('fe-72', 'Double Booking', true, { rarity: 'rare', cast: ['trainer.roughneck'] }, 'Two different teams have scheduled the same road. The grunts argue over a clipboard. A favor is owed by whoever helps them sort it out.', [
    ch('Settle the dispute', out('One grunt owes you a favor. The other wants it forgotten.', flag('favor-owed'), good(1))),
    ch('Take advantage', fight('You stir it into a three-way fight.', foe('Booking Grunts', 'specialist', [heat(1)], 2))),
    ch('Walk around them', leave()),
  ]),
  xr('fe-73', 'The Machine of the Week', true, { rarity: 'rare', cast: ['trainer.worker_m'] }, 'A new machine rolls into the square and a grunt reads from its manual: "It can do something new every week." Today, it is aimed at you.', [
    ch('Disable it', fight('A technician and the machine\'s first demonstration.', foe('Machine Operator', 'specialist', [flag('machine-disabled'), good(1)]))),
    ch('Study it from a distance', out('You see its one trick and when it uses it.', flag('machine-studied'), { kind: 'research', amount: 4 })),
    ch('Back off', leave()),
  ]),
  xr('fe-74', 'The Mark', true, { rarity: 'rare', cast: ['trainer.roughneck'] }, 'A grunt chalks a small mark on a wall near you and walks off. You are sure it is for you. No fight, nothing to run from; yet.', [
    ch('Rub it out', out('A little smeared chalk on your sleeve. Heat eases.', heat(-1))),
    ch('Copy it and find out what it means', out('A scrawl a few streets on: it is a meeting place.', flag('mark-copied'), { kind: 'research', amount: 3 })),
    ch('Ignore it', leave()),
  ]),
  xr('fe-75', 'The Curtain Call', true, { rarity: 'rare', cast: ['trainer.guitarist'], tint: '#241428' }, 'A theatre troupe, unexpected and loud, finishes a street show with a bow, then looks straight at you. "Final act: audience participation." This is a scene, not a fight.', [
    ch('Join the cast', out('A silly bit with a cardboard sword. The crowd cheers and your party is in a fine mood.', { kind: 'friendship', amount: 3, who: 'party' }, good(1))),
    ch('Take a bow and leave', out('A polite round of applause.', good(1))),
  ]),
  xr('en-104', 'The Postcard Beat', false, { rarity: 'common', cast: ['trainer.aroma_lady'] }, 'A mailman hands you a postcard from someone you met earlier. The picture is of somewhere you have not been yet.', [
    ch('Read it carefully', out('A line of kindness and a line of warning. You smile at both.', good(1), { kind: 'friendship', amount: 1, who: 'party' })),
    ch('Pin it up', out('It will be there when you need it.')),
  ]),
  xr('en-105', 'Truce by Firelight', false, { rarity: 'uncommon', cast: ['trainer.roughneck'], tint: '#2a1810' }, 'A campfire, and two grunts of different teams, side by side, not talking. They wave you over. "Just for tonight."', [
    ch('Sit by the fire', out('Soup, a story, and a promise: one favor, once, any time.', flag('favor-owed'), { kind: 'heal', share: 0.5 })),
    ch('Decline', leave()),
  ]),
  xr('en-106', 'A Favor Called In', false, { req: [X.trioFriendly], rarity: 'uncommon', cast: ['trainer.roughneck'] }, 'The trio, in a delivery van, honks twice. "We said we owed you. We have a thing."', [
    ch('Take their gift', out('A neat box of supplies. Nobody asks where from.', { kind: 'item', id: 'revive' }, { kind: 'item', id: 'full-heal', count: 2 })),
    ch('Ask for information instead', out('A name and a time. You write it down.', flag('trio-info'), { kind: 'research', amount: 4 })),
  ]),
  xr('en-107', 'The Bill', false, { rarity: 'common', cast: ['trainer.roughneck'] }, 'A grunt hands you a bill for "damage to team property," itemised. He looks as embarrassed as you do.', [
    ch('Pay it (₽250)', out('He thanks you and slinks off.', $(-250)), { requires: [{ kind: 'money', atLeast: 250 }] }),
    ch('Frame it and keep it', out('A handsome piece of paperwork.', flag('framed-bill'), heat(1))),
    ch('Tear it up', out('He sighs.', heat(1))),
  ]),
  xr('en-108', 'Wes at the Wall', false, { rarity: 'rare', cast: ['trainer.psychic_m'], tint: '#14182c' }, 'A figure in a long coat sits on a low wall, quietly watching traffic. He nods at you. "Looks like you are going somewhere. Don\'t let them stop you."', [
    ch('Nod back', out('He gives you a small, sincere smile and a Potion.', { kind: 'item', id: 'super-potion' }, flag('wes-met'))),
    ch('Ask who he is', out('"Just someone who got out." That is all he says.', flag('wes-met'))),
  ]),
  xr('en-109', 'Chobin\'s Stall', false, { rarity: 'common', cast: ['trainer.worker_m'] }, 'A tiny stall run by a very serious boy named Chobin. He is drawing sketches of Pokémon, five of them. All are well drawn.', [
    ch('Buy one (₽120)', out('It is a good sketch. Your party approves.', $(-120), { kind: 'friendship', amount: 2, who: 'party' }), { requires: [{ kind: 'money', atLeast: 120 }] }),
    ch('Tell him he is talented', out('He pretends not to care. He cares.', good(1))),
  ]),
  xr('en-110', 'Evidence for the Detective', false, { rarity: 'rare', cast: ['trainer.gentleman'] }, 'A man in a trench coat flashes a badge: Detective Looker, International Police. "I need something concrete to make a seizure legal."', [
    ch('Give him what you have', out('You hand over your notes. He reads them slowly. "That will do."', flag('looker-evidence'), good(3))),
    ch('Ask what he can do for you', out('"Watch your back. That is all I can say."', { kind: 'friendship', amount: 1, who: 'party' })),
    ch('Not now', leave()),
  ]),
  xr('en-111', 'The Wrong Turn', false, { rarity: 'common', cast: ['trainer.hiker'] }, 'You take a wrong turn and end up behind a theatre where an old man is practising his lines to a Pokémon. He pauses. "Oh. Do you want to hear the whole thing?"', [
    ch('Stay for the scene', out('He is very good. A little emotional. Your party is moved.', { kind: 'friendship', amount: 2, who: 'party' })),
    ch('Back out politely', leave()),
  ]),
] as Json[];
