// Catalog Overhaul Pack: STORY_FAMILIES_16.md, SF103 (the Trading Post), SF105's Sandstorm Camp, SF110 (the Collectors and the
// Rich Kid) and SF111 (swaps and altars). Every Pokémon trade is an `honestTrade` (core/co/tradeCard.ts): the card shows
// both sides, level, nature, moves, quirk, history and fair value before the player agrees, and the trader warns once.
import { $, ch, flag, flagIs, heal, item, out, type Json } from '../dsl.ts';
import { mk, need, pay, rep, stay } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Trades';
const room = (e: Json): Json => ({ group: G, callback: false, ...e, room: true });
const holds = (ids: string[], label: string, count = 1): Json => ({ kind: 'holdsAny', ids, count, label });
const want = (label: string, o: Json = {}): Json => ({ label, species: [], ...o });
/** An honest trade with a fixed Pokémon. */
const trade = (id: string, wants: Json | null, gives: Json, o: Json = {}): Json => ({ kind: 'honestTrade', id, ...(wants ? { wants } : {}), gives: { marks: [], ...gives }, ...o });
/** An honest trade drawn from a pool (src/data/catalogOverhaul/tradePools/markets.json). */
const poolTrade = (id: string, pool: string, o: Json = {}): Json => ({ kind: 'honestTrade', id, pool, ...o });
const bondAny = (atLeast: number): Json => ({ kind: 'bondLevel', atLeast, who: 'any' });
const PIKA = want('a Pikachu or an Eevee', { species: ['pikachu', 'eevee'] });

const BERRIES = ['oran-berry', 'pecha-berry', 'cheri-berry', 'chesto-berry', 'rawst-berry', 'aspear-berry', 'persim-berry', 'leppa-berry', 'sitrus-berry', 'lum-berry'];
// Item tiers for the item swaps (STORY_FAMILIES_11's honest tiers: Common, Uncommon, Rare).
const COMMON_ITEMS = ['potion', 'poke-ball', 'oran-berry', 'pecha-berry', 'repel', 'antidote', 'parlyz-heal', 'awakening', 'escape-rope'];
const UNCOMMON_ITEMS = ['super-potion', 'great-ball', 'full-heal', 'sitrus-berry', 'ether', 'revive', 'heart-scale'];
const RARE_ITEMS = ['hyper-potion', 'ultra-ball', 'max-revive', 'pp-up', 'leftovers', 'focus-sash', 'scope-lens', 'expert-belt'];

/** SF110: a Collector. "Trade." / "Ask why." / "No thanks."; with a Bond 4+ Pokémon in the party, it looks at you first. */
function collector(id: string, name: string, intro: string, who: string, why: string, tr: Json, tradeText = `${who} looks over both cards once more, then nods. "Fair is fair." The swap is made gently, hand to hand.`): Json {
  return {
    id, name, group: G, intro,
    choices: [
      ch('Trade.', out(tradeText, tr)),
      ch('Ask why.', out(`${who}: "${why}"`, stay(id))),
      ch('No thanks.', out(`"Another time, maybe." ${who} doesn't push.`)),
    ],
    remembers: [{ id: `${id}-looks`, when: [bondAny(4)], notice: 'One of your Pokémon, one you have been through everything with, looks up at you, and waits.', hide: [2],
      addChoices: [
        ch('It stays.', out(`You rest a hand on it. "I'm sorry. Not this one." ${who} smiles. "I'd have said the same."`)),
        ch('It\'s okay. Go.', out('You nod to it. It looks at you a long moment, then goes. The swap is made, and it does not look back until the very last step.', tr)),
      ] }],
  };
}

