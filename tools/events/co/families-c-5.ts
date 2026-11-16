// Catalog Overhaul, families-c part 5: STORY_FAMILIES_10.md SF73 to SF78 (The Mystery Dungeon, The Cursed Idol, The
// Torn Pages, The Great Berry Festival, The Black Market, The Estate Sale). Re-read log: docs/status/co-families-c.md.
import { $, again, any, ch, ev, evil, fight, flag, flagAgo, flagIs, good, heal, item, join, leave, money, out, room, stopHere, type Json } from '../dsl.ts';
import { BERRY, HAS_BERRY, bagHas, done, notYet, repDown, repUp, spend, stamped, tf, wf } from './_families-c-kit.ts';

export const CATEGORY = 'families-c';

// ---------- SF73 The Mystery Dungeon (chain pseudo-stage; rooms and Luck in core/events/coDungeon.ts) ----------
const MD = { pokemon: 'bidoof', tint: '#1d1a2a', effect: 'none' };
const next = (from: string): Json => ({ kind: 'dungeon', action: 'next', from });
const luck = (n: number): Json => flag('dungeon-luck', n);
const mdRoom = (id: string, name: string, intro: string, choices: Json[]): Json => ev(id, name, 'Mystery Dungeon', { room: true, ...MD }, intro, choices);
const mdWild = (id: string, o: NonNullable<Parameters<typeof wf>[0]>, extra: Json[] = []): Json => wf({ ...o, win: [...(o.win ?? []), ...extra, next(id)] }, [next(id)]);
const FOUND = ['silk-scarf', 'charcoal', 'mystic-water', 'miracle-seed', 'magnet', 'soft-sand'];

