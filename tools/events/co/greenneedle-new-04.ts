// Greenneedle, gn.new.04: The Tyrogue Who Wanted All Three (doc GREENNEEDLE_PLACED_1.md lines 161–195).
// Build: npm run co:build -- greenneedle-new-04   then   npm run co:gn
import { $, ch, out, type Json } from '../dsl.ts';
import { bond, chIf, gev, gn, is, laterStage, not, rm, say, stampStage, teach, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#b5523a';
const dojo = (o: Json = {}): Json => ({ tint: TINT, pokemon: 'tyrogue', tags: ['Pokémon', 'Story'], effect: 'none', ...o });
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const MARK = 'tyrogue-three';
const on = is('tyr-on', 1, 1);
const lead = (key: string): Json => gnc('tyrLead', { key });

// ---------- Step 5: the door ----------
const door = gev('gn-new-04-door', 'The Tyrogue Who Wanted All Three', dojo({ stop: 'event', rarity: 'rare', requires: [not('tyr-on')] }), say(
  '*One street, three dojos. A small Tyrogue bows at the first door, and is thrown out. It bows at the second, and is thrown out. The third.*',
  '**Kick master, Sensei Oyelowo:** "It trains next door! Out!"',
  '**Punch master, Sensei Brannigan:** "It trains across the road! Out!"',
  '**Spin master, Sensei Tachibana:** "It trains everywhere! Out!"',
  '*The Tyrogue picks itself up out of the gutter, dusts off its knees, and bows to you instead.*',
), [
  ch('Travel with me for the stage.', out(
    'It falls into step beside you like it was always going to. Behind you, three doors slam, then one of them opens again, just a crack.',
    gn('tyrJoin', { n: 1 }), stampStage('tyr-door'),
  )),
  ch('Pick one, kid.', out(
    'You tell it to choose a school, and it takes the question very seriously. It looks at three doors for a long time. Then it chooses.',
    gn('tyrJoin', { n: 2 }), stampStage('tyr-door'),
  )),
  ch('Walk on.', out('The Tyrogue watches you go, then turns and bows at the first door again. It is thrown out again. It tries the second.')),
]);

// ---------- Steps 8, 12 and 16: one master at the roadside ----------
interface Master { n: number; id: string; name: string; style: string; line: string; own: string; other: string; move: string; moveName: string; lesson: string; right: string; stay: string }
const MASTERS: Master[] = [
  { n: 1, id: 'kick', name: 'Sensei Oyelowo', style: 'kick', line: '"That was a kick. That was MY kick."', move: 'low-kick', moveName: 'Low Kick',
    own: 'He is, for once, right, and he cannot stop saying so. He says it to the road, the sky and a passing Pidgey.',
    other: 'The count says otherwise. He knows the count says otherwise. He has decided, on principle, not to look at the count.',
    lesson: 'He shows it one low kick, slowly, three times, with his whole face. It copies him exactly, down to the face. He weeps a little.',
    right: 'He turns to the road, arms wide, and tells it. The Tyrogue looks very pleased, and slightly embarrassed on his behalf.',
    stay: 'You step back and let them have it out. The master explains his kick to the Tyrogue, and the Tyrogue nods, as if it has heard.' },
  { n: 2, id: 'punch', name: 'Sensei Brannigan', style: 'punch', line: '"He\'s lying. It punched."', move: 'mach-punch', moveName: 'Mach Punch',
    own: 'He is right, and has the decency to look surprised about it. He stands very straight, and says nothing, which is worse.',
    other: 'The count says otherwise, and he has not read it, and he never will. "I know what I saw," he tells the road.',
    lesson: 'He throws one punch so fast the air snaps. The Tyrogue blinks, throws one back, and nearly falls over. He claps, once.',
    right: 'He folds his arms, nods, and tells the road he never doubted it. He has doubted it for four hours. He tells no one.',
    stay: 'You take a step back. Brannigan says "it punched" three more times, to three different Pokémon, none of whom asked.' },
  { n: 3, id: 'stand', name: 'Sensei Tachibana', style: 'stand', line: '"It didn\'t fall over. That\'s mine."', move: 'rapid-spin', moveName: 'Rapid Spin',
    own: 'She is right, and she knows it, and she is already looking at you the way a person looks at a witness.',
    other: 'The count says otherwise. She turns a slow half-circle, thinking, and decides that the count is *also* spinning.',
    lesson: 'She spins once on one heel, and sets down again exactly where she began. The Tyrogue tries. It lands a foot to the left, delighted.',
    right: 'She turns a full circle, very slowly, so everyone can see how right she is. A man on a bicycle slows down to watch.',
    stay: 'You let her have the road. She spins quietly in the middle of it, and the Tyrogue spins beside her, a little behind.' },
];
const STEP = [8, 12, 16];
const road = (m: Master): Json => {
  const others = MASTERS.filter((x) => x.id !== m.id);
  return gev(`gn-new-04-road-${m.n}`, `The Tyrogue Who Wanted All Three: ${m.name}`, dojo({ stop: 'event', rarity: 'rare', requires: [on, gnc('tyrWith')], remembers: [
    { id: 'own', when: [lead(m.style)], notice: m.own },
    { id: 'other-a', when: [lead(others[0]!.style)], notice: m.other },
    { id: 'other-b', when: [lead(others[1]!.style)], notice: m.other },
  ] }), say(
    `*At the roadside, a figure in a dojo coat is waiting with their arms folded. ${m.name}, who has been following you for a mile, pretending not to.*`,
    `**${m.name}:** ${m.line}`,
    'The Tyrogue looks from the master to you, and waits to be told what it did.',
  ), [
    ch('Take the lesson.', out(m.lesson, teach(m.move, { mark: MARK }), gn('tyrTally', { key: m.style, n: 1 }))),
    ch('Tell him he\'s right.', out(m.right, gn('tyrTally', { key: m.style, n: 2 }), bond(1))),
    ch('Stay out of it.', out(m.stay)),
  ]);
};

// ---------- Step 19: the end ----------
const end = gev('gn-new-04-end', 'The Tyrogue Who Wanted All Three: The Last Crossroads', dojo({ stop: 'event', rarity: 'rare', requires: [on] }), say(
  '*At the last crossroads, three figures in three different coats are standing a careful distance apart. They have not spoken to each other in a mile.*',
  'The Tyrogue steps into the road between them. It bows, and it is ready.',
), [
  ch('Step forward.', out('You step forward, and the road goes quiet.', gn('tyrResult'), { kind: 'gn', op: 'route', key: 'tyr-result', to: { kind: 'addEventFrom', ids: ['gn-new-04-gone', 'gn-new-04-kick', 'gn-new-04-punch', 'gn-new-04-stand', 'gn-new-04-even'] } })),
]);
const gone = rm('gn-new-04-gone', 'The Tyrogue Who Wanted All Three: Gone', dojo(), say(
  'The masters look at you. They look at the empty place beside you. Nobody says anything for a while.',
  '**Oyelowo:** "It was a good little one." **Brannigan:** "It was." **Tachibana:** "It didn\'t fall over once."',
  'It is the first thing the three of them have agreed on all year.',
), [ch('Bow to them.', out('You bow. Three bows come back, together, and nobody ever remembers whose came first.'))]);
const finish = (id: string, name: string, form: string, move: string, weeps: string, sulks: string, last: string, key: string): Json =>
  rm(id, `The Tyrogue Who Wanted All Three: ${name}`, dojo({ pokemon: form }), say(
    `The Tyrogue bows to all three, and then, with a grace nobody taught it, it shows them what it learned. It glows, and grows, and it is ${name.replace(/^A /, 'a ')}.`,
    weeps,
    sulks,
    last,
  ), [ch('Congratulate it.', out('It looks at you for a long time. Then it bows once more, lower, and it is yours.', gn('tyrEvolve', { key }), teach(move, { mark: MARK }), bond(2)))]);
const kick = finish('gn-new-04-kick', 'A Hitmonlee', 'hitmonlee', 'high-jump-kick',
  '**Oyelowo** sits down in the road and weeps openly, both hands over his face. A man selling flowers gives him one, without a word.',
  '**Brannigan:** "Fluke." **Tachibana:** "Obviously a fluke." They look at each other, startled, then both look away.',
  'Oyelowo, between sobs: "Nobody tell it to stand on one foot. It *is* standing on one foot."', 'kick');
const punch = finish('gn-new-04-punch', 'A Hitmonchan', 'hitmonchan', 'sky-uppercut',
  '**Brannigan** says nothing at all. He takes off his belt, folds it very small, and sets it down at the Tyrogue\'s feet.',
  '**Oyelowo:** "It *kicked* once." **Tachibana:** "It stood up after." They go quiet, and sulk in two different directions.',
  'Brannigan, so quietly: "I knew. I always knew. I\'ll never say it again, so don\'t ask."', 'punch');
const stand = finish('gn-new-04-stand', 'A Hitmontop', 'hitmontop', 'gyro-ball',
  '**Tachibana** turns a single, slow circle, and ends facing the Tyrogue, and for the first time all year, she doesn\'t say anything clever.',
  '**Oyelowo:** "It never fell." **Brannigan:** "That\'s not a *style*." Tachibana turns, very slowly, and they both stop talking.',
  'Tachibana, softly: "It stayed on its feet through all of us. That\'s the whole art. Well done, little one."', 'stand');
const even = rm('gn-new-04-even', 'The Tyrogue Who Wanted All Three: Three Schools', dojo(), say(
  'The Tyrogue does not glow. It does not grow. It stands there, exactly as it was, and looks at the three masters, who look back.',
  'It has kicked, and punched, and stood, in equal parts, and it can\'t say which it is. It doesn\'t want to say.',
  'All three masters bow. Slowly. Together. None of them can explain it, and none of them tries.',
), [ch('Let it stay as it is.', out('The Tyrogue looks relieved. It bows to all three, and then to you, and takes its place at your heel, unchanged.', teach('three-schools', { mark: MARK }), bond(3)))]);

// ---------- afterstory: the sign ----------
const sign = gev('gn-new-04-sign', 'The Three Dojos', dojo({ stop: 'event', rarity: 'rare', callback: true, requires: [is('tyr-on', 2, 2), laterStage('tyr-door')] }), say(
  '*A street with one big sign over three doors. The three dojos have merged. The sign is wet; someone has just finished repainting it.*',
  '**A passer-by:** "Third time this week. Every time one of them wins an argument, the sign gets repainted. The paint is never dry."',
), [chIf([], 'Read the sign.', out(
  'Underneath the new name, in smaller letters, in three different handwritings: *Ask about the Tyrogue.* A boy at the door tips you for reading it.',
  $(150),
))]);

export const EVENTS: Json[] = [door, ...MASTERS.map(road), end, gone, kick, punch, stand, even, sign];
export const REMOVE: string[] = [];
export const CHAINS: Json[] = [];

const base = { gn: 'gn.new.04', shape: 'Stage-Three', earliest: 'A3', level: 'A-1 for its battles', often: 'run' as const, badge: 'own', chain: 'gn.new.04', tags: ['Pokémon'] };
export const PLACEMENT: Record<string, Placement> = {
  'gn-new-04-door': { ...base, home: 5, window: [4, 6], sits: 'must-see', attaches: 'after', beat: 1, dressing: { kanto: 'The Tyrogue Who Wanted All Three', elsewhere: 'The Tyrogue Who Wanted All Three' }, note: 'Chain inside one stage: it travels with the player to Step 19. Fallback: Step 15 of the previous stage\'s town, one stage later.' },
  ...Object.fromEntries(MASTERS.map((m, i) => [`gn-new-04-road-${m.n}`, { ...base, home: STEP[i]!, window: [STEP[i]! - 1, STEP[i]! + 1] as [number, number], sits: 'optional' as const, attaches: 'after' as const, beat: 2 + i, note: `One master at the roadside (${m.name}), any lane.` }])),
  'gn-new-04-end': { ...base, home: 19, window: [18, 19], sits: 'must-see', attaches: 'after', beat: 5, note: 'The ending: a clear lead evolves it; an even split leaves it a Tyrogue with Three Schools.' },
  'gn-new-04-sign': { gn: 'gn.new.04', shape: 'Single', earliest: 'A4', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', level: 'None', often: 'run', badge: 'own', note: 'Afterstory: the three dojos merge; the sign is repainted every time a master wins an argument.' },
};
