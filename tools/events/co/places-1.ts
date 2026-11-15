// Catalog Overhaul Pack, category "places": the Delves, part 1 (STORY_FAMILIES_14.md, D-1 to D-4).
// Every room is written to the doc: opening, script, the three buttons, the outcome. Each Delve has a resident with a reason to be there.
import { $, ch, flag, flagIs, fr, good, has, heal, hurt, item, join, lose, moveFlag, ptype, relic, rp, takeNode, type Json } from '../dsl.ts';
import { delve, moment, no, variant } from './_delve.ts';

export const CATEGORY = 'places';

// ---------- D-1. The Abandoned Mine Shaft (resident: Pick, an Excadrill still digging toward Old Garnet) ----------
const mine = delve({
  slug: 'abandoned-mine-shaft', name: 'The Abandoned Mine Shaft', rooms: 'abcde', types: ['rock', 'ground'], tint: '#3a2f26', minStage: 1,
  mons: { a: 'geodude', b: 'woobat', c: 'excadrill', e: 'excadrill' },
  gate: {
    intro: 'A rusted track runs into the hill and the dark swallows it. The timbers are twenty years grey. Somewhere far inside, faint and steady, something is digging.',
    enter: 'Follow the track in.', enterText: 'You step over the first sleeper. The daylight shrinks to a coin behind you, and the digging does not stop.',
    pass: 'Leave the hill alone.', passText: 'You walk on. The digging goes on behind you, patient as a clock.',
  },
});
const MINE: Json[] = [
  mine.room('a', 'A rusted track into the hill. Ahead, a Geodude rolls along the rails like a runaway mine cart, then stops dead to stare at you. A lamp on the wall is still lit. Nobody has worked here in twenty years.', (n) => [
    ch('Battle the Geodude.', n.wild('It plants itself on the rails and will not be moved without a fight.', { species: ['geodude'], win: [rp(1)] })),
    ch('Roll it along the track.', n.to('You give it a push. It squeals with joy, rattles away down the rails and looks back to be sure you are following. It knows every turn of this place.', flag(n.f('rolled')))),
    ch('Follow the lamp.', n.to('The lamp is warm. Someone trimmed the wick today. Beside it, scratched deep into the timber by a claw, over and over until the letters are a groove: GARNET.', flag(n.f('garnet')), rp(1))),
    n.back,
  ]),
  mine.room('b', 'A Woobat colony hangs from the ceiling like wet laundry, shivering awake. Digging sounds from deeper in have been disturbing them for a long time. Their eyes are tired.', (n) => [
    ch('Sneak under.', n.to('You go heel to toe under a hundred sleeping ears. One opens an eye, sighs, and lets you by.'), { check: 'speed', fail: n.wild('A pebble skips off your boot. The whole ceiling drops on you at once.', { species: ['woobat'], chain: 2 }) }),
    ch('Battle.', n.wild('You call out your lead. The colony unfolds, furious at one more noise.', { species: ['woobat'], win: [rp(1)] })),
    ch('Listen to the digging.', n.to('You stand still and listen. Scrape, scrape, rest. Scrape, scrape, rest. It is not an animal burrowing. It is someone working a shift, the way they were taught.', flag(n.f('listened')), rp(2))),
    n.back,
  ], (n) => [
    variant('rolled', [flagIs(n.f('rolled'))], { notice: 'The Geodude you pushed clatters ahead down the rails, and every Woobat head turns to follow the noise.', hide: [0], add: [ch('Walk under while the Geodude draws them off.', n.to('The colony streams after the rattling Geodude. You walk under an empty ceiling. Far ahead it waits for you, very pleased with itself.'))] }),
  ]),
  mine.room('c', 'Claw marks and old nests line the walls. This is somebody\'s home. Pick, an Alpha Excadrill, huge and grey at the muzzle, is tearing at a rockfall that fills the tunnel. It turns. Its eyes are red, and its claws are worn almost flat.', (n) => [
    ch('Calm it with a Hard Stone.', n.to('You roll the Hard Stone across the floor. Pick stops. It chews the stone slowly, the red going out of its eyes, then steps aside to show you the rockfall. Under the lowest slab: a miner\'s helmet, a name painted inside. GARNET. Pick has been digging toward it for twenty years.', lose('hard-stone'), flag(n.f('helmet')), flag(n.f('resident-calmed')), flag('calmed-alpha'), rp(3), fr(4)), { requires: [has('hard-stone')] }),
    ch('Battle it.', n.wild('Pick screams and comes at you through its own dust.', { species: ['excadrill'], lv: 3, win: [flag(n.f('resident-fought')), rp(2), moment('You drove Pick the Excadrill deeper into its mine.', 40)] })),
    ch('Help it dig.', n.to('Your Ground-type steps up beside Pick and puts its claws to the rock. Pick stares, then digs with it. Three long turns, shoulder to shoulder. The slab comes away. Under it lie a helmet with GARNET painted inside, and a letter folded small. Pick touches the helmet with one claw and makes a sound you will not forget.', flag(n.f('helmet')), flag(n.f('letter')), flag(n.f('resident-helped')), rp(3), fr(6)), { requires: [ptype('ground')] }),
    n.back,
  ], (n) => [
    variant('garnet', [flagIs(n.f('garnet'))], { notice: 'You remember the name clawed into the timber by the lamp.', hide: [0], add: [ch('Say the name: "Garnet."', n.to('"Garnet." The claws stop mid-swing. Pick turns its whole body toward you, trembling, as if you might be him. You are not. It lowers its head anyway and lets you past, to the rockfall, and the helmet under the lowest slab with his name inside.', flag(n.f('helmet')), flag(n.f('resident-calmed')), flag('calmed-alpha'), rp(3), fr(4)))] }),
  ]),
  mine.room('d', 'A battered chest sits in a side room: Garnet\'s lunchbox and his tools, laid out neat. A note is pinned inside the lid in a careful hand: "For Pick\'s birthday. Don\'t tell him."', (n) => [
    ch('Open it.', n.to('Under the tools, wrapped in a clean cloth: a pouch of Soft Sand and a Ground TM with DIG written on the case. A birthday present, twenty years late. You take it, and feel that you have.', item('soft-sand'), item('tm-ground'))),
    ch('Give it to Pick.', n.to('You carry the lunchbox back down the tunnel and set it in front of Pick. It knows the smell. It curls its worn claws around the box, lies down against the rockfall, and for the first time in twenty years it stops digging.', flag(n.f('lunchbox')), good(2), fr(6))),
    ch('Leave it.', n.to('You close the lid on the note. It was never yours to read.')),
    n.back,
  ], (n) => [
    variant('fought', [flagIs(n.f('resident-fought'))], { notice: 'Far below, the digging has started again, faster and angrier. The tunnel shivers with it.', hide: [1], add: [ch('Leave it open where Pick will find it.', n.to('You carry the lunchbox to the mouth of the deep tunnel and leave the lid open, the note showing. The digging below falters. Then it stops.', flag(n.f('lunchbox')), good(1)))] }),
    variant('ine', [flagIs(n.f('resident-calmed')), flagIs('noble-ine')], { notice: 'You think of Ine the Warden, and can almost hear her: "That one wasn\'t frenzied. Just grieving."' }),
  ]),
  mine.room('e', 'Daylight. Up the hill stands a cottage, and Garnet\'s widow, Ruby, is hanging washing in the wind. She has hung it facing the mine for twenty years.', (n) => [
    ch('Tell her about Pick.', n.to('Ruby listens with a peg in her mouth. Then she takes the lantern off its nail and walks down the shaft without a word. An hour later she comes up, and Pick comes up behind her, blinking at the sun. It lives with her now.', flag(n.f('done')), flag(n.f('ruby-told')), good(2), moment('Pick the Excadrill came up out of the mine to live with Ruby.', 55))),
    ch('Give her the helmet.', n.to('Ruby turns the helmet over and reads the name inside. She cries the way people do when they have waited for it. "He\'d want this working." She gives you Garnet\'s pick, its handle worn to the shape of his hand.', flag(n.f('done')), relic('garnets-pick', 'Garnet\'s Pick', [{ kind: 'typeDamageMultiplier', type: 'ground', value: 1.1 }]), good(2), moment('You carried Garnet\'s helmet up to Ruby.', 55)), { requires: [flagIs(n.f('helmet'))] }),
    ch('Walk on.', n.to('You pass the cottage. Ruby nods to you, a stranger on the road, and goes back to her washing. Behind you the hill is quiet, or digging. You know which.', flag(n.f('done')))),
  ], (n) => [
    variant('both', [flagIs(n.f('helmet')), no(n.f('resident-fought'))], { notice: 'You have Garnet\'s helmet under your arm, and you know where Pick is.', add: [ch('Tell her about Pick, and give her the helmet.', n.to('Ruby holds the helmet and goes down the shaft with her lantern. When she comes back up, Pick is beside her, and it walks straight past her to you. Ruby laughs, wet-eyed. "Go on, take him. He needs to dig somewhere new." She presses Garnet\'s pick into your hand as well.', flag(n.f('done')), flag(n.f('ruby-told')), flag(n.f('resident-joined')), join({ species: ['excadrill'], lv: 3 }), relic('garnets-pick', 'Garnet\'s Pick', [{ kind: 'typeDamageMultiplier', type: 'ground', value: 1.1 }]), good(3), moment('Pick the Excadrill left Garnet\'s mine to dig somewhere new, with you.', 70)))] }),
    variant('fought', [flagIs(n.f('resident-fought'))], { notice: 'Under your feet, very faintly, Pick is digging again. You fought it in its own home, and it went back to work.' }),
  ]),
];

