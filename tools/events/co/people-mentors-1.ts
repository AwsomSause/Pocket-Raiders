// Catalog Overhaul Pack, people: the mentors' shared scenes MS1-MS12 (STORY_FAMILIES_5.md, Part A). MS9 (The Familiar Face) is PA4, `mentor-familiar-face` in people-champions-1.ts.
// One event for all twelve mentors: {mentor} is this run's mentor, {mentorDrill} their Training drill (src/core/mentors/lessons.ts).
// Build: npm run co:build -- people-mentors-1
import { again, ch, fight, heal, item, out, room, stat, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, rep, spar, variant } from './_people.ts';
import { lesson, M, mentorIs, mentorScene, R, regionsLeft, shared, sharedRoom, trust } from './_mentors.ts';

export const CATEGORY = CAT;

const learned = [mentorIs(), M.is('lesson')];
const tempo = (label: string, ...effects: Json[]): Json => ({ kind: 'tempEffect', label, effects, battles: 1, until: 'battle' });

// ---------- MS1. Training Session ----------
const training = (finish: Json[] = []): Json[] => [
  ch('"Speed drills."', out('Cone to cone, again and again, until your lead stops thinking about its feet and just runs. {mentor} clicks a stopwatch and, for once, says nothing at all, which is how you know it went well.', stat('spe', { region: true }), M.set('trained-speed'), trust(2, 1), ...finish)),
  ch('"Defence drills."', out('{mentor} throws soft things, then harder things, and your lead learns to set its weight and take them. By the end of the hour it plants itself like a post, and {mentor} pours two cups of tea.', stat('def', { region: true }), M.set('trained-def'), trust(2, 1), ...finish)),
  ch('"{mentorDrill}."', out('{mentor} smiles like you picked the right answer on a test. The cones are forgotten; the hour goes to the one thing {mentor} cares about most, done the way {mentor} does it, until it is in your hands too.', lesson(true), M.set('trained-spec'), trust(3, 2), ...finish)),
];

// ---------- MS12's "one more lesson first": the same session, then the Final Lesson ----------
const finalLesson = mentorScene('final');

