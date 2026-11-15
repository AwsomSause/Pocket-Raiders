// Anime questlines, module 8: AQ24-AQ30. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ24 The Gible Who Couldn't Aim       (Stage-Three; script: QUESTLINES_DEEPENED_2.md "AQ24")
//   AQ25 The Gliscor Who Stayed to Train  (Companion, farewell; script: QUESTLINES_ASH.md "AQ25")
//   AQ26 The Scalchop                     (Single; script: QUESTLINES_DEEPENED_2.md "AQ26")
//   AQ27 The Snivy Who Left Its Trainer   (Companion; script: QUESTLINES_DEEPENED_2.md "AQ27")
//   AQ28 The Tepig Who Waited             (Companion; script: QUESTLINES_ASH.md "AQ28")
//   AQ29 The Seamstress                   (Companion; script: QUESTLINES_ASH.md "AQ29")
//   AQ30 The Sunglasses                   (Stage-Three; script: QUESTLINES_ASH.md "AQ30")
// Build: npm run co:build -- anime-8
import { bondUp, ch, ev, fight, flag, flagIs, has, leave, lose, out, room, trade, type Json } from '../dsl.ts';
import { AQ, beast, bondLine, evolve, farewell, gain, later, line, moment, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ24: 'aq24-gible-couldnt-aim',
  AQ25: 'aq25-gliscor-stayed',
};

