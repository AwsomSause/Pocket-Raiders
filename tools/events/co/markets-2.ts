// Catalog Overhaul Pack: STORY_FAMILIES_11.md, SF88 THE SERVICES (14 paid services) and SF89 THE TRAINING GROUND (the Sergeant's node and 27 drills).
// Every service says its price and exactly what it changes before you pay. Each drill names its trainer, its cost and its gain.
import { ch, cure, ev, fight, flag, flagIs, hurt, hurtLead, item, leave, out, ptype, scout, takeNode, trainer, type Json } from '../dsl.ts';
import { COMMON, RARE, UNCOMMON, ask, asRoom, bond, mk, moment, need, pay, stay, temp } from './_markets.ts';

export { CATEGORY } from './_markets.ts';

const G = 'Training and growth';
const NO_MACHINES = flagIs('promise-genesect-no-machines');
const PARTS: Json = { kind: 'item', id: 'machine-part', count: 3 };
const picked = { pick: {} };
const svc = (what: string, o: Json = {}): Json => mk('service', { what, who: 'picked', ...o });
const effort = (stat: string, amount = 1, o: Json = {}): Json => mk('effort', { stat, amount, ...o });
const room = (id: string, name: string, cast: string[], intro: string, choices: Json[], stop = 'tutor'): Json => asRoom(ev(id, name, G, { stop, cast, tint: '#2a2a3a' }, intro, choices));
/** The Genesect variant: the service refuses, kindly, and only the way out is left. */
const refuses = (id: string, intro: string, hide: number[]): Json => ({ id: `${id}-no-machines`, when: [NO_MACHINES], intro, hide, addChoices: [] });

// ---------- SF88: stat and nature menus (rooms) ----------
const statRoom = (id: string, name: string, cast: string[], intro: string, rows: [string, string, string][], price: number, more: Json): Json =>
  room(id, name, cast, intro, [
    ...rows.map(([label, stat, text]) => ch(label, out(text, ...(price > 0 ? [pay(price)] : []), effort(stat, 1, { who: 'picked' })), { ...(price > 0 ? need(price) : {}), ...picked })),
    more,
  ]);
const natureRooms = (suffix: string, price: number): Json[] => {
  const cost = price > 0 ? [pay(price)] : [flag('meloetta-nature-used')];
  const o = { ...(price > 0 ? need(price) : {}), ...picked };
  const said = price > 0 ? `₽${price}, as posted.` : 'No charge. Meloetta\'s song paid for this one.';
  return [
    room(`nature-counselor-who${suffix}`, 'Who They Want to Be', ['trainer.psychic_m'], `Imelda folds her hands. "Tell me who they want to be. Not who you want. Them." ${said}`, [
      ch('Braver. (Attack)', out('Imelda speaks to your Pokémon for a long while, too low for you to hear. When it turns back to you, it stands as if it has finally been given permission.', ...cost, svc('natureNudge', { stat: 'atk' })), o),
      ch('Steadier. (Defense)', out('Imelda speaks to your Pokémon for a long while. When it turns back to you, something that was braced in it has settled.', ...cost, svc('natureNudge', { stat: 'def' })), o),
      ch('Quicker. (Speed)', out('Imelda speaks to your Pokémon for a long while. When it turns back, it is already half a step ahead of you, and delighted about it.', ...cost, svc('natureNudge', { stat: 'spe' })), o),
      ch('Something gentler.', out('"There are quieter ways to change," Imelda says, and turns the page.', stay(`nature-counselor-quiet${suffix}`))),
    ]),
    room(`nature-counselor-quiet${suffix}`, 'The Quieter Ways', ['trainer.psychic_m'], `"Some want to think more clearly. Some want to feel less hurt by the world." Imelda waits. ${said}`, [
      ch('Sharper of mind. (Sp. Atk)', out('Imelda speaks to your Pokémon for a long while. When it turns back, its eyes are clear and very far-seeing.', ...cost, svc('natureNudge', { stat: 'spa' })), o),
      ch('Calmer of heart. (Sp. Def)', out('Imelda speaks to your Pokémon for a long while. When it turns back, it leans on you, and the leaning is lighter than before.', ...cost, svc('natureNudge', { stat: 'spd' })), o),
      ch('Leave it as it is.', leave('"Then it is already who it wants to be," Imelda says. "That is the best answer. I never charge for it."')),
    ]),
  ];
};

// ---------- SF89: drills ----------
const OPEN = flagIs('drill-open');
const done = [flag('drill-open', -1), flag('drills-done')];
type Opt = { requires?: Json[]; chance?: number; prompt?: { id: string; needs: 'ok' | 'good' | 'perfect' }; failText?: string; failEffects?: Json[]; node?: boolean; battle?: Json };
/** A drill choice: needs the Sergeant's go-ahead, uses it up, and counts toward the baby's whistle. */
const dch = (label: string, text: string, effects: Json[], o: Opt = {}, free = false): Json =>
  ch(label, { ...out(text, ...effects, ...(o.node && !free ? [takeNode()] : []), ...(free ? [flag('sergeant-whistle', -1)] : []), ...done), ...(o.battle ? { battle: o.battle } : {}) }, {
    requires: [OPEN, ...(o.requires ?? [])],
    ...(o.chance !== undefined ? { chance: o.chance } : {}),
    ...(o.prompt ? { prompt: o.prompt } : {}),
    ...(o.failText !== undefined ? { fail: out(o.failText, ...(o.failEffects ?? []), ...(o.node && !free ? [takeNode()] : []), ...(free ? [flag('sergeant-whistle', -1)] : []), ...done) } : {}),
  });
type Row = [label: string, text: string, effects: Json[], o?: Opt];
const drill = (id: string, name: string, intro: string, a: Row, b: Row | Json, scene?: Json): Json => ({
  id, name, stop: 'dojo', room: true, ...(scene ? { scene } : {}),
  intro,
  choices: [dch(a[0], a[1], a[2], a[3]), Array.isArray(b) ? dch(b[0], b[1], b[2], b[3]) : b, ch('Back to the Sergeant.', leave('The Sergeant blows one short blast. Dismissed. The baby blows one too, a second late.'))],
  ...(a[3]?.node ? { remembers: [{ id: `${id}-whistle`, when: [flagIs('sergeant-whistle')], notice: 'The baby\'s whistle hangs on a cord round your neck. Blow it, and this drill costs you no node.', hide: [0], addChoices: [dch(a[0], a[1], a[2], a[3], true)] }] } : {}),
});
/** A second choice that is not a drill: it uses nothing up. */
const idle = (label: string, text: string, ...effects: Json[]): Json => ch(label, out(text, ...effects));

