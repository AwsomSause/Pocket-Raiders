// Greenneedle, new event gn.new.15 The Weather Station (doc GREENNEEDLE_PLACED_1.md lines 540-575).
// Build: npm run co:build -- greenneedle-new-15   then   npm run co:gn
// A door (step 12, optional, needs `high`, once a run), a porch node, the floor plan with four rooms (scenes) and the tower (a node).
// Each room is stuck in one weather. Castform takes the form of the weather of the room it just left; a room opens only to the form it needs.
// ws-from: 0 the porch, 1 the archive, 2 the generator, 3 the balloon shed, 4 the radio room.
import { ch, fight, flag, join, out, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, inside, intel, is, kindness, leavePseudo, moment, not, rm, say, scene, setTo, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#6c8aa6';
const station = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Exploration', 'Story'], effect: 'none', pokemon: 'castform', ...o });
const room = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, station(o), intro, choices);

interface Room { key: string; id: string; n: number; need: number; name: string; weather: string; foes: string[]; intro: string; right: string; wrong: string; pass: string }
const ROOMS: Room[] = [
  { key: 'ws-archive', id: 'gn-new-15-archive', n: 1, need: 2, name: 'The Archive', weather: 'rain', foes: ['wooper', 'psyduck', 'poliwag'],
    intro: say(
      'The archive. Rain is falling from the ceiling, steadily, as if it had been told to. A hundred years of charts have gone to grey paste on the shelves.',
      'Castform paddles in ahead of you and looks back. It wants this room to be dry. So do you.',
    ),
    right: say(
      'Castform steps over the threshold sunny-faced, warm as a lamp. Light spreads along the shelves.',
      'The paper lifts and curls and dries. A chart peels free, and the numbers on it are still there.',
    ),
    wrong: 'Castform comes in the wrong shape and the rain gets into it. It wails, high and helpless. Something that lives in the wet wakes up and comes to see.',
    pass: 'The charts are dry now. Castform walks through, and the doorway changes it again.' },
  { key: 'ws-generator', id: 'gn-new-15-generator', n: 2, need: 1, name: 'The Generator', weather: 'sun', foes: ['numel', 'vulpix', 'growlithe'],
    intro: say(
      'The generator room. The air shimmers. The old machine is glowing at the seams, and the dial next to it has gone past the red.',
      'It wants cooling, badly. Castform stops in the doorway and looks at it, and then at you.',
    ),
    right: say(
      'Castform comes in rainy and shivering with it. A thin rain falls on the casing, hissing.',
      'The glow fades from orange to red to nothing. The dial sinks back. The machine lets out one long, grateful breath.',
    ),
    wrong: 'Castform comes in the wrong shape and the heat finds it at once. It wails. Something that likes the heat pads out of the haze, interested.',
    pass: 'The generator hums, cool and steady. Castform walks through, and the doorway changes it again.' },
  { key: 'ws-shed', id: 'gn-new-15-shed', n: 3, need: 2, name: 'The Balloon Shed', weather: 'snow', foes: ['snover', 'swinub', 'snorunt'],
    intro: say(
      'The balloon shed. Snow, indoors, drifting across a patched and folded balloon. The winch that raises it is wrapped in ice.',
      'Castform shakes frost off itself and looks at the winch. The balloon is the only way up to the tower.',
    ),
    right: say(
      'Castform comes in sunny and bright. Warmth rolls across the floor and the ice on the winch begins to drip.',
      'The crank turns, stiffly, then freely. Above you, the balloon sighs and starts to fill.',
    ),
    wrong: 'Castform comes in the wrong shape and the cold takes hold of it. It wails. Something white and small slides out of the drift to look.',
    pass: 'The winch is free. Castform walks through, and the doorway changes it again.' },
  { key: 'ws-radio', id: 'gn-new-15-radio', n: 4, need: 1, name: 'The Radio Room', weather: 'fog', foes: ['gastly', 'duskull', 'misdreavus'],
    intro: say(
      'The radio room. Fog hangs between the dials, so thick that the desk is only a shape. The big lens on the antenna is streaked grey.',
      'Somewhere in the static there is a voice. It cuts out whenever you lean closer.',
    ),
    right: say(
      'Castform comes in rainy, and rain comes with it. It runs down the lens in clean, bright lines.',
      'The fog thins and the dials come up out of it one by one. The static clears, and a weather report is already running on a loop.',
    ),
    wrong: 'Castform comes in the wrong shape and the fog closes round it. It wails. Something in the fog has noticed the noise, and drifts closer.',
    pass: 'The lens is clean. Castform walks through, and the doorway changes it again.' },
];
const BY_KEY = (n: number): Room => ROOMS.find((r) => r.n === n)!;

