// Greenneedle, gn.new.17 The Stranding (doc GREENNEEDLE_PLACED_1.md lines 617–655; rules in src/core/greenneedle/stranding.ts).
// Build: npm run co:build -- greenneedle-new-17   then   npm run co:gn
import { ch, flag, join, out, type Json } from '../dsl.ts';
import { bond, bondAll, gev, gn, is, kindness, moment, not, regionChanged, rm, route, say, scene, stampRegion, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#3b7a9c';
const beach = (o: Json = {}): Json => ({ tint: TINT, tags: ['Story'], effect: 'none', pokemon: 'wailord', ...o });
/** After a task: the next Pokémon waits for its job, or the turn can pass. */
const next: Json = route('st-more', 'gn-new-17-resolve', 'gn-new-17-work');
const give = (n: number, line: string): Json => ch(line, out('', gn('stAssign', { n }), next));
const REWARD: Json[] = [join({ species: ['wailmer'] }), flag('stranding-helped'), stampRegion('stranding-gratitude'), moment('A beach town held a Wailord up until the tide came back for it.', 80)];

const EVENTS_17: Json[] = [
  gev('gn-new-17-beach', 'The Stranding', beach({ stop: 'event', rarity: 'rare', forced: true, types: ['water'], requires: [not('stranding-helped'), not('stranding-seen')], remembers: [
    { id: 'early', when: [is('factory-left-running')], notice: 'The bay still runs the colour of the factory\'s last night. The water\'s going out early: you have seven turns, not eight.' },
  ] }), say(
    '*A whole beach town, running in one direction. Down toward the sand, where the sea has left something enormous behind.*',
    'A Wailord, on its side, on the beach. Its eye is the size of a cartwheel, and it is looking at the sky.',
    '**Harbourmaster, Captain Ffion:** "Eight hours to the turn! Wet, shade, dig, calm, crowd, tide! Who\'ve you got?"',
  ), [
    ch('Report to Captain Ffion.', out('"Right. Everyone on a job. Nobody stands about." She hands you a bucket, which is how you know she means it.', gn('stStart'), flag('stranding-seen'), stampRegion('stranding-at'), scene('gn-new-17-work'))),
  ]),
  rm('gn-new-17-work', 'The Stranding: The Sand', beach(), say(
    'Turn {stranding:turn} of {stranding:turns}. The tide is still going out.',
    '{stranding:bars}',
    'Waiting for a job: {stranding:next}. Each Pokémon does one thing a turn. What you leave, the townspeople cover, less well.',
  ), [
    give(0, 'Keep it wet.'),
    give(1, 'Shade it.'),
    give(2, 'Dig a channel.'),
    ch('More tasks.', out('You look down the list again: three more.', scene('gn-new-17-more'))),
  ]),
  rm('gn-new-17-more', 'The Stranding: The Rest of the List', beach(), say(
    'Turn {stranding:turn} of {stranding:turns}. {stranding:next} is waiting.',
    '{stranding:bars}',
  ), [
    give(3, 'Calm it.'),
    give(4, 'Hold the crowd.'),
    give(5, 'Guide the tide.'),
    ch('Back.', out('The first three, then.', scene('gn-new-17-work'))),
  ]),
  rm('gn-new-17-resolve', 'The Stranding: The Hours Pass', beach(), say(
    'Everyone has a job. Buckets, shovels, voices, one long wet sheet passed hand to hand.',
    '{stranding:bars}',
    'The sun moves. The sea doesn\'t, yet.',
  ), [
    ch('Let the hour pass.', out('An hour goes by in a single breath, and the Wailord breathes out with it.', gn('stEnd'), route('st-state', 'gn-new-17-work', 'gn-new-17-lifted', 'gn-new-17-dragged'))),
  ]),
  rm('gn-new-17-lifted', 'The Stranding: The Tide Lifts It', beach(), say(
    'Turn {stranding:turns}. {stranding:kept} of six jobs held. The whole beach is holding its breath.',
    '*The tide lifts it. It rolls once. It goes.*',
    'It leaves a trench the shape of a Wailord, and a town of people sitting down in the wet sand, laughing and shaking.',
  ), [
    ch('Watch it go.', out(say(
      'Out past the harbour wall, a spout goes up, and keeps going up. Captain Ffion takes off her cap and doesn\'t put it back.',
      'Behind the party\'s boat, something small and round surfaces. A Wailmer. It follows you all the way to the dock.',
      '"The next crossing," Ffion says, "the harbour\'ll shave a step off. A boat\'s a small thing to give. It\'s what we\'ve got."',
    ), ...REWARD, bondAll(1), kindness(1))),
  ]),
  rm('gn-new-17-dragged', 'The Stranding: The Second Wailord', beach(), say(
    'Turn {stranding:turns}. {stranding:kept} of six jobs held. It wasn\'t enough, and everyone on the sand knows it.',
    '*Offshore, a second Wailord calls. The first drags itself the last metres. It lives, hurt.*',
    'It leaves a long scar in the sand, and something low and answering in the water that you feel in your feet.',
  ), [
    ch('Watch it go.', out(say(
      'It slides into the surf, slowly, and sinks. Then, a long way out, two spouts, side by side.',
      'Behind the party\'s boat, something small and round surfaces. A Wailmer. It follows you all the way to the dock.',
      '"Hurt, not lost," says Ffion. "You gave it the hours it needed. Next crossing, a step off. Don\'t argue."',
    ), ...REWARD, bond(1))),
  ]),
  gev('gn-new-17-festival', 'The Stranding: The Festival', beach({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('stranding-helped'), regionChanged('stranding-at'), not('stranding-festival')] }), say(
    '*A beach town with every flag it owns out. On the harbour wall, a banner the length of a Wailord.*',
    'Painted on it, huge and a little crooked: {stranding:calmer}. Underneath, in a child\'s lettering: THE ONE WHO STAYED.',
    'Captain Ffion is on a crate, shouting the story to people who were there.',
  ), [
    ch('Join the festival.', out('You eat something fried on a stick. Somebody puts a paper crown on your lead. The Wailmer spins in the shallows, delighted.', flag('stranding-festival'), bondAll(1))),
    ch('Leave it to them.', out('You leave it to them, which is its own kind of present. The banner follows you down the road for a while.', flag('stranding-festival'))),
  ]),
];

export const EVENTS: Json[] = EVENTS_17;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-17-beach': {
    gn: 'gn.new.17', shape: 'World Event', earliest: 'A5', home: 10, window: [10, 15], sits: 'must-see', attaches: 'before', tags: ['World Event'], stages: [3, 4, 5, 6],
    level: 'No battles', often: 'run', needs: ['water'], badge: 'own',
    dressing: { kanto: 'The Stranding', elsewhere: 'The Stranding' },
    note: 'Badge: a wave. Eight turns (seven if the factory was left running); six tasks, one per Pokémon a turn (core/greenneedle/stranding.ts). Four or more kept up and the tide lifts it; fewer and a second Wailord calls; nobody dies. A Wailmer joins; the next ferry in the region skips one more step (events.ts skipAhead).',
  },
  'gn-new-17-festival': {
    gn: 'gn.new.17', shape: 'Single', earliest: 'A6', home: 8, window: [1, 20], sits: 'optional', attaches: 'after', tags: ['World Event'],
    level: 'None', often: 'run', dressing: { kanto: 'The Stranding: The Festival', elsewhere: 'The Stranding: The Festival' },
    note: 'Afterstory: a festival in a later region of this run (no cross-run memory), with the Pokémon that calmed it on the banner.',
  },
};
export const CHAINS: Json[] = [];

