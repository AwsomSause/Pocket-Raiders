// Catalog Overhaul Pack, category "singles" (revised single events), batch 5.
// Doc: catalog_overhaul/STORY_FAMILIES_20.md SF142 Hidden Paths and Mystery Places, SF143 Ability Secrets.
// Known limits: docs/status/co-singles.md.
import { $, any, ability, bondUp, ch, express, fight, flag, flagIs, heal, item, join, leave, out, reveal, room, scout, takeNode, trainer, wild, type Json } from '../dsl.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const no = (key: string): Json => ({ kind: 'flag', key, atMost: 0 });
const pick = { pick: {} };
const rm = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group: 'Hidden Paths', room: true, scene: { cast: [], effect: 'sparkle' }, ...o, intro, choices });
const halfStage: Json = { kind: 'skipAhead', half: true };
const lucky: Json = { kind: 'tempEffect', label: 'The lucky stop: prize money ×1.5 in your next battle', effects: [{ kind: 'moneyMultiplier', value: 1.5 }], battles: 1, until: 'battle' };
const learn: Json = { kind: 'train', what: 'learnMove' };
const EPIC = ['comet-shard', 'sacred-ash', 'poke-radar', 'super-rod', 'x-attack-6', 'x-speed-6'];
const RARE = ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'choice-specs', 'choice-scarf'];
const BERRIES = ['oran-berry', 'sitrus-berry', 'lum-berry', 'pecha-berry', 'cheri-berry'];
const has = (label: string, ...abilities: string[]): Json => ability(label, ...abilities);
const secret = (id: string, label: string, abilities: string[], intro: string, choices: Json[]): Json => ({ id, secret: [has(label, ...abilities)], intro, choices });

