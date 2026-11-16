// Greenneedle new event gn.new.26: The Rival's Missing Ace (doc GREENNEEDLE_PLACED_2.md lines 215–249).
// Build: npm run co:build -- greenneedle-new-26   then   npm run co:gn
import { ch, out, type Json } from '../dsl.ts';
import { rivalTrust } from './_evil-story-kit.ts';
import { gev, gn, moment, rm, say, setTo, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.new.26  THE RIVAL'S MISSING ACE  (a chain inside one stage: three steps, 11 then 12 and 13, optional; the rival walks alongside).
// Once per run, from A6, after the rival has lost to the player at least once (core/greenneedle/missingAce.ts). No battles. Searching with
// them is three steps and a clearing; walking on leaves them to find it alone. Afterstory: in the rival's next real battle the ace leads, and bows.
// =====================================================================================================================
const TINT = '#6a7a55';
const walk = (o: Json = {}): Json => ({ tint: TINT, tags: ['Story'], effect: 'none', ...o });
const ahead = (id: string): Json => gn('ahead', { key: id });
const R = '**{rival}:**';

/** The doc's [by personality] line, in each rival's own voice (the doc's wording is the default). */
const OPENING = '{say ace-missing||bitter-challenger::"It\'s not stolen. I checked. It left." They don\'t look up.||prodigy::"It isn\'t stolen. I checked everywhere. It *left*." They say it like a ruling, and the ruling hurts.||enthusiast::"It\'s not stolen! I checked. It, um. It left." The grin they try for doesn\'t hold.||idealist::"It\'s not stolen. I checked. It left. I think it had a reason, and I don\'t know the reason."||strategist::"It\'s not stolen. I checked. It left. I have no theory for that, and I always have a theory."||protector::"It\'s not stolen. I checked. It left. I should have seen it coming. I always see it coming."||underdog::"It\'s not stolen. I checked. It left. Everyone leaves, sooner or later. I just thought it was different."||champion-chaser::"It\'s not stolen. I checked. It left. A champion\'s ace doesn\'t leave. So what does that make me?"}';

const gn26: Json[] = [
  gev('gn-new-26-door', "The Rival's Missing Ace", walk({ stop: 'event', rarity: 'rare', minStage: 6, requires: [{ kind: 'gn', test: 'rivalBeaten' }], cast: ['trainer.rival'] }), say(
    '{rival} is in the road, turning out their bag onto the stones. Berries, Balls, a map, a broken clasp. They don\'t pretend to be fine.',
    OPENING,
    '*Some rivals can\'t ask. Those ones just stand there. They are standing there now, and they are not asking.*',
  ), [
    ch('I\'ll help you look.', out(
      say('You crouch down and start putting their things back in the bag. They let you. That alone says a lot.',
        `${R} "It was my first. Before I was any good."`,
        'They walk beside you after that, close, scanning every bush. The road ahead bends toward the trees.'),
      setTo('rival-searching', 1), ahead('gn-new-26-s2'),
    )),
    ch('It\'ll come back.', out(
      say('You mean it kindly. It lands like a door closing.',
        `${R} "Sure. It'll come back." They say it flat, the way you say a thing you've decided not to believe.`,
        'They gather the bag, and go alone. You hear them calling a name, down the road, until you can\'t.'),
      rivalTrust(-1), setTo('rival-wasnt-there', 1),
    )),
    ch('Not my problem.', out(
      say('They look at you for a long moment. They don\'t argue. That is worse.',
        `${R} "Right. Of course."`,
        'They pick up the bag, and walk the other way. Later, much later, you hear them finding it alone.'),
      rivalTrust(-2), setTo('rival-wasnt-there', 1),
    )),
  ]),
  rm('gn-new-26-s2', "The Rival's Missing Ace: The Second Step", walk(), say(
    'You search the roadside together: the ditch, the hollow log, the mouth of a drainage pipe. {rival} calls its name, over and over, less loudly each time.',
    `${R} "I shouted at it. After the loss. I've never done that."`,
    'They don\'t look at you when they say it. They look at the ground, where a small set of tracks leads off the road.',
  ), [
    ch('Follow the tracks.', out('The tracks are small and careful, a Pokémon that didn\'t want to be followed and didn\'t quite try to hide. You go on, together.', ahead('gn-new-26-s3'))),
  ]),
  rm('gn-new-26-s3', "The Rival's Missing Ace: The Third Step", walk(), say(
    'The tracks cross a stream and climb a bank. {rival} stops at the top, hands on their knees. They\'re not out of breath.',
    `${R} "If it's gone, I don't think I do this any more."`,
    'You have never heard them say anything that large. A long way off, on the wind, you hear a sound: something striking something, again and again.',
  ), [
    ch('Follow the sound.', out('You push through the last of the brush. The sound gets louder, and then it gets very steady.', gn('scene', { key: 'gn-new-26-found' }))),
  ]),
  rm('gn-new-26-found', "The Rival's Missing Ace: The Clearing", walk(), say(
    'A clearing. The ace is there, alone, in the middle of it, practising the move that failed. Over and over. The same motion, the same stumble, the same start again.',
    'It hasn\'t eaten. It hasn\'t rested. It hasn\'t noticed you. {rival} has stopped breathing, a little, beside you.',
  ), [
    ch('Stay.', out(
      say(`${R} "I'm sorry. It wasn't you. It was me."`,
        'The ace turns. It looks at {rival} for a long time, then walks over, and stands against their leg like it never left. They don\'t say anything else, and neither do you.'),
      rivalTrust(2), setTo('rival-ace-found', 1), moment('Helped the rival find the ace that walked away, and stayed to see it come home.', 70),
    )),
    ch('Step away.', out(
      say('You step back through the brush, until the clearing is only light between leaves. Someone is speaking, low, a long way off. You don\'t hear what\'s said.',
        'You wait on the bank until {rival} comes up the path, eyes red, the ace walking at their heel. They nod to you once. That\'s all. It\'s enough.'),
      rivalTrust(3), setTo('rival-ace-found', 1), setTo('rival-gave-space', 1), moment('Helped the rival find the ace that walked away, and gave them space to say sorry.', 70),
    )),
  ]),
];

export const EVENTS: Json[] = gn26;
export const REMOVE: string[] = [];

/** Placement as the doc gives it (written to src/data/catalogOverhaul/placement/greenneedle.json by tools/catalog-overhaul/gn-placement.ts). */
export const PLACEMENT: Record<string, Placement> = {
  'gn-new-26-door': {
    gn: 'gn.new.26', shape: 'Chain', earliest: 'A6', home: 11, window: [11, 13], sits: 'optional', attaches: 'after', tags: ['Rival Episode'],
    level: 'No battles', often: 'run',
    dressing: { kanto: 'The Rival\'s Missing Ace', elsewhere: 'The Rival\'s Missing Ace' },
    note: 'A chain inside one stage: three steps (11, then 12 and 13), the rival walks alongside; fallback steps 16, 17, 18. Any region from A6, after the rival has lost to the player at least once. Once per run. Afterstory: in the rival\'s next battle the ace is sent out first, and bows (core/greenneedle/missingAce.ts).',
  },
};
export const CHAINS: Json[] = [];
