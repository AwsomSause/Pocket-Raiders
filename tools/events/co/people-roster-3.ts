// Catalog Overhaul Pack, people: THE ROAD ROSTER, RR12 to RR21 (ROAD_ROSTER.md lines 614 to 1133). Pattern: people-roster-1.ts.
// Build: npm run co:build -- people-roster-3
import { $, any, ch, ferry, fight, flag, flagAgo, gym, heal, item, join, money, out, ptype, room, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, moment, not, oldOf, rosterKit, spar, variant, wildSpar } from './_people.ts';

export const CATEGORY = CAT;

const hoursOf = (id: string): Json[] => (((oldOf(id).requires as Json[] | undefined) ?? []).filter((c) => c.kind === 'period'));
const sceneOf = (id: string, extra: Json = {}): Json => ({ ...((oldOf(id).scene as Json | undefined) ?? { cast: [], effect: 'none' }), ...extra });

// ---------- RR12. Cooltrainer Marcus (morning, afternoon; Gyarados, Tyranitar, Garchomp) ----------
const MA = rosterKit('marcus', 'npc-meet-cooltrainer-marcus', 'Cooltrainer Marcus');
const MARCUS = 'Cooltrainer Marcus';
const marcusTeam = ['gyarados', 'tyranitar', 'garchomp'];
const choiceKit = any('choice-band', 'choice-specs', 'choice-scarf');

const marcus: Json[] = [
  MA.meet(1, {
    title: 'Respect',
    intro:
      'A stone bridge over a fast, cold river. A trainer in a sharp coat leans on the rail with his arms folded, and he does not move aside when you reach him. ' +
      'Three Poké Balls sit on his belt, polished until they shine. Marcus: "Only the best trainers get my respect." He looks you up and down, slowly, the way a buyer looks at a horse. Marcus: "Let\'s see if you\'re one."',
    choices: [
      ch('"Battle."', fight('Marcus unfolds his arms at last and almost smiles. Three Poké Balls open one after another, and every Pokémon that lands on the bridge is big, sharp and ready.',
        spar(MARCUS, { team: marcusTeam, size: 3, lv: 1, win: [moment('You earned Cooltrainer Marcus\'s respect on a bridge')], lose: [moment('Cooltrainer Marcus beat you on a bridge')] }), MA.set('m1'))),
      ch('"What counts as best?"', fight('Marcus: "Winning." He says it like it is the only word in the dictionary that matters. Then his coat flares as he throws, and the battle is on.',
        spar(MARCUS, { team: marcusTeam, size: 3, lv: 1, win: [moment('You earned Cooltrainer Marcus\'s respect on a bridge')], lose: [moment('Cooltrainer Marcus beat you on a bridge')] }), MA.set('m1'))),
      // Judgment: the doc sets only `shrugged`, but its Meeting 2 reads it, so this choice also counts as the meeting (m1).
      ch('"Don\'t need it."', out('Marcus blinks. Nobody has ever told him that before; you can see it land. Then he laughs, a real one that cracks his whole careful face open, and he steps aside to let you cross.', MA.set('m1'), MA.set('shrugged'))),
    ],
  }),
  MA.meet(2, {
    title: 'The Loss',
    intro:
      'Outside a Pokémon League gate, past the banners and the crowd, a sharp coat lies crumpled on the ground. Marcus sits beside it on the kerb with his elbows on his knees. ' +
      'Marcus: "I lost in the first round. To a kid. A kid with a Snubbull." He laughs, but there is nothing in it. Marcus: "I\'ve been the best on every route. And I lost to a Snubbull."',
    choices: [
      ch('"So learn from it."', out('Marcus looks at you for a long moment. Then he picks up his coat, shakes the dust off it, and asks you, quietly, what you think he did wrong.', MA.set('m2'), room(MA.roomId('learn')))),
      ch('"Rematch the kid."', out('The kid says yes before Marcus has finished asking. This time Marcus wins, cleanly, every move right. The kid shakes his hand and runs off happy. Marcus stands there with the win in his hands and does not feel any better at all.',
        MA.set('m2'), MA.set('rematch'))),
      ch('"Battle me."', fight('Marcus is on his feet before you finish. He fights angry: he throws out his biggest hitter and keeps it in long after it should have come out, and he makes mistakes he would never have made on a bridge.',
        spar(MARCUS, { team: marcusTeam, size: 3, win: [moment('You beat an angry Marcus outside the League gate')], lose: [moment('An angry Marcus beat you outside the League gate')] }), MA.set('m2'), MA.set('angry'))),
    ],
    remembers: [
      variant('shrugged', [MA.is('shrugged')], { notice: 'He glances up when he sees you, and something in his face shifts. Marcus: "You didn\'t care about my respect. I\'ve been thinking about that."' }),
    ],
  }),
  MA.room('learn', {
    title: 'What Went Wrong',
    intro: 'Marcus pulls his coat back on and sits up straight, like a student at the front of a class. He has replayed the match in his head a hundred times. He wants to hear it from someone else.',
    choices: [
      ch('"You hit too hard."', out('Marcus frowns and turns it over slowly. Marcus: "No. I always hit hard." Then his eyes go wide. Marcus: "I never switch. I never once switched." He stares at the gate like it has finally told him its secret.', MA.set('learned'))),
      ch('"You underestimated the kid."', out('He nods, but it does not sit right with him; you can see him keep digging. Marcus: "...No. I never switch. That kid switched four times." He laughs, the first real laugh of the day.', MA.set('learned'))),
      ch('"You never switch."', out('Marcus goes very still. Then he lets out a long breath, as if he has put down something heavy he has carried for years. Marcus: "I never switch." He says it again, quieter, and writes it on the back of his hand.', MA.set('learned'))),
    ],
  }),
  MA.meet(3, {
    title: 'Coach',
    intro:
      'A dusty practice field behind a Pokémon Center. Marcus, coat off and sleeves rolled up, is crouched beside the kid from the League, pointing at things. The Snubbull has grown into a Granbull, and it watches him like he hung the moon. ' +
      'Marcus sees you and stands, grinning. Marcus: "Turns out I\'m better at this than at winning."',
    choices: [
      ch('"Battle the kid."', fight('The kid squeaks with excitement. Marcus folds his arms, the way he used to on the bridge, but now he is nodding along to every move. The Granbull is very, very good.',
        spar('The Snubbull Kid', { team: ['granbull'], size: 1, lv: 1, win: [moment('You beat the kid Marcus coaches, and their Granbull')], lose: [moment('The kid Marcus coaches beat you with a Granbull')] }), MA.set('done'), choiceKit)),
      ch('"Battle Marcus."', fight('Marcus grins and takes the field himself. He switches now, smoothly and without pride, and he is far better than the trainer on the bridge ever was.',
        spar(MARCUS, { team: marcusTeam, size: 3, lv: 2, win: [moment('You beat Coach Marcus, who switches now')], lose: [moment('Coach Marcus beat you, switching like a master')] }), MA.set('done'), choiceKit)),
      ch('"Ask what changed."', out('Marcus watches the kid run the Granbull through a drill, and you see how proud he is. Marcus: "Best isn\'t winning. Best\'s the one who makes others better." He digs in his old bag and hands you a Choice item he does not need any more.', MA.set('done'), choiceKit)),
    ],
  }),
];

// ---------- RR13. Cooltrainer Selene (morning, night; Alakazam, Gardevoir, Espeon) ----------
const SE = rosterKit('selene', 'npc-meet-cooltrainer-selene', 'Cooltrainer Selene');
const SELENE = 'Cooltrainer Selene';
const seleneTeam = ['alakazam', 'gardevoir', 'espeon'];
const spoon = item('twistedspoon');