const SF73: Json[] = [
  ev('md-entrance', "A Stair That Wasn't Here", 'Mystery Dungeon', { ...MD, rarity: 'rare' },
    'A stairway down that wasn\'t here a moment ago. The rooms below change every time. A Bidoof in an explorer\'s scarf sits on the top step. Bidoof (subtitled): "You\'re going down? Take a scarf. Everyone needs a scarf." Bidoof: "The only way out is through. Or back up, before it\'s too late."',
    [
      ch('Go down.', out('The stair is longer than it looks. The light behind you gets small. You have 3 Luck.', { kind: 'dungeon', action: 'start' }, next('md-entrance'))),
      ch('Take the scarf.', out('The Bidoof ties it round your lead\'s neck with great care. It\'s just a scarf. You feel luckier anyway: 4 Luck.', { kind: 'dungeon', action: 'start', scarf: true }, next('md-entrance'))),
      ch('Not today.', leave('You step back. When you look again, the stair is gone.')),
    ]),
  mdRoom('md-1-item-room', 'The Item Room', 'A pedestal. One item. A sign: "TAKE ONE."', [
    ch('Take it.', out('You take it. Nothing happens. You were braced for something.', any(...FOUND), next('md-1-item-room'))),
    ch('Leave it.', out('You leave it on the pedestal. Somewhere, the dungeon seems to approve. The dungeon likes manners. +1 Luck.', luck(1), next('md-1-item-room'))),
    ch('Look under the pedestal.', out('A second item, tucked underneath. And a click. A trap snaps shut an inch from your fingers. -1 Luck.', any(...FOUND), any(...FOUND), luck(-1), next('md-1-item-room'))),
  ]),
  mdRoom('md-1-monster-house', 'The Monster House', 'A room full of sleeping Pokémon. A stair on the far side. Every step is a gamble.', [
    ch('Tiptoe.', out('One step. Another. Nobody stirs. You reach the stair and breathe out.', next('md-1-monster-house')), {
      chance: 0.5, fail: fight('A floorboard creaks. Every eye in the room opens at once.', mdWild('md-1-monster-house', { format: 'triples', chain: 2, lv: 0 })),
    }),
    ch('Wake them and fight.', fight('You clap your hands. The whole room wakes up angry.', mdWild('md-1-monster-house', { format: 'triples', chain: 2, lv: 0 }))),
    ch('Throw a Berry to the corner.', out('The Berry lands in the corner. Every sleeper wakes, sniffs, and runs for it. You walk through the middle of the room and nobody looks at you.', BERRY, next('md-1-monster-house')), { requires: [HAS_BERRY] }),
  ]),
  mdRoom('md-1-trap-corridor', 'The Trap Corridor', 'A floor that clicks. Some tiles are clearly safe. Some aren\'t.', [
    ch('Step on the dusty tiles.', out('Dust means nobody has set them off, and they\'re stable. You cross without a sound.', next('md-1-trap-corridor'))),
    ch('Step on the clean ones.', out('Clean means somebody set them off, often. Click. Something swings past your ear. -1 Luck.', luck(-1), next('md-1-trap-corridor'))),
    ch('Send a Pokémon first.', out('It goes first, carefully. A dart catches it on the way, but it waves you across.', { kind: 'damage', share: 0.1, who: 'picked' }, next('md-1-trap-corridor')), { pick: {} }),
  ]),
  mdRoom('md-2-fork', 'The Fork', 'Three ways, each marked by a smell: smoke, salt, flowers.', [
    ch('Smoke.', fight('A room full of embers, and a Charcoal on a ledge. Something hot guards it.', mdWild('md-2-fork', { types: ['fire'], lv: 0 }, [item('charcoal')]))),
    ch('Salt.', out('A cool pool of sea water, far underground. You rest your feet in it. +1 Luck.', luck(1), next('md-2-fork'))),
    ch('Flowers.', out('A room of Berry bushes growing in the dark. You pick three.', item('pecha-berry'), item('cheri-berry'), item('chesto-berry'), next('md-2-fork'))),
  ]),
  mdRoom('md-2-shop', "Kecleon's Shop", 'A shop in the middle of nowhere, run by a Kecleon who never changes colour. Kecleon: "Welcome! Fair prices, fixed prices, no haggling, no stealing. Stealing makes me cross."', [
    ch('Buy.', out('Every price is printed, and every one is fair. Kecleon watches you shop with great approval.', stopHere('shop'), next('md-2-shop'))),
    ch("Why don't you change colour?", out('Kecleon: "Customers like to know where I am." It beams at you.', next('md-2-shop'))),
    ch('Steal something.', fight('You pocket something. Kecleon\'s eyes swivel. Then it grows, and grows, until it fills the shop.', mdWild('md-2-shop', { species: ['kecleon'], lv: 2 }, [any('life-orb', 'choice-scarf', 'expert-belt')]), luck(-2), flag('md-stole'), evil(1))),
  ]),
  mdRoom('md-2-no', 'An Empty Room', 'Where Kecleon\'s shop was, an empty room. A single sign on the wall: "NO."', [
    ch('Walk on.', out('You walk on. You can feel it watching you from somewhere.', next('md-2-no'))),
  ]),
  mdRoom('md-2-sleeping-den', 'The Sleeping Den', 'Something asleep on a pile of treasure: a Snorlax.', [
    ch('Take one coin.', out('One Nugget, lifted very, very slowly. The Snorlax snores on.', item('nugget'), next('md-2-sleeping-den'))),
    ch('Take a handful.', fight('Three Nuggets, and the pile shifts. One eye opens. Then the other.', mdWild('md-2-sleeping-den', { species: ['snorlax'], lv: 1 }), item('nugget', 3))),
    ch('Leave it be.', out('You let it sleep. It smiles in its sleep. +1 Luck.', luck(1), next('md-2-sleeping-den'))),
  ]),
  mdRoom('md-3-ambush', 'The Ambush', 'A hall that smells of many Pokémon. The doors lock behind you.', [
    ch('Fight.', fight('They come at you from every side. Three fights, back to back.', mdWild('md-3-ambush', { chain: 3, lv: 1 }))),
    ch('Find the other exit.', out('You feel along the wall for a long time. A stone gives. A hidden door, and a scrape on your arm. -1 Luck.', luck(-1), next('md-3-ambush'))),
    ch('Wait.', fight('You stand still. They come one at a time, unsure of you. Easier. Slower.', mdWild('md-3-ambush', { chain: 3, lv: 0 }))),
  ]),
  mdRoom('md-3-boss-door', 'The Boss Door', 'A big door, a bigger lock, and the sound of something heavy on the other side.', [
    ch('Open it.', fight('The door swings in. The floor\'s boss turns to look at you.', mdWild('md-3-boss-door', { lv: 2 }, [any('eviolite', 'assault-vest', 'weakness-policy')]))),
    ch('Knock.', fight('You knock. The door opens by itself. The boss inside is curious, not angry.', mdWild('md-3-boss-door', { lv: 1 }, [any('eviolite', 'assault-vest', 'weakness-policy')]))),
    ch('Go round.', out('A long way round, past the door and its treasure. The air gets fresher.', room('md-3-spring'))),
  ]),
  mdRoom('md-3-spring', 'The Spring', 'A spring at the bottom, glowing softly. An exit stair on the far side. The Bidoof is waiting. Bidoof: "You made it! Drink! Everybody drinks!"', [
    ch('Drink.', out('Cold and bright. Your whole team drinks, and every ache goes out of them.', heal(1), flag('dungeon-rank'))),
    ch('Fill a bottle.', out('You fill a bottle. It glows in your bag all the way up the stairs.', item('spring-water'), flag('dungeon-rank'))),
    ch('Just leave.', out('You nod to the Bidoof and climb. Explorers know when to go.', flag('dungeon-rank', 2))),
  ]),
];
Object.assign(SF73[SF73.length - 1]!, {
  remembers: [{ id: 'gold', when: [flagIs('dungeon-rank', 3)], notice: 'The Bidoof takes off its own scarf and holds it out to you. Bidoof: "You\'re a real explorer now."', addChoices: [] }],
});

