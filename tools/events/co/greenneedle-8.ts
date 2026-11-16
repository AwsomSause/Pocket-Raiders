// Greenneedle, part 8: gn.35 Thunderstorm Ridge, gn.36 The Great Desert (doc GREENNEEDLE_REWORKED_PLACED_8.md).
// Build: npm run co:build -- greenneedle-8   then   npm run co:gn
import { any, anyType, ch, fight, flag, heal, item, join, out, takeNode, wild, type Json } from '../dsl.ts';
import { chIf, gev, gn, inside, is, laterStage, leavePseudo, moment, not, pick, regionChanged, rm, roll, route, say, scene, setTo, stampRegion, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.35  THUNDERSTORM RIDGE  (a door at step 16 needing storm or high ground, then a Pseudo Stage of six nodes; A7; once a run).
// Lightning: each node, 20% that a bolt strikes the lead and paralyses it (gn op `lightning`, core/greenneedle/ridge.ts: a Ground-type
// in front, a held Metal Coat, the hilltop's iron rod, or Lightning Rod / Volt Absorb stop it). Charged crystals draw Electric-types:
// one follower per crystal at each node after the field, some friendly (catch x2, battle rule `ridge`). Three crystals, and the
// overcharged one comes to the Shelter, a node early. At the summit: "Defeat it." (rule `overcharged`) or "Earth it." (rule `earthing`).
// =====================================================================================================================
const RIDGE_TINT = '#3b4060';
const storm = (o: Json = {}): Json => ({ tint: RIDGE_TINT, tags: ['Pokémon', 'Exploration', 'Survival'], effect: 'rain', ...o });
const node = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, storm(o), intro, choices);
const next = (id: string): Json => ({ kind: 'addEvent', eventId: id });
/** Each node, the sky picks a target: 20%. */
const STRIKE = gn('lightning', { n: 20 });
const POOL = ['electrike', 'manectric', 'mareep', 'flaaffy', 'magnemite', 'pachirisu', 'emolga', 'helioptile', 'tynamo', 'joltik'];
const OVERCHARGED = ['manectric', 'ampharos', 'luxray', 'electivire', 'zebstrika'];

/** Entering a node with crystals: one follower for each one carried. */
const FOLLOW: Json[] = [setTo('ridge-followers', 0), ...[1, 2, 3].map((n) => when('ridge-crystals', { min: n, max: n }, [setTo('ridge-followers', n)]))];
/** One follower dealt with (ascending, so each step reads the count before it changes). */
const ONE_LESS: Json[] = [1, 2, 3].map((n) => when('ridge-followers', { min: n, max: n }, [setTo('ridge-followers', n - 1)]));
const ONE_CRYSTAL_LESS: Json[] = [1, 2, 3].map((n) => when('ridge-crystals', { min: n, max: n }, [setTo('ridge-crystals', n - 1)]));
/** Back to the node the follower caught up with you at. */
const BACK: Json[] = [...ONE_LESS, when('ridge-back', { min: 4, max: 4 }, [scene('gn-35-bridge')]), when('ridge-back', { min: 5, max: 5 }, [scene('gn-35-shelter')])];
const FOLLOWED = { id: 'followed', when: [is('ridge-followers')], notice: '*Something is following the crystal\'s hum. You can hear it in the rocks behind you, keeping pace.*' };
const CLEAR_PATH = [is('ridge-followers', 0, 0)];

/** Turn round: one crystal, half of them friendly; two or more, a third. A third of them are this region's own Electric- and Flying-types. */
const face = (at: number): Json => chIf([is('ridge-followers')], 'Face what\'s following you.', out('You stop, and turn round, and wait for it.',
  setTo('ridge-back', at), when('ridge-crystals', { min: 1, max: 1 }, [roll('ridge-friendly', 50)]), when('ridge-crystals', { min: 2 }, [roll('ridge-friendly', 33)]),
  roll('ridge-local', 33), scene('gn-35-follower')));
/** Drop a crystal: whatever was following you follows it instead, for a while. */
const drop = (at: string): Json => chIf([is('ridge-crystals')], 'Drop a crystal.', out('You set one down on the bare rock. It hums to itself, blue-white, alone.',
  ...ONE_CRYSTAL_LESS,
  when('ridge-followers', { min: 1 }, [], '*Whatever was behind you stops at it. Sniffs it. Stays with it, for now.*'), ...ONE_LESS, scene(at)));
const followFight = (local: boolean): Json => inside({
  ...wild(local ? { types: ['electric', 'flying'], lv: 1, win: BACK } : { species: POOL, lv: 1, win: BACK }),
  caught: BACK, exact: true, lose: BACK, rule: { gn: 'ridge' },
});

// The summit's two answers, shared by the Summit and (three crystals) the Shelter.
const DOWN: Json[] = [setTo('ridge-end', 1), flag('ridge-defeated'), scene('gn-35-glass')];
const DRIVEN: Json[] = [scene('gn-35-driven')];
const defeatIt = ch('Defeat it.', fight('It doesn\'t want this. Every bolt on the ridge does.',
  inside({ ...wild({ species: ['@ridge-one'], lv: 2, win: DOWN }), exact: true, rule: { gn: 'overcharged', noCatch: true }, lose: DRIVEN })));
