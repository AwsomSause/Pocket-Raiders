// Kanto Canon Spaces, KANTO_PLACED_2.md (first half): Celadon City (Stage 4), Fuchsia City (Stage 5), Saffron City (Stage 6).
// Every scripted line of the doc is kept word for word; the prose around the lines is expanded.
import type { Json } from '../dsl.ts';
import { EXTRA, SPACES, retired, followup, later, intel, kind, afford, battle, buy, c, cash, flag, foe, fr, has, heal, is, item, join, moment, not, o, relic, space, teach, temp, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_2';
const rep = (n = 1): Json => flag('rep', n);
const rocket: Json = { kind: 'evil', team: 'rocket' };
const party = (species: string): Json => ({ kind: 'partySpecies', species });
const ptype = (type: string, absent = false): Json => ({ kind: 'partyType', type, ...(absent ? { absent: true } : {}) });
const heat = (x: Json): Json => ({ kind: 'evil', ...x });
const lose = (id: string, count = 1): Json => ({ kind: 'loseItem', id, count });

// ============================================================ CELADON CITY (Stage 4)

// ---------- Celadon Department Store
{
  const s = space(E, { id: 'cs.kanto.celadon.mart', town: 'celadon', name: 'Celadon Department Store', kind: 'HUB', appears: 'always', flags: [], section: `${DOC}: Celadon Department Store`,
    placed: { stage: [4], home: 10, sits: 'plus', attaches: 'plus', badge: 'A shopping bag', level: null, often: 'Once per run; it can be re-entered until the stage ends' } });
  const lift = (text: string) => c('Back to the lift.', o(text, s.open('lift')));
  const out = c('Out through the revolving door.', o('The revolving door turns you out into the street, and the noise of the store closes behind you like a lid. Miss Stott waves from the lift, already announcing a floor to nobody.'));
  const floors = [
    c('Ground floor: the service counter.', o('Miss Philippa Stott: "Ground floor! Service. Sit down, you look dreadful, it\'s free." There is a bench, and a woman with a clipboard, and a Chansey who takes one look at your party and starts work without being asked. When you stand up again, everyone is whole.', heal(1), s.open('lift'))),
    c('Up: the shop floors.', o('The lift doors fold shut with a sound like a polite cough, and the whole box rises.', s.open('shops'))),
    c('Roof!', o('Miss Philippa Stott: "Roof! Mind the wind. Mind the Pidgey. Mind the girl, she\'s thirsty." The doors open on sky.', { kind: 'addEvent', eventId: 'cs-kanto-celadon-rooftop' })),
    c('"Four and a half, please."', o('Miss Stott\'s finger stops over the panel. She looks at you properly for the first time. Miss Philippa Stott: "...Four and a half. You\'ve heard about it, then." She presses a button that isn\'t there, and the lift stops between floors.', s.open('dolls'))),
  ];
  s.entry('Celadon Department Store',
    'Six floors of glass, lit from inside like a lantern somebody left on for you. Everything in Celadon seems to lean a little towards it. Inside the doors there\'s a lift, and in the lift a lift attendant in a pillbox hat, Miss Philippa Stott, who announces every floor as if it\'s news, to whoever is in the lift, and sometimes to nobody at all.',
    floors);
  s.room('lift', 'Celadon Department Store: The Lift', 'Miss Stott has her white glove on the panel and her eyes on you. "Going up? Going down? Going round in circles? It\'s all the same price."', [...floors.slice(1), out]);
  s.room('shops', 'Celadon Department Store: Going Up', 'The lift hums upward past the floors, and Miss Stott has a line ready for every one of them.',
    [
      c('Second floor.', o('Miss Philippa Stott: "Second! Things in bottles."', s.open('f2'))),
      c('Third floor.', o('Miss Philippa Stott: "Third! Discs. Don\'t ask me what\'s on them, I\'ve got a Jigglypuff, it knows one song."', s.open('f3'))),
      c('Fourth floor.', o('Miss Philippa Stott: "Fourth! He\'ll tell you what you need. He\'s usually right. It\'s infuriating."', s.open('f4'))),
      c('Fifth floor.', o('Miss Philippa Stott: "Fifth! Rocks at silly prices."', s.open('f5'))),
    ], { remembers: [{ id: 'song', when: [is('kanto-route-song')], notice: 'Miss Stott, between floors: "Oh, that one. Mine learned it from that one. I\'ve not slept properly since."' }] });
  s.room('f2', "Celadon Department Store: Trainer's Market", 'Second floor, the Trainer\'s Market: Poké Balls in pyramids, and medicine for the road in rows of little bottles. Nothing here works in the middle of a battle; the clerk is firm about that.',
    [buy('Poké Ball ×5', 1000, 'Five red-and-white Balls in a paper bag with the store\'s crest on it.', item('poke-ball', 5)), buy('Great Ball ×3', 1800, 'Three Great Balls, wrapped like presents, because that is how the store wraps everything.', item('great-ball', 3)),
      buy('Medicine for the road', 500, 'The clerk sees to it there and then: a bottle for each Pokémon, a bandage for the one that limps. Your party leaves the floor steadier than it came in.', heal(0.5), { kind: 'cure' }), lift('Back into the lift. Miss Stott: "Bottles! Lovely."')]);
  const tms = (label: string, ids: string[]): Json => buy(label, 3000, 'The clerk slides a disc out of its sleeve and into yours, and won\'t say what\'s on it until you\'re out of the shop. "Different every visit," he says. "That\'s the fun."', { kind: 'itemFrom', ids, count: 1 });
  s.room('f3', 'Celadon Department Store: The TM Counter', 'Third floor, the TM Counter. Five discs in a glass case, a different five every visit. The clerk has stopped trying to keep them in any order.',
    [tms('A disc from the top shelf', ['tm-fire', 'tm-water', 'tm-electric', 'tm-ice', 'tm-grass']), tms('A disc from the middle shelf', ['tm-fighting', 'tm-ground', 'tm-rock', 'tm-flying', 'tm-poison']),
      tms('A disc from the bottom shelf', ['tm-psychic', 'tm-ghost', 'tm-dark', 'tm-dragon', 'tm-bug', 'tm-steel', 'tm-normal']), lift('Back into the lift.')]);
  const point = (what: string) => `The Wise Man: "Show me your six. ...Mm. You're strong where you're already strong. Buy the one that covers the gap. I'll point. I won't push." He points, without looking, at ${what}. The price on it is the same as on all the others. It's advice, never a trick.`;
  s.room('f4', 'Celadon Department Store: The Wise Man', point('the shelf for this stage\'s Gym'),
    [buy('Charcoal', 2000, 'A lump of charcoal that is warm in the hand and never cools.', item('charcoal')), buy('Sharp Beak', 2000, 'A beak, polished, pointed, faintly ridiculous and very sharp.', item('sharp-beak')),
      buy('Never-Melt Ice', 2000, 'It sweats cold in your palm and doesn\'t get any smaller.', item('nevermeltice')), lift('Back into the lift. The Wise Man doesn\'t watch you go. He\'s already looking at the next six.')],
    { scene: { cast: [] }, effects: [], remembers: [
      { id: 'fire', when: [ptype('fire', true)], intro: point('the Charcoal: nobody in your six burns, and the Gym on this stage grows things') },
      { id: 'flying', when: [ptype('flying', true)], intro: point('the Sharp Beak: nobody in your six flies, and the Gym on this stage roots') },
      { id: 'ice', when: [ptype('ice', true)], intro: point('the Never-Melt Ice: you have fire and wings, but nothing that freezes') },
    ] });
  s.room('f5', 'Celadon Department Store: Evolution Stones', 'Fifth floor: one of each Kanto stone on velvet, at one and a half times what they\'re worth. The clerk calls this "the Celadon price" and says it with love.',
    [buy('Fire Stone', 3000, 'It glows a little in the shade of your hand.', item('fire-stone')), buy('Water Stone', 3000, 'It has a sound inside it, like a shell.', item('water-stone')), buy('Thunder Stone', 3000, 'The hairs on your arm stand up when you pick it up.', item('thunder-stone')),
      c('The other two stones.', o('The clerk lifts the velvet on the next tray.', s.open('f5b')))]);
  s.room('f5b', 'Celadon Department Store: Evolution Stones', 'The second tray: the leaf, and the moon.',
    [buy('Leaf Stone', 3000, 'It smells of a garden after rain.', item('leaf-stone')), buy('Moon Stone', 3000, 'It is very slightly cold, the way the night is.', item('moon-stone')), lift('Back into the lift. Miss Stott: "Rocks! Silly prices. I did say."')]);
  s.room('dolls', 'Celadon Department Store: The Doll Floor',
    'Shelves of Poké Dolls to the ceiling, on every wall, in every colour, all of them smiling at the lift. One shop girl, asleep at the till with her cheek on her hand. A Poké Doll lets you leave one wild battle. And then one of the dolls blinks. It\'s a Clefairy, and it\'s been here a week.',
    [buy('A Poké Doll', 600, 'You leave the money under the sleeping girl\'s hand. The doll is soft and slightly too heavy, the way the good ones are.', item('poke-doll-escape')),
      c('Buy it.', o('It\'s ₽0; it was never stock. The Clefairy climbs down off the shelf by itself, takes your finger in one small hand and does not let go of it all the way down in the lift. The shop girl never wakes. Somewhere on a shelf there is now a gap the exact shape of a friend.', join(['clefairy'], { levelBonus: -2 }), moment('Bought a Clefairy for nothing on the Doll Floor of the Celadon store.'))),
      c('Leave it. It looks happy.', o('It does look happy, up there among the others, with a very good view of the lift. It blinks at you once more as the doors close. You think it might have been a thank-you.', fr(1, 'party'))),
      lift('Miss Stott takes you back up into the ordinary floors and pretends the half-floor was never there.')]);
}

// ---------- Rooftop Vending (inside the Store; it never takes a slot)
{
  const s = space(E, { id: 'cs.kanto.celadon.rooftop', town: 'celadon', name: 'Rooftop Vending', kind: 'EV', appears: 'roll', parent: 'cs.kanto.celadon.mart', flags: [], section: `${DOC}: Rooftop Vending`,
    placed: { stage: [4], home: 10, sits: 'plus', attaches: 'plus', badge: 'None: it\'s part of the Store', level: null, often: 'Once per run' } });
  const TM: Record<string, string> = { water: 'ice-beam', soda: 'rock-slide', lemonade: 'tri-attack' };
  const DRINK: Record<string, [string, number]> = { water: ['Fresh Water', 200], soda: ['Soda Pop', 300], lemonade: ['Lemonade', 350] };
  const gift = (d: string, mother: boolean) => o(
    mother
      ? `Her mother is on the fifth floor, exactly where she said, twice. She looks at you, and at the girl, and says yes as though she has been waiting all day for someone to ask. Tibby gets her ${DRINK[d]![0]}. She drinks it in one go, gasps, and then gives you her best thing: a TM, which she's been using as a coaster. There's a ring on it.`
      : `You put the ${DRINK[d]![0]} in her hands. She holds it the way people hold things they didn't expect to be allowed. Then, very seriously, she gives you her best thing: a TM, which she's been using as a coaster. There's a ring on it.`,
    teach(TM[d]!), ...(mother ? kind() : []), moment('Bought a thirsty girl a drink on the Celadon roof, and got her coaster.'));
  s.entry('Rooftop Vending',
    'Three vending machines on the roof of the Department Store, humming in the wind, and a small girl looking at them the way people look at mountains. The girl, Tibby: "I\'m not allowed any. I\'m only looking." Her mother is on the fifth floor. This is known because the girl says so, twice. The machines sell Fresh Water at ₽200, Soda Pop at ₽300 and Lemonade at ₽350, and they mend 30, 50 and 70 HP on the road, never in a battle.',
    [
      c('Buy drinks.', o('The machines take your coins with a sound like a sigh.', s.open('machines'))),
      c('Buy her one.', o('Tibby looks at you, and at the machines, and back at you, and doesn\'t dare say which.', s.open('herone'))),
      c('Go and find her mother first.', o('Tibby comes with you, holding the hem of your jacket, the whole way down to the fifth floor.', s.open('mother'))),
      // KANTO_PLACED_6: the Festival of Dolls changes the Store for this visit (a roll: half of runs).
      c('Banners on the far side of the roof: PRINCESS FESTIVAL.', o('A crowd that\'s all elbows, and a knockout on the roof.', { kind: 'addEvent', eventId: 'cs-kanto-celadon-festival' }), { chance: 0.5, fail: o('The banners are still in their box. "Next year," says a man on a ladder. "Probably."') }),
    ]);
  const ITEM: Record<string, string> = { water: 'rooftop-fresh-water', soda: 'rooftop-soda-pop', lemonade: 'rooftop-lemonade' };
  const keep = (d: string) => buy(DRINK[d]![0], DRINK[d]![1], 'A cold can for the road. It mends on the road, never in a battle. And a drink kept is worth something to someone, somewhere, later.', item(ITEM[d]!));
  s.room('machines', 'Rooftop Vending: The Machines', 'Three machines. Fresh Water, Soda Pop, Lemonade. Tibby watches every coin go in.',
    [keep('water'), keep('soda'), keep('lemonade'), c('That\'s enough.', o('Tibby watches the cans go into your bag, one by one, and says nothing at all, very loudly.'))]);
  const herone = (d: string) => c(`${DRINK[d]![0]} (₽${DRINK[d]![1]})`, gift(d, false), { requires: [afford(DRINK[d]![1])] });
  s.room('herone', 'Rooftop Vending: Tibby', 'Tibby won\'t choose. She just looks at the machines very hard, so that you can see which one she is trying not to look at.',
    [{ ...herone('water'), success: { ...(herone('water').success as object), effects: [cash(-200), ...((gift('water', false) as { effects: Json[] }).effects)] } },
      { ...herone('soda'), success: { ...(herone('soda').success as object), effects: [cash(-300), ...((gift('soda', false) as { effects: Json[] }).effects)] } },
      { ...herone('lemonade'), success: { ...(herone('lemonade').success as object), effects: [cash(-350), ...((gift('lemonade', false) as { effects: Json[] }).effects)] } },
      c('Turn out your empty pockets.', o('Tibby looks at your empty pockets, and at you, and pats your arm. "It\'s all right," she says. "I\'m only looking too."'))]);
  s.room('mother', 'Rooftop Vending: The Fifth Floor', 'Her mother is by the stones, holding a Moon Stone up to the light. She sees Tibby and sees you and puts the stone down. "She\'s told you she isn\'t allowed. She told you twice. ...Which one does she want?"',
    [c('Fresh Water.', gift('water', true)), c('Soda Pop.', gift('soda', true)), c('Lemonade.', gift('lemonade', true))]);
  // The thirsty guard at Saffron (Stage 6): a drink kept is traded for a rare item.
  const trade = (d: string, prize: string, what: string) => c(`Give him the ${DRINK[d]![0]}.`, o(`He drinks it standing up, in his box, without taking his eyes off the gate, and he makes the noise of a man who has been saved. Then he reaches under the counter. "I was keeping this for a special occasion. This is it." ${what}`, lose(ITEM[d]!), item(prize)), { requires: [has(ITEM[d]!)] });
  s.room('guard', 'Saffron Gate: The Thirsty Guard', 'The gate into Saffron has a guard box, and the guard box has a guard, and the guard has a very dry mouth. Guard: "I\'m not supposed to leave the box. Eleven hours. Is that— is that lemonade?"',
    [trade('water', 'rare-candy', 'A Rare Candy.'), trade('soda', 'pp-up', 'A PP Up.'), trade('lemonade', 'lucky-egg', 'A Lucky Egg.'),
      c('Keep walking.', o('He watches you go, and the drink go with you, with the dignity of a man who will not beg in uniform.'))],
    later({ requires: [{ kind: 'kc', act: 'holdsAny', ids: Object.values(ITEM) }] }));
  followup(s.id('guard'), [6]);
}

// ---------- Game Corner
{
  const s = space(E, { id: 'cs.kanto.celadon.gamecorner', town: 'celadon', name: 'Game Corner', kind: 'EV', appears: 'roll', flags: [], section: `${DOC}: Game Corner`,
    placed: { stage: [4], home: 14, window: [12, 16], sits: 'optional', attaches: 'after', badge: 'A coin', level: 0, often: 'Once per run' } });
  const coins = (n: number) => flag('kanto-coins', n);
  const luck: Json[] = [{ kind: 'item', id: 'lucky-egg' }];
  const pull = (label: string, odds: number, pay: number) => c(`${label}: 10 coins, pays ${pay} (${Math.round(odds * 100)}% on its face)`, o(`The reels spin and stop, one, two, three. It pays: ${pay} coins rattle into the tray, and the man at the next machine looks at you with naked envy.`, coins(pay - 10), s.open('floor')), { requires: [is('kanto-coins', 10)], chance: odds, fail: o('The reels spin and stop, one, two, three, on nothing in particular. The machine eats the coins with a little electronic laugh.', coins(-10), s.open('floor')) });
  const broke = c('Ask the clerk for the house tradition.', o('Mr. Thrupp: "House tradition. You carry it till the Gym. Then you bin it and you\'re clean." He hands over a Bad Luck Charm: a bent coin on a string. Your Luck is one lower for the rest of this stage. Heat\'s unaffected.', { kind: 'stageAttribute', key: 'luck', amount: -1 }, flag('kanto-coins-broke')), { requires: [not('kanto-coins'), is('kanto-coins-played'), not('kanto-coins-broke')] });
  const entryChoices = [
    buy('Buy fifty coins', 500, 'Mr. Thrupp counts out fifty coins into a plastic cup, one at a time, as though each one is going somewhere he will miss it.', coins(50), flag('kanto-coins-played'), s.open('floor')),
    c('The prize counter.', o('The prize counter glows at the back like an altar.', s.open('prizes'))),
    c('The machine at the back.', o('There\'s one machine at the back with no odds on its face at all, and a man standing in front of it.', s.open('back')), { requires: [rocket, { kind: 'storyRaid', n: 2 }] }),
    c('Leave.', o('You leave the noise behind. Outside, the evening is very quiet, and your ears ring with it.')),
  ];
  s.entry('Game Corner',
    'Noise and coloured light. A sign: ROCKET GAME CORNER: THE PLAYGROUND FOR GROWN-UPS. Somebody\'s painted over the first word, badly. The Honest Trade Card is shown at the door: coins cost ₽10 each, and each machine shows its payout odds on its face. A man at the machines, not looking up: "They pay out. They do. I\'ve seen it. Tuesday." Coin clerk, Mr. Barnaby Thrupp: "Fifty coins minimum. No, I don\'t know why the poster\'s got an R on it. It came with the building."',
    entryChoices, { remembers: [{ id: 'won', when: [is('kanto-hideout-won')], intro: 'The Game Corner reopens under the coin clerk. Every machine has its odds on. The first word of the sign\'s gone: it just says GAME CORNER now, freshly painted, and Mr. Thrupp is very proud of the lettering.', hide: [2] }] });
  s.room('floor', 'Game Corner: The Machines', 'Rows of machines, every one with its odds printed on its face. A Lucky Egg or an Amulet Coin in your party raises them, and the raised number is shown too.',
    [pull('The door machine', 0.35, 30), pull('The cherry machine', 0.15, 80), c('Cash in and go to the counter.', o('You scoop the cup up and go.', s.open('prizes'))), broke],
    { remembers: [{ id: 'luck', when: luck, addChoices: [pull('The door machine, lucky', 0.45, 30)], hide: [0], notice: 'The Lucky Egg in your bag seems to hum along with the machines. The number on the door machine\'s face ticks up while you watch.' }] });
  const prize = (label: string, price: number, text: string, ...effects: Json[]) => c(`${label} (${price} coins)`, o(text, coins(-price), ...effects), { requires: [is('kanto-coins', price)] });
  s.room('prizes', 'Game Corner: The Prize Counter', 'Five prizes, one from each tier, each with its coin price on a little card. Common: Abra. Uncommon: Scyther. Rare: Porygon. Very rare: Dratini. Jackpot: a TM, or a Shiny Stone.',
    [prize('Abra', 120, 'The Abra arrives asleep, and teleports into your bag the moment you look away.', join(['abra'], { levelBonus: -2 })),
      prize('Scyther', 400, 'The Scyther is handed over by a clerk wearing oven gloves.', join(['scyther'], { levelBonus: -2 })),
      c('The rare and jackpot shelf.', o('Mr. Thrupp unlocks the top shelf with a key on a long chain.', s.open('top'))),
      c('Back to the machines.', o('Back into the noise.', s.open('floor')))]);
  s.room('top', 'Game Corner: The Top Shelf', 'Mr. Thrupp: "These are the ones people lose houses over. Don\'t lose a house."',
    [prize('Porygon', 900, 'The Porygon is delivered on a floppy disk, and then, after a moment\'s thought, as itself.', join(['porygon'], { levelBonus: -2 })),
      prize('Dratini', 1500, 'The Dratini is in a fish tank, and it looks at you as if it has been waiting for exactly you.', join(['dratini'], { levelBonus: -2 })),
      prize('Jackpot: a TM or a Shiny Stone', 2500, 'The jackpot bell rings for you, and everyone in the hall turns round to hate you a little.', s.open('jackpot')),
      c('Back to the counter.', o('Mr. Thrupp locks the top shelf again, slowly, so you can watch.', s.open('prizes')))]);
  s.room('jackpot', 'Game Corner: The Jackpot', 'Three discs in a velvet box, and a stone that throws light all over the ceiling. You can have one.',
    [c('TM Thunderbolt.', o('It crackles in its sleeve.', teach('thunderbolt'))), c('TM Flamethrower.', o('The sleeve is warm.', teach('flamethrower'))), c('TM Ice Beam.', o('There\'s frost on the sleeve.', teach('ice-beam'))),
      c('The Shiny Stone.', o('Mr. Thrupp shades his eyes while he hands it over.', item('shiny-stone')))]);
  s.room('back', 'Game Corner: The Back Machine', 'One machine at the back has no odds on its face. It never pays. A Grunt, standing in front of it, sweating: "It\'s broken. It\'s— don\'t. It\'s broken."',
    [
      c('Pull the lever.', o('You pull it once. Nothing. Twice. Nothing. By the seventh pull the Grunt has gone a colour you\'ve never seen on a person, and behind the poster on the wall something heavy goes clunk and slides. A stairway, going down. The Grunt puts himself in front of it.', s.open('stairs'))),
      c('Why are you guarding a broken machine?', o('He panics and tells the truth in the form of a lie. "I\'m not guarding it! There\'s nothing under it!" You both look at the floor under it.', intel(), s.open('back2'))),
      c('Leave it.', o('You leave him with his broken machine. He watches you all the way to the door, and doesn\'t breathe until you\'re through it.')),
    ]);
  s.room('back2', 'Game Corner: The Back Machine', 'The Grunt is now standing very firmly on the bit of floor that has nothing under it.',
    [c('Pull the lever.', o('Seven pulls. A clunk behind the poster. A stairway going down, and a Grunt in front of it.', s.open('stairs'))), c('Leave it.', o('You leave. He sags against the machine.'))]);
  s.room('stairs', 'Game Corner: Behind the Poster', 'The door of the Hideout raid, behind the poster. The Grunt: "I said it was broken. I said."',
    [c('Battle.', battle('He fights like a man who has already decided whose fault this is.', foe('Rocket Grunt', { evil: 'grunt', evilTeam: 'rocket', size: 2, levelBonus: 0, win: [moment('Found the stairway behind the Game Corner poster.'), { kind: 'addEvent', eventId: 'cs-kanto-celadon-hideout-1' }] })))]);
}

// ---------- Celadon Mansion
{
  const s = space(E, { id: 'cs.kanto.celadon.mansion', town: 'celadon', name: 'Celadon Mansion', kind: 'EV', appears: 'roll', flags: ['kanto.mansion.key'], section: `${DOC}: Celadon Mansion`,
    placed: { stage: [4], home: 16, sits: 'town', attaches: 'town', badge: 'A key', level: -2, often: 'Once per run' } });
  const floors = [
    c('The Study, on the second floor.', o('Up a flight of stairs that creaks on every step.', s.open('study'))),
    c('The Rooftop.', o('Up, and up, and out into the wind.', s.open('roof'))),
    c('Up the back stairs.', o('The back stairs are narrow and dark and smell of somebody else\'s house.', s.open('back'))),
    c('Thank her for the tea, and go.', o('Mrs. Tansley: "Come back. They like a new face. So do I, though I\'d never tell them."')),
  ];
  s.entry('Celadon Mansion',
    'A tall house with a back door nobody\'s supposed to know about. Everybody knows about it. In the lobby an old woman is pouring tea for a Meowth, a Clefairy and a Nidoran♀, in three good china cups. The landlady, Mrs. Winifred Tansley: "Sit. They\'ve had theirs. You\'ll want the top floor; there\'s something up there needs a person."',
    floors);
  const diploma = (n: number, seen: number, pct: number) => c(`Show them: ${seen} seen.`, o(`The artist counts. Then counts again. Then fetches a certificate from a drawer, blows the dust off, and signs it with a flourish that goes right off the edge of the paper. A Diploma, for ${seen} seen: a permanent small bonus.`, relic(`kanto-diploma-${n}`, `Celadon Diploma (${seen} seen)`, [{ kind: 'ordinaryXpMultiplier', value: 1 + pct / 100 }]), s.open('lobby')), { requires: [{ kind: 'dex', set: 'seen', atLeast: seen }] });
  s.room('study', 'Celadon Mansion: The Study', 'Desks, drawings pinned to every wall, people who haven\'t slept. An artist: "How many\'ve you seen? ...No. Show me. ...I drew that one from a description. I got the ears wrong."',
    [diploma(3, 100, 6), diploma(2, 60, 4), diploma(1, 30, 2), c('Back downstairs.', o('You leave them to their ears.', s.open('lobby')))],
    { remembers: [{ id: 'rocket', when: [rocket], addChoices: [c('Look behind the drawing on the far wall.', o('Behind a drawing of a Snorlax, a floor plan that isn\'t of this building. Corridors. Lifts. A room marked BOSS in a hand that pressed too hard. You copy it into your notebook.', intel(), intel(), s.open('lobby')))], hide: [2], notice: 'One drawing on the far wall hangs crooked, as if someone moved it in a hurry.' }] });
  s.room('roof', 'Celadon Mansion: The Rooftop', 'A bench and a view of the whole of Celadon. One Pokémon left here a while comes back closer to you. Your lead looks at the bench, and at you.',
    [c('Sit with one of them a while.', o('You sit. It sits. Nobody says anything, and Celadon goes on below you, and when you get up again something has been settled between you that you couldn\'t name.', fr(10, 'picked'), s.open('lobby')), { pick: {} }),
      c('Back downstairs.', o('Down again.', s.open('lobby')))]);
  s.room('back', 'Celadon Mansion: The Back Room', 'Up the back stairs, a small room with one window. A Poké Ball on a table, with a note. The note: "Left with the landlady. Good-natured. Eats anything. Couldn\'t keep it where I\'m going. Please."',
    [c('Open the Ball.', o('An Eevee comes out yawning, sniffs your boots, and sits on them. Mrs. Tansley, from the doorway: "There. I said it needed a person." She gives you a key on a ribbon. "The back door. Come up to the roof whenever you like. Nobody\'ll stop you; nobody ever has."', join(['eevee'], { levelBonus: -2 }), flag('kanto-mansion-eevee'), flag('kanto-mansion-key'), moment('Took in the Eevee someone left at Celadon Mansion.'))),
      c('Leave it for someone who can keep it.', o('You leave the Ball where it is, and the note on top of it. On the stairs you hear the landlady say, to the empty room, "Well. Somebody will."'))]);
  s.room('lobby', 'Celadon Mansion: The Lobby', 'Mrs. Tansley is pouring a fourth cup, for no one in particular.', floors);
  // The Mansion Key: the Rooftop can be visited again from a later Kanto stage.
  s.room('key', 'Celadon Mansion: The Back Door', 'The key on its ribbon still fits. Up the back stairs, out onto the roof, and there\'s the bench, and the view, and the wind.',
    [c('Sit with one of them a while.', o('Nothing has changed up here, and that is the whole point of it.', fr(10, 'picked')), { pick: {} }), c('Just look at the view.', o('Celadon below, lit up, and every road you have walked since.', fr(1, 'party')))],
    later({ requires: [is('kanto-mansion-key')] }));
  followup(s.id('key'), [5, 6, 7, 8]);
}

// ---------- Eeveelution Brothers
{
  const s = space(E, { id: 'cs.kanto.celadon.eevee', town: 'celadon', name: 'Eeveelution Brothers', kind: 'EV', appears: 'roll', flags: ['kanto.eevee', 'kanto.eevee.mikey'], section: `${DOC}: Eeveelution Brothers`,
    placed: { stage: [4], home: 12, window: [10, 14], sits: 'optional', attaches: 'after', badge: 'Three coloured stones', level: 0, often: 'Once per run' } });
  const B: Record<string, { name: string; mon: string; stone: string; word: string }> = {
    water: { name: 'Rainer', mon: 'vaporeon', stone: 'water-stone', word: 'Water' }, thunder: { name: 'Sparky', mon: 'jolteon', stone: 'thunder-stone', word: 'Thunder' },
    fire: { name: 'Pyro', mon: 'flareon', stone: 'fire-stone', word: 'Fire' }, leaf: { name: 'the cousin', mon: 'leafeon', stone: 'leaf-stone', word: 'Leaf' }, ice: { name: 'the cousin', mon: 'glaceon', stone: 'ice-stone', word: 'Ice' },
  };
  const fight = (pick: string, by: string) => battle(
    `${B[pick]!.name === 'the cousin' ? 'The cousin' : B[pick]!.name} crows. ${B[by]!.name} goes red to the ears: "Fine. FINE. Prove it, then. One on one." His ${B[by]!.mon[0]!.toUpperCase() + B[by]!.mon.slice(1)} steps out onto the lawn, and the garden party goes very quiet.`,
    foe(B[by]!.name === 'the cousin' ? 'Pyro' : B[by]!.name, { team: [B[by]!.mon], size: 1, levelBonus: 0, win: [join([B[pick]!.mon]), item(B[pick]!.stone), flag('kanto-eevee'), moment(`Settled the Eeveelution Brothers' argument: ${B[pick]!.word}.`)] }));
  const stone = (pick: string, a: string, b: string) => c(`${B[pick]!.word}.`, fight(pick, a), { chance: 0.5, fail: fight(pick, b) });
  const brothers = [stone('water', 'thunder', 'fire'), stone('thunder', 'water', 'fire'), stone('fire', 'water', 'thunder')];
  const askEevee = c('Ask the Eevee.', o('It hides behind Mikey\'s legs. The brothers look at it. For once, none of them says anything. Then Mikey picks it up, and it stops shaking, and that seems to be the answer.', ...kind(), flag('kanto-eevee'), flag('kanto-eevee-mikey')));
  const askMikey = c('Ask Mikey.', o('Mikey: "I like it how it is." A long pause. Pyro: "...That\'s allowed, is it?" Nobody has ever asked Mikey before. He goes pink to the ears, and holds his Eevee a bit tighter, and looks taller.', ...kind(), flag('kanto-eevee'), flag('kanto-eevee-mikey')));
  s.entry('Eeveelution Brothers',
    'A garden party. Three brothers in three colours, each holding a stone, all talking at once at a fourth, much smaller boy holding an Eevee. Rainer: "Water. It\'s obvious. Look at it, it wants to swim." Sparky: "It wants to go fast. Thunder." Pyro: "You\'re both wrong, and you\'re wrong coldly. Fire." The small one, Mikey: "...Can I think about it?" All three: "NO." They see you. Three stones are held out. Rainer: "You. Stranger. Settle it. Which is best?"',
    [c('Pick a stone.', o('Three stones, three faces, all leaning in.', s.open('stones')), { chance: 0.75, fail: o('Before you can answer, a cousin arrives late, out of breath, carrying a Leaf Stone and an Ice Stone. "Did I miss it? Don\'t say I missed it."', s.open('cousin')) }), askEevee, askMikey],
    { remembers: [{ id: 'mansion', when: [party('eevee'), is('kanto-mansion-eevee')], notice: 'The brothers see your Eevee. "Oh, excellent. A second opinion." The stone won can be used on it at once, or kept.' }] });
  s.room('stones', 'Eeveelution Brothers: Which Is Best?', 'Rainer, Sparky, Pyro. Water, Thunder, Fire. Mikey, at the back, says nothing at all.', [...brothers, askMikey]);
  s.room('cousin', 'Eeveelution Brothers: The Fourth Stone', 'Now there are five stones, and four people shouting, and one Eevee asleep through all of it.',
    [brothers[0]!, brothers[2]!, c('Leaf. Or Ice.', o('The cousin beams so hard the brothers stop arguing to stare at him.', s.open('cousin2'))), askMikey]);
  s.room('cousin2', 'Eeveelution Brothers: The Cousin\'s Stones', 'Leaf, or Ice. The cousin holds both out, one in each hand, like scales.',
    [c('Leaf.', fight('leaf', 'fire'), { chance: 0.5, fail: fight('leaf', 'water') }), c('Ice.', fight('ice', 'fire'), { chance: 0.5, fail: fight('ice', 'thunder') })]);
}

// ---------- Tea House & Gardens
{
  const s = space(E, { id: 'cs.kanto.celadon.tea', town: 'celadon', name: 'Tea House & Gardens', kind: 'SHOP', appears: 'roll', flags: [], section: `${DOC}: Tea House & Gardens`,
    placed: { stage: [4], home: 18, sits: 'plus', attaches: 'plus', badge: 'A teacup', level: null, often: 'Once per run' } });
  const talk = [
    c('"It\'s a beautiful garden."', o('Erika smiles, and doesn\'t say thank you, because you can see she thinks the garden did it all by itself. You sit a long time.', fr(1, 'party'))),
    c('"Doesn\'t the Gloom smell?"', o('Erika: "It does. I thought so too, once. Then one saved my life, and I\'ve never smelled it since. Odd, that." The Gloom, asleep in her lap, sighs, and nobody minds.', fr(1, 'party'))),
    c('"Do you ever leave?"', o('Erika: "The garden needs someone. I don\'t mind being who." She pours you another cup, and you realise you don\'t mind either, for a while.', fr(1, 'party'))),
  ];
  s.entry('Tea House & Gardens',
    'A low house in a garden. Shoes off at the door. Somebody\'s asleep under a tree, and nobody minds. It\'s Erika, here as the host, outside her Gym. Erika, waking: "Oh. I\'m so sorry. I was— the Gloom was warm. Will you take tea? It mends more than people think it does."',
    [
      c('Take tea.', o('The tea is green and very hot and tastes faintly of the garden. Every move\'s PP is restored and every status cured, for the whole party. Free, once.', { kind: 'restorePp' }, { kind: 'cure' }, s.open('talk'))),
      buy('Rest', 300, 'A room at the back, a futon, the sound of water in the garden all night. Everyone wakes whole.', heal(1)),
      c('Bow, and leave her to her garden.', o('Erika bows back from the floor, and is asleep again before you\'ve got your shoes on.')),
    ], { remembers: [{ id: 'vial', when: [is('kanto-perfume-foiled')], notice: 'She pours the tea herself, and there\'s a vial beside the cup. "From the gardeners," she says. "The real ones. They asked me to say thank you properly."' }] });
  s.room('talk', 'Tea House & Gardens: Over Tea', 'Erika pours a second cup, and waits, in no hurry at all, to see what you\'ll talk about.', talk);
}

// ---------- Perfume Heist
{
  const s = space(E, { id: 'cs.kanto.celadon.perfume', town: 'celadon', name: 'Perfume Heist', kind: 'EV', appears: 'roll', flags: ['kanto.perfume.foiled', 'kanto.perfume.lost', 'kanto.trio.met'], section: `${DOC}: Perfume Heist`,
    placed: { stage: [4], home: 7, window: [5, 9], sits: 'optional', attaches: 'after', badge: 'A perfume bottle', level: 0, often: 'Once per run' } });
  const VIAL = item('perfume-vial');
  const trio = flag('kanto-trio-met');
  const decide = [
    c('"You\'re Team Rocket."', battle('"Prepare for trouble—" "—and make it—" The motto is started, and abandoned halfway, because the scarves are caught in each other and in the wheelbarrow and very nearly in the Meowth. "Just fight them!" A double battle.',
      foe('Jessie and James', { team: ['ekans', 'koffing'], size: 2, format: 'doubles', levelBonus: 0, win: [VIAL, rep(2), flag('kanto-perfume-foiled'), moment('Unmasked three very bad gardeners at the Celadon perfume garden.')] }), trio)),
    c('"Nice hats." (walk away)', o('"Thank you!" says the tall one, much too pleased. They take the perfume. Nothing\'s lost, not by you. But there will be no vial on Erika\'s tea tray.', trio, flag('kanto-perfume-lost'))),
    c('"Need a hand with that wheelbarrow?"', o('You push the wheelbarrow, straight to the head gardener. No battle. The trio can\'t object without admitting it, and stand in a row with their mouths open. Jessie\'s last line: "That was low. I respect it."', VIAL, rep(2), trio, flag('kanto-perfume-foiled'), moment('Wheeled a barrow of stolen perfume straight back to its gardener.'))),
  ];
  const look = (label: string, text: string, _key: string) => c(label, o(text, s.open('clues')));
  s.entry('Perfume Heist',
    'A perfume garden, rows and rows of it, and the air so thick with scent you can lean on it. Three new "gardener girls" in headscarves. One\'s very tall. One has a moustache. One is about two feet high and keeps its hat pulled down. The tall one: "We\'re the new girls! We love... leaves!" The one with the moustache: "And the smells. The valuable, valuable smells." The short one: "Meow— me, oh my, what a lovely day." Head gardener, Miss Rosalind Akers: "They came this morning. They\'re very keen. They\'ve watered the gravel twice."',
    [c('Look around first.', o('You may examine three things before deciding.', s.open('clues'))), ...decide],
    // KANTO_PLACED_2, Jessie, James and Meowth: "A running line. Each time they're met, Meowth counts."
    { remembers: [{ id: 'count', when: [is('kanto-trio-met')], notice: 'The short one, under its hat, is counting on its claws: "That\'s another one, twerp. We\'re keepin\' a list."' }] });
  s.room('clues', 'Perfume Heist: Looking Around', 'The three new gardeners are being extremely busy about nothing, and keep glancing at you.',
    [look('The wheelbarrow.', 'It\'s full of bottles, under one leaf.', 'kanto-perfume-barrow'), look('The short one\'s hat.', 'There\'s a coin under it. A large gold one. On its forehead.', 'kanto-perfume-hat'),
      look('The watering can.', 'It\'s got an R on it, in pen, crossed out, with "G for Gardener" written over.', 'kanto-perfume-can'), c('Decide.', o('You\'ve seen enough.', s.open('decide')))]);
  s.room('decide', 'Perfume Heist: Decide', 'Three gardeners. One wheelbarrow. One leaf on top of a great many bottles.', decide);
}

// ============================================================ FUCHSIA CITY (Stage 5)

// ---------- Warden's Gold Teeth (inside Safari Land)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.warden', town: 'fuchsia', name: "Warden's Gold Teeth", kind: 'EV', appears: 'roll', requires: { spaces: ['cs.kanto.fuchsia.safari'] }, flags: [], section: `${DOC}: Warden's Gold Teeth`,
    placed: { stage: [5], home: 12, window: [12, 14], sits: 'optional', attaches: 'after', badge: 'A tooth', level: null, often: 'Once per run' } });
  const done = (text: string, ...x: Json[]) => o(`${text} The Warden, teeth in: "Ah! There. I said: 'Thank you, you're a credit.' ...I didn't say soup. Who said soup?" He gives you TM Strength and a Safari Pass: ten more Safari Balls.`, teach('strength'), item('safari-ball', 10), moment('Found the Safari Warden\'s gold teeth.'), ...x);
  s.entry("Warden's Gold Teeth",
    'The Warden\'s at the gate, talking. Nobody can understand a word. The Warden: "Hif fuf fuh hoof ee hiff!" Gate attendant, Mr. Cuthbert Lowe: "He\'s lost his teeth. In the Zone. He was shouting at a Kangaskhan and they came out. He\'d like them found. I think. It\'s that or he wants soup." There are three areas, and each one has a clue that says whether the teeth are there, without stepping in.',
    [c('Look at the Center first.', o('A Psyduck is holding its head harder than usual, staring at something shiny in the pond.', s.open('center')), { chance: 0.4, fail: o('The Psyduck in the Center pond is holding its head exactly the usual amount. Not here.', s.open('elsewhere')) }),
      c('"It\'s soup. He definitely wants soup."', o('The Warden looks at you with enormous, toothless betrayal.'))]);
  s.room('elsewhere', "Warden's Gold Teeth: Area 2 or Area 3", 'Two areas left. The Warden follows you, gumming furiously.',
    [c('Look over Area 2.', o('A Nidorino that keeps smiling.', s.open('area2')), { chance: 0.58, fail: o('The Nidorinos in Area 2 aren\'t smiling at all. And over in Area 3, a Kangaskhan\'s young is wearing something gold.', s.open('area3')) })]);
  s.room('center', "Warden's Gold Teeth: The Center", 'The Psyduck, the pond, and something shiny under the water.',
    [c('Wade in.', done('You wade in up to the knee and come out with them. The Psyduck looks relieved to be able to stop staring.'))]);
  s.room('area2', "Warden's Gold Teeth: Area 2", 'The Nidorino grins at you with a mouthful of gold.',
    [c('Hold out your hand.', done('It thinks about it, and spits them into your palm, and goes back to looking like a Nidorino.'))]);
  s.room('area3', "Warden's Gold Teeth: Area 3", 'A Kangaskhan\'s young, wearing them, and very pleased about it. Its mother is right there.',
    [c('Trade it something.', done('You offer it a Berry. It weighs the Berry against the teeth, and the Berry wins.')),
      c('Ask the mother.', done('The mother looks at you a long time. Then she reaches into the pouch and takes them away from her baby, and holds them out, and the baby howls, and she doesn\'t mind at all.')),
      c('Wait till it\'s bored.', done('Waiting costs one Safari step, and always works. The young one drops them in the grass and wanders off after a butterfly.', { kind: 'loseItem', id: 'safari-ball', count: 1 }))]);
}

