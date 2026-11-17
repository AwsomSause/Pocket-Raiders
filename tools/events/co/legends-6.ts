// Catalog Overhaul Pack, legends: Legendary questlines L9 to L15 (QUESTLINES_LEGENDARY.md). Pack questlines: status `extra`.
// Same rules as legends-5: each is its Legendary's Trial; at Recognition the Legendary may offer itself; Legendary fights are pseudo fights.
import { at, ch, ev, fight, flag, flagIs, fr, heal, item, leave, out, ptype, room, rp, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { gift, sign } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Legendary';
const R = { room: true, rarity: 'rare' as const };
const moment = (text: string, importance = 80): Json => ({ kind: 'moment', text, importance });
const cap = (s: string) => s.split('-').map((w) => `${w[0]!.toUpperCase()}${w.slice(1)}`).join('-');
const not = (key: string): Json => flagIs(key, 0, 0);
const typeAbsent = (type: string): Json => ({ kind: 'partyType', type, absent: true });
const legend = (species: string | string[], o: { lv?: number; win?: Json[]; lose?: Json[]; rule?: Json; format?: 'doubles' } = {}): Json => ({
  ...wild({ species: Array.isArray(species) ? species : [species], lv: o.lv ?? 3, win: o.win ?? [], ...(o.format ? { format: o.format } : {}) }),
  pseudo: true,
  lose: o.lose ?? [],
  ...(o.rule ? { rule: o.rule } : {}),
});
const recognition = (species: string, text: string): Json => ({
  id: `recognition-${species}`,
  when: [flagIs(`blessing-${species}`), flagIs('blessing-influence', 7)],
  notice: `${cap(species)} knows you. It does not want a battle.`,
  addChoices: [ch(`Hold out your hand to ${cap(species)}.`, out(text, gift(species), flag(`${species}-offered`)))],
});

// ---------------------------------------------------------------- L9. The Spear and the Pearl (Lake Trio, Dialga, Palkia)
/** Uxie's question: an answer is true when nothing in the party covers that weakness. */
const weakness = (label: string, coverers: string[]): Json =>
  ch(label, out('Uxie opens its eyes. You lied, and it knows. Your team forgets the weakness instead: something about a move goes vague.', flag('lake-uxie-lie'), flag('lake-done-1')), {
    branches: [{ when: coverers.map(typeAbsent), text: 'Uxie: "True." It closes its eyes again. The first lake goes still.', effects: [flag('lake-uxie'), flag('lake-done-1')] }],
  });
const lake = (n: 1 | 2 | 3, mon: string, text: string, choices: Json[]): Json =>
  ev(`co-l9-lake-${n}`, `The Spear and the Pearl: Lake ${n}`, G, { rarity: 'rare', ...(n > 1 ? { callback: true, requires: [flagIs(`lake-done-${n - 1}`), not(`lake-done-${n}`)] } : {}), pokemon: mon, tint: ['#e0d060', '#e080a0', '#6080e0'][n - 1]! }, text, choices);
const l9: Json[] = [
  lake(1, 'uxie', 'Three lakes light up in sequence, one after another, across the region.\n\nAt the first lake, Uxie, eyes closed, a subtitle: I will ask you a question. If you lie, you will forget your answer.\nUxie: What is the one thing your team cannot do?', [
    weakness('"We can\'t beat Ground-types."', ['water', 'grass', 'ice']),
    weakness('"We can\'t beat Fire-types."', ['water', 'ground', 'rock']),
    weakness('"We can\'t beat Dragon-types."', ['ice', 'dragon', 'fairy']),
    ch('Walk away.', leave('The lake stays lit behind you.')),
  ]),
  lake(2, 'mesprit', 'The second lake. Mesprit floats over the water.\n\nMesprit: If one of them had to stay here with me, who would you leave?\nEvery Pokémon in your party turns to look at you.', [
    ch('"None of them."', out('Mesprit laughs, delighted, and lets you all go.', flag('lake-mesprit'), flag('lake-done-2'), fr(1))),
    ch('"My starter."', out('Mesprit: "Good. You know." Your starter looks at you for a long time.', flag('lake-mesprit'), flag('lake-done-2'), fr(-10, 'starter'))),
    ch('"The newest one."', out('Mesprit: "Good. You know." The newest one looks at its feet.', flag('lake-mesprit'), flag('lake-done-2'), fr(-10, 'newest'))),
    ch('"The strongest one."', out('Mesprit: "Good. You know." Your strongest looks away.', flag('lake-mesprit'), flag('lake-done-2'), fr(-10, 'top'))),
  ]),
  lake(3, 'azelf', 'The third lake. Azelf, already in the air above you.\n\nAzelf: Lose to me. Then get up.', [
    ch('Fight it.', fight('It is far stronger than you. That is the point.', legend('azelf', { lv: 8, win: [room('co-l9-again')], lose: [room('co-l9-again')] }))),
  ]),
  ev('co-l9-again', 'The Spear and the Pearl: Get Up', G, { ...R, pokemon: 'azelf', tint: '#6080e0' },
    'You are on the ground. Azelf waits.',
    [
      ch('"Again."', out('Azelf: "Good." It gives you the last link of the Red Chain.', flag('lake-azelf'), flag('lake-done-3'), item('red-chain'), sign('lake', 2))),
      ch('Leave.', out('You limp away. The third lake goes dark.', flag('lake-done-3'))),
    ]),
  ev('co-l9-pillar', 'The Spear and the Pearl: Spear Pillar', G, {
    callback: true, rarity: 'rare', requires: [flagIs('lake-azelf'), flagIs('lake-mesprit'), not('pillar-done')], pokemon: 'dialga', tint: '#8080c0', effect: 'sparkle',
    remembers: [recognition('dialga', 'Dialga lowers its head. Time goes very slow, and kind, and it comes with you.'), recognition('palkia', 'Palkia folds the space between you to nothing, and is beside you, and stays.')],
  },
    'Spear Pillar. The Red Chain glows; two crests burn in the sky.',
    [
      ch('Call the Keeper of Time.', fight('Dialga comes, and the seconds bend around it.', legend('dialga', { lv: 5, win: [flag('dialga-beaten')] }), flag('pillar-done'))),
      ch('Call the Keeper of Space.', fight('Palkia comes, and the pillar seems very far away.', legend('palkia', { lv: 5, win: [flag('palkia-beaten')] }), flag('pillar-done'))),
      ch('Call both.', fight('They fight each other, and you are in between. Survive eight turns.', legend(['dialga', 'palkia'], { lv: 5, format: 'doubles', rule: { surviveTurns: 8 }, win: [flag('pillar-both'), sign('giratina', 2), moment('Giratina\'s shadow crossed Spear Pillar, and both Keepers retreated.', 85)] }), flag('pillar-done'))),
    ]),
];

// ---------------------------------------------------------------- L10. Truth and Ideals (Reshiram, Zekrom)
const l10: Json[] = [
  ev('co-l10-stone', 'Truth and Ideals', G, { rarity: 'rare', requires: [ptype('fire'), ptype('water')], pokemon: 'kyurem', tint: '#404040' },
    'A dark stone, in a field, speaks as you walk past with two things on your team that hate each other.\n\nThe stone: "You carry two things that hate each other. How?"',
    [
      ch('"They don\'t hate each other."', out('The stone is silent a long time. Then it gives you a road to a divided town.', flag('tao-started'), item('dark-stone'))),
      ch('"I make them get along."', out('The stone hums. It gives you a road to a divided town.', flag('tao-started'), item('dark-stone'))),
      ch('"I don\'t know."', out('The stone: "Good. Find out." A road opens to a divided town.', flag('tao-started'), item('dark-stone'))),
    ]),
  ev('co-l10-town', 'Truth and Ideals: The Divided Town', G, { callback: true, rarity: 'rare', requires: [flagIs('tao-started'), not('tao-town')], tint: '#808080' },
    'Half white, half black; a line painted down the street.\n\nN, in the square: "I ask everyone the same thing. Which side of the line do you live on?"\nN: "Nobody has said \'both\' yet."',
    [
      ch('"White."', out('N nods, a little sadly.', flag('tao-town'), item('light-stone'))),
      ch('"Black."', out('N nods, a little sadly.', flag('tao-town'), item('light-stone'))),
      ch('"Both."', out('N looks up, and smiles, for the first time. "Then I will come and watch."', flag('tao-town'), flag('tao-both'), item('light-stone'))),
    ]),
  ev('co-l10-tower', 'Truth and Ideals: Dragonspiral Tower', G, {
    callback: true, rarity: 'rare', requires: [flagIs('tao-town'), not('tao-done')], pokemon: 'reshiram', tint: '#a0a0a0', effect: 'sparkle',
    remembers: [
      { id: 'n', when: [flagIs('tao-both')], notice: 'N has followed you to the tower. He will watch.' },
      recognition('reshiram', 'Reshiram comes down and does not fight. It already knows what you believe.'),
      recognition('zekrom', 'Zekrom comes down and does not fight. It already knows what you believe.'),
    ],
  },
    'Two stones in your bag, both warm.\n\nN: "It will ask what you believe. Not what\'s true. What you believe."',
    [
      ch('"I believe what I can prove."', fight('The light stone burns white. Reshiram descends.', legend('reshiram', { lv: 5, win: [flag('reshiram-beaten')] }), flag('tao-done'))),
      ch('"I believe what should be true."', fight('The dark stone burns black. Zekrom descends.', legend('zekrom', { lv: 5, win: [flag('zekrom-beaten')] }), flag('tao-done'))),
      ch('"I believe my Pokémon."', out('Both stones crack. Both dragons appear for one turn, look at your Pokémon, and leave. Far away, something cold turns over in its sleep.', flag('tao-done'), flag('tao-both-dragons'), sign('kyurem', 2))),
    ]),
];

// ---------------------------------------------------------------- L11. Life and Destruction (Xerneas, Yveltal, Zygarde)
const l11: Json[] = [
  ev('co-l11-valley', 'Life and Destruction', G, { rarity: 'rare', cast: ['trainer.psychic_m'], pokemon: 'yveltal', tint: '#605050' },
    'The forests are going grey from the edges in. At the bottom of a valley, a black cocoon throbs. On the far ridge, a dead tree has one green leaf.\n\nA Lysandre Labs scientist, setting up instruments: "You\'re not supposed to be here. This is the most important energy source in the world."\nScientist: "It\'s asleep. When it wakes up, everything near it dies. We\'d like to be the ones who decide what \'near\' means."',
    [
      ch('Wake the tree.', out('You put your hand on the dead tree. It wakes. The forests heal from the ridge down. At the same moment, the cocoon hatches, furious.', flag('life-xerneas'), room('co-l11-both'))),
      ch('Stop the scientists.', fight('The lab crew turns on you.', { ...trainer('Lysandre Labs Crew', { size: 3, types: ['fire', 'dark'], win: [flag('life-unwatched'), room('co-l11-night')] }), evil: 'grunt' })),
      ch('Find out what the green lights are.', out('Zygarde\'s Cells assemble out of the grass. Zygarde decides, and the other two go back to sleep.', flag('life-zygarde'), room('co-l11-zygarde')), { requires: [flagIs('zygarde-cells')] }),
    ]),
  ev('co-l11-both', 'Life and Destruction: Both Awake', G, { ...R, pokemon: 'xerneas', tint: '#80a0c0', remembers: [recognition('xerneas', 'Xerneas comes down off the ridge and stands beside you. It offers itself.'), recognition('yveltal', 'Yveltal lands. It does not strike. It offers itself.')] },
    'Xerneas on the ridge, Yveltal over the valley. Yveltal strikes first.',
    [ch('Stand between them.', fight('Life and destruction, both at once.', legend(['xerneas', 'yveltal'], { lv: 5, format: 'doubles', win: [flag('life-ended')] })))]),
  ev('co-l11-night', 'Life and Destruction: Unwatched', G, { ...R, pokemon: 'yveltal', tint: '#302020', remembers: [recognition('yveltal', 'Yveltal lands. It does not strike. It offers itself.')] },
    'With nobody watching, the cocoon hatches at night. Yveltal strikes first.',
    [ch('Face it.', fight('The grey comes down the valley with it.', legend('yveltal', { lv: 5, win: [flag('life-ended')] })))]),
  ev('co-l11-zygarde', 'Life and Destruction: The Green Lights', G, { ...R, pokemon: 'zygarde', tint: '#40a040', remembers: [recognition('zygarde', 'Zygarde coils at your feet. It has decided. It offers itself.')] },
    'Zygarde stands in the valley, made of a thousand green lights. It has decided.',
    [ch('Face it.', fight('It wants to see whether you are part of the balance.', legend('zygarde', { lv: 5, win: [flag('life-ended')] })))]),
];

// ---------------------------------------------------------------- L12. The Sun and Moon Altars (Cosmog line, Lillie)
const attempt = (n: number): Json =>
  ev(`co-l12-attempt-${n}`, `The Sun and Moon Altars: Aether, Again`, G, { callback: true, rarity: 'rare', requires: [flagIs('nebby-met'), flagIs('nebby-attempts', n - 1, n - 1)], cast: ['trainer.fairy_tale_girl'], pokemon: 'cosmog', tint: '#e0e0f0' },
    'Two people in white coats, again. Lillie holds the bag tight.',
    [
      ch('Fight.', fight('Aether staff.', trainer('Aether Staff', { size: 2, types: ['psychic', 'steel'], win: [flag('nebby-attempts')] }))),
      ch('Hide.', out('You pull Lillie into an alley. They run past.', flag('nebby-attempts'))),
      ch('Let Nebby teleport.', out('Pew. You are all somewhere else, a node away.', flag('nebby-attempts'), takeNode(1))),
    ]);
const l12: Json[] = [
  ev('co-l12-lillie', 'The Sun and Moon Altars', G, { rarity: 'rare', cast: ['trainer.fairy_tale_girl'], pokemon: 'cosmog', tint: '#f0f0ff' },
    'A girl in a white hat runs past with a bag that is glowing. Two people in white coats run after her.\n\nLillie, stopping, out of breath: "Please. Please don\'t tell them which way I went."\nThe bag wriggles. A small star-shaped face pokes out.\nLillie: "Nebby, get back in the bag!"',
    [
      ch('"Go. I\'ll stall them."', fight('Two Aether staff come round the corner.', trainer('Aether Staff', { size: 2, types: ['psychic', 'steel'], win: [flag('nebby-trust')] }), flag('nebby-met'))),
      ch('"Who are they?"', out('Lillie: "My mother\'s people." She runs. You follow.', flag('nebby-met'))),
      ch('"Give me the bag."', out('She hesitates. Nebby teleports into your arms anyway, and giggles.', flag('nebby-met'), flag('nebby-chose'))),
    ]),
  attempt(1), attempt(2), attempt(3),
  ev('co-l12-altars', 'The Sun and Moon Altars: The Altars', G, { callback: true, rarity: 'rare', requires: [flagIs('nebby-attempts', 3), not('nebby-done')], cast: ['trainer.fairy_tale_girl'], pokemon: 'cosmoem', tint: '#f0e0a0', effect: 'sparkle' },
    'The altars. Lillie plays the flute. Nebby glows, and closes up hard as a star (Cosmoem), and opens again, enormous.\n\nLillie: "It grew up. It grew up and I wasn\'t ready."',
    [
      ch('"It\'s yours, Lillie."', out('Lillie holds it, crying, laughing. She gives you both flutes.', flag('nebby-done'), item('sun-flute'), item('moon-flute'), sign('light', 2), moment('Nebby grew up at the altars, and went with Lillie.', 85))),
      ch('"Come with us."', out('It chose you, back when it teleported into your arms. Lillie lets it. Solgaleo, blazing, comes with you.', flag('nebby-done'), gift('solgaleo'), item('sun-flute'), sign('light', 2)), { requires: [flagIs('nebby-chose')], branches: [{ when: [at('evening', 'night')], text: 'It chose you, back when it teleported into your arms. Lillie lets it. Lunala, wings full of night, comes with you.', effects: [flag('nebby-done'), gift('lunala'), item('moon-flute'), sign('light', 2)] }] }),
    ]),
];

// ---------------------------------------------------------------- L13. The Light That Would Not Return (Necrozma)
const l13: Json[] = [
  ev('co-l13-dim', 'The Light That Would Not Return', G, { rarity: 'rare', cast: ['trainer.psychic_m'], pokemon: 'necrozma', tint: '#606070' },
    'The day is dimmer than yesterday. Every day, a little dimmer.\n\nAn astronomer: "The sun hasn\'t changed. The light is being taken before it gets here."\nA beam falls from the clear sky and burns a line across the road.\nAstronomer: "That was light. It\'s being thrown away. Something up there is in pain."',
    [
      ch('Climb the fallen-light mountain.', out('You climb toward where the beams come from.', flag('necrozma-started'), sign('necrozma'), room('co-l13-summit'))),
      ch('Not yet.', leave('The light keeps dimming.')),
    ]),
  ev('co-l13-summit', 'The Light That Would Not Return: The Summit', G, {
    ...R, pokemon: 'necrozma', tint: '#303040', effect: 'flicker',
    remembers: [
      { id: 'megalopolis', when: [flagIs('faller-rank', 5)], notice: 'The people of Ultra Megalopolis are watching from a rift above the summit.' },
      { ...recognition('necrozma', 'Necrozma folds its prisms in, and the light comes back all at once. It offers itself.'), hide: [0] },
    ],
  },
    'At the summit, Necrozma, black and splintered, swallowing the light.',
    [
      ch('Fight it.', fight('A very hard battle.', legend('necrozma', { lv: 7, win: [flag('necrozma-beaten'), room('co-l13-after')] }))),
      ch('Give it light.', fight('Six turns: you throw light at it, fire and flash, while it attacks. At the end it becomes Ultra Necrozma for one moment, and gives the light back.', legend('necrozma', { lv: 5, rule: { surviveTurns: 6 }, win: [flag('necrozma-given'), gift('necrozma'), room('co-l13-after')] }))),
      ch('Let it take Solgaleo\'s light.', out('Solgaleo steps forward and lets Necrozma take its light. The region\'s light returns. Necrozma comes with you, carrying both.', flag('necrozma-fused'), gift('necrozma'), room('co-l13-after')), { requires: [{ kind: 'partySpecies', species: 'solgaleo' }] }),
      ch('Let it take Lunala\'s light.', out('Lunala steps forward and lets Necrozma take its light. The region\'s light returns. Necrozma comes with you, carrying both.', flag('necrozma-fused'), gift('necrozma'), room('co-l13-after')), { requires: [{ kind: 'partySpecies', species: 'lunala' }] }),
    ]),
  ev('co-l13-after', 'The Light That Would Not Return: Light', G, { ...R, pokemon: 'necrozma', tint: '#f0f0d0', effect: 'sparkle' },
    'The day is bright again. The astronomer is laughing on the road below.',
    [ch('Walk down.', out('The light is back.', rp(20)), { branches: [{ when: [flagIs('faller-rank', 5)], text: 'At the foot of the mountain, the people of Ultra Megalopolis give you a small purple Pokémon in thanks: Poipole.', effects: [gift('poipole'), rp(20)] }] })]),
];

// ---------------------------------------------------------------- L14. The Sword and the Shield (Zacian, Zamazenta)
const hum = (n: number): Json =>
  ev(`co-l14-hum-${n}`, `The Sword and the Shield: The Darkest Day ${n}`, G, { callback: true, rarity: 'rare', requires: [flagIs('relic-carried'), flagIs('relic-hum', n - 1, n - 1)], tint: '#802020' },
    n === 1 ? 'The sky reddens at night. A Power Spot erupts by the road. The relic in your bag hums louder.' : 'Another red night. The relic hums so loud your Pokémon can hear it.',
    [ch('Keep going.', out('It hums.', flag('relic-hum'), heal(0.25)))]);
const l14: Json[] = [
  ev('co-l14-ruin', 'The Sword and the Shield', G, { rarity: 'rare', pokemon: 'zacian', tint: '#806050' },
    'In a ruin, a rusted sword and a rusted shield lie side by side. When you pick one up, the other hums.\n\nSordward, bursting out from behind a pillar: "Unhand the relics! They belong to our ancestors!"\nShielbert: "Probably."\nSordward: "DEFINITELY."',
    [
      ch('Carry the sword.', out('You take the sword. Sordward splutters.', flag('relic-carried'), flag('relic-sword'), item('rusted-sword'), sign('hero'))),
      ch('Carry the shield.', out('You take the shield. Shielbert sighs.', flag('relic-carried'), flag('relic-shield'), item('rusted-shield'), sign('hero'))),
      ch('Carry both.', out('You take both. They are heavy. Both brothers splutter.', flag('relic-carried'), flag('relic-sword'), flag('relic-shield'), item('rusted-sword'), item('rusted-shield'), sign('hero'))),
    ]),
  hum(1), hum(2),
  ev('co-l14-weald', 'The Sword and the Shield: The Slumbering Weald', G, {
    callback: true, rarity: 'rare', requires: [flagIs('relic-hum', 2), not('relic-done')], pokemon: 'zamazenta', tint: '#6070a0', effect: 'fog',
    remembers: [recognition('zacian', 'Zacian sets its jaw on the sword and looks at you. It comes.'), recognition('zamazenta', 'Zamazenta sets its jaw on the shield and looks at you. It comes.')],
  },
    'Mist. A statue of two heroes. The relics glow.\nTwo wolves walk out of the mist. They look at the relic in your hand.\n\nShielbert, quietly, for once: "They came back."',
    [
      ch('Hold up the sword.', fight('Zacian steps forward.', legend('zacian', { lv: 5, win: [flag('zacian-beaten')] }), flag('relic-done')), { requires: [flagIs('relic-sword'), not('relic-shield')] }),
      ch('Hold up the shield.', fight('Zamazenta steps forward.', legend('zamazenta', { lv: 5, win: [flag('zamazenta-beaten')] }), flag('relic-done')), { requires: [flagIs('relic-shield'), not('relic-sword')] }),
      ch('Hold up both.', fight('Both step forward, and both stand with you, against the first form of the thing that made the darkest day.', legend('eternatus', { lv: 6, win: [room('co-l14-choose')] }), flag('relic-done')), { requires: [flagIs('relic-sword'), flagIs('relic-shield')] }),
    ]),
  ev('co-l14-choose', 'The Sword and the Shield: One Wolf', G, { ...R, pokemon: 'zacian', tint: '#8090c0' },
    'The darkest day is over. Both wolves look at you. One may come.',
    [
      ch('Zacian.', out('Zacian comes. Zamazenta howls once and returns to sleep.', gift('zacian'))),
      ch('Zamazenta.', out('Zamazenta comes. Zacian howls once and returns to sleep.', gift('zamazenta'))),
    ]),
];

// ---------------------------------------------------------------- L15. The Four Sealed Wards (the Ruinous Legendaries)
const RUIN = ['wo-chien', 'chien-pao', 'ting-lu', 'chi-yu'] as const;
const curse = (stakes: number): Json => ({ kind: 'tempEffect', label: `The Ruinous curse (${stakes} stakes out)`, effects: [{ kind: 'healingMultiplier', value: Math.max(0.5, 1 - stakes * 0.1) }], until: 'region' });
const clue = (n: number): Json =>
  ev(`co-l15-clue-${n}`, `The Four Sealed Wards: Clue ${n}`, G, { callback: true, rarity: 'rare', requires: [flagIs('wards-seller'), flagIs('wards-clues', n - 1, n - 1)], tint: '#806040' },
    ['A gold coin in the grass by a pulled stake, stamped with a circle.', 'A trader in a gilt collar, asking a farmer whether his neighbour has "enemies".', 'An order book left on a bench: "One stake, region-wide. Delivery by night."'][n - 1]!,
    [ch('Follow it.', out(n < 3 ? 'One more piece.' : 'It leads to a man in a gilt collar, selling the curse as a weapon.', flag('wards-clues'), ...(n === 3 ? [room('co-l15-seller')] : [])))]);
const ruinous = (species: string): Json =>
  ev(`co-l15-${species}`, `The Four Sealed Wards: ${cap(species)}`, G, { callback: true, rarity: 'rare', requires: [flagIs('wards-broken'), not(`${species}-met`)], pokemon: species, tint: '#503060' },
    `${cap(species)}, free of its stake, in the open. It is angry for a reason nobody remembers.`,
    [
      ch('Face it.', fight('Its anger fills the field.', legend(species, { lv: 5, win: [flag(`${species}-beaten`)] }), flag(`${species}-met`))),
      ch('Leave it.', leave()),
    ]);
const l15: Json[] = [
  ev('co-l15-shrine', 'The Four Sealed Wards', G, {
    rarity: 'rare', cast: ['trainer.hex_maniac'], pokemon: 'ting-lu', tint: '#503050',
    remembers: [
      { id: 'tablets', when: [flagIs('wards-tablets')], notice: 'You read the old tablets. You know why they are angry: each was made from something used to condemn a person who was innocent.', addChoices: [ch('Apologise.', out('You kneel at the shrine and say it out loud, for everyone who never did. The stakes go back in by themselves. The curse lifts. No one has to fight.', flag('wards-sealed'), flag('wards-apologised'), sign('ruin', 2), moment('You apologised at the shrine of the Ruinous ones. The curse lifted.', 90)))] },
      { id: 'ruin-blessing', when: [flagIs('blessing-ruin')], notice: 'Your blessing\'s stake is already out. Its keeper asks you, quietly, not to put it back.' },
    ],
  },
    'Four purple stakes around a sealed shrine. Two are pulled out and lying in the grass.\n\nA shrine keeper: "Someone is pulling them. Every one that comes out, the whole region gets a little weaker."\nShrine keeper: "People say the Ruinous ones are evil. They\'re not. They\'re just angry for a reason no one remembers."',
    [
      ch('Put the stakes back.', fight('The freed ones\' anger comes at you as you work.', legend(['wo-chien', 'chien-pao', 'ting-lu', 'chi-yu'], { lv: 4, format: 'doubles', win: [flag('wards-sealed'), rp(25)] }))),
      ch('Find who\'s pulling them.', out('Two stakes out. The region feels it. You go looking.', flag('wards-seller'), curse(2))),
      ch('Pull the rest.', out('You pull the last two. The ground shudders. All four are loose now, and the region is cursed.', flag('wards-broken'), curse(4))),
    ]),
  clue(1), clue(2), clue(3),
  ev('co-l15-seller', 'The Four Sealed Wards: The Seller', G, { ...R, cast: ['trainer.roughneck'], tint: '#806030' },
    'Gilt Circle man: "A curse is just a product. Somebody wants their rival weaker, I sell it to them. Region-wide, even. Very popular."',
    [ch('Stop him.', fight('His guards step in.', { ...trainer('Gilt Circle Guards', { size: 3, types: ['dark', 'steel'], win: [flag('wards-sealed'), flag('evil-op-shut'), rp(25)] }), evil: 'grunt' }))]),
  ...RUIN.map(ruinous),
  ev('co-l15-tablets', 'The Four Sealed Wards: The Old Tablets', G, { rarity: 'rare', requires: [], tint: '#605040' },
    'Behind the shrine, under ivy, a row of old tablets nobody reads any more.',
    [
      ch('Read them.', out('Four names, four accusations, four people who were innocent. The things used to condemn them were made into the stakes.', flag('wards-tablets'), rp(10))),
      ch('Leave them.', leave()),
    ]),
];

export const EVENTS: Json[] = [...l9, ...l10, ...l11, ...l12, ...l13, ...l14, ...l15];
export const REMOVE: string[] = [];
