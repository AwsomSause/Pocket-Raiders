// Anime questlines, module 8: AQ24-AQ30. Follows tools/events/co/anime-0.ts (the worked examples) and _animeKit.ts.
//   AQ24 The Gible Who Couldn't Aim       (Stage-Three; script: QUESTLINES_DEEPENED_2.md "AQ24")
//   AQ25 The Gliscor Who Stayed to Train  (Companion, farewell; script: QUESTLINES_ASH.md "AQ25")
//   AQ26 The Scalchop                     (Single; script: QUESTLINES_DEEPENED_2.md "AQ26")
//   AQ27 The Snivy Who Left Its Trainer   (Companion; script: QUESTLINES_DEEPENED_2.md "AQ27")
//   AQ28 The Tepig Who Waited             (Companion; script: QUESTLINES_ASH.md "AQ28")
//   AQ29 The Seamstress                   (Companion; script: QUESTLINES_ASH.md "AQ29")
//   AQ30 The Sunglasses                   (Stage-Three; script: QUESTLINES_ASH.md "AQ30")
// Build: npm run co:build -- anime-8
import { $, bondUp, ch, ev, fight, flag, flagIs, has, item, leave, lose, money, out, room, trade, type Json } from '../dsl.ts';
import { AQ, age, beast, bondLine, duel, evolve, farewell, gain, later, line, moment, monDuel, notYet, seen, stageOf, tagTypes, temp, type Place } from './_animeKit.ts';

export { CATEGORY } from './_animeKit.ts';

export const QUESTLINES: Record<string, string> = {
  AQ24: 'aq24-gible-couldnt-aim',
  AQ25: 'aq25-gliscor-stayed',
  AQ26: 'aq26-scalchop',
  AQ27: 'aq27-snivy-left',
  AQ28: 'aq28-tepig-waited',
  AQ29: 'aq29-seamstress',
  AQ30: 'aq30-sunglasses',
};

export const PLACEMENT: Record<string, Place> = {
  'aq24-gible-couldnt-aim': { shape: 'Stage-Three', earliest: 'A4', home: 6, sits: 'optional', tags: ['cave'], level: 'A+0', beats: ['aq24-the-pond', 'aq24-the-road', 'aq24-saw-it'], note: 'Steps 6, 12, 17: it misses three times. The step-17 fight is A+0.' },
  'aq25-gliscor-stayed': { shape: 'Companion', earliest: 'A5', home: 10, window: [7, 13], sits: 'optional', tags: ['high'], beats: ['aq25-wont-look', 'aq25-three-metres', 'aq25-the-wind', 'aq25-over-the-tent', 'aq25-a-reason', 'aq25-stay-to-train'], note: 'Farewell story. Turning point two stages on (Step 13), farewell four stages on (Step 17); the player always chooses.' },
  'aq26-scalchop': { shape: 'Single', earliest: 'A1', home: 5, window: [3, 8], sits: 'optional', attaches: 'rest', tags: ['water'], level: 'A-1', beats: ['aq26-river-shell', 'aq26-river-cap', 'aq26-river-basculin'], note: 'Met at a + node if one is near (a Pokémon Center). "Search the river" takes the next three nodes on the path, one scene each. The Basculin is A-1.' },
  'aq27-snivy-left': { shape: 'Companion', earliest: 'A2', home: 6, window: [4, 9], sits: 'optional', tags: ['forest'], level: 'A+1', beats: ['aq27-above-everyone', 'aq27-an-understanding', 'aq27-one-branch-lower', 'aq27-the-book', 'aq27-it-decides', 'aq27-badly'], note: 'Its test is A+1, one on one. Turning point two stages on (Step 13): the old trainer, A+0.' },
  'aq28-tepig-waited': { shape: 'Companion', earliest: 'A2', home: 5, window: [3, 8], sits: 'optional', beats: ['aq28-too-fast', 'aq28-another-post', 'aq28-sneeze', 'aq28-in-front-of-him', 'aq28-walk-away'], note: 'Any stage. It is tied to a post. Turning point two stages on (Step 13): its old trainer\'s new Pokémon.' },
  'aq29-seamstress': { shape: 'Companion', earliest: 'A2', home: 7, window: [4, 10], sits: 'optional', tags: ['forest'], beats: ['aq29-sewaddle-asks', 'aq29-a-patch', 'aq29-measuring', 'aq29-cold-night', 'aq29-a-coat'], note: 'The companion is the Leavanny\'s Sewaddle, met two nodes on after "Help it sew." Turning point two stages after it joins.' },
  'aq30-sunglasses': { shape: 'Stage-Three', earliest: 'A3', home: 6, sits: 'optional', tags: ['hot'], beats: ['aq30-again', 'aq30-last-stand', 'aq30-fourth'], note: 'Steps 6, 12, 17: it follows. Its fights are A+0; the fourth, as a Krokorok, A+1.' },
};

/** Doc choices that are not buttons (questline -> label -> reason). */
export const NOT_A_BUTTON: Record<string, Record<string, string>> = {};

/** Questline -> the date its doc was re-read line by line against these events. */
export const CHECKED: Record<string, string> = { AQ24: '2026-11-15', AQ25: '2026-11-15', AQ26: '2026-11-15', AQ27: '2026-11-15', AQ28: '2026-11-15', AQ29: '2026-11-15', AQ30: '2026-11-15' };

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
  AQ26: [
    'The Oshawott "fights it itself, unarmed": it has not joined yet, so it fights as a loaned ally beside your lead in a double battle against the Basculin and a second Basculin from its school (an ally needs two foes). It joins after the fight, won or lost.',
    'The three river scenes open on the next three nodes but do not need those nodes to be river nodes.',
    'If the real scalchop is found later ("Treasure Beach; a Lost and Found; the Night Market"), the scene reads flag aq26-real-scalchop-found, which the threads that own those events must set.',
  ],
  AQ27: [
    'Its test cannot grade your calls: a win brings it with +10 friendship; a loss brings it anyway, as the doc\'s "lose, with good calls" (bad calls are not detected).',
    '"Ask about its trainer" ends in the doc at "He\'s still looking for it"; a follow-up scene lets you take it in or leave it on its branch.',
    '"It chose to leave." gives it +1 Bond before it decides (it heard you speak for it); the doc gives that choice no effect of its own.',
  ],
  AQ28: [
    'The doc\'s short script has only the meeting; the small scenes and the turning point (its fight with the old trainer\'s new Pokémon, after which it evolves into Pignite) are written to the Companion rule and the doc\'s reward line.',
    'Remembers "has done AQ5 (Charmander in the rain)" reads flag aq05-charmander-met, which the AQ5 thread must set, together with a Charmander-line Pokémon in the party.',
    'In the turning-point fight your first Fire-type leads; if that is not the Tepig, the fight still counts as its own.',
  ],
  AQ29: [
    '"Let it." gives a Leaf Scarf (held: Sp. Def +5%) to the Bag rather than fitting it on the measured Pokémon; the player puts it on. "A Sewaddle in a scarf" likewise joins with a Leaf Scarf in the Bag.',
    'Remembers aq.leavanny.helped ("its Sewaddle asks to come") happens two nodes after the sewing; the doc does not say when.',
    'The doc\'s short script has only the meeting; the small scenes and the turning point (it evolves into Leavanny sewing a coat for a Pichu in the snow) are written to the Companion rule.',
  ],
  AQ30: [
    'The doc writes one scene; the second and third beats (it follows and challenges again, at Steps 12 and 17) are written to the Stage-Three shape, so the three wins needed for Krokorok are one per beat.',
    '"Get it new sunglasses." costs 300 (the doc gives no price), so it needs that much money.',
  ],
};

