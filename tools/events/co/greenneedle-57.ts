// Greenneedle gn.57: The Pokémon Impersonator (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 283-368).
// Build: npm run co:build -- greenneedle-57   then   npm run co:gn
import { fight, flag, out, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, is, moment, not, notThisRegion, pick, rm, roll, route, say, scene, setTo, stampRegion, type Placement } from './_gn.ts';
import { rivalTrust } from './_evil-story-kit.ts';

export { CATEGORY } from './_gn.ts';

// A Zoroark as a famous Champion. Three tells, each once; the party can tell from the first moment. Exposed: a battle (A+1) whose
// Illusion opens as the player's own lead (core/greenneedle/impersonator.ts). Played along: it walks with the player, then a rest by
// the fire. Either way it can join with Many Faces, and then imitates a rival, a Champion or the player once a region.
const TINT = '#6d3b4a';
const crowd = (o: Json = {}): Json => ({ tint: TINT, tags: ['Mystery', 'Story'], effect: 'none', cast: ['trainer.ace-trainer'], ...o });
const reveal = (o: Json = {}): Json => ({ tint: TINT, tags: ['Mystery', 'Pokémon'], pokemon: 'zoroark', effect: 'none', ...o });

const TELLS = 'impersonator-tells-seen';
const noticed = (): Json => flag(TELLS, 1);

const impFight = (text: string): Json => fight(text, {
  ...eitherWay(wild({ species: ['zoroark'], lv: 1, win: [gn('impClaim'), scene('gn-57-beaten')] })), exact: true, rule: { gn: 'impersonator' }, lose: [scene('gn-57-escaped')],
});

