// Catalog Overhaul Pack, category "singles" (revised single events), batch 8.
// Doc: catalog_overhaul/STORY_FAMILIES_21.md SF149 Puzzle Gates.
// Known limits: docs/status/co-singles.md.
import { $, any, bondUp, ch, express, fight, flag, flagIs, item, leave, out, room, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
const line = (species: string): Json => ({ kind: 'partyLine', species });
const rm = (id: string, name: string, group: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group, room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
const skip2: Json = { kind: 'skipAhead', nodes: 2 };
const TM = ['tm-normal', 'tm-fighting', 'tm-flying', 'tm-poison', 'tm-ground', 'tm-rock', 'tm-bug'];
const RARE = ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'choice-specs', 'choice-scarf'];
/** The third step of a three-step puzzle: right only when the first two were right (flag `key` at 2). */
const third = (key: string, right: string, reward: Json[]): Json => ({ branches: [{ when: [flagIs(key, 2)], text: right, effects: [...reward, flag(key, -2)] }] });

// ---------- SF149. PUZZLE GATES ----------
const SF149: Json[] = [
  {
    id: 'rf-odd-one-out',
    intro: 'A board of six Pokémon silhouettes under glass: a Pikachu, a second Pikachu right beside it, an Eevee, a Snorlax, a Clefairy and a Jigglypuff. A card underneath: **"One of these is an impostor. Which?"** Look closely. One of the two Pikachu has ears that are a little too soft at the tips.',
    choices: [
      ch('The second Pikachu.', out('You tap the glass. The second Pikachu wobbles, sags, and melts into a pink puddle with two dot eyes, deeply embarrassed. It was a Ditto all along, copying the shape beside it. The board clicks open and a little tin of Quick Powder slides out.', item('quick-powder'))),
      ch('The first Pikachu.', out('You tap the first Pikachu. It stays a Pikachu. Beside it, the second one very quietly lets its ears go a little softer, and you could swear it is relieved.')),
      ch('The Snorlax.', out('You tap the Snorlax. Nothing happens. The Snorlax silhouette, to be fair, looks like it would not have moved even if it were the impostor.')),
    ],
  },
  {
    id: 'rf-painting-alignment',
    intro: 'Four paintings hang crooked in an empty parlour: a Ninetales, a Houndoom, an Arcanine and a Rapidash, each one turned a little away from the cold fireplace. Every one of them looks like it is waiting for a fire.',
    choices: [
      ch('Turn them all to the fireplace.', out('You straighten each frame until all four fire Pokémon are looking at the grate together. Something clicks inside the chimney breast, the back of the fireplace swings open, and behind it, in a velvet bag, someone\'s savings: ₽1,000, and a note that just says "Finally."', $(1000))),
      ch('Turn them all to the window.', out('You turn them all to face the window. The room feels colder at once, and nothing opens. Whoever hung them here wanted them looking somewhere else.')),
      ch('Walk on.', leave('You leave the paintings looking where they were looking. They have waited this long.')),
    ],
  },
  {
    id: 'rf-pinball',
    intro: 'A giant pinball table in the corner of the Pokémon Center, all chrome and blinking lights, with a Voltorb painted on every bumper. A sign: **"High score 10,000. Beat it, win the prize!"** You notice the left ramp blinks a little brighter than the others.',
    choices: [
      ch('Play (₽50).', out('You feed in your coins. The table wakes up with a fanfare, the ball drops, and your team crowds round the glass to watch.', $(-50), room('rf-pinball-ball')), { requires: [money(50)] }),
      ch('Walk on.', leave('You leave the table blinking to itself.')),
    ],
  },
  rm('rf-pinball-ball', 'The Ball Is in Play', 'Puzzles', 'The ball comes screaming down the middle and you catch it on the flipper. Three ways up: the left ramp, blinking bright, the bumpers in the middle, and the right ramp.', [
    ch('The left ramp.', out('You send it up the left ramp. BONUS LANE! The whole table lights up, the Voltorb bumpers spin, the score rolls past 10,000 and keeps going. The table plays a tinny fanfare and pays out the prize: a Cell Battery. The left ramp, every time. You will remember that.', item('cell-battery'), flag('pinball-lane'), moment('Beat the pinball high score.', 30))),
    ch('The bumpers.', out('You smash it into the bumpers. Bing, bing, bing! It is very exciting and very loud, and when the ball finally drains you have 6,200. Your team cheers anyway.')),
    ch('The right ramp.', out('Up the right ramp and straight back down into the drain. 1,900. The left ramp keeps blinking at you, a little smugly.')),
  ]),
  {
    id: 'rf-rune-tiles',
    intro: 'A sealed stone door with a grid of sliding rune tiles and one empty space. The carving around the frame tells, in pictures, the story of this region\'s Legendary Pokémon. The runes are letters. Someone meant you to spell something.',
    choices: [
      ch('Slide them to spell the legend\'s name.', out('Tile by tile, you spell out the name of the Pokémon in the carving, in order, the way the old stories say it. The last rune drops into place, and the door breathes out dust that smells like rain. Inside, an offering left long ago, and on the wall, the same shape as the carving, watching you.', any(...RARE), flag('sign-own'), moment('Spelled the legend\'s name on a rune door.', 50))),
      ch('Slide them at random.', out('You slide tiles about until your arms ache. The door does not even creak. Somewhere inside it, you get the feeling something is disappointed in you.')),
      ch('Walk on.', leave('You leave the door sealed. It has kept its secret this long.')),
    ],
  },
  {
    id: 'rf-silhouette-1',
    intro: '**"Who\'s that Pokémon?!"** A booth with a screen, a buzzer and a host in a sparkly jacket. "Three in a row wins the big prize!" On the screen: a small four-legged shape with something leafy growing out of it. Every child in this region starts with one of three. This is the one that grows.',
    choices: [
      ch('This region\'s Grass starter.', out('BZZT! "It\'s... CORRECT!" The host throws confetti on you personally. "One for one! Next screen, next booth!"', flag('silhouette-right'), room('rf-silhouette-2'))),
      ch('This region\'s Fire starter.', out('"Ooh, no! Look at the leaf!" The host is sympathetic. "Still, you can play on. Next booth!"', room('rf-silhouette-2'))),
      ch('This region\'s Water starter.', out('"Ooh, no! Look at the leaf!" The host pats your shoulder. "Still, play on! Next booth!"', room('rf-silhouette-2'))),
    ],
  },
  {
    id: 'rf-silhouette-2',
    intro: 'Booth two. A bigger shadow, broad and proud. The host leans in: "This one has sent a lot of new trainers home crying. The very first Gym Leader of this region trusts it above all others."',
    choices: [
      ch('The first Gym Leader\'s ace.', out('"CORRECT!" More confetti. "You know your Gyms! On to the last booth!"', flag('silhouette-right'), room('rf-silhouette-3'))),
      ch('The Champion\'s ace.', out('"Close, but no! Not quite that scary. Not yet." The host points you on to the last booth anyway.', room('rf-silhouette-3'))),
      ch('A very big Rattata.', out('The host laughs so hard they have to sit down. "On you go. Last booth."', room('rf-silhouette-3'))),
    ],
  },
  {
    id: 'rf-silhouette-3',
    intro: 'The last booth. The screen shows a shape you know better than any other: the way it stands, the way it tilts its head. It takes a moment, and then your heart catches. It is your own Pokémon, filmed from the crowd.',
    choices: [
      ch('{lead}!', out('"CORRECT!" The host beams. "Of course you knew. You\'d know them anywhere." Your Pokémon is very pleased to have been on television.', bondUp(1, 'lead')), third('silhouette-right', '"CORRECT! THREE IN A ROW!" Every light in the place goes off at once, the host is crying a bit, and you are handed the big prize: a Rare Candy, in a little velvet box. "You\'d know them anywhere, wouldn\'t you?" Your Pokémon is very pleased to have been on television.', [item('rare-candy'), bondUp(1, 'lead')])),
      ch('A Ditto.', out('"A Ditto?" The host looks at the screen, then at your Pokémon. "Oh, that\'s cold." Your lead looks up at you, wounded.')),
      ch('A Zorua.', out('"A Zorua? No! It\'s your own Pokémon!" Your lead stares at you. You will be making this up to it for a while.')),
    ],
  },
  {
    id: 'rf-slide-whistle-safe',
    intro: 'A safe in the corner of a ruined house, with no dial, only a slide whistle hanging on a string from the handle. Scratched into the paint: three little lines, one short, one middle, one tall.',
    choices: [
      ch('Low.', out('You blow a low note. Something inside the safe clunks, once, as if agreeing. Two more notes to go.', flag('whistle-right'), room('rf-whistle-2'))),
      ch('Middle.', out('You blow a middle note. The safe stays silent. You try to go on anyway.', room('rf-whistle-2'))),
      ch('High.', out('You blow a high note. Somewhere upstairs a Whismur starts howling along. The safe stays shut. You try to go on.', room('rf-whistle-2'))),
    ],
  },
  rm('rf-whistle-2', 'The Second Note', 'Puzzles', 'The safe waits. The three scratches are still there: short, middle, tall.', [
    ch('Low.', out('Low again. The safe does nothing. One more note.', room('rf-whistle-3'))),
    ch('Middle.', out('A middle note. Clunk. Two clunks now. One more.', flag('whistle-right'), room('rf-whistle-3'))),
    ch('High.', out('A high note. Silence. One more.', room('rf-whistle-3'))),
  ]),
  rm('rf-whistle-3', 'The Last Note', 'Puzzles', 'One note left. Your team holds its breath.', [
    ch('Low.', out('Low. Nothing. The safe stays shut, and the slide whistle sounds a little sad.')),
    ch('Middle.', out('Middle. Nothing. You put the whistle down.')),
    ch('High.', out('High. Nothing happens. Low, middle, high: you were close.'), third('whistle-right', 'Low, middle, high. CLUNK. The safe door swings open on a velvet tray, and on it, a Metronome, ticking gently as if it had been keeping time for you all along.', [item('metronome')])),
  ]),
  {
    id: 'rf-sonar-cave',
    intro: 'Pitch black. Somewhere ahead, pings echo off the walls: one loud, bouncing back hard, and one soft, almost swallowed. A trickle of air from somewhere says there is a way through.',
    choices: [
      ch('Follow the loud ping.', out('You follow the loud ping straight into a wall. Of course: a wall is what sends a ping back loud. You feel your way back out, a bit bruised in your pride.')),
      ch('Follow the soft ping.', out('The soft ping is the one the dark swallows, so that is where the gap is. You follow it through, and on the far side, in the first grey light, something glints: a Wide Lens, dropped by someone who did not find the way.', item('wide-lens'))),
      ch('Send a Zubat.', out('Your Zubat is gone in a flicker and back in a moment, chirping smugly, and leads you straight through the dark as if it were noon. On the far side, a Wide Lens is lying in the grey light.', item('wide-lens'), bondUp(1, 'party')), { requires: [line('zubat')] }),
    ],
  },
  {
    id: 'rf-speed-typing',
    intro: 'An old terminal in a closed-down office blinks: **TYPE THE LINE BEFORE THE TIMER ENDS.** Below it, the line: *"I\'ll be the very best."*',
    choices: [
      ch('Type.', out('You type it with two fingers, then all of them, and hit the last key with a second to spare. The terminal plays a little tune, and a drawer pops open. Inside, a TM, and a sticky note: "Like no one ever was."', any(...TM))),
    ],
  },
  {
    id: 'rf-star-chart',
    intro: 'A planetarium dome, dark and quiet. A star chart is painted on the floor with a dozen loose stars you can drag about. In the middle, one empty shape: round, with two pointed ears and a curl.',
    choices: [
      ch('Drag them into a Clefairy.', out('You drag the stars into the shape of a Clefairy, the one the old charts call the Moon Pixie, and the dome lights up overhead with the real sky. A hatch in the floor slides open on a little gift.', any('moon-stone', 'star-piece'), flag('star-chart')), { branches: [{ when: [flagIs('star-chart')], text: 'You know this one now. The stars fall into the Clefairy shape under your hands almost by themselves, and the dome lights up again, just for you.', effects: [any('moon-stone', 'star-piece')] }] }),
      ch('Drag them into a Pidgey.', out('You make a very good Pidgey. Nothing happens. The empty shape in the middle still has two pointed ears and a curl.')),
      ch('Walk on.', leave('You leave the stars where they lie.')),
    ],
  },
  {
    id: 'rf-tide-gauge',
    intro: 'A lock gate on a canal, and a big brass dial. The water on your side is too high; the plaque says the gate opens only when the water is exactly level. Three levers: raise, lower, hold. The gauge looks like it overshoots.',
    choices: [
      ch('Lower.', out('The water drains with a gurgle. Lower, but not level yet.', flag('tide-right'), room('rf-tide-2'))),
      ch('Raise.', out('The water rises the wrong way, sloshing over your boots. You keep trying.', room('rf-tide-2'))),
      ch('Hold.', out('You hold. Nothing changes, and the gate stays shut. You keep trying.', room('rf-tide-2'))),
    ],
  },
  rm('rf-tide-2', 'Still Not Level', 'Puzzles', 'The dial wavers. Not level yet.', [
    ch('Lower.', out('Lower again: too far now, the needle dips under the line. One more pull.', flag('tide-right'), room('rf-tide-3'))),
    ch('Raise.', out('Up it goes. The needle swings past. One more pull.', room('rf-tide-3'))),
    ch('Hold.', out('You hold, and nothing changes. One more pull.', room('rf-tide-3'))),
  ]),
  rm('rf-tide-3', 'The Last Lever', 'Puzzles', 'One more pull, and then the gate decides.', [
    ch('Raise.', out('Up a little. The needle swings and settles off the line. The gate stays shut.'), third('tide-right', 'Lower, lower, then raise just a little. The needle settles dead on the line, the gate swings open, and the canal carries you through the sea lock, well past a stretch of open water.', [express(), moment('Levelled the tide gauge.', 30)])),
    ch('Lower.', out('Lower. The gate stays shut, the water too low now.')),
    ch('Hold.', out('You hold. The gate stays shut.')),
  ]),
  {
    id: 'rf-tilt-maze',
    intro: 'An Electrode sits at the start of a wooden maze on a table, looking smug. A sign: **"Roll it to the goal. Do not rest it on a corner."** The Electrode looks at the corners with interest.',
    choices: [
      ch('Tilt it along the walls.', out('You tilt it slow and steady, always along a wall, never letting it settle in a corner. It rolls into the goal and sparks with delight, and the table drawer pops open on an Electric Gem.', item('electric-gem'))),
      ch('Tilt it fast.', out('You tilt it fast and it rolls into a corner and stops. There is a pause. BOOM. A small, harmless, very loud explosion, and the Electrode is back at the start, looking even more smug. Your hair will be standing up for an hour.')),
    ],
  },
  {
    id: 'rf-weighted-scales',
    intro: 'Four identical gems and a balance scale on a table. **"One is real and heavier. Find it in only two weighs."**',
    choices: [
      ch('Two against two.', out('Two on each side. The left side sinks: the real one is one of those two.', flag('scales-right'), room('rf-scales-2'))),
      ch('One against one.', out('One against one. They balance. Two gems left you have not tried, and only one weigh to go.', room('rf-scales-2'))),
    ],
  },
  rm('rf-scales-2', 'The Second Weigh', 'Puzzles', 'One weigh left.', [
    ch('One against one.', out('One against one. They balance, and you have to guess between the last two. You guess wrong; the gem goes cloudy in your hand.'), { branches: [{ when: [flagIs('scales-right')], text: 'The two from the heavier side, one against one. One side sinks, and there it is. As you lift it, the real gem catches the light and turns out to be a Shiny Stone.', effects: [item('shiny-stone'), flag('scales-right', -1)] }] }),
    ch('Two against two.', out('Two against two again. The scale tips the same way as before, and tells you nothing new. You are out of weighs.')),
  ]),
  {
    id: 'w4-express-train',
    intro: 'A little train stops at a halt in the middle of nowhere. The conductor grins down at you: "Express! Skips a stop! Ticket is free if you can answer this: which is the baby, Pikachu or Pichu?"',
    choices: [
      ch('Pichu.', out('"Correct! Hop on, free of charge!" The train whistles, your team crowds the window, and a whole stop goes by in a blur.', express(), moment('Rode the express for free.', 20))),
      ch('Pikachu.', out('"Oh, dear. That\'s the grown-up!" The conductor shakes their head, still smiling. "₽100, then." You pay, and the train whistles you past a whole stop anyway.', $(-100), express())),
    ],
  },
  {
    id: 'w4-forest-maze',
    intro: 'Every path out of this clearing leads back into it. A carving on a stump says: **"Walk only where the mushrooms glow."**',
    choices: [
      ch('Follow the glow.', out('You walk only where the little mushrooms glow, step after step. The trees thin, the light changes, and you are out, with a Tiny Mushroom in your pocket that one of your Pokémon picked on the way.', item('tiny-mushroom'))),
      ch('Mark the trees.', out('You mark every tree you pass with a scratch, and very soon every tree you pass already has your scratch on it. You are back in the clearing.', room('w4-forest-maze'))),
    ],
  },
  {
    id: 'w4-lab-terminal',
    intro: 'An abandoned lab. One terminal still glows: **"PASSWORD: the next number. 3, 6, 12, 24, ?"**',
    choices: [
      ch('48.', out('ACCESS GRANTED. A door at the back hisses open on a small room with a single case in it, and in the case, an Up-Grade, still humming.', item('up-grade'), moment('Opened the lab\'s back room.', 30))),
      ch('36.', fight('ACCESS DENIED. An alarm wails, and a Magnemite floats out of the wall to deal with you.', wild({ species: ['magnemite'] }))),
      ch('Leave.', leave('You leave the terminal glowing.')),
    ],
  },
  {
    id: 'w4-mirror-maze',
    intro: 'A maze of mirrors, and in every one of them, you. Your team bumps noses with its own reflections. One reflection, a long way down, does not quite move when you move.',
    choices: [
      ch('Touch the walls.', out('You keep one hand on the glass and walk. It takes a long, long time, and you see far too much of your own face, but eventually the glass ends and you are outside, blinking.')),
      ch('Follow the reflection that doesn\'t copy you.', out('You walk toward the one reflection that will not copy you, and it turns out not to be a reflection at all: it is a window, and on the other side is the way out. On the sill, someone has left a pinch of Bright Powder in a twist of paper.', item('bright-powder'))),
    ],
  },
  {
    id: 'w4-pressure-plates',
    intro: 'Three stone plates: a sun, a moon and a star. A mural over them shows the sky through one night: the sun goes down, the moon comes up, and then the star comes out.',
    choices: [
      ch('Step on the sun.', out('The sun plate sinks with a grinding sound: the sun goes down first. Two plates left.', room('w4-plates-2'))),
      ch('Step on the moon.', out('The moon plate does not budge, and a little dart of dust puffs out of the wall at you. The night does not start with the moon.')),
      ch('Step on the star.', out('The star plate does not budge. Dust puffs out of the wall. Not yet.')),
    ],
  },
  {
    id: 'w4-plates-2',
    intro: 'The sun plate is down. Two plates left: the moon and the star.',
    choices: [
      ch('Step on the moon.', out('The moon rises next. The plate sinks, and the star plate begins to glow.', room('w4-plates-3'))),
      ch('Step on the star.', out('The star plate stays still. Dust puffs out of the wall. The moon comes first.')),
    ],
  },
  {
    id: 'w4-plates-3',
    intro: 'Only the star is left, glowing faintly.',
    choices: [
      ch('Step on it.', out('The star plate sinks, and the whole wall grinds open. In the alcove behind it, where the mural\'s night sky ends, a Comet Shard is lying in the dust, glittering.', item('comet-shard'), moment('Walked the night across three plates.', 30))),
    ],
  },
  {
    id: 'w4-portal-switches',
    intro: 'Three switches and a dead portal, all cobwebs and quiet. A plaque: **"Sky before sea, and sea before stone."**',
    choices: [
      ch('Sky, sea, stone.', out('Sky, then sea, then stone. The portal shudders, crackles and opens on a swirl of light. You step through with your team holding on to you, and step out two whole stops further down the road.', skip2, moment('Took the old portal.', 30))),
      ch('Stone, sea, sky.', out('The portal coughs out a puff of dust and a single forgotten Potion. That is all it does.', item('potion'))),
      ch('Sea, sky, stone.', fight('The portal flickers and spits out a very confused Porygon, which takes it personally.', wild({ species: ['porygon'] }))),
    ],
  },
  {
    id: 'w4-riddle-signpost',
    intro: 'A signpost with no place names, only a riddle: **"The more of me you take, the more you leave behind. Answer, and the short way opens."**',
    choices: [
      ch('Footsteps.', out('The signpost creaks around on its pole to point down a path you had not seen. The short way. You take it, and leave a great many footsteps behind.', express())),
      ch('Time.', out('A good answer, but the signpost does not move. Time, it seems, is not what it had in mind.')),
      ch('Memories.', out('You say it quietly. The signpost does not move, but you think about it for a long while as you walk on.')),
    ],
  },
  {
    id: 'w4-sundial',
    intro: 'An old sundial in the ruins, its arm loose. Carved round it: **"Turn me to where my shadow is shortest, and I will open."**',
    choices: [
      ch('Noon.', out('At noon the sun stands highest and the shadow is shortest. You turn the arm, the stone base splits along a seam, and inside, warm to the touch, a Sun Stone.', item('sun-stone'))),
      ch('North.', out('You turn it to the north. Nothing happens. A shadow is shortest at a time, not a place.')),
      ch('East.', out('You turn it to the east, toward the dawn. Nothing. At dawn the shadows are long.')),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF149]);
export const REMOVE: string[] = [];
