// Catalog Overhaul Pack, people: Past Champions cameos, the Landmark Delves and the three-stage trainer stories (STORY_FAMILIES_8.md,
// Part C (C1, C2, C3, C5, C6) and Part D (D1 to D7), lines 439-801). C4 Victory Hall is built elsewhere (people-champions-1).
// Each delve (C6) is a chain of rooms; each three-stage story (D1-D7) keeps its old ids `-s1..-s3`, a stage waiting one region after the last.
// Build: npm run co:build -- people-champions-2
import { readFileSync } from 'node:fs';
import { join as pathJoin } from 'node:path';
import { ch, companion, cure, ferry, fight, flag, flagAgo, flagAt, heal, item, join, out, ptype, room, statusLead, takeNode, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, is, moment, not, oldOf, scene, spar, variant } from './_people.ts';

export const CATEGORY = CAT;

/** "Trust +1" with the rival (the featured rival's trust feeling). */
const rivalTrust = (n = 1): Json => ({ kind: 'rivalChange', feelings: { trust: n } });
/** A rival you have met (a choice that brings the rival is hidden without one). */
const hasRival: Json = { kind: 'rivalMet', atLeast: 1 };
/** "+1 level" for the party's weakest Pokémon. */
const weakestLevel: Json = { kind: 'levels', amount: 1, who: 'weakest' };

// ---------- C1. Lunch with a Champion ----------
const lunch: Json[] = [
  scene('champion-lunch', 'Lunch with a Champion', {},
    'A park in the early afternoon, the grass still damp from a morning shower. At a picnic table under a wide oak, the Champion of this region sits behind a hamper big enough to hide a Snorlax in, and waves you over like an old friend who is running late. Their Pokémon lie sprawled in the sun around the table, every one of them with crumbs on its face. ' +
      'Champion: "Sit. I\'ve too many sandwiches. My Pokémon think I\'m feeding an army." A plate slides across to you before you have finished sitting down, then a cup of something warm from a flask. For a while you just eat, and it is very good. ' +
      'Then the Champion leans their elbows on the table, and the easy smile turns thoughtful. Champion: "What\'s the hardest thing about the road? Honestly."',
    [
      ch('"Losing."', out('The Champion nods slowly, as if they knew. They look past you at their own team, dozing in the grass. Champion: "It never stops being hard. It stops being the end." Then they open the hamper\'s second lid, which turns out to be full of medicine, and tend to every one of your Pokémon with their own hands, every scrape and burn and ache, until your whole team is as good as new.',
        heal(1), cure())),
      ch('"Being alone."', out('The Champion does not laugh, though you half expected them to. They tip their head at the Poké Balls on the bench beside you. Champion: "You\'re not. You\'ve got six." They let your team out onto the grass, and soon your Pokémon are sharing sandwiches with theirs and tumbling over each other in the sun. When you call them back, every one of them comes a little quicker than before.',
        bond(1, 'party'))),
      // TODO(engine): "A hint about their ace": nothing previews the region's Champion's team; the flag records the hint.
      ch('"Choosing."', out('The Champion laughs, a big warm laugh that startles a Pidgey out of the oak. Champion: "Then choose and don\'t look back. Or do. Both work." Then they lean in and lower their voice, as if the trees might be listening, and tell you one true thing about their ace. Champion: "You didn\'t hear that from me." You tuck it away for the League.',
        flag('champion-ace-hint'), moment('Over lunch, the Champion told you a secret about their ace'))),
    ]),
];

// ---------- C2. The Champion Arrives ----------
// "The Champion (the region's current one)": no effect names the run's own Champion, so the fight keeps the old event's Champion team (Lance, cut to three).
const champFight = (): Json => spar('The Champion', { boss: 'lance', size: 3, lv: 2, win: [flag('champ-won'), moment('You beat the Champion in a battle with no ceremony', 75)], lose: [moment('The Champion tested you on an open road, and you saw what the top looks like')] });
const arrives: Json[] = [
  scene('ev-champions-challenge', 'The Champion Arrives', {},
    'A quiet stretch of route, wind moving through the long grass. You hear the footsteps before you see anyone: unhurried, certain. Then the Champion is simply there on the path ahead of you, alone, unannounced, no cameras and no entourage, cape folded over one arm because the day is too warm for it. Across the field, people have stopped to stare. The Champion does not look at them. ' +
      'Champion: "I\'ve heard your name. One battle. No ceremony." A Poké Ball turns between their fingers, easy as breathing. Champion: "If you win, nothing changes. If you lose, nothing changes. I just want to see."',
    [
      ch('"Battle."', fight('The Champion nods once, as if you have answered a question. Three Poké Balls leave their hand together, and three Pokémon land on the route at full strength, the same three that guard the League. The grass flattens around them. Across the field, the watchers forget to breathe.', champFight(), flag('champ-met'))),
      ch('"Why me?"', out('The Champion tilts their head, almost amused. Champion: "Three people told me about you this week." They do not say who, and they do not need to. They look at you the way you check a story against the real thing, and your face goes warm. Then they nod, satisfied, and walk on down the route without another word.', flag('champ-met'))),
      ch('"Not yet."', out('The Champion studies you, then smiles properly for the first time. Champion: "Good answer." The Poké Ball goes away. They walk past you, close enough that you feel the air move, and lift a hand over their shoulder without looking back. They will be waiting at the League, and now you both know it.')),
    ]),
];

// ---------- C3. The Invitation ----------
const invitation: Json[] = [
  scene('ev-champions-invitation', 'The Invitation', {},
    'A courier in League colours finds you at a crossroads, out of breath, presses a heavy envelope into your hands and jogs away before you can ask anything. The seal is red wax stamped with the League crest, and the paper is so thick it barely bends. ' +
      'Inside is a single card in looping silver ink: "You are invited to an exhibition of past Champions\' teams. Bring your own. Dress optional." On the back, someone has drawn a little map in pencil, to a hall you have only ever heard about in stories.',
    [
      ch('"Go."', out('You follow the pencilled map to a pair of great bronze doors, which open before you knock. The Hall of Past Champions should not open for you yet, but the card is all the key it needs. An old caretaker reads it, raises an eyebrow and stamps it. Caretaker: "An invitation. Your first statue is on the house." No donation in the tin this time: he leads you straight to the first wing.',
        // PC6's statue fights cost a donation at the door (people-champions-1); the invitation opens the first wing directly, for free.
        room('mr-hall-champions-wing-1'), moment('The League invited you to the Hall of Past Champions'))),
      ch('"Send it back."', out('You slide the card back into its envelope, write RETURN TO SENDER across the front in your neatest letters, and drop it into the next post box you pass. Somewhere, a League clerk is going to be very confused. The road ahead is the same road it was.')),
      // TODO(engine): the ally should be the rival's own lead; `ally` takes one fixed species.
      ch('"Bring the rival."', fight('You send word, and your rival turns up at the bronze doors an hour later, out of breath and pretending they just happened to be nearby. Inside, the caretaker looks at the two of you, then at two statues standing side by side, and pulls a lever. Stone cracks, dust falls, and two Champions\' aces step down together. For once your rival is watching your back instead of your weak spots.',
        spar('Two Champion Statues', { format: 'doubles', size: 2, team: ['dragonite', 'garchomp'], ally: 'eevee', win: [moment('You and your rival beat two Champion statues together')], lose: [moment('Two Champion statues beat you and your rival, and you laughed about it after')] }), rivalTrust(1)),
        { requires: [hasRival] }),
    ]),
];

// ---------- C5. The Silent Cap ----------
const KID = 'The Kid in the Red Cap';
const kidTeam = ['pikachu', 'charmeleon', 'ivysaur'];
const capSilent = (): Json => ch('"Battle in silence."', fight('You say nothing either. You just reach for a Poké Ball, and the kid\'s eyes go huge under the cap. The whole battle passes without a word from either side, no calls and no cheers, only the wind and the sound of moves landing. When it is over, the kid nods to you once, solemnly, exactly like a real Champion would.',
  spar(KID, { team: kidTeam, size: 3, lv: -1, rule: { silent: true }, win: [moment('You beat a kid copying Red, and neither of you said a word')], lose: [moment('A kid copying Red beat you in perfect silence')] })));
const capTip = (): Json => ch('"Tip my own cap."', fight('You touch the brim of a cap you are not wearing. The kid beams so wide that the act cracks right down the middle, then remembers, and solemnly tips theirs back. The battle is fought as seriously as any League match. Afterwards they dig in a pocket and hand you a folded sheet of paper: a crayon drawing of Red on a mountain, with a Pikachu twice his size.',
  spar(KID, { team: kidTeam, size: 3, lv: -1, win: [moment('You beat the kid in the red cap')], lose: [moment('The kid in the red cap beat you, fair and square')] }), moment('A kid in a red cap gave you their drawing of Red')));
