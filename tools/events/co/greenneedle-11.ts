// Greenneedle, part 11: gn.44 The 1v1 Championship (doc GREENNEEDLE_REWORKED_PLACED_10.md).
// Build: npm run co:build -- greenneedle-11   then   npm run co:gn
import { $, any, anyType, br, ch, egg, fight, flag, fr, heal, item, join, money, out, scout, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, exactly, gev, gn, is, laterStage, moment, not, notThisRegion, rm, roll, route, say, scene, setTo, stampRegion, stampStage, teach, when, type Placement } from './_gn.ts';
import { evil, foe, rivalTrust } from './_evil-story-kit.ts';

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

// =====================================================================================================================
// gn.46  THE ALL-STAR TOURNAMENT  (a bracket of eight at a Town or Hub node; until towns exist, step 16, optional, window 14–18;
// once per run, from A12, after meeting seven named trainers). Trainers met this run, with upgraded teams and a line about the last
// meeting (core/greenneedle/allstar.ts). Quarter-final: one beaten easily, changed the most. Semi-final: one you lost to, unchanged.
// Final: the strongest rival, their real team. A Rare item for each round won; the trophy and a rare visitor for the champion.
// =====================================================================================================================
const STAR_TINT = '#5b3f1f';
const stars = (o: Json = {}): Json => ({ tint: STAR_TINT, tags: ['Combat', 'Trainer', 'Story'], effect: 'none', ...o });
const RARE_ITEMS = ['life-orb', 'choice-band', 'choice-specs', 'choice-scarf', 'leftovers', 'focus-sash', 'assault-vest', 'expert-belt'];
const allstarOut: Json[] = [scene('gn-46-out')];

const gn46: Json[] = [
  gev('gn-46-door', 'The All-Star Tournament', stars({ stop: 'event', rarity: 'rare', requires: [gnc('allstarReady'), not('allstar-entered')] }), say(
    '*A poster on every wall in town: THE ALL-STAR TOURNAMENT. Under it, eight names. You know seven of them. The eighth is yours.*',
    'Someone has drawn a little star next to your name, in pen. Then another. Then a third.',
  ), [
    ch('Go in.', out('The hall is full. Every face in the stands is one you\'ve met somewhere on the road.', setTo('allstar-entered', 1), gn('allstarDraw'), scene('gn-46-board'))),
    ch('Walk on.', out('You walk on. Behind you, someone reads your name off the poster out loud, sounding disappointed.')),
  ]),
  rm('gn-46-board', 'The All-Star Tournament: The Bracket', stars({ tags: ['Story'] }), say(
    'The bracket, chalked on a board taller than you: {allstar-bracket}, and you. Your rival is on the far side. Of course they are.',
    'Quarter-final first: {allstar:qf}. The crowd is everyone you\'ve met who isn\'t on the board. The ones you helped are at the front, shouting.',
    'The ones you walked past are here too, further back. They came anyway.',
  ), [
    ch('Walk among them.', out('A kid you once helped grabs your sleeve. "{allstar:qf} has a new one. A {cast:allstar-new-qf}. Saw it this morning. Be careful."', scene('gn-46-qf'))),
    ch('Go to the ring.', out('You go straight to the ring. The noise follows you down the aisle like weather.', scene('gn-46-qf'))),
  ]),
  rm('gn-46-qf', 'The All-Star Tournament: Quarter-Final', stars({ remembers: [
    { id: 'damian', when: [is('allstar-damian')], notice: '**Damian:** "ALL-STAR. They said *All-Star.* I\'ve got it on a sash. Tully made the sash."' },
    { id: 'samurai', when: [is('allstar-samurai')], notice: '**The Samurai:** "You named my defeat. I\'ve come to rename it."' },
  ] }), say(
    'The quarter-final. {allstar:qf} is waiting in the ring, and you almost don\'t recognise them. They\'ve changed the most.',
    '**{allstar:qf}:** "{allstar-line:qf}"',
  ), [
    ch('Battle.', fight('The bell. Their first Pokémon is one you\'ve never seen them with.', { ...trainer('All-Star', { cls: 'ace-trainer', size: 6, lv: 1, friendly: true, rule: { gn: 'allstar-qf' },
      win: [any(...RARE_ITEMS), setTo('allstar-round', 1), scene('gn-46-crowd-1')], lose: allstarOut }) })),
  ]),
  rm('gn-46-crowd-1', 'The All-Star Tournament: Between Rounds', stars({ tags: ['Recovery', 'Story'] }), say(
    'Between rounds. The crowd spills into the aisles. People you met for five minutes, months ago, want to shake your hand.',
    'Someone at the back is holding something out to you, and won\'t stop holding it out until you come over.',
  ), [
    ch('Walk among them.', out('A traveller you once shared a fire with presses a held item into your palm. "For the next one. You\'ll need it more than me."', any('quick-claw', 'scope-lens', 'muscle-band', 'wise-glasses', 'shell-bell'), scene('gn-46-sf'))),
    ch('Go to the ring.', out('You wave, and go. They wave back, still holding it out, smiling.', scene('gn-46-sf'))),
  ]),
  rm('gn-46-sf', 'The All-Star Tournament: Semi-Final', stars({ remembers: [
    { id: 'unbeaten', when: [gnc('allstarUnbeaten')], notice: '**{allstar:sf}:** "They couldn\'t find anyone who\'d beaten you. So they sent me. I\'m the one who came closest. I\'d like that recorded."' },
    { id: 'damian', when: [is('allstar-damian')], notice: '**Damian:** "ALL-STAR. They said *All-Star.* I\'ve got it on a sash. Tully made the sash."' },
    { id: 'samurai', when: [is('allstar-samurai')], notice: '**The Samurai:** "You named my defeat. I\'ve come to rename it."' },
  ] }), say(
    'The semi-final. {allstar:sf}. They haven\'t changed at all, and they don\'t think they need to. Looking at them, you\'re not sure they\'re wrong.',
    '**{allstar:sf}:** "{allstar-line:sf}"',
  ), [
    ch('Battle.', fight('Same team. Same stance. Same look in their eye, like they know something you don\'t.', { ...trainer('All-Star', { cls: 'ace-trainer', size: 6, lv: 1, friendly: true, rule: { gn: 'allstar-sf' },
      win: [any(...RARE_ITEMS), setTo('allstar-round', 2), setTo('allstar-respect', 1), moment('Beat the All-Star semi-finalist, who shook your hand and promised to come to the Final Reunion.', 60), scene('gn-46-crowd-2')], lose: allstarOut }) })),
  ]),
  rm('gn-46-crowd-2', 'The All-Star Tournament: Before the Final', stars({ tags: ['Recovery', 'Story'] }), say(
    '{allstar:sf} finds you in the corridor. They don\'t say anything. They just nod, the way you nod at someone you\'ll see again.',
    'Out in the stands, a grandmother you once helped across a river is waving a Berry over her head like a flag.',
  ), [
    ch('Walk among them.', out('She folds your fingers round it. "Eat it before, not during. Before. I know about these things."', any('sitrus-berry', 'lum-berry'), scene('gn-46-final'))),
    ch('Go to the ring.', out('You blow her a kiss from the aisle. She pretends to catch it, and puts it in her pocket.', scene('gn-46-final'))),
  ]),
  rm('gn-46-final', 'The All-Star Tournament: The Final', stars({ remembers: [
    { id: 'threw', when: [is('x-rival-threw-match')], notice: '**{allstar-rival}:** "You threw one for me, once. I never thanked you. I\'m not going to thank you now, either. I\'m going to win."' },
    { id: 'stone', when: [is('rival-memorial-waited')], notice: '**{allstar-rival}:** "You waited with me, on the hill. At the stone. I keep thinking about that. Don\'t let it make you go easy."' },
    { id: 'ahead', when: [gnc('rivalAhead')], notice: '**{allstar-rival}:** "I\'m ahead, you know. Badges, wins, all of it. I\'ve kept count. This is the one that counts, though."' },
  ] }), say(
    'The final. {allstar-rival}, on the far side of the ring, exactly where the bracket said they\'d be.',
    '**{allstar-rival}:** "Everyone you\'ve ever fought is in those stands. And it\'s still us two at the end. It\'s *always* us two."',
  ), [
    chIf([gnc('rivalTrustMax')], 'Shake.', fight('You shake. Their grip is warm, and it holds a second longer than it needs to. Both teams stand a little taller.', { ...trainer('Rival', { rival: true, size: 6, lv: 2, friendly: true, rule: { gn: 'allstar-final' }, win: [gn('allstarChampion'), moment('Won the All-Star Tournament. Every name you met is on the trophy. Yours is last.', 85), scene('gn-46-champion')], lose: [scene('gn-46-runner-up')] }) }, setTo('allstar-shake', 1))),
    chIf([gnc('rivalTrustMax')], 'After.', fight('"After," you say. They grin, and put their hand away. "After, then. Promise."', { ...trainer('Rival', { rival: true, size: 6, lv: 2, friendly: true, rule: { gn: 'allstar-final' }, win: [gn('allstarChampion'), moment('Won the All-Star Tournament. Every name you met is on the trophy. Yours is last.', 85), scene('gn-46-champion')], lose: [scene('gn-46-runner-up')] }) })),
    chIf([gnc('rivalTrustBelow')], 'Battle.', fight('The bell. The whole hall goes silent at once, the way a room does when it knows.', { ...trainer('Rival', { rival: true, size: 6, lv: 2, friendly: true, rule: { gn: 'allstar-final' }, win: [gn('allstarChampion'), moment('Won the All-Star Tournament. Every name you met is on the trophy. Yours is last.', 85), scene('gn-46-champion')], lose: [scene('gn-46-runner-up')] }) })),
  ]),
  rm('gn-46-champion', 'The All-Star Tournament: Champion', stars({ tags: ['Story'] }), say(
    'They hand you the trophy. Every entrant\'s name is engraved on it: {allstar-bracket}. Yours is last. There was only just room.',
    'Later, when the hall is empty and the chairs are stacked, you come back for your coat.',
    'Something is sitting on the trophy. It came to watch. It looks at you as though it has already decided.',
  ), [
    ch('Go to it.', fight('It doesn\'t run. It hops down off the trophy, and waits for you to be ready.', { ...wild({ species: ['@allstar-rare'], lv: 1 }), rule: { catchTimes: 4 } })),
    ch('Leave it be.', out('You take the trophy and leave it there, watching you go. At the door you look back. It\'s still watching.')),
  ]),
  rm('gn-46-runner-up', 'The All-Star Tournament: Runner-Up', stars({ tags: ['Story'] }), say(
    '{allstar-rival} holds the trophy up, and the hall roars. Then they look for you in the crowd, and they don\'t stop looking until they find you.',
    '**{allstar-rival}:** "Us two. Always. Next time it\'s yours."',
  ), [ch('Leave.', out('You keep what you won. On the way out, a dozen people you\'ve met tell you it was close. Some of them mean it.'))]),
  rm('gn-46-out', 'The All-Star Tournament: Out', stars({ tags: ['Story'] }), say(
    'Out. The crowd claps anyway, the people at the front loudest of all.',
    'You keep what you won. You watch the rest from the stands, with people you\'d forgotten you\'d met.',
  ), [ch('Leave.', out('On the way out, someone shouts your name from the back. You never find out who.'))]),
];

// =====================================================================================================================
// gn.47  THE POKÉMON LEAGUE EXHIBITION  (a Town or Hub event; until towns exist, step 15, optional, window 13–17; once per region,
// from A8; each matchup once per run). Watch a famous match from the stands (core/greenneedle/exhibition.ts): back one side on air,
// three moments while it runs, and the winner may reward you, or invite you down (25%, or always after watching closely three times).
// =====================================================================================================================
const EX_TINT = '#2f3f6b';
const ex = (o: Json = {}): Json => ({ tint: EX_TINT, tags: ['Story'], effect: 'none', ...o });
const EX_RARE = ['leftovers', 'expert-belt', 'shell-bell', 'scope-lens', 'quick-claw'];
const EX_EPIC = ['life-orb', 'choice-band', 'choice-specs', 'choice-scarf', 'assault-vest', 'focus-sash'];
/** One of the three moments while the match runs. */
const exMoment = (i: number, next: Json[]): Json[] => [
  ch('Cheer.', out('You cheer, loud enough to hear yourself on the big screen.', gn('exWatch', { n: i, key: 'cheer' }), ...next)),
  ch('Watch closely.', out('You stop watching the Pokémon, and watch the hands.', gn('exWatch', { n: i, key: 'watch' }), ...next)),
  ch('Look at the crowd.', out('You look away from the field, just for a second.', gn('exWatch', { n: i, key: 'crowd' }), ...next)),
];
const exEnd: Json[] = [
  gn('exResult'),
  when('ex-outcome', { min: 1, max: 1 }, [any(...EX_RARE)]),
  when('ex-outcome', { min: 3, max: 3 }, [bond(1), any(...EX_RARE)], 'Your lead stands a little straighter after. Bond +1.'),
  when('ex-outcome', { min: 4, max: 4 }, [], 'They shake your hand, and hold on a moment longer than they need to.'),
  roll('ex-invite', 25),
  when('ex-watched', { min: 3 }, [setTo('ex-invite', 1)]),
  scene('gn-47-after'),
];

