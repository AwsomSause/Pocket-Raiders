// Greenneedle gn.62: The Pokémon Prison (doc GREENNEEDLE_REWORKED_PLACED_13.md lines 290–386; rules in src/core/greenneedle/prison.ts).
// Build: npm run co:build -- greenneedle-62   then   npm run co:gn
import { ch, fight, heal, join, party, type Json, out } from '../dsl.ts';
import { chIf, exactly, gev, gn, is, kindness, laterStage, leavePseudo, moment, not, rm, say, scene, setTo, stampStage, when, type Placement } from './_gn.ts';
import { evil, foe, rep } from './_evil-story-kit.ts';

export { CATEGORY } from './_gn.ts';

const TINT = '#3a3d45';
const jail = (o: Json = {}): Json => ({ tint: TINT, tags: ['Evil Team', 'Story'], effect: 'none', ...o });
const gnc = (test: string): Json => ({ kind: 'gn', test });
const pr = (key: string, o: Json = {}): Json => gn('prison', { key, ...o });
const next = pr('next');
const toHub = (...fx: Json[]): Json[] => [...fx, next];

// ---------------------------------------------------------------------------------------------------------------------
// The way in: the cell, the old man next door, the clock at zero. Rank and file are all gone: the belt, the Balls, the team.
// ---------------------------------------------------------------------------------------------------------------------
const ENTRY: Json[] = [
  gev('gn-62-cell', 'The Pokémon Prison', jail({
    stop: 'event', rarity: 'rare', forced: true,
    // The ambush: a 10% roll a stage (gn test `prisonAmbush`, core/greenneedle/prison.ts). A loss to a lieutenant or boss opens the cell without it.
    requires: [{ kind: 'evil', after: 3 }, not('prison-seen'), not('kanto-flight-stolen'), gnc('notInsideTeam'), gnc('prisonAmbush')],
    remembers: [
      { id: 'defector', when: [is('defector-trust', 3)], notice: 'The cell door is already unlatched. Someone left it that way. On the cot lies a guard\'s cap and jacket, folded, with a note that says only: "Sorry it\'s late."' },
    ],
  }), say(
    '*A cell. A cot. A slot in the door.*',
    '*The belt\'s on a hook on the far side of the bars. It\'s empty. The Balls are gone.*',
    'Your team is gone. Your hands are empty. Somewhere in this building, they are being counted like crates.',
    '**A voice from the next cell, an old man, Osei Tarrant:** "New one. They take the Pokémon first. Then they wait for you to stop asking. Don\'t stop asking."',
    'Six steps on the clock. Then a transport comes, and takes every Pokémon in the building where you can never follow.',
  ), [
    ch('Answer the old man.', out('"Osei Tarrant," he says. "Thirty-one years a ranger. Listen. Guards walk loops, and a loop can be learned. Count them." You count.',
      pr('start'), pr('osei-talk'), next)),
    ch('Try the door.', out('You try the latch. It\'s old iron and a stubborn bolt, but the bolt was never meant for someone who keeps trying. It gives. Cold air.',
      pr('start'), next)),
  ]),
];

// ---------------------------------------------------------------------------------------------------------------------
// The cell block: four wings, three halls. Ten choices spread over three rooms, because a room only has four buttons.
// ---------------------------------------------------------------------------------------------------------------------
const wingGo = (w: number, label: string, text: string): Json =>
  chIf([not(`pr-done-${w}`)], label, out(text, pr('enter', { n: w }), next));
