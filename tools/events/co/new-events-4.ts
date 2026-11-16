// The 100 new events, Part 4 (NE76 to NE100): hazards and places, rests and bond, puzzles and mysteries, shops and games, festivals and whole-run events.
// Script: catalog_overhaul/NEW_EVENTS_4.md. Placement: NEW_EVENTS_PLACED.md, categories 16 to 20.
// NE76 to NE80 keep the ids of their simplified builds (tools/events/hazards.ts), NE81 to NE85 the camp-* ids (src/data/events/camp-rests.json):
// this file replaces them by id, and keeps the flags other events read (fog-named: the foggy-moor hazard; camp-pair, camp-argument, camp-photo, camp-photo-home).
// Build: npm run co:build -- new-events-4
import { $, BERRIES, HEALING, HELD, RARE_HELD, SNACKS, bond, bondIs, bondUp, cure, fight, flag, flagAgo, flagAt, flagIs, fr, heal, hurtLead, item, join, money, moveFlag, out, rest, room, stopHere, takeNode, takeNodeBack, trainer, wild, type Json } from '../dsl.ts';
import { GROUP, L, P, after, ch, has, kind, lose, moment, ne, not, place, rep, step, teach, temp, variant } from './_ne.ts';

export { CATEGORY } from './_ne.ts';
export const REMOVE: string[] = [];

/** Stages since a flag was first set (the `flag` effect stamps the stage). */
const age = (key: string, atLeast = 1, atMost = 99): Json => ({ kind: 'flagAge', key, atLeast, atMost });
/** The stage is themed with one of these types. */
const stageIs = (...types: string[]): Json => ({ kind: 'stageTypes', types });
/** Opens this scene's stop beside the node reached after N more nodes. */
const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const healPicked = (share = 1): Json => ({ kind: 'heal', share, who: 'picked' });
const again = (eventId: string): Json => ({ kind: 'seeAgain', eventId });
const prices = (value: number): Json => ({ kind: 'priceMultiplier', group: 'all', value });
const night: Json = { kind: 'period', in: ['evening', 'night'] };
const GIFTS = [...BERRIES, 'pecha-berry', 'fresh-water', 'moomoo-milk', 'super-potion', 'great-ball'];

// =====================================================================================================================
// CATEGORY 16. HAZARDS AND PLACES
// =====================================================================================================================

const BRIDGE_WALK = (): Json[] => [
  ch('Walk by ear.', out(P(
    'You stand at the first plank with your eyes shut and listen. The wind plays a note. You step where the note is.',
    'Plank by plank the melody rises up through your boots. Where a plank is missing you hum the gap, and somehow your feet find the far side of it.',
    'On the last post a Metronome hangs from a string, swinging in the wind, keeping time for a musician who is not here to hear it.',
  ), item('metronome')), { prompt: { id: 'echo-rhythm', needs: 'ok' }, fail: out(P(
    'Your foot comes down on the wrong note. It is a sour, cracked sound, and the whole bridge bucks under you like something stung.',
    'Your lead is thrown against the ropes. Winifred hauls you both back to the start by your collars. "Again," she says. "Listen this time."',
  ), hurtLead(0.1), room('ne76-the-bridge-again')) }),
];

const NE76: Json[] = [
  ne(76, 'bridge-that-sings', 'The Bridge That Sings', GROUP.hazard, {
    id: 'ne76-bridge-that-sings',
    place: { earliest: 'A3', home: 12, window: [9, 15], sits: 'must-see', attaches: 'instead', tags: ['high', 'cave'], note: 'Must-see when drawn: it is the only bridge.' },
    tags: ['Exploration', 'Pokémon'], effect: 'float', tint: '#14243a',
  },
  P(
    'A rope bridge hangs over the gorge, and it hums. The wind runs through it like a bow across strings, and every plank answers in its own note.',
    'Some planks are missing. Where they should be there is only air, and the tune stumbles over each gap like someone forgetting the words to a song they loved.',
    L('Bridge mender Winifred: "Built by a musician. Walk it right and it plays her song. Walk it wrong and it throws you."', 'Winifred: "I replace planks. I can\'t tune them."'),
    'She knocks a new plank with her knuckle. It is pale and sound and gives back a dull, flat nothing. She looks at it the way you look at a word you cannot remember.',
  ), [
    ...BRIDGE_WALK(),
    ch('Send a sound-move Pokémon first.', out(P(
      'Your Pokémon steps out onto the first plank, listens, and sings. Where a note is missing it sings the missing note, clear and sure.',
      'Plank by plank the path lights up under its voice. Winifred stops halfway through tying a knot and just listens, her mouth open.',
      'You cross behind it on a song. On the last post a Metronome swings on a string. Your Pokémon looks back at you, very pleased with itself.',
    ), bondUp(1, 'picked'), item('metronome')), { pick: { moveFlag: 'sound' } }),
    ch('Help her tune the new planks (a node).', out(P(
      'It takes the whole afternoon. Your Pokémon sings each pitch, one at a time, and Winifred shaves each new plank until it sings the same note back.',
      'When the last plank goes in, the wind comes up the gorge and the bridge plays her song. All of it. No gaps. Winifred sits down on the edge of the gorge and cries.',
      L('Winifred: "Forty years I\'ve kept it standing. I\'d forgotten how it went."', 'She presses a Metronome into your hands. "She\'d want it used."'),
    ), takeNode(), flag('bridge-tuned'), ...kind(1), item('metronome')), { pick: { moveFlag: 'sound' } }),
  ], [
    variant('exploud-on-cue', [flagIs('exploud-healed')], {
      notice: 'Halfway across there is a gap where the deepest note should be. And then, from far off over the forest, a roar comes rolling in, exactly on cue, exactly that note. The Exploud has not forgotten you.',
    }),
  ]),
  step(76, 'ne76-the-bridge-again', 'The Bridge That Sings', GROUP.hazard, { effect: 'float', tint: '#14243a' },
    P('The bridge settles. The wind tries the planks again, one note at a time, as if it is giving you the tune slowly.', 'Winifred: "Feet where the note is. Not where the wood is."'), BRIDGE_WALK()),
  after(76, 'ne76-the-whistled-song', 'The Whistled Song', GROUP.hazard, [flagIs('bridge-tuned'), age('bridge-tuned')], { minStage: 4, tint: '#14243a' },
    P('A carter goes by on the road, whistling. You know the tune before you know why you know it.', 'It is the bridge\'s song. The whole of it, no gaps. It has got out into the world, and people are carrying it from town to town without knowing where it came from.'), [
      ch('Whistle the next bar back.', out('The carter grins and whistles the bar after that, and you go on together a while, two strangers finishing a dead musician\'s song.', moment('Travellers whistle the bridge\'s song now. You helped tune it.'))),
    ]),
];

const NE77: Json[] = [
  ne(77, 'fog-that-asks', 'The Fog That Asks Questions', GROUP.hazard, {
    id: 'ne77-fog-that-asks',
    place: { earliest: 'A4', home: 13, window: [10, 16], sits: 'must-see', attaches: 'before', tags: ['eerie'], note: 'It covers three steps. Inside the fog the map does not show the next nodes; a true name clears it at once.' },
    tags: ['Mystery', 'Exploration'], pokemon: 'froslass', effect: 'fog', tint: '#202428',
  },
  P(
    'The fog here is thick enough to lean on. It beads on your sleeves and fills your mouth with the taste of cold stone. You cannot see your own boots.',
    'Then it speaks. Its voice is soft and very polite, like someone knocking at a door they are not sure they should knock on.',
    L('The fog: "Excuse me. Who goes there?"', 'The fog: "I ask everybody. Nobody answers properly."'),
    'Shapes drift in it. A Froslass, perhaps, turning slowly on the cold air. Or only weather, pretending to be someone.',
  ), [
    ch('Give my name.', out(P(
      'You tell it. Your real name, said plainly into the white.',
      L('The fog: "Thank you."', 'It says it the way people say it when they have stopped expecting anyone to be kind.'),
      'The fog draws back like a curtain, and the moor is there, wet and green and ordinary. Behind you, very softly, it says your name once, to keep it.',
    ), flag('fog-named'))),
    ch('Give a false name.', out(P(
      'You give it a name that isn\'t yours. It comes out easily. That is the worst part.',
      L('The fog: "Thank you."', 'It says the false name back to you, carefully, as if it were something precious it had been handed to hold.'),
      'It parts. You walk through. You do not look back, and you feel it watching you go.',
    ), flag('honest-lied'), flag('fog-lied'))),
    ch('Ask who it is.', out(P(
      'You ask it who it is. The fog goes very still, and very quiet, for so long you think it has gone.',
      L('The fog: "I\'ve forgotten."', 'The fog: "I was hoping one of you would know."'),
      'The white around you thins a little, waiting. Nobody has ever asked it that before.',
    ), room('ne77-a-name-for-the-fog'))),
  ]),
  step(77, 'ne77-a-name-for-the-fog', 'A Name for the Fog', GROUP.hazard, { pokemon: 'froslass', effect: 'fog', tint: '#202428' },
    P('The fog waits, and you understand it is waiting for you.', 'You could give it a name. Nobody ever has. You go through the names you know, looking for one that fits something soft and cold and lonely and polite.'), [
      ch('"I\'ll call you Mistral."', out(P('"Mistral," it says. Then again, trying it on: "Mistral."', 'The fog lifts all at once, delighted, rolling up the hillside in long happy swirls. You hear it saying its name to the heather all the way across the moor.'), flag('fog-given-name'))),
      ch('"I\'ll call you Haar."', out(P('"Haar," it says. "Haar. Like the sea fog. Was I the sea once?"', 'It does not wait for an answer. It goes rolling off over the moor, delighted, trying its name on every rock it passes.'), flag('fog-given-name'))),
      ch('"I\'ll call you Brume."', out(P('"Brume," it says, and it laughs, a small damp laugh like rain starting.', 'The fog lifts in a single sweep, delighted, and for a moment the whole moor is full of light. Somewhere in it a Froslass is laughing too.'), flag('fog-given-name'))),
    ]),
  after(77, 'ne77-the-fog-remembers', 'The Fog Remembers', GROUP.hazard, [flagIs('fog-lied'), age('fog-lied'), stageIs('ghost', 'psychic', 'dark')], { minStage: 5, pokemon: 'froslass', effect: 'fog', tint: '#16181c' },
    P('The fog is back, and it is thicker this time. It presses close and cold, and it does not ask who you are.', 'It already knows. It says the false name you gave it, quietly, and the way it says it tells you it has found out. It sounds hurt.'), [
      ch('Push through.', out('You put your head down and walk. The fog does not part for you this time. Your lead stumbles on a rock it never saw.', hurtLead(0.1))),
      ch('Wait for it to thin (a node).', out('You sit and wait. It takes a long time. When it finally thins it does so without a word, and it does not say goodbye.', takeNode())),
    ]),
];

