// Catalog Overhaul Pack, category "singles" (revised single events), batch 4.
// Doc: catalog_overhaul/STORY_FAMILIES_19.md SF140 Gentle Wild Scenes, STORY_FAMILIES_20.md SF141 Wild Scenes and Oddities.
// Wild scenes show who is there before the player commits. Gentle wild scenes are rests: watching gives Bond and a small item;
// joining in gives a stated chance that one Pokémon that liked the player joins. Known limits: docs/status/co-singles.md.
import { any, anyType, bondUp, ch, cure, express, fight, flag, flagIs, heal, hurtExcept, item, join, leave, out, reveal, room, scout, takeNode, takeNodeBack, trainer, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const no = (key: string): Json => ({ kind: 'flag', key, atMost: 0 });
const types = (...ts: string[]): Json => (ts.length === 1 ? { kind: 'partyType', type: ts[0] } : anyType(...ts));
const catchStep = (label: string): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'captureMultiplier', value: 1.25 }], battles: 1, until: 'wild' });
const SMALL = ['oran-berry', 'pecha-berry', 'cheri-berry', 'potion', 'poke-ball'];
/** Watching a gentle scene: Bond for the whole team, and a small item left behind. */
const watched = (): Json[] => [bondUp(1, 'party'), any(...SMALL)];
/** "May join (30%)": the stated chance that one that liked the player comes along. */
const mayJoin = (label: string, success: string, species: string[], fail: string, ...more: Json[]): Json =>
  ch(label, out(success, join({ species }), ...more), { chance: 0.3, fail: out(fail, ...more) });
const rm = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group: 'Wild scenes', room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
const later = (id: string, name: string, key: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group: 'Wild scenes', stop: 'event', rarity: 'uncommon', callback: true, requires: [flagIs(key), no(`${id}-seen`)], scene: { cast: [], effect: 'sparkle' }, ...o, intro, choices });
/** "Confused for one battle": the lead (first in party order) deals less damage in its next battle. */
const dizzy = (label: string): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'partyPositionDamage', position: 'first', value: 0.75 }], battles: 1, until: 'battle' });
const STEEL = ['metal-coat', 'iron-ball', 'shed-shell', 'steel-gem'];

