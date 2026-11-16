// Greenneedle, gn.new.30 The Cheer Squad (doc GREENNEEDLE_PLACED_2.md lines 347–382).
// Build: npm run co:build -- greenneedle-new-30   then   npm run co:gn
// A Plusle and a Minun cheer for both sides of a street battle. They follow you for the rest of the stage (core/greenneedle/cheer.ts:
// +5% Attack and +5% Defence every turn, in every battle). At step 19 each tugs your sleeve and you say whose it was.
import { ch, out, type Json } from '../dsl.ts';
import { bond, gev, gn, is, moment, not, say, setTo, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const STREET_TINT = '#c9a45c';
const street = (o: Json = {}): Json => ({ tint: STREET_TINT, tags: ['Story', 'Pokémon', 'Relationship'], effect: 'none', ...o });

const EVENTS: Json[] = [
  gev('gn-new-30-street', 'The Cheer Squad', street({ stop: 'event', rarity: 'uncommon', minStage: 2, requires: [not('cheer-on')] }), say(
    '*A street battle is ending. Two small Pokémon wave pom-poms made of leaves, and they were waving them for both sides.*',
    'A Plusle and a Minun. Plusle shouts for the trainer on the left. Minun shouts, just as loudly, for the trainer on the right. Neither one minds.',
    '*The battle ends. They look around for the next one. Then they see the belt at your hip.*',
  ), [
    ch('Let them come along.', out(say(
      'They fall in beside you before you can answer, one at each knee, pom-poms up.',
      '*From now to the end of the stage, they cheer from the sideline in every battle. Plusle cheers: your Pokémon hits harder. Minun cheers: it stands firmer.*',
      'Between battles, they argue in squeaks about which of them mattered more. Neither one wins.',
    ), gn('stampStage', { key: 'cheer-on' }), setTo('cheer-over', 0))),
  ]),
  gev('gn-new-30-end', 'The Cheer Squad: Whose Was It?', street({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('cheer-on'), not('cheer-over'), { kind: 'gn', test: 'sameStage', key: 'cheer-on' }] }), say(
    '*The road is ending, and so is the stage. Plusle and Minun have stopped arguing. It is worse than the arguing.*',
    'Each, separately, tugs your sleeve. Plusle on the left. Minun on the right. Both are looking at you, very hard, waiting to be told.',
    'You think about every battle. Every cheer. Every time your Pokémon looked back at the sideline and found something there.',
  ), [
    ch('"It was you, Plusle."', out(say(
      'Plusle squeaks so loudly that a Pidgey leaves the tree. Minun goes quiet and looks at its leaves.',
      'Plusle joins you. Minun waves from the road, then turns back toward the next street. It will cheer for someone else, next time. Maybe the rival.',
    ), gn('cheerJoin', { n: 1 }), setTo('cheer-split', 1), bond(1))),
    ch('"It was you, Minun."', out(say(
      'Minun holds its pom-poms to its chest, shaking. Plusle looks at the sky, trying to look like it did not care.',
      'Minun joins you. Plusle waves from the road, and turns back toward the next street. It will cheer for someone else, next time. Maybe the rival.',
    ), gn('cheerJoin', { n: 2 }), setTo('cheer-split', 1), bond(1))),
    ch('"It was both of you."', out(say(
      'They stare at each other. Then they argue about it, at length, in squeaks, all the way up the road.',
      'Both join you. Still arguing. You would not have it any other way.',
    ), gn('cheerJoin', { n: 3 }), setTo('cheer-both', 1), bond(1), moment('A Plusle and a Minun joined, arguing the whole way.', 55))),
    ch('"It only worked because there were two."', out(say(
      'The argument stops. It is the first silence either of them has ever kept. Plusle takes Minun\'s paw, and Minun lets it.',
      'Both join you. They do not argue again for a full day, which, for them, is a world record.',
    ), gn('cheerJoin', { n: 3 }), setTo('cheer-truth', 1), bond(2), moment('"It only worked because there were two." They did not argue for a full day.', 70))),
  ]),
];

export { EVENTS };
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-30-street': {
    gn: 'gn.new.30', shape: 'Chain', earliest: 'A2', home: 2, window: [1, 4], sits: 'optional', tags: ['Companion Story'], level: 'No battles of their own', often: 'run',
    beats: [
      { beat: 'The street battle', event: 'gn-new-30-street', stage: 'S(n)', home: 2, window: [1, 4] },
      { beat: 'The ending (stay to step 19)', event: 'gn-new-30-end', stage: 'S(n)', home: 19, window: [18, 19] },
    ],
    note: 'Chain inside one stage. Fallback step 6, optional. Once per run (the doc says once per run). While they walk with you, in every battle: Plusle +5% Attack, Minun +5% Defence. Both together: Call and Response (core/greenneedle/cheer.ts).',
  },
  'gn-new-30-end': { gn: 'gn.new.30', shape: 'Chain', earliest: 'A2', home: 19, window: [18, 19], sits: 'optional', tags: ['Companion Story'], level: 'No battles of their own', often: 'run', beat: 2, chain: 'gn.new.30' },
};

export const CHAINS: Json[] = [];
