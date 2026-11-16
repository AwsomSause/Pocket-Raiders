// Catalog Overhaul Pack, category "places": STORY_FAMILIES_15.md SF97 The Calendar Weeks and SF98 The Challenge Weeks.
// Both are game events (gameEvents.json) that a run started during that week belongs to. Each now opens with a scene on the run's
// first stage (a callback with `gameEvent`, so it only exists in runs of that week):
// - A calendar week's world effect (the week's species turning up more often) is the game event's own modifiers, on every run of
//   the week. The crier's "Join in." adds the week's bonus for the player, for the region; "Not this week." leaves the world as it is.
// - A challenge week is opt-in (`optIn` in gameEvents.json): nothing applies until the player signs up at Grizzle's board. The rule
//   and its reward then hold for the region (the run's "week"); a reward due "at the week's end" is paid when the next region starts.
import { BERRIES, FOSSILS, RARE_HELD, any, ch, egg, ev, flag, flagAgo, flagAt, fr, heal, item, join, lv, out, rest, rp, scout, stat, stopHere, wild, type Json } from '../dsl.ts';
import { no } from './_delve.ts';

export const CATEGORY = 'places';

const forRegion = (label: string, ...effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, until: 'region' });
const seeAgain = (id: string): Json => ({ kind: 'addEvent', eventId: id });

// ---------- SF97: the calendar weeks ----------
interface Week { id: string; name: string; line: string; tint: string; /** What the week is, said by the crier when asked. */ on: string; join: string; fx: Json[] }
const W = (id: string, name: string, tint: string, line: string, on: string, join: string, ...fx: Json[]): Week => ({ id, name, line, tint, on, join, fx });
const typed = (t: string, extra: string) => `${t}-types are turning up everywhere this week, more and rarer than usual. ${extra}`;