const gn47: Json[] = [
  gev('gn-47-door', 'The Pokémon League Exhibition', ex({ stop: 'event', rarity: 'uncommon', requires: [notThisRegion('ex-at'), gnc('exLeft')] }), say(
    '*A stadium lit up like daytime. On every screen, two faces you\'ve seen on posters your whole life.*',
    'Tonight: **{ex:a}** against **{ex:b}**. {ex:what}',
  ), [
    ch('Join the queue.', out('The queue goes round the building twice. Nobody minds. Everyone is talking about the same thing.', stampRegion('ex-at'), gn('exDraw'), scene('gn-47-queue'))),
    ch('Walk on.', out('You walk on. Behind you, the whole stadium roars at once, and you nearly turn round.')),
  ]),
  rm('gn-47-queue', 'The Pokémon League Exhibition: The Queue', ex(), say(
    'Halfway down the queue, a microphone appears under your nose. Behind it, a reporter in a very bright coat.',
    '**Reporter, Marit Achterberg:** "You\'re a trainer! Quick: who\'ve you got, and *why?*"',
  ), [
    ch('{ex:a}.', out('Marit grins. "And why?"', gn('exBack', { n: 1 }), scene('gn-47-why'))),
    ch('{ex:b}.', out('Marit grins. "And why?"', gn('exBack', { n: 2 }), scene('gn-47-why'))),
    ch('"I don\'t mind who wins. I want to see it."', out('Marit laughs. "Diplomatic!" It\'s broadcast. On the big screen inside, both of them hear it.', gn('exBack', { n: 0 }), setTo('ex-reason', 4), scene('gn-47-match-1'))),
  ]),
  rm('gn-47-why', 'The Pokémon League Exhibition: On Air', ex({ remembers: [
    { id: 'again', when: [is('ex-again')], notice: '**Marit:** "Wait. You again. You backed them last time too. You\'re loyal. Or stubborn. Which is it?"' },
  ] }), say(
    'The microphone hovers. Somewhere behind Marit, a camera light goes red. You are, apparently, live.',
  ), [
    ch('"They\'re stronger."', out('"Simple! I like simple." It\'s broadcast. Inside, on the big screen, both of them hear it.', setTo('ex-reason', 1), scene('gn-47-match-1'))),
    ch('"They\'ve got more to prove."', out('"Ooh. Spicy." It\'s broadcast. Inside, on the big screen, both of them hear it.', setTo('ex-reason', 2), scene('gn-47-match-1'))),
    ch('"I like how they treat their Pokémon."', out('Marit lowers the microphone for a second. "That\'s a good reason," she says, off air. Then it\'s back up, and broadcast.', setTo('ex-reason', 3), scene('gn-47-match-1'))),
  ]),
  rm('gn-47-match-1', 'The Pokémon League Exhibition: The Match', ex({ tags: ['Story', 'Combat'], remembers: [
    { id: 'known', when: [gnc('exKnown')], notice: 'Before the first move, one of them scans the stands, row by row. They find you. They nod, just once, and turn back to the field.' },
  ] }), say(
    'Six on six. The stadium goes quiet in the way only a very big room can.',
    '{ex:phase-1}',
  ), exMoment(1, [scene('gn-47-match-2')])),
  rm('gn-47-match-2', 'The Pokémon League Exhibition: The Match', ex({ tags: ['Story', 'Combat'] }), say(
    'Halfway. Both of them are down to three.',
    '{ex:phase-2}',
  ), exMoment(2, [scene('gn-47-match-3')])),
  rm('gn-47-match-3', 'The Pokémon League Exhibition: The Match', ex({ tags: ['Story', 'Combat'] }), say(
    'The last of it. Nobody in the stadium is sitting down any more.',
    '{ex:phase-3}',
  ), exMoment(3, exEnd)),
  rm('gn-47-after', 'The Pokémon League Exhibition: After', ex({ remembers: [
    { id: 'invited', when: [is('ex-invite')], notice: '**{ex:winner}, into the microphone:** "There\'s a trainer in row nine who\'s been watching my hands for ten minutes. Come down. Let\'s see what you saw."' },
  ] }), say(
    'The stadium empties slowly. Nobody wants to be the first to leave a night like that.',
  ), [
    chIf([is('ex-invite')], 'Go down.', fight('Every head in the stadium turns to row nine. You walk down. Your legs are shaking. Your Pokémon\'s aren\'t.', { ...trainer('Exhibition', { cls: 'ace-trainer', size: 3, lv: 2, friendly: true, rule: { gn: 'exhibition' },
      win: [any(...EX_EPIC), setTo('ex-known', 1), moment('Beat the Exhibition\'s winner, three on three, in front of a full stadium. The crowd learned your name.', 75), scene('gn-47-won')],
      lose: [heal(1), scene('gn-47-lost')] }) })),
    chIf([is('ex-invite')], 'Stay in your seat.', out('You shake your head. {ex:winner} laughs into the microphone. "Shy! Next time, row nine."')),
    chIf([not('ex-invite')], 'Leave.', out('Outside, people are still doing the moves with their hands, arguing about the second half.')),
  ]),
  rm('gn-47-won', 'The Pokémon League Exhibition: Row Nine', ex(), say(
    'The stadium says your name. All of it, at once. You didn\'t know it knew your name.',
    '**{ex:winner}:** "You did see it. And you can do it. Come and find me when it\'s official."',
  ), [ch('Leave.', out('Marit is waiting at the exit with the microphone. You walk straight past her, smiling. She lets you.'))]),
  rm('gn-47-lost', 'The Pokémon League Exhibition: Row Nine', ex(), say(
    '{ex:winner} heals your team, there on the field, in front of everyone.',
    '"You did see it. You just can\'t do it yet."',
  ), [ch('Leave.', out('The crowd claps you all the way back up to row nine. You sit down. Your hands are still shaking.'))]),
];

// =====================================================================================================================
// gn.48  THE POKÉMON DRAFT  (a Town or Hub event; until towns exist, step 14, optional, window 12–17; once per region, from A7).
// Your own team on the bench. Six rounds: five lent Pokémon on the table, each with its trainer's card; pick one, the other three
// drafters take the rest, then an n-on-n battle. Then a bracket against the three drafters with only what you drafted. Win, and one
// may go with you, if its trainer agrees, and if it does (Bond 3). Rules in core/greenneedle/draft.ts.
// =====================================================================================================================
const DRAFT_TINT = '#3d4a3a';
const hallD = (o: Json = {}): Json => ({ tint: DRAFT_TINT, tags: ['Combat', 'Trainer', 'Story'], effect: 'none', ...o });
const draftOut: Json[] = [gn('draftEnd'), scene('gn-48-out')];
/** A card picked from the table: then a battle (rounds 1-5), or the bracket (round 6). */
const takeCard = (n: number): Json => ch(`{draft:label:${n}}`, out('You take the Ball. The card goes in your pocket. You read it again anyway.', gn('draftPick', { n }),
  when('draft-round', { min: 6, max: 6 }, [scene('gn-48-bracket-1')]), when('draft-round', { min: 1, max: 5 }, [scene('gn-48-fight')])));
const bracket = (i: number): Json => rm(`gn-48-bracket-${i}`, `The Pokémon Draft: Bracket, Round ${i}`, hallD(i === 3 ? { remembers: [
  { id: 'aldhelm', when: [is('draft-misused', 0, 0)], notice: '**Brother Aldhelm:** "I took what everyone passed on. I\'ve been watching why they passed. You\'ve been reading the cards. I\'ve been reading you."' },
] } : {}), say(
  i === 1 ? 'The bracket. Only what you drafted. Six Pokémon who met you this afternoon, and are still deciding about you.' : i === 2 ? 'The second round of the bracket. Your drafted team is starting to look at you before each move.' : 'The last round. Brother Aldhelm\'s team of leftovers. Everything the others passed on, chosen for exactly why they passed.',
  'Across the ring: **{draft:vs:' + i + '}**.',
), [
  ch('Battle.', fight(i === 3 ? 'Brother Aldhelm bows, and sends out the one you passed on first.' : 'The marshal drops his hand.', { ...trainer('Drafter', { cls: 'ace-trainer', size: 6, lv: 1, friendly: true, rule: { gn: 'draft', slot: i },
    win: i < 3 ? [gn('draftWon'), scene(`gn-48-bracket-${i + 1}`)] : [gn('draftWon'), when('draft-misused', { max: 0 }, [gn('draftAldhelm')], 'Brother Aldhelm finds you after: "You read them. All of them. Nobody reads them." He hands over his own first pick.'), moment('Won the Pokémon Draft with six borrowed Pokémon.', 70), scene('gn-48-recruit')],
    lose: draftOut }) })),
]);

const gn48: Json[] = [
  gev('gn-48-door', 'The Pokémon Draft', hallD({ stop: 'event', rarity: 'uncommon', requires: [notThisRegion('draft-at')] }), say(
    '*A hall with a long table. Thirty Poké Balls in rows, each with a card.*',
    '**Draft marshal, Mr. Lucian Ashcombe:** "Your own stay on the bench. You pick one of ours. You fight. You pick another. Six picks."',
    '"Then the bracket, with only what you drafted. Every one of these belongs to somebody. They\'ve lent them. Treat them accordingly."',
  ), [
    ch('Sit at the table.', out('Three others sit down with you. A woman who looks at the Balls like a butcher. A monk. A boy of nine, already laughing at a card.', stampRegion('draft-at'), gn('draftStart'), scene('gn-48-table-a'))),
    ch('Walk on.', out('Through the window, the boy holds a card up to the light and laughs so hard he has to sit down.')),
  ]),
  rm('gn-48-table-a', 'The Pokémon Draft: The Table', hallD({ tags: ['Story'] }), say(
    'Pick {draft:round} of six. Five on the table. The other three drafters are watching your hand.',
    '1. {draft:card:1}', '2. {draft:card:2}', '3. {draft:card:3}',
  ), [takeCard(1), takeCard(2), takeCard(3), ch('Further along the table.', out('You walk down to the other end of the table.', scene('gn-48-table-b')))]),
  rm('gn-48-table-b', 'The Pokémon Draft: The Table', hallD({ tags: ['Story'] }), say(
    'The far end of the table. Two more Balls, two more cards.',
    '4. {draft:card:4}', '5. {draft:card:5}',
  ), [takeCard(4), takeCard(5), ch('Back along the table.', out('You walk back up the table. Cosima hasn\'t taken her eyes off you.', scene('gn-48-table-a')))]),
  rm('gn-48-fight', 'The Pokémon Draft: A Battle', hallD(), say(
    'A battle, {draft:round} on {draft:round}, against another table\'s drafter. Your borrowed team doesn\'t know you yet. It\'s waiting to see what you\'re like.',
  ), [
    ch('Battle.', fight('The marshal drops his hand.', { ...trainer('Drafter', { cls: 'ace-trainer', size: 5, lv: 0, friendly: true, rule: { gn: 'draft' }, win: [gn('draftWon'), scene('gn-48-table-a')], lose: draftOut }) })),
  ]),
  ...[1, 2, 3].map(bracket),
  rm('gn-48-recruit', 'The Pokémon Draft: Winner\'s Privilege', hallD({ tags: ['Story'] }), say(
    '**Mr. Ashcombe:** "Winner\'s privilege. One of the six may go with you, if its trainer agrees. And if it does."',
    'The six trainers who lent them are in the front row. Every one of them is looking at their own Pokémon, not at you.',
  ), [
    ch('Choose one.', out('You walk your choice over to its trainer.', gn('draftRecruit'), scene('gn-48-answer')), { pick: {} }),
    ch('Let them all go home.', out('You hand back six Poké Balls, one by one. Each trainer says thank you. Two of them cry a little.', gn('draftEnd'))),
  ]),
  rm('gn-48-answer', 'The Pokémon Draft: The Answer', hallD({ tags: ['Story'], remembers: [
    { id: 'joined', when: [is('draft-result', 1, 1)], notice: 'Its trainer watches you go, and doesn\'t look away until you\'re out of the door.' },
    { id: 'egg', when: [is('draft-result', 2, 2)], notice: 'Its trainer holds the egg out with both hands. "Bring this one back too, one day. Just to visit."' },
    { id: 'no', when: [is('draft-result', 3, 3)], notice: 'It goes back to its trainer. At the door it looks over its shoulder at you, once.' },
  ] }), say(
    'Your own team comes off the bench, all at once, and checks you over like you\'ve been somewhere dangerous.',
  ), [ch('Leave.', out('Mr. Ashcombe is already setting out thirty new cards for tomorrow.'))]),
  rm('gn-48-out', 'The Pokémon Draft: Out', hallD({ tags: ['Story'] }), say(
    'Out. The borrowed Pokémon go home to the front row. Each trainer checks theirs over, and then, surprisingly, thanks you.',
    'Your own team comes off the bench, all at once.',
  ), [ch('Leave.', out('Wilf waves at you all the way to the door, still holding the funny card.'))]),
  gev('gn-48-letter', 'A Letter from the Draft', hallD({ tags: ['Story'], stop: 'event', rarity: 'common', requires: [gnc('draftFriend'), notThisRegion('draft-letter')] }), say(
    'A letter, forwarded twice, with a smudged postmark. It\'s from {draft:from}.',
    '*"How is {draft:friend}? Does it still do the thing? You know the thing. Write back if you have a minute. Or don\'t. I just wanted to ask."*',
  ), [
    ch('Write back.', out('You write two pages. {draft:friend} sits on the second page while you finish it.', stampRegion('draft-letter'), gn('draftLetter'))),
    ch('Don\'t.', out('You fold it into your bag. {draft:friend} watches you do it.', stampRegion('draft-letter'))),
  ]),
];

// =====================================================================================================================
// gn.49  THE SLEEPING SNORLAX  (step 9, must-see, window 7–12; before the node's battle; once per run, from A3. In Kanto it replaces
// the Snorlax Blockade canon space.) Music, food or a fight wakes it, and how it wakes decides who it is (core/greenneedle/snorlax.ts).
// =====================================================================================================================
const HILL_TINT = '#3a4a3a';
const hill = (o: Json = {}): Json => ({ tint: HILL_TINT, pokemon: 'snorlax', tags: ['Story', 'Pokémon'], effect: 'none', ...o });
const BRIDE = say(
  '**The bride, as the queue moves:** "Three days late to my own wedding. Because of a *nap.*"',
  'Then she looks back at it, curled up on the verge. "...I\'m a bit jealous, honestly."',
);
const LEFTOVERS = 'Where it lay, the grass is flat as a table. In the middle, half-eaten and somehow still warm: Leftovers.';
const snorlaxJoin = (o: Json = {}): Json => ({ ...join({ species: ['snorlax'], lv: 2 }), ability: 'heavy-sleeper', mark: 'snorlax-woke', ...o });
const TUNE = ['High', 'Low', 'Low', 'High', 'Middle'];
const NOTE_LINES = [
  'The first note wobbles out over the hill. A hiker winces, kindly.',
  'The second. The hill\'s breathing catches, just once.',
  'The third. The wedding party has gone quiet. Somebody\'s mother is mouthing the tune.',
  'The fourth. An ear the size of a tent flap turns towards you.',
  'The last note. You hold it as long as your breath lasts.',
];
const notes: Json[] = TUNE.map((right, i) => rm(`gn-49-note-${i + 1}`, `The Sleeping Snorlax: Note ${i + 1}`, hill(), say(
  i === 0 ? 'The tune is scratched on the flute\'s side, five marks: *high, low, low, high, middle.* The whole queue leans in.' : NOTE_LINES[i - 1]!,
  `Note ${i + 1} of five.`,
), ['High', 'Middle', 'Low'].map((n) => ch(`${n}.`, out(n === right ? 'That one\'s right. You feel it land.' : 'Not quite the note. The tune bends, and carries on anyway.',
  ...(n === right ? [flag('snorlax-notes')] : []), scene(i < 4 ? `gn-49-note-${i + 2}` : 'gn-49-nearly'))))));
const METER = ['▮▯▯', '▮▮▯', '▮▮▮'];
const QUEUE = [
  'The hikers start clapping, slow, then faster. It\'s catching.',
  'Old Jarvis bangs a frying pan with a ladle. He looks happier than he has in three days.',
  'The wedding party sings. Badly. Gloriously. The bride\'s mother hits a note nobody knew existed.',
];
const noise: Json[] = METER.map((bar, i) => rm(`gn-49-noise-${i + 1}`, 'The Sleeping Snorlax: Make Some Noise', hill(), say(
  i === 0 ? 'The flute wasn\'t enough on its own. Now it\'s noise or nothing. A meter fills with sound, and the queue joins in.' : QUEUE[i - 1]!,
  `**Noise:** ${i === 0 ? '▯▯▯' : METER[i - 1]}`,
), [
  // The doc: shout into the microphone, or hold and tap a button, on the same screen (the snorlax-shout prompt offers both). The meter
  // fills either way: it is noise until it wakes, never a fail.
  ch('Shout, or hold and tap.', out(`You make noise from your boots up, and the queue hears you. **Noise:** ${bar}`, scene(i < 2 ? `gn-49-noise-${i + 2}` : 'gn-49-woke-music')), {
    prompt: { id: 'snorlax-shout', needs: 'ok' },
    fail: out(`Not much comes out. The queue doesn't mind: they are loud enough for everyone. **Noise:** ${bar}`, scene(i < 2 ? `gn-49-noise-${i + 2}` : 'gn-49-woke-music')),
  }),
]));