// ---------- Tauros Stampede (inside Safari Land)
{
  const s = space(E, { id: 'cs.kanto.fuchsia.tauros', town: 'fuchsia', name: 'Tauros Stampede', kind: 'EV', appears: 'roll', requires: { spaces: ['cs.kanto.fuchsia.safari'] }, flags: ['kanto.tauros.dodged', 'kanto.trio.met'], section: `${DOC}: Tauros Stampede`,
    placed: { stage: [5], home: 12, window: [12, 14], sits: 'optional', attaches: 'after', badge: 'A dust cloud', level: 0, often: 'Once per run' } });
  const balls = [has('safari-ball')];
  const caught = (more: string) => o(`The Ball shakes once in the dust and holds. A Tauros with Intimidate. ${more}`, join(['tauros'], { ability: 'intimidate' }), flag('kanto-tauros-caught'), lose('safari-ball'), s.open('more'));
  const net = o('A net\'s strung between two trees. The herd goes through it, and through the three people holding it, without slowing. No battle. James, from a tree, afterwards: "I counted thirty. I think I was hit by all of them." Meowth, from under the net, counting on its claws: "That\'s another one, twerp. We\'re keepin\' a list."', flag('kanto-trio-met'));
  s.entry('Tauros Stampede',
    'The ground hums. The horizon\'s the wrong colour, and it\'s getting closer. Tauros. Thirty of them. They aren\'t angry. They\'re just going somewhere, and you\'re standing in it. The odds are shown.',
    [
      c('Dodge (100% safe).', o('The herd parts round you like water round a stone. No catch. A very good view: thirty backs going past at the height of your head, and the smell of dust and grass and hot animal, and then they\'re gone. One Tauros stops, looks back at you, and catches the herd up.', flag('kanto-tauros-dodged'))),
      c('Bait (40% per ball, up to six throws).', o('You scatter bait. The herd slows to eat.', s.open('bait')), { requires: balls }),
      c('Rock (25% per ball, each throw costs one extra ball).', o('You throw a rock. The herd stampedes. Faster, and it costs more.', s.open('rock')), { requires: balls }),
    ], { remembers: [{ id: 'trio', when: [{ kind: 'xflag', flag: 'trioFriendly' }], notice: 'Between two trees, at the far edge of the plain, three people are stringing a net.' }] });
  const throwBait = c('Throw (40%).', caught('It stands among the grazing herd as if it had always meant to come with you.'), { requires: balls, chance: 0.4, fail: o('The Ball bounces off a broad back. The Tauros doesn\'t even look up from the grass.', lose('safari-ball'), flag('kanto-tauros-throws'), s.open('bait')) });
  s.room('bait', 'Tauros Stampede: Bait', 'The herd grazes round you. Six throws at most before they move on.',
    [throwBait, c('Let them go.', o('You lower the Ball. The herd finishes the bait and goes on its way, unhurried.'))],
    { remembers: [{ id: 'spent', when: [is('kanto-tauros-throws', 6)], hide: [0], notice: 'The bait is gone. The herd lifts its heads, all at once, and moves on.' }] });
  s.room('rock', 'Tauros Stampede: Rock', 'The herd thunders past. Every throw costs two balls.',
    [c('Throw (25%).', caught('It skids to a halt out of the stampede as though it chose to.'), { requires: [{ kind: 'item', id: 'safari-ball', count: 2 }], chance: 0.25, fail: o('Two Balls gone in the dust.', lose('safari-ball', 2), s.open('rock')) }),
      c('Let them go.', net)]);
  s.room('more', 'Tauros Stampede: Another?', 'The herd is still there. Each one caught past the first becomes a Tauros Charm, and the extra Tauros are sent home to the Safari.',
    [c('Another (40%).', o('Another one, and a Tauros Charm for it; the Tauros itself is walked home to the Safari by a ranger who doesn\'t look surprised.', item('tauros-charm'), lose('safari-ball'), s.open('more')), { requires: balls, chance: 0.4, fail: o('It shrugs off the Ball and rejoins the herd.', lose('safari-ball')) }),
      c('That\'s enough.', o('You let the rest of them go. They have somewhere to be.'))]);
  // Remembers: if the player dodged, the one that looked back is in the same spot, and comes with a single ball.
  s.room('back', 'Tauros Stampede: The One That Looked Back', 'It\'s in the same spot. It has been, by the look of the grass, for some time.',
    [c('Hold out one Ball.', o('It walks up to the Ball and puts its nose on it. 100%.', join(['tauros'], { ability: 'intimidate' }), lose('safari-ball')), { requires: balls }), c('Leave it be.', o('It watches you go, and doesn\'t follow, and you think it understands.'))],
    later({ requires: [is('kanto-tauros-dodged'), not('kanto-tauros-caught')] }));
  followup(s.id('back'), [5]);
}

