// Anime questlines, module 4: AN28-AN36. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AN28 The Traveller on Three-Day Visas (Run-Long; script: QUESTLINES_DEEPENED_1.md "AN28")
//   AN29 The Spirit at the Bus Stop       (Single;   script: QUESTLINES_ANIME_INSPIRED.md "AN29")
//   AN30 The Rock Band                    (Stage-Three; script: QUESTLINES_ANIME_INSPIRED.md "AN30")
//   AN31 The Cards in the Book            (Run-Long;    script: QUESTLINES_ANIME_INSPIRED.md "AN31")
//   AN32 Starting from Stone              (Region;      script: QUESTLINES_ANIME_INSPIRED.md "AN32")
//   AN33 The Fish Who Wanted Legs         (Stage-Three; script: QUESTLINES_ANIME_INSPIRED.md "AN33")
//   AN34 The Walls                        (Stage-Three; script: QUESTLINES_ANIME_INSPIRED.md "AN34")
//   AN35 The Cook of the Dungeon          (Door chain;  script: QUESTLINES_DEEPENED_1.md "AN35"; chain ps_an35_dungeon)
//   AN36 The Prince and the Shadow        (Stage-Three; script: QUESTLINES_ANIME_INSPIRED.md "AN36")
// Build: npm run co:build -- anime-4
import { $, again, anyType, ch, egg, ev, express, fight, flag, flagAgo, flagAt, flagIs, fr, front, heal, hurt, isPeace, isRage, item, leave, out, rest, room, takeNode, type Json } from '../dsl.ts';
import { age, AN, beast, duel, gain, later, moment, monDuel, notYet, sign, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AN28: 'an28-three-day-visas',
  AN29: 'an29-spirit-bus-stop',
  AN30: 'an30-rock-band',
  AN31: 'an31-cards-in-the-book',
  AN32: 'an32-starting-from-stone',
  AN33: 'an33-fish-legs',
  AN34: 'an34-the-walls',
  AN35: 'an35-cook-of-the-dungeon',
  AN36: 'an36-prince-and-shadow',
};

const AN28_RIDES = [1, 2, 3, 4, 5, 6];

