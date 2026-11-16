// Catalog Overhaul Pack, legends: Legendary questlines L2 to L8 (QUESTLINES_LEGENDARY.md). Pack questlines: status `extra`.
// Each is the Trial of its Legendary's blessing (LEGENDARY_BLESSINGS.md): with that blessing at Recognition (Influence 7+) the Legendary
// may offer itself instead of a battle. Every Legendary fight here is a pseudo fight: losing puts you back on the map. Same-run memory only.
import { ch, ev, fight, flag, flagIs, fr, heal, item, leadIs, leave, out, ptype, room, statusLead, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { gift, sign } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Legendary';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 80): Json => ({ kind: 'moment', text, importance });
const cap = (s: string) => s.split('-').map((w) => `${w[0]!.toUpperCase()}${w.slice(1)}`).join('-');
const not = (key: string): Json => flagIs(key, 0, 0);
const typeAbsent = (type: string): Json => ({ kind: 'partyType', type, absent: true });
const fainted = (within = 30): Json => ({ kind: 'memberFainted', within });
/** A Legendary fight: a pseudo fight (a loss puts you back on the map). */
const legend = (species: string | string[], o: { lv?: number; win?: Json[]; lose?: Json[]; rule?: Json; format?: 'doubles' } = {}): Json => ({
  ...wild({ species: Array.isArray(species) ? species : [species], lv: o.lv ?? 3, win: o.win ?? [], ...(o.format ? { format: o.format } : {}) }),
  pseudo: true,
  lose: o.lose ?? [],
  ...(o.rule ? { rule: o.rule } : {}),
});
/** With its blessing at Recognition, the Legendary offers itself (no battle). */
const recognition = (species: string, text: string, ...extra: Json[]): Json => ({
  id: 'recognition',
  when: [flagIs(`blessing-${species}`), flagIs('blessing-influence', 7)],
  notice: `${cap(species)} knows you. It does not want a battle.`,
  addChoices: [ch(`Hold out your hand to ${cap(species)}.`, out(text, gift(species), flag(`${species}-offered`), ...extra))],
});

// ---------------------------------------------------------------- L2. The Three Birds Trial
const BIRDS = [
  { id: 'articuno', colour: 'ice-blue', blessing: 'The Still Wing' },
  { id: 'zapdos', colour: 'yellow', blessing: 'The Thundercloud' },
  { id: 'moltres', colour: 'red', blessing: 'The Spring Fire' },
] as const;
const passed = (bird: string): Json[] => [flag(`birds-trial-${bird}`), flag('birds-passed'), item('pretty-feather'), sign(bird, 2), room(`co-l2-land-${bird}`)];
const failed = (bird: string): Json[] => [flag(`birds-failed-${bird}`)];
const cliff = (n: number): Json =>
  ev(`co-l2-cliff-${n}`, n === 1 ? 'The Three Birds Trial' : 'The Three Birds Trial: The Crests Again', G, {
    rarity: 'rare', ...(n > 1 ? { callback: true, requires: [flagIs('birds-seen'), flagIs('birds-passed', 0, 1)] } : {}), cast: ['trainer.hiker'], tint: '#e0c080',
    remembers: BIRDS.map((b) => ({ id: `hint-${b.id}`, when: [flagIs(`blessing-${b.id}`)], notice: `You carry ${b.blessing}. The ${b.colour} crest burns a little brighter for you: it will give you a hint.` })),
  },
    n === 1
      ? 'At dusk, three crests light up on a far cliff: ice-blue, yellow, red.\n\nOld Guide: "They were never three birds. They were three answers to the same question."\nOld Guide: "What do you do when the weather turns on you?"\nOld Guide: "One of them will ask you that. Just one. The other two will be jealous."'
      : 'The cliff again. The crests you have not answered are still lit. The Old Guide is sitting where you left him.',
    [
      ...BIRDS.map((b) => ch(`"The ${b.colour} one."`, out(`You climb toward the ${b.colour} crest.`, flag('birds-seen'), room(`co-l2-${b.id}-1`)), { requires: [not(`birds-trial-${b.id}`), not(`birds-failed-${b.id}`)] })),
      ch('Not tonight.', leave('Old Guide: "They\'ll still be there."')),
    ]);
const articuno: Json[] = [
  ev('co-l2-articuno-1', 'The Three Birds Trial: Frozen Sky', G, { ...R, pokemon: 'articuno', tint: '#c0e0f0', effect: 'snow' },
    'Snow falls from a clear summer sky.\n\nArticuno\'s cry, as a line on the screen: Stand still.\nSurvive six turns of the blizzard without a damaging move. Status moves and switching are allowed.',
    [
      ch('Stand still.', fight('The blizzard comes down on you.', legend('articuno', { rule: { surviveTurns: 6, noAttacks: true }, win: passed('articuno'), lose: failed('articuno') }))),
      ch('Go back down.', out('It lets you down the mountain unharmed. The ice-blue crest goes dark.', ...failed('articuno'))),
    ]),
];
const slope = (n: number): Json =>
  ev(`co-l2-zapdos-${n}`, `The Three Birds Trial: Thunder Roost ${n}`, G, { ...R, pokemon: 'zapdos', tint: '#e0e060', effect: 'rain' },
    n === 1 ? 'Lightning strikes one hill forty times a night.\n\nA storm chaser on the slope: "It wants whoever gets to the top during the storm. Not after. During."\nKeep a Ground-type in front. Four stretches to the top.' : `Stretch ${n} of the climb. The air tastes of metal.`,
    [ch('Climb on.', out('The bolt hits your lead. Strike.', statusLead('paralysis'), flag('zapdos-strikes'), ...(n < 4 ? [room(`co-l2-zapdos-${n + 1}`)] : [room('co-l2-zapdos-top')])), {
      branches: [{ when: [leadIs('ground')], text: 'The lightning hits the ground beside you, not you. Your Ground-type in front drinks it up.', effects: [...(n < 4 ? [room(`co-l2-zapdos-${n + 1}`)] : [room('co-l2-zapdos-top')])] }],
    })]);
const zapdos: Json[] = [
  slope(1), slope(2), slope(3), slope(4),
  ev('co-l2-zapdos-top', 'The Three Birds Trial: The Top', G, { ...R, pokemon: 'zapdos', tint: '#f0f080', effect: 'rain' },
    'The top of the hill, in the storm. Zapdos turns to see who arrived.',
    [ch('Stand up straight.', out('It looks at you a long time, and lands.', ...passed('zapdos')), {
      branches: [{ when: [flagIs('zapdos-strikes', 3)], text: 'You arrive half-paralysed and late. It flies off without looking twice. The yellow crest goes dark.', effects: failed('zapdos') }],
    })]),
];
const ember = (n: number): Json =>
  ev(`co-l2-moltres-${n}`, `The Three Birds Trial: Ember Peak ${n}`, G, { ...R, pokemon: 'moltres', tint: '#e08040', effect: 'fire' },
    n === 1 ? 'Carry an ember from the base of the volcano to the rim.\n\nA pilgrim at the base, handing you a clay bowl: "Don\'t let it go out. It\'s the only thing it\'ll accept."' : `Stretch ${n}. The wind comes round the mountain.`,
    [ch('Shield the bowl.', out('The ember holds.', ...(n < 4 ? [room(`co-l2-moltres-${n + 1}`)] : [room('co-l2-moltres-rim')])), {
      chance: 0.75,
      fail: out('The wind takes the flame down to a red spark.', flag('moltres-gusts'), ...(n < 4 ? [room(`co-l2-moltres-${n + 1}`)] : [room('co-l2-moltres-rim')])),
    })]);
const moltres: Json[] = [
  ember(1), ember(2), ember(3), ember(4),
  ev('co-l2-moltres-rim', 'The Three Birds Trial: The Rim', G, { ...R, pokemon: 'moltres', tint: '#f09050', effect: 'fire' },
    'The rim of the volcano. You hold out the bowl.',
    [ch('Offer the ember.', out('It is still burning. Moltres lands.', ...passed('moltres')), {
      branches: [
        { when: [flagIs('moltres-gusts', 2)], text: 'It is ash. Moltres flies off. The red crest goes dark.', effects: failed('moltres') },
        { when: [flagIs('moltres-gusts', 1), typeAbsent('fire')], text: 'It went out on the way up and nobody could relight it. Moltres flies off. The red crest goes dark.', effects: failed('moltres') },
        { when: [flagIs('moltres-gusts', 1)], text: 'It went out once, and your Fire-type lit it again. It is still burning. Moltres lands.', effects: passed('moltres') },
      ],
    })]),
];
const land = (bird: string): Json =>
  ev(`co-l2-land-${bird}`, `The Three Birds Trial: ${cap(bird)} Lands`, G, { ...R, pokemon: bird, tint: '#f0e0c0', remembers: [recognition(bird, `${cap(bird)} lowers its head and lets you touch its feathers. It comes with you.`)] },
    `${cap(bird)} lands in front of you. It offers a battle.`,
    [
      ch('Battle it.', fight(`${cap(bird)} rises.`, legend(bird, { win: [flag(`${bird}-beaten`)] }))),
      ch('Bow.', out('It bows back, and flies.', fr(1))),
    ]);
const jealous = (bird: string): Json =>
  ev(`co-l2-jealous-${bird}`, `The Three Birds Trial: The Jealous One`, G, { callback: true, rarity: 'rare', requires: [flagIs('birds-passed', 2), not(`birds-trial-${bird}`), not('birds-jealous')], pokemon: bird, tint: '#f0a080' },
    `${cap(bird)} arrives uninvited, furious. It did not ask you anything, and you answered the other two.`,
    [ch('Stand your ground.', fight('It attacks at once.', legend(bird, { lv: 5, win: [flag('birds-jealous-beaten'), moment('The three birds were seen flying together over the next region.', 85)] }), flag('birds-jealous')))]);
const l2: Json[] = [cliff(1), cliff(2), cliff(3), ...articuno, ...zapdos, ...moltres, ...BIRDS.map((b) => land(b.id)), ...BIRDS.map((b) => jealous(b.id))];

// ---------------------------------------------------------------- L3. Ho-Oh and the Rainbow Feather
const place = (n: number, title: string, text: string, help: string, after: string, ...cost: Json[]): Json =>
  ev(`co-l3-place-${n}`, `Ho-Oh and the Rainbow Feather: ${title}`, G, { callback: true, rarity: 'rare', requires: [flagIs('hooh-feather')], cast: [n === 3 ? 'trainer.fairy_tale_girl' : 'trainer.youngster_m'], tint: '#c08040' }, text, [
    ch(help, out(after, flag('hooh-helped'), flag(`hooh-helped-${n}`), ...cost)),
    ch('Walk on.', leave('You walk on. Behind you, the footprint stays burnt into the ground.')),
  ]);
const l3: Json[] = [
  ev('co-l3-feather', 'Ho-Oh and the Rainbow Feather', G, { rarity: 'rare', cast: ['trainer.youngster_m'], pokemon: 'ho-oh', tint: '#f0c060', effect: 'sparkle' },
    'A feather falls from a clear sky. It is every colour at once, and warm.\n\nA child, pointing: "That\'s Ho-Oh\'s. My grandad said it drops one on whoever it\'s watching."\nThe child: "He also said it only lands for people who go back."\nYour lead looks up at the sky for a long moment.',
    [
      ch('Keep the feather.', out('You keep it in your bag. Three burnt footprints lead away across the region, each somewhere something was lost.', flag('hooh-feather'), item('rainbow-wing'), sign('ho-oh'))),
      ch('Leave it for the child.', out('The child holds it up to the sun. When you look back, there is a second feather at your feet.', flag('hooh-feather'), item('rainbow-wing'), sign('ho-oh'), fr(1))),
    ]),
  place(1, 'The Burned House', 'A burnt footprint leads to a burned house.\n\nA woman: "We got everyone out. Except the Growlithe. It went back in for the kits."', 'Help rebuild.', 'You carry beams until dark. On the step, someone has left a bowl of water, and a Growlithe-sized space beside it.', takeNode(1)),
  place(2, 'The Grave', 'A burnt footprint leads to a grave on a hill.\n\nA boy: "I don\'t know how to say goodbye to it."', 'Sit with him.', 'You sit with him. Neither of you says anything for a long time. Then he says goodbye, and it is enough.'),
  place(3, 'The Closed Centre', 'A burnt footprint leads to a Pokémon Centre with its shutters half down.\n\nThe nurse, packing: "No one comes this way any more."', 'Spread the word.', 'It costs you a node of walking, town to town, telling people. By the time you are done, the shutters are up again.', takeNode(1)),
  ev('co-l3-tower', 'Ho-Oh and the Rainbow Feather: The Bell Tower', G, {
    callback: true, rarity: 'rare', requires: [flagIs('hooh-feather'), not('hooh-ended')], pokemon: 'ho-oh', tint: '#f0b040', effect: 'sparkle',
    remembers: [recognition('ho-oh', 'Ho-Oh lands in front of you, not on the roof. It lets you put your hand on its neck. It comes.')],
  },
    'The Bell Tower.',
    [
      ch('Climb to the bells.', out('The bells do not ring. The feather in your bag goes grey.', flag('hooh-ended')), {
        branches: [
          { when: [flagIs('hooh-helped', 3)], text: 'With all three helped, the bells ring by themselves. Ho-Oh lands on the roof. It does not look at you. It looks at your party.\nBehind you, something stands up: nothing you lost is there, so Ho-Oh simply waits.', effects: [flag('hooh-ended'), room('co-l3-roof')] },
          { when: [flagIs('hooh-helped', 1)], text: 'A bell rings, once. Ho-Oh circles the tower and flies on.', effects: [flag('hooh-ended'), sign('ho-oh')] },
        ],
      }),
    ]),
  ev('co-l3-roof', 'Ho-Oh and the Rainbow Feather: On the Roof', G, { ...R, pokemon: 'ho-oh', tint: '#f8c850', effect: 'sparkle' },
    'Ho-Oh waits on the roof of the Bell Tower, burning gently.',
    [
      ch('Battle it.', fight('It rises into the sky and turns.', legend('ho-oh', { lv: 4, win: [flag('hooh-beaten')] }))),
      ch('Thank it.', out('You thank it. It bows its head and leaves a pinch of ash glowing in the gutter: Sacred Ash.', item('sacred-ash'), flag('hooh-thanked'), moment('Ho-Oh landed on the Bell Tower for you, and you thanked it.', 85))),
    ]),
];

// ---------------------------------------------------------------- L4. Lugia Under the Whirl (a pseudo stage: ps_lugia_whirl)
const ISLE_BIRD = ['articuno', 'zapdos', 'moltres'] as const;
const island = (n: 1 | 2 | 3): Json => {
  const bird = ISLE_BIRD[n - 1]!;
  const fragment = [flag('lugia-fragments'), room(n < 3 ? `co-l4-island-${n + 1}` : 'co-l4-island-4')];
  return ev(`co-l4-island-${n}`, `Lugia Under the Whirl: Island ${n}`, G, {
    ...R, pokemon: 'lugia', tint: '#6090c0', effect: 'rain',
    remembers: [{ id: 'still', when: [flagIs('birds-trial-articuno'), flagIs('birds-trial-zapdos'), flagIs('birds-trial-moltres')], intro: `Island ${n}. There is no whirlpool. The sea is silent, and the song fragment is simply lying on the rocks.`, hide: [0, 1, 2], addChoices: [ch('Pick up the fragment.', out('A few words of an old song, scratched into a shell.', ...fragment))] }],
  },
    `Island ${n}. A whirlpool turns between you and the fragment of the song.`,
    [
      ch('Fight through.', fight('Something rises out of the whirl.', legend(['sharpedo', 'tentacruel', 'lanturn'], { lv: 1, win: fragment }))),
      ch('Wait for slack water.', out('You lose a node waiting. Then the whirlpool slows, and you row across.', takeNode(1), ...fragment)),
      ch('Ask the birds.', out(`You call to ${cap(bird)}. Far off, a cry. The whirlpool stops.`, ...fragment), { requires: [flagIs(`birds-trial-${bird}`)] }),
    ]);
};
const lugiaFight = (win: Json[] = [], rule?: Json): Json => legend('lugia', { lv: 5, win: [item('silver-wing'), flag('lugia-beaten'), ...win], ...(rule ? { rule } : {}) });
const l4: Json[] = [
  ev('co-l4-whirl', 'Lugia Under the Whirl', G, { rarity: 'rare', cast: ['trainer.fisherman'], pokemon: 'lugia', tint: '#4070a0', effect: 'rain' },
    'A whirlpool swallows a fishing boat in a calm sea. The fisherman is spat out onto the rocks. A silver feather floats where the boat went down.\n\nFisherman, coughing: "It put me back. It took the boat and it put me back."\nFisherman: "There\'s a song the old women used to sing at the fourth island. Nobody goes there now. I can\'t remember the words."\nFisherman: "I remember three bits of it. Each one on a different island."',
    [
      ch('Row out to the islands.', out('Four islands on the horizon. Three whirlpools turning.', flag('lugia-started'), room('co-l4-island-1'))),
      ch('Help him home.', leave('You help him up the beach. The whirlpools keep turning.')),
    ]),
  island(1), island(2), island(3),
  ev('co-l4-island-4', 'Lugia Under the Whirl: The Fourth Island', G, { ...R, pokemon: 'lugia', tint: '#c0d0e0', remembers: [recognition('lugia', 'Lugia rises with the island under it, and lowers its head to you. It does not want a battle. It offers itself.', item('silver-wing'))] },
    'Island 4 is empty and quiet. Your Pokémon sing the three fragments in order. The sea goes flat.\nSomething very large rises under the island, and the island rises with it.\n\nLugia, as a subtitle to its cry: Who taught you that?',
    [
      ch('"The fisherman."', fight('Lugia carries you to the fisherman\'s village and sets you down. Then it offers a battle.', lugiaFight(), flag('lugia-honest'))),
      ch('"Nobody. I found it."', fight('Lugia battles at once, testing you.', lugiaFight(), flag('honest-lied'))),
      ch('"Your islands did."', fight('Lugia lowers its head. The sea stays calm for the battle.', lugiaFight(), flag('lugia-honest'))),
    ]),
];

// ---------------------------------------------------------------- L5. The Lab at the End of the Cave (Mewtwo; pseudo stage ps_mewtwo_lab)
const honest = (): Json => flag('mewtwo-honest');
const l5: Json[] = [
  ev('co-l5-cave', 'The Lab at the End of the Cave', G, { rarity: 'rare', pokemon: 'mewtwo', tint: '#504060', effect: 'flicker' },
    'A cave the locals do not enter. A hum under it. As you step in, a voice inside your head:\n\nMewtwo: "Do not come in."\n\nA note pinned to the wall, in a scientist\'s hand: "Day 1. It is beautiful. It opened its eyes and looked at me."\nMewtwo: "You read that. Now answer me. What are you for?"',
    [
      ch('"I don\'t know yet."', out('Mewtwo: "...Honest. Come down."', honest(), flag('mewtwo-started'), room('co-l5-hall'))),
      ch('"To be the best."', out('Mewtwo: "We will see." The hum deepens.', flag('mewtwo-started'), room('co-l5-hall')), { branches: [{ when: [{ kind: 'rivalBeaten' }], text: 'Mewtwo: "You have beaten people who wanted it more. That is true, at least."', effects: [honest(), flag('mewtwo-started'), room('co-l5-hall')] }] }),
      ch('"To look after them."', out('Mewtwo: "Is that so." It looks at your party, one by one.', honest(), flag('mewtwo-started'), room('co-l5-hall')), { branches: [{ when: [fainted(18)], text: 'Mewtwo: "One of them fell, not long ago, in your care. Try again on the way down."', effects: [flag('mewtwo-started'), room('co-l5-hall')] }] }),
      ch('Turn back.', leave('The hum follows you out, and stops at the cave mouth.')),
    ]),
  ev('co-l5-hall', 'The Lab at the End of the Cave: The Flooded Hall', G, { ...R, pokemon: 'mewtwo', tint: '#405060', effect: 'flicker' },
    'The flooded hall. A note on a floating clipboard: "Day 40. It asked me why. I did not have an answer it would accept."\n\nMewtwo: "And them? What are your Pokémon for?"',
    [
      ch('"Winning."', out('Mewtwo: "Then they are like me."', room('co-l5-lab'))),
      ch('"They\'re my friends."', out('Mewtwo is quiet a long time.', honest(), room('co-l5-lab'))),
      ch('"Ask them."', out('Mewtwo asks them. You do not hear what they say. It does.', honest(), room('co-l5-lab'))),
    ]),
  ev('co-l5-lab', 'The Lab at the End of the Cave: The Lab', G, { ...R, pokemon: 'mewtwo', tint: '#302838', effect: 'flicker' },
    'The lab. The last note: "Day 41." It is blank except for a handprint in something dark.\n\nMewtwo: "Last question. If someone made you, without asking, for something you did not choose: would you forgive them?"',
    [
      ch('"Yes."', out('Mewtwo: "Easily said."', room('co-l5-tanks'))),
      ch('"No."', out('Mewtwo: "Easily said."', room('co-l5-tanks'))),
      ch('"I\'d want to know why first."', out('Mewtwo: "So would I."', honest(), room('co-l5-tanks'))),
    ]),
  ev('co-l5-tanks', 'The Lab at the End of the Cave: The Tanks', G, { ...R, pokemon: 'mewtwo', tint: '#201828', effect: 'shake' },
    'Mewtwo, among broken tanks.',
    [ch('Face it.', fight('Mewtwo: "Everyone who has come here has lied to me." It battles at full strength.', legend('mewtwo', { lv: 6, win: [flag('mewtwo-beaten')] }), flag('mewtwo-answered')), {
      branches: [
        { when: [flagIs('mewtwo-honest', 3)], text: 'Mewtwo: "You did not lie to me. That is rare."', effects: [flag('mewtwo-answered'), room('co-l5-rare')] },
        { when: [flagIs('mewtwo-honest', 1)], text: 'Mewtwo: "Some of that was true." It battles to see what you are.', effects: [flag('mewtwo-answered')] },
      ],
    })]),
  ev('co-l5-rare', 'The Lab at the End of the Cave: Rare', G, { ...R, pokemon: 'mewtwo', tint: '#403050' },
    'Mewtwo waits. For once, it is asking.',
    [
      ch('"Battle me."', fight('Mewtwo: "Then show me."', legend('mewtwo', { lv: 4, win: [flag('mewtwo-beaten')] }))),
      ch('"Leave me in peace."', out('Mewtwo: "...Thank you." It is gone. Later, during the Champion battle, you will see it on a cliff, watching.', flag('mewtwo-peace'), moment('You left Mewtwo in peace. It had never been told the truth before.', 90))),
    ]),
];

// ---------------------------------------------------------------- L6. The Sky and the Sea (Kyogre, Groudon, Rayquaza)
const titanCalm = (species: 'kyogre' | 'groudon', need: number): Json =>
  ch(`Calm ${cap(species)}.`, fight(`You stand in the flood and the steam and try to reach ${cap(species)}.`, { ...legend(species, { lv: 4, win: [flag(`${species}-beaten`)] }), rule: { calmBar: { need, start: 0, perTurn: 0, likes: ['sound'] } }, calm: [gift(species), flag(`${species}-calmed`), flag('weather-calmed'), moment(`You calmed ${cap(species)}.`, 85)] }), { requires: [not(`weather-orb-${species === 'kyogre' ? 'aqua' : 'magma'}`)] });
const base = (team: 'aqua' | 'magma'): Json => {
  const leader = team === 'aqua' ? 'Archie' : 'Maxie';
  const why = team === 'aqua' ? '"The sea made everything. It\'s owed. You\'ve seen what the land does to it."' : '"People are crammed onto the coasts. More land is room to live. Room. It\'s that simple."';
  return ev(`co-l6-${team}`, `The Sky and the Sea: ${leader}'s Base`, G, { callback: true, rarity: 'rare', requires: [flagIs('weather-started'), not(`weather-done-${team}`)], cast: [], tint: team === 'aqua' ? '#204070' : '#702020' },
    `${leader}'s base. The Orb glows in a case in the middle of the room.`,
    [
      ch('"Take their Orb."', fight('Grunts everywhere.', { ...trainer(`Team ${cap(team)} Grunts`, { size: 3, types: team === 'aqua' ? ['water', 'dark'] : ['fire', 'ground'], win: [flag(`weather-orb-${team}`), item(team === 'aqua' ? 'blue-orb' : 'red-orb')] }), evil: 'grunt' }, flag(`weather-done-${team}`))),
      ch('"Listen to them."', out(`${leader}: ${why} He is partly right. Nothing changes.`, flag(`weather-heard-${team}`), flag(`weather-done-${team}`))),
      ch('"Report them."', out('Officer Jenny raids the base. The Orb is moved, not taken.', flag(`weather-done-${team}`))),
    ]);
};
const l6: Json[] = [
  ev('co-l6-towns', 'The Sky and the Sea', G, { rarity: 'rare', cast: [], pokemon: 'kyogre', tint: '#406080', effect: 'rain' },
    'Two towns, one road apart. In one the sea is in the streets. In the other the wells are steaming.\n\nArchie, on the harbour wall, delighted: "Look at it! It\'s coming back! The sea\'s coming back where it belongs!"\nMaxie, two towns over, mopping his brow: "More land. Room for everyone. You do see that? Room."\nA meteorologist, to nobody: "They\'re both going to kill everyone."',
    [
      ch('Find out where their Orbs are.', out('Each team holds an Orb. Each team has a base. The meteorologist gives you both addresses.', flag('weather-started'), sign('weather'))),
      ch('Stay out of it.', leave('The sea keeps rising in one town, and the wells keep steaming in the other.')),
    ]),
  base('aqua'), base('magma'),
  ev('co-l6-pillar', 'The Sky and the Sea: The Sky Pillar', G, { callback: true, rarity: 'rare', requires: [flagIs('weather-started'), not('pillar-tried')], pokemon: 'rayquaza', tint: '#40a060' },
    'The Sky Pillar: five crumbling floors.',
    [
      ch('Climb.', out('You climb all five floors. At the top, the green dragon is asleep, coiled round the pillar three times.\nThe meteorologist, who followed: "If you wake it, it won\'t take a side. That\'s the point of it."', flag('pillar-tried'), flag('pillar-climbed'), sign('rayquaza', 2)), { chance: 0.55, fail: out('A floor gives way. You land hard, two floors down, and climb back out.', flag('pillar-tried'), hurtParty()) }),
      ch('Climb, with a Flying-type to catch you.', out('A floor gives way and your Flying-type catches you. You try again. At the top, the green dragon is asleep, coiled round the pillar three times.', flag('pillar-tried'), flag('pillar-climbed'), sign('rayquaza', 2)), { requires: [ptype('flying')], chance: 0.9, fail: out('Even with wings under you, it is too far. You come down.', flag('pillar-tried')) }),
      ch('Leave it.', leave()),
    ]),
  ev('co-l6-finale', 'The Sky and the Sea: The Titans', G, {
    callback: true, rarity: 'rare', requires: [flagIs('weather-done-aqua'), flagIs('weather-done-magma'), not('weather-ended')], pokemon: 'groudon', tint: '#806040', effect: 'shake',
    remembers: [{ id: 'leaders', when: [flagIs('weather-heard-aqua'), flagIs('weather-heard-magma')], notice: 'You call both leaders onto the field.\nArchie: "...That\'s my town under there."\nMaxie: "And mine."\nThey stop. The titans are easier to calm.', hide: [0, 1], addChoices: [titanCalm('kyogre', 3), titanCalm('groudon', 3)] }],
  },
    'Both titans wake (or one, if an Orb was taken). The arena floods and dries in turns.',
    [
      titanCalm('kyogre', 6),
      titanCalm('groudon', 6),
      ch('Wake Rayquaza.', fight('Rayquaza comes down out of the sky, and the fight stops. Then it turns to you.', legend('rayquaza', { lv: 6, win: [flag('rayquaza-beaten')] }), flag('weather-ended')), { requires: [flagIs('pillar-climbed')] }),
    ]),
];
function hurtParty(): Json { return { kind: 'damage', share: 0.15 }; }

// ---------------------------------------------------------------- L7. The Eon Siblings (Latias, Latios)
const bridge = (n: number): Json =>
  ev(`co-l7-bridge-${n}`, `The Eon Siblings: Bridge ${n}`, G, { ...R, cast: ['trainer.psychic_m'], pokemon: 'latias', tint: '#a0a0e0' },
    `Bridge ${n}. The collectors' machine operators are on it, scanning the canal.`,
    [
      ch('Fight them.', fight('They turn the machine on you.', trainer('Collectors', { size: 2, types: ['steel', 'electric'], win: [room(n < 3 ? `co-l7-bridge-${n + 1}` : 'co-l7-garden')] }))),
      ch('Draw them off.', out('You run. They chase you. The girl gets through.', hurtParty(), room(n < 3 ? `co-l7-bridge-${n + 1}` : 'co-l7-garden'))),
      ch('Break the machine\'s lens.', out('One hard hit and the lens cracks across.', flag('eon-lenses'), room(n < 3 ? `co-l7-bridge-${n + 1}` : 'co-l7-garden')), { requires: [{ kind: 'partyMoveType', type: n === 2 ? 'rock' : 'steel' }] }),
    ]);
const eonPick = [
  ch('Catch Latias.', fight('She comes down to meet you, playful.', legend('latias', { lv: 3 }))),
  ch('Catch Latios.', fight('He comes down to meet you, serious.', legend('latios', { lv: 3 }))),
];
const l7: Json[] = [
  ev('co-l7-shimmer', 'The Eon Siblings', G, { rarity: 'rare', cast: ['trainer.fairy_tale_girl'], pokemon: 'latias', tint: '#c0a0e0' },
    'A shimmer crosses the sky. Something flies low over you and waits, a little ahead, as if to be followed.\n\nIn the canal city, a girl at a fruit stall, who is also, you notice, sitting on a bench across the canal: "You followed. Good."\nThe girl: "There are people here with a machine that sees through things. They\'ll find the garden."\nThe girl: "My brother says not to trust you. I\'m not very good at listening to him."',
    [
      ch('Follow her.', out('She leads you into the canals.', flag('eon-started'), sign('eon'), room('co-l7-bridge-1'))),
      ch('Leave the city.', leave('The shimmer follows you to the edge of town, then turns back.')),
    ]),
  bridge(1), bridge(2), bridge(3),
  ev('co-l7-garden', 'The Eon Siblings: The Garden', G, {
    ...R, cast: ['trainer.fairy_tale_girl'], pokemon: 'latios', tint: '#8080d0', effect: 'rain',
    remembers: [
      { id: 'lenses', when: [flagIs('eon-lenses', 3)], intro: 'The collectors never find the garden at all. There is no overload. The siblings come down together and thank you.', hide: [0, 1], addChoices: eonPick },
      { id: 'blue-mind', when: [flagIs('blessing-eon')], notice: 'You carry The Blue Mind. The jewel at the garden\'s heart answers you.', addChoices: [ch('Use the jewel.', out('The Rite is spent. The water stops. Both live.', flag('eon-both-lived'), room('co-l7-after')))] },
    ],
  },
    'The collectors\' machine overloads. The canals start to rise.\n\nLatios, appearing beside his sister, a subtitle under his cry: Get her out.\nLatias: No.',
    [
      ch('Help Latios hold it.', fight('Six turns holding back the water with him.', legend(['gyarados', 'sharpedo', 'kingdra'], { lv: 2, rule: { surviveTurns: 6 }, win: [flag('eon-both-lived'), room('co-l7-after')], lose: [flag('eon-latios-gone'), room('co-l7-gone')] }))),
      ch('Get Latias out.', out('You pull her out of the garden. Latios gives everything to hold the water back. When it is over, there is a new jewel at the garden\'s heart.', flag('eon-latios-gone'), room('co-l7-gone'))),
    ]),
  ev('co-l7-after', 'The Eon Siblings: Both', G, { ...R, pokemon: 'latias', tint: '#c0c0f0' },
    'Both siblings follow you out of the city. One of them could come with you. The other will visit.',
    eonPick.concat([ch('Let them both go home.', out('They circle you once and go home together. The girl gives you a ticket stamped with a sea you have never seen: the Eon Ticket.', item('eon-ticket'), fr(2)))])),
  ev('co-l7-gone', 'The Eon Siblings: The Jewel', G, { ...R, cast: ['trainer.fairy_tale_girl'], pokemon: 'latias', tint: '#606090' },
    'Latias stays in the city. She sits on a bench by the canal, a girl alone. She gives you a ticket stamped with a sea you have never seen.',
    [ch('Take it.', out('The Eon Ticket.', item('eon-ticket'), moment('Latios became the canal city\'s jewel. Latias stayed behind.', 85)))]),
];

// ---------------------------------------------------------------- L8. The Sealed Braille Door (the Regis)
type Door = { regi: string; words: string; act: string; did: string; needs?: Json[] };
const DOORS: Door[] = [
  { regi: 'regirock', words: 'Bring the one who is last, and wait.', act: 'Put your lowest-level Pokémon in front, and wait.', did: 'You put the smallest one in front and wait, one long breath. The door grinds open.' },
  { regi: 'regice', words: 'Be silent in the cold.', act: 'Stand silent in the ice chamber.', did: 'Two turns of nothing but your own breath freezing. The door grinds open.' },
  { regi: 'registeel', words: 'Carry what does not rust.', act: 'Send your Steel-type in, holding nothing.', did: 'Your Steel-type walks in with empty hands. The door grinds open.', needs: [ptype('steel')] },
  { regi: 'regieleki', words: 'Run without stopping.', act: 'Cross the chamber\'s three nodes without a rest.', did: 'Three nodes at a run. At the end, the door is open.' },
  { regi: 'regidrago', words: 'Bring what is unfinished.', act: 'Bring a Pokémon that can still evolve.', did: 'It sniffs the young one in front of you, and the door grinds open.' },
];
const door = (d: Door): Json =>
  ev(`co-l8-${d.regi}`, `The Sealed Braille Door: ${cap(d.regi)}`, G, { rarity: 'rare', cast: ['trainer.hiker'], pokemon: d.regi, tint: '#807060' },
    `A door covered in raised dots, in a cliff. An old man is sitting beside it, eating.\n\nOld man: "It's writing. For people who can't see. My mother taught me."\nOld man, running his fingers along it: "It says: '${d.words}'"\nOld man: "I've been trying to work out what it means for forty years. I think it wants patience. I haven't got any."`,
    [
      ch('Do as it says.', out(`${d.did} ${cap(d.regi)} is inside, asleep on its feet. It wakes, and follows you out. The keystone in the wall comes loose in your hand.`, gift(d.regi), flag('regi-keystones'), flag(`regi-${d.regi}`), sign('regi'), ...(d.regi === 'regieleki' ? [takeNode(3)] : [])), { ...(d.needs ? { requires: d.needs } : {}) }),
      ch('Force it.', fight(`The door bursts. ${cap(d.regi)} comes out at full anger.`, legend(d.regi, { lv: 5, win: [flag('regi-keystones'), flag('regi-forced')] }))),
      ch('Leave it for him.', out('He tries. He fails. He is glad to have been left to.', fr(1))),
    ]);
const l8: Json[] = [
  ...DOORS.map(door),
  ev('co-l8-meadow', 'The Sealed Braille Door: The Meadow', G, {
    callback: true, rarity: 'rare', requires: [flagIs('regi-keystones', 4), not('regigigas-done')], cast: ['trainer.hiker'], pokemon: 'regigigas', tint: '#90a070',
    remembers: [{ id: 'forced', when: [flagIs('regi-forced')], notice: 'The one you forced will not lie down beside it.', hide: [2] }],
  },
    'With four keystones, a quiet meadow. Regigigas asleep among the four.\n\nThe old man, who has come along, out of breath: "That\'s the one who made them. It towed the land here with ropes."\nRegigigas does not wake.',
    [
      ch('Wake it.', fight('It wakes slowly, at half strength for the first turns, and battles.', legend('regigigas', { lv: 5, win: [flag('regigigas-beaten')] }), flag('regigigas-done'))),
      ch('Let it sleep.', out('The Regis lie down beside it. The meadow is warm and quiet. You rest there.', heal(1), flag('regigigas-done'), flag('regigigas-sleeps')), { branches: [{ when: [flagIs('blessing-regigigas')], text: 'The Regis lie down beside it. Regigigas opens one eye at you, and closes it. You carry The Colossus: its Rite is stronger now.', effects: [heal(1), flag('regigigas-done'), flag('regigigas-sleeps'), flag('colossus-rite')] }] }),
      ch('Ask the others.', out('The Regis you brought step forward. Regigigas wakes, and does not battle. It offers to come.', gift('regigigas'), flag('regigigas-done'), moment('Regigigas woke in the meadow and came with you.', 90)), { requires: [flagIs('regi-keystones', 4)] }),
    ]),
];

export const EVENTS: Json[] = [...l2, ...l3, ...l4, ...l5, ...l6, ...l7, ...l8];
export const REMOVE: string[] = [];
