// Catalog Overhaul Pack, rival questlines R4 to R6 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R4 The Stone on the Hill, R5 Their Mentor Comes Calling, R6 The Post-Mortem.
// Build: npm run co:build -- rivals-2
import { ch, fight, flag, out, room, type Json } from '../dsl.ts';
import { beat, done, due, feel, feels, met, no, note, page, part, quest, R, rival, rq, RS, script, set, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

const is = (key: string, value: number): Json => ({ kind: 'flag', key, atLeast: value, atMost: value });

// ======================================================================================================
// R4. THE STONE ON THE HILL (Arc: The Fall). Three beats: the stone (A6+), the cautious stage (S+1), the young one (S+2).
// ======================================================================================================
const STONE = [quest({ lost: true }), done('R4.open')];
const YOUNG = (win: Json[] = []): Json => rival({ lv: 2, quest: { young: true }, win, lose: [] });
const SEND_YOUNG = page('They send it out first. It wobbles on the grass. It looks back at {rival}, once.', 'Then it stands up anyway, and faces you.');

const stone: Json[] = [
  beat('rival-memorial', 'The Stone on the Hill', { minStage: 6, requires: [met(1), due('R4.open')], tint: '#2a2a33', effect: 'fog',
    // The Empty Slot (NE36, the new-events file) may already have told you there was one fewer on their belt.
    remembers: [
      { id: 'grief', when: [yes('rival-grief-shared')], notice: note(page('They told you about it once, by the empty slot on their belt. You remember how their voice went.', 'Now you know where it went.')) },
      { id: 'knew', when: [yes('rival-knows-lost')], notice: note(page('You knew there was one fewer on their belt. You never asked why.', 'Now you know.')) },
    ] },
    script(
      page('A small stone on a hill above the path. Wilted flowers lean against it, brown at the edges.', 'Beside them, on a frayed cord, lies a Poké Ball charm. You know it. It is {rival}\'s.'),
      page('Nobody is here.', 'Carved into the stone, badly, with a knife: a Pokémon\'s name. {lost}.'),
      page('The letters go deep, then shallow, then deep again. Somebody stopped carving more than once.', 'And every time, they came back and started again.'),
    ),
    [
      ch('"Leave fresh flowers."', out(script(
        page('You pick what grows on the hill: small white flowers, nothing grand. You lay them by the stone and carry the dead ones away.'),
        page('Someone will climb this hill again. They will see the flowers and stand very still.', 'Only one person could have left them. They will know.'),
      ), feel({ friendship: 2 }), flag('rival-memorial-flowers'), ...STONE)),
      ch('"Wait for them."', out(script(
        page('You sit down with your back to the stone. The sun moves. The wind moves. Nothing else does.'),
        page('The afternoon goes long and gold, and then grey.'),
      ), flag('rival-memorial-waited'), ...STONE, room('rq-r4-dusk'))),
      ch('"Take the charm to give back."', out(script(
        page('You lift the charm. The cord is damp. It has been lying here through rain.'),
        page('You wrap it in a cloth and put it where nothing in your bag can scratch it.', 'You will give it back. You do not know yet what you will say.'),
      ), flag('rival-memorial-charm'), ...STONE)),
    ]),

  // "Wait for them" takes the branch's next node: dusk. A quiet scene, no battle.
  part('rq-r4-dusk', 'The Stone on the Hill: Dusk', { tint: '#1f1d2e', effect: 'fog' },
    script(
      page('At dusk, footsteps on the path. {rival} stops dead when they see you.', 'For a moment they look ready to turn round and go. They do not. They sit down on the other side of the stone.'),
      page('They are not looking at you.', R('It wasn\'t a battle.'), R('It just... wasn\'t there one morning.')),
      page(RS('event', {
        'bitter-challenger': 'Say something kind and I\'m leaving. ...Don\'t leave.',
        'champion-chaser': 'I kept training. I thought if I kept moving it wouldn\'t catch up. It caught up.',
        enthusiast: 'I keep turning round to tell it things. Every time. I\'m still doing it.',
        idealist: 'I told it we\'d see the whole world. It saw some of it. I keep telling myself that\'s something.',
        strategist: 'I\'ve run it back a hundred times. There\'s no move I missed. Somehow that\'s worse.',
        protector: 'Keeping them safe was the whole job. I was asleep. I was right there, asleep.',
        prodigy: 'Everybody says it wasn\'t my fault. I know it wasn\'t. Knowing doesn\'t do anything.',
        underdog: 'It was the first one who ever picked me. Out of everybody. It picked me.',
      })),
      page('A long quiet. Then, so softly the wind nearly takes it, they say the name.', '{lost}.', 'It is the first time you have ever heard them say it.'),
    ),
    [
      ch('Sit with them.', out(script(page('You stay until the stars come out. Neither of you says another word.', 'When they finally stand, they touch the stone once, the way you would touch a shoulder.'), page(R('...Thanks for not talking.'))))),
      ch('Say the name back.', out(script(page('"{lost}," you say. Quietly. Just to the stone.'), page('{rival} nods, once, hard, and looks away down the hill.', R('Yeah. That was it. That was its name.'))))),
    ]),

  // The cautious stage (S+1): whatever their style, they keep their weakest Pokémon out of harm for one stage.
  beat('rq-r4-cautious', 'The Stone on the Hill: A Careful Stage', { minStage: 7, requires: [due('R4.cautious')], tint: '#2a2a33', effect: 'none',
    remembers: [
      { id: 'charm', when: [yes('rival-memorial-charm')], notice: note(
        page('Their eyes drop to your bag. To the frayed cord hanging out of it.', R('That\'s mine. You went up there. You went up there and you TOOK it.')),
        page('Their hands are shaking. Then, all at once, they are not.', R('...You were keeping it safe. Weren\'t you.'), 'You give it back. Their fist closes round it and does not open.'),
      ) },
      { id: 'flowers', when: [yes('rival-memorial-flowers')], notice: note(
        page(R('Somebody left flowers on the hill.'), 'They do not ask. They look at you, and they already know.', R('...White ones. It liked white ones.')),
      ) },
      { id: 'waited', when: [yes('rival-memorial-waited')], notice: note(page('They nod to you, once. Neither of you mentions the hill. Neither of you has to.')) },
    ] },
    script(
      page('On a screen outside the Center, the Rival Report. A photo of {rival} in the same chair by the window.', 'Under it, three dates. Three stages running. The same Center, the same chair, a different day.'),
      page('Then {rival} is in front of you, one Poké Ball in hand. They look tired. They look careful.', R('Battle. Properly. I need to.')),
    ),
    [
      ch('Battle them.', fight(script(
        page('They send out their team, but not all of it. The smallest one stays clipped to their belt, held back behind everything else.'),
        page(RS('event', {
          strategist: 'It\'s the correct play.',
          'champion-chaser': 'It sits this one out. Don\'t ask why. I can win without it.',
          'bitter-challenger': 'Don\'t look at it. You don\'t get to look at it.',
          enthusiast: 'It\'s just watching today! It likes watching! ...It\'s fine. It\'s watching.',
          idealist: 'Nothing gets hurt today. Not if I can help it. Not one thing.',
          protector: 'It stays behind me. Everything stays behind me now.',
          prodigy: 'Optimal order. It goes last. It\'s a sound decision. It\'s sound.',
          underdog: 'It\'s not ready. I\'m not ready. One of us has to be careful.',
        }), 'It is not the right play. You both know it is not.'),
      ), rival({ lv: 1, quest: { guard: true } }), quest({ stamp: 'rq-r4-cautious' }), done('R4.cautious'))),
      ch('"Not today. Look after yourself."', out(script(page(R('...Yeah. You too.')), page('They go back inside. The chair by the window is free. They take it.')), quest({ stamp: 'rq-r4-cautious' }), done('R4.cautious'))),
    ]),

  // The finale (S+2): the next rival battle. A young Pokémon of the same species.
  beat('rq-r4-finale', 'The Stone on the Hill: This One\'s New', { minStage: 8, requires: [due('R4.finale')], tint: '#2a2a33', effect: 'sparkle', priority: 80 },
    script(
      page('{rival} is waiting by the path. For once they do not reach for a Poké Ball.', 'Something small is pressed against their leg. The same kind. A young {lost}, all ears and eyes.'),
      page('It doesn\'t know what it\'s standing in for.', R('This one\'s new.')),
    ),
    [
      ch('"What\'s its name?"', out('', done('R4.finale'), room('rq-r4-name'))),
      ch('"It looks strong."', fight(script(page('{rival} almost smiles. It is the first time in a while.', R('It is. It\'s going to be.')), SEND_YOUNG), YOUNG(), done('R4.finale'))),
      ch('(Nod.)', fight(script(page('You nod. They nod back. That is the whole conversation, and it is a good one.'), SEND_YOUNG), YOUNG(), done('R4.finale'))),
    ]),

  // "What's its name": three names, or "It'll tell you". Whatever is chosen is its name in every later scene ({young}).
  part('rq-r4-name', 'The Stone on the Hill: A Name', { tint: '#2a2a33', effect: 'sparkle',
    remembers: [{ id: 'waited', when: [yes('rival-memorial-waited')], notice: note(page('They look at you, then away.', R('I thought I\'d ask you. That\'s stupid. Is that stupid?'))) }] },
    script(page(R('...I haven\'t. Not yet. I keep nearly.'), 'They look down at it. It looks up at them, waiting, the way little ones do.')),
    [
      ch('"Ember."', fight(script(page(R('Ember.'), 'They try it out loud. The little one\'s ears go straight up.', R('...Yeah. Okay. Ember.')), SEND_YOUNG), YOUNG(), set('rq-r4-name', 1))),
      ch('"Pip."', fight(script(page(R('Pip.'), 'It sneezes. {rival} laughs, properly, the first laugh you have heard from them in a long time.', R('Pip, then. It\'s decided.')), SEND_YOUNG), YOUNG(), set('rq-r4-name', 2))),
      ch('"Echo."', fight(script(page(R('Echo.'), 'They are quiet for a moment. You both know why that one fits.', R('...Echo. Yeah.')), SEND_YOUNG), YOUNG(), set('rq-r4-name', 3))),
      ch('"It\'ll tell you."', fight(script(page(R('...Yeah.'), 'They crouch down to its height, as if listening for something.', R('Yeah. It will.')), SEND_YOUNG), YOUNG(), set('rq-r4-name', 4))),
    ]),
];

// ======================================================================================================
// R5. THEIR MENTOR COMES CALLING (Interrupting). One battle at A+2 on a must-see bridge, then the mentor's ask (S+1).
// ======================================================================================================
const BRIDGE = page('A narrow bridge over fast water. A weathered trainer stands in the middle of it and does not step aside.', 'They stand the way {rival} stands: weight on the back foot, one hand near the belt.');
const FLINCH = page(who('Mentor', 'They flinch there. You\'ve seen them flinch there. I spent two years on it.'), who('Mentor', 'They still do it when it\'s you.'));
const ASK = quest({ pick: { key: 'rival-mentor-ask', cases: [{ feeling: 'resentment', atLeast: 6, value: 1 }, { feeling: 'friendship', atLeast: 6, value: 2 }], otherwise: 3 } });
// The mentor's style is the rival's, done properly: every habit they have, with the mistake taken out (the counter they meant to bring).
const MENTOR = rival({ lv: 2, quest: { as: 'Mentor', counter: 'lead', full: true },
  win: [quest({ openFirst: ['rq-r5-apology', 'rq-r5-train', 'rq-r5-lesson'] })],
  lose: [quest({ ledger: true, end: 'R5' }), room('rq-r5-lost')] });
const LETTER = { id: 'letter', when: [yes('rival-read-letter')], notice: note(page(who('Mentor', 'One more thing. That letter they read. I wrote it.'), who('Mentor', 'Don\'t tell them. Please. They need to believe somebody out there just believed in them.'))) };

const mentor: Json[] = [
  beat('rival-mentor-appears', 'Their Mentor Comes Calling', { minStage: 5, requires: [met(1), due('R5.open')], cast: ['trainer.black_belt_m'], tint: '#22303a', effect: 'rain',
    remembers: [
      { id: 'resentment', when: [feels('resentment', 6)], intro: script(BRIDGE, page(who('Mentor', 'You\'ve been unkind to my student.'), who('Mentor', 'They don\'t say so. I taught them to hide it. I can still tell.'))) },
      { id: 'friendship', when: [feels('friendship', 6)], intro: script(BRIDGE, page(who('Mentor', 'You\'ve been good for my student. I want to see why.'), who('Mentor', 'They laugh on the phone now. They never used to laugh on the phone.'))) },
    ] },
    script(BRIDGE, page(who('Mentor', 'I wanted to see who they keep talking about.'), who('Mentor', 'Every letter, every call. You. So.'))),
    [
      ch('"Battle me."', fight(script(page(who('Mentor', 'Good. No speeches.'), 'They let the bag slide off their shoulder.'), FLINCH), MENTOR, ASK, done('R5.open'))),
      ch('"What do you want?"', fight(script(page(who('Mentor', 'To see it. Not to hear about it. To see it.'), 'They let the bag slide off their shoulder.'), FLINCH), MENTOR, ASK, done('R5.open'))),
      ch('"Ask them yourself."', fight(script(page(who('Mentor', 'I did. They talked for an hour and told me nothing.'), who('Mentor', 'So I\'m asking you. The other way.')), FLINCH), MENTOR, ASK, done('R5.open'))),
    ]),

  // The three asks (the relationship when the mentor stepped onto the bridge).
  part('rq-r5-apology', 'Their Mentor: An Apology', { cast: ['trainer.black_belt_m'], tint: '#22303a', effect: 'none', requires: [is('rival-mentor-ask', 1)], remembers: [LETTER] },
    script(
      page(who('Mentor', 'Well fought. Now the part you won\'t like.'), who('Mentor', 'An apology. In person. Not a message. Not through me.')),
      page(who('Mentor', 'Next stage, they\'ll be where I tell them. It\'s on your map.'), who('Mentor', 'Go or don\'t. I\'ll know either way.')),
    ),
    [
      ch('"I\'ll go."', out(script(page(who('Mentor', 'Then I\'ll stop worrying. A bit.'), 'They walk off the bridge without looking back.')), flag('rival-mentor-apology'))),
      ch('"I\'ll think about it."', out(script(page(who('Mentor', 'Think fast. They\'re not good at waiting. I never taught them that.'), 'They walk off the bridge without looking back.')), flag('rival-mentor-apology'))),
    ]),
  part('rq-r5-train', 'Their Mentor: Train Together', { cast: ['trainer.black_belt_m'], tint: '#22303a', effect: 'none', requires: [is('rival-mentor-ask', 2)], remembers: [LETTER] },
    script(
      page(who('Mentor', 'Well fought. So that\'s why.'), who('Mentor', 'Here\'s my ask. Train with them for a stage. Walk the road together. Spar when you stop.')),
      page(who('Mentor', 'They\'ll pretend it was their idea. Let them.')),
    ),
    [
      ch('"Deal."', out(script(page('The mentor nods, and is gone across the bridge before you can ask anything else.')), flag('rival-mentor-trained'))),
    ]),
  part('rq-r5-lesson', 'Their Mentor: The Lesson', { cast: ['trainer.black_belt_m'], tint: '#22303a', effect: 'glint', requires: [], remembers: [LETTER] },
    script(
      page(who('Mentor', 'Well fought. Then you get what they got.')),
      page(who('Mentor', 'I told them: "Don\'t look at the one that\'s attacking. Look at the one that\'s waiting."'), who('Mentor', 'They hated it. You\'ll hate it.')),
    ),
    [
      ch('"Show me."', out(script(page('They show you. It takes the rest of the afternoon, and you do hate it.', 'For the rest of this region, in trainer battles, you can see which Pokémon is waiting to come in next.')), flag('rival-mentor-lesson'), quest({ stamp: 'rq-r5-lesson', end: 'R5' }))),
    ]),
  part('rq-r5-lost', 'Their Mentor: In Order', { cast: ['trainer.black_belt_m'], tint: '#22303a', effect: 'none' },
    script(page(who('Mentor', 'I\'ll tell them exactly how you lost. In order.'), who('Mentor', 'They\'ll enjoy the order.')), page('Everything the mentor saw of your team goes to {rival}. They will know it next time.')),
    [ch('"Fair."', out('The mentor shoulders the bag and crosses the bridge. They do not look back. They do not need to.'))]),

  // S+1: the apology. The rival is on a named node; the player may go.
  beat('rq-r5-sorry', 'Their Mentor: Say It', { minStage: 6, requires: [yes('rival-mentor-apology'), due('R5.apology')], tint: '#22303a', effect: 'none' },
    script(
      page('A bench outside the Center, marked on your map in the mentor\'s handwriting. {rival} is sitting on it.'),
      page(R('They sent you. Of course they did.'), 'A pause.', R('...Say it, then. I\'ll decide if I heard it.')),
    ),
    [
      ch('"I\'m sorry."', out(script(page('You say it plainly. No reasons after it. Reasons would spoil it.'), page('{rival} looks at the ground for a long time.', R('...Heard it.'))), quest({ setFeelings: { resentment: 3 } }), done('R5.apology'))),
      ch('"I\'m sorry. For all of it."', out(script(page('You say it, and then you keep going, because there is more of it than you thought.'), page('{rival} lets out a breath they seem to have held for a whole region.', R('...Okay. Okay. Heard it.'))), quest({ setFeelings: { resentment: 3 } }), done('R5.apology'))),
      ch('Walk away.', out('You leave the bench behind. They do not call after you. You did not expect them to.', done('R5.apology'))),
    ]),

  // S+1: train together. They walk the map with you; one sparring match when you stop, and Trust +2 for the stage.
  beat('rq-r5-walk', 'Their Mentor: On the Road Together', { minStage: 6, requires: [yes('rival-mentor-trained'), due('R5.train')], tint: '#22303a', effect: 'glint' },
    script(
      page('{rival} falls into step beside you at the edge of town, as if it had been their idea all along.', R('My mentor says I\'m walking with you this stage. I was going to anyway.')),
      page('At the first rest stop, they put their bag down and roll their shoulders.', R('Spar? One round. Nothing riding on it.')),
    ),
    [
      ch('"One round."', fight(script(page('A round in the long grass. No crowd, no prize, both of you laughing by the end of it.')), rival({ lv: 0, size: 3, win: [feel({ trust: 2 })], lose: [feel({ trust: 2 })] }), done('R5.train'))),
      ch('"Just walk with me."', out(script(page('So you just walk. The road is easier with two. You talk about nothing for miles.'), page(R('...This was a good stage.'), 'They say it like a confession.')), feel({ trust: 2 }), done('R5.train'))),
    ]),
];

// ======================================================================================================
// R6. THE POST-MORTEM (Strategist, Prodigy, Idealist). After a loss to anyone but the rival; texts; the folded page.
// ======================================================================================================
// The advice is built from the lost battle (rq-lost-kind: 1 a bad lead, 2 a wasted turn, 3 kept one in too long).
const ADVICE: Record<number, Record<string, string>> = {
  1: {
    strategist: 'Your lead was in the wrong slot.',
    prodigy: 'Error one: the lead. I\'d have known in the lobby.',
    idealist: 'You led with the one you trust. That\'s not the same as the right one.',
    'champion-chaser': 'You opened with the wrong one. Champions don\'t open wrong. Fix it.',
    'bitter-challenger': 'Wrong lead. Obvious. I only say it because watching hurt.',
    enthusiast: 'Okay! Tiny thing! Your first pick walked straight into its worst matchup!',
    protector: 'You sent the wrong one out first. It took that hit for nothing.',
    underdog: 'Um. Your lead? Wrong one, I think. I lose like that a lot. I know the feeling.',
  },
  2: {
    strategist: 'You set up on turn two. They were already swinging.',
    prodigy: 'Error two. Turn two. I counted.',
    idealist: 'You hoped they\'d wait. People don\'t.',
    'champion-chaser': 'Turn two, you stood around. They didn\'t. That was the whole fight.',
    'bitter-challenger': 'You wasted turn two. I\'d never have given you that turn.',
    enthusiast: 'Turn two! You powered up and they just went! You have to go first!',
    protector: 'That second turn left your team open. They felt it. I watched them feel it.',
    underdog: 'Turn two. You got ready and they didn\'t wait. I used to do that. It\'s fixable.',
  },
  3: {
    strategist: 'You should have switched at half.',
    prodigy: 'Error three: sentiment.',
    idealist: 'You stayed because it wanted to. I\'d have stayed too. That\'s why I\'m telling you.',
    'champion-chaser': 'You left it in way past half. Pride\'s fine. Not in the ring.',
    'bitter-challenger': 'Kept it in too long. Sentimental. It cost you. Don\'t let it cost you twice.',
    enthusiast: 'You kept it in because you love it! Same! But it needed a rest!',
    protector: 'It was hurt and you left it out there. Bring them home sooner. Please.',
    underdog: 'It was hurting and you kept going. I know why. I\'d do it too. Switch sooner.',
  },
};
const NOTEBOOK = page('{rival} drops onto the bench beside you, a notebook already open on their knee.', 'They were watching the fight you lost. Of course they were. They do not say hello.');
const RIGHT = page('The advice is about the battle you actually lost. You go back over it in your head.', 'It is right.');
const coachIntro = (kind: number): string => script(NOTEBOOK, page(RS('event', ADVICE[kind]!)), RIGHT);

// "Do yours, then": the rival's last loss and three points; one is true (rq-r6-true, fixed by the run's seed).
const LAST_LOSS: Record<number, string> = {
  1: 'Their lead walked straight into a type it should never have faced, and the fight never recovered.',
  2: 'Their opener was fine. Then, on turn two, they spent a whole turn powering up while the other trainer simply hit them.',
  3: 'They kept their hurt lead in long after it should have come out, and it went down without taking anything with it.',
};
const lossIntro = (kind: number): string => script(
  page('They hand you the notebook, open at a page cut from the Rival Report. Their last loss, in four turns, to a trainer from out of town.', LAST_LOSS[kind]!),
  page('Three things you could say about it. Only one of them is true.'),
);
const TRUE_LINES: Record<string, string> = {
  prodigy: '...That\'s correct. Nobody\'s ever— write it down. No. I\'ll write it down.',
  strategist: '...Correct. I had it as a minor factor. It wasn\'t minor. Noted.',
  idealist: '...Yes. I knew. I didn\'t want it to be that. Thank you for saying it.',
  'champion-chaser': '...Yeah. Okay. That\'s it. Don\'t tell anyone you saw it before me.',
  'bitter-challenger': '...Fine. You\'re right. Enjoy it. I\'m only saying it once.',
  enthusiast: 'Oh! Oh, that\'s IT! That\'s exactly it! You\'re so good at this!',
  protector: '...Yes. That\'s what happened. I should have seen it. You did. Thank you.',
  underdog: '...Oh. Yeah. That\'s it. Nobody ever looks at my battles that closely.',
};
const TRUE = out(script(page('They stop writing.'), page(RS('event', TRUE_LINES))), feel({ respect: 1 }), flag('rival-postmortem-gave'));
const FALSE = out(script(page('They shake their head, but not unkindly.', R('No. But you looked. Most people don\'t look.'))), flag('rival-postmortem-gave'));
const POINT = ['"Your lead was wrong."', '"You set up too early."', '"You stayed in too long."'];

const postmortem: Json[] = [
  beat('rival-coaching', 'The Post-Mortem', { minStage: 3, requires: [met(1), yes('rq-lost-at'), due('R6.open')], tint: '#2a2830', effect: 'none',
    remembers: [
      { id: 'lead', when: [is('rq-lost-kind', 1)], intro: coachIntro(1) },
      { id: 'turn', when: [is('rq-lost-kind', 2)], intro: coachIntro(2) },
    ] },
    coachIntro(3),
    [
      ch('"Thanks."', out(script(page('They blink, as if nobody has ever thanked them for a notebook before.', R('...Right. Fine. Good.')), page('They tear out the page and hand it over. The next time you face that kind of trainer, the notes show you what it leads with.')), flag('rival-postmortem-took'), set('rq-r6-scout', 1), done('R6.open'))),
      ch('"I didn\'t ask."', out(script(page(R('You never do.'), 'They close the notebook. They do not leave, though. They sit a while longer, as if they might be asked after all.')), feel({ respect: 1 }), done('R6.open'))),
      ch('"Do yours, then."', out(script(page('Their pen stops.', R('...What?')), page(R('Fine. Go on, then. My last loss. The Rival Report has it.'))), quest({ roll: { key: 'rq-r6-true', of: 3 } }), done('R6.open'), room('rival-asks-advice'))),
    ]),

  part('rival-asks-advice', 'The Post-Mortem: Do Yours', { tint: '#2a2830', effect: 'none',
    remembers: [
      { id: 'turn', when: [is('rq-r6-true', 2)], intro: lossIntro(2), hide: [0, 1], addChoices: [ch(POINT[0]!, FALSE), ch(POINT[1]!, TRUE)] },
      { id: 'stayed', when: [is('rq-r6-true', 3)], intro: lossIntro(3), hide: [0, 2], addChoices: [ch(POINT[0]!, FALSE), ch(POINT[2]!, TRUE)] },
    ] },
    lossIntro(1),
    [ch(POINT[0]!, TRUE), ch(POINT[1]!, FALSE), ch(POINT[2]!, FALSE)]),

  // If both `took` and `gave`: a text after each must-see battle (a Gym), on the next stage. No badge, no rival slot.
  beat('rival-text-support', 'A Message From a Friend', { minStage: 4, requires: [yes('rival-postmortem-took'), yes('rival-postmortem-gave'), rq({ line: 'R6', active: true, stale: 'rq-r6-text' }), feels('friendship', 6)], tint: '#1d2a33', effect: 'none' },
    script(page('Your phone buzzes. One new message, from {rival}.', R('Saw the result. Nobody else could have done that.')), page('A minute later, a second one.', R('Not that I was watching. I was watching.'))),
    [ch('Put the phone away, smiling.', out('You read it twice before you put it away.', quest({ stamp: 'rq-r6-text', again: ['rival-text-support', 'rival-text-taunt'] })))]),
  beat('rival-text-taunt', 'A Message From an Adversary', { minStage: 4, requires: [yes('rival-postmortem-took'), yes('rival-postmortem-gave'), rq({ line: 'R6', active: true, stale: 'rq-r6-text' }), feels('rivalry', 6), feels('friendship', undefined, 5)], tint: '#331d1d', effect: 'none' },
    script(page('Your phone buzzes. One new message, from {rival}.', R('One win. Don\'t get comfortable.')), page('A minute later, a second one.', R('I\'ve started a new page of notes. Guess who it\'s about.'))),
    [ch('Put the phone away.', out('You put it away. You are smiling anyway, and you are not sure why.', quest({ stamp: 'rq-r6-text', again: ['rival-text-support', 'rival-text-taunt'] })))]),

  // The finale: region end, Step 18, before the Gym's approach. Notes on the Gym Leader, and a folded second page.
  beat('rq-r6-finale', 'The Post-Mortem: The Folded Page', { minStage: 3, requires: [due('R6.finale')], tint: '#2a2830', effect: 'glint', priority: 80 },
    script(
      page('{rival} catches you on the road to the Gym and pushes two sheets of paper into your hands.'),
      page('One page: the Gym Leader. Neat. Underlined twice where it matters.', 'A second, folded smaller.'),
      page(R('That one\'s about your team. In case you need to know what I\'ll do.'), 'They aren\'t looking at you.', R('I don\'t know why I wrote it. I wrote it, and then I couldn\'t not give it to you.')),
    ),
    [
      ch('"Read it."', out(script(page('You unfold it. Their next team, in their careful handwriting, in order: {team}.'), page('They watch you read it. They know you know.', R('...Right. Well. Now it\'s fair, I suppose.'))), { kind: 'gymPreview' }, feel({ respect: -1, trust: 1 }), flag('rival-notes-read'), done('R6.finale'))),
      ch('"Give it back unread."', out(script(page('You hold the folded page out to them. Still folded.', R('...Huh.')), page('They look at it for a long moment. Then they strike a match and burn it, right there on the road, and watch until it is gone.')), { kind: 'gymPreview' }, feel({ respect: 2 }), done('R6.finale'))),
    ]),
];

export const EVENTS: Json[] = [...stone, ...mentor, ...postmortem];

// Old ids folded into the scenes above.
export const REMOVE: string[] = [
  // Beta 0.6 shortened builds of the same questlines, and their one-line flag readers.
  'rq-stone-on-the-hill', 'rq-the-young-one', 'rq-mentor', 'rq-postmortem', 'rq-postmortem-notes',
  'rq-echo-grief', 'rq-echo-flowers', 'rq-echo-charm', 'rq-echo-mentor-trained', 'rq-echo-mentor-lesson', 'rq-echo-mentor-apology', 'rq-echo-notes-read',
];
void no;
