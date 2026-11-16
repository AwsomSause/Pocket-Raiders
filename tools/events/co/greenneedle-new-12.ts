// Greenneedle gn.new.12: The Cartographer (doc GREENNEEDLE_PLACED_1.md lines 450–478).
// Build: npm run co:build -- greenneedle-new-12   then   npm run co:gn
import { ch, join, out, scout, type Json } from '../dsl.ts';
import { chIf, gev, gn, is, moment, not, rm, say, scene, setTo, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const ROCK = { tint: '#6b5a3d', effect: 'glint', tags: ['Mystery', 'Story'], cast: ['trainer.psychic_m'] };
const gnc = (test: string): Json => ({ kind: 'gn', test });

export const EVENTS: Json[] = [
  gev('gn-new-12-xatu', 'The Cartographer', { ...ROCK, stop: 'event', rarity: 'rare', requires: [not('xatu-met')], remembers: [
    { id: 'again', when: [is('xatu-changed')], notice: 'The stones around the rock have been moved. Whoever moved them left the one on top of the biggest map crooked, on purpose.' },
  ] }, say(
    '*A Xatu on a rock, staring at the sun without blinking. Around it, under stones, a hundred hand-drawn maps. Some are very old.*',
    'One lies open at its feet. It is of this stage. It is finished: every step, every lane, including the ones ahead.',
    'The Xatu turns its head all the way round. It looks at you. It has been waiting a long time.',
    '**The Xatu, in your head:** "Look. Then listen. That is the price."',
  ), [
    ch('Look and listen.', out(
      'You kneel by the map. Every step, every lane, laid out clear. Then the Xatu\'s eyes fill with sun, and yours do too.',
      setTo('xatu-met', 1), scout(20), gn('xatuDraw'),
      moment('The Cartographer showed you the whole map, and one thing that will happen.', 70),
      scene('gn-new-12-image'),
    )),
    ch('Look, and refuse to listen.', out(
      'You look at the map. Every lane, every step. You put your hands over your ears, and the Xatu watches you do it. After ten slow seconds the lines blur, and the paper is only paper. The Xatu goes back to the sun.',
      setTo('xatu-met', 1), scout(20),
    )),
    ch('Leave.', out('You leave the maps under their stones. Behind you, the Xatu turns to watch you go, all the way round.')),
  ]),
  // The image itself (opened after the draw, so the text reads the new flags).
  rm('gn-new-12-image', 'The Cartographer: The Image', ROCK, say(
    '*One image, bright as a coin, pressed behind your eyes. The Xatu holds it there until you have it by heart.*',
    '{xatu:image}',
    '**The Xatu, in your head:** "That will happen. I do not say *might*. Do not ask me how. Do not ask me when."',
  ), [ch('Bow.', out('You bow. The Xatu turns back to the sun, satisfied, or at least finished. The image stays with you, like a stone in a boot.'))]),
  // Afterstory 1: Communion changed the image. The Xatu is furious, and impressed.
  gev('gn-new-12-furious', 'The Cartographer: A Moved Stone', { ...ROCK, stop: 'event', rarity: 'rare', callback: true, requires: [is('xatu-prophecy'), gnc('communion'), not('xatu-changed')] },
    say(
      '*The same Xatu, on the same kind of rock, and it is not staring at the sun. It is staring at you.*',
      'Its feathers are up. Something with a name older than the maps has answered you, and the image it drew is no longer true.',
      '**The Xatu, in your head:** "Who did you ask? No. Do not tell me. I can *see* who you asked."',
    ), [
      ch('Show it the Blessing.', out(
        'The Xatu looks at the Blessing for a long moment. It is furious. Under the fury, something like a bow. It draws the map again, slowly, and shows you the new image. It will not say it is sorry.',
        gn('xatuRedraw'), scene('gn-new-12-image'),
        moment('The Cartographer was furious. Then it drew the image again.', 70),
      )),
      ch('Apologise.', out('The Xatu stares. "Do not apologise," it says. "Make it *true*." It turns back to the sun. The stone is still crooked.')),
    ]),
  // Afterstory 2: the prophecy came true. A Natu waits at the final rest.
  gev('gn-new-12-natu', 'The Cartographer: The Last Rest', { ...ROCK, stop: 'event', rarity: 'rare', callback: true, requires: [gnc('prophecyTrue'), gnc('finalRest'), not('xatu-natu')] },
    say(
      '*At the last rest, a small Natu sits on the step, very still, looking at where the sun is not.*',
      'It has a rolled map in its beak, tied with a thread. It is not a hundred years old. It is yours.',
      'The map has one line on it. It is the line you walked.',
    ), [
      chIf([], 'Take the Natu.', out('It hops into your arms like it has done this before. The line on the map was the one the Xatu showed you, and you walked it.', join({ species: ['natu'], lv: 0 }), setTo('xatu-natu', 1), moment('The prophecy came true. A Natu waited at the last rest.', 80))),
    ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-12-xatu': {
    gn: 'gn.new.12', shape: 'Single', earliest: 'A4', home: 6, window: [2, 11], sits: 'side-branch', attaches: 'instead', tags: ['Story'], needs: ['high'], level: 'No battles', often: 'run', badge: 'own',
    dressing: { kanto: 'The Cartographer', elsewhere: 'The Cartographer' },
    note: 'Step 6 side branch (high ground); fallback Step 11 side branch, then Step 2 optional. Once a run. Look and listen: the whole map (20 columns) and one image drawn from the stop\'s seeded roll, which will happen (core/greenneedle/cartographer.ts).',
  },
  'gn-new-12-furious': { gn: 'gn.new.12', shape: 'Single', earliest: 'A5', home: 6, window: [2, 11], sits: 'side-branch', attaches: 'after', tags: ['Story'], needs: ['high'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: only when the run\'s Legendary Blessing has reached Communion. The image is drawn again.' },
  'gn-new-12-natu': { gn: 'gn.new.12', shape: 'Single', earliest: 'A5', home: 4, window: [1, 8], stages: [8], sits: 'optional', attaches: 'rest', tags: ['Story'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: at the final rest of the run, when the image came true.' },
};

export const CHAINS: Json[] = [];