// ---------- D-2. The Dense Forest Path (resident: the Path Keeper, a tired old Decidueye) ----------
const forest = delve({
  slug: 'dense-forest-path', name: 'The Dense Forest Path', rooms: 'abcd', types: ['grass', 'bug'], tint: '#1f3a26', minStage: 1,
  mons: { a: 'nuzleaf', b: 'combee', c: 'decidueye', d: 'decidueye' },
  gate: {
    intro: 'The road ends at a wall of trees. One narrow path goes in, and every traveller\'s tale about this forest ends the same way: "and then something showed me the way out."',
    enter: 'Take the path.', enterText: 'The branches close over your head like a door. High above, something with wide wings shifts its weight and begins to follow.',
    pass: 'Go around the forest.', passText: 'You take the long road around. From the treeline, something watches you go, and seems almost disappointed.',
  },
});
const FOREST: Json[] = [
  forest.room('a', 'The path narrows under heavy branches. A Nuzleaf whistles from a bough overhead and drops acorns on your hat, one at a time, grinning.', (n) => [
    ch('Battle.', n.wild('An acorn bounces off your nose. That does it.', { species: ['nuzleaf'], win: [rp(1)] })),
    ch('Whistle back.', n.to('Your Pokémon answers the whistle note for note. The Nuzleaf nearly falls off its branch with delight. It hops down and trots ahead of you, whistling the tune, checking that you keep up.', flag(n.f('whistled')), rp(1), fr(2)), { requires: [moveFlag('sound')] }),
    ch('Ignore it.', n.to('You walk on with acorns in your collar. The whistle follows you for a while, hopeful, then gives up.')),
    n.back,
  ]),
  forest.room('b', 'A swarm of Combee circles a fallen hive, bumping into each other, lost. An arrow-shaped leaf is pinned to a tree with a single feather. It points left.', (n) => [
    ch('Help rebuild the hive.', n.to('You wedge the hive back into the fork of the tree and hold it while they seal it with wax. It takes a long while. They leave two combs of Honey at your feet and will not hear of you refusing.', takeNode(), item('honey', 2), fr(2))),
    ch('Battle.', n.wild('The swarm takes you for whatever knocked their home down.', { species: ['combee'], chain: 2, win: [rp(1)] })),
    ch('Follow the leaf.', n.to('You go left. A second leaf, then a third, each pinned with a brown feather, each one exactly where a tired traveller would start to doubt. Someone has been doing this for a very long time.', flag(n.f('sign')), rp(1))),
    n.back,
  ]),
  forest.room('c', 'A dry corner under the roots, with room to sit. A Decidueye lands on a stump across from you. It is old: its hood is grey, and it grips the stump like a railing. It watches you, the way a guide watches the last one in the line.', (n) => [
    ch('Rest.', n.stay('You sleep with your back to a root. When you wake the Decidueye has not moved. It kept the watch so you did not have to.', heal(0.5), flag(n.f('rested')))),
    ch('Offer it food.', n.stay('You hold out half of what you have. It looks at the food, then at you, as if nobody has asked in a hundred years. It eats. Then, for the first time in a long time, it closes its eyes.', flag(n.f('fed')), good(1), fr(3))),
    ch('Ask the way out.', n.to('It lifts one wing and points, without hurry, the way it has pointed for a century of lost travellers. You have the feeling it could do it asleep. You have the feeling it would like to.')),
    n.back,
  ], (n) => [
    variant('both', [flagIs(n.f('rested')), flagIs(n.f('fed'))], { notice: 'The Decidueye sits easier on its stump now, fed and unhurried, watching you over a folded wing.', hide: [0, 1] }),
    variant('rested', [flagIs(n.f('rested'))], { notice: 'You have slept. The Decidueye is still there, upright, awake.', hide: [0] }),
    variant('fed', [flagIs(n.f('fed'))], { notice: 'The Decidueye opens one eye when you move, and closes it again.', hide: [1] }),
  ]),
  forest.room('d', 'Daylight, green and sudden. The Decidueye is on the last branch before the open road, where it has stood to see every traveller out.', (n) => [
    ch('Thank it.', n.to('You bow. It bows back, stiffly, and drops something at your feet: a Sharp Beak, from a Pokémon it guided out long ago and never forgot.', item('sharp-beak'), flag(n.f('done')), flag(n.f('resident-thanked')))),
    ch('"Come with me."', n.to('It looks at the road, then back at the forest full of people who are not lost yet. It hesitates for a long moment. Then it turns back into the trees. It is too tired to go, and too tired to stop.', flag(n.f('done')), flag(n.f('resident-stayed')))),
    ch('Take its post.', n.to('You stand at the forest\'s edge in its place. Near dusk a child comes crying through the ferns, and you walk her out to the road and her mother. On the branch above, the Decidueye watches you do it right. Then it tucks its head under its wing, and lets itself sleep.', flag(n.f('done')), flag(n.f('resident-relieved')), takeNode(), good(2), moment('You took the Path Keeper\'s post so it could finally sleep.', 60))),
  ], (n) => [
    variant('cared', [flagIs(n.f('rested')), flagIs(n.f('fed'))], { notice: 'It kept your watch, and you fed it. It has not looked away from you since.', hide: [1], add: [ch('"Come with me."', n.to('It looks at the forest. A Rowlet flutters down onto the branch beside it, puffed up and serious, and takes the post. The old Decidueye studies the little one, nods once, and steps off the branch onto your shoulder. It is heavier than it looks, and it is done being alone.', flag(n.f('done')), flag(n.f('resident-joined')), join({ species: ['decidueye'], lv: 2 }), good(2), moment('The Path Keeper left its forest to a Rowlet and came with you.', 70)))] }),
  ]),
];

