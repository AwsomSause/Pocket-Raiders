// @ts-nocheck: work in progress (stopped 2026-11-15 when Kice capped running threads at five); rename to people-*.ts to build.
// Catalog Overhaul Pack, people: PAST GYM LEADERS, the Day Off frame and scenes B1 to B13, B15, B16 (STORY_FAMILIES_8.md lines 1 to 438;
// B14 "The Coin Hums" is GL6 stage 3, built elsewhere), with GL1 "A Leader's Day Off" (QUESTLINES_PAST_CHAMPIONS_AND_LEADERS.md lines 284 to 313)
// folded into the frame. Pattern: people-roster-2.ts.
// The frame (`face-leader-day-off`) opens one Leader's personal scene as a room (`face-leader-day-off-<leader>`); each Leader's scene is also
// its own catalog event at its old id. Both are built from one definition.
// Build: npm run co:build -- people-leaders-1
import { $, any, ch, fight, flag, flagAgo, flagAt, gym, heal, hurtLead, item, join, lv, money, out, ptype, room, roomFrom, again, type Json } from '../dsl.ts';
import { bond, CATEGORY as CAT, is, moment, not, oldOf, rep, scene, spar, variant } from './_people.ts';

export const CATEGORY = CAT;

// ---------- The Day Off frame (SF8 Part B "The Day Off frame"; GL1) ----------
// Flags: `dayoff-<leader>` (met; also `dayoff-met`, any Leader), `dayoff-<leader>-helped` (stamped: the payoff is in a later region; also
// `dayoff-helped`, any Leader, read by the Fan Club).
const DO = (k: string): string => `dayoff-${k}`;
const met = (k: string): Json[] => [flag(DO(k)), flag('dayoff-met')];
const helped = (k: string): Json[] => [flagAt(`${DO(k)}-helped`), flag('dayoff-helped')];
/** Every outcome of a Leader's scene that counts as the meeting and as helping. */
const help = (k: string): Json[] => [...met(k), ...helped(k)];

interface Leader {
  id: string;
  key: string;
  title: string;
  /** How the café frame turns into this Leader's scene (the room copy's first sentences). */
  bridge: string;
  intro: string;
  choices: Json[];
  remembers?: Json[];
  /** The catalog event's own gate (default: this Leader not met yet this run). */
  gate?: Json[];
}

/** One Leader's scene: the catalog event at its old id, and the room the café frame opens (`face-leader-day-off-<key>`). */
function leader(l: Leader): Json[] {
  const old = oldOf(l.id);
  const sc = (old.scene as Json | undefined) ?? {};
  const look = { cast: (sc.cast as string[] | undefined) ?? [], ...(sc.tint ? { tint: sc.tint as string } : {}), effect: (sc.effect as string | undefined) ?? 'none', types: (old.types as string[] | undefined) ?? [] };
  const name = l.title;
  return [
    scene(l.id, name, { requires: [...((old.requires as Json[] | undefined) ?? []), ...(l.gate ?? [not(DO(l.key))])], ...(l.remembers ? { remembers: l.remembers } : {}) }, l.intro, l.choices),
    scene(`face-leader-day-off-${l.key}`, name, { group: (old.group as string | undefined) ?? 'Famous faces', rarity: 'uncommon', room: true, requires: [], ...look, ...(l.remembers ? { remembers: l.remembers } : {}) }, l.bridge + l.intro, l.choices),
  ];
}

const LEADERS = ['burgh', 'candice', 'elesa', 'lenora', 'misty', 'roark', 'poppy', 'kahili', 'iono', 'larry', 'mustard'];

const frame: Json = scene('face-leader-day-off', 'A Leader\'s Day Off', { cast: [] },
  'A café terrace in the late morning, chairs scraped out onto the pavement, sparrows working the crumbs under the tables. At the corner table sits someone in a plain jumper and a borrowed-looking scarf, nibbling a pastry very slowly, as if it is the first thing they have had time to taste in weeks. It takes you a moment to place the face: a Gym Leader, out of uniform, with no badge case and no crowd and no challenger queue. ' +
  'They catch you staring and laugh, a little embarrassed, and nudge the empty chair out with one foot. Leader: "No badge today. No pressure. Want a casual battle? Or just sit." Up close they look tired in the way people do when the tiredness is not from work. Their eyes keep drifting to somewhere past your shoulder.',
  [
    ch('"Casual battle."', fight('The Leader brightens at once, brushes the flakes off their jumper and sends out three Pokémon you have never seen on a Gym poster: their off-duty team, the ones they raise for fun. The waiter moves a table out of the way without being asked.',
      spar('Off-Duty Gym Leader', { size: 3, win: [moment('You won an exhibition against a Gym Leader on their day off')], lose: [moment('A Gym Leader on their day off beat you, and bought you a coffee after')] }))),
    ch('"Just sit."', out('You sit. The coffee is good and the chair is warm from the sun. The Leader talks shop for an hour: the challengers who cry, the ones who cheat, the one kid who brought a sandwich for their Pokémon and none for themselves. Your team dozes under the table, and by the time you stand up they are rested and so are you.', heal(0.5))),
    ch('"You look like you\'ve got something on your mind."', out('The Leader stops chewing. For a second the easy smile slips, and you see the person under the title. They set the pastry down, very carefully. Then they tell you.',
      roomFrom(...LEADERS.map((k) => `face-leader-day-off-${k}`)))),
  ]);

// ---------- B1. Burgh: The Unfinished Painting ----------
const burghPaint = 'Burgh paints for an hour without speaking, tongue between his teeth. When he finally steps back there is a small figure in the reeds on the canvas, and the whole river seems to lean towards it.';
const burgh = leader({
  id: 'burgh-painting', key: 'burgh', title: 'Burgh: The Unfinished Painting',
  bridge: 'The Leader at the café table is Burgh, out of his smock for once, with paint still under his fingernails. He says he would rather show you than tell you, and walks you down to the river. ',
  intro:
    'A riverbank in spring, the water bright and quick over the stones. Burgh stands at an easel with paint on his face, and a Leavanny holds his palette for him with enormous patience, two leaf-arms out like a waiter with a tray. He glances up at you, then past you, at your team. ' +
    'Burgh: "Pose for me? No, not you. The Bug-type. You\'re fine. You can hold this." He presses a jar of brushes into your hands without looking. Then he stares at the canvas for a long, unhappy minute. ' +
    'Burgh: "I\'ve painted this river every spring for nine years. This year I can\'t finish it. Something\'s missing and I can\'t see what." The painting is beautiful. It is also, somehow, empty.',
  choices: [
    ch('"Pose a Pokémon."', out(`Your Pokémon (a Bug-type if you have one, whoever is bravest if not) climbs onto a rock by the water and holds still, very seriously. ${burghPaint} Burgh, very quietly: "Oh. That's it. That was what was missing." He signs the corner with a flourish, and gives you a pouch of Silver Powder from Leavanny's own collection.`,
      ...help('burgh'), item('silver-powder'), moment('Burgh painted your Pokémon into his river'))),
    ch('"Paint the last stroke for him."', out('Burgh hands you the brush as if it is a sacred object. Your stroke is wobbly, too thick, and slightly the wrong green. Burgh stares at it, and his whole face lights up. Burgh: "That\'s the one." He refuses to fix it, and presses a pouch of Silver Powder into your paint-smeared hand.',
      ...help('burgh'), item('silver-powder'))),
    ch('"Tell him it\'s done."', out('Burgh: "...Is it?" He stares at the canvas. You watch him look at it properly, maybe for the first time this spring, the river and the light and the empty reeds. Burgh: "It is. Huh." He laughs, wipes his face and makes it worse, and gives you a pouch of Silver Powder for your trouble.',
      ...help('burgh'), item('silver-powder'))),
  ],
  remembers: [
    variant('vera', [is('roster-vera-done')], { notice: 'Painter Vera is set up two easels along, and she and Burgh are already arguing about blue: whether the river is cobalt or just wet. By the time you leave, Burgh has bought one of her paintings, and is pretending he did not.' }),
  ],
});

