// Beta 0.7 workstream 10 (E9): the eight Kalos story events (`xe.kalos.*`) from tools/sources/expansion/06_KALOS_TEAM_FLARE_EXPANDED.md E5.
// Built into src/data/events/xe-kalos.json by tools/build-expansion-events.ts (npm run data:xe-events).
// Same mapping as Kanto: Heat is the Evil Team heat; Intel, Operational Strength, the Siege Map and the Raid keys do not exist
// yet, so an event that feeds them writes a story flag (`ev:flare-...`); money is scaled to this game's prices; "world state"
// is the region's track step (The Guest List). The Kalos Couture second held item is NOT built (see the update note).
import { ch, ev, fight, flag, good, inRegion, leave, money, out, rest, trainer, $, companion, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const track = (input: string): Json => ({ kind: 'track', input });
const base: Json[] = [inRegion('kalos'), { kind: 'xevents' }];
const atTrack = (n: number): Json => ({ kind: 'track', atLeast: n });
const night: Json = { kind: 'period', in: ['evening', 'night'] };
const member = (name: string, size = 2, lv = 1, win: Json[] = [], format?: 'doubles') =>
  trainer(name, { cls: 'ace-trainer', size, lv, win, ...(format ? { format } : {}) });

export const XE_KALOS_EVENTS: Json[] = [
  ev('xe.kalos.boutique', 'Not Stylish Enough', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.pr/rich_m', 'trainer.pr/flare_grunt_f'], tint: '#2a1418', effect: 'glint' } as never,
    'A boutique on a gold-paved avenue. The clerk gives you one glance, head to foot: "I\'m afraid we couldn\'t possibly. Perhaps when you\'re a little more... known." Outside, a woman in a red suit waits with a brochure, as if she knew. Treasurer Garance: "Dreadful, aren\'t they? We would never turn you away. Membership includes the suit, a Holo Caster upgrade and, between ourselves, a good chance of being here next year."', [
      ch('Pay the membership (₽8,000)', out('A Flare Key for your Holo Caster. Centers will heal you first from now on. Sycamore will not look at you.', $(-8000), heat(-20), flag('flare-member'), flag('flare-garance-met')), { requires: [money(8000)] }),
      ch('"What\'s being explained?"', out('She explains, pleasantly, about half of it. "You\'ve gone pale. It suits you. Red would suit you more."', flag('flare-garance-met'), flag('flare-intel', 5))),
      ch('Take a brochure and leave', out('A Membership Brochure. In the climax a member may mistake you for a prospect and let you through a door.', flag('flare-brochure'), flag('flare-garance-met'))),
      ch('Leave', leave('Through the glass the clerk mouths: "I only said it because I couldn\'t afford the suit either."')),
    ]),
  ev('xe.kalos.cafe', 'The Corner Table', G, { stop: 'event', rarity: 'rare', minStage: 2, requires: base, cast: ['trainer.gentleman'], tint: '#241618', effect: 'none' } as never,
    'A red café. Three people at the corner table: a professor, a film star and the man who owns the room. Lysandre: "Diantha, you are extraordinary on the screen. Would you not wish to remain so, always?" Diantha: "No. I\'d like to play someone\'s grandmother one day. You\'ve always confused fading with changing, darling." Lysandre does not laugh. He notices you and stands, courteous to a fault: "If there were not enough for everyone, and there is not, who would you have go without?"', [
      ch('"Nobody."', out('"Yes. I said that too, for twenty years. It is the most expensive word there is."', flag('flare-lysandre-met'))),
      ch('"Me."', out('He is silent for a moment. "That is the only answer I have ever respected. Remember that I asked."', flag('flare-guest'), flag('flare-lysandre-met'), good(3))),
      ch('"Whoever\'s hoarding."', out('"Then we want the same thing, and differ only in where to begin."', flag('flare-lysandre-met'), heat(3))),
      ch('Listen to Sycamore instead', out('After Lysandre goes downstairs: "He\'s a good man. He gives away more than he keeps. He\'s just been tired lately." A pause. "For about six years."', flag('flare-lysandre-met'))),
    ]),
  ev('xe.kalos.tall-man', 'The Tall Man', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(2)], cast: ['trainer.gentleman'], tint: '#18181c', effect: 'flicker' } as never,
    'A man twice the height of a man sits by the road, looking at a key in his palm. "There was a Pokémon I loved. There was a war. She was sent, and she did not come back. I built a machine to give her life again. It needed life to give. I took it from others. I did not count. The stones at Geosenge are the count. Someone has found my machine. I can feel it warming, the way an old wound knows the weather."', [
      ch('Walk with him', out('He walks beside you for three nights and says nothing more. He will reach Geosenge two days late, on foot.', rest(), flag('flare-az-ally'))),
      ch('Ask for the key', out('He gives it without looking up. AZ\'s Key opens one sealed door in a later raid.', flag('flare-az-key'))),
      ch('"Was it worth it?"', out('"I had her back for one hour. Ask me a question with only one answer."', flag('flare-az-met'))),
    ]),
  ev('xe.kalos.courier', 'The Courier', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(3)], cast: ['trainer.pr/flare_grunt_m'], tint: '#14141c', effect: 'glint' } as never,
    'A young man in a black coat waits at the next node, a device on his wrist ticking. "You\'ve been Mega Evolving. I need to battle you. It\'s not personal; I\'m measuring something." Behind him a girl runs up with a Chespin asleep in her arms. It has been asleep for a long time. Mairin: "Alain! Chespie twitched! Did you get enough yet? You said when you got enough he\'d wake up." Alain, not looking at her: "Nearly."', [
      ch('Battle Alain', fight('Win or lose, his device chimes. "Good reading. Mr. Lysandre is building a system to protect people. Every strong battle I have is a little more protection for someone."', member('Alain', 3, 2, [flag('flare-alain-read')]))),
      ch('"Protect people from what?"', out('"From... he said from..." He stops. He has never asked.', flag('flare-alain-doubt'))),
      ch('"Where does the energy go?"', out('Alain looks at his wrist, then at the sleeping Chespin. He does not answer, and he does not leave.', flag('flare-alain-doubt'), flag('flare-intel', 4))),
    ]),
  ev('xe.kalos.under-time', 'Under Time', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(4)], cast: ['trainer.pr/flare_grunt_f'], tint: '#2a1020', effect: 'flicker' } as never,
    'The Holo Caster turns itself on. The evening bulletin: Malva at her desk, mid-sentence. The picture tears and a different woman sits on the desk. "Good evening, Kalos, and good evening to our viewers abroad! This is Under Time, and I\'m your Venus. Tonight: how to tell if your Pokémon truly loves you. Spoiler: it doesn\'t matter!" Malva, off-frame, icy: "This is my slot." "And a special hello to one little viewer who\'s been ruining my friends\' work in four regions. I\'d love to have you on the show."', [
      ch('Trace the signal', out('The call comes from a van two streets away. You write the plate down.', flag('flare-intel', 5), flag('cipher-seen-venus'))),
      ch('Switch it off', out('It switches itself back on at the next rest stop, louder.', flag('cipher-seen-venus'))),
      ch('Call in', out('"Caller, you\'re on Under Time!" Whatever you said is cut into a jingle and replayed for the rest of the region. Civilians liked it.', good(3), flag('cipher-seen-venus'), heat(2))),
    ]),
  ev('xe.kalos.factory', 'The Factory Floor', G, { stop: 'event', rarity: 'rare', minStage: 2, requires: base, cast: ['trainer.pr/flare_grunt_m', 'trainer.worker_m'], tint: '#241818', effect: 'none' } as never,
    'The Poké Ball Factory. The conveyor is running; the workers are tied up in the canteen; red suits are loading crates. Celosia: "Every Poké Ball made in Kalos for a year. If nobody but us can catch a Pokémon, nobody but us will have one. It\'s not theft. It\'s curation." Bryony: "She\'s been practising that all morning."', [
      ch('Battle Celosia and Bryony', fight('"The line is saved!" The Factory President is freed. He offers you a Master Ball or a purse. "Not both. I\'ve a board to answer to."', member('Celosia and Bryony', 3, 2, [{ kind: 'item', id: 'ultra-ball', count: 3 }, flag('flare-factory-freed')], 'doubles'), track('raidSuccess'))),
      ch('Slip past and free the workers', out('Nobody shouts. The conveyor stops, and the president says thank you in a whisper. He presses six Ultra Balls on you.', { kind: 'item', id: 'ultra-ball', count: 6 }, good(3), heat(4), flag('flare-factory-freed'))),
      ch('Leave', leave('The conveyor keeps running behind you.')),
    ]),
  ev('xe.kalos.essentia', 'Essentia', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(2), night], cast: ['trainer.pr/flare_grunt_f'], tint: '#101018', effect: 'flicker' } as never,
    'Lumiose, at night. A trainer in an alley is shouting at an empty Poké Ball. On the roof above, a figure in a visored suit with something struggling under her arm. Essentia, filtered and flat: "Asset acquired. Returning to-" The filter drops for half a second. "-sorry, I\'m sorry, I can\'t make it stop-" Flat again. "Returning to base." An Espurr on the wall watches her go with enormous eyes.', [
      ch('Chase her over the rooftops', fight('She cannot be caught tonight, but she drops the stolen Pokémon at the second roof.', member('Essentia', 3, 2, [flag('flare-essentia-chased'), good(3)]))),
      ch('Follow the Espurr', out('A basement office with a hand-painted sign: LOOKER BUREAU. A cot, a girl\'s jacket, a note in a child\'s hand: "Gone to do a job for the nice doctor. Back soon. Feed Mimi." Mimi sits on the jacket and walks with you now.', flag('flare-emma-known'), companion(3))),
      ch('Leave', leave('The alley is quiet. Somewhere above, a visor flickers.')),
    ]),
  ev('xe.kalos.squishy', 'Something in the Bag', G, { stop: 'event', rarity: 'uncommon', minStage: 3, requires: base, cast: ['trainer.scientist'], tint: '#142418', effect: 'none' } as never,
    'Your bag is heavier than it should be. Something green and soft is looking out of it. It has one hexagonal eye. It blinks. It does not seem to be a Pokémon the Pokédex knows.', [
      ch('Feed it a Berry', out('It eats slowly and goes back to sleep in the bag.', flag('flare-squishy-fed'))),
      ch('Put it out', out('It is in the bag again at the next node.', flag('flare-squishy-seen'))),
      ch('Show it to Professor Sycamore', out('"Mon dieu. That is not a Pokémon. That is a part of one. Something that watches the balance of the land and wakes only when it is very wrong. If it is awake, and has chosen your bag..." He looks toward Geosenge. "Then I have been a worse friend than I thought."', flag('flare-squishy-seen'), flag('flare-intel', 3))),
    ]),
];
