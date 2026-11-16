// Greenneedle gn.new.21 The Orchestra (doc GREENNEEDLE_PLACED_2.md lines 43–74).
// Build: npm run co:build -- greenneedle-new-21   then   npm run co:gn
// Forty Kricketot, an empty stump, an old Kricketune in the grass. A four-section rhythm game (conduct), or play its own old recording back to it.
// Reward: the back-row Kricketot with Encore Performance (engine.ts, fx.encorePerformance). Afterstory: the orchestra at Step 1 of night stages.
import { ch, flag, join, out, type Json } from '../dsl.ts';
import { is, moment, notThisRegion, notThisStage, say, scene, setTo, stampRegion, stampStage, when, gev, rm } from './_gn.ts';
import type { Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const meadow = (o: Json = {}): Json => ({ tint: '#7a5c8e', pokemon: 'kricketune', tags: ['Pokémon', 'Mystery', 'Story'], effect: 'none', ...o });

/** The back-row Kricketot, with Encore Performance. */
const backRow = (): Json => ({ ...join({ species: ['kricketot'] }), moves: ['encore-performance'], asIs: true, mark: 'back-row' });

const SECTIONS = [
  { id: 'drones', name: 'The Drones', intro: 'The low ones first. A dozen of them, shoulder to shoulder, humming a note so deep it comes up through your boots.', hit: 'The drones come in together, one soft wave, and the whole meadow settles under them.', miss: 'The drones come in ragged, half a beat early. Nobody minds. Nobody stops.' },
  { id: 'chirps', name: 'The Chirps', intro: 'Now the chirpers. They\'ve been waiting for you, and they\'ve been waiting a long time, and every one of them is trembling.', hit: 'The chirps fall in over the drones, bright and even. Somewhere a Kricketot is crying, quietly, with joy.', miss: 'The chirps trip over each other. A Kricketot laughs so hard it hiccups, and carries on.' },
  { id: 'trills', name: 'The Trills', intro: 'The fast ones now. Thin, high, impossible. Their wings blur. They look at you as if you were holding something they thought they\'d lost.', hit: 'The trills spin out, a thread of silver over everything. The grass itself seems to lean in to hear.', miss: 'The trills scatter. For a moment the meadow is nothing but wings and apologies. Then it finds itself again.' },
  { id: 'tutti', name: 'The Whole Meadow', intro: 'All forty. Every wing. You raise your hand and the whole meadow holds its breath, and in the long grass, someone else does too.', hit: 'All forty come in at once, and it is, for four beats, the loveliest thing you have ever heard.', miss: 'All forty come in at once, and nearly together, and that will have to be enough.' },
];

function section(i: number): Json {
  const s = SECTIONS[i]!;
  const last = i === SECTIONS.length - 1;
  const ending: Json[] = last ? [when('orchestra-score', { min: 3 }, [scene('gn-new-21-well')]), when('orchestra-score', { min: 0, max: 2 }, [scene('gn-new-21-bad')])] : [scene(`gn-new-21-${SECTIONS[i + 1]!.id}`)];
  return rm(`gn-new-21-${s.id}`, `The Orchestra: ${s.name}`, meadow(), say(`*Section ${i + 1} of 4.*`, s.intro), [
    ch('Bring them in.', out(s.hit, flag('orchestra-score'), ...ending), { prompt: { id: `orchestra-${s.id}`, needs: 'ok' }, fail: out(s.miss, ...ending) }),
  ]);
}

const gn21: Json[] = [
  gev('gn-new-21', 'The Orchestra', meadow({ stop: 'event', rarity: 'uncommon', requires: [notThisRegion('orchestra-at')] }), say(
    '*Dusk in a meadow. Forty Kricketot tune up, a rustle of wings, a dozen small notes finding each other. Then, all at once, they stop.*',
    '*Every one of them turns, and looks at an empty tree stump.*',
    '*One in the back row plays a wrong note into the silence, and hides.*',
    '*In the long grass, an old Kricketune sits with its back to them.*',
  ), [
    ch('Step up to the stump.', out('You step up. The stump is warm, as though someone only just left it. Forty small faces tilt up to you, and wait.', stampRegion('orchestra-at'), setTo('orchestra-conducted', 1), setTo('orchestra-score', 0), scene('gn-new-21-drones'))),
    ch('Go and find the conductor.', out('You walk past the stump, into the long grass. The orchestra doesn\'t make a sound. It watches you go.', stampRegion('orchestra-at'), setTo('orchestra-returned', 1), scene('gn-new-21-return'))),
  ]),
  ...SECTIONS.map((_, i) => section(i)),
  rm('gn-new-21-well', 'The Orchestra: The Last Movement', meadow({ tags: ['Pokémon', 'Relationship', 'Story'] }), say(
    '*At the last movement, the old Kricketune walks out of the grass, slowly, on legs that have forgotten the way.*',
    '*It taps your knee, twice, the way you\'d tap a student\'s shoulder when they\'ve got it right. Then it takes the stump.*',
    '*The orchestra begins again, with the conductor back where it belongs. It plays like it has been waiting years to.*',
    '*The one from the back row hops onto your shoe, and stays.*',
  ), [ch('Let the back-row one come.', out('It plays one soft, correct note, just for you. Then it settles against your ankle, and doesn\'t look back.', backRow(), setTo('orchestra-end', 1), stampStage('orchestra-heard'), moment('Conducted the meadow orchestra. Its old conductor took the stump back.', 75)))]),
  rm('gn-new-21-bad', 'The Orchestra: Louder', meadow({ tags: ['Pokémon', 'Story'] }), say(
    '*The orchestra plays louder, to cover. Forty small wings, forty small hearts, and a great deal of sincerity.*',
    '*It is not good. It is, somehow, still wonderful.*',
    '*The one from the back row catches your eye, and winks. Then it hops down, as if that settles it.*',
  ), [ch('Let the back-row one come.', out('It plays a wrong note, on purpose this time, and grins up at you. It is yours now, and it knows it.', backRow(), setTo('orchestra-end', 2), stampStage('orchestra-heard'), moment('Conducted a meadow orchestra badly, and loudly. Nobody minded.', 60)))]),
  rm('gn-new-21-return', 'The Orchestra: The Conductor', meadow({ tags: ['Pokémon', 'Relationship', 'Story'] }), say(
    '*The old Kricketune doesn\'t turn. Its wings are worn thin, and its back is very straight.*',
    '*Your Pokégear has one recording on it that you never made: a meadow, at dusk, forty small voices, and one clear note leading all of them.*',
    '*You set the Pokégear down in the grass beside it, and press play.*',
  ), [ch('Let it play.', out('It listens to the whole thing. Every note. When the last one fades it is quiet for a long time. Then it gets up.', setTo('orchestra-end', 3), scene('gn-new-21-bow')))]),
  rm('gn-new-21-bow', 'The Orchestra: The Bow', meadow({ tags: ['Pokémon', 'Relationship', 'Story'] }), say(
    '*It walks to the stump, and stops. Then it turns, and bows to you.*',
    '*It bows to you before it bows to them.*',
    '*Forty Kricketot sit absolutely still, and the one from the back row is already coming through the grass toward you.*',
  ), [ch('Bow back.', out('You bow back. The conductor takes its stump. The back-row Kricketot climbs onto your shoe. Behind you the music begins, and it is perfect.', backRow(), stampStage('orchestra-heard'), moment('Played a Kricketune its own old recording. It bowed to you first.', 80)))]),
  gev('gn-new-21-night', 'The Orchestra: At Night', meadow({ stop: 'event', rarity: 'uncommon', callback: true, requires: [{ kind: 'gn', test: 'thisRegion', key: 'orchestra-at' }, { kind: 'period', in: ['night'] }, is('orchestra-end'), notThisStage('orchestra-heard')] }), say(
    '*Night. Somewhere across the fields, faint, a long way off, forty small voices are tuning up.*',
    '*They find the first note together. They never miss it.*',
  ), [ch('Listen.', out('You stand a while and listen. The music is faint, and sure of itself, and for as long as it plays you are not the least bit alone.', stampStage('orchestra-heard')))]),
];

export const EVENTS: Json[] = gn21;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-21': {
    gn: 'gn.new.21', shape: 'Single', earliest: 'A2', home: 9, window: [7, 12], sits: 'optional', attaches: 'instead', tags: ['Pokémon', 'Mystery'], needs: ['forest'],
    level: 'None (no battles)', often: 'region', badge: 'own',
    note: 'Badge: a stump. At dusk; fallback step 14. Once per region. A rhythm game of four sections (conduct) or the Pokégear recording (find the conductor). gn-new-21-night is the afterstory.',
  },
  'gn-new-21-night': { gn: 'gn.new.21', shape: 'Single', earliest: 'A2', home: 1, window: [1, 1], sits: 'optional', attaches: 'rest', tags: ['Pokémon', 'Mystery'], level: 'None', often: 'region', badge: 'own', note: 'Afterstory: the orchestra is heard faintly at Step 1 of every night stage for the rest of the region.' },
};
export const CHAINS: Json[] = [];
