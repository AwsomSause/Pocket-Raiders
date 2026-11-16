// Catalog Overhaul, families-b (STORY_FAMILIES_6.md, "Covers": the road chains): Miniature Episodes, part 2 of 2 (QUESTLINE),
// and The Last Train (QUESTLINES_DEEPENED_1.md FE8; the ledger merges the old three-step chain into it).
import { BERRIES, any, at, ch, ferry, fight, flag, flagIs, fr, good, hasAny, heal, item, join, loseOne, money, out, peace, ptype, rest, room, rp, scout, trainer, type Json } from '../dsl.ts';
import { ROOM, episode, foresight, moment, no, seen, temp } from './_fb.ts';

export const CATEGORY = 'families-b';

const cash = (amount: number): Json => ({ kind: 'money', amount });
const SMALL_BERRIES = ['pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'leppa-berry'];
const ANY_BERRY = [...BERRIES, ...SMALL_BERRIES];

const LAST_TRAINER = episode('the-last-trainer-of-town', 'The Last Trainer of the Town', { tint: '#3a3634' }, [
  {
    intro: `A town with every shutter closed and grass in the streets. One person left: a young trainer in the square, standing very straight. "Nobody passes through without a battle," he says. "That's the rule here. It was always the rule."`,
    choices: [
      ch('Battle him.', fight(`He fights like the whole empty town is watching. In a way, it is.`, trainer('Last Trainer', { size: 3, win: [flag('town-battled')] }))),
      ch('Ask where everyone went.', out(`"The mine closed. They went to the city. Mum, Dad, all my friends." He grips his Poké Ball. "Somebody has to keep the rule. Battle me." You do.`, flag('town-asked'), flag('town-battled'))),
    ],
  },
  {
    intro: `In the town hall, dust and quiet. On the wall, a big photograph: the square, full of people, a festival, a hundred trainers and their Pokémon. In the front row, a small boy with a Poké Ball held up high.`,
    by: [[[flagIs('town-asked')], `In the town hall, a big photo on the wall: the square, full of people, a festival. Small in the front row, the last trainer, holding up a Poké Ball. Everyone he told you about is in it.`]],
    choices: [
      ch('Take the photo down for him.', out(`You carry it out to the square. He sees it and doesn't speak for a long time. "I forgot what it looked like with people in it," he says at last.`, flag('town-photo'), good(1))),
      ch('Leave it where it hangs.', out(`It's his town. His memory. You leave it on the wall for him to find again when he's ready.`, flag('town-left-photo'), peace(1))),
    ],
  },
  {
    intro: `Morning. The last trainer stands at the town gate with a pack on his back, the rule-keeper's badge in his hand.`,
    by: [[[flagIs('town-photo')], `Morning. The last trainer is at the gate, the photo rolled up under his arm. "I'm going to find them," he says. "All of them. I'll show them this."`]],
    choices: [
      ch('Walk him to the edge of town.', out(`At the last house he stops and pins the badge to the gate. "Somebody else can keep the rule now. Or nobody." He walks out without looking back. You think that's the bravest thing you've seen.`, good(1), any('great-ball', 'ultra-ball'))),
      ch('Give him something for the road.', out(`You give him a Poké Ball, for whoever he meets out there. He weighs it in his hand and laughs, for the first time. "The rule was a battle. Not a gift." He keeps it.`, loseOne('poke-ball', 'great-ball'), good(2)), { requires: [hasAny('poke-ball', 'great-ball')] }),
    ],
  },
], 'The last trainer of an empty town finally left it, to go and find everyone.');

const BEYOND_GATE = episode('beyond-the-gate', 'Beyond the Gate', { types: ['psychic', 'ghost'], tint: '#2a2a3a' }, [
  {
    fx: 'fog',
    intro: `In the ruins, a gate of black iron stands open on its own. No wall either side. Just the gate. Through it, the same ruins. Except through it, the ruins are whole.`,
    choices: [
      ch('Walk through.', out(`One step and the stones are new, the roofs on, the bells ringing. People in old clothes don't see you. Behind you, the gate is still there. You keep a hand on it.`, flag('gate-through'))),
      ch('Look through without going.', out(`You watch the whole city go about its morning, a century ago. A child in the street looks right at you. Then the mist comes.`, flag('gate-looked'))),
    ],
  },
  {
    intro: `A voice from the other side of the gate. Old, kind, curious. "What is your name, traveller? We don't get many from the far side."`,
    by: [[[flagIs('gate-looked')], `A voice through the gate: the child you saw, grown up and grown old. "You looked at me once, through here. I remember. What is your name?"`]],
    choices: [
      ch('Tell it your name.', out(`The voice repeats it, slowly, like it is writing it somewhere. "Thank you. We remember everyone who answers. Few do."`, flag('gate-named'))),
      ch('Ask its name first.', out(`A long pause. "No one has asked that in a very long time." It tells you. It is a name from a gravestone you passed this morning.`, flag('gate-asked'), rp(10))),
    ],
  },
  {
    intro: `The gate is closing, slowly, on its own. In the gap, a narrow path of old stones you didn't see before, running ahead along your road.`,
    choices: [
      ch('Take the old path.', out(`It runs straight and true, a road from another century, and it comes out further along than you had any right to be.`, scout(2), foresight(1))),
      ch('Say goodbye first.', out(`You say the name the voice told you, once, through the gap. The gate stops for a moment. Then it closes gently. On the other side, someone was glad.`, peace(2), scout(1))),
    ],
  },
], 'You spoke through an open gate in the ruins to someone a century away.');

const MOON_MARKET = episode('moon-market', 'The Moon Market', { types: ['fairy'], tint: '#2a2a48' }, [
  {
    fx: 'sparkle',
    intro: `Full moon, and a market where there was a field: silver stalls, Clefairy behind the counters, moonlight in jars. Every price is paid in something that isn't money.`,
    choices: [
      ch('Pay with a song.', out(`You sing something your team knows. Badly. The Clefairy applaud and give you a jar of moonlight that makes your Fairy-types glow.`, flag('moon-sang'), fr(5, { types: ['fairy'] }))),
      ch('Pay with a berry.', out(`A berry for a Moon Stone. The Clefairy hold it up to the moon and nod gravely. Fair.`, loseOne(...ANY_BERRY), item('moon-stone'), flag('moon-berry')), { requires: [hasAny(...ANY_BERRY)] }),
      ch('Just look.', out(`You walk the stalls in the silver light. Nobody minds. Looking is free at the Moon Market. It's the only thing that is.`, flag('moon-looked'), peace(1))),
    ],
  },
  {
    pokemon: 'clefable',
    intro: `The oldest stall, the biggest Clefable. "A riddle," it says, in a voice like bells. "Answer, and choose anything. Miss, and you'll still go home with something."`,
    choices: [
      ch('"Ask it."', out(`"What do you keep by giving away?" You think. "A promise." The Clefable claps once and gives you your pick.`, flag('moon-riddle'), any('moon-stone', 'shiny-stone', 'dawn-stone')), { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out(`You get it wrong. The Clefable laughs kindly and gives you a Star Piece anyway. "For trying. The answer was a promise."`, item('stardust'), flag('moon-tried')) }),
      ch('Ask what it wants for an answer.', out(`"Only that you come back next full moon." You can't promise that. You say so. It likes that you said so.`, flag('moon-honest'), good(1))),
    ],
  },
  {
    intro: `Dawn is coming. The Moon Market is packing itself into moonbeams, stall by stall. The Clefairy wave.`,
    choices: [
      ch('Help them pack.', out(`You fold silver canvas while the moon sets. The last Clefairy gives you a pebble from the moon. It's warm. Then it's just a field, and dew.`, item('stardust'), heal(0.5))),
      ch('Watch it go.', out(`One by one the stalls go up the last of the moonlight like steps. When the sun comes up there is nothing there but sleeping grass.`, peace(1), rest())),
    ],
  },
], 'Under a full moon you traded at the Moon Market, and paid in things that weren\'t money.');

const MIRROR_RUN = episode('the-mirror-of-your-run', 'The Mirror of Your Run', { types: ['psychic'], tint: '#2a3040' }, [
  {
    fx: 'glint',
    intro: `A tall old mirror leaning on a tree in the middle of nowhere. In it, not your reflection: your team's best moments from this run, one after another, bright as if they were happening now.`,
    by: [
      [[seen('ovc-the-dance-at-the-edge-s1')], `A tall old mirror on a tree. In it, your run: the cliff at dawn, the Pokémon dancing. Your team, watching, the light on their faces.`],
      [[seen('ovc-whale-road-s1')], `A tall old mirror on a tree. In it, your run: an island rising out of the sea, and you climbing up its side. Your team at the Ring Game, cheering.`],
    ],
    choices: [
      ch('Watch with your team.', out(`They crowd round it, pointing at themselves, pushing each other. When their best moment comes, each of them goes quiet.`, fr(5), flag('mirrorrun-watched'))),
      ch('Watch alone.', out(`You let them sleep and watch it by yourself. It's a good run. You didn't know how good until now.`, peace(1), flag('mirrorrun-alone'))),
    ],
  },
  {
    intro: `The mirror stops on one moment and holds it. A voice that is almost yours: "Which would you change, if you could?"`,
    choices: [
      ch('"None of it."', out(`The mirror is quiet a while. "Even the bad parts?" Yes. They're part of how you got here. The glass warms under your hand.`, flag('mirrorrun-none'), peace(1))),
      ch('Name the one you\'d change.', out(`You say it out loud. It's harder than it sounds. The mirror doesn't change it. It just shows you that you're still here, after it.`, flag('mirrorrun-named'), good(1))),
    ],
  },
  {
    intro: `The mirror is clouding over. One last picture swims up in it: your team, right now, looking back at you.`,
    choices: [
      ch('Look at them, not the mirror.', out(`You turn round. There they are, the real ones. The mirror closes behind you like an eye. You won't need it.`, fr(5), heal(0.5))),
      ch('Touch the glass.', out(`It's warm. For a second you see the run ahead, nothing clear, only light. Then it's just old glass, and your face.`, temp('What the mirror showed', [{ kind: 'xpMultiplier', value: 1.1 }], 2))),
    ],
  },
], 'A mirror showed you this run\'s best moments, and asked what you would change.');

const ORCHESTRA = episode('the-orchestra-in-the-ruins', 'The Orchestra in the Ruins', { types: ['ghost'], tint: '#2a243a' }, [
  {
    fx: 'flicker',
    intro: `Music from a ruined concert hall. Inside, under a broken roof, an orchestra of ghosts: pale players, pale instruments, and Ghost-type Pokémon turning the pages. Every seat is empty but one.`,
    choices: [
      ch('Sit in the empty seat.', out(`You sit. The music finds you. It's a piece nobody has played in a hundred years and it's still beautiful. Your team sits in the aisle, very still.`, flag('orch-sat'), peace(1))),
      ch('Let a Ghost-type join the orchestra.', out(`Your Ghost-type drifts up onto the stage and takes an empty chair. The players make room. It knows the tune. It always knew it.`, flag('orch-ghost'), fr(8, { types: ['ghost'] })), { requires: [ptype('ghost')] }),
    ],
  },
  {
    pokemon: 'chandelure',
    intro: `The conductor, a tall pale woman with a Chandelure for a baton-light, turns at the end of the movement and looks straight at you. She nods.`,
    choices: [
      ch('Nod back.', out(`She smiles. "You stayed for the slow part," she says. "Most living people leave." She lifts the baton for the last movement.`, flag('orch-nodded'))),
      ch('Applaud.', out(`One pair of hands in a hall for two thousand. The ghosts turn and look. Then they all stand and bow to you. You've never felt so seen.`, flag('orch-clapped'), good(1))),
    ],
  },
  {
    intro: `The finale. Every instrument at once, the Chandelure blazing, the broken roof open to the stars.`,
    choices: [
      ch('Stay to the last note.', out(`It ends. The silence after is enormous. One by one the players fade, still holding their instruments, smiling. The conductor is last. She leaves her baton on the stand.`, item('spell-tag'), peace(1))),
      ch('Hum along.', out(`You hum the tune, and the orchestra hears it and plays to it, and when they go, the tune stays in your head for days. Your team hums it too.`, fr(5), heal(0.5))),
    ],
  },
], 'A ghost orchestra played its last concert in a ruined hall, and you stayed for every note.');

const MUSEUM = episode('the-museum-after-closing', 'The Museum After Closing', { tint: '#2a2a34' }, [
  {
    intro: `A museum, closed for the night, the side door ajar. Inside, fossils in the dark and a Pokémon skeleton the size of a house. A night light glows on a sign: PLEASE DO NOT TOUCH.`,
    choices: [
      ch('Look around quietly.', out(`You walk the halls with your team in a hush. The fossils are older than anything. Your Rock-types stand in front of them for a long time.`, flag('museum-quiet'), rp(10))),
      ch('Go in and close the door behind you.', out(`The latch clicks. You're in, with a whole museum to yourselves. Your team is thrilled. You are too.`, flag('museum-in'))),
    ],
  },
  {
    intro: `A torch beam. "Who's there?" A night guard, old, his Houndour at his heel. He sees you and lowers the torch a little.`,
    choices: [
      ch('Tell him the truth.', out(`"The door was open and I wanted to see." He looks at you a long moment. "That's why I took this job." He clips the torch to his belt. "Come on. I'll show you the good stuff."`, flag('museum-truth'), good(1))),
      ch('Say you\'re lost.', out(`He doesn't believe you. He doesn't mind either. "Lost in a museum. I've been lost in this one forty years." He shows you to the door, slowly, by the long way.`, flag('museum-lie'))),
    ],
  },
  {
    intro: `A door marked STAFF ONLY. The guard has a key.`,
    by: [[[flagIs('museum-truth')], `The guard stops at a door marked STAFF ONLY, and takes out his key. "Nobody sees this. You told me the truth, so you can."`]],
    choices: [
      ch('Go in.', out(`A small room. On a velvet cushion, a fossil nobody has catalogued: a perfect egg, still in its stone. "I found it," he says. "I never told them. I wanted it to stay a secret a while longer." He gives you a piece of stone from its shelf.`, any('old-amber', 'helix-fossil', 'dome-fossil'), peace(1))),
      ch('Say it\'s his secret to keep.', out(`He smiles, and puts the key back. "Then I'll keep it for both of us." He lets you out by the front door, like a guest.`, good(1), heal(0.3))),
    ],
  },
], 'An old night guard showed you the museum after closing, and a secret.');

const FERRIS = episode('the-ferris-wheel', 'The Ferris Wheel', { tint: '#3a2a3a' }, [
  {
    intro: `An empty fairground, the rides rusted still, except one. A lone Ferris wheel, turning slowly, its lights on, no one at the controls. One car has its door open.`,
    choices: [
      ch('Get in.', out(`You and your team squeeze into the car. The door shuts by itself. You rise, slowly, over the dark fairground.`, flag('ferris-in'))),
      ch('Find the operator first.', out(`In the booth, a Magneton humming at the switches, keeping the wheel going all on its own. It sees you, and opens a door for you.`, flag('ferris-in'), flag('ferris-magneton'))),
    ],
  },
  {
    intro: `At the top of the wheel, the car rocks gently. You can see the whole road you've walked, and much of what's ahead.`,
    choices: [
      ch('Look ahead.', out(`The road ahead, lit by moonlight: every bend, every clearing. You memorise it.`, scout(3), flag('ferris-ahead'))),
      ch('Look back.', out(`The road behind, every place you stopped. It is further than you thought. Your team presses against the glass, looking for places they know.`, peace(1), fr(3), flag('ferris-back'))),
    ],
  },
  {
    intro: `The car comes down. At the bottom, the wheel stops, lights going out one by one.`,
    by: [[[flagIs('ferris-magneton')], `The car comes down. At the bottom, the Magneton floats out of its booth, switches off the wheel, and comes to look at you, humming.`]],
    choices: [
      ch('Thank the wheel.', out(`You pat the rusted car. The last light goes out. The fairground is quiet and you are rested, as if you'd slept.`, rest())),
      ch('Ask the Magneton to come.', out(`It looks at the wheel, its job for years and years. Then it looks at the road. It comes.`, join({ species: ['magneton'] })), { requires: [flagIs('ferris-magneton')] }),
    ],
  },
], 'A lone Ferris wheel took you up over the whole road, behind and ahead.');

const SMALL_BATTLES = episode('the-garden-of-small-battles', 'The Garden of Small Battles', { types: ['bug', 'grass'], tint: '#2e4a2a' }, [
  {
    intro: `In a garden bed, tiny Pokémon are battling over one red flower: a Joltik, a Cutiefly, a Nymble, all of them fierce. They are the size of thumbs. It is the most serious battle you've ever seen.`,
    choices: [
      ch('Watch.', out(`Feints, counters, a dramatic retreat, a comeback. The Cutiefly wins, by a whisker. The others bow, solemnly.`, flag('garden-watched-fight'), rp(10))),
      ch('Cheer for the smallest.', out(`You cheer for the Joltik. It hears and fights harder. It doesn't win. It looks over at you afterwards anyway, and lifts a leg.`, flag('garden-cheered'))),
    ],
  },
  {
    pokemon: 'cutiefly',
    intro: `The winner, a Cutiefly, buzzes over and lands on your hand. It's holding the red flower. It holds it out to you.`,
    choices: [
      ch('Take the flower.', out(`You take it gently. The Cutiefly buzzes once round your head and goes back to the others. The flower smells of honey.`, item('honey'), flag('garden-flower'))),
      ch('Give it back to the loser.', out(`You give the flower to the Joltik. Everyone stops. Then the Cutiefly buzzes, delighted, as if that was the best answer.`, flag('garden-shared'), good(1))),
    ],
  },
  {
    intro: `A whole garden of tiny Pokémon is waiting for you, lined up round a ring of pebbles. They want a referee.`,
    choices: [
      ch('Referee fairly.', out(`You call every bout with total seriousness. They accept every call. At the end, they all bow to you. Your own team is jealous.`, fr(3), peace(1))),
      ch('Let one of them come with you.', out(`The Joltik you cheered for steps forward out of the line. It's decided.`, join({ species: ['joltik'] })), { requires: [flagIs('garden-cheered')] }),
    ],
  },
], 'You refereed the tiny Pokémon of a garden, who fight very seriously over flowers.');

const SINGLE_BERRY = episode('the-weight-of-a-single-berry', 'The Weight of a Single Berry', { tint: '#3a3424' }, [
  {
    pokemon: 'torkoal',
    intro: `An old Torkoal by the road, its shell cracked with age. It nudges your bag, sniffing. You offer food. It turns away. You offer more. It turns away. It only wants one thing: a berry. Any berry.`,
    choices: [
      ch('Give it a berry.', out(`It takes it gently in its mouth, doesn't eat it, and walks very slowly off into the scrub. It looks back once.`, loseOne(...ANY_BERRY), flag('berry-given')), { requires: [hasAny(...ANY_BERRY)] }),
      ch('Say you have none.', out(`It looks at you a long time. Then it lies down by the road, as if to wait. You find you don't want to leave it there.`, flag('berry-none'))),
    ],
  },
  {
    intro: `The old Torkoal again, out of the scrub, coming to meet you. It is carrying something in its mouth.`,
    by: [[[flagIs('berry-none')], `The old Torkoal again. It looks tired. It has carried a little stone all this way and puts it down at your feet. It wants to swap.`]],
    choices: [
      ch('Take what it brought.', out(`It's a seed, polished smooth. The Torkoal nudges it toward you. Then toward the ground. It wants you to plant it.`, flag('berry-seed'))),
      ch('Follow it.', out(`It leads you to a dry clearing. In the middle, a grave of stones, and a dead berry bush. The berry you gave it is lying there, like an offering.`, flag('berry-seed'), flag('berry-grave'))),
    ],
  },
  {
    intro: `You plant the seed. Somewhere between one breath and the next, a green shoot comes up. The Torkoal watches it, very still.`,
    by: [[[flagIs('berry-grave')], `You plant the seed by the grave of stones. The shoot comes up. The Torkoal lays its head beside it. Whoever planted the old bush, this one is for them.`]],
    choices: [
      ch('Sit with the Torkoal.', out(`You stay till the shoot has two leaves. The Torkoal sleeps beside it, smoke puffing softly. You don't wake it when you go.`, peace(2), heal(0.5))),
      ch('Ask it to come with you.', out(`It thinks about the shoot. It will grow without it now. It gets up, very slowly, and follows you.`, join({ species: ['torkoal'] }))),
    ],
  },
], 'An old Torkoal wanted one berry, and planted it for someone it had lost.');

const SNOW_GLOBE = episode('the-snow-globe', 'The Snow Globe', { types: ['ice'], tint: '#2a3648' }, [
  {
    fx: 'snow',
    intro: `In the snow by a milestone, a snow globe. Inside it: this road, this milestone, and a tiny you and your tiny team, standing exactly where you are standing now.`,
    choices: [
      ch('Shake it.', out(`Snow swirls in the globe. And around you, real snow begins to fall, very gently, out of a clear sky.`, flag('globe-shook'))),
      ch('Keep it still.', out(`You hold it carefully. In the globe, the tiny you is holding a tiny snow globe. You don't look closer.`, flag('globe-still'))),
    ],
  },
  {
    intro: `You look into the snow globe. The tiny figure of you looks up out of it. And waves.`,
    choices: [
      ch('Wave back.', out(`You wave. It waves. Then it points: along the road, to a place you can't see yet. It looks worried.`, flag('globe-waved'), foresight(1))),
      ch('Put it down and back away.', out(`You set it on the milestone. The tiny you watches you go, still waving.`, flag('globe-left'))),
    ],
  },
  {
    intro: `A crack runs across the snow globe, through the tiny road and the tiny team.`,
    choices: [
      ch('Hold it together.', out(`You cup it in your hands. The crack stops. Inside, the tiny you holds its tiny globe the same way. It will last a while. Long enough.`, item('never-melt-ice'), peace(1))),
      ch('Let it break.', out(`It breaks, snow and water and glass. Nothing happens. The snow stops falling. Your team crowds round you, real and warm.`, fr(5), heal(0.3))),
    ],
  },
], 'You found a snow globe with you inside it, and the tiny you waved.');

const DANCE_EDGE = episode('the-dance-at-the-edge', 'The Dance at the Edge', { tint: '#4a3a4a' }, [
  {
    intro: `Before dawn at the edge of a cliff, wild Pokémon are dancing in a circle: Oricorio, a Lurantis, Bellossom, Spinda turning on their own, slowly, to a song only they can hear.`,
    choices: [
      ch('Watch from the rocks.', out(`They dance in the grey light like they've done it every morning of their lives. Your team sways where they sit.`, flag('dance-watched'), peace(1))),
      ch('Let your team join.', out(`Your Pokémon step into the circle, shy at first. The Oricorio shows them the steps. By the third turn they're dancing.`, flag('dance-joined'), fr(5))),
    ],
  },
  {
    pokemon: 'oricorio',
    intro: `The Oricorio leading the dance steps out of the circle, comes to you, and holds out a wing.`,
    choices: [
      ch('Dance with it.', out(`You have no idea what you're doing. It doesn't care. It leads you round the circle twice and the whole cliff cheers in its own way.`, flag('dance-danced'), fr(3))),
      ch('Bow instead.', out(`You bow. It bows. Then it goes back to the circle and dances a step it made up just now, for you.`, flag('dance-bowed'), good(1))),
    ],
  },
  {
    intro: `The sun comes up over the edge of the world and the dancers stop and turn to face it, all together.`,
    choices: [
      ch('Face the sun with them.', out(`Light floods the cliff. Every one of them is golden. So is your team. So are you. You will remember this when nothing else from this run is left.`, heal(1), peace(1))),
      ch('Ask the Oricorio to come.', out(`It looks at its circle, at the sunrise, then at you, and steps over the line.`, join({ species: ['oricorio'] })), { requires: [flagIs('dance-danced')] }),
    ],
  },
], 'At dawn on a cliff edge, wild Pokémon danced, and you danced with them.');

const WELL_SONG = episode('the-song-in-the-well', 'The Song in the Well', { tint: '#2a3034' }, [
  {
    intro: `An old stone well in a dead village. You call down into it, and your voice comes back. Not an echo. A song, in your voice, with words you didn't say.`,
    choices: [
      ch('Sing down into it.', out(`You sing. It sings back, the same tune, but kinder, and slower, and you notice your hands have stopped shaking.`, flag('well-sang'))),
      ch('Drop a coin in.', out(`It falls a long way. Then, from far down, a single clear note, like thank you.`, cash(-10), flag('well-coin'))),
    ],
  },
  {
    intro: `You lean over the well, and it speaks first, in your voice: "What are you afraid of?"`,
    choices: [
      ch('Answer honestly.', out(`You tell it. It's quiet for a while. Then, in your voice, it sings a lullaby you'd forgotten anyone ever sang you.`, flag('well-honest'), good(1))),
      ch('"Nothing."', out(`It laughs, in your voice. It isn't cruel. "That's what I said too," it says.`, flag('well-nothing'))),
    ],
  },
  {
    intro: `The well is quiet now. When you look down, there is water at the bottom, clear and still, catching the sky.`,
    by: [[[flagIs('well-honest')], `The well is quiet. Down at the bottom, clear water, and your own face in it, looking a little younger than you feel.`]],
    choices: [
      ch('Draw some water.', out(`It's the coldest, sweetest water you've ever tasted. Your team drinks and drinks. The village is still dead. It doesn't feel dead any more.`, heal(1))),
      ch('Leave it quiet.', out(`You put the cover back on. It has said what it wanted to say.`, peace(2))),
    ],
  },
], 'A well in a dead village sang back in your voice, and asked what you were afraid of.');

const LONG_NIGHT = episode('the-long-night-at-the-inn', 'The Long Night at the Inn', { tint: '#3a2e24' }, [
  {
    fx: 'rain',
    intro: `A storm drives you into an inn. Four strangers by the fire: a nervous scholar, a woman with a Persian, a huge silent sailor, and a trainer in a hood, back to the room.`,
    choices: [
      ch('Join them by the fire.', out(`The scholar talks, the woman listens, the sailor nods. Nobody asks your name. The hooded trainer doesn't turn round.`, flag('inn-joined'))),
      ch('Sit apart and watch.', out(`From the corner you see things they don't: the scholar's hands shaking, the woman's Persian watching the hood.`, flag('inn-watched'), rp(5))),
    ],
  },
  {
    intro: `Midnight. The hooded trainer stands, and turns. It's someone you've battled on this road. They've been beaten by you before, and they haven't forgotten.`,
    by: [[[flagIs('inn-watched')], `Midnight. The hooded trainer turns. You already guessed, from the Persian watching: someone you've beaten before. They knew you were here all along.`]],
    choices: [
      ch('Battle, by the fire.', fight(`The strangers clear the tables. Rain hammers the roof.`, trainer('Hooded Trainer', { size: 4, lv: 1, win: [flag('inn-beat-rival'), cash(500)] }))),
      ch('Share a drink instead.', out(`You hold out a cup. They look at it a long time. Then they sit. The storm is very loud. You talk until the fire's low, about the road and the people on it.`, flag('inn-drank'), peace(1), good(1))),
    ],
  },
  {
    intro: `Morning. The storm has blown itself out. The strangers are going their ways.`,
    by: [
      [[flagIs('inn-drank')], `Morning. The hooded trainer is waiting by the door. "I'll beat you next time," they say. "But I'll buy the drinks." They nearly smile.`],
      [[flagIs('inn-beat-rival')], `Morning. The hooded trainer has already gone. On your table, a note: "Again. Somewhere else." The scholar is reading it over your shoulder.`],
    ],
    choices: [
      ch('Say goodbye to everyone.', out(`The scholar shakes your hand too hard. The woman's Persian lets you stroke it. The sailor lifts you off your feet in a hug, without a word. You walk out into a clean, bright day.`, rest(), fr(3))),
      ch('Slip out early.', out(`You leave money for breakfast for all five of you and go out into the washed morning.`, cash(-200), good(1), rest()), { requires: [money(200)] }),
    ],
  },
], 'A storm kept you at an inn all night with four strangers, one of them an old opponent.');

// ---------------------------------------------------------------- The Last Train (FE8)
// Pairs with The Last Stop (GREENNEEDLE_PLACED_1.md section 9, greenneedle thread): that scene sets run flag `last-stop-ticket`
// and starts the node timer `ovt-last-stop` when the Dusknoir punches the ticket; the train comes on the ticket's date, at Night,
// at least twenty nodes on. A Pokémon lost for good this run is run flag `lost-mon` (`lost-mon-name` for its name, if set).
const LOST = flagIs('lost-mon');
const LAST_TRAIN: Json[] = [
  {
    id: 'ovc-last-train-s1', name: 'The Last Train', types: ['ghost'], callback: true, room: false, minStage: 8,
    requires: [flagIs('last-stop-ticket'), { kind: 'flag', key: 'ovt-last-stop', atLeast: 20, atMost: 99 }, at('night'), no('train-done')],
    scene: { cast: [], pokemon: 'dusknoir', tint: '#14141e', effect: 'fog' },
    intro: `The ticket in your pocket has a date on it, and today is that date. The rest stop isn't where it was. There's a platform, one lamp, and a timetable with one line on it, and no times. A train comes in without a sound. Its windows are lit. The conductor holds out a hand. "Ticket." He punches it again, the same hole. "End of the line. For somebody. Not you. Not yet."`,
    choices: [
      ch('"Who?"', out(`"I don't carry names," the conductor says. "I carry seats. Third carriage. You'll know."`, flag('train-done'), room('fb-last-train-carriage'))),
      ch('Ride anyway.', out(`"One stop," says the conductor. "Then you get off. I'll see to it." Out of the window as it goes, lit up one by one: every place on this road where you stopped for somebody.`, flag('train-done'), flag('train-rode'), ferry(), moment('You rode the Last Train one stop. Every place you had stopped for somebody was lit up as it passed.', 60))),
      ch('Get off.', out(`You step back. The train goes, without a sound. The platform is a rest stop again, and the ticket in your hand is blank.`, flag('train-done'), rest())),
    ],
  },
  {
    id: 'fb-last-train-carriage', name: 'The Last Train: The Third Carriage', group: 'Overhaul chains', rarity: 'rare', types: ['ghost'], ...ROOM,
    scene: { cast: [], tint: '#14141e', effect: 'fog' },
    intro: `The third carriage. One empty seat by the window, with a reserved card on it. The name has been rubbed out. "Kept for a while yet," says the conductor, behind you. "With luck."`,
    remembers: [{ id: 'train-lost', when: [LOST], intro: `The third carriage. By the window, someone you lost this run. It sees you on the platform. It gets up. The door is open, and it's on the step, and it can't come any further. You can.`, hide: [0], addChoices: [] }],
    choices: [
      ch('Get off, and let it keep its seat.', out(`You step back onto the platform. The whistle. The train goes, and the empty seat goes with it, still waiting. You hope it waits a long time.`, peace(1))),
      ch('"I\'m sorry."', out(`It puts its head against your hand. The whistle. It goes back to its seat and looks out of the window until the window's gone.`, fr(5, 'party'), moment('On the Last Train you said goodbye, properly, to the Pokémon you lost.', 80)), { requires: [LOST] }),
      ch('"Thank you."', out(`It looks at you like it always did. The whistle. It goes back to its seat and watches you from the window until the window's gone.`, fr(5, 'party'), moment('On the Last Train you said goodbye, properly, to the Pokémon you lost.', 80)), { requires: [LOST] }),
      ch('"You were the best of us."', out(`It stands a little taller. The whistle. It goes back to its seat, and it doesn't look sad. It looks proud. The window goes.`, fr(5, 'party'), moment('On the Last Train you said goodbye, properly, to the Pokémon you lost.', 80)), { requires: [LOST] }),
    ],
  },
];

export const EVENTS: Json[] = [
  ...LAST_TRAINER, ...BEYOND_GATE, ...MOON_MARKET, ...MIRROR_RUN, ...ORCHESTRA, ...MUSEUM, ...FERRIS, ...SMALL_BATTLES, ...SINGLE_BERRY, ...SNOW_GLOBE,
  ...DANCE_EDGE, ...WELL_SONG, ...LONG_NIGHT, ...LAST_TRAIN,
];
// The ledger folds the old three-step Last Train into the single FE8 scene (MERGE).
export const MERGED: Record<string, string> = {
  'ovc-last-train-s2': 'ovc-last-train-s1', 'ovc-last-train-s3': 'ovc-last-train-s1',
  // Rival beats (rivals thread, Rival questlines R3 and R15).
  'ovc-rival-note-s1': 'rival-map-note', 'ovc-rival-note-s2': 'rival-map-note',
  'ovc-rival-gift-s1': 'rival-trap-gift', 'ovc-rival-gift-s2': 'rival-trap-gift',
};
// Old chains the ledger hands to the legends systems (legends thread, PR #1326): retired, the rule that covers them.
const LEGEND_CHAINS = ['lugia-shrine', 'hooh-pursuit', 'birds-trial', 'mewtwo-crisis', 'beasts-pursuit', 'weather-crisis', 'eon-pursuit', 'regis-shrine', 'time-space-trial', 'giratina-shrine', 'lake-trial', 'ideals-calling', 'aura-crisis', 'sun-moon-shrine', 'sword-shield-calling', 'ruin-quartet-shrine', 'guardians-trial', 'justice-trial', 'necrozma-crisis', 'eternal-crisis'];
const TELLINGS = ['strange-researcher', 'fallen-star', 'wishing-comet', 'star-compass', 'sky-whale'];
const steps = (k: string) => [1, 2, 3].map((n) => `ovc-${k}-s${n}`);
export const RULED: Record<string, string> = Object.fromEntries([
  ...LEGEND_CHAINS.flatMap((c) => steps(`legend-${c}`)).map((id) => [id, 'Blessing ladder: Trial and Recognition scenes (legends)']),
  ...TELLINGS.flatMap(steps).map((id) => [id, 'Mythical Tellings and Ultra Static (legends)']),
]);
export const REMOVE: string[] = [...Object.keys(MERGED), ...Object.keys(RULED)];
