// Catalog Overhaul Pack, rival questlines R10 to R12 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R10 Three Photographs, R11 Two Rivals One Argument, R12 The Fellow Apprentice.
// Build: npm run co:build -- rivals-4
import { ch, fight, flag, heal, out, room, type Json } from '../dsl.ts';
import { beat, done, due, feel, feel2, feels, met, note, page, part, quest, R, rival, rq, RS, script, set, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

const upTo = (key: string, n: number): Json => ({ kind: 'flag', key, atLeast: 0, atMost: n });

// ======================================================================================================
// R10. THREE PHOTOGRAPHS (Region-wide). Stage 4 of each region, at the Town; the album the night before the League.
// ======================================================================================================
const PHOTO_WHEN = [met(1), rq({ line: 'R10', stageOfRegion: 4, freshRegion: 'rq-r10-at' }), upTo('rq-r10-count', 2)];
const SNAP = [quest({ stamp: 'rq-r10-at', again: ['living-rival-photo-rival', 'living-rival-photo-between', 'living-rival-photo-friend'] }), flag('rq-r10-count')];
const MARCHBANKS = page(who('Mr. Marchbanks', 'The famous two! In one frame!'), who('Mr. Marchbanks', 'Don\'t move. Don\'t BE like that. Closer. I\'ve a wide lens, but I haven\'t a miracle.'));
const photoChoices = (smile: string, face: string, arm: string): Json[] => [
  ch('Smile.', out(smile, ...SNAP, set('rq-r10-arm', 0))),
  ch('Pull a face.', out(face, ...SNAP, set('rq-r10-arm', 0))),
  ch('Put an arm round them.', out(arm, ...SNAP, set('rq-r10-arm', 1)), { requires: [feels('friendship', 5)] }),
];

const photos: Json[] = [
  beat('living-rival-photo-rival', 'A Photo Neither Wants', { minStage: 4, requires: [...PHOTO_WHEN, feels('friendship', undefined, 5), feels('respect', undefined, 4)], cast: ['trainer.gentleman'], tint: '#2a2a2a', effect: 'glint' },
    script(page('A street photographer with a box camera steps into your path, beaming. {rival} is already standing beside him, arms folded.'), MARCHBANKS,
      page('One arm span apart. He counts to three.', 'On two, you both look away, in opposite directions, at exactly the same moment.'),
      page(R('Just take it.'), who('Mr. Marchbanks', 'Marvellous. Identical. I\'ll call it "Twins."'))),
    photoChoices('You smile at the very last second. They do not. It is somehow the best photo of the three he takes.', 'You pull a face. Out of the corner of your eye, so do they. Neither of you will ever admit it.', 'You put an arm round them. They go rigid, and then, very slightly, they do not.')),
  beat('living-rival-photo-between', 'A Photo, Awkwardly', { minStage: 4, requires: [...PHOTO_WHEN, feels('friendship', undefined, 5), feels('respect', 5)], cast: ['trainer.gentleman'], tint: '#2a2a2a', effect: 'glint' },
    script(page('A street photographer with a box camera steps into your path, beaming. {rival} is already standing beside him, not sure where to stand.'), MARCHBANKS,
      page('Hands in odd places. Elbows in the way. Both of you nearly smiling.'),
      page(R('Don\'t put your hand there. No. Not there either.'), R('Where do people PUT hands?'))),
    photoChoices('You smile. They nearly do. The flash catches the nearly.', 'You pull a face. They laugh before they can stop it, and that is the photo.', 'You put an arm round them. That solves the hands. They do not say so, but it does.')),
  beat('living-rival-photo-friend', 'A Photo With a Friend', { minStage: 4, requires: [...PHOTO_WHEN, feels('friendship', 6)], cast: ['trainer.gentleman'], tint: '#2a2a2a', effect: 'hearts' },
    script(page('A street photographer with a box camera steps into your path, beaming.'), MARCHBANKS,
      page('{rival} has you by the sleeve before he has finished asking.'),
      page(R('Come on. Before I change my mind.'), R('Before I remember I\'m meant to hate this.'))),
    photoChoices('You both smile. It is the easiest photo either of you has ever had taken.', 'You pull a face. So do they, worse, on purpose, to win.', 'You put an arm round them. They put one round you. Marchbanks has to wipe his eye before he can press the button.')),

  // The album: the + node before the League.
  beat('rq-r10-album', 'Three Photographs: The Album', { minStage: 4, requires: [met(1), rq({ line: 'R10', leagueEve: true }), yes('rq-r10-count')], cast: ['trainer.gentleman'], tint: '#2a2a2a', effect: 'sparkle',
    remembers: [
      { id: 'arm', when: [yes('rq-r10-arm')], notice: note(page('They get to the last page and stop. They turn back to it. Twice.')) },
      { id: 'jacket', when: [yes('rival-colours-won')], notice: note(page('In one of the photos you are wearing two jackets of the same colour, one over the other. They laugh until they have to sit down.')) },
      { id: 'collar', when: [yes('rival-colours-kept')], notice: note(page('In one of the photos they are in your jacket, done up to the collar. They tap it, once, and say nothing.')) },
    ] },
    script(
      page('The night before the League. Mr. Marchbanks finds you both at the Center and hands each of you an album.'),
      page('A page for every region. He has written the dates in. Under the last, in pencil:', '"They got closer. I only do the lens."'),
      page('{rival} turns the pages slowly.', RS('champion')),
    ),
    [ch('Keep the album.', out('You put it at the very bottom of your bag, where nothing can bend it.', done('R10.album')))]),
];

// ======================================================================================================
// R11. TWO RIVALS, ONE ARGUMENT (needs a second rival). The road (A7+), the bench (S+1), outside the Center (S+2),
// the finale (S+3): a double battle if they made up, back to back if not.
// ======================================================================================================
const WATCH = rival({ lv: 1, quest: { watch: true }, win: [room('rq-r11-after')], lose: [room('rq-r11-after')] });
const MENDED = yes('feud-mend', 2);
const SECOND = rival({ lv: 1, quest: { second: true }, win: [room('rq-r11-end')], lose: [room('rq-r11-end')] });

const feud: Json[] = [
  beat('rival-feud', 'Two Rivals, One Argument', { minStage: 7, requires: [met(1), rq({ second: true }), due('R11.open')], tint: '#33241d', effect: 'shake' },
    script(
      page('Shouting, up ahead in the road. {rival} and {rival2}, nose to nose, a small crowd pretending not to listen.'),
      page(R('Winning is the point. That\'s the whole point!'), who('{rival2}', 'It\'s not if you\'re miserable doing it!')),
      page('They both turn to you at exactly the same moment.', who('Both', 'Tell them.')),
    ),
    [
      ch('Side with {rival}.', out(script(page('{rival} throws their arms up in triumph. {rival2} goes very quiet, and then very loud, and then leaves.')), feel({ friendship: 2 }), feel2({ friendship: -2 }), flag('feud-sided-main'), done('R11.open'))),
      ch('Side with {rival2}.', out(script(page('{rival2} looks at you as if you have handed them something precious. {rival} stares, then walks off without a word.')), feel({ friendship: -2 }), feel2({ friendship: 2 }), flag('feud-sided-second'), done('R11.open'))),
      ch('"Neither."', out(script(page('Both of them glare at you. Then, grudgingly, both of them look a little impressed.', who('Both', '...Coward.'), 'They do not mean it.')), feel({ respect: 1 }), feel2({ respect: 1 }), flag('feud-neutral'), done('R11.open'))),
      ch('"Settle it with a battle between you."', out(script(page('They stare at you. Then at each other. Then, slowly, they both reach for a Poké Ball.')), done('R11.open'), room('rq-r11-watch'))),
    ]),
  part('rq-r11-watch', 'Two Rivals, One Argument: Ringside', { tint: '#33241d', effect: 'confetti' },
    script(page('They square up in the road. You get the best seat on the fence.', 'The crowd stops pretending not to listen.')),
    [
      ch('Cheer for {rival}.', fight('You shout their name. {rival} grins without looking round.', WATCH, set('rq-r11-cheer', 1))),
      ch('Cheer for {rival2}.', fight('You shout their name. {rival2} stands a little straighter.', WATCH, set('rq-r11-cheer', 2))),
      ch('Just watch.', fight('You keep quiet. Somebody has to be the referee.', WATCH, set('rq-r11-cheer', 0))),
    ]),
  part('rq-r11-after', 'Two Rivals, One Argument: After', { tint: '#33241d', effect: 'none',
    remembers: [{ id: 'second', when: [{ kind: 'flag', key: 'feud-watch-winner', atLeast: 2, atMost: 2 }], intro: script(page('{rival2} stands over the result, breathing hard, and does not look as happy as they expected.', who('{rival2}', 'There. I won. Can we stop now?'), '{rival} does not answer. But they do not walk away.')) }] },
    script(page('{rival} stands over the result, breathing hard.', R('There. Winning. That\'s the point.'), '{rival2} is already laughing at something their Pokémon did. {rival} watches them do it, and frowns, and keeps watching.')),
    [ch('Climb down off the fence.', out('Nothing is settled. Something has moved, though.'))]),

  // S+1: the bench.
  beat('rq-r11-bench', 'Two Rivals, One Argument: One Bench', { minStage: 8, requires: [rq({ second: true }), due('R11.bench')], tint: '#33241d', effect: 'none' },
    script(
      page('A Center. They are at opposite ends of the same bench, as far apart as a bench allows.'),
      page('{rival2}, to you, loudly, for the other\'s benefit:', who('{rival2}', 'Tell THEM I\'m not miserable. Tell them I had a lovely day.')),
      page(R('Tell THEM a lovely day isn\'t a badge.')),
    ),
    [
      ch('"I\'m not passing notes."', out('You sit in the middle. Neither of them speaks. You read a leaflet about Poké Balls, very slowly.', done('R11.bench'))),
      ch('(Pass the note.)', out(script(page('You pass it. They read it. They write back. You pass that too.', 'It goes on for some time. Nobody gets any happier.')), done('R11.bench'))),
      ch('"Have you eaten? Either of you?"', out(script(page('Neither has. You fetch three of everything. They eat.', 'It is very quiet. It is a little better.')), flag('feud-mend'), done('R11.bench'))),
    ]),
  // S+2: outside the Center.
  beat('rq-r11-outside', 'Two Rivals, One Argument: Outside', { minStage: 9, requires: [rq({ second: true }), due('R11.outside')], tint: '#33241d', effect: 'rain' },
    script(
      page('{rival} lost a battle that mattered today. Everyone knows. {rival2} is outside the Center, not going in.'),
      page(who('{rival2}', 'I was right. They\'re miserable. I\'ve won the argument.'), who('{rival2}', 'I hate it. Go in. They\'ll want you. They won\'t want me.')),
    ),
    [
      ch('"Come in with me."', out(script(page('You hold the door. They hesitate a long time. Then they go in ahead of you.'), page('You stay out of the way. Through the glass, you see {rival} look up, and not look away.')), flag('feud-mend', 2), done('R11.outside'))),
      ch('"I\'ll tell them you came."', out(script(page('You tell them. {rival} says nothing for a while.', R('...They came? Here?'), 'They look at the door for the rest of the evening.')), flag('feud-mend'), done('R11.outside'))),
      ch('"You should go in alone."', out(script(page('They look at you. Then at the door.', who('{rival2}', '...Yeah. Yeah, I should.'), 'They go in alone. You find somewhere else to be.')), flag('feud-mend', 2), done('R11.outside'))),
    ]),

  // S+3, Step 16: made up, a double battle against you (A+2); not, back to back (A+1 each).
  beat('rq-r11-finale', 'Two Rivals, One Argument: The Last Word', { minStage: 10, requires: [rq({ second: true }), due('R11.finale')], tint: '#33241d', effect: 'confetti', priority: 80,
    remembers: [{ id: 'mended', when: [MENDED], intro: script(page('{rival} and {rival2} are waiting together. Actually together, on the same side of the road.'), page(R('We talked.'), who('{rival2}', 'We shouted, and then we talked.'), who('Both', 'Now you.'))), hide: [0], addChoices: [
      ch('Take them both on.', fight(script(page('They send out together. They call each other\'s moves by mistake, twice, and both times it works.')), rival({ lv: 2, size: 6, format: 'doubles', quest: { pair: true, full: true }, win: [room('rq-r11-end')], lose: [room('rq-r11-end')] }), done('R11.finale'))),
    ] }] },
    script(
      page('{rival} is waiting in a field. {rival2} is sitting on the fence behind them, not leaving.'),
      page(R('Me first. Then them. Back to back.'), who('{rival2}', 'I\'ll be watching. Obviously.')),
    ),
    [
      ch('One at a time, then.', fight(script(page('{rival} goes first. {rival2} watches every turn from the fence, and winces when they make the mistake you both knew they would.')), rival({ lv: 1, win: [room('rq-r11-next')], lose: [room('rq-r11-next')] }), done('R11.finale'))),
      ch('"Not today."', out('They shrug, in exactly the same way, at exactly the same moment. Neither of them notices.', done('R11.finale'))),
    ]),
  part('rq-r11-next', 'Two Rivals, One Argument: Back to Back', { tint: '#33241d', effect: 'none' },
    script(page('{rival} climbs onto the fence. {rival2} climbs off it.', who('{rival2}', 'My turn. Don\'t go easy because I\'m nice.'))),
    [ch('Battle {rival2}.', fight('Behind them, {rival} watches from the fence and, once, shouts advice. To the wrong side.', SECOND))]),
  part('rq-r11-end', 'Two Rivals, One Argument: Remembered', { tint: '#33241d', effect: 'none',
    // Both remember whom the player sided with, and say so.
    remembers: [
      { id: 'main', when: [yes('feud-sided-main')], intro: script(page(who('{rival2}', 'You sided with them, that day in the road. I remember.'), R('So do I. ...Thanks.'), who('{rival2}', 'I\'m still right, mind.'))) },
      { id: 'second', when: [yes('feud-sided-second')], intro: script(page(R('You sided with them, that day in the road. I remember.'), who('{rival2}', 'So do I. ...Thanks.'), R('I\'m still right, mind.'))) },
      { id: 'neutral', when: [yes('feud-neutral')], intro: script(page(who('Both', 'You never picked a side.'), 'They glance at each other.', who('Both', '...Probably for the best.'))) },
    ] },
    script(page('They walk off together, still arguing. It sounds different now. It sounds like the kind that never ends because neither of them wants it to.')),
    [ch('Let them go.', out('You watch them argue all the way to the next town.'))]),
];

// ======================================================================================================
// R12. THE FELLOW APPRENTICE (inside the Mentors' story). The camp (the mentor's second lesson), the confession (next stage,
// at night), the Final Lesson (a double battle against the mentor, A+2). Same run only: what each answer leads to plays next region.
// ======================================================================================================
const FINAL = { kind: 'trainer', name: 'Mentor', friendly: true, size: 4, types: [], levelBonus: 2, ally: 'fellow', quest: { mentor: true }, win: [], lose: [] };

const apprentice: Json[] = [
  beat('rq-r12-camp', 'The Fellow Apprentice', { minStage: 2, requires: [{ kind: 'mentor' }, rq({ line: 'R12', mentorLessons: 2 }), due('R12.open')], tint: '#24301d', effect: 'none',
    remembers: [{ id: 'waiting', when: [yes('rival-mentor-lesson')], notice: note(page('You catch yourself watching their Pokémon that is not fighting. They notice.', who('{fellow}', '"Look at the one that\'s waiting"? Who taught you that? That\'s the oldest lesson there is.'))) }] },
    script(
      page('{mentor}\'s camp. Somebody else is already there, sweeping.'),
      page(who('{fellow}', 'Oh! You\'re the other one. They talk about you.'), who('{fellow}', 'I\'m— I do the sweeping. And the breathing thing. I\'m quite good at the breathing thing.')),
      page('They are very good at the breathing thing. It is the one thing you have never got.'),
    ),
    [
      ch('"Show me the breathing thing."', out(script(page('They show you. In for four, hold for four, out for eight. You lose count at six.', who('{fellow}', 'Everyone does! It took me a year.')), page('It did not take them a year. You can tell.')), done('R12.open'))),
      ch('Help them sweep.', out(script(page('You sweep together. They talk the whole time, nervously, and you learn more about {mentor} in ten minutes than in a whole region.')), done('R12.open'))),
    ]),

  // The confession: the next stage, at night.
  beat('rq-r12-confession', 'The Fellow Apprentice: A Rare Talent', { minStage: 3, requires: [{ kind: 'mentor' }, { kind: 'period', in: ['night'] }, due('R12.confession')], tint: '#141a2a', effect: 'none' },
    script(
      page('Night at the camp. {fellow} is sitting up by the dead fire, knees to their chin.'),
      page(who('{fellow}', 'The mentor says I\'m a once-in-a-generation talent.'), who('{fellow}', 'I can\'t sleep. What if they\'re wrong? What if they\'re right?')),
    ),
    [
      ch('"You are better. That\'s all right."', out(script(page('They breathe out. All of it, as if they had been holding it since the day they arrived.')), flag('apprentice-truth'), done('R12.confession'), room('rq-r12-night'))),
      ch('"You\'re not that good. Relax."', out(script(page('They laugh, relieved. And something in them goes quiet.')), flag('apprentice-lie'), done('R12.confession'), room('rq-r12-night'))),
      ch('Say nothing.', out(script(page('They nod and look at the ground for a long time.')), flag('apprentice-silent'), done('R12.confession'), room('rq-r12-night'))),
    ]),
  part('rq-r12-night', 'The Fellow Apprentice: The Night After', { tint: '#141a2a', effect: 'none',
    remembers: [
      { id: 'truth', when: [yes('apprentice-truth')], intro: script(page('Later. They are asleep, properly, for the first time since you met them.', '{mentor} is watching them sleep. Then {mentor} turns to you.', who('{mentor}', 'What did you say to them?'))) },
      { id: 'lie', when: [yes('apprentice-lie')], intro: script(page('Later. They are laughing with the others by the fire, louder than anyone.', '{mentor} is not watching them. {mentor} is watching you.')) },
    ] },
    script(page('Later. They are up before dawn, drilling, alone at the edge of the camp.', 'They do not look round when you pass.')),
    [ch('Go to bed.', out('You lie awake a while anyway.'))]),

  // The Final Lesson: both apprentices against the mentor.
  beat('rq-r12-final', 'The Fellow Apprentice: The Final Lesson', { minStage: 4, requires: [{ kind: 'mentor' }, due('R12.finale')], tint: '#24301d', effect: 'glint', priority: 70 },
    script(
      page('{mentor} is waiting in the clearing with four Poké Balls. {fellow} is already beside you, breathing the way they breathe.'),
      page(who('{mentor}', 'The last lesson. Both of you. Against me.'), who('{mentor}', 'If you win, there is nothing left I can teach you. That is the lesson.')),
    ),
    [
      ch('Side by side.', fight('You and {fellow} step forward together. Their breathing slows. So, for once, does yours.', FINAL, done('R12.finale'))),
    ]),

  // Next region, by what was said at night (same run).
  beat('rq-r12-nurse', 'The Fellow Apprentice: At the Center', { minStage: 5, stop: 'heal', requires: [yes('apprentice-lie'), due('R12.nurse')], tint: '#2a1d24', effect: 'hearts' },
    script(page('The nurse at this Center looks familiar. It is {fellow}, in the uniform, humming.', who('{fellow}', 'I stopped training. I\'m good at this. I\'m happy. ...I am, you know.')), page('They heal your team themselves, very carefully, and do the breathing thing while they do it.')),
    [ch('"You look happy."', out('They do. You are almost sure of it.', heal(), done('R12.nurse')))]),
  beat('rq-r12-third', 'The Fellow Apprentice: A Third Rival', { minStage: 5, requires: [yes('apprentice-silent'), due('R12.third')], tint: '#24301d', effect: 'shake' },
    script(page('{fellow} is waiting on the road with their team out, and they do not look nervous at all.', who('{fellow}', 'You didn\'t say anything, that night. So I decided for myself.'), who('{fellow}', 'I\'m better. Let\'s find out by how much.'))),
    [ch('Battle {fellow}.', fight('They breathe in for four. Then they do not hold anything back.', { kind: 'trainer', name: 'Fellow apprentice', apprentice: true, friendly: true, size: 4, types: [], levelBonus: 1, win: [], lose: [] }, done('R12.third')))]),
];

export const EVENTS: Json[] = [...photos, ...feud, ...apprentice];

// Old ids folded into the scenes above.
export const REMOVE: string[] = [
  'rival-pair-setup', // -> rival-feud (two rivals on one bench is the feud's own scene)
  // Beta 0.6 shortened builds of the same questlines, and their one-line flag readers.
  'rq-badge-photo', 'rq-photograph', 'rq-album', 'rq-fellow-apprentice', 'rq-final-lesson',
  'rq-echo-apprentice-truth', 'rq-echo-apprentice-lie', 'rq-echo-apprentice-silent', 'rq-echo-apprentice-lesson',
];