const selene: Json[] = [
  SE.meet(1, {
    title: 'Flawless',
    intro:
      'A lighthouse on a windy point, its door propped open with a stone. A trainer sits in the doorway with a thick notebook on her knees, every page crammed with tiny tables and arrows. ' +
      'Selene: "My strategy is flawless. I\'ve modelled every type matchup." She snaps the notebook shut and stands, brushing salt off her coat. Selene: "Let\'s test it."',
    choices: [
      ch('"Battle."', fight('Selene does not even look at the field when you make your first switch; she has already called it out loud, a heartbeat before you do it. She smiles very slightly and writes something down.',
        spar(SELENE, { team: seleneTeam, size: 3, lv: 1, win: [moment('You broke Cooltrainer Selene\'s flawless model')], lose: [moment('Cooltrainer Selene predicted you perfectly')] }), SE.set('m1'))),
      ch('"Show me the notes."', fight('Selene hesitates, then hands the notebook over, almost proud. Her Alakazam\'s moves are right there, underlined twice: Psychic, Shadow Ball. You read the rest of her team before she takes the book back and calls out her first Pokémon.',
        spar(SELENE, { team: seleneTeam, size: 3, lv: 1, foeMoves: ['psychic', 'shadow-ball'], win: [moment('You read Selene\'s notes and beat her model')], lose: [moment('Selene beat you even after you read her notes')] }), SE.set('m1'), SE.set('notes'))),
      ch('"Strategy\'s boring."', fight('Selene: "Then you\'ll lose." She says it without any heat at all, as a plain fact, and opens the notebook to a fresh page before the first Pokémon is out.',
        spar(SELENE, { team: seleneTeam, size: 3, lv: 1, win: [moment('You beat Cooltrainer Selene without a plan')], lose: [moment('Cooltrainer Selene beat you, as she said she would')] }), SE.set('m1'))),
    ],
  }),
  SE.meet(2, {
    title: 'The Glitch',
    intro:
      'The lighthouse steps, grey morning. Selene sits halfway up them with her notebook torn clean in half, pages scattered down the stone and snatched at by the wind. ' +
      'Selene: "A wild Ditto. It beat my whole model. It just copied everything." She picks up one torn page and looks at it like it betrayed her. Selene: "I don\'t know how to plan for that."',
    choices: [
      ch('"You can\'t plan for everything."', out('Selene is quiet for a long time, gathering the torn pages into a neat pile she will never use. Selene: "I hate that." But she does not argue, and when you leave she is watching the sea instead of the notebook.', SE.set('m2'), SE.set('accepted'))),
      ch('"Catch that Ditto."', out('Selene\'s head comes up. For a second she looks like herself again. She points down the shore, where something pink was last seen sliding between the rocks, and grabs her coat.', SE.set('m2'), room(SE.roomId('ditto-trail')))),
      ch('"Plan with me."', out('Selene takes a fresh page from her bag and starts writing at once. She asks about your next big battle and builds a plan around it, line by line. When she tears the page out for you, one hint at the bottom is circled twice.', SE.set('m2'), SE.set('planned'), gym())),
    ],
  }),
  SE.room('ditto-trail', {
    title: 'The Pink Trail',
    intro: 'A bend of the shore later, Selene crouches by a tide pool. In the wet sand: a Krabby\'s tracks, then a Wingull\'s, then a Shellos\'s, all made by the same blob that keeps changing its feet. Selene: "It\'s copying the tracks too. Of course it is."',
    choices: [
      ch('"Follow the strangest tracks."', out('You follow the prints that make no sense at all, and they lead round the point toward the old pier. Selene keeps up, muttering notes she is not writing down.', room(SE.roomId('ditto')))),
      ch('"Wait for it to come to us."', out('You sit still by the pool. Selene lasts four minutes before she gets up and starts walking, and you follow her toward the old pier, where the tracks were heading anyway.', room(SE.roomId('ditto')))),
    ],
  }),
  SE.room('ditto', {
    title: 'The Copycat',
    intro: 'Under the old pier, two nodes down the shore from the lighthouse, a small pink blob blinks at you from a coil of rope. It looks at your lead. It starts, unmistakably, to change shape.',
    scene: sceneOf('npc-meet-cooltrainer-selene', { pokemon: 'ditto' }),
    choices: [
      ch('"Battle it."', fight('The Ditto becomes your lead the instant it touches the sand, every move the same. Selene watches the whole fight with her mouth slightly open, and does not write a single thing down.',
        wildSpar({ species: ['ditto'], win: [moment('You faced the Ditto that broke Selene\'s model')], lose: [moment('The Ditto that broke Selene\'s model beat you too')] }), SE.set('ditto'))),
      ch('"Let Selene try."', fight('Selene steps forward with no notebook in her hands at all. Selene: "No plan. Fine." She falters, so you step in beside her and the Ditto copies you instead.',
        wildSpar({ species: ['ditto'], win: [moment('You and Selene faced the Ditto under the pier')], lose: [moment('The Ditto under the pier copied you into a corner')] }), SE.set('ditto'))),
    ],
  }),
  SE.meet(3, {
    title: 'Improvised',
    intro:
      'The lighthouse again, but Selene is outside it, sitting on the rail with no notebook anywhere. A Ditto rides on her shoulder like a pink scarf and copies her frown when she sees you. ' +
      'Selene: "I\'m trying a new strategy: no strategy. I\'m terrible at it." She says it with a laugh, which is new, and the Ditto laughs too, sort of.',
    choices: [
      ch('"Battle."', fight('Selene tosses her three Poké Balls into the air and lets them land in any order they like. She has no idea who comes out first, and she laughs, delighted, when she finds out.',
        spar(SELENE, { team: ['espeon', 'gardevoir', 'alakazam'], size: 3, lv: 1, win: [moment('You beat Selene\'s no-strategy strategy')], lose: [moment('Selene beat you with no plan at all')] }), SE.set('done'), spoon)),
      ch('"Teach me to plan."', out('Selene lights up and borrows a pencil. She teaches you how to read a boss before the boss reads you, so for the rest of this region you will see the first move of every boss coming. She gives you a Twisted Spoon to stir it with.', SE.set('done'), SE.set('boss-first-move'), spoon)),
      ch('"Teach me to improvise."', out('Selene: "You\'re asking the wrong person." But she tries anyway, and you both end up laughing on the rail. For the rest of this region, your lead gains +1 Speed whenever it is switched in. She presses a Twisted Spoon into your hand.', SE.set('done'), SE.set('switch-speed'), spoon)),
    ],
  }),
];

// ---------- RR14. Crush Girl Tamsin (morning, night; Machop, Hitmontop, Hawlucha) ----------
const TA = rosterKit('tamsin', 'npc-meet-crush-girl-tamsin', 'Crush Girl Tamsin');
const TAMSIN = 'Crush Girl Tamsin';
const tamsinTeam = ['machop', 'hitmontop', 'hawlucha'];
const belt = item('expert-belt');

