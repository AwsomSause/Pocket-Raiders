// Greenneedle gn.new.09: The Last Stop (doc GREENNEEDLE_PLACED_1.md lines 340-381).
// A night train, a pseudo stage of three carriages (the platform is the door). The dining car's Gengar stakes one of the lead's moves for one of
// three face-up cards; the sleeper hides a Litwick, a Yamask's mask or your own folded coat; the mail car holds a letter for one of your Pokémon.
// The conductor's ticket carries a date; on that stage the platform is back. Rules code: src/core/greenneedle/laststop.ts.
// Build: npm run co:build -- greenneedle-new-09   then   npm run co:gn
import { ch, flag, item, join, heal, out, room, type Json } from '../dsl.ts';
import { bond, bondAll, chIf, gev, gn, is, kindness, leavePseudo, moment, not, pick, rm, sameStage, say, scene, setTo, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TRAIN_TINT = '#1c2236';
const train = (o: Json = {}): Json => ({ tint: TRAIN_TINT, tags: ['Dungeon', 'Story', 'Recovery'], effect: 'float', ...o });

const DINING = 'gn-new-09-dining';
const CARDS = 'gn-new-09-cards';
const SLEEPER = 'gn-new-09-sleeper';
const MAIL = 'gn-new-09-mail';
const END = 'gn-new-09-end';

/** The Drifloon that holds the lantern, with the move Last Stop. */
const LANTERN: Json = { ...join({ species: ['drifloon'], lv: 0 }), moves: ['last-stop'], mark: 'lantern-drifloon' };

const gn09: Json[] = [
  // ---- the platform (the door) ----
  gev('gn-new-09-door', 'The Last Stop', train({
    stop: 'event', rarity: 'rare', requires: [not('gn-new-09-seen')],
  }), say(
    '*A platform that was not on any map. The clock above it has no hands. A Drifloon floats at the far end, holding a lantern as if it were a candle.*',
    '*A train arrives without a sound. The doors open.*',
    '**Conductor, a Dusknoir:** It holds out a hand for a ticket. You do not have one. It gives you one.',
  ), [
    ch('Board.', out(
      'The ticket is warm, like something that has just been held. You step on. The doors close behind you and the platform is gone from the window.',
      flag('gn-new-09-seen'), flag('last-stop-boarded'), gn('lsTicket'), gn('lsDeal'), gn('lsAddress'), room(DINING),
    )),
    ch('Stay on the platform.', out(
      'The doors close without a sound. The train pulls away, and the platform goes with it. The lantern Drifloon watches you the whole time.',
      flag('gn-new-09-seen'),
    )),
  ]),

  // ---- carriage 1: the dining car ----
  rm(DINING, 'The Last Stop: The Dining Car', train({ cast: ['trainer.gengar'] }), say(
    'White cloths, one lamp, and a table laid for a guest who has not arrived. A **Gengar** shuffles along the aisle without quite touching the floor.',
    'It taps **{cast:ls-stake}** on your lead\'s summary, very lightly, as if checking a pulse. Then it fans three cards on the cloth, face up.',
    '**{cast:ls-card-1}. {cast:ls-card-2}. {cast:ls-card-3}.** It grins and spreads its hands. Nothing hidden. It is not a gamble. It is a trade, with a straight face.',
  ), [
    ch('Bet the move.', out('You nod. The Gengar slides the card for your move across the cloth, and it does not even look pleased. It looks fair.', scene(CARDS))),
    ch('Watch.', out('You watch. The Gengar deals the three cards to an empty chair, takes the empty chair\'s move, and shakes its own hand. Then it bows to you, and you go on.', room(SLEEPER))),
  ]),
  rm(CARDS, 'The Last Stop: The Cards', train({ tags: ['Story'] }), say(
    'The three cards lie face up. **{cast:ls-stake}** goes into the middle of the cloth. One of the three comes back, and the other two go back in the deck.',
    '**{cast:ls-card-1}. {cast:ls-card-2}. {cast:ls-card-3}.**',
  ), [
    ch('The left card.', out('The Gengar turns it over. It is exactly what it said. It tips an invisible hat, and you go on.', gn('lsTake', { n: 1 }), room(SLEEPER))),
    ch('The middle card.', out('The Gengar turns it over. It is exactly what it said. It tips an invisible hat, and you go on.', gn('lsTake', { n: 2 }), room(SLEEPER))),
    ch('The right card.', out('The Gengar turns it over. It is exactly what it said. It tips an invisible hat, and you go on.', gn('lsTake', { n: 3 }), room(SLEEPER))),
  ]),

  // ---- carriage 2: the sleeper ----
  rm(SLEEPER, 'The Last Stop: The Sleeper', train(), say(
    'The corridor is narrow and the berths are curtained. Something is breathing slowly under every blanket. The lamps are turned down so nobody has to see.',
    'Whoever sleeps here has been sleeping a long time, and has no plans to stop.',
  ), [
    ch('Lift one.', out(
      'You lift the corner of the nearest blanket, the way you would for a child, and hold your breath.',
      pick('ls-lift', 1, 1, 1),
      when('ls-lift', { min: 1, max: 1 }, [scene('gn-new-09-litwick')]),
      when('ls-lift', { min: 2, max: 2 }, [scene('gn-new-09-mask')]),
      when('ls-lift', { min: 3, max: 3 }, [scene('gn-new-09-coat')]),
    )),
    ch('Tiptoe.', out('You walk the length of the carriage on the sides of your feet. Nobody stirs. Behind you something sighs, relieved, in its sleep.', room(MAIL))),
  ]),
  rm('gn-new-09-litwick', 'The Last Stop: A Sleeping Litwick', train({ cast: [], tags: ['Pokémon', 'Story'] }), say(
    'A Litwick, curled around its own small flame, which burns very low. It has been asleep so long that the wax has pooled round it like a blanket.',
    'Its flame leans toward you as you breathe, the way a plant leans toward a window.',
  ), [
    ch('Wake it gently.', out(
      'You say its name, or the name you would give it. The flame stands up straight. It wakes, looks at you, and does not look afraid. It climbs into your arms as if it had been waiting for the stop.',
      { ...join({ species: ['litwick'], lv: 0 }), mark: 'sleeper-litwick' }, room(MAIL),
    )),
    ch('Let it sleep.', out('You pull the blanket back up to its chin. The flame steadies, and a little warmth stays on your hands for a long time.', kindness(1), room(MAIL))),
  ]),
  rm('gn-new-09-mask', 'The Last Stop: A Yamask\'s Mask', train({ cast: [], tags: ['Pokémon', 'Story'] }), say(
    'Not a Yamask. Only its mask, set on the pillow, face up, where a face would go. It is thin and old, and the eyes have been worn smooth by looking.',
    'It is warm. Someone put it down very carefully and meant to come back.',
  ), [
    ch('Take the mask.', out('You slip it into your pocket. It weighs nothing. Somewhere down the carriage a Yamask turns over, and does not wake.', item('spell-tag'), room(MAIL))),
    ch('Put it back.', out('You set it straight on the pillow, the way it was. Whoever is somewhere in the carriage lets out a breath it had been holding for years.', kindness(1), room(MAIL))),
  ]),
  rm('gn-new-09-coat', 'The Last Stop: Your Coat', train({ cast: [], tags: ['Recovery', 'Story'] }), say(
    'Your coat. The one you left on a bench, or a chair, or the back of a door, somewhere, a long time ago. Folded in four, the way you never fold things.',
    'There is nobody here who could have done that. It still smells like the road.',
  ), [
    ch('Put it on.', out('It fits as it always did. A tiredness you did not know you were carrying slides off your shoulders and out the window, into the dark.', heal(0.25), room(MAIL))),
    ch('Leave it folded.', out('You smooth the top of it once, with the flat of your hand. It stays where it is. You are not sure it was yours. You go on.', room(MAIL))),
  ]),

  // ---- carriage 3: the mail car ----
  rm(MAIL, 'The Last Stop: The Mail Car', train({ tags: ['Story'] }), say(
    'Sacks and sacks of letters, sorted by no system you can see. Stamps from places that have changed their names. Every one is marked: *undelivered.*',
    'One has fallen out of its sack onto the boards, and it is addressed, in handwriting from before you, to **your {cast:ls-letter}**.',
    'The envelope is old. Whoever wrote it pressed hard enough to mark the paper underneath.',
  ), [
    ch('Read it aloud.', out(
      '*"I couldn\'t keep you. I hope whoever has you knows about the thing with your ear."*\n\nYou stop. It is quiet in the carriage. Your Pokémon does not say anything at all. It leans on your leg, hard, and stays there.',
      bond(2), gn('leadBoost', { type: 'spe', n: -1 }), scene(END),
    )),
    ch('Give it to them unread.', out(
      'You hold it out. Your Pokémon takes it in both hands, in whatever it has for hands, and does not open it. It holds the letter all night, and it does not let go.',
      bond(1), scene(END),
    )),
    ch('Leave it.', out('You set it back in the sack, address up, where somebody who knows how to deliver it will find it. You do not look back. You look back.', scene(END))),
  ]),

  // ---- the end of the line ----
  rm(END, 'The Last Stop: The End of the Line', train({ tags: ['Pokémon', 'Story'] }), say(
    'The train slows. No whistle, no brakes. The conductor comes down the aisle, and the Dusknoir punches your ticket with a small, careful click, and gives it back.',
    '*The date on it has not happened yet.*',
    'The Drifloon with the lantern floats beside the door. It looks at the ticket, and at you, and its light goes warm. It holds out its string.',
  ), [
    ch('Take the string.', out(
      'The Drifloon drifts down, holding the lantern high. The doors open on a road you know, in the morning, and the train is not behind you when you turn.',
      flag('last-stop-ticket'), LANTERN, moment('Rode the Last Stop, and came back with a lantern. The ticket\'s date has not happened yet.', 70), setTo('last-stop-rode-here', 1), leavePseudo(),
    )),
  ]),

  // ---- the afterstory: the ticket's date ----
  gev('gn-new-09-return', 'The Last Stop, Again', train({
    stop: 'event', rarity: 'rare', callback: true,
    requires: [is('last-stop-boarded'), sameStage('ls-date'), not('gn-new-09-returned')],
  }), say(
    '*The platform is back. The clock above it has hands now. They show the day on your ticket, and the day is today.*',
    '**Conductor, a Dusknoir:** It looks at the ticket in your pocket, and at you, and tips its cap. Something about its face has been put right.',
  ), [
    ch('Show the ticket.', out(
      'The Dusknoir punches it a second time, with a click like a small door closing. Then it takes it, and folds it into its sleeve, and gives you a nod that cost it something.\n\nThe lantern Drifloon, if it is with you, glows all the way down the platform.',
      flag('gn-new-09-returned'), bondAll(1), moment('The Last Stop came back on the day on the ticket. The conductor kept it, and nodded.', 60),
    )),
    ch('Leave it on the platform.', out('You walk past. Behind you the clock loses its hands and the train goes back into the dark.', flag('gn-new-09-returned'))),
  ]),
];

export const EVENTS: Json[] = [...gn09];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-09-door': {
    gn: 'gn.new.09', shape: 'Pseudo Stage', earliest: 'A6', home: 13, window: [11, 15], sits: 'side-branch', attaches: 'instead', tags: ['Pseudo Stage', 'Exploration'], needs: ['night'],
    level: 'A+0 (no battle)', often: 'run', badge: 'None',
    dressing: { kanto: 'The Last Stop', elsewhere: 'The Last Stop' },
    note: 'Three carriages. The platform is not on the stage map until the player is standing on it. Fallback: step 8, side branch, a node added if no three-node column exists. Night only.',
  },
  'gn-new-09-return': {
    gn: 'gn.new.09', shape: 'Single', earliest: 'A6', home: 13, window: [11, 15], sits: 'side-branch', attaches: 'instead', tags: ['Exploration'], needs: ['night'],
    level: 'None', often: 'run', badge: 'None',
    note: 'Afterstory: on the stage that matches the date on the ticket (5 stages after boarding), the platform is back.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_last_stop', name: 'The Last Stop', entry: 'gn-new-09-door', themeId: 'psychic-ghost', tint: TRAIN_TINT, mood: 'night train', start: 'opened' },
];
