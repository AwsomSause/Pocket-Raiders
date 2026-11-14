// Beta 0.7 workstream 10 (E9): the eight Galar story events (`xe.galar.*`) from tools/sources/expansion/08_GALAR_MACRO_COSMOS_AND_TEAM_YELL_EXPANDED.md E5.
// Built into src/data/events/xe-galar.json by tools/build-expansion-events.ts (npm run data:xe-events).
// Same mapping as Kanto: Heat is the Evil Team heat; Intel and the Siege Map do not exist yet, so an event that feeds them
// writes a story flag (`ev:galar-...`); "world state" is the region's track step (The Forecast). Dynamax-specific rules
// (the Encore chant, wild Dynamax) are not built (see the update note); the scenes stand on their own.
import { ch, ev, fight, flag, flagIs, good, inRegion, leave, money, out, trainer, wild, $, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const track = (input: string): Json => ({ kind: 'track', input });
const base: Json[] = [inRegion('galar'), { kind: 'xevents' }];
const atTrack = (n: number): Json => ({ kind: 'track', atLeast: n });
const grunt = (name: string, size = 2, lv = 0, win: Json[] = [], format?: 'doubles') =>
  trainer(name, { cls: 'roughneck', size, lv, win, ...(format ? { format } : {}) });
const exec = (name: string, size = 3, lv = 2, win: Json[] = [], format?: 'doubles') =>
  trainer(name, { cls: 'ace-trainer', size, lv, win, ...(format ? { format } : {}) });

export const XE_GALAR_EVENTS: Json[] = [
  ev('xe.galar.ball-guy', 'Have a Ball', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.juggler'], tint: '#2a1020', effect: 'glint' } as never,
    'A figure with a Poké Ball for a head, arms wide. "Heya, Trainer! Have a ball! Go on! It\'s free! Everything\'s free when you\'re the product!" You: "...What?" "I said, have a ball!"', [
      ch('Take it', out('A fine Ball. Inside the hinge, a tiny grey bead: Macro Cosmos will always know where you are until you crush it.', { kind: 'item', id: 'quick-ball', count: 2 }, heat(8), flag('galar-bead'))),
      ch('Inspect it first', out('You find the bead. The cheer does not change at all: "Whoopsie! That\'s just a little something to help us help you! Customer Insights loves you!" The Ball is simply a very good Ball.', { kind: 'item', id: 'quick-ball', count: 1 }, flag('galar-intel', 3), flag('galar-ball-guy'))),
      ch('"Are you all right in there?"', out('A long pause. The head tilts. Very quietly, same pitch: "I\'ve a mortgage with Macro Cosmos Bank and a pension with Macro Cosmos Life. I am having a ball." Then, bright again: "Heya, Trainer!"', flag('galar-ball-guy'), good(2))),
    ]),
  ev('xe.galar.road-closed', 'Road Closed', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['boss.drive/galarian-swsh-yell-grunt-man', 'boss.drive/galarian-swsh-yell-grunt-woman'], tint: '#1c1020', effect: 'none' } as never,
    'Six people in black and pink, with towels and horns, stand across the road. Behind them a Silicobra sleeps in a sunbeam. Cheer Captain Gaz: "OI! Road\'s shut! Li\'l fella\'s havin\' a kip and we\'ll not have him disturbed!" Chant Leader Shaz: "One, two, three: Let! Him! Sleep!" The whole crew: "LET! HIM! SLEEP!" The Silicobra wakes up. Gaz: "...Now look what you made us do."', [
      ch('Battle through', fight('"Fair\'s fair. But you tell anyone we lost, we\'ll cheer at you. Up close."', grunt('Cheer Captain Gaz', 2, 1, [flag('galar-road-closed')]))),
      ch('Join the chant, quietly', out('Three soft claps. The Silicobra goes back to sleep. Shaz: "That\'s dynamics, that is. Piano. We never do piano." You are given a Team Yell Towel.', flag('galar-road-closed'), flag('galar-yell-honorary'), good(3))),
      ch('Go round', out('They wave. It costs you an afternoon.', flag('galar-road-closed'))),
    ]),
  ev('xe.galar.insurance', 'Darkest Day Cover', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: [...base, atTrack(1)], cast: ['trainer.pr/clerk_f'], tint: '#1c1428', effect: 'none' } as never,
    'A neat kiosk: MACRO COSMOS INSURANCE, PEACE OF MIND. "Could I interest you in our new product? Darkest Day cover. Very reasonable." You: "What\'s a Darkest Day?" "I asked that in training! It\'s an old legend, so the risk is theoretical, so the premium\'s nearly all margin. It\'s sold forty thousand policies. Head office is very keen. For a legend."', [
      ch('Buy a policy (₽3,000)', out('A glossy policy. If the climax is won it pays out in the Aftermath.', $(-3000), flag('galar-policy')), { requires: [money(3000)] }),
      ch('Read the small print', out('The policy start date is printed. It is the day after the Champion Cup final.', flag('galar-intel', 4))),
      ch('"Who set the start date?"', out('"It came down from the fiftieth floor. Everything does." She looks at the leaflet as if it had changed.', flag('galar-intel', 1))),
    ]),
  ev('xe.galar.press-release', 'For Immediate Release', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: base, cast: ['trainer.pr/clerk_f'], tint: '#20202a', effect: 'glint' } as never,
    'The lobby of Rose Tower. A printer by reception is still warm; one page sits in the tray. "FOR IMMEDIATE RELEASE. Macro Cosmos is proud to announce that the unprecedented energy event of [DATE] has been safely contained by Chairman Rose\'s Eternal Energy Initiative... [INSERT CASUALTY FIGURE IF LOW.]" Heels on marble. Oleana: "That is not yours."', [
      ch('Hand it back', out('She takes it. She does not thank you. Her hand is not steady.', flag('galar-oleana'))),
      ch('Keep it', out('The Draft Release can be shown to Leon, to Magnolia, or to the stadium crowd later.', heat(8), flag('galar-draft-release'))),
      ch('"Did you write this?"', out('"I typed it. He dictated it walking up and down, the way he does when he is happy. I have worked for him since I was nineteen. He paid for my mother\'s operation. He remembers every cleaner\'s name. And he said \'if low\' without stopping."', flag('galar-oleana-shaken'), flag('galar-oleana'))),
    ]),
  ev('xe.galar.mine', 'The Old Seam', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(2)], cast: ['trainer.hiker', 'trainer.worker_m'], tint: '#241c14', effect: 'none' } as never,
    'Old men on a bench by a closed pithead. One enormous man in a hard hat tells a story with his whole body. Peony: "And I says to him, I says, Rose, the seam\'s gone! And he goes quiet. He counted the lamps coming up that last day. Counted them twice. \'This\'ll happen to the whole region,\' he says. \'Not for a thousand years. But it\'ll happen.\' And I laughed." He takes the hard hat off. "He\'s my little brother. Nobody else were ever going to tell him it was all right to stop counting."', [
      ch('Ask him to come to Wyndon', out('"Aye. Somebody should tell him in person." He will stand by you when it matters.', flag('galar-peony-ally'), good(3))),
      ch('Ask about the Rolycoly', fight('A wild Rolycoly was listening. It wants a lump of coal and a fair fight.', wild({ species: ['rolycoly'], lv: 2, win: [flag('galar-rolycoly')] }))),
      ch('"Is he wrong?"', out('"About the thousand years? No. That\'s what\'s so flamin\' awful about it."', flag('galar-peony-met'))),
    ]),
  ev('xe.galar.their-majesties', 'Their Majesties', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(3)], cast: ['trainer.gentleman'], tint: '#241a20', effect: 'glint' } as never,
    'Two men with hair shaped like a sword and a shield are being ignored by an entire pub. Sordward: "We are celebrities." Shielbert: "We are in fact descended from the first kings of Galar. There were two kings. People forget." Sordward: "The Chairman has retained us to wake our ancestors\' weapons. We\'ll be giving them a little tonic." He holds up a vial that glows the wrong red.', [
      ch('"Weapons?"', out('"A sword. And a shield. Very old. They\'ve been asleep in the woods."', flag('galar-intel', 5), flag('galar-brothers-met'))),
      ch('Battle them', fight('Sordward: "This is treason." Shielbert: "Against whom?" "...Us. Presumably."', exec('Sordward and Shielbert', 3, 2, [flag('galar-brothers-down'), good(3)], 'doubles'), track('raidSuccess'))),
      ch('Ask for an autograph', out('They are so pleased they tell you the day they are going to the Weald.', flag('galar-brothers-met'), flag('galar-weald-early'))),
    ]),
  ev('xe.galar.partner-firm', 'The Partner Firm', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, atTrack(4)], cast: ['trainer.scientist'], tint: '#14141c', effect: 'flicker' } as never,
    'Wyndon station. Every departure is cancelled. On the one platform still lit, the Chairman shakes hands with a tall man in a dark uniform. Rose: "Your people supplied the regulator for the Plant, I supply the energy; that is what I call a partnership." Ardos: "My father calls it a purchase." Rose laughs, warmly, as if it were a joke. Ardos sees you: "You have interfered with eight operations. My brother has gone soft and my colleagues have been careless. I am neither."', [
      ch('Follow the crates', out('Wishing Stars, hundreds, labelled for an island with no name.', flag('galar-intel', 5), flag('galar-raid4-open'), flag('cipher-seen-ardos'))),
      ch('Challenge him', fight('He never switches, and he never wastes a move. He walks away without a word.', exec('Ardos', 3, 3, [flag('cipher-seen-ardos'), flag('galar-ardos-down')]))),
      ch('Ask Rose what he sold', out('"Sold? My dear young friend, I have shared. One doesn\'t solve a thousand-year problem alone!"', flag('cipher-seen-ardos'))),
    ]),
  ev('xe.galar.gig', 'The Gig', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, flagIs('galar-road-closed')], cast: ['trainer.guitarist'], tint: '#14101c', effect: 'glint' } as never,
    'Spikemuth. A shuttered arcade, a stage made of pallets, a thin man with a microphone and two Pokémon with amplifier chests. Piers: "This one\'s for Spikemuth. No Power Spot. No stadium. No sponsors. Just us. Always was." Halfway through a Yell Grunt\'s Linoone, spooked by a tremor, swells to the size of a bus between the shopfronts. Marnie, level, not loud: "Oi. Stripes. It\'s all right." Team Yell, low and in time: "Stripes. Stripes. Stripes." It looks down at forty people saying its name, and gets smaller. Piers, deadpan: "...And that\'s why we don\'t Dynamax in Spikemuth."', [
      ch('Stay to the end', out('The Encore follows you: the chant is yours to call, once, when a fight gets too big.', flag('galar-chant'), good(3))),
      ch('Ask Marnie how she did that', out('"Didn\'t do anythin\'. Just said her name. They forget who they are when they\'re that big."', flag('galar-chant'), flag('galar-intel', 5))),
      ch('Leave early', leave('Piers notices.')),
    ]),
];
