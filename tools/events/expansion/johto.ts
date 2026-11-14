// Beta 0.7 E9: the eight Johto story events (`xe.johto.*`) from tools/sources/expansion/02_JOHTO_TEAM_ROCKET_RETURN_EXPANDED.md E5.
// Built into src/data/events/xe-johto.json by tools/build-expansion-events.ts. Same mapping as kanto.ts: Intel and
// Operational Strength do not exist, so events write story flags (`ev:rocket-return-...`) for later slices; money is scaled.
import { ch, ev, fight, flag, good, inRegion, leave, out, rest, trainer, item, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const track = (input: string): Json => ({ kind: 'track', input });
const base: Json[] = [inRegion('johto'), { kind: 'xevents' }];
const grunt = (name: string, size = 2, lv = 0, win: Json[] = []) => trainer(name, { cls: 'roughneck', size, lv, win });

export const XE_JOHTO_EVENTS: Json[] = [
  ev('xe.johto.tail-market', 'The Tail Market', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.roughneck'], tint: '#2a1a14', effect: 'flicker' } as never,
    'A folding table and a handwritten sign: SLOWPOKE TAIL. NUTRITIOUS. ₽1,000,000. The vendor, a Grunt in a paper hat: "One million. It\'s a premium product." You ask if anyone has ever paid. "No. Between us? I think the price is so nobody asks where they come from."', [
      ch('Tip over the table', fight('"I *hated* the hat." The delivery slip in his pocket names Azalea.', grunt('Tail Vendor', 2, 0, [flag('rocket-return-tail-slip')]))),
      ch('"Do they grow back?"', out('"...Yeah. That\'s what they told us. So it\'s fine." He packs up and leaves, and one fewer Grunt will be waiting at the Well.', heat(-2), flag('rocket-return-tail-quit'), good(2))),
      ch('Leave', leave('The sign is still there when you look back. The price has gone up.')),
    ]),
  ev('xe.johto.false-director', 'The False Director', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 2 }], cast: ['trainer.gentleman', 'trainer.worker_m'], tint: '#14182a', effect: 'glint' } as never,
    'The Radio Tower runs tours, and the Director greets the group himself: "Welcome, welcome, to the, ah. The Radio Tower. Which I direct." A staffer whispers: "He asked me my name this morning. I\'ve had the slot after his for six years." He salutes with the wrong hand. His office plant is dead. His mug says WORLD\'S BEST EXECUTIVE.', [
      ch('"What\'s today\'s password?"', out('"The pass-- of course. It\'s. \'Radio.\'" "It\'s *never* \'Radio\'," the staffer says. He bolts for the lift. Somewhere below, the real Director can now be found.', flag('rocket-return-director-known'), good(3), track('officerTurned'))),
      ch('Say nothing', out('You finish the tour. The Director thanks you for visiting, twice.')),
      ch('Accuse him on a hunch', fight('Security escorts you out, and not gently.', grunt('Tower Security', 2, 0, [heat(4)]))),
    ]),
  ev('xe.johto.black-hour', 'The Black Hour', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: [...base, { kind: 'track', atLeast: 2 }, { kind: 'period', in: ['evening', 'night'] }], cast: ['trainer.hex_maniac'], tint: '#0e1018', effect: 'flicker' } as never,
    'The radio is on at the rest stop. The host: "...and that was \'Lullaby for a Lapras\'. It\'s midnight, Johto. This is the, um. The Black Hour. Tonight\'s weather for our friends in the north: heavy cloud, three trucks, by the lake, before the second bell. And in the west: no rain. The well is dry." A chair scrapes. Someone coughs who is not the host. "And remember, listeners: Rocket\'s future is bright!"', [
      ch('Write it down', out('Three trucks, a lake, the second bell. You underline "the well is dry".', flag('rocket-return-black-hour-notes'))),
      ch('Call the station', out('"We have a caller. Go ahead, caller. ...Yes. *Yes*, I\'d love to take a request." Her voice is steady, and she is not alone in the room.', flag('rocket-return-mary-called'), heat(2))),
      ch('Turn it off', leave('The quiet is worse.')),
    ]),
  ev('xe.johto.dragon-tamer', 'The Dragon Tamer', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 3 }], cast: ['trainer.gentleman'], tint: '#2a1414', effect: 'none' } as never,
    'A man in a cape stands at the red water of the Lake of Rage. "Gyarados don\'t gather. They don\'t share a lake. Something is telling them to. I\'ve traced a signal to a souvenir shop. I intend to be direct about it. You may come, if you can keep up."', [
      ch('"I\'ll keep up."', out('He nods. "Dragonite. The door, please." Offscreen, a crash. "That is what direct means." The corridor behind the shop is already clear.', flag('rocket-return-lance-ally'), good(3))),
      ch('"I work alone."', out('"Then I will hold the road." He turns back to the water, and the Gyarados quiet a little.', flag('rocket-return-lance-road'))),
    ]),
  ev('xe.johto.olivine-arrival', 'Olivine Arrival', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'period', in: ['evening', 'night'] }], cast: ['trainer.roughneck', 'trainer.gentleman'], tint: '#101820', effect: 'none' } as never,
    'A freighter with no name. In the lighthouse, Ampharos\'s light is flickering in four-four time. A dancer on the dock talks to a boombox, then to you: "And one and two and-- oh! An audience! Don\'t mind the crates, darling, the crates are boring. Three more are coming that are not boring." You ask what he gets. The dancing stops for exactly one second. "Mine is the music. Everyone forgets the music."', [
      ch('Ask about the music', out('He hands over a cassette marked SIDE B. You will know the beat when you hear it again.', flag('rocket-return-carrier-beat'), flag('cipher-seen-miror-b'))),
      ch('Challenge him', fight('"Fabulous! You\'ve no rhythm but such conviction!"', trainer('Miror B.', { cls: 'roughneck', size: 3, lv: 1, win: [flag('cipher-seen-miror-b')] }))),
      ch('Go up the lighthouse', out('You calm the Ampharos with a little patience. The light settles into an honest rhythm.', rest(), flag('rocket-return-lighthouse'))),
    ]),
  ev('xe.johto.heir', 'The Chair', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 1 }], cast: ['trainer.gentleman'], tint: '#241420', effect: 'none' } as never,
    'Outside a souvenir shop, a red-haired boy is followed by a man in a white-trimmed coat. "Your father\'s office is as he left it. I have had it dusted every week." "Burn it." "You have his eyes. You have his name." "He lost. He lost to a kid and he walked off. Don\'t put a coat on it." The man leaves a folded coat on the bench anyway.', [
      ch('"You\'d be better at it than him."', out('He looks at the coat for a long time.', flag('rocket-return-heir-tempted'))),
      ch('"Then help me end it."', out('"I\'m not helping you. I\'m going the same direction."', flag('rocket-return-heir-ally'), good(3))),
      ch('Sit down beside him', out('A minute passes. "...It\'s a nice coat. That\'s the worst part."', flag('rocket-return-heir-undecided'))),
    ]),
  ev('xe.johto.shrine-keeper', 'The Shrine Keeper', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['trainer.hiker'], tint: '#18241a', effect: 'none' } as never,
    'An old man sits in front of a forest shrine with a calendar. "Tuesday. I went to bed Tuesday. I woke up Thursday. The apricorns on the sill had ripened and nobody had turned them. The forest\'s guardian keeps the days in order. Something has taken it out of its place, so the days are loose."', [
      ch('Ask what his grandfather called it', out('He tells you, quietly, a name only a child would give a friend. You will not forget it.', flag('rocket-return-child-name'), good(2))),
      ch('Ask about the Poké Balls', out('"A Ball should be a door. That fellow in the mask has made one with no inside handle." He gives you a pouch of Apricorns.', item('great-ball', 2), flag('rocket-return-apricorn'))),
    ]),
  ev('xe.johto.counterfeit-boss', 'Bwa-ha-ha', G, { stop: 'event', rarity: 'epic', minStage: 4, requires: [...base, { kind: 'track', atLeast: 2 }], cast: ['trainer.roughneck'], tint: '#1c1830', effect: 'flicker' } as never,
    'Inside the hideout, a door is ajar and someone is rehearsing. "I am Giovanni! The magnificent! Bwa-ha-ha! No. Lower. \'I am... Giovanni.\' Pause. Menace. Do I have a cat? He has a cat." A Grunt: "Sir, the real one never laughed." "Well, that\'s why nobody liked him!"', [
      ch('Walk in', fight('"Did it sound like him at all? Be honest. ...Archer misses him so much it\'s embarrassing. Somebody had to try."', grunt('Petrel', 3, 1, [flag('rocket-return-petrel-down'), track('raidSuccess')]))),
      ch('Listen longer', out('He practises the door passwords aloud. Two locks will open for you without a fight.', flag('rocket-return-passwords'))),
      ch('Leave', leave('The laughter follows you down the corridor.')),
    ]),
];