const toCapAfter = (text: string): Json => out(text, room('face-captain-cameo-after'));
const capWhisper = (): Json[] => [
  ch('"Yes."', toCapAfter('The kid makes a small noise like a kettle about to boil and has to turn round in a full circle to cope with it. The Pikachu pats their leg. When they face you again they are back in character, but their eyes are shining.')),
  ch('"He\'s very quiet."', toCapAfter('The kid nods hard, thrilled, as if you have confirmed the most important thing in the world. Kid: "I knew it." Then they straighten up and go very, very quiet, out of respect.')),
  ch('"He\'s just a person."', toCapAfter('The kid thinks about that for a long moment, frowning under the brim. Then the frown softens into something like relief. Kid: "So I could be one too." They tug the cap down again, gently this time.')),
];
const CAP_INTRO =
  'A quiet stretch of path between two hills. Someone stands in the middle of it, very still: a small figure in a red cap pulled low and a red jacket two sizes too big, hands in pockets. They say nothing. They tilt the brim, exactly so, and a Poké Ball opens. Out pops a Pikachu wearing a tiny red cap of its own, held on with string. ' +
  'It is not Red. It is a kid of about nine who has watched every recording of Red there is, copying him perfectly. Their lip is trembling with the effort of not speaking. The Pikachu looks up at its trainer, then at you, as if apologising in advance.';
const capWhisperVariant = (id: string, key: string): Json =>
  variant(id, [is(key)], {
    intro: `${CAP_INTRO} Then the kid looks left, and right, and leans in, and whispers so quietly that nobody else on the whole empty path could possibly hear. Kid: "Did you meet him? Was he cool?"`,
    hide: [0, 1, 2],
    add: capWhisper(),
  });
const silentCap: Json[] = [
  scene('face-captain-cameo', 'The Silent Cap', {
    remembers: [capWhisperVariant('met-red-battled', 'red-battled'), capWhisperVariant('met-red-sat', 'red-sat')],
  }, CAP_INTRO, [
    capSilent(),
    ch('"Say hi."', out('You say hi. The kid holds out for two heroic seconds. Kid: "...Hi." Then it all comes out at once, in one breath, the cap pushed back and the whole face lit up. Kid: "I\'m being Red can you tell I\'m being Red" The Pikachu sighs and sits down. You promise them you could absolutely tell.')),
    capTip(),
  ]),
  scene('face-captain-cameo-after', 'The Silent Cap: The Brim Tilts', { room: true, group: 'Famous Faces', rarity: 'rare', cast: ['boss.red-masters'], tint: '#1e1e2e', requires: [] },
    'The kid tugs the brim back down and goes silent again, but the act sits easier on them now, and the Pikachu is grinning. They take one step back and hold up a Poké Ball, waiting to see what you will do.',
    [capSilent(), capTip()]),
];

// ---------- C6. The Landmark Delves: The Tower ----------
const DELVE = { group: 'Landmark Dungeons', rarity: 'rare', requires: [] as Json[] };
const towerRoom = (name: string): string => `dungeon-pokemon-tower-${name}`;
const TOWER = { ...DELVE, types: ['ghost'], tint: '#1a1030', effect: 'shake' };
const tower: Json[] = [
  scene('dungeon-pokemon-tower', 'The Tower', {},
    'A tall grave-tower rises over the town like a finger pointing at the sky. Inside, thin candles burn on every step, hundreds of them, and the air smells of wax and old flowers. Voices drift down the stairwell, though you cannot see who is speaking. Three floors, each with a trainer who won\'t leave. ' +
      'On the first floor, between rows of small stone markers, a Channeler in a white robe kneels before one stone with a Growlithe carved on it. She looks up slowly, as if waking. Channeler: "I came to visit my Growlithe. I\'ve been here a year."',
    [
      ch('"Battle."', fight('The Channeler rises without a word, and her ghosts rise with her, pale shapes unfolding out of the candle smoke. She fights like someone who has forgotten there is anything else to do. When it is over she sits back down beside the stone, and you climb past her to the second floor.',
        spar('Channeler', { types: ['ghost'], size: 2, win: [moment('You beat a Channeler in the Pokémon Tower')], lose: [moment('A Channeler\'s ghosts beat you in the Pokémon Tower')] }), room(towerRoom('floor-2')))),
      ch('"Help her go home."', out('You sit down beside her on the cold floor. For a long time she talks about the Growlithe: how it chased the post van, how it slept across the doorway, how warm it was. You listen to all of it. When she runs out of words she touches the carved stone, says goodbye properly, and walks down the stairs into daylight for the first time in a year. You climb on.',
        moment('You helped a Channeler leave the Pokémon Tower'), room(towerRoom('floor-2')))),
    ]),
  scene(towerRoom('floor-2'), 'The Tower: The Second Floor', { ...TOWER, room: true },
    'The second floor is colder. A boy of about ten sits on the top step with his knees drawn up, and in his arms a small Cubone is crying, a thin, worn-out sound that echoes off every stone. Its bone club lies forgotten at his feet. Ro: "My Cubone won\'t stop crying. Its mother\'s here somewhere."',
    [
      ch('"Find the mother."', out('You and Ro search the second floor row by row, reading every name on every stone while the Cubone hiccups in his arms. Nothing. Then, from above, a sound: a low, hollow knock, bone on stone. The Cubone goes silent and stares up the stairs. All three of you climb.', room(towerRoom('floor-3')))),
      ch('"Comfort the Cubone."', out('You kneel and hold out a hand. The Cubone flinches, then leans its skull helmet into your palm, and the crying slows to small shuddering breaths. Ro stares. Ro: "It never lets anyone do that." Then a hollow knock sounds from the top floor, and the Cubone lifts its head. You climb together.',
        flag('ptower-comforted'), room(towerRoom('floor-3')))),
    ]),
  scene(towerRoom('floor-3'), 'The Tower: The Top Floor', {
    ...TOWER, room: true,
    remembers: [variant('comforted', [is('ptower-comforted')], { notice: 'The Cubone walks on its own feet now, holding on to the hem of your jacket instead of Ro\'s arm.' })],
  },
  'The top floor is open to the sky, and the candles gutter in the wind. At the far end, before a plain grey stone, stands a Marowak, or what is left of one: pale and see-through, its bone club raised. It is guarding the stone. When it sees the Cubone, the club wavers.',
  [
    ch('"Battle it."', fight('The ghost drops into a guard and swings. It fights with everything it has, not to win but to keep you from the stone. When the battle ends it sinks back into the grey stone like water into sand, and the Cubone stands quietly where it stood. Ro carries it home in his arms.',
      spar('The Marowak\'s Ghost', { team: ['marowak'], size: 1, win: [moment('You laid the Marowak\'s ghost to rest in the Pokémon Tower')], lose: [moment('The Marowak\'s ghost held the top of the Tower against you')] }))),
    ch('"Let the Cubone go to it."', out('Ro sets the Cubone down. It walks across the floor on unsteady legs, all the way to the ghost, and stops. The Marowak looks at it for a long time. Then it lowers its club, reaches out and touches the Cubone\'s head, gently, once. It fades like breath on a cold window. The Cubone stops crying.', room(towerRoom('marowak')))),
  ]),
  // The Lonely Cubone, merged (C6 The Marowak).
  scene(towerRoom('marowak'), 'The Tower: The Lonely Cubone', { ...TOWER, room: true },
    'The Cubone stands alone in front of the grey stone, perfectly quiet, holding its bone club again. Ro wipes his face on his sleeve. Then the Cubone turns and looks at you, and then at Ro, as if it is waiting for someone to decide.',
    [
      ch('"Take Cubone."', out('Ro\'s chin wobbles, but he nods. Ro: "It looked at you first." The Cubone walks over and taps its club against your boot, once, like knocking on a door. It is coming with you.', join({ species: ['cubone'] }), moment('A Cubone from the Pokémon Tower joined you', 70))),
      ch('"Give it to Ro."', out('You shake your head and nudge the Cubone back toward the boy. It runs to him, and he scoops it up, laughing and crying at once. On the way down the stairs he presses something heavy into your hands: a polished Thick Club. Ro: "It was its mother\'s. We want you to have it."', item('thick-club'), moment('You gave the Cubone back to Ro, and he gave you a Thick Club'))),
    ]),
];

