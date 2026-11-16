// Catalog Overhaul Pack, category "singles" (revised single events), batch 7.
// Doc: catalog_overhaul/STORY_FAMILIES_21.md SF146 Study Stops, SF147 Evil-Team Pressure, SF148 Puzzles.
// Known limits: docs/status/co-singles.md.
import { $, any, anyType, bondUp, ch, express, fight, flag, flagIs, good, gym, item, join, leave, out, reveal, room, trainer, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
const knows = (move: string): Json => ({ kind: 'partyMove', move });
const seen = (id: string): Json => ({ kind: 'eventSeen', id });
const shard: Json = { kind: 'train', what: 'masteryShard' };
const later = (eventId: string, nodes = 3): Json => ({ kind: 'laterEvent', eventId, nodes });
const rm = (id: string, name: string, group: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group, room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
const grunt = (name: string, o: Json = {}): Json => ({ ...trainer(name, { cls: 'roughneck', size: 3, lv: 1, ...o }), evil: 'grunt' });
const TM = ['tm-normal', 'tm-fighting', 'tm-flying', 'tm-poison', 'tm-ground', 'tm-rock', 'tm-bug'];
const RARE = ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'choice-specs', 'choice-scarf'];
const EPIC = ['comet-shard', 'sacred-ash', 'poke-radar', 'super-rod', 'x-attack-6', 'x-speed-6'];

// ---------- SF146. STUDY STOPS ----------
// "The next opponent" is the stage's Gym Leader: the Gym preview shows their whole team (Known limits).
const SF146: Json[] = [
  {
    id: 'battle-replay-theater',
    intro: 'A little cinema with one screen and twelve seats. **The usher**, tearing tickets that nobody bought: "Free for trainers. Tonight\'s feature: the Leader up the road, last week, start to finish."',
    choices: [
      ch('Watch.', out('You sit in the dark with your team in the seats beside you, popcorn everywhere, and watch the Leader send out their lead, and then everything after it.', gym())),
    ],
  },
  {
    id: 'library',
    intro: 'Quiet shelves, dust in the light, rows and rows of Pokédex entries bound in green. Somewhere a clock ticks. A librarian puts a finger to her lips, and then points you toward the Gym section.',
    choices: [
      ch('Read.', out('You read until the lamps come on. By the end you know the Leader\'s ace, and the move it opens with, and a good deal more.', gym())),
    ],
  },
  {
    id: 'mastery-quiz',
    intro: '**A quiz host** behind a podium, with a stack of cards: "Species questions! About your own lead! Get them right, and you take home a Mastery Shard, and a tip about the Leader\'s ace."',
    choices: [
      ch('Answer.', out('You know your lead better than you know yourself. Every answer right. The host hands over a Mastery Shard, and leans in to whisper the name of the Leader\'s ace.', shard, gym()), { check: 'intelligence', fail: out('You fumble one question about your own lead, who looks at you with enormous disappointment. "Next time!" says the host.') }),
    ],
  },
  {
    id: 'study-hall',
    intro: 'A quiet room of books and long tables, students bent over notes. A whiteboard at the front has the Gym Leader\'s name on it, and a lot of arrows.',
    choices: [
      ch('Study (a node).', out('You sit down and study, properly, all afternoon. When you stand up, stiff, you know the Leader\'s ace and how to answer it.', { kind: 'takeNode', nodes: 1 }, gym())),
    ],
  },
  {
    id: 'tactical-chalkboard',
    intro: '**A coach** at a chalkboard, chalk in one hand and a whistle in the other: "Know the enemy\'s lead. Everything else follows."',
    choices: [
      ch('Analyse.', out('He draws the Leader\'s lead on the board, badly, and then explains it, very well.', gym())),
    ],
  },
  {
    id: 'veterans-notebook',
    intro: 'A battered notebook lying on a bench. On the open page, in big angry capitals: "WEAK TO SURF!!" Inside the cover, a name and an address, two streets away.',
    choices: [
      ch('Read it.', out('You read one page, the one it fell open at. One fact about the Leader up the road, underlined three times.', gym())),
      ch('Return it to the name.', out('An old woman opens the door, sees the notebook, and puts her hand on her heart. "My husband\'s. I thought it was gone." She makes you tea and tells you everything in it: the Leader\'s lead, the ace, and the one move to fear.', gym(), good(1), moment('Returned a veteran\'s notebook to his widow.', 45))),
    ],
  },
  {
    id: 'graduation-ceremony',
    intro: '**An examiner** in a gown, two Mastery Shards on a velvet cushion beside her: "Pass the final, and these are yours. Fail, and you sit it again next year."',
    choices: [
      ch('Take the assessment.', fight('She sets down the cushion and stands. The final is a battle.', trainer('Examiner', { cls: 'veteran', size: 3, lv: 2, win: [shard, shard, moment('Graduated: two Mastery Shards.', 45)] }))),
    ],
  },
  {
    id: 'field-hidden-cave',
    intro: 'A dark cave mouth, a rock wedged across a gap, and a cliff with handholds worn into it. Each leads somewhere small and hidden, if a Pokémon knows the way.',
    choices: [
      ch('Flash.', out('Light fills the cave. In the dust at the back, a Max Ether, left by someone who never came back for it.', item('max-ether')), { requires: [knows('flash')] }),
      ch('Rock Smash.', out('The rock splits. Behind it, a little hollow, and a PP Up.', item('pp-up')), { requires: [knows('rock-smash')] }),
      ch('Rock Climb.', out('Up the cliff, hand over hand, your Pokémon ahead of you. At the top, a nest of old feathers and a Star Piece.', item('star-piece')), { requires: [knows('rock-climb')] }),
      ch('Walk on.', leave()),
    ],
  },
  {
    id: 'field-overgrowth',
    intro: 'A tree grown across the path, a boulder in a gap, a pond with an island in the middle. Each hides a little something, if a Pokémon knows the move.',
    choices: [
      ch('Cut.', out('The tree comes down clean. In its hollow trunk, a Miracle Seed.', item('miracle-seed')), { requires: [knows('cut')] }),
      ch('Strength.', out('The boulder rolls aside. Under it, flat and gleaming, a Hard Stone.', item('hard-stone')), { requires: [knows('strength')] }),
      ch('Surf.', out('You ride out to the island. On it, washed up in the reeds, a Mystic Water.', item('mystic-water')), { requires: [knows('surf')] }),
      ch('Walk on.', leave()),
    ],
  },
];

// ---------- SF147. EVIL-TEAM PRESSURE ----------
const SF147: Json[] = [
  {
    id: 'vt-contraband-detector',
    intro: 'A gate across the road with a scanner arch, and a guard in a uniform you do not quite trust. **"Anything shady in the bag?"**',
    choices: [
      ch('No.', out('You walk through. The arch stays quiet. The guard waves you on, bored.'), { branches: keyBranches() }),
      ch('Show him.', out('You open your bag. He pokes through it, finds nothing, and waves you through.'), { branches: keyBranches() }),
    ],
  },
  rm('vt-contraband-gate', 'The Arch Beeps', 'Evil-team pressure', 'The arch shrieks. The guard\'s hand goes to his belt, and then he smiles, slowly. "That key. I know where that\'s from. ₽200 and I didn\'t see it. Or we do this the other way."', [
    ch('Pay the bribe (₽200).', out('You count it out. He pockets it without looking at you. "Have a nice day."', $(-200)), { requires: [money(200)] }),
    ch('Battle.', fight('"The other way, then." He is not a gate guard at all.', grunt('Disguised Grunt', { win: [$(400)] }))),
  ]),
  {
    id: 'vt-gadget-sabotage',
    intro: 'A small humming drone has been following you for three stops, keeping just out of reach, a red light blinking under it. Someone, somewhere, is watching.',
    choices: [
      ch('Knock it down (a Flying- or Electric-type).', out('One hit, and it spins into the grass, sparking, and the red light goes out. Whoever was watching has lost you.', flag('evil-trail-lost'), moment('Knocked down the evil team\'s drone.', 40)), { requires: [anyType('flying', 'electric')] }),
      ch('Wave at it.', out('You wave. The drone hangs there for a second, as if surprised, then darts away. Somewhere, someone has written down exactly which Pokémon leads your team.', flag('evil-knows-lead'))),
    ],
  },
  {
    id: 'vt-mind-control-helmet',
    intro: 'A Pokémon in a flashing helmet stands in the corridor, eyes glazed, perfectly still. Behind it, a grunt sits at a console, typing. The Pokémon does not want to be here. You can see it in its shoulders.',
    choices: [
      ch('Break the console first.', fight('You go for the console. The grunt goes for you. Behind him, the helmet sparks, and the Pokémon shakes its head, and blinks, and looks around as if waking from a long, bad dream.', grunt('Console Grunt', { win: [flag('rescued'), good(1), moment('Broke the mind-control console; the Pokémon woke up confused and grateful.', 55)] }))),
      ch('Battle the Pokémon.', fight('It comes at you with its eyes empty, and every move it makes is somebody else\'s. You have to fight it. You hate it. When it falls, the helmet cracks and falls off, and the Pokémon is free.', wild({ lv: 2, win: [flag('rescued'), moment('Had to fight a mind-controlled Pokémon to free it.', 55)] }))),
    ],
  },
  {
    id: 'vt-ransom-note',
    intro: 'A note pinned to a tree at eye level, in cut-out letters: "WE HAVE YOUR NUGGET. ₽700, OR COME AND GET IT." Below, a crude map with an X on it. You check your bag. It is gone.',
    choices: [
      ch('Pay ₽700.', out('You leave the money under the stone they asked for. When you come back, the Nugget is there instead, with a note: "PLEASURE DOING BUSINESS."', $(-700), item('nugget')), { requires: [money(700)] }),
      ch('Come and get it.', fight('You follow the map to the X. They are waiting, and they did not expect you to come.', grunt('Ransom Grunt', { win: [item('nugget'), moment('Took back a stolen Nugget from the evil team.', 40)] }))),
    ],
  },
  {
    id: 'rescued-callback',
    requires: [flagIs('rescued')],
    callback: true,
    intro: 'A Pokémon steps onto the road with a keeper behind it, and stops dead when it sees you. It is the one you freed. It remembers. It comes straight to you and presses its head into your chest.',
    choices: [
      ch('Say hello.', out('You hold it for a long time. Your lead comes up and touches noses with it, very gently. The keeper says it has been waiting by this road every day. It will be at the Final Reunion, she says; it would not miss it.', bondUp(1, 'lead'), flag('rescued', -1), flag('final-reunion-rescued'), moment('A Pokémon you freed came back to say hello.', 60))),
    ],
  },
  {
    id: 'dz-sky-route',
    intro: 'Updrafts rise from the cliff edge, strong enough to hold a Pokémon up without a single wingbeat. Far out, they make a road in the sky: three long rises, three long glides.',
    choices: [
      ch('Ride them (a Flying-type).', out('Your Flying-type takes you up, and up, and the ground falls away. You ride the first rise, and the second, and the third, and come down three stops further on with your hair full of sky.', { kind: 'skipAhead', nodes: 3 }, bondUp(1, { types: ['flying'] }), moment('Rode the sky route on the updrafts.', 40)), { requires: [{ kind: 'partyType', type: 'flying' }] }),
      ch('Stay on the ground.', leave('You watch the updrafts for a while, and then take the long way round.')),
    ],
  },
];

function keyBranches(): Json[] {
  return [{ when: [flagIs('evil-key')], text: 'The arch shrieks. The guard\'s eyes go to your bag, and stay there.', effects: [room('vt-contraband-gate')] }];
}

// ---------- SF148. PUZZLES ----------
const CARD = [['berry-tree', 'pokemon-center', 'training-ground'], ['rest-meadow', 'hot-spring', 'gym-scout'], ['tide-pools', 'street-tailor', 'rf-bingo-2']];
const CARD_TEXT = 'The card, in nine squares: Berry Tree, Pokémon Center, Training Ground; Meadow Rest, Hot Spring, Gym Scout; Tide Pools, Street Tailor, Second Square.';
const SF148: Json[] = [
  {
    id: 'rf-bingo-1',
    intro: `**An organiser** with a stack of cards and a fat pen: "Tick off events as you travel! Three in a row, a prize. The whole card, a big prize." ${CARD_TEXT}`,
    choices: [
      ch('Take a card.', out('You take one. He ticks nothing yet: "You have to earn them." The card goes in your pocket, and you find yourself looking forward to the next Berry Tree.', flag('bingo-card'), later('rf-bingo-2', 3))),
      ch('Walk on.', leave()),
    ],
  },
  rm('rf-bingo-2', 'Second Square', 'Puzzles', `Another stand, another organiser, the same fat pen. "Card? Let's see." ${CARD_TEXT}`, [
    ch('Mark it.', out('She ticks this square, and every square you have already passed, and hands it back with a wink. "The prize table is a little further on."', later('rf-bingo-3', 3))),
  ]),
  rm('rf-bingo-3', 'Bingo!', 'Puzzles', '**"Bingo?"** the organiser at the prize table asks hopefully, holding out a hand for your card.', [
    ch('Claim it.', out('He checks the card twice. Not a line. "Keep travelling!" He gives you a pen as a consolation prize, which is something.'), { branches: [
      { when: CARD.flat().map(seen), text: 'He checks every square, and then checks them again, and then stands on his chair and shouts "THE WHOLE CARD!" The whole tent applauds. The big prize is yours.', effects: [any(...EPIC), moment('Filled a whole bingo card.', 50)] },
      ...CARD.map((row) => ({ when: row.map(seen), text: '"Bingo!" he shouts. A line, straight across. The prize is yours.', effects: [any(...RARE)] })),
      ...[0, 1, 2].map((c) => ({ when: CARD.map((row) => seen(row[c]!)), text: '"Bingo!" he shouts. A line, straight down. The prize is yours.', effects: [any(...RARE)] })),
    ] }),
  ], { scene: { cast: [], effect: 'sparkle' } }),
  {
    id: 'rf-crossword-cave',
    intro: 'A cave wall carved with a crossword, and one clue glowing: **"Eight letters: a long-dead guardian."** Below it, eight empty squares, each one big enough for a hand.',
    choices: [
      ch('Guardian.', out('You press the letters one by one: G, U, A, R, D, I, A, N. Nothing. A little dust falls. It was never going to be that easy.')),
      ch('Kabutops.', out('K, A, B, U, T, O, P, S. The squares light up one after another, and the whole wall grinds aside.', room('rf-crossword-room'))),
      ch('Omastar.', out('O, M, A, S, T, A, R, and then one empty square, staring at you. Seven letters. You count again.')),
    ],
  },
  rm('rf-crossword-room', 'The Hidden Room', 'Puzzles', 'Behind the wall, a room nobody has stood in for a very long time. Long-forgotten things on shelves: lamps, jars, and, in a case, two fossils.', [
    ch('Search.', out('You search it slowly and carefully, the way it deserves. In the case: a Dome Fossil and an Old Amber, labelled in a hand so old the ink has gone brown.', item('dome-fossil'), item('old-amber'), moment('Found a hidden room behind a crossword.', 45))),
  ], { scene: { cast: [], effect: 'sparkle' } }),
  {
    id: 'rf-fossil-puzzle',
    intro: 'A heap of bones on a tarp, and a scientist on her knees beside them, labelling. "If you can put it together, the Lab will revive it. I can\'t make the ribs work."',
    choices: [
      ch('Assemble.', out('You lay the ribs out, and turn one over, and it clicks. By evening, a whole skeleton lies on the tarp. The Lab revives it overnight, and in the morning it is waiting for you, blinking at the sun for the first time in a very long time.', join({ species: ['omanyte', 'kabuto', 'aerodactyl', 'lileep', 'anorith'] }), moment('Assembled a fossil the Lab revived.', 55)), { check: 'intelligence', fail: out('You try for hours. There is always one bone left over. The scientist thanks you anyway, kindly, and goes on labelling.') }),
    ],
  },
  {
    id: 'rf-gear-box',
    intro: 'A drawbridge stuck halfway up over a river, and beside it an open gearbox with half its gears missing, a pile of mismatched ones on the ground.',
    choices: [
      ch('Fit the gears.', out('Big one, little one, the one with the chipped tooth. It turns. The bridge comes down with a boom, and on the far side, a road nobody has been able to use for weeks.', express()), { check: 'intelligence', fail: out('You fit them, and they jam, and you try again, and they jam. In the end you go the long way round.') }),
    ],
  },
  {
    id: 'rf-jigsaw-legend',
    intro: 'A table in a village hall, and on it a jigsaw of a thousand pieces, half done. The box shows the region\'s Legendary. The old man who started it has fallen asleep in his chair.',
    choices: [
      ch('Assemble.', out('You sit down and work on it, quietly, so as not to wake him. Piece by piece, the Legendary comes together under your hands, and when you set the last piece in, you could swear its painted eye moves.', flag('sign-region'), moment('Finished a jigsaw of the region\'s Legendary.', 40))),
    ],
  },
  {
    id: 'rf-lantern-riddle',
    intro: 'Three doors, three lanterns. A plaque: **"Behind the door whose lantern doesn\'t lie."** The left lantern gutters. The right one flickers. The middle one burns perfectly still.',
    choices: [
      ch('Left.', out('You open the left door. A broom cupboard. The lantern gutters as if laughing.')),
      ch('Middle.', out('The middle door. Its flame never moved. Behind it, on a little shelf, something left for whoever looked closely enough.', any('rare-candy', 'pp-up', 'star-piece', 'heart-scale'))),
      ch('Right.', out('You open the right door. A wall. The lantern flickers, delighted with itself.')),
    ],
  },
  {
    id: 'rf-map-sudoku',
    intro: 'A stone table carved into nine squares of nine, each square full of little symbols: a tree, a wave, a flame. Some are missing. It is a map, if you can finish it.',
    choices: [
      ch('Solve.', out('You fill in the last symbol, and the squares rearrange themselves in your head into a map of this very stage. One square, the one that would not fit any other way, is a treasure.', reveal()), { check: 'intelligence', fail: out('You get two thirds of the way, and then two wave symbols end up in the same row, and you have to start again, and the light is going.') }),
    ],
  },
  {
    id: 'rf-mirror-beam',
    intro: 'A dark lighthouse at the end of a spit, and its keeper wringing his hands: "The lamp\'s fine. It\'s the mirrors. Three of them, and I can\'t get the angles any more." Out at sea, a ship\'s horn sounds, worried.',
    choices: [
      ch('Angle the mirrors.', out('You turn the first, and the second, and the third, and the beam leaps out across the water. The ship\'s horn sounds again, relieved. The keeper gives you a Bright Powder, his own.', item('bright-powder'), good(1)), { prompt: { id: 'aim-drag', needs: 'good' }, fail: out('The beam hits the ceiling. Then the floor. The keeper pats your shoulder: "It took me years too." You leave him trying.') }),
    ],
  },
  {
    id: 'rf-mole-hunt',
    intro: 'Three burrows in a field. A prize is buried in one of them, says the sign. Two of the other burrows have very annoyed Diglett in them. The middle burrow has fresh, dark soil heaped at its mouth; the others are dry and crusted.',
    choices: [
      ch('Left.', fight('You dig. A Diglett pops up, extremely annoyed.', wild({ species: ['diglett'] }))),
      ch('Middle.', out('Fresh soil: someone dug here recently, and filled it in again. You dig, and there it is.', any('nugget', 'rare-candy', 'pp-up'))),
      ch('Right.', fight('You dig. A Diglett pops up, extremely annoyed.', wild({ species: ['diglett'] }))),
    ],
  },
  {
    id: 'rf-move-trivia-1',
    intro: 'A signboard with a question and three buttons: **"Surf is what type?"**',
    choices: [
      ch('Water.', out('Ding! A light turns green. Further down the path, another signboard lights up.', flag('trivia-right'), room('rf-move-trivia-2'))),
      ch('Normal.', out('Buzz. A light turns red. Further down the path, another signboard lights up anyway.', room('rf-move-trivia-2'))),
      ch('Ice.', out('Buzz. A light turns red. Further down the path, another signboard lights up anyway.', room('rf-move-trivia-2'))),
    ],
  },
  {
    id: 'rf-move-trivia-2',
    intro: 'Another signboard: **"Shadow Ball is what type?"**',
    choices: [
      ch('Dark.', out('Buzz. A light turns red. One signboard left, just ahead.', room('rf-move-trivia-3'))),
      ch('Ghost.', out('Ding! A light turns green. One signboard left, just ahead.', flag('trivia-right'), room('rf-move-trivia-3'))),
      ch('Psychic.', out('Buzz. A light turns red. One signboard left, just ahead.', room('rf-move-trivia-3'))),
    ],
  },
  {
    id: 'rf-move-trivia-3',
    intro: 'The last signboard: **"Earthquake is what type?"** Below it, a little hatch.',
    choices: [
      ch('Rock.', out('Buzz. The hatch stays shut.')),
      ch('Ground.', out('Ding! A light turns green.', flag('trivia-right')), { branches: [{ when: [flagIs('trivia-right', 2)], text: 'Ding! Three green lights in a row. The hatch drops open, and a TM slides out into your hand.', effects: [any(...TM), flag('trivia-right', -2)] }] }),
      ch('Fighting.', out('Buzz. The hatch stays shut.')),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF146, ...SF147, ...SF148]);
export const REMOVE: string[] = [];
void $;
