// Greenneedle, part 8: gn.35 Thunderstorm Ridge (doc GREENNEEDLE_REWORKED_PLACED_8.md).
// Build: npm run co:build -- greenneedle-8   then   npm run co:gn
import { anyType, ch, fight, flag, heal, item, join, out, wild, type Json } from '../dsl.ts';
import { chIf, gev, gn, inside, is, laterStage, leavePseudo, moment, not, rm, roll, route, say, scene, setTo, stampStage, when, type Placement } from './_gn.ts';

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

export const EVENTS: Json[] = [...gn35];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-35-door': {
    gn: 'gn.35', shape: 'Door', earliest: 'A7', home: 16, window: [14, 18], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage'], needs: ['storm', 'high'],
    level: 'A+1; the overcharged one A+2', often: 'run', badge: 'own', dressing: { kanto: 'Thunderstorm Ridge', elsewhere: 'Thunderstorm Ridge' },
    note: 'Badge: a lightning bolt. Six nodes. Lightning each node (20%); charged crystals draw Electric-types; three crystals bring the overcharged one to the Shelter, a node early.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_ridge', name: 'Thunderstorm Ridge', entry: 'gn-35-door', themeId: 'electric-flying', tint: RIDGE_TINT, mood: 'thunderstorm ridge', start: 'opened' },
];