const earthFight = (turns: number): Json => inside({
  ...wild({ species: ['@ridge-one'], lv: 2, win: [setTo('ridge-end', 2), flag('ridge-earthed'), scene('gn-35-earthed')] }),
  exact: true, rule: { gn: 'earthing', leadType: 'ground', noSwitch: true, surviveTurns: turns, noCatch: true }, lose: DRIVEN,
});
const EARTH_TEXT = 'Your Ground-type walks out onto the glass, and plants its feet beside it, and doesn\'t move.';
const earthIt: Json[] = [
  chIf([anyType('ground'), not('mega-grounded')], 'Earth it.', fight(EARTH_TEXT, earthFight(3))),
  // NE9: the player grounded the stuck Mega Manectric before. Two turns.
  chIf([anyType('ground'), is('mega-grounded')], 'Earth it.', fight(`${EARTH_TEXT} You've done this before. So has it, maybe.`, earthFight(2))),
];
const ADA_AGAIN = { id: 'again', when: [is('mega-grounded')], notice: 'Ada, leaning out of the cab: "You again. You know what to do, then."' };
const RIDGE_DONE: Json[] = [flag('ridge-done'), stampStage('ridge-at'), leavePseudo()];
const CAPSULE = item('summit-ability-capsule');

const gn35: Json[] = [
  gev('gn-35-door', 'Thunderstorm Ridge', storm({ stop: 'event', rarity: 'rare', types: ['electric'], pokemon: 'manectric', requires: [not('ridge-done'), not('ridge-entered')] }), say(
    'A ridge, black against a sky that won\'t stop flashing. The thunder doesn\'t roll here. It cracks.',
    'One peak takes more strikes than the rest. All of them, nearly.',
  ), [
    ch('Climb toward the storm.', out('The air tastes of metal. Your Pokémon\'s fur lifts, and settles, and lifts.',
      flag('ridge-entered'), setTo('ridge-crystals', 0), setTo('ridge-followers', 0), setTo('ridge-struck', 0),
      gn('cast', { key: 'ridge-one', species: OVERCHARGED }), next('gn-35-gate'))),
    ch('Walk on.', out('You keep low and walk on. Behind you the same peak is hit, and hit, and hit again.')),
  ]),
  // ---- Node 1. The Scorched Gate ----
  node('gn-35-gate', 'Thunderstorm Ridge: The Scorched Gate', { cast: ['trainer.lacey', 'trainer.youngster_m'], pokemon: 'electrike', remembers: [ADA_AGAIN] }, say(
    'Two dead trees, split down the middle. The wood inside is black glass.',
    'A pickup truck is parked between them, pointed back down the hill. Storm chasers: Ada and Kip. Not going any farther.',
    'Ada: "We chase them. We don\'t climb *into* them. There\'s something up there that\'s been hit forty times and hasn\'t come down."',
  ), [
    chIf([not('ridge-kip')], 'Ask what it is.', out(say(
      'Kip, quietly, not taking his eyes off the peak: "Couldn\'t see. Something with four legs, maybe. It was shaking."',
      '"You don\'t shake like that from cold. You shake like that from too much."',
    ), flag('ridge-kip'), scene('gn-35-gate'))),
    ch('Go up.', out('Ada shakes her head, and doesn\'t argue. Kip turns the radio up so you\'ll hear the forecast if you come back.', STRIKE, next('gn-35-path'))),
  ]),
  // ---- Node 2. The Counting Path: open only between strikes ----
  node('gn-35-path', 'Thunderstorm Ridge: The Counting Path', { pokemon: 'mareep' }, say(
    'A stretch of bare rock with nowhere to hide. Lightning hits it on a rhythm: long, short, short.',
    'Long, short, short. The rock hisses where it lands. You start counting without meaning to.',
  ), [
    ch('Cross on the long gap.', out('Long. You go. Short, short, behind you. You\'re across, breathing hard, and the rock where you stood is smoking.', STRIKE, next('gn-35-field')), {
      prompt: { id: 'ridge-gap', needs: 'ok' },
      fail: out('Too soon. The short one finds you.', gn('lightning', { n: 100 }), scene('gn-35-path')),
    }),
  ]),
  // ---- Node 3. The Crystal Field ----
  node('gn-35-field', 'Thunderstorm Ridge: The Crystal Field', { pokemon: 'mareep' }, say(
    'Charged crystals, everywhere, blue-white, lying where bolts have hit. They hum when you come close.',
    'Mareep graze between them with their wool standing straight up. They don\'t look bothered. They look lit.',
    'Carrying one would draw Electric-types to you. Friendly ones, and otherwise.',
  ), [
    ch('Take one.', out('It\'s warm, and it buzzes against your palm like something alive. A Mareep looks up from grazing.', setTo('ridge-crystals', 1), ...FOLLOW, STRIKE, next('gn-35-bridge'))),
    ch('Take three.', out(say('Three. They sing to each other in the bag.', '*Across the whole ridge, things lift their heads.*'), setTo('ridge-crystals', 3), flag('ridge-three'), ...FOLLOW, STRIKE, next('gn-35-bridge'))),
    ch('Take none.', out('You leave them where the sky put them. The Mareep go back to grazing.', setTo('ridge-crystals', 0), ...FOLLOW, STRIKE, next('gn-35-bridge'))),
  ]),
  // A follower, drawn by a charged crystal (a scene of whichever node it caught you at).
  rm('gn-35-follower', 'Thunderstorm Ridge: Something Following', storm({
    pokemon: 'electrike',
    remembers: [{ id: 'friendly', when: [is('ridge-friendly')], notice: '*It isn\'t hunting you. It walks alongside, sniffing at the crystal in your bag, sparks in its fur. It would come quietly.*' }],
  }), say(
    'It comes out of the rocks, drawn by the crystal\'s hum. Blue-white light catches in its eyes.',
  ), [
    chIf([is('ridge-local')], 'Turn and face it.', fight('It comes closer.', followFight(true))),
    chIf([not('ridge-local')], 'Turn and face it.', fight('It comes closer.', followFight(false))),
    chIf([is('ridge-crystals')], 'Drop a crystal.', out('You roll one away across the rock. It goes after the crystal, and doesn\'t come back.', ...ONE_CRYSTAL_LESS, ...BACK)),
  ]),
  // ---- Node 4. The Iron Bridge ----
  node('gn-35-bridge', 'Thunderstorm Ridge: The Iron Bridge', { pokemon: 'magnemite', remembers: [FOLLOWED] }, say(
    'A metal bridge over a drop you don\'t look down. It hums. Every few seconds it glows, end to end, and spits.',
    'Then it\'s dark again. Then it glows.',
  ), [
    face(4),
    chIf(CLEAR_PATH, 'Cross when it\'s dark.', out('Dark. You run. It glows behind your heels as you jump off the far end.', STRIKE, ...FOLLOW, route('ridge-crystals', 'gn-35-shelter', 'gn-35-shelter', 'gn-35-shelter', 'gn-35-hiding')), {
      prompt: { id: 'bridge-dark', needs: 'ok' },
      fail: out('It glows under your feet. You jump back, but not fast enough.', gn('lightning', { n: 100 }), scene('gn-35-bridge')),
    }),
    chIf([...CLEAR_PATH, anyType('ground')], 'Send a Ground-type first.', out(say(
      'Your Ground-type walks out first and stands at the middle. The next glow runs into it, and through it, and nowhere.',
      'For one crossing, the bridge is just a bridge.',
    ), STRIKE, ...FOLLOW, route('ridge-crystals', 'gn-35-shelter', 'gn-35-shelter', 'gn-35-shelter', 'gn-35-hiding'))),
    drop('gn-35-bridge'),
  ]),
  // ---- Node 5. The Shelter ----
  node('gn-35-shelter', 'Thunderstorm Ridge: The Shelter', { pokemon: 'joltik', remembers: [FOLLOWED] }, say(
    'A cave out of the rain. A rest, at last. Your Pokémon shake themselves dry.',
    'On the wall, scratches: tally marks, in fives. Forty of them.',
    '*Something\'s been counting.*',
  ), [
    face(5),
    chIf([not('ridge-counted')], 'Count the marks.', out(say(
      'Forty. Each one deep, and scored hard. The last few are shakier.',
      'Not a person\'s marks. Claws. Something counted every strike it took, until it couldn\'t hold still enough to scratch.',
    ), flag('ridge-counted'), scene('gn-35-shelter'))),
    chIf(CLEAR_PATH, 'Rest, then climb.', out('You rest as long as you dare. Outside, every strike bends toward the summit.', heal(0.5), STRIKE, next('gn-35-summit'))),
    drop('gn-35-shelter'),
  ]),
  // ---- Node 5, three crystals: it came to find you ----
  node('gn-35-hiding', 'Thunderstorm Ridge: The Shelter', { pokemon: 'manectric', remembers: [ADA_AGAIN] }, say(
    'A cave out of the rain. On the wall, forty tally marks, in fives. The newest are still bright.',
    '*It\'s in here. In the back, as far from the mouth as it can get, hiding from itself.*',
    '*The tally marks are its own. Your three crystals sing, and it flinches, and sparks fall off it like water.*',
  ), [defeatIt, ...earthIt]),
  // ---- Node 6. The Summit ----
  node('gn-35-summit', 'Thunderstorm Ridge: The Summit', { pokemon: 'manectric', effect: 'shake', remembers: [ADA_AGAIN] }, say(
    '*It\'s standing on the highest rock. Every strike on the ridge bends toward it.*',
    '*It\'s shaking. Sparks fall off it like water off a dog. Where they land, the stone goes to glass.*',
    '*It sees you. It tries to back away. A bolt hits it. It screams, and the scream\'s a Thunder.*',
  ), [defeatIt, ...earthIt]),
  // ---- Endings ----
  node('gn-35-glass', 'Thunderstorm Ridge: Quiet', { pokemon: 'manectric' }, say(
    'It goes down. The sparks stop falling. For the first time in a month, nothing on the ridge is shaking.',
    'It lies on its side in the glass it made, breathing. When the next bolt comes, it goes somewhere else.',
    'Something glints in the glass: a capsule, fused in, still warm.',
  ), [ch('Take the capsule.', out('It comes free with a crack. Behind you, slowly, it gets up, and limps away down the far side.', CAPSULE, ...RIDGE_DONE))]),
  node('gn-35-earthed', 'Thunderstorm Ridge: The Clear Circle', { pokemon: 'manectric' }, say(
    '*It looks at your Ground-type. It walks over, slowly, and leans its whole weight against it.*',
    'The sky over the summit has cleared, in a circle. Stars, in the middle of a storm.',
    'Something glints in the glass where it stood: a capsule, fused in, still warm.',
  ), [ch('Take the capsule, and go down.', out(say(
    'The capsule comes free with a crack. You start down the mountain.',
    'It follows you. All the way down. At the bottom, you hold out a Ball, and it steps into it, on its own.',
  ), CAPSULE, { kind: 'friendship', bond: 2, who: { types: ['ground'] } }, flag('sign-raikou'), { kind: 'clearSky' },
  moment('On Thunderstorm Ridge, a Ground-type stood in the lightning for three turns, so something else didn\'t have to.', 85),
  { ...join({ species: ['@ridge-one'], lv: 2 }), ability: 'grounded-heart' }, ...RIDGE_DONE))]),
  node('gn-35-driven', 'Thunderstorm Ridge: Driven Down', { pokemon: 'manectric' }, say(
    'Too much. The storm drives you off the summit, and down, and you don\'t stop till the trees.',
    'Behind you, the peak takes another strike. And another.',
  ), [ch('Go down.', out('You don\'t look back. You can hear it anyway.', ...RIDGE_DONE))]),
  // ---- Afterstory: Ada and Kip's forecast, the next stage ----
  gev('gn-35-forecast', 'The Storm Chasers\' Forecast', storm({ stop: 'event', rarity: 'uncommon', callback: true, cast: ['trainer.lacey'], effect: 'none', requires: [is('ridge-done'), laterStage('ridge-at'), not('ridge-forecast')] }), say(
    'A pickup truck at the roadside, radio on. Ada\'s pinned the forecast to the windscreen for anyone passing.',
    '*Clear over the ridge. First time in a month. Don\'t know why.*',
  ), [
    ch('Read it again.', out('Kip, from the cab, without looking up: "We drove past it this morning. You can see all the way to the top."', flag('ridge-forecast'))),
    ch('Walk on.', out('The radio follows you a little way down the road, saying clear, clear, clear.', flag('ridge-forecast'))),
  ]),
];