const HILL_CHOICES: Json[] = [
  ch('Play the Poké Flute.', out('You lift the flute. The queue goes quiet, the way people do before a speech.', scene('gn-49-note-1')), {
    requires: [gnc('fluteReady')],
    branches: [br([is('exploud-healed')], say(
      'You lift the flute. Before the first note, a roar rolls in from far off, over three hills.',
      'You know that voice. The Exploud you healed. It sounds like it\'s saying hello. The hill shudders, and sits up.',
    ), scene('gn-49-woke-music'))],
  }),
  ch('Put food under its nose.', out('You kneel by its nose with your bag open. Old Jarvis holds his breath.', gn('snorlaxFeed', { n: 3, key: 'first' }), scene('gn-49-food')), { requires: [gnc('foodReady')] }),
  ch('Battle it.', fight('You walk up and tap its belly. Hard. One eye opens. Then the other, slower. It isn\'t pleased.', {
    ...wild({ species: ['snorlax'], lv: 2, win: [setTo('snorlax-woke', 3), scene('gn-49-woke-battle')] }),
    rule: { gn: 'snorlax' }, exact: true, friendly: true,
    caught: [gn('snorlaxCaught'), setTo('snorlax-woke', 3), setTo('snorlax-joined', 1), scene('gn-49-caught')],
    lose: [setTo('snorlax-woke', 3), scene('gn-49-lost')],
  })),
  ch('Go back and find another way.', out(say(
    'You turn back. There\'s a path the map didn\'t show, round the long way. It costs you the afternoon.',
    'When you look back from the far ridge, the queue\'s still there. So is the hill. It\'s still breathing.',
  ), takeNode(1))),
];
const HILL_INTRO = say(
  '*The road ends in a hill. The hill\'s breathing.*',
  '*A queue of travellers has built up: a carter, two hikers, a wedding party in their good clothes. The flowers are wilting.*',
  '**Carter, Old Jarvis Sykes:** "Three days. We\'ve tried shouting. We\'ve tried a horn. The bride\'s mother tried *reasoning* with it."',
  'The bride sits on her own suitcase, veil in her lap. She hasn\'t cried yet. She looks like she\'s deciding whether to.',
);
const HILL_REMEMBERS: Json[] = [
  { id: 'tickled', when: [is('giants-river'), not('giants-snorlax-attacked')], notice: '**Old Jarvis squints at you:** "Here. You\'re the one who\'s good with these. Tickled a big one\'s foot, I heard. Go on, then."' },
  { id: 'exploud', when: [is('exploud-healed')], notice: 'Far off, past three hills, something big is clearing its throat. You know that voice.' },
];

const gn49: Json[] = [
  gev('gn-49-hill', 'The Sleeping Snorlax', hill({ stop: 'event', rarity: 'rare', requires: [not('snorlax-met')], remembers: HILL_REMEMBERS }), HILL_INTRO, HILL_CHOICES),
  ...notes,
  rm('gn-49-nearly', 'The Sleeping Snorlax: Nearly', hill({ remembers: [
    { id: 'perfect', when: [is('snorlax-notes', 5)], notice: 'Every note was right. You played it perfectly. Some sleeps are deeper than music.' },
    { id: 'lent', when: [gnc('notRegion', { types: ['kanto'] })], notice: 'The hiker who lent you the flute is clapping. "I never could play it," she says. "Not like that."' },
  ] }), say(
    '*One eye opens. It closes again. It was nearly enough.*',
    'The queue lets out the breath it was holding. Old Jarvis puts down his hat. "Nearly," he says. "Nearly\'s more than the horn got."',
  ), [ch('Make some noise.', out('You turn to the queue. They\'re already rolling up their sleeves.', setTo('snorlax-met', 1), scene('gn-49-noise-1')))]),
  ...noise,
  rm('gn-49-woke-music', 'The Sleeping Snorlax: Friendly', hill({ tags: ['Story', 'Recovery'] }), say(
    '*It sits up. It looks at the flute. It looks at everyone looking at it.*',
    '*It yawns. The bride\'s veil blows off.*',
    'It sways. It hums the tune back at you, an octave down, so deep you feel it in your ribs. Then it gets up, and moves.',
    'It holds the road clear with one arm while the queue goes by. The carter tips his hat to it. It tips its head back.',
    BRIDE, LEFTOVERS,
  ), [
    ch('Ask it to come with you.', out('You hold out a hand. It looks at the hand, then at you, then hums the tune again. That\'s a yes.',
      setTo('snorlax-met', 1), setTo('snorlax-woke', 1), item('leftovers'), snorlaxJoin(), setTo('snorlax-joined', 1), stampRegion('snorlax-at'))),
    ch('Let it go on its way.', out('It ambles off over the hill, humming. You can hear it long after you can\'t see it.',
      setTo('snorlax-met', 1), setTo('snorlax-woke', 1), item('leftovers'), stampRegion('snorlax-at'))),
  ]),
  rm('gn-49-food', 'The Sleeping Snorlax: Food', hill(), say(
    '*You set the food down a yard from its nose. Then a yard closer.*',
    '*The nose moves. The rest of it hasn\'t woken up yet. The nose is ahead of it.*',
    'It eats in its sleep, with tiny, polite snuffles. Then the food is gone, and the nose keeps looking. One eye cracks open: *more?*',
  ), [
    chIf([gnc('holdsBerry')], 'Give it more.', out('You hand over Berries, one by one. It takes each one like a gift. It is very fond of you now.', gn('snorlaxFeed', { n: 3 }), scene('gn-49-woke-food'))),
    ch('That\'s all there is.', out('You show it your empty hands. It sighs. Then it sits up, to see if you\'re hiding any.', scene('gn-49-woke-food'))),
  ]),
  rm('gn-49-woke-food', 'The Sleeping Snorlax: Following Its Nose', hill({ tags: ['Story', 'Recovery'] }), say(
    'It\'s awake. It\'s friendly. And it\'s worked out where the food came from: your bag.',
    'It gets up, and moves out of the road. Then it\'s behind you. You take a step. It takes a step.',
    BRIDE, LEFTOVERS,
  ), [
    ch('Ask it to come with you.', out('It was coming anyway. Now it\'s official. It pats your bag, very gently, and keeps patting it.',
      setTo('snorlax-met', 1), setTo('snorlax-woke', 2), item('leftovers'), snorlaxJoin(), gn('snorlaxFond'), setTo('snorlax-joined', 1), stampRegion('snorlax-at'))),
    ch('Let it follow.', out('You walk on. It walks on, one step back. Every so often you hear it sniff.',
      setTo('snorlax-met', 1), setTo('snorlax-woke', 2), setTo('snorlax-followed', 1), gn('snorlaxFollow'), item('leftovers'), stampRegion('snorlax-at'))),
  ]),
  rm('gn-49-woke-battle', 'The Sleeping Snorlax: Angry', hill({ tags: ['Story'] }), say(
    'Beaten, it moves. Not far. It sits down on the verge with its back to the road, and to you.',
    'The queue files past it carefully, the way you\'d pass a neighbour you\'ve argued with.',
    BRIDE, LEFTOVERS,
  ), [ch('Leave it be.', out('You leave it be. It doesn\'t turn round. It\'s going to remember this.', setTo('snorlax-met', 1), item('leftovers'), stampRegion('snorlax-at')))]),
  rm('gn-49-caught', 'The Sleeping Snorlax: Caught', hill({ tags: ['Story'] }), say(
    'It\'s yours. It isn\'t happy about it. It turns its back on you inside the Ball, somehow.',
    'It doesn\'t forgive quickly. Its Bond starts at nothing, and for the rest of this region it warms to you at half the speed.',
    BRIDE, LEFTOVERS,
  ), [ch('Pick up the Leftovers.', out('You pick them up. From inside the Ball, a long, unimpressed snore.', setTo('snorlax-met', 1), item('leftovers'), stampRegion('snorlax-at')))]),
  rm('gn-49-lost', 'The Sleeping Snorlax: Back to Sleep', hill({ tags: ['Story'] }), say(
    'You come round on the verge. Somebody\'s put a coat under your head. The Snorlax has gone back to sleep, right where it was.',
    'But it rolled, a little, in the fight. There\'s a gap now, just wide enough. The queue squeezes through it, one at a time.',
  ), [ch('Squeeze past.', out('You squeeze past its belly. It snores at you. It sounds like a grudge.', setTo('snorlax-met', 1), item('leftovers'), stampRegion('snorlax-at')))]),
  // ---- Afterstory: a Snorlax that didn't join, asleep across the road in a later region ----
  gev('gn-49-later', 'The Sleeping Snorlax, Again', hill({ stop: 'event', rarity: 'rare', requires: [is('snorlax-met'), not('snorlax-joined'), not('snorlax-later'), notThisRegion('snorlax-at')] }), say(
    '*The road ends in a hill. The hill\'s breathing. You\'ve seen this hill before.*',
    'It opens one eye. It looks at you for a long moment. It knows you.',
  ), [
    chIf([is('snorlax-woke', 0, 2)], 'Wait.', out('It rolls over, slowly, like a wave going out, and leaves the road clear. The eye closes. That was hello.', setTo('snorlax-later', 1))),
    chIf([is('snorlax-woke', 3, 3)], 'Ask nicely.', out('"Please," you say. It thinks about it for a long time. Then it rolls over. It wanted to hear you say it.', setTo('snorlax-later', 1))),
  ]),
];
// Kanto: the canon space on the route (cs.kanto.route.snorlax) shows the same story.
const KANTO_SNORLAX: Json = { ...gev('cs-kanto-route-snorlax', 'The Sleeping Snorlax', hill({ stop: 'event', rarity: 'common', group: 'Canon Spaces: Kanto', requires: [not('snorlax-met')], remembers: HILL_REMEMBERS }), HILL_INTRO, HILL_CHOICES), canon: 'cs.kanto.route.snorlax' };

const DEFECTOR_NAME = 'Corin Bellweather';
// =====================================================================================================================
// gn.50  THE EVIL TEAM'S BETRAYAL  (region-long, once per region, from A5, in a region with an evil-team story). The offer (S3),
// meeting 1 (S4), meeting 2 (S5), the records room (S6), the ending at the team's climax. Trust 0–5 (core/greenneedle/defector.ts).
// The defector, Corin Bellweather, is rank and file, not the lieutenant (that's SF13 A5's Trouble Inside).
// =====================================================================================================================
const NOTE_TINT = '#2f2a3a';
const note = (o: Json = {}): Json => ({ tint: NOTE_TINT, tags: ['Evil Team', 'Story'], effect: 'none', ...o });
const here = gnc('thisRegion', { key: 'defector-at' });
const helping = exactly('defector', 1);
const trust = (n: number): Json => gn('defectorTrust', { n });
/** Trust 3+: Corin shares a route (one free scouting of the team's nodes, each stage they meet you). */
const SHARE = when('defector-trust', { min: 3 }, [scout(3)], 'Corin slips you a scrap of paper: a route, and where the patrols will be on it.');
/** After each meeting, Corin leaves the way they came. Following them is checking up on them. */
const leaving = (id: string, name: string, line: string): Json => rm(id, name, note(), line, [
  ch('Let them go.', out('You let them go. You don\'t look where. Somehow that feels like the most useful thing you\'ve done all day.', SHARE)),
  ch('Follow them.', out('You follow, two streets back. They stop at a corner and say, without turning round, "Go home." Trust falls.', trust(-1), setTo('defector-followed', 1), SHARE)),
  chIf([gnc('defectorGuest')], 'Give their Pokémon back.', out('You hold out the Ball. Corin looks at it for a long time before they take it. "I didn\'t ask." "I know." Trust rises.', gn('defectorReturn', { n: 1 }), SHARE)),
]);

