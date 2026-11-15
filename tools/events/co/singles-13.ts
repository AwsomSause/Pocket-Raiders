// Catalog Overhaul Pack, category "singles" (revised single events), batch 13.
// Doc: catalog_overhaul/STORY_FAMILIES_22.md SF159 Market Weeks and SF160 Activity and Throwback Weeks.
// Same pattern as batch 12: each week's opening choice is a stop drawn only while that week runs (`gameEvent`).
// "For the week" lasts the region; "at every stage" is a `placeEvent` (one stop per stage map). Known limits: docs/status/co-singles.md.
import { $, any, better, bondUp, ch, fight, flag, flagAt, flagIs, good, heal, item, out, reveal, stat, wild, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';
import { wk } from './singles-12.ts';

export const CATEGORY = 'singles';

const rest: Json = { kind: 'rest' };
const rep = (n = 1): Json => flag('rep', n);
const no = (key: string): Json => flagIs(key, 0, 0);
const week = (label: string, effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, until: 'region' });
const place = (eventId: string): Json => ({ kind: 'placeEvent', eventId });
const prices = (value: number): Json => ({ kind: 'priceMultiplier', group: 'all', value });
const more = (...types: string[]): Json[] => types.map((type) => ({ kind: 'typeEncounterWeight', type, value: 2 }));
const moment = (text: string, importance = 35): Json => ({ kind: 'moment', text, importance });
const RARE = ['leftovers', 'life-orb', 'choice-band', 'expert-belt', 'focus-sash'];
const BERRIES = ['oran-berry', 'sitrus-berry', 'leppa-berry', 'cheri-berry', 'pecha-berry', 'rawst-berry', 'persim-berry'];