export const PLACEMENT: Record<string, Place> = {
  'aq24-gible-couldnt-aim': { shape: 'Stage-Three', earliest: 'A4', home: 6, sits: 'optional', tags: ['cave'], level: 'A+0', beats: ['aq24-the-pond', 'aq24-the-road', 'aq24-saw-it'], note: 'Steps 6, 12, 17: it misses three times. The step-17 fight is A+0.' },
  'aq25-gliscor-stayed': { shape: 'Companion', earliest: 'A5', home: 10, window: [7, 13], sits: 'optional', tags: ['high'], beats: ['aq25-wont-look', 'aq25-three-metres', 'aq25-the-wind', 'aq25-over-the-tent', 'aq25-a-reason', 'aq25-stay-to-train'], note: 'Farewell story. Turning point two stages on (Step 13), farewell four stages on (Step 17); the player always chooses.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

/** Questline -> the date its doc was re-read line by line against these events. */
export const CHECKED: Record<string, string> = {};

export const LIMITS: Record<string, string[]> = {
  AQ24: [
    'Its Draco Meteor has the move\'s usual 90% accuracy from the moment it joins; the doc\'s "75% until it lands one in a real battle, then 90%" needs a per-Pokémon accuracy the game does not have.',
    'The Gible is not in the party until the end, so in the step-17 fight it fires one Draco Meteor before the battle (one chance in four aimed at the foe, three in four aimed beside it, shown on the buttons); if it lands, your team deals 30% more damage in that fight, which your own team fights. It joins after the fight, won or lost.',
    'The Bond from "Let it practise on you" is given when it has joined, in the closing scene (+30 friendship; +10 after the lessons; none after "Duck").',
    '"Practise on you" leaves the player sore "on the map sprite for a node": the map sprite does not change; the soreness is told in the text.',
    'Remembers "Things Gible Has Hit" (it clips things in the background of later battles) is kept as Chronicle lines from its own scenes; battles have no background-clip chance and there is no Notebook list.',
  ],
  AQ25: [
    'The doc\'s short script has only the meeting and the farewell; the small scenes and the turning point (a storm dive in which it evolves) are written to the Companion rule.',
    '"Give it a Razor Fang." needs a Razor Fang in the Bag and uses it up; it joins already a Gliscor (the doc: it evolves that night).',
    '"It does not trust the player for a stage" (Push): it joins with ordinary friendship, and its small scenes and turning point wait for a trust scene ("Not Your Hands") at least a stage later.',
    '"Ask it." lets it choose by its Bond, which the doc does not specify: at Bond 4 or more it comes with you; below that it stays to train.',
    'Remembers "Fly beside it": the Flying-type that stays is the first Flying-type left in the party after the Gliscor goes, not necessarily the one that flew beside it (the game does not remember which Pokémon was picked).',
  ],
};

const CAVE = tagTypes('cave');
const HIGH = tagTypes('high');

// ---------------- AQ24. The Gible Who Couldn't Aim ----------------
const SAW_IT = moment('Things Gible Has Hit: a tree, a signpost, a Piplup (nearly), you (often), and once, in a real fight, the thing it was aiming beside.', 60);
const GIBLE_HIT_1 = moment('Things Gible Has Hit: a tree. Another tree. A signpost. You.', 30);
const toThePond = (lesson: string, text: string): Json => out(text, flag(lesson), flag('aq24-gible-follows'), later('aq24-the-pond', 5), GIBLE_HIT_1);
/** Lesson three: where it aims. It hits what it is not aiming at, so "beside it" is the better bet, and the button says so. */
const roadChoices = (): Json[] => {
  const joins = (how: string): Json[] => [gain('gible', { moves: ['draco-meteor'] }), flag('aq24-gible-joined'), flag(how), room('aq24-saw-it')];
  const big = (): Json => beast({ species: ['ursaring', 'rhydon', 'steelix'], win: joins('aq24-road-won') }, { lose: joins('aq24-road-lost') });
  const landed = (text: string): Json => fight(text, big(), flag('aq24-meteor-landed'), temp('The Gible\'s meteor landed', [{ kind: 'damageMultiplier', value: 1.3 }], 1));
  const missed = (text: string): Json => fight(text, big());
  return [
    ch('Aim at the foe. (One in four)', landed('You point straight at it. The Gible lets go. Against every habit it has, the meteor goes where you pointed and comes down square on the big Pokémon. The dust clears. The Gible still has its mouth open. It turns round, very slowly, to see if you saw. You saw. Now finish it together.'),
      { chance: 0.25, fail: missed('You point straight at it. The meteor goes up, wavers, and buries itself in the hill behind the road, a long way from anything. The big Pokémon looks at the crater, then at the Gible, and charges. Your lead shoulders back in front of it. Lesson three is not over yet.') }),
    ch('Aim beside it. (Three in four)', landed('You point at the empty ground just left of it. The Gible frowns: that is not where the enemy is. It glows anyway. The meteor goes up, wobbles, misses the empty ground completely, and lands right on the big Pokémon. The dust clears. The Gible still has its mouth open. It turns round, very slowly, to see if you saw. You saw. Now finish it together.'),
      { chance: 0.75, fail: missed('You point at the empty ground beside it. For once the Gible hits exactly what it was aiming at: the empty ground. It is so pleased that it does not see the charge coming. Your lead shoulders back in front of it. Lesson three is not over yet.') }),
  ];
};

// ---------------- AQ25 pieces ----------------
const GLISCOR = ['gligar', 'gliscor'];
const REUNION_GLISCOR = flag('reunion-guest-gliscor');
const FLIER_NOTICE = 'It lands beside your Flying-type, the one that leaned into the wind with it on the first day, and nudges it toward the bench. It wants its first teacher to stay too. Then it looks at you: that part is yours to decide.';
const askComes = ch('Ask it.', out('You ask. It does not even look at the bench. It looks at you, and lands on your shoulder, and folds its wings as if that were the end of the question. Gale grins. "That\'s a reason, right there," he says. "Off you go, the pair of you. Come back and show my lot how it\'s done."',
  bondLine('gligar', 10), flag('aq25-asked'), flag('aq25-came'), REUNION_GLISCOR, moment('You asked your Gliscor whether it would stay to train. It chose you.', 75)));
const bothStay = ch('Let them both stay.', out('You nod. Your Flying-type steps up beside the Gliscor, and the two of them turn to face the bench of young Gligar like a pair of teachers on the first day of term. Gale shakes your hand for a long time. The smallest Gligar from the bench climbs onto your boot and stays there. "Take that one," Gale says. "It\'ll have the best teachers in the world to live up to."',
  farewell('your Gliscor (it stays to train)', GLISCOR), trade('your Flying-type (it stays to teach)', { type: 'flying' }), gain('gligar', { bond: 10 }), flag('aq25-stayed'), flag('aq25-flier-stayed'), REUNION_GLISCOR, moment('Your Gliscor stayed at the cliff to train, and the Flying-type that first taught it to glide stayed with it.', 75)));

export const EVENTS: Json[] = [
  ev('aq24-gible-couldnt-aim', 'The Gible Who Couldn\'t Aim', AQ, { rarity: 'uncommon', minStage: stageOf('A4'), types: CAVE, pokemon: 'gible', tint: '#2a2418', effect: 'shake' },
    'A rock by the mouth of a cave, with a target chalked on it in careful rings. Twenty paces off, a Gible is straining so hard it shakes. Its whole body glows. Something goes up, very high and very bright. It comes down on a tree. Then on another tree. Then on a signpost, which was minding its own business. The last one comes down on you. When the dust settles, the Gible has seen. It is mortified. It is biting its own head, which is how it thinks.',
    [
      ch('Teach it to aim.', out('You dust yourself off and crouch beside it. It stops biting its head. It looks at the target, then at you, the way a student looks at a teacher who has just been hit by a meteor and is somehow still smiling. "Right," you say. "Let\'s work out what\'s going wrong." It sits up very straight.', flag('aq24-teaching'), room('aq24-lesson-one'))),
      ch('Duck.', out('The next one goes up and you are flat on the ground before it comes down. It lands on the signpost again. The Gible looks at you lying there with your arms over your head, and something in its face shuts like a door. It thought you were getting on. It turns its back and practises as if you are not there. But when you walk on, a small blue shape walks on too, a long way behind, sulking at every step.', flag('aq24-ducked'), flag('aq24-gible-follows'), later('aq24-the-pond', 5), GIBLE_HIT_1)),
      ch('Let it practise on you.', out('You go and stand beside the target. "Go on, then." It hesitates. Then it glows, and the meteor goes up, and comes down squarely on you. So does the next. So does every one after that, all afternoon. It never once hits the target. It hits you every single time. By evening you are very sore, and the Gible is leaning against your leg, glowing faintly with something that is not a meteor at all.', flag('aq24-practised'), flag('aq24-gible-follows'), later('aq24-the-pond', 5), moment('Things Gible Has Hit: a tree. Another tree. A signpost. You. You. You. You, all afternoon.', 30))),
    ]),
  ev('aq24-lesson-one', 'Lesson One', AQ, { room: true, requires: [flagIs('aq24-teaching')], pokemon: 'gible', tint: '#2a2418', effect: 'none' },
    'The Gible plants itself in front of the target again and waits for your verdict. It has clearly been told it is doing it wrong before, by rocks and trees and signposts. You watch one more go up and come down on a bush. You think you can see the problem. Honestly, you can see three. Which one do you tell it?',
    [
      ch('You\'re shutting your eyes.', toThePond('aq24-lesson-eyes', 'It tries again with its eyes wide open. It watches the thing leave its own mouth and climb, glowing, into the sky, and it is so astonished that it sits straight down. The meteor comes down exactly on the sitting-down place, a heartbeat after it scrambles out. It looks at the crater. It looks at you. That is closer than it has ever come to anything it meant. When you walk on, it walks on beside you.')),
      ch('You\'re aiming with your mouth.', toThePond('aq24-lesson-mouth', 'It tries aiming with its whole body instead: feet planted, tail pointing, chin down. The meteor goes sideways, then up, then into a bush. But it went sideways on purpose, and the Gible knows it. It spins round to you with its mouth open, as if a door somewhere has come unlocked. When you walk on, it walks on beside you, still pointing its tail at things.')),
      ch('You\'re trying too hard.', toThePond('aq24-lesson-easy', 'It stops. It breathes. It lets the glow come up slowly instead of squeezing it out. The meteor rises lazily, wanders, and lands on the far edge of the target rock. Not the target. The rock. The Gible stares at it for a long time. Then it bites its own head, gently, the way it does when it is thinking something new. When you walk on, it walks on beside you.')),
    ]),
  ev('aq24-the-pond', 'The Pond', AQ, { room: true, requires: [flagIs('aq24-gible-follows')], pokemon: 'piplup', tint: '#1c2a2a', effect: 'shake',
    remembers: [
      { id: 'ducked', when: [flagIs('aq24-ducked')], notice: 'It practises from the far side of the pond, as far from you as the water allows. It still checks, every single time, that you are watching.' },
      { id: 'practised', when: [flagIs('aq24-practised')], notice: 'Before it starts, it waddles over and inspects your arm, where the bruises have gone yellow. It pats one. Then it goes back to its mark.' },
      { id: 'taught', when: [flagIs('aq24-teaching')], notice: 'It glances at you before it fires, the way a student glances at the teacher. Lesson two, the glance says. Go on.' },
    ] },
    'A pond, still and green, with a flat rock in the middle and a target chalked on the rock. The Gible got here before you. It has been practising alone. There are a great many craters, in a neat ring all the way round the pond, and not one in it. It sets its feet. It glows. The meteor goes up, wobbles, and comes down on a Piplup sunning itself on the bank. The Piplup is not hurt. The Piplup has had enough. It stands up, dripping, flippers on its hips, and glares.',
    [
      ch('Aim away from it.', out('"Aim away from the target," you tell it, and you point at the Piplup. The Piplup opens its beak to object. The Gible narrows its eyes at the Piplup, glows, and lets go. The meteor sails clean over the Piplup\'s head and lands dead in the centre of the target. Nobody speaks. The Piplup slowly lowers its flippers. The Gible looks at the target. It looks at the Piplup. It has worked something out, and you can tell from its face that it is exactly the wrong thing.',
        flag('aq24-lesson-two'), later('aq24-the-road', 5), moment('Things Gible Has Hit: a Piplup, nearly. The target, by accident.', 30))),
    ]),
  ev('aq24-the-road', 'Lesson Three', AQ, { room: true, requires: [flagIs('aq24-lesson-two')], pokemon: 'gible', tint: '#2a2418', effect: 'shake',
    remembers: [
      { id: 'practised', when: [flagIs('aq24-practised')], notice: 'It glances back at you once. It has hit you more times than anyone alive. It trusts you to know where it will land.' },
      { id: 'ducked', when: [flagIs('aq24-ducked')], notice: 'It does not look back at you. It is still a little offended. But it stepped in front of your lead all the same.' },
    ] },
    'A real one, this time. A wild Pokémon, big and cross, is planted in the middle of the road and will not let anyone by. Before your lead can move, the Gible steps out in front of it. Its whole body starts to glow. This is lesson three, and you both know it. Its meteor goes anywhere except where it is aimed: pointed straight at the foe it lands one time in four, pointed at the ground beside it, three times in four. It is waiting for you to tell it where.',
    roadChoices()),
  // The close: it turns round to see if you saw. The Bond the earlier beats earned lands here, once it is in the party.
  ev('aq24-saw-it', 'Did You See?', AQ, { room: true, requires: [flagIs('aq24-gible-joined')], pokemon: 'gible', tint: '#2a2418', effect: 'sparkle',
    remembers: [
      { id: 'practised', when: [flagIs('aq24-practised')], notice: 'It climbs your leg, the one it bruised all afternoon at the first target, and sits on your foot so you cannot go anywhere without it.', hide: [0], addChoices: [
        ch('Tell it you saw.', out('"I saw," you say. "Every one of them, all afternoon, and this one too." It shuts its eyes and leans its whole small weight on your shin. It has hit you more often than it has hit anything. It plans to go on standing next to you anyway.', bondLine('gible', 30), SAW_IT)),
      ] },
      { id: 'ducked', when: [flagIs('aq24-ducked')], notice: 'It keeps a careful step away from you. It has not forgotten the ducking. But it is still looking at you, waiting.', hide: [0], addChoices: [
        ch('Tell it you saw.', out('"I saw," you say. "I won\'t duck again." It thinks about that for a long, dignified moment. Then it closes the step between you, and sits down on your foot, as if it had been going to anyway.', SAW_IT)),
      ] },
    ] },
    'The dust settles on the road. The big Pokémon has gone, one way or another, and the Gible is standing where it stood, mouth still open, glowing faintly at the edges. It turns round, very slowly, to see if you saw. It has three lessons behind it now, a ring of craters round a pond somewhere, and a list of things it has hit that is getting long.',
    [
      ch('Tell it you saw.', out('"I saw," you say. "Lesson three. Top marks." It bites its own head, gently, which is how it thinks, and what it is thinking is clearly very good. Then it trots to your side and stays there, a little closer than it needs to.', bondLine('gible', 10), SAW_IT)),
      ch('Pretend you missed it.', out('"Sorry, what happened? I was looking at a cloud." Its mouth falls open even further. It points at the crater. It points at itself. It stamps. Then it sees your face, and understands, and bites your boot, not hard, which is how it laughs. It does not leave your side for the rest of the day, in case you miss the next one.', bondLine('gible', 5), SAW_IT)),
    ]),
  // ---------------- AQ25. The Gliscor Who Stayed to Train ----------------
  ev('aq25-gliscor-stayed', 'The Gliscor Who Stayed to Train', AQ, { rarity: 'rare', minStage: stageOf('A5'), types: HIGH, cast: ['trainer.bird_keeper_m'], pokemon: 'gligar', tint: '#1e2a3a', effect: 'float' },
    'A cliff above a long valley, and a flight school at the top of it: a wind sock, a bench, a whistle on a string. A Gligar stands at the edge with its pincers out. It runs. It jumps. It glides about three metres and lands on its face. It gets up and walks back, very small against all that sky. The instructor, a lean man in a long scarf, sighs the way only teachers sigh. "Fenwick Gale. That one\'s got a Gliscor\'s heart in a Gligar\'s body. It just needs a reason." The Gligar looks at the drop. Then, for some reason, it looks at you.',
    [
      ch('Push it off the cliff.', out('Before anyone can argue, you give it a shove. It drops like a stone, screaming, flailing, and then somehow its wings catch. It flies: badly, terrified, in one lurching circle, and lands in a bush far below. When it climbs back up, it walks straight past you to the instructor. It does come with you when you leave. But it rides as far from you as it can get, and it watches your hands.',
        gain('gligar'), flag('aq25-met'), flag('aq25-pushed'), flag('aq25-distrust'))),
      ch('Fly beside it.', out('Your Flying-type walks to the edge beside it and waits. The Gligar looks at it, and at the drop, and back. They jump together. Your Pokémon does not flap; it only spreads its wings and leans, and the Gligar copies it, wing for wing, all the way down the valley and back up on the warm air. It lands on its feet. It stares at its feet. That evening it follows the two of you down the path, and nobody has to ask.',
        bondUp(1, 'picked'), gain('gligar', { bond: 15 }), flag('aq25-met'), flag('aq25-flew-beside')), { pick: { types: ['flying'] } }),
      ch('Give it a Razor Fang.', out('You hold out the Razor Fang. The instructor raises an eyebrow and says nothing. The Gligar takes it in both pincers, very carefully, as if it might bite back. That night, on the cliff, under no moon at all, it starts to glow. In the morning a Gliscor is hanging upside down from your tent pole, grinning. It flies, too. It flies as if it had always meant to, and only been waiting to be asked.',
        lose('razor-fang'), gain('gliscor'), flag('aq25-met'), flag('aq25-fang')), { requires: [has('razor-fang')] }),
      ch('Leave it to its teacher.', leave('The Gligar watches you go from the edge of the cliff. Behind you, faintly: a whistle, a run, a jump, and a small, determined thump.')),
    ]),
  // Pushed: it does not trust you for a stage. Its small scenes wait until this one.
  ev('aq25-wont-look', 'Not Your Hands', AQ, { callback: true, requires: [flagIs('aq25-distrust'), line('gligar'), age('aq25-pushed', 1)], pokemon: 'gligar', tint: '#1e2a3a', effect: 'none' },
    'A whole stage, and it has not once let you near it. It eats when you have walked away. It sleeps facing you. When you lift a hand to point at something it flinches, and then looks ashamed of flinching. Tonight it sits on the edge of a ridge, looking down, the way it looked down from the cliff before you pushed.',
    [
      ch('Say sorry.', out('You sit down a long way from it and tell it you are sorry, and that you will never push it again, off anything, ever. It does not look round. But later, when you have nearly fallen asleep, there is a small weight against your back, and a pincer resting, very lightly, on your sleeve.', flag('aq25-distrust', -1), flag('aq25-forgiven'), bondLine('gligar', 5))),
      ch('Jump first.', out('You walk to the edge and step off it, onto a ledge a little way down that it cannot see. It shrieks and comes over the edge after you, wings wide, without stopping to think at all. It lands on the ledge beside you, shaking, and glares. Then it laughs, a dry clicking laugh, and it does not move away.', flag('aq25-distrust', -1), flag('aq25-forgiven'), bondLine('gligar', 5))),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq25-three-metres', 'Three Metres', AQ, { callback: true, requires: [flagIs('aq25-met'), notYet('aq25-distrust'), line('gligar', 1), age('aq25-met', 1)], pokemon: 'gligar', tint: '#1e2a3a', effect: 'none' },
    'Camp on a hillside. It has found a boulder about as tall as you and has been jumping off it all evening. Three metres of glide, then its face. Three metres, face. It never gets any further. It never stops. The rest of your team has stopped pretending not to watch.',
    [
      ch('Catch it at the end.', out('You stand where its face usually lands. It glides, lands in your arms instead, and is so surprised it forgets to be embarrassed. It climbs straight back up the boulder. Three metres and you. Three metres and you. By dark it is getting four.', bondLine('gligar', 5), flag('aq25-scene-1'))),
      ch('Let it land on its face.', out('You let it land on its face, every time, and every time you clap. At first it is not sure whether you are laughing at it. You are not, and it works that out. By dark it has started taking a bow before it climbs back up.', bondLine('gligar', 5), flag('aq25-scene-1'))),
    ]),
  ev('aq25-the-wind', 'Reading the Wind', AQ, { callback: true, requires: [seen('aq25-three-metres'), line('gligar', 2)], pokemon: 'gligar', tint: '#1e2a3a', effect: 'float' },
    'A gusty ridge. It stands at the edge with its pincers raised, feeling the wind push and pull at it, and every time it nearly jumps, the wind changes its mind. It looks back at you as if you might know something the wind does not.',
    [
      ch('Wait for the gust.', out('You hold up a hand. Wait. Wait. The grass goes flat, and you drop your hand, and it jumps into the gust. It goes up instead of down. For the first time in its life, it goes up. It comes back down the long way, slowly, showing off to every Pokémon you own.', bondLine('gligar', 5), flag('aq25-scene-2'))),
      ch('Jump in the lull.', out('You tell it to go in the still moment between gusts. It drops a little, then the next gust catches it and carries it sideways along the ridge, startled and delighted, all the way to the trees. It walks back an hour later covered in leaves, very pleased with the wind and with you.', bondLine('gligar', 5), flag('aq25-scene-2'))),
    ]),
  ev('aq25-over-the-tent', 'Over the Tent', AQ, { callback: true, requires: [seen('aq25-the-wind'), line('gligar', 3)], pokemon: 'gligar', tint: '#24324a', effect: 'float' },
    'Morning. Something passes over the camp, high up, and its shadow crosses every sleeping face. Your Pokémon sit up one by one. It is the one that used to land on its face. It is circling the tent, round and round, higher than it has ever been. It does not know how to come down.',
    [
      ch('Talk it down.', out('You stand in the open and talk to it the whole way, the way you would talk to someone on a ledge. Lower. Lower. Feet out. It lands, wobbles, and stays up. Then it looks at you with its whole face lit, as if you had done it, and not it.', bondLine('gligar', 5), flag('aq25-scene-3'))),
      ch('Let it work it out.', out('You only watch. It goes round six more times, thinking. Then it folds one wing, drops, opens it, and lands on the tent pole as if it had planned to all along. The tent falls down. Nobody minds at all.', bondLine('gligar', 5), flag('aq25-scene-3'))),
    ]),
  // The turning point: two stages after the meeting. The reason it needed.
  ev('aq25-a-reason', 'A Reason', AQ, { callback: true, minStage: stageOf('A7'), requires: [flagIs('aq25-met'), notYet('aq25-distrust'), age('aq25-met', 2), line('gligar')], types: HIGH, cast: ['trainer.bird_keeper_m'], pokemon: 'gligar', tint: '#1a2232', effect: 'rain',
    remembers: [
      { id: 'fang', when: [flagIs('aq25-fang')], notice: 'It has been a Gliscor since the night of the Razor Fang. It has never yet had to find out what that is for.' },
      { id: 'pushed', when: [flagIs('aq25-pushed')], notice: 'It looks at the drop. It looks at you. You keep your hands at your sides. It nods, once: it knows. This time it is going on its own.' },
      { id: 'flew-beside', when: [flagIs('aq25-flew-beside')], notice: 'Your Flying-type steps up beside it out of habit, ready to lean into the wind together. It shakes its head. Not this time. This one is its own.' },
    ] },
    'High cliffs in a storm, and a flight school\'s camp pitched under them: Instructor Gale and his whole class of Gligar, out for training. A young Gligar has tried the cliff alone and the wind has taken it. It is clinging to a ledge halfway down, wings torn wide open by the gusts, crying. Gale is already uncoiling a rope. Your own one walks to the edge and stands there, very still, looking down at the ledge. It has a reason now.',
    [
      ch('Send it.', out('"Go," you say. It goes. It does not glide; it dives, wings folded, straight down the face of the cliff, and halfway there it starts to glow. Something bigger opens its wings above the ledge. It catches the little one in its tail, turns on the gust, and comes back up the storm the way you climb stairs. Gale drops his rope and forgets to pick it up.',
        evolve('gligar', 'gliscor'), bondLine('gligar', 10), flag('aq25-turned'), moment('Your Gligar dove off a cliff in a storm to catch a smaller one, and came back up a Gliscor.', 70))),
      ch('Go down the rope yourself.', out('You take Gale\'s rope and go over the edge. You get three metres. It cannot stand it. It comes past you in a dive, glowing, and the thing that opens its wings above the ledge is not a Gligar any more. It scoops up the little one, then circles back for you, and hauls on the rope until your boots are on the grass. It looks furious. It looks proud.',
        evolve('gligar', 'gliscor'), bondLine('gligar', 10), flag('aq25-turned'), flag('aq25-roped'), moment('Your Gligar dove off a cliff in a storm to catch a smaller one, and came back up a Gliscor.', 70))),
    ]),
  // The farewell: four stages after the meeting. The player always chooses; nothing is taken.
  ev('aq25-stay-to-train', 'Ready to Train', AQ, { callback: true, minStage: stageOf('A9'), requires: [flagIs('aq25-turned'), age('aq25-met', 4), line('gligar')], types: HIGH, cast: ['trainer.bird_keeper_m'], pokemon: 'gliscor', tint: '#24324a', effect: 'float',
    remembers: [
      { id: 'flier-close', when: [flagIs('aq25-flew-beside'), line('gligar', 4)], notice: FLIER_NOTICE, hide: [2], addChoices: [askComes, bothStay] },
      { id: 'flier', when: [flagIs('aq25-flew-beside')], notice: FLIER_NOTICE, addChoices: [bothStay] },
      { id: 'close', when: [line('gligar', 4)], notice: 'It has not been more than a wing\'s length from you in a long time. It is not now, either.', hide: [2], addChoices: [askComes] },
    ] },
    'The flight school on the cliff again, wind sock and bench and whistle. Your Gliscor lands on the very edge, perfectly, without a wobble. Instructor Gale watches it for a long time. "It\'s ready to train with the best," he says at last. "Here. With me." He nods at the way it keeps glancing back at you. "But it won\'t leave you. Not unless you tell it to." On the bench, a row of young Gligar hold their breath.',
    [
      ch('Stay and train.', out('You tell it. It understands before you have finished. It flies one slow circle over your head, low enough to ruffle your hair, and lands beside Gale, facing the class. Then the smallest Gligar on the bench, the one that lands on its face, hops down and climbs onto your boot and will not get off. "Take that one," Gale says, rubbing his eyes. "It needs a reason too."',
        farewell('your Gliscor (it stays to train)', GLISCOR), gain('gligar'), flag('aq25-stayed'), REUNION_GLISCOR, moment('Your Gliscor stayed at the cliff to train with the best. It landed perfectly.', 75))),
      ch('Come with me.', out('It is on your shoulder before the words are out, heavy and warm and grinning. Gale laughs, and it is not a sad laugh. "Thought so. Come back and show my lot how to land, then." When you walk away, the whole bench of young Gligar jump off the cliff after you, one by one, and glide three metres, and land on their faces.',
        bondLine('gligar', 10), flag('aq25-came'), REUNION_GLISCOR, moment('Your Gliscor was ready to train with the best, and chose to fly on with you.', 75))),
      ch('Ask it.', out('You ask. It looks at you for a long time. It looks at the bench of young Gligar, and at the edge it once could not jump from, and you watch it decide. It presses its forehead against yours. Then it flies to Gale\'s side. The best student from the bench walks over to you without being told, chin up, ready. "It chose that one for you," Gale says quietly.',
        farewell('your Gliscor (it chose to stay)', GLISCOR), gain('gligar', { bond: 20 }), flag('aq25-asked'), flag('aq25-stayed'), REUNION_GLISCOR, moment('You asked your Gliscor, and it chose to stay at the cliff and train. It chose your next friend for you.', 75))),
    ]),
];

export const REMOVE: string[] = [];
