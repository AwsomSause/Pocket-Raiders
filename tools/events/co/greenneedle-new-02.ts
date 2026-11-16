// Greenneedle new events: gn.new.02 The Dog at the Station (doc GREENNEEDLE_PLACED_1.md lines 75-124).
// Build: npm run co:build -- greenneedle-new-02   then   npm run co:gn
// A chain: the platform (S(n), step 5, must-see, needs a city), three optional errands (the porter at S(n), the landlady at S(n+1),
// the clinic at S(n+2)) and the last visit (S(n+2), step 19, must-see). Sitting only ever counts the flag `dog-station-sat`
// (read by gn.37's tea). The ending's Growlithe has the new ability Vigil (engine.ts: after three full turns on the field the
// next hit does 50% less, once a battle). The clerk is met again in the next region (step 5 town).
import { ch, flag, item, join, out, type Json } from '../dsl.ts';
import { bond, chIf, gev, is, moment, not, regionChanged, say, sameStage, setTo, stampStage, laterStage, type Placement } from './_gn.ts';

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
    ), flag('dog-fed'), flag('dog-seen'), stampStage('dog-at'))),
    ch('Try to lead it away.', out(say(
      'You tug the lead gently, and it comes. One whole node, patient, close at your heel.',
      'Then it stops. It looks back along the road once. And it runs, flat out, all the way home to the platform.',
      'You find it there when you catch up, sitting down, as if it had never left.',
    ), flag('dog-led'), flag('dog-seen'), stampStage('dog-at'))),
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

  gev('gn-new-02-landlady', 'The Dog at the Station: The Landlady', dog({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('dog-asking'), not('dog-landlady'), laterStage('dog-at')] }), say(
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

  gev('gn-new-02-clinic', 'The Dog at the Station: The Clinic', dog({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('dog-asking'), not('dog-clinic'), laterStage('dog-at')] }), say(
    '*A low white building at the end of a long garden. A nurse in the doorway, tired, kind, not surprised to see you.*',
    '**Clinic nurse:** "He\'s in ward two. He\'s been ill a long time."',
    '"He won\'t send for it. He says it deserves better than a sick man."',
  ), [
    ch('Ask for his name.', out(say(
      '**Nurse:** "Emlyn. He talks about the dog most days. He asks what time the trains come in."',
      'She looks at the garden, not at you. "I tell him I don\'t know. I do know. I know every one of them."',
      'You have your answer, and a way to make it end. It does not feel like a victory.',
    ), flag('dog-clinic'), stampStage('dog-e3-at'))),
  ]),

  gev('gn-new-02-last', 'The Dog at the Station: The Last Visit', dog({ stop: 'event', rarity: 'rare', forced: true, callback: true, minStage: 2, requires: [is('dog-open'), not('dog-done'), laterStage('dog-e3-at')] }), say(
    '*Ward two. White sheets, an open window, and the sound of a train in the distance that is not the right train.*',
    '**The trainer, Emlyn, in a clinic bed:** "It still goes? Every day? ...Oh, you stupid, good dog."',
    'He says it to the ceiling. His hand is open on the blanket, as if something should already be in it.',
  ), [
    chIf([is('dog-clinic')], 'Carry the letter.', out(say(
      'He writes it slowly, four lines, crossing two out. You carry it back to the platform.',
      'The clerk reads it aloud, in the voice he uses for announcements. The Growlithe listens to the name.',
      'It stands. It does not wait for the train. It walks to the clinic by itself, and does not look back.',
      '**Mr. Halloran:** "Four years," he says, to nobody. "And it just needed someone to say where."',
      'At the gate, the nurse presses a Fire Stone into your hand. It was on his windowsill. "He said it was for whoever came."',
      '*In your Notebook, in your own hand: Some waiting ends when someone says where.*',
    ), flag('dog-reunited'), flag('dog-done'), item('fire-stone'), moment('Carried a letter to a Growlithe that had waited four years at a station.', 85))),
    chIf([is('dog-clinic')], 'Carry the Growlithe.', out(say(
      'You lift it. It is heavier than you thought, and it is shaking, very slightly, all the way down the long garden.',
      'Into ward two. It does not bark. It puts its chin on the blanket and lets out one long breath.',
      'Emlyn\'s hand finds its ears. Neither of them says a word. You wait in the corridor for a long time.',
      'On your way out, the nurse gives you a Fire Stone from his bedside table. "He said you\'d need it."',
      '*In your Notebook, in your own hand: Some waiting ends when someone says where.*',
    ), flag('dog-reunited'), flag('dog-done'), item('fire-stone'), moment('Carried a Growlithe into ward two, to the one it had waited for.', 90))),
    chIf([is(SAT), not('dog-clinic')], 'Sit one more time.', out(say(
      'You sit on the platform. The train comes in. Everyone gets off. You do not hurry.',
      'The Growlithe gets up. It walks to you, and looks back at the tracks once, a long look.',
      'Then it turns and settles against your leg, and this time it is you it is waiting with.',
    ), { ...join({ species: ['growlithe'] }), ability: 'vigil', mark: 'dog-vigil' }, flag('dog-chose-player'), flag('dog-done'), bond(1), moment('Sat one more time. A Growlithe stopped waiting for the train, and chose you.', 90))),
  ]),

  gev('gn-new-02-holiday', 'The Clerk, on Holiday', dog({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('dog-done'), regionChanged('dog-at'), not('dog-holiday')] }), say(
    '*A town square, a long way from the last station. A man in a straw hat, on a bench, with an ice cream.*',
    'It takes you a moment. It is Mr. Halloran, the clerk. He is out of uniform, and he looks ten years younger.',
    '**Halloran:** "Holiday. First in six years. I didn\'t know what to do with my hands."',
  ), [
    ch('Sit with him.', out(say(
      'You sit. He tells you the station is quiet now. The platform is still swept every morning.',
      'The bowl is still out. "Habit," he says. "And you never know who might come in."',
    ), flag('dog-holiday'))),
  ]),
];

