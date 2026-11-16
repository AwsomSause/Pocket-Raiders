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


// ---------- Returns of the stories that let a Pokémon go (doc: "A Pokémon released at the end of an emotional storyline has its own scene") ----------
// gn.02's Pidgeot or Fearow comes back as the sky story's own Overhead (core/sky) and, in a hard battle that stage, a shadow (oldfriend.ts ofShadow).
// The rest are recorded by gn op `ofSpecial` in their own events (gn.13, gn.22, gn.37, gn.38) and met again here, two or more stages later.
const spec = (key: string, extra: Json = {}): Json => ({ stop: 'event', rarity: 'rare', requires: [{ kind: 'gn', test: 'ofSp', key }, not(`of-sp-${key}-seen`)], ...extra });
const MET = (key: string): Json => gn('ofSpecial', { key, n: 1 });
export const SPECIAL_EVENTS: Json[] = [
  gev('gn-58-bug', 'Old Friend Returns: A Silhouette', friend(spec('bug', { pokemon: 'butterfree', tags: ['Pokémon', 'Relationship'] })), say(
    '*On the ridge, against the pale sky, a small shape. Wings folded. Perfectly still. It is watching the road.*',
    '*You know that outline. You have not forgotten it once since the night it carried a whole team north.*',
    '*It does not come closer. It does not need to.*',
  ), [
    ch('Look up.', out(say(
      'You look up, and it knows you did. It opens its wings, once, wide, so the light comes through.',
      'Then the cry. Two notes. High, then lower. The call you were told to remember. It is saying: *still here.*',
    ), bond(1), MET('bug'), moment('A small Bug-type that once flew north looked back, and called twice.', 75))),
    ch('Walk on.', out('You walk on with your head down, because looking would be too much. Behind you, high up, something folds its wings and lets you go.', MET('bug'))),
  ]),
  gev('gn-58-cubone', 'Old Friend Returns: The Flat Stone', friend(spec('cubone', { pokemon: 'cubone', types: ['ghost', 'ground'], tags: ['Pokémon', 'Relationship'] })), say(
    '*A graveyard by the road. Between the old stones, one small kneeling figure, club laid down beside it.*',
    '*It is setting a flat stone on a mound. The mound is not its mother\'s. It has never met whoever lies here.*',
    '*It has started doing this for others. Nobody told it to. It looks up, and it is not afraid of you.*',
  ), [
    ch('Help it set the stone.', out('You hold the stone steady while it settles it with both paws. It nods at the mound, then at you. Neither of you says a word.', bond(1), MET('cubone'), moment('A Cubone set a flat stone on a stranger\'s grave, and let you help.', 80))),
    ch('Watch.', out('You stand at the gate and watch until it has finished. When it picks up its club and goes to the next mound, you let it go.', MET('cubone'))),
  ]),
  gev('gn-58-mimikyu', 'Old Friend Returns: The Table Is Laid', friend(spec('mimikyu', { pokemon: 'mimikyu', types: ['ghost'], tags: ['Pokémon', 'Relationship'] })), say(
    '*The mansion, with one window lit. In the doorway, a small shape in a coat far too big for it. The coat is on again.*',
    '*Behind it, through the door, a table. Tea laid out for three now. Not two. Three.*',
    '*It pulls out a chair, and this time it does not wait forty years for you to sit.*',
  ), [
    ch('Sit down.', out('The tea is weak, and sweet, and warm. It pours without spilling. It cheats at draughts. You let it win, and it knows, and it does not mind.', bond(1), MET('mimikyu'), moment('A Mimikyu laid the table for three, and you sat at it.', 80))),
    ch('Leave it to its house.', out('You nod to the lit window. The coat nods back. A house with someone in it is a different house. You walk on, and it is warm behind you.', MET('mimikyu'))),
  ]),
  gev('gn-58-made', 'Old Friend Returns: Something You Made', friend(spec('made', { tags: ['Pokémon', 'Relationship'] })), say(
    '*On a country road, in a place you would never think to look, something very large and very strong is doing something very small.*',
    '*It is the one you shut the facility for. {cast:lab-subject}. It has not noticed you yet. It is busy being gentle.*',
  ), [
    ch('Go closer.', out('It turns, and sees you, and stops, mid-gesture, as if caught. Then it remembers it has nothing to hide.',
      gn('roll', { key: 'of-made-kite', n: 50 }),
      when('of-made-kite', { min: 1 }, [scene('gn-58-made-kite')]),
      when('of-made-kite', { min: 0, max: 0 }, [scene('gn-58-made-farm')]))),
  ]),
  rm('gn-58-made-farm', 'Old Friend Returns: The Farmer', friend(), say(
    '*A farmer has a cart stuck to the axle in the mud. {cast:lab-subject} has the back of it in both hands, and is lifting.*',
    '**The farmer:** "Don\'t ask me where it came from. Showed up in March. Won\'t take payment. Eats one apple a day and sits on the fence."',
    '*It sets the cart down, and looks at you, and lifts one hand. A wave.*',
  ), [ch('Wave back.', out('You wave back. It goes to the farmer\'s side, and stands there, easy, like it has been standing there for years. It never had that before.', bond(1), MET('made'), moment('Something made in a lab was helping a farmer, and was glad.', 80)))]),
  rm('gn-58-made-kite', 'Old Friend Returns: The Kite', friend(), say(
    '*A small child is running along the dyke, shrieking, with a kite on a string, and not enough wind.*',
    '*{cast:lab-subject} is carrying the kite. Held high in both hands, as carefully as an egg, jogging beside the child.*',
    '*It lets go. The wind catches. The child screams with joy. It looks, for a moment, exactly like what it is: something that is allowed to be here.*',
  ), [ch('Let it be.', out('It looks up at the kite for a long time. Then at you. It nods once. That is all you wanted to know, and more.', bond(1), MET('made'), moment('A made Pokémon carried a child\'s kite, and the wind caught it.', 80)))]),
];