const gn50: Json[] = [
  gev('gn-50-offer', 'The Evil Team\'s Betrayal', note({ stop: 'event', rarity: 'rare', requires: [{ kind: 'evil', after: 1 }, notThisRegion('defector-at')], remembers: [
    { id: 'liar', when: [is('honest-lied')], notice: 'Corin glances at you sideways. "Someone told me you lie when it suits you. We\'ll see."' },
  ] }), say(
    '*A doorway, half out of the rain. Someone in a {defector:team} jacket is watching the street. Watching you.*',
    '**The defector, Corin Bellweather, hat low, in a doorway:** "Don\'t look round. Keep walking, slowly. I\'m one of them. I\'m about to not be."',
    '**Corin:** "They\'re closing my section. \'Closing\' means we take the blame for the whole operation and the bosses walk."',
    '"There are documents that prove it. I can\'t get to them alone." A breath. "{defector:reason}"',
  ), [
    ch('I\'ll help.', out('They breathe out, all the way, like they\'ve been holding it for weeks. "Next stage. I\'ll find you. Don\'t find me."',
      gn('defectorStart', { n: 1 }), stampRegion('defector-at'), stampStage('defector-step'))),
    ch('Why should I trust you?', out(say(
      '"You shouldn\'t. I wouldn\'t. Here." They press a Poké Ball into your hand: their one Pokémon. "Hold that till we\'re done."',
      'The Ball is warm. Whatever\'s inside it turns over once, and settles, like it\'s been passed between hands before.',
    ), gn('defectorStart', { n: 2 }), stampRegion('defector-at'), stampStage('defector-step'))),
    ch('I\'m turning you in.', out(say(
      'You walk on. Then you walk to the people who\'d pay to know: the Rangers, the police, the other team. It doesn\'t much matter which.',
      'They pay well. Nobody asks how you knew. You don\'t look at the doorway on the way back. It\'s empty anyway.',
    ), gn('defectorStart', { n: 3 }), stampRegion('defector-at'), $(3000), any(...RARE_ITEMS), moment('Turned in a {defector:team} member who asked for help.', 55))),
  ]),
  gev('gn-50-meet-1', 'The Evil Team\'s Betrayal: The Envelope', note({ stop: 'event', rarity: 'rare', requires: [helping, here, laterStage('defector-step'), not('defector-m1'), not('defector-m2'), not('defector-docs')], remembers: [
    { id: 'unsealed', when: [is('honest-lied')], notice: 'The envelope isn\'t sealed. The flap just sits there, folded over, asking. Corin watches you notice.' },
  ] }), say(
    '**Corin:** "You came. I\'d half bet you wouldn\'t."',
    '*They hand over an envelope.* "Carry that to the next stage. Don\'t open it. It\'s nothing. It\'s a test."',
    '"I\'m telling you it\'s a test, which is either very honest or very stupid."',
  ), [
    ch('Carry it.', out('You put it in your inside pocket. It weighs nothing. You feel it all the way to the next stage.', gn('defectorMeet', { n: 1 }), setTo('defector-envelope', 1), stampStage('defector-step'), scene('gn-50-leave-1'))),
    ch('Open it.', out(say(
      'You open it the moment they turn the corner. A blank page, and one line, in their small careful hand:',
      '*"Thought so."*',
    ), gn('defectorMeet', { n: 1 }), trust(-2), setTo('defector-envelope', 2), stampStage('defector-step'), scene('gn-50-leave-1'))),
  ]),
  leaving('gn-50-leave-1', 'The Evil Team\'s Betrayal: Corin Goes', 'Corin turns up their collar and steps back into the crowd. In three steps they\'re just another hat.'),
  gev('gn-50-meet-2', 'The Evil Team\'s Betrayal: The Split Lip', note({ stop: 'event', rarity: 'rare', requires: [helping, here, laterStage('defector-step'), not('defector-m2'), not('defector-docs')], remembers: [
    { id: 'missed', when: [not('defector-m1')], notice: 'Corin doesn\'t mention the meeting you missed. That\'s worse than if they had.' },
    { id: 'opened', when: [exactly('defector-envelope', 2)], notice: 'They don\'t ask about the envelope. They already know.' },
  ] }), say(
    '*Corin\'s got a split lip, and isn\'t mentioning it.*',
    '**Corin:** "Day after tomorrow. Records room. I can get the door. I can\'t get the guard. That\'s you."',
  ), [
    ch('What happened to your face?', out('"Walked into a door." They hold your eye. "A door with a {defector:team} badge on it. It\'s fine. It\'s nearly over."',
      gn('defectorMeet', { n: 2 }), when('defector-unasked', { min: 0, max: 0 }, [trust(1), setTo('defector-unasked', 1)]), stampStage('defector-step'), scene('gn-50-leave-2'))),
    ch('Understood.', out('They nod, once. It\'s the first time you\'ve seen them smile. It splits the lip again. They don\'t care.',
      gn('defectorMeet', { n: 2 }), when('defector-unasked', { min: 0, max: 0 }, [trust(1), setTo('defector-unasked', 1)]), stampStage('defector-step'), scene('gn-50-leave-2'))),
    ch('What are you doing between these meetings?', out('"Nothing you need." Not angry. Just a door, closing gently. You don\'t get to know that part.',
      gn('defectorMeet', { n: 2 }), setTo('defector-unasked', 2), stampStage('defector-step'), scene('gn-50-leave-2'))),
  ]),
  leaving('gn-50-leave-2', 'The Evil Team\'s Betrayal: Corin Goes', 'Corin touches the split lip once, as if checking it\'s still there, and walks away without hurrying.'),
  // ---- Their own story: pieces the player only hears about, from other people ----
  gev('gn-50-word-grunt', 'The Evil Team\'s Betrayal: A Grunt Talks', note({ stop: 'event', rarity: 'rare', requires: [helping, here, is('defector-m1'), not('defector-word-grunt')] }), say(
    'A {defector:team} Grunt, beaten, sitting on a kerb, talking mostly to himself.',
    '"Someone\'s been warning the families. Three of our lot got letters: \'get out by Friday.\' Who does that? Who even knows the addresses?"',
  ), [
    ch('Walk on.', out('You walk on. You think you know who knows the addresses. You keep it to yourself.', setTo('defector-word-grunt', 1))),
    ch('Ask who sent the letters.', out('He shrugs. "Someone in payroll, maybe. Someone careful." Asking about Corin feels like checking up on them. It is. Trust falls.', trust(-1), setTo('defector-word-grunt', 1))),
  ]),
  gev('gn-50-word-town', 'The Evil Team\'s Betrayal: A Neighbour Talks', note({ stop: 'event', rarity: 'rare', requires: [helping, here, is('defector-m1'), not('defector-word-town')] }), say(
    'A woman sweeping her step stops when you pass, the way people do when they need to tell someone.',
    '"A fellow in a hat paid my neighbour\'s rent. Wouldn\'t say why. Her lad\'s in that gang. Was. He left on Tuesday."',
  ), [
    ch('Smile and walk on.', out('You smile. She goes back to sweeping, a bit lighter.', setTo('defector-word-town', 1))),
    ch('Ask about the fellow in the hat.', out('"Tall. Tired. Kind eyes, if you looked." She narrows hers at you. "Why?" Trust falls.', trust(-1), setTo('defector-word-town', 1))),
  ]),
  gev('gn-50-word-radio', 'The Evil Team\'s Betrayal: The Radio', note({ stop: 'event', rarity: 'rare', requires: [helping, here, is('defector-m1'), not('defector-word-radio')] }), say(
    'A radio left on in an empty hut, tuned to {defector:team}\'s band. Static, then a voice:',
    '"Section nine roster\'s been altered. Fourteen names gone. Find out who."',
  ), [
    ch('Turn it off.', out('You turn it off. In the quiet you think about fourteen names, and the person who took them off a list.', setTo('defector-word-radio', 1))),
    ch('Tell the Rangers.', out('You tell a Ranger what you heard. She writes it down. Somewhere, the net round Corin pulls a little tighter. Trust falls.', trust(-1), setTo('defector-word-radio', 1))),
    ch('Tell your rival.', out('Your rival listens, and whistles, and promises not to tell anyone. They tell two people. Trust falls.', trust(-1), setTo('defector-word-radio', 1))),
  ]),
  // ---- The documents: the records room, in a team site ----
  gev('gn-50-docs', 'The Evil Team\'s Betrayal: The Records Room', note({ stop: 'event', rarity: 'rare', requires: [helping, here, laterStage('defector-step'), not('defector-docs')], remembers: [
    { id: 'missed', when: [not('defector-m2')], notice: 'Corin had to find out about the guard from someone else. "You weren\'t there," is all they say.' },
    { id: 'guest', when: [gnc('defectorGuest')], notice: 'Corin holds out a hand for their Ball before anything else. "I\'ll need it in there." You give it back. They had to ask.' },
    { id: 'route', when: [is('defector-trust', 3)], notice: 'Corin\'s scrap of paper got you here without meeting a single patrol.' },
  ] }), say(
    '*A {defector:team} site, after dark. Corin has the door: a key on a long string, a nod.*',
    'Inside, one guard, at a desk, between you and the records room. He\'s awake. He\'s bored. Bored is dangerous.',
  ), [
    ch('Take the guard.', fight('He stands, reaching for a Ball, looking more relieved than anything. Something finally happening.', { ...foe('grunt', 'Records Room Guard', 2, { lv: 1, win: [scene('gn-50-cabinet')] }), friendly: true, lose: [scene('gn-50-caught-out')] }, gn('defectorMeet', { n: 3 }), gn('defectorReturn', { n: 0 }))),
    chIf([is('hideout-key')], 'Use a key.', out('Your Hideout key fits the side door. The guard never looks up. Corin stares at you. "Where did you get that?"', flag('hideout-key', -1), gn('defectorMeet', { n: 3 }), gn('defectorReturn', { n: 0 }), scene('gn-50-cabinet'))),
  ]),
  rm('gn-50-caught-out', 'The Evil Team\'s Betrayal: Out the Window', note(), say(
    'You come round in an alley. Corin got you out, somehow, through a window too small for either of you.',
    'No files. Corin sits against the wall with their head on their knees. "Well," they say. "Well."',
  ), [ch('Get up.', out('You get up. You help them up. Neither of you says the next part out loud.', setTo('defector-files', 0)))]),
  rm('gn-50-cabinet', 'The Evil Team\'s Betrayal: Fourteen Folders', note(), say(
    '*A filing cabinet. Corin\'s hands are shaking. They pull one folder, and then stop, and pull fourteen more.*',
    '**Corin:** "Those are the others. In my section. If I only clear my own name, they still hang."',
    'Down the corridor, a door. Footsteps that haven\'t decided which way to go yet.',
  ), [
    ch('Take them all.', fight('Fifteen folders don\'t fit in one jacket. A drawer bangs. Somewhere, an alarm. Someone\'s coming.', { ...foe('grunt', 'Night Patrol', 2, { lv: 1, win: [setTo('defector-files', 2), trust(1), scene('gn-50-out')] }), friendly: true, lose: [setTo('defector-files', 1), scene('gn-50-out')] })),
    ch('There\'s no time. Just yours.', out('Corin puts the fourteen folders back, one at a time, very carefully, as if they might wake. They don\'t speak on the way out.', setTo('defector-files', 1))),
    ch('Take the boss\'s file too.', fight('The boss\'s drawer is locked. You open it anyway. The first alarm; then, as you run, a second.', { ...foe('specialist', 'Night Patrol', 3, { lv: 1, win: [setTo('defector-files', 3), evil({ mark: 'files' }), scene('gn-50-out')] }), friendly: true, lose: [setTo('defector-files', 1), scene('gn-50-out')] })),
  ]),
  rm('gn-50-out', 'The Evil Team\'s Betrayal: Outside', note(), say(
    'Outside. Cold air. Running feet going the wrong way, behind you. Corin leans on a wall and laughs, once, like a cough.',
  ), [
    chIf([exactly('defector-files', 2)], 'Breathe.', out('Fourteen people you\'ll never meet will sleep tonight. Corin hands you nothing, says nothing. Doesn\'t need to.')),
    chIf([exactly('defector-files', 3)], 'Breathe.', out('The boss\'s file is in your bag. Their Plan, in their own words, a stage early. Corin looks at it like it might bite.')),
    chIf([exactly('defector-files', 1)], 'Breathe.', out('One folder. Theirs. It\'s something. It isn\'t enough, and you both know which part isn\'t.')),
  ]),
  // ---- The ending, at the team's climax ----
  gev('gn-50-end', 'The Evil Team\'s Betrayal: The Climax', note({ stop: 'event', rarity: 'rare', requires: [here, is('defector'), not('defector-end'), { kind: 'evil', after: 6 }], remembers: [
    { id: 'fourteen', when: [exactly('defector-files', 2)], notice: 'And somewhere behind the walls, a side door is standing open. You hear boots. A lot of boots. They\'re on your side.' },
  ] }), say(
    '*The {defector:team} site where it all ends. {defector:boss} is inside.*',
    '{defector:ending}',
  ), [
    chIf([helping], 'Go in.', out('You go in. Whatever happened in doorways and records rooms, it comes with you now.', gn('defectorEnd'))),
    chIf([exactly('defector', 2)], 'Battle.', fight('Corin\'s team comes out one by one, and each of them is looking at one of yours. They studied you. Of course they did.', {
      ...trainer(DEFECTOR_NAME, { cls: 'worker', size: 6, lv: 2, friendly: true, rule: { gn: 'defector' }, win: [setTo('defector-boss-won', 1)], lose: [] }) }, gn('defectorEnd'))),
  ]),
  gev('gn-50-postcard', 'The Evil Team\'s Betrayal: A Postcard', note({ stop: 'event', rarity: 'rare', requires: [exactly('defector-end', 3), notThisRegion('defector-at'), not('defector-postcard')] }), say(
    'A postcard, in with the rest of the post. A beach you\'ve never seen. No return address.',
    'On the back, in a small, careful hand: *Got out. Thank you for the part you did. —C.*',
  ), [ch('Keep it.', out('You keep it. You couldn\'t say which part they meant.', setTo('defector-postcard', 1)))]),
];

// =====================================================================================================================
// gn.51  THE POKÉMON SMUGGLING RING  (step 14, side branch, window 12–17, better at night; instead of the battle; once per run, A6).
// Four guards at A+1 (the last is the foreman); the roof skips two; the tyres cost a node; the Rangers do it for you. The cages,
// the list of who goes home, and the one that stays: afraid of Balls, three rests of patience (core/greenneedle/smuggling.ts).
// =====================================================================================================================
const CRATE_TINT = '#232a33';
const crate = (o: Json = {}): Json => ({ tint: CRATE_TINT, tags: ['Evil Team', 'Combat'], effect: 'none', ...o });
const GUARDS = [
  { name: 'Guard Hollis', line: 'The first guard looks up from a crossword. "You\'re not the lorry driver." He sighs, and stands.' },
  { name: 'Guard Pruett', line: 'The second guard was asleep on the cages. He\'s awake now, and embarrassed about it, which makes him angrier.' },
  { name: 'Guard Venn', line: 'The third guard doesn\'t say anything. He just takes off his watch, very carefully, and puts it in his pocket.' },
  { name: 'Foreman Dace', line: '**Foreman Dace:** "Do you know what one of these fetches, three regions over? More than you\'ll see this year. Step away."' },
];
const guardRoom = (i: number): Json => rm(`gn-51-guard-${i + 1}`, `The Smuggling Ring: ${GUARDS[i]!.name}`, crate(), say(
  i === 0 ? '*Inside, cages, stacked four high. Tags on each: a region, a number, a price.*' : 'Further in. The cages go on, row after row. Nothing in them makes a sound.',
  GUARDS[i]!.line,
), [
  ch('Battle.', fight('His Pokémon are strong. Somebody pays for strong.', {
    ...trainer(GUARDS[i]!.name, { cls: i === 3 ? 'veteran' : 'roughneck', size: i === 3 ? 4 : 3, lv: 1, friendly: true,
      win: i === 3 ? [$(2500), any(...TREASURE_ITEMS), scene('gn-51-cages')] : [scene(`gn-51-guard-${i + 2}`)],
      lose: [scene('gn-51-lorries')] }) })),
]);
const TREASURE_ITEMS = ['nugget', 'big-pearl', 'star-piece', 'comet-shard'];
const ENTRY = (o: { tyres?: boolean } = {}): Json[] => [
  ch('Go in through the front.', out('You walk in through the open doors like you belong. For about four steps, you do.', setTo('smuggle-entry', o.tyres ? 3 : 1), scene('gn-51-guard-1'))),
  ch('Go in through the roof.', out('A drainpipe, a skylight, the rafters. Below, the guards\' torches swing back and forth.', setTo('smuggle-entry', o.tyres ? 3 : 2), scene('gn-51-rafters'))),
  ...(o.tyres ? [] : [ch('Let the air out of the lorries\' tyres first.', out(say(
    'You crawl from lorry to lorry in the dark, a valve at a time. It takes ages. The hiss sounds like the whole night breathing out.',
    'Whatever happens inside now, nobody drives off with a full lorry.',
  ), takeNode(1), setTo('smuggle-tyres', 1), scene('gn-51-flat')))]),
  ch('Fetch the Rangers.', out(say(
    'You run for the Ranger post. They come, in a node, three jeeps with the lights off. The guards are theirs.',
    'The head Ranger hands you a crowbar. "The cages are yours. You found them."',
  ), takeNode(1), setTo('smuggle-entry', 4), flag('rep', 2), scene('gn-51-cages'))),
];

