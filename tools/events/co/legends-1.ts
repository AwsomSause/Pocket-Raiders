// Catalog Overhaul Pack, legends: the Alphas A2 to A11 (QUESTLINES_ALPHAS_AND_ANOMALIES.md part one; A7 to A11 from
// QUESTLINES_DEEPENED_1.md, which replaces the short scripts). A1 (the Noble Frenzy) is built by families-c.
// An Alpha is calmed, not beaten (core/battle/calm.ts). Door shapes are chain pseudo-stages (src/data/catalogOverhaul/pseudo/legends.json).
import { $, BERRIES, again, ch, ev, ferry, fight, flag, flagAgo, flagAt, flagIs, fr, good, has, hurt, item, leave, money, out, ptype, room, takeNode, trainer, type Json } from '../dsl.ts';
import { alpha, calmedAlpha, gift, joinAlpha } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Alphas';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 70): Json => ({ kind: 'moment', text, importance });
const intel = (): Json => flag('intel');

// ---------------------------------------------------------------- A2. The Black Tide (Door: sail or climb the lighthouse)
const TIDE_CALM = [joinAlpha('gyarados', { moves: ['keepers-lamp'] }), flag('tide-calmed'), moment('The Black Tide followed you home. The ferry runs again; the lamp is lit every night.', 80)];
const tideFight = (need: number, o: { perTurn?: number } = {}): Json =>
  alpha({ species: 'gyarados', need, perTurn: o.perTurn, weather: 'rain', calm: TIDE_CALM, win: [flagAt('tide-beaten'), moment('The Black Tide sank away, beaten. It will not circle the lighthouse again.', 60)] });
const shield = (next: Json[]): Json[] => [
  ch('A Water-type shields the boat.', out('Your Water-type slides into the swell beside the boat and takes the wave on its back. The boat rocks, and rights itself.', fr(3, 'lead'), ...next), { requires: [ptype('water')] }),
  ch('A Flying-type shields the boat.', out('Your Flying-type rides the wind above the boat and drives the spray aside with its wings.', fr(3, 'lead'), ...next), { requires: [ptype('flying')] }),
  ch('Row hard.', out('You row until your hands burn. The wave catches the stern anyway and soaks everyone.', hurt(0.15), ...next)),
];

const blackTide: Json[] = [
  {
    id: 'story-alpha-black-tide',
    requires: [],
    minStage: 1,
    intro:
      'Storm water by the drowned lighthouse. A shadow longer than the ferry coils under the waves.\n\nFerryman: "I\'m not sailing. Not with that out there."\nFerryman: "It\'s been circling the lighthouse twenty years. Since the keeper drowned."\nFerryman: "He had a Magikarp. Let it go the night before."',
    choices: [
      ch('Sail anyway.', out('The ferryman will not come, but he lends you his small boat. "Keep low," he says. "It comes up where you are not looking."', flag('tide-sailed'), room('co-tide-sail-1'))),
      ch('Relight the lamp.', out('The Sunken Lighthouse leans out of the water at the end of a broken causeway. Nobody has climbed it since the keeper.', flag('tide-lamp'), room('co-tide-lamp-1'))),
      ch('Fight it from the shore.', fight('You stand on the rocks and call it up. It rises out of the water, and keeps rising. In the water it is enormous.', tideFight(8))),
    ],
  },
  ev('co-tide-sail-1', 'The Black Tide: Open Water', G, { ...R, cast: ['trainer.fisherman'], pokemon: 'gyarados', tint: '#203858', effect: 'rain' },
    'The lighthouse shrinks behind you. The sea is quiet in a way that is not calm. Then the water ahead of the boat lifts, a long way, like a hill getting up.', shield([room('co-tide-sail-2')])),
  ev('co-tide-sail-2', 'The Black Tide: The Circling', G, { ...R, pokemon: 'gyarados', tint: '#1b2f4a', effect: 'rain' },
    'It surfaces behind you this time, close enough to see the old scars along its jaw. It circles the boat once, twice, the way it has circled the lighthouse for twenty years.', shield([room('co-tide-sail-3')])),
  ev('co-tide-sail-3', 'The Black Tide: Under the Boat', G, { ...R, pokemon: 'gyarados', tint: '#14243a', effect: 'rain' },
    'The boat stops. The water under it is black and moving. It comes up beneath you and the boat slides off its back into the swell. It looks at you with eyes as red as the lamp used to be.',
    [ch('Calm it. Hold on and keep talking to it.', fight('You keep your voice low and steady, the way the keeper must have.', tideFight(6)))]),
  ev('co-tide-lamp-1', 'The Black Tide: The Lighthouse Stair', G, { ...R, cast: ['trainer.fisherman'], tint: '#2a3a52', effect: 'rain' },
    'The stair goes round and round inside the tower. Halfway up, in the keeper\'s room, a sea chest has been tied shut with rope gone white with salt.',
    [
      ch('Open the keeper\'s chest.', out('Inside, wrapped in oilcloth: a bundle of letters in a careful hand. Every one begins the same way. "Dear Magikarp."', flag('tide-letters'), room('co-tide-lamp-2'))),
      ch('Leave it. Climb on.', out('It is not your chest. You climb.', room('co-tide-lamp-2'))),
    ]),
  ev('co-tide-lamp-2', 'The Black Tide: The Lamp Room', G, { ...R, pokemon: 'gyarados', tint: '#3a3020', effect: 'rain' },
    'The lamp room is glass on every side. Out in the storm the shadow has stopped circling. It is looking up at the dark lamp.',
    [
      ch('Light the lamp.', fight('The wick takes. The great lens turns, slowly, and throws its beam across the water. The shadow rises into it. It will come in over three turns of the light, if you can stand it that long.', tideFight(6, { perTurn: 2 }))),
      ch('Read a letter aloud.', out('"Dear Magikarp. They say you will grow up to be something terrible. I do not believe them. I will keep the lamp lit so you can find your way back." The great head comes up to the glass and stays there. The red goes out of its eyes all at once.', ...TIDE_CALM, calmedAlpha()), { requires: [flagIs('tide-letters')] }),
    ]),
  ev('co-tide-beach', 'The Black Tide: The Beach', G, { callback: true, rarity: 'rare', requires: [flagAgo('tide-beaten', 1)], pokemon: 'gyarados', tint: '#5a6a7a' },
    'A grey beach, far from the lighthouse. Something long and dark lies at the edge of the tide. It is the Black Tide, and it is dying.',
    [
      ch('Sit with it.', out('You sit on the wet sand beside its head until the tide comes in. It does not look at you, and then, near the end, it does.', fr(3), good(1), flag('tide-sat'))),
      leaveCh('You cannot. You walk on, and do not look back until the beach is gone.'),
    ]),
];
function leaveCh(text: string): Json {
  return ch('Walk on.', leave(text));
}