// ---------- SF159. MARKET WEEKS ----------
const SF159: Json[] = [
  wk('market-week', 'Market Week', '**"Everything must go!"** Stalls line both sides of the road, and every merchant in the region has come to shout about it.', [
    ch('Shop.', out('You walk the whole row with your team at your heels, haggling for fun. Everything is 10% off all week, and now you know where every stall is.', reveal())),
  ]),
  wk('black-friday-sale', 'Black Friday Sale', '**"Doors open at dawn. Limited stock!"** A queue is already forming outside the department store, and it is still dark.', [
    ch('Queue early.', out('You queue in the cold with your team huddled around you, and when the doors open you are third in. One thing in every shop is 30% off for you this region: the best deal on each shelf.', week('Black Friday: one item in every shop −30%', [{ kind: 'shopDeal', value: 0.7 }]))),
    ch('Wait.', out('You sleep in, and walk past the crush at noon. The early deals are gone, but the signs have changed: 20% off everything, all region.', week('Black Friday: everything −20%', [prices(0.8)]))),
  ]),
  wk('grand-opening-sale', 'Grand Opening Sale', '**"Grand Opening! First customers get first pick!"** Ribbon on the door, balloons on the sign, a nervous new owner on the step.', [
    ch('Visit.', out('You are the first customer through the door. The owner nearly cries. Every shop this region puts one extra item on its shelves early, just for you.', week('Grand Opening: one new item in every shop', [{ kind: 'shopEarlyStock', count: 1 }]))),
  ]),
  wk('berry-bonanza', 'Berry Bonanza', '**"Berries by the barrel!"** Carts piled so high with Berries that they roll off into the road, and your team chases every one.', [
    ch('Stock up.', out('You fill your bag, and your team fills their cheeks. Berries are half price in every shop this region.', week('Berry Bonanza: Berries half price', [{ kind: 'priceMultiplier', items: BERRIES, value: 0.5 }]))),
  ]),
  wk('held-item-hurricane', 'Held-Item Hurricane', '**"Hold onto your hats!"** A freak wind is blowing through the markets, and it is raining held items. Printed on the warning sign: 3 in 4 uncommon, 1 in 4 rare.', [
    ch('Catch one.', out('You run into the wind with your arms out and catch something as it tumbles past. The wind is not done: it will blow through again further down the road.', any('quick-claw', 'wide-lens', 'scope-lens', 'leftovers', 'life-orb'), { kind: 'laterEvent', eventId: 'wk-hurricane-again', nodes: 5 })),
  ]),
  wk('coupon-week', 'Coupon Week', '**"Every purchase comes with a coupon for the next!"** The shopkeepers are handing out slips of paper with everything, and your pockets fill up fast.', [
    ch('Collect.', out('You collect the coupons in a little book, and your team helps by sitting on the pile so it does not blow away. Every purchase this region is 10% cheaper, thanks to the last one.', week('Coupon Week: 10% off with your coupons', [prices(0.9)]))),
  ]),
  wk('bankruptcy-sale', 'Bankruptcy Sale', '**"EVERYTHING MUST GO. Closing for good."** An old shopkeeper stands in an empty doorway, trying to smile, and failing.', [
    ch('Buy cheaply.', out('You buy at half price. He thanks you, quietly, and starts taking the sign down. Everything on this stretch is half price until the stage ends.', { kind: 'tempEffect', label: 'Bankruptcy sale: half price this stage', effects: [prices(0.5)], until: 'boss' })),
    ch('Pay full price.', out('You pay the full price on the tag. He stares at the money, then at you. "That... that is the rent. That is next month." He puts the sign back up. "I\'ll still be here. You come back."', good(1), flag('kindness'), flagAt('bankrupt-shop-kept'))),
  ]),
  wk('prize-wheel-weekend', 'Prize Wheel Weekend', '**"Spin to win! Every winner spins!"** A huge painted wheel, and the odds printed in big honest letters on the side: 1 in 4 pays a bonus prize.', [
    ch('Spin.', out('The wheel clacks round and round. All weekend, after every battle you win, you get a spin: 1 in 4 pays a bonus prize, just as it says on the side.', week('Prize Wheel: a spin after every win (1 in 4 bonus prize)', [{ kind: 'bonusRewardChance', chance: 0.25 }]))),
  ]),
  wk('lottery-draw', 'Lottery Draw', '**"Tonight\'s draw: a Rare item for one lucky ticket!"** The odds are written under the price: 1 in 20.', [
    ch('Buy a ticket (₽100).', out('Your number is called. You stand there, holding the ticket, while the crowd cheers and your team jumps on you. One in twenty, and it was yours.', $(-100), any(...RARE)), { chance: 1 / 20, fail: out('The numbers are called. None of them are yours. One in twenty, the sign said; your team pats you on the leg anyway.', $(-100)) }),
  ]),
  wk('black-market-week', 'Black Market Week', '**"Psst. Strong stuff. No questions."** A coat full of items that should not be for sale, and a dealer who keeps looking over his shoulder.', [
    ch('Browse.', out('He shows you the good stuff and, to his credit, the warnings: the orb hits hard and hurts the holder; the band is strong but locks you into one move. You buy one.', any('life-orb', 'choice-band'), $(-300))),
    ch('Report them.', out('You walk to the nearest Officer and tell them everything. By evening the coat is gone and the town knows your name, for the right reasons.', rep(1), good(1))),
  ]),
  wk('inflation-day', 'Inflation Day', '**"Prices up 20%, effective immediately."** The shopkeepers apologise as they change the tags. The goods are better, at least.', [
    ch('Shop anyway.', out('You pay more, and grumble about it with your team. But the goods are a cut above: your next reward comes one tier better.', better())),
  ]),
  wk('loyalty-points-week', 'Pokémart Loyalty Points', '**"Sign up for points! Spend ₽1,000 and a Rare gift is yours."** A clerk holds out a shiny little card.', [
    ch('Sign up.', out('You sign up, and the clerk stamps the first box with a flourish. "Spend enough, and come back for the gift!" Your team guards the card like treasure.', { kind: 'laterEvent', eventId: 'wk-loyalty-gift', nodes: 6 })),
  ]),
  wk('trade-in-week', 'Trade-In Week', '**"Trade in, trade up!"** Every town has a trading post open, and the traders are honest this week.', [
    ch('Trade.', out('You find the trading post, and the trader shows you an Honest Trade Card: what you give, what you get, no tricks. A trading post opens on every stage this region.', flag('honest-trade-week'), week('Trade-In Week: a trading post on every stage', [place('trading-post')]))),
  ]),
  wk('tm-tuesday', 'TM Tuesday', '**"It\'s Tuesday! The TM vendors are in town!"** Discs glitter on every stall.', [
    ch('Browse TMs.', out('You flick through the discs while your team argues over which move they want. A TM Vendor sets up on every stage this region.', week('TM Tuesday: a TM Vendor on every stage', [place('tm-vendor')]))),
  ]),
];