// ---------- D-3. The Coastal Cove (resident: Gull-Post, a smuggler's Pelipper still delivering letters) ----------
const cove = delve({
  slug: 'coastal-cove', name: 'The Coastal Cove', rooms: 'abcde', types: ['water', 'flying'], tint: '#1f3d4a', minStage: 1,
  mons: { a: 'krabby', b: 'pelipper', c: 'chinchou', e: 'pelipper' },
  gate: {
    intro: 'Below the cliff path, waves break at the mouth of a cove no chart shows. A Pelipper flies in with a full beak, flies out with an empty one, and has clearly done so for years.',
    enter: 'Climb down to the cove.', enterText: 'You pick your way down the wet rock. The Pelipper passes overhead, on schedule, and does not look down.',
    pass: 'Stay on the cliff path.', passText: 'You keep to the path. Below you the Pelipper makes another delivery to nobody.',
  },
});
const COVE: Json[] = [
  cove.room('a', 'Waves fold at the mouth of the hidden cove. A whole army of Krabby sidesteps across the sand in ranks, claws up, going somewhere important.', (n) => [
    ch('Battle.', n.wild('You step into the column. The column objects.', { species: ['krabby'], win: [rp(1)] })),
    ch('Wait for them to pass.', n.to('You sit on a rock and watch the parade go by. It takes a while. The last and smallest Krabby salutes you with one claw.')),
    ch('Follow them.', n.to('You fall in at the back of the column. They lead you along a shelf of dry rock above the tide line, a path you would never have seen. Your boots stay dry.', flag(n.f('dry-path')), rp(1))),
    n.back,
  ]),
  cove.room('b', 'A Pelipper lands hard, drops a letter at your feet as if you were a doorstep, and flies off. The ink is brown with age: "To Maud. Hold the goods till spring. — R." It is thirty years old.', (n) => [
    ch('Keep the letter.', n.to('You fold it into your bag. Thirty years, and it has finally been delivered to someone.', flag(n.f('letter')))),
    ch('Follow the Pelipper.', n.to('It flies low into a sea cave, and you wade after it. Inside, it is sorting letters into a crack in the rock with its beak. Hundreds of them. None has ever been collected.', flag(n.f('followed')), rp(1))),
    ch('Battle the Pelipper.', n.wild('It wheels back to defend its route.', { species: ['pelipper'], win: [flag(n.f('letter')), rp(1)] }, flag(n.f('fought')))),
    n.back,
  ]),
  cove.room('c', 'Something here doesn\'t belong. A faint light pulses in a tide pool: a Chinchou, but blue-green where it should be yellow, glowing a colour the sea does not make.', (n) => [
    ch('Study it.', n.to('You crouch and take notes until your knees ache. It lets you. The colour is in its skin, not the water. Somewhere, somebody would give a great deal to read this page.', flag('delta-clue-d1'), rp(3))),
    ch('Catch it.', n.to('It comes without a struggle, curious about your light as you are about its own.', join({ species: ['chinchou'] }))),
    ch('Leave it.', n.to('You leave it pulsing in its pool, the wrong colour and perfectly content.')),
    n.back,
  ]),
  cove.room('d', 'A battered chest: smuggled goods, long rotted to rags. And beside it, tied with fishing line, a bundle of unsent letters. Every one is addressed to "Maud".', (n) => [
    ch('Open the goods.', n.to('Under the rot, the part that does not spoil: a Pearl and a Big Pearl, still wrapped in a smuggler\'s handkerchief.', item('pearl'), item('big-pearl'))),
    ch('Read the letters.', n.to('You read them in order. R was no great smuggler, and a worse poet. He loved Maud. Every spring he waited at this cove. Every letter ends the same way: "Perhaps next year." She never came.', flag(n.f('read')), rp(1))),
    ch('Give them to the Pelipper.', n.to('The Pelipper lands and takes the whole bundle in its beak, gently, like eggs. It looks at you once. Then it flies straight out to sea with thirty years of post, toward somewhere it has decided the letters belong.', flag(n.f('gave-letters')), good(1))),
    n.back,
  ]),
  cove.room('e', 'Daylight. On the cliff above the next cove along, an old woman sits on a folding stool, watching the sea as if it owed her something.', (n) => [
    ch('Ask if she\'s Maud.', n.to('"Nobody\'s called me that in years." She is. She waited too, every spring, at this cove: the wrong one, half a mile off. She laughs until she has to wipe her eyes. "Thirty years. The old fool. The pair of us."', flag(n.f('done')), flag(n.f('maud-asked')), rp(1))),
    ch('Give her a letter.', n.to('She reads it standing up, lips moving. The Pelipper lands beside her and folds its wings: its route is finished. It looks at Maud, then at you. Maud waves a hand at it. "Go on. You\'ve carried enough for him." It waddles to your side.', flag(n.f('done')), flag(n.f('resident-joined')), join({ species: ['pelipper'], lv: 2 }), good(3), moment('Gull-Post the Pelipper delivered its last letter, to Maud, thirty years late.', 70)), { requires: [flagIs(n.f('letter'))] }),
    ch('Walk on.', n.to('You pass behind her stool. She does not turn. Out over the water, a Pelipper is flying its route.', flag(n.f('done')))),
  ], (n) => [
    variant('gave', [flagIs(n.f('gave-letters'))], { notice: 'Far out, a white speck circles: the Pelipper, still carrying the bundle you gave it, looking for where it belongs.' }),
    variant('fought', [flagIs(n.f('fought'))], { notice: 'The Pelipper you fought circles overhead, keeping its distance, still on its route.' }),
  ]),
];

