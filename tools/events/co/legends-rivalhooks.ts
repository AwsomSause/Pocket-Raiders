// Catalog Overhaul batch 5, row D: rival hooks (legends SYSTEM lines that go "into the RIVALS questlines").
// Ledger lines: mr-rival-echoes (Rival Archive), face-rival-honors, face-rival-shopping, kieran-rivalry, old-rival-old-friend,
// cheer-rival-match. The four drama moments (rivalInterruption, unfinishedGrudge, rematchReversal, pokemonRecognition) are engine,
// not events: src/core/drama/rivalHooks.ts. Status note: docs/status/co-legends-rules-de.md.
// Every scene is gated by the rival's Lead, Marks and six axes and has personality lines ({say ...} or a personality's own line).
// They use a free rival slot of the stage (rq slotFree + takeSlot), so they never crowd out a scheduled rival questline beat.
// Build: npm run co:build -- legends-rivalhooks
import { $, any, ch, fight, flag, fr, out, rp, type Json } from '../dsl.ts';
import { feel, feel2, G, met, note, page, quest, R, rival, rq, RS, say, script, who } from './_rivals.ts';

export const CATEGORY = 'legends';

const slot = (): Json => rq({ slotFree: true });
const take = (): Json => quest({ takeSlot: true });
const lead = (atLeast?: number, atMost?: number): Json => rq({ lead: { ...(atLeast !== undefined ? { atLeast } : {}), ...(atMost !== undefined ? { atMost } : {}) } });
const echoes = (atLeast: number): Json => ({ kind: 'pastAlly', has: 'echoes', atLeast });
const STANDING = { group: G, tags: ['Rival', 'Relationship', 'Story'] };

