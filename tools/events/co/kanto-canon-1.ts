// Kanto Canon Spaces, KANTO_PLACED_1.md: Viridian City, Pewter City, Cerulean City, Vermilion City.
// Every scripted line of the doc is kept word for word; the prose around the lines is expanded.
import type { Json } from '../dsl.ts';
import { EXTRA, SPACES, retired, followup, later, intel, kind, afford, battle, buy, c, cash, flag, foe, fr, has, heal, heat, is, item, join, kc, moment, not, o, relic, space, teach, temp, wild } from './_kc.ts';

export const CATEGORY = 'kanto-canon';
export const EVENTS: Json[] = [];
const E = EVENTS;
const DOC = 'KANTO_PLACED_1';

// ============================================================ VIRIDIAN CITY (Interlude 0, and Stage 8)

// ---------- The Old Man's Lesson
{
  const s = space(E, { id: 'cs.kanto.viridian.oldman', town: 'viridian', name: "The Old Man's Lesson", kind: 'CUT', appears: 'always', flags: ['kanto.weedle.seed'], section: `${DOC}: The Old Man's Lesson`,
    placed: { stage: [1], home: 1, sits: 'must', attaches: 'before', badge: 'A coffee cup', level: -2, often: 'Once per run' } });
  const CHARM = temp('Catching Charm: the first Poké Ball you throw is 25% better', [{ kind: 'captureMultiplier', value: 1.25 }], 1, 'wild');
  const kit = [item('poke-ball', 5), CHARM];
  const weedle = [join(['weedle'], { levelBonus: -2 }), flag('kanto-weedle-seed')];
  const COFFEE = 'He hasn\'t had it. You can tell, because the hat comes off and the eyes under it are the eyes of a man who has been asked one question too many before breakfast. The Old Man: "Fine. FINE. We\'ll do it the long way." He lets his Weedle back out. It rears up on the warm road with its horn lowered, and it looks at your lead the way he looks at mornings.';
  const coffeeFight = battle(COFFEE, wild(['weedle'], { levelBonus: -2, win: [...weedle, moment('Beat the Old Man\'s Weedle before he had his coffee, and kept it.')] }), ...kit);
  const tryIt = c('Let me try.', o('The Weedle\'s let out for you. It sits in the road and waits, patient as a stone, as though it has done this for a hundred nervous beginners and expects to do it for a hundred more. You hold the Ball the way he held it. Wrist, not arm. It leaves your hand, it closes, it rocks once and goes still. A guaranteed catch, and it still makes your heart jump. The Old Man doesn\'t open his eyes. He holds out five Poké Balls and a little charm on a string, and he is already most of the way back to sleep.', ...weedle, ...kit, moment('Learned to throw from the Old Man in Viridian City.')),
    { chance: 0.8, fail: coffeeFight });
  const coffee = c('Have you had your coffee?', coffeeFight);
  s.entry("The Old Man's Lesson",
    'An old man is lying across the road outside the Poké Mart, half asleep, with his hat over his face. You go to step around him and the hat speaks. The Old Man: "Mmf. No. Don\'t step over me. I\'m a landmark." His granddaughter, from the doorway: "He hasn\'t had his coffee. Give him a minute. Give him several." He sits up, slowly, the way an old house settles. The Old Man: "You\'ve got Balls and no idea. I can tell from here. Watch. I\'ll do it once." A Weedle crosses the road. He throws without standing up. The Old Man: "There. Wrist, not arm. Now you."',
    [
      c('Show me again.', o('He does. It\'s exactly the same throw: the same lazy turn of the wrist, the same small click, the same Weedle caught and let out again looking faintly put upon. You watch for the trick and there isn\'t one. The Old Man: "That\'s the point. It\'s always the same throw." He lies back down across the road and waits for you to be ready.', s.open('again'))),
      tryIt, coffee,
    ], { scene: { pokemon: 'weedle' } });
  s.room('again', "The Old Man's Lesson", 'The Weedle has wandered back to the middle of the road. The old man has one eye open under the brim of his hat, and it is on your hands.', [tryIt, coffee], { scene: { pokemon: 'weedle' } });
  // Remembers, at Stage 8 (the return): he is in the same place; and the Trainer School's class, a year on.
  s.room('return', 'Viridian City, a Year On',
    'You come back into Viridian the long way round, eight Badges heavier, and the road outside the Poké Mart has not changed at all. He\'s in the same place. Same hat. Same road. The Old Man: "You again. You\'ve got the wrist now. I can tell from here." He doesn\'t sit up to say it. From the doorway his granddaughter lifts a coffee cup at you, and you understand that it is his, and that it is still full.',
    [c('Tip your cap to the landmark.', o('You step around him, carefully, the way you would step around anything that has stood in one place long enough to be part of the town. Behind you he mutters something about wrists. It sounds, very nearly, like pride.', fr(1, 'lead')))],
    { room: false, canon: 'cs.kanto.viridian.oldman', stop: 'event', remembers: [
      { id: 'school-wrong', when: [is('kanto-school-done'), is('kanto-school-wrong')], notice: 'Through the Trainer School window you can see the same class, a year on. One child has a Pidgey on the desk now. The child spots you and shouts through the glass: "You got the Rock one wrong. I remember."' },
      { id: 'school', when: [is('kanto-school-done')], notice: 'Through the Trainer School window you can see the same class, a year on. One child has a Pidgey on the desk now. Miss Whitlock taps the glass and points you out to all of them: a real one.' },
    ] });
}

