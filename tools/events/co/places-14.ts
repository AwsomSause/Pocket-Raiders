// Catalog Overhaul Pack, category "places": STORY_FAMILIES_17.md SF123 The Weather Station, SF124 The Overgrown Laboratory,
// SF125 Auctions, SF126 Fishing.
import { RARE_HELD, $, any, ch, express, flag, fr, front, heal, item, join, money, out, reveal, rp, scout, type Json } from '../dsl.ts';
import { kind, moment, rep } from './_delve.ts';

export const CATEGORY = 'places';

const go = (id: string, text: string, ...fx: Json[]): Json => out(text, ...fx, { kind: 'addEvent', eventId: id });
const room = <T extends Json>(e: T): T => ({ ...e, room: true });
const fightW = (text: string, species: string[], lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'wild', friendly: true, species, types: [], levelBonus: lv, shinyMultiplier: 1, win } });
const fightT = (text: string, name: string, cls: string, size: number, lv: number, win: Json[], ...fx: Json[]): Json => ({ text, effects: fx, battle: { kind: 'trainer', friendly: true, name, classId: cls, size, types: [], levelBonus: lv, win } });
const intel = (n = 1): Json => flag('intel', n);

// ---------- SF123 The Weather Station ----------
const WEATHER: Json[] = [
  {
    id: 'wx-meteorological-station',
    intro: 'A white hut on a hilltop bristling with dishes and spinning cups, every needle inside it twitching. A woman with wild hair and three pencils behind one ear flings the door open. Nimbus Hart, the operator: "Come in! Come in! The instruments are going mad and I\'ve only got two hands!"',
    choices: [
      ch('Help read them.', out('You read out numbers while she scribbles. By the end of it she has a map of tomorrow\'s sky, and she lets you copy it: you know the weather of the road ahead.', scout(4), rp(2))),
      ch('Ask what\'s wrong.', out('"Wrong? Nothing\'s wrong. Everything\'s wonderful. The sky\'s trying to tell us something and I\'ve nearly got it." She talks for an hour. You understand a third. It is still the best hour of your week.', rp(3))),
    ],
  },
  {
    id: 'weather-vane',
    intro: 'A weather vane on a lonely hill, with three little flags on it instead of a cockerel. An old keeper sits at its foot knitting. Keeper: "The sky answers the right question. Only one, mind. It\'s a busy sky."',
    choices: [
      ch('"Will it rain?"', out('The vane spins. The keeper looks up. "Yes," she says. "It always will, somewhere." She goes back to her knitting. It is true, and no use at all, and somehow comforting. An hour later, the first drops come across the hills toward you.', front('rain'), heal(0.1))),
      ch('"Is something coming?"', out('The vane stops dead, pointing one way, and all three flags stand straight out, though there is no wind. The keeper puts her knitting down. "Something is," she says quietly. "From there. Something that isn\'t weather." You know which way to watch now.', intel(), flag('crisis-hinted'), reveal())),
      ch('"What do you want?"', out('The keeper laughs out loud. "Nobody ever asks it that." The vane turns, gently, until it points at you, and stays there. "I think it wants company," she says. You sit with her a while.', fr(3), ...kind())),
    ],
  },
  {
    id: 'weather-prophet',
    intro: 'An old traveller under a tree, with a bowl of water in his lap and his eyes on its surface. "Fifty coins," he says, without looking up, "and I\'ll tell you what the road will hold. True. I\'m never wrong about weather. Only about people."',
    choices: [
      ch('Pay (50).', out('He drops your coin in the bowl and watches the ripples. "Sun. Then cloud. Then the wind turns." He tells you three stops of weather, and every one of them turns out true.', $(-50), scout(3)), { requires: [money(50)] }),
      ch('No.', out('"Fair," he says. "The road will hold it anyway."')),
    ],
  },
  {
    id: 'storm-chasers',
    intro: 'A battered pickup at the roadside, its roof covered in aerials and its back full of instruments. Two people in matching rain jackets argue over a map. Ada and Kip, the storm chasers: "Fronts are our living. There\'s a big one over Thunderstorm Ridge. Want in?"',
    choices: [
      ch('Ride along. (a node)', out('You ride in the back with the instruments, hair standing on end, while Ada drives like the sky is chasing her. At the ridge the clouds split and lightning walks down the hillside, and for one moment, in the flash, you see something running with it: a great beast made of thunder. Then it is gone. Kip is shouting. Ada is laughing. You are both.', express(), flag('sign-raikou'), moment('You chased a storm to Thunderstorm Ridge and saw something running in the lightning.', 65))),
      ch('No.', out('"Your loss!" shouts Ada, and the pickup roars off toward the darkest part of the sky.')),
    ],
  },
];