const gn57: Json[] = [
  gev('gn-57-crowd', 'The Pokémon Impersonator', crowd({ stop: 'event', rarity: 'rare', requires: [not('impersonator-met')] }), say(
    '*A crowd. In the middle of it, a face from every poster in the region, signing things.*',
    '**"The Champion":** "A trainer! Come, come. Let me look at your team. I\'ve a moment. I always have a moment for the young."',
    'Your lead has gone stiff. It will not take the hand that is offered to it.',
  ), [
    ch57('Let it look at your team.', out('The Champion walks down your line, nodding, touching each head. Your lead flinches away from the hand, and does not stop watching it.', setTo('impersonator-met', 1), scene('gn-57-advice'))),
    ch57('Walk on.', out('The Champion waves, warmly, and goes back to signing. Your lead only relaxes when the crowd is out of sight.', setTo('impersonator-met', 1))),
  ]),
  rm('gn-57-advice', 'The Pokémon Impersonator: Advice', crowd(), say(
    '**"The Champion":** "Water beats Fire, and Fire beats Grass, and Grass beats Rock. There. Everything I know, and it fits on a napkin."',
    '"Always lead with your strongest. Show them your teeth. Never let them see you tired."',
    '"And when you\'re cornered, make yourself look bigger. Puff up! Like so!" The crowd laughs, and claps, and it all sounds nearly right.',
  ), [ch57('Keep listening.', out('Nearly right. Everything it says is nearly right. You can\'t quite say why that bothers you.', scene('gn-57-tell-1')))]),
  rm('gn-57-tell-1', 'The Pokémon Impersonator: The Ace', crowd(), say(
    '**"The Champion":** "My ace, now. Everyone asks about my ace. Marvellous creature. A {imp:wrong}, since you ask. Oh, no. No, of course not. A {imp:ace}. I\'ve said {imp:wrong} all my life, it\'s a nervous habit."',
    'It does not blink. It does not stumble. The correction comes out smooth as oil.',
  ), [
    ch57('…wait.', out('The real Champion has never kept anything called a {imp:wrong}. You\'d have heard. Everybody would have heard.', noticed(), scene('gn-57-tell-2'))),
    ch57('Nod along.', out('You nod. A slip of the tongue, that\'s all. Everybody has them.', scene('gn-57-tell-2'))),
  ]),
  rm('gn-57-tell-2', 'The Pokémon Impersonator: The Sun', crowd(), say(
    'The clouds part. The square floods with light, and every one of the crowd throws a long dark shadow across the stones.',
    'For one frame, the Champion throws none at all. Then the shadow is there again, exactly as long as it should be.',
  ), [
    ch57('…wait.', out('You saw it. A whole crowd of shadows, and one missing. You\'re almost sure. Your lead is certain.', noticed(), scene('gn-57-tell-3'))),
    ch57('Nod along.', out('The light must have flickered. These old squares play tricks. You turn back to the face on the posters.', scene('gn-57-tell-3'))),
    chIf([is(TELLS)], 'You\'re not the Champion.', out('The crowd goes quiet, one head at a time, as the word travels back through it.', setTo('impersonator-exposed', 1), scene('gn-57-fight'))),
  ]),
  rm('gn-57-tell-3', 'The Pokémon Impersonator: The Reeds', crowd(), say(
    '**"The Champion":** *looks at your lead, and breathes in, and smiles.* "That one was caught by the river, wasn\'t it? You can smell the reeds on it."',
    'You never said. You never said a word about a river, or about where you found it.',
  ), [
    ch57('…wait.', out('Nobody smells reeds on a Pokémon in a city square. Not unless they live in them.', noticed(), scene('gn-57-verdict'))),
    ch57('Nod along.', out('A good guess, you tell yourself. The Champion has seen ten thousand teams. You say nothing.', scene('gn-57-verdict'))),
    chIf([is(TELLS)], 'You\'re not the Champion.', out('The face stays kind. The crowd does not.', setTo('impersonator-exposed', 1), scene('gn-57-fight'))),
  ]),
  rm('gn-57-verdict', 'The Pokémon Impersonator: What You Say', crowd(), say(
    'The signing has stopped. The Champion is waiting, hands folded, smiling at you the way a poster smiles.',
    'The crowd waits too. Your lead stands very close to your leg.',
  ), [
    ch57('You\'re not the Champion.', out('The face flickers. The crowd gasps. Something tall and dark and red-maned stands where the Champion was, looking hunted.', setTo('impersonator-exposed', 1), scene('gn-57-fight'))),
    ch57('Thank you. That\'s good advice.', out('It blinks. It was ready for a fight, or a scream, and not for this. For one moment it forgets which face it is wearing.', setTo('impersonator-played', 1), scene('gn-57-walk'))),
    ch57('Can I ask you something only the Champion would know?', out('The smile holds. The silence does not.', scene('gn-57-ask'))),
  ]),
  rm('gn-57-ask', 'The Pokémon Impersonator: A Question', crowd(), say(
    '**"The Champion":** "Oh! Well, now. That would be. The, ah. Yes. A long, long time ago. It rained, I believe. Everyone was very brave."',
    'It guesses. It guesses charmingly. Then it looks at you, and it knows that you know, and it waits to see what you will do.',
  ), [
    ch57('You\'re not the Champion.', out('You say it quietly. It nods, as if you had handed it something it had been carrying for a long time.', setTo('impersonator-exposed', 1), scene('gn-57-fight'))),
    ch57('Play along.', out('You smile back, and ask nothing else. It stares at you. Then, very slowly, it smiles.', setTo('impersonator-played', 1), scene('gn-57-walk'))),
  ]),
  rm('gn-57-fight', 'The Pokémon Impersonator: Exposed', reveal(), say(
    'Something tall and dark and red-maned stands where the Champion was. It is thin, and cornered, and it has just made itself look much bigger.',
    'And behind it, as if nothing had happened, stands a copy of your own lead.',
  ), [ch57('Battle.', impFight('Its disguise is your own lead, down to the scuffs. Hit it, and the borrowed shape comes apart.'))]),
  rm('gn-57-escaped', 'The Pokémon Impersonator: Gone', reveal(), say(
    'It is faster than you are. A face drops, and another goes up, and by the time the dust clears it is a stranger in a hat, walking away.',
    'Your lead growls once at the stranger, and lets it go.',
  ), [ch57('Let it go.', out('You let it go. Somewhere, a very thin red-maned something is still being kind to people who feed it.'))]),
  rm('gn-57-beaten', 'The Pokémon Impersonator: Beaten', reveal(), say(
    'The crowd is gone before the dust is. Whatever was the Champion looks at you, hunted and furious, and a little relieved.',
    'It has been careful for a very long time. It has been so tired.',
  ), [ch57('Go on.', out('You hold out your hand, and it takes it, because nobody has done that without wanting something.', moment('The Impersonator, who had been the Champion all along, came with you.', 80)))]),
  rm('gn-57-walk', 'The Pokémon Impersonator: Walking Together', crowd(), say(
    'It walks with you a while, still as the Champion, getting things a little more wrong. It sniffs a signpost, thoughtfully.',
    'It is startled by a door that opens by itself. It tries to look dignified about it.',
  ), [ch57('Walk on.', out('You walk on together, the Champion and you, and the lead keeps a careful step apart, and watches.', moment('Played along with a very bad Champion.', 65)))]),
  gev('gn-57-fire', 'The Pokémon Impersonator: By the Fire', reveal({ stop: 'event', rarity: 'uncommon', callback: true, requires: [is('impersonator-played'), not('impersonator-joined')], cast: ['trainer.ace-trainer'] }), say(
    'At the rest, it is still there, as the Champion, sitting by your fire, holding a mug the wrong way up.',
    '*Your lead finally walks over and sniffs it. It sniffs back. That is not how people say hello.*',
    '*It looks at you. The face comes off, slowly, like a coat. It is thin. It has been a person for a long time because people get fed.*',
  ), [
    ch57('You can stay. As you.', out('It looks at you for a long time. Then it laughs, once, startled, and sits down properly. Your lead lies down against its side.', gn('impJoin'), moment('Let the Impersonator stay, as itself.', 85))),
    ch57('Who taught you to do that?', out('It becomes a child for a second. Then an old woman. Then nobody. It was a lot of people. It was always going to be a lot of people. It stays.', gn('impJoin'), moment('The Impersonator stayed, and was a lot of people.', 85))),
    ch57('Go on, then.', out('It stands, and nods, and goes into the dark, and for a while it is a boy, and then a gull, and then gone.', setTo('impersonator-left', 1))),
  ]),
  gev('gn-57-later', 'The Pokémon Impersonator: Someone You Know', crowd({ stop: 'event', rarity: 'uncommon', requires: [is('impersonator-joined'), notThisRegion('impersonator-later')], cast: [] }), say(
    'At the edge of the light, someone you know is walking up with a hand raised. You are almost sure you know them.',
  ), [ch57('Look closer.', out('You do.', stampRegion('impersonator-later'), roll('imp-real', 25), pick('imp-guise', 1, 1, 1), route('imp-guise', 'gn-57-rival', 'gn-57-champion', 'gn-57-player')))]),
  rm('gn-57-rival', 'The Pokémon Impersonator: A Friendly Word', crowd({ cast: ['trainer.ace-trainer'], remembers: [
    { id: 'real', when: [is('imp-real')], notice: 'Your lead is on its feet, hackles up, the way it always is around them.' },
    { id: 'fake', when: [not('imp-real')], notice: 'Your lead sits by your boot, perfectly relaxed. It has never once been relaxed around them.' },
  ] }), say(
    '**The rival:** "Hey. You\'re doing well. I always knew you would. I\'m glad it\'s you."',
    'They have never said a kind thing in their life without a joke wrapped round it.',
  ), [
    ch57('That\'s you, isn\'t it.', out('The face drops, delighted. The Zoroark claps its own hands. It had practised the voice for a whole week.', bond(1), flag('impersonator-caught-out', 1)), {
      branches: [{ when: [is('imp-real')], text: 'It was the real rival. They stare at you, then at the ground. In your Ball, the Zoroark is audibly laughing.', effects: [rivalTrust(-1)] }],
    }),
    ch57('Thanks. That means a lot.', out('They nod, pleased and puzzled. Your lead watches them go.')),
  ]),
  rm('gn-57-champion', 'The Pokémon Impersonator: A Surprise Visit', crowd({ remembers: [
    { id: 'lesson', when: [is('champ-lesson')], notice: '**The Champion:** "It did me? The Zoroark? Was it *good?* Was the *hair* right?" The real one, hearing about it later, was delighted.' },
  ] }), say(
    '**The Champion:** "A surprise visit! My ace, a {imp:ace}. I got it right this time. I\'ve been practising."',
    'The sun comes out. The shadow is missing again. It is the only thing it has not practised.',
  ), [
    ch57('That\'s you, isn\'t it.', out('The face drops, delighted to be caught. "Oh, you\'re *good*," says the Zoroark, and means it.', bond(1), flag('impersonator-caught-out', 1))),
    ch57('What an honour.', out('"Oh, the honour\'s mine," it says, and bows too low, and you are not at all sure who has been fooled.')),
  ]),
  rm('gn-57-player', 'The Pokémon Impersonator: At the Counter', crowd({ remembers: [
    { id: 'twin', when: [is('ditto-twin')], notice: 'Then the Ditto arrives, as you as well. Two of you, both as you, at one rest. Your lead gets up, and leaves.' },
  ] }), say(
    'At the shop, a second you is already at the counter, buying the thing you were about to buy. It has your coat. It has your hair.',
    'The shopkeeper looks from one of you to the other. Your lead sits at your feet. Nobody is sitting at the other one\'s.',
  ), [
    ch57('That\'s you, isn\'t it.', out('Your own face grins at you, and drops. "Oh, I wanted *so much* to see how it feels," says the Zoroark.', bond(1), flag('impersonator-caught-out', 1))),
    ch57('Let it buy it.', out('It buys it, and hands it to you, and bows. The shopkeeper looks very tired.')),
  ]),
];