// ---------- B2. Candice: Focus ----------
const candice = leader({
  id: 'candice-snowball', key: 'candice', title: 'Candice: Focus',
  bridge: 'The Leader at the café table is Candice, scarf up to her nose, hot chocolate untouched. She drags you outside: she thinks better in the cold. ',
  intro:
    'A snowfield under a white sky, the kind of quiet that makes your ears ring. Candice is building a snowball wall with a Froslass, packing each block tight with her mittens, her cheeks pink and her hair full of frost. ' +
    'Candice: "Snowball fight! Focus, focus, focus!" She throws. She misses by a mile; the snowball sails clean over your head and vanishes into a drift. She stops, arm still raised, and slowly lowers it. ' +
    'Candice: "I lost to a kid last week. Since then I can\'t focus on anything." Froslass drifts closer to her and rests a cold hand on her shoulder.',
  choices: [
    ch('"Snowball fight."', out('You dive behind the wall and the war begins. You land throw after throw, and by the end Candice is flat on her back in the snow, laughing so hard she can\'t breathe. She sits up with ice in her eyelashes and gives you a chunk of Never-Melt Ice from her pocket.', ...help('candice'), item('nevermeltice')),
      { prompt: { id: 'aim-drag', needs: 'good' }, fail: out('Candice finds her arm halfway through and buries you. You surrender from under a small snowdrift, and she is laughing so hard she has to sit down. She digs a chunk of Never-Melt Ice out of her pocket and drops it on your chest.', ...help('candice'), item('nevermeltice')) }),
    ch('"Talk about the loss."', out('You sit on the wall together, snow soaking through your knees. Candice: "The kid had fun. I didn\'t. That\'s what bothers me." It is a quiet talk, the kind with long pauses. When it is over she looks lighter, and she presses a chunk of Never-Melt Ice into your hand.', ...help('candice'), item('nevermeltice'))),
    ch('"Throw one at her when she\'s not looking."', fight('Direct hit, right on the back of her hat. Candice shrieks loud enough to shake snow off the pines, spins round, and retaliates with her whole team. It is the best fight she has had all month, and she is grinning the whole way through it.',
      spar('Candice', { team: ['froslass', 'abomasnow', 'sneasel', 'medicham'], size: 4, lv: 1, win: [moment('You started a snowball war with Candice and won the battle after')], lose: [moment('Candice paid you back for a snowball with her whole team')] }), ...help('candice'), item('nevermeltice'))),
  ],
});

// ---------- B3. Elesa: The Photographer ----------
const elesaReward = (): Json[] => [item('magnet'), moment('Elesa signed a photo for you')];
const elesa = leader({
  id: 'elesa-photoshoot', key: 'elesa', title: 'Elesa: The Photographer',
  bridge: 'The Leader at the café table is Elesa, sunglasses on indoors, and she is not eating the pastry at all. She asks you to come to her shoot tonight. She does not say why until you get there. ',
  intro:
    'A pier at night, the water black and the lamps humming. Cameras flash white over and over. Elesa poses with her Zebstrika on the boards, its mane crackling every time the flashes hit it. Off to one side, apart from the crowd, a photographer in a long coat stands with his camera held low. He is always there. ' +
    'Elesa: "Strike a pose. No. Better." She says it to Zebstrika, but her eyes slide to the man in the coat. Then, quietly, without moving her lips: Elesa: "That man. Every shoot for a month. He doesn\'t work for anyone."',
  choices: [
    ch('"Chase him off."', fight('You walk straight at the man in the coat. He fumbles a Poké Ball out of his pocket rather than answer, and the flashes turn towards you.',
      spar('Photographer in a Long Coat', { size: 1, win: [moment('You chased the man in the long coat off Elesa\'s pier')], lose: [moment('The man in the long coat beat you, and ran anyway')] }),
      ...help('elesa'), ...elesaReward())),
    ch('"Pose with her so he gets bored."', out('For ten minutes you and Elesa pose as dully as two people can: standing, sitting, holding a cup. Zebstrika yawns. One by one the cameras go down, and finally the man in the coat sighs and walks away down the pier. Elesa signs a photo for you, laughing, and gives you a Magnet.', ...help('elesa'), ...elesaReward())),
    ch('"Talk to him."', out('Up close he is old, and shaking. He is not a stalker: he is her old photography teacher, the one who first put a camera in her hands, too shy to say hello after all these years. Elesa is stunned. Then she crosses the pier in four steps and hugs him, and every camera on the pier goes off at once. She signs a photo for you with both their names, and gives you a Magnet.',
      ...help('elesa'), flag('dayoff-elesa-teacher'), ...elesaReward())),
  ],
});

