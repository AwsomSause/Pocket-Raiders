// Run events K (R506-R560): run-wide modifiers, quirks and meta events, written with the DSL.
// tools/build-rk-events.ts turns the list into src/data/eventsRK.json. Already built elsewhere and skipped here:
// R511 Oath Stone (oath-shrine), R512 Debt Collector, R514 Safety Net (insurance-agent), R517 Time Capsule (time-capsule), R537 Contract Board (contract-desk).
// Limits are listed in docs/status/events-rk.md (a few ideas need profile or real-date data; they use the closest run effect).
import { $, any, ch, ev, flag, flagIs, fr, good, has, heal, hurt, item, join, leave, lose, money, out, fight, party, relic, rest, reveal, rp, room, roomFrom, scout, trade, trainer, better, companion, express, gym, rift, lv, cure, celebrate, milestone, attr, HEALING, STONES, BERRIES, TREASURE, HELD, type Json } from './dsl.ts';

const G = 'Run-Wide Modifiers';
const RARE_PICK = ['rare-candy', 'max-revive', 'star-piece', 'nugget'];
const blessing = (id: string): Json => ({ kind: 'blessing', id });
const moment = (text: string, importance = 55): Json => ({ kind: 'moment', text, importance });
const keepsake: Json = { kind: 'recoverKeepsake' };
const M = {
  money: (value: number): Json => ({ kind: 'moneyMultiplier', value }),
  xp: (value: number): Json => ({ kind: 'xpMultiplier', value }),
  dmg: (value: number): Json => ({ kind: 'damageMultiplier', value }),
  taken: (value: number): Json => ({ kind: 'damageTakenMultiplier', value }),
  foes: (value: number): Json => ({ kind: 'enemyLevelOffset', value }),
  price: (value: number): Json => ({ kind: 'priceMultiplier', group: 'all', value }),
  heal: (percent: number): Json => ({ kind: 'postBattleHeal', percent }),
  research: (value: number): Json => ({ kind: 'researchMultiplier', value }),
  rare: (value: number): Json => ({ kind: 'rareItemWeight', value }),
  shiny: (value: number): Json => ({ kind: 'shinyChanceMultiplier', value }),
  friend: (value: number): Json => ({ kind: 'friendshipMultiplier', value }),
  survive: (chance: number): Json => ({ kind: 'survivalChance', chance }),
  rule: (id: string): Json => ({ kind: 'runRule', id }),
  preview: (what: string): Json => ({ kind: 'preview', what }),
  shuffle: (every: number): Json => ({ kind: 'stopShuffle', every }),
  catchMoney: (value: number): Json => ({ kind: 'catchMoneyMultiplier', value }),
  boss: (value: number): Json => ({ kind: 'bossMoneyMultiplier', value }),
  crit: (value: number): Json => ({ kind: 'critChanceBonus', value }),
  counter: (id: string, max: number): Json => ({ kind: 'eventCounter', id, on: 'nodeEnter', amount: 1, max }),
  counterDmg: (counter: string, atLeast: number, base: number): Json => ({ kind: 'counterDamage', counter, atLeast, base, perPoint: 0 }),
};
/** A lasting run effect with an upside and a downside (a relic takes 1 to 3 modifiers, once per id). */
const R = (id: string, name: string, ...mods: Json[]): Json => relic(`rk-${id}`, name, mods);
/** A room another event opens: never drawn on its own (the builder also marks them). */
const room_ = (e: Json): Json => ({ ...e, room: true });