// ---------- Route 22: The Rival
{
  const s = space(E, { id: 'cs.kanto.viridian.route22', town: 'viridian', name: 'Route 22: The Rival', kind: 'MC', appears: 'always', flags: ['kanto.route22.first', 'kanto.route22.final'], section: `${DOC}: Route 22: The Rival`,
    placed: { stage: [1, 8], home: 3, window: [2, 4], sits: 'must', attaches: 'instead', badge: "The rival's face", level: 2, often: 'Twice per Kanto (Stage 8: Step 18, must-see)' } });
  // The first Rival Rescue Plan entry is written by the rival mark whether the player wins or loses; the mark is the Rival Token.
  const first = (text: string) => battle(text, foe('Rival', { rival: true, size: 2, levelBonus: 2 }), flag('kanto-route22-first'), { kind: 'rivalChange', feelings: { rivalry: 1 }, lead: 0, mark: 'route22-token' });
  s.entry('Route 22: The Rival',
    'The road west ends at a gate with a guard. Someone\'s leaning on the gate, arguing with him, with the tired patience of a person who has been arguing for some time. Gate guard: "Badges. All of them. Come back when the whole region\'s heard of you." Rival: "I told him the whole region will have. He wants it in writing." The rival turns round, and sees you. Something lights behind their eyes that has nothing to do with the gate. Rival: "Oh, good. Someone I can prove it on."',
    [
      c('Battle.', first('You don\'t answer. You reach for a Poké Ball, and that is answer enough. The guard sighs and takes one step back from his own gate, like a man who has seen this road used for this before.')),
      c("The gate's shut for you too, then.", first('For a second you can\'t tell whether the rival will laugh. Then the corner of their mouth gives them away, and they hide it behind a Poké Ball. "Shut for now," they say. "Watch how fast that changes." And then there is no more talking.')),
      c("I'll catch you up.", first('It isn\'t a way out. The rival is already standing in the middle of the road, and the road is not wide. Rival: "No. Now." They say it almost gently. They have waited all the way from home for this, and they are not going to wait for the far side of a gate.')),
    ]);
  const final = (text: string) => battle(text, foe('Rival', { rival: true, size: 4, levelBonus: 2 }), flag('kanto-route22-final'), { kind: 'rivalChange', feelings: { respect: 1 }, lead: 0 });
  s.room('return', 'Route 22: The Final Rematch',
    'The same gate. The same guard, a little greyer, counting the Badges on your jacket with one finger in the air. Gate guard: "Eight. Well, well. Go on through. ...After that one\'s finished with you." Someone is leaning on the gate, exactly where they leaned a region ago. Rival: "Same gate. I was here first. Again." They say it lightly, but they have walked every road you walked to be able to say it, and you both know what this is. The last one in Kanto.',
    [c('Battle.', o('Neither of you reaches for a Ball yet. There is one more thing to settle first, and it is everything that happened between this gate and this gate.', s.open('ahead')))],
    { room: false, canon: 'cs.kanto.viridian.route22', stop: 'event', remembers: [
      { id: 'threw', when: [{ kind: 'flag', key: 'x-rival-threw-match', atLeast: 1, atMost: 99 }], notice: 'Before the first move, the rival says it out loud, so the guard can hear: "You threw one for me, back there. Don\'t you dare do it here. I want this one to be real."' },
      { id: 'swapped', when: [{ kind: 'flag', key: 'x-rival-swapped-teams', atLeast: 1, atMost: 99 }], notice: 'Before the first move, the rival says it: "I carried your team for a day. I know how every one of them breathes. That cuts both ways, so don\'t think it helps you."' },
    ] });
  // The final rematch's lines are drawn from the whole region: who's ahead; what happened at the bridge, on the ship, in the Labyrinth.
  s.room('ahead', 'Route 22: The Final Rematch', 'The rival counts it off on their fingers, the whole region, town by town: who got there first, who was a day behind, who is ahead now. By their count it comes out very nearly even, and that is the one answer neither of you can stand.',
    [c('Begin.', final('Neither of you talks about who is ahead. It is written all over both of you: every town, every loss, every night camped a day behind the other. The guard opens the gate and stands well clear of it. The first Ball is in the air before the latch has stopped ringing.'))],
    { remembers: [
      { id: 'labyrinth', when: [is('kanto-sabrina-labyrinth-done')], notice: 'Rival: "And the Labyrinth. I heard you went in with nothing and came out with a ghost for a friend. I stood outside that door for an hour. I never went in."' },
      { id: 'ship', when: [is('kanto-ssanne-done')], notice: 'Rival: "And the ship. I was on that ship. I saw you on the deck when it went wrong, and I saw what you did. I\'ve been trying to be that fast ever since."' },
      { id: 'bridge', when: [is('kanto-bridge-fell')], notice: 'Rival: "And the bridge. I heard you went down with it and walked out the other side with a village behind you. I was two days back, and I ran the whole way."' },
    ] });
}

// ---------- Viridian Mart: The Parcel
{
  const s = space(E, { id: 'cs.kanto.viridian.parcel', town: 'viridian', name: 'Viridian Mart: The Parcel', kind: 'EV', appears: 'roll', flags: ['kanto.parcel.upgrade', 'kanto.parcel.lost'], section: `${DOC}: Viridian Mart: The Parcel`,
    placed: { stage: [1], home: 2, sits: 'town', attaches: 'town', badge: 'A parcel', level: -1, often: 'Once per run (delivery: the stage\'s first + node)' } });
  const UPGRADE = [item('devon-scope'), flag('kanto-parcel-upgrade'), moment('Delivered the professor\'s parcel and got his old Pokédex Upgrade.')];
  const NURSE = 'Nurse: "For the professor? Finally. He\'s rung four times. Here: he said whoever brought it could have the old one." She slides a scuffed Pokédex Upgrade across the counter. It has somebody\'s initials scratched into the back, and it has plainly been loved. The next five wild Pokémon you meet will show you their Ability.';
  const take = c("I'll take it.", o('The parcel is lighter than it looks and warmer than it should be. The clerk watches it go the way you watch a guest leave who has stayed a week. "Center\'s up the road. You can\'t miss it. He will have forgotten he ordered it. Tell him it came anyway."', s.open('road')));
  const no = c('Not going that way.', o('"Nobody ever is," says the clerk, without any bitterness at all, and puts the parcel back on top of the stack, where it goes on ticking quietly to itself.'));
  s.entry('Viridian Mart: The Parcel',
    'The Mart\'s clerk waves from behind a stack of boxes. Clerk: "You\'re heading up the road? Take this to the Center. It\'s for the professor. It\'s been here a week. He forgets he orders things." A parcel, tied with string, labelled in a hurry. The handwriting leans as if it were running for a train.',
    [take, c("What's in it?", o('The clerk turns the parcel over once and sets it down a little further away from himself. Clerk: "Don\'t know. It ticks. I\'ve decided not to wonder."', s.open('ask'))), no]);
  s.room('ask', 'Viridian Mart: The Parcel', 'The parcel sits on the counter between you, tied with string, labelled in a hurry. It ticks. The clerk has decided not to wonder, and is waiting to see what you decide.', [take, no]);
  s.room('road', 'The Parcel: On the Way', 'The road to the Center runs through long grass, and the parcel ticks against your ribs with every step. Something in the grass is keeping pace with you. It is small, and it is interested.',
    [c('Carry it to the Center.', o(`You hold the parcel a little tighter and nothing comes of it. ${NURSE}`, ...UPGRADE),
      { chance: 0.75, fail: o('A Rattata or a Meowth, you never get a clear look at which, comes out of the grass in one grey streak. It takes the parcel by the string and runs. The ticking goes with it, getting fainter.', s.open('thief')) })]);
  s.room('thief', 'The Parcel: The Thief', 'The thief stops at the edge of the trees to get a better grip on the string. It looks back at you over the parcel. It is deciding whether you are the sort of person who chases.',
    [
      c('Chase it.', battle('You run. It runs. It is faster than you and much less burdened by conscience, but the parcel is nearly as big as it is, and at the first fence it has to turn and fight.',
        wild(['rattata', 'meowth'], { levelBonus: -1, win: [moment('Chased down the parcel thief on the road out of Viridian.'), s.open('deliver')] }))),
      c('Let it go.', o('You let it go. The grass closes behind it. Somewhere in there a parcel is ticking for nobody, and a professor is about to ring the Center for the fifth time. You tell yourself it was only a parcel. It was tied with string by someone in a hurry.', flag('kanto-parcel-lost'))),
    ], { scene: { pokemon: 'meowth' } });
  // After a chase the parcel is a little chewed.
  s.room('deliver', 'The Parcel: Delivery', 'You have the parcel back. The parcel\'s a little chewed: one corner is soft, and the string has tooth marks in it. It is still ticking. The Center\'s doors are just ahead.',
    [c('Hand it over the counter.', o(`${NURSE} She turns the chewed corner toward the wall, so the professor won't see it.`, ...UPGRADE))]);
  // Remembers: stolen and not chased: found two stages on (Kanto Stage 3), in a Meowth's nest, unopened, still ticking.
  s.room('nest', 'The Parcel: Still Ticking',
    'Two stages on, in the roots of a harbor-road tree, there is a Meowth\'s nest made of string, bottle caps and one lost glove. In the middle of it, unopened, sits a parcel labelled in a hurry. You crouch. It\'s still ticking. The Meowth is not home. The string has been chewed, thoughtfully, and then left alone, as if even a thief decided not to wonder.',
    [
      c('Take it to the next Center.', o(`You carry it the rest of the way, a whole region late. ${NURSE} "A little chewed," the nurse adds, turning it in her hands. "He won't notice. He'll be so pleased it came."`, ...UPGRADE, flag('kanto-parcel-found'))),
      c('Leave it in the nest.', o('You leave it where it is. Some things have found their place. Behind you, in a nest of string, a professor\'s parcel goes on ticking for a Meowth who never opened it.', flag('kanto-parcel-found'))),
    ], later({ requires: [is('kanto-parcel-lost'), not('kanto-parcel-found')], scene: { pokemon: 'meowth' } }));
  followup(s.id('nest'), [3]);
}

