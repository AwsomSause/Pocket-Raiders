// Catalog Overhaul Pack, people: PAST CHAMPIONS PC1 to PC10 (QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md lines 1-283; PC8 and PC10 from the
// rewrites in QUESTLINES_DEEPENED_1.md lines 263-350), Victory Hall (STORY_FAMILIES_8.md C4) and PA4 A Familiar Face
// (QUESTLINES_PAST_ALLIES_AND_FUTURE.md). Catalog ids: STORY_FAMILIES_8.md Part A. Pattern: people-roster-2.ts, people-mentors-2.ts.
// Build: npm run co:build -- people-champions-1
import { $, again, at, ch, companion, takeNode, egg, fight, flag, flagAgo, flagAt, flagIs, heal, inRegion, item, money, out, ptype, room, stat, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, is, moment, not, oldOf, scene, spar, variant } from './_people.ts';
import { M, mentorIs, R as RESSA, regionsLeft, shared } from './_mentors.ts';

export const CATEGORY = CAT;

/** A side scene of `parent` (`<parent>-<name>`), opened with `room(...)`, in the parent's group and backdrop. */
function side(parent: string, name: string, title: string, intro: string, choices: Json[], o: { remembers?: Json[]; cast?: string[]; requires?: Json[]; callback?: boolean; room?: boolean } = {}): Json {
  const old = oldOf(parent);
  const sc = (old.scene as Json | undefined) ?? {};
  return scene(`${parent}-${name}`, title, {
    group: (old.group as string | undefined) ?? 'Past Champions and Leaders', ...(old.stop ? { stop: (o.room ?? true) && old.stop === 'dungeon' ? 'event' : (old.stop as string) } : {}), rarity: 'uncommon', types: (old.types as string[] | undefined) ?? [],
    minStage: (old.minStage as number | undefined) ?? 1, requires: o.requires ?? [], room: o.room ?? true, ...(o.callback ? { callback: true } : {}),
    cast: o.cast ?? (sc.cast as string[] | undefined) ?? [], ...(sc.tint ? { tint: sc.tint as string } : {}), effect: (sc.effect as string | undefined) ?? 'none', ...(o.remembers ? { remembers: o.remembers } : {}),
  }, intro, choices);
}
const rivalMet: Json = { kind: 'rivalMet', atLeast: 1 };

// ---------- PC1. Red on the Mountain (Endgame: the last region) ----------
const RED = 'red-on-the-mountain';
const redFight = (text: string): Json =>
  fight(text, spar('Red', {
    boss: 'red', size: 6, lv: 2,
    win: [flag('red-beaten'), moment('You beat Red on the summit. He gave you his red cap.', 95)],
    lose: [again(RED), moment('Red beat you on the summit. The summit is always open.', 70)],
  }), flagAt('red-battled'), flagAt('red-met'));
const red: Json[] = [
  scene(RED, 'Red on the Mountain', { requires: [regionsLeft(0)] },
    'The summit of the highest mountain in the region. The snow comes sideways here, fine as flour, and the wind has a voice. Your team huddles close behind you, breath steaming. ' +
    'A trainer in a red cap stands at the very top with his back to you, looking out at nothing. His Pikachu turns first: ears up, cheeks crackling faintly in the cold, as if it heard you three switchbacks ago. ' +
    'Red does not speak. He turns. He looks at your team, one Pokémon at a time, slowly, the way someone reads a letter twice. Then he takes out one Poké Ball. ' +
    'Pikachu gives a small, bright cry, and somehow, the way you sometimes understand your own team, you know what it means. Pikachu: "He\'s been waiting a long time."',
    [
      ch('"Battle."', redFight('Red tips the cap down a fraction of an inch. That is the whole conversation. The ball opens, and the snow seems to stop falling for a second, the way a crowd goes quiet. This is the hardest fight anyone has offered you, and he is not going to hold anything back.')),
      ch('"Sit down."', out('You brush the snow off a flat rock and sit. After a long moment, so does he, an arm\'s length away, cap still low. Nothing happens for a long time. The wind drops. Pikachu climbs into his lap, then, after some thought, into yours. ' +
        'The sky goes from white to blue to the deep gold of late afternoon. Then Red stands, takes a Lemonade from his bag, puts it in your hand, and walks down the far side of the mountain without looking back.',
      item('lemonade'), flagAt('red-sat'), flagAt('red-met'), moment('You sat in the snow with Red, and neither of you said a word', 85))),
      ch('"Leave."', out('You turn and start back down. At the first switchback you look up. He is still there at the top, cap and coat dark against the snow, watching you go. He watches until the cloud closes over the path.')),
    ],
  ),
];
// Remembers (the first that holds applies): the starters touching tails.
red[0]!.remembers = [
  variant('pikachu', [{ kind: 'starter', species: 'pikachu' }], {
    notice: 'Your Pikachu has gone very still. Red\'s Pikachu is looking straight at it.',
    hide: [0],
    add: [ch('"Battle."', redFight('Before anyone sends anything out, the two Pikachu walk across the snow to each other. They touch tails, once, the way old friends shake hands, and go back to their trainers. Red watches it happen with something that is almost a smile. Then the ball opens.'))],
  }),
];

// ---------- PC2. The Champion Who Lost in an Afternoon (Blue) ----------
const BLUE = 'blue-taunt';
const blue: Json[] = [
  scene(BLUE, 'The Champion Who Lost in an Afternoon', {
    remembers: [
      variant('red-sat', [is('red-sat')], { notice: 'Before anything else, Blue asks how Red is, carefully, like the answer matters. When you tell him you sat with him in the snow, Blue goes quiet. He stays quiet for a while.' }),
      variant('red-met', [is('red-met')], { notice: 'Before anything else, Blue asks how Red is. He listens to the whole answer, then pretends he was not that interested.' }),
    ],
  },
  'A small Gym on a quiet street, the kind with a hand-painted sign and a vending machine that only takes exact change. Its Leader is Blue. Today he is being challenged by a kid of maybe nine with a Rattata and a cap on backwards, and the whole street has come in to watch. ' +
  'Blue loses. It is beautifully done. A command called half a second late. A Pokémon held back that should not have been. Nobody in the stands sees it; the kid is crying with joy, and Blue hands over the badge like it costs him something. Only you noticed. ' +
  'Afterwards, at the back door, he catches your eye. Blue: "Don\'t tell anyone." He leans on the door frame and watches the kid run down the street holding the badge up to the sun. ' +
  'Blue: "I was Champion for an afternoon. Then someone better walked in." Blue: "You know what that\'s like? Being the best for one afternoon?"',
  [
    ch('"No."', out('Blue: "Good. Don\'t find out." He pushes off the door frame and tosses a Poké Ball from hand to hand, and for a second the old grin is back. His real team, if you want it. Not the one the kid saw.', room(`${BLUE}-battle`))),
    // TODO(engine): "Only if the player has lost a Circuit final or a rival Lead +3 battle"; neither is a condition yet, so the nearest honest one is "your last rival meeting, the rival won".
    // TODO(new item): Blue's pin (held: +5% to the holder's stats in a rival battle). Owed as a flag until the item exists.
    ch('"Yes."', out('Blue looks at you for a long moment, and the grin goes away entirely. Blue: "Then you know." He unpins something from the inside of his jacket: a small, scratched Champion pin, the enamel worn through at one corner. He presses it into your palm and closes your fingers over it. For a rival battle, it holds.',
      flag('blue-owed-champion-pin'), moment('Blue gave you his old Champion pin', 80)), { requires: [{ kind: 'rivalLast', result: 'lose' }] }),
    ch('"Why did you lose to the kid?"', out('Blue watches the kid turn the corner, badge still held high. Blue: "Because someone did it for me once. And I needed it." He does not say who. He goes back inside before you can ask.')),
  ]),
  side(BLUE, 'battle', 'The Champion Who Lost in an Afternoon: His Real Team',
    'Blue walks you round to the empty practice field behind the Gym, where the grass is worn bare in two neat circles. He rolls his shoulders. The six Poké Balls at his belt are not the ones he used against the kid. These ones are scuffed from a League.',
    [
      ch('"Battle."', fight('Blue sends out his first Pokémon with a flick of the wrist, and nothing about it is held back this time. He is fast, and loud, and having the time of his life.',
        spar('Blue', { boss: 'blue', size: 6, lv: 2, win: [moment('You beat Blue\'s real team behind his Gym', 75)], lose: [moment('Blue\'s real team beat you behind his Gym', 60)] }))),
      ch('"Not today."', out('Blue shrugs and clips the ball back on. He does not look disappointed; he looks like a man who will be here tomorrow, and the day after. You leave him throwing a ball for his Pidgeot in the evening light.')),
    ]),
];