const WEEKS: Week[] = [
  W('egg-expedition', 'Egg Expedition', '#5a7a3a', 'Breeders out in force! Eggs everywhere!', 'Breeders are on every road, and nests in every hedge. Join in, and one of them will press an Egg into your hands before you even ask.', 'A breeder with a basket on each arm finds you before you finish saying yes. "Here. Keep it warm. It\'s been waiting for someone." The Egg is warm already, and it twitches.', egg({})),
  W('catch-carnival', 'Catch Carnival', '#7a3a5a', 'Every ball\'s a lucky ball!', 'The whole region is playing at catching. Join in, and your throws land a little truer for the region.', 'Somebody pins a paper rosette to your bag. "Carnival thrower! Good luck, every throw!" For the rest of the region your Balls catch a little more easily.', forRegion('Catch Carnival', { kind: 'captureMultiplier', value: 1.1 })),
  W('water-week', 'Water Week', '#2a5a7a', 'The tide\'s in!', typed('Water', 'Join in, and the rain comes with you: every battle opens with a short shower.'), 'You wade into the fountain with half the town, laughing, soaked to the knees. The sky takes the hint. For the region, every battle opens in a short rain.', forRegion('Water Week', { kind: 'battleStart', weather: 'rain', turns: 3 })),
  W('grass-week', 'Grass Week', '#3a6a2a', 'Herb stalls on every corner!', typed('Grass', 'Join in, and the herb stalls sell to you at half price.'), 'An old herbalist ties a sprig of mint to your collar. "A friend of the week. Half price for you, at every stall, till the region\'s out."', forRegion('Grass Week', { kind: 'priceMultiplier', items: ['energy-root', 'energy-powder', 'heal-powder', 'revival-herb'], value: 0.5 })),
  W('electric-week', 'Electric Week', '#7a6a1a', 'Static in the air!', typed('Electric', 'Join in, and your team learns to shrug off a jolt: their paralysis wears off sooner.'), 'You rub a balloon on your sleeve with a crowd of children and stick it to the crier\'s hat. Everyone\'s hair stands on end. Your team crackles happily all region, and paralysis lets go of them sooner.', forRegion('Electric Week', { kind: 'statusDurationMultiplier', value: 0.75 })),
  W('ice-week', 'Ice Week', '#4a7a8a', 'Lakes frozen solid!', typed('Ice', 'Join in, and your hail lasts two turns longer.'), 'You skate the frozen lake with the town, badly, and fall, and get up, and fall. Someone hands you cocoa. For the region, your hail and snow last two turns longer.', forRegion('Ice Week', { kind: 'weatherTurnsBonus', turns: 2 })),
  W('fighting-week', 'Fighting Week', '#7a2a2a', 'Dojos on every road!', typed('Fighting', 'Join in, and every dojo on the road trains your team harder.'), 'A dojo master bows to you in the square and you bow back, too low. She laughs and corrects your stance. Your team trains harder for it, all region.', forRegion('Fighting Week', { kind: 'xpMultiplier', value: 1.1 })),
  W('poison-week', 'Poison Week', '#5a2a6a', 'Swamp season!', typed('Poison', 'Join in, and status cures cost you half.'), 'The swamp folk come into town with their bubbling pots. Join their parade and they make you a friend of the swamp: status cures are half price for you, all region.', forRegion('Poison Week', { kind: 'priceMultiplier', items: ['antidote', 'paralyze-heal', 'awakening', 'burn-heal', 'ice-heal', 'full-heal'], value: 0.5 })),
  W('ground-week', 'Ground Week', '#6a4a2a', 'The diggers are out!', typed('Ground', 'Join in, and the diggers share what they turn up: rare finds come your way more often.'), 'You dig with the diggers until your hands blister, and they adopt you for it. For the region, rare finds turn up for you more often.', forRegion('Ground Week', { kind: 'rareItemWeight', value: 1.5 })),
  W('flying-week', 'Flying Week', '#4a6a8a', 'Clear skies!', typed('Flying', 'Join in, and the wind takes you a little further down the road.'), 'You let go of a paper kite with a hundred others, and watch it climb out of sight. The wind stays at your back: you can see further down the road, and get there faster.', scout(3), { kind: 'express' }),
  W('psychic-week', 'Psychic Week', '#7a3a6a', 'Whispers in the mind!', typed('Psychic', 'Join in, and the fortune tellers show you the road ahead.'), 'A fortune teller takes your hand and does not look at it. She looks at you. "Two roads ahead. I\'ll show you both." And then you can see them.', scout(2), { kind: 'revealStops' }),
  W('bug-week', 'Bug Week', '#5a6a1a', 'Bug Catching Contest!', typed('Bug', 'Join in, and you are entered in the Bug-Catching Contest: the best catch wins a Sun Stone.'), 'You sign the contest sheet and are handed a net and one Ball. The meadow hums. Somewhere in it is the winning catch.', { kind: 'addEvent', eventId: 'bug-week-contest' }),
  W('rock-week', 'Rock Week', '#6a5a3a', 'Fossil digs!', typed('Rock', 'Join in, and the fossil lab revives one for you, free.'), 'You join the fossil dig and actually find one, and the whole site cheers. The lab revives it on the spot, for nothing. "First find of the week goes free. Tradition."', join({ species: ['omanyte', 'kabuto', 'lileep', 'anorith', 'cranidos', 'shieldon'] })),
  W('ghost-week', 'Ghost Week', '#3a2a5a', 'The routes feel haunted!', typed('Ghost', 'Join in, and you carry a lantern: the Hollow Lantern\'s trail can begin.'), 'They give you a paper lantern with a candle in it, and tell you not to let it go out. It does not go out. It flickers, though, toward the marsh, as if something there is calling it.', flag('hollow-lantern-clue')),
  W('dark-week', 'Dark Week', '#2a2a3a', 'Night falls early!', typed('Dark', 'Join in, and the night-markets let you in: night creatures turn up more often for you.'), 'You stay out after dark with the town, telling stories with the lamps turned low. The night likes you for it. Dark-types come to you more often, all region.', forRegion('Dark Week', { kind: 'typeEncounterWeight', type: 'dark', value: 1.5 })),
  W('steel-week', 'Steel Week', '#5a5a6a', 'Forge fires burn!', typed('Steel', 'Join in, and the forges fit your held items for less.'), 'You work the bellows for an hour at the town forge until your arms shake. The smith claps you on the back. "Held gear, at cost, for you. All region."', forRegion('Steel Week', { kind: 'priceMultiplier', group: 'otherItems', value: 0.75 })),
  W('fairy-week', 'Fairy Week', '#8a5a7a', 'Fairy rings in every meadow!', typed('Fairy', 'Join in, and wild Pokémon meet you friendlier: easier to catch.'), 'You step into a fairy ring with your team and dance, because everyone else is. Nobody laughs. For the region, wild Pokémon meet you a little friendlier, and come to the Ball more easily.', forRegion('Fairy Week', { kind: 'captureMultiplier', value: 1.15 })),
  W('fire-week', 'Fire Week', '#8a3a1a', 'Embers on every road!', typed('Fire', 'Join in, and a bonfire is lit for you on the road: a full rest.'), 'They light the bonfire in the square and you sit close with your team, faces hot, backs cold, until the stars come out. Everyone gets up rested.', rest(), stopHere('heal')),
  W('normal-week', 'Normal Week', '#6a6a5a', 'Plain and proud!', typed('Normal', 'Join in: nothing fancy, just a good day with your Pokémon.'), 'No tricks, no gimmicks: a picnic in the square, a game of catch, a nap in the sun. Your team is happier for it than you expected.', fr(10)),
  W('dragon-hatchling-week', 'Dragon Hatchling Week', '#4a3a7a', 'Baby Dragons hatching!', 'The Dragon breeders have set up on the hills: baby Dragons are turning up more often (never rarer than Rare). Join in, and one of the breeders trusts you with an Egg.', 'The breeder makes you swear to keep it warm and to sing to it, and you swear both. The Egg is heavy and very still. Then, inside, something knocks.', egg({ types: ['dragon'] })),
  W('dual-type-week', 'Dual-Type Week', '#5a5a3a', 'Doubles only!', 'Pokémon with two types turn up more often this week. Join in, and the doubles-only tournament gives you a few pointers.', 'You play a round of the doubles tournament, and lose, and the winner spends an hour showing you why. It was worth losing.', rp(4)),
  W('baby-pokemon-week', 'Baby Pokémon Week', '#8a6a6a', 'Nurseries open!', 'Every nursery has its doors open: baby Pokémon turn up more often. Join in, and the nursery sends you home with an Egg.', 'You spend the morning in the nursery holding tiny Pokémon that fall asleep on you. When you leave, the nurse hands you an Egg. "This one picked you. They do that."', egg({})),
  W('pseudo-legend-week', 'Pseudo-Legend Week', '#5a3a3a', 'The heavyweights wander!', 'The first stages of the great Dragon lines are wandering out of the high places (never rarer than Rare). Join in, and the scouts tell you where to look.', 'A scout with binoculars shows you the tracks: huge, and fresh. "Up there, and up there. Go quiet." You can see where to go.', scout(3)),
  W('eeveelution-week', 'Eeveelution Week', '#7a5a3a', 'Eevee everywhere!', 'Eevee are turning up everywhere this week. Join in, and the Eevee fanciers send you off with an Egg of your own.', 'The fanciers\' club meets in the square, two hundred Eevee in one place. When you leave, one of them is in an Egg in your arms.', egg({ species: ['eevee'] })),
  W('fossil-week', 'Fossil Week', '#5a4a2a', 'Revived fossils!', 'The labs are reviving fossils all week: fossil Pokémon turn up more often. Join in, and the lab revives one for you, free.', 'You bring the lab a fossil, any fossil, and they bring it back to life in front of you. It blinks at you. You are the first thing it has seen in a million years.', join({ species: ['omanyte', 'kabuto', 'aerodactyl', 'lileep', 'anorith', 'cranidos', 'shieldon', 'tirtouga', 'archen'] })),
];

