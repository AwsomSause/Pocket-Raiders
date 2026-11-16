// Greenneedle gn.59, The Former Champion (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 9–108).
// Build: npm run co:build -- greenneedle-59   then   npm run co:gn
import { any, ch, fight, HELD, item, join, out, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, exactly, gev, gn, is, not, notThisRegion, rm, route, say, scene, setTo, stampRegion, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const FIRE = '#6b4a2b';
const fire = (o: Json = {}): Json => ({ tint: FIRE, tags: ['Story', 'Recovery'], effect: 'none', ...o });
const gnc = (test: string, o: Json = {}): Json => ({ kind: 'gn', test, ...o });
const FIVE = ['arcanine', 'noctowl', 'tyranitar', 'lanturn', 'clefable'];
// A move no Pokémon of its kind learns any more (none of these is in the species' learnset or tutor list: tests/unit/gn-59.test.ts).
const OLD: Record<string, string> = { arcanine: 'inferno', noctowl: 'razor-wind', tyranitar: 'submission', lanturn: 'zap-cannon', clefable: 'teeter-dance' };
const END = route('ferris-last', 'gn-59-leave', 'gn-59-request');

const STORIES: { story: string[]; advice: string }[] = [
  { story: ['**Ferris:** "My first badge. I cried. Right there on the gym floor, in front of everyone. The Leader pretended not to see."', '"That was kind. I didn\'t know it was kind until I was old enough to do it for someone else."'], advice: 'Look at their feet, not their face.' },
  { story: ['**Ferris:** "A storm at sea. That Lanturn was a Chinchou then, no bigger than a loaf of bread."', '"Three ships followed its light home. It was frightened the whole way. It did it anyway."'], advice: 'When you can\'t see, stop. Don\'t guess.' },
  { story: ['**Ferris:** "That Tyranitar was a Larvitar that bit everybody. Everybody. I let it. I have the scars, look."', '"Now children climb it. It lies very still for them. It has never once bitten a child."'], advice: 'The ones that bite are the ones that stay.' },
  { story: ['**Ferris:** "The League. I won on a Tuesday. Nobody came, because it was raining."', '"I sat in the empty stands afterward with my team. It was the best day of my life. I mean that."'], advice: 'Win as if nobody\'s watching. Lose the same way.' },
  { story: ['**Ferris:** "I retired the day the Noctowl\'s eye went. It wasn\'t that it couldn\'t. It was that it *would* have."', '"It would have gone on, for me, until it dropped. That is exactly why I stopped."'], advice: 'Know when it\'s asking you to stop.' },
  { story: ['**Ferris:** "You\'ll have noticed the belt. Six clips. Five Balls. I\'ve been looking at that empty clip for sixty years."', '"Don\'t pity it. It\'s the most honest thing I own."'], advice: 'Go back for it. Even late.' },
];

const storyRoom = (i: number): Json => rm(`gn-59-s${i + 1}`, 'The Former Champion', fire(), say(...STORIES[i]!.story, `They point with the stick, at nothing, at everything. **"${STORIES[i]!.advice}"**`), [
  ch('Listen.', out('You listen. The kettle ticks as it cools. Somewhere behind the fire, a Clefable hums, and has an opinion about the tea.', setTo(`ferris-advice-${Math.min(i + 1, 6)}`, 1), scene('gn-59-after'))),
]);

const tutor = (id: string, move: string, line: string): Json => ch(line, out(`Ferris's ${id[0]!.toUpperCase()}${id.slice(1)} shows yours how it's done, patiently, three times. It takes.`, { kind: 'teachMove', move, who: 'picked' }, END), { pick: {} });
const battle = fight('**Ferris:** "With five? Go on. It\'ll be unfair. To you. I\'ve had sixty years to get five right."', {
  ...trainer('Old Ferris Hawthorne', { cls: 'veteran', team: FIVE, size: 5, lv: 1, friendly: true, rule: { gn: 'ferris' }, win: [setTo('ferris-battled', 1), gn('ferrisBest'), scene('gn-59-tutor')], lose: [setTo('ferris-battled', 1), gn('ferrisBest'), scene('gn-59-lost')] }),
});

const hereAfter = (askable: boolean): Json[] => [
  ch('Would you battle me?', battle),
  ch('Just the tea, thanks.', out('**Ferris:** "Wise. The tea\'s the better half." They pour. It is, in fact, very good tea.', END)),
  ...(askable ? [chIf([not('ferris-last')], 'What\'s the empty clip?', out('**Ferris:** "That\'s a long one. Not tonight." They tap the belt twice with the stick, gently, like knocking on a door.', scene('gn-59-after-2')))] : []),
];

const gn59: Json[] = [
  gev('gn-59-fire', 'The Former Champion', fire({ stop: 'event', rarity: 'rare', forced: true, requires: [notThisRegion('ferris-at')], pokemon: 'arcanine', remembers: [
    { id: 'lesson', when: [is('champ-lesson')], notice: 'They look at you over the kettle. "You\'ve been taught by a Champion. I can tell by how you stand." They won\'t say which of them was their pupil.' },
    { id: 'exhibition', when: [is('ex-known')], notice: 'They watch your hands. "You watched a League match closely. Someone I taught is in that stadium." They won\'t say who.' },
    { id: 'plums', when: [is('champ-told-plums')], notice: '"A plum tree," they say, to nobody, and smile. "One of mine, that. I taught them to sit under it." They won\'t say which of them.' },
  ] }), say(
    '*A fire by the road, and the kettle already on. Somebody seventy-something, in a coat with a great many pockets, and a stick that isn\'t for walking.*',
    'Behind them, a grey-muzzled Arcanine lies on its side, one eye open. A Tyranitar sits farther off, scarred and enormous, and perfectly gentle.',
    '**Old Ferris Hawthorne:** "Sit. You look like someone who\'s been doing it properly. Properly\'s tiring."',
  ), [
    ch('Sit.', out('You sit. They hand you a cup before you\'ve agreed. Their hands shake very slightly, and they pretend not to notice.', gn('ferrisArrive'), stampRegion('ferris-at'), route('ferris-story', ...STORIES.map((_, i) => `gn-59-s${i + 1}`)))),
    ch('Walk on.', out('They raise the stick, as if to wave, and decide it\'s not worth the effort. "Another time," they say. It sounds like something they\'ve said before.')),
  ]),
  ...STORIES.map((_, i) => storyRoom(i)),
  rm('gn-59-after', 'The Former Champion', fire(), say('The fire settles. Ferris leans back, and looks at the five Balls on the belt, one at a time, the way you\'d count children.', '**Ferris:** "I talk more than I battle. But they\'ve been sitting a while, and they\'d like the exercise."'), hereAfter(true)),
  rm('gn-59-after-2', 'The Former Champion', fire(), say('The empty clip swings a little on the belt. Ferris doesn\'t look at it. Everyone else does.', '**Ferris:** "Well? Battle, or tea?"'), hereAfter(false)),
  rm('gn-59-tutor', 'The Former Champion', fire({ tags: ['Story', 'Combat'] }), say('The last of the five goes back into its Ball. Ferris sits down hard, delighted, and out of breath.', '**Ferris:** "*Ha.* That was unfair to you. Now. One of mine will teach one of yours a trick. I won\'t say which was my favourite."'), [
    tutor('arcanine', 'flare-blitz', 'Arcanine: Flare Blitz.'),
    tutor('noctowl', 'air-slash', 'Noctowl: Air Slash.'),
    tutor('tyranitar', 'rock-slide', 'Tyranitar: Rock Slide.'),
    ch('The other two.', out('Ferris grins, and holds the Balls out. "Greedy. Good."', scene('gn-59-tutor-2'))),
  ]),
  rm('gn-59-tutor-2', 'The Former Champion', fire({ tags: ['Story', 'Combat'] }), '**Ferris:** "The Lanturn swims alongside the boat, when there\'s a boat. The Clefable has opinions. Choose."', [
    tutor('lanturn', 'surf', 'Lanturn: Surf.'),
    tutor('clefable', 'moonblast', 'Clefable: Moonblast.'),
  ]),
  rm('gn-59-lost', 'The Former Champion', fire({ tags: ['Story'] }), '**Ferris:** "Good. You learn nothing winning." It is said warmly, over a cup being refilled. Nothing is taken from you but the afternoon.', [ch('Drink the tea.', out('It is still very good tea. You are still, a little, annoyed. Ferris seems to approve of both.', END))]),
  rm('gn-59-leave', 'The Former Champion', fire({ tags: ['Story'] }), say('Ferris puts out the fire with the toe of a boot, and with a little sigh, as if putting out a candle.', '**Ferris:** "Go on. The road\'s better with company, but it\'s better still when it\'s moving."'), [ch('Go.', out('You look back once. Ferris is already telling the Clefable something, with the stick. It is not listening.'))]),
  rm('gn-59-request', 'The Former Champion', fire(), say(
    '**Ferris:** "I\'m not going round again. This is my last walk. There\'s one thing I want before I sit down for good."',
    '"Not a rare one. You\'ll laugh."',
    '*They take a Ball out of an inside pocket. It\'s old. The paint\'s worn off where a thumb would go.*',
    '**Ferris:** "My first. A {cast:ferris-first}. Caught it with my own two hands, behind my mother\'s house. I was eight."',
    '"I lost it. Not a battle. A river in flood, and I was showing off. I never caught another of its kind. Couldn\'t."',
    '"I\'d like to. Now. One of them. Not to replace it. Just so the belt\'s full when I hang it up."',
  ), [
    ch('Find one with me.', out('Ferris is standing before you finish. "Not a rare one," they say again, as if you might have forgotten how to laugh. There\'s a patch of ordinary grass nearby.', scene('gn-59-grass'))),
    ch('I can\'t. I\'m sorry.', out('**Ferris:** "No one\'s to blame for a long walk." They sit back down. One hand goes to the empty clip, and stays there.')),
  ]),
  rm('gn-59-grass', 'The Former Champion: The Grass', fire({ tags: ['Story'] }), say(
    '*A patch of ordinary grass, at the edge of the road. Somewhere in it, a {cast:ferris-first}, being ordinary.*',
    '*Ferris can\'t make the throw. Their hands aren\'t what they were.*',
  ), [
    ch('I\'ll catch it for you.', fight('You go into the grass alone. Ferris stays behind, holding the old Ball in both hands, and doesn\'t say a word.', { ...wild({ species: ['@ferris-first'], lv: 0, win: [gn('ferrisHand'), setTo('ferris-how', 1), setTo('ferris-request-caught', 1), route('ferris-handed', 'gn-59-grass', 'gn-59-clip')] }), caught: [gn('ferrisHand'), setTo('ferris-how', 1), setTo('ferris-request-caught', 1), route('ferris-handed', 'gn-59-grass', 'gn-59-clip')] })),
    ch('Throw. I\'ll steady your arm.', out('You stand behind them, a hand under one elbow. Ferris is so light. Ferris is shaking. They throw. It goes in, first try. Ferris laughs so hard they have to sit down.', setTo('ferris-how', 2), setTo('ferris-request-steadied', 1), scene('gn-59-clip')), {
      prompt: { id: 'ferris-steady', needs: 'ok' },
      fail: out('It goes wide, and wider, and in on the third try. Ferris laughs so hard they have to sit down, and you do too.', setTo('ferris-how', 2), setTo('ferris-request-steadied', 1), scene('gn-59-clip')),
    }),
    ch('Let it come to you.', out('Ferris sits in the grass, and holds out a hand, and waits. A long time. One comes. It sniffs the old Ball. It climbs into Ferris\'s lap. No throw at all.', setTo('ferris-how', 3), setTo('ferris-request-waited', 1), scene('gn-59-clip'))),
  ]),
  rm('gn-59-clip', 'The Former Champion', fire({ remembers: [
    { id: 'caught', when: [exactly('ferris-how', 1)], notice: 'Ferris takes the Ball from you in both hands. "...It\'s lighter than I remember," they say. "Everything is."' },
    { id: 'lost', when: [is('lost-mon')], notice: 'Ferris looks at you for a while. Somehow, they know. "You too. You\'ll want to go back for it. Even late."' },
  ] }), say(
    '*Ferris clips the Ball on. Six.*',
    '**Ferris:** "There. Sixty years. That\'s better."',
    'Ferris takes off the hat, and looks inside it, as if checking for something, and holds it out.',
    '**Ferris:** "Worn thin at the brim. It\'ll make anything wearing it grow faster. Go on. I won\'t be needing it where I\'m sitting."',
  ), [
    ch('Take the hat.', out('It smells of woodsmoke and old tea. It is warmer than it should be.', item('ferris-hat'))),
    chIf([is('ferris-battled')], 'Take the hat. Ask {cast:ferris-best} to come.', out('One of the five gets up, stiffly, and looks at you for a long moment. Then at Ferris. Ferris nods. It comes with you, old, and not done yet.', item('ferris-hat'),
      ...FIVE.map((id, i) => gn('when', { key: 'ferris-best', min: i + 1, max: i + 1, then: [join({ species: [id], lv: 0 }), { kind: 'teachMove', move: OLD[id]!, species: id }] }))
    )),
  ]),
  gev('gn-59-stop', 'Fog on the Road', { stop: 'event', rarity: 'uncommon', callback: true, tint: '#7d8a8a', tags: ['Story', 'Mystery'], effect: 'fog', requires: [gnc('thisRegion', { key: 'ferris-at' }), exactly('ferris-advice-2', 1), not('ferris-stop')] }, say(
    '*Fog, thick as wool. You can\'t see your own boots. Something is out there. You can hear it breathing.*',
    'An old voice comes back to you, dry and patient, from a fire some way behind: *When you can\'t see, stop. Don\'t guess.*',
  ), [
    ch('Stop.', out('You stand perfectly still. The fog thins, a little, the way it does for people who wait. Something has been left in the road, plain as day. Free.', setTo('ferris-stop', 1), any(...HELD), bond(1))),
    ch('Keep walking.', out('You pick your way through. Whatever was hiding stays hidden. Behind you, the fog closes up like a door.', setTo('ferris-stop', 1))),
  ]),
];

export const EVENTS: Json[] = gn59;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-59-fire': {
    gn: 'gn.59', shape: 'Single', earliest: 'A4', home: 10, window: [8, 13], sits: 'must-see', attaches: 'rest', tags: ['Region Story'],
    level: 'The optional battle: A+1, against a team that is one Pokémon short', often: 'region', badge: 'own',
    dressing: { kanto: 'The Former Champion', elsewhere: 'The Former Champion' },
    note: 'Badge: a worn hat. At a + node, once per region. Story and advice by region (6th and on: the empty clip); the request in the last region. Advice pays off in the same region (core/greenneedle/ferris.ts). No cross-run memory: "a later run" is not read.',
  },
  'gn-59-stop': {
    gn: 'gn.59', shape: 'Single', earliest: 'A4', home: 6, window: [2, 12], sits: 'optional', attaches: 'before', tags: ['Region Story'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'Fog on the Road', elsewhere: 'Fog on the Road' },
    note: 'The 2nd region\'s advice: a fog stop this region where "Stop" shows the hidden thing, free.',
  },
};
export const CHAINS: Json[] = [];