const HUB = [
  '*The cell block. A long, low corridor, damp walls, a lamp every ten steps.*',
  '{prison:clock}',
  '{prison:status}',
  'North, the Kennels: the scent of dog. East, the Tanks: wet floors. South, the Quiet Cells: no guards at all. West, the Yard: a searchlight.',
];
const hubs: Json[] = [
  rm('gn-62-hub', 'The Pokémon Prison: The Cell Block', jail(), say(...HUB), [
    wingGo(1, 'North: the Kennels.', 'You take the north passage. The smell reaches you first. Then, deep in the dark, a low, wet, patient breathing.'),
    wingGo(2, 'East: the Tanks.', 'You take the east passage. The floor shines. Somewhere, water drips, and every drop sounds like a footstep.'),
    wingGo(3, 'South: the Quiet Cells.', 'You take the south passage. It gets quieter with every step. It is the kind of quiet someone made on purpose.'),
    ch('Further along the block.', out('You go on down the block, past the first lamp, past the second.', scene('gn-62-hub-b'))),
  ]),
  rm('gn-62-hub-b', 'The Pokémon Prison: The Other Doors', jail(), say(
    '*Further along. Doors on both sides, and one corridor going west into the night air.*',
    '{prison:clock}',
    'West: the Yard. The laundry, the kitchen and the guardroom. Osei Tarrant\'s door. And at the end of it all, the gatehouse.',
  ), [
    wingGo(4, 'West: the Yard.', 'You push the west door. Wind, stars, and the sound of big wings tied down against their will.'),
    ch('The laundry, the kitchen, the guardroom.', out('Three doors in a row, all unlocked. Nobody locks the doors nobody wants.', scene('gn-62-supplies'))),
    ch('Osei Tarrant\'s door.', out('You stop at the next cell. He looks up, and doesn\'t ask for anything.', scene('gn-62-osei'))),
    ch('The gatehouse, or back.', out('The corridor opens to a wider hall. Lamplight comes under a door at the far end.', scene('gn-62-end-hall'))),
  ]),
  rm('gn-62-end-hall', 'The Pokémon Prison: The End of the Block', jail(), say(
    '*A wide hall. At the far end, a door with lamplight under it, and a smell of supper.*',
    'Behind you, the cell block. Ahead, the gatehouse, and the man who runs this place.',
    '{prison:clock}',
  ), [
    ch('Go to the gatehouse.', out('You have what you have. You open the door.', pr('gate'), next)),
    ch('Back to the cell block.', out('You turn back. There is still time. There is, in fact, a clock.', scene('gn-62-hub'))),
  ]),
];

