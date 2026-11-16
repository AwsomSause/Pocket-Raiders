// Greenneedle, part 11: gn.44 The 1v1 Championship (doc GREENNEEDLE_REWORKED_PLACED_10.md).
// Build: npm run co:build -- greenneedle-11   then   npm run co:gn
import { $, ch, fight, heal, out, trainer, type Json } from '../dsl.ts';
import { bond, chIf, gev, gn, is, moment, not, notThisRegion, rm, say, scene, setTo, stampRegion, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.44  THE 1v1 CHAMPIONSHIP  (a tournament at a Town node; until towns exist, step 15, optional; once per region, from A6).
// One Pokémon, picked at the desk. Eight opponents, one Pokémon each, all at its level (core/greenneedle/onevone.ts). 30% healed between
// rounds; a short choice after rounds 2, 4 and 6. Lose once and it's over; prizes so far are kept. Gideon Tolland (round 3) and Señora
// Dolores Vantongeren (round 6) are always there, and remember the last entrant (within the run).
// =====================================================================================================================
const HALL_TINT = '#4a3d6b';
const hall = (o: Json = {}): Json => ({ tint: HALL_TINT, tags: ['Combat', 'Trainer', 'Story'], effect: 'none', ...o });
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const met = (): Json => is('onevone-met');

interface Round { name: string; cls: string; intro: string; text: string; remembers?: Json[] }
const ROUNDS: Round[] = [
  { name: 'Newcomer Pip', cls: 'youngster', intro: say('Round one. A newcomer, shaking so hard their Poké Ball rattles. Their first tournament.', '"I read the rules four times," they tell you. "I still don\'t know where to stand."', 'Their one: {cast:onevone-foe-1}.'), text: 'You show them where to stand. Then you go to yours.' },
  { name: 'Road Trainer Halvard', cls: 'hiker', intro: say('Round two. A trainer off the road, boots still muddy.', '"We\'ve met. On the road, a while back. You won. I\'ve thought about it since." They say it like a fact, not a grudge.', 'Their one: {cast:onevone-foe-2}.'), text: '"Different this time," they say. "I hope."' },
  { name: 'Gideon Tolland', cls: 'worker', intro: say('Round three. A dock worker in a knitted hat, grinning, with a {cast:onevone-foe-3} beside him.', '**Gideon:** "Gideon. Don\'t mind me, I\'m scenery. Fourth round\'s my ceiling. I\'ve made my peace."'), text: 'He shakes your hand, then your Pokémon\'s, very seriously.', remembers: [
    { id: 'belts', when: [gnc('entrantChampion')], notice: 'Your entrant wears the Fighting Tournament\'s belt. Gideon sees it, takes off his hat, and bows.' },
    { id: 'same', when: [met(), is('onevone-same')], notice: '**Gideon:** "The {cast:onevone-entrant} again! Good. I\'ve had a year to think about that {cast:onevone-entrant}. I\'ve thought of nothing. Let\'s see."' },
    { id: 'different', when: [met()], notice: '**Gideon:** "New one this year? Smart. I was going to be *so* ready for the other."' },
  ] },
  { name: 'Specialist Ingrid', cls: 'ace-trainer', intro: say('Round four. A specialist, and the draw isn\'t kind: their {cast:onevone-foe-4} is exactly what your entrant doesn\'t want to see.', 'They look almost apologetic about it. Almost.'), text: 'Your entrant looks at their Pokémon, then at you. You nod. It goes in anyway.' },
  { name: 'Specialist Tobiah', cls: 'ace-trainer', intro: say('Round five. A specialist whose type your entrant beats, on paper. Their {cast:onevone-foe-5}.', '"I know," they say, before you can. "I\'ve planned for it. You\'ll see."'), text: 'They have planned for it. You can see it in how they stand.' },
  { name: 'Señora Dolores Vantongeren', cls: 'veteran', intro: say('Round six. A woman of eighty, very upright, with a {cast:onevone-foe-6} that has been with her for fifty years. She has won this four times.', '**Dolores:** "Sit up straight. Not you. That one. Good. It listens. That\'s half of it."'), text: 'Her Xatu doesn\'t move until she does. She doesn\'t move until she\'s ready.', remembers: [
    { id: 'back', when: [gnc('entrantCameBack')], notice: 'Dolores looks at your entrant for a long time. "That one\'s been somewhere. Hasn\'t it."' },
    { id: 'same', when: [met(), is('onevone-same')], notice: '**Dolores:** "The same one. You came back with the same one. *Good.* Most of them swap, the minute it loses. You don\'t swap a friend."' },
    { id: 'different', when: [met()], notice: '**Dolores:** "A different one. Hm. And what did the last one think about that?"' },
  ] },
  { name: 'Finalist Corwin', cls: 'ace-trainer', intro: say('Round seven. Last year\'s finalist, with a {cast:onevone-foe-7}. He isn\'t looking at you at all. He\'s looking past you, at the champion\'s chair.', '"Nothing personal," he says. "You\'re in my way, that\'s all."'), text: 'He bows to the chair before he bows to you.' },
  { name: 'The Reigning Champion', cls: 'ace-trainer', intro: say('The final. The reigning champion, {onevone-champion}, comes down from the chair, with one Pokémon, a {cast:onevone-foe-8}, a little stronger than yours. It holds something that fits it.', '"Eight," she says. "You\'ve earned the eighth. Not many do."'), text: 'The hall goes quiet. One Pokémon each. It was always going to come to this.', remembers: [
    { id: 'again', when: [met(), is('onevone-same')], notice: '**The champion:** "They said you\'d bring it again. Dolores said. She said you\'re the kind that does."' },
  ] },
];
const PRIZE = [500, 800, 1100];

function roundRoom(i: number): Json {
  const r = ROUNDS[i - 1]!;
  const next = i === 2 || i === 4 || i === 6 ? scene(`gn-44-break-${i}`) : scene(`gn-44-round-${i + 1}`);
  const win: Json[] = i < 8
    ? [i <= 3 ? $(PRIZE[i - 1]!) : gn('onevonePrize'), heal(0.3), next]
    : [gn('check', { key: 'onevone-belts', if: [gnc('entrantChampion')] }), gn('onevoneChampion'), gn('onevoneEnd', { n: 8 }), gn('unbench'), moment('Won the 1v1 Championship. One Pokémon, eight opponents.', 80), scene('gn-44-champion')];
  return rm(`gn-44-round-${i}`, `The 1v1 Championship: Round ${i}`, hall({ remembers: r.remembers ?? [] }), r.intro, [
    ch('Battle.', fight(r.text, { ...trainer(r.name, { cls: r.cls, size: 1, lv: 0, friendly: true, rule: { gn: 'onevone', slot: i }, win, lose: [gn('onevoneEnd', { n: i - 1 }), gn('unbench'), scene('gn-44-out')] }) })),
  ]);
}
/** After rounds 2, 4 and 6: one short choice. */
const breakRoom = (i: number): Json => rm(`gn-44-break-${i}`, `The 1v1 Championship: After Round ${i}`, hall({ tags: ['Recovery', 'Story'] }), say(
  'A bench in the corridor. Ten minutes before the next round. Your entrant leans on your knee.',
), [
  chIf([not('onevone-talked')], 'Talk to it.', out('You tell it what you saw it do out there. All of it. It listens to every word, and leans harder.', bond(1), setTo('onevone-talked', 1), scene(`gn-44-round-${i + 1}`))),
  ch('Let it rest.', out('It sleeps for nine of the ten minutes. It wakes up ready.', heal(0.1), scene(`gn-44-round-${i + 1}`))),
  ch('Watch the next opponent.', out(`You watch them warm up through the door. A {cast:onevone-foe-${i + 1}}, {held:${i + 1}}.`, scene(`gn-44-round-${i + 1}`))),
]);

const gn44: Json[] = [
  gev('gn-44-door', 'The 1v1 Championship', hall({ stop: 'event', rarity: 'common', requires: [notThisRegion('onevone-at')], remembers: [
    { id: 'gideon', when: [is('onevone-visits', 2, 2)], notice: 'On the board by the door, last year\'s results: *Gideon Tolland, round five.* Underneath, in his handwriting: *I liked my ceiling.*' },
  ] }), say(
    '*A long hall with a single star painted over the door. One ring, eight names on a board, and a desk with a form on it.*',
    '**Desk clerk, Ms. Oluwaseun Brady:** "One name on the form, please. Not yours. Its."',
  ), [
    ch('Go to the desk.', out('The form has one line on it. It is a very long line.', stampRegion('onevone-at'), scene('gn-44-desk'))),
    ch('Walk on.', out('Through the window, someone in a knitted hat is losing in round four, cheerfully.')),
  ]),
  rm('gn-44-desk', 'The 1v1 Championship: The Desk', hall(), say(
    'One Pokémon. You pick it here, and you can\'t change it. Eight opponents, one Pokémon each, all at its level. No items between rounds: a little rest, and that\'s all.',
    'Lose once and it\'s over. Prizes won so far are kept.',
  ), [
    ch('Write its name.', out('Ms. Brady reads it back to you, and then to it. The others go to the bench to watch.', gn('onevoneEnter'), gn('bench'), scene('gn-44-round-1')), { pick: {} }),
    ch('Not today.', out('**Ms. Brady:** "The form will keep."')),
  ]),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(roundRoom),
  ...[2, 4, 6].map(breakRoom),
  rm('gn-44-out', 'The 1v1 Championship: Out', hall(), say(
    'It\'s over. Your entrant sits beside you on the bench, very close, while the next match starts. You keep what you won.',
  ), [ch('Leave.', out('Gideon waves from somewhere. "Next year!" he shouts. He always shouts that.'))]),
  rm('gn-44-champion', 'The 1v1 Championship: Champion', hall({ remembers: [
    { id: 'belts', when: [is('onevone-belts')], notice: 'It wears both belts now. Gideon, in the front row, stands up and bows, and won\'t sit down until it notices.' },
  ] }), say(
    'The board changes. One name at the top, and it isn\'t yours. It\'s its.',
    'Dolores, in the front row, nods once. From her, that is a standing ovation.',
  ), [ch('Leave.', out('Ms. Brady hands you the form back, framed. "For its wall," she says.'))]),
];

export const EVENTS: Json[] = [...gn44];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-44-door': {
    gn: 'gn.44', shape: 'Hub', earliest: 'A6', home: 15, window: [13, 18], sits: 'optional', attaches: 'town', tags: ['Tournament Episode'],
    level: 'All scaled to the Pokémon the player enters (same level; the champion one higher)', often: 'region', badge: 'own',
    dressing: { kanto: 'The 1v1 Championship', elsewhere: 'The 1v1 Championship' },
    note: 'Badge: a single star. Once per region. Gideon Tolland and Señora Dolores Vantongeren are always rounds 3 and 6, and remember the last entrant within the run (no memory across runs). Until towns exist it sits on step 15.',
  },
};

export const CHAINS: Json[] = [];
