// Anime questlines, module 5: AQ1-AQ7 (AQ8 is the Fighting Tournament gn.16, see MERGED). Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   Scripts: QUESTLINES_ASH.md lines 10-224. Placement: QUESTLINES_PLACED.md lines 272-344.
// Build: npm run co:build -- anime-5
import { $, anyType, ch, ev, fight, flag, flagAgo, flagAt, flagIs, fr, heal, hurt, item, leave, lv, out, relic, rest, room, takeNode, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, evolve, farewell, gain, later, line, moment, monDuel, noLine, notYet, seen, stageOf, tagTypes, teach, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ1: 'aq01-wouldnt-go-in-its-ball',
  AQ2: 'aq02-butterfree-migration',
  AQ3: 'aq03-flock-leaders-promise',
};

/** Questlines the docs settle as another thread's (QUESTLINES_PLACED.md "Overlaps, settled"). */
export const MERGED: Record<string, string> = { AQ8: 'gn.16 The Fighting Tournament (greenneedle thread)' };

export const PLACEMENT: Record<string, Place> = {
  'aq01-wouldnt-go-in-its-ball': {
    shape: 'Companion', earliest: 'A1', home: 'The town of a region\'s Stage 1: a professor\'s lab. Else 3', window: [2, 6], sits: 'optional', attaches: 'town',
    beats: ['aq01-spearow', 'aq01-pika-center', 'aq01-pika-rain', 'aq01-pika-ball', 'ash-training', 'aq01-shoulder-1', 'aq01-shoulder-2', 'aq01-shoulder-3'],
    note: 'The doc\'s escalation (the Spearow at the lab window) is in the meeting\'s node, where the Pikachu chooses the player. The doc scripts no small scenes, so three are written from the Companion rule. The turning point, two stages on, is Ash arriving late (catalog id ash-training). The afterstory is one scene in each of the next three regions.',
  },
  'aq02-butterfree-migration': {
    shape: 'Companion', earliest: 'A2', home: 16, window: [14, 18], sits: 'optional', tags: ['water'],
    beats: ['aq02-pink-butterfree', 'aq02-sunset', 'aq02-caterpie'],
    note: 'Farewell. The header reads Dusk: a beach. The Butterfree is the kid\'s and the doc gives the player no Pokémon, so the meeting and its escalation (same node) are the whole Companion story; the Caterpie scene is the doc\'s next-region Remembers.',
  },
  'aq03-flock-leaders-promise': {
    shape: 'Stage-Three', earliest: 'A2', home: 6, sits: 'optional', tags: ['forest'], level: 'A+1',
    beats: ['aq03-refused', 'aq03-night-two', 'aq03-night-three', 'aq03-dawn', 'aq03-pidgey-night-two', 'aq03-pidgey-night-three', 'aq03-asks', 'aq03-visit'],
    note: 'At Night: three nights, steps 6, 12, 17. The raids are A+0, the Fearow leader A+1. In Kanto it is Pidgeotto\'s Farewell\'s longer form: the Farewell (cs-kanto-route-pidgeotto, Kanto canon) is AQ3\'s Stage 5 beat, and AQ3 remembers it.',
  },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

export const LIMITS: Record<string, string[]> = {
  AQ3: [
    'In Kanto the Farewell (cs-kanto-route-pidgeotto) is another thread\'s event and is not rebuilt here; AQ3 reads its flag kanto-pidgeotto-ally (set when you let your Pidgeotto go) and the scarred Pidgeot is that bird.',
    'Afterstory "comes back once, in the last region": the game cannot tell which region is the last, so it comes once, one region or more after the third night.',
  ],
  AQ1: [
    'Remembers "floor and Stand in front": it walks beside you outside its Ball and cannot be put in the PC. The game has no follower or PC lock, so it joins fonder (friendship +40) and the later scenes say it walks outside its Ball.',
    'The afterstory "seen in every later region" is built as one scene in each of the next three regions.',
  ],
};

/** The lab Pikachu: one Pokémon of the Pikachu line (Pikachu or Raichu) in the party. */
const PIKA = 'pikachu';

const DEFEND = (lead: string): Json => fight(`${lead} The first raid comes an hour after dark: Spearow in front, Fearow behind, all screaming.`, beast({ format: 'doubles', species: ['spearow', 'fearow'], win: [flag('aq03-defend'), flag('aq03-night-1'), later('aq03-night-two', 5)] }, { lose: [flag('aq03-defend'), flag('aq03-night-1'), flag('aq03-raid-1-lost'), later('aq03-night-two', 5)] }));
const TRAIN = (lead: string): Json => out(`${lead} You pick three Pidgey: the boldest, the fastest, and the smallest, who insisted. All night you throw pine cones at them and they learn to dodge. By the end of it the smallest one dodges a cone and catches it. The Pidgeot watches from the top of the tree, and for the first time it closes its eyes.`, flag('aq03-train'), flag('aq03-night-1'), later('aq03-pidgey-night-two', 5));

export const EVENTS: Json[] = [
  // ---------------- AQ1. The One That Wouldn't Go in Its Ball ----------------
  ev('aq01-wouldnt-go-in-its-ball', 'The One That Wouldn\'t Go in Its Ball', AQ, { rarity: 'uncommon', minStage: stageOf('A1'), types: tagTypes(), cast: ['trainer.pr/scientist_m'], pokemon: 'pikachu', tint: '#2a2c3a', effect: 'flicker',
    remembers: [
      { id: 'two-pikachu', when: [{ kind: 'starter', species: 'pikachu' }], notice: 'Your own Pikachu climbs down from your shoulder. The two of them look at each other across the lab floor, cheeks crackling, and something in the wild one goes very still.',
        addChoices: [ch('Let the two Pikachu meet.', out('Your Pikachu walks over as if it owns the lab. They touch noses. A small spark jumps between them, the way two people shake hands. The lab Pikachu\'s fur goes flat for the first time all week. It recognises something in your partner: a Pikachu that chose its person. It looks at you again, longer this time.', flag('aq01-lab'), flag('aq01-pika-calmed'), room('aq01-spearow')))] },
    ] },
    'A professor\'s lab, early morning. Papers on every surface, and one empty corner nobody goes near. In it sits a Pikachu with its ears flat and its cheeks fizzing. A red and white Ball lies open beside it, and it will not look at the Ball. "This one\'s been here a week," the professor sighs. "It won\'t go in. It bit my assistant." He rubs his own thumb, which is also bandaged. "Someone\'s coming to pick a starter today. A boy. He overslept." The Pikachu looks at you. Then at the Ball. Then away, hard, at the wall.',
    [
      ch('Leave the Ball on the table.', out('You set the Ball down on the table, out of its reach, and step back. Nothing happens for a long minute. Then the Pikachu creeps over, sniffs the Ball all round, and sits on it. Firmly. Like a lid. The professor laughs so hard he has to hold the desk. "Well! That\'s the closest it\'s been to one all week."', flag('aq01-lab'), flag('aq-pika-ball'), room('aq01-spearow'))),
      ch('Pick it up.', out('You reach for it. It does not bite. It does something worse. A Thundershock runs up your arm and makes your hair stand on end, and for a second you can taste copper. The professor laughs until he cries. "That\'s a yes, by the way. That\'s how it says hello to people it likes. It bit the last one."', flag('aq01-lab'), flag('aq-pika-shocked'), room('aq01-spearow'))),
      ch('Sit on the floor next to it.', out('You sit down on the cold floor, not too close, and look at the same bit of wall it is looking at. You do not reach out. You do not say anything clever. After a minute it shuffles sideways, a little at a time, until its tail is against your knee. It keeps looking at the wall. So do you. The professor tiptoes out to make tea.', flag('aq01-lab'), flag('aq-pika-floor'), room('aq01-spearow'))),
    ]),
  ev('aq01-spearow', 'The Spearow at the Window', AQ, { room: true, cast: ['trainer.pr/scientist_m'], pokemon: 'spearow', tint: '#3a2a22', effect: 'shake',
    remembers: [
      { id: 'floor', when: [flagIs('aq-pika-floor')], notice: 'The Pikachu is pressed against your legs. It sat beside you on the floor. It has already decided which side of you is safe.',
        hide: [0],
        addChoices: [ch('Stand in front of it.', out('You step between it and the glass. The window bursts and the flock hits you all at once, beaks and wings and noise, and you keep your arms out and do not move. Behind you, something small climbs your back, stands on your shoulder, and lets go. It is the biggest Thunderbolt the lab has ever seen. Every light in the building pops. The Spearow scatter, smoking. In the dark, the Pikachu sits down on your shoulder and stays there. It will not be in a Ball. It will be beside you, every step, for as long as you walk.', gain('pikachu', { bond: 40 }), flag('aq01-pika-joined'), flag('aq01-pika-stood'), flag('aq01-pika-walks'), moment('The Pikachu that would not go in its Ball chose you, and walked beside you instead.', 70)))] },
      { id: 'shocked', when: [flagIs('aq-pika-shocked')], notice: 'Your arm still tingles from its hello. It glances at your hand, then at the window, then back at your hand.' },
    ] },
    'A crack at the window. Outside, a boy you do not know is running away, and a Spearow is shaking off the rock he threw at it. It screams. The whole hedge answers. Twenty Spearow come up out of the green at once, furious, and they are not looking for the boy. They are looking for anything small and yellow. The professor goes white. "Not again." The Pikachu stands up, every hair on end, and the lab smells of thunder.',
    [
      ch('Stand in front of it.', out('You step between it and the glass. The window bursts and the flock hits you all at once, beaks and wings, and you keep your arms out. Behind you, the Pikachu climbs your back and lets go. It is the biggest Thunderbolt the lab has ever seen. Every bulb in the building pops. The Spearow scatter, smoking. In the dark, a small warm weight settles on your shoulder. It has chosen.', gain('pikachu', { bond: 30 }), flag('aq01-pika-joined'), flag('aq01-pika-stood'), moment('The Pikachu that would not go in its Ball chose you at the lab window.', 65))),
      ch('Get it inside.', out('You scoop it up and run for the back room. It wriggles like a fish, bites your sleeve, and is gone through your arms and out of the broken window, alone, into all twenty of them. It wins. It is badly hurt doing it. When you carry it in afterwards it lets you, this time, and it watches your face the whole way, as if it is trying to work out why you came back for it.', gain('pikachu', { bond: 10 }), flag('aq01-pika-joined'), flag('aq01-pika-hurt'), moment('The Pikachu fought the whole Spearow flock alone, and then let you carry it home.', 55))),
      ch('Let it fight.', out('You step aside. It goes out of the window like a thrown stone, and for a long minute the hedge is all sparks and screaming. It wins. Barely. It comes back singed, one ear bent, and it stops on the sill and looks at you as if to ask why you did not help. Then it comes in anyway, and sits by your boot, and that is an answer of a kind.', gain('pikachu', { bond: 15 }), flag('aq01-pika-joined'), flag('aq01-pika-asked-why'), moment('The Pikachu beat the Spearow flock alone, and asked you a question with one look.', 55))),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party (the doc scripts none; written from the Companion rule).
  ev('aq01-pika-center', 'Not Even for the Nurse', AQ, { callback: true, requires: [flagIs('aq01-pika-joined'), line(PIKA, 1), age('aq01-pika-joined', 1)], cast: ['trainer.pr/nursery_aide'], pokemon: 'pikachu', tint: '#3a2a30', effect: 'none',
    remembers: [{ id: 'sat-on-ball', when: [flagIs('aq-pika-ball')], notice: 'It looks at the tray of Balls the way it once looked at the one on the lab table, as if it might have to sit on all of them.' }] },
    'A Pokémon Center, and a tired nurse with a tray of Balls for the healing machine. "Its Ball, please." The Pikachu climbs to the top of your head and sits there with its arms folded. The nurse waits. The Pikachu waits. A queue forms. Somebody in the queue starts to laugh.',
    [
      ch('Carry it to the machine yourself.', out('You lift it off your head and carry it, in your arms, to the machine. You hold it on the warm plate while the lights run round, and it lets them, because you are holding it. The nurse writes something on a form. "First time I\'ve healed one by hand," she says. "Won\'t be the last, will it?"', bondLine(PIKA, 5), flag('aq01-pika-scene-1'))),
      ch('Ask the nurse to treat it on the counter.', out('She looks at you, then at the Pikachu, then gets out the old kit from under the counter: the one from before the machines. She treats it with a cloth and a spray and a lot of patience. It sits very still and very proud. When she is done it pats her hand with one paw, the way you would tip someone.', bondLine(PIKA, 5), flag('aq01-pika-scene-1'))),
    ]),
  ev('aq01-pika-rain', 'Under the Jacket', AQ, { callback: true, requires: [seen('aq01-pika-center'), line(PIKA, 2)], pokemon: 'pikachu', tint: '#1e2a36', effect: 'rain',
    remembers: [{ id: 'walks', when: [flagIs('aq01-pika-walks')], notice: 'It has not been inside a Ball since the lab window. It is not going to start for a little rain.' }] },
    'Rain, sudden and cold, on an open road. A Pikachu hates being wet. Its fur goes spiky and then flat, and its cheeks spit tiny sparks that fizzle out. Its Ball is right there on your belt. It looks at the Ball. It looks at you. Its teeth are chattering.',
    [
      ch('Open your jacket.', out('You unzip your jacket and it is inside before you finish, a small wet furnace against your chest. It sneezes. It shocks you, just a little, by accident, and goes rigid as if waiting to be put down. You zip the jacket up to its chin instead. You walk the whole road like that. It falls asleep halfway.', bondLine(PIKA, 5), flag('aq01-pika-scene-2'))),
      ch('Run for the trees together.', out('You run. It runs beside you, ears flat, and for a minute you are both soaked and both racing and it is, somehow, a game. You reach the trees at the same time. It shakes itself all over you on purpose. Then it sits on your foot to keep its own feet dry, and leans on your leg, and does not move until the rain stops.', bondLine(PIKA, 5), flag('aq01-pika-scene-2'))),
    ]),
  ev('aq01-pika-ball', 'The Ball in the Grass', AQ, { callback: true, requires: [seen('aq01-pika-rain'), line(PIKA, 3)], pokemon: 'pikachu', tint: '#2a3a24', effect: 'glint' },
    'Its Ball falls off your belt on a steep path and rolls into the long grass. You do not notice. The Pikachu does. When you look back, it is standing in the path with the Ball in both arms, holding it out to you like something it found and thought you might want. It has never touched that Ball before.',
    [
      ch('Let it keep the Ball.', out('"You hang on to it." It looks at the Ball, then at you, and then carries it the rest of the way, like a lunchbox. That night it sleeps curled round it. It still will not go inside. That was never what the Ball was for, it turns out. It was for being given back.', bondLine(PIKA, 5), flag('aq01-pika-scene-3'), flag('aq01-pika-keeps-ball'))),
      ch('Put the Ball away for good.', out('You take the Ball and put it at the very bottom of your bag, under everything, where nobody could ever find it in a hurry. The Pikachu watches you do it. Then it climbs onto your shoulder, puts both paws on your head, and stays there for the whole of the next road, like a hat that has made up its mind.', bondLine(PIKA, 5), flag('aq01-pika-scene-3'))),
    ]),
  // The turning point: two stages after it chose the player, while it is still in the party. Ash arrives, late (catalog id ash-training).
  ev('ash-training', 'Ash\'s Training', AQ, { callback: true, minStage: stageOf('A3'), requires: [flagIs('aq01-pika-joined'), age('aq01-pika-joined', 2), line(PIKA)], cast: ['boss.ash'], pokemon: 'bulbasaur', tint: '#2a3a2a', effect: 'sparkle',
    remembers: [
      { id: 'walks', when: [flagIs('aq01-pika-walks')], notice: 'He sees the Pikachu riding on your shoulder, no Ball anywhere, and his whole face lights up. "No Ball? That\'s the coolest thing I\'ve ever seen."' },
      { id: 'shocked', when: [flagIs('aq-pika-shocked')], notice: 'He holds out a hand to the Pikachu. You open your mouth to warn him. Too late. He stands there smoking, grinning. "Ha! It likes me!"' },
      { id: 'asked-why', when: [flagIs('aq01-pika-asked-why')], notice: 'The Pikachu is watching you, not him. Since the Spearow, it watches to see whether you will step in. Today, you can show it.' },
    ] },
    'Someone is running up the road behind you, shouting. A boy about your age, one shoe untied, a pyjama top showing under his jacket, a Bulbasaur trotting after him. "Wait! Wait up!" He stops, hands on his knees. "I overslept. Then I got lost. The professor said the Pikachu went with you, so he gave me this one." He beams at the Bulbasaur. "Honestly? We\'re great." He is Ash. He looks at your Pikachu with pure delight. "Hey! Wanna battle? My partner\'s all fired up!"',
    [
      ch('Battle him.', fight('"Yes!" He flips his cap round. The Bulbasaur plants its feet. Your Pikachu is down off your shoulder before you call it.', duel('Ash', { cls: 'rival', size: 2, team: ['bulbasaur', 'caterpie'], win: [bondLine(PIKA, 10), flagAt('aq01-ash-trained'), flag('reunion-guest-ash'), room('aq01-ash-goodbye')] }, { sprite: 'ash', lose: [bondLine(PIKA, 5), flagAt('aq01-ash-trained'), flag('aq01-ash-won'), flag('reunion-guest-ash'), room('aq01-ash-goodbye')] }))),
      ch('Train together.', out('You train until the sun goes orange. He is terrible at plans and wonderful at not giving up. Your Pikachu and his Bulbasaur go at each other again and again, and every time one of them falls down, the other waits for it to get up. By the end your Pikachu has learned to dodge a vine it could not dodge at noon. Ash is lying flat on the grass, laughing at the sky.', bondLine(PIKA, 5), lv(1, { species: ['pikachu', 'raichu'] }), flagAt('aq01-ash-trained'), flag('aq01-ash-trained-together'), flag('reunion-guest-ash'), room('aq01-ash-goodbye'))),
      ch('Ask if he minds about the Pikachu.', out('He thinks about it properly, which you did not expect. "I did, for about a minute." He scratches the Bulbasaur under its bulb. "But it picked you. You can\'t make something pick you. And this one picked me." The Bulbasaur leans on his leg. "So I think it all worked out." Then he trains with you anyway, until the light goes.', bondLine(PIKA, 5), flagAt('aq01-ash-trained'), flag('aq01-ash-fine'), flag('reunion-guest-ash'), room('aq01-ash-goodbye'))),
    ]),
  ev('aq01-ash-goodbye', 'See You at the End', AQ, { room: true, cast: ['boss.ash'], pokemon: 'pikachu', tint: '#3a3420', effect: 'sparkle' },
    'Evening. Ash ties his shoe at last. His Bulbasaur is asleep against his bag. Your Pikachu is on your shoulder, cheeks still faintly glowing from the day. "We\'re going the other way," Ash says. "But we\'ll catch up. Everybody does, at the end."',
    [
      ch('"See you at the end."', out('He holds out his fist. Your Pikachu, without being asked, bumps it with one tiny paw, and lets off the smallest spark in the world. Ash laughs all the way down the road. You can still hear him at the bend. The Pikachu watches him go and then turns, settles, and faces the way you are walking.', moment('Ash arrived late, got a Bulbasaur, was fine about it, and trained with you until dark.', 70))),
    ]),
  // Afterstory: a Pikachu outside its Ball, on someone's shoulder, in each later region.
  ev('aq01-shoulder-1', 'On Someone\'s Shoulder', AQ, { callback: true, requires: [flagAgo('aq01-ash-trained', 1)], cast: ['trainer.pr/school_kid_m'], pokemon: 'pikachu', tint: '#2a3a2a', effect: 'none' },
    'A new region, a new road. A small boy comes the other way with a Pikachu riding on his shoulder, no Ball on his belt at all. He stops and stares at you. "Are you the one? Everybody says somebody walks with their Pikachu outside the Ball. So I tried it. It works."',
    [
      ch('"It works."', out('He grins and goes on his way, the Pikachu holding onto his ear for balance. You did not know anyone had been watching. Somewhere back down the road, a lab has a broken window and a story about it.', flagAt('aq01-shoulder-1'), fr(2))),
    ]),
  ev('aq01-shoulder-2', 'On Someone\'s Shoulder', AQ, { callback: true, requires: [flagAgo('aq01-shoulder-1', 1)], cast: ['trainer.fisherman'], pokemon: 'pikachu', tint: '#1e2a36', effect: 'none' },
    'Another region. An old man fishing off a pier, and on his shoulder, wearing a tiny knitted hat against the wind, a Pikachu. Its Ball is hanging on a hook on the pier post, being used to hold his bait. "Never would go in," he says, without looking round. "Somebody told me that was allowed now."',
    [
      ch('"It is."', out('He nods, as if that settles a long argument. The Pikachu in the knitted hat looks at you and lifts one paw. You lift yours. It is a small, silly, solemn thing, and it makes the whole day better.', flagAt('aq01-shoulder-2'), fr(2))),
    ]),
  ev('aq01-shoulder-3', 'On Someone\'s Shoulder', AQ, { callback: true, requires: [flagAgo('aq01-shoulder-2', 1)], cast: ['trainer.pr/ace_trainer_f'], pokemon: 'pikachu', tint: '#3a3420', effect: 'sparkle' },
    'Far from where it started. A trainer walks out of a Gym, beaten and laughing, a Pikachu on her shoulder and its Ball nowhere to be seen. Two children run behind her with their own Pikachu on their own shoulders. It is a parade. It started at one lab window, and nobody here knows that but you.',
    [
      ch('Watch the parade go by.', out('You stand at the side of the road and let it pass: three Pikachu on three shoulders, sparking at each other, cheering. You do not tell anyone how it began. You do not need to. It is enough to know.', flag('aq01-shoulder-3'), fr(3), moment('In every region after the lab, someone walked with a Pikachu on their shoulder.', 50))),
    ]),

  // ---------------- AQ2. The Butterfree Migration ----------------
  ev('aq02-butterfree-migration', 'The Butterfree Migration', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: tagTypes('water'), cast: ['trainer.pr/school_kid_m'], pokemon: 'butterfree', tint: '#4a2a3a', effect: 'float',
    remembers: [
      { id: 'flight-north', when: [seen('cs-kanto-vermilion-flight-goodbye'), anyType('bug')], notice: 'Your own Bug-type comes and sits beside you on the sand. It watches the flock with you, very still. It knows what it is to be the one who flies north, and the one who stays.' },
    ] },
    'A beach at sunset, the sea gone the colour of peaches. Above it, a thousand Butterfree, so many that their shadow moves across the sand like weather. They are all flying out over the water. One is not. It sits on the sand beside a boy, wings folded, looking up. "It\'s their season," the boy says. "They all fly over the sea. Every year." He swallows. "It\'s never left me. Not once." The Butterfree looks up. "I don\'t want it to go. But it keeps looking up."',
    [
      ch('Let it go.', out('The boy breathes in like someone about to jump into cold water. "Go on, then." The Butterfree lifts off the sand. It does not go straight up. It circles him once, twice, three times, so close its wings brush his hair. Then it rises into the flock and is one of a thousand, and he cannot tell which one, and he keeps waving anyway.', flagAt('aq02-flew'), flag('aq02-let-go'), room('aq02-pink-butterfree'))),
      ch('Ask it.', out('The boy holds out his arm. "Do you want to go?" The Butterfree climbs onto his shoulder instead and stays there for a long moment, pressed against his ear, as if telling him something only he can hear. Then it lets go and flies. He does not cry until it is gone. Then he does, and that is all right.', flagAt('aq02-flew'), flag('aq02-asked'), room('aq02-pink-butterfree'))),
      ch('It\'s your choice.', out('He looks at you as if you have handed him something too heavy. Then he gathers the Butterfree up in both arms and holds on. It lets him. It stays. Over the next hour it stops looking up, a little at a time, and its wings are not quite as bright as they were. He does not see that yet. You do.', flag('aq02-kept'), room('aq02-pink-butterfree'))),
    ]),
  ev('aq02-pink-butterfree', 'The Pink One', AQ, { room: true, cast: ['trainer.roughneck'], pokemon: 'butterfree', tint: '#4a2a3a', effect: 'net',
    remembers: [
      { id: 'kept', when: [flagIs('aq02-kept')], notice: 'On the boy\'s arm, his Butterfree goes rigid, watching the pink one. Its wings open and close, open and close, as if it has forgotten it is not up there.' },
      { id: 'flew', when: [flagIs('aq02-flew')], notice: 'The boy grabs your sleeve. "That\'s mine! Beside the pink one! It\'s trying to help!"' },
    ] },
    'Something is wrong in the flock. Near the front flies a Butterfree that is pink, not white, and behind it, low over the water, comes a hot-air balloon with a net hanging under it like a mouth. Two men lean out of the basket. "The pink one! Get the pink one, it\'s worth ten of the rest!" The net swings. The flock breaks apart around it, screaming in that soft, dry way Butterfree scream.',
    [
      ch('Stop the balloon.', fight('You run down the beach to where the basket skims the sand and shout loud enough to make them look. They do. They drop a ladder and come down swinging.', duel('Balloon Poachers', { cls: 'roughneck', size: 2, types: ['flying', 'normal'], win: [flag('aq02-balloon-stopped'), room('aq02-sunset')] }, { lose: [flag('aq02-balloon-stopped'), flag('aq02-balloon-lost'), room('aq02-sunset')] }))),
      ch('Let the flock deal with it.', out('You hold the boy back. The flock turns, all thousand at once, and comes down on the balloon like a white storm. Sleep Powder. Gust. More Gust. The poachers sag asleep in the basket and the balloon is blown out to sea, net and all, and nobody will see them again for days. But it costs the flock. Butterfree drop to the sand on every side, wings torn, too tired to fly on tonight. The pink one is among them.', flag('aq02-flock-dealt'), room('aq02-sunset'))),
    ]),
  ev('aq02-sunset', 'After the Flock', AQ, { room: true, cast: ['trainer.pr/school_kid_m'], pokemon: 'butterfree', tint: '#3a2a40', effect: 'sparkle',
    remembers: [
      { id: 'kept', when: [flagIs('aq02-kept')], notice: 'His Butterfree is on his shoulder. It is looking up again. He sees it this time. He does not say anything, but he puts his hand on its back, very gently, the way you would hold a door.' },
      { id: 'flock-dealt', when: [flagIs('aq02-flock-dealt')], notice: 'All along the beach, tired Butterfree rest on the sand. The boy goes from one to the next with a water bottle, and you go with him, until they can fly.' },
    ] },
    'The sun goes down. The last of the flock is a pale smudge on the horizon, then nothing. The boy sits on the sand and hugs his knees. "Thanks for staying." He digs in his pocket and holds out a little paper twist. Inside is a soft, silver dust that shines without any light on it. "It left this on my pillow every morning. I\'ve got jars of it. You have some."',
    [
      ch('Sit with him until dark.', out('You sit with him until the stars come out. He tells you its whole life: the Caterpie in the cabbage patch, the cocoon that took a week, the morning it first flew and landed on his face. When you go, he shakes your hand like a grown-up. "Come and see us. At the end of everything. We\'ll be there."', item('silver-powder'), flag('aq02-kid-friend'), flag('reunion-guest-butterfree-kid'), moment('On a beach at sunset, a thousand Butterfree flew over the sea, and a boy you met there became your friend.', 60))),
    ]),
  // Remembers: if the kid let it go, in the next region a Caterpie he caught is evolving.
  ev('aq02-caterpie', 'A New Cocoon', AQ, { callback: true, requires: [flagIs('aq02-kid-friend'), flagAgo('aq02-flew', 1)], cast: ['trainer.pr/school_kid_m'], pokemon: 'caterpie', tint: '#2a3a24', effect: 'sparkle',
    remembers: [{ id: 'asked', when: [flagIs('aq02-asked')], notice: '"I asked this one too," he says. "Whether it wanted to come with me. It climbed in my hat. That\'s a yes, right?"' }] },
    'A new region, and a voice you know. "Hey! HEY! It\'s you!" The boy from the beach comes running, with a Caterpie clinging to the front of his shirt. "I caught one. A new one. I didn\'t want to, at first." He stops. The Caterpie on his shirt has begun to glow, a soft white light, right there on the road. "Oh. Oh no. Oh, it\'s happening. Stay. Please stay."',
    [
      ch('Stay and watch it evolve.', out('You stay. The light grows, and the Caterpie hardens into a Metapod in the boy\'s two cupped hands, green and still and warm. He laughs and cries at the same time. "It\'ll fly away one day too," he says. "That\'s all right. That\'s what they\'re for. You let them." He has grown up a little since the beach. So, you think, have you.', flag('aq02-caterpie-evolved'), fr(3))),
      ch('Cheer it on.', out('You cheer, loudly, like it is a race. The boy joins in. Passers-by stop and stare, and then they cheer too, a whole road full of strangers cheering a Caterpie. It becomes a Metapod to applause. The boy holds it up like a trophy. "One day," he says, "I\'m going to let this one go too. And I\'m going to be happy about it."', flag('aq02-caterpie-evolved'), fr(3))),
    ]),

  // ---------------- AQ3. The Flock Leader's Promise ----------------
  ev('aq03-flock-leaders-promise', 'The Flock Leader\'s Promise', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: tagTypes('forest'), cast: ['trainer.pr/ranger_f'], pokemon: 'pidgeot', tint: '#141c2a', effect: 'fog',
    remembers: [
      { id: 'kanto-pidgeotto', when: [flagIs('kanto-pidgeotto-ally')], notice: 'The scarred Pidgeot turns its head and looks straight at you. You know that look. You let a Pidgeotto go, once, on a road not far from here. It has grown. It remembers you.' },
    ] },
    'A forest at night, and every branch is full of Pidgey, wide awake, packed wing to wing. Nobody sleeps here any more. Every night a Fearow flock comes through and takes what it can. On the highest branch sits a Pidgeot, scarred across the chest, feathers ragged, eyes open. A ranger lowers her torch. "That\'s the flock\'s leader," she says. "It won\'t leave again. It\'s wearing itself out." The Pidgeot speaks, and somehow you understand it. "I left once. I promised I\'d come back. I came back too late for some of them."',
    [
      ch('Help it defend the forest.', DEFEND('The Pidgeot looks at you for a long moment, then dips its head: once. It is not a thank-you. It is a place in the line.')),
      ch('Take it with you.', out('You hold out your arm to it. The Pidgeot does not even look at the arm. It turns back to the dark beyond the trees. "No," it says, in the way it says things. "Not again. Never again." The ranger shakes her head at you, kindly. "It won\'t. Not while they need it."', flag('aq03-asked-to-come'), room('aq03-refused'))),
      ch('Train the Pidgey.', TRAIN('"It can\'t guard them forever," you tell the ranger. "They have to guard themselves." The Pidgeot hears. It does not stop you.')),
    ]),
  ev('aq03-refused', 'It Will Not Leave', AQ, { room: true, cast: ['trainer.pr/ranger_f'], pokemon: 'pidgeot', tint: '#141c2a', effect: 'fog' },
    'The Pidgeot stays on its branch, facing the dark. Below it, a hundred small Pidgey huddle and watch you to see what you will do now. The ranger hands you a spare torch. "It said no to you. It didn\'t say no to help."',
    [
      ch('Help it defend the forest.', DEFEND('You take up the torch. The Pidgeot sees it, and moves along its branch to make room.')),
      ch('Train the Pidgey.', TRAIN('If it will not leave them, they will have to be strong enough that it could. You roll up your sleeves.')),
      ch('Walk on.', leave('You leave the forest the way you came. Behind you, all night, there is screaming in the trees, and one big bird that does not sleep.')),
    ]),
  ev('aq03-night-two', 'The Second Night', AQ, { room: true, requires: [flagIs('aq03-defend')], cast: ['trainer.pr/ranger_f'], pokemon: 'fearow', tint: '#141c2a', effect: 'fog' },
    'The second night. The Fearow have counted their losses and come back with more. You hear them before you see them: wings like canvas tearing, coming in low over the treetops. The Pidgeot drops off its perch to meet them. It is slower than last night. Its left wing is not quite right.',
    [
      ch('Hold the line with it.', fight('You step out beside it, and the raid breaks around the two of you like water round a stone.', beast({ format: 'doubles', species: ['fearow', 'spearow'], win: [flag('aq03-night-2'), later('aq03-night-three', 5)] }, { lose: [flag('aq03-night-2'), flag('aq03-raid-2-lost'), later('aq03-night-three', 5)] }))),
    ]),
  ev('aq03-night-three', 'The Third Night', AQ, { room: true, requires: [flagIs('aq03-defend')], cast: ['trainer.pr/ranger_f'], pokemon: 'fearow', tint: '#101420', effect: 'shake',
    remembers: [
      { id: 'pidgeys-resolve', when: [seen('sky.opening')], notice: 'You know this Fearow. It was a Spearow once, on a road, fighting a Pidgey over a branch for no reason either of them would say. It sees you, and it knows you too.' },
    ] },
    'The third night, and no stars. The Fearow leader comes alone this time, which is worse. It is huge, and old, and it lands on the Pidgeot\'s own branch, and the branch bends. The two birds look at each other. They have done this before, many times, over many years. The Pidgeot is shaking. It does not move back.',
    [
      ch('Drive off the Fearow leader.', fight('You step out under the branch and whistle. The Fearow leader looks down at you, then drops off the branch and comes.', monDuel('The Fearow Leader', 'fearow', 1, { win: [flag('aq03-fearow-driven'), room('aq03-dawn')], lose: [flag('aq03-fearow-driven'), flag('aq03-fearow-fight-lost'), room('aq03-dawn')] }))),
    ]),
  ev('aq03-pidgey-night-two', 'The Second Night', AQ, { room: true, requires: [flagIs('aq03-train')], cast: ['trainer.pr/ranger_f'], pokemon: 'pidgey', tint: '#141c2a', effect: 'fog' },
    'The second night. Your three Pidgey are waiting on the low branch, in a row, chests out, as if they have been there since dawn. They probably have. Then the sound comes: wings like canvas tearing, low over the treetops. The Fearow have counted their losses and come back to test the forest.',
    [
      ch('Drill the three Pidgey.', out('The raid comes, smaller tonight: testing. The three Pidgey go up to meet it before you can say anything. The boldest takes a Spearow head-on. The fastest leads two in circles until they crash into each other. The smallest hides, then comes out of nowhere with a Gust that knocks one clean off a branch. The raiders go. The Pidgeot has not left its perch. It did not need to.', flag('aq03-night-2'), flag('aq03-pidgey-drilled'), later('aq03-pidgey-night-three', 5)), { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('The raid comes, smaller tonight: testing. The three Pidgey go up too soon and too far apart, and the Pidgeot has to come down off its perch to pull them out of it. Nobody is taken. They are shaken, and so are you. "Tomorrow," the ranger says. "They\'ll get it tomorrow."', flag('aq03-night-2'), flag('aq03-pidgey-shaky'), later('aq03-pidgey-night-three', 5)) }),
    ]),
  ev('aq03-pidgey-night-three', 'The Third Night', AQ, { room: true, requires: [flagIs('aq03-train')], cast: ['trainer.pr/ranger_f'], pokemon: 'fearow', tint: '#101420', effect: 'shake',
    remembers: [
      { id: 'pidgeys-resolve', when: [seen('sky.opening')], notice: 'You know this Fearow. It was a Spearow once, on a road, fighting a Pidgey over a branch for no reason either of them would say. It sees you, and it knows you too.' },
    ] },
    'The third night, and no stars. The Fearow leader comes alone, huge and old, and lands on the Pidgeot\'s own branch. The branch bends. But the three Pidgey are in the air before it has folded its wings, and the whole flock is behind them: a hundred small birds, not hiding. The Pidgeot watches from below. It does not move. It does not have to.',
    [
      ch('Fight it with the flock behind you.', fight('A hundred Pidgey scream at once. The Fearow leader has never heard that sound from this forest.', monDuel('The Fearow Leader', 'fearow', 1, { win: [flag('aq03-fearow-driven'), room('aq03-asks')], lose: [flag('aq03-fearow-driven'), flag('aq03-fearow-fight-lost'), room('aq03-asks')] }), temp('The flock at your back', [{ kind: 'damageTakenMultiplier', value: 0.85 }], 1))),
    ]),
  ev('aq03-dawn', 'Dawn in the Trees', AQ, { room: true, cast: ['trainer.pr/ranger_f'], pokemon: 'pidgeot', tint: '#3a3420', effect: 'sparkle',
    remembers: [{ id: 'lost-fight', when: [flagIs('aq03-fearow-fight-lost')], notice: 'You went down under the Fearow\'s wings. It was the Pidgeot that came down off its branch, scarred and slow, and finished it: the last time it will ever have to.' }] },
    'Dawn comes up grey, then gold. The Fearow leader is a dot going away over the hills, and it does not look back. All through the forest, the Pidgey are falling asleep where they sit, in heaps, for the first time in a long time. The Pidgeot lands on the branch over your head. It looks very tired, and very old, and very glad.',
    [
      ch('Say goodbye.', out('It bows its whole body to you, the way the flock bows to it. "I kept it," it says. "This time I kept it." The ranger sees you to the edge of the trees. When you look back, the Pidgeot is asleep on its branch, at last, with its head under its wing.', heal(1), fr(3), flagAt('aq03-done'), moment('Three nights in a forest of Pidgey, and an old Pidgeot kept its promise.', 60))),
    ]),
  ev('aq03-asks', 'The Leader Asks', AQ, { room: true, cast: ['trainer.pr/ranger_f'], pokemon: 'pidgeot', tint: '#3a3420', effect: 'sparkle',
    remembers: [{ id: 'shaky', when: [flagIs('aq03-pidgey-shaky')], notice: 'The smallest Pidgey has a torn feather from the second night. It does not care. It is standing on the Pidgeot\'s head.' }] },
    'Dawn. The Fearow leader is gone over the hills. Your three Pidgey sit on the low branch, puffed up, too proud to sleep. The Pidgeot lands in front of you. For the first time it is not facing the dark. It is facing you. "They don\'t need me," it says. It does not sound sad. It sounds like someone setting down something heavy. "I would like to see what is past the trees. With you, if you\'ll have me."',
    [
      ch('Take it with you.', out('It climbs onto your arm. It is heavy, and its claws are careful. The three Pidgey take the top branch, all of them at once, and the whole flock settles round them. The Pidgeot looks back only once. Then it turns its face to the road.', gain('pidgeot', { bond: 20 }), flag('aq03-pidgeot-joined'), flagAt('aq03-done'), moment('The flock learned to guard itself, and its old leader came with you.', 70))),
      ch('Tell it to rest here.', out('"You\'ve flown enough." It thinks about that for a long moment, and then it lets out a long breath and folds its wings. It does not go back to the high branch. It sleeps in the middle of the flock, warm, surrounded. Your three Pidgey take the watch.', fr(3), flagAt('aq03-done'), flag('aq03-pidgeot-rests'), moment('Three nights in a forest of Pidgey, and an old Pidgeot finally slept.', 60))),
    ]),
  // Afterstory: a Pidgeot comes back once, in a later region, to visit.
  ev('aq03-visit', 'A Visitor From the Forest', AQ, { callback: true, requires: [flagAgo('aq03-done', 1)], pokemon: 'pidgeot', tint: '#2a3a4a', effect: 'float',
    remembers: [{ id: 'joined', when: [flagIs('aq03-pidgeot-joined')], notice: 'This is not your Pidgeot. It is one of the three: the smallest, the one that insisted, grown huge. It lands in front of its old leader and bows.' }] },
    'A shadow crosses the road, comes round again, and lands. A Pidgeot, big and glossy, with no scars at all. It has flown a long way. It walks up to you as if it has every right to, and taps your bag with its beak, the way you would knock on a door.',
    [
      ch('Let it rest a while.', out('It stays an afternoon. It eats from your hand. It tells you, in its way, that the forest is loud now, and full, and nobody is afraid at night. Then it goes, the way they all go, straight up and then away, toward home.', fr(3), flag('aq03-visited'), moment('A Pidgeot flew a whole region to tell you the forest was safe.', 50))),
    ]),
];

export const CHECKED: Record<string, string> = { AQ1: '2026-11-15', AQ2: '2026-11-15' };

export const REMOVE: string[] = [];