// ---------------------------------------------------------------- A3. The Frostbound (Door: two nodes round)
const FROST_CALM = [joinAlpha('baxcalibur', { moves: ['last-winter'] }), flag('frost-calmed'), moment('The Frostbound woke, and the pass thawed behind it.', 80)];
const frostbound: Json[] = [
  {
    id: 'story-alpha-frostbound',
    requires: [],
    minStage: 1,
    intro:
      'The snow pass is shut. Ice spikes jut from the road. A dragon of frost sleeps across it.\n\nMountain guide: "It came up here to die. Froze before it could."\nGuide: "While it sleeps, the pass stays winter. Every village below goes hungry."',
    choices: [
      ch('Wake it.', fight('You shout. The ice along its back cracks like a lake in spring, and it lifts its head.', alpha({ species: 'baxcalibur', need: 8, weather: 'hail', calm: FROST_CALM, win: [flag('frost-woke'), moment('Beaten, the Frostbound fled up the mountain. The pass stays frozen.', 60)] }))),
      ch('Dig around it.', out('The guide knows the long way round. Two days of it.', room('co-frost-dig-1'))),
      ch('Keep it warm.', out('Your Fire-types lie down against its frozen side and stay there. One turn. Two. On the third, the ice runs off it in streams. It wakes, looks at you for a long time, and walks away into the high snow. The pass thaws behind it, and where it lay there is an egg.', flag('frost-warmed'), gift('frigibax', { moves: ['last-winter'] }), good(1)), { requires: [ptype('fire')] }),
    ],
  },
  ev('co-frost-dig-1', 'The Frostbound: The Long Way', G, { ...R, cast: ['trainer.hiker'], tint: '#9ab8d0', effect: 'snow' },
    'The long way round is a goat path along the cliff. The wind comes straight off the ice. Below, the sleeping dragon looks small.',
    [ch('Keep going.', out('You keep going, one foot and then the other.', room('co-frost-dig-2')))]),
  ev('co-frost-dig-2', 'The Frostbound: The Far Side', G, { ...R, cast: ['trainer.hiker'], tint: '#b8d0e0', effect: 'snow' },
    'You come down on the far side of the pass. Behind you the dragon still sleeps across the road, and the villages below are still hungry.',
    [ch('Go on down.', out('The guide shakes your hand at the bottom. "Somebody will wake it one day," he says. "I hope they\'re kind."', item('nevermeltice')))]),
];

