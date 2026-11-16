// Catalog Overhaul Pack: STORY_FAMILIES_4.md, part one. SF19 The Village That Repeats, SF20 The Nobody, SF21 The Starter's
// Roots, SF22 The Cooking Circuit. Build: npm run co:build -- families-a-6. Run memory is same-run only (Kice 2026-11-14).
import { br, ch, cure, fight, flag, flagAt, fr, heal, item, join, lose, out, $, room, stat, takeNode, trainer, wild, anyType, bondUp, type Json } from '../dsl.ts';
import { grunt, is, later, moment, not, safe, sub, temp, v } from './_fa.ts';

export const CATEGORY = 'families-a';
export const REMOVE: string[] = [];

const soon = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const starterIs = (type: string): Json => ({ kind: 'starter', type });

// =====================================================================================================================
// SF19. THE VILLAGE THAT REPEATS. Three noons, one node each. Breaking the loop means letting the cart tip.
// =====================================================================================================================
const NOON = 'The bell rings noon.';
const leaveLoop = (): Json => ch('Leave the village.', out('You walk out past the last house. Behind you, the bell rings noon again, and you know without looking that the apples are back in the basket. The village will still be noon if you come back.', flag('loop-left'), { kind: 'seeAgain', eventId: 'time-loop-village' }));

const LOOP: Json[] = [
  {
    id: 'time-loop-village',
    intro: 'A village square, bright and ordinary. The bell in the tower rings noon. A child drops a basket of apples. A cart loaded with barrels tips over at the corner with a crash that turns every head. In a doorway, a baker drops a tray of loaves. Apples roll to your feet. The child runs to pick them up. Nim: "Sorry! Sorry. I always drop them." She stops, an apple in each hand. "Always? I don\'t know why I said always." Then the bell rings noon again, and the apples are back in the basket, and Nim is at the top of the street, and it all happens again.',
    choices: [
      ch('Catch the basket. (a node)', out('You catch it. Nim stares at you, and at the basket, and at the apples all still in it. Then the cart tips anyway at the corner, barrels everywhere. ' + NOON + ' The basket is gone from your hands.', flag('loop-day1'), flag('loop-basket'), takeNode(1), room('time-loop-2'))),
      ch('Stop the cart. (a node)', out('You throw your weight against the cart and hold it, barely, your arms shaking. Behind you, a thud and a rolling: Nim has dropped the basket. ' + NOON, flag('loop-day1'), flag('loop-cart'), takeNode(1), room('time-loop-2'))),
      ch('Talk to the baker. (a node)', out('Baker Hesk: "Busy day," he says, bending for the loaves. "Every day\'s a busy day." He does not look up at you. He does not look up at anything. ' + NOON, flag('loop-day1'), takeNode(1), room('time-loop-2'))),
      leaveLoop(),
    ],
  },
  {
    id: 'time-loop-2',
    intro: 'Noon again. This time you know it before it happens: the cart will tip, the child will drop the basket, the baker will drop the tray. You can stop one of them. The other two will still happen. At the edge of the square, by the old oak, there is a green glimmer, like light through a leaf. When you look straight at it, it is gone.',
    choices: [
      ch('Stop all three at once. (a node)', out('You place your team: something strong of mind at the cart, something fast at the basket, anyone at all under the tray. On the stroke of noon they move together, and the barrels stay put, and the apples stay in, and the bread stays on the tray, and the whole square is still. Then the bell rings noon anyway.', flag('loop-all-stopped'), fr(3, 'party'), takeNode(1), room('time-loop-3'))),
      ch('Follow the green glimmer. (a node)', out('You go to the oak. Nothing. Only, in the moss at its roots, a tiny footprint, the shape of a leaf. ' + NOON, flag('loop-glimmer'), takeNode(1), room('time-loop-3'))),
      ch('Watch who notices. (a node)', out('You watch faces instead of hands. Nim never notices. The carter never notices. But just before the bell, the baker\'s eyes flick up to the tower. Only his. ' + NOON, flag('loop-baker-knows'), takeNode(1), room('time-loop-3'))),
      leaveLoop(),
    ],
  },
  {
    id: 'time-loop-3',
    intro: 'Noon. The baker looks up, and for the first time he meets your eyes, and holds them. Hesk: "I\'ve been waiting for you to ask." He sets the tray down on the step, very carefully. "Eleven years ago this noon, the cart tipped and hit my daughter. She lived. She limped all her life. She\'s grown and gone now." He looks at the oak. "I wished it hadn\'t happened. Out loud, by that oak. Something green heard me." He wipes his hands on his apron, over and over. "It\'s been noon ever since. I stop the cart every time. It doesn\'t help. It never happened, so it can\'t un-happen."',
    choices: [
      ch('Let the cart tip.', out('You stand back. The cart tips, and the barrels roll, into an empty street. Nobody is there. Nobody was ever there; it was only ever a memory, going round. And then the bell rings one o\'clock. The whole village breathes in, as if it has been holding its breath for eleven years. Hesk sits down on his step and puts his face in his hands. Later he bakes you bread with his own hands, and Nim gives you an apple, the best one, from the bottom of the basket.', heal(1), item('sitrus-berry'), flag('loop-broken'), moment('You let the cart tip, and the village heard one o\'clock for the first time in eleven years', 80))),
      ch('Keep stopping it.', out('You hold the cart again. Hesk watches you do it, and something in his face goes very tired and very grateful at once. Noon. The village stays where it is. You can leave, and come back, and it will be here.', flag('loop-kept'), { kind: 'seeAgain', eventId: 'time-loop-village' })),
      ch('Talk to the green thing.', out('You go to the oak and kneel by the leaf-print and say, quietly, that you know it is there. The air goes green. Celebi comes out of nothing, very small, and floats in front of Hesk. It looks very young, and very sorry.', flag('loop-celebi'), room('time-loop-celebi')), { requires: [is('loop-glimmer')] }),
    ],
    remembers: [
      v('knows', [is('loop-baker-knows')], { notice: 'Hesk: "You saw me look," he says. "Nobody\'s ever seen me look."' }),
      v('vale', [is('vale-freed')], { notice: 'Hesk: "A carter told me once about a drowned town that let its evening end," he says. "If they could."' }),
    ],
  },
  sub('time-loop-3', 'time-loop-celebi', 'The Green Thing', 'Celebi floats in front of Hesk, its little hands pressed together. Hesk looks at it for a long time. Hesk: "You did what I asked," he says. "That\'s all. You did what I asked."', [
    ch('Ask it to undo the wish.', out('Celebi closes its eyes. The green goes out of the air like a held breath let go. The cart tips into the empty street. The bell rings one o\'clock. Celebi turns to you and bows, very low, and is gone.', heal(1), item('sitrus-berry'), flag('loop-broken'), flag('sign-celebi'), moment('Celebi undid a wish in a village of one noon, and bowed to you', 85))),
    ch('Tell Hesk to let go.', out('Hesk nods slowly. He picks up the tray of loaves, and holds it out in front of him, and opens his hands. The bread falls. The bell rings one o\'clock. Celebi touches his cheek and is gone.', heal(1), item('sitrus-berry'), flag('loop-broken'), flag('sign-celebi'), moment('Hesk let the tray fall, and it was one o\'clock', 85))),
    ch('Let Hesk decide.', out('Hesk walks to the corner and stands there, and watches the cart tip into the empty street. He says his daughter\'s name, once, out loud. The bell rings one o\'clock. Celebi stays by him until it stops ringing.', heal(1), item('sitrus-berry'), flag('loop-broken'), flag('sign-celebi'), flag('loop-hesk-chose'), moment('Hesk chose to let it tip, and said his daughter\'s name', 85))),
  ]),
];