// ---------- B4. Lenora: The Missing Relic ----------
const LEN = 'lenora-museum';
const lenFossil = (): Json[] => [join({ species: ['tirtouga', 'archen'] }), moment('Lenora gave you free entry to her museum for life'), moment('You brought back the fossil Lenora\'s father found', 75)];
const lenFound = (text: string): Json => out(text, ...helped('lenora'), ...lenFossil());
const lenoraFind = (text: string): Json => out(text, ...met('lenora'), room(`${LEN}-fence`));
const lenoraBoard = (text: string): Json => out(text, ...help('lenora'), flagAt('dayoff-lenora-board'));
const lenora = leader({
  id: LEN, key: 'lenora', title: 'Lenora: The Missing Relic',
  bridge: 'The Leader at the café table is Lenora, a ring of keys beside her saucer. She checks her watch, sighs, and asks if you would walk back to the museum with her. ',
  intro:
    'A museum\'s front steps, broad and pale, pigeons strutting along the top. Lenora stands at the door in a cardigan with a ring of keys at her belt, and she beams at you like you are the first visitor of the day, which you might be. ' +
    'Lenora: "Want the full tour? It\'s the best tour in the region. I give it myself." Inside, the halls smell of polish and old paper. At the back, one display case stands empty. A small card on the glass says: "On Loan." Lenora sees you looking, and her smile goes. ' +
    'Lenora: "It\'s not on loan. It was stolen. A fossil my father found. I haven\'t told the board."',
  choices: [
    ch('"Find it."', lenoraFind('Lenora looks at you for a long moment, then unclips a key from her ring and folds your fingers round it. Lenora: "Back door\'s that one. Bring it home." She tells you where she thinks it went: a fence on the wrong side of the river.')),
    ch('"Tour first."', out('It is the best tour in the region; she was not exaggerating. Lenora walks you through every hall and gives you a fact about each type of Pokémon, one per case, never repeating herself. At the end you are standing in front of the empty case again, and she is quiet.',
      ...met('lenora'), flag('dayoff-lenora-toured'), room(`${LEN}-tour`))),
    ch('"Tell the board."', lenoraBoard('Lenora: "...You\'re right." She makes the call from the office with the door open, and you hear her voice shake once. The board is kind. The police take the case, and Lenora says they will find it within a region. She almost believes it.')),
  ],
});
const lenoraRooms: Json[] = [
  scene(`${LEN}-tour`, 'Lenora: The Empty Case', { room: true, cast: ['trainer.lenora'], effect: 'glint' },
    'The tour is over, the halls are quiet, and the empty case is still empty. Lenora straightens the "On Loan" card with one finger so it sits perfectly level, which is somehow the saddest thing you have seen all day.',
    [
      ch('"Find it."', lenoraFind('Lenora breathes out, and something in her shoulders lets go. She gives you the back-door key and the name of a fence on the wrong side of the river.')),
      ch('"Tell the board."', lenoraBoard('Lenora: "...You\'re right." The call is short. The board is kind, the police take the case, and they promise to find it within a region.')),
    ]),
  scene(`${LEN}-fence`, 'Lenora: The Fence\'s Back Room', { room: true, cast: ['trainer.lenora'], effect: 'fog' },
    'A pawn shop by the river with half its sign missing. In the back room, behind a curtain of beads, a thin man counts watches with a Purrloin asleep in his lap. He sees the museum key in your hand and goes very still. Not here, he says, too fast. Not anymore.',
    [
      ch('"Who sold it to you?"', out('He holds out for about four seconds. Then the Purrloin wakes up and looks at him, and he caves: a Grunt brought it in, a big lad in a uniform, and took it back the same night when the price was wrong. He is down by the old warehouses.', room(`${LEN}-grunt`))),
      ch('"Pay him for the name."', out('You put 200 on the counter. He takes it without looking at it, and tells you: a Grunt in a uniform, down by the old warehouses, still trying to sell it.', $(-200), room(`${LEN}-grunt`)), { requires: [money(200)] }),
    ]),
  scene(`${LEN}-grunt`, 'Lenora: The Grunt', { room: true, cast: ['trainer.pr/rocket_grunt_m'], effect: 'none' },
    'Behind the old warehouses a Grunt sits on an upturned crate, swearing at a torn sack. The sack is empty. He looks up, sees you, and sighs like this is exactly the kind of day he has been having.',
    [
      ch('"Battle."', fight('He gets up slowly, not happy about it, and throws his Poké Ball like it owes him money.',
        spar('Grunt', { size: 2, win: [moment('You beat a Grunt for news of Lenora\'s fossil'), room(`${LEN}-dog`)], lose: [moment('A Grunt beat you, then told you where the fossil went anyway'), room(`${LEN}-dog`)] }))),
      ch('"Where is it?"', out('He laughs, not kindly, then points down the lane. A dog took it, he says. Grabbed it right out of the sack and ran, and he is not going after it again. He holds up a bitten sleeve as proof.', room(`${LEN}-dog`))),
    ]),
  scene(`${LEN}-dog`, 'Lenora: The Dog and the Bone', { room: true, cast: ['trainer.lenora'], pokemon: 'herdier', effect: 'none' },
    'At the end of the lane, in a yard full of washing, a Herdier lies on its belly with a long brown bone between its paws, chewing it with total contentment. It is not a bone. It is the fossil, and the Herdier has no intention of letting go.',
    [
      ch('"Play tug."', lenFound('You take one end and the Herdier takes the other, and it is the best game it has ever played. When it finally lets go it wags its whole body. Lenora, running up the lane, goes down on her knees in the washing and holds the fossil like a baby. The museum lab revives it within the week, and Lenora gives it to you: her father would have wanted it to see the world. Your museum entry is free for life.'),
        { prompt: { id: 'pull-hold', needs: 'good' }, fail: lenFound('The Herdier wins tug after tug, and only lets go when it is tired, panting and pleased with itself. It drops the fossil at your feet like a gift. Lenora arrives at a run and holds it like a baby. The museum lab revives it within the week, and she gives it to you: her father would have wanted it to see the world. Your museum entry is free for life.') }),
      ch('"Trade it a better bone."', lenFound('You find a real bone at the butcher\'s two streets over. The Herdier sniffs it, considers, and makes the trade like a businessman. Lenora arrives at a run and holds the fossil like a baby. The museum lab revives it within the week, and she gives it to you: her father would have wanted it to see the world. Your museum entry is free for life.')),
    ]),
  scene(`${LEN}-returned`, 'Lenora: Back in Its Case', { callback: true, rarity: 'uncommon', requires: [flagAgo('dayoff-lenora-board', 1)], cast: ['trainer.lenora'], effect: 'glint' },
    'A letter finds you on the road, in Lenora\'s big looping hand: the police found it. A dog had it, of all things. You stop by the museum, and the case at the back is full again, the "On Loan" card in the bin. Lenora is waiting by it with something wriggling in her arms. The lab revived it.',
    [
      ch('"Is that it?"', out('Lenora laughs and puts it in your arms. Her father found the fossil; she thinks he would rather it saw the world than sat behind glass. Lenora: "Free entry. For life. Don\'t argue." You do not argue.', ...lenFossil())),
    ]),
];

// ---------- B5. Misty: The Race ----------
const mistyWin = (text: string): Json => out(text, ...help('misty'), item('mystic-water'));
const mistyTow = (): Json => ch('"Race (Water-type tows me)."', mistyWin('Your Water-type takes the tow rope in its mouth and goes. It is a real race, and a close one: you and Misty hit the buoy so near together that neither of you will ever agree who won. She is delighted. She gives you a Mystic Water, still dripping.'),
  { requires: [ptype('water')], prompt: { id: 'hurdle-rhythm', needs: 'good' }, fail: mistyWin('Your Water-type tows you hard, and Misty and her Starmie still touch the buoy half a length ahead. It was a real race, and close, and she is beaming. She gives you a Mystic Water, still dripping.') });
const mistySelf = (): Json => ch('"Swim myself."', mistyWin('You lose badly. Very badly. Misty is at the buoy and back before you are halfway, and she laughs so hard she swallows lake water. Then she swims back out and teaches you to breathe properly, every third stroke, until you can. She gives you a Mystic Water when you finally crawl out.'));
const misty = leader({
  id: 'misty-swim', key: 'misty', title: 'Misty: The Race',
  bridge: 'The Leader at the café table is Misty, hair still wet, a towel round her neck. She has been sitting still for ten minutes and it is clearly killing her. She drags you to the lake. ',
  intro:
    'A lake at the edge of town, cold and clear, the far shore blue with distance. Misty is swimming laps when you arrive, fast and clean, a Starmie racing alongside her with its core flashing. She sees you and pops up, treading water. ' +
    'Misty: "Race me! First to the buoy." She points at a red buoy bobbing a long way out. Then she narrows her eyes. Misty: "And don\'t you dare let me win. I hate that."',
  choices: [
    mistyTow(),
    mistySelf(),
    ch('"Let her win."', out('You hang back, just a little, just enough. Misty touches the buoy, turns, and sees exactly what you did. She figures it out in one look. She is furious, red to the ears, and she swims back to shore without a word, then turns at the edge. Next time, she says, a real race. She means it.',
      ...met('misty'), flag('dayoff-misty-angry'), again('misty-swim'))),
  ],
  // "Let her win" leaves Misty to be met again (a real race demanded): her gate is helping, not meeting.
  gate: [not('dayoff-misty-helped')],
  remembers: [
    variant('angry', [is('dayoff-misty-angry')], {
      intro: 'The lake again, and Misty is already in the water, arms folded on the buoy rope, waiting for you. She has been waiting a while. Misty: "Race me! First to the buoy." Her voice is flat. Misty: "And don\'t you dare let me win. I hate that." This time there is no option to.',
      hide: [2],
    }),
  ],
});