export const RK_EVENTS: Json[] = [
  // ---- R506 Lucky Streak Chain: three wins in a row, then a free pick ----
  ev('rk-streak-1', 'Lucky Streak Chain', G, { stop: 'event', rarity: 'uncommon', effect: 'glint', tint: '#2a2a10' },
    'A little stall chalks up a streak board: three wins in a row and you pick any prize. The first game is a coin toss.', [
      ch('Call heads', out('Heads! One win on the board.', room('rk-streak-2')), { chance: 0.5, fail: out('Tails. The board is wiped clean, but the keeper tosses you a consolation berry.', any(...BERRIES)) }),
      ch('Call tails', out('Tails! One win on the board.', room('rk-streak-2')), { chance: 0.5, fail: out('Heads. The board is wiped clean, but the keeper tosses you a consolation berry.', any(...BERRIES)) }),
      ch('Walk away', leave()),
    ]),
  room_(ev('rk-streak-2', 'Lucky Streak Chain: Two', G, { stop: 'event', rarity: 'uncommon', effect: 'glint', tint: '#2a2a10' },
    'Second game: pick a cup. One of three hides the marble.', [
      ch('The left cup', out('The marble! Two wins in a row.', room('rk-streak-3')), { chance: 0.45, fail: out('Empty. The streak ends here.', $(60)) }),
      ch('The middle cup', out('The marble! Two wins in a row.', room('rk-streak-3')), { chance: 0.45, fail: out('Empty. The streak ends here.', $(60)) }),
      ch('Take the cash and stop', out('The keeper pays out the two-win bonus.', $(250))),
    ])),
  room_(ev('rk-streak-3', 'Lucky Streak Chain: Three', G, { stop: 'event', rarity: 'rare', effect: 'sparkle', tint: '#3a3a14' },
    'Last game: a die roll. Beat a four to claim the prize shelf!', [
      ch('Roll the die', out('A six! The whole shelf is yours to pick from.', better(2), any(...STONES), $(300)), { chance: 0.5, fail: out('A one. So close. You still get a prize from the lower shelf.', any(...HEALING), $(100)) }),
      ch('Quit while ahead', out('The keeper pays out a streak bonus.', $(500))),
    ])),

  // ---- R507 Curse Lottery: a random curse with a matching blessing ----
  ev('rk-curse-lottery', 'The Curse Lottery', G, { stop: 'special', rarity: 'uncommon', types: ['ghost'], effect: 'fog', tint: '#1c1028' },
    'A hooded clerk spins a drum of tickets. "Every curse comes with its blessing. You only get to pick the ticket."', [
      ch('Draw a ticket', out('The ticket reads: Heavy Hands. Hits land harder on you, but you learn faster.', R('curse-slow', 'Slow Curse, Quick Study', M.taken(1.1), M.xp(1.2))), { chance: 0.5, fail: out('The ticket reads: Thin Purse. Prices bite, but your wins pay more.', R('curse-thin', 'Thin Purse, Heavy Prizes', M.price(1.15), M.money(1.3))) }),
      ch('Draw two tickets (pay 300)', out('Both tickets burn up. Their blessing stays: something kinder watches over the team.', R('curse-twin', 'Twin Ticket Charm', M.heal(5), M.taken(1.05)), $(-300)), { requires: [money(300)] }),
      ch('Walk past the booth', leave()),
    ]),

  // ---- R508 Pact Booth ----
  ev('rk-pact-booth', 'The Pact Booth', G, { stop: 'special', rarity: 'rare', minStage: 2, effect: 'glint', tint: '#2a1414' },
    'A clerk in a red coat pushes a contract across the counter. "Harder fights, richer pay. Sign here. Initial there."', [
      ch('Sign the Lesser Pact (foes +2 levels, money +40%)', out('The ink dries. The road ahead feels meaner, and so does your wallet.', R('pact-lesser', 'Lesser Pact', M.foes(2), M.money(1.4)))),
      ch('Sign the Greater Pact (foes +4 levels, money +80%, XP +20%)', out('The clerk smiles for the first time.', R('pact-greater', 'Greater Pact', M.foes(4), M.money(1.8), M.xp(1.2)))),
      ch('Refuse to sign', leave('You fold the contract and hand it back.')),
    ]),

  // ---- R509 Rule Board ----
  ev('rk-rule-board', 'The Rule Board', G, { stop: 'special', rarity: 'uncommon', effect: 'none', tint: '#14202a' },
    'A notice board lists house rules for the rest of the run. Pin up one of them and it counts for you, too.', [
      ch('Rule: no battle items (money +30%)', out('You tack the rule up. Your pockets feel heavier already.', R('rule-nobattleitems', 'No Battle Items', M.rule('no-battle-items'), M.money(1.3)))),
      ch('Rule: no revives (XP +25%)', out('Fainted is fainted. The lessons stick.', R('rule-norevives', 'No Revives', M.rule('no-revives'), M.xp(1.25)))),
      ch('Rule: double money, foes +2 levels', out('Rich and in danger.', R('rule-richandrisky', 'Rich and Risky', M.money(2), M.foes(2)))),
      ch('Leave the board bare', leave()),
    ]),

  // ---- R510 Lucky Number ----
  ev('rk-lucky-number', 'Lucky Number', G, { stop: 'event', rarity: 'common', effect: 'sparkle', tint: '#2a2a18' },
    'A fortune stand asks you to pick a number from one to three. "Hit the right one and the road rewards you, all run long."', [
      ch('Number 1', out('One it is! Luck follows you from here.', R('lucky-one', 'Lucky Number', M.shiny(1.5), M.rare(1.2))), { chance: 0.34, fail: out('Not your number. Here is a small prize for playing.', $(100)) }),
      ch('Number 2', out('Two it is! Luck follows you from here.', R('lucky-two', 'Lucky Number', M.shiny(1.5), M.rare(1.2))), { chance: 0.34, fail: out('Not your number. Here is a small prize for playing.', $(100)) }),
      ch('Number 3', out('Three it is! Luck follows you from here.', R('lucky-three', 'Lucky Number', M.shiny(1.5), M.rare(1.2))), { chance: 0.34, fail: out('Not your number. Here is a small prize for playing.', $(100)) }),
    ]),

  // ---- R513 Risk Dial ----
  ev('rk-risk-dial', 'The Risk Dial', G, { stop: 'event', rarity: 'uncommon', effect: 'shake', tint: '#2a1414' },
    'A brass dial on a post, marked from Calm to Chaos. Whatever you set it to, a challenger turns up to match it.', [
      ch('Calm: a mild challenger', fight('A trainer strolls up, easy as you like.', trainer('Dial Challenger', { size: 2, lv: 0, win: [$(300), rp(5)] }))),
      ch('Spicy: a strong challenger', fight('The dial clicks. A tougher trainer steps out.', trainer('Dial Challenger', { size: 3, lv: 3, win: [$(700), any(...HELD), rp(10)] }))),
      ch('Chaos: the dial snaps off', fight('Bells ring. An ace trainer tears down the road at you.', trainer('Chaos Challenger', { size: 4, lv: 6, win: [$(1500), item('rare-candy'), better(1), rp(20)] }))),
    ]),

  // ---- R515 Fate Cards ----
  ev('rk-fate-cards', 'Fate Cards', G, { stop: 'special', rarity: 'uncommon', effect: 'glint', tint: '#1e1a2e' },
    'A dealer fans three cards face down. "Each one gives, and each one takes. Pick one."', [
      ch('The Sun: heal everyone, lose some gold', out('Warm light. The team is fresh, the purse is lighter.', heal(1), $(-150))),
      ch('The Tower: a rare find, a rough fall', out('Rubble and treasure. The lead takes a knock, but you find something good.', hurt(0.15), any(...TREASURE, ...HELD))),
      ch('The Star: a new friend, a stranger\'s debt', out('Someone follows you from the table. The dealer takes a cut.', join({ lv: 0 }), $(-250)), { requires: [money(250)] }),
    ]),

  // ---- R516 Mood Swing ----
  ev('rk-mood-swing', 'Mood Swing', G, { stop: 'event', rarity: 'common', effect: 'float', tint: '#2a1c2a' },
    'A strange breeze rolls over the team. Everyone\'s mood tips, for better or worse.', [
      ch('Ride it out together', out('Laughing fits all round. The team bonds.', fr(8), good(1)), { chance: 0.6, fail: out('Sulking all round. A few of them need cheering up.', fr(-4)) }),
      ch('Cheer them up with snacks', out('Snacks fix every mood.', fr(5)), { requires: [has('old-gateau')] }),
      ch('Take a breather', out('You wait it out in the shade.', heal(0.2))),
    ]),

  // ---- R518 Shadow Boon ----
  ev('rk-shadow-boon', 'The Shadow Boon', G, { stop: 'shrine', rarity: 'rare', types: ['ghost', 'dark'], effect: 'fog', tint: '#10101c' },
    'Your own shadow offers a loan. "I will lend you strength now. You pay it back later."', [
      ch('Borrow health: heal everyone, take more damage later', out('The wounds close. Somewhere ahead, a bill is waiting.', heal(1), cure(), R('shadow-loan', 'Shadow Loan', M.taken(1.08)))),
      ch('Borrow strength: hit harder, heal less', out('Your team feels stronger than it ought to.', R('shadow-might', 'Shadow Might', M.dmg(1.1), M.heal(0.01)))),
      ch('Refuse', leave('Your shadow shrugs and falls in behind you.')),
    ]),

  // ---- R519 Echo Item ----
  ev('rk-echo-item', 'The Echo Item', G, { stop: 'event', rarity: 'uncommon', effect: 'glint', tint: '#14242a' },
    'A small echo-stone repeats whatever you hold up to it. "Show me something from your bag."', [
      ch('Show a Potion', out('A second Potion drops out.', item('potion')), { requires: [has('potion')] }),
      ch('Show a Revive', out('A second Revive rolls out.', item('revive')), { requires: [has('revive')] }),
      ch('Show a Rare Candy', out('A second Rare Candy clinks down.', item('rare-candy')), { requires: [has('rare-candy')] }),
      ch('Show nothing', out('The echo repeats "nothing" a few times and goes quiet.')),
    ]),

  // ---- R520 Crowd Poll ----
  ev('rk-crowd-poll', 'The Crowd Poll', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#1c2a2a' },
    'A crowd is gathered around a stream camera. "Chat votes! Whatever wins helps your next few fights."', [
      ch('Let the crowd decide', out('"Hearth!" the crowd roars. A warm shield settles around the team.', blessing('blessing-hearth')), { chance: 0.5, fail: out('"Bloom!" the crowd chants. The team heals after fights for a while.', blessing('blessing-bloom')) }),
      ch('Ask for a catching boost', out('The crowd cheers for the wild ones.', blessing('blessing-wild-grace'))),
      ch('Ask for calm minds', out('A clear head for the next fights.', blessing('blessing-clarity'))),
    ]),

  // ---- R521 Chaos Dial ----
  ev('rk-chaos-dial', 'The Chaos Dial', G, { stop: 'event', rarity: 'uncommon', effect: 'shake', tint: '#2a102a' },
    'Three doors with no labels. A sign: "All choices here are random. Probably."', [
      ch('Door one', out('A shower of gold coins!', $(500)), { chance: 0.5, fail: out('A bucket of cold water. Everyone is fine, just damp.', hurt(0.05)) }),
      ch('Door two', out('A big sack of items tips out.', any(...HEALING), any(...BERRIES), any(...STONES)), { chance: 0.5, fail: out('Nothing but dust and a rude note.', $(-50)) }),
      ch('Door three', out('A cheering crowd lifts the lead a level!', lv(1)), { chance: 0.5, fail: out('A friendly Pokémon pulls a prank on you.', fr(2)) }),
    ]),

  // ---- R522 Hidden Quest Giver ----
  ev('rk-hidden-quest', 'A Nobody With a Secret', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#1c1c1c' },
    'A quiet person on the roadside waves you over. "You look like you can keep a secret. I need something found."', [
      ch('Take the secret quest', out('"Remember me when you pass a stranger\'s grave, a lake and a lantern. I will find you again."', flag('rk-secret-quest'), moment('Took a secret quest from a nobody.')), {}),
      ch('Say no thanks', leave()),
    ]),
  ev('rk-hidden-quest-payoff', 'The Nobody Returns', G, { stop: 'event', rarity: 'rare', minStage: 3, callback: true, requires: [flagIs('rk-secret-quest', 1)], effect: 'glint', tint: '#1c1c1c' },
    'The quiet person from the roadside is waiting at the next crossing, grinning. "You kept your eyes open. Here is what I promised."', [
      ch('Collect the reward', out('The nobody turns out to be a collector of rare things. They give you one.', item('rare-candy', 2), any(...RARE_PICK), rp(15), flag('rk-secret-quest', -1))),
    ]),

  // ---- R523 Sealed Letter ----
  ev('rk-sealed-letter', 'The Sealed Letter', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#2a2418' },
    'A courier presses a sealed letter into your hand. "Do not open it yet. Wait until the road gets hard."', [
      ch('Keep it sealed', out('You tuck the letter away and feel strangely lucky.', flag('rk-sealed-letter'))),
      ch('Open it right now', out('The letter holds a coupon for a small gift.', item('potion', 2), $(100))),
    ]),
  ev('rk-sealed-letter-open', 'The Letter, Opened', G, { stop: 'event', rarity: 'rare', minStage: 3, callback: true, requires: [flagIs('rk-sealed-letter', 1)], effect: 'sparkle', tint: '#2a2418' },
    'The road has gotten hard. You break the wax seal at last. Inside, a note: "I knew you would need this. Behind the old signpost."', [
      ch('Dig behind the signpost', out('A chest of gifts, exactly as promised.', item('max-potion', 2), item('rare-candy'), any(...HELD), flag('rk-sealed-letter', -1))),
    ]),

  // ---- R524 Mirror Event (reversal) ----
  ev('rk-mirror-reversal', 'The Reversing Mirror', G, { stop: 'shrine', rarity: 'uncommon', effect: 'glint', tint: '#1c2a3a' },
    'A tall mirror shows the last thing that happened to you, back to front. Step through and it flips your fortunes the same way.', [
      ch('Trade health for gold', out('Your reflection hands you a purse and takes a bruise.', hurt(0.15), $(450))),
      ch('Trade gold for health', out('Your reflection takes the coins and hands you a clean bill of health.', heal(1), cure(), $(-300)), { requires: [money(300)] }),
      ch('Don\'t look', leave()),
    ]),

  // ---- R525 Rest Day ----
  ev('rk-rest-day', 'A Perfect Rest Day', G, { stop: 'rest', rarity: 'common', effect: 'float', tint: '#18281c' },
    'A meadow with nothing in it but soft grass and a warm sun. Nothing is scheduled, and no one will find you.', [
      ch('Spend the whole day resting', out('Everyone naps, eats and plays. A new day dawns.', rest(), heal(1), cure(), fr(6))),
      ch('Rest a little, then go', out('A short breather.', heal(0.4))),
    ]),

  // ---- R526 Birthday ----
  ev('rk-birthday', 'It\'s Your Birthday!', G, { stop: 'event', rarity: 'rare', requires: [milestone], effect: 'sparkle', tint: '#3a2a3a' },
    'Everyone you have met lines the road with streamers. Somebody wheels out a cake. "Happy birthday, trainer!"', [
      ch('Blow out the candles', out('Make a wish. The gifts pile up.', celebrate(), item('rare-candy'), any(...TREASURE), $(400), heal(1), fr(5))),
      ch('Share the cake with the team', out('The cake is gone in seconds, and so are the worries.', celebrate(), heal(1), fr(10), good(1))),
    ]),

  // ---- R527 Holiday Surprise (seasonal NPC) ----
  ev('rk-holiday-surprise', 'The Seasonal Visitor', G, { stop: 'event', rarity: 'uncommon', effect: 'sparkle', tint: '#2a2a1c' },
    'A traveller in clothes for the weather hands out presents. "It\'s that time of year again!"', [
      ch('Spring: an egg for you', out('A neat pastel egg.', { kind: 'egg', species: [], types: [], levelBonus: 0, shinyMultiplier: 1, left: 3, unit: 'battle' }), { requires: [{ kind: 'season', in: ['Spring'] }] }),
      ch('Summer: a cool-box of treats', out('Ice-cold drinks for everyone.', item('soda-pop', 2), item('lemonade', 2), heal(0.3)), { requires: [{ kind: 'season', in: ['Summer'] }] }),
      ch('Autumn: a basket of berries', out('The harvest is in.', any(...BERRIES), any(...BERRIES), any(...BERRIES)), { requires: [{ kind: 'season', in: ['Autumn'] }] }),
      ch('Winter: warm gifts', out('Scarf, stone, and a hot meal.', any(...STONES), item('old-gateau'), heal(0.4)), { requires: [{ kind: 'season', in: ['Winter'] }] }),
    ]),

  // ---- R528 Free Pick Altar ----
  ev('rk-free-pick-altar', 'The Free Pick Altar', G, { stop: 'shrine', rarity: 'rare', effect: 'glint', tint: '#2a2014' },
    'Three relics glow on a stone altar. "Take one. The others will vanish."', [
      ch('The Red Relic: hit harder', out('Warmth in your fists. The other two relics fade.', R('altar-red', 'Red Relic', M.dmg(1.08)))),
      ch('The Blue Relic: heal after fights', out('A cool calm settles over the team. The other two relics fade.', R('altar-blue', 'Blue Relic', M.heal(6)))),
      ch('The Gold Relic: richer rewards', out('The weight of wealth. The other two relics fade.', R('altar-gold', 'Gold Relic', M.money(1.25), M.rare(1.15)))),
    ]),

  // ---- R529 Altar of Swaps ----
  ev('rk-altar-swaps', 'The Altar of Swaps', G, { stop: 'trade', rarity: 'rare', minStage: 2, effect: 'float', tint: '#1c1c2a' },
    'A stone altar hums. "Leave one of yours. Take one of mine. We keep it fair."', [
      ch('Swap your weakest for a stranger', out('The altar takes one and gives you another of its own.', trade('your weakest Pokémon'), join({ lv: 1 })), { requires: [party(2)] }),
      ch('Not today', leave()),
    ]),

  // ---- R530 Draft Pool ----
  ev('rk-draft-pool', 'The Draft Pool', G, { stop: 'event', rarity: 'rare', effect: 'sparkle', tint: '#142a2a' },
    'Five Pokémon wait behind a rope, all looking for a trainer. You can take just one.', [
      ch('The cheerful one', out('It tumbles into the party.', join({ types: ['normal', 'fairy'], lv: 1 }))),
      ch('The fierce one', out('It stares you down, then joins.', join({ types: ['fighting', 'dark', 'fire'], lv: 1 }))),
      ch('The calm one', out('It follows you quietly.', join({ types: ['water', 'grass', 'psychic'], lv: 1 }))),
      ch('The odd one', out('It nods once. A good sign.', join({ types: ['ghost', 'dragon', 'steel'], lv: 1 }))),
    ]),

  // ---- R531 Reroll Shrine ----
  ev('rk-reroll-shrine', 'The Reroll Shrine', G, { stop: 'shrine', rarity: 'uncommon', effect: 'glint', tint: '#2a1c2a' },
    'A small stone shrine with three coin slots. "Toss in a coin and the road ahead is dealt again."', [
      ch('Toss a coin (200)', out('The road ahead rearranges itself. A new door opens beside you.', roomFrom('rk-door-wood', 'rk-door-iron', 'rk-floor-1', 'rk-floor-3'), reveal(), $(-200)), { requires: [money(200)] }),
      ch('Toss three coins (500)', out('The road ahead is wholly new. Also, you can see where the hidden stops are.', roomFrom('rk-door-silver', 'rk-door-gold', 'rk-floor-4'), reveal(), scout(3), $(-500)), { requires: [money(500)] }),
      ch('Keep your coins', leave()),
    ]),

  // ---- R532 Skip Token Stand ----
  ev('rk-skip-token', 'The Skip Token Stand', G, { stop: 'merchant', rarity: 'uncommon', effect: 'none', tint: '#2a2a1c' },
    'A kid sells paper passes. "Skip the next node! Rides you right on past."', [
      ch('Buy a pass (300)', out('The kid punches your pass and waves you through.', express(), $(-300)), { requires: [money(300)] }),
      ch('Haggle (Charisma)', out('The kid sighs and gives you a discount.', express(), $(-150)), { check: 'charisma', fail: out('The kid does not budge, and you do not buy.') }),
      ch('Walk', leave()),
    ]),

  // ---- R533 Redo Ticket ----
  ev('rk-redo-ticket', 'The Redo Ticket Booth', G, { stop: 'merchant', rarity: 'rare', minStage: 2, effect: 'glint', tint: '#2a2a2a' },
    'A bored clerk sells pink tickets. "Lose a fight? Show this at the door and fight it again."', [
      ch('Buy a Redo Ticket (600)', out('You tuck the ticket away. The next time a Pokémon falls, it just might get back up.', R('redo-ticket', 'Redo Ticket', M.survive(0.3)), $(-600)), { requires: [money(600)] }),
      ch('Pass', leave()),
    ]),

  // ---- R534 Probability Mage (preview only, never uses gameplay RNG) ----
  ev('rk-probability-mage', 'The Probability Mage', G, { stop: 'special', rarity: 'rare', types: ['psychic'], effect: 'glint', tint: '#241a3a' },
    'A mage looks at you with half-closed eyes. "I will tell you what the dice want. I will not change them."', [
      ch('See what waits in the wild', out('Green fog clears. Wild Pokémon show up on your map.', R('mage-wild', 'Mage\'s Sight: Wild', M.preview('wild')))),
      ch('See the trainers ahead', out('Shapes of the trainers ahead sharpen.', R('mage-trainers', 'Mage\'s Sight: Trainers', M.preview('trainers')))),
      ch('See the Gym team', out('The Gym Leader\'s team stands in a line before you.', gym())),
    ]),

  // ---- R535 Team Banner Station ----
  ev('rk-team-banner', 'The Team Banner Station', G, { stop: 'special', rarity: 'uncommon', effect: 'float', tint: '#14283a' },
    'A seamstress hangs team banners from a line. "Pick a banner. It carries a little luck with it."', [
      ch('Crimson banner: +6% damage', out('It snaps proudly in the wind.', R('banner-crimson', 'Crimson Banner', M.dmg(1.06)))),
      ch('Azure banner: heal 5% after fights', out('It smells of rain and clean cloth.', R('banner-azure', 'Azure Banner', M.heal(5)))),
      ch('Gilded banner: +12% money', out('It glints like coin.', R('banner-gilded', 'Gilded Banner', M.money(1.12)))),
      ch('Verdant banner: +10% friendship gain', out('The team seems closer already.', R('banner-verdant', 'Verdant Banner', M.friend(1.1)))),
    ]),

  // ---- R536 Anniversary Archive ----
  ev('rk-anniversary-archive', 'The Anniversary Archive', G, { stop: 'library', rarity: 'rare', minStage: 4, effect: 'glint', tint: '#2a2a3a' },
    'A hidden archive opens only for runs that have come this far. Shelves of photos and trinkets from all your journeys.', [
      ch('Read the journal', out('A line about you is written on every page. You feel seen.', rp(20), good(1), moment('Opened the Anniversary Archive.'))),
      ch('Take a keepsake', out('A little souvenir to carry on.', any(...TREASURE), item('rare-candy'))),
      ch('Leave a note for next time', out('You pin a note to the wall. The archive hums.', flag('rk-archive-note'), rp(10))),
    ]),

  // ---- R538 Lucky Coin Vault (coins into Research Points, paid at run end) ----
  ev('rk-coin-vault', 'The Lucky Coin Vault', G, { stop: 'special', rarity: 'uncommon', effect: 'glint', tint: '#2a2410' },
    'A round vault door with a coin slot. "What goes in turns into research that outlasts your run."', [
      ch('Deposit 200', out('The coins clink away. A voucher pops out.', $(-200), rp(12)), { requires: [money(200)] }),
      ch('Deposit 600', out('A big clunk. The vault rewards you well.', $(-600), rp(45)), { requires: [money(600)] }),
      ch('Deposit 1500', out('The vault door glows gold.', $(-1500), rp(130)), { requires: [money(1500)] }),
      ch('Keep your coins', leave()),
    ]),

  // ---- R539 Legacy Pedestal ----
  ev('rk-legacy-pedestal', 'The Legacy Pedestal', G, { stop: 'shrine', rarity: 'rare', effect: 'sparkle', tint: '#2a2030' },
    'A stone pedestal waits with room for one item. The runs before you left things here, and so can you.', [
      ch('Recover a keepsake from an earlier run', out('You lift a keepsake off the pedestal.', keepsake), { requires: [{ kind: 'keepsake' }] }),
      ch('Leave a Rare Candy as a gift to the future', out('The pedestal accepts it. Your name is carved beneath.', lose('rare-candy'), rp(40)), { requires: [has('rare-candy')] }),
      ch('Leave a Nugget as a gift to the future', out('The pedestal accepts it.', lose('nugget'), rp(20)), { requires: [has('nugget')] }),
      ch('Walk on', leave()),
    ]),

  // ---- R540 Hall of Records ----
  ev('rk-hall-of-records', 'The Hall of Records', G, { stop: 'library', rarity: 'uncommon', effect: 'none', tint: '#20203a' },
    'Glass cases line the walls: your best runs, wins and wild moments. A plaque offers a challenge.', [
      ch('Study the records', out('You pick up a few tips from your past runs.', rp(15), att_('intelligence'))),
      ch('Take the plaque\'s challenge: no healing stops', out('You accept. The plaque glows.', R('records-challenge', 'Record Challenge', M.rule('no-heal-stops'), M.xp(1.3)))),
      ch('Admire and go', leave()),
    ]),

  // ---- R541 Memory Lane (lore only) ----
  ev('rk-memory-lane', 'Memory Lane', G, { stop: 'event', rarity: 'common', effect: 'float', tint: '#2a2030' },
    'A path of lanterns, each holding a scene from a long way back. Nothing here changes, but it is lovely to see.', [
      ch('Walk the whole lane', out('You watch the old days pass in light. The team hums along.', moment('Walked Memory Lane.', 60), fr(2), good(1))),
      ch('Pick one lantern', out('A single warm scene. A little bit of peace.', moment('Picked a lantern on Memory Lane.', 50), rp(2))),
    ]),

  // ---- R542 Pocket Dimension Closet ----
  ev('rk-pocket-closet', 'The Pocket Dimension Closet', G, { stop: 'event', rarity: 'uncommon', effect: 'float', tint: '#1a2230' },
    'A wardrobe that is bigger on the inside. "Store anything. Come back for it later and I will keep it safe."', [
      ch('Store a Rare Candy', out('The door shuts. You mark the spot on your map.', lose('rare-candy'), flag('rk-closet-candy')), { requires: [has('rare-candy')] }),
      ch('Store a Max Potion', out('The door shuts. You mark the spot on your map.', lose('max-potion'), flag('rk-closet-potion')), { requires: [has('max-potion')] }),
      ch('Store a Revive', out('The door shuts. You mark the spot on your map.', lose('revive'), flag('rk-closet-revive')), { requires: [has('revive')] }),
      ch('Take a peek only', leave()),
    ]),
  ev('rk-pocket-closet-return', 'The Closet, Again', G, { stop: 'event', rarity: 'uncommon', minStage: 2, callback: true, requires: [flagIs('rk-closet-candy', 1)], effect: 'float', tint: '#1a2230' },
    'The same wardrobe stands at this crossroad. It opens with a creak, and the Rare Candy inside seems to have grown.', [
      ch('Take it out', out('Two Rare Candies where there was one.', item('rare-candy', 2), flag('rk-closet-candy', -1))),
    ]),
  ev('rk-pocket-closet-return-2', 'The Closet, Again', G, { stop: 'event', rarity: 'uncommon', minStage: 2, callback: true, requires: [flagIs('rk-closet-potion', 1)], effect: 'float', tint: '#1a2230' },
    'The same wardrobe stands at this crossroad. It opens with a creak.', [
      ch('Take it out', out('Three Max Potions where there was one.', item('max-potion', 3), flag('rk-closet-potion', -1))),
    ]),
  ev('rk-pocket-closet-return-3', 'The Closet, Again', G, { stop: 'event', rarity: 'uncommon', minStage: 2, callback: true, requires: [flagIs('rk-closet-revive', 1)], effect: 'float', tint: '#1a2230' },
    'The same wardrobe stands at this crossroad. It opens with a creak.', [
      ch('Take it out', out('Two Revives where there was one.', item('revive', 2), flag('rk-closet-revive', -1))),
    ]),

  // ---- R543 Bounty Hunter ----
  ev('rk-bounty-hunter', 'The Bounty Hunter', G, { stop: 'ambush', rarity: 'rare', minStage: 2, types: ['dark'], effect: 'shake', tint: '#241414' },
    'A hard-eyed hunter leans out of a doorway. "I hunt the strongest one in any team. Sign my contract and I fight you for the pay."', [
      ch('Accept the contract', fight('"Good. Let\'s see how strong your best really is."', trainer('Bounty Hunter', { cls: 'ace-trainer', size: 3, lv: 4, win: [$(1200), any(...RARE_PICK), rp(15)] }))),
      ch('Pay them off (400)', out('They tip their hat and walk away.', $(-400)), { requires: [money(400)] }),
      ch('Slip away', out('You duck down an alley. They don\'t follow.'), { chance: 0.6, fail: fight('They were faster than they looked.', trainer('Bounty Hunter', { cls: 'ace-trainer', size: 3, lv: 4, win: [$(800), rp(10)] })) }),
    ]),

  // ---- R544 Third Wheel ----
  ev('rk-third-wheel', 'The Third Wheel', G, { stop: 'event', rarity: 'uncommon', effect: 'float', tint: '#2a1c24' },
    'A mystery NPC in a long coat falls in step with you, saying nothing. They seem to be waiting for something.', [
      ch('Let them tag along', out('They hum, whistle, and chat with the Pokémon. After a few nodes, they\'ll pay you back.', companion(3), flag('rk-third-wheel'))),
      ch('Ask them to leave', leave('They tip a hat and take a different road.')),
    ]),

  // ---- R545 Crossroads of Four (four doors, four tiers) ----
  ev('rk-crossroads-four', 'The Crossroads of Four', G, { stop: 'event', rarity: 'rare', effect: 'glint', tint: '#1c2820' },
    'Four doors: wood, iron, silver, gold. A sign says each leads to a richer, riskier event than the last.', [
      ch('The wood door', out('Creak. A common sort of scene is behind it.', room('rk-door-wood'))),
      ch('The iron door', out('Clang. Something uncommon waits.', room('rk-door-iron'))),
      ch('The silver door', out('A hush. Something rare waits.', room('rk-door-silver'))),
      ch('The gold door', out('Light spills out. Something epic waits.', room('rk-door-gold'))),
    ]),
  room_(ev('rk-door-wood', 'Behind the Wood Door', G, { stop: 'event', rarity: 'common', effect: 'none', tint: '#1c2820' }, 'A snug pantry stocked for a long trip.', [
    ch('Help yourself', out('Plenty to go around.', any(...HEALING), any(...BERRIES), $(100))),
  ])),
  room_(ev('rk-door-iron', 'Behind the Iron Door', G, { stop: 'event', rarity: 'uncommon', effect: 'shake', tint: '#20242a' }, 'A sparring hall with one lone fighter in the middle.', [
    ch('Spar', fight('The fighter bows and begins.', trainer('Iron Door Guard', { size: 2, lv: 1, win: [$(400), any(...HELD)] }))),
    ch('Skip it', leave()),
  ])),
  room_(ev('rk-door-silver', 'Behind the Silver Door', G, { stop: 'event', rarity: 'rare', effect: 'sparkle', tint: '#2a2a3a' }, 'A glittering gallery with a single glass case.', [
    ch('Open the case', out('Inside is a silver star and a card of thanks.', item('star-piece'), any(...STONES), rp(10))),
  ])),
  room_(ev('rk-door-gold', 'Behind the Gold Door', G, { stop: 'event', rarity: 'epic', effect: 'sparkle', tint: '#3a3010' }, 'A throne room with a throne no one sits on, and a crown on a cushion.', [
    ch('Take the crown\'s reward', out('Gold pours out. The throne gives a gift to anyone brave enough to enter.', item('rare-candy', 2), better(2), $(900), rp(25))),
  ])),

  // ---- R546 Sunk Cost Choice ----
  ev('rk-sunk-cost', 'The Sunk Cost Choice', G, { stop: 'event', rarity: 'common', effect: 'none', tint: '#24201c' },
    'A half-built wooden bridge across a gorge. A builder shrugs. "We\'re in too deep. Keep paying, or take a refund and go around."', [
      ch('Keep paying (300)', out('The bridge is done! A fine toll and a fine view.', $(-300), express(), rp(5)), { requires: [money(300)], chance: 0.55, fail: out('The bridge collapses. The builder is very sorry.', $(-300), hurt(0.08)) }),
      ch('Take the refund and go around', out('The builder pays up, a little guilty.', $(250), heal(0.1))),
    ]),

  // ---- R547 Perfect Day ----
  ev('rk-perfect-day', 'A Perfect Day', G, { stop: 'event', rarity: 'rare', effect: 'sparkle', tint: '#2a3a2a' },
    'The sun is warm, the breeze is soft, and everyone on this road is smiling at you. Nothing here can go wrong.', [
      ch('Rest in the sun', out('Warm light on every back.', heal(1), cure(), fr(6))),
      ch('Wave to the crowd', out('The crowd tosses you gifts.', $(500), any(...HEALING), any(...BERRIES))),
      ch('Dance in the street', out('A talented dancer gives the lead a hand. It comes away stronger.', lv(1), good(2))),
    ]),

  // ---- R548 Terrible Day ----
  ev('rk-terrible-day', 'A Terrible Day', G, { stop: 'event', rarity: 'rare', effect: 'rain', tint: '#1a1a24' },
    'Dark clouds, a flat tire on a cart, and a stuck bag. Nothing here can go right. But storms leave more behind than they take.', [
      ch('Weather it', out('Everything goes wrong. When the clouds clear, there is a heap of lost goods in the mud.', hurt(0.15), $(-150), better(2), item('rare-candy'), any(...TREASURE), $(900))),
      ch('Duck into shelter', out('You wait it out in a cave. A little bit of treasure.', any(...TREASURE), $(200))),
    ]),

  // ---- R549 Twin Nodes ----
  ev('rk-twin-nodes', 'Twin Nodes', G, { stop: 'event', rarity: 'uncommon', effect: 'float', tint: '#1c202a' },
    'Two scenes unfold side by side at the same crossroad. You can walk through one, or squeeze through both at a price.', [
      ch('Take the left scene', out('You step left.', room('rk-twin-left'))),
      ch('Take the right scene', out('You step right.', room('rk-twin-right'))),
      ch('Do both (a rough pace: -15% health)', out('You hurry through each in turn.', hurt(0.15), room('rk-twin-left'), room('rk-twin-right'))),
    ]),
  room_(ev('rk-twin-left', 'Twin Nodes: Left', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#1c202a' }, 'A tidy camp. A cook waves.', [
    ch('Share a meal', out('A hearty meal for everyone.', heal(0.5), fr(3))),
  ])),
  room_(ev('rk-twin-right', 'Twin Nodes: Right', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#1c202a' }, 'A dusty market stall. A trader waves.', [
    ch('Browse', out('A few handy things.', any(...HEALING), $(200))),
  ])),

  // ---- R550 Counting Sheep (nothing happens; the hidden counter pays at 7) ----
  ev('rk-counting-sheep', 'Counting Sheep', G, { stop: 'rest', rarity: 'common', effect: 'float', tint: '#20202a' },
    'A grassy hill. Nothing is happening. Nothing at all. A sleepy Pokémon counts something under its breath.', [
      ch('Count along', out('One. Two. Three. You nod off. Something stirs in the back of your mind, a counter that doesn\'t stop.', R('sheep-counter', 'Counting Sheep', M.counter('sheep', 7), M.counterDmg('sheep', 7, 1.2)))),
      ch('Nap instead', out('You sleep soundly.', heal(0.3))),
    ]),

  // ---- R551 Wishing Fountain, Reverse ----
  ev('rk-reverse-fountain', 'The Reverse Wishing Fountain', G, { stop: 'well', rarity: 'uncommon', effect: 'sparkle', tint: '#142a3a' },
    'The fountain is full of coins and a sign: "Take a coin instead of leaving one." What could go wrong?', [
      ch('Take a coin', out('A shiny coin. You feel luckier. Slightly.', $(150), rp(2)), { chance: 0.7, fail: out('A cold current pulls the coin from your hand. A tiny curse follows.', hurt(0.05), $(-100)) }),
      ch('Take a fistful', out('A fistful of coins, and a fountain spirit rolls its eyes at you.', $(700)), { chance: 0.35, fail: out('The fountain spits you out. Everyone is soaked, and the coins are gone.', hurt(0.1), $(-250)) }),
      ch('Leave a coin as usual', out('You toss a coin and make a wish.', $(-50), good(1), rp(2))),
    ]),

  // ---- R552 The Interview ----
  ev('rk-interview', 'The Interview', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#20242a' },
    'A hiring manager with a clipboard. "What are you best at? Be honest. Your answer decides how you travel from here on."', [
      ch('"I take big swings."', out('Written down: Bold. You lean into it.', attr('strength', 1), R('interview-bold', 'Trait: Bold', M.dmg(1.05), M.taken(1.05)))),
      ch('"I keep everyone safe."', out('Written down: Careful. You lean into it.', attr('love', 1), R('interview-careful', 'Trait: Careful', M.taken(0.92), M.xp(0.95)))),
      ch('"I always find a deal."', out('Written down: Shrewd. You lean into it.', attr('charisma', 1), R('interview-shrewd', 'Trait: Shrewd', M.price(0.92), M.money(1.05)))),
      ch('"I get lucky a lot."', out('Written down: Lucky. You lean into it.', attr('luck', 1), R('interview-lucky', 'Trait: Lucky', M.crit(0.04), M.rare(1.1)))),
    ]),

  // ---- R553 Pokémon Census ----
  ev('rk-census', 'The Pokémon Census', G, { stop: 'event', rarity: 'common', effect: 'none', tint: '#20282a' },
    'A clerk with a clipboard counts the Pokémon on the road. "Report your team and get paid by how varied it is."', [
      ch('Report a duo or more', out('"Two, at least. Here is a little."', $(150)), { requires: [party(2)] }),
      ch('Report a squad of four', out('"A fine variety!" The clerk is delighted.', $(450), rp(3)), { requires: [party(4)] }),
      ch('Report a full team of six', out('"The best census I have ever seen!" You get the top bonus.', $(1000), rp(10)), { requires: [party(6)] }),
      ch('Decline to be counted', leave()),
    ]),

  // ---- R554 Challenge of the Day (a skill puzzle; the date-seeded version is limited, see docs/status/events-rk.md) ----
  ev('rk-daily-puzzle', 'Challenge of the Day', G, { stop: 'event', rarity: 'common', effect: 'glint', tint: '#1c2a2a' },
    'A board in the square posts today\'s puzzle. Solve it and the town hands out the prize.', [
      ch('Try the timing puzzle', out('Perfect! The prize hatch pops open.', item('rare-candy'), rp(10)), { prompt: { id: 'climb-rhythm', needs: 'good' }, fail: out('You miss the rhythm. The town pays you a pity prize.', $(100)) }),
      ch('Try the sliding puzzle (Intelligence)', out('Click! Today\'s record is yours.', any(...STONES), rp(6)), { check: 'intelligence', fail: out('The tiles jam. Maybe tomorrow.') }),
      ch('Skip it', leave()),
    ]),

  // ---- R555 Elevator Floors ----
  ev('rk-elevator', 'The Elevator Floors', G, { stop: 'event', rarity: 'uncommon', effect: 'none', tint: '#2a2a2a' },
    'A glass elevator with four buttons. Each floor is a different scene. The doors ding.', [
      ch('Floor 1: the lobby', out('Doors open on a cozy lobby.', room('rk-floor-1'))),
      ch('Floor 2: the arcade', out('Doors open on flashing lights.', room('rk-floor-2'))),
      ch('Floor 3: the clinic', out('Doors open on clean white tile.', room('rk-floor-3'))),
      ch('Floor 4: the roof', out('Doors open on open sky.', room('rk-floor-4'))),
    ]),
  room_(ev('rk-floor-1', 'Elevator: The Lobby', G, { stop: 'event', rarity: 'common', effect: 'none', tint: '#2a2a2a' }, 'A tidy lobby with a free snack table.', [ch('Grab a snack', out('Delicious.', heal(0.25), any(...BERRIES)))])),
  room_(ev('rk-floor-2', 'Elevator: The Arcade', G, { stop: 'casino', rarity: 'common', effect: 'glint', tint: '#2a1c3a' }, 'A tiny arcade full of lights.', [ch('Play a round', out('Top score!', $(400)), { chance: 0.5, fail: out('Game over. A few coins lighter.', $(-100)) }), ch('Window shop', leave())])),
  room_(ev('rk-floor-3', 'Elevator: The Clinic', G, { stop: 'heal', rarity: 'common', effect: 'sparkle', tint: '#1c2a2a' }, 'A tiny clinic. The nurse smiles.', [ch('Get checked up', out('Everyone is healed.', heal(1), cure()))])),
  room_(ev('rk-floor-4', 'Elevator: The Roof', G, { stop: 'event', rarity: 'uncommon', effect: 'float', tint: '#14243a' }, 'A rooftop with a great view of the road ahead.', [ch('Look out', out('You see far.', scout(4), rift()))])),

  // ---- R556 Treasure vs Trap ----
  ev('rk-treasure-trap', 'Treasure vs Trap', G, { stop: 'treasure', rarity: 'uncommon', effect: 'glint', tint: '#2a2410' },
    'Two chests in a dim cellar. A hooded NPC leans on the wall. "One is a treasure. One is a trap. I could give you a hint…"', [
      ch('Ask the NPC for a hint (Intelligence)', out('The NPC points. Inside: a fine treasure!', any(...TREASURE), any(...HELD), $(300)), { check: 'intelligence', fail: out('The NPC was lying. It was the trap.', hurt(0.12)) }),
      ch('Open the left chest', out('A treasure!', any(...TREASURE), $(250)), { chance: 0.5, fail: out('A trap! Gas, darts, bad language.', hurt(0.12)) }),
      ch('Open the right chest', out('A treasure!', any(...TREASURE), $(250)), { chance: 0.5, fail: out('A trap! Gas, darts, bad language.', hurt(0.12)) }),
      ch('Leave them both', leave()),
    ]),

  // ---- R557 Stranger's Dice ----
  ev('rk-strangers-dice', 'The Stranger\'s Dice', G, { stop: 'event', rarity: 'uncommon', effect: 'glint', tint: '#24142a' },
    'A stranger shakes a pair of old bone dice. "Roll them and I\'ll tell you what the shops will charge from now on."', [
      ch('Roll the dice', out('Snake eyes? No, double sixes! Shops owe you a discount.', R('dice-discount', 'Lucky Dice: Discount', M.price(0.88))), { chance: 0.5, fail: out('Bad roll. Shopkeepers will remember it.', R('dice-markup', 'Lucky Dice: Markup', M.price(1.1))) }),
      ch('Don\'t roll', leave()),
    ]),

  // ---- R558 Shifting Map Event ----
  ev('rk-shifting-map', 'The Shifting Map', G, { stop: 'event', rarity: 'rare', effect: 'shake', tint: '#241e2a' },
    'The map in your hand curls at the corners. Ahead, the stops slide around like pieces on a board.', [
      ch('Let it shift', out('The next few nodes swap places. Keep your eyes open.', R('shifting-map', 'Shifting Map', M.shuffle(3)), scout(2))),
      ch('Fold the map away', leave()),
    ]),

  // ---- R559 Mastery Echo ----
  ev('rk-mastery-echo', 'The Mastery Echo', G, { stop: 'event', rarity: 'uncommon', effect: 'glint', tint: '#2a1c14' },
    'A dojo gong rings with a deep, long echo. "Your next battle will teach double."', [
      ch('Ring it again', out('The echo settles into the team. Their next battle is a hard lesson, well learned.', blessing('blessing-clarity'), rp(8))),
      ch('Listen quietly', out('You catch just a few words of the echo.', rp(4))),
    ]),

  // ---- R560 Final Curtain Preview ----
  ev('rk-final-curtain', 'The Final Curtain', G, { stop: 'special', rarity: 'rare', minStage: 2, effect: 'glint', tint: '#2a0f14' },
    'A small theatre is putting on a play about a certain Gym Leader. The actor in the leader\'s cape gets every detail right.', [
      ch('Watch the whole play', out('Every move is on stage. You come away knowing the team.', gym(), rp(6))),
      ch('Sit up front and take notes', out('You see more than most, and even catch a few weak points.', gym(), rift(), scout(2))),
      ch('Skip the show', leave()),
    ]),
];

function att_(key: string): Json { return attr(key, 1); }
