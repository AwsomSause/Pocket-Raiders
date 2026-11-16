// Greenneedle, part 10: gn.42 The Battle Frontier, gn.43 The Pokémon Auction (doc GREENNEEDLE_REWORKED_PLACED_9.md).
// Build: npm run co:build -- greenneedle-10   then   npm run co:gn
import { $, br, ch, fight, flag, heal, hurt, item, join, money, out, trainer, type Json } from '../dsl.ts';
import { rep } from './_ne.ts';
import { chIf, exactly, gev, gn, is, kindness, moment, not, notThisRegion, pick, rm, roll, say, scene, setTo, stampRegion, teach, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.42  THE BATTLE FRONTIER  (Hub Destination at a Town node; until towns exist, step 12, optional; once per region, from the second region).
// Seven buildings, seven Frontier Brains, and a rank (core/greenneedle/frontier.ts). Each building can be taken on once per visit; its run
// ends at its Brain. Every Frontier fight is friendly: a loss ends the building's run, never the player's. The Brains remember the last ace
// you brought (within the run) and bring the answer to it; at Gold they hold items; at Platinum they have prepared for you anyway.
// =====================================================================================================================
const FRONTIER_TINT = '#2e3b55';
const hall = (o: Json = {}): Json => ({ tint: FRONTIER_TINT, tags: ['Combat', 'Trainer', 'Story'], effect: 'none', ...o });
const once = (key: string): Json => notThisRegion(key);
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const PLAZA = 'gn-42-plaza';
const toPlaza = (label = 'Back to the fountain.'): Json => ch(label, out('Back out into the plaza. The fountain. The crest. Somebody cheering in a building you can\'t see.', scene(PLAZA)));
const NUM = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

type B = 'tower' | 'factory' | 'arena' | 'pike' | 'dome' | 'palace' | 'pyramid';
interface Brain { title: string; name: string; cls: string; team: string[]; move: string; symbol: string; building: string }
const BRAIN: Record<B, Brain> = {
  tower: { title: 'Lady', name: 'Imara', cls: 'ace-trainer', team: ['gardevoir', 'metagross', 'milotic', 'lucario', 'salamence', 'dragonite'], move: 'drain-punch', symbol: 'the Tower Symbol, a silver spire', building: 'The Battle Tower' },
  factory: { title: 'Foreman', name: 'Kestrin Adebayo', cls: 'veteran', team: ['kangaskhan', 'lapras', 'tauros', 'miltank', 'snorlax', 'dragonite'], move: 'trick', symbol: 'the Factory Symbol, a brass cog', building: 'The Battle Factory' },
  arena: { title: 'Judge', name: 'Theodora Ansah', cls: 'black-belt', team: ['hitmontop', 'medicham', 'breloom', 'heracross', 'gallade', 'machamp'], move: 'focus-punch', symbol: 'the Arena Symbol, a bronze scale', building: 'The Battle Arena' },
  pike: { title: 'Pike Queen', name: 'Lucasta Ferro', cls: 'aroma-lady', team: ['seviper', 'shuckle', 'dusclops', 'milotic', 'togekiss', 'gengar'], move: 'metronome', symbol: 'the Pike Symbol, a coiled serpent', building: 'The Battle Pike' },
  dome: { title: 'Dome Ace', name: 'Rafferty Blaise', cls: 'ace-trainer', team: ['ninjask', 'swampert', 'scizor', 'aerodactyl', 'salamence', 'garchomp'], move: 'encore', symbol: 'the Dome Symbol, a gilded laurel', building: 'The Battle Dome' },
  palace: { title: 'Palace Elder', name: 'Master Hōzan', cls: 'veteran', team: ['hariyama', 'crobat', 'slowking', 'umbreon', 'espeon', 'alakazam'], move: 'calm-mind', symbol: 'the Palace Symbol, a jade lantern', building: 'The Battle Palace' },
  pyramid: { title: 'Pyramid King', name: 'Thurstan', cls: 'hiker', team: ['sandslash', 'claydol', 'golurk', 'hippowdon', 'flygon', 'excadrill'], move: 'stealth-rock', symbol: 'the Pyramid Symbol, a stone eye', building: 'The Battle Pyramid' },
};
/** What a building's run leaves behind when it ends, won or lost: the team, the bench, the bag. */
const CLEANUP: Record<B, Json[]> = { tower: [], factory: [gn('unstash')], arena: [], pike: [], dome: [gn('unbench')], palace: [], pyramid: [gn('bagBack')] };
const RULE: Partial<Record<B, Json>> = { arena: { gn: 'arena', surviveTurns: 3 }, palace: { gn: 'palace' } };
const BRAIN_RULE = (b: B): Json => ({ gn: `brain-${b}`, ...(b === 'arena' ? { surviveTurns: 3 } : {}) });
const ended = (b: B): Json[] => [...CLEANUP[b], scene(PLAZA)];
const retire = (b: B): Json => ch('Retire.', out('You tell the attendant you\'re done. They write it down without judgement. There\'s a column for it.', ...ended(b)));

/** One building fight: three Pokémon at the stage's level; friendly (a loss ends the building's run). */
const bout = (b: B, i: number, foe: string, cls: string, intro: string, text: string, win: Json[], o: { team?: string[]; types?: string[] } = {}): Json =>
  rm(`gn-42-${b}-${i}`, `${BRAIN[b].building}: Battle ${i}`, hall(), intro, [
    ch('Battle.', fight(text, { ...trainer(foe, { cls, size: 3, lv: 0, friendly: true, ...(o.team ? { team: o.team } : {}), ...(o.types ? { types: o.types } : {}), ...(RULE[b] ? { rule: RULE[b] } : {}), win, lose: ended(b) }) })),
    retire(b),
  ]);
const cleared = (b: B, ...then: Json[]): Json[] => [gn('frontierClear', { key: b, n: 10 }), ...then, scene(`gn-42-${b}-brain`)];

/** The Brain: four ranks of team (3 at A+0, 4 at A+1, 5 at A+1 with held items, 6 at A+2), and what they remember of last time. */
const RANKS: { lo: number; hi: number; size: number; lv: number }[] = [{ lo: 0, hi: 1, size: 3, lv: 0 }, { lo: 2, hi: 2, size: 4, lv: 1 }, { lo: 3, hi: 3, size: 5, lv: 1 }, { lo: 4, hi: 99, size: 6, lv: 2 }];
function brainRoom(b: B, intro: string, text: string, remembers: Json[] = []): Json {
  const br0 = BRAIN[b];
  const who = `${br0.title} ${br0.name}`;
  const win: Json[] = [
    gn('brainRecord', { key: b, n: 1 }), ...CLEANUP[b],
    when(`frontier-symbol-${b}`, { min: 0, max: 0 }, [flag('frontier-symbols')], `${who} hands you ${br0.symbol}. It's heavier than it looks.`),
    setTo(`frontier-symbol-${b}`, 1), teach(br0.move),
    moment(`You beat ${who}, Frontier Brain of ${br0.building}.`, 65), scene(PLAZA),
  ];
  const lose: Json[] = [gn('brainRecord', { key: b, n: 2 }), ...CLEANUP[b], scene(PLAZA)];
  return rm(`gn-42-${b}-brain`, `${br0.building}: ${who}`, hall({ remembers }), intro, RANKS.map((r) => chIf([is('frontier-rank', r.lo, r.hi)], 'Battle.', fight(text, {
    ...trainer(`Frontier Brain ${br0.name}`, { cls: br0.cls, size: r.size, lv: r.lv, team: br0.team.slice(0, r.size), friendly: true, rule: BRAIN_RULE(b), win, lose }),
  }), { branches: [
    br([exactly(`brain-${b}-won`, 1)], say(`**${br0.name}:** "I've thought about you every day since. Unhealthily."`, text)),
    br([exactly(`brain-${b}-won`, 2)], say(`**${br0.name}:** "Back. Good."`, text)),
  ] })));
}

/** A building's front room: the rule, read out; "Take the challenge." starts its run (once per visit). */
const entrance = (b: B, intro: string, start: Json[], o: Json = {}, extra: Json[] = []): Json => rm(`gn-42-${b}`, BRAIN[b].building, hall(o), intro, [
  ch('Take the challenge.', out('You sign the book. The attendant blots it, carefully, as if it matters. Here, it does.', stampRegion(`frontier-done-${b}`), ...start)),
  ...extra,
  toPlaza('Not today.'),
]);
const enter = (b: B, label: string): Json => chIf([once(`frontier-done-${b}`)], label, out(`Through the doors of ${BRAIN[b].building}.`, scene(`gn-42-${b}`)));

// ---------- The Tower: seven in a row, a quarter healed between; Lady Imara counts them aloud. ----------
const TOWER_FOES: [string, string, string][] = [
  ['Ace Trainer Odile', 'ace-trainer', 'A young trainer in a pressed jacket. Her hands are shaking. She tells you it\'s the cold.'],
  ['Veteran Bastien', 'veteran', 'An old man who has climbed this tower every year for forty years. He nods to you like a colleague.'],
  ['Black Belt Oyelaran', 'black-belt', 'He bows. He holds the bow a second too long, to see if you will too.'],
  ['Psychic Wren', 'psychic', 'She tells you how this battle ends before it starts. She is wrong about the weather, so maybe.'],
  ['Hiker Bram', 'hiker', 'He took the stairs. All of them. He is still breathing hard, and very proud.'],
  ['Ace Trainer Sunniva', 'ace-trainer', 'She has a notebook with your name in it already. Your last two battles, in pencil.'],
  ['Veteran Ilse', 'veteran', 'The last one before the top. She says nothing at all, and her Pokémon don\'t either.'],
];
const tower: Json[] = [
  entrance('tower', say(
    'A white tower, taller than it should be. Seven battles in a row, and a quarter of your strength back between each.',
    '**Lady Imara**, from the gallery, in white gloves: "I count every win aloud. It is the only thing I do aloud."',
  ), [scene('gn-42-tower-1')]),
  ...TOWER_FOES.map(([foe, cls, line], k) => bout('tower', k + 1, foe, cls, say(`Floor ${k + 1}. ${line}`, k === 0 ? '**Lady Imara:** "Begin."' : `**Lady Imara**, from the gallery: "${NUM[k - 1]}."`),
    'The lift doors close behind you.', k < 6 ? [heal(0.25), scene(`gn-42-tower-${k + 2}`)] : cleared('tower', heal(1)))),
  brainRoom('tower', say(
    '**Lady Imara:** "Seven." She comes down the gallery stairs, without hurrying. "I counted every one. Now I am the eighth."',
    'She heals your team herself, first. Properly. She does not want to win against a tired one.',
  ), 'She takes off one glove, finger by finger, and lays it on the rail.', [
    { id: 'answer', when: [is('brain-tower-met'), gnc('aceHere', { key: 'tower' })], notice: '**Lady Imara:** "Seven, last time. You brought the {cast:brain-ace-tower}. I\'ve brought something for the {cast:brain-ace-tower}."' },
    { id: 'foolish', when: [is('brain-tower-met')], notice: '**Lady Imara:** "...Oh. No {cast:brain-ace-tower}. Well. Now I feel foolish. It\'s a very good answer to a {cast:brain-ace-tower}. You\'ll have to imagine it."' },
  ]),
];

// ---------- The Factory: rentals only. Pick three of six (the Foreman has named them all); after each win, swap one for the loser's. ----------
const RACKS: { sp: string; name: string }[][] = [
  [{ sp: 'arcanine', name: 'Biscuit' }, { sp: 'lapras', name: 'Old Moira' }, { sp: 'gengar', name: 'Tuesday' }, { sp: 'scizor', name: 'Pliers' }, { sp: 'gardevoir', name: 'Duchess' }, { sp: 'swampert', name: 'Mudge' }],
  [{ sp: 'jolteon', name: 'Static Pete' }, { sp: 'snorlax', name: 'Cushion' }, { sp: 'salamence', name: 'Ember' }, { sp: 'starmie', name: 'Twinkle' }, { sp: 'machamp', name: 'Four Hands' }, { sp: 'breloom', name: 'Mossy' }],
  [{ sp: 'espeon', name: 'Saffron' }, { sp: 'tyranitar', name: 'Pebble' }, { sp: 'milotic', name: 'Ribbon' }, { sp: 'heracross', name: 'Sir Horn' }, { sp: 'magnezone', name: 'Hum' }, { sp: 'venusaur', name: 'Grandad' }],
];
const FACTORY_FOES: { foe: string; cls: string; team: string[]; line: string }[] = [
  { foe: 'Ace Trainer Jory', cls: 'ace-trainer', team: ['raichu', 'sandslash', 'cloyster'], line: 'Rentals too. He keeps apologising to his.' },
  { foe: 'Veteran Agathe', cls: 'veteran', team: ['ninetales', 'golem', 'pelipper'], line: 'She checks every rental\'s teeth, like a horse. They don\'t mind.' },
  { foe: 'Psychic Lior', cls: 'psychic', team: ['electabuzz', 'rhydon', 'exeggutor'], line: 'He tries to read his rentals\' minds. They are thinking about lunch.' },
  { foe: 'Hiker Tamsin', cls: 'hiker', team: ['magmar', 'quagsire', 'skarmory'], line: 'She picked by weight. The heaviest three. "It\'s a system," she says.' },
  { foe: 'Black Belt Kenji', cls: 'black-belt', team: ['kingdra', 'houndoom', 'ursaring'], line: 'He bows to each rental before he sends it out. They bow back, a little confused.' },
  { foe: 'Ace Trainer Fenna', cls: 'ace-trainer', team: ['chansey', 'donphan', 'crobat'], line: 'She has rented the same three, she says, eleven times. They know her.' },
  { foe: 'Veteran Hollis', cls: 'veteran', team: ['aggron', 'flygon', 'ludicolo'], line: 'The last before the Foreman. He wipes his rentals\' faces with a handkerchief first.' },
];
const rack = (k: number, half: 1 | 2): Json => {
  const id = `gn-42-factory-rack-${k}-${half}`;
  const other = `gn-42-factory-rack-${k}-${half === 1 ? 2 : 1}`;
  return rm(id, `The Factory: The Rack (${half === 1 ? 'left' : 'right'})`, hall({ pokemon: RACKS[k - 1]![half === 1 ? 0 : 3]!.sp }), say(
    '**Foreman Kestrin Adebayo**, wiping his hands on a rag: "Three of these. Be kind to them. They\'ve been out a lot this week."',
  ), [
    ...RACKS[k - 1]!.slice(half === 1 ? 0 : 3, half === 1 ? 3 : 6).map((r) => chIf([once(`factory-rented-${r.sp}`)], `${r.name}, the ${r.sp[0]!.toUpperCase()}${r.sp.slice(1)}.`, out(
      `"${r.name}," says the Foreman, and pats it twice. "Good choice. Bring it back in one piece."`,
      gn('rent', { key: r.sp }), stampRegion(`factory-rented-${r.sp}`), flag('factory-rented'),
      when('factory-rented', { min: 3 }, [scene('gn-42-factory-1')], 'Three. He writes their names on a card and tucks it in your pocket.'),
      when('factory-rented', { max: 2 }, [scene(id)]),
    ))),
    ch(half === 1 ? 'See the other three.' : 'Back to the first three.', out('Along the rack. They watch you go past.', scene(other))),
  ]);
};
const swap = (i: number): Json => {
  const theirs = FACTORY_FOES[i - 1]!.team[2]!;
  const name = `${theirs[0]!.toUpperCase()}${theirs.slice(1)}`;
  const next = scene(`gn-42-factory-${i + 1}`);
  return rm(`gn-42-factory-swap-${i}`, 'The Factory: The Swap', hall({ pokemon: theirs }), say(
    `The attendant holds out the loser's ${name} on a lead. "Swap one? It's the rules. Well. It's allowed."`,
  ), [
    ch(`Trade one of yours for their ${name}.`, out('The attendant takes yours back to the rack.', gn('swapIn', { key: theirs }), next), { pick: {} }),
    ch('Keep your three.', out('You keep them. The one you nearly gave back leans on your leg.', next)),
  ]);
};
const factory: Json[] = [
  entrance('factory', say(
    'A warehouse with a rack of Pokémon along one wall, each with a name tag. Rentals only. Pick three of six. After each win, you may swap one for the loser\'s.',
    '**Foreman Kestrin Adebayo:** "Your own team waits in the back room. They\'ll get tea. These ones are mine. Well. Everyone\'s."',
  ), [gn('stash'), setTo('factory-rented', 0), pick('factory-rack', 1, 1, 1), ...[1, 2, 3].map((k) => when('factory-rack', { min: k, max: k }, [scene(`gn-42-factory-rack-${k}-1`)]))], {
    remembers: [{ id: 'swapped', when: [is('x-rival-swapped-teams')], notice: '**The Foreman** has heard. "You swapped teams with your rival. You\'ve handled other people\'s Pokémon. You\'ll be fine here."' }],
  }),
  ...[1, 2, 3].flatMap((k) => [rack(k, 1), rack(k, 2)]),
  ...FACTORY_FOES.map((f, k) => bout('factory', k + 1, f.foe, f.cls, say(`Battle ${k + 1} of seven. ${f.line}`), 'The rentals step up. Yours look back at you, once, to check.',
    k < 6 ? [scene(`gn-42-factory-swap-${k + 1}`)] : cleared('factory'), { team: f.team })),
  ...[1, 2, 3, 4, 5, 6].map(swap),
  brainRoom('factory', say(
    'The Foreman takes his three from the very end of the rack. He introduces each one, by name, by age, by its favourite food.',
    '**Foreman Kestrin Adebayo:** "I love these more than my own. Don\'t tell my own."',
  ), 'He takes his cap off for the battle. He says it\'s out of respect for the rentals.'),
];

// ---------- The Arena: three turns, then the judges decide. Judge Theodora gives marks out of ten for everything. ----------
const ARENA_FOES: [string, string, string][] = [
  ['Black Belt Ikaika', 'black-belt', 'He shouts every move he makes. The judges mark him down for it.'],
  ['Ace Trainer Marisol', 'ace-trainer', 'She has studied the scoring. She aims to hit often, not hard.'],
  ['Veteran Chidi', 'veteran', 'He has lost here nine times, on points. He is sure the tenth is his.'],
  ['Hiker Gustav', 'hiker', 'He doesn\'t know about the judges. He finds out at the third turn.'],
  ['Psychic Aiyana', 'psychic', 'She misses on purpose to look humble. The judges have seen it before.'],
  ['Black Belt Rui', 'black-belt', 'His Pokémon never miss. He has never won on damage.'],
  ['Ace Trainer Delphine', 'ace-trainer', 'The last before the Judge. She shakes your hand, firmly. Eight, for the handshake.'],
];
const arena: Json[] = [
  entrance('arena', say(
    'A square ring, three judges\' chairs, and a scoreboard. Three turns, then the judges decide, on damage dealt, hits landed, and accuracy.',
    '**Judge Theodora Ansah**, quietly: "Welcome. Six, for the entrance. You can do better."',
  ), [scene('gn-42-arena-1')], {}, [
    ch('Bow.', out('**Judge Theodora:** "Seven. Your feet were wrong. Your eyes were right." She writes it down.', stampRegion('frontier-done-arena'), scene('gn-42-arena-1'))),
  ]),
  ...ARENA_FOES.map(([foe, cls, line], k) => bout('arena', k + 1, foe, cls, say(`Bout ${k + 1} of seven. ${line}`), 'Three turns. The judges lean forward.',
    k < 6 ? [scene(`gn-42-arena-${k + 2}`)] : cleared('arena'))),
  brainRoom('arena', say(
    'Judge Theodora steps down from the middle chair. Another judge takes it. She never raises her voice. She doesn\'t need to.',
    '**Judge Theodora Ansah:** "I will be marked too. That is only fair."',
  ), '"Three turns," she says. "Make them worth marking."', [
    { id: 'marks', when: [is('brain-arena-met'), is('brain-arena-marks')], notice: '**Judge Theodora:** "Last time, I gave you {flag:brain-arena-marks} out of thirty. I remember every mark. Show me where they went."' },
  ]),
];

// ---------- The Pike: seven rooms of three doors (one heals, one hurts, one holds a battle), and an attendant who is right two times in three. ----------
const DOOR = ['left', 'middle', 'right'];
const pikeNext = (i: number): Json[] => (i < 7 ? [scene(`gn-42-pike-${i + 1}`)] : cleared('pike', heal(1)));
/** The attendant's whisper: the healing door if she is telling the truth (two times in three), another if she isn't. */
const hints = (): Json[] => [1, 2, 3].flatMap((h) => [
  when('pike-heal', { min: h, max: h }, [when('pike-true', { min: 1 }, [], `"The ${DOOR[h - 1]} door," she whispers. "Smells of medicine."`), when('pike-true', { min: 0, max: 0 }, [], `"The ${DOOR[h % 3]} door," she whispers. "Smells of medicine."`)]),
]);
const pikeRooms = (i: number): Json[] => [
  rm(`gn-42-pike-${i}`, `The Pike: Room ${i}`, hall({ pokemon: 'seviper' }), say(
    `Room ${i} of seven. Three doors: left, middle, right. Behind one, rest. Behind one, a trap. Behind one, a trainer.`,
    'An attendant in a velvet waistcoat leans in. She is right two times in three. She doesn\'t say which times.',
  ), [
    ch('Ask the attendant.', out('She looks both ways first, theatrically.', pick('pike-heal', 1, 1, 1), roll('pike-true', 67), ...hints(), scene(`gn-42-pike-${i}-doors`))),
    ch('Choose without asking.', out('She looks a little hurt.', pick('pike-heal', 1, 1, 1), scene(`gn-42-pike-${i}-doors`))),
    retire('pike'),
  ]),
  rm(`gn-42-pike-${i}-doors`, `The Pike: Room ${i}, the Doors`, hall(), 'Three doors. Your hand is already on one of them.', DOOR.map((d, k) => {
    const n = k + 1;
    const battleAt = ((n + 1) % 3) + 1;
    const hurtAt = (n % 3) + 1;
    return ch(`The ${d} door.`, out(`You open the ${d} door.`,
      when('pike-heal', { min: n, max: n }, [heal(0.35), ...pikeNext(i)], 'Warm air, a bench, a bowl of fruit. Your team sits down at once.'),
      when('pike-heal', { min: battleAt, max: battleAt }, [scene(`gn-42-pike-${i}-fight`)], 'A trainer, waiting, who looks relieved it\'s finally someone.'),
      when('pike-heal', { min: hurtAt, max: hurtAt }, [hurt(0.15), ...pikeNext(i)], 'A hiss, a cloud of something. Somewhere above, the Pike Queen laughs, delighted.'),
    ));
  })),
  bout('pike', i, ['Ace Trainer Noor', 'Hiker Ludo', 'Psychic Ottilie', 'Veteran Aled', 'Black Belt Sione', 'Aroma Lady Fleur', 'Ace Trainer Caius'][i - 1]!, ['ace-trainer', 'hiker', 'psychic', 'veteran', 'black-belt', 'aroma-lady', 'ace-trainer'][i - 1]!,
    'They\'ve been in here a while. They have made the room quite homely.', 'You close the door behind you.', pikeNext(i)),
];
// The fight room has its own id (bout names it gn-42-pike-<i>); give it the -fight id the doors open.
const pike: Json[] = [
  entrance('pike', say(
    'A building shaped like a coiled serpent. Seven rooms. Each has three doors: one heals, one hurts, one holds a battle.',
    '**The Pike Queen, Lucasta Ferro**, lying across a chaise, not looking up: "Oh, good. Someone new to be unlucky."',
  ), [scene('gn-42-pike-1')]),
  ...[1, 2, 3, 4, 5, 6, 7].flatMap((i) => {
    const [room, doors, fightRoom] = pikeRooms(i) as [Json, Json, Json];
    return [room, doors, { ...fightRoom, id: `gn-42-pike-${i}-fight` }];
  }),
  brainRoom('pike', say(
    'The last door opens on the Pike Queen herself, who sits up, for the first time.',
    '**Lucasta Ferro:** "You came through. How boring. Let\'s see if your luck holds. Mine never does. I love it."',
  ), 'She flips a coin before the battle, and doesn\'t look at how it lands.'),
];

// ---------- The Dome: a bracket of three, then the Ace. You see the other team first, and choose which three of yours to bring. ----------
const DOME_FOES: { foe: string; cls: string; team: string[] }[] = [
  { foe: 'Ace Trainer Bellamy', cls: 'ace-trainer', team: ['jolteon', 'donphan', 'gyarados'] },
  { foe: 'Veteran Orla', cls: 'veteran', team: ['blastoise', 'exeggutor', 'magneton'] },
  { foe: 'Black Belt Teodor', cls: 'black-belt', team: ['machamp', 'hitmonlee', 'poliwrath'] },
];
const cap = (s: string): string => `${s[0]!.toUpperCase()}${s.slice(1)}`;
const domePick = (i: number, label: string, next: string): Json => rm(`gn-42-dome-${i}-pick`, `The Dome: ${label}, Your Three`, hall(), 'Choose who you bring, one at a time. Up to three. The rest wait on the bench and shout advice.', [
  ch('Bring this one.', out('You point. It steps forward.', gn('bring'), when('dome-picked', { min: 3 }, [gn('bench'), scene(next)], 'Three. The others go to the bench.'), when('dome-picked', { max: 2 }, [scene(`gn-42-dome-${i}-pick`)])), { pick: {} }),
  ch('That\'s enough.', out('The others go to the bench.', gn('bench'), scene(next)), { requires: [is('dome-picked')] }),
]);
const dome: Json[] = [
  entrance('dome', say(
    'A gold dome, a bracket on a board, and a crowd that is mostly one man. Three matches, then the Ace. You see the other team first, and bring three of your six.',
    '**Dome Ace Rafferty Blaise**, into a microphone, to nobody: "LADIES AND GENTLEMEN. And you. Mostly you."',
  ), [setTo('dome-picked', 0), scene('gn-42-dome-1')]),
  ...DOME_FOES.flatMap((f, k) => {
    const i = k + 1;
    return [
      rm(`gn-42-dome-${i}`, `The Dome: Match ${i}`, hall({ pokemon: f.team[0] }), say(
        `Match ${i}. On the big board, ${f.foe}'s team: ${f.team.map(cap).join(', ')}.`,
        '**Rafferty**, from the commentary box: "WHO WILL THEY BRING? I don\'t know! I do know. I\'m guessing."',
      ), [ch('Choose your three.', out('You look at the board, then at your team. They look at the board too.', scene(`gn-42-dome-${i}-pick`))), retire('dome')]),
      domePick(i, `Match ${i}`, `gn-42-dome-${i}-match`),
      { ...bout('dome', i, f.foe, f.cls, say(`Match ${i}, ${f.foe}. The crowd, which is Rafferty, goes wild.`), 'The bell.',
        i < 3 ? [gn('unbench'), scene(`gn-42-dome-${i + 1}`)] : [gn('unbench'), gn('frontierClear', { key: 'dome', n: 10 }), scene('gn-42-dome-4')], { team: f.team }), id: `gn-42-dome-${i}-match` },
    ];
  }),
  rm('gn-42-dome-4', 'The Dome: The Final', hall({ pokemon: 'garchomp' }), say(
    `The final. On the big board, the Dome Ace's team: ${BRAIN.dome.team.slice(0, 3).map(cap).join(', ')}, and whatever else he's hiding.`,
    '**Rafferty Blaise**, vaulting the commentary box: "AND NOW. ME."',
  ), [ch('Choose your three.', out('He winks at your team. They are not sure about him.', scene('gn-42-dome-4-pick'))), retire('dome')]),
  domePick(4, 'The Final', 'gn-42-dome-brain'),
  brainRoom('dome', say(
    'Rafferty takes a bow, to the empty seats, to you, to his own Pokémon, and to the empty seats again.',
    '**Dome Ace Rafferty Blaise:** "A showman needs an audience. Today it\'s you. Don\'t blink."',
  ), 'He throws his hat into the crowd. It lands on an empty seat. He seems satisfied.'),
];

// ---------- The Palace: your Pokémon choose their own moves, by nature. You choose who goes out, and when to switch. ----------
const PALACE_FOES: [string, string, string][] = [
  ['Psychic Hana', 'psychic', 'She sits with her eyes closed. Her Pokémon decide everything. They seem happy.'],
  ['Veteran Ansel', 'veteran', 'He tries to give an order and is gently shushed by an attendant.'],
  ['Black Belt Moana', 'black-belt', 'Her Machop does push-ups between turns. Nobody asked it to.'],
  ['Ace Trainer Yusuf', 'ace-trainer', 'He has trained his team to read the room. The room is very quiet.'],
  ['Aroma Lady Clem', 'aroma-lady', 'She lights incense. Her Pokémon nap. Yours don\'t know whether to.'],
  ['Hiker Ottar', 'hiker', 'He shrugs. "They know better than me anyway." It is not modesty.'],
  ['Veteran Seo-yeon', 'veteran', 'The last before the Elder. She bows to your Pokémon, not to you.'],
];
const palace: Json[] = [
  entrance('palace', say(
    'A low wooden hall, very quiet. Here your Pokémon choose their own moves, by their nature. You choose who goes out, and when to switch. Nothing else.',
    '**Palace Elder, Master Hōzan**, kneeling by a brazier: "Orders are rude. They have their own minds. See what they do with them."',
  ), [scene('gn-42-palace-1')]),
  ...PALACE_FOES.map(([foe, cls, line], k) => bout('palace', k + 1, foe, cls, say(`Bout ${k + 1} of seven. ${line}`), 'You open your mouth to give an order. You close it again.',
    k < 6 ? [scene(`gn-42-palace-${k + 2}`)] : cleared('palace'))),
  brainRoom('palace', say(
    'Master Hōzan stands, slowly. He hasn\'t given a Pokémon an order in thirty years. He isn\'t going to start now.',
    '**Master Hōzan:** "Your team has told me a great deal about you. Mostly good."',
  ), 'He sits back down. His Pokémon step forward without being asked.', [
    { id: 'initiative', when: [gnc('leadInitiative')], notice: 'Your lead walks out first, unasked. Master Hōzan bows to it. Not to you. "This one already knows," he says.' },
    { id: 'met', when: [is('brain-palace-met')], notice: '**Master Hōzan:** "Last time, yours hesitated on the third turn. It wanted to do something else. Did you ask it what?"' },
  ]),
];

// ---------- The Pyramid: the bag stays at the door. Seven dark floors; the light gets smaller on each; items found inside only. ----------
const LIGHT = ['seven steps', 'six steps', 'five steps', 'four steps', 'three steps', 'two steps', 'one step'];
const FIND = ['potion', 'super-potion', 'full-heal', 'revive', 'hyper-potion', 'ether', 'full-restore'];
const PYRAMID_FOES: [string, string][] = [['Hiker Abe', 'hiker'], ['Psychic Nell', 'psychic'], ['Black Belt Tarek', 'black-belt'], ['Veteran Gwen', 'veteran'], ['Ace Trainer Iker', 'ace-trainer'], ['Hiker Dunstan', 'hiker'], ['Ace Trainer Veda', 'ace-trainer']];
const floor = (i: number): Json[] => {
  const next = i < 7 ? [scene(`gn-42-pyramid-${i + 1}`)] : [gn('bagBack'), ...cleared('pyramid')];
  const stairs = (): Json => ch('Feel for the stairs.', fight('Something moves in the dark between you and the stairs. A trainer, lost, with a lantern even smaller than yours.', {
    ...trainer(PYRAMID_FOES[i - 1]![0], { cls: PYRAMID_FOES[i - 1]![1], size: 3, lv: 0, friendly: true, win: next, lose: ended('pyramid') }),
  }));
  return [
    rm(`gn-42-pyramid-${i}`, `The Pyramid: Floor ${i}`, hall({ tint: '#1a1712' }), say(`Floor ${i} of seven. Your light reaches ${LIGHT[i - 1]}. Past that, nothing. Somewhere, sand is falling.`), [
      stairs(),
      ch('Search the corners first.', out('You feel along the cold wall. Your fingers find something someone dropped.', item(FIND[i - 1]!), scene(`gn-42-pyramid-${i}-b`))),
      retire('pyramid'),
    ]),
    rm(`gn-42-pyramid-${i}-b`, `The Pyramid: Floor ${i}, the Corners`, hall({ tint: '#1a1712' }), 'The corners are empty now. Only the stairs left, somewhere.', [stairs(), retire('pyramid')]),
  ];
};
const pyramid: Json[] = [
  entrance('pyramid', say(
    'A sandstone pyramid in the middle of a modern plaza. Seven dark floors. Your bag stays at the door; you keep only what you find inside.',
    'A note pinned to the door: *Back soon. Or not. Thurstan.*',
  ), [gn('bagLeave'), scene('gn-42-pyramid-1')]),
  ...[1, 2, 3, 4, 5, 6, 7].flatMap(floor),
  brainRoom('pyramid', say(
    'At the top, sunlight. And Thurstan, the Pyramid King, arriving by the window, covered in dust from somewhere else entirely.',
    '**Thurstan:** "Sorry. Sorry. Desert. Long story. Is it my turn? It\'s my turn."',
  ), 'He shakes the sand out of his hat, and his Pokémon shake it out of their ears.'),
];

// ---------- The plaza, the shop, and the rooms upstairs. ----------
const SHOP_HELD: [string, string, number][] = [['choice-band', 'Choice Band', 24], ['choice-specs', 'Choice Specs', 24], ['choice-scarf', 'Choice Scarf', 24], ['life-orb', 'Life Orb', 30], ['focus-sash', 'Focus Sash', 16], ['assault-vest', 'Assault Vest', 20]];
const TUTORS: [string, string][] = [['ice-punch', 'Ice Punch'], ['fire-punch', 'Fire Punch'], ['thunder-punch', 'Thunder Punch']];
const buy = (room: string, [id, name, cost]: [string, string, number]): Json => ch(`${name}. ${cost} points.`, out(`Mr. Diallo wraps it in Frontier paper, with a ribbon. "${name}. Spend it well."`, flag('frontier-points', -cost), item(id), scene(room)), { requires: [is('frontier-points', cost)] });
const plaza: Json[] = [
  gev('gn-42-door', 'The Battle Frontier', hall({ stop: 'event', rarity: 'common', requires: [once('frontier-at')], remembers: [
    { id: 'rank', when: [is('frontier-cleared')], notice: '**Mr. Diallo** finds your name on the board without looking. "Back. Your rank\'s up there. The Brains have been asking."' },
  ] }), say(
    '*Seven buildings round a fountain, and over the gate a crest of crossed swords.*',
    '**Mr. Diallo**, the clerk, in a pressed jacket: "The Battle Frontier. Seven buildings. Seven Brains. Most people leave after one. Most people are sensible."',
  ), [
    ch('Go in.', out('Through the gate. The crest throws a cross-shaped shadow on you as you pass.', stampRegion('frontier-at'), flag('frontier-visits'), scene(PLAZA))),
    ch('Walk on.', out('"No shame," says Mr. Diallo, and means it.')),
  ]),
  rm(PLAZA, 'The Battle Frontier: The Plaza', hall({ pokemon: 'pikachu' }), say(
    'The plaza. The fountain. Seven buildings, and a board by the gate with every challenger\'s rank in chalk.',
  ), [
    ch('The Tower, the Factory and the Arena.', out('Along the north side.', scene('gn-42-wing-1'))),
    ch('The Pike, the Dome and the Palace.', out('Along the south side.', scene('gn-42-wing-2'))),
    ch('The Pyramid, the shop and the rooms upstairs.', out('Past the fountain.', scene('gn-42-wing-3'))),
    ch('Leave the Frontier.', out('Out through the gate. Mr. Diallo raises a hand. "Same time next region."', flag('frontier-left'))),
  ]),
  rm('gn-42-wing-1', 'The Frontier: The North Side', hall(), 'Three doors, and a lot of noise behind each.', [enter('tower', 'The Battle Tower.'), enter('factory', 'The Battle Factory.'), enter('arena', 'The Battle Arena.'), toPlaza()]),
  rm('gn-42-wing-2', 'The Frontier: The South Side', hall(), 'Three more. One of them is hissing.', [enter('pike', 'The Battle Pike.'), enter('dome', 'The Battle Dome.'), enter('palace', 'The Battle Palace.'), toPlaza()]),
  rm('gn-42-wing-3', 'The Frontier: Past the Fountain', hall(), 'The Pyramid, the shop, and a staircase to the rooms.', [
    enter('pyramid', 'The Battle Pyramid.'),
    ch('The Frontier shop.', out('A bell over the door. Mr. Diallo again. He works here too.', scene('gn-42-shop'))),
    chIf([is('frontier-symbols', 7)], 'The door with your name on it.', out('Up the stairs. At the end of the hall, a brass plate with your name.', scene('gn-42-room'))),
    toPlaza(),
  ]),
  rm('gn-42-shop', 'The Frontier Shop', hall({ tags: ['Shop', 'Story'] }), 'Frontier points only. Held items on the wall, a tutor in the corner reading a paper.', [
    ch('Held items.', out('The glass case.', scene('gn-42-shop-held'))),
    ch('More held items.', out('The other glass case.', scene('gn-42-shop-held-2'))),
    ch('The tutor.', out('The tutor folds his paper. "Points first."', scene('gn-42-shop-tutor'))),
    ch('Back.', out('The bell over the door.', scene('gn-42-wing-3'))),
  ]),
  rm('gn-42-shop-held', 'The Frontier Shop: The Case', hall({ tags: ['Shop', 'Story'] }), 'Three items, each on a velvet cushion.', [...SHOP_HELD.slice(0, 3).map((h) => buy('gn-42-shop-held', h)), ch('Back.', out('Back to the counter.', scene('gn-42-shop')))]),
  rm('gn-42-shop-held-2', 'The Frontier Shop: The Other Case', hall({ tags: ['Shop', 'Story'] }), 'Three more, under a sign: *For the strong. And the careful.*', [...SHOP_HELD.slice(3).map((h) => buy('gn-42-shop-held-2', h)), ch('Back.', out('Back to the counter.', scene('gn-42-shop')))]),
  rm('gn-42-shop-tutor', 'The Frontier Shop: The Tutor', hall({ tags: ['Shop', 'Story'] }), '"Twelve points a move. I teach one Pokémon at a time. Bring it here."', [
    ...TUTORS.map(([id, name]) => ch(`${name}. 12 points.`, out(`Ten minutes, and it has ${name}. The tutor goes back to his paper.`, flag('frontier-points', -12), teach(id, { who: 'picked' }), scene('gn-42-shop-tutor')), { requires: [is('frontier-points', 12)], pick: {} })),
    ch('Back.', out('Back to the counter.', scene('gn-42-shop'))),
  ]),
  rm('gn-42-room', 'The Frontier: Your Room', hall({ tags: ['Recovery', 'Story'] }), say(
    'A small room with your name on the door. A bed for you, and enough cushions for six. The seven Symbols on a shelf, dusted.',
    'Mr. Diallo left a note: *Yours whenever the Frontier\'s in town. No charge. You\'ve paid.*',
  ), [
    chIf([once('frontier-rested')], 'Rest.', out('You sleep. Your team sleeps on top of you. In the morning everyone is whole.', heal(1), stampRegion('frontier-rested'), scene(PLAZA))),
    ch('Back down.', out('Down the stairs.', scene('gn-42-wing-3'))),
  ]),
];

const gn42: Json[] = [...plaza, ...tower, ...factory, ...arena, ...pike, ...dome, ...palace, ...pyramid];

// =====================================================================================================================
// gn.43  THE POKÉMON AUCTION  (Single at a Town node; until towns exist, step 15, optional; once per region, from A5).
// Six lots, read in the catalogue first (what it is, the fair value, where it came from), then bid on live: "Bid." / "Hold." / "Out."
// Four bidders with rules you can read (core/greenneedle/auction.ts). One lot is stolen; the clues are in the catalogue.
// =====================================================================================================================
const AUCTION_TINT = '#5b3a29';
const salon = (o: Json = {}): Json => ({ tint: AUCTION_TINT, tags: ['Shop', 'Mystery', 'Story'], effect: 'none', ...o });
const LOT_WORD = ['one', 'two', 'three', 'four', 'five', 'six'];
const LOT_WHAT = ['A held item', 'An Evolution Stone', 'A fossil', 'An egg; the breeder\'s card says', 'A regional variant', 'An unusual Pokémon'];
const lotLine = (n: number): string => `**Lot ${n}.** ${LOT_WHAT[n - 1]}: {cast:auction-lot-${n}}. Fair value {money:auction-fair-${n}}. {lot:${n}:prov}`;
const nextLot = (n: number): Json[] => (n < 6 ? [gn('auctionOpen', { n: n + 1 }), scene(`gn-43-lot-${n + 1}`)] : [scene('gn-43-end')]);
/** A round: the player's word, then the room's; the lot sold, the next comes up. */
const round = (n: number, label: string, key: string, text: string): Json => ch(label, out(text,
  gn('auctionRound', { key }),
  // Still going: back to the paddle. (First, because the next lot opening resets `auction-done`.)
  when('auction-done', { min: 0, max: 0 }, [scene(`gn-43-bid-${n}`)]),
  when('auction-done', { min: 1 }, [gn('auctionWin'), ...nextLot(n)]),
));
/** The second look at the photographs: name the lot whose picture shows what its description leaves out. */
const photoPick = (n: number, back: string): Json => ch(`Lot ${LOT_WORD[n - 1]}.`, out(`You hold the catalogue up to the light, at lot ${LOT_WORD[n - 1]}.`,
  when('auction-stolen', { min: n, max: n }, [setTo('auction-spotted', 1), scene(back)], 'There. In the corner of the photograph, something the description doesn\'t mention. This one has been somebody\'s.'),
  when('auction-stolen', { min: 0, max: n - 1 }, [scene(back)], 'Nothing. It\'s just a very good photograph.'),
  when('auction-stolen', { min: n + 1, max: 9 }, [scene(back)], 'Nothing. It\'s just a very good photograph.'),
));
const gn43: Json[] = [
  gev('gn-43-door', 'The Pokémon Auction', salon({ stop: 'event', rarity: 'common', requires: [once('auction-at')] }), say(
    '*A hall. Rows of chairs. Numbered paddles. A catalogue on every seat.*',
    '**Auctioneer, Mr. Octavian Pryde:** "Six lots. Bidding in hundreds. A nod is a bid; a sneeze, regrettably, is also a bid. Catalogues are accurate to the best of my knowledge, which is considerable."',
  ), [
    ch('Take a seat.', out('Paddle forty-one. The chair creaks. Three rows ahead, a man is already holding his paddle up, and the auction hasn\'t started.', stampRegion('auction-at'), gn('auctionArrive'), scene('gn-43-catalogue'))),
    ch('Walk on.', out('Through the doors, as they close: "Lot one, ladies and gentlemen—"')),
  ]),
  rm('gn-43-catalogue', 'The Auction: The Catalogue', salon(), say(
    'You open the catalogue. Each lot: what it is, a fair value, and where it came from.',
    lotLine(1), lotLine(2), lotLine(3),
  ), [
    ch('Turn the page.', out('Heavy paper. It smells of money.', scene('gn-43-catalogue-2'))),
    ch('Look again at the photographs.', out('You go back to the pictures, slowly.', scene('gn-43-photos'))),
    ch('Put it down. The bidding\'s starting.', out('Pryde taps the lectern twice. The room straightens.', gn('auctionOpen', { n: 1 }), scene('gn-43-lot-1'))),
  ]),
  rm('gn-43-catalogue-2', 'The Auction: The Catalogue, Continued', salon(), say(lotLine(4), lotLine(5), lotLine(6)), [
    ch('Back a page.', out('Back to lots one to three.', scene('gn-43-catalogue'))),
    ch('Look again at the photographs.', out('You go back to the pictures, slowly.', scene('gn-43-photos-2'))),
    ch('Put it down. The bidding\'s starting.', out('Pryde taps the lectern twice. The room straightens.', gn('auctionOpen', { n: 1 }), scene('gn-43-lot-1'))),
  ]),
  rm('gn-43-photos', 'The Auction: The Photographs', salon(), say(
    'A second look at the photographs of lots one to three. Which one shows something its description leaves out?',
    '**Lot 1:** {lot:1:photo} **Lot 2:** {lot:2:photo} **Lot 3:** {lot:3:photo}',
  ), [photoPick(1, 'gn-43-catalogue'), photoPick(2, 'gn-43-catalogue'), photoPick(3, 'gn-43-catalogue'), ch('The next three.', out('You turn the page.', scene('gn-43-photos-2')))]),
  rm('gn-43-photos-2', 'The Auction: The Photographs, Continued', salon(), say(
    'Lots four to six, held up to the light.',
    '**Lot 4:** {lot:4:photo} **Lot 5:** {lot:5:photo} **Lot 6:** {lot:6:photo}',
  ), [photoPick(4, 'gn-43-catalogue-2'), photoPick(5, 'gn-43-catalogue-2'), photoPick(6, 'gn-43-catalogue-2'), ch('Back to the first three.', out('You turn back.', scene('gn-43-photos')))]),
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
    rm(`gn-43-lot-${n}`, `The Auction: Lot ${n}`, salon({ remembers: [
      { id: 'eyes', when: [exactly('auction-stolen', n)], notice: 'In the third row, a young woman in grey gloves sits up for the first time. She checks a note inside her glove, and looks at the lot, and nothing else.' },
      { id: 'collector', when: [exactly('auction-quayle', n)], notice: 'Mr. Quayle, the Collector, who hasn\'t moved all morning, uncrosses his legs. It is the lot that would suit your lead best.' },
    ] }), say(
      `**Pryde:** "Lot ${LOT_WORD[n - 1]}." A porter carries it out on a velvet tray.`,
      lotLine(n), 'Pryde opens at {money:auction-price}.',
    ), [
      chIf([is('auction-suspect')], 'Buy it, and return it.', out('You look at the tag in the photograph again, and the name on it. You raise your paddle.', setTo('auction-return-intent', 1), scene(`gn-43-bid-${n}`))),
      chIf([is('auction-suspect')], 'Stand up and say so.', out(say(
        '**You:** "That one\'s stolen." *Silence. Mr. Dabb lowers his paddle for the first time in his life.*',
        '**Pryde** reads the catalogue again, goes white, and stops the sale. The young woman is out of the door before he\'s finished the sentence.',
        'On the floor by her chair: the note from her glove. Her limit, and a letter, in the mark of the evil team that works this region. A File.',
      ), when('auction-exposed', { min: 0, max: 0 }, [stampRegion('auction-exposed-at')]), flag('auction-exposed'), rep(2), { kind: 'evil', mark: 'files' },
        moment('You stood up at the auction and said the lot was stolen. It was.', 60), ...nextLot(n))),
      chIf([is('auction-suspect')], 'Say nothing.', out('You keep your paddle in your lap. The young woman bids once, twice. Nobody else does for long.',
        gn('auctionRound', { key: 'silent' }), ...nextLot(n))),
      chIf([not('auction-suspect')], 'Watch the bidding open.', out('Paddles shift in the rows ahead.', scene(`gn-43-bid-${n}`))),
    ]),
    rm(`gn-43-bid-${n}`, `The Auction: Lot ${n}, Bidding`, salon({ remembers: [{ id: 'yours', when: [exactly('auction-high', 1)], notice: 'The bid is with you. Pryde looks round the room for anyone who\'ll go higher.' }] }), say(
      `Lot ${n}: {cast:auction-lot-${n}}. The price: {money:auction-price}. Fair value: {money:auction-fair-${n}}.`,
      'A step is a hundred.',
    ), [
      round(n, 'Bid.', 'bid', 'Your paddle goes up.'),
      round(n, 'Hold.', 'hold', 'You keep still and let the room move.'),
      round(n, 'Out.', 'out', 'You put your paddle face down on your knee.'),
    ]),
  ]),
  rm('gn-43-end', 'The Auction: After', salon({ remembers: [
    { id: 'dabb', when: [exactly('auction-visits', 2)], notice: 'At the very end, a last lot nobody expected: a single Oran Berry. Mr. Dabb bids four hundred, and nobody else does. He wins a lot, at last. He is going to have it framed.' },
  ] }), say(
    'The hall empties. Paddles in a basket by the door. Pryde, at the lectern, counting, and humming.',
  ), [
    chIf([is('auction-bought-stolen'), is('auction-return-intent')], 'Find the owner.', out(say(
      'The tag gives a name. It takes an afternoon of asking. A small house, a garden, a person who sits down very suddenly when they see what you\'re holding.',
      'They pay back what they can. It isn\'t all of it. You tell them that\'s fine, and it is.',
    ), gn('auctionReturn'), kindness(2), moment('You bought a stolen lot at auction, and took it home to its owner.', 60), scene('gn-43-end'))),
    chIf([gnc('regionChanged', { key: 'auction-exposed-at' }), not('auction-secret-lot')], 'Pryde has a small box.', out('He waits for the last of the room to leave.', pick('auction-seven', 1, 1, 1), scene('gn-43-seven'))),
    ch('Leave.', out('Pryde raises his gavel to you, as you go. He doesn\'t bring it down.', flag('auction-left'))),
  ]),
  rm('gn-43-seven', 'The Auction: Lot Seven', salon({ pokemon: 'lapras' }), say(
    '*After the hall\'s cleared. Pryde, with a small box.*',
    '**Pryde:** "Lot seven. Not in the catalogue. I\'ve held it eleven years for someone I could be sure of. You stood up. That\'s the test, as it turns out."',
    'You bid against nobody. He names the fair value, and that\'s the price.',
  ), [
    chIf([exactly('auction-seven', 1)], 'A Master Ball. Pay ₽3,000.', out('It sits in the box like an egg. "It has never been thrown," says Pryde. "I couldn\'t bear to."', $(-3000), item('master-ball'), setTo('auction-secret-lot', 1)), { requires: [money(3000)] }),
    chIf([exactly('auction-seven', 2)], 'The Lapras with a full page of provenance. Pay ₽2,500.', out('A page, in Pryde\'s hand, every word true. Where it was born, who raised it, and why it is his to sell. It hums at you.', $(-2500), join({ species: ['lapras'] }), setTo('auction-secret-lot', 1)), { requires: [money(2500)] }),
    chIf([exactly('auction-seven', 3)], 'The gavel itself. Pay ₽2,000.', out('He turns it over in his hands, once, and gives it to the Pokémon you point to. "The first word is always theirs, now. Nobody interrupts it."', $(-2000), gn('gavel'), setTo('auction-secret-lot', 1)), { requires: [money(2000)], pick: {} }),
    ch('Not today.', out('**Pryde:** "Then I shall hold it a while longer. I\'m good at that."')),
  ]),
];