// ---------- PC3. Coffee with Cynthia ----------
const CY = 'face-champion-coffee';
const cynthiaFight = (): Json => spar('Cynthia', { boss: 'cynthia', size: 6, lv: 2, win: [moment('You beat Cynthia, for fun, over coffee', 80)], lose: [moment('Cynthia beat you, for fun, over coffee', 60)] });
const cyRuin = (text: string): Json => out(text, flagAt('cynthia-ruin'), flag('cynthia-inscription'), moment('You took Cynthia to the ruin she had looked for for six years, and she read its wall', 85));
const cynthia: Json[] = [
  scene(CY, 'Coffee with Cynthia', {},
    'A café terrace on the edge of town, the kind with mismatched chairs and a cat asleep on the awning. A woman in a long black coat sits at a corner table with two cups of coffee in front of her, both still steaming. She sees you looking and nudges the second cup an inch toward the empty chair. ' +
    'Cynthia: "The second is for whoever turns up." You sit. She studies you over the rim of her own cup. Cynthia: "I was told I\'d meet someone today. I don\'t believe in that sort of thing." ' +
    'She slides a photograph across the table, its corners soft with handling. Cynthia: "Do you recognise this ruin?" You do. It is a ruin you passed through on this very journey: the same broken arch, the same carved wall half swallowed by moss. ' +
    'Cynthia: "I\'ve been looking for it for six years."',
    [
      ch('"I\'ve been there."', out('Cynthia puts her cup down very carefully, as if it might break. She asks you to take her there. She asks it simply, without any of the weight she must be carrying, and stands before you have quite finished saying yes.', room(`${CY}-road`))),
      ch('"Why?"', out('Cynthia turns the photograph back toward herself and looks at it for a long while. Cynthia: "Because my grandmother died before she could read the last wall." She finishes her coffee. She does not explain any further, and you find you do not need her to.', flag('cynthia-told'))),
      ch('"Drink the coffee."', out('You drink the coffee. It is very good, and very strong. Cynthia laughs, really laughs, a surprised sound. Cynthia: "Honest." She sets a Poké Ball on the table between the cups. A battle, if you like. For fun.', room(`${CY}-battle`))),
    ]),
  side(CY, 'road', 'Coffee with Cynthia: The Road Back',
    'You lead Cynthia back along the road you came in on. She walks fast, coat snapping, and asks about every landmark: which way the river bent, whether the old bridge was still standing, what the wild Pokémon were like. She already knows most of the answers. She just wants to hear them from someone who was there.',
    [
      ch('"This way, by the river."', out('The river path is quicker and muddier. Cynthia does not seem to notice the mud. When the broken arch comes into view through the trees she stops dead, one hand over her mouth.', room(`${CY}-ruin`))),
      ch('"The long way, over the ridge."', out('The ridge is slower, but from the top you can see the whole valley, and the ruin in the middle of it like a dropped coin. Cynthia stands there a long time before she lets you lead her down.', room(`${CY}-ruin`))),
    ]),
  side(CY, 'ruin', 'Coffee with Cynthia: The Last Wall',
    'The ruin is just as you left it. Cynthia walks past the arch and the fallen pillars without a glance. She goes straight to the last wall, the carved one, kneels in the moss, and puts her bare hand flat against the stone. Then she starts to read, lips moving, one line at a time. When she reaches the end, she is silent.',
    [
      ch('"Wait with her."', cyRuin('You sit down on a fallen pillar and wait. The light moves across the wall. Cynthia does not speak for a very long time, and when she finally stands, her eyes are wet and she is smiling. She thanks you with a nod, and keeps whatever the wall said to herself. For now.')),
      ch('"Ask what it says."', cyRuin('Cynthia does not answer straight away. She traces the last line with one finger, twice. Then she shakes her head gently: not yet. She thanks you with a hand on your shoulder, and you leave her there with the wall and her grandmother\'s six years of looking.')),
    ]),
  // Remembers "If cynthia.ruin: in the last region, she sends a letter with what the wall said." Built as a follow-up scene in the run's last region.
  side(CY, 'letter', 'Coffee with Cynthia: A Letter',
    'A letter catches up with you at a Pokémon Center, the envelope creased from travelling and addressed in tall, careful handwriting. Inside is a photograph of the last wall, and one page. Cynthia writes that she has read it a hundred times now, and that her grandmother would have laughed at how simple it is. ' +
    'At the bottom she has copied the inscription, line by line: "What was taken from the sky is only borrowed. Give it back, and the sky will remember your name."',
    [ch('"Keep the letter."', out('You fold the letter back along its creases and put it somewhere safe. You think about the wall, and the moss, and a woman kneeling in it with her hand on the stone, for the rest of the day.', moment('Cynthia wrote to tell you what the last wall said', 80)))],
    { room: false, callback: true, requires: [is('cynthia-ruin'), regionsLeft(0)] }),
  side(CY, 'battle', 'Coffee with Cynthia: For Fun',
    'Cynthia moves the cups to the next table, apologising to the cat. The terrace is wide enough, just. She rolls the Poké Ball across her knuckles while she waits for you, and there is nothing casual at all about how she holds it.',
    [
      ch('"Battle."', fight('Cynthia sends out her first Pokémon with a smile, and the café\'s customers pick up their cups and move indoors without being asked. Her real team. For fun.', cynthiaFight())),
      ch('"Just the coffee."', out('Cynthia laughs again and pockets the ball. Cynthia: "Honest twice." She orders two more coffees, and you talk about nothing much until the sun goes down.')),
    ]),
];

// ---------- PC4. The Dragon Master's Last Flight (Lance). No old catalog id: a new scene. ----------
const LA = 'pc-dragon-master-last-flight';
const lanceRoom = (name: string, title: string, intro: string, choices: Json[]): Json =>
  scene(`${LA}-${name}`, `The Dragon Master's Last Flight: ${title}`, { group: 'Past Champions and Leaders', rarity: 'uncommon', minStage: 3, room: true, cast: [], pokemon: 'dragonite', tint: '#2a3448', effect: 'none' }, intro, choices);
const lanceOpen: Json[] = [
  // TODO(engine): "the Flying-type must not faint": the flight ends if the picked Flying-type faints. No effect can hurt or check the picked Pokémon yet.
  ch('"My Flying-type can try."', out('Lance looks at your Flying-type for a long time, the way a trainer looks at a stranger\'s Pokémon he is about to trust with everything. Then he nods. Between you, you rig a sling from his cape, and the old Dragonite lets herself be lifted into it with a sigh like wind in a chimney.', room(`${LA}-flight-1`)),
    { requires: [ptype('flying')], pick: { types: ['flying'] } }),
  ch('"Let\'s walk her to the sea."', out('Lance stands and brushes the grass off his knees. The Dragonite gets up too, slowly, joint by joint, and the three of you start downhill at her pace, which is very slow indeed.', room(`${LA}-walk-1`))),
];
const flightStep = (n: number, prompt: string, intro: string, okText: string, failText: string, next: string): Json =>
  lanceRoom(`flight-${n}`, `The Flight (${n} of 3)`, intro, [
    ch('"Hold steady."', out(okText, room(next)), { prompt: { id: prompt, needs: 'ok' }, fail: out(failText, room(next)) }),
  ]);
const walkStep = (n: number, intro: string, tell: string, quiet: string, next: string): Json =>
  lanceRoom(`walk-${n}`, `The Walk (${n} of 4)`, intro, [
    ch('"Tell me about this place."', out(tell, room(next))),
    ch('"Walk on quietly."', out(quiet, room(next))),
  ]);