// ---------- SF124 The Overgrown Laboratory ----------
const LAB_CHOICES = (): Json[] => [
  ch('Read the notes.', go('vt-experiment-gone-wrong', 'You sift through the scattered notes. A project to make Pokémon glow, for night work in the mines: brighter lamps that would never run out. The last pages get shorter and shakier. "It hurts them. It hurts them. Shutting it down." Then nothing. Somewhere deeper in the building, something whimpers.', rp(3), flag('lab-notes'))),
  ch('Search the machines.', go('vt-experiment-gone-wrong', 'You pick through the broken machines. Most are scrap. One drawer has something worth taking. Then, from deeper in the building, something whimpers.', any('pp-up', 'protein', 'iron', 'calcium', 'rare-candy'))),
];
const LAB: Json[] = [
  {
    id: 'ev-forgotten-research-lab',
    intro: 'A rusted gate in the middle of nowhere, and behind it a concrete building, humming. A sign on the gate: RESEARCH ANNEX. The windows are dark, except one, where a light is on.',
    choices: [
      ch('Go in.', go('abandoned-lab', 'The gate is not locked. Nothing here has been locked for years.')),
      ch('Read the sign.', go('ev-forgotten-research-lab', 'Under RESEARCH ANNEX, smaller: CLOSED. The date is twelve years ago. And under that, scratched into the paint with a key: "SORRY."')),
    ],
  },
  room({ id: 'abandoned-lab', intro: 'The Lab. Everything left in a hurry: broken machines, a coffee mug with a skin of mould, notes scattered across the floor as if somebody threw them.', choices: LAB_CHOICES() }),
  { id: 'site-lab', intro: 'A lab nobody has used in years, half swallowed by ivy. Inside, everything left in a hurry: broken machines, scattered notes, a chair on its side.', choices: LAB_CHOICES() },
  room({
    id: 'vt-experiment-gone-wrong',
    intro: 'A wild Pokémon stumbles out of the dark, glowing a sick green, twitching every few seconds as if something is shocking it. Behind it, a broken tank is still leaking something bright across the floor.',
    choices: [
      ch('Calm it.', out('You kneel, and talk, and hold out a hand. It is too frightened to come close, but it stops backing away. That is something.', fr(2), flag('lab-calmed'))),
      ch('Battle.', fightW('It lashes out, glowing brighter.', ['magnemite', 'voltorb', 'grimer'], 2, [rp(2)])),
      ch('Turn off the tank.', out('You find the valve and turn it until it squeals. The leak stops. The glow goes out of the Pokémon like a breath going out of it, and it lies down where it stands and falls asleep, perfectly ordinary. When it wakes, it is fine. It looks at you, and follows you out.', join({ species: ['magnemite', 'voltorb', 'grimer'] }), ...kind(2), moment('You shut off the leaking tank in the old lab, and the glowing Pokémon was ordinary again.', 60))),
    ],
  }),
];

// ---------- SF125 Auctions ----------
const AUCTIONS: Json[] = [
  {
    id: 'auction-popup',
    intro: 'A pop-up auction in a market square. A man in a too-good suit, a smug rival trainer, a Grunt in sunglasses who is trying very hard to look like he is not a Grunt. On the table, one sealed crate. The auctioneer bangs her gavel. "Bids start at two hundred!"',
    choices: [
      ch('Bid. (400)', out('You bid. The rival bids. You bid again. The rival sniffs and lets it go. The crate is yours: inside, packed in straw, something good.', $(-400), any(...RARE_HELD)), { requires: [money(400)] }),
      ch('Ask what\'s in it.', go('auction-popup', '"Unknown," says the auctioneer. "Honest. I don\'t open them." She hands you a slip: everything the crate could be, every one of them listed. That is more than most auctioneers would do.')),
      ch('Outbid the Grunt on purpose. (600)', out('Every time the Grunt raises his paddle, you raise yours higher, smiling at him. He goes red, then purple, then leaves, empty-handed, muttering into his collar. The crate is yours. So is the look on his face.', $(-600), any(...RARE_HELD), { kind: 'evil', heat: 1 }, intel()), { requires: [money(600)] }),
    ],
  },
  {
    id: 'silent-auction',
    intro: 'A silent auction in a hushed gallery. Slips of paper, a locked glass case, and a card: "Closest to the hidden value wins. You never pay more than you bid."',
    choices: [
      ch('Bid low. (200)', out('The value is revealed: far above what you bid. Somebody else wins it by being closer. You keep your money, and the slip, as a souvenir of being cautious.', rp(1))),
      ch('Bid fair. (500)', out('The value is revealed. Your number is the closest in the room. The case opens for you.', $(-500), any(...RARE_HELD)), { requires: [money(500)] }),
      ch('Bid high. (900)', out('Your bid is far over the value, and the closest after all; true to the card, you pay only what it was worth. It is yours.', $(-500), any(...RARE_HELD)), { requires: [money(900)] }),
    ],
  },
  {
    id: 'black-market-auction',
    intro: 'A cellar under a tavern, lit by candles. A masked auctioneer, five bidders in hoods, and on a velvet cushion an egg that glows faintly from inside, the wrong colour for any egg you know. "Opening bid, three hundred."',
    choices: [
      ch('Bid. (900)', out('You bid until the hoods stop bidding. The egg is warm in your hands and wrong in a way you cannot name. It is yours now, whatever it is.', $(-900), { kind: 'egg', species: [], types: [], levelBonus: 0, shinyMultiplier: 1, left: 2, unit: 'stage' }, flag('delta-egg-bought')), { requires: [money(900)] }),
      ch('Report the auction.', out('You slip out and find Professor Linden\'s people. By midnight the cellar is full of officers and empty of hoods. Linden holds the egg up to the light and goes pale. "A Delta egg. Stolen from my lab. Thank you." She will not forget it.', rep(1), flag('delta-egg-returned'), ...kind(2), moment('You reported a black-market auction and returned a stolen Delta egg to Professor Linden.', 65))),
      ch('Steal the egg.', fightT('You grab the egg and run. The guards are faster than they look.', 'Auction Guards', 'black-belt', 3, 3, [{ kind: 'egg', species: [], types: [], levelBonus: 0, shinyMultiplier: 1, left: 2, unit: 'stage' }, flag('delta-egg-stolen')])),
    ],
  },
];