/** `ch` with the Greenneedle text wrapper kept short. */
function ch57(label: string, success: Json, o: Json = {}): Json {
  return { label, ...(o.branches ? { branches: o.branches } : {}), success };
}

export const EVENTS: Json[] = gn57;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-57-crowd': {
    gn: 'gn.57', shape: 'Single', earliest: 'A6', home: 8, window: [6, 11], sits: 'optional', attaches: 'before', tags: ['Mystery Episode'],
    level: 'A+1 if exposed', often: 'run', badge: 'own',
    note: 'Badge: a laurel that looks exactly like the Champion\'s Training Session\'s. Once per run, then it recurs.',
  },
  'gn-57-fire': { gn: 'gn.57', shape: 'Single', earliest: 'A6', home: 4, window: [1, 8], sits: 'optional', attaches: 'rest', tags: ['Mystery Episode'], level: 'None', often: 'run', badge: 'own', note: 'At the next rest after playing along.' },
  'gn-57-later': { gn: 'gn.57', shape: 'Single', earliest: 'A7', home: 6, window: [2, 14], sits: 'optional', attaches: 'rest', tags: ['Mystery Episode'], level: 'None', often: 'region', badge: 'own', note: 'Once a region after it joins: it imitates the rival, a Champion or the player.' },
};

export const CHAINS: Json[] = [];
