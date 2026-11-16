// Greenneedle, gn.new.35 The Storyteller's Road (doc GREENNEEDLE_PLACED_2.md §35). Region-long: one rest per stage (S1–S7), the ending at S8 step 19.
// Build: npm run co:build -- greenneedle-new-35   then   npm run co:gn
// The deeds she predicts cannot be seen from outside (a fork, a blue catch...), so at the next rest she asks and the player answers:
// "just so" = story-matched +1, "the opposite" = story-defied +1 (both remembered; she looks pleased either way).
import { ch, flag, join, out, room, type Json } from '../dsl.ts';
import { bond, chIf, exactly, gev, gn, is, laterStage, moment, not, regionChanged, rm, say, setTo, stampRegion, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#6b5a3a';
const road = (o: Json = {}): Json => ({ tags: ['Story', 'Relationship'], tint: TINT, effect: 'none', ...o });

/** What she says the trainer will do at each stage (S1–S7), and the small thing she gets wrong about it. */
const PRED = ['take the left fork', 'catch something blue', 'lose once, and laugh', 'give something away', 'meet an old friend', 'turn back for someone', 'tell a lie, kindly'];
const WRONG = [
  'She says the trainer wore a red scarf. You are not wearing a scarf.',
  'She says the blue thing was a Pokémon from the water. She says the water twice, as though it matters.',
  'She says the trainer laughed at the end, out loud. She has the loser right and the laugh slightly too loud.',
  'She says the gift was wrapped in a leaf. It would have been, in her day.',
  'She says the old friend had a limp. She seems very sure. She may be thinking of someone else.',
  'She says the trainer turned back in the rain. It isn\'t raining. Perhaps it will.',
  'She says the lie was about the weather. It is such a small, gentle lie that the children nod.',
];

const REQ_NEXT = (n: number): Json[] => [exactly('sr-n', n - 1), laterStage('sr-stage'), not('sr-told')];

/** The three answers to "did they?" at the next rest. */
const report = (n: number, next: string): Json[] => {
  const after = (): string => next;
  return [
    ch('It happened, just so.', out(say('"Just so," she says, and writes nothing down, because there is nothing to write on. She looks very pleased.', 'The children look at you as if you were a page they had just turned.', after()), flag('story-matched'), setTo('sr-last', 1), setTo('sr-n', n), stampStage('sr-stage'))),
    ch('I did the opposite.', out(say('"The *opposite!*" She claps once, delighted. "Then I have to change it. Good. That\'s better. Stories that can\'t be changed are only walls."', 'The children whisper about it.', after()), flag('story-defied'), setTo('sr-last', 2), setTo('sr-n', n), stampStage('sr-stage'))),
    ch('Say nothing.', out(say('You say nothing. She studies you for a moment, then nods as if that were an answer, and a good one.', '"Quiet roads make quiet stories," she says. "Those are the long ones."', after()), setTo('sr-last', 0), setTo('sr-n', n), stampStage('sr-stage'))),
  ];
};

const memory = (): Json[] => [
  { id: 'matched', when: [is('sr-last', 1, 1)], notice: '*She tells it a little more slowly this time, the way you tell a story to someone who is already living in it.*' },
  { id: 'defied', when: [is('sr-last', 2, 2)], notice: '*She is already adjusting her story. Under her breath: "Not the fork, then. The *other* thing."*' },
  { id: 'quiet', when: [is('sr-n', 2), exactly('sr-last', 0)], notice: '*She looks at you the way she looks at the weather before she speaks.*' },
];

const stageEvent = (n: number): Json => {
  // n = 2..7: she asks about stage n-1's story, then tells stage n's.
  const next = say(
    `She settles the children. "Now. This stage, the trainer will **${PRED[n - 1]}.**"`,
    WRONG[n - 1]!,
    '*The road goes on. Nobody has said anything yet that can be checked.*',
  );
  return gev(`gn-new-35-s${n}`, 'The Storyteller\'s Road', road({
    stop: 'rest', rarity: 'rare', callback: true, forced: true, requires: REQ_NEXT(n), remembers: memory(), cast: [], effect: 'sparkle',
  }), say(
    'An old woman at the rest, with a ring of children. A different ring; the same her.',
    `"Last time I told you the trainer would **${PRED[n - 2]}**," she says. "Well? Did they?"`,
  ), report(n, next));
};

export const EVENTS: Json[] = [
  // ---- S1: the opening (Step 10, a rest) ----
  gev('gn-new-35-s1', 'The Storyteller\'s Road', road({ stop: 'rest', rarity: 'rare', forced: true, minStage: 1, effect: 'sparkle' }), say(
    'An old woman at a rest is telling a story to the children. It\'s about a trainer. The trainer has your starter.',
    '**The Storyteller:** "...and at the fork, the trainer went left, because they\'d heard crying."',
    '*The fork is ahead, at Step 11. Nobody\'s crying yet.*',
  ), [
    ch('Sit and listen.', out(say('You sit at the edge of the ring. The children shuffle over to make room, without looking away from her.', 'She tells the rest of it quietly. The trainer, the road, the scarf. You are not wearing a scarf.', 'She sees you looking, and winks, and does not stop.', `At the end she says: "The trainer will **${PRED[0]}.**"`), setTo('sr-n', 1), stampStage('sr-stage'), flag('sr-begun'))),
    ch('Ask who the trainer is.', out(say('"Who is it?" you ask. "I\'m glad you asked," she says. "Nobody ever does. They all want to know how it ends."', '"It\'s a trainer. It\'s always a trainer. It might be anyone with a Pokémon and a road."', 'She smiles at the starter by your boot. She is kind about not looking at it.', `"For now," she says, "the trainer will **${PRED[0]}.**"`), setTo('sr-n', 1), stampStage('sr-stage'), flag('sr-begun'))),
  ]),
  ...[2, 3, 4, 5, 6, 7].map(stageEvent),

  // ---- S8, Step 19: the ending ----
  gev('gn-new-35-end', 'The Storyteller\'s Road: The Last Telling', road({
    stop: 'rest', rarity: 'rare', callback: true, forced: true, requires: REQ_NEXT(8), remembers: memory(), effect: 'sparkle',
  }), say(
    'The Storyteller is at the last rest of the region, with every child she has ever told a story to, it seems. They are of every age.',
    `"Last time I told you the trainer would **${PRED[6]}**," she says. "Well? Did they?"`,
  ), [
    ch('It happened, just so.', out('"Just so." She folds her hands. The children are quiet. "That\'s the last of mine," she says.', flag('story-matched'), setTo('sr-last', 1), room('gn-new-35-who'))),
    ch('I did the opposite.', out('"Ha!" She laughs, and it is a young laugh. "That\'s the last of mine, then. It always ends a little wrong."', flag('story-defied'), setTo('sr-last', 2), room('gn-new-35-who'))),
    ch('Say nothing.', out('You say nothing. She nods slowly. "That\'s the last of mine," she says, and the children turn, one by one, to look at you.', setTo('sr-last', 0), room('gn-new-35-who'))),
  ]),
  rm('gn-new-35-who', 'The Last Telling', road({ effect: 'sparkle' }), say(
    'The children are looking at you. The old woman is looking at you, too. Her eyes are very bright.',
    '"Well," she says. "That\'s all of mine. Is there anything you want?"',
  ), [
    ch('Who are you?', out(say('"I\'m your grandmother\'s grandmother," she says. "I\'m nobody. I\'m what\'s left when the road\'s walked."', '"Two of those are lies."', 'She doesn\'t say which two. The children don\'t seem to need her to.'), flag('sr-asked'), room('gn-new-35-who2'))),
    ch('Let me tell one.', out('"*Oh,*" says the Storyteller. "Oh, I would like that very much." She moves over on the stone and pats the place beside her.', room('gn-new-35-t1'))),
  ]),
  rm('gn-new-35-who2', 'The Last Telling', road({ effect: 'sparkle' }), say(
    'She is quiet, the way someone is quiet after they have said the true thing at last.',
    '"Anything else?" she says. "No? Then, if you like. The floor is yours."',
  ), [
    ch('Let me tell one.', out('"*Oh,*" says the Storyteller. "Oh, I would like that very much." She moves over on the stone and pats the place beside her.', room('gn-new-35-t1'))),
    ch('Walk on.', out('You wish her well. She lifts one hand without looking up. Behind you, someone small asks for the one about the fork.', flag('sr-told'), stampRegion('sr-region'), moment('The Storyteller said who she was, and two of it were lies. You never found out which.', 55))),
  ]),

  // ---- the player's story: who, where, what they wanted, what it cost, how it ended. Two picks of each three put the road in it (+1 to `tale`) ----
  rm('gn-new-35-t1', 'Tell It: Who', road({ effect: 'sparkle' }), say('"Start where I start," she says. "Who?"', '*The children shuffle closer. The littlest one has her thumb in her mouth and is not breathing.*'), [
    ch('A trainer, with a starter.', out('"A trainer," you begin. "There\'s always a trainer." The children nod. "And a Pokémon who didn\'t know any better." They nod harder.', flag('tale'), room('gn-new-35-t2'))),
    ch('A Pokémon that waited.', out('"A Pokémon. It sat by the side of a road and waited for someone who was already walking toward it." No one moves.', flag('tale'), room('gn-new-35-t2'))),
    ch('Somebody.', out('"Somebody," you say. The children frown at that. "Somebody went down a road." A pause. "It\'s a short story."', room('gn-new-35-t2'))),
  ]),
  rm('gn-new-35-t2', 'Tell It: Where', road({ effect: 'sparkle' }), say('"And where?" she asks, very softly. "Where were they, when it began?"'), [
    ch('At a fork.', out('"At a fork." A gasp from the back. Someone says "*her* fork." You go on anyway. "One way was loud. One way was quiet."', flag('tale'), room('gn-new-35-t3'))),
    ch('At a rest, like this one.', out('"At a rest, with a fire, and strangers, and a woman telling a story." The children look at her, then at you. She is hiding a smile.', flag('tale'), room('gn-new-35-t3'))),
    ch('Somewhere.', out('"Somewhere on a road." The children wait for more. There isn\'t any more, yet.', room('gn-new-35-t3'))),
  ]),
  rm('gn-new-35-t3', 'Tell It: What They Wanted', road({ effect: 'sparkle' }), say('"What did they want?" she asks. "Everyone wants something. What did they want?"'), [
    ch('To be home by dark.', out('"To be home by dark." The children murmur. Every one of them knows that feeling. "They never made it. They never minded."', flag('tale'), room('gn-new-35-t4'))),
    ch('To be forgiven.', out('"To be forgiven by someone who hadn\'t asked for it." The old woman breathes in sharply. The children don\'t know why. She does.', flag('tale'), room('gn-new-35-t4'))),
    ch('To win.', out('"To win." A boy at the front nods hard. It is the only honest answer a child has ever been given, and he takes it.', room('gn-new-35-t4'))),
  ]),
  rm('gn-new-35-t4', 'Tell It: What It Cost', road({ effect: 'sparkle' }), say('"And it cost something," she says. "Every story does. What did it cost?"'), [
    ch('A season of their life.', out('"A whole season. They spent it on a road. They don\'t regret it." You say it plainly. She nods as if you had said her own name.', flag('tale'), room('gn-new-35-t5'))),
    ch('A friend\'s trust.', out('"A friend\'s trust, for a while." The littlest child takes her thumb out of her mouth. "It came back. Slowly. They had to walk to it."', flag('tale'), room('gn-new-35-t5'))),
    ch('Nothing.', out('"Nothing. That\'s the trick." The children look at one another, and then at you, and then at the fire. They do not believe you.', room('gn-new-35-t5'))),
  ]),
  rm('gn-new-35-t5', 'Tell It: How It Ended', road({ effect: 'sparkle' }), say('"And how did it end?" she asks. "Slowly. You have to say it slowly."'), [
    ch('They kept walking.', out('"They kept walking." You let it stand. The fire pops. Nobody asks what happened after. That is how you know it worked.', flag('tale'), room('gn-new-35-vote'))),
    ch('They sat down and told it to someone.', out('"They sat down at a rest, and an old woman asked them to tell a story. So they did." The old woman puts her hand over her mouth.', flag('tale'), room('gn-new-35-vote'))),
    ch('They stopped.', out('"They stopped." You say no more. The children wait. Eventually a small voice says, "But *why*?" and you don\'t have a good answer.', room('gn-new-35-vote'))),
  ]),
  // The children vote: yours wins with three or more of the five picks that put the road in it.
  rm('gn-new-35-vote', 'The Children Vote', road({ effect: 'sparkle' }), say(
    'You stop. There is a long silence. Then the old woman stands, with a hand on your shoulder, and says, "Hands. Whose was better? Mine, or theirs?"',
    '*The children go quiet to think. It is the most serious vote in the region.*',
  ), [
    chIf([is('tale', 3)], 'Wait for the count.', out(say('They vote for yours. Not by a hair: by a wall of small hands, and the littlest one on her feet.', '"Well," says the Storyteller. "Well." She sits down very slowly. She is smiling the way people do when they are given back something they lost.', 'At the very back of the ring, something large and slow and patient stands up, shakes off its blanket of hay, and waddles toward you.', 'A Slowking. It has been sitting there the whole time. It has heard everything.'), { ...join({ species: ['slowking'] }), direct: true }, gn('markLast', { key: 'twice-told', species: ['slowking'] }), flag('sr-won'), flag('sr-told'), stampRegion('sr-region'), moment('The children voted for the story you told over the Storyteller\'s own. A Slowking that had been listening at the back got up and followed you.', 70))),
    chIf([not('tale')], 'Wait for the count.', out(say('They vote for hers.', 'By a few hands. A child says, "It had a better fork." The others nod. It is, in fairness, a very good fork.', 'The old woman takes your hand in both of hers. "Mine was the better story," she says. "Yours was the truer. They\'re not the same, and you can tell them both."'), flag('sr-told'), stampRegion('sr-region'), bond(1))),
    chIf([is('tale', 1, 2)], 'Wait for the count.', out(say('They vote for hers.', 'By one hand. A child says, "It had a better fork." Another says, "Theirs had the *quiet*." They argue. It is, in fairness, a good fork.', 'The old woman takes your hand in both of hers. "Mine was the better story," she says. "Yours was the truer. They\'re not the same, and you can tell them both."'), flag('sr-told'), stampRegion('sr-region'), bond(1))),
  ]),

  // ---- the afterstory: next region, a different old woman tells the player's story, wrongly ----
  gev('gn-new-35-after', 'A Different Old Woman', road({
    stop: 'rest', rarity: 'rare', callback: true, requires: [is('sr-told'), regionChanged('sr-region'), not('sr-after')], effect: 'sparkle',
    remembers: [
      { id: 'won', when: [is('sr-won')], notice: '*The children are asking for "the one where the Slowking stood up." Someone has put the Slowking in a different story. She hasn\'t noticed.*' },
      { id: 'lost', when: [is('sr-asked'), not('sr-won')], notice: '*She tells the one about the grandmother\'s grandmother. She has the lies the wrong way round.*' },
    ],
  }), say(
    'A different old woman, at a different rest, is telling a story to different children. It\'s about a trainer. It is about **you.**',
    '*It is the story you told at the last rest. She has it nearly right. She has the ending wrong. It makes a better ending, to be fair.*',
  ), [
    ch('Correct her.', out(say('"It was the other way round," you say, as gently as you can. She stops. She looks at you. She laughs.', '"Is it? Then tell it right, and I\'ll tell it *your* way. That\'s how it gets so far."', 'By the end of the night the children can tell it both ways.'), flag('sr-after'), bond(1))),
    ch('Let her tell it.', out(say('You let her. She gets the ending wrong, and the children love it, and it is *better.*', 'Somewhere down the road, a boy is already telling it the wrong way, to someone else.'), flag('sr-after'), moment('A different old woman, in a different region, was telling the story you told. She had the ending wrong. It was better.', 60))),
  ]),
];

export const REMOVE: string[] = [];
export const CHAINS: Json[] = [];

const P = (n: number, stage: number, home: number, w: [number, number], note: string): Placement => ({
  gn: 'gn.new.35', shape: 'Region', earliest: 'A9', home, window: w, sits: 'must-see', attaches: 'rest', tags: ['Story'], stages: [stage],
  level: 'No battles', often: 'run', badge: 'own', chain: 'gn-new-35', beat: n, note,
});
export const PLACEMENT: Record<string, Placement> = {
  'gn-new-35-s1': P(1, 1, 10, [8, 12], 'S1, Step 10 (must-see; at a + node if one is near), fallback Step 19. Once a run, from A9. One rest per stage, S1–S7; the ending is S8, Step 19.'),
  ...Object.fromEntries([2, 3, 4, 5, 6, 7].map((n) => [`gn-new-35-s${n}`, P(n, n, 10, [8, 12], `S${n}, Step 10 (must-see), fallback Step 19.`)])),
  'gn-new-35-end': { ...P(8, 8, 19, [17, 19], 'S8, Step 19.'), note: 'The ending, S8 Step 19.' },
  'gn-new-35-after': { gn: 'gn.new.35', shape: 'Single', earliest: 'A9', home: 10, window: [4, 16], sits: 'optional', attaches: 'rest', tags: ['Story'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: next region, a rest.' },
};