const NE78: Json[] = [
  ne(78, 'orchard-after-fire', 'The Orchard After the Fire', GROUP.hazard, {
    id: 'ne78-orchard-after-fire',
    place: { earliest: 'A3', home: 8, window: [5, 12], sits: 'optional', attaches: 'after', tags: ['hot', 'forest'], note: 'Plant new trees takes the next node.' },
    tags: ['Pokémon', 'Story'], cast: ['trainer.worker_m'], pokemon: 'leavanny', effect: 'glint', tint: '#2a1c10',
  },
  P(
    'Black trunks stand in rows, all the way to the hedge. The ground is grey ash. Nothing grows. Nothing sings.',
    'In the very middle one tree is green, untouched, as if the fire walked round it. A Leavanny sits in its branches, sewing.',
    'It reaches out from the green tree to the black ones beside it and stitches fresh leaves onto the dead twigs, one leaf at a time, very neatly.',
    L('Orchardist Cuthbert: "Fire took the lot. It\'s stitching leaves on dead trees."', 'Cuthbert: "I haven\'t the heart to stop it."'),
  ), [
    ch('Help it.', out(P(
      'Your Pokémon climbs up beside the Leavanny and starts to sew. The Leavanny watches it work, then shows it a better stitch.',
      'By evening the orchard looks alive from the road. It isn\'t. But from the road, for one golden hour, it is beautiful, and Cuthbert stands at the gate and looks at it for a long time.',
      'He gives you a Miracle Seed from his coat pocket. "Off the last tree," he says. "The live one."',
    ), bondUp(1, 'picked'), item('miracle-seed')), { pick: { types: ['bug', 'grass'] } }),
    ch('Plant new trees (a node, three Berries).', out(P(
      'You dig three holes in the ash with Cuthbert, and put a Berry in each, and cover them over, and water them from his can.',
      'The Leavanny climbs down from the green tree and watches. Then it takes the can from Cuthbert, very politely, and starts watering. It stops sewing.',
      L('Cuthbert: "There. That\'s the first thing it\'s let go of since the fire."', 'He gives you a Miracle Seed. His hands are shaking.'),
    ), takeNode(), lose('oran-berry', 3), flag('orchard-planted'), ...kind(2), item('miracle-seed')), { requires: [has('oran-berry', 3)] }),
    ch('Tell it gently.', out(P(
      'You stand under the green tree and tell the Leavanny, as gently as you know how, that the others are gone.',
      'It listens. It looks at the leaf in its hands. Then it sews that one last leaf on, very carefully, and puts its needle away.',
      'Cuthbert gives you a Miracle Seed and doesn\'t say anything at all.',
    ), item('miracle-seed'))),
  ], []),
  after(78, 'ne78-the-orchard-green', 'The Orchard, Green', GROUP.hazard, [flagIs('orchard-planted'), age('orchard-planted')], { minStage: 4, pokemon: 'leavanny', tint: '#1c3a1c' },
    P('On the map there is a green square where the black one used to be. You go and look.', 'Three young trees stand in the ash, already fruiting, absurdly early. A Leavanny is asleep in the middle one. Cuthbert waves from the gate with a basket.'), [
      ch('Pick your Berries.', out('Your three Berries came back as nine. Cuthbert fills your bag and will not take a thing for it. "They\'re yours," he says. "You planted them."', item('oran-berry', 9))),
    ]),
];

const NE79: Json[] = [
  ne(79, 'lighthouse-two-keepers', 'The Lighthouse With Two Keepers', GROUP.hazard, {
    id: 'ne79-lighthouse-two-keepers',
    place: { earliest: 'A4', home: 17, window: [14, 18], sits: 'side-branch', attaches: 'instead', tags: ['water', 'tide'] },
    tags: ['Story', 'Exploration'], cast: ['trainer.fisherman'], effect: 'glint', tint: '#0c1c30',
  },
  P(
    'The lighthouse flashes twice as fast as it should. From the shore it looks like something panicking.',
    'Inside, up the long spiral stair, two keepers each have a hand on the lamp, and each is turning it their own way.',
    L('Keeper Aloysius: "Slow and steady. Ships expect it."', 'Keeper Benedicta: "Fast. There\'s a wreck on the shoal. They need to see it."'),
    'Out at sea, through the salt-smeared glass, a ship\'s lights. Coming in.',
  ), [
    ch('Slow.', out(P(
      'You put your hand on Aloysius\'s side. The lamp settles into its old slow sweep. The ship reads it, and turns for harbour the way it always has.',
      'It misses the shoal by a boat\'s width, by luck and nothing else. Benedicta watches it go by in silence. Aloysius doesn\'t look at her.',
      'In the morning the captain climbs the stair with a gift for the lighthouse and no idea how close it was.',
    ), { kind: 'itemFrom', ids: RARE_HELD })),
    ch('Fast.', out(P(
      'You put your hand on Benedicta\'s side. The light races. Out at sea the ship\'s lights hesitate, then stop altogether.',
      'It sits out there all night, confused, going nowhere. Safe. At dawn the captain rows in to ask what on earth the light was playing at.',
      'Benedicta shows him the wreck from the gallery. He goes pale, and gives you something from his locker to say thank you.',
    ), { kind: 'itemFrom', ids: RARE_HELD })),
    ch('Send a Pokémon out to the shoal with a light.', out(P(
      'You send your Pokémon out into the dark with a lantern. It finds the wreck on the shoal and stays there, a small brave light marking the danger exactly.',
      'The ship sees it, and steers round it, wide and slow. Both keepers let go of the lamp at the same moment and go to the window together.',
      'The captain comes ashore at dawn to shake your hand, and your Pokémon\'s. The whole harbour has heard by noon.',
    ), flag('lighthouse-marked'), rep(1), { kind: 'itemFrom', ids: RARE_HELD }), { pick: { types: ['water', 'flying', 'electric'] } }),
  ], [
    variant('bills-lighthouse', [flagIs('lighthouse-lit')], {
      notice: L('Both keepers stop turning the moment they see you.', 'Benedicta: "You\'re the one who lit Bill\'s Lighthouse."', 'Aloysius takes his hand off the lamp. "Then you decide," he says. Benedicta nods. Neither argues.'),
    }),
  ]),
  after(79, 'ne79-the-small-lamp', 'The Small Lamp on the Shoal', GROUP.hazard, [flagIs('lighthouse-marked'), age('lighthouse-marked'), stageIs('water')], { minStage: 5, tint: '#0c1c30' },
    P('Out on the shoal where the wreck lies there is a second light now: a small lamp on an iron post, steady and low.', 'A fisherman tells you the two keepers put it up together. They named it after a Pokémon that stood out there all night with a lantern. They still argue about everything else.'), [
      ch('Watch it shine a while.', out('It does not flash fast or slow. It just stays lit, like your Pokémon did.', moment('The keepers named the small lamp on the shoal after your Pokémon.'))),
    ]),
];

const NE80: Json[] = [
  ne(80, 'snow-that-wont-stop', 'The Snow That Won\'t Stop', GROUP.hazard, {
    id: 'ne80-snow-that-wont-stop',
    place: { earliest: 'A5', home: 10, window: [10, 12], sits: 'must-see', attaches: 'before', tags: ['snow', 'high'], note: 'Three steps of weather (10 to 12), header Whiteout. Climbing takes 11 and 12 on a side path; finding the trainer is Step 9.' },
    tags: ['Pokémon', 'Story'], rarity: 'rare', cast: ['trainer.snow_worker_m'], pokemon: 'vanilluxe', effect: 'snow', tint: '#1c2a3a',
  },
  P(
    'It has been snowing on this pass for a month. Not the soft kind. The kind that comes sideways and fills your boots and your ears and your sleep.',
    'Far up at the summit, so high you can only just see it, a Vanilluxe is crying. Every tear is a blizzard.',
    L('Guide Halden Vey: "Its trainer left it at the summit to \'toughen it.\' Didn\'t come back."', 'Halden: "It thinks if it makes enough snow, he\'ll be stuck up here and have to return."'),
    'The wind brings you the sound of it, thin and high, over and over. It has been calling for a month.',
  ), [
    ch('Climb to it (two hazard nodes).', out(P(
      'You climb into the whiteout. Two days of it. The snow scours your lead raw unless it was built for cold or carries its own fire.',
      'At the top the Vanilluxe is sitting in a nest of its own snow, small and shaking. It looks past you, down the path, for someone else.',
      'You crouch beside it. "Come down with me," you say. It looks at you for a long time. Then it does. Behind you, for the first time in a month, the snow stops.',
    ), takeNode(2), hurtLead(0.2, ['ice', 'fire']), join({ species: ['vanilluxe'] }), flag('snow-stopped'))),
    ch('Find the trainer (a node back).', out(P(
      'You go back down the path, out of the snow, all the way to the valley.',
      'You find him in the inn, at the table nearest the fire, with a full cup gone cold in front of him. He knows why you\'ve come. He can\'t look at you.',
    ), takeNodeBack(), room('ne80-the-valley-inn'))),
    ch('Wait for it to tire.', out(P(
      'You wait in Halden\'s hut. You wait three days. The snow goes on, and on, and then it thins, and then it stops.',
      'The pass is clear. Up at the summit the Vanilluxe is still sitting where it was left. It has stopped crying. It is alone.',
      'Halden finds a lump of ice by the door that will not melt, and gives it to you without a word.',
    ), takeNode(3), item('nevermeltice'))),
  ]),
  step(80, 'ne80-the-valley-inn', 'The Valley Inn', GROUP.hazard, { cast: ['trainer.snow_worker_m'], pokemon: 'vanilluxe', effect: 'snow', tint: '#2a2016' },
    P(L('The trainer: "I meant to go back the next day. Then it snowed. Then I was ashamed."', 'The trainer: "Every day I didn\'t go, it was harder to go."'), 'Outside the window the pass is a white wall. You both know what is up there, calling.'), [
      ch('"Go up yourself."', out(P(
        'He looks at you for a long time. Then he stands, and puts his coat on, and goes out into it.',
        'You watch from the inn window. A small dark shape climbing into the white. Hours. And then, all at once, the snow stops, as if someone had shut a door on it.',
        'Halden comes in stamping his boots and puts a lump of ice that will not melt into your hand. "He got there," he says. "It ran to him."',
      ), flag('snow-trainer-climbed'), ...kind(2), item('nevermeltice'))),
    ]),
  after(80, 'ne80-the-rescue-hut', 'The Rescue Hut', GROUP.hazard, [flagIs('snow-trainer-climbed'), age('snow-trainer-climbed')], { minStage: 6, stop: 'rest', pokemon: 'vanilluxe', tint: '#1c2a3a' },
    P('A hut on a high pass, with a lamp in the window and a sign: RESCUE. KNOCK ANY HOUR.', 'The trainer from the valley inn opens the door, and behind him a Vanilluxe is making ice for the water jug. They run the pass together now. Nobody gets left up here.'), [
      ch('Come in out of the cold.', out('They give you the warm seat and a hot drink and do not ask you for anything. The Vanilluxe sits against the trainer\'s leg all evening.')),
    ]),
];