export const EVENTS: Json[] = [
  // ---------------------------------------------------------------------------------------------
  // The Echo Chamber of Rivals: the Rival Archive of THIS run. It plays back real lines a rival said to you on this road.
  {
    id: 'mr-rival-echoes', ...STANDING,
    requires: [met(1), echoes(3)],
    scene: { cast: [], tint: '#1e2030', effect: 'float' },
    intro: script(
      page('A round stone chamber with no roof. You do not remember walking in.', 'Your footsteps come back to you a heartbeat late. Then other sounds come back too.'),
      page('Voices. Real ones. Things your rivals said to you on this road, word for word.', '"{pa:echo3}"', '"{pa:echo2}"'),
      page('The newest one hangs in the air longer than the rest.', '"{pa:echo1}"', 'Some of it is kinder than you remember. Some of it is exactly as sharp.'),
    ),
    choices: [
      ch('Listen to every echo.', out(script(
        page('You sit on the cold floor and let them play. Every taunt. Every grudging compliment. Every "next time".', 'Heard all at once, they sound different.'),
        page('Underneath the bragging there is a lot of worry. Most of it is about you.', 'Your team listens too. They have heard all of this before. They remember who said it.'),
      ), feel({ friendship: 1, respect: 1 }), fr(3, 'party'), flag('echoes-listened'), { kind: 'moment', text: 'Heard my rival\'s words again in the Echo Chamber.', importance: 55 })),
      ch('Shout back.', out(script(
        page('You shout your own answer into the chamber. It comes back twice as loud.', 'The old lines go quiet under it, one by one.'),
        page('It feels good. Then it feels like the end of an argument nobody else heard.'),
      ), feel({ rivalry: 1 }), { kind: 'attribute', key: 'strength', amount: 1 })),
      ch('Say what you never said to them.', out(script(
        page('You say it to the empty room. "Thank you for pushing."', 'It does not echo. The chamber keeps that one.'),
        page('Somewhere down the road, you feel sure, {rival} sneezes and scowls about it.'),
      ), feel({ trust: 1, friendship: 1 }), { kind: 'attribute', key: 'goodEvil', amount: 1 })),
    ],
    remembers: [
      { id: 'fond', when: [rq({ feeling: { key: 'friendship', atLeast: 6 } })], notice: note(page('One echo you do not recognise: {rival}, saying your name to someone else.', 'Proudly. When they did not know you could hear.')) },
      { id: 'bitter', when: [rq({ feeling: { key: 'resentment', atLeast: 5 } })], notice: note(page('One echo is a door slamming. Just that. It plays three times.')) },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // Rival Honors Day: the rival judges you. What they say depends on who is ahead (Lead) and on their personality.
  {
    id: 'face-rival-honors', ...STANDING, stop: 'event',
    requires: [met(1), slot()],
    scene: { cast: [], tint: '#3a3a2e', effect: 'confetti' },
    intro: script(
      page('A ceremony for the region\'s young talent. Bunting, folding chairs, a brass band that knows three songs.', 'On the judges\' panel, arms crossed, sits {rival}.'),
      page('They look weirdly nervous. They keep straightening a name card that says JUDGE.', RS('event', {
        'champion-chaser': 'They asked me because I\'m winning. Obviously.',
        'bitter-challenger': 'I didn\'t ask to sit here. Don\'t read anything into it.',
        enthusiast: 'They gave me a BELL. If you do something cool I get to ring the BELL.',
        idealist: 'I\'m going to be fair. Even to you. Especially to you.',
        strategist: 'I have a scoring sheet. Eleven categories. You will not enjoy it.',
        protector: 'Just do your best, all right? Nobody here wants you to fail.',
        prodigy: 'Technique, presentation, timing. I will notice everything.',
        underdog: 'I don\'t know why they picked me. I really don\'t.',
      })),
    ),
    choices: [
      ch('Give your best demonstration.', out(script(
        page('{lead} takes the floor. The band stops pretending to play.', 'It is the best thing you have done together all week, and you both know it halfway through.'),
        page('{rival} holds up a 9. Looks at it. Changes it to an 8.', R('So you don\'t get a big head.'), 'The audience boos them, cheerfully. They go red to the ears.'),
      ), feel({ respect: 1, admiration: 1 }), rp(50), { kind: 'attribute', key: 'charisma', amount: 1 }, take())),
      ch('Bow to the judge.', out(script(
        page('You bow to the panel, low and slow and entirely serious.', '{rival} does not know where to put their hands.'),
        page(R('...Stop that. People are looking.'), 'They are smiling when they say it. They are trying very hard not to.'),
      ), feel({ friendship: 1, trust: 1 }), fr(2, 'party'), take())),
      ch('Tease the judge.', out(script(
        page('"Is the judge qualified?" you ask, loudly. The crowd laughs.', '{rival} rings the little brass bell on the table. Hard. Several times.'),
        page(RS('lost', { 'bitter-challenger': 'Write that down. I\'m writing that down.' }), 'You get a 6. You deserved a 6.'),
      ), feel({ rivalry: 1, friendship: -1 }), { kind: 'attribute', key: 'luck', amount: 1 }, take())),
    ],
    remembers: [
      { id: 'ahead', when: [lead(2)], notice: note(page('The program lists the judges with their records. {rival}\'s is longer than yours this year.', 'They saw you read it. They pretend they did not.')) },
      { id: 'behind', when: [lead(undefined, -1)], notice: note(page('Someone in the crowd whispers: "Isn\'t that the one who keeps losing to them?"', '{rival}\'s jaw tightens. They score the next contestant very fairly. Too fairly.')) },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // An Old Face on the Road: a rival you have fought more than once. Not a battle: how far have you come?
  // The swap is an honest trade between two raised Pokémon (their side: one they raised and fielded against you this run).
  {
    id: 'old-rival-old-friend', ...STANDING,
    requires: [met(2), slot(), rq({ feeling: { key: 'respect', atLeast: 3 } })],
    scene: { cast: [], tint: '#2a2038', effect: 'glint' },
    intro: script(
      page('{rival} is sitting on a fence by the road. They have been waiting a while. There is a sandwich wrapper beside them, folded very small.'),
      page(R('Not a battle today.'), R('I want to see how far you\'ve come. Properly. Not in the middle of a fight.')),
      page(RS('event', {
        protector: 'You look tired. Good tired, I think. I hope.',
        'bitter-challenger': 'Don\'t look so surprised. I can sit still. Sometimes.',
        idealist: 'We have been fighting so long I forgot to ask how you are.',
      })),
    ),
    choices: [
      ch('Train together.', out(script(
        page('You spend the afternoon running drills side by side. Neither of you keeps score. Both of you notice the other not keeping score.'),
        page(R('Your {lead} is faster than last time.'), R('Don\'t tell it I said that.')),
      ), { kind: 'levels', amount: 1, who: 'party' }, fr(5, 'party'), feel({ friendship: 1, respect: 1 }), take())),
      ch('A friendly match.', fight(script(page(R('Friendly. That means I am only trying ninety per cent.'), 'They are lying. It is a hundred and ten.')),
        rival({ lv: 1, size: 3, win: [$(900), any('nugget', 'big-pearl', 'pearl'), feel({ respect: 1 })], lose: [feel({ admiration: 1 })] }), take())),
      ch('Trade partners for good.', out(script(
        page('{rival} looks at you for a long moment. Then at their own team.', R('You mean it. A real trade. Raised for raised.')),
        page('They hold out a Poké Ball with a scuff on it you have seen across a battlefield more than once.', R('Look after them. They hate the rain.')),
      ), { kind: 'honestTrade', id: 'old-rival-old-friend', rival: true }, feel({ trust: 2, friendship: 1 }), flag('rival-traded'), take()), { requires: [rq({ feeling: { key: 'trust', atLeast: 4 } })] }),
      ch('Walk on.', out(script(page('You nod and keep walking. They nod back.', 'Some days that is enough. You both know it is not one of those days.')), feel({ friendship: -1 }), take())),
    ],
    remembers: [
      { id: 'ahead', when: [lead(2)], notice: note(page(R('I\'m ahead. I know I\'m ahead. I still wanted to check you were all right.'))) },
      { id: 'behind', when: [lead(undefined, -2)], notice: note(page(R('You\'re beating me. I wanted to see what that looks like up close.'), R('It looks like a person who eats lunch. Huh.'))) },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // A Rival Match to Cheer: the main and second rival square off. Cheering moves both rivals' axes, then the watched fight.
  // The watched fight is R11's CPU-versus-CPU battle (quest.watch); the cheered side starts with Attack and Sp. Atk +1.
  {
    id: 'cheer-rival-match', ...STANDING,
    requires: [met(1), rq({ second: true }), slot()],
    scene: { cast: [], tint: '#20202a', effect: 'confetti' },
    intro: script(
      page('A friendly match in the square. {rival} on one side, {rival2} on the other.', 'The crowd is split down the middle, and loud about it.'),
      page('Both of them spot you on the fence at the same moment.', who('{rival2}', 'Oh, good. A tiebreaker.'), R('Don\'t you dare.')),
      page('You have a voice. Everyone here has noticed.'),
    ),
    choices: [
      ch('Cheer for {rival}.', fight('You shout their name. {rival} grins without looking round. {rival2} hears it too, and squares their shoulders.',
        rival({ lv: 1, quest: { watch: true }, win: [{ kind: 'addEvent', eventId: 'cheer-rival-match-after' }], lose: [{ kind: 'addEvent', eventId: 'cheer-rival-match-after' }] }),
        quest({ set: { key: 'rq-r11-cheer', value: 1 } }), feel({ friendship: 1, admiration: 1 }), feel2({ rivalry: 1 }), flag('cheered-main'), take())),
      ch('Cheer for {rival2}.', fight('You shout their name. {rival2} stands a little straighter. {rival} glances over once, sharp, and then fights harder.',
        rival({ lv: 1, quest: { watch: true }, win: [{ kind: 'addEvent', eventId: 'cheer-rival-match-after' }], lose: [{ kind: 'addEvent', eventId: 'cheer-rival-match-after' }] }),
        quest({ set: { key: 'rq-r11-cheer', value: 2 } }), feel({ rivalry: 1 }), feel2({ friendship: 1, admiration: 1 }), flag('cheered-second'), take())),
      ch('Cheer for both.', fight('You cheer every good move, whoever makes it. Both of them look at you like you are mad. Both of them play better.',
        rival({ lv: 1, quest: { watch: true }, win: [{ kind: 'addEvent', eventId: 'cheer-rival-match-after' }], lose: [{ kind: 'addEvent', eventId: 'cheer-rival-match-after' }] }),
        quest({ set: { key: 'rq-r11-cheer', value: 0 } }), feel({ respect: 1 }), feel2({ respect: 1 }), take())),
    ],
  },
  {
    id: 'cheer-rival-match-after', name: 'A Rival Match to Cheer: After', ...STANDING, room: true, rarity: 'uncommon', stop: 'event', minStage: 1, types: [],
    scene: { cast: [], tint: '#20202a', effect: 'none' },
    intro: script(page('{rival} stands over the result, breathing hard.', RS('won', { 'champion-chaser': 'That\'s how it\'s done. Were you watching? You were watching.' }), '{rival2} is already laughing about something their Pokémon did.')),
    remembers: [
      { id: 'second', when: [{ kind: 'flag', key: 'feud-watch-winner', atLeast: 2, atMost: 2 }], intro: script(page('{rival2} stands over the result, breathing hard, and looks over to see if you saw.', '{rival} is very busy with a Poké Ball that does not need polishing.', R('...Good match. Shut up. Good match.'))) },
    ],
    choices: [
      ch('Climb down off the fence.', out('Nothing is settled between them. Something has moved, though. You both felt it.', feel({ respect: 1 }), feel2({ respect: 1 }))),
    ],
  },
];

// Merged into live rival questline beats (status file `merged`): Rival Shopping Trip is R14 Emptied Shelves (rival-buyout);
// A Bitter Rival is R16 I Have to Get Stronger, meeting 1 (rq-kieran-1). The old events retire.
export const REMOVE: string[] = ['face-rival-shopping', 'kieran-rivalry'];
