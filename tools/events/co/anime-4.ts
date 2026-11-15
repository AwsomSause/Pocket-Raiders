// Anime questlines, module 4: AN28-AN36. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AN28 The Traveller on Three-Day Visas (Run-Long; script: QUESTLINES_DEEPENED_1.md "AN28")
//   AN29 The Spirit at the Bus Stop       (Single;   script: QUESTLINES_ANIME_INSPIRED.md "AN29")
// Build: npm run co:build -- anime-4
import { ch, egg, ev, express, flag, flagAgo, flagAt, flagIs, fr, heal, isPeace, isRage, item, leave, out, room, type Json } from '../dsl.ts';
import { AN, age, later, moment, notYet, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AN28: 'an28-three-day-visas',
  AN29: 'an29-spirit-bus-stop',
};

const AN28_RIDES = [1, 2, 3, 4, 5, 6];

export const PLACEMENT: Record<string, Place> = {
  'an28-three-day-visas': {
    shape: 'Run-Long', earliest: 'A4', home: "Each region's Stage 4; Steps 9, 10, 11", sits: 'optional', attaches: 'instead',
    beats: ['an28-votes-day-two', 'an28-votes-day-three', 'an28-the-vote', 'an28-quiet-day-one', 'an28-quiet-day-two', 'an28-quiet-day-three', 'an28-forget-day-one', 'an28-forget-day-two', 'an28-forget-day-three', 'an28-the-gate', ...AN28_RIDES.map((k) => `an28-ride-${k}`)],
    note: 'One town per region over three regions; in each, Day one, Day two, Day three are Steps 9, 10, 11 of the region\'s Stage 4, instead of the node battle. Tags: any. The ride callbacks (an28-ride-N) come once in each later region.',
  },
  'an29-spirit-bus-stop': { shape: 'Single', earliest: 'A2', home: 'a + node', sits: 'optional', attaches: 'rest', tags: ['forest'], beats: ['an29-letter'], note: 'In Rain, at dusk. The father\'s letter (afterstory) comes a stage later.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AN28: [
    'Each later town is a callback that opens on the first stage of the next region (flagAgo), not exactly at that region\'s Stage 4 Steps 9 to 11; the placement block says Stage 4 for the placer.',
    'Town 1\'s "if the player\'s Reputation here is 3 or more, people change theirs" reads the run flag rep at 3 or more (families-c owns Reputation); the game has no Reputation per town.',
    '"All three answers match what the player has done" is judged per town: "It isn\'t fair if somebody gets hurt" matches a run with flag kind-helped-stranger (set by Kindness Ledger events, another thread) and "It\'s fair. It isn\'t good." a run without it; "Some are." matches a Peace-side meter (battles declined) and "Ask it." a Rage-side or level one; "No. It\'s mine." matches (a loss carried) and "Yes." does not.',
    'Town 3\'s line under "No. It\'s mine." for a run with a lost Pokémon reads the Nuzlocke memorial (a Pokémon lost for good this run) instead of lost.<name> flags; the line is in the outcome text and cannot name the Pokémon.',
    'The Cyclizar ride (two node skips per region) is the Cyclizar Ride item (2 rides, two columns ahead over one), given at the last gate and again by a callback in each of up to six later regions; rides not used carry over.',
    'Afterstory "a postcard from a fourth town in later runs" is not built (nothing crosses runs).',
  ],
  AN29: [
    'Remembers "shared an umbrella before (One Umbrella, Two Trainers)" reads flag umbrella-shared, which the thread that builds that Kindness Ledger scene (umbrella-share, SF43.13) must set.',
    'The seed that grows into a Bramblin is an Egg that hatches into a Bramblin after two stages.',
  ],
};

const memorial: Json = { kind: 'memorial', atLeast: 1 };

// ---------- AN28 helpers ----------
const an28Come = (lead: string): Json => out(`${lead} Through the gate is a square with a great slate board and bunting strung between the lamp posts. A crowd is voting on lunch. Then on the weather forecast. Then, after a cheerful argument, on whether the weather forecast should be voted on at all. Soup wins. Sunshine wins. Everybody claps the results, even the people who lost. "Lovely, isn't it?" Nico says, writing. "Ask me again tomorrow."`, flag('an28-came'), later('an28-votes-day-two', 1));