// =====================================================================================================================
// CATEGORY 17. RESTS, CAMP AND BOND
// =====================================================================================================================

const RESOLUTE = temp('Resolute: the one who would not eat may hold on at 1 HP once', 1, 'battle', { kind: 'survivalChance', chance: 0.5 });

const NE81: Json[] = [
  ne(81, 'one-who-wont-eat', 'The One Who Won\'t Eat', GROUP.camp, {
    id: 'camp-one-who-wont-eat',
    place: { earliest: 'A2', sits: 'optional', attaches: 'rest', note: 'The first + node after a team member faints or leaves. If NE84 is owed too, NE84 goes first.' },
    tags: ['Relationship', 'Recovery'], effect: 'fire', tint: '#2a1c1c',
    requires: [{ kind: 'partySize', atLeast: 2 }, { kind: 'memberFainted', within: 6 }],
  },
  P(
    'Dinner is done. The fire is low. One bowl is still full.',
    'Its owner is sitting with its back to the fire, facing the dark. It is the one that was beside the one who fell.',
    'It keeps looking at the empty spot by the fire where its friend always lay. Every so often it gets up, as if it has heard something, and then sits back down.',
  ), [
    ch('Sit by it.', out(P(
      'You sit down beside it. You don\'t say anything. Neither does it.',
      'A long while goes by. The fire burns down. Then, so slowly you hardly feel it start, it leans against you, and stays leaning.',
      'In the morning it is the first one at your side. It walks close, the whole day.',
    ), bondUp(2, 'picked'), { kind: 'leadPicked' }, RESOLUTE), { pick: {} }),
    ch('Bring it the bowl.', out(P(
      'You bring the bowl and set it down in front of it.',
      'It looks at the food, and at you. Then it eats two bites, carefully, to be polite. It pushes the bowl back an inch with its nose. Thank you. That\'s all.',
    ), bondUp(1, 'picked'), { kind: 'leadPicked' }, RESOLUTE), { pick: {} }),
    ch('Let another Pokémon go to it.', out(P(
      'You don\'t move. You wait. After a while the one on your team who is closest to you gets up, without being asked, and goes and sits down beside it.',
      'They sit shoulder to shoulder, facing the dark together. In the morning they are still together, and they walk together all day. A pair now.',
    ), bond(12, 6), flag('camp-pair'), { kind: 'leadPicked' }, RESOLUTE), { pick: {} }),
  ]),
];

const STILL_NOT_SPEAKING = moment('They\'re still not speaking. They fight well anyway.', 50);

const NE82: Json[] = [
  ne(82, 'the-argument', 'The Argument', GROUP.camp, {
    id: 'camp-the-argument',
    place: { earliest: 'A2', sits: 'optional', attaches: 'rest', note: 'Any + node with two Pokémon of opposed types or natures in the party.' },
    tags: ['Relationship', 'Recovery'], effect: 'rattle', tint: '#2a2218',
    requires: [{ kind: 'partySize', atLeast: 2 }],
  },
  P(
    'There is one good spot by the fire. Warm, flat, out of the wind. Two of the team have arrived at it at exactly the same moment.',
    'They are nose to nose over it now. One stamps. One hisses. Neither will give an inch.',
    'The rest of the team stops eating and turns, very slowly, to look at you.',
  ), [
    ch('Give the spot to the one who battled today.', out(P(
      'You point at the one who fought hardest today. Fair is fair. It settles into the warm spot with enormous dignity.',
      'The other one sulks. It sulks with its whole body, at the edge of the light, facing away, until long after you are all asleep.',
    ), bondUp(1, 'picked'), flag('camp-argument'), STILL_NOT_SPEAKING), { pick: {} }),
    ch('Make them share.', out(P(
      'You tell them both: share. They look at you as if you had suggested something disgusting.',
      'For an hour they lie at the very edges of the spot, as far apart as it allows, rigid with offence.',
      'When you check on them later they are asleep in a heap, tangled together, one snoring into the other\'s ear.',
    ), bondUp(1, 'picked'), bond(8, 8, true), flag('camp-argument'), STILL_NOT_SPEAKING), { pick: {} }),
    ch('Take the spot myself.', out(P(
      'You step between them and sit down in the warm spot yourself.',
      'They are both so offended they completely forget about each other. They come and sit on you instead, one on each side, heavy and smug.',
      'You do not get any rest for your back. You do not get much rest for anything. But they are not fighting.',
    ), bondUp(1, 'picked'), bond(6, 10), flag('camp-argument'), STILL_NOT_SPEAKING), { pick: {} }),
  ], [
    // Kept from the camp build: the pair from the fire (NE81) can settle it.
    variant('the-pair-is-here', [flagIs('camp-pair')], {
      notice: 'The pair from the fire watches from the side, ears up, tails still. They have opinions about this. They have been waiting to be asked.',
      addChoices: [ch('Ask the pair to sort it out.', out(P(
        'You look at the pair from the fire and nod. They trot over, unhurried, and sit down right between the two of them.',
        'Nobody says anything. The argument just runs out of air. A minute later all four are lying in the warm spot together, and nobody is sulking at all.',
      ), bond(12, 12, true), bondUp(1, 'party'), flag('camp-argument')))],
    }),
  ]),
];

const CLEAN = temp('Freshly washed: shopkeepers are friendlier (5% off)', 5, 'battle', prices(0.95));

const NE83: Json[] = [
  ne(83, 'the-bath', 'The Bath', GROUP.camp, {
    id: 'camp-the-bath',
    place: { earliest: 'A1', sits: 'optional', attaches: 'rest', tags: ['water'], note: 'A + node on a water stage.' },
    tags: ['Relationship', 'Recovery'], effect: 'rain', tint: '#1c2a30',
  },
  P(
    'Let\'s be honest. The whole team smells. Days of road, mud, smoke and things nobody wants to name.',
    'A river is right there, clear and cold and chattering over the stones. Nobody volunteers.',
    'The Fire-type has climbed a tree. The Ground-type is lying very still in the grass, pretending to be a rock. It is not a convincing rock.',
  ), [
    ch('Everyone in.', out(P(
      'It is a chase. It is a long, loud, undignified chase, through the camp and round the tree and twice across the river.',
      'In the end everyone is in, and everyone is clean, and every sting of poison and burn has washed away downstream.',
      'The Fire- and Rock-types sit on the bank afterwards, dripping and betrayed. The rest are splashing and won\'t come out.',
    ), cure(), bondUp(1, 'party'), bondUp(-2, { types: ['fire', 'rock'] }), CLEAN)),
    ch('Only the ones who want to.', out(P(
      'You let them choose. About half the team wades in, shrieking at the cold, then refusing to get out.',
      'Afterwards they sit by the fire, clean and fluffy and very smug, and make a point of sitting upwind of the others.',
    ), bondUp(1, 'picked'), CLEAN), { pick: {} }),
    ch('Go in first.', out(P(
      'You take your boots off, and walk straight into the river, clothes and all. It is so cold you can\'t breathe.',
      'One by one they follow you in. Every one. Even the Fire-type, in the end, climbs down and dips in, right up to its toes, and looks at you as if to say: there. For you.',
      'Everyone comes out clean. All the poison and burns wash away with the mud.',
    ), cure(), bondUp(1, 'party'), CLEAN)),
  ]),
];

const NE84: Json[] = [
  ne(84, 'nightmare-watch', 'The Nightmare Watch', GROUP.camp, {
    id: 'camp-nightmare-watch',
    place: { earliest: 'A3', sits: 'optional', attaches: 'rest', tags: ['night'], note: 'The first + node after a hard loss or a frightening event; Night. Goes before NE81 when both are owed.' },
    tags: ['Relationship', 'Recovery'], effect: 'float', tint: '#161a2e',
    requires: [{ kind: 'partySize', atLeast: 2 }],
  },
  P(
    'In the middle of the night something wakes you. A small sound. A whimper.',
    'It is one of the team, the one that took the worst of the last battle. It is fast asleep, and its feet are running.',
    'Its eyes are shut tight. Whatever it is running from, it has been running a long time, and it is not getting away.',
  ), [
    ch('Wake it gently.', out(P(
      'You put a hand on it and say its name, softly, until its eyes open.',
      'It stares at you, not knowing where it is. Then it knows, and it is embarrassed, and it tucks its face away.',
      'But it shuffles closer to you before it sleeps again, and it stays close all night.',
    ), bondUp(1, 'picked'), flag('nightmare-watched'), rest()), { pick: {} }),
    ch('Let the lead curl round it.', out(P(
      'You nudge your lead awake and nod at the dreamer. Your lead looks, understands, and moves over without being asked twice.',
      'It curls itself all the way around the little runner. The running feet slow, and slow, and stop.',
    ), bondUp(1, 'picked'), bondUp(1, 'lead'), flag('nightmare-watched'), rest()), { pick: {} }),
    ch('Stay up beside it.', out(P(
      'You don\'t wake it. You sit beside it in the dark with a hand on its side, so that wherever it is running, it isn\'t running alone.',
      'You don\'t sleep, and the rest you meant to have is gone; your lead\'s slot gets no healing from you tonight. You know that, and you stay.',
      'Somewhere near dawn the running stops. It sighs a long, shaky sigh and sleeps properly for the first time in days.',
    ), bondUp(3, 'picked'), flag('nightmare-watched')), { pick: {} }),
  ]),
  after(84, 'ne84-first-up-at-dawn', 'First Up at Dawn', GROUP.camp, [flagIs('nightmare-watched'), { kind: 'period', in: ['morning'] }], { minStage: 3, stop: 'rest', tint: '#2a2a1c' },
    P('You open your eyes to grey morning light and something poking your cheek.', 'It is the one from the nightmare. It is the first one up, before anybody, and it has brought you a stick. A good stick. The best one it could find.'), [
      ch('Take the stick.', out('You take it very seriously, and thank it, and put the stick in your bag. It is extremely pleased. It walks beside you all morning.', moment('After the nightmare, it was first up at dawn and brought you a stick.'))),
    ]),
];

