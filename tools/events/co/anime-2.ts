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
import { ch, ev, fight, flag, flagIs, fr, item, leave, out, relic, room, type Json } from '../dsl.ts';
import { AN, gain, knows, monDuel, moment, seen, stageOf, tagTypes, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AN10: 'an10-formation',
  AN12: 'an12-paper-city',
};

export const PLACEMENT: Record<string, Place> = {
  'an10-formation': { shape: 'Tournament', earliest: 'A3', home: 12, sits: 'optional', attaches: 'town', tags: ['fighting'], note: 'The Town node; else Step 12. Fighting stages. The drills, the match and the little one\'s turn are rooms in the same node.' },
  'an12-paper-city': { shape: 'Door', earliest: 'A5', home: 13, window: [11, 15], sits: 'optional', tags: ['city'], note: 'Door: the rooms are the chain pseudo-stage ps_an12_paper_city (src/data/catalogOverhaul/pseudo/anime-2.json). "Find the folder" is two rooms (the doc\'s two nodes).' },
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

export const CHECKED: Record<string, string> = { AN10: '2026-11-15' };

const FIGHT = tagTypes('fighting');
const CITY = tagTypes('city');
const PAPER = { pokemon: 'flittle', tint: '#2e2c26' };
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
];

export const REMOVE: string[] = [];
