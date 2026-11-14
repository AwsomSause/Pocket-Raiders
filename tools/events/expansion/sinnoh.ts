// Beta 0.7 E9: the eight Sinnoh story events (`xe.sinnoh.*`) from tools/sources/expansion/04_SINNOH_TEAM_GALACTIC_EXPANDED.md E5.
// Built into src/data/events/xe-sinnoh.json by tools/build-expansion-events.ts (npm run data:xe-events).
// Same mapping as Kanto: Heat is the Evil Team heat; Intel and Operational Strength do not exist yet, so an event writes a
// story flag (`ev:galactic-...`) for the slices that will read them; money is scaled to this game's prices.
import { ch, ev, fight, flag, good, heal, inRegion, join, leave, out, rest, trainer, wild, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const note = (special: string): Json => ({ kind: 'fieldNote', special });
const base: Json[] = [inRegion('sinnoh'), { kind: 'xevents' }];
const trackAt = (n: number): Json => ({ kind: 'track', atLeast: n });

export const XE_SINNOH_EVENTS: Json[] = [
  ev('xe.sinnoh.clinic', 'The Clinic', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.aroma_lady', 'trainer.worker_m'], tint: '#e8eef4', effect: 'none' } as never,
    'A clean white storefront: GALACTIC WELLNESS, FREE CHECK-UPS. A small girl sits on the step with a Buneary that is looking at nothing. "They said she was anxious. She\'s not anxious now. She\'s not anything now. She used to hide my socks." Orderly Vance, gently, in the doorway: "Stress responses are down ninety percent. That\'s a wonderful result. You should be pleased."', [
      ch('"Put it back."', fight('"Put what back? Nothing was removed that she needed." His Pokémon stare straight ahead, and do not flinch.', trainer('Orderly Vance', { cls: 'ace-trainer', size: 3, lv: 1, team: ['chansey', 'bronzong', 'kadabra'], win: [flag('galactic-vance-down'), good(3)] }), heat(2))),
      ch('Leave one of your Pokémon for a check-up', out('It comes back healthy, quiet, and a little far away. It will not sulk, flinch or play for a while. You have seen the machine.', flag('galactic-clinic-seen'), flag('galactic-spiritless-checkup'))),
      ch('Sit with the Buneary', out('It does nothing. At the end it picks up one of the girl\'s socks, looks at it for a while, and puts it down again.', rest(), flag('galactic-sock'))),
    ]),
  ev('xe.sinnoh.fridays', 'Fridays', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['trainer.fairy_tale_girl'], tint: '#d8e4f0', effect: 'none' } as never,
    'A little girl stands outside the Windworks fence while a sky full of Drifloon carries Grunts toward the roof, one each, like an airline. "They\'re only supposed to come on Fridays. They come for me on Fridays. Now they come every day and they don\'t even look." A Grunt drifts past at head height, embarrassed: "It\'s very fuel-efficient."', [
      ch('Call one down (an Oran Berry)', out('Friday lands on the girl\'s head. "My papa runs the turbines inside. He said to tell anyone who asks that he\'s not helping them, he\'s just bad at saying no." Friday will carry you.', flag('galactic-friday-lent'), note('sv.galactic.friday'), join({ species: ['drifloon'], lv: 0 })), { requires: [{ kind: 'item', id: 'oran-berry' }] }),
      ch('Pop one', out('A Grunt falls in a hedge. The girl will not speak to you.', heat(3), flag('galactic-popped'))),
      ch('Leave', leave('"Fridays are for me," the girl says, to nobody.')),
    ]),
  ev('xe.sinnoh.grunt-836', 'Grunt No. 836', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, { kind: 'evil', heat: 30 }], cast: ['trainer.roughneck'], tint: '#1a1c24', effect: 'none' } as never,
    'A Galactic Grunt is standing behind a signpost. The signpost is narrower than he is. A stage whisper: "Psst. You have not seen me. My codename is Looker. I should not have told you that. I have infiltrated this organization for six weeks and nobody suspects! They are a people without curiosity. It is the perfect cover and it is breaking my heart."', [
      ch('Get the key from the canteen', fight('A short, quiet fight over a ring of keys. "A side entrance," Looker whispers. "You have the gift of the unobserved."', trainer('Canteen Grunt', { cls: 'roughneck', size: 2, lv: 0, win: [flag('galactic-storage-key')] }), flag('galactic-looker-ally'))),
      ch('"Your wig is crooked."', out('"It is not a wig. It is the regulation haircut, and it is the bravest thing I have done."')),
      ch('"What have you found?"', out('"A room where they keep three small Pokémon in three large machines. I am not a sentimental man. I walked past that room once and I have not slept."', flag('galactic-three-machines'))),
    ]),
  ev('xe.sinnoh.grandfather', 'The Bench in Sunyshore', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: base, cast: ['trainer.hiker'], tint: '#e0c890', effect: 'none' } as never,
    'An old man on a bench is feeding Wingull. "I had a grandson. Clever. Too clever for the house. His parents wanted the top of the class, and when he wasn\'t, they wanted to know why, at length. He stopped coming down for supper. Machines don\'t ask you why. I used to stand at the bottom of the stairs and think, leave him be, he\'s busy. That\'s what I\'ve got. I left him be."', [
      ch('"What was his name?"', out('He tells you. It is a short name and a quiet one.', flag('galactic-grandfather'))),
      ch('Sit a while', out('He gives you a Soothe Bell, and does not ask for anything for it.', { kind: 'item', id: 'soothe-bell', count: 1 }, rest())),
      ch('"Would you want to see him?"', out('"I\'d want him to want it. That\'s a different thing, and I\'m old enough to know."')),
    ]),
  ev('xe.sinnoh.marsh-test', 'The Marsh Test', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(2)], cast: ['trainer.roughneck'], tint: '#2a2418', effect: 'flicker' } as never,
    'A boom from the Great Marsh. Smoke. A Grunt sprints the other way: "It worked! It worked! I didn\'t think it would. Oh no. Oh, it worked." A black airship turns slowly overhead and a bored voice comes from its loudspeaker. "Test confirmed. Crater radius acceptable. Invoice to follow. And you, on the boardwalk: you are standing in a workplace."', [
      ch('Chase the Grunt', out('He gives up at once: "I just pressed it. They said press it. I thought it was a drill." The next bomb is meant for a lake.', flag('galactic-next-bomb-lake'))),
      ch('Signal the airship', fight('Hunter J sends one henchman down by cable. "She will come for you personally," he says, wiping his nose.', trainer('Hunter J\'s Henchman', { cls: 'roughneck', size: 2, lv: 1, team: ['drapion', 'ariados'], win: [flag('galactic-j-marked')] }), heat(3), note('sv.galactic.warrant'))),
      ch('Help the Marsh wardens', out('Three bronzed Pokémon are found in the reeds. One of them can be restored at a Pokémon Center and kept.', good(5), heal(0.5), join({ species: ['stunky'], lv: 0 }))),
    ]),
  ev('xe.sinnoh.celestic-wall', 'The Wall at Celestic', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(1)], cast: ['trainer.gentleman', 'trainer.hex_maniac'], tint: '#1a1820', effect: 'glint' } as never,
    'A man in grey is looking at a cave painting. A tall woman in black is looking at him. "It shows three beings around a light. People have read it as a creation story for two thousand years." "It is an instruction diagram. People have been sentimental for two thousand years." Then Cyrus turns to you. "You have interfered four times. I have reviewed each instance. You were efficient. You did not gloat. You are the least wasteful person I have encountered this year. I would prefer that you were not standing in its way. This is not a threat. I do not have the capacity for those anymore. It is a preference."', [
      ch('"And joy?"', out('"Subtracted with the rest. They share a mechanism. I checked." Cynthia, after he has gone: "I\'m coming up that mountain with you."', flag('galactic-cynthia-ally'))),
      ch('"What happened to you?"', out('A pause that would be hesitation in anyone else. "Nothing is happening to me. That is the result." Cynthia: "I\'ve met a great many dangerous people. He\'s the first one I\'ve wanted to make a cup of tea for. Don\'t tell anyone."', flag('galactic-cynthia-ally'), flag('galactic-cyrus-tested'))),
      ch('Say nothing', out('"Yes. Exactly that." He leaves. Cynthia watches him go, then turns to you.', flag('galactic-cynthia-ally'))),
    ]),
  ev('xe.sinnoh.town-slept', 'The Town That Slept', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(3)], cast: ['trainer.fisherman'], tint: '#10162a', effect: 'flicker' } as never,
    'The harbor is silent at noon. People are asleep at café tables, on benches, at the wheel of a moored ferry. A sailor\'s wife, awake and grey with it: "Three days. My boy first, then the street. They\'re not in pain. They\'re just not here." At night a shape stands at the end of the pier, watching the windows like a nurse on a ward.', [
      ch('Approach it', fight('It does not attack first. If you do not attack for three turns it says, without a voice: "They will not have to feel it end."', wild({ species: ['darkrai'], lv: 4, shadow: true, special: 'ss.galactic.long-night' }), flag('galactic-long-night-met'))),
      ch('Fetch a Lunar Wing (two nodes away)', out('The town wakes. The shape bows its head and is purified where it stands.', good(8), flag('galactic-town-woke'), heal(1))),
      ch('Let them sleep', out('Canalave is quiet, and stays quiet. Nobody there will feel the end.', flag('galactic-town-slept'), heat(-3))),
    ]),
  ev('xe.sinnoh.ribbon', 'The Ribbon', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(3)], cast: ['trainer.fairy_tale_girl'], tint: '#e8c8e0', effect: 'glint' } as never,
    'A young woman with pink hair is buying every ribbon on the shelf while a Galactic Scientist carries her bags. "The chain is so drab. Red, red, red. I told the little bald doctor: if it\'s going to hold a god, it should at least be cute." She looks at your lead Pokémon the way a jeweller looks at a stone. "Ooh. What a strong little heart it has. Those are the fun ones to close."', [
      ch('Follow her', out('She does not notice, or does not mind. Her notes are signed with a heart.', flag('galactic-lovrina-followed'), flag('cipher-seen-lovrina'))),
      ch('Challenge her', fight('"Hmph. Fine. One little dance." Her Pokémon wear pink ribbons on their paws.', trainer('Lovrina', { cls: 'ace-trainer', size: 3, lv: 2, team: ['gardevoir', 'mismagius', 'roserade'], win: [flag('galactic-lovrina-down')] }), flag('cipher-seen-lovrina'))),
      ch('"Who do you work for?"', out('"Someone with a much bigger chain to fill. Byeee."', flag('cipher-seen-lovrina'))),
    ]),
];
