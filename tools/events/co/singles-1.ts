// Catalog Overhaul Pack, category "singles" (revised single events), batch 1.
// Doc: catalog_overhaul/STORY_FAMILIES_19.md, SF135 Map Stops and SF136 Travel and Shortcuts.
// Each event keeps the doc's exact buttons, outcome and flags; the text is expanded. Known limits: docs/status/co-singles.md.
import { $, any, anyType, bondUp, ch, good, cure, express, fight, flag, flagIs, heal, hurtLead, item, leave, lv, moveFlag, out, reveal, room, roomFrom, scout, stopHere, takeNode, trainer, wild, type Json } from '../dsl.ts';

export const CATEGORY = 'singles';

const BERRY = ['oran-berry', 'sitrus-berry', 'pecha-berry', 'cheri-berry', 'leppa-berry', 'lum-berry'];
const RARE_BERRY = ['liechi-berry', 'ganlon-berry', 'salac-berry', 'petaya-berry', 'apicot-berry'];
const CACHE = ['nugget', 'star-piece', 'big-pearl', 'rare-candy', 'leftovers', 'focus-sash'];
const DUNGEON_DOORS = ['dg-ancient-ruins-a', 'dg-deep-mine-a', 'dg-haunted-mansion-a', 'dg-frozen-cavern-a', 'dg-volcanic-core-a', 'dg-deep-ocean-a', 'dg-overgrown-forest-a', 'dg-celestial-observatory-a'];
const GMAX = ['copperajah-gmax', 'centiskorch-gmax', 'rillaboom-gmax', 'corviknight-gmax', 'drednaw-gmax'];
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const types = (...ts: string[]): Json => (ts.length === 1 ? { kind: 'partyType', type: ts[0] } : anyType(...ts));
const no = (key: string): Json => ({ kind: 'flag', key, atMost: 0 });
const weakest = (amount: number): Json => ({ kind: 'levels', amount, who: 'weakest' });
const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const rival = (feelings: Json): Json => ({ kind: 'rivalChange', feelings });
/** The next wild Pokémon is easier to catch (the doc's "+1 catch step"). */
const catchStep = (label: string): Json => ({ kind: 'tempEffect', label, effects: [{ kind: 'captureMultiplier', value: 1.25 }], battles: 1, until: 'wild' });
/** Prizes x1.5 for the next `battles` fights. */
const prizes = (battles: number): Json => ({ kind: 'tempEffect', label: 'Side-trail prizes ×1.5', effects: [{ kind: 'moneyMultiplier', value: 1.5 }], battles, until: 'battle' });
/** A new room (never drawn on its own; an outcome opens it). */
const rm = (id: string, name: string, group: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group, room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });

const SIDE_TRAIL = {
  intro: 'A trail that leaves the route and rejoins it further on. Three trainers wait along it, and there is no Center. A board at the fork says the prizes run at ×1.5 here.',
  choices: [
    ch('Take it.', fight('The first trainer steps out of the grass, grinning. Three in a row, no healing between, and every prize half as big again.', trainer('Trail Trainer', { chain: 3, size: 2, win: [$(600)] }), prizes(3))),
    ch('Stay on the route.', leave('You stay on the route. The trail was only ever an offer, and it will be here for somebody braver or more broke.')),
  ],
};