// ---------------------------------------------------------------- A4. The Hushed One (Door: three nodes across the moor)
const HUSH_JOIN = [joinAlpha('noctowl', { ability: 'hush' }), flag('hush-sat'), calmedAlpha(), moment('The Hushed One landed on your arm.', 80)];
const hushRoom = (n: number, text: string, next: Json): Json =>
  ev(`co-hush-cross-${n}`, 'The Hushed One: The Moor', G, { ...R, pokemon: 'noctowl', tint: '#3a3048', effect: 'none' }, text, [
    ch('Keep low and keep still.', out('Nothing sees you. The moor lets you pass.', next)),
    ch('Run for the next stone.', out('You run. Something in the heather turns its head, and you lose your footing on the wet ground.', hurt(0.1), next)),
  ]);
const hushed: Json[] = [
  {
    id: 'story-alpha-hushed-one',
    requires: [],
    minStage: 1,
    intro:
      'Dusk on the moor. No wind. A great owl watches from a dead tree. Your own voice sounds thin.\n\nThe subtitles stop working. Your Pokémon look at each other.\nA shepherd, in sign language, subtitled only when you are near: "It eats sound. Don\'t fight it. Cross it."',
    choices: [
      ch('Cross the moor quietly.', out('You nod to the shepherd and step off the path into the heather.', room('co-hush-cross-1'))),
      ch('Fight it.', fight('You call your Pokémon, and no sound comes out. They look back at you, and then they do what they think is best.', alpha({ species: 'noctowl', need: 6, rule: { noCommands: true }, calm: HUSH_JOIN, win: [flag('hush-fought')] }))),
      ch('Sit under the tree.', out('You sit. The owl does not come down.', ...HUSH_JOIN), { requires: [flagIs('hush-crossed')] }),
    ],
    remembers: [
      {
        id: 'prince-signs',
        when: [flagIs('prince-signs', 5)],
        notice: 'You know enough signs to talk with the shepherd properly.',
        addChoices: [ch('Ask the shepherd for the route.', out('The shepherd\'s hands move fast and you follow most of it. There is a way across where the owl does not look. At the end of it there is a dead tree.', flag('hush-crossed'), room('co-hush-tree')))],
      },
    ],
  },
  hushRoom(1, 'The heather is waist deep. Wild Pokémon move in it, silent, the way everything here is silent. You crouch behind a standing stone.', room('co-hush-cross-2')),
  hushRoom(2, 'A Mightyena pack crosses the path ahead of you without a sound. Their paws do not even rustle.', room('co-hush-cross-3')),
  hushRoom(3, 'The last stretch is open bog. The owl\'s head turns, slowly, all the way round, and stops.', { kind: 'flag', key: 'hush-crossed', amount: 1 }),
  ev('co-hush-tree', 'The Hushed One: The Dead Tree', G, { ...R, pokemon: 'noctowl', tint: '#2a2438' },
    'You are across. The dead tree stands at the edge of the moor, and the owl is in it, watching you.',
    [
      ch('Sit under the tree.', out('You sit with your back to the trunk. A long time passes with no sound at all. Then a weight lands on your arm, light for its size, and stays.', ...HUSH_JOIN)),
      ch('Walk on.', leave('You leave the moor without a word. Behind you the silence closes up again.')),
    ]),
];
// The last crossing room opens the tree.
(hushed[3] as { choices: { success: { effects: Json[] } }[] }).choices.forEach((c) => c.success.effects.push(room('co-hush-tree')));

// ---------------------------------------------------------------- A5. The Orchard Warden (Single: two nodes)
const orchard: Json[] = [
  {
    id: 'story-alpha-orchard-warden',
    requires: [],
    minStage: 1,
    intro:
      'An empty orchard town. Vines over every door. A giant rests among the trees, its shell the orchard.\n\nA villager, found in the next town: "It moved. We ran."\nVillager: "It only moved because we stopped harvesting. We got old."',
    choices: [
      ch('Bring them back.', out('It takes two days of knocking on doors in the next town, and a lot of tea. In the end they come: slowly, with their baskets, looking up at the giant the whole way.', takeNode(2), room('co-orchard-harvest'))),
      ch('Harvest alone.', fight('You climb the first tree on its back. It is too much for one, and the giant stirs.', alpha({ species: 'torterra', need: 6, likes: ['scent'], calm: [flag('orchard-settled'), item('sitrus-berry', 3), calmedAlpha()], win: [flag('orchard-fought')] }))),
      ch('Leave.', leave('You leave the orchard to the vines. It stays still forever.')),
    ],
  },
  ev('co-orchard-harvest', 'The Orchard Warden: The Harvest', G, { ...R, cast: ['trainer.aroma_lady'], pokemon: 'torterra', tint: '#4a7a3a' },
    'The harvest goes on all day with the giant watching. Then one man fills a third basket, and a fourth, and starts stripping a tree the giant has not offered. The ground under the orchard shifts. It is standing up.',
    [
      ch('Stop him.', out('You catch his arm. He puts the basket down. The giant settles, very slowly, and the orchard is still again. When the baskets are full, something small climbs out from under its shell and walks over to you.', flag('orchard-full'), good(1), gift('turtwig'), ...BERRIES.map((b) => item(b, 2)), moment('The orchard town is full again. A Turtwig came out from under the Warden\'s shell.', 75))),
      ch('Let him.', out('You look away. The orchard stands, all of it, trees and vines and birds, and walks off into the hills. Nobody follows.', flag('orchard-greed'))),
    ]),
];

