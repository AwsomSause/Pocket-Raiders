// Greenneedle gn.new.08 The Understudy (GREENNEEDLE_PLACED_1.md lines 303-337). Backstage at a small theatre; no battles; once a run.
// Build: npm run co:build -- greenneedle-new-08
import { ch, join, out, type Json } from '../dsl.ts';
import { bond, bondAll, chIf, gev, is, kindness, moment, not, notThisRegion, rm, say, scene, setTo, stampRegion, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const THEATRE = '#5a2a3f';
const th = (o: Json = {}): Json => ({ tags: ['Story', 'Pokémon', 'Relationship'], tint: THEATRE, pokemon: 'mime-jr', effect: 'sparkle', ...o });
/** Mime Jr. joins with Curtain Call (engine.ts switchIn), marked so the poster and later scenes know it. */
const MIME = { ...join({ species: ['mime-jr'] }), ability: 'curtain-call', mark: 'understudy' };
const show = scene('gn-new-08-show');

export const EVENTS: Json[] = [
  gev('gn-new-08-door', 'The Understudy', th({ stop: 'event', rarity: 'rare', forced: true, minStage: 3, requires: [not('understudy-done')], remembers: [
    { id: 'again', when: [is('kind-walked-past')], notice: 'You have walked past a small one in trouble before. The stage door is open, and you do not walk past this one.' },
  ] }), say(
    '*Backstage at a small theatre. Ropes, sandbags, a painted moon that has seen better years.*',
    '*A Mime Jr. is doing the star\'s whole act, perfectly, to an audience of mops.*',
    '**Director, Madame Okonjo-Reyes:** "He\'s not here. Curtain\'s in an hour. Forty tickets sold. Forty!"',
    '*The Mime Jr. freezes mid-gesture, caught. It looks at you the way a child looks at a teacher who has walked in on it.*',
  ), [
    ch('Coach the little one.', out('You kneel until you are its height. "Show me the whole thing," you say, "and I\'ll show you what it\'s missing." It nods, very seriously, and takes its place in front of the mops.', setTo('understudy-done', 1), setTo('understudy-coached', 1), stampRegion('understudy-at'), scene('gn-new-08-coach-1'))),
    ch('Look for the star.', out('"Where does he sleep?" you ask. Madame Okonjo-Reyes points a pencil at a door, and then, after a moment, at a different door.', setTo('understudy-done', 1), setTo('understudy-looked', 1), stampRegion('understudy-at'), scene('gn-new-08-search'))),
    ch('I\'ll go on.', out('"Me," you say. The room goes quiet. Madame Okonjo-Reyes looks at you for a very long time, and then hands you the costume, because there is no one else.', setTo('understudy-done', 1), setTo('understudy-went-on', 1), setTo('understudy-ending', 2), stampRegion('understudy-at'), scene('gn-new-08-bad'))),
  ]),

  // ---- coach: a three-step imitation game (you gesture, it copies, the gap closes) ----
  rm('gn-new-08-coach-1', 'The Understudy: First Gesture', th(), say(
    '*Step one. You raise one hand, slowly, and let it fall.*',
    '*Mime Jr. raises its hand at once, and lets it fall at once, and looks up. It is quick, and it is nothing like you.*',
    '"Again," you say. "But mean it."',
  ), [
    ch('Show it a wave goodbye.', out('You wave. It watches your face this time, not your hand. The second wave is smaller, slower, and has someone in it.', scene('gn-new-08-coach-2'))),
    ch('Show it a shrug.', out('You shrug. It copies the shoulders, then the eyebrows, then, a beat late, the little breath out. That is the shrug.', scene('gn-new-08-coach-2'))),
  ]),
  rm('gn-new-08-coach-2', 'The Understudy: Second Gesture', th(), say(
    '*Step two. You walk against an invisible wind, one hand out for the door.*',
    '*Mime Jr. walks against it too. The gap between you is a half-step now. You can hear the mops listening.*',
  ), [
    ch('Show it the invisible wall.', out('You flatten a palm on nothing. It does the same, and pushes, and for a moment the air there is solid enough that you both lean on it.', scene('gn-new-08-coach-3'))),
    ch('Show it the heavy door.', out('You heave at nothing. It heaves with you, and stumbles when you let go, and laughs, silently, with its whole body.', scene('gn-new-08-coach-3'))),
  ]),
  rm('gn-new-08-coach-3', 'The Understudy: Third Gesture', th(), say(
    '*Step three. You do not do anything. You stand very still, and you look at something that is not there.*',
    '*Mime Jr. stands still beside you. It looks at the same nothing. There is no gap now at all.*',
    '**Madame Okonjo-Reyes:** "That," she says quietly, "is the first thing it has done tonight that was not him."',
  ), [
    ch('Tell it it\'s ready.', out('"You\'re ready," you say. "Not for him. For you." It stands a little taller than it did, which is not very much, and holds that.', bondAll(1), kindness(1), show)),
  ]),

  // ---- look for the star ----
  rm('gn-new-08-search', 'The Understudy: The Costume Cupboard', th({ pokemon: 'mr-mime' }), say(
    '*The first door is a broom closet. The second is a costume cupboard, and the costume cupboard is snoring.*',
    '*A Mr. Mime, in a feathered coat, is asleep on a pile of capes. It has a bow tie. It has a cushion. It does not have a care.*',
    '*Behind you, in the doorway, Mime Jr. has stopped breathing.*',
  ), [
    ch('Wake him.', out('You put a hand on its shoulder. It wakes the way a star wakes: slowly, aware of an audience. It sees Mime Jr., and the mops, and the clock, and something crosses its face that you do not have a name for.', setTo('understudy-looked-first', 1), setTo('understudy-woke', 1), show)),
    ch('Let him sleep. Coach the little one.', out('You close the door, softly. "He sleeps," you tell Mime Jr. "You\'re up." It looks at the door, and at you, and then it straightens its back. The coaching takes a while.', setTo('understudy-looked-first', 1), setTo('understudy-coached', 1), scene('gn-new-08-coach-1'))),
  ]),

  // ---- go on yourself ----
  rm('gn-new-08-bad', 'The Understudy: The Player Goes On', th(), say(
    '*It goes exactly as badly as it sounds. You walk into the wrong wing. The invisible wall is not there.*',
    '*A mop falls over. Somewhere in the second row, a child laughs, and then another, and it is not the laugh you wanted.*',
    '*Then something small runs past your knees, onto the boards, into the light.*',
  ), [
    ch('Step aside.', out('You step into the wings. Mime Jr. does not look at you. It looks at the audience, all forty of them, and it takes a breath it has been saving all night.', show)),
  ]),

  // ---- the performance ----
  rm('gn-new-08-show', 'The Understudy: The Performance', th(), say(
    '*Nervous. A dropped invisible ball. Mime Jr. watches it roll off the edge of the stage and decides, after a long moment, to go after it.*',
    '*It finds the wall, and the wall is really there. Forty people lean forward in their seats.*',
    '*In the wings, the star watches the last minute with a face nobody can read.*',
    '*Then the applause, which for a theatre this size is a storm.*',
  ), [
    ch('Wait in the wings.', out('You wait, and when the lights come up, you are still standing there.', scene('gn-new-08-end-gate'))),
  ]),

  rm('gn-new-08-end-gate', 'The Understudy: Curtain', th({ pokemon: 'mr-mime' }), say(
    '*The curtain falls. It comes up again, and again. Mime Jr. bows too deeply and has to be helped up by a mop.*',
    '*The Mr. Mime has come to stand beside you in the wings. It has been awake the whole time, or it has just woken. You will never know which.*',
  ), [
    chIf([is('understudy-looked-first')], 'Look at the star.', out('You turn your head. It is already looking at you.', scene('gn-new-08-end-tie'))),
    chIf([not('understudy-looked-first')], 'Look at the star.', out('You turn your head. It is already looking at the stage.', scene('gn-new-08-end-walk'))),
  ]),
  rm('gn-new-08-end-tie', 'The Understudy: The Bow Tie', th({ pokemon: 'mr-mime' }), say(
    '*The Mr. Mime looks at Mime Jr., and at the stage, and at you. It reaches up and unties its bow tie.*',
    '*It puts the tie into Mime Jr.\'s hands, folded small, like a secret. Then it takes its place at the side of the stage, and bows, and lets the child have the front.*',
    '**Madame Okonjo-Reyes:** "In thirty years," she says, "I have never seen him share a curtain."',
    '*Mime Jr. asks to see the world. It follows you out into the dark, tie and all.*',
  ), [
    ch('Take it with you.', out('It rides on your shoulder the whole way, one hand on the tie, doing very small impressions of everything you pass.', MIME, setTo('understudy-ending', 1), bond(2), moment('Mime Jr. stood in the light, and the star let it.', 70))),
  ]),
  rm('gn-new-08-end-walk', 'The Understudy: The Door', th({ pokemon: 'mr-mime' }), say(
    '*The Mr. Mime looks at Mime Jr., and at the stage, and at you. Its face does not change.*',
    '*It walks out, quietly, through the stage door, and does not come back. You see its feathered coat go past the window, and then not.*',
    '**Madame Okonjo-Reyes:** "He\'ll be back for the matinee," she says, not sounding as though she believes it.',
    '*Mime Jr. asks to see the world. It follows you, and does not look back at the door.*',
  ), [
    ch('Take it with you.', out('It walks beside you, not on your shoulder. At the first crossroads it practises the empty doorway, by itself, twice.', MIME, setTo('understudy-ending', 2), moment('Mime Jr. took the stage on its own, and the star walked out.', 60))),
  ]),

  // ---- afterstory: a poster in a later region's Step 5 town ----
  gev('gn-new-08-poster', 'The Understudy: A Poster', th({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 3, effect: 'none', requires: [is('understudy-done'), notThisRegion('understudy-at'), not('understudy-poster-seen')] }), say(
    '*A poster on a town noticeboard, curling at the corners. A small theatre. A new season.*',
  ), [
    chIf([is('understudy-ending', 1, 1)], 'Read it.', out('Two faces on the poster: a Mr. Mime in a feathered coat, with no bow tie, and beside it a Mime Jr. wearing it. THE WALL IS REAL, it says. You find that you are smiling.', setTo('understudy-poster-seen', 1), bond(1))),
    chIf([is('understudy-ending', 2, 2)], 'Read it.', out('One face on the poster: a Mime Jr., mid-gesture, hand flat on a wall. THE LITTLE ONE, it says, under it. The star\'s name is not on it anywhere. You read it twice.', setTo('understudy-poster-seen', 1), bond(1))),
    chIf([not('understudy-ending')], 'Read it.', out('Your name is on the poster, in very small type, under *Special thanks.* Madame Okonjo-Reyes has spelled it wrong. You decide it is correct.', setTo('understudy-poster-seen', 1))),
  ]),
];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-08-door': {
    gn: 'gn.new.08', shape: 'Single', earliest: 'A3', home: 15, window: [13, 18], sits: 'must-see', attaches: 'instead', tags: ['Single', 'Pokémon', 'Relationship'], needs: ['night'],
    level: 'None', often: 'run', badge: 'own',
    note: 'Badge: a curtain. At night; falls back to step 5 of the next stage. Once per run. Mime Jr. joins with Curtain Call (engine.ts switchIn). The star\'s bow tie is Bond +2 and a flag; there is no bow tie item. gn-new-08-poster is the afterstory in a later region.',
  },
  'gn-new-08-poster': { gn: 'gn.new.08', shape: 'Single', earliest: 'A4', home: 5, window: [2, 10], sits: 'optional', attaches: 'town', tags: ['Story'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: the poster in the next region\'s step 5 town; the face depends on the ending.' },
};

export const CHAINS: Json[] = [];