// ---------- C6. The Landmark Delves: The Power Plant ----------
const plantRoom = (name: string): string => `dungeon-power-plant-${name}`;
const PLANT = { ...DELVE, types: ['electric'], tint: '#2a2810', effect: 'shake' };
// TODO(engine): Legendary Blessings (Signs and Influence) are not built; a Sign and "+2" are flags for now.
const plant: Json[] = [
  scene('dungeon-power-plant', 'The Power Plant', {},
    'A power plant gone quiet, its fences rusted and its windows dark, humming anyway. Somewhere deep inside the generators still turn, and the corridors are lit only by sparks jumping between the cables. Three halls, three guards. ' +
      'In the first hall a guard in a hard hat stands very still, sweating, a Poké Ball held out at arm\'s length. Beside him an Electrode is glowing brighter and brighter, twitching, nearly exploding every few seconds and then, with a shudder, not. Guard: "Don\'t. Make. Sudden. Moves."',
    [
      ch('"Battle."', fight('The guard swallows hard and points at you. The Electrode rolls forward, crackling, and the battle is fast and loud and very bright. At least it spends its charge on the battle instead of the building. Afterwards the guard sags with relief and waves you through to the second hall.',
        spar('Plant Guard', { team: ['electrode', 'voltorb'], size: 2, win: [moment('You beat the guard of the Power Plant')], lose: [moment('The Power Plant guard\'s Electrode lit up the whole hall')] }), room(plantRoom('hall-2')))),
      ch('"Calm the Electrode."', out('You crouch, slowly, and talk to the Electrode the way you would to a frightened animal: low, steady, meaningless words. Its glow pulses, flickers and fades to a sleepy hum. The guard lets out a breath he has been holding for an hour and waves you through to the second hall.', room(plantRoom('hall-2')))),
    ]),
  scene(plantRoom('hall-2'), 'The Power Plant: The Second Hall', { ...PLANT, room: true },
    'The second hall is alive with sparks. A swarm of Magneton hangs in the air between you and the far door, a slow spinning cloud of steel and static, and every cable on the walls crackles in time with them. The hair on your arms stands up.',
    [
      ch('"Push through."', out('You put your head down and run. Sparks snap at your heels, a Magneton swings past close enough to taste the metal, and then you are through the far door, breathing hard, everyone in one piece.', room(plantRoom('hall-3'))),
        { chance: 0.9, fail: out('You put your head down and run, and nearly make it. A last arc of static leaps from the swarm and catches your lead square in the back. It staggers through the far door, paralysed and twitching.', statusLead('paralysis'), room(plantRoom('hall-3'))) }),
      ch('"Use a Ground-type."', out('You send out your Ground-type and walk it ahead of you down the middle of the hall. The sparks bend toward it and vanish into it harmlessly, again and again, as if it were drinking them. The Magneton drift aside, baffled, and you reach the far door without a single shock.', room(plantRoom('hall-3'))),
        { requires: [ptype('ground')] }),
    ]),
  scene(plantRoom('hall-3'), 'The Power Plant: The Control Room', { ...PLANT, room: true },
    'The third hall is the control room. Every screen is dark, and the air smells of ozone and burnt dust. On the control desk, among the dead switches, lies a single golden feather as long as your arm, still crackling with tiny blue sparks. The windows behind it are scorched in the shape of a great bird.',
    [
      ch('"Take it."', out('You pick it up. The feather crackles against your palm, warm and alive, and every light in the plant flickers on for one second, then off again. Far away, thunder rolls across a clear sky. Zapdos knows you have it: a Zapdos Sign.', flag('legend-zapdos-sign'), moment('You took a Zapdos feather from the Power Plant', 70))),
      ch('"Leave it."', out('You leave the feather where it lies. As you step out into the evening, a shadow passes overhead, huge and jagged, and you look up in time to see Zapdos itself wheel once above the chimneys in a crown of lightning. Then it is gone. It saw you leave its feather, and it will remember.', flag('legend-zapdos-influence', 2), moment('You saw Zapdos above the Power Plant', 70))),
    ]),
];

// ---------- C6. The Landmark Delves: Seafoam Depths ----------
const seaRoom = (name: string): string => `dungeon-seafoam-depths-${name}`;
const SEA = { ...DELVE, types: ['ice', 'water'], tint: '#102838', effect: 'shake' };
const seafoam: Json[] = [
  scene('dungeon-seafoam-depths', 'Seafoam Depths', {},
    'Caves of ice and surf under the sea cliffs. The floor slides under your boots, the tide pulls at the lower passages, and cold-loving trainers wait on each ledge with their breath smoking. Three chambers. ' +
      'The first is a long sheet of blue ice crossed by a rushing current of seawater, the exit somewhere on the far side. Frozen boulders sit at the edges like spectators.',
    [
      ch('"Slide."', out('You push off and steer, leaning left, leaning right, your team sliding behind you in a laughing line. You stop exactly at the far exit, which surprises you more than anyone. The second chamber is waiting.', room(seaRoom('chamber-2'))),
        { prompt: { id: 'tilt-drag', needs: 'good' }, fail: out('You push off, misjudge the first turn, spin, and slide round the whole cave twice before you bump to a stop near the exit, dizzy and soaked. Your team thinks it was the best thing that ever happened. On to the second chamber.', room(seaRoom('chamber-2'))) }),
      ch('"Push a boulder to stop the current."', out('You and your strongest Pokémon put your shoulders to a frozen boulder and heave. It groans, scrapes, and tips into the channel with an enormous splash. The current breaks around it and slows to a trickle, and you walk across the ice like a road to the second chamber.', room(seaRoom('chamber-2')))),
    ]),
  scene(seaRoom('chamber-2'), 'Seafoam Depths: The Ice Slope', { ...SEA, room: true },
    'The second chamber opens onto a wide frozen slope with a dark pool at the bottom. A Skier in a bright orange jacket leans on her poles beside a Lapras that seems to be wearing a saddle. She pushes her goggles up and grins. Skier: "Ever skied on a Lapras?"',
    [
      ch('"Battle."', fight('The Skier snaps her goggles down. Her Lapras slides into place and the ice rings with every move. When it is over she points you to steps cut into the ice, down toward the third chamber.',
        spar('Skier', { team: ['lapras', 'cloyster'], size: 2, win: [moment('You beat a Skier in the Seafoam Depths')], lose: [moment('A Skier and her Lapras beat you on the ice')] }), room(seaRoom('chamber-3')))),
      ch('"Ski."', out('You climb onto the Lapras behind the Skier, and it launches down the slope like a sled, faster than anything should go on ice. You shoot past three ledges and through a tunnel you would never have found, and come out at the bottom laughing and shaking, already far ahead of where you should be.', ferry(), room(seaRoom('chamber-3')))),
    ]),
  scene(seaRoom('chamber-3'), 'Seafoam Depths: The Frost Wings', { ...SEA, room: true },
    'The third chamber is silent. Cold air pours down from a hole high in the ceiling, colder than anything else in the caves, and frost covers every surface: the walls, the stones, your own sleeves. All of it has grown in the shape of wings.',
    [
      ch('"Look up."', out('You tip your head back and look up through the hole. For one breath, high above, something vast and pale blue crosses the circle of sky, trailing snow that glitters in the sun. A single frost-white feather drifts down into your hands and does not melt: an Articuno Sign.', flag('legend-articuno-sign'), moment('An Articuno feather fell to you in the Seafoam Depths', 70))),
      ch('"Leave a Berry."', out('You take a Berry from your bag and set it on a ledge under the hole, where the frost is thickest. Nothing happens. Then, as you turn to go, the cold air from above grows gentle, almost warm, and the frost wings on the walls glitter as if something far above has noticed you, and approves.', flag('legend-articuno-influence', 2), moment('You left a Berry for Articuno in the Seafoam Depths'))),
    ]),
];

// ---------- Part D: a three-stage trainer story ----------
/**
 * Flags `<key>-<name>`; `m1`, `m2` and `done` drive the story. Stage 2 waits one region after `m1`, stage 3 one region after `m2`
 * (both are set with `flagAt`). Ids are the old `<base>-s1..-s3`, so the old placement carries over.
 */