const tamsin: Json[] = [
  TA.meet(1, {
    title: 'Another Punch',
    intro:
      'A gym yard, packed earth and chalk lines. A girl in taped gloves is hitting a punching bag so hard the chain creaks with every blow, her Machop copying her stance at her side. ' +
      'Tamsin: "Throw a punch, then another!" She does not stop to look at you. Thud, thud, thud. Tamsin: "My coach says never stop. So I don\'t."',
    choices: [
      ch('"Battle."', fight('Tamsin turns from the bag without even catching her breath. Her team comes at you all-out, every turn an attack, and she never once switches.',
        spar(TAMSIN, { team: tamsinTeam, size: 3, win: [moment('You weathered Crush Girl Tamsin\'s all-out offence')], lose: [moment('Crush Girl Tamsin punched straight through you')] }), TA.set('m1'))),
      ch('"When do you rest?"', fight('Tamsin\'s fist stops an inch from the bag. Tamsin: "...What\'s that?" She honestly does not know. Then she shakes it off, and her Machop is already in the ring.',
        spar(TAMSIN, { team: tamsinTeam, size: 3, win: [moment('You beat Tamsin, who has never rested')], lose: [moment('Tamsin, who has never rested, beat you')] }), TA.set('m1'), TA.set('asked'))),
      ch('"Leave."', out('You leave her to it. Long after the gym yard is out of sight, you can still hear the chain creaking.')),
    ],
  }),
  TA.meet(2, {
    title: 'New Coach',
    intro:
      'The same gym yard, but quieter. Tamsin sits on the bench with a new coach beside her, a much older woman with a cane and kind eyes. Her Machop sits between them with one arm wrapped in a thick bandage. ' +
      'Tamsin: "Old coach worked us till we broke. Machop\'s arm." She will not look at it. The old woman taps the bench with her cane. New coach, Ellery: "Rest is training. Tell her."',
    choices: [
      ch('"Listen to Ellery."', out('Tamsin tries resting. She hates it, loudly, every single minute of it, and complains the whole afternoon. But by evening her Machop is flexing its arm without wincing, and she sits very still watching it.', TA.set('m2'), TA.set('rested'))),
      ch('"Go back to the old coach."', out('Tamsin nods hard and goes back. Weeks of drills later, Machop\'s arm is worse, not better. She keeps battling on it anyway, hurt, with her jaw set and her eyes wet, because nobody ever taught her how to stop.', TA.set('m2'), TA.set('pushed'))),
      ch('"Battle me and decide."', fight('Ellery nods for a gentle battle, so you keep it slow and kind. Halfway through, Tamsin stops shouting orders and just watches her Machop: it is moving easily, and it looks happier than she has ever seen it.',
        spar(TAMSIN, { team: ['machop', 'hitmontop'], size: 2, lv: -1, win: [moment('A gentle battle showed Tamsin her Machop was happier')], lose: [moment('Tamsin won a gentle battle and learned something')] }), TA.set('m2'), TA.set('rested'))),
    ],
    remembers: [
      variant('asked', [TA.is('asked')], { notice: 'Tamsin looks up at you and her face goes red. Tamsin: "You asked about rest. I should\'ve listened."' }),
    ],
  }),
  TA.meet(3, {
    title: 'Champion Fist',
    intro:
      'A small tournament in a town hall, folding chairs and a hand-painted banner. Tamsin is in the final, bouncing on her toes in her corner, her Machamp beside her. She spots you in the crowd and points straight at you. ' +
      'Tamsin: "Watch. Then fight me after."',
    choices: [
      ch('"Cheer."', out('You cheer until your throat hurts. Tamsin wins the final, and when the bell goes she leaps the rope and hugs her Machamp, then Ellery, then a stranger. She pins an Expert Belt from her prize bag on you without asking.', TA.set('done'), belt)),
      ch('"Battle after."', fight('The trophy is still warm in her hands when she drops it on a chair and climbs back into the ring. Tamsin: "Okay. You now."',
        spar(TAMSIN, { team: ['machamp', 'hawlucha'], size: 2, lv: 1, win: [moment('You beat tournament champion Tamsin')], lose: [moment('Tournament champion Tamsin beat you too')] }), TA.set('done'), belt)),
      ch('"Coach her between rounds."', out('Tamsin drags you into her corner by the sleeve. Ellery hands you a towel and nods: you are in charge. The bell rings for the break, and Tamsin looks to you.', room(TA.roomId('coach')))),
      // Slot 3: "Cheer." when she was pushed (the 'pushed' variant shows it; the other hides it).
      ch('"Cheer."', out('You cheer for every round. Tamsin loses the final, and her Machop retires afterwards, its arm done for good. She sits on the edge of the ring holding it. She is okay, mostly. She gives you an Expert Belt anyway.', TA.set('done'), belt)),
    ],
    remembers: [
      variant('pushed', [TA.is('pushed')], {
        intro: 'A small tournament in a town hall, folding chairs and a hand-painted banner. Tamsin is in the final, bouncing on her toes in her corner, but there is no Machamp beside her: her Machop sits in the front row with its arm in a sling, watching. She spots you and points. Tamsin: "Watch. Then fight me after."',
        hide: [0, 1, 2],
        add: [
          ch('"Battle after."', fight('Tamsin wipes her eyes on her glove and climbs back into the ring. Tamsin: "Okay. You now." Her Machop watches from the front row.',
            spar(TAMSIN, { team: ['hawlucha', 'hitmontop'], size: 2, lv: 1, win: [moment('You battled Tamsin the day her Machop retired')], lose: [moment('Tamsin beat you the day her Machop retired')] }), TA.set('done'), belt)),
          ch('"Coach her between rounds."', out('You call every switch you can, but the old injury decides it. Tamsin loses the final, and her Machop retires afterwards. She thanks you for trying. She is okay, mostly, and gives you an Expert Belt.', TA.set('done'), belt)),
        ],
      }),
      variant('fit', [TA.not('pushed')], { hide: [3] }),
    ],
  }),
  TA.room('coach', {
    title: 'In Her Corner',
    intro: 'The break between rounds. Her Machamp is breathing hard; the other trainer\'s Pokémon is fresh. Tamsin grips the rope. Tamsin: "Who do I send? Tell me quick."',
    choices: [
      ch('"Switch to Hitmontop."', out('Tamsin switches without a word of argument, which she has never done in her life. Hitmontop spins the final round away, and she wins. Tamsin: "Thanks. I mean it." She hands you an Expert Belt.', TA.set('done'), belt)),
      ch('"Switch to Hawlucha."', out('Hawlucha dives off the corner post and wins it in three moves. Tamsin screams, and then hugs you so hard your feet leave the floor. Tamsin: "Thanks. I mean it." She gives you an Expert Belt.', TA.set('done'), belt)),
    ],
  }),
];

// ---------- RR15. Crush Kin Ivan and Mira (doubles; afternoon, evening; Hariyama, Medicham) ----------
const KI = rosterKit('kin', 'npc-meet-crush-kin-ivan-and-mira', 'Crush Kin Ivan and Mira');
const KIN = 'Crush Kin Ivan and Mira';
const focusBand = item('focus-band');
const KIN_ID = 'npc-meet-crush-kin-ivan-and-mira';

const kin: Json[] = [
  KI.meet(1, {
    title: 'Double the Pressure',
    intro:
      'A dirt road between two fields. A brother and sister stand back to back in the middle of it, matching gis, matching scuffed knuckles, blocking the whole way. ' +
      'Ivan: "Two trainers, double the pressure!" His sister rolls her eyes without turning round. Mira: "He means double the punches."',
    choices: [
      ch('"Battle."', fight('They spin apart in perfect time and throw together. Hariyama and Medicham land shoulder to shoulder, and the road shakes.',
        spar(KIN, { format: 'doubles', team: ['hariyama', 'medicham'], size: 2, win: [moment('You beat the Crush Kin in a double battle')], lose: [moment('The Crush Kin beat you two on one')] }), KI.set('m1'))),
      ch('"Who\'s older?"', out('Both of them say "Me!" at exactly the same moment. Then they argue about it for ten minutes, each with a long list of proof, while you sit on a fence and eat lunch. Neither ever wins.', KI.set('m1'))),
      ch('"One at a time?"', out('They look at you as if you suggested they cut off an arm. Ivan: "Together or nothing." They refuse, and stay back to back on the road.')),
    ],
  }),
  KI.meet(2, {
    title: 'The Move',
    intro:
      'A train platform at the edge of town. Mira sits alone on a bench, no Ivan in sight, turning a train ticket over and over in her fingers until the corners are soft. ' +
      'Mira: "I got into a dojo in another region. Ivan doesn\'t know." She looks down the line, where the tracks bend out of sight.',
    choices: [
      ch('"Tell him."', out('Mira takes a breath and goes to find him. It is a hard conversation, out behind the station, and you hear most of it. Ivan is happy for her and devastated, both at once, and by the end they are both crying and laughing.', KI.set('m2'), KI.set('told'))),
      ch('"Go without telling."', out('Mira nods, puts the ticket in her pocket and boards the next train without looking back. Ivan finds out from a note she left on his pillow. You hear about it later from a stranger: he read it standing up.', KI.set('m2'), KI.set('note'))),
      ch('"I\'ll tell him."', out('You find Ivan and tell him. He is angry at you first, red-faced and shouting. Then the anger has nowhere left to go, and he sits down in the dust, angry at nobody, and asks when her train leaves.', KI.set('m2'), KI.set('messenger'))),
    ],
  }),
  // Meeting 3 happens in two different regions; both meetings count. Ivan first (a callback one region after Meeting 2), Mira a region later (the arc's -m3).
  {
    ...KI.room('ivan', {
      title: 'Two Regions: Ivan',
      intro:
        'Ivan\'s home road, without his sister. He is training alone with his Hariyama, and he is better: tighter, calmer, less shouting. A thick bundle of letters is tucked into his belt. ' +
        'Ivan: "She writes every week. I\'m getting better." He pats the letters without thinking about it.',
      choices: [
        ch('"Battle."', fight('Ivan bows, which he never used to do. In singles, without his sister at his back, he is much stronger than before.',
          spar('Crush Kin Ivan', { team: ['hariyama'], size: 1, lv: 2, win: [moment('You beat Ivan in singles, a region away from his sister')], lose: [moment('Ivan beat you in singles, much stronger than before')] }), KI.set('ivan'))),
        ch('"Carry a letter."', out('Ivan goes red and pulls a crumpled letter from his belt, the newest one, the longest one he has ever written. Ivan: "For Mira. If you see her." You tuck it somewhere safe.', KI.set('ivan'), KI.set('letter'))),
      ],
    }),
    room: false, callback: true, rarity: 'uncommon', minStage: 1,
    requires: [...hoursOf(KIN_ID), flagAgo(KI.key('m2'), 1), not(KI.key('ivan')), not(KI.key('done'))],
  },
  KI.meet(3, {
    title: 'Two Regions: Mira',
    requires: [flagAgo(KI.key('ivan'), 1)],
    intro:
      'A dojo in another region, far from the dirt road. Mira is on the mat, sweat on her brow, her Medicham mirroring her stance. A little screen on the wall plays a battle video: Ivan, fighting. ' +
      'Mira: "He sends me his battle videos. He\'s getting better." She pauses the video on his face and smiles at it.',
    choices: [
      ch('"Battle."', fight('Mira steps onto the mat and bows the way the dojo taught her. In singles, Medicham alone, she is much stronger than before. When it is over she ties a Focus Band round your wrist.',
        spar('Crush Kin Mira', { team: ['medicham'], size: 1, lv: 2, win: [moment('You beat Mira in singles, a region away from her brother')], lose: [moment('Mira beat you in singles, much stronger than before')] }), KI.set('done'), focusBand)),
      ch('"Carry a letter."', out('Mira writes back on the spot and folds in a hand-drawn photo of the two of them back to back, the way they used to stand on the road. You promise to post it. She gives you a Focus Band for the trouble.', KI.set('done'), moment('Mira drew the Crush Kin back to back for Ivan'), focusBand)),
    ],
    remembers: [
      variant('note-letter', [KI.is('note'), KI.is('letter')], { notice: 'You hand her Ivan\'s letter. She lays it beside the first ones he sent: short at first, then longer and longer. This one is the longest. Taped inside is a hand-drawn photo of them both.' }),
      variant('note', [KI.is('note')], { notice: 'Mira shows you his letters, pinned in a row on the wall. Ivan\'s letters were short at first, and they get longer.' }),
      variant('letter', [KI.is('letter')], { notice: 'You hand her Ivan\'s letter. She reads it twice and laughs. Taped inside is a hand-drawn photo of them both, back to back.' }),
    ],
  }),
];