// ---------- Fuchsia Zoo
{
  const s = space(E, { id: 'cs.kanto.fuchsia.zoo', town: 'fuchsia', name: 'Fuchsia Zoo', kind: 'SHOP', appears: 'roll', flags: ['kanto.zoo.water', 'kanto.zoo.normal', 'kanto.zoo.fossil'], section: `${DOC}: Fuchsia Zoo`,
    placed: { stage: [5], home: 17, sits: 'town', attaches: 'town', badge: 'A paw print', level: null, often: 'Once per run' } });
  const sign = (type: string, label: string, text: string) => c(label, o(`${text} For the rest of the stage, you know how ${type}-type wild Pokémon fight.`, flag(`kanto-zoo-${type}`), intel(), s.open('candy')));
  s.entry('Fuchsia Zoo',
    'Paddocks, not cages: low fences, and signs in a child\'s handwriting. Zookeeper, Miss Henrietta Bell: "They\'re not kept. They\'re visiting. The Chansey\'s been visiting six years. The signs are my niece\'s. She\'s very accurate." The signs: "LAPRAS. It is shy. Do not sing at it, it will sing back and then you have to stay." "KANGASKHAN. Do not look at the baby. She knows."',
    [sign('water', 'Read the Lapras sign.', 'You read every word, and then the small print, which says "it is still shy".'),
      sign('normal', 'Read the Kangaskhan sign.', 'You read it without looking at the baby. She knows anyway.'),
      c('The empty paddock.', o('Empty, with a sign: "OMANYTE. It is not here yet. Uncle says somebody has to wake one up."', s.open('fossil'))),
      buy('One Rare Candy, once', 10000, 'Miss Bell takes it out of a locked tin: "From the Chansey. Don\'t ask." A Rare Candy.', item('rare-candy'))]);
  s.room('candy', 'Fuchsia Zoo: The Shop', 'The zoo shop, which is a table by the gate with a tin on it.',
    [buy('One Rare Candy, once', 10000, 'From the Chansey. Don\'t ask. A Rare Candy.', item('rare-candy')), c('Thank her and go.', o('"Come back," says Miss Bell. "They like visitors. They\'re visitors themselves."'))]);
  s.room('fossil', 'Fuchsia Zoo: The Fossil Paddock', 'Empty, with a sign: "OMANYTE. It is not here yet. Uncle says somebody has to wake one up."',
    [c('Let your revived fossil visit for a while.', o('It walks into the paddock as if it owns it. By the time you come back for it, the niece has rewritten the sign: "IT IS HERE NOW. It is very old. Be polite." Bond +2.', fr(10, 'picked'), flag('kanto-zoo-fossil')), { pick: {}, requires: [{ kind: 'flag', key: 'kanto-fossil-revived', atLeast: 1 }] }),
      c('Leave the sign as it is.', o('Somebody will wake one up. You hope it\'s someone kind.'))]);
}

