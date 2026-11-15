// Catalog Overhaul Pack, rival questlines R13 to R15 (QUESTLINES_RIVALS.md + RIVALS_PLACED.md).
// R13 The One Who Follows, R14 Emptied Shelves, R15 A Gift You Should Question.
// Build: npm run co:build -- rivals-5
import { $, ch, fight, flag, item, out, room, type Json } from '../dsl.ts';
import { beat, done, due, feel, feels, foe, met, note, page, part, quest, R, rival, rq, RS, script, who, yes } from './_rivals.ts';

export const CATEGORY = 'rivals';

const is = (key: string, value: number): Json => ({ kind: 'flag', key, atLeast: value, atMost: value });

// ======================================================================================================
// R13. THE ONE WHO FOLLOWS (becomes a secondary rival). A stage of sightings (A4+, Steps 4, 9, 14), the meeting (Step 16),
// walking together (S+1), the question (S+2, Step 12). Same run: the answer sets who they are next region.
// ======================================================================================================
const STRANGER = 'Stranger';
const MIRROR = (win: Json[] = []): Json => foe('Stranger', { cls: 'ace-trainer', size: 3, mirror: true, win, lose: [] });
const SIGHTED = [quest({ ahead: [{ event: 'rq-r13-hat', step: 9 }, { event: 'rq-r13-tree', step: 14 }, { event: 'rq-r13-meet', step: 16 }] }), done('R13.open')];