// =====================================================================================================================
// gn.36  THE GREAT DESERT  (a door at step 10 needing heat, then a Pseudo Stage of eight nodes with three oases; A8; once a run).
// Water: 4 at the Last Well, one less each node, refilled at the oases; at none, each fight starts at 90% HP (battle rule `desert`).
// Mirages: each has a tell for players who look ("Look closer."). The traveller, Idris Calloway, is met at all three oases: lost,
// robbed, laughing. At the hidden fourth oasis, an ancient Flygon. With Idris there, no battle. With the drawing, no battle.
// =====================================================================================================================
const DESERT_TINT = '#c79a52';
const dune = (o: Json = {}): Json => ({ tint: DESERT_TINT, tags: ['Pokémon', 'Exploration', 'Survival'], effect: 'none', ...o });
const sands = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, dune({ remembers: WATER_LEFT, ...o }), intro, choices);
const DESERT_DONE: Json[] = [flag('desert-done'), leavePseudo()];
const DESERT_POOL = ['sandile', 'cacnea', 'trapinch', 'vibrava', 'hippopotas', 'numel', 'baltoy', 'dwebble', 'silicobra', 'sandshrew', 'larvesta'];
const WATER = 'desert-water';
/** The count's always on screen: a notice on every node, and a line every time it changes. */
const WATER_LEFT: Json[] = [
  { id: 'water-0', when: [is(WATER, 0, 0)], notice: 'Water: none. Your party starts each fight at 90% HP.' },
  { id: 'water-n', when: [is(WATER, 1)], notice: 'Water: you check the flasks. Enough, for now.' },
];
const WATER_SAYS: Json[] = [0, 1, 2, 3, 4, 5].map((n) => when(WATER, { min: n, max: n }, [], n === 0 ? 'Water: none left. Your party starts each fight at 90% HP.' : `Water: ${n} left.`));
/** A node walked: one less (never below none). */
const DRINK: Json[] = [...[1, 2, 3, 4, 5].map((n) => when(WATER, { min: n, max: n }, [setTo(WATER, n - 1)])), ...WATER_SAYS];
const REFILL: Json[] = [setTo(WATER, 4), when(WATER, { min: 4, max: 4 }, [], 'You fill every flask to the brim. Water: 4.')];
const ON = (id: string): Json[] => [...DRINK, next(id)];
const desertFight = (species: string[], win: Json[], lose: Json[] = win, lv = 1): Json => inside({ ...wild({ species, lv, win }), caught: win, exact: true, lose, rule: { gn: 'desert' } });