const scenes: Json[] = [
  shared('mentor-training-session', {
    title: 'Training Session',
    requires: learned,
    intro:
      'A quiet stretch of road, the kind with nothing on it but wind. {mentor} has been here a while: a row of orange cones, a painted target nailed to a fence post, and a flask of tea steaming on a flat rock. ' +
      'The grass is pressed flat where they paced it out. {mentor}: "One hour. Pick what we work on." They hold up the stopwatch and wait, thumb on the button.',
    choices: training(),
  }),

  // ---------- MS2-MS4. The Montage (Bram) ----------
  shared('mentor-montage-1', {
    title: 'Three Drills',
    requires: learned,
    intro:
      'An old man with a grey crew cut and forearms like ship rope waves you over from a clearing. This is Bram, an old friend of {mentor}\'s; you can tell because he says the name like a joke only the two of them get. ' +
      'Somewhere, from nowhere, a drum beat starts. Bram: "Three drills. Don\'t blink, it\'s a montage." He points two fingers at your lead. Bram: "Step one. Dodge." ' +
      'His Hitmonlee steps forward and kicks at your lead in slow, heavy rhythm, a foot sweeping through the air on every second beat.',
    choices: [
      ch('"Dodge left."', out('Left on the beat, left again, and the kick sails past by a hair every time. Bram nods along to the drum. Your lead comes out of it light on its feet, ready to slip the first thing thrown at it next battle.', tempo('Light on its feet: evasion up in the next battle', { kind: 'evasionMultiplier', value: 1.33 }), room('mentor-montage-2')),
        { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('Your lead goes left a beat late and the kick catches its shoulder. Bram winces kindly. Bram: "Rhythm comes. Next drill." The drum keeps going like nothing happened.', room('mentor-montage-2')) }),
      ch('"Dodge right."', out('Right, and right, and right again, the kick always a whisker behind. Bram grins at the drum like it owes him money. Your lead comes out of it quick and loose, ready to slip the first thing thrown at it next battle.', tempo('Light on its feet: evasion up in the next battle', { kind: 'evasionMultiplier', value: 1.33 }), room('mentor-montage-2')),
        { prompt: { id: 'echo-rhythm', needs: 'good' }, fail: out('Your lead goes right as the kick goes right. It sits down hard in the grass and blinks. Bram: "Rhythm comes. Next drill." The drum does not care, and keeps going.', room('mentor-montage-2')) }),
      ch('"Don\'t dodge."', out('Your lead plants its feet and takes the kick square. It skids back a yard and stays standing. Bram stares, then laughs from the belly. Bram: "Brave. Wrong. But brave." Your lead looks at you like it would do it again.', bond(1), room('mentor-montage-2'))),
    ],
  }),
  {
    ...shared('mentor-montage-2', {
      title: 'The Sack',
      requires: [],
      intro:
        'Step two. A canvas sack hangs from an oak branch, patched in four colours, older than you are. The drum is still going. Bram taps the sack once with his knuckle so it swings. ' +
        'Bram: "In time. Not hard. In time." He steps back and folds his arms, counting under his breath.',
      choices: [
        ch('"Punch on the beat."', out('One, two, hit. One, two, hit. The sack swings back into the next blow every time, and the drum and the punches become the same sound. Bram stops counting. Next battle, your lead\'s first strike will land with that timing behind it.', tempo('On the beat: first attack +10% in the next battle', { kind: 'firstAttackDamage', first: 1.1, later: 1 }), room('mentor-montage-3'))),
        ch('"Punch hard."', out('Your lead winds up and hits the sack with everything it has. The seam splits from top to bottom and sand pours out on Bram\'s boots. Bram sighs a long, long sigh, and does not say a single word about it.', room('mentor-montage-3'))),
        ch('"Let the Pokémon set the beat."', out('You step back. Your lead listens to the drum, then ignores it, and finds its own beat: slower, steadier, entirely its own. Bram raises an eyebrow and then, slowly, starts drumming along to it instead.', bond(2), room('mentor-montage-3'))),
      ],
    }),
    room: true,
  },
  {
    ...shared('mentor-montage-3', {
      title: 'The Hill',
      requires: [],
      intro:
        'Step three: the last hill, at sunset, steep as a roof. You and your lead run it with the drum chasing you up, lungs burning, and at the top Bram is already waiting with a thermos and a small, proud smile. ' +
        'Bram: "Your mentor ran this hill forty times when they were your age. Cried on thirty of them." He unscrews the cup. Bram: "Tea?"',
      choices: [
        ch('"Tea."', out('It is too sweet and exactly right. You sit on the hilltop with your team piled around you and watch the sun go down over the route you came up. By the time the cup is empty, everyone is breathing easy again.', heal(1))),
        ch('"Forty times?"', out('Bram leans in and tells you one story about {mentor}: true, embarrassing, and involving a borrowed bicycle and a very angry Tauros. You will never be able to look at {mentor} the same way again. Bram looks enormously pleased with himself.', M.set('bram-told'))),
        ch('"Run it again."', out('Bram laughs out loud. You go back down and run it again, and your lead gets to the top first and stands there like it owns the hill. For the rest of the region, whatever it is best at, it is a little better.', stat('best', { region: true }))),
      ],
      remembers: [
        variant('kenji', [{ kind: 'flag', key: 'roster-kenji-done', atLeast: 1, atMost: 99 }], { notice: 'Someone else is at the top too, red-faced and grinning: Black Belt Kenji. He bows to Bram, deep and formal. Kenji: "Sensei." So Kenji is Bram\'s student. Of course he is.' }),
      ],
    }),
    room: true,
  },

  // ---------- MS5. The Shortcut ----------
  shared('mentor-disagreement', {
    title: 'The Shortcut',
    requires: learned,
    intro:
      'A fork in the road. The left branch winds the long way round the hill; the right one drops straight down a loose scree slope. From down that way, smoke is rising over the trees, thick and grey, from a village you can just make out. ' +
      '{mentor} stands on the left branch and does not move. {mentor}: "The safe road. We go round. That\'s not a suggestion." You keep looking at the smoke. {mentor} sees you looking. {mentor}: "I know what you\'re looking at. I know. Round."',
    choices: [
      ch('"Take the shortcut anyway."', out('You go. Behind you, {mentor} shouts your name once. The scree shifts under your boots on the first step, and you hear the hill above you start to move.', M.set('disobeyed'), { kind: 'mentor', trust: -2, loyalty: 0, rivalry: 0, disagree: true }, room('mentor-disagreement-rockfall'))),
      ch('"Go round."', out('You go round. It takes an hour. When you reach the village the fire is out and everyone is standing in the square, sooty and coughing and alive. The people are fine. The houses are not. {mentor} does not say anything for a long time.', M.set('obeyed'), trust(2, 3))),
      ch('"Argue."', out('You plant your feet and say no. {mentor} turns, and for a moment looks much older. {mentor}: "Because I lost someone on a road like that." The wind moves the smoke. Now you know, and you still have to choose.', M.set('argued'), trust(1, 2), room('mentor-disagreement-again'))),
    ],
    remembers: [
      variant('juno-flips', [mentorIs('juno-trailwind')], {
        intro:
          'A fork in the road. The left branch winds the long way round the hill; the right one drops straight down a loose scree slope towards a village where smoke is rising, thick and grey. ' +
          'Juno is already on the right branch, one boot on the scree, pack tightened. Juno: "Shortcut. Now. I\'ve done worse slopes than this." For once, you are the one looking at the safe road, and Juno is the one arguing.',
        hide: [0, 2],
        add: [
          ch('"Take the shortcut with her."', out('You go together, Juno half a step ahead, reading the slope like a page. Then the hill above you starts to move.', M.set('disobeyed'), room('mentor-disagreement-rockfall'))),
          ch('"Talk her out of it."', out('You catch her sleeve. You say the things she says to you: read the ground, look up, look sideways. Juno looks at the loose rock for a long moment, then at you. Juno: "...When did you get sensible?" She goes round with you.', M.set('argued'), trust(2, 3))),
        ],
      }),
      variant('ravi-argue', [mentorIs('ravi-ironhand')], {
        hide: [2],
        add: [
          ch('"Argue."', out('You plant your feet and say no. Ravi turns, and for a moment looks much older. Ravi: "Because I lost someone on a road like that." Then, quieter: there is a sailor he knows, and a Pokémon too brave for the boat, and he has been waiting to see if you were ready for it. Now you know, and you still have to choose.', M.set('argued'), trust(1, 2), mentorScene('recruit'), room('mentor-disagreement-again'))),
        ],
      }),
    ],
  }),
  sharedRoom('mentor-disagreement', 'again', {
    title: 'The Shortcut, Again',
    intro: 'The smoke is still rising. {mentor} is still standing on the safe road, and now you both know why. Nobody says anything. The choice is the same as it was, and nothing like it.',
    choices: [
      ch('"Take the shortcut anyway."', out('You go anyway. {mentor} does not shout this time. The scree shifts under your boots, and the hill above starts to move.', M.set('disobeyed'), room('mentor-disagreement-rockfall'))),
      ch('"Go round."', out('You go round together, and the hour is very long. The fire is out when you arrive; the people are fine and the houses are not. {mentor} puts a hand on your shoulder, just for a second, and takes it away.', M.set('obeyed'), trust(2, 3))),
    ],
  }),
  sharedRoom('mentor-disagreement', 'rockfall', {
    title: 'The Rockfall',
    intro: 'Rocks come down the slope with a sound like a train. Dust everywhere, stones the size of suitcases bouncing past, the path vanishing under them. The village is at the bottom. So is the only way out.',
    choices: [
      ch('"Run for it."', out('You weave between the falling stones on instinct and luck, your team right behind you, and come out of the dust at the bottom with the village a hundred yards away.', room('mentor-disagreement-rescue')),
        { prompt: { id: 'dodge-tap', needs: 'ok' }, fail: out('A stone clips your lead and it stumbles, but it keeps going, and you all come out of the dust at the bottom together, scraped and grey and still moving.', { kind: 'damage', share: 0.15, who: 'lead', except: [] }, room('mentor-disagreement-rescue')) }),
      ch('"Climb along the ridge."', out('You go sideways along the ridge where the rock is solid, hand over hand, and come down the far side just as the slide stops. The village is right there.', room('mentor-disagreement-rescue')),
        { prompt: { id: 'climb-rhythm', needs: 'ok' }, fail: out('A handhold breaks and you slide the last stretch on your back in a shower of grit. Bruised, filthy and entirely fine, you get up at the bottom by the village.', { kind: 'damage', share: 0.1, who: 'party', except: [] }, room('mentor-disagreement-rescue')) }),
    ],
  }),
  sharedRoom('mentor-disagreement', 'rescue', {
    title: 'The Village',
    intro: 'Two houses are burning and a third has caught. People are passing buckets from the well in a line that is far too short. A child is shouting for someone from the doorway of the third house.',
    choices: [
      ch('"Get everyone out first."', out('You and your team go door to door, and the last one out is the child\'s grandmother, carried between two of your Pokémon. The houses burn, but nobody is in them. {mentor} arrives at a run, furious, opens their mouth, looks at the grandmother, and goes quiet.', { kind: 'attribute', key: 'goodEvil', amount: 2 }, rep(1), M.set('rescue'))),
      ch('"Put the fire out."', out('Every Pokémon you have that can carry water or move earth goes at the flames, and the line of buckets suddenly has help. By the time it is out, two houses are saved. {mentor} arrives, furious, sees the soot on your face, and sits down on the well wall without a word.', { kind: 'attribute', key: 'goodEvil', amount: 2 }, rep(1), M.set('rescue'))),
    ],
  }),

  // ---------- MS6. A Real Task (a three-node search) ----------
  shared('mentor-mission-offer', {
    title: 'A Real Task',
    requires: learned,
    intro:
      'At breakfast, {mentor} slides a folded note across the table and keeps two fingers on it for a moment before letting go. {mentor}: "A real task. Only if you\'re ready." ' +
      'Inside: an address, a name, and three words in {mentor}\'s careful handwriting: "Bring them home." A trainer has gone missing in the next region, someone {mentor} used to teach. The paper has been folded and unfolded a lot.',
    choices: [
      ch('"I\'m ready."', out('You put the note in your pocket and stand up. {mentor} nods, once, and looks away quickly. The address is a day\'s walk. You start asking at the first door you come to.', M.set('mission'), trust(3, 2), room('mentor-mission-offer-ask'))),
      ch('"Come with me."', out('{mentor} looks surprised, then something else, then gets their coat. You go together. The address is a day\'s walk, and {mentor} knows every shortcut.', M.set('mission'), M.set('mission-together'), trust(2, 4), room('mentor-mission-offer-ask'))),
      ch('"Not yet."', out('You fold the note again and put it in the bottom of your bag. {mentor} nods like that was also the right answer. It will still be there when you are ready, later in the run.', again('mentor-mission-offer'))),
    ],
    remembers: [
      variant('dax-rival', [mentorIs('dax-corvane')], { notice: 'The name on the note is one you have heard Dax say before, through his teeth: his old rival. Dax: "I\'m not coming. Don\'t ask." He says it twice, which is once too many.' }),
    ],
  }),
  sharedRoom('mentor-mission-offer', 'ask', {
    title: 'Asking Around',
    intro: 'The address is a boarding house with a bored Meowth on the step. The landlady remembers the trainer: quiet, paid on time, left three weeks ago with a tent and no goodbye. "Went north," she says. "Towards the lakes. Looked like they\'d lost something."',
    choices: [
      ch('"Ask who else saw them."', out('A fisherman saw them buying rope. A girl at the Center saw them sitting alone with their Pokémon for a whole afternoon, not healing it, just sitting. Everyone points the same way: north, to the lakes.', room('mentor-mission-offer-trail'))),
      ch('"Ask what they lost."', out('The landlady thinks. "A battle, I think. A big one. Came back and didn\'t unpack." She gives you a cup of tea for the road and points north, to the lakes.', room('mentor-mission-offer-trail'))),
    ],
  }),
  sharedRoom('mentor-mission-offer', 'trail', {
    title: 'The Trail',
    intro: 'By the lakes the trail is easy to read once you know to look: a tent peg pulled and left, a fire pit raked over but still warm underneath, the print of a Pokémon that drags one foot. They are close, and they are moving slowly.',
    choices: [
      ch('"Follow the tracks."', out('You follow the dragging footprint along the shore until you smell woodsmoke, and see a single tent pitched where nobody would ever look.', room('mentor-mission-offer-camp'))),
      ch('"Call out their name."', out('You call the name on the note. Nobody answers, but a little way down the shore a thin line of smoke goes suddenly still, as if someone is holding their breath. You walk towards it.', room('mentor-mission-offer-camp'))),
    ],
  }),
  sharedRoom('mentor-mission-offer', 'camp', {
    title: 'The Camp',
    intro:
      'A single tent by the water. The trainer sits outside it, older than you, hood up, a tired Pokémon asleep against their leg. They know why you are here before you say a word. They look at the note in your hand and then at the ground. ' +
      'They lost. Badly, publicly, to someone they should have beaten, and they could not face going back to {mentor} with it.',
    choices: [
      ch('"Everyone loses. Come home."', out('You sit down on the wet grass beside them and tell them about the worst loss you have had. It takes a while. At the end they laugh, wetly, and start taking the tent down. You walk them home, and {mentor} is waiting at the door.', M.set('mission-done'), trust(5, 3), moment('You brought one of your mentor\'s old students home'))),
      ch('"Your mentor is waiting."', out('You do not argue; you just tell them {mentor} folded and unfolded that note until the paper went soft. The trainer stares at it for a long time. Then they pack up, and you walk them home.', M.set('mission-done'), trust(5, 3), moment('You brought one of your mentor\'s old students home'))),
    ],
    remembers: [
      variant('together', [M.is('mission-together')], { notice: '{mentor} is with you, and does not let you speak first: they sit down beside their old student, and say the right thing, and say it simply. The tent is down in ten minutes. You are all home by dark.' }),
      variant('dax-comes', [mentorIs('dax-corvane')], { notice: 'Footsteps on the shingle behind you: Dax, out of breath, furious with himself for coming. His old rival looks up. Dax: "You owe me a rematch. You\'re not allowed to quit before I win it." It is the kindest thing you have ever heard him say.' }),
    ],
  }),

  // ---------- MS7. Why I Teach ----------
  shared('mentor-personal-story', {
    title: 'Why I Teach',
    requires: [...learned, M.not('story')],
    intro:
      'Evening. The fire has burned down to orange, and your team is asleep in a heap on the far side of it. {mentor} has been unusually quiet all day, and is still quiet now, turning a stick over and over in the coals. ' +
      'Finally: {mentor}: "You\'ve never asked why I teach." A pause. {mentor}: "I\'ll tell you. Then you\'ll know whether to listen to me."',
    choices: [
      ch('"Tell me."', out('{mentor} nods, and puts the stick down, and begins.', trust(2, 2), mentorScene('story'))),
      ch('"I don\'t need to know."', out('{mentor} looks at you for a long moment, and something in their shoulders lets go. {mentor}: "Good answer. I\'ll tell you anyway, later." They put another log on the fire, and you both watch it catch.', trust(1, 3))),
      ch('"Is it a sad story?"', out('{mentor}: "It\'s mine. You decide." Then they tell it.', trust(2, 1), mentorScene('story'))),
    ],
    remembers: [variant('bram', [M.is('bram-told')], { notice: '{mentor} gives you a narrow look across the fire. {mentor}: "Bram told you. Of course he did."' })],
  }),

  // ---------- MS8. One More Match (Ressa) ----------
  shared('mentor-apprentice-showdown', {
    title: 'One More Match',
    requires: learned,
    intro:
      'Ressa, the other apprentice, is waiting on the path with her team lined up behind her. She has been training hard; you can see it in the scuffs on her boots and the bandage on her knuckles. ' +
      'Ressa: "One more match. Whoever wins, our mentor will remember it." She tightens the bandage with her teeth. Ressa: "I don\'t want them to remember me losing."',
    choices: [
      ch('"Battle."', fight('Ressa nods once and sends out her team. Every one of them has been picked to beat yours, and she does not pretend otherwise.',
        spar('Ressa', { apprentice: true, size: 3, lv: 1, win: [trust(5, 2, 3), moment('You beat Ressa in the showdown')], lose: [trust(0, 1, -2), moment('Ressa beat you in the showdown')] }), R.set('showdown'), R.set('duelled'))),
      ch('"Our mentor remembers everything anyway."', fight('Ressa stops. Ressa: "...That\'s worse." Then she sends out her team anyway, because of course she does.',
        spar('Ressa', { apprentice: true, size: 3, lv: 1, win: [trust(5, 2, 3), moment('You beat Ressa in the showdown')], lose: [trust(0, 1, -2), moment('Ressa beat you in the showdown')] }), R.set('showdown'), R.set('duelled'))),
      ch('"Let\'s call it a draw."', out('Ressa stares at you. Ressa: "Coward." Then she laughs, properly, for the first time since you met her, and sits down on a rock. You do not fight. You share her sandwiches instead.', R.set('draw'), trust(1, 2, -1))),
    ],
    remembers: [
      variant('pushed', [R.is('pushed'), R.not('duelled')], {
        notice: 'Ressa has been training harder since you told her you never feel behind. Her team looks it.',
        hide: [0, 1],
        add: [
          ch('"Battle."', fight('Ressa sends out her team without a word. They are two levels stronger than the last time you saw them, and every one of them is picked to beat yours.',
            spar('Ressa', { apprentice: true, size: 3, lv: 3, win: [trust(5, 2, 3), moment('You beat Ressa in the showdown')], lose: [trust(0, 1, -2), moment('Ressa beat you in the showdown')] }), R.set('showdown'), R.set('duelled'))),
        ],
      }),
    ],
  }),

  // ---------- MS10. Who's Learned More ----------
  shared('mentor-fellow-duel', {
    title: "Who's Learned More",
    requires: learned,
    intro:
      'Ressa blocks the path with her arms folded and a grin that means trouble. Ressa: "Let\'s see who\'s learned more." She holds up a finger like {mentor} does when making a point. ' +
      'Ressa: "Lesson rules: only what our mentor taught us." Which means no bag, no tricks, nothing {mentor} did not put in your hands themselves.',
    choices: [
      ch('"Lesson rules."', fight('You shake on it. No items, no shortcuts: just what {mentor} taught you both, and who learned it better.',
        spar('Ressa', { apprentice: true, size: 2, rule: { noItems: true }, win: [trust(3, 1, 2)], lose: [trust(0, 1, -2)] }), R.set('duelled'))),
      ch('"Any rules."', fight('Ressa shrugs. Ressa: "Your funeral." A normal battle, everything allowed, and she throws herself into it.',
        spar('Ressa', { apprentice: true, size: 2, win: [trust(2, 0, 2)], lose: [trust(0, 1, -2)] }), R.set('duelled'))),
      ch('"Teach me what you learned."', out('Ressa blinks, then grins, and spends an hour showing your lead the move her own partner swears by: when to raise the guard, and when to drop it. Ressa: "Don\'t tell {mentor} I\'m a better teacher."', { kind: 'teachMove', move: 'protect' }, trust(1, 2, -1))),
    ],
    remembers: [
      variant('pushed', [R.is('pushed'), R.not('duelled')], {
        notice: 'Ressa\'s team is two levels stronger than last time. She has been training like you lit a fire under her.',
        hide: [0, 1],
        add: [
          ch('"Lesson rules."', fight('No items, no shortcuts. Ressa\'s team has grown, and she wants you to see it.', spar('Ressa', { apprentice: true, size: 2, lv: 2, rule: { noItems: true }, win: [trust(3, 1, 2)], lose: [trust(0, 1, -2)] }), R.set('duelled'))),
          ch('"Any rules."', fight('Everything allowed, and Ressa\'s stronger team comes at you all at once.', spar('Ressa', { apprentice: true, size: 2, lv: 2, win: [trust(2, 0, 2)], lose: [trust(0, 1, -2)] }), R.set('duelled'))),
        ],
      }),
      variant('celeste', [mentorIs('celeste-ribbon')], {
        notice: 'Under Celeste, lesson rules means the stage, not the scoreboard: no knockouts, and the one who shows the most moves wins.',
        hide: [0],
        add: [ch('"Lesson rules."', fight('Ressa bows to an invisible crowd. Ressa: "Darling." She is doing Celeste\'s voice. It is very good. No knockouts; show the most moves.', spar('Ressa', { apprentice: true, size: 2, rule: { contest: 4 }, win: [trust(3, 1, 2)], lose: [trust(0, 1, -2)] }), R.set('duelled')))],
      }),
      variant('dax', [mentorIs('dax-corvane')], {
        notice: 'Under Dax, lesson rules has one rule: whoever loses goes again, straight away.',
        hide: [0],
        add: [ch('"Lesson rules."', fight('Ressa: "Loser rematches. You know the drill." Two rounds, back to back, the way Dax likes it.', spar('Ressa', { apprentice: true, size: 2, chain: 2, rule: { noItems: true }, win: [trust(3, 1, 2)], lose: [trust(0, 1, -2)] }), R.set('duelled')))],
      }),
    ],
  }),

  // ---------- MS11. Do You Ever Feel Behind? ----------
  shared('mentor-rare-talent', {
    title: 'Do You Ever Feel Behind?',
    requires: learned,
    intro:
      'After the battle, when the crowd has gone, Ressa is still sitting on the fence by the field, alone. She watched the whole thing. She does not look at you when you sit down next to her. ' +
      'Ressa: "Our mentor says you\'re once in a generation. Said it to me. Like I should know." She picks at the bandage on her hand. Ressa: "Do you ever feel behind?"',
    choices: [
      ch('"All the time."', out('Ressa turns and looks at you properly. Ressa: "...Huh. Okay." Then she laughs, relieved, like she has put down something heavy she has been carrying for a long time. You sit on the fence together until it gets dark.', R.set('equal'), trust(0, 2))),
      ch('"No."', out('Ressa nods slowly. Ressa: "Must be nice." She gets down off the fence and walks off towards the training field, and you hear her start drilling before you have even stood up. The next time you duel, she will be ready.', R.set('pushed'), trust(0, 1, -1))),
      ch('"You\'re not behind me."', out('Ressa: "You\'d say that." She does not believe it. Then she looks at her own hands, and at her team, and you can see her start to, a little bit.', R.set('lifted'), trust(0, 2))),
    ],
  }),

  // ---------- MS12. Nothing Left to Teach (the Final Lesson) ----------
  {
    ...shared('mentor-graduation-trial', {
      title: 'Nothing Left to Teach',
      callback: true,
      requires: [mentorIs(), M.ago('story', 1), regionsLeft(1), M.not('graduated')],
      intro:
        'On an ordinary stretch of road, on an ordinary afternoon, {mentor} stops walking. You stop too. For a while neither of you says anything; the wind does all the talking. ' +
        'Then: {mentor}: "There\'s nothing left to teach you. Show me what you\'ve learned."',
      choices: [
        ch('"Ready."', out('{mentor} smiles, the small private smile you have learned to look for, and steps back to give you room.', finalLesson)),
        ch('"One more lesson first."', out('{mentor} laughs. {mentor}: "Stalling. Good. One more hour, then." Out come the cones.', room('mentor-graduation-trial-drill'))),
        ch('"What happens after?"', out('{mentor}: "You go on. I go back. Someone else comes along." They say it simply, like weather. Then they step back to give you room.', finalLesson)),
      ],
      remembers: [
        variant('disobeyed', [M.is('disobeyed')], { notice: '{mentor}, quietly, without looking at you: "You didn\'t listen. You were right not to. Don\'t tell anyone I said that."' }),
        variant('bram', [M.is('bram-told')], { notice: '{mentor} gives you a narrow look. {mentor}: "Bram told you. Of course he did."' }),
      ],
    }),
    // MS12 also counts as the arc's last step for the gate test of placement.
  },
  sharedRoom('mentor-graduation-trial', 'drill', {
    title: 'One More Lesson',
    intro: 'The cones go out one last time, and the target on the fence post, and the flask of tea. {mentor}: "One hour. Pick what we work on." This time, you both know what comes after.',
    choices: training([finalLesson]),
  }),
];