// ---------------------------------------------------------------------------------------------------------------------
// Supplies: the cap, the cart, the kitchen's scraps and torch, the key ring from a sleeping guard (a timing press), a whistle.
// ---------------------------------------------------------------------------------------------------------------------
const supplies: Json[] = [
  rm('gn-62-supplies', 'The Pokémon Prison: Supplies', jail(), say(
    '*Three doors. The laundry, with its warm wet smell of soap. The kitchen, with a pot still on the stove. The guardroom, where someone is snoring.*',
    '{prison:status}',
  ), [
    ch('The laundry.', out('Racks of grey uniforms, and a big wicker cart on wheels.', scene('gn-62-laundry'))),
    ch('The kitchen.', out('A pot of something with onions in it. A strong smell, almost a weapon.', scene('gn-62-kitchen'))),
    ch('The guardroom.', out('A guard asleep in a chair, boots on the desk, a ring of keys on his chest going up and down.', scene('gn-62-guardroom'))),
    ch('Back to the cell block.', out('You ease the door shut behind you.', scene('gn-62-hub'))),
  ]),
  rm('gn-62-laundry', 'The Pokémon Prison: The Laundry', jail(), say(
    '*Racks of grey uniforms. A cap and jacket on a hook, your size, near enough.*',
    'A guard\'s cap will pass you by the guards at a distance. It won\'t pass a sergeant, and it won\'t fool a dog, who knows the smell.',
    'In the corner, a laundry cart on wheels. Something small could ride in it, with you hiding under the sheets.',
  ), [
    chIf([not('pr-disguise')], 'Take the guard\'s cap and jacket.', out('The jacket smells of other people\'s sweat. It fits. You settle the cap low, and for a moment you feel like somebody else.', pr('cap'), scene('gn-62-supplies'))),
    chIf([not('pr-cart'), not('pr-cart-used')], 'Take the laundry cart.', out('You push the cart out. One wheel squeals. You oil it with a drop of soap.', pr('cart'), setTo('pr-cart-used', 1), scene('gn-62-supplies'))),
    ch('Back.', out('You leave the soap and the steam behind.', scene('gn-62-supplies'))),
  ]),
  rm('gn-62-kitchen', 'The Pokémon Prison: The Kitchen', jail(), say(
    '*A pot of stew on the stove, thick with onion and old pepper. Strong enough to make your eyes water at ten paces.*',
    'Water, or a smell strong enough to bury yours, would send a tracker-dog the wrong way. A torch hangs by the door, for the cellar.',
  ), [
    chIf([not('pr-scraps')], 'Take the scraps and the pot-water.', out('You fill a pail with the stew\'s cold water and wrap the onion-ends in a rag. You will smell like a kitchen for a week.', pr('smell'), scene('gn-62-supplies'))),
    chIf([not('pr-torch')], 'Take the torch.', out('A steady beam. In the dark, you will see two steps farther than anyone expects.', pr('torch'), scene('gn-62-supplies'))),
    ch('Back.', out('You leave the stew to go cold.', scene('gn-62-supplies'))),
  ]),
  rm('gn-62-guardroom', 'The Pokémon Prison: The Guardroom', jail(), say(
    '*A guard, asleep, boots on the desk. A ring of keys on his chest rises and falls. A whistle hangs on a hook by his head.*',
    '{prison:snore}',
    'The ring only comes away in the pause. Reach at any other moment and he wakes.',
  ), [
    chIf([not('pr-keys')], 'Reach for the key ring.', out('Your fingers close on cold iron, and the ring slides free without a sound, and you do not breathe until you are in the doorway.', pr('ring'), next)),
    chIf([not('pr-keys')], 'Wait a breath.', out('You wait. His chest rises and falls. You count it, and learn it.', pr('snore'), scene('gn-62-guardroom'))),
    chIf([not('pr-whistle')], 'Take the whistle from the hook.', out('A plain tin whistle, shrill enough for any corridor. You tuck it away. It will call guards to the wrong place.', pr('whistle'), scene('gn-62-guardroom'))),
    ch('Back.', out('You leave him snoring.', scene('gn-62-supplies'))),
  ]),
  rm('gn-62-osei', 'The Pokémon Prison: Osei Tarrant', jail(), say(
    '*The next cell. An old man in a ranger\'s grey coat that has lost its badges, sitting very straight on the cot.*',
    '**Osei:** "I don\'t ask. I\'ve asked thirty-one years and it never once worked. But I won\'t say no."',
  ), [
    chIf([is('pr-keys'), not('prison-osei')], 'Open his door.', out('The bolt turns. He doesn\'t move for a moment. Then he stands, slowly, like a man remembering how. "Go on," he says. "I\'ll keep the light."', pr('osei'), kindness(1), scene('gn-62-hub'))),
    ch('Talk through the bars.', out('He tells you which corridor to try first, and how the guards ate their supper in shifts. You listen. It is a kind of gift.', pr('osei-talk'), scene('gn-62-hub'))),
    ch('Back to the cell block.', out('You touch the bars once. "Don\'t stop asking," he says.', scene('gn-62-hub'))),
  ]),
];