const FORMS: [number, string][] = [
  [1, 'Castform is in its rainy form, damp and silver-blue, still dripping from the archive.'],
  [2, 'Castform is in its sunny form, warm and flushed, still glowing from the generator.'],
  [3, 'Castform is in its snowy form, pale and frosted, still shivering from the shed.'],
];
/** After a room is done: Castform has taken the form of that room's weather. The fourth room opens the tower. */
const leaveRoom = (r: Room): Json[] => [
  setTo('ws-from', r.n),
  gn('check', { key: 'ws-half-a', if: [is('ws-archive'), is('ws-generator')] }),
  gn('check', { key: 'ws-half-b', if: [is('ws-shed'), is('ws-radio'), not('ws-up')] }),
  gn('check', { key: 'ws-all', if: [is('ws-half-a'), is('ws-half-b')] }),
  when('ws-all', { min: 1 }, [setTo('ws-up', 1), { kind: 'addEvent', eventId: 'gn-new-15-tower' }]),
  when('ws-all', { min: 0, max: 0 }, [scene('gn-new-15-hall')]),
];
/** From the floor plan: work out whether Castform's form fits this room (before the room scene opens). */
const knock = (r: Room): Json[] => [
  gn('check', { key: 'ws-right', if: [is('ws-from', r.need, r.need), not(r.key)] }),
  gn('check', { key: 'ws-wrong', if: [not(r.key), not('ws-right')] }),
  scene(r.id),
];

const roomScene = (r: Room): Json => room(r.id, `The Weather Station: ${r.name}`, {}, r.intro, [
  chIf([is('ws-right')], r.n === 1 ? 'Let Castform dry the charts.' : r.n === 2 ? 'Let Castform cool it.' : r.n === 3 ? 'Let Castform thaw the winch.' : 'Let Castform wash the lens.',
    out(r.right, setTo(r.key, 1), ...leaveRoom(r))),
  chIf([is('ws-wrong')], 'Let Castform try.', fight(r.wrong, inside(eitherWay({ ...wild({ species: r.foes, lv: -1, win: leaveRoomWrong(r) }), friendly: true })))),
  chIf([is(r.key)], 'Pass through.', out(r.pass, ...leaveRoom(r))),
]);
/** A wrong form: the room's wild Pokémon is beaten, Castform has changed at the doorway anyway, and it is back at the floor plan. */
const leaveRoomWrong = (r: Room): Json[] => [setTo('ws-from', r.n), scene('gn-new-15-hall')];

const FLOORPLAN = say(
  '*The station\'s floor plan is on the wall, in pencil, with the doors numbered. Someone has underlined every room\'s weather twice.*',
  '**Archive: rain. Generator: sun. Balloon shed: snow. Radio room: fog.** Beneath the shed, in a different hand: *C. goes the colour of wherever it was.*',
  'Four doors. Castform dithers between them, changing shape every time it turns.',
);

/** The reward: the Castform joins with Forecast Ahead; the station is done (the pinned forecasts start next stage). */
const REWARD: Json[] = [
  { ...join({ species: ['castform'], lv: -1 }), ability: 'forecast-ahead', mark: 'ws-castform' },
  flag('ws-done'),
  moment('Read a storm with a Castform instead of stopping it. It asked to see real weather.', 55),
  leavePseudo(),
];