function story(key: string, base: string, who: string) {
  const k = (n: string): string => `${key}-${n}`;
  const id = (s: 1 | 2 | 3): string => `${base}-s${s}`;
  const old = oldOf(id(1));
  return {
    k,
    id,
    set: (n: string, amount = 1): Json => flagAt(k(n), amount),
    is: (n: string): Json => is(k(n)),
    roomId: (n: string): string => `${base}-${n}`,
    stage(s: 1 | 2 | 3, title: string, intro: string, choices: Json[], remembers?: Json[]): Json {
      const gate = s === 1 ? [not(k('m1'))] : s === 2 ? [flagAgo(k('m1'), 1), not(k('m2'))] : [flagAgo(k('m2'), 1), not(k('done'))];
      return scene(id(s), `${who}: ${title}`, { requires: gate, ...(s > 1 ? { callback: true } : {}), ...(remembers ? { remembers } : {}) }, intro, choices);
    },
    room(n: string, title: string, intro: string, choices: Json[], remembers?: Json[]): Json {
      return scene(`${base}-${n}`, `${who}: ${title}`, { room: true, group: old.group as string, rarity: 'uncommon', requires: [], ...(remembers ? { remembers } : {}) }, intro, choices);
    },
  };
}

// ---------- D1. The Travelling Trainer ----------
const T = story('travel', 'ovc-traveling-trainer', 'The Travelling Trainer');
const BRY = 'Traveller Bryony';
const bryThree = ['pidgeotto', 'growlithe', 'ivysaur'];
const bryEvolved = ['pidgeot', 'arcanine', 'venusaur'];
const bryM1 = (): Json => spar(BRY, { team: bryThree, size: 3, win: [T.set('won'), moment('You beat Bryony\'s three')], lose: [moment('Bryony\'s three were all she needed')] });
// If lost: "Same three" (the ledger: cocky, +2 levels). If won: evolved, "with a counter".
const bryM2Lost = (): Json => spar(BRY, { team: bryThree, size: 3, lv: 2, win: [moment('You beat Bryony\'s same three again')], lose: [moment('Bryony\'s same three beat you twice')] });
// TODO(engine): "a counter to the player's most-used type": the run does not track it, and `counter` reads one fixed type against the lead.
const bryM2Won = (): Json => spar(BRY, { team: bryEvolved, size: 3, lv: 1, win: [moment('You beat Bryony\'s evolved team')], lose: [moment('Bryony\'s evolved team took its revenge')] });
const travel: Json[] = [
  T.stage(1, 'Three\'s All I Need',
    'A dusty crossroads with a signpost leaning every which way. A trainer sits on a battered rucksack beneath it, her boots worn through at the toes and her map folded and refolded until it has gone soft as cloth. Three Poké Balls hang on her belt, and only three. She looks you up and down, counting your team at a glance. Bryony: "Three\'s all I need. Fight me."',
    [
      ch('"Battle."', fight('Bryony is on her feet before you finish nodding. A Pidgeotto, a Growlithe and an Ivysaur, and she knows exactly where each of them will be before they get there.', bryM1(), T.set('m1'))),
      ch('"Only three?"', fight('Bryony pats each Poké Ball on her belt in turn, like checking on sleeping children. Bryony: "Three I know, not six I don\'t." Then she stands, the three come out, and you find out exactly how well she knows them.', bryM1(), T.set('m1'))),
      ch('"Pass."', out('You shake your head and walk on. Bryony shrugs and goes back to her map. The road is long, and she is in no hurry.')),
    ]),
  T.stage(2, 'Back for More',
    'Bryony again, on a different road, with the same rucksack and the same soft map. She spots you from a long way off and grins, and her three Poké Balls are exactly where they were, not one more. She looks very pleased with herself. Bryony: "Back for more? Same three. Didn\'t need to change."',
    [
      ch('"Battle."', fight('The same three come out, a little stronger and a lot cockier, as if beating you once taught them they could do it again.', bryM2Lost(), T.set('m2'))),
      ch('"How did you know my type?"', fight('Bryony taps the side of her nose. Bryony: "I watched." Then the same three come out, stronger than you remember.', bryM2Lost(), T.set('m2'))),
    ],
    [
      variant('won', [T.is('won')], {
        intro: 'Bryony again, on a different road, and something about her has changed. She is standing instead of sitting, and her Pokémon have grown: a Pidgeot on her shoulder, an Arcanine at her heel, a Venusaur blocking half the road. They look at your team as if they remember it. Bryony: "I evolved them. And I added something for that favourite type of yours."',
        hide: [0, 1],
        add: [
          ch('"Battle."', fight('Bryony\'s grown team comes at you all at once, and every one of them has been training for exactly this.', bryM2Won(), T.set('m2'))),
          ch('"How did you know my type?"', fight('Bryony taps the side of her nose. Bryony: "I watched." Every battle you fought since the crossroads, she was somewhere in the crowd. Then her evolved team steps forward.', bryM2Won(), T.set('m2'))),
        ],
      }),
    ]),
  T.stage(3, 'Six Now',
    'Bryony is waiting for you this time, sitting on a stone wall at the edge of a town and swinging her boots. There are six Poké Balls on her belt. She hops down and holds them up one at a time, introducing each by name with a small proud smile. Bryony: "Six now. I know all six. You taught me to."',
    [
      ch('"Battle."', fight('Six against six, and it is the best battle either of you has had in weeks. Bryony calls every move like she has known these six all her life. When it is over she crosses the field and shakes your hand, hard, two pumps, like sealing a deal.',
        spar(BRY, { team: [...bryEvolved, 'lapras', 'jolteon', 'machamp'], size: 6, lv: 1, win: [moment('You beat Bryony\'s full team, and she shook your hand')], lose: [moment('Bryony\'s six beat you, and she shook your hand anyway')] }), T.set('done'))),
      ch('"Travel together a while."', out('Bryony grins and swings her rucksack onto her shoulder. Bryony: "Thought you\'d never ask." For the rest of the region she walks beside you, map in hand, arguing about routes and fighting at your side whenever a battle calls for two.', companion(3), T.set('done'))),
    ]),
];

// ---------- D2. The Crossroads Duelist ----------
const D = story('teshe', 'ovc-crossroads-duelist', 'The Crossroads Duelist');
const tesheDuel = (): Json => spar('Duelist Teshe', { team: ['gallade'], size: 1, rule: { noSwitch: true }, win: [moment('You won Teshe\'s one-on-one duel at the crossroads')], lose: [moment('Teshe\'s Gallade won the duel at the crossroads')] });
const sisters: Json[] = [
  D.stage(1, 'The Custom',
    'Four roads meet at a stone marker worn smooth by hands. A duelist stands on top of it, a young woman in a long grey coat with a single Poké Ball at her hip and the stillness of someone who has stood there a long time. She steps down as you come near and blocks the way, not unkindly. Teshe: "One Pokémon. One battle. That\'s the custom here."',
    [
      ch('"Accept."', fight('Teshe nods, satisfied, and lets her Gallade out. It bows to your lead before the duel, and your lead, a little startled, bows back. Then neither of them holds anything back.', tesheDuel(), D.set('m1'))),
      ch('"Whose custom?"', fight('Teshe: "Mine. I made it up. It\'s still a custom." She says it with a perfectly straight face, and then the corner of her mouth twitches. You accept. Her Gallade steps out and bows.', tesheDuel(), D.set('m1'))),
      ch('"Go round."', out('You leave the road and go the long way round, through brambles, across a stream and over a field of very opinionated Tauros. It costs you the better part of a day. When you look back from the far hill, Teshe is still standing on her stone, watching you go.', takeNode(1))),
    ]),
  D.stage(2, 'Two on Two',
    'The crossroads again. Teshe waits on her stone, but she is not alone: across the junction, as far from her as the roads allow, a second woman in a grey coat leans on the other marker with her arms folded. Same coat. Same jaw. Not looking at each other. ' +
      'Teshe: "Two on two. Bring your rival. I\'ll bring mine." She tilts her head at the other woman without turning. Slowly you understand: Teshe\'s rival is her sister, and her sister will not speak to her.',
    [
      // TODO(engine): the ally should be the rival's own lead; `ally` takes one fixed species.
      ch('"Bring my rival."', fight('Your rival turns up within the hour, and inside five minutes they and Teshe\'s sister are getting on famously, swapping stories and laughing at the same jokes, which makes both duelists absolutely furious. The tag battle that follows is fought with real heat on one side and real giggling on the other.',
        spar('Teshe and Her Sister', { format: 'doubles', size: 2, team: ['gallade', 'gardevoir'], ally: 'eevee', win: [moment('You and your rival beat Teshe and her sister')], lose: [moment('Teshe and her sister beat you and your rival, together')] }), D.set('m2')),
        { requires: [hasRival] }),
      // "A handicap battle": the two sisters field four Pokémon between them against you alone.
      ch('"Fight alone."', fight('You step into the junction alone. Teshe and her sister glance at each other for the first time, a flicker, and send out four Pokémon between them. Two trainers against one, and they fight better together than either would ever admit.',
        spar('Teshe and Her Sister', { format: 'doubles', size: 4, team: ['gallade', 'gardevoir', 'medicham', 'hitmonlee'], win: [moment('You beat both duelists alone')], lose: [moment('Two duelists against one was too much, even for you')] }), D.set('m2'))),
      ch('"Why won\'t she speak to you?"', out('Teshe is quiet for a long moment. Teshe: "I left home for the crossroads." She says it to her boots. Across the junction, her sister has stopped pretending not to listen. There is room, just about, for someone to carry a word between them.', D.set('m2'), room(D.roomId('broker')))),
    ]),
  D.room('broker', 'Between Sisters',
    'You walk across the junction to the sister. Up close she looks tired, and younger than Teshe. She is looking over your shoulder at her sister, not at you. Sister: "She left without saying goodbye. She just went."',
    [
      ch('"She misses you."', out('The sister\'s face does something complicated. She walks across the crossroads, slowly, and stops one step short of Teshe. Nobody says anything. Then Teshe says something too quiet to hear, and her sister laughs, wet and surprised.', D.set('brokered'))),
      ch('"Tell her yourself."', out('The sister glares at you, then at Teshe. Then she marches across the junction and tells her, at length and at volume, exactly what she thinks of people who leave without a word. Teshe listens to every bit of it. When it is over they are standing much closer.', D.set('brokered'))),
    ]),
  D.stage(3, 'Going Home',
    'The crossroads, early morning. Teshe is not on her stone. She sits on a packed bag beside it with her coat buttoned to the chin, and stands as soon as she sees you, as if she has been waiting a while. Teshe: "I\'m going home. My sister asked. Take this." She holds out a Choice Band, its grey cloth worn soft from years on her Gallade.',
    [
      ch('"Thank you."', out('You take the Band. Teshe nods, once, the same nod she gave you before the first duel. Then she shoulders her bag and walks down the road home, and does not look back, and does not need to.', item('choice-band'), D.set('done'))),
      ch('"Keep the custom going."', out('Teshe looks at you for a long moment. Then, very formally, she steps aside and gestures at the stone. Teshe: "Then it\'s yours. One Pokémon. One battle." She knots the Band round your wrist herself. From today, you are the crossroads duelist.',
        item('choice-band'), moment('Teshe named you the new crossroads duelist', 70), D.set('done'))),
    ],
    [variant('brokered', [D.is('brokered')], { notice: 'Her sister waits a little way down the home road with two bags of her own. Teshe catches you noticing and almost smiles. Teshe: "You started that."' })]),
];