// ---------- SF126 Fishing (Old Catfish and The Magikarp That Could) ----------
const FISHING: Json[] = [
  {
    id: 'fishing-buddy',
    intro: 'An old man on a camp stool at the river, hat over his eyes, rod propped on a stick. He has not caught anything all morning and does not seem to mind. Uncle Ned: "Fish bite when you stop trying. Sit down. The east bend\'s got the big ones, but don\'t tell anyone I said."',
    choices: [
      ch('Fish with him.', out('You sit down and stop trying. The river goes by. Ned tells you about a catfish he has been after for thirty years, Old Whiskers, big as a door. Your line twitches once, and you catch something small and silver, and you let it go, and that was the morning.', heal(0.3), fr(3), flag('old-catfish'))),
      ch('Try the east bend.', fightW('At the east bend the water is deep and dark and very still. Then your line goes tight enough to sing.', ['gyarados', 'lanturn', 'seaking', 'whiscash'], 2, [flag('old-catfish'), moment('You hooked something big at Uncle Ned\'s east bend.', 50)])),
    ],
  },
  {
    id: 'fishing-spot-event',
    intro: 'A fishing jetty with a rack of rods for hire and a cheerful girl minding them. "Borrow a rod? Old, Good, or Super! The board says what bites."',
    choices: [
      ch('Old.', fightW('The board: Magikarp, mostly. Magikarp, a lot. You cast the Old Rod.', ['magikarp', 'goldeen', 'poliwag'], 0, [])),
      ch('Good.', fightW('The board: Goldeen, Poliwag, Krabby, now and then a Horsea. You cast the Good Rod.', ['goldeen', 'poliwag', 'krabby', 'horsea'], 1, [])),
      ch('Super (needs a badge).', fightW('The board: anything. Anything at all. You cast the Super Rod out into the deep water.', ['seaking', 'kingler', 'seadra', 'dratini', 'lapras'], 2, []), { requires: [{ kind: 'badges', atLeast: 1 }] }),
    ],
  },
  {
    id: 'fishing-derby',
    intro: 'A fishing derby on the lake: bunting, a weigh station, a big board of names and weights. The prize, pinned to the board: a Mystic Water and a silver cup. "Biggest catch wins!"',
    choices: [
      ch('Enter.', fightW('You take a spot on the bank and cast. Something heavy takes the hook and pulls back.', ['seaking', 'gyarados', 'whiscash', 'lapras'], 2, [item('mystic-water'), moment('You won the fishing derby with the biggest catch.', 55)])),
      ch('Watch.', out('You watch from the bank with a paper cone of chips. A tiny girl wins with a Magikarp nearly as big as she is, and cries, and the whole lake cheers.', heal(0.2), fr(2))),
    ],
  },
  {
    id: 'r120-magikarp-splash',
    intro: 'A pond full of Magikarp having a splash contest, flopping as high as they can in turn, and a row of children on the bank holding up scorecards. One of them runs over and gives you a card too. "You judge! You\'re the grown-up!"',
    choices: [
      ch('Pick the biggest splash.', out('You hold up a ten for the biggest Magikarp, who did a backflip and soaked everyone. The children cheer. The big one does it again, for an encore.', fr(2))),
      ch('Pick the smallest, trying hardest.', out('There is one very small Magikarp who never gets more than a foot out of the water, and tries every time as if its life depends on it. You give it a ten. It looks at you. You swear it looks at you. When you leave, it is following along the bank in the shallows, flopping after you.', join({ species: ['magikarp'] }), flag('magikarp-could'), moment('You gave the smallest Magikarp a ten, and it followed you.', 60))),
    ],
  },
];

export const EVENTS: Json[] = [...WEATHER, ...LAB, ...AUCTIONS, ...FISHING];
export const REMOVE: string[] = [];