// ---------- The Snag Test
{
  const s = space(E, { id: 'cs.kanto.fuchsia.snag', town: 'fuchsia', name: 'The Snag Test', kind: 'EV', appears: 'roll', flags: ['kanto.snag.seen', 'kanto.snag.ball', 'kanto.snag.lost'], section: `${DOC}: The Snag Test`,
    placed: { stage: [5], home: 16, window: [14, 18], sits: 'optional', attaches: 'before', badge: 'A claw', level: 1, often: 'Once per run (roll, 20%)' } });
  const win: Json[] = [flag('kanto-snag-ball'), item('snag-ball'), moment('Won back a ranger\'s Rhyhorn from a Snag\'em operative.')];
  const fight = (text: string) => battle(`${text} A two-on-one: the operative and a second, and the snagged Rhyhorn's on their side. It fights badly. It keeps looking at the ranger.`,
    foe('Snag\'em operatives', { team: ['rhyhorn', 'sandslash'], size: 2, format: 'doubles', levelBonus: 1, win: [...win, { kind: 'moment', text: 'The Rhyhorn ran straight back to its ranger.' }],
      lose: [flag('kanto-snag-lost')] }));
  s.entry('The Snag Test',
    'A trainer battle\'s already going on at this node: a Safari ranger and a stranger in a grey jacket with one heavy sleeve. The stranger throws a Ball at the ranger\'s Rhyhorn. Not at a wild one. At hers. It closes. Ranger Corisande Brome: "That\'s— you can\'t. That\'s mine. It\'s got a name." Snag\'em operative: "Field test fourteen. Subject secured. It works on registered ones. Tell Gonzap it works."',
    [
      c('"Give it back."', fight('You step between them.')),
      c('"How does that thing work?"', fight('He explains, proudly, for too long: the sleeve, the frequency, the registration bypass. You let him finish. Then the fight, with you moving first.'), { }),
      c('"Stay out of it."', o('They leave with it. The ranger stands in the empty space where her Rhyhorn was, holding its Ball, which is empty now and will never close again. It\'s on their roster later, and you can win it back then.', flag('kanto-snag-seen'))),
    ]);
  // "How does it work" also gives Intel +1 before the fight.
  const how = (E[E.length - 1] as { choices: { success: { effects: Json[] } }[] }).choices[1]!;
  how.success.effects.unshift(intel(), flag('kanto-snag-seen'));
  (E[E.length - 1] as { choices: { success: { effects: Json[] } }[] }).choices[0]!.success.effects.unshift(flag('kanto-snag-seen'));
}