const an28Fair = (match: boolean): Json => out('Nico nods slowly, as if you had set down something heavy, carefully. "Fair is a rule. Good is a person. Most towns only ever build the first one." They write your answer under the town\'s name, word for word. "There\'s one more vote on the board before noon. Anyone in town can cast it. Even us."',
  flag('kino-answers'), flag('an28-answer-fair-not-good'), ...(match ? [flag('an28-true')] : []), room('an28-the-vote'));
const an28Hurt = (match: boolean): Json => out('"The Mareep would agree with you," Nico says. "It doesn\'t get a vote, though. That\'s rather the point." They write your answer under the town\'s name, word for word, and underline "somebody". "There\'s one more vote on the board before noon. Anyone in town can cast it. Even us."',
  flag('kino-answers'), flag('an28-answer-hurt'), ...(match ? [flag('an28-true')] : []), room('an28-the-vote'));

const an28SomeAre = (match: boolean): Json => out('"Some are," Nico agrees, watching a Snorlax asleep in a flowerbed with a small child asleep on top of it. "And some are hitting sacks in alleys at midnight." They write your answer down word for word. "This town was built for the first kind. It never thought to ask the second." The fourth morning comes. "Next region," Nico says. "A town that forgets. I\'ll find you."',
  flag('kino-answers'), flag('an28-answer-some-are'), ...(match ? [flag('an28-true')] : []), flagAt('an28-town-2'));
const an28AskIt = (match: boolean): Json => out('You go back to the alley, and you ask. The Machop looks at you for a long time. It looks out at the calm town, the gardens, the laps. It looks at your team, scuffed and ready behind you. Then it goes back to its sack, hits it once, and sits down beside it, content. Not a fighter for anyone. Just itself, with its sack. Nico writes two words and nothing else. "Next region. A town that forgets. I\'ll find you."',
  flag('kino-answers'), flag('an28-answer-ask-it'), ...(match ? [flag('an28-true')] : []), flagAt('an28-town-2'));

const an28Gone = 'The fourth morning, Nico is at the gate before you. "Next region there\'s a town with no battles. I\'ll find you." The Cyclizar is already pointing at the road.';

const RIDE_SCENES = [
  'A new region, and the first road out of town has a Cyclizar lying across it in the sun: sleeker than Nico\'s, faintly embarrassed to be seen. Nico\'s Cyclizar\'s sister. She looks at you, then at the road, then at you again. Twice, her look says. Then I am going to lie down.',
  'Dust on the road ahead, and an engine-purr you know. The younger Cyclizar skids to a stop beside you and waits, tail flicking. There is a pencil tucked into the strap round her neck. Somebody has written on it, very small: "Hello from the road."',
  'You hear her before you see her: a low, contented rumble from a hedge. The young Cyclizar has been asleep in it, apparently for some time. She shakes off the leaves, stretches front and back, and presents her saddle to you with great dignity.',
  'Rain on a new region, and the Cyclizar waiting under a bridge, dry and smug. She has found the only dry spot for a mile and has been saving it for you. She will carry you twice through this region. She makes it clear she would rather not get wet doing it.',
  'At a crossroads, the young Cyclizar is sitting on the signpost\'s shadow as if it were a cushion. She has a new scratch on one flank and looks proud of it. She has been somewhere. She does not say where. Her saddle is warm.',
  'Late in the run, on a long road, the Cyclizar pulls in beside you like she never left. There is a second pencil in her strap now, and a page torn from a notebook: three lines, and a question with the answer left blank. She waits while you read it.',
];