// ---------- B6. Roark: The Letter ----------
const roarkReward = (): Json[] => [any('skull-fossil', 'armor-fossil'), item('hard-stone')];
const roark = leader({
  id: 'roark-mine', key: 'roark', title: 'Roark: The Letter',
  bridge: 'The Leader at the café table is Roark, his helmet on the chair beside him. He cannot sit still either. He says the only place he can think is underground. ',
  intro:
    'A mine, cool and close, the lamps strung along the tunnel throwing long shadows. Roark has his helmet on and a pickaxe on his shoulder, and his Cranidos is headbutting a wall with great enthusiasm and no plan. ' +
    'Roark: "Help me dig, we\'ll split the finds!" You dig for an hour. Later, sitting on an ore cart with your legs dangling, sharing a flask of tea, he goes quiet. ' +
    'Roark: "My dad runs the Gym in the next city. He won\'t visit. Says Gym Leaders shouldn\'t leave their posts." He turns his helmet over in his hands.',
  choices: [
    ch('"Dig."', out('You dig until your arms ache, and Cranidos finds the good seam by headbutting it. A fossil and a Hard Stone come out of the rock. Roark splits the finds fair and square, and gives you first pick.', ...met('roark'), ...roarkReward())),
    ch('"Write to his father."', out('You write the letter on the back of an ore receipt, Roark reading over your shoulder and saying "don\'t say that" every other line. He posts it himself. He gives you your half of the morning\'s finds, a fossil and a Hard Stone, and does not mention the letter again.',
      ...help('roark'), flag('dayoff-roark-letter'), ...roarkReward())),
    ch('"Go and get him."', out('Roark stares at you like you suggested moving the mountain. Then he laughs, a short helpless laugh, and says you will never manage it. You set off for the next city anyway.', ...met('roark'), room('roark-mine-byron'))),
  ],
});
const byronFight = (text: string): Json => fight(text,
  spar('Byron', { team: ['magneton', 'steelix', 'bastiodon'], size: 3, lv: 1, win: [moment('You beat Byron and brought him to his son\'s mine'), room('roark-mine-together')], lose: [moment('Byron beat you, and came to his son\'s mine anyway'), room('roark-mine-together')] }));
const roarkRooms: Json[] = [
  scene('roark-mine-byron', 'Roark: The Stubborn Father', { room: true, cast: ['trainer.roark'], effect: 'shake' },
    'The next city\'s Gym, all steel and echoes. Byron is a big man with his son\'s jaw, and he hears you out with his arms folded. A Gym Leader does not leave his post, he says. That is the whole answer. He does not move.',
    [
      ch('"Battle me for it."', byronFight('Byron grunts, which might be approval. If you can move him in battle, he says, maybe you can move him out of the door.')),
      ch('"Tell him what Roark said."', byronFight('Byron listens to every word with his jaw working. Then he says that if his boy wants him, his boy can ask. But he reaches for a Poké Ball while he says it, which is something.')),
    ]),
  scene('roark-mine-together', 'Roark: Digging Together', { room: true, cast: ['trainer.roark'], effect: 'shake' },
    'Byron comes. He does not say why. He walks into Roark\'s mine, picks up a spare pickaxe and starts digging two paces from his son. Roark looks at him, then at you, then back at the rock. Neither of them says a word for an hour, which, for them, is a lot.',
    [
      ch('"Dig beside them."', out('You dig with them in the friendly silence. At the end of the shift Byron claps Roark on the shoulder, once, and Roark has to look at the wall for a while. They split the finds three ways: your share is a fossil and a Hard Stone.', ...helped('roark'), ...roarkReward(), moment('Roark and Byron dug together, and did not talk, and it was a lot'))),
      ch('"Leave them to it."', out('You slip out and leave them to the rock and the quiet. At the mouth of the mine Roark catches you up, says nothing, and pushes a fossil and a Hard Stone into your hands. His eyes are wet. He blames the dust.', ...helped('roark'), ...roarkReward(), moment('Roark and Byron dug together, and did not talk, and it was a lot'))),
    ]),
  // "Byron replies gruffly in a stage": a later node of the run (judgment call: no stage delay exists, the flag and a later draw stand in).
  scene('roark-mine-letter', 'Roark: The Reply', { callback: true, rarity: 'uncommon', requires: [is('dayoff-roark-letter')], cast: ['trainer.roark'], effect: 'none' },
    'A letter catches up with you on the road, the envelope grimy with thumbprints, care of Roark. Inside is a single line in heavy block capitals, pressed so hard the pen went through: "Tell him I\'m proud." It is signed Byron.',
    [
      ch('"Take it to Roark."', out('You find Roark at the mine mouth and hand it over. He reads it once. Then he goes very quiet, folds it small, and puts it inside his helmet, where it will stay.', bond(1), moment('Byron wrote that he was proud of Roark'))),
    ]),
];

// ---------- B7. Poppy: Take Me Seriously ----------
const poppyFight = (text: string): Json => fight(text,
  spar('Poppy', { team: ['copperajah', 'magnezone', 'bronzong', 'corviknight', 'tinkaton'], size: 5, lv: 2, win: [moment('You battled Poppy properly, and she loved it')], lose: [moment('Poppy beat you properly, and loved it')] }),
  ...help('poppy'), item('metal-coat'), moment('Poppy put a sticker on your Metal Coat'));
const poppyProperly = (): Json => ch('"Battle her properly."', poppyFight('Poppy gasps, drops the hammer, picks it up again, and empties every Poké Ball she has: her full team, the real one. She is thrilled from the first move to the last, win or lose, and afterwards she gives you a Metal Coat with a sticker of a smiling Tinkaton on it.'));
const poppy = leader({
  id: 'poppy-steel', key: 'poppy', title: 'Poppy: Take Me Seriously',
  bridge: 'The Leader at the café table is tiny, swinging her legs, with a hammer bigger than she is propped against the chair. Poppy. She finishes her juice and asks if you want to come to the playground. ',
  intro:
    'A playground on a bright afternoon, swings creaking. A tiny girl with a very big hammer stands on top of the slide, and beside her a Tinkaton leans on its own hammer, looking at you like it is sizing you up. ' +
    'Poppy: "Wanna play?" She slides down, lands on her feet, and drags the hammer over. Then her face falls, just a little. Poppy: "Grown-ups battle me and go easy. Every time. I\'m Elite Four. They still go easy."',
  choices: [
    poppyProperly(),
    ch('"Play first."', out('Hopscotch first. Poppy is ruthless at hopscotch, and she counts out loud, and she beats you four times. Then she stops on the last square, hammer over her shoulder, and asks again: will you battle her properly this time?', ...met('poppy'), room('poppy-steel-again'))),
    ch('"Go easy."', out('You pull your punches, and Poppy sees it on the very first move. Her lip wobbles. She cries, big hiccupping sobs, and wins anyway, every Pokémon you have, without even trying. Then she walks off dragging the hammer behind her, and does not look back.',
      ...met('poppy'), flag('dayoff-poppy-sad'))),
  ],
});
const poppyRoom: Json = scene('poppy-steel-again', 'Poppy: Properly This Time', { room: true, cast: ['trainer.poppy'], effect: 'glint' },
  'Poppy stands on the last hopscotch square, hammer on her shoulder, and Tinkaton stands behind her. They both look at you, and there is only one answer they will take.',
  [poppyProperly()]);