export const PLACEMENT: Record<string, Place> = {
  'an28-three-day-visas': {
    shape: 'Run-Long', earliest: 'A4', home: "Each region's Stage 4; Steps 9, 10, 11", sits: 'optional', attaches: 'instead',
    beats: ['an28-votes-day-two', 'an28-votes-day-three', 'an28-the-vote', 'an28-quiet-day-one', 'an28-quiet-day-two', 'an28-quiet-day-three', 'an28-forget-day-one', 'an28-forget-day-two', 'an28-forget-day-three', 'an28-the-gate', ...AN28_RIDES.map((k) => `an28-ride-${k}`)],
    note: 'One town per region over three regions; in each, Day one, Day two, Day three are Steps 9, 10, 11 of the region\'s Stage 4, instead of the node battle. Tags: any. The ride callbacks (an28-ride-N) come once in each later region.',
  },
  'an29-spirit-bus-stop': { shape: 'Single', earliest: 'A2', home: 'a + node', sits: 'optional', attaches: 'rest', tags: ['forest'], beats: ['an29-letter'], note: 'In Rain, at dusk. The father\'s letter (afterstory) comes a stage later.' },
  'an30-rock-band': { shape: 'Stage-Three', earliest: 'A3', home: 'The town; 12; 17 (the gig)', sits: 'optional', tags: ['city'], beats: ['an30-rehearsal', 'an30-curtain-rehearsal', 'an30-the-gig', 'an30-the-gig-curtain'], note: 'Steps: the town, 12, 17. The rehearsal and the gig follow the meeting\'s choice: on stage (or coached) or behind the curtain.' },
  'an31-cards-in-the-book': { shape: 'Run-Long', earliest: 'A3', home: 'One Hidden node per stage, Steps 5-15', sits: 'optional', beats: ['an31-the-book-read', 'an31-loose-letter', 'an31-the-word', 'an31-the-word-spelled'], note: 'Run-Long: one card per stage. Tags: any. The loose letter comes back every stage (again) until all 28 are caught; it belongs on a Hidden node, Steps 5-15.' },
  'an32-starting-from-stone': { shape: 'Region', earliest: 'A6', home: 'Stages 2, 5, 8', sits: 'optional', tags: ['cave'], beats: ['an32-salt-cave', 'an32-the-coal', 'an32-the-glow', 'an32-the-glow-again', 'an32-the-cure', 'an32-the-cure-again'], note: 'Stage 2: the town of statues and the salt (same node). Stage 5: the coal. Stage 8: the glow and the cure. The glow and cure come in two forms: the Rolycoly asked, or mined.' },
  'an33-fish-legs': { shape: 'Stage-Three', earliest: 'A3', home: 6, sits: 'optional', tags: ['water'], beats: ['an33-empty-bucket', 'an33-high-water', 'an33-the-leader', 'an33-a-bigger-bucket'], note: 'Steps 6, 12, 17. The middle beat follows the first choice: the empty bucket (back), the high water (stay) or the school\'s leader (ask).' },
  'an34-the-walls': { shape: 'Stage-Three', earliest: 'A9', home: 'The town; then 12 and 17', sits: 'optional', attaches: 'town', tags: ['city', 'cave'], beats: ['an34-midnight', 'an34-the-truth', 'an34-a-reason', 'an34-last-stone'], note: 'At the Town node: one stone has moved each morning. The middle beat follows the first choice (watch, outside, ask); the last beat is the same for all.' },
  'an35-cook-of-the-dungeon': { shape: 'Door', earliest: 'A3', home: 'The second node of a Door', sits: 'optional', attaches: 'rest', tags: ['cave'], beats: ['an35-dungeon-stair', 'an35-flooded-camp', 'an35-flooded-floor', 'an35-the-stew', 'an35-far-shore', 'an35-the-ride'], note: 'The doc places it inside any Pseudo Stage as its rest node (the second node of a Door, at a + node); built as its own Door chain ps_an35_dungeon whose second room is the camp. Asking Dondozo skips the flooded floor (one room fewer).' },
  'an36-prince-and-shadow': { shape: 'Stage-Three', earliest: 'A5', home: 6, sits: 'optional', tags: ['eerie'], beats: ['an36-first-fight', 'an36-kitchens'], note: 'Steps 6, 12, 17.' },
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
  AN30: [
    'Remembers "if the Understudy was helped" reads flag understudy-helped, which the thread that builds The Understudy must set.',
    'Her Toxel evolving (Amped or Low Key) happens in the story; it is her Pokémon, so only the scene shows it. The sibling\'s egg is an Egg that hatches into a Toxel after three battles.',
  ],
  AN31: [
    '"Let them go": the region being a little wrong, and words going missing from dialogue at random, is told in the text only; the game cannot drop words from other scenes.',
    'Each loose Unown makes its mischief in its own scene (four kinds, by how many are caught); it does not change shop names or signs elsewhere in the game.',
    'Remembers "if Caverns-o-Mighty was done" reads flag caverns-o-mighty-done, which the thread that builds Caverns-o-Mighty must set; then the hunt starts at 14 of 28.',
    'The word counting as a Sign (+2) is sign-own +2 (the legends thread turns it into the blessed Legendary\'s Influence).',
    '"The full set unlocks the Regi chamber\'s word puzzle" sets flag an31-full-set; the legends thread\'s Regi chamber must read it.',
    '"One Unown of the player\'s choice": the game has one Unown species with no letter forms, so the letter is chosen in the text only.',
    'The guardian Cleffa following the player for the rest of the run is a flag (an31-guardian-follows) and a Chronicle line; it does not walk on the map.',
  ],
  AN32: [
    'Afterstory "the town builds a school in later runs; the boy teaches in it" is not built (nothing crosses runs).',
  ],
  AN33: [
    '"The sea keeps rising for a stage; the town floods a little" is a rain front over the rest of this stage, and bailing out the flood takes a node at the next beat.',
    'Remembers "if The Stranding was resolved peacefully" reads flag stranding-peaceful, which the thread that builds The Stranding must set.',
  ],
  AN34: [
    'Remembers "if walls.outside and the player tells the town: the gates open in later runs and the Stonjourner go home" is not built across runs; in this run the last scene shows the gate propped open and the stones beginning to turn for home.',
  ],
  AN35: [
    'It is its own Door (chain ps_an35_dungeon) whose second room is the camp, instead of appearing as the rest node of any Pseudo Stage.',
    'The "funny" stew (everybody\'s voice up an octave for one node) is told in the text only.',
    'Remembers "if The Three Tatsugiri (M5) was done" reads flag three-tatsugiri-done, which the thread that builds M5 must set.',
  ],
  AN36: [
    'Remembers "if prince.signs: every later meeting is in sign, and the subtitles show it" is a line in each later scene saying so; the screen has no separate subtitle style.',
    'Afterstory "he is king in a later run, the Duskull beside the throne" is not built (nothing crosses runs).',
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

  // ---------------- AN30. The Rock Band ----------------
  ev('an30-rock-band', 'The Rock Band', AN, { rarity: 'uncommon', minStage: stageOf('A3'), types: tagTypes('city'), cast: ['trainer.guitarist', 'trainer.pr/musician'], pokemon: 'toxel', tint: '#2a1830', effect: 'none' },
    'Behind the town hall there is a practice room, and behind the practice room there is a cupboard, and in the cupboard, among mops, a girl is playing guitar. She is perfect. Every note lands where it means to. Beside her a Toxel sits on an upturned bucket, shaking so hard its spines buzz. She sees you and the music stops dead. "I can\'t play in front of people. My Toxel won\'t evolve. It\'s shy too." The door bangs open behind you. A band leader in a studded jacket, out of breath: "Our guitarist quit. We\'re on in an hour."',
    [
      ch('Go on with her.', out('You walk out onto the little stage with her, and your {lead} comes too. The lights find her and her hands freeze. So your {lead} starts to dance: badly, wonderfully, right at the edge of the stage. She stops looking at the crowd. She plays to the {lead} instead, every beat landing on its feet, and the Toxel on its bucket begins, very slowly, to nod along. When it ends the hall is roaring. She does not hear it. She is laughing at your {lead}. The band leader grabs her hand: "The big gig. Two weeks. You\'re in."',
        flag('band-on'), flag('an30-joined'), fr(5, 'lead'), later('an30-rehearsal', 5)),
        { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out('You walk out with her, and your {lead} comes too. The lights find her and her hands freeze, so your {lead} starts to dance, and trips over a cable on the second beat. It looks up from the floor, mortified. And she laughs. She cannot help it. Then she plays to it, gently, to get it back on its feet, and somehow that is the whole set. The hall cheers the dancer as much as the guitarist. "The big gig," the band leader says. "Two weeks. Both of you."',
          flag('band-on'), flag('an30-joined'), fr(3, 'lead'), later('an30-rehearsal', 5)) }),
      ch('Play behind a curtain.', out('There is a curtain at the back of the stage, heavy and red and dusty. She plays behind it. Nobody sees her. She plays perfectly, every note, and the hall goes wild for a guitarist nobody can see. By the end they are chanting for the mystery player to come out. She does not. Behind the curtain, the Toxel has stopped shaking. "The big gig," the band leader says, baffled and delighted. "Two weeks. Bring the curtain."',
        flag('band-curtain'), flag('an30-joined'), later('an30-curtain-rehearsal', 5))),
      ch('Coach her.', out('"Not tonight," you tell the band leader. "Give her two weeks." The band goes on without a guitarist and is, by every account, terrible. In the cupboard you start with step one: play for the Toxel. Only for the Toxel. She plays it a lullaby, a march, a song about a bus. By the third song it has climbed off its bucket and into her lap. "That\'s one," you say. "Two more."',
        flag('band-coached'), flag('an30-joined'), later('an30-rehearsal', 5))),
    ]),
  ev('an30-rehearsal', 'Rehearsal', AN, { room: true, requires: [flagIs('an30-joined')], cast: ['trainer.guitarist', 'trainer.pr/musician'], pokemon: 'toxel', tint: '#2a1830', effect: 'none',
    remembers: [
      { id: 'coach-two', when: [flagIs('band-coached')], intro: 'Rehearsal, the week before the big gig. Step two: play for the band. The drummer, the bassist and the band leader sit on amps in a row, arms folded, trying very hard to look like people who are not listening. She stands in the doorway of the practice room with her guitar held like a shield. The Toxel is on her shoulder this time, not on a bucket.', hide: [1],
        addChoices: [ch('Play for the band.', out('She does not look at them. She looks at the Toxel, and plays to it, the way she did in the cupboard. Halfway through the first song the drummer comes in, quietly, under her. Then the bass. By the chorus the band leader has given up pretending and is singing, badly, at the ceiling. She finishes and looks up and they are all looking at her, and she does not run. "That\'s two," you say. "One more."', flag('an30-coach-two'), fr(3), later('an30-the-gig', 5)))] },
    ] },
    'Rehearsal, the week before the big gig. The band plays loud and fast and slightly out of time, and in the middle of it all she plays exactly right, eyes shut, back to the room. Every time someone new comes through the door she misses a beat. The Toxel sits on its bucket in the corner, watching her, and every missed beat makes it flinch.',
    [
      ch('Stand where she can see you.', out('You stand by the door where she can see you without opening her eyes for long. Every time someone comes in, she glances at you, and does not miss the beat. By the end of the evening the Toxel has moved its bucket closer to her. Next week, the big gig.', flag('an30-rehearsed'), fr(2, 'lead'), later('an30-the-gig', 5))),
      ch('Let the band find its own feet.', out('You sit on the floor and keep out of it. It is rough. She misses a beat when the drummer\'s little brother comes in, then two when the caretaker does. But the band leader just counts her back in, every time, as if missing were allowed. By the end of the evening she has stopped apologising. Next week, the big gig.', flag('an30-rehearsed'), later('an30-the-gig', 5))),
    ]),
  ev('an30-curtain-rehearsal', 'Rehearsal Behind the Curtain', AN, { room: true, requires: [flagIs('band-curtain')], cast: ['trainer.guitarist', 'trainer.pr/musician'], pokemon: 'toxel', tint: '#2a1830', effect: 'none' },
    'Rehearsal, the week before the big gig. The band has hung the red curtain across one corner of the practice room, and from behind it comes the best guitar anybody in town has ever heard. The band leader has started calling her "the Ghost". There are posters. "THE GHOST GUITARIST. WHO IS SHE?" She has put one up in the cupboard, and keeps looking at it, not sure whether to be proud.',
    [
      ch('Tell her the curtain is fine.', out('"It\'s fine," you say. "The music is the music." She lets out a breath she has been holding for a week. Behind the curtain the Toxel curls up against her ankle, calm as a cat, and she plays the whole set through without a single wrong note. Next week, the big gig, behind the curtain.', flag('an30-rehearsed'), fr(2), later('an30-the-gig-curtain', 5))),
      ch('Ask if she will ever come out.', out('She is quiet for a long time. "Maybe," she says. "Not yet. Is that allowed?" You tell her it is. She nods, and pulls the curtain straight, carefully, the way you would tuck in someone you love. Next week, the big gig, behind the curtain.', flag('an30-rehearsed'), flag('an30-asked-curtain'), later('an30-the-gig-curtain', 5))),
    ]),
  ev('an30-the-gig', 'The Gig', AN, { room: true, requires: [flagIs('an30-joined')], cast: ['trainer.guitarist', 'trainer.pr/musician'], pokemon: 'toxtricity', tint: '#3a1428', effect: 'confetti',
    remembers: [
      { id: 'coach-three', when: [flagIs('band-coached')], intro: 'The big gig. The hall is full to the doors. Step three, before she goes on: play for one stranger. At the stage door there is an old woman waiting for a bus, who has never heard of the band. She plays her one song, right there on the step, just for her. The old woman listens with her eyes shut, then says, "Oh, that was lovely, dear," and gets on her bus. And she turns round and goes on stage.' },
      { id: 'understudy', when: [flagIs('understudy-helped')], notice: 'In the third row there is a Mime Jr. on someone\'s knee, the one from the Understudy. It sees you, and when the first song ends it is the first one in the whole hall to clap.' },
    ] },
    'The big gig. The hall is full to the doors, every lamp in town carried in to light it. She walks out on stage with the Toxel on her shoulder. She looks at the crowd. Then she looks for you, and finds you, and plays the first chord.',
    [
      ch('Watch from the front row.', out('She plays to the front row, to you, and then, by the second song, to all of them. The Toxel on her shoulder is crackling. On the last chord it leaps into the light, and the light takes it: it comes down a Toxtricity, tall and loud and blazing, Amped, punching the air. The hall comes apart. Afterwards, in the cupboard, she puts an egg into your hands, still warm. "Its sibling. It should hear music early." She is still shaking. It is a different kind of shaking.',
        egg({ species: ['toxel'], left: 3, unit: 'battle' }), flag('an30-gig-amped'), flag('reunion-guest-rock-band'), moment('A girl who could not play in front of people played the big gig, and her Toxel came down Amped.', 65))),
      ch('Send your lead up to dance.', out('Your {lead} climbs up beside her and dances, and she laughs out loud on the first chord, into the microphone, and the whole hall laughs with her. The Toxel on her shoulder is crackling. On the last chord it leaps into the light and comes down a Toxtricity, tall and loud and Amped, dancing with your {lead}. Afterwards, in the cupboard, she puts an egg in your hands, still warm. "Its sibling. It should hear music early."',
        egg({ species: ['toxel'], left: 3, unit: 'battle' }), fr(5, 'lead'), flag('an30-gig-amped'), flag('reunion-guest-rock-band'), moment('A girl who could not play in front of people played the big gig, and her Toxel came down Amped.', 65))),
    ]),
  ev('an30-the-gig-curtain', 'The Ghost Guitarist', AN, { room: true, requires: [flagIs('band-curtain')], cast: ['trainer.guitarist', 'trainer.pr/musician'], pokemon: 'toxtricity-low-key', tint: '#1e1430', effect: 'confetti',
    remembers: [
      { id: 'understudy', when: [flagIs('understudy-helped')], notice: 'In the third row there is a Mime Jr. on someone\'s knee, the one from the Understudy. It sees you, and when the first song ends it is the first one in the whole hall to clap, straight at the curtain.' },
    ] },
    'The big gig. The hall is full to the doors, and half the crowd has come to see the Ghost Guitarist. The red curtain hangs at the back of the stage. You are behind it with her, and the Toxel, and one small lamp.',
    [
      ch('Stay behind the curtain with her.', out('She plays the whole night without being seen, every note perfect, and the hall sings along to someone it will never meet. Behind the curtain the Toxel sways, calm, and in the last slow song it glows, softly, and is a Toxtricity: Low Key, cool and quiet, leaning on her shoulder. She grins in the dark. After, she puts an egg into your hands. "Its sibling. Let it choose loud or quiet for itself."',
        egg({ species: ['toxel'], left: 3, unit: 'battle' }), flag('an30-gig-low-key'), flag('reunion-guest-rock-band'), moment('The Ghost Guitarist played the big gig unseen, and her Toxel became a Low Key Toxtricity in the dark.', 60))),
      ch('Watch from the crowd.', out('You go out front and watch the curtain with everyone else. When the last song ends the hall chants for the Ghost to come out, and the curtain moves, once, as if she has put a hand on it. She does not come out. A Toxtricity\'s head appears round the edge instead, Low Key, unbothered, and bows. The hall loses its mind. After, she puts an egg into your hands. "Its sibling. Let it choose loud or quiet for itself."',
        egg({ species: ['toxel'], left: 3, unit: 'battle' }), fr(2), flag('an30-gig-low-key'), flag('reunion-guest-rock-band'), moment('The Ghost Guitarist played the big gig unseen, and her Toxel became a Low Key Toxtricity in the dark.', 60))),
    ]),

  // ---------------- AN31. The Cards in the Book ----------------
  ev('an31-cards-in-the-book', 'The Cards in the Book', AN, { rarity: 'rare', minStage: stageOf('A3'), types: [], pokemon: 'cleffa', tint: '#241a30', effect: 'flicker',
    remembers: [
      { id: 'caverns', when: [flagIs('caverns-o-mighty-done')], notice: 'Half of the letters do not scatter. They wheel once over the roof and stream away north, towards the Caverns-o-Mighty, where you have been. They know the way home. They will come when called.', hide: [0],
        addChoices: [ch('Catch them.', out('"Fourteen went home on their own," the Cleffa says, counting on tiny fingers, astonished. "They know you." It ties its ribbon tighter, as if for battle. "Fourteen left. One at a time. Wherever they land." The empty book hums in your hands, fourteen pages already full of black, curling letters.', flag('an31-hunting'), flag('unown-count', 14)))] },
    ] },
    'An old house at the edge of the route, door open, nobody home but dust. On a reading stand lies a book with a brass clasp, and the clasp is warm. You touch it. It springs open by itself, and the pages are blank, and then they are not blank: twenty-eight black shapes peel off the paper, Unown, every one of them, and pour out through the window and away across the whole region like a flock of crows. A small round figure in a pink ribbon is sitting on the shelf above, a Cleffa, clutching its own face. "Oh no. Oh no no no." It hops down. "They\'re letters. Loose letters cause trouble. Signs will say the wrong things. People will forget words." It points at you, trembling with outrage. "You let them out. You catch them."',
    [
      ch('Catch them.', out('"Good," the Cleffa says, as if it had not been sure of you. It ties its ribbon tighter. "Twenty-eight. One at a time. Wherever they land. They\'ll be making mischief before you reach the next town." It climbs onto the book and sits there, small and fierce, guarding the empty pages.', flag('an31-hunting'))),
      ch('Let them go.', out('You close the empty book. Somewhere out there, twenty-eight letters are already landing on signs and in shops and in people\'s mouths. The Cleffa stares at you. It does not argue. It just sits down on the book, very small, and stays there as you leave. All run, the region feels a little wrong: a word missing here, a sign that reads oddly there, and you are the only one who knows why.', flag('unown-free'))),
      ch('Read the book first.', out('You turn the blank pages. They are not quite blank. Very faintly, where the letters lay, there are marks, and the marks make a shape, and the shape is a spell: the whole book is one spell, for one single word, and the twenty-eight letters spell it. The Cleffa snatches the book closed. "No," it says. "I won\'t say what it is. You\'ll see, if you catch them all."', flag('unown-read'), room('an31-the-book-read'))),
    ]),
  ev('an31-the-book-read', 'One Word', AN, { room: true, requires: [flagIs('unown-read')], pokemon: 'cleffa', tint: '#241a30', effect: 'flicker',
    remembers: [
      { id: 'caverns', when: [flagIs('caverns-o-mighty-done')], notice: 'Half of the letters are already gone north, home to the Caverns-o-Mighty, where you have been. They will come when called.', hide: [0],
        addChoices: [ch('Catch them.', out('"Fourteen went home on their own," the Cleffa says. "Fourteen left. Then the word." It holds the book shut against its chest, as if the word might get out by itself.', flag('an31-hunting'), flag('unown-count', 14)))] },
    ] },
    'The Cleffa sits on the closed book with its arms folded, guarding a word it will not say. Outside, far off, a shop bell rings in a way that sounds almost like a letter laughing. "Well?" the Cleffa demands. "Are you going to catch them, or not?"',
    [
      ch('Catch them.', out('"Twenty-eight," the Cleffa says. "Then the word." It holds the book shut against its chest, as if the word might get out by itself.', flag('an31-hunting'))),
      ch('Let them go.', out('The Cleffa looks at you for a long moment. "You read it," it says. "And you\'re letting it go." It sits down on the book. All run, the region feels a little wrong: a word missing here, a sign that reads oddly there, and somewhere a word that will never be spelled.', flag('unown-free'))),
    ]),
  ev('an31-loose-letter', 'A Loose Letter', AN, { callback: true, requires: [flagIs('an31-hunting'), flagIs('unown-count', 0, 27)], pokemon: 'unown', tint: '#241a30', effect: 'glint',
    remembers: [
      { id: 'shop', when: [flagIs('unown-count', 7, 13)], intro: 'In a shop, the shopkeeper is staring at a shelf of little spray bottles. "It\'s a... you spray it on a... it\'s a." He has forgotten the word "Potion". Customers are pointing. On the top shelf, wedged between two bottles, a black letter is quivering with glee.' },
      { id: 'mouths', when: [flagIs('unown-count', 14, 20)], intro: 'A girl on the route is trying to call her Pokémon and cannot. Its name has gone. She opens her mouth and nothing comes, and her Pokémon looks at her, worried, while she cries. On her hat, very pleased with itself, sits a black letter.' },
      { id: 'last', when: [flagIs('unown-count', 21, 27)], intro: 'The last few are bolder. This one has got into a signpost and turned every road into the same road, so travellers walk in a slow circle round it, puzzled and polite. It hangs at the top of the post, spinning, as if it were waiting for you.' },
    ] },
    'A signpost at a fork in the road says "THIS WAY TO NOWHERE" in both directions, in very neat letters. A hiker is reading it for the fourth time. On the top of the post, clinging to the wood, one black letter is shaking with what can only be laughter. The Cleffa, riding in your bag, hisses: "There."',
    [
      ch('Catch it.', out('It darts, and you are faster. It folds itself small in your hand, warm and humming, and when you open the book it flattens onto a page as neatly as ink. Behind you the signpost says what it should. Somebody somewhere remembers a word. The Cleffa makes a mark on its ribbon. "Next one, next stage."', flag('unown-count'), again('an31-loose-letter')),
        { prompt: { id: 'throw-ring', needs: 'ok' }, fail: out('It darts, and it is faster. It goes skimming off over the hedges, laughing its silent laugh, to make trouble somewhere further on. "It\'ll land again," the Cleffa says grimly. "They always land. Next stage."', again('an31-loose-letter')) }),
      ch('Let this one play a little longer.', out('You leave it on its signpost for now. The hiker sighs and picks a road at random. The Cleffa looks at you sideways. "It\'ll still be loose next stage," it says. "Somewhere."', again('an31-loose-letter'))),
    ]),
  ev('an31-the-word', 'Twenty-Eight', AN, { callback: true, requires: [flagIs('an31-hunting'), flagIs('unown-count', 28), notYet('unown-read')], pokemon: 'unown', tint: '#2e2040', effect: 'sparkle' },
    'The last letter goes into the book, and the book closes by itself with a sound like a held breath let go. Twenty-eight pages, twenty-eight letters, every one of them in its place. The Cleffa sits on the cover and pats it, over and over. "All of them," it says. "You actually caught all of them." There is a faint warmth coming off the book, and somewhere deep underground, a door you have never seen is listening.',
    [
      ch('Choose your letter.', out('The Cleffa opens the book and holds it up to you: one letter of your choosing may come with you, for catching all the rest. You choose. It hops off the page and onto your shoulder, small and black and humming. The Cleffa climbs into your bag, nervously, and does not climb out again for the rest of the run.',
        gain('unown'), flag('an31-full-set'), flag('an31-guardian-follows'), moment('You caught all twenty-eight letters that flew out of the book.', 65))),
      ch('Leave every letter in the book.', out('You shake your head. Twenty-eight belong together. The Cleffa looks at you as if you had said something wise by accident, and fastens the clasp. Then it climbs into your bag, nervously, and does not climb out again for the rest of the run.',
        flag('an31-full-set'), flag('an31-guardian-follows'), fr(3), moment('You caught all twenty-eight letters that flew out of the book, and kept them together.', 65))),
    ]),
  ev('an31-the-word-spelled', 'The Word', AN, { callback: true, requires: [flagIs('an31-hunting'), flagIs('unown-count', 28), flagIs('unown-read')], pokemon: 'unown', tint: '#2e2040', effect: 'sparkle' },
    'The last letter goes into the book, and the book does not close. You read it first, back at the old house, so the letters know what you are waiting for. They lift off the pages, all twenty-eight, and hang in the air in a line, and spell a word. It is a name. It is the name of the Legendary who blesses your run, and as you read it, something very large, very far away, hears its name said kindly.',
    [
      ch('Choose your letter.', out('The word stays in the air a long moment, then folds back into the book, page by page. The Cleffa is crying, and pretending it is not. It holds out the book: one letter of your choosing may come with you. You choose. It hops off the page and onto your shoulder, small and black and humming. The Cleffa climbs into your bag, nervously, and does not climb out again for the rest of the run.',
          gain('unown'), sign('own', 2), flag('an31-word-spelled'), flag('an31-full-set'), flag('an31-guardian-follows'), moment('You caught all twenty-eight letters, and they spelled the name of your Legendary.', 75))),
      ch('Leave every letter in the book.', out('The word stays in the air a long moment, then folds back into the book, page by page, all twenty-eight together, the way they belong. The Cleffa is crying, and pretending it is not. It fastens the clasp, then climbs into your bag, nervously, and does not climb out again for the rest of the run.',
        sign('own', 2), flag('an31-word-spelled'), flag('an31-full-set'), flag('an31-guardian-follows'), fr(3), moment('You caught all twenty-eight letters, and they spelled the name of your Legendary.', 75))),
    ]),

  // ---------------- AN32. Starting from Stone ----------------
  ev('an32-starting-from-stone', 'Starting from Stone', AN, { rarity: 'rare', minStage: stageOf('A6'), types: tagTypes('cave'), cast: ['trainer.pr/school_kid_m'], tint: '#2c2c2a', effect: 'none' },
    'A town where nothing moves. People stand in the street mid-step, grey from hair to shoes. A Pokémon is frozen mid-leap over a fence. A Lillipup is stone in the middle of a bark, mouth open, tail up, forever about to make a noise. Pigeons of stone on stone roofs. And in the square, sitting cross-legged on the fountain\'s edge with a notebook full of sums, one boy, awake, with chalk on his face. "A Ghost-type\'s curse. Or a Pokémon\'s Gaze. Doesn\'t matter." He licks his pencil. "Science fixes it. I need three things. Coal, salt and something that glows. The rest is maths."',
    [
      ch('Help.', out('He looks up properly for the first time, as if he had not quite believed you were real. "Good. Salt first. There\'s a sea cave under the cliff." He tears a page from the notebook and gives it to you: a list, a map, and a drawing of the Lillipup with its mouth open, labelled "MUST HEAR END OF BARK."', flag('stone-helped'), room('an32-salt-cave'))),
      ch('How did you wake?', out('"I counted." He says it flatly, as if it were obvious. "Every second. For three years. You stay awake if you never stop thinking." He taps his temple. A muscle in his jaw is jumping. He has not stopped counting even now, you realise: some part of him is still going, under the words, in case.', flag('stone-how'), room('an32-stone-again'))),
      ch('That\'s impossible.', out('"So is a Magikarp becoming a dragon." He does not look up. "Pass me that jar." You pass him the jar. He measures something into it by the grain, lips moving, then glances at the Lillipup, mid-bark, and back to his sums, faster.', flag('an32-said-impossible'), room('an32-stone-again'))),
    ]),
  ev('an32-stone-again', 'The Boy With the Notebook', AN, { room: true, cast: ['trainer.pr/school_kid_m'], tint: '#2c2c2a', effect: 'none' },
    'The boy has gone back to his sums. The pencil scratches; the stone town waits around him, patient as a held breath. Coal, salt and something that glows, says the top of the page, underlined three times. He does not ask you again. He is not the sort to ask twice.',
    [
      ch('Help.', out('"Good." He tears out a page: a list, a map, and a drawing of the Lillipup labelled "MUST HEAR END OF BARK." "Salt first. Sea cave, under the cliff."', flag('stone-helped'), room('an32-salt-cave'))),
      ch('Leave him to his maths.', leave('You leave him on the fountain, counting. Behind you the stone town keeps perfectly still, and the boy keeps perfectly busy, as if one could hold up the other.')),
    ]),
  ev('an32-salt-cave', 'Salt', AN, { room: true, requires: [flagIs('stone-helped')], cast: ['trainer.pr/school_kid_m'], tint: '#1a2a34', effect: 'float' },
    'Under the cliff the sea has carved a cave, and the walls of it are white with salt, thick as frost. The tide is in, slapping and booming in the dark. The best crust is on a shelf at the back, under a foot of cold green water. The boy has come with you as far as the entrance, notebook held over his head.',
    [
      ch('Wait for low tide.', out('You sit on the rocks with the boy while the sea goes out, slow as a clock. He tells you the tide tables from memory; he has been counting those too. When the shelf is dry you scrape a whole jar of salt, clean and sharp. "One," he says, and for a moment he sounds his age. "Coal next. There\'s a Rolycoly in the old mine. It won\'t like it."', flag('an32-salt'), takeNode())),
      ch('Wade in now.', out('You wade in. The cold takes your breath; the sea pulls at your knees; you hold on to the rock and scrape blind, and come out with a jar of salt and your teeth chattering. "One," the boy says, staring at you as if you had done a sum he had not thought of. "Coal next. There\'s a Rolycoly in the old mine. It won\'t like it."', flag('an32-salt')),
        { prompt: { id: 'dive-hold', needs: 'ok' }, fail: out('You wade in. A wave knocks you flat and your team hauls you out by the collar, all of you soaked and battered. But your fist is shut, and when you open it, it is full of salt. "One," the boy says, very quietly. "Coal next. There\'s a Rolycoly in the old mine."', flag('an32-salt'), hurt(0.1)) }),
    ]),
  ev('an32-the-coal', 'The Rolycoly Who Will Not Be Burned', AN, { callback: true, requires: [flagIs('an32-salt'), age('an32-salt', 3)], cast: ['trainer.pr/school_kid_m'], pokemon: 'rolycoly', tint: '#241c18', effect: 'none' },
    'The old mine above the stone town. The boy has a pickaxe twice his size. At the end of the tunnel, wedged into a seam of coal like a cork, sits a Rolycoly, glowing faintly red at the edges. It rolls an eye at the pickaxe. Its meaning is plain: you may have its coal. But only if it is not burned for it. It has seen what people do with coal. "It doesn\'t understand," the boy says. "It\'s for the cure. I don\'t have time."',
    [
      ch('Ask it.', out('You put the pickaxe down and sit in front of it, and ask, and listen. It is not the coal it minds. It is the fire. So you find a way: the boy works out, scribbling fast, that the cure needs the coal ground cold, not burned at all. The Rolycoly watches you both for a long time. Then it sheds a lump of coal at your feet, gently, as if putting down a gift. It follows you out of the mine, rolling, to make sure you keep your word.', flag('an32-rolycoly-asked'), flag('an32-coal'), fr(2))),
      ch('Warm it by a Fire-type.', out('Your Fire-type sits down beside it, close, and the tunnel fills with a kind red warmth that burns nothing at all. The Rolycoly relaxes, seam by seam. Being warmed is not being burned. It sheds a lump of coal at your feet, as if paying for the company, and follows you out of the mine to see what you will do with it.', flag('an32-rolycoly-asked'), flag('an32-coal'), fr(3)), { requires: [anyType('fire')] }),
      ch('Mine it.', fight('The boy lifts the pickaxe. The Rolycoly flares, red to white, and rolls out of the seam to meet you.', monDuel('The Rolycoly', 'rolycoly', 0, { win: [flag('an32-rolycoly-mined'), flag('an32-coal')], lose: [flag('an32-rolycoly-mined'), flag('an32-coal')] }))),
    ]),
  ev('an32-the-glow', 'Something That Glows', AN, { callback: true, requires: [flagIs('an32-coal'), age('an32-coal', 3), flagIs('an32-rolycoly-asked')], cast: ['trainer.pr/school_kid_m'], pokemon: 'chinchou', tint: '#101c34', effect: 'glint' },
    'Night on the shore below the stone town. Out in the black water, a pair of soft lights bobs in and out of the waves: a Chinchou, its lures glowing blue and gold, the only lamp for a mile. The boy has the jar. His hands are shaking. "Last one," he says. "If this works, they wake up. If it doesn\'t, I start counting again." The Rolycoly is at your heel, its red edges flickering, watching the Chinchou.',
    [
      ch('Sit with it in the dark.', out('You sit on the wet sand and wait. The Chinchou comes in, curious, closer and closer, until its light falls across the jar. It looks at the boy for a long time. Then it touches one lure to the glass, and the jar fills with light, soft and blue and steady. The boy holds it like something alive. "Three," he whispers.', flag('an32-glow'), room('an32-the-cure'))),
      ch('Shine a light back at it.', out('You hold up a lamp and cover and uncover it: on, off, on. Out in the water the Chinchou answers: on, off, on. It swims in to see who is talking, and lets its light pour into the jar like water into a cup. The boy holds the jar to his chest. "Three," he whispers.', flag('an32-glow'), room('an32-the-cure'))),
    ]),
  ev('an32-the-glow-again', 'Something That Glows', AN, { callback: true, requires: [flagIs('an32-coal'), age('an32-coal', 3), flagIs('an32-rolycoly-mined')], cast: ['trainer.pr/school_kid_m'], pokemon: 'chinchou', tint: '#101c34', effect: 'glint' },
    'Night on the shore below the stone town. Out in the black water, a pair of soft lights bobs in and out of the waves: a Chinchou, its lures glowing blue and gold, the only lamp for a mile. The boy has the jar, and the coal, cracked from the fight. His hands are shaking. "Last one," he says. "If this works, they wake up. If it doesn\'t, I start counting again."',
    [
      ch('Sit with it in the dark.', out('You sit on the wet sand and wait. The Chinchou comes in, curious, until its light falls across the jar. It looks at the boy for a long time. Then it touches one lure to the glass, and the jar fills with light, soft and blue and steady. "Three," he whispers.', flag('an32-glow'), room('an32-the-cure-again'))),
      ch('Shine a light back at it.', out('You cover and uncover a lamp: on, off, on. The Chinchou answers: on, off, on. It swims in to see who is talking, and lets its light pour into the jar like water into a cup. "Three," the boy whispers.', flag('an32-glow'), room('an32-the-cure-again'))),
    ]),
  ev('an32-the-cure', 'The Town Wakes', AN, { room: true, requires: [flagIs('an32-glow')], cast: ['trainer.pr/school_kid_m'], pokemon: 'rolycoly', tint: '#3a3428', effect: 'sparkle' },
    'Dawn in the stone square. The boy grinds the Rolycoly\'s coal cold, stirs in the salt, and pours in the light, and the jar begins to hum. The Rolycoly sits at the edge of the fountain, watching, its coal glowing very softly, unburned. "Maths," the boy says, voice cracking. "It\'s only maths." He dips a brush.',
    [
      ch('Paint the first statue.', out('He paints a stripe down the stone Lillipup. For one long second nothing happens. Then the grey cracks like an eggshell, and the Lillipup finishes its bark: three years late, very loud, very offended. It runs through the town like a crack through ice. Doors. Voices. Somebody\'s mother, calling a name. The boy sits down in the middle of it all and, for the first time in three years, stops counting. The Rolycoly rolls over to you and stays.',
        gain('rolycoly'), $(1500), flag('an32-town-woke'), moment('A town of statues woke up, because a boy never stopped counting and a Rolycoly was asked, not mined.', 70))),
    ]),
  ev('an32-the-cure-again', 'The Town Wakes', AN, { room: true, requires: [flagIs('an32-glow')], cast: ['trainer.pr/school_kid_m'], tint: '#3a3428', effect: 'none' },
    'Dawn in the stone square. The boy grinds the cracked coal, stirs in the salt, and pours in the light. He paints a stripe down the stone Lillipup. Nothing. A fizz, a puff of grey dust, and the stone stays stone. The boy stares at it. "It was angry coal," he says at last, very small. "I didn\'t put that in the sums."',
    [
      ch('Make it again.', out('You make it again, slowly, the whole day long: more salt, the light coaxed out of the jar a second time, the cracked coal ground finer and finer until there is no anger left in it. At dusk he paints the Lillipup, and the grey cracks like an eggshell, and it finishes its bark, three years late and very offended. The whole town wakes behind it, door by door. The boy sits in the middle of the noise and stops counting.',
        takeNode(), $(1500), flag('an32-town-woke'), moment('A town of statues woke up, on the second try, because a boy never stopped counting.', 60))),
      ch('Go back and apologise to the Rolycoly.', out('You climb back to the mine and sit in front of the Rolycoly for a long time, saying sorry the only way you can, which is by staying. In the end it rolls out of its seam and comes down to the square with you, and sheds one lump of coal, cold and calm, into the boy\'s hand. The cure works at once. The Lillipup finishes its bark. The town wakes. The Rolycoly stays at your heel.',
        takeNode(2), gain('rolycoly'), $(1500), flag('an32-town-woke'), flag('an32-rolycoly-forgave'), moment('A town of statues woke up, and a Rolycoly you once fought forgave you.', 65))),
    ]),

  // ---------------- AN33. The Fish Who Wanted Legs ----------------
  ev('an33-fish-legs', 'The Fish Who Wanted Legs', AN, { rarity: 'uncommon', minStage: stageOf('A3'), types: tagTypes('water'), cast: ['trainer.pr/preschooler_m'], pokemon: 'wishiwashi', tint: '#16304a', effect: 'float' },
    'A small boy sits on the harbour steps with a red bucket between his knees. In the bucket, going round and round, is a Wishiwashi, tiny and shining, with big wet eyes. "This is Pip," he says, very seriously. "She talks. Well. She sort of talks." Pip bobs up and blows a bubble at you that sounds almost like a word. "She wants to come on land. Her school wants her back. A huge one keeps flooding the town looking for her." He points, without looking, at the harbour wall. The sea is higher than it should be. It is lapping at the top step.',
    [
      ch('Take her back.', out('You walk down to the water with him. He holds the bucket for a long time before he tips it. Pip slides out into the sea, and the sea goes silver: a thousand Wishiwashi rising out of the deep, crowding together into one enormous shape, a fish as big as a house. It opens its great mouth, and Pip swims in, and it sinks away. The sea drops back down the steps, one by one. The boy holds the empty bucket against his chest and does not cry until it is gone.',
        flag('fish-back'), flag('an33-chose'), later('an33-empty-bucket', 5))),
      ch('Let her stay.', out('"She can stay," you tell him, and his whole face opens. Pip turns three happy circles in the bucket. Behind you the sea climbs one more step, then another. Rain comes in off the water. Somewhere out past the harbour wall, something enormous turns over, looking, and does not find her.',
        flag('fish-stay'), flag('an33-chose'), front('rain', 8), later('an33-high-water', 5))),
      ch('Ask her.', out('You kneel by the bucket and ask her, plainly: the sea, or the boy? Pip looks at the harbour. She looks at the boy. Then she swims to his side of the bucket and presses her face to the plastic, right where his hand is. She has chosen. "Her school\'s leader won\'t like it," the boy whispers. "It\'s a Bruxish. It doesn\'t like anything."',
        flag('fish-asked'), flag('an33-chose'), later('an33-the-leader', 5))),
    ]),
  ev('an33-empty-bucket', 'The Empty Bucket', AN, { room: true, requires: [flagIs('fish-back')], cast: ['trainer.pr/preschooler_m'], tint: '#16304a', effect: 'none' },
    'The boy is on the harbour steps again, with the red bucket, empty. The sea is exactly as high as it should be. He has filled the bucket with seawater anyway, just in case. "She can\'t talk to me now," he says. "She\'s too far. I keep listening."',
    [
      ch('Sit with him.', out('You sit with him and listen to the sea. After a long time, far out, a little patch of water goes silver, and stays silver, and goes away. "That was her," he says. You do not argue. "That was her saying hello."', flag('an33-sat-with-boy'), flag('an33-farewell-due'), later('an33-a-bigger-bucket', 5))),
      ch('Teach him to whistle for her.', out('You teach him to whistle, two fingers and a lot of spit. It takes most of an afternoon. When he finally gets it, a high, clear note goes out over the harbour, and out past the wall, a thousand silver backs turn at once, just for a moment. He whistles until his lips give out.', flag('an33-whistle'), flag('an33-farewell-due'), fr(2), later('an33-a-bigger-bucket', 5))),
    ]),
  ev('an33-high-water', 'High Water', AN, { room: true, requires: [flagIs('fish-stay')], cast: ['trainer.pr/preschooler_m'], pokemon: 'wishiwashi', tint: '#0e2438', effect: 'rain' },
    'The sea has come into town. It is only ankle deep, but it is in the bakery and the Pokémon Center and the boy\'s kitchen, and you have spent the whole morning bailing it out with everyone else. Out in the harbour the huge one rises: a fish the size of a house, made of a thousand silver fish, every eye of it searching. Pip has gone very quiet in her bucket. The boy is holding the bucket so tight his knuckles are white.',
    [
      ch('Take her back.', out('The boy does it himself in the end. He wades out to his knees and tips the bucket, and Pip swims to the great silver shape, and into its mouth, and it sinks away. The sea goes back down the street, out of the bakery, out of his kitchen. He walks home dripping, with the empty bucket, and you walk with him.', flag('fish-back'), flag('an33-farewell-due'), takeNode(), later('an33-a-bigger-bucket', 5))),
      ch('Ask her.', out('You kneel in the floodwater by the bucket and ask her: the sea, or the boy? Pip presses her face to the plastic, right where his hand is. She has chosen. Out in the harbour, the huge shape breaks apart into a thousand fish, and one of them, bigger, toothier and very cross, comes swimming in alone: the school\'s leader.', flag('fish-asked'), takeNode(), room('an33-the-leader'))),
    ]),
  ev('an33-the-leader', 'The School\'s Leader', AN, { room: true, requires: [flagIs('fish-asked')], cast: ['trainer.pr/preschooler_m'], pokemon: 'bruxish', tint: '#16304a', effect: 'float',
    remembers: [
      { id: 'stranding', when: [flagIs('stranding-peaceful')], notice: 'The Bruxish stops. It looks at you for a long moment. The sea remembers who helped the stranded ones back into the water, gently, without a single blow. It does not bare its teeth. It is listening.',
        addChoices: [ch('Speak to it.', out('You tell it plainly: she chose. You do not have to persuade it with a fight. It already trusts you. The Bruxish looks at Pip in her bucket for a long time, then clicks its teeth, once, quietly, the way an old fish says yes. It swims back out to the school. The sea goes down, and stays down.', flag('an33-leader-persuaded'), flag('an33-farewell-due'), fr(3), later('an33-a-bigger-bucket', 5)))] },
    ] },
    'In the shallows by the harbour steps a Bruxish surfaces, bright as a painted kite and twice as angry, gnashing teeth that click like a bag of pebbles. It is the school\'s leader, and it has come for Pip. Pip hides behind the boy\'s hand. The boy stands in front of the bucket with his arms out, shaking. "She chose," he says. "She chose."',
    [
      ch('Persuade it.', fight('You step down into the water beside the boy. The Bruxish\'s eyes flash. It will listen to someone who can stand up to it.', monDuel('The School\'s Leader', 'bruxish', 0, {
        win: [flag('an33-leader-persuaded'), flag('an33-farewell-due'), later('an33-a-bigger-bucket', 5)],
        lose: [flag('an33-leader-persuaded'), flag('an33-leader-lost'), flag('an33-farewell-due'), later('an33-a-bigger-bucket', 5)] }))),
    ]),
  ev('an33-a-bigger-bucket', 'A Bigger Bucket', AN, { room: true, requires: [flagIs('an33-farewell-due')], cast: ['trainer.pr/preschooler_m'], pokemon: 'wishiwashi', tint: '#16304a', effect: 'sparkle',
    remembers: [
      { id: 'came-back', when: [flagIs('fish-back')], notice: 'Pip is not in a bucket. She is in the sea, right at the bottom of the steps, with the whole silver school behind her, and she has come back to visit. She blows a bubble at the boy that sounds exactly like his name.' },
      { id: 'stayed', when: [flagIs('fish-asked')], notice: 'Pip is in a bigger bucket now: a proper tub, painted red, with a pebble in the bottom and a view of the sea. The Bruxish passes by the harbour wall every evening, to check. The boy waves to it. It does not wave back. It does slow down.' },
    ] },
    'The harbour, in the evening. The boy is sitting on the steps with his feet in the water, and Pip is with him. The boy sees you and jumps up. "She wants to give you something," he says. "She\'s been saying it all day. Well. Sort of saying it."',
    [
      ch('Ask her to come with you.', out('You ask her, just to see. Pip looks at your team, at the road, at all the land in the world. Then she swims back to the boy, every time. She never does choose you. But she blows one long bubble out to sea, and a second, smaller Wishiwashi comes swimming up out of the deep: her sister, bright-eyed and curious, and she pushes her gently towards your hands.',
        gain('wishiwashi'), flag('an33-sibling'), flag('reunion-guest-fish-boy'), moment('A Wishiwashi who wanted legs chose a small boy, and gave you her sister.', 60))),
      ch('Tell her she has already given enough.', out('"You don\'t have to give me anything," you say. Pip blows a bubble that sounds a great deal like "Too bad," and a second, smaller Wishiwashi comes swimming up out of the deep: her sister, bright-eyed and curious, pushed gently towards your hands. The boy grins. "She always does what she wants."',
        gain('wishiwashi'), flag('an33-sibling'), flag('reunion-guest-fish-boy'), fr(2), moment('A Wishiwashi who wanted legs chose a small boy, and gave you her sister.', 60))),
    ]),

  // ---------------- AN34. The Walls ----------------
  ev('an34-the-walls', 'The Walls', AN, { rarity: 'rare', minStage: stageOf('A9'), types: tagTypes('city', 'cave'), cast: ['trainer.pr/veteran_m'], pokemon: 'stonjourner', tint: '#2a2620', effect: 'fog' },
    'A ring of standing stones around a town, each one taller than a house, grey and mossed and silent. The town lives inside them like an egg in a nest. Every morning, the townspeople walk the ring and count, and every morning one stone has moved. A guard leans on his spear by the gate, which has not been opened in his lifetime. "The stones protect us. We don\'t know from what. Nobody\'s been outside in sixty years." He lowers his voice. "Last night one moved inward."',
    [
      ch('Watch at night.', out('You sit up on the town wall with the guard and a flask of something hot. Midnight. Nothing. Then a sound like a mountain clearing its throat. The stones walk. Every one of them unfolds, slow and enormous: Stonjourner, a whole ring of them, turning to face outward. Beyond them, in the moonlight, something big and copper-green is pushing at the edge of the fields. The guard drops his flask. "Sixty years," he whispers. "They\'ve been awake the whole time."',
        flag('walls-watched'), later('an34-midnight', 5))),
      ch('Go outside.', out('You walk out between two stones at dawn while the guard shouts after you. Outside there are meadows. A stream. A road, overgrown. Wildflowers, and a Skwovet burying something, and nothing else for miles. Nothing at all. You stand there for a long time. The town has been afraid of nothing for sixty years. And now you know, and they do not, and you have to decide what to do with that.',
        flag('walls-outside'), later('an34-the-truth', 5))),
      ch('Ask the stones.', out('You walk up to the stone that moved and put your hand on it. It is warm. You ask it why. Slowly, so slowly you think you imagined it, one great eye opens in the rock, the colour of old moss. It looks at you. It does not want to be thanked. It wants a reason to keep standing there.',
        flag('walls-asked'), later('an34-a-reason', 5))),
    ]),
  ev('an34-midnight', 'Midnight at the Walls', AN, { room: true, requires: [flagIs('walls-watched')], cast: ['trainer.pr/veteran_m'], pokemon: 'copperajah', tint: '#1c2024', effect: 'shake' },
    'Another midnight on the wall. Now you know what you are watching. A herd of Copperajah, great copper trunks swinging, are leaning on the line of Stonjourner, trying to reach the town\'s fields of beans. The stones hold. They have held for sixty years. But one of them, the oldest, the one that moved inward, is slipping. Its feet are dragging furrows in the earth. It is tired.',
    [
      ch('Stand with the stones.', fight('You climb down off the wall and put yourself beside the oldest stone. It looks down at you, surprised. The lead Copperajah lowers its trunk.', beast({ species: ['copperajah'], lv: 1, win: [flag('an34-held-the-line'), flag('an34-step-two'), later('an34-last-stone', 5)] }, { lose: [flag('an34-held-the-line'), flag('an34-step-two'), later('an34-last-stone', 5)] }))),
      ch('Lead the herd to the river.', out('You go out past the stones with a sack of the town\'s beans and lay a trail, bean by bean, down to the river a mile off, where the grass is long and nobody has planted anything. It takes the whole night. The herd follows, grumbling, and stays. At dawn the oldest stone settles back into its place with a sound like a long sigh.', flag('an34-led-the-herd'), flag('an34-step-two'), takeNode(), later('an34-last-stone', 5))),
    ]),
  ev('an34-the-truth', 'What Is Outside', AN, { room: true, requires: [flagIs('walls-outside')], cast: ['trainer.pr/veteran_m'], pokemon: 'stonjourner', tint: '#2a2620', effect: 'fog' },
    'You come back in through the stones with grass seed on your boots and a wildflower in your pocket. The guard looks at the flower as if it were a weapon. People are gathering. They want to know what is out there. They have wanted to know for sixty years, and been too afraid to ask. The stones stand round you all, very still. You think one of them is listening.',
    [
      ch('Tell them.', out('You tell them. Meadows. A stream. A road. A Skwovet. Nothing. Nothing at all. Nobody speaks for a long moment. Then an old woman starts to cry, and a child starts to laugh, and the guard puts down his spear for the first time in his life and goes to look at the gate. He does not open it. Not yet. But he oils the hinges.', flag('an34-told'), flag('an34-step-two'), later('an34-last-stone', 5))),
      ch('Keep it to yourself.', out('You tell them it is quiet out there, which is true, and leave it at that. They nod, relieved, and go back to their safe, small streets. That night you lie awake knowing a thing nobody else knows. One of the stones, the old one that moved inward, turns its head a little towards your window.', flag('an34-kept-quiet'), flag('an34-step-two'), later('an34-last-stone', 5))),
    ]),
  ev('an34-a-reason', 'A Reason to Stand', AN, { room: true, requires: [flagIs('walls-asked')], pokemon: 'stonjourner', tint: '#2a2620', effect: 'fog' },
    'You go back to the stone that opened its eye. It opens it again, at once, as if it had been waiting all day. Up close you can see the weather of sixty years on it: moss, cracks, a bird\'s nest in a crevice it has not had the heart to move. It wants a reason. It is very tired, and very patient, and it is asking you.',
    [
      ch('Because they would be afraid without you.', out('It considers this a long time. Behind you, in the town, a child is singing. The stone closes its eye. It does not move outward. It does not move inward. It stays. But the next morning, it is a little closer to your camp.', flag('an34-reason-fear'), flag('an34-step-two'), later('an34-last-stone', 5))),
      ch('Because you keep something out.', out('You show it the Copperajah tracks in the mud, beyond the ring. It knows. It has always known. The eye opens wider, as if surprised that anyone else had noticed what it does. It straightens, slowly, with a grinding like a millstone, and stands taller than before.', flag('an34-reason-keep-out'), flag('an34-step-two'), later('an34-last-stone', 5))),
      ch('You don\'t have to keep standing.', out('The eye goes very wide. Nobody has said that to it in sixty years. For a long time it does not move at all. Then, slowly, its shoulders drop, one great stone shrug, and it looks, for the first time, not at the outside, but at you.', flag('an34-reason-free'), flag('an34-step-two'), fr(3), later('an34-last-stone', 5))),
    ]),
  ev('an34-last-stone', 'The Stone That Moved', AN, { room: true, requires: [flagIs('an34-step-two')], cast: ['trainer.pr/veteran_m'], pokemon: 'stonjourner', tint: '#3a3428', effect: 'sparkle',
    remembers: [
      { id: 'gate-open', when: [flagIs('an34-told')], notice: 'The gate is propped open this morning with a bucket. Children are standing in it, daring each other to step through. Out past the ring, two of the younger stones have turned, very slowly, to look at the hills they came from.' },
      { id: 'free', when: [flagIs('an34-reason-free')], notice: 'It remembers what you said: that it did not have to keep standing. It has thought about it all this time. It has decided that it would like to walk.' },
    ] },
    'Morning. The town walks the ring and counts, and one stone has moved again: the old one. It has moved all the way across the town in the night, through the square, past the fountain, and it is standing outside your camp, moss and nest and all, waiting. The guard comes running, then stops. "Well," he says, after a long time. "I suppose it\'s chosen."',
    [
      ch('Take it with you.', out('It unfolds, enormous, and the bird in its nest does not even wake. It follows you to the edge of town, and when you reach the stones it stops, and looks back at the ring, at the gap it is leaving. The other Stonjourner shuffle round, one by one, and close it. It does not need to stand there any more. It walks out of the ring with you.',
        gain('stonjourner'), flag('an34-stone-joined'), moment('The oldest of the standing stones walked out of the ring and came with you.', 70))),
      ch('Ask it if it is sure.', out('It looks at the town for a long moment: the walls, the fields, the children. Then it looks at you, and sets one great foot down beside yours, which is as close to yes as stone gets. The others close the gap behind it. It walks out of the ring with you, the bird still asleep in its nest.',
        gain('stonjourner'), flag('an34-stone-joined'), fr(2), moment('The oldest of the standing stones walked out of the ring and came with you.', 70))),
    ]),

  // ---------------- AN35. The Cook of the Dungeon (a Door: ps_an35_dungeon) ----------------
  ev('an35-cook-of-the-dungeon', 'The Cook of the Dungeon', AN, { rarity: 'uncommon', minStage: stageOf('A3'), types: tagTypes('cave'), cast: ['trainer.pr/baker'], tint: '#1c2422', effect: 'fog' },
    'A crack in the hillside, and steps going down into the dark, worn smooth by a great many boots. From somewhere far below comes the smell of woodsmoke, the clank of a very large pot, and voices: four of them, arguing, cheerfully, about whether something is edible. One voice says "fish" a great deal. Another keeps saying "no".',
    [
      ch('Go down.', out('You start down the steps. The air turns cool and damp, and the smell of cooking gets stronger, and so does the arguing.', room('an35-dungeon-stair'))),
      ch('Walk on.', leave('You leave the steps to whoever is down there. Behind you, faintly, someone shouts, "IT\'S A FISH," and someone else shouts, "IT\'S A GUEST."')),
    ]),
  ev('an35-dungeon-stair', 'The Wet Stair', AN, { room: true, pokemon: 'foongus', tint: '#1c2422', effect: 'fog' },
    'The stair winds down past walls that sweat and glitter. Mushrooms grow out of every crack: brown and grey, pink and yellow, and one patch of pale blue ones that smell sweet as sugar. A Foongus pretends to be one of them, badly. Below, firelight that is not firelight: a cooking fire has gone out, and someone is trying to relight it with language.',
    [
      ch('Follow the voices.', out('You follow the voices down. The Foongus watches you go, still pretending.', room('an35-flooded-camp'))),
      ch('Pick a few mushrooms on the way.', out('You fill your pockets with the brown and grey ones, the ones that smell of earth and nothing else, and leave the sweet blue ones well alone. The Foongus seems relieved. Then you follow the voices down.', item('big-mushroom'), room('an35-flooded-camp'))),
    ]),
  ev('an35-flooded-camp', 'The Camp in the Flooded Chamber', AN, { room: true, stop: 'rest', cast: ['trainer.black_belt_m', 'trainer.pr/baker', 'trainer.psychic_m'], pokemon: 'dondozo', tint: '#1e2a2a', effect: 'none',
    remembers: [
      { id: 'sulky', when: [flagIs('three-tatsugiri-done')], notice: 'The Tatsugiri in the Dondozo\'s mouth stops waving. It is the sulky one, from the three Tatsugiri. It knows you. It turns its back at once and pretends very hard that it does not.' },
    ] },
    'A flooded chamber. A dead fire. Four adventurers and a cooking pot the size of a shield. In the water, filling half the room, a Dondozo, listening with great interest. "It\'s a fish," says the fighter, Eben, broad as a door. "Fish are food." The cook, Senna-Lai, a tall woman with a ladle on her belt like a sword, does not look up. "It\'s a fish with a friend in its mouth." The Dondozo opens up. A Tatsugiri waves. The mage, Sylvan-Osei, does not lift his eyes from his book: "The friend\'s the brains. If you eat the fish, the friend\'ll have opinions." The fourth, very small, in a very large helmet: "I\'m hungry." Everyone looks at you.',
    [
      ch('Absolutely not.', out('"I\'m only saying," Eben mutters, sulking magnificently. "Big fish." The Dondozo slides over through the water and lays its enormous chin on the bank beside you, with a sound like a boat being moored. It is grateful. It is also very, very heavy. You sit there, pinned and warm, while Senna-Lai gets the fire going, and everybody rests a while.',
        flag('an35-not-the-fish'), heal(0.5), fr(2), room('an35-flooded-floor'))),
      ch('Make a stew from the dungeon\'s mushrooms.', out('Senna-Lai\'s head comes up like a hound\'s. "Now that," she says, "is a cook\'s answer." She hands you the ladle as if knighting you.', flag('an35-stew'), room('an35-the-stew'))),
      ch('Ask Dondozo.', out('You walk to the edge of the water and ask. The Tatsugiri climbs out onto the Dondozo\'s lip, folds its fins, and negotiates. It is a mime, and you read it: food, it says, rubbing its belly, and then a long swoop of one fin over the water, a ride. Senna-Lai tips the whole pot of dry rations into the Dondozo\'s mouth. "Deal," she says.',
        flag('an35-asked-dondozo'), room('an35-the-ride'))),
    ]),
  ev('an35-the-stew', 'The Stew', AN, { room: true, stop: 'rest', cast: ['trainer.pr/baker', 'trainer.black_belt_m'], pokemon: 'dondozo', tint: '#2a2418', effect: 'fire' },
    'The fire is lit. The pot is on. On a flat stone Senna-Lai lays out the dungeon\'s mushrooms in five colours: brown and grey, which smell of earth; pink and yellow, which make your nose fizz; and the pale blue, which smells sweet as sugar and makes your nose go numb. "Two are fine, two are funny, one\'s a bad idea," she says. "Smell it. Then wait. If your nose is still there, it goes in the pot."',
    [
      ch('The brown and the grey.', out('Earth and woodsmoke and something like bread. The stew is good, so good that the little one in the helmet eats three bowls and falls asleep in the fourth. The Dondozo eats most of it. Everybody eats. Everybody sleeps, warm, the water lapping. In the morning you cross the flooded floor together, wading, singing.',
        flag('an35-stew-good'), heal(1), rest(), room('an35-far-shore'))),
      ch('The pink and the yellow.', out('The stew is delicious, and the moment you swallow it your voice goes up an octave. So does everybody\'s. Eben sounds like a kettle. The mage refuses to speak at all, and writes notes instead, crossly. The Dondozo, which does not speak, is delighted. Everyone rests, giggling, and in the morning you wade the flooded floor together, squeaking.',
        flag('an35-stew-funny'), heal(1), rest(), room('an35-far-shore'))),
      ch('The pale blue one.', out('It smells wonderful. Senna-Lai leans over the pot, sniffs once, and waits. Then she tips the whole lot into the water without a word. "No. Again." You start again. It takes most of the night. It cannot go wrong; it can only take longer. The second pot is brown and grey and good, and the Dondozo eats most of it, and in the morning you wade the flooded floor together, very tired.',
        flag('an35-stew-again'), takeNode(), heal(1), rest(), room('an35-far-shore'))),
      ch('Smell it. Then wait.', out('You do it her way. Smell. Wait. Your nose stays where it is for the brown and the grey, fizzes for the pink, goes numb for the blue. Into the pot go the right ones. Senna-Lai tastes it and says nothing, which from her is a medal. The Dondozo eats most of it. Everybody sleeps, warm. In the morning you wade the flooded floor together.',
        flag('an35-stew-good'), heal(1), rest(), fr(3), room('an35-far-shore')),
        { prompt: { id: 'pitch-hold', needs: 'good' }, fail: out('You do it her way, nearly. Your nose fizzes and you decide that is fine. It is not quite fine: the stew is delicious and everybody\'s voice goes up an octave. Eben sounds like a kettle. The mage refuses to speak at all. Everyone rests, giggling, and in the morning you wade the flooded floor together, squeaking.',
          flag('an35-stew-funny'), heal(1), rest(), room('an35-far-shore')) }),
    ]),
  ev('an35-flooded-floor', 'The Flooded Floor', AN, { room: true, cast: ['trainer.black_belt_m', 'trainer.pr/baker'], pokemon: 'barraskewda', tint: '#14242e', effect: 'float' },
    'Beyond the camp the dungeon floor is under water, waist deep and black, all the way to a far shore you can barely see. Something long and silver flicks past your knees. The adventurers have packed up and are coming with you. Eben holds his sword over his head. The little one in the helmet is riding on Senna-Lai\'s shoulders. Behind you, the Dondozo watches, chin on the bank, looking almost sorry for you.',
    [
      ch('Wade across.', out('You wade. It is cold and slow and something nips at your ankles twice, but Senna-Lai keeps up a steady stream of recipes the whole way, loudly, and the silver things keep their distance from the noise. You climb out on the far shore, dripping and laughing.', flag('an35-waded'), room('an35-far-shore'))),
      ch('Fight what lives in the water.', fight('The silver thing comes back for a third pass and you meet it head on, waist deep, with Eben roaring encouragement from behind.', beast({ species: ['barraskewda'], win: [flag('an35-waded'), room('an35-far-shore')] }, { pseudo: true, lose: [flag('an35-waded'), room('an35-far-shore')] }))),
    ]),
  ev('an35-far-shore', 'The Far Shore', AN, { room: true, cast: ['trainer.pr/baker', 'trainer.black_belt_m', 'trainer.psychic_m'], pokemon: 'tatsugiri', tint: '#1e2a2a', effect: 'sparkle',
    remembers: [
      { id: 'sulky', when: [flagIs('three-tatsugiri-done')], notice: 'It is the sulky one, the one you met with its two siblings. It recognises you. It pretends it does not, so hard that it walks into a rock.' },
    ] },
    'The far shore, and a way up into daylight. The adventurers are wringing out their socks. Then the water stirs behind you: the Dondozo has swum all the way across, and on its lip sits the Tatsugiri, looking at you very steadily. It hops down onto the shore. It points at you. It points at itself. It points at the road.',
    [
      ch('Welcome it along.', out('It asks to come, and you say yes. It looks back once at the Dondozo, but the Dondozo already has another friend in its mouth: there is a queue, it turns out, three Tatsugiri deep. Senna-Lai kisses the top of its head. "Feed it well," she says. "It\'ll tell you if you don\'t." The four of them wave you off into the sun, still arguing about lunch.',
        gain('tatsugiri'), flag('an35-tatsugiri'), flag('reunion-guest-dungeon-party'), moment('You shared a camp, a stew and a very large fish with four adventurers in a flooded dungeon.', 60))),
    ]),
  ev('an35-the-ride', 'Riding the Dondozo', AN, { room: true, cast: ['trainer.pr/baker', 'trainer.black_belt_m', 'trainer.psychic_m'], pokemon: 'dondozo', tint: '#1e2a2a', effect: 'float',
    remembers: [
      { id: 'sulky', when: [flagIs('three-tatsugiri-done')], notice: 'It is the sulky one, the one you met with its two siblings. It recognises you. It pretends it does not, so hard that it nearly falls off the Dondozo.' },
    ] },
    'The Dondozo carries everyone across the dungeon\'s flooded floor: you, your team, four adventurers, a cooking pot the size of a shield. The adventurers come too, shrieking. Eben shrieks loudest. The black water rushes past, the far shore comes up fast, and the whole wet middle of the dungeon goes by underneath you. On the far shore the Tatsugiri hops off the Dondozo\'s lip and points at you, then at itself, then at the road.',
    [
      ch('Welcome it along.', out('It asks to come, and you say yes. It looks back once at the Dondozo, but the Dondozo already has another friend in its mouth: there is a queue, three Tatsugiri deep. Senna-Lai kisses the top of its head. "Feed it well," she says. The four of them wave you off into the sun, still damp, still arguing about lunch.',
        gain('tatsugiri'), flag('an35-tatsugiri'), flag('reunion-guest-dungeon-party'), moment('You rode a Dondozo across a flooded dungeon with four shrieking adventurers.', 60))),
    ]),

  // ---------------- AN36. The Prince and the Shadow ----------------
  ev('an36-prince-and-shadow', 'The Prince and the Shadow', AN, { rarity: 'rare', minStage: stageOf('A5'), types: tagTypes('eerie'), cast: ['trainer.pr/rich_kid_m', 'trainer.pr/rich_m'], pokemon: 'duskull', tint: '#1e1a2a', effect: 'flicker' },
    'A palace courtyard at dusk, and a court in fine clothes laughing behind its hands. In the middle of them stands a small prince who cannot hear the laughing, and can see it perfectly well. Behind him, in his own shadow, floats a Duskull. It is his only friend. When the court turns away, the prince looks at you, the only stranger there, and his hands move, quick and careful: "Everyone thinks I\'m weak." Behind him, a little clumsily, the Duskull signs it too. It learned. It learned for him.',
    [
      ch('Sign back.', out('You do not know how. You try anyway, badly, and his whole face changes. He takes your hands and shapes them, patient as a teacher: hello, friend, strong, again, thank you. Five signs. You get "friend" wrong four times and he laughs, a real laugh, silent and enormous. The Duskull signs "again" at you, very firmly, until you get it right.',
        flag('prince-signs'), flag('an36-met'), fr(3), later('an36-first-fight', 5))),
      ch('Battle with him.', fight('He understands at once, and his eyes light up like a lamp. He is fast, and clever, and he will not give up. The court goes quiet to watch, and does not laugh again.', duel('Prince Aurelian', { cls: 'youngster', size: 2, team: ['duskull', 'murkrow'],
        win: [flag('prince-battle'), flag('an36-met'), later('an36-first-fight', 5)] }, { lose: [flag('prince-battle'), flag('an36-met'), flag('an36-prince-won'), later('an36-first-fight', 5)] }))),
      ch('Teach him a move.', out('You show him a dodge: the half-step, the drop of the shoulder, the moment of waiting when everyone else would move. He cannot hear you count it out, so you tap it on his arm instead: one, two, now. He gets it on the ninth try. The Duskull, watching, gets it on the tenth. Neither of them stops grinning for an hour.',
        flag('prince-taught'), flag('an36-met'), later('an36-first-fight', 5))),
    ]),
  ev('an36-first-fight', 'His First Real Fight', AN, { room: true, requires: [flagIs('an36-met')], cast: ['trainer.pr/rich_kid_m', 'trainer.pr/rich_m'], pokemon: 'duskull', tint: '#1e1a2a', effect: 'none',
    remembers: [
      { id: 'signs', when: [flagIs('prince-signs')], notice: 'He sees you and signs at once, fast and glad, and this time you understand him: "Friend. Again." The whole of this meeting is in sign. You find you can follow most of it.' },
      { id: 'taught', when: [flagIs('prince-taught')], notice: 'As he steps into the ring he catches your eye and taps his own arm: one, two, now.', hide: [0],
        addChoices: [ch('Watch for the dodge.', out('The court\'s champion charges. The prince waits, when everyone else would move. One, two, now: the half-step, the drop of the shoulder, and the Duskull slides aside in the same breath, and the champion\'s Pokémon goes straight past them into the wall. The prince wins his first real fight with the move you taught him. The court is silent. Then, slowly, somebody starts to clap.', flag('an36-won-first-fight'), flag('an36-fought'), fr(3), later('an36-kitchens', 5)))] },
      { id: 'battled', when: [flagIs('prince-battle')], notice: 'Nobody laughs when he walks into the ring. They remember the battle with you: how fast he was, how clever, how he never once gave up.' },
    ] },
    'Weeks on, the palace again. A cousin of the prince, older and broad and pleased with himself, the court\'s own champion, has challenged him in front of everyone, in the courtyard, to finish the joke for good. The prince stands very straight. The Duskull is so close behind him it is almost inside his shadow. The court is already smiling.',
    [
      ch('Stand at the ring\'s edge where he can see you.', out('You stand where he can see you. He looks at you once, and then does not need to again. He is fast and clever and he does not give up: the champion wins the first exchange, the second, and the prince keeps getting up, and the Duskull keeps getting up, until the champion is the one who is tired. The prince wins. The court does not laugh.', flag('an36-won-first-fight'), flag('an36-fought'), fr(2), later('an36-kitchens', 5))),
      ch('Fight beside him.', fight('You step into the ring at his side. The champion laughs, and calls for a second Pokémon. The prince taps your arm once: ready.', duel('The Court\'s Champion', { cls: 'veteran', size: 2, types: ['steel', 'fighting'],
        win: [flag('an36-won-first-fight'), flag('an36-fought'), later('an36-kitchens', 5)] }, { lose: [flag('an36-fought'), later('an36-kitchens', 5)] }))),
    ]),
  ev('an36-kitchens', 'The Palace Kitchens', AN, { room: true, requires: [flagIs('an36-fought')], cast: ['trainer.pr/rich_kid_m'], pokemon: 'morpeko', tint: '#2a2018', effect: 'sparkle',
    remembers: [
      { id: 'signs', when: [flagIs('prince-signs')], notice: 'He signs the whole way down the kitchen stairs, and you answer, and the cooks stop to watch the two of you talking with your hands, and nobody laughs. This meeting, too, is all in sign.',
        addChoices: [ch('Thank him in sign.', out('Thank you, you sign: one of the five he taught you, the first time you have got it right on the first try. He signs it back. Then the Duskull signs it too, and then, to everyone\'s astonishment, the Morpeko tries, with both paws and a mouthful of bread. It comes with you. The prince waves until you cannot see him, and his shadow waves with him.',
          gain('morpeko'), flag('an36-morpeko'), fr(3), moment('A small prince who cannot hear taught you five signs, and gave you a Morpeko from the palace kitchens.', 65)))] },
    ] },
    'A long time later, the prince sends for you, and he takes you down, not up: past the throne room, down the servants\' stairs, into the palace kitchens, hot and loud and smelling of bread. A Morpeko is sitting on a sack of flour eating a roll it has certainly stolen. The prince picks it up, flour and all, and holds it out to you, very formally. Behind him, the Duskull bows.',
    [
      ch('Thank him.', out('You thank him, and he understands, because you mean it with your whole face. The Morpeko looks at you, at the roll, and decides you will do. It comes with you. As you leave, the cooks are calling the prince by name and he is laughing at something none of them said out loud, and his shadow is laughing with him.',
        gain('morpeko'), flag('an36-morpeko'), moment('A small prince who cannot hear gave you a Morpeko from the palace kitchens, in thanks.', 60))),
    ]),
];

export const CHECKED: Record<string, string> = {
  AN28: '2026-11-15',
  AN29: '2026-11-15',
  AN30: '2026-11-15',
  AN31: '2026-11-15',
  AN32: '2026-11-15',
  AN33: '2026-11-15',
  AN34: '2026-11-15',
  AN35: '2026-11-15',
  AN36: '2026-11-15',
};

export const REMOVE: string[] = [];