// ---------- SF160. ACTIVITY AND THROWBACK WEEKS ----------
const SF160: Json[] = [
  wk('campfire-tales-week', 'Campfire Tales', '**"Gather round. Everyone has a story."** A fire in the clearing and a circle of trainers, faces orange in the light.', [
    ch('Tell a story.', out('You tell the story of this one: where you found it, the day it nearly gave up, the day it did not. It sits beside you and listens to the whole thing, and leans on you at the end. Campfires burn on every stage this region.', bondUp(1, 'picked'), moment('Told the story of a teammate at the campfire.'), week('Campfire Tales: a campfire on every stage', [place('tale-storyteller')])), { pick: {} }),
    ch('Listen.', out('You listen with your team in your lap, and the stories go on until the fire is embers. Campfires burn on every stage this region.', rest, week('Campfire Tales: a campfire on every stage', [place('tale-storyteller')]))),
  ]),
  wk('hidden-path-week', 'Hidden Path Week', '**"The secret routes are open."** Signposts point at walls, and the walls are not walls.', [
    ch('Look for them.', out('You look, and your team sniffs, and one by one the hidden paths show themselves. A secret path waits on every stage this region.', reveal(), week('Hidden Path Week: a secret path on every stage', [place('secret-route-path')]))),
  ]),
  wk('mystery-dungeon-week', 'Mystery Dungeon Week', '**"The dungeons have opened."** A stair in the ground that was not there yesterday, going down further than you can see.', [
    ch('Go down.', out('You go down the first steps with your team pressed close, and the dungeon breathes. A dungeon entrance opens on every stage this region.', week('Mystery Dungeon Week: an entrance on every stage', [place('md-entrance')]))),
  ]),
  wk('gen-1-throwback', 'Gen 1 Throwback', '**"Just like the old days!"** The grass is full of Pokémon from Kanto, the way it was when everything began.', [
    ch('Go find them.', fight('You wade into the grass and something old and familiar jumps out at you.', wild({ species: ['pidgey', 'rattata', 'caterpie', 'weedle', 'spearow', 'oddish', 'bellsprout', 'abra'] }))),
  ]),
  wk('gen-3-throwback', 'Gen 3 Throwback', '**"Hoenn, all week!"** Warm wind, tall grass, and the Pokémon of Hoenn everywhere you look.', [
    ch('Go find them.', fight('You wade into the grass and something from Hoenn jumps out at you.', wild({ species: ['zigzagoon', 'wurmple', 'poochyena', 'taillow', 'seedot', 'lotad', 'ralts', 'shroomish'] }))),
  ]),
  wk('gen-5-throwback', 'Gen 5 Throwback', '**"Unova, all week!"** City lights on the horizon and the Pokémon of Unova in the grass.', [
    ch('Go find them.', fight('You wade into the grass and something from Unova jumps out at you.', wild({ species: ['patrat', 'lillipup', 'purrloin', 'pidove', 'sewaddle', 'venipede', 'roggenrola', 'woobat'] }))),
  ]),
  wk('treasure-map-week', 'Treasure Map Week', '**"Map scraps! Every one a piece of something bigger!"** A sailor with a sack of torn parchment, ₽150 a scrap.', [
    ch('Buy a map scrap.', out('You pay, and unfold it on your knee. A coastline, a cross, and the start of a trail. Your team crowds round to look. The trail starts somewhere on every stage this region.', $(-150), week('Treasure Map Week: the trail starts on every stage', [place('th-map-1')]))),
  ]),
  wk('caravan-week', 'Caravan Week', '**"The caravans are on the road!"** A line of carts with painted wheels and bells, heading the way you are going.', [
    ch('Travel with it.', out('You walk beside the carts, and the merchants share their lunch with your team. A merchant cart stops on every stage this region.', week('Caravan Week: a merchant cart on every stage', [place('convoy-merchant-cart')]))),
  ]),
  wk('weather-map-week', 'Weather Map Week', '**"The forecast, for every stage!"** A big board in the square, painted with clouds and suns.', [
    ch('Read it.', out('You read it twice. Now you know what the sky will do ahead of you, and a weather vane stands on every stage this region.', reveal(), week('Weather Map Week: a weather vane on every stage', [place('weather-vane')]))),
  ]),
  wk('cave-expedition-week', 'Cave Expedition Week', '**"Lamps, ropes, and nerve."** Expedition tents at every cave mouth.', [
    ch('Go under.', out('You go under with a borrowed lamp and your team close. The caves go deeper this week, and a crystal cave waits on every stage this region.', week('Cave Expedition: a crystal cave on every stage', [place('crystal-cave')]))),
  ]),
  wk('island-hopping-week', 'Island Hopping Week', '**"All aboard! Every island, every day!"** Ferries in every harbour, horns going.', [
    ch('Take a ferry.', out('You stand at the rail with your team, the spray in your faces. A ferry waits on every stage this region.', week('Island Hopping: a ferry on every stage', [place('ss-ticket-ferry')]))),
  ]),
  wk('volcano-eruption', 'Volcano Eruption', '**"The mountain is waking!"** Smoke on the horizon, ash on the wind, families on the road with everything they own.', [
    ch('Help evacuate.', out('You carry, and your team carries, until the last family is out of the valley. A grandmother kisses your Pokémon on the head, one by one. The whole region hears about it.', rep(1), good(1), bondUp(1, 'party'))),
    ch('Go see.', out('You climb toward the glow. Fire-types are everywhere, and the rim of the volcano waits on every stage this region.', week('Eruption: Fire Pokémon about, the Volcano Rim on every stage', [...more('fire'), place('volcano-rim')]))),
  ]),
  wk('earthquake-tremors', 'Earthquake Tremors', '**"Hold on to something."** The ground shudders, and the map in your hand is wrong by the time you look at it.', [
    ch('Steady on.', out('You steady yourself, and your team steadies you. The stops ahead keep shifting this week, but you have seen how they lie now.', reveal())),
  ]),
  wk('flood-event', 'Flood Event', '**"The river\'s over the bank!"** Water in the streets, and townsfolk filling sandbags as fast as they can.', [
    ch('Help sandbag.', out('You fill bags until your arms give out, and your team drags them into the wall. The water stops at the last row. Nobody forgets who helped.', rep(1), good(1))),
    ch('Wade on.', out('You wade on through the flood. The water is high all week, and the spring flood waits on every stage this region.', week('Flood: the Spring Flood on every stage', [place('w4-spring-flood')]))),
  ]),
  wk('blizzard-week', 'Blizzard Week', '**"Nobody crosses the pass without a guide."** Snow sideways, and the mountain gone white.', [
    ch('Wait for a guide.', out('You wait by the fire for the guide, and your team curls up around you. When she comes, she takes you through safely, and everyone arrives warm.', heal(0.25), week('Blizzard: the Blizzard Pass on every stage', [place('blizzard-pass')]))),
    ch('Push through.', out('You push into the snow, shielding your team as best you can. It is hard going, and the pass will be waiting on every stage this region.', week('Blizzard: the Blizzard Pass on every stage', [place('blizzard-pass')]))),
  ]),
  wk('heat-wave', 'Heat Wave', '**"Too hot to move."** The road shimmers, and every Pokémon is panting in the shade.', [
    ch('Travel at night.', out('You rest through the heat and walk under the stars. The night is full of things you never see by day.', rest, reveal())),
    ch('Push on.', out('You push on through the heat with your team in your shadow. The heatwave scorches every stage this region.', week('Heat Wave: the heat on every stage', [place('heatwave')]))),
  ]),
  wk('aurora-night', 'Aurora Night', '**"The sky is on fire, and it\'s green."** The aurora is out, and everyone is heading north to see it.', [
    ch('Head north.', out('You lie in the snow with your team and watch the sky ripple. Nobody says anything for a long time. An aurora rest waits on every stage this region.', bondUp(1, 'party'), week('Aurora Night: an aurora rest on every stage', [place('wx-aurora-night')]))),
  ]),
  wk('safari-zone-week', 'Safari Zone Week', '**"Free entry, all week!"** The Safari Zone gate is wide open, and the warden is waving people through.', [
    ch('Get a pass.', out('The warden hands you a pass with a wink. "No charge this week." Safari Land is free to enter, and its gate stands on every stage this region.', flag('safari-pass'), week('Safari Zone Week: the Safari Zone on every stage', [place('safari-zone')]))),
  ]),
  wk('bug-contest-day', 'Bug Contest Day', '**"The Bug-Catching Contest starts at noon!"** Nets and jars and very serious children.', [
    ch('Enter.', out('You sign the form and get your net. The judge points at the park. "Biggest bug wins. Go!" The contest park is open on every stage this region.', week('Bug Contest Day: the contest on every stage', [place('bug-contest')]))),
  ]),
  wk('pokeathlon-day', 'Pokéathlon Day', '**"Run, jump, throw!"** The Pokéathlon dome is open, and the crowd is already roaring.', [
    ch('Compete.', out('You sign your team up. They bounce on their toes at the starting line. The Pokéathlon dome is open on every stage this region.', week('Pokéathlon Day: the dome on every stage', [place('pokeathlon')]))),
  ]),
  wk('underground-week', 'Underground Week', '**"Dig deep!"** Tunnels everywhere, and diggers coming up grinning with stones in their hands.', [
    ch('Dig.', out('You borrow a pick and dig with your team until you hit something hard. Dig sites open on every stage this region.', week('Underground Week: a fossil dig on every stage', [place('fossil-dig')]))),
  ]),
  wk('ruins-expedition', 'Ruins Expedition', '**"The expedition leaves at dawn."** A professor with a lantern and a list of ruins nobody has mapped.', [
    ch('Join.', out('You join, and the professor gives your team a job each. The rune tiles wait on every stage this region, and somewhere past them, an island nobody can find.', flag('lost-island-lead'), week('Ruins Expedition: rune tiles on every stage', [place('rf-rune-tiles')]))),
  ]),
  wk('sunken-ship-dive', 'Sunken Ship Dive', '**"The tide is out further than anyone has ever seen."** A wreck lies in the shallows, and below it, rooftops.', [
    ch('Dive.', out('You dive with your Water-types, down past the wreck to streets under the sea. There is a whole city down here. The wreck waits on every stage this region.', flag('sunken-city-open'), week('Sunken Ship Dive: the ghost ship on every stage', [place('ghost-ship')]))),
  ]),
  wk('sky-tower-climb', 'Sky Tower Climb', '**"The spire is open for the climb."** A tower so tall the top is in the clouds, and the wind howls round it.', [
    ch('Climb.', out('You take the first step, and your team follows you up, into the wind. The spire stands on every stage this region.', week('Sky Tower Climb: the spire on every stage', [place('windswept-spire-entrance')]))),
  ]),
  wk('magical-forest-week', 'Magical Forest Maze', '**"The forest is moving again."** Paths that loop back on themselves, and laughter in the trees.', [
    ch('Go in.', out('You step under the trees and they close behind you. The looping forest waits on every stage this week, and you have seen the way it turns.', reveal())),
  ]),
  wk('ghost-town-week', 'Ghost Town Visit', '**"Nobody lives here. Somebody is still here."** An empty town, every window lit.', [
    ch('Listen.', out('You stand in the square and listen. Footsteps, a music box, someone saying your name. Your team presses against your legs. Ghosts are about, and the haunted house waits on every stage this region.', week('Ghost Town: Ghost Pokémon about, the haunted house on every stage', [...more('ghost'), place('haunted-house')]))),
  ]),
  wk('festival-street-week', 'Festival Street', '**"Games! Prizes! Candy floss!"** A street of stalls and lights, and music from every one.', [
    ch('Browse.', out('You go from stall to stall with your team, winning nothing and laughing the whole time. Fairground stalls set up on every stage this region.', bondUp(1, 'party'), week('Festival Street: fairground stalls on every stage', [place('fun-and-games')]))),
  ]),
  wk('lighthouse-beacon-week', 'Lighthouse Beacon', '**"The beacon is lit!"** A beam sweeps the land at night, and where it falls, paths appear.', [
    ch('Follow it.', out('You follow the beam across the dark. It lights the hidden ways ahead of you, and the lighthouse stands on every stage this region.', reveal(), week('Lighthouse Beacon: the lighthouse on every stage', [place('lighthouse-entrance')]))),
  ]),
  wk('map-mutator-week', 'Map Mutator Week', '**"The map is being strange this week."** Roads that were not there, a tower in a field, signs pointing at the sky.', [
    ch('Embrace it.', out('You throw the old map away and walk where your feet take you. Something odd stands on every stage this region: a lookout tower that should not be there.', week('Map Mutator: an oddity on every stage', [place('lookout-tower')]))),
  ]),
  wk('train-ride-special', 'Train Ride Special', '**"All aboard the Express!"** A steam train with gold trim, whistle screaming.', [
    ch('Ride.', out('You get a window seat and your team presses their faces to the glass. The Express stops on every stage this region.', week('Train Ride Special: the Express on every stage', [place('w4-express-train')]))),
  ]),
  wk('friendship-level-week', 'Friendship Level Week', '**"This week is for them."** No battles in the square, just trainers and their Pokémon, sitting together.', [
    ch('Spend time together.', out('You spend the whole afternoon with your team: brushing, playing, doing nothing at all. Bond grows twice as fast this week.', bondUp(1, 'party'))),
  ]),
  wk('evolution-festival', 'Evolution Festival', '**"Everything wants to grow up!"** Lights, dancing, and Pokémon glowing all over the square.', [
    ch('Celebrate.', out('You celebrate with your team, and one of them glows for a second, just a flicker, as if trying it on. Evolution comes 2 levels sooner this week.', { kind: 'celebrate' }, bondUp(1, 'party'))),
  ]),
  wk('move-tutor-tour', 'Move Tutor Tour', '**"The tutors are touring!"** A bus full of teachers, stopping in every town.', [
    ch('Learn.', out('A tutor climbs down and sets up right here. A tutor waits on every stage this region.', { kind: 'addStop', stop: 'tutor' }, week('Move Tutor Tour: a tutor on every stage', [place('move-tutor')]))),
  ]),
  wk('ev-boot-camp', 'EV Boot Camp', '**"Drop and give me twenty!"** A drill sergeant with a whistle, and a field full of Pokémon doing push-ups. "Pick your focus, recruit!"', [
    ch('Attack and Sp. Atk.', out('Your team trains until they are seeing double. This region, every one of them hits harder.', stat('atk', { points: 2, who: 'party', region: true }), stat('spa', { points: 2, who: 'party', region: true }))),
    ch('Defence and Sp. Def.', out('Your team trains until nothing can knock them down. This region, every one of them takes hits better.', stat('def', { points: 2, who: 'party', region: true }), stat('spd', { points: 2, who: 'party', region: true }))),
    ch('Speed.', out('Your team runs laps until the sergeant runs out of whistle. This region, every one of them is quicker.', stat('spe', { points: 3, who: 'party', region: true }))),
    ch('HP.', out('Your team trains until they can go all day. This region, every one of them is tougher.', stat('hp', { points: 3, who: 'party', region: true }))),
  ]),
  wk('contest-spectacular', 'Contest Spectacular', '**"Beauty! Cool! Cute! Clever! Tough!"** The contest halls are lit up in every town.', [
    ch('Enter.', out('You sign your team up. They preen all the way to the stage. A contest hall opens on every stage this region.', week('Contest Spectacular: a contest hall on every stage', [place('contest-hall')]))),
  ]),
  wk('photography-week', 'Pokémon Photography Week', '**"Say cheese!"** Cameras everywhere, and a photo corner in every town.', [
    ch('Take photos.', out('You take a hundred photos of your team, and one of them is perfect: everyone looking, everyone happy. A photo corner waits on every stage this region.', moment('A perfect photo of the whole team.', 45), week('Photography Week: a photo corner on every stage', [place('rest-photo')]))),
  ]),
];