/** Mirages: what's seen (1 a pool, 2 a chest, 3 a figure), and whether it's real. The tell is there for anyone who looks. */
const MIRAGE_AT = (n: number): Json[] => [setTo('desert-at', n), setTo('desert-looked', 0), setTo('desert-mirage-done', 0), pick('desert-seen', 1, 1, 1), roll('desert-real', 50)];
const BACK_TO: Json[] = [when('desert-at', { min: 2, max: 2 }, [scene('gn-36-dunes')]), when('desert-at', { min: 4, max: 4 }, [scene('gn-36-storm')])];
const MIRAGE_DONE: Json[] = [setTo('desert-mirage-done', 1), ...BACK_TO];
const SHIMMER = chIf([is('desert-mirage-done', 0, 0)], 'Look at the shimmer.', out('You shade your eyes, and look.',
  when('desert-seen', { min: 1, max: 1 }, [scene('gn-36-pool')]), when('desert-seen', { min: 2, max: 2 }, [scene('gn-36-chest')]), when('desert-seen', { min: 3, max: 3 }, [scene('gn-36-figure')])));
const look = (self: string, real: string, fake: string): Json => chIf([is('desert-looked', 0, 0)], 'Look closer.', out('You stand still, and make yourself really look.',
  when('desert-real', { min: 1 }, [], real), when('desert-real', { min: 0, max: 0 }, [], fake), setTo('desert-looked', 1), flag('desert-mirages-read'), scene(self)));