export const EVENTS: Json[] = scenes;
export const REMOVE: string[] = [];

/** Where each event is scripted (for docs/status/co-people.md and the status file). */
export const DOC: Record<string, string> = {
  'mentor-training-session': 'SF5 MS1', 'mentor-montage-1': 'SF5 MS2', 'mentor-montage-2': 'SF5 MS3', 'mentor-montage-3': 'SF5 MS4',
  'mentor-disagreement': 'SF5 MS5', 'mentor-disagreement-again': 'SF5 MS5 (Argue)', 'mentor-disagreement-rockfall': 'SF5 MS5 (hazard node)', 'mentor-disagreement-rescue': 'SF5 MS5 (rescue)',
  'mentor-mission-offer': 'SF5 MS6', 'mentor-mission-offer-ask': 'SF5 MS6 (search 1)', 'mentor-mission-offer-trail': 'SF5 MS6 (search 2)', 'mentor-mission-offer-camp': 'SF5 MS6 (search 3)',
  'mentor-personal-story': 'SF5 MS7', 'mentor-apprentice-showdown': 'SF5 MS8', 'mentor-fellow-duel': 'SF5 MS10', 'mentor-rare-talent': 'SF5 MS11',
  'mentor-graduation-trial': 'SF5 MS12', 'mentor-graduation-trial-drill': 'SF5 MS12 (One more)',
};

/** Flags nothing in this file reads. */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'mentor-trained-(speed|def|spec)', readBy: 'Training record only (SF5 MS1 flags); no later reader in the doc' },
  { match: 'mentor-(obeyed|argued|rescue|mission|mission-done)', readBy: 'SF5 MS5/MS6 flags; no later reader in the doc' },
  { match: 'ressa-(showdown|draw|lifted)', readBy: 'SF5 MS8/MS11 flags; no later reader in the doc' },
  { match: 'ressa-equal', readBy: 'Final Reunion: Ressa says "You said all the time. I think about that." (SF5 MS11 Remembers)' },
];
