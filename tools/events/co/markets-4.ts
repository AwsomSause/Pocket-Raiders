// Catalog Overhaul Pack: STORY_FAMILIES_12.md, SF91 THE HONEST GAME CORNER (22 entries, 21 catalog ids).
// Every game of chance prints its odds and payouts, the house edge is stated and never above 10%, and a loss never costs
// more than the stake. Chance games are the `market` effect's `prize` action (one seeded draw per play, the printed table).
// Skill games say so and are skill checks (`prompt`). Each game played sets `corner-played-<id>`: all twenty give Delphine's dice.
import { $, ch, egg, fight, flag, flagIs, item, out, anyType, wild, type Json } from '../dsl.ts';
import { bond, kind, mk, moment, need, pay, stay } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Games of chance';
type Row = { weight: number; label: string; money?: number; item?: string; count?: number; flag?: string; event?: string };
/** One play (or `times` plays) at the printed odds, the stake taken per play. */
const draw = (stake: number, table: Row[], times = 1): Json => mk('prize', { stake, table, ...(times > 1 ? { times } : {}) });
const played = (id: string): Json => flag(`corner-played-${id}`);
const lose = (label = 'Nothing this time'): Row => ({ weight: 1, label });
const GAMES = ['slot-machine', 'ball-toss', 'card-shark', 'coin-flip', 'coin-fountain', 'dice-game', 'fortune-teller-2', 'ghost-gamble', 'lottery-booth', 'mysterious-chest-2', 'mystery-door', 'prize-wheel', 'reward-wheel', 'rf-claw-machine', 'rf-pachinko', 'rf-shell-game', 'rf-weather-bet', 'roulette-of-fate', 'scratch-card', 'voltorb-flip'];

// Printed tables (the sign on each machine says exactly these numbers).
const SLOT = [{ weight: 1, label: 'Three 7s! ₽550', money: 550 }, { weight: 5, label: 'No match' }];
const CARD = [{ weight: 1, label: 'The queen! ₽270', money: 270 }, { weight: 2, label: 'Not the queen' }];
const FLIP = [{ weight: 1, label: 'Called it! ₽190', money: 190 }, { weight: 1, label: 'Wrong side' }];
const DICE = [{ weight: 44, label: 'You roll higher! ₽205', money: 205 }, { weight: 42, label: 'Mags-Fen rolls higher' }, { weight: 14, label: 'A tie (the house)' }];
const LOTTERY = (event?: string): Row[] => [
  { weight: 1, label: 'Jackpot! A Master Ball', item: 'master-ball', ...(event ? { event } : {}) },
  { weight: 5, label: 'A Rare Candy', item: 'rare-candy', ...(event ? { event } : {}) },
  { weight: 20, label: 'A Berry', item: 'oran-berry', ...(event ? { event } : {}) },
  { weight: 74, label: 'No number this time' },
];
const CHEST = [
  { weight: 40, label: 'A pouch of ₽250', money: 250 },
  { weight: 30, label: 'An Ultra Ball', item: 'ultra-ball' },
  { weight: 20, label: 'A Nugget', item: 'nugget' },
  { weight: 10, label: 'A Rare Candy', item: 'rare-candy' },
];
const FREE_WHEEL = [
  { weight: 60, label: 'A Potion', item: 'potion' },
  { weight: 25, label: 'A Super Potion', item: 'super-potion' },
  { weight: 10, label: 'A Great Ball', item: 'great-ball' },
  { weight: 5, label: 'A Rare Candy', item: 'rare-candy' },
];
const PACHINKO = [
  { weight: 62, label: 'An empty pocket' },
  { weight: 20, label: '₽50 pocket', money: 50 },
  { weight: 10, label: '₽100 pocket', money: 100 },
  { weight: 6, label: '₽250 pocket', money: 250 },
  { weight: 2, label: 'The ₽600 pocket!', money: 600 },
];
const RED = [{ weight: 18, label: 'Red! ₽200', money: 200 }, { weight: 19, label: 'Black or green' }];
const NUMBER = [{ weight: 1, label: 'Your number! ₽3,600', money: 3600 }, { weight: 36, label: 'Another number' }];
const SCRATCH = [
  { weight: 75, label: 'No match' },
  { weight: 10, label: 'Stake back: ₽200', money: 200 },
  { weight: 8, label: '₽400', money: 400 },
  { weight: 4, label: '₽1,000', money: 1000 },
  { weight: 2, label: '₽2,000', money: 2000 },
  { weight: 1, label: 'Top prize: ₽5,000', money: 5000 },
];
const WEATHER = [{ weight: 1, label: 'You called it! ₽400', money: 400 }, { weight: 1, label: 'Wrong sky' }];
const DOOR = [{ weight: 1, label: 'The treasure: a Nugget', item: 'nugget' }, { weight: 1, label: 'The Pokémon!', event: 'mystery-door-pokemon' }];
const IDOL_WHEEL = ['jigglypuff', 'clefairy', 'pikachu', 'eevee', 'togepi', 'skitty', 'buneary', 'swirlix'];
const GHOST_PRIZES = ['nugget', 'big-pearl', 'quick-claw', 'soothe-bell', 'silk-scarf', 'lucky-egg'];