// ============================================================ SAFFRON CITY (Stage 6)

// ---------- Silph Co. Lobby
{
  const s = space(E, { id: 'cs.kanto.saffron.silph', town: 'saffron', name: 'Silph Co. Lobby', kind: 'CUT', appears: 'always', flags: ['kanto.silph.lapras', 'kanto.silph.card', 'kanto.silph.owed'], section: `${DOC}: Silph Co. Lobby`,
    placed: { stage: [6], home: 3, window: [2, 5], sits: 'must', attaches: 'after', badge: 'The Silph "S"', level: 0, often: 'Once per run' } });
  const lapras = c('"Take her somewhere they aren\'t."', o('The President, very quietly: "Somebody tried to buy her last month. Cash. Men in black. I said no, and they smiled, and I haven\'t slept well since. Take her somewhere they aren\'t." The lift goes down to a basement that smells of the sea. She\'s in a tank much too small for her, and she turns round in it to look at you, and sings one note.', join(['lapras']), flag('kanto-silph-lapras'), moment('The Silph President gave you the Lapras from his basement.')), { requires: [heat({ heatBelow: 40 })] });
  const owed = c('"Thank you. I\'ll come back."', o('He\'s frightened, and says less. The Lapras isn\'t offered now. It\'s given after the takeover\'s won, with interest: a Master Ball beside it.', flag('kanto-silph-owed')), { requires: [heat({ heat: 40 })] });
  s.entry('Silph Co. Lobby',
    'The tallest building in the city. A lobby with a fountain, a front desk, and more security than a lobby needs. Receptionist, Miss Araminta Doyle: "Welcome to Silph. He\'s expecting you. He isn\'t, but he says that about everybody; he likes people to feel expected." The President comes down himself, hand out: "You\'re the one from the papers! The bridge. The ship. Sit down. I\'ve got something in the basement that wants a better life than a basement."',
    [
      c('"Who tried to buy her?"', o('The President: "They left a card. It\'s blank. Who leaves a blank card?" He gives it to you. You hold it up to the light; nothing. It\'s a File.', intel(), flag('kanto-silph-card'), s.open('gift'))),
      c('"Why so many guards?"', o('The President: "I hired half. I don\'t know who hired the other half." He\'s realised it as he says it. He looks around the lobby at the men by the doors, and they look back.', s.open('gift'))),
      c('"Thank you."', o('He shakes your hand with both of his.', s.open('gift'))),
    ], { remembers: [{ id: 'won', when: [is('kanto-silph-won')], intro: 'The lobby\'s open; the fountain\'s working; the other half of the guards are gone. The President meets you at the door and doesn\'t let go of your hand for a long time.' }, { id: 'stranger', when: [is('kanto-silph-won'), is('kanto-pewter-stranger')], notice: 'You knew the suit at the top of the tower. Giovanni, at Silph: "The forest. You\'d gone round the oak twice. I remember thinking: that one listens. I\'ve regretted the advice since. Not the walk."' }] });
  s.room('gift', 'Silph Co. Lobby: The Basement', 'The President, looking at the lift and not at the guards: "Come and see her."', [lapras, owed]);
}