// ---------- SF140. GENTLE WILD SCENES ----------
const SF140: Json[] = [
  {
    id: 'berries-abound',
    intro: 'A Berry tree is shaking all over, and it is not the wind. Every branch has a wild Pokémon in it, eating as fast as it can. You can see each one from here: the route\'s Grass- and Bug-types, stuffed and happy.',
    choices: [
      ch('Watch.', out('You sit under the tree and watch them eat. Now and then a Berry drops, and nobody minds you having it. Your team leans on you, sleepy in the shade.', ...watched())),
      ch('Climb in.', fight('You climb up among them and grab a Berry. One of them takes this very personally.', wild({ types: ['grass', 'bug'] }), any('oran-berry', 'sitrus-berry', 'pecha-berry'))),
    ],
  },
  {
    id: 'fiery-fallout',
    intro: 'Ash drifts down like grey snow. In the haze, Fire-types sleep curled in warm hollows, their flames turned low. You can see which ones from here.',
    choices: [
      ch('Tiptoe through.', out('You go through on the very tips of your toes, and not one of them stirs. Ash settles on your shoulders and your team\'s backs like a blessing. On the far side, a warm stone with something tucked under it.', ...watched())),
      ch('Wake one.', fight('You touch one on the shoulder. It opens one eye, and then both, and then it is very awake.', wild({ types: ['fire'] }))),
    ],
  },
  {
    id: 'glowing-mushrooms',
    intro: 'Blue mushrooms glow in the dark under the trees, lighting a path deeper in. The air smells of rain and something sweet.',
    choices: [
      ch('Pick one.', out('You pick the smallest. It goes on glowing in your hand for a long time. A Tiny Mushroom.', item('tiny-mushroom'))),
      ch('Follow the glow.', fight('The glow leads you deeper, to a ring of mushrooms, and one of the mushrooms is looking at you.', wild({ species: ['foongus', 'morelull'] }))),
    ],
  },
  {
    id: 'habitat-migration',
    intro: 'Wings darken the whole sky. The flock passing over is the route\'s Flying-types, thousands of them, and the noise of them is like rain.',
    choices: [
      ch('Watch them pass.', out('You lie on your back and watch until the last one is gone. Your team watches with you, completely silent, and a single feather comes spinning down into your hands.', ...watched())),
      ch('Signal one down.', fight('You wave both arms. One of them peels off from the flock and drops toward you like a stone.', wild({ types: ['flying'] }))),
    ],
  },
  {
    id: 'lightning-storm',
    intro: 'A storm crackles over the plain, and in the middle of it Electric-types are dancing, lit up from inside, throwing sparks at the sky.',
    choices: [
      ch('Shelter.', out('You all pile into a hollow under a rock and watch the dance from there, flinching at every crack. It is the best thing any of you have ever seen.', ...watched())),
      ch('Join them.', fight('You run out into the storm. Everything that is not an Electric-type gets a nasty jolt (5% of its HP), and one of the dancers turns to see who has joined in.', wild({ types: ['electric'] }), hurtExcept(0.05, 'electric'))),
    ],
  },
  {
    id: 'migrating-flock',
    intro: 'A flock goes over, low enough that you can hear their wings. The route\'s Flying-types, heading somewhere they have to be.',
    choices: [
      ch('Watch them pass.', out('You stand and watch them go. When they are almost gone, the last one dips its wings, as if to you. A feather comes down.', ...watched())),
      ch('Signal one down.', fight('You whistle. One turns out of the line and comes down to see who called.', wild({ types: ['flying'] }))),
    ],
  },
  {
    id: 'pokemon-playground',
    intro: 'Young wild Pokémon are playing tag in a clearing, shrieking and tumbling. One of them keeps looking at your lead. There is a 30% chance one tags your lead and follows you.',
    choices: [
      mayJoin('Join the game.', 'You join in, and you are terrible at it, and it is wonderful. At the end one of them tags your lead, and then just keeps following it.', [], 'You join in, and you are terrible at it, and it is wonderful. At the end they all scatter home, waving.', bondUp(1, 'lead')),
      ch('Watch.', out('You sit on a stump and watch them play until it gets dark. Your team watches with you, a little wistful.', ...watched())),
    ],
  },
  {
    id: 'r111-sandslash-colony',
    intro: 'Sandslash lie sunbathing on the warm dunes, belly-up, eyes closed. All around them, things glint in the dust.',
    choices: [
      ch('Sit with them.', out('You sit down in the sand with the one you chose, and after a while the nearest Sandslash rolls over and leans against it. When you leave, there is a Soft Sand where it was lying.', bondUp(1, 'picked'), item('soft-sand')), { pick: {} }),
      ch('Pick up the glints.', fight('You reach for the nearest glint, and every Sandslash wakes at once, and one of them is angry about it.', wild({ species: ['sandslash', 'sandshrew'] }))),
    ],
  },
  {
    id: 'r112-pond-choir',
    intro: 'Frogs, ducks and Poliwag are singing in the reeds, all slightly different songs that somehow fit. One Poliwag sings louder than the rest. There is a 30% chance it joins if you sing.',
    choices: [
      ch('Listen.', out('You sit at the water\'s edge and listen until the light goes. Your team sways along, very slightly.', ...watched())),
      mayJoin('Sing along.', 'You sing, badly. The loudest Poliwag stops, looks at you, and hops over to sing right next to you. When you stand up to go, so does it.', ['poliwag'], 'You sing, badly. The choir does not mind. The loudest Poliwag gives you a nod, as one singer to another.'),
    ],
  },
  {
    id: 'r118-honey-tree-hunt',
    intro: 'Combee buzz in and out of a hive in a hollow tree, and honey runs down the bark in golden threads. Take a little and they will not mind. Take a lot and the queen will.',
    choices: [
      ch('Take a little.', out('You scrape a little honey from the bark and leave the hive alone. The Combee do not even look at you.', item('honey'))),
      ch('Take a lot.', fight('You reach into the hive. The buzzing stops. Then the Vespiquen comes out.', wild({ species: ['vespiquen'], lv: 2, win: [item('honey', 3)] }))),
    ],
  },
  {
    id: 'r119-aipom-troop',
    intro: 'Your bag is lighter. You look up, and a troop of Aipom is sitting in the branches above you, passing something of yours from tail to tail.',
    choices: [
      ch('Chase them (three trees).', out('You chase them through one tree, then another, then a third, until the leader drops to the ground in front of you, out of breath and grinning. It hands back your item, and then one it stole from somebody else, as a prize for keeping up.', any('nugget', 'big-pearl', 'star-piece', 'rare-candy'))),
      ch('Let it go.', out('You let them have it. They chatter at you happily from the branches as you walk on, wearing it.', { kind: 'loseItem' })),
    ],
  },
  {
    id: 'r123-fireflies-dusk',
    intro: 'At dusk, Volbeat and Illumise rise out of the grass and draw shapes in the air with their lights. Every shape points the same way, over and over.',
    choices: [
      ch('Follow the lights.', out('You follow where they point, off the road and through the dark, and there it is: a stop no map shows.', reveal(), scout(3))),
      ch('Watch.', out('You watch them draw in the air until the last light goes out. Your team watches too, faces lit gold and green.', ...watched())),
    ],
  },
  {
    id: 'r126-hatching-hot-spring',
    intro: 'Eggs lie warming in a steaming shallow, and one of them is rocking. A Slugma lies beside them looking deeply bored with its job. There is a 30% chance a hatchling follows you.',
    choices: [
      ch('Watch the eggs.', out('You sit with the Slugma and watch. It does not acknowledge you, but it moves over to make room. One egg cracks, and a tiny face looks out at the world.', ...watched())),
      mayJoin('Help one hatch.', 'You hold the rocking egg in the warm water until it cracks open, and the first thing the hatchling sees is you. It will not be left behind.', ['magby', 'slugma', 'numel', 'torchic', 'charmander'], 'You hold the rocking egg in the warm water until it cracks, and the hatchling tumbles out and goes straight to the Slugma. Fair enough.'),
    ],
  },
  {
    id: 'r128-shed-skin-garden',
    intro: 'Old Ekans skins hang in the bushes like paper lanterns, and things have caught in them over the years: buttons, rings, keys.',
    choices: [
      ch('Search.', out('In the third skin you check there is a Gym badge, scratched, with a name on the back. Somebody has been missing this for a long time.', flag('shed-skin-badge'))),
    ],
  },
  later('shed-skin-badge-return', 'The Lost Badge', 'shed-skin-badge',
    'A trainer at the roadside is turning out her pockets for the hundredth time. The name on the back of the badge you found is hers.', [
      ch('Give it back.', out('She stares at it. "I won this when I was ten. I thought it was gone." She closes your hand round something in return, and will not take it back.', any('leftovers', 'focus-sash', 'life-orb', 'choice-scarf'), flag('shed-skin-badge-return-seen'), moment('Gave a lost Gym badge back to its owner.', 45))),
    ]),
  {
    id: 'r129-slumbering-hollow-chorus',
    intro: 'Jigglypuff and Chingling are singing in a hollow, very softly. Your eyelids are getting heavy. Your team is already asleep on its feet.',
    choices: [
      ch('Sleep.', out('You give in. You sleep in the grass, the whole team in a pile around you, and wake up with the song still going and everything in you mended. A full rest.', heal(1), cure())),
      mayJoin('Stay awake.', 'You stay awake, pinching yourself, and listen to the whole song. At the end one of the singers notices you are still up, and is so impressed it comes with you.', ['jigglypuff', 'chingling'], 'You stay awake, pinching yourself, and listen to the whole song. At the end the singers drift off to sleep themselves, and you tiptoe away.'),
    ],
  },
  {
    id: 'r131-rust-choir',
    intro: 'Skarmory perch on a heap of old scrap metal, and every time one shifts its weight the metal rings like a bell. In the scrap: a Metal Coat, an Iron Ball, a Shed Shell or a Steel Gem, maybe.',
    choices: [
      ch('Search the scrap.', fight('You dig into the scrap and come up with something useful, and the bells stop ringing. A Skarmory drops off its perch in front of you.', wild({ species: ['skarmory'] }), any(...STEEL))),
      ch('Leave.', leave('You leave them their bells. The ringing follows you a long way down the road.')),
    ],
  },
  {
    id: 'r132-zigzagoon-hunters',
    intro: 'A Zigzagoon zips past with something shiny in its mouth, then zags back, then zigs away again, clearly wanting you to follow.',
    choices: [
      ch('Follow.', out('You follow it, zig and zag, to a patch of dug-up earth where several Zigzagoon are proudly showing off a buried item. One of them, darker than the others, with a wild look and spiky fur, drops the item at your feet and sits down. It wants to come with you.', any('nugget', 'star-piece', 'big-pearl', 'rare-candy'), join({ species: ['zigzagoon-galar'] }))),
    ],
  },
  {
    id: 'r135-plant-whisperer-grove',
    intro: 'Bellsprout sway together in a grove, all leaning the same way at the same moment, in a chord you can almost hear. There is a 30% chance one joins if you sway with them.',
    choices: [
      ch('Listen.', out('You stand at the edge and listen to something without sound. Your team sways, very slightly, without meaning to.', ...watched())),
      mayJoin('Sway along.', 'You sway with them. The one you chose sways with you. After a while one of the Bellsprout sways out of the grove and leans against your leg, and stays.', ['bellsprout'], 'You sway with them. The one you chose sways with you, and for a while you are all part of the chord.', bondUp(1, 'picked')),
    ],
  },
  {
    id: 'r136-rampaging-rhyhorn',
    intro: 'A Rhyhorn comes charging down the road with its eyes blazing, straight at you, not slowing down.',
    choices: [
      ch('Dodge left.', out('You throw yourself left. It thunders past and away, still blazing, and you will never know what was wrong.')),
      ch('Dodge right.', out('You throw yourself right. It thunders past and away, still blazing, and you will never know what was wrong.')),
      ch('Stop it head-on.', fight('You plant your feet, and your team plants theirs.', wild({ species: ['rhyhorn'], lv: 1, win: [room('r136-rhyhorn-sting')] }))),
    ],
  },
  rm('r136-rhyhorn-sting', 'The Beedrill Sting', 'The Rhyhorn sinks down, beaten, breathing hard. Now that it is still you can see why it was running: a Beedrill sting is lodged in the soft skin behind its ear.', [
    mayJoin('Pull it out.', 'You pull the sting out in one go. The Rhyhorn shudders, and then it looks at you with its eyes clear for the first time, and when you walk on, it walks on beside you.', ['rhyhorn'], 'You pull the sting out in one go. The Rhyhorn shudders, sighs, and lies down in the road to sleep for the first time in days.'),
    ch('Leave it.', leave('You leave it lying in the road. It does not try to get up.')),
  ], { scene: { cast: [], pokemon: 'rhyhorn', effect: 'none' } }),
  {
    id: 'r138-feral-furfrou-salon',
    intro: 'A shaggy wild Furfrou sits by the road holding a comb in its mouth, and holds it out to you, and waits.',
    choices: [
      ch('Groom it.', out('You comb it out, slowly, all of it, until it shines. It looks at itself in a puddle for a long time, chooses its trim, and comes with you, looking extremely pleased.', join({ species: ['furfrou'] }), moment('Groomed a wild Furfrou, who chose to come along.', 40))),
    ],
  },
  {
    id: 'r142-boulder-boxing-ring',
    intro: 'A ring of boulders, a mat of packed earth, and in the middle **the reigning champ**, a Machop with tape on its fists, pointing at the mat. Win three bouts, and there is a Hard Stone on the corner post.',
    choices: [
      ch('Spar (three bouts).', fight('Three bouts, one after another, and the crowd of wild Pokémon round the boulders roars at every one.', wild({ species: ['machop', 'makuhita', 'timburr'], chain: 3, win: [item('hard-stone')] }))),
    ],
  },
  {
    id: 'r144-dewdrop-meadow',
    intro: 'Oddish are bathing in the dew of a morning meadow, rolling in it, leaves sparkling. There is a 30% chance one follows you if you join in.',
    choices: [
      ch('Watch.', out('You sit on a wet log and watch them roll. Your team gets very wet trying to copy them.', ...watched())),
      mayJoin('Join them.', 'You roll in the dew with them, and come up soaked and laughing, and one Oddish decides you are its new favourite thing.', ['oddish'], 'You roll in the dew with them, and come up soaked and laughing. They wave their leaves at you as you go.'),
    ],
  },
  {
    id: 'r148-paras-mushroom-patch',
    intro: 'Mushrooms in a patch: a red one and a brown one. Some of these are fine. Some of these are not. A Paras is grazing nearby, completely unbothered.',
    choices: [
      ch('The red one.', out('It is the good one: a Big Mushroom.', item('big-mushroom')), { chance: 0.5, fail: out('It is not the good one. Your lead takes one sniff and staggers in circles, dizzy for its next battle.', dizzy('Dizzy from the wrong mushroom: your lead hits softer next battle')) }),
      ch('The brown one.', out('It is the good one: a Big Mushroom.', item('big-mushroom')), { chance: 0.5, fail: out('It is not the good one. Your lead takes one sniff and staggers in circles, dizzy for its next battle.', dizzy('Dizzy from the wrong mushroom: your lead hits softer next battle')) }),
      ch('Ask a Paras.', out('You crouch down and ask. The Paras looks at you, looks at the patch, and taps one mushroom with a claw. It is the good one. A Big Mushroom.', item('big-mushroom'))),
    ],
  },
  {
    id: 'r149-pikachu-static-storm',
    intro: 'A field of Pikachu, every one of them crackling. The air is so full of static that your hair stands straight up, and so does everyone else\'s.',
    choices: [
      ch('Walk through.', out('You walk through with your hair on end. The Pikachu think this is the funniest thing they have ever seen.')),
      ch('Let Electric-types in.', out('Your Electric-types walk into the field and come out humming, charged to the tips of their ears. They will start the next battle Charged.', { kind: 'tempEffect', label: 'Charged: Electric moves ×1.5 next battle', effects: [{ kind: 'typeDamageMultiplier', type: 'electric', value: 1.5 }], battles: 1, until: 'battle' }), { requires: [types('electric')] }),
    ],
  },
  {
    id: 'r152-dream-meadow-snooze',
    intro: 'Everything in this meadow is asleep: the wild Pokémon, the bees, the wind. The air smells of warm cake.',
    choices: [
      ch('Nap.', out('You lie down for one minute, and wake up hours later with the whole team asleep on top of you and everything in you mended. A full heal.', heal(1), cure())),
      ch('Tiptoe on.', leave('You tiptoe through without waking a single thing. It is harder than it sounds.')),
    ],
  },
  {
    id: 'r158-mareep-shearing',
    intro: 'Mareep crowd a pen, fluffy to the point of bursting, crackling with static. A pair of shears hangs on the fence. A sign: "Help yourself. Please." The next town buys Mareep Wool at ₽300.',
    choices: [
      ch('Shear them.', out('You shear them one by one, and get a shock every single time, and they bound away light and grateful. A bag of Mareep Wool: the next town pays ₽300 for it.', item('mareep-wool'))),
      ch('Leave them.', leave('You leave them to their fluff. They do not seem to mind.')),
    ],
  },
  {
    id: 'r160-starfall-beach',
    intro: 'Staryu lie twinkling in the sand of a long beach, as if the stars came down overnight and stayed.',
    choices: [
      ch('Walk among them.', out('You walk among them barefoot, careful where you step. Your team walks behind you in a line, careful too.', ...watched())),
      ch('Throw one back in the sea.', out('One has washed too high to get back. You carry it down and set it in the waves, and it spins away into the deep, twinkling.', flag('staryu-thrown-back'))),
    ],
  },
  later('r160-staryu-returns', 'A Star Comes Back', 'staryu-thrown-back',
    'Something is twinkling in the shallows of a river, a long way from the sea. It is a Staryu, and it knows you. There is a 30% chance it comes along.', [
      ch('Hold out your hand.', out('It spins up out of the water and into your hand and leaves a Stardust there. Then it stays.', item('stardust'), join({ species: ['staryu'] }), flag('r160-staryu-returns-seen')), { chance: 0.3, fail: out('It spins up out of the water and leaves a Stardust in your hand. Then it spins away home, twinkling.', item('stardust'), flag('r160-staryu-returns-seen')) }),
    ]),
  {
    id: 'r164-gulpin-gulp-contest',
    intro: 'A Gulpin has gulped something it should not have, and is extremely pleased with itself. A crowd of wild Pokémon is cheering.',
    choices: [
      ch('Cheer it on.', out('You cheer, and the Gulpin bows, and burps, and the crowd goes wild. Whatever it ate is staying eaten.')),
      ch('Ask for it back.', out('You ask nicely, and the Gulpin, after a long and difficult moment, gives it back. It is your rival\'s: you would know that keyring anywhere. They will be glad to have it.', { kind: 'rivalChange', feelings: { trust: 1 } }, moment('Got your rival\'s lost keys back from a Gulpin.', 40))),
    ],
  },
  {
    id: 'r165-nidoran-picnic',
    intro: 'A family of Nidoran are having a picnic on a blanket of leaves. The smallest one waves you over.',
    choices: [
      ch('Share.', out('You sit down and share your lunch. The little one eats from your hand, and when you get up to go it climbs into your bag and refuses to come out.', join({ species: ['nidoran-f', 'nidoran-m'] }))),
      ch('Wave back.', out('You wave back. The whole family waves. You walk on smiling, and so does your team.', ...watched())),
    ],
  },
  {
    id: 'r167-ledyba-treehouse',
    intro: 'A rope ladder hangs out of a tree, and at the top Ledyba have built something that is very nearly a treehouse.',
    choices: [
      ch('Climb.', out('You climb up. The Ledyba make room. At the top, in a nest of leaves, they have been keeping something shiny, and they give it to you.', any('silver-powder', 'star-piece', 'sitrus-berry', 'big-pearl'))),
    ],
  },
  {
    id: 'r168-taillow-dive-display',
    intro: 'Taillow are dive-bombing a field one after another, pulling up at the last second, each one more reckless than the last. They want a judge.',
    choices: [
      ch('Judge the best dive.', out('You pick the one that went lowest and pulled up latest. It lands at your feet, chest out, and when you walk away it flies after you. The best diver has joined you.', join({ species: ['taillow'] }))),
    ],
  },
  {
    id: 'r170-geodude-rock-candy',
    intro: 'A Geodude is miming cracking open a geode, very dramatically, then holding the geode out to you.',
    choices: [
      ch('Crack it.', out('You crack it on a rock. Inside, where crystals should be, there is a fossil: a Plume, a Root or a Claw.', any('plume-fossil', 'root-fossil', 'claw-fossil'))),
      ch('Give it back.', out('You hand it back. The Geodude stares at you, then cracks it on its own head and gives you what was inside: a fossil, a Plume, a Root or a Claw.', any('plume-fossil', 'root-fossil', 'claw-fossil'))),
    ],
  },
  {
    id: 'r173-tangela-maze',
    intro: 'Vines close over the path in every direction, and at every corner a Tangela sits watching you choose.',
    choices: [
      ch('Left, left, right.', out('Left, left, right, and you are out the other side, and the Tangela at the exit nods as if you passed something.'), { chance: 0.5, fail: out('Left, left, right, and you are back at the start. You go round again and come out a whole stop later, scratched and tangled.', takeNode()) }),
      ch('Ask a Tangela.', out('You ask the nearest Tangela. It points, and points, and points again, and the whole route through the maze is laid out. You walk straight out.')),
    ],
  },
  {
    id: 'r174-wynaut-hide-and-seek',
    intro: 'Giggling, from somewhere. A Wynaut is hiding on this stretch of road, and it wants to be found.',
    choices: [
      ch('Look in the grass.', out('Nothing in the grass. The giggling moves further down the road.', room('wynaut-hide-2'))),
      ch('Look up the tree.', out('Nothing up the tree. The giggling moves further down the road.', room('wynaut-hide-2'))),
      ch('Look in the barrel.', out('There it is, in the barrel, delighted to be found. It climbs out and onto your shoulder, and joins you.', join({ species: ['wynaut'] }))),
    ],
  },
  rm('wynaut-hide-2', 'Still Hiding', 'Further down the road, the giggling comes from either a hedge or a cart. It is not hiding very well.', [
    ch('Look in the hedge.', out('Nothing in the hedge. The giggling is coming from the cart, very obviously.', room('wynaut-hide-3'))),
    ch('Look under the cart.', out('There it is, under the cart, delighted to be found. It climbs out and onto your shoulder, and joins you.', join({ species: ['wynaut'] }))),
  ], { scene: { cast: [], pokemon: 'wynaut', effect: 'none' } }),
  rm('wynaut-hide-3', 'Found It', 'The cart is shaking with giggles.', [
    ch('Look under the cart.', out('There it is, delighted to be found at last. It climbs onto your shoulder, and joins you.', join({ species: ['wynaut'] }))),
  ], { scene: { cast: [], pokemon: 'wynaut', effect: 'hearts' } }),
  {
    id: 'r175-alolan-sunset-cove',
    intro: 'In a cove at sunset, a cloud of Wishiwashi shines under the water like a dropped necklace. One is swimming alone, a little apart from the rest.',
    choices: [
      ch('Catch the lone one first.', fight('You go for the lone one, and the whole cloud turns, and comes together, and rises out of the water as one enormous fish, Totem-sized, glowing.', wild({ species: ['wishiwashi-school'], lv: 2 }))),
      ch('Watch.', out('You watch the cloud turn and turn in the sunset until the light goes and it breaks up into a thousand small fish again.', ...watched())),
    ],
  },
  {
    id: 'r176-snorunt-snowdrift',
    intro: 'Snorunt are playing in a snowdrift, and one of them is trying very hard to build a snowman, and the snowman keeps falling over.',
    choices: [
      ch('Help build it.', out('You help. It takes ages. When it is done, the little Snorunt looks at the snowman, looks at you, and decides you are better company. It joins you.', join({ species: ['snorunt'] }))),
    ],
  },
  {
    id: 'r178-torchic-brood',
    intro: 'A Combusken stands guard over a scatter of Torchic chicks, every feather on end, ready to fight anything that comes closer.',
    choices: [
      ch('Back away slowly.', leave('You back away one step at a time, hands where it can see them. It does not lower its guard until you are gone.')),
      ch('Offer food.', out('You set some food down and step back. The Combusken looks at it, at you, and relaxes, and lets the chicks eat. When you go, one chick runs after you, peeping, and its parent lets it.', join({ species: ['torchic'] }))),
    ],
  },
  {
    id: 'r179-gastly-gas-leak',
    intro: 'A cabin by the road is full to the rafters with purple gas, and grinning Gastly drift in and out of the windows.',
    choices: [
      ch('Clear it (Defog or a Flying-type).', out('Your Flying-type beats its wings and the gas pours out of the windows and away, and the Gastly scatter with it, all but one, which stays behind to play. It comes with you.', join({ species: ['gastly'] })), { requires: [types('flying')] }),
      ch('Battle the Gastly.', fight('You step in. The Gastly close round you, grinning, and it is a party.', wild({ species: ['gastly', 'haunter'], format: 'doubles' }))),
    ],
  },
];