// ---------- D3. The Mirror Trainer ----------
const V = story('ves', 'ovc-mirror-trainer', 'The Mirror Trainer');
const VES = 'Mirror Trainer Ves';
/**
 * "An honest trade of same-type Pokémon": for every species, the nearest in base stat total with the same types (else the same first
 * type), never a legendary, a mythical, a Mega or a Gigantamax form. Built once from the species data.
 */
const SAME_TYPE_SWAP: Record<string, string> = (() => {
  const all = JSON.parse(readFileSync(pathJoin(import.meta.dirname, '../../../src/data/species.json'), 'utf8')) as { id: string; types: string[]; tags: string[]; baseStats: Record<string, number> }[];
  const bst = (s: { baseStats: Record<string, number> }): number => Object.values(s.baseStats).reduce((a, b) => a + b, 0);
  const pool = all.filter((s) => !s.tags.includes('legendary') && !s.tags.includes('mythical') && !/-(mega|gmax)/.test(s.id));
  const table: Record<string, string> = {};
  for (const s of all) {
    const same = pool.filter((o) => o.id !== s.id && o.types.join('/') === s.types.join('/'));
    const near = same.length > 0 ? same : pool.filter((o) => o.id !== s.id && o.types[0] === s.types[0]);
    const pick = near.sort((a, b) => Math.abs(bst(a) - bst(s)) - Math.abs(bst(b) - bst(s)) || a.id.localeCompare(b.id))[0];
    if (pick) table[s.id] = pick.id;
  }
  return table;
})();
const vesSwap: Json = { kind: 'tradeFor', want: { label: 'a Pokémon of yours' }, table: SAME_TYPE_SWAP };
// TODO(new item): "their lead's twin-type held item" (the type-boosting item for the lead's type): no effect picks an item by the lead's type.
const vesOwed = flag('ves-owed-type-item');
const mirror: Json[] = [
  V.stage(1, 'Same Types',
    'A still lake on a windless day, the water so flat it holds the whole sky. A trainer stands at the edge, about your age and about your height, and when you look at their belt your stomach gives a small strange turn: their team is yours, type for type, in the same order. Ves looks just as unsettled. Ves: "Same types. Different choices. Let\'s see."',
    [
      ch('"Battle."', fight('Ves sends out the first one, and it is your lead\'s mirror image, standing on the shore like a reflection that climbed out of the lake. Every move you think of, it seems to think of too.',
        spar(VES, { mirror: true, win: [moment('You won a mirror battle against Ves')], lose: [moment('Ves beat you with your own reflection')] }), V.set('m1'))),
      ch('"Did you copy me?"', fight('Ves shakes their head quickly. Ves: "No. We\'re just alike. It\'s unnerving." They rub the back of their neck, exactly the way you do. Then the battle: a mirror match neither of you can quite read.',
        spar(VES, { mirror: true, win: [moment('You won a mirror battle against Ves')], lose: [moment('Ves beat you with your own reflection')] }), V.set('m1'))),
      ch('"Walk on."', out('You walk on along the shore. When you glance back, Ves is watching you go, and in the still water their reflection and yours stand side by side.')),
    ]),
  V.stage(2, 'The Other Thing',
    'Ves is back, and they have been busy. Their notebook is full of diagrams, and they look at your team like a puzzle they have nearly solved. Their own Pokémon have grown stronger since the lake. Ves: "I\'ve been thinking about what you\'d do. Then doing the other thing."',
    [
      // TODO(engine): "They play the opposite of the player's habits (if the player always leads with X, they counter X)": no foe reads your habits; the mirror is stronger.
      ch('"Battle."', fight('Ves sends out the mirror of your lead again, stronger now, and you can see them trying every turn to do the opposite of whatever you would do. It is like fighting your own habits turned inside out.',
        spar(VES, { mirror: true, lv: 1, win: [moment('You beat Ves, even turned inside out')], lose: [moment('Ves did the other thing, and it worked')] }), V.set('m2'))),
      ch('"Let\'s swap a Pokémon."', out('Ves holds out a Poké Ball, hesitates, then holds it out properly. You both open your hands at the same moment, and the two Pokémon change places in plain sight: same type, different trainers, nothing hidden. Ves: "Honest trade. Look after mine."', vesSwap, V.set('m2'))),
    ]),
  V.stage(3, 'Last Time',
    'The still lake again, at dusk this time, the water gone gold. Ves stands exactly where they stood the first day, notebook closed, hands empty. Ves: "Last time. No tricks. Same as you, as best I can."',
    [
      // TODO(engine): "A full mirror": `mirror` copies your lead only.
      ch('"Battle."', fight('No diagrams and no counters: just your lead and its mirror, face to face on the shore with the gold water behind them. If you win, Ves has a held item ready for you, made for your lead\'s own type.',
        spar(VES, { mirror: true, lv: 1, win: [vesOwed, moment('You won the last mirror battle, and Ves gave you a held item for your lead\'s type')], lose: [moment('Ves won the last mirror battle by a hair')] }), V.set('done'))),
      ch('"Call it a draw."', out('You both start laughing at the same moment, which only makes it worse. Ves: "A draw, then." They give you the item anyway: a held item made for your lead\'s own type, chosen with care from a pouch full of them.', vesOwed, V.set('done'))),
    ]),
];