// ---------- Viridian Trainer School
{
  const s = space(E, { id: 'cs.kanto.viridian.school', town: 'viridian', name: 'Viridian Trainer School', kind: 'EV', appears: 'roll', flags: ['kanto.school.done'], section: `${DOC}: Viridian Trainer School`,
    placed: { stage: [1, 8], home: 2, sits: 'town', attaches: 'town', badge: 'A chalkboard', level: null, often: 'Once per run' } });
  // A bank of twelve; three are asked (one from each set of four). Each right answer: +1 to a stat (three at most). No penalty.
  const BANK: [string, [string, string, string], number][] = [
    ['"Water against Rock?"', ['Strong', 'Weak', 'No effect'], 0],
    ['"Fire against Grass?"', ['Weak', 'Strong', 'No effect'], 1],
    ['"Electric against Ground?"', ['Strong', 'Weak', 'No effect'], 2],
    ['"Grass against Water?"', ['Strong', 'Weak', 'No effect'], 0],
    ['"What can\'t Ground touch?"', ['Flying', 'Water', 'Grass'], 0],
    ['"What can\'t Electric touch?"', ['Water', 'Ground', 'Flying'], 1],
    ['"What can\'t Poison touch?"', ['Grass', 'Fairy', 'Steel'], 2],
    ['"What can\'t Fighting touch?"', ['Rock', 'Ghost', 'Normal'], 1],
    ['"Name one thing Normal can\'t hit."', ['Ghost', 'Rock', 'Steel'], 0],
    ['"Name one thing Psychic can\'t hit."', ['Fighting', 'Dark', 'Poison'], 1],
    ['"Name one thing Dragon can\'t hit."', ['Steel', 'Ice', 'Fairy'], 2],
    ['"Name one thing Ghost can\'t hit."', ['Psychic', 'Normal', 'Dark'], 1],
  ];
  const q = (n: number) => `q${n + 1}`;
  const after = (n: number): Json[] => (n < 4 ? [s.openFrom(...[4, 5, 6, 7].map(q))] : n < 8 ? [s.openFrom(...[8, 9, 10, 11].map(q))] : [flag('kanto-school-done')]);
  const last = (n: number) => (n >= 8 ? ' Miss Whitlock claps her hands once. "There. Now do you see why it matters?" she asks the room, and for once six children do.' : '');
  BANK.forEach(([ask, answers, right], n) => {
    s.room(q(n), `Trainer School: Question ${n < 4 ? 'One' : n < 8 ? 'Two' : 'Three'}`,
      `Miss Whitlock writes it on the board in big round letters and underlines it twice. ${ask} Six children turn in their seats to watch you think. One of them is already mouthing the answer.`,
      answers.map((a, k) => c(`${a}.`, k === right
        ? o(`"Correct!" The chalk squeaks a tick beside your name. Six children look at you as though you had done something much harder than that, and the Pokémon you pick stands a little taller for it: +1 to a stat.${last(n)}`, kc('statUp', { stat: 'random' }), ...after(n))
        : o(`Miss Whitlock is kind about it. She only tilts her head. A child, from the back row: "I knew that one." There is no penalty, except the look on that child's face.${last(n)}`, flag('kanto-school-wrong'), ...after(n)), k === right ? { pick: {} } : {})));
  });
  s.entry('Viridian Trainer School',
    'A classroom. Six children. A teacher mid-sentence, chalk still raised. Teacher, Miss Adaeze Whitlock: "And who can tell me— oh. A real one. Class, this is a trainer. Don\'t crowd. You\'ll take the quiz, won\'t you? They never believe me that it matters." Six small faces turn to you. You have never been anybody\'s proof of anything before.',
    [
      c('Take the quiz.', o('You sit at a desk built for someone half your size. Your knees don\'t fit under it. Nobody laughs; they are all far too interested in whether you are any good.', s.openFrom(...[0, 1, 2, 3].map(q)))),
      c('Not today.', o('Miss Whitlock\'s shoulders drop a quarter of an inch. "No. Of course. You\'re busy. They\'re always busy," she says, and goes back to the board. Six children watch you all the way to the door.')),
    ]);
}