// ---------------------------------------------------------------------------------------------------------------------
// A wing: a corridor with one watcher on a loop. Waiting shows the next step. Seen: back to the cell, the clock moves on one.
// ---------------------------------------------------------------------------------------------------------------------
const guardFight = (): Json => ({
  ...foe('grunt', 'Prison Guard', 2, { lv: 0, win: [pr('clear'), next] }),
  friendly: true, lose: [pr('caught'), next],
});
const wings: Json[] = [
  rm('gn-62-wing', 'The Pokémon Prison: The Corridor', jail(), say(
    '{prison:wing}',
    '{prison:clock}',
  ), [
    ch('Move on.', out('You step to the next lamp, heart in your mouth.', pr('go'), next)),
    ch('Wait a step.', out('You press into the wall and hold your breath, and the corridor shows you what it does next.', pr('wait'), next)),
    ch('Use something, or fight.', out('You think about what you are carrying, and who is with you.', scene('gn-62-use'))),
    ch('Back to the cell block.', out('You back out the way you came. No one saw. This time.', pr('back'), next)),
  ]),
  rm('gn-62-use', 'The Pokémon Prison: What You Carry', jail(), say(
    '{prison:status}',
    'A whistle calls the watcher to the wrong corridor for two steps. A cart hides you for three. A freed Pokémon can fight a guard instead of dodging one.',
  ), [
    chIf([is('pr-whistle')], 'Blow the whistle.', out('Somewhere behind you, a shrill note. Boots go the wrong way, shouting.', pr('use-whistle'), scene('gn-62-wing'))),
    chIf([is('pr-cart')], 'Climb into the cart.', out('Under the sheets, in the dark, hidden among the wet linen. A cart, to a guard, is just a cart.', pr('use-cart'), scene('gn-62-wing'))),
    chIf([party(1), is('pr-loc', 1, 2), not('pr-clear-1'), not('pr-clear-2')], 'Battle the guard.', fight('Your freed Pokémon steps in front of you, hackles up. The guard drops his lamp and reaches for a Ball.', guardFight())),
    ch('Never mind.', out('You decide to keep going.', scene('gn-62-wing'))),
  ]),
  rm('gn-62-caught', 'The Pokémon Prison: Seen', jail(), say(
    '*"Hey!"*',
    'A hand on your collar. A lamp in your face. They walk you back down the block without a word, as if it was always going to end this way.',
    'The door shuts. The clock moves on one step. What you already unlocked stays unlocked. It is the only comfort here.',
    '{prison:clock}',
  ), [
    ch('Get up and begin again.', out('You count the loops from the beginning. You know them better now.', scene('gn-62-hub'))),
  ]),
  rm('gn-62-cell-room', 'The Pokémon Prison: The Cells', jail({
    remembers: [{ id: 'smuggled', when: [is('smuggle-joined'), exactly('pr-loc', 3)], notice: 'One of them is already awake, at the back, calm as a stone. The smuggled one, the one you waited out. It is keeping the little ones quiet.' }],
  }), say(
    '*It\'s at the back.*',
    '{prison:cell}',
    'The lock needs the key ring. {prison:strangers}.',
  ), [
    chIf([is('pr-keys')], 'Open the cells.', out('It hears the key. It doesn\'t move until it sees who it is. Then it moves.', pr('free', { n: 0 }), scene('gn-62-strangers'))),
    chIf([not('pr-keys')], 'The lock won\'t open.', out('You rattle it, and swear softly. You need the key ring from the guardroom.', pr('back'), next)),
    ch('Go back for now.', out('You press a palm to the bars, and promise. Then you walk back.', pr('back'), next)),
  ]),
  rm('gn-62-strangers', 'The Pokémon Prison: The Others', jail(), say(
    'Every wing has strangers\' Pokémon too: other people\'s, taken the same way. {prison:strangers}.',
    'They watch you. They don\'t cry out. They\'ve learned not to.',
    '{prison:clock}',
  ), [
    ch('Open them all.', out('It costs a step of the clock to do the locks. They scatter, loudly. Every guard in the building has a great deal to do.', pr('stranger', { n: 0, min: 1 }), next)),
    ch('Just mine. There isn\'t time.', out('You leave them. They watch you go, and say nothing.', pr('stranger', { n: 0, min: 2 }), next)),
    ch('Open them, and tell them to wait for the signal.', out('You open every cell. "Wait," you whisper. "Stay in. Be silent. I\'ll call you." They don\'t move. They\'re good at waiting.', pr('stranger', { n: 0, min: 3 }), next)),
  ]),
];

