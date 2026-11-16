// Catalog Overhaul Pack, legends row A (batch 5): Legendary keys, Communion upgrades and the researcher's reactions (26 SYSTEM ids).
// Ledger rules: the old tickets become the Legendary and Mythical keys, each earned (never bought) as the Trial or the Visit condition;
// the Flute Maker and the Old Collector no longer sell them, they tell how each is earned. Form items become Communion upgrades
// (LEGENDARY_BLESSINGS.md Part 4, MYTHICAL_PROMISES.md Part 5). Earning is core/legends/keys.ts (data: catalogOverhaul/legendKeys.json):
// it sets `key-<item>` and gives the key; each place below requires that flag, so a key found any other way opens nothing.
// Every Legendary fight here is a pseudo fight (a loss puts you back on the map). Same-run memory only.
import { $, any, attr, ch, ev, fight, flag, flagIs, fr, good, heal, leave, out, room, trainer, wild, fierce, type Json } from '../dsl.ts';
import { gift, sign, visitable } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Legendary keys';
const cap = (s: string) => s.split('-').map((w) => `${w[0]!.toUpperCase()}${w.slice(1)}`).join('-');
const earned = (key: string): Json => flagIs(`key-${key}`);
const moment = (text: string, importance = 85): Json => ({ kind: 'moment', text, importance });
const withYou = (species: string): Json => ({ kind: 'partyLine', species, bond: 0 });
const notWithYou = (species: string): Json => ({ kind: 'partyLine', species, bond: 0, absent: true });
const species = (s: string): Json => ({ kind: 'partySpecies', species: s });
const form = (from: string, to: string, consume?: string): Json => ({ kind: 'formChange', from, to, ...(consume ? { consume } : {}) });
const legendFight = (list: string[], win: Json[], lv = 4): Json => ({ ...wild({ species: list, lv, shiny: 2, win }), pseudo: true, lose: [] });

/** A Legendary's place, opened by the key its Trial earned. Recognition (its blessing at Influence 7) lets it offer itself. */
const place = (o: { id: string; name: string; key: string; legend: string; intro: string; step: string; offering: string; answer: string; tint: string; effect: string; cast?: string[]; lv?: number }): Json =>
  ev(o.id, o.name, G, {
    keyItem: o.key, rarity: 'epic', requires: [earned(o.key)], pokemon: o.legend, tint: o.tint, effect: o.effect, cast: o.cast ?? [],
    remembers: [
      { id: 'with-you', when: [withYou(o.legend)], notice: `${cap(o.legend)} is already with you. It knows this place.`, hide: [0], addChoices: [
        ch(`Let ${cap(o.legend)} go on alone.`, out(o.answer, sign(o.legend, 2), heal(), fr(3), moment(`${cap(o.legend)} went back to the place its key opened, and came back to you.`))),
      ] },
      { id: 'recognition', when: [flagIs(`blessing-${o.legend}`), flagIs('blessing-influence', 7), notWithYou(o.legend)], notice: `${cap(o.legend)} knows you. It does not want a battle.`, addChoices: [
        ch(`Hold out your hand to ${cap(o.legend)}.`, out(`${cap(o.legend)} lowers its head into your hand. It has been watching the whole road, and it has decided.`, gift(o.legend), flag(`${o.legend}-offered`), moment(`${cap(o.legend)} offered itself at the place its key opened.`, 95))),
      ] },
    ],
  }, o.intro, [
    ch('Step forward.', fight(o.step, legendFight([o.legend], [flag(`${o.legend}-key-met`), sign(o.legend, 2)], o.lv))),
    ch('Leave an offering and go.', out(o.offering, heal(), sign(o.legend), fr(2))),
  ]);

