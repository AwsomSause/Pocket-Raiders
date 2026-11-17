// Greenneedle, gn.new.18 The Day the Center Closed (doc GREENNEEDLE_PLACED_1.md lines 656-691).
// Build: npm run co:build -- greenneedle-new-18   then   npm run co:gn
// A Chansey runs the Center alone; the nurse sleeps at the desk. Six patients, one helper each. A wrong helper only grows the queue
// (flag gn18-mess +1) and adds one more patient after the sixth (gn18-left, at most four extra). Patient 5 is a pick: only the Pokémon with the most friendship is right (gn test pickedTopBond). 0-2 mistakes is a clean shift, 3 or more a messy one. Either way: Standing Welcome for the rest of the region
// (core/greenneedle/welcome.ts), and a parcel in the next region.
import { anyType, br, ch, flag, item, out, type Json } from '../dsl.ts';
import { bond, cap, chIf, gev, gn, is, moment, notThisRegion, regionChanged, rm, say, scene, setTo, stampRegion, not, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#e8d5d9';
const room = (o: Json = {}): Json => ({ tint: TINT, tags: ['Recovery', 'Story'], effect: 'none', cast: ['npc.nurse'], pokemon: 'chansey', ...o });
/** A wrong helper: the mess count goes up and one more patient joins the queue (at most four extra). */
const miss = (): Json[] => [flag('gn18-mess', 1), flag('gn18-left', 1), cap('gn18-left', 4)];
const topBond = (): Json => ({ kind: 'gn', test: 'pickedTopBond' });

interface Patient { id: string; name: string; intro: string; right: { label: string; text: string; needs?: Json[]; pickTopBond?: boolean }; wrong: { label: string; text: string }[] }

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
    right: { label: 'Pick who sits with it.', pickTopBond: true, text: 'Yours hops up beside it and stays. They do not talk. The Pidgey leans, a little, and keeps leaning.' },
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

const choicesOf = (p: Patient, next: string): Json[] => {
  const wrongText = p.right.pickTopBond ? 'It sits down, politely. It is not the one that Pidgey would have wanted. The Pidgey knows, and the queue grows.' : '';
  return [
    p.right.pickTopBond
      ? ch(p.right.label, out(wrongText, ...miss(), scene(next)), { pick: {}, branches: [br([topBond()], p.right.text, scene(next))] })
      : p.right.needs
        ? ch(p.right.label, out(p.right.text, scene(next)), { requires: p.right.needs })
        : ch(p.right.label, out(p.right.text, scene(next))),
    ...p.wrong.map((w) => ch(w.label, out(w.text, ...miss(), scene(next)))),
  ];
};

function patient(i: number): Json {
  const p = PATIENTS[i]!;
  const next = i === PATIENTS.length - 1 ? 'gn-new-18-queue' : `gn-new-18-${PATIENTS[i + 1]!.id}`;
  return rm(`gn-new-18-${p.id}`, `The Day the Center Closed: ${p.name}`, room(), p.intro, choicesOf(p, next));
}

/** The queue made longer by each mistake: one more patient for each, after the sixth (never more than four). */
const EXTRAS: Patient[] = [
  { id: 'extra-1', name: 'Another patient: a cough', intro: say('Someone new has joined the bench: a Rattata with a cough like a rusty hinge.', 'The Chansey sighs through its whole body, and writes the name at the bottom of the list.'),
    right: { label: 'Do it yourself.', text: 'You hold the spoon, and it takes the syrup with a face like a betrayal. The cough eases. It forgives you.' },
    wrong: [{ label: 'Send a Fire-type.', text: 'It warms the Rattata, which was never the problem. The cough goes on, and so does the queue.' }, { label: 'Send a Water- or Ice-type.', text: 'A cold drink. The Rattata coughs harder. The queue grows.' }, { label: 'Send a Psychic- or Fairy-type.', text: 'It hums at the cough. The cough hums back. The queue grows.' }] },
  { id: 'extra-2', name: 'Another patient: a sleepless night', intro: say('A Hoothoot has not slept in three days, and says so, loudly, in the waiting room.', 'The Chansey holds up a finger: shh. It needs calming. Everyone in the room needs it.'),
    right: { label: 'Send a Psychic- or Fairy-type.', needs: [anyType('psychic', 'fairy')], text: 'A low hum, a slow wave of calm. The Hoothoot\'s eyes close mid-word. The bench goes quiet.' },
    wrong: [{ label: 'Send your strongest.', text: 'It stands guard, and the Hoothoot stares at it all night. The queue grows.' }, { label: 'Send a Fire-type.', text: 'A warm blanket of a Pokémon. The Hoothoot is warm and wide awake. The queue grows.' }, { label: 'Do it yourself.', text: 'You read it a pamphlet. It stays awake out of pure spite. The queue grows.' }] },
  { id: 'extra-3', name: 'Another patient: a heavy one', intro: say('A Slowpoke sat down in the doorway at dawn, and has not found a reason to get up.', 'The Chansey tries to push it. It does not move. It needs carrying, and something strong to do it.'),
    right: { label: 'Send your strongest.', text: 'Yours lifts the Slowpoke, with its whole yawn, and sets it on a bed. It wakes up an hour later, delighted.' },
    wrong: [{ label: 'Send a Water- or Ice-type.', text: 'It chills the Slowpoke, which does nothing at all. The queue grows.' }, { label: 'Send a Fire-type.', text: 'It warms the Slowpoke, which is now a warm Slowpoke in a doorway. The queue grows.' }, { label: 'Do it yourself.', text: 'You get its tail. It does not get you. The queue grows.' }] },
  { id: 'extra-4', name: 'Another patient: last name on the list', intro: say('The last one on the list is a Spearow with a bandaged wing, waiting very politely, in a bench of one.', 'The Chansey holds up a roll of gauze. Yours, again.'),
    right: { label: 'Do it yourself.', text: 'Careful, tight, kind. The Spearow tests the wing, and stays on the bench to watch you leave.' },
    wrong: [{ label: 'Send your strongest.', text: 'It tries, and has no thumbs. The queue grows.' }, { label: 'Send a Fire-type.', text: 'The gauze is a little singed. The Spearow is a little singed. The queue grows.' }, { label: 'Send a Water- or Ice-type.', text: 'Wet gauze slides right off. The queue grows.' }] },
];
const extra = (i: number): Json => rm(`gn-new-18-${EXTRAS[i]!.id}`, `The Day the Center Closed: ${EXTRAS[i]!.name}`, room(), EXTRAS[i]!.intro, choicesOf(EXTRAS[i]!, 'gn-new-18-queue'));

const REWARD = (nurse: string): Json[] => [stampRegion('standing-welcome'), moment(nurse, 60), bond(1)];

export const EVENTS: Json[] = [
  gev('gn-new-18-door', 'The Day the Center Closed', room({ stop: 'event', rarity: 'rare', forced: true, requires: [notThisRegion('gn18-region')] }), say(
    '*The Pokémon Center\'s doors are locked from inside. Through the glass, a Chansey is running the desk, the phones and the healing machine, all at once.*',
    'It sees you. It does not stop what it is doing. It looks at you the way a person looks at a lifeboat.',
  ), [
    ch('Knock on the glass.', out(say('The Chansey unlocks the door with its foot, and hauls you in by the sleeve.', '*Behind the desk, the nurse is asleep sitting up, pen still in hand.*', 'Six patients on the bench. A clipboard with six names. The Chansey puts it in your hands.'),
      setTo('gn18-mess', 0), setTo('gn18-left', 0), setTo('gn18-called', 0), setTo('gn18-done', 1), setTo('gn18-parcel-done', 0), stampRegion('gn18-region'), scene('gn-new-18-warm'))),
  ]),
  ...PATIENTS.map((_, i) => patient(i)),
  rm('gn-new-18-queue', 'The Day the Center Closed: The Queue', room(), say(
    'You look at the clipboard. The Chansey looks at the bench.',
  ), [
    chIf([is('gn18-left')], 'Call the next name.', out('The Chansey straightens up and calls the name. Someone new, very small, comes forward.', flag('gn18-left', -1), flag('gn18-called', 1),
      when('gn18-called', { min: 1, max: 1 }, [scene('gn-new-18-extra-1')]), when('gn18-called', { min: 2, max: 2 }, [scene('gn-new-18-extra-2')]),
      when('gn18-called', { min: 3, max: 3 }, [scene('gn-new-18-extra-3')]), when('gn18-called', { min: 4, max: 4 }, [scene('gn-new-18-extra-4')]))),
    chIf([not('gn18-left')], 'Cross off the last name.', out('The bench is empty. The Chansey stares at the clipboard as if it might add another. It does not.', scene('gn-new-18-end'))),
  ]),
  ...EXTRAS.map((_, i) => extra(i)),
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
      setTo('gn18-parcel-done', 1), item('potion', 2), moment('A parcel of bandages arrived from a Chansey, with a drawing tucked inside.', 55))),
  ]),
];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-new-18-door': {
    gn: 'gn.new.18', shape: 'Single', earliest: 'A4', home: 5, window: [5, 15], sits: 'must-see', attaches: 'rest', tags: ['Minigame Episode'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'The Day the Center Closed', elsewhere: 'The Day the Center Closed' },
    note: 'Once per region, step 5 (fallback step 15). Six patients, one helper each; each mistake adds one more patient to the queue (up to four), never worsens anything. For the Company patient the player points at a Pokémon, and only the one with the most Bond is right. Reward Standing Welcome: the first Center heal of the region also gives back one Revive (core/greenneedle/welcome.ts).',
  },
  'gn-new-18-parcel': {
    gn: 'gn.new.18', shape: 'Single', earliest: 'A5', home: 1, window: [1, 3], sits: 'optional', attaches: 'rest', tags: ['Minigame Episode'],
    level: 'None', often: 'region', badge: 'own',
    dressing: { kanto: 'The Chansey\'s Parcel', elsewhere: 'The Chansey\'s Parcel' },
    note: 'Afterstory: a parcel at step 1 of the next region. Mostly bandages; one has a drawing on it.',
  },
};
export const CHAINS: Json[] = [];