// ---------- SF142. HIDDEN PATHS AND MYSTERY PLACES ----------
const SF142: Json[] = [
  {
    id: 'hidden-path-keeper',
    intro: '**A keeper of forgotten roads, Wend**, has set a folding table at the roadside with three drawings pinned to it. Her coat is patched with old map pieces. "Most folk walk right past them, the old roads. Prove you can see them, and I\'ll show you one."',
    choices: [
      ch('Take the test.', out('She turns the three drawings toward you and sits back, hands folded, watching your face more than the paper.', room('hidden-path-test'))),
      ch('No.', leave('"No shame in it." She rolls the drawings up with great care, as if they might bruise. "The roads will wait. They\'re good at waiting."')),
    ],
  },
  rm('hidden-path-test', 'Wend\'s Picture Test', 'Three drawings of the same hillside. In each, the same trees, the same stream, the same tumbled wall. In one of them, and only one, there is a path. "Find it," says Wend.', [
    ch('The path through the pines.', out('You look, and look, and nothing. "Pretty trees," Wend says gently. "No road." She lets you look at the right one before she packs up, and you see it then, plain as anything. Next time.')),
    ch('The path along the stream.', out('"Look again," says Wend, not unkindly. "That\'s water, not a road." She shows you the right one, and once you have seen it you cannot stop seeing it.')),
    ch('The path behind the tumbled wall.', out('You put your finger on it: a line of flattened grass behind the wall, there all along. Wend lets out a long breath, almost a laugh. "There you are. Most never see it." She draws you a little map on the back of her hand-out. It cuts through this very stage.', express(), moment('Wend the road-keeper showed you a forgotten road.', 40))),
  ], { scene: { cast: [], effect: 'none' } }),
  {
    id: 'hidden-path-shortcut',
    intro: 'A gap between two boulders, so narrow you would never notice it unless the light fell exactly right, as it does now. Beyond it, a path runs straight as a ruler. It cuts the whole stage in half.',
    choices: [
      ch('Take it.', out('You turn sideways and squeeze through, your team piling after you, and the path carries you a long, quiet way. When you step out, half the stage is behind you, and nobody saw you go.', halfStage)),
    ],
  },
  {
    id: 'hidden-path-signpost',
    intro: 'A signpost points down a path that is not there. Then you take one step to the left, and it is. It has always been there, at exactly this angle, for exactly this week. This is Secret Paths Week.',
    choices: [
      ch('Stand at the angle.', out('You stand very still at the angle, and the path holds. It runs on ahead of you, real as stone, and other paths like it glint in the corners of the map. This week, every stage keeps one.', reveal(), express(), moment('Found a path that only exists during Secret Paths Week.', 35))),
    ],
  },
  {
    id: 'mirage-island',
    requires: [no('mirage-sailed')],
    intro: 'Offshore, an island shimmers where no island was this morning. A ribbon of light runs around it, and something red and white flies low over the trees, too fast to see clearly. It will not be there long.',
    choices: [
      ch('Sail out.', out('You borrow a rowing boat and pull hard, and the island stays. Its sand is warm. A Wynaut is sitting on a rock, waiting as if it expected you, and a Liechi Berry hangs from the only tree. Overhead, a shape banks once and is gone, and you would swear it looked straight at you.', join({ species: ['wynaut'] }), item('liechi-berry'), flag('sign-latias'), flag('mirage-sailed'), moment('Landed on Mirage Island.', 60))),
      ch('Watch it.', out('You watch it from the shore with your team until the light thins and the island fades, tree by tree. Just before the last of it goes, something red and white rises out of it and turns toward you, and then there is only sea.', bondUp(1, 'party'), flag('sign-latias'), flag('mirage-sailed'))),
    ],
  },
  {
    id: 'mr-abandoned-observatory',
    intro: 'A dome on the hilltop, half its panels gone, and a great brass telescope inside with a lens so filthy it is just grey. Someone once sat here every night. Their chair is still pulled up to the eyepiece.',
    choices: [
      ch('Clean the lens (a node).', out('It takes you the whole afternoon, with your sleeve and your water bottle and a great deal of patience. When it is done you put your eye to it, and the whole region spreads out below you, every road and every hidden turn of it, as clear as a map.', takeNode(), reveal(), scout(12), moment('Cleaned the old observatory\'s lens and saw the whole road ahead.', 40))),
      ch('Leave it.', leave('You leave the chair where it is. Someone may want it again.')),
    ],
  },
  {
    id: 'mr-ancient-arena',
    intro: 'A ruined arena, open to the sky, and every seat in it full of ghosts. Hundreds of them, pale as breath, leaning forward. They do not want a fight. They want a show, and they have waited a very long time for one.',
    choices: [
      ch('Give them one.', fight('You walk out onto the sand and bow, and the crowd roars without making a sound. Three exhibition bouts, one after another, no rest between. Win them all and they will teach your lead their favourite move, the one they chant for.', trainer('Arena Spectre', { cls: 'veteran', size: 2, types: ['ghost', 'fighting'], chain: 3, win: [{ kind: 'teachMove', move: 'mega-punch' }, moment('Won three bouts for a ghostly crowd; they taught your lead Mega Punch.', 55)] }))),
      ch('Bow and leave.', leave('You bow to the stands. Hundreds of pale heads bow back. Some of them, you are sure, look disappointed, and some look glad that anyone came at all.')),
    ],
  },
  {
    id: 'mr-clockwork-crypt',
    intro: 'A crypt full of gears. They turn behind every wall, in the floor, in the ceiling, ticking, ticking. Far ahead, a door opens on the beat and closes on the next, and in the dark behind it something very old is keeping time.',
    choices: [
      ch('Walk on the beat.', out('Tick, step. Tick, step. You walk the whole crypt on the beat, and every door opens for you exactly when you reach it. In the last room, the gears all stop at once, and in the silence you feel time itself look at you.', flag('sign-dialga'), moment('Walked the Clockwork Crypt on the beat.', 45)), { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('You miss a beat, and a door closes in your face with a clang that rings through the whole crypt. When it opens again, you are back at the entrance, and the ticking sounds a little like laughter.') }),
      ch('Wait for the pattern.', out('You sit down and listen for a long time, until you know the ticking better than your own heartbeat, and then you walk through without hurrying once. In the last room, the gears stop. In the silence, you feel time itself look at you.', flag('sign-dialga'), moment('Learned the Clockwork Crypt\'s pattern.', 45))),
    ],
  },
  {
    id: 'mr-dragon-skeleton',
    intro: 'Bones. Each one the size of a house, half sunk in the earth, ribs arching over the path like the roof of a hall. When the wind blows through them, they hum, low and long, like something very far away that is still roaring.',
    choices: [
      ch('Touch one.', out('You lay your palm on the nearest rib. It is warm. The hum goes through your hand, your arm, your chest, and for one moment you hear it properly: a roar, from very far away, and very much alive. Your team all turn to look in the same direction.', flag('sign-dragon'), moment('Touched the dragon bones and heard a roar.', 50))),
      ch('Look, don\'t touch.', leave('You walk under the great ribs with your hands in your pockets, looking up. Some things are not yours to wake.')),
    ],
  },
  {
    id: 'mr-echoing-well',
    intro: 'An old stone well with a sign: "Toss a coin and hear what is coming." The bucket is gone. When you lean over, the dark below breathes back at you, cool, and the sound of your breathing comes up twice.',
    choices: [
      ch('Toss ₽10.', out('The coin falls for a long, long time. Then a voice comes up the well, your own voice, and it names the road ahead, one stop at a time, as if remembering it.', $(-10), scout(2)), { requires: [{ kind: 'money', atLeast: 10 }] }),
      ch('Shout into it.', out('"Hello!" you shout. "Hello," says the well, a moment later, and then, much quieter, in a voice that is nearly yours: "Careful." You step back, and you are careful.')),
    ],
  },
  {
    id: 'mr-graveyard-choir',
    intro: 'In a forgotten graveyard, ghosts are singing. The song is lovely and a little sad, like the end of a long day. In the middle of the choir there is a gap, a place held open, and they keep glancing at you.',
    choices: [
      ch('Take the place.', out('You step into the gap. You do not know the song, but somehow you know the next note, and the next. You sing until the stars come out. Your team sleeps among the stones, and your Ghost-types sing with you, very softly. Everyone is rested.', heal(1), bondUp(1, { types: ['ghost'] }), moment('Sang with a ghost choir in a forgotten graveyard.', 45))),
      ch('Listen from the gate.', out('You lean on the gate and listen, and the choir sings to you, and when it ends they bow, and are gone. Your team is curled up asleep at your feet. Everyone is rested.', heal(1))),
    ],
  },
  {
    id: 'mr-memory-fog',
    intro: 'A thick fog rolls in off nowhere. Your pockets feel lighter, all at once. You reach in, and for a terrible moment you cannot remember what was there.',
    choices: [
      ch('Wait it out.', out('You sit down on the road and wait, holding your bag shut with both arms. When the fog lifts, one thing is gone, and you know exactly what. It will come back. You do not know how you know that.', { kind: 'coFog', action: 'take', count: 1 }, flag('memory-fog'))),
      ch('Push through.', out('You put your head down and push through, fast. You come out the other side with two things missing, in the order they went. The fog will give them back. Not yet.', { kind: 'coFog', action: 'take', count: 2 }, flag('memory-fog'))),
    ],
  },
  {
    id: 'mr-memory-fog-clears',
    requires: [flagIs('memory-fog'), { kind: 'flagAge', key: 'memory-fog', atLeast: 1 }],
    callback: true,
    intro: 'You stop in the middle of the road, because you suddenly remember exactly what you lost in the fog, in order. And there, on the roadside, is a little pile, sitting in the grass, waiting.',
    choices: [
      ch('Pick them up.', out('You pick them up one at a time, in the order they went. Each one is a little damp, and each one is yours.', { kind: 'coFog', action: 'give', count: 2 }, flag('memory-fog', -1))),
    ],
  },
  {
    id: 'mr-mind-palace',
    intro: 'A room with no walls, only memories. Every battle of this run hangs in the air like a painting, and you can step into any of them. The hard ones glow a little brighter.',
    choices: [
      ch('Relive a loss.', fight('You step into the one that still stings. It is all there: the field, the foe, the moment it went wrong. This time you know what is coming. Win, and your lead keeps what it learned.', trainer('A Memory', { size: 3, lv: 2, win: [learn, moment('Relived a loss in the Mind Palace, and won it this time.', 55)] }))),
      ch('Relive a win.', fight('You step into one you are proud of, and fight it again, differently, to see what else was possible. Win, and your lead keeps what it learned.', trainer('A Memory', { size: 2, lv: 1, win: [learn] }))),
    ],
  },
  {
    id: 'mr-moss-obelisk',
    intro: 'An obelisk furred with moss, runes running down it. Some of them glow faintly, green and cold. They are a warning, written long ago, of what waits at the end of this region\'s road.',
    choices: [
      ch('Read the runes.', out('You trace the glowing runes with a finger. They name the trouble waiting at the end of the road, plainly.'), { branches: crisisBranches() }),
      ch('Rub them clean.', out('You scrub the moss away with your sleeve until the runes stand out sharp, and then you can read them.'), { branches: crisisBranches() }),
    ],
  },
  {
    id: 'mr-poltergeist-poker',
    intro: 'Three ghosts at a mouldy card table, dealing from a deck that has gone soft with damp. They play for items. One of them pulls out a chair for you with a creak. The odds are written on the table in chalk: one in two.',
    choices: [
      ch('Play honest.', out('You play it straight, and so do they, mostly. Your hand wins. The ghosts pay up with great dignity: a Spell Tag, still faintly warm.', item('spell-tag')), { chance: 0.5, fail: out('You play it straight, and so do they, mostly. Their hand wins. They take your stake with great dignity and a little bow.', { kind: 'loseItem' }) }),
      ch('Cheat.', out('You slip a card from your sleeve. Every ghost at the table goes still. They know. Of course they know. They fold, all three, and keep your stake, and their silence follows you out the door.', { kind: 'loseItem' })),
    ],
  },
  {
    id: 'mr-prophecy-wall',
    intro: 'A mural on a ruined wall: a tall figure with a team at its side. The paint is fresh, still tacky. And the face is your rival\'s.',
    choices: [
      ch('Look closer.', out('Your rival stands in the mural at a crossroads, looking down two roads at once, and the paint has not decided which one they take.', moment('Saw your rival at a crossroads on the prophecy wall.', 45)), {
        branches: [{ when: [{ kind: 'rivalState', leadAtLeast: 2 }], text: 'Your rival stands in the mural on the Champion\'s dais, their team around them, the crowd painted as a blur of light. The paint is still wet. It is not finished. It could still be painted over.', effects: [moment('Saw your rival painted as Champion on the prophecy wall.', 55)] }],
      }),
    ],
  },
  {
    id: 'mr-vault-key-a',
    intro: 'A rusted key half sunk in the mud of a riverbank, a little tag tied to it. The tag shows a round door with three keyholes.',
    choices: [ch('Take it.', out('You rinse it in the river. One of three. Somewhere there is a door with your name on it, or at least a keyhole that fits.', flag('vault-key')))],
  },
  {
    id: 'mr-vault-key-b',
    intro: 'A bronze key caught in the roots of a dead tree, its tag faded but the drawing still clear: a round door, three keyholes.',
    choices: [ch('Take it.', out('You work it free of the roots. Another one for the ring. It clinks against the others like it knows them.', flag('vault-key')))],
  },
  {
    id: 'mr-vault-key-c',
    intro: 'A silver key at the foot of a fallen signpost, as if the sign had been pointing to it all along. The same tag: a round door, three keyholes.',
    choices: [ch('Take it.', out('You pick it up, and it is warm from the sun. Another key for the ring, and the drawing on every tag the same.', flag('vault-key')))],
  },
  {
    id: 'mr-sealed-vault',
    requires: [flagIs('vault-key', 3)],
    intro: 'A round door set into a hillside, with three keyholes in a row. Painted around the door, in faded gold, is a list of what the vault keeps: a Comet Shard, Sacred Ash, a Poké Radar, a Super Rod, and two old battle tonics.',
    choices: [
      ch('Use the keys.', out('The rusted key, the bronze key, the silver key. Each one turns with a different sound, and the third makes the whole hillside sigh. The door rolls back, and the vault gives you one thing from its list, the one it thinks you need.', any(...EPIC), flag('vault-key', -3), moment('Opened the sealed vault with three keys.', 55))),
    ],
  },
  {
    id: 'mr-spectral-duelist',
    intro: '**A ghost in an old-fashioned coat** bows to you from the middle of the path: "I fight with the moves you\'ve used the most."',
    choices: [
      ch('Battle.', fight('It raises a hand, and its team turns into a copy of yours: your lead, your moves, your habits. You will be fighting yourself.', trainer('Spectral Duelist', { cls: 'hex-maniac', mirror: true, lv: 1, win: [bondUp(1, 'party'), moment('Beat a ghost who fought with your own moves.', 50)] }))),
      ch('Ask why.', fight('"So you see yourself," it says, quite kindly. "Most never do." Then it raises a hand, and its team becomes a copy of yours.', trainer('Spectral Duelist', { cls: 'hex-maniac', mirror: true, lv: 1, win: [bondUp(1, 'party'), moment('A ghost showed you yourself in battle.', 50)] }))),
    ],
  },
  {
    id: 'mr-starfall-seeker',
    intro: '**A stargazer, Nova**, sits on a camp stool with a telescope across her knees, though it is broad daylight. "The sky\'s picked a lucky stop for you. Last night. I watched it happen."',
    choices: [
      ch('Listen.', out('She points down the road. "That one. The next fight you walk into. Whatever it pays, it\'ll pay half again." She seems very sure. Stars are rarely wrong about money.', lucky)),
    ],
  },
  {
    id: 'mr-unwritten-library',
    intro: 'A library where every book is blank. Thousands of them, shelf on shelf. On a stand by the door, one book lies open with a pen beside it. A card reads: "Write your own tale. One line."',
    choices: [
      ch('Write one line.', out('You think about it for a long time, with your team leaning on you. Then you write it, about the one you chose, and the ink sinks in and stays. When this run ends, it will be the line they remember it by.', { kind: 'coEpitaph', text: '{picked} walked every step of it with me, and never once looked back.' }, bondUp(1, 'picked')), pick),
    ],
  },
  {
    id: 'mr-whispering-door',
    intro: 'A door stands alone in the grass, no wall around it, no house behind it. As you pass, it whispers: **"What walks on four legs at dawn and is never counted?"**',
    choices: [
      ch('A shadow.', out('The latch clicks. The door swings open onto a little room that cannot possibly be there, and on the floor lies a gift for whoever answered.', any('rare-bone', 'star-piece', 'nugget', 'heart-scale', 'pp-up'))),
      ch('A Pokémon.', out('"Close," whispers the door, sounding almost sorry. It stays shut.')),
      ch('A dream.', out('"Lovely," whispers the door. "Wrong." It stays shut, and you could swear it is smiling.')),
    ],
  },
  {
    id: 'shrine-maiden',
    intro: 'A shrine maiden in red and white sweeps fallen leaves beneath a red gate. She does not stop sweeping when you come up the steps, but she smiles.',
    choices: [
      ch('Ask for a Telling.', out('She sets down her broom and lights one stick of incense. Then she tells you something about a Pokémon nobody has seen in a hundred years, softly, as if it were a secret between friends.', flag('telling-shrine'))),
      ch('Help sweep.', out('You pick up a second broom, and the one you chose helps too, chasing leaves with great seriousness. When the steps are clean she tells you something, softly, about a Pokémon nobody has seen in a hundred years, and pats your helper on the head.', bondUp(1, 'picked'), flag('telling-shrine')), pick),
    ],
  },
  {
    id: 'spooky-festival',
    intro: 'Jack-o\'-lanterns line the road, grinning, and a parade of costumes winds through town: children, Pokémon, children dressed as Pokémon. Somewhere at the back, someone is carrying one hollow lantern with no light in it at all.',
    choices: [
      ch('Join the parade.', out('You fall in with the parade and march through town to a square full of stalls. A costume stall dresses your lead as a little ghost, which it takes very seriously. At the end, the person with the empty lantern looks at you for a long moment, and then walks off into the dark. You feel you should follow, someday.', { kind: 'addStop', stop: 'shop' }, bondUp(1, 'lead'), flag('hollow-lantern-seen'))),
      ch('Trick or treat.', out('You hold out your bag, and a grandmother dressed as a Mismagius fills it with sweets and a Rare Candy, and then a child in a sheet jumps out of a doorway and shouts BOO, and your whole team screams.', any('rare-candy', 'lava-cookie', 'casteliacone'))),
    ],
  },
];