// ---------- Fighting Dojo
{
  const s = space(E, { id: 'cs.kanto.saffron.dojo', town: 'saffron', name: 'Fighting Dojo', kind: 'EV', appears: 'roll', flags: [], section: `${DOC}: Fighting Dojo`,
    placed: { stage: [6], home: 13, window: [11, 15], sits: 'optional', attaches: 'instead', badge: 'A black belt', level: 1, often: 'Once per run' } });
  const duel = (text: string, x: Json = {}, ...extra: Json[]) => battle(text, foe('Karate Master', { team: ['machamp'], size: 1, levelBonus: 1, win: [...extra, s.open('prize')], ...x }));
  const MASTER = 'The Karate Master: "We were the Gym. Then she came, and she didn\'t lift a hand, and my best four sat down and cried. One on one. My Machamp. Let me remember what winning\'s like, or let me lose to someone who uses their arms."';
  s.entry('Fighting Dojo', `A wooden hall beside a much newer, much shinier Gym. A sign, repainted many times: THE REAL SAFFRON GYM. Under it, smaller: (formerly). ${MASTER}`,
    [
      c('"One on one."', duel('He bows. His Machamp bows, with all four arms.')),
      c('"What happened with the Gym?"', o('He tells you, all of it: the girl who never raised her voice, the four black belts who sat down on the mat and wept and could not say why. He has never told it without his hands shaking. They shake now. "One on one," he says at the end. "Please."', s.open('fight'))),
      c('"I\'ll use a Psychic-type."', duel('He shuts his eyes. "...Yes. Fine. Go on. I should practise."', { rule: { leadType: 'psychic' } }, flag('kanto-dojo-psychic')), { requires: [ptype('psychic')] }),
      c('Bow, and leave.', o('You bow at the door. He bows back, from the mat, longer than you did.')),
    ], { remembers: [{ id: 'tournament', when: [is('kanto-tournament-won')], intro: 'A wooden hall beside a much newer, much shinier Gym. The Karate Master meets you at the door. He was in the crowd at the Tournament. He doesn\'t make you fight. He hands over the Ball, and asks for a lesson.', addChoices: [c('Give him a lesson.', o('You show him what you did in the final. He takes notes. A grown man, a master, taking notes, with his tongue between his teeth.', s.open('prize')))], hide: [0, 1, 2] }] });
  s.room('fight', 'Fighting Dojo: One on One', 'The Karate Master on the mat, his Machamp beside him.', [c('One on one.', duel('He bows.'))]);
  const take = (mon: string, line: string) => c(`The ${mon[0]!.toUpperCase() + mon.slice(1)}.`, o(`The Karate Master: "One kicks. One punches. That one spins; we don't know why. It arrived." ${line}`, join([mon]), moment(`Earned a ${mon[0]!.toUpperCase() + mon.slice(1)} at the Fighting Dojo.`)));
  s.room('prize', 'Fighting Dojo: The Reward', 'He bows. If you won with a Psychic-type, he bows lower than for anything else. Two Poké Balls on the mat: a Hitmonlee and a Hitmonchan.',
    [take('hitmonlee', 'The Hitmonlee stretches one leg up past its own head, as a greeting.'), take('hitmonchan', 'The Hitmonchan taps its gloves together, twice, and nods.'),
      c('"And the one that spins?"', o('A third Ball rolls out from behind the shrine. The Karate Master: "...Well. It\'s offered itself, then."', s.open('top')), { chance: 0.15, fail: o('He looks round for it. "It\'s gone off somewhere. It does that." Two Balls on the mat still.', s.open('prize2')) })],
    { remembers: [{ id: 'psychic', when: [is('kanto-dojo-psychic')], notice: 'He bows lower than for anything else.' }] });
  s.room('prize2', 'Fighting Dojo: The Reward', 'Two Poké Balls on the mat: a Hitmonlee and a Hitmonchan.', [take('hitmonlee', 'It stretches.'), take('hitmonchan', 'It nods.')]);
  s.room('top', 'Fighting Dojo: The Third Ball', 'Hitmonlee, Hitmonchan, and the Hitmontop, spinning slowly on its head on the mat, watching you upside down.',
    [take('hitmonlee', 'It stretches.'), take('hitmonchan', 'It nods.'), take('hitmontop', 'The Hitmontop stops spinning, rights itself, and walks over to you.')]);
}

