// Greenneedle new event 11: The Night Parade (doc GREENNEEDLE_PLACED_1.md lines 412–449). Rules: src/core/greenneedle/parade.ts.
// Build: npm run co:build -- greenneedle-new-11   then   npm run co:gn
// A step-15 must-see at night, once per region. Hide / Watch / Join. Joining opens the Spirit Market, a screen of its own (minigame
// `gn-spirit-market`, core/greenneedle/spiritMarket.ts and spiritMarketEnd.ts): six lanterns, four stalls, a trade is one action. The last region's
// curtain opens for a player who joined every parade. The lane and stall rooms below are the earlier version of the market (choice
// scenes); nothing leads to them any more, and they stay only for a run saved inside one.
import { ch, flag, heal, join, out, type Json } from '../dsl.ts';
import { bond, chIf, gev, gn, is, moment, rm, say, scene, setTo, stampRegion, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#2a2140';
const night = (o: Json = {}): Json => ({ tint: TINT, tags: ['Mystery', 'Story'], effect: 'none', ...o });
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const L = 'parade-lanterns';
const DOOR = 'gn-new-11-door';
const LANE_A = 'gn-new-11-lane-a';
const LANE_B = 'gn-new-11-lane-b';
const DARK = 'gn-new-11-dark';
const CURTAIN = 'gn-new-11-curtain';

/** After a stall action: one lantern less; the lanes again, or the dark when none is left. */
const spend = (lane: string): Json[] => [flag(L, -1), when(L, { min: 0, max: 0 }, [scene(DARK)]), when(L, { min: 1 }, [scene(lane)])];
/** Leaving the market: the last region's curtain opens for a player who joined every parade. */
const closing = (): Json[] => [gn('check', { key: 'parade-all', if: [gnc('paradeAll', { key: 'parade-joined' })] }), when('parade-all', { min: 1 }, [scene(CURTAIN)])];

const bellLine = { id: 'bell', when: [is(L, 2, 2)], notice: 'At the gate the Misdreavus rings its little bell. Once. The fifth action is coming, and everyone in the lane hears it.' };
const lanterns = (): string => 'Lanterns left: **{flag:parade-lanterns}** of six.';

const EVENTS: Json[] = [
  gev(DOOR, 'The Night Parade', night({ stop: 'event', rarity: 'uncommon', forced: true, requires: [{ kind: 'gn', test: 'notThisRegion', key: 'parade-at' }] }), say(
    'Every street lamp goes out. One after another, in a line, coming toward you.',
    '*Lanterns. Masks. A hundred Ghost- and Dark-types, walking in step. In the middle, a palanquin with its curtains shut.*',
    'Nobody speaks. Your Pokémon have stopped moving. You can hear them breathe.',
  ), [
    ch('Hide.', out('You flatten yourself into a doorway and hold your breath. The lanterns pass, a hundred of them, close enough to warm your face. In the morning there is a mask on the road, left behind or left for you. It is only a mask.', flag('parade-hid'), stampRegion('parade-at'), moment('Hid from the Night Parade, and found a mask on the road.', 40))),
    ch('Watch.', out('You stand where you are. The palanquin goes by. For a moment its curtain moves, as if someone inside is looking back. One of your Pokémon presses hard against your leg and does not let go until the last lantern is gone.', bond(1), flag('parade-watched'), stampRegion('parade-at'))),
    ch('Join the back of the line.', out('You step in behind the last lantern. Nobody stops you. **The line ends at a Spirit Market. Six actions before the lanterns burn down. Stay past the sixth, and you wake at the next step with one item swapped for another of the same tier.** A Misdreavus at the gate says so, once, politely.', flag('parade-joined'), stampRegion('parade-at'), setTo(L, 6), gn('minigame', { key: 'gn-spirit-market', n: 1 }))),
  ]),

  rm(LANE_A, 'The Spirit Market: First Lane', night({ remembers: [bellLine] }), say(
    '*Paper lanterns, burning low. Stalls with no prices. Nothing here is sold for money.*',
    'The Masked Banette keeps a stall of three moves. The Sableye with scales sits behind a pile of old pages.',
    lanterns(),
  ), [
    ch('The Masked Banette.', out('The Banette lays three moves on a cloth, face up. "A move for a move," it says. "Fair is fair."', scene('gn-new-11-banette'))),
    ch('The Sableye with scales.', out('It rubs a gem against its claws. "A memory," it says. "One line from your Notebook. I\'ll erase it. You\'ll never miss it. For something Rare."', scene('gn-new-11-sableye'))),
    ch('Walk on, down the lane.', out('The lantern light bends. The lane turns, and two more stalls wait there.', scene(LANE_B))),
    ch('Leave the market.', out('You turn your back on the lanterns. The line closes behind you without a sound. The market is gone before you reach the road.', ...closing())),
  ]),
  rm(LANE_B, 'The Spirit Market: Second Lane', night({ remembers: [bellLine] }), say(
    '*A mirror-bright stall. Further down, a very old shape, folded small, behind a cold fire.*',
    'The Mismagius trades secrets. The Old Dusclops trades what was taught before the game began.',
    lanterns(),
  ), [
    ch('The Mismagius.', out('It floats at your shoulder and sings very softly. "A nickname," it says. "Give it to me, and I\'ll give you a secret. One on this stage."', scene('gn-new-11-mismagius'))),
    ch('The Old Dusclops.', out('It opens one eye. "Any one egg move," it says. "For a move your Pokémon already knows. It will not be the same Pokémon after."', scene('gn-new-11-dusclops'))),
    ch('Walk back, up the lane.', out('The lanterns sway. The first lane is where you left it.', scene(LANE_A))),
    ch('Leave the market.', out('You turn your back on the lanterns. The line closes behind you without a sound. The market is gone before you reach the road.', ...closing())),
  ]),

  rm('gn-new-11-banette', 'The Spirit Market: The Masked Banette', night(), say(
    'Three moves on a cloth. A tiny hand covers the one you are not looking at.',
    '**The Banette:** "Your lead puts one of its own on the cloth. Take one. Only one."',
    lanterns(),
  ), [
    // Three moves are shown (dealt by the stop's seed); the player takes one and picks which of the lead's four goes to the cloth.
    ch('Trade a move.', out('The Banette lifts its hand. Three moves, face up, and none of them hidden.', gn('paradeSwap'), ...spend(LANE_A)), { requires: [gnc('paradeMoveReady')] }),
    ch('Back to the lane.', out('"Come back before the bell," says the Banette. "I do like a customer."', scene(LANE_A))),
  ]),
  rm('gn-new-11-sableye', 'The Spirit Market: The Sableye with Scales', night(), say(
    'Pages of old handwriting, piled like leaves. Yours, somewhere in there.',
    '**The Sableye:** "One line. The one you\'d miss least. Gone. And not a soul will remember it ever being there."',
    lanterns(),
  ), [
    ch('Trade a memory.', out('A page curls and drops to ash. You try to remember what it said, and cannot, and the Sableye is already holding out something Rare, kind about it.', gn('paradeForget'), gn('paradeRare'), ...spend(LANE_A)), { requires: [gnc('paradeMemory')] }),
    ch('Back to the lane.', out('"The pages keep," says the Sableye. "That is the trouble with them."', scene(LANE_A))),
  ]),
  rm('gn-new-11-mismagius', 'The Spirit Market: The Mismagius', night(), say(
    'It sings in a voice like a music box with the lid half closed.',
    '**The Mismagius:** "A name you gave. Give it back. I give you a secret in exchange, and a good one."',
    lanterns(),
  ), [
    ch('Trade a nickname.', out('The name goes up into the lantern light. Your Pokémon blinks, pleased and lost and a little lighter. The Mismagius whispers where to look.', gn('paradeSecret'), ...spend(LANE_B)), { requires: [gnc('paradeNickname')] }),
    ch('Back to the lane.', out('"Names are heavy," says the Mismagius. "Come back when yours is."', scene(LANE_B))),
  ]),
  rm('gn-new-11-dusclops', 'The Spirit Market: The Old Dusclops', night(), say(
    'It has outlasted every lantern in the lane, and it knows it.',
    '**The Old Dusclops:** "Teach me what yours knows. I will teach it what its grandparents knew. Sit. It is a long lesson."',
    lanterns(),
  ), [
    // Any one egg move of its line, the player's choice, for one of the four moves it knows (also the player's choice).
    ch('Trade for an egg move.', out('The lesson takes no time at all, and all night. Every move its grandparents knew is laid out, and you may choose one.', gn('paradeEgg'), ...spend(LANE_B)), { requires: [gnc('paradeEggReady')] }),
    ch('Back to the lane.', out('"Another time," says the Dusclops. It does not say when.', scene(LANE_B))),
  ]),

  rm(DARK, 'The Spirit Market: The Last Lantern', night({ tags: ['Mystery', 'Story'] }), say(
    'The last lantern gutters. The Misdreavus is already at the gate, ringing its bell, and ringing it, and ringing it.',
    '**The Misdreavus:** "Out, please. Now, please. Nobody has ever been sorry to leave on time."',
  ), [
    ch('Leave now.', out('You step out through the gate as the last light goes. Behind you the market folds up like a letter. You are on the road, and it is raining a little, and you are fine.', ...closing())),
    ch('Stay.', out('You stay. The dark is soft, and then it is not there. You wake at the next step with something in your bag that was not there before. One item swapped for another of the same tier, as the Misdreavus said.', gn('paradeWake'), ...closing())),
  ]),
  rm(CURTAIN, 'The Night Parade: The Curtain', night(), say(
    'The palanquin stops in front of you. You have followed it in every region. It has been waiting.',
    'The curtain opens. There is no one grand inside. A small Litwick sits on the cushion, holding a lantern as big as itself, asleep on its feet.',
    '*It has been carried across the world, every night, so it would not have to walk. It opens its eyes and sees you, and knows you.*',
  ), [
    ch('Take its lantern.', out('It puts its flame into your hand, and follows. The palanquin goes on without it, lighter, and one lantern fewer.', join({ species: ['litwick'] }), heal(1), moment('The Night Parade opened its curtain for you, and a Litwick came out.', 90))),
  ]),
];

export { EVENTS };
export const REMOVE: string[] = [];
export const CHAINS: Json[] = [];
export const PLACEMENT: Record<string, Placement> = {
  [DOOR]: {
    gn: 'gn.new.11', shape: 'Single', earliest: 'A3', home: 15, window: [10, 17], sits: 'must-see', attaches: 'after', tags: ['World Event'],
    needs: ['night'], stages: [3, 4, 5, 6, 7], level: 'No battles', often: 'region', badge: 'own',
    dressing: { kanto: 'The Night Parade', elsewhere: 'The Night Parade' },
    note: 'Badge: a lantern. Once per region, at night (the placer tries step 15, then 16–17, then 14 down to 10, the doc fallback; a stage that is not at night skips it, and it stays owed until the first night stage that fits, because its once-per-region stamp is set only when it is played). Joining opens the Spirit Market screen (six lanterns, four stalls, a trade is one action, the bell at the fifth, stay past the sixth and one item is swapped); the last region opens the palanquin for a player who joined every parade.',
  },
};