const gn51: Json[] = [
  gev('gn-51-yard', 'The Pokémon Smuggling Ring', crate({ stop: 'event', rarity: 'rare', requires: [not('smuggle-freed')] }), say(
    '*A warehouse with its lights off and its doors open. Lorries, engines running.*',
    '*Inside, cages, stacked four high. Tags on each: a region, a number, a price.*',
    'Alolan, Galarian, Hisuian, Paldean: regional forms, taken from where they live, to be sold where they\'re rare.',
    'Four guards with strong Pokémon. A foreman with a clipboard, counting.',
  ), ENTRY()),
  rm('gn-51-flat', 'The Pokémon Smuggling Ring: Flat Tyres', crate(), say(
    'Every lorry in the yard sits on its rims. A driver kicks a wheel and swears, and goes inside to tell someone.',
    'Now. Before they work out why.',
  ), ENTRY({ tyres: true })),
  rm('gn-51-rafters', 'The Pokémon Smuggling Ring: The Rafters', crate({ tags: ['Evil Team', 'Exploration'] }), say(
    'A beam as wide as your foot. Below, the cages, and the tops of the guards\' heads. One of them is humming.',
    'Halfway along, there\'s a gap where a beam has rotted out.',
  ), [
    chIf([anyType('flying', 'ghost')], 'Let your Pokémon carry you over.', out('It takes you across the gap without a sound. Two guards never see you pass over their heads.', scene('gn-51-guard-3'))),
    ch('Jump the gap.', out('You land soft. Two guards never see you pass over their heads.', scene('gn-51-guard-3')), {
      prompt: { id: 'brace-hold', needs: 'ok' },
      fail: out('You land. The beam doesn\'t like it. Dust sifts down onto a guard\'s cap. He looks up. Still, one guard skipped.', scene('gn-51-guard-2')),
    }),
  ]),
  ...GUARDS.map((_, i) => guardRoom(i)),
  rm('gn-51-lorries', 'The Pokémon Smuggling Ring: The Lorries', crate({ remembers: [
    { id: 'tyres', when: [is('smuggle-tyres')], notice: 'Engines roar. Then they whine, and stop. Every lorry in the yard is sitting on its rims. Nobody\'s driving anywhere. By morning, the Rangers have the lot.' },
  ] }), say(
    'You come round on the warehouse floor. The guards have gone, and so have two of the lorries, and whatever was in them.',
    'But the cages here are still here. Still full. Still quiet.',
  ), [ch('Get up.', out('You get up. You find the keys on a hook by the door, where somebody always leaves keys.', setTo('smuggle-lost', 1), scene('gn-51-cages')))]),
  rm('gn-51-cages', 'The Pokémon Smuggling Ring: The Cages', crate({ tags: ['Evil Team', 'Pokémon'] }), say(
    'Each cage has a Pokémon, and each has been in it long enough to stop making a noise.',
    '*You open the first one. Nothing comes out.*',
    '*It\'s pressed against the back. It\'s looking at the open door as if it\'s a trick.*',
  ), [
    ch('Reach in.', out(say(
      'It goes flatter. It goes smaller than it should be able to. You take your hand away, slowly, and it watches the hand all the way out.',
      'You step back. Much later, when you look, the cage is empty.',
    ), gn('smuggleCages'), scene('gn-51-door'))),
    ch('Step back, and wait.', out('A while. Then a nose. Then all of it, at once, past you and under a lorry.', gn('smuggleCages'), scene('gn-51-door'))),
    ch('Open all the others first.', out('Cage after cage. When it sees the rest go, it goes. It doesn\'t look back. None of them do.', gn('smuggleCages'), scene('gn-51-door'))),
  ]),
  rm('gn-51-door', 'The Pokémon Smuggling Ring: The Door', crate({ tags: ['Pokémon', 'Story'], remembers: [
    { id: 'ring', when: [is('ring-finished')], notice: 'The tags match the crates in the S.S. Anne\'s engine room, and the ones under the bridge. That was all of it. The ring\'s finished.' },
  ] }), say(
    'The Rangers take most of them home, region by region. The head Ranger reads you the list, and ticks each one off on the bonnet of her jeep:',
    '{smuggle:list}',
    'One of the freed ones doesn\'t leave. It sits by the open warehouse door, between the dark inside and the dark outside. A {smuggle:rescue}, a long way from home.',
  ), [
    ch('Hold out a Ball.', out(say(
      '*You hold out a Ball. It\'s across the yard before the button\'s pressed.*',
      'But when you walk away, it follows. Not close. It won\'t go inside a Ball. It will walk beside you.',
    ), gn('smuggleRehab', { n: 0 }), stampRegion('smuggle-at'), moment('Opened the cages of a smuggling ring. One of them followed, at a distance.', 70))),
  ]),
  // ---- Rehabilitation: it comes a little closer at each rest (the rest stop opens this beside it) ----
  rm('gn-51-rest', 'The One That Stayed', crate({ tags: ['Pokémon', 'Recovery'], remembers: [
    { id: 'caged', when: [gnc('hasMark', { key: 'freed-caged' })], notice: 'Your other Pokémon that once knew a cage walks over and lies down beside it, on the outside. Neither of them moves.' },
    { id: 'waited', when: [is('ball-waited')], notice: 'The one whose Ball wouldn\'t open sits with it, the way somebody once sat with them.' },
  ] }), say(
    'The {smuggle:rescue} from the warehouse is still with you. It takes no place in your team, and nothing can touch it: it stays back.',
    '{smuggle:rest}',
  ), [
    chIf([not('smuggle-joined'), { kind: 'gn', test: 'rehabDone' }], 'Pick up the Ball.', out('It\'s in there. It climbed in by itself. Its Bond starts high. *It chose the door, this time.*', gn('smuggleJoin'))),
    chIf([{ kind: 'gn', test: 'rehabWaiting' }], 'Leave food where it can reach.', out('You put it down and walk away. In the morning the dish is clean, and it\'s a little closer.', gn('smuggleRehab', { n: 1 }))),
    chIf([{ kind: 'gn', test: 'rehabWaiting' }], 'Leave a Ball open on the ground, and ignore it.', out('You leave the Ball open on the grass and don\'t look at it once. That\'s the hard part.', gn('smuggleRehab', { n: 1 }))),
    chIf([{ kind: 'gn', test: 'rehabWaiting' }], 'Try the Ball again', out('It\'s gone before you\'ve finished reaching. Back to where it started. *It\'s not ready. It\'ll tell you.*', gn('smuggleRehab', { n: -1 }))),
  ]),
  // ---- Afterstory: a postcard from each region one of them went home to ----
  gev('gn-51-postcard', 'The Smuggling Ring: A Postcard', crate({ stop: 'event', rarity: 'rare', tags: ['Story'], requires: [is('smuggle-freed'), notThisRegion('smuggle-at'), notThisRegion('smuggle-card-at'), is('smuggle-cards', 0, 3)] }), say(
    'A postcard from the Rangers. A photograph of the {smuggle:card}: where it belongs, not looking at the camera.',
  ), [ch('Pin it up.', out('You pin it up. On the list, one more tick.', gn('smugglePostcard'), stampRegion('smuggle-card-at')))]),
];

// =====================================================================================================================
// gn.52  THE EVIL TEAM'S POKÉMON AUCTION  (step 16, side branch, window 14–18, at night; instead of the battle; once per run, A8,
// only with an evil-team story). A disguise opens rooms; six lots, two traps, three must be won to keep a bidder's cover; the rare
// lot bought, rescued from the service corridor, or seized when the alarm goes up (core/greenneedle/teamauction.ts).
// =====================================================================================================================
const MASK_TINT = '#3a1f2b';
const mask = (o: Json = {}): Json => ({ tint: MASK_TINT, tags: ['Evil Team', 'Shop'], effect: 'none', ...o });
const lot = (won: boolean): Json => gn('taLot', { n: won ? 1 : 0 });
const CORRIDOR_BY_TRUST = when('defector-trust', { min: 3 }, [setTo('ta-corridor', 1)]);
const FLOOR_PEOPLE = say(
  'A woman in a fox mask bids on everything, early and high. A man by the pillar never bids at all. He just watches who does.',
  'And a caterer with a tray of small pastries, who is {rival}. Out of the side of their mouth: "Don\'t. Say. Anything."',
);
const lotRoom = (n: number, name: string, intro: string, choices: Json[], o: Json = {}): Json => rm(`gn-52-lot-${n}`, `The Evil Auction: Lot ${n}, ${name}`, mask(o), intro, choices);
const nextLot = (n: number): Json => (n === 3 ? route('ta-ask', 'gn-52-lot-4', 'gn-52-question') : scene(`gn-52-lot-${n + 1}`));

const gn52: Json[] = [
  gev('gn-52-manor', 'The Evil Team\'s Pokémon Auction', mask({ stop: 'event', rarity: 'rare', requires: [{ kind: 'evil', after: 2 }, not('ta-done')], remembers: [
    { id: 'corin', when: [exactly('defector', 1), is('defector-trust', 3)], notice: 'Then Jenny steps aside, and it\'s Corin behind her, hat low. "I left the corridor door on the latch. Behind the stage. You\'re welcome."' },
  ] }), say(
    '*A manor with every window lit and no cars outside. Guests arriving on foot, in masks.*',
    '**Officer Jenny, in the hedge:** "It\'s tonight. Everything they\'ve taken this season, sold in one room."',
    '"One lot\'s alive, and rare, and frightened. You\'ll need to be somebody else to get in."',
  ), [
    ch('Go as a rich buyer.', out('"Of the northern Vantongerens," you tell the door. "Distantly." The door bows. Money opens doors. Pretending to have it opens most.',
      gn('taStart', { n: 1 }), CORRIDOR_BY_TRUST, stampRegion('ta-at'), stampStage('ta-stage'), scene('gn-52-viewing'))),
    chIf([{ kind: 'evil', lacks: 'disguise' }], 'Go as a rival team\'s agent.', out('A different team\'s pin on your lapel, borrowed. You\'re here to see what the competition\'s selling. Someone here may know the real agent.',
      gn('taStart', { n: 2 }), setTo('ta-ask', 1), CORRIDOR_BY_TRUST, stampRegion('ta-at'), stampStage('ta-stage'), scene('gn-52-office'))),
    chIf([{ kind: 'evil', has: 'disguise' }], 'Go as a rival team\'s agent.', out('You wore their uniform once already. You know how they stand, how they nod. Nobody here will think to test you.',
      gn('taStart', { n: 2 }), setTo('ta-ask', 0), CORRIDOR_BY_TRUST, stampRegion('ta-at'), stampStage('ta-stage'), scene('gn-52-office'))),
    ch('Go as a caterer.', out('A white jacket and a tray of something with too much aspic. Nobody looks at a caterer. Nobody lets one bid, either.',
      gn('taStart', { n: 3 }), stampRegion('ta-at'), stampStage('ta-stage'), scene('gn-52-kitchen'))),
  ]),
  // ---- The buyer: the viewing room ----
  rm('gn-52-viewing', 'The Evil Auction: The Viewing Room', mask(), say(
    'Glass cases under soft lights. A held item. A case of Balls. A fossil. An egg in straw. An antique vase.',
    'A steward hovers, in case you\'d like anything up close.',
  ), [
    ch('Look closely at the antique.', out('You lean in. The glaze is still tacky. Somebody made this last week. It\'s a fake.', setTo('ta-viewed', 1), scene('gn-52-lot-1'))),
    ch('Go to the floor.', out('You take a paddle with a number on it, and a seat near the front.', scene('gn-52-lot-1'))),
  ]),
  // ---- The agent: the back office ----
  rm('gn-52-office', 'The Evil Auction: The Back Office', mask(), say(
    'A desk, a lamp, a ledger left open by someone who\'ll be back in a minute.',
  ), [
    ch('Read the ledger.', out(say(
      'Names, prices, buyers. One line: *Sinnoh job, settled in Rare Candy.* And a plan of the house: a service corridor runs behind the stage.',
    ), setTo('ta-ledger', 1), setTo('ta-corridor', 1), scene('gn-52-lot-1'))),
    ch('Go to the floor.', out('You leave the ledger as it was, and take a seat at the back.', scene('gn-52-lot-1'))),
  ]),
  // ---- The floor: six lots ----
  lotRoom(1, 'A Held Item', say(
    'Lot 1: a held item, stolen from a trainer two towns over. Its fair value\'s on your screen: ₽1,200.',
    FLOOR_PEOPLE,
  ), [
    ch('Bid to its fair value.', out('Your paddle goes up, once, twice. The fox mask lets you have it. Fair\'s fair.', $(-1200), any('quick-claw', 'kings-rock', 'scope-lens', 'razor-claw'), lot(true), nextLot(1)), { requires: [money(1200)] }),
    ch('Let it go.', out('You let it go. It sells to someone in a rabbit mask, for too much.', lot(false), nextLot(1))),
  ], { remembers: [
    { id: 'pryde', when: [is('auction-exposed')], notice: 'In the third row, in a mask that fools nobody: Octavian Pryde, the honest auctioneer. He looks horrified. He\'s taking notes for the police.' },
  ] }),
  lotRoom(2, 'A Case of Rare Balls', say(
    'Lot 2: a case of rare Balls. The bidding climbs, and climbs. Soon there\'s only you and one other paddle, by the stage.',
    'The other paddle belongs to the house. The auctioneer doesn\'t look away from you. He\'s waiting to see how deep your pockets go.',
  ), [
    ch('Keep bidding.', out('You win. Everyone in the room now knows exactly how much money you have. Including the man by the pillar.', $(-3000), item('ultra-ball', 5), lot(true), nextLot(2)), { requires: [money(3000)] }),
    ch('Drop out early.', out('You lower your paddle. The house bidder stops too, at once. The auctioneer\'s smile goes thin. You saw it.', setTo('ta-trap-balls', 1), lot(false), nextLot(2))),
  ]),
  lotRoom(3, 'A Fossil', say('Lot 3: a fossil, honest, in a velvet box. The fox mask doesn\'t bother with this one.'), [
    ch('Bid.', out('Yours, at a fair price. It\'s heavier than it looks.', $(-1500), any('old-amber', 'helix-fossil', 'dome-fossil'), lot(true), nextLot(3)), { requires: [money(1500)] }),
    ch('Let it go.', out('It goes to a quiet man in a heron mask, who holds it like a baby.', lot(false), nextLot(3))),
  ]),
  rm('gn-52-question', 'The Evil Auction: A Question', mask({ remembers: [
    { id: 'ledger', when: [is('ta-ledger')], notice: 'You read it in the ledger an hour ago: *Sinnoh job, settled in Rare Candy.*' },
  ] }), say(
    'A guest slides into the seat beside you. "You\'re with them, aren\'t you? Remind me. How did we pay the man from the Sinnoh job?"',
    'He\'s smiling. Only the real agent would know.',
  ), [
    ch('"Cash, as always."', out('His smile stays exactly where it is. He gets up, and goes to stand by the pillar. Your cover\'s gone.', setTo('ta-blown', 1), scene('gn-52-lot-4'))),
    ch('"In Rare Candy."', out('"Ha. Course we did." He pats your knee and moves on. You breathe again.', scene('gn-52-lot-4'))),
    ch('"We didn\'t. He owed us."', out('"Did he." Not a question. He gets up, and goes to stand by the pillar. Your cover\'s gone.', setTo('ta-blown', 1), scene('gn-52-lot-4'))),
  ]),
  lotRoom(4, 'An Antique', say('Lot 4: "An antique." A vase, very old, the auctioneer says. The fox mask bids on it as if she knows something.'), [
    ch('Bid.', out('You win it. The vase is warm from the lights. You carry it carefully, the way people carry things they paid for.', $(-1000), lot(true), nextLot(4)), { requires: [money(1000)] }),
    ch('Let it go.', out('You let it go. Somebody always buys the vase.', lot(false), nextLot(4))),
  ], { remembers: [
    { id: 'fake', when: [is('ta-viewed')], notice: 'You saw it close up in the viewing room. The glaze was still tacky. It\'s a fake.' },
  ] }),
  lotRoom(5, 'An Egg', say(
    'Lot 5: an egg, in straw. The bidding\'s slow, and cheap. Too cheap. Nobody wants to look like they know what it is.',
    'It\'s worth more. Knowing that is the dangerous part.',
  ), [
    ch('Bid low, like everyone.', out('You bid like you\'re bored. It\'s yours for almost nothing. The man by the pillar doesn\'t look up.', $(-600), egg(), setTo('ta-trap-egg', 1), lot(true), scene('gn-52-lot-6')), { requires: [money(600)] }),
    ch('Bid what it\'s really worth.', out('You bid its real price. The room goes quiet. The man by the pillar writes something down.', $(-1600), egg(), setTo('ta-noticed', 1), lot(true), scene('gn-52-lot-6')), { requires: [money(1600)] }),
    ch('Let it go.', out('You let it go. Someone else gets a bargain, and doesn\'t know it.', setTo('ta-trap-egg', 1), lot(false), scene('gn-52-lot-6'))),
  ]),
  lotRoom(6, 'The Rare Pokémon', say(
    '*The last lot. A cage under a cloth. The cloth comes off.*',
    '*It\'s small. It\'s a {cast:ta-rare}, a kind the region hardly sees. It\'s looking at the room the way something looks at weather.*',
  ), [
    chIf([not('ta-blown')], 'Bid it home.', out('The fox mask pushes the price high, and higher. You go higher. It\'s handed to you in its cage. Nobody\'s the wiser. The team has your money.',
      $(-4500), gn('taRare', { n: 1 }), lot(true), scene('gn-52-out')), { requires: [money(4500)] }),
    chIf([not('ta-blown'), is('ta-corridor')], 'Bid, and send a Pokémon round the back.', out('You bid, and bid, holding the room. Then, from behind the stage, a signal: a tap, twice. You stop. The cage is already empty.',
      $(-500), gn('taRare', { n: 2 }), scene('gn-52-out')), {
      prompt: { id: 'echo-rhythm', needs: 'ok' },
      fail: out('The signal comes late. You\'re still bidding when the gavel falls, at its full price. It\'s yours, the expensive way.', $(-4500), gn('taRare', { n: 1 }), lot(true), scene('gn-52-out')),
    }),
    ch('Raise the alarm.', fight('The fox mask\'s whistle, loud as a train. Guards from every door, and the man by the pillar, taking off his mask.', {
      ...foe('executive', 'The Lieutenant', 3, { lv: 1, win: [gn('taRare', { n: 3 }), scene('gn-52-out')] }), friendly: true, lose: [scene('gn-52-out')] },
      setTo('ta-alarm', 1), evil({ heat: 2 }))),
  ], { remembers: [
    { id: 'blown', when: [is('ta-blown')], notice: 'The man by the pillar isn\'t watching the lot. He\'s watching you. Two guards drift closer.' },
  ] }),
  // ---- The caterer: kitchens, cellar, the service corridor ----
  rm('gn-52-kitchen', 'The Evil Auction: The Kitchens', mask(), say(
    'Steam and shouting. A chef throws a tray at you and points at a door. You go through the door.',
    'Another caterer is already there, hiding behind a tray of small pastries. It\'s {rival}. "Don\'t. Say. Anything."',
  ), [ch('Say nothing.', out('You say nothing. {rival} nods once, the way people do in heist films, and points down the stairs.', scene('gn-52-cellar')))]),
  rm('gn-52-cellar', 'The Evil Auction: The Cellar', mask(), say(
    'Wine, and crates, and crates that aren\'t wine. At the far end, a door marked SERVICE.',
  ), [ch('Take the service corridor.', out('The corridor runs behind the stage. Through the boards, the auctioneer\'s voice. Lot 6.', setTo('ta-corridor', 1), scene('gn-52-corridor')))]),
  rm('gn-52-corridor', 'The Evil Auction: The Service Corridor', mask(), say(
    'The cage is wheeled back here between lots. You have a minute. Maybe.',
    'A key on a hook, by the door. A lock that\'s old. And {rival}, already here, holding the far door open with one foot.',
  ), [
    ch('Take the key from the hook.', out('The key turns. The cage opens. It doesn\'t move. Then it does, straight into your jacket, shaking.', gn('taRare', { n: 2 }), scene('gn-52-out'))),
    chIf([anyType('ghost', 'steel')], 'Let your Pokémon pick the lock.', out('A click like a knuckle. The cage swings open. It looks at your Pokémon, and then at you, and comes.', gn('taRare', { n: 2 }), scene('gn-52-out'))),
    ch('Let your rival hold the door.', out('{rival} holds the door. You wheel the whole cage out into the night. "Never mention the tray," they say.', gn('taRare', { n: 2 }), scene('gn-52-out'))),
    ch('Raise the alarm.', fight('You yank the fire bell. Guards from every door, and a man who never bids, taking off his mask.', {
      ...foe('executive', 'The Lieutenant', 3, { lv: 1, win: [gn('taRare', { n: 3 }), scene('gn-52-out')] }), friendly: true, lose: [scene('gn-52-out')] },
      setTo('ta-alarm', 1), evil({ heat: 2 }))),
  ]),
  rm('gn-52-out', 'The Evil Auction: Outside', mask({ tags: ['Evil Team', 'Story'], remembers: [
    { id: 'alarm', when: [is('ta-alarm')], notice: 'Everything\'s seized: the lots, the ledgers, the guests\' coats. The team knows your face now.' },
  ] }), say(
    'Outside, the cold, and the dark garden. {rival} is gone already, with the pastries.',
  ), [
    ch('Walk home.', out('You walk home under the stars. Somewhere behind you, the manor\'s lights are still burning.', gn('taEnd'), rivalTrust(2), moment('Went undercover at the evil team\'s auction, in a mask.', 65))),
  ]),
  // ---- Later: the lieutenant wonders; the manor's for sale ----
  gev('gn-52-later', 'The Evil Auction: Someone Knew', mask({ stop: 'event', rarity: 'rare', tags: ['Evil Team'], requires: [is('ta-traps'), not('ta-later'), laterStage('ta-stage')] }), say(
    'A lieutenant of the team, on a bench, talking into a phone he thinks nobody can hear.',
    '"Someone at the auction knew what they were doing. Didn\'t fall for the Balls. Didn\'t fall for the egg. I\'d like to know who."',
  ), [ch('Say nothing.', out('You walk past him. He doesn\'t look up. He doesn\'t know. He never will.', setTo('ta-later', 1)))]),
  gev('gn-52-sale', 'The Evil Auction: For Sale', mask({ stop: 'event', rarity: 'rare', tags: ['Story'], requires: [is('ta-done'), notThisRegion('ta-at'), not('ta-sale')] }), say(
    'A manor you\'ve been in before, with every window dark. A sign on the gate.',
    'It says: *Motivated seller.*',
  ), [ch('Walk on.', out('You walk on, smiling.', setTo('ta-sale', 1)))]),
];