// ---------- Copycat Girl
{
  const s = space(E, { id: 'cs.kanto.saffron.copycat', town: 'saffron', name: 'Copycat Girl', kind: 'EV', appears: 'roll', flags: [], section: `${DOC}: Copycat Girl`,
    placed: { stage: [6], home: 8, window: [6, 10], sits: 'optional', attaches: 'after', badge: 'A mirror', level: null, often: 'Once per run' } });
  const won = o('All four matched. She laughs, in her own voice, for the first time. TM Mimic. Then the last thing: she does the cry of your lead. It\'s perfect. Your lead answers her. Copycat, herself: "I only do the ones I like."', teach('mimic'), fr(1, 'lead'), moment('Beat the Copycat Girl at her own game.'));
  const again = o('Three or fewer. She copies your sigh, exactly. The game can be tried once more.', s.open('again'));
  s.entry('Copycat Girl',
    'A girl on a doorstep. She\'s standing exactly as you\'re standing. You stop. She stops. You tilt your head. She tilts hers. Copycat: "...I\'ll just have a look, then," in your voice, in your rhythm, word for word, the last thing you said aloud. Her mother, from a window: "She\'ll stop if you beat her at it. Nobody\'s beaten her at it." Four rounds: you pick a gesture and she copies it a beat later; then she picks, and you have to match. Her picks get faster.',
    [c('Play.', won, { prompt: ['copycat-claps', 'good'], fail: again }), c('Copy her copying you.', o('You copy her copying you. She copies you copying her copying you. It goes on for some time. Her mother laughs from the window, and the girl, very nearly, does too.'))],
    { remembers: [{ id: 'ditto', when: [party('ditto')], notice: 'Your Ditto comes out of its Ball. She and it face each other. Nobody moves for a very long time.' }] });
  s.room('again', 'Copycat Girl: Once More', 'She waits, standing exactly as you\'re standing.', [c('Once more.', won, { prompt: ['copycat-claps', 'good'], fail: o('She copies your sigh again. Then she copies you walking away, all the way to the corner.') })]);
}

