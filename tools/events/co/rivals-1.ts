// Catalog Overhaul Pack, rival questlines R1 to R3 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R1 The Circuit, R2 A Rival in Trouble, R3 The Promise Past the Ridge.
// Build: npm run co:build -- rivals-1
import { ch, fight, flag, heal, item, out, relic, room, type Json } from '../dsl.ts';
import { beat, done, due, feel, foe, mark, met, no, note, page, part, quest, R, rival, rq, RS, say, script, set, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

// ======================================================================================================
// R1. THE CIRCUIT (Tournament, Run-Long. Arc: The Race)
// ======================================================================================================
const SIGN = [flag('circuit-entered'), quest({ circuit: 'enter' }), done('R1.open')];
const matchWin = [quest({ circuit: 'win' })];
const MATCH_AGAIN = (id: string): Json => quest({ stamp: 'circuit-at', again: [id] });

const circuit: Json[] = [
  beat('rival-gauntlet-entry', 'The Circuit', { minStage: 2, requires: [met(1), due('R1.open')], cast: ['trainer.worker_m'], tint: '#38202a', effect: 'confetti' },
    script(
      page('A banner hangs across the plaza: THE CIRCUIT. Sixteen rungs, from Bronze to the Champion Cup.', 'On the board, beside rung one, a name is already chalked in. It is {rival}\'s.'),
      page(who('Clerk', 'They signed up an hour ago. Said you\'d come. Said you\'d be slower.'), who('Clerk', 'Sixteen rungs. One match per stage at most. The board updates itself.')),
      page('Across the plaza, {rival} has seen you. They do not come over. They only raise their voice.', RS('interrupt', { 'champion-chaser': 'Try to keep up. I\'m not waiting at the top.' })),
    ),
    [
      ch('"Sign up."', out(script(page('The clerk chalks your name under theirs. Rung one. The chalk squeaks on the last letter.', 'A small ladder appears at the top of your map: your rung, and {rival}\'s.')), ...SIGN)),
      ch('"What\'s the prize?"', out(script(page(who('Clerk', 'The Cup. And your name on the board for good.')), page('You take the chalk yourself. Rung one, right under {rival}.', 'A small ladder appears at the top of your map: your rung, and theirs.')), ...SIGN)),
      ch('"Not today."', out(script(page('The clerk shrugs and caps the chalk.', who('Clerk', 'Board\'s open at every plaza. You\'d start two rungs behind them, mind.')), page('{rival} is already walking to their first match. They climb alone.')), flag('circuit-late'), quest({ circuit: 'open' }), done('R1.open'))),
    ]),

  beat('rq-circuit-late', 'The Circuit: A Late Slip', { minStage: 3, requires: [yes('circuit-late'), no('circuit-entered'), rq({ stale: 'circuit-at' })], cast: ['trainer.worker_m'], tint: '#38202a', effect: 'confetti' },
    script(
      page('Another plaza. The same banner. The same board, with {rival}\'s name several rungs up it now.'),
      page(who('Clerk', 'Changed your mind? Late slips start two rungs behind the leader. Those are the rules, and I didn\'t write them.')),
    ),
    [
      ch('"Sign up."', out(script(page('Your name goes on the board, two rungs under {rival}\'s. It looks small down there.', 'A small ladder appears at the top of your map.')), flag('circuit-entered'), quest({ circuit: 'late' }))),
      ch('"Not today."', out('The clerk tucks the slip back into the box. It will be there at the next plaza.', MATCH_AGAIN('rq-circuit-late'))),
    ]),

  // Rungs 1 to 8, A+0. The three gap scenes are the remembered variants; "within two" is the clerk's own line.
  beat('ev-rival-rematch', 'The Circuit: Your Rung', { minStage: 2, requires: [yes('circuit-entered'), rq({ circuit: { rungAtMost: 8 }, stale: 'circuit-at' })], cast: ['trainer.worker_m'], tint: '#38202a', effect: 'confetti',
    remembers: [
      { id: 'ahead', when: [rq({ circuit: { gapAtLeast: 3 } })], intro: script(page(who('Clerk', 'Rung {rung}. Your opponent\'s the Kelsey girl; she beat your friend on Tuesday. Don\'t tell them I called them your friend.')), page('A ring of rope in a square. Forty people, a dog, a man selling skewers.'), page('On the plaza screen, the Rival Report. A photo: {rival} on a hillside at night, alone, drilling.', RS('pseudo', { underdog: 'Skipping a Gym to train. Don\'t get comfortable. I can see the back of your head from here.' }))) },
      { id: 'behind', when: [rq({ circuit: { gapAtMost: -3 } })], intro: script(page(who('Clerk', 'Rung {rung}. Your opponent\'s the Kelsey girl; she beat your friend on Tuesday. Don\'t tell them I called them your friend.')), page('A ring of rope in a square. Forty people, a dog, a man selling skewers.'), page(who('A woman in the queue', 'You\'ve the same jacket as... do you know them? The Circuit one? They signed my boy\'s hat.')), page('A newspaper lies on the counter with {rival}\'s photo on the front.', 'They do not look as pleased as the headline says.')) },
    ] },
    script(
      page(who('Clerk', 'Rung {rung}. Your opponent\'s the Kelsey girl; she beat your friend on Tuesday. Don\'t tell them I called them your friend.')),
      page('A ring of rope in a square. Forty people, a dog, a man selling skewers.'),
      page('The clerk takes your slip without looking up.', who('Clerk', 'Bookmakers have you level. I\'ve a week\'s wages on it. I\'m not saying which way.')),
    ),
    [
      ch('Step into the ring.', fight('The rope drops behind you. Forty people go quiet, and the dog does not.', foe('Kelsey', { cls: 'ace-trainer', size: 3, lv: 0, win: matchWin }), MATCH_AGAIN('ev-rival-rematch'))),
      ch('"Not this stage."', out('The clerk pencils a line through today. The rung will keep. So will Kelsey.', MATCH_AGAIN('ev-rival-rematch'))),
    ]),

  // Rungs 9 to 15 (not 14, the blackout), A+1.
  beat('rival-one-turn-duel', 'The Circuit: The Upper Rungs', { minStage: 3, requires: [yes('circuit-entered'), rq({ circuit: { rungAtLeast: 9, rungAtMost: 15, rungNot: 14 }, stale: 'circuit-at' })], cast: ['trainer.worker_m'], tint: '#38202a', effect: 'confetti',
    remembers: [
      { id: 'ahead', when: [rq({ circuit: { gapAtLeast: 3 } })], intro: script(page(who('Clerk', 'Rung {rung}. It\'s a hall now, not a rope. Your opponent\'s Old Barrow; he\'s held this rung for three seasons and he\'s tired of it.')), page('Real seats. A scoreboard. The man selling skewers has a proper stand, and a queue.'), page('On the hall screen, the Rival Report. A photo: {rival} on a hillside at night, alone, drilling.', RS('pseudo', { underdog: 'Skipping a Gym to train. Don\'t get comfortable. I can see the back of your head from here.' }))) },
      { id: 'behind', when: [rq({ circuit: { gapAtMost: -3 } })], intro: script(page(who('Clerk', 'Rung {rung}. It\'s a hall now, not a rope. Your opponent\'s Old Barrow; he\'s held this rung for three seasons and he\'s tired of it.')), page('Real seats. A scoreboard. The man selling skewers has a proper stand, and a queue.'), page(who('A woman in the queue', 'You\'ve the same jacket as... do you know them? The Circuit one? They signed my boy\'s hat.')), page('A newspaper lies on the counter with {rival}\'s photo on the front.', 'They do not look as pleased as the headline says.')) },
    ] },
    script(
      page(who('Clerk', 'Rung {rung}. It\'s a hall now, not a rope. Your opponent\'s Old Barrow; he\'s held this rung for three seasons and he\'s tired of it.')),
      page('Real seats. A scoreboard. The man selling skewers has a proper stand, and a queue.'),
      page('The clerk takes your slip, and this time looks at you.', who('Clerk', 'Bookmakers have you level. I\'ve a week\'s wages on it. I\'m not saying which way.')),
    ),
    [
      ch('Walk out under the lights.', fight('The hall hums. Somewhere up in the seats, somebody says your name like they know you.', foe('Old Barrow', { cls: 'ace-trainer', size: 4, lv: 1, win: matchWin }), MATCH_AGAIN('rival-one-turn-duel'))),
      ch('"Not this stage."', out('The clerk pencils a line through today. The rung will keep.', MATCH_AGAIN('rival-one-turn-duel'))),
    ]),

  // Rung 14: the blackout semifinal. Step 12, must-see.
  beat('rq-circuit-blackout', 'The Circuit: The Blackout Semifinal', { minStage: 3, requires: [yes('circuit-entered'), rq({ circuit: { rungAtLeast: 14, rungAtMost: 14 }, stale: 'circuit-at' })], tint: '#101018', effect: 'flicker' },
    script(
      page('Rung fourteen. The semifinal. The hall is full to the doors.'),
      page('Turn four. Every light in the hall goes at once.', 'Somebody screams, and laughs at themselves.'),
      page(who('Opponent, in the dark', 'Do we keep going?')),
    ),
    [
      ch('"Keep going."', fight('You fight on by the sound of it. Nobody can see where anything lands.', foe('Semifinalist', { cls: 'ace-trainer', size: 4, lv: 1, rule: { accuracyMult: 0.8, accuracyTurns: 3 }, win: matchWin }), quest({ stamp: 'circuit-at' }))),
      ch('"Wait."', fight(script(page('You wait. The dark is very large.', 'From high in the stands, one pair of hands. Slow. Steady. Then a second pair, joining. The hall breathes out.'), page('When the lights come back, {rival} is sitting down again, looking at the ceiling, as if it was nobody.')), foe('Semifinalist', { cls: 'ace-trainer', size: 4, lv: 1, win: matchWin }), feel({ trust: 1 }), quest({ stamp: 'circuit-at' }))),
      ch('Call to the crowd.', fight(script(page('You call up into the dark. One phone lights. Then forty. Then the whole hall is a field of small cold stars.', 'You finish the match by their light.')), foe('Semifinalist', { cls: 'ace-trainer', size: 4, lv: 1, win: matchWin }), flag('rep'), quest({ stamp: 'circuit-at' }))),
    ]),

  // The Champion Cup: the region's last stage once rung 16 is reached. Step 17, must-see, A+2.
  beat('rq-circuit-cup', 'The Circuit: The Champion Cup', { minStage: 4, requires: [yes('circuit-entered'), rq({ circuit: { rungAtLeast: 16, gapAtMost: 2 }, lastStage: true })], tint: '#38202a', effect: 'confetti', priority: 90,
    remembers: [{ id: 'late', when: [yes('circuit-late')], notice: note(page('At the door, the clerk stops you with one finger.', who('Clerk', 'You were the late one. Look at you.'))) }] },
    script(
      page('Rung sixteen. The board has only two names left on it.'),
      page(who('Commentator', 'Two careers. One board. One Cup.')),
    ),
    [ch('Walk out.', out('The tunnel is short. The noise at the end of it is not.', room('rq-circuit-final'), quest({ stamp: 'circuit-at' })))]),

  part('rq-circuit-final', 'The Circuit: The Final', { tint: '#38202a', effect: 'confetti' },
    script(
      page('{rival} is already on the field. Their ace is out first. It is never out first.'),
      page(RS('champion', { 'champion-chaser': 'I wanted you at full strength. It doesn\'t count otherwise. Nothing\'s counted that wasn\'t you.', underdog: 'I used to read your name on that board and feel sick. Now I just want to beat it.' })),
    ),
    [ch('Begin.', fight('The whole hall leans in.', rival({ lv: 2, size: 6, quest: { aceFirst: true, full: true }, win: [relic('circuit-cup', 'The Cup', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }]), feel({ respect: 2 }), quest({ end: 'R1' })], lose: [feel({ respect: 1 }), quest({ end: 'R1' })] })))]),

  // The player is three or more rungs ahead: the final is against a Road Roster trainer; the rival is in the stands, alone.
  beat('rq-circuit-cup-ahead', 'The Circuit: The Champion Cup', { minStage: 4, requires: [yes('circuit-entered'), rq({ circuit: { rungAtLeast: 16, gapAtLeast: 3 }, lastStage: true })], tint: '#38202a', effect: 'confetti', priority: 90,
    remembers: [{ id: 'late', when: [yes('circuit-late')], notice: note(page('At the door, the clerk stops you with one finger.', who('Clerk', 'You were the late one. Look at you.'))) }] },
    script(
      page('Rung sixteen. The board has only two names left on it, and neither is {rival}\'s.'),
      page(who('Commentator', 'Two careers. One board. One Cup.')),
      page('The final is against a stranger from the road, a good one.', 'You look for {rival} without meaning to. They are in the stands. Alone. Three empty seats on either side.'),
    ),
    [ch('Begin.', fight('They watch every turn. They do not clap. They do not leave.', foe('Road Champion', { cls: 'ace-trainer', size: 6, lv: 2, win: [relic('circuit-cup', 'The Cup', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }]), quest({ end: 'R1' })], lose: [quest({ end: 'R1' })] }), quest({ stamp: 'circuit-at' })))]),

  // The rival is three or more rungs ahead at the end: the player watches.
  beat('rq-circuit-watch', 'The Circuit: The Front Row', { minStage: 4, requires: [yes('circuit-entered'), rq({ circuit: { rivalRungAtLeast: 16, gapAtMost: -3 }, lastStage: true })], tint: '#38202a', effect: 'confetti', priority: 90 },
    script(
      page('The Champion Cup. You are not in it. {rival} got there three rungs ahead of you, and the board does not wait.'),
      page('Your seat is in the front row. It has your name on it, in {rival}\'s handwriting.'),
      page(who('Commentator', 'Two careers. One board. One Cup.'), '{rival} walks out. Before turn one, they find your seat. They wave. Just once. Then they turn to the field.'),
    ),
    [ch('Watch.', out(script(page('You watch every turn. You know what each of their Pokémon will do a half-second before it does it.', 'You did not know you knew that.')), feel({ respect: 1, friendship: 1 }), quest({ end: 'R1' })))]),
];