export const EVENTS: Json[] = [
  // ---------------- AN28. The Traveller on Three-Day Visas ----------------
  ev('an28-three-day-visas', 'The Traveller on Three-Day Visas', AN, { rarity: 'rare', minStage: stageOf('A4'), types: [], cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#2a2418', effect: 'none' },
    'A town gate, mid-morning. A Cyclizar lies stretched across the road like a draught excluder, and on it sits a traveller in a long brown coat, goggles pushed up into dusty hair, three pencils behind one ear. "Nico," they say, by way of hello. "Three days in every place. Long enough to learn something. Short enough not to stay." They tap the gatepost with a pencil. "This town has a rule I want to see. Come?" The Cyclizar opens one eye, as if your answer matters to it too.',
    [
      ch('Come.', an28Come('Nico grins and swings down off the Cyclizar. "Day one, then."')),
      ch('Why three?', out('"On the fourth day you start having opinions about the neighbours. On the fifth, they have them about you." Nico says it lightly, but their eyes go back down the road they came by, the way you look at a door you once closed very gently. The Cyclizar yawns. The offer stands.', flag('an28-asked-why'), room('an28-three-day-visas-again'))),
      ch('Stay longer for once.', out('Nico is quiet for a moment. The pencil stops moving. "I did, once. It\'s why I don\'t." They do not say where, or who. The Cyclizar shifts its weight closer to their boots, the way a friend leans in without being asked. Then Nico smiles, and it very nearly reaches their eyes. "Still. Come and see this one?"', flag('an28-asked-stay'), room('an28-three-day-visas-again'))),
    ]),
  ev('an28-three-day-visas-again', 'The Traveller on Three-Day Visas', AN, { room: true, cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#2a2418', effect: 'none' },
    'Nico is still sitting on the Cyclizar at the gate, notebook open at a clean page. "Three days. I\'ll be gone on the fourth whether you come or not. It\'s the only rule I keep."',
    [
      ch('Come.', an28Come('"Good." Nico swings down. "Day one."')),
      ch('Not this time.', leave('"Then I\'ll write you down as a maybe," Nico says, and does. The Cyclizar watches you all the way to the bend in the road.')),
    ]),
  ev('an28-votes-day-two', 'Sixty to Forty', AN, { room: true, requires: [flagIs('an28-came')], cast: ['trainer.pr/doctor_f', 'trainer.pr/backpacker_m'], pokemon: 'mareep', tint: '#2a2418', effect: 'none' },
    'Day two. The Pokémon Center is very clean and very quiet. On the counter a Mareep lies in a nest of towels, its wool dull, its breath short and fast. Pinned above it is the result of this morning\'s vote on its treatment: sixty to forty, against the nurse. The sixty voted for rest and warm milk. They are very sure. The nurse stands holding the medicine she is not allowed to give, holding it like something that might break. "I\'m outvoted," she says, quietly. "I\'m also right."',
    [
      ch('Sit with the Mareep.', out('You sit with it through the afternoon. Its wool crackles faintly when you stroke it, one tiny dry spark, the only bright thing about it. The nurse brings you tea and does not drink her own. Nico writes nothing at all today. At night the board in the square still says sixty to forty, in neat chalk. "Tomorrow," Nico says, "I\'ll ask you what this town asked me."', flag('an28-sat-with-mareep'), fr(2, 'lead'), later('an28-votes-day-three', 1))),
      ch('Ask the sixty why.', out('You find three of the sixty at the soup stall. They are kind. They explain it slowly, the way you explain things to a child: the vote is the vote, and if one person can overrule it once, why have it at all? One of them has a Mareep of her own at home. She does not look at you while she says so. Nico listens to all of it and writes down a single line. "Tomorrow," they say. "The question."', flag('an28-asked-the-sixty'), later('an28-votes-day-three', 1))),
    ]),
  ev('an28-votes-day-three', 'The First Question', AN, { room: true, requires: [flagIs('an28-came')], cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#2a2418', effect: 'none',
    remembers: [
      { id: 'kind-match', when: [flagIs('kind-helped-stranger')], hide: [1], addChoices: [ch('It isn\'t fair if somebody gets hurt.', an28Hurt(true))] },
      { id: 'hard-match', when: [notYet('kind-helped-stranger')], hide: [0], addChoices: [ch('It\'s fair. It isn\'t good.', an28Fair(true))] },
    ] },
    'Day three. Morning on the town wall, the square below already filling for the lunch vote. Nico sits with their boots dangling over the drop and the Cyclizar\'s chin on their knee. The notebook is shut, for once. "Here\'s the one I write down. Every town has one." They look at the board, at the Center\'s closed door, at the bunting lifting in the wind. "Is it fair, if the majority\'s wrong?"',
    [
      ch('It\'s fair. It isn\'t good.', an28Fair(false)),
      ch('It isn\'t fair if somebody gets hurt.', an28Hurt(false)),
    ]),
  ev('an28-the-vote', 'The Last Vote Before Noon', AN, { room: true, cast: ['trainer.pr/doctor_f', 'trainer.pr/backpacker_m'], pokemon: 'mareep', tint: '#2a2418', effect: 'none',
    remembers: [
      { id: 'known-here', when: [flagIs('rep', 3)], notice: 'People in this square know your name. When you step up to the board, heads turn, and a few hands hover over the chalk.', hide: [0],
        addChoices: [ch('Cast a vote.', out(`You put your hand up. Someone at the back says, "That's the one who helped," and another hand goes up beside yours. Then four more. The clerk chalks it, rubs it out, chalks it again: forty-eight to fifty-two. The square goes quiet, then claps, even the people who lost. The nurse is already running. By evening the Mareep's wool is fizzing, and the board says, in neat chalk, that the town changed its mind. ${an28Gone}`, flag('an28-voted'), flag('an28-vote-turned'), flagAt('an28-town-1'), moment('A town that votes on everything changed its mind, because you voted too.', 55)))] },
    ] },
    'The board in the square has one line left before noon: the Mareep\'s treatment, again, because somebody asked for a recount. A clerk holds the chalk. Anyone in town may vote. "Sixty to forty" stands above it, neat and certain. The nurse is in the Center doorway with her arms folded over the medicine. She is not looking at the board. She is looking at you.',
    [
      ch('Cast a vote.', out(`You put your hand up. The clerk chalks it: sixty to forty-one. Nobody else moves, and the square goes on to the lunch vote. But the nurse saw. That evening, rules or no rules, she gives the Mareep its medicine, then stands in front of the board all night as if daring it to say something. By morning its wool is fizzing. "One vote," Nico says. "It didn't change the count. It changed who she knows is on her side." ${an28Gone}`, flag('an28-voted'), flagAt('an28-town-1'))),
      ch('Leave it to the town.', out(`You leave the chalk where it is. Sixty to forty stands. That evening the nurse gives the Mareep its medicine anyway, quietly, with the blinds down, and by morning its wool is fizzing again. Nobody votes on whether she was allowed. "Towns are like that," Nico says. "The rule stays lovely. The people go round it." ${an28Gone}`, flagAt('an28-town-1'))),
    ]),
  ev('an28-quiet-day-one', 'The Town With No Battles', AN, { callback: true, requires: [flagIs('an28-town-1'), flagAgo('an28-town-1', 1)], cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#22301e', effect: 'none' },
    'A new region, and a familiar Cyclizar lying across the road at a town gate. "You came!" Nico says, as if it had ever been in doubt. "Day one. This town has no battles. None at all. Come and see." Through the gate there is no arena, no Gym, not even a scuffed circle in the dust. Pokémon doze in gardens and in laps. A Lillipup chases nothing in particular, for the joy of it. It is the calmest place you have ever been, and your team feels it: shoulders drop, one by one.',
    [
      ch('Stay the three days.', out('You stay. Your Pokémon sleep in the sun all afternoon, and nobody asks them to do anything at all. That night, for the first time in a long time, nobody on your team wakes once.', flag('an28-came-2'), heal(0.5), fr(2), later('an28-quiet-day-two', 1))),
    ]),
  ev('an28-quiet-day-two', 'The Sack of Grain', AN, { room: true, requires: [flagIs('an28-came-2')], cast: ['trainer.pr/veteran_m'], pokemon: 'machop', tint: '#1a1f26', effect: 'none' },
    'Day two, late. You cannot sleep, so you walk. In an alley behind the bakery there is a sound like someone beating a rug: thump, thump, thump. A Machop, alone under one lamp, is hitting a sack of grain. Its fists are wrapped in old cloth. It is good at this. It is very, very good at this. It sees you and freezes, then backs into the dark, ashamed, as if caught stealing. Footsteps. An old man comes down the alley with a fresh sack over his shoulder and sets it down under the lamp. He knows. He has always known.',
    [
      ch('Hold the sack for it.', out('You brace the sack. After a long moment the Machop comes back into the light and hits it once, carefully, watching your face. Then again, harder. The old man sits on a crate. "He was a fighter\'s Pokémon, before the rule. I couldn\'t give him a fight. I can give him a sack." By midnight the sack has split down the side and the Machop is grinning.', flag('an28-held-the-sack'), fr(2, 'lead'), later('an28-quiet-day-three', 1))),
      ch('Walk on and say nothing.', out('You walk on and say nothing. Behind you the thumping starts again, steady as a heart. In the morning the old man nods to you over his gate, and you nod back, and that is the whole conversation. There are things a calm town agrees not to see.', flag('an28-kept-quiet'), later('an28-quiet-day-three', 1))),
    ]),
  ev('an28-quiet-day-three', 'The Second Question', AN, { room: true, requires: [flagIs('an28-came-2')], cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#22301e', effect: 'none',
    remembers: [
      { id: 'peace-match', when: [isPeace(1)], hide: [0], addChoices: [ch('Some are.', an28SomeAre(true))] },
      { id: 'rage-match', when: [isRage(0)], hide: [1], addChoices: [ch('Ask it.', an28AskIt(true))] },
    ] },
    'Day three. Nico sits on the rim of a fountain nobody has ever fought beside. In the square the town\'s Pokémon nap in warm heaps. From behind the bakery, very faintly, something goes thump. Nico has heard it too. They have probably heard it every night. "Is a Pokémon happier without battles?"',
    [
      ch('Some are.', an28SomeAre(false)),
      ch('Ask it.', an28AskIt(false)),
    ]),
  ev('an28-forget-day-one', 'The Town That Remembers Nothing', AN, { callback: true, requires: [flagIs('an28-town-2'), flagAgo('an28-town-2', 1)], cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#2a2030', effect: 'none' },
    'Another region, another gate, the same Cyclizar asleep across the road. "Last town," Nico says. "Day one. Mind the notes." Every door has one pinned to it. "You live here. You like eggs." "This is your sister. She is kind." Everyone you pass is delighted to meet you. They are delighted to meet each other, too: two neighbours shake hands over a fence like strangers at a wedding. A woman gives you a pastry because you have a nice face. It is the friendliest place in the world.',
    [
      ch('Stay the three days.', out('You stay. You are introduced to the baker four times before dinner, and every time he is so pleased. Your Pokémon are petted by everyone, as if for the first time, because for everyone it is.', flag('an28-came-3'), fr(3), later('an28-forget-day-two', 1))),
    ]),
  ev('an28-forget-day-two', 'Her Name Was Ilse', AN, { room: true, requires: [flagIs('an28-came-3')], cast: ['trainer.pr/veteran_m'], tint: '#2a2030', effect: 'none' },
    'Day two. They have forgotten you. They are delighted to meet you. On one door at the end of the lane, under "You live here," there is a second note, long and much folded, soft as cloth from handling. "Her name was Ilse. Read this every morning. It will hurt. Read it anyway." Below that, a whole life, in small writing. The man who lives there comes out, reads it on the step, and cries. Then he folds it back up and goes in to make breakfast.',
    [
      ch('Sit on the step with him.', out('You sit down. He does not know you. He does not need to. He tells you about Ilse as if he had just learned it, because he has, and you listen as if you had not read it already this morning on his door. When he goes in to make breakfast, he sets two cups out, and puts one back.', flag('an28-sat-with-him'), later('an28-forget-day-three', 1))),
      ch('Leave him his morning.', out('You leave the note the way it was and go. Behind you the door opens, and he reads it again on the step, and it hurts, and he reads it anyway. Some mornings are too big for a stranger to share. Nico watches from the lane and says nothing for the rest of the day.', flag('an28-left-his-morning'), later('an28-forget-day-three', 1))),
    ]),
  ev('an28-forget-day-three', 'The Third Question', AN, { room: true, requires: [flagIs('an28-came-3')], cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#2a2030', effect: 'none',
    remembers: [
      { id: 'carried', when: [memorial], notice: 'You know exactly which day you would be forgetting. So does your team. They have gone very still.', hide: [1],
        addChoices: [ch('No. It\'s mine.', out('You hear yourself say it, and then the rest of it, in your own words: "I carried it this far. I\'m not putting it down in a town that won\'t remember why." Nico writes all of it, and underlines it twice. For a while neither of you says anything. Your team closes in round you without being asked. "Come to the gate," Nico says at last. "I\'ve something for you."', flag('kino-answers'), flag('an28-answer-its-mine'), flag('an28-true'), fr(3), room('an28-the-gate')))] },
    ] },
    'Day three. Nico sits on the town wall, pencil still. Nobody here will remember them tomorrow. "I like it here," Nico admits. "I can come back every year and it\'s new." They do not look at you for the question. They look at the door at the end of the lane. "Would you want to forget your worst day?"',
    [
      ch('Yes.', out('Nico nods. "Most people say that, the first time." They write it down. "This town says yes every night. It\'s the friendliest place in the world. It\'s also full of people making breakfast for two." They close the notebook. "Come to the gate. I\'ve something for you."', flag('kino-answers'), flag('an28-answer-yes'), room('an28-the-gate'))),
      ch('No. It\'s mine.', out('"Yours," Nico repeats, and writes it down, and underlines it twice. "That\'s what the note on that door says, in more words." For a while neither of you says anything. "Come to the gate. I\'ve something for you."', flag('kino-answers'), flag('an28-answer-its-mine'), flag('an28-true'), room('an28-the-gate'))),
    ]),
  ev('an28-the-gate', 'The Fourth Morning', AN, { room: true, cast: ['trainer.pr/backpacker_m'], pokemon: 'cyclizar', tint: '#2a2418', effect: 'sparkle',
    remembers: [
      { id: 'welcome', when: [flagIs('an28-true', 3)], notice: 'Nico reads the three answers over, then looks at you properly, the way they look at a town on the third day. "You\'d be welcome in all of them. You\'d be miserable in all of them, too. That\'s usually the same people."' },
    ] },
    'The fourth morning. The town has forgotten you both, cheerfully. At the gate Nico stops the Cyclizar and turns the notebook round so you can read it: three towns, three questions, your three answers in your own words, underlined where you meant them most. "I\'ve asked a lot of people," Nico says. "Most of them answer for the person they\'d like to be."',
    [
      ch('Take the ride.', out('Nico whistles, and a second Cyclizar trots out of the hedge: younger, sleeker, faintly embarrassed. "My Cyclizar\'s sister. She doesn\'t do towns. She does roads. She\'ll find you in every region and carry you twice, and then she\'ll go and lie in the sun." Nico pulls the goggles down at last. "Three days. That was ours." The old Cyclizar purrs. The gate swings. They do not look back, and you understand now that it is a kindness.',
        item('cyclizar-ride'), flagAt('an28-ride'), moment('You spent three days in each of three towns with Nico, and answered three questions in your own words.', 60))),
    ]),
  ...AN28_RIDES.map((k, i) => ev(`an28-ride-${k}`, 'The Cyclizar Again', AN, { callback: true, requires: [flagIs('an28-ride'), flagAgo('an28-ride', k)], pokemon: 'cyclizar', tint: '#2a2418', effect: 'none' },
    RIDE_SCENES[i]!,
    [
      ch('Ride.', out('She waits while you settle, then takes the road at a run that turns into a glide. She will come when you call her, twice in this region, and then go and lie in the sun.', item('cyclizar-ride'))),
    ])),

  // ---------------- AN29. The Spirit at the Bus Stop ----------------
  ev('an29-spirit-bus-stop', 'The Spirit at the Bus Stop', AN, { rarity: 'uncommon', minStage: stageOf('A2'), types: tagTypes('forest'), cast: ['trainer.pr/school_kid_f', 'trainer.pr/preschooler_f'], tint: '#1b2a24', effect: 'rain',
    remembers: [
      { id: 'umbrella-friend', when: [flagIs('umbrella-shared')], notice: 'The great soft head turns, slowly, and looks straight at you, and its whole body ripples like a pond. It knows you. You shared an umbrella with a stranger once, in rain like this, and somehow it heard.',
        addChoices: [ch('Get on the bus.', out('When the bus rolls in, it does not leave without you. The twig door waits open, and the creature pats the seat beside it with one enormous paw. You ride through the dark wet trees, sitting beside something soft and warm that hums to itself, and step off a long way down the road, exactly where you needed to be. There is a seed in your pocket that was not there before.', flag('bus-waited'), flag('an29-bus-rode'), flag('an29-thanked'), egg({ species: ['bramblin'], left: 2, unit: 'stage' }), express()))] },
    ] },
    `Rain at a country bus stop, at dusk. A tin roof, a bench, a timetable nobody trusts. Two little girls in yellow boots wait for their father, the older one holding a big black umbrella that is clearly his. Beside them stands something enormous and soft, grey-green and patient, taller than the shelter, with a single leaf balanced on its head. It is getting very wet. "Don't stare," the older girl whispers, without turning her head. The younger one is already holding her father's umbrella up to it. It takes the umbrella in two careful claws. Rain drums on the cloth. Its eyes go wide with delight. It jumps, and when it lands, every drop on every tree lets go at once.`,
    [
      ch('Wait with them.', out(`You sit on the end of the bench. Nobody talks; it is not that sort of wait. The creature plays the umbrella like a drum, softly, then not softly at all. At last two lamps come swaying up the dark road and the bus pulls in, except that it is not a bus. It is a great rolling tangle of Brambleghast, dozens of them knotted into the shape of one, lamps for eyes, a door of woven twigs. The creature gives the umbrella back, very carefully, and climbs aboard. Through the window it waves at the girls, and at you. Where it sat on the bench there is a single seed, warm to the touch. Their father's bus comes ten minutes later, the ordinary kind. He looks at his daughters' faces and does not ask.`,
        flag('bus-waited'), flag('an29-thanked'), egg({ species: ['bramblin'], left: 2, unit: 'stage' }))),
      ch('Offer your umbrella too.', out('You hold out your own umbrella. It looks at yours. It looks at the one it already has. Then it takes both, one in each claw, and stands under the two of them in a state of perfect happiness, the rain drumming twice as loud. When the bus comes, a great tangle of Brambleghast rolled into the shape of one, it climbs aboard with both umbrellas. Then the twig door opens again and it leans out and presses a bundle into your hands: seeds, wrapped in a leaf and tied with grass. One of them is warm, and moving, just slightly. You walk on soaked to the skin, grinning.',
        flag('bus-seeds'), flag('an29-thanked'), egg({ species: ['bramblin'], left: 2, unit: 'stage' }), item('miracle-seed'))),
      ch('Leave.', leave('You nod to the girls and go on into the rain. Behind you the two of them wait under the tin roof beside something enormous and soft and very happy. Their father will come. They are fine. You never find out what it was, and some nights, in rain, you wonder.')),
    ]),
  ev('an29-letter', 'A Letter in Careful Handwriting', AN, { callback: true, requires: [flagIs('an29-thanked'), age('an29-thanked', 1)], cast: ['trainer.pr/scientist_m'], pokemon: 'bramblin', tint: '#1b2a24', effect: 'none' },
    'A letter catches up with you at a Pokémon Center, the envelope soft at the corners from rain. The handwriting is small and careful: a researcher\'s hand. "You waited at the bus stop with my daughters. They have told me about it every night since, and drawn it twice. I study forest Pokémon. I have never once seen what they saw."',
    [
      ch('Read it to the end.', out('"I have spent twenty years looking for it with a notebook," the letter goes on. "They found it by lending it an umbrella. I think I have been doing my job wrong." There is a drawing folded inside, in crayon: a bus stop, two small girls, something enormous with a leaf on its head, and you, on the end of the bench. Somebody has written your name under you, carefully, in capitals.', flag('an29-letter-read'), fr(2), moment('You waited at a bus stop in the rain with two little girls and something enormous and soft.', 55))),
    ]),
];

export const CHECKED: Record<string, string> = {
  AN28: '2026-11-15',
};

export const REMOVE: string[] = [];
