// Catalog Overhaul Pack, category "places": STORY_FAMILIES_17.md SF129 Single Merges (part 1: places and wild scenes).
// Each catalog event is a beat folded into one named home. Where the home is another category's place, the beat opens it the way
// that place is entered (a later stop, a flag that place reads, or the pseudo-stage gate), and the flags file lists the hand-off.
import { BERRIES, RARE_HELD, $, any, anyType, ch, express, flag, flagIs, fr, has, heal, hurt, hurtLead, item, join, lose, money, out, ptype, reveal, rp, scout, takeNode, type Json } from '../dsl.ts';
import { kind, moment, rep } from './_delve.ts';

export const CATEGORY = 'places';

const go = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const later = (id: string, nodes = 1): Json => ({ kind: 'laterEvent', eventId: id, nodes });
const bond = (n: number, who: Json | string = 'party'): Json => ({ kind: 'friendship', bond: n, who });
const fightW = (text: string, species: string[], lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'wild', friendly: true, species, types: [], levelBonus: lv, shinyMultiplier: 1, win } });
const fightT = (text: string, name: string, cls: string, size: number, lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'trainer', friendly: true, name, classId: cls, size, types: [], levelBonus: lv, win } });
const E = (id: string, intro: string, choices: Json[], extra: Record<string, unknown> = {}): Json => ({ id, intro, choices, ...extra });
const MAP_PIECE = flag('treasure-map-piece');