const CAVE = tagTypes('cave');
const HIGH = tagTypes('high');
const SEA = tagTypes('water');
const WOOD = tagTypes('forest');
const HOT = tagTypes('hot');

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

// ---------------- AQ28 pieces ----------------
const WAIT_TEXT = 'You sit down by the post. Nell shares her berries. Hours pass; the shadows swing all the way round. At dusk a trainer comes up the road in a sharp jacket, a Scrafty swaggering at his side. The Tepig stands up so fast the post rattles. He glances down. "Still here? Go on. Shoo. I\'ve got a real one now." He walks on. The Tepig watches him all the way out of sight. Then it lies down and puts its chin on your boot.';
const FIND_TEXT = 'You find him at the battle club in town, showing his new Scrafty to anyone who will look. You tell him about the post. He laughs. He laughs for a long time. "That thing? Thought it\'d have wandered off by now." When you get back, Nell has untied it. The Tepig did not hear him laugh. But it looks at your face, and it knows, and when you walk away from the post it walks with you.';

// ---------------- AQ30 pieces ----------------
const FOLLOWS = [flag('aq30-follows'), later('aq30-again', 5)];
const KROKOROK_JOINS = [gain('krokorok', { bond: 20 }), flag('aq30-joined'), flag('aq30-krokorok'), moment('The Sandile in sunglasses lost to you three times, became a Krokorok on the spot, and challenged you a fourth time, properly. Then it came with you.', 65)];

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
  // ---------------- AQ26. The Scalchop ----------------
  ev('aq26-scalchop', 'The Scalchop', AQ, { rarity: 'uncommon', minStage: stageOf('A1'), types: SEA, cast: ['trainer.pr/doctor_f'], pokemon: 'oshawott', tint: '#1c2a3c', effect: 'rattle' },
    'An Oshawott is flat on its back on the Pokémon Center floor, arms out, wailing. There is a pale round patch on its belly where something has always been, and is not. It cries. Loudly. The whole Center is staring. The nurse leans over the counter and shouts above the noise. "Since six this morning! It won\'t be picked up! It keeps patting the place!" It pats the place. It finds it empty. It starts again, louder.',
    [
      ch('Search the river.', out('"It lost it by the river?" The nurse nods hard. The Oshawott stops mid-wail, one eye open. You hold the door. It gets up, sniffing, and trots out after you, patting its belly every few steps in case the scalchop has come back by itself. The river runs beside the road for the next three stretches. You will search them all.', flag('aq26-searching'), later('aq26-river-shell', 1))),
      ch('Make it a new one.', out('You sit at the Center table with a flat shell, a scrap of driftwood and a coin, and you carve. It takes an hour. When you hold it out, the Oshawott looks at it. It looks at you. It pushes it away with one foot. A minute passes. It pulls it back with the same foot. It tries it on. It is wrong. It is the wrong size and the wrong colour and the wrong everything. It keeps it on. When you leave, it leaves with you, holding it in place with one paw.',
        gain('oshawott', { bond: 10 }), flag('aq26-met'), flag('aq26-new-scalchop'), moment('You carved an Oshawott a new scalchop. It was wrong. It kept it on.', 50))),
      ch('Comfort it.', out('You sit down on the Center floor. It climbs into your lap without being asked and cries into your coat for some time, great shuddering sobs, until the nurse brings you both a tissue. Then it stops. It wipes its nose. It gets down. It marches to the door, and looks back at you, and waits. It is going to find the thing itself, and it would like you to come.', flag('aq26-comforted'), flag('aq26-searching'), later('aq26-river-shell', 1))),
    ]),
  // Three river nodes, the next three on the path.
  ev('aq26-river-shell', 'The Wrong Shell', AQ, { room: true, requires: [flagIs('aq26-searching')], pokemon: 'oshawott', tint: '#1c2a3c', effect: 'none',
    remembers: [{ id: 'leading', when: [flagIs('aq26-comforted')], notice: 'It walks in front, nose down, as if it were the one who had hired you.' }] },
    'The first stretch of river. The Oshawott wades along the shallows, patting stones. Suddenly it dives, and comes up with a shell: round, pale, about the right size. It holds it to its belly. It holds it there for a long, hopeful moment.',
    [
      ch('Keep looking.', out('It is the wrong shell. You can both tell. It looks at the thing with real contempt, as if the shell has tried to trick it, and throws it back in the river. Then it squares its shoulders and walks on downstream, patting its belly as it goes.', flag('aq26-river-1'), later('aq26-river-cap', 1))),
    ]),
  ev('aq26-river-cap', 'Something on Its Head', AQ, { room: true, requires: [flagIs('aq26-river-1')], pokemon: 'corphish', tint: '#1c2a3c', effect: 'none',
    remembers: [{ id: 'leading', when: [flagIs('aq26-comforted')], notice: 'It is the Oshawott that spots it first, and it is already running.' }] },
    'The second stretch. A Corphish is sitting on a rock in the middle of the current, and it is wearing something round and pale on its head. The Oshawott goes rigid. Then it charges into the water with a battle cry, and the Corphish raises its claws, very confused.',
    [
      ch('Apologise to the Corphish.', out('You get there just as the Oshawott snatches the thing off its head. It is a bottle cap. The Oshawott stares at it. The Corphish stares at the Oshawott. You apologise to the Corphish. The Oshawott, after a pause, apologises too, with a small stiff bow, and gives the bottle cap back. The Corphish puts it back on. Everyone is very polite. Downstream, the water goes deeper.', flag('aq26-river-2'), later('aq26-river-basculin', 1))),
    ]),
  ev('aq26-river-basculin', 'The Snail Cracker', AQ, { room: true, requires: [flagIs('aq26-river-2')], pokemon: 'basculin', tint: '#16242e', effect: 'rattle',
    remembers: [{ id: 'leading', when: [flagIs('aq26-comforted')], notice: 'You did not find it. The Oshawott did. It is already in the water.' }] },
    'The third stretch, where the river runs deep and green under a bank. A Basculin is there with a friend, and it has something in its teeth: round and pale, with a little ridge along the edge. It is using it to crack snails against a stone. Crack. Crack. The Oshawott makes a sound you have never heard a Pokémon make. Then it walks into the river with no weapon at all, and it is braver than anything has a right to be.',
    [
      ch('Fight beside it.', fight('The Oshawott squares up to both Basculin, chin high, paws empty. You send your lead in beside it.',
        duel('The Basculin', { size: 2, lv: -1, ally: 'oshawott', win: [flag('aq26-basculin-beaten'), room('aq26-scalchop-back')] }, { lineup: ['basculin', 'basculin'], spritePokemon: 'basculin', lose: [flag('aq26-basculin-won'), room('aq26-scalchop-back')] }))),
    ]),
  ev('aq26-scalchop-back', 'It Salutes', AQ, { room: true, pokemon: 'oshawott', tint: '#1c2a3c', effect: 'sparkle',
    remembers: [
      { id: 'found-it', when: [flagIs('aq26-comforted')], notice: 'It found it. You only came along. It knows that, and it knows you know.', hide: [0], addChoices: [
        ch('Salute back.', out('You salute back. It holds the salute a moment longer than you, because it can. Then it puts the scalchop away on its belly, pats it twice, and walks over to stand by your boot as if it has always stood there. It found the thing itself. It would like to find the next one with you.',
          gain('oshawott', { bond: 20 }), flag('aq26-met'), flag('aq26-real-scalchop'), moment('An Oshawott lost its scalchop, and went and found it itself. You were there.', 55))),
      ] },
      { id: 'lost', when: [flagIs('aq26-basculin-won')], notice: 'The Basculin won, but the Oshawott would not stop, and in the end it simply let go of the thing and swam off. It was only a snail tool to it.' },
    ] },
    'The scalchop comes up in the foam. The Oshawott catches it in both paws. It puts it on. It checks it. It checks it again. Then it turns round to you, draws it from its belly like a sword, and salutes.',
    [
      ch('Salute back.', out('You salute back. It holds the salute a moment longer than you, because it can. Then it puts the scalchop away on its belly, pats it twice, and walks over to stand by your boot as if it has always stood there.',
        gain('oshawott', { bond: 10 }), flag('aq26-met'), flag('aq26-real-scalchop'), moment('You found an Oshawott\'s scalchop in a Basculin\'s teeth. It saluted.', 50))),
      ch('Let it go home.', leave('You wave it back toward the Center and the nurse who has been worrying since six. It looks at you, and at the road, and goes, checking its scalchop every few steps. At the bend it turns and salutes once more.')),
    ]),
  // Small scenes, at rests: one each time its Bond rises a step, while it is in the party.
  ev('aq26-one-paw', 'One Paw on It', AQ, { callback: true, requires: [flagIs('aq26-met'), line('oshawott', 1), age('aq26-met', 1)], pokemon: 'oshawott', tint: '#1c2a3c', effect: 'none' },
    'Camp, late. Everyone is asleep. The Oshawott is asleep too, flat on its back the way it was on the Center floor. But this time it is not wailing. One paw rests on the scalchop, and every so often, in its sleep, it pats it.',
    [
      ch('Pull the blanket up.', out('You tuck the blanket round it, careful of the paw. It does not wake. It pats the scalchop, and then, still asleep, pats your hand, as if checking that is still there too.', bondLine('oshawott', 5), flag('aq26-scene-1'))),
      ch('Leave it as it is.', out('You leave it be. Near dawn it rolls over without letting go, and ends up hugging the scalchop with both arms, snoring, very content. You do not wake it until you have to.', bondLine('oshawott', 5), flag('aq26-scene-1'))),
    ]),
  ev('aq26-four-seconds', 'Four Seconds', AQ, { callback: true, requires: [seen('aq26-one-paw'), line('oshawott', 2)], pokemon: 'oshawott', tint: '#1c2a3c', effect: 'none' },
    'At a rest stop the Oshawott walks up to {lead}, takes the scalchop off its belly, and holds it out. A loan. To look at. It is very solemn about it.',
    [
      ch('Watch it count.', out('{lead} takes the scalchop, very carefully. The Oshawott counts out loud on its claws. One. Two. Three. Four. At four it takes it back, polishes it, and puts it away. It looks extremely proud of itself. That was four whole seconds.', bondLine('oshawott', 5), flag('aq26-scene-2'))),
      ch('Ask to hold it too.', out('It looks at you for a long time. Then it holds it out to you as well. You get three seconds. It counts them out loud, fast. But you got them.', bondLine('oshawott', 5), flag('aq26-scene-2'))),
    ]),
  ev('aq26-own-head', 'On Its Own Head', AQ, { callback: true, requires: [seen('aq26-four-seconds'), line('oshawott', 3)], pokemon: 'oshawott', tint: '#1c2a3c', effect: 'rattle' },
    'A wail goes up from the edge of camp, the old wail, the Center wail. The Oshawott is turning in circles, patting its belly. The pale patch is bare. It has lost it again. Everyone stops what they are doing. The scalchop is on its own head. It has been on its own head the whole time.',
    [
      ch('Point at its head.', out('You point. It stops. It reaches up. It finds the scalchop. It takes it down and looks at it as if it has never seen it before, and then at you, and then it laughs, a small embarrassed squeak, and hides its face behind it.', bondLine('oshawott', 5), flag('aq26-scene-3'))),
      ch('Help it look.', out('You search the whole camp with it, very seriously, under every bag. Your team joins in. Finally {lead} reaches up and lifts it off its head and hands it over. It stares. Then it hugs {lead}, and then you, scalchop and all.', bondLine('oshawott', 5), flag('aq26-scene-3'))),
    ]),
  // If the real one turns up after all (Treasure Beach, a Lost and Found, the Night Market).
  ev('aq26-both-scalchops', 'Which Is Which', AQ, { callback: true, requires: [flagIs('aq26-new-scalchop'), flagIs('aq26-real-scalchop-found'), line('oshawott')], pokemon: 'oshawott', tint: '#1c2a3c', effect: 'sparkle' },
    'The real scalchop. It was there among the other things, round and pale with its little ridge, and the Oshawott saw it before you did and went very quiet. Now it is holding two: the real one and the wrong one you carved for it. It looks from one to the other for a long time.',
    [
      ch('Ask which is which.', out('It puts them both on, one over the other. It pats them. It will not say which is on top. When you ask again, it looks at you as if that is a very strange question, and pats them both again, and walks on.', bondLine('oshawott', 5), flag('aq26-wears-both'), moment('Your Oshawott wears two scalchops, one over the other. It will not say which is which.', 50))),
    ]),
  // ---------------- AQ27. The Snivy Who Left Its Trainer ----------------
  ev('aq27-snivy-left', 'The Snivy Who Left Its Trainer', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: WOOD, pokemon: 'snivy', tint: '#1a2a1a', effect: 'none' },
    'A Snivy is lying along a branch above the path, chin on its hands, eyes half shut. It is alone. It left its trainer because he was useless, and it has not missed him once, or so its face says. It watched your last battle from up there, every move of it. It has formed a view. Now it opens its eyes a little wider and looks down at you, as if to ask whether you are useless too.',
    [
      ch('Battle it.', fight('It drops from the branch and lands without a sound, one on one, and stronger than it looks. It opens with Attract and watches what you do about it. Then Leaf Storm, and it watches again. It is not judging the win. It is judging the calls.',
        monDuel('The Snivy', 'snivy', 1, { foeMoves: ['attract', 'leaf-storm'], win: [gain('snivy', { bond: 10 }), flag('aq27-met'), flag('aq27-tested')], lose: [gain('snivy'), flag('aq27-met'), flag('aq27-tested'), flag('aq27-test-lost')] }))),
      ch('Leave it be.', out('You nod to it and walk on. Behind you, four branches back, a rustle. Then three branches back. Then two. When you turn round it is lying on a branch with its eyes shut, as if it has been there all day and has never heard of you. It is following you. It will deny it to the end of the road. At camp that night it is sitting on your pack.',
        gain('snivy'), flag('aq27-met'), flag('aq27-followed'))),
      ch('Ask about its trainer.', out('It does not look at you. It points with its tail, lazily, down the path. A boy is coming along it with a net and a great many scratches, peering into every bush, calling a name over and over until his voice cracks. He is still looking for it. The Snivy watches him pass right underneath, and shuts its eyes.',
        flag('aq27-boy-seen'), room('aq27-after-asking'))),
    ]),
  ev('aq27-after-asking', 'Out of Sight', AQ, { room: true, requires: [flagIs('aq27-boy-seen')], pokemon: 'snivy', tint: '#1a2a1a', effect: 'none' },
    'The boy\'s voice fades round the bend. The Snivy opens its eyes once he is out of sight, and looks at the place where he was for a long time. Then it looks at you, and something in its face says the matter is closed. It is waiting to see what you will do about that.',
    [
      ch('Let it come.', out('You hold out an arm. It ignores the arm, drops onto your shoulder instead, and settles there as if it chose the shoulder and not you. Down the path, very faintly, the boy is still calling. It does not turn its head.', gain('snivy'), flag('aq27-met'))),
      ch('Leave it on its branch.', leave('You leave it where it is. When you look back from the bend, it is still watching the way the boy went.')),
    ]),
  // Small scenes, at rests: one each time its Bond rises a step, while it is in the party.
  ev('aq27-above-everyone', 'Above Everyone', AQ, { callback: true, requires: [flagIs('aq27-met'), line('snivy', 1), age('aq27-met', 1)], pokemon: 'snivy', tint: '#1a2a1a', effect: 'none' },
    'Camp. Your Pokémon are in a heap round the fire. The Snivy is not. It is sitting apart, on a rock taller than anyone else\'s rock, arms folded, watching the heap with the expression of someone who has been invited to a party they consider beneath them.',
    [
      ch('Leave it up there.', out('You leave it be. Much later, when the fire is low, you notice that the rock it chose is the one closest to you. You do not mention it. It would only move.', bondLine('snivy', 5), flag('aq27-scene-1'))),
      ch('Bring it some food.', out('You take a bowl up to the rock. It looks at the bowl as if it is beneath it, too. When you come back for the bowl, it is empty and very clean, and the Snivy is looking the other way.', bondLine('snivy', 5), flag('aq27-scene-1'))),
    ]),
  ev('aq27-an-understanding', 'An Understanding', AQ, { callback: true, requires: [seen('aq27-above-everyone'), line('snivy', 2)], pokemon: 'snivy', tint: '#1a2a1a', effect: 'none' },
    'A road battle, and you make a bad call: the wrong switch, a turn too late, and {lead} takes a hit it did not need to take. The Snivy says nothing. It looks at {lead}. {lead} looks at the Snivy. Something passes between them that you are not part of.',
    [
      ch('Say it was a bad call.', out('"That was a bad call," you say, out loud, to both of them. The Snivy turns its head and looks at you properly for the first time all day. It nods, very slightly. A useless trainer never says that.', bondLine('snivy', 5), flag('aq27-scene-2'))),
      ch('Say nothing.', out('You say nothing and rub {lead}\'s head. Later you catch the two of them sitting together, the Snivy talking in low sharp chirps, {lead} nodding. They have an understanding. You suspect it is about you, and that it is not all bad.', bondLine('snivy', 5), flag('aq27-scene-2'))),
    ]),
  ev('aq27-one-branch-lower', 'One Branch Lower', AQ, { callback: true, requires: [seen('aq27-an-understanding'), line('snivy', 3)], pokemon: 'snivy', tint: '#1a2a1a', effect: 'none' },
    'A road battle, and this time you make a good call: the right switch at the right moment, and the fight turns on it. The Snivy does not react at all. Later, at camp, it is sitting in its tree as usual. But it is sitting one branch lower than it was yesterday.',
    [
      ch('Pretend not to notice.', out('You pretend not to notice. It pretends not to notice you pretending. In the morning it is still on the lower branch, and it gets down from it onto your shoulder without any fuss at all.', bondLine('snivy', 5), flag('aq27-scene-3'))),
      ch('Say goodnight to it.', out('"Goodnight," you say, to the lower branch. There is a long pause. Then a small sharp chirp comes down out of the dark: goodnight, and also, you think, that was a good call.', bondLine('snivy', 5), flag('aq27-scene-3'))),
    ]),
  // The turning point: two stages after the meeting. The old trainer.
  ev('aq27-the-book', 'The Boy With the Book', AQ, { callback: true, minStage: stageOf('A4'), requires: [flagIs('aq27-met'), age('aq27-met', 2), line('snivy')], types: WOOD, cast: ['trainer.bug_catcher'], pokemon: 'patrat', tint: '#1a2a1a', effect: 'none',
    remembers: [
      { id: 'boy-seen', when: [flagIs('aq27-boy-seen')], notice: 'You know him. He is the boy who walked under its branch that first day, calling its name, while it shut its eyes.' },
      { id: 'tested', when: [flagIs('aq27-tested')], notice: 'The Snivy once tested you, one on one, to see what your calls were worth. It is looking at him now the same way.' },
      { id: 'followed', when: [flagIs('aq27-followed')], notice: 'It followed you four branches back once, and denied it. It is not denying anything now. It is very still.' },
    ] },
    'The boy with the net. He has a Pokémon now, a Patrat, which is doing exactly what it likes. He is thinner. He has found you. "That\'s mine," says Tomas Wooldridge. "I\'ve looked everywhere. I had no idea what I was doing. I know I didn\'t." He swallows. "I\'ve been reading. I\'ve got a book." He has. It is stuffed with a great many bits of paper. The Snivy looks at him. Then it looks at the book.',
    [
      ch('It chose to leave.', out('"It chose to leave," you say. "That was its call, and it was a good one." Tomas goes red. He does not argue. He holds the book tighter. The Snivy turns and looks at you, a long level look, because you spoke for it and not about it. Then it looks back at the boy. It is deciding.', bondLine('snivy', 5), flag('aq27-spoke-for-it'), room('aq27-it-decides'))),
      ch('Show me what you\'ve learned.', fight('He is still bad. He is bad in a new way: he is trying. He calls a switch a turn late, and then says, "No. Wait. That was late," out loud, to himself, and writes it down. The Snivy is watching him. Not the battle. Him.',
        duel('Tomas Wooldridge', { cls: 'bug-catcher', size: 1, team: ['patrat'], win: [flag('aq27-shown'), room('aq27-it-decides')] }, { lose: [flag('aq27-shown'), room('aq27-it-decides')] }))),
      ch('It\'s up to it.', out('"It\'s up to it," you say, and you step back, so there is nobody between the two of them. Tomas looks at the Snivy. The Snivy looks at Tomas. Neither of them says anything for a long time. It is deciding.', flag('aq27-left-to-it'), room('aq27-it-decides'))),
    ]),
  // The Snivy decides by its Bond with you: 3 or more, it stays; less, it goes back. Nothing is taken: it goes only if it wants to.
  ev('aq27-it-decides', 'The Snivy Decides', AQ, { room: true, pokemon: 'snivy', tint: '#1a2a1a', effect: 'none',
    remembers: [
      { id: 'stays', when: [line('snivy', 3)], hide: [1] },
      { id: 'goes', when: [line('snivy')], hide: [0] },
    ] },
    'The Snivy walks out into the space between you and the boy. It stops. It looks at you, and at Tomas, and at the book under his arm with all its bits of paper. Nobody tells it anything. This is its call.',
    [
      ch('Let it choose.', out('It walks to the boy. It reaches up and puts one vine flat on the book, and pushes it back at him, firmly: keep reading. Then it turns round and walks back to you and climbs to your shoulder without looking back. Tomas laughs, wet and surprised, and opens the book to a new page, and writes something down.',
        bondLine('snivy', 10), flag('aq27-stayed'), moment('The Snivy that left its useless trainer looked at his book, told him to keep reading, and stayed with you.', 70)), { requires: [line('snivy', 3)] }),
      ch('Let it choose.', out('It looks at you for a moment. It is not sorry. It is a little sorry. It drops something into your hand: a Miracle Seed, warm from being held. Then it walks to Tomas and climbs onto his shoulder, and taps the book with one vine, as if to say: from the start, then. They go off down the path, already arguing.',
        farewell('your Snivy (it goes back to Tomas)', ['snivy', 'servine', 'serperior']), item('miracle-seed'), flag('aq27-went-back'), moment('Your Snivy chose to go back to the boy with the book. It left you a Miracle Seed.', 65))),
    ]),
  // It went back: in a later stage, the boy is seen winning something, badly.
  ev('aq27-badly', 'Winning, Badly', AQ, { callback: true, requires: [flagIs('aq27-went-back'), age('aq27-went-back', 1)], cast: ['trainer.bug_catcher'], pokemon: 'snivy', tint: '#1a2a1a', effect: 'confetti' },
    'A small crowd at the edge of a town, and a cheer going up. A boy is winning something, badly: a little local cup, mostly by accident. It is Tomas, with his book open under one arm. The Snivy is on his shoulder with its eyes shut, completely unbearable, as if it had done all of it.',
    [
      ch('Cheer for them.', out('You cheer, loudly. Tomas sees you and waves the book. The Snivy opens one eye, finds you in the crowd, and shuts it again. But its tail flicks, once, which from a Snivy is a great deal.', flag('aq27-cheered'), moment('You saw Tomas win a little cup, badly, with your old Snivy on his shoulder.', 50))),
      ch('Watch from the back.', out('You watch from the back and do not let them see you. The Snivy sees you anyway; it always did. It does not open its eyes. It only lifts its chin a little higher, so you can see how well it is doing.', flag('aq27-cheered'))),
    ]),
  // ---------------- AQ28. The Tepig Who Waited ----------------
  ev('aq28-tepig-waited', 'The Tepig Who Waited', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: [], cast: ['trainer.pr/school_kid_f'], pokemon: 'tepig', tint: '#2a1c14', effect: 'none',
    remembers: [{ id: 'charmander', when: [flagIs('aq05-charmander-met'), line('charmander')], notice: 'Your Charmander walks up to the post without being asked and sits down beside it, tail flame held carefully away from the rope. Two Fire-types, side by side. Both of them were once left somewhere to wait.', addChoices: [
      ch('Let them sit together.', out('You let them. The Charmander leans, very slightly, until its shoulder touches the Tepig\'s. The Tepig goes stiff. Then it leans back. You undo the rope and the muzzle while they sit there, and it does not seem to notice, and when you stand up to go, both of them stand up too.',
        gain('tepig', { bond: 15 }), bondLine('charmander', 5), flag('aq28-met'), flag('aq28-sat-with-charmander'))),
    ] }] },
    'A Tepig is tied to a post at the edge of town, a muzzle strapped over its snout. Its trainer said he would be back. It has been waiting a long time. You can count its ribs. A girl in a school jumper is crouched beside it, pushing berries one at a time through the gap in the muzzle. She does not look up. "He\'s not coming back," Nell says. "I keep telling it. It keeps watching the road." The Tepig keeps watching the road.',
    [
      ch('Untie it.', out('You undo the knot. Nell helps with the muzzle buckle, which is stiff with rain. The Tepig shakes its head and snorts a tiny puff of smoke, its first in days. Then it sits back down exactly where it was, against the post, facing the road. It does not leave. The rope lies loose in the grass beside it.', flag('aq28-untied'), room('aq28-still-waiting'))),
      ch('Wait with it.', out(WAIT_TEXT, gain('tepig', { bond: 10 }), flag('aq28-met'), flag('aq28-waited'), flag('aq28-saw-him'))),
      ch('Find the trainer.', out(FIND_TEXT, gain('tepig', { bond: 5 }), flag('aq28-met'), flag('aq28-he-laughed'), flag('aq28-saw-him'))),
    ]),
  ev('aq28-still-waiting', 'Still Waiting', AQ, { room: true, requires: [flagIs('aq28-untied')], cast: ['trainer.pr/school_kid_f'], pokemon: 'tepig', tint: '#2a1c14', effect: 'none' },
    'Free, the Tepig is exactly where it was when it was tied. It is not the rope that kept it at the post. Nell sits back on her heels. "See?" she says, very quietly. "It\'s not the rope." The road is empty in both directions.',
    [
      ch('Wait with it.', out(WAIT_TEXT, gain('tepig', { bond: 10 }), flag('aq28-met'), flag('aq28-waited'), flag('aq28-saw-him'))),
      ch('Find the trainer.', out(FIND_TEXT, gain('tepig', { bond: 5 }), flag('aq28-met'), flag('aq28-he-laughed'), flag('aq28-saw-him'))),
      ch('Leave it with Nell.', leave('"I\'ll keep feeding it," Nell says. "Somebody has to." When you look back from the bend, they are both sitting by the post, watching the road.')),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq28-too-fast', 'Too Fast', AQ, { callback: true, requires: [flagIs('aq28-met'), line('tepig', 1), age('aq28-met', 1)], pokemon: 'tepig', tint: '#2a1c14', effect: 'none' },
    'Dinner at camp. The Tepig eats as if somebody is going to take the bowl away: head down, fast, one eye on the dark. It finishes before anyone else has started. Then it sits by the empty bowl and watches the others eat, very still, not asking.',
    [
      ch('Sit with it while it eats.', out('Next meal you sit down beside it with your own bowl and eat slowly, very slowly, and do not look at it. Halfway through, it slows down too. Nobody takes anything. By the end it is the last to finish, and it seems surprised.', bondLine('tepig', 5), flag('aq28-scene-1'))),
      ch('Give it a second bowl.', out('You fill the bowl again without a word. It looks at the bowl, and at you, as if this were a trick it has not been taught. Then it eats the second one slowly, and falls asleep with its nose in it.', bondLine('tepig', 5), flag('aq28-scene-1'))),
    ]),
  ev('aq28-another-post', 'Another Post', AQ, { callback: true, requires: [seen('aq28-too-fast'), line('tepig', 2)], pokemon: 'tepig', tint: '#2a1c14', effect: 'none' },
    'A town, and a hitching post outside a shop, just a post with a ring on it. The Tepig stops dead in front of it. It does not move. It is not looking at the post. It is looking at the road beyond it.',
    [
      ch('Wait until it\'s ready.', out('You wait, beside it, as long as it takes. It takes a long time. Then it turns its back on the post, carefully, and presses its side against your leg, and the two of you go into the shop together.', bondLine('tepig', 5), flag('aq28-scene-2'))),
      ch('Walk on with it.', out('"Come on," you say, and walk on. Three steps. Four. Behind you, a scrabble of hooves. It catches up, and walks so close to your heels that you nearly trip, and does not look back at the post again.', bondLine('tepig', 5), flag('aq28-scene-2'))),
    ]),
  ev('aq28-sneeze', 'A Sneeze', AQ, { callback: true, requires: [seen('aq28-another-post'), line('tepig', 3)], pokemon: 'tepig', tint: '#3a2414', effect: 'fire' },
    'Morning, and the Tepig sneezes. A proper fireball comes out of its snout and sets light to the edge of your map. It stares at the flame. Nobody ever let it do that with the muzzle on. It sneezes again, on purpose this time, and its whole face lights up brighter than the fire.',
    [
      ch('Laugh with it.', out('You stamp out the map and laugh, and it laughs too, a squealing snorting laugh, and sneezes again, and you have to stamp that out too. It spends the whole morning sneezing at things. It has never been so pleased with itself.', bondLine('tepig', 5), flag('aq28-scene-3'))),
      ch('Toast something on it.', out('You hold out a stick with a berry on the end. It looks at the berry. It sneezes. The berry is toasted to perfection. It eats it, very proud, and then lines up every berry in your bag and toasts them one by one.', bondLine('tepig', 5), flag('aq28-scene-3'))),
    ]),
  // The turning point: two stages after the meeting. It defeats its old trainer's new Pokémon, in front of him.
  ev('aq28-in-front-of-him', 'In Front of Him', AQ, { callback: true, minStage: stageOf('A4'), requires: [flagIs('aq28-met'), age('aq28-met', 2), line('tepig')], cast: ['trainer.pr/ace_trainer_m'], pokemon: 'scrafty', tint: '#2a1c14', effect: 'fire',
    remembers: [
      { id: 'saw-him', when: [flagIs('aq28-saw-him')], notice: 'It knows him. The last time it saw him he was telling it to go away. It is not watching the road now. It is watching him.' },
      { id: 'charmander', when: [flagIs('aq28-sat-with-charmander'), line('charmander')], notice: 'Your Charmander steps up beside it, the way it sat beside it at the post. The Tepig shakes its head. This one is its own.' },
    ] },
    'Outside a battle club, a trainer in a sharp jacket is showing off his Scrafty to a ring of kids. Corwin Haskett. He sees the Tepig at your heel and grins. "Is that my old one? The one that waited?" He laughs. "Tied it to a post and it just stayed there. Couldn\'t even run off right." The Tepig steps out in front of you. It is not shaking. Smoke curls out of its nose.',
    [
      ch('Let it fight.', fight('"Go on, then," Corwin says, still grinning. "Scrafty, teach it something." The Tepig plants its feet and does not wait for anyone to tell it anything.',
        duel('Corwin Haskett', { cls: 'ace-trainer', size: 1, team: ['scrafty'], win: [evolve('tepig', 'pignite'), bondLine('tepig', 10), flag('aq28-turned'), flag('aq28-beat-him'), room('aq28-walk-away')] }, { rule: { leadType: 'fire' }, lose: [flag('aq28-turned'), room('aq28-walk-away')] }))),
      ch('Walk on.', out('You turn to go. The Tepig does not move at once. It looks at Corwin for a long moment, the way it used to look at the road. Then it turns its back on him, deliberately, and trots after you. Behind you the grin slides off his face. He does not know why. The Tepig does.', bondLine('tepig', 5), flag('aq28-turned'), flag('aq28-walked-on'), room('aq28-walk-away'))),
    ]),
  ev('aq28-walk-away', 'Walking Away', AQ, { room: true, requires: [flagIs('aq28-turned')], pokemon: 'tepig', tint: '#3a2414', effect: 'sparkle',
    remembers: [{ id: 'beat-him', when: [flagIs('aq28-beat-him')], intro: 'The Scrafty is down. Corwin is staring, mouth open, at the Pokémon that knocked it out: bigger now, round and blazing, a Pignite with fire round its belly like a belt. The kids have gone silent. Then one of them starts clapping, and they all do. Your Pignite does not look at him. It looks at you.' }] },
    'The battle club is behind you. Corwin is still standing outside it. The Tepig walks beside you, close, the way it walks now, and it does not look back once. It does not need to watch any road any more.',
    [
      ch('Walk on together.', out('You walk on together. At the edge of town there is a post with a ring on it. It walks straight past.', flag('aq28-free'), moment('The Tepig that waited at a post stood in front of its old trainer, and then walked away with you.', 70))),
    ]),
  // ---------------- AQ29. The Seamstress ----------------
  ev('aq29-seamstress', 'The Seamstress', AQ, { rarity: 'uncommon', minStage: stageOf('A2'), types: WOOD, pokemon: 'leavanny', tint: '#1c2a14', effect: 'none' },
    'A forest where every baby Pokémon is dressed. A Pidgey chick in a cap of folded leaf. Two Caterpie in matching waistcoats. In a clearing a Leavanny is sewing, all four arms busy, a tiny coat taking shape in its lap for a Pichu that sits beside it, shivering. It bites off the last thread and buttons the Pichu in. The Pichu stops shivering at once. Then the Leavanny looks up, finds your smallest Pokémon, and starts measuring it with a length of silk.',
    [
      ch('Let it.', out('Your smallest Pokémon stands very still, chin up, while the Leavanny measures its neck twice and its chest once and hums. Four arms fly. A leaf scarf, stitched in silk so fine you cannot see it, is wound twice round its neck and tucked in. It fits perfectly. Your Pokémon will not stop looking at itself in every puddle on the way out of the forest.',
        item('leaf-scarf'), flag('aq-leavanny-scarf'), moment('A Leavanny in a forest of dressed babies sewed your smallest Pokémon a leaf scarf.', 45))),
      ch('Help it sew.', out('You sit down in the clearing and hold the leaves while it cuts. It shows you a stitch, patiently, three times. By evening you have made three garments between you: a hat for an Oddish, mittens for a Sandshrew, a very small jacket for a Joltik. Your stitches are terrible. It keeps them in anyway. All afternoon a Sewaddle in a hood has been watching you from a leaf above, not blinking.',
        flag('aq-leavanny-helped'), later('aq29-sewaddle-asks', 2))),
      ch('Ask it to come.', out('You ask it. It understands; it stops sewing. It looks at you for a long time. Then it looks at the Pichu in its new coat, and the Pidgey chick in its cap, and the two Caterpie, and all the others in the clearing who were cold before it came. It puts one arm on your hand, gently. It cannot leave them. It goes back to its sewing, and you can see it is sorry.',
        flag('aq29-asked'))),
    ]),
  // Remembers aq.leavanny.helped: its Sewaddle asks to come.
  ev('aq29-sewaddle-asks', 'A Sewaddle in a Hood', AQ, { room: true, requires: [flagIs('aq-leavanny-helped')], pokemon: 'sewaddle', tint: '#1c2a14', effect: 'none' },
    'Two stretches of road from the forest, something drops onto your pack from an overhanging branch. It is the Sewaddle in the hood, the one that watched you all afternoon. It has followed you the whole way. It has brought a scarf it sewed itself, crooked, from a leaf much too big for it, with stitches almost as terrible as yours. It holds the scarf out to you, and then it holds itself out too. It is asking to come.',
    [
      ch('Take it with you.', out('You wind its crooked scarf round its neck and it beams. It climbs into the top of your pack, among your things, and immediately starts mending the lining. Somewhere behind you in the forest, you suspect, a Leavanny knew exactly where it was going, and let it.',
        gain('sewaddle', { bond: 10 }), item('leaf-scarf'), flag('aq29-met'), moment('A Sewaddle followed you out of the forest of dressed babies, in a hood and a crooked scarf, and asked to come.', 55))),
      ch('Send it home.', leave('You lift it down and point it back the way it came. It looks at you for a long moment, holding its scarf. Then it goes, slowly, wearing the scarf, so at least that came with you a little way.')),
    ]),
  // Small scenes: one each time its Bond rises a step, while it is in the party.
  ev('aq29-a-patch', 'A Patch', AQ, { callback: true, requires: [flagIs('aq29-met'), line('sewaddle', 1), age('aq29-met', 1)], pokemon: 'sewaddle', tint: '#1c2a14', effect: 'none' },
    'Your bag has had a hole in the bottom corner since the first region. Things fall out of it. This morning things do not fall out of it. There is a patch over the hole: a leaf, sewn on with silk so neat you can barely see the stitches. The Sewaddle is pretending to be asleep.',
    [
      ch('Thank it.', out('"Thank you," you say, to the pretending. One eye opens. It looks very pleased, and very busy, and it closes the eye again so you will not see how pleased.', bondLine('sewaddle', 5), flag('aq29-scene-1'))),
      ch('Show it another tear.', out('You hold up your sleeve, where the cuff has frayed. It is awake instantly. By lunch the cuff is mended and so is the other cuff, and your collar, and a sock you did not know had a hole.', bondLine('sewaddle', 5), flag('aq29-scene-1'))),
    ]),
  ev('aq29-measuring', 'Measuring', AQ, { callback: true, requires: [seen('aq29-a-patch'), line('sewaddle', 2)], pokemon: 'sewaddle', tint: '#1c2a14', effect: 'none' },
    'At night the Sewaddle goes round the camp with a thread of silk, measuring your Pokémon while they sleep. Neck, chest, the length of a tail. It writes nothing down. It remembers. When it gets to {lead}, {lead} wakes up and stares at it.',
    [
      ch('Hold still for it.', out('You lie down beside {lead} and hold still, very obviously, to show how it is done. {lead} sighs and holds still too. The Sewaddle measures you both, very solemnly, and then curls up between you and goes to sleep with the thread still in its mouth.', bondLine('sewaddle', 5), flag('aq29-scene-2'))),
      ch('Let them sort it out.', out('{lead} growls. The Sewaddle does not move. It holds up the thread, patient. After a long standoff, {lead} lies back down and lets itself be measured, grumbling. In the morning there is a leaf hat beside its head, in exactly its size.', bondLine('sewaddle', 5), flag('aq29-scene-2'))),
    ]),
  ev('aq29-cold-night', 'A Cold Night', AQ, { callback: true, requires: [seen('aq29-measuring'), line('sewaddle', 3)], pokemon: 'sewaddle', tint: '#141c24', effect: 'snow' },
    'The coldest night of the run so far. Frost on the tent. Your Pokémon have packed themselves into one shivering heap. The Sewaddle is not in the heap. It is outside in the cold, by the last of the fire, sewing as fast as it can with leaves gone stiff with frost.',
    [
      ch('Hold the leaves.', out('You go out and hold the leaves for it, the way you once held them for a Leavanny in a forest. It works all night. By dawn there is a blanket of leaves over the whole heap, and over you. It crawls under the edge of it last, and falls asleep with its head on your arm.', bondLine('sewaddle', 5), flag('aq29-scene-3'))),
      ch('Let it work.', out('You leave it to it and watch from the tent door. It works all night without stopping. By dawn there is a blanket of leaves over the whole heap. It looks at the heap. It looks at you. It is, you realise, waiting to be told it is good. You tell it.', bondLine('sewaddle', 5), flag('aq29-scene-3'))),
    ]),
  // The turning point: two stages after it joined. It becomes the seamstress.
  ev('aq29-a-coat', 'A Coat for Someone Else', AQ, { callback: true, minStage: stageOf('A4'), requires: [flagIs('aq29-met'), age('aq29-met', 2), line('sewaddle')], types: WOOD, pokemon: 'pichu', tint: '#141c24', effect: 'snow',
    remembers: [{ id: 'helped', when: [flagIs('aq-leavanny-helped')], notice: 'It sews the way its parent sewed in the forest, the way it watched you try to, all those terrible stitches ago.' }] },
    'Snow by the road, and in the snow a Pichu, alone, too small for the weather and shaking so hard its ears rattle. Your Sewaddle is off your pack before you have stopped walking. It looks at the Pichu the way the Leavanny looked at the Pichu in the forest: measuring. Then it gathers every leaf it can reach and begins.',
    [
      ch('Keep the fire going for it.', out('You build a fire beside the road and keep it going all night while it sews. Somewhere in the small hours its silk runs out, and it keeps going anyway, and begins to glow. In the morning the Pichu is buttoned into a coat that fits it perfectly, and the one who sewed it is a Leavanny, tall and green, four arms folded, very tired, and very proud.',
        evolve('sewaddle', 'leavanny'), evolve('swadloon', 'leavanny'), bondLine('sewaddle', 10), flag('aq29-turned'), moment('Your Sewaddle sewed a coat all night for a Pichu in the snow, and in the morning it was a Leavanny.', 70))),
      ch('Let it work alone.', out('You step back and let it work. It does not look up once. Some time before dawn it begins to glow, and does not stop sewing. When the sun comes up, a Leavanny is buttoning a Pichu into a coat that fits it perfectly, and then, without a word, it starts measuring you.',
        evolve('sewaddle', 'leavanny'), evolve('swadloon', 'leavanny'), bondLine('sewaddle', 10), flag('aq29-turned'), moment('Your Sewaddle sewed a coat all night for a Pichu in the snow, and in the morning it was a Leavanny.', 70))),
    ]),
  // ---------------- AQ30. The Sunglasses ----------------
  ev('aq30-sunglasses', 'The Sunglasses', AQ, { rarity: 'uncommon', minStage: stageOf('A3'), types: HOT, pokemon: 'sandile', tint: '#3a2a14', effect: 'shake' },
    'The sand in front of you heaves, and a Sandile bursts out of it wearing sunglasses. It strikes a pose. It points at you, very slowly, with great style, and roars a challenge. Then it takes one step forward and falls into a hole. There is a long pause. The sunglasses stay on. It climbs out, dusts itself off, finds its pose again, and challenges you again, as if nothing happened.',
    [
      ch('Battle it.', fight('You accept. It is delighted. It is also terrible: it bites a rock, it trips on its own tail, it Sand-Attacks itself. It keeps going. It keeps going long after anything sensible would have stopped.',
        monDuel('The Sandile in Sunglasses', 'sandile', 0, { win: [flag('aq30-beaten'), ...FOLLOWS], lose: FOLLOWS }))),
      ch('Help it out of the hole.', out('You reach down and haul it out before it can pretend it meant to be in there. It goes very red under the scales. It straightens its sunglasses. It mutters something that sounds like thanks, and something else that sounds like it had that under control. When you walk on, it walks on too, a little way behind, posing at anything that looks at it.', flag('aq30-helped'), ...FOLLOWS)),
      ch('Get it new sunglasses.', out('You look closer. The old sunglasses are cracked right across one lens; no wonder it keeps finding holes. You buy a pair from a stall at the next oasis and hold them out. It looks at them for a long time. Then it takes off the old ones, carefully, folds them, and puts the new ones on. It looks at its reflection. It follows you.', $(-300), flag('aq30-new-glasses'), ...FOLLOWS), { requires: [money(300)] }),
    ]),
  ev('aq30-again', 'It Follows', AQ, { room: true, requires: [flagIs('aq30-follows')], pokemon: 'sandile', tint: '#3a2a14', effect: 'shake',
    remembers: [
      { id: 'new-glasses', when: [flagIs('aq30-new-glasses')], notice: 'The new sunglasses gleam. It keeps tilting its head so they catch the sun at you.', hide: [2] },
      { id: 'helped', when: [flagIs('aq30-helped')], notice: 'Before it poses, it checks the ground very carefully, with one foot. Then it poses, and falls in anyway.' },
      { id: 'beaten', when: [flagIs('aq30-beaten')], notice: 'It has clearly been practising since you beat it. It still looks terrible. It looks terrible with more confidence.' },
    ] },
    'Halfway across the desert, the sand in front of you heaves again. The Sandile bursts out, sunglasses on, and strikes its pose, the same one, a little more practised. It has followed you all this way to do it. It points at you. It roars a challenge. Then it falls into a hole.',
    [
      ch('Battle it.', fight('It climbs out of the hole and attacks at once, before you are ready, which is the best idea it has had so far. It is still terrible. It still keeps going.',
        monDuel('The Sandile in Sunglasses', 'sandile', 0, { win: [flag('aq30-beaten'), flag('aq30-second'), later('aq30-last-stand', 5)], lose: [flag('aq30-second'), later('aq30-last-stand', 5)] }))),
      ch('Help it out of the hole.', out('You haul it out again. This time it does not pretend. It hangs from your hands for a moment, looking up at you through the sunglasses, and then it pats your arm, twice, as if thanking a colleague. It follows you on, close enough now to step in your footprints.', flag('aq30-helped'), flag('aq30-second'), later('aq30-last-stand', 5))),
      ch('Get it new sunglasses.', out('The old lens is cracked right across; you have been meaning to say. You buy a pair at the next oasis. It takes off the old ones, folds them, and puts the new ones on, and stands a little taller. It follows you on, close enough now to step in your footprints.', $(-300), flag('aq30-new-glasses'), flag('aq30-second'), later('aq30-last-stand', 5)), { requires: [money(300)] }),
    ]),
  ev('aq30-last-stand', 'The Best Pose', AQ, { room: true, requires: [flagIs('aq30-second')], pokemon: 'sandile', tint: '#3a2a14', effect: 'shake',
    remembers: [{ id: 'twice', when: [flagIs('aq30-beaten', 2)], notice: 'You have beaten it twice now. It does not care. It has never looked happier.' }] },
    'The edge of the desert. The Sandile is waiting for you on top of a dune, in the best pose yet: one claw up, chin out, sunglasses flashing. It must have been standing like that for hours. It roars its challenge, very carefully, without moving its feet. There are no holes on this dune. It checked.',
    [
      ch('Battle it.', fight('It comes down the dune at a run. It is still terrible, but it is terrible on purpose now, and with real style.',
        monDuel('The Sandile in Sunglasses', 'sandile', 0, { win: [flag('aq30-beaten'), flag('aq30-done'), room('aq30-fourth')], lose: [flag('aq30-done'), room('aq30-fourth')] }))),
      ch('Help it out of the hole.', out('It steps forward off the top of the dune and slides all the way down the far side on its face into a hollow. You climb down and help it out. Its sunglasses are still on. It is laughing, a deep croaking laugh, and so are you.', flag('aq30-helped'), flag('aq30-done'), room('aq30-fourth'))),
    ]),
  // If the player beat it three times, it evolves on the spot and challenges a fourth time, properly.
  ev('aq30-fourth', 'Properly', AQ, { room: true, requires: [flagIs('aq30-done')], pokemon: 'sandile', tint: '#3a2a14', effect: 'sparkle',
    remembers: [
      { id: 'three', when: [flagIs('aq30-beaten', 3)], intro: 'Three times you have beaten it. It sits down in the sand and thinks about that, sunglasses pushed up on its head. Then it starts to glow. The thing that stands up is a Krokorok, longer and leaner, with a jaw full of real teeth. It puts the sunglasses back on. It does not pose. It does not roar. It only nods to you, once, and waits: a fourth challenge, and this time properly.', hide: [0], addChoices: [
        ch('Battle it.', fight('It does not trip. It does not bite any rocks. It fights properly, hard and clever, and it is good.',
          monDuel('The Krokorok in Sunglasses', 'krokorok', 1, { win: KROKOROK_JOINS, lose: KROKOROK_JOINS }))),
      ] },
      { id: 'new-glasses', when: [flagIs('aq30-new-glasses')], notice: 'The sunglasses you bought it are scratched now, from all the holes. It keeps them very clean anyway.' },
    ] },
    'It sits down in the sand beside you, sunglasses pushed up on its head, and looks at you without them for the first time. It has followed you right across the desert. It has fallen into every hole in it. It is not going to challenge you again. It would like to come.',
    [
      ch('Let it come.', out('You hold out your arm. It puts the sunglasses back on, climbs your arm to your shoulder, and poses there, for the rest of the road, at anyone who looks.', gain('sandile', { bond: 10 }), flag('aq30-joined'), moment('A Sandile in sunglasses challenged you across a whole desert, fell in every hole, and came with you anyway.', 55))),
      ch('Leave it its desert.', leave('You shake its claw. It nods, puts the sunglasses back on, and strikes one last pose on the dune as you go. When you look back, it has fallen into a hole. The sunglasses are still on.')),
    ]),
];

export const REMOVE: string[] = [];