// ---------- RR16. Cue Ball Dutch (morning, afternoon; Primeape, Pangoro) ----------
const DU = rosterKit('dutch', 'npc-meet-cue-ball-dutch', 'Cue Ball Dutch');
const DUTCH = 'Cue Ball Dutch';
const muscle = item('muscle-band');

const dutch: Json[] = [
  DU.meet(1, {
    title: 'Show Me',
    intro:
      'A wooden bridge over a slow river, and in the middle of it a toll booth somebody has painted with roaring orange flames. A huge bald man in a leather vest fills the booth\'s doorway, his head shining in the sun. ' +
      'Dutch: "Show me what you\'ve got!" He cracks his knuckles, one hand, then the other. Dutch: "Toll\'s a battle."',
    choices: [
      ch('"Battle."', fight('Dutch roars with laughter and throws. His Primeape lands on the toll booth roof, already furious about something, and leaps.',
        spar(DUTCH, { team: ['primeape'], size: 1, win: [moment('You paid Cue Ball Dutch\'s toll in battle')], lose: [moment('Cue Ball Dutch\'s Primeape took the toll')] }), DU.set('m1'))),
      ch('"Pay a toll instead."', out('Dutch looks almost hurt, but a toll\'s a toll. He takes your 200 and counts it twice with great dignity, then lifts the barrier with one finger.', $(-200)), { requires: [money(200)] }),
      // TODO(takeNode): "one node lost" (the shared takeNode effect is not merged yet).
      ch('"Swim."', out('Your Water-type takes you on its back and ferries you across, the current pulling you well downstream. Dutch waves from the bridge, baffled. It costs you a long walk back to the path.'), { requires: [ptype('water')] }),
    ],
  }),
  DU.meet(2, {
    title: 'Bad News',
    intro:
      'The flame-painted toll booth, but no roar this time. Dutch sits on the step with a letter in his huge hands, reading it for what looks like the tenth time. ' +
      'Dutch: "Bridge is getting knocked down. New highway." He folds the letter very small. Dutch: "This booth\'s all I\'ve got."',
    choices: [
      ch('"Fight it."', fight('Dutch marches you both to the town hall and demands a hearing. The council agrees to settle it the old way. When the dust clears, the old bridge is kept as a footpath, and Dutch cries openly in the hallway.',
        spar('The Town Council', { cls: 'veteran', size: 2, win: [moment('You battled the town council to save Dutch\'s bridge')], lose: [moment('You lost to the council, but they kept Dutch\'s bridge anyway')] }), DU.set('m2'), DU.set('kept'))),
      ch('"Come with the new road."', out('Dutch looks at the letter again, then at the surveyors\' flags in the distance. He walks over and asks for a job. By the end of the day he has a hard hat and a place on the highway crew, and the hat barely fits.', DU.set('m2'), DU.set('crew'))),
      ch('"Move the booth."', out('Dutch makes one phone call. By afternoon a Machamp crew arrives, lifts the whole flame-painted booth onto their shoulders and carries it down the river to a riverside park, with Dutch walking beside it like a proud parent.', DU.set('m2'), DU.set('moved'))),
    ],
  }),
  DU.meet(3, {
    title: 'Toll\'s a Smile',
    intro:
      'Dutch, wherever he landed, and he is grinning so wide his whole bald head wrinkles. A line of kids waits at his booth, each one pulling a face at him as they pass. ' +
      'Dutch: "Toll\'s changed. Toll\'s a smile now. Kids love it."',
    choices: [
      ch('"Smile."', out('You smile, and Dutch roars with laughter and waves you through like royalty. He presses a Muscle Band from his old toll days into your hand as you pass. Dutch: "Keep that smile on."', DU.set('done'), muscle)),
      ch('"Battle anyway."', fight('Dutch: "For old times!" Pangoro and Primeape both land on the booth roof, and the kids cheer for whoever is winning.',
        spar(DUTCH, { team: ['pangoro', 'primeape'], size: 2, lv: 1, win: [moment('You battled Cue Ball Dutch for old times')], lose: [moment('Cue Ball Dutch beat you, for old times')] }), DU.set('done'), muscle)),
      ch('"Paint the booth."', out('Dutch hands you a brush and a dented tin of paint. The old flames are flaking. Dutch: "Your call. What colour?"', room(DU.roomId('paint')))),
    ],
    remembers: [
      variant('kept', [DU.is('kept')], { intro: 'The old bridge, kept as a footpath, with the flame-painted booth still in the middle of it. Dutch is grinning so wide his whole bald head wrinkles, and a line of kids waits to cross. Dutch: "Toll\'s changed. Toll\'s a smile now. Kids love it."' }),
      variant('crew', [DU.is('crew')], { intro: 'A rest stop on the new highway, and the old flame-painted booth sits at its edge as the crew\'s tea hut. Dutch, hard hat on, is grinning so wide his bald head wrinkles. Kids line up. Dutch: "Toll\'s changed. Toll\'s a smile now. Kids love it."' }),
      variant('moved', [DU.is('moved')], { intro: 'A riverside park, and the flame-painted booth stands by the water where the Machamp crew set it down. Dutch is grinning so wide his whole bald head wrinkles. Kids line up. Dutch: "Toll\'s changed. Toll\'s a smile now. Kids love it."' }),
    ],
  }),
  DU.room('paint', {
    title: 'A New Coat',
    intro: 'Dutch holds the ladder steady with one hand, which is all he needs. The kids crowd round to watch. Every one of them has an opinion about the colour.',
    choices: [
      ch('"Bright red flames, fresh."', out('You repaint the flames as bright as new. Dutch stands back and wipes his eyes. Dutch: "Like the first day." He gives you a Muscle Band, and says that booth is going to the Final Reunion.', DU.set('done'), DU.set('paint', 1), moment('You repainted Dutch\'s booth with red flames'), muscle)),
      ch('"Sky blue, with clouds."', out('Sky blue, with fat white clouds. The kids add a Primeape in the corner. Dutch laughs until he has to sit down, and gives you a Muscle Band. He says that booth is going to the Final Reunion.', DU.set('done'), DU.set('paint', 2), moment('You repainted Dutch\'s booth sky blue'), muscle)),
      ch('"Sunshine yellow, with smiles."', out('Sunshine yellow, covered in painted smiles, one for every kid in line. Dutch: "Perfect. Toll\'s a smile." He gives you a Muscle Band. That booth is going to the Final Reunion.', DU.set('done'), DU.set('paint', 3), moment('You painted Dutch\'s booth sunshine yellow'), muscle)),
    ],
  }),
];

// ---------- RR17. Engineer Baxter (evening, night; Magnezone, Rotom, Klinklang) ----------
const BA = rosterKit('baxter', 'npc-meet-engineer-baxter', 'Engineer Baxter');
const BAXTER = 'Engineer Baxter';
const magnet = item('magnet');

