// Beta 0.6 E3: the eight Kanto story events (`xe.kanto.*`) from tools/sources/expansion/01_KANTO_TEAM_ROCKET_EXPANDED.md E5.
// Built into src/data/events/xe-kanto.json by tools/build-expansion-events.ts (npm run data:xe-events).
// How the script maps onto this game: Heat is the Evil Team heat; Intel and Operational Strength do not exist yet, so an
// event writes a story flag (`ev:rocket-...`) for the slices that will read them; money is scaled to this game's prices.
import { ch, ev, fight, flag, good, has, inRegion, leave, lose, money, out, rest, trainer, $, wild, companion, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const track = (input: string): Json => ({ kind: 'track', input });
const note = (special: string): Json => ({ kind: 'fieldNote', special });
const base: Json[] = [inRegion('kanto'), { kind: 'xevents' }];
const grunt = (name: string, size = 2, lv = 0, win: Json[] = []) => trainer(name, { cls: 'roughneck', size, lv, win });

export const XE_KANTO_EVENTS: Json[] = [
  ev('xe.kanto.small-print', 'Small Print', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.worker_m', 'trainer.roughneck'], tint: '#2a1414', effect: 'flicker' } as never,
    'A bike shop with its shutter half down. The owner: "We\'re closed. We\'re not closed. We\'re... between payments." A Rocket Collector steps out with a receipt book. "Insurance. Fires, floods, people like me."', [
      ch('"How much does he owe?" (₽4,000)', out('"Four thousand. For you, four thousand." The shop reopens with a permanent 10% discount for you. The Collectors will ask again.', $(-4000), heat(-3), flag('rocket-paid-once'), { kind: 'relic', id: 'xe-kanto-insured', name: 'Insured Shop', effects: [{ kind: 'priceMultiplier', group: 'all', value: 0.9 }] }), { requires: [money(4000)] }),
      ch('"Show me the policy."', fight('"It\'s a verbal policy!" The receipt book drops. It lists eleven shops and one Gym.', grunt('Rocket Collector', 2, 0, [flag('rocket-receipt-book')]))),
      ch('"Whose Pokémon is in that crate?"', fight('A Growlithe with a black tag. You win, and it goes home. The receipt book falls too.', grunt('Rocket Collector', 2, 1, [flag('rocket-receipt-book'), good(3)]))),
      ch('Leave', leave('"They\'ll send someone bigger," the owner says. "They always send someone bigger."')),
    ]),
  ev('xe.kanto.appointment', 'The Appointment', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'evil', heat: 35 }], cast: ['trainer.gentleman'], tint: '#14141c', effect: 'glint' } as never,
    'A black car idles at the curb. A woman with a tablet steps out. "You\'re difficult to schedule. I have eleven minutes, so I\'ll be direct. The Boss has noticed you. Being noticed is expensive. He would like to make it cheap."', [
      ch('Take the envelope', out('₽5,000 and a month of quiet. "I\'ll put you down as \'bought\'."', $(5000), heat(-20), flag('rocket-bought'))),
      ch('Refuse', out('"I\'ll put you down as \'declined\'. He keeps that list short."', heat(5), flag('rocket-declined'))),
      ch('Take it, and take it to Officer Jenny', out('The police hold the evidence. The envelope stays with them.', flag('rocket-wire'), good(3))),
      ch('"Does he always send you?"', out('A pause, the first. "He sends me when he\'d rather not send Domino. Take that as a compliment."', flag('rocket-matori-line'))),
    ]),
  ev('xe.kanto.roadblock', 'The Roadblock', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: [...base, { kind: 'track', atLeast: 3 }], cast: ['trainer.roughneck'], tint: '#241818', effect: 'none' } as never,
    'A Snorlax sleeps across the road. A catering truck with a red R is parked beside it, and two grunts are shovelling food. "Forty kilos a day. Each. Boss says it\'s cheaper than a wall."', [
      ch('Play the Poké Flute', fight('The Roadblock wakes hungry and angry.', wild({ species: ['snorlax'], lv: 3 }), flag('rocket-roadblock-flute'), note('sv.rocket.roadblock')), { requires: [has('poke-flute')] }),
      ch('Stop the food truck', fight('Three fights, and the truck never reaches the second Snorlax. Both wander off by morning.', trainer('Rocket Driver', { cls: 'roughneck', size: 2, chain: 3, win: [track('raidSuccess'), flag('rocket-roadblock-truck')] })), note('sv.rocket.roadblock')),
      ch('Feed it yourself (3 Oran Berries)', out('It rolls over. The road opens for you.', lose('oran-berry'), lose('oran-berry'), lose('oran-berry'), flag('rocket-roadblock-fed'), note('sv.rocket.roadblock')), { requires: [{ kind: 'item', id: 'oran-berry', count: 3 }] }),
    ]),
  ev('xe.kanto.harbor-export', 'Harbor Export', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 2 }, { kind: 'period', in: ['evening', 'night'] }], cast: ['trainer.roughneck', 'trainer.gentleman'], tint: '#101820', effect: 'none' } as never,
    'A freighter with no name. Cranes moving in the dark. "Harbor\'s closed, kid." You: "Those crates are breathing." A thin man in a lab coat checks one with a handheld reader: "Corruption is uneven on this batch, Major. Your technicians are rushing."', [
      ch('Count the crates', out('You count forty-one crates. You write the number down.', flag('rocket-manifest-count'), flag('cipher-seen-ein'))),
      ch('Challenge Major Surge', fight('"I don\'t stay for the practical," the man says as he walks away. "Send me the numbers."', grunt('Major Surge', 3, 2, [flag('rocket-surge-down'), flag('cipher-seen-ein')]))),
      ch('Leave', leave()),
    ]),
  ev('xe.kanto.blaine-defects', 'The Riddle Without a Joke', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: base, cast: ['trainer.hiker'], tint: '#2a1810', effect: 'flicker' } as never,
    'An old man in sunglasses is burning a notebook in a metal bin. "Riddle. What wears armor and has never been in danger? A prisoner. I built the first suit. Giovanni asked me to make it obey. I said the armor could do one or the other: protect it or hold it."', [
      ch('Take the page', out('Four seals. Shoulders, chest, crown. They vent in order, like a kettle. "Don\'t fight it. Fight the suit."', flag('rocket-seal-diagram'))),
      ch('"Come with me."', out('He folds the sunglasses into his pocket. "Lead on."', flag('rocket-blaine-ally'))),
      ch('"Why didn\'t you stop him?"', out('"No riddle for that one."')),
    ]),
  ev('xe.kanto.madame-call', 'The Phone in the Basement', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 1 }], cast: ['trainer.hex_maniac'], tint: '#241420', effect: 'flicker' } as never,
    'A desk phone rings as you leave the hideout. "Don\'t hang up, dear. I built this from a card table and one stolen Pidgey. He\'s made it into a company. I\'m proud. It\'s also boring. You\'re the first interesting thing in his books in years."', [
      ch('"Who is this?"', out('"The founder. Sit up straight. He\'ll be on the roof. He always saves something for the roof."', flag('rocket-madame'))),
      ch('"Why help me?"', out('"I\'m not. I\'m watching. But he\'ll be on the roof."', flag('rocket-madame'))),
      ch('Hang up', out('The phone rings again at the next rest stop. She is laughing.')),
    ]),
  ev('xe.kanto.trio-conscience', 'Growlie', G, { stop: 'event', rarity: 'rare', minStage: 2, requires: base, cast: ['trainer.roughneck'], tint: '#1c2018', effect: 'none' } as never,
    'A kennel van, door open. James is kneeling by a cage. "Shh. I had one just like you." Jessie: "James. We are paid to deliver these." Meowth: "We ain\'t been paid since Mt. Moon." James opens the cage and a tagged Growlithe bolts into the grass. They see you. "...You saw nothing, twerp."', [
      ch('"I saw nothing."', out('Jessie nods once. They owe you.', flag('rocket-trio-debt'))),
      ch('"I\'m telling Domino."', fight('They do not let you leave quietly.', grunt('Jessie and James', 2, 1, [heat(4)]))),
      ch('"Need help with the other cages?"', out('Six more go free. Meowth: "Don\'t make it weird."', flag('rocket-trio-debt'), good(5))),
    ]),
  ev('xe.kanto.orphan', 'Orphan', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['trainer.aroma_lady'], tint: '#1c1830', effect: 'none' } as never,
    'A Cubone sits outside the Tower and will not go in. A volunteer: "It waits there every evening. Something upstairs cries, and it cries back."', [
      ch('Sit with it', out('Three evenings, and you do not leave. The Cubone follows you now. It does not battle; it walks beside you.', rest(), companion(3), flag('rocket-orphan-walker'))),
      ch('Leave it be', leave()),
    ]),
];