// ---------- Diglett's Cave (Pseudo Stage: three nodes)
{
  const s = space(E, { id: 'cs.kanto.viridian.diglett', town: 'viridian', name: "Diglett's Cave", kind: 'PS', appears: 'roll', length: 3, flags: ['kanto.diglett.waited'], section: `${DOC}: Diglett's Cave`,
    placed: { stage: [1], home: 3, window: [2, 5], sits: 'door', attaches: 'instead', badge: 'A molehill', level: -1, often: 'Once per run' },
    ps: { name: "Diglett's Cave", themeId: 'normal-ground', mood: 'a hundred small throats clearing' } });
  const DIG = ['diglett', 'diglett-alola', 'diglett-delta'];
  s.entry("Diglett's Cave", 'A hole in a bank, the width of a door. From inside, a sound like a hundred small things clearing their throats. The earth around the hole is fresh and soft, turned over again and again by something that never gets tired of coming up to look.',
    [
      c('Go in.', o('You duck under the lip of the bank. The daylight shrinks to a coin behind you, and the throat-clearing stops, all at once, the way a room goes quiet when a stranger walks in.', s.open('n1'))),
      c('Leave it.', o('You leave the hole to its hundred small voices. As you walk away, one brown head comes up to watch you go, and then, embarrassed, goes down again.')),
    ], { pseudo: true, scene: { pokemon: 'diglett' } });
  const swarm = (text: string, next: Json[]) => battle(text, wild(DIG, { levelBonus: -1, chain: 3, win: next }));
  s.room('n1', "Diglett's Cave: The Pop-Ups", 'A row of holes down the middle of the tunnel, neat as buttons. Diglett come up one at a time, look at you, and go down. Some are brown. One is steel-whiskered, far from home. One is a colour you have no name for. None of them seems angry. They only come up to look.',
    [c('Step up to the row of holes.', swarm('The first one pops up under your boot. Each is a short fight, one after another, a swarm taking turns.', [s.open('n2')]),
      { chance: 0.8, fail: swarm('The first one pops up under your boot. Each is a short fight, one after another. When the last of them drops out of sight, the wall beside you sighs and falls in: a side tunnel, warm and dry, that smells of sand.', [s.open('den')]) })],
    { scene: { pokemon: 'diglett' } });
  s.room('den', "Diglett's Cave: The Sandshrew Den", 'The side tunnel opens into a round, swept little room. A Sandshrew den. Something is curled up in the middle of it like a dropped ball, and one bright eye is watching you over its own tail.',
    [
      c('Step into the den.', battle('It uncurls all at once, claws out, between you and whatever it keeps in the dark behind it.', wild(['sandshrew', 'sandshrew-alola'], { levelBonus: -1, win: [s.open('n2')] }))),
      c('Back out quietly.', o('You back out the way you came, slowly, hands where it can see them. The eye closes. The tunnel goes on.', s.open('n2'))),
    ], { scene: { pokemon: 'sandshrew' } });
  s.room('n2', "Diglett's Cave: The Long Dark", 'More of the same, faster. They come up two and three at a time now, and the tunnel is too long to see the end of. A lamp bobs toward you from the other direction: a hiker, going the other way, in no hurry at all. Hiker Garrick: "They only come up to look. If you stop hitting them, they stop coming."',
    [
      c('Fight through them.', swarm('You don\'t have time to stand about in the dark. They come up, and you knock them down, and more come up. Garrick shakes his head and walks on with his lamp.', [s.open('n3')])),
      c('Wait, and stop hitting them.', battle('You hold still. It is harder than fighting. A head comes up, looks at you, and waits to be hit. You don\'t hit it. It\'s true: wait three turns, and they stop coming.',
        wild(DIG, { levelBonus: -1, rule: { surviveTurns: 3 }, win: [flag('kanto-diglett-waited'), s.open('n3w')] }))),
    ], { scene: { pokemon: 'diglett' } });
  const SAND = [item('soft-sand'), moment("Walked the length of Diglett's Cave.")];
  const follow = (text: string) => c('Take the Soft Sand and walk out.', o(`${text} You come out blinking into the daylight on the far side of the hill.`, ...SAND),
    { chance: 0.95, fail: o(`${text} You are almost out when the ground behind you rises. A Dugtrio, three heads, one opinion. It follows you out into the daylight, and when you stop, it stops, and looks up, and waits. It knows Tri Attack, and it has decided to come.`, ...SAND, join(['dugtrio'], { ability: 'sand-veil', moves: ['tri-attack'] })) });
  s.room('n3', "Diglett's Cave: The Triple", 'The tunnel ends in a wide round chamber, and the floor of it is moving. Three heads rise out of the earth together, shoulder to shoulder, and none of them blinks. A Dugtrio. It has heard everything you did on the way in.',
    [c('Duel it.', battle('Three heads go down as one, and the whole floor comes at you.', wild(['dugtrio'], { levelBonus: 0, win: [s.open('out')] })))], { scene: { pokemon: 'dugtrio' } });
  s.room('out', "Diglett's Cave: The Far Side", 'The Dugtrio sinks back into the floor it came from. Where it stood there is a small heap of sand, finer and paler than the rest, soft as flour.',
    [follow('You fill your pocket with it.')], { scene: { pokemon: 'dugtrio' } });
  // Remembers: waited at node 2: the Dugtrio comes up, looks, and goes down again. No duel. The Soft Sand's left on the path.
  s.room('n3w', "Diglett's Cave: The Triple", 'The tunnel ends in a wide round chamber. Three heads rise out of the earth together, shoulder to shoulder. A Dugtrio. It comes up. It looks at you, for a long moment, with all six eyes. And it goes down again. No duel. Where it was, a little heap of Soft Sand has been left on the path, the way you leave something out for a guest.',
    [follow('You pick it up with both hands.')], { scene: { pokemon: 'dugtrio' } });
}

// ============================================================ PEWTER CITY (Stage 1)