// ---------- B8. Kahili: The Swing ----------
const kahiliOut = (text: string): Json => out(text, ...help('kahili'), item('sharp-beak'));
const kahili = leader({
  id: 'kahili-golf', key: 'kahili', title: 'Kahili: The Swing',
  bridge: 'The Leader at the café table is Kahili, a golf glove on one hand, watching the sea through the window. She asks if you play. ',
  intro:
    'A golf course on the cliffs above the sea, the grass bright and the wind sharp with salt. Kahili sets a ball on the tee with her Toucannon perched on her golf bag. Kahili: "Care for a round?" ' +
    'She swings. She slices her drive clean off the course and into the sea, and the Toucannon closes its eyes. Kahili stands very still, watching the splash. Kahili: "My swing\'s been off since I came home. I keep looking at the sea."',
  choices: [
    ch('"Play a round."', kahiliOut('Eighteen holes, the wind getting worse. Her swing is wrong all the way round, and then, on 18, it comes back: one clean drive, straight down the middle, and Kahili laughs out loud. She gives you a Sharp Beak, shed by her Toucannon.'),
      { prompt: { id: 'aim-drag', needs: 'good' }, fail: kahiliOut('You play terribly and she plays worse, and somewhere around the 12th you both stop keeping score. On 18 her swing comes back, sweet and clean, and she does not even look at the sea. She gives you a Sharp Beak, shed by her Toucannon.') }),
    ch('"Caddy for her."', kahiliOut('You carry the bag and pick her clubs, mostly by guessing. She takes every one without arguing. On the 7th she birdies, and stares at the hole, and laughs, the first real laugh you have heard from her. She gives you a Sharp Beak, shed by her Toucannon.')),
    ch('"Ask about the sea."', kahiliOut('Kahili: "My grandfather sailed. He\'d have hated golf." She looks out at the water for a long while. Then she tees up on the cliff edge and plays one hole for him, pointing her drive out to sea, and watches it all the way down. She gives you a Sharp Beak, shed by her Toucannon.')),
  ],
});

// ---------- B9. Iono: The Chat ----------
const ionoReward = (): Json[] => [item('cell-battery'), rep(1)];
const iono = leader({
  id: 'iono-stream', key: 'iono', title: 'Iono: The Chat',
  bridge: 'The Leader at the café table is Iono, hood up and phone face down, which you have never seen before. Then the phone buzzes, and she flips it, and the smile switches on. She is due live in the square. ',
  intro:
    'A town square, busy, a fountain going. Iono stands in the middle with a floating camera bobbing at her shoulder and her Bellibolt beside her. She spots you and points with both hands. ' +
    'Iono: "Hey hey! You\'re live on my stream!" Behind her the chat scrolls up a screen on a stand, fast. Most of it is hearts. Some of it is cruel, about her hair, her voice, her last loss. She can see it. She keeps smiling.',
  choices: [
    ch('"Go live with her."', fight('You step into frame and the chat goes wild. A stream battle, then, right there by the fountain.',
      spar('Iono', { team: ['bellibolt', 'kilowattrel', 'luxray'], size: 3, win: [moment('Your starter went viral on Iono\'s stream')], lose: [moment('Your starter went viral on Iono\'s stream, even in defeat')] }),
      ...help('iono'), ...ionoReward(), moment('Iono\'s chat turned kind when your starter did something silly'))),
    ch('"Turn the camera off."', out('You reach up and switch the floating camera off. The screen goes black. Iono is shocked; her mouth opens and nothing comes out. Then her shoulders drop, all at once, and she lets out a breath like she has been holding it for a month. Relief. She gives you a Cell Battery and tells everyone about you anyway, later.', ...help('iono'), ...ionoReward())),
    ch('"Talk to her off-camera."', out('Behind the fountain, out of shot, she keeps smiling for about ten seconds. Iono: "It\'s fine. It\'s always fine." It isn\'t. She says so, quietly, and then a lot more. That evening she posts one line: taking a day off. She gives you a Cell Battery, and her fans hear about you.',
      ...help('iono'), flag('dayoff-iono-rest'), ...ionoReward())),
  ],
});

// ---------- B10. Larry: Four Years ----------
// TODO(new item): the rice ball (out of battle: the holder heals 10% HP). Owed by flag until the item exists; the Normal Gem is given.
const larryReward = (): Json[] => [item('normal-gem'), flag('dayoff-larry-owed-rice-ball')];
const larry = leader({
  id: 'larry-lunch', key: 'larry', title: 'Larry: Four Years',
  bridge: 'The Leader at the café table is Larry, eating nothing, a briefcase on his knees. He looks at his watch, says lunch is over, and asks if you would mind walking him back to the office. ',
  intro:
    'An office canteen at lunchtime, all strip lights and plastic trays. Larry sits alone with two rice balls on a napkin, eating them slowly, a tie loosened exactly one notch. Outside the window his Staraptor waits on the ledge, watching him. ' +
    'Larry: "Normal day, normal lunch." He chews. He looks at the clock. Larry: "I haven\'t had a day off in four years. If I take one, the paperwork piles up."',
  choices: [
    ch('"Eat with him."', out('You sit down across from him and eat lunch. It is quiet. Neither of you says much. Halfway through you tell a bad joke and Larry laughs, once, out loud, then looks startled at himself. It is a big deal. He gives you a rice ball and a Normal Gem.', ...met('larry'), ...larryReward())),
    ch('"Cover his shift."', out('You do an afternoon of filing, stamping, sorting, stamping again, and you are good at it. Through the window you watch Staraptor carry Larry off to the river with a fishing rod. He comes back at five with one tiny fish and the look of a new man, and gives you a rice ball and a Normal Gem.', ...help('larry'), ...larryReward()),
      { prompt: { id: 'whack-tap', needs: 'ok' }, fail: out('The filing beats you; there is a lot of it and the stamp keeps sticking. But it gets done, more or less, and through the window you see Staraptor carry Larry off to the river with a fishing rod. He comes back at five looking ten years younger and gives you a rice ball and a Normal Gem.', ...help('larry'), ...larryReward()) }),
    ch('"Tell his boss."', out('You ask who his boss is. Larry opens his mouth to answer, and stops. His boss is Larry. Larry: "...Oh." He puts the rice ball down, signs a form giving himself the afternoon off, stamps it, and walks out into the sun. He leaves you a rice ball and a Normal Gem on the tray.', ...help('larry'), ...larryReward())),
  ],
});