export const EVENTS: Json[] = [
  // ---- SF103. The Trading Post ----
  {
    id: 'trading-post', name: 'The Trading Post', group: G,
    intro: 'A trainer waves a Poké Ball over a plank counter. Lenny Fosk: "Swap with me? Mine\'s much stronger than it looks." The Honest Trade Card says it plainly: it bites. "Only me, so far."',
    choices: [
      ch('Trade.', out('Lenny hands the Ball over carefully, fingers well clear of the latch. "Feed it before you pet it. Trust me."', poolTrade('trading-post', 'lenny-post'))),
      ch('Ask about the bite.', out('Lenny: "It was a stray. It bit the hand that caught it." He shows you the scar, almost proudly. "It\'s never bitten anyone who fed it first."', flag('lenny-asked'), stay('trading-post'))),
      ch('No thanks.', out('"Your loss," Lenny says, and rubs his scar. "Probably."')),
    ],
    remembers: [
      { id: 'lenny-fed', when: [flagIs('lenny-fed')], notice: 'The Pokémon is curled against the bars, licking Berry juice off its paw. It watches you, calm.', hide: [0, 1],
        addChoices: [ch('Trade.', out('It comes to you without a sound. Lenny stares. "Huh. It likes you. It never liked me."', poolTrade('trading-post', 'lenny-post-fed')))] },
      { id: 'lenny-feed', when: [flagIs('lenny-asked')], notice: 'Lenny nods at your bag. "Got a Berry? Go on. Slowly."', hide: [1],
        addChoices: [ch('Feed it a Berry.', out('You hold out a Berry, very still. A long sniff. Then it takes it, gently, and keeps your hand for a moment longer than it needs to.', mk('payItem', { only: BERRIES }), flag('lenny-fed'), stay('trading-post')), { requires: [holds(BERRIES, 'a Berry')] })] },
    ],
  },
  // ---- SF105. The Sandstorm Camp ----
  {
    id: 'wx-sandstorm-camp', name: 'The Sandstorm Camp', group: G,
    intro: 'Nomads in a ring of tents as a sandstorm howls. They signal you in. Elder Yusra: "Sit out the storm. Trade if you like. Our prices are posted." They are, on a board by the fire.',
    choices: [
      ch('Shelter and trade.', out('Sweet tea, a rug by the fire, the storm hammering at the felt. Your team sleeps in a heap. Then Yusra lays out the trade board and the camp\'s goods.', heal(1), stay('sandstorm-camp-trade'))),
      ch('Shelter only.', out('You sleep through the storm in the warm dark of a tent, your team curled around you. In the morning the dunes have moved, and you are rested.', heal(1))),
      ch('Push on.', out('You pull your scarf over your face and walk into it. Sand in every seam, every eye. The storm follows you down the road.', { kind: 'damage', share: 0.1, who: 'party', except: ['ground', 'rock', 'steel'] }, { kind: 'front', weather: 'sand', columns: 3 })),
    ],
  },
  room({
    id: 'sandstorm-camp-trade', name: 'The Sandstorm Camp',
    intro: 'Yusra\'s trade board, chalked fresh: one Pokémon on offer from the deep desert, and the camp\'s goods. "Our caravans trade, always. Everything is written down."',
    choices: [
      ch('Trade.', out('Yusra seals it with a handshake and a pinch of sand dropped on both your palms. "So the desert remembers."', poolTrade('wx-sandstorm-camp', 'desert-ruins'))),
      ch('Browse the goods.', out('Soft sand, hard stone, dried fruit, spices: priced on slate, nothing hidden.', { kind: 'addStop', stop: 'shop' })),
      ch('Rest by the fire.', out('You sit with the elders while the storm wears itself out. Nobody says much. It is the best hour of the week.')),
    ],
  }),
  // ---- SF110. The Collectors ----
  collector('heavyweight-swap', 'The Heavyweight Hauler',
    'A cart the size of a cottage, and a big tired man beside it. Hauler Brannoc: "My cart needs a big strong one. A hundred kilos or more." He offers a sturdy Steel-type.',
    'Brannoc', 'My old cart-puller\'s retiring. She deserves a rest.', poolTrade('heavyweight-swap', 'heavyweight-swap')),
  collector('monster-breeder', 'The Monster Breeder',
    'A ranch gone quiet, fences mended for animals that are not there. Breeder Kesh: "I raise only the Monster egg group. Bring me one, and take something fierce."',
    'Kesh', 'I want the ranch loud again.', poolTrade('monster-breeder', 'monster-breeder')),
  collector('pikachu-collector', 'The Pikachu and Eevee Collector',
    'A cottage with Pikachu curtains and an Eevee doormat. Pippa Lune: "Pikachu and Eevee only. I know. I know. Pick any of my three rare ones in return."',
    'Pippa Lune', 'My daughter loved them. She\'s grown. I miss the noise.', stay('pikachu-collector-pick'), 'Pippa opens three Balls on the table, one at a time, and steps back. "Choose. Take your time."'),
  room({
    id: 'pikachu-collector-pick', name: 'The Pikachu and Eevee Collector',
    intro: 'Three rare Pokémon on Pippa\'s table, three cards. She wants a Pikachu or an Eevee for whichever you choose.',
    choices: [
      ch('The Riolu.', out('Pippa hugs your Pikachu or Eevee before she even says thank you.', trade('pikachu-collector-riolu', PIKA, { species: 'riolu', nature: 'jolly', quirk: 'gentle', ot: 'Pippa Lune', why: 'My daughter loved them. She\'s grown. I miss the noise.' }))),
      ch('The Scyther.', out('Pippa hugs your Pikachu or Eevee before she even says thank you.', trade('pikachu-collector-scyther', PIKA, { species: 'scyther', nature: 'adamant', quirk: 'show-off', ot: 'Pippa Lune', why: 'My daughter loved them. She\'s grown. I miss the noise.' }))),
      ch('The Larvitar.', out('Pippa hugs your Pikachu or Eevee before she even says thank you.', trade('pikachu-collector-larvitar', PIKA, { species: 'larvitar', nature: 'careful', quirk: 'collector', ot: 'Pippa Lune', why: 'My daughter loved them. She\'s grown. I miss the noise.' }))),
      ch('None.', out('"That\'s alright." She puts the Balls away. "They\'ll keep me company."')),
    ],
  }),
  collector('red-collector', 'The Red Collector',
    'A red door, a red coat, red roses. Rudy Vermilion: "Everything I own is red. Everything. Trade me a red one, and take a Fire-type."',
    'Rudy Vermilion', 'My house is red. My Pokémon are red. I\'m happy. Don\'t ask.', poolTrade('red-collector', 'red-collector')),
  collector('water-fan-swap', 'The Water Fan',
    'A woman in waders, knee-deep in a half-dug hole. Marée: "Water is life! Trade me a Water-type and I\'ll find you a Dragon."',
    'Marée', 'I\'m building a pond. A big one.', poolTrade('water-fan-swap', 'water-fan-swap')),
  // ---- The Rich Kid ----
  {
    id: 'offer-you-cant-refuse', name: 'An Offer You Can\'t Refuse', group: G,
    intro: 'A boy in a velvet suit, a butler holding his wallet. Montgomery IV points at your team. "I\'ll pay a fortune for that one!" The offer, in full: ₽5,000.',
    choices: [
      ch('Ask my Pokémon.', out('You kneel and ask it, honestly. It thinks about the velvet and the butler and the fortune, and shrugs: it would go. Montgomery: "Excellent!"', flag('rich-kid-asked'), stay('offer-you-cant-refuse'))),
      ch('Sell.', out('The butler counts out ₽5,000 in crisp notes. Montgomery hugs your Pokémon too hard. It puts up with it.', { kind: 'tradeAway', want: want('any Pokémon') }, $(5000))),
      ch('No.', out('"Everything has a price," Montgomery says. The butler, behind him, gives you the smallest nod.')),
    ],
    remembers: [{ id: 'rich-kid-bond', when: [{ kind: 'bondLevel', atLeast: 4, who: 'lead' }], notice: 'Your lead hides behind your legs. Montgomery: "...Oh. It likes you. That\'s fine. I didn\'t know that was a thing."', hide: [0, 1],
      addChoices: [ch('Sell.', out('The money is counted out. Your Pokémon looks back at you the whole way to the carriage. People who saw it will talk.', { kind: 'tradeAway', want: want('any Pokémon') }, $(5000), ...rep(-1)))] }],
  },
  // ---- SF111. Swaps and Altars ----
  {
    id: 'swap-quirky', name: 'The Collector\'s Swap', group: G,
    intro: 'Hesper, a collector with a ledger of histories: "This one has a history. It\'s been in a flood." The card lists its marks: survived a flood; raised by a ferryman.',
    choices: [
      ch('Trade.', out('Hesper writes your name under the ferryman\'s in the ledger. "It\'s seen a lot of water. Show it some land."', trade('swap-quirky', want('any Pokémon'), { species: 'lotad', nature: 'calm', quirk: 'old', ot: 'Hesper', marks: ['survived a flood', 'raised by a ferryman'], why: 'It\'s been passed hand to hand since the flood. It should stay somewhere.' }))),
      ch('Read its history.', out('The ledger: born on a marsh, raised on a ferry by an old man called Haddon, swept off in the great flood, found three days later sitting on a floating door.', stay('swap-quirky'))),
      ch('No.', out('Hesper closes the ledger gently. "Its story will keep."')),
    ],
  },
  {
    id: 'swap-quirky-memory', name: 'It Remembers the Ferryman', group: G, callback: true,
    requires: [flagIs('trade-swap-quirky'), { kind: 'bondLevel', atLeast: 5, who: { species: ['lotad', 'lombre', 'ludicolo'] } }],
    intro: 'At a river crossing, the Pokémon from the flood stops dead. A raft, an old man poling it. It runs to the bank and calls, and calls. The old man waves his hat.',
    choices: [
      ch('Wave back.', out('Old Haddon, the ferryman, poles over and holds its face in his hands. "There you are. There you are." He looks at you. "Thank you for keeping it."', flag('ferryman-remembered'))),
    ],
  },
  {
    id: 'rk-altar-swaps', name: 'The Altar of Swaps', group: G,
    intro: 'A stone altar with three Poké Balls in three hollows, each with a card. Words cut in the stone: LEAVE ONE OF YOURS. TAKE ONE OF MINE. WE KEEP IT FAIR.',
    choices: [
      ch('Swap.', out('You step up to the altar. The three cards turn face-up on their own.', stay('rk-altar-swaps-pick'))),
      ch('Look at all three.', out('Three Pokémon, three cards: level, nature, history, all shown. Each one looks back at you.', stay('rk-altar-swaps-pick'))),
      ch('Leave.', out('The altar keeps its three. The cards turn face-down again.')),
    ],
  },
  room({
    id: 'rk-altar-swaps-pick', name: 'The Altar of Swaps',
    intro: 'Three hollows, three cards face-up: one from the forest, one from the mountains, one from the shore. The stone waits.',
    choices: [
      ch('The forest one.', out('You set yours in the hollow. The forest Pokémon steps out of the stone as if it had always been yours.', poolTrade('rk-altar-forest', 'forest-grove'))),
      ch('The mountain one.', out('You set yours in the hollow. The mountain Pokémon shakes rock dust from itself and steps out.', poolTrade('rk-altar-mountain', 'mountain-mine'))),
      ch('The shore one.', out('You set yours in the hollow. The shore Pokémon steps out smelling of salt.', poolTrade('rk-altar-shore', 'coastal-harbour'))),
      ch('Leave.', out('The cards turn face-down. The altar is patient.')),
    ],
  }),
  {
    id: 'rk-draft-pool', name: 'The Draft Pool', group: G,
    intro: 'Five Pokémon behind a rope, all looking for a trainer. A sign: TAKE ONE. THE OTHERS GO TO THE NEXT TRAINER THROUGH. Every card is pinned to the rope.',
    choices: [
      ch('Look at the first three.', out('Three cards on the rope, three hopeful faces.', stay('rk-draft-pool-a'))),
      ch('Look at the other two.', out('Two cards at the end of the rope.', stay('rk-draft-pool-b'))),
      ch('None.', out('You leave them for the next trainer through. One of them watches you go.')),
    ],
  },
  room({
    id: 'rk-draft-pool-a', name: 'The Draft Pool',
    intro: 'The first three: a forest one, a mountain one, a shore one. Each card is honest.',
    choices: [
      ch('The forest one.', out('It ducks under the rope and sits on your foot. The others wave it off.', poolTrade('draft-forest', 'forest-grove', { gift: true }))),
      ch('The mountain one.', out('It steps over the rope like it was never there.', poolTrade('draft-mountain', 'mountain-mine', { gift: true }))),
      ch('The shore one.', out('It slides under the rope and shakes itself dry all over you.', poolTrade('draft-shore', 'coastal-harbour', { gift: true }))),
      ch('None.', out('You leave the rope as you found it.')),
    ],
  }),
  room({
    id: 'rk-draft-pool-b', name: 'The Draft Pool',
    intro: 'The other two: one from the snow, one from the farms. Their cards hang a little lower.',
    choices: [
      ch('The snow one.', out('It shivers once, then follows you, already warmer.', poolTrade('draft-snow', 'snow-ice', { gift: true }))),
      ch('The farm one.', out('It trots out, pleased with itself, and nudges your hand.', poolTrade('draft-farm', 'farm-ranch', { gift: true }))),
      ch('None.', out('You leave the rope as you found it.')),
    ],
  }),
  {
    id: 'rk-free-pick-altar', name: 'The Free Pick Altar', group: G,
    intro: 'Three relics glow on a stone altar, red, blue and gold, each with its power cut beneath it. "Take one. The others vanish."',
    choices: [
      ch('The Red Relic: hit harder.', out('Warmth in your fists. The other two relics fade like breath on glass.', { kind: 'relic', id: 'rk-altar-red', name: 'Red Relic', effects: [{ kind: 'damageMultiplier', value: 1.08 }] })),
      ch('The Blue Relic: heal after fights.', out('A cool calm settles over the team. The other two fade.', { kind: 'relic', id: 'rk-altar-blue', name: 'Blue Relic', effects: [{ kind: 'postBattleHeal', percent: 6 }] })),
      ch('The Gold Relic: richer rewards.', out('The weight of wealth in your pocket. The other two fade.', { kind: 'relic', id: 'rk-altar-gold', name: 'Gold Relic', effects: [{ kind: 'moneyMultiplier', value: 1.25 }, { kind: 'rareItemWeight', value: 1.15 }] })),
    ],
  },
  {
    id: 'christmas-eve-gift-swap', name: 'The Christmas Eve Swap', group: G,
    intro: 'Snow, lanterns, and a figure in a long coat with a sack. "Give me something, I\'ll give you something. Same tier, I promise." The tiers are chalked on the sack.',
    choices: [
      ch('Give a Common.', out('You hand over something small. The figure hands back a parcel in red paper. Inside: something just as good, and new.', mk('payItem', { only: COMMON_ITEMS }), { kind: 'itemFrom', ids: COMMON_ITEMS }), { requires: [holds(COMMON_ITEMS, 'a Common item')] }),
      ch('Give an Uncommon.', out('Green paper, a gold ribbon. The figure tips their hat.', mk('payItem', { only: UNCOMMON_ITEMS }), { kind: 'itemFrom', ids: UNCOMMON_ITEMS }), { requires: [holds(UNCOMMON_ITEMS, 'an Uncommon item')] }),
      ch('Give a Rare.', out('Silver paper, and a card: "Merry Christmas. Same tier, as promised."', mk('payItem', { only: RARE_ITEMS }), { kind: 'itemFrom', ids: RARE_ITEMS }), { requires: [holds(RARE_ITEMS, 'a Rare item')] }),
      ch('Just say Merry Christmas.', out('"And to you." The figure hands you a sweet anyway, and is gone into the snow.')),
    ],
  },
  {
    id: 'global-trade', name: 'The Global Trade Booth', group: G,
    intro: 'A booth humming with a screen linked to trainers around the world. Every offer shows the trainer, the Pokémon\'s history and the reason for trading.',
    choices: [
      ch('Browse offers.', out('The screen fills: three offers from three corners of the world, every card complete.', stay('global-trade-offers'))),
      ch('Post my own.', out('You post your offer: what you would give, honestly marked. "Replies usually come within a few stops," the screen says.', flag('gts-posted'), { kind: 'laterEvent', eventId: 'global-trade-reply', nodes: 3 })),
      ch('Leave.', out('The screen dims to a slow world map, lights blinking where trainers are trading.')),
    ],
  },
  room({
    id: 'global-trade-offers', name: 'The Global Trade Booth',
    intro: 'Three offers on the screen, each with a trainer\'s name, a history and a reason.',
    choices: [
      ch('The first offer.', out('Accepted. A whirr, a flash, a Ball in the tray, still warm from the other side of the world.', poolTrade('gts-1', 'global-trade'))),
      ch('The second offer.', out('Accepted. The tray opens on a Ball with a note taped to it.', poolTrade('gts-2', 'global-trade'))),
      ch('The third offer.', out('Accepted. The screen shows the trainer waving.', poolTrade('gts-3', 'global-trade'))),
      ch('Leave.', out('The offers stay up for the next trainer.')),
    ],
  }),
  room({
    id: 'global-trade-reply', name: 'A Reply from the Global Trade',
    requires: [flagIs('gts-posted')],
    intro: 'A booth on the road pings as you pass: a reply to your offer, from a trainer far away. Their card is complete.',
    choices: [
      ch('Accept.', out('The trade goes through. A message comes with it: "Look after mine. I\'ll look after yours."', poolTrade('gts-reply', 'global-trade'), flag('gts-posted', -1))),
      ch('Decline.', out('You decline politely. The trainer replies: "No worries! Good luck out there."', flag('gts-posted', -1))),
    ],
  }),
  {
    id: 'barter-barge', name: 'The Barter Barge', group: G,
    intro: 'A flat barge piled with crates, and an old man on a stool. Old Quint: "No coins. Two items, I hand one back." Both tiers chalked on the hull: two Common for one Uncommon.',
    choices: [
      ch('Trade two for one.', out('Quint weighs each in his palm, nods, and hands one back from a crate. "Fair. The barge never takes a worse deal than it\'d take itself."', mk('payItem', { only: COMMON_ITEMS, amount: 2 }), { kind: 'itemFrom', ids: UNCOMMON_ITEMS }), { requires: [holds(COMMON_ITEMS, 'two Common items', 2)] }),
      ch('No.', out('Quint goes back to his pipe. The barge drifts on.')),
    ],
  },
  {
    id: 'ghost-trader', name: 'The Ghost Trader', group: G,
    intro: 'A spectral figure behind a counter that is not quite there. The Ghost Trader: "I deal in what you don\'t need. Give me something you love."',
    choices: [
      ch('What do you want?', out('"The thing you reach for most. A Berry, worn smooth by your hand." It points at your bag. It knows exactly which.', flag('ghost-asked'), stay('ghost-trader'))),
      ch('What would you give?', out('"Something rare. And the memory of what you gave me, to keep." It smiles. "Loved things keep me here a little longer."', flag('ghost-asked'), stay('ghost-trader'))),
      ch('No.', out('"No one ever says yes the first time." It fades, counter and all.')),
    ],
    remembers: [{ id: 'ghost-deal', when: [flagIs('ghost-asked')], notice: 'The Ghost Trader waits, hands folded.', hide: [2],
      addChoices: [
        ch('Give it.', out('You hand it over. The ghost holds it like something precious, and a Rare item is on the counter. You remember the Berry perfectly. You always will.', mk('payItem', { only: BERRIES }), { kind: 'itemFrom', ids: RARE_ITEMS }, flag('ghost-traded')), { requires: [holds(BERRIES, 'a Berry')] }),
        ch('No.', out('"Keep it, then. Love it a little longer." It fades.')),
      ] }],
  },
];