const leaveIt = ch('Leave it.', out('You turn away. When you look back, it\'s still there. Or it isn\'t.', ...MIRAGE_DONE));
/** A sandstorm hides the next stretch, unless you can see through it: Safety Goggles held, or Desert Guide in the party (or a Flying-type sent up). */
const SIGHT: Json[] = [
  setTo('desert-sight', 0),
  gn('check', { key: 'desert-goggles', if: [{ kind: 'gn', test: 'holds', key: 'safety-goggles' }] }), when('desert-goggles', { min: 1 }, [setTo('desert-sight', 1)]),
  gn('check', { key: 'desert-guided', if: [{ kind: 'gn', test: 'hasAbility', key: 'desert-guide' }] }), when('desert-guided', { min: 1 }, [setTo('desert-sight', 1)]),
];
const RUIN_ITEMS = ['relic-copper', 'relic-silver', 'rare-bone', 'light-clay', 'sun-stone'];

const gn36: Json[] = [
  gev('gn-36-door', 'The Great Desert', dune({ stop: 'event', rarity: 'rare', types: ['ground'], pokemon: 'trapinch', requires: [not('desert-done'), not('desert-entered')] }), say(
    'The road ends where the sand begins. Past it, dunes, and heat that bends the air like water.',
    'A sign, half buried: LAST WELL. An arrow points in.',
  ), [
    ch('Walk into the desert.', out('The sand takes your footprints, and smooths them, and forgets you were there.',
      flag('desert-entered'), setTo(WATER, 4), setTo('desert-gave-water', 0), stampRegion('desert-region'), next('gn-36-well'))),
    ch('Walk on.', out('You keep to the road. The heat follows you for a while, and gives up.')),
  ]),
  // ---- Node 1. The Last Well ----
  sands('gn-36-well', 'The Great Desert: The Last Well', { cast: ['trainer.lady'], pokemon: 'hippopotas' }, say(
    'A village at the desert\'s edge: six houses, a well, a goat that judges you.',
    'A guide sits by the well, very old, with eyes like she\'s still looking at the horizon. Old Hadiza-Nour.',
    'Hadiza-Nour: "Three oases. Count them. If you see a fourth, it isn\'t."',
  ), [
    chIf([not('desert-asked')], 'Ask about the fourth.', out(say(
      'She smiles, and doesn\'t answer, and then does.',
      '"My grandmother said there was one. Where the wind stops. Nobody\'s found it. Nobody who was looking."',
    ), flag('desert-asked'), scene('gn-36-well'))),
    ch('Fill the flasks, and go.', out('The well water\'s cold enough to hurt your teeth.', setTo(WATER, 4), ...MIRAGE_AT(2), ...ON('gn-36-dunes'))),
  ]),
  // ---- Node 2. The First Dunes: wild battles, and a mirage ----
  sands('gn-36-dunes', 'The Great Desert: The First Dunes', { pokemon: 'sandile' }, say(
    'Dunes like slow waves. Things move under the sand, and stop when you stop.',
    'On the far side of the next dune, something shimmers.',
  ), [
    SHIMMER,
    ch('Walk on.', fight('The sand ahead bulges, and bursts.', desertFight(DESERT_POOL, ON('gn-36-oasis-1')))),
  ]),
  // ---- The mirages (scenes of the node they appear at) ----
  sands('gn-36-pool', 'The Great Desert: A Pool with Palm Trees', { pokemon: 'cacnea' }, 'A pool, blue as glass, with palm trees leaning over it. It looks cool. It looks close.', [
    look('gn-36-pool', 'The palms have shadows. A bird is drinking at the edge, and the water ripples where it drinks.', 'Look at the palms. The sun is high and hard, and they cast no shadows at all.'),
    chIf([is('desert-real')], 'Go to it.', out('It\'s real. Cool, and sweet, and real. Not an oasis, but enough. Water +1 (flasks hold four).', ...[3, 2, 1, 0].map((n) => when(WATER, { min: n, max: n }, [setTo(WATER, n + 1)])), ...WATER_SAYS, ...MIRAGE_DONE)),
    chIf([not('desert-real')], 'Go to it.', fight('The palms turn round. They have faces.', desertFight(['cacturne'], MIRAGE_DONE))),
    leaveIt,
  ]),
  sands('gn-36-chest', 'The Great Desert: A Chest on a Dune', { pokemon: 'sandile' }, 'A chest, half out of the sand on the crest of a dune, its lock rusted open.', [
    look('gn-36-chest', 'The sand round it\'s smooth. Nobody\'s been near it in years. The wind has.', 'Footprints lead up to it. None lead away.'),
    chIf([is('desert-real')], 'Go to it.', out('It\'s old, and real, and full of sand, and at the bottom something the sand kept safe.', any(...RUIN_ITEMS), ...MIRAGE_DONE)),
    chIf([not('desert-real')], 'Go to it.', fight('The dune gives way. It was a pit all along, and the Sandile at the bottom have been waiting.', inside({ ...wild({ species: ['sandile', 'krokorok'], lv: 1, chain: 2, win: MIRAGE_DONE }), caught: MIRAGE_DONE, exact: true, lose: MIRAGE_DONE, rule: { gn: 'desert' } }))),
    leaveIt,
  ]),
  sands('gn-36-figure', 'The Great Desert: A Figure, Waving', { pokemon: 'sigilyph' }, 'A figure on a far dune, waving to you. Both arms, over its head. Waving.', [
    look('gn-36-figure', 'It stops waving, and sits down in the sand, and puts its head in its hands. A person. Tired.', 'It waves exactly the same way. And again. The same way, to the inch.'),
    chIf([is('desert-real')], 'Go to it.', out(say(
      'By the time you get there, they\'ve gone on ahead. Only a dip in the sand where somebody sat, and a dropped map, upside down.',
    ), flag('desert-saw-idris'), ...MIRAGE_DONE)),
    chIf([not('desert-real')], 'Go to it.', fight('The figure folds its arms into wings. It was never waving. It was guarding: behind it, the top of a buried ruin.', desertFight(['sigilyph'], [any(...RUIN_ITEMS), flag('desert-sigilyph-ruin'), ...MIRAGE_DONE]))),
    leaveIt,
  ]),
  // ---- Node 3. The First Oasis: the traveller, lost ----
  sands('gn-36-oasis-1', 'The Great Desert: The First Oasis', {
    cast: ['trainer.hiker'], pokemon: 'cacnea',
    remembers: [{ id: 'herd', when: [is('savanna-helped')], notice: 'Idris: "Wait. The Deep Savanna, the Donphan? That was you? Everyone\'s heard. Keep your water. I\'ve got some."' }, ...WATER_LEFT],
  }, say(
    'Water. Real water, and real palms, and real shade. You\'ve never been so glad of shade.',
    '*Someone\'s sitting under a palm with a map held upside down.*',
    'The traveller, Idris Calloway: "Don\'t tell me. I\'ll get it. ...It\'s the other way up, isn\'t it."',
    'Idris: "I\'ve been here before. Thirty years ago. You\'d think I\'d remember a thing like a desert."',
  ), [
    chIf([not('desert-where')], 'Where are you going?', out('Idris: "To see someone. If they\'re still there. They might not remember me either."', flag('desert-where'), scene('gn-36-oasis-1'))),
    ch('Walk with me.', out('Idris folds the map the right way up, and walks with you to the edge of the shade. "I walk slow. Go on. I\'ll catch you up."', ...REFILL, ...SIGHT, ...MIRAGE_AT(4), ...ON('gn-36-storm'))),
    chIf([not('desert-gave-water'), not('savanna-helped'), is(WATER)], 'Here, take some water.', out('Idris drinks like someone who\'d stopped hoping. "Thank you. I mean it."', ...DRINK, setTo('desert-gave-water', 1), scene('gn-36-oasis-1'))),
    chIf([not('desert-gave-water'), is('savanna-helped')], 'Here, take some water.', out('Idris waves it away, then takes a sip anyway, to be polite. It costs you nothing.', setTo('desert-gave-water', 1), scene('gn-36-oasis-1'))),
  ]),
  // ---- Node 4. The Storm: the next node's hidden; a mirage ----
  sands('gn-36-storm', 'The Great Desert: The Storm', {
    effect: 'fog', pokemon: 'hippowdon',
    remembers: [
      { id: 'sight', when: [is('desert-sight')], notice: '*Through the sand, you can make out what\'s ahead: palms. A second oasis.*' },
      ...WATER_LEFT,
    ],
  }, say(
    'A sandstorm, a wall of it, brown to the sky. You walk into it with your eyes shut.',
    'The next stretch is gone: no shape, no sound, nothing you could put a name to.',
  ), [
    SHIMMER,
    chIf([anyType('flying'), not('desert-sight')], 'Send a Flying-type up.', out('Your Flying-type climbs out of the storm, and circles, and comes back down to the left. Palms, that way. Water.', setTo('desert-sight', 1), scene('gn-36-storm'))),
    ch('Walk on.', out('Head down, one foot in front of the other.', ...ON('gn-36-oasis-2'))),
  ]),
  // ---- Node 5. The Second Oasis: the traveller, robbed ----
  sands('gn-36-oasis-2', 'The Great Desert: The Second Oasis', { cast: ['trainer.hiker'], pokemon: 'sandile' }, say(
    'The second oasis. Smaller, muddier, and yours.',
    '*Idris, sitting in the same way, with no pack, no boots and no map.*',
    'Idris: "Sandile. A whole family. Very organised. They took the boots *first.* I respect that."',
  ), [
    ch('I\'ll get your things back.', out('Idris points, with a bare foot, at a line of very small, very proud tracks. "That way. Mind the little one. It bites."', ...REFILL, ...ON('gn-36-den'))),
    ch('Take my spare.', out('You hand over your spare pair of socks and your second flask. It isn\'t boots. Idris treats it like it\'s more than boots.', ...REFILL, flag('desert-spare'), ...ON('gn-36-ruin'))),
    ch('You should turn back.', out(say('Idris: "No. I\'ve turned back from this four times in thirty years. Not again."', 'They say it gently, and they don\'t look at you while they say it.'), ...REFILL, ...ON('gn-36-ruin'))),
  ]),
  // ---- One node off the path: the Sandile den ----
  sands('gn-36-den', 'The Great Desert: The Sandile Den', { pokemon: 'krookodile' }, say(
    'A hollow in the dune, very tidy. A pair of boots, side by side, the way you\'d leave them at a door.',
    'A family of Sandile is sitting on the pack. The biggest one looks at you over sunglasses it can\'t possibly own.',
  ), [
    ch('Battle them for it.', fight('The family rises as one. Very organised.', inside({ ...wild({ species: ['sandile', 'krokorok', 'krookodile'], lv: 1, chain: 3, win: [scene('gn-36-pack')] }), caught: [scene('gn-36-pack')], exact: true, lose: [scene('gn-36-pack-lost')], rule: { gn: 'desert' } }))),
    chIf([is(WATER)], 'Trade them some water.', out('You pour a flask into a hollow in the rock. They consider it. Then they get off the pack, one by one, and drink.', ...DRINK, scene('gn-36-pack'))),
  ]),
  sands('gn-36-pack', 'The Great Desert: The Pack', { pokemon: 'sandile' }, say(
    'The pack, the boots, the map. At the bottom of the pack, folded small, a child\'s drawing, very old.',
    'A small figure on the back of something with wings.',
  ), [ch('Take them back to Idris.', out('Idris puts the boots on first. Then they see the drawing\'s been looked at, and go quiet, and fold it away.', flag('desert-pack'), ...ON('gn-36-ruin')))]),
  sands('gn-36-pack-lost', 'The Great Desert: Very Organised', { pokemon: 'sandile' }, 'The Sandile family sits back down on the pack. You were outnumbered, and they were organised.', [
    ch('Go back without it.', out('Idris laughs when they see your face. "I told you. Very organised."', ...ON('gn-36-ruin'))),
  ]),
  // ---- Node 6. The Buried Ruin: three places to dig ----
  sands('gn-36-ruin', 'The Great Desert: The Buried Ruin', { pokemon: 'baltoy' }, say(
    'Pillars in the sand, tops only, like the masts of a buried ship. Baltoy turn slowly between them, humming.',
    'Three places look dug-at: by the leaning pillar, by the broken arch, by the step that goes down into nothing.',
  ), [
    chIf([is('desert-dug', 0, 2), { kind: 'gn', test: 'moveType', types: ['ground'] }], 'Dig with a Ground move.', out('Your Pokémon digs like it was made for it, and it was. Something old comes up with the sand.', any(...RUIN_ITEMS), flag('desert-dug'), scene('gn-36-ruin'))),
    chIf([is('desert-dug', 0, 2)], 'Dig by hand.', out('It takes a long time. The sun moves. Your flasks get lighter. Then: something old, in your hands.', any(...RUIN_ITEMS), flag('desert-dug'), takeNode(1), ...DRINK, scene('gn-36-ruin'))),
    ch('Walk on.', out('The Baltoy watch you go. One of them stops turning, for a moment.', ...ON('gn-36-oasis-3'))),
  ]),
  // ---- Node 7. The Third Oasis: the traveller, laughing ----
  sands('gn-36-oasis-3', 'The Great Desert: The Third Oasis', { cast: ['trainer.hiker'], pokemon: 'vibrava' }, say(
    '*Idris is lying on their back in the shallows, laughing at the sky.*',
    'Idris: "I remembered. I remembered which way. It was never on the map. It\'s where the wind *stops.*"',
    'Idris: "I was six. I wandered off from the caravan. Two days. I don\'t remember being frightened; I remember being tired."',
    'Idris: "And then something landed. It didn\'t ask me anything. It let me climb on. It flew me to the Last Well and it left before anyone came out."',
    'Idris: "I never said thank you. I was six. I\'ve been trying to get back and say it ever since."',
  ), [
    ch('Come with me. We\'ll find it.', out('Idris gets up, dripping, and laughs again. "We. All right. We." They carry their own water.', ...REFILL, flag('desert-traveller-with'), ...ON('gn-36-hidden'))),
    ch('I\'ll tell it for you.', out(say('Idris looks at you for a long moment. Then they unfold the drawing and put it in your hands.', '"Tell it I got lost. Tell it I was trying."'), ...REFILL, flag('desert-drawing'), ...ON('gn-36-hidden'))),
    ch('Good luck.', out('Idris raises a hand from the water. "You too." When you look back, they\'re still lying there, looking at the sky.', ...REFILL, ...ON('gn-36-hidden'))),
  ]),
  // ---- Node 8. The Hidden Oasis ----
  sands('gn-36-hidden', 'The Great Desert: The Hidden Oasis', {
    pokemon: 'flygon',
    remembers: [
      { id: 'idris', when: [is('desert-traveller-with')], notice: '*Idris stops beside you. Their hand is shaking.*' },
      { id: 'drawing', when: [is('desert-drawing')], notice: '*The drawing\'s in your pocket. You can feel the fold of it.*' },
    ],
  }, say(
    '*The wind stops.*',
    '*Green. A deep pool. Trapinch in the sand at the edge, dozens, small.*',
    '*On a rock over the water, something old, with red lenses gone pale, and wings with pieces missing.*',
  ), [
    chIf([is('desert-traveller-with')], 'Wait.', out(say(
      '*Idris stops. The Flygon lifts its head. It looks for a long time.*',
      '*Then it gets down off the rock, and lowers one wing, the way it did thirty years ago.*',
      'Idris: "...Thank you. I\'m sorry it took so long. I got lost."',
    ), setTo('desert-flygon', 1), flag('desert-flygon-met'), moment('At the hidden oasis, an old Flygon lowered one wing for someone it had carried thirty years before.', 90), scene('gn-36-after'))),
    chIf([not('desert-traveller-with'), is('desert-drawing')], 'Hold out the drawing.', out(say(
      'It comes down off the rock. It sniffs the drawing, for a long time.',
      'It makes a sound you\'ve never heard a Pokémon make. Then it steps aside, and lets you drink.',
    ), setTo('desert-flygon', 1), flag('desert-flygon-met'), scene('gn-36-after'))),
    chIf([not('desert-traveller-with'), not('desert-drawing')], 'Battle the Flygon.', fight('It doesn\'t leave the rock. It doesn\'t need to.', inside({
      ...wild({ species: ['flygon'], lv: 2, win: [setTo('desert-flygon', 2), flag('desert-flygon-fought'), scene('gn-36-after')] }),
      exact: true, foeMoves: ['earthquake', 'dragon-claw', 'sandstorm', 'roost'], rule: { gn: 'desert', noCatch: true }, lose: [scene('gn-36-turned')],
    }))),
  ]),
  sands('gn-36-after', 'The Great Desert: Where the Wind Stops', {
    pokemon: 'trapinch',
    remembers: [
      { id: 'together', when: [is('desert-traveller-with')], notice: '*They sit together by the water. Idris is talking. The Flygon\'s eyes are closed. You\'re not needed.*' },
      { id: 'empty', when: [is('desert-flygon', 2, 2)], notice: '*Later, Idris arrives at the oasis. There\'s nothing on the rock. They sit down. That\'s the last you see of them.*' },
    ],
  }, 'The pool is cold and deep. Trapinch watch you from the sand at its edge, dozens of them, small.', [
    chIf([is('desert-traveller-with')], 'Take the one it nudges forward.', out(say(
      'The Flygon puts its nose to one Trapinch, and pushes, gently, toward you. It trots over as if it knows the way.',
      'You leave the two of them by the water.',
    ), { ...join({ species: ['trapinch'], lv: 1 }), ability: 'desert-guide' }, item('soft-sand'), ...DESERT_DONE)),
    chIf([not('desert-traveller-with')], 'Take a Trapinch from the oasis.', out('One Trapinch follows you to the edge of the green, and over it, and keeps following.', join({ species: ['trapinch'], lv: 1 }), item('soft-sand'), ...DESERT_DONE)),
  ]),
  sands('gn-36-turned', 'The Great Desert: Turned Away', { pokemon: 'flygon' }, 'Its wings beat once, and the sand stands up, and you\'re walking back the way you came with your eyes shut.', [
    ch('Walk back.', out('When the sand settles, there\'s no oasis behind you. There never was, the sand says.', item('soft-sand'), ...DESERT_DONE)),
  ]),
  // ---- Afterstory: a postcard, a region later ----
  gev('gn-36-postcard', 'A Postcard', dune({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('desert-flygon', 1, 1), is('desert-traveller-with'), regionChanged('desert-region'), not('desert-postcard')] }), say(
    'A postcard, waiting for you, sent care of the Pokémon Center. No message. Just a photograph.',
    'An old Flygon, asleep in the shade of a palm. Beside it, a pair of boots, side by side, the way you\'d leave them at a door.',
  ), [ch('Keep it.', out('You put it somewhere you\'ll see it.', flag('desert-postcard')))]),
];