const NE85: Json[] = [
  ne(85, 'photograph-nobody-posed', 'The Photograph Nobody Posed For', GROUP.camp, {
    id: 'camp-photograph-nobody-posed',
    place: { earliest: 'A20', sits: 'optional', attaches: 'rest', note: 'A + node in the last third of a run. The photo is of the actual party asleep at that node, in their real order.' },
    tags: ['Relationship', 'Recovery'], effect: 'glint', tint: '#2a2418',
  },
  P(
    'Morning. A young woman with a camera round her neck is standing at the edge of the camp, looking sheepish.',
    'She has been watching the camp from the road, and she has taken a picture without asking.',
    L('Photographer Philomena: "Sorry. I couldn\'t not."', 'Philomena: "Look."'),
    'It is the whole team, asleep, in one great warm pile. You are in the middle of it, mouth wide open. Somebody\'s tail is across your face. Everyone looks completely safe.',
  ), [
    ch('Keep it.', out(P(
      'You keep it. Of course you keep it.',
      'It goes in the album, on the very first page, before everything else. On the hard days, later, you will open the album just to look at it.',
    ), flag('camp-photo'), moment('The photo of the whole team asleep in a pile goes first in the album.', 50))),
    ch('Send it home.', out(P(
      'You ask Philomena to send it home. She writes the address on the back in careful letters.',
      'It goes on the wall at your house, in the hall, where you will see it the moment you open the door. A light left on for you.',
    ), flag('camp-photo-home'), moment('A photo of the team asleep in a pile is on the wall at home.', 50))),
    ch('Take another, awake.', out(P(
      'You wake everyone up and line them up for a proper one. Everybody poses. Nobody poses the same way. Someone sneezes.',
      'It is worse. It is much, much worse. You all crowd round the camera to look at it and laugh until you can\'t breathe.',
    ), bondUp(1, 'party'), flag('camp-photo'))),
  ], [
    // Kept from the camp build: the two who argued over the fire (NE82) are in the photo.
    variant('the-two-in-the-photo', [flagIs('camp-argument')], {
      notice: 'And there, right at the front: the two who argued over the fire. Nose to nose, asleep, curled around each other as if nothing had ever happened.',
    }),
  ]),
];

// =====================================================================================================================
// CATEGORY 18. PUZZLES AND MYSTERIES
// =====================================================================================================================

const KEY_AND_ROOM = (): Json[] => [flag('tuesday-gym-key'), heal(1)];
const WRONG_DOOR = (where: string): Json => ch(where, out(P(
  'You go and look. Nothing there. Not a key, not a hook where a key might hang.',
  'Across the square, the one who sent you there is smiling and waving. Of course. It\'s Tuesday. Isidore, sitting on the fountain, shakes his head at you very slowly.',
), room('ne86-three-answers')));

const NE86: Json[] = [
  ne(86, 'town-where-everyone-lies', 'The Town Where Everyone Lies on Tuesdays', GROUP.puzzle, {
    place: { earliest: 'A3', home: 16, window: [14, 18], sits: 'must-see', attaches: 'town', note: 'The town; else Step 16. The Gym key is in it, so it cannot fail: Wait for Wednesday always works and takes Step 19. The header shows the day.' },
    tags: ['Mystery', 'Exploration'], cast: ['trainer.youngster_m'], pokemon: 'sableye', effect: 'flicker', tint: '#2a2234',
  },
  P(
    'A painted sign at the town gate: WELCOME. TODAY IS NOT TUESDAY.',
    'It is Tuesday. You check twice.',
    L('Innkeeper: "We\'ve no rooms."', 'There are rooms. You can see the keys on their hooks behind him, every one of them.'),
    L('A child on the fountain, Isidore: "They do it for luck. An old Sableye asked them to, once."', 'Isidore: "I\'m the only honest one. I\'m too young."'),
    'And somewhere in this town is the Gym key. You need it, and everyone you ask is going to lie to you about where it is.',
  ), [
    ch('Ask three townsfolk where the Gym key is.', out(P(
      'You ask three people. Each answers at once, cheerfully, with total confidence.',
      L('The baker: "The bell tower. Definitely the bell tower."', 'The fishwife: "Bottom of the old well, love."', 'The postmistress: "At the inn. Under the counter."'),
      'Every one of them is lying. That is the rule here. So the key is not in any place they named.',
    ), room('ne86-three-answers'))),
    ch('Ask Isidore.', out(P(
      'You sit down beside him on the fountain. He looks at you sideways, deciding.',
      L('Isidore: "It\'s in the Gym\'s own letterbox. They put it there every Tuesday. Nobody thinks to look."', 'Isidore: "Now you tell me a secret. A true one. Fair\'s fair."'),
      'You tell him one. He nods seriously and keeps it. The innkeeper, when you come back with the key, suddenly finds he has a room after all.',
    ), flag('isidore-secret'), ...KEY_AND_ROOM())),
    ch('Wait for Wednesday (a node).', out(P(
      'You give up and wait. You sleep in the stable, since there are no rooms.',
      'On Wednesday morning the whole town comes to find you. They apologise for everything, at length, one after another, wringing their hats.',
      'The baker brings you the key himself. The innkeeper gives you his best room and will not hear of payment.',
    ), takeNode(), ...KEY_AND_ROOM())),
  ]),
  step(86, 'ne86-three-answers', 'Three Answers', GROUP.puzzle, { cast: ['trainer.youngster_m'], tint: '#2a2234' },
    P(L('The baker said the bell tower. The fishwife said the well. The postmistress said the inn.', 'Today, everyone lies.'), 'Where is the one place none of them said?'), [
      WRONG_DOOR('The bell tower.'),
      WRONG_DOOR('The old well.'),
      WRONG_DOOR('The inn.'),
      ch('Somewhere none of them named: the Gym\'s own letterbox.', out(P(
        'You go to the Gym door and lift the flap of its letterbox. Something cold and brass is lying on the mat inside.',
        'The key. Behind you, Isidore whoops and claps. The innkeeper, very grudgingly, discovers that he has a room after all.',
      ), ...KEY_AND_ROOM())),
    ]),
  after(86, 'ne86-the-sableye-in-the-cellar', 'The Sableye in the Cellar', GROUP.puzzle, [flagIs('ne86-town-where-everyone-lies-done'), age('ne86-town-where-everyone-lies-done')], { minStage: 4, pokemon: 'sableye', tint: '#16101e' },
    P('Isidore finds you on the road. He has run a long way. "I found the Sableye," he says. "In the inn\'s cellar. It\'s still there."', 'It asked for lies because someone once told it a truth that hurt, he says. It has never told anyone what. It just sits in the dark and listens to the town lying, and feels safe.'), [
      ch('Go down and tell it one kind true thing.', out(P('You sit on the cellar step in the dark. Two gem eyes watch you. You tell it something true and kind: that the town still does this for it, every week, because they care.', 'The gem eyes blink. Very slowly the Sableye creeps out, and sits on the step beside you, and stays.'), flag('sableye-told-kind'), moment('You told the Sableye in the cellar one kind true thing.'))),
      ch('Leave it to its lies.', out('You let it be. Some things heal in their own time. Isidore nods, and doesn\'t argue.')),
    ]),
];

const NE87: Json[] = [
  ne(87, 'painting-missing-person', 'The Painting With a Missing Person', GROUP.puzzle, {
    place: { earliest: 'A3', home: 9, window: [6, 12], sits: 'optional', attaches: 'town', tags: ['city', 'eerie'], note: 'The town; else Step 9. The three clues are spread across the stage.' },
    tags: ['Mystery', 'Pokémon'], pokemon: 'smeargle', effect: 'flicker', tint: '#2a2016',
  },
  P(
    'A family portrait hangs in the hall: mother, father, two children in their best clothes, all very stiff.',
    'And a gap. Beside the younger child there is a space, painted round, where a fifth figure used to stand. You can see the outline under the paint.',
    L('Housekeeper Mrs. Thackeray: "The dog. They had it painted out when it was stolen."', 'Mrs. Thackeray: "Couldn\'t bear to look at it."'),
    'In the corner, a Smeargle with paint on its tail is sitting quite still, watching the gap.',
  ), [
    ch('Search for the dog\'s trail.', out(P(
      'You ask Mrs. Thackeray for everything. The day it went. The gate. The road. She tells you, and her voice keeps catching.',
      'The trail is cold, but it is there. You set off with the first clue in your head.',
    ), flag('portrait-searching'), later('ne87-the-collar', 1))),
    ch('Ask the Smeargle to paint it back.', out(P(
      'The family gather round and describe their dog to the Smeargle, all at once. Big. Small. Brown. Grey. Ears up. Ears down.',
      'Each of them remembers it differently. The Smeargle paints all of it. The dog in the portrait now has three kinds of ears and a very kind face.',
      'The younger child laughs for the first time in a year. Mrs. Thackeray gives you a Silk Scarf. "It was his," she says. "The dog\'s."',
    ), ...kind(1), item('silk-scarf'))),
    ch('Leave the gap.', out('You look at the gap a long time, and the Smeargle looks with you. Some gaps are not yours to fill. You leave the house quietly.')),
  ]),
  step(87, 'ne87-the-collar', 'The First Clue: a Collar', GROUP.puzzle, { tint: '#2a2016' },
    P('In a ditch by the road, half sunk in the mud, a leather collar. The tag is worn smooth, but you can still read the family\'s name on it.', 'It was dropped, not lost. Somebody took it off.'), [
      ch('Follow the trail on.', out('You put the collar in your pocket and follow the road the way the collar was facing.', later('ne87-the-kennel', 2))),
    ]),
  step(87, 'ne87-the-kennel', 'The Second Clue: a Kennel', GROUP.puzzle, { tint: '#2a2016' },
    P('Behind a farm, an empty kennel. Inside, the boards are worn smooth by a big dog lying in the same place for a long time.', 'The farmer says a man sold the dog on, a year ago. To a pen in the next town, where they keep animals nobody claims.'), [
      ch('Follow the trail on.', out('You thank the farmer and walk to the next town, faster than you meant to.', later('ne87-the-pen-list', 2))),
    ]),
  step(87, 'ne87-the-pen-list', 'The Third Clue: the Holding Pen List', GROUP.puzzle, { pokemon: 'stoutland', tint: '#2a2016' },
    P('The holding pen keeps a list on a nail by the gate. You run your finger down it. There. A Stoutland. Brought in a year ago. Unclaimed.', 'At the end of the row of pens a big grey Stoutland lifts its head off its paws and looks at you. It is alive. It is old now. Its tail starts, very slowly, to wag.'), [
      ch('Take it home.', out(P('You walk it all the way back. When the front door opens the younger child screams, and the dog knocks him flat, and nobody can say anything for a long time.', 'Mrs. Thackeray presses a Silk Scarf into your hands. Her eyes are streaming. "His," she says. "We kept it."'), flagAt('portrait-found'), item('silk-scarf'))),
    ]),
  after(87, 'ne87-the-repainted-portrait', 'The Portrait, Repainted', GROUP.puzzle, [flagAgo('portrait-found')], { minStage: 5, pokemon: 'smeargle', tint: '#2a2016' },
    P('A letter finds you on the road, in a careful hand: Mrs. Thackeray\'s. Inside, a small sketch of the new portrait.', 'The family, repainted. The children are grown, in the painting, tall and grinning. And beside them stands the Stoutland, old and grey, exactly where it belongs.'), [
      ch('Keep the sketch.', out('You fold it into your bag carefully. The Smeargle has signed it with a pawprint.', moment('The Thackerays\' portrait was repainted with the dog in it, old, and the children grown.'))),
    ]),
];