// ---------------------------------------------------------------- A6. The Quarry King (Single, four nights)
const POACHER = (n: number, last: boolean): Json =>
  ev(`co-quarry-night-${n}`, 'The Quarry King: Poachers', G, { ...R, cast: ['trainer.hiker'], pokemon: 'rhyperior', tint: '#5a4a3a' },
    ['The first night, they come up the haul road with lamps.', 'The second night, they try the cliff path.', 'The third night, they come all together.'][n - 1]!,
    [
      ch('Hold the cut.', fight('"Out of the way. That horn\'s worth more than you are."', trainer('Poacher', { cls: 'hiker', size: 2, lose: [flagAt('quarry-poachers-escaped')], win: [flag('quarry-held')], friendly: true }), ...(last ? [room('co-quarry-calm')] : []))),
    ]);
const quarryCalm = ev('co-quarry-calm', 'The Quarry King: The Fourth Night', G, { ...R, cast: ['trainer.hiker'], pokemon: 'rhyperior', tint: '#6a5a40' },
  'The fourth night is quiet. The great Rhyperior comes down to the rope and looks at you over it.\n\nLeader: "It chews them. Hard Stones. Like gum."',
  [
    ch('Hold out a Hard Stone.', out('It takes the stone from your hand as gently as a horse takes an apple. Crunch. It lies down. In the morning there is a horn on the ground where it slept: the old one, shed. The quarry becomes a reserve.', { kind: 'loseItem', id: 'hard-stone' }, item('shed-horn'), calmedAlpha(), flag('quarry-reserve'), moment('The Quarry King shed its horn, and the quarry became a reserve.', 75)), { requires: [has('hard-stone')] }),
    ch('Sit with it until morning.', out('You have no stone to give it. You sit by the rope and it watches you, and neither of you sleeps. In the morning the Leader brings a sack of them.', item('shed-horn'), calmedAlpha(), flag('quarry-reserve'))),
  ]);
const quarry: Json[] = [
  {
    id: 'story-alpha-quarry-king',
    requires: [],
    minStage: 1,
    intro:
      'Rockfall on the quarry road. A local Gym Leader has roped the cut off.\n\nLeader: "Poachers want its horn. I\'ve been guarding it alone for four nights."\nLeader: "It\'s not dangerous. It\'s scared. Every fight near it makes it worse."',
    choices: [
      ch('Guard with you.', out('You split the cut between you. The Leader takes the haul road; you take the rest.', flag('quarry-guarded'), { kind: 'laterEvent', eventId: 'co-quarry-night-1', nodes: 1 }, { kind: 'laterEvent', eventId: 'co-quarry-night-2', nodes: 2 }, { kind: 'laterEvent', eventId: 'co-quarry-night-3', nodes: 3 })),
      ch('Take a shift so you can sleep.', out('The Leader is asleep before you finish saying it. You guard the cut alone.', flag('quarry-shift'), flag('quarry-leader-friend'), { kind: 'laterEvent', eventId: 'co-quarry-night-1', nodes: 1 }, { kind: 'laterEvent', eventId: 'co-quarry-night-2', nodes: 2 }, { kind: 'laterEvent', eventId: 'co-quarry-night-3', nodes: 3 })),
      ch('Catch it before they do.', fight('You step over the rope. It panics, and the whole quarry shakes. In the dust, you hear the poachers\' truck start up.', alpha({ species: 'rhyperior', need: 8, calm: [joinAlpha('rhyperior'), flagAt('quarry-poachers-escaped')], win: [flagAt('quarry-poachers-escaped')] }))),
    ],
  },
  POACHER(1, false),
  POACHER(2, false),
  POACHER(3, true),
  quarryCalm,
  ev('co-quarry-poachers-return', 'The Quarry King: The Poachers Return', G, { callback: true, rarity: 'rare', requires: [flagAgo('quarry-poachers-escaped', 1)], cast: ['trainer.hiker'], pokemon: 'rhyperior', tint: '#4a3a2a' },
    'A truck you know, on a road in another region. In the back, under a tarpaulin, something huge and red-eyed is chained. They took one after all.',
    [
      ch('Stop them.', fight('"You again."', trainer('Poacher Boss', { cls: 'hiker', team: ['rhyperior', 'excadrill', 'golem'], win: [flag('quarry-poachers-stopped'), good(1)] }))),
      ch('Let them go.', leave('The truck grinds past. You hear chains.')),
    ]),
];