// ---------------------------------------------------------------------------------------------------------------------
// The warden. Five Pokémon at A+2, against whoever has been freed. The clock out: he's here at once.
// ---------------------------------------------------------------------------------------------------------------------
const wardenFoe = (win: Json[], lose: Json[]): Json => ({
  ...foe('leader', 'Warden Silas Venn', 5, { lv: 2, win }), friendly: true, rule: { gn: 'prison-warden' }, lose,
});
const WIN: Json[] = [
  pr('end', { n: 1 }),
  when('prison-osei', { min: 1 }, [setTo('prison-trench-key', 1)], 'Osei Tarrant\'s key is in your pocket. He pressed it into your palm and said nothing. It opens one locked room in the team\'s Hideout.'),
  when('prison-freed-strangers', { min: 1 }, [gn('cast', { key: 'prison-stranger', species: ['growlithe', 'poochyena', 'azurill', 'vulpix', 'swablu', 'snorunt', 'meowth', 'machop'], n: 1 }), join({ species: ['@prison-stranger'] })],
    'A stranger\'s Pokémon, whose trainer can\'t be found, steps out of the crowd and asks, with its whole body, to stay.'),
  evil({ mark: 'files' }), rep(1), setTo('prison-ledger', 1),
  moment('Broke out of the team\'s Pokémon Prison, and beat its warden at his own supper.', 80),
  scene('gn-62-after'),
];
const LOSE: Json[] = [
  pr('end', { n: 2 }), heal(0.5),
  scene('gn-62-lost'),
];
const warden: Json[] = [
  rm('gn-62-warden', 'The Pokémon Prison: The Warden', jail({
    remembers: [
      { id: 'timesup', when: [is('pr-out')], notice: 'A truck idles in the yard. The transport has come. There is no more time.' },
      { id: 'none', when: [exactly('prison-strangers-open', 0), exactly('prison-signal', 0)], notice: '**The warden:** "And you left the rest. Sensible. That\'s exactly what I would have done."' },
    ],
  }), say(
    '*The gatehouse. A man in a clean uniform, eating his supper, with your belt on the desk beside the plate.*',
    '**Warden, Mr. Silas Venn:** "Out of your cell. Enterprising. Sit down. You\'ll be going back in a moment, and you may as well be comfortable."',
    '{prison:left}',
  ), [
    chIf([is('prison-signal'), not('pr-signaled')], 'Give the signal.', out('You raise one hand. In every open cell of the building, something lifts its head, and listens, and understands.', pr('signal'), scene('gn-62-warden'))),
    chIf([is('pr-signaled')], 'Fight. The signal is out.', fight('The doors burst. Every stranger\'s Pokémon in the building pours into the gatehouse. The warden\'s first two don\'t get to act.', wardenFoe(WIN, LOSE))),
    chIf([not('pr-signaled')], 'Face the warden.', fight('You stand. The lamplight shows what you are: alone, with whoever you freed, and nothing left to lose.', wardenFoe(WIN, LOSE))),
    chIf([is('pr-unfreed'), not('prison-went-back')], 'Go back for the ones you left.', out('It costs the last step of the clock. You run the block again, and open every cell you passed, and carry them out one by one.', pr('return'), scene('gn-62-warden'))),
  ]),
  rm('gn-62-warden-bare', 'The Pokémon Prison: The Warden', jail(), say(
    '*The gatehouse. A man in a clean uniform, eating his supper, with your belt on the desk beside the plate.*',
    '**Warden, Mr. Silas Venn:** "Out of your cell. Enterprising. Sit down. You\'ll be going back in a moment, and you may as well be comfortable."',
    'You have nobody. Not one Pokémon freed, and nothing to fight with. He doesn\'t even look up.',
  ), [
    ch('Sit down.', out('You sit. He finishes his supper. In the morning, he has you put out of the gate, with your team beside you, and no explanation.', ...LOSE)),
  ]),
  rm('gn-62-lost', 'The Pokémon Prison: The Gate', jail(), say(
    '*In the morning, the gate opens. You\'re put out of it with your whole team and no explanation. Nobody even looks.*',
    'They kept the ledger. They kept the reward. They kept something for later. It costs you the prize, and not the run.',
  ), [
    ch('Walk away.', out('You walk down the road with all of them around you. Nobody says anything, and everybody leans in close.', moment('Put out of the Pokémon Prison at dawn, with the whole team and no explanation.', 55), setTo('prison-warden', 2), leavePseudo())),
  ]),
  rm('gn-62-after', 'The Pokémon Prison: After', jail({
    remembers: [{ id: 'left', when: [is('prison-left')], notice: 'The last cell\'s opened by a guard, after it\'s over. The Pokémon in it walks out. It looks at the others, who came for the warden. It looks at you. It gets into its Ball without being asked. Its Bond drops by one.' }],
  }), say(
    '*Dawn. The gate stands open. A truck rolls away, empty.*',
    'Every rescued Pokémon is back in the party. The prison\'s ledger is in your hands: every name, every date, every price.',
  ), [
    ch('Walk out.', out('You walk out with your team around you, whole. The old man\'s lamp is still lit behind you.', leavePseudo())),
  ]),
];