const NE88: Json[] = [
  ne(88, 'well-with-two-bottoms', 'The Well With Two Bottoms', GROUP.puzzle, {
    place: { earliest: 'A2', home: 7, window: [4, 10], sits: 'optional', attaches: 'town', level: 'A+0', note: 'The town; else Step 7. A+0 for the battle if a Pokémon is sent down.' },
    tags: ['Mystery', 'Exploration'], pokemon: 'shellos', effect: 'glint', tint: '#14242a',
  },
  P(
    'An old stone well in the village square. A woman lowers a bucket into it. It goes down dry. It comes up dry.',
    'She lowers it again, the same rope, the same well. It comes up full, slopping over. She tips it out. It is sea water. Salt. Weed in it.',
    'The sea is a hundred miles off.',
    L('Well-keeper Hildegard: "Depends how you lower it. Granddad knew."', 'Hildegard: "He didn\'t write it down."'),
  ), [
    ch('Lower it fast.', out(P(
      'You let the rope run, fast, hand over hand. The bucket hits water with a slap and comes up heavy, and smelling of the sea.',
      'There is a Shellos in it, looking up at you, extremely surprised. It has never seen a village before. It decides to stay and see more.',
    ), join({ species: ['shellos'] }))),
    ch('Lower it slowly.', out(P(
      'You lower it slowly, an arm\'s length at a time, feeling for the turn in the shaft.',
      'It comes up clear and cold and sweet. Spring water. Hildegard fills three bottles for you and corks them herself.',
    ), item('fresh-water', 3))),
    ch('Send a Pokémon down.', out(P(
      'Your Pokémon goes down the rope and out of sight. It is gone a long time. Hildegard holds the rope with you and doesn\'t breathe.',
      'It comes back up wet and pleased with itself. It has found the fork: one shaft runs to a spring, the other to a cave under the sea.',
      'Hildegard draws the whole thing in chalk on the well\'s lip as you tell her. Fast for sea, slow for spring. And down there, a way through.',
    ), flag('well-mapped'), room('ne88-the-sea-cave')), { pick: { types: ['water', 'ghost'] } }),
  ]),
  step(88, 'ne88-the-sea-cave', 'Under the Well', GROUP.puzzle, { pokemon: 'gastrodon', effect: 'glint', tint: '#0c1c24' },
    P('There is a ladder down the inside of the well, rusted, but it holds. At the bottom the shaft forks, just as your Pokémon said.', 'One way smells of moss and fresh water. The other smells of salt, and from far down it you can hear waves where no waves should be.'), [
      ch('Take the sea shaft.', fight('It opens into a cave under the sea, green-lit and dripping. Something big and soft slides out of a pool to see who has come.', { ...wild({ types: ['water'], species: ['shellos', 'gastrodon'], lv: 0 }), friendly: true, lose: [] })),
      ch('Take the spring shaft.', out('It ends in a still, cold pool so clear you can count the stones on the bottom. You fill every bottle you have.', item('fresh-water', 3))),
    ]),
  after(88, 'ne88-written-down', 'Written Down at Last', GROUP.puzzle, [flagIs('ne88-well-with-two-bottoms-done'), age('ne88-well-with-two-bottoms-done')], { minStage: 3, pokemon: 'shellos', tint: '#14242a' },
    P('A traveller from Hildegard\'s village passes you on the road, and tells you the news.', 'She has written it down at last. A brass plate on the well, polished every morning: FAST FOR THE SEA. SLOW FOR THE SPRING. The whole village knows it by heart now.'), [
      ch('Smile at that.', out('Her granddad would have been glad. You are sure of it.', moment('Hildegard wrote the well\'s rule down at last.'))),
    ]),
];

const NE89: Json[] = [
  ne(89, 'thief-who-returns-things', 'The Thief Who Returns Things', GROUP.puzzle, {
    place: { earliest: 'A2', home: 'town', sits: 'optional', attaches: 'town', level: 'A+0', note: 'The town; then one node on. Follow it takes the next node: its den, everything it has ever borrowed, sorted by owner.' },
    tags: ['Mystery', 'Pokémon'], pokemon: 'thievul', effect: 'flicker', tint: '#2a1c14',
  },
  P(
    'People in the square are standing about holding things and looking baffled.',
    'A woman with a ring she lost twenty years ago. A man with one small child\'s shoe, turning it over and over. An old soldier with a watch.',
    L('Constable Peverell: "Reverse burglary. Every house. Somebody\'s breaking in and leaving things."', 'Peverell: "I don\'t even know what to charge them with."'),
    'On a roof above the square, a Thievul sits with a sack over its shoulder. It looks very, very tired.',
  ), [
    ch('Catch it.', fight('The Thievul doesn\'t run. It puts the sack down carefully, and then it fights you as if it has somewhere else to be.', { ...wild({ species: ['thievul'], lv: 0, win: [flag('thief-sack-spilled')] }), friendly: true, lose: [] })),
    ch('Follow it (a node).', out(P(
      'You follow it at a distance, over roofs and through gardens, out of town, to a small house with one lit window.',
      'Inside, an old man is in bed. A retired burglar, Peverell tells you later. He is dying. He sent his Thievul out to put everything back before he goes.',
      'The Thievul takes something from the bottom of its sack and gives it to you. Freely. It is the only thing in there that was ever meant for anyone.',
    ), takeNode(), flag('thief-followed'), { kind: 'itemFrom', ids: RARE_HELD }, room('ne89-the-den'))),
    ch('Leave something out for it.', out(P(
      'You leave a Berry on a windowsill where it will see. In the night it comes, and takes it, and in its place it leaves something from its sack.',
      'A gift, given freely. You suspect it has been waiting forty years for somebody to leave it something first.',
    ), lose('oran-berry'), { kind: 'itemFrom', ids: RARE_HELD }), { requires: [has('oran-berry')] }),
  ]),
  step(89, 'ne89-the-den', 'The Den', GROUP.puzzle, { pokemon: 'thievul', tint: '#2a1c14' },
    P('Behind the house is its den, and in the den is everything it ever took, in neat piles. Sorted by owner. Labelled in the old man\'s shaky hand.', 'Most of the piles are gone now. The Thievul looks at the few that are left, and at you, and at the window where the old man is sleeping.'), [
      ch('Help it finish (a node).', out(P(
        'You carry the last of it round the town with the Thievul, all night, house by house, window by window.',
        'The very last thing in the sack is a brooch. You read the label twice. It goes to Constable Peverell\'s house. It was his mother\'s.',
        'Peverell opens the door in his nightshirt and holds the brooch in his palm and doesn\'t say anything for a very long time.',
      ), takeNode(), flag('thief-finished'))),
      ch('Let it finish alone.', out('You leave it to its work. It nods at you, the way one professional nods to another, and shoulders its sack.')),
    ]),
  after(89, 'ne89-the-porch', 'The Constable\'s Porch', GROUP.puzzle, [flagIs('ne89-thief-who-returns-things-done'), age('ne89-thief-who-returns-things-done')], { minStage: 3, pokemon: 'thievul', tint: '#2a1c14' },
    P('Passing back through the town, you see Constable Peverell on his porch with a pipe.', 'Curled at his feet, asleep in the sun with no sack anywhere, is the Thievul. Retired. Peverell says it keeps an eye on the street. Nothing has gone missing since.'), [
      ch('Wave to them both.', out('Peverell raises his pipe. The Thievul opens one eye, sees it\'s you, and closes it again, content.', moment('The Thievul retired to the constable\'s porch.'))),
    ]),
];