// ---------- Brock's Rest Stop
{
  const s = space(E, { id: 'cs.kanto.pewter.rest', town: 'pewter', name: "Brock's Rest Stop", kind: 'EV', appears: 'roll', flags: ['kanto.stew.perfect'], section: `${DOC}: Brock's Rest Stop`,
    placed: { stage: [1], home: 10, window: [8, 13], sits: 'plus', attaches: 'plus', badge: 'A cooking pot', level: null, often: 'Once per run' } });
  const BURNT = 'He looks at the pot. The children look at him. Nine identical faces, waiting. Brock: "...We\'re having toast." Nothing can be saved. The toast, at least, is very good toast, and he makes sure you get the first slice.';
  const weak = (lead: string) => o(`${lead} It\'s a weak stew, thin where it should be rich, and Brock knows it before the spoon reaches his mouth. It still warms every one of your Pokémon through. He ladles it out anyway, into every bowl, yours first.`, heal(0.15));
  const perfect = (lead: string) => o(`${lead} He tastes it, and his eyes, which were shut, stay shut, but his whole face changes. Perfect. He fills a flask for you and wraps it in a cloth. "Before a big one," he says. "At camp. Not in the middle of it. Decide what they need, and tell them over supper."`, s.open('stew'));
  // 50% perfect, 40% weak, 10% burnt (65 / 30 / 5 if the player helped): two rolls, the second in the room `pot`.
  const serve = (label: string, lead: string, helped: boolean) => c(label, perfect(lead), { chance: helped ? 0.65 : 0.5, fail: o(`${lead} The pot gives one slow, thoughtful bubble, and Brock goes very still.`, s.open(helped ? 'pot-h' : 'pot')) });
  s.entry("Brock's Rest Stop",
    'A camp by the road. A pot the size of a bathtub. A man stirring it with his eyes shut, tasting, frowning, adding something. Brock: "You look like you\'ve been living on Berries. Sit. It\'s nearly ready. It\'s been nearly ready for an hour; that\'s how you know it\'s good." Nine small children, all with his face, are setting out bowls. One of them sets a bowl out for you without being asked.',
    [
      serve('Thank you.', 'You sit. Nobody has told you to sit in a long time. A bowl is put into your hands.', false),
      c('Can I help?', o('He hands you the spoon without opening his eyes, as if he had been holding it out for you all along. You stir. It is heavier than it looks, and it smells of every kitchen you have ever been homesick for.', s.open('helped'))),
      c("What's in it?", o('Brock: "Everything my brothers and sisters wouldn\'t eat separately." Nine children look pointedly at the sky.', s.open('asked'))),
    ], { remembers: [
      { id: 'baby', when: [{ kind: 'partyTag', tag: 'baby' }], notice: 'Before anyone else is served, he crouches down by the smallest member of your party and feeds it first, from a small spoon, blowing on every mouthful.' },
    ] });
  s.room('helped', "Brock's Rest Stop", 'You stir until your arm aches, and the nine children count the turns for you out loud. Brock leans over the pot and breathes in. "There," he says. "Now it\'s nearly ready."', [serve('Taste it together.', 'He hands you a second spoon.', true)]);
  s.room('asked', "Brock's Rest Stop", 'The pot bubbles. Whatever is in it, it smells like being looked after. A bowl is waiting with your name on it, or would be, if anyone here had asked your name before deciding to feed you.',
    [serve('Thank you.', 'You sit. A bowl is put into your hands.', false), c('Can I help?', o('He hands you the spoon without opening his eyes. You stir. The nine children count the turns for you out loud.', s.open('helped')))]);
  s.room('pot', "Brock's Rest Stop", 'Brock lifts the spoon, and everyone at the camp watches it travel to his mouth.', [c('Wait for the verdict.', weak('He chews. He considers.'), { chance: 0.8, fail: o(BURNT) })]);
  s.room('pot-h', "Brock's Rest Stop", 'Brock lifts the spoon, and everyone at the camp watches it travel to his mouth.', [c('Wait for the verdict.', weak('He chews. He considers.'), { chance: 0.857, fail: o(BURNT) })]);
  // Brock's Stew: eaten at camp before a boss, never in battle: +1 stage (x1.5) in the chosen stat for the next boss fight, and 15% healed.
  const stew = (label: string, stat: string, word: string) => c(label, o(`You tell them over supper. ${word} Brock\'s Stew goes into your pack, still warm, for the night before the next big fight.`,
    temp(`Brock's Stew: ${label.replace('.', '')} +1 stage in the next boss fight`, [{ kind: 'statMultiplier', stat, value: 1.5 }], 1, 'boss'), heal(0.15), flag('kanto-stew-perfect'), moment("Shared a perfect stew at Brock's camp.")));
  s.room('stew', "Brock's Stew", 'A flask of perfect stew, once per run. Eaten at camp before a boss, it starts every one of your Pokémon one stage up in a stat you choose, and heals each by 15%. It isn\'t for the middle of a battle. What do they need?',
    [stew('Attack.', 'atk', 'Hit hard, you tell them.'), stew('Defense.', 'def', 'Stand firm, you tell them.'), stew('Special.', 'spa', 'Burn bright, you tell them.'), stew('Speed.', 'spe', 'Be first, you tell them.')]);
}

// ---------- Pewter Museum of Science
{
  const s = space(E, { id: 'cs.kanto.pewter.museum', town: 'pewter', name: 'Pewter Museum of Science', kind: 'EV', appears: 'roll', flags: ['kanto.museum.registry', 'kanto.museum.amber'], section: `${DOC}: Pewter Museum of Science`,
    placed: { stage: [1], home: 15, window: [13, 17], sits: 'town', attaches: 'town', badge: 'A bone', level: null, often: 'Once per run' } });
  const FOSSILS = ['helix-fossil', 'dome-fossil', 'old-amber', 'root-fossil', 'claw-fossil', 'skull-fossil', 'armor-fossil', 'cover-fossil', 'plume-fossil', 'jaw-fossil', 'sail-fossil'];
  // Registering pays by rarity and gives the Fossil Registry badge; the fossil is kept and can still be revived.
  const register = c('Register it.', o('He takes your fossil in both hands, the way you would take a sleeping thing, and measures it, and draws it, and writes its name in a ledger older than he is. Then he gives it back. The museum pays you for the privilege, and pins a small bronze bone to your jacket: the Fossil Registry. Your fossil is still yours, and it can still be woken.', kc('museumRegister'), flag('kanto-museum-registry'), relic('fossil-registry', 'Fossil Registry', [{ kind: 'researchMultiplier', value: 1.1 }]), moment('Registered a fossil at the Pewter Museum of Science.'), s.open('amber')),
    { requires: [kc('holdsAny', { ids: FOSSILS }) as Json] });
  s.entry('Pewter Museum of Science',
    'A grey building with a Kabutops skeleton in the window. ₽50 at the door. Inside it is cool and smells of dust and floor polish. Curator, Dr. Lucius Blackwood: "Fossils on the left. Space on the right. The Old Amber\'s in the middle, and no, you can\'t touch it. Unless you can answer three questions. Then we\'ll talk."',
    [
      c('Pay the ₽50 and go in.', o('The coins ring in a brass dish. Dr. Blackwood looks you over as though you were an exhibit that had walked in by itself.', cash(-50), s.open('hall')), { requires: [afford(50)] }),
      c('Not today.', o('You look at the Kabutops through the window a while longer. It looks back with two holes where its eyes were. It has been waiting a very long time, and can wait for you too.')),
    ], { scene: { pokemon: 'kabutops' }, remembers: [
      { id: 'third-fossil', when: [{ kind: 'flag', key: 'kanto-moon-third-fossil', atLeast: 1, atMost: 99 }], notice: 'He sees the fossil you brought down from Mt. Moon before you have said a word. Dr. Blackwood: "That one? They called that worthless? Give me their names."' },
    ] });
  s.room('hall', 'Pewter Museum: The Fossil Hall', 'Fossils on the left. Space on the right. In the middle, under glass, a lump of amber the colour of old honey, with a shadow inside it that might be a wing. Dr. Blackwood is watching what you look at.',
    [
      register,
      // If the player holds none: he hands over a Fossil Fragment: half a fossil; a second fragment, from anywhere, completes it.
      c('I have no fossil.', o('He looks honestly sorry for you. He goes to a drawer, and comes back with half of something: a Fossil Fragment, broken clean down the middle long before either of you was born. "A second fragment, from anywhere, completes it. They turn up. Things want to be whole."', kc('fossilFragment'), s.open('amber')), { requires: [kc('holdsNone', { ids: FOSSILS }) as Json] }),
      c('Just looking.', o('You look. He lets you. It is a good museum for looking: nobody hurries you, and the bones don\'t mind.', s.open('amber'))),
    ]);
  // The Old Amber: three questions on fossils (which Pokémon; which era; which is the oldest). All three right: he trades it, for nothing.
  const QUIZ: [string, string, [string, string, string], number][] = [
    ['a1', 'He taps the glass over a coiled shell. Dr. Blackwood: "First. Which Pokémon wakes from the Helix Fossil?"', ['Kabuto', 'Omanyte', 'Aerodactyl'], 1],
    ['a2', 'He nods, once, and moves to a wall chart of stacked colours. Dr. Blackwood: "Second. Which era did they swim in? Careful. I wrote the label."', ['The age of ice', 'The age of ancient seas', 'The age of cities'], 1],
    ['a3', 'He stops in front of the amber and lowers his voice, as if it might hear. Dr. Blackwood: "Third. Of everything in this room: which is the oldest?"', ['The Kabutops in the window', 'The Old Amber', 'The Moon Stone on the right'], 1],
  ];
  const WRONG = 'Dr. Blackwood closes his eyes briefly. "No. Thank you for coming. The gift shop is on the right, past Space." The amber stays under its glass.';
  s.room('amber', 'Pewter Museum: The Old Amber', 'The Old Amber sits in the middle of the room, in a case of its own. You can\'t touch it. Unless you can answer three questions.',
    [c('Ask me the three questions.', o('He straightens his coat, as a man does before something that matters to him.', s.open('a1'))), c('Leave the museum.', o('You leave by the door you came in by. The Kabutops in the window watches you go.'))], { requires: [not('kanto-museum-amber')] });
  QUIZ.forEach(([id, ask, answers, right], n) => s.room(id, 'Pewter Museum: Three Questions', ask, answers.map((a, k) => c(`${a}.`, k !== right ? o(WRONG)
    : n < 2 ? o('"Hm," says Dr. Blackwood, which from him is applause.', s.open(QUIZ[n + 1]![0]))
      : o('For a moment he doesn\'t say anything. Then he takes a small key from his waistcoat and opens the case himself. Dr. Blackwood: "Take it. I\'ve had it nine years and I\'ve never dared wake it. You look like you\'d dare." It is warm from the lamp, and lighter than it should be, and something inside it has been waiting longer than there have been museums.', item('old-amber'), flag('kanto-museum-amber'), moment('Was given the Old Amber by Dr. Blackwood, for nothing.'))))));
}

