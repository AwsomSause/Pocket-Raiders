// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md SF99 The Original Legendaries' Stages.
// Equinar, the Hollow Shepherd, Brinecrown, Veinheart, Lumeria and Verdelis have no blessing or promise: their stage is an encounter.
// "[Name] stirs, and its stage is open for a short time." Three rooms (drawn as a pseudo-stage), then the creature:
// "Approach." (a wild battle at normal catch odds) / "Watch from a distance." / "Leave it in peace."
// Their old expeditions (legendaryEvents.json) carry `replacedBy`, so only this encounter is placed.
import { $, ch, ev, ferry, flag, heal, item, out, reveal, rest, rp, scout, type Json } from '../dsl.ts';
import { leaveP, moment, no } from './_delve.ts';

export const CATEGORY = 'places';

const go = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const back = (name: string): Json => ch('Turn back.', out(`You keep what you carry and walk back the way you came. Behind you, ${name} goes on stirring without you.`, leaveP));

interface Legend {
  slug: string; species: string; name: string; title: string; types: string[]; tint: string;
  open: string; enter: string; rooms: [string, string, string]; creature: string;
  approach: string; watch: string; watchFx: Json[]; leave: string; leaveFx?: Json[];
}

const LEGENDS: Legend[] = [
  {
    slug: 'equinar', species: 'equinar', name: 'Equinar', title: 'Waking Dream', types: ['psychic', 'fairy'], tint: '#7a3a8a',
    open: 'Wild horses stand in a ring in a misty field, every one of them asleep on its feet, breathing slow together like one great animal. An old herder leans on the gate with her eyes half-closed, as if she is dreaming too. "They dream together when it\'s near," she says. "Equinar stirs, and its stage is open for a short time. Go quiet."',
    enter: 'You climb the gate. The mist closes behind you like a curtain.',
    rooms: [
      'The mist is thick and warm. You walk past sleeping horses whose eyes move under their lids. One of them whinnies softly, dreaming, and every horse in the field twitches with it.',
      'You find a dream lying on the grass: a pony, small and young, running and running across a field that is not there. Your team stops to watch it. It runs until it is gone.',
      'The ring of horses tightens. In the middle there is a space just the size of something very large. The air there shimmers like heat, and smells of hay and rain.',
    ],
    creature: 'It is there. Equinar stands in the ring as if it was always there and you only now saw it, pale as the mist, its mane drifting like smoke. It looks at you, and the whole herd breathes in.',
    approach: 'You step into the ring. Equinar lowers its head, not in anger, in welcome: a test, the oldest one.',
    watch: 'You stay at the edge of the ring. Equinar walks through the herd, touching each sleeping horse with its nose, and each one wakes, calm, and lifts its head. When it passes your team they lean toward it, and something settles in them, a trust that was not quite there before.',
    watchFx: [{ kind: 'friendship', bond: 1, who: 'party' }],
    leave: 'You back away to the gate. The mist lifts behind you, and in the wet grass by the gatepost there is a single white hair, long as your arm, that shines.',
  },
  {
    slug: 'hollow-shepherd', species: 'hollow-shepherd', name: 'the Hollow Shepherd', title: 'Haunted Hour', types: ['ice', 'ghost'], tint: '#3a2a50',
    open: 'Dusk comes, and does not end. The light stays the colour of a bruise for an hour, then longer. On a hill a flock of Mareep lie down all at once, as if told to. A shepherd girl with a crook too tall for her stands very still among them. "It counts them," she whispers. "Every night. Don\'t stand in the flock. The Hollow Shepherd stirs, and its stage is open for a short time."',
    enter: 'You step off the road, careful to keep to the edge of the flock.',
    rooms: [
      'The grass is cold, colder than the evening. Somewhere a bell is ringing, very slowly, the way a bell rings when nobody is pulling the rope.',
      'You pass a fence where someone has carved a tally, hundreds of marks, years of them. The newest mark is still pale. Your team presses close behind your legs.',
      'The flock lies in a perfect circle on the hilltop. Every Mareep has its eyes open. None of them are afraid. They are waiting to be counted, and so, you realise, are you.',
    ],
    creature: 'It comes up the hill without walking: a tall, thin shape with a lantern for a face and a crook of frost, moving from Mareep to Mareep, touching each one, counting. It reaches the edge of the flock, and it turns its lantern toward you.',
    approach: 'You step into the flock. The Hollow Shepherd stops counting. The bell stops ringing. In the silence it raises its crook.',
    watch: 'You stand very still. It counts the flock, and then, slowly, it counts your party too, one by one, touching each with the cold crook. It nods, as if the number is right. Your fallen ones feel lighter, as if somebody is keeping them safe until you can rest.',
    watchFx: [rest()],
    leave: 'You walk away without looking back. Dawn comes up all at once behind you, and the whole flock stands up, shaking dew off their wool, as if nothing at all had happened.',
  },
  {
    slug: 'brinecrown', species: 'brinecrown', name: 'Brinecrown', title: 'Rising Tide', types: ['water', 'flying'], tint: '#1d4f9c',
    open: 'The sea is rising with no wind at all, flat and silver, creeping up the beach. On the rocks someone has left a ring of crowns made of salt, white and glittering. A fisher is pulling his boat up past them, quick and quiet. "It\'s coming in to look at us," he says. "Brinecrown stirs, and its stage is open for a short time. I\'m not stopping."',
    enter: 'You walk out along the rocks while the water climbs.',
    rooms: [
      'The rocks are slick and the sea laps at your boots, warm as a bath. Little fish have come up into the pools to watch, as if something is about to happen.',
      'A Wingull lands beside you and does not fly off. It looks out to sea, and so do you. Far out, the water is moving in a slow circle, wider than a town.',
      'The tide reaches the ring of salt crowns and stops, exactly there, as if it knows. The circle out at sea is coming in. Your water-types are shaking with excitement.',
    ],
    creature: 'Brinecrown rises out of the circle like a ship surfacing: vast, blue-white, its head crowned in a ring of salt that drips and reforms. It looks along the shore, at the fisher\'s boat, at the crowns, and then at you.',
    approach: 'You step down into the water. Brinecrown sees you come, and the whole sea lifts to meet it.',
    watch: 'You sit on the rocks and do not move. Brinecrown circles once, close enough that the spray soaks you, and then it sinks away. The sea goes calm behind it, so calm the fisher shouts and pushes his boat back out, and offers to take you across for nothing.',
    watchFx: [ferry(), flag('sea-calm')],
    leave: 'You climb back up the beach. The tide goes out after you, slowly, and takes the salt crowns with it, one by one.',
  },
  {
    slug: 'veinheart', species: 'veinheart', name: 'Veinheart', title: 'Stone Hall', types: ['rock', 'steel'], tint: '#7a6a5a',
    open: 'A cave mouth in the hillside, and inside, a sound like a drum, slow and deep. You feel it in your teeth before you hear it. An old miner sits at the entrance with his helmet in his lap. "The hills have a pulse," he says. "That\'s it, that is. Veinheart stirs, and its stage is open for a short time. I\'ve heard it once before, when I was a boy."',
    enter: 'You duck under the lintel. The beating gets louder.',
    rooms: [
      'The tunnel walls are warm. Every few seconds the rock under your hand gives a soft thump, like a heart under a shirt. Your rock-types lay their heads against it and close their eyes.',
      'You pass old tools left behind in a side passage: picks, a lamp, a child\'s shoe. Someone carved a name over them. It has been worn almost smooth by a hundred years of hands touching it.',
      'The tunnel opens into a hall so big your lamp does not reach the roof. The beating is everywhere now. A seam of ore runs through the walls in every direction, like veins, and they are all pulsing in time.',
    ],
    creature: 'In the middle of the hall the rock stands up. Veinheart is shaped like the hill itself: stone and iron, a great heart of ore glowing in its chest, beating. It turns toward your lamp.',
    approach: 'You walk out into the hall. Veinheart\'s heart beats faster. The whole hill beats with it.',
    watch: 'You set your lamp down and wait. Veinheart shows itself, slowly, letting you see. The seam in the wall nearest you glows bright, and a chunk of it falls free at your feet: a stone as hard as the hill, and a ball of iron, still warm.',
    watchFx: [item('hard-stone'), item('iron-ball')],
    leave: 'You turn and walk back toward the daylight. Behind you the beating slows, and slows, until the hill is quiet, and at peace.',
  },
  {
    slug: 'lumeria', species: 'lumeria', name: 'Lumeria', title: 'Hive Mind', types: ['bug', 'fairy'], tint: '#5a8a2a',
    open: 'Bug Pokémon are gathering in a glade at dusk: Volbeat, Illumise, Ledyba, more than you can count, glowing faintly and moving as one, the way a flock of birds moves. They turn together, and the glow ripples. Lumeria stirs, and its stage is open for a short time.',
    enter: 'You step into the glade. The swarm parts around you, politely.',
    rooms: [
      'The glow follows you between the trees, always just ahead, as if leading you. When you stop, it stops. When you go on, it goes on.',
      'You find a fallen log covered in sleeping Bug Pokémon, all glowing in time with each other, slow and steady, like breathing. Your bug-types settle beside them and start to glow too.',
      'The swarm is thicker here, a cloud of light. Then, all at once, every glow goes out. In the dark you can hear wings, thousands of them, holding perfectly still in the air.',
    ],
    creature: 'Lumeria lights up in the middle of the dark: small and bright and very old, with wings like stained glass. Every Bug in the glade lights up with it, at once, and the whole forest is day.',
    approach: 'You step toward it. The swarm draws back into a great ring of light around you both, like a stadium.',
    watch: 'You stand at the edge of the light and watch. Lumeria hums, and the swarm streams out of the glade ahead of you, lighting every path and every hidden turn of the stage ahead, so that you can see where everything is.',
    watchFx: [reveal(), scout(3)],
    leave: 'You step back out of the glade. The glow fades behind you, one light at a time, until it is just a dark wood again, and very quiet.',
  },
  {
    slug: 'verdelis', species: 'verdelis', name: 'Verdelis', title: 'Overgrowth', types: ['grass', 'bug'], tint: '#2f7a2f',
    open: 'A town whose walls have been overgrown overnight. Flowers push up through the paving. Vines hang from the shop signs. People stand in the street in their nightclothes, staring. A shopkeeper is trying to open her door through a curtain of ivy. "It\'s beautiful," she says. "It\'s also my shop." Verdelis stirs, and its stage is open for a short time.',
    enter: 'You follow the trail of flowers into the green.',
    rooms: [
      'The flowers grow as you watch, opening as you pass, closing behind you. Your grass-types walk with their faces turned up to them, the way they turn to the sun.',
      'In a back garden an old man is crying, very quietly, over a tree that has burst into blossom. "My wife planted that," he tells you. "It never flowered. Not once in forty years."',
      'The square is a forest now. The fountain is a pond. A fawn of vines and flowers is drinking from it, and it looks up at you with bright, curious eyes.',
    ],
    creature: 'Verdelis steps out from behind the fountain: delicate, green and gold, with petals for a mane and a trail of new grass wherever it treads. The whole town holds its breath.',
    approach: 'You step forward into the square. Verdelis tilts its head, interested, and the grass at your feet grows tall and wild.',
    watch: 'You watch from the edge of the square. Verdelis walks to the very middle, and plants one tree there, with care, pressing the earth down with its hooves. Then it walks out of the town gate, and the vines go with it.',
    watchFx: [rp(3), heal(0.3)],
    leave: 'You turn to go. As you pass the shop, the vines pull back from the shopkeeper\'s door, politely, all by themselves. She laughs out loud.',
    leaveFx: [$(100)],
  },
];