const NE90: Json[] = [
  ne(90, 'door-in-the-tree', 'The Door in the Tree', GROUP.puzzle, {
    place: { earliest: 'A1', home: 11, window: [7, 15], sits: 'side-branch', attaches: 'instead', tags: ['forest'] },
    tags: ['Mystery', 'Pokémon'], pokemon: 'flabebe', effect: 'sparkle', tint: '#1c2a1c',
  },
  P(
    'At the foot of an old oak, between two roots, there is a door. It is the size of your hand. It has hinges, and a keyhole, and a very small brass knocker.',
    'You crouch down. Behind it, faintly, you can hear the sound of very small furniture being moved.',
  ), [
    ch('Knock.', out(P(
      'You knock, very gently, with one fingertip. The furniture stops.',
      'The door opens. A Flabébé looks out, and up, and up, a very long way, at you. It shuts the door.',
      'A moment later it opens again. The Flabébé holds out a thimble full of nectar, with both arms, very formally. Your Pokémon drinks it, and every hurt it had is gone.',
    ), healPicked(1)), { pick: {} }),
    ch('Leave a gift on the step.', out(P(
      'You leave an Oran Berry on the tiny step, the way you would leave something on the step of a neighbour you hadn\'t met yet.',
      'Nothing happens. You walk on. But you have the feeling, all the way out of the wood, that you have been noticed.',
    ), lose('oran-berry'), flag('tree-gifted')), { requires: [has('oran-berry')] }),
    ch('Peek.', out('You lean down and put your eye to the keyhole. The furniture stops. Nothing moves. Nothing more happens, however long you wait. You have the uncomfortable feeling it is waiting for you to leave.')),
  ]),
  after(90, 'ne90-a-gift-on-your-bag', 'A Gift on Your Bag', GROUP.puzzle, [flagIs('tree-gifted')], { minStage: 1, stop: 'rest', pokemon: 'flabebe', tint: '#1c2a1c' },
    P('You wake at the rest stop to find something sitting on top of your bag, placed very precisely in the middle.', 'An Oran Berry. The same kind you left. Smaller, a little lopsided, and polished until it shines.'), [
      ch('Keep it.', out('You put it in your bag next to the others. It is the smallest Berry you own and you will never eat it.', item('oran-berry'))),
    ]),
  after(90, 'ne90-another-small-door', 'Another Small Door', GROUP.puzzle, [flagIs('tree-gifted'), age('tree-gifted'), stageIs('grass', 'bug')], { minStage: 2, pokemon: 'flabebe', tint: '#1c2a1c' },
    P('Another old forest. Another oak. And at its foot, between two roots, another very small door.', 'It is a different door, but the knocker is the same, and on the step, waiting, is a Sitrus Berry with a tiny ribbon round it.'), [
      ch('Leave an Oran Berry and take the Sitrus.', out('A fair exchange, and then a little more. Behind the door, something small claps.', lose('oran-berry'), item('sitrus-berry'), flag('tree-gifted-twice')), { requires: [has('oran-berry')] }),
      ch('Just knock, and say thank you.', out('The door opens a crack. A Flabébé waves. It shuts again.')),
    ]),
  after(90, 'ne90-a-third-small-door', 'A Third Small Door', GROUP.puzzle, [flagIs('tree-gifted-twice'), age('tree-gifted-twice'), stageIs('grass', 'bug')], { minStage: 3, pokemon: 'flabebe', tint: '#1c2a1c' },
    P('The doors are expecting you now. This one is already open, just a crack, and a light is on inside.', 'On the step is a Lum Berry, wrapped in a leaf and tied with grass. Each exchange is a little better than the last.'), [
      ch('Leave a Sitrus Berry and take the Lum.', out('You trade. Somewhere inside, very small voices are singing.', lose('sitrus-berry'), item('lum-berry')), { requires: [has('sitrus-berry')] }),
      ch('Just knock, and say thank you.', out('A thimble of nectar is passed out to you, formally, and the door closes.')),
    ]),
  after(90, 'ne90-the-last-door', 'The Last Door', GROUP.puzzle, [flagIs('tree-gifted'), place({ lastRegion: true, regionEnd: true })], { minStage: 4, pokemon: 'flabebe', tint: '#1c2a1c', effect: 'sparkle' },
    P('Near the very end of your journey, one more small door, in one more old tree.', 'It is standing open. Inside there is a tiny room with tiny chairs. On a shelf above the tiny fireplace, kept like a treasure, is the Oran Berry you left on the very first step. Dried, and polished, and kept.'), [
      ch('Close the door softly.', out('You close it very gently. Behind it someone small says something that might be goodbye.', moment('At the last small door, your first gift was on a shelf.'))),
    ]),
];

// =====================================================================================================================
// CATEGORY 19. SHOPS, SERVICES AND GAMES
// =====================================================================================================================

const NE91: Json[] = [
  ne(91, 'shop-with-no-shopkeeper', 'The Shop With No Shopkeeper', GROUP.shop, {
    place: { earliest: 'A1', home: 8, window: [4, 14], sits: 'optional', attaches: 'after', note: 'If the player takes without paying, the next three shop nodes carry a small raised-price mark.' },
    tags: ['Shop', 'Story'], pokemon: 'meowth', effect: 'none', tint: '#2a2418',
  },
  P(
    'By the road, a wooden shed full of shelves. Potions, Balls, Berries in a basket, all neatly priced in pencil.',
    'There is a tin with a slot in the lid, and a card propped against it in large letters: PAY WHAT IT SAYS. I\'M AT MY SISTER\'S.',
    'The prices are fair. Nobody is watching. On the counter a Meowth is asleep in the sun, with one eye very slightly open.',
  ), [
    ch('Buy and pay.', out(P(
      'You take what you need, add it up twice, and push the coins through the slot one at a time. They clink into the tin.',
      'The Meowth\'s open eye closes. It goes properly to sleep.',
    ), flag('honest-shop'), stopHere('shop'))),
    ch('Take without paying.', out(P(
      'You take what you want and walk out without paying. Nobody stops you.',
      'The Meowth watches you go, with that one open eye. Nothing happens. Nothing at all.',
      'But word travels on a road like this one, faster than you do. The next shops will have heard. They will charge you more.',
    ), flag('honest-took'), { kind: 'itemFrom', ids: HEALING }, { kind: 'itemFrom', ids: ['poke-ball', 'great-ball'] }, temp('Word travels: shops charge you 10% more', 3, 'battle', prices(1.1)))),
    ch('Pay extra.', out(P(
      'You pay what it says, and then a little more, for the trust of it.',
      'The Meowth opens both eyes. It gets up, stretches, walks the length of the shelf and pushes something off the end of it with one paw. It lands at your feet.',
      'A held item, from the top shelf. The Meowth sits back down and looks at you as if to say: well, pick it up.',
    ), $(-100), ...kind(1), { kind: 'itemFrom', ids: HELD }, stopHere('shop')), { requires: [money(100)] }),
  ]),
  after(91, 'ne91-the-shopkeeper', 'The Shopkeeper Back From Her Sister\'s', GROUP.shop, [flagIs('ne91-shop-with-no-shopkeeper-done'), age('ne91-shop-with-no-shopkeeper-done')], { minStage: 2, pokemon: 'meowth', tint: '#2a2418' },
    P('At a market stall you meet a woman with a Meowth on her shoulder. She looks at you, and then at the Meowth.', 'Shopkeeper: "My Meowth says you\'re all right." She smiles. "It doesn\'t say that about many."'), [
      ch('Buy something from her.', out('She sells to you at a fair price, and throws in a Berry.', item('oran-berry'), stopHere('shop'))),
    ], [
      variant('counts-it-twice', [flagIs('honest-took')], {
        intro: P('At a market stall you meet a woman with a Meowth on her shoulder. The Meowth looks at you, and says something in her ear.', 'She serves you politely. And she counts your change twice, slowly, right in front of you, every coin.'),
      }),
    ]),
];

const NE92: Json[] = [
  ne(92, 'tutor-who-forgot-the-move', 'The Move Tutor Who Forgot the Move', GROUP.shop, {
    place: { earliest: 'A4', home: 12, window: [9, 15], sits: 'side-branch', attaches: 'instead', tags: ['city'], note: 'City stages and Fighting stages.' },
    tags: ['Pokémon', 'Story'], cast: ['trainer.black_belt_m'], effect: 'none', tint: '#2a1c1c',
    requires: [stageIs('fighting')],
  },
  P(
    'In the middle of an empty dojo an old man is standing in a fighting stance, frowning at nothing.',
    'He has been standing in it, you are told, for an hour.',
    L('Tutor Maximilian: "Taught it forty years. This morning, gone."', 'Maximilian: "The body knows. The head doesn\'t."'),
    L('He doesn\'t move out of the stance. His eyes flick to you.', 'Maximilian: "Attack me. Properly. It might come back."'),
  ), [
    ch('Attack him (a battle).', fight(
      'He bows, and his Pokémon steps up, and halfway through the fight it does something without being told. A move. He shouts out loud, a great bark of joy, and after the fight he teaches it to one of yours for nothing.',
      trainer('Tutor Maximilian', { cls: 'black-belt', types: ['fighting'], size: 2, friendly: true, win: [teach('aura-sphere')], lose: [teach('aura-sphere')] }),
    ), { pick: {} }),
    ch('Show him the move from one of mine.', out(P(
      'You have one of your Pokémon go through a move it learned from a tutor, slowly, in front of him.',
      L('Maximilian: "Not that one. But close."', 'He watches it again. His hands start to move on their own.'),
      'Then it is there, all at once, and he is laughing, and he is teaching it to your Pokémon before he can lose it again.',
    ), teach('aura-sphere')), { requires: [{ kind: 'partyMoveType', type: 'fighting' }], pick: {} }),
    ch('Sit with him.', out(P(
      'You sit down on the dojo floor. After a while, stiffly, he comes out of the stance and sits down too.',
      'He talks about his teacher. A small fierce woman who could knock him across this room with one hand. Her name was Aura.',
      'He stops. "Aura," he says again. Then: "Aura Sphere." He wipes his eyes and teaches it to your Pokémon, and he names her the whole time.',
    ), ...kind(1), teach('aura-sphere')), { pick: {} }),
  ]),
  after(92, 'ne92-the-first-copy', 'The First Copy', GROUP.shop, [flagIs('ne92-tutor-who-forgot-the-move-done'), age('ne92-tutor-who-forgot-the-move-done')], { minStage: 5, cast: ['trainer.black_belt_m'], tint: '#2a1c1c' },
    P('A parcel catches up with you on the road. Inside is a thick, hand-bound book: every move Maximilian ever taught, written down, with drawings.', 'The note inside says: "So I never lose one again. You get the first copy." Folded into the first page is a lesson he wants you to have.'), [
      ch('Read the first lesson to one of yours.', out('You read it aloud by the fire. By the end of the evening your Pokémon has it.', teach('drain-punch')), { pick: {} }),
    ]),
];

const FORTUNE_COST = { requires: [money(100)] };
const NE93: Json[] = [
  ne(93, 'honest-fortune-machine', 'The Honest Fortune Machine', GROUP.shop, {
    place: { earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', attaches: 'town', note: 'The town; else Step 5. Ask about the road: Step 20\'s node then shows the Gym ace and item when hovered.' },
    tags: ['Shop', 'Mystery'], pokemon: 'xatu', effect: 'glint', tint: '#2a2016',
  },
  P(
    'A brass machine with a glass dome, polished by a lot of hands. Inside the dome sits a mechanical Xatu, its painted eyes staring at nothing.',
    'A plate on the front: TELLS ONE TRUE THING. ₽100. DOES NOT TELL NICE THINGS ON PURPOSE.',
    'You feed it a coin. It whirs, and ticks, and the Xatu\'s head turns very slowly to look straight at you. A card drops into the tray.',
  ), [
    ch('Ask about the road.', out(P(
      'The card is printed in small, neat type. It names the Gym Leader ahead, the Pokémon they save for last, and the item it holds.',
      'No warning. No advice. Just what is true. The Xatu\'s head turns back to the front.',
    ), $(-100), { kind: 'gymPreview' }), FORTUNE_COST),
    ch('Ask about my team.', out(P(
      'The card says: {lowestBond}. The bond there is the thinnest on your team.',
      'Underneath, in smaller type: {least} is the one you have sent out least. Some of the why is in that.',
      'You look over at {lowestBond}. It is pretending not to be listening.',
    ), $(-100)), FORTUNE_COST),
    ch('Ask about me.', out('The card says something true about you.', $(-100), flag('fortune-told')), {
      ...FORTUNE_COST,
      branches: [
        { when: [flagIs('kind-total', 3)], text: P('The card says: YOU STOP MORE THAN YOU WALK PAST.', 'It is true. You have stopped for everyone, all the way here. The Xatu\'s painted eyes do not blink. You keep the card.'), effects: [$(-100), flag('fortune-told')] },
        { when: [not('kind-total')], text: P('The card says: YOU WALK PAST MORE THAN YOU STOP.', 'It is true. You know every face you passed. The Xatu\'s painted eyes do not blink. You keep the card anyway.'), effects: [$(-100), flag('fortune-told')] },
        { when: [flagIs('kind-total', 1, 2)], text: P('The card says: YOU WALK PAST MORE THAN YOU STOP. NOT ALWAYS.', 'You think of the few times you did stop. The Xatu\'s painted eyes do not blink. You keep the card.'), effects: [$(-100), flag('fortune-told')] },
      ],
    }),
  ]),
];