const follower: Json[] = [
  beat('w4-wandering-trainer', 'Someone Is Following You', { minStage: 4, requires: [due('R13.open')], tint: '#1f2a1f', effect: 'fog' },
    script(page('{lead} stops and looks back down the path, ears up.', 'You look too. Nothing. A bush, moving, with no wind to move it.')),
    [
      ch('Keep walking.', out('{lead} keeps glancing back for a while. Then, reluctantly, it lets it go.', ...SIGHTED)),
      ch('"Hello?"', out('Nobody answers. The bush stops moving, very suddenly, the way bushes do not.', ...SIGHTED)),
    ]),
  part('rq-r13-hat', 'Someone Is Following You: A Hat', { tint: '#1f2a1f', effect: 'none' },
    script(page('A hat, behind a wall. The wall is too low. Most of a person is visible behind it, crouching, very still.')),
    [ch('Pretend not to see.', out('You walk past. The hat turns slowly to follow you.'))]),
  part('rq-r13-tree', 'Someone Is Following You: Up a Tree', { tint: '#1f2a1f', effect: 'none' },
    script(page('There is somebody up a tree. They have dropped a notebook.', 'It lies open on the path: a drawing of your last battle, every switch marked with arrows.')),
    [
      ch('Leave it where it is.', out('When you look back, the notebook is gone, and so is the person in the tree.')),
      ch('Hand it up to them.', out('A hand comes down out of the leaves, takes it, and vanishes. A very small voice says, "Thank you."')),
    ]),

  // Beat 1, Step 16, optional: the stranger steps out.
  part('rq-r13-meet', 'Someone Is Following You: The Stranger', { tint: '#1f2a1f', effect: 'none' },
    script(page('At last they step out onto the path: a trainer about your age, notebook clutched to their chest.'), page(who(STRANGER, 'I watched you win a battle you should have lost.'), who(STRANGER, 'I want to know how.'))),
    [
      ch('"Battle me and find out."', fight(script(page(who(STRANGER, 'I was hoping you\'d say that.'), 'They send out three Pokémon. You know them. They are yours: the same kinds, the same moves, the same order.')), MIRROR(), flag('follower-battled'))),
      ch('"Walk with me."', out(script(page('They blink, as if nobody has ever said that to them.', who(STRANGER, '...Really? Just walk? Right. Yes. I can walk.'))), flag('follower-walked'))),
      ch('"Stop following me."', out(script(page('They go red. They nod. They turn round and walk back the way they came.'), page('You are almost sure that is the end of it.')), flag('follower-stopped'))),
    ]),

  // S+1: Your Travelling Companion. One question at each + node; then they challenge.
  beat('w4-wanderer-visit', 'Your Travelling Companion', { minStage: 5, requires: [yes('follower-walked'), due('R13.walk')], tint: '#1f2a1f', effect: 'glint' },
    script(page('The stranger falls in beside you at the stage gate, notebook already open.', who(STRANGER, 'I\'ve got questions. I\'ve numbered them. Is that all right?')), page(who(STRANGER, 'Why that one first? The Pokémon you lead with. Why that one?'))),
    [
      ch('"It was the first one I trusted."', out('They write it down, very slowly, and underline "trusted".', quest({ ahead: [{ event: 'rq-r13-ask-2', step: 8 }, { event: 'rq-r13-ask-3', step: 13 }, { event: 'w4-wanderer-challenge', step: 17 }] }), done('R13.walk'))),
      ch('"It\'s the one that matches up best."', out('They write it down, and draw a little table next to it.', quest({ ahead: [{ event: 'rq-r13-ask-2', step: 8 }, { event: 'rq-r13-ask-3', step: 13 }, { event: 'w4-wanderer-challenge', step: 17 }] }), done('R13.walk'))),
    ]),
  part('rq-r13-ask-2', 'Your Travelling Companion: Another Question', { tint: '#1f2a1f', effect: 'none' },
    script(page(who(STRANGER, 'Do you always look at them before you pick?'), 'They mean your Pokémon. You had not noticed that you do.')),
    [ch('"Always."', out('They nod, as if that settles something important.')), ch('"I didn\'t know I did."', out('They write that down too. "Didn\'t know," underlined twice.'))]),
  part('rq-r13-ask-3', 'Your Travelling Companion: The Last Question', { tint: '#1f2a1f', effect: 'none' },
    script(page(who(STRANGER, 'What do you do when you\'re frightened? You don\'t look it.'), who(STRANGER, 'Is that a trick? Can I have it?'))),
    [ch('"You can have it."', out('You show them how you breathe before a battle. They copy it badly. Then less badly.')), ch('"I just am frightened. I go anyway."', out('They stop walking. They write nothing at all.'))]),
  part('w4-wanderer-challenge', 'The Wanderer Steps Out', { tint: '#1f2a1f', effect: 'shake' },
    script(page('At the end of the stage they stop and close the notebook.', who(STRANGER, 'I think I\'ve got it now. Most of it.'), who(STRANGER, 'Show me the rest.'))),
    [ch('Battle them.', fight('They lead with something just like yours, and look at it before they pick.', MIRROR()))]),

  // S+2, Step 12: the question. The answer sets their arc next region (The Race / The Truce / The Student).
  beat('rq-r13-question', 'The One Who Follows: Why', { minStage: 6, requires: [due('R13.finale')], tint: '#1f2a1f', effect: 'glint',
    remembers: [{ id: 'stopped', when: [yes('follower-stopped')], notice: note(page('You told them to stop following you. They did, for a while. They are here anyway. They look embarrassed about it.')) }] },
    script(page('The stranger is waiting at the side of the path. The notebook is open at the last clean page.'), page(who(STRANGER, 'One more. The only one that matters.'), who(STRANGER, 'Why do you do this?'))),
    [
      ch('"To win."', out(script(page('They write it down, underline it, and shut the notebook for good.', who(STRANGER, 'Then I\'ll race you. Next region. Every stage.'))), flag('follower-answer', 1), done('R13.finale'))),
      ch('"For them."', out(script(page('You look at your team. They watch you look. They write it down, underline it, and shut the notebook for good.', who(STRANGER, 'Then maybe we don\'t have to be enemies. Next region, I\'ll find out.'))), flag('follower-answer', 2), done('R13.finale'))),
      ch('"I don\'t know yet."', out(script(page('They stare at you. Then they laugh, properly, for the first time.', who(STRANGER, 'Me neither.'), 'They write it down, underline it, and shut the notebook for good.'), page(who(STRANGER, 'Then I\'ll keep watching. Next region. Closer, this time.'))), flag('follower-answer', 3), done('R13.finale'))),
    ]),

  // Next region: they are a secondary rival, shaped by the answer.
  beat('rq-r13-rival', 'The One Who Follows: A Rival Now', { minStage: 7, requires: [yes('follower-answer'), due('R13.next')], tint: '#1f2a1f', effect: 'shake',
    remembers: [
      { id: 'truce', when: [is('follower-answer', 2)], intro: script(page('The stranger is waiting at the stage gate with two cups of something hot.', who(STRANGER, 'For them, you said. I\'ve been trying it. It\'s harder than winning.'), who(STRANGER, 'Battle me anyway? Friendly.'))) },
      { id: 'student', when: [is('follower-answer', 3)], intro: script(page('The stranger is waiting at the stage gate with a brand-new notebook, still blank.', who(STRANGER, 'You didn\'t know yet. Do you know now?'), who(STRANGER, 'Show me. I\'ll take notes.'))) },
    ] },
    script(page('The stranger is waiting at the stage gate, already warmed up, already counting.', who(STRANGER, 'To win, you said. So: race. Me first.'))),
    [ch('Battle the stranger.', fight('They do not look at their Pokémon before they pick. Then, after a second, they do.', MIRROR(), done('R13.next')))]),
];

