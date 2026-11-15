// Greenneedle, part 5: gn.21 The Pokémon That Wouldn't Evolve (doc GREENNEEDLE_REWORKED_PLACED_5.md).
// Build: npm run co:build -- greenneedle-5   then   npm run co:gn
import { any, ch, fight, flag, heal, item, join, lose, out, RARE_HELD, room, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, inside, is, leavePseudo, moment, not, notThisRegion, regionChanged, rm, say, scene, setTo, stampRegion, stampStage, teach, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.21  THE POKÉMON THAT WOULDN'T EVOLVE  (Region-wide: three must-see beats at S2, S5, S8; once a run).
// The Pokémon is cast once (gn op `cast`): a Pikachu, a Piplup, a Torchic, an Eevee, a Growlithe, or an unevolved Pokémon of
// this region. Fights and joins name it `@wontevolve`. Its move Proof and its ability Unwavering live in canonMoves.json / abilities.json.
// =====================================================================================================================
const STONE_TINT = '#8a8f6a';
const won = (o: Json = {}): Json => ({ tint: STONE_TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', cast: ['trainer.youngster_m'], ...o });
const wroom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, won(o), intro, choices);
const ME = '@wontevolve';
const CAST = gn('cast', { key: 'wontevolve', species: ['pikachu', 'piplup', 'torchic', 'eevee', 'growlithe'], n: 1 });
const SOLO: Json = { kind: 'canon', action: 'solo', species: [] };
const UNSOLO: Json = { kind: 'canon', action: 'unsolo', species: [] };
const SIDE = 'wontevolve-side';
const FOUGHT = 'wontevolve-fought';
const END = 'wontevolve-end';
/** A one-on-one with the player's strongest Pokémon. It can't be caught, and nobody is out if it wins. */
const duel = (stages: Json, win: Json[], lose: Json[]): Json => ({ ...wild({ species: [ME], lv: 0, win: [...win, UNSOLO] }), friendly: true, rule: { noCatch: true, foeStages: stages }, lose: [UNSOLO, ...lose] });
const ending = (n: number, ...effects: Json[]): Json[] => [setTo(END, n), flag('wontevolve-done'), flag('wontevolve-3'), stampStage('wontevolve-end-at'), ...effects];
const JOINS: Json = { ...join({ species: [ME] }), ability: 'unwavering', moves: ['proof'] };

const gn21: Json[] = [
  // ---- Beat 1. The disagreement (S2, step 6) ----
  gev('gn-21-road', "The Pokémon That Wouldn't Evolve", won({
    stop: 'event', rarity: 'rare', requires: [not('wontevolve-1')],
    remembers: [{ id: 'littlecup', when: [is('littlecup-cancelled')], notice: '*Your own small one, the one that cancelled its evolution, steps up beside it. It folds its arms the same way.*' }],
  }), say(
    'A trainer is kneeling in the road, holding out a stone in both hands, the way you would offer something to a shrine.',
    'Their Pokémon has its back turned. Its arms are folded.',
    '**Linus:** "It\'s a *good* stone. I saved for it. You\'d be twice as strong. You\'d be safe."',
    '*It doesn\'t turn round. Its ears are flat against its head.*',
    '**Linus, to you:** "Tell it. Please. It won\'t hear it from me."',
  ), [
    ch("Your trainer's right. Take it.", out(
      'It turns, slowly, and looks at you as if it had expected better of you. It still doesn\'t take the stone.',
      CAST, setTo(SIDE, 1), flag('wontevolve-1'), stampRegion('wontevolve-at'),
    )),
    ch("It doesn't want to. Leave it be.", out(
      'Its ears come up. For a moment it just looks at you. Then it points, very deliberately, at your strongest Pokémon.',
      CAST, setTo(SIDE, 2), flag('wontevolve-1'), stampRegion('wontevolve-at'), scene('gn-21-challenge'),
    )),
    ch('…', out(
      'Linus sighs, and puts the stone back in a pocket. The Pokémon glances back at you, once, as they go.',
      CAST, setTo(SIDE, 3), flag('wontevolve-1'), stampRegion('wontevolve-at'),
    )),
  ]),
  wroom('gn-21-challenge', "The Pokémon That Wouldn't Evolve: The Challenge", {}, say(
    'It wants your strongest Pokémon. One on one. Nobody else.',
    'It isn\'t angry. It wants to prove a point, and this is the only language it has for it.',
  ), [
    ch('Accept.', fight('It fights like something with a great deal to prove. It\'s faster than it should be.', { ...duel({ spe: 1 },
      [gn('hpCap', { n: 30 }), flag(FOUGHT), scene('gn-21-bow')],
      [flag(FOUGHT), scene('gn-21-bow-lost')]) }, SOLO)),
  ]),
  wroom('gn-21-bow', "The Pokémon That Wouldn't Evolve: The Bow", {}, say(
    'It loses. Narrowly. Your Pokémon is breathing hard, down to its last third.',
    '*It gets up. It isn\'t ashamed. It bows, stiffly, and walks back to Linus.*',
    '**Linus:** "...See? See, that\'s what I mean. It nearly—"',
    'Linus doesn\'t finish.',
  ), [ch('Walk on.', out('Behind you, neither of them says anything. You can feel them not saying it.'))]),
  wroom('gn-21-bow-lost', "The Pokémon That Wouldn't Evolve: The Bow", {}, say(
    'It wins. It stands over your Pokémon a moment, breathing hard, as if it can\'t quite believe it either.',
    '*Then it bows, stiffly, and walks back to Linus.*',
    '**Linus:** "...It nearly— It could have—" Linus doesn\'t finish.',
  ), [ch('Walk on.', out('Your Pokémon gets back up. It keeps looking back at the small one, with something like respect.'))]),

  // ---- Beat 2. It comes back (S5, step 11) ----
  gev('gn-21-back', 'It Comes Back', won({
    stop: 'event', rarity: 'rare', cast: [], requires: [is('wontevolve-1'), not('wontevolve-2'), { kind: 'gn', test: 'thisRegion', key: 'wontevolve-at' }],
    remembers: [{ id: 'eevee', when: [is('eevee-stayed')], notice: '*Your Eevee, the one that never chose, sits down next to it in the road. They look like old friends.*' }],
  }), say(
    'Something small drops out of a tree onto the road in front of you.',
    '*It\'s alone. It\'s got a new scar, and a new way of standing.*',
    '*It shows you a move. Its kind shouldn\'t be able to make a move look like that.*',
    'It calls it, in its way, **Proof**: its own type, and harder still against anything fully grown.',
  ), [
    ch("That's incredible.", out('It puffs up to twice its size. Your lead steps forward. They\'ve been watching each other all along.', bond(1), flag('wontevolve-2'))),
    ch("Does Linus know you're out here?", out(say(
      'It looks away.',
      'Linus arrives a moment later, out of breath, still holding the stone. Neither of them says anything.',
      'They leave together. Linus\'s hand hovers near its head, and doesn\'t quite touch it.',
    ), flag('wontevolve-asked'), flag('wontevolve-2'))),
    ch('Show me again, on me.', out('It looks at your strongest Pokémon, and grins.', flag('wontevolve-2'), scene('gn-21-again'))),
  ]),
  wroom('gn-21-again', 'It Comes Back: Again', { cast: [] }, say('A second challenge. Same rules. It has been practising.'), [
    ch('Go.', fight('It moves first. Then it moves again, before you have finished seeing the first one.', { ...duel({ atk: 2, spe: 2 },
      [flag(FOUGHT), scene('gn-21-again-held')],
      [flag(FOUGHT), scene('gn-21-again-won')]) }, SOLO)),
  ]),
  wroom('gn-21-again-won', 'It Comes Back: Again', { cast: [] }, say(
    'This time it wins. Narrowly.',
    'It stands there, staring at its own paws, as surprised as anyone. Then it laughs, a small, astonished sound.',
  ), [ch('Clap.', out('It bows to you, properly this time, and runs off up the road to find Linus.'))]),
  wroom('gn-21-again-held', 'It Comes Back: Again', { cast: [] }, say(
    'You hold on. Only just. Your Pokémon is the one staring at its paws now.',
    'It isn\'t upset. It looks at you as if to say: *next time.*',
  ), [ch('Clap.', out('It bows to you, properly this time, and runs off up the road to find Linus.'))]),

  // ---- Beat 3. The stone (S8, step 17) ----
  gev('gn-21-stone', 'The Stone', won({ stop: 'event', rarity: 'rare', requires: [is('wontevolve-2'), not('wontevolve-3'), { kind: 'gn', test: 'thisRegion', key: 'wontevolve-at' }] }), say(
    'Linus has it cornered against a wall. The stone is out again. Linus is crying.',
    '**Linus:** "I can\'t do this again. I can\'t watch one go down because it was *small*. I\'m sorry. I\'m sorry. Hold still."',
    '*It isn\'t running. It\'s looking at Linus, very steadily.*',
  ), [
    ch('Step in.', out('You step between them. Both of them look at you.',
      when(SIDE, { min: 1, max: 1 }, [scene('gn-21-crisis')]),
      when(SIDE, { min: 2 }, [scene('gn-21-step')]))),
    ch('Let them work it out.', out('You stay where you are. This is theirs.',
      when(SIDE, { min: 1, max: 1 }, [scene('gn-21-crisis')]),
      when(SIDE, { min: 2 }, [scene('gn-21-wait')]))),
    ch('Linus. Who was the other one?', out(say(
      '**Linus:** "A Pichu. Years ago. It wouldn\'t evolve either. I let it choose."',
      '"And then there was a Fearow."',
      '*The Pokémon walks forward, and puts its paw on Linus\'s knee.*',
      'Linus puts the stone away. **Linus:** "All right. All right. Your way."',
      'One of your own small ones watched every move of Proof today. It has it now.',
    ), ...ending(2, teach('proof', { unevolved: true }), moment('Linus finally said who the other one was, and put the stone away.', 80)))),
  ]),
  wroom('gn-21-step', 'The Stone: Between Them', {}, say(
    'It steps out from behind you. It isn\'t hiding. It\'s choosing where to stand.',
    'Linus\'s hands are shaking around the stone.',
  ), [
    chIf([is(FOUGHT, 2)], 'Stand beside it.', out(say(
      'It walks to you. It looks back at Linus.',
      'Linus looks at it for a long time. Then Linus nods.',
      '**Linus:** "Go on, then. Go and be small and brilliant somewhere I don\'t have to watch."',
    ), JOINS, ...ending(1, moment('It stayed exactly what it was, and walked with you.', 90)))),
    chIf([is(SIDE, 2, 2)], 'Battle Linus.', fight('**Linus:** "Fine. FINE. If that\'s what it takes to keep it safe from people like you."', trainer('Linus Castellane', {
      size: 3, lv: 0, friendly: true,
      win: [scene('gn-21-walks')],
      lose: [scene('gn-21-wait')],
    }))),
    ch('Step back.', out('You step aside. It looks at you, then at Linus, and sits down in the road to wait.', scene('gn-21-wait'))),
  ]),
  wroom('gn-21-walks', 'The Stone: It Walks', {}, say(
    'Linus\'s last Pokémon goes down. Linus sits down hard on the road.',
    'It walks away from Linus without looking back. Not once.',
    'It stops beside you, and waits, as if it has always been yours.',
  ), [ch('Take it with you.', out('Linus doesn\'t call after it. You don\'t think Linus can.', JOINS, ...ending(5, flag('wontevolve-linus-gone'), moment('It left its trainer for you, and never looked back.', 85))))]),
  wroom('gn-21-wait', 'The Stone: Its Own Time', {}, say(
    'Nobody does anything for a long time.',
    'Then Linus puts the stone in its paw, and closes its paw around it, and lets go.',
    '**Linus:** "When you want to. If you want to. Not before."',
  ), [ch('Leave them to it.', out('You leave them sitting together against the wall, the stone between them.', ...ending(3)))]),
  wroom('gn-21-crisis', 'The Stone: The Crisis', {}, say(
    'Something bursts out of the hedge, wild and frightened, straight at Linus.',
    'Linus throws up both arms. The stone goes flying.',
  ), [
    ch('Get between them.', fight('You get between Linus and the wild Pokémon.', { ...eitherWay(wild({ lv: 0, win: [scene('gn-21-crisis-2')] })), friendly: true, lose: [scene('gn-21-crisis-2')] })),
  ]),
  wroom('gn-21-crisis-2', 'The Stone: The Crisis', {}, say(
    'Before it\'s over, a light goes up beside you.',
    'It has the stone. It took it out of the air itself.',
    'It\'s bigger now, standing between Linus and the world. It is not sorry. It doesn\'t look back at you.',
    '**Linus:** "Thank you. Thank you. I— thank you."',
  ), [ch('You\'re welcome.', out('Linus presses something into your hands and won\'t hear a word about it.', any(...RARE_HELD), ...ending(4, moment('In the end it evolved, to save Linus. It wasn\'t sorry.', 75))))]),

  // ---- Endings that come later ----
  gev('gn-21-letter', 'A Letter from Linus', won({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, cast: [], requires: [is(END, 3, 3), { kind: 'gn', test: 'laterStage', key: 'wontevolve-end-at' }, not('wontevolve-letter')] }), say(
    'A letter catches up with you. Inside is a drawing, done in crayon by someone who is not good at drawing.',
    'It\'s bigger in the picture. It\'s grinning.',
    '**Linus:** "It said to give you the spare."',
  ), [ch('Keep the drawing.', out('Folded into the letter is a stone of the same kind.', gn('castItem', { key: 'wontevolve' }), flag('wontevolve-letter')))]),
  gev('gn-21-after', 'Linus, Again', won({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('wontevolve-done'), is(END, 1, 4), regionChanged('wontevolve-at'), not('wontevolve-after')] }), say(
    'A face you know, on a road a long way from the last one. Linus.',
    'The stone hangs on a string round Linus\'s neck. Unused.',
    '**Linus:** "Keeps me honest," Linus says, and taps it.',
  ), [ch('Say hello.', out('You talk for a while about small things that turned out to be strong.', flag('wontevolve-after')))]),
];

// =====================================================================================================================
// gn.22  THE LONELY CUBONE  (a cold open, then a Pseudo Stage of five nodes; needs forest or eerie; step 9, optional, instead of
// the battle; once a run). The Cubone walks with you as a guest (mark `cubone-guest`, a seventh who fights when sent, A-1); if it
// faints, the stage ends. The birds fight in doubles, aiming at it (rule `aimMark`).
// =====================================================================================================================
const BONE_TINT = '#6f6a5a';
const bone = (o: Json = {}): Json => ({ tint: BONE_TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', pokemon: 'cubone', ...o });
const broom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, bone(o), intro, choices);
const GUEST = 'cubone-guest';
const SETTLED = 'cubone-settled';
const guestDown: Json = { kind: 'gn', test: 'markDown', key: GUEST };
/** After a fight: if the Cubone went down, it runs; otherwise on to `next` (a scene on this node, or the next node). */
const onward = (next: Json): Json[] => [gn('check', { key: 'cubone-down', if: [guestDown] }), when('cubone-down', { min: 1 }, [scene('gn-22-ran')]), when('cubone-down', { min: 0, max: 0 }, [next])];
const RAN: Json[] = [gn('dropMarked', { key: GUEST }), flag('cubone-fainted'), stampRegion('cubone-ran-at')];
const ENTER: Json[] = [flag('cubone-trusted'), stampRegion('cubone-at'), setTo(SETTLED, 0), setTo('cubone-fainted', 0), room('gn-22-tree')];
const LEAVE_IT = (text: string): Json => ch('Leave something at its feet.', out(text, ...ENTER));
const LEFT_BERRY = say(
  'You put a Berry down in front of it, and step back. Then another step.',
  '*It looks.* It looks at the Berry, and at you, for a long time.',
  'It picks it up.',
);
/** Rests: it draws, and you answer. */
const REST = (next: Json): Json[] => [
  ch('Draw something back.', out(say(
    'You draw yourself, badly, and your lead, worse.',
    'It studies your drawing. Then it adds a small skull-headed figure next to you. Then it rubs it out, embarrassed.',
  ), flag(SETTLED), next)),
  ch('Just watch.', out('You watch it draw. It glances up now and then to check you\'re still there. You are.', next)),
  ch('Sit closer.', out('You shift closer. It goes very still, then carries on drawing, a little nearer to your knee.', flag('cubone-close'), next)),
];
const BIRDS = (species: string[], lv: number, win: Json[], o: Json = {}): Json => inside({ ...wild({ species, lv, win, ...o }), exact: true, rule: { leadMark: GUEST, aimMark: GUEST, noCatch: true }, lose: RAN });
const joinCubone = (extra: Json = {}): Json[] => [
  when('cubone-sat', { min: 1 }, [{ ...join({ species: ['cubone'], lv: -1 }), ability: 'inherited-strength', friendship: 30, mark: 'cubone-friend', ...extra }]),
  when('cubone-sat', { min: 0, max: 0 }, [{ ...join({ species: ['cubone'], lv: -1 }), ability: 'inherited-strength', mark: 'cubone-friend', ...extra }]),
  flag('cubone-joined'),
];
const DONE22: Json[] = [gn('dropMarked', { key: GUEST }), flag('cubone-done'), leavePseudo()];

const gn22: Json[] = [
  gev('gn-22-door', 'The Lonely Cubone', bone({ stop: 'event', rarity: 'rare', types: ['ground', 'ghost'], requires: [not('cubone-done'), not('cubone-gone'), not('cubone-walked')] }), say(
    'A Cubone, alone in the woods.',
    'It\'s sitting with its back to a tree, holding its club across its knees.',
    'It\'s been crying. The skull is wet.',
  ), [
    ch('Approach it.', out('It\'s gone before you\'re halfway there. It\'s behind the next tree now, watching you round the bark.', scene('gn-22-behind'))),
    LEAVE_IT(LEFT_BERRY),
    ch('Walk away.', out('It watches you go. You can feel it watching all the way to the bend.', flag('cubone-walked'), stampStage('cubone-walked-at'))),
  ]),
  broom('gn-22-behind', 'The Lonely Cubone', {}, say('It\'s behind the next tree. One eye, round the bark. It hasn\'t run far.'), [
    ch('Approach it.', out('It runs again, and this time it doesn\'t stop. You hear it crashing through the undergrowth, a long way.', flag('cubone-gone'))),
    LEAVE_IT(LEFT_BERRY),
    ch('Walk away.', out('It watches you go.', flag('cubone-walked'), stampStage('cubone-walked-at'))),
  ]),
  gev('gn-22-again', 'The Lonely Cubone', bone({ stop: 'event', rarity: 'rare', callback: true, minStage: 2, requires: [is('cubone-walked'), { kind: 'gn', test: 'laterStage', key: 'cubone-walked-at' }, not('cubone-trusted'), not('cubone-gone'), not('cubone-again')] }), say(
    'It\'s there again. A different tree, the same Cubone, the same club across its knees.',
    'It looks up when it hears you. It doesn\'t run. Not yet.',
  ), [
    ch('Approach it.', out('It runs. This time you know it won\'t be back.', flag('cubone-again'), flag('cubone-gone'))),
    ch('Leave something at its feet.', out(LEFT_BERRY, flag('cubone-again'), ...ENTER)),
    ch('Walk away.', out('It watches you go. And then, the next time you look back, it isn\'t there.', flag('cubone-again'), flag('cubone-gone'))),
  ]),

  // ---- Node 1. The Tree ----
  broom('gn-22-tree', 'The Lonely Cubone: The Tree', {}, say(
    '*It draws in the dirt with the end of its club.*',
    '*A large shape, with a skull like its own. A mound. Then a mark like a question.*',
    '*It looks up at you.*',
    'It\'s looking for its mother\'s grave.',
  ), [ch('Help it look.', out('It gets up, wipes the skull with the back of its paw, and falls in beside you. Not close. But beside.',
    { ...join({ species: ['cubone'], lv: -1 }), direct: true }, gn('markLast', { key: GUEST, species: ['cubone'] }), room('gn-22-stream')))]),
  // ---- Node 2. The Stream ----
  broom('gn-22-stream', 'The Lonely Cubone: The Stream', {}, say(
    'A stream, loud with spring water. Something wild is drinking.',
    'The Cubone stays at the back, club up, eyes huge.',
  ), [ch('Wade in.', fight('Something wild turns on you.', inside(eitherWay(wild({ lv: -1, win: onward(scene('gn-22-stream-2')) })))))]),
  broom('gn-22-stream-2', 'The Lonely Cubone: The Stream', {}, say('Another one, further up. This time the Cubone doesn\'t hang back quite so far.'), [
    ch('Go on.', fight('It swings. It *hits* something. Afterwards it stares at its own club, as if the club did it alone.', inside(eitherWay(wild({ lv: -1, win: onward(scene('gn-22-stream-rest')) }))))),
  ]),
  broom('gn-22-stream-rest', 'The Lonely Cubone: The Stream', {}, say(
    'You rest on the bank. It draws.',
    '*The same large shape. And a small one beside it. Stick figures, holding hands.*',
  ), REST(room('gn-22-hollow'))),
  // ---- Node 3. The Hollow ----
  broom('gn-22-hollow', 'The Lonely Cubone: The Hollow', {
    remembers: [{ id: 'dog', when: [is('dog-sat')], notice: '*In the corner of its drawing, a second small figure, sitting. Waiting for someone. It doesn\'t explain.*' }],
  }, say(
    'A fallen tree, hollow and dry inside. Rain starts the moment you\'re under it.',
    'It draws by the light coming through the bark.',
    '*The large one, holding something out. A club.*',
    'It taps the club it\'s carrying. Twice. Gently.',
  ), REST(room('gn-22-stones')).map((c) => { const won = c.success as { effects: Json[] }; return { ...c, success: { ...won, effects: [heal(1), ...won.effects] } }; })),
  // ---- Node 4. The Field of Stones ----
  broom('gn-22-stones', 'The Lonely Cubone: The Field of Stones', { pokemon: 'cubone' }, say(
    'A clearing full of mounds. Any of them could be a grave.',
    'Ghost-types drift between them. They don\'t attack. They watch the Cubone.',
  ), [
    ch('Walk among them.', fight('A ghost drifts into your path and stays there, looking. It won\'t raise a hand to you.', inside(eitherWay({ ...wild({ types: ['ghost'], lv: -1, win: onward(scene('gn-22-stones-rest')) }), rule: { foeStands: 3 } })))),
    ch('Go round.', out('You keep to the edge. The ghosts turn to watch you pass, all of them, at once.', scene('gn-22-stones-rest'))),
  ]),
  broom('gn-22-stones-rest', 'The Lonely Cubone: The Field of Stones', {}, say(
    'It draws on a flat stone, with a chip of chalk.',
    '*The large one, lying down. Lines over it: rain, or something worse. Birds.*',
    'It stops drawing. It rubs out the birds, hard, until the stone is clean.',
  ), REST(room('gn-22-hill'))),
  // ---- Node 5. The Hill: the birds ----
  broom('gn-22-hill', 'The Lonely Cubone: The Hill', { pokemon: 'mandibuzz' }, say(
    '*A shadow crosses the hill. Then three.*',
    '*The Cubone\'s club comes up. It\'s shaking. It doesn\'t run.*',
    'Keep it standing. They\'re coming for it.',
  ), [ch('Stand with it.', fight('Two Vullaby drop out of the sky. They go for the skull.', BIRDS(['vullaby', 'vullaby'], -1, onward(scene('gn-22-wave2')), { format: 'doubles' })))]),
  broom('gn-22-wave2', 'The Lonely Cubone: The Hill', { pokemon: 'mandibuzz' }, say(
    'A Mandibuzz, and another Vullaby.',
    'The Mandibuzz is wearing bones. The Cubone sees them. It makes a sound you have never heard a Pokémon make.',
  ), [ch('Hold the line.', fight('They dive.', BIRDS(['mandibuzz', 'vullaby'], -1, onward(scene('gn-22-wave3')), { format: 'doubles' })))]),
  broom('gn-22-wave3', 'The Lonely Cubone: The Hill', { pokemon: 'mandibuzz' }, say(
    'A large Mandibuzz lands on the crest of the hill and folds its wings.',
    '*The Cubone steps in front of your lead.*',
  ), [ch('Let it.', fight('It doesn\'t look back at you. It raises the club.', BIRDS(['mandibuzz'], 1, [
    when(SETTLED, { min: 2 }, [], 'The last hit is the Cubone\'s. It lands it itself, with everything it has.'),
    ...onward(room('gn-22-grave')),
  ])))]),
  broom('gn-22-ran', 'The Lonely Cubone', {}, say(
    'The Cubone goes down. When it gets up again, it doesn\'t look at you.',
    'It runs, crying, the club dragging in the grass behind it.',
  ), [ch('Let it go.', out('You can\'t follow it where it\'s going. Not today.', ...RAN, leavePseudo()))]),
  // ---- The grave ----
  broom('gn-22-grave', 'The Lonely Cubone: The Grave', {}, say(
    '*Behind the hill, one mound, apart from the others. Flat stones have been set round it, by something with hands. Not recently.*',
    '*There\'s no skull. There\'s no club. There\'s no proof.*',
    '*The Cubone looks at you.*',
  ), [
    ch('This is it. This is her.', out(say(
      'It believes you. It lies down on the mound, and its breathing slows.',
      'It is comforted. And you know you guessed.',
    ), flag('cubone-told-yes'), scene('gn-22-join'))),
    ch("I don't know.", out('It nods, slowly. Then it puts one flat stone on the mound anyway, very carefully, with both paws.', flag('cubone-told-unknown'), scene('gn-22-join'))),
    ch('(Sit down beside it, and say nothing.)', out(say(
      'It sits too. After a while, it leans against your arm.',
      'After a longer while, it puts its club down on the mound. Then it picks it up again, and holds it differently.',
    ), flag('cubone-sat'), moment('You sat with the Cubone at the grave, and said nothing, and it was enough.', 90), scene('gn-22-join'))),
  ]),
  broom('gn-22-join', 'The Lonely Cubone', {}, say('The rain has stopped. It stands at the bottom of the hill, looking at you, then down the road.'), [
    ch('Give it the Thick Club.', out(say(
      'First it shows you the club it has been carrying all along. It\'s too big for it. It always was. It was hers.',
      'Then it takes the new one in its other hand. Both, now.',
    ), lose('thick-club'), ...joinCubone({ held: 'thick-club' }), ...DONE22), { requires: [{ kind: 'item', id: 'thick-club' }] }),
    ch('Come with me?', out('It comes. It walks closer than it did this morning.', ...joinCubone(), ...DONE22)),
    ch('Stay here, if you like.', out('It sits down by the mound. When you look back from the road, it raises its club. Goodbye, or come back.', ...DONE22)),
  ]),
  // ---- Fainted: once more, the next region, more wary ----
  gev('gn-22-wary', 'The Lonely Cubone', bone({ stop: 'event', rarity: 'rare', callback: true, minStage: 2, requires: [is('cubone-fainted'), regionChanged('cubone-ran-at'), not('cubone-done'), not('cubone-wary')] }), say(
    'A Cubone, alone, under a tree. Your Cubone. It knows you. It shifts away anyway.',
    'It\'s more careful now.',
  ), [
    ch('Leave something at its feet.', out('You put a Berry down. It looks at it. It doesn\'t take it. Not yet.', scene('gn-22-wary-2'))),
    ch('Walk away.', out('It watches you go.', flag('cubone-wary'), flag('cubone-gone'))),
  ]),
  broom('gn-22-wary-2', 'The Lonely Cubone', {}, say('The Berry is still there. So is the Cubone. So are you.'), [
    ch('Leave another.', out(say('You put a second Berry beside the first.', 'It looks for a long time. Then it picks up both.'), flag('cubone-wary'), ...ENTER)),
    ch('Walk away.', out('It watches you go.', flag('cubone-wary'), flag('cubone-gone'))),
  ]),
  // ---- Afterstory: the graveyard ----
  gev('gn-22-graveyard', 'A Graveyard', bone({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('cubone-joined'), { kind: 'gn', test: 'hasMark', key: 'cubone-friend' }, regionChanged('cubone-at'), notThisRegion('cubone-graveyard-at')] }), say(
    'A graveyard by the road. Your Cubone stops at the gate, and doesn\'t move.',
  ), [
    ch('Wait for it.', out('You wait. It walks among the stones a while, touching some of them. Then it comes back. Waiting cost you nothing.', stampRegion('cubone-graveyard-at'))),
    ch('Walk on.', out('After a moment, it catches you up.', stampRegion('cubone-graveyard-at'))),
  ]),
];

export const EVENTS: Json[] = [...gn21, ...gn22];

export const REMOVE: string[] = [];

const BEAT: Placement = { gn: 'gn.21', shape: 'Region', earliest: 'A3', sits: 'must-see', tags: ['Region-Wide Story', 'Companion Story'], level: 'A+0', often: 'run', badge: 'own', chain: 'gn.21' };
const BEATS = [
  { beat: 'The disagreement', event: 'gn-21-road', stage: 'S2', home: 6, window: [4, 9] as [number, number] },
  { beat: 'It comes back', event: 'gn-21-back', stage: 'S5', home: 11, window: [9, 14] as [number, number] },
  { beat: 'The stone', event: 'gn-21-stone', stage: 'S8', home: 17, window: [15, 19] as [number, number] },
];
export const PLACEMENT: Record<string, Placement> = {
  'gn-21-road': { ...BEAT, beat: 1, attaches: 'after', beats: BEATS, note: 'Badge: a small stone. Once a run (the doc says once per save; no memory across runs).' },
  'gn-21-back': { ...BEAT, beat: 2, attaches: 'after', beats: BEATS },
  'gn-21-stone': { ...BEAT, beat: 3, attaches: 'before', beats: BEATS },
  'gn-22-door': {
    gn: 'gn.22', shape: 'Door', earliest: 'A4', home: 9, window: [7, 12], sits: 'optional', attaches: 'instead', tags: ['Pseudo Stage', 'Miniature Episode', 'Companion Story'], needs: ['forest', 'eerie'],
    level: 'A-1; the Mandibuzz A+1', often: 'run', badge: 'own', dressing: { kanto: 'The Lonely Cubone', elsewhere: 'The Lonely Cubone' },
    note: 'Badge: a bone. A cold open, then five nodes. Once a run (the doc says once per save; no memory across runs).',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_cubone', name: 'The Lonely Cubone', entry: 'gn-22-door', themeId: 'ground-ghost', tint: BONE_TINT, mood: 'grey woods', start: 'opened' },
];
