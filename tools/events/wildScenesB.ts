// Run events C, batch B (R146-R180): wild Pokémon scenes (docs/ideas/categories/r-c-wild-pokemon-scenes.md).
// Skipped, already built: R147 (chimecho-wind-rest). Added to events.json by tools/build-wild-scenes-events.ts.
// Buffs use blessings (3 battles) or items, never new rules. R159's "badge shard" has no item: it pays a better next draft + a gym preview.
import { $, any, ch, ev, fight, fr, good, heal, hurt, item, join, leave, lose, lv, out, ptype, rest, rp, scout, status, wild, egg, flag, flagIs, better, gym, reveal, at, type Json, BERRIES, STONES, TREASURE, HELD, money } from './dsl.ts';

const G = 'Wild Scenes';
const bless = (id: string): Json => ({ kind: 'blessing', id });
const NOTHING = (t = 'You leave it be and walk on.') => leave(t);
const hasItem = (id: string): Json => ({ kind: 'item', id });
const GEMS = ['normal-gem', 'fighting-gem', 'flying-gem', 'poison-gem', 'ground-gem', 'rock-gem', 'bug-gem', 'ghost-gem', 'steel-gem', 'fire-gem', 'water-gem', 'grass-gem', 'electric-gem', 'psychic-gem', 'ice-gem', 'dragon-gem', 'dark-gem', 'fairy-gem'];

