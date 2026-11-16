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

// =====================================================================================================================
// gn.45  THE CHAMPION'S TRAINING SESSION  (step 11, optional, window 9–14; instead of the battle; once per run, from A10, Reputation 3+).
// The region's Champion, off duty (core/greenneedle/champion.ts). The lesson: three of theirs at A−1, each decision explained as it
// happens. The montage: one of yours singled out (+10% to its lowest stat, Bond +1). The exam (optional): six at A+2, no loss cost;
// a win teaches the ace one of four exclusive moves, and at the real Champion battle that Champion opens with it.
// =====================================================================================================================
const FIELD_TINT = '#3f5a3a';
const field = (o: Json = {}): Json => ({ tint: FIELD_TINT, tags: ['Story', 'Trainer'], effect: 'none', ...o });
const afterLesson: Json[] = [gn('lessonEnd'), scene('gn-45-montage')];

const gn45: Json[] = [
  gev('gn-45-field', 'The Champion\'s Training Session', field({ stop: 'event', rarity: 'rare', requires: [is('rep', 3), not('champ-lesson')], remembers: [
    { id: 'plums', when: [is('champ-told-plums')], notice: 'The lesson starts late. {lesson-champion} has been on the phone, sitting in the grass with their back to you. When they hang up, their eyes are wet, and they don\'t explain.' },
  ] }), say(
    '*A training ground with nobody watching. A Pokémon from every poster you\'ve ever seen lies in the grass with its eyes shut.*',
    'Its trainer is in old clothes, boots unlaced. It takes you a moment. It\'s {lesson-champion}. The Champion. Off duty.',
    '**{lesson-champion}:** "You\'re the one they keep mentioning. Sit. No, don\'t sit. Stand there."',
    '"I\'ll show you something, and I\'ll tell you why as I do it. Nobody ever tells you why."',
  ), [
    ch('Stand there.', out('You stand there. The Champion nods, as if that was the first test, and you passed it.', gn('lessonArrive'), scene('gn-45-lesson'))),
  ]),
  rm('gn-45-lesson', 'The Champion\'s Training Session: The Lesson', field({ tags: ['Combat', 'Trainer', 'Story'] }), say(
    'Three of theirs, a little under your level. Not their best. Not their worst. The ones that teach.',
    '**{lesson-champion}:** "I\'ll talk while we fight. Everything I say is true. That\'s the only rule."',
  ), [
    ch('Battle.', fight('The Champion\'s Pokémon walks out like it\'s done this a thousand times. It has.', { ...trainer('The Champion', { cls: 'ace-trainer', size: 3, lv: -1, friendly: true, rule: { gn: 'champlesson' }, win: afterLesson, lose: afterLesson }) })),
  ]),
  rm('gn-45-montage', 'The Champion\'s Training Session: This One', field({ tags: ['Story', 'Recovery'] }), say(
    'The Champion walks along your team, slowly, looking at each of them. They stop.',
    '**{lesson-champion}:** "This one." It\'s your {cast:lesson-pupil}. Not your strongest. Not even close.',
    '"You like it. You don\'t use it. It knows both things."',
    '**Morning.** It does a move, badly. The Champion says nothing, and waits.',
    '**Noon.** It does the move again. The Champion moves its foot an inch with the toe of their boot.',
    '**Dusk.** It does the move. The Champion\'s own ace, watching from the grass, opens one eye.',
  ), [
    ch('Take it back.', out('Your {cast:lesson-pupil} walks back to you differently. Taller, somehow. It keeps glancing back at the Champion.', gn('lessonBonus'), scene('gn-45-exam'))),
  ]),
  rm('gn-45-exam', 'The Champion\'s Training Session: The Exam', field({ remembers: [
    { id: 'rival', when: [gnc('rivalAhead')], notice: '**{lesson-champion}:** "Your friend was here last week. They passed the exam. Don\'t look like that; they needed it more."' },
  ] }), say(
    '**{lesson-champion}:** "That\'s the lesson. There\'s an exam."',
    '"Nobody passes the exam. Do you want the exam?"',
  ), [
    ch('Yes.', out('The Champion whistles once. The Pokémon in the grass gets up. So do five others you hadn\'t seen.', scene('gn-45-final'))),
    ch('Not today.', out('**{lesson-champion}:** "Good answer, too. Most people can\'t say it." They lie back down in the grass. "Go on. I\'m off duty."')),
  ]),
  rm('gn-45-final', 'The Champion\'s Training Session: The Exam', field({ tags: ['Combat', 'Trainer', 'Story'] }), say(
    'Six of theirs, stronger than yours. No explaining now. The Champion doesn\'t say a word.',
    'You\'ve seen them do this on a screen. It\'s different from four metres away.',
  ), [
    ch('Battle.', fight('The Champion\'s face goes still. It\'s the face from the posters.', { ...trainer('The Champion', { cls: 'ace-trainer', size: 6, lv: 2, friendly: true, rule: { gn: 'champexam' },
      win: [gn('lessonTeach'), moment('Passed the Champion\'s exam. Nobody passes the exam.', 85), scene('gn-45-passed')],
      lose: [heal(1), scene('gn-45-failed')] }) })),
  ]),
  rm('gn-45-passed', 'The Champion\'s Training Session: Passed', field({ tags: ['Story'] }), say(
    'The Champion looks at their last Pokémon for a long time. Then at yours. Then at you.',
    'They kneel by your {cast:lesson-ace} and show it something. Slowly, twice. It\'s {cast:lesson-move}.',
    '**{lesson-champion}:** "Not the one you\'d have chosen. The one it would."',
  ), [ch('Leave.', out('"See you at the League," they say. "Officially." They\'re already lying back down in the grass.'))]),
  rm('gn-45-failed', 'The Champion\'s Training Session: Not Yet', field({ tags: ['Story', 'Recovery'] }), say(
    'The Champion heals your team themself, one by one, with their own potions. They take their time with each.',
    '**{lesson-champion}:** "Further than most. Come and find me when it\'s official."',
  ), [ch('Leave.', out('You look back once. They\'re talking to your team\'s Poké Balls, very quietly, the way you\'d talk to someone sleeping.'))]),
];

export const EVENTS: Json[] = [...gn44, ...gn45];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-44-door': {
    gn: 'gn.44', shape: 'Hub', earliest: 'A6', home: 15, window: [13, 18], sits: 'optional', attaches: 'town', tags: ['Tournament Episode'],
    level: 'All scaled to the Pokémon the player enters (same level; the champion one higher)', often: 'region', badge: 'own',
    dressing: { kanto: 'The 1v1 Championship', elsewhere: 'The 1v1 Championship' },
    note: 'Badge: a single star. Once per region. Gideon Tolland and Señora Dolores Vantongeren are always rounds 3 and 6, and remember the last entrant within the run (no memory across runs). Until towns exist it sits on step 15.',
  },
  'gn-45-field': {
    gn: 'gn.45', shape: 'Single', earliest: 'A10', home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', tags: ['Companion Story'],
    level: 'The lesson A−1 (three Pokémon); the exam A+2 (six)', often: 'run', badge: 'own',
    dressing: { kanto: 'The Champion\'s Training Session', elsewhere: 'The Champion\'s Training Session' },
    note: 'Badge: a laurel. Once per run, Reputation 3 or more. Instead of the battle. The Champion is the region\'s own (the cast League Champion once cast). Passing the exam teaches the ace Summit, The Long Game, With You or Seen It; at the real Champion battle that Champion opens with it.',
  },
};

export const CHAINS: Json[] = [];
