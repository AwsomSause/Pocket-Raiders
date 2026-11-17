// Greenneedle new events: gn.new.02 The Dog at the Station (doc GREENNEEDLE_PLACED_1.md lines 75-124).
// Build: npm run co:build -- greenneedle-new-02   then   npm run co:gn
// A chain: the platform (S(n), step 5, must-see, needs a city), three optional errands (the porter at S(n), the landlady at S(n+1),
// the clinic at S(n+2)) and the last visit (S(n+2), step 19, must-see). Only the platform needs a city. Asking around ends in ward two
// (the letter or the Growlithe); only ever sitting ends on the platform ("Sit one more time."); feeding it or leading it away has no
// ending (the doc gives them none). Sitting only ever counts the flag `dog-station-sat`
// (read by gn.37's tea). The ending's Growlithe has the new ability Vigil (engine.ts: after three full turns on the field the
// next hit does 50% less, once a battle). The clerk is met again in the next region (step 5 town).
import { ch, flag, item, join, out, type Json } from '../dsl.ts';
import { bond, gev, is, moment, not, regionChanged, say, sameStage, setTo, stageGap, stageGapMin, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#6b6558';
const dog = (o: Json = {}): Json => ({ tint: TINT, tags: ['Story', 'Pokémon', 'Relationship'], effect: 'none', pokemon: 'growlithe', ...o });
const SAT = 'dog-station-sat';

export const EVENTS: Json[] = [
  gev('gn-new-02-platform', 'The Dog at the Station', dog({ stop: 'event', rarity: 'rare', forced: true, requires: [not('dog-seen')] }), say(
    '*A small station, and a Growlithe on the platform, sitting very straight, facing the tracks.*',
    'A clerk sets down a bowl of water beside it without looking at it. The bowl is already worn smooth in the middle.',
    '**Clerk, Mr. Halloran:** "Four years. Meets every train. I stopped telling it."',
    '*A train pulls in. The Growlithe stands. Everyone gets off. It sits back down.*',
  ), [
    ch('Sit with it.', out(say(
      'You sit on the cold platform beside it. It does not look at you.',
      'Then, for the length of one train, it leans. Slightly. Its whole warm weight against your arm.',
      'When the platform empties, it sits up again, and you stay a moment longer than you need to.',
    ), flag(SAT), setTo('dog-open', 1), flag('dog-seen'), stampStage('dog-at'))),
    ch('Feed it.', out(say(
      'You open your pack. It eats, politely, with its eyes never leaving the track.',
      'It finishes. It does not thank you. It does not need to. It is busy, and it has been busy for years.',
    ), flag('dog-fed'), setTo('dog-open', 1), flag('dog-seen'), stampStage('dog-at'))),
    ch('Try to lead it away.', out(say(
      'You tug the lead gently, and it comes. One whole node, patient, close at your heel.',
      'Then it stops. It looks back along the road once. And it runs, flat out, all the way home to the platform.',
      'You find it there when you catch up, sitting down, as if it had never left.',
    ), flag('dog-led'), setTo('dog-open', 1), flag('dog-seen'), stampStage('dog-at'))),
    ch('Ask around town.', out(say(
      '**Halloran:** "Ask who you like. Everyone here has a piece of it. None of them have the whole thing."',
      'You go and find the porter, the landlady, and the clinic. Three people, each holding one corner of one story.',
    ), flag('dog-asking'), setTo('dog-open', 1), flag('dog-seen'), stampStage('dog-at'))),
  ]),

  gev('gn-new-02-porter', 'The Dog at the Station: The Porter', dog({ stop: 'event', rarity: 'uncommon', requires: [is('dog-asking'), not('dog-porter'), sameStage('dog-at')] }), say(
    '*A porter in a brown cap, leaning on a trolley, watching the Growlithe from the far end of the platform.*',
    'He has the look of a man who has told this story so often he has stopped hearing it.',
    '**Porter:** "Ran off with a circus. I\'d swear to it."',
    '"Left it a note, all grand. Said he\'d be back in the spring. That was four springs ago."',
  ), [
    ch('Listen.', out(say(
      'He tells it all: the red tents, the elephant, the way the trainer laughed at the gate.',
      'He tells it quickly. You think he has been telling it quickly for years, so he never has to stop at the end.',
    ), flag('dog-porter'))),
  ]),

  gev('gn-new-02-landlady', 'The Dog at the Station: The Landlady', dog({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('dog-asking'), not('dog-landlady'), stageGap('dog-at', 1)] }), say(
    '*A boarding house with a window box of dead geraniums. A woman in an apron, arms folded, on the step.*',
    '**Landlady:** "Died at sea. Don\'t tell the dog."',
    'She says it flatly, the way you say something to stop yourself from saying anything else.',
    '"Telegram came in the autumn. I put it in the stove. Somebody had to keep the dog waiting."',
  ), [
    ch('Listen.', out(say(
      'Her hands are knotted in the apron. She tells you his room is still made up, with the window open an inch.',
      'It is not grief you hear. It is the effort of keeping a promise nobody asked her to make.',
    ), flag('dog-landlady'))),
  ]),

  gev('gn-new-02-clinic', 'The Dog at the Station: The Clinic', dog({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('dog-asking'), not('dog-clinic'), not('dog-done'), stageGap('dog-at', 2)] }), say(
    '*A low white building at the end of a long garden. A nurse in the doorway, tired, kind, not surprised to see you.*',
    '**Clinic nurse:** "He\'s in ward two. He\'s been ill a long time."',
    '"He won\'t send for it. He says it deserves better than a sick man."',
  ), [
    ch('Ask for his name.', out(say(
      '**Nurse:** "Emlyn. He talks about the dog most days. He asks what time the trains come in."',
      'She looks at the garden, not at you. "I tell him I don\'t know. I do know. I know every one of them."',
      'You have your answer, and a way to make it end. It does not feel like a victory.',
    ), flag('dog-clinic'))),
  ]),

  // Asked around: ward two, at S(n+2) step 19, whether or not the clinic errand was walked to (the nurse sends word if it was not).
  gev('gn-new-02-last', 'The Dog at the Station: The Last Visit', dog({ stop: 'event', rarity: 'rare', forced: true, callback: true, minStage: 2, requires: [is('dog-asking'), not('dog-done'), stageGapMin('dog-at', 2)], remembers: [
    { id: 'no-clinic', when: [not('dog-clinic')], notice: 'You never reached the clinic at the end of the long garden. A nurse finds you on the road instead. **Clinic nurse:** "He\'s in ward two. He\'s been ill a long time. He won\'t send for it. He says it deserves better than a sick man."' },
  ] }), say(
    '*Ward two. White sheets, an open window, and the sound of a train in the distance that is not the right train.*',
    '**The trainer, Emlyn, in a clinic bed:** "It still goes? Every day? ...Oh, you stupid, good dog."',
    'He says it to the ceiling. His hand is open on the blanket, as if something should already be in it.',
  ), [
    ch('Carry the letter.', out(say(
      'He writes it slowly, four lines, crossing two out. You carry it back to the platform.',
      'The clerk reads it aloud, in the voice he uses for announcements. The Growlithe listens to the name.',
      'It stands. It does not wait for the train. It walks to the clinic by itself, and does not look back.',
      '**Mr. Halloran:** "Four years," he says, to nobody. "And it just needed someone to say where."',
      'At the gate, the nurse presses a Fire Stone into your hand. It was on his windowsill. "He said it was for whoever came."',
      '*In your Notebook, in your own hand: Some waiting ends when someone says where.*',
    ), flag('dog-reunited'), flag('dog-done'), item('fire-stone'), moment('Carried a letter to a Growlithe that had waited four years at a station.', 85))),
    ch('Carry the Growlithe.', out(say(
      'You lift it. It is heavier than you thought, and it is shaking, very slightly, all the way down the long garden.',
      'Into ward two. It does not bark. It puts its chin on the blanket and lets out one long breath.',
      'Emlyn\'s hand finds its ears. Neither of them says a word. You wait in the corridor for a long time.',
      'On your way out, the nurse gives you a Fire Stone from his bedside table. "He said you\'d need it."',
      '*In your Notebook, in your own hand: Some waiting ends when someone says where.*',
    ), flag('dog-reunited'), flag('dog-done'), item('fire-stone'), moment('Carried a Growlithe into ward two, to the one it had waited for.', 90))),
  ]),

  // Only ever sat: no clinic, no Emlyn. The last visit is the platform itself, at S(n+2) step 19.
  gev('gn-new-02-last-sit', 'The Dog at the Station: The Last Visit', dog({ stop: 'event', rarity: 'rare', forced: true, callback: true, minStage: 2, requires: [is(SAT), not('dog-asking'), not('dog-fed'), not('dog-led'), not('dog-done'), stageGapMin('dog-at', 2)] }), say(
    '*The line has followed your road. The same small station, the same worn bowl, and the Growlithe on the platform, sitting very straight, facing the tracks.*',
    '**Mr. Halloran:** "Still meets every one. I still don\'t tell it."',
    '*A train is due.*',
  ), [
    ch('Sit one more time.', out(say(
      'You sit on the platform. The train comes in. Everyone gets off. You do not hurry.',
      'The Growlithe gets up. It walks to you, and looks back at the tracks once, a long look.',
      'Then it turns and settles against your leg, and this time it is you it is waiting with.',
    ), { ...join({ species: ['growlithe'] }), ability: 'vigil', mark: 'dog-vigil' }, flag('dog-chose-player'), flag('dog-done'), bond(1), moment('Sat one more time. A Growlithe stopped waiting for the train, and chose you.', 90))),
  ]),

  gev('gn-new-02-holiday', 'The Clerk, on Holiday', dog({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('dog-reunited'), regionChanged('dog-at'), not('dog-holiday')] }), say(
    '*A town square, a long way from the last station. A man in a straw hat, on a bench, with an ice cream.*',
    'It takes you a moment. It is Mr. Halloran, the clerk. He is out of uniform, and he looks ten years younger.',
    '**Halloran:** "Holiday. First in six years. I didn\'t know what to do with my hands."',
    'He has been telling the story to strangers all week, and telling it badly. In today\'s version there were five years, and two dogs.',
  ), [
    ch('Sit with him.', out(say(
      'You sit. He tells you the station is quiet now. The platform is still swept every morning.',
      'The bowl is still out. "Habit," he says. "And you never know who might come in."',
    ), flag('dog-holiday'))),
  ]),
];