// =====================================================================================================================
// SF20. THE NOBODY. A quiet stranger's errand, kept secret for a region, turns out to be the Evil Team's defector.
// =====================================================================================================================
const NOBODY: Json[] = [
  {
    id: 'rk-hidden-quest',
    intro: 'A roadside, late afternoon. A quiet person in plain clothes is sitting on a milestone, and when you pass, they lift one hand, small, as if they do not want anyone else to see. Nell: "You look like you can keep a secret." Close up, their hands are rough and their eyes never stop moving. "I need something found. A brass key with a bird on the bow. Somewhere in this region." Lower: "Don\'t tell anyone you\'re looking. Not the police. Not your friends. Especially not anyone in a uniform."',
    choices: [
      ch('I\'ll find it.', out('Nell lets out a breath they seem to have been holding for weeks. Nell: "Thank you." They are gone before you can ask anything else.', flag('nobody-on'), soon('nobody-key', 4))),
      ch('Why the secret?', out('Nell: "Because if the wrong person hears, I\'m dead." A beat. "Sorry. That\'s dramatic. But true." They try to smile. It does not take.', flag('nobody-on'), flag('nobody-why'), soon('nobody-key', 4))),
      ch('No.', out('Nell nods, as if they expected it, and walks off down the road with their hands in their pockets. Later, on a team-held road, you hear a Grunt laughing to another: "They caught the quiet one."', flag('nobody-refused'))),
    ],
  },
  sub('rk-hidden-quest', 'nobody-key', 'The Brass Key', 'A back office in a team-held building, the door left open by someone in a hurry. A desk. In the top drawer, under a mess of forms, a brass key with a little bird on the bow. As your fingers close on it, a Grunt in the doorway behind you says, "Hey."', [
    ch('Battle the Grunt.', fight('He is more surprised than you are, and fights like it.', safe(grunt('Desk Grunt', { size: 2, lv: 1 })), flag('nobody-key'))),
    ch('Bribe him. (₽100)', out('You hold out ₽100. He looks at it, and at the key, and at the empty corridor. He takes it. Grunt: "I never saw you. I never see anything. It\'s the only good thing about this job."', $(-100), flag('nobody-key')), { requires: [{ kind: 'money', atLeast: 100 }] }),
    ch('Run.', out('You run, with the key in your fist, down two corridors and out a fire door into the rain. Behind you, a whistle, and boots, and then nothing.', flag('nobody-key'))),
  ], { callback: true, requires: [is('nobody-on'), not('nobody-key')] }),
  {
    id: 'rk-hidden-quest-payoff', callback: true, requires: [is('nobody-key'), later('nobody-key', { stages: 1 }), not('nobody-done')],
    intro: 'The next crossing. Nell is waiting, grinning like someone who has not grinned in a long time. Nell: "You kept your eyes open. Here\'s what I promised." They take the key and unlock a small case: inside, folded, an Admin\'s uniform with {evil}\'s mark on it, and a Poké Ball. Nell: "I\'m leaving them. That was my locker key. My Pokémon\'s in there. They took it as insurance." They hold the Ball against their chest. "I\'ve got a boat at midnight. I need one more thing: someone to stand at the dock and look like they\'re waiting for someone else."',
    choices: [
      ch('I\'ll stand at the dock.', fight('A night on the dock, collar up, watching the water. At a quarter to twelve two Grunts come down the steps, looking at faces. You do not let them get as far as Nell.', safe(grunt('Dock Grunts', { size: 2, lv: 1, format: 'doubles' })), flag('nobody-escaped'), flag('nobody-done'), join({ types: ['dark'] }), moment('You stood on a dock at midnight so Nell could sail away', 75))),
      ch('Come to the police.', out('Nell: "They\'ll put me in a cell and the team will reach me there." They look at you for a long time. "...But you asked." In the morning, Nell walks into the station on their own. Officer Jenny comes out to meet them, and puts a coat round their shoulders.', flag('nobody-police'), flag('nobody-done'), { kind: 'evil', heat: -1 })),
      ch('Who were you, in there?', fight('Nell: "Third in command." They say it to the water. "I planned {evil}\'s operation in this region. I\'m sorry." Then they give you the plan, every step of it, and the one place it is weak. At midnight two Grunts come down the dock steps, and you are waiting for them.', safe(grunt('Dock Grunts', { size: 2, lv: 1, format: 'doubles' })), flag('nobody-escaped'), flag('nobody-confessed'), flag('nobody-done'), { kind: 'evil', heat: -2, mark: 'plan-seen' })),
    ],
    remembers: [
      v('told', [is('nobody-told')], {
        notice: 'You told someone. Somewhere along the road, you told someone, and it got back. When you reach the dock at midnight, the Admin is already there.',
        hide: [0, 2],
        add: [ch('Stand between them and Nell.', fight('The Admin does not say anything at all. A hard fight, on wet boards, in the dark.', safe({ ...trainer('The Admin', { cls: 'ace-trainer', size: 4, lv: 3, win: [flag('nobody-escaped'), join({ types: ['dark'] })] }), evil: 'executive' }, flag('nobody-caught')), flag('nobody-done')))],
      }),
      v('dilly', [is('grunt-dilly-out')], { notice: 'Nell: "I heard someone helped a rookie out. A kid with a Wooper." They look at you sideways. "I thought it might be you."' }),
    ],
  },
];