// ---------- D-4. The Mountain Pass (resident: Elspeth Crane, a mountain guide's daughter) ----------
const pass = delve({
  slug: 'mountain-pass', name: 'The Mountain Pass', rooms: 'abcde', types: ['rock', 'flying'], tint: '#3b4250', minStage: 1,
  mons: { a: 'gligar', d: 'aerodactyl' },
  gate: {
    intro: 'A ledge climbs between two peaks, with a frayed guide rope bolted along it. A sign in fresh paint: "CLIMBERS WILL BE TESTED. E. CRANE."',
    enter: 'Start up the ledge.', enterText: 'You clip a hand to the guide rope. Someone has replaced every worn bolt, recently, and by hand.',
    pass: 'Take the valley road.', passText: 'You take the long way through the valley. High above, a figure with a rope over her shoulder watches you choose.',
  },
});
const PASS: Json[] = [
  pass.room('a', 'A ledge between two peaks, a boot wide in places. A Gligar glides across the gap, lands on your pack with a thump, and settles there as if it had paid for the seat.', (n) => [
    ch('Shoo it.', n.to('It sticks its tongue out and sails off the ledge, sulking in a slow spiral.')),
    ch('Battle.', n.wild('It hops off the pack and flares its wings on the narrow ledge.', { species: ['gligar'], win: [rp(1)] })),
    ch('Let it ride.', n.to('You climb on with a passenger. It peers over your shoulder at every handhold, and now and then it tugs your ear toward the safer one.', flag(n.f('gligar')), fr(2))),
    n.back,
  ]),
  pass.room('b', 'Someone is waiting where the ledge widens, arms folded: a woman with a rope over her shoulder and chalk to the elbows. "Elspeth Crane. My father carried down eleven climbers who thought they were ready. Show me you\'re ready."', (n) => [
    ch('Battle.', n.trainer('"Good. Words are cheap up here."', 'Elspeth Crane', { team: ['lucario', 'gallade'], lv: 1, cls: 'hiker', win: [flag(n.f('passed')), $(300)] })),
    ch('Show her my gear.', n.to('She turns your Escape Rope over, checks the weave, the knots, the wear. She nods once. "You\'ve used it, and you\'ve looked after it. Go on up."', flag(n.f('passed')), flag(n.f('gear'))), { requires: [has('escape-rope')] }),
    ch('Ask about her father.', n.trainer('"He went up for the twelfth. Didn\'t come down." She looks at the peak for exactly one breath. "So now I test everyone. Your turn."', 'Elspeth Crane', { team: ['lucario', 'gallade'], lv: 1, cls: 'hiker', win: [flag(n.f('passed')), flag(n.f('father')), $(300)] })),
    n.back,
  ], (n) => [
    variant('flyer', [ptype('flying')], { notice: 'Her eyes go to your Flying-type before they go to you.', hide: [1], add: [ch('Show her my Flying-type.', n.to('She holds out an arm. Your Flying-type steps onto it and she feels the strength in its grip. "This one could carry you off a ledge. I\'ve wished for that. Go on up."', flag(n.f('passed')), flag(n.f('gear'))))] }),
  ]),
  pass.room('c', 'A dry corner out of the wind: Elspeth\'s camp. She got here before you by a route she does not explain. She has made tea for two, and set the second cup where a climbing partner would sit.', (n) => [
    ch('Rest.', n.to('You drink the tea and sleep in a borrowed blanket. Elspeth sits up, checking her knots by firelight. Nobody in her camp has ever needed rescuing.', heal(1))),
    ch('Ask about the twelfth.', n.stay('She pours before she answers. "The twelfth was his own apprentice. A boy he\'d trained since he could tie a knot. Storm came in. Father went up after him." She drinks. "They found the rope. Just the rope."', flag(n.f('twelfth')), rp(1))),
    ch('Leave.', n.to('You thank her for the tea and shoulder your pack. "Mind the rockfall past the bend," she says, not looking up.')),
    n.back,
  ], (n) => [
    variant('asked', [flagIs(n.f('twelfth'))], { notice: 'The fire has burned low. Elspeth is winding her rope, and does not seem to mind that you are still here.', hide: [1] }),
  ]),
  pass.room('d', 'A crack like a rifle shot, and the slope above lets go. Through the falling rock an Aerodactyl bursts from its roost, startled, screeching, as frightened as you are.', (n) => [
    ch('Battle.', n.wild('It dives through the dust, striking at anything that moves.', { species: ['aerodactyl'], lv: 2, win: [rp(2)] })),
    ch('Take cover.', n.to('You press everyone flat against the wall. Stones rattle off packs and shoulders. When the dust settles the Aerodactyl is gone and everybody is bruised.', hurt(0.1))),
    ch('Calm it.', n.to('Your Rock-type steps out into the rockfall and stands there, unbothered, as stone bounces off stone. The Aerodactyl sees one calm thing in a falling world. It stops screeching, circles once, and flies off down the valley.', rp(2), fr(2)), { requires: [ptype('rock')] }),
    n.back,
  ], (n) => [
    variant('gligar', [flagIs(n.f('gligar'))], { notice: 'A heartbeat before the crack, the Gligar on your pack yanked your ear, hard, toward an overhang.', hide: [1], add: [ch('Duck where the Gligar pulls you.', n.to('You throw everyone under the overhang as the slope comes down past it like a curtain. Not a pebble touches you. The Gligar pats your head, glides away over the settling dust, and is gone.', fr(2)))] }),
  ]),
  pass.room('e', 'Daylight at the top of the pass, hard and clean. A cairn of stones stands here. Twelve names are cut into its flat face, the last two closer together than the rest.', (n) => [
    ch('Add a stone.', n.to('You find a stone that fits and set it on the cairn. The wind drops. Very high up, something with great wings crosses the sun, and for a moment its shadow rests on you like a hand.', flag(n.f('done')), flag('sign-bird'), rp(2))),
    ch('Read the names.', n.to('You read all twelve aloud. Ten strangers. The eleventh name on the stone is CRANE. The twelfth is a boy\'s. Someone has kept the letters clear of lichen with a knife, every year.', flag(n.f('done')), rp(1))),
    ch('Call Elspeth up.', n.to('You shout down the pass. A long silence. Then she climbs it, fast and perfect, and stops short of the top like a horse at a gate. She has not stood here since. She sits down with the cairn and puts her hand flat on her father\'s name. When you leave, she presses his rope on you. "It\'s brought eleven down. Let it bring you."', flag(n.f('done')), flag(n.f('resident-climbed')), flag('crane-rope'), good(3), moment('Elspeth Crane climbed to her father\'s cairn for the first time, and gave you his rope.', 70))),
  ]),
];

export const EVENTS: Json[] = [mine.gate, ...MINE, forest.gate, ...FOREST, cove.gate, ...COVE, pass.gate, ...PASS];
export const REMOVE: string[] = [];