const DRILLS_A = ['combo-practice', 'cross-training-camp', 'crowd-support-training', 'endurance-hike', 'gym-rat', 'ice-training', 'meditation-shrine', 'mental-training-dojo', 'mountain-climb'];
const DRILLS_B = ['nap-pod-corner', 'obstacle-course', 'obstacle-dojo', 'rain-run', 'sandpit-digging', 'shadow-boxing', 'sparring-partner', 'speed-lane-treadmill', 'sprint-intervals'];
const DRILLS_C = ['stretching-break', 'swim-class', 'team-photo-day', 'trainers-pep-talk', 'training-session-2', 'waterfall-training', 'weak-spot-remedy', 'weight-room-roulette', 'yoga-retreat'];
const menu = (n = 1): Json[] => [flag('drill-open', n), { kind: 'addEventFrom', ids: DRILLS_A }, { kind: 'addEventFrom', ids: DRILLS_B }, { kind: 'addEventFrom', ids: DRILLS_C }];

export const EVENTS: Json[] = [
  // =====================================================================
  // SF88. THE SERVICES
  // =====================================================================
  // ---- 1. Ability Capsule Booth ----
  {
    id: 'ability-capsule-booth', name: 'Ability Capsule Booth',
    intro: 'A booth painted in two colours, split straight down the middle. Fizz bounces on her heels behind the counter. "Ability swaps, 500! I\'ll tell you both abilities first." The price, ₽500, is on a card. So is what it does: a Pokémon swaps between its two normal abilities, and nothing else changes.',
    choices: [
      ch('Swap.', out('Fizz cracks a capsule under your Pokémon\'s nose. It sneezes, blinks, and looks at its own paws as if they were new. "There! Same friend. New trick."', pay(500), svc('abilitySwap')), { ...need(500), ...picked }),
      ch('Show me both.', out('Fizz reads both off a little card for each of your Pokémon, slowly, pointing at each word. "I never swap anyone who hasn\'t heard both. It\'s their life."', mk('advise', { key: 'abilities', who: 'party' }), stay('ability-capsule-booth'))),
      ch('No.', leave('"That\'s fine! Some people like who they are!" Fizz waves with both hands.')),
    ],
  },
  // ---- 2 and 14. Dragon's Den (the Dragon Scale, and "Effort and Dragons") ----
  {
    id: 'dragons-den', name: "Dragon's Den",
    intro: `A cave mouth hung with shed scales that chime in the wind. Ysra, the Dragon Tamer, does not rise. "A Dragon Scale. Fair price. Only if you've a Seadra." A pause, and she looks at your team more kindly. "Or I can train your dragon to fly straight." The Scale is ₽${RARE}. The training is free, and adds Speed effort to a Dragon-type, within the cap.`,
    choices: [
      ch('Buy.', out('Ysra lays the scale in your palm. It is heavier than it looks, and warm. "It came off my first partner. She would want it used, not kept in a box."', pay(RARE), item('dragon-scale')), { requires: [...need(RARE).requires, { kind: 'partySpecies', species: 'seadra' }] }),
      ask('Just look.', 'She lets you hold it up to the light. Colours move in it like oil on deep water. "I won\'t sell it to anyone who can\'t use it. A scale in a bag is a sad thing."', 'dragons-den'),
      ch('Train.', out('Ysra walks your dragon to the cliff edge and talks to it, low and steady, until it stops fighting the wind and starts riding it. When it lands, it lands exactly where it meant to.', effort('spe', 1, { type: 'dragon', who: 'party' })), { requires: [ptype('dragon')] }),
      ch('No.', leave('The scales chime behind you all the way down the path.')),
    ],
  },
  // ---- 3. Egg Move Library ----
  {
    id: 'egg-moves-library', name: 'Egg Move Library',
    intro: `Shelves of thin books, each no bigger than a hand. Mote, the librarian, speaks in a whisper even though the room is empty. "Rare techniques only the youngest Pokémon know." One egg move for a Pokémon that could have had it: ₽${RARE}.`,
    choices: [
      ch('Teach one.', out('Mote reads to your Pokémon from a book you cannot see the words of. It listens with its whole body. Somewhere in the middle, it remembers something it was never taught.', pay(RARE), svc('eggMove')), { ...need(RARE), ...picked }),
      ask('Which can it learn?', 'Mote runs a finger along the spines. "Whatever its parents might have sung to it in the shell. I can only teach what was already waiting there. I never promise more."', 'egg-moves-library'),
      ch('No.', leave('Mote puts a finger to her lips, smiling, and you close the door very quietly.')),
    ],
    remembers: [refuses('egg-moves-library', 'Shelves of thin books. Mote meets you at the door and does not let you past it. "No machines," she whispers. "You promised." A pause. "These are books. ...I know. I know they are. I am keeping your promise wider than you made it."', [0, 1])],
  },
  // ---- 4. Effort Trainer ----
  {
    id: 'ev-trainer', name: 'Effort Trainer',
    intro: `A chalk square on packed earth, and a woman with a whistle she never needs to blow. Coach Ilka looks your team over. "One stat at a time. Pick your focus." One point of effort in one stat, within the cap: ₽${UNCOMMON}.`,
    choices: [
      ch('Pick a stat.', out('Coach Ilka chalks six words on the ground.', stay('ev-trainer-stats'))),
      ask('How much?', `"${UNCOMMON}. One point of effort, one stat, one Pokémon." Coach Ilka holds up one finger. "If it's already at its limit, I'll say so and you keep your money. I don't sell sweat for nothing."`, 'ev-trainer'),
      ch('No.', leave('"Then rest. Rest is training too." She means it.')),
    ],
  },
  statRoom('ev-trainer-stats', "Coach Ilka's Square", ['trainer.marshal'], `Six words in chalk. "Point, and say who." ₽${UNCOMMON} each.`, [
    ['Attack.', 'atk', 'An hour of strikes against a padded post. Coach Ilka corrects one elbow, once. It is enough.'],
    ['Defense.', 'def', 'An hour of taking hits on a braced guard. Coach Ilka never swings hard, and never stops.'],
    ['Speed.', 'spe', 'An hour of sprints between two chalk lines. Coach Ilka runs the last one alongside, and loses on purpose.'],
  ], UNCOMMON, ch('More stats.', out('She rubs out three words and chalks three more.', stay('ev-trainer-stats-2')))),
  statRoom('ev-trainer-stats-2', "Coach Ilka's Square", ['trainer.marshal'], `She wipes the board and chalks three more words, slower this time. ₽${UNCOMMON} each.`, [
    ['HP.', 'hp', 'An hour of slow laps with a weighted pack. Coach Ilka carries one too.'],
    ['Sp. Atk.', 'spa', 'An hour of focus: one target, one breath, one burst. Coach Ilka holds the target herself.'],
    ['Sp. Def.', 'spd', 'An hour of standing still while the wind machine howls. Coach Ilka stands in it too.'],
  ], UNCOMMON, ch('Back.', leave('"Think about it. A focus you chose badly is worse than none."'))),
  // ---- 5. Evolution Tutor ----
  {
    id: 'evolution-tutor', name: 'Evolution Tutor',
    intro: 'A folding table, a tower of notebooks, and a professor with ink on his chin. Professor Bram-Hale adjusts his glasses. "Tell me who you\'re carrying and I\'ll tell you when they\'ll change." It is free. He would do it for nothing, and does.',
    choices: [
      ch('Ask about one.', out('Professor Bram-Hale kneels to look your Pokémon in the eye, and speaks to it rather than to you. "You have a way to go yet. Or perhaps you don\'t. Let me tell you."', mk('advise', { key: 'evolutions', who: 'picked' }), stay('evolution-tutor')), picked),
      ch('Ask about all.', out('He goes down the whole line, one by one, and has something true and gentle to say about each. Nobody is left out. Nobody is told they are behind.', mk('advise', { key: 'evolutions', who: 'party' }), stay('evolution-tutor'))),
      ch('No.', leave('"Quite right. Some things are better found out by living them." He goes back to his notebooks, smiling.')),
    ],
  },
  // ---- 6. Expert Breeder ----
  {
    id: 'expert-breeder', name: 'Expert Breeder',
    intro: `A porch full of baskets, each lined with a different blanket. Nan Okafor rocks slowly, an Egg in her lap. "I can teach an egg move. I'll tell you which first." Cheaper than the Library: ₽${UNCOMMON}. One move each region; she will not rush more than that.`,
    choices: [
      ch('Teach.', out('Nan hums something old, and your Pokémon hums it back, haltingly, then surely. "There. Its mother knew that. Now it does. Nothing is ever really lost, you see."', pay(UNCOMMON), svc('eggMove'), flag('breeder-nan-taught')), { ...need(UNCOMMON), ...picked }),
      ask('Which?', '"The one its line carries. I listen to them first. They tell me." Nan pats the Egg in her lap. "If it has none waiting, I\'ll say so, and you\'ll owe me nothing but the visit."', 'expert-breeder'),
      ch('No.', leave('Nan keeps rocking. The Egg keeps listening.')),
    ],
    remembers: [refuses('expert-breeder', 'A porch full of baskets. Nan Okafor stops rocking when she sees you. "No machines, you said. I\'m no machine, child." She thinks about it. "But I\'ll honour the spirit of it. Sit. Have some tea instead."', [0, 1])],
  },
  // ---- 7. Armour Fitting ----
  {
    id: 'heavy-armor-fitting', name: 'Armour Fitting',
    intro: `A forge that has been burning since before the road was paved. Roald, the blacksmith, lifts a breastplate as if it weighed nothing. "Heavy armour. Slows you. Nothing gets through." A held item: Defense up, Speed down. ₽${UNCOMMON}.`,
    choices: [
      ch('Fit it.', out('Roald measures with a knotted cord, hammers twice, and buckles it on himself. Your Pokémon takes one heavy step. Then it plants its feet, and you understand that nothing is going to move it.', pay(UNCOMMON), item('iron-ball')), need(UNCOMMON)),
      ask('How slow?', '"Half as quick. I won\'t dress that up." Roald knocks on the plate. It rings like a bell. "But you could drop a wall on it. Ask me how I know."', 'heavy-armor-fitting'),
      ch('No.', leave('Roald nods and goes back to the anvil. The hammer falls in a slow, unhurried rhythm.')),
    ],
  },
  // ---- 8. Hyper Training Gym ----
  {
    id: 'hyper-training-gym', name: 'Hyper Training Gym',
    intro: 'A gym with one piece of equipment and a man built like a doorway. Brick-Jaw cracks his knuckles. "Turn your weakest stat into a strength. 400." ₽400: one Pokémon\'s weakest inborn stat is trained to its best, within the cap.',
    choices: [
      ch('Train it.', out('Brick-Jaw works your Pokémon until it shakes, then sits down next to it on the mat and shares his water. "Wasn\'t weak. Just hadn\'t been asked."', pay(400), svc('hyper')), { ...need(400), ...picked }),
      ask('What exactly?', '"Whatever they were born worst at. I bring it level with the best there is. Not past it. There\'s a ceiling, and I respect a ceiling." He taps the price card. "Four hundred. Same for everybody."', 'hyper-training-gym'),
      ch('No.', leave('Brick-Jaw shrugs, enormous and unoffended.')),
    ],
  },
  // ---- 9. Move Forgetter ----
  {
    id: 'move-forgetter', name: 'Move Forgetter', scene: { cast: ['trainer.pr/nursery_aide'], tint: '#2a2a3a', effect: 'none' },
    intro: 'A schoolroom with one small desk. Miss Ory cleans a slate with her sleeve. "Need to forget something? Free. I\'ll tell you it\'s gone for good." It is free. A Pokémon forgets the last move it learned.',
    choices: [
      ch('Forget a move.', out('Miss Ory writes the move on the slate, shows it to your Pokémon, and wipes it clean. Your Pokémon watches the chalk dust fall. "It\'s gone, dear. You\'re lighter now. That\'s allowed."', mk('forget', { who: 'picked' })), picked),
      ask('Can it relearn?', '"Yes. At the Move Tutor. Oru keeps the old scrolls." Miss Ory sets down the slate. "I say gone for good so people think before they ask. But nothing learned with love is ever quite gone."', 'move-forgetter'),
      ch('No.', leave('"Good. Keep what you\'ve earned." She goes back to her slate.')),
    ],
  },
  // ---- 10. Move Tutor ----
  {
    id: 'move-tutor', name: 'Move Tutor',
    intro: `A hut papered with scrolls, floor to rafters. Oru, the sage, unrolls one across his knees. "Old scrolls. Old moves." A tutor move for one Pokémon: ₽${UNCOMMON}. Relearning a forgotten move: ₽${COMMON}.`,
    choices: [
      ch('Learn one.', out('Oru traces the scroll with a fingertip while your Pokémon follows the line with its eyes. Halfway down, its breathing changes. It has it.', pay(UNCOMMON), svc('learnMove')), { ...need(UNCOMMON), ...picked }),
      ch('Relearn a forgotten one.', out('Oru finds the right scroll without looking. "Ah. This one missed you," he tells your Pokémon. It leans forward, and remembers.', pay(COMMON), mk('relearn', { who: 'picked' })), { requires: [...need(COMMON).requires, flagIs('move-forgotten')], ...picked }),
      ch('No.', leave('Oru rolls the scroll back up, slowly, the way you would tuck in a child.')),
    ],
    remembers: [refuses('move-tutor', 'A hut papered with scrolls. Oru looks at you over the top of one. "No machines." He looks at the scroll. "These are scrolls." He looks at you again, and sighs, and rolls it up. "...Fine, no scrolls either."', [0, 1])],
  },
  // ---- 11. Moveset Rehearsal ----
  {
    id: 'moveset-rehearsal', name: 'Moveset Rehearsal',
    intro: `A practice hall with a move board on the wall, every peg labelled. Coach Tavi spins a marker between her fingers. "Same Pokémon, new tricks." Reordering what a Pokémon already knows is free, any time, from your party. Teaching one level-up move early: ₽${UNCOMMON}.`,
    choices: [
      ch('Rehearse.', out('Coach Tavi walks your Pokémon through a move it was not due to learn for weeks, step by step, until the steps disappear and only the move is left. "See? You were ready. You just hadn\'t been told."', pay(UNCOMMON), svc('learnMove')), { ...need(UNCOMMON), ...picked }),
      ask('Show the board.', 'She turns the board to face you: every move your team knows, and beside each Pokémon the next one it is due. "Nothing here it couldn\'t learn on its own. I just don\'t make it wait."', 'moveset-rehearsal'),
      ch('No.', leave('Coach Tavi caps the marker. "Door\'s always open. Bring snacks next time."')),
    ],
    remembers: [refuses('moveset-rehearsal', 'A practice hall, a move board, and Coach Tavi turning the board to face the wall. "No machines. I heard." She shrugs. "The board\'s got wheels. Counts as a machine. I\'m being careful with your promise."', [0, 1])],
  },
  // ---- 12. Nature Counsellor ----
  {
    id: 'nature-counselor', name: 'Nature Counsellor',
    intro: `A quiet room with two cushions and a window. Imelda pours tea for three: you, herself, and your lead. "Natures aren't fixed. Tell me who your lead wants to be." A change of Nature: ₽${RARE}.`,
    choices: [
      ch('Change nature.', out('Imelda sets down her cup and gives your Pokémon her whole attention.', stay('nature-counselor-who'))),
      ch("What's it now?", out('Imelda watches your lead drink its tea, and tells you what she sees. She is right about all of it, including the thing you had not noticed.', mk('advise', { key: 'nature', who: 'party' }), stay('nature-counselor'))),
      ch('No.', leave('"Then finish your tea," Imelda says. "That, too, is counsel."')),
    ],
    remembers: [{ id: 'imelda-meloetta', when: [flagIs('promise-meloetta-kept'), flagIs('meloetta-nature-used', 0, 0)], notice: 'Imelda tilts her head, listening to something. "There is a song on you. Meloetta\'s. One change this region is already paid for."',
      addChoices: [ch("Change nature, free. (Meloetta's Promise)", out('Imelda hums three notes she cannot possibly know, and gives your Pokémon her whole attention.', stay('nature-counselor-who-free')))] }],
  },
  ...natureRooms('', RARE),
  ...natureRooms('-free', 0),
  // ---- 13. TM Workshop ---- (Machine Parts are the real item, so parts from any event count)
  {
    id: 'tm-workshop', name: 'TM Workshop',
    intro: 'A shed that sparks. Fidget, the tinker, pushes up a pair of goggles and leaves two clean circles in the soot. "Three Machine Parts and I\'ll forge you a disc." Three Machine Parts, no money: one TM of your choice from his list.',
    choices: [
      ch('Forge.', out('Fidget sweeps your three parts into a crucible with the side of his hand. "Right. What\'ll it be?"', stay('tm-workshop-list')), { requires: [PARTS] }),
      ask('Where are parts?', '"Wex. The scrap buyer. Sell him junk, he hands back the good cogs." Fidget grins. "He thinks he\'s doing me a favour. He is. Don\'t tell him how big."', 'tm-workshop'),
      ch('No.', leave('Something in the shed goes bang. "That\'s fine!" Fidget calls. "That\'s meant to happen!"')),
    ],
    remembers: [refuses('tm-workshop', 'A shed that has, for once, stopped sparking. Fidget sits on an upturned bucket with his goggles in his lap. "No machines." He looks around at a shed made entirely of machines. "So. I\'m learning to whittle. Look." It is a very bad spoon. He is very proud of it.', [0, 1])],
  },
  room('tm-workshop-list', "Fidget's List", ['trainer.worker_m'], 'A list nailed to the shed door, in six colours of paint. "Pick. The crucible\'s hot." Three Machine Parts for any one.', [
    ...(['fire', 'water', 'grass'] as const).map((t) => ch(`A ${t[0]!.toUpperCase()}${t.slice(1)} disc.`, out('Fidget pours, hammers, quenches, and hands you a disc still too warm to hold. "Made from three things nobody wanted. Best kind."', { kind: 'loseItem', id: 'machine-part', count: 3 }, item(`tm-${t}`)), { requires: [PARTS] })),
    ch('More discs.', out('Fidget flips the list over. There is more on the back.', stay('tm-workshop-list-2'))),
  ], 'merchant'),
  room('tm-workshop-list-2', "Fidget's List, the Back", ['trainer.worker_m'], 'The back of the list. Three Machine Parts for any one.', [
    ...(['electric', 'psychic', 'ground'] as const).map((t) => ch(`${t === 'electric' ? 'An' : 'A'} ${t[0]!.toUpperCase()}${t.slice(1)} disc.`, out('Fidget pours, hammers, quenches, and hands you a disc still too warm to hold. "Made from three things nobody wanted. Best kind."', { kind: 'loseItem', id: 'machine-part', count: 3 }, item(`tm-${t}`)), { requires: [PARTS] })),
    ch('Not yet.', leave('"Parts keep. Come back when you\'ve decided."')),
  ], 'merchant'),

  // =====================================================================
  // SF89. THE TRAINING GROUND
  // =====================================================================
  {
    id: 'drill-sergeant-kangaskhan', name: 'The Training Ground',
    intro: 'A field, mown flat. A Kangaskhan stands at its centre in a whistle and a tiny cap. The baby in its pouch has a tiny whistle too. A blast, and you somehow understand every word: "PICK A STAT. EVERYTHING ELSE, EYES FRONT." The baby blows its whistle, late. One drill per visit. Each drill says its cost and its gain before you start.',
    choices: [
      ch('Pick a drill.', out('The Sergeant points, three sharp jabs of a claw: three drills are running today, and you may join one. The baby points too, at a butterfly.', ...menu())),
      ch('Salute.', out('You salute. The Sergeant salutes back, crisp as a snapped flag. The baby salutes with the wrong arm, notices, and switches. Your lead Pokémon stands a little taller for the rest of the day.', bond(1))),
      ch('Leave.', leave('The Sergeant watches you to the edge of the field. The baby waves until you are out of sight.')),
    ],
    remembers: [
      { id: 'sergeant-whistle-gift', when: [flagIs('drills-done', 5), flagIs('sergeant-whistle-kept', 0, 0)], notice: 'Five drills done under the Sergeant\'s eye. The baby climbs half out of the pouch, lifts its tiny whistle off over its ears, and holds it out to you in both paws.',
        addChoices: [ch("Take the baby's whistle.", out('It is still warm. The Sergeant looks away across the field, very deliberately, so that nobody can say it saw anything. The baby salutes you. Correct arm, first time.', flag('sergeant-whistle-kept'), flag('sergeant-whistle'), moment("The Sergeant's baby gave you its whistle.", 70)))] },
      { id: 'sergeant-whistle-ready', when: [flagIs('sergeant-whistle-kept'), flagIs('sergeant-whistle', 0, 0)], notice: 'The baby spots its old whistle on your cord and squeaks with joy. This visit, one drill will cost you no node.', hide: [0],
        addChoices: [ch('Pick a drill.', out('The Sergeant points out three drills. The baby points at your whistle, and then at itself, so you know who to thank.', flag('sergeant-whistle'), ...menu()))] },
    ],
  },
  // 1
  drill('combo-practice', 'Combo Practice', 'Twins in matching headbands, finishing each other\'s moves. Ada and Ari speak in turns: "It only works the first time," "so make it count." Cost: a node. Gain: your next double battle, the follow-up hits a fifth harder.',
    ['Practise the combo.', 'Two of your Pokémon run it until they stop looking at each other and just know. Ada and Ari high-five without turning their heads. "That\'s it," "that\'s the one."', [temp('Combo: follow-up moves +20%', [{ kind: 'battleOrderDamage', first: 1, later: 1.2 }], 1)], { node: true }],
    idle('Watch.', 'You watch the twins instead. They are so in step it is like watching one person in a mirror. Your team watches too, and leans a little closer to one another.')),
  // 2
  drill('cross-training-camp', 'Cross-Training', 'Mats, a quiet room, a ring of lamps. Saffi, the organiser, claps a clipboard. "Learn something outside your type." Cost: your lead starts its next battle down 10% HP. Gain: one Fighting, Psychic or Dark move it can learn.',
    ['Swap drills.', 'Your lead spends the day in someone else\'s shoes, and comes out sore, baffled, and holding something new. Saffi ticks a box. "Everyone hates it. Everyone thanks me."', [hurtLead(0.1), mk('service', { what: 'learnMove', types: ['fighting', 'psychic', 'dark'] })]],
    idle('Stick to type.', '"That\'s a choice too," Saffi says, not unkindly. Your lead does what it has always done, and does it well.')),
  // 3
  drill('crowd-support-training', 'Crowd Support', 'A set of bleachers, packed, for no reason anyone can explain. The fans have made signs. "DEFENCE! DEFENCE!" Cost: a node. Gain: +1 Defense effort for your lead.',
    ['Hold the line.', 'Your lead braces while the crowd roars it through every hit. By the end it is not flinching, and half the bleachers are in tears. Somebody has made a sign with its name on.', [mk('effort', { stat: 'def', amount: 1 })], { node: true }],
    idle('Wave at them.', 'You wave. They go absolutely wild. Your lead waves too, shyly, and the noise doubles.', bond(1))),
  // 4
  drill('endurance-hike', 'Endurance Hike', 'A trailhead and a guide already wearing her pack. Hama checks the sky. "Six hours up and down. Lots of experience, lots of sweat." Cost: the party at −20% HP (half the hike: −10%). Gain: experience for every Pokémon (half the hike: half).',
    ['Hike.', 'Six hours. Nobody talks for the last two. At the top Hama passes round a flask and everyone looks at the view they earned. They come down tired and bigger than they went up.', [hurt(0.2), mk('xp', { factor: 0.5, who: 'party' })]],
    ['Half the hike.', 'Three hours, to the first ridge and back. Hama does not judge. "Half a mountain is still a mountain."', [hurt(0.1), mk('xp', { factor: 0.25, who: 'party' })]]),
  // 5
  drill('gym-rat', 'Gym Rat', 'A man doing three things at once and breathing easily. Corso, the triathlete, grins. "Bike, swim, run!" Cost: a node. Gain: +1 effort in Speed, Sp. Def and HP for your lead (or just one: Speed).',
    ['All three.', 'Bike, then swim, then run, with Corso shouting cheerful lies about how close the finish is. Your lead collapses over the line and Corso collapses next to it, laughing.', [mk('effort', { stat: 'spe', amount: 1 }), mk('effort', { stat: 'spd', amount: 1 }), mk('effort', { stat: 'hp', amount: 1 })], { node: true }],
    ['Just one.', 'Just the run. Corso runs it with you, backwards, talking the whole way.', [mk('effort', { stat: 'spe', amount: 1 })], { node: true }]),
  // 6
  drill('ice-training', 'Ice Training', 'A frozen pond, swept smooth. Lumi glides past on one skate. "Slide practice! Don\'t fall." Cost: a 1 in 10 chance of a fall (−10% HP for the slider), posted on the bank. Gain: +1 Speed effort; Ice-types +2.',
    ['Slide.', 'Out, turn, back, faster each time. Lumi skates alongside calling the rhythm. By the end your lead is cutting lines in the ice as clean as hers.', [mk('effort', { stat: 'spe', amount: 1, type: 'ice', typeAmount: 2 })], { chance: 0.9, failText: 'A skid, a spin, and a long slide into the snowbank on its back. Lumi is there before it stops. "Everyone falls. Up you get." It gets up. It goes again, more carefully.', failEffects: [hurtLead(0.1), mk('effort', { stat: 'spe', amount: 1, type: 'ice', typeAmount: 2 })] }],
    idle('Watch from the bank.', 'You sit on the bank with a hot drink and watch Lumi write her name on the ice in one long line.')),
  // 7
  drill('meditation-shrine', 'Meditation Shrine', 'A shrine with no walls. Ondra floats a hand\'s width above the boards, eyes closed. "Breathe." Cost: a node. Gain: +1 Sp. Def effort for your lead, and its mind is cleared.',
    ['Meditate.', 'Your lead breathes. In, and out. Something it has been carrying since the last hard fight gets set down, quietly, on the boards. Ondra does not open her eyes. She is smiling.', [mk('effort', { stat: 'spd', amount: 1 }), cure()], { node: true }],
    idle('Fidget.', 'You fidget. Your lead fidgets. Ondra opens one eye. "Also breathing," she says. "Technically."')),
  // 8
  drill('mental-training-dojo', 'Mental Dojo', 'A dojo with a single target at the far end and nothing else. Sensei Kaito kneels. "Aim is a state of mind. Sit." Cost: a node. Gain: your lead aims truer in its next 3 battles.',
    ['Sit.', 'Your lead sits facing the target for an hour and does not fire once. When Sensei Kaito finally nods, it stands, turns away, and hits the centre without looking.', [temp('Mental Dojo: accuracy +10%', [{ kind: 'accuracyMultiplier', value: 1.1 }], 3)], { node: true }],
    idle('Shoot first.', 'Your lead shoots first. It misses. Sensei Kaito says nothing at all, which is somehow worse.')),
  // 9
  drill('mountain-climb', 'Mountain Climb', 'A rock face with a rope already hung. Ludo, the hiker, chalks his hands. "The view\'s worth it." Cost: the party at −10% HP. Gain: +1 Attack effort for your lead, and from the top you can see the road ahead.',
    ['Climb.', 'Hand over hand. At the top Ludo sits you all in a row on the edge. The whole road ahead is laid out below like a map somebody drew for you. Nobody says anything for a while.', [hurt(0.1), mk('effort', { stat: 'atk', amount: 1 }), scout(8)]],
    idle('Turn back halfway.', 'Halfway up, you look down, and that is enough. Ludo ropes you back to the ground. "Halfway\'s higher than most get."')),
  // 10
  drill('nap-pod-corner', 'Nap Pods', 'A row of soft white pods, humming. Snooze, the attendant, speaks through a yawn. "Forty minutes can save a day." Cost: a node. Gain: the party heals 25%.',
    ['Nap.', 'Forty minutes. Somebody snores. Somebody kicks in their sleep, chasing something. Everyone wakes up softer round the edges and readier than they were.', [mk('mend', { factor: 0.25, who: 'party' })], { node: true }],
    ['Lead naps alone.', 'Your lead naps. You sit beside the pod and keep watch, which it does not need, and which it will remember.', [mk('mend', { factor: 0.25, who: 'lead' }), bond(1)], { node: true }]),
  // 11
  drill('obstacle-course', 'Obstacle Course', 'Tyres, a net, a wall, a rope swing. Prix, the marshal, holds a stopwatch like a holy thing. "Record time wins a prize." Cost: a stumble costs the runner 5% HP. Gain: beat the record and win a Quick Claw.',
    ['Run it.', 'Over, under, through, and across the line with Prix screaming the seconds. He stares at the watch. He shows it to you. He shows it to a stranger. A record.', [item('quick-claw')], { prompt: { id: 'hurdle-rhythm', needs: 'good' }, failText: 'A caught foot on the tyres, a tumble, a finish two seconds over. Prix pats your runner\'s head. "Good line. Bad tyre. Come back."', failEffects: [hurtLead(0.05)] }],
    idle('Walk it.', 'You walk the course together, touching each obstacle as you pass, in no hurry at all. Prix stops the watch out of respect.')),
  // 12
  drill('obstacle-dojo', 'Obstacle Dojo', 'A dojo floor strung with bells on threads. Master Gisele stands in the middle of them, perfectly still. "Pass the course without a scratch." Cost: a failed pass costs your lead 10% HP. Gain: your lead is harder to hit in its next battle.',
    ['Attempt.', 'Your lead goes through the bells like water through reeds. Not one rings. Master Gisele bows, low, the way she bows to an equal.', [temp('Obstacle Dojo: harder to hit', [{ kind: 'evasionMultiplier', value: 1.1 }], 1)], { prompt: { id: 'tilt-drag', needs: 'good' }, failText: 'One bell. Then all of them. Your lead ends up tangled and stinging, and Master Gisele untangles it herself, thread by thread, without a word of blame.', failEffects: [hurtLead(0.1)] }],
    idle('Watch.', 'Master Gisele walks the course for you, eyes closed. The bells do not so much as tremble.')),
  // 13
  drill('rain-run', 'Rain Run', 'It is pouring. A coach in a yellow raincoat is delighted about it. Hoyt bellows over the weather. "Nobody trains in dry weather!" Cost: the party is soaked: slower in its next battle. Gain: +1 Speed effort for everyone; Water-types +2.',
    ['Run.', 'You run. Everyone runs. The Water-types have the time of their lives and the rest endure it with dignity. Hoyt runs at the back so nobody is last.', [temp('Soaked: Speed −10%', [{ kind: 'statMultiplier', stat: 'spe', value: 0.9 }], 1), mk('effort', { stat: 'spe', amount: 1, type: 'water', typeAmount: 2, who: 'party' })]],
    idle('Shelter.', 'You shelter under Hoyt\'s spare tarpaulin and watch him run laps alone, perfectly happy.')),
  // 14
  drill('sandpit-digging', 'Sandpit Dig', 'A sandpit the size of a house. Grubb leans on a shovel. "Buried a few Ground TMs. Find \'em, keep \'em." Cost: a node. Gain: a Ground TM if you find one (a Ground-type digs twice as well).',
    ['Dig.', 'Sand everywhere. In ears. In bags. And then a corner of something flat and hard, and Grubb whooping from the edge. "That\'s one! Told you they were down there!"', [item('tm-ground')], { node: true, chance: 0.5, failText: 'Sand everywhere, and nothing under it but more sand. Grubb scratches his head. "Could\'ve sworn. Maybe I buried them over there."' }],
    ['Let a Ground-type dig.', 'Your Ground-type goes into the sand like a diver into water. It surfaces twice, with a disc each time in its teeth, and drops the better one at your feet.', [item('tm-ground')], { node: true, requires: [ptype('ground')], chance: 0.75, failText: 'Your Ground-type digs two long tunnels and comes up empty both times, sneezing sand. Grubb gives it a biscuit anyway.' }]),
  // 15
  drill('shadow-boxing', 'Shadow Boxing', 'A dojo with one lamp, set low, so that every shadow is twice its owner\'s size. Sensei Mirro gestures at the wall. "Beat yourself." Cost: a battle against your lead\'s own copy. Gain: win, and your lead\'s best stat gains +1 effort.',
    ['Fight the shadow.', 'The shadow steps off the wall. It knows every move your lead knows, and it is not afraid.', [], { battle: trainer('Your Shadow', { friendly: true, mirror: true, size: 1, win: [mk('effort', { stat: 'highest', amount: 1 })] }) }],
    idle('Bow to it.', 'Your lead bows to its own shadow. The shadow bows back. Sensei Mirro lets out a breath. "Most never think to."', bond(1))),
  // 16
  drill('sparring-partner', 'Sparring', 'A ring marked in rope. Black Belt Kenji tightens his belt, and his Hitmonchan shadow-boxes the air beside him. "My Hitmonchan wants a go." Cost: a battle. Gain: experience.',
    ['Spar.', 'Kenji bows. His Hitmonchan bows. Then nobody is polite for a while.', [flag('roster-kenji-sparred')], { battle: trainer('Black Belt Kenji', { friendly: true, cls: 'black-belt', team: ['hitmonchan'], size: 1, types: ['fighting'], win: [mk('xp', { factor: 0.5, who: 'party' })] }) }],
    idle('Decline.', 'Kenji nods. "Another day. He\'ll still want a go." The Hitmonchan looks crushed, and then punches the air some more.')),
  // 17
  drill('speed-lane-treadmill', 'Speed Lane', 'A long belt of rubber, rolling. The attendant holds a clock the size of a dinner plate. "Beat the clock and keep your pace." Cost: a node. Gain: +1 Speed effort for your lead.',
    ['Run.', 'The belt speeds up. Your lead speeds up. The clock gives in first. The attendant writes the time on the wall, under a list of other names, and adds a star.', [mk('effort', { stat: 'spe', amount: 1 })], { node: true }],
    idle('Walk.', 'Your lead walks the belt at a stroll, going nowhere, enjoying it.')),
  // 18
  drill('sprint-intervals', 'Sprint Intervals', 'Cones in a line. Stopwatch Sue clicks her watch twice for luck. "Fast now, pay later." Cost: your lead\'s guard is down in its next battle. Gain: +2 Speed effort.',
    ['Sprint.', 'Flat out, rest, flat out, rest, until your lead\'s legs are jelly and Sue is hoarse. "That\'s speed in the bank. Tomorrow you\'ll hate me. Day after, you\'ll thank me."', [temp('Spent legs: Defense −10%', [{ kind: 'statMultiplier', stat: 'def', value: 0.9 }], 1), mk('effort', { stat: 'spe', amount: 2 })]],
    idle('Jog.', 'A gentle jog round the cones. Sue jogs with you and tells you about her knees.')),
  // 19
  drill('stretching-break', 'Stretch Break', 'A mat in the shade. Bendy, the instructor, is folded in a way that should not be possible. "Reach for the sky!" No cost. Gain: one status cured, and +1 Bond for your lead.',
    ['Stretch.', 'You stretch together, you and your lead, both of you terrible at it. Something that ached stops aching. Bendy applauds with her feet.', [cure(), bond(1)]],
    idle('Skip.', '"Next time!" Bendy says, upside down.')),
  // 20
  drill('swim-class', 'Swim Class', 'A roped-off bay, and a lifeguard on a tall white chair. Finn blows a kind sort of whistle. "Water-types train best. Everybody else floats." Cost: a node. Gain: Water-types +2 Sp. Atk effort; everyone else +1 Bond.',
    ['Swim.', 'The Water-types cut laps like knives. Everybody else bobs about in rubber rings, being towed, shrieking. Finn watches every single head, the whole time.', [mk('effort', { stat: 'spa', amount: 2, type: 'water', who: 'party' }), bond(1, 'party')], { node: true }],
    idle('Float.', 'You all float on your backs and watch the clouds. Finn says nothing. He counts heads, and smiles.', bond(1, 'party'))),
  // 21
  drill('team-photo-day', 'Team Photo', 'A camera on three legs and a photographer under a black cloth. Flick\'s voice comes out muffled. "Everybody squeeze in! Say Poké Ball!" Cost: ₽100. Gain: the photo, and +1 Bond for everyone.',
    ['Pose.', 'Everybody squeezes in. Somebody blinks. Somebody is looking at you instead of the camera. Flick says it is the best one he has taken all year, and he means it.', [pay(100), bond(1, 'party'), moment('A team photo, taken at the Training Ground, to hang in the hub.', 60)], { requires: need(100).requires }],
    ['Make a funny face.', 'You make a face. They all make faces. The photo is a disaster and the most treasured thing you own.', [pay(100), bond(1, 'party'), moment('A team photo with everyone pulling faces.', 60)], { requires: need(100).requires }]),
  // 22
  drill('trainers-pep-talk', 'Pep Talk', 'A coach in a tracksuit, arms already out for a huddle. Juniper beams. "Hands in, everybody!" No cost. Gain: your lead\'s first move next battle hits a tenth harder.',
    ['Hands in.', 'Hands in. Paws in. A wing. A tail. Juniper counts to three and the shout goes up loud enough to scare birds out of the trees. Everyone is grinning.', [temp('Pep talk: first move +10%', [{ kind: 'firstAttackDamage', first: 1.1, later: 1 }], 1)]],
    idle('Too cheesy.', '"It is cheesy!" Juniper agrees, delighted. "That\'s why it works!"')),
  // 23
  drill('training-session-2', 'Punching Bag', 'A heavy bag on a chain, scarred by generations. The Sergeant stands beside it and blows one blast. Cost: a node. Gain: +1 Attack effort for your lead.',
    ['Punch.', 'Your lead hits the bag until the chain sings. The Sergeant holds it steady from behind, taking every blow through the leather, and nods once. From the Sergeant, that is a medal.', [mk('effort', { stat: 'atk', amount: 1 })], { node: true }],
    ['Kick.', 'Your lead kicks the bag clean off its hook. The Sergeant catches it one-armed. The baby cheers.', [mk('effort', { stat: 'atk', amount: 1 })], { node: true }]),
  // 24
  drill('waterfall-training', 'Waterfall', 'A waterfall, white and deafening. A monk sits under it as if it were a light rain. Brother Sel does not raise his voice. "Stand. Don\'t fall." Cost: your lead at −20% HP. Gain: it learns Waterfall if it can; if not, +1 Defense effort.',
    ['Stand under it.', 'The water hits like a wall. Your lead goes to one knee, and gets up, and stays up. When it walks out, Brother Sel bows from the waist. "The river could not move you. Remember that."', [hurtLead(0.2), mk('teachOr', { move: 'waterfall', stat: 'def', amount: 1 })]],
    idle('Sit beside it.', 'You sit beside the falls in the cold mist. Brother Sel sits with you. Nobody needs to prove anything.')),
  // 25
  drill('weak-spot-remedy', 'Weak-Spot Therapy', 'A quiet tent with a treatment table. Dr. Kade warms her hands. "Which one hurts most?" Cost: ₽200. Gain: +1 effort to your lead\'s lowest stat, or a status cured.',
    ['Treat the weakest stat.', 'Dr. Kade finds the weak place without being told and works on it, patiently, until it is only a place. "Everyone has one. It isn\'t a flaw. It\'s just where you start from."', [pay(200), mk('effort', { stat: 'lowest', amount: 1 })], { requires: need(200).requires }],
    ['Treat a sore Pokémon.', 'Dr. Kade treats what ails them, gently, talking the whole time about nothing in particular so that nobody is frightened.', [pay(200), cure()], { requires: need(200).requires }]),
  // 26
  drill('weight-room-roulette', 'Weight Room Roulette', 'A rack of weights and a wheel on the wall. Spinner, the owner, gives it a flick. "Pick your weight and spin." A card on the wall: HEAVY, 1 IN 3: THE LEAD STARTS ITS NEXT BATTLE AT −20%. Gain: Light, +1 Attack effort; Heavy, +2.',
    ['Light.', 'Light weights, many times. Spinner counts every one out loud and gets to a number he has to check twice.', [mk('effort', { stat: 'atk', amount: 1 })]],
    ['Heavy.', 'The bar bends. Your lead does not. Spinner whistles through his teeth. "Clean. Clean as anything."', [mk('effort', { stat: 'atk', amount: 2 })], { chance: 2 / 3, failText: 'The bar goes up. It also comes down, harder than planned. Your lead got the lift, and a pulled shoulder with it. Spinner fetches ice. "One in three. It\'s on the card. Sorry, friend."', failEffects: [mk('effort', { stat: 'atk', amount: 2 }), hurtLead(0.2)] }]),
  // 27
  drill('yoga-retreat', 'Yoga Retreat', 'A deck over still water, a row of mats. Om-Pol sits with his palms up. "Breathe in. Breathe out." Cost: a node (one pose costs nothing). Gain: the party heals 25% and +1 Bond; or +1 Bond for your lead.',
    ['Stay the day.', 'A whole day of breathing in and breathing out. By sunset the party is draped across the deck in a heap, half asleep, all touching. Om-Pol covers them with a blanket.', [mk('mend', { factor: 0.25, who: 'party' }), bond(1, 'party')], { node: true }],
    ['One pose.', 'One pose, held together, wobbling. Your lead falls over. You fall over. Om-Pol says that is the pose.', [bond(1)]]),
];

export const REMOVE: string[] = [];