// ---------- D4. The Silver Trainer ----------
const G = story('galen', 'ovc-silver-trainer', 'The Silver Trainer');
const galen: Json[] = [
  G.stage(1, 'Your Strongest',
    'The road narrows between two standing stones, and between them waits a figure in full silver armour, plate on plate, visor down, gleaming even under cloud. It does not move as you approach. A gauntleted hand rises and points past you, at your belt. The voice inside the helm is hollow and clipped. The Silver Trainer: "Your strongest. Only."',
    [
      // TODO(engine): "Your strongest" should fight: no rule fields your strongest Pokémon, so the duel takes your lead (one against one, no switching).
      ch('"Send my strongest."', fight('You put your strongest at the front. The armoured figure nods, approving, and its answer steps out from behind a standing stone: a Metagross, silver as the armour, four legs ringing on the road. One against one, and nobody holds back.',
        spar('The Silver Trainer', { team: ['metagross'], size: 1, rule: { noSwitch: true }, win: [moment('Your strongest beat the Silver Trainer\'s Metagross')], lose: [moment('The Silver Trainer\'s Metagross beat your strongest')] }), G.set('m1'))),
      ch('"Send another."', out('You reach for a different Poké Ball. The visor turns toward it, then back to you, and the voice goes flat with disappointment. The Silver Trainer: "That\'s not your strongest." The armour turns, clanking, and walks away down the road without looking back.')),
      ch('"Refuse."', out('You shake your head. The armoured figure stands there a long moment, then lowers its hand and steps aside, silent, to let you pass.')),
    ]),
  G.stage(2, 'Under the Visor',
    'The silver armour again, on a different road, but something is wrong with it: a long crack runs down the breastplate and the visor hangs open on one broken hinge. Under it is a face, very old and deeply lined, a white beard tucked into the collar. The old man flinches when he sees you looking and tries to push the visor shut, and it will not stay. ' +
      'You know that face from the old League books. He was a Champion before your parents were born, and he has been hiding it because he is ashamed of how old he is. Galen: "I only fight the strong ones now. To be sure I still can."',
    [
      ch('"You still can."', fight('Galen\'s eyes go bright behind the broken visor. He calls out his Metagross, then a Skarmory, then a Steelix, and he is good, properly good: patient, precise, reading your team three moves ahead. Whatever age has taken from him, it has not taken this.',
        spar('Galen', { team: ['metagross', 'skarmory', 'steelix'], size: 3, lv: 1, win: [moment('You beat Galen, a Champion from long ago, and he was good')], lose: [moment('Galen proved he still can')] }), G.set('m2'))),
      // TODO(engine): the weakest should fight; the battle takes your lead, and the weakest gets the level.
      ch('"Fight my weakest."', fight('You choose your weakest Pokémon. Galen hesitates, looking at it, and something in his face softens. Then he battles it gently with his oldest Pokémon, never cruel, always one step slower than he could be, showing each move before he uses it. By the end your weakest stands straighter, and it has learned more in ten minutes than in ten battles.',
        spar('Galen', { team: ['metagross'], size: 1, lv: -3, win: [moment('Galen gave your weakest Pokémon a lesson')], lose: [moment('Galen gave your weakest Pokémon a gentle lesson')] }), weakestLevel, G.set('m2'))),
      ch('"Take the armour off."', out('You ask him to take it off. Galen looks at you for a long time. Then, piece by piece, he does: the cracked helm, the gauntlets, the heavy plates, until he stands on the road in a plain shirt, an old man in the sun. He breathes, deep and slow, as if he has not breathed in years. He looks younger.', G.set('m2'), G.set('unmasked'))),
    ]),
  G.stage(3, 'I\'d Rather Watch',
    'Galen sits on a fence by the road with no armour at all, just a coat and a walking stick, his Metagross resting in the grass beside him like a sleeping dog. He lifts a hand when he sees you, and his smile is easy. Galen: "I\'m done fighting to prove it. I\'d rather watch."',
    [
      // TODO(engine): "He watches the player's next battle and claps": no effect ties a scene to the next battle; the flag records it.
      ch('"Watch me battle."', out('Galen follows you to your next battle and sits on a crate at the edge of it with his stick across his knees, watching every move with bright, sharp eyes. When it is over he claps, slowly and loudly, the only person in the whole place doing it, and he does not care who sees.',
        flag('galen-watching'), moment('Galen, a Champion from long ago, clapped for your battle', 70), G.set('done'))),
      // "He becomes a mentor option for future runs" is cross-run: not built (the flag is the doc's `mentor.galen`).
      ch('"Teach instead."', out('Galen turns his stick in his hands for a long time. Then he nods. Galen: "The long game. Nobody teaches that anymore." He writes in a little book and tears out the page for you: a list of things never to rush. Somewhere out there, a new student is going to be very lucky.',
        flag('mentor-galen'), moment('Galen decided to teach the long game', 70), G.set('done'))),
    ],
    [variant('unmasked', [G.is('unmasked')], { notice: 'The silver armour is nowhere to be seen. Galen catches you looking for it and laughs. Galen: "Sold it. Bought a fence to sit on."' })]),
];

// ---------- D5. The Glass Trainers ----------
const GL = story('glass', 'ovc-glass-trainers', 'The Glass Trainers');
const GLASS = 'The Glass Trainers';
const glassFive = (text: string): Json => fight(text,
  spar(GLASS, { size: 1, chain: 3, win: [room(GL.roomId('last-two'))], lose: [room(GL.roomId('last-two'))] }), GL.set('m2'));
const glassOne = (text: string): Json => fight(text,
  spar('The Glass Trainer Who Waved', { size: 3, win: [moment('You gave a glass trainer one battle that counts')], lose: [moment('The glass trainer who waved finally won one')] }), GL.set('m2'));
const FIVE_TEXT = 'All five step up, one after another. Each battle is short and fierce, and each glass trainer fights as if it were the last battle of their life, because in a way it was. The first three come back to back.';
const ONE_TEXT = 'The others step back, and the one who waved comes forward alone. Behind her the other four start to cheer, glass hands clapping without a sound and then with one, louder and louder, until the whole road rings with it.';
const glass: Json[] = [
  GL.stage(1, 'Across the Field',
    'A wide field of long grass in the late afternoon, the light coming in low and gold. On the far side, along the treeline, stand five trainers, and the sun goes straight through them. They are translucent, like figures made of glass, each with a Pokémon at their side just as clear. They don\'t move. They are watching you. Then one of them, the smallest, lifts a hand and waves.',
    [
      ch('"Wave back."', out('You wave back. For a moment nothing happens. Then all five of them wave together, some shyly and some with their whole arms, and their glass Pokémon bob and hop beside them. When you look again they are still watching, but it feels friendlier now.', GL.set('m1'), GL.set('waved'))),
      ch('"Walk over."', out('You start across the field toward them. As you come close they step back, all five at once, politely, the way people make room on a crowded path. However far you walk, the gap stays the same. You stop. They stop. One of them gives you a small, apologetic shrug.', GL.set('m1'))),
      ch('"Ignore them."', out('You turn away and walk on. When you look over your shoulder an hour later, they are there: five glass figures at the edge of sight, following at a distance. They are still there at sunset. They never come closer.', GL.set('m1'), GL.set('followed'))),
    ]),
  GL.stage(2, 'One Battle That Counts',
    'The five glass trainers wait in the middle of the road this time, close enough to touch, close enough to see the light bend through their faces. Their Pokémon are as clear as water. The one who waved steps forward, and her voice sounds as if it comes from very far away. Glass trainer: "We\'re the ones who didn\'t make it to the League. Every year, five. We\'d like one battle that counts."',
    [
      ch('"Battle all five."', glassFive(FIVE_TEXT)),
      ch('"Battle the one who waved."', glassOne(ONE_TEXT)),
      ch('"Why didn\'t you make it?"', out('They look at one another. Then, one by one, each tells you one thing. The one who waved: "I got sick the week of the League." A tall boy: "My Pokémon was hurt, and I wouldn\'t make it fight." An old woman: "I lost on the last day. One hit." A boy in a cap: "I was scared." A young man: "I just ran out of road."',
        room(GL.roomId('why')))),
    ],
    [
      variant('waved', [GL.is('waved')], { notice: 'The one who waved smiles at you first. Glass trainer: "You waved back. Nobody waves back."' }),
      variant('followed', [GL.is('followed')], { notice: 'You realise they have been with you all along, a little way behind, on every road since the field.' }),
    ]),
  GL.room('why', 'Five or One',
    'The five glass trainers stand in a row, their stories hanging in the air between you. Nobody says anything else. The one who waved looks at you, and waits.',
    [ch('"Battle all five."', glassFive(FIVE_TEXT)), ch('"Battle the one who waved."', glassOne(ONE_TEXT))]),
  // "Five short battles": a fight is at most three in a row, so the last two are a second fight.
  GL.room('last-two', 'The Last Two',
    'Two glass trainers still wait their turn: the one who waved, and a tall boy holding a cracked badge case. They have watched every move. The boy nods to you, and the girl takes a breath she does not need.',
    [ch('"Battle."', fight('The last two step up, one after the other, and fight with everything they never got to use. When the final Pokémon falls, the road is quiet, and all five of them are smiling.',
      spar(GLASS, { size: 1, chain: 2, win: [moment('You fought all five glass trainers, one battle each')], lose: [moment('The glass trainers won some of their five battles at last')] })))]),
  GL.stage(3, 'For the Ones Who Almost',
    'The field again, at dawn, with mist lying low over the grass. The five glass trainers stand in a row, fainter than before, the light passing through them almost without bending. They are leaving. As they go, each one\'s Pokémon turns and looks at the matching Pokémon on your team, type to type, and nods, slowly, as if passing something on.',
    [
      ch('"Thank you."', out('You say it out loud. The one who waved smiles, and as the five of them fade into the mist something drops into the grass where she stood with a small, clear chime: a Soothe Bell, solid and real and warm from the sun.', item('soothe-bell'), GL.set('done'))),
      ch('"I\'ll remember you."', out('You tell them you will remember them. All five turn back at once, and for a moment they look almost solid. Then they are gone. Later, in the Hall of Past Champions, a small brass plaque appears beneath the statues, with five names you never heard spoken aloud and five words: "For the ones who almost"',
        flag('glass-plaque'), moment('You promised to remember the glass trainers', 70), GL.set('done'))),
    ]),
];