// ---------- B11. Mustard: The Dojo ----------
const mustardStudents = (who: string): Json => ch('"Bring him students."', out(`${who} The dojo is loud again, full of shouting and stamping and bad jokes, and Mustard laughs until he has to sit down. At the end of the day he gives you a Black Belt.`, ...help('mustard'), item('black-belt'), moment('You brought Mustard students, and his dojo was loud again')));
const mustard = leader({
  id: 'mustard-dojo', key: 'mustard', title: 'Mustard: The Dojo',
  bridge: 'The Leader at the café table is an old man in a tracksuit who has ordered three pastries and is enjoying all of them. Mustard. He insists you come up to his dojo. ',
  intro:
    'A dojo on a hill, its wooden floor worn smooth by years of bare feet. A cheerful old man in a tracksuit bounces on his toes by the door, waving you in. Mustard: "Train with me for a day? Hoo hoo!" ' +
    'The training hall is huge and spotless and empty. Your footsteps echo. Mustard looks around it, still smiling, but softer. Mustard: "My students are all grown up. The place is so quiet."',
  choices: [
    ch('"Train."', out('A whole day of training: stances at dawn, sparring at noon, sweeping the floor at dusk. By the end your lead has picked up a Fighting move from Mustard, and he gives you a Black Belt from a box of old ones.', ...met('mustard'), { kind: 'train', what: 'learnMove', type: 'fighting' }, item('black-belt'))),
    ch('"Ask about Kubfu."', out('Mustard\'s eyes light up. One of his old students, Master Hiro, has a Kubfu with him on the road, and it follows only the sincere. Mustard writes down where to find him, and gives you a Black Belt for luck.', ...met('mustard'), item('black-belt'), room('galar-kubfu-disciple'))),
    mustardStudents('You round up every trainer you have met on the road who owes you a favour, and a good few who do not, and march them up the hill.'),
  ],
  remembers: [
    variant('kenji-tamsin', [is('roster-kenji-done'), is('roster-tamsin-done')], { hide: [2], add: [mustardStudents('You send word down the road, and they come: Black Belt Kenji with his whole class, and Tamsin, who has never been in a dojo and spars with everybody.')] }),
    variant('kenji', [is('roster-kenji-done')], { hide: [2], add: [mustardStudents('You send word to Black Belt Kenji, and he comes up the hill with his whole class behind him, bowing at the door.')] }),
    variant('tamsin', [is('roster-tamsin-done')], { hide: [2], add: [mustardStudents('You send word to Tamsin, and she comes up the hill with a crowd of friends, and none of them have ever been in a dojo before.')] }),
  ],
});

// ---------- B12. The Fan Club ----------
const fanClub: Json = scene('face-leader-fan-club', 'The Fan Club', {
  remembers: [variant('helped', [is('dayoff-helped')], { notice: 'The Gym doors open and the Leader comes out for air, sees Dinah talking to you, and stops dead. Leader: "Oh no. Dinah. What did you tell them?" Then they recognise you from their day off, and laugh.' })],
},
  'A crowd with homemade banners outside a Gym, glitter on cardboard, the Leader\'s face painted badly and lovingly on a bedsheet. As you pass, one fan grabs your sleeve and does not let go. Her name badge says DINAH in three colours of pen. ' +
  'Dinah: "Want to know everything about our Leader? Everything? Favourite food, team, the time she cried at a film?" She is already opening a fat scrapbook. Dinah: "It\'s free! It\'s all true! Mostly!"',
  [
    ch('"Tell me her team."', out('Dinah reels off the Leader\'s team in order, every Pokémon, with moves and nicknames. You check it later. It is all true.', gym())),
    // TODO(engine): in the Gym battle the player can mention the film, and the Leader's first move is slower (her focus slips for a turn).
    ch('"Tell me the film."', out('It is a sweet story: an old film about a girl and her Lapras, and the Leader cried so hard at the end that she had to leave before the lights came up. Dinah tells it with great feeling. If you mention it in the Gym battle, the Leader will laugh, and lose a turn of focus.', flag('fanclub-film'))),
    ch('"No thanks."', out('Dinah is crushed. Her whole face falls, and the scrapbook closes slowly. Then a trainer with a backpack walks past behind you, and she perks up and grabs their sleeve instead.')),
  ]);

// ---------- B13. The Retired Leader's Lesson and the Pin Stall ----------
const brant: Json = scene('retired-leader-spar', 'The Retired Leader\'s Lesson', {},
  'A porch on a quiet street, a rocking chair, a tired old Rhydon asleep across the steps. A retired Leader named Corbin Brant sits with an old badge case on his knee, dusting each empty slot with a cloth. He looks up as you come through the gate, and smiles like he has been expecting someone. ' +
  'Brant: "No prize money. But I\'ll teach you everything I still know." He sets the case down and stands, slowly, one hand on the rail. Brant: "Which isn\'t much. Hips went. Brain\'s fine."',
  [
    ch('"Spar."', fight('Brant wakes the Rhydon with one tap of his cane. It is his only Pokémon now, old and grey at the horn, and he plays it perfectly: every move exactly where it hurts.',
      spar('Corbin Brant', { team: ['rhydon'], size: 1, lv: 2, win: [moment('You beat old Corbin Brant\'s Rhydon, just')], lose: [moment('Old Corbin Brant played his one Pokémon perfectly and beat you')] }), flag('brant-spar'))),
    ch('"Just the lesson."', out('Brant teaches from the rocking chair, drawing diagrams in the dust with his cane. By sunset your lead has learned a move of his old type, Rock, the way he used to teach it to challengers.', { kind: 'train', what: 'learnMove', type: 'rock' }, flag('brant-lesson'))),
    ch('"Tell me about your Gym."', out('It closed years ago, Brant says. His apprentice runs a café in it now, with the battle lines still painted on the floor under the tables. He goes every Thursday and sits where the Leader used to stand. They never charge him.', flagAt('brant-story'))),
  ]);

const PIN_TRAYS = [['fire', 'water', 'grass'], ['electric', 'ice', 'fighting'], ['rock', 'ground', 'flying'], ['bug', 'poison', 'psychic'], ['ghost', 'dark', 'steel'], ['dragon', 'fairy', 'normal']];
const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);
// TODO(new item): a held pin, +5% to that type's moves. Nearest honest build: a run relic, your Pokémon of that type deal 5% more damage.
const pinChoice = (type: string): Json => ch(`"The ${cap(type)} pin." (400)`, out(`The stallholder pins the ${cap(type)} pin to your bag strap and polishes it with his sleeve. A retired ${cap(type)}-type Leader wore it every day of their career. It is warm to the touch, and your ${cap(type)}-types seem to stand a little straighter.`,
  $(-400), { kind: 'relic', id: `leader-pin-${type}`, name: `${cap(type)} Pin`, effects: [{ kind: 'typeDamageMultiplier', type, value: 1.05 }] }), { requires: [money(400)] });
const pinTrays: Json[] = PIN_TRAYS.map((types, i) => scene(`gym-merch-stall-tray-${i + 1}`, 'The Pin Tray', { room: true, cast: ['trainer.hiker'], effect: 'glint' },
  `The stallholder slides out today's tray on its velvet: three pins, ${types.map(cap).join(', ')}, each one a little worn at the clasp. The price is written on a card, the same for each: 400. Fair, he says, and he means it.`,
  [...types.map(pinChoice), ch('"Put it back."', out('You slide the tray back. The stallholder shrugs, not offended in the slightest.'))]));