// ======================================================================================================
// R14. EMPTIED SHELVES (Champion-Chaser, Prodigy). The shop at the Town (A5+, Step 7); the rival's camp two nodes on.
// ======================================================================================================
const SHOP = page(who('Shopkeeper', 'Paid in full. Very polite. Took everything.'), 'Every Poké Ball. Every Revive. The shelves behind her are bare to the wood.');
const CAMP_AHEAD = quest({ ahead: [{ event: 'rq-r14-camp', step: 9 }] });

const shelves: Json[] = [
  beat('rival-buyout', 'Emptied Shelves', { minStage: 5, requires: [met(1), due('R14.open')], cast: ['trainer.worker_m'], tint: '#2a261d', effect: 'none',
    remembers: [
      { id: 'ahead', when: [{ kind: 'rivalState', leadAtLeast: 2 }], notice: note(page(who('Shopkeeper', 'Said they were stocking up for the League.'))) },
      { id: 'behind', when: [{ kind: 'rivalState', leadAtMost: 0 }], notice: note(page(who('Shopkeeper', 'They looked frightened, honestly.'), 'She says it gently, as if it might be catching.')) },
    ] },
    script(page('The shopkeeper is wringing her hands before you are through the door.', who('Shopkeeper', 'Your friend. The one in all the papers. They came in this morning.')), SHOP),
    [
      ch('"I\'ll go to the next town."', out(script(page('A detour, then. The next town\'s shop is a node out of your way.', 'Their shelves, at least, are full.')), { kind: 'addStop', stop: 'shop' }, done('R14.open'))),
      ch('"What else have you got?"', out(script(page('She thinks, then fetches a box from the back: a few Great Balls, honest stock, at a fair price.', who('Shopkeeper', 'Regular\'s discount. You look like you\'ll be a regular.'))), $(-300), item('great-ball', 3), done('R14.open'))),
      ch('"I\'ll find them."', out(script(page(who('Shopkeeper', 'Went east. Two nodes, I\'d say. They had a cart.')), page('Their camp is on your map now, a little further along.')), CAMP_AHEAD, done('R14.open'))),
    ]),

  part('rq-r14-camp', 'Emptied Shelves: The Haul', { tint: '#2a261d', effect: 'none',
    remembers: [
      { id: 'ahead', when: [{ kind: 'rivalState', leadAtLeast: 2 }], notice: note(page(R('It\'s the League. You stock for the League. Everybody knows that.'))) },
      { id: 'behind', when: [{ kind: 'rivalState', leadAtMost: 0 }], notice: note(page('They do not look up.', R('I keep thinking: what if I run out. In the middle. With you watching.'))) },
    ] },
    script(page('A camp. Forty Poké Balls in rows. Revives stacked like bricks.', '{rival} is counting them. They lose count. They start again.')),
    [
      ch('"Give half back."', out(script(page('They push half of it across to you with their foot.', R('...I\'d have sold them back to you. At a mark-up.'), R('I thought about it. I\'m telling you so you know I thought about it.'))), item('poke-ball', 5), item('revive', 1), flag('rival-shelves-shared')), { requires: [feels('trust', 4)] }),
      ch('Battle for it.', fight(script(page(R('Fine. Winner takes the lot.'), 'They stack the crates behind them like a wall.')), rival({ lv: 1, quest: { counter: 'lead' }, win: [item('poke-ball', 10), item('revive', 2)] }), flag('rival-shelves-won'))),
      ch('"Keep it."', out(script(page('They stare at you. Then at the haul. Then, slowly, they stop counting.', R('...Right. Thanks.'), 'They mean it more than they would like to.')), feel({ respect: 1 }), flag('rival-shelves-let'))),
    ]),

  // Remembers: let them keep it -> a bag of Balls at the next Center at the region's end, no note.
  beat('rival-care-package', 'A Care Package', { minStage: 5, stop: 'heal', requires: [yes('rival-shelves-let'), due('R14.package')], tint: '#2a261d', effect: 'sparkle' },
    script(page('At the Center, the nurse slides a paper bag across the counter.', 'Poké Balls. A lot of them. Some still have the price stickers from that shop. There is no note.')),
    [ch('Take the bag.', out('You do not need a note. You know whose handwriting it would have been.', item('poke-ball', 8), item('great-ball', 2), done('R14.package')))]),
  // Remembers: battled for it -> they never buy out a shop again, and say so.
  beat('rq-r14-never', 'Emptied Shelves: Never Again', { minStage: 6, requires: [yes('rival-shelves-won'), due('R14.never')], tint: '#2a261d', effect: 'none' },
    script(page('{rival} passes you outside a shop with exactly one Poké Ball in their hand.', R('One. I bought one. I\'m never doing that again.'), R('Don\'t say anything.'))),
    [ch('Say nothing.', out('You say nothing. They look grateful, and a little annoyed that you managed it.', done('R14.never')))]),
];