// ---------- D6. The Trainer Who Never Lost ----------
const N = story('aurelio', 'ovc-the-trainer-who-never-lost', 'The Trainer Who Never Lost');
const AUR = ['dragonite', 'tyranitar', 'salamence'];
const aurelio: Json[] = [
  N.stage(1, 'Want to Be First?',
    'A training ground behind a town hall, the dirt raked perfectly smooth. A young man in a pressed white jacket stands at its centre with a gold ribbon pinned to his chest, embroidered UNDEFEATED. He has a crowd. He always has a crowd. He sees you and smiles the smile of someone who has never once been surprised. Aurelio: "Never. Not once. Want to be first?"',
    [
      ch('"Battle."', fight('Aurelio\'s Dragonite lands in the dirt like a dropped anvil, and the crowd cheers before anything has even happened. It is a very hard battle, the hardest in weeks, and he fights it without a single wasted move. If he falls, nobody here has any idea what his face will do.',
        spar('Aurelio', { team: AUR, size: 3, lv: 2, win: [N.set('won'), moment('You were the first ever to beat Aurelio, and he just stood there, stunned', 75)], lose: [moment('Aurelio stayed undefeated, for now')] }), N.set('m1'))),
      ch('"Never?"', out('You ask if that is really true. Aurelio\'s smile stays exactly where it is. Aurelio: "Never." But his hands, folded behind his back, shake a little, and he sees you notice.', N.set('m1'))),
      ch('"Good for you."', out('You tell him good for him, and mean it, and walk on. Behind you the crowd goes back to cheering. Aurelio watches you go, frowning slightly, as if nobody has ever said that to him and just walked away.')),
    ]),
  N.stage(2, 'I Haven\'t Slept',
    'Aurelio again, though you almost don\'t recognise him. The white jacket is creased. The gold ribbon is gone; there is a pale little rectangle on the cloth where it used to be. There is no crowd. He sits on the edge of a fountain, staring into the water, and when he speaks it comes out flat. Aurelio: "Someone beat me. A kid. I haven\'t slept."',
    [
      ch('"It\'s okay to lose."', out('Aurelio looks at you as if you have spoken another language. He nods, politely, the way you nod at a stranger giving directions to somewhere you will never go. He doesn\'t believe it. Not yet. But after you fall quiet, you hear him say the words again under his breath.', N.set('m2'))),
      ch('"Rematch."', fight('Aurelio is on his feet too fast. His Dragonite is still strong, but Aurelio is not: he is tense and rushing, second-guessing every call and flinching at every hit. He is worse than he was, and he knows it, and knowing it makes him worse.',
        spar('Aurelio', { team: AUR, size: 3, lv: -1, win: [moment('You beat Aurelio again, and it hurt to watch')], lose: [moment('Aurelio beat you, and it did not seem to help')] }), N.set('m2'))),
      ch('"How did it feel?"', out('He is quiet so long you think he will not answer. Then: Aurelio: "...Light. That\'s the worst part. It felt light." He turns his hand over in the sunlight as if looking for the weight he carried all those years, and cannot find it.', N.set('m2'), N.set('light'))),
    ],
    [
      variant('beat-him', [N.is('won')], {
        intro: 'Aurelio again, though you almost don\'t recognise him. The white jacket is creased. The gold ribbon is gone; there is a pale little rectangle on the cloth where it used to be. There is no crowd. He sits on the edge of a fountain, and when he sees you he goes very still. Aurelio: "You. You took it. I haven\'t slept."',
      }),
    ]),
  N.stage(3, 'Kids Who\'ve Never Won',
    'A dusty little training ground at the edge of a town, with chalk lines and a rickety bench. Aurelio stands in the middle of it in a faded T-shirt, surrounded by a dozen small children with a dozen small, scruffy Pokémon, all talking at once. He is laughing. When he sees you he waves you over with both arms. Aurelio: "I\'m teaching now. Kids who\'ve never won. I\'m good at it."',
    [
      ch('"Battle your students."', fight('Three of Aurelio\'s students step up one after another, each clutching a Poké Ball in both hands. Every one of them tries something brave: a move they have never landed, a switch they were too scared to make. Aurelio shouts encouragement at all three, and at you too.',
        spar('Aurelio\'s Students', { size: 1, chain: 3, lv: -2, win: [moment('You battled three of Aurelio\'s students, and each tried something brave')], lose: [moment('Aurelio\'s students beat you, and they will never forget it')] }), N.set('done'))),
      ch('"Battle you."', fight('Aurelio grins and calls his Dragonite down out of the sky. It is a real battle, hard and fast, and when he loses he throws his head back and laughs, really laughs, while his students mob him from every side.',
        spar('Aurelio', { team: AUR, size: 3, win: [moment('Aurelio lost to you, and laughed')], lose: [moment('Aurelio beat you, and you both laughed about it')] }), N.set('done'))),
      ch('"Proud of you."', out('Aurelio goes pink to the ears. He digs in a pocket and holds out the gold ribbon, the one embroidered UNDEFEATED, a little crumpled now. Aurelio: "Take it. I don\'t need it anymore." You pin it to your bag.', moment('Aurelio gave you his old undefeated ribbon', 70), N.set('done'))),
    ],
    [variant('light', [N.is('light')], { notice: 'Aurelio catches your eye over the children\'s heads. Aurelio: "Still light. I\'m getting used to it."' })]),
];

