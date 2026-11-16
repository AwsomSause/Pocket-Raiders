// Greenneedle gn.new.07 The Shedinja Question (doc GREENNEEDLE_PLACED_1.md lines 270–302).
// Build: npm run co:build -- greenneedle-new-07   then   npm run co:gn
import { ch, out, type Json } from '../dsl.ts';
import { chIf, exactly, gev, gn, laterStage, not, is, rm, say, scene, setTo, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#8a8f7a';
const shed = (o: Json = {}): Json => ({ tint: TINT, pokemon: 'shedinja', tags: ['Pokémon', 'Story'], effect: 'float', ...o });
const rest = (answer: string): Json => gn('shedRest', { key: answer });
const ENDINGS: Json[] = [
  when('shed-end', { min: 1, max: 1 }, [], '*It settles into the party as if it had always been there. Nobody asks it what it is. It seems to like that.*'),
  when('shed-end', { min: 2, max: 2 }, [], '*One morning the light is only light. The shell is not at the edge of it. The grass where it hovered is pressed flat, and slowly, it stands up again.*'),
];
/** Each rest: another stage, a later stamp, and the waiting is over only when the Ninjask is. */
const RESTING: Json[] = [not('shed-end'), is('shed-begun'), laterStage('shed-stage'), not('shed-hold')];

export const EVENTS: Json[] = [
  gev('gn-n07-open', 'The Shedinja Question', shed({ stop: 'event', rarity: 'rare', requires: [not('shed-begun')] }), say(
    'In the grass ahead, a wild Nincada splits its back, climbs out as a Ninjask, and buzzes away over the trees.',
    'Its shell stays where it was. Hollow, light, perfectly still. Then the shell gets up.',
    '*It turns. Nothing else is here. It follows the player because the player is something.*',
  ), [
    ch('Let it follow.', out('It floats a little behind you, close enough that you can hear nothing at all. You walk on, and it comes, and neither of you says why.', setTo('shed-begun', 1), setTo('shed-rests', 0), stampStage('shed-stage'))),
  ]),
  gev('gn-n07-rest', 'The Shedinja Question: The Rest', shed({ stop: 'rest', rarity: 'rare', callback: true, minStage: 2, requires: RESTING, remembers: [
    { id: 'again', when: [is('shed-rests')], notice: '*It is waiting at the edge of the light, exactly where it hovered last time. It hasn\'t forgotten the question.*' },
  ] }), say(
    'The fire is low. The shell drifts in from the dark, and hovers in front of one of the party. And holds still.',
    '*It\'s waiting to be told what it is.*',
  ), [
    ch('Let one of them answer.', out('You look at your team. One of them lifts its head.', rest('mon'), stampStage('shed-stage'), ...ENDINGS)),
    ch('Answer it myself.', out('You sit up. It turns, slowly, to face you.', stampStage('shed-stage'), scene('gn-n07-answer'))),
    ch('Nobody answers.', out('Nobody does. The shell stays a long moment, then drifts back to the edge of the light.', rest('none'), stampStage('shed-stage'), ...ENDINGS)),
    chIf([exactly('shed-rests', 1), not('shed-ninjask')], 'Find the Ninjask.', out('You think of the one that flew. You tell it you will look. The shell turns, towards the dark, and waits.', rest('seek'), stampStage('shed-stage'))),
  ]),
  rm('gn-n07-answer', 'The Shedinja Question: Your Answer', shed(), say(
    'It hasn\'t moved. You are the one it is hovering in front of. The fire pops. The shell does not.',
    'Whatever you say, it will believe.',
  ), [
    ch('"You\'re one of us."', out('Something in the way it hangs changes. It drifts closer, until it is nearly touching your sleeve.', rest('yes'), ...ENDINGS)),
    ch('"You\'re a shell."', out('It is quiet. It stays exactly as it was, because it has no other way to stay.', rest('no'), ...ENDINGS)),
    ch('"I don\'t know either."', out('You say it to the fire, and then to it. It tips towards you, very slightly. Nobody knew anything, and now two of you don\'t.', rest('yes'), ...ENDINGS)),
  ]),
  gev('gn-n07-ninjask', 'The Shedinja Question: The Ninjask', shed({ stop: 'event', rarity: 'rare', callback: true, requires: [is('shed-hold'), not('shed-end'), laterStage('shed-stage')], pokemon: 'ninjask' }), say(
    'A Ninjask hums over the grass, fast, bright, and gone before you can see it properly.',
    '*The Ninjask zips past it twice. Neither knows the other. The Shedinja watches it go, and turns back to the player.*',
  ), [
    ch('Walk on, together.', out('It watches the sky a moment longer. Then it comes back to your side. It chose, in its way.', gn('shedNinjask'), stampStage('shed-stage'))),
  ]),
];
export const REMOVE: string[] = [];

const CHAIN: Placement = { gn: 'gn.new.07', shape: 'Chain', earliest: 'A4', sits: 'optional', attaches: 'rest', needs: ['forest'], tags: ['Miniature Episode', 'Companion Story'], level: 'No battles', often: 'run', badge: 'own' };
const BEATS = [
  { beat: 'Cold open (optional; fallback step 12)', event: 'gn-n07-open', stage: 'S(n)', home: 7, window: [5, 9] as [number, number] },
  { beat: 'Rests 1 to 3', event: 'gn-n07-rest', stage: 'S(n+1) to S(n+3)', home: 10, window: [6, 14] as [number, number] },
  { beat: 'Find the Ninjask (optional)', event: 'gn-n07-ninjask', stage: 'S(next)', home: 12, window: [10, 14] as [number, number] },
];
export const PLACEMENT: Record<string, Placement> = {
  'gn-n07-open': { ...CHAIN, attaches: 'after', beat: 1, chain: 'gn.new.07', beats: BEATS, shape: 'Chain', home: 7, window: [5, 9], note: 'Badge: an empty shell. Fallback: step 12. Once a run (the doc says once per save; no memory across runs). No battles.' },
  'gn-n07-rest': { ...CHAIN, beat: 2, chain: 'gn.new.07', beats: BEATS, home: 10, note: 'The heal (+) node nearest step 10, or step 10 itself, on each of the next three stages. Three acceptances: it joins (more acceptances than silences, after three rests). Three silences: it is gone.' },
  'gn-n07-ninjask': { ...CHAIN, attaches: 'after', beat: 3, chain: 'gn.new.07', beats: BEATS, home: 12, window: [10, 14], note: 'Only after "Find the Ninjask" at the second rest. Step 12 of the next stage; the third rest waits for it.' },
};
export const CHAINS: Json[] = [];