EVENTS.push(...SPECIAL_EVENTS);

export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-58-friend': {
    gn: 'gn.58', shape: 'Single', earliest: 'A3', home: 13, window: [11, 16], sits: 'must-see', attaches: 'before', tags: ['Reunion Episode'],
    level: 'A+0, wherever it is met', often: 'region', badge: 'own',
    note: 'Badge: a pawprint. Two or more stages after a Pokémon was let go at the catch screen, in the same kind of place if the stage fits (any place after four stages). One friend an event; others follow if many were let go. Sets gn mark `came-back` on one that rejoins. Within one run.',
  },
  'gn-58-bug': { gn: 'gn.58', shape: 'Single', earliest: 'A3', home: 1, window: [1, 3], sits: 'optional', attaches: 'before', tags: ['Reunion Episode'], level: 'None', often: 'run', badge: 'own', note: 'The Flight North bug (gn.13), let go: its silhouette at step 1, two or more stages later. Looking up gives the two-note cry. Once.' },
  'gn-58-cubone': { gn: 'gn.58', shape: 'Single', earliest: 'A3', home: 9, window: [6, 12], sits: 'optional', attaches: 'before', tags: ['Reunion Episode'], level: 'None', often: 'run', badge: 'own', note: 'The Cubone (gn.22), left at the grave: at a graveyard (ghost theme) it sets a flat stone on a mound that is not its mother\'s.' },
  'gn-58-mimikyu': { gn: 'gn.58', shape: 'Single', earliest: 'A3', home: 9, window: [6, 12], sits: 'optional', attaches: 'before', tags: ['Reunion Episode'], level: 'None', often: 'run', badge: 'own', note: 'The Mimikyu (gn.37), who stayed: back at the mansion (ghost theme), in the coat, with the table laid for three.' },
  'gn-58-made': { gn: 'gn.58', shape: 'Single', earliest: 'A3', home: 8, window: [4, 14], sits: 'optional', attaches: 'before', tags: ['Reunion Episode'], level: 'None', often: 'run', badge: 'own', note: 'The made Pokémon (gn.38), shut down and free: met where you would least expect, helping a farmer or carrying a child\'s kite.' },
};

export const CHAINS: Json[] = [];