// ---------- D7. The Trainer with No Name ----------
const NN = story('mirel', 'ovc-the-trainer-with-no-name', 'The Trainer with No Name');
const NONAME = 'The Trainer with No Name';
const nick = (label: string, text: string): Json => ch(label, out(text, NN.set('named')));
const charm = moment('Mirel gave you her spare Absol Ball charm', 70);
const noName: Json[] = [
  NN.stage(1, 'Names Are for People Who Stay',
    'A camp at the edge of a wood: one tent, one small fire, a pack already half loaded as if ready to leave at any moment. A trainer in a dark travelling cloak sits by the fire with six Poké Balls lined up on a log, an Absol lying close to the flames. You ask their name. They look at you over the fire for a long time. Trainer: "No name. Names are for people who stay."',
    [
      ch('"Battle."', fight('The trainer stands, scatters the fire with one boot, and sends out the Absol, white as frost, its horn catching the last of the light. A Houndoom and a Weavile follow. They fight like a team used to leaving before anything can catch them.',
        spar(NONAME, { team: ['absol', 'houndoom', 'weavile'], size: 3, win: [moment('You beat the trainer with no name')], lose: [moment('The trainer with no name beat you and was gone by morning')] }), NN.set('m1'))),
      ch('"I\'ll call you something."', out('You tell them you are going to call them something anyway. The trainer scowls at you over the fire, and the Absol lifts its head, curious to hear what you come up with.', NN.set('m1'), room(NN.roomId('nickname')))),
      ch('"Fine."', out('You shrug. Fine. The trainer nods, as if that is the first sensible thing anyone has said to them in months, and turns back to the fire. When you look back from the trees, the tent is already coming down.')),
    ]),
  NN.room('nickname', 'A Name for Now',
    'The trainer folds their arms and waits, plainly ready to hate whatever you come up with. The Absol watches you with its red eyes.',
    [
      nick('"Frost."', 'The trainer scowls. Trainer: "Terrible." But the Absol\'s tail thumps the ground once, and when you say it again an hour later, the trainer looks up. They keep it.'),
      nick('"Wren."', 'The trainer scowls. Trainer: "That\'s a bird." But they say it over to themselves when they think you are not listening, and they keep it.'),
      nick('"Kit."', 'The trainer scowls so hard their whole face folds. Trainer: "No." But at dawn, when you call it out, they turn round. They keep it.'),
    ]),
  NN.stage(2, 'I Don\'t Keep Things',
    'The cloaked trainer again, by a different fire on a different road. The pack is the same. The Poké Balls on the log are not: three of the six are gone, and three new ones sit in their place, still shiny. The Absol is still there, lying close to the flames. Trainer: "I let them go. I don\'t keep things."',
    [
      ch('"Why not?"', out('The trainer pokes the fire, and a spray of sparks goes up into the dark. Trainer: "Things leave anyway." They say it like a fact about the weather. The Absol shifts a little closer to their boots.', NN.set('m2'))),
      ch('"Battle."', fight('Three strangers and the Absol. The new team fights well but not together, not yet; only the Absol moves as if it knows its trainer\'s mind.',
        spar(NONAME, { team: ['absol', 'zoroark', 'skarmory'], size: 3, lv: 1, win: [moment('You beat the trainer with no name and their new team')], lose: [moment('The trainer with no name beat you with a team they did not mean to keep')] }), NN.set('m2'))),
      ch('"Do they know where you are?"', out('The trainer is silent a long time. Then they glance down at the Absol by the fire, which has not taken its eyes off them once. Trainer: "...One keeps finding me." The Absol lays its chin on their boot, as if it heard.', NN.set('m2'), NN.set('absol'))),
    ],
    [variant('named', [NN.is('named')], { notice: 'You greet them by the name you gave them. The trainer scowls, exactly like last time. But they answer to it.' })]),
  NN.stage(3, 'It\'s Mirel',
    'Night, and a fire, and the trainer sitting on the far side of it with the hood of the cloak down for the first time. The Absol lies across their feet. They have clearly been waiting for you, and clearly been arguing with themselves about it. At last, without looking up: Trainer: "It\'s Mirel." ' +
      'A pause, the fire crackling. It was a parent\'s name, Mirel says, a parent lost on the road years ago. She took it to remember them by, and she has never told it to anyone who stayed.',
    [
      ch('"That\'s a good name."', out('Mirel smiles, once, quickly, as if it got away from her. Then she takes something from her pocket and tosses it across the fire to you: a little carved charm in the shape of an Absol\'s Poké Ball, worn smooth. Her spare. Mirel: "Keep it."', charm, NN.set('done'))),
      ch('"Stay a while."', out('Mirel looks at you, then at the fire, then unrolls her bedroll on your side of it without a word. You camp together that night, and your team rests and mends by the warm coals. In the morning you wake to find the Absol curled up asleep beside your starter, nose to tail, as if they have known each other for years.', heal(0.5), NN.set('done'))),
      ch('"Keep moving if you need to."', out('Mirel looks up sharply, as if she expected you to argue. Then her face loosens. Mirel: "Thanks for not stopping me." Before she shoulders her pack she presses a little carved Absol Ball charm into your hand, worn smooth, her spare.', charm, NN.set('done'))),
    ],
    [variant('absol', [NN.is('absol')], { notice: 'The Absol lifts its head and looks at you, then at Mirel, and settles again with its chin on her boot. The one that keeps finding her.' })]),
];

// The old Invitation opened a pseudo stage (the League Exhibition); C3 opens the Hall of Past Champions instead, so it is no pseudo gate.
for (const e of invitation) if (e.id === 'ev-champions-invitation') e.pseudo = false;
export const EVENTS: Json[] = [...lunch, ...arrives, ...invitation, ...silentCap, ...tower, ...plant, ...seafoam, ...travel, ...sisters, ...mirror, ...galen, ...glass, ...aurelio, ...noName];
// The old Invitation was the only way into the League Exhibition's gate room (category places, ledger MERGE into SF115). C3 no longer opens it,
// so it is retired here (kept loadable for saved runs, never drawn); a co file that rebuilds the id wins over this.
export const REMOVE: string[] = ['ps-league-exhibition-gate'];

/** Where each event is scripted (for docs/status/co-people.md). */
export const DOC: Record<string, string> = {
  'champion-lunch': 'SF8 C1', 'ev-champions-challenge': 'SF8 C2', 'ev-champions-invitation': 'SF8 C3',
  'face-captain-cameo': 'SF8 C5', 'face-captain-cameo-after': 'SF8 C5 (Remembers: PC1)',
  'dungeon-pokemon-tower': 'SF8 C6 The Tower (floor 1)', 'dungeon-pokemon-tower-floor-2': 'SF8 C6 The Tower (floor 2)', 'dungeon-pokemon-tower-floor-3': 'SF8 C6 The Tower (floor 3)', 'dungeon-pokemon-tower-marowak': 'SF8 C6 The Tower (The Marowak)',
  'dungeon-power-plant': 'SF8 C6 The Power Plant (hall 1)', 'dungeon-power-plant-hall-2': 'SF8 C6 The Power Plant (hall 2)', 'dungeon-power-plant-hall-3': 'SF8 C6 The Power Plant (hall 3)',
  'dungeon-seafoam-depths': 'SF8 C6 Seafoam Depths (chamber 1)', 'dungeon-seafoam-depths-chamber-2': 'SF8 C6 Seafoam Depths (chamber 2)', 'dungeon-seafoam-depths-chamber-3': 'SF8 C6 Seafoam Depths (chamber 3)',
  'ovc-traveling-trainer-s1': 'SF8 D1 M1', 'ovc-traveling-trainer-s2': 'SF8 D1 M2', 'ovc-traveling-trainer-s3': 'SF8 D1 M3',
  'ovc-crossroads-duelist-s1': 'SF8 D2 M1', 'ovc-crossroads-duelist-s2': 'SF8 D2 M2', 'ovc-crossroads-duelist-s3': 'SF8 D2 M3', 'ovc-crossroads-duelist-broker': 'SF8 D2 M2 (Why)',
  'ovc-mirror-trainer-s1': 'SF8 D3 M1', 'ovc-mirror-trainer-s2': 'SF8 D3 M2', 'ovc-mirror-trainer-s3': 'SF8 D3 M3',
  'ovc-silver-trainer-s1': 'SF8 D4 M1', 'ovc-silver-trainer-s2': 'SF8 D4 M2', 'ovc-silver-trainer-s3': 'SF8 D4 M3',
  'ovc-glass-trainers-s1': 'SF8 D5 M1', 'ovc-glass-trainers-s2': 'SF8 D5 M2', 'ovc-glass-trainers-s3': 'SF8 D5 M3', 'ovc-glass-trainers-why': 'SF8 D5 M2 (Why)', 'ovc-glass-trainers-last-two': 'SF8 D5 M2 (Five)',
  'ovc-the-trainer-who-never-lost-s1': 'SF8 D6 M1', 'ovc-the-trainer-who-never-lost-s2': 'SF8 D6 M2', 'ovc-the-trainer-who-never-lost-s3': 'SF8 D6 M3',
  'ovc-the-trainer-with-no-name-s1': 'SF8 D7 M1', 'ovc-the-trainer-with-no-name-s2': 'SF8 D7 M2', 'ovc-the-trainer-with-no-name-s3': 'SF8 D7 M3', 'ovc-the-trainer-with-no-name-nickname': 'SF8 D7 M1 (Call you)',
};

/** Flags nothing in this file reads: where the doc says they come back. */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'champ-(met|won)', readBy: 'The League Champion battle opens with "You again. Good." when the player won (SF8 C2 Remembers; needs engine: a League battle line)' },
  { match: 'champion-ace-hint', readBy: 'Needs engine: a hint about the region\'s Champion\'s ace (SF8 C1 Choosing)' },
  { match: 'glass-plaque', readBy: 'PC6 Hall of Past Champions (people-champions-1): the plaque "For the ones who almost" (SF8 D5 M3 Remember)' },
  { match: 'legend-(zapdos|articuno)-(sign|influence)', readBy: 'Needs engine: Legendary Blessings, a Sign or +2 Influence (SF8 C6 Power Plant hall 3, Seafoam chamber 3; QUESTLINES_LEGENDARY)' },
  { match: 'ves-owed-type-item', readBy: 'Needs engine: the type-boosting held item for the lead\'s type (SF8 D3 M3)' },
  { match: 'galen-watching', readBy: 'Needs engine: Galen watches the next battle and claps (SF8 D4 M3 Watch)' },
  { match: 'mentor-galen', readBy: 'A thirteenth mentor, Galen, "the long game", for future runs (SF8 D4 M3 Teach; cross-run, not built)' },
];

/** Flags this file reads that another module sets: PC1 Red on the Mountain (people-champions-1). */
export const EXTERNAL: string[] = ['red-battled', 'red-sat'];