const crier = (w: Week): Json =>
  ev(w.id, `${w.name}: The Crier`, 'Calendar Weeks', { stop: 'event', rarity: 'common', types: [], minStage: 1, callback: true, gameEvent: w.id, tint: w.tint },
    `A bell rings out across the square, again and again, until everyone looks up. Crier Bell stands on a crate with his hat in his hand and his cheeks red from shouting: "${w.line}" People are already hanging bunting. Somebody is selling something on a stick. It is that kind of week.`,
    [
      ch('Join in.', out(w.join, ...w.fx, flag(`week-joined-${w.id}`))),
      ch('What\'s on?', out(`Crier Bell leans down off his crate, delighted to be asked. "${w.on}"`, seeAgain(w.id))),
      ch('Not this week.', out('You smile and keep walking. The week goes on around you anyway: you can hear the bell all the way out of town.')),
    ]);

const BUG_CONTEST: Json = {
  ...ev('bug-week-contest', 'The Bug-Catching Contest', 'Calendar Weeks', { stop: 'event', rarity: 'common', types: ['bug'], minStage: 1, tint: '#5a6a1a' },
    'The meadow is roped off and full of contestants creeping through the grass with nets. The judge has a clipboard and a stopwatch. "Best catch wins the Sun Stone. You\'ve got till the bell."',
    [
      ch('Hunt the long grass.', { text: 'Something big and bright moves in the long grass, and does not want to be caught.', effects: [], battle: { ...wild({ types: ['bug'], lv: 2, win: [item('sun-stone'), flag('bug-contest-won')] }), friendly: true } }),
      ch('Help a little contestant instead.', out('A small boy has caught nothing and is trying not to cry. You show him where the Caterpie hide. He catches one, and holds it up, and the judge gives him a ribbon. He gives you his lunch.', any(...BERRIES), flag('kind-total'), { kind: 'attribute', key: 'goodEvil', amount: 1 })),
    ]),
  room: true,
};