const lance: Json[] = [
  scene(LA, 'The Dragon Master\'s Last Flight', { group: 'Past Champions and Leaders', rarity: 'rare', minStage: 3, cast: [], pokemon: 'dragonite', tint: '#2a3448', effect: 'none' },
    'A cliff in the high hills, the sea only a grey line far off on the horizon. Lance sits in the grass with his cape folded under him. Beside him lies his Dragonite, chin on her forelegs. She is old. The orange of her scales has faded to the colour of weak tea, and she is grey around the eyes. ' +
    'Lance: "She carried me through three wars and two Leagues. She can\'t fly any more." He rests a hand on her neck, and she leans into it. ' +
    'Lance: "She wants to see the sea from the air one more time. I can\'t carry her."',
    [
      ...lanceOpen,
      ch('"Why are you telling me?"', out('Lance almost laughs. Lance: "Because everyone else I\'d ask would ask me for a battle first." The Dragonite opens one eye at you, as if to say she has heard that too.', room(`${LA}-ask`))),
    ]),
  lanceRoom('ask', 'Still Asking',
    'Lance waits. He does not ask twice; he has never had to. The Dragonite looks out toward the grey line of the sea, and her wings twitch, once, the way a sleeping Pokémon\'s legs twitch when it dreams of running.',
    lanceOpen),
  flightStep(1, 'tilt-drag',
    'Your Flying-type beats hard for the sky with the sling beneath it. Lance runs alongside until the ground drops away, then stands at the cliff edge with his cape snapping. The first gust off the hills hits you broadside.',
    'Your Flying-type tilts into the gust and rides it up, steady as a kite on a string. In the sling, the Dragonite opens her wings a little, just to feel the air under them.',
    'The gust slams into you and the sling swings wide. For a horrible second you are falling, and then your Flying-type finds the air again, wings shaking. The Dragonite does not make a sound. She trusts you.',
    `${LA}-flight-2`),
  flightStep(2, 'balloon-drag',
    'Halfway. Cloud closes in, cold and grey and wet, and you cannot see the ground or the sky. Somewhere below, very faint, Lance is calling directions. Your Flying-type is tiring.',
    'You steer by Lance\'s voice, and then by the smell of salt, and break out of the cloud into sunlight with the sea spread out ahead like hammered silver.',
    'You lose Lance\'s voice in the cloud and drift, and drop, and your Flying-type has to labour back up with the sling dragging at it. When you break into the light you are far off course, but the sea is there.',
    `${LA}-flight-3`),
  flightStep(3, 'brace-hold',
    'The last stretch, over the cliffs. The updraft here is fierce, and your Flying-type\'s wings are trembling. In the sling the old Dragonite has gone very still, watching the water come closer.',
    'Your Flying-type braces against the updraft and holds, and holds, and then glides down in one long slow curve over the waves while the Dragonite looks at everything.',
    'The updraft nearly tears you apart. Your Flying-type holds on through sheer stubbornness, and you come down hard on the shingle, everyone shaken, everyone whole. The Dragonite has seen the sea from the air. That is what mattered.',
    `${LA}-sea`),
  walkStep(1,
    'The first village. A well in the square, and children who stop playing to stare at the old Dragonite as she passes, slow and enormous and gentle.',
    'Lance: "She landed here once in a storm, with me half-frozen on her back. The baker took us in." The baker\'s window is still there. Lance buys two buns and gives one to the Dragonite.',
    'You walk on in silence. The Dragonite stops at the well to drink, and the children creep close enough to touch her tail. She lets them.',
    `${LA}-walk-2`),
  walkStep(2,
    'An old battlefield, grown over with wildflowers. There is nothing to show what happened here except a stone with no writing on it.',
    'Lance stops at the stone. Lance: "One of the three wars. She stood in front of me here for an hour." He does not say anything else, and the Dragonite rests her head on his shoulder.',
    'You do not ask. Lance stops at the stone for a moment anyway, and the Dragonite rests her head on his shoulder, and then you go on.',
    `${LA}-walk-3`),
  walkStep(3,
    'A League stadium on the edge of a town, empty today, its banners rolled up. The Dragonite\'s pace slows even further as you pass the gates.',
    'Lance: "My first League. She was a Dratini in a jar of water at the back of my bag." He smiles. "I won with her the second time. Not the first."',
    'The Dragonite stops at the gates and looks in through the bars for a long while. Lance waits with her. Neither of them seems to need you to say anything.',
    `${LA}-walk-4`),
  walkStep(4,
    'The last hill. You can smell the sea now, and hear it. The Dragonite is breathing hard, and Lance walks with one hand on her side the whole way up.',
    'Lance: "This is where she learned to fly. Fell off this hill four times." The Dragonite huffs, as if she remembers it differently.',
    'You walk the last hill together without a word, three sets of footsteps and the sound of the waves getting louder.',
    `${LA}-sea`),
  lanceRoom('sea', 'At the Sea',
    'The sea, at last: wide and grey-green and restless, gulls hanging over it. The Dragonite settles on the shingle at the water\'s edge and looks at the water for a long time. The wind lifts the faded edges of her wings. Lance stands beside her and does not move. ' +
    'At last he turns to you, and his voice is very quiet. Lance: "Thank you."',
    // TODO(engine): the Dratini egg should hatch knowing Extreme Speed; an egg with a set move is not an effect yet (flag owed).
    [ch('"Thank her for me."', out('Lance kneels and says something to the Dragonite that you do not hear. She noses at the satchel by his feet, and Lance takes out an egg, pale blue and warm. He puts it in your arms. From her last clutch. The Dratini inside will hatch already knowing the fastest move she ever taught him.',
      egg({ species: ['dratini'] }), flag('lance-egg-extreme-speed'), moment('You took Lance\'s old Dragonite to see the sea one last time. He gave you a Dratini egg from her last clutch.', 90)))]),
];

