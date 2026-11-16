// Greenneedle gn.new.23: The Appliance Shop (doc GREENNEEDLE_PLACED_2.md lines 104–142).
// Build: npm run co:build -- greenneedle-new-23   then   npm run co:gn
import { ch, join, out, type Json } from '../dsl.ts';
import { chIf, gev, gn, is, moment, not, notThisRegion, pick, rm, say, scene, setTo, stampRegion, teach, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// Five errands, one after another, all inside the town node (no steps spent). One appliance is the Rotom. A seeded roll at the door
// (`appliance-hum`, 1-5) decides which errand it hummed through; the doc's "the game notes which one" is that flag.
const SHOP = '#5a6670';
const shop = (o: Json = {}): Json => ({ tint: SHOP, tags: ['Story', 'Recovery'], effect: 'none', ...o });

const FORMS = ['rotom-fan', 'rotom-frost', 'rotom-heat', 'rotom-wash', 'rotom-mow'];
const NAMES = ['Fan', 'Fridge', 'Oven', 'Washer', 'Mower'];
const joinForm = (i: number): Json => join({ species: [FORMS[i - 1]!] });
const hum = (i: number): Json => ({ kind: 'flag', key: 'appliance-hum', atLeast: i, atMost: i });
/** Every errand: a plain line, and a warmer one when this was the appliance it hummed through. */
const warm = (i: number, text: string): Json => when('appliance-hum', { min: i, max: i }, [], text);

interface Errand { id: string; name: string; intro: string; go: string; done: string; humLine: string }
const ERRANDS: Errand[] = [
  { id: 'fan', name: 'The Fan', intro: say('A neighbour\'s washing hangs on a line across the yard: sheets, small shirts, a good tablecloth. The sky to the west is going slate.', '**Dufresne:** "Rain in the hour. She\'s a widow, that one. Those were her husband\'s shirts. Dry them, if you can."'),
    go: 'Point the fan at the washing.', done: 'It whirrs, and the sheets lift and billow. The last shirt is dry as the first drop falls. The neighbour waves from her door, hand over her mouth.', humLine: 'The little light in the casing goes steady, warm, and bright.' },
  { id: 'fridge', name: 'The Fridge', intro: say('A fishmonger sets a crate of silver mackerel on the counter. His own ice machine broke at dawn, and the crate is already sweating.', '**Dufresne:** "An hour, that\'s all he needs. Then it\'s his problem again. Don\'t let them go soft."'),
    go: 'Put the catch in the fridge.', done: 'The door clunks shut. Frost draws a fern across the glass. An hour later every fish is as bright as the morning sea. The fishmonger pays with a handshake and one cold mackerel.', humLine: 'The little light in the casing glows a clear, cold blue, and hums.' },
  { id: 'oven', name: 'The Oven', intro: say('A baker in a floury apron stands in the doorway, near tears. Her oven is cold, forty loaves are proved, and the bell on the shop door has not stopped.', '**Dufresne:** "Bread rises once. Nobody should have to tell a town it can\'t have breakfast."'),
    go: 'Bake the bakery\'s bread.', done: 'The oven roars. The smell fills the street and it brings the whole street, one by one. Forty loaves, golden. The baker presses the first into your hands, too hot to hold, and doesn\'t let go till you do.', humLine: 'The little light in the casing burns a deep amber. It hums the whole time the bread is rising.' },
  { id: 'washer', name: 'The Washer', intro: say('Forty white uniforms, folded in four tall piles. The dojo\'s tournament is tomorrow, and every one has a belt-stain that has been there since last year.', '**Dufresne:** "Forty. They\'re proud of those uniforms. Do them like they\'re yours."'),
    go: 'Wash the dojo\'s forty uniforms.', done: 'The drum thunders round and round, and the water goes grey, then clear. Forty uniforms, white as the day they were folded. A small girl in a belt too big for her bows to the machine.', humLine: 'The little light in the casing sloshes and glitters. For a moment, it hums in time with the drum.' },
  { id: 'mower', name: 'The Mower', intro: say('The school field has gone to seed over the holidays. Grass up to a child\'s knees. The first day back is tomorrow, and the teachers are out with scissors.', '**Dufresne:** "Back and forth. Back and forth. It likes lines. I think that\'s the whole secret of it."'),
    go: 'Cut the school field.', done: 'Row after row, straight as a ruled page. The grass smells green and sweet. By dusk the field is a stripe-pattern of two greens, and the teachers put their scissors down and clap.', humLine: 'The little light in the casing spins and whirs with the blades, steady and bright.' },
];

const errandRoom = (i: number): Json => {
  const e = ERRANDS[i - 1]!;
  const next = i < 5 ? `gn-new-23-errand-${i + 1}` : 'gn-new-23-after';
  return rm(`gn-new-23-errand-${i}`, `The Appliance Shop: ${e.name}`, shop(), e.intro, [
    ch(e.go, out(`${e.done}\n\n*The light in the casing flickers, a different brightness for each.*`, warm(i, e.humLine), scene(next))),
  ]);
};

/** The choice after the errands: name the one it enjoyed. Five names, four choices at most: two rooms. */
const nameChoice = (i: number): Json => {
  const right = `You say it. The light jumps, like a held breath let go. It settles into the ${NAMES[i - 1]!.toLowerCase()}, and the ${NAMES[i - 1]!.toLowerCase()} settles around it. It stays.`;
  const wrong = 'It tries the one you named. It is fine. It is not right. It looks at you, a little sorry, and goes back, then finds the one that hummed and takes that for itself.';
  return ch(i === 4 ? 'The washer or the mower.' : `The ${NAMES[i - 1]!.toLowerCase()}.`, out(wrong, ...[1, 2, 3, 4, 5].map((k) => when('appliance-hum', { min: k, max: k }, [joinForm(k)])), setTo('appliance-done', 1), moment('A Rotom chose its form in an appliance shop.', 60)), { branches: [{ when: [hum(i)], text: right, effects: [joinForm(i), setTo('appliance-done', 1), moment('A Rotom chose its form in an appliance shop, and it was the one it loved.', 70)] }] });
};
const nameDirect = (i: number): Json => {
  const c = nameChoice(i);
  return { ...c, label: `The ${NAMES[i - 1]!.toLowerCase()}.` };
};

const PLAIN = out('It lets the shop be. It steps out of the tangle of wires, plain, one little light, with Mr. Dufresne\'s old radio carried under one arm. The radio crackles. Somewhere it is playing a song. It knows the words.',
  join({ species: ['rotom'] }), teach('house-call', { species: 'rotom' }), setTo('appliance-done', 1), moment('A Rotom left an appliance shop plain, carrying a radio.', 60));

export const EVENTS: Json[] = [
  gev('gn-new-23-shop', 'The Appliance Shop', shop({ stop: 'event', rarity: 'rare', forced: true, requires: [not('appliance-done'), not('appliance-open')] }), say(
    '*A repair shop with a crooked sign. In the window: a fan, a fridge, an oven, a washing machine and a lawnmower. They are all arguing, very faintly, in static.*',
    '**Repairman, Old Mr. Dufresne:** "It\'s one of \'em. Gets about. I talk to each differently, and it likes all five chats."',
    '**Dufresne:** "I\'m closing Friday. It has to pick. Or not."',
  ), [
    ch('Hear him out.', out('He gives you the first errand with a list, a pencil and a small, hopeful nod. "Go on. It will be watching."', setTo('appliance-open', 1), pick('appliance-hum', 1, 1, 1, 1, 1), scene('gn-new-23-errand-1'))),
    ch('Walk on.', out('Behind you, the window argues on in static, a little quieter.')),
  ]),
  ...[1, 2, 3, 4, 5].map(errandRoom),
  rm('gn-new-23-after', 'The Appliance Shop: After the Errands', shop(), say(
    'Five errands, and the shop is quiet. The Rotom hangs between the appliances, one light on, and looks at you.',
    '**Dufresne:** "Now. Say it, if you know it. Or don\'t. It\'s a fine thing either way."',
  ), [
    ch('"You liked that one."', out('You think back over the day. Which one did it hum through?', scene('gn-new-23-name-1'))),
    ch('"You don\'t have to pick."', PLAIN),
  ]),
  rm('gn-new-23-name-1', 'The Appliance Shop: Name It', shop(), 'You look at the five of them. It waits, very still, light low.', [
    nameDirect(1), nameDirect(2), nameDirect(3),
    ch('Another one.', out('You say you need to think again.', scene('gn-new-23-name-2'))),
  ]),
  rm('gn-new-23-name-2', 'The Appliance Shop: Name It', shop(), 'The washer, or the mower. It holds its light very still.', [nameDirect(4), nameDirect(5)]),
  // Afterstory: later in the run the shop is a hub in another town. One free held-item repair a visit.
  gev('gn-new-23-hub', 'The Appliance Shop, Again', shop({ stop: 'event', callback: true, rarity: 'common', requires: [is('appliance-done'), notThisRegion('appliance-hub-at')] }), say(
    '*The same crooked sign, in a different town. Somehow the shop has come with you.*',
    '**Mr. Dufresne:** "Closed Friday, I said. I lied. Hand over whatever\'s worn out. No charge."',
  ), [
    chIf([{ kind: 'gn', test: 'holdsBerry' }], 'Mend a held item.', out('He takes it in his old hands, and turns it to the light.', stampRegion('appliance-hub-at'), gn('applianceRepair')), { pick: {} }),
    ch('Just visiting.', out('You say hello. He pours you tea from a kettle that was, you think, once a toaster.')),
  ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-23-shop': {
    gn: 'gn.new.23', shape: 'Hub', earliest: 'A6', home: 5, window: [3, 8], sits: 'must-see', attaches: 'town', tags: ['Hub Destination'],
    level: 'No battles', often: 'run', badge: 'own',
    dressing: { kanto: 'The Appliance Shop', elsewhere: 'The Appliance Shop' },
    note: 'Fallback step 15. Five errands in a row inside the town node (no steps spent). The one it hummed through is a seeded roll at the door. Once per run (the doc\'s "once per save").',
  },
  'gn-new-23-hub': {
    gn: 'gn.new.23', shape: 'Hub', earliest: 'A7', home: 14, window: [12, 17], sits: 'optional', attaches: 'town', tags: ['Hub Destination'],
    level: 'No battles', often: 'region', badge: 'own',
    note: 'Afterstory, in the same run (no memory across runs): the shop is a hub at a later town. One free held-item repair per visit: a berry that wore out is put back.',
  },
};
export const CHAINS: Json[] = [];
