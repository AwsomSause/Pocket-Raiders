// Catalog Overhaul Pack: TRADES.md Part 4, the trade chains. Each step trades up honestly; the player can stop at any step
// and keep what they have ("nobody minds"). The next trader turns up a few nodes on (`laterEvent`).
import { ch, flag, flagIs, item, out, type Json } from '../dsl.ts';
import { mk } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Trades';
const room = (e: Json): Json => ({ group: G, callback: false, ...e, room: true });
const holds = (ids: string[], label: string, count = 1): Json => ({ kind: 'holdsAny', ids, count, label });
const later = (eventId: string, nodes = 3): Json => ({ kind: 'laterEvent', eventId, nodes });
const ROCKS = ['hard-stone', 'rock-gem', 'everstone', 'smooth-rock', 'rare-bone'];
const keep = (who: string): Json => ch('Keep what I have.', out(`"That's alright," ${who} says, and means it. "It's yours to keep."`));

export const EVENTS: Json[] = [
  // ---- 4.1 The Long Chain ----
  {
    id: 'trade-chain-long', name: 'The Long Chain', group: G,
    intro: 'A market stall, a girl standing on a crate to see over it. Market child Bea: "I\'ll trade you this Oran Berry for your shiniest pebble!" She means a Hard Stone, or anything rocky.',
    choices: [
      ch('Trade the pebble.', out('Bea holds it up to the sun, gasps, and gives you the Oran Berry. Then a hug, around the middle, very hard. "Best trade ever."', mk('payItem', { only: ROCKS }), item('oran-berry'), flag('chain-long', 1), later('trade-chain-long-2')), { requires: [holds(ROCKS, 'a Hard Stone or a Rock-type item')] }),
      ch('No pebble today.', out('"Next time!" Bea goes back to polishing her own pebbles.')),
    ],
  },
  room({
    id: 'trade-chain-long-2', name: 'The Long Chain',
    requires: [flagIs('chain-long', 1, 1)],
    intro: 'A hiker sitting on his pack, stomach growling. Hungry hiker Gus: "I\'d swap my compass for a Berry. I mean it. Any Berry. That Oran would do."',
    choices: [
      ch('Trade the Oran Berry.', out('Gus eats it in two bites, sighs, and presses a brass compass into your hand. "Points true. Always has."', mk('payItem', { only: ['oran-berry'] }), flag('chain-compass'), flag('chain-long', 1), later('trade-chain-long-3')), { requires: [holds(['oran-berry'], 'an Oran Berry')] }),
      keep('Gus'),
    ],
  }),
  room({
    id: 'trade-chain-long-3', name: 'The Long Chain',
    requires: [flagIs('chain-long', 2, 2)],
    intro: 'An old sailor squinting at the sky, turning in a slow circle. Lost sailor Brinner: "A compass! I\'ll give you my spare Pokémon for it. I\'ve been lost three days."',
    choices: [
      ch('Trade the compass.', out('Brinner kisses the compass, gets his bearings, and hands you a Wingull. "She\'s a natural flyer. Better than me at finding home."', flag('chain-compass', -1), { kind: 'honestTrade', id: 'chain-wingull', gift: true, gives: { species: 'wingull', nature: 'jolly', quirk: 'loves-rain', marks: ['traded for a compass'], why: 'I\'ve been lost three days. A compass is worth more to me now.', ot: 'Brinner' } }, flag('chain-long', 1), later('trade-chain-long-4')), { requires: [flagIs('chain-compass')] }),
      keep('Brinner'),
    ],
  }),
  room({
    id: 'trade-chain-long-4', name: 'The Long Chain',
    requires: [flagIs('chain-long', 3, 3)],
    intro: 'A man with a feather in his hat and three birds on his arm. Bird-keeper Perry: "That Wingull\'s a natural. I\'ll swap my Swablu\'s egg for it. I\'ll hold the egg for you until you decide."',
    choices: [
      ch('Trade the Wingull.', out('Perry takes the Wingull onto his arm with the others. It fits right in. He shows you the Swablu egg, warm in a nest of feathers. "Yours. I\'ll carry it till the next stop."', { kind: 'tradeAway', want: { label: 'the Wingull', species: ['wingull', 'pelipper'] } }, flag('chain-long', 1), later('trade-chain-long-5'))),
      keep('Perry'),
    ],
  }),
  room({
    id: 'trade-chain-long-5', name: 'The Long Chain',
    requires: [flagIs('chain-long', 4, 4)],
    intro: 'Perry catches you up, the Swablu egg in his hands. Beside him, a woman with dragon scales sewn into her coat. Dragon fancier Ysra: "A Swablu egg! I\'ll give you a Dragon Scale and a story."',
    choices: [
      ch('Trade the egg.', out('Ysra cradles the egg and tells you the story: a Swablu that sang until it grew into a dragon of the clouds. Then a Dragon Scale, cool and heavy, in your palm.', item('dragon-scale'), flag('chain-long', 1), later('trade-chain-long-6'))),
      ch('Keep the egg.', out('Perry hands the egg to you. It is warm, and something inside it shifts. "Good choice too," Ysra says. "Every choice is."', { kind: 'egg', species: ['swablu'] }, flag('chain-long', -4))),
    ],
  }),
  room({
    id: 'trade-chain-long-6', name: 'The Long Chain',
    requires: [flagIs('chain-long', 5, 5)],
    intro: 'An old man in robes by a mountain shrine. Dragon clan elder Ryuen: "A scale freely traded all this way. Pebble, Berry, compass, wing, egg. That is worth a Dratini."',
    choices: [
      ch('Trade the Dragon Scale.', out('Ryuen bows. A Dratini uncoils from his sleeve and looks up at you. "It began with a child\'s pebble. Remember that."', mk('payItem', { only: ['dragon-scale'] }), { kind: 'honestTrade', id: 'chain-dratini', gift: true, askedFirst: true, gives: { species: 'dratini', nature: 'modest', quirk: 'gentle', marks: ['the end of the long chain'], why: 'A scale freely traded all this way is worth a Dratini.', ot: 'Ryuen' } }, flag('chain-long', 1)), { requires: [holds(['dragon-scale'], 'the Dragon Scale')] }),
      keep('Ryuen'),
    ],
  }),
  // ---- 4.2 The Short Chain (a children's chain) ----
  {
    id: 'trade-chain-short', name: 'The Short Chain', group: G,
    intro: 'A boy in a too-big cap with a Bellsprout on his shoulder. Kid Rocco: "Grass beats you! Swap? I want a Fire-type. A real one, level 5 or more."',
    choices: [
      ch('Trade.', out('Rocco whoops and hands over the Bellsprout. "Look after it! It likes being watered at night."', { kind: 'honestTrade', id: 'chain-bellsprout', wants: { label: 'a Fire-type at level 5 or more', species: [], types: ['fire'], minLevel: 5 }, gives: { species: 'bellsprout', nature: 'jolly', marks: ['Rocco\'s Bellsprout'], why: 'Grass beats you! I want a Fire-type.', ot: 'Rocco' } }, later('trade-chain-short-2'))),
      ch('No thanks.', out('"Your loss!" Rocco says, and his Bellsprout waves at you.')),
    ],
  },
  room({
    id: 'trade-chain-short-2', name: 'The Short Chain',
    requires: [flagIs('trade-chain-bellsprout')],
    intro: 'A treehouse, a girl hanging upside down from the ladder. Kid Ivy-May: "Bellsprout for Leafy\'s sister! She\'s a Fomantis. She\'s very fancy."',
    choices: [
      ch('Trade the Bellsprout.', out('Ivy-May climbs down and solemnly swaps. "Leafy will be so happy. Say hello to Bodhi for me, he\'s by the sea."', { kind: 'honestTrade', id: 'chain-fomantis', wants: { label: 'the Bellsprout', species: ['bellsprout', 'weepinbell', 'victreebel'] }, gives: { species: 'fomantis', nature: 'hasty', quirk: 'show-off', marks: ['Leafy\'s sister'], why: 'Bellsprout for Leafy\'s sister!', ot: 'Ivy-May' } }, later('trade-chain-short-3'))),
      keep('Ivy-May'),
    ],
  }),
  room({
    id: 'trade-chain-short-3', name: 'The Short Chain',
    requires: [flagIs('trade-chain-fomantis')],
    intro: 'A lighthouse, a boy waving from the bottom step. Kid Bodhi: "Fomantis has never seen the sea! I\'ll swap my Chinchou. She\'s got a ribbon."',
    choices: [
      ch('Trade the Fomantis.', out('Bodhi shows the Fomantis the sea. It stares for a full minute. Then he hands you the Chinchou, ribbon and all. "All three of us traded. That\'s a chain!"', { kind: 'honestTrade', id: 'chain-chinchou', wants: { label: 'the Fomantis', species: ['fomantis', 'lurantis'] }, gives: { species: 'chinchou', nature: 'calm', quirk: 'sings-at-night', marks: ['wears a ribbon', 'the end of the short chain'], why: 'Fomantis has never seen the sea!', ot: 'Bodhi' } }, flag('short-chain-done'))),
      keep('Bodhi'),
    ],
  }),
];
