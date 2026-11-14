// Beta 0.7 E9: the eight Hoenn story events (`xe.hoenn.*`) from tools/sources/expansion/03_HOENN_TEAM_AQUA_AND_MAGMA_EXPANDED.md E5.
// Built into src/data/events/xe-hoenn.json by tools/build-expansion-events.ts (npm run data:xe-events).
// The tilt (which team is ahead) is two story flags: `ev:aqua-ahead` and `ev:magma-ahead`.
import { $, ch, ev, fight, flag, good, heal, inRegion, leave, out, rest, trainer, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const note = (special: string): Json => ({ kind: 'fieldNote', special });
const base: Json[] = [inRegion('hoenn'), { kind: 'xevents' }];
const trackAt = (n: number): Json => ({ kind: 'track', atLeast: n });
const grunt = (name: string, team: string[], win: Json[] = []) => trainer(name, { cls: 'roughneck', size: team.length, lv: 0, team, win });

export const XE_HOENN_EVENTS: Json[] = [
  ev('xe.hoenn.wet-cellar', 'Wet Cellar, Dry Well', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 2, requires: base, cast: ['trainer.worker_m', 'trainer.fisherman'], tint: '#2a3a4a', effect: 'none' } as never,
    'Two neighbors. One is bailing out a cellar: "Three days of rain on my roof." The other lowers a bucket into a well and brings it up empty: "And not a drop on mine. Same street!" At the end of the street an Aqua Grunt and a Magma Grunt stand over two small humming boxes, twenty paces apart, glaring. "Ours was here first!" "Yours is leaking!"', [
      ch('Break the blue box', fight('The Aqua Grunt goes down, the box cracks, and the cellar drains.', grunt('Aqua Grunt', ['sharpedo', 'mightyena']), flag('magma-ahead'), good(2))),
      ch('Break the red box', fight('The Magma Grunt goes down, the box cracks, and the well fills.', grunt('Magma Grunt', ['camerupt', 'mightyena']), flag('aqua-ahead'), good(2))),
      ch('Swap them', out('The boxes cancel out. Both Grunts stare. "...Is it supposed to do that?" "Nobody tell the admins." The weather settles.', flag('hoenn-cancel-trick'), heat(-3))),
    ]),
  ev('xe.hoenn.weather-institute', 'The Institute', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(2)], cast: ['trainer.gentleman'], tint: '#d8d8e0', effect: 'flicker' } as never,
    'A scientist under a desk: "They want the long-range model. I told them it\'s a guess! We put error bars on it! They took the error bars off!" Upstairs a small grey Pokémon changes shape every few seconds: sun, rain, sun, rain. An admin, reading it like a ledger: "This one knows what the sky\'s going to do before the sky does. It\'s coming with us."', [
      ch('Battle the admin', fight('"Ahyahyahya! ...That was a nervous laugh. I want that noted." The Institute lets you keep Forecast company.', trainer('Weather Admin', { cls: 'ace-trainer', size: 3, lv: 2, team: ['camerupt', 'sharpedo', 'swalot'], win: [flag('hoenn-forecast-saved'), good(3)] }), heat(3), note('sv.aqua.forecast'))),
      ch('Ask Forecast what it sees', out('It turns into a shape it has no form for: half sun, half rain, and it shivers.', flag('hoenn-forecast-seen'), note('sv.aqua.forecast'))),
      ch('Leave', leave('Forecast is taken. The other team\'s weather shifts will no longer be announced a turn ahead.')),
    ]),
  ev('xe.hoenn.stern-and-cozmo', 'Stern and Cozmo', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: base, cast: ['trainer.gentleman', 'trainer.sailor'], tint: '#1a2a3a', effect: 'none' } as never,
    'Two men are arguing in front of a model submarine. "They gave me a team, Stern. Forty people who want to hear about meteorites! Do you know how long I\'ve waited for forty people?" "And mine paid for the pressure hull in cash. I\'m aware of what that means. I built it anyway." "They can\'t both be the villains." "...Can\'t they?"', [
      ch('"What did you tell them?"', out('Each admits one fact: where the meteorite goes, and how deep the sub can dive.', flag('hoenn-fact-meteorite'), flag('hoenn-fact-dive'))),
      ch('"Quit."', out('Whichever man belongs to the team in this world quits on the spot, and will not be at his own raid.', flag('hoenn-stern-or-cozmo-turned'), good(4), heat(-4))),
      ch('"Compare notes."', out('They lay a sea chart over a geological survey. The two plans point at the same cave. "Who gave you your map?" "A consultant. Lovely young woman. Red hood." "...Blue."', flag('hoenn-maps-compared'))),
    ]),
  ev('xe.hoenn.two-hoods', 'Two Hoods', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(1)], cast: ['trainer.psychic_m'], tint: '#2a1a24', effect: 'glint' } as never,
    'A young woman in a hood is talking to a cave wall. A Whismur sits on her shoulder. "...and he\'ll believe it, because it\'s true. That\'s the trick. You don\'t lie. You just stop reading halfway down." She turns, grinning, and the grin does not reach very far. "Oh! A witness. Which hood am I today? Blue? I\'m the Tidereader. Big fan of oceans."', [
      ch('"What does the rest of the mural say?"', out('"That something\'s coming down. That only the one in the sky can meet it. That it only comes when the two below are loud enough to wake it." The grin is gone. "So I\'m making them loud."', flag('hoenn-two-hoods'))),
      ch('"People will die."', out('"Some. Not all. I did the sums. I do them every night, and I get the same answer, and I hate it every time. You got a better answer? I\'d love one."', flag('hoenn-two-hoods'))),
      ch('Battle her', fight('"Strong. Good. Stay strong. If I\'m wrong, somebody\'s going to have to stop me, and it should be someone who can."', trainer('Zinnia', { cls: 'dragon-tamer', size: 3, lv: 2, team: ['salamence', 'altaria', 'noivern'], win: [flag('hoenn-zinnia-down')] }), heat(2))),
    ]),
  ev('xe.hoenn.arms-dealer', 'The Arms Dealer', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(3)], cast: ['trainer.biker'], tint: '#2a2018', effect: 'none' } as never,
    '"Ha! Same model, friend, same model! Yours is red. Red is extra." A huge man unloads crates while an Aqua admin leaves and a Magma admin arrives. "The other side has last year\'s. You want to lose to last year\'s?" He sees you. "A third customer! You want a box that makes weather? No? You want to fight? Good. I was getting bored of money."', [
      ch('Fight him', fight('"Strong! Stronger than both my customers. You should sell them something."', trainer('Dakim', { cls: 'black-belt', size: 3, lv: 2, team: ['golem', 'nidoking', 'donphan'], win: [flag('cipher-seen-dakim'), $(2000)] }), heat(2))),
      ch('Show him the swap trick', out('"...They cancel? Hah! Don\'t tell the customers." He pays for your silence.', $(8000), flag('hoenn-dakim-bought'), good(-3)), { requires: [{ kind: 'flag', key: 'hoenn-cancel-trick', atLeast: 1, atMost: 99 }] }),
      ch('Follow the crates', out('The crates go to one place, and you write the road down.', flag('hoenn-crates-followed'), flag('cipher-seen-dakim'))),
    ]),
  ev('xe.hoenn.truce-lunch', 'Lunch Break', G, { stop: 'event', rarity: 'common', minStage: 2, requires: base, cast: ['trainer.roughneck'], tint: '#e0d8a0', effect: 'none' } as never,
    'An Aqua Grunt and a Magma Grunt are sharing a bench and a lunchbox. "We\'re on break." "Union rules. Well. Not union. We asked for a union." "Archie said the sea doesn\'t unionize." "Maxie said it\'d be inefficient."', [
      ch('Sit down', out('They share. "Honestly? I joined for the hood." "I joined for the boat." The grunts give you half a sandwich.', heal(0.2), rest(), flag('hoenn-truce-seed'))),
      ch('Report them', out('Both are reassigned to the front line. Somebody will be in the way later.', heat(2), flag('hoenn-grunts-reassigned'))),
      ch('Walk on', leave('"If it all goes wrong in that cave," one calls after you, "I\'m not hitting him. I\'ll hit anyone else."')),
    ]),
  ev('xe.hoenn.steven-letter', 'A Letter for Steven', G, { stop: 'event', rarity: 'uncommon', minStage: 3, requires: [...base, trackAt(1)], cast: ['trainer.gentleman'], tint: '#303038', effect: 'none' } as never,
    'A man in a suit is examining a cave wall with a small hammer. "Devon has had six resonators fall off a truck this year. All six were returned in better condition than we shipped them. Someone has been improving our rejects and selling them back to the region. I\'d like to know who. I\'d also like this stone. Hold my lamp?"', [
      ch('Hold the lamp', out('He gives you a good stone for your trouble and a small, serious nod.', $(3000), flag('hoenn-steven-lamp'))),
      ch('Tell him about Dakim', out('"A fighter turned supplier. That\'s worse than a scientist. A scientist wants it to work. He only wants it to sell." He will stand beside you when the time comes.', flag('hoenn-steven-ally')), { requires: [{ kind: 'flag', key: 'cipher-seen-dakim', atLeast: 1, atMost: 99 }] }),
      ch('Leave', leave()),
    ]),
  ev('xe.hoenn.keepers', 'The Keepers', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: [...base, trackAt(2)], cast: ['trainer.hex_maniac', 'trainer.hiker'], tint: '#241a28', effect: 'glint' } as never,
    'An old man and an old woman sit by two empty cushions. "They aren\'t weapons, you know. People keep thinking that." "The land made one and gave it to the sea. The sea made one and gave it to the land." "They\'re apologies." "You don\'t use an apology. You keep it where you can see it."', [
      ch('Ask how to return them', out('They tell you, slowly, as if hoping you will be the one to ask. Each Orb goes to the other titan.', flag('hoenn-orbs-swap'))),
      ch('Promise to bring them back', out('"We\'ll keep the cushions warm."', good(3), flag('hoenn-keepers-promise'))),
    ]),
];