// ---------- gn.53 The Region Under Siege (doc 11, lines 371–470) ----------
const siege = (o: Json = {}): Json => ({ tags: ['Evil Team', 'Story'], effect: 'none', ...o });
/** After an action, the clock moves on: turns 2–5 and 7 back to the city, 6 the runner, 8 the commander. */
const nextTurn: Json[] = [
  when('sg-turn', { min: 2, max: 5 }, [scene('gn-53-turn')]),
  when('sg-turn', { min: 6, max: 6 }, [scene('gn-53-runner')]),
  when('sg-turn', { min: 7, max: 7 }, [scene('gn-53-turn')]),
  when('sg-turn', { min: 8, max: 8 }, [scene('gn-53-commander')]),
];
const act = (d: string, n: number): Json[] => [gn('sgAct', { key: d, n }), ...nextTurn];
/** A district's three actions: a fight (Grunts at A+0 early, the district's captain at A+1 from turn 4), a rescue, a repair. */
function district(d: string, name: string, intro: string, rescue: Json): Json {
  return rm(`gn-53-${d}`, `The Region Under Siege: ${name}`, siege(), intro, [
    chIf([is('sg-turn', 1, 3)], 'Fight.', fight(`Grunts in ${name}, behind a barricade of whatever was nearest. They didn\'t expect anyone to come back.`, {
      ...foe('grunt', `${name}\'s Grunts`, 2, { lv: 0, win: act(d, 1) }), friendly: true, lose: act(d, 2) })),
    chIf([is('sg-turn', 4, 7)], 'Fight.', fight(`${name}\'s captain, in a commandeered doorway, with a radio and a better team than the Grunts had.`, {
      ...foe('specialist', `${name}\'s Captain`, 3, { lv: 1, win: act(d, 1) }), friendly: true, lose: act(d, 2) })),
    rescue,
    ch('Repair.', out('A party Pokémon puts its shoulder to the barricade. It holds. This district can stand a turn without you.', ...act(d, 4))),
  ]);
}
const gn53: Json[] = [
  gev('gn-53-alarm', 'The Region Under Siege', siege({ stop: 'event', rarity: 'rare', requires: [{ kind: 'evil', after: 5 }, notThisRegion('sg-at')], remembers: [
    { id: 'feared', when: [is('rep-lost')], notice: 'Some of those you call don\'t come. Of the ones who do, a few won\'t meet your eye. They\'ll fight. Just not for you.' },
  ] }), say(
    '*Smoke over the city. A siren, on and on. The evil team\'s banners on the Hall.*',
    'Four districts: the Market, the Homes, the Gate, the Hall. One of you. A clock of eight turns.',
    'You can\'t be everywhere. You\'ll have to choose. Everyone you\'ve helped this run is already on their way.',
  ), [
    ch('Answer the alarm.', out('You run toward the smoke. Behind you, footsteps: people you know, coming too.',
      gn('sgStart'), stampRegion('sg-at'), stampStage('sg-stage'), scene('gn-53-muster'))),
  ]),
  rm('gn-53-muster', 'The Region Under Siege: The Square', siege(), say(
    'The square, under the smoke. Who came: {siege:allies}.',
    '{siege:bars}',
  ), [
    chIf([{ kind: 'gn', test: 'sgWaiting' }], 'Give orders.', out('Someone\'s waiting for you to tell them where to stand.', scene('gn-53-orders'))),
    chIf([{ kind: 'gn', test: 'sgOrdered' }], 'Into the city.', out('Everyone\'s where they need to be. Now you.', scene('gn-53-turn'))),
  ]),
  rm('gn-53-orders', 'The Region Under Siege: Orders', siege(), say(
    '{siege:ally} waits for orders. Their hands are steady. Their Pokémon aren\'t.',
    'A district held by allies alone loses ground slowly. A district with nobody loses it fast.',
  ), [
    ch('The Market.', out('They nod, and run for the Market.', gn('sgAssign', { n: 0 }), scene('gn-53-muster'))),
    ch('The Homes.', out('They nod, and run for the Homes.', gn('sgAssign', { n: 1 }), scene('gn-53-muster'))),
    ch('The Gate.', out('They nod, and run for the Gate.', gn('sgAssign', { n: 2 }), scene('gn-53-muster'))),
    ch('The Hall.', out('They nod, and run for the Hall.', gn('sgAssign', { n: 3 }), scene('gn-53-muster'))),
  ]),
  rm('gn-53-turn', 'The Region Under Siege: The City', siege({ remembers: [
    { id: 'gate', when: [is('sg-reinforced')], notice: 'Lorries came through the Gate. There are more of them now.' },
    { id: 'rangers', when: [is('sg-rangers')], notice: 'The Rangers\' jeeps are in the streets. Somebody\'s shouting your name, and it isn\'t a warning.' },
  ] }), say(
    'Turn {siege:turn} of 8. Each turn: one district, one thing.',
    '{siege:bars}',
  ), [
    ch('The Market.', out('The Market: shops, and the Pokémon Center. If it falls, the city loses both.', scene('gn-53-market'))),
    ch('The Homes.', out('The Homes: streets, and a school. People who\'ll be in later scenes, or won\'t.', scene('gn-53-homes'))),
    ch('The Gate.', out('The Gate: the only road in. Hold it, and their reinforcements don\'t come.', scene('gn-53-gate'))),
    ch('The Hall.', out('The Hall: the mayor, and the radio mast. Hold it, and the city can call for help.', scene('gn-53-hall'))),
  ]),
  district('market', 'the Market', say(
    'Stalls on their sides. The Center\'s doors chained from the outside. Behind them, someone\'s knocking.',
    'The shopkeeper who gave you a discount, once. Trapped under the awning of her own shop.',
  ), chIf([not('sg-civ-market')], 'Rescue.', out('You lift the awning. She crawls out, coughing, and grips your hand far too hard. "I knew it\'d be you."', gn('sgRescue', { key: 'market' }), ...nextTurn))),
  district('homes', 'the Homes', say(
    'Washing still on the lines. Doors left open. A dog barking in a yard, and nobody calling it in.',
    'The child you helped, earlier this region, crouched behind a bin. They\'re holding very still.',
  ), chIf([not('sg-civ-homes')], 'Rescue.', out('You crouch down. "It\'s me." They come out, and hold on to your sleeve, and don\'t let go for three streets.', gn('sgRescue', { key: 'homes' }), ...nextTurn))),
  district('gate', 'the Gate', say(
    'The gatehouse, the barrier, a queue of abandoned cars. The team\'s lorries park here.',
    'Under a car, a Pokémon, wedged in tight. It was somebody\'s. It isn\'t sure whose any more.',
  ), chIf([not('sg-pokemon')], 'Rescue.', out('You lie flat on the road, and reach, and wait. It comes out, slowly. It looks at you as if it\'s going to remember you.', gn('sgRescue', { key: 'gate' }), ...nextTurn))),
  district('hall', 'the Hall', say(
    'The mayor\'s office, a radio mast, a staircase full of smoke.',
    '{rival}\'s mum, of all people, in the records room. She came to pay a parking fine.',
  ), chIf([not('sg-civ-hall')], 'Rescue.', out('You get her down the back stairs. "You\'re the one my child won\'t stop talking about," she says. "Hm. Taller."', gn('sgRescue', { key: 'hall' }), ...nextTurn))),
  rm('gn-53-runner', 'The Region Under Siege: The Runner', siege(), say(
    '*Turn 6. A runner, out of breath, grabbing your arm.*',
    '"The school\'s cut off! And the hospital! We can\'t— which? *Which?*"',
  ), [
    ch('The school.', out('You run for the school. Behind you, the hospital\'s windows go dark one by one. You don\'t look back.', gn('sgHomes', { n: 1 }), ...act('homes', 3))),
    ch('The hospital.', out('You run for the hospital. Behind you, a school bell rings and rings, and stops. You don\'t look back.', gn('sgHomes', { n: 2 }), ...act('homes', 3))),
    ch('Split my team: three each.', fight('Half your team goes with you to the school. They fight like they know the other half is fighting too.', {
      ...foe('specialist', 'The School\'s Guards', 3, { lv: 1, win: [gn('sgHomes', { n: 1 }), scene('gn-53-hospital')] }), friendly: true, lose: [scene('gn-53-hospital')] },
      gn('sgHalf', { n: 1 }))),
  ]),
  rm('gn-53-hospital', 'The Region Under Siege: The Hospital', siege(), say(
    'Across the road, the hospital. The rest of your team is already there, without you. They waited.',
  ), [
    ch('Go to them.', fight('The other half, and you. They fight like they know the first half did.', {
      ...foe('specialist', 'The Hospital\'s Guards', 3, { lv: 1, win: [gn('sgHomes', { n: 2 }), gn('sgWhole'), ...act('homes', 3)] }), friendly: true, lose: [gn('sgWhole'), ...act('homes', 3)] },
      gn('sgHalf', { n: 2 }))),
  ]),
  rm('gn-53-commander', 'The Region Under Siege: The Commander', siege({ remembers: [
    { id: 'never', when: [not('sg-reinforced')], notice: 'No lorries ever came. The commander\'s Pokémon are tired. So is the commander.' },
  ] }), say(
    '*The Hall\'s steps. Smoke. A figure with a radio, giving orders in a level voice.*',
    'They lower the radio when they see you. "So you\'re the one."',
  ), [
    ch('Fight.', fight('"Everyone, hold." The commander steps down to meet you. Behind them, the city waits to see who wins.', {
      ...foe('executive', 'The Commander', 6, { lv: 2, win: [gn('sgEnd', { n: 1 }), scene('gn-53-after')] }), rule: { gn: 'siege-commander' }, friendly: true, lose: [gn('sgEnd', { n: 0 }), scene('gn-53-after')] })),
  ]),
  rm('gn-53-after', 'The Region Under Siege: After', siege({ remembers: [
    { id: 'celebration', when: [exactly('sg-result', 1)], notice: 'The banners come down. Bells, from somewhere. The city\'s in celebration, and everyone knows your name.' },
    { id: 'repair', when: [exactly('sg-result', 2)], notice: 'The city stands. Tents where shops were. People are tired and kind, and some things are missing.' },
    { id: 'occupation', when: [exactly('sg-result', 3)], notice: 'The banners stay up. Patrols on every corner. You\'ll have to pass through quietly.' },
  ] }), say(
    'The smoke thins. Districts held: {siege:held} of 4.',
  ), [
    ch('Walk on.', out('You walk on through the city you fought for. It\'s still here. So are you.', rivalTrust(1), moment('Defended a city under siege, district by district, for eight turns.', 70))),
  ]),
  rm('gn-53-waiting', 'The Region Under Siege: Waiting', siege({ tags: ['Pokémon'] }), say(
    'At the rest, by the door: the {cast:sg-pokemon} from under the car. It followed you. It\'s been waiting.',
    'It looks at your Poké Ball, and then at you. It\'s asking.',
  ), [
    ch('Let it come.', out('You open the Ball. It goes in on its own, and the Ball doesn\'t even shake.', gn('sgJoin'))),
    ch('Send it home.', out('You point it toward the city. It goes, slowly, looking back twice. Somebody there will know whose it is.', setTo('sg-pokemon', 4))),
  ]),
  gev('gn-53-plaque', 'The Region Under Siege: The Plaque', siege({ stop: 'event', rarity: 'rare', requires: [is('sg-result'), notThisRegion('sg-at'), not('sg-plaque')], remembers: [
    { id: 'fell', when: [is('sg-fell')], notice: 'Beside it, a second plaque, shorter. Just a date, and the names of the districts that fell.' },
  ] }), say(
    'A city you defended, another region back, in the news on a café\'s radio. They\'ve put up a plaque.',
    'The names on it: {siege:plaque}.',
  ), [ch('Listen to the end.', out('You listen to the end. Your name isn\'t on it. You don\'t mind. You know whose should be.', setTo('sg-plaque', 1)))]),
];

