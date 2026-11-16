// Greenneedle gn.58 Old Friend Returns (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 369–450). Rules: core/greenneedle/oldfriend.ts.
// Build: npm run -s co:build -- greenneedle-58   then   npm run -s co:gn
import { ch, fight, out, wild, type Json } from '../dsl.ts';
import { bond, chIf, gev, gn, is, moment, not, rm, say, scene, setTo, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#8a7a5a';
const friend = (o: Json = {}): Json => ({ tint: TINT, tags: ['Pokémon', 'Relationship'], effect: 'none', ...o });
const due: Json = { kind: 'gn', test: 'ofDue' };
const many: Json = { kind: 'gn', test: 'ofMany' };

// What it does, by why it was let go (of-why: 1 happier, 2 no room, 3 not strong enough, 4 no reason).
const DO: Json[] = [
  when('of-why', { min: 3, max: 3 }, [scene('gn-58-weak')]),
  when('of-why', { min: 1, max: 2 }, [scene('gn-58-help')]),
  when('of-why', { min: 4, max: 4 }, [scene('gn-58-none')]),
];
/** "Come with me?": it decides by its old Bond. Above Friendly: yes. Below: it walks a little way, and stops. That is its answer. */
const COME = (extra: Json[] = []): Json => out('It looks at you for a long moment. Then it looks at the road it was on.',
  when('of-fond', { min: 1 }, [gn('ofJoin'), setTo('oldfriend-rejoined-now', 1), moment('An old friend came back, and chose to stay.', 80), ...extra], 'It steps forward. Once. Then it leans its whole weight against your leg, the way it always did. It is yours, and it chose to be.'),
  when('of-fond', { min: 0, max: 0 }, [], 'It walks beside you a little way. Then it stops, and looks back at where it came from, and does not follow. That is its answer. You do not ask again.'));

const oneOnOne = (text: string): Json => fight(text, {
  ...wild({ species: ['@old-friend'], lv: 0, win: [gn('unbench'), scene('gn-58-nod')] }), exact: true, friendly: true, rule: { noCatch: true }, lose: [gn('unbench'), scene('gn-58-nod')],
}, gn('ofReplacer'), gn('bench'));

export const EVENTS: Json[] = [
  gev('gn-58-friend', 'Old Friend Returns', friend({ stop: 'event', rarity: 'rare', forced: true, requires: [due], remembers: [
    { id: 'boat', when: [is('lantern-boat-floated')], notice: 'In its mouth, small and wet and folded, is a paper boat. The one you floated for it, believing it gone. It is not gone. It brought it back.' },
    { id: 'many', when: [many], notice: 'It is not alone. At a respectful distance, others have stopped on the road. Pawprints you remember, one after another. They are waiting their turn.' },
  ] }), say(
    '*Something on the road. It was going somewhere else. It has stopped.*',
    '*It tilts its head, the way it always did. You know that tilt. You have known it all this time.*',
    '*It recognises you. Of course it does.*',
  ), [
    ch('Kneel down, and hold out a hand.', out('You kneel in the dust. It crosses the road to you, slowly, as if afraid to be wrong.',
      gn('ofPick'),
      when('of-trainer', { min: 1 }, [scene('gn-58-minna')]),
      when('of-trainer', { min: 0, max: 0 }, DO))),
  ]),
  rm('gn-58-minna', 'Old Friend Returns: A New Trainer', friend(), say(
    '*A girl of about twelve is hurrying up the road, a Poké Ball held tight. She stops short.*',
    '**Minna Lindgren:** "Do you two know each other? It\'s never done that. It\'s never *stopped* for anyone."',
    '*She looks from {oldfriend:name} to you. She is waiting to be told. Nothing. Or everything. Your choice.*',
  ), [
    ch('It used to be mine.', out('She goes quiet. "Did you... not want it?" The words are small. Then you answer her, with the reason you gave once, exactly as you gave it.',
      setTo('of-told', 2), setTo('oldfriend-told-everything', 1),
      when('of-why', { min: 1, max: 1 }, [], '"I thought it would be happier here." She listens. She holds its Ball a little tighter. "It is," she says. "Mostly."'),
      when('of-why', { min: 2, max: 2 }, [], '"I had no room." She nods slowly. She knows what that costs. She holds the Ball out a little, and then draws it back.'),
      when('of-why', { min: 3, max: 3 }, [], '"It wasn\'t strong enough." Her face changes. She holds its Ball a little tighter. "It is now," she says, fiercely. "Look at it."'),
      when('of-why', { min: 4, max: 4 }, [], 'You have no reason to give her. You say so. She listens to that, too, for a long time, and then holds the Ball out, just a little.'),
      ...DO)),
    ch('No. Just a friendly one.', out('{oldfriend:name} looks at you. For a moment it seems about to say something, in whatever way it says things. Then it lets it go. It is kind of you, or cowardly. Nobody says which.',
      setTo('of-told', 1), setTo('oldfriend-told-nothing', 1), ...DO)),
    ch('It\'s a good Pokémon. Look after it.', out('**Minna:** "I do." {oldfriend:name} leans against her leg, and looks at you over its shoulder, steadily, the whole way down the road.',
      setTo('of-told', 3), ...DO)),
  ]),
  rm('gn-58-weak', 'Old Friend Returns: Stronger Now', friend({ tags: ['Pokémon', 'Combat'] }), say(
    '*It steps back, and squares up. It is {oldfriend:species} now, and it is not the one you let go.*',
    '*It wants you to see. That is all. It has wanted you to see for a very long time.*',
    '*One on one. Against the Pokémon that took its place.*',
  ), [ch('Battle.', oneOnOne('Both of you step forward. Nobody else joins in. This was always going to be just the two of them.'))]),
  rm('gn-58-nod', 'Old Friend Returns: It Nods', friend(), say(
    '*Win or lose, it stops. It looks at you. Then it nods, once, slowly, the way you would nod to someone who finally understood.*',
    '*It is done. It was always only this.*',
  ), [ch('Nod back.', out('It goes on down the road. You watch it as far as the bend. It does not look back, because it does not need to.', bond(1), moment('An old friend came back to be seen. It was seen.', 70)))]),
  rm('gn-58-help', 'Old Friend Returns: A Good Turn', friend(), say(
    '*It does not fight you. It sits in the road, and looks up at you, content. It is warm, and fed, and well.*',
    '*It is going the same way you are, for a little while. It means to be there for the hard part.*',
    '*Come the next hard fight, it will find you. It said so, in its own way.*',
  ), [
    chIf([is('of-free')], 'Come with me?', COME()),
    ch('Wave it on.', out('You wave. It waves back, the only way it can, with its whole body. Somewhere ahead, in the next hard fight, it will be there.')),
  ]),
  rm('gn-58-none', 'Old Friend Returns: Unsaid', friend(), say(
    '*It looks at you for a long time before it moves. There is a question in it, and it is not asking it out loud.*',
    '*You never said why. It has had all this time to wonder.*',
  ), [
    ch('Battle me.', oneOnOne('It nods once, as if that is an answer. Then it stands, and you both begin.')),
    ch('Walk with me a while.', out('It falls in beside you without a sound. For the rest of the stage, it walks at your heel. At the Gym door, it will stop.', gn('ofGuest'))),
    chIf([is('of-free')], 'Come with me?', COME()),
  ]),
];

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-58-friend': {
    gn: 'gn.58', shape: 'Single', earliest: 'A3', home: 13, window: [11, 16], sits: 'must-see', attaches: 'before', tags: ['Reunion Episode'],
    level: 'A+0, wherever it is met', often: 'region', badge: 'own',
    note: 'Badge: a pawprint. Two or more stages after a Pokémon was let go at the catch screen, in the same kind of place if the stage fits (any place after four stages). One friend an event; others follow if many were let go. Sets gn mark `came-back` on one that rejoins. Within one run.',
  },
};

export const CHAINS: Json[] = [];