// ---------- SF74 The Cursed Idol (the curse itself: coToolkit.ts idol pieces) ----------
const IDOL = { cast: [], tint: '#3a2a10', effect: 'glint' };
const takeIdol = out('It\'s heavier than gold should be. Somewhere, very faintly, something starts counting.', flag('idol-carried'));
const SF74: Json[] = [
  ev('mr-cursed-idol', 'The Cursed Idol', 'Mysteries & Ruins', IDOL,
    'A small golden idol on a pedestal in a ruin. The air around it is wrong. Carved on the pedestal: "IT PAYS. IT KEEPS COUNT."',
    [
      ch('Take it.', takeIdol),
      ch('Read the carving again.', out('Under the first line, smaller, worn almost smooth: "IT WANTS TO GO HOME."', room('idol-read'))),
      ch('Leave it.', leave('You leave it where it is. The air feels better the further you walk.')),
    ]),
  ev('idol-read', 'The Cursed Idol', 'Mysteries & Ruins', { room: true, ...IDOL }, 'IT PAYS. IT KEEPS COUNT. IT WANTS TO GO HOME.', [
    ch('Take it anyway.', takeIdol),
    ch('Leave it.', leave('You leave it. It\'s been waiting this long.')),
  ]),
  ev('mr-idol-return', 'Its Shrine', 'Mysteries & Ruins', { ...IDOL, callback: true, requires: [flagIs('idol-carried')] },
    'The idol is heavy in your bag. A small shrine on the road has a pedestal the exact size of it. A child is sweeping the shrine. She looks at your bag. Child, Suki: "Oh. You found it. Grandma said somebody would bring it back one day."',
    [
      ch('Return it.', out('You set it on the pedestal. The counting stops. The curse lifts all at once, like a held breath let go. The money stays. Suki\'s grandma comes out with a Cleanse Tag and presses it into your hand.', flag('idol-carried', -99), flag('idol-curse', -99), item('cleanse-tag'), good(1))),
      ch('Keep it a while longer.', out('Suki nods like she expected that. "It\'ll come back here," she says. "They always do." The idol feels heavier already.', again('mr-idol-return'))),
      ch('Why was it taken?', out('Suki: "A man took it to pay a debt. He died rich and alone." She leans on her broom and waits.', room('idol-why'))),
    ]),
  ev('idol-why', 'Its Shrine', 'Mysteries & Ruins', { room: true, ...IDOL }, 'Suki waits, broom in hand.', [
    ch('Return it.', out('You set it on the pedestal. The counting stops. The curse lifts all at once. The money stays. Suki\'s grandma gives you a Cleanse Tag.', flag('idol-carried', -99), flag('idol-curse', -99), item('cleanse-tag'), good(1))),
    ch('Keep it a while longer.', out('Suki: "Rich and alone," she says again, quietly. The idol feels heavier.', again('mr-idol-return'))),
  ]),
];
Object.assign(SF74[0]!, { remembers: [{ id: 'ghosts', when: [{ kind: 'partyType', type: 'ghost' }], notice: 'Your Ghost-type turns its back on the idol and will not look at it.', addChoices: [] }] });
Object.assign(SF74[2]!, { remembers: [{ id: 'face', when: [flagIs('idol-curse', 7)], notice: 'The face in every reflection, all this time: Suki\'s grandfather. When the idol touches the pedestal you see him once more, in the shrine\'s bell, smiling.', addChoices: [] }] });