export const REMOVE: string[] = [];

const BEATS = [
  { beat: 'The platform (must-see)', event: 'gn-new-02-platform', stage: 'S(n)', home: 5, window: [3, 8] as [number, number] },
  { beat: 'Errand 1: the porter\'s story (optional)', event: 'gn-new-02-porter', stage: 'S(n)', home: 8, window: [6, 11] as [number, number] },
  { beat: 'Errand 2: the landlady\'s story (optional)', event: 'gn-new-02-landlady', stage: 'S(n+1)', home: 7, window: [5, 10] as [number, number] },
  { beat: 'Errand 3: the clinic (optional)', event: 'gn-new-02-clinic', stage: 'S(n+2)', home: 12, window: [10, 15] as [number, number] },
  { beat: 'The last visit (must-see)', event: 'gn-new-02-last', stage: 'S(n+2)', home: 19, window: [17, 19] as [number, number] },
];
const DOG: Placement = { gn: 'gn.new.02', shape: 'Chain', earliest: 'A2', tags: ['Miniature Episode', 'Companion Story'], level: 'No battles', often: 'run', badge: 'own', needs: ['city'], beats: BEATS };

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-02-platform': { ...DOG, sits: 'must-see', attaches: 'before', home: 5, window: [3, 8], note: 'Badge: a small bowl. Needs a city stage; falls back to step 15. Once a run (the doc says once per save; no memory across runs).' },
  'gn-new-02-porter': { ...DOG, sits: 'optional', attaches: 'after', home: 8, window: [6, 11] },
  'gn-new-02-landlady': { ...DOG, sits: 'optional', attaches: 'after', home: 7, window: [5, 10] },
  'gn-new-02-clinic': { ...DOG, sits: 'optional', attaches: 'after', home: 12, window: [10, 15] },
  'gn-new-02-last': { ...DOG, sits: 'must-see', attaches: 'before', home: 19, window: [17, 19] },
  'gn-new-02-holiday': {
    gn: 'gn.new.02', shape: 'Single', earliest: 'A3', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', tags: ['Reunion Episode'], level: 'None', often: 'run', badge: 'own',
    note: 'Afterstory: the clerk on holiday, met at a step 5 town in the next region.',
  },
};

export const CHAINS: Json[] = [];