export const EVENTS: Json[] = [...gn35, ...gn36];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-35-door': {
    gn: 'gn.35', shape: 'Door', earliest: 'A7', home: 16, window: [14, 18], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['storm', 'high'],
    level: 'A+1; the overcharged one A+2', often: 'run', badge: 'own', dressing: { kanto: 'Thunderstorm Ridge', elsewhere: 'Thunderstorm Ridge' },
    note: 'Badge: a lightning bolt. Six nodes. Lightning each node (20%); charged crystals draw Electric-types; three crystals bring the overcharged one to the Shelter, a node early.',
  },
  'gn-36-door': {
    gn: 'gn.36', shape: 'Door', earliest: 'A8', home: 10, window: [8, 13], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['hot'],
    level: 'A+1; the Flygon A+2', often: 'run', badge: 'own', dressing: { kanto: 'The Great Desert', elsewhere: 'The Great Desert' },
    note: 'Badge: a dune. Eight nodes, three oases, and the traveller\'s story through it. Water 4, one less a node, refilled at oases; at none, fights start at 90% HP.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_desert', name: 'The Great Desert', entry: 'gn-36-door', themeId: 'fire-ground', tint: DESERT_TINT, mood: 'desert', start: 'opened' },
  { id: 'ps_gn_ridge', name: 'Thunderstorm Ridge', entry: 'gn-35-door', themeId: 'electric-flying', tint: RIDGE_TINT, mood: 'thunderstorm ridge', start: 'opened' },
];