// ---------- SF75 The Torn Pages ----------
const PAGE = { cast: [], tint: '#2a2418', effect: 'none' };
const keepPage = (p: string, ...fx: Json[]): Json[] => [...(p === 'a' ? [flag('pages-a')] : []), flag('torn-page'), ...fx];
const SF75: Json[] = [
  ev('mr-story-page-a', 'A Torn Page', 'Mysteries & Ruins', PAGE,
    'A page drifts across the road, covered in old handwriting. It\'s about a trainer with a {starter}. "...and the trainer stopped at the bridge, though nobody asked them to..."',
    [
      ch('Keep it.', out('You fold it carefully and put it somewhere it won\'t crease.', ...keepPage('a'))),
      ch('Let it blow away.', out('The wind takes it over the hedge. You have a feeling you\'ll see it again.', stamped('page-a-blown'))),
    ]),
  ev('mr-story-page-a-again', 'A Torn Page', 'Mysteries & Ruins', { ...PAGE, callback: true, requires: [flagAgo('page-a-blown', 1), notYet('pages-a')] },
    'A region later, the same page catches on your boot. "...and the trainer stopped at the bridge, though nobody asked them to..."',
    [
      ch('Keep it this time.', out('You keep it. It seems to have come a long way to find you.', ...keepPage('a'))),
      ch('Let it go again.', leave('You let it go. Some pages want to wander.')),
    ]),
  ev('mr-story-page-b', 'A Torn Page', 'Mysteries & Ruins', PAGE,
    'Another page, the same old hand. "...the second time, the trainer chose differently, and the Pokémon noticed..."',
    [
      ch('Keep it.', out('You keep it.', ...keepPage('b'))),
      ch('Write a note on the back: "Thank you."', out('You write it small, in the corner. It looks like it belongs there.', ...keepPage('b', flag('page-note')))),
      ch('Write a note on the back: "Keep going."', out('You write it small, in the corner. It looks like it belongs there.', ...keepPage('b', flag('page-note')))),
    ]),
  ev('mr-story-page-c', 'A Torn Page', 'Mysteries & Ruins', PAGE,
    'The last page you find. "...and at the end, nobody remembered the battles. They remembered the—" It\'s torn there.',
    [
      ch('Keep it.', out('You keep it, and the missing word stays missing.', ...keepPage('c'))),
      ch('Guess the last word.', out('You hold the page and think about it for a long time.', room('page-guess'))),
    ]),
  ev('page-guess', 'A Torn Page', 'Mysteries & Ruins', { room: true, ...PAGE }, '"They remembered the—"', [
    ch('"...kindness."', out('You write it in pencil, lightly, so it can be rubbed out.', ...keepPage('c', flag('page-guess-kindness')))),
    ch('"...friendship."', out('You write it in pencil, lightly, so it can be rubbed out.', ...keepPage('c', flag('page-guess-other')))),
    ch('"...each other."', out('You write it in pencil, lightly, so it can be rubbed out.', ...keepPage('c', flag('page-guess-other')))),
  ]),
  ev('mr-story-archive', 'The Collector', 'Mysteries & Ruins', { ...PAGE, requires: [flagIs('torn-page', 2)] },
    'A scholar spots the pages in your hand and gasps. Archivist Hume: "Those belong together! I\'ve been looking for thirty years." Hume: "It\'s a story told on this road for a century. Every teller changes it. These are the oldest pages anyone\'s found."',
    [
      ch('Give them to him.', out('Hume reads them aloud, right there on the road. Halfway through he stops. "The old woman. The Storyteller. She\'s in it, by name." His hands shake. "Then her road is real."', flag('storyteller-road'), flag('telling-mew', 1))),
      ch('Read them together.', out('You read them side by side. The trainer at the bridge. The second choice. And the end: "...nobody remembered the battles. They remembered the kindness." Hume: "The Storyteller\'s road. It starts further along than I thought."', flag('storyteller-road', 2), flag('telling-mew', 1))),
      ch('Keep them.', out('Hume understands. He copies them by hand, slowly, while you wait. In the margin of his copy he draws a small pink shape, without knowing why.', flag('telling-mew', 1))),
    ]),
];
Object.assign(SF75[5]!, {
  remembers: [
    { id: 'right', when: [flagIs('page-guess-kindness')], notice: 'Hume sees your pencilled word and goes very still. "That\'s it. That\'s exactly what it says."', addChoices: [] },
    { id: 'guess', when: [flagIs('page-guess-other')], notice: 'Hume reads your pencilled word. "That\'s not what it says." A pause. "But it should be." He writes your word in, beside the old one.', addChoices: [] },
    { id: 'note', when: [flagIs('page-note')], notice: 'On the back of the second page, in your own handwriting: your note. Hume reads it out too, as if it was always part of the story.', addChoices: [] },
  ],
});