// ---------- Pewter Skies: The Flock
{
  const s = space(E, { id: 'cs.kanto.pewter.flock', town: 'pewter', name: 'Pewter Skies: The Flock', kind: 'EV', appears: 'roll', flags: ['kanto.flock.seen'], section: `${DOC}: Pewter Skies: The Flock`,
    placed: { stage: [1], home: 7, window: [5, 9], sits: 'optional', attaches: 'before', badge: 'A feather', level: -1, often: 'Once per run' } });
  const PIDGEY = [join(['pidgey'], { levelBonus: -1 }), flag('kanto-flock-pidgey'), moment('Saved a Pidgey from the Spearow flock over Pewter.')];
  s.entry('Pewter Skies: The Flock',
    'Screeching. A cloud of Spearow, wheeling over one spot in the grass. Under them, a Pidgey, on the ground, one wing held wrong. It\'s facing up at them. It isn\'t running. It can\'t fly and it can\'t win, and it has turned its small chest to the whole sky anyway.',
    [
      c('Drive them off.', battle('You run in under the wheel of them. Three waves of Spearow, one after another. The Pidgey doesn\'t hide behind you: it fights beside your lead, from the ground, with the one wing it has.',
        wild(['spearow'], { levelBonus: -1, chain: 3, win: PIDGEY }), flag('kanto-flock-seen'))),
      c('Pick the Pidgey up and run.', o('You scoop it up against your chest and run. It weighs nothing. Its heart is going like a moth in a jar. The flock follows for one step of the road, diving, and you duck under the last of them into the trees. No waves are fought. When you finally stop, the Pidgey is looking up at you, and it has stopped shaking.', flag('kanto-flock-seen'), ...PIDGEY),
        { prompt: ['dodge-tap', 'ok'], fail: battle('You scoop it up and run, and you are not fast enough. The flock is on you in one step, and there is nothing for it but to turn. The Pidgey struggles out of your arms to stand beside your lead.', wild(['spearow'], { levelBonus: -1, chain: 3, win: PIDGEY }), flag('kanto-flock-seen')) }),
      c('Leave it.', o('You keep to the road. Behind you the screeching goes on, and then, after a while, it doesn\'t. You don\'t look back to see why. The flock has seen you, though. It will be seen again, later.', flag('kanto-flock-seen'), flag('kanto-flock-left'))),
    ], { scene: { pokemon: 'pidgey' } });
  // Note: this Pidgey is not the one in Pidgey's Resolve (gn.02). If both are in a run, they are seen once, on the same fence, ignoring each other.
  s.room('fence', 'Two Pidgey on a Fence', 'On a fence by the road, two Pidgey. You know them both. One you carried out from under a flock of Spearow. The other one you met trying, and trying again. They are sitting a careful wing\'s width apart, each looking in a different direction, each ignoring the other with tremendous dignity.',
    [c('Leave them to it.', o('You walk past. Neither turns its head. When you look back from the bend, they have not moved an inch closer, and not an inch further apart.', flag('kanto-flock-fence'), fr(1)))],
    later({ requires: [is('kanto-flock-pidgey'), { kind: 'eventSeen', id: 'sky.opening' }, not('kanto-flock-fence')], scene: { pokemon: 'pidgey' } }));
  followup(s.id('fence'));
  // "Leave it: the flock's seen again, later." It is the next stage's sky.
  s.room('again', 'Pewter Skies: The Flock, Again', 'Screeching, overhead. You know the sound before you look up. The same cloud of Spearow, wheeling over the road ahead of you, bigger than before, louder than before. They are not hunting anything today. They are only going somewhere, together, and taking the whole sky with them. In the claw of the one in front there is a single brown feather.',
    [c('Watch them go.', o('You stand in the road until the last of them is over the hill. You don\'t know whose feather it was. You decide that you don\'t know, and you keep walking, and you carry it with you anyway.', flag('kanto-flock-again')))],
    later({ requires: [is('kanto-flock-left'), not('kanto-flock-again')], scene: { pokemon: 'spearow' } }));
  followup(s.id('again'), [2, 3]);
}