// ---------- SF141. WILD SCENES AND ODDITIES ----------
const SF141: Json[] = [
  {
    id: 'r180-lucky-charm-chansey',
    intro: 'A Chansey sits by the road with an egg-shaped bundle in its arms, looking at your team the way a nurse looks at a waiting room.',
    choices: [
      ch('Let it look after one.', out('It takes the one you chose into its arms and hums, and when it lets go, that one is completely mended.', heal(1)), { pick: {} }),
      ch('Thank it.', out('You thank it. It nods, very professional, and goes back to watching the road for anyone who needs it.')),
    ],
    remembers: [{
      id: 'first-chansey', when: [no('chansey-lucky-egg')],
      notice: 'The bundle in its arms is not an egg. It holds it out to you.',
      addChoices: [ch('Take the bundle.', out('Inside the bundle is a Lucky Egg, warm. The Chansey pats your hand once and goes.', item('lucky-egg'), flag('chansey-lucky-egg')))],
    }],
  },
  {
    id: 'shiny-glint',
    intro: 'Something sparkles in the tall grass, there and gone, there and gone.',
    choices: [
      ch('Look closer.', out('You part the grass and look. It is right there, and now you can see exactly what it is, and whether its colours are the rare ones.', room('shiny-glint-close'))),
      ch('Walk on.', leave('You walk on. The sparkle goes on behind you for a while.')),
    ],
  },
  rm('shiny-glint-close', 'In the Tall Grass', 'Up close it is a wild Pokémon of this route, and it has seen you. You can see exactly what it is, and whether its colours are the rare ones.', [
    ch('Step in.', fight('It bursts out of the grass.', wild({ shiny: 6 }))),
    ch('Back away.', leave('You let the grass close again.')),
  ], { scene: { cast: [], effect: 'glint' } }),
  {
    id: 'sleeping-hollow',
    intro: 'In a hollow under the roots, wild Pokémon are napping in a heap, every one of the route\'s kinds. You can see each species from here.',
    choices: [
      ch('Tiptoe in.', fight('You creep closer. One of them wakes, and does not run, only looks at you, curious and sleepy. It will be a little easier to catch.', wild({}), catchStep('It woke curious: easier to catch'))),
      ch('Leave them.', leave('You leave them sleeping. One of them sighs in its sleep as you go.')),
    ],
  },
  {
    id: 'swarm',
    intro: 'Dozens of the same Pokémon fill the field, the route\'s own kind, so many the grass moves like water. One in twenty might be its rare colouring.',
    choices: [
      ch('Wade in.', fight('You wade in. Three come at you one after another, no rest between.', wild({ chain: 3, shiny: 4 }))),
      ch('Go round.', leave('You go round, the long way, and the field goes on rustling behind you.')),
    ],
  },
  {
    id: 'teleporting-hijinks',
    intro: 'A humming pad on the ground, and a sign beside it: "DO NOT STAND HERE." The pad sends whoever stands on it to a random open stop on this stage, forward or back.',
    choices: [
      ch('Stand there.', out('You stand there. The world folds, and unfolds, and you are further along the road than you were.', express()), { chance: 0.5, fail: out('You stand there. The world folds, and unfolds, and you are back where you were a stop ago. The sign was right.', takeNodeBack()) }),
      ch('Don\'t.', leave('You do as the sign says. It is a strange feeling.')),
    ],
  },
  {
    id: 'the-strong-stuff',
    intro: 'A Shuckle sits on a pile of old Berries that have gone to juice, and very much past it. It offers you a sip from a leaf cup.',
    choices: [
      ch('One sip.', out('One sip for the one you chose. It shudders, and then glows, and half its wounds close.', heal(0.5)), { pick: {} }),
      ch('Two sips.', out('Two sips for the one you chose. It shudders, glows, mends completely, and then walks into a tree. It will be confused for its next battle.', heal(1), dizzy('Two sips of Berry Juice: confused, hits softer next battle')), { pick: {} }),
      ch('No, thank you.', leave('The Shuckle drinks it itself. It does not seem to mind.')),
    ],
  },
  {
    id: 'tide-pools',
    intro: 'Rock pools full of tiny Water-types, each pool its own little world. You can see every species in every pool from where you stand.',
    choices: [
      ch('Look in each pool.', out('You go from pool to pool on your knees and look in every one. Your team crowds round each pool with you, noses nearly in the water.', ...watched())),
      ch('Wade in.', fight('You wade in, and one of the pool\'s inhabitants takes exception.', wild({ types: ['water'] }))),
    ],
  },
  {
    id: 'traveler-map',
    intro: '**A traveller, Peregrine**, unrolling a map on a rock: "No name on this route. Just a ring of ink, here. I\'ve never had the nerve."',
    choices: [
      ch('Ask to copy it.', out('She lets you copy it, carefully. The ring of ink is just ahead: a grotto.', { kind: 'laterEvent', eventId: 'traveler-grotto', nodes: 2 })),
      ch('Ask where it goes.', out('"Where it goes? Nobody knows. That\'s why it\'s a ring." She shows you anyway. It is just ahead: a grotto.', { kind: 'laterEvent', eventId: 'traveler-grotto', nodes: 2 })),
    ],
  },
  rm('traveler-grotto', 'The Grotto on the Map', 'The ring of ink was a grotto. The air inside is salt, and something is glowing at the back: a Pokémon that has not seen anyone in years, and a string of pearls lying in the shallows.', [
    ch('Go in.', fight('It turns to face you, and the glow turns with it.', wild({ lv: 2, shiny: 2, win: [item('pearl-string')] }))),
    ch('Leave it sleeping.', out('You copy the grotto onto your own map, and leave whatever is glowing in there to its long, quiet years.')),
  ], { scene: { cast: [], effect: 'sparkle' } }),
  {
    id: 'uncommon-breed',
    intro: 'A Pokémon of the route is eating at the roadside, and its colours are strange: a form you have not seen before.',
    choices: [
      ch('Approach quietly.', fight('You creep close enough to see its form clearly. It sees you too, and it does not run. It will be a little easier to catch.', wild({ shiny: 3 }), catchStep('Approached quietly: easier to catch'))),
      ch('Leave it to eat.', out('You leave it to its meal. As you go, it lifts its head and watches you, and remembers.', flag('uncommon-breed-left'))),
    ],
  },
  later('uncommon-breed-returns', 'The Strange One Comes Back', 'uncommon-breed-left',
    'The strangely coloured Pokémon you left to eat is waiting at the side of the road, and this time it walks right up to you.', [
      ch('Hold out your hand.', fight('It sniffs your hand, friendly, and then squares up to see what you are made of. It will be easier to catch than any wild one has a right to be.', wild({ shiny: 3 }), catchStep('It remembered you: easier to catch'), flag('uncommon-breed-returns-seen'))),
    ]),
  {
    id: 'wild-tea-party',
    intro: 'Fairy-types sit round a tiny table, holding tiny teacups, in total silence. There is an empty chair.',
    choices: [
      ch('Sit and say please.', out('You sit, and say please, and are poured a cup. After tea, one of them climbs into your lap and does not get down. It has decided to come with you.', join({ types: ['fairy'] }))),
      ch('Grab a cup.', out('You grab a cup. Every one of them stares at you, and then they are gone, table and all, offended beyond words.')),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF140, ...SF141]);
export const REMOVE: string[] = [];
void flagIs; void trainer; void scout;
