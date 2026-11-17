// Greenneedle, part 5: gn.21 The Pokémon That Wouldn't Evolve (doc GREENNEEDLE_REWORKED_PLACED_5.md).
// Build: npm run co:build -- greenneedle-5   then   npm run co:gn
import { $, any, bondUp, ch, fight, flag, heal, item, join, lose, money, out, RARE_HELD, room, takeNode, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, inside, is, leavePseudo, moment, not, notThisRegion, regionChanged, rm, roll, say, scene, setTo, stampRegion, stampStage, teach, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.21  THE POKÉMON THAT WOULDN'T EVOLVE  (Region-wide: three must-see beats at S2, S5, S8; once a run).
// The Pokémon is cast once (gn op `cast`): a Pikachu, a Piplup, a Torchic, an Eevee, a Growlithe, or an unevolved Pokémon of
// this region. Fights and joins name it `@wontevolve`. Its move Proof and its ability Unwavering live in canonMoves.json / abilities.json.
// =====================================================================================================================
const STONE_TINT = '#8a8f6a';
// The picture shows the rolled Pokémon (`@wontevolve`, once it is cast) beside Linus.
const ME = '@wontevolve';
const won = (o: Json = {}): Json => ({ tint: STONE_TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', cast: ['trainer.youngster_m'], pokemon: ME, ...o });
const wroom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, won(o), intro, choices);
const CAST = gn('cast', { key: 'wontevolve', species: ['pikachu', 'piplup', 'torchic', 'eevee', 'growlithe'], n: 1 });
const SOLO: Json = { kind: 'canon', action: 'solo', species: [] };
const UNSOLO: Json = { kind: 'canon', action: 'unsolo', species: [] };
const SIDE = 'wontevolve-side';
const FOUGHT = 'wontevolve-fought';
const END = 'wontevolve-end';
/**
 * A one-on-one with the player's strongest Pokémon. It can't be caught, and nobody is out if it wins. The doc scripts both results
 * (beat 1 "It loses. Narrowly.", beat 2 "it wins, narrowly"): `hold` names the side that hangs on at 1 HP through every hit, so that side wins.
 */
const duel = (stages: Json, hold: 'you' | 'foe', win: Json[], lose: Json[]): Json => ({ ...wild({ species: [ME], lv: 0, win: [...win, UNSOLO] }), friendly: true, rule: { noCatch: true, foeStages: stages, holdOn: hold }, lose: [UNSOLO, ...lose] });
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
    ch('Accept.', fight('It fights like something with a great deal to prove. It\'s faster than it should be.', { ...duel({ spe: 1 }, 'you',
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
    ch('Go.', fight('It moves first. Then it moves again, before you have finished seeing the first one.', { ...duel({ atk: 2, spe: 2 }, 'foe',
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
    ), ...ending(2, flag('wontevolve-stayed'), teach('proof', { unevolved: true }), moment('Linus finally said who the other one was, and put the stone away.', 80)))),
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
const BIRDS = (species: string[], lv: number, win: Json[], o: Json = {}, rule: Json = {}): Json => inside({ ...wild({ species, lv, win, ...o }), exact: true, rule: { leadMark: GUEST, aimMark: GUEST, noCatch: true, ...rule }, lose: RAN });
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
    ch('Walk away.', out('It watches you go. You can feel it watching all the way to the bend.', flag('cubone-walked'), flag('kind-walked-past'), stampStage('cubone-walked-at'))),
  ]),
  broom('gn-22-behind', 'The Lonely Cubone', {}, say('It\'s behind the next tree. One eye, round the bark. It hasn\'t run far.'), [
    ch('Approach it.', out('It runs again, and this time it doesn\'t stop. You hear it crashing through the undergrowth, a long way.', flag('cubone-gone'))),
    LEAVE_IT(LEFT_BERRY),
    ch('Walk away.', out('It watches you go.', flag('cubone-walked'), flag('kind-walked-past'), stampStage('cubone-walked-at'))),
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
    remembers: [{ id: 'dog', when: [is('dog-station-sat')], notice: '*In the corner of its drawing, a second small figure, sitting. Waiting for someone. It doesn\'t explain.*' }],
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
    ch('Walk among them.', fight('A ghost drifts into your path and stays there, looking. It won\'t raise a hand to you.', inside(eitherWay({ ...wild({ types: ['ghost'], lv: -1, win: onward(scene('gn-22-stones-rest')) }), rule: { foeStands: 99 } })))),
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
  ], {}, { beside: true })))]),
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
    ch('Stay here, if you like.', out('It sits down by the mound. When you look back from the road, it raises its club. Goodbye, or come back.', gn('ofSpecial', { key: 'cubone' }), ...DONE22)),
  ]),
  // ---- Fainted: once more, the next region, more wary ----
  gev('gn-22-wary', 'The Lonely Cubone', bone({ stop: 'event', rarity: 'rare', callback: true, minStage: 2, requires: [is('cubone-fainted'), regionChanged('cubone-ran-at'), not('cubone-done'), not('cubone-wary')] }), say(
    'A Cubone, alone, under a tree. Your Cubone. It knows you. It shifts away anyway.',
    'It\'s more careful now.',
  ), [
    ch('Leave something at its feet.', out('You put a Berry down. It looks at it. It doesn\'t take it. Not yet.', scene('gn-22-wary-2'))),
    ch('Walk away.', out('It watches you go.', flag('cubone-wary'), flag('cubone-gone'), gn('ofSpecial', { key: 'cubone' }))),
  ]),
  broom('gn-22-wary-2', 'The Lonely Cubone', {}, say('The Berry is still there. So is the Cubone. So are you.'), [
    ch('Leave another.', out(say('You put a second Berry beside the first.', 'It looks for a long time. Then it picks up both.'), flag('cubone-wary'), ...ENTER)),
    ch('Walk away.', out('It watches you go.', flag('cubone-wary'), flag('cubone-gone'), gn('ofSpecial', { key: 'cubone' }))),
  ]),
  // ---- Afterstory: the graveyard ----
  gev('gn-22-graveyard', 'A Graveyard', bone({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('cubone-joined'), { kind: 'gn', test: 'hasMark', key: 'cubone-friend' }, regionChanged('cubone-at'), notThisRegion('cubone-graveyard-at')] }), say(
    'A graveyard by the road. Your Cubone stops at the gate, and doesn\'t move.',
  ), [
    ch('Wait for it.', out('You wait. It walks among the stones a while, touching some of them. Then it comes back. Waiting cost you nothing.', stampRegion('cubone-graveyard-at'))),
    ch('Walk on.', out('After a moment, it catches you up.', stampRegion('cubone-graveyard-at'))),
  ]),
];