// ============================================================ CERULEAN CITY (Stage 2)

// ---------- Cerulean Burglary
{
  const s = space(E, { id: 'cs.kanto.cerulean.burglary', town: 'cerulean', name: 'Cerulean Burglary', kind: 'EV', appears: 'roll', flags: ['kanto.burglary.solved'], section: `${DOC}: Cerulean Burglary`,
    placed: { stage: [2], home: 11, window: [9, 13], sits: 'optional', attaches: 'before', badge: 'A broken wall', level: 0, often: 'Once per run' } });
  const chase = (lead: string) => battle(`${lead} The chase is one step long: he is still on the fence when you reach it, one leg over, the TM case clamped in his teeth. He drops down on your side and spits it into his hand. Grunt: "It's not stealing if you've got a uniform!"`,
    foe('Rocket Grunt', { team: ['machop', 'drowzee'], levelBonus: 0, evil: 'grunt', win: [heat(-1), flag('kanto-burglary-solved'), s.open('after')] }));
  s.entry('Cerulean Burglary',
    'A house with a hole in its side, the shape of a person. A family in the garden, in their nightclothes. The father: "He came through the wall. There\'s a door! It wasn\'t locked!" The daughter: "He took Dad\'s TM. The digging one. He said, \'Team Rocket thanks you for your contribution.\'" At the end of the garden, a man in black is trying to climb a fence with a TM case in his teeth.',
    [
      c('After him.', chase('You are already running.')),
      c('Is everyone all right?', chase('They are. Nobody is hurt. The grandmother\'s furious about the wall; she is holding a slipper like a weapon and telling the hole exactly what she thinks of it. The daughter looks at you as if nobody had asked her that all night. Then you run.'), ),
      c('Which way did he come in?', chase('The daughter takes you round the back, where there\'s a second hole, low down, edged with fresh earth. He dug in, and walked out through the front. That is not how a thief in a hurry works. That is how somebody practises. You fix it in your memory: a File, for whoever is keeping count of Team Rocket. Then you run.')),
    ]);
  // Choice 2 is Kindness +1 and choice 3 a File: set on the entry's outcomes.
  const entry = E[E.length - 1] as { choices: { success: { effects: Json[] } }[] };
  entry.choices[1]!.success.effects.push(...kind());
  entry.choices[2]!.success.effects.push(intel());
  s.room('after', 'Cerulean Burglary: The TM', 'The Grunt is gone over the fence without his dignity. The TM case is in your hands: Dig. Heat −1: Rocket\'s embarrassed. Across the garden, the father is standing in the person-shaped hole in his own wall, watching you, trying not to hope.',
    [
      c('Keep the TM.', o('It is a good TM. You won it fairly from the man who stole it. The father nods, slowly, the way people nod when they had already decided not to ask. The grandmother says nothing at all, which from her is louder.', teach('dig', { type: 'ground' }))),
      c('Give it back.', o('You hold it out. The father doesn\'t take it at once. He opens the case first and holds the disc out to you instead: learn it first, he says, and then he\'ll keep the case. So one of yours learns Dig in a ruined garden at two in the morning, while a grandmother in a nightgown brings out tea for everyone, including the Pokémon.', teach('dig', { type: 'ground' }), ...kind(), moment('Gave the stolen TM back to the family in Cerulean.'))),
    ]);
}

// ---------- Route 5 Day-Care
{
  const s = space(E, { id: 'cs.kanto.cerulean.daycare', town: 'cerulean', name: 'Route 5 Day-Care', kind: 'SHOP', appears: 'roll', flags: ['kanto.daycare.left'], section: `${DOC}: Route 5 Day-Care`,
    placed: { stage: [2], home: 15, sits: 'town', attaches: 'town', badge: 'An egg', level: null, often: 'Once per run' } });
  s.entry('Route 5 Day-Care',
    'A fence, a field, an old couple on a bench. In the field, other people\'s Pokémon are doing nothing in particular, very contentedly. Mr. Holloway: "Leave one with us a stage. It\'ll come back bigger, and it\'ll have opinions." Mrs. Holloway doesn\'t look up from her knitting, but she moves along the bench to make room, in case anyone needs to sit before deciding.',
    [
      c('Leave one with them for a stage.', o('You open the gate and the one at the back of your party walks through by itself, looks round the field, and then looks back at you. It isn\'t goodbye. It will be back at the start of the next stage, three levels bigger, and with opinions. Mr. Holloway writes its name in a book with a pencil on a string.', kc('daycareLeave', { count: 1 }), flag('kanto-daycare-left')), { requires: [{ kind: 'partySize', atLeast: 2 }] }),
      c('Leave two together.', o('Two of them go through the gate, the two at the back of your party, shoulder to shoulder. Mrs. Holloway finally looks up from her knitting, and looks at the pair of them for a while, and smiles at something she doesn\'t say. If the two get along, there will be an egg. Either way they come back at the start of the next stage, three levels bigger.', kc('daycareLeave', { count: 2 }), flag('kanto-daycare-left')), { requires: [{ kind: 'partySize', atLeast: 3 }] }),
      c('Just sit on the bench a while.', o('You sit. Nobody asks you for anything. A Pokémon that belongs to a stranger comes and leans on your leg. After a while Mrs. Holloway hands you a cup of something hot, as if you had been coming here for years.', fr(1))),
    ]);
  // The return, at the start of the next stage (placed by canonRun when Pokémon are waiting at the Day-Care).
  s.room('back', 'Route 5 Day-Care: Collection', 'A fence, a field, an old couple on a bench. Mr. Holloway has his book open on his knee before you reach the gate. "Bigger," he says. "Told you. And the opinions. You\'ll find out about the opinions."',
    [c('Open the gate.', o('They come back across the field at a run. Three levels bigger, every one. They have opinions about where you have been, and they tell you all of them at once.', kc('daycareReturn')))],
    later({ requires: [kc('daycare') as Json] }));
  followup(s.id('back'));
}

// ---------- Cerulean Cave: locked; placed and scripted with the finale (KANTO_PLACED_6), built there.

// ============================================================ VERMILION CITY (Stage 3)