/** A Mythical's key: the Visit condition. Its place is a Visit door that ends in the Promise room (legends-7/8). */
const door = (o: { id: string; name: string; key: string; mythical: string; intro: string; choices: [string, string, Json[]][]; tint: string; effect: string }): Json =>
  ev(o.id, o.name, G, { keyItem: o.key, rarity: 'epic', requires: [earned(o.key), ...visitable(o.mythical)], pokemon: o.mythical, tint: o.tint, effect: o.effect }, o.intro,
    o.choices.map(([label, text, effects]) => ch(label, out(text, ...effects, room(`co-my-${o.mythical}-promise`)))));

const KEYS_TOLD = 'The Old Collector: "Tickets and wings and stones. People think they are bought. They are not. They are answers."';

export const EVENTS: Json[] = [
  // ---------------------------------------------------------------- Legendary keys: the Trial
  place({ id: 'oaks-letter-birds', name: "Oak's Letter: The Sky Trio", key: 'oaks-letter', legend: 'articuno', tint: '#a0c8f0', effect: 'float', cast: ['boss.oak'],
    intro: 'The letter is in Professor Oak\'s hand, and it is addressed to the sky.\n\nYou followed its map to a cliff above the sea. The three birds who tested you are circling. One of them comes lower.\n\nThe last line of the letter: "If they let you near, do not waste it."',
    step: 'Articuno lands on the cliff edge. The wind goes cold and very still. It wants to see how far you have come.',
    offering: 'You leave the letter on a flat stone, weighted with a pebble. A blue feather drifts down onto it. Your team breathes easier.',
    answer: 'Articuno flies up to meet the other two. For a moment the three of them hang together in the sky, and then it comes home.' }),
  place({ id: 'works-key-plant', name: 'Works Key: Power Plant', key: 'works-key', legend: 'zapdos', tint: '#f0e060', effect: 'sparkle',
    intro: 'The Works Key fits a rusted door that has not opened in years.\n\nInside, the old power plant is dark. Then every dead bulb in the hall lights up at once, buzzing.\n\nSomething at the far end remembers you from the storm.',
    step: 'Zapdos spreads its wings across the turbines. The lights go white. It wants a rematch, and it is laughing.',
    offering: 'You throw the main switch to OFF and leave a full Elixir by the door. The bulbs dim, one by one, almost gently.',
    answer: 'Zapdos goes in alone. Every light in the plant flashes once, a greeting, and it comes back crackling and pleased.' }),
  place({ id: 'secret-key-volcano', name: 'Secret Key: Hidden Volcano', key: 'secret-key', legend: 'moltres', tint: '#f08040', effect: 'fire',
    intro: 'The Secret Key opens a gate on the volcano\'s slope that nobody marked on any map.\n\nThe air shimmers. Ash falls like warm snow.\n\nAt the crater\'s lip, a bird of fire is waiting. It saw you pass its Trial.',
    step: 'Moltres rises out of the crater, wings dripping flame. It will not burn you. It wants to know if you burn back.',
    offering: 'You leave a Charcoal on the gatepost. When you look back, it is glowing, and your team is warm to the bone.',
    answer: 'Moltres dives into the crater and comes up shining, every feather new. It shakes the sparks off over your team.' }),
  place({ id: 'magma-stone-heatran', name: 'Magma Stone: Stark Mountain', key: 'magma-stone', legend: 'heatran', tint: '#c04018', effect: 'fire', lv: 5,
    intro: 'The Magma Stone grew too hot to hold the moment you reached the mountain.\n\nDeep inside Stark Mountain, the lava moves around an empty hollow. The stone fits it exactly.\n\nThe mountain wakes, and something steel crawls up out of the fire.',
    step: 'Heatran clings to the cavern roof, upside down, molten iron on its back. It drops.',
    offering: 'You set the stone back in its hollow and step away. The lava calms. Something below rumbles, satisfied.',
    answer: 'Heatran walks into the lava as if it were a bath, and comes out glowing, and sits by your fire all night.' }),
  place({ id: 'silver-wing-islands', name: 'Silver Wing: Whirl Islands', key: 'silver-wing', legend: 'lugia', tint: '#6090c0', effect: 'rain',
    intro: 'The Silver Wing hums in your bag the moment you reach the Whirl Islands.\n\nThe whirlpools you fought through on its Trial are calm now. The sea is holding its breath.\n\nA silver shape rises from the deep, and it is looking at you.',
    step: 'Lugia rises with the sea behind it, a wall of water hanging on its wings. Its song shakes the rocks.',
    offering: 'You let the Silver Wing float on the still water. It sinks slowly, glowing. The sea sighs, and your team rests.',
    answer: 'Lugia dives without a sound. The whole sea brightens from below, and it comes back up beside your boat.' }),
  place({ id: 'rainbow-wing-tower', name: 'Rainbow Wing: Bell Tower', key: 'rainbow-wing', legend: 'ho-oh', tint: '#f8c850', effect: 'sparkle',
    intro: 'Every bell in the tower rings when you climb the last stair. Nobody pulled a rope.\n\nThe Rainbow Wing from its Trial burns in your hand, seven colours at once.\n\nA rainbow bird lands on the roof. It remembers what you did for the ones who were lost.',
    step: 'Ho-Oh opens its wings and the roof tiles catch fire without burning. It wants to see you stand in the light.',
    offering: 'You hang the Rainbow Wing from the highest bell. It rings once by itself. Your team feels whole again.',
    answer: 'Ho-Oh circles the tower nine times and every bell answers it. It comes down shining, and stays.' }),
  ev('mysticticket-rock', 'MysticTicket: Navel Rock', G, {
    keyItem: 'mysticticket', rarity: 'epic', requires: [earned('mysticticket')], pokemon: 'lugia', tint: '#506080', effect: 'fog',
    remembers: [{ id: 'both-with-you', when: [withYou('lugia'), withYou('ho-oh')], notice: 'Lugia and Ho-Oh are both with you. Navel Rock goes quiet for them.', hide: [0, 1], addChoices: [
      ch('Let them go up and down together.', out('One climbs, one dives. When they come back, they come back side by side, and the rock is warm from top to bottom.', sign('lugia', 2), sign('ho-oh', 2), heal(), fr(5), moment('Lugia and Ho-Oh met at Navel Rock because you brought them both.', 95))),
    ] }],
  },
    'The MysticTicket came after you had answered one of them. Now Navel Rock rises out of the sea in front of you.\n\nAt the top, a rainbow that does not fade. At the bottom, water deeper than any light.\n\nThe ticket says only: CHOOSE.',
    [
      ch('Climb to the top.', fight('Ho-Oh is waiting at the summit, in the rainbow. It lifts its wings.', legendFight(['ho-oh'], [flag('ho-oh-key-met'), sign('ho-oh', 2)], 5)), { requires: [notWithYou('ho-oh')] }),
      ch('Go down into the deep.', fight('Lugia is waiting at the bottom, in the dark. The water starts to turn.', legendFight(['lugia'], [flag('lugia-key-met'), sign('lugia', 2)], 5)), { requires: [notWithYou('lugia')] }),
      ch('Leave the ticket on the rock.', out('You lay the ticket on the middle step. From above, a warm wind. From below, a cool one. Your team sleeps well that night.', heal(), sign('lugia'), sign('ho-oh'), fr(2))),
    ]),
  place({ id: 'eon-ticket-island', name: 'Eon Ticket: Southern Island', key: 'eon-ticket', legend: 'latias', tint: '#e07090', effect: 'float',
    intro: 'The Eon Ticket is stamped with a sea you had never seen until today.\n\nSouthern Island is small: one tree, warm sand, a ring of sea. Two shapes circle above the tree.\n\nOne of them is the girl from the canal city. She came to say thank you.',
    step: 'Latias swoops down and stops a hand\'s width from your nose. It wants to play, and it plays hard.',
    offering: 'You leave the ticket under the tree with a Soul Dew\'s worth of flowers. Latias sings above you, and your team feels lighter.',
    answer: 'Latias and the island\'s other shape fly a loop around the tree, laughing. Latias comes back with the sea in its eyes.' }),
  place({ id: 'light-stone-reshiram', name: 'Light Stone: Reshiram', key: 'light-stone', legend: 'reshiram', tint: '#f0f0f0', effect: 'fire', lv: 5,
    intro: 'The tower answered you, and now the Light Stone will not cool down.\n\nIt pulls you to a white field where the snow melts in a ring. In the middle, the stone opens like an eye.\n\nReshiram has not forgotten what you said you believe.',
    step: 'White fire pours out of the stone and becomes Reshiram. It asks, without words, whether you still believe it.',
    offering: 'You set the stone down in the melted ring and say what you believe out loud. The fire dims to a warm glow.',
    answer: 'Reshiram looks at the stone it slept in for so long, and then at you. It chooses the road.' }),
  place({ id: 'dark-stone-zekrom', name: 'Dark Stone: Zekrom', key: 'dark-stone', legend: 'zekrom', tint: '#202040', effect: 'sparkle', lv: 5,
    intro: 'The tower answered you, and now the Dark Stone crackles in your bag every night.\n\nIt leads you to a black field where storms circle and never land. The stone opens like a fist.\n\nZekrom has not forgotten what you said should be true.',
    step: 'Black lightning pours out of the stone and becomes Zekrom. It asks whether your ideal is still worth a fight.',
    offering: 'You set the stone down and tell it the ideal you still hold. The storm stops circling and moves on.',
    answer: 'Zekrom looks at the dark stone, then at you, and the storm in its tail goes quiet. It chooses the road.' }),

  // ---------------------------------------------------------------- Mythical keys: the Visit condition
  door({ id: 'auroraticket-island', name: 'AuroraTicket: Birth Island', key: 'auroraticket', mythical: 'deoxys', tint: '#c05040', effect: 'sparkle',
    intro: 'The AuroraTicket arrived the night you heard of the Visitor for the third time. Nobody sent it.\n\nBirth Island is bare rock and one black triangle. As you step closer, the triangle shifts, and shifts again.\n\nIt is learning the shape of you.',
    choices: [
      ['Step in time with it.', 'You step when it shifts. It shifts faster. You keep up. The triangle splits open, and Deoxys comes out of it, curious.', [flag('deoxys-answered')]],
      ['Stand still.', 'You do not move. The triangle stops too. After a long time, it opens, and Deoxys is standing there, copying your stillness.', [flag('deoxys-answered')]],
      ['Change your lead.', 'You send out someone new. The triangle turns to look. Deoxys steps out wearing almost the same shape.', [flag('deoxys-answered'), fr(2, 'lead')]],
    ] }),
  door({ id: 'old-sea-map-island', name: 'Old Sea Map: Faraway Island', key: 'old-sea-map', mythical: 'mew', tint: '#f0a0c0', effect: 'float',
    intro: 'The Old Sea Map turned up in your bag after the third story about the Ancestor. It is drawn in crayon.\n\nFaraway Island is tall grass and warm wind. Something pink giggles somewhere in it.\n\nThe map has one more line, in the same crayon: FIND ME.',
    choices: [
      ['Play hide-and-seek.', 'You look for an hour. It finds you first, every time, and laughs until it falls over in the grass.', [flag('mew-played'), fr(2)]],
      ['Lie down in the grass.', 'You lie down and look at the sky. Something small lies down beside you and looks too.', [flag('mew-trusted')]],
      ['Call out a hello.', 'The grass goes still. Then a pink head pops up right in front of you, upside down.', []],
    ] }),
  door({ id: 'liberty-pass-garden', name: 'Liberty Pass: Liberty Garden', key: 'liberty-pass', mythical: 'victini', tint: '#e08040', effect: 'sparkle',
    intro: 'The Liberty Pass came after the third story about the Victory Star. It is stamped with a V.\n\nUnder the lighthouse on Liberty Garden, a basement door stands open.\n\nSomething tiny with a V on its head is sitting on the stairs, waiting to see why you came.',
    choices: [
      ['"To win."', 'Victini grins and flashes a V at you with both hands. That was the right kind of honest.', [flag('victini-honest')]],
      ['"For them."', 'You point at your team. Victini looks at them for a long time, then hops onto your lead\'s head.', [flag('victini-them'), fr(1)]],
      ['"I just heard you were here."', 'Victini laughs, a small bright sound, and comes down the last stair to meet you.', []],
    ] }),
  ev('azure-flute-hall', 'Azure Flute: Hall of Origin', G, { keyItem: 'azure-flute', rarity: 'epic', requires: [earned('azure-flute'), flagIs('arceus-judged', 0, 0)], pokemon: 'arceus', tint: '#f0e8c0', effect: 'glint' },
    'The Azure Flute came to you on the last road, because your Guest is still beside you and you never broke your word.\n\nYou play it. One note. Stairs of light rise out of the ground, step by step, into the sky.\n\nAt the top, a hall with sixteen pedestals. Someone is listening.',
    [
      ch('Climb the stairs.', out('The stairs hold. Your team climbs behind you without a word.', room('co-my11-again'))),
      ch('Play the flute again, softer.', out('The second note is for your Guest. It goes up the stairs first, and you follow it.', fr(2), room('co-my11-again'))),
      ch('Put the flute away.', leave('The stairs fade. The flute stays warm in your bag, but the hall does not open again this run.')),
    ]),

  // ---------------------------------------------------------------- The two who no longer sell them
  ev('flute-maker', 'The Flute Maker', G, { rarity: 'epic', minStage: 7, cast: ['trainer.musician'], effect: 'float', tint: '#101830',
    remembers: [{ id: 'has-key', when: [{ kind: 'itemAny', ids: ['azure-flute', 'auroraticket', 'old-sea-map', 'liberty-pass', 'silver-wing', 'rainbow-wing', 'mysticticket', 'eon-ticket'] }], notice: 'She hears the key in your bag before she sees it, and smiles.', addChoices: [
      ch('Let her hear the key.', out('She holds it to her ear like a shell. "Oh. Somebody earned this one." She plays the tune it hums, and your team sleeps sound.', heal(), fr(2))),
    ] }] },
    'A craftsman sits on a crate, playing a blue flute that is only nearly finished.\n\nFlute Maker: "People used to come to buy this. I stopped selling. You cannot buy what it opens."\nFlute Maker: "But I can tell you how it is earned."',
    [
      ch('"How is the flute earned?"', out('"Keep one Promise all the way to the last road," she says. "A Mythical walks beside you; you never break your word. Then the flute finds you." She plays you a few notes of it.', { kind: 'flag', key: 'telling-any', amount: 1 }, attr('intelligence', 1))),
      ch('"And the tickets?"', out('"Hear of a Mythical three times and believe it. The ticket comes on its own. Wings and stones come from a Legendary\'s Trial. Nobody sells any of them. Not honestly."', sign('own'), attr('intelligence', 1))),
      ch('Just listen.', out('She plays the unfinished song. It is beautiful, and it stops in the middle, and somehow that is right.', heal(0.5), fr(1))),
    ]),
  ev('old-collector', 'The Old Collector', G, { rarity: 'rare', minStage: 4, cast: ['trainer.hiker'], effect: 'glint',
    remembers: [{ id: 'has-key', when: [{ kind: 'itemAny', ids: ['oaks-letter', 'works-key', 'secret-key', 'magma-stone', 'silver-wing', 'rainbow-wing', 'mysticticket', 'eon-ticket', 'light-stone', 'dark-stone', 'auroraticket', 'old-sea-map', 'liberty-pass', 'azure-flute'] }], notice: 'His eyes go straight to your bag. "You have one. May I see?"', addChoices: [
      ch('Show him the key.', out('He holds it up to the light with shaking hands. "I spent my life buying copies. This one is real." He will not take it. He gives you something of his instead.', any('relic-statue', 'relic-crown', 'ruby', 'sapphire'), good(1))),
    ] }] },
    `An old man keeps a glass case of tickets and stones. Every one has a SOLD card, faded, and every one is a copy.\n\n${KEYS_TOLD}\nThe Old Collector: "I can tell you who to ask."`,
    [
      ch('Battle him for his best piece.', fight('"Show me your strength, then. Not for a ticket. For a good afternoon."', trainer('Collector', { size: 3, lv: 3, win: [$(1500), any('leftovers', 'focus-sash', 'life-orb', 'scope-lens')] })), { requires: [fierce] }),
      ch('"Who do I ask?"', out('"A Legendary\'s Trial gives its wing, its stone, its letter. A Mythical, heard of three times, sends its own ticket. Go and listen to the road."', { kind: 'flag', key: 'telling-any', amount: 1 }, attr('intelligence', 2))),
      ch('Listen to his stories.', out('He tells you about the ones he never saw. He tells them like a man who still hopes.', attr('intelligence', 2), fr(1))),
    ]),
  ev('ruins-dig', 'Ruins Dig Site', G, { rarity: 'rare', minStage: 5, cast: ['boss.cynthia-masters'], effect: 'shake', tint: '#302418' },
    'Researchers dig at ancient ruins. Two hollows in the dirt, one scorched black and one scorched white, are empty.\n\nCynthia: "The stones were here. They left on their own, a long time ago."\nCynthia: "They only go to someone who answers the tower. Truth or ideals."',
    [
      ch('Kneel by the hollows.', out('The black hollow is cold. The white one is warm. Between them, in the dirt, a carving of a third shape that is neither.', sign('tao'), sign('kyurem'))),
      ch('Help the dig.', out('The team pays well, and Cynthia shows you a mural of two dragons back to back.', $(1000), any('soft-sand', 'hard-stone', 'spell-tag', 'metal-coat')), { check: 'strength', fail: out('Hard work, little to show. Cynthia thanks you anyway.', $(200)) }),
      ch('"Where is the tower?"', out('Cynthia draws you a map. "A divided town, and a tower above it. The stones will find you there, if you are honest."', sign('tao'), attr('intelligence', 1))),
    ]),

  // ---------------------------------------------------------------- Communion upgrades (form items)
  ev('kyurem-black', 'The Dark Stone Fusion', G, { keyItem: 'kyurem-black', rarity: 'epic', requires: [earned('kyurem-black')], pokemon: 'kyurem-black', effect: 'spin', tint: '#080818' },
    'The empty vessel has been cold and hungry all this way. Tonight it is not.\n\nKyurem and Zekrom face each other across your camp. The ice in Kyurem\'s hollow cracks, and black lightning crawls into it.\n\nIt is waiting to be made whole by whatever comes near.',
    [
      ch('Let them fuse.', out('Zekrom folds into the ice like a storm into a cloud. Black Kyurem stands up, whole for the first time, and roars at the sky.', form('kyurem', 'kyurem-black', 'zekrom'), moment('Kyurem took Zekrom into itself and became Black Kyurem.', 95)), { requires: [species('kyurem'), species('zekrom')] }),
      ch('Not now.', out('You step between them. The lightning crawls back. Both of them look at you, and wait.')),
    ]),
  ev('kyurem-white', 'The Light Stone Fusion', G, { keyItem: 'kyurem-white', rarity: 'epic', requires: [earned('kyurem-white')], pokemon: 'kyurem-white', effect: 'spin', tint: '#181830' },
    'The empty vessel has been cold and hungry all this way. Tonight it is not.\n\nKyurem and Reshiram face each other across your camp. The ice in Kyurem\'s hollow steams, and white fire pours into it.\n\nIt is waiting to be made whole by whatever comes near.',
    [
      ch('Let them fuse.', out('Reshiram folds into the ice like the sun into a frozen lake. White Kyurem rises, whole for the first time, and the snow around it melts.', form('kyurem', 'kyurem-white', 'reshiram'), moment('Kyurem took Reshiram into itself and became White Kyurem.', 95)), { requires: [species('kyurem'), species('reshiram')] }),
      ch('Not now.', out('You step between them. The fire draws back. Both of them look at you, and wait.')),
    ]),
  ...(['tornadus', 'thundurus', 'landorus'] as const).map((who) => ev(`${who}-mirror`, `The Reveal Glass: ${cap(who)}`, G, {
    keyItem: `${who}-therian`, rarity: 'epic', requires: [earned(`${who}-therian`)], pokemon: `${who}-therian`,
    effect: who === 'tornadus' ? 'float' : who === 'thundurus' ? 'sparkle' : 'shake',
  },
    `Your blessing is in Communion now, and the Forces of Nature know it.\n\nA shrine in the middle of farmland holds a round glass. It shows the sky, the storm and the field, and then ${cap(who)}, not as it walks with you, but as it truly is.\n\nThe glass asks if you want to see.`,
    [
      ch('Show the true form.', out(`The glass flashes. ${cap(who)} changes: the cloud falls away and the beast underneath stands up, wild and bright. Therian Forme.`, form(who, `${who}-therian`), moment(`The Reveal Glass showed ${cap(who)} as it truly is.`, 90)), { requires: [species(who)] }),
      ch('Look away.', out('You turn the glass to face the field. The crops lean toward it, and grow a little taller.')),
    ])),
  ev('meteorite-deoxys', 'The Meteorite', G, { keyItem: 'meteorite', rarity: 'epic', requires: [earned('meteorite'), flagIs('promise-deoxys')], pokemon: 'deoxys', effect: 'sparkle', tint: '#100820' },
    'Deoxys is your Guest, and you have kept changing with it. Tonight a meteorite comes down beside your camp, small and still hot.\n\nDeoxys touches it, and its body shifts through four shapes in one breath.\n\nIt looks at your team, then at you. Which shape, for the road ahead?',
    [
      ch('Attack Forme.', out('Its arms sharpen. Your whole team stands a little forward, ready to hit harder, until the region ends.', { kind: 'tempEffect', label: 'The Meteorite: Attack Forme', until: 'region', effects: [{ kind: 'damageMultiplier', value: 1.15 }] }, form('deoxys', 'deoxys-attack'), flag('deoxys-forme-attack'))),
      ch('Defense Forme.', out('It thickens and settles. Your team feels harder to knock down, until the region ends.', { kind: 'tempEffect', label: 'The Meteorite: Defense Forme', until: 'region', effects: [{ kind: 'damageTakenMultiplier', value: 0.85 }] }, form('deoxys', 'deoxys-defense'), flag('deoxys-forme-defense'))),
      ch('Speed Forme.', out('It goes thin and quick. Your team moves first more often, until the region ends.', { kind: 'tempEffect', label: 'The Meteorite: Speed Forme', until: 'region', effects: [{ kind: 'statMultiplier', stat: 'spe', value: 1.5 }] }, form('deoxys', 'deoxys-speed'), flag('deoxys-forme-speed'))),
      ch('Normal Forme.', out('It settles back into itself. A little of everything, for everyone, until the region ends.', { kind: 'tempEffect', label: 'The Meteorite: Normal Forme', until: 'region', effects: [{ kind: 'damageMultiplier', value: 1.05 }, { kind: 'damageTakenMultiplier', value: 0.95 }] }, flag('deoxys-forme-normal'))),
    ]),
  ev('odd-keystone-spiritomb', 'The Odd Keystone', G, { keyItem: 'odd-keystone', rarity: 'epic', requires: [earned('odd-keystone'), flagIs('odd-spirits', 108, 9999)], pokemon: 'spiritomb', effect: 'fog', tint: '#181028' },
    'The Odd Keystone has been getting heavier all run. Every Ghost-type you knocked out and let go left a whisper in it.\n\nTonight it has one hundred and eight. They are all talking at once.\n\nThe crack down its middle is glowing.',
    [
      ch('Break the keystone.', out('The stone splits. A hundred and eight voices pour out, swirl, and knot together into one grinning shape. Spiritomb follows you out of the mist.', { kind: 'join', species: ['spiritomb'], types: [], levelBonus: 1, shinyMultiplier: 1 }, moment('A hundred and eight spirits gathered in the Odd Keystone, and Spiritomb came out of it.', 90))),
      ch('Set the spirits free.', out('You carry the keystone to a shrine and lay it down. The voices go quiet, one by one, and say thank you. Your team sleeps without dreams.', heal(), good(2), fr(3))),
    ]),

  // ---------------------------------------------------------------- Reactions: a Legendary in the party, a Mythical Guest
  ev('researcher-recognizes-legendary', 'A Researcher Recognizes Something', 'Legendary reactions', { rarity: 'rare', minStage: 3, requires: [{ kind: 'partyTag', tag: 'legendary' }], cast: ['trainer.scientist_f'], effect: 'glint', tint: '#405070',
    remembers: [{ id: 'communion', when: [flagIs('blessing-communion')], notice: 'She sees the blessing\'s object in your bag, glowing, and her hands start to shake.', addChoices: [
      ch('Show her the blessing.', out('She reads the old words on it out loud, and gets them right. "It chose you twice," she says. "The blessing, and then itself."', { kind: 'research', amount: 20 }, sign('own'), moment('A researcher saw your Legendary and its blessing together, and wept.', 85))),
    ] }] },
    'A researcher stops dead in the road and stares at your party.\n\nResearcher: "That one. I have only read about it. Three books, all of them wrong."\nResearcher: "Please. Let me record it. I will be quick."',
    [
      ch('"Go ahead."', out('She sketches fast, talking the whole time. When she shows you, the drawing is good. Your Legendary looks at it for a long time.', { kind: 'research', amount: 15 }, $(800), fr(2))),
      ch('"What do the books say?"', out('She tells you what the books got wrong, and what one old book got right. You learn a place your Legendary would like.', sign('own'), attr('intelligence', 2))),
      ch('"It\'s not a specimen."', out('She stops, and puts the pencil away. "No. You are right. I am sorry." She bows to your Legendary, and it bows back.', good(1), fr(3))),
    ]),
  ev('researcher-recognizes-mythical', 'A Researcher Recognizes Something', 'Legendary reactions', { rarity: 'rare', minStage: 3, requires: [flagIs('guest-any')], cast: ['trainer.scientist_f'], effect: 'sparkle', tint: '#504070' },
    'A researcher stops dead in the road. She is not looking at your party. She is looking just behind you, at your Guest.\n\nResearcher: "Nobody has ever seen one walk beside a person. Nobody."\nResearcher: "Please. Let me record it."',
    [
      ch('"You can try."', out('She raises her camera. Every photo comes out blank, except one: you, smiling, and a small blur of light by your shoulder. She gives it to you.', { kind: 'research', amount: 10 }, fr(2))),
      ch('"Ask it yourself."', out('She kneels and asks, very politely. Your Guest thinks about it, then lets her draw it for exactly one minute.', { kind: 'research', amount: 15 }, good(1))),
      ch('"Please keep it a secret."', out('She closes her notebook. "Then I never saw it." Your Guest comes a step closer to you, and stays there.', good(2), fr(3))),
    ]),
];

/** Nothing retired: each of these ids is rebuilt in place. */
export const REMOVE: string[] = [];