// ======================================================================================================
// R2. A RIVAL IN TROUBLE (Interrupting. Any arc)
// ======================================================================================================
const TROUBLE_FIGHT = (after: string, extra: Json[]): Json => foe('Wild Pokémon', { lineup: ['beartic', 'cubchoo', 'cubchoo'], size: 3, lv: 1, ally: 'rival', win: [room(after), ...extra] });

const trouble: Json[] = [
  // Beat 1. A3 or later, Step 11, side branch, hidden until the step before.
  beat('living-rival-rescue', 'A Rival in Trouble', { minStage: 3, requires: [met(1), due('R2.open')], tint: '#2a1d24', effect: 'rattle', pokemon: 'beartic' },
    script(
      page('You hear it before you see it: a crash, off the road, and a voice you know.'),
      page('{rival} is on one knee. Two of their Pokémon have fainted. Wild ones are closing in.'),
      page(RS('interrupt', { 'champion-chaser': 'Don\'t just stand there! ...please.', protector: '...' }), 'A Beartic rears up behind them.'),
    ),
    [
      ch('Fight beside them.', fight(script(page('You are off the road before you have decided to be. Their last Pokémon falls in beside yours.', RS('event', { protector: 'Left one. I\'ve got the... no. I haven\'t. You take both. I\'ll keep mine up.' }))), TROUBLE_FIGHT('rq-r2-after', []), feel({ trust: 2 }, { mark: 'the-hand-up' }), flag('rival-helped'), done('R2.open'))),
      ch('Help, then leave before they can thank you.', out(script(page('You break the circle from behind, loud and fast, and the wild ones scatter into the trees.', 'By the time {rival} looks up, the road is empty. They will find out later.')), feel({ trust: 1, admiration: 1 }), flag('rival-helped'), flag('rival-anonymous'), done('R2.open'))),
      ch('Walk past.', out(script(page('The main road goes on. So do you.', 'Behind you the noise goes on for a long time, and then it stops. They get out alone.')), feel({ trust: -2 }, { mark: 'left-standing' }), flag('rival-abandoned'), done('R2.open'))),
      ch('Wait and see.', out(script(page('You stay where you are, at the edge of the road, and watch.', 'They manage. Barely. Their last Pokémon is shaking when it is over.'), page('{rival} sees you standing there. They do not say anything. They pick up their bag.')), feel({ respect: 1, friendship: -1 }), flag('rival-watched'), done('R2.open'))),
    ]),

  part('rq-r2-after', 'A Rival in Trouble: After', { tint: '#2a1d24', effect: 'snow' },
    script(
      page('After. They are sitting in the snow, or the dust. Their Pokémon is asleep against their leg.'),
      page(RS('lost', { 'champion-chaser': 'I had it.' }), 'A long pause.', RS('lost', { 'champion-chaser': 'I didn\'t have it.' })),
    ),
    [ch('Sit down next to them for a minute.', out('Neither of you says anything else. It is the right amount to say.'))]),

  // Beat 2a. The Favour Returned: the first + node below half HP, same region.
  beat('living-rival-returns-favor', 'The Favour Returned', { minStage: 3, stop: 'heal', requires: [yes('rival-helped'), due('R2.favour', { hpBelow: 0.5 })], tint: '#1d2a24', effect: 'glint' },
    script(
      page('The Center. Your party is on the trolley. Somebody is leaning on the wall by the door, arms crossed.'),
      page(R('I don\'t owe anyone. So don\'t think this is that.')),
      page('The room is paid for. On the pillow: their best Berry, and under it, their second-best, in case.'),
    ),
    [ch('Take the room.', out(script(page('You sleep. Your team sleeps. When you come out in the morning, the wall by the door is empty.')), heal(1), item('lum-berry'), item('sitrus-berry'), done('R2.favour')))]),

  // Beat 2b. A Bitter Rival.
  beat('rival-asks-help-grudge', 'A Bitter Rival', { minStage: 3, stop: 'heal', requires: [yes('rival-abandoned'), due('R2.bitter')], tint: '#2a1d1d', effect: 'none' },
    script(
      page('The same Center. They are leaving as you come in. They stop in the doorway, with their back to you.'),
      page(R('You left me out there. I haven\'t forgotten. I got out. You should know I got out.')),
    ),
    [ch('Let them go.', out('The door swings shut behind them. It keeps swinging a little after.', done('R2.bitter')))]),

  // The anonymous line, two stages on.
  beat('rq-r2-anonymous', 'Somebody Helped Me', { minStage: 3, requires: [yes('rival-anonymous'), due('R2.anon')], tint: '#2a1d24', effect: 'none' },
    script(
      page('{rival} falls into step with you for a stretch of road, which they have never done.'),
      page(R('Somebody helped me back there. Didn\'t stay. If I find out who...'), 'They look at you a second too long.', R('...I\'ll have to be polite to them. I\'d hate that.')),
    ),
    [ch('Say nothing.', out('They peel off at the next fork. You are almost sure they were smiling.', done('R2.anon')))]),

  // Finale: the region's end battle. Step 17, A+2.
  beat('rq-r2-finale', 'A Rival in Trouble: What Is Owed', { minStage: 3, requires: [due('R2.finale')], tint: '#2a1d24', effect: 'glint', priority: 80,
    remembers: [
      { id: 'helped', when: [yes('rival-helped')], notice: note(page(R('I owe you one. This is it.'), 'They leave one Ball on their belt. The one they picked to beat you with.')) },
      { id: 'abandoned', when: [yes('rival-abandoned')], notice: note(page('They do not say anything. Their first Ball is already in their hand, and they are looking straight at {lead}.')) },
      { id: 'watched', when: [yes('rival-watched')], notice: note(page(R('You\'d have let me lose.'))) },
    ] },
    script(page('The end of the region. {rival} is waiting where the road narrows, the way they always are.')),
    [ch('Battle.', fight('The usual. Which with them is never usual.', rival({ lv: 2, quest: { counter: 'owed' }, win: [feel({ respect: 1 })] }), done('R2.finale')))]),

  // Amends: abandoned, next region, Stage 3, the same branch, worse. The game says nothing about second chances.
  beat('ev-rival-emergency', 'A Rival in Trouble, Again', { minStage: 6, requires: [yes('rival-abandoned'), due('R2.amends')], tint: '#2a1d24', effect: 'rattle', pokemon: 'beartic' },
    script(
      page('The same kind of crash, off the same kind of road.'),
      page('{rival} is down on both knees this time. All but one of their Pokémon have fainted. There are more wild ones than before.'),
      page('They see you. They do not ask.'),
    ),
    [
      ch('Fight beside them.', fight(script(page('You do not walk past. Their last Pokémon looks at you, and then at them, and then steps in next to yours.')), TROUBLE_FIGHT('rq-r2-after', []), feel({ trust: 2 }, { mark: 'the-hand-up' }), set('rival-abandoned', 0), flag('rival-helped'), done('R2.amends'))),
      ch('Help, then leave before they can thank you.', out(script(page('You scatter the wild ones and keep walking. This time they see your back as you go.', 'It is enough. It is also not nothing.')), feel({ trust: 1, admiration: 1 }), set('rival-abandoned', 0), flag('rival-helped'), done('R2.amends'))),
      ch('Walk past.', out('The main road goes on. So do you. Again.', feel({ trust: -2 }), done('R2.amends'))),
      ch('Wait and see.', out('They manage. You do not know how. Neither do they.', feel({ respect: 1, friendship: -1 }), done('R2.amends'))),
    ]),
];

