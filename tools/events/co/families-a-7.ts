// Catalog Overhaul Pack: STORY_FAMILIES_4.md, part two. SF23 The Treasure Map, SF24 The Last Shift, SF25 The Egg in the Fire,
// SF26 The Courier's Egg. Build: npm run co:build -- families-a-7. Run memory is same-run only (Kice 2026-11-14).
import { any, ch, egg, fight, flag, flagAt, flagThisRegion, fr, hurt, item, lose, out, room, takeNode, trainer, wild, anyType, RARE_HELD, type Json } from '../dsl.ts';
import { grunt, is, later, moment, not, safe, sub, v } from './_fa.ts';

export const CATEGORY = 'families-a';
/** The Torn Treasure Map chain is the map's pieces 3 and 4 (see _fa-retired.json). */
export const REMOVE = ['ovc-treasure-map-s1', 'ovc-treasure-map-s2'];

const soon = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const again = (eventId: string): Json => ({ kind: 'seeAgain', eventId });

// =====================================================================================================================
// SF23. THE TREASURE MAP. Five pieces, any order; all five open X Marks the Spot, whose three rooms are the dig.
// =====================================================================================================================
const piece = (n: number): Json[] => [flag(`map-piece-${n}`), flag('map-pieces')];
const MAP: Json[] = [
  {
    id: 'th-map-1', requires: [not('map-piece-1'), not('map-claimed')],
    intro: 'A cliff path, the wind trying to take your hat. Wedged in a crack in the rock at shoulder height, something pale flutters: a scrap of old paper, the corner torn off something bigger. A few lines in faded brown ink: "...not for the Ch..." The rest is gone.',
    choices: [
      ch('Take it.', out('You work it out of the crack with two fingers and fold it into your pack. One piece of something.', ...piece(1))),
      ch('Leave it for someone else.', out('You leave it where it is, fluttering. Someone else might need a reason to look up. A region on, you will find it again in another crack, in another cliff, as if it has been following you.', again('th-map-1'))),
    ],
  },
  {
    id: 'th-map-2', requires: [not('map-piece-2'), not('map-claimed')],
    intro: 'Under a bridge, in the cool dark by the water. A Sneasel is crouched on a stone with a strip of old paper in its claws, the faded edge of a map. It sees you, and grins, and runs.',
    choices: [
      ch('Chase it.', fight('You chase it along the bank and it turns at bay, all claws.', wild({ species: ['sneasel'], lv: 1, win: piece(2) }))),
      ch('Trade it a Berry.', out('You hold out a Berry. It stops. It thinks about it, visibly. Then it drops the paper and snatches the Berry and is gone up the bridge supports.', lose('oran-berry'), ...piece(2)), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
      ch('Let it go.', out('It is gone up the bridge supports. Somewhere above you, it is reading the map, upside down.', again('th-map-2'))),
    ],
  },
  {
    id: 'th-map-3', requires: [not('map-piece-3'), not('map-claimed')],
    intro: 'A beach at low tide. A green bottle rolling in the shallows, corked, with paper inside. You fish it out. Through the glass you can see it is half a map, and on the outside of the folded paper, in big capitals, a message: TOO LONG TO WAIT.',
    choices: [
      ch('Uncork it.', out('The cork comes out with a sigh. The paper inside is dry, after who knows how long at sea. Half a map, the inked middle, with a coastline you almost recognise.', ...piece(3))),
      ch('Throw it back.', out('You throw it as far as you can. It bobs once, and is carried out. Later, on another beach, it washes up at your feet again, as if it has decided.', again('th-map-3'))),
    ],
  },
  {
    id: 'th-map-4', requires: [not('map-piece-4'), not('map-claimed')],
    intro: 'A cave, dripping. On the floor, the other half of a map, pinned flat under a rock. The rock is snoring. It is a Graveler, fast asleep, and the coastline strip of the map is sticking out from under its belly.',
    choices: [
      ch('Wake it.', fight('It wakes up very grumpy.', wild({ species: ['graveler'], lv: 1, win: piece(4) }))),
      ch('Wait. (a node)', out('You wait. And wait. Eventually, at its own pace, the Graveler rolls over and away down the cave, still asleep, and the map is lying there, flattened and safe.', takeNode(1), ...piece(4))),
    ],
  },
  {
    id: 'th-map-5', requires: [not('map-piece-5'), not('map-claimed')],
    intro: 'A statue of a Champion in a town square, bronze gone green, one hand held out as if offering something. Tucked into the bronze palm, folded small, is the last piece: a compass rose, drawn in a careful hand.',
    choices: [
      ch('Take it.', out('You reach up and take it. The bronze hand is warm from the sun.', ...piece(5))),
      ch('Look at the statue first.', out('You look up at the face. Young, tired, a little lonely around the eyes. The plaque says a name you half know: a Champion from long ago. This was their treasure. They left the last piece in their own hand. You take it, carefully, as if you were being handed it.', ...piece(5), flag('map-statue'))),
    ],
  },
  {
    id: 'th-treasure', requires: [is('map-piece-1'), is('map-piece-2'), is('map-piece-3'), is('map-piece-4'), is('map-piece-5'), not('map-claimed')],
    intro: 'All five pieces, laid out on a flat rock and weighed down with stones, fit together at last. The torn corner, the faded edge, the two halves, the compass rose. An X, in faded ink. You look up from it, and around, and realise the X is here: this exact spot. The ground is soft.',
    choices: [
      ch('Dig.', out('You dig. Your team digs. Something that digs better than you digs best of all. Two feet down: a carved stone, worn but readable. A mechanism.', flag('map-claimed'), room('dg-treasure-dig-a'))),
    ],
  },
  sub('th-treasure', 'dg-treasure-dig-a', 'The Mechanism', 'Five symbols on five stone dials, worn smooth by hands or water. The compass rose on the fifth piece of the map shows an order.', [
    ch('Set it by the compass.', out('You turn the dials one by one, in the compass rose\'s order. On the fifth, a deep click, and a breath of cold air from below. It opens.', room('dg-treasure-dig-b'))),
    ch('Force it.', out('Your strongest Fighting-type puts its shoulder to it and the stone cracks. So does the roof. A cave-in, a roar of dust; when it clears, the way is open and one of your team is bruised and coughing.', hurt(0.2), room('dg-treasure-dig-b')), { requires: [anyType('fighting')] }),
    ch('Look at piece one again.', out('The torn corner. "...not for the Ch..." You turn it over. On the back, faint: "Not for the Champion. For whoever comes after." You set the dials. It opens. And you know whose this is.', flag('map-knew'), room('dg-treasure-dig-b'))),
  ]),
  sub('th-treasure', 'dg-treasure-dig-b', 'The Chest', 'A side room. A battered chest with iron corners. On top of it, under a stone, a note in a Champion\'s hand. "I won. It was lonely. I put my best things here for whoever came looking, because whoever came looking is curious, and that\'s the best kind of trainer. Take what you need. Leave a note for the next one."', [
    ch('Take everything.', out('Three things, wrapped in oilcloth, each one rare. You take them all.', any(...RARE_HELD), any(...RARE_HELD), any(...RARE_HELD), flag('map-took-all'), room('dg-treasure-dig-c'))),
    ch('Take one thing.', out('You take one thing, the one that seems most like yours, and close the lid on the rest. Someone else will come looking.', any(...RARE_HELD), flag('map-took-one'), room('dg-treasure-dig-c'))),
    ch('Leave a note.', out('You take one thing. Then you sit on the chest and write a note for whoever comes after you, the way they did. It takes a long time. You put it under the stone with theirs.', any(...RARE_HELD), flag('map-note'), room('dg-treasure-dig-c'))),
  ]),
  sub('th-treasure', 'dg-treasure-dig-c', 'Daylight', 'Daylight again, and the way out open. At the cave mouth, sitting on a rock with their hands round their knees, is an old trainer. You know the face. You saw it in bronze, younger.', [
    ch('It was yours?', out('Champion: "Was." They smile. "Now yours." They stand, stiffly, and shake your hand, and their grip is still strong.', flag('map-champion-met'))),
    ch('Thank you.', out('They nod, once, and look out at the view, and do not say anything. They do not need to.', flag('map-champion-met'))),
    ch('Why hide it?', out('Champion: "So I\'d have a reason to come back," they say, "and see who found it." They look at you for a long moment. "I\'m glad it was you."', flag('map-champion-met'))),
  ]),
];

// =====================================================================================================================
// SF24. THE LAST SHIFT. Four rooms. The foreman's ghost can't leave until the line finishes its last order.
// =====================================================================================================================
const FOUNDRY: Json[] = [
  {
    id: 'foundry-entrance',
    intro: 'A foundry abandoned mid-shift. The lights are on. Nobody is inside. The machines are still warm to the touch, and somewhere deep in the building something is ticking. By the door, a clocking-in board, forty cards in forty slots. Every card stamped in. None stamped out. The date on all of them is thirty years ago.',
    choices: [
      ch('Go in.', out('You go in. The door swings shut behind you, gently, like someone holding it.', flag('shift-in'), room('foundry-1'))),
      ch('Read the cards.', out('Forty names. You read them all. The last card, the foreman\'s, says JORAH, and has a note pinned to it in pencil: "Finish the Crestline order." You go in.', flag('shift-in'), flag('shift-read'), room('foundry-1'))),
      ch('Leave.', out('You leave. Behind you, the ticking goes on.')),
    ],
    remembers: [
      v('colony', [is('shift-colony')], {
        intro: 'The old foundry, dark now, and full of a soft metallic chiming. Klink, everywhere: on the beams, in the cold furnace, turning slowly in pairs on the conveyor. It is a nest. They watch you come in without fear.',
        hide: [0, 1, 2],
        add: [ch('Walk among them.', fight('The biggest of them, a Klinklang, rolls down from the rafters to see what you want.', wild({ species: ['klink', 'klang', 'klinklang'], lv: 1 }))), ch('Leave them be.', out('You leave them their foundry.'))],
      }),
    ],
  },
  {
    id: 'foundry-1',
    intro: 'A conveyor running with nothing on it. Three stations along it, a press, a welder, a sorter, each clanking, hungry, waiting for a part that is not there. The whole line shivers, as if it is impatient.',
    choices: [
      ch('Feed the press with a Steel-type.', out('Your Steel-type sets itself under the press and braces. The press comes down with a boom that shakes the floor, and stamps a part, perfect. The welder and the sorter catch up, and the line moves.', fr(4, { types: ['steel'] }), room('foundry-2')), { requires: [anyType('steel')] }),
      ch('Power the welder with an Electric-type.', out('Your Electric-type puts a paw to the welder\'s cable, and the welder roars blue. A part, welded. The press and the sorter shudder into time with it, and the line moves.', fr(4, { types: ['electric'] }), room('foundry-2')), { requires: [anyType('electric')] }),
      ch('Sort by hand. (a node)', fight('Slow, hot work, a part at a time. It takes a node. The machines don\'t like it: one Klink comes spinning out of the sorter at your head.', wild({ species: ['klink'], lv: 0 }), takeNode(1), room('foundry-2'))),
    ],
  },
  {
    id: 'foundry-2',
    intro: 'A furnace roaring in the dark, red light on the floor. In front of it stands a man in a flat cap and a leather apron, with his back to you. He turns round. You can see the furnace through him. Jorah: "You\'re late. Everyone\'s late." He looks past you at the door, at nobody. "Crestline order. Two hundred bells for the new tower. We were on the last one when the furnace cracked." He looks at his hands. "The lads got out. I stayed to shut it down. Then I suppose I just stayed."',
    choices: [
      ch('We\'ll finish it.', out('Jorah: "Good." He nods, and nods, as if he has been waiting thirty years to hear it. "Control room. One button."', flag('shift-finish'), room('foundry-final'))),
      ch('Your lads are fine.', out('Jorah: "...Are they?" His voice cracks. "All forty?"', flag('shift-told'), room('foundry-final')), { branches: [{ when: [is('shift-read')], text: 'Jorah: "...Are they? All forty?" You tell him what you saw by the door: every card punched in, none punched out, because nobody came back to punch out. They all got out. Every one. Jorah sits down on an anvil, and puts his face in his hands, and his shoulders shake.', effects: [flag('shift-told'), room('foundry-final')] }] }),
      ch('Shut it down.', out('Jorah: "Then it\'s over." He takes his cap off and turns it in his hands. "Fair enough."', flag('shift-shut'), room('foundry-final'))),
    ],
  },
  {
    id: 'foundry-final',
    intro: 'A control room, all dials and dust. One button, lit, in the middle of the panel. The whole foundry is waiting. Jorah stands at your shoulder. Jorah: "Press it and the last bell\'s cast." He looks at the button. "Or don\'t, and I\'ll go anyway, I think. I\'m tired."',
    choices: [
      ch('Finish the order.', out('You press it. Far below, the furnace roars once more, and the last bell is cast, and rings, once, through the whole building. Jorah walks to the door, and takes his card, and stamps it out. He tips his cap to you. Then he is gone. On the cooling floor below, there is a small bell, perfect, still warm: the Crestline Bell.', item('crestline-bell'), flag('shift-rested'), moment('You finished the last order, and the foreman stamped out after thirty years', 80))),
      ch('Shut the plant for good.', out('You throw the main switch. The lights go out one row at a time. The furnace goes cold. Jorah tips his cap to you in the dark and fades. A few days later, Klink move in, and the foundry chimes again, softly, with a different kind of work.', flag('shift-colony'), again('foundry-entrance'))),
    ],
    remembers: [
      v('told', [is('shift-told')], { notice: 'Jorah smiles before you touch anything. Jorah: "All forty," he says. "Good."' }),
      v('fog', [is('fog-named')], { notice: 'You have seen a bell like the one on the drawings before: on a guide in the fog, on the belt of a man named Halden. It was a Crestline bell.' }),
    ],
  },
];

// =====================================================================================================================
// SF25. THE EGG IN THE FIRE. Four rooms to the egg; then, for the rest of that region, rest stops ask you to keep it warm.
// =====================================================================================================================
const EMBER: Json[] = [
  {
    id: 'ember-vent-entrance',
    intro: 'A crack in the side of the mountain, glowing from within, the air above it shimmering. From somewhere deep inside, slow and huge, something is breathing. An old man sits on a camp stool by the crack with a notebook and a flask: a volcano watcher, Ignatz. Ignatz: "The old songs say the mountain lays an egg once a century." He sips from the flask. "The songs are mostly nonsense." Another sip. "Mostly."',
    choices: [
      ch('Go in.', out('You step into the heat.', flag('ember-in'), room('ember-vent-1'))),
      ch('Ask about the songs.', out('Ignatz: "The egg is the mountain\'s heart." He says it like a verse he has known all his life. "Whoever takes it must keep it warm, or the mountain\'s heart goes cold in the egg." You go in.', flag('ember-in'), flag('ember-song'), room('ember-vent-1'))),
      ch('Not today.', out('Ignatz nods, and writes something in his notebook. Ignatz: "It\'ll be here. It\'s been here a while."')),
    ],
  },
  {
    id: 'ember-vent-1',
    intro: 'A long slope of ash and warm gravel, embers drifting up from it like slow sparks. Wild Slugma and Numel graze on the heat, unbothered.',
    choices: [
      ch('Climb carefully. (two nodes)', out('Step by step, testing every stone. It takes two nodes, and nobody so much as singes a paw.', takeNode(2), room('ember-vent-2'))),
      ch('Climb fast. (a node)', out('You go straight up, fast, in a shower of hot gravel. It takes a node, and every one of your team that is not a Fire-type comes out of it with burned feet.', takeNode(1), { kind: 'damage', share: 0.1, who: 'party', except: ['fire'] }, room('ember-vent-2'))),
      ch('Ride a Numel.', out('Your Fire-type has a word with the nearest Numel, and the Numel kneels. It carries you up the slope at its own pace, which is slow, but sure, and very warm.', fr(4, { types: ['fire'] }), room('ember-vent-2')), { requires: [anyType('fire')] }),
    ],
  },
  {
    id: 'ember-vent-2',
    intro: 'A bridge of stone over a river of lava, the air above it bending with heat. Someone has already been this way: boot prints in the ash, and, dropped on the bridge, a badge with {evil}\'s mark. On the far side, a Grunt with a heat-proof case. Grunt: "The boss wants the egg." He sets the case down. "Back off."',
    choices: [
      ch('Battle.', fight('You fight on the bridge, with the lava below. Every miss sends something staggering to the edge.', safe(grunt('Vent Grunt', { size: 2, lv: 1 })), flag('ember-fought'), room('ember-vent-final'))),
      ch('Cross behind him. (a node)', out('You wait for the heat-haze and slip past behind him, and it takes a node of creeping. But he is quicker than he looks: he reaches the egg first.', takeNode(1), flag('ember-race'), room('ember-vent-final'))),
      ch('Warn him about the mountain.', out('You tell him the old song. The heart of the mountain. Keep it warm, or it goes cold. He looks at the lava, and at the case in his hand, and goes very pale, and leaves without another word.', flag('ember-warned'), room('ember-vent-final')), { requires: [is('ember-song')] }),
    ],
  },
  {
    id: 'ember-vent-final',
    intro: 'A chamber at the mountain\'s heart. A pool of fire, still as water, and in the middle of it a single egg, smouldering, the shell cracked with orange light. Behind it, in the dark, a huge shape with red eyes: Heatran. It does not move. It is watching your hands.',
    choices: [
      ch('Take the egg.', out('You reach into the fire, and the fire does not burn you. The egg is heavy and very warm. Heatran watches you lift it out. Then it closes its eyes, and lets you go.', egg({ species: ['larvesta'], left: 3, unit: 'stage' }), flagAt('ember-egg'), flag('ember-egg'), moment('Heatran let you carry the mountain\'s egg out of the fire', 80))),
      ch('Leave it.', out('You do not reach for it. Heatran blinks, slowly, the way a cat does to someone it trusts. The pool of fire flares, once, warm on your face.', flag('ember-left'), flag('sign-heatran'))),
      ch('Bow to Heatran.', out('You bow, low. Heatran rumbles, a sound you feel in your ribs. When you straighten, the egg has rolled to the edge of the pool, toward you. You lift it out.', egg({ species: ['larvesta'], left: 3, unit: 'stage' }), flagAt('ember-egg'), flag('ember-egg'), flag('ember-bowed'), flag('sign-heatran'), moment('You bowed to Heatran, and the mountain gave you its egg', 85))),
    ],
    remembers: [
      v('race', [is('ember-race')], {
        intro: 'A chamber at the mountain\'s heart, a pool of fire, and the Grunt already standing in it up to his ankles, holding the egg against his chest. It is burning him. His face is white and wet, and he is not letting go. Behind him, in the dark, Heatran is watching.',
        hide: [0, 1, 2],
        add: [
          ch('Take it from him.', fight('He will not give it up. He fights you one-handed with the egg in the other.', safe(grunt('Vent Grunt', { size: 2, lv: 1, win: [egg({ species: ['larvesta'], left: 3, unit: 'stage' }), flagAt('ember-egg'), flag('ember-egg')] })))),
          ch('Help him put it down.', out('You talk to him, quietly, until his hands open. You take the egg; it does not burn you. He looks at his palms, and at you, and says "thank you" in a very small voice, and runs.', egg({ species: ['larvesta'], left: 3, unit: 'stage' }), flagAt('ember-egg'), flag('ember-egg'), flag('ember-grunt-helped'))),
        ],
      }),
    ],
  },
  sub('ember-vent-entrance', 'ember-egg-warm', 'Keep It Warm', 'A rest stop. The mountain\'s egg is in your pack, and it is a little cooler than it was this morning. You remember the song.', [
    ch('Warm it by your Fire-type.', out('Your Fire-type curls round the egg all night without being asked, and in the morning the shell is glowing again.', { kind: 'eggWarm', steps: 1, friendship: 20 }, flag('ember-warm'), again('ember-egg-warm')), { requires: [anyType('fire')] }),
    ch('Build a campfire.', out('You build the fire high and sit up with the egg by it, turning it now and then, until you fall asleep against your pack.', { kind: 'eggWarm', steps: 1, friendship: 10 }, flag('ember-warm'), again('ember-egg-warm'))),
    ch('Not tonight.', out('You are too tired. The egg sits cold in your pack all night, and in the morning it is very quiet.', flag('ember-cold'), again('ember-egg-warm'))),
  ], { room: false, stop: 'rest', requires: [is('ember-egg'), flagThisRegion('ember-egg')] }),
];

// =====================================================================================================================
// SF26. THE COURIER'S EGG. A smuggling ring hunts whoever carries the egg; three ambushes and it gives up.
// =====================================================================================================================
const TWELVE = ['riolu', 'deino', 'larvitar', 'gible', 'axew', 'goomy', 'jangmo-o', 'dreepy', 'frigibax', 'bagon', 'beldum', 'dratini'];
const ring = (o: { win?: Json[]; doubles?: boolean } = {}): Json => safe(trainer('Ring Men', { cls: 'roughneck', size: 2, lv: 1, ...(o.doubles ? { format: 'doubles' } : {}), win: o.win ?? [] }));
const COURIER: Json[] = [
  {
    id: 'hold-the-egg',
    intro: 'A crowded market, everyone shouting prices. A harried stranger pushes through the crowd straight at you and thrusts a warm egg into your arms. Stranger: "Please! Five minutes! Hold it!" They are gone into the crowd before you can say anything at all. Five minutes pass. Ten. Then two men in matching grey coats walk slowly through the market, looking at everyone\'s hands.',
    choices: [
      ch('Hide the egg.', out('You put the egg inside your jacket and buy a cabbage you do not want, very slowly. The men pass. One of them looks at you a moment too long. Then they are gone.', flag('courier-hid'), flag('courier-egg'), soon('world-egg-delivery', 2))),
      ch('Wait for the stranger.', fight('You stand where you are. The men see the egg. Man: "That\'s ours." They do not wait for an answer.', ring({ doubles: true }), flag('courier-seen'), flag('courier-egg'), soon('world-egg-delivery', 2))),
      ch('Ask the men what they want.', fight('Man: "Lost property. Ours." They reach for it. You step back. They stop reaching and start fighting.', ring({ doubles: true }), flag('courier-seen'), flag('courier-egg'), soon('world-egg-delivery', 2))),
    ],
  },
  {
    id: 'world-egg-delivery', callback: true, requires: [is('courier-egg'), not('courier-choice')],
    intro: 'A side street, quiet. The stranger from the market is there, out of breath, leaning on a wall. Sorrel-Jay: "You kept it." They close their eyes. "Thank you." Then, fast: "I can\'t keep running with it. Please. Keep it safe. I have to run." They look at the egg. "It\'s not mine. It\'s not theirs either. It was stolen from a lab. I was supposed to deliver it to the ring\'s buyer. I couldn\'t."',
    choices: [
      ch('I\'ll keep it.', out('Sorrel-Jay grips your hand, once, hard, and is gone. The egg is yours to keep safe now. So is the ring\'s attention.', egg({ species: TWELVE, left: 4, unit: 'stage' }), flag('courier-choice'), flag('courier-kept'), flag('courier-hunted'), soon('courier-ambush', 2))),
      ch('Take it to Officer Jenny.', out('Officer Jenny takes the egg in both hands like something precious, and writes a long report, and puts it in a locked incubator marked EVIDENCE. Sorrel-Jay is cleared. The hunt ends that afternoon. Jenny: "It\'ll go back to its lab. You\'ll hear."', flag('courier-choice'), flag('courier-jenny'), flagAt('courier-jenny'), { kind: 'evil', heat: -1 })),
      ch('Run with me.', out('Sorrel-Jay stares at you. Then laughs, shakily. Sorrel-Jay: "Okay. Okay. Together." The two of you carry it between you, and the ring hunts you both.', egg({ species: TWELVE, left: 4, unit: 'stage' }), flag('courier-choice'), flag('courier-ran'), flag('courier-hunted'), flagAt('courier-ran'), soon('courier-ambush', 2))),
    ],
  },
  sub('hold-the-egg', 'courier-ambush', 'The Ring', 'Grey coats in the road ahead, and grey coats behind. The ring has found you again. Man: "The egg."', [
    ch('No.', fight('It is a hard fight in a narrow place.', ring({ win: [flag('courier-ambushed'), soon('courier-ambush', 3)] }), flag('courier-ambush-seen'))),
  ], {
    callback: true, requires: [is('courier-hunted'), not('courier-free'), { kind: 'flag', key: 'courier-ambushed', atLeast: 0, atMost: 2 }],
    remembers: [
      v('last', [is('courier-ambushed', 2)], { notice: 'The third time. You can see it in their faces: they are tired of this too.', hide: [0], add: [ch('No.', fight('One more fight. When it is over, the leader of them spits in the road and pulls his coat round him. Man: "Keep it, then." They go, and do not come back.', ring({ win: [flag('courier-ambushed'), flag('courier-free')] })))] }),
      v('ledger', [is('heist-ledger-kept'), is('courier-ambushed', 1)], { notice: 'The ring\'s buyer is named in the ledger you kept from the heist. When you say the name out loud, the men in grey coats stop and look at each other.', hide: [0], add: [ch('Say the name again.', out('They go, fast, without the egg. They will not be back.', flag('courier-free')))] }),
      v('ran', [is('courier-ran')], { notice: 'Sorrel-Jay is at your shoulder, and takes the other side of the road.', hide: [0], add: [ch('Together.', fight('Side by side, against both of them.', ring({ doubles: true, win: [flag('courier-ambushed'), soon('courier-ambush', 3)] })))] }),
    ],
  }),
  sub('hold-the-egg', 'courier-goodbye', 'Sorrel-Jay Turns Themselves In', 'The end of the region, and a police station with a blue lamp over the door. Sorrel-Jay stops on the step. Sorrel-Jay: "This is where I get off." They give you a Smoke Ball. "For running. You won\'t need it. I did."', [
    ch('I\'ll visit.', out('Sorrel-Jay: "You\'d better." They go in. Through the window you see Officer Jenny stand up, and take their hand, and not let go of it.', item('smoke-ball'), flag('courier-free'), flag('courier-ran-done'))),
  ], { callback: true, requires: [is('courier-ran'), later('courier-ran', { regions: 1 }), not('courier-ran-done')] }),
  sub('hold-the-egg', 'courier-lab-gift', 'A Letter from the Lab', 'A letter catches up with you, forwarded twice. A lab\'s letterhead. "The egg you gave Officer Jenny came home to us. Thank you. We have sent you another, from our own nest, to say so." In the parcel, wrapped in straw, a warm egg.', [
    ch('Open the parcel.', out('The egg is warm, and moves a little when you hold it.', egg({ left: 3, unit: 'stage' }), flag('courier-lab-thanks'))),
  ], {
    callback: true, requires: [is('courier-jenny'), later('courier-jenny', { regions: 1 }), not('courier-lab-thanks')],
    remembers: [v('mabe', [is('courier-lab')], { notice: 'There is a second page, from Dr. Mabe, the scientist you untied. "The hatchling is well. We named it after you. I hope you don\'t mind."' })],
  }),
  {
    id: 'vt-stolen-egg-lab',
    intro: 'A lab full of incubators, half of them empty and dark. On a bench, one egg in a villain\'s case, tagged STOLEN in red. In the corner, a scientist tied to a chair, gagged, eyes wide. On the wall above her, pinned up like a shopping list: the Smuggling Ring\'s stolen list. Twelve species, eleven of them crossed out.',
    choices: [
      ch('Free the scientist.', out('You cut her loose. She pulls the gag off and does not waste a breath. Dr. Mabe: "They took eleven. That one\'s the twelfth." She points at the case. "Please."', flag('courier-lab'), { kind: 'evil', heat: -1 })),
      ch('Take the case.', out('You take the case. A second egg, warm and stolen, now yours to keep safe. If the ring is hunting you, it hunts you twice as hard now.', egg({ species: TWELVE, left: 4, unit: 'stage' }), flag('courier-second'), flag('courier-hunted'), soon('courier-ambush', 2))),
      ch('Read the list.', out('Riolu, Deino, Larvitar, Gible, Axew, Goomy, Jangmo-o, Dreepy, Frigibax, Bagon, Beldum, Dratini. Eleven crossed out. You know now what the courier\'s egg could hatch into, and you know how much someone wanted it.', flag('courier-list'))),
    ],
  },
];

export const EVENTS: Json[] = [...MAP, ...FOUNDRY, ...EMBER, ...COURIER];