const pinStall: Json = scene('gym-merch-stall', 'The Pin Stall', {
  remembers: [variant('brant', [is('brant-story')], {
    hide: [1],
    add: [ch('"Ask whose they are."', out('Each pin came from a real retired Leader, the stallholder says, and he can tell you every one. He taps a scuffed brown pin in the corner: that one was Corbin Brant\'s. You know the name. You know where he drinks his coffee on Thursdays.', room('gym-merch-stall-brant')))],
  })],
},
  'A stall at the edge of the market, a folding table under a striped awning, covered in rows of small enamel pins on velvet. Each one is shaped like a type symbol: a flame, a drop, a leaf, a bolt. They are all a little worn. The stallholder is a big man in a cardigan with a magnifying glass on a cord. ' +
  'Stallholder: "Each pin carries a tiny type boost. Five percent. Honest, I measured." He shows you a notebook full of figures to prove it.',
  [
    ch('"Buy a pin."', out('He beams and reaches under the table for the tray.', roomFrom(...PIN_TRAYS.map((_, i) => `gym-merch-stall-tray-${i + 1}`)))),
    ch('"Ask whose they are."', out('Each pin came from a real retired Leader, the stallholder says proudly, and he can tell you every one: who wore it, which Gym, when they stepped down. He taps a scuffed brown pin in the corner. That one was Corbin Brant\'s. The name means nothing to you, yet.')),
    ch('"No thanks."', out('You thank him and move on. He goes back to polishing the pins one by one.')),
  ]);
const brantPin: Json = scene('gym-merch-stall-brant', 'Brant\'s Pin', { room: true, cast: ['trainer.hiker'], effect: 'glint' },
  'Brant\'s pin is a little brown rock, chipped on one edge, the clasp bent from years on a Gym Leader\'s collar. The stallholder says it came in with a box of old things when the Gym shut.',
  [
    ch('"Buy it and give it back to him."', out('You pay for it and carry it to the café that used to be his Gym. It is Thursday. Brant is at his table where the Leader used to stand. He turns the pin over in his old hands for a long time, and pins it to his cardigan, and does not say anything at all.', $(-400), moment('You gave Corbin Brant his pin back', 75)), { requires: [money(400)] }),
    ch('"Leave it."', out('You leave it on the velvet. Maybe someone else will know what it is worth.')),
  ]);

// ---------- B15. The Hidden Dojo (three stages) ----------
const HD = 'ovc-hidden-dojo';
const knock = (): Json => ch('"Knock."', out('You knock once, and mean it. The door opens on its own, onto a dark wooden hall where the roar of the water is suddenly very far away. Someone inside says: come back when you are ready.', flagAt(`${HD}-s1`), moment('You found the hidden dojo behind the waterfall')));
const dojo: Json[] = [
  scene(`${HD}-s1`, 'The Hidden Dojo: Behind the Waterfall', { requires: [] },
    'Spray on your face, the roar of falling water filling your whole head. Then the waterfall parts for a moment, like a curtain caught by the wind, and behind it you see a wooden door set into the rock. A sign is nailed to it, the letters worn soft by years of mist: KNOCK ONLY IF YOU MEAN IT.',
    [
      knock(),
      ch('"Walk in."', out('You push the door and step in. A Poliwrath meets you on the threshold, picks you up by the collar, and throws you back out into the pool, not hard, but not gently either. You surface spluttering. The door is closed again. The sign is still there.', hurtLead(0.05), room(`${HD}-s1-door`))),
      ch('"Leave."', out('You leave the door and the waterfall behind you. The roar fades.')),
    ]),
  scene(`${HD}-s1-door`, 'The Hidden Dojo: The Door Again', { room: true, effect: 'none' },
    'You climb out of the pool, dripping. The door is still there behind the falling water, and so is the sign: KNOCK ONLY IF YOU MEAN IT.',
    [knock(), ch('"Leave."', out('You wring out your sleeves and walk away. The Poliwrath watches you go from somewhere behind the water.'))]),
  // TODO(engine): a battle won only by bringing her ace to 1 HP and then not attacking for one turn. Nearest build: a hard friendly battle,
  // then the last turn is its own scene (Attack or Wait).
  scene(`${HD}-s2`, 'The Hidden Dojo: The Master Tests You', { requires: [flagAgo(`${HD}-s1`, 1), not(`${HD}-s2`)], callback: true },
    'The dojo behind the waterfall, a region later. The hall is lit by one lamp. A small grey-haired woman in a faded gi sits on the floor with her Poliwrath beside her. She was a Fighting-type Gym Leader once, Master Ofelia, and she still sits like one. ' +
    'Ofelia: "Don\'t hit me. Show me you could, and don\'t." She stands. Her Poliwrath stands with her.',
    [
      ch('"Show her."', fight('Ofelia bows and her Poliwrath steps onto the floor. You fight it to the very edge: the point where one more hit would end it.',
        spar('Master Ofelia', { team: ['poliwrath'], size: 1, lv: 2, win: [room(`${HD}-s2-last-turn`)], lose: [moment('Master Ofelia\'s Poliwrath was too much, this time'), again(`${HD}-s2`)] }))),
    ]),
  scene(`${HD}-s2-last-turn`, 'The Hidden Dojo: The Last Turn', { room: true },
    'Her Poliwrath sways on its feet, one hit from falling, breathing hard. Your Pokémon is ready. Everything in you says finish it. Ofelia watches you, not the battle.',
    [
      ch('"Attack."', out('Your Pokémon strikes and the Poliwrath goes down. Ofelia laughs, short and kind. Ofelia: "No." You win the battle. You lose the lesson. She shows you to the door.', moment('You won Master Ofelia\'s battle and lost her lesson'))),
      ch('"Wait."', out('You hold. One turn, nothing, the hall silent but for the water. Ofelia\'s Poliwrath lowers its fists. Then Ofelia bows to you, deeply, the way a master bows to a student.', flagAt(`${HD}-s2`), moment('You waited, and Master Ofelia bowed'))),
    ]),
  // TODO(engine): the move Still Water Palm (Fighting, 70 power; +1 priority if the user did not attack last turn) does not exist yet.
  // Nearest honest build: Mach Punch (a Fighting palm strike with priority), plus a flag for the real move.
  scene(`${HD}-s3`, 'The Hidden Dojo: The Technique', { requires: [flagAgo(`${HD}-s2`, 1), not(`${HD}-s3-done`)], callback: true },
    'The dojo again, a region later. Ofelia has two cups of tea poured before you sit down. She sips hers, and sets it aside. Ofelia: "Then here. The only thing I know that nobody else does." She raises one open palm, slowly, and the water outside seems to go quiet.',
    [
      ch('"Teach my lead."', out('She works with your lead until dusk: stillness first, then the palm, fast as water dropping. It learns the first shape of her Still Water Palm, a palm strike that lands before the enemy moves.', { kind: 'teachMove', move: 'mach-punch' }, flag(`${HD}-palm-lead`), flag(`${HD}-s3-done`))),
      ch('"Teach my weakest."', out('Ofelia nods as if that was the right answer. She takes your smallest Pokémon onto the mat and works with it until dusk, patient as stone. It comes back taller somehow, a level stronger, with the first shape of the Still Water Palm in its paws.', lv(1, 'weakest'), flag(`${HD}-palm-weakest`), flag(`${HD}-s3-done`))),
      ch('"Teach me."', out('Ofelia looks at you over her tea for a long moment. Ofelia: "You already learned it. You waited." She takes a Black Belt from a hook on the wall, old and soft with years, and ties it round your wrist.', item('black-belt'), flag(`${HD}-s3-done`))),
    ]),
];