// ---------- SF98: the challenge weeks ----------
interface Challenge { id: string; name: string; line: string; rule: string; reward: string; fx: Json[]; signText: string; /** Paid when the next region starts ("at the week's end"). */ payout?: { text: string; fx: Json[] } }
const C = (id: string, name: string, line: string, rule: string, reward: string, signText: string, fx: Json[], payout?: Challenge['payout']): Challenge => ({ id, name, line, rule, reward, signText, fx, payout });

const STARTER_LINES = ['bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic', 'mudkip', 'turtwig', 'chimchar', 'piplup', 'snivy', 'tepig', 'oshawott', 'chespin', 'fennekin', 'froakie', 'rowlet', 'litten', 'popplio', 'grookey', 'scorbunny', 'sobble', 'sprigatito', 'fuecoco', 'quaxly'];

const CHALLENGES: Challenge[] = [
  C('hardcore-hour', 'Hardcore Hour', 'Bosses hit harder. Pay triple.', 'Bosses deal a quarter more damage.', 'Boss prize money ×3.', 'Grizzle stamps your card so hard the table jumps. "Hardcore. Good. The bosses have been told."',
    [{ kind: 'bossDamageTakenMultiplier', value: 1.25 }, { kind: 'bossMoneyMultiplier', value: 3 }]),
  C('solo-hero-week', 'Solo Hero Week', 'One Pokémon, one road.', 'Only your lead battles, for the region.', 'At the region\'s end, your lead gains +5% to every stat, for good.', 'Grizzle looks at your lead for a long moment, and nods to it, not to you. "One road. You\'ll be fine."',
    [{ kind: 'runRule', id: 'solo-run' }],
    { text: 'Grizzle finds you at the border with the card in his hand. "One Pokémon, one road, a whole region. Look at it." Your lead stands taller than it did. It is stronger, all over, and it knows it.', fx: [stat('all', { who: 'lead' })] }),
  C('critical-week', 'Critical Week', 'Everything lands on the weak spot.', 'Critical hits are twice as likely, for both sides.', 'Prize money ×1.5.', '"Weak spots," says Grizzle. "Theirs and yours. Mind your own."',
    [{ kind: 'critChanceMultiplier', value: 2 }, { kind: 'moneyMultiplier', value: 1.5 }]),
  C('no-items-week', 'No Items Week', 'Bag\'s locked. Balls only.', 'No items in battle, for the region.', 'At the region\'s end, a Rare held item.', 'Grizzle ties a bit of string round your bag in a bow. "Symbolic. Don\'t touch it."',
    [{ kind: 'runRule', id: 'no-battle-items' }],
    { text: 'Grizzle meets you at the border and cuts the string off your bag with a pocketknife. "A whole region with a locked bag. Here. You earned something nice to put back in it."', fx: [any(...RARE_HELD)] }),
  C('no-healing-week', 'No Revival Week', 'No revives. Not even at rests.', 'No revives, for the region: a fainted Pokémon only recovers at a Center.', 'At the region\'s end, +2 Bond for every Pokémon still with you.', 'Grizzle takes your revives off you and puts them in a little box with your name on. "You\'ll get them back. Try not to need them."',
    [{ kind: 'runRule', id: 'no-revives' }],
    { text: 'Grizzle hands back the little box. "You looked after them. Every one." Your team crowds round you while he says it, as if they understood.', fx: [{ kind: 'friendship', bond: 2, who: 'party' }] }),
  C('glass-cannon-week', 'Glass Cannon Week', 'All power, no toughness.', 'Every attack deals 30% more damage, both ways.', 'Prize money ×1.5.', '"All power," says Grizzle. "Hit first. Hit hard. Don\'t get hit."',
    [{ kind: 'damageMultiplier', value: 1.3 }, { kind: 'damageTakenMultiplier', value: 1.3 }, { kind: 'moneyMultiplier', value: 1.5 }]),
  C('giant-week', 'Giant Week', 'Everything\'s huge and slow.', 'Every foe is bigger: two levels higher.', 'Experience ×1.5.', '"They\'ve been eating well out there," says Grizzle. "Very well."',
    [{ kind: 'enemyLevelOffset', value: 2 }, { kind: 'xpMultiplier', value: 1.5 }]),
  C('only-starters-week', 'Only Starters Week', 'Starter lines only.', 'Wild encounters are almost all starter lines, for the region.', 'At the region\'s end, a starter Egg.', 'Grizzle grins. "Every starter there ever was, all on one road. Pick a favourite."',
    [{ kind: 'speciesEncounterWeight', lines: STARTER_LINES, value: 10 }],
    { text: 'Grizzle has a basket at the border with an Egg in it, and a tag: "Starter. Unknown. Warm." "Somebody\'s first partner, one day," he says. "Might be yours."', fx: [egg({ species: STARTER_LINES })] }),
  C('only-fully-evolved-week', 'Only Fully Evolved Week', 'No half measures.', 'Wild Pokémon are fully evolved and two levels higher.', 'Experience ×1.5.', '"Grown-ups only out there," says Grizzle. "Mind yourself."',
    [{ kind: 'speciesEncounterWeight', trait: 'fullyEvolved', value: 6 }, { kind: 'enemyLevelOffset', value: 2 }, { kind: 'xpMultiplier', value: 1.5 }]),
  C('only-unevolved-week', 'Only Unevolved Week', 'Show what a Pichu can do.', 'Wild Pokémon are mostly unevolved, for the region.', 'At the region\'s end, every Pokémon with you gains a level.', '"Little ones," says Grizzle, and his whole face softens. "Show them what little ones can do."',
    [{ kind: 'speciesEncounterWeight', trait: 'unevolved', value: 6 }, { kind: 'speciesEncounterWeight', trait: 'fullyEvolved', value: 0.3 }],
    { text: 'Grizzle checks your card at the border and laughs out loud. "Look at them. Look how they\'ve grown." They have.', fx: [lv(1, 'party')] }),
  C('gravity-week', 'Gravity Week', 'Nothing floats.', 'Gravity in every battle.', 'Prize money ×1.25.', 'Grizzle drops his pen to show you. It falls very fast. "Like that."',
    [{ kind: 'battleStart', field: 'gravity', turns: 5 }, { kind: 'moneyMultiplier', value: 1.25 }]),
  C('trick-room-week', 'Trick Room Week', 'The slow go first.', 'Trick Room in every battle.', 'Prize money ×1.25.', '"Backwards week," says Grizzle. "Slow\'s fast. Fast\'s slow. Don\'t think about it too hard."',
    [{ kind: 'battleStart', field: 'trickRoom', turns: 5 }, { kind: 'moneyMultiplier', value: 1.25 }]),
  C('tailwind-week', 'Tailwind Week', 'Steady wind at your back.', 'Your side has a Tailwind for the first turns of every battle.', 'No extra reward: it\'s a breather.', '"A kind week," says Grizzle. "Everyone needs one. Go on."',
    [{ kind: 'battleStart', tailwind: true, turns: 2 }]),
];