// ---------- gn.54 The Magikarp Convention (doc 12, lines 8–92) ----------
const KARPCON_TINT = '#6aa8d8';
const karpcon = (o: Json = {}): Json => ({ tint: KARPCON_TINT, pokemon: 'magikarp', tags: ['Pokémon', 'Story'], effect: 'none', ...o });
const toHub = scene('gn-54-hub');
const kc = (test: string): Json => ({ kind: 'gn', test });
/** After the jump (or just watching): the secret, if one of them evolves this year; else the band. */
const afterJump: Json[] = [gn('kcEvolve'), when('kc-star', { min: 1 }, [scene('gn-54-secret')]), when('kc-star', { min: 0, max: 0 }, [scene('gn-54-end')])];
const prize: Json[] = [
  when('kc-place', { min: 1, max: 1 }, [item('mystic-water')]),
  when('kc-place', { min: 2, max: 2 }, [item('rare-candy')]),
  when('kc-place', { min: 3 }, [gn('markLead', { text: 'wears a hand-knitted Magikarp hat' })]),
];
const NOTCH_GYARADOS: Json[] = [
  when('karp-raced', { min: 3 }, [{ ...join({ species: ['gyarados'] }), ability: 'impossible-leap', boost: { stat: 'spe', percent: 5 }, mark: 'karp-notch' }], 'It learned to be quick from you: Speed +1, for good.'),
  when('karp-raced', { min: 0, max: 2 }, [{ ...join({ species: ['gyarados'] }), ability: 'impossible-leap', mark: 'karp-notch' }]),
];
const gn54: Json[] = [
  gev('gn-54-lake', 'The Magikarp Convention', karpcon({ stop: 'event', rarity: 'uncommon', requires: [notThisRegion('kc-at')], remembers: [
    { id: 'again', when: [is('kc-visits')], notice: 'The same banner, a year older. The same band. Mr. Tiddlethorpe sees you and waves both arms, megaphone and all.' },
  ] }), say(
    '*A lake with bunting. A banner: 14TH ANNUAL MAGIKARP CONVENTION. "THEY TRY."*',
    '*A brass band playing something heroic, slowly.*',
    '**Convention chair, Mr. Ferdinand Tiddlethorpe:** "People laugh. Let them. No other Pokémon in the world fails this hard and comes back."',
    '"That\'s not nothing. That\'s the whole thing."',
  ), [
    ch('Go in.', out('You go in under the bunting. A child hands you a paper flag with a fish on it. You hold it.', gn('kcArrive'), stampRegion('kc-at'), toHub)),
    ch('Walk on.', out('You walk on. Behind you, the band hits a high note, and misses it, and keeps going.')),
  ]),
  rm('gn-54-hub', 'The Magikarp Convention: The Lake', karpcon(), say(
    'Stalls round the water. Twelve Magikarp in a roped-off pool. A painted pole. A serious man with six Poké Balls, polishing them.',
    'A board by the gate keeps every year\'s scores, this run:',
    '{karp:board}',
  ), [
    chIf([not('kc-watched')], 'Watch the synchronised jumping.', out(say(
      'Twelve Magikarp, in formation. They jump on the beat, mostly. Two collide. Nobody minds.',
      'It\'s not graceful. It\'s sincere. Your Water-types watch without blinking.',
    ), fr(5, { types: ['water'] }), setTo('kc-watched', 1), toHub)),
    chIf([not('kc-merch')], 'Browse the merchandise.', out('Hats. Flags. A plush that Splashes when squeezed. A book: *Splash: A Life.*', scene('gn-54-merch'))),
    chIf([not('kc-quill-met')], 'Talk to the serious man.', out('He doesn\'t look up from his polishing until you\'re right in front of him.', scene('gn-54-quill'))),
    ch('Go to the jumping contest.', out('A megaphone squeals. Everyone drifts toward the pole.', scene('gn-54-contest'))),
  ]),
  rm('gn-54-merch', 'The Magikarp Convention: Merchandise', karpcon({ remembers: [
    { id: 'pettigrew', when: [is('karp-bought')], notice: 'One stall\'s Mr. Pettigrew\'s. A sign: EVERYTHING HERE IS EXACTLY WHAT I SAY IT IS. It is. People keep looking at it, confused.' },
  ] }), say(
    'Hats with fins. Flags. A plush that Splashes when squeezed, which a child is doing, over and over.',
    'A stack of *Splash: A Life,* by Ferdinand Tiddlethorpe. Signed. All of them.',
  ), [
    ch('A Magikarp-print bandana (₽300).', out('Your lead wears it at once, at a jaunty angle. It looks ready to try very hard.', $(-300), gn('markLead', { text: 'wears a Magikarp-print bandana' }), setTo('kc-merch', 1), toHub), { requires: [money(300)] }),
    ch('A hat with fins (₽200).', out('It fits your lead badly. Your lead won\'t take it off.', $(-200), gn('markLead', { text: 'wears a Magikarp hat with fins' }), setTo('kc-merch', 1), toHub), { requires: [money(200)] }),
    ch('The book (₽100).', out('You open it at random. Chapter Nine: *"And Then It Splashed Again."* It\'s better than it should be.', $(-100), setTo('kc-merch', 1), toHub), { requires: [money(100)] }),
    ch('Just look.', out('You just look. The plush Splashes at you as you go. It feels personal.', setTo('kc-merch', 1), toHub)),
  ]),
  rm('gn-54-quill', 'The Magikarp Convention: The Serious Man', karpcon({ cast: ['trainer.ace-trainer'], remembers: [
    { id: 'seven', when: [is('kc-quill')], notice: 'He has seven now. "One more, since you. I\'m not bitter. I\'m *thorough.*"' },
  ] }), say(
    '**Ace Trainer Barnabas Quillfeather:** "Six. Bred for jump height, generation on generation."',
    '"People say, \'Why not evolve them?\' I say, \'Why climb a mountain and then *knock it down?*\'"',
  ), [
    ch('Battle.', fight('"Six on six. They know Splash, Tackle, Flail and Bounce." He doesn\'t smile. "Flail hurts."', {
      ...trainer('Barnabas Quillfeather', { cls: 'ace-trainer', size: 6, team: ['magikarp', 'magikarp', 'magikarp', 'magikarp', 'magikarp', 'magikarp'], lv: -2, friendly: true, rule: { gn: 'quillfeather' },
        win: [flag('kc-quill'), setTo('kc-quill-met', 1), scene('gn-54-respect')], lose: [setTo('kc-quill-met', 1), scene('gn-54-gracious')] }) })),
    ch('Not today.', out('"Nobody ever says yes," he tells his Balls, and goes back to polishing.', setTo('kc-quill-met', 1), toHub)),
  ]),
  rm('gn-54-respect', 'The Magikarp Convention: Respect', karpcon({ cast: ['trainer.ace-trainer'] }), say(
    'The last one went out at one HP, holding a Sash, and almost did it. He knew it would. That was the point.',
    'He looks at you for a long time. Then he holds out a disc. "Bounce. You\'ve earned the right to jump."',
  ), [ch('Take it.', out('He shakes your hand, once, firmly, like a man closing a gate.', teach('bounce'), toHub))]),
  rm('gn-54-gracious', 'The Magikarp Convention: Gracious', karpcon({ cast: ['trainer.ace-trainer'] }), say(
    '"Well fought." He means it. He helps your Pokémon up, one by one, and tells each of them something kind.',
    'He\'s gracious about it. Somehow that\'s worse.',
  ), [ch('Back to the lake.', out('You go back to the lake. Behind you, he\'s telling his six they did well. They did.', toHub))]),
  rm('gn-54-contest', 'The Magikarp Convention: The Contest', karpcon({ remembers: [
    { id: 'notch', when: [is('karp-1'), not('karp-end')], notice: 'Fifth in line: a Magikarp with a notch in its tail fin. *That notch.* It\'s the one from the river. It keeps trying after the whistle.' },
  ] }), say(
    '**Mr. Tiddlethorpe, with a megaphone:** "ONE jump. Height at the top of the arc. Judges\' decision is final, and the judges are *moved easily.*"',
    'The regulars line up. Old Reliable. Lady Splendour, waiting for the band. Chips, jumping crooked. The Admiral, refusing to be measured. Notch.',
  ), [
    chIf([is('kc-own')], 'Enter your Magikarp.', out('You give its name to the judges. Somebody writes it on the board in chalk. Your Magikarp looks at the pole like it\'s personal.', setTo('kc-mine', 1), scene('gn-54-jump'))),
    ch('Borrow one.', out('A volunteer hands you a Magikarp in a bucket. "This is Keith. Keith tries."', scene('gn-54-jump'))),
    ch('Just watch.', out(say(
      'Old Reliable: 3 ft 2 in, to the inch, again. Lady Splendour waits for the band, then flies. Chips jumps crooked. The crowd roars for Chips.',
      'The Admiral jumps when nobody\'s looking. "About four," says a child.',
    ), ...afterJump)),
  ]),
  rm('gn-54-jump', 'The Magikarp Convention: The Jump', karpcon(), say(
    'Your turn at the pole. It\'s taller up close. The band stops to watch.',
    'The best a Magikarp can do is good. Not great. Good.',
  ), [
    ch('Go on, you can do it.', out('It jumps. It\'s a good jump. It\'s the best it\'s got.', gn('kcJump', { n: 1 }), ...prize, ...afterJump), {
      prompt: { id: 'gauge-hold', needs: 'ok' },
      fail: out('It jumps a beat early. Still a jump. Still trying.', gn('kcJump', { n: 2 }), ...prize, ...afterJump),
    }),
    ch('Beat Lady Splendour.', out('It jumps like it heard you. It clears her mark by an inch. Lady Splendour looks away, offended.', gn('kcJump', { n: 3 }), ...prize, ...afterJump), {
      prompt: { id: 'gauge-hold', needs: 'good' },
      fail: out('It tries too hard. It jumps too early, and too sideways, and lands in the reeds, very pleased.', gn('kcJump', { n: 4 }), ...prize, ...afterJump),
    }),
    ch('Just have fun.', out('It does. That\'s all it does. It has the best time anyone\'s ever had.', gn('kcJump', { n: 5 }), ...prize, ...afterJump)),
  ]),
  rm('gn-54-secret', 'The Magikarp Convention: The Secret', karpcon({ pokemon: 'gyarados', remembers: [
    { id: 'notch', when: [kc('kcNotch')], notice: '*It turns its head, above the whole lake, slowly, along the bank, until it finds the right face.* It has a notch in its tail.' },
    { id: 'mine', when: [kc('kcMine')], notice: 'It\'s yours. Your own Magikarp, the one you entered. It looks down at you as if to ask: *did that count?*' },
  ] }), say(
    '*A jump. Higher than the pole. Higher than the bunting.* It\'s {karp:star}.',
    '*It doesn\'t come down the same shape.* The crowd goes silent. The band stops, one instrument at a time. The tuba\'s last.',
    '*Then the crowd goes wild.* Hats in the air. Mr. Tiddlethorpe\'s crying into his megaphone, and it\'s amplifying it.',
    '**Barnabas Quillfeather, very quietly, to his six:** "Don\'t look. Don\'t any of you look at that."',
  ), [
    chIf([kc('kcNotch')], 'Hold out your hand.', out('It comes down out of the sky, and lowers its great head to your hand, in front of everyone.',
      ...NOTCH_GYARADOS, flag('karp-falls'), setTo('karp-end', 1), moment('The notched Magikarp evolved at the Magikarp Convention, and looked for you.', 90), scene('gn-54-end'))),
    chIf([kc('kcNotch')], 'Let it go free.', out('It roars once at the sky, and is gone upriver. The children talk about nothing else.', flag('karp-falls'), setTo('karp-end', 1), scene('gn-54-end'))),
    chIf([kc('kcMine')], 'Welcome it back.', out('It\'s entered on the board for ever, under your name, with a small drawn star.',
      { kind: 'formChange', from: 'magikarp', to: 'gyarados' }, moment('Your Magikarp evolved at the Magikarp Convention, in front of everyone.', 85), scene('gn-54-end'))),
    chIf([kc('kcRegular')], 'Watch it go.', out('It circles the lake once, and goes down the river. Its row on the board ends with a small drawn star.', scene('gn-54-end'))),
  ]),
  rm('gn-54-end', 'The Magikarp Convention: The Band', karpcon({ remembers: [
    { id: 'evolved', when: [is('kc-evolved')], notice: 'Next year, the others will jump a little higher. They always do, after.' },
  ] }), say(
    'The band plays the heroic thing again, slowly. The board, chalked up for this year:',
    '{karp:board}',
  ), [ch('Go home.', out('You go home with a paper flag, and a feeling you can\'t quite name. It might be hope. It smells of lake.', moment('Went to the Magikarp Convention. They tried.', 40)))]),
  gev('gn-54-poster', 'The Magikarp Convention: The Poster', karpcon({ stop: 'event', rarity: 'uncommon', tags: ['Story'], requires: [is('kc-visits'), notThisRegion('kc-at'), notThisRegion('kc-poster')] }), say(
    'A poster on a noticeboard: the Magikarp Convention, next year, all welcome.',
    'In one corner, in crayon, a small Gyarados. Drawn by a child. It\'s smiling.',
  ), [ch('Smile back.', out('You smile back at it. Nobody sees. That\'s fine.', stampRegion('kc-poster')))]),
];

