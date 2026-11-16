// Greenneedle, gn.new.18 The Day the Center Closed (doc GREENNEEDLE_PLACED_1.md lines 656-691).
// Build: npm run co:build -- greenneedle-new-18   then   npm run co:gn
// A Chansey runs the Center alone; the nurse sleeps at the desk. Six patients, one helper each. A wrong helper only grows the queue
// (flag gn18-mess +1). 0-2 mistakes is a clean shift, 3 or more a messy one. Either way: Standing Welcome for the rest of the region
// (core/greenneedle/welcome.ts), and a parcel in the next region.
import { anyType, ch, flag, item, out, type Json } from '../dsl.ts';
import { bond, chIf, gev, is, moment, regionChanged, rm, say, scene, setTo, stampRegion, not, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#e8d5d9';
const room = (o: Json = {}): Json => ({ tint: TINT, tags: ['Recovery', 'Story'], effect: 'none', cast: ['npc.nurse'], pokemon: 'chansey', ...o });
const mess = (): Json => flag('gn18-mess', 1);

interface Patient { id: string; name: string; intro: string; right: { label: string; text: string; needs?: Json[] }; wrong: { label: string; text: string }[] }

const PATIENTS: Patient[] = [
  { id: 'warm', name: 'Patient 1: Warming', intro: say('The first patient is a Growlithe pup curled on the bench, shivering so hard the bench hums.', 'The Chansey points at it, then at the clipboard. It needs warming.'),
    right: { label: 'Send a Fire-type.', needs: [anyType('fire')], text: 'Your Fire-type lies down against the pup. The shivering slows, then stops. The pup sighs, enormous for something so small.' },
    wrong: [
      { label: 'Send your strongest.', text: 'Your strongest is a wonderful sort of cold. The pup shivers harder. The Chansey sighs and adds a name to the queue.' },
      { label: 'Send the one who loves you most.', text: 'It tries, with everything it has. It is not warm. The pup is grateful and still cold, and the queue grows.' },
      { label: 'Do it yourself.', text: 'You give it your jacket. It helps, a little. Not enough, and the queue grows.' }] },
  { id: 'calm', name: 'Patient 2: Calming', intro: say('The second patient is a Gloom hiding under a chair, shaking at every phone that rings.', 'The Chansey mimes a deep, slow breath. It needs calming.'),
    right: { label: 'Send a Psychic- or Fairy-type.', needs: [anyType('psychic', 'fairy')], text: 'Yours hums, low and strange. The shaking eases. The Gloom crawls out, and falls asleep against your shoe.' },
    wrong: [
      { label: 'Send a Fire-type.', text: 'Warm, kind, and very bright. The Gloom bolts under a different chair. The queue grows.' },
      { label: 'Send your strongest.', text: 'It stands guard, tall and serious. The Gloom takes that as bad news. The queue grows.' },
      { label: 'Do it yourself.', text: 'You whisper. It listens, mostly. It is still shaking when you stop, and the queue grows.' }] },
  { id: 'carry', name: 'Patient 3: Carrying', intro: say('The third patient is a Machop with a sprained leg, and a hundred and fifty pounds of apologies.', 'The Chansey tugs the gurney. It cannot move him alone. He needs carrying.'),
    right: { label: 'Send your strongest.', text: 'Yours lifts him like laundry, gently, and sets him on the gurney. The Machop says thank you six times in a row.' },
    wrong: [
      { label: 'Send a Psychic- or Fairy-type.', text: 'It tries to calm him down. He is calm. He is also still on the floor. The queue grows.' },
      { label: 'Send a Water- or Ice-type.', text: 'It is very cool and very small. He does not move. The queue grows.' },
      { label: 'Do it yourself.', text: 'You get him halfway. Your back has opinions. The Chansey takes over, and the queue grows.' }] },
  { id: 'cool', name: 'Patient 4: Cooling', intro: say('The fourth patient is a Numel with a fever, steaming softly on the linoleum. The floor has started to smoke.', 'The Chansey fans herself, then points. It needs cooling.'),
    right: { label: 'Send a Water- or Ice-type.', needs: [anyType('water', 'ice')], text: 'Yours breathes out a cool mist. The steam thins. The Numel opens one eye, and then both.' },
    wrong: [
      { label: 'Send a Fire-type.', text: 'Your Fire-type means well. The Numel gets warmer, so does the room, and the queue grows.' },
      { label: 'Send the one who loves you most.', text: 'It sits close, which is lovely, and which makes the heat worse. The queue grows.' },
      { label: 'Do it yourself.', text: 'You fan it with a magazine. It enjoys the magazine. The queue grows.' }] },
  { id: 'company', name: 'Patient 5: Company', intro: say('The fifth patient is a Pidgey with nothing wrong at all, except that no one has come to pick it up.', 'The Chansey points to the empty chair beside it. It needs company.'),
    right: { label: 'Send the one who loves you most.', text: 'Yours hops up beside it and stays. They do not talk. The Pidgey leans, a little, and keeps leaning.' },
    wrong: [
      { label: 'Send your strongest.', text: 'It stands at attention beside the chair. The Pidgey does not feel any less alone. The queue grows.' },
      { label: 'Send a Fire-type.', text: 'It sits, and then it fidgets, and then it wanders to the vending machine. The queue grows.' },
      { label: 'Do it yourself.', text: 'You sit with it, but you keep looking at your watch, and it knows. The queue grows.' }] },
  { id: 'bandage', name: 'Patient 6: A bandage', intro: say('The last patient is a small Oddish with a scraped leaf, and a very serious face.', 'The Chansey holds up a roll of gauze, and then holds it out to you. This one is yours.'),
    right: { label: 'Do it yourself.', text: 'You wrap the leaf, carefully, with your own two hands. The Oddish inspects it, and nods, and is fine.' },
    wrong: [
      { label: 'Send your strongest.', text: 'It is gentle, and enormous, and has no thumbs. The gauze ends up on the wrong leaf. The queue grows.' },
      { label: 'Send a Water- or Ice-type.', text: 'The gauze gets wet and slides off. The Oddish is very patient about it. The queue grows.' },
      { label: 'Send a Fire-type.', text: 'The gauze catches. Briefly. Everybody is fine, and the queue grows.' }] },
];

function patient(i: number): Json {
  const p = PATIENTS[i]!;
  const next = i === PATIENTS.length - 1 ? 'gn-new-18-end' : `gn-new-18-${PATIENTS[i + 1]!.id}`;
  return rm(`gn-new-18-${p.id}`, `The Day the Center Closed: ${p.name}`, room(), p.intro, [
    p.right.needs
      ? ch(p.right.label, out(p.right.text, scene(next)), { requires: p.right.needs })
      : ch(p.right.label, out(p.right.text, scene(next))),
    ...p.wrong.map((w) => ch(w.label, out(w.text, mess(), scene(next)))),
  ]);
}

const REWARD = (nurse: string): Json[] => [stampRegion('standing-welcome'), moment(nurse, 60), bond(1)];

export const EVENTS: Json[] = [
  gev('gn-new-18-door', 'The Day the Center Closed', room({ stop: 'event', rarity: 'rare', forced: true, requires: [not('gn18-done')] }), say(
    '*The Pokémon Center\'s doors are locked from inside. Through the glass, a Chansey is running the desk, the phones and the healing machine, all at once.*',
    'It sees you. It does not stop what it is doing. It looks at you the way a person looks at a lifeboat.',
  ), [
    ch('Knock on the glass.', out(say('The Chansey unlocks the door with its foot, and hauls you in by the sleeve.', '*Behind the desk, the nurse is asleep sitting up, pen still in hand.*', 'Six patients on the bench. A clipboard with six names. The Chansey puts it in your hands.'),
      setTo('gn18-mess', 0), setTo('gn18-done', 1), stampRegion('gn18-region'), scene('gn-new-18-warm'))),
    ch('Walk on.', out('Through the glass, the Chansey watches you go. The phone rings. It answers with its other hand.')),
  ]),
  ...PATIENTS.map((_, i) => patient(i)),
  rm('gn-new-18-end', 'The Day the Center Closed: Waking', room(), say(
    'The last name is crossed off. The waiting room is quiet. The Chansey puts a blanket over the nurse, and then, very carefully, taps her shoulder.',
  ), [
    chIf([is('gn18-mess', 0, 2)], 'Let her wake.', out(say(
      '**Nurse, waking:** "What time... who did... oh."', '*She looks at the clipboard, every line neatly crossed off. She cries a little, and laughs at herself.*',
      '"Standing Welcome," she says, writing something in the ledger. "Any Center this region. Tell them I said."',
    ), ...REWARD('Took a shift at a Pokémon Center, and the nurse woke to find everything done.'))),
    chIf([is('gn18-mess', 3, 99)], 'Let her wake.', out(say(
      '*The nurse wakes, sees the clipboard, sees the bench, sees the Numel\'s scorch mark on the floor. She sighs, and fixes all of it in two minutes.*',
      '**Nurse, waking:** "Thank you. Really. Sit down, you look awful."',
      '"Standing Welcome," she adds, writing it down. "Any Center this region. You earned it twice over."',
    ), ...REWARD('Took a messy shift at a Pokémon Center. The nurse thanked them just as much.'))),
  ]),
  gev('gn-new-18-parcel', 'The Chansey\'s Parcel', { stop: 'event', rarity: 'uncommon', callback: true, minStage: 1, tags: ['Recovery', 'Story'], cast: ['npc.nurse'], pokemon: 'chansey', tint: TINT, effect: 'none',
    requires: [is('gn18-done'), regionChanged('gn18-region'), not('gn18-parcel-done')] }, say(
    '*A parcel is waiting at the first Center of the new region, with your name on it in a hand you know. The Chansey\'s.*',
    'It is mostly bandages. Rolls and rolls of them. Tucked between two, a folded drawing.',
  ), [
    ch('Unfold the drawing.', out(say('A Chansey. A trainer. Six very small patients in a row, each with a helper beside it.', 'The trainer is smiling, and so is the Chansey. At the bottom, in careful crayon: *thank you for the shift.*'),
      setTo('gn18-parcel-done', 1), item('potion', 2), bond(1), moment('A parcel of bandages arrived from a Chansey, with a drawing tucked inside.', 55))),
  ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-18-door': {
    gn: 'gn.new.18', shape: 'Single', earliest: 'A4', home: 5, window: [5, 15], sits: 'must-see', attaches: 'rest', tags: ['Minigame Episode'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'The Day the Center Closed', elsewhere: 'The Day the Center Closed' },
    note: 'Once per region, step 5 (fallback step 15). Six patients, one helper each; mistakes lengthen the queue, never worsen anything. Reward Standing Welcome: the first Center heal of the region also gives back one Revive (core/greenneedle/welcome.ts).',
  },
  'gn-new-18-parcel': {
    gn: 'gn.new.18', shape: 'Single', earliest: 'A5', home: 1, window: [1, 3], sits: 'optional', attaches: 'rest', tags: ['Minigame Episode'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'The Chansey\'s Parcel', elsewhere: 'The Chansey\'s Parcel' },
    note: 'Afterstory: a parcel at step 1 of the next region. Mostly bandages; one has a drawing on it.',
  },
};
export const CHAINS: Json[] = [];
