// Greenneedle gn.new.28 The Ring Under the Bridge (doc GREENNEEDLE_PLACED_2.md lines 284-312).
// Build: npm run co:build -- greenneedle-new-28   then   npm run co:gn
import { $, ch, fight, flag, join, out, trainer, type Json } from '../dsl.ts';
import { gev, is, laterStage, moment, not, rm, say, scene, stampStage, teach, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const BRIDGE_TINT = '#3a3446';
const under = (o: Json = {}): Json => ({ tint: BRIDGE_TINT, tags: ['Story', 'Trainer'], effect: 'none', ...o });
const fightTags = ['Combat', 'Trainer', 'Story'];
const SCRAFTY = { ...join({ species: ['scrafty'], lv: 0 }), direct: true };
// "Rope-a-Dope" does not exist as a move; nearest honest build is Counter (absorb the hit, return it doubled).
const ROPE = teach('counter', { species: 'scrafty' });

// The loss of a fight is never the end of a run: you are shown out, and the ring keeps going.
const shownOut: Json[] = [flag('ring-lost'), scene('gn-new-28-out')];

const gnNew28: Json[] = [
  gev('gn-new-28-bridge', 'The Ring Under the Bridge', under({ stop: 'event', rarity: 'rare', requires: [not('ring-done')] }), say(
    '*Shouting under a road bridge. Lamplight on wet concrete, a ring chalked on the ground, and a crowd that doesn\'t look at you.*',
    'A Scrafty with one eye swollen shut is being sent out again. It doesn\'t look at the crowd either. It looks at the floor, as if the floor was where it lived.',
    '**Bookmaker, Mr. Lazenby:** "Fresh blood! Three fights, good money. A word of advice: the second one, you\'ll want to be tired."',
    '*Behind the ring, cages. The fighters in them aren\'t volunteers.*',
  ), [
    ch('Enter.', out('Lazenby takes your name and doesn\'t write it down. "Lovely. First one\'s a warm-up. Don\'t get used to it."', scene('gn-new-28-first'))),
    ch('Sit in the crowd.', out('You find a crate near the back and sit. Nobody asks you to move. Somebody, you notice, is asking about you.', scene('gn-new-28-crowd'))),
    ch('Go round the back.', out('The noise swallows your footsteps. Behind the bridge the cages are stacked three high, and every one of them has been looked at by someone who didn\'t care.', scene('gn-new-28-back'))),
  ]),
  rm('gn-new-28-first', 'The Ring Under the Bridge: The First', under({ tags: fightTags }), say(
    'The first one is a bruiser in a fighting-club vest who wants it over quickly. So do you. The crowd wants neither.',
  ), [
    ch('Fight.', fight('The bell is a pan hit with a spoon. It will do.', { ...trainer('Pit Fighter', { cls: 'blackbelt', size: 1, friendly: true, lv: 0, win: [scene('gn-new-28-second')], lose: shownOut }) })),
  ]),
  rm('gn-new-28-second', 'The Ring Under the Bridge: The Second', under({ tags: fightTags }), say(
    'Between rounds Lazenby pats your shoulder, too hard, and watches your team the way a butcher watches a calf.',
    '**Lazenby:** "Second one. You\'re tired, I can see. You\'ll want to be. The odds, you understand, are very good for the house when a gentleman is tired."',
    'He says *gentleman* like a price.',
  ), [
    ch('Fight.', fight('The second is bigger than the first, and has been told to take its time.', { ...trainer('Pit Fighter', { cls: 'blackbelt', size: 1, friendly: true, lv: 0, win: [scene('gn-new-28-third')], lose: shownOut }) })),
    ch('Go down in the second.', out('You let the second one land. Then another. You go down on one knee and stay there, and the count is very slow. The crowd roars. Somewhere to your left a Scrafty with one eye shut watches you do it, and doesn\'t blink.', flag('ring-threw'), flag('honest-lied'), scene('gn-new-28-thrown'))),
  ]),
  rm('gn-new-28-thrown', 'The Ring Under the Bridge: Good Money', under(), say(
    '**Lazenby:** "Beautiful. Nobody saw a thing. That\'s the best compliment I know." He counts the notes into your hand himself.',
    'The Scrafty watches the money change hands. Then it looks at your Pokémon, a long look, and turns away.',
  ), [
    ch('Take the money.', out('You take it. It is good money. It sits in your pocket like a stone.', $(300), moment('Threw a fight under the bridge, for money', 40))),
  ]),
  rm('gn-new-28-third', 'The Ring Under the Bridge: The Third', under({ tags: fightTags }), say(
    'The third is the Scrafty. It was always going to be. Its trainer, if that is the word, stands behind it with a rope and doesn\'t pull.',
    '**Lazenby:** "The house champion! Four hundred wins. Not one of them its idea."',
    'It looks at you and for a second the one good eye is entirely clear.',
  ), [
    ch('Fight.', fight('It takes your first hit on purpose. Then it shows you why.', { ...trainer('Pit Scrafty', { cls: 'blackbelt', size: 1, friendly: true, lv: 1, team: ['scrafty'], win: [scene('gn-new-28-paid')], lose: shownOut }) })),
  ]),
  rm('gn-new-28-paid', 'The Ring Under the Bridge: Pay Day', under({ tags: ['Story', 'Treasure'] }), say(
    'Lazenby opens the cash box and stares into it. It is not a large box, and it is not full. Behind you, someone laughs, and stops.',
    '**Lazenby:** "The ring can\'t pay. Three wins, you see, nobody plans for three wins." He wipes his mouth. "Take the Scrafty. It\'s finished anyway."',
    'The Scrafty hears this. It doesn\'t move. Then it limps to you, and stands very close, and its hand finds your sleeve.',
  ), [
    ch('Take the Scrafty.', out('It leans against your leg the whole way up the bank, as if it had been braced against something for years. By the top of the bank it has learned to stand without bracing. It teaches itself, on the spot, to take a hit and give it back.', SCRAFTY, ROPE, flag('ring-won-clean'), flag('bridge-ring-stopped'), flag('ring-done'), moment('Beat the ring under the bridge three times, and left with its champion', 80))),
  ]),
  rm('gn-new-28-out', 'The Ring Under the Bridge: Shown Out', under(), say(
    'Two men take you by the elbows, not roughly. It is almost courteous. You are put out on the grass above the bridge.',
    '**Lazenby:** "Come again! Better odds with a rest."',
    'Under your feet, through the road, you can still hear the crowd.',
  ), [ch('Leave.', out('The Scrafty is back in the ring before you reach the road. You don\'t look back, because you know what you would see.', flag('ring-done')))]),
  rm('gn-new-28-crowd', 'The Ring Under the Bridge: The Crowd', under(), say(
    'A bout goes by. Another. You watch the crowd more than the ring, and one man more than the crowd: the one not shouting. He sits above it all on a stack of crates, counting, and nobody counts with him.',
    'The man has a face you won\'t forget, a sandy moustache and a signet ring on the wrong hand. Lazenby calls him *sir*.',
    '**The man, to nobody:** "Another one for the pen, then. Mind the shipment."',
  ), [
    ch('Memorise the face.', out('You commit it to memory: the moustache, the ring, the way he watches the fighters the way a man watches a meter. You will see it again. You are almost sure of it.', flag('ring-knows-owner'), flag('ring-done'))),
  ]),
  rm('gn-new-28-back', 'The Ring Under the Bridge: The Cages', under({ tags: ['Story', 'Trainer'] }), say(
    'Fighters in the cages: a Machoke too tired to stand, a Hitmontop slowly rubbing a wound, a Primeape facing the wall. Nobody looks at you.',
    'The locks are the cheap kind. The main bout is starting, and the crowd is loud enough to cover a gunshot.',
  ), [
    ch('Open the cages.', out('One lock. Another. The Machoke reaches the third one before you do and bends the bars apart with a grunt. The main bout reaches its roar, and the roar turns into something else. Chaos: crates over, lamps out, Lazenby shouting, the crowd running the wrong way. You run the other.', scene('gn-new-28-chase'))),
    ch('Leave them.', out('You can\'t. You know you can\'t. You walk back round the bridge with your hands empty and your stomach heavy.')),
  ]),
  rm('gn-new-28-chase', 'The Ring Under the Bridge: The Chase', under(), say(
    'A chase across Step 14. Boots behind you, hooves and paws ahead, every fighter free and running in a different direction, as fast as they can.',
    'The Scrafty is among them. It runs beside you for a hundred metres, then stops at the edge of the field, looks back, and bows to you. Not to the ring. To you.',
  ), [
    ch('Bow back.', out('It stays at the field\'s edge until the last of them is out of sight. Then it turns, and walks to you, and doesn\'t leave.', SCRAFTY, ROPE, flag('ring-freed'), flag('freed-caged'), flag('bridge-ring-stopped'), flag('ring-done'), stampStage('ring-freed-at'), moment('Opened every cage under the bridge', 80))),
  ]),

  // Afterstory: the owner comes back as an evil-team recruiter with a grudge (a later stage, only when the cages were opened).
  gev('gn-new-28-recruiter', 'The Man From Under the Bridge', under({ stop: 'event', callback: true, tags: ['Evil Team', 'Combat', 'Trainer', 'Story'], requires: [is('ring-freed'), laterStage('ring-freed-at'), not('ring-recruiter-met')] }), say(
    'A sandy moustache. A signet ring on the wrong hand. You knew the face before he spoke.',
    '**The recruiter:** "The bridge. The cages. Three hundred I lost, because of you. They gave me a job to make it up. Recruiting. Isn\'t that funny."',
    'He doesn\'t laugh. He sends out a Pokémon.',
  ), [
    ch('Fight.', fight('He fights like a man being paid to, and not very much.', { ...trainer('Recruiter Lazenby', { cls: 'roughneck', size: 2, friendly: true, lv: 1, win: [flag('ring-recruiter-met'), moment('Met the owner of the ring again, in an evil team\'s coat', 60)], lose: [flag('ring-recruiter-met')] }) })),
  ]),
  // Afterstory: a freed fighter behind a dojo counter in a later region.
  gev('gn-new-28-dojo', 'The Dojo Counter', under({ stop: 'event', callback: true, tags: ['Story', 'Recovery'], requires: [is('ring-freed'), laterStage('ring-freed-at'), not('ring-dojo-met')] }), say(
    'A small dojo in a side street. Children in white, lined up on the mat, hitting one another very gently.',
    'Behind the counter stands a Machoke, with a whistle. It is teaching them how to block.',
    'It sees you. It stops, mid-word. It puts down the whistle, bows, and waits.',
  ), [
    ch('Bow back.', out('The children are told to bow too. They do, in a row, all of them a little confused. The Machoke does not stop looking at you until the lesson starts again.', flag('ring-dojo-met'), moment('Found a freed fighter teaching children to block', 70))),
  ]),
];

export const EVENTS: Json[] = gnNew28;
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-28-bridge': {
    gn: 'gn.new.28', shape: 'Single', earliest: 'A7', home: 13, window: [10, 17], sits: 'side-branch', attaches: 'instead', tags: ['Companion Story'], needs: ['city'],
    level: 'A+0, A+0, A+1', often: 'run', badge: 'own',
    note: 'Badge: a bridge. Side branch of step 13, at night; fallback step 17, optional. Three fights or one break-out. Once per run. Rope-a-Dope is built as Counter (no such move).',
  },
  'gn-new-28-recruiter': { gn: 'gn.new.28', shape: 'Single', earliest: 'A8', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'A+1', often: 'run', badge: 'own', note: 'Afterstory: only after the cages were opened, a later stage of the same run.' },
  'gn-new-28-dojo': { gn: 'gn.new.28', shape: 'Single', earliest: 'A8', home: 8, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Companion Story'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: only after the cages were opened, a later stage of the same run (the doc: a later region).' },
};

export const CHAINS: Json[] = [];