// ---------------------------------------------------------------------------------------------------------------------
// Afterstory: strangers' Pokémon the player freed are met again with their trainers, one per later stage.
// ---------------------------------------------------------------------------------------------------------------------
// Each meeting is its own event (the n-th needs n freed and the one before it done, on a later stage), so they come one per later stage.
const MEETINGS: [string, string, string][] = [
  ['*A trainer on the road stops dead, and stares.*', 'Behind them, a Pokémon is already running. It knows you. It knows the Yard, the Tanks, the dark. It crosses the road in a streak.', '**The trainer:** "You\'re the one. They said your name in the paper. They said you opened every door."'],
  ['*A trainer on the road stops, and stares. You have never seen her before. Her Pokémon has seen you.*', 'It is already running. It was in the Kennels, in iron. It does not look like that now.', '**The trainer:** "So that\'s you. It jumps whenever it hears your name. I thought it was the name of a Pokémon it had lost."'],
  ['*A boy with a rucksack too big for him stops in the middle of the road, and stares.*', 'The small one on his shoulder is off it before he can speak. It was in the Quiet Cells. It is not quiet now.', '**The boy:** "They told me somebody let them all out. They told me the name. I\'ve been saying it to everyone on this road, to see who turned round."'],
  ['*Two trainers on the road stop talking, at the same moment, and stare.*', 'Both their Pokémon are already running. They were in the Tanks together, behind the same glass.', '**One of them:** "We know your name. We put it on the gate at home. You can see it from the road."'],
  ['*An old woman with a walking stick stops, and stares, and then drops the stick.*', 'Her Pokémon gets to you first. It was tethered in the Yard, under a night sky. It has flown every day since.', '**The old woman:** "I know your name. I say it at night, with the others. I never thought I\'d need a face for it."'],
  ['*A man mending a fence by the road looks up, and stops, and stares.*', 'His Pokémon is over the fence before he has put the hammer down. It was the last one out of its wing. It never forgot who held the door.', '**The man:** "I know who you are. Everyone round here knows your name. Come in. No, come in. It won\'t let you walk past."'],
  ['*A trainer coming the other way stops dead, and stares.*', 'Their Pokémon is already running. Whichever wing it was in, it remembers the door opening, and who was standing there.', '**The trainer:** "You\'re the one. It knew you before I did. They all know your name, the ones from that place."'],
];
const meeting = (n: number): Json => gev(n === 1 ? 'gn-62-stranger' : `gn-62-stranger-${n}`, 'The Pokémon Prison: A Trainer on the Road', jail({
  stop: 'event', rarity: 'rare', callback: true, requires: [is('prison-reunions', n), exactly('prison-reunion-n', n - 1), ...(n > 1 ? [laterStage('prison-reunion-at')] : [])],
}), say(...MEETINGS[n - 1]!), [
  ch('Kneel and let it come.', out('It crashes into you, and then, shaking, into its trainer. Neither of them has a word. Both of them have your name.', kindness(1), setTo('prison-reunion-n', n), stampStage('prison-reunion-at'), moment('A stranger\'s Pokémon you freed found its trainer on the road.', 60))),
]);
const after: Json[] = MEETINGS.map((_, i) => meeting(i + 1));

// ---------------------------------------------------------------------------------------------------------------------
// The team's own, from inside: no escape. The player is posted here as a guard for one mission, and every cell is a choice.
// ---------------------------------------------------------------------------------------------------------------------
const guardCell = (n: number, name: string, text: string, nextId: string): Json =>
  rm(`gn-62-guard-${n}`, `The Pokémon Prison: Posted (${name})`, jail(), say(`*${text}*`, 'Keys on your belt. A clipboard that says what to do. Nobody has asked what you think.'), [
    ch('Lock it, as ordered.', out('You turn the key. The click is very loud. You don\'t look at what is inside.', scene(nextId))),
    ch('Leave it unlatched.', out('You turn the key halfway, the way a careless man would. Behind you, something that has learned patience starts to wait.', kindness(1), setTo(`prison-guard-freed-${n}`, 1), scene(nextId))),
  ]);