// ---------- Magnet Train
{
  const s = space(E, { id: 'cs.kanto.saffron.train', town: 'saffron', name: 'Magnet Train', kind: 'EV', appears: 'roll', flags: ['kanto.train.ride'], section: `${DOC}: Magnet Train`,
    placed: { stage: [6], home: 19, sits: 'optional', attaches: 'after', badge: 'A train', level: null, often: 'Once per run' } });
  s.entry('Magnet Train',
    'A station that\'s nearly finished. One platform. One train, humming. Station master, Mr. Ignatius Tolley: "Test run. Free. She\'ll have you at the next stage\'s first town before you\'ve sat down. You\'ll miss the road, mind. Some people like the road." The Honest Trade Card: Ride, and the start of the next stage is skipped; you start further in, and the spaces you\'d have rolled there aren\'t seen. Must-see spaces, chain beats and rival battles are never skipped. Walk, and nothing changes.',
    [c('Ride.', o('It doesn\'t feel like moving. It feels like the world is being pulled past the window on a string. You are at the next stage before you\'ve sat down, just as he said.', flag('kanto-train-ride'))),
      c('Walk.', o('Mr. Tolley: "Good. I\'d have walked." He tips the hat he hasn\'t got yet.'))]);
  s.room('arrive', 'Magnet Train: The Next Stage', 'The Magnet Train lets you down past the start of the stage, beyond the first town. Behind you, the road you didn\'t walk.',
    [c('Step off.', o('You step off further in than you\'d have walked by now.', { kind: 'express' }))], later({ requires: [is('kanto-train-ride')] }));
  followup(s.id('arrive'), [7]);
}

// The old Game Corner's prize rooms sat outside its id prefix.
export const REMOVE: string[] = [...retired(EVENTS), 'cs-kanto-celadon-prizes-a', 'cs-kanto-celadon-prizes-a-p2', 'cs-kanto-celadon-prizes-b', 'cs-kanto-celadon-prizes-b-p2'].sort();
export { SPACES, EXTRA };