// =====================================================================================================================
// gn.23  THE MAGIKARP THAT COULD  (Region-wide: an optional salesman, five appearances and the falls, each must-see after a battle;
// once a run). The same notched Magikarp every time; the salesman's one (mark `karp-notch`) jumps from your party.
// =====================================================================================================================
const KARP_TINT = '#5a86b0';
const karp = (o: Json = {}): Json => ({ tint: KARP_TINT, tags: ['Pokémon', 'Story'], effect: 'none', pokemon: 'magikarp', ...o });
const kroom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, karp(o), intro, choices);
const ENC = 'karp-encouraged';
const OWN: Json = { id: 'own', when: [is('karp-bought'), { kind: 'gn', test: 'hasMark', key: 'karp-notch' }], notice: '*Your own Magikarp flops out of its Ball and toward the water. Nobody asked it to.*' };
const SALESMAN = say(
  '*A Magikarp on a cushion.* **"Only ₽500! It\'s a secret kind!"**',
  '**You:** "It\'s a Magikarp."',
  '**Mr. Pettigrew, after a long pause:** "...It is a Magikarp. It\'s a good one. It tries very hard. I\'m tired of lying about it."',
  '*It\'s level 10, it knows Bounce, and it already likes people. It\'s worth about ₽200. He says so.*',
);
const BOUGHT = (price: number, ...extra: Json[]): Json[] => [$(-price), { ...join({ species: ['magikarp'] }), level: 10, moves: ['bounce'], friendship: 30, mark: 'karp-notch' }, flag('karp-bought'), ...extra];
const SALESMAN_CHOICES: Json[] = [
  ch('Buy it (₽500).', out('He\'s so surprised he throws in a Mystic Water. **Mr. Pettigrew:** "Nobody ever just... buys it."', ...BOUGHT(500, item('mystic-water'))), { requires: [money(500)] }),
  ch('Offer ₽200.', out('**"Fair. That\'s fair."** He takes it, and looks lighter for it.', ...BOUGHT(200)), { requires: [money(200)] }),
  ch('No.', out('He nods. The Magikarp flops in a way that may be a wave.')),
];
/** One appearance: what it does this time, who is on the bank, and the four choices. */
/** "Level: 4 levels higher at each appearance": its level is stamped at the first appearance and grows by four at each later one. */
const GROWN = (n: number): Json[] => (n === 1 ? [stampRegion('karp-at'), gn('stampLevel', { key: 'karp-level' })] : [flag('karp-level', 4)]);
/** It joins at the level it has reached (never past the level cap). */
const AT_ITS_LEVEL: Json = gn('raiseMarked', { key: 'karp-notch', type: 'karp-level' });
const appearance = (n: number, name: string, falls: string, tries: string, bank: string, extra: Json = {}): Json => gev(`gn-23-a${n}`, name, karp({
  stop: 'event', rarity: 'rare',
  requires: n === 1 ? [not('karp-1')] : [is(`karp-${n - 1}`), not(`karp-${n}`), { kind: 'gn', test: 'thisRegion', key: 'karp-at' }],
  remembers: [OWN, ...((extra.remembers as Json[]) ?? [])],
}), say(falls, tries, bank), [
  ch('Go on! You can do it!', out('It jumps again at once. A little higher than the first try.', flag(ENC), flag(`karp-${n}`), ...GROWN(n))),
  ch('Give it something.', out('You look for something to give it.', flag(`karp-${n}`), ...GROWN(n), scene('gn-23-give'))),
  ch('Race it up the bank.', out('You beat it to the top rock by a fin. It doesn\'t care. It splashes you, delighted.', flag(ENC), flag('karp-raced'), flag(`karp-${n}`), ...GROWN(n)), {
    prompt: { id: 'bank-race', needs: 'ok' },
    fail: out('It beats you to the top rock. It splashes you, delighted, and does it again.', flag(ENC), flag('karp-raced'), flag(`karp-${n}`), ...GROWN(n)),
  }),
  ch('Walk on.', out('It watches you go. It jumps anyway.', flag('karp-ignored'), flag(`karp-${n}`), ...GROWN(n))),
]);
const LENT_BACK = gn('returnLent', { key: 'karp' });
const gyarados = (extra: Json = {}): Json[] => [
  when('karp-raced', { min: 3 }, [{ ...join({ species: ['gyarados'] }), ability: 'impossible-leap', boost: { stat: 'spe', percent: 5 }, mark: 'karp-notch', ...extra }], 'It learned to be quick from you: Speed +1, for good.'),
  when('karp-raced', { min: 0, max: 2 }, [{ ...join({ species: ['gyarados'] }), ability: 'impossible-leap', mark: 'karp-notch', ...extra }]),
];

