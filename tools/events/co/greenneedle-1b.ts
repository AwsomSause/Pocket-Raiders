// Greenneedle, part 1b: gn.01 Poli-Pond, rebuilt to the doc (GREENNEEDLE_REWORKED_PLACED_1.md §1).
// The ids are the Beta 0.7 ones (pp-*), so these win over src/data/events/poli-pond.json; the engine stays core/episodes/poliPond.ts.
// Build: npm run co:build -- greenneedle-1b
import { ch, fight, flag, heal, out, room, trainer, type Json } from '../dsl.ts';
import { chIf, gev, is, laterStage, moment, not, notThisStage, rm, sameStage, say, stampStage, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const POND = '#1f4a63';
const pond = (action: string, o: Json = {}): Json => ({ kind: 'pond', action, ...o });
const poli = (o: Json = {}): Json => ({ tags: ['Story', 'Pokémon', 'Relationship'], tint: POND, pokemon: 'poliwag', ...o });
/** The lessons: at the rests of the stage the Poliwag joined; one that is missed is missed (Burl's trick stays). */
const LESSON_REQ = (lesson: string): Json[] => [is('pp-begun'), sameStage('pp-stage'), not(`pp-lesson-${lesson}`), not('pp-ending-done')];
/** One lesson's three responses: patient (learned on the first retry), kind (second retry, Bond +1), shortcut (learned, weaker). */
const lesson = (id: string, name: string, which: string, intro: string, r: { patient: [string, string]; kind: [string, string]; shortcut: [string, string] }, patientFirst = false): Json => {
  const kind = ch(r.kind[0], out(r.kind[1], pond('lesson', { lesson: which, bond: true })));
  const patient = ch(r.patient[0], out(r.patient[1], pond('lesson', { lesson: which, firstTry: true })));
  const shortcut = ch(r.shortcut[0], out(r.shortcut[1], pond('lesson', { lesson: which, weak: true })));
  // The doc's order of the three buttons.
  return gev(id, name, poli({ stop: 'rest', rarity: 'uncommon', callback: true, minStage: 2, effect: 'float', requires: LESSON_REQ(which) }), intro, patientFirst ? [patient, kind, shortcut] : [kind, patient, shortcut]);
};

/** The rematch fight: one on one, the Poliwag against Burl, two levels above it. */
const BURL = (exceptional: boolean): Json => ({
  ...trainer('Burl', { cls: 'roughneck', size: 1, team: ['poliwhirl'], lv: 2, win: [pond('rematchWon'), room('pp-ending')] }),
  spritePokemon: 'poliwhirl',
  pseudo: true,
  rule: { pondDuel: true, noSwitch: true, matchLead: true, ...(exceptional ? { evolveMid: true } : {}) },
  lose: [heal(0.5), stampStage('pp-lost-stage'), room('pp-rematch-lost')],
});

const EVENTS_1B: Json[] = [
  // ---- cold open (S(n), step 3) ----
  gev('pp-cold-open', 'Poli-Pond: The Little Pokémon That Could', poli({
    stop: 'event', rarity: 'rare', callback: true, minStage: 2, effect: 'rain', types: ['water'], requires: [not('pp-begun'), not('pp-walked')],
  }), say(
    'The reeds shake. A Poliwag is shoved out of them, skids across the mud, and stops at your feet. It is small, even for a Poliwag.',
    'It hides behind your legs. Five heads rise out of the water.',
    '*Burl slaps the surface with his palm. The other three slap it too, late.*',
    '*The Poliwag presses its face into the back of your knee.*',
    '*The fifth head, at the back, sinks lower, until only its eyes show.*',
  ), [
    ch('Stand in front of it.', out(
      'You do not raise your voice. You only move, and stop being someone walking past and become a wall. Burl squirts water at your shoes, and goes under. The others follow him down. Behind you, the Poliwag lets out a breath it has been holding a very long time. When you walk on, it follows you.',
      pond('begin'), stampStage('pp-stage'), flag('poli-joined'),
    )),
    ch('Step aside.', out(
      'You step aside. It is not your pond. Webbed hands reach out of the reeds and drag the Poliwag back in, and it does not even cry out. It looks at the ground the whole way.',
      flag('pp-walked'), flag('kind-walked-past'), stampStage('pp-walked-stage'),
    )),
    ch('Pick it up.', out(
      'You scoop it up. It goes rigid, then limp. It weighs nothing. It weighs nothing at all. Out on the water, the five heads watch you carry it away. When you set it down at the end of the bank, it follows you.',
      pond('begin', { gentle: true }), stampStage('pp-stage'), flag('poli-joined'),
    )),
  ]),

  // ---- if the player stepped aside: a stage later, a different trainer has it ----
  gev('pp-walked-past', 'A Poliwag Doing Well', poli({
    stop: 'event', rarity: 'uncommon', callback: true, minStage: 3, effect: 'none', requires: [is('pp-walked'), laterStage('pp-walked-stage'), not('pp-walked-seen')],
  }), say(
    'A trainer by the road is drilling a Poliwag. Small, even for a Poliwag. You know it at once.',
    'It hits the target, every time. Its trainer cheers every time. It looks up, not at the ground.',
    'Someone else stood in front of it. It\'s doing well.',
  ), [
    ch('Watch a while, then walk on.', out('It does not see you. That is all right. You walk on lighter than you came, and a little heavier, both at once.', flag('pp-walked-seen'))),
  ]),

  // ---- the three lessons (at rests: Steps 7, 11, 17) ----
  lesson('pp-lesson-aim', 'Lesson: Aim', 'aim', say(
    'You set three Berries on a log and step back. It spits water at them.',
    'The first shot hits you. Square in the face.',
    'The Poliwag freezes. Its whole face is already apologising. It knows exactly how this goes: someone shouts, and then it is on the ground.',
  ), {
    kind: ['Laugh.', 'You laugh. You can\'t help it, dripping. It stares at you. Then it starts laughing too, a startled wheezing sound. It misses again, and laughs again, and on the second retry the middle Berry rolls off the log.'],
    patient: ['Try again, slower.', 'You crouch beside it, wipe your face, and say: slower. Eyes open. It takes a breath. The next jet clips the middle Berry, and it tips off the log. The Poliwag turns to you with its whole body.'],
    shortcut: ['Move the log closer.', 'You move the log closer. Much closer. It hits the Berry. It hits it again. It is very pleased. You are not sure it would hit anything from where it started.'],
  }),
  lesson('pp-lesson-footing', 'Lesson: Footing', 'footing', say(
    'Your lead pushes it, gently. It is meant to hold.',
    'It rolls all the way down the bank and into the mud at the bottom, and lies there with its eyes shut.',
    'It has spent so long being pushed that the world has become a series of shoves.',
  ), {
    kind: ['Go and get it.', 'You go down the bank and pick it out of the mud and wipe its face. It goes down twice more. Each time you go and get it. On the second retry it holds, and looks down at its own feet as if it has never met them.'],
    patient: ['Wait for it to climb back.', 'You wait at the top. It climbs back on its own, muddy to the eyes, and plants its feet without being told. The next push, it holds. It doesn\'t even blink.'],
    shortcut: ['Show it how you stand.', 'You show it: feet apart, knees soft. It copies you exactly, and holds, and looks proud. It holds when it is thinking about it. You hope it will be thinking about it.'],
  }),
  lesson('pp-lesson-stand', 'Lesson: Standing Its Ground', 'stand', say(
    'Without warning, you clap. Loudly.',
    'It bolts into the reeds.',
    'You see the shape of what the pond has taught it all along: when something big makes a noise, you run.',
  ), {
    kind: ['Call its name.', 'You call its name. Nothing. You call again, softer. A pair of eyes in the reeds. On the second retry it stays where it is when you clap, shaking, and doesn\'t run.'],
    patient: ['Don\'t chase. Sit down.', 'You don\'t chase. You sit down in the grass, small, and wait. A long time later it comes out and sits beside you. When you clap again, it flinches, and stays.'],
    shortcut: ['Clap again, softer.', 'You clap again, softer. And softer. It stays for the soft ones. You are not sure what it will do when someone claps hard.'],
  }, true),

  // ---- what the player can find out (Step 14, optional) ----
  gev('pp-pond-visit', 'The One Who Hangs Back', poli({
    stop: 'event', rarity: 'rare', minStage: 2, pokemon: 'poliwhirl', effect: 'fog', requires: [is('pp-begun'), not('pp-ending-done'), not('pp-guilty')],
  }), say(
    'Back at the pond. The fifth Poliwhirl is alone on the bank.',
    '*It sees the Poliwag on your shoulder. It looks away.*',
    '*In the mud by its feet, an old stake with a rope: this was a guard post, once. The rope\'s chewed through.*',
  ), [
    ch('Sit down next to it.', out(say(
      'You sit down next to it, and say nothing. After a while it scratches a picture in the mud with one finger.',
      'Trainers with nets. Then the pond. Then five Poliwhirl in a line in front of the pond.',
      'Then, smaller, the same five, in a ring around something little.',
      'It rubs the last one out with its foot.',
    ), pond('guilty'), flag('poli-guilty-found'))),
    ch('Ask it why.', out('You ask it why. It looks at the stake, and the chewed rope, and then at the water for a long time. It doesn\'t answer. Maybe it doesn\'t know how to.')),
    ch('Leave it.', out('You leave it on the bank with its back to the water. It doesn\'t watch you go. It\'s watching the Poliwag.')),
  ]),

  // ---- the rematch (next stage, Step 2): one on one, it wins by lessons, not by level ----
  gev('pp-rematch', 'The Rematch at the Pond', poli({
    stop: 'event', rarity: 'rare', forced: true, callback: true, minStage: 3, pokemon: 'poliwhirl', effect: 'rain', types: ['water'],
    requires: [is('pp-begun'), laterStage('pp-stage'), notThisStage('pp-lost-stage'), not('pp-ending-done'), not('pp-rematch-won')],
    remembers: [{ id: 'again', when: [is('pp-lost-stage')], notice: 'Burl is waiting again, arms folded. The Poliwag looks at him. Then it looks at you, and walks out to the water by itself.' }],
  }), say(
    'Back at the pond. The five are waiting in a half circle, and Burl steps out of the reeds with his arms folded. Burl is two levels above the Poliwag. He always has been.',
    'One on one. The Poliwag against Burl. He has three tricks. You taught it three things.',
    'The Poliwag is shaking. It steps out in front of you anyway.',
  ), [
    chIf([not('pp-exceptional')], 'Let it step forward.', fight('You step back. It is the hardest thing you have done all stage.', BURL(false))),
    chIf([is('pp-exceptional')], 'Let it step forward.', fight('You step back. The Poliwag doesn\'t look at you for permission. It looks at Burl.', BURL(true))),
  ]),
  rm('pp-rematch-lost', 'It Gets Up', poli({ effect: 'rain' }), say(
    'It gets up.',
    'It bows to Burl. Then it turns and walks back to you, and stands by your boot, and looks at the pond.',
    'It isn\'t over. There will be another pond, another day, at the next water.',
  ), [
    ch('Walk on together.', out('It walks beside you. It doesn\'t look at the ground.', moment('The Poliwag lost to Burl, got up, and bowed. It will try again at the next water.', 55))),
  ]),

  // ---- endings ----
  rm('pp-ending', 'After the Pond', poli({ effect: 'sparkle' }), say(
    'It is very quiet after. Burl is sitting in the shallows with his head down. The other four have gone silent.',
    'The Poliwag stands in front of you, dripping, out of breath, unbelievably proud. Nobody has ever hit it back before.',
    'It turns from the pond to you.',
  ), [
    ch('Come with me.', out(
      'You hold out a hand. It looks at it as if it might disappear. Then it puts a damp palm on yours. When it steps aside for a friend now, the friend goes first. It learned that from someone.',
      pond('keep'), flag('poli-ending-keep'),
    )),
    chIf([not('pp-guilty')], 'This is your pond now.', out(say(
      'It looks at the water. It looks back at you. It understands before you finish.',
      'It stays at the edge with its chin up. By the time you reach the road, small Poliwag are lining up in front of it.',
    ), pond('release'), flag('pp-pond-founded'), flag('poli-ending-release'))),
    chIf([is('pp-guilty')], 'This is your pond now.', out(say(
      'The guilty one walks out of the reeds and stands beside the Poliwag.',
      'Then Burl does. He doesn\'t apologise. He holds the reeds back for it.',
      'By the time you reach the road, small Poliwag are lining up in front of all of them.',
    ), pond('reconcile'), flag('pp-pond-founded'), flag('poli-ending-reconcile'))),
  ]),
];

// =====================================================================================================================
// gn.02  PIDGEY'S RESOLVE: THE RIVALRY OF THE SKY  (region-long; engine core/sky). The scenes keep their Beta 0.7 ids (sky.*).
// =====================================================================================================================
const SKY_GROUP = 'Rival episodes';
const sky = (when: string): Json => ({ kind: 'sky', when });
const act = (a: string, o: Json = {}): Json => ({ kind: 'sky', act: a, ...o });
const skyEv = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => ({ ...gev(id, name, { tags: ['Story', 'Rival', 'Pokémon'], ...o }, intro, choices), group: SKY_GROUP });
const WATCHED = (text: string, effects: Json[] = []): Json => ({ text, effects, battle: { kind: 'wild', species: ['spearow'], types: [], levelBonus: 0, pseudo: true, win: [] } });
const FINALE_FIGHT = (text: string, effects: Json[] = []): Json => ({ text, effects, battle: { kind: 'wild', species: ['fearow'], types: [], levelBonus: 0, pseudo: true, win: [] } });

const EVENTS_SKY: Json[] = [
  // ---- the branch (S1, Step 2, must-see) ----
  skyEv('sky.opening', "Pidgey's Resolve", { stop: 'event', rarity: 'rare', forced: true, minStage: 1, pokemon: 'pidgey', tint: '#31404f', effect: 'glint', requires: [{ kind: 'xevents' }, sky('opening')] }, say(
    'A Pidgey and a Spearow are fighting over one branch. Feathers on the ground, brown and speckled, more of them brown.',
    'It is only a branch. Neither of them will say why it matters. That is how you know it does.',
    'Then they both stop, and look at you. As if you were the one who decides.',
  ), [
    ch('Back the Pidgey.', WATCHED('You say it quietly: come on, little one. The Pidgey hears. The branch shakes. It begins.', [act('duel', { side: 'pidgey' })])),
    ch('Back the Spearow.', WATCHED('You say it plainly, because it is the bigger bird and the louder. The Pidgey hears that too. The branch shakes. It begins.', [act('duel', { side: 'spearow' })])),
  ]),

  // ---- one beat per stage (S2 to S7, Step 8, optional) ----
  skyEv('sky.meet', 'A Shape on a Fence Post', {
    stop: 'event', rarity: 'rare', forced: true, minStage: 1, pokemon: 'pidgey', tint: '#2a3b52', effect: 'glint', requires: [{ kind: 'xevents' }, sky('meet')],
    remembers: [{ id: 'nest', when: [sky('nest')], notice: 'Behind it, in the fork of the fence, is its nest. It is lined with everything you ever gave it: every one, kept, tucked in, the way you keep letters.' }],
  }, say(
    '*A shape on a fence post. It\'s bigger than last time.*',
    'It does not chirp a greeting. It stands very straight and looks at you the way you look at a door you are going to walk through someday.',
    'Somewhere above the clouds, a larger shape turns without a sound. It does not look up. That is how you know it knows.',
  ), [
    ch('Spar with it.', {
      text: 'It bows its head, one small, formal dip. Whatever beats it, it will carry an answer to next time.',
      effects: [act('meetSpar')],
      battle: { kind: 'trainer', name: 'Pidgey', team: ['pidgey'], size: 1, pseudo: true, types: [], levelBonus: 0, win: [act('sparWon')], lose: [act('sparLost')] },
    }),
    ch('Give it something.', out('You hold it out. It does not take it at first. Nobody has ever just given it something.', act('giftAny')), { requires: [sky('giftAny')] }),
    ch('Just watch.', out('You lean on the fence and say nothing at all.', act('watch'))),
  ]),

  // ---- found training alone (S3 and S6, Step 16) ----
  skyEv('sky.alone', 'Training Alone', { stop: 'event', rarity: 'rare', forced: true, minStage: 1, pokemon: 'pidgey', tint: '#27384a', effect: 'glint', requires: [{ kind: 'xevents' }, sky('alone')] }, say(
    '*It\'s diving at a rock, pulling up, diving again. It doesn\'t notice you.*',
    '*There\'s a Fearow feather stuck in the rock. It\'s been aiming at that.*',
    'The grass is flattened in a ring where it has fallen a hundred times. Nobody watching. Nobody keeping score.',
  ), [
    ch('Leave quietly.', out('You back away, one step at a time, until the rock is behind the hill.', act('aloneLeave'))),
    ch('Call out.', out('You call its name.', act('aloneCall'))),
  ]),

  // ---- the finale (S8, Step 18, must-see) ----
  skyEv('sky.finale', 'The Cliff in High Wind', {
    stop: 'event', rarity: 'epic', forced: true, minStage: 1, pokemon: 'pidgeot', tint: '#1d2a3d', effect: 'glint', requires: [{ kind: 'xevents' }, sky('finale')],
    remembers: [{ id: 'backed-spearow', when: [is('pidgey-backed-spearow')], notice: 'Before it begins, Pidgeot looks at you. Then it looks away. It has not forgotten which bird you backed, on the first day, at the branch.' }],
  }, say(
    'A cliff. High wind. Wild Pokémon on every ledge, watching: they felt it coming, the way a field feels rain.',
    'Pidgeot on the high rock with its crest into the gale. Across the gap, Fearow lands with its wings half-folded, and says nothing.',
    '*They circle once. Neither is the bird from the branch.*',
  ), [
    ch('Climb to the ridge and watch.', FINALE_FIGHT('You climb to the ridge above them, and the wind takes your breath, and you do not look away.')),
    ch('Give Pidgeot a last Berry before it begins.', FINALE_FIGHT('You hold it up. Pidgeot lowers its great head and takes it, and does not need to say anything. Then you climb the ridge.', [act('finaleGiftBerry')]), { requires: [sky('giftBerry')] }),
    ch('Give Pidgeot something to hold before it begins.', FINALE_FIGHT('You press it into its claws and step back. It will carry it into the wind. It will keep it to the end.', [act('finaleGiftItem')]), { requires: [sky('giftItem')] }),
  ]),

  // ---- after "Fearow!": met in the next region for one more fight, at A+1. Win that, and it'll listen ----
  skyEv('sky.rematch', 'One More Fight', { stop: 'event', rarity: 'epic', forced: true, minStage: 1, pokemon: 'pidgeot', tint: '#2a2230', effect: 'glint', requires: [{ kind: 'xevents' }, sky('rematch')] }, say(
    'Pidgeot is waiting on the road, as if it had been waiting since the cliff. It does not look at you.',
    'It did not leave the road, either. It is standing exactly where you will have to pass.',
    'It wants one more fight. Under the anger, you see now, is only a question: did you mean it?',
  ), [
    ch('Fight it.', {
      text: 'You step up. It meets your eye for the first time since the cliff.',
      effects: [],
      battle: { kind: 'trainer', name: 'Pidgeot', team: ['pidgeot'], size: 1, pseudo: true, types: [], levelBonus: 0, win: [act('rematchWon')], lose: [act('rematchLost')] },
    }),
  ]),
];

export const EVENTS: Json[] = [...EVENTS_1B, ...EVENTS_SKY];
/** The Beta 0.7 exceptional rematch is one event now (pp-rematch shows its evolving choice when all three lessons were first-retry). */
export const REMOVE: string[] = ['pp-rematch-exceptional'];

export const PLACEMENT: Record<string, Placement> = {
  'pp-cold-open': {
    gn: 'gn.01', shape: 'Chain', earliest: 'A2', sits: 'optional', tags: ['Miniature Episode', 'Companion Story', 'Region-Wide Story'], level: 'bullies A-1, Burl A+0 (rematch: the Poliwag +2)', often: 'run', needs: ['water'],
    beats: [
      { beat: 'Cold open', event: 'pp-cold-open', stage: 'S(n)', home: 3, window: [2, 5] },
      { beat: 'Lesson 1: Aim', event: 'pp-lesson-aim', stage: 'S(n)', home: 7, window: [6, 9] },
      { beat: 'Lesson 2: Footing', event: 'pp-lesson-footing', stage: 'S(n)', home: 11, window: [10, 13] },
      { beat: 'The guilty Poliwhirl (optional)', event: 'pp-pond-visit', stage: 'S(n)', home: 14, window: [12, 16] },
      { beat: 'Lesson 3: Standing its ground', event: 'pp-lesson-stand', stage: 'S(n)', home: 17, window: [15, 19] },
      { beat: 'The rematch (must-see)', event: 'pp-rematch', stage: 'S(n+1)', home: 2, window: [1, 4] },
      { beat: 'The return', stage: 'any later evil-team climax or Champion battle' },
    ],
    note: 'Stages S1-S6. The cold open places the lessons and the pond visit on later nodes of its stage (core/events.ts pond begin).',
  },
};
PLACEMENT['sky.opening'] = {
  gn: 'gn.02', shape: 'Region-wide', earliest: 'A1', sits: 'must-see', tags: ['Region-Wide Story', 'Rival Episode'], level: 'Pidgey and Spearow match each other at A-1, rising each stage', often: 'run',
  beats: [
    { beat: 'The branch', event: 'sky.opening', stage: 'S1', home: 2, window: [1, 4] },
    { beat: 'Stage beats (spar, give, or watch; optional)', event: 'sky.meet', stage: 'S2-S7', home: 8, window: [6, 12] },
    { beat: 'Found training alone', event: 'sky.alone', stage: 'S3, S6', home: 16, window: [14, 18] },
    { beat: 'The finale (must-see)', event: 'sky.finale', stage: 'S8', home: 18, window: [16, 19] },
  ],
  note: 'Best in a run\'s first region. Once per run.',
};
export const CHAINS: Json[] = [];
