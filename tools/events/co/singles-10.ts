// Catalog Overhaul Pack, category "singles" (revised single events), batch 10.
// Doc: catalog_overhaul/STORY_FAMILIES_22.md SF154 Choice Rooms (and the pocket closet's three returns from the ledger).
// Known limits: docs/status/co-singles.md.
import { $, any, bondUp, ch, egg, fight, flag, flagIs, heal, item, leave, out, room, roomFrom, scout, trainer, type Json } from '../dsl.ts';
import { friendlyAll } from './_singlesKit.ts';

export const CATEGORY = 'singles';

const moment = (text: string, importance = 40): Json => ({ kind: 'moment', text, importance });
const money = (atLeast: number): Json => ({ kind: 'money', atLeast });
const has = (id: string): Json => ({ kind: 'item', id });
const lose = (id: string): Json => ({ kind: 'loseItem', id });
const no = (key: string): Json => flagIs(key, 0, 0);
const temp = (label: string, effects: Json[], battles = 3): Json => ({ kind: 'tempEffect', label, effects, battles, until: 'battle' });
const stagePrices = (value: number): Json => ({ kind: 'tempEffect', label: `Shop prices ×${value} this stage`, effects: [{ kind: 'priceMultiplier', group: 'all', value }], until: 'boss' });
const relic = (id: string, name: string, effects: Json[]): Json => ({ kind: 'relic', id, name, effects });
const rm = (id: string, name: string, group: string, intro: string, choices: Json[], o: Json = {}): Json => ({ id, name, group, room: true, scene: { cast: [], effect: 'none' }, ...o, intro, choices });
/** The treasure chest's prize (the doc names no tier): an uncommon held item. */
const TRAP_PRIZE = ['quick-claw', 'wide-lens', 'pp-up'];
const RARE = ['leftovers', 'focus-sash', 'life-orb', 'choice-band', 'choice-specs', 'choice-scarf'];
const EPIC = ['comet-shard', 'sacred-ash', 'poke-radar', 'super-rod', 'x-attack-6', 'x-speed-6'];
const DOORS = ['rk-door-wood', 'rk-door-iron', 'rk-door-silver', 'rk-door-gold'];
/** The closet keeps one item until a later stage gives it back (`rk-pocket-closet-return*`). */
const closetBack = (id: string, key: string, itemId: string, name: string): Json => ({
  id, stop: 'event', rarity: 'uncommon', minStage: 2, callback: true, requires: [flagIs(key)],
  intro: `The same wardrobe stands at this crossroad, its door ajar, as if it has been waiting. Inside, exactly where you left it: your ${name}.`,
  choices: [ch('Take it back.', out(`You take your ${name} back. The wardrobe gives a satisfied little creak and is gone the next time you look.`, item(itemId), flag(key, -1)))],
});