const NE94: Json[] = [
  ne(94, 'auction-of-useless-things', 'The Auction of Useless Things', GROUP.shop, {
    place: { earliest: 'A3', home: 10, window: [7, 13], sits: 'optional', attaches: 'town', tags: ['city'], note: 'The town; else Step 10.' },
    tags: ['Shop', 'Story'], effect: 'none', tint: '#2a2218',
  },
  P(
    'In a tent at the back of the market, an auctioneer in a tall hat holds up a bent spoon, as if it were a crown.',
    L('Auctioneer Mr. Montague-Stokes: "Lot one: a spoon. It\'s bent. Opening at ₽5."', 'Mr. Montague-Stokes: "Every lot is exactly what it looks like. That\'s the house rule."'),
    'Lot two, on the table behind him, is a rock. Lot three is a jar of air, with a label: FROM A NICE DAY.',
  ), [
    ch('Bid on the spoon.', out(P(
      'There is a short and surprisingly vicious bidding war with a woman in a green hat. You win it at ₽50.',
      'It is a TwistedSpoon. A real one, humming faintly with psychic power. "I said it was bent," says Mr. Montague-Stokes, with perfect calm.',
    ), $(-50), item('twistedspoon')), { requires: [money(50)] }),
    ch('Bid on the rock.', out(P(
      'Nobody else bids on the rock. You get it for ₽20.',
      'It is a Hard Stone. Dense and dark and very useful. "I said it was a rock," says Mr. Montague-Stokes, and bangs his gavel.',
    ), $(-20), item('hard-stone')), { requires: [money(20)] }),
    ch('Bid on the air.', out(P(
      'You buy the air for ₽5. The crowd applauds, slightly ironically.',
      'It is a jar of air. That is all it is. But it is from a nice day, and you can feel that, somehow, through the glass. You decide to save it for a rest.',
    ), $(-5), flag('jar-of-air')), { requires: [money(5)] }),
  ]),
  after(94, 'ne94-the-jar-of-air', 'A Jar of Air From a Nice Day', GROUP.shop, [flagIs('jar-of-air')], { minStage: 1, stop: 'rest', tint: '#2a3040', effect: 'sparkle' },
    P('The fire is going and everyone is settled. You take out the jar of air from a nice day.', 'The whole team gathers round to look at it. It looks like nothing. It looks like a jar.'), [
      ch('Open the jar.', out('You unscrew the lid. And for a moment, just a moment, it smells of cut grass and warm stone and somebody laughing a long way off. Everyone breathes it in, eyes closed.', bondUp(1, 'party'))),
    ]),
  after(94, 'ne94-a-hole', 'Lot One: a Hole', GROUP.shop, [flagIs('ne94-auction-of-useless-things-done'), age('ne94-auction-of-useless-things-done')], { minStage: 4, tint: '#2a2218' },
    P('In another market, another tent. Mr. Montague-Stokes, tall hat and all, is holding up an empty frame.', 'Mr. Montague-Stokes: "Lot one: a hole. Ground not included. Opening at ₽5."'), [
      ch('Bid ₽5 on the hole.', out('You win. He hands you the frame with great ceremony. It contains a hole. It is exactly what it looks like.', $(-5)), { requires: [money(5)] }),
      ch('Laugh, and walk on.', out('He tips his hat to you as you go. He remembers a good customer.')),
    ]),
];

const NE95: Json[] = [
  ne(95, 'pokemon-barber', 'The Pokémon Barber', GROUP.shop, {
    place: { earliest: 'A2', home: 14, window: [11, 17], sits: 'optional', attaches: 'town', note: 'The town; else Step 14.' },
    tags: ['Shop', 'Pokémon'], pokemon: 'scyther', effect: 'none', tint: '#2a1c24',
  },
  P(
    'A red and white striped pole turns slowly outside a small shop. Through the window you can see a barber\'s chair.',
    'In the chair is a Mareep, perfectly still. Standing over it, in a tiny striped apron, a Scyther is giving it a very neat fringe with the tip of one blade.',
    L('Barber Aurelius: "It does the cutting. I do the conversation."', 'Aurelius: "A trim? ₽100."'),
  ), [
    ch('Pick a Pokémon for a trim.', out(P(
      'Your Pokémon climbs into the chair, nervous. The Scyther looks at it from every side, very professionally. Then the blades move, too fast to see.',
      'It comes out of the chair looking like a whole new Pokémon. It catches sight of itself in the mirror and can\'t stop looking.',
    ), $(-100), bondUp(1, 'picked')), { requires: [money(100)], pick: {} }),
    ch('A trim for me.', out(P(
      'You sit down. You close your eyes. There is a whisper of air past both ears.',
      'When you open them your hat fits differently. Better. The whole rest of the day, people you pass keep looking twice.',
    ), $(-100), flag('barber-trim'), moment('A Scyther in an apron cut your hair. Your hat fits differently now.')), { requires: [money(100)] }),
    ch('Ask how they started.', out(P(
      L('Aurelius: "Battle, years ago. It missed me, mostly. Took the top off my hair."', 'Aurelius: "Best haircut I\'d ever had. I gave up battling the next day."'),
      'The Scyther, without looking up from the Mareep, gives a small and modest bow.',
    ))),
  ]),
  after(95, 'ne95-a-trim-for-furfrou', 'A Trim for Furfrou', GROUP.shop, [flagIs('ne95-pokemon-barber-done'), { kind: 'partySpecies', species: 'furfrou' }], { minStage: 2, pokemon: 'furfrou', tint: '#2a1c24' },
    P('You pass the striped pole again. Aurelius is outside, sweeping, and stops dead when he sees your Furfrou.', 'Inside, the Scyther puts down its comb, comes to the door, and bows to the Furfrou. Low. One master to another.'), [
      ch('Let Furfrou have the chair.', out('It is a free trim, Aurelius insists, an honour for the shop. Your Furfrou walks out looking magnificent and knowing it.', bondUp(1, { species: ['furfrou'] }))),
    ]),
];

// =====================================================================================================================
// CATEGORY 20. FESTIVALS AND WHOLE-RUN EVENTS
// =====================================================================================================================

const FESTIVAL = temp('Festival: shops are 10% off', 5, 'battle', prices(0.9));

const NE96: Json[] = [
  ne(96, 'festival-of-first-catches', 'The Festival of First Catches', GROUP.fest, {
    place: { earliest: 'A4', home: 10, sits: 'optional', attaches: 'town', note: 'The Town node of Stage 4 or 5 of any region; until towns exist, Step 10. The header reads Festival for the whole stage.' },
    tags: ['Story', 'Pokémon'], effect: 'confetti', tint: '#2a2410',
    requires: [place({ stage: [4, 5] })],
  },
  P(
    'Bunting across every street. A band playing slightly out of time. The whole town is out.',
    'Every trainer in town is walking with the first Pokémon they ever caught. Some are huge now. Some are very, very old, and are being carried.',
    'One old man is carrying an empty Poké Ball, held out in front of him in both hands, respectfully, like something that still matters.',
    L('Festival marshal Guinevere: "First catch only. It leads the parade."', 'Guinevere: "Where\'s yours?"'),
  ), [
    ch('Walk with my first catch.', out(P(
      'You look for your first catch, and it isn\'t there. You walk alone, near the back, with your hands empty.',
      'Nobody asks why. People are kind. An old woman falls into step beside you for a while, and so does a boy, and you are not alone after all.',
    ), flag('festival-first'), FESTIVAL), {
      branches: [br1()],
    }),
    ch('Walk with my starter.', out(P(
      L('Guinevere: "That\'s chosen, not caught."', 'She looks at your starter, and at you, for a long moment. Then she smiles and lifts the rope. "Go on, then."'),
      'Your starter walks the whole parade at your side with its head up, as if it had always known it would.',
    ), bondUp(1, 'starter'), FESTIVAL)),
    ch('Walk with the empty-Ball man.', out(P(
      'You fall into step beside the old man. He doesn\'t mind. He tells you about a Pidgey, fifty years ago, the first thing he ever caught.',
      'It rode on his hat. It woke him every morning by pulling his hair. It got old, and he got old, and one spring it didn\'t wake up.',
      '"I still bring the Ball," he says. "Every year. It always liked a parade."',
    ), ...kind(1), FESTIVAL)),
  ]),
];
function br1(): Json {
  return {
    when: [bondIs(1, 'firstCatch')],
    text: P(
      'Your first catch steps out in front of you, and Guinevere waves you right up to the front of the parade.',
      'It leads the whole town down the main street. People cheer. It has no idea why, and doesn\'t care, and walks like a king.',
      'You remember the day you caught it. It remembers too. You can tell by the way it keeps looking back at you.',
    ),
    effects: [bondUp(3, 'firstCatch'), flag('festival-first'), FESTIVAL],
  };
}

const NE97: Json[] = [
  ne(97, 'day-the-run-is-half-over', 'The Day the Run Is Half Over', GROUP.fest, {
    place: { earliest: 'A40', sits: 'must-see', attaches: 'rest', note: 'The exact midpoint of the run: the + node nearest Step 10 of the middle stage. No badge. Here: the last stage of the fifth region of a full run (absolute Stage 40 of 80).' },
    tags: ['Story', 'Mystery'], rarity: 'rare', cast: ['trainer.hex_maniac'], effect: 'none', tint: '#24201c',
    requires: [place({ region: [5, 5], regionEnd: true })],
  },
  P(
    'A milestone by the road, half sunk in the grass and green with moss. One word cut into it, deep: HALFWAY.',
    'Someone is sitting on it, eating an apple. It is the Hooded Traveller. The hood is down, for once. The face underneath is younger than you expected, and very tired.',
    L('The traveller: "Everyone stops here. Most don\'t notice they have."', 'The traveller: "Tell me one thing you\'d undo. I\'m collecting."'),
  ), [
    ch('The lie I told.', out(P(
      'You tell them about the lie. They listen to all of it, and nod.',
      L('The traveller: "It can\'t be undone."', 'The traveller: "But I\'ll carry a little of it for you. That\'s what the collection is for."'),
      'They write it down in a small book that is nearly full.',
    ), flag('halfway-regret-honest-lied')), { requires: [flagIs('honest-lied')] }),
    ch('What I took from the shop with no shopkeeper.', out(P(
      'You tell them about the shed, and the tin, and the Meowth with one eye open. They listen to all of it, and nod.',
      L('The traveller: "It can\'t be undone."', 'The traveller: "But I\'ll carry a little of it for you."'),
      'They write it down in the small book.',
    ), flag('halfway-regret-honest-took')), { requires: [flagIs('honest-took')] }),
    ch('Nothing.', out(L('The traveller: "Lucky."', 'They take another bite of the apple and look at you.', 'The traveller: "Or not paying attention."'))),
    ch('Ask what they\'d undo.', out(P(
      'They are quiet for a long time. The apple is finished. They turn the core over in their fingers.',
      L('The traveller: "I\'d have stopped at this stone the first time."', 'They pull the hood back up. "I walked straight past it. I didn\'t know what it was. I\'ve been coming back ever since."'),
    ), moment('At the halfway stone, the Hooded Traveller told you the one thing they would undo.', 70))),
  ]),
];