// ---------- SF76 The Great Berry Festival ----------
const FEST = { cast: [], pokemon: 'skwovet', tint: '#3a2a18', effect: 'none' };
const festRoom = (id: string, name: string, intro: string, choices: Json[], o: Json = {}): Json => ev(id, name, 'Berry Festival', { room: true, ...FEST, ...o }, intro, choices);
const SF76: Json[] = [
  ev('berry-fest-gates', 'The Great Berry Festival', 'Berry Festival', FEST,
    'Bunting, music, the smell of a thousand Berries. A banner: THE GREAT BERRY FESTIVAL. Festival mayor, Pudding: "Welcome, welcome! Taste everything! Well. Taste what there is." Half the stalls are empty.',
    [
      ch('What happened?', out('Pudding\'s smile slips.', stamped('berry-fest'), room('berry-fest-shortage'))),
      ch('Taste what there is.', out('Small, sour, and wonderful. Your team eats until they can\'t. Pudding presses one more Berry into your hand for the road.', stamped('berry-fest'), heal(0.1), any('oran-berry', 'pecha-berry', 'cheri-berry'))),
      ch('Find the contest.', out('Pudding points you to a big tent with a hand-painted sign.', stamped('berry-fest'), room('berry-fest-contest'))),
    ]),
  ev('berry-fest-shortage', 'The Shortage', 'Berry Festival', { ...FEST, room: true },
    'Pudding: "A drought hit the orchards. The grove behind the grounds is all we\'ve got left, and something\'s living in it."',
    [
      ch("I'll look at the grove.", out('Pudding: "Bless you. Bless you. Mind the roots. It\'s past the last stall, up the hill."')),
      ch('Bring Berries from my bag (five).', out('One stall, two, five. The empty tables fill up one by one, and people start to come back to them. Pudding cries a little, then hands you something rare from her own pocket.', spend([], 5, '-berry'), item('starf-berry'), good(1)), { requires: [bagHas([], 5, 'five Berries', '-berry')] }),
      ch('Ask about the drought.', out('Pudding: "The spring under the Guardian Tree dried up. Nobody knows why." She looks up the hill. "Nobody\'s been up there in years."')),
    ]),
  ev('berry-fest-thief', 'The Thief', 'Berry Festival', { ...FEST, requires: [flagIs('berry-fest')] },
    'A Pokémon bolts from a stall, cheeks stuffed with Berries. The vendor wails. It\'s a Skwovet, very thin. It runs toward the grove.',
    [
      ch('Chase it.', out('You follow it through the stalls and over a fence. It leads you into the grove, to a hollow in the roots. Its family is there, starving. You mark the place, to come back with food.')),
      ch('Pay the vendor.', out('You pay. The vendor is so grateful she hugs you. Later, on the road, a thin Skwovet steps out of the hedge and leaves a Berry at your feet.', $(-200), any('oran-berry', 'sitrus-berry'), good(1)), { requires: [money(200)] }),
      ch('Let it go.', leave('You let it go. It looked so thin.')),
    ]),
  ev('berry-fest-grove', 'The Grove', 'Berry Festival', { ...FEST, requires: [flagIs('berry-fest')] },
    'Behind the festival, Berry trees grow wild and heavy. Something nests in the roots: a family of Skwovet and Greedent, hoarding everything. Their own grove up the hill dried up.',
    [
      ch('Share the grove with them.', out('You sit down between the festival and the family and work it out: half the trees for the stalls, half for them. The Greedent thinks about it, and then nods, once.', flag('berry-shared'), good(1))),
      ch('Drive them off.', fight('The Greedent puffs up to twice its size and comes at you.', wf({ species: ['greedent'], lv: 1, win: [stamped('berry-drove')] }, [stamped('berry-drove')]))),
      ch('Find out why their grove dried.', out('The smallest Skwovet tugs your sleeve and points up the hill, to an old tree with no leaves. You\'ll go up there next.')),
    ]),
  ev('berry-fest-merchant', 'The Merchant', 'Berry Festival', { ...FEST, requires: [flagIs('berry-fest')] },
    'A wagon of rare Berries from far regions. Berry merchant, Sabba: "Never tasted anything like them, friend. Kee, Maranga, Roseli. Fair prices."',
    [
      ch('Buy.', out('Sabba spreads them out, each with its price on a little card.', room('berry-fest-wagon'))),
      ch('Donate some to the festival.', out('You buy a basket and carry it straight to the contest tent. The judges add a whole new category: Rare Berries.', $(-600), flag('berry-rare-category'), good(1)), { requires: [money(600)] }),
      ch("Ask where they're from.", out('Sabba names the regions on her fingers. The last one she names is {nextRegion}. "You\'ll see," she says. "They grow them big there."')),
    ]),
  festRoom('berry-fest-wagon', 'The Merchant', 'Kee Berry, ₽400. Maranga Berry, ₽400. Roseli Berry, ₽300. Fair prices, printed.', [
    ch('A Kee Berry (₽400).', out('Sabba wraps it in a leaf.', $(-400), item('kee-berry')), { requires: [money(400)] }),
    ch('A Maranga Berry (₽400).', out('Sabba wraps it in a leaf.', $(-400), item('maranga-berry')), { requires: [money(400)] }),
    ch('A Roseli Berry (₽300).', out('Sabba wraps it in a leaf.', $(-300), item('roseli-berry')), { requires: [money(300)] }),
    ch('Nothing today.', leave('Sabba waves. "Next region, friend."')),
  ]),
  ev('berry-fest-contest', 'The Contest', 'Berry Festival', { ...FEST, room: true },
    'Judges grade Berries on size, flavour and shine. Judge Plumridge: "Enter one Berry. We\'ll know if it\'s bought or grown."',
    [
      ch('Enter a Berry I found.', out('Plumridge turns it over twice. "Middling. Honest, though." A small prize: a ribbon and a bag of seeds.', BERRY, $(300)), { requires: [HAS_BERRY] }),
      ch('Enter one I grew.', out('Plumridge holds it up to the light for a long time. "Grown. With care." First prize: a Berry Pouch, and your name on the board.', item('berry-pouch'), flag('berry-won')), { requires: [flagIs('berry-grown')] }),
      ch('Just watch.', leave('You watch. An old man wins with a Berry the size of his head. Everyone cheers.')),
    ]),
  ev('berry-fest-guardian', 'The Guardian Tree', 'Berry Festival', { ...FEST, pokemon: 'tsareena', requires: [flagIs('berry-fest')] },
    'A great old Berry tree. A Pokémon in its branches watches you with calm eyes: a Tsareena. The spring at its roots is dry. A stone has fallen into it, wedged tight.',
    [
      ch('Move the stone.', out('Your Pokémon sets its feet and heaves. The stone grinds, rocks, and rolls clear. Water bubbles up, then runs. The Tsareena comes down from the branches and touches your Pokémon\'s head.', stamped('berry-spring'), good(1)), { pick: { types: ['fighting', 'ground'] } }),
      ch('Ask the guardian.', out('The Tsareena looks at you, then points one long leg at the stone.', room('berry-fest-stone'))),
      ch('Water the tree yourself.', out('Your Water-type fills the spring at every node you pass. It holds. For a region, at least.'), { pick: { types: ['water'] } }),
    ]),
  festRoom('berry-fest-stone', 'The Guardian Tree', 'The Tsareena points at the stone. Then it waits.', [
    ch('Move the stone.', out('The stone grinds, rocks, and rolls clear. Water bubbles up. The Tsareena comes down from the branches.', stamped('berry-spring'), good(1)), { pick: { types: ['fighting', 'ground'] } }),
    ch('Not yet.', leave('The Tsareena goes back to watching.')),
  ], { pokemon: 'tsareena' }),
  ev('berry-fest-research', 'The Seedling', 'Berry Festival', { ...FEST, requires: [flagIs('berry-fest')] },
    'Botanists compare mutations under glass. One offers you a seedling in a pot. Botanist, Dr. Fennimore: "Would you grow this? It needs a trainer\'s care. Talk to it." Fennimore: "It\'s a new Berry. It\'ll be named after whoever grows it."',
    [
      ch('Grow it.', out('You take the pot. It\'s very small. You water it at every rest, and talk to it when nobody\'s looking. (It fruits after 4 rests.)', flag('berry-seedling'))),
      ch('What kind of Berry?', out('Fennimore: "We don\'t know yet. That\'s the fun."')),
      ch('No time.', leave('Fennimore nods and puts the pot back under the glass.')),
    ]),
  ev('berry-fest-fruit', 'The Seedling Fruits', 'Berry Festival', { ...FEST, callback: true, requires: [flagIs('berry-grown'), notYet('berry-won')] },
    'Your seedling has fruited: one Berry, a colour nobody has a name for yet. The festival\'s contest is still on.',
    [
      ch('Take it to the contest.', out('You carry it all the way back with both hands.', room('berry-fest-contest'))),
      ch('Keep it for yourself.', out('You keep it. It\'s yours. You grew it.', any('lum-berry', 'sitrus-berry'))),
    ]),
  ev('berry-fest-full', 'The Festival, Full', 'Berry Festival', { ...FEST, callback: true, requires: [flagAgo('berry-spring', 1), flagIs('berry-shared')] },
    'Next region, the festival again: every stall stocked, the spring running, the Greedent family asleep on a full larder. On a new board by the gate, a new Berry, and your name on it.',
    [ch('Taste everything.', out('Everything. Pudding refuses your money.', heal(0.5), item('sitrus-berry'), item('lum-berry'), good(1)))]),
  ev('berry-fest-raid', 'The Raid', 'Berry Festival', { ...FEST, pokemon: 'greedent', callback: true, requires: [flagAgo('berry-drove', 1)] },
    'In the night, something big gets into your bag. In the morning: a Greedent, very fat, waddling away into the trees. It looks back once. It remembers you.',
    [ch('Check the bag.', out('Your Berries are gone. Most of them.', spend([], 3, '-berry')))]),
];
Object.assign(SF76.find((e) => e.id === 'berry-fest-contest')!, {
  remembers: [{
    id: 'rare', when: [flagIs('berry-rare-category')], notice: 'A new table at the end of the tent, under a new sign: RARE BERRIES. Your donation, sorted and labelled.', hide: [0],
    addChoices: [ch('Enter a Berry I found.', out('Plumridge turns it over. "Middling. But the Rare table needs entries." Second prize in the new category: a Starf Berry.', BERRY, item('starf-berry')), { requires: [HAS_BERRY] })],
  }],
});
Object.assign(SF76[0]!, { remembers: [{ id: 'abner', when: [flagIs('farmer-end')], notice: 'An old seed packet on Pudding\'s table, faded: ABNER\'S SEEDS. Pudding: "He bought his first seeds here. Decades ago."', addChoices: [] }] });