export const EVENTS: Json[] = [...gn42, ...gn43];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-42-door': {
    gn: 'gn.42', shape: 'Hub', earliest: 'A9', home: 12, window: [10, 15], sits: 'optional', attaches: 'town', tags: ['Hub Destination', 'Tournament Episode'],
    level: 'By rank: Brains bring 3 Pokémon at A+0 (Bronze), 4 at A+1 (Silver), 5 at A+1 with held items (Gold), 6 at A+2 (Platinum)', often: 'region', badge: 'own',
    dressing: { kanto: 'The Battle Frontier', elsewhere: 'The Battle Frontier' },
    note: 'Badge: a crossed-swords crest. Once per region, from the second region. SF114 (ps-battle-frontier-gate) is its front gate, with the same clerk. The rank and the Brains\' memory last the run (no memory across runs).',
  },
  'gn-43-door': {
    gn: 'gn.43', shape: 'Single', earliest: 'A5', home: 15, window: [13, 17], sits: 'optional', attaches: 'town', tags: ['Community Episode', 'Mystery Episode'],
    level: 'No battles', often: 'region', badge: 'own', dressing: { kanto: 'The Pokémon Auction', elsewhere: 'The Pokémon Auction' },
    note: 'Badge: a gavel. Once per region. SF125\'s pop-up and silent auction are small versions of this; the black-market auction is gn.52. Until towns exist it sits on step 15.',
  },
};

export const CHAINS: Json[] = [];
