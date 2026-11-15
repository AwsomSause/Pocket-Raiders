// Catalog Overhaul Pack, legends: the Mega Anomalies M1 to M6 (QUESTLINES_ALPHAS_AND_ANOMALIES.md part two).
// These are pack questlines, not catalog ids: the status file lists them under `extra`.
// The region's Anomaly meter is the run flag `mega-meter` (0 to 5, started at 0 in each region by core/legends/signs.ts);
// each resolved Anomaly adds 1 to `mega-resolved`. M7 (Mega Without a Stone) waits on the rivals thread's rival slot.
import { any, ch, ev, ferry, fight, flag, flagAgo, flagIs, fr, good, has, hurt, item, leave, lose, out, room, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { alpha, calmedAlpha, gift, joinAlpha, sign } from './_legendsKit.ts';

export const CATEGORY = 'legends';

const G = 'Story: Mega Anomalies';
const R = { room: true, rarity: 'rare' as const };
const up = (n = 1): Json => flag('mega-meter', n);
const down = (): Json => flag('mega-meter', -1);
const resolved = (): Json => flag('mega-resolved');
const later = (eventId: string, nodes: number): Json => ({ kind: 'laterEvent', eventId, nodes });
const moment = (text: string, importance = 70): Json => ({ kind: 'moment', text, importance });

// ---------------------------------------------------------------- M1. The One That Cannot Turn Back (Absol)
const m1: Json[] = [
  ev('co-m1-absol', 'The One That Cannot Turn Back', G, { rarity: 'rare', cast: ['trainer.hex_maniac'], pokemon: 'absol-mega', tint: '#c8d0e0', effect: 'snow' },
    'Snow on a ridge. A Mega Absol stands at the edge, wings of white fur shaking. It has been Mega for a week. It cannot stop.\n\nThe Absol does not attack. It watches you and makes a sound that is almost a word.\nAn old woman with a lantern, coming up the path: "You see it too. Good. I thought I was mad."\nOld woman: "My son\'s Absol. He fell on this ridge, battling, with the Key Stone still in his fist."\nOld woman: "The bond\'s open. Nobody on the other end. It can\'t come back down."\nOld woman: "We buried the Stone with him. I didn\'t know."',
    [
      ch('"I\'ll find the Stone."', out('"The churchyard\'s two hours down," she says. "I\'ll meet you at the grave. I want to be there."', flag('absol-stone'), later('co-m1-churchyard', 1), later('co-m1-grave', 2))),
      ch('"Can it be broken?"', out('Old woman: "Break it and he\'s gone twice." She turns and goes down the path alone, toward the churchyard. You can follow.', room('co-m1-grave'))),
      ch('"Let it be."', out('You leave it on the ridge. It follows you at a distance for the rest of the region. It does not sleep, so nobody does.', flag('absol-left'), up())),
    ]),
  ev('co-m1-churchyard', 'The One That Cannot Turn Back: The Churchyard', G, { ...R, pokemon: 'absol-mega', tint: '#8090a0', effect: 'snow' },
    'The churchyard gate is iced shut. Something has made its den among the old stones, and it does not want visitors.',
    [ch('Clear the way.', fight('It comes out of the snow at you.', wild({ types: ['ghost'], lv: 0 })))]),
  ev('co-m1-grave', 'The One That Cannot Turn Back: The Grave', G, { ...R, cast: ['trainer.hex_maniac'], pokemon: 'absol-mega', tint: '#a0a8b8', effect: 'snow' },
    'The old woman kneels and lets you dig. The Stone is in your hand. The Absol lands beside the grave.\n\nOld woman: "Someone has to hold the other end."\nOld woman: "I\'m too old. His girl\'s too young. But she wants to."',
    [
      ch('"I\'ll hold it."', out('The bond closes through you. The Absol reverts, sleeps for a full day, and when it wakes it comes with you. It needs no Stone of its own: the bond is already there.', flag('absol-joined'), resolved(), down(), gift('absol', { friendship: 50 }), item('absolite'), moment('An Absol that had been Mega for a week came back down, through you.', 80))),
      ch('"Give it to his daughter."', out('The girl, Mirel, holds it two-handed. The Absol reverts and goes home with her. The old woman presses her lantern into your hands. "It shows the weather on the road ahead," she says. "He made it."', flag('absol-home'), resolved(), down(), flag('old-lantern'), { kind: 'scout', columns: 2 })),
      ch('"Break it."', out('The Stone cracks in two. The Absol reverts, free, and runs into the snow. You see it once more, on a far ridge, looking back.', flag('absol-free'), resolved(), down())),
    ]),
];

// ---------------------------------------------------------------- M2. The Stone Harvest (Team Flare, Celosia): a Region story, three beats
const flare = (name: string, team: string[], win: Json[] = []): Json => ({ ...trainer(name, { team, win }), evil: name.startsWith('Celosia') ? 'executive' : 'grunt' });
const m2: Json[] = [
  ev('co-m2-harvest', 'The Stone Harvest', G, { rarity: 'rare', cast: ['trainer.worker_m'], pokemon: 'ampharos-mega', tint: '#a03030' },
    'Red uniforms on a hillside. A seam of stone glows under their drills. Somewhere down the valley, a Pokémon screams.\n\nFlare Grunt: "Stand aside. This is a licensed excavation."\nGrunt: "Every stone we cut is worth a house. Every stone."\nDown the valley, a Mega Ampharos staggers through a field, its mane flickering on and off.\nFarmer, running up: "That\'s mine! It just went off like that! Is that you? Is that you lot?"\nGrunt: "We cut a stone, something somewhere evolves. Not our problem."',
    [
      ch('"Shut it down."', out('You note the mine\'s entrance. It will take more than one day.', flag('flare-mine-entered'))),
      ch('"How many stones are left?"', out('Grunt: "Forty. Maybe fifty." He holds one out, low, where the farmer can\'t see. "Yours. Look the other way."', room('co-m2-bribe'))),
      ch('Stay with the Ampharos.', out('You leave the mine and go down to the field. You stand with the Ampharos for two turns of its flickering, talking, until its mane goes dark and it sits down in the grass. The farmer will not forget it.', flag('flare-farmer-helped'), flag('flare-mine-entered'), good(1))),
      ch('"Leave it for now."', out('The drills keep running behind you.', flag('flare-mine-running'), up())),
    ]),
  ev('co-m2-bribe', 'The Stone Harvest: The Offer', G, { ...R, cast: ['trainer.worker_m'], tint: '#a03030' },
    'One random Mega Stone, now, for looking the other way. The farmer is still standing there.',
    [
      ch('Take the stone.', out('You take it. The farmer saw you take it.', any('absolite', 'manectite', 'ampharosite', 'aggronite', 'lucarionite'), flag('flare-bribed'), up())),
      ch('"No."', out('"Your loss." He pockets it. You go round the mine and mark the entrance.', flag('flare-mine-entered'))),
    ]),
  ev('co-m2-mine', 'The Stone Harvest: The Mine', G, { rarity: 'rare', requires: [flagIs('flare-mine-entered')], cast: ['trainer.worker_m'], tint: '#702020' },
    'The mine. Three levels down, two Flare checkpoints, and at the bottom, the seam chamber.',
    [
      ch('Go down.', fight('Flare Grunt: "You again? Get them!"', flare('Flare Grunt', ['houndour', 'golbat'], [room('co-m2-mine-2')]))),
    ],
    ),
  ev('co-m2-mine-2', 'The Stone Harvest: The Second Checkpoint', G, { ...R, cast: ['trainer.worker_m'], tint: '#601818' },
    'The second checkpoint. The walls glow here.',
    [ch('Push through.', fight('Two of them this time.', { ...flare('Flare Grunts', ['houndour', 'croagunk', 'scraggy'], [flag('flare-mine-cleared')]), format: 'doubles', size: 3 }))]),
  ev('co-m2-seam', 'The Stone Harvest: The Seam Chamber', G, { rarity: 'rare', requires: [flagIs('flare-mine-cleared')], cast: ['trainer.psychic_m'], pokemon: 'manectric-mega', tint: '#c04040' },
    'Celosia, Flare Admin: "You found us. The boss said someone would."\nCelosia: "Do you know what a Mega Stone is? It\'s a Pokémon\'s future, frozen. We\'re just thawing them early."\nHer Mega Manectric has been Mega for three days. Its fur is falling out.',
    [
      ch('Return the stones to the ground.', fight('Celosia: "Then you\'ll have to make me."', flare('Celosia', ['manectric', 'drapion', 'liepard'], [flag('flare-mine-shut'), resolved(), down(), gift('mareep'), moment('The stones went back into the seam. Celosia\'s Manectric reverted, and she held it, stunned.', 80)])), { requires: [flagIs('flare-bribed', 0, 0)] }),
      ch('Give back the bribe, then return the stones.', fight('Celosia: "You took one. You\'re no different." You put it on the ground between you. She looks at it for a long time.', flare('Celosia', ['manectric', 'drapion', 'liepard'], [flag('flare-mine-shut'), resolved(), down(), gift('mareep')])), { requires: [flagIs('flare-bribed')] }),
      ch('Take the stones.', fight('Celosia: "So that\'s what you came for."', flare('Celosia', ['manectric', 'drapion', 'liepard'], [flag('flare-stones-taken'), any('manectite', 'ampharosite', 'aggronite', 'lucarionite', 'absolite'), any('gardevoirite', 'scizorite', 'altarianite', 'medichamite')]))),
      ch('Flood the mine.', out('No battle. You open the old drainage gate and the river comes in. The seam is gone for the run, and so is every Mega Stone in this region. The meter goes still.', flag('flare-mine-flooded'), flag('mega-meter', -5), resolved())),
    ]),
];

// ---------------------------------------------------------------- M3. The Twin Flames (Charizard)
const twins = (): Json => ({ ...trainer('Brann and Ketty', { team: ['charizard', 'charizard'], format: 'doubles', size: 2, friendly: true }) });
const m3: Json[] = [
  ev('co-m3-twins', 'The Twin Flames', G, { rarity: 'rare', cast: ['trainer.youngster_m'], pokemon: 'charizard-mega-x', tint: '#e06020' },
    'Two Charizard in a clearing, each Mega in a different way: one black with blue fire, one sleek with wide wings. Then both drop, gasping, back to normal.\n\nTeen trainer, Brann: "They\'re siblings. Hatched the same day. One Charizardite between them, so I broke it in half."\nBrann: "They each get two turns now. Then they collapse."\nBrann: "I know. I know. It was stupid."\nHis sister, Ketty, arriving: "It was your idea. Don\'t make it sound like you\'re sorry now."',
    [
      ch('"Who can fix it?"', out('Brann: "There\'s a stone-cutter. In the hills." Two nodes to her.', flag('twins-cutter'), takeNode(2), room('co-m3-cutter'))),
      ch('"Pick one of them."', fight('Ketty: "Don\'t you dare." Brann and Ketty command one sibling each.', twins())),
      ch('"Fight both."', fight('Win or lose, they will leave without fixing it.', twins())),
    ]),
  ev('co-m3-cutter', 'The Twin Flames: The Stone-Cutter', G, { ...R, cast: ['trainer.hiker'], pokemon: 'charizard', tint: '#a07040' },
    'The stone-cutter is a past Gym Leader, retired, half-blind.\n\nStone-cutter: "Two halves. I can make one whole stone now. Or two whole stones, given two years and the rest of my sight."\nStone-cutter: "I\'d do the two. But that\'s me."',
    [
      ch('"One stone now: Mega X."', out('One sibling becomes a full Mega, black and blue-fired. The other leaves the clearing for good.', flag('twins-one'), resolved(), down(), gift('charizard'), item('charizardite-x'))),
      ch('"One stone now: Mega Y."', out('One sibling becomes a full Mega, sleek and wide-winged. The other leaves the clearing for good.', flag('twins-one'), resolved(), down(), gift('charizard'), item('charizardite-y'))),
      ch('"Two, the long way."', out('"Two years," she says. "Come back when you\'re further along."', flag('twins-both'))),
      ch('"Let the twins choose."', out('They fight it out in an exhibition you referee. The winner chooses its own Mega, and comes with you.', flag('twins-chose'), resolved(), down(), gift('charizard'), any('charizardite-x', 'charizardite-y'))),
    ]),
  ev('co-m3-whole', 'The Twin Flames: Both Whole', G, { callback: true, rarity: 'rare', requires: [flagAgo('twins-both', 1)], cast: ['trainer.youngster_m'], pokemon: 'charizard-mega-y', tint: '#e08040' },
    'A letter finds you on the road, and then the twins themselves: both Charizard, both whole. The stone-cutter did the two.',
    [ch('"Which of you is coming?"', out('Brann and Ketty argue about it for an hour. In the end one sibling simply walks over to you and sits down.', resolved(), down(), gift('charizard'), any('charizardite-x', 'charizardite-y')))]),
  ev('co-m3-scorched', 'The Twin Flames: The Other Sibling', G, { callback: true, rarity: 'rare', requires: [flagAgo('twins-one', 1)], pokemon: 'charizard', tint: '#802010' },
    'A wild Charizard on a burnt hillside, wings scorched, angry. An Alpha now. It is the sibling that left the clearing, and it wants its sibling, not a fight.',
    [
      ch('Calm it.', fight('It comes at you anyway.', alpha({ species: 'charizard', need: 6, calm: [joinAlpha('charizard'), flag('twins-reunited')], win: [flag('twins-scorched-beaten')] }))),
      ch('Let your Charizard go to it.', out('Your Charizard walks up to it alone. They stand nose to nose a long time. The red goes out of its eyes, and it follows you both.', calmedAlpha(), joinAlpha('charizard'), flag('twins-reunited')), { requires: [{ kind: 'partySpecies', species: 'charizard' }] }),
    ]),
];

// ---------------------------------------------------------------- M4. The Mirror-Spider (Door: five rooms)
const mirrorRoom = (n: number, text: string): Json =>
  ev(`co-m4-room-${n}`, `The Mirror-Spider: Room ${n}`, G, { ...R, cast: ['trainer.hiker'], pokemon: n % 2 ? 'metagross-delta-ruin-mega' : 'metagross-delta-spider-mega', tint: '#506070' }, text, [
    ch('Set the mirror so each can see the other.', out('You angle the mirror and back away. Behind you, the clicking moves one room closer.', room(n < 3 ? `co-m4-room-${n + 1}` : 'co-m4-centre'))),
    ch('Turn your back to draw it on.', out('You turn. It is right behind you. You do not turn again until your heart stops pounding.', hurt(0.1), room(n < 3 ? `co-m4-room-${n + 1}` : 'co-m4-centre'))),
  ]);
const m4: Json[] = [
  ev('co-m4-mirror', 'The Mirror-Spider', G, { rarity: 'rare', cast: ['trainer.hiker'], pokemon: 'metagross-delta-spider-mega', tint: '#404858' },
    'An old ruin under a hill. In one room, a Metagross made of old pale stone stands still. In the next, the same shape: dark, legged like a spider, clicking.\n\nNeither moves when you look at it. When you turn, the clicking moves.\nAn archaeologist, Teodor, in the doorway: "Don\'t turn your back. I\'m serious."\nTeodor: "It\'s one Pokémon. Mega Evolved across a time rift. Half of it\'s here, half of it\'s there."\nTeodor: "I\'ve been watching them six weeks. They want to be in the same room."',
    [
      ch('"Herd them together."', out('Teodor hands you a mirror from his kit. "Each moves only when it\'s unseen. Let each see where the other stands."', flag('mirror-started'), room('co-m4-room-1'))),
      ch('"Catch the near one."', fight('The pale one turns to face you. It is not still any more.', wild({ species: ['metagross-delta-ruin-mega'], win: [flag('mirror-split')] }))),
      ch('"Leave the ruin."', leave('Teodor keeps watching. The ruin stays on the hill.')),
    ]),
  mirrorRoom(1, 'The first room. The pale form stands by the door. Somewhere ahead, clicking.'),
  mirrorRoom(2, 'The second room has three doors. The dark form is in the far one, very still, as long as you look at it.'),
  mirrorRoom(3, 'The third room is all mirrors already: someone tried this before. One is cracked.'),
  ev('co-m4-centre', 'The Mirror-Spider: The Central Room', G, { ...R, cast: ['trainer.hiker'], pokemon: 'metagross', tint: '#607080' },
    'Both are in the central room. They face each other.\n\nTeodor, whispering: "It\'s going to choose."',
    [
      ch('"Let it merge."', out('The rift closes like an eye. On the floor: one Metagross, normal, asleep. It joins you. Either Delta form will answer it, when it Mega Evolves.', flag('mirror-whole'), resolved(), down(), sign('dialga', 2), gift('metagross'), item('spider-delta-metagrossite'), item('ruin-delta-metagrossite'))),
      ch('"Stop it."', out('You step between them. The Spider form fades into the rift. The Ruin form stays, and comes to you, unstable. Teodor is furious.', flag('mirror-split'), gift('metagross'), item('ruin-delta-metagrossite'))),
    ]),
];

// ---------------------------------------------------------------- M5. The Three Tatsugiri
const judge = (form: 'curly' | 'droopy' | 'stretchy', loser: 'curly' | 'droopy' | 'stretchy'): Json =>
  ch(`"The ${form[0]!.toUpperCase()}${form.slice(1)} wins."`, out(`The ${form[0]!.toUpperCase()}${form.slice(1)} Megas once, proudly, and the others sulk. The ${loser[0]!.toUpperCase()}${loser.slice(1)} climbs out of the Dondozo and comes with you, still sulking. It will prove a point one day.`, flag('tatsu-winner'), resolved(), down(), gift('tatsugiri'), item(loser === 'curly' ? 'tatsugirinite' : `tatsugirinite-${loser}`)));
const m5: Json[] = [
  ev('co-m5-tatsugiri', 'The Three Tatsugiri', G, { rarity: 'rare', cast: ['trainer.fisherman'], pokemon: 'dondozo', tint: '#5090b0', effect: 'rain' },
    'A beach under a light rain of fish. A Dondozo sits on the sand with its mouth wide, looking miserable. Inside it, three small voices argue.\n\nFisher: "It\'s been like that since dawn. It ate something."\nThree Tatsugiri poke out: a Curly, a Droopy, and a Stretchy. Each glows. Each pushes the others back in.\nFisher: "Is that... are they all trying to Mega?"\nThe Dondozo hiccups. More fish fall.',
    [
      ch('"Hold a contest."', out('Three rounds: a rhythm, a trick with a Berry, a dive. You judge.', flag('tatsu-contest'), room('co-m5-judge'))),
      ch('"Pull them out."', fight('They bite. The Dondozo gets angry.', { ...wild({ species: ['dondozo', 'tatsugiri'], format: 'doubles', lv: 1 }), pseudo: true })),
      ch('Feed the Dondozo something else.', out('A Big Malasada goes in. The Dondozo burps them out, dazed, onto the sand.', lose('big-malasada'), flag('tatsu-fed'), room('co-m5-judge')), { requires: [has('big-malasada')] }),
      ch('Feed it five Berries.', out('Five Berries go in, one after another. The Dondozo burps them out, dazed, onto the sand.', lose('oran-berry'), flag('tatsu-fed'), room('co-m5-judge')), { requires: [has('oran-berry')] }),
    ]),
  ev('co-m5-judge', 'The Three Tatsugiri: The Verdict', G, { ...R, cast: ['trainer.fisherman'], pokemon: 'tatsugiri', tint: '#60a0c0' },
    'The Curly pouts. The Droopy lies flat. The Stretchy waits.',
    [
      judge('curly', 'droopy'),
      judge('droopy', 'stretchy'),
      judge('stretchy', 'curly'),
      ch('"It\'s a tie."', out('None Megas. They make up. All three climb back into the Dondozo and ride off. One shouts back, and you notice a fourth seat left in its mouth.', flag('tatsu-tie'), resolved(), down())),
    ]),
  ev('co-m5-ride', 'The Three Tatsugiri: A Ride', G, { callback: true, rarity: 'rare', requires: [flagAgo('tatsu-tie', 1)], pokemon: 'dondozo', tint: '#4080a0' },
    'A Dondozo surfaces by the shore with its mouth open. Three small voices shout from inside. There is a seat for you.',
    [
      ch('Climb in.', out('You cross the sea in a Dondozo\'s mouth, three nodes in one long, wet, cheerful ride.', ferry(), ferry(), ferry(), fr(3))),
      ch('Wave them off.', leave('They shout something rude and very fond, and swim away.')),
    ]),
];

// ---------------------------------------------------------------- M6. The Flower That Was Never Meant to Bloom (Floette, AZ)
const AZ = [flag('az-flute'), item('az-flute'), moment('The old man gave you the last thing he made before the war: AZ\'s Flute.', 85)];
const m6: Json[] = [
  ev('co-m6-flower', 'The Flower That Was Never Meant to Bloom', G, { rarity: 'rare', cast: ['trainer.fairy_tale_girl'], pokemon: 'floette-mega', tint: '#e0c040' },
    'A field of yellow flowers. In the middle, a Floette with a red flower, glowing, Mega Evolved. It should not be possible.\n\nIt flies straight to you and hides behind you.\nAcross the field, the grass is burning in a perfect line, coming from the east.\nA Ranger, arriving: "There\'s a lab out east. It\'s pulling power from somewhere. Every flower for a mile\'s wilting."\nRanger: "That Floette came from that direction. Running."',
    [
      ch('"Follow the line east."', out('Three nodes east along the burnt line.', flag('floette-followed'), later('co-m6-scientist', 1), later('co-m6-reactor', 3))),
      ch('"Hide it."', out('It stays with you, under your coat. The meter climbs while the lab runs. You will have to find it sooner or later.', flag('floette-hidden'), up(), later('co-m6-reactor', 3))),
      ch('"Take it to a Pokémon Center."', out('Nurse Joy can\'t treat it. Joy: "It\'s not hurt. It\'s frightened." You go east after all.', flag('floette-followed'), later('co-m6-scientist', 1), later('co-m6-reactor', 3))),
    ]),
  ev('co-m6-scientist', 'The Flower That Was Never Meant to Bloom: The Fence', G, { ...R, cast: ['trainer.psychic_m'], tint: '#a03030' },
    'A Flare scientist at the lab fence, with a clipboard and a Pokémon that has clearly been told to guard it.',
    [ch('Get past.', fight('"Visitors are not on the schedule."', { ...trainer('Flare Scientist', { team: ['magneton', 'klefki'] }), evil: 'specialist' }))]),
  ev('co-m6-reactor', 'The Flower That Was Never Meant to Bloom: The Reactor Room', G, { ...R, cast: ['trainer.psychic_m'], pokemon: 'floette-mega', tint: '#c03030' },
    'Flare scientist: "It\'s charging. It\'s been charging for three thousand years. Do you know what it was built to do?"\nThe Floette stares at the machine. It starts to shake.',
    [
      ch('"Shut it down."', fight('A battle at the console.', { ...trainer('Flare Scientist', { team: ['magnezone', 'klefki', 'bronzong'], win: [flag('floette-saved'), resolved(), down(), room('co-m6-az')] }), evil: 'specialist' })),
      ch('"Let the Floette decide."', out('It flies into the machine and out again. The reactor dies. The Floette reverts, but its flower is pale.', flag('floette-pale'), resolved(), down(), room('co-m6-az'))),
    ]),
  ev('co-m6-az', 'The Flower That Was Never Meant to Bloom: North', G, { ...R, cast: ['trainer.hiker'], pokemon: 'floette-eternal', tint: '#806040' },
    'The Floette slumps into your hands, then lifts its head and points north. Toward a tall shape on a road: a very old, very tall man, walking.',
    [
      ch('Take it to him.', out('He sees it and stops walking. He kneels. The Floette flies to him and he cups it in both hands, and you understand that it was always his. He gives you the last thing he made before the war.', ...AZ), { requires: [flagIs('floette-pale', 0, 0)] }),
      ch('Take it to him.', out('He sees its pale flower and weeps. He holds it a long time. Then he gives you the last thing he made before the war.', ...AZ), { requires: [flagIs('floette-pale')] }),
    ]),
];

export const EVENTS: Json[] = [...m1, ...m2, ...m3, ...m4, ...m5, ...m6];
export const REMOVE: string[] = [];