const baxter: Json[] = [
  BA.meet(1, {
    title: 'On Current',
    intro:
      'A power station at night, humming behind its fence. A man with a heavy toolbelt sits on an upturned crate, tapping his headlamp, which flickers on, off, on. A Klinklang turns slowly beside him like a clock. ' +
      'Baxter: "Everything runs on current, even teams." He gives the lamp one more tap. It dies.',
    choices: [
      ch('"Battle."', fight('Baxter grins in the dark and sends out Magnezone and Klinklang. Sparks jump between them and light up the fence.',
        spar(BAXTER, { team: ['magnezone', 'klinklang'], size: 2, win: [moment('You beat Engineer Baxter at the power station')], lose: [moment('Engineer Baxter beat you at the power station')] }), BA.set('m1'))),
      ch('"Fix your lamp."', out('Your Electric-type touches the headlamp and it blazes on, brighter than it has been in years. Baxter laughs and digs in his belt. Baxter: "Here. You\'ve earned it." It is a Cell Battery.', BA.set('m1'), item('cell-battery')), { requires: [ptype('electric')] }),
      ch('"Leave."', out('You leave him in the dark with his flickering lamp and his humming station.')),
    ],
  }),
  BA.meet(2, {
    title: 'The Blackout',
    intro:
      'A town with every window dark. Baxter is up a ladder against a substation box, his headlamp the only light on the street, wires in his teeth. ' +
      'Baxter: "Someone\'s been feeding the substation to a Pokémon. I keep fixing it, it keeps going out." Below him, frightened faces peer from doorways.',
    choices: [
      ch('"Follow the cables."', out('You follow the chewed cables out of town into the dark, where they run toward a low, strange humming, like many voices singing in the static. Baxter calls after you to be careful.', BA.set('m2'), BA.set('cables'))),
      // TODO(takeNode): "one rest node used" (the shared takeNode effect is not merged yet).
      ch('"Help fix it."', out('You hold the ladder and pass up tools until well past midnight, the hours you would have spent resting. Then the lights come on across town all at once, and people cheer from their windows. Power for one night, at least.', BA.set('m2'), BA.set('fixed'))),
      ch('"Find who\'s doing it."', out('You stake out the substation with Baxter. Near dawn, a figure in a dark uniform slips in with a bag of fresh cable cutters. Their orders fall out of a pocket as they run: the next step of their plan.', BA.set('m2'), BA.set('team'))),
    ],
  }),
  BA.meet(3, {
    title: 'The Rotom',
    intro:
      'Baxter\'s workshop, cluttered and warm. A Rotom zips between the appliances, popping in and out of a washing machine, a fan, a toaster, making each one hum. ' +
      'Baxter: "Moved in after the blackout. Won\'t leave. Wants to be useful." The toaster pops, apparently in agreement.',
    choices: [
      ch('"Battle."', fight('Baxter: "Let\'s see what it\'s learned." The Rotom dives into the washing machine and comes out spinning, Magnezone beside it.',
        spar(BAXTER, { team: ['rotom-wash', 'magnezone'], size: 2, lv: 1, win: [moment('You beat Baxter and his washing-machine Rotom')], lose: [moment('Baxter\'s washing-machine Rotom beat you')] }), BA.set('done'), magnet)),
      ch('"Take the Rotom."', out('Baxter looks at the Rotom. The Rotom looks at you, then zips into your bag, which hums. Baxter: "Guess it\'s decided." He looks a little sad, and a little relieved about the toaster.', BA.set('done'), join({ species: ['rotom'] }))),
      ch('"Give it a job."', out('You and Baxter set the Rotom to running the workshop: the lathe, the lights, the kettle. It is thrilled and does everything at once. Baxter, happier than you have ever seen him, gives you a Magnet.', BA.set('done'), magnet)),
    ],
  }),
];

// ---------- RR18. Fisherman Elliot (morning, evening; Gyarados, Kingdra, Lanturn) ----------
const EL = rosterKit('elliot', 'npc-meet-fisherman-elliot', 'Fisherman Elliot');
const ELLIOT = 'Fisherman Elliot';
const superRod = item('super-rod');
const elliotSpar = (text: string): Json => fight(text,
  spar(ELLIOT, { team: ['gyarados', 'lanturn'], size: 2, win: [moment('You beat Fisherman Elliot on his pier')], lose: [moment('Fisherman Elliot beat you, slow and steady')] }));

const elliot: Json[] = [
  EL.meet(1, {
    title: 'Patience',
    intro:
      'A long wooden pier in soft light. A man in a battered hat sits on the very end with his rod out, and from the look of the dust on his boots he has not moved in hours. ' +
      'Elliot: "Patience is the whole trick." He does not look round. He pats the plank beside him. Elliot: "Battle? Sure. Sit first."',
    choices: [
      ch('"Sit."', out('You sit. The water laps. A Wingull lands on the rail and leaves again. Neither of you says anything for a long, long time, and slowly your shoulders come down from round your ears. Then he reels in and nods at the shore.', EL.set('m1'), room(EL.roomId('patience')))),
      ch('"Battle now."', { ...elliotSpar('Elliot: "Hm." He sets the rod down with a sigh, very slowly, and only then reaches for his Poké Balls.'), effects: [EL.set('m1')] }),
      ch('"Fish with him."', out('Elliot hands you a spare rod without a word. Your line goes taut, and you bring up a fine catch, the kind a Good Rod pulls in. Elliot: "Hm. Not bad." That is high praise.', EL.set('m1'), EL.set('fished'), join({ species: ['poliwag', 'goldeen', 'krabby', 'horsea', 'shellder'] })),
        { prompt: { id: 'pull-hold', needs: 'good' }, fail: out('Your line jerks and you nearly lose the rod. Elliot reaches over with one hand and steadies it, and together you bring up a fine catch, the kind a Good Rod pulls in. Elliot: "Hm. Patience."', EL.set('m1'), EL.set('fished'), join({ species: ['poliwag', 'goldeen', 'krabby', 'horsea', 'shellder'] })) }),
    ],
  }),
  EL.room('patience', {
    title: 'Slow and Steady',
    intro: 'A node of calm later, on the grass at the end of the pier, Elliot finally stands and stretches until his back cracks. Elliot: "Right. Now we battle."',
    choices: [
      ch('"Ready when you are."', elliotSpar('He battles exactly the way he fishes: slow and steady, never rushing, waiting for you to make the first mistake.')),
      ch('"One more minute."', elliotSpar('Elliot actually smiles. Elliot: "You learn fast." He gives you your minute, then battles slow and steady, never rushing.')),
    ],
  }),
  EL.meet(2, {
    title: 'The Big One',
    intro:
      'The pier at dawn, mist on the water. Elliot is on his feet for once, braced against the rail, his rod bent double and the line singing. Something huge moves under the surface. ' +
      'Elliot: "Twenty years I\'ve waited for this one. Help me hold."',
    scene: sceneOf('npc-meet-fisherman-elliot', { pokemon: 'kingdra' }),
    choices: [
      ch('"Hold the rod."', out('You grab the rod beside him and pull until your arms burn. A Kingdra breaks the surface, enormous, the biggest anyone has ever seen. Elliot lands it, looks at it for one long minute, and lets it go. Elliot: "Twenty years. Worth it."', EL.set('m2'), EL.set('landed')),
        { prompt: { id: 'pull-hold', needs: 'good' }, fail: out('Your grip slips, but Elliot does not. He hauls, and an enormous Kingdra breaks the surface. He lands it, gazes at it for a long minute, and gently lets it go.', EL.set('m2'), EL.set('landed')) }),
      ch('"Let it go."', out('You reach over and cut the line. Elliot stares at the empty water. Elliot: "...Yeah. Twenty more years, then." Then he laughs, a big surprised laugh that echoes off the water.', EL.set('m2'), EL.set('released'))),
      ch('"Battle it out of the water."', fight('Elliot: "Do it." The line snaps and an enormous Kingdra rises out of the water to face you. If you can, it is yours to catch.',
        wildSpar({ species: ['kingdra'], lv: 2, win: [moment('You battled the Big One out of the water')], lose: [moment('The Big One slipped back under the pier')] }), EL.set('m2'), EL.set('battled'))),
    ],
  }),
  EL.meet(3, {
    title: 'Grandson',
    intro:
      'The pier again. Elliot sits on the end with a little boy beside him holding a bright plastic toy rod, wriggling, kicking his feet, asking if it is a fish yet every ten seconds. ' +
      'Elliot: "Teaching him patience. He has none. Like you."',
    choices: [
      ch('"Battle."', fight('The boy cheers for both of you at once. Elliot fights slow and steady with Kingdra and Lanturn. When it is done, he gives you his old Super Rod.',
        spar(ELLIOT, { team: ['kingdra', 'lanturn'], size: 2, lv: 1, win: [moment('You beat Fisherman Elliot in front of his grandson')], lose: [moment('Fisherman Elliot beat you in front of his grandson')] }), EL.set('done'), superRod)),
      ch('"Fish with them."', out('Three lines in the water. The boy lasts a minute, then two, then five. Elliot is so proud he forgets his own rod. Afterwards he gives you a Super Rod.', EL.set('done'), superRod)),
      ch('"Tell the boy about the Big One."', out('You tell it big. The boy wants to see it. And as if it heard, the Big One surfaces, enormous, right by the pier. The boy is quiet for the first time in his life. Elliot gives you a Super Rod.', EL.set('done'), superRod)),
    ],
    remembers: [
      variant('caught', [EL.is('battled'), { kind: 'partySpecies', species: 'kingdra' }], { notice: 'The boy tugs your sleeve and asks, very seriously, if he can see "Grandpa\'s fish" in your party. Elliot pretends not to listen.' }),
    ],
  }),
];