// ---------- B16. A Play About That Night ----------
const curtain: Json = scene('rk-final-curtain', 'A Play About That Night', {
  remembers: [variant('evil-beaten', [{ kind: 'evil', ends: ['defeated'] }], {
    notice: 'The programme has a new page stapled in. The play has a new last scene: a young trainer, very like you, walking into the evil team\'s hideout alone. The audience cheers. The Leader in the back row turns and looks straight at you.',
  })],
},
  'A small theatre down a side street, red seats, a stage no bigger than a living room. Tonight they are putting on a play about a Gym Leader who was there the night the region\'s evil team first struck. The actor in the Leader\'s cape gets every detail right: the walk, the way of standing with one hand on a Poké Ball, the catch in the voice. ' +
  'In the back row, alone, hood up, sits the real Leader, older now, watching. You end up in the seat beside them. Leader, whispering: "He\'s better at me than I am."',
  [
    ch('"Ask why they came."', out('The Leader keeps their eyes on the stage. Leader: "To see if they got the ending right. They didn\'t. I didn\'t save everyone." They say it plainly, like something they have said to themselves every night for years.', flag('curtain-asked'))),
    ch('"Watch the play with them."', out('You watch it together in the dark. The curtain falls on the version where they did save everyone, every last one, and the audience stands. The Leader cries quietly under the hood. Leader: "That\'s how I\'d have liked it."', flag('curtain-watched'), moment('You watched the play about that night beside the Leader it was about', 70))),
    ch('"Tell the actor."', out('You find the actor backstage, still in the cape. He is mortified, then thrilled, then mortified again. At the bow he runs into the aisle and pulls the real Leader up onto the stage, hood and all, and the whole theatre stands for them.', flag('curtain-bow'), moment('The real Leader took a bow on stage, because of you', 70))),
  ]);

export const EVENTS: Json[] = [frame, ...burgh, ...candice, ...elesa, ...lenora, ...lenoraRooms, ...misty, ...roark, ...roarkRooms, ...poppy, poppyRoom, ...kahili, ...iono, ...larry, ...mustard, fanClub, brant, pinStall, ...pinTrays, brantPin, ...dojo, curtain];
export const REMOVE: string[] = [];

/** Where each event is scripted. */
const B: Record<string, string> = { burgh: 'B1 Burgh', candice: 'B2 Candice', elesa: 'B3 Elesa', lenora: 'B4 Lenora', misty: 'B5 Misty', roark: 'B6 Roark', poppy: 'B7 Poppy', kahili: 'B8 Kahili', iono: 'B9 Iono', larry: 'B10 Larry', mustard: 'B11 Mustard' };
export const DOC: Record<string, string> = {
  'face-leader-day-off': 'SF8 B Day Off frame (GL1)',
  ...Object.fromEntries(LEADERS.map((k) => [`face-leader-day-off-${k}`, `SF8 ${B[k]} (opened by the Day Off frame)`])),
  'burgh-painting': 'SF8 B1 Burgh', 'candice-snowball': 'SF8 B2 Candice', 'elesa-photoshoot': 'SF8 B3 Elesa',
  'lenora-museum': 'SF8 B4 Lenora', 'lenora-museum-tour': 'SF8 B4 Lenora (Tour)', 'lenora-museum-fence': 'SF8 B4 Lenora (Find, node 1)', 'lenora-museum-grunt': 'SF8 B4 Lenora (Find, node 2)', 'lenora-museum-dog': 'SF8 B4 Lenora (Find, node 3)', 'lenora-museum-returned': 'SF8 B4 Lenora (Board: found in a region)',
  'misty-swim': 'SF8 B5 Misty', 'roark-mine': 'SF8 B6 Roark', 'roark-mine-byron': 'SF8 B6 Roark (Get him, node 1)', 'roark-mine-together': 'SF8 B6 Roark (Get him, node 2)', 'roark-mine-letter': 'SF8 B6 Roark (Write: the reply)',
  'poppy-steel': 'SF8 B7 Poppy', 'poppy-steel-again': 'SF8 B7 Poppy (Play)', 'kahili-golf': 'SF8 B8 Kahili', 'iono-stream': 'SF8 B9 Iono', 'larry-lunch': 'SF8 B10 Larry', 'mustard-dojo': 'SF8 B11 Mustard',
  'face-leader-fan-club': 'SF8 B12 Fan Club', 'retired-leader-spar': 'SF8 B13 Retired Leader', 'gym-merch-stall': 'SF8 B13 Pin Stall', 'gym-merch-stall-brant': 'SF8 B13 Pin Stall (Whose, brant.story)',
  ...Object.fromEntries(PIN_TRAYS.map((_, i) => [`gym-merch-stall-tray-${i + 1}`, 'SF8 B13 Pin Stall (Buy)'])),
  'ovc-hidden-dojo-s1': 'SF8 B15 Behind the Waterfall', 'ovc-hidden-dojo-s1-door': 'SF8 B15 Behind the Waterfall (Walk in)', 'ovc-hidden-dojo-s2': 'SF8 B15 The Master Tests You', 'ovc-hidden-dojo-s2-last-turn': 'SF8 B15 The Master Tests You (last turn)', 'ovc-hidden-dojo-s3': 'SF8 B15 The Technique',
  'rk-final-curtain': 'SF8 B16 A Play About That Night',
};

/** Flags nothing in this file reads: where the doc says they come back (merged into src/data/catalogOverhaul/flags/people.json). */
export const AFTERSTORY: { match: string; readBy: string }[] = [
  { match: 'dayoff-[a-z]+-helped', readBy: 'Needs engine: that Leader\'s Gym battle or exhibition in a later region opens with thanks, and their ace leaves its counter slot empty (SF8 Day Off frame Payoff; GL1 Remembers)' },
  { match: 'dayoff-(met|misty)', readBy: 'GL9 Remembers "if the player completed any Leader\'s Day Off" (people-leaders-2); dayoff-misty is the Day Off frame flag dayoff.<leader>' },
  { match: 'dayoff-(elesa-teacher|iono-rest|poppy-sad|lenora-toured)', readBy: 'No reader named in the doc (SF8 B3, B9, B7, B4 flags); kept for the Leader\'s later Gym battle or exhibition' },
  { match: 'dayoff-larry-owed-rice-ball', readBy: 'New item: the rice ball (out of battle, +10% HP), owed until it exists (SF8 B10 reward)' },
  { match: 'fanclub-film', readBy: 'Needs engine: mention the film in the Gym battle and the Leader\'s first move is slower (SF8 B12 Film)' },
  { match: 'brant-(spar|lesson)', readBy: 'No reader named in the doc (SF8 B13 brant.spar, brant.lesson)' },
  { match: 'curtain-(asked|watched|bow)', readBy: 'No reader named in the doc (SF8 B16 flags)' },
  { match: 'ovc-hidden-dojo-(palm-lead|palm-weakest)', readBy: 'Needs engine: the move Still Water Palm, owed to that Pokémon (SF8 B15 The Technique)' },
];
