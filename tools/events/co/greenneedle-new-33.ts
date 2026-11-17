// Greenneedle, gn.new.33 The Old Courier (doc GREENNEEDLE_PLACED_2.md lines 460-493).
// A pseudo stage of three legs of flight: the foothills, the storm wall, the sea approach, then the lighthouse.
// Build: npm run co:build -- greenneedle-new-33   then   npm run co:gn
import { any, ch, egg, flag, fight, hurt, leave, out, room, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, inside, is, laterStage, leavePseudo, moment, not, rm, roll, say, setTo, stampStage, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const POST_TINT = '#6b5a3a';
const post = (o: Json = {}): Json => ({ tint: POST_TINT, tags: ['Story', 'Pokémon'], pokemon: 'dragonite', effect: 'float', ...o });
const sky = (o: Json = {}): Json => post({ tint: '#3a5a7a', tags: ['Combat', 'Pokémon'], effect: 'float', ...o });

const gn33: Json[] = [
  gev('gn-new-33-door', 'The Old Courier', post({
    stop: 'event', rarity: 'rare', forced: true, minStage: 1, requires: [not('gn-new-33-entered')],
  }), say(
    'A post office is holding a small party. Paper streamers on the sorting table, a sheet cake, and one guest of honour who cannot sit still.',
    'A Dragonite, with grey round its eyes and a mailbag it will not take off. It has worn that bag so long the strap has worn a groove in its shoulder.',
    '**Postmaster, Mr. Okoro:** "Forty years on the mountain route. Last day. One parcel left."',
    '*The Dragonite holds the parcel out to you, then points at its own wing, and makes a small, unsure sound.*',
  ), [
    ch('I\'ll come.', out('It lets out a breath it has been holding since the morning. You climb on behind the mailbag. The whole post office cheers, and the cake is, you notice, left uncut.', flag('gn-new-33-entered'), room('gn-new-33-foothills'))),
    ch('It can wait for better weather.', out('It puts the parcel back in its bag, and nods, as if you had said something it already knew. Then it goes to the window.', flag('gn-new-33-entered'), room('gn-new-33-alone'))),
    ch('Let a younger one take it.', out('It looks at you for a long moment. Then it puts the parcel back in its bag, tightens the strap, and goes to the window.', flag('gn-new-33-entered'), room('gn-new-33-alone'))),
  ]),

  // ---- declined: it goes alone, and you can still follow ----
  rm('gn-new-33-alone', 'The Old Courier: Alone', post({ effect: 'float' }), say(
    'It goes out the window in one long, grey-winged push, and the streamers lift and settle behind it. Nobody at the party says anything.',
    'It is already small over the foothills. It flies the way it has flown for forty years: low, and straight, and not looking back. Almost.',
  ), [
    ch('Follow it.', out('You run. You do not catch it. But the mailbag is a dark speck you can keep your eyes on, and one by one it comes down on the first ledge to wait for you, not looking at all as if it were waiting.', setTo('courier-followed', 1), room('gn-new-33-foothills'))),
    ch('Let it go.', out('It is a speck, then a thought, then gone. Mr. Okoro cuts the cake, finally, and gives you the first slice without a word.', setTo('courier-let-go', 1), leavePseudo())),
  ]),

  // ---- leg 1: the foothills ----
  rm('gn-new-33-foothills', 'The Old Courier: The Foothills', sky({
    remembers: [{ id: 'followed', when: [is('courier-followed')], notice: 'It does not say it is glad you came. It simply flies a little lower, so that your feet find its back.' }],
  }), say(
    'The ground tips away under you. The foothills slide past, green and gold, a quilt shaken out below.',
    'Wild Fearow. They hold these hills the way landlords do, and the courier has crossed their sky every morning for forty years without once being asked for the rent.',
    'Today it is asked. They come up in a spiral, and the party fights from its back.',
  ), [
    ch('Fight from its back.', fight(
      'The Dragonite does not turn. It banks, once, so your Pokémon have the angle, and then holds absolutely level, as a thing does when it trusts the people riding it.',
      inside(eitherWay(wild({ species: ['fearow'], lv: 0, win: [room('gn-new-33-storm')] }))),
    )),
  ]),

  // ---- leg 2: the storm wall ----
  rm('gn-new-33-storm', 'The Old Courier: The Storm Wall', sky({ effect: 'rattle', pokemon: 'dragonite', tint: '#2f3f5a' }), say(
    'Ahead the sky stands up like a wall. Grey at the bottom, black at the top, and a wind coming out of it that leans on the two of you like a hand.',
    'The Dragonite slows. It does not look at you. It looks at the wall, and then, very slightly, at its own wing, and then at you.',
    'There are three ways, and each costs something different: height, or health, or time.',
  ), [
    ch('Over.', out('It climbs. The air goes thin and bright, and the wall falls away below you like a bad idea. But it breathes hard at the top, and its wingbeats come slower after.', setTo('courier-over', 1), room('gn-new-33-sea'))),
    ch('Through.', out('It folds its wings and goes in. The wind hits you like a thrown door. Rain, hail, a crack of light far too close. You hold on. You all come out the other side, a little the worse.', hurt(0.2), room('gn-new-33-sea'))),
    ch('Under.', out('It drops to a hand\'s breadth over the waves and goes the long way round, with the spray in your teeth. It takes most of the afternoon. Down at the post office, the cake is going stale.', setTo('courier-late', 1), room('gn-new-33-sea'))),
  ]),

  // ---- leg 3: the sea approach ----
  rm('gn-new-33-sea', 'The Old Courier: The Sea Approach', sky({
    effect: 'float', tint: '#2a4f6e',
    remembers: [{ id: 'over', when: [is('courier-over')], notice: 'It is slower than it was. The high thin air took more than it showed, and you both know it.' }],
  }), say(
    'The sea opens out below, grey, then green, then a very long way down. Far ahead, a white pin standing in the water: the lighthouse.',
    'Its wings are failing. You feel it before you see it, in the way the long strokes shorten, and the way the whole body catches before each push.',
    '*It looks back at you.*',
  ), [
    ch('You can do this.', out(
      'You say it plainly, the way you would say it to a friend on a ladder. Its eyes go bright. It tucks in its chin, and it goes.',
      // Going over the storm wall cost it its height: it cannot make the last mile, however it is asked. Any other way, it does.
      when('courier-over', { min: 1 }, [setTo('courier-down', 1)], 'It goes. For a mile it goes. Then the long strokes stop, and it comes down on the shingle, short of the door. The high thin air took what it had.'),
      room('gn-new-33-keeper'),
    )),
    ch('Set down. We\'ll walk it.', out('It lets out a breath that is half a laugh. It lowers you both onto a spit of rock, gently, the way you set down something you mean to come back for.', setTo('courier-down', 1), room('gn-new-33-keeper'))),
  ]),

  // ---- the lighthouse ----
  rm('gn-new-33-keeper', 'The Old Courier: The Lighthouse', post({
    pokemon: 'dragonite', effect: 'glint', tint: '#7a6a4a',
    remembers: [
      { id: 'forced', when: [is('courier-down')], intro: say(
        'It could not carry the parcel the last mile. It came down on the shingle with a sound like a sigh, and for a long moment nobody moved.',
        'So your Pokémon carry the parcel the last mile, passing it between them along the causeway. The Dragonite walks beside them, mailbag on, in no hurry at all.',
        '**Keeper:** "Forty years ago it brought my mother her first letter. She kept the envelope."',
        '*It sets the parcel in the keeper\'s hands itself. Then it sits down, heavily, and does not take the bag off.*',
      ) },
    ],
  }), say(
    'The lighthouse door is open before you reach it. An old keeper stands in it with both hands out, as if he had been standing there since the morning.',
    '**Keeper:** "Forty years ago it brought my mother her first letter. She kept the envelope."',
    'The Dragonite lands, folds its wings carefully, one then the other, and holds out the parcel. It takes it with both hands, and doesn\'t open it.',
  ), [
    chIf([not('courier-late')], 'Take the egg.', out(
      'The keeper brings out a small egg, wrapped in a postmaster\'s grey scarf. "Mr. Okoro sent it ahead. It\'s his grand-something." It is warm. It is, faintly, humming.',
      egg({ species: ['dratini'], left: 3, unit: 'battle' }), gn('eggShape', { key: 'tailwind-heart' }), bond(1), setTo('courier-done', 1), stampStage('courier-stage'), setTo('courier-let-go', 0),
      moment('Flew the old courier\'s last parcel to the lighthouse, over three legs of sky.', 75), leavePseudo(),
    )),
    chIf([is('courier-late')], 'Take the egg.', out(
      'The keeper brings out a small egg, wrapped in a postmaster\'s grey scarf. "Mr. Okoro sent it ahead. It\'s his grand-something." The afternoon cost a little: it will take longer to hatch. It is warm. It is, faintly, humming.',
      egg({ species: ['dratini'], left: 5, unit: 'battle' }), gn('eggShape', { key: 'tailwind-heart' }), bond(1), setTo('courier-done', 1), stampStage('courier-stage'), setTo('courier-let-go', 0),
      moment('Flew the old courier\'s last parcel to the lighthouse, over three legs of sky.', 75), leavePseudo(),
    )),
  ]),

  // ---- afterstory: a retired Dragonite on post-office roofs ----
  gev('gn-new-33-roof', 'The Old Courier: The Roof', post({
    stop: 'event', rarity: 'uncommon', tags: ['Story'], requires: [is('courier-done'), laterStage('courier-stage'), not('courier-roof')],
  }), say(
    'A post office, small and tidy, in a town you have not been to before. On its roof: a Dragonite, retired, asleep in the afternoon sun, a mailbag for a pillow.',
    'It opens one eye as you pass. Then, with great dignity, it closes it again. Mr. Okoro told everyone. Everyone told everyone.',
    '**Clerk:** "A parcel for you came in this morning. A step early. We\'re not allowed to say who arranged that."',
  ), [
    ch('Take the parcel.', out('It is addressed in careful, spidery handwriting. Inside: a little something for the road, and a note that just says: *Thank you for the wind.*', any('hyper-potion', 'full-heal', 'ether', 'elixir'), bond(1), setTo('courier-roof', 1))),
    ch('Leave it asleep.', leave('You go quietly. The Dragonite smiles in its sleep, or perhaps it is only the sun.')),
  ]),
];

export const EVENTS: Json[] = gn33;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-33-door': {
    gn: 'gn.new.33', shape: 'Door', earliest: 'A10', home: 15, window: [12, 18], sits: 'must-see', attaches: 'instead', tags: ['Pseudo Stage'],
    level: 'A+0 wild Flying-types', often: 'run', badge: 'own',
    dressing: { kanto: 'The Old Courier', elsewhere: 'The Old Courier' },
    note: 'Pseudo stage of three legs of flight, at the post office; fallback step 5 of the next stage. Once per run. Badge: a mailbag. The egg hatches a Dratini with Extreme Speed and Tailwind Heart (daycare.ts egg shape).',
  },
  'gn-new-33-roof': { gn: 'gn.new.33', shape: 'Single', earliest: 'A11', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Miniature Episode'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: a retired Dragonite on a post office roof; a parcel for you, a step early (a later stage of the same run).' },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_courier', name: 'The Old Courier', entry: 'gn-new-33-door', themeId: 'normal-flying', tint: POST_TINT, mood: 'high wind', start: 'opened' },
];
