// Beta 0.7 E9: the eight Unova story events (`xe.unova.*`) from tools/sources/expansion/05_UNOVA_TEAM_PLASMA_EXPANDED.md E5.
// Built into src/data/events/xe-unova.json by tools/build-expansion-events.ts. Same mapping as kanto.ts: events write story flags.
import { ch, ev, fight, flag, good, inRegion, leave, out, trainer, fr, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const track = (input: string): Json => ({ kind: 'track', input });
const base: Json[] = [inRegion('unova'), { kind: 'xevents' }];
const grunt = (name: string, size = 2, lv = 0, win: Json[] = []) => trainer(name, { cls: 'roughneck', size, lv, win });

export const XE_UNOVA_EVENTS: Json[] = [
  ev('xe.unova.speech', 'The Speech', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.gentleman', 'trainer.roughneck'], tint: '#14182a', effect: 'glint' } as never,
    'A small crowd in a square. A tall man in a heavy robe, leaning on a cane: "Love that cannot be refused is not love. It is a cage with a kind jailer. Open the door. If it stays, you will know. If it goes, you will have done the one truly generous thing of your life." A boy looks at his Lillipup for a long time, and opens his hands. "Go on. You can go, if you want." The Lillipup sits. When the square is empty, a Plasma Grunt with a carrier picks it up.', [
      ch('"Where do they go?"', out('A smile that arrives a moment late: "Wherever they wish, child. That is the point." Three people in the crowd keep their Pokémon.', heat(5), flag('plasma-asked-where'))),
      ch('Follow the carrier', fight('A van, already half full. The Lillipup runs home. "It was *released*. Legally it\'s nobody\'s. That\'s the whole trick-- I wasn\'t supposed to say trick."', grunt('Plasma Grunt', 2, 0, [flag('plasma-van-found'), good(4)]))),
      ch('Listen to the end', out('Nothing changes. One of your own Pokémon looks at you, then pointedly sits on your foot.', fr(1))),
    ]),
  ev('xe.unova.dreamyard', 'The Dreamyard', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['trainer.roughneck'], tint: '#2a1830', effect: 'flicker' } as never,
    'Two Grunts in the new black uniform are kicking a Munna. "Come on! Dream Mist! Cough it up!" "The Sage says it makes people suggestible. Give us the mist and you can go back to sleep!"', [
      ch('Step in', fight('The Munna floats behind you and will not leave. The fog it leaves behind smells of warm rain.', grunt('Plasma Grunt', 3, 0, [flag('plasma-dream-mist'), good(3)]))),
      ch('Wait', out('A Musharna drifts out of the wall and the yard fills with pink fog. Both Grunts see someone standing over them, saying nothing. They run.', flag('plasma-dream-mist'))),
    ]),
  ev('xe.unova.truth-seeker', 'The Truth-Seeker', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'evil', heat: 25 }], cast: ['trainer.gentleman'], tint: '#101a24', effect: 'glint' } as never,
    'A man in a lab coat with a remarkable blue curl of hair falls into step beside you, already talking. "Excuse me! A question, for science. What brings out a Pokémon\'s power? Hypothesis one: the bond between Pokémon and trainer. Sentimental, but the data are stubborn. Hypothesis two: a machine that simply insists. One group is loved. The other is plugged in."', [
      ch('"The bond."', out('"Prove it to me sometime!"', flag('plasma-colress-bond'))),
      ch('"The machine, if it works."', out('"A pragmatist! We\'d get along. Come by the lab."', flag('plasma-colress-machine'))),
      ch('"Did you ask the Pokémon?"', out('He stops walking. It is the first time. "...No. That is a variable. I\'ve left out a variable."', flag('plasma-colress-asked'), good(3))),
    ]),
  ev('xe.unova.cold-storage', 'Cold Storage', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 1 }], cast: ['trainer.hex_maniac'], tint: '#102028', effect: 'none' } as never,
    'A refrigerated warehouse. At the back, six Grunts huddle around an old man in a robe sitting perfectly still. "S-Sage, c-can we please--" "No. Here I can feel the edges of myself. Out there everything is lukewarm and I might be anyone." To you: "You\'re warm. I can tell from here. It is a kind of rudeness."', [
      ch('"Why follow him?"', out('"Because he is the only man I have met who is colder than this room. I wanted to see how far down it went."', flag('plasma-zinzolin-asked'))),
      ch('Battle', fight('"Hm. Warmer. I resent it. Go away."', trainer('Sage Zinzolin', { cls: 'roughneck', size: 3, lv: 2, types: ['ice'], win: [flag('plasma-zinzolin-down'), track('raidSuccess')] }))),
      ch('Give the Grunts your coat', out('They hand you a duty roster for the frigate, and one of them will remember you later.', flag('plasma-frigate-roster'), good(3))),
    ]),
  ev('xe.unova.candidate', 'The Candidate', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 3 }], cast: ['trainer.gentleman', 'trainer.roughneck'], tint: '#241820', effect: 'none' } as never,
    'A podium on a pier, bunting, and four Grunts who have been told to clap. "A firm hand! Clean streets! Every Pokémon in its proper place, which is to say, not yours!" One clap. "You there! Voter! A badge?" It reads SNATTLE FOR GOVERNOR. Under that, smaller: BY APPOINTMENT.', [
      ch('Take a badge', out('A Campaign Badge. One Grunt checkpoint will wave you through.', flag('plasma-campaign-badge'))),
      ch('Debate him', out('He contradicts himself three times in three questions. The four Grunts stop clapping.', flag('plasma-snattle-debated'), good(4))),
      ch('Challenge him', fight('"This will be reflected in the polling!"', grunt('Snattle', 3, 1, [flag('cipher-seen-snattle')]))),
    ]),
  ev('xe.unova.stolen-one', 'The Stolen One', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: [...base, { kind: 'track', atLeast: 1 }], cast: ['trainer.roughneck'], tint: '#241818', effect: 'none' } as never,
    'A spiky-haired trainer is going through a Grunt\'s Poké Balls one at a time, in the street. "Not this one. Not this one. Five years! I gave her that Purrloin for her birthday and one of you took it out of her arms!" "It\'d be a Liepard by now, kid. It wouldn\'t even know her." "...Say that again."', [
      ch('Hold him back', out('"I\'m about to unleash my rage, and you\'re in the way." He breathes. He lets the Grunt go.', good(2))),
      ch('Help him search', out('Commander Aldith\'s Liepard has a notch in its left ear. So did the Purrloin.', flag('plasma-notch'), good(3))),
      ch('"The Grunt\'s right."', out('He does not answer. He is in your way anyway.', heat(2))),
    ]),
  ev('xe.unova.kings-room', 'The King\'s Room', G, { stop: 'event', rarity: 'epic', minStage: 4, requires: [...base, { kind: 'track', atLeast: 2 }], cast: ['trainer.aroma_lady'], tint: '#1c1830', effect: 'flicker' } as never,
    'Near the League, a half-buried doorway. Inside, untouched: a child\'s room, a toy train, a basketball, a music box. "He was kept here. Only Pokémon that had been hurt by people were allowed in to see him. He grew up believing that was all people did." Someone sits on the floor beside the music box in a familiar green cap, back to the door.', [
      ch('Speak to him', out('He turns. The face is right. The eyes are a fox\'s. The Zoroark bolts through a gap in the wall.', flag('plasma-likeness-seen'))),
      ch('Wind the music box', out('The figure\'s shoulders drop. For a moment it is only a Zoroark, listening. Then it is gone.', flag('plasma-likeness-calmed'), good(3))),
      ch('Leave quietly', leave()),
    ]),
  ev('xe.unova.liberty-garden', 'Liberty Garden', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'track', atLeast: 2 }], cast: ['trainer.roughneck'], tint: '#142018', effect: 'none' } as never,
    'A small island with a lighthouse. Grunts in the old white uniform, the faithful kind, stand guard. "There\'s a Pokémon under the lighthouse. Shut in for two hundred years. We came to free it. Then the order came down: hold the island, don\'t open the door. That\'s not what I joined for."', [
      ch('Open the door', out('The Grunt stands aside. Below, a small room, a small bed, a plate. The captive looks at the open door behind you and flies three circles over the harbor. Your party feels lighter.', flag('plasma-victory-star'), good(5), track('raidSuccess'))),
      ch('Report the Grunt', fight('He is replaced by the new uniform, and the island becomes a guarded post.', grunt('Plasma Guard', 3, 1, [heat(2)]))),
      ch('"Then quit."', out('He takes off the hood and walks to the ferry.', flag('plasma-faithful-doubt'), good(2))),
    ]),
];