// ---------- SF154. CHOICE ROOMS ----------
const SF154: Json[] = [
  {
    id: 'rk-crossroads-four',
    intro: 'Four doors in a row at the end of a long hall: wood, iron, silver, gold. A brass sign: **"Each richer, and riskier, than the last."**',
    choices: [
      ch('The wood door.', out('You open the plain wooden door.', room('rk-door-wood'))),
      ch('The iron door.', out('You heave the iron door open.', room('rk-door-iron'))),
      ch('The silver door.', out('The silver door swings open without a sound.', room('rk-door-silver'))),
      ch('The gold door.', out('The gold door is warm under your hand.', room('rk-door-gold'))),
    ],
  },
  {
    id: 'rk-door-wood',
    intro: 'A snug pantry stocked for a long trip, with a kettle on and a note: **"Help yourself, traveller. Safest door in the house."**',
    choices: [
      ch('Take supplies.', out('You fill your bag with berries, and your team sits round the kettle until everyone feels a little better.', item('pecha-berry'), item('rawst-berry'), item('aspear-berry'), heal(0.25))),
    ],
  },
  {
    id: 'rk-door-iron',
    intro: 'A sparring hall, iron floor, iron walls, and one fighter in the middle with taped hands. "A little risk. A little reward. Spar?"',
    choices: [
      ch('Spar.', fight('"Good." The fighter bows, and the hall rings.', trainer('Iron Room Fighter', { cls: 'ace-trainer', size: 3, lv: 2, types: ['fighting', 'steel'], win: [any(...RARE)] }))),
    ],
  },
  {
    id: 'rk-door-silver',
    intro: 'A glittering gallery with a single glass case in the middle and, on the case, a tiny silver alarm bell. **"Even odds,"** says the label.',
    choices: [
      ch('Open it.', out('The lid lifts. The bell does not ring. Inside, on velvet, something very valuable is yours.', any(...EPIC)), { chance: 0.5, fail: fight('The bell rings. Doors slam, and the gallery\'s guard steps out of the shadows with a very strong team. Even odds, the label said.', trainer('Gallery Guard', { cls: 'veteran', size: 4, lv: 4 })) }),
      ch('Leave it.', leave('You leave the case shut. Even odds are still odds.')),
    ],
  },
  {
    id: 'rk-door-gold',
    intro: 'A throne room with a throne no one sits on, and a crown on a cushion. A plaque: **"Wear it, and the strongest will come for you."**',
    choices: [
      ch('Put on the crown.', out('The crown fits. Something precious falls out of the cushion into your hands, and somewhere far off, the strongest trainers on the road look up. For the next three battles, they come to you.', any(...EPIC), temp('The crown: the next three foes are Aces', [{ kind: 'enemyLevelOffset', value: 3 }, { kind: 'bossMoneyMultiplier', value: 1.5 }]), moment('Wore the gold crown.', 50))),
      ch('Leave it.', leave('You leave the crown on its cushion. Some prizes cost more than they pay.')),
    ],
  },
  {
    id: 'rk-chaos-dial',
    intro: 'A dial on the wall with four settings that keep changing when you are not looking: wood, iron, silver, gold. **"Spin it, and step through whatever comes up."**',
    choices: [
      ch('Spin it hard.', out('The dial spins and spins and clicks to a stop. A door opens beside it, and you find out which room it is by walking in.', roomFrom(...DOORS))),
      ch('Spin it gently.', out('The dial turns lazily and settles. A door opens beside it, and you find out which room it is by walking in.', roomFrom(...DOORS))),
    ],
  },
  {
    id: 'rk-elevator',
    intro: 'A glass elevator with four buttons. Each floor, the little card says, is a different scene. The doors ding.',
    choices: [
      ch('Floor 1: the lobby.', out('Ding. The doors open on the lobby.', room('rk-floor-1'))),
      ch('Floor 2: the arcade.', out('Ding. Lights and noise.', room('rk-floor-2'))),
      ch('Floor 3: the clinic.', out('Ding. It smells of clean sheets.', room('rk-floor-3'))),
      ch('Floor 4: the roof.', out('Ding. Wind, and a view.', room('rk-floor-4'))),
    ],
  },
  {
    id: 'rk-floor-1',
    intro: 'A tidy lobby with a free snack table and a sign: **"Take what you need."**',
    choices: [ch('Eat.', out('Your team clears the snack table with great efficiency. Everyone feels a little better.', heal(0.25)))],
  },
  {
    id: 'rk-floor-2',
    intro: 'A tiny arcade full of blinking lights. One machine has the odds printed on it: **"Win 1 in 6. Pays 5×."**',
    choices: [
      ch('Play (₽50).', out('Three bells! The machine rattles out ₽250, five times your coin.', $(200)), { requires: [money(50)], chance: 1 / 6, fail: out('Bell, cherry, lemon. The machine eats your ₽50 and plays a sad tune. One in six, it said.', $(-50)) }),
      ch('Walk on.', leave('You leave the lights blinking.')),
    ],
  },
  {
    id: 'rk-floor-3',
    intro: 'A tiny clinic. The nurse smiles. "Right this way."',
    choices: [ch('Heal.', out('Every one of your team comes out whole, glossy and very pleased with themselves.', heal(), { kind: 'cure' }))],
  },
  {
    id: 'rk-floor-4',
    intro: 'A rooftop with a great view of the road ahead, all the way to the next stage.',
    choices: [ch('Look.', out('You look for a long time. You can see every battle waiting on the road below, and the hidden places between them.', { kind: 'riftPreview' }, { kind: 'revealStops' }))],
  },
  {
    id: 'rk-twin-nodes',
    intro: 'Two scenes side by side at the same crossroad: a cook\'s camp on the left, a market stall on the right. A guide offers to rush you through both, for a price.',
    choices: [
      ch('Left.', out('You take the left path, to the camp.', room('rk-twin-left'))),
      ch('Right.', out('You take the right path, to the stall.', room('rk-twin-right'))),
      ch('Both (₽300).', out('You pay the guide, and get both.', $(-300), room('rk-twin-left'), room('rk-twin-right')), { requires: [money(300)] }),
    ],
  },
  {
    id: 'rk-twin-left',
    intro: 'A tidy camp. A cook waves you over to a pot of stew.',
    choices: [ch('Eat.', out('You eat until nobody can move. Everyone is whole again.', heal()))],
  },
  {
    id: 'rk-twin-right',
    intro: 'A dusty market stall. The trader waves you in. "Small shop, fair prices."',
    choices: [ch('Shop.', out('The trader rolls up the shutters on a little shop.', { kind: 'addStop', stop: 'shop' }))],
  },
  {
    id: 'rk-treasure-trap',
    intro: 'Two chests in a dim cellar. A hooded figure leans against the wall between them. "One is treasure, one is a trap. I always lie, or I never do. Ask me one thing."',
    choices: [
      ch('Which is the treasure?', out('"The left." You think about it: whether they lie or not, there is only one honest way to read that, and you work it out. You open the right chest, and it is the treasure.', any(...TRAP_PRIZE))),
      ch('Which would you open?', out('"If you asked me which I\'d open, I\'d say the left." Asked that way, the answer is honest whoever they are. You open the left chest, and it is the treasure.', any(...TRAP_PRIZE))),
    ],
  },
  {
    id: 'rk-lucky-number',
    intro: 'A fortune stand with three numbered cards face down. **"Pick a number. One in three wins: ten per cent more prize money, for the whole run."**',
    choices: [
      ch('One.', out('The card flips: ONE. "The road will be generous to you."', relic('rk-lucky-number', 'Lucky Number', [{ kind: 'moneyMultiplier', value: 1.1 }])), { chance: 1 / 3, fail: out('The card flips. Not your number. "One in three," the fortune teller says kindly.') }),
      ch('Two.', out('The card flips: TWO. "The road will be generous to you."', relic('rk-lucky-number', 'Lucky Number', [{ kind: 'moneyMultiplier', value: 1.1 }])), { chance: 1 / 3, fail: out('The card flips. Not your number. "One in three," the fortune teller says kindly.') }),
      ch('Three.', out('The card flips: THREE. "The road will be generous to you."', relic('rk-lucky-number', 'Lucky Number', [{ kind: 'moneyMultiplier', value: 1.1 }])), { chance: 1 / 3, fail: out('The card flips. Not your number. "One in three," the fortune teller says kindly.') }),
    ],
  },
  {
    id: 'rk-probability-mage',
    intro: 'A mage looks at you with half-closed eyes. "I will tell you what the dice want. I will not change them."',
    choices: [ch('Tell me.', out('The mage tells you, plainly, what is waiting at each of the next three stops, and how likely each is to go your way.', scout(3)))],
  },
  {
    id: 'rk-strangers-dice',
    intro: 'A stranger shakes a pair of old bone dice. "Roll them, and the shops on this stretch will charge what the dice say. Could be cheaper. Could be dearer."',
    choices: [
      ch('Roll.', out('Snake eyes, and the stranger laughs. "Lucky. Every shop on this stretch charges you eighty per cent."', stagePrices(0.8)), { chance: 0.5, fail: out('Double sixes. "Oh dear. A hundred and twenty per cent, this stretch." The stranger looks genuinely sorry.', stagePrices(1.2)) }),
      ch('No.', leave('"Suit yourself." The dice go back in a pocket.')),
    ],
  },
  {
    id: 'rk-streak-1',
    intro: 'A little stall with a chalk board: **"THREE WINS IN A ROW: PICK ANY PRIZE!"** Game one is a coin toss.',
    choices: [
      ch('Heads.', out('Heads! One down. "Game two, next table."', room('rk-streak-2')), { chance: 0.5, fail: out('Tails. "Better luck next time," says the stallholder, wiping your name off the board.') }),
      ch('Tails.', out('Tails! One down. "Game two, next table."', room('rk-streak-2')), { chance: 0.5, fail: out('Heads. "Better luck next time," says the stallholder, wiping your name off the board.') }),
    ],
  },
  {
    id: 'rk-streak-2',
    intro: 'Game two: three cups and one marble, shuffled very fast. One in three.',
    choices: [
      ch('The left cup.', out('The marble! Two down. "Last game!"', room('rk-streak-3')), { chance: 1 / 3, fail: out('Empty. The streak ends here.') }),
      ch('The middle cup.', out('The marble! Two down. "Last game!"', room('rk-streak-3')), { chance: 1 / 3, fail: out('Empty. The streak ends here.') }),
      ch('The right cup.', out('The marble! Two down. "Last game!"', room('rk-streak-3')), { chance: 1 / 3, fail: out('Empty. The streak ends here.') }),
    ],
  },
  {
    id: 'rk-streak-3',
    intro: 'Last game: one die. Roll a five or a six. One in three, and the prize shelf is yours.',
    choices: [
      ch('Roll.', out('SIX! The stallholder throws their hands up and waves you at the prize shelf. You pick the best thing on it.', any(...EPIC), moment('Won three in a row at the streak stall.', 40)), { chance: 1 / 3, fail: out('A three. So close. The stallholder gives you a sympathetic sweet.') }),
    ],
  },
  {
    id: 'rk-echo-item',
    intro: 'A small grey stone that repeats whatever you hold up to it, not just sounds. "Show me something common," it says, in your own voice.',
    choices: [
      ch('A Poké Ball.', out('You hold up a Poké Ball. The stone hums, and now there are two.', item('poke-ball')), { requires: [has('poke-ball')] }),
      ch('A Great Ball.', out('You hold up a Great Ball. The stone hums, and now there are two.', item('great-ball')), { requires: [has('great-ball')] }),
      ch('A Repel.', out('You hold up a Repel. The stone hums, and now there are two.', item('repel')), { requires: [has('repel')] }),
      ch('Show nothing.', leave('You keep your hands in your pockets. The stone says nothing, in your voice.')),
    ],
  },
  {
    id: 'rk-mastery-echo',
    intro: 'A dojo gong with a deep, long echo that does not fade. "Ring it," says the old master, "and your next battle will teach twice."',
    choices: [ch('Ring it.', out('BONGGG. The echo goes into your team and stays there, humming. The next fight will teach them double.', temp('The gong\'s echo: double experience next battle', [{ kind: 'xpMultiplier', value: 2 }], 1)))],
  },
  {
    id: 'rk-mirror-reversal',
    intro: 'A tall mirror that shows the last thing that happened to you, backwards. In it, something you lost is coming back to you.',
    choices: [ch('Step through.', out('You step through the glass and out again, and your pockets are heavier: what you lost, the mirror gives back.', { kind: 'coFog', action: 'give', count: 2 }))],
  },
  {
    id: 'rk-pocket-closet',
    intro: 'A wardrobe that is far bigger on the inside. A voice from somewhere among the coats: "Leave something with me. I\'ll keep it safe, and you\'ll find me again down the road."',
    choices: [
      ch('Leave a Rare Candy.', out('You leave a Rare Candy on the top shelf. The door shuts softly.', lose('rare-candy'), flag('closet-candy')), { requires: [has('rare-candy'), no('closet-candy')] }),
      ch('Leave a Nugget.', out('You leave a Nugget on the top shelf. The door shuts softly.', lose('nugget'), flag('closet-nugget')), { requires: [has('nugget'), no('closet-nugget')] }),
      ch('Leave a Star Piece.', out('You leave a Star Piece on the top shelf. The door shuts softly.', lose('star-piece'), flag('closet-star')), { requires: [has('star-piece'), no('closet-star')] }),
      ch('No.', leave('You keep your things. The wardrobe sighs, like a wardrobe.')),
    ],
  },
  closetBack('rk-pocket-closet-return', 'closet-candy', 'rare-candy', 'Rare Candy'),
  closetBack('rk-pocket-closet-return-2', 'closet-nugget', 'nugget', 'Nugget'),
  closetBack('rk-pocket-closet-return-3', 'closet-star', 'star-piece', 'Star Piece'),
  {
    id: 'rk-census',
    intro: 'A clerk with a clipboard is counting Pokémon on the road. "Report your team! ₽100 for every different type in it. Variety is the spice of the census."',
    choices: [ch('Report.', out('The clerk counts your team\'s types on their fingers, twice, and pays up.', { kind: 'coCensus', per: 100 }))],
  },
  {
    id: 'rk-crowd-poll',
    intro: 'A crowd round a stream camera. "Chat votes! Your next three fights get a boost: harder hits, or faster legs. Whatever wins!"',
    choices: [
      ch('Let them vote.', out('The votes pour in. HARDER HITS wins by a mile. For the next three battles, your team hits a little harder.', temp('Chat voted: harder hits', [{ kind: 'damageMultiplier', value: 1.1 }])), { chance: 0.5, fail: out('The votes pour in. FASTER LEGS wins, just. For the next three battles, your team is a little quicker.', temp('Chat voted: faster legs', [{ kind: 'statMultiplier', stat: 'spe', value: 1.1 }])) }),
    ],
  },
  {
    id: 'rk-daily-puzzle',
    intro: 'A board in the town square posts today\'s puzzle: a ring of nine numbered tiles to set in order. Today\'s prize hangs beside it in a little net.',
    choices: [ch('Solve.', out('It takes you most of an hour, with your team offering unhelpful paws. The last tile clicks home, a bell rings, and the town hands down today\'s prize.', any('rare-candy', 'pp-up', 'star-piece', 'nugget'), moment('Solved the daily puzzle.', 25)))],
  },
  {
    id: 'rk-holiday-surprise',
    intro: 'A traveller dressed for the weather is handing out presents. "It\'s that time of year again! One each."',
    choices: [
      ch('Take a present.', out('A present wrapped in plain paper. Inside, something useful.', any('pp-up', 'nugget')), { branches: [
        { when: [{ kind: 'season', in: ['Spring'] }], text: 'A spring present: a warm egg in a nest of paper flowers.', effects: [egg()] },
        { when: [{ kind: 'season', in: ['Summer'] }], text: 'A summer present: a jar of Honey, still warm from the sun, and a Damp Rock that smells like rain.', effects: [item('honey'), item('damp-rock')] },
        { when: [{ kind: 'season', in: ['Autumn'] }], text: 'An autumn present: a basket of berries from the harvest.', effects: [item('cheri-berry'), item('chesto-berry'), item('persim-berry')] },
        { when: [{ kind: 'season', in: ['Winter'] }], text: 'A winter present: a Snowball, packed perfectly round, and a Heat Rock to keep your hands warm.', effects: [item('snowball'), item('heat-rock')] },
      ] }),
    ],
  },
  {
    id: 'rk-team-banner',
    intro: 'A seamstress hangs team banners on a line between two trees. "Pick one. It\'s only cloth. But cloth carries a little luck."',
    choices: [
      ch('The green banner: +5% catch rate.', out('You pick the green one. It flaps over your camp for the rest of the run, and wild Pokémon seem a little more willing.', relic('rk-banner-green', 'Green Banner', [{ kind: 'captureMultiplier', value: 1.05 }]))),
      ch('The gold banner: +5% prize money.', out('You pick the gold one. It flaps over your camp for the rest of the run, and prize purses seem a little heavier.', relic('rk-banner-gold', 'Gold Banner', [{ kind: 'moneyMultiplier', value: 1.05 }]))),
      ch('The red banner: +5% damage.', out('You pick the red one. It flaps over your camp for the rest of the run, and your team stands a little taller.', relic('rk-banner-red', 'Red Banner', [{ kind: 'damageMultiplier', value: 1.05 }]))),
      ch('The blue banner: +10% friendship.', out('You pick the blue one. It flaps over your camp for the rest of the run, and your team crowds under it at night.', relic('rk-banner-blue', 'Blue Banner', [{ kind: 'friendshipMultiplier', value: 1.1 }]), bondUp(1, 'party'))),
    ],
  },
];

export const EVENTS: Json[] = friendlyAll([...SF154]);
export const REMOVE: string[] = [];
