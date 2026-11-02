// Run events C, batch A (R111-R145): wild Pokémon scenes (docs/ideas/categories/r-c-wild-pokemon-scenes.md).
// Skipped, already built: R114 (mudslide-rescue), R115 (w4-cave-echo), R125 (ditto-impostor), R127 (abandoned-nest).
// Added to events.json by tools/build-wild-scenes-events.ts. Buffs use blessings (3 battles) or items, never new rules.
import { $, any, ch, ev, fight, fr, good, heal, hurt, item, join, leave, lose, lv, out, ptype, rest, rp, scout, status, wild, egg, express, type Json, BERRIES, STONES, TREASURE, HELD, money } from './dsl.ts';

const G = 'Wild Scenes';
const bless = (id: string): Json => ({ kind: 'blessing', id });
const NOTHING = (t = 'You leave it be and walk on.') => leave(t);
const hasItem = (id: string): Json => ({ kind: 'item', id });

export const WILD_SCENES_A: Json[] = [
  ev('r111-sandslash-colony', 'Sunbathing Sandslash Colony', G, { rarity: 'common', minStage: 1, types: ['ground'], pokemon: 'sandslash', effect: 'glint', tint: '#3a3018' },
    'A colony of Sandslash lies on warm rocks, spines flat, eyes shut. Small things glint in the dust around them.', [
      ch('Sneak past quietly', out('You tiptoe through and pocket a few things they left lying about.', any('soft-sand', 'hard-stone', 'star-piece'), any(...BERRIES)), { check: 'speed', fail: fight('A spine twitches. One of them wakes up, grumpy.', wild({ species: ['sandslash', 'sandshrew'], lv: 0, win: [any(...BERRIES)] })) }),
      ch('Wake one up on purpose', fight('One rolls over and blinks at you. It is sleepy and easy to catch.', wild({ species: ['sandslash', 'sandshrew'], lv: -2, win: [rp(15)] }))),
      ch('Leave them to it', NOTHING()),
    ]),
  ev('r112-pond-choir', 'Pond Choir', G, { rarity: 'uncommon', minStage: 1, types: ['water'], pokemon: 'politoed', effect: 'sparkle', tint: '#102838' },
    'Frogs, ducks and Poliwag fill a pond with a round of song. It rolls over the water, warm and slow.', [
      ch('Join in the chorus', out('Your whole team sings along. Everyone steps out calmer than they went in.', bless('blessing-clarity'), fr(3)), { check: 'charisma', fail: out('You are off-key. The pond goes quiet and a little embarrassed.', fr(-1)) }),
      ch('Listen from the bank', out('A quiet moment by the water.', heal(0.2), fr(1))),
      ch('Skip it', NOTHING()),
    ]),
  ev('r113-butterfree-migration', 'Butterfree Migration Detour', G, { stop: 'detour', rarity: 'uncommon', minStage: 1, types: ['bug', 'flying'], pokemon: 'butterfree', effect: 'float', tint: '#2a2a3a' },
    'A great flock of Butterfree drifts across the road, lost in the wind. The path itself is blocked by wings.', [
      ch('Guide the flock', out('Your team herds them over the ridge. They shower the road with glittering powder.', any('silverpowder', 'brightpowder'), fr(2), good(2)), { check: 'charisma', fail: out('They scatter in every direction. You get a handful of powder anyway.', any('silverpowder', 'brightpowder')) }),
      ch('A Flying-type leads the way', out('It shows them the way. A pale powder rains down in thanks.', item('silverpowder'), fr(2), good(2)), { requires: [ptype('flying')] }),
      ch('Wait it out', out('You sit for a while until the sky clears.', rest())),
    ]),
  ev('r116-frozen-statue-garden', 'Frozen Statue Garden', G, { rarity: 'rare', minStage: 2, types: ['ice'], effect: 'snow', tint: '#1c2a3a' },
    'A garden of ice statues, each in a different pose. Some of them are breathing.', [
      ch('Thaw them with a Fire-type', out('One by one the statues thaw. The living ones shake themselves off and hurry over to thank you.', join({ types: ['ice', 'water', 'normal'], lv: 0 }), fr(2), good(2)), { requires: [ptype('fire')] }),
      ch('Chip them out by hand', out('Slow, careful work. You free one that was really there.', join({ types: ['ice'], lv: 0 }), good(1)), { check: 'intelligence', fail: fight('You crack the wrong one, and it was alive.', wild({ types: ['ice'], lv: 1, win: [any('nevermeltice', 'ice-stone')] })) }),
      ch('Admire and go', NOTHING('The statues stand quietly in the snow.')),
    ]),
  ev('r117-moonlit-pond-dance', 'Moonlit Pond Dance', G, { rarity: 'rare', minStage: 2, types: ['fairy'], pokemon: 'clefable', effect: 'sparkle', tint: '#1c1c3a' },
    'Clefairy hold hands in a ring under the moon, dancing around a pool of silver light. They gesture for you to join.', [
      ch('Join the dance', out('Your Pokémon dance until dawn. A Moon Stone glows in the grass afterwards.', item('moon-stone'), fr(3), bless('blessing-bloom')), { check: 'charisma', fail: out('You trip over your own feet. They laugh, kindly.', fr(1)) }),
      ch('A Fairy-type dances in your place', out('It twirls with the ring. When the moon sets, it has a new glow.', item('moon-stone'), fr(4, 'lead')), { requires: [ptype('fairy')] }),
      ch('Watch from the trees', out('A moment of pure moonlight.', heal(0.3))),
    ]),
  ev('r118-honey-tree-hunt', 'Honey Tree Hunt', G, { rarity: 'common', minStage: 1, types: ['bug'], pokemon: 'combee', effect: 'float', tint: '#3a3010' },
    'A smear of honey on a trunk draws a cloud of Combee. A big, sweet hive hangs high in the branches.', [
      ch('Lure the Combee with sweets', out('The Combee swarm around you, happy. One follows you out.', join({ species: ['combee'], lv: 0 }), any('honey', 'berry-juice'), $(-100)), { requires: [money(100)], chance: 0.7, fail: fight('A Beedrill drone buzzes in. The hive was its.', wild({ species: ['beedrill', 'vespiquen'], lv: 0, win: [item('honey')] })) }),
      ch('Smash the hive down', fight('The hive splits and a furious swarm pours out.', wild({ species: ['beedrill', 'combee', 'vespiquen'], lv: 1, chain: 2, win: [any('honey', 'berry-juice'), rp(20)] }))),
      ch('Leave the hive', NOTHING()),
    ]),
  ev('r119-aipom-troop', 'Aipom Pickpocket Troop', G, { rarity: 'uncommon', minStage: 1, types: ['normal'], pokemon: 'aipom', effect: 'shake', tint: '#2a2218' },
    'A troop of Aipom drops from the branches. Your bag is suddenly a little lighter.', [
      ch('Chase the one with your item', out('You run it down, and it hands your item back with a shrug. It has something extra, too.', any(...BERRIES), fr(1)), { check: 'speed', fail: out('They all vanish into the trees. Something is missing.', lose()) }),
      ch('Send a Flying-type after it', out('It brings back your item and a fine trophy.', any(...HELD), fr(2, 'lead')), { requires: [ptype('flying')] }),
      ch('Let it go', out('They keep the item. You keep your temper.', lose(), good(1))),
    ]),
  ev('r120-magikarp-splash', 'Magikarp Splash Contest', G, { rarity: 'common', minStage: 1, types: ['water'], pokemon: 'magikarp', effect: 'rain', tint: '#143040' },
    'A pond full of Magikarp is holding a contest to see who can make the biggest splash. You are asked to judge.', [
      ch('Cheer the biggest splasher', out('The winner pops up, delighted, and nudges a prize your way.', any('pearl', 'big-pearl', 'fresh-water'), rp(15)), { check: 'luck', fail: out('The wrong one wins and the pond sulks.', fr(-1)) }),
      ch('A Water-type makes the biggest splash', out('It launches the largest splash of the day. The pond roars.', any('big-pearl', 'water-stone'), good(1)), { requires: [ptype('water')] }),
      ch('Walk on', NOTHING()),
    ]),
  ev('r121-mystic-spring', 'Mystic Spring', G, { rarity: 'uncommon', minStage: 1, types: ['water', 'fairy'], effect: 'sparkle', tint: '#102a3a' },
    'A small spring bubbles in a mossy bowl, cold and clear. The water has a faint sheen that is not quite natural.', [
      ch('Everyone drinks', out('The water tastes of mint and lightning. Everyone stands a little straighter.', bless('blessing-hearth'), heal(0.3)), { chance: 0.6, fail: out('Something in the water disagrees with the team.', status('poison')) }),
      ch('Bottle some for later', out('A bottle of spring water goes into the bag.', item('fresh-water'))),
      ch('Do not risk it', NOTHING()),
    ]),
  ev('r122-sandstorm-burrow', 'Sandstorm Burrow', G, { rarity: 'common', minStage: 1, types: ['ground', 'rock'], pokemon: 'dugtrio', effect: 'fog', tint: '#3a3018' },
    'A sandstorm closes in. A wide burrow yawns in a dune, deep enough to wait it out.', [
      ch('Wait it out in the burrow', out('You hunker down until the storm blows over. The burrow smells of old berries.', rest(), any(...BERRIES))),
      ch('Push on through the storm', out('You grit your teeth and make it through, scraped and sandy.', hurt(0.1), rp(25), scout(2))),
      ch('Dig the burrow wider with a Ground-type', out('It digs the burrow wide enough for everyone, and strikes a fossil.', rest(), any('old-amber', 'helix-fossil', 'dome-fossil')), { requires: [ptype('ground')] }),
    ]),
  ev('r123-fireflies-dusk', 'Fireflies at Dusk', G, { rarity: 'uncommon', minStage: 1, types: ['bug'], pokemon: 'volbeat', effect: 'glint', tint: '#1c2a14' },
    'Volbeat and Illumise weave glowing patterns above the grass. The lights point somewhere, over and over.', [
      ch('Follow the lights', out('They lead you up to a ledge no map shows. A little cache sits under a root.', scout(4), any(...TREASURE)), { check: 'intelligence', fail: out('You lose the pattern in the dark but find a quiet spot.', heal(0.15)) }),
      ch('Copy the dance', out('The fireflies pause, then flock round your team and wave a little glow over them.', fr(3), bless('blessing-bloom'))),
      ch('Enjoy the show', out('Everyone watches in silence.', heal(0.15))),
    ]),
  ev('r124-rival-pack-territory', 'Rival Pack Territory', G, { rarity: 'uncommon', minStage: 2, types: ['normal', 'dark'], pokemon: 'mightyena', effect: 'rattle', tint: '#2a1c14' },
    'Two wild packs stand nose to nose across a clearing, hackles up. They both turn to look at you.', [
      ch('Back the big pack', fight('The bigger pack bounds over, delighted. The other snarls and charges.', wild({ species: ['mightyena', 'poochyena', 'houndoom'], lv: 0, win: [any(...HELD), rp(20)] }))),
      ch('Back the little pack', fight('The underdogs surge forward. The big pack sizes you up.', wild({ species: ['lillipup', 'herdier', 'growlithe'], lv: 1, win: [join({ species: ['lillipup', 'poochyena', 'growlithe'], lv: 0 })] }))),
      ch('Calm them both', out('You stand between them until both packs lose interest.', good(2), fr(2)), { check: 'charisma', fail: out('Both packs snap at you before backing off.', hurt(0.1)) }),
    ]),
  ev('r126-hatching-hot-spring', 'Hatching Hot Spring', G, { rarity: 'uncommon', minStage: 1, types: ['fire', 'water'], pokemon: 'slugma', effect: 'fog', tint: '#2a1c14' },
    'Eggs sit in a steaming shallow, warmed by the spring. A Slugma watches over them without much interest.', [
      ch('Take one for a berry', out('You leave a berry in its place and carry an egg off.', egg({ lv: 0, left: 2 }), lose('oran-berry')), { requires: [hasItem('oran-berry')] }),
      ch('Soak the team instead', out('A quiet soak. Everyone is lighter for it.', heal(0.5), fr(1))),
      ch('Leave the eggs alone', NOTHING()),
    ]),
  ev('r128-shed-skin-garden', 'Shed Skin Garden', G, { rarity: 'common', minStage: 1, types: ['poison'], pokemon: 'arbok', effect: 'glint', tint: '#241a2a' },
    'Ekans and Arbok have shed skins all through a garden. Odd little trinkets are caught in them.', [
      ch('Sift the skins', out('You find a Cleanse Tag, snagged in a skin.', item('cleanse-tag'), rp(10))),
      ch('Collect them all', out('A bag of skins and trinkets. Not much, but not nothing.', any('cleanse-tag', 'smoke-ball', 'big-mushroom'), $(200)), { chance: 0.6, fail: out('An Arbok was still wearing one. It is not amused.', status('poison')) }),
      ch('Leave them be', NOTHING()),
    ]),
  ev('r129-slumbering-hollow-chorus', 'Slumbering Hollow Chorus', G, { rarity: 'uncommon', minStage: 2, types: ['normal', 'psychic'], pokemon: 'jigglypuff', effect: 'float', tint: '#2a1c3a' },
    'A hollow fills with a slow lullaby from a ring of Jigglypuff and Chingling. Your eyelids are getting heavy.', [
      ch('Plug your ears and keep walking', out('You stumble through. Nobody falls asleep, and the singing fades.', fr(1)), { check: 'intelligence', fail: out('The tune gets through. The team naps for a while.', status('sleep'), rest()) }),
      ch('Counter with a Dark-type', out('It hums over the lullaby. The singers blink and go quiet, impressed.', fr(3), rp(20)), { requires: [ptype('dark')] }),
      ch('Fall asleep on purpose', out('You sleep soundly. The team wakes rested.', rest(), heal(0.6))),
    ]),
  ev('r130-drifting-wingull-island', 'Drifting Island of Wingull', G, { stop: 'detour', rarity: 'uncommon', minStage: 1, types: ['flying', 'water'], pokemon: 'wingull', effect: 'float', tint: '#143040' },
    'A chain of gulls hovers over a gap in the road, wings spread. They look like a bridge, almost.', [
      ch('Ride the gulls across', out('They carry the party over in a single swoop. A shortcut!', express(), rp(15)), { check: 'speed', fail: out('The gulls drop you halfway. You scramble the rest.', hurt(0.08), express()) }),
      ch('A Flying-type leads the flock', out('It takes the head of the chain and carries everyone safely over.', express(), fr(2, 'lead')), { requires: [ptype('flying')] }),
      ch('Go the long way', NOTHING()),
    ]),
  ev('r131-rust-choir', 'Rust Choir', G, { rarity: 'uncommon', minStage: 2, types: ['steel', 'flying'], pokemon: 'skarmory', effect: 'rattle', tint: '#2a2a30' },
    'A scrap yard where Skarmory ring old metal like bells. Everything here is for the taking, if you can stand the noise.', [
      ch('Pick through the metal', out('Cheap, sharp-edged finds.', any('metal-coat', 'iron-ball', 'rocky-helmet'), $(150)), { chance: 0.7, fail: out('A Skarmory dives for its scrap. You drop most of it.', hurt(0.08)) }),
      ch('Sing along with the clanging', out('The choir takes you in. They share their best piece.', any('metal-coat', 'rocky-helmet'), fr(2)), { check: 'charisma', fail: out('Your voice cracks. They go quiet and nod.', rp(5)) }),
      ch('Walk on, ears ringing', NOTHING()),
    ]),
  ev('r132-zigzagoon-hunters', 'Zigzagoon Treasure Hunters', G, { rarity: 'common', minStage: 1, types: ['normal'], pokemon: 'zigzagoon', effect: 'shake', tint: '#2a2218' },
    'A Zigzagoon zips past with something shiny in its mouth. Its friends are close behind, looking guilty.', [
      ch('Give chase', out('You corner it. It drops its find, a real treasure, and trots away with a hopeful look.', any('nugget', 'star-piece', 'relic-gold'), rp(15)), { check: 'speed', fail: out('It zigs, you zag, it is gone.', rp(5)) }),
      ch('Trade it a berry', out('It happily swaps the shiny for a berry.', any(...TREASURE), lose('oran-berry')), { requires: [hasItem('oran-berry')] }),
      ch('Leave it', NOTHING()),
    ]),
  ev('r133-lapras-ferry', 'Lapras Ferry', G, { stop: 'detour', rarity: 'rare', minStage: 2, types: ['water', 'ice'], pokemon: 'lapras', effect: 'rain', tint: '#102838' },
    'A Lapras waits at the shore, singing softly. It looks at your berry pouch, then at the water.', [
      ch('Ride across for a berry', out('A smooth, quiet crossing.', express(), lose('oran-berry')), { requires: [hasItem('oran-berry')] }),
      ch('Ride across for a song', out('You hum back. It carries you for free.', express(), fr(2, 'lead')), { check: 'charisma', fail: out('Your song is not what it wanted. It sinks away.', rp(5)) }),
      ch('Walk around the lake', NOTHING()),
    ]),
  ev('r134-ember-pool', 'Ember Pool', G, { rarity: 'common', minStage: 1, types: ['fire'], pokemon: 'slugma', effect: 'fire', tint: '#3a1c0c' },
    'Slugma bathe in a glowing pool of warm stone and slow lava. Heat rolls off it in waves.', [
      ch('Let your Fire-types bathe', out('The Fire-types come out glowing. They are in fine form.', fr(3), bless('blessing-hearth')), { requires: [ptype('fire')] }),
      ch('Warm yourselves by the edge', out('A pleasant glow for everybody.', heal(0.3))),
      ch('Poke the pool', fight('A Slugma takes offence.', wild({ species: ['slugma', 'magcargo'], lv: 0, win: [any('charcoal', 'fire-stone')] }))),
    ]),
  ev('r135-plant-whisperer-grove', 'Plant Whisperer Grove', G, { rarity: 'uncommon', minStage: 1, types: ['grass'], pokemon: 'weepinbell', effect: 'sparkle', tint: '#142a14' },
    'Bellsprout sway in a perfect line, rustling a gentle chord. The air is thick with green.', [
      ch('Stay silent, and listen', out('The grove hums over you. Wounds close and tired legs ease.', heal(0.8), fr(2)), { check: 'intelligence', fail: out('A stray cough breaks the spell. They go still.', heal(0.2)) }),
      ch('Talk to them', out('You make conversation. They are offended, mildly.', fr(-1), hurt(0.05))),
      ch('Move on', NOTHING()),
    ]),
  ev('r136-rampaging-rhyhorn', 'Rampaging Rhyhorn', G, { rarity: 'uncommon', minStage: 1, types: ['ground', 'rock'], pokemon: 'rhyhorn', effect: 'rattle', tint: '#3a2a1c' },
    'The ground shakes. A Rhyhorn is charging down the road, head lowered, eyes blazing.', [
      ch('Dodge aside', out('You roll out of the way at the last moment. It crashes into a rock and sits there, dazed.', rp(15)), { check: 'speed', fail: out('It clips the party on the way past.', hurt(0.15)) }),
      ch('Take it head on', fight('You brace. The Rhyhorn slams in!', wild({ species: ['rhyhorn', 'rhydon'], lv: 1, win: [any('hard-stone', 'everstone'), rp(25)] }))),
      ch('Put it to sleep with a Grass-type', out('A lullaby of sweet pollen and the Rhyhorn tumbles to a gentle halt, snoring.', fr(2), good(1), any('soft-sand', 'hard-stone')), { requires: [ptype('grass')] }),
    ]),
  ev('r137-ghostly-fog-bank', 'Ghostly Fog Bank', G, { rarity: 'rare', minStage: 2, types: ['ghost'], pokemon: 'gastly', effect: 'fog', tint: '#1c1428' },
    'A fog bank rolls over the road. Shapes drift in it. They seem to want something from beyond the veil.', [
      ch('Throw a Spell Tag into the fog', fight('A Pokémon forms from the mist, grateful for the offering.', wild({ types: ['ghost'], lv: 1, win: [any('spell-tag', 'reaper-cloth', 'ghost-gem'), rp(20)] }), lose('spell-tag')), { requires: [hasItem('spell-tag')] }),
      ch('Call into the fog', out('Something calls back, softly. Nothing shows itself.', rp(10))),
      ch('Hold your breath and go through', out('You hurry through the chill. It follows a while.', hurt(0.08)), { chance: 0.7, fail: out('Cold fingers snatch at the bag.', lose()) }),
    ]),
  ev('r138-feral-furfrou-salon', 'Feral Furfrou Salon', G, { rarity: 'uncommon', minStage: 1, types: ['normal'], pokemon: 'furfrou', effect: 'sparkle', tint: '#2a2030' },
    'A wild Furfrou with a wildly overgrown coat. It is watching your Pokémon with enormous eyes and holding out a comb.', [
      ch('Groom it neatly', out('It prances. A tidy trim, and a gift from a pleased Furfrou.', any('silk-scarf', 'pink-scarf', 'shiny-stone'), fr(2), rp(15)), { check: 'charisma', fail: out('A crooked cut! It stalks off in a huff.', fr(-1)) }),
      ch('Give it a wild style', out('A magnificent mess. It adores it.', any('sweet-heart', 'lava-cookie'), good(1))),
      ch('Not a groomer', NOTHING()),
    ]),
  ev('r139-hot-air-balloon-hatch', 'Hot Air Balloon Hatch', G, { stop: 'detour', rarity: 'rare', minStage: 2, types: ['flying'], pokemon: 'drifblim', effect: 'float', tint: '#3a2a14' },
    'An old balloon sits half-inflated beside a hatch in the sky-road. A Pokémon with wings would be needed to lift it.', [
      ch('A Flying-type pulls it up', out('It beats its wings and the balloon rises through the clouds. You see far, and skip ahead.', express(), scout(4)), { requires: [ptype('flying')] }),
      ch('Light the burner yourself', out('A hot, bumpy ascent. A short hop ahead.', express(), hurt(0.05)), { check: 'intelligence', fail: out('The burner sputters out. You walk away with singed eyebrows.', hurt(0.08)) }),
      ch('Leave the balloon', NOTHING()),
    ]),
  ev('r140-scarecrow-cornfield', 'Scarecrow Cornfield', G, { rarity: 'uncommon', minStage: 2, types: ['ghost', 'grass'], pokemon: 'phantump', effect: 'shake', tint: '#2a2410' },
    'A tall scarecrow in the middle of the cornfield turns its head to look at you. It is not stuffed with straw. It is a Ghost.', [
      ch('Fight it', fight('The scarecrow topples off its post with a cackle.', wild({ types: ['ghost', 'grass'], lv: 1, win: [any('spell-tag', 'miracle-seed'), rp(20)] }))),
      ch('Befriend it', out('You leave it a snack. It follows at a distance, then closer.', join({ species: ['phantump', 'pumpkaboo'], lv: 0 }), lose()), { check: 'charisma', fail: out('It stares at you a long time, then folds into the corn.', rp(5)) }),
      ch('Tip your hat and walk on', NOTHING()),
    ]),
  ev('r141-starlit-cave-loomians', 'Starlit Cave Loomians', G, { rarity: 'rare', minStage: 2, types: ['rock', 'fairy'], pokemon: 'minccino', effect: 'glint', tint: '#14182a' },
    'Glowing little shapes bob through a cave like stars. They lead the eye deep into the dark.', [
      ch('Follow the lights', out('They lead you to a chamber of glittering stone. A small stash sits at its heart.', any(...TREASURE), any(...STONES)), { check: 'luck', fail: out('The lights vanish. You find your way out again, a little shaken.', hurt(0.05)) }),
      ch('Call out softly', out('A few tiny shapes approach and nuzzle the party.', fr(2), heal(0.2))),
      ch('Stay out of the cave', NOTHING()),
    ]),
  ev('r142-boulder-boxing-ring', 'Boulder Boxing Ring', G, { rarity: 'uncommon', minStage: 2, types: ['rock', 'fighting'], pokemon: 'machoke', effect: 'rattle', tint: '#2a2218' },
    'Rock-types spar in a ring made of boulders. The reigning champ points at you, then at the mat.', [
      ch('Challenge the champ', fight('The champ cracks its knuckles and steps up.', wild({ types: ['rock', 'fighting'], lv: 2, win: [item('muscle-band'), rp(30)] }))),
      ch('Spar with a junior', out('A friendly bout. Everyone learns something.', lv(1, 'party'), fr(1)), { check: 'strength', fail: out('You are outmatched, but it is all in good fun.', hurt(0.05)) }),
      ch('Watch from the ropes', out('A good show.', rp(10))),
    ]),
  ev('r143-tadpole-parade', 'Tadpole Parade', G, { rarity: 'common', minStage: 1, types: ['water'], pokemon: 'poliwag', effect: 'float', tint: '#142a38' },
    'A line of Poliwag marches down the bank in neat rows, spiral bellies spinning. One of them has wandered into a ditch.', [
      ch('Guide the parade home', out('They reach the pond safely. The leader brings you a glittering stone in thanks.', item('water-stone'), good(2), fr(2)), { check: 'charisma', fail: out('They scatter, but a few remember to thank you.', rp(15)) }),
      ch('Help the lost one', out('You lift it out of the ditch and carry it to the line.', fr(2), good(1), rp(10))),
      ch('Let them be', NOTHING()),
    ]),
  ev('r144-dewdrop-meadow', 'Dewdrop Meadow', G, { rarity: 'common', minStage: 1, types: ['grass', 'poison'], pokemon: 'oddish', effect: 'sparkle', tint: '#1c2a20' },
    'Oddish bathe in the morning dew, leaves glistening. The grass is heavy with it.', [
      ch('Collect the dew', out('A few drops of pure dew, bottled.', any('fresh-water', 'soul-dew', 'tidal-bell')), { chance: 0.5, fail: out('The dew is just water, but nice.', item('fresh-water')) }),
      ch('Bathe with them', out('The Oddish sing happily. Everyone is refreshed.', heal(0.4), fr(1))),
      ch('Leave them', NOTHING()),
    ]),
  ev('r145-bonsly-standoff', 'Bonsly Stand-Off', G, { rarity: 'common', minStage: 1, types: ['rock'], pokemon: 'bonsly', effect: 'shake', tint: '#2a2418' },
    'A lone Bonsly stands in the middle of a narrow bridge. It will not move. It will not say why.', [
      ch('Play with it', out('You toss a stone back and forth. It laughs, delighted, and scurries aside.', fr(1), rp(10), any(...BERRIES))),
      ch('Carry it off the bridge', out('It squeaks the whole way. It is surprisingly heavy.', hurt(0.04), fr(1))),
      ch('Push it', fight('That did not go over well.', wild({ species: ['bonsly', 'sudowoodo'], lv: 0, win: [rp(10)] }))),
    ]),
];