// ---------- RR19. Gambler Lucky (evening, night; Persian, Togekiss) ----------
const LU = rosterKit('lucky', 'npc-meet-gambler-lucky', 'Gambler Lucky');
const LUCKY = 'Gambler Lucky';
const luckyTeam = ['persian', 'togekiss'];
const amulet = item('amulet-coin');
const PAYBACK = 1100;

const luckyM3 = (extra: Json[]): Json[] => [
  ch('"Battle, no bet."', fight('No money on the table. Lucky plays it clean and grins the whole way through. Afterwards he says he enjoyed it more than any bet he ever won, and gives you an Amulet Coin.',
    spar(LUCKY, { team: luckyTeam, size: 2, lv: 1, win: [moment('You and Lucky battled for nothing, and he loved it')], lose: [moment('Lucky beat you clean, no bet')] }), LU.set('done'), amulet, ...extra)),
  ch('"Keep going."', out('Lucky looks at you, then at the coin. He presses it into your palm and closes your fingers over it. Lucky: "Keep it for me. Then I\'ll know I can\'t flip it."', LU.set('done'), moment('Lucky gave you his ninety-day coin, never flipped'), ...extra)),
];

const lucky: Json[] = [
  LU.meet(1, {
    title: 'Double or Nothing',
    intro:
      'A smoky back room behind a bar, one bare bulb over a green table. A man in a loud jacket shuffles a deck of cards with fast, beautiful hands, a Persian lounging on the table beside him. ' +
      'Lucky: "Double or nothing on this battle!" He fans the cards. Lucky: "I put up 500. You put up 500. Fair?"',
    choices: [
      ch('"Bet."', fight('You both lay 500 on the green table. The bet is real, and he does not cheat: Persian and Togekiss fight fair. The winner takes 1000.',
        spar(LUCKY, { team: luckyTeam, size: 2, win: [$(1000), moment('You won Gambler Lucky\'s double-or-nothing bet')], lose: [moment('You lost 500 to Gambler Lucky, fair and square')] }), $(-500), LU.set('m1'), LU.set('bet')), { requires: [money(500)] }),
      ch('"Battle for nothing."', fight('Lucky: "Where\'s the fun?" But he pockets the cards and plays anyway, for the normal prize.',
        spar(LUCKY, { team: luckyTeam, size: 2, win: [moment('You beat Gambler Lucky with nothing on the table')], lose: [moment('Gambler Lucky beat you for nothing')] }), LU.set('m1'))),
      ch('"No."', out('Lucky shrugs and goes back to his shuffling. The cards whisper in his hands as you leave.')),
    ],
  }),
  LU.meet(2, {
    title: 'In Debt',
    intro:
      'An alley behind the same bar. Lucky, ragged now, his loud jacket torn at the shoulder, is pinned against the wall by two big thugs. His Persian hisses from a bin lid. ' +
      'Thug: "He owes. A lot." Lucky is still smiling, somehow. Lucky: "I\'ll win it back. One more game."',
    choices: [
      ch('"Pay part of his debt."', out('You count out 1000. The thugs take it, look at each other, and leave. Lucky sinks down the wall and cannot look at you for a long time.', $(-1000), LU.set('m2'), LU.set('paid')), { requires: [money(1000)] }),
      ch('"Fight the thugs."', fight('The thugs crack their knuckles. Two battles, back to back, in a narrow alley. When it is over they leave, angry, promising this is not finished.',
        spar('Thugs', { cls: 'roughneck', size: 2, chain: 2, win: [moment('You drove off the thugs leaning on Lucky')], lose: [moment('The thugs beat you, but left Lucky alone')] }), LU.set('m2'), LU.set('defended'))),
      ch('"Let him gamble once more."', out('Lucky deals one more game against the thugs, his hands shaking. He loses. Badly. They take his Persian as payment, and he watches it go without a word.', LU.set('m2'), LU.set('lost-persian'))),
    ],
  }),
  LU.meet(3, {
    title: 'Quitting',
    intro:
      'A plain meeting room with stacked chairs and a coffee urn. Lucky sits by the window in a clean, quiet jacket, turning a coin over and over in his fingers. ' +
      'Lucky: "Ninety days. I keep this to remember. Never flip it."',
    // Meeting 2 always sets exactly one of paid / defended / lost-persian, so one variant always applies.
    // Base: 0 No bet, 1 Keep going, 2 Persian, 3 No bet with the payback.
    choices: [
      ...luckyM3([]),
      ch('"Get the Persian back."', out('Lucky stops turning the coin. Lucky: "You\'d do that?" He writes down where the thugs\' boss drinks, and you set out.', room(LU.roomId('persian-trail')))),
      luckyM3([$(PAYBACK)])[0]!,
    ],
    remembers: [
      variant('paid', [LU.is('paid')], {
        notice: `Before anything else, Lucky counts out ${PAYBACK} and puts it in your hand. Lucky: "Paid you back. With a little extra."`,
        hide: [0, 1, 2],
        add: [luckyM3([$(PAYBACK)])[1]!],
      }),
      variant('lost-persian', [LU.is('lost-persian')], { notice: 'There is no Persian at his feet. He keeps glancing at the empty space.', hide: [3] }),
      variant('defended', [LU.is('defended')], { hide: [2, 3] }),
    ],
  }),
  LU.room('persian-trail', {
    title: 'The Boss\'s Trail',
    intro: 'The first node of the trail: a bar where the thugs drink. One of them recognises you from the alley and goes pale. Somewhere upstairs, a Persian is yowling.',
    choices: [
      ch('"Take me to your boss."', out('The thug thinks about it, then jerks his head toward the stairs. You climb them, toward the yowling.', room(LU.roomId('persian-boss')))),
      ch('"Follow the yowling."', out('You slip past the bar and follow the sound up the back stairs, one creaking step at a time.', room(LU.roomId('persian-boss')))),
    ],
  }),
  LU.room('persian-boss', {
    title: 'The Boss',
    intro: 'Two nodes from the meeting room, a back office. A heavy man with rings on every finger sits behind a desk, Lucky\'s Persian on a velvet cushion beside him, very unhappy. He listens to you and laughs. Boss: "Battle me for it."',
    choices: [
      ch('"Battle."', fight('The boss fights dirty but not well. After the battle he waves a ringed hand: the Persian is not worth the trouble. It leaps into your arms, and Lucky, later, cries into its fur. He gives you an Amulet Coin.',
        spar('The Thugs\' Boss', { cls: 'roughneck', size: 3, lv: 1, win: [moment('You won Lucky\'s Persian back from the thugs\' boss')], lose: [moment('The thugs\' boss beat you, but gave up the Persian anyway')] }), LU.set('done'), amulet)),
    ],
  }),
];

// ---------- RR20. Gentleman Alfred (evening, night; Arcanine, Furfrou) ----------
const AL = rosterKit('alfred', 'npc-meet-gentleman-alfred', 'Gentleman Alfred');
const ALFRED = 'Gentleman Alfred';
const scarf = item('silk-scarf');
const FURFROU_LINE = 'The Furfrou you took is the only gift he says you need.';

const alfredM3 = (reward: Json[], line: string): Json[] => [
  ch('"Tea."', out(`Alfred pours, and you drink it by the window with the pond outside. By the second cup your whole party is rested and well. ${line}`, AL.set('done'), heal(1), ...reward)),
  ch('"Battle."', fight(`Alfred rolls up his shirtsleeves even further. Alfred: "Proper form, mind." His Arcanine pads out onto the lawn. ${line}`,
    spar(ALFRED, { team: ['arcanine'], size: 1, lv: 2, win: [moment('You beat Gentleman Alfred on the cottage lawn')], lose: [moment('Gentleman Alfred beat you on the cottage lawn')] }), AL.set('done'), ...reward)),
  ch('"Bring a guest."', out(`You bring a friend from the road whose own story has wrapped up. Alfred lays out an extra cup, and by the end of the pot they are old friends. ${line}`, AL.set('done'), AL.set('guest'), ...reward)),
];