// ---------- PC5. The Champion Who Left (Sable Oakridge, also the mentor in STORY_FAMILIES_5.md B9) ----------
const SA = 'retired-champion-spar';
const sableTeam = ['garchomp', 'dragonite', 'milotic', 'lucario', 'aegislash', 'gardevoir']; // her Final Lesson team (SF5 B9), so the two scenes agree
const toLesson = (text: string, ...fx: Json[]): Json => out(text, ...fx, room(`${SA}-lesson`));
const lessonPick = (label: string, which: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', text: string): Json =>
  ch(label, out(text, stat(which, { who: 'picked' }), moment('Sable Oakridge taught one of your team something nobody teaches', 70)), { pick: {} });
const sable: Json[] = [
  scene(SA, 'The Champion Who Left', {},
    'A paddock fence at the edge of town, grey wood, a field of long grass behind it. A woman in a worn coat leans on the top rail with her elbows, watching nothing in particular. Her boots are good boots that have walked a long way. She hears you on the path and does not turn round. ' +
    'Sable: "I used to hold a title." She says it the way someone mentions a town they used to live in. Sable: "I left because I stopped enjoying it. I was afraid that meant I\'d stopped being good." ' +
    'Now she turns. Her eyes are calm, and very sharp. Sable: "Spar with me. If you can stand your ground, I\'ll tell you something nobody tells you."',
    [
      ch('"Spar."', fight('Sable steps away from the fence and lets six Poké Balls drop from her sleeve into her hand. She moves slowly, deliberately, like she has all the time in the world. It is a Champion\'s team, and she plays it like one.',
        spar('Sable Oakridge', { team: sableTeam, size: 6, lv: 2, win: [moment('You stood your ground against Sable Oakridge, and won', 80), flag('lore-champions-chair'), room(`${SA}-after`)], lose: [moment('Sable Oakridge beat you, and said you stood your ground anyway', 65), room(`${SA}-after`)] }))),
      ch('"What did nobody tell you?"', out('Sable looks back at the long grass for a while. Sable: "That you\'re allowed to stop." She says it gently, like she is handing you something breakable. Then she goes back to watching the field.')),
      ch('"Do you miss it?"', out('Sable: "Every day." A long pause. A Pidgey lands on the fence, looks at the two of you, and leaves. Sable: "Not the winning."')),
    ]),
  side(SA, 'after', 'The Champion Who Left: A Chair',
    'Afterwards, win or lose, Sable sits down on the bottom rail of the fence and lets her team graze in the long grass. She is breathing a little hard, and she looks pleased about it. ' +
    'Sable: "The Champion\'s chair isn\'t the top of anything. It\'s a chair." She tips her head at you. The question is in her face before she asks it: she wants to know what you think she should do.',
    [
      ch('"Come back."', toLesson('Sable laughs, short and surprised. She says she will think about it, and from the way she looks at her team, she already is.')),
      ch('"Stay retired."', toLesson('Sable lets out a long breath and nods, slowly, like you have given her permission for something. She says the field suits her better than the chair ever did.')),
    ],
    {
      remembers: [
        // "If 'Come back.' and Trust with her is high (she is the player's mentor)": she enters the League in the last region as an Elite Four substitute (flag `sable-league`, the same as SF5 B9).
        variant('mentor', [{ kind: 'mentor', id: 'sable-oakridge', trustAtLeast: 45 }], {
          notice: 'Sable is your mentor. She has never asked you anything she did not already know the answer to, until now.',
          hide: [0],
          add: [ch('"Come back."', toLesson('Sable stares at you, and then she is grinning, properly delighted, like a kid. Sable: "...All right." She will be in the League in the last region, standing in for one of the Elite Four. She says she will pick a team built to beat yours, and she cannot wait.',
            flagAt('sable-league'), moment('You told Sable Oakridge to come back, and she said yes', 80)))],
        }),
      ],
    }),
  side(SA, 'lesson', 'The Champion Who Left: Her Lesson',
    'Sable whistles her team back and stands. Sable: "I promised you something nobody tells you." She looks over your team one Pokémon at a time, the way a teacher reads a class. She will teach one of them, one thing, properly. Which one, and what, is up to you.',
    [
      lessonPick('"Attack."', 'atk', 'Sable spends an hour on one thing: hitting at the right moment instead of the first one. By the end, your Pokémon strikes like it means it.'),
      lessonPick('"Defence."', 'def', 'Sable throws everything she has at your Pokémon, gently at first, then not gently at all, until it stops flinching and starts standing.'),
      lessonPick('"Speed."', 'spe', 'Sable makes your Pokémon wait, and wait, and then go. By sunset it is moving before her hand has finished falling.'),
      ch('"Another stat."', out('Sable raises an eyebrow and waits for you to say which.', room(`${SA}-lesson-more`))),
    ]),
  side(SA, 'lesson-more', 'The Champion Who Left: Something Else',
    'Sable: "Something else, then." She folds her arms and waits, patient as the fence.',
    [
      lessonPick('"Special Attack."', 'spa', 'Sable teaches your Pokémon to breathe once, slowly, before it lets go of a move. It hits harder for the waiting.'),
      lessonPick('"Special Defence."', 'spd', 'Sable teaches your Pokémon to let a blow pass through it instead of fighting it. By the end it shrugs off what used to stagger it.'),
      lessonPick('"HP."', 'hp', 'Sable has your Pokémon run the paddock until it can run it again, and again. Sable: "Staying in is half of it."'),
    ]),
];

// ---------- PC6. The Hall of Past Champions, and C4 Victory Hall ----------
const HALL = 'mr-hall-champions';
const GHOST_NAME = 'Wren Calloway'; // TODO(engine): PC10's name is "drawn from a short list, the same for the whole save"; one fixed name until text can draw it.
const wing = (n: number): string => `${HALL}-wing-${n}`;
const statue = (key: string, who: string, boss: string, w: number, text: string): Json =>
  ch(`"${who}\'s statue."`, fight(text, spar(who, {
    boss, size: 6, lv: 2,
    win: [flag(`hall-beat-${key}`), flag('hall-statues'), moment(`You beat ${who}'s statue in the Hall of Past Champions and took a Champion's ribbon`, 70), room(wing(w))],
    lose: [room(wing(w))],
  })), { requires: [not(`hall-beat-${key}`)] });
const hallFight = (text: string, ...fx: Json[]): Json => out(text, ...fx, room(wing(1)));
const hall: Json[] = [
  scene(HALL, 'The Hall of Past Champions', {
    remembers: [
      variant('plate', [is('ghost-plate')], { notice: `At the far end, the empty plinth is not quite empty any more. A new brass plate is fixed to its front, still bright: ${GHOST_NAME.toUpperCase()}. Someone has left a sprig of wildflowers beside it.` }),
      variant('glass-plaque', [is('glass-plaque')], { notice: 'By the door hangs a small plaque of clear glass, new since anyone last dusted in here. You remember promising someone it would be.' }),
    ],
  },
  'A long hall of statues, dim and cool, smelling of stone dust and floor polish. Each statue is a past Champion, life-size, carved mid-command with one arm flung out. Their teams stand on the plinths around them, carved just as carefully. ' +
  'A caretaker with a feather duster and a cough like a drawer opening shuffles out from behind a pillar. Caretaker: "They tend to move. For a donation." He coughs. Caretaker: "The statues are the Champions. The plinths are the teams. You can fight any one of them. They remember winning." ' +
  'He points the duster down the hall, toward the far end, where the light is thin. Caretaker: "There\'s one plinth at the end with no statue."',
  [
    ch('"Fight a Champion."', hallFight('You drop ₽600 in the caretaker\'s tin. He listens to it land, nods, and leads you to the first wing. Behind you, stone grinds on stone.', $(-600)), { requires: [money(600)] }),
    // Cross-run (not built): "If the player has won a run on this save, their past winning team is on it, and steps down to fight".
    ch('"Ask about the empty plinth."', out('You walk to the end of the hall with the caretaker. The last plinth is bare, swept clean, waiting. Caretaker: "For whoever comes next." He dusts it anyway, carefully, all the way round, like it matters.')),
    ch('"Donate."', out('You drop ₽600 in the tin. The caretaker brightens and unhooks an iron key from his belt. Behind the last pillar there is a door you had not noticed, and behind the door a long stone corridor: Victory Hall, where challengers have trained for years.', $(-600), room('dungeon-victory-hall')), { requires: [money(600)] }),
  ]),
  side(HALL, 'wing-1', 'The Hall of Past Champions: The First Wing',
    'The first wing. Three statues stand in a row, and all three have turned their heads to watch you come in. The caretaker coughs politely and stands well back.',
    [
      statue('blue', 'Blue', 'blue', 1, 'The statue of Blue grins, which statues should not do, and steps down off his plinth with a sound like a landslide. His team, as it was the afternoon he won, shakes the dust off.'),
      statue('lance', 'Lance', 'lance', 1, 'The statue of Lance sweeps its stone cape aside. Its dragons uncoil from the plinth around it, cracking the varnish, exactly as they were the year he won.'),
      statue('steven', 'Steven', 'steven', 1, 'The statue of Steven adjusts a cufflink, very precisely, and steps down. The team behind him gleams like it has just been polished, because it has.'),
      ch('"The next wing."', out('You walk on. The statues turn their heads to watch you go.', room(wing(2)))),
    ]),
  side(HALL, 'wing-2', 'The Hall of Past Champions: The Second Wing',
    'The second wing, where the floor tiles change colour and the statues stand further apart. One of them is reading a stone book. It closes it as you come in.',
    [
      statue('cynthia', 'Cynthia', 'cynthia', 2, 'The statue of Cynthia closes the stone book and sets it down on the plinth. Her team, the team she won with, rises around her in a long dark coat of shadow.'),
      statue('alder', 'Alder', 'alder', 2, 'The statue of Alder laughs, a deep grinding rumble, and stretches like it has been asleep for years. Its team stretches too.'),
      statue('diantha', 'Diantha', 'diantha', 2, 'The statue of Diantha turns toward you as if into a spotlight, and steps down with perfect grace. Her team follows in a line.'),
      ch('"The next wing."', out('You walk on into the third wing. The caretaker follows, wheezing.', room(wing(3)))),
    ]),
  side(HALL, 'wing-3', 'The Hall of Past Champions: The Third Wing',
    'The third wing, the newest, the stone still pale. These statues look almost alive already, as if the sculptor only finished them yesterday.',
    [
      statue('kukui', 'Kukui', 'kukui', 3, 'The statue of Kukui pushes its stone glasses up its nose, and its team piles off the plinth with a whoop that echoes down the whole hall.'),
      statue('leon', 'Leon', 'leon', 3, 'The statue of Leon throws back its stone cape and strikes a pose that the sculptor clearly asked him to hold for hours. His team, the one that never lost, steps down.'),
      statue('geeta', 'Geeta', 'geeta', 3, 'The statue of Geeta folds its hands and regards you, unhurried. Its team assembles on the floor in front of it in perfect formation.'),
      ch('"Back to the first wing."', out('You walk back the way you came, past statues that turn to watch.', room(wing(1)))),
    ]),
  // "All canon statues beaten: the caretaker's key to the Archive (Past Allies)". The caretaker finds you on a later stage.
  side(HALL, 'key', 'The Hall of Past Champions: The Caretaker\'s Key',
    'The caretaker from the Hall of Past Champions has walked a long way to find you; there is dust on his shoes from three roads. He coughs. He holds out a small, heavy, old key on a loop of string. He says every statue in the Hall has stepped down for you, and that has not happened in his time. The key opens the Archive.',
    [ch('"Take the key."', out('You take the key. It is warmer than metal should be. The caretaker nods, coughs, and shuffles off back the way he came, already looking forward to dusting.', flag('hall-archive-key'), moment('You beat every Champion\'s statue in the Hall. The caretaker gave you the key to the Archive.', 90)))],
    { room: false, callback: true, requires: [flagIs('hall-statues', 9)] }),
];

// C4. Victory Hall (`dungeon-victory-hall`): the gauntlet the Hall's "Donate." opens. Three proving rooms.
const VH = 'dungeon-victory-hall';
const vhPrize = (text: string): Json => out(text, flag('victory-hall-name'), moment('Your name is cut into the wall of Victory Hall, and you took a Champion\'s ribbon', 85));
const vhChamp = (who: string, boss: string): Json =>
  ch(`"${who}."`, fight(`The keeper says the name aloud, and a statue at the far end of the room turns to face you: ${who}, with the team they won with.`,
    spar(who, { boss, size: 6, lv: 2, win: [flag('victory-hall-name'), moment('Your name is cut into the wall of Victory Hall, and you took a Champion\'s ribbon', 85)], lose: [moment(`${who}'s statue beat you in Victory Hall's last room`, 60)] })));
const victoryHall: Json[] = [
  scene(VH, 'Victory Hall', { room: true, stop: 'event' }, // a room now (PC6 "Donate." opens it), so never drawn as a Landmark Dungeon
    'A long stone hall where challengers have trained for years. The flagstones are worn into shallow dips where people have stood and planted their feet. At the far end, three doors. ' +
    'An old hall keeper sits on a stool by the first one with a lantern. Hall keeper: "Three rooms. Each harder. The prize is a name on the wall." ' +
    'The first room is Patience. In the middle of it stands a statue Champion, perfectly still. It only moves when your Pokémon stands still.',
    [
      // TODO(engine): "a battle that rewards status moves": the statue acts only when your Pokémon uses a status move. No battle rule does that yet; a plain battle.
      ch('"Wait for it."', fight('You tell your lead to wait. It stands still. The statue moves.', spar('Statue Champion', { types: ['rock'], size: 3, win: [room(`${VH}-courage`)], lose: [moment('Victory Hall\'s room of Patience beat you', 50)] }))),
      ch('"Attack first."', fight('You strike before it moves, and the whole statue wakes up angry. This is the harder way.', spar('Statue Champion', { types: ['rock'], size: 3, lv: 2, win: [room(`${VH}-courage`)], lose: [moment('Victory Hall\'s room of Patience beat you', 50)] }))),
    ]),
  side(VH, 'courage', 'Victory Hall: Courage',
    'The second room is Courage. A Champion\'s ace waits in the middle of it, alone, at full strength: a Garchomp, scarred and calm, its fins flat. The keeper holds up one finger. Hall keeper: "One Pokémon. Yours. No switching."',
    [
      ch('"Send the lead."', fight('Your lead walks out to meet it. Nobody else is coming.', spar('Champion\'s Ace', { team: ['garchomp'], size: 1, lv: 1, rule: { noSwitch: true, suddenDeath: true }, win: [room(`${VH}-memory`)], lose: [moment('A Champion\'s ace beat your lead in Victory Hall', 50)] }))),
      // TODO(engine): the picked Pokémon should be the one that fights; a fight cannot start with the picked Pokémon in front yet.
      ch('"Send the weakest."', fight('You choose the one nobody would choose. The keeper raises an eyebrow, and then nods slowly, like he has seen this before and liked it.',
        spar('Champion\'s Ace', { team: ['garchomp'], size: 1, lv: 1, rule: { noSwitch: true, suddenDeath: true }, win: [bond(3, 'picked'), moment('Your weakest Pokémon beat a Champion\'s ace alone in Victory Hall', 80), room(`${VH}-memory`)], lose: [moment('Your weakest Pokémon stood against a Champion\'s ace in Victory Hall', 60)] })),
        { pick: {} }),
    ]),
  // Cross-run (not built): the statue of the player's own past winning team.
  side(VH, 'memory', 'Victory Hall: Memory',
    'The third room is Memory. It is round, and lit from above, and holds a single empty plinth. The keeper says it holds a Champion of your choice, whoever you would most like to have beaten. Something on the plinth is already taking shape out of the dust.',
    [
      ch('"Battle."', out('The keeper asks who it should be.', room(`${VH}-memory-pick`))),
      ch('"Bow to it."', vhPrize('You bow. The shape on the plinth bows back, and the room is passed. The keeper takes a chisel from his pocket and, without a word, cuts your name into the wall at the end of the hall, under all the others. Then he pins a Champion\'s ribbon on you.')),
    ]),
  side(VH, 'memory-pick', 'Victory Hall: Whose Statue',
    'The dust on the plinth waits for a name.',
    [vhChamp('Lance', 'lance'), vhChamp('Cynthia', 'cynthia'), vhChamp('Leon', 'leon')]),
];

// ---------- PC7. The Garage Sale ----------
const GA = 'retired-champ-garage';
const garage: Json[] = [
  scene(GA, 'The Garage Sale', {
    remembers: [
      variant('ace', [{ kind: 'partySpecies', species: 'arcanine' }], {
        notice: 'The old Champion\'s Arcanine has lifted its head off the driveway and is looking at your Arcanine. The old Champion looks too, for a long time.',
        hide: [1],
        add: [ch('"The band."', out('The old Champion picks up the Focus Band and turns it over, then walks round the table and ties it, very gently, onto your Arcanine. She will not take your money for it, she says: it was her ace\'s, and it should go to one like it. Her own Arcanine thumps its tail on the concrete.', item('focus-band')))],
      }),
    ],
  },
  'A driveway in the suburbs, with a trestle table and a hand-lettered sign. On the table: trophies, dozens of them, tarnished and dented, and three things laid out on a folded towel. An old Champion sits behind it in a deckchair. Her Arcanine sleeps across the end of the driveway like a draught excluder. ' +
  'Old Champion: "Three signature items for sale. I won\'t need them where I\'m going." She waves at the moving van parked in the road. Old Champion: "I\'m moving to the coast. My Pokémon want to see the sea." ' +
  'She touches each of the three things on the towel in turn. Old Champion: "Each of these won me something. They\'re not magic. They were just there." The prices are written on little paper tags, and they are honest ones.',
  [
    ch('"The scarf." (₽700)', out('A Choice Scarf from her first League, the colour faded on one side where the sun caught it on a hundred journeys. She folds it carefully, counts your money once, and tells you it was the first thing she ever bought with prize money.', $(-700), item('choice-scarf')), { requires: [money(700)] }),
    ch('"The band." (₽700)', out('A Focus Band, frayed at one end. She holds it a moment before she hands it over. It saved her ace once, she says, in a final, when everything else had gone wrong. Then she takes your money and tucks it in her apron.', $(-700), item('focus-band')), { requires: [money(700)] }),
    ch('"The photo."', out('You ask about the photo instead: a team of six, young and scruffy, squinting into the sun. The old Champion lights up like you have given her a present.', room(`${GA}-team`))),
  ]),
  side(GA, 'team', 'The Garage Sale: Her First Team',
    'She pulls up a second deckchair for you and tells you about every one of them. The Growlithe who grew into the Arcanine asleep on the drive. The Pidgey who was afraid of heights for a whole year. The Poliwag who ate a shoe. The Oddish who only fought at night, and the two who did not make it to the end of the road with her, whose names she says slowly, the way you say things to keep them. ' +
    'When she is finished she signs the photo across the bottom and holds it out. There is no price tag on it. You asked about them first.',
    [
      // TODO(engine): the photo's effect ("once per run, a Pokémon that shares a species with someone in it gains +1 Bond"). Not a Keepsake (Kice: no Keepsakes); recorded as a flag.
      ch('"Take the photo."', out('You take the photo. Her signature is big and loopy and a little shaky. She tells you to look after it, and then goes back to pricing trophies, humming.', flag('garage-photo'), moment('A retired Champion gave you a signed photo of her first team', 70))),
      ch('"It should go with you."', out('She looks at the photo, and then at you, and then she laughs and puts it in her apron pocket, over her heart. She tells you it was the right answer, and that she was not going to let it go anyway.')),
    ]),
];

// ---------- PC8. The Champion in Disguise (QUESTLINES_DEEPENED_1.md rewrite; three stages) ----------
const DI = 'ovc-champion-in-disguise';
const traveller = (lv: number, win: Json[], lose: Json[]): Json => spar('Traveller', { size: 3, lv, win, lose });
const s2Again = (): Json => ch('"Again."', fight('The traveller\'s face lights up. They do not even pretend to think about it.', traveller(1, [moment('You beat the traveller in a plain coat, again', 55)], [moment('The traveller in a plain coat won again, and apologised again', 50)])));
const s2Who = (): Json => ch('"Who are you?"', out('Traveller: "Somebody on a walk." They pull the cap a little lower and smile at the ground.'));
const s3Choices = (champ: string, boss: string): Json[] => [
  ch('"Battle me as yourself."', fight(`${champ} does not say anything at all. There is no performance, no narration, none of the mittens. They send out their real team, and they are entirely there.`,
    spar(champ, { boss, size: 6, lv: 2, win: [moment(`You beat ${champ}, battling as themselves`, 90)], lose: [moment(`${champ} beat you, battling as themselves`, 70)] }), ...disguiseReward(champ))),
  ch('"Keep the cap on."', fight('The cap goes back on, and they laugh, and they keep laughing the whole way through. It is another casual battle, and it is the best either of you plays.',
    traveller(1, [moment('You beat the traveller in the cap, laughing', 75)], [moment('The traveller in the cap beat you, laughing', 60)]), ...disguiseReward(champ))),
  ch('"Why me?"', out(`${champ}: "You didn't ask for an autograph." They put the cap on your head instead, and it is too big, and they will not take it back.`, ...disguiseReward(champ))),
];
function disguiseReward(champ: string): Json[] {
  return [flag('disguise-done'), moment(`The traveller in the plain coat was ${champ}. They gave you their cap.`, 85)];
}
const s3Intro = (champ: string, how: string): string =>
  'The same road. They are waiting for you on the verge in the plain coat, and this time they do not pretend to be surprised. The cap comes off. ' +
  `It is a Champion you know by face: ${champ}. ${how} ` +
  `${champ}: "I wanted to battle someone who didn't know who I was. It's been eleven years." They turn the cap over in their hands. ` +
  `${champ}: "People lose to the name. They've lost before I've sent anything out." A small, crooked smile. ${champ}: "You didn't. You just thought I was a bit useless."`;
const disguise: Json[] = [
  scene(`${DI}-s1`, 'The Champion in Disguise', { requires: [not('disguise-met')] },
    'A casual traveller steps out onto the road ahead and waves you down. Their cap is pulled low and their coat is too plain, plain the way a costume is plain. ' +
    'Traveller: "Friendly one? I\'m rusty. Terribly rusty."',
    [ch('"Battle."', fight('Their Pokémon are superb. Their coats shine, their stances are perfect, and the traveller uses them like somebody playing a piano with mittens on. A switch at the worst possible moment. A status move straight into an immunity. Twice their lead looks back at them, puzzled. They lose, badly, and you are almost sure they meant to.',
      traveller(-1, [room(`${DI}-s1-after`)], [room(`${DI}-s1-after`)])))]),
  side(`${DI}-s1`, 'after', 'The Champion in Disguise: Good Battle',
    'The traveller calls back their Pokémon, which go with obvious relief, and shakes your hand warmly. Traveller: "Good battle. You\'ll go far. I\'d know."',
    [
      ch('"You threw that."', out('Traveller: "Did I? How embarrassing for both of us." They are smiling under the cap. They tip it to you and walk on down the road, whistling, coat flapping.', flagAt('disguise-met'))),
      ch('"Good battle."', out('The traveller beams like you have handed them a medal, and shakes your hand again for good measure. Then they wander off down the road, hands in pockets, whistling something you almost recognise.', flagAt('disguise-met'))),
      ch('"Your Pokémon are better than that."', out('The traveller stops. For just a second, something very sharp looks out from under the cap. Then it is gone, and they laugh, and agree their Pokémon deserve a better trainer, and walk on.', flagAt('disguise-met'))),
    ]),
  scene(`${DI}-s2`, 'The Champion in Disguise', { requires: [flagAgo('disguise-met', 1), not('disguise-s2')], callback: true },
    'A different region, a different road, and the same plain coat leaning on a signpost. The traveller pushes off it with a grin. Traveller: "Same traveller. Better team this time, I promise."',
    [ch('"Battle."', fight('This time they try a little. You can see it: their hands keep going to a move and stopping, going and stopping, like someone reaching for a biscuit they have promised not to eat.',
      traveller(1, [room(`${DI}-s2-won`)], [room(`${DI}-s2-lost`)]), flagAt('disguise-s2')))]),
  side(`${DI}-s2`, 'lost', 'The Champion in Disguise: Interested',
    'They win. Narrowly. And then they stand there looking worried about it, cap in both hands. Traveller: "Sorry. I didn\'t mean— I got interested. That\'s the trouble. I always get interested."',
    [
      ch('"Don\'t apologise for winning."', out('The traveller blinks at you. Then they put the cap back on, slowly, and nod, as if that is the most interesting thing anyone has said to them in years. They walk on without another word, but they look back twice.')),
      s2Who(),
      s2Again(),
    ]),
  side(`${DI}-s2`, 'won', 'The Champion in Disguise: From This Side',
    'You win. The traveller stares at the field for a second, and then laughs out loud, for the first time, a real laugh that bends them double. Traveller: "There. Do that again. I\'d forgotten what that felt like from this side."',
    [s2Again(), s2Who()]),
  scene(`${DI}-s3`, 'The Champion in Disguise', {
    requires: [is('disguise-s2'), not('disguise-done')], callback: true,
    remembers: [
      variant('diantha', [inRegion('kalos', 'unova', 'alola')], { intro: s3Intro('Diantha', 'Without the cap the face is unmistakable; you have seen it on posters, on screens, on the side of a bus.'), hide: [0, 1, 2], add: s3Choices('Diantha', 'diantha') }),
      variant('leon', [inRegion('galar', 'paldea')], { intro: s3Intro('Leon', 'Without the cap the hair comes tumbling out, and there is no mistaking it; half the children in the region wear their caps the way he does.'), hide: [0, 1, 2], add: s3Choices('Leon', 'leon') }),
    ],
  },
  s3Intro('Steven', 'Without the cap the silver hair catches the light, and there is a ring on one finger with a stone in it you have seen in every Champion portrait in the region.'),
  s3Choices('Steven', 'steven')),
];

// ---------- PC9. The Legendary Trainer's Echo ----------
const EC = 'face-champion-echo';
const echo: Json[] = [
  scene(EC, 'The Legendary Trainer\'s Echo', {
    remembers: [
      // TODO(engine): "the echo's Pokémon is the same species" as the one lost for good; a fight cannot copy a fallen Pokémon's species yet.
      variant('memorial', [{ kind: 'memorial', atLeast: 1 }], { notice: 'For a heartbeat the echo\'s Pokémon flickers and wears another shape, one you knew, one you lost. Then the cold light settles again.' }),
      variant('red', [is('red-met')], { notice: 'You know the cap. You know the stance. The echo is Red, younger, the age he must have been when he first climbed the mountain.' }),
    ],
  },
  'The air bends, the way it does over a road on a hot day, except the day is cold. At the edge of the road a silhouette appears in a red cap, outlined in cold, pale light, like something remembered rather than something there. ' +
  'It raises one hand, the way a trainer calls a Pokémon back. And your lead steps forward on its own, ears and eyes fixed on the silhouette, as if it has been called by name.',
  [
    ch('"Let it go."', fight('You let it go. Your lead walks out to meet the echo\'s single Pokémon alone, and nobody else will step in. It fights better than it has ever fought: every move clean, every dodge a hair\'s breadth, as if someone it wants to impress is watching.',
      spar('The Echo', { team: ['pikachu'], size: 1, lv: 2, rule: { noSwitch: true, suddenDeath: true }, win: [moment('Your lead fought a legendary trainer\'s echo alone, and won', 85)], lose: [moment('Your lead fought a legendary trainer\'s echo alone', 70)] }),
      { kind: 'statBoost', stat: 'all', percent: 3, who: 'lead', until: 'run' })),
    ch('"Call it back."', out('You call your lead back. It comes, reluctantly, looking over its shoulder. The echo watches it go, and then it nods to you, very slightly, and fades like breath off a window.')),
    ch('"Step forward yourself."', out('You step forward instead. The echo walks to you, and for a moment you feel it: a hand on your shoulder, light and cold and kind, the hand of someone who has been exactly where you are. And then it is gone, and the air is only air.')),
  ]),
];

// ---------- PC10. The Champion's Ghost (QUESTLINES_DEEPENED_1.md rewrite; three nights) ----------
const GH = 'ovc-champions-ghost';
const night2 = (text: string): Json => out(text, flagAt('ghost-n2'));
const ghostDone = (text: string, ...fx: Json[]): Json => out(text, flag('ghost-done'), moment(`A forgotten Champion's ghost told you their name: ${GHOST_NAME}`, 85), ...fx);
const ghost: Json[] = [
  scene(`${GH}-s1`, 'The Champion\'s Ghost', { requires: [at('night'), not('ghost-n1')] },
    'Night, and a small fire, and your team curled around it. At the edge of the firelight someone is standing in the road: a long coat of a cut nobody has worn for a century, and a sash across it. Your party has seen them first. Nobody is growling. ' +
    'It is a ghost of a past Champion. Not Red, not anyone you know. A Champion who was forgotten. Ghost: "I won. I won, and no one remembers my name."',
    [ch('"Wait—"', out('You start to get up. They are gone when you stand. Only the firelight on the empty road, and your team looking at the place where they were, and then at you.', flagAt('ghost-n1')))]),
  scene(`${GH}-s2`, 'The Champion\'s Ghost', { requires: [is('ghost-n1'), not('ghost-n2'), at('night')], callback: true },
    'Another night, another fire. This time the ghost is nearer: sitting on the other side of the fire, hands held out to it, though it does nothing for them. Your lead shuffles over to sit beside them anyway. ' +
    'Ghost: "There were nine thousand in the stands. They shouted it. All of them." They stare into the flames. Ghost: "I can\'t— I\'ve lost it too. That\'s the worst part. I can hear them shouting, and I can\'t make out the word."',
    [
      ch('"What did you win with?"', night2('Ghost: "A Ponyta. Everyone laughed. Then they stopped." They smile. It is the first thing they have been sure of, and they hold onto it like a coin in a pocket.')),
      ch('"Who forgot you?"', night2('Ghost: "Nobody decided to. It\'s just that everyone who knew, died. It isn\'t anyone\'s fault." The fire pops. Ghost: "I\'d like it to be someone\'s fault."')),
      ch('"How long ago?"', night2('The ghost looks down at the coat, at the cut of it, at the sash, as if the answer might be stitched there. They start to count on their fingers, and stop, and shake their head, and just look at the fire with you until it burns down.')),
    ]),
  scene(`${GH}-s3`, 'The Champion\'s Ghost', { requires: [is('ghost-n2'), not('ghost-done'), at('night')], callback: true },
    'The third night. The ghost is standing when you arrive, coat buttoned, sash straight, the way a Champion stands at the end of a long tunnel before they walk out into the noise. ' +
    'Ghost: "Battle me. Then tell someone."',
    [ch('"Battle."', fight('The ghost sends out a team of a century ago: plain, tough Pokémon with old-fashioned names, and leading them a Rapidash made of pale fire that throws no heat at all.',
      spar('The Forgotten Champion', { team: ['rapidash', 'tauros', 'golem', 'lapras'], size: 4, lv: 1, win: [room(`${GH}-s3-name`)], lose: [again(`${GH}-s3`), moment('A forgotten Champion\'s ghost beat you, and will wait for another night', 55)] })))]),
  side(`${GH}-s3`, 'name', 'The Champion\'s Ghost: The Name',
    'When the Rapidash goes down, it bows its head to your lead. And the nine thousand are there, for one second: the stands, the noise, a roar from everywhere at once, and in it, a word. ' +
    `Ghost: "There. Did you hear— that's it. That's me. That's my name." You heard it. ${GHOST_NAME}. The ghost says it again, softly, and again, as if they are afraid to put it down. ` +
    'Ghost: "Now tell someone."',
    [
      ch('"I\'ll tell the caretaker."', ghostDone(`You promise to tell the caretaker at the Hall of Past Champions. The ghost nods slowly, as if they know the place. At the Hall, an empty plinth will get a plate: ${GHOST_NAME}.`, flag('ghost-plate'))),
      ch('"I\'ll put it in the Hall."', ghostDone(`You promise to cut the plate yourself. The ghost laughs, the first time you have heard it, and it sounds like a crowd. At the Hall of Past Champions, an empty plinth will get a plate with ${GHOST_NAME} on it, cut by your own hand.`, flag('ghost-plate'), flag('ghost-cut-plate'))),
      // Rival `[by personality]`: the doc gives only the Strategist's line; it is used for every rival (no personality condition exists).
      ch('"I\'ll tell my rival."', ghostDone(`You tell your rival the next time you meet. They stop dead. Rival: "Who? ...Say it again. Slowly. I'm writing it down. Somebody should have written it down." You say it slowly: ${GHOST_NAME}.`, flag('ghost-told-rival')), { requires: [rivalMet] }),
    ]),
];

// ---------- PA4. A Familiar Face (QUESTLINES_PAST_ALLIES_AND_FUTURE.md; SF5 MS9) ----------
// Built in-run only (Kice: no cross-run memory): Ressa, this run's fellow apprentice, already graduated, met as a mentor companion. The doc's "Needs past.mentor.<name>"
// and "trained beside in a past run" are cross-run and not built (see the report).
const ressaReward = companion(1); // "Ressa fights beside the player as a tag partner in the next hard battle (boss or rival)". TODO(engine): only the next boss or rival battle.
const familiar: Json[] = [
  shared('mentor-familiar-face', {
    title: 'A Familiar Face',
    requires: [mentorIs(), M.is('lesson')],
    intro:
      '{mentor}\'s training ground, early, dew still on the practice posts. Someone else is already there, stretching against the fence, and she turns when she hears your step. You know her: Ressa, the other apprentice, the one who always has a bandage on her knuckles, who left {mentor} a little ahead of you. ' +
      'Ressa: "Look who it is. I graduated. Came back to help the next ones." {mentor} looks from her to you and back. {mentor}: "You two know each other? Good. Saves me a speech." ' +
      'Ressa grins and points a finger at you. Ressa: "I remember you. You always went first. Even when you shouldn\'t have."',
    choices: [
      // TODO(engine): "Ressa's partner gains a stat point" too; the fellow apprentice's Pokémon cannot take a stat boost yet (flag owed).
      ch('"Train with me."', out('You train side by side all morning, the same drills, the same posts, Ressa\'s partner and your lead pushing each other until both are panting. By noon both of them are a little stronger, and Ressa says she will be there when the next hard fight comes.',
        stat('best'), RESSA.set('trained'), flag('ressa-partner-stat'), ressaReward)),
      // TODO(engine): "Ressa's partner uses the move the mentor taught them both"; a fight cannot give the apprentice the mentor's move yet.
      ch('"Show me what you learned."', fight('Ressa\'s eyes light up. She sends out her partner, and in the second turn it uses the move {mentor} taught you both, the one you practised until your hands ached. She is very good now.',
        spar('Ressa', { apprentice: true, size: 3, lv: 1, win: [moment('You beat Ressa, your fellow apprentice, now graduated', 65)], lose: [moment('Ressa, your fellow apprentice, now graduated, beat you', 55)] }), RESSA.set('battled'), ressaReward)),
      // "She sits with the player for a rest node": a rest (heal 0.5) that spends a node.
      ch('"Did it get easier?"', out('Ressa stops stretching. She sits down on the fence rail and thinks about it properly. Ressa: "No. You just get used to the weight." Then she stays, and you sit with her for a whole rest, saying not much, while your team dozes in the sun.',
        heal(0.5), takeNode(1), RESSA.set('talked'), ressaReward)),
    ],
  }),
];

export const EVENTS: Json[] = [...red, ...blue, ...cynthia, ...lance, ...sable, ...hall, ...victoryHall, ...garage, ...disguise, ...echo, ...ghost, ...familiar];
export const REMOVE: string[] = [];

export const DOC: Record<string, string> = {
  'red-on-the-mountain': 'QPC PC1 Red on the Mountain',
  'blue-taunt': 'QPC PC2 The Champion Who Lost in an Afternoon', 'blue-taunt-battle': 'QPC PC2 ("No.": a battle offered)',
  'face-champion-coffee': 'QPC PC3 Coffee with Cynthia', 'face-champion-coffee-road': 'QPC PC3 (escort node 1)', 'face-champion-coffee-ruin': 'QPC PC3 (escort node 2: the ruin)',
  'face-champion-coffee-letter': 'QPC PC3 Remembers (the letter in the last region)', 'face-champion-coffee-battle': 'QPC PC3 (Drink: a battle offered)',
  'pc-dragon-master-last-flight': 'QPC PC4 The Dragon Master\'s Last Flight', 'pc-dragon-master-last-flight-ask': 'QPC PC4 (Why?)',
  'pc-dragon-master-last-flight-flight-1': 'QPC PC4 (flight node 1)', 'pc-dragon-master-last-flight-flight-2': 'QPC PC4 (flight node 2)', 'pc-dragon-master-last-flight-flight-3': 'QPC PC4 (flight node 3)',
  'pc-dragon-master-last-flight-walk-1': 'QPC PC4 (walk node 1)', 'pc-dragon-master-last-flight-walk-2': 'QPC PC4 (walk node 2)', 'pc-dragon-master-last-flight-walk-3': 'QPC PC4 (walk node 3)',
  'pc-dragon-master-last-flight-walk-4': 'QPC PC4 (walk node 4)', 'pc-dragon-master-last-flight-sea': 'QPC PC4 (At the sea; reward)',
  'retired-champion-spar': 'QPC PC5 The Champion Who Left', 'retired-champion-spar-after': 'QPC PC5 (After the spar)', 'retired-champion-spar-lesson': 'QPC PC5 (Reward: her lesson)',
  'retired-champion-spar-lesson-more': 'QPC PC5 (Reward: her lesson, other stats)',
  'mr-hall-champions': 'QPC PC6 The Hall of Past Champions', 'mr-hall-champions-wing-1': 'QPC PC6 (Fight: statues 1)', 'mr-hall-champions-wing-2': 'QPC PC6 (Fight: statues 2)',
  'mr-hall-champions-wing-3': 'QPC PC6 (Fight: statues 3)', 'mr-hall-champions-key': 'QPC PC6 (Reward: the key to the Archive)',
  'dungeon-victory-hall': 'SF8 C4 Victory Hall (room 1, Patience)', 'dungeon-victory-hall-courage': 'SF8 C4 (room 2, Courage)', 'dungeon-victory-hall-memory': 'SF8 C4 (room 3, Memory)',
  'dungeon-victory-hall-memory-pick': 'SF8 C4 (room 3, a Champion of the player\'s choice)',
  'retired-champ-garage': 'QPC PC7 The Garage Sale', 'retired-champ-garage-team': 'QPC PC7 (the photo: her first team)',
  'ovc-champion-in-disguise-s1': 'QD1 PC8 Stage 1', 'ovc-champion-in-disguise-s1-after': 'QD1 PC8 Stage 1 (after the battle)', 'ovc-champion-in-disguise-s2': 'QD1 PC8 Stage 2',
  'ovc-champion-in-disguise-s2-lost': 'QD1 PC8 Stage 2 (they win)', 'ovc-champion-in-disguise-s2-won': 'QD1 PC8 Stage 2 (the player wins)', 'ovc-champion-in-disguise-s3': 'QD1 PC8 Stage 3',
  'face-champion-echo': 'QPC PC9 The Legendary Trainer\'s Echo',
  'ovc-champions-ghost-s1': 'QD1 PC10 Night 1', 'ovc-champions-ghost-s2': 'QD1 PC10 Night 2', 'ovc-champions-ghost-s3': 'QD1 PC10 Night 3', 'ovc-champions-ghost-s3-name': 'QD1 PC10 Night 3 (the name; tell someone)',
  'mentor-familiar-face': 'QPAF PA4 A Familiar Face (SF5 MS9)',
};

export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'red-(battled|beaten)', readBy: 'SF8 C5 The Silent Cap (people-champions-2 reads red-battled / red-sat); PC1 Afterstory: Red at the Final Reunion (cross-run, not built)' },
  { match: 'blue-owed-champion-pin', readBy: 'New item owed: Blue\'s pin (held: +5% to the holder\'s stats in a rival battle), QPC PC2 Reward' },
  { match: 'cynthia-(told|inscription)', readBy: 'QPC PC3: cynthia.told has no later reader; the inscription is a Legendary Telling (the Legendary questlines)' },
  { match: 'lance-egg-extreme-speed', readBy: 'Needs engine: the Dratini egg hatches knowing Extreme Speed (QPC PC4 Reward)' },
  { match: 'sable-league', readBy: 'SF5 B9 Sable Oakridge (the same flag): Sable in the Elite Four in the last region; needs engine (QPC PC5 Remembers)' },
  { match: 'hall-archive-key', readBy: 'PA7 The Archive (QUESTLINES_PAST_ALLIES_AND_FUTURE.md), QPC PC6 Reward' },
  { match: 'victory-hall-name', readBy: 'SF8 C4 Reward: the player\'s name on the wall, every run (cross-run, not built)' },
  { match: 'garage-photo', readBy: 'Needs engine: once per run, a Pokémon sharing a species with her first team gains +1 Bond (QPC PC7 Reward)' },
  { match: 'disguise-done', readBy: 'QD1 PC8 Reward and Afterstory: a Past Ally for later runs, the traveller at the Final Reunion (cross-run, not built)' },
  { match: 'ghost-(done|cut-plate|told-rival)', readBy: 'QD1 PC10 Remembers: a statue in the Hall in later runs, and the rival mentions it (cross-run; rival lines are RIVALS docs)' },
  { match: 'ressa-(trained|battled|talked|partner-stat)', readBy: 'QPAF PA4 Afterstory: Ressa at the Final Reunion; ressa-partner-stat needs engine (her partner\'s stat point)' },
];

export const EXTERNAL: string[] = ['glass-plaque'];