const ROOMS: Json[] = [
  {
    id: 'wk-hurricane-again', name: 'The Wind Returns', group: 'Calendar weeks', room: true, scene: { cast: [], effect: 'none' },
    intro: 'The wind is back, and it is raining held items again. Same odds: 3 in 4 uncommon, 1 in 4 rare.',
    choices: [ch('Catch one.', out('You catch another one as it whirls past. That is the last of the storm.', any('quick-claw', 'wide-lens', 'scope-lens', 'leftovers', 'life-orb')))],
  },
  {
    id: 'wk-loyalty-gift', name: 'Loyalty Card Full', group: 'Calendar weeks', room: true, scene: { cast: [], effect: 'sparkle' },
    intro: 'The clerk from the Pokémart waves you down. "Your card! It\'s full! Here, here, your gift!"',
    choices: [ch('Take the gift.', out('A Rare gift, wrapped in a ribbon. Your team insists on opening it.', any(...RARE)))],
  },
  {
    id: 'wk-bankrupt-shop-open',
    name: 'Still Open',
    group: 'Calendar weeks',
    stop: 'event',
    rarity: 'uncommon',
    callback: true,
    requires: [{ kind: 'flag', key: 'bankrupt-shop-kept', atLeast: 1, regionsAgo: 1 }, no('bankrupt-shop-seen')],
    scene: { cast: [], effect: 'sparkle' },
    intro: 'A little shop on the corner, the sign freshly painted. The old shopkeeper looks up, sees you, and comes out from behind the counter with both hands out. "You came back. I\'m still here. Because of you."',
    choices: [
      ch('Shop with him.', out('He will not hear of full price this time. "Friends\' rate." Everything here is 10% off until the stage ends, and he slips something extra into your bag.', { kind: 'tempEffect', label: 'Friends\' rate: 10% off this stage', effects: [prices(0.9)], until: 'boss' }, item('nugget'), flag('bankrupt-shop-seen'))),
      ch('Just say hello.', out('You stay for tea instead. He shows your team the photo on the wall: the shop, the day it opened, forty years ago. "Still open," he says, and taps the glass.', bondUp(1, 'party'), flag('bankrupt-shop-seen'))),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF159, ...SF160, ...ROOMS]);
export const REMOVE: string[] = [];