// ---------------------------------------------------------------- A7. The Rooftop Watcher (deepened)
const WATCHER_FIX = [calmedAlpha(), flag('watcher-mended'), flag('watcher-taxi', 3), moment('You mended the telescope, and the Rooftop Watcher offered you rides.', 80)];
const watcher: Json[] = [
  {
    id: 'story-alpha-rooftop-watcher',
    requires: [],
    minStage: 1,
    intro:
      'Black feathers drift from the ruined observatory. On the dome, something armoured.\n\nThe dome\'s split like an egg. Through the gap, a brass telescope, still turning, very slowly, with a noise like a spoon in a drain.\nAstronomer, Dr. Thaddea Lockhart, from behind a filing cabinet: "It nests there because the telescope still turns. It likes the light at night. The eyepiece glows; I think it thinks it\'s a moon."\nDr. Lockhart: "The motor\'s grinding. Every night it\'s louder. Every night it\'s angrier at the noise. Last night it took the weathervane off. It was a good weathervane."\nOn the dome, a head turns. Red eyes. Each feather\'s the size of a shield.',
    choices: [
      ch('Fix the telescope.', out('Three lenses, in three rooms of the ruin. Dr. Lockhart draws you a map on the back of an envelope. Through the roof, the Alpha watches you go.', room('co-watcher-objective'))),
      ch('Fight it on the dome.', fight('You climb out onto the dome. It is breaking: each turn a panel falls, and anything standing on it loses its footing. Flying types and light ones are not troubled.', alpha({ species: 'corviknight', rule: { breakingFloor: true }, win: [flag('watcher-beaten'), moment('When it was beaten it did not fall. It landed, very upright, and looked at the hole it had made in its own roof.', 60)] }))),
      ch('Turn the telescope off.', out('The switch. The turning stops. The eyepiece goes dark.\nIt screams. It\'s gone in three wingbeats. Nothing\'s nested on the dome by morning.\nDr. Lockhart: "It\'s quiet. I wanted quiet. I don\'t— it\'s very quiet."', flag('watcher-driven'))),
    ],
  },
  ev('co-watcher-objective', 'The Rooftop Watcher: The Objective', G, { ...R, tint: '#3a3a4a' },
    'The library. The objective lens is under a fallen shelf, and the shelf is under three hundred books.',
    [
      ch('A strong Pokémon lifts the shelf.', out('Your strongest Pokémon gets its shoulder under the shelf and lifts. The lens is not even scratched.', room('co-watcher-mirror')), { check: 'strength', fail: out('It strains and the shelf will not move. You take the books off a row at a time instead.', takeNode(), room('co-watcher-mirror')) }),
      ch('Move the books a row at a time.', out('It takes all night. You read the first page of a lot of books.', takeNode(), room('co-watcher-mirror'))),
    ]),
  ev('co-watcher-mirror', 'The Rooftop Watcher: The Mirror', G, { ...R, pokemon: 'murkrow', tint: '#2a2a3a' },
    'The cellar. The mirror is in a nest of Murkrow, who like shiny things and will trade.',
    [
      ch('Trade them a coin.', out('You hold out a coin. Six Murkrow look at it. One of them takes it and pushes the mirror toward you with its beak.', $(-100), room('co-watcher-eyepiece')), { requires: [money(100)] }),
      ch('Trade them something that shines.', out('A Nugget. The Murkrow lose their minds. You walk out with the mirror and a cellar full of very happy birds.', { kind: 'loseItem', id: 'nugget' }, room('co-watcher-eyepiece')), { requires: [has('nugget')] }),
    ]),
  ev('co-watcher-eyepiece', 'The Rooftop Watcher: The Eyepiece', G, { ...R, pokemon: 'corviknight', tint: '#1a1a2a' },
    'The eyepiece is in the Corviknight\'s own nest, on the dome. It has to let you take it.',
    [
      ch('Hold out the other two lenses.', out('It looks at the lenses a long time. Then it steps aside.\nThe motor\'s oiled. The noise stops. The telescope swings, and settles on something in the sky.\nThe Corviknight walks along the dome\'s edge, puts one eye to the gap, and looks through it at the same thing.\nDr. Lockhart: "...It was never the light. It wanted to see what I was looking at."\nIt lowers a wing.', ...WATCHER_FIX)),
    ]),
  ev('co-watcher-taxi', 'The Watcher\'s Taxi', G, { callback: true, rarity: 'rare', requires: [flagIs('watcher-taxi')], pokemon: 'corviknight', tint: '#2a2a3a' },
    'A shadow crosses the path. The Rooftop Watcher lands beside you and lowers a wing.',
    [
      ch('Ride.', out('It carries you over the next stretch of road in three wingbeats.', ferry(), flag('watcher-taxi', -1), again('co-watcher-taxi'))),
      ch('Not now.', out('It waits a moment, then lifts off. It will be back.', again('co-watcher-taxi'))),
    ]),
];