// ---------- SF77 The Black Market ----------
const SHADY = { cast: ['trainer.roughneck'], tint: '#1a1420', effect: 'none' };
const boughtStolen = (id: string, price: number, flagKey: string): Json[] => [$(-price), item(id), flag(`honest-kept-${id}`), ...(flagKey ? [stamped(flagKey)] : []), flag('evil-funded'), evil(1)];
const SF77: Json[] = [
  ev('black-market', 'Behind the Curtain', 'Merchants and deals', SHADY,
    'A curtain parts. Goods no shop would sell. Dealer, Silk: "Everything\'s half price. Everything\'s stolen. I\'m honest about that."',
    [
      ch('Buy (a Choice Band, ₽1500, half price).', out('Silk wraps it in newspaper. Somewhere, the evil team\'s next plan gets a little closer.', ...boughtStolen('choice-band', 1500, 'black-bought')), { requires: [money(1500)] }),
      ch('Who from?', out('Silk: "Trainers who didn\'t lock their bags."')),
      ch('Report you.', out('Silk sighs. "Fair." Officers come for her before the stage is out. One of them writes down what you saw: a lead on the Smuggling Ring.', flag('lead-smuggling-ring'), flag('reported-crime'), repUp(1), good(1))),
    ]),
  ev('stolen-goods-stall', 'Questionable Bargains', 'Merchants & Deals', SHADY,
    'A street stall. Vendor: "Cheap, cheap! Don\'t ask where it came from."',
    [
      ch('Buy something (a Scope Lens, ₽1200).', out('He wraps it fast and looks over his shoulder twice.', ...boughtStolen('scope-lens', 1200, '')), { requires: [money(1200)] }),
      ch('Ask where it came from.', out('Vendor (very quietly): "...A Rocket fella. Don\'t tell him I said." You have a name for the owner now.', flag('stall-lead'), flag('lead-smuggling-ring'))),
      ch('Walk on.', leave('You walk on.')),
    ]),
  ev('smugglers-crate', 'The Crate', 'Merchants & Deals', SHADY,
    'A smuggler pats a stencilled crate. "Unopened. May include a banned item. No refunds." He shows you a card: Life Orb 20%. Eviolite 20%. Assault Vest 20%. Weakness Policy 20%. Muscle Band 20%. "I\'m a smuggler, not a liar."',
    [
      ch('Buy (₽800).', out('You pry the lid off.', $(-800), any('life-orb', 'eviolite', 'assault-vest', 'weakness-policy', 'muscle-band')), { requires: [money(800)] }),
      ch('Open it here.', out('He puts a hand flat on the lid. "No refunds means no peeking." Then he waits.', room('smugglers-crate-closed'))),
      ch('Report it.', out('The officers open it. Inside, wrapped in a towel: one Poké Ball, scratched, with a name on it. It goes back to its owner through the Lost and Found. You never see their face, but you hear about it.', flag('reported-crime'), repUp(1), good(1))),
    ]),
  ev('smugglers-crate-closed', 'The Crate', 'Merchants & Deals', { room: true, ...SHADY }, 'The card again: Life Orb 20%. Eviolite 20%. Assault Vest 20%. Weakness Policy 20%. Muscle Band 20%.', [
    ch('Buy (₽800).', out('You pry the lid off.', $(-800), any('life-orb', 'eviolite', 'assault-vest', 'weakness-policy', 'muscle-band')), { requires: [money(800)] }),
    ch('Walk away.', leave('He shrugs. "Your loss. Twenty percent, each."')),
  ]),
  ev('back-alley-deal', 'Want Something Nobody Else Has?', 'One event for every type', SHADY,
    'An alley. A voice: "Want something nobody else has?" It\'s a rare held item: a Focus Sash. The tag says it was a Gym Leader\'s.',
    [
      ch('Buy (₽1200).', out('You buy it. It\'s a good item. The tag is still on it.', $(-1200), item('focus-sash'), flag('honest-kept-focus-sash'), flag('leader-item-bought'), evil(1)), { requires: [money(1200)] }),
      ch('Whose is it?', out('The tag says it belonged to the {gymType} Leader. The voice laughs. "Not any more."')),
      ch("I'll take it back to them.", fight('"Over my body." The seller steps out of the dark.', tf('Alley Seller', { cls: 'roughneck', size: 3, lv: 1, win: [flag('leader-item-returned'), repUp(1), good(1)] }))),
    ]),
  ev('stolen-goods-reclaim', 'That Was Ours', 'Merchants & Deals', { ...SHADY, callback: true, requires: [flagIs('black-bought'), notYet('reclaim-done')] },
    'A Grunt steps in front of you. Grunt: "That item you bought. It was ours. Hand it over."',
    [
      ch('Hand it over.', out('He takes the Choice Band and walks off without a word.', { kind: 'loseItem', id: 'choice-band' }, flag('honest-kept-choice-band', -99), done('reclaim-done')), { requires: [{ kind: 'item', id: 'choice-band' }] }),
      ch('Battle.', fight('Grunt: "Fine. The hard way."', { ...tf('Grunt', { cls: 'roughneck', size: 3, lv: 1, win: [done('reclaim-done')] }, [done('reclaim-done')]), evil: 'grunt' })),
      ch("It was someone's before it was yours.", out('Grunt: "...Huh." You name the owner from the stall. He stares at you, then shrugs. "Fine. Give it back to them, then. Not my problem." You do.', { kind: 'loseItem', id: 'choice-band' }, flag('honest-kept-choice-band', -99), done('reclaim-done'), good(1), repUp(1)), { requires: [flagIs('stall-lead'), { kind: 'item', id: 'choice-band' }] }),
    ]),
];