const alfred: Json[] = [
  AL.meet(1, {
    title: 'Proper Form',
    intro:
      'A garden party on a lawn strung with lanterns. An old man in a bow tie stands by the roses, and beside him a Furfrou in an elegant trim sits perfectly straight. ' +
      'Alfred: "Proper form, proper manners. Bow before we begin." He waits, hands clasped behind his back, with the patience of someone who has waited for good manners all his life.',
    choices: [
      // Needs engine: "prize +20%" for this one battle (flag roster-alfred-bow-prize).
      ch('"Bow."', fight('You bow, and Alfred is utterly charmed. He bows back, deeper. Alfred: "Splendid." For a trainer with manners, he promises a prize a fifth larger than usual.',
        spar(ALFRED, { team: ['arcanine', 'furfrou'], size: 2, win: [AL.set('bow-prize'), moment('You bowed to Gentleman Alfred, then beat him')], lose: [moment('You bowed to Gentleman Alfred, then lost')] }), AL.set('m1'))),
      ch('"Battle."', fight('Alfred sighs very gently and steps onto the lawn. Arcanine and Furfrou take their places like dancers.',
        spar(ALFRED, { team: ['arcanine', 'furfrou'], size: 2, win: [moment('You beat Gentleman Alfred at a garden party')], lose: [moment('Gentleman Alfred beat you at a garden party')] }), AL.set('m1'))),
      ch('"Skip the bow."', fight('Alfred raises one white eyebrow. Alfred: "How modern." Then he nods to his Pokémon, and the battle begins.',
        spar(ALFRED, { team: ['arcanine', 'furfrou'], size: 2, win: [moment('You skipped the bow and beat Gentleman Alfred')], lose: [moment('You skipped the bow and Gentleman Alfred beat you')] }), AL.set('m1'))),
    ],
  }),
  AL.meet(2, {
    title: 'The Estate Sale',
    intro:
      'A great old house behind iron gates, with a hand-painted SALE sign hung on them. Alfred stands in the empty hall among dust sheets, the Furfrou and Arcanine at his side. ' +
      'Alfred: "I can\'t keep it. Forty rooms and nobody in them." He straightens his bow tie. Alfred: "I\'d like my Pokémon to go to someone who\'ll battle properly."',
    choices: [
      ch('"Take one."', out('Alfred trims the Furfrou himself, slowly, one last time, and ties a little ribbon at its collar. Then he puts its lead in your hand and does not let go for a moment. The Furfrou joins you, trimmed.', AL.set('m2'), AL.set('gave'), join({ species: ['furfrou'] }))),
      ch('"Stay with them."', out('Alfred looks at the Arcanine, and the Furfrou, and the long empty hall. Alfred: "I suppose I could." He keeps them, and he takes the SALE sign off the furniture at least.', AL.set('m2'), AL.set('kept'))),
      ch('"Help him find somewhere smaller."', out('Alfred brightens like a lamp. He fetches his hat and a list of places he has been too shy to look at.', AL.set('m2'), room(AL.roomId('house-hunt')))),
    ],
  }),
  AL.room('house-hunt', {
    title: 'House Hunting',
    intro: 'The first stop down the road: a flat above a bakery, a bungalow by a busy road. Alfred tuts at each one politely. The Arcanine sniffs every doorway and sneezes.',
    choices: [
      ch('"Somewhere with water."', out('Alfred nods. Alfred: "Yes. Somewhere with water." You walk on, toward a lane that dips down to a pond.', room(AL.roomId('cottage')))),
      ch('"Somewhere with room for visitors."', out('Alfred: "Fewer rooms, but more visitors. Yes." You walk on, and the lane dips down to a pond.', room(AL.roomId('cottage')))),
    ],
  }),
  AL.room('cottage', {
    title: 'The Cottage by the Pond',
    intro: 'Two nodes from the estate, a small stone cottage sits by a pond, roses round the door, a FOR SALE sign half-sunk in the grass. The Furfrou trots straight to the water and sits.',
    choices: [
      ch('"This one."', out('Alfred stands in the doorway for a long minute. Alfred: "This one." He buys it that afternoon, and the Arcanine falls asleep on the porch before the papers are signed.', AL.set('cottage'))),
      ch('"Look inside first."', out('Two rooms, a kitchen, a window over the pond. Alfred runs his hand along the mantel and smiles. He buys it that afternoon.', AL.set('cottage'))),
    ],
  }),
  AL.meet(3, {
    title: 'Cottage Tea',
    intro:
      'A small cottage with roses round the door. Alfred, in shirtsleeves and no bow tie at all, is pouring tea at a table by the window, three cups already set out. ' +
      'Alfred: "I find I like it. Fewer rooms. More visitors."',
    // Base: 0-2 with the Silk Scarf, 3 "Tea." without it (the Furfrou was the reward).
    choices: [...alfredM3([scarf], 'He gives you a Silk Scarf from his old wardrobe.'), alfredM3([], FURFROU_LINE)[0]!],
    remembers: [
      variant('gave', [AL.is('gave')], {
        notice: 'Alfred asks after the Furfrou before anything else, and smiles when he hears it battles properly.',
        hide: [0, 1, 2],
        add: alfredM3([], FURFROU_LINE).slice(1),
      }),
      variant('kept-furfrou', [AL.not('gave')], { hide: [3] }),
    ],
  }),
];

// ---------- RR21. Hiker Anthony (morning, afternoon; Graveler, Onix, Steelix) ----------
const AN = rosterKit('anthony', 'npc-meet-hiker-anthony', 'Hiker Anthony');
const ANTHONY = 'Hiker Anthony';
const metalCoat = item('metal-coat');

const anthony: Json[] = [
  AN.meet(1, {
    title: 'Stubborn',
    intro:
      'A mountain trail, high and windy. A big man with a bigger pack sits on a boulder, breaking a sandwich in half, and handing the other half up to an Onix that coils round the rock behind him. ' +
      'Anthony: "Mountains make for stubborn Pokémon." The Onix chews, slowly. Anthony: "Onix here\'s been with me thirty years. Stubborn as a rock. Is a rock."',
    choices: [
      ch('"Battle."', fight('Anthony stuffs the rest of his sandwich in his mouth and stands up. Graveler rolls down the slope, and the Onix uncoils, very slowly, very grumpy about lunch.',
        spar(ANTHONY, { team: ['graveler', 'onix'], size: 2, win: [moment('You beat Hiker Anthony on a mountain trail')], lose: [moment('Hiker Anthony beat you on a mountain trail')] }), AN.set('m1'))),
      ch('"Share lunch."', out('Anthony shifts over on the boulder and splits his sandwich three ways. You eat in the sun, the Onix rumbling, the wind on your face. By the time the crumbs are gone, your whole party is rested.', AN.set('m1'), AN.set('lunch'), heal(0.5))),
      ch('"Leave."', out('You nod and walk on up the trail. Behind you, Anthony goes on talking to the Onix about the weather.')),
    ],
  }),
  AN.meet(2, {
    title: 'The Rockslide',
    intro:
      'A trail buried under a fresh rockslide, dust still hanging in the air. Anthony is on his knees at the foot of it, shouting into the stones until his voice cracks. ' +
      'Anthony: "Onix dug in to hold the slope. It\'s under there."',
    choices: [
      { ...ch('"Dig."', out('Your Ground- or Fighting-type goes in after it, shifting stone after stone. It takes three long turns of digging, and on the third the rocks groan, and a great grey head pushes up into the light.', AN.set('m2'), AN.set('dug'))), pick: { types: ['ground', 'fighting'] } },
      ch('"Get help."', out('You run for the village down the mountain. Anthony stays with the rocks, still talking to his Onix through the gaps.', AN.set('m2'), room(AN.roomId('village-road')))),
      ch('"Call it out."', out('You kneel by the rocks and call the Onix, the way you did over lunch. The stones shift. The Onix knows your voice, and it heaves itself up and out toward it. Anthony sits down hard in the dust and laughs and laughs.', AN.set('m2'), AN.set('called')), { requires: [AN.is('lunch')] }),
    ],
  }),
  AN.room('village-road', {
    title: 'Down the Mountain',
    intro: 'The first node down the trail. The path is steep and loose after the slide, and the village roofs are still far below.',
    choices: [
      ch('"Run."', out('You half run, half slide down the switchbacks, scraped and breathless. The village is close now.', room(AN.roomId('village')))),
      ch('"Take the safe path."', out('You take the long, safe way round, as fast as you dare. The village is close now.', room(AN.roomId('village')))),
    ],
  }),
  AN.room('village', {
    title: 'Shovels',
    intro: 'Two nodes from the slide, the mountain village. The moment you say "Anthony\'s Onix", everybody drops what they are doing. Everybody knows Anthony.',
    choices: [
      ch('"Bring shovels."', out('Half the village climbs the mountain with shovels on their shoulders. They dig in shifts until the Onix\'s head breaks free, and Anthony hugs every single one of them.', AN.set('village'))),
      ch('"Bring everyone."', out('The whole village comes, with shovels, picks, a cart and a pot of soup. By dusk the Onix is free, and Anthony is crying into the soup.', AN.set('village'))),
    ],
  }),
  AN.meet(3, {
    title: 'Steelix',
    intro:
      'The mountain trail, morning sun. Anthony sits on his boulder, and the coil round it now shines like polished steel: a Steelix, gleaming. It still takes half his sandwich. ' +
      'Anthony: "Under there so long the pressure changed it. Still stubborn."',
    choices: [
      ch('"Battle."', fight('Anthony stands, brushing off crumbs. The Steelix rises over you like a building, and a Golem rolls down beside it. Afterwards he gives you a Metal Coat.',
        spar(ANTHONY, { team: ['steelix', 'golem'], size: 2, lv: 1, win: [moment('You beat Hiker Anthony and his shining Steelix')], lose: [moment('Hiker Anthony and his Steelix beat you')] }), AN.set('done'), metalCoat)),
      ch('"Climb with him."', out('Anthony shoulders his pack, and the Steelix carries you both up a shortcut only it knows, skipping a whole stretch of mountain. At the top he gives you a Metal Coat.', AN.set('done'), ferry(), metalCoat)),
      ch('"Ask for a story."', out('Anthony tells you about the mountain, and then, quieter, about a place he has never told anyone: where a rare Pokémon nests, high above the trail. He gives you a Metal Coat to remember it by.', AN.set('done'), AN.set('rare-nest'), metalCoat)),
    ],
  }),
];