// ======================================================================================================
// R15. A GIFT YOU SHOULD QUESTION (The Temptation). Needs the region's team awake. The gift (A6+, Step 9), ambushes if used,
// the decoy (next stage, Step 11), the sponsor (the region's end; the team's climax reads what you told them).
// ======================================================================================================
const GIFT = item('lucky-egg', 1);
const AMBUSH = { kind: 'trainer', name: 'Grunt', evil: 'grunt', friendly: true, size: 3, types: [], levelBonus: 0, win: [], lose: [] };
const AWAKE = { kind: 'evil', after: 1 };

const gift: Json[] = [
  beat('rival-trap-gift', 'A Gift You Should Question', { minStage: 6, requires: [met(1), AWAKE, due('R15.open')], tint: '#2a1d2a', effect: 'glint' },
    script(page('A box on your bed at the inn, with {rival}\'s handwriting on the tag.', 'The wrapping is too neat.'), page('The knot is a sailor\'s knot.', '{rival} cannot tie a sailor\'s knot. You have watched them try.')),
    [
      ch('Open it and use it.', out(script(page('A Lucky Egg, warm in your hand. It is a good gift. It is a very good gift.', 'You do not notice the faint, slow blink under the lining.')), GIFT, flag('rival-gift-used'), quest({ stamp: 'rq-r15-gift-at' }), done('R15.open'))),
      ch('Check it first.', out(script(page('Under the lining: a disc the size of a coin. It is warm. It blinks, slowly.', '{lead} growls at it.'), page('You prise it out and crush it under your heel. The Lucky Egg you keep.')), GIFT, flag('rival-gift-found'), done('R15.open'))),
      ch('Use it as a decoy.', out(script(page('You find the blinking disc, and leave it right where it is.', 'Tomorrow you will put the whole box somewhere useful.')), flag('rival-gift-turned'), done('R15.open'))),
      ch('Ask {rival}.', out(script(page('You find them at the Center and hold up the box.', R('I didn\'t wrap it. A sponsor asked me to pass it on.'), R('They\'ve been very generous. Why?'))), GIFT, flag('rival-gift-asked'), done('R15.open'))),
    ]),

  // If used: for the rest of the region, one extra team battle per stage. The tracker's blink marks it.
  beat('rq-r15-ambush', 'A Gift You Should Question: The Blink', { minStage: 6, requires: [yes('rival-gift-used'), rq({ sameRegion: 'rq-r15-gift-at', stale: 'rq-r15-ambush-at' })], tint: '#2a1d2a', effect: 'flicker' },
    script(page('Something in your bag blinks. Slowly. Then the bushes on both sides of the path stand up.', who('Grunt', 'There you are. Right where the little light said.')), page('On the board at the last Center, the Rival Report: {rival}, smiling, shaking hands with someone in a good coat. Accepting more help.')),
    [ch('Fight your way through.', fight('They come out of the bushes three at a time.', AMBUSH, quest({ stamp: 'rq-r15-ambush-at', again: ['rq-r15-ambush'] })))]),

  // The decoy: the next stage, Step 11. An empty node, and the team's camp on a side branch.
  beat('rq-r15-decoy', 'A Gift You Should Question: A Stump', { minStage: 7, requires: [yes('rival-gift-turned'), due('R15.decoy')], tint: '#2a1d2a', effect: 'net' },
    script(
      page('You leave the gift on a stump and step back into the trees.'),
      page('Six Grunts. A net. A great deal of shouting. A stump.', who('Grunt', 'It\'s a stump.'), who('Another Grunt', 'It\'s THEIR stump.')),
      page('Behind them, unguarded: their camp. And on a crate, a ledger.'),
    ),
    [ch('Read the ledger.', out(script(page('Payments, in neat columns. Gifts, passed through a sponsor. The sponsor\'s name, again and again:', '{lieutenant}, of {evil}.')), item('great-ball', 3), flag('rival-sponsor-known'), done('R15.decoy')))]),

  // The finale: before the team's climax. What you tell them decides how they arrive there.
  beat('rq-r15-sponsor', 'A Gift You Should Question: The Sponsor', { minStage: 7, requires: [AWAKE, due('R15.finale')], tint: '#2a1d2a', effect: 'none', priority: 80,
    remembers: [{ id: 'trust', when: [feels('trust', 5)], hide: [0], addChoices: [
      ch('"Your sponsor is {lieutenant}."', out(script(
        page('They do not argue. They take the sponsor\'s pin off their collar and look at it for a long time.'),
        page(RS('event', {
          'champion-chaser': 'I thought somebody finally thought I was worth it.',
          prodigy: 'Of course. Nobody gives anything for nothing. I should have done the sums.',
          underdog: 'They said they believed in me. Nobody\'s ever said that before. I wanted it to be true.',
          'bitter-challenger': 'Figures. The only people who ever backed me wanted something.',
        }), 'They put the pin on the ground, carefully, like something that might go off.'),
        page('Then they walk to the square, where the sponsor is waiting, and hand back every gift in front of everyone.'),
      ), flag('rival-told-sponsor'), done('R15.finale'))),
    ] }] },
    script(page('{rival} is in a new coat. A good coat. There is a small pin on the collar: {evil}\'s mark, if you know where to look.', R('My sponsor sends their regards. Isn\'t it great? Somebody finally noticed.'))),
    [
      ch('"Your sponsor is {lieutenant}."', out(script(page('Their face closes like a door.', R('You\'re jealous.'), R('Somebody finally backs me, and you can\'t stand it.')), page('They walk off with the pin still on. They will find out at the climax. On the wrong side.')), flag('rival-sponsor-denied'), done('R15.finale'))),
      ch('Say nothing.', out(script(page('You say nothing. They straighten the pin and go.', 'You will be there when they find out. You will have to be.')), flag('rival-sponsor-silent'), done('R15.finale'))),
    ]),
];

export const EVENTS: Json[] = [...follower, ...shelves, ...gift];

// Old ids folded into the scenes above.
export const REMOVE: string[] = [
  'rival-gift', // -> rival-trap-gift (a friend paying you back is the sponsor's gift)
  // Beta 0.6 shortened builds of the same questlines, and their one-line flag readers.
  'rq-follower', 'rq-follower-why', 'rq-emptied-shelves', 'rq-shelves-confront', 'rq-gift', 'rq-sponsor-truth',
  'rq-echo-follower-to-win', 'rq-echo-follower-for-them', 'rq-echo-follower-unsure', 'rq-echo-follower-walked',
  'rq-echo-shelves-let', 'rq-echo-shelves-won', 'rq-echo-shelves-shared', 'rq-echo-gift-found', 'rq-echo-gift-used',
];
void rival; void room;