// ---------- Diglett Port: The Fan Club Fish
{
  const s = space(E, { id: 'cs.kanto.vermilion.fishclub', town: 'vermilion', name: 'Diglett Port: The Fan Club Fish', kind: 'EV', appears: 'roll', flags: ['kanto.sprat.taught'], section: `${DOC}: Diglett Port: The Fan Club Fish`,
    placed: { stage: [3], home: 7, window: [5, 9], sits: 'optional', attaches: 'after', badge: 'A hook', level: -1, often: 'Once per run' } });
  const CATCH = [item('good-rod'), join(['basculin', 'corphish'], { levelBonus: -1 }), flag('kanto-sprat-taught'), moment('Learned wait-and-then-don\'t from Mr. Leland Sprat.')];
  s.entry('Diglett Port: The Fan Club Fish',
    'A jetty. A man with a rod, a bucket and a badge that reads VERMILION FISHING FAN CLUB: FOUNDER, CHAIRMAN, MEMBER. The Fishing Guru, Mr. Leland Sprat: "You\'ve never fished. I can see it in the shoulders. Sit. It\'s two things: you wait, and then you don\'t."',
    [
      c('Sit, and take the rod.', o('He hands you the rod as if he were handing you a baby. The float sits on the grey water of the harbor, doing nothing, and Mr. Sprat watches it with perfect contentment. The lesson is three casts long.', s.open('cast1'))),
      c('Not today.', o('"No," says Mr. Sprat, peacefully. "Not everybody\'s ready to wait." He goes back to his float. The Fan Club remains at a membership of one.')),
    ]);
  s.room('cast1', 'The Fan Club Fish: First Cast', 'The float trembles. A ring spreads out from it across the water, as fine as a hair.',
    [c('Pull!', o('You haul on the rod and bring up nothing but harbor. Mr. Sprat: "Too soon. You pulled at the ripple. The ripple\'s the fish thinking about it."', s.open('cast2')))]);
  s.room('cast2', 'The Fan Club Fish: Second Cast', 'This time you make yourself wait. The ripple comes. You wait. The float dips. You wait. You are being so patient. The float comes back up, and sits there, innocent.',
    [c('Pull...?', o('The hook comes up clean, the bait gone. Mr. Sprat: "Too late. It\'s had its lunch and gone home."', s.open('cast3')))]);
  s.room('cast3', 'The Fan Club Fish: Third Cast', 'The third cast. Mr. Sprat has stopped watching the float. He is watching your shoulders. You wait. And then, somewhere between one breath and the next, something in the line changes, and your hands know it before you do.',
    [c("And then you don't.", o('The rod bends double. Mr. Sprat: "There. That one you felt. Didn\'t you. Never mind what\'s on the end." What\'s on the end comes up thrashing and furious and yours. He unpins nothing from his badge, but he presses a Good Rod into your hands, and for one moment the Vermilion Fishing Fan Club has two members.', ...CATCH),
      { prompt: ['shout-tap', 'ok'], fail: o('You miss the moment by a hair, and feel yourself miss it, and that is the lesson. Mr. Sprat: "There. That one you felt. Didn\'t you. Never mind what\'s on the end." He reaches over, gives the line one small tug at exactly the right time, and what\'s on the end comes up thrashing and yours. Then he hands you a Good Rod, to practise with.', ...CATCH) })]);
}

// ---------- Vermilion Harbor Market
{
  const s = space(E, { id: 'cs.kanto.vermilion.market', town: 'vermilion', name: 'Vermilion Harbor Market', kind: 'SHOP', appears: 'roll', flags: ['kanto.market.ticket'], section: `${DOC}: Vermilion Harbor Market`,
    placed: { stage: [3], home: 4, sits: 'town', attaches: 'town', badge: 'A crate of fish', level: null, often: 'Once per run' } });
  const leave = c('Walk on along the quay.', o('You walk on along the quay. A cat on a bollard opens one eye, judges you not to be a fish, and closes it again.'));
  // If the Kaiju raid was lost (gn.11): the market is shut this stage (core/expansion/canonRun.ts failCanonRaid uses up its stop).
  s.entry('Vermilion Harbor Market',
    'Stalls along the quay. Nets drying. A cat on every bollard. The whole market smells of salt and rope and the inside of old boats, and everything on every table is a little damp. It sells Water-type goods, and one other thing, at the last stall, behind a hand-lettered sign.',
    [
      c('The stalls: Water-type goods.', o('A stallkeeper pulls back a tarp with a flourish that the goods underneath do not quite deserve.', s.open('goods'))),
      c('The stalls: nets and shells.', o('The next table along is all rope, cork and shell, and a woman mending a net without looking at it.', s.open('nets'))),
      c('The last stall: the Ticket.', o('The sign says S.S. ANNE. The woman under it looks you up and down, and decides you are the sort who loses things.', s.open('ticket'))),
      leave,
    ], { remembers: [
      { id: 'shut', when: [is('kanto-kaiju-lost')], intro: 'Stalls along the quay, every one of them shut. Shutters down. The nets have been taken in and even the cats are gone from the bollards. A sign is nailed to the first stall, in paint that ran before it dried: BACK WHEN IT\'S GONE. Out past the harbor wall, something very large moves under the water.', hide: [0, 1, 2] },
    ] });
  s.room('goods', 'Harbor Market: Water Goods', 'Everything on the table is damp, and the stallkeeper is proud of it.',
    [buy('Mystic Water', 900, 'A blue drop on a cord, cold as the bottom of the harbor.', item('mystic-water')), buy('Sea Incense', 800, 'It smells of a tide going out, a long way off.', item('sea-incense')), c('Look at the next table.', o('You move along.', s.open('nets'))), leave]);
  s.room('nets', 'Harbor Market: Nets and Shells', 'Rope, cork and shell. The woman mending the net still hasn\'t looked at it.',
    [buy('Net Ball ×5', 600, 'Five Net Balls, knotted into a string bag.', item('net-ball', 5)), buy('Dive Ball ×5', 600, 'Five Dive Balls, still wet.', item('dive-ball', 5)), buy('Shell Bell', 1200, 'It rings by itself when you pick it up, once, softly.', item('shell-bell')), c('Go to the last stall.', o('You walk on to the end of the quay.', s.open('ticket')))]);
  s.room('ticket', 'Harbor Market: The Ticket', 'The last stall sells exactly one thing. Ticket seller, Old Dorothea Quince-Marlow: "Two thousand. I know. I don\'t set it. The ship does. It\'s a very full-of-itself ship."',
    [buy('A Ticket for the S.S. Anne', 2000, 'She counts the money twice and stamps the Ticket three times. "Don\'t lose it," she says. "It knows what it\'s worth, and it\'ll let you."', item('ss-ticket'), flag('kanto-market-ticket')), leave],
    { remembers: [{ id: 'has', when: [has('ss-ticket')], intro: 'The last stall sells exactly one thing, and you already have one. Old Dorothea Quince-Marlow squints at the Ticket in your pocket. "Bill gave you that? Hm. Then you don\'t need mine. Go on. It\'s a very full-of-itself ship; don\'t keep it waiting."', hide: [0] }] });
}

// Old rooms of the simplified builds that the rebuilt spaces no longer open.
export const REMOVE: string[] = retired(EVENTS);
export { SPACES, EXTRA };