const legendEvents = (l: Legend): Json[] => {
  const id = `legend-${l.slug}`;
  const r = (n: number) => `${id}-${n}`;
  const fin = `${id}-final`;
  const done = flag(`${id}-met`);
  const roomEvent = (n: number, intro: string): Json =>
    ev(r(n), `${l.title}`, 'Legendary Stages', { stop: 'event', rarity: 'rare', types: l.types, minStage: 1, room: true, tint: l.tint }, intro, [
      ch('Go on.', go(n < 3 ? r(n + 1) : fin, n < 3 ? 'You go on, deeper in.' : 'You take one more step, and then you see it.', rp(1))),
      ch('Rest a moment.', go(n < 3 ? r(n + 1) : fin, 'You sit for a moment and let your team catch their breath. Nothing hurries you here. Then you go on.', heal(0.15))),
      back(l.name),
    ]);
  return [
    ev(id, `${l.name.replace(/^the /, 'The ')}: ${l.title}`, 'Legendary Stages', { stop: 'event', rarity: 'epic', types: l.types, minStage: 4, requires: [no(`${id}-met`)], tint: l.tint, pokemon: l.species }, l.open, [
      ch('Go in.', go(r(1), l.enter)),
      ch('Not now.', out(`You leave it. ${l.name.replace(/^the /, 'The ')} goes on stirring, somewhere behind you, for a little while longer.`)),
    ]),
    roomEvent(1, l.rooms[0]),
    roomEvent(2, l.rooms[1]),
    roomEvent(3, l.rooms[2]),
    ev(fin, `${l.name.replace(/^the /, 'The ')}`, 'Legendary Stages', { stop: 'event', rarity: 'rare', types: l.types, minStage: 1, room: true, tint: l.tint, pokemon: l.species }, l.creature, [
      ch('Approach.', { text: l.approach, effects: [done], battle: { kind: 'wild', pseudo: true, species: [l.species], types: [], levelBonus: 3, shinyMultiplier: 1, win: [moment(`You faced ${l.name} in its own stage.`, 80), leaveP] } }),
      ch('Watch from a distance.', out(l.watch, ...l.watchFx, done, moment(`You watched ${l.name} from a distance, and it let you.`, 70), leaveP)),
      ch('Leave it in peace.', out(l.leave, ...(l.leaveFx ?? []), done, leaveP)),
    ]),
  ];
};

export const EVENTS: Json[] = LEGENDS.flatMap(legendEvents);
export const REMOVE: string[] = [];
/** The pseudo chains these stages are drawn as (src/data/catalogOverhaul/pseudo/places.json). */
export const LEGEND_CHAINS = LEGENDS.map((l) => ({ id: `ps_legend_${l.slug.replace(/-/g, '_')}`, name: `${l.name.replace(/^the /, 'The ')}: ${l.title}`, entry: `legend-${l.slug}`, themeId: l.types.join('-'), tint: l.tint, mood: l.title.toLowerCase(), start: 'opened' }));
