// Beta 0.7 E9: the eight Paldea story events (`xe.paldea.*`) from tools/sources/expansion/09_PALDEA_TEAM_STAR_EXPANDED.md E5.
// Built into src/data/events/xe-paldea.json by tools/build-xe-alola-paldea.ts (npm run data:xe-alola-paldea).
// Same mapping as Kanto: the "world state" is the track (`atLeast`), Rep and Intel become Heat and story flags (`ev:star-...`).
// The Old Habits trait, Clive as a raid ally and the Phase 2 Kieran duel are limits: the flags are set for later slices.
import { ch, ev, fight, flag, heal, inRegion, leave, out, rest, trainer, type Json } from '../dsl.ts';

const G = 'Tricksters, villains and teams';
const heat = (n: number): Json => ({ kind: 'evil', heat: n });
const base: Json[] = [inRegion('paldea'), { kind: 'xevents' }];
const grunt = (name: string, size = 2, lv = 0, win: Json[] = []) => trainer(name, { cls: 'roughneck', size, lv, win });

export const XE_PALDEA_EVENTS: Json[] = [
  ev('xe.paldea.flyer', 'The Flyer', G, { stop: 'event', rarity: 'uncommon', priority: 100, minStage: 1, requires: base, cast: ['trainer.youngster_m'], tint: '#1c2038', effect: 'none' } as never,
    'A corridor. A paper star taped inside a locker vent. From the toilets, the sound of someone trying to eat crisps quietly. "Occupied." It is lunchtime. "I know. That\'s why I\'m in here." Under the stall door a flyer slides out, a star and five words: YOU CAN SIT WITH US. "Someone put that in my locker. Do you think it\'s a trick? Things like that are usually a trick."', [
      ch('"It\'s not a trick."', out('The door opens a crack. The first-year looks out for the first time in weeks.', flag('star-first-year-hopeful'), heat(-2))),
      ch('Sit down outside the stall', out('You eat lunch on a corridor floor. After a while a second sandwich comes under the door.', rest(), heal(0.2))),
      ch('"Who made you eat in there?"', out('"Nobody. That\'s the thing. Nobody did anything. They just all know not to sit next to me."', flag('star-first-year-heard'), heat(-2))),
    ]),
  ev('xe.paldea.clive', 'Clive', G, { stop: 'event', rarity: 'uncommon', minStage: 2, requires: [...base, { kind: 'track', atLeast: 2 }], cast: ['trainer.gentleman'], tint: '#2a2418', effect: 'none' } as never,
    'A student leans on a wall with a pompadour the size of a loaf. He is sixty. "Sup. I am Clive. A student. Of this school. I am down with Team Star, as we youths say. Do you know where one might hang with them?" "…Director?" "Who? I know of no such man. I am Clive. I enjoy… skateboards."', [
      ch('"Sure, Clive."', out('He beams. "Radical." He will stand with you when the Bases are in trouble.', flag('star-clive-friend'), heat(-2))),
      ch('"Why are you really here?"', out('The posture goes out of him. "Because I was appointed to a school whose records for a certain year are blank. Blank records are not an accident. They are a decision. I should like to know whose."', flag('star-clive-intel'), heat(-4))),
      ch('"Nice hair."', out('"Thank you. It is my own. It is now my own. I paid for it."')),
    ]),
  ev('xe.paldea.sandwich', 'Sandwiches', G, { stop: 'event', rarity: 'common', minStage: 2, requires: base, cast: ['boss.arven-s'], tint: '#2a2a18', effect: 'none' } as never,
    'A tall student with a huge backpack unloads foil parcels onto a wall outside a Base. A very old dog sleeps on his feet. "Don\'t get the wrong idea. I\'m not with them. I just make too much. Somebody\'s got to eat it." A Star Grunt, mouth full: "He says that every day. He labels them." "Because you\'re allergic to pickles, that\'s just food safety."', [
      ch('Take a sandwich', out('It is very good. You feel ready for anything.', heal(0.3))),
      ch('"Why here?"', out('"My dad was a professor. Never home. I ate a lot of lunches by myself. These kids eat together. I like the noise."', flag('star-arven-cook'))),
      ch('Pet the dog', out('"He\'s had a hard few years. He\'s getting better. Scratch behind the left ear. Left." Your lead Pokémon enjoys it too.', { kind: 'friendship', amount: 3, who: 'lead' })),
    ]),
  ev('xe.paldea.read-receipts', 'Read Receipts', G, { stop: 'event', rarity: 'rare', minStage: 3, requires: base, cast: ['trainer.penny'], tint: '#241c30', effect: 'flicker' } as never,
    'The Academy entrance hall. A girl in an Eevee backpack sits behind a pillar with a laptop. Your phone rings. On the laptop screen, the same call is being placed. "This is Cassiopeia. I have been watching you. I have a proposal." From behind the pillar, quite audible: "…I have a proposal."', [
      ch('Play along', out('"The Bosses will not stand down unless they are beaten. They made me promise never to let them be talked out of it. So: beat them. Kindly."', flag('star-penny-trusted'), heat(-3))),
      ch('Walk round the pillar', out('She slams the laptop. "I\'m not— I was doing homework. How long did you know?" "Since \'I have a proposal\'." "Ugh." From now on she speaks as herself, which she finds much harder.', flag('star-penny-known'), heat(-3))),
      ch('"What\'s on the laptop?"', out('"Reports. Eighteen months old. Deleted by someone with staff access at 11:42 on a Friday night. I got them back. They\'ve got my friends\' names in them. I can end this any day I like. I just have to show everyone the worst week of their lives."', flag('star-reports-seen'), heat(-4))),
    ]),
  ev('xe.paldea.admissions', 'Admissions', G, { stop: 'event', rarity: 'rare', minStage: 4, requires: [...base, { kind: 'track', atLeast: 3 }], cast: ['trainer.gentleman'], tint: '#101828', effect: 'glint' } as never,
    'A man with long silver hair talks to a ring of Star Grunts, a folder of brochures in hand. "A full scholarship. Board, tuition, a laboratory of your own. My organization prizes exactly the kind of initiative your schools punish." The Base gate bangs open. Mela: "OI! Shampoo advert! They\'re not for sale and neither are they!" He does not raise his voice: "I heard you both times. I have come back so that you will remember that I asked." He sees you. "The one from the reports. Eight regions. You have cost us a great deal. I am not angry. Anger is for people who are not going to win."', [
      ch('Take a brochure', out('The "school" has an island for an address.', flag('star-brochure'), flag('cipher-seen-nascour'), heat(-4))),
      ch('Stand next to Mela', out('"…Okay. You can stay."', flag('star-mela-ally'), flag('cipher-seen-nascour'), heat(-2))),
      ch('Challenge him', out('"No. Not here, in front of children. I have some standards. They are simply not the ones you would like."', flag('cipher-seen-nascour'))),
    ]),
  ev('xe.paldea.old-hallway', 'The Old Hallway', G, { stop: 'event', rarity: 'rare', minStage: 4, requires: [...base, { kind: 'track', atLeast: 4 }], cast: ['trainer.roughneck'], tint: '#1c1c1c', effect: 'none' } as never,
    'Three "Star Grunts" at a checkpoint. The helmets are right. The boots are wrong. Peon Brask: "Hahaha— toll! Team Star toll! Hand it over, that\'s what we do, we\'re delinquents—" Peon Odette, a smile like a paper cut: "You\'ll want to pay. Otherwise people will say Team Star beats up travellers. Again. That\'s rather the idea." Peon Tully says nothing and looks at his boots.', [
      ch('Battle them', fight('They go for your weakest Pokémon first, every time.', grunt('Peon Brask, Odette and Tully', 3, 1, [flag('star-oldhallway-beaten')]))),
      ch('"You\'re the ones from before."', out('Odette: "We were children. It was years ago." Tully: "…It was eighteen months." They both look at him.', flag('star-tully-cracking'), heat(-3))),
      ch('Call a real Star Grunt over', out('Eri arrives. She does not say a word. She is a head taller than all three of them now. They leave. Tully, last to go, very low: "Tell her— no. Don\'t tell her anything. I don\'t get to."', flag('star-eri-called'), heat(-2))),
    ]),
  ev('xe.paldea.applicant', 'The Applicant', G, { stop: 'event', rarity: 'rare', minStage: 5, requires: [...base, { kind: 'flag', key: 'cipher-seen-nascour', atLeast: 1 }], cast: ['trainer.kieran'], tint: '#241830', effect: 'flicker' } as never,
    'Outside Caph Base, a boy with a purple-black fringe holds two pieces of paper: a hand-drawn Star flyer and a glossy brochure. "I came all the way from Kitakami. I\'m sick of being the one who loses. I want to be strong. So strong nobody ever looks past me again. These ones say I can sit with them. The man with the silver hair says he can make me win. I know which one I should pick. I know which one I want." His Dipplin looks at the brochure and shrinks back into its apple a little.', [
      ch('"Winning won\'t fix it."', out('"You\'d say that. You win." He walks toward the silver-haired man.', flag('star-kieran-cipher'), heat(3))),
      ch('Battle him, and lose on purpose', out('He knows. It makes it worse.', flag('star-kieran-cipher'), heat(3))),
      ch('Battle him properly, then stay', fight('Win or lose, you do not leave afterwards. "Why are you still here?" You say nothing. "Nobody stays after." Eri comes out with two water bottles and throws him one. "We do. Come on. You can hold the pads."', grunt('Kieran', 3, 1, [flag('star-kieran-star'), heat(-5)]))),
    ]),
  ev('xe.paldea.shop-class', 'Shop Class', G, { stop: 'event', rarity: 'rare', minStage: 4, requires: base, cast: ['trainer.worker_m'], tint: '#241c14', effect: 'none' } as never,
    'Ruchbah Base\'s garage. Ortega is under a chassis. Captain Zeb is handing him the wrong spanner on purpose. "The first one was a Varoom Penny found in a skip. We tuned it in my dad\'s garden shed with a hairdryer and a Tera shard off a field trip. It went whoomp and turned pink and we screamed for about an hour." Zeb: "Torque was awful." "Torque was awful. We loved it. Then some people found the shed. We built five more out of spite. But that first one was the only one we built because it was fun."', [
      ch('Ask what happened to it', out('"Scrap dealer. I looked. Somebody\'d already bought it. Paid ten times what it was worth. Who does that?"', flag('star-first-engine'), heat(-4))),
      ch('Hand him the right spanner', out('Zeb, betrayed: "Hey."', flag('star-zeb-ally'), heat(-2))),
      ch('Ask how the link works', out('It takes four minutes. It is, you gradually realize, an exact description of how to make a Shadow Pokémon, told by someone who thinks he is describing a go-kart.', flag('star-link-explained'), heat(-3))),
    ]),
];