const gnew15: Json[] = [
  gev('gn-new-15-door', 'The Weather Station', station({ stop: 'event', rarity: 'rare', requires: [not('ws-done'), not('ws-entered')] }), say(
    '*A mountain weather station with four doors. Snow is coming out of one. Heat-haze is coming out of another.*',
    '*A Castform shoots out, turns from snow to sun to rain in the space of the porch, and wails.*',
    '*It tugs your sleeve toward the doors, and won\'t let go.*',
  ), [
    ch('Follow it in.', out('You let it lead you up the steps. Its shape changes under your hand with every pace, and it doesn\'t stop crying.', flag('ws-entered'),
      setTo('ws-from', 0), setTo('ws-archive', 0), setTo('ws-generator', 0), setTo('ws-shed', 0), setTo('ws-radio', 0), setTo('ws-up', 0),
      { kind: 'addEvent', eventId: 'gn-new-15-porch' })),
    ch('Walk on.', out('You walk on. Behind you, a small voice is still crying, rain, then sun, then snow, then rain.')),
  ]),
  room('gn-new-15-porch', 'The Weather Station: The Porch', {}, say(
    'The porch smells of wet dust and warm metal. The log book by the door has been open to the same page for days. The last entry says only: *all four, at once.*',
    'Castform pulls at you, then at the doors, then at you. It is frightened for someone, and it can\'t say who.',
  ), [
    ch('Go in.', out('You step inside. The floor plan is the first thing you see.', scene('gn-new-15-hall'))),
  ]),
  room('gn-new-15-hall', 'The Weather Station: The Floor Plan', { remembers: FORMS.map(([n, text]) => ({ id: `form-${n}`, when: [is('ws-from', n, n)], notice: text })) }, FLOORPLAN, [
    ch('The archive.', out('You open the first door. The sound of rain comes out to meet you.', ...knock(BY_KEY(1)))),
    ch('The generator.', out('You open the second door. A wall of heat comes out to meet you.', ...knock(BY_KEY(2)))),
    ch('The balloon shed.', out('You open the third door. The cold comes out like a held breath.', ...knock(BY_KEY(3)))),
    ch('The radio room.', out('You open the fourth door. Fog pours across your boots.', ...knock(BY_KEY(4)))),
  ]),
  ...ROOMS.map(roomScene),
  room('gn-new-15-tower', 'The Weather Station: The Tower', { tags: ['Pokémon', 'Story', 'Recovery'] }, say(
    'The last stair opens onto a round room full of glass and brass. At the centre, among a hundred needles, a woman sits on the floor with her head in her hands.',
    '**Forecaster, Nimbus Hart:** "I seeded a cloud. One. And now this. It\'s mine. I have to stop it."',
    '*Castform trots across to the instruments and cycles through all four forms in front of them: rain, sun, snow, fog. The needles shiver, and settle.*',
    '**Nimbus:** "...It isn\'t mine. It was coming anyway. Oh. Oh, thank goodness. Oh, that\'s worse."',
  ), [
    ch('"It\'ll pass."', out('**Nimbus:** "Yes. Yes, it will. It\'s a front. You read a front. You don\'t stop it." She laughs, wetly, for the first time in days.', ...REWARD)),
    ch('"You couldn\'t have known."', out('She looks up at you for a long time. Then she nods, once, the way people nod when they have been given something they didn\'t expect.', kindness(1), ...REWARD)),
    ch('"Let\'s read it together."', out('You kneel beside her, and she shows you how the needles lean. By the third pass you can both see where the storm goes, and it goes round.', intel(1), bond(1), ...REWARD)),
  ]),
];

export const EVENTS: Json[] = gnew15;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-15-door': {
    gn: 'gn.new.15', shape: 'Door', earliest: 'A7', home: 12, window: [10, 17], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Mystery Episode'], needs: ['high'],
    level: 'A-1 wild Pokémon in the rooms', often: 'run', badge: 'own', dressing: { kanto: 'The Weather Station', elsewhere: 'The Weather Station' },
    note: 'Badge: a weather vane. A door at step 12, optional (fallback step 17). A porch, the floor plan with four rooms (scenes) and the tower. Afterstory: a hand-written forecast at step 1 of each later stage (run.ts, core/greenneedle/weather.ts).',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_station', name: 'The Weather Station', entry: 'gn-new-15-door', themeId: 'rock-ghost', tint: TINT, mood: 'mountain weather station', start: 'opened' },
];