const WALL = 'The wall, in plain letters: SLOTS win 1 in 6, pay ₽550 on ₽100 (edge 8%). CARDS 1 in 3, pay 2.7× (10%). COIN 1 in 2, pay 1.9× (5%). DICE 44% you, 42% house, 14% tie, pay ₽205 (10%). ROULETTE red 18 in 37, pay 2×; number 1 in 37, pay 35 to 1 (3%). SCRATCH 1 in 4 wins (9%). PACHINKO pockets printed (6%). SKILL GAMES: no odds, just you.';

const all = GAMES.map((g) => flagIs(`corner-played-${g}`));

export const EVENTS: Json[] = [
  // ---- SF91.1 The Corner Itself ----
  {
    id: 'game-corner', name: 'The Game Corner', group: G,
    intro: 'Slot reels under flashing lights. A sign over the door: EVERY ODD ON THE WALL. ASK. Delphine Ruez, the manager, meets you at it. "Welcome. Read the wall. Anyone says a machine is due, they\'re lying, and I throw them out."',
    choices: [
      ch('Play the slots.', out('"Third row, the dusty one," Delphine says. "It\'s honest. They all are now."', stay('slot-machine'))),
      ch('Read the wall.', out(WALL, flag('corner-read'), stay('game-corner'))),
      ch('Ask about your father.', out('"My father ran this place crooked for thirty years. He lost it in a bet with me. I won honestly." She almost smiles. "He\'s at the coin fountain outside. He\'s made his peace. Mostly."', flag('corner-father'), stay('game-corner'))),
    ],
    remembers: [
      { id: 'corner-dice', when: [...all, flagIs('corner-dice', 0, 0)], notice: 'Delphine is waiting by the door with a small frame under her arm. "Every game in the house. Once each. Nobody does that."',
        addChoices: [ch('Take the frame.', out('Inside the frame: a pair of dice, worn smooth, loaded. Her father\'s. "So nobody uses them again," Delphine says. "Hang them somewhere you\'ll see them."', flag('corner-dice'), moment('Delphine Ruez gave you her father\'s crooked dice, framed, so nobody uses them again.', 65)))] },
      { id: 'corner-lucky', when: [flagIs('roster-lucky-done')], notice: 'Lucky works the Corner\'s door now, his Persian asleep on his feet. He nods you in. He doesn\'t play. He never will again.' },
      { id: 'corner-read', when: [flagIs('corner-read')], notice: 'You have read the wall. The odds are in your head now, every one.', hide: [1] },
    ],
  },
  // ---- SF91.2 The Slot Machine ----
  {
    id: 'slot-machine', name: 'The Slot Machine', group: G,
    intro: 'A dusty slot machine that blinks 777! at nobody. A brass plate is screwed to its side. Printed: "Win 1 in 6. Pays ₽550 on a ₽100 pull. House edge 8%."',
    choices: [
      ch('Pull (100).', out('The reels spin, rattle, and stop one at a time, exactly as fast as the plate says they will.', draw(100, SLOT), played('slot-machine')), need(100)),
      ch('Pull ten times.', out('Ten pulls, ten clanks. A little paper tape curls out of the side with every result and the total at the bottom.', draw(100, SLOT, 10), played('slot-machine')), need(100)),
      ch('Walk away.', out('You walk away. The machine blinks 777! at your back, honestly hopeful.')),
    ],
  },
  // ---- SF91.3 The Ball Toss ----
  {
    id: 'ball-toss', name: 'The Ball Toss', group: G,
    intro: 'A basket at the far end of a long lane. Kip-Ro, the attendant, spins a ball on one finger. "Skill game. Your aim, your prize." The sign: ₽50 a throw. A hit wins a Great Ball.',
    choices: [
      ch('Throw (50).', out('Your throw drops into the basket like it was always going there. Kip-Ro whistles and hands over a Great Ball.', pay(50), item('great-ball'), played('ball-toss')),
        { ...need(50), prompt: { id: 'aim-drag', needs: 'good' }, fail: out('It clips the rim and bounces out. Kip-Ro winces with you. "So close. That one\'s on the lane, not on you."', pay(50), played('ball-toss')) }),
      ch('Let a Pokémon throw.', out('Your Pokémon takes aim, and the ball floats, or flies, straight in. Kip-Ro laughs. "Cheating with style. Allowed." A Great Ball.', pay(50), item('great-ball'), played('ball-toss')),
        { requires: [...need(50).requires, anyType('psychic', 'fighting')], prompt: { id: 'aim-drag', needs: 'ok' }, fail: out('Even your Pokémon misses. It looks at its own paws, betrayed.', pay(50), played('ball-toss')) }),
      ch('Watch someone else.', out('A kid in a cap throws five times and misses five times, each one a little closer. He counts his last coins, and there aren\'t enough. He looks at the basket like it broke his heart.', stay('ball-toss-kid'))),
    ],
  },
  {
    id: 'ball-toss-kid', name: 'The Ball Toss', group: G, room: true,
    intro: 'The kid in the cap stands at the line with no ball and no coins, looking at the basket. Kip-Ro looks at you over the kid\'s head. The sixth throw is ₽50.',
    choices: [
      ch('Pay for his sixth throw.', out('You put down ₽50. The kid throws with his whole body. It goes in. He screams, and Kip-Ro hands him a Great Ball, and he runs off to show somebody without saying thank you, which is exactly right.', pay(50), ...kind(1)), need(50)),
      ch('Just watch.', out('The kid trudges away. Kip-Ro sighs and quietly puts a ball in the kid\'s hand as he passes.')),
    ],
  },
  // ---- SF91.4 The Card Shark ----
  {
    id: 'card-shark', name: 'The Card Shark', group: G,
    intro: 'A harlequin in diamonds shuffles three cards faster than you can see. Mister Harl smiles. "Pick the queen. I won\'t cheat. It\'s on the wall." The wall: 1 in 3, pays 2.7×.',
    choices: [
      ch('Pick a card (100).', out('He lays them out face down. You pick. He turns it over slowly, because he likes this part.', draw(100, CARD), played('card-shark')), need(100)),
      ch('Shuffle it yourself.', out('He hands you the deck happily. "Please. Shuffle all you like. The odds are the same in your hands as in mine." You shuffle, lay them out, and pick.', draw(100, CARD), played('card-shark')), need(100)),
      ch('Ask the odds.', out('"One in three. I lose a little more than I win, over a year." He fans the cards. "I like the company."', stay('card-shark'))),
    ],
  },
  // ---- SF91.5 Coin Flip ----
  {
    id: 'coin-flip', name: 'Coin Flip', group: G,
    intro: 'A young man flipping a silver coin, catching it without looking. Duo grins. "Heads or tails? Double or nothing!" A card on his table: ₽100. 1 in 2. Pays 1.9×. Edge 5%.',
    choices: [
      ch('Heads.', out('The coin goes up, spinning, catching the light, and comes down on the back of his hand.', draw(100, FLIP), played('coin-flip')), need(100)),
      ch('Tails.', out('The coin goes up, spinning, catching the light, and comes down on the back of his hand.', draw(100, FLIP), played('coin-flip')), need(100)),
      ch('Check the coin.', out('He hands it over, offended. Two sides, a head and a tail, both honest. Then he laughs. "Fair. Everyone should check. Nobody does."', stay('coin-flip'))),
    ],
  },
  // ---- SF91.6 The Coin Fountain ----
  {
    id: 'coin-fountain', name: 'The Coin Fountain', group: G,
    intro: 'A fountain shining with coins under a sign: MAKE A WISH. An old man sits on its rim. Old Ruez nods. "Toss one in. It goes to the Lost and Found fund. Your wish goes wherever wishes go."',
    choices: [
      ch('Toss a coin (10).', out('Plink. A tiny splash. Somewhere, a lost Pokémon is ten coins closer to home. You make a wish. You will not say what.', pay(10), ...kind(1), played('coin-fountain')), need(10)),
      ch('Toss a lot (500).', out('A whole handful, ringing on the coins below. Old Ruez whistles. "That\'s a rescue, that is. A real one. Somebody in this region gets found because of you."', pay(500), ...kind(2), flag('lost-and-found-sure'), played('coin-fountain')), need(500)),
      ch('Sit with him.', out('You sit. The water talks to itself. "I lost this place to my daughter," Old Ruez says. "Best thing I ever lost."', played('coin-fountain'))),
    ],
    remembers: [
      { id: 'fountain-father', when: [flagIs('corner-father')], notice: 'You know who he is now. Delphine\'s father, watching the door of the place he used to cheat in.', hide: [2],
        addChoices: [ch('Sit with him.', out('You sit, and tell him Delphine sent you, more or less. He goes very quiet. "She told you? About the bet?" He wipes his eyes. "Tell her the fountain says hello." Later, Delphine nods at you like family.', flag('delphine-standing'), played('coin-fountain')))] },
    ],
  },
  // ---- SF91.7 The Dice Game ----
  {
    id: 'dice-game', name: 'The Dice Game', group: G,
    intro: 'A felt table, two dice, and a big woman with bigger rings. Mags-Fen rattles the cup. "Roll higher than me and double your money!" The sign: ties go to the house. 44% you, 42% me, 14% tie.',
    choices: [
      ch('Roll (100).', out('You roll. She rolls. The dice are clear glass; you can see they\'re true right through.', draw(100, DICE), played('dice-game')), need(100)),
      ch('Read the odds.', out('"Forty-four in a hundred you win and I pay ₽205. Forty-two I win. Fourteen we tie, and ties are mine. That\'s my edge, and it\'s on the sign, and it\'s small."', stay('dice-game'))),
      ch('Leave.', out('Mags-Fen rattles the cup at you as you go, cheerfully, no hard feelings.')),
    ],
  },
  // ---- SF91.8 The Medium's Crystal ----
  {
    id: 'fortune-teller-2', name: "The Medium's Crystal", group: G,
    intro: 'A small tent, a big crystal ball, a woman with silver rings on every finger. Orla, the medium, does not look up. "One reading, ₽200. I\'ll tell you true or not at all."',
    choices: [
      ch('Read me.', out('She looks a long time. "The next land you walk into is already in trouble, and the trouble has a shape. Watch whoever is helping too much, too early." She sits back. "That\'s all. That\'s plenty."', pay(200), flag('crisis-hint'), played('fortune-teller-2')), need(200)),
      ch('Read my lead.', out('Orla looks past the crystal at your lead, not into it. She tells you exactly what it is like, and what it likes, and your lead sits down in front of her like it has been understood.', pay(200), mk('advise', { key: 'nature', who: 'lead' }), played('fortune-teller-2')), need(200)),
      ch('Is any of it real?', out('"The crystal\'s glass." Orla taps it. It rings. "What I see is how you stand. How you hold the lead. Where you look when you\'re worried." She smiles. "That one\'s free."', played('fortune-teller-2'))),
    ],
  },
  // ---- SF91.9 Ghost's Gamble ----
  {
    id: 'ghost-gamble', name: "Ghost's Gamble", group: G,
    intro: 'A grinning Gengar shuffles cards in a dark corner, its prizes glinting in a stack. A sign in a child\'s handwriting: THE GENGAR PLAYS FAIR. ITS PRIZES ARE LOST THINGS. IT TELLS YOU WHOSE. It fans three cards and grins wider.',
    choices: [
      ch('Pick one (200).', out('You pick. The Gengar turns the card over with one long finger, very slowly, enjoying it enormously. One in three wins.', draw(200, [{ weight: 1, label: 'You win a lost thing', flag: 'gamble-won', event: 'ghost-gamble-prize' }, { weight: 2, label: 'The Gengar wins' }]), played('ghost-gamble')), need(200)),
      ch('Ask whose prizes they are.', out('The Gengar holds up each prize, and over each one a face swirls up in purple smoke. A girl in a sunhat. An old fisherman. And one face you know, from somewhere on the road.', stay('ghost-gamble'))),
      ch('Pass.', out('The Gengar sulks magnificently. It turns its back on you and shuffles at the wall.')),
    ],
  },
  {
    id: 'ghost-gamble-prize', name: "Ghost's Gamble", group: G, room: true,
    intro: 'The Gengar slides your prize across the table. As your hand touches it, smoke puffs up and shows you the face of the trainer who lost it, looking for it still. The Gengar watches you, waiting.',
    choices: [
      ch('Keep it.', out('You keep it. The Gengar shrugs. Lost is lost; you won it fair. The face in the smoke fades.', { kind: 'itemFrom', ids: GHOST_PRIZES })),
      ch('Return it to its owner.', out('You carry it to its owner. Their face does exactly what it did in the smoke, only the other way round. When you turn to go, the Gengar is in the shadow of a lamp post, grinning. Later you find an Egg on your bag strap.', ...kind(1), egg({ species: ['gastly'], left: 4, unit: 'stage' }), flag('gengar-follows'))),
    ],
  },
  // ---- SF91.10 The Lottery ----
  {
    id: 'lottery-booth', name: 'The Lottery', group: G,
    intro: 'A glass drum of numbered balls, turning. The clerk taps the board. "Try your luck! Odds on the board." The board: ₽100 a ticket. 1 in 100, a Master Ball. 1 in 20, a Rare Candy. 1 in 5, a Berry.',
    choices: [
      ch('Buy a ticket (100).', out('The drum turns. A ball pops up into the clerk\'s hand. She reads it out like it matters, because it does.', draw(100, LOTTERY()), played('lottery-booth')), need(100)),
      ch('Buy for a friend.', out('You write your lead\'s name on the ticket, carefully. Your lead watches the drum like it is the most important thing in the world.', draw(100, LOTTERY('lottery-friend-win')), played('lottery-booth')), need(100)),
      ch('Read the odds.', out('The clerk reads the board out loud, slowly, and adds: "Seventy-four in a hundred, nothing. I say that part loudest."', stay('lottery-booth'))),
    ],
  },
  {
    id: 'lottery-friend-win', name: 'The Lottery', group: G, room: true,
    intro: 'The ticket in your lead\'s name won. The clerk calls the name out loud across the Corner, and everyone turns. Your lead has never been so proud of anything.',
    choices: [ch('Celebrate.', out('Your lead parades the prize around the Corner. Strangers clap. It will not stop talking about this for days.', bond(2)))],
  },
  // ---- SF91.11 The Rattling Chest ----
  {
    id: 'mysterious-chest-2', name: 'The Rattling Chest', group: G,
    intro: 'An iron chest that rattles a lot. The attendant pats the lid. "₽300 to open. Contents list on the lid." The lid: ₽250 pouch 40%, Ultra Ball 30%, Nugget 20%, Rare Candy 10%.',
    choices: [
      ch('Open it.', out('The lock clicks. You lift the lid on one of the list\'s four things, exactly as promised.', draw(300, CHEST), played('mysterious-chest-2')), need(300)),
      ch('Read the lid.', out('Painted in neat white letters, with the odds beside each line. At the bottom, smaller: "Nothing is ever not on this list."', stay('mysterious-chest-2'))),
      ch('Shake it.', out('It rattles back. Hard. You open it and out tumbles a Pumpkaboo, furious, and then a Mimikyu, more furious. They flee. The attendant puts his face in his hands. "Not again."', played('mysterious-chest-2'))),
    ],
  },
  // ---- SF91.12 Three Doors ----
  {
    id: 'mystery-door', name: 'Three Doors', group: G,
    intro: 'Three painted doors. One hides treasure, one a Pokémon, one nothing. Monty, the host, beams. "Pick a door. Then I\'ll open one you didn\'t pick, and you can switch." The sign: "Switching wins two times in three. Look it up."',
    choices: [
      ch('Door one.', out('You touch door one. Monty nods, then opens door three. Empty. "Now then," he says.', stay('mystery-door-monty'), played('mystery-door'))),
      ch('Door two.', out('You touch door two. Monty nods, then opens door one. Empty. "Now then," he says.', stay('mystery-door-monty'), played('mystery-door'))),
      ch('Door three.', out('You touch door three. Monty nods, then opens door two. Empty. "Now then," he says.', stay('mystery-door-monty'), played('mystery-door'))),
    ],
  },
  {
    id: 'mystery-door-monty', name: 'Three Doors', group: G, room: true,
    intro: 'One door open on nothing. Your door, closed. One other door, closed. Monty taps the sign: switching wins two times in three. "Your call. Switch, or stay?"',
    choices: [
      ch('Switch.', out('You switch. Monty throws the door open with a flourish.', draw(0, DOOR)), { chance: 2 / 3, fail: out('You switch, and the door opens on an empty room. Monty spreads his hands. "One in three. It happens. It\'s still the right call."') }),
      ch('Stay.', out('You stay. Monty opens your door.', draw(0, DOOR)), { chance: 1 / 3, fail: out('You stay, and your door opens on an empty room. "Should\'ve switched," Monty says, kindly. "Everyone thinks they shouldn\'t."') }),
    ],
  },
  {
    id: 'mystery-door-pokemon', name: 'Three Doors', group: G, room: true,
    intro: 'Behind the door, a Pokémon sits on a velvet cushion, blinking at the light. It has a ribbon round its neck that says PRIZE. It looks at you to see if you are the sort of person it would like.',
    choices: [
      ch('Welcome it.', out('You kneel and hold out a hand. It sniffs, decides, and climbs into your arms. Monty dabs his eyes.', { kind: 'join', shadow: false, species: ['eevee', 'pichu', 'cleffa', 'igglybuff', 'togepi', 'azurill'], types: [], levelBonus: 0, shinyMultiplier: 1 })),
      ch('Let it go home.', out('You untie the ribbon. It hops off the cushion, looks back once, and trots away to wherever it came from. Monty says that\'s never happened before.', ...kind(1))),
    ],
  },
  // ---- SF91.13 The Idol's Wheel ----
  {
    id: 'prize-wheel', name: "The Idol's Wheel", group: G,
    intro: 'A pop idol in sequins presents a wheel with eight Pokémon painted on it. Starla waves. "Spin it! You win a meet-and-greet with whoever it lands on!" Each slice is one in eight. ₽100 a spin.',
    choices: [
      ch('Spin (100).', fight('The wheel clicks round and slows, and the crowd counts it down, and then the Pokémon on the slice is right there, very real, and ready to meet you properly.', { ...wild({ species: IDOL_WHEEL }), friendly: true }, pay(100), played('prize-wheel')), need(100)),
      ch('Can I just meet them?', fight('Starla laughs, delighted. "Nobody asks that! One free spin, then." The wheel spins. The Pokémon it lands on bounces out to meet you.', { ...wild({ species: IDOL_WHEEL }), friendly: true }, played('prize-wheel'))),
      ch('Leave.', out('Starla blows you a kiss anyway. The crowd cheers, because they cheer at everything.')),
    ],
  },
  // ---- SF91.14 The Free Wheel ----
  {
    id: 'reward-wheel', name: 'The Free Wheel', group: G,
    intro: 'A promoter in a Mart apron by a wheel with its odds painted right on the slices. Gus-Ann grins. "Free! No tickets, no catch. The Mart pays for it." Potion 60%, Super Potion 25%, Great Ball 10%, Rare Candy 5%.',
    choices: [
      ch('Spin.', out('The wheel ticks round and settles. Gus-Ann hands you the prize with a Mart flyer folded around it.', draw(0, FREE_WHEEL), played('reward-wheel'))),
      ch("What's the catch?", out('"You\'ll come into the Mart after. That\'s it." She shrugs. "Most people do. Most people buy something. The wheel pays for itself."', stay('reward-wheel'))),
      ch('Leave.', out('Gus-Ann waves the flyer after you. "The wheel will be here!"')),
    ],
  },
  // ---- SF91.15 The Claw Machine ----
  {
    id: 'rf-claw-machine', name: 'The Claw Machine', group: G,
    intro: 'A glass box full of Poké Dolls and one shiny prize. The sign: "Skill game. The claw grips at full strength. We checked." ₽100 a go. A hit: a Poké Doll, 9 in 10, or a Shiny Stone, 1 in 10.',
    choices: [
      ch('Play (100).', out('The claw drops, grips, and holds. Honestly holds. It carries the prize all the way to the chute.', pay(100), draw(0, [{ weight: 9, label: 'A Poké Doll', item: 'poke-doll' }, { weight: 1, label: 'The Shiny Stone!', item: 'shiny-stone' }]), played('rf-claw-machine')),
        { ...need(100), prompt: { id: 'claw-drag', needs: 'good' }, fail: out('The claw closes on air an inch to the left. Full strength, wrong place. That one is on you.', pay(100), played('rf-claw-machine')) }),
      ch('Let a Pokémon with a steady hand play.', out('Your Pokémon steers the claw with total concentration, tongue out. It drops right on the prize.', pay(100), draw(0, [{ weight: 9, label: 'A Poké Doll', item: 'poke-doll' }, { weight: 1, label: 'The Shiny Stone!', item: 'shiny-stone' }]), played('rf-claw-machine')),
        { requires: [...need(100).requires, anyType('psychic', 'fighting')], prompt: { id: 'claw-drag', needs: 'ok' }, fail: out('Even your steadiest Pokémon misses. It glares at the claw as if the claw did it on purpose.', pay(100), played('rf-claw-machine')) }),
      ch('Look at the prizes.', out('Rows of Poké Dolls. And near the back, one that looks exactly like your starter, down to the expression. Somebody made it with care.', stay('rf-claw-machine'))),
    ],
  },
  // ---- SF91.16 Pachinko ----
  {
    id: 'rf-pachinko', name: 'Pachinko', group: G,
    intro: 'Rows of brass pins and a hundred little pockets, each with its prize printed beneath it. ₽50 a ball. Most pockets are empty. Some pay ₽50, ₽100, ₽250. Two at the bottom pay ₽600.',
    choices: [
      ch('Drop a ball (50).', out('The ball clatters down through the pins, bouncing, ringing, and drops into a pocket.', draw(50, PACHINKO), played('rf-pachinko')), need(50)),
      ch('Drop ten.', out('Ten balls, one after another, a waterfall of ringing brass. The counter at the side adds it up.', draw(50, PACHINKO, 10), played('rf-pachinko')), need(50)),
      ch('Leave.', out('The pins ring softly behind you, a ball still finding its way down from someone else\'s go.')),
    ],
  },
  // ---- SF91.17 The Shell Game ----
  {
    id: 'rf-shell-game', name: 'The Shell Game', group: G,
    intro: 'Three shells on an upturned crate. Nimble Nan shows you the Poké Ball under one. "Follow the Ball, friend! Guess right and your money doubles." The sign: "Skill game. No ball palmed. Ever." ₽100 a go.',
    choices: [
      ch('Play (100).', out('Her hands blur. They stop. You point. She lifts the shell: the Ball. Nan laughs and pays out ₽200. "Sharp eyes!"', pay(100), $(200), played('rf-shell-game')),
        { ...need(100), prompt: { id: 'shell-tap', needs: 'good' }, fail: out('You point. She lifts the shell: nothing. She lifts the other: the Ball, right where it should be. "Fair and square," she says, and she means it.', pay(100), played('rf-shell-game')) }),
      ch('Watch her hands.', out('Nothing up her sleeves. She rolls them up to the elbow to show you, then shuffles slowly, just for you, so you can see how it goes.', stay('rf-shell-game'))),
      ch('Leave.', out('Nan tips an imaginary hat. "Come back when your eyes are rested."')),
    ],
  },
  // ---- SF91.18 The Weather Bet ----
  {
    id: 'rf-weather-bet', name: 'The Weather Bet', group: G,
    intro: 'A man in a rain hat with a barometer under his arm. Cloudy Pete squints at the sky. "Next node, rainy or clear? ₽200 says you can\'t tell." Right, he pays ₽200. Wrong, you pay him.',
    choices: [
      ch('Rainy.', out('Pete licks a finger, holds it up, and waits. The sky makes up its mind.', draw(200, WEATHER), played('rf-weather-bet')), need(200)),
      ch('Clear.', out('Pete licks a finger, holds it up, and waits. The sky makes up its mind.', draw(200, WEATHER), played('rf-weather-bet')), need(200)),
      ch('Check the sky.', out('Your Flying-type goes up, circles once, and comes down certain. You tell Pete. Pete groans, looks up, and pays. "Birds," he says bitterly. "Always birds."', $(200), played('rf-weather-bet')), { requires: [anyType('flying')] }),
    ],
  },
  // ---- SF91.19 Roulette of Fate ----
  {
    id: 'roulette-of-fate', name: 'Roulette of Fate', group: G,
    intro: 'A clown in a sparkly waistcoat spins a giant wheel. Bimbo the Somewhat Honest bows. "Fate decides! The wall decides how often!" Red: 18 in 37, pays 2×. One number: 1 in 37, pays 35 to 1. ₽100 a bet.',
    choices: [
      ch('Bet on red (100).', out('The ball skitters round the rim, drops, bounces, and settles.', draw(100, RED), played('roulette-of-fate')), need(100)),
      ch('Bet on a number (100).', out('You pick your number. Bimbo writes it on a little card and holds it up to the crowd. The ball goes round.', draw(100, NUMBER), played('roulette-of-fate')), need(100)),
      ch('Watch.', out('You watch a dozen spins. Red, black, red, red, green. Bimbo honks his nose at every one. Nobody gets rich. Nobody gets hurt.')),
    ],
  },
  // ---- SF91.20 Scratch Cards ----
  {
    id: 'scratch-card', name: 'Scratch Cards', group: G,
    intro: 'A kiosk with a fan of glittering cards. "Scratch cards, ₽200 each!" The back of every card prints the odds: 1 in 4 wins back the stake or more. Top prize ₽5,000, 1 in 100.',
    choices: [
      ch('Buy one.', out('You scratch with a coin, silver flaking off like snow.', draw(200, SCRATCH), played('scratch-card')), need(200)),
      ch('Buy five.', out('Five cards, five coins\' worth of silver dust on the counter.', draw(200, SCRATCH, 5), played('scratch-card')), need(200)),
      ch('Read the back.', out('Three in four: no match. One in ten: your ₽200 back. One in twelve-and-a-half: ₽400. One in twenty-five: ₽1,000. One in fifty: ₽2,000. One in a hundred: ₽5,000. Edge: 9%.', stay('scratch-card'))),
    ],
  },
  // ---- SF91.21 Voltorb Flip ----
  {
    id: 'voltorb-flip', name: 'Voltorb Flip', group: G,
    intro: 'A board of face-down cards. Some hide coins, some hide Voltorb. The sign: "Skill game. Row and column totals are shown. Think." The board hums faintly.',
    choices: [
      ch('Play.', out('You sit down at the board. It lights up, row by row, numbers glowing at the ends of each line. Think.', { kind: 'addStop', stop: 'minigame', game: 'puzzle-slots' }, played('voltorb-flip'))),
      ch('Read the rules.', out('Every row and column shows two numbers: the coins in it, and the Voltorb in it. Flip a coin card and your round\'s coins multiply. Flip a Voltorb and you lose that round\'s coins only.', stay('voltorb-flip'))),
      ch('Leave.', out('The board hums behind you, every card still face down.')),
    ],
  },
];

export const REMOVE: string[] = [];