const TABLE = (): Json => ({ kind: 'itemFrom', ids: GIFTS });
const THANKED = again('ne98-regions-thank-you');
const tableOf = (n: number): Json[] => Array.from({ length: n }, TABLE);

const NE98: Json[] = [
  ne(98, 'regions-thank-you', 'The Region\'s Thank-You', GROUP.fest, {
    place: { earliest: 'A8', sits: 'must-see', attaches: 'after', often: 'region', note: 'After Step 20 of a region\'s eighth stage, before the next region\'s first. Once per region. The gifts depend on the region\'s Kindness count.' },
    tags: ['Story', 'Relationship'], cast: ['trainer.worker_m'], effect: 'none', tint: '#2a2418',
    repeat: true,
    requires: [place({ regionEnd: true })],
  },
  P(
    'At the border, by the gate out of the region, someone has set up a table.',
    'On it are things. Little parcels, jars, a basket, a pair of mittens, each one with a paper tag tied on with string.',
    L('Border guard Leofric: "They\'ve been coming all morning. People you helped."', 'Leofric: "I\'ve had to get a second table."'),
  ), [
    ch('Take everything.', out(P(
      'You gather it all up. It takes both arms.',
      'There is a parcel for every kindness you did in this region, near enough. You walk across the border loaded down and lighter than you have felt in weeks.',
    ), TABLE(), THANKED), {
      branches: [
        { when: [flagIs('kind-total', 6)], text: P('You gather it all up. It takes both arms and a borrowed sack.', 'There is a parcel for every kindness you did, near enough: six of them, each tied with string. You cross the border loaded down and lighter than you have felt in weeks.'), effects: [...tableOf(6), THANKED] },
        { when: [flagIs('kind-total', 4)], text: P('You gather it all up. It takes both arms.', 'A parcel for each kindness, near enough. You cross the border loaded down and lighter than you have felt in weeks.'), effects: [...tableOf(4), THANKED] },
        { when: [flagIs('kind-total', 2)], text: P('You gather them up. Only a couple, but each one was carried here on foot.', 'You cross the border holding them carefully.'), effects: [...tableOf(2), THANKED] },
      ],
    }),
    ch('Take one, leave the rest for the next traveller.', out(P(
      'You take one small parcel, the one with the shakiest handwriting on its tag, and leave the rest.',
      L('Leofric: "For the next one through?"', 'You nod. He straightens the table so it looks nice for them.'),
    ), TABLE(), ...kind(2), flag('border-left'), THANKED)),
    ch('Read the tags.', out(P(
      'You read every tag before you touch anything. Each one is a line from someone you helped, and the place you met them.',
      '"For the one who stopped." "Thank you for the Berries." "My Pokémon is well now." Your team crowds round to read over your shoulder, very proud of themselves.',
    ), bondUp(1, 'party'), THANKED)),
  ], [
    variant('one-table', [not('kind-total')], {
      intro: P('At the border, by the gate out of the region, there is one small table, and one thing on it.', L('Border guard Leofric: "From me. Nobody else came."', 'He doesn\'t say it unkindly. He pushes it toward you. "Safe travels, anyway."')),
      hide: [0, 1],
      addChoices: [ch('Take the guard\'s gift.', out('You take it, and thank him. He nods, and opens the gate.', TABLE(), THANKED))],
    }),
  ]),
];

const guests = (n: number, text: string): Json => ({ when: [flagIs('kind-total', n)], text, effects: [...Array.from({ length: n }, (): Json => ({ kind: 'itemFrom', ids: GIFTS }))] });

const NE99: Json[] = [
  ne(99, 'longest-night', 'The Longest Night', GROUP.fest, {
    place: { earliest: 'A1', sits: 'must-see', attaches: 'rest', note: 'The run\'s final + node; or, in the real winter solstice week, the first + node of any stage.' },
    tags: ['Story', 'Recovery'], rarity: 'rare', effect: 'fire', tint: '#0c0c18',
    requires: [place({ lastRegion: true, regionEnd: true })],
  },
  P(
    'The fire won\'t stay lit. You feed it, and it gutters, and you feed it again. It is the darkest night of the whole journey.',
    'Something is moving out beyond the light. The team draws in close around you, every one of them, and waits.',
    'One by one, the eyes beyond the light come closer. They are the wild Pokémon you were kind to, all this long way. They have come to sit at the edge of your fire.',
  ), [
    ch('Make room.', out(P(
      'You shift over. The team shifts over. The circle opens, and they come in out of the dark and sit down among you, close and warm.',
      'The fire catches, all at once, and burns high and gold all night. In the morning everyone is whole.',
    ), heal(1))),
    ch('Share the food.', out('You share what there is.'), {
      branches: [
        guests(5, P('You share out everything you have, a little to each guest. Nobody gets much. Everyone gets some.', 'At dawn they are gone. Where each one sat, something has been left for you. Five gifts, in a ring around the cold fire.')),
        guests(3, P('You share out what you have with each guest who came.', 'At dawn they are gone, and where each one sat, a small gift has been left for you.')),
        guests(1, P('You share your supper with the one who came.', 'At dawn it is gone, and where it sat there is a small gift, set down carefully.')),
      ],
    }),
    ch('Tell them the story so far.', out(P(
      'You tell them the story. All of it, from the very first step. Every place, every face, every fight, in order, one at a time.',
      'The team listens as if they weren\'t there for all of it. The guests listen with their eyes shining. When you finish, the sky is getting light, and the album is finished.',
    ), bondUp(1, 'party'), moment('On the longest night, you told the whole story so far, in order, to everyone at the fire.', 80))),
  ], [
    variant('the-team-is-enough', [not('kind-total')], {
      intro: P('The fire won\'t stay lit. You feed it, and it gutters, and you feed it again. It is the darkest night of the whole journey.', 'Nothing comes out of the dark. The dark stays empty. The team draws in close around you, every one of them, warm and breathing.', 'It is enough. It is more than enough.'),
      hide: [1],
    }),
  ]),
];

const PHOTO_HOME = [flagIs('camp-photo-home')];
const NE100: Json[] = [
  ne(100, 'road-home', 'The Road Home', GROUP.fest, {
    place: { earliest: 'A1', sits: 'must-see', attaches: 'after', note: 'After the final battle, win or lose. Not on the map: it is the map, walked backwards. Every node where somebody was helped has them standing on it.' },
    tags: ['Story'], rarity: 'rare', effect: 'none', tint: '#2a2418',
    // Never drawn or placed on a map: the run end opens it after the final battle, win or lose (src/core/co/roadHome.ts).
    room: true,
  },
  P(
    'The road you came by, walked the other way. Everything is smaller than it was.',
    'Each region goes by in a line. The bridge that sings. The pond shaped like a foot. A shed by the road with a sign on it. People you helped stand at the places where you met them, and wave.',
    'Then a gate, and a lane, and your house. There is a light on.',
  ), [
    ch('Again.', out(P(
      'You stand at the door a long moment, with the light on your face. Then you turn round and look back down the road.',
      'Your team looks at you, and at the road, and back at you. Nobody says anything. Nobody needs to. Again.',
    ))),
    ch('Not yet. Stay a while.', out(P(
      'You go inside. You stay.',
      L('{starter} sleeps all morning in the warm spot by the stove.', '{most} spends the afternoon at the window, watching the road.', '{least} finds the garden, and the garden finds it.', 'In the evening everyone is in a heap on the rug, and nobody moves till morning.'),
    )), { branches: [{ when: PHOTO_HOME, text: P('You go inside. You stay. In the hall is the photograph from the road: the whole team asleep in a pile, you in the middle, mouth open.', L('{starter} sleeps all morning in the warm spot by the stove.', '{most} spends the afternoon at the window, watching the road.', '{least} finds the garden, and the garden finds it.', 'In the evening everyone is in a heap on the rug under the photo, and nobody moves till morning.')), effects: [] }] }),
    ch('Bring everyone inside.', out(P(
      'Everyone comes in. The team. Whoever walked with you. It is far too many for one small house.',
      'Somebody\'s Snorlax is stuck in the doorway and has decided it lives there now. Nobody minds. Somebody puts the kettle on.',
    )), { branches: [{ when: PHOTO_HOME, text: P('Everyone comes in. The team. Whoever walked with you. It is far too many for one small house.', 'Somebody\'s Snorlax is stuck in the doorway and has decided it lives there now. On the wall, the photograph from the road watches over all of it.'), effects: [] }] }),
  ], [
    variant('rival-friend', [{ kind: 'rivalPath', path: 'friend' }], { notice: L('Your rival falls into step beside you on the last stretch, grinning, bumping your shoulder.', 'Rival: "So. Again next year?"') }),
    variant('rival-rival', [{ kind: 'rivalPath', path: 'rival' }], { notice: L('Your rival catches up on the last stretch, hands in pockets, not looking at you.', 'Rival: "So. Again next year? I\'ll win next time."') }),
    variant('rival-between', [{ kind: 'rivalPath', path: 'between' }], { notice: L('Your rival walks beside you for the last stretch without saying anything. At the gate they stop.', 'Rival: "So. Again next year?"') }),
  ]),
];

export const EVENTS: Json[] = [
  ...NE76, ...NE77, ...NE78, ...NE79, ...NE80, ...NE81, ...NE82, ...NE83, ...NE84, ...NE85,
  ...NE86, ...NE87, ...NE88, ...NE89, ...NE90, ...NE91, ...NE92, ...NE93, ...NE94, ...NE95,
  ...NE96, ...NE97, ...NE98, ...NE99, ...NE100,
];
