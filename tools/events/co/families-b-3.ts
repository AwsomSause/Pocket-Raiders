// Catalog Overhaul, families-b (STORY_FAMILIES_6.md SF41): the eight short chains, each a Stage-Three (beats on steps 6, 12, 17 of one stage).
// Each beat is its own event; beats 2 and 3 need the flag the beat before set (placement/families-b.json gives shape, chain and beat).
import { BERRIES, anyType, at, br, ch, fight, flag, flagIs, fr, hasAny, heal, item, join, leave, loseOne, moveFlag, out, rest, stopHere, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { GEMS, moment, no, rem, temp, withBr } from './_fb.ts';

export const CATEGORY = 'families-b';

const inRegion = (...ids: string[]): Json => ({ kind: 'region', ids });
/** Beat 1 of a chain: drawn on its own, once per run. */
const beat1 = (doneKey: string, extra: Json[] = []) => ({ requires: [no(doneKey), ...extra], callback: false, room: false, minStage: 1 });
/** Beat 2 or 3: comes back on a later step once the beat before was played. */
const beatN = (needs: string, doneKey: string, extra: Json[] = []) => ({ requires: [flagIs(needs), no(doneKey), ...extra], callback: true, room: false, minStage: 1 });

// ---------------------------------------------------------------- SF41.1 The Sunken City (tide-lock; the sunken bell merges in)
const VALE = flagIs('vale-freed');
const SUNKEN_CITY: Json[] = [
  {
    id: 'ovc-tide-lock-s1', name: 'The Sunken City: The Tide Lock', ...beat1('city-b1'), types: ['water'], scene: { cast: [], tint: '#1c3040', effect: 'none' },
    intro: 'A sea cave that only opens at low tide. A shellfisher straightens up from her rake as you pass, and points at the black mouth of it with her chin. "You\'ve got an hour. Then the sea comes back."',
    choices: [
      ch('Go in.', out('Wet stone, then dry stone, then carved stone. At the back of the cave is a door cut by hands, with a hole in the middle shaped exactly like a bell. Water drips. Somewhere, the sea is already turning.', flag('city-on'), flag('city-b1'))),
      ch('Wait for next low tide.', out('You sit on the rocks with the shellfisher and watch the sea swallow the cave mouth. "It\'ll open again," she says. "It always does. A stage or so." She goes back to raking.', flag('city-wait'), flag('city-b1'))),
      ch('Ask what\'s inside.', out('Shellfisher: "My granny said a city. Under the bay. The cave\'s its front door." She smiles. "She said a lot of things." You go in. At the back, a carved door, and a hole in it shaped like a bell.', flag('city-on'), flag('city-granny'), flag('city-b1'))),
    ],
  },
  {
    id: 'fb-city-low-tide', name: 'The Sunken City: Low Tide Again', group: 'Overhaul chains', rarity: 'rare', types: ['water'], ...beatN('city-wait', 'city-on'), scene: { cast: [], tint: '#1c3040', effect: 'none' },
    intro: 'A stage later, the same cave, the same hour of low water. The shellfisher is still raking. She lifts a hand when she sees you. "Told you. It always opens."',
    choices: [
      ch('Go in.', out('Wet stone, then carved stone. At the back is a door cut by hands, with a hole in the middle shaped exactly like a bell.', flag('city-on'))),
      ch('Ask what\'s inside.', out('Shellfisher: "My granny said a city. Under the bay. The cave\'s its front door." You go in. At the back, a carved door, and a hole in it shaped like a bell.', flag('city-on'), flag('city-granny'))),
    ],
  },
  {
    id: 'ovc-tide-lock-s2', name: 'The Sunken City: The Chamber', ...beatN('city-on', 'city-b2'), types: ['water'], scene: { cast: [], tint: '#14283a', effect: 'fog' },
    intro: 'Past the bell-shaped door: a chamber, and a mural that covers every wall. A city. A bell tower. A wave as tall as the tower. Tiny painted people pull the bell rope with all their strength to warn the city. Nobody in the painted streets is looking up.',
    choices: [
      ch('Look for the bell.', out('You search every corner of the chamber with your light. Rope fixings, a cracked beam, the round mark on the floor where something heavy once stood. It isn\'t here. It was carried away, or it fell.', flag('city-looked'), flag('city-b2'))),
      ch('Copy the mural.', out('You copy it line by line onto the back of a map while the water rises around your boots. In the corner of the painting, half rubbed away, the tower stands in the bay: an X where the bell should be.', flag('city-sketch'), flag('city-b2'), moment('You copied the mural of the Sunken City. Your sketch shows where its bell lies.'))),
      ch('Leave before the tide.', out('The first cold water touches your ankles. You do not argue with it. You are out on the sand before the cave mouth closes, and safe.', flag('city-left'), flag('city-b2'))),
    ],
    remembers: [rem('granny', [flagIs('city-granny')], { notice: 'A city under the bay. The shellfisher\'s granny said a lot of things. This one was true.' })],
  },
  {
    id: 'ovc-tide-lock-s3', name: 'The Sunken City: The Bell Under the Water', ...beatN('city-b2', 'city-b3', [{ kind: 'partyType', type: 'water' }]), types: ['water'], scene: { cast: [], tint: '#0c2034', effect: 'float' },
    intro: 'The tide is coming in hard. And under the rushing water, somewhere off shore, a bell is ringing. Your Water-type takes you down to it: the drowned tower, still standing in the dark of the bay. The bell hangs in it, swinging by itself, ringing a warning to a city that has been gone for a thousand years.',
    choices: [
      withBr(ch('Ring it once more.', out('You take the rope. You ring it the way the painted people did, with all your strength, for all of them. Something answers from the deep: a shoal of Relicanth rises around the tower, older than the city, and circles it once in silence.', flag('city-rang'), flag('city-b3'))),
        br([flagIs('blessing-kyogre')], 'You take the rope. You ring it the way the painted people did, with all your strength, for all of them. Something answers from the deep: a shoal of Relicanth rises around the tower. Far below them, something vast and blue turns over in its sleep.', flag('city-rang'), flag('sign-kyogre', 1), flag('city-b3'))),
      ch('Bring it up.', out('It takes two of you and most of an afternoon. The bell comes up out of the bay streaming water and weed, and goes into the hub, where it hangs quiet. They say it rings when a tear opens in the sky of this region.', flag('city-bell'), flag('city-b3'), moment('You raised the bell of the Sunken City. It hangs in the hub and rings when a tear opens in the sky.', 75))),
      ch('Stop it ringing.', out('You catch the bell and hold it until it is still. The sea goes quiet. On the shore, the shellfisher is waiting. "My granny always said that bell kept her up," she says, and laughs, and wipes her eyes. "Thank you."', flag('city-quiet'), flag('city-b3'))),
    ],
    remembers: [
      rem('vale', [VALE], { notice: 'You know this story. A town that called a warning and nobody listened: the Hollow Vale. The shellfisher\'s granny was from the Vale.' }),
      rem('sketch', [flagIs('city-sketch')], { notice: 'Your sketch of the mural shows the X. You swim straight to it.' }),
    ],
  },
];

// ---------------------------------------------------------------- SF41.2 Whale Song (singing-whale)
const WHALE_POD = flagIs('whale-pod');
const WHALE_SONG: Json[] = [
  {
    id: 'ovc-singing-whale-s1', name: 'Whale Song', ...beat1('whale-b1', [at('evening', 'night')]), types: ['water'], scene: { cast: [], tint: '#24304a', effect: 'none' },
    intro: 'Dusk over the bay. A song comes across the water, so low you feel it in your ribs before you hear it. The ferryman ties off his boat. "It sings to the moon. Every full moon for thirty years."',
    choices: [
      ch('Listen.', out('You sit on the jetty until the moon is high. Your Water-types sit with you, very still, as if the song were in a language they half remember. Nobody wants to leave.', rest(), { kind: 'friendship', amount: 5, who: { types: ['water'], every: true } }, flag('whale-listened'), flag('whale-b1'))),
      ch('Sing back.', out('Your Pokémon lifts its voice across the bay. The song stops. Then, very close, the sea bulges, and something enormous comes up to see who answered.', flag('whale-on'), flag('whale-b1')), { requires: [moveFlag('sound')] }),
      ch('Row out.', out('The ferryman rows you out without a word. In the middle of the bay he ships the oars. The water beside the boat rises like a hill.', flag('whale-on'), flag('whale-b1'))),
    ],
  },
  {
    id: 'ovc-singing-whale-s2', name: 'Whale Song: The Surfacing', ...beatN('whale-on', 'whale-b2'), types: ['water'], scene: { cast: [], pokemon: 'wailord', tint: '#1c2c44', effect: 'float' },
    intro: 'A Wailord, so close you could touch it, so big the boat sits in its shadow. Its hide is a map of old scars. It rolls, slowly, and looks at you with one dark eye.',
    choices: [
      ch('Touch it.', out('You lay your hand flat on its side. It is warm. It sighs, a long sound that shakes the boat, and a spout of warm water rains down over all of you. The ferryman laughs like a boy.', flag('whale-touched'), flag('whale-b2'))),
      ch('Wait.', out('You do nothing. Neither does it. Then it sings again, right beside you, louder than before, and the whole bay hums with it.', flag('whale-b2'))),
      ch('Ask why it sings.', out('Ferryman, quietly: "Lost its calf in a storm. Thirty years back. It\'s been singing for it every full moon since."', flag('whale-why'), flag('whale-b2'))),
    ],
    remembers: [rem('pod', [WHALE_POD], { notice: 'You called the pod up the river once, for a Wailmer that had never seen its own kind. This scarred one was in it. It is that calf, grown.' })],
  },
  {
    id: 'ovc-singing-whale-s3', name: 'Whale Song: The Gift', ...beatN('whale-b2', 'whale-b3'), types: ['water'], scene: { cast: [], pokemon: 'wailmer', tint: '#24304a', effect: 'float' },
    intro: 'The great whale dives. Where it was, something small bobs up, round and curious, and bumps the side of the boat: a Wailmer. It looks at you, then down at the dark water, then at you again.',
    choices: [
      ch('Take it.', out('It rolls into the boat, nearly sinking it. The ferryman bails, grinning. Somewhere below, the song changes, softer, the way a parent sounds when a child goes off to see the world.', join({ species: ['wailmer'] }), flag('whale-took'), flag('whale-b3'))),
      ch('Let it go back.', out('You push it gently away from the boat. It dives after the Wailord. A moment later there are two voices under the bay, singing together, one very deep and one very new.', flag('whale-back'), flag('whale-b3'))),
      ch('Watch.', out('You watch them swim off together, side by side, out past the headland. The song comes back on the wind, different now. It does not sound like grief any more.', flag('whale-watched'), flag('whale-b3'))),
    ],
    remembers: [rem('why', [flagIs('whale-why')], { notice: 'Thirty years of singing for one calf. And now, in the water beside the boat, a small one.' })],
  },
];

// ---------------------------------------------------------------- SF41.3 The Stone Giant
const REGI = flagIs('blessing-regi');
const STONE_GIANT: Json[] = [
  {
    id: 'ovc-stone-giant-s1', name: 'The Stone Giant', ...beat1('giant-b1'), types: ['ground', 'ghost'], scene: { cast: [], tint: '#3a3a2a', effect: 'none' },
    intro: 'On the hill above the village lies a rock formation shaped exactly like a giant asleep. A shepherd waves from its knee. "We picnic on its belly. It\'s never minded."',
    choices: [
      ch('Climb on it.', out('You climb up onto the great stone chest. Under your boots, very slowly, the whole hill shifts.', flag('giant-on'), flag('giant-b1'))),
      ch('Knock on it.', out('You knock, three times, on a mossy stone the size of a door. Up on the hilltop, a boulder that is not a boulder slides open. An eye looks at you.', flag('giant-on'), flag('giant-knocked'), flag('giant-b1'))),
      ch('Leave it.', leave('You leave the giant to its sleep and the shepherd to his picnic. Some hills should stay hills.')),
    ],
  },
  {
    id: 'ovc-stone-giant-s2', name: 'The Stone Giant Speaks', ...beatN('giant-on', 'giant-b2'), types: ['ground', 'ghost'], scene: { cast: [], pokemon: 'golurk', tint: '#3a3a2a', effect: 'shake' },
    intro: 'The giant is a Golurk, older than the village, covered in moss and a hundred years of picnic crumbs. It rumbles. The ground answers. The shepherd nearly faints into his sheep.',
    choices: [
      ch('Battle it.', fight('It rises, shedding turf, until it blocks out the sun. It is slow. It is enormous. It does not know how to lose.', wild({ species: ['golurk'], lv: 2, win: [flag('giant-fought'), flag('giant-b2')] }))),
      ch('Apologise.', out('You tell it you are sorry for waking it. It looks at you for a long time. Then the great eye closes. It will sleep a hundred more years, and the shepherd will picnic on it the whole time.', flag('giant-sorry'), flag('giant-b2'))),
      ch('Sit and wait.', out('You sit down in the grass. The giant sits up, very slowly, and looks out at the valley: the village, the river, the roads that were not there last time it looked. It lies back down.', flag('giant-waited'), flag('giant-b2'))),
    ],
  },
  {
    id: 'ovc-stone-giant-s3', name: 'The Stone Giant: The Gem', ...beatN('giant-b2', 'giant-b3'), types: ['ground', 'ghost'], scene: { cast: [], pokemon: 'golurk', tint: '#3a3a2a', effect: 'glint' },
    intro: 'When you pass the hill again, there is something lying in the grass at the giant\'s side, where its chest meets the ground. A stone from its heart, glowing faintly. Whatever you chose, it dropped this for you.',
    choices: [
      ch('Take it.', out('It is heavy and warm, like a stone that has been in the sun all day. It will be for a long time.', { kind: 'itemFrom', ids: ['rock-gem', 'moon-stone'], count: 1 }, flag('giant-gem'), flag('giant-b3'))),
      withBr(ch('Put it back.', out('You set it back where it came from, against the giant\'s chest. Deep in the hill, something rumbles. It sounds like thanks.', flag('giant-returned'), flag('giant-b3'))),
        br([REGI], 'You set it back against the giant\'s chest. Deep in the hill, something rumbles, and far away, something older answers: the rumble of ancient stone that was made, like this one, to keep a promise.', flag('giant-returned'), flag('sign-regi', 1), flag('giant-b3'))),
    ],
  },
];

// ---------------------------------------------------------------- SF41.4 The Glass Forest
const DIANCIE_KEPT = flagIs('promise-kept-diancie');
const OFFER_GEM = ch('Offer a gem.', out('You hold out a gem from your bag. The clear one takes it in its tiny hands, turns it to the light, and presses it into the earth. A crystal sapling rises from the spot while you watch, and starts to chime.', loseOne(...GEMS), flag('glass-gave'), flag('glass-b2')), { requires: [hasAny(...GEMS)] });
const GLASS_FOREST: Json[] = [
  {
    id: 'ovc-glass-forest-s1', name: 'The Glass Forest', ...beat1('glass-b1'), types: ['rock', 'fairy'], scene: { cast: [], tint: '#2a3a44', effect: 'sparkle' },
    intro: 'Trees that chime like glass in the wind. Each trunk is crystal, each leaf a sliver of light. Something too clear to see moves between them: you only know it is there by how the light bends.',
    choices: [
      ch('Walk carefully.', out('You walk through on the soft moss, touching nothing. The forest lets you pass, chiming quietly all around you. Behind you, the clear one watches you go.', flag('glass-b1'))),
      ch('Ring the trees.', out('You tap a trunk. Then another. A tune runs through the forest, tree to tree. The clear one stops, delighted, and comes out to see who is playing.', flag('glass-on'), flag('glass-b1'))),
      ch('Follow the clear one.', out('You follow the bending light deep into the forest. It knows. It lets you. In a clearing it stops, and turns, and you see it.', flag('glass-on'), flag('glass-b1'))),
    ],
  },
  {
    id: 'ovc-glass-forest-s2', name: 'The Glass Forest: The Glass Pokémon', ...beatN('glass-on', 'glass-b2'), types: ['rock', 'fairy'], scene: { cast: [], pokemon: 'carbink', tint: '#2a3a44', effect: 'sparkle' },
    intro: 'A Carbink, clear as water, standing in a ring of crystal trees. Light passes straight through it and comes out the other side in colours.',
    choices: [
      ch('Catch it.', out('It does not run. It turns once in the light, as if to show you its best side, and lets the Ball take it.', join({ species: ['carbink'] }), flag('glass-caught'), flag('glass-b2'))),
      ch('Watch it.', out('You sit and watch. It begins to sing, a thin bright sound, and every tree in the forest answers it, note for note, until the air itself is ringing.', flag('glass-watched'), flag('glass-b2'))),
      OFFER_GEM,
    ],
    remembers: [rem('diancie', [DIANCIE_KEPT], { intro: 'A Diancie, clear as water, standing in a ring of crystal trees. You kept your promise to her. A Carbink hovers at her side, and the light passes through both of them in colours.' })],
  },
  {
    id: 'ovc-glass-forest-s3', name: 'The Glass Forest: Shards Remain', ...beatN('glass-b2', 'glass-b3'), types: ['rock', 'fairy'], scene: { cast: [], tint: '#1c2a34', effect: 'sparkle' },
    intro: 'As you leave, the forest behind you shatters softly, tree by tree, the way it does every night. It is not sad. By morning it will have grown back. The path at your feet glitters with shards.',
    choices: [
      ch('Take a shard.', out('You pick up one shard, still faintly warm. In your hand it turns from glass to clay, soft and grey, still holding the light inside it.', item('light-clay'), flag('glass-shard'), flag('glass-b3'))),
      ch('Leave them.', out('You leave every shard where it fell. Behind you, before you are out of sight, the first new trees are already chiming. It grows back faster when nothing is taken.', flag('glass-left'), flag('glass-b3'))),
    ],
    remembers: [rem('gave', [flagIs('glass-gave')], { notice: 'The sapling you watched grow is the only tree that does not break. It chimes after you all the way to the edge of the forest.' })],
  },
];

// ---------------------------------------------------------------- SF41.5 The Fox at the Shrine (quiet-shrine-keeper; the snow fox trail merges in)
const RED_VULPIX = inRegion('kanto', 'johto');
const vulpixJoin = (text: string, ...fx: Json[]): Json => withBr(ch('Let it come with me.', out(text, join({ species: ['vulpix-alola'] }), ...fx)), br([RED_VULPIX], text, join({ species: ['vulpix'] }), ...fx));
const FOX: Json[] = [
  {
    id: 'ovc-quiet-shrine-keeper-s1', name: 'The Fox at the Shrine', ...beat1('fox-b1'), types: ['ice'], scene: { cast: [], tint: '#3a4658', effect: 'snow' },
    intro: 'A snowy shrine on a hill. Its keeper, an old woman named Aiko, is on her knees in the drifts, searching with bare red hands. "I\'ve lost the key to the shrine. Three days now. The offerings are inside." Tiny tracks lead away through the snow.',
    choices: [
      ch('Follow the tracks.', out('Small, neat prints, four toes and a brush mark where a tail dragged. They wind away between the pines. You follow them.', flag('fox-on'), flag('fox-b1'))),
      ch('Help her search.', out('You search with her until your hands are as red as hers. Nothing. Then you notice the tracks again, circling the shrine, as if someone had been watching you both look. You follow them.', flag('fox-on'), flag('fox-helped'), flag('fox-b1'))),
      ch('Pick the lock.', out('Your Pokémon has the old lock open in a moment. Aiko goes very quiet. "That is not how this door is opened." She will not go in. The tracks lead away, and you follow them, feeling smaller.', flag('fox-on'), flag('fox-picked'), flag('fox-b1')), { requires: [anyType('dark', 'steel')] }),
    ],
  },
  {
    id: 'ovc-quiet-shrine-keeper-s2', name: 'The Fox Shows Itself', ...beatN('fox-on', 'fox-b2'), types: ['ice'], scene: { cast: [], pokemon: 'vulpix-alola', tint: '#3a4658', effect: 'snow' },
    intro: 'At the end of the tracks, sitting on a stone in the snow, an Alolan Vulpix, white as the drifts, with an iron key in its mouth. It has clearly been waiting. It looks very pleased with itself.',
    choices: [
      ch('Ask for the key.', out('You crouch and hold out your hand. It considers you, head on one side, for a long moment. Then it drops the key into your palm.', flag('fox-asked'), flag('fox-b2'))),
      ch('Chase it (a node).', out('It is off like a snowball down a hill. You chase it through the drifts until neither of you can breathe. It stops, flops down, and drops the key, tired and enormously happy.', takeNode(), flag('fox-chased'), flag('fox-b2'))),
      ch('Offer a trade.', out('You hold out a Berry. It sniffs the Berry. It sniffs you. It sets the key down in the snow, very precisely, and takes the Berry in exchange, like a merchant.', loseOne(...BERRIES), flag('fox-traded'), flag('fox-b2')), { requires: [hasAny(...BERRIES)] }),
    ],
    remembers: [rem('red', [RED_VULPIX], { intro: 'At the end of the tracks, sitting on a stone in the snow, a Vulpix, red as a coal against the drifts, with an iron key in its mouth. It has clearly been waiting. It looks very pleased with itself.' })],
  },
  {
    id: 'ovc-quiet-shrine-keeper-s3', name: 'The Fox at the Shrine: The Offering', ...beatN('fox-b2', 'fox-b3'), types: ['ice'], scene: { cast: [], tint: '#3a4658', effect: 'snow' },
    intro: 'Aiko opens the shrine with shaking hands. The offering inside is food for a fox. She has left it every winter for forty years. The Vulpix trots in and sits beside the bowl. "It took the key so I\'d come looking," Aiko says. "It wanted to meet you."',
    choices: [
      vulpixJoin('Aiko kneels and strokes its ears, once. "Go on, then." It walks out of the shrine at your side, and only looks back once.', flag('fox-joined'), flag('fox-b3')),
      ch('Leave it with Aiko.', out('You leave them together, the old woman and the fox, in the warm light of the shrine. As you go, small footprints follow you a little way, and then turn back.', flag('fox-left'), flag('fox-b3'))),
      ch('Make the offering together.', out('You kneel with her and set out the food, bowl by bowl, the way she has done alone for forty years. The fox eats. Aiko cries a little. The shrine will keep a fire for travellers now.', stopHere('heal'), flag('fox-together'), flag('fox-b3'))),
    ],
    remembers: [rem('picked', [flagIs('fox-picked')], { notice: 'Aiko does not look at the lock you opened. She looks at the fox instead, and her face softens anyway.' })],
  },
  {
    id: 'fb-fox-gift', name: 'The Fox at the Shrine: A Gift in the Snow', group: 'Overhaul chains', rarity: 'rare', types: ['ice'], requires: [flagIs('fox-b3'), no('fox-joined'), no('fox-gift')], callback: true, room: false, minStage: 1, scene: { cast: [], tint: '#3a4658', effect: 'snow' },
    intro: 'Morning frost on your camp. On the stone by your bedroll, someone has left a gift: a shard of ice that does not melt in your hand. A line of small, neat prints leads away into the white.',
    choices: [ch('Keep it.', out('It stays cold all day, and all the next. You know exactly who brought it.', item('never-melt-ice'), flag('fox-gift')))],
  },
];

// ---------------------------------------------------------------- SF41.6 The Midnight Circus
const PIERRE = flagIs('pierre-done');
const CIRCUS: Json[] = [
  {
    id: 'ovc-midnight-circus-s1', name: 'The Midnight Circus', ...beat1('circus-b1', [at('night')]), types: ['psychic', 'dark'], scene: { cast: [], tint: '#2a1a3a', effect: 'confetti' },
    intro: 'A circus has gone up overnight in a field that was empty at sunset. Lanterns, a striped tent, music. A ringmaster in a tall hat spreads his arms. "Come in, come in! One night only. Every night." The performers are all Pokémon. The trainers who should be with them are nowhere.',
    choices: [
      ch('Go in.', out('The show is wonderful and strange. A Mr. Mime builds a staircase out of nothing and walks up it. A Delibird juggles seven presents and never drops one. A Mimikyu peeks out of a side tent and will not come further.', flag('circus-on'), flag('circus-b1'))),
      ch('Where are the trainers?', out('The ringmaster\'s smile does not move. "Gone. Years ago. The Pokémon keep the show going." He holds the tent flap open for you. You go in.', flag('circus-on'), flag('circus-asked'), flag('circus-b1'))),
      ch('Leave.', leave('You walk on. When you look back from the next hill, the field is dark and empty, as if nothing had ever been there.')),
    ],
  },
  {
    id: 'ovc-midnight-circus-s2', name: 'The Midnight Circus: Join an Act', ...beatN('circus-on', 'circus-b2'), types: ['psychic', 'dark'], scene: { cast: [], tint: '#2a1a3a', effect: 'confetti' },
    intro: 'The ringmaster, Lazlo, finds you between acts. "Our tightrope walker\'s sick. Your Pokémon could fill in?" Above you, the wire stretches across the tent, very high, very thin.',
    choices: [
      ch('Fill in.', out('Your Pokémon steps onto the wire, wobbles, finds its feet, and walks the whole length to a roar from a hundred Pokémon in the stands. It comes down glowing.', fr(10, 'picked'), flag('circus-act'), flag('circus-b2')), { pick: {}, prompt: { id: 'brace-hold', needs: 'good' }, fail: out('Your Pokémon steps onto the wire and wobbles all the way across, arms out, nearly falling twice. The crowd holds its breath, and when it makes it, cheers twice as loud.', fr(5, 'picked'), flag('circus-act'), flag('circus-b2')) }),
      ch('Fill in myself.', out('You climb the ladder yourself. You walk the wire with your heart in your throat, step by step, not looking down. The crowd of Pokémon goes absolutely wild.', flag('circus-walked'), flag('circus-b2'))),
      ch('No.', out('Lazlo bows. "Of course." The show goes on without a tightrope act, and it goes badly. The Delibird drops a present. Nobody laughs. Everyone tries very hard.', flag('circus-no'), flag('circus-b2'))),
    ],
  },
  {
    id: 'ovc-midnight-circus-s3', name: 'The Midnight Circus: The Finale', ...beatN('circus-b2', 'circus-b3'), types: ['psychic', 'dark'], scene: { cast: [], pokemon: 'zoroark', tint: '#2a1a3a', effect: 'confetti' },
    intro: 'The finale. The Mimikyu comes out of its tent at last, into the middle of the ring. Lazlo kneels to welcome it, and for one moment his tall hat and smile flicker. Lazlo is a Pokémon too: a Zoroark, holding the whole circus together in his illusion.',
    choices: [
      ch('Thank him.', out('You thank him, for the show, for keeping it going, for all of them. He bows deep. By morning the field is empty again. The circus has moved on, down the road, ahead of you.', flag('circus-thanked'), flag('circus-b3'))),
      ch('Let the illusion drop.', out('He lets it go. An empty field at dawn, and a dozen Pokémon blinking in the grey light, no lanterns, no tent. "Find them homes," Lazlo says. "Please." One stays with you. The rest walk to the nearest town.', join({ species: ['mr-mime', 'delibird'] }), flag('circus-dropped'), flag('circus-b3'), moment('The Midnight Circus was a Zoroark\'s illusion. You found its performers homes.', 75))),
      ch('Join the circus.', out('Not literally. Lazlo laughs, and puts his ringmaster\'s hat on your head, and the Mimikyu climbs into your arms and will not be put down.', join({ species: ['mimikyu'] }), flag('circus-hat'), flag('circus-b3'), moment('Lazlo the Zoroark gave you his ringmaster\'s hat.'))),
    ],
    remembers: [rem('pierre', [PIERRE], { notice: 'In the front row, an old juggler with a Mr. Mime on his knee is crying openly. Pierre. He knows a good act when he sees one.' })],
  },
  {
    id: 'fb-circus-again', name: 'The Midnight Circus Comes Back', group: 'Overhaul chains', rarity: 'rare', types: ['psychic', 'dark'], requires: [flagIs('circus-thanked'), no('circus-again'), at('night')], callback: true, room: false, minStage: 1, scene: { cast: [], tint: '#2a1a3a', effect: 'confetti' },
    intro: 'Lanterns in a field that was empty at sunset. The striped tent. The music. A ringmaster in a tall hat sees you coming and spreads his arms. "Our friend! One night only. Every night. You have a seat in the front row."',
    choices: [ch('Watch the show.', out('You watch it all again from the front row. The Delibird juggles nine presents now. At the end, the Mimikyu waves to you from the middle of the ring.', rest(), heal(0.5), flag('circus-again')))],
  },
];

// ---------------------------------------------------------------- SF41.7 The Mirror Lake
const MIRROR: Json[] = [
  {
    id: 'ovc-mirror-lake-s1', name: 'The Mirror Lake', ...beat1('mirror-b1'), types: ['psychic', 'water'], scene: { cast: [], tint: '#1c2a3a', effect: 'none' },
    intro: 'A lake so still it looks solid. Your team is reflected in it, but wrong: six Pokémon you could have caught on this road and didn\'t, and a trainer who looks exactly like you, smiling a little too long.',
    choices: [
      ch('Look closer.', out('You lean over the water. The reflection leans up out of it, dry as paper, and steps onto the shore beside you.', flag('mirror-on'), flag('mirror-b1'))),
      ch('Throw a stone.', out('The stone goes in. Ripples run out across the lake and break the other team into pieces. When the water settles, the reflection is still there, waiting, as if it had all the time in the world.', flag('mirror-on'), flag('mirror-b1'))),
      ch('Walk away.', out('You walk away fast. But in every puddle on the road, for the rest of this region, you catch it out of the corner of your eye: the other you, the other team, keeping pace.', flag('mirror-on'), flag('mirror-follows'), flag('mirror-b1'))),
    ],
  },
  {
    id: 'ovc-mirror-lake-s2', name: 'The Mirror Lake: The Other Team', ...beatN('mirror-on', 'mirror-b2'), types: ['psychic', 'water'], scene: { cast: [], tint: '#1c2a3a', effect: 'flicker' },
    intro: 'The reflection stands in front of you, with its six behind it: every Pokémon you passed by on this road. "You could have had these," it says, in your voice. "Let\'s see if you chose right."',
    choices: [
      ch('Battle.', fight('Your own face across the field, and six Pokémon you know and never knew. It is a hard, strange battle.', trainer('Your Reflection', { uncaught: true, size: 6, lv: 2, win: [flag('mirror-won'), flag('mirror-b2')] }))),
      ch('"I chose right."', fight('"Prove it." The reflection sends out the first of the six.', trainer('Your Reflection', { uncaught: true, size: 6, lv: 1, win: [flag('mirror-right'), flag('mirror-won'), flag('mirror-b2')] }))),
      ch('"Maybe I didn\'t."', out('The reflection tilts its head. Then it holds out one of its six, the one you saw last, and asks for one of yours in return. Both sides of the trade are there in front of you. It is honest.', { kind: 'tradeAway', want: { label: 'one of your Pokémon' } }, join({ uncaught: true }), flag('mirror-traded'), flag('mirror-b2')), { requires: [{ kind: 'partySize', atLeast: 2 }] }),
    ],
    remembers: [rem('follows', [flagIs('mirror-follows')], { notice: 'It has followed you in every puddle since the lake. It is tired of waiting.' })],
  },
  {
    id: 'ovc-mirror-lake-s3', name: 'The Mirror Lake: The Ripple', ...beatN('mirror-b2', 'mirror-b3'), types: ['psychic', 'water'], scene: { cast: [], tint: '#1c2a3a', effect: 'none' },
    intro: 'The lake goes still again. When you look down, the reflection is your real team, every one of them, looking up at you from the water.',
    choices: [
      ch('Thank them.', out('You say it out loud, to the water and to the six beside you. You chose right. They know. Every one of them leans in a little closer.', fr(3, 'party'), flag('mirror-thanked'), flag('mirror-b3'))),
      ch('Touch the water.', out('Your fingertip breaks the surface, and you see one future: your team, older, standing in the light of the League. It lasts a heartbeat. It stays with you much longer.', temp('A glimpse of the League', [{ kind: 'bossDamageMultiplier', value: 1.05 }, { kind: 'bossDamageTakenMultiplier', value: 0.95 }], 1, 'boss'), flag('mirror-touched'), flag('mirror-b3'))),
    ],
    remembers: [rem('right', [flagIs('mirror-right')], { notice: 'The reflection smiled when you won. It looked, for a moment, almost relieved.' })],
  },
];

// ---------------------------------------------------------------- SF41.8 The Day Everything Slept (a Darkrai Telling)
const GUEST = flagIs('guest-darkrai');
const NO_TELLING = no('telling-darkrai');
const SLEPT: Json[] = [
  {
    id: 'ovc-the-day-everything-slept-s1', name: 'The Day Everything Slept', ...beat1('slept-b1'), types: ['dark', 'psychic'], scene: { cast: [], tint: '#141428', effect: 'fog' },
    intro: 'Every Pokémon in the area is asleep. Even yours: one by one, they lie down where they stand, and nothing wakes them. Wild Pokémon lie in the road. A town\'s Pokémon sleep in doorways. At the edge of town, a shadow moves.',
    choices: [
      ch('Follow the shadow.', out('It keeps just ahead of you, through the silent streets and up toward a hill. It is leading you. You are almost sure it is leading you.', flag('slept-on'), flag('slept-b1'))),
      ch('Try to wake my starter.', out('You kneel and shake it gently, then not gently. It does not wake. But in its sleep it mumbles something, and you would know that sound anywhere. It is your name.', flag('slept-on'), flag('slept-starter'), flag('slept-b1'))),
      ch('Find someone awake.', out('Only one: a child on a doorstep, holding a sleeping Skitty. She looks up at you. "It\'s not a bad dream," she says. "It\'s a sad one."', flag('slept-on'), flag('slept-child'), flag('slept-b1'))),
    ],
  },
  {
    id: 'ovc-the-day-everything-slept-s2', name: 'The Day Everything Slept: A Dream-Eater', ...beatN('slept-on', 'slept-b2'), types: ['dark', 'psychic'], scene: { cast: [], pokemon: 'hypno', tint: '#141428', effect: 'fog' },
    intro: 'On the hill, a Hypno, swaying, its pendulum swinging over the sleeping town. It is feeding. And watching it from the shadow of a tree, very still, a dark shape with a white plume: Darkrai.',
    choices: [
      ch('Fight the Hypno.', out('No Pokémon of yours can fight. So you walk up the hill yourself, and stand between the Hypno and the town, and do not look at the pendulum. It stares. You stare back. It breaks first, and flees.', flag('slept-fought'), flag('slept-b2'))),
      ch('Ask Darkrai for help.', out('Darkrai moves once, and the Hypno is gone over the hill. Darkrai looks at you. "It was eating them. I only bring the dreams." Then it is only a shadow under a tree again.', flag('slept-darkrai'), flag('telling-darkrai', 1), flag('slept-b2'))),
      ch('Wake the Hypno.', out('You shout. You throw water from the well. The Hypno jerks awake, staring at the town, at you, at its own pendulum. It was asleep too, sleepwalking and feeding. It is utterly mortified.', flag('slept-woke'), flag('slept-b2'))),
    ],
    remembers: [rem('child', [flagIs('slept-child')], { notice: 'Not a bad dream. A sad one. The child was right: the Hypno is not cruel. It is lost.' })],
  },
  {
    id: 'ovc-the-day-everything-slept-s3', name: 'The Day Everything Slept: Everyone Wakes', ...beatN('slept-b2', 'slept-b3'), types: ['dark', 'psychic'], scene: { cast: [], tint: '#3a3048', effect: 'none' },
    intro: 'Everyone wakes at once. Doors bang, people call names, a hundred Pokémon yawn in the road. Your starter is on its feet before anyone, running to you as if you had been gone a year.',
    choices: [
      ch('Hug it.', out('You catch it and hold on. It is warm and real and awake, and it does not let go first.', fr(10, 'starter'), flag('slept-hug'), flag('slept-b3'))),
      ch('Check the town.', out('You go door to door. Everyone is fine, a little dazed, very hungry. The Pokémon Center nurse insists on looking at your team while she is at it.', heal(1), flag('slept-town'), flag('slept-b3'))),
      withBr(ch('Look for Darkrai.', out('Gone. Under the tree on the hill there is only a single white plume, lying in the grass like a feather from a bird nobody has ever seen.', flag('slept-plume'), flag('slept-b3'))),
        br([NO_TELLING], 'Gone. Under the tree on the hill there is only a single white plume, lying in the grass. You pick it up, and for a moment you hear a voice that is not a voice: I only bring the dreams.', flag('slept-plume'), flag('telling-darkrai', 1), flag('slept-b3'))),
    ],
    remembers: [rem('guest', [GUEST], { intro: 'Everyone wakes at once. Doors bang, a hundred Pokémon yawn in the road. And beside your starter, sitting quietly in the grass as if it had been there all along, is Darkrai. It is watching your starter wake up.' })],
  },
];

export const EVENTS: Json[] = [...SUNKEN_CITY, ...WHALE_SONG, ...STONE_GIANT, ...GLASS_FOREST, ...FOX, ...CIRCUS, ...MIRROR, ...SLEPT];

// The ledger folds these chains into the scenes above (MERGE): never drawn again, still loadable by saved runs.
export const MERGED: Record<string, string> = {
  'ovc-sunken-bell-s1': 'ovc-tide-lock-s3',
  'ovc-sunken-bell-s2': 'ovc-tide-lock-s3',
  'ovc-sunken-bell-s3': 'ovc-tide-lock-s3',
  'ovc-snow-fox-trail-s1': 'ovc-quiet-shrine-keeper-s1',
  'ovc-snow-fox-trail-s2': 'ovc-quiet-shrine-keeper-s2',
  'ovc-snow-fox-trail-s3': 'ovc-quiet-shrine-keeper-s3',
};
export const REMOVE: string[] = Object.keys(MERGED);