// ======================================================================================================
// R3. THE PROMISE PAST THE RIDGE (Arc: The Truce, The Goodbye. Needs Mark By a Thread)
// ======================================================================================================
const PROMISE = [flag('rival-promise-made'), done('R3.open')];
const KEPT_WIN = [feel({ respect: 2 }), flag('rival-promise-kept'), quest({ handshake: true }), room('rq-r3-handshake'), done('R3.finale')];
// The rival wins: no gloating, and a second promise for the next region's end.
const KEPT_LOSE = [feel({ respect: 2 }), flag('rival-promise-kept'), flag('rival-promise-second'), quest({ again: ['living-rival-promise-kept'] }), set('rq-r3-start', 0), done('R3.open'), room('rq-r3-second')];

const promise: Json[] = [
  // Beat 1: straight after a By a Thread battle, on the same node.
  beat('living-rival-promise', 'The Promise Past the Ridge', { minStage: 2, requires: [met(1), due('R3.open', { mark: 'by-a-thread' })], tint: '#24202a', effect: 'glint' },
    script(
      page('The battle was close. Too close to feel like an ending. Both of you are still breathing hard.', '{rival} points at the next ridge.'),
      page(R('Not here. Not like this. Meet me at the end of the next region. Full teams.'), RS('event', { enthusiast: 'Promise? PROMISE? Pinky promise.' })),
    ),
    [
      ch('"Promise."', out('A small flag goes on your map, on the last node of the next region. You can see it from here.', ...PROMISE)),
      ch('"Why wait?"', out(script(page(R('Because I want to be ready. So do you.')), page('You promise. A small flag goes on your map, on the last node of the next region.')), ...PROMISE)),
      ch('"No promises."', out(script(page(R('Fine. I\'ll be there anyway.')), page('The flag goes on your map all the same. They put it there, not you.')), feel({ friendship: -1 }), flag('rival-promise-open'), done('R3.open'))),
    ]),

  // Beats 2 and 3: A Rival Training Hard, next region, Stages 2 and 5, Step 2, at dawn. Optional, Hidden.
  beat('living-rival-montage', 'A Rival Training Hard', { minStage: 3, requires: [due('R3.train1')], tint: '#2a2620', effect: 'glint' },
    script(
      page('First light. A field. The same move, again. {rival}\'s lead is breathing hard.'),
      page('{rival}, to it, not knowing they are heard:', R('Thirty-one. Not for me. For the ridge. Thirty-two.')),
    ),
    [
      ch('Watch.', out('They pretend not to notice you. Their next call is a little louder, a little cleaner. Thirty-three.', feel({ respect: 1 }), done('R3.train1'))),
      ch('Join in.', out(script(page('They do not stop. They move over. Two leads, side by side, the same move, out of time, and then in time.'), page(RS('event', { enthusiast: 'Forty! You did forty! You weren\'t even asked!' }))), feel({ friendship: 1 }), quest({ learn: true }), done('R3.train1'))),
      ch('Leave quietly.', out('You go back the way you came. The counting goes on behind you.', done('R3.train1'))),
    ]),

  beat('ev-rival-sighted', 'A Rival Training Hard: The Second Morning', { minStage: 3, requires: [due('R3.train2')], tint: '#2a2620', effect: 'glint' },
    script(page('First light again. The same field, or one just like it. The same move.', 'They have stopped counting aloud.')),
    [
      ch('Watch.', out('They pretend not to notice you. They are worse at pretending than last time.', feel({ respect: 1 }), done('R3.train2'))),
      ch('Join in.', out(script(page('They move over before you have asked. There is a worn patch in the grass beside them, exactly the size of {lead}.')), feel({ friendship: 1 }), done('R3.train2'))),
      ch('Leave quietly.', out('You go. The ridge is closer than it was.', done('R3.train2'))),
    ]),

  // Finale: the next region's Stage 8, Step 18, must-see. A+2, six on six, no counter-picks.
  beat('living-rival-promise-kept', 'The Promise Kept', { minStage: 4, requires: [due('R3.finale')], tint: '#24202a', effect: 'glint', priority: 90,
    remembers: [
      { id: 'second', when: [yes('rival-promise-second')], notice: note(page(R('Second time. Same flag. Same rules.'), 'They have brought two flasks this time. One of them is for you.')) },
      { id: 'open', when: [yes('rival-promise-open')], notice: note(page(R('...You came. You didn\'t have to.'))) },
    ] },
    script(
      page('The flag. They are standing next to it. They have been there a while; there is a flask, and it is empty.'),
      page(R('You came. Good.'), 'They do not say anything else. They throw first.'),
    ),
    [
      ch('Throw.', fight('Six on six. Nothing picked to beat you. Only everything they have.', rival({ lv: 2, size: 6, quest: { counter: 'none', full: true }, win: KEPT_WIN, lose: KEPT_LOSE }))),
      ch('Take the other path. (The flag is on this one.)', out(script(page('The flag is on the other path. You know it is. You go the way that is not that way.'), page('Behind you, somebody waits a whole stage.')), room('rival-map-note'))),
    ]),

  part('rq-r3-handshake', 'The Promise Kept: The Handshake', { tint: '#24202a', effect: 'sparkle' },
    script(
      page('It is over. {rival} crosses the field and puts their hand out. It is not steady. Neither is yours.'),
      page(R('That last move. The one that did it. Tell me its name.'), 'You tell them.', R('I\'m going to learn it. I\'m going to be insufferable with it.')),
    ),
    [ch('Shake.', out('For the rest of the run, both of your aces stand a little taller.'))]),

  part('rq-r3-second', 'The Promise Kept: Same Rules', { tint: '#24202a', effect: 'glint' },
    script(
      page('It is over, and it went their way. There is no gloating in them at all.'),
      page(R('Next region. Same rules.'), 'A second flag goes on your map.'),
    ),
    [ch('"I\'ll be there."', out('They nod. They pick up the empty flask. They are already walking.'))]),

  // A Note Left Behind: the player did not come (took the other path, or never reached the flag's stage).
  beat('rival-map-note', 'A Note Left Behind', { minStage: 4, requires: [due('R3.note')], tint: '#20202a', effect: 'none' },
    script(page('A signpost, a stage later. Something is scratched into the wood with a key, in a hand you know.', '"Waited. You didn\'t come."')),
    [ch('Read it twice.', out('You run your thumb over the letters. They pressed hard.', feel({ trust: -3 }), flag('rival-promise-broken'), done('R3.note')))]),
];

export const EVENTS: Json[] = [...circuit, ...trouble, ...promise];

// Old ids folded into the scenes above.
export const REMOVE: string[] = [
  'rival-rematch', // -> ev-rival-rematch (a Circuit match)
  'living-gauntlet-rest', // -> rival-gauntlet-entry (the Circuit replaces the gauntlet's bench)
  'rival-asks-help', // -> living-rival-rescue
  'rival-asks-help-repaid', // -> living-rival-returns-favor
  'rival-promise-make', // -> living-rival-promise (the cross-run promise is out: nothing carries to another run)
  'rival-promise-kept', // -> living-rival-promise-kept
  // Beta 0.6 shortened builds of the same questlines.
  'rq-rival-in-trouble', 'rq-favour-returned', 'rq-someone-helped', 'rq-bitter-rival', 'rq-in-trouble-again',
  'rq-promise', 'rq-rival-training', 'rq-promise-kept',
  // Their one-line flag readers: the rebuilt scenes read these flags now.
  'rq-echo-promise-broken', 'rq-echo-promise-kept', 'rq-echo-amends',
];
void mark; void say;
