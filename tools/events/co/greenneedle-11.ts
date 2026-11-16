// Greenneedle, part 11: gn.44 The 1v1 Championship (doc GREENNEEDLE_REWORKED_PLACED_10.md).
// Build: npm run co:build -- greenneedle-11   then   npm run co:gn
import { $, any, br, ch, fight, flag, heal, item, join, out, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, gev, gn, is, moment, not, notThisRegion, rm, roll, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

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
  ch('Shout.', out(`You shout, from your boots up. **Noise:** ${bar}`, scene(i < 2 ? `gn-49-noise-${i + 2}` : 'gn-49-woke-music'))),
  ch('Hold and tap.', out(`You hold and tap, steady as a drum. **Noise:** ${bar}`, scene(i < 2 ? `gn-49-noise-${i + 2}` : 'gn-49-woke-music'))),
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

export const EVENTS: Json[] = [...gn44, ...gn45, ...gn46, ...gn47, ...gn48, ...gn49, KANTO_SNORLAX];
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
  'gn-45-field': {
    gn: 'gn.45', shape: 'Single', earliest: 'A10', home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', tags: ['Companion Story'],
    level: 'The lesson A−1 (three Pokémon); the exam A+2 (six)', often: 'run', badge: 'own',
    dressing: { kanto: 'The Champion\'s Training Session', elsewhere: 'The Champion\'s Training Session' },
    note: 'Badge: a laurel. Once per run, Reputation 3 or more. Instead of the battle. The Champion is the region\'s own (the cast League Champion once cast). Passing the exam teaches the ace Summit, The Long Game, With You or Seen It; at the real Champion battle that Champion opens with it.',
  },
};

export const CHAINS: Json[] = [];