// ---------- gn.55 The Angry Bidoof (doc 12, lines 93–172) ----------
const bidoofTint = (o: Json = {}): Json => ({ tint: '#b08a5a', pokemon: 'bidoof', tags: ['Pokémon', 'Combat'], effect: 'none', cast: ['trainer.gentleman'], ...o });
const LEAD_BOND_3: Json = { kind: 'bondLevel', atLeast: 3, who: 'lead' };
const bidoofFight = (text: string): Json => fight(text, {
  ...wild({ species: ['bidoof'], lv: 2, win: [gn('bidoofJoin'), scene('gn-55-foot')] }), exact: true, friendly: true, rule: { gn: 'bidoof', noCatch: true }, lose: [scene('gn-55-sorry')],
});
const gn55: Json[] = [
  gev('gn-55-bidoof', 'The Angry Bidoof', bidoofTint({ stop: 'event', rarity: 'rare', requires: [not('bidoof-insulted')], remembers: [
    { id: 'dam', when: [is('bibarel-dam-broken')], notice: 'Its eyes go to you, and narrow. It knows about the dam. Whatever you say now, it\'s already decided.' },
    { id: 'gym', when: [is('future-gym-normal')], notice: '**Mr. Applewhite:** "Your friend\'s new Gym has a Bidoof, doesn\'t it? Its cousin. You can tell by the eyebrows." Nobody\'s surprised.' },
  ] }), say(
    '*A boy with an expensive belt is doubled over, laughing, pointing.*',
    '**The boy, Lucan Fairweather:** "A *Bidoof!* He\'s sending out a *Bidoof!* Oh, that\'s— hang on, I can\'t— a *Bidoof!*"',
    '*The Bidoof is looking at him. It isn\'t blinking. Behind him, his Pokémon is already on the ground. One hit. He hasn\'t looked round yet.*',
    '**Its trainer, Mr. Horace Applewhite, mildly:** "I do wish people wouldn\'t. It takes it so much to heart."',
    '*The Bidoof turns its head toward you.* "Oh, dear. It\'s seen you smile. Were you smiling? You\'d best not have been smiling."',
  ), [
    ch('I wasn\'t laughing.', out('It considers. It considers for a long time. It decides you were.', setTo('bidoof-insulted', 1), setTo('bidoof-mood', 1), stampStage('bidoof-stage'), scene('gn-55-fight'))),
    ch('It\'s a Bidoof.', out('Its fur stands up, all at once, the whole length of it. Mr. Applewhite takes a step back. "Oh, you shouldn\'t have."', setTo('bidoof-insulted', 1), setTo('bidoof-mood', 2), stampStage('bidoof-stage'), scene('gn-55-fight'))),
    ch('Sorry. It\'s a very fine Bidoof.', out('It considers for longer. Its eyes go past you, to your lead.',
      setTo('bidoof-insulted', 1), setTo('bidoof-mood', 3), stampStage('bidoof-stage'),
      gn('check', { key: 'bidoof-bow', if: [LEAD_BOND_3] }),
      when('bidoof-bow', { min: 1 }, [scene('gn-55-bow')]),
      when('bidoof-bow', { min: 0, max: 0 }, [scene('gn-55-bows-first')]))),
  ]),
  rm('gn-55-fight', 'The Angry Bidoof', bidoofTint(), say(
    'It walks into the middle of the road. It sits. It waits for you to choose.',
    '**Mr. Applewhite:** "It\'s a perfectly ordinary Bidoof. They\'re simply misunderstood."',
  ), [ch('Battle.', bidoofFight('It doesn\'t look away from you. Not once. Not between turns. Not ever.'))]),
  rm('gn-55-bows-first', 'The Angry Bidoof', bidoofTint(), say(
    'Your lead hangs back. It isn\'t sure of itself yet, and the Bidoof can tell.',
    'So the Bidoof bows first. Formally. Deeply. Then it straightens up, and the bow is over.',
  ), [ch('Bow back, and battle.', bidoofFight('You bow back. It nods, as if that settles the manners, and comes at you like a landslide.'))]),
  rm('gn-55-bow', 'The Angry Bidoof: Respect', bidoofTint({ tags: ['Pokémon', 'Relationship'] }), say(
    'Your lead steps forward, and bows. Low, and slow, and meaning it.',
    '*The Bidoof walks a slow circle round your lead. It nods, once.*',
    'Then it trots off into the long grass, and comes back with something in its teeth.',
  ), [ch('Take it.', out('A Silk Scarf, a little damp. It doesn\'t join you. It doesn\'t need to. Every Bidoof on the road will hear about this.',
    item('silk-scarf'), setTo('bidoof-end', 2), bond(1), moment('Bowed to the Angry Bidoof, and it bowed back.', 70)))]),
  rm('gn-55-foot', 'The Angry Bidoof: It\'s Taken to You', bidoofTint({ tags: ['Pokémon', 'Relationship'] }), say(
    '*It\'s on its back. It looks at the sky a while. It gets up. It walks over. It sits down on your foot.*',
    '**Mr. Applewhite:** "Oh. Oh, it\'s taken to you. It never takes to anyone. I\'ll miss it. Shall I? I think I shall."',
    '"It ate my sofa."',
  ), [ch('Let it stay on your foot.', out('It stays on your foot for a long time. When you finally walk, it walks too, exactly beside you.', moment('Beat the Angry Bidoof. It sat on your foot, and stayed.', 75)))]),
  rm('gn-55-sorry', 'The Angry Bidoof: Mr. Applewhite Apologises', bidoofTint(), say(
    '**Mr. Applewhite:** "Oh, I\'m so sorry. I\'m so terribly sorry. It\'s normally very gentle. It likes turnips."',
    'He apologises for some time. He gives your Pokémon a turnip each. Nothing\'s taken. The Bidoof is still sitting in the road.',
  ), [
    ch('Try again.', bidoofFight('It gets up again. So do you. It looks, very slightly, pleased.')),
    ch('Walk on.', out('You walk on, round the Bidoof. It watches you all the way to the bend.', setTo('bidoof-end', 3))),
  ]),
  gev('gn-55-lucan', 'The Angry Bidoof: The Boy Who Laughed', bidoofTint({ stop: 'event', rarity: 'uncommon', tags: ['Story'], requires: [is('bidoof-insulted'), laterStage('bidoof-stage'), not('bidoof-lucan')], remembers: [
    { id: 'two', when: [{ kind: 'gn', test: 'hasMark', key: 'just-a-bidoof' }], notice: 'Then he sees what\'s walking beside you, and crosses a second road, and is gone.' },
  ] }), say(
    'A boy with an expensive belt, coming the other way. Lucan Fairweather. He sees you.',
    'He crosses the road.',
  ), [ch('Walk on.', out('You walk on. Somewhere, a Bidoof is sitting very still, and looking pleased with itself.', setTo('bidoof-lucan', 1)))]),
];

export const EVENTS: Json[] = [...gn44, ...gn45, ...gn46, ...gn47, ...gn48, ...gn49, KANTO_SNORLAX, ...gn50, ...gn51, ...gn52, ...gn53, ...gn54, ...gn55];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-44-door': {
    gn: 'gn.44', shape: 'Hub', earliest: 'A6', home: 15, window: [13, 18], sits: 'optional', attaches: 'town', tags: ['Tournament Episode'],
    level: 'All scaled to the Pokémon the player enters (same level; the champion one higher)', often: 'region', badge: 'own',
    dressing: { kanto: 'The 1v1 Championship', elsewhere: 'The 1v1 Championship' },
    note: 'Badge: a single star. Once per region. Gideon Tolland and Señora Dolores Vantongeren are always rounds 3 and 6, and remember the last entrant within the run (no memory across runs). Until towns exist it sits on step 15.',
  },
  'gn-46-door': {
    gn: 'gn.46', shape: 'Hub', earliest: 'A12', home: 16, window: [14, 18], sits: 'optional', attaches: 'town', tags: ['Tournament Episode', 'Reunion Episode'],
    level: 'A+1; the final A+2', often: 'run', badge: 'own',
    dressing: { kanto: 'The All-Star Tournament', elsewhere: 'The All-Star Tournament' },
    note: 'Badge: three stars. Once per run, late; needs seven named trainers met this run. Until towns exist it sits on step 16. Entrants are drawn from the trainers fought this run (core/greenneedle/allstar.ts); the strongest rival is always in the final.',
  },
  'gn-47-door': {
    gn: 'gn.47', shape: 'Single', earliest: 'A8', home: 15, window: [13, 17], sits: 'optional', attaches: 'town', tags: ['Onlooker'],
    level: 'If invited: A+2, with no loss cost', often: 'region', badge: 'own',
    dressing: { kanto: 'The Pokémon League Exhibition', elsewhere: 'The Pokémon League Exhibition' },
    note: 'Badge: a ticket. Once per region; each matchup once per run. Until towns exist it sits on step 15. The match is told in three parts (core/greenneedle/exhibition.ts); a move watched closely is free once at any move tutor; a trainer in a later stage copies a move from it.',
  },
  'gn-48-door': {
    gn: 'gn.48', shape: 'Hub', earliest: 'A7', home: 14, window: [12, 17], sits: 'optional', attaches: 'town', tags: ['Tournament Episode'],
    level: 'A+0; the bracket A+1', often: 'region', badge: 'own',
    dressing: { kanto: 'The Pokémon Draft', elsewhere: 'The Pokémon Draft' },
    note: 'Badge: a clipboard. Once per region. Until towns exist it sits on step 14. Six picks from cards (core/greenneedle/draft.ts), five battles, a bracket of three; one drafted Pokémon may stay. Its trainer writes once a region (gn-48-letter).',
  },
  'gn-48-letter': {
    gn: 'gn.48', shape: 'Single', earliest: 'A7', home: 3, window: [1, 6], sits: 'optional', attaches: 'after', tags: ['Tournament Episode'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'A Letter', elsewhere: 'A Letter' },
    note: 'Once a region, while a drafted Pokémon that stayed is with you: its first trainer writes. "Write back." gives it Bond +1.',
  },
  'gn-49-hill': {
    gn: 'gn.49', shape: 'Single', earliest: 'A3', home: 9, window: [7, 12], sits: 'must-see', attaches: 'before', tags: ['Interrupting Episode'],
    level: 'If fought: A+2, double HP', often: 'run', badge: 'own',
    dressing: { kanto: 'Snorlax Blockade', kantoStage: 'The route (cs.kanto.route.snorlax)', elsewhere: 'The Sleeping Snorlax' },
    note: 'Badge: a large "Zzz". Lies across a single-node column, so there is no way round on the map. In Kanto the canon space cs-kanto-route-snorlax shows it instead.',
  },
  'gn-49-later': {
    gn: 'gn.49', shape: 'Single', earliest: 'A3', home: 9, window: [5, 14], sits: 'optional', attaches: 'before', tags: ['Interrupting Episode'],
    level: 'None', often: 'run', badge: 'own',
    dressing: { kanto: 'The Sleeping Snorlax, Again', elsewhere: 'The Sleeping Snorlax, Again' },
    note: 'Afterstory: a Snorlax that did not join, asleep across the road in a later region. Fought, it needs "Ask nicely."',
  },
  'gn-50-offer': {
    gn: 'gn.50', shape: 'Region-long', earliest: 'A5', home: 8, window: [6, 11], sits: 'must-see', attaches: 'before', tags: ['Evil Team', 'Interrupting Episode', 'Region-Wide Story'],
    level: 'The theft: A+1. The defector as a boss: A+2', often: 'region', badge: 'None',
    beats: [
      { beat: 'The offer (must-see, before the battle)', event: 'gn-50-offer', stage: 'S3', home: 8, window: [6, 11] },
      { beat: 'Meeting 1 (optional, after the battle)', event: 'gn-50-meet-1', stage: 'S4', home: 13, window: [11, 16] },
      { beat: 'Meeting 2 (optional, after the battle)', event: 'gn-50-meet-2', stage: 'S5', home: 6, window: [4, 9] },
      { beat: 'The documents (after the battle)', event: 'gn-50-docs', stage: 'S6', home: 15, window: [13, 18] },
      { beat: 'The ending (must-see)', event: 'gn-50-end', stage: 'the team\'s climax (before the Hideout)' },
    ],
    dressing: { kanto: 'The Evil Team\'s Betrayal', elsewhere: 'The Evil Team\'s Betrayal' },
    note: 'Badge: none for the offer, a folded note after. Only in a region with an evil-team story. Corin Bellweather is rank and file, not the lieutenant. The three "their own story" pieces (gn-50-word-grunt / -town / -radio) sit after any battle in S4-S6, optional; gn-50-postcard comes in a later region after the 0-2 Trust ending.',
  },
  'gn-50-word-grunt': { gn: 'gn.50', shape: 'Single', earliest: 'A5', home: 10, window: [2, 18], sits: 'optional', attaches: 'after', tags: ['Evil Team'], stages: [4, 5, 6], level: 'None', often: 'region', badge: 'own', note: 'A beaten Grunt, at a team node. Badge: a folded note.' },
  'gn-50-word-town': { gn: 'gn.50', shape: 'Single', earliest: 'A5', home: 10, window: [2, 18], sits: 'optional', attaches: 'town', tags: ['Evil Team'], stages: [4, 5, 6], level: 'None', often: 'region', badge: 'own', note: 'A town NPC. Badge: a folded note.' },
  'gn-50-word-radio': { gn: 'gn.50', shape: 'Single', earliest: 'A5', home: 10, window: [2, 18], sits: 'optional', attaches: 'rest', tags: ['Evil Team'], stages: [4, 5, 6], level: 'None', often: 'region', badge: 'own', note: 'The team\'s radio chatter. Badge: a folded note.' },
  'gn-50-postcard': { gn: 'gn.50', shape: 'Single', earliest: 'A6', home: 4, window: [1, 8], sits: 'optional', attaches: 'rest', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory of the 0-2 Trust ending, in a later region.' },
  'gn-51-yard': {
    gn: 'gn.51', shape: 'Single', earliest: 'A6', home: 14, window: [12, 17], sits: 'side-branch', attaches: 'instead', tags: ['Evil Team'],
    level: 'Guards A+1', often: 'run', badge: 'own',
    dressing: { kanto: 'The Pokémon Smuggling Ring', elsewhere: 'The Pokémon Smuggling Ring' },
    note: 'Badge: a crate. Better at night. The rescued Pokémon walks beside the player and opens its own scene at each rest stop (run.ts) until it climbs in. Postcards (gn-51-postcard) come one a region afterwards.',
  },
  'gn-51-postcard': { gn: 'gn.51', shape: 'Single', earliest: 'A7', home: 4, window: [1, 8], sits: 'optional', attaches: 'rest', tags: ['Evil Team'], level: 'None', often: 'region', badge: 'own', note: 'Afterstory: one postcard a region, until all four are home.' },
  'gn-52-manor': {
    gn: 'gn.52', shape: 'Single', earliest: 'A8', home: 16, window: [14, 18], sits: 'side-branch', attaches: 'instead', tags: ['Evil Team'],
    level: 'If it comes to a fight: A+1', often: 'run', badge: 'own',
    dressing: { kanto: 'The Evil Team\'s Pokémon Auction', elsewhere: 'The Evil Team\'s Pokémon Auction' },
    note: 'Badge: a mask. At night. Only in a region with an evil-team story. SF125\'s pop-up black-market auction is a street-corner copy of this. gn-52-later (the lieutenant wonders, a later stage) and gn-52-sale (the manor for sale, a later region) are its afterstories.',
  },
  'gn-52-later': { gn: 'gn.52', shape: 'Single', earliest: 'A9', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Only when both auction traps were avoided.' },
  'gn-52-sale': { gn: 'gn.52', shape: 'Single', earliest: 'A9', home: 6, window: [2, 12], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: "Motivated seller." (a later region of the same run).' },
  'gn-53-alarm': {
    gn: 'gn.53', shape: 'World Event', earliest: 'A5', home: 12, window: [10, 14], sits: 'must-see', attaches: 'instead', tags: ['Evil Team'],
    level: 'Grunts A+0; district captains A+1; the commander A+2', often: 'region', badge: 'own',
    dressing: { kanto: 'The Sealed City', elsewhere: 'The Region Under Siege' },
    note: 'Badge: a burning tower. Only at the evil team\'s climax, or the stage before. Eight turns in rooms; the result shapes the next stage\'s shops and Center (run.ts). The rescued Pokémon waits at the next rest (gn-53-waiting); gn-53-plaque is the afterstory in a later region.',
  },
  'gn-53-plaque': { gn: 'gn.53', shape: 'Single', earliest: 'A6', home: 6, window: [2, 12], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: the plaque with the names of the allies who held (a later region of the same run).' },
  'gn-54-lake': {
    gn: 'gn.54', shape: 'Hub', earliest: 'A4', home: 10, window: [8, 13], sits: 'optional', attaches: 'town', tags: ['Community Episode'], needs: ['water'],
    level: 'The six-Magikarp trainer: A-2', often: 'region', badge: 'own',
    note: 'Badge: a fish with a ribbon. The town, once towns exist. Three attractions, five regulars and a secret. The board keeps every convention of this run (no memory across runs). gn-54-poster is the afterstory, once in each later region.',
  },
  'gn-54-poster': { gn: 'gn.54', shape: 'Single', earliest: 'A5', home: 6, window: [2, 14], sits: 'optional', attaches: 'town', tags: ['Community Episode'], level: 'None', often: 'region', badge: 'own', note: 'Afterstory: only once one of them has evolved at a convention.' },
  'gn-55-bidoof': {
    gn: 'gn.55', shape: 'Single', earliest: 'A4', home: 6, window: [4, 9], sits: 'optional', attaches: 'instead', tags: ['Miniature Episode'],
    level: 'A+2, and then some (a Bidoof\'s stats, tripled)', often: 'run', badge: 'own',
    note: 'Badge: a "!". It is the node\'s harder wild battle. Once a run (the doc\'s "once per save"). gn-55-lucan is the afterstory: the boy who laughed crosses the road (two, with the Bidoof in the party).',
  },
  'gn-55-lucan': { gn: 'gn.55', shape: 'Single', earliest: 'A5', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Miniature Episode'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: a later stage of the same run.' },
  'gn-45-field': {
    gn: 'gn.45', shape: 'Single', earliest: 'A10', home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', tags: ['Companion Story'],
    level: 'The lesson A−1 (three Pokémon); the exam A+2 (six)', often: 'run', badge: 'own',
    dressing: { kanto: 'The Champion\'s Training Session', elsewhere: 'The Champion\'s Training Session' },
    note: 'Badge: a laurel. Once per run, Reputation 3 or more. Instead of the battle. The Champion is the region\'s own (the cast League Champion once cast). Passing the exam teaches the ace Summit, The Long Game, With You or Seen It; at the real Champion battle that Champion opens with it.',
  },
};

export const CHAINS: Json[] = [];
