// Greenneedle gn.new.06: The Duelist (doc GREENNEEDLE_PLACED_1.md lines 228–269). Rules code: core/greenneedle/duelist.ts.
// Build: npm run co:build -- greenneedle-new-06   then   npm run co:gn
import { ch, fight, join, out, wild, type Json } from '../dsl.ts';
import { gev, gn, is, laterStage, moment, not, notThisStage, rm, sameStage, say, scene, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#7a8a4a';
const road = (o: Json = {}): Json => ({ tint: TINT, pokemon: 'farfetchd', tags: ['Pokémon', 'Combat'], effect: 'none', ...o });
const due = (n: number): Json => ({ kind: 'gn', test: 'duelDue', n });
const rested = (): Json => notThisStage('duelist-last');

const OPENING = say(
  'A Farfetch\'d plants its leek in the road like a sword, and points it. Not at you. At the one that landed the hit.',
  '*It bows. It waits. It will wait all day.*',
);
const AGAIN = say(
  'The leek is in the road again, point first. The Farfetch\'d stands behind it as if it never left.',
  '*It bows. It waits.*',
);
const PRACTISED = '*It\'s been practising.* New scuffs ring the leek, and a groove in the dirt where it has bowed and risen a hundred times.';
const WAITED = 'It waited exactly where it said it would. A leaf has landed on the leek, and been left there.';

/** The three choices of a duel stop (the Ask room has only the other two). */
const options = (n: number, ask: boolean): Json[] => [
  ch('Accept the duel.', out('You bow. {duelist} bows. The others step back, and it goes out onto the road alone.', gn('duelEnter'), scene(`gn-new-06-fight-${n}`))),
  ch('Not now.', out('The Farfetch\'d looks at you. Then it lifts its leek and steps off the road. It will wait further on. It never ambushes.', gn('duelPass', { n }))),
  ...(ask ? [ch('Ask what it wants.', out('It does not answer. It points the tip of its leek at the scar on {duelist}, then at a scar of its own, in the same place.', scene(`gn-new-06-ask-${n}`)))] : []),
];

/** A door: the Farfetch'd on the road for duel `n`. */
const door = (id: string, n: number, requires: Json[]): Json => gev(id, 'The Duelist', road({
  stop: 'event', rarity: 'rare', requires: [due(n), rested(), ...requires],
  remembers: [
    { id: 'practised', when: [is('duelist-wins')], notice: PRACTISED },
    { id: 'waited', when: [is('duelist-late')], notice: WAITED },
  ],
}), n === 1 ? OPENING : AGAIN, options(n, true));

const FIGHT_TEXT = [
  '{duelist} walks out to the leek and stops one pace from it. The Farfetch\'d does not look at you once.',
  '{duelist} lifts its head. It remembers the hit. It wants to be worthy of it.',
  '{duelist} is tired, and standing straighter than it was. The Farfetch\'d takes up its leek.',
  'Neither of them blinks. The leek and {duelist}\'s guard rise together.',
  'The last duel. They have stopped looking at each other\'s weapons, and look only at each other\'s eyes.',
];

const duelRooms = (n: number): Json[] => {
  const win = [
    gn('duelWin', { n }),
    when('duelist-wins', { min: 3 }, [scene('gn-new-06-kneel')]),
    when('duelist-wins', { min: 0, max: 2 }, [scene(`gn-new-06-won-${n}`)]),
  ];
  return [
    rm(`gn-new-06-ask-${n}`, 'The Duelist: The Scar', road(), say(
      'The scar is thin and old and exactly where the hit landed. The Farfetch\'d holds very still while you look.',
      'Whatever it wants, it has wanted it since the moment of that hit.',
    ), options(n, false)),
    rm(`gn-new-06-fight-${n}`, `The Duelist: Duel ${n}`, road({ tags: ['Pokémon', 'Combat', 'Story'] }), say(FIGHT_TEXT[n - 1]!, 'One on one. No switching. It bows before, and it will bow after.'), [
      ch('Begin.', fight('The Farfetch\'d bows. {duelist} bows back. The leek comes up.', {
        ...wild({ species: ['farfetchd'], lv: 0, win }), exact: true, friendly: true, rule: { gn: 'duelist', noCatch: true },
        lose: [gn('duelLoss', { n }), when('duelist-losses', { min: 3 }, [scene('gn-new-06-gone')]), when('duelist-losses', { min: 0, max: 2 }, [scene(`gn-new-06-lost-${n}`)])],
      })),
    ]),
    rm(`gn-new-06-won-${n}`, `The Duelist: After Duel ${n}`, road({ tags: ['Pokémon', 'Story'] }), say(
      'The Farfetch\'d lowers its leek, and bows again, lower than before. It looks at {duelist}, and then at its own wings.',
      'It is already thinking about the move that beat it. It will be somewhere on the road ahead, practising.',
    ), [ch('Bow back.', out('{duelist} bows back. The Farfetch\'d gathers its leek and goes, quietly, up the road.'))]),
    rm(`gn-new-06-lost-${n}`, `The Duelist: After Duel ${n}`, road({ tags: ['Pokémon', 'Story'] }), say(
      'The Farfetch\'d bows. It does not crow. It waits until {duelist} is on its feet, and bows again.',
      'It picks up its leek, and goes. It has not finished yet, and neither, you think, has {duelist}.',
    ), [ch('Bow back.', out('{duelist} bows back, unsteady. It watches the road long after the Farfetch\'d has left it.'))]),
  ];
};

export const EVENTS: Json[] = [
  door('gn-new-06-d1', 1, [sameStage('duelist-at'), not('duelist-late')]),
  door('gn-new-06-d1n', 1, [laterStage('duelist-at'), not('duelist-late')]),
  ...[2, 3, 4, 5].map((n) => door(`gn-new-06-d${n}`, n, [not('duelist-late')])),
  ...[1, 2, 3, 4, 5].map((n) => door(`gn-new-06-d${n}-late`, n, [is('duelist-late')])),
  ...[1, 2, 3, 4, 5].flatMap(duelRooms),
  rm('gn-new-06-kneel', 'The Duelist: The Leek', road({ tags: ['Pokémon', 'Story'] }), say(
    'The Duelist kneels, and holds out its leek with both wings. It has not once looked at the leek. It looks at {duelist}.',
    'You understand what it is offering. You are not sure which of you it is offering it to.',
  ), [
    ch('Come with us.', out('It rises slowly. It takes its place at the edge of your party, and bows to each of you in turn.', { ...join({ species: ['farfetchd'], lv: 0 }), }, gn('setFlag', { key: 'duelist-joined', n: 1 }), moment('Won a best of five against a Farfetch\'d that came for a duel, and kept it as a friend.', 70))),
    ch('Leave the leek with my Pokémon.', out('{duelist} takes the leek in its mouth, carefully, as if it were made of glass. The Farfetch\'d bows, deeply, and goes. It does not look back.', gn('duelWorthy'), moment('Was given a Farfetch\'d\'s leek by a worthy opponent.', 70))),
  ]),
  rm('gn-new-06-gone', 'The Duelist: The Bow', road({ tags: ['Pokémon', 'Story'] }), say(
    'The Duelist bows, deeply, with the leek flat across both wings, and goes up the road without once looking back.',
    '{duelist} stares after it for a long time. A node, at least. It does not seem to mind losing. It seems to mind it going.',
  ), [ch('Watch it go.', out('The road is empty. {duelist} keeps looking at it anyway. Then, slowly, it bows to the empty road.', moment('Lost a best of five to a Farfetch\'d, and bowed to it as it left.', 60)))]),
];
export const REMOVE: string[] = [];

const D: Record<number, [number, number]> = { 1: [12, 16], 2: [3, 7], 3: [12, 16], 4: [3, 7], 5: [16, 19] };
const base = { gn: 'gn.new.06', earliest: 'A2', sits: 'optional' as const, attaches: 'after' as const, tags: ['Pokémon'], kinds: ['Region-long: best of five'], level: 'Matches the chosen Pokémon exactly; +1 after each of its losses', often: 'run' as const, badge: 'own', dressing: { kanto: 'The Duelist', elsewhere: 'The Duelist' } };
export const PLACEMENT: Record<string, Placement> = {};
for (const n of [1, 2, 3, 4, 5]) {
  const [home, fall] = D[n]!;
  const [lateHome, lateFall] = D[n === 5 ? 5 : n + 1]!;
  PLACEMENT[`gn-new-06-d${n}`] = { ...base, shape: n === 1 ? 'World Event' : 'Single', beat: n === 1 ? 2 : 1, home, window: [home, fall], note: n === 1 ? 'Duel 1, the same stage as the critical hit (placed ahead of the player the moment the chosen one is marked). Badge: a leek. Once a run (the doc says per save).' : `Duel ${n}, the stage after the last duel at the earliest. Optional.` } as Placement;
  PLACEMENT[`gn-new-06-d${n}-late`] = { ...base, shape: 'Single', home: lateHome, window: [lateHome, n === 5 ? 19 : lateFall], note: `Duel ${n} again after "Not now": the Duelist is at the next duel's step. It never ambushes.` } as Placement;
}
PLACEMENT['gn-new-06-d1n'] = { ...base, shape: 'Single', home: 12, window: [12, 16], note: 'Duel 1 when the stage of the critical hit had no step left ahead: the next stage, same steps.' } as Placement;
export const CHAINS: Json[] = [];