export const EVENTS: Json[] = [...marcus, ...selene, ...tamsin, ...kin, ...dutch, ...baxter, ...elliot, ...lucky, ...alfred, ...anthony];
export const REMOVE: string[] = [];

/** Where each event is scripted (for docs/status/co-people.md and the `extra` list of the status file). */
export const DOC: Record<string, string> = {
  'npc-meet-cooltrainer-marcus': 'RR12 M1', 'npc-meet-cooltrainer-marcus-m2': 'RR12 M2', 'npc-meet-cooltrainer-marcus-m3': 'RR12 M3',
  'npc-meet-cooltrainer-marcus-learn': 'RR12 M2 (Learn)',
  'npc-meet-cooltrainer-selene': 'RR13 M1', 'npc-meet-cooltrainer-selene-m2': 'RR13 M2', 'npc-meet-cooltrainer-selene-m3': 'RR13 M3',
  'npc-meet-cooltrainer-selene-ditto-trail': 'RR13 M2 (Catch the Ditto)', 'npc-meet-cooltrainer-selene-ditto': 'RR13 M2 (Catch the Ditto)',
  'npc-meet-crush-girl-tamsin': 'RR14 M1', 'npc-meet-crush-girl-tamsin-m2': 'RR14 M2', 'npc-meet-crush-girl-tamsin-m3': 'RR14 M3',
  'npc-meet-crush-girl-tamsin-coach': 'RR14 M3 (Coach)',
  'npc-meet-crush-kin-ivan-and-mira': 'RR15 M1', 'npc-meet-crush-kin-ivan-and-mira-m2': 'RR15 M2', 'npc-meet-crush-kin-ivan-and-mira-ivan': 'RR15 M3 (Ivan)',
  'npc-meet-crush-kin-ivan-and-mira-m3': 'RR15 M3 (Mira)',
  'npc-meet-cue-ball-dutch': 'RR16 M1', 'npc-meet-cue-ball-dutch-m2': 'RR16 M2', 'npc-meet-cue-ball-dutch-m3': 'RR16 M3', 'npc-meet-cue-ball-dutch-paint': 'RR16 M3 (Paint)',
  'npc-meet-engineer-baxter': 'RR17 M1', 'npc-meet-engineer-baxter-m2': 'RR17 M2', 'npc-meet-engineer-baxter-m3': 'RR17 M3',
  'npc-meet-fisherman-elliot': 'RR18 M1', 'npc-meet-fisherman-elliot-patience': 'RR18 M1 (Sit)', 'npc-meet-fisherman-elliot-m2': 'RR18 M2', 'npc-meet-fisherman-elliot-m3': 'RR18 M3',
  'npc-meet-gambler-lucky': 'RR19 M1', 'npc-meet-gambler-lucky-m2': 'RR19 M2', 'npc-meet-gambler-lucky-m3': 'RR19 M3',
  'npc-meet-gambler-lucky-persian-trail': 'RR19 M3 (Persian)', 'npc-meet-gambler-lucky-persian-boss': 'RR19 M3 (Persian)',
  'npc-meet-gentleman-alfred': 'RR20 M1', 'npc-meet-gentleman-alfred-m2': 'RR20 M2', 'npc-meet-gentleman-alfred-m3': 'RR20 M3',
  'npc-meet-gentleman-alfred-house-hunt': 'RR20 M2 (Smaller)', 'npc-meet-gentleman-alfred-cottage': 'RR20 M2 (Smaller)',
  'npc-meet-hiker-anthony': 'RR21 M1', 'npc-meet-hiker-anthony-m2': 'RR21 M2', 'npc-meet-hiker-anthony-m3': 'RR21 M3',
  'npc-meet-hiker-anthony-village-road': 'RR21 M2 (Help)', 'npc-meet-hiker-anthony-village': 'RR21 M2 (Help)',
};

/** Flags nothing in this file reads: where the doc says they come back (merged into src/data/catalogOverhaul/flags/people.json). */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'roster-marcus-(learned|rematch|angry)', readBy: 'Marcus\'s Meeting 2 path; the doc names no later reader (All-Star Tournament / Final Reunion) (RR12)' },
  { match: 'roster-selene-(notes|accepted|ditto|planned)', readBy: 'Selene\'s Meeting 1 and 2 paths; the doc names no later reader (All-Star Tournament / Final Reunion) (RR13)' },
  { match: 'roster-selene-(boss-first-move|switch-speed)', readBy: 'Needs engine: see the first move of every boss this region / lead +1 Speed when switched in this region (RR13 M3)' },
  { match: 'roster-tamsin-rested', readBy: 'Tamsin\'s Meeting 2 path; the doc names no later reader (RR14)' },
  { match: 'roster-kin-(told|messenger)', readBy: 'The Crush Kin\'s Meeting 2 path; the doc names no later reader (RR15)' },
  { match: 'roster-dutch-paint', readBy: 'Final Reunion: the booth in the colour the player picked (RR16 M3)' },
  { match: 'roster-baxter-cables', readBy: 'A9 The Static Choir (QUESTLINES_ALPHAS_AND_ANOMALIES.md): following the cables leads there (RR17 M2)' },
  { match: 'roster-baxter-fixed', readBy: 'Baxter\'s Meeting 2 path; the doc names no later reader (RR17)' },
  { match: 'roster-baxter-team', readBy: 'Needs engine: an evil-team step is revealed (RR17 M2)' },
  { match: 'roster-elliot-(fished|landed|released)', readBy: 'Elliot\'s Meeting 1 and 2 paths; the doc names no later reader (RR18)' },
  { match: 'roster-lucky-(bet|defended)', readBy: 'Lucky\'s Meeting 1 and 2 paths; the doc names no later reader (RR19)' },
  { match: 'roster-alfred-bow-prize', readBy: 'Needs engine: prize +20% for the battle after the bow (RR20 M1)' },
  { match: 'roster-alfred-(kept|cottage)', readBy: 'Alfred\'s Meeting 2 path; the doc names no later reader (RR20)' },
  { match: 'roster-alfred-guest', readBy: 'Needs engine: a finished Roster trainer comes to tea and they become friends (RR20 M3; Roster crossovers)' },
  { match: 'roster-anthony-(dug|village|called)', readBy: 'Anthony\'s Meeting 2 path; the doc names no later reader (RR21)' },
  { match: 'roster-anthony-rare-nest', readBy: 'Needs engine: he tells the player where a Rare Pokémon nests (RR21 M3)' },
];