const gn23: Json[] = [
  gev('gn-23-salesman', 'The Honest Salesman', karp({ stop: 'event', rarity: 'uncommon', cast: ['trainer.gentleman'], requires: [not('karp-1'), not('karp-bought')] }), SALESMAN, SALESMAN_CHOICES),
  appearance(1, 'The Magikarp That Could', 'A waterfall, far off. You can only just hear it.', 'A Magikarp in the river jumps at nothing. It barely clears the water. It lands on its side.',
    '**A fisher, on the bank:** "That one? Been at it all spring. Daft fish."'),
  appearance(2, 'The Magikarp That Could', 'The waterfall is closer. A notch in a tail fin flashes as something jumps. *That notch. It\'s the same one.*',
    'It reaches the lower rocks. It hangs there a second, gasping, and slides back.', 'The fisher is back on the bank, pretending to watch his float.'),
  appearance(3, 'The Magikarp That Could', 'You can feel the waterfall now, a cold mist on your face.',
    'Halfway. It gets halfway. And it falls a long way. It lies in the pool, not moving. Then it moves.', '**The same fisher:** "...It got halfway. I\'ve stopped fishing this bit."'),
  appearance(4, 'The Magikarp That Could', 'The waterfall fills half the sky. The noise is all there is.',
    'It touches the lip of the falls. It *touches* it. Its fin slips.', 'The fisher has brought a friend. Neither of them says anything when it slips.'),
  appearance(5, 'The Magikarp That Could', 'The foot of the falls. Spray everywhere. Rainbows in it.',
    'It makes the jump. It\'s up. It\'s at the top. It\'s still only a Magikarp. It looks down at you, and it can\'t believe it either.',
    'The fisher, three children and a dog are on the bank. Nobody says anything. One of the children is holding their breath.',
    { remembers: [{ id: 'league', when: [is('little-league-coached')], notice: '*The children on the bank are your Little League team. One of them is mouthing: "losing\'s how you learn."*' }] }),
  kroom('gn-23-give', 'The Magikarp That Could', {}, say('It watches your hands. It knows what giving looks like.'), [
    ch('A Berry.', out('It eats it on the spot, in one gulp, and jumps again at once.', gn('payBerry'), flag(ENC), flag('karp-item-berry')), { requires: [{ kind: 'gn', test: 'holdsBerry' }] }),
    ch('Something to carry.', out('It takes it in its mouth, very carefully, and keeps it. It will carry it for the rest of the region.', gn('lendHeld', { key: 'karp' }), flag(ENC), flag('karp-item-held')), { requires: [{ kind: 'gn', test: 'holdsItem' }] }),
    ch('Nothing after all.', out('It jumps anyway.')),
  ]),
  // ---- The falls (S8) ----
  gev('gn-23-falls', 'The Falls', karp({ stop: 'event', rarity: 'rare', pokemon: 'gyarados', requires: [is('karp-5'), not('karp-falls'), { kind: 'gn', test: 'thisRegion', key: 'karp-at' }] }), say(
    'The falls. The whole bank is there: the fisher, the children, the dog, people you have never seen.',
    'Up at the top, a Magikarp with a notch in its tail fin is looking down.',
  ), [ch('Watch.', out('Everyone holds their breath.', flag('karp-falls'), flag('karp-level', 4), LENT_BACK,
    gn('check', { key: 'karp-in-party', if: [{ kind: 'gn', test: 'hasMark', key: 'karp-notch' }] }),
    when('karp-in-party', { min: 1 }, [scene('gn-23-party')]),
    when('karp-in-party', { min: 0, max: 0 }, [
      when(ENC, { min: 3 }, [scene('gn-23-rise')]),
      when(ENC, { min: 1, max: 2 }, [scene('gn-23-top')]),
      when(ENC, { min: 0, max: 0 }, [roll('karp-evolved', 50), when('karp-evolved', { min: 1 }, [scene('gn-23-hostile')]), when('karp-evolved', { min: 0, max: 0 }, [scene('gn-23-still')])]),
    ]),
  ))]),
  kroom('gn-23-party', 'The Falls', { pokemon: 'gyarados', cast: ['trainer.gentleman'] }, say(
    'It was in your party all along. Your Magikarp, the notched one, the one from the cushion.',
    'It goes up the falls with everyone on the bank cheering. The water goes white.',
    'It evolves there, in your own team. Something very long looks down at you, with a notch in its tail.',
    'Mr. Pettigrew is on the bank. He is weeping, and he doesn\'t care who sees.',
  ), [ch('Welcome it back.', out('It lowers its great head to your hand.', { kind: 'formChange', from: 'magikarp', to: 'gyarados', mark: 'karp-notch', ability: 'impossible-leap' },
    when('karp-raced', { min: 3 }, [{ kind: 'statBoost', stat: 'spe', percent: 5, who: { species: ['gyarados'] }, until: 'run' }], 'It learned to be quick from you: Speed +1, for good.'),
    AT_ITS_LEVEL, setTo('karp-end', 4), flag('karp-pettigrew-saw'), moment('Your Magikarp cleared the falls, and Mr. Pettigrew wept on the bank.', 95)))]),
  kroom('gn-23-rise', 'The Falls', { pokemon: 'gyarados' }, say(
    'It clears the falls.',
    '*The water goes white. Something very long comes up out of it, and looks down, and it\'s got a notch in its tail.*',
    'The whole bank roars.',
  ), [
    ch('Hold out your hand.', out('It lowers its head to your hand.', ...gyarados(), AT_ITS_LEVEL, setTo('karp-end', 1), moment('The notched Magikarp cleared the falls, and chose you.', 90))),
    ch('Let it go free.', out('It roars once, at the sky, and is gone upriver. The children talk about nothing else.', setTo('karp-end', 1))),
  ]),
  kroom('gn-23-top', 'The Falls', {}, say(
    'It clears the falls. It\'s a Magikarp at the top.',
    'It looks at you, and waits to see whether you\'re coming.',
  ), [
    ch('Climb up to it.', out('You climb the wet rocks to the top. It\'s still there when you get there.', { ...join({ species: ['magikarp'] }), asIs: true, mark: 'karp-notch' }, AT_ITS_LEVEL, setTo('karp-end', 3))),
    ch('Wave.', out('It flops, once. It may be a wave. Then it\'s gone upriver.', setTo('karp-end', 3))),
  ]),
  kroom('gn-23-hostile', 'The Falls', { pokemon: 'gyarados' }, say(
    'It evolves anyway, at the top, with nobody watching but you.',
    'It\'s hostile. It looks straight at you. It remembers your face.',
  ), [
    ch('Challenge it.', fight('It comes down the falls at you.', { ...wild({ species: ['gyarados'], lv: 2, win: [{ ...join({ species: ['gyarados'] }), ability: 'impossible-leap', mark: 'karp-notch' }, setTo('karp-end', 2)] }), exact: true, caught: [setTo('karp-end', 2)], friendly: true, lose: [setTo('karp-end', 2)] })),
    ch('Back away.', out('It watches you all the way to the road.', setTo('karp-end', 2))),
  ]),
  kroom('gn-23-still', 'The Falls', {}, say(
    'It\'s still jumping. It\'ll be jumping for a long time yet.',
    'It doesn\'t look at you at all.',
  ), [ch('Walk on.', out('Behind you, the splash, and the splash, and the splash.', setTo('karp-end', 5)))]),
  // ---- Afterstory ----
  gev('gn-23-fisher', 'The Fisher\'s Tale', karp({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('karp-falls'), regionChanged('karp-at'), not('karp-fisher')] }), say(
    'A fisher in a bar, a long way from that river, holding court.',
    '**Fisher:** "...trained it myself, I did. Every morning. Daft fish, but it listened to me."',
    'It\'s the fisher. He\'s telling it wrong.',
  ), [
    ch('Let him tell it.', out('You let him. It\'s a good story his way too.', flag('karp-fisher'))),
    ch('That\'s not how it went.', out('He looks at you for a long moment. **Fisher:** "...No. No, it isn\'t." He buys you a drink.', flag('karp-fisher'))),
  ]),
];
// =====================================================================================================================
// gn.24  THE FORGOTTEN PARTNER  (single, step 13 must-see before the battle until towns exist; A8; no battle; once a run).
// The partner is your longest-owned wild-caught Pokémon (gn op `partner` marks it `old-partner`); {petname} / {partner} in the
// text are its old name and species. Up to three visits make peace.
// =====================================================================================================================
const PARTNER_TINT = '#9a7b5f';
const pal = (o: Json = {}): Json => ({ tint: PARTNER_TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', ...o });
const proom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, pal(o), intro, choices);
const PARTNER = 'old-partner';
const hasPartner: Json = { kind: 'gn', test: 'hasMark', key: PARTNER };
/** What Rosabel gives back: a move it used to know, and Two Trainers at high Bond. */
const REMEMBERED: Json[] = [
  when('partner-bond', { min: 4 }, [{ kind: 'teachMove', move: 'two-trainers', mark: PARTNER }], 'Something the two of them used to do together comes back to it: Two Trainers.'),
  gn('oldMove', { key: PARTNER }),
  flag('partner-done'),
];
const VISIT_ON = (n: number): Json => ch("We'll come back.", out('Rosabel nods. **Rosabel:** "I\'ll be here. I\'m always here."', setTo('partner-visits', n + 1), stampStage('partner-visit-at')));
const visitReq = (n: number): Json[] => [is('partner-visits', n, n), { kind: 'gn', test: 'thisRegion', key: 'partner-at' }, { kind: 'gn', test: 'laterStage', key: 'partner-visit-at' }, hasPartner, not('partner-done')];
const ASKED_ALL: Json[] = [gn('check', { key: 'partner-asked-all', if: [is('partner-q1'), is('partner-q2'), is('partner-q3')] }), when('partner-asked-all', { min: 1 }, [scene('gn-24-choose')]), when('partner-asked-all', { min: 0, max: 0 }, [scene('gn-24-ask')])];

const gn24: Json[] = [
  gev('gn-24-bench', 'The Forgotten Partner', pal({ stop: 'event', rarity: 'rare', requires: [{ kind: 'gn', test: 'oldCatch' }, not('partner-met')] }), say(
    '*An old trainer on a bench drops their walking stick.*',
    '**Rosabel Verey:** "...{petname}? No. It can\'t. {petname}?"',
    '*Your {partner} has stopped walking.*',
  ), [ch('Wait.', out('Rosabel picks up the stick, and doesn\'t lean on it. Rosabel can\'t stop looking.',
    gn('partner', { key: PARTNER }), flag('partner-met'), stampRegion('partner-at'),
    when('partner-story', { min: 1, max: 1 }, [], '**Rosabel:** "I got ill. Couldn\'t keep up. I let it go where there was good grass. I thought that was kind."'),
    when('partner-story', { min: 2, max: 2 }, [], '**Rosabel:** "We lost. A lot. I said things. I opened the Ball in a field and I walked off, before I could change my mind."'),
    when('partner-story', { min: 3, max: 3 }, [], '**Rosabel:** "It ran. In a storm. I looked for a month. I\'ve always thought it ran *from* me."'),
    roll('partner-flinch', 10),
    when('partner-flinch', { min: 1 }, [], '*It flinches.*'),
    when('partner-flinch', { min: 0, max: 0 }, [
      when('partner-bond', { min: 4 }, [], '*It greets Rosabel warmly: a nuzzle, a cry. Then it comes back to your side, and sits.*'),
      when('partner-bond', { min: 2, max: 3 }, [], '*It goes to Rosabel slowly. It lets Rosabel touch its head. It looks back at you.*'),
      when('partner-bond', { min: 0, max: 1 }, [], '*It goes to Rosabel, and stays there a while.*'),
    ]),
    scene('gn-24-choose'),
  ))]),
  proom('gn-24-choose', 'The Forgotten Partner', {
    remembers: [
      { id: 'third', when: [is('partner-was-ball')], notice: '*Rosabel isn\'t the child from the tape. This is somebody from before even that. It has had three trainers.*' },
      { id: 'home', when: [is('starter-home')], notice: '*You have let a Pokémon visit home before. You know how long it takes. It doesn\'t take long.*' },
    ],
  }, say(
    'Rosabel is looking at it the way you look at the last page of a book.',
    '*If you let it decide, it might not choose you.*',
  ), [
    ch('Let them have some time.', out(say(
      'They sit on the bench together. You walk on a little way, and come back later.',
      'Rosabel is asleep. It is keeping watch.',
    ), flag('partner-time'), bondUp(1, 'firstCatch'), when('starter-home', { min: 0, max: 0 }, [takeNode(1)]), ...REMEMBERED)),
    ch('No. Come on.', out('It follows you. It looks back twice.', flag('partner-refused'), flag('partner-done'))),
    ch('Can I ask you something?', out('**Rosabel:** "Anything. Ask anything."', flag('partner-asked'), scene('gn-24-ask'))),
    ch('Let it decide.', out('You step back. You leave it room.', flag('partner-decided'),
      when('partner-bond', { min: 0, max: 1 }, [scene('gn-24-home')]),
      when('partner-bond', { min: 2 }, [...REMEMBERED], 'It looks at the bench. It looks at you. It comes back to you, and sits down on your foot.'))),
  ]),
  proom('gn-24-ask', 'The Forgotten Partner: Questions', {}, say('Rosabel waits. It waits too, ears turned towards you both.'), [
    chIf([not('partner-q1')], 'How long were you together?', out(say('**Rosabel:** "Two years. Good ones."', '*It turns its head away. Two years was most of its life.*'), flag('partner-q1'), ...ASKED_ALL)),
    chIf([not('partner-q2')], 'Did you say goodbye?', out(say('**Rosabel:** "Of course I did."', '*It looks at the ground. It doesn\'t remember a goodbye.*'), flag('partner-q2'), ...ASKED_ALL)),
    chIf([not('partner-q3')], 'Did you ever go back?', out(say('**Rosabel:** "...Once. It wasn\'t there."', '*It lifts its head, sharply. It was there. It waited. It can\'t have been far.*'), flag('partner-q3'), ...ASKED_ALL)),
    VISIT_ON(0),
  ]),
  proom('gn-24-home', 'The Forgotten Partner: Home', {}, say(
    '*It looks at you. It looks at the bench.*',
    '*It goes home.*',
    'Rosabel lifts a small one out of a basket by the bench.',
    '**Rosabel:** "It\'s a good one. It hasn\'t got a name yet. I was waiting. I didn\'t know what for."',
  ), [ch('Take the little one.', out('It settles into your arms as if it knew it would. Behind you, on the bench, two old friends sit very close.',
    gn('castBase', { key: 'partner-young', type: PARTNER }), gn('dropMarked', { key: PARTNER }), join({ species: ['@partner-young'] }), flag('partner-went-home'), flag('partner-done'),
    moment('You let your oldest friend choose, and it went home.', 90)))]),
  gev('gn-24-visit1', 'The Bench', pal({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: visitReq(1) }), say(
    'The bench again. Rosabel is there.',
    'They sit at opposite ends of it, not looking at each other. Neither moves away.',
  ), [VISIT_ON(1), ch('Leave it here.', out('You go. It follows, slower than usual.', flag('partner-done')))]),
  gev('gn-24-visit2', 'The Bench', pal({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: visitReq(2) }), say(
    'Rosabel has brought the food it used to like. It remembers the food.',
    'It eats from Rosabel\'s hand.',
  ), [VISIT_ON(2), ch('Leave it here.', out('You go. It follows, licking its mouth.', flag('partner-done')))]),
  gev('gn-24-visit3', 'The Bench', pal({
    stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: visitReq(3),
    remembers: [
      { id: 'a', when: [is('partner-story', 1, 1)], notice: '**Rosabel:** "I should\'ve kept you."' },
      { id: 'b', when: [is('partner-story', 2, 2)], notice: '**Rosabel:** "I\'m sorry I shouted."' },
      { id: 'c', when: [is('partner-story', 3, 3)], notice: '**Rosabel:** "I never stopped looking."' },
    ],
  }), say(
    'The third visit. Rosabel says the thing they didn\'t say then.',
    'It leans against Rosabel. Then it gets up, and comes to you, and looks back. And it\'s all right.',
  ), [ch('Thank you, Rosabel.', out('Rosabel shows it something it used to know, and it remembers.', flag('partner-peace'), ...REMEMBERED, moment('Your oldest friend made peace with the trainer who lost it.', 85)))]),
];

// =====================================================================================================================
// gn.25  THE UNLIKELY FRIENDSHIP  (single, step 7, optional, before the battle; A5; once a run). The node's wild battle becomes
// the pack fight: six Mightyena in one double battle with both of the pair on your side (the engine has two places a side, so
// the Zangoose stands beside you and the Seviper waits right behind it; rule `truce`). New paired ability Truce.
// =====================================================================================================================
const TRUCE_TINT = '#7a6b8f';
const tru = (o: Json = {}): Json => ({ tint: TRUCE_TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', pokemon: 'zangoose', ...o });
const troom = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, tru(o), intro, choices);
const TRUCE_GUEST = 'truce-guest';
const GUEST_GOES: Json = gn('dropMarked', { key: TRUCE_GUEST });
/**
 * The pack fight: one double battle, six Mightyena, with both of the pair on your side. The Zangoose stands beside you (the fight's
 * ally); the Seviper is right behind it, in your party for this fight (mark `truce-guest`). Rule `truce`: they cover each other.
 */
const PACK: Json = { ...trainer('The Pack', { size: 6, team: ['mightyena', 'mightyena', 'mightyena', 'mightyena', 'mightyena', 'mightyena'], format: 'doubles', ally: 'zangoose', lv: 0, friendly: true, win: [GUEST_GOES, scene('gn-25-after')], lose: [GUEST_GOES, flag('truce-pack-lost'), scene('gn-25-after')] }), rule: { gn: 'truce' } };
const SEVIPER_IN: Json[] = [{ ...join({ species: ['seviper'] }), asIs: true, direct: true }, gn('markLast', { key: TRUCE_GUEST, species: ['seviper'] })];
const truceJoin = (species: string): Json => ({ ...join({ species: [species] }), ability: 'truce' });
const OTHER: Json[] = [when('truce-one', { min: 1, max: 1 }, [truceJoin('seviper')]), when('truce-one', { min: 2, max: 2 }, [truceJoin('zangoose')])];
const sightReq = (n: number): Json[] => [is('truce-one'), is('truce-sight', n - 1, n - 1), { kind: 'gn', test: 'laterStage', key: n === 1 ? 'truce-at' : `truce-sight${n - 1}-at` }];

const gn25: Json[] = [
  gev('gn-25-heap', 'The Unlikely Friendship', tru({
    stop: 'event', rarity: 'rare', types: ['normal', 'poison'], requires: [not('truce-met')],
    remembers: [{ id: 'border', when: [is('border-united')], notice: '*You settled the border by uniting both sides. Somehow they know. They open their eyes, and they aren\'t afraid of you.*' }],
  }), say(
    '*A Zangoose and a Seviper, asleep in a heap. Its tail is across its neck. Its paw is on its coils.*',
    '*Every book says these two fight on sight.*',
  ), [
    ch('Watch.', out(say(
      'They wake. The Zangoose splits a Berry in two with one claw. It gives the Seviper the bigger half, and then looks as if it regrets it.',
      'They set off. They squabble over who walks in front. The Seviper wins by being longer.',
      'A branch cracks. Each puts itself between the other and the sound, and they collide.',
    ), flag('truce-met'), flag('truce-watched'), { kind: 'nodeBattle', skip: true }, scene('gn-25-pack'))),
    // Border Dispute settled by uniting both sides (NE73): they take to you at once, so "Step closer." isn't needed.
    chIf([not('border-united')], 'Step closer.', out('Two heads come up at once. They look at you, then at each other, and close ranks: the snake in front, the claws behind.', flag('truce-met'), { kind: 'nodeBattle', skip: true }, scene('gn-25-pack'))),
    ch('Back away quietly.', out('You back away. Neither of them wakes. You leave them to it.', flag('truce-met'))),
  ]),
  troom('gn-25-pack', 'The Unlikely Friendship: The Pack', { pokemon: 'mightyena' }, say(
    '*A pack comes out of the grass. Mightyena, six, and they\'ve done this before.*',
    'The Zangoose and the Seviper are already back to back. There\'s room beside them. Just.',
    '*When one of them is hit hard, the other goes straight for whatever did it. When one is nearly down, the other stands in front.*',
  ), [ch('Fight beside them.', fight('The pack comes in low, two at a time. The Zangoose takes the place beside you. The Seviper is right behind it.', PACK, ...SEVIPER_IN))]),
  troom('gn-25-after', 'The Unlikely Friendship', {}, say(
    'The grass goes still.',
    'They check each other for injuries before they look at you.',
  ), [
    ch('Come with me.', out('You crouch, and hold out your hand. Both of them look at it. Only one of them can take it first.', scene('gn-25-which'))),
    ch('Both of you.', out(say('They try to get into the same Ball, if you let them. They don\'t fit.', 'They take two.'), truceJoin('zangoose'), truceJoin('seviper'), flag('truce-both'), stampRegion('truce-region'))),
    ch('Stay together. Good luck.', out(say('They go. The Zangoose looks back, and lifts a paw.', 'On the path where they slept: a Rare Berry, split neatly in two.'), any('liechi-berry', 'ganlon-berry', 'salac-berry', 'petaya-berry', 'apicot-berry'), flag('truce-left'), stampRegion('truce-region'))),
  ]),
  troom('gn-25-which', 'The Unlikely Friendship', {}, say('Which one?'), [
    ch('The Zangoose.', out('It comes. It looks back.', truceJoin('zangoose'), setTo('truce-one', 1), stampStage('truce-at'), stampRegion('truce-region'))),
    ch('The Seviper.', out('It comes. It looks back.', truceJoin('seviper'), setTo('truce-one', 2), stampStage('truce-at'), stampRegion('truce-region'))),
  ]),
  // ---- The sightings (one was recruited) ----
  gev('gn-25-sight1', 'A Shape on a Ridge', tru({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: sightReq(1) }), say(
    'A shape on a ridge, against the sky.',
    'The one you recruited stops dead, and stares.',
  ), [ch('Keep going.', out('When you look again, the ridge is empty.', setTo('truce-sight', 1), stampStage('truce-sight1-at')))]),
  gev('gn-25-sight2', 'Closer', tru({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: sightReq(2) }), say(
    'Closer, this time. At the edge of the trees.',
    'It\'s thin. It\'s been following you.',
  ), [ch('Keep going.', out('It keeps its distance. It doesn\'t stop following.', setTo('truce-sight', 2), stampStage('truce-sight2-at')))]),
  gev('gn-25-sight3', 'The Edge of the Firelight', tru({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: sightReq(3) }), say(
    'You make camp. It\'s at the edge of the firelight.',
    'The one you recruited is sitting up, very straight, not looking at it. Trying very hard not to look at it.',
  ), [
    ch('Come in.', out('It comes in. It lies down beside the other one as if it had never been anywhere else.', ...OTHER, setTo('truce-sight', 3), flag('truce-reunited'))),
    ch('Go home.', out('It doesn\'t go home. It comes in anyway, and lies down beside the other one, and that\'s that.', ...OTHER, setTo('truce-sight', 3), flag('truce-reunited'))),
  ]),
  gev('gn-25-kits', 'A Ditch', tru({ stop: 'event', rarity: 'uncommon', callback: true, minStage: 2, requires: [is('truce-met'), regionChanged('truce-region'), not('truce-kits')] }), say(
    'In a ditch by the road, a Zangoose kit and a small Seviper are playing.',
    'Nobody has told them yet.',
  ), [ch('Don\'t tell them.', out('You walk on quietly, and let them play.', flag('truce-kits')))]),
];

const KANTO_KARP: Json = { ...gev('cs-kanto-pewter-magikarp', 'Magikarp Salesman', karp({ stop: 'event', rarity: 'common', cast: ['trainer.gentleman'], requires: [not('karp-1'), not('karp-bought')] }), SALESMAN, SALESMAN_CHOICES), canon: 'cs.kanto.pewter.magikarp' };

export const EVENTS: Json[] = [...gn21, ...gn22, ...gn23, KANTO_KARP, ...gn24, ...gn25];

export const REMOVE: string[] = [];

const BEAT: Placement = { gn: 'gn.21', shape: 'Region', earliest: 'A3', sits: 'must-see', tags: ['Region-Wide Story', 'Companion Story'], level: 'A+0', often: 'run', badge: 'own', chain: 'gn.21' };
const BEATS = [
  { beat: 'The disagreement', event: 'gn-21-road', stage: 'S2', home: 6, window: [4, 9] as [number, number] },
  { beat: 'It comes back', event: 'gn-21-back', stage: 'S5', home: 11, window: [9, 14] as [number, number] },
  { beat: 'The stone', event: 'gn-21-stone', stage: 'S8', home: 17, window: [15, 19] as [number, number] },
];

const KARP: Placement = { gn: 'gn.23', shape: 'Region', earliest: 'A1', sits: 'must-see', attaches: 'after', tags: ['Region-Wide Story'], level: 'A+0, four levels higher each time', often: 'run', badge: 'own', chain: 'gn.23' };
const KARP_BEATS = [
  { beat: 'The salesman (optional start)', event: 'gn-23-salesman', stage: 'S1', home: 4, window: [2, 6] as [number, number] },
  { beat: 'Appearance 1', event: 'gn-23-a1', stage: 'S1, S2', home: 8, window: [6, 10] as [number, number] },
  { beat: 'Appearance 2', event: 'gn-23-a2', stage: 'S3', home: 8, window: [6, 10] as [number, number] },
  { beat: 'Appearance 3', event: 'gn-23-a3', stage: 'S4, S5', home: 12, window: [10, 14] as [number, number] },
  { beat: 'Appearance 4', event: 'gn-23-a4', stage: 'S6', home: 12, window: [10, 14] as [number, number] },
  { beat: 'Appearance 5', event: 'gn-23-a5', stage: 'S7', home: 16, window: [14, 18] as [number, number] },
  { beat: 'The falls', event: 'gn-23-falls', stage: 'S8', home: 18, window: [16, 19] as [number, number] },
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
  'gn-23-salesman': { ...KARP, shape: 'Single', sits: 'optional', home: 4, window: [2, 6], stages: [1], beats: KARP_BEATS, note: 'Optional start: the Honest Salesman (SF134.3). In Kanto the canon Magikarp Salesman (cs.kanto.pewter.magikarp) is this scene.' },
  'gn-23-a1': { ...KARP, beat: 1, beats: KARP_BEATS, note: 'Badge: a small fish (notched from the second appearance). Straight after a trainer battle.' },
  'gn-23-a2': { ...KARP, beat: 2, beats: KARP_BEATS },
  'gn-23-a3': { ...KARP, beat: 3, beats: KARP_BEATS },
  'gn-23-a4': { ...KARP, beat: 4, beats: KARP_BEATS },
  'gn-23-a5': { ...KARP, beat: 5, beats: KARP_BEATS },
  'gn-23-falls': { ...KARP, beat: 6, beats: KARP_BEATS },
  'gn-24-bench': {
    gn: 'gn.24', shape: 'Single', earliest: 'A8', home: 13, window: [11, 16], sits: 'must-see', attaches: 'before', tags: ['Interrupting Episode', 'Reunion Episode'], level: 'no battle', often: 'run', badge: 'none',
    note: 'The town, until towns exist: step 13. Needs a wild-caught Pokémon owned at least a region. Three visits are follow-ups on later stages of the region.',
  },
  'gn-25-heap': {
    gn: 'gn.25', shape: 'Single', earliest: 'A5', home: 7, window: [5, 10], sits: 'optional', attaches: 'before', tags: ['Miniature Episode', 'Companion Story'], level: 'A+0', often: 'run', badge: 'own',
    note: 'Badge: two small shapes, back to back. The node\'s wild battle becomes the pack fight.',
  },
};

export const CHAINS: Json[] = [
  { id: 'ps_gn_cubone', name: 'The Lonely Cubone', entry: 'gn-22-door', themeId: 'ground-ghost', tint: BONE_TINT, mood: 'grey woods', start: 'opened' },
];