// ---------- SF78 The Estate Sale ----------
const ESTATE = { cast: [], tint: '#2a2420', effect: 'none' };
const SF78: Json[] = [
  ev('estate-sale', 'The Estate Sale', 'Merchants & Deals', ESTATE,
    'A house full of things, and a sign: EVERYTHING MUST GO. A relative in the doorway, arms crossed. Relative, Dora: "Take what you want. Prices are on the tags. Don\'t haggle. I can\'t today."',
    [
      ch('Buy cheaply (₽400).', out('Fair prices, all of them low. You find a held item in a drawer of old ribbons.', $(-400), any('silk-scarf', 'charcoal', 'mystic-water', 'miracle-seed', 'magnet', 'hard-stone')), { requires: [money(400)] }),
      ch('Ask about the owner.', out('Dora: "My uncle. He ran a Gym. Forty years ago. Nobody remembers." She looks at a small leather case on the mantel. "That\'s his badge case."', room('estate-owner'))),
      ch('Leave.', leave('You leave her to it.')),
    ]),
  ev('estate-owner', 'The Estate Sale', 'Merchants & Deals', { room: true, ...ESTATE }, 'Dora holds the badge case in both hands.', [
    ch('Buy the badge case (₽300).', out('She lets it go slowly. Inside: eight old badges, and a photograph of a young man with a Machop on his shoulder.', $(-300), flag('estate-badge-case')), { requires: [money(300)] }),
    ch('Keep it for him.', out('You close her hands around it. Dora: "...Thank you. Nobody asked about him. Not once, all week."', good(1))),
    ch('Tell me about his Gym.', out('She does. A small Gym, a Fighting Gym, forty years ago, where everybody knew everybody. She tells you his name. You won\'t forget it.', flag('estate-uncle-named'))),
  ]),
];

export const EVENTS: Json[] = [...SF73, ...SF74, ...SF75, ...SF76, ...SF77, ...SF78];
export const REMOVE: string[] = [];
void join; void repDown;