// ---------------------------------------------------------------- A8. The Sleeper (deepened)
const SLEEPER_SHADE = ch('Build shade.', out('Your Grass-type plants a seed at the bridge\'s end and grows it, a little at a time, over the next three nodes.\nNode one: a sapling by the bridge\'s end. Children water it. Nobody asked them to.\nNode two: head height. The carters have unhitched; they\'re sitting under what there is of it.\nNode three: it\'s wide enough. The Snorlax opens one eye. It looks at the tree for a long time.\nIt gets up. Carefully, the way something gets up when it knows what\'s on it. It walks off the bridge, and lies down under the tree, and the family in its fur doesn\'t even wake.\nThe bridge springs back up with a noise like a held breath. A Munchlax from the family climbs down and asks to come with you; the others stay.', takeNode(3), flag('sleeper-shade'), calmedAlpha(), fr(10, 'picked'), gift('munchlax')), { pick: { types: ['grass'] }, requires: [ptype('grass')] });
const sleeperWake = (label: string): Json =>
  ch(label, fight('You climb up and shout into its ear. On its first turn the family scatters: small shapes, running, into a valley with no shade in it.\nIt fights like something that\'s been hit while holding a child.', alpha({ species: 'snorlax', win: [flag('sleeper-forced')] })));
const sleeper: Json[] = [
  {
    id: 'story-alpha-sleeper',
    requires: [],
    minStage: 1,
    intro:
      'A mountain on a bridge that snores.\n\nThe bridge is bowed in the middle. A queue of carts on both sides. Somebody\'s set up a tea stall; it\'s been that long.\nThe mayor, Mr. Ignatius Follett, hoarse: "Flutes. Shouting. Berries. A brass band, Thursday. It rolls over. It rolled onto the tuba."\nThe belly rises. The belly falls. In the fur, near the top: two small eyes, looking out. Then four. Then they\'re gone.',
    choices: [
      sleeperWake('Wake it.'),
      ch('Look closer.', out('You climb. It\'s warm. In the fur of its chest, like a nest in a hedge: a Munchlax, asleep; three Rattata; a Pidgey with a bad wing; something that might be a Teddiursa.\nBelow the bridge, the river\'s dry. Above it, no tree for a mile. The bridge\'s shadow, and the Snorlax\'s, are the only shade in the valley.\nA carter, looking up: "That\'s why the Rattata\'ve gone from my barn. I thought I\'d got lucky."', flag('sleeper-seen'), room('co-sleeper-bridge'))),
      SLEEPER_SHADE,
      ch('Take the ford.', leave('There\'s always a ford one step longer. You take it, and the bridge snores on behind you.')),
    ],
  },
  ev('co-sleeper-bridge', 'The Sleeper: Knowing', G, { ...R, pokemon: 'snorlax', tint: '#6a7a5a' },
    'You climb back down. You know what is on it now.',
    [sleeperWake('Wake it, knowing.'), SLEEPER_SHADE, ch('Take the ford.', leave('You take the ford, and let them sleep.'))]),
];

