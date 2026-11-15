// Catalog Overhaul Pack, rival questlines R7 to R9 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R7 Wearing Each Other's Colours, R8 The Fake Lead, R9 A Rival's Bad Day.
// Build: npm run co:build -- rivals-3
import { $, ch, fight, flag, good, out, room, type Json } from '../dsl.ts';
import { beat, done, due, feel, foe, met, note, page, part, quest, R, rival, rq, RS, script, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

// ======================================================================================================
// R7. WEARING EACH OTHER'S COLOURS (Underdog, Prodigy, Champion-Chaser, Idealist). The jacket (A4+, Step 6),
// two mistakes the same stage (Step 11, the Town), the Borrowed Team finale (S+1, Step 16, A+1).
// ======================================================================================================
// For the rest of this stage and the next the rival's team copies your type spread; the two mistakes wait further along the map.
const JACKET = [quest({ stamp: 'rq-r7-copy', ahead: [{ event: 'rq-r7-trainer', step: 11 }, { event: 'rq-r7-shop', step: 13 }] }), done('R7.open')];
const BORROW = rival({ lv: 1, quest: { aceFirst: true, borrow: true }, win: [room('rq-r7-won')], lose: [room('rq-r7-lost')] });
const ACROSS = page('They look across the field at your ace, in their hands now.', R('It\'s looking at you. Not me. Even from here.'), R('...Right. Fine. Come on, you. Show me what they see.'));

const colours: Json[] = [
  beat('rival-cosplay', 'Wearing Each Other\'s Colours', { minStage: 4, requires: [met(1), due('R7.open')], tint: '#2a2433', effect: 'sparkle' },
    script(
      page('{rival} is waiting at the crossroads, and for a moment you think you are looking into a shop window.', 'They are wearing your jacket. Not one like it. Yours, down to the scuffed cuff.'),
      page('Same colour. Same zip that sticks halfway. They have even rolled the sleeves the way you roll yours.'),
      page(RS('event', {
        underdog: 'I wanted to see what it felt like. To be you.',
        prodigy: 'Anyone could wear it. That\'s my point.',
        'champion-chaser': 'Looks better on me.',
        idealist: 'I want to understand how you see things.',
      })),
    ),
    [
      ch('"It suits you."', out(script(
        page('They go red to the ears. Or they scoff. Somehow they manage both at once.'),
        page(RS('event', {
          underdog: 'It... does? Nobody says that. About anything I wear.',
          prodigy: 'Obviously it does. ...Thank you.',
          'champion-chaser': 'I know. I was about to say that.',
          idealist: 'Then maybe I\'m starting to see it.',
        }), 'They walk off still wearing it, a little taller than before.'),
      ), feel({ friendship: 1 }), flag('rival-colours-ok'), ...JACKET)),
      ch('"Take it off."', out(script(
        page('They look down at the jacket, then back up at you.', R('No.')),
        page('They zip it to the chin. It does not suit them. It suits them a little.'),
      ), feel({ rivalry: 1 }), ...JACKET)),
      ch('"Swap teams, then."', fight(script(
        page('They stare at you. Then, slowly, a grin.', R('You mean it? Aces. Yours for mine. Right now.')),
        page('You hold out a Poké Ball. They hold out theirs. Neither of you lets go a second too soon.'),
        ACROSS,
      ), BORROW, flag('rival-colours-swap'), done('R7.open'), done('R7.finale'))),
    ]),

  // Step 11: a trainer challenges you over something the rival did.
  part('rq-r7-trainer', 'Wearing Each Other\'s Colours: Mistaken', { tint: '#2a2433', effect: 'shake', pokemon: 'rattata' },
    script(
      page('A trainer storms up the path with a Rattata under one arm.', who('Trainer', 'You! You said my Rattata was "statistically irrelevant"! To its face!')),
      page('It was not you. It was someone in your jacket.', 'The Rattata glares up at you with enormous, wounded dignity.'),
    ),
    [
      ch('"That wasn\'t me."', fight(script(page(who('Trainer', 'Same jacket! Same walk! Nearly the same face! Battle!'))), foe('Youngster', { cls: 'youngster', size: 2, lineup: ['rattata', 'raticate'] }))),
      ch('"...I\'m sorry about that."', out(script(
        page('You apologise for something you did not do. The trainer deflates. The Rattata accepts it, graciously.'),
        page(who('Trainer', '...Well. Thank you. Tell your friend they could learn a thing or two from you.'), 'Somewhere down the road, word of it will reach {rival}.'),
      ), good(1), flag('rival-heard-apology'))),
      ch('"It was a bit irrelevant."', fight(script(page(who('Trainer', 'RIGHT. That\'s it.'), 'The Rattata leaps from his arms like a small, furious comet.')), foe('Youngster', { cls: 'youngster', size: 2, lineup: ['rattata', 'raticate'] }))),
    ]),

  // The Town node: a shopkeeper gives you the rival's discount, and a parcel.
  part('rq-r7-shop', 'Wearing Each Other\'s Colours: The Usual Discount', { cast: ['trainer.worker_m'], tint: '#2a2433', effect: 'glint' },
    script(
      page(who('Shopkeeper', 'Back again! The usual discount.'), 'She knocks a good chunk off before you can say a word. She thinks you are {rival}.'),
      page(who('Shopkeeper', 'And your friend left this for you. Well. For you. You know what I mean.'), 'A parcel, addressed to {rival}, in their own handwriting.'),
      page('You can feel a jacket through the paper. They have sent themselves a spare.', 'In your colour.'),
    ),
    [
      ch('Take the discount.', out('You do not correct her. The money stays in your pocket, and the parcel stays on the counter for its owner.', $(300))),
      ch('Tell her the truth.', out(script(page(who('Shopkeeper', 'Oh! You\'re the OTHER one.'), who('Shopkeeper', 'Well, the discount\'s for that jacket, love, not the face.')), page('She gives it to you anyway, and keeps the parcel back for {rival}.')), $(300))),
    ]),

  // The finale (S+1, Step 16): Borrowed Team rules, each commands the other's ace.
  beat('rival-swap', 'Wearing Each Other\'s Colours: Borrowed Team', { minStage: 5, requires: [due('R7.finale')], tint: '#2a2433', effect: 'sparkle', priority: 80,
    remembers: [
      { id: 'apology', when: [yes('rival-heard-apology')], notice: note(page(R('Somebody told me you apologised to a Rattata. For me.'), 'They look away.', R('...It was a bit irrelevant. But thanks.'))) },
      { id: 'suits', when: [yes('rival-colours-ok')], notice: note(page(R('You said it suited me. I\'ve been thinking about that all stage. It\'s very annoying.'))) },
    ] },
    script(
      page('A field at the edge of the route. {rival} is still in the jacket, both hands in the pockets the way yours go.'),
      page(R('Borrowed Team rules. My ace, your hands. Your ace, mine.'), R('Whoever wins, wins with the other one\'s heart. That\'s the whole point.')),
    ),
    [
      ch('Trade aces.', fight(script(page('Two Poké Balls change hands. Two Pokémon look back at the wrong trainer, and then, slowly, forward.'), ACROSS), BORROW, done('R7.finale'))),
      ch('"Not like this."', out(script(page('They look at the Poké Ball in their hand for a long moment, then put it away.', R('...Fine. Keep your own.')), page('They do the jacket up to the collar.', R('I\'m keeping this, though.'))), flag('rival-colours-kept'), done('R7.finale'))),
    ]),
  part('rq-r7-won', 'Wearing Each Other\'s Colours: It Listened', { tint: '#2a2433', effect: 'sparkle',
    remembers: [{ id: 'swap', when: [yes('rival-colours-swap')], notice: note(page(R('Right there at the crossroads. You didn\'t even blink.'))) }] },
    script(
      page('{rival} takes the jacket off. They hold it out to you.', R('It listened to you. Mine. It listened.'), R('I\'ve been shouting at it for a year.')),
      page('Your own ace comes back across the field and bumps its head into your hand, as if it has been gone for weeks.'),
    ),
    [ch('Take the jacket.', out('It is still warm. Now you have two, and they have none, and somehow that feels even.', flag('rival-colours-won')))]),
  part('rq-r7-lost', 'Wearing Each Other\'s Colours: The Collar', { tint: '#2a2433', effect: 'glint',
    remembers: [{ id: 'swap', when: [yes('rival-colours-swap')], notice: note(page(R('Right there at the crossroads. You didn\'t even blink.'))) }] },
    script(
      page('They do the jacket up, slowly, all the way to the collar.', R('I\'m keeping this. I\'ve earned the collar.')),
      page('It is not a joke at your expense any more. It is a compliment. They wear it like one.', 'Your ace trots back to you. It looks back at them once. Then it does not look back again.'),
    ),
    [ch('"It suits you."', out('This time they do not scoff at all.', flag('rival-colours-kept')))]),
];

// ======================================================================================================
// R8. THE FAKE LEAD (Strategist). The bait (A5+, Step 8), the signed signpost (S+1), the false report (S+2), the table (S+3, A+2).
// ======================================================================================================
const allThree = [yes('rival-bait-seen'), yes('rival-sign-seen'), yes('rival-report-seen')];
const TABLE = rival({ lv: 2, size: 6, quest: { counter: 'none', full: true }, win: [room('rq-r8-last')], lose: [room('rq-r8-last')] });

const fakeLead: Json[] = [
  beat('rival-mind-games', 'The Fake Lead', { minStage: 5, requires: [met(1), due('R8.open')], tint: '#202a2a', effect: 'none',
    remembers: [{ id: 'notes', when: [yes('rival-notes-read')], notice: note(page(R('You read my notes. So now I\'m writing fake ones. Fair\'s fair.'))) }] },
    script(
      page('A camp by the road. {rival}\'s team is out on the grass, their strongest-looking Pokémon right at the front.', 'Too obviously at the front.'),
      page(R('Morning. Going my way?'), 'Something is off. The one at the front holds nothing. Every one behind it holds an item.'),
    ),
    [
      ch('"Nice lead."', out(script(
        page('{rival} smiles, very slightly. A fish has taken the hook, and they are too polite to say so.'),
        page('You start planning your next fight against them around that front Pokémon. It feels good. It feels like a plan.'),
      ), flag('rival-bait-taken'), done('R8.open'))),
      ch('"That\'s not your lead."', out(script(
        page('They laugh, a short, surprised bark.', R('No. It isn\'t. How did you—'), 'They look at the held items. They look at you.'),
        page(R('...I\'ll have to be better than that, then. Good.')),
      ), feel({ respect: 2 }), flag('rival-bait-seen'), done('R8.open'))),
      ch('Say nothing.', out(script(
        page('You say nothing. You keep your eyes on the one at the back, the one with the held item.', 'If you are right, that is the one that leads.'),
        page(R('Not chatty today. Fine.'), 'They pack up. They do not know what you saw. You do.'),
      ), done('R8.open'))),
    ]),

  // S+1: the signpost at a fork. Tell: it is signed. They never sign anything.
  beat('rq-r8-signpost', 'The Fake Lead: The Signpost', { minStage: 6, requires: [due('R8.sign')], tint: '#202a2a', effect: 'none' },
    script(
      page('A fork in the road. A note is pinned to the signpost.', '"Left\'s flooded. Go right." And under it, a signature: {rival}.'),
      page('It is their handwriting. Neat, careful, unmistakable.', 'Something about it snags.'),
    ),
    [
      ch('"Go right."', out(script(page('You go right. It is the long way, all the way round the hill.', 'Nothing is flooded. Nothing was ever flooded.'), page('Somewhere behind you, someone is very pleased with themself.')), done('R8.sign'))),
      ch('"Go left."', out('', flag('rival-sign-seen'), done('R8.sign'), room('rq-r8-rock'))),
      ch('(Look at the note again.)', out('', done('R8.sign'), room('rq-r8-note'))),
    ]),
  part('rq-r8-note', 'The Fake Lead: The Signature', { tint: '#202a2a', effect: 'none' },
    script(page('You look again. The note. The neat hand. The name at the bottom.', 'They never sign anything. Not the Circuit board, not a Center book, not once in all the time you have known them.')),
    [
      ch('"Go right."', out(script(page('You go right anyway. It is the long way, all the way round the hill.', 'Nothing is flooded. Nothing was ever flooded.')))),
      ch('"Go left."', out('', flag('rival-sign-seen'), room('rq-r8-rock'))),
    ]),
  part('rq-r8-rock', 'The Fake Lead: On a Rock', { tint: '#202a2a', effect: 'none' },
    script(
      page('Left is not flooded. It is one step shorter, and dry as a bone.', 'At the end of it, sitting on a rock, is {rival}.'),
      page(R('...How?')),
    ),
    [ch('"You signed it."', out(script(page(R('I signed it.'), 'They put their face in their hands.', R('I got clever. That\'s when I\'m stupidest.'))), feel({ respect: 1 })))]),

  // S+2: the false report at the stage's start. Tell: the photo has the wrong weather.
  beat('rival-eavesdrop', 'The Fake Lead: The Rival Report', { minStage: 7, requires: [due('R8.report')], tint: '#202a2a', effect: 'rain' },
    script(
      page('The Rival Report on the board at the stage gate. {rival}\'s team, all six, photographed in bright sunshine.', 'Six Pokémon you have never once seen them carry.'),
      page('Above the board, the stage header reads: RAIN.', 'It has been raining here all week.'),
    ),
    [
      ch('Plan against the report\'s team.', out(script(page('You sit up late with the photo, planning for six Pokémon.', 'Six Pokémon who will not be there.')), done('R8.report'))),
      ch('Look at the weather in the photo.', out(script(page('Sunshine. In a week of rain. Somebody took this photo somewhere else, on some other day.', 'You do not plan for any of them.')), flag('rival-report-seen'), done('R8.report'))),
    ]),

  // S+3, Step 17: the table. Their ledger is wiped; a pure battle.
  beat('living-rival-acknowledges-rival', 'The Fake Lead: No More Games', { minStage: 8, requires: [due('R8.finale')], tint: '#202a2a', effect: 'glint', priority: 80 },
    script(
      page('A folding table in a field. Six Poké Balls in a row, open, each with its Pokémon standing behind it.', 'No bait. No held-back ace. Everything on the table.'),
      page(R('No more games. I want to know if I can beat you straight.'), R('I don\'t know. I\'ve never tried. It\'s— I\'m quite frightened.'), R('Don\'t tell me that\'s a good sign.')),
    ),
    [
      ch('Battle them straight.', fight(script(page('They tear up their notes on you, every page, and let the wind have them. You start from nothing. So do they.')), TABLE, quest({ wipeLedger: true }), done('R8.finale'))),
      ch('"It\'s a good sign."', fight(script(page(R('I TOLD you not to—'), 'They are laughing, though. They tear up their notes on you and let the wind have them.')), TABLE, quest({ wipeLedger: true }), done('R8.finale'))),
    ]),
  part('rq-r8-last', 'The Fake Lead: Straight', { tint: '#202a2a', effect: 'none',
    // If the player saw through all three traps: the rival's last line.
    remembers: [{ id: 'read', when: allThree, notice: note(page(R('You\'re the only one who ever reads me. It\'s annoying.'), 'A long pause.', R('Thank you.'))) }] },
    script(page('They fold the table away, slowly, one leg at a time.', R('Well. Now I know.'), 'It is hard to tell what they know. They look lighter for knowing it.')),
    [ch('Nod.', out('They nod back. For once there is nothing hidden behind it.'))]),
];

// ======================================================================================================
// R9. A RIVAL'S BAD DAY (The Inheritance, The Fall). One scene in the rain (A4+, Step 15), two reports, a photograph (S+3).
// ======================================================================================================
const SAT = page('The wall is wet. You sit. The rain is loud on the empty badge case.', 'A long time. A cart goes by. Somebody\'s dog looks at you both and moves on.');

const badDay: Json[] = [
  beat('living-rival-bad-day', 'A Rival\'s Bad Day', { minStage: 4, requires: [met(1), due('R9.open', { weather: ['rain'] })], tint: '#1d2430', effect: 'rain' },
    script(
      page('Rain, hard and grey. {rival} is sitting on a low wall with a badge case open in their lap. It is empty.', 'They have not noticed you.'),
      page('Beside them, held down by a stone, a letter. Half open, in someone else\'s handwriting.', '"...I expected better. Your mother would have..."'),
      page('The rain is getting into the ink. They do not move it.'),
    ),
    [
      ch('Sit beside them.', out('', feel({ friendship: 2 }), flag('rival-sat-in-rain'), done('R9.open'), room('rq-r9-wall'))),
      ch('Read the letter.', out(script(
        page('You lean in and read. You do not mean to read all of it. You read all of it.'),
        page('They see you. Their face does something complicated.', RS('event', {
          underdog: 'You read it. ...Nobody\'s ever been curious about me before. That\'s weird. It\'s kind of nice.',
          'champion-chaser': 'That\'s private. ...It doesn\'t matter. I\'ll win the next one and it won\'t matter.',
          'bitter-challenger': 'Get your eyes off that. It\'s none of your business. None.',
          enthusiast: 'Oh! Ha. That\'s, um. That\'s nothing. It\'s an old letter. It\'s fine!',
          idealist: 'You shouldn\'t have. But I suppose I\'d have wanted to know too.',
          strategist: 'You\'ve gathered intelligence. Congratulations. Don\'t use it.',
          protector: 'Don\'t. Please. That one\'s mine to carry.',
          prodigy: 'Three generations in the Hall. You can see why the handwriting\'s so neat.',
        })),
        page('They fold the letter away carefully, as if it could still be saved from the rain.'),
      ), feel({ trust: -1 }), quest({ personal: { is: ['underdog'], feelings: { admiration: 1 } } }), flag('rival-read-letter'), done('R9.open'))),
      ch('Offer to battle.', fight(script(
        page(R('...Yeah. Okay. Why not.'), 'They stand up in the rain and send out their team.'),
        page('They play badly. Really badly. Halfway through, they start laughing and cannot stop.'),
      ), rival({ lv: 0, size: 3 }), feel({ respect: 1 }), flag('rival-rain-battle'), done('R9.open'))),
      ch('Leave them be.', out('You leave them be. The rain keeps falling. They never mention it, and neither do you.', done('R9.open'))),
    ]),

  part('rq-r9-wall', 'A Rival\'s Bad Day: The Wall', { tint: '#1d2430', effect: 'rain' },
    script(SAT, page(RS('event', {
      prodigy: 'My family\'s had someone in the Hall for three generations. I lost to a Gym. ...To a Gym.',
      'champion-chaser': 'Six badges by now, I told everyone. I\'ve got none from here. None.',
      'bitter-challenger': 'Everyone was watching. Of course they were. They always are when it goes wrong.',
      enthusiast: 'I really thought I had it. I had a whole celebration planned. With a cake.',
      idealist: 'I wanted to make them proud. I don\'t know if they\'d even notice if I did.',
      strategist: 'I had a plan for every turn. The plan was wrong from the first one.',
      protector: 'My team gave everything. I\'m the one who let them down. Not them.',
      underdog: 'Everyone back home said I\'d quit by now. I didn\'t quit. I just keep losing.',
    }))),
    [
      ch('"Which Gym?"', out(script(page('They tell you. They tell you everything: every turn, every switch, the exact moment it went wrong.', 'By the end they are almost smiling at how bad it was.')))),
      ch('"It\'s one loss."', out(script(page(R('...Yeah.'), 'They do not believe you. But they hear it. That is something.')))),
      ch('(Say nothing. Stay.)', out(script(page('Longer. They move the letter so it lies between you, face down.', R('...You don\'t have to stay.'), 'They do not get up either.')))),
    ]),

  // The reports: two losses, then a win. No badge; they do not use the rival slot.
  beat('rq-r9-report-1', 'A Rival\'s Bad Day: The Rival Report', { minStage: 5, requires: [due('R9.report1')], tint: '#1d2430', effect: 'none' },
    script(page('The Rival Report, pinned up at the Center.', 'A photo: the Gym\'s door. {rival}, coming out of it, head down.')),
    [ch('Keep walking.', out('You look at it a moment longer than you need to, then keep walking.', done('R9.report1')))]),
  beat('rq-r9-report-2', 'A Rival\'s Bad Day: The Same Door', { minStage: 6, requires: [due('R9.report2')], tint: '#1d2430', effect: 'none' },
    script(page('The Rival Report again. The same door. The same angle.', '{rival} is looking straight at the camera this time. Furious.')),
    [ch('Keep walking.', out('Twice now. You find you are hoping, quite hard, for a third photo.', done('R9.report2')))]),
  beat('rq-r9-photo', 'A Rival\'s Bad Day: A Photograph', { minStage: 7, requires: [due('R9.photo')], tint: '#2a2a1d', effect: 'sparkle',
    remembers: [
      { id: 'sat', when: [yes('rival-sat-in-rain')], notice: note(page('At the edge of the frame, out of focus, a wet shoulder. Yours. It is the wall.', 'They took it that day, and kept it, and waited until they had earned the badge to send it.')) },
      { id: 'battle', when: [yes('rival-rain-battle')], notice: note(page('On the back, in pencil: "Rematch when I\'m good again. Soon."')) },
    ] },
    script(
      page('The Rival Report: the Gym\'s door. {rival} is not in the picture this time.', 'The door is open.'),
      page('At the Center, an envelope with your name on it. Inside, a photo: a badge, on an open palm.', 'No note.'),
    ),
    [ch('Keep the photo.', out('You keep it somewhere it will not bend.', done('R9.photo')))]),
];

export const EVENTS: Json[] = [...colours, ...fakeLead, ...badDay];

// Old ids folded into the scenes above.
export const REMOVE: string[] = [
  'living-rival-clash', // -> rival-swap (the Borrowed Team finale is the rival clash)
  // Beta 0.6 shortened builds of the same questlines, and their one-line flag readers.
  'rq-colours', 'rq-fake-lead', 'rq-straight-battle', 'rq-bad-day',
  'rq-echo-colours-swap', 'rq-echo-colours-ok', 'rq-echo-straight', 'rq-echo-read-letter',
];
void rq;
