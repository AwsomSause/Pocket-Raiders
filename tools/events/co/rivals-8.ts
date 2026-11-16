// Catalog Overhaul batch 5: the six rivals bookkeeping ids (CATALOG_LEDGER.md "Rivals": "All 45 rival scenes become beats inside the
// RIVAL questlines ... Each is now gated by the rival's Lead, Marks and six axes, and each has a personality-specific version").
// rival-views, ev-rivals-defeat, ev-rivals-victory, rival-berry-boss, rival-gloat, rival-grudge-spot. The catalog gives one line each;
// these rebuild that line as a short beat: Lead / Mark / axis gates, a personality line ({say ...}), and the pack's Marks
// (RIVAL_SYSTEM_OVERHAUL.md 3.3: The Hand Up, Left Standing). They take a free rival slot, never a scheduled beat's.
// Status note: docs/status/co-legends-rules-de.md (with row D+E). Build: npm run co:build -- rivals-8
import { $, any, ch, fight, flag, fr, out, rp, type Json } from '../dsl.ts';
import { feel, G, mark, met, note, page, quest, R, rival, rq, RS, script } from './_rivals.ts';

export const CATEGORY = 'rivals';

const slot = (): Json => rq({ slotFree: true });
const take = (): Json => quest({ takeSlot: true });
const lead = (atLeast?: number, atMost?: number): Json => rq({ lead: { ...(atLeast !== undefined ? { atLeast } : {}), ...(atMost !== undefined ? { atMost } : {}) } });
const last = (result: 'win' | 'lose'): Json => ({ kind: 'rivalLast', result });
const B = { group: G, tags: ['Rival', 'Relationship', 'Story'] };