// ---------- SF135. MAP STOPS ----------
const SF135: Json[] = [
  {
    id: 'berry-tree',
    intro: 'A lone Berry tree stands where the route bends, so heavy with fruit that its lowest branches rest in the grass. Nobody has come this way in days. Everything on it is ripe.',
    choices: [
      ch('Strip it.', out('You shake every branch until nothing is left but leaves. Four Berries, and a tree that looks smaller than it did a minute ago.', any(...BERRY), any(...BERRY), any(...BERRY), any(...BERRY))),
      ch('Take a few, leave the rest.', out('You pick two and stop, with fruit still swinging on the branches. Whoever walks this road after you will find it waiting, and will never know who to thank.', any(...BERRY), any(...BERRY), flag('berrytree-left'))),
    ],
  },
  // The doc's callback: Pell Junior finds the tree still full, meets the player later and gives back a Rare Berry.
  { ...rm('berry-tree-pell', 'Pell Junior', 'Map stops', '**Hiker, Pell Junior**, jogs up the road behind you with a rucksack of rattling jars. "You\'re the one who left the tree some! I got there starving, and it was still full. Dad always said: a traveller who leaves a few is worth catching up to."', [
    ch('Take the Rare Berry.', out('He presses it into your hand like a secret. "Top branch. I climbed for it. It was always going to whoever left the rest." He waves until the road hides him.', any(...RARE_BERRY), flag('berrytree-pell-met'), moment('Pell Junior caught up to say thank you for the Berries left on the tree.', 35))),
  ]), room: false, callback: true, requires: [flagIs('berrytree-left'), no('berrytree-pell-met')], scene: { cast: ['trainer.hiker'], effect: 'sparkle' } },
  {
    id: 'pokemon-center',
    intro: 'A small Pokémon Center: one room, a shop counter, a single lamp over the desk. The nurse is yawning into a cup of tea that went cold hours ago.',
    choices: [
      ch('Heal.', out('The machine hums, the lights run green, and every Pokémon comes back bright-eyed. The nurse waves you off with half a smile and the other half of a yawn.', heal(1), cure())),
      ch('Heal, and ask how she is.', out('She blinks. Nobody has asked her that all week. She has been on since last night, alone. While the machine hums, your lead climbs up beside her and keeps her company, and she talks to it softly the whole time.', heal(1), cure(), flag('center-nurse-asked'))),
      ch('Shop.', out('She slides the shutter up on the counter. "Take your time. It\'s nice to have someone in."', stopHere('shop'))),
    ],
    // "Next Center visit, a free Revive."
    remembers: [{
      id: 'nurse-revive', when: [flagIs('center-nurse-asked'), no('center-nurse-revive')],
      notice: 'The nurse here looks up and smiles before you reach the desk. "You\'re the one who asked after the night nurse down the road. She rang every Center on the line about you."',
      addChoices: [ch('Take the free Revive.', out('"From all of us on the night shift. Nobody ever asks." She heals the team as well, and will not hear a word about paying.', heal(1), cure(), item('revive'), flag('center-nurse-revive')))],
    }],
  },
  {
    id: 'training-ground',
    intro: 'Worn tracks, a rack of weights, a row of scarred targets. A faded board by the gate lists every Pokémon that ever trained here, in a hundred different handwritings.',
    choices: [
      ch('Train the lead.', out('Your lead throws itself at the course until its chest heaves and its eyes shine. It gains a level, and it looks back at you to make sure you saw.', lv(1))),
      ch('Train the weakest.', out('You take the one at the back of the line and give it the whole afternoon. It stumbles, tries again, and gets it. It gains two levels: the board says those who are behind catch up twice as fast here.', weakest(2))),
    ],
  },
  {
    id: 'treasure-cache',
    intro: 'A box sticks out of the dirt, its corners green with age. A name is scratched into the lid in a child\'s careful letters: "R. Tanner."',
    choices: [
      ch('Open it.', out('The lid creaks. Inside is one thing a box like this could hold: a Nugget, a Star Piece, a Big Pearl, a Rare Candy, Leftovers or a Focus Sash. Under it, a note in the same careful letters: "For emergencies."', any(...CACHE))),
      ch('Find R. Tanner.', out('It takes a whole stop of the road to find him. Tanner is a kid, and the box is every coin he ever saved, buried in case his family needed it. When you hand it back unopened he stares, then holds it out. "Pick one thing. Please." The whole village hears about it by supper.', takeNode(), any(...CACHE), flag('rep'), flag('cache-tanner-found'), moment('Carried a buried savings box back to a kid named Tanner.', 45))),
    ],
  },
  {
    id: 'villain-hideout',
    intro: 'A poster on a wall hums when you lean on it. Behind the paper there is a seam, and behind the seam a stairwell going down. Somebody went to a lot of trouble to hide this.',
    choices: [
      ch('Go in.', out('You peel the poster back and step through. The air below is warm and smells of machines. There are rooms down here, and someone has left the lights on.', room('ps-evil-hideout-gate'))),
      ch('Note it and leave.', out('You write down the wall, the poster and the hum, and walk away at an ordinary pace. Whatever you learn about these people later, this door is in the Files now.', flag('hideout-noted'))),
    ],
  },
  {
    id: 'lookout-tower',
    intro: 'A leaning tower, a rope ladder, a rusted telescope. Fog lies over everything below, but the top of the tower is above it, in clear light.',
    choices: [
      ch('Climb.', out('Rung over rung, and then the fog falls away beneath you. The whole stage lies open like a map, and through the telescope something shows that the road never would have: a hidden stop.', scout(20), reveal())),
      ch('Send a Flying-type up.', out('It circles the tower twice, small against the sky, then drops back to your arm and shows you everything it saw. The whole stage, and one hidden stop besides.', scout(20), reveal()), { requires: [types('flying')] }),
    ],
  },
  {
    id: 'ev-hidden-dungeon',
    secret: [],
    intro: 'Behind a curtain of vines, a stone door stands ajar, not quite wide enough. Three torn pages would fit the slot cut into it. The slot is empty in all three places.',
    choices: [
      ch('Use the pages.', out('The three pages slide home as if they had been waiting. The stone breathes out, and the door swings wide onto stairs nobody has walked in a hundred years. The Mystery Dungeon is open.', roomFrom(...DUNGEON_DOORS)), { requires: [flagIs('torn-page', 3)] }),
      ch('Leave.', leave('You push once more. The door will not move, and the slot shows exactly how many pages are missing. You let the vines fall back over it.')),
    ],
    remembers: [
      { id: 'pages-three', when: [flagIs('torn-page', 3)], intro: 'Behind a curtain of vines, a stone door stands ajar. Three torn pages would fit the slot cut into it, and you are carrying three. They are warm in your bag.' },
      { id: 'pages-two', when: [flagIs('torn-page', 2)], intro: 'Behind a curtain of vines, a stone door stands ajar. Three torn pages would fit the slot cut into it. You have two. One place in the slot stays dark.' },
      { id: 'pages-one', when: [flagIs('torn-page', 1)], intro: 'Behind a curtain of vines, a stone door stands ajar. Three torn pages would fit the slot cut into it. You have one. Two places in the slot stay dark.' },
    ],
  },
  {
    id: 'ev-regional-festival',
    intro: 'Lanterns swing between the stalls, games ring out from every corner, and by the fountain strangers are swapping gifts and laughing at what they got. Somebody presses a warm paper cup into your hands.',
    choices: [
      ch('Join the swap.', out('You set your gift on the fountain wall. Across from you a stranger sets down theirs, and for a moment you each just look at what the other chose to give.', room('festival-gift-swap'))),
      ch('Play the games.', out('The stalls are loud and bright and every one of them wants you. Your team is already pulling you toward the nearest.', { kind: 'addStop', stop: 'minigame' })),
      ch('Watch.', out('You stay at the edge of the light and let the evening happen. Your team leans against you, one by one, until the lanterns burn low.')),
    ],
  },
  // TRADES.md Pool 13 is the markets thread's; until its Honest Trade Card lands this room plays the swap with both gifts shown.
  rm('festival-gift-swap', 'The Gift Swap', 'Map stops', 'The swap is honest: both gifts sit on the fountain wall in plain sight. Theirs is a Sitrus Berry tied with ribbon. Yours would be a Potion from your bag. They can see it, and they are smiling.', [
    ch('Swap.', out('You trade. They hold the Potion like it is worth ten times what it is. "My Pokémon\'s been poorly. You have no idea." The ribbon is still on the Berry.', { kind: 'loseItem', id: 'potion' }, item('sitrus-berry')), { requires: [{ kind: 'item', id: 'potion' }] }),
    ch('Keep your gift.', leave('You shake your head, kindly. They nod, and somebody else steps up to the wall.')),
  ], { scene: { cast: [], effect: 'hearts' } }),
  {
    id: 'rare-sighting',
    intro: 'Fresh tracks leave the path and end at a Pokémon nobody has ever recorded on this route. It has already noticed you. It has not run.',
    choices: [
      ch('Approach.', fight('You step forward, slowly, hands open. It watches every step, and then it squares up. This is one of the rare ones.', wild({ lv: 3, shiny: 2, win: [moment('Faced a rare sighting.', 30)] }))),
      ch('Stay still.', fight('You do not move. You barely breathe. It tilts its head and comes closer on its own, curious, close enough to touch, before it remembers to be wild. It will be a little easier to catch.', wild({ lv: 3, shiny: 2, win: [moment('A rare Pokémon walked up on its own.', 30)] }), catchStep('It came closer: easier to catch'))),
    ],
  },
  {
    id: 'shimmering-grass',
    intro: 'One patch of grass glitters when nothing else does. Something in it is the wrong colour, the way a dream is the wrong colour.',
    choices: [
      ch('Look closer.', out('You part the grass with one finger. It is there, and it is looking back at you.', room('shimmering-grass-close'))),
      ch('Walk on.', leave('Not every shining thing is yours to find. You walk on, and the glitter stays behind your eyes all the way to the next stop.')),
    ],
  },
  rm('shimmering-grass-close', 'In the Shimmering Grass', 'Map stops', 'Up close, you can see it clearly: a wild Pokémon of this route, and its colours may not be the usual ones. It has not bolted. You can still back away.', [
    ch('Step in.', fight('The grass bursts apart in a spray of light.', wild({ shiny: 6 }))),
    ch('Back away.', leave('You let the grass close again. It goes on glittering, untroubled.')),
  ], { scene: { cast: [], effect: 'glint' } }),
  {
    id: 'route-detour',
    intro: 'A sign: "Shortcut. Probably safe." Under it, in different handwriting: "Clinic ahead. Rest awhile." Somebody has drawn a small heart on the second one.',
    choices: [
      ch('Shortcut.', out('You take the shortcut. The grass closes over the path behind you, and ahead, a side trail forks off toward voices.', room('route-detour-trail'))),
      ch('Clinic.', out('A small clinic, a kettle already on, and not a trainer in sight. The nurse who drew the heart heals everyone and sends you off with dry socks.', heal(1), cure())),
    ],
  },
  { id: 'side-trail', ...SIDE_TRAIL },
  // The Detour Sign's "Shortcut" leads onto the same trail; a room, because side-trail is also drawn on its own.
  rm('route-detour-trail', 'The Side Trail', 'Map stops', SIDE_TRAIL.intro, SIDE_TRAIL.choices),
  {
    id: 'galar-gigantamax-sighting',
    intro: 'The ground shakes. Over the ridge, a Pokémon towers into the clouds, wreathed in swirling red. Your whole team has gone very still, staring up.',
    choices: [
      ch('Follow it.', out('You run for the ridge while it is still in sight. From the top you can finally see what it is, and where it has stopped.', roomFrom(...GMAX.map((s) => `gmax-den-${s.replace('-gmax', '')}`)))),
      ch('Let it go.', leave('You let it go. It sinks behind the ridge like a slow red sunset, and the ground settles, and your team finally breathes.')),
    ],
  },
  ...GMAX.map((s) => rm(`gmax-den-${s.replace('-gmax', '')}`, 'The Giant on the Ridge', 'Map stops', `From the ridge you can see it clearly now: a Gigantamax ${cap(s.replace('-gmax', ''))}, red clouds turning above its head. It has not seen you yet.`, [
    ch('Face it.', fight('It turns. The whole sky turns with it.', wild({ species: [s], lv: 4, win: [moment('Faced a Gigantamax Pokémon in the wild.', 70)] }))),
    ch('Back down the ridge.', leave('You back away one step at a time. Some stories are better told from a distance.')),
  ], { scene: { cast: [], pokemon: s, effect: 'shake' } })),
  {
    id: 'galar-runaway-wooloo',
    intro: 'A Wooloo comes rolling down the route at full speed, taking a fence with it. **Shepherd, out of breath:** "Please! It does this every Tuesday!"',
    choices: [
      ch('Stop it (a Rock- or Steel-type).', out('Your Pokémon plants its feet. The Wooloo bumps into it, bounces once and sits down, delighted with itself. The shepherd laughs until she has to lean on the fence. "Take some wool. Sells for ₽200, and you earned every bit."', item('wooloo-wool')), { requires: [types('rock', 'steel')] }),
      ch('Roll with it.', out('You cannot stop it, so you join it. Your whole party goes tumbling down the hill after the Wooloo, shrieking, and when you all fetch up in a heap you are a good way down the route.', express())),
      ch('Let it go.', leave('You step aside. The Wooloo rolls by, perfectly happy. The shepherd jogs past after it, calling thanks and apologies in equal parts.')),
    ],
  },
  {
    id: 'world-hidden-grotto',
    intro: 'A crack behind a waterfall opens into a grotto that glows on its own. From the far end comes a breeze that smells of somewhere you have not been yet.',
    choices: [
      ch('Go in.', out('You duck under the falling water. Something lives in here, and in the glow you can make out its shape before it notices you.', room('hidden-grotto-den'))),
      ch('Follow the breeze.', out('The breeze leads you through a passage barely wider than your shoulders, and out into daylight far ahead of where you went in. Every hidden stop on the road shows itself from here.', express(), reveal())),
    ],
  },
  rm('hidden-grotto-den', 'The Grotto\'s Keeper', 'Map stops', 'In the grotto\'s glow a wild Pokémon is drinking from the pool: a hidden one, stronger than the route\'s usual, and it has every colour the light gives it. It has not looked up.', [
    ch('Step into the light.', fight('It looks up. The glow shivers.', wild({ lv: 2, shiny: 3 }))),
    ch('Leave it to its pool.', leave('You leave it drinking. The waterfall closes behind you like a curtain.')),
  ], { scene: { cast: [], effect: 'sparkle' } }),
  {
    id: 'wx-sinkhole',
    intro: 'The ground opens under your feet. For one long second there is nothing, and then there is a cave, a patch of sky far above, and your team landing around you in a heap.',
    choices: [
      ch('Look for a way up.', out('You count heads first. Everyone is here. Then you find the slope, and climb it together, hauling each other the last stretch into the light. It takes a whole stop of the road.', takeNode())),
      ch('Explore down.', out('The dark goes on below, and it is not empty. You go down into one floor of a Mystery Dungeon.', roomFrom(...DUNGEON_DOORS))),
    ],
  },
];

