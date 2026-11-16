// Anime questlines, module 2: AN10, AN12-AN18. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AN10 Formation                    (Tournament: a Single at the Town node; script: QUESTLINES_ANIME_INSPIRED.md "AN10")
//   AN12 The Paper City               (Door)
//   AN13 The Ice Library              (Door)
//   AN14 The Thousand Lanterns        (Stage-Three)
//   AN15 The Mushroom Queen           (Door)
//   AN16 The Ember Pilgrim            (Region)
//   AN17 The Hundred-Year Egg         (Companion: an egg)
//   AN18 The Friend You Didn't Make   (Trial-shaped, three stages)
// Build: npm run co:build -- anime-2
import { $, anyType, ch, ev, fight, flag, flagIs, fr, has, heal, isGood, item, leave, lose, money, out, relic, room, takeNode, type Json } from '../dsl.ts';
import { AN, age, beast, bondLine, gain, knows, later, line, monDuel, moment, notYet, seen, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AN10: 'an10-formation',
  AN12: 'an12-paper-city',
  AN13: 'an13-ice-library',
  AN14: 'an14-thousand-lanterns',
  AN15: 'an15-mushroom-queen',
  AN16: 'an16-ember-pilgrim',
  AN17: 'an17-hundred-year-egg',
  AN18: 'an18-friend-you-didnt-make',
};

export const PLACEMENT: Record<string, Place> = {
  'an10-formation': { shape: 'Tournament', earliest: 'A3', home: 12, sits: 'optional', attaches: 'town', tags: ['fighting'], note: 'The Town node; else Step 12. Fighting stages. The drills, the match and the little one\'s turn are rooms in the same node.' },
  'an12-paper-city': { shape: 'Door', earliest: 'A5', home: 13, window: [11, 15], sits: 'optional', tags: ['city'], note: 'Door: the rooms are the chain pseudo-stage ps_an12_paper_city (src/data/catalogOverhaul/pseudo/anime-2.json). "Find the folder" is two rooms (the doc\'s two nodes).' },
  'an13-ice-library': { shape: 'Door', earliest: 'A5', home: 13, window: [11, 15], sits: 'optional', tags: ['snow'], note: 'Door: the rooms are the chain pseudo-stage ps_an13_ice_library (src/data/catalogOverhaul/pseudo/anime-2.json).' },
  'an14-thousand-lanterns': { shape: 'Stage-Three', earliest: 'A4', home: 6, window: [4, 8], sits: 'optional', tags: ['night'], beats: ['an14-the-guardian', 'an14-lantern-night'], note: 'Steps 6, 12, 17. Night; the header reads Festival. "Come down." walks three nodes of rooftops (rooms one node apart) before the second beat.' },
  'an15-mushroom-queen': { shape: 'Door', earliest: 'A4', home: 12, window: [10, 14], sits: 'optional', tags: ['cave', 'forest'], note: 'Door: the rooms are the chain pseudo-stage ps_an15_mushroom_queen (src/data/catalogOverhaul/pseudo/anime-2.json). The deep-floor fight is A+0.' },
  'an16-ember-pilgrim': { shape: 'Region', earliest: 'A4', home: 'Stages 2, 5, 8', sits: 'optional', tags: ['hot'], beats: ['an16-halfway', 'an16-regions-end'], note: 'The meeting at a region\'s Stage 2; the pilgrim again three stages on (Stage 5); the region\'s end three more on (Stage 8). One lantern check on each stage between (an16-wind, an16-rain, an16-cold-night, an16-crossing); an16-cold-lantern the stage after it goes out; an16-slower (Stage 5) if the player said no.' },
  'an17-hundred-year-egg': { shape: 'Companion', earliest: 'A2', home: 'The Town node: a village shrine', sits: 'optional', attaches: 'town', tags: [], beats: ['an17-in-the-bag', 'an17-the-hatching', 'an17-first-steps', 'an17-the-cushion'], note: 'Companion (an egg). "Leave it be." comes back a stage later (an17-nearest-the-door). The hatching is the turning point, two stages after the egg is taken (Step 13, must-see). After it, small scenes come as Togepi\'s Bond rises.' },
  'an18-friend-you-didnt-make': { shape: 'Trial', earliest: 'A3', home: 'S, S+1, S+2', sits: 'optional', attaches: 'rest', tags: [], beats: ['an18-second-morning', 'an18-third-morning'], note: 'Hidden. A chest at the edge of the + node (rest), three stages running.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AN10: [
    'The reward Falinks "switches leader each battle (+1 Speed to the first Pokémon sent out)": built as a run relic, the Formation Whistle, that gives your side a Tailwind for the first two turns of every battle (the game has no "+1 Speed to whoever goes out first" effect). It comes with the Falinks and stays even if the Falinks leaves the party.',
    'Remembers "the coach is one of those kids, grown up": a run is too short for a child to grow up, so one of the Little League kids (event little-league) has stepped up to coach the squad for the day.',
  ],
};

LIMITS.AN12 = [
  '"A puzzle: three streets rebuilt": each street is a short skill check (tilt, aim, drag) in its own room of the Door, not a folding puzzle. A missed check leaves the street crooked but standing.',
  '"Keep the rain off" with "a Sun move": the sun choice needs a party Pokémon that knows Sunny Day (abilities that bring sun do not count). Without it you can still save the clock tower and lose one street, as every year.',
  'Remembers "completed The Paper Crane (Kartana)" reads flag paper-crane-done, which the thread that builds U6 The Paper Crane must set.',
];

LIMITS.AN13 = [
  'Remembers "if ice.own_book and a past run exists (Save): the book is the player\'s last run, and thawing it lets the player change one Save flag from that run (an amends)" is not built: nothing crosses runs. The book you find is this run\'s, frozen up to this morning; you can read it but not change it. That path\'s reward is the Bergmite, like the others (the amends is the part that is cut).',
  'Afterstory "the library is quieter in later runs" is not built (nothing crosses runs).',
  'Remembers "the Frostbound Alpha (A3) was warmed" reads flag frost-warmed (pack flag frost.warmed), which the legends thread must set when it builds A3\'s "Keep it warm." choice; today\'s story-alpha-frostbound has no such choice.',
];

LIMITS.AN14 = [
  'The "three-node escape across rooftops" is three rooms, one on each of the next three nodes, each with a short skill check; a missed check slows the escape but never stops it.',
  'Remembers "The Lantern Sea (Part 9) was done" reads flag lantern-sea-visited, which the greenneedle thread must set when it builds The Lantern Sea (gn.new.36).',
  'Afterstory "in later runs there is one more lantern on the river" is not built (nothing crosses runs).',
];

LIMITS.AN15 = [
  'The "small trust game" is a hold-still skill check while the Toedscool climbs onto your hat; a miss only means it takes longer.',
  'The reward recipe ("rest-node buff") is two portions of a new item, The Queen\'s Mushroom Stew, used from the map (heals the whole team by half and restores all PP); the game has no buff tied to rest nodes.',
  'Remembers "a Fire- or Grass-type uses Sunny Day": the tribute needs a party Pokémon that knows Sunny Day and a Fire- or Grass-type in the party; the game does not check that they are the same Pokémon. "Safe passage for the whole dungeon" is the Queen\'s road: the rest of the Door has no fight.',
  'Remembers "won the Cooking Circuit" reads flag cooking-circuit-won, which the thread that builds SF22 The Cooking Circuit must set.',
  'Afterstory "the adventurers are in the Road Roster later, better fed": they are not added to the Road Roster; a flag (an15-adventurers-fed) and a Chronicle line record it.',
];

LIMITS.AN16 = [
  '"For a region" is counted in stages: the halfway meeting three stages after the meeting and the region\'s end three stages after that, with one lantern check on each stage between. When the meeting is not on the region\'s Stage 2, the end can fall early in the next region.',
  'Remembers "the player\'s highest-Bond Fire-type relights it": the player picks one of their Fire-types to relight it (the game does not pick the highest Bond for you). It gains Bond, and the flame is "partly its" as a flag the ending reads.',
  'Remembers "carried Moltres\'s ember (L2)" reads flag birds-trial-moltres (pack flag birds.trial.moltres, a passed trial), which the legends thread must set; a failed Moltres trial does not count.',
];

LIMITS.AN17 = [
  '"It warms if the Kindness Ledger is high": read as the Kindness meter (good side) at 10 or more.',
  '"Sing to it." ("a sound move") needs a party Pokémon that knows a sound move; you pick which one sings.',
  'The egg is a story egg, not the game\'s Egg item: Togepi joins at the hatching scene, two stages after you take the egg. Before it hatches the small scene comes by stage; after it, by Togepi\'s Bond.',
  'Remembers "Misty\'s Togepi Paradise (AQ44) was done" reads flag aq44-paradise-done, which the batch that builds AQ44 must set at the end of that story.',
  'Afterstory "the cushion is empty in later runs; the keeper keeps it anyway" is not built across runs; the last small scene of this run visits the empty cushion instead.',
];

LIMITS.AN18 = [
  'The chest appears once per stage (one rest stop on each of three stages running), not at every + node of those stages.',
  'The doc marks it Hidden: it is placed like any event stop; the placement note carries "Hidden" for the placer.',
  'Remembers "the player gave away money in the Kindness Ledger this run" reads flag kind-gave-money, which the thread that owns the Kindness Ledger must set. "It starts closer" counts as one coin already left, so two coins of your own are enough.',
];

export const CHECKED: Record<string, string> = { AN10: '2026-11-15', AN12: '2026-11-15', AN13: '2026-11-15', AN14: '2026-11-15', AN15: '2026-11-15', AN16: '2026-11-15', AN17: '2026-11-15', AN18: '2026-11-15' };

const FIGHT = tagTypes('fighting');
const CITY = tagTypes('city');
const PAPER = { pokemon: 'flittle', tint: '#2e2c26' };
const SNOW = tagTypes('snow');
/** AN14's tag is Night: no stage type. */
const NIGHT: string[] = [];
const DUNGEON = tagTypes('cave', 'forest');
const MUSH = { cast: ['trainer.pr/backpacker_m', 'trainer.pr/waiter_f'], pokemon: 'toedscool', tint: '#1e2418' };
const HOT = tagTypes('hot');
const EMBER = { cast: ['trainer.pr/ruin_maniac'], pokemon: 'charcadet', tint: '#2a1a10' };
const SHRINE = { cast: ['trainer.pr/veteran_m'], tint: '#2a2418' };
const CHEST = { cast: [], pokemon: 'gimmighoul', tint: '#2a2410', effect: 'glint' };
const LANTERN = { pokemon: 'chinchou', tint: '#141a30', effect: 'sparkle' };
const ICE = { cast: ['trainer.pr/snow_worker_f'], pokemon: 'eiscue', tint: '#1a2a3a', effect: 'snow' };
const WHISTLE = relic('formation-whistle', 'The Formation Whistle', [{ kind: 'battleStart', tailwind: true, turns: 2 }]);