// =====================================================================================================================
// SF21. THE STARTER'S ROOTS. Five places, keyed to the starter's type; the starter's own place is its home, the others are
// visits. The home is seen again two regions after the first visit.
// =====================================================================================================================
const OWN = 'roots-own';
const ROOTS: Json[] = [
  {
    id: 'starter-ember-shrine', requires: [not('roots-shrine')],
    intro: 'A small stone shrine on a hill, the stone scorched black in long sweeping marks: the shapes of tails. Fire-types have prayed here a long time. When your starter steps onto the hilltop, the stone glows where it stands. The shrine keeper, an old woman called Ama, gets up off her stool. Ama: "Not one of ours." She smiles. "But it\'s welcome. Fire\'s for warming strangers too."',
    choices: [
      ch('Let it sit.', out('Your starter walks to the oldest tail-mark, the biggest, and sits in it. It fits. It stays there a long time with its eyes half closed.', bondUp(2, 'starter'), flag('roots-shrine'))),
      ch('Ask about the scorch marks.', out('Ama: "Each one\'s a starter that came home." She points. "That big one\'s from three hundred years ago. Nobody remembers its trainer\'s name. Everybody remembers it."', flag('roots-shrine'))),
      ch('Leave an offering. (a Berry)', out('You put a Berry on the warm stone. It is gone in a curl of smoke. Ama nods, satisfied, and puts a lump of Charcoal in your hand without a word.', lose('oran-berry'), item('charcoal'), flag('roots-shrine')), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
    ],
    remembers: [
      v('fire', [starterIs('fire')], { intro: 'A small stone shrine on a hill, the stone scorched black in long sweeping marks: the shapes of tails. When your starter steps onto the hilltop, the stone glows where it stands, brighter than the sun. The keeper, an old woman called Ama, gets up off her stool slowly. Ama: "Oh. You\'ve brought one home." She looks at your starter. "Every fire-born comes here once. Most don\'t know why. Let it sit."', hide: [0], add: [ch('Let it sit.', out('Your starter walks to the oldest tail-mark and sits in it. It fits as if it was made for it. It stays there with its eyes closed until the sun moves.', bondUp(2, 'starter'), flag('roots-shrine'), flagAt(OWN)))] }),
      v('fighting', [starterIs('fighting')], { intro: 'A small stone shrine on a hill, scorched in the shapes of tails. Ama the keeper looks at your starter. Ama: "Fire in the heart, if not in the tail. That counts here. You\'ve brought one home. Let it sit."', hide: [0], add: [ch('Let it sit.', out('Your starter sits in the oldest tail-mark. It fits better than it should.', bondUp(2, 'starter'), flag('roots-shrine'), flagAt(OWN)))] }),
      v('dark', [starterIs('dark')], { intro: 'A small stone shrine on a hill, scorched in the shapes of tails, warm even at dusk. Ama the keeper looks at your starter. Ama: "Night-born. The night and the fire have always been friends. You\'ve brought one home. Let it sit."', hide: [0], add: [ch('Let it sit.', out('Your starter sits in the oldest tail-mark, in its shadow. It fits.', bondUp(2, 'starter'), flag('roots-shrine'), flagAt(OWN)))] }),
    ],
  },
  {
    id: 'starter-first-pal', requires: [not('roots-nest')],
    intro: 'A hollow under a hedge, lined with soft fur. Small toys lie in it, worn smooth: a stick, a pebble, a ribbon. Your starter sniffs the ribbon. A breeder passing with a basket stops. Hollen: "That\'s where they\'re born round here. Normal-types, Eevee, the soft ones." She smiles at your starter. "Not one of them, is it. It\'s welcome all the same."',
    choices: [
      ch('Sit with it.', out('You sit by the nest. Your starter curls up in it, too big, and does not care. You rest there until the light changes.', heal(1), bondUp(2, 'starter'), flag('roots-nest')), { branches: [br([{ kind: 'mentor', id: 'fenwick-eon' }], 'You sit by the nest, and Fenwick Eon sits down beside you without a word. Fenwick: "My Eevee was born here." He reaches out and touches the ribbon. You rest there until the light changes.', heal(1), bondUp(2, 'starter'), flag('roots-nest'))] }),
      ch('Take the ribbon.', out('Your starter takes the ribbon in its mouth and will not give it up. It wears it for the rest of the run, mostly on one ear.', fr(5, 'starter'), flag('roots-nest'), flag('roots-ribbon'))),
      ch('Leave it be.', out('You walk on. After a moment, your starter follows, looking back once.', flag('roots-nest'))),
    ],
    remembers: [
      v('normal', [starterIs('normal')], { intro: 'A hollow under a hedge, lined with soft fur. A stick, a pebble, a ribbon. Your starter sniffs the ribbon, and then it sits down in the nest and will not get up. A breeder passing stops. Hollen: "That\'s where they\'re born round here. Normal-types, Eevee, the soft ones." She sets down her basket. "They always come back to the nest once."', hide: [0], add: [ch('Sit with it.', out('You sit by the nest while your starter lies in it with its chin on the ribbon. You rest there until the light changes.', heal(1), bondUp(2, 'starter'), flag('roots-nest'), flagAt(OWN)), { branches: [br([{ kind: 'mentor', id: 'fenwick-eon' }], 'You sit by the nest, and Fenwick Eon sits down beside you. Fenwick: "My Eevee was born here." You rest there until the light changes.', heal(1), bondUp(2, 'starter'), flag('roots-nest'), flagAt(OWN))] })] }),
      v('fairy', [starterIs('fairy')], { intro: 'A hollow under a hedge, lined with soft fur, with a stick, a pebble, a ribbon. Your starter sits down in it at once. Hollen the breeder stops. Hollen: "The soft ones are born here. That one\'s soft right through." She smiles. "They always come back once."', hide: [0], add: [ch('Sit with it.', out('You rest by the nest until the light changes.', heal(1), bondUp(2, 'starter'), flag('roots-nest'), flagAt(OWN)))] }),
      v('psychic', [starterIs('psychic')], { intro: 'A hollow under a hedge, lined with soft fur. Your starter stops at the edge of it and stares, as if it can hear something you can\'t. Hollen the breeder stops. Hollen: "Funny. The thinking ones always know this place too. Like they remember it from before." She smiles. "They always come back once."', hide: [0], add: [ch('Sit with it.', out('You rest by the nest until the light changes.', heal(1), bondUp(2, 'starter'), flag('roots-nest'), flagAt(OWN)))] }),
    ],
  },
  {
    id: 'starter-old-orchard', requires: [not('roots-orchard')],
    intro: 'An orchard of very old trees, gnarled and silver-barked, and as your starter walks between the rows, every tree leans a little toward it, the way leaves turn to the sun. The orchard keeper, Brae, leans on her rake. Brae: "The trees know their own. That one\'s not, quite." She shrugs. "They\'re polite to guests."',
    choices: [
      ch('Let it plant something.', out('Your starter digs a hole with great seriousness and puts a seed in it and pats the earth down. Brae marks the place with a stick. Brae: "I\'ll water it." The trees rustle.', bondUp(1, 'starter'), flag('roots-orchard'), flag('roots-planted'))),
      ch('Pick a fruit.', out('Brae lets you pick two. They are Sitrus Berries, heavy and gold.', item('sitrus-berry', 2), flag('roots-orchard'))),
      ch('Ask Brae about the trees.', out('Brae: "The oldest one\'s from a Bulbasaur that came here and never left." She pats the trunk of the biggest tree. "It\'s still here, in a way."', flag('roots-orchard')), { branches: [br([is('farmer-end')], 'Brae: "The oldest one\'s from a Bulbasaur that came here and never left." She squints at you. "Old Abner\'s seeds came from here, you know. The farmer who forgets. I gave them to him myself, forty years ago."', flag('roots-orchard'))] }),
    ],
    remembers: [
      v('grass', [starterIs('grass')], { intro: 'An orchard of very old trees, and as your starter walks between the rows, every tree turns to face it, all at once, every leaf. Brae the keeper leans on her rake and laughs. Brae: "Grass-born. The trees know their own. They planted half of this."', hide: [0], add: [ch('Let it plant something.', out('Your starter plants a seed in a row of its own kind\'s trees, and pats the earth, and the trees bow over it.', bondUp(2, 'starter'), flag('roots-orchard'), flag('roots-planted'), flagAt(OWN)))] }),
      v('ground', [starterIs('ground')], { intro: 'An old orchard. Your starter puts its feet in the earth between the roots and goes very still. Brae: "Earth-born. The roots know you. Everything here grew out of ground like yours."', hide: [0], add: [ch('Let it plant something.', out('It plants a seed deep, the way only an earth-born would.', bondUp(2, 'starter'), flag('roots-orchard'), flag('roots-planted'), flagAt(OWN)))] }),
      v('rock', [starterIs('rock')], { intro: 'An old orchard on stony ground. The trees lean toward your starter. Brae: "Stone-born. Every one of these trees grew in a crack in a rock like you. You\'re home."', hide: [0], add: [ch('Let it plant something.', out('It plants a seed in a crack between two stones.', bondUp(2, 'starter'), flag('roots-orchard'), flag('roots-planted'), flagAt(OWN)))] }),
    ],
  },
  {
    id: 'starter-power-hum', requires: [not('roots-pylon')],
    intro: 'A pylon hums in a field, tall and old, its steel gone brown. Every wild Electric-type for a mile is standing in the grass, facing it, quite still. Your starter\'s fur, or skin, or leaves, lifts and sparks. A line worker on a ladder looks down. Odalys: "They come once a year. Like a pilgrimage. It\'s the oldest pylon in the region." She pats the steel. "It was a lightning tree first."',
    choices: [
      ch('Let it charge.', out('Your starter walks up to the pylon and touches it with its nose. A crack, a smell like rain. It comes back standing taller, and quicker on its feet.', stat('spe', { who: 'starter' }), flag('roots-pylon'))),
      ch('Ask about the tree.', out('Odalys: "Struck forty times. Never fell." She climbs down. "Then they built the pylon around it so it wouldn\'t have to stand on its own."', flag('roots-pylon'))),
      ch('Join the circle.', out('You and your starter step into the field. The wild Electric-types shift over to make room, and your starter stands among them facing the pylon, humming.', bondUp(2, 'starter'), flag('roots-pylon'))),
    ],
    remembers: [
      v('electric', [starterIs('electric')], { intro: 'A pylon hums in a field, tall and old. Every wild Electric-type for a mile stands facing it. When your starter comes over the rise, every one of them turns round to look at it. Odalys on her ladder: "Oh," she says. "One of theirs. They come once a year. It was a lightning tree first."', hide: [0], add: [ch('Let it charge.', out('Your starter walks up to the pylon and puts both hands on it, and lights up like a struck tree. For the rest of the region its electric moves hit harder.', { kind: 'tempEffect', label: 'The pylon\'s charge: Electric moves +10% this region', effects: [{ kind: 'statMultiplier', stat: 'spa', type: 'electric', value: 1.1 }, { kind: 'statMultiplier', stat: 'atk', type: 'electric', value: 1.1 }], until: 'region' }, flag('roots-pylon'), flagAt(OWN)))] }),
      v('steel', [starterIs('steel')], { intro: 'A pylon hums in a field, tall and old, and your steel-born starter walks straight to it and leans its whole side against it, as if it is greeting family. Odalys on her ladder: "Huh. The steel ones always do that. It was a lightning tree first, then steel. You\'re home."', hide: [0], add: [ch('Let it charge.', out('It stands against the pylon until it is humming too.', stat('spe', { who: 'starter' }), bondUp(2, 'starter'), flag('roots-pylon'), flagAt(OWN)))] }),
    ],
  },
  {
    id: 'starter-tide-pool', requires: [not('roots-pool')],
    intro: 'A still pool by the sea, clear to the bottom. It reflects your starter perfectly. Something below the water is curious about it. A Wishiwashi rises, looks, and sinks. A diver sitting on the rocks with her mask pushed up: Marisol: "It\'s a nursery. Everything water-born starts in a pool like this." She looks at your starter. "Visitors welcome."',
    choices: [
      ch('Let it swim.', out('Your starter wades in and swims with the little one in slow circles until it is tired and happy.', bondUp(2, 'starter'), flag('roots-pool'))),
      ch('Look closer.', out('You lie on the warm rock and look. In every crack in the rocks below, eggs, hundreds of them, glowing faintly.', flag('roots-pool'))),
      ch('Call the other one up.', fight('It comes up, and looks at your starter, and decides to see what you are made of.', wild({ species: ['wishiwashi'] }), flag('roots-pool'))),
    ],
    remembers: [
      v('water', [starterIs('water')], { intro: 'A still pool by the sea. It reflects your starter, and then, below the reflection, another face rises: a wild one of your starter\'s own kind, small, looking up at it. Marisol the diver sits up on the rocks. Marisol: "It\'s a nursery. Everything water-born starts in a pool like this." She smiles. "Yours started in one too."', hide: [0], add: [ch('Let it swim.', out('Your starter dives in, and the two of them swim together, round and round, until the sun goes.', bondUp(2, 'starter'), flag('roots-pool'), flagAt(OWN)))] }),
      v('ice', [starterIs('ice')], { intro: 'A cold still pool by the sea, a skin of ice at its edges. Your starter breathes on it and the ice spreads in ferns. Marisol the diver: "The cold ones start here too, in the winter. You\'ve come home."', hide: [0], add: [ch('Let it swim.', out('It swims under the ice, a shadow, happy.', bondUp(2, 'starter'), flag('roots-pool'), flagAt(OWN)))] }),
    ],
  },
  sub('starter-ember-shrine', 'starter-home', 'Home', 'Your starter\'s home again, late in the run. This time others of its kind are there, a whole family of them, and they come out to see it. An old one, grey round the face, comes slowly to the front and touches noses with your starter, and stays there for a long moment. Then your starter looks at them. Then it looks at you.', [
    ch('Stay a while. I\'ll wait.', out('You sit down and wait, all afternoon. Your starter goes with them, into the place it came from, and you hear it calling and being called back. When the light goes it comes back to you on its own, and leans against you, and sleeps.', heal(1), bondUp(3, 'starter'), flag('roots-home-visited'), moment('You waited while your starter went home', 80))),
    ch('You can stay, if you want.', out('Your starter looks at its family, and at you, for a long time. Then it comes back to you. It was always going to.', bondUp(3, 'starter'), flag('roots-home-choice'), moment('You told your starter it could stay home, and it came back to you', 85)), { branches: [br([{ kind: 'bondLevel', atLeast: 5, who: 'starter' }], 'Your starter looks at its family, and at you. Then it walks back to your side without hesitating, and the old one nods, as if that is the right answer.', bondUp(2, 'starter'), flag('roots-home-choice'), moment('You told your starter it could stay home, and it came back to you', 85))] }),
    ch('Come on. We\'re not done.', out('It follows. At the top of the path, it looks back once, a long look, and then it does not look back again.', flag('roots-home-onward'))),
  ], {
    callback: true, requires: [is(OWN), later(OWN, { regions: 2 }), not('roots-home')],
    remembers: [
      v('all', [is('roots-shrine'), is('roots-nest'), is('roots-orchard'), is('roots-pylon'), is('roots-pool')], { notice: 'The old one has been watching your starter\'s face, and sniffs it, long and slow, and you realise it can smell every place you have been: the shrine, the nest, the orchard, the pylon, the pool. It touches each of your starter\'s cheeks in turn. Your starter stands taller after, all over.', add: [ch('Let it take the marks.', out('Five small marks, one for each place, that only you will ever notice. Your starter is a little stronger in every way.', stat('all', { who: 'starter' }), flag('roots-home'), bondUp(2, 'starter')))] }),
    ],
  }),
];
// Every home scene (a `roots-*` flag) also marks the home as seen once the starter-home scene is played.
for (const c of (ROOTS[ROOTS.length - 1]!.choices as Json[])) ((c.success as Json).effects as Json[]).push(flag('roots-home'));
for (const b of (ROOTS[ROOTS.length - 1]!.choices as Json[]).flatMap((c) => (c.branches as Json[] | undefined) ?? [])) (b.effects as Json[]).push(flag('roots-home'));

// =====================================================================================================================
// SF22. THE COOKING CIRCUIT. Recipes are cooked at rest stops (one dish per rest, two with the Golden Spoon): `cook-at-rest`.
// Wins count toward the final (three).
// =====================================================================================================================
const WIN = flag('cook-wins');
const RECIPES: Json[] = [
  {
    id: 'chef-cook-together',
    intro: 'A street kitchen under a striped awning, everything hissing. A chef in a bright headscarf has two pans going and is holding out a third. Chef Tolu: "Fast hands, steady heart. Can you keep up?" She does not wait for an answer. "Two pans, one dish. You fry, I sauce."',
    choices: [
      ch('Fry.', out('You fry. You burn the first lot and Tolu laughs and throws it to a Lickitung that has been waiting for exactly this. The second lot is perfect. Tolu teaches you Pan-Fried Oran.', flag('recipe-oran'), flag('recipe-known'), flag('cook-tolu'), WIN), { chance: 0.75, fail: out('You fry. You burn it twice, and Tolu laughs, and sends you off with a full stomach and no recipe. Tolu: "Come back with steadier hands."', heal(0.5), flag('cook-tolu')) }),
      ch('Sauce.', out('You stir. Tolu shouts times at you like a drill sergeant. It comes together all at once, glossy and bright, and she kisses her fingers. Tolu teaches you Pan-Fried Oran.', flag('recipe-oran'), flag('recipe-known'), flag('cook-tolu'), WIN), { chance: 0.75, fail: out('The sauce splits. Tolu sighs and fixes it in two seconds with a whisk. Tolu: "Next time, darling." You eat well. You learn nothing.', heal(0.5), flag('cook-tolu')) }),
      ch('Let my Pokémon help.', out('Your Fire-type takes the heat under both pans and holds it exactly, without being told, the whole time. Tolu stares. Tolu: "Can I hire it?" She teaches you Pan-Fried Oran, and gives your Fire-type the burnt bits, which it loves.', flag('recipe-oran'), flag('recipe-known'), flag('cook-tolu'), WIN, fr(4, { types: ['fire'] })), { requires: [anyType('fire')] }),
    ],
  },
  {
    id: 'cooking-contest',
    intro: 'A big tent, long tables, a crowd. A judge in a very tall hat moves down the line tasting dishes with a tiny spoon. Judge Pomfrey: "A trainer!" He beams at you. "Cook something your team would eat." He holds up a finger. "Not something you\'d eat. Something they would. Know your team."',
    choices: [
      ch('Spicy.', out('Spicy. Your team crowds round the bowl before it has even cooled. Pomfrey watches them and makes a note. Pomfrey: "Team Stew," he says. "You know your team. Here." He writes it down for you.', flag('recipe-stew'), flag('recipe-team-stew'), flag('recipe-known'), flag('cook-contest'), WIN), { chance: 0.6, fail: out('Spicy. Two of your team love it. The others sniff it and walk off. Pomfrey pats your shoulder. Pomfrey: "Close. Know them better."', fr(2, 'party'), flag('cook-contest')) }),
      ch('Sweet.', out('Sweet. Your team eats in a ring, very fast, then looks at you for more. Pomfrey: "Team Stew," he says, delighted, and writes it down for you.', flag('recipe-stew'), flag('recipe-team-stew'), flag('recipe-known'), flag('cook-contest'), WIN), { chance: 0.6, fail: out('Sweet. Some of your team love it. Some look at you as if you have never met them. Pomfrey: "Close. Know them better."', fr(2, 'party'), flag('cook-contest')) }),
      ch('Bitter.', out('Bitter. Your team eats it slowly and seriously, the way you eat medicine you have decided to like. Pomfrey raises an eyebrow, and then both. Pomfrey: "Team Stew. Brave choice." He writes it down for you.', flag('recipe-stew'), flag('recipe-team-stew'), flag('recipe-known'), flag('cook-contest'), WIN), { chance: 0.6, fail: out('Bitter. One of your team eats it. One. Pomfrey: "Brave," he says. "Not right. Brave."', fr(2, 'party'), flag('cook-contest')) }),
    ],
  },
  {
    id: 'grandmas-recipe',
    intro: 'A cottage kitchen, low ceiling, everything copper. A grandmother with flour up to her elbows is already putting a chopping board in front of you. Gran Ottilie: "It heals everything, dear." She pauses. "Not everything. But most things that matter." She hands you a knife and a bag of onions. "Chop the onions. I\'ll tell you about my husband while you do it."',
    choices: [
      ch('Chop and listen.', out('You chop, and your eyes stream, and she tells you about a man who could not cook and married her for it, and learned anyway, badly, every Sunday for fifty years. By the time the stew is done you are both crying, and only partly from the onions. Ottilie\'s Stew.', flag('recipe-stew'), flag('recipe-ottilie'), flag('recipe-known'), flag('cook-ottilie'), WIN, heal(1))),
      ch('Just the recipe, please.', out('She does not mind at all. She writes it on a card in a hand like lace, and puts a kiss at the bottom. Ottilie\'s Stew.', flag('recipe-stew'), flag('recipe-ottilie'), flag('recipe-known'), flag('cook-ottilie'), WIN)),
      ch('Can I bring a friend?', out('Ottilie: "Oh, bring them!" You fetch someone you met on the road, and they come, and the three of you eat at the little table with the window open and the stew steaming, and nobody wants to leave. Ottilie\'s Stew, and a full heart.', flag('recipe-stew'), flag('recipe-ottilie'), flag('recipe-known'), flag('cook-ottilie'), flag('cook-shared'), WIN, heal(1), bondUp(1, 'party'))),
    ],
  },
  {
    id: 'pie-contest-judge',
    intro: 'A village fair, bunting, a brass band playing slightly wrong. Four pies on a judging table: Oran, Sitrus, Razz, Pecha. Four bakers behind them, very nervous, wringing their aprons. The fair organiser grabs your arm. Organiser: "Our judge fell ill. Taste them all. Pick a winner." The bakers all look at you at once.',
    choices: [
      ch('Oran.', out('Oran wins. Its baker bursts into tears and gives you the recipe. The other three give you a slice each, and only one of them sulks.', flag('recipe-special'), flag('recipe-pie-oran'), flag('recipe-known'), flag('cook-pie'), WIN, item('sitrus-berry'))),
      ch('Sitrus.', out('Sitrus wins. Its baker shakes your hand for a full minute and gives you the recipe. Slices from the others, warm.', flag('recipe-special'), flag('recipe-pie-sitrus'), flag('recipe-known'), flag('cook-pie'), WIN, item('oran-berry'))),
      ch('Razz.', out('Razz wins. Its baker, a teenager, punches the air and then remembers to be dignified. The recipe, and slices from the others.', flag('recipe-special'), flag('recipe-pie-razz'), flag('recipe-known'), flag('cook-pie'), WIN, item('oran-berry'))),
      ch('Pecha.', out('Pecha wins. Its baker, very old, nods once, as if she knew. The recipe, and slices from the others.', flag('recipe-special'), flag('recipe-pie-pecha'), flag('recipe-known'), flag('cook-pie'), WIN, item('oran-berry'))),
    ],
    remembers: [
      v('gina', [is('roster-gina-done')], { notice: 'One of the bakers is Picnicker Gina, in a borrowed apron, with flour on her nose. She is very carefully not looking at you. Whichever pie you pick, she will know.' }),
    ],
  },
  {
    id: 'chefs-cook-off-battle',
    intro: 'A chef in whites flips a pan, mid-air, high enough to clear the awning, and catches it without looking. Chef Ruggiero: "Beat me and my winning meal heals your whole team!" He points the pan at you. "Lose, and you wash up."',
    choices: [
      ch('Battle.', fight('His Slurpuff is fluffy and vicious. His Darmanitan is just vicious.', safe(trainer('Chef Ruggiero', { cls: 'veteran', team: ['slurpuff', 'darmanitan'], size: 2, lv: 1, win: [heal(1), flag('cook-ruggiero'), WIN] }), heal(0.5), flag('cook-ruggiero')))),
      ch('Cook-off instead.', out('Two stoves, ten minutes, one bell. You plate up as the bell goes, and Ruggiero tastes yours, and puts down his fork, and swears in a language you do not know. He feeds your whole team, and writes his Feast down for you, grumbling.', heal(1), flag('recipe-special'), flag('recipe-feast'), flag('recipe-known'), flag('cook-ruggiero'), WIN), { chance: 0.6, fail: out('Ten minutes, one bell. His is better. Much better. You wash up. Afterwards he feeds you anyway, laughing, because nobody leaves his kitchen hungry.', heal(1), flag('cook-ruggiero')) }),
      ch('Wash up anyway.', out('You roll up your sleeves and start on his pans. He laughs so hard he has to sit down. Then he feeds you, and your whole team, and will not hear a word about it.', heal(1), flag('cook-ruggiero'))),
    ],
  },
  {
    id: 'cooking-draft',
    intro: 'A tournament table, long, with six baskets on it: Sitrus, Leppa, Lum, Chesto, Rawst, Aspear. Three other contestants stand ready. The host rings a bell. Host: "You draft two, then cook. Choose with care!"',
    choices: [
      ch('Lum and Chesto.', out('Lum and Chesto, bitter and clean. You cook a dish that keeps a team awake and clear-headed. The recipe is yours.', flag('recipe-special'), flag('recipe-draft-lum'), flag('recipe-known'), flag('cook-draft'), WIN)),
      ch('Sitrus and Leppa.', out('Sitrus and Leppa, sweet and sharp. A dish that keeps a team going long after it should have stopped. The recipe is yours.', flag('recipe-special'), flag('recipe-draft-sitrus'), flag('recipe-known'), flag('cook-draft'), WIN)),
      ch('Rawst and Aspear.', out('Rawst and Aspear, fire and ice in one bowl. A dish that steadies a team against burns and frost. The recipe is yours.', flag('recipe-special'), flag('recipe-draft-rawst'), flag('recipe-known'), flag('cook-draft'), WIN)),
    ],
    remembers: [
      v('rival', [{ kind: 'rivalState', feeling: { key: 'trust', atLeast: 2 } }], { notice: '{rival} is one of the other contestants. As you reach for your second basket, they snatch it from under your hand. {rival}: "Should\'ve picked faster." They grin. You pick another, and it works anyway.' }),
    ],
  },
  {
    id: 'cooking-final', room: false, requires: [is('cook-wins', 3), not('cook-final')],
    intro: 'A hushed hall. Three judges at a long table in silence. You set your dish in front of them. The middle judge is wearing an apron over a tracksuit, and a cap pulled low, and you know her: she is this region\'s Gym Leader, on her day off. She leans toward you. Gym Leader: "Don\'t tell anyone I\'m here." Then all three of them taste. And put down their forks.',
    choices: [
      ch('Explain the dish.', out('You explain every recipe that went into it, and where you learned each one, and who taught you. The judges listen. They score it on every one. At the end the Gym Leader presents you with a Golden Spoon, and shakes your hand, hard.', flag('cook-final'), flag('golden-spoon'), item('nugget'))),
      ch('Say nothing.', out('You say nothing. The Gym Leader looks at you over her fork. Gym Leader: "Confident. I like that." The score goes up by one. The Golden Spoon is yours.', flag('cook-final'), flag('golden-spoon'), item('nugget'))),
      ch('Ask what they think.', out('The Gym Leader takes another bite, and thinks about it properly. Gym Leader: "It tastes like someone who looks after their team." She hands you the Golden Spoon herself.', flag('cook-final'), flag('golden-spoon'), item('nugget'), fr(3, 'party'))),
    ],
  },
  // ---------- Cooking at a rest stop (one recipe a rest; two with the Golden Spoon) ----------
  sub('grandmas-recipe', 'cook-at-rest', 'Cook a Recipe', 'A rest stop with a fire pit and a dented pot someone left for the next traveller. Your team gathers round, hopeful. You know a few recipes now.', cookChoices(), {
    room: false, requires: [is('recipe-known')],
    remembers: [v('spoon', [is('golden-spoon')], { notice: 'The Golden Spoon is in your pack. With it, you can cook two dishes tonight.', hide: [3], add: [ch('Cook a second dish (Golden Spoon).', out('You polish the Golden Spoon on your sleeve and get the pot going again.', room('cook-at-rest-2'), { kind: 'seeAgain', eventId: 'cook-at-rest' }))] })],
  }),
  sub('grandmas-recipe', 'cook-at-rest-2', 'Cook a Second Dish', 'The Golden Spoon glints in the firelight. One more dish.', cookChoices(false)),
];
function cookChoices(recur = true): Json[] {
  const back: Json[] = recur ? [{ kind: 'seeAgain', eventId: 'cook-at-rest' }] : [];
  return [
    ch('Pan-Fried Oran.', out('Crisp outside, soft inside. Your team eats it standing up and goes into the next fight sturdier for it.', temp('Pan-Fried Oran: +10% max HP', [{ kind: 'statMultiplier', stat: 'hp', value: 1.1 }], 1), ...back), { requires: [is('recipe-oran')] }),
    ch('A stew.', out('A big pot of stew, and everyone gathered round it.', bondUp(1, 'party'), ...back), {
      requires: [is('recipe-stew')],
      branches: [br([is('recipe-ottilie')], 'Ottilie\'s Stew, onions and all. Whatever was ailing your team, it isn\'t now.', cure(), bondUp(1, 'party'), ...back)],
    }),
    ch('Something special.', out('The pie, warm and golden. Your team is a little stronger for the next fight.', temp('A slice of pie: +10% Attack', [{ kind: 'statMultiplier', stat: 'atk', value: 1.1 }], 1), ...back), {
      requires: [is('recipe-special')],
      branches: [
        br([is('recipe-feast')], 'Ruggiero\'s Feast. Your whole team eats until it cannot move, and wakes whole.', heal(1), ...back),
        br([is('recipe-draft-lum')], 'The Lum and Chesto dish: your team goes into the next fight wide awake and clear-headed.', temp('Lum and Chesto: +10% Special Defense', [{ kind: 'statMultiplier', stat: 'spd', value: 1.1 }], 1), cure(), ...back),
        br([is('recipe-draft-sitrus')], 'The Sitrus and Leppa dish: your team goes into the next fight with something left in reserve.', temp('Sitrus and Leppa: +10% max HP', [{ kind: 'statMultiplier', stat: 'hp', value: 1.1 }], 1), { kind: 'restorePp' }, ...back),
        br([is('recipe-draft-rawst')], 'The Rawst and Aspear dish: fire and ice in one bowl, and a steadier team for it.', temp('Rawst and Aspear: +10% Defense', [{ kind: 'statMultiplier', stat: 'def', value: 1.1 }], 1), cure(), ...back),
      ],
    }),
    ch('Just bread and a warm fire.', out('Bread and a warm fire. Nobody complains.', heal(0.25), ...back)),
  ];
}

export const EVENTS: Json[] = [...LOOP, ...NOBODY, ...ROOTS, ...RECIPES];