export const WILD_SCENES_B: Json[] = [
  ev('r146-wailmer-whale-song', 'Wailmer Whale Song', G, { rarity: 'rare', minStage: 2, types: ['water'], pokemon: 'wailord', effect: 'rain', tint: '#0c2038' },
    'Far out on the water a Wailmer pod sings a low, rolling song. A chord is missing, and they seem to be waiting for someone to supply it.', [
      ch('Sing the missing note', out('The chord rings out across the sea. The pod answers, and a deeper voice joins from far below. Rumour says something ancient stirs out there.', rp(40), fr(2), flag('wailmer-song')), { check: 'charisma', fail: out('A flat note. The pod goes quiet.', fr(-1)) }),
      ch('Let a Water-type lead the song', out('It finds the chord on the first try. The sea answers.', rp(40), fr(3, 'lead'), flag('wailmer-song')), { requires: [ptype('water')] }),
      ch('Just listen', out('You drift on the music for a while.', heal(0.2))),
    ]),
  ev('r148-paras-mushroom-patch', 'Paras Mushroom Patch', G, { rarity: 'common', minStage: 1, types: ['bug', 'grass'], pokemon: 'parasect', effect: 'sparkle', tint: '#2a2018' },
    'A damp patch of mushrooms with a Paras tending each cluster. Some are fine. Some are not.', [
      ch('Pick carefully', out('Good mushrooms only. You know your fungi.', any('tinymushroom', 'big-mushroom', 'balmmushroom')), { check: 'intelligence', fail: out('One of them was not what it looked like.', status('poison')) }),
      ch('Pick the biggest', out('A great fat mushroom, and it is a good one.', item('big-mushroom')), { chance: 0.5, fail: out('Toxic! The team feels it quickly.', status('poison')) }),
      ch('Leave the patch', NOTHING()),
    ]),
  ev('r149-pikachu-static-storm', 'Pikachu Static Storm', G, { rarity: 'uncommon', minStage: 1, types: ['electric'], pokemon: 'pikachu', effect: 'flicker', tint: '#3a3a10' },
    'A field full of Pikachu crackles with static. Sparks leap from tail to tail, and your hair stands on end.', [
      ch('Hold up a Cell Battery', out('The field charges it to the brim and gives back an extra.', item('cell-battery'), fr(2)), { requires: [hasItem('cell-battery')] }),
      ch('Charge through the storm', out('Zapped, but everyone comes out buzzing.', hurt(0.08), bless('blessing-hearth'), rp(15))),
      ch('Wait it out', out('The storm passes. The Pikachu settle, content.', fr(1))),
    ]),
  ev('r150-smeargle-gallery', 'Smeargle Gallery', G, { rarity: 'uncommon', minStage: 1, types: ['normal'], pokemon: 'smeargle', effect: 'sparkle', tint: '#2a2030' },
    'A Smeargle has set up an open-air gallery of tail-painted rocks. It eyes your party like a row of blank canvases.', [
      ch('Let it paint your party', out('A splash of colour for each. They look wonderful, and feel it.', bless('blessing-bloom'), fr(3), rp(15)), { check: 'charisma', fail: out('It paints a moustache on the lead. You are all quietly proud.', fr(1)) }),
      ch('Buy a painting', out('A fine small canvas for your pack.', any('star-piece', 'heart-scale', 'pink-scarf'), $(-150)), { requires: [money(150)] }),
      ch('Admire the gallery', out('A pleasant walk among the paintings.', rp(10))),
    ]),
  ev('r151-mimikyu-ruined-stage', 'Mimikyu Ruined Stage', G, { rarity: 'rare', minStage: 2, types: ['ghost', 'fairy'], pokemon: 'mimikyu', effect: 'flicker', tint: '#241830' },
    'A theatre stage lies in ruins, curtains in rags. A lone figure in a patched costume takes a bow to an empty house.', [
      ch('Applaud, then fight it', fight('The figure leaps down from the stage, delighted to have an audience.', wild({ species: ['mimikyu'], lv: 1, win: [any('spell-tag', 'reaper-cloth', 'fairy-feather'), rp(25)] }))),
      ch('Take a seat and watch', out('A short, strange, wonderful performance. It leaves you a keepsake at the end.', any('spell-tag', 'fairy-feather'), fr(2)), { check: 'charisma', fail: out('It senses you are not paying attention and the show stops.', rp(5)) }),
      ch('Leave quietly', NOTHING()),
    ]),
  ev('r152-dream-meadow-snooze', 'Dream Meadow Snooze', G, { rarity: 'common', minStage: 1, types: ['psychic', 'grass'], pokemon: 'munna', effect: 'float', tint: '#20203a' },
    'A meadow where every Pokémon is happily asleep. The grass is soft, and the air smells of cake.', [
      ch('Everyone naps', out('A deep, rich sleep. Eggs in your bag grow warm and restless.', rest(), heal(0.7), egg({ lv: 0, left: 2 }))),
      ch('Take a quick nap', out('A short sleep. Better than nothing.', heal(0.4))),
      ch('Stay on your feet', NOTHING()),
    ]),
  ev('r153-bibarel-dam', 'Bibarel Dam Builder', G, { rarity: 'uncommon', minStage: 1, types: ['water', 'rock'], pokemon: 'bibarel', effect: 'shake', tint: '#2a2418' },
    'A Bibarel is heaving a log up against a leaking dam, and the whole village of burrows behind it is about to flood.', [
      ch('Help fix the dam', out('Rock, mud and timber. The dam holds. The Bibarel press a gift on you.', any('hard-stone', 'mystic-water', 'damp-rock'), fr(2), good(2)), { check: 'strength', fail: out('The log rolls on you. The dam holds anyway.', hurt(0.08), good(1)) }),
      ch('A Rock or Water type shores it up', out('Perfect fit. The pond rises behind a sound dam, and the Bibarel treat everyone to their pantry.', any('hard-stone', 'mystic-water'), any(...BERRIES), good(2)), { requires: [ptype('rock')] }),
      ch('Not your dam', NOTHING()),
    ]),
  ev('r154-pokemon-parade-float', 'Pokémon Parade Float', G, { rarity: 'rare', minStage: 2, types: ['normal', 'fairy'], pokemon: 'pachirisu', effect: 'sparkle', tint: '#3a2a3a' },
    'A procession of wild Pokémon marches past with a flower-strewn float and a spot for each of your team.', [
      ch('Join the parade', out('Each Pokémon takes a spot and shines. The crowd cheers whoever stands out most.', lv(1, 'party'), fr(3), rp(20)), { check: 'charisma', fail: out('Someone steps on the wrong float. The crowd laughs, but warmly.', fr(1)) }),
      ch('Watch the float go by', out('A cheerful sight.', rp(10), heal(0.1))),
    ]),
  ev('r155-kecleon-bazaar', 'Kecleon Disguise Bazaar', G, { rarity: 'uncommon', minStage: 1, types: ['normal'], pokemon: 'kecleon', effect: 'flicker', tint: '#1c3a2a' },
    'A market stall run by a Kecleon. The wares shimmer, strangely. You are not sure any of them are what they look like.', [
      ch('Buy a stall item', out('The disguise slips off. You got something real.', any(...HELD), $(-300)), { requires: [money(300)], chance: 0.6, fail: out('The wares were illusions. Your money is gone and so is the stall.', $(-300)) }),
      ch('See through the illusions', out('You spot a real item behind the shimmer and take it with a wink.', any(...HELD, ...STONES), rp(10)), { check: 'intelligence', fail: out('The stall shimmers and is gone.', rp(5)) }),
      ch('Walk on', NOTHING()),
    ]),
  ev('r156-drowzee-dream-sale', 'Drowzee Dream Sale', G, { rarity: 'uncommon', minStage: 1, types: ['psychic'], pokemon: 'drowzee', effect: 'float', tint: '#241c3a' },
    'A Drowzee holds a hat out for berries. In exchange it offers a ticket into someone else\'s dream.', [
      ch('Pay a berry for a dream', out('You tumble into a strange, kind dream and wake up with a little more insight.', rp(35), fr(2), lose('oran-berry')), { requires: [hasItem('oran-berry')] }),
      ch('Haggle for a free sample', out('A short peek into a pleasant dream.', rp(15)), { check: 'charisma', fail: out('It eats the berry you offered and wanders off, yawning.', lose()) }),
      ch('Decline', NOTHING()),
    ]),
  ev('r157-cave-spider-silk', 'Cave Spider Silk Net', G, { rarity: 'uncommon', minStage: 1, types: ['bug'], pokemon: 'ariados', effect: 'net', tint: '#242424' },
    'A huge web of silk spans a chasm. The far side is lined with little treasures. The web is sticky and the drop is a long one.', [
      ch('Climb across', out('Hand over hand, you make it across and gather what you can.', any(...TREASURE), rp(20)), { check: 'strength', fail: out('You slip. The web catches you, and the spiders do not like it.', hurt(0.12)) }),
      ch('A Bug-type goes first', out('It strides across the web like a bridge and carries the haul back.', any(...TREASURE), any(...BERRIES), fr(2, 'lead')), { requires: [ptype('bug')] }),
      ch('Go around', NOTHING()),
    ]),
  ev('r158-mareep-shearing', 'Mareep Wool Shearing', G, { rarity: 'common', minStage: 1, types: ['electric'], pokemon: 'mareep', effect: 'sparkle', tint: '#2a2a3a' },
    'A flock of Mareep stand in a pen of crackling wool, patient and plump. A pair of shears hangs on the fence.', [
      ch('Shear them gently', out('A great pile of soft, static-charged wool, and some pleased Mareep.', any('soothe-bell', 'pink-scarf', 'cell-battery'), fr(2)), { check: 'charisma', fail: out('You rush it. The Mareep bolt, zapping as they go.', hurt(0.06)) }),
      ch('Shear in a hurry', out('A big, ragged haul.', any('soothe-bell', 'pink-scarf'), rp(10)), { chance: 0.5, fail: out('The flock panics and discharges all at once.', hurt(0.12)) }),
      ch('Pet them and leave', out('Soft, and warm.', fr(1))),
    ]),
  ev('r159-wild-gym-leader-pokemon', 'Wild Gym Leader Pokémon', G, { rarity: 'rare', minStage: 2, types: ['fighting', 'normal'], pokemon: 'machamp', effect: 'rattle', tint: '#3a1c1c' },
    'A feral ace stands alone in a clearing, as if it belonged to a Gym Leader once. It looks at you the way a leader looks at a challenger.', [
      ch('Accept the challenge', fight('The ace crouches. Its stance is perfect.', wild({ types: ['fighting', 'normal'], lv: 3, win: [better(1), gym(), rp(35)] }))),
      ch('Study it from afar', out('You watch how it moves. A great deal can be learned.', gym(), rp(15))),
      ch('Back away slowly', NOTHING()),
    ]),
  ev('r160-starfall-beach', 'Starfall Beach', G, { rarity: 'uncommon', minStage: 1, types: ['water', 'psychic'], pokemon: 'starmie', effect: 'glint', tint: '#14243a' },
    'The tide has left a beach strewn with glittering Staryu. They twinkle in the sand like fallen stars.', [
      ch('Pick one star', out('A single, perfect star, still warm. A keepsake.', any('star-piece', 'stardust', 'comet-shard')), { check: 'luck', fail: out('It was just a shell, and a pretty one.', item('heart-scale')) }),
      ch('Return them to the sea', out('You carry them down to the water one by one. The tide takes them, and the sea gives something back.', any('pearl', 'big-pearl', 'stardust'), good(2), fr(2))),
      ch('Walk the beach', out('A peaceful stroll.', heal(0.15))),
    ]),
  ev('r161-cursola-reef-grudge', 'Cursola Reef Grudge', G, { rarity: 'rare', minStage: 2, types: ['ghost', 'water'], pokemon: 'cursola', effect: 'fog', tint: '#1c2038' },
    'A spirit coral on a reef holds a grudge against the sea. It asks, with a cold whisper, that a Water-type stay behind to guard it.', [
      ch('Leave a Water-type to guard it', out('A Water-type stays. The reef warms. You are given a gift for it.', any('spell-tag', 'reaper-cloth', 'ghost-gem', 'water-gem'), good(3), rp(30)), { requires: [ptype('water')] }),
      ch('Fight the coral spirit', fight('The reef glows and the spirit rises.', wild({ species: ['cursola', 'corsola'], lv: 1, win: [any('spell-tag', 'reaper-cloth'), rp(20)] }))),
      ch('Refuse politely', NOTHING('The whisper trails off behind you.')),
    ]),
  ev('r162-magma-bubble-pools', 'Magma Bubble Pools', G, { rarity: 'uncommon', minStage: 2, types: ['fire', 'rock'], pokemon: 'torkoal', effect: 'fire', tint: '#3a1808' },
    'Magcargo and Torkoal loll in pools of bubbling stone. The steam looks restorative. It also looks hot.', [
      ch('Soak in the steam pool', out('Warm and dizzying. Everyone comes out in better shape.', heal(1)), { chance: 0.65, fail: out('A bubble pops too close. The team is burned.', status('burn'), heal(0.3)) }),
      ch('Fire-types only', out('The Fire-types soak safely and the whole party comes out restored.', heal(1), fr(1)), { requires: [ptype('fire')] }),
      ch('Keep your distance', NOTHING()),
    ]),
  ev('r163-sneasel-thieves', 'Swarm of Sneasel Thieves', G, { rarity: 'uncommon', minStage: 2, types: ['dark', 'ice'], pokemon: 'sneasel', effect: 'rattle', tint: '#1c2430' },
    'Sneasel drop from the cliff, snatch at your bag and race away across the snow.', [
      ch('Stop the ringleader', out('You catch the biggest one. The rest scatter and drop their loot, which you collect.', any(...HELD), any(...BERRIES), rp(15)), { check: 'speed', fail: out('They get away with a good part of the bag.', lose()) }),
      ch('Fight the pack', fight('You turn to face them. Claws out.', wild({ species: ['sneasel', 'weavile'], lv: 1, chain: 2, win: [any(...HELD), rp(25)] }))),
      ch('Let them run', out('You lose a few things. Better than losing your temper.', lose())),
    ]),
  ev('r164-gulpin-gulp-contest', 'Gulpin Gulp Contest', G, { rarity: 'common', minStage: 1, types: ['poison'], pokemon: 'gulpin', effect: 'shake', tint: '#243020' },
    'Gulpin are gathered for a swallowing contest. One of them has gulped something that does not belong to it.', [
      ch('Hand over an item to be gulped', out('It gulps your item down, burps, and promises to return it, with interest.', item('black-sludge'), lose()), { chance: 0.6, fail: out('It was a bad bet. The item does not come back.', lose()) }),
      ch('Win the contest', out('You judge the contest with a stern eye. The champion gives up the lost item.', any(...HELD), rp(10)), { check: 'luck', fail: out('The loser sulks and spits out nothing.', rp(5)) }),
      ch('Leave them to it', NOTHING()),
    ]),
  ev('r165-nidoran-picnic', 'Nidoran Family Picnic', G, { rarity: 'common', minStage: 1, types: ['poison'], pokemon: 'nidoran-m', effect: 'hearts', tint: '#2a2030' },
    'A family of Nidoran have laid out a picnic. A small one waves you over and offers a share of the berries.', [
      ch('Share your food', out('You swap berries all round. Everyone is full and happy.', fr(4), good(2), lose('oran-berry')), { requires: [hasItem('oran-berry')] }),
      ch('Join for a bite', out('A fine, easy lunch.', heal(0.3), fr(2))),
      ch('Leave them to their picnic', NOTHING()),
    ]),
  ev('r166-sudowoodo-gate', 'Sudowoodo Gate', G, { rarity: 'common', minStage: 1, types: ['rock'], pokemon: 'sudowoodo', effect: 'shake', tint: '#2a2418' },
    'A tree stands where no tree should, right in the narrow pass. It is not a tree. It does not want to move.', [
      ch('Splash it with a Water-type', out('The tree flails, scowls and stomps off. The pass is open.', rp(20), fr(1)), { requires: [ptype('water')] }),
      ch('Fight it', fight('It stops pretending.', wild({ species: ['sudowoodo', 'bonsly'], lv: 1, win: [rp(15)] }))),
      ch('Squeeze past', out('You scrape by. It does not notice.', hurt(0.06)), { check: 'speed', fail: out('You get stuck, then stuck some more.', hurt(0.12)) }),
    ]),
  ev('r167-ledyba-treehouse', 'Treehouse of Ledyba', G, { rarity: 'uncommon', minStage: 1, types: ['bug', 'flying'], pokemon: 'ledian', effect: 'float', tint: '#2a3a18' },
    'The Ledyba have built a small treehouse and strung a rope ladder. They flit about, urging you up.', [
      ch('Climb for the lookout', out('From the top you see for miles. Three nodes ahead are laid out before you.', scout(3), reveal(), fr(1)), { check: 'strength', fail: out('You slip, but a Ledyba catches your sleeve.', hurt(0.04), scout(1)) }),
      ch('Send a Flying-type up', out('It scouts the whole stage and drops back with a report.', scout(4), reveal()), { requires: [ptype('flying')] }),
      ch('Stay on the ground', NOTHING()),
    ]),
  ev('r168-taillow-dive-display', 'Taillow Dive Display', G, { rarity: 'common', minStage: 1, types: ['flying', 'normal'], pokemon: 'taillow', effect: 'float', tint: '#243448' },
    'Taillow wheel and dive-bomb a clearing in a show of pride. Each dive drops a shiny thing, or a very sharp beak.', [
      ch('Dodge the dives', out('You dodge every dive. The Taillow are impressed and drop their prizes.', any('sharp-beak', 'pretty-wing', ...BERRIES), rp(10)), { check: 'speed', fail: out('One catches you on the way past.', hurt(0.1)) }),
      ch('Watch from cover', out('A spectacular show.', rp(10))),
      ch('Dive back with a Flying-type', out('It joins in. The Taillow nod and give it a gift.', any('sharp-beak', 'pretty-wing'), fr(2, 'lead')), { requires: [ptype('flying')] }),
    ]),
  ev('r169-hoothoot-clock-tower', 'Hoothoot Clock Tower', G, { rarity: 'rare', minStage: 2, types: ['flying', 'normal'], pokemon: 'noctowl', effect: 'glint', tint: '#14182a' },
    'A clock tower stands in a field, a Hoothoot on every ledge. A great bell hangs in it, and the hands are almost at twelve.', [
      ch('Ring the bell at midnight', out('The bell tolls. The Hoothoot all turn their heads together, and a prophecy settles over the party.', bless('blessing-wild-grace'), bless('blessing-clarity'), rp(20)), { requires: [at('night')] }),
      ch('Ring it anyway', out('The bell rings a bit off. The owls blink, unmoved.', rp(10))),
      ch('Watch the owls', out('They turn their heads in unison. Eerie, and calming.', fr(1))),
    ]),
  ev('r170-geodude-rock-candy', 'Geodude Rock Candy', G, { rarity: 'common', minStage: 1, types: ['rock', 'ground'], pokemon: 'geodude', effect: 'glint', tint: '#2a2418' },
    'A Geodude offers you a fist-sized geode and mimes cracking it open. It is quivering with anticipation.', [
      ch('Crack it open', out('The geode splits. A gem sparkles inside.', any(...GEMS), rp(10)), { chance: 0.7, fail: out('Just plain rock. The Geodude shrugs and offers another.', item('hard-stone')) }),
      ch('Crack it with a Rock-type', out('A clean split. The gem inside is flawless.', any(...GEMS), fr(2)), { requires: [ptype('rock')] }),
      ch('Decline', NOTHING()),
    ]),
  ev('r171-slowpoke-wellside', 'Slowpoke Wellside', G, { rarity: 'uncommon', minStage: 1, types: ['water', 'psychic'], pokemon: 'slowpoke', effect: 'float', tint: '#2a2038' },
    'A Slowpoke sits at an old well, tail in the water, waiting for something to bite. It has been there a long, long time.', [
      ch('Wait with it', out('Hours pass. At last the tail drops, and you collect your reward for the patience.', rest(), any('star-piece', 'pearl', 'big-pearl'), rp(30)), { check: 'intelligence', fail: out('You nod off. When you wake it has bitten your bag instead.', rest(), lose()) }),
      ch('Tug the tail', out('It takes a very long time to notice. When it does, a tail drops free.', item('big-pearl')), { chance: 0.5, fail: out('Nothing yet. It looks at you, unbothered.', fr(-1)) }),
      ch('Leave it to its well', NOTHING()),
    ]),
  ev('r172-trubbish-dump-diving', 'Trubbish Dump Diving', G, { rarity: 'common', minStage: 1, types: ['poison'], pokemon: 'garbodor', effect: 'rattle', tint: '#24281c' },
    'A mountainous trash heap with a Trubbish on every ridge. Treasure or rot, hard to say from here.', [
      ch('Dig through it', out('Gold in the garbage!', any(...TREASURE), any(...HELD)), { chance: 0.55, fail: out('Just rot, and a bad smell on everyone.', status('poison')) }),
      ch('Send a Poison-type in', out('It digs like it was born to. A real find.', any(...TREASURE), any('black-sludge', 'poison-barb')), { requires: [ptype('poison')] }),
      ch('Hold your nose and go', NOTHING()),
    ]),
  ev('r173-tangela-maze', 'Tangela Maze', G, { rarity: 'uncommon', minStage: 1, types: ['grass'], pokemon: 'tangela', effect: 'net', tint: '#142a1c' },
    'A maze of living vines, with a Tangela rustling at every corner. The path through is not clear.', [
      ch('Solve the maze', out('You find your way through and a Tangela rewards you with its best berries.', any(...BERRIES), scout(3), rp(20)), { check: 'intelligence', fail: out('Dead ends all around. You come out the way you came.', hurt(0.04)) }),
      ch('Burn a path with a Fire-type', out('The vines curl and part. A clear road.', scout(2), rp(10)), { requires: [ptype('fire')] }),
      ch('Hack straight through', fight('The vines fight back.', wild({ species: ['tangela', 'tangrowth'], lv: 0, win: [any(...BERRIES), rp(15)] }))),
    ]),
  ev('r174-wynaut-hide-and-seek', 'Wynaut Hide and Seek', G, { rarity: 'rare', minStage: 1, types: ['psychic'], pokemon: 'wynaut', effect: 'hearts', tint: '#1c2438' },
    'Giggling, from somewhere nearby. A baby Wynaut is hiding on this stage, and it wants to be found.', [
      ch('Look for it', out('You find the little one curled in a hollow. It tumbles into your arms.', join({ species: ['wynaut'], lv: 0 }), fr(2), good(2)), { check: 'luck', fail: out('You search all over. Only giggling comes back.', scout(2)) }),
      ch('Follow the giggles', out('A trail of giggles leads you out of the thicket and up the road.', scout(3), reveal())),
      ch('Not now', NOTHING()),
    ]),
  ev('r175-alolan-sunset-cove', 'Alolan Sunset Cove', G, { rarity: 'uncommon', minStage: 1, types: ['water'], pokemon: 'wishiwashi', effect: 'glint', tint: '#3a2a20' },
    'The sunset over a cove lights a school of Wishiwashi, a hundred little fish in a shining cloud. They are huge when they stick together.', [
      ch('Scare them apart', out('They scatter, tiny and surprised. A boost of sea air fills the party.', bless('blessing-bloom'), fr(1)), { requires: [ptype('water')] }),
      ch('Fight the school', fight('The fish form up into a gleaming giant!', wild({ species: ['wishiwashi'], lv: 2, win: [any('water-gem', 'mystic-water', 'pearl'), rp(25)] }))),
      ch('Watch the sunset', out('Gold and pink on the water. Quiet.', heal(0.2))),
    ]),
  ev('r176-snorunt-snowdrift', 'Snorunt Snowdrift', G, { rarity: 'common', minStage: 1, types: ['ice'], pokemon: 'snorunt', effect: 'snow', tint: '#1c2c3a' },
    'A drift of fresh snow, with Snorunt peeking out from every pocket. One of them has started a snowman and keeps looking your way.', [
      ch('Help build the snowman', out('A great snowman, with an ice crystal buried at its heart. It is yours to keep.', item('nevermeltice'), fr(2)), { check: 'charisma', fail: out('It collapses in a flurry. Everyone laughs.', fr(1)) }),
      ch('Roll a snowball fight', out('A rowdy battle, with no losers.', fr(2), heal(0.1))),
      ch('Leave them in the drift', NOTHING()),
    ]),
  ev('r177-beldum-magnet-rain', 'Beldum Magnet Rain', G, { rarity: 'rare', minStage: 2, types: ['steel', 'psychic'], pokemon: 'beldum', effect: 'rattle', tint: '#20243a' },
    'The sky rains little steel Beldum, clanging down on the road like hail. One lands, wobbles, and stares at you.', [
      ch('Hold out a hand', out('It floats over and clamps onto your pack. It has chosen you.', join({ species: ['beldum'], lv: 0, shiny: 2 }), fr(2)), { check: 'charisma', fail: out('A hail of magnets. Everything metal in your bag sticks to it.', lose()) }),
      ch('Hold up a Magnet', out('They all swarm to the Magnet. One decides to stay.', join({ species: ['beldum'], lv: 0 }), lose('magnet')), { requires: [hasItem('magnet')] }),
      ch('Take cover', out('You shelter until the rain stops.', rest())),
    ]),
  ev('r178-torchic-brood', 'Torchic Chick Brood', G, { rarity: 'uncommon', minStage: 1, types: ['fire', 'fighting'], pokemon: 'combusken', effect: 'fire', tint: '#3a1c10' },
    'A Combusken glares at you from a nest of warm ash and Torchic chicks. It will not move, and neither will its claws.', [
      ch('Back off slowly', out('The Combusken relaxes. A chick rolls over to you with a little ember in its beak.', any('charcoal', 'fire-stone', 'oran-berry'), fr(2), good(2))),
      ch('Fight the parent', fight('It leaps at you, claws blazing!', wild({ species: ['combusken', 'blaziken'], lv: 1, win: [any('charcoal', 'fire-stone'), rp(20)] }))),
      ch('Try to take a chick', fight('The parent is not pleased.', wild({ species: ['combusken', 'blaziken'], lv: 2, win: [egg({ lv: 0, left: 2 })] }))),
    ]),
  ev('r179-gastly-gas-leak', 'Gastly Gas Leak', G, { rarity: 'uncommon', minStage: 1, types: ['ghost', 'poison'], pokemon: 'gastly', effect: 'fog', tint: '#241830' },
    'A cabin fills with a thick purple gas. A hundred Gastly flicker in it, grinning.', [
      ch('Ventilate the room', out('You throw the windows open and fan the gas out. The Gastly drift away, giggling.', fr(1), rp(15)), { check: 'strength', fail: out('The gas gets in your lungs.', status('poison')) }),
      ch('Fight the swarm', fight('The swarm closes in!', wild({ species: ['gastly', 'haunter'], lv: 0, chain: 2, win: [any('spell-tag', 'black-sludge'), rp(20)] }))),
      ch('Back out', NOTHING()),
    ]),
  ev('r180-lucky-charm-chansey', 'Lucky Charm Chansey', G, { rarity: 'rare', minStage: 1, types: ['normal'], pokemon: 'chansey', effect: 'hearts', tint: '#3a2030' },
    'A Chansey waits by the road with an egg-shaped bundle. It looks at you the way a nurse looks at a patient.', [
      ch('Accept her gift', out('She presses an Eviolite into your hands and pats your cheek. Once per run is all she can give.', item('eviolite'), heal(1), flag('chansey-charm')), { requires: [flagIs('chansey-charm', 0, 0)] }),
      ch('Ask for a healing', out('She heals the team, no questions asked.', heal(1), fr(1))),
      ch('Wave and move on', NOTHING()),
    ]),
];