export const EVENTS: Json[] = [
  E('ev-pokemon-sanctuary', 'Past a gate of ivy, a meadow where Pokémon doze in the sun without a care in the world: a Snorlax with a Pichu asleep on its belly, a Lapras in a pond, Swablu in a heap. Nobody here is afraid of anything. It is the Blissful Sanctuary.', [
    ch('Rest among them.', out('You lie down in the grass and your team lies down around you, and for an afternoon nobody fights anything. You wake up whole.', heal(1), bond(1))),
    ch('Look for the keeper.', out('You find her in a shed full of bandages and bottles: Lisle, the keeper, who looks up and smiles as if she has been expecting you. "Most people only rest," she says. "Sit. I\'ll tell you how this place began."', flag('sanctuary-keeper-met'), rp(2))),
  ]),
  E('ev-treasure-expedition', 'A scrap of map nailed to a post, a dig site roped off beside it, and a shovel already standing in the soil, as if someone dropped it mid-dig and ran.', [
    ch('Dig.', out('You dig where the shovel was. Two feet down, wrapped in oilcloth, a piece of a treasure map.', takeNode(), MAP_PIECE)),
    ch('Look for the digger.', out('Behind a bush, a kid, mud to the elbows, terrified you are going to steal it. You promise you are not. They give you the map piece anyway. "I can\'t read maps," they admit. "You have it."', MAP_PIECE, ...kind())),
  ]),
  E('w4-old-chart', 'A hiker by the road with a chart spread on his knees, an X marked in red. "An X, see? Thirty years I\'ve had this. Never had time to dig."', [
    ch('Buy (200).', go('w4-treasure-dig', 'He folds it into your hands with a sigh, as if letting go of a dream. "Go on. Somebody should."', $(-200), MAP_PIECE), { requires: [money(200)] }),
    ch('Dig together.', go('w4-treasure-dig', 'His face lights up. "Together? Really?" He gets up faster than a man his age should.', MAP_PIECE, fr(2))),
  ]),
  E('w4-treasure-dig', 'The X, under a crooked stone, exactly where the chart said. The ground here is soft, as if waiting.', [
    ch('Dig.', out('You dig until the shovel rings on wood. A small chest, rotten at the corners. Inside, something good, and a note from whoever buried it: "Well done. Spend it on something silly."', any(...RARE_HELD), any('nugget', 'big-pearl', 'star-piece'), moment('You dug up the treasure under the X.', 55))),
  ]),
  E('galar-autograph-fans', 'A knot of fans in football jerseys, and on the front of every jersey, printed slightly blurry, your face. They have seen you. They are screaming.', [
    ch('Sign.', out('You sign shirts, hats, an arm, a baby\'s bib. They cry. You might cry a bit too.', rep(1))),
    ch('Pose.', out('You pose with your team. The photos will be on a hundred walls tomorrow. Your team loves it far too much.', rep(1), fr(2))),
    ch('Run.', out('You run. They chase you three streets, delighted, and give up laughing.')),
  ]),
  E('galar-local-tournament', 'A hand-painted banner over a village green: LOCAL TRAINERS CUP. Bunting, a sausage stall, a bracket chalked on a blackboard, eight names, one empty line at the bottom.', [
    ch('Enter.', fightT('They chalk your name on the empty line. The bracket is short and fierce, three fights for the cup, and it counts as a rung on the Circuit.', 'Cup Finalist', 'ace-trainer', 3, 2, [$(500), flag('circuit-rung'), moment('You won the Local Trainers Cup.', 50)])),
    ch('Buy a sausage.', out('You buy a sausage and watch the whole cup from the fence. It is very good, the sausage and the cup.', $(-20), heal(0.1))),
  ]),
  E('ruined-bridge', 'The bridge is broken in the middle, its planks hanging into a river that is wild and white and loud. On the far bank a village waves at you, pointing at the gap.', [
    ch('Repair it.', out('It takes a whole day and a Fighting-type to haul the beams, but the bridge stands again. The village comes across it to shake your hand, all of them.', takeNode(), rep(1), ...kind(), fr(3, { types: ['fighting'] })), { requires: [ptype('fighting')] }),
    ch('Swim.', out('You swim it. The river takes you a long way downstream before it lets you go.', hurt(0.1))),
    ch('Fly over.', out('Your Flying-type carries you over the gap. Below you, the village claps.', fr(2, { types: ['flying'] })), { requires: [ptype('flying')] }),
  ]),
  E('site-grove', 'Behind a curtain of willow, green light, and quiet cries, the small kind, the kind that stop when you get close. The Hidden Grove.', [
    ch('Go in quietly.', go('w4-hidden-grove', 'You part the willow without a sound.')),
    ch('Call out.', out('The cries stop. Everything in the grove goes still and hidden. You wait a long time, and nothing comes.')),
  ]),
  E('w4-hidden-grove', 'The Hidden Grove. Green light coming down through leaves in shafts, and in a ring of moss, a Grass-type you have only ever seen in books, watching you with enormous eyes.', [
    ch('Hold very still.', fightW('It decides you are interesting. It comes closer.', ['celebi', 'shaymin', 'tropius', 'leafeon', 'whimsicott'].slice(2), 2, [moment('You met a rare Grass-type in the Hidden Grove.', 55)])),
    ch('Leave it in peace.', out('You back out of the grove without a sound. Some things are better kept secret.', ...kind())),
  ]),
  E('stormy-sea', 'Huge waves, and a fishing boat caught on the rocks off the point, its crew clinging to the wheelhouse.', [
    ch('Rescue the crew.', out('Your Water-type swims a line out through the surf and back, and one by one the crew come ashore along it, half drowned, alive. The captain holds your hand in both of his and cannot say anything at all.', rep(1), ...kind(2), fr(5, { types: ['water'] }), moment('You saved a boat\'s crew from the storm.', 65)), { requires: [ptype('water')] }),
    ch('Wait for calm.', out('You wait. By morning the sea is flat. The crew are on the rocks, cold and furious, and alive.', takeNode())),
  ]),
  E('w4-arcade-cabinet', 'An old arcade cabinet in the corner of a closed-down café, still running, still blinking INSERT 100.', [
    ch('Play.', out('You play until your thumbs hurt. A high score. You put your initials on the board. It says FOREVER at the top. You hope it means it.', $(-100), flag('arcade-high-score')), { requires: [money(100)] }),
    ch('Look behind it.', out('Behind it, in the warm tangle of wires: a Porygon, living in the machine, keeping it running. It blinks at you. It has been lonely.', join({ species: ['porygon'] }))),
  ]),
  E('w4-avalanche', 'A crack from the peak, like a gun, and then a roar: the whole slope is coming down toward you.', [
    ch('Run for the village.', out('You run. The snow comes behind you like a wall. You make it into the village square as the avalanche stops at the last house, and the whole Snowbound Village comes out to see.', hurt(0.05), flag('snowbound-village'))),
    ch('Shelter behind rocks.', out('You throw yourselves behind a boulder as the slope thunders past. When it is over you dig out, and the nearest roof is the Snowbound Village.', hurt(0.1), flag('snowbound-village'))),
    ch('Use a Rock-type.', out('Your Rock-type plants itself and the snow splits around it. You walk down the clear path behind, to the Snowbound Village.', flag('snowbound-village'), fr(3, { types: ['rock'] })), { requires: [ptype('rock')] }),
  ]),
  E('wx-avalanche-warning', 'A warning sign at the foot of a snowy slope, and as you read it, a crack from the peak above.', [
    ch('Run for the village.', out('You run. The snow stops at the edge of a village you did not know was there: the Snowbound Village.', hurt(0.05), flag('snowbound-village'))),
    ch('Shelter behind rocks.', out('You shelter as it roars past. When it is quiet, the Snowbound Village is below you.', hurt(0.1), flag('snowbound-village'))),
    ch('Use a Rock-type.', out('Your Rock-type holds the snow back long enough. The Snowbound Village is just down the hill.', flag('snowbound-village')), { requires: [ptype('rock')] }),
  ]),
  ...['w4-berry-tree', 'berry-patch'].map((id) => E(id, 'A tree so heavy with fruit its branches touch the ground. Something is rustling in the top branches.', [
    ch('Shake it.', out('Berries rain down, and with them a Skwovet, cheeks so full it cannot close its mouth. It looks at you, outraged, then at the Berries, then decides to share. Berries for both of you.', any(...BERRIES), any(...BERRIES), fr(2))),
    ch('Climb it.', out('You climb up and meet the Skwovet face to face. It offers you a Berry from its cheek. You accept it, because it would be rude not to.', any(...BERRIES), join({ species: ['skwovet'] }))),
    ch('Wait.', out('You wait. The Skwovet comes down on its own, and drops a Berry at your feet, and runs back up.', any(...BERRIES))),
  ])),
  E('w4-echo-chamber', 'A sealed crystal room in the rock, its walls clear as glass and humming, very faintly, a note you almost recognise.', [
    ch('Sing into it.', out('You sing the note back. The crystal hums louder, and louder, until the whole hill is singing, and somewhere not far away a way into the Crystal Hollow opens.', later('crystal-hollow-entrance', 1), rp(2))),
    ch('Leave.', out('You leave the crystal humming to itself.')),
  ]),
  E('w4-lantern-parade', 'At midnight, Ghost-types come down the road carrying lanterns, humming a tune with no words, a long slow procession going somewhere.', [
    ch('Walk with them.', out('You fall in at the back. Nobody minds. You walk with them through the night to a place where they put all their lanterns down together, and the Midnight Parade is something you will never quite be able to describe.', flag('midnight-parade'), bond(1), moment('You walked in the Midnight Parade of the ghosts.', 60))),
    ch('Watch.', out('You watch from the hedge until the last lantern has gone by.', fr(2, { types: ['ghost'] }))),
  ]),
  E('w4-lightning-rod', 'An iron rod on a hilltop, black against storm clouds that are piling up fast. Thunderstorm Ridge. The hair on your arms stands up.', [
    ch('Wait for the strike.', out('You wait well back. The lightning hits the rod with a sound like the sky tearing, and in the flash, for an instant, you see wings of yellow fire. When you can see again, there is a gem at the foot of the rod, still crackling.', flag('sign-zapdos'), item('electric-gem'))),
    ch('Climb it.', out('You climb a few feet and every hair on your body stands up and you climb down again very fast. Your lead is laughing at you.', hurtLead(0.05))),
  ]),
  E('w4-low-tide', 'Rock pools at low tide, each one a little world: anemones, crabs, a starfish, things glinting in the weed.', [
    ch('Search.', out('You turn over weed and stones, gently, putting everything back. In the deepest pool: a lump of shoal salt and a shell that rings like a bell.', item('shoal-salt'), item('shell-bell'))),
    ch('Watch the pools.', out('You sit and watch until the tide comes back in. A Corphish waves at you, or at something.', heal(0.2))),
  ]),
  E('world-festival', 'A town in festival: lanterns, stalls, a stage with someone singing badly and happily, the whole square full.', [
    ch('Join in.', out('You join in. You eat everything. You dance with a stranger. Your team gets fed by every stall. It is a festival.', heal(0.5), bond(1), $(-50))),
    ch('Pass through.', out('You pass through the noise and out the far side.')),
  ]),
  E('world-lighthouse-beacon', 'A dark lighthouse on the cliff. Its lamp should be lit. It is not. Ships are out there.', [
    ch('Light the lamp.', out('You climb the stairs and light the great lamp, and out on the sea a ship that was heading for the rocks turns, slowly, away. Bill\'s Lighthouse is lit again.', flag('lighthouse-lit'), rep(1), ...kind())),
    ch('Look inside.', out('In the keeper\'s room, Bill\'s notes, everywhere: diagrams of Pokémon storage, a coffee ring on every page. One page is just "WHY DOES IT KEEP TURNING ME INTO A CLEFAIRY".', rp(3), flag('bill-notes'))),
  ]),
  E('r113-butterfree-migration', 'A flock of Butterfree, hundreds, lost in a crosswind and blown about the sky, scattering.', [
    ch('Guide them (a Flying-type).', out('Your Flying-type rises into the wind and the Butterfree follow it, all of them, a river of wings, north. Flight North will remember this.', flag('flight-north-bug-sign'), fr(5, { types: ['flying'] }), moment('Your Flying-type led the lost Butterfree north.', 60)), { requires: [ptype('flying')] }),
    ch('Wait.', out('You wait for the wind to drop. When it does, the Butterfree find their way, eventually, all but a few.')),
  ]),
  E('r117-moonlit-pond-dance', 'Below Mt. Moon, Clefairy dancing round a silver pool under the full moon, a slow, careful dance.', [
    ch('Join the ring.', out('You step into the ring and dance, badly, carefully. The Clefairy take your hands. When the moon sets, one of them presses a stone into your palm: a Moon Stone.', item('moon-stone'), bond(1))),
    ch('Watch.', out('You watch until the moon goes down. Nobody notices you. It is perfect.', heal(0.2))),
  ]),
  E('r139-hot-air-balloon-hatch', 'A hot-air balloon, half inflated, sagging in a field. Its pilot is red in the face. "I need wings to lift it, or heat."', [
    ch('Use a Flying-type.', out('Your Flying-type grabs the rope and lifts, and the balloon rises, and you rise with it, and the land goes by below you for two stops.', express(), express()), { requires: [ptype('flying')] }),
    ch('Use a Fire-type to heat it.', out('Your Fire-type breathes into the balloon and it swells and rises. You float over two stops of country, the pilot singing.', express(), express()), { requires: [ptype('fire')] }),
  ]),
  E('r143-tadpole-parade', 'Poliwag in neat rows, marching to the pond. One of them has fallen into a ditch and is crying, wriggling, and the parade marches on without it.', [
    ch('Lift it out.', out('You lift it out and set it down at the very front of the parade. It marches the rest of the way at the head of everyone, chest out. At the pond the Poliwag cheer: Poli-Pond is open to you now.', flag('poli-pond'), ...kind())),
    ch('Cheer the parade.', out('You cheer the parade. The one in the ditch climbs out on its own, in the end, and runs to catch up.')),
  ]),
  E('r150-smeargle-gallery', 'A Smeargle\'s gallery: a hundred painted rocks laid out on the grass. It looks your party up and down with its tail raised like a brush.', [
    ch('Pose.', out('You pose, the whole team, very still. It paints fast. The rock it gives you is your team exactly, and somehow better.', flag('smeargle-portrait'), fr(2))),
    ch('Buy a rock. (100)', out('You choose a painted rock. It is of a sunset. The Smeargle wraps it in a leaf, and ties a little bell to the string so it rings when your team walks.', $(-100), item('soothe-bell')), { requires: [money(100)] }),
  ]),
  E('r153-bibarel-dam', 'A Bibarel heaving a log across a stream, and behind the half-built dam, a hillside of burrows about to flood.', [
    ch('Help it.', out('You haul logs with it until the dam holds. The burrows stay dry. The village of Bidoof that lives in them comes out to look at you, and the Bibarel follows you when you go.', join({ species: ['bibarel'] }), ...kind())),
    ch('Use a Water-type to drain.', out('Your Water-type drinks the flood down and diverts the rest. The Bibarel slaps its tail in thanks.', fr(3, { types: ['water'] })), { requires: [ptype('water')] }),
  ]),
  E('r163-sneasel-thieves', 'Sneasel drop out of the trees, snatch at your bag, and are off before you can shout.', [
    ch('Chase.', out('You chase them all the way to the Day-Care, where they live under the floor and come out at night. The night-shift keeper gives you back your things and a cup of tea, and introduces you to every Sneasel by name.', flag('daycare-night-shift'), rp(1))),
    ch('Let them go.', out('You let them go. They took Berries. They are welcome to them.', lose('oran-berry'))),
  ]),
  E('r172-trubbish-dump-diving', 'A mountain of trash, and a Trubbish on every ridge, digging, sorting, sliding down.', [
    ch('Dig.', out('You dig through the trash beside them. They show you the good stuff. They know where everything is.', any('nugget', 'pp-up', 'rare-bone', 'big-mushroom'))),
    ch('Talk to the biggest.', out('The biggest Trubbish sits on the top of the heap like a king. It has been waiting for someone to take it seriously. You do. It is the Trubbish nobody wanted, and now somebody does.', join({ species: ['trubbish'] }), flag('trubbish-nobody-wanted'))),
  ]),
  ...['slumbering-snorlax', 'sleeping-giant'].map((id) => E(id, 'Snoring that shakes the ground. A Snorlax, asleep across the road, a whole bush of Berries on its belly.', [
    ch('Look closer.', fightW('You lean in close. One eye opens.', ['snorlax'], 2, [flag('snorlax-woke')])),
    ch('Go round.', out('You go round. It takes a while. It is a big Snorlax.', takeNode())),
  ])),
  ...['stampede', 'wild-stampede-2'].map((id) => E(id, 'A herd thundering down the valley toward you: Tauros, Bouffalant, dust a mile high. The Deep Savanna.', [
    ch('Stand firm (a Rock-type).', out('Your Rock-type plants itself in front of you and the herd parts around it like water round a stone. You stand in the eye of a stampede and it is the loudest silence you have ever heard.', fr(3, { types: ['rock'] }), moment('You stood firm in a stampede.', 55)), { requires: [ptype('rock')] }),
    ch('Run.', out('You run. You make it. Mostly.', hurt(0.1))),
    ch('Ride it.', out('You grab a horn and swing up, somehow, and ride a Tauros halfway across the savanna before it throws you into a soft bit of grass. Your team is beside itself.', hurt(0.05), bond(1))),
  ])),
];
// The old Treasure Dig delve (dungeons.json) merges into the expedition and the w4 dig site above (SF129); its rooms are never drawn again.
export const REMOVE: string[] = ['dg-treasure-dig-a', 'dg-treasure-dig-b', 'dg-treasure-dig-c'];