const guardPost: Json[] = [
  gev('gn-62-guard', 'The Pokémon Prison: Posted', jail({
    stop: 'event', rarity: 'rare', forced: true, requires: [{ kind: 'evil', after: 3 }, not('prison-seen'), gnc('insideTeam')],
  }), say(
    '*A grey uniform. A ring of keys. A mission order with the team\'s seal.*',
    'You\'ve been posted to the prison for one shift, as a guard. Nobody here knows what you are.',
    'Every cell is yours to lock or not. Each one has somebody in it.',
  ), [
    ch('Take the keys.', out('The ring is heavier than you thought. You start down the block, a guard among guards.', setTo('prison-seen', 1), scene('gn-62-guard-1'))),
  ]),
  guardCell(1, 'Kennels', 'North, the Kennels. The big ones, in iron, still growling at the dark.', 'gn-62-guard-2'),
  guardCell(2, 'Tanks', 'East, the Tanks. Glass, standing water, shapes turning slowly behind it.', 'gn-62-guard-3'),
  guardCell(3, 'Quiet Cells', 'South, the Quiet Cells. The smallest and the youngest, kept apart, calling to nobody.', 'gn-62-guard-4'),
  guardCell(4, 'Yard', 'West, the Yard. Tethered wings against a night sky.', 'gn-62-guard-end'),
  rm('gn-62-guard-end', 'The Pokémon Prison: The Shift Ends', jail(), say(
    '*The shift ends at dawn. The count comes up short in ways nobody can quite explain.*',
    'You hand in the keys. The sergeant looks at you a moment too long, and then, tiredly, writes something in his book.',
  ), [
    ch('Hand in the keys.', out('You hand in the keys, and nobody says a thing. Somewhere behind you, a cell door sits a little open.', evil({ mark: 'files' }), moment('Posted as a prison guard for a night, and decided about every cell.', 60), leavePseudo())),
  ]),
];

export const EVENTS: Json[] = [...ENTRY, ...hubs, ...supplies, ...wings, ...warden, ...after, ...guardPost];
export const REMOVE: string[] = [];

export const PLACEMENT: Record<string, Placement> = {
  'gn-62-cell': {
    gn: 'gn.62', shape: 'Pseudo Stage', earliest: 'A7', home: 12, window: [9, 15], sits: 'must-see', attaches: 'instead', tags: ['Evil Team'],
    level: 'Guards A+0; the warden A+2', often: 'run', badge: 'None',
    dressing: { kanto: 'The Pokémon Prison', elsewhere: 'The Pokémon Prison' },
    note: 'Only in a region with an evil-team story, as an ambush: a 10% roll each stage (gn test prisonAmbush); not in a run where Flight North\'s theft happened. The doc\'s main trigger, a loss to a team\'s lieutenant or boss, opens the cell instead of the loss\'s usual cost (core/greenneedle/prison.ts prisonOnLoss; run.ts). Four wings, a clock of six steps, the warden.',
  },
  'gn-62-guard': {
    gn: 'gn.62', shape: 'Pseudo Stage', earliest: 'A7', home: 12, window: [9, 15], sits: 'must-see', attaches: 'instead', tags: ['Evil Team'],
    level: 'None', often: 'run', badge: 'None',
    note: 'The doc\'s "inside the team" version: posted here as a guard for one mission. Opens when the player is inside a team (any run flag team-<id>-inside, from the inside route in #1336 / #1339; works whether or not they have merged).',
  },
  'gn-62-stranger': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
  'gn-62-stranger-2': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
  'gn-62-stranger-3': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
  'gn-62-stranger-4': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
  'gn-62-stranger-5': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
  'gn-62-stranger-6': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
  'gn-62-stranger-7': { gn: 'gn.62', shape: 'Single', earliest: 'A8', home: 6, window: [2, 16], sits: 'optional', attaches: 'after', tags: ['Evil Team'], level: 'None', often: 'run', badge: 'own', note: 'Afterstory: one per later stage, for as many strangers\' Pokémon as were freed (seven strangers can be freed, so up to seven meetings).' },
};

export const CHAINS: Json[] = [];