export const REMOVE: string[] = [];

const BEATS = [
  { beat: 'The platform (must-see)', event: 'gn-new-02-platform', stage: 'S(n)', home: 5, window: [5, 15] as [number, number] },
  { beat: 'Errand 1: the porter\'s story (optional)', event: 'gn-new-02-porter', stage: 'S(n)', home: 8, window: [8, 12] as [number, number] },
  { beat: 'Errand 2: the landlady\'s story (optional)', event: 'gn-new-02-landlady', stage: 'S(n+1)', home: 7, window: [7, 15] as [number, number] },
  { beat: 'Errand 3: the clinic (optional)', event: 'gn-new-02-clinic', stage: 'S(n+2)', home: 12, window: [12, 15] as [number, number] },
  { beat: 'The last visit (must-see)', event: 'gn-new-02-last', stage: 'S(n+2)', home: 19, window: [17, 19] as [number, number] },
];
// Only the platform needs a city. The porter is earned inside the platform's own stage, so it is placed the moment it is earned
// (a World Event beat); the later beats are owed beats of a Companion story: placed at the start of their stage, never dropped.
const DOG = { gn: 'gn.new.02', earliest: 'A2', tags: ['Miniature Episode', 'Companion Story'], level: 'No battles', often: 'run' as const, badge: 'own', chain: 'gn.new.02', beats: BEATS };

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-02-platform': { ...DOG, shape: 'Chain', beat: 1, needs: ['city'], sits: 'must-see', attaches: 'before', home: 5, window: [5, 15], note: 'Badge: a small bowl. Needs a city stage; falls back to step 15. Once a run (the doc says once per save; no memory across runs).' },
  'gn-new-02-porter': { ...DOG, shape: 'World Event', beat: 2, sits: 'optional', attaches: 'after', home: 8, window: [8, 12] },
  'gn-new-02-landlady': { ...DOG, shape: 'Companion', beat: 3, sits: 'optional', attaches: 'after', home: 7, window: [7, 15] },
  'gn-new-02-clinic': { ...DOG, shape: 'Companion', beat: 4, sits: 'optional', attaches: 'after', home: 12, window: [12, 15] },
  'gn-new-02-last': { ...DOG, shape: 'Companion', beat: 5, sits: 'must-see', attaches: 'before', home: 19, window: [17, 19] },
  'gn-new-02-last-sit': { ...DOG, shape: 'Companion', beat: 5, sits: 'must-see', attaches: 'before', home: 19, window: [17, 19], note: 'Only ever sat: the last visit is on the platform ("Sit one more time.").' },
  'gn-new-02-holiday': {
    gn: 'gn.new.02', shape: 'Single', earliest: 'A3', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', tags: ['Reunion Episode'], level: 'None', often: 'run', badge: 'own',
    note: 'Afterstory (if reunited): the clerk on holiday, met at a step 5 town in the next region.',
  },
};

export const CHAINS: Json[] = [];