export const EVENTS: Json[] = [
  // ---------------- AN10. Formation ----------------
  ev('an10-formation', 'Formation', AN, { rarity: 'uncommon', minStage: stageOf('A3'), types: FIGHT, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#3a2a1a', effect: 'shake',
    remembers: [{ id: 'little-league', when: [seen('little-league')], notice: 'The coach is barely taller than the Falinks. You know her: one of the Little League kids you coached, in a tracksuit three sizes too big. "Coach! Their real coach is sick, so I\'m coach today." She stands very straight. She has grown up a lot since that school yard, all at once.' }] },
    'A dusty practice ground behind the town\'s battle hall. Six Falinks stand in a line, nose to tail, helmets shining. The one at the front is bellowing, and there is no mistaking what it means: "Formation! FORMATION!" The smallest one, at the very back, trips over its own feet and takes two others down with it. The coach picks them up one at a time, gently, the way you set skittles back up. "They lost every match this year. Every single one." She nods at the little one, who is pretending to look at a cloud. "He can jump higher than any of them. He\'s afraid of being in front."',
    [
      ch('Train them.', out('The coach blinks, then hands you her whistle as if it were heavy. "Three drills. I never had the heart to run them." The leader stamps. The little one at the back stamps a beat late, and looks at his feet.', flag('an10-trained'), room('an10-drill-call'))),
      ch('Put the little one in front.', out('Every Falinks turns its head at once. The leader makes a sound like a kettle. The little one tries to hide behind the others, but there are only five of them and he is the sixth. You walk him to the front of the line, one small step at a time. He is shaking.', flag('an10-little-front'), room('an10-little-one-front'))),
      ch('Watch a match.', out('"Stay for the evening match, then. You\'ll see." The coach does not say what you will see. She says it like someone who has stopped expecting anyone to look.', flag('an10-watched'), room('an10-the-match'))),
    ]),
  ev('an10-drill-call', 'Drill One: The Call', AN, { room: true, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#3a2a1a', effect: 'shake' },
    'The first drill is the oldest one. You call, they answer. One voice, one stamp, six helmets turning together like a door swinging shut. The leader is ready before you open your mouth. The little one at the back is watching your lips, very hard, trying to be on time.',
    [
      ch('Call the beat.', out('You call. They answer. You call faster; they answer faster. On the tenth call the little one lands it exactly with the others, and for one beat there is only one sound on the whole ground. He looks up, astonished, as if he had heard himself for the first time.', flag('an10-drill-call-clean'), fr(2), room('an10-drill-switch')),
        { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out('It comes back ragged: five stamps and a sixth, late, every time. But it comes back. The leader glares down the line. You put a hand on the little one\'s helmet. "Late is still there," you tell him. "We go again tomorrow."', room('an10-drill-switch')) }),
    ]),
  ev('an10-drill-switch', 'Drill Two: Change the Leader', AN, { room: true, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#3a2a1a', effect: 'shake' },
    'The second drill is the one they hate. On your clap the front Falinks peels off to the back, and the next one steps up and leads. The leader does not like going to the back. Nobody has asked the little one whether he likes coming forward, because nobody has ever got that far down the line.',
    [
      ch('Clap the changes.', out('Clap: the leader goes to the back, grumbling. Clap: the second leads. Clap, clap, clap. Then it is the little one\'s turn at the front, and he freezes, and the whole line bumps into him. But he is in front for one whole clap before he scurries back. The coach writes something in her notebook and underlines it twice.', flag('an10-drill-switch-clean'), fr(2), room('an10-drill-bout')),
        { prompt: { id: 'copycat-claps', needs: 'ok' }, fail: out('The changes come out in a heap: two leaders at once, then none. The leader ends up at the front again by habit, and looks relieved about it. But every Falinks has been at the front once now, even if only by accident. That is more than this season managed.', room('an10-drill-bout')) }),
    ]),
  ev('an10-drill-bout', 'Drill Three: The Bout', AN, { room: true, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#3a2a1a', effect: 'shake' },
    'The last drill is a practice bout. The squad lines up across the ground from your team, helmets down, and for the first time today the leader is not shouting. He is listening for the little one\'s stamp at the back. "Go easy," the coach says. Then, after a moment: "No. Don\'t."',
    [
      ch('Spar with the whole line.', fight('Six helmets come at you in a wedge, and the wedge holds.', monDuel('The Falinks Squad', 'falinks', 0, { win: [flag('an10-bout-won'), room('an10-formation-improved')], lose: [flag('an10-bout-lost'), room('an10-formation-improved')] }))),
      ch('Let them spar each other.', out('You split the line in two, three and three, and let them go at it. It is chaos, then less chaos. By the end the two halves are calling the changes to each other across the ground, and nobody is falling over.', fr(2), room('an10-formation-improved'))),
    ]),
  ev('an10-formation-improved', 'A Better Line', AN, { room: true, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#3a2a1a', effect: 'sparkle' },
    'The sun goes down over the practice ground. The squad stands in a line that is straight for the first time all year. The second Falinks, the one who changed places quickest in every drill, keeps looking at the road past the town. The coach sees it too. "That one learned the most. It wants to see how other teams line up." She pauses. "Take it, if it wants. We\'ll manage with five. We\'ll manage better than we did with six."',
    [
      ch('Take Number Two along.', out('Number Two marches over and falls in behind your feet as if you were the front of a line. The coach hands you her whistle for good. "Blow it before a fight. Whoever goes out first, the rest of them will be right behind." Behind you five Falinks stamp once, all together, to say goodbye.', gain('falinks', { bond: 10 }), WHISTLE, flag('an10-falinks-joined'), moment('You drilled a losing Falinks squad until their line held.', 60))),
      ch('Leave the squad whole.', out('"Six is a team," you say. Number Two looks at the road a long time, then back at the line, and steps into its place. The coach presses a black belt into your hands, frayed at one end. "It was mine. I stopped wearing it the year we started losing." The squad stamps you out of town.', item('black-belt'), fr(3), flag('an10-squad-whole'))),
    ]),
  ev('an10-little-one-front', 'He Spikes It', AN, { room: true, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#3a2a1a', effect: 'confetti' },
    'The coach throws a practice ball high over the line. It is too high for the leader. It is too high for any of them. The little one at the front looks up, and something in him forgets to be afraid. He jumps. He jumps higher than the hall roof, it seems, higher than the cloud he was pretending to watch, and he spikes the ball into the dirt so hard it bounces back over the fence. He lands. The other five stare. The old leader stares longest of all.',
    [
      ch('Take the old leader along.', out('The squad re-forms with the little one in front. The old leader stands at the back, alone, not sure where to look. The coach sighs. "He has led so long he never learned to follow. Take him on the road. Teach him the back of a line is not the end of it." He falls in behind you, stiffly, and by the edge of town he is stamping in time with your steps. The coach gives you her whistle.', gain('falinks', { bond: 5 }), WHISTLE, flag('an10-falinks-joined'), flag('an10-old-leader'), moment('The little Falinks jumped higher than the hall roof, and led.', 65))),
      ch('Leave them to find it.', out('You step back. The old leader walks slowly to the back of the line, and stands there. Then he stamps, once, a beat early, for the little one. The little one stamps back. The coach is crying a bit and pretending she isn\'t. She unties the frayed black belt from her waist and presses it into your hands. "I stopped wearing it the year we started losing. I think I can stop now for a better reason."', item('black-belt'), fr(3), flag('an10-squad-whole'))),
    ]),
  ev('an10-the-match', 'Nobody Saw', AN, { room: true, cast: ['trainer.pr/ace_trainer_f'], pokemon: 'falinks', tint: '#2a2030', effect: 'shake' },
    'They lose. Of course they lose: the other team is bigger and quicker, and the leader shouts every move before he makes it. In the last second, with the match already gone, a hit comes in at the leader\'s blind side. The little one at the back leaps over all five of his squad, takes it on his helmet, and drops back into line before he lands. The buzzer goes. The crowd is looking at the scoreboard. The coach is looking at her shoes. You are the only one who saw.',
    [
      ch('Tell the little one.', out('You find him behind the hall, alone, helmet dented. "I saw," you say. "Over all five of them. I saw it." He stares at you. Then he stands up very straight, and when you walk to the road he walks with you, a small helmet at your heel. The coach watches him go and hands you her whistle. "He was always going to need someone who saw."', gain('falinks', { bond: 15 }), WHISTLE, flag('an10-falinks-joined'), flag('an10-seen-it'), moment('You were the only one who saw the little Falinks leap over his whole squad.', 65))),
      ch('Tell the coach.', out('She listens with her whole face. "Over all five?" She goes straight to the little one and kneels in the dust in front of him, and moves him to the front of the line for tomorrow. He looks at you over her shoulder, and stamps once. She presses her old black belt into your hands. "For having eyes."', item('black-belt'), fr(3), flag('an10-squad-whole'), flag('an10-seen-it'))),
    ]),

  // ---------------- AN12. The Paper City (Door) ----------------
  ev('an12-paper-city', 'The Paper City', AN, { rarity: 'rare', minStage: stageOf('A5'), types: CITY, ...PAPER, effect: 'float' },
    'Past the last streetlight the road turns white. A whole city stands there, folded out of paper: houses with creased roofs, a clock tower with a paper bell, bridges that flex when the wind walks over them. Flittle bob between the chimneys like dropped petals. Low grey clouds are rolling in from the hills. A paper figure in a mayor\'s sash, its corners gone soft from years of handling, bows to you. "It rains tonight. Every year we lose a street." It looks down at its own folded hands. "The folder who made us is gone. We don\'t know how to make more of ourselves."',
    [
      ch('I\'ll fold.', out('The mayor unfolds a little, which is how paper gasps. "You know how?" You don\'t, really. It leads you to the oldest street, where the houses lean on each other like tired people, and gives you a stack of clean sheets. "Lamp Street first. It\'s always the first to go."', flag('an12-folding'), room('an12-fold-lamp-street'))),
      ch('Find the folder.', out('"She went out along the paper road, years ago, and the road stopped where she stopped." The mayor points to a white path running off into real green hills. "It\'s two days for us. Paper walks slowly." It folds its hands again. "Please hurry. The clouds don\'t."', flag('an12-seeking'), room('an12-paper-road'))),
      ch('Keep the rain off.', out('"Nobody has ever tried that." The mayor turns its flat face up to the clouds, which are very low now, and very full. "We just fold ourselves small and hope it\'s someone else\'s street." It leads you up the clock tower, to the roof, where the first drops are already darkening the paper.', flag('an12-sky'), room('an12-the-rain'))),
      ch('Not tonight.', leave('The mayor bows again, very low, the way you bow to someone you will not see again. Behind you, as you go, the first drops fall, and somewhere in the white city a street begins, softly, to fold in on itself.')),
    ]),
  ev('an12-fold-lamp-street', 'Lamp Street', AN, { room: true, ...PAPER, effect: 'float' },
    'Lamp Street is six houses and a lamp post, all soft at the corners. A Flittle family lives in the third house; they watch you through a paper window as you kneel on the cobbles with your first clean sheet. The mayor stands behind you and says nothing, the way you stand behind someone learning to ride.',
    [
      ch('Fold the houses square.', out('Valley fold, mountain fold, crease it with your thumbnail. Your first house is a little lopsided; your sixth is good. The lamp post goes up last, and when you set it in place the paper bulb glows, faintly, from somewhere inside. The Flittle family come out and touch the new walls with their little feet. "One," the mayor whispers.', flag('an12-street-strong'), room('an12-fold-bridge-street')),
        { prompt: { id: 'tilt-drag', needs: 'ok' }, fail: out('Your corners will not meet. The houses come out leaning, all six of them, like a row of people trying to hear something. But they stand, and they are dry inside, and the Flittle family move back in without a word of complaint. "One," the mayor says anyway.', room('an12-fold-bridge-street')) }),
    ]),
  ev('an12-fold-bridge-street', 'Bridge Street', AN, { room: true, ...PAPER, effect: 'float' },
    'Bridge Street is not a street so much as a bridge that people live on, a paper arch over a paper stream. It has to bend in the wind without tearing. The first rain is spotting the clouds\' edges. The mayor holds the end of your sheet so the wind cannot take it.',
    [
      ch('Fold the arch.', out('You find the trick halfway: the bridge must be folded loose, not tight, so it can breathe. When you are done it sways in the wind and does not tear. A Flittle lands on the rail and rides it up and down, delighted, like a child on a swing. "Two," says the mayor, and its voice has a crease in it.', flag('an12-street-strong'), room('an12-fold-market-street')),
        { prompt: { id: 'aim-drag', needs: 'ok' }, fail: out('You fold it too tight, and it creaks when the wind goes over. But it holds. It will need a hand next year. "Two," says the mayor, and pats the rail as if it were a nervous animal.', room('an12-fold-market-street')) }),
    ]),
  ev('an12-fold-market-street', 'Market Street', AN, { room: true, ...PAPER, effect: 'rain' },
    'The rain begins as you reach the market. Stalls of paper fruit, a paper fishmonger, awnings already starting to sag. Paper people are folding themselves small in doorways, the way the mayor said. Your sheets are going soft in your hands. One street left, and the sky is falling on it one drop at a time.',
    [
      ch('Fold fast.', out('You fold the awnings double, the way the bridge taught you, so the water runs off. Stall after stall. Your fingers are numb and full of paper cuts. When you look up, the whole market is dry under its new roofs, and the paper people are coming out of the doorways one by one to look at it. "Three," the mayor says. "Three streets. In one night." It sits down on the kerb, as if its folds had given out.', flag('an12-street-strong'), room('an12-the-key')),
        { prompt: { id: 'balloon-drag', needs: 'ok' }, fail: out('Two stalls go soft before you can reach them. You save the rest, and the fishmonger, and the awning over the old couple who sell paper bread. The mayor kneels by the two lost stalls and smooths their wet paper flat, carefully, to keep. "Three streets," it says. "Three. We have never kept three."', room('an12-the-key')) }),
    ]),
  ev('an12-paper-road', 'The Paper Road', AN, { room: true, cast: [], pokemon: 'rellor', tint: '#2e2c26', effect: 'none' },
    'The paper road runs out of the city and into real hills, white against the green, and gets thinner as it goes. Halfway along you meet a Rellor rolling a ball of old paper scraps uphill, the way a Rellor rolls everything. The scraps are folded: tiny cranes, a tiny house, half a tiny bridge. It is the kind of thing somebody does with their hands when they cannot stop.',
    [
      ch('Follow the Rellor.', out('It does not mind being followed. It rolls its paper ball past the end of the paper road, through a gate, up to a cottage with a wet garden and a lit window. It leaves the ball on the step, like a cat with a mouse, and waits.', flag('an12-road-walked'), room('an12-the-folder'))),
    ]),
  ev('an12-the-folder', 'The Folder', AN, { room: true, cast: ['trainer.pr/expert_pokemon_breeder'], pokemon: 'rellor', tint: '#2e2c26', effect: 'none',
    remembers: [{ id: 'paper-crane', when: [flagIs('paper-crane-done')], notice: 'On the mantel is a photograph of a child sitting in a forest of paper trees, with paper cuts on every finger. "My grandchild," she says. "Folds for something sharp that lives in the woods. Got it from me, the folding." She looks at you. "You\'ve met. I can tell. You hold your hands the same careful way."' }] },
    'An old woman opens the door before you knock. Every surface of her cottage is covered in half-finished things: a crane with one wing, a house with no roof, a whole street that stops in the middle. Her hands are knotted and swollen at the knuckles, and she holds them close to her chest as if they were cold. "They sent someone. Good." She smiles, and it costs her. "I made them, you know. Every one. Then my hands stopped, and I could not bear to go back and watch them come apart."',
    [
      ch('Learn from her.', out('She cannot fold, but she can still see a fold before it is made. She sits you at her table and talks you through it, one crease at a time: "Mountain. No, the other mountain. Thumbnail. There." By midnight you have folded a house that would make the mayor weep. "Go," she says. "Go back and give them my hands."', flag('an12-taught'), room('an12-fold-with-her'))),
      ch('Ask her to come back with you.', out('She is quiet a long time. Then she puts on her coat, very slowly, one sleeve and then the other, and you walk back down the paper road together at paper speed. The Rellor rolls its ball beside her the whole way. When the city sees who is coming, every Flittle in it rises at once.', flag('an12-taught'), flag('an12-folder-came'), room('an12-fold-with-her'))),
    ]),
  ev('an12-fold-with-her', 'Her Hands, Your Hands', AN, { room: true, cast: ['trainer.pr/expert_pokemon_breeder'], ...PAPER, effect: 'rain' },
    'The rain is starting over the paper city. You kneel on the cobbles of Lamp Street with a stack of clean sheets, and in your head, or beside you, a dry old voice says: "Mountain. Valley. Loose for the bridge, so it can breathe. Double for the awnings, so the water runs off." Three streets, one night. Your hands know more than they did this morning.',
    [
      ch('Fold the three streets.', out('Lamp Street, square and true. Bridge Street, loose enough to sway. Market Street, double-roofed against the rain. You fold until your fingers bleed a little and then you fold some more. When you stand up, the whole city is dry, and three of its streets are new. The paper people stand in the rain and do not fold themselves small.', flag('an12-street-strong', 3), room('an12-the-key')),
        { prompt: { id: 'tilt-drag', needs: 'ok' }, fail: out('Not every fold comes out the way she said it. Lamp Street leans, and one stall in the market goes soft before you reach it. But Bridge Street sways and holds, and the rest of the market stays dry, and in the end the city is standing. "Good enough," says the dry old voice. "Better than mine, at the end."', flag('an12-street-strong'), room('an12-the-key')) }),
    ]),
  ev('an12-the-key', 'The Key to the City', AN, { room: true, cast: [], ...PAPER, effect: 'sparkle',
    remembers: [{ id: 'folder-came', when: [flagIs('an12-folder-came')], notice: 'The old woman sits on a bench in the square with a blanket on her knees, and every paper person in the city comes to stand near her for a moment before going home. The mayor kneels at her feet. She puts one knotted hand on its paper head and leaves it there.' }] },
    'Morning. The rain has gone over the hills. The paper city is wet at the edges and whole in the middle, and the mayor comes to you with something folded very small in its hands. It unfolds it, and unfolds it, and unfolds it, and it is a key, cut from a single sheet with no seams at all. "It doesn\'t open anything," it says. "It means you can come in. That\'s what keys are." A Flittle floats down onto your shoulder, carrying its own little paper house like a snail.',
    [
      ch('Take the Flittle and the key.', out('The Flittle settles its paper house on your pack and climbs in. It will fold itself a new one, the mayor says, wherever you stop. "Come back before it rains," the mayor says. "Or come back when it does. Either way." The whole city waves you down the white road, flat hands lifting in the wind.', gain('flittle', { bond: 10 }), item('paper-city-key'), flag('an12-key'), moment('You rebuilt the Paper City\'s streets before the rain, and it gave you its key.', 65))),
      ch('Leave the Flittle its house.', out('"It has a street now," you say. "Let it live on it." The Flittle bobs, and floats back to its house, and rings its paper doorbell twice for you. The mayor presses the key into your palm and closes your fingers round it, carefully, the way you would fold something you wanted to keep.', item('paper-city-key'), fr(3), flag('an12-key'))),
    ]),
  ev('an12-the-rain', 'Rain Dance in Reverse', AN, { room: true, cast: [], ...PAPER, effect: 'rain' },
    'From the clock tower roof the whole paper city lies under you, and the clouds lie on top of it. The first drops are already making grey coins on the paper tiles. Down in the streets, the paper people are folding themselves small in doorways. "Every year," the mayor says beside you, "we stand up here and choose which street to cry for." The bell above you is going soft.',
    [
      ch('Call the sun.', out('Your Pokémon looks up and calls the sun, the way other Pokémon call rain, but backwards: and the clouds, astonished, open. A hot white hole tears through them right over the city. The rain falls all around, on the hills, on the paper road, and not one drop on the city. It lasts until the clouds give up and go. "One more year," the mayor whispers. "We have one more year, and nobody had to choose." A Flittle lands on your hand. In its feet is a key, folded from a single sheet.', gain('flittle', { bond: 10 }), item('paper-city-key'), flag('an12-sun-held'), flag('an12-key'), moment('You held the rain off the Paper City with a borrowed sun.', 65)), { requires: [knows('sunny-day')] }),
      ch('Save the clock tower.', out('Without a sun to call, you do the only thing you can: you hold your coat over the bell, and your team stands round the tower with their backs to the rain. The tower stays dry. Lamp Street does not. In the morning the mayor smooths the wet paper of six little houses flat, to keep. A Flittle whose house was on Lamp Street floats up to you and sits on your hat, and will not leave. The mayor gives you the key, folded from one sheet. "It means you can come in," it says. "Come back. Bring a sun."', gain('flittle', { bond: 5 }), item('paper-city-key'), flag('an12-street-lost'), flag('an12-key'))),
    ]),

  // ---------------- AN13. The Ice Library (Door) ----------------
  ev('an13-ice-library', 'The Ice Library', AN, { rarity: 'rare', minStage: stageOf('A5'), types: SNOW, ...ICE,
    remembers: [{ id: 'frost-warmed', when: [flagIs('frost-warmed')], notice: 'Somewhere at the back a steady drip is falling into a bucket. "The glacier is melting at the east edge," the librarian says, very low. "Since the great frost dragon on the pass woke up warm. I am glad for it. I am frightened for the books."' }] },
    'A library carved into a glacier. Shelves of blue ice run back into the dark further than your lamp can reach, and every book on them is frozen in its own clear block, like a leaf in a winter pond. An Eiscue sits at the front desk with a pair of tiny spectacles balanced on its ice face. It looks at you over them. "Shh." A librarian steps out from the stacks in three cardigans and fingerless gloves. "The books are frozen so the stories stop," she whispers. "If one thaws, it keeps going. Someone in it keeps living." She glances at a woman sitting by the stove with a block of ice in her lap. "She came yesterday. She wants to thaw the book about her husband."',
    [
      ch('Let her.', out('The librarian looks at you a long moment, then nods, as if you had signed something. She takes the block from the woman\'s lap with both hands and sets it on the warm edge of the stove. The Eiscue turns round on its chair so it does not have to watch.', flag('ice-thawed-other'), room('an13-the-thaw'))),
      ch('Read it frozen first.', out('"You can, if the light is right." The librarian carries the block to the one lamp that burns white instead of yellow, and holds it up. "Through the ice you can only read the last page. The page where it stopped." The woman stands, and comes to look too.', flag('ice-read-frozen'), room('an13-through-the-ice'))),
      ch('Whose stories are these?', out('The librarian takes off her spectacles and cleans them on a cardigan, slowly, the way people do when they are deciding how much to say. Then she takes your lamp, and walks you into the stacks.', flag('ice-own-book'), room('an13-the-stacks'))),
      ch('Leave quietly.', leave('You back out the way you came. The Eiscue watches you all the way to the door. "Shh," it says, kindly, as if you were the one making the noise. Behind you, the woman by the stove has not moved.')),
    ]),
  ev('an13-the-thaw', 'The Next Page', AN, { room: true, ...ICE, effect: 'none' },
    'The ice goes cloudy, then clear, then wet. It runs off the stove in little hissing threads. Inside, the book\'s cover darkens as the cold goes out of it. The woman sits with her hands folded so tight her knuckles are white. When the last of the block slides away, the librarian dries the cover with her sleeve and puts it in the woman\'s lap. "It will keep going now," she says. "It cannot stop again." The woman opens it to the next page, and reads. Then she begins to cry. And then she laughs, through it, because it is a happy page: wherever he is, he has planted the garden he always talked about, and the beans are coming up crooked.',
    [
      ch('Sit with her.', out('You sit down on the other side of the stove and say nothing. She reads you the page about the beans, twice. She reads you the next one too, where he burns his toast. At the desk, the Eiscue sniffs once, very loudly, and then looks round as if someone else had done it.', fr(3), flag('an13-sat-with-her'), room('an13-bergmite'))),
      ch('Give her the quiet.', out('You step back among the shelves and let her have it. From between two frozen books you hear her turning pages, slowly, then faster. Once she says his name out loud. The librarian, passing, touches your arm. "That was the right thing," she whispers. "That is nearly always the right thing, here."', fr(2), room('an13-bergmite'))),
    ]),
  ev('an13-through-the-ice', 'Where It Stops', AN, { room: true, ...ICE, effect: 'glint' },
    'You hold the block up to the white lamp. The light goes into the ice and bends, and there, through it, you can read the last page. He is sitting on a porch step in the evening, laughing at something a Pokémon has done, his head thrown right back. The sentence ends in the middle of the laugh. The story stops there. He is happy where it stops. The woman, beside you, has gone very still.',
    [
      ch('Tell her what you see.', out('You tell her: the porch, the evening, the laugh. She listens with her eyes shut. "He always laughed like that. With his whole neck." She is quiet a long time. Then she takes the block from you and carries it back to its shelf herself. "Let him keep laughing," she says. "I would only make him go on to the next thing."', fr(3), flag('an13-left-frozen'), room('an13-bergmite'))),
      ch('Let her look for herself.', out('You hand her the block. She holds it to the white lamp and finds the page, and you watch her find him. She laughs too, a small one, the same shape as his. Then she sets the block back on the shelf, and straightens it, and pats it twice. "Not yet," she tells it. "Not ever, maybe. You look happy there."', fr(3), flag('an13-left-frozen'), room('an13-bergmite'))),
    ]),
  ev('an13-the-stacks', 'Everyone Who Didn\'t Come Back', AN, { room: true, ...ICE, effect: 'fog' },
    'The aisles go back into the glacier until your lamp is the only warm thing for a mile. "Everyone who passed through the pass and didn\'t come back," the librarian says. "Every one of them has a book. The ice writes them." She stops at a shelf near the floor. One block there is not quite frozen. It is slush at the edges, still setting, and through it you can read the name on the spine. It is yours. "That one is still being written," she says gently. "One of them always is."',
    [
      ch('Read your own page.', out('You kneel and hold the lamp close. The last page is this morning. There is {starter}, and the road, and the cold, and you, walking up to a library in a glacier. There is everything you have done so far on this road, small and exact, in a hand you do not know. The sentence stops at the library door. "It will not freeze while you are still walking," the librarian says. "It is the walking that keeps it soft." You stand up. Your knees are cold. Your chest is not.', fr(3), flag('an13-read-own'), moment('In the Ice Library you found your own book, still soft, still being written.', 60), room('an13-bergmite'))),
      ch('Leave it on the shelf.', out('"I\'ll read it when it\'s finished," you say. The librarian smiles for the first time. "That is what everybody says. Hardly anybody means it." She lets you lead the way back, and you do not look behind you, and you are proud of that.', fr(2), room('an13-bergmite'))),
    ]),
  ev('an13-bergmite', 'A Small Block of Ice', AN, { room: true, ...ICE, pokemon: 'bergmite', effect: 'snow',
    remembers: [{ id: 'own-book', when: [flagIs('ice-own-book')], notice: 'It is the Bergmite that was sitting on your shelf, on top of your own soft book, keeping it cool. It looks at you as if it already knows how the story goes so far, and wants to see the rest.' }] },
    'On your way out, something hops off a shelf behind you and lands on the floor with a clink. A Bergmite: a small block of living ice with two bright eyes, the kind that lives in the stacks and mends the cracks in the shelves. It hops after you. It hops after you again. The librarian laughs under her breath. "It has been reading over people\'s shoulders for years. I think it wants a story that isn\'t frozen." At the front desk, the Eiscue looks up. "Shh," it says. Then it waves one flipper.',
    [
      ch('Let it come.', out('The Bergmite hops into your pack and settles down among your things with a little clink of contentment. The library door closes behind you, and the cold outside is only cold. You can feel the Bergmite, very faintly, turning a page of something in its head.', gain('bergmite', { bond: 10 }), flag('an13-bergmite'), moment('A Bergmite from the Ice Library came out to see a story that was not frozen.', 55))),
      ch('Send it back to its shelves.', out('"Somebody has to mend the cracks," you tell it. It thinks about that, and hops back to its shelf, and settles there on guard. The librarian presses something into your hand on the way out: a shard of the glacier that will not melt. "For the road," she whispers. "Shh," says the Eiscue.', item('nevermeltice'), fr(2))),
    ]),

  // ---------------- AN14. The Thousand Lanterns (Stage-Three) ----------------
  ev('an14-thousand-lanterns', 'The Thousand Lanterns', AN, { rarity: 'rare', minStage: stageOf('A4'), types: NIGHT, cast: ['trainer.pr/school_kid_f'], ...LANTERN },
    'A river town, on the one night of the year that matters. A thousand paper lanterns float on the black water, each with a candle inside, drifting down past the bridges in slow gold rows. Chinchou glow up from the shallows to meet them. Everyone in town is on the bank. Almost everyone. On a high rooftop above the river a girl sits hugging her knees, watching. "I watch every year," she says, when she sees you looking up. "I\'m not allowed down." She does not sound angry, only very practised. "My guardian says the town is dangerous. She says the lanterns are for other people." She rests her chin on her knees. "One day I\'ll float one."',
    [
      ch('Come down.', out('She stares at you as if you had suggested she fly. Then she looks down at the river, all that gold, and something in her face gives way. "The roofs go all the way to the water," she whispers. "If you don\'t take the street, nobody sees you." She stands up. Her hand is shaking. She holds it out anyway.', flag('an14-escape-begun'), later('an14-rooftop-1', 1))),
      ch('I\'ll float one for you.', out('You buy a lantern from the last stall still open, and the old man there gives you a brush. "Write who it\'s for." You write her name, the one she called down to you, and set it on the water. It drifts out. Then, against the whole current of the river, against a thousand others, it turns, and drifts back upstream, and bumps gently against the wall below her roof. She leans out over the edge and catches its light on her face. She does not say anything. She does not need to.', flag('lantern-floated'), later('an14-the-guardian', 5))),
      ch('Who is your guardian?', out('"She\'s old," the girl says. "She has a Mismagius. She brushes my hair every night and tells me the world is too big." She frowns, as if trying to remember something. "She\'s always been old. I\'ve always been this." A window opens below her, and someone in grey looks out at you.', flag('lantern-guardian'), room('an14-who-guardian'))),
    ]),
  ev('an14-rooftop-1', 'The First Gap', AN, { room: true, requires: [flagIs('an14-escape-begun')], cast: ['trainer.pr/school_kid_f'], ...LANTERN, effect: 'none' },
    'The first gap between roofs is wider than it looked from the ground. Below, the lane is full of people carrying lanterns down to the water, faces lit gold from underneath. The girl stands at the edge with her toes over nothing. "I\'ve never jumped anything," she says. "I\'ve never had anywhere to jump to."',
    [
      ch('Jump together.', out('You count three and go. She lands beside you on the far tiles, and laughs out loud, one bright surprised laugh that a whole lane of people hear and nobody looks up for. "Again," she says. "Can we do that again?" There are two more roofs. You can.', flag('an14-roof-1'), later('an14-rooftop-2', 1)),
        { prompt: { id: 'hurdle-rhythm', needs: 'ok' }, fail: out('She slips. You catch her wrist, and for one long second she hangs over the lane, and then she is up beside you, white and breathing hard. "I\'m all right," she says. "I\'m all right. I\'ve never been anything but all right. This is better." You go slower over the next one.', later('an14-rooftop-2', 1)) }),
    ]),
  ev('an14-rooftop-2', 'The Searching Lights', AN, { room: true, requires: [flagIs('an14-escape-begun')], cast: ['trainer.pr/school_kid_f'], pokemon: 'mismagius', tint: '#141a30', effect: 'flicker' },
    'Halfway to the river, small violet lights begin drifting over the roofs, slow and patient, looking. "Her Mismagius," the girl breathes. "She knows." The lights pass over a chimney, a washing line, the tiles you were standing on a moment ago. They are not angry. They are worried. That is worse.',
    [
      ch('Hide in the shadows.', out('You pull her down behind a chimney stack and the two of you lie flat while the violet lights drift over. One stops right above you, and hums, and moves on. When it has gone she is shaking, and also grinning. "Nobody has ever hidden me from her," she whispers. "She has always been the one hiding me."', flag('an14-roof-2'), later('an14-rooftop-3', 1)),
        { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('A light finds you. It hangs over the two of you a long moment, humming softly, and you are sure it will call out. It does not. It drifts on, slowly, as if it had chosen not to see. The girl watches it go. "She let us," she says, in a small voice. "Why would she let us?"', later('an14-rooftop-3', 1)) }),
    ]),
  ev('an14-rooftop-3', 'Her Own Lantern', AN, { room: true, requires: [flagIs('an14-escape-begun')], cast: ['trainer.pr/school_kid_f'], ...LANTERN, effect: 'sparkle' },
    'The last roof slopes all the way down to the river wall, and then there is only water and gold. The girl climbs down onto the stones and stands on the bank for the first time in her life. The stall is still open. The old man there takes one look at her face and gives her a lantern and a brush, and does not ask for money.',
    [
      ch('Let her float it.', out('She writes her own name on it, slowly, like someone signing for something. She sets it on the water. It drifts out among the thousand others, and keeps going, and does not come back, because it does not need to. She watches it until it is only one light among many. Then she turns to you. "I have to go back," she says. "She\'ll be alone. But I floated one." She is smiling and crying at once. "I floated one."', flag('lantern-escaped'), fr(3), moment('On the night of a thousand lanterns, a girl from a rooftop floated her own.', 60), later('an14-the-guardian', 5))),
    ]),
  ev('an14-who-guardian', 'The Woman at the Window', AN, { room: true, cast: ['trainer.pr/veteran_f'], pokemon: 'mismagius', tint: '#141a30', effect: 'flicker' },
    'The woman at the window is very old, with hair like frost and a Mismagius floating at her shoulder, its gems glowing faintly violet. She looks at you, and at the girl on the roof, and at the river of lanterns, and her mouth thins. Then the Mismagius drifts close to you and, without being asked, shows you something in its glow: the girl, on this same roof, sixty years ago. The same face. The same knees hugged. The same lanterns. The girl is much older than she looks.',
    [
      ch('Say nothing yet.', out('The woman closes the window. Up on the roof, the girl is watching the river and has seen none of it. The Mismagius stays a moment longer, looking at you, as if it were the one asking for help. Then it follows its mistress in. You will be further down the river when you see them again. You are sure of that.', flag('an14-saw-sixty-years'), later('an14-the-guardian', 5))),
      ch('Wave to the girl.', out('She waves back, delighted, with her whole arm, the way a much younger child waves. Below her the window closes softly. You walk on along the bank with the lanterns, and the violet light of the Mismagius follows you to the edge of town, and stops there, and watches.', fr(2), later('an14-the-guardian', 5))),
    ]),
  ev('an14-the-guardian', 'The Guardian', AN, { room: true, cast: ['trainer.pr/veteran_f'], pokemon: 'mismagius', tint: '#1e1430', effect: 'flicker',
    remembers: [
      { id: 'guardian', when: [flagIs('lantern-guardian')], notice: 'She knows you. "You asked about me," she says. "You saw what my Mismagius showed you. Sixty years." She does not look away. "Well. You came this far. Say it to my face."', addChoices: [ch('Confront her.', out('"You\'re keeping her young," you say. "You\'re keeping her small so she can never go down to the water." The Mismagius goes very still. The old woman closes her eyes. When she opens them, she does not argue.', flag('an14-confronted'), room('an14-the-choice')))] },
      { id: 'escaped', when: [flagIs('lantern-escaped')], notice: '"You took her across the roofs," she says. "My Mismagius watched you all the way. I told it to let you." Her hands are trembling. "She came home. She came home and slept like a stone, smiling. She has never once slept smiling."' },
      { id: 'floated', when: [flagIs('lantern-floated')], notice: '"You floated a lantern with her name on it," she says. "It came back up the river to her. Do you know what she has done since? She sits with it. She will not let me put it out."' },
    ] },
    'Further down the river, on another night, in another town, an old woman in grey is waiting for you at a crossroads, with a Mismagius floating at her shoulder like a lamp. She looks smaller out here, away from her house. "You were at the river," she says. "On lantern night. With my girl." The Mismagius drifts between you, its gems glowing violet and unsure.',
    [
      ch('Hear her out.', out('She sits down on a milestone, slowly, the way old people sit. "Let me tell you," she says, "before you decide what I am."', room('an14-her-reasons'))),
      ch('Walk away.', out('You step round her and walk on. She does not stop you. She only calls after you, quietly, "She talks about you," and then the Mismagius\'s light goes down the road behind you, back toward home.', flag('an14-walked-away'), later('an14-lantern-night', 5))),
    ]),
  ev('an14-her-reasons', 'Sixty Years', AN, { room: true, cast: ['trainer.pr/veteran_f'], pokemon: 'mismagius', tint: '#1e1430', effect: 'fog' },
    '"I found her on the riverbank on lantern night, sixty years ago. Somebody\'s lantern had gone out, and somebody\'s child was sitting beside it, alone." The old woman twists her hands together. "I was afraid the river would take her back. So I asked my Mismagius to keep her as she was. Small. Safe. Home." She looks up at you. "She is much older than she looks. And so am I, and I am tired, and I don\'t know how to stop."',
    [
      ch('Confront her.', out('"You\'re not keeping her safe," you say. "You\'re keeping her from the water." The old woman flinches, and then nods, slowly, as if you had told her the time. The Mismagius sinks lower in the air.', flag('lantern-guardian'), flag('an14-confronted'), room('an14-the-choice'))),
      ch('Leave it with them.', out('"It\'s not mine to decide," you say. She looks at you a long time. "No," she says. "No. It never was mine either." She gets up off the milestone and goes home, and the violet light goes with her.', flag('lantern-guardian'), flag('an14-left-be'), later('an14-lantern-night', 5))),
    ]),
  ev('an14-the-choice', 'Ask Her', AN, { room: true, cast: ['trainer.pr/veteran_f', 'trainer.pr/school_kid_f'], pokemon: 'mismagius', tint: '#1e1430', effect: 'flicker' },
    'The old woman stands up straight. "Then you choose," she says. "You, who walked in off the road. Let her grow old, like everyone, and leave me one day. Or let her stay with me as she is, safe, for always. Choose, and I will do it." The Mismagius waits. In the doorway behind her, you see the girl. She has followed you both, and she has heard every word.',
    [
      ch('Ask her.', out('You turn round. "What do you want?" you ask the girl. Nobody has ever asked her that. She looks at the old woman, and at you, and at the road going down toward the river. "I want to float my own lantern," she says. "And next year I want to be taller. And I want you to be there," she tells the old woman, "when I am." The old woman makes a sound like a door opening after a long winter. The Mismagius lets go of something it has held for sixty years, and the girl, very slightly, changes.', flag('an14-girl-chose'), fr(5), moment('You did not choose for the girl on the roof. You asked her.', 70), later('an14-lantern-night', 5))),
    ]),
  ev('an14-lantern-night', 'Her Lantern', AN, { room: true, cast: ['trainer.pr/school_kid_f'], ...LANTERN, effect: 'sparkle',
    remembers: [
      { id: 'lantern-sea', when: [flagIs('lantern-sea-visited')], notice: 'The lantern does not stop at the town. It goes on downriver, out past the last bridge, to the same bay where the Chinchou and Lanturn light the water from below. You have stood on that shore. A Lanturn rises in the shallows and turns to follow it, lighting its way out to sea.' },
      { id: 'girl-chose', when: [flagIs('an14-girl-chose')], notice: 'She is on the bank this time, with the whole town. She is a finger taller than she was. The old woman stands beside her in grey, holding her coat, and when the girl sets her lantern on the water the old woman holds her other hand.' },
      { id: 'left-be', when: [flagIs('an14-left-be')], notice: 'Up on a roof, back upstream, a small figure is still hugging her knees. But the lantern on the water is hers. Somebody carried it down to the river for her, in grey, slowly.' },
    ] },
    'Months down the road, another river, another lantern night: the river from her town runs all the way here, and so do its lanterns. You stand on a bank among strangers and watch them come. One lantern is different. It is hers; you know the handwriting on the paper, her name in careful letters. It comes down the current slowly, and behind it, in the black water, a small blue light is following. A Chinchou, swimming after the lantern as if it were the moon.',
    [
      ch('Wade in after the Chinchou.', out('You wade in up to your knees. The lantern turns, the way her first one turned for her, and drifts to you. The Chinchou follows it right into your hands. It looks at the lantern, and at you, and its lights blink twice: it has decided you are where the lantern was going. It climbs out with you, dripping and glowing.', gain('chinchou', { bond: 10 }), flag('an14-chinchou'), moment('A Chinchou followed her lantern all the way down the river to you.', 65))),
      ch('Let it follow the lantern.', out('You stay on the bank. The lantern drifts by, and the Chinchou with it, lighting its way, and the two lights go on down the river together and out of sight. You stand there until the cold gets into your boots. It was hers. It got where it was going.', fr(5), flag('an14-let-it-go'))),
    ]),

  // ---------------- AN15. The Mushroom Queen (Door) ----------------
  ev('an15-mushroom-queen', 'The Mushroom Queen', AN, { rarity: 'rare', minStage: stageOf('A4'), types: DUNGEON, ...MUSH, effect: 'fog' },
    'A dungeon, three floors down, where the walls sweat and the air smells of soil. Four adventurers sit round a campfire that went out hours ago, packs open, packs empty. They have the hollow, cheerful look of people who have been hungry long enough to joke about it. At the edge of the dead firelight a Toedscool sways on its long legs, watching them. The biggest adventurer eyes it. "We could eat the Toedscool." Their cook, a small woman with a ladle on her belt, is on her feet at once. "You CANNOT eat the Toedscool." She lowers her voice. "You can eat what it grows. If it likes you. It\'s the Queen\'s."',
    [
      ch('Ask the Toedscool.', out('You crouch down at the edge of the dark, slowly, until you are the same height as the Toedscool. The adventurers go quiet behind you. The cook whispers, "Don\'t look it in the eye. Don\'t look away, either." That is not as helpful as she thinks.', room('an15-trust-game'))),
      ch('Cook something else.', out('The cook looks at your bag the way a drowning person looks at a rope. "You have food? Real food?" She is already relighting the fire. "I have a pot. I have salt. I have four people who are going to cry if you say no."', room('an15-berry-stew'))),
      ch('Go to the Queen.', out('The adventurers stare at you. The cook says, very quietly, "Nobody goes to the Queen." The Toedscool turns and walks off down the dark passage on its long legs, stopping every few steps to see if you are following. It seems you are invited.', flag('mush-queen'), room('an15-the-throne'))),
      ch('Leave them to it.', leave('You wish them luck and go on. Behind you the biggest adventurer says, "So. The Toedscool," and the cook says, "NO," and the Toedscool takes three long steps further into the dark.')),
    ]),
  ev('an15-trust-game', 'Hold Very Still', AN, { room: true, ...MUSH, effect: 'fog' },
    'The Toedscool comes closer, one long leg at a time. It touches your boot. It touches your knee. Then, with great care, it begins to climb you, as if you were a tree it had decided to try. Its feet are cold and soft. The cook mouths: "Don\'t. Move."',
    [
      ch('Don\'t move.', out('You do not move. It reaches your shoulder, then your hat, and settles there, light as a cloud. Something tickles. When it climbs down again your hat brim is ringed with small pale mushrooms, fat and clean and smelling of butter. The cook nearly weeps. "It likes you. It LIKES you." Supper is mushrooms on sticks over a new fire, and the four of them eat as if they had forgotten how.', flag('mush-liked'), fr(3), heal(0.3), room('an15-deep-floor')),
        { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('You flinch when it reaches your ear, and it hops off. But it does not go far. It watches you a long time, and then it climbs you again, slower, and this time you hold. Only a few mushrooms come up on your hat brim, but they are enough for five people if nobody is greedy, and nobody is.', flag('mush-liked'), fr(2), room('an15-deep-floor')) }),
    ]),
  ev('an15-berry-stew', 'Something Else', AN, { room: true, cast: ['trainer.pr/waiter_f'], pokemon: 'toedscool', tint: '#1e2418', effect: 'fire',
    remembers: [{ id: 'cooking-circuit', when: [flagIs('cooking-circuit-won')], notice: 'The cook stops halfway to the pot and stares at you. "Wait. You won the Circuit. I saw your picture on the wall." She shoves the ladle at you. "Judge me. Please. I\'ve waited my whole life for a real judge to taste my stew."', addChoices: [ch('Judge her cooking.', out('She cooks with what little the party has left and a great deal of nerve, and you taste it with the whole party watching. It is good. It is really good. You tell her exactly why, in detail, as you would on the Circuit. She sits down on the floor and puts her face in her hands. "I knew it," she says. "I KNEW about the salt."', flag('mush-cooked'), flag('an15-judged'), fr(3), heal(0.3), room('an15-deep-floor')))] }] },
    'The fire takes on the second try. The cook sets a dented pot over it, adds water from her flask, and turns to you with her hand out, palm up, like a surgeon waiting for a tool. Four hungry faces in the firelight. A Toedscool at the edge of it, curious. "Whatever you\'ve got," the cook says. "I can make anything into stew. I have made boots into stew."',
    [
      ch('Cook with your Oran Berries.', out('Into the pot they go, with salt and a crushed root the cook has been saving. The smell fills the passage. The adventurers eat it scalding, and the biggest one says it is the best thing he has ever eaten, and then says it again. The cook looks at you over the pot with new respect. "Oran and cave root. I would never have thought of it."', lose('oran-berry'), flag('mush-cooked'), fr(3), heal(0.3), room('an15-deep-floor')), { requires: [has('oran-berry')] }),
      ch('Cook with your Sitrus Berry.', out('One Sitrus Berry, cut thin, simmered slow. It turns the water gold. The cook tastes it and goes quiet, then gives everybody exactly the same amount to the spoonful, including you, including the Toedscool, who drinks it delicately from a cupped leaf. "That," she says, "was a kingly berry. You didn\'t have to."', lose('sitrus-berry'), flag('mush-cooked'), fr(4), heal(0.3), room('an15-deep-floor')), { requires: [has('sitrus-berry')] }),
      ch('Forage the cave moss.', out('With no berries to spare you go back along the passage on your hands and knees, picking the pale moss the cook says is safe. It takes a long time. The stew is thin and tastes of stone. But it is hot, and it is something, and the cook is impressed you found enough. "Most people don\'t know that one," she says. "Most people starve next to it."', flag('mush-cooked'), fr(2), room('an15-deep-floor'))),
    ]),
  ev('an15-the-throne', 'The Mushroom Throne', AN, { room: true, cast: [], pokemon: 'amoonguss', tint: '#2a1a2a', effect: 'fog' },
    'The passage opens into a cavern full of mushrooms taller than you, pale and glowing, arranged in rows like a royal court. At the far end, on a throne of shelf fungus, sits an Amoonguss so old its cap has gone silver at the edges. This is the Queen. She rules this whole floor, the Toedscool tells you with a bow of its long neck. She looks at you, and then up, at the rock ceiling, at a sky she has not seen in a hundred years. She wants a tribute. She wants sunlight.',
    [
      ch('Offer sunlight.', out('Your Pokémon calls the sun, down here, under all that rock, and for a moment the whole cavern is full of hot white noon. Every mushroom in the court turns its cap to it. The old Queen closes her eyes and lifts her face, and her silver edges glow gold. When it fades, she bows to you, slowly, all the way down. The Toedscool says, with a stamp, that you have safe passage: you and anyone with you, through the whole dungeon.', flag('an15-safe-passage'), fr(3), room('an15-queens-road')), { requires: [knows('sunny-day'), anyType('fire', 'grass')] }),
      ch('Ask for passage anyway.', out('You have no sun to give. You tell her so, honestly, and bow. The Queen considers you for a long time, and then lets you pass onto her floor, but no further: what lives below her floor is not hers to command. The Toedscool walks beside you as a guide, as far as it is allowed.', fr(2), room('an15-deep-floor'))),
    ]),
  ev('an15-deep-floor', 'The Deep Floor', AN, { room: true, cast: [], pokemon: 'foongus', tint: '#1e2418', effect: 'fog' },
    'The floor below is darker, and the mushrooms here are not polite. Things that look like Poké Balls lie in the moss and are not Poké Balls. A Shroomish bounces out of a crack and back in again. The adventurers draw together behind you. The Toedscool stands very tall on its long legs and looks at you, as if waiting to see what you will do.',
    [
      ch('Fight through.', fight('The Poké Balls open their eyes. The moss stands up.', beast({ format: 'doubles', species: ['foongus', 'shroomish'], win: [flag('an15-floor-won'), room('an15-camp')] }, { pseudo: true, lose: [flag('an15-floor-lost'), room('an15-camp')] }))),
      ch('Let the Toedscool lead.', out('It has grown mushrooms on your hat; it knows you now. It leads you all round the edge of the cavern, stepping where it steps, stopping where it stops. Twice a false Poké Ball blinks at you from the moss and decides you are the Queen\'s. Nobody is spored. At the far side the cook lets out a breath she has been holding the whole floor.', fr(3), room('an15-camp')), { requires: [flagIs('mush-liked')] }),
    ]),
  ev('an15-queens-road', 'The Queen\'s Road', AN, { room: true, ...MUSH, effect: 'sparkle' },
    'Word has gone ahead of you through the mushrooms, the way word goes through roots. On every floor below, the caps turn as you pass and the false Poké Balls keep their eyes shut. A Shroomish bounces out of a crack, sees you, and bounces respectfully back in. The adventurers walk the whole dungeon in a daze. "We\'ve been coming down here for a year," the cook whispers, "and nobody has ever just let us walk."',
    [
      ch('Walk down to the bottom.', out('You walk all the way down. Nothing fights you. At the bottom there is a dry cave with a spring in it and old soot on the ceiling from a hundred other campfires, and the adventurers drop their packs and laugh out loud with relief.', fr(3), heal(0.5), room('an15-camp'))),
    ]),
  ev('an15-camp', 'The Recipe', AN, { room: true, ...MUSH, effect: 'fire',
    remembers: [
      { id: 'queen', when: [flagIs('an15-safe-passage')], notice: 'The Queen has sent her own Toedscool down with you, to see you safely home. It wears your sunlight still, a faint gold along the edge of its cap.' },
      { id: 'liked', when: [flagIs('mush-liked')], notice: 'The Toedscool keeps climbing back onto your hat, every time you take it off. There are fresh mushrooms on the brim each time.' },
      { id: 'cooked', when: [flagIs('mush-cooked')], notice: 'The cook keeps asking you questions about your stew while she cooks, and writing the answers on the back of her hand.' },
    ] },
    'A real campfire, at last, at the bottom of the dungeon, with real food. The cook makes a mushroom stew with everything the Toedscool grows for her, and it is the best thing anyone has eaten in a year. The four adventurers sit round it with full bellies, telling stories that get less true as the fire burns down. In the morning the cook writes the recipe out for you on a scrap of map. "You saved our lives," she says. "Also our dinner. Mostly our dinner." The Toedscool stands at the edge of the light, swaying, looking at you.',
    [
      ch('Take the Toedscool along.', out('It steps over to you on its long legs and stands at your shoulder, as if it had always meant to. The cook laughs. "The Queen gave you one. Nobody gets given one." She packs two portions of the stew into your bag, wrapped in leaves, still warm. The adventurers wave you up the long stairs, better fed than they have been all year.', gain('toedscool', { bond: 10 }), item('queens-mushroom-stew', 2), flag('an15-toedscool'), flag('an15-adventurers-fed'), moment('You fed four starving adventurers in the Mushroom Queen\'s dungeon, and came out with her Toedscool.', 65))),
      ch('Take only the recipe.', out('"It belongs down here," you say. The Toedscool sways, and agrees, and goes back up the dark stairs toward its Queen. The cook packs two portions of stew into your bag, wrapped in leaves, and folds the recipe into your hand. The adventurers wave you up the long stairs, better fed than they have been all year.', item('queens-mushroom-stew', 2), fr(3), flag('an15-adventurers-fed'))),
    ]),

  // ---------------- AN16. The Ember Pilgrim (Region) ----------------
  ev('an16-ember-pilgrim', 'The Ember Pilgrim', AN, { rarity: 'rare', minStage: stageOf('A4'), types: HOT, ...EMBER, effect: 'fire',
    remembers: [{ id: 'moltres-ember', when: [flagIs('birds-trial-moltres')], notice: 'The pilgrim looks at the way you are already holding out your hands, cupped, a little apart, the way you hold something that burns. "You have done this before," the pilgrim says. "Up a mountain, I think. For a bird." The flame leans toward you as if it recognised a cousin.' }] },
    'On the road through the hot country, a pilgrim in grey robes walks toward you very slowly. In both hands the pilgrim carries a lantern of old black iron, and inside it a small flame is burning. It is not a big flame. It is not a bright one. But the pilgrim holds it as if it weighed as much as a house. "This has not gone out in three hundred years," the pilgrim says. "I carry it to the end of the world. Then someone carries it back." The pilgrim\'s hands are shaking. "I am very tired. Would you carry it one region?" Inside the lantern, the little flame flickers toward you.',
    [
      ch('Yes.', out('The pilgrim puts the lantern into your hands. It is warm, and heavier than iron, and it is very quiet. "Keep it lit," the pilgrim says. "Wind, rain, a sneeze: it fears all three. I will walk behind you, slower." The pilgrim sits down at the roadside for the first time in a long, long while. The flame settles in your hands as if it had been waiting.', flag('pilgrim-carried'), fr(2))),
      ch('What if it goes out?', out('The pilgrim smiles, which seems to take a long way to arrive. "Then we light it again. From something that loves it." The pilgrim looks at your Pokémon, one after another, for a long moment, and nods to each of them as if being introduced. The lantern is still held out to you.', flag('pilgrim-asked'), room('an16-ember-pilgrim-again'))),
      ch('No.', out('The pilgrim nods, without a trace of blame, and walks on, slowly, carrying the lantern in both hands. You watch the little flame go down the road until it is a spark, and then not even that. You will meet again. The pilgrim will be slower.', flag('an16-declined'))),
    ]),
  ev('an16-ember-pilgrim-again', 'The Ember Pilgrim', AN, { room: true, ...EMBER, effect: 'fire' },
    'The pilgrim still holds the lantern out, arms trembling a little now. "Something that loves it," the pilgrim says again, softly, so you will remember. "That is all a flame ever needs. Will you carry it?"',
    [
      ch('Yes.', out('You take it. It is warm, and heavier than iron. "Wind, rain, a sneeze," the pilgrim says. "And if it goes out, you know what to do." The pilgrim sits down at the roadside, and for the first time in three hundred years the flame is not the pilgrim\'s to carry.', flag('pilgrim-carried'), fr(2))),
      ch('No.', out('"Then I will carry it a little further," the pilgrim says, and smiles, and goes on down the road, slowly. The flame looks back at you over the pilgrim\'s shoulder for a long time.', flag('an16-declined'))),
    ]),
  ev('an16-wind', 'Wind on the Ridge', AN, { callback: true, requires: [flagIs('pilgrim-carried'), notYet('an16-halfway'), notYet('an16-flame-out'), age('pilgrim-carried', 1, 1)], ...EMBER, cast: [], effect: 'shake' },
    'The road goes over a high bare ridge, and the wind comes with it, hard and hot and full of grit. It gets under your coat. It gets into the lantern. The little flame lies down flat on its wick, and flutters, and you feel it in your hands like a held breath.',
    [
      ch('Shield it with your body.', out('You turn your back to the wind and hunch over the lantern, and walk the whole ridge sideways like a crab. Your neck burns with grit. The flame stands back up, slowly, in the hollow your body makes. On the far side of the ridge your team gathers round you, as if they had all decided at once to be a wall.', fr(2), flag('an16-check-wind')),
        { prompt: { id: 'brace-hold', needs: 'ok' }, fail: out('A gust gets in under your arm. The flame goes flat, flutters, and goes out. A thread of grey smoke rises from the wick, and the lantern is only iron. You stand there on the ridge with it in your hands, and the wind does not even notice what it has done.', flag('an16-flame-out')) }),
      ch('Go round by the low road.', out('You turn off the ridge and take the low road through the valley, which is long, and dull, and sheltered the whole way. It costs you a stretch of the route, and the flame never so much as flickers. The pilgrim, far behind, would approve.', takeNode(), flag('an16-check-wind'))),
    ]),
  ev('an16-rain', 'Rain', AN, { callback: true, requires: [flagIs('pilgrim-carried'), notYet('an16-halfway'), notYet('an16-flame-out'), age('pilgrim-carried', 2, 2)], ...EMBER, cast: [], effect: 'rain' },
    'The sky goes the colour of slate, and then the rain comes all at once, warm and heavy, bouncing off the road. The lantern has a lid, but rain finds its way into everything. The flame hisses once, small and frightened. There is an overhang of rock a long way up the road. There is a peddler under a tarpaulin much closer, selling oilcloth.',
    [
      ch('Run for the overhang.', out('You run with the lantern clutched to your chest, dodging the worst of it, leaping the puddles, your team splashing behind you. Under the overhang you open your coat. The flame is there, small and cross and alive. Everyone sits in a row under the rock and watches the rain, steaming.', fr(2), flag('an16-check-rain')),
        { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('Halfway there a gutter of water comes off a rock above you, straight down onto the lantern. There is a hiss, and a smell of wet iron, and when you reach the overhang and open your coat the wick is black. You sit under the rock with the cold lantern in your lap and listen to the rain.', flag('an16-flame-out')) }),
      ch('Buy oilcloth from the peddler.', out('The peddler wraps the lantern in oilcloth with quick, practised hands, leaving a gap at the top for the flame to breathe. "Pilgrim\'s lamp," the peddler says. "Seen one before. My grandmother carried it. Mind it." The rain runs off the oilcloth and the flame does not even know it is raining.', $(-200), flag('an16-check-rain')), { requires: [money(200)] }),
    ]),
  ev('an16-cold-lantern', 'A Cold Lantern', AN, { callback: true, requires: [flagIs('an16-flame-out'), notYet('an16-relit'), notYet('an16-carried-cold')], ...EMBER, cast: [], effect: 'none',
    remembers: [{ id: 'asked', when: [flagIs('pilgrim-asked')], notice: 'You remember what the pilgrim said, before you ever took it: "Then we light it again. From something that loves it." Your Pokémon are watching the cold lantern. One of them is a Fire-type, and it has been watching it longest.', addChoices: [ch('Let your Fire-type relight it.', out('Your Fire-type comes and sits in front of the lantern, and looks at the black wick a long time. Then it breathes on it, very gently, the way you breathe on cold hands. A spark. Another. The flame catches, and stands up, and it is not quite the colour it was: there is something of your Fire-type in it now. It leans toward your Pokémon when it flickers.', flag('an16-flame-out', -1), flag('an16-relit'), flag('an16-flame-partly-yours'), fr(10, 'picked')), { pick: { types: ['fire'] } })] }] },
    'You set up camp and set the lantern in the middle of it, out of habit, before you remember there is nothing in it to keep warm. Three hundred years, and it went out with you. The iron is cold. Your Pokémon sit round it anyway, the way you sit round a fire, as if they could make one by agreeing to.',
    [
      ch('Carry it cold.', out('You pick it up in the morning and carry it on, cold and black, exactly as carefully as before. It is lighter without the flame. You do not like how much lighter. The pilgrim will know what to do. You hope the pilgrim will know what to do.', flag('an16-carried-cold'))),
    ]),
  ev('an16-halfway', 'The Pilgrim Again', AN, { callback: true, requires: [flagIs('pilgrim-carried'), notYet('an16-declined'), age('pilgrim-carried', 3)], ...EMBER, pokemon: 'wooper', effect: 'fire',
    remembers: [
      { id: 'cold', when: [flagIs('an16-flame-out')], notice: 'The pilgrim looks at the cold lantern in your hands, and does not flinch, and does not scold. "Ah," is all the pilgrim says. "It is heavier like that, isn\'t it." There is nothing in it left for a sneeze to blow out.', hide: [0] },
      { id: 'partly-yours', when: [flagIs('an16-flame-partly-yours')], notice: 'The pilgrim looks at the flame a long time. "It has a new colour in it," the pilgrim says. "Something of yours. Good. It has needed new colours."' },
    ] },
    'Halfway through the region, at a ford where the road crosses a stream, the pilgrim catches you up. Slower than ever, robes grey with dust, but smiling. "Still lit?" the pilgrim asks, and leans in to look. And that is when a Wooper surfaces in the stream right beside the lantern, blinks at it, and screws up its whole face to sneeze.',
    [
      ch('Turn the lantern from the sneeze.', out('You swing the lantern away just as the Wooper sneezes, an enormous wet sneeze for something so small. It soaks your sleeve and misses the flame by a hand. The pilgrim laughs so hard the pilgrim has to sit down in the stream. "Water-types," the pilgrim gasps. "Three hundred years, and it is always the Water-types."', flag('an16-halfway'), fr(3)),
        { prompt: { id: 'tilt-drag', needs: 'ok' }, fail: out('Too slow. The Wooper sneezes, an enormous wet sneeze for something so small, straight into the lantern. The flame goes out with a tiny hiss. The Wooper looks horrified. The pilgrim, very gently, pats it on the head. "Not your fault," the pilgrim says. "It never is. Something that loves it will light it again."', flag('an16-halfway'), flag('an16-flame-out')) }),
      ch('Let the pilgrim carry it a while.', out('You hold it out, and the pilgrim takes it, and carries it across the ford and up the far bank with an old, sure step. That night you all camp together, and the pilgrim tells you where the flame has been: frozen passes, burning towns, a hundred hands. In the morning the pilgrim gives it back to you. "Your turn again," the pilgrim says. "Not long now."', flag('an16-halfway'), heal(0.5), fr(2))),
    ]),
  ev('an16-slower', 'Slower', AN, { callback: true, requires: [flagIs('an16-declined'), notYet('pilgrim-carried'), age('an16-declined', 3)], ...EMBER, effect: 'fire' },
    'Halfway through the region, you catch up with the pilgrim. It does not take long. The pilgrim is walking much slower now, one foot and then a rest and then the other, and the lantern hangs low in tired hands. The flame inside is still lit. It flickers toward you again, as if it had not given up. "Hello," the pilgrim says. "I hoped I would see you. I am slower, as you see."',
    [
      ch('Carry it now.', out('You take the lantern before the pilgrim can ask. It is warm, and heavier than iron. The pilgrim sits down right there in the road and laughs with relief. "Wind, rain, a sneeze," the pilgrim says. "Only to the end of the region. I will be behind you." The flame stands up a little taller in your hands.', flag('pilgrim-carried'), flag('an16-halfway'), fr(3))),
      ch('Walk with them a while.', out('You do not take the lantern, but you walk beside the pilgrim, matching that slow step, all afternoon. You carry the pilgrim\'s pack instead. At dusk you share a fire, and the pilgrim lights it from the lantern, carefully, and your Pokémon sleep warmer than they have all region.', heal(0.5), fr(3), flag('an16-walked-with'))),
      ch('No.', out('"Then I will carry it to the end," the pilgrim says, without blame, and goes on. Slower. Much slower. The flame looks back at you over the pilgrim\'s shoulder until the road bends.', flag('an16-declined-twice'))),
    ]),
  ev('an16-cold-night', 'A Cold Night', AN, { callback: true, requires: [flagIs('pilgrim-carried'), flagIs('an16-halfway'), notYet('an16-flame-out'), age('an16-halfway', 1, 1)], ...EMBER, cast: [], effect: 'snow' },
    'The hot country turns cold at night, the way deserts do. Frost comes down on the tents. The little flame shrinks on its wick until it is the size of a seed, and you understand that it is not the wind it fears tonight: it is running out of the will to burn. Somebody has to sit up with it.',
    [
      ch('Trim the wick all night.', out('You sit up with it and trim the wick, again and again, a hair at a time, feeding it just enough and not too much. It is slow, careful work. Your Pokémon fall asleep against your back one by one. At dawn the flame is still there, the size of a seed, and then the sun comes up and it grows.', fr(3), flag('an16-check-cold')),
        { prompt: { id: 'gauge-hold', needs: 'ok' }, fail: out('You trim it too short, near dawn, when your eyes are closing. The seed of flame shrinks to a point, and to nothing. You sit holding the cold lantern as the sun comes up, and it is very quiet.', flag('an16-flame-out')) }),
      ch('Sleep late with it in your coat.', out('You take the lantern inside your coat and sleep curled round it, half awake all night. The flame lives. You do not get up until the sun is high, and you lose a good piece of the day\'s road to it.', takeNode(), flag('an16-check-cold'))),
    ]),
  ev('an16-crossing', 'The Crossing', AN, { callback: true, requires: [flagIs('pilgrim-carried'), flagIs('an16-halfway'), notYet('an16-flame-out'), age('an16-halfway', 2, 2)], ...EMBER, cast: [], effect: 'float' },
    'The last river of the region is wide and fast and waist-deep, and there is no bridge. On the far bank, a ferryman leans on his pole and waits to be asked. The lantern seems to shrink in your hands at the sound of all that water.',
    [
      ch('Hold it high and wade.', out('You lift it over your head and wade in. The current shoves at you; your team strings out in a line, holding on to each other. Your arms ache, then burn, then go past burning. On the far bank you lower the lantern, and the flame is there, untouched, and your Pokémon cheer as if you had won a badge.', fr(3), flag('an16-check-crossing')),
        { prompt: { id: 'pull-hold', needs: 'ok' }, fail: out('Halfway across your foot slips, and the lantern dips. Only for a moment. Only an inch. It is enough. The river takes the flame away with a hiss, and you climb out on the far bank with a cold lantern and nobody saying anything.', flag('an16-flame-out')) }),
      ch('Pay the ferryman.', out('He poles you across without a word, and only speaks on the far bank, looking at the lantern. "Pilgrim\'s lamp," he says. "I took it across going the other way, when I was a boy." He will not take more than half the fare.', $(-150), flag('an16-check-crossing')), { requires: [money(150)] }),
    ]),
  ev('an16-regions-end', 'Something That Loves It', AN, { callback: true, requires: [flagIs('pilgrim-carried'), flagIs('an16-halfway'), age('an16-halfway', 3)], ...EMBER, effect: 'fire',
    remembers: [
      { id: 'still-cold', when: [flagIs('an16-flame-out')], notice: 'The lantern in your hands is still cold. The pilgrim takes your hands, lantern and all, and holds them. "From something that loves it," the pilgrim says. "You carried it cold all this way. Who do you think that is?" A spark jumps from nowhere you can see. The flame stands up on the wick.' },
      { id: 'partly-yours', when: [flagIs('an16-flame-partly-yours')], notice: 'The flame has your Fire-type\'s colour in it still. When it rises, it looks round for your Fire-type before it looks at anything else.' },
      { id: 'moltres', when: [flagIs('birds-trial-moltres')], notice: '"You have done this twice now," the pilgrim says. "A bird\'s ember and a pilgrim\'s. The flames talk, you know. They will be talking about you."' },
    ] },
    'The region\'s end. A last hill, and below it the next country, and the pilgrim at your side, slow and dusty and smiling. "This is as far as I asked," the pilgrim says. "Thank you." You hold out the lantern. But the flame inside does something it has not done in three hundred years: it stands up, tall, taller than the lantern, and steps out of the iron, and it is a Charcadet, small and bright, with embers for eyes. It looks at the pilgrim. Then it looks at you.',
    [
      ch('Hold out your hands.', out('It comes to you. It is warm to hold, and lighter than the lantern ever was. The pilgrim laughs, and picks up the empty lantern, and lights a new small flame in it from the Charcadet\'s shoulder. "Someone carries it back," the pilgrim says. "I see it will be both of us." At the end of everything, the pilgrim promises, there will be a lantern at the long table, and your Fire-type in its light.', gain('charcadet', { bond: 15 }), flag('an16-charcadet'), flag('reunion-guest-ember-pilgrim'), moment('You carried a three-hundred-year flame for a region, and a Charcadet stepped out of it.', 75))),
      ch('Let it walk back with the pilgrim.', out('"Someone carries it back," you say. The Charcadet looks at the pilgrim, and at the long road home, and steps back into the lantern with a sigh of sparks. The pilgrim bows to you, all the way down, and gives you a lump of charcoal from the bottom of the lantern, still warm. "Three hundred years of it," the pilgrim says. "Keep it near your Fire-type."', item('charcoal'), fr(5), flag('reunion-guest-ember-pilgrim'), moment('You carried a three-hundred-year flame for a region, and gave it back.', 70))),
    ]),

  // ---------------- AN17. The Hundred-Year Egg (Companion: an egg) ----------------
  ev('an17-hundred-year-egg', 'The Hundred-Year Egg', AN, { rarity: 'uncommon', minStage: stageOf('A2'), types: [], ...SHRINE, effect: 'glint',
    remembers: [
      { id: 'paradise', when: [flagIs('aq44-paradise-done')], notice: 'You know that shell. White, with little coloured triangles, like the eggs in the hidden paradise where the Togepi live. "A traveller brought it from somewhere far away and warm," the keeper says, "a hundred years ago." The egg rocks on its cushion as you come near. It knows where you have been.', hide: [0],
        addChoices: [ch('Hold it.', out('You pick it up, and it is warm at once, warm right through, as if it had been waiting a hundred years for someone who smelled of home. It cracks in your hands. A Togepi pushes the top of its shell off with its head and looks up at you, and then round at the shrine, and laughs. The keeper sits down very suddenly on the floor. "A hundred years," the keeper says. "A hundred years, and it only wanted someone who had been there."', gain('togepi', { bond: 20 }), flag('egg100-held'), flag('an17-egg-taken'), flag('an17-hatched'), moment('The hundred-year egg hatched in your hands, because you had been to the paradise it came from.', 75)))] },
      { id: 'kind', when: [isGood(10)], notice: 'The keeper looks at you longer than at most people. "Word comes up the road ahead of some travellers," the keeper says. "Kind words, about you."', hide: [0],
        addChoices: [ch('Hold it.', out('You pick it up the way you would pick up anything that might be frightened. For a moment, nothing. Then, slowly, from the middle outward, the shell grows warm. The keeper stares. "It has never been warm," the keeper whispers. "Not for anyone. Not in my whole life." The keeper folds the cushion round it and puts both into your arms. "Take it. It has chosen. Bring it back to see me one day."', flag('egg100-held'), flag('an17-egg-taken'), flag('an17-egg-warm'), fr(3)))] },
    ] },
    'A village shrine at the top of a hundred worn steps, with a bell rope and a smell of cedar smoke. On a faded cushion in the middle of the floor sits an egg. White, speckled, perfectly still. The shrine keeper sweeps the floor around it the way you would sweep round a sleeping cat. "It hatches for someone it trusts," the keeper says. "Nobody has been trusted in a hundred years." The broom stops. "People come and hold it every day. They want it to choose them so badly." The keeper looks at the egg. "It gets colder."',
    [
      ch('Hold it.', out('You pick it up. It is cold, and smooth, and very light, like a stone from the bottom of a river. You hold it as long as you dare. Nothing happens. Nothing at all. You set it back on the cushion, and the keeper sighs, not unkindly. "Everybody does that," the keeper says. "Everybody has to."', flag('egg100-held'), room('an17-shrine-again'))),
      ch('Sing to it.', out('Your Pokémon steps forward and sings to the egg: not loud, not for anyone else, the kind of song you sing to something that cannot see you. On the cushion, the egg rocks once. Only once. The keeper drops the broom. "It moved," the keeper says. "It has not moved in a hundred years." The keeper lifts the egg, cushion and all, and puts it in your arms, hands shaking. "Take it. It answered you. Nobody has ever had an answer."', flag('egg100-sang'), flag('an17-egg-taken'), fr(5, 'picked')), { pick: { moveFlag: 'sound' } }),
      ch('Leave it be.', out('"I think everybody wants something from it," you say. "I\'ll leave it alone." The keeper stares at you, broom in hand, as if you had said something in another language. "Nobody leaves," the keeper says. "Everybody holds it. Everybody tries." You bow to the egg, which seems the right thing, and go back down the hundred steps.', flag('egg100-left'))),
    ]),
  ev('an17-shrine-again', 'Still Cold', AN, { room: true, ...SHRINE, effect: 'glint' },
    'The egg sits on its cushion, exactly as cold as before. The keeper has picked up the broom again, and is sweeping slowly round it, not looking at you, giving you time. Visitors climb the hundred steps behind you, already holding out their hands.',
    [
      ch('Sing to it.', out('Your Pokémon steps up and sings to it, softly, just for the egg. On the cushion the egg rocks once: once only. The visitors gasp. The keeper drops the broom. "It answered," the keeper whispers, and lifts the egg, cushion and all, into your arms. "Nobody has ever had an answer. Take it, before it changes its mind."', flag('egg100-sang'), flag('an17-egg-taken'), fr(5, 'picked')), { pick: { moveFlag: 'sound' } }),
      ch('Leave it be.', out('You leave it on its cushion, among all those reaching hands, and go back down the hundred steps. Behind you the keeper has stopped sweeping and is watching you go, puzzled, the way you watch someone walk away from a winning ticket.', flag('egg100-left'))),
    ]),
  ev('an17-nearest-the-door', 'Nearest the Door', AN, { callback: true, requires: [flagIs('egg100-left'), notYet('an17-egg-taken'), age('egg100-left', 1, 2)], ...SHRINE, effect: 'glint' },
    'Your road brings you back past the village, and something makes you climb the hundred steps again. The keeper meets you at the top, broom forgotten. "It moved," the keeper says. "On its own. The night after you left." The egg is still on its cushion. But it has moved, by itself, a hand\'s width at a time, to the very edge of the cushion. The edge nearest the door. The edge you walked out of.',
    [
      ch('Take it.', out('You kneel and hold out your hands, and do not pick it up: you wait. The egg rocks, and rolls the last inch off the cushion into your palms by itself. It is not warm, not yet. But it is not cold either. "It chose the one who didn\'t grab," the keeper says, and laughs, and has to wipe their eyes. "Of course it did. Of course."', flag('an17-egg-taken'), flag('an17-chose-you'), fr(3))),
      ch('Leave it be.', out('You leave it again. It is the hardest thing you have done all week. The keeper walks you to the top of the steps. "It will roll off the cushion one day, after somebody," the keeper says. "I hope it is somebody like you." The egg watches you go from the very edge of the cushion.', flag('an17-left-twice'))),
    ]),
  ev('an17-in-the-bag', 'Carrying It', AN, { callback: true, requires: [flagIs('an17-egg-taken'), notYet('an17-hatched'), age('an17-egg-taken', 1, 1)], ...SHRINE, cast: [], effect: 'none' },
    'Camp, the night after the shrine. The egg sits in a nest of your spare clothes, beside the fire. Every so often you put a hand on it without meaning to, the way you touch a pocket to make sure something is still there. Your team has noticed. They keep drifting over to look at it, and then pretending they were going somewhere else.',
    [
      ch('Carry it against your chest.', out('You sleep with it inside your coat, against your heart, where it is warmest. In the night you feel it, once: a tiny tap from inside, like a knock on a door from the other side of a very long hall. You lie awake a long time after, smiling at nothing.', flag('an17-egg-scene'), fr(2))),
      ch('Let {lead} keep it warm.', out('{lead} curls round the egg without being asked, and stays there all night, very still, very proud, not sleeping. In the morning there is a tiny crack-shaped mark on the shell, as if something inside had leaned against it to listen.', flag('an17-egg-scene'), fr(5, 'lead'))),
    ]),
  ev('an17-the-hatching', 'A Hundred Years', AN, { callback: true, requires: [flagIs('an17-egg-taken'), notYet('an17-hatched'), age('an17-egg-taken', 2)], ...SHRINE, cast: [], pokemon: 'togepi', effect: 'sparkle',
    remembers: [
      { id: 'sang', when: [flagIs('egg100-sang')], notice: 'From inside the shell, very faintly, something is humming. It is the song your Pokémon sang at the shrine, all of it, every note, a little out of tune.' },
      { id: 'chose-you', when: [flagIs('an17-chose-you')], notice: 'It is the egg that rolled off its cushion toward the door you walked out of. It has been going somewhere for a hundred years. It seems it was going here.' },
      { id: 'warm', when: [flagIs('an17-egg-warm')], notice: 'It has been warm since the moment you picked it up at the shrine. Tonight it is warmer than you are.' },
    ] },
    'In the middle of an ordinary afternoon, on an ordinary road, the egg in your arms goes warm all the way through. Then it cracks. Not all at once: one small crack, and a pause, as if whatever is inside were making sure, after a hundred years, that this is really the place. Your whole team stops walking and gathers round. Nobody breathes. Another crack.',
    [
      ch('Hold out your hands.', out('The top of the shell lifts off like a lid. A Togepi blinks up at you, at the sky, at the road and the trees and your Pokémon crowding round, and it laughs: one high, delighted laugh, as if the world were a joke it had been waiting a hundred years to hear the end of. It holds up its arms. You pick it up.', gain('togepi', { bond: 20 }), flag('an17-hatched'), moment('The egg nobody had been trusted with for a hundred years hatched in your hands.', 75))),
      ch('Sing to it again.', out('Your Pokémon sings the same song as at the shrine, quietly, and the shell opens in time with it. A Togepi tumbles out into your hands still wet, looks straight at the singer, and joins in, terribly, at the top of its voice. The whole team is laughing. It is the best song anyone has ever sung on this road.', gain('togepi', { bond: 30 }), fr(5, 'picked'), flag('an17-hatched'), moment('The hundred-year egg hatched to a song, and sang back.', 75)), { pick: { moveFlag: 'sound' } }),
    ]),
  ev('an17-first-steps', 'The Edge of Camp', AN, { callback: true, requires: [flagIs('an17-hatched'), line('togepi', 2)], ...SHRINE, cast: [], pokemon: 'togepi', effect: 'none' },
    'Every night the Togepi does the same thing. When camp is made, it toddles off to the very edge of it, the edge nearest the road you came in by, and sits there with its back to the fire, looking out. As if it were still on a cushion. As if it were still waiting for someone to come through a door.',
    [
      ch('Sit beside it.', out('You go and sit beside it at the edge of the camp, facing the road. It looks up at you, surprised. Then it leans against your leg, and looks at the road a little longer, and then turns round, for the first time, and looks at the fire. After that it sleeps in the middle of camp with everybody else.', bondLine('togepi', 5), flag('an17-scene-2'))),
      ch('Call it back to the fire.', out('You call it, and it comes, toddling back across the camp on its stubby legs, and climbs into your lap. It still looks at the road over your arm for a while. But each night after, it goes a little less far toward the edge, until one night it does not go at all.', bondLine('togepi', 5), flag('an17-scene-2'))),
    ]),
  ev('an17-the-cushion', 'The Empty Cushion', AN, { callback: true, requires: [seen('an17-first-steps'), line('togepi', 3)], ...SHRINE, pokemon: 'togepi', effect: 'sparkle' },
    'You pass a village with a shrine at the top of a hundred worn steps, and the Togepi will not stop pulling at your sleeve until you climb them. The keeper is sweeping round an empty cushion, faded, in the middle of the floor. "I keep it," the keeper says, without turning round. "People ask why. There is nothing on it now." Then the keeper turns round, and sees who is in your arms.',
    [
      ch('Let it sit on the cushion.', out('The Togepi climbs onto the cushion and sits right in the middle of it, in the hollow its egg wore there over a hundred years, and laughs. The keeper laughs too, and then cries, and then laughs again. When you go, the cushion is still empty, and the keeper is still sweeping round it. But they are humming.', bondLine('togepi', 5), flag('an17-cushion'), moment('Togepi sat once more on the cushion where its egg waited a hundred years.', 60))),
      ch('Show the keeper how it has grown.', out('You set it down, and it toddles across the floor to the keeper and holds up its arms. The keeper picks it up and turns it over and looks at it from every side, the way you would read a letter you had given up waiting for. "Look at you," the keeper keeps saying. "Look at you. Look at you."', bondLine('togepi', 5), fr(2), flag('an17-cushion'))),
    ]),

  // ---------------- AN18. The Friend You Didn't Make (Trial-shaped) ----------------
  ev('an18-friend-you-didnt-make', 'The Friend You Didn\'t Make', AN, { rarity: 'uncommon', minStage: stageOf('A3'), types: [], ...CHEST,
    remembers: [{ id: 'kind-money', when: [flagIs('kind-gave-money')], notice: 'The chest is nearer than you expected, only a few steps beyond the firelight. Somewhere on this road you gave your money away to a stranger who needed it. Something in the chest seems to have heard about that.', hide: [2],
      addChoices: [ch('Leave a coin of your own.', out('You set one of your own coins on the path, beside theirs, and go back to the fire. You do not look. In the night you hear the lid of the chest creak, very slightly, as if something inside had lifted it an inch to see what you had done.', $(-100), flag('an18-gave', 2), flag('an18-met')), { requires: [money(100)] })] }] },
    'You make camp at the rest stop as the light goes. At the very edge of the clearing, where the firelight gives out, there is an old wooden chest with iron corners that was not there when you arrived. Nobody owns it. Nobody is near it. Between the chest and your fire, on the path, a few gold coins lie in the dirt, one after another, as if dropped from a pocket with a hole in it. The lid of the chest is shut. You have the feeling, the way you sometimes do, that it is watching.',
    [
      ch('Pick up the coins.', out('You pick them up, one by one, all the way along the path. They are real, and heavy, and warm from somewhere. When you straighten up with the last one, the chest is still there at the edge of the light. You are almost sure it is a little further off than it was.', item('gimmighoul-coin'), flag('an18-picked'), flag('an18-met'))),
      ch('Leave them.', out('You leave them lying where they are and turn back to the fire. Behind you, nothing moves. In the morning the coins are still on the path, exactly where they were, and so is the chest, exactly as far away.', flag('an18-left-them'), flag('an18-met'))),
      ch('Leave a coin of your own.', out('You take a coin from your own pocket and set it down on the path beside theirs, then go back to the fire. You do not look. In the night you hear the lid of the chest creak, very slightly, as if something inside had lifted it an inch to see what you had done.', $(-100), flag('an18-gave'), flag('an18-met')), { requires: [money(100)] }),
    ]),
  ev('an18-second-morning', 'Coins on the Path', AN, { callback: true, requires: [flagIs('an18-met'), age('an18-met', 1, 1)], ...CHEST,
    remembers: [
      { id: 'gave', when: [flagIs('an18-gave')], notice: 'There are two coins on the path this morning where you left one. Yours, and another, set neatly beside it. The chest is a little nearer the fire than it was.' },
      { id: 'picked', when: [flagIs('an18-picked')], notice: 'The chest is further away this time, right back among the trees, and the coins on the path are fewer and further apart, as if laid out by someone who is no longer sure.' },
      { id: 'left', when: [flagIs('an18-left-them')], notice: 'The chest is exactly as far away as last time. Not nearer. Not further. As if it were waiting to see what you are.' },
    ] },
    'The next stage, the next rest stop, the next fire. And at the edge of the light, as if it had walked there in the night on legs nobody saw, the old wooden chest with the iron corners. Coins lie on the path between it and you again, gold in the last of the sun.',
    [
      ch('Pick up the coins.', out('You gather them up. They are warm. When you look up, the chest has gone a little further back into the dark, and the lid is shut tight.', item('gimmighoul-coin'), flag('an18-picked'), flag('an18-second'))),
      ch('Leave them.', out('You leave them on the path and sit with your back to the chest all evening. In the morning nothing has moved. The coins, the chest, the distance between: all exactly the same.', flag('an18-left-them'), flag('an18-second'))),
      ch('Leave a coin of your own.', out('You set a coin of your own on the path again and go back to the fire. Later, half asleep, you hear something small and metal walking, tink, tink, tink, across the clearing and back again. In the morning the lid of the chest is open a finger\'s width.', $(-100), flag('an18-gave'), flag('an18-second')), { requires: [money(100)] }),
    ]),
  ev('an18-third-morning', 'By the Fire', AN, { callback: true, requires: [flagIs('an18-second'), age('an18-second', 1, 1)], ...CHEST,
    remembers: [
      { id: 'friend', when: [flagIs('an18-gave', 2)], notice: 'The chest is right at the edge of your fire tonight, close enough to warm its iron corners. The lid is open a hand\'s width. In the dark under it, two small eyes are looking at your coins, and then at you.', hide: [2],
        addChoices: [ch('Leave a coin of your own.', out('You set your coin down, not on the path this time, but by the fire, right in the light. For a long moment nothing happens. Then the lid of the chest opens all the way, and a Gimmighoul climbs out: small, grey, with one gold coin balanced on its head like a hat. It picks up your coin and looks at it, and puts it with its own. Then it comes and sits down by the fire, next to you, and holds its little hands out to the warmth as if it had never been allowed this close to one before.', $(-100), gain('gimmighoul', { bond: 20 }), flag('an18-friend'), flag('reunion-guest-gimmighoul'), moment('You left a coin by the fire three nights running, and a Gimmighoul came out of its chest to sit beside you.', 70)), { requires: [money(100)] })] },
      { id: 'gone', when: [flagIs('an18-picked', 2)], notice: 'The chest is so far off this time it is only a shape among the trees, and there are only a few coins, thrown down any old how, as if somebody had given up arranging them.', hide: [0],
        addChoices: [ch('Pick up the coins.', out('You pick them up. When you look for the chest it is gone: not further off, not hidden among the trees, simply gone, and the place where it stood is only grass. You will not see it again on this road. In your hand the coins are cold for the first time.', item('gimmighoul-coin'), flag('an18-gone')))] },
      { id: 'same', when: [flagIs('an18-left-them', 2)], notice: 'The chest is exactly as far away as it has always been. It has kept its distance three nights running, as carefully as you have kept yours.' },
    ] },
    'The third stage, the third rest stop, the third fire. You are not surprised any more to see it at the edge of the light: the old chest with the iron corners, waiting. You find you would have been sorry if it had not come. Coins lie on the path between you, gold in the dusk.',
    [
      ch('Pick up the coins.', out('You gather them up. The chest draws back into the dark as you do, a little further, and the lid stays shut. By morning it is gone from the clearing, but you think, somehow, not gone from the road.', item('gimmighoul-coin'), flag('an18-picked'))),
      ch('Leave them.', out('You leave them where they lie. The chest stays exactly where it is, at the edge of the light, all night. Neither of you comes any closer. In the morning it is gone, and the coins with it, and the clearing is very quiet.', flag('an18-left-them'))),
      ch('Leave a coin of your own.', out('You leave a coin of your own on the path once more. In the night you hear the lid creak, and small metal footsteps come halfway to the fire, and stop, and go back. It is not ready. Maybe it needed one more night than the road had to give. In the morning there is a coin on your pack that is not yours.', $(-100), item('gimmighoul-coin'), flag('an18-gave')), { requires: [money(100)] }),
    ]),
];

export const REMOVE: string[] = [];