// ---------------------------------------------------------------- A9. The Static Choir (deepened)
const CHOIR_JOIN = [joinAlpha('electivire'), calmedAlpha(), flag('choir-cut'), intel(), moment('The Static Choir can hear itself again. The plant keeps one thin line into its yard, labelled by hand: HERS.', 80)];
const line = (n: 1 | 2 | 3): Json => {
  const next = n < 3 ? [{ kind: 'flag', key: `choir-line-${n}`, amount: 1 }] : [];
  const after = ['It\'s the size of a barn. One street\'s lights come on.', 'A cottage. The trams start.', 'It\'s itself. It sits down in the yard, steaming gently.\nThe hum drops to what it was. The Electivire tries the note again. This time, it can hear it. So can the town.'][n - 1]!;
  const choices =
    n === 2
      ? [
          ch('Ask him what\'s on the other end.', out(`"I just watch the box. Nobody said what was on the other end." He looks. He sees it. "...Nobody said." He hands over the key.\n${after}`, ...next)),
          ch('Fight him for the key.', fight('He sighs and sends out his Pokémon.', { ...trainer('Team Grunt', { size: 2, win: next }), evil: 'grunt' })),
        ]
      : [
          ch('Cut the line.', fight(n === 1 ? '"It\'s a power company! We\'re helping it! It\'s a growth programme!"' : 'A lieutenant\'s deputy stands at the last box. She doesn\'t talk.', { ...trainer(n === 1 ? 'Team Grunt' : 'Lieutenant\'s Deputy', { size: n === 1 ? 2 : 3, win: n === 3 ? [...CHOIR_JOIN] : next }), evil: n === 1 ? 'grunt' : 'specialist' })),
        ];
  return ev(`co-choir-line-${n}`, `The Static Choir: Line ${n}`, G, { ...R, pokemon: 'electivire', tint: '#3a3a1a', effect: 'none' }, `The ${['first', 'second', 'third'][n - 1]} feed line runs to a junction box, and a guard stands at it.${n < 3 ? ` When it is cut: ${after}` : ''}`, choices);
};
const choir: Json[] = [
  {
    id: 'story-alpha-static-choir',
    requires: [],
    minStage: 1,
    intro:
      'The substation hums too loud. A crackling giant stalks the fence.\n\nThe town behind you is dark at noon: no signs, no trams, a traffic light swinging dead on its wire.\nThe engineer, Miss Tova Tindall, in a rubber apron: "It was a normal Electivire. It\'s been the plant\'s for years. It likes the hum. It sings to it. Then the company came, and ran three new lines into its yard, and now it gets the whole town\'s current, all day."\nMiss Tindall: "It\'s the size of a house. It can\'t stop taking it in. It\'s not angry. Listen."\nUnder the crackle: a note. Held. It\'s trying to sing, and it\'s too loud to hear itself.',
    choices: [
      ch('Cut the feed lines.', out('Three lines, three junction boxes, each on the road ahead of you, each with a guard.', { kind: 'laterEvent', eventId: 'co-choir-line-1', nodes: 1 }, { kind: 'laterEvent', eventId: 'co-choir-line-2', nodes: 2 }, { kind: 'laterEvent', eventId: 'co-choir-line-3', nodes: 3 })),
      ch('Fight it.', fight('Miss Tindall grabs your sleeve. "Every turn you fight it, it takes more from the lines. It will get stronger every turn. I\'m telling you now." You go in anyway.', alpha({ species: 'electivire', rule: { foeGrows: 'spa' }, win: [flagAt('choir-tripped'), moment('The plant tripped. The town\'s power is out for the region.', 60)] }))),
      ch('Find the company.', out('An office over a laundrette. A brass plate with no name on it. Inside: the team\'s lieutenant, and a wall chart with one line going up.\nNo battle here. You leave with the chart. The Electivire is still growing; the other ways are still open.', intel(), flag('choir-company'), room('story-alpha-static-choir'))),
    ],
  },
  line(1),
  line(2),
  line(3),
];

// ---------------------------------------------------------------- A10. The Unwelcome Guest (deepened)
const GUEST_GASTLY = gift('gastly', { ability: 'three-faces' });
const grins = (turn: number): Json => {
  const wrong = out('The grin you chose peels off and floats away. Laughter, from behind you.', ...(turn < 3 ? [room(`co-guest-grins-${turn + 1}`)] : [flag('guest-lost')]));
  const right = out('The grin gets eyes. Then a great round body. It\'s delighted to have been spotted; it\'s been waiting all winter for somebody good.', flag('guest-found'), room('co-guest-found'));
  const pick = (label: string): Json => ch(label, right, { chance: 1 / 3, fail: wrong });
  return ev(`co-guest-grins-${turn}`, 'The Unwelcome Guest: Three Grins', G, { ...R, pokemon: 'gengar', tint: '#2a1a3a' },
    `Turn ${turn} of 3. The three grins drift. Only the real one blinks; the other two are painted on the dark.`, [pick('The left grin.'), pick('The middle grin.'), pick('The right grin.')]);
};
const guest: Json[] = [
  {
    id: 'story-alpha-unwelcome-guest',
    requires: [],
    minStage: 1,
    intro:
      'A haunted theatre. Three grins float in the dark. One is real.\n\nRed seats, row on row, all empty. On the stage, a ghost light on a stand. Above it, in the black: three smiles, with nothing round them.\nThe owner, Mrs. Clementina Sedgwick, in the foyer, not going further: "It moved in over the winter. It frightened out the troupe. They used to rehearse to an empty house every night; they couldn\'t afford to open."\nMrs. Sedgwick: "I think it misses them. It moves the chairs. Into rows. Facing the stage. It sits in a different one each night."',
    choices: [
      ch('Find the real grin.', out('You walk down the aisle and stand under the three smiles.', room('co-guest-grins-1'))),
      ch('Perform for it.', out('You and your party take the stage and do the best thing you have done this run, again, on a real stage, to one seat. If you have won nothing, the lead does what it can: a bow and a fall.\nIt doesn\'t move through the whole thing.\nThen, from row G: clapping. Two enormous hands. It goes on for some time. It\'s not a critic. It\'s an audience.', calmedAlpha(), flag('guest-applauded'), fr(3), GUEST_GASTLY)),
      ch('Bring the troupe back.', out('Two nodes: the troupe\'s lodging in the next street, and the walk back.', takeNode(2), room('co-guest-troupe'))),
    ],
  },
  grins(1),
  grins(2),
  grins(3),
  ev('co-guest-found', 'The Unwelcome Guest: Spotted', G, { ...R, pokemon: 'gengar', tint: '#3a1a4a' },
    'It hangs in the air in front of you, grinning, waiting to see what you will do.',
    [
      ch('Battle it.', fight('It cackles and comes at you, delighted.', alpha({ species: 'gengar', win: [flag('guest-fought')] }))),
      ch('Applaud it.', out('You clap. It bows, very low, and the bow goes on a little too long, and then it comes down and sits in row G, and a small Gastly peels off it and floats over to you.', GUEST_GASTLY)),
    ]),
  ev('co-guest-troupe', 'The Unwelcome Guest: The Troupe', G, { ...R, cast: ['trainer.guitarist'], tint: '#4a2a2a' },
    'The leading man: "It breathed on me. In the love scene."\nThe director, Madame Lavinia Brecht: "It laughed at the death. A death, darling."',
    ['It was laughing because it was good.', 'It\'s the only audience you\'ve got.', 'It set out the chairs.'].map((label) =>
      ch(label, out(`${label === 'It set out the chairs.' ? 'Silence.\nMadame Brecht: "...It did what?"\n' : ''}They come. Terrified. They rehearse. From the dark:\nA voice like a cellar door: boo.\nThe leading man, without thinking: "It was not that bad!"\nA pause. A cackle. Row G's shaking.\nMadame Brecht, slowly: "...Again. From the top. And this time, make it boo for a reason."\nThe theatre opens. The posters say: WITH LIVE AUDIENCE. Row G's never sold.`, calmedAlpha(), flag('guest-heckles'), GUEST_GASTLY)),
    )),
];