const board = (c: Challenge): Json =>
  ev(c.id, `${c.name}: The Challenge Board`, 'Challenge Weeks', { stop: 'event', rarity: 'common', types: [], minStage: 1, callback: true, gameEvent: c.id, tint: '#4a3a2a' },
    `A board by the road, covered in pinned cards, and a big man in a leather apron leaning on it, chewing a straw. Grizzle, the board keeper, taps one card with a thick finger: "${c.line} Reward's on the card. Sign up, or don't; nobody'll think less of you."`,
    [
      ch('Sign up.', out(`${c.signText} The rule holds for the region. ${c.rule} ${c.reward}`, { kind: 'tempEffect', label: c.name, effects: c.fx, until: 'region' }, flagAt(`challenge-${c.id}`))),
      ch('Read the card.', out(`The card, in Grizzle's big square letters: "${c.name.toUpperCase()}. Rule: ${c.rule} Lasts: this region. Reward: ${c.reward}"`, seeAgain(c.id))),
      ch('Not this run.', out('Grizzle shrugs, not unkindly, and goes back to his straw. "Next time, maybe."')),
    ]);

const payout = (c: Challenge): Json =>
  ev(`${c.id}-payout`, `${c.name}: Grizzle Pays Up`, 'Challenge Weeks', { stop: 'event', rarity: 'common', types: [], minStage: 1, callback: true, requires: [flagAgo(`challenge-${c.id}`, 1), no(`${c.id}-paid`)], tint: '#4a3a2a' },
    `The new region's first road, and Grizzle is waiting at the border with your card, stamped "${c.name.toUpperCase()}: DONE".`,
    [ch('Take the reward.', out(c.payout!.text, ...c.payout!.fx, flag(`${c.id}-paid`)))]);

export const EVENTS: Json[] = [...WEEKS.map(crier), BUG_CONTEST, ...CHALLENGES.map(board), ...CHALLENGES.filter((c) => c.payout).map(payout)];
export const REMOVE: string[] = [];

/** The challenge cards: gameEvents.json keeps each challenge's rule text and modifiers in step with its card (an opt-in week never applies them on its own). */
export const CHALLENGE_CARDS = CHALLENGES.map((c) => ({ id: c.id, rule: c.rule, reward: c.reward, fx: c.fx }));
