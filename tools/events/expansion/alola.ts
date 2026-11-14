// Beta 0.7 E9: the eight Alola story events (`xe.alola.*`) from tools/sources/expansion/07_ALOLA_TEAM_SKULL_AND_AETHER_EXPANDED.md E5.
// Built into src/data/events/xe-alola.json by tools/build-xe-alola-paldea.ts (npm run data:xe-alola-paldea).
// Same mapping as Kanto (tools/events/expansion/kanto.ts): the "world state" is the track (`atLeast`), Rep and Intel become
// Heat and story flags (`ev:alola-...`), and special Pokémon are noted in Field Notes. Script traits (Hype Man, Reluctant Hand)
// and the Phase 3/4/6/8 effects of flags are limits: the flags are set so later slices can read them.
import { ch, ev, fight, flag, heal, inRegion, join, leave, out, rest, trainer, wild, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const note = (special: string): Json => ({ kind: 'fieldNote', special });
const base: Json[] = [inRegion('alola'), { kind: 'xevents' }];
const grunt = (name: string, size = 2, lv = 0, win: Json[] = []) => trainer(name, { cls: 'roughneck', size, lv, win });

export const XE_ALOLA_EVENTS: Json[] = [
  ev('xe.alola.yo', 'Yo', G, { stop: 'event', rarity: 'uncommon', minStage: 1, requires: base, cast: ['trainer.biker'], tint: '#2a1a30', effect: 'none' } as never,
    'Three Skull Grunts are blocking a bus stop. Tupp: "Yo, yo, yo! This stop\'s closed, \'cause we got exposed, to the, uh—" Rapp: "Don\'t." Tupp: "—to the road!" Zipp: "Road!" Rapp: "We\'re blocking a bus stop on an island with one bus. It comes Tuesdays. It\'s Thursday."', [
      ch('Battle them', fight('They go one after another. Each time one falls, Zipp announces the next is "hyped".', grunt('Skull Trio', 3, 0, [flag('alola-trio-beaten')])), heat(-1)),
      ch('Rap back', out('Three beats, and you land the last one. Tupp: "Okay that was actually—" Rapp: "Better than yours. Say it." Tupp: "Different than mine." They move.', heat(-2), flag('alola-bars')), { chance: 0.7, fail: out('Zipp: "Road!" The bus does not come. You leave with a pat on the back for trying.', flag('alola-bars-tried')) }),
      ch('Wait for the bus', out('It is Thursday. No bus comes. At dusk Rapp shares her malasada without comment.', rest(), heal(0.2))),
    ]),
  ev('xe.alola.aether-house', 'The Aether House', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['boss.acerola', 'boss.plumeria'], tint: '#241a24', effect: 'none' } as never,
    'A worn building with a white logo and a lot of children. One of them is not playing. "They took Cap\'n. The Skull guys. They said they were borrowing him. I said for how long. They laughed." Acerola: "The Foundation built this place for kids with nobody. Then it stopped sending money. Then it stopped sending letters. I do the cooking now. I\'m eleven."', [
      ch('Ask Plumeria: "Why stay with him?"', out('Plumeria, at the door with a Yungoos held by the scruff like a kitten: "He took every one of us in when the island said we were nothing. He\'s a mess. He\'s our mess."', flag('alola-plumeria-respect'), note('sv.skull.capn'))),
      ch('Take the Yungoos in for her', out('"One of my idiots took this from an orphan. I\'ve dealt with it." The Hood watches from the roof and follows you out of town.', flag('alola-plumeria-respect'), flag('alola-hood-follows'), note('sv.skull.the-hood'))),
      ch('"Who paid for Po Town?"', out('She says nothing for a while. "White boat. Every month. I never asked. I should\'ve asked."', flag('alola-white-boat'), heat(-2))),
    ]),
  ev('xe.alola.rent', 'Rent', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['boss.nanu'], tint: '#1c2430', effect: 'none' } as never,
    'Outside the Po Town wall, an old man in a red shirt sleeps on a sofa under eleven Alolan Meowth. "Mm. Visitor. Don\'t mind the cats. They\'re the staff. I\'m the kahuna here. I\'m also the police. I\'m also the landlord. Those kids over the wall pay me rent to exist near them. Somebody ought to be watching." You say he could clear the town in an afternoon. "Sure. And then forty kids with nowhere to go are forty kids with nowhere to go and no wall."', [
      ch('"Who\'s really behind them?"', out('"Somebody with money and a boat and a nice smile. I used to hunt things that came through holes in the sky. Lost a partner doing it. Don\'t ask."', flag('alola-nanu-intel'), heat(-3))),
      ch('Ask for help', out('"Since I live here anyway." He will hold Ula\'ula when the islands are in danger.', flag('alola-nanu-ally'), note('sv.skull.landlord'))),
      ch('Pet a Meowth', out('It allows it.', heal(0.1))),
    ]),
  ev('xe.alola.guzmas-room', 'The Trophy Room', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'flag', key: 'alola-plumeria-respect', atLeast: 1 }], cast: ['boss.guzma'], tint: '#241a14', effect: 'flicker' } as never,
    'A tired woman lets you into a house on Route 2. A man is watching golf with the sound up. "His room\'s upstairs. I haven\'t moved anything. He was such a serious little boy." A shelf of trophies, every one second place. A rack of golf clubs, each bent in the middle the same way. From downstairs, not turning round: "Kid never could finish anything. I tried to toughen him up. You see how that went." Under the bed, a Wimpod looks at the door as it has every day for years.', [
      ch('Touch nothing; sit on the floor', out('The Wimpod comes out and stays. It follows you now.', join({ species: ['wimpod'], lv: 0 }), flag('alola-room-seen'), note('sv.skull.lil-g'))),
      ch('Take a trophy', out('A Key Item: Second Place. Guzma will not like seeing it.', flag('alola-second-place'), heat(2))),
      ch('Straighten a golf club', out('It will not straighten. The father says, "Leave those." It is the only time he sounds afraid.', flag('alola-room-seen'))),
    ]),
  ev('xe.alola.gallery', 'The Gallery', G, { stop: 'event', rarity: 'rare', minStage: 4, requires: [...base, { kind: 'track', atLeast: 2 }], cast: ['trainer.gentleman'], tint: '#d8e4f0', effect: 'glint' } as never,
    'A private room in Aether Paradise. White. Very cold. Rows of glass: a Pikachu mid-leap, a Slowpoke yawning, a Corsola, a Petilil. Frost on the inside of every tube. At the end, in the tallest case, a palm-necked Exeggutor with three grinning heads. Lillie stands in the doorway and does not come in: "Mother calls them her children. She says she\'s keeping them beautiful. She used to say the same about me. That one was Father\'s. It used to carry me on its neck."', [
      ch('Open one case', out('The Petilil thaws, blinks and bolts. The alarm trips.', join({ species: ['petilil'], lv: 0 }), heat(3), flag('alola-gallery-opened'))),
      ch('Open Tall Tale\'s case', fight('All three heads are crying. It does not stop smiling.', wild({ species: ['exeggutor-alola'], lv: 3, special: 'ss.aether.tall-tale' }), flag('alola-gallery-talltale'))),
      ch('Leave them; mark the room', out('You mark the room on your map. Lillie: "I ran away with a Pokémon in a bag because I couldn\'t watch her put it in a tube. That\'s the bravest thing I\'ve ever done, and I did it shaking."', flag('alola-gallery-marked'), heat(-3))),
    ]),
  ev('xe.alola.consultant', 'The Consultant', G, { stop: 'event', rarity: 'rare', minStage: 4, requires: [...base, { kind: 'track', atLeast: 3 }], cast: ['trainer.gentleman'], tint: '#1c1c24', effect: 'none' } as never,
    'A tall man in a dark coat among all the white. "You are the trainer from the reports. Kanto, Johto, Hoenn, further. You have met my colleagues. I will not apologize for them. I will say that I am not like them, and I will understand if you find the distinction thin. I advise the President on the Conservation Hold. It preserves a Pokémon exactly as it is. No pain. No change. She finds that consoling." And you? "I have been asked not to mention a certain small island to her. I have been asked. You have been asked nothing at all."', [
      ch('"Which island?"', out('"I could not possibly say that it is north of Akala and has a great many beans."', flag('alola-pelago-known'), flag('cipher-seen-eldes'))),
      ch('Challenge him', fight('"I will not use my strongest. That is not contempt. I am simply tired of winning for them."', grunt('Eldes', 3, 1, [flag('alola-eldes-beaten'), flag('cipher-seen-eldes')]))),
      ch('Leave', leave('He nods as if you had said something sensible.')),
    ]),
  ev('xe.alola.recon', 'Recon', G, { stop: 'event', rarity: 'rare', minStage: 5, requires: [...base, { kind: 'track', atLeast: 4 }], cast: ['trainer.psychic_m'], tint: '#102030', effect: 'glint' } as never,
    'Two figures in white-and-blue suits are examining a palm tree with instruments. They greet you by raising the wrong hand, in the wrong shape, with great sincerity. Dulse: "We are from a place you would call elsewhere. Our world\'s light was taken, a long time ago, by a being that was in pain." Zossie: "Your sun is so bright! Is it always on? Do you get to keep it? This is Beans! He\'s a Poipole!" Dulse: "The wall between your world and the others is being worn thin from this side. On purpose. Please do not. What lives in the thin places is only lost, and frightened, and very strong."', [
      ch('Ask about the light-thief', out('Dulse tells you what little they know. You write it down.', flag('alola-lightthief-lead'), heat(-3))),
      ch('"Can I hold Beans?"', out('Zossie: "Do you want to keep him? Captain said I mustn\'t ask anyone. But you asked me!" Beans floats into your arms.', join({ species: ['poipole'], lv: 0 }), flag('alola-beans-joined'), note('sv.aether.beans'))),
      ch('Show them a Poké Ball', out('Dulse: "A container for a friend. Our world has no such thing. Perhaps that is why we lost ours."', flag('alola-ball-shown'))),
    ]),
  ev('xe.alola.pelago', 'The Pelago', G, { stop: 'event', rarity: 'rare', minStage: 5, requires: [...base, { kind: 'flag', key: 'alola-pelago-known', atLeast: 1 }], cast: ['trainer.gentleman'], tint: '#183024', effect: 'none' } as never,
    'A dot of an island, bean rows and hammocks, stray Pokémon everywhere, all of them content. "Hello, hello! A visitor! Sit, have a bean. I grow them. I don\'t know why. My hands seemed to know how. I woke up on that beach some years back. Not a thing in my head. The Pokémon here looked after me, so now I look after them." He hums a lullaby as he works.', [
      ch('"What\'s the song?"', out('"This? I don\'t know. It comes when I\'m happy. I think I used to sing it to someone. Two someones? Small." He stops humming and looks at his hands. "Isn\'t that strange."', flag('alola-mohn-found'))),
      ch('Say nothing; help with the beans', out('You work until dusk. He gives you a Rainbow Bean.', rest(), heal(1))),
      ch('Tell him who he is', out('"I… no. That\'s a lovely story. I\'d like it to be mine. But I can\'t find it."', flag('alola-mohn-found'))),
    ]),
];