export const EVENTS: Json[] = [
  // The Rival's Opinion: the rival reacts to your Shadow choices (a Shadow Pokémon taken off its trainer).
  {
    id: 'rival-views', ...B,
    requires: [met(1), { kind: 'flag', key: 'rescued', atLeast: 1, atMost: 99 }, slot()],
    intro: script(
      page('{rival} is leaning on a fence, arms folded. They have clearly heard.', R('You took a Shadow Pokémon off its trainer?'), R('Heroic, or just greedy?')),
      page(RS('event', {
        idealist: 'Tell me you did it for the Pokémon. Please.',
        strategist: 'Interesting move. I am trying to decide if it was a good one.',
        protector: 'Is it all right? Is it eating? They don\'t always eat, at first.',
        'champion-chaser': 'Strong, though. I bet it\'s strong.',
      })),
    ),
    choices: [
      ch('"Someone had to."', out(script(page('{rival} studies your face for a long time.', R('...Yeah. Someone did.'), 'They do not say "good". They nod like they mean it.')), feel({ trust: 1, respect: 1 }), flag('kindness'), { kind: 'attribute', key: 'charisma', amount: 1 }, take())),
      ch('"It\'s a strong Pokémon."', out(script(page(R('So that\'s what it was.'), 'Something in their voice closes, quietly, like a door.')), feel({ trust: -1, rivalry: 1 }), { kind: 'attribute', key: 'goodEvil', amount: -1 }, take())),
      ch('Say nothing.', out('You let the question sit between you. They let it sit too. Neither of you picks it up again.', take())),
    ],
    remembers: [{ id: 'idealist', when: [rq({ personality: ['idealist', 'protector'] })], notice: note(page('They have a Heal Ball in their hand. They are turning it over and over.')) }],
  },

  // Rival's Defeat: you won last time. "Do not say it."
  {
    id: 'ev-rivals-defeat', ...B,
    requires: [met(1), last('win'), slot()],
    intro: script(
      page('{rival} is sitting on a fence, staring at the ground. Their team is in their Balls. They have not let anyone out.', 'They notice you and look away.'),
      page(R('Do not say it.'), RS('lost', {
        'bitter-challenger': 'Again. Always again.',
        underdog: 'I really thought I had it. I really did.',
        prodigy: 'I have already worked out the mistake. I do not need you to explain it.',
      })),
    ),
    choices: [
      ch('Sit with them. Offer a Potion.', out(script(
        page('You sit on the fence. You hold out a Potion for their team. They do not take it for a while.', 'Then they do.'),
        page(R('...Thanks.'), 'Their Pokémon come out, one at a time, and the worst of the day goes out of their shoulders.'),
      ), { kind: 'loseItem', id: 'potion' }, mark('the-hand-up'), feel({ trust: 2, friendship: 1 }), take()), { requires: [{ kind: 'item', id: 'potion' }] }),
      ch('Tell them what you saw in the battle.', out(script(
        page('You tell them the one thing they did that nearly beat you.', 'They look up for the first time.'),
        page(R('You saw that?'), R('...Nobody ever sees that.')),
      ), rp(2), feel({ respect: 1, admiration: 1 }), take())),
      ch('Walk past without a word.', out(script(page('You walk past. You do not look back.', 'Behind you, very quietly, the fence creaks as they stand up.')), mark('left-standing'), feel({ rivalry: 1, friendship: -1 }), take())),
    ],
    remembers: [
      { id: 'streak', when: [lead(undefined, -2)], notice: note(page(R('That\'s twice. More than twice. I\'m counting.'), 'They are not counting out loud. They are counting.')) },
      { id: 'swept', when: [rq({ mark: 'swept' })], notice: note(page('One Ball on their belt is cracked down the side. It is the one your team went through first.')) },
    ],
  },

  // Rival's Victory: they won last time, and it was close.
  {
    id: 'ev-rivals-victory', ...B,
    requires: [met(1), last('lose'), slot()],
    intro: script(
      page('{rival} catches up with you, grinning, a little out of breath.', R('That was close. Admit it.'), R('I earned that win.')),
      page(RS('won', {
        'champion-chaser': 'One step closer. You\'re just a step on the way. A good step!',
        enthusiast: 'Did you SEE the last turn? I\'m going to dream about that turn.',
        protector: 'Your team all right? I didn\'t want to hurt anyone. Much.',
      })),
    ),
    choices: [
      ch('"You earned it."', out(script(page('They were ready for an argument. They do not know what to do without one.', R('...Yeah. I did.'), 'They say it again, quieter, to themselves.')), feel({ friendship: 1, respect: 1 }), take())),
      ch('"Rematch. Now."', fight(script(page(R('Now? Your team\'s still tired!'), R('...Fine. Fine! Don\'t cry about it after.'))), rival({ lv: 1, size: 3, win: [$(400), fr(1, 'party'), feel({ respect: 1 })], lose: [feel({ admiration: 1 })] }), take())),
      ch('Walk on.', out('You keep walking. They keep pace for three steps, still grinning, then let you go.', take())),
    ],
    remembers: [
      { id: 'thread', when: [rq({ mark: 'by-a-thread' })], notice: note(page(R('That close, though. That\'s what makes it count.'), 'Their last Pokémon is still limping. They are prouder of that than of anything.')) },
      { id: 'ahead', when: [lead(2)], notice: note(page('They tap their badge case without meaning to. It is fuller than yours.')) },
    ],
  },

  // A Berry for the Road: before a big fight, from a rival who likes you.
  {
    id: 'rival-berry-boss', ...B,
    requires: [met(2), rq({ feeling: { key: 'friendship', atLeast: 4 } }), slot()],
    intro: script(
      page('{rival} catches up with you outside the gate. They have a single Berry in their hand, unripe at the edges.', R('For luck.'), R('Do not make a big deal of it.')),
      page(RS('event', { 'bitter-challenger': 'I want to beat you at your best. That\'s all this is.', underdog: 'I picked it myself. It\'s the best one on the bush. Probably.' })),
    ),
    choices: [
      ch('Take it and say thank you.', out(script(page('You take it. You say thank you. They go red and pretend a Pidgey is very interesting.', 'Your team watches the whole thing and says nothing, kindly.')), any('oran-berry', 'sitrus-berry', 'lum-berry'), feel({ friendship: 1, trust: 1 }), fr(5, 'party'), take())),
      ch('Tell them to keep it for their own fight.', out(script(page(R('I have six. I\'m not an idiot.'), 'They give you one anyway. And then a second, for your lead, "because it looked hungry".')), any('oran-berry', 'sitrus-berry', 'lum-berry'), feel({ respect: 1 }), take())),
    ],
    remembers: [{ id: 'behind', when: [lead(undefined, -1)], notice: note(page('Their hand is shaking a little. They have their own fight coming. They came here first anyway.')) }],
  },

  // The Victory Lap: they won, and won easily. Only a rival who is ahead and holds No Contest or Swept does a lap.
  {
    id: 'rival-gloat', ...B,
    requires: [met(2), last('lose'), lead(1), slot()],
    intro: script(
      page('{rival}\'s team is still on the field, cheering. {rival} looks at you, very slowly, and starts a lap around the grass.', R('Say it with me.'), R('Second. Place.')),
      page(RS('won', {
        'champion-chaser': 'Somebody get a photographer. This is a historic day.',
        prodigy: 'It was not personal. It was simply correct.',
        protector: '...Sorry. I\'m sorry. That was mean. I\'m still doing the lap, though.',
        idealist: 'I am being gracious inside. You cannot see it, but it is there.',
      })),
    ),
    choices: [
      ch('Take it in silence, and go and train.', out(script(page('You do not say anything. You watch the whole lap. You remember every step of it.', 'That night your team trains until the stars come out.')), rp(30), { kind: 'attribute', key: 'ragePeace', amount: -1 }, feel({ rivalry: 1 }), take())),
      ch('"Again. Right now."', fight(script(page(R('A rematch? While I\'m still on my lap?'), R('...Oh, you are SO on.'))), rival({ lv: 2, size: 3, win: [$(800), { kind: 'levels', amount: 1, who: 'party' }, feel({ respect: 1, resentment: 1 })], lose: [feel({ admiration: 1 })] }), take())),
      ch('Say it with them: "Second place."', out(script(page('You say it with them, flat and dead serious.', 'They stop halfway round the lap. They laugh before they can help it.'), page(R('...You\'re impossible.'), 'They do not finish the lap.')), feel({ friendship: 1, rivalry: -1 }), take())),
    ],
    remembers: [{ id: 'nocontest', when: [rq({ mark: 'no-contest' })], notice: note(page(R('You didn\'t even knock one out. Not one!'), 'They are delighted about it. They are going to bring it up for weeks.')) }],
  },

  // Their Spot: the rival has camped beside tall grass for hours, waiting on one Pokémon. Only a rival who feels the rivalry (3+).
  {
    id: 'rival-grudge-spot', ...B,
    requires: [met(1), { kind: 'partySize', atLeast: 3 }, rq({ feeling: { key: 'rivalry', atLeast: 3 } }), slot()],
    intro: script(
      page('{rival} has been camped beside a tall patch of grass for hours. There is a flask, a blanket and a very small, very serious tent.', 'They are waiting on one Pokémon.'),
      page('You see it before they do. Your Poké Ball is already in your hand.', RS('catch', { strategist: 'Don\'t. Move. I have a plan and the plan is not you.' })),
    ),
    choices: [
      ch('Catch it first.', out(script(page('It is over before they have stood up.', R('Are you SERIOUS.'), 'They are going to tell this story at the League. They are going to tell it wrong.')), { kind: 'join', species: [], types: [], levelBonus: 0, shinyMultiplier: 1 }, feel({ rivalry: 2, resentment: 1, friendship: -1 }), flag('rival-heat', 2), take())),
      ch('Let them have it.', out(script(page('You put your Ball away and sit down on their blanket.', 'When it finally comes out, they catch it. They look over at you, and do not say thank you, and do not have to.')), feel({ friendship: 1, trust: 1 }), fr(4, 'party'), flag('rival-friend', 2), take())),
      ch('"Race you for it."', fight(script(page(R('Fine. Winner takes the grass.'), 'Neither of you notices the Pokémon wander off halfway through the fight.')), rival({ lv: 1, size: 2, win: [{ kind: 'join', species: [], types: [], levelBonus: 0, shinyMultiplier: 1 }, feel({ respect: 1 })], lose: [feel({ admiration: 1 })] }), take())),
    ],
    remembers: [{ id: 'resent', when: [rq({ feeling: { key: 'resentment', atLeast: 5 } })], notice: note(page('They see you. Their hand goes to the tent zip like they want to hide inside it.', R('Not this time. Not THIS one.'))) }],
  },
];

export const REMOVE: string[] = [];