function crisisBranches(): Json[] {
  return [
    { when: [{ kind: 'crisis', atLeast: 4 }], text: 'The runes name the trouble at the end of this region\'s road, and they burn bright: it is close now, and very bad. Whatever is coming, it is nearly here.', effects: [moment('The moss obelisk warned that the region\'s crisis is nearly here.', 45)] },
    { when: [{ kind: 'crisis', atLeast: 2 }], text: 'The runes name the trouble at the end of this region\'s road. It is growing, steadily, the way a river rises.', effects: [moment('The moss obelisk warned of the region\'s growing crisis.', 40)] },
    { when: [{ kind: 'crisis', atMost: 1 }], text: 'The runes name the trouble at the end of this region\'s road. It is still small, still sleeping. There is time, if you use it.', effects: [] },
  ];
}

// ---------- SF143. ABILITY SECRETS ----------
const SF143: Json[] = [
  secret('secret-arena-tunnel', 'a Pokémon with Arena Trap or Sand Veil', ['arena-trap', 'sand-veil'], 'A tunnel mouth under the road, half full of sand, propped with old stone. It points straight toward the Gym. Your Pokémon is already pawing at it.', [
    ch('Dig it out.', out('Your Pokémon digs like it was born for this, which it was. The tunnel opens, and runs under the whole stage, and lets you out within sight of the Gym town.', { kind: 'skipAhead' }), { requires: [has('a Pokémon with Arena Trap or Sand Veil', 'arena-trap', 'sand-veil')] }),
    ch('Stay on the road.', leave()),
  ]),
  secret('secret-damp-cave', 'a Pokémon with Swift Swim or Water Absorb', ['swift-swim', 'water-absorb'], 'A cave mouth, half flooded. The water inside is cold and very clean, and your Pokémon pulls toward it like it smells home.', [
    ch('Swim in.', out('Your Pokémon slips into the water and is gone for a long minute. Then it surfaces, delighted, with a Mystic Water held carefully in its mouth.', item('mystic-water')), { requires: [has('a Pokémon with Swift Swim or Water Absorb', 'swift-swim', 'water-absorb')] }),
    ch('Leave it.', leave()),
  ]),
  secret('secret-flash-fire-door', 'a Pokémon with Flash Fire', ['flash-fire'], 'A door of black stone, sealed with wax and soot. The stone is faintly warm, as if a fire is still burning somewhere behind it.', [
    ch('Melt the seal.', out('Your Pokémon breathes on the seal, and the wax runs like water, and the door swings in on a cold hearth. In the ashes, a lump of Charcoal, still warm after all these years.', item('charcoal')), { requires: [has('a Pokémon with Flash Fire', 'flash-fire')] }),
    ch('Leave it.', leave()),
  ]),
  secret('secret-intimidate-gate', 'a Pokémon with Intimidate', ['intimidate'], 'A gate, and a big, calm guardian in front of it who has not moved in years. It looks at your party. Then it looks, for a long time, at your lead.', [
    ch('Meet its eyes.', out('Your Pokémon meets its stare and does not blink. After a long moment, the guardian dips its great head, respectfully, and steps aside. Behind the gate, hung on a nail, is a Muscle Band.', item('muscle-band')), { requires: [has('a Pokémon with Intimidate', 'intimidate')] }),
    ch('Back away.', leave()),
  ]),
  secret('secret-keen-eye-ledge', 'a Pokémon with Keen Eye', ['keen-eye'], 'A glint on a cliff face, high up, that your Pokémon will not stop staring at. Most people would never notice it.', [
    ch('Find the way up.', out('Your Pokémon picks out handholds you would never have seen, one after another, all the way up. The glint is a Scope Lens, wedged in a crack, waiting for someone with sharp enough eyes.', item('scope-lens')), { requires: [has('a Pokémon with Keen Eye', 'keen-eye')] }),
    ch('Leave it.', leave()),
  ]),
  secret('secret-levitate-chasm', 'a Pokémon with Levitate', ['levitate'], 'A chasm splits the road, and on the far side, on a ledge, an old chest sits with its lid half open. There is no bridge. Nothing could cross that, unless it floated.', [
    ch('Float over.', out('Your Pokémon floats across with you holding on, your feet dangling over nothing. In the chest, wrapped in oilcloth, something rare.', any(...RARE)), { requires: [has('a Pokémon with Levitate', 'levitate')] }),
    ch('Look for another way.', leave('The chasm stays a chasm.')),
  ]),
  secret('secret-magnet-vein', 'a Pokémon with Magnet Pull', ['magnet-pull'], 'Your compass spins and spins. In the rock face beside the road, a seam of something heavy is humming.', [
    ch('Draw it out.', out('Your Pokémon hums back at the rock, and the seam answers, and a lump of ore slides out into your hands: a Magnet, perfectly formed.', item('magnet')), { requires: [has('a Pokémon with Magnet Pull', 'magnet-pull')] }),
    ch('Leave it.', leave()),
  ]),
  secret('secret-pickup-burrow', 'a Pokémon with Pickup', ['pickup'], 'Your Pokémon scrabbles at a hollow log and uncovers a little burrow, stocked for winter: three Berries, set out neatly in a row.', [
    ch('Take all three.', out('You take all three Berries. The burrow looks very empty afterwards.', any(...BERRIES), any(...BERRIES), any(...BERRIES)), { requires: [has('a Pokémon with Pickup', 'pickup')] }),
    ch('Take two, leave one.', out('You take two and leave one for whoever stocked it. Your Pokémon watches you do it and leans against your leg, approving.', any(...BERRIES), any(...BERRIES), bondUp(1, 'lead')), { requires: [has('a Pokémon with Pickup', 'pickup')] }),
    ch('Leave it.', leave()),
  ]),
  secret('secret-synchronize-whisper', 'a Pokémon with Synchronize', ['synchronize'], 'Your Pokémon stops dead and tilts its head. It is listening to something you cannot hear, and then it starts to walk, quickly, off the path.', [
    ch('Follow it.', fight('It leads you to a clearing where a Psychic-type is hiding, very still, listening right back.', wild({ types: ['psychic'], lv: 1 })), { requires: [has('a Pokémon with Synchronize', 'synchronize')] }),
    ch('Call it back.', leave('It comes back, reluctantly, still listening over its shoulder.')),
  ]),
];

export const EVENTS: Json[] = [...SF142, ...SF143];
export const REMOVE: string[] = [];
void heal;
