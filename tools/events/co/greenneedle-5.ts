// Greenneedle, part 5: gn.21 The Pokémon That Wouldn't Evolve (doc GREENNEEDLE_REWORKED_PLACED_5.md).
// Build: npm run co:build -- greenneedle-5   then   npm run co:gn
import { any, ch, fight, flag, item, join, out, RARE_HELD, trainer, wild, type Json } from '../dsl.ts';
import { bond, chIf, eitherWay, gev, gn, is, moment, not, regionChanged, rm, say, scene, setTo, stampRegion, stampStage, teach, when, type Placement } from './_gn.ts';

export { CATEGORY } from './_gn.ts';

// =====================================================================================================================
// gn.21  THE POKÉMON THAT WOULDN'T EVOLVE  (Region-wide: three must-see beats at S2, S5, S8; once a run).
// The Pokémon is cast once (gn op `cast`): a Pikachu, a Piplup, a Torchic, an Eevee, a Growlithe, or an unevolved Pokémon of
// this region. Fights and joins name it `@wontevolve`. Its move Proof and its ability Unwavering live in canonMoves.json / abilities.json.
// =====================================================================================================================
const STONE_TINT = '#8a8f6a';
const won = (o: Json = {}): Json => ({ tint: STONE_TINT, tags: ['Pokémon', 'Story', 'Relationship'], effect: 'none', cast: ['trainer.youngster_m'], ...o });
const room = (id: string, name: string, o: Json, intro: string, choices: Json[]): Json => rm(id, name, won(o), intro, choices);
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
  room('gn-21-challenge', "The Pokémon That Wouldn't Evolve: The Challenge", {}, say(
    'It wants your strongest Pokémon. One on one. Nobody else.',
    'It isn\'t angry. It wants to prove a point, and this is the only language it has for it.',
  ), [
    ch('Accept.', fight('It fights like something with a great deal to prove. It\'s faster than it should be.', { ...duel({ spe: 1 },
      [gn('hpCap', { n: 30 }), flag(FOUGHT), scene('gn-21-bow')],
      [flag(FOUGHT), scene('gn-21-bow-lost')]) }, SOLO)),
  ]),
  room('gn-21-bow', "The Pokémon That Wouldn't Evolve: The Bow", {}, say(
    'It loses. Narrowly. Your Pokémon is breathing hard, down to its last third.',
    '*It gets up. It isn\'t ashamed. It bows, stiffly, and walks back to Linus.*',
    '**Linus:** "...See? See, that\'s what I mean. It nearly—"',
    'Linus doesn\'t finish.',
  ), [ch('Walk on.', out('Behind you, neither of them says anything. You can feel them not saying it.'))]),
  room('gn-21-bow-lost', "The Pokémon That Wouldn't Evolve: The Bow", {}, say(
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
  room('gn-21-again', 'It Comes Back: Again', { cast: [] }, say('A second challenge. Same rules. It has been practising.'), [
    ch('Go.', fight('It moves first. Then it moves again, before you have finished seeing the first one.', { ...duel({ atk: 2, spe: 2 },
      [flag(FOUGHT), scene('gn-21-again-held')],
      [flag(FOUGHT), scene('gn-21-again-won')]) }, SOLO)),
  ]),
  room('gn-21-again-won', 'It Comes Back: Again', { cast: [] }, say(
    'This time it wins. Narrowly.',
    'It stands there, staring at its own paws, as surprised as anyone. Then it laughs, a small, astonished sound.',
  ), [ch('Clap.', out('It bows to you, properly this time, and runs off up the road to find Linus.'))]),
  room('gn-21-again-held', 'It Comes Back: Again', { cast: [] }, say(
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
  room('gn-21-step', 'The Stone: Between Them', {}, say(
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
  room('gn-21-walks', 'The Stone: It Walks', {}, say(
    'Linus\'s last Pokémon goes down. Linus sits down hard on the road.',
    'It walks away from Linus without looking back. Not once.',
    'It stops beside you, and waits, as if it has always been yours.',
  ), [ch('Take it with you.', out('Linus doesn\'t call after it. You don\'t think Linus can.', JOINS, ...ending(5, flag('wontevolve-linus-gone'), moment('It left its trainer for you, and never looked back.', 85))))]),
  room('gn-21-wait', 'The Stone: Its Own Time', {}, say(
    'Nobody does anything for a long time.',
    'Then Linus puts the stone in its paw, and closes its paw around it, and lets go.',
    '**Linus:** "When you want to. If you want to. Not before."',
  ), [ch('Leave them to it.', out('You leave them sitting together against the wall, the stone between them.', ...ending(3)))]),
  room('gn-21-crisis', 'The Stone: The Crisis', {}, say(
    'Something bursts out of the hedge, wild and frightened, straight at Linus.',
    'Linus throws up both arms. The stone goes flying.',
  ), [
    ch('Get between them.', fight('You get between Linus and the wild Pokémon.', { ...eitherWay(wild({ lv: 0, win: [scene('gn-21-crisis-2')] })), friendly: true, lose: [scene('gn-21-crisis-2')] })),
  ]),
  room('gn-21-crisis-2', 'The Stone: The Crisis', {}, say(
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

export const EVENTS: Json[] = [...gn21];

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
};

export const CHAINS: Json[] = [];