// ---------- SF136. TRAVEL AND SHORTCUTS ----------
const SF136: Json[] = [
  {
    id: 'w4-balloon',
    intro: '**Balloonist, Hetty:** "Wind\'s from the west. Hop in." The little flags on her basket all point the same way down the route, to the stops the wind can reach.',
    choices: [
      ch('Hop in, and pick where to land.', out('The ground lets go of you. Your team crowds the edge of the basket, and the whole route slides by underneath, small and quiet. Hetty hums. Your next move lands two columns ahead, wherever the flags point.', express())),
      ch('No, thanks.', leave('"Suit yourself. The wind won\'t wait, but it does come back." She rises without you, waving.')),
    ],
  },
  {
    id: 'w4-cave-echo',
    intro: 'Every sound in this cave comes back twice. Somewhere, though, the echo is wrong: one stretch of wall gives back less than it is given.',
    choices: [
      ch('Use a sound move.', out('Your Pokémon lets its voice go. The echo runs the walls, and at one spot the rock answers hollow, cracks, and falls in. Behind it is a hidden room, and something left there long ago, just inside the door.', any('nugget', 'star-piece', 'rare-candy', 'metronome', 'throat-spray'), room('w4-echo-chamber')), { requires: [moveFlag('sound')] }),
      ch('Clap.', out('You clap once. Twice it comes back, from everywhere but one place: low on the left wall, the sound just stops. Now you know where. It will still take a real voice to open it.', flag('cave-echo-heard'))),
    ],
    remembers: [{
      id: 'echo-heard', when: [flagIs('cave-echo-heard')],
      notice: 'You already know where the echo is wrong: low on the left wall. It still needs a sound move to break it open.',
    }],
  },
  {
    id: 'w4-graffiti-wall',
    intro: 'A wall of painted arrows and tags, years deep. One tag near the bottom is your rival\'s. There is a date next to it, and the paint is not old.',
    choices: [
      ch('Follow the arrows.', out('The arrows are not decoration. You follow them round the back of the wall, and they point out two stops that are on no map.', reveal(), scout(4))),
      ch('Read the rival\'s tag.', out('"I was here first. Ha." There is a little drawing of their ace next to it, done with real care. And just below, a patch of clean wall.', room('w4-graffiti-tag'))),
    ],
  },
  rm('w4-graffiti-tag', 'The Clean Patch of Wall', 'Travel and shortcuts', 'Under your rival\'s tag there is a clean patch of wall, just big enough. Somebody has left half a can of paint on the ground.', [
    ch('Add your own tag below it.', out('You write your name under theirs, and after a moment, a small drawing of your own lead beside their ace. They will come back this way. They will pretend to be annoyed.', rival({ trust: 1 }), moment('Left a tag under the rival\'s on the graffiti wall.', 40))),
    ch('Leave it as it is.', leave('You leave their wall alone. It was their moment.')),
  ]),
  {
    id: 'w4-raft',
    intro: 'A raft tied at the bank; a long, slow current going exactly your way; and the fish are biting so hard the water twitches.',
    choices: [
      ch('Ride it.', out('You push off and lie back. The banks slide past, your team trails their paws in the water, and for a while nobody has to walk anywhere. The current carries you well down the route.', express(), heal(0.1))),
      ch('Ride and fish.', out('You drift with a line over the side. You do not get as far, but where the raft noses into the bank the water is alive with fish.', express(), stopHere('fish'))),
    ],
  },
  {
    id: 'w4-rock-climb',
    intro: 'Good grey rock, the kind that holds. At the top, in a nest of shining stones, something old is waiting to be found.',
    choices: [
      ch('Climb with a Rock-type anchoring.', out('Your Rock-type takes the rope and does not move an inch. You climb as if the cliff were a ladder. In the nest: one fossil, a Plume, a Root or a Claw, whole after all this time.', any('plume-fossil', 'root-fossil', 'claw-fossil')), { requires: [types('rock')] }),
      ch('Free-climb.', out('No rope. Your lead goes first to test the holds, and one of them gives. It catches itself, scraped and shaking (10% of its HP), and goes on up anyway. The fossil is there: a Plume, a Root or a Claw.', hurtLead(0.1), any('plume-fossil', 'root-fossil', 'claw-fossil'))),
    ],
  },
  {
    id: 'w4-tracks',
    intro: 'Big tracks, each one wider than your hand, lead off the road into long grass. They are fresh. The grass is still springing back.',
    choices: [
      ch('Follow.', out('You follow them, as quietly as you know how. They go on a long way, and then they stop.', room('w4-tracks-deep'))),
      ch('Leave them.', leave('Whatever made those is going about its day. You let it.')),
    ],
  },
  {
    id: 'w4-tracks-deep',
    intro: 'The tracks end at a hollow under a fallen tree. Something very big is asleep inside. Its breathing moves the leaves.',
    choices: [
      ch('Wake it gently.', fight('You say something soft. One eye opens, as big as your fist. It is an Alpha, and it is deciding about you.', wild({ lv: 4, shiny: 3, win: [flag('calmed-alpha'), moment('Woke an Alpha at the end of the tracks.', 50)] }))),
      ch('Look at it.', out('You stay where you are and just look, long enough to know exactly what it is: an Alpha of this route, half again the size of any other. You mark the hollow on your map and back away. It never wakes.', flag('tracks-hollow-saved'))),
      ch('Leave.', leave('You back out the way you came, placing your feet in its tracks so the grass will not tell on you.')),
    ],
    remembers: [{ id: 'hollow-saved', when: [flagIs('tracks-hollow-saved')], notice: 'This is the hollow you marked on your map. It is still asleep in there.' }],
  },
  {
    id: 'w4-zip-line',
    intro: 'A cable runs down the whole valley, humming in the wind. A harness hangs from it, swaying, made for one.',
    choices: [
      // The old zip-line timing prompt stays: the grade only changes the landing, the doc's outcome (skip a node) holds either way.
      ch('Ride it.', out('You clip in, lift your feet, and the valley opens under you like a held breath let go. You let go right over the platform and land running, a stop ahead, laughing.', express()), { prompt: { id: 'zip-line', needs: 'good' }, fail: out('You clip in and the valley opens under you. You let go a beat late and roll into the soft grass past the platform, a stop ahead, laughing anyway.', express()) }),
      ch('Let a Flying-type carry one more.', out('You ride the cable, and your Flying-type flies alongside with a teammate held in its claws, both of them shrieking with joy the whole way down. The passenger will not stop talking about it.', express(), bondUp(1, 'picked')), { requires: [types('flying')], pick: {} }),
    ],
  },
  {
    id: 'stranded-cyclist',
    intro: '**Cyclist, Rafi:** "Bent wheel. Help? I\'ll lend you the bike." He is sitting on the verge with the wheel in his lap, trying to look like he is not upset.',
    choices: [
      ch('Fix it (a Steel- or Fighting-type).', out('Your Pokémon takes the wheel in both hands and, very gently, makes it round again. Rafi spins it and it sings. "Take her down the hill. Leave her at the bottom. She knows the way back." You ride a stop ahead.', express()), { requires: [types('steel', 'fighting')] }),
      ch('Walk on.', leave('"No worries," says Rafi, and goes back to looking at his wheel.')),
    ],
  },
  {
    id: 'taxi-fare',
    intro: '**Driver:** "Flat tyre\'s fixed, back\'s gone, and there\'s a fare waiting. Drive her across the map for me?" He holds out the keys like a man handing over a baby.',
    choices: [
      ch('Drive (a Pokémon rides on the roof).', out('You drive. The Pokémon you chose rides on the roof with its face in the wind and its eyes shut, and people along the road stop to wave at it. By the time you hand the keys back you are far down the route, and it does not want to get down. It loved every second.', express(), bondUp(1, 'picked')), { pick: {} }),
      ch('No.', leave('"Fair enough. She\'s got a clutch like a bad temper." He lowers himself back onto the bumper.')),
    ],
  },
  {
    id: 'mailman-shortcut',
    intro: '**Mailman, Mr. Abara:** "Take these down the road? I tip." His bag is twice the size of him, and he has been carrying it since before the sun was up.',
    choices: [
      ch('Take them.', out('You deliver every one, and every door opens on someone glad. Mr. Abara tips ₽200. The last letter in the bundle has your name on it: a postcard from up the road, and on the back, in a stranger\'s hand, everything they saw of the Gym ahead.', $(200), { kind: 'gymPreview' }, moment('A postcard arrived from the next region.', 30))),
      ch('No.', leave('"No harm in asking." He shoulders the bag again, one strap at a time.')),
    ],
  },
  {
    id: 'marooned-sailor',
    intro: 'A sailor stands on a rock a long way out, waving his whole shirt. "A boat! A boat!" The tide is not waiting for either of you.',
    choices: [
      ch('Rescue (a Water- or Flying-type).', out('Your Pokémon brings him in, soaked and babbling thanks. When he can speak properly he unrolls a sea chart, salt-stained and precious. "Three years I kept this dry." One stop out on the water shows itself on your map.', scout(3), reveal()), { requires: [types('water', 'flying')] }),
      ch('Throw a line.', out('The line flies true. He ties it round his waist and you haul him in hand over hand, both of you shouting. He gives you his sea chart with shaking hands, and one stop out on the water shows itself.', scout(3), reveal()), { chance: 0.5, fail: out('The line falls short, and short again. On the third throw a passing fishing boat sees him and takes him off. He waves at you anyway, for trying.') }),
    ],
  },
  {
    id: 'ask-directions',
    intro: '**Local, pointing two ways at once:** "Depends who\'s asking."',
    choices: [
      ch('Left.', fight('Left it is. A trainer is leaning on the next fence post as if she has been expecting someone.', trainer('Fence-Post Trainer', { size: 2, win: [$(300)] }))),
      ch('Right.', out('Right it is. The path bends, and there is something on it worth stopping for.', room('ask-directions-right'))),
      ch('Who\'s asking?', out('She grins. Nobody ever asks back. "Left is a trainer who hasn\'t lost all week. Right is something nice. Now you know as much as I do."', flag('directions-asked'))),
    ],
    remembers: [{ id: 'told', when: [flagIs('directions-asked')], intro: '**Local, pointing two ways at once:** "You again! Left is the trainer, right is the nice thing. I told you. Nobody listens."' }],
  },
  rm('ask-directions-right', 'The Right-Hand Path', 'Travel and shortcuts', 'The right-hand path bends past an old wayside shrine. The offering bowl is full of things travellers left for whoever needed them more, with a note: "Take one. Leave one when you can."', [
    ch('Take one.', out('You take one thing, and promise the bowl you will be back with something better.', any('oran-berry', 'potion', 'poke-ball', 'pecha-berry'))),
    ch('Leave one.', out('You leave something of yours in the bowl. Somebody tomorrow will be glad of it, and never know your name.', { kind: 'loseItem', id: 'potion' }, good(1)), { requires: [{ kind: 'item', id: 'potion' }] }),
  ], { scene: { cast: [], effect: 'sparkle' } }),
  {
    id: 'r130-drifting-wingull-island',
    intro: 'A flock of Wingull hangs over the gap in the cliff path, wings spread wing-tip to wing-tip on the updraft. It is almost a bridge. It only needs persuading.',
    choices: [
      ch('Feed them.', out('You hold out the crusts of your lunch. One takes a piece, and then they all close up, shoulder to shoulder, and hold. You cross on a bridge of wings, and it carries you a stop ahead.', express())),
      ch('Go round.', leave('You go round, the long way, with the Wingull laughing at you the whole time.')),
    ],
  },
  {
    id: 'r157-cave-spider-silk',
    intro: 'A web is strung across a chasm, as wide as a road and humming faintly. On the far side, things glint that somebody dropped and never came back for.',
    choices: [
      ch('Cross.', out('You go across on your stomach, a hand at a time, not looking down. The far side has what you hoped.', any('nugget', 'big-pearl', 'star-piece', 'focus-sash')), { chance: 0.75, fail: out('Halfway over, the silk takes hold of you and will not let go. It takes a whole stop of the road, and all of your team pulling, to get you free. You never reach the far side.', takeNode()) }),
      ch('Send a Bug-type.', out('Your Bug-type walks out onto the web as if it were a pavement, and comes back with something in its mouth and a great deal of pride.', any('nugget', 'big-pearl', 'star-piece', 'focus-sash')), { requires: [types('bug')] }),
    ],
  },
  {
    id: 'r166-sudowoodo-gate',
    intro: 'A tree stands in the narrow pass, where no tree should be. It is not a tree. It is holding very, very still and hoping.',
    choices: [
      ch('Water it.', out('One splash. The tree shrieks, leaps a foot in the air and runs off down the pass with its arms waving. The way is open.'), { chance: 0.5, fail: fight('One splash. The tree shrieks, and then it is furious.', wild({ species: ['sudowoodo'], lv: 1 })) }),
      ch('Wait.', out('You sit down and wait. It holds its pose for a long time. Then longer. In the end it sighs, drops its arms and wanders off, bored. It cost you a stop of the road, and nothing else.', takeNode())),
    ],
  },
  {
    id: 'r145-bonsly-standoff',
    intro: 'A Bonsly stands in the exact middle of the bridge. It will not move. It keeps glancing over its shoulder at the railings and then glaring at you again.',
    choices: [
      ch('Look past it.', out('Behind it, a Sudowoodo is wedged in the railings, stuck fast and very embarrassed. The little one has been standing guard.', room('r145-bonsly-railings'))),
      ch('Push it.', fight('You try to move it. It was already frightened, and now it is fighting.', wild({ species: ['bonsly'], lv: 0 }))),
    ],
  },
  rm('r145-bonsly-railings', 'Stuck in the Railings', 'Travel and shortcuts', 'The Sudowoodo is stuck in the bridge railings by both arms. The Bonsly has put itself between you and it, trembling, refusing to cry.', [
    ch('Free it.', out('You work the Sudowoodo loose, one arm and then the other. It hugs the Bonsly so hard they both fall over. They clear the bridge together, and the Bonsly keeps looking back at you.', flag('freed-sudowoodo'))),
    ch('Free it, and let the Bonsly follow.', out('You work the Sudowoodo loose. It bows, stiffly. The Bonsly looks at it, looks at you, and takes three small steps your way. The Sudowoodo nods: go on, then.', { kind: 'join', species: ['bonsly'], types: [], levelBonus: 0, shinyMultiplier: 1, shadow: false }, flag('freed-sudowoodo')), { chance: 0.5, fail: out('You work the Sudowoodo loose. The Bonsly takes one step after you, then runs back and holds on to the Sudowoodo\'s leg. Not today. They wave until you are off the bridge.', flag('freed-sudowoodo')) }),
  ], { scene: { cast: [], pokemon: 'bonsly', effect: 'hearts' } }),
];

export const EVENTS: Json[] = [...SF135, ...SF136];
export const REMOVE: string[] = [];