// ---------------------------------------------------------------- A11. The Weeping Lantern (deepened)
const LITWICK = gift('litwick', { moves: ['hex'] });
const lantern: Json[] = [
  {
    id: 'story-alpha-weeping-lantern',
    requires: [],
    minStage: 1,
    intro:
      'A silent graveyard path. Every lantern lit. One floating.\n\nRows of small stones. On each, a lantern, burning violet. The stones are blank. Smooth, as if they\'ve been wiped.\nThe groundskeeper, Mr. Crispin Tolhurst, with a rake: "It burns the names off. Night after night. It goes along the rows and it holds itself against each one, close, like you\'d warm your hands."\nMr. Tolhurst: "To keep them warm, I think. It doesn\'t know stone\'s not cold the way it means. The families come, and they can\'t find theirs. They stand in the wrong row and cry at a stranger."\nThe floating one\'s stopped at a stone. Its flames are low. It\'s leaning on it.',
    choices: [
      ch('Read the names to it.', out('Mr. Tolhurst has the register. You read.\n"Pippin. Raticate. Eleven years." It turns. It drifts to a stone, the right one, and its flame goes steady there.\n"Duchess. Persian. \'She let us live with her.\'" Another.\n"Bramble. Sandshrew. Nineteen years."\nTwelve names. By the eighth it is going ahead of you, to each stone, before you finish reading.\nIt isn\'t burning them off to warm them. It\'s been trying to read them. It can\'t read. It\'s been pressing its face to each one, hoping.\nWhen you close the register, a Litwick drops from a lantern\'s wick into your hand. It knows one name: the last one you read.', flag('lantern-read'), calmedAlpha(), LITWICK)),
      ch('Fight it.', fight('It turns from the stone toward you, and every lantern on the path flares.', alpha({ species: 'chandelure', win: [flag('lantern-fought'), moment('The Weeping Lantern fled. The lanterns went out along every row, one by one, and did not light again.', 60)] }))),
      ch('Find the stonemason.', out('Two nodes: his yard, and back.', takeNode(2), room('co-lantern-mason'))),
    ],
  },
  ev('co-lantern-mason', 'The Weeping Lantern: The Stonemason', G, { ...R, cast: ['trainer.worker_m'], pokemon: 'chandelure', tint: '#3a2a4a' },
    'The mason, Old Quentin Kettlewell, deaf in one ear: "I cut every one of those. Forty years. I\'ll cut them again. I\'ll not do it with that breathing on my chisel."',
    ['It\'ll let you.', 'It only wants to know who they are.', 'Cut them deeper this time.'].map((label) =>
      ch(label, out('At the graveyard: he sets the chisel. The Chandelure comes close. He stops. It stops. He starts again, slower. It holds its light where he needs it.\nWhen the last name is cut, a Litwick drops from a lantern\'s wick into your hand.', flag('lantern-mason'), calmedAlpha(), LITWICK)),
    )),
];

export const EVENTS: Json[] = [...blackTide, ...frostbound, ...hushed, ...orchard, ...quarry, ...watcher, ...sleeper, ...choir, ...guest, ...lantern];

// The short-script versions these replace are the same ids, so nothing is retired here.
export const REMOVE: string[] = [];
